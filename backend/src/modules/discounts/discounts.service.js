const db = require('../../config/db');
const ApiError = require('../../utils/ApiError');
const { parsePagination, buildMeta } = require('../../utils/pagination');

/**
 * Format discount row to include product_ids array
 */
const formatDiscount = (row, productIds = []) => {
  return {
    ...row,
    product_ids: productIds.map(Number),
  };
};

/**
 * List discounts with search, is_active, scope, state, and pagination
 * state filter: 'active', 'expired', 'exhausted'
 * Ordered by id DESC
 */
const listDiscounts = async (query) => {
  const { page, limit, offset } = parsePagination(query);
  const { search, is_active, scope, state } = query;

  const conditions = [];
  const params = [];

  if (typeof is_active === 'boolean') {
    params.push(is_active);
    conditions.push(`d.is_active = $${params.length}`);
  }

  if (scope) {
    params.push(scope);
    conditions.push(`d.scope = $${params.length}`);
  }

  if (search && search.trim()) {
    params.push(`%${search.trim()}%`);
    conditions.push(`d.name ILIKE $${params.length}`);
  }

  if (state) {
    if (state === 'active') {
      conditions.push(`d.is_active = TRUE AND d.start_date <= CURRENT_DATE AND d.end_date >= CURRENT_DATE AND (d.usage_limit IS NULL OR d.used_count < d.usage_limit)`);
    } else if (state === 'expired') {
      conditions.push(`d.end_date < CURRENT_DATE`);
    } else if (state === 'exhausted') {
      conditions.push(`d.usage_limit IS NOT NULL AND d.used_count >= d.usage_limit`);
    }
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countRes = await db.query(
    `SELECT COUNT(*) AS total FROM discounts d ${whereClause}`,
    params
  );
  const total = parseInt(countRes.rows[0].total, 10);

  const queryParams = [...params, limit, offset];
  const listRes = await db.query(
    `SELECT d.*, 
            COALESCE(
              (SELECT json_agg(dp.product_id ORDER BY dp.product_id) 
               FROM discount_products dp 
               WHERE dp.discount_id = d.id),
              '[]'::json
            ) AS product_ids
     FROM discounts d
     ${whereClause}
     ORDER BY d.id DESC
     LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}`,
    queryParams
  );

  const discounts = listRes.rows.map((row) => ({
    ...row,
    product_ids: (row.product_ids || []).map(Number),
  }));

  const meta = buildMeta(page, limit, total);
  return { discounts, meta };
};

/**
 * Get discount by ID
 */
const getDiscountById = async (id, client) => {
  const res = await db.query('SELECT * FROM discounts WHERE id = $1', [id], client);
  if (res.rows.length === 0) {
    throw new ApiError(404, 'Discount not found');
  }
  const discount = res.rows[0];

  const prodRes = await db.query(
    'SELECT product_id FROM discount_products WHERE discount_id = $1 ORDER BY product_id',
    [id],
    client
  );
  const product_ids = prodRes.rows.map((r) => Number(r.product_id));

  return formatDiscount(discount, product_ids);
};

/**
 * Create discount
 */
const createDiscount = async (data, userId) => {
  const {
    name,
    type,
    value,
    min_purchase = 0,
    min_quantity = 0,
    start_date,
    end_date,
    usage_limit = null,
    scope = 'SUBSCRIPTION',
    is_active = true,
    product_ids = [],
  } = data;

  return db.withTransaction(async (client) => {
    const insertRes = await client.query(
      `INSERT INTO discounts (
        name, type, value, min_purchase, min_quantity,
        start_date, end_date, usage_limit, scope, is_active, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        name,
        type,
        value,
        min_purchase,
        min_quantity,
        start_date,
        end_date,
        usage_limit,
        scope,
        is_active,
        userId || null,
      ]
    );

    const discount = insertRes.rows[0];
    let insertedProductIds = [];

    if (scope === 'PRODUCTS' && product_ids && product_ids.length > 0) {
      // Validate products exist
      const checkRes = await client.query(
        'SELECT id FROM products WHERE id = ANY($1)',
        [product_ids]
      );
      if (checkRes.rows.length !== product_ids.length) {
        throw new ApiError(400, 'One or more product_ids are invalid');
      }

      for (const prodId of product_ids) {
        await client.query(
          'INSERT INTO discount_products (discount_id, product_id) VALUES ($1, $2)',
          [discount.id, prodId]
        );
      }
      insertedProductIds = product_ids;
    }

    return formatDiscount(discount, insertedProductIds);
  });
};

/**
 * Update discount
 */
const updateDiscount = async (id, data) => {
  return db.withTransaction(async (client) => {
    // Lock discount row for update check
    const existingRes = await client.query('SELECT * FROM discounts WHERE id = $1 FOR UPDATE', [id]);
    if (existingRes.rows.length === 0) {
      throw new ApiError(404, 'Discount not found');
    }
    const existing = existingRes.rows[0];

    const name = data.name !== undefined ? data.name : existing.name;
    const type = data.type !== undefined ? data.type : existing.type;
    const value = data.value !== undefined ? data.value : existing.value;
    const min_purchase = data.min_purchase !== undefined ? data.min_purchase : existing.min_purchase;
    const min_quantity = data.min_quantity !== undefined ? data.min_quantity : existing.min_quantity;
    const start_date = data.start_date !== undefined ? data.start_date : existing.start_date;
    const end_date = data.end_date !== undefined ? data.end_date : existing.end_date;
    const usage_limit = data.usage_limit !== undefined ? data.usage_limit : existing.usage_limit;
    const scope = data.scope !== undefined ? data.scope : existing.scope;
    const is_active = data.is_active !== undefined ? data.is_active : existing.is_active;

    // Check percent vs value
    if (type === 'PERCENT' && Number(value) > 100) {
      throw new ApiError(400, 'Value must be <= 100 for PERCENT discount');
    }
    if (end_date < start_date) {
      throw new ApiError(400, 'End date must be greater than or equal to start date');
    }

    // Determine product_ids
    let finalProductIds;
    if (scope === 'PRODUCTS') {
      if (data.product_ids !== undefined) {
        if (!Array.isArray(data.product_ids) || data.product_ids.length === 0) {
          throw new ApiError(400, 'scope=PRODUCTS requires non-empty product_ids');
        }
        finalProductIds = data.product_ids;
      } else {
        // Fetch existing discount_products
        const curProds = await client.query(
          'SELECT product_id FROM discount_products WHERE discount_id = $1',
          [id]
        );
        if (curProds.rows.length === 0) {
          throw new ApiError(400, 'scope=PRODUCTS requires non-empty product_ids');
        }
        finalProductIds = curProds.rows.map((r) => Number(r.product_id));
      }
    } else {
      // scope === 'SUBSCRIPTION' ignores product_ids
      finalProductIds = [];
    }

    const updateRes = await client.query(
      `UPDATE discounts
       SET name = $1, type = $2, value = $3, min_purchase = $4, min_quantity = $5,
           start_date = $6, end_date = $7, usage_limit = $8, scope = $9, is_active = $10,
           updated_at = NOW()
       WHERE id = $11
       RETURNING *`,
      [
        name,
        type,
        value,
        min_purchase,
        min_quantity,
        start_date,
        end_date,
        usage_limit,
        scope,
        is_active,
        id,
      ]
    );

    // Replace discount_products rows
    await client.query('DELETE FROM discount_products WHERE discount_id = $1', [id]);

    if (scope === 'PRODUCTS' && finalProductIds.length > 0) {
      const checkRes = await client.query(
        'SELECT id FROM products WHERE id = ANY($1)',
        [finalProductIds]
      );
      if (checkRes.rows.length !== finalProductIds.length) {
        throw new ApiError(400, 'One or more product_ids are invalid');
      }

      for (const prodId of finalProductIds) {
        await client.query(
          'INSERT INTO discount_products (discount_id, product_id) VALUES ($1, $2)',
          [id, prodId]
        );
      }
    }

    return formatDiscount(updateRes.rows[0], finalProductIds);
  });
};

/**
 * Delete discount
 * DELETE: if used (discount_usages exist) return 409 "Discount already used, deactivate it instead".
 */
const deleteDiscount = async (id) => {
  await getDiscountById(id);

  const usageCheck = await db.query(
    'SELECT 1 FROM discount_usages WHERE discount_id = $1 LIMIT 1',
    [id]
  );

  if (usageCheck.rows.length > 0) {
    throw new ApiError(409, 'Discount already used, deactivate it instead');
  }

  await db.query('DELETE FROM discounts WHERE id = $1', [id]);
  return { message: 'Discount deleted successfully' };
};

/**
 * EXPORTED FUNCTION 1: getApplicableDiscounts(subscription, date, client)
 * subscription = { id, customer_id, subtotal, lines:[{product_id, quantity, amount}] }; date = 'YYYY-MM-DD'
 * Must use the passed client so the lock lasts for BE2's transaction.
 */
const getApplicableDiscounts = async (subscription, date, client) => {
  if (!client) {
    throw new Error('A database client must be provided to getApplicableDiscounts');
  }

  const queryText = `SELECT * FROM discounts 
     WHERE is_active = TRUE 
       AND start_date <= $1 
       AND end_date >= $1 
       AND (usage_limit IS NULL OR used_count < usage_limit)
     ORDER BY id ASC
     FOR UPDATE`;

  console.log(`[Discounts SQL] Executing getApplicableDiscounts: ${queryText} with date=${date}`);

  const discountsRes = await client.query(queryText, [date]);

  const discounts = discountsRes.rows;
  if (discounts.length === 0) {
    return [];
  }

  const discountIds = discounts.map((d) => d.id);

  // Second query to fetch discount_products (FOR UPDATE does not combine with aggregates/subqueries cleanly)
  const prodsRes = await client.query(
    `SELECT discount_id, product_id 
     FROM discount_products 
     WHERE discount_id = ANY($1)
     ORDER BY product_id ASC`,
    [discountIds]
  );

  const prodsByDiscountId = {};
  for (const row of prodsRes.rows) {
    if (!prodsByDiscountId[row.discount_id]) {
      prodsByDiscountId[row.discount_id] = [];
    }
    prodsByDiscountId[row.discount_id].push(Number(row.product_id));
  }

  const lines = subscription.lines || [];
  const totalSubQuantity = lines.reduce((sum, line) => sum + Number(line.quantity || 0), 0);
  const totalSubAmount = Number(subscription.subtotal || 0);

  const applicable = [];

  for (const discount of discounts) {
    const product_ids = prodsByDiscountId[discount.id] || [];
    let eligibleBase = 0;
    let eligibleQuantity = 0;

    if (discount.scope === 'SUBSCRIPTION') {
      eligibleBase = totalSubAmount;
      eligibleQuantity = totalSubQuantity;
    } else if (discount.scope === 'PRODUCTS') {
      const targetProductIds = new Set(product_ids);
      const matchingLines = lines.filter((l) => targetProductIds.has(Number(l.product_id)));

      // skip the discount if none
      if (matchingLines.length === 0) {
        continue;
      }

      eligibleBase = matchingLines.reduce((sum, l) => sum + Number(l.amount || 0), 0);
      eligibleQuantity = matchingLines.reduce((sum, l) => sum + Number(l.quantity || 0), 0);
    }

    // Keep it only if eligible base >= min_purchase and eligible quantity >= min_quantity
    if (
      eligibleBase >= Number(discount.min_purchase) &&
      eligibleQuantity >= Number(discount.min_quantity)
    ) {
      applicable.push({
        ...discount,
        product_ids,
      });
    }
  }

  // Ordered by id
  applicable.sort((a, b) => a.id - b.id);
  return applicable;
};

/**
 * EXPORTED FUNCTION 2: markDiscountUsed(discountId, invoiceId, amount, client)
 * UPDATE discounts SET used_count = used_count + 1, updated_at = NOW() WHERE id=$1 AND (usage_limit IS NULL OR used_count < usage_limit) RETURNING id;
 * if no row, throw ApiError 409; then INSERT INTO discount_usages (discount_id, invoice_id, amount).
 */
const markDiscountUsed = async (discountId, invoiceId, amount, client) => {
  if (!client) {
    throw new Error('A database client must be provided to markDiscountUsed');
  }

  const updateRes = await client.query(
    `UPDATE discounts 
     SET used_count = used_count + 1, updated_at = NOW() 
     WHERE id = $1 AND (usage_limit IS NULL OR used_count < usage_limit) 
     RETURNING id`,
    [discountId]
  );

  if (updateRes.rows.length === 0) {
    throw new ApiError(409, 'Discount limit reached or discount not found');
  }

  await client.query(
    `INSERT INTO discount_usages (discount_id, invoice_id, amount) 
     VALUES ($1, $2, $3)`,
    [discountId, invoiceId, amount]
  );

  return { discountId, invoiceId, amount };
};

module.exports = {
  listDiscounts,
  getDiscountById,
  createDiscount,
  updateDiscount,
  deleteDiscount,
  getApplicableDiscounts,
  markDiscountUsed,
};

