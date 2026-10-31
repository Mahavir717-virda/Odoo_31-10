const bcrypt = require('bcrypt');
const db = require('../src/config/db');

async function seed() {
  console.log('[Seed] Starting database seed...');
  const client = await db.getClient();

  try {
    await client.query('BEGIN');

    console.log('[Seed] Truncating all tables...');
    await client.query(`
      TRUNCATE TABLE
        payments,
        discount_usages,
        invoice_lines,
        invoices,
        subscription_lines,
        subscriptions,
        discount_products,
        discounts,
        quotation_template_lines,
        quotation_templates,
        plans,
        product_variants,
        products,
        taxes,
        users
      RESTART IDENTITY CASCADE;
    `);

    console.log('[Seed] Resetting sequence counters...');
    await client.query("ALTER SEQUENCE subscription_number_seq RESTART WITH 1;");
    await client.query("ALTER SEQUENCE invoice_number_seq RESTART WITH 1;");

    console.log('[Seed] Inserting users...');
    const saltRounds = 10;
    const adminHash = await bcrypt.hash('Admin@1234', saltRounds);
    const staffHash = await bcrypt.hash('Staff@1234', saltRounds);
    const customerHash = await bcrypt.hash('Customer@1234', saltRounds);

    // Admin user
    const adminRes = await client.query(
      `INSERT INTO users (name, email, password_hash, role, is_active)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      ['Admin User', 'admin@brightloop.test', adminHash, 'ADMIN', true]
    );
    const adminId = adminRes.rows[0].id;

    // Staff user
    await client.query(
      `INSERT INTO users (name, email, password_hash, role, is_active)
       VALUES ($1, $2, $3, $4, $5)`,
      ['Staff Member', 'staff@brightloop.test', staffHash, 'STAFF', true]
    );

    // Customer 1
    await client.query(
      `INSERT INTO users (name, email, password_hash, role, company, phone, address, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        'Acme Corp Contact',
        'customer1@acme.test',
        customerHash,
        'CUSTOMER',
        'Acme Corporation',
        '+1-555-0101',
        '100 Acme Way, Metropolis',
        true,
      ]
    );

    // Customer 2
    await client.query(
      `INSERT INTO users (name, email, password_hash, role, company, phone, address, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        'Globex Contact',
        'customer2@globex.test',
        customerHash,
        'CUSTOMER',
        'Globex Inc',
        '+1-555-0102',
        '200 Globex Blvd, Silicon City',
        true,
      ]
    );

    console.log('[Seed] Inserting tax...');
    const taxRes = await client.query(
      `INSERT INTO taxes (name, rate_percent, is_active)
       VALUES ($1, $2, $3) RETURNING id`,
      ['GST 18%', 18.0, true]
    );
    const taxId = taxRes.rows[0].id;

    console.log('[Seed] Inserting products & variants...');
    // 3 products (CRM Suite, Helpdesk Add-on, Analytics Pack) with variants including attribute Brand, value Odoo, extra_price 560
    const productsData = [
      { name: 'CRM Suite', type: 'SERVICE', sales_price: 2500.0, cost_price: 500.0 },
      { name: 'Helpdesk Add-on', type: 'ADDON', sales_price: 1200.0, cost_price: 200.0 },
      { name: 'Analytics Pack', type: 'SERVICE', sales_price: 1800.0, cost_price: 300.0 },
    ];

    const insertedProducts = [];
    const insertedVariants = [];

    for (const p of productsData) {
      const pRes = await client.query(
        `INSERT INTO products (name, type, sales_price, cost_price, tax_id, is_active)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, sales_price`,
        [p.name, p.type, p.sales_price, p.cost_price, taxId, true]
      );
      const prod = pRes.rows[0];
      insertedProducts.push(prod);

      // Add variant with attribute Brand, value Odoo, extra_price 560
      const vRes = await client.query(
        `INSERT INTO product_variants (product_id, attribute, value, extra_price)
         VALUES ($1, $2, $3, $4) RETURNING id, product_id, attribute, value, extra_price`,
        [prod.id, 'Brand', 'Odoo', 560.0]
      );
      insertedVariants.push(vRes.rows[0]);
    }

    console.log('[Seed] Inserting plans...');
    // 2 plans (Monthly Basic, Yearly Pro)
    const plan1Res = await client.query(
      `INSERT INTO plans (name, price, billing_period, min_quantity, start_date, auto_close, closable, pausable, renewable, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
      ['Monthly Basic', 999.0, 'MONTHLY', 1, '2025-01-01', false, true, true, true, 'ACTIVE']
    );
    const planMonthlyId = plan1Res.rows[0].id;

    await client.query(
      `INSERT INTO plans (name, price, billing_period, min_quantity, start_date, auto_close, closable, pausable, renewable, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      ['Yearly Pro', 9999.0, 'YEARLY', 1, '2025-01-01', false, true, true, true, 'ACTIVE']
    );

    console.log('[Seed] Inserting quotation template with 2 lines...');
    // 1 quotation template with 2 lines
    const tplRes = await client.query(
      `INSERT INTO quotation_templates (name, validity_days, plan_id, payment_terms_days, notes, is_active, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      ['Standard SaaS Template', 30, planMonthlyId, 15, 'Standard quote template for SaaS packages', true, adminId]
    );
    const templateId = tplRes.rows[0].id;

    // Line 1: CRM Suite
    await client.query(
      `INSERT INTO quotation_template_lines (template_id, product_id, variant_id, quantity, tax_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [templateId, insertedProducts[0].id, insertedVariants[0].id, 1, taxId]
    );

    // Line 2: Helpdesk Add-on
    await client.query(
      `INSERT INTO quotation_template_lines (template_id, product_id, variant_id, quantity, tax_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [templateId, insertedProducts[1].id, insertedVariants[1].id, 2, taxId]
    );

    await client.query('COMMIT');

    console.log('\n              =====');
    console.log('   SEED COMPLETED SUCCESSFULLY! CREDENTIALS:');
    console.log('              =====');
    console.log('ADMIN:');
    console.log('  Email:    admin@brightloop.test');
    console.log('  Password: Admin@1234');
    console.log('\nSTAFF:');
    console.log('  Email:    staff@brightloop.test');
    console.log('  Password: Staff@1234');
    console.log('\nCUSTOMERS:');
    console.log('  Email:    customer1@acme.test');
    console.log('  Password: Customer@1234');
    console.log('  Company:  Acme Corporation\n');
    console.log('  Email:    customer2@globex.test');
    console.log('  Password: Customer@1234');
    console.log('  Company:  Globex Inc');
    console.log('              =====\n');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[Seed] Error seeding database:', error);
    process.exit(1);
  } finally {
    client.release();
    await db.pool.end();
  }
}

seed();

