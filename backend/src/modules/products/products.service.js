const db = require('../../config/db');
const ApiError = require('../../utils/ApiError');
const { parsePagination, buildMeta } = require('../../utils/pagination');

/**
 * Export getVariantPrice(productId, variantId, client) from products.service
 * returning sales_price + extra_price as a number.
 * - variant must belong to the product.
 * - if variantId is null return sales_price.
 * - throw ApiError 400 if not found or inactive.
 */
const getVariantPrice = async (productId, variantId = null, client = null) => {
  const prodRes = await db.query(
    'SELECT id, sales_price, is_active FROM products WHERE id = $1',
    [productId],
    client
  );

  if (prodRes.rows.length === 0) {
    throw new ApiError(400, `Product with id ${productId} not found`);
  }

  const product = prodRes.rows[0];
  if (!product.is_active) {
    throw new ApiError(400, `Product with id ${productId} is inactive`);
  }

  const baseSalesPrice = Number(product.sales_price);

  if (!variantId) {
    return baseSalesPrice;
  }

  const varRes = await db.query(
    'SELECT id, extra_price FROM product_variants WHERE id = $1 AND product_id = $2',
    [variantId, productId],
    client
  );

  if (varRes.rows.length === 0) {
    throw new ApiError(400, `Variant with id ${variantId} does not belong to product ${productId} or was not found`);
  }

  const variant = varRes.rows[0];
  const extraPrice = Number(variant.extra_price);

  return Number((baseSalesPrice + extraPrice).toFixed(2));
};

/**
 * List products with search, type, is_active, and pagination
 * Ordered by id DESC
 */
const listProducts = async (query) => {
  const { page, limit, offset } = parsePagination(query);
  const { search, type, is_active } = query;

  const conditions = [];
  const params = [];

  if (type) {
    params.push(type);
    conditions.push(`p.type = $${params.length}`);
  }

  if (typeof is_active === 'boolean') {
    params.push(is_active);
    conditions.push(`p.is_active = $${params.length}`);
  }

  if (search && search.trim()) {
    params.push(`%${search.trim()}%`);
    const searchIdx = params.length;
    conditions.push(`(p.name ILIKE $${searchIdx} OR p.notes ILIKE $${searchIdx})`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countRes = await db.query(`SELECT COUNT(*) AS total FROM products p ${whereClause}`, params);
  const total = parseInt(countRes.rows[0].total, 10);

  const queryParams = [...params, limit, offset];
  const listRes = await db.query(
    `SELECT p.*, t.name AS tax_name, t.rate_percent AS tax_rate
     FROM products p
     LEFT JOIN taxes t ON p.tax_id = t.id
     ${whereClause}
     ORDER BY p.id DESC
     LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}`,
    queryParams
  );

  // Fetch variants for these products
  const products = listRes.rows;
  if (products.length > 0) {
    const productIds = products.map((p) => p.id);
    const variantsRes = await db.query(
      `SELECT * FROM product_variants WHERE product_id = ANY($1::int[]) ORDER BY id ASC`,
      [productIds]
    );

    const variantsByProd = {};
    for (const v of variantsRes.rows) {
      if (!variantsByProd[v.product_id]) {
        variantsByProd[v.product_id] = [];
      }
      variantsByProd[v.product_id].push(v);
    }

    products.forEach((p) => {
      p.variants = variantsByProd[p.id] || [];
    });
  }

  const meta = buildMeta(page, limit, total);
  return { products, meta };
};

/**
 * Get product by id with its variants
 */
const getProductById = async (id) => {
  const prodRes = await db.query(
    `SELECT p.*, t.name AS tax_name, t.rate_percent AS tax_rate
     FROM products p
     LEFT JOIN taxes t ON p.tax_id = t.id
     WHERE p.id = $1`,
    [id]
  );

  if (prodRes.rows.length === 0) {
    throw new ApiError(404, 'Product not found');
  }

  const product = prodRes.rows[0];

  const varRes = await db.query(
    `SELECT * FROM product_variants WHERE product_id = $1 ORDER BY id ASC`,
    [id]
  );
  product.variants = varRes.rows;

  return product;
};

/**
 * Create product with nested variants in one transaction
 */
const createProduct = async (data) => {
  return db.withTransaction(async (client) => {
    const { name, type = 'SERVICE', sales_price, cost_price = 0, tax_id = null, notes = null, is_active = true, variants = [] } = data;

    const prodRes = await client.query(
      `INSERT INTO products (name, type, sales_price, cost_price, tax_id, notes, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [name, type, sales_price, cost_price, tax_id, notes, is_active]
    );

    const product = prodRes.rows[0];
    const insertedVariants = [];

    for (const v of variants) {
      const vRes = await client.query(
        `INSERT INTO product_variants (product_id, attribute, value, extra_price)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [product.id, v.attribute, v.value, v.extra_price || 0]
      );
      insertedVariants.push(vRes.rows[0]);
    }

    product.variants = insertedVariants;
    return product;
  });
};

/**
 * Update product with nested variants in one transaction:
 * On PUT: update variants that have an id, insert new ones, delete missing ones;
 * if a variant being deleted is referenced by subscription or template lines, return 409 "Variant is in use".
 */
const updateProduct = async (id, data) => {
  return db.withTransaction(async (client) => {
    // Check product existence
    const existingRes = await client.query('SELECT * FROM products WHERE id = $1', [id]);
    if (existingRes.rows.length === 0) {
      throw new ApiError(404, 'Product not found');
    }

    const currentProd = existingRes.rows[0];

    const updatedName = data.name !== undefined ? data.name : currentProd.name;
    const updatedType = data.type !== undefined ? data.type : currentProd.type;
    const updatedSalesPrice = data.sales_price !== undefined ? data.sales_price : currentProd.sales_price;
    const updatedCostPrice = data.cost_price !== undefined ? data.cost_price : currentProd.cost_price;
    const updatedTaxId = data.tax_id !== undefined ? data.tax_id : currentProd.tax_id;
    const updatedNotes = data.notes !== undefined ? data.notes : currentProd.notes;
    const updatedIsActive = data.is_active !== undefined ? data.is_active : currentProd.is_active;

    await client.query(
      `UPDATE products
       SET name = $1, type = $2, sales_price = $3, cost_price = $4, tax_id = $5, notes = $6, is_active = $7, updated_at = NOW()
       WHERE id = $8`,
      [updatedName, updatedType, updatedSalesPrice, updatedCostPrice, updatedTaxId, updatedNotes, updatedIsActive, id]
    );

    // If variants array is provided, reconcile variants
    if (data.variants !== undefined) {
      const existingVariantsRes = await client.query('SELECT * FROM product_variants WHERE product_id = $1', [id]);
      const existingVariants = existingVariantsRes.rows;

      const incomingIds = data.variants.filter((v) => v.id).map((v) => v.id);

      // Check which existing variants are missing
      const variantsToDelete = existingVariants.filter((ev) => !incomingIds.includes(ev.id));

      for (const vDel of variantsToDelete) {
        // Check if referenced by subscription or template lines
        const subLineRef = await client.query(
          'SELECT 1 FROM subscription_lines WHERE variant_id = $1 LIMIT 1',
          [vDel.id]
        );
        const tplLineRef = await client.query(
          'SELECT 1 FROM quotation_template_lines WHERE variant_id = $1 LIMIT 1',
          [vDel.id]
        );
        const invLineRef = await client.query(
          'SELECT 1 FROM invoice_lines WHERE variant_id = $1 LIMIT 1',
          [vDel.id]
        );

        if (subLineRef.rows.length > 0 || tplLineRef.rows.length > 0 || invLineRef.rows.length > 0) {
          throw new ApiError(409, 'Variant is in use');
        }

        await client.query('DELETE FROM product_variants WHERE id = $1', [vDel.id]);
      }

      // Update or insert incoming variants
      for (const v of data.variants) {
        if (v.id) {
          await client.query(
            `UPDATE product_variants
             SET attribute = $1, value = $2, extra_price = $3
             WHERE id = $4 AND product_id = $5`,
            [v.attribute, v.value, v.extra_price || 0, v.id, id]
          );
        } else {
          await client.query(
            `INSERT INTO product_variants (product_id, attribute, value, extra_price)
             VALUES ($1, $2, $3, $4)`,
            [id, v.attribute, v.value, v.extra_price || 0]
          );
        }
      }
    }

    // Return updated product with variants
    const prodRes = await client.query('SELECT * FROM products WHERE id = $1', [id]);
    const varRes = await client.query('SELECT * FROM product_variants WHERE product_id = $1 ORDER BY id ASC', [id]);
    const product = prodRes.rows[0];
    product.variants = varRes.rows;

    return product;
  });
};

/**
 * DELETE product:
 * If the product is referenced anywhere, set is_active=false instead of deleting.
 */
const deleteProduct = async (id) => {
  return db.withTransaction(async (client) => {
    const prodRes = await client.query('SELECT * FROM products WHERE id = $1', [id]);
    if (prodRes.rows.length === 0) {
      throw new ApiError(404, 'Product not found');
    }

    // Check references in subscription_lines, quotation_template_lines, invoice_lines, discount_products
    const subCheck = await client.query('SELECT 1 FROM subscription_lines WHERE product_id = $1 LIMIT 1', [id]);
    const tplCheck = await client.query('SELECT 1 FROM quotation_template_lines WHERE product_id = $1 LIMIT 1', [id]);
    const invCheck = await client.query('SELECT 1 FROM invoice_lines WHERE product_id = $1 LIMIT 1', [id]);
    const discCheck = await client.query('SELECT 1 FROM discount_products WHERE product_id = $1 LIMIT 1', [id]);

    const isReferenced =
      subCheck.rows.length > 0 ||
      tplCheck.rows.length > 0 ||
      invCheck.rows.length > 0 ||
      discCheck.rows.length > 0;

    if (isReferenced) {
      await client.query('UPDATE products SET is_active = FALSE, updated_at = NOW() WHERE id = $1', [id]);
      return { message: 'Product is referenced by active documents; marked as inactive', deactivated: true };
    } else {
      // Not referenced anywhere, safe to delete (variants cascade delete)
      await client.query('DELETE FROM products WHERE id = $1', [id]);
      return { message: 'Product deleted successfully', deactivated: false };
    }
  });
};

module.exports = {
  getVariantPrice,
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};

