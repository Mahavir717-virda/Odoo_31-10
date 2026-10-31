const http = require('http');

const BASE_URL = 'http://localhost:5000/api';

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL('/api' + path, 'http://localhost:5000');
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (body) headers['Content-Type'] = 'application/json';

    const req = http.request(
      url,
      {
        method,
        headers,
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          let json = null;
          try {
            json = JSON.parse(raw);
          } catch (_) {
            json = raw;
          }
          resolve({ status: res.statusCode, body: json, headers: res.headers });
        });
      }
    );
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

const mismatches = [];
function recordMismatch(screen, endpoint, expected, actual, owner) {
  mismatches.push({ screen, endpoint, expected, actual, owner });
}

async function runVerification() {
  console.log('====================================================');
  console.log('   FE1 INTEGRATION VERIFICATION SUITE');
  console.log('====================================================\n');

  let adminToken = null;
  let staffToken = null;
  let customerToken = null;
  let customerId = null;

  // ----------------------------------------------------
  // 1. AUTHENTICATION & PROFILE FLOWS
  // ----------------------------------------------------
  console.log('--- 1. Authentication & Profile ---');

  // Login Admin
  const adminLogin = await request('POST', '/auth/login', {
    email: 'admin@brightloop.test',
    password: 'Admin@1234',
  });
  if (adminLogin.status === 200 && adminLogin.body?.data?.token) {
    adminToken = adminLogin.body.data.token;
    console.log('  [PASS] Admin login successful (200)');
  } else {
    console.error('  [FAIL] Admin login failed', adminLogin);
    recordMismatch('Login', '/auth/login', '200 OK with token', `${adminLogin.status} ${JSON.stringify(adminLogin.body)}`, 'BE1');
  }

  // Login Staff
  const staffLogin = await request('POST', '/auth/login', {
    email: 'staff@brightloop.test',
    password: 'Staff@1234',
  });
  if (staffLogin.status === 200 && staffLogin.body?.data?.token) {
    staffToken = staffLogin.body.data.token;
    console.log('  [PASS] Staff login successful (200)');
  } else {
    console.error('  [FAIL] Staff login failed', staffLogin);
    recordMismatch('Login', '/auth/login', '200 OK with token', `${staffLogin.status} ${JSON.stringify(staffLogin.body)}`, 'BE1');
  }

  // Case-insensitive email login
  const caseInsensitiveLogin = await request('POST', '/auth/login', {
    email: 'ADMIN@brightloop.test',
    password: 'Admin@1234',
  });
  if (caseInsensitiveLogin.status === 200) {
    console.log('  [PASS] Case-insensitive email login (200)');
  } else {
    console.error('  [FAIL] Case-insensitive email login failed', caseInsensitiveLogin.status);
    recordMismatch('Login', '/auth/login', '200 OK with case-insensitive email', `${caseInsensitiveLogin.status}`, 'BE1');
  }

  // Invalid credentials login
  const invalidLogin = await request('POST', '/auth/login', {
    email: 'admin@brightloop.test',
    password: 'WrongPassword!123',
  });
  if (invalidLogin.status === 401 && invalidLogin.body?.message === 'Invalid email or password') {
    console.log('  [PASS] Invalid credentials returned 401 "Invalid email or password"');
  } else {
    console.log(`  [NOTE] Invalid credentials returned ${invalidLogin.status} (${invalidLogin.body?.message})`);
  }

  // Customer Registration
  const testEmail = `newcustomer_${Date.now()}@brightloop.test`;
  const regRes = await request('POST', '/auth/register', {
    name: 'Integration Test Customer',
    email: testEmail,
    password: 'Customer@1234',
    phone: '+1 555-0199',
    company: 'Test Corp Ltd',
  });
  if (regRes.status === 201 && regRes.body?.data?.token) {
    customerToken = regRes.body.data.token;
    customerId = regRes.body.data.user?.id;
    console.log(`  [PASS] Customer registration successful (201, user id: ${customerId})`);
  } else {
    console.error('  [FAIL] Customer registration failed', regRes);
    recordMismatch('Register', '/auth/register', '201 Created with token and user', `${regRes.status} ${JSON.stringify(regRes.body)}`, 'BE1');
  }

  // Duplicate email registration
  const dupReg = await request('POST', '/auth/register', {
    name: 'Duplicate Customer',
    email: testEmail,
    password: 'Customer@1234',
  });
  if (dupReg.status === 409 && dupReg.body?.errors?.some((e) => e.field === 'email')) {
    console.log('  [PASS] Duplicate email registration rejected with 409 and field: "email"');
  } else {
    console.error('  [FAIL] Duplicate email registration response unexpected', dupReg);
    recordMismatch('Register', '/auth/register', '409 Conflict with field: email', `${dupReg.status} ${JSON.stringify(dupReg.body)}`, 'BE1');
  }

  // Weak password registration
  const weakReg = await request('POST', '/auth/register', {
    name: 'Weak Customer',
    email: `weak_${Date.now()}@brightloop.test`,
    password: 'weak',
  });
  if (weakReg.status === 400) {
    console.log('  [PASS] Weak password registration rejected with 400');
  } else {
    console.error('  [FAIL] Weak password registration unexpected status', weakReg.status);
    recordMismatch('Register', '/auth/register', '400 Bad Request for weak password', `${weakReg.status}`, 'BE1');
  }

  // GET /auth/me for Customer
  const meRes = await request('GET', '/auth/me', null, customerToken);
  if (meRes.status === 200 && meRes.body?.data?.email === testEmail && !meRes.body?.data?.password_hash) {
    console.log('  [PASS] /auth/me returned authenticated customer profile without secrets');
  } else {
    console.error('  [FAIL] /auth/me failed', meRes);
    recordMismatch('Profile', '/auth/me', '200 OK with sanitized user profile', `${meRes.status}`, 'BE1');
  }

  // Forgot Password
  const forgotRes = await request('POST', '/auth/forgot-password', { email: testEmail });
  if (forgotRes.status === 200) {
    console.log('  [PASS] /auth/forgot-password returned 200 OK');
  } else {
    console.error('  [FAIL] /auth/forgot-password failed', forgotRes);
    recordMismatch('ForgotPassword', '/auth/forgot-password', '200 OK', `${forgotRes.status}`, 'BE1');
  }

  // ----------------------------------------------------
  // 2. TAXES CRUD & ROLE ENFORCEMENT
  // ----------------------------------------------------
  console.log('\n--- 2. Taxes CRUD & Permissions ---');
  let createdTaxId = null;

  // Admin create tax
  const taxCreate = await request('POST', '/taxes', {
    name: `Test GST ${Date.now()}`,
    rate_percent: 18.5,
    is_active: true,
  }, adminToken);
  if (taxCreate.status === 201 && taxCreate.body?.data?.id) {
    createdTaxId = taxCreate.body.data.id;
    console.log(`  [PASS] Admin created tax (201, id: ${createdTaxId})`);
  } else {
    console.error('  [FAIL] Admin create tax failed', taxCreate);
    recordMismatch('Taxes', '/taxes', '201 Created', `${taxCreate.status}`, 'BE1');
  }

  // Staff attempt create tax -> 403
  const staffTaxCreate = await request('POST', '/taxes', {
    name: 'Staff Tax',
    rate_percent: 5,
    is_active: true,
  }, staffToken);
  if (staffTaxCreate.status === 403) {
    console.log('  [PASS] Staff create tax forbidden (403)');
  } else {
    console.error('  [FAIL] Staff create tax not forbidden', staffTaxCreate.status);
    recordMismatch('Taxes', '/taxes', '403 Forbidden for Staff', `${staffTaxCreate.status}`, 'BE1');
  }

  // Admin list taxes
  const taxList = await request('GET', '/taxes?page=1&limit=5', null, adminToken);
  if (taxList.status === 200 && Array.isArray(taxList.body?.data) && taxList.body?.meta?.total !== undefined) {
    console.log(`  [PASS] Admin listed taxes with pagination envelope (total: ${taxList.body.meta.total})`);
  } else {
    console.error('  [FAIL] Tax list envelope unexpected', taxList);
    recordMismatch('Taxes', '/taxes', '200 OK with data array and meta envelope', `${taxList.status}`, 'BE1');
  }

  // Admin update tax
  if (createdTaxId) {
    const taxUpdate = await request('PUT', `/taxes/${createdTaxId}`, {
      name: `Updated GST ${Date.now()}`,
      rate_percent: 19.0,
      is_active: true,
    }, adminToken);
    if (taxUpdate.status === 200) {
      console.log('  [PASS] Admin updated tax (200)');
    } else {
      console.error('  [FAIL] Admin update tax failed', taxUpdate.status);
      recordMismatch('Taxes', `/taxes/${createdTaxId}`, '200 OK', `${taxUpdate.status}`, 'BE1');
    }

    // Admin delete tax
    const taxDelete = await request('DELETE', `/taxes/${createdTaxId}`, null, adminToken);
    if (taxDelete.status === 200) {
      console.log('  [PASS] Admin deleted tax (200)');
    } else {
      console.error('  [FAIL] Admin delete tax failed', taxDelete.status);
      recordMismatch('Taxes', `/taxes/${createdTaxId}`, '200 OK', `${taxDelete.status}`, 'BE1');
    }
  }

  // ----------------------------------------------------
  // 3. PRODUCTS WITH VARIANTS CRUD & READ-ONLY BEHAVIOR
  // ----------------------------------------------------
  console.log('\n--- 3. Products with Variants & Staff Read-Only ---');
  let createdProductId = null;

  // Admin creates product with variants
  const prodCreate = await request('POST', '/products', {
    name: `Enterprise Cloud Suite ${Date.now()}`,
    type: 'SERVICE',
    sales_price: 150.0,
    cost_price: 50.0,
    tax_id: null,
    notes: 'Integration test product with variants',
    is_active: true,
    variants: [
      { attribute: 'Tier', value: 'Silver', extra_price: 0 },
      { attribute: 'Tier', value: 'Gold', extra_price: 50 },
    ],
  }, adminToken);

  if (prodCreate.status === 201 && prodCreate.body?.data?.id) {
    createdProductId = prodCreate.body.data.id;
    console.log(`  [PASS] Admin created product with variants (201, id: ${createdProductId}, variants: ${prodCreate.body.data.variants?.length})`);
  } else {
    console.error('  [FAIL] Admin create product failed', prodCreate);
    recordMismatch('Products', '/products', '201 Created with nested variants', `${prodCreate.status}`, 'BE1');
  }

  // Staff reads products -> 200
  const staffProdList = await request('GET', '/products?page=1&limit=5', null, staffToken);
  if (staffProdList.status === 200 && Array.isArray(staffProdList.body?.data)) {
    console.log(`  [PASS] Staff read products list successfully (200, count: ${staffProdList.body.data.length})`);
  } else {
    console.error('  [FAIL] Staff read products list failed', staffProdList.status);
    recordMismatch('Products', '/products', '200 OK for Staff', `${staffProdList.status}`, 'BE1');
  }

  // Staff attempts create product -> 403
  const staffProdCreate = await request('POST', '/products', {
    name: 'Staff Unauthorized Product',
    type: 'SERVICE',
    sales_price: 100,
    cost_price: 50,
  }, staffToken);
  if (staffProdCreate.status === 403) {
    console.log('  [PASS] Staff product creation rejected (403 Forbidden)');
  } else {
    console.error('  [FAIL] Staff product creation not forbidden', staffProdCreate.status);
    recordMismatch('Products', '/products', '403 Forbidden for Staff', `${staffProdCreate.status}`, 'BE1');
  }

  // Staff attempts update product -> 403
  if (createdProductId) {
    const staffProdUpdate = await request('PUT', `/products/${createdProductId}`, {
      name: 'Staff Modified Name',
      sales_price: 999,
    }, staffToken);
    if (staffProdUpdate.status === 403) {
      console.log('  [PASS] Staff product update rejected (403 Forbidden)');
    } else {
      console.error('  [FAIL] Staff product update not forbidden', staffProdUpdate.status);
      recordMismatch('Products', `/products/${createdProductId}`, '403 Forbidden for Staff', `${staffProdUpdate.status}`, 'BE1');
    }

    // Staff attempts delete product -> 403
    const staffProdDelete = await request('DELETE', `/products/${createdProductId}`, null, staffToken);
    if (staffProdDelete.status === 403) {
      console.log('  [PASS] Staff product deletion rejected (403 Forbidden)');
    } else {
      console.error('  [FAIL] Staff product deletion not forbidden', staffProdDelete.status);
      recordMismatch('Products', `/products/${createdProductId}`, '403 Forbidden for Staff', `${staffProdDelete.status}`, 'BE1');
    }

    // Admin updates product
    const adminProdUpdate = await request('PUT', `/products/${createdProductId}`, {
      name: `Enterprise Cloud Suite Updated ${Date.now()}`,
      type: 'SERVICE',
      sales_price: 160.0,
      cost_price: 55.0,
      notes: 'Updated notes',
      is_active: true,
      variants: [
        { attribute: 'Tier', value: 'Platinum', extra_price: 100 },
      ],
    }, adminToken);
    if (adminProdUpdate.status === 200) {
      console.log('  [PASS] Admin updated product and variants (200)');
    } else {
      console.error('  [FAIL] Admin update product failed', adminProdUpdate.status);
      recordMismatch('Products', `/products/${createdProductId}`, '200 OK', `${adminProdUpdate.status}`, 'BE1');
    }

    // Admin cleans up product
    await request('DELETE', `/products/${createdProductId}`, null, adminToken);
  }

  // ----------------------------------------------------
  // 4. PLANS CRUD & LIFECYCLE ACTIONS
  // ----------------------------------------------------
  console.log('\n--- 4. Plans CRUD & Lifecycle Actions ---');
  let createdPlanId = null;

  // Invalid dates: end_date < start_date
  const badDatePlan = await request('POST', '/plans', {
    name: 'Bad Dates Plan',
    price: 99,
    billing_period: 'MONTHLY',
    start_date: '2026-12-31',
    end_date: '2026-01-01',
    status: 'ACTIVE',
    closable: true,
    pausable: true,
    renewable: true,
    auto_close: false,
  }, adminToken);
  if (badDatePlan.status === 400) {
    console.log('  [PASS] Plan with end_date < start_date rejected (400 Bad Request)');
  } else {
    console.error('  [FAIL] Bad date plan was not rejected', badDatePlan.status);
    recordMismatch('Plans', '/plans', '400 Bad Request when end_date < start_date', `${badDatePlan.status}`, 'BE1');
  }

  // Admin create valid plan
  const planCreate = await request('POST', '/plans', {
    name: `SaaS Monthly Pro ${Date.now()}`,
    price: 120.0,
    billing_period: 'MONTHLY',
    start_date: '2026-01-01',
    end_date: '2026-12-31',
    status: 'ACTIVE',
    closable: true,
    pausable: true,
    renewable: true,
    auto_close: false,
  }, adminToken);

  if (planCreate.status === 201 && planCreate.body?.data?.id) {
    createdPlanId = planCreate.body.data.id;
    console.log(`  [PASS] Admin created plan (201, id: ${createdPlanId})`);
  } else {
    console.error('  [FAIL] Admin create plan failed', planCreate);
    recordMismatch('Plans', '/plans', '201 Created', `${planCreate.status}`, 'BE1');
  }

  if (createdPlanId) {
    // Admin pause plan
    const pauseRes = await request('PATCH', `/plans/${createdPlanId}/pause`, null, adminToken);
    if (pauseRes.status === 200 && pauseRes.body?.data?.status === 'PAUSED') {
      console.log('  [PASS] Admin paused plan (PATCH /plans/:id/pause -> PAUSED)');
    } else {
      console.error('  [FAIL] Pause plan failed', pauseRes);
      recordMismatch('Plans', `/plans/${createdPlanId}/pause`, '200 OK with status PAUSED', `${pauseRes.status}`, 'BE1');
    }

    // Admin renew plan
    const renewRes = await request('PATCH', `/plans/${createdPlanId}/renew`, null, adminToken);
    if (renewRes.status === 200 && renewRes.body?.data?.status === 'ACTIVE') {
      console.log('  [PASS] Admin renewed plan (PATCH /plans/:id/renew -> ACTIVE)');
    } else {
      console.error('  [FAIL] Renew plan failed', renewRes);
      recordMismatch('Plans', `/plans/${createdPlanId}/renew`, '200 OK with status ACTIVE', `${renewRes.status}`, 'BE1');
    }

    // Admin close plan
    const closeRes = await request('PATCH', `/plans/${createdPlanId}/close`, null, adminToken);
    if (closeRes.status === 200 && closeRes.body?.data?.status === 'CLOSED') {
      console.log('  [PASS] Admin closed plan (PATCH /plans/:id/close -> CLOSED)');
    } else {
      console.error('  [FAIL] Close plan failed', closeRes);
      recordMismatch('Plans', `/plans/${createdPlanId}/close`, '200 OK with status CLOSED', `${closeRes.status}`, 'BE1');
    }

    // Staff attempt pause -> 403
    const staffPause = await request('PATCH', `/plans/${createdPlanId}/pause`, null, staffToken);
    if (staffPause.status === 403) {
      console.log('  [PASS] Staff pause plan forbidden (403)');
    } else {
      console.error('  [FAIL] Staff pause plan not forbidden', staffPause.status);
      recordMismatch('Plans', `/plans/${createdPlanId}/pause`, '403 Forbidden for Staff', `${staffPause.status}`, 'BE1');
    }

    // Cleanup plan
    await request('DELETE', `/plans/${createdPlanId}`, null, adminToken);
  }

  // ----------------------------------------------------
  // 5. DISCOUNTS CRUD & PERMISSIONS
  // ----------------------------------------------------
  console.log('\n--- 5. Discounts CRUD & Validation ---');
  let createdDiscountId = null;

  // Invalid discount: percentage > 100
  const badPercentDiscount = await request('POST', '/discounts', {
    name: '150 Percent Off',
    type: 'PERCENT',
    value: 150,
    start_date: '2026-01-01',
    end_date: '2026-12-31',
    scope: 'SUBSCRIPTION',
  }, adminToken);
  if (badPercentDiscount.status === 400) {
    console.log('  [PASS] Percentage discount > 100 rejected (400 Bad Request)');
  } else {
    console.error('  [FAIL] Percentage discount > 100 was not rejected', badPercentDiscount.status);
    recordMismatch('Discounts', '/discounts', '400 Bad Request for value > 100', `${badPercentDiscount.status}`, 'BE1');
  }

  // Valid discount creation
  const discountCreate = await request('POST', '/discounts', {
    name: `Integration Promo ${Date.now()}`,
    type: 'PERCENT',
    value: 20,
    min_purchase: 100,
    min_quantity: 1,
    start_date: '2026-01-01',
    end_date: '2026-12-31',
    usage_limit: 50,
    scope: 'SUBSCRIPTION',
    is_active: true,
  }, adminToken);
  if (discountCreate.status === 201 && discountCreate.body?.data?.id) {
    createdDiscountId = discountCreate.body.data.id;
    console.log(`  [PASS] Admin created discount (201, id: ${createdDiscountId})`);
  } else {
    console.error('  [FAIL] Admin create discount failed', discountCreate);
    recordMismatch('Discounts', '/discounts', '201 Created', `${discountCreate.status}`, 'BE1');
  }

  // Staff read discount list -> 200
  const staffDiscList = await request('GET', '/discounts?page=1&limit=5', null, staffToken);
  if (staffDiscList.status === 200 && Array.isArray(staffDiscList.body?.data)) {
    console.log('  [PASS] Staff read discounts list (200)');
  } else {
    console.error('  [FAIL] Staff read discounts failed', staffDiscList.status);
    recordMismatch('Discounts', '/discounts', '200 OK for Staff', `${staffDiscList.status}`, 'BE1');
  }

  // Staff create discount -> 403
  const staffDiscCreate = await request('POST', '/discounts', {
    name: 'Staff Unauthorized Discount',
    type: 'FIXED',
    value: 10,
    start_date: '2026-01-01',
    end_date: '2026-12-31',
    scope: 'SUBSCRIPTION',
  }, staffToken);
  if (staffDiscCreate.status === 403) {
    console.log('  [PASS] Staff create discount forbidden (403)');
  } else {
    console.error('  [FAIL] Staff create discount not forbidden', staffDiscCreate.status);
    recordMismatch('Discounts', '/discounts', '403 Forbidden for Staff', `${staffDiscCreate.status}`, 'BE1');
  }

  // Clean up discount
  if (createdDiscountId) {
    await request('DELETE', `/discounts/${createdDiscountId}`, null, adminToken);
  }

  // ----------------------------------------------------
  // 6. STAFF MANAGEMENT (ADMIN ONLY)
  // ----------------------------------------------------
  console.log('\n--- 6. Staff Management & Access Controls ---');
  const staffEmail = `newstaff_${Date.now()}@brightloop.test`;
  const createStaffRes = await request('POST', '/users/staff', {
    name: 'Operations Agent',
    email: staffEmail,
    password: 'Staff@1234',
    phone: '+1 555-0188',
  }, adminToken);
  if (createStaffRes.status === 201 && createStaffRes.body?.data?.id) {
    console.log(`  [PASS] Admin created staff user (201, id: ${createStaffRes.body.data.id})`);
  } else {
    console.error('  [FAIL] Admin create staff failed', createStaffRes);
    recordMismatch('Staff', '/users/staff', '201 Created', `${createStaffRes.status}`, 'BE1');
  }

  // Staff attempt create staff -> 403
  const staffAttemptCreate = await request('POST', '/users/staff', {
    name: 'Unauthorized Staff',
    email: `unauth_${Date.now()}@brightloop.test`,
    password: 'Staff@1234',
  }, staffToken);
  if (staffAttemptCreate.status === 403) {
    console.log('  [PASS] Staff create staff forbidden (403)');
  } else {
    console.error('  [FAIL] Staff create staff not forbidden', staffAttemptCreate.status);
    recordMismatch('Staff', '/users/staff', '403 Forbidden for Staff', `${staffAttemptCreate.status}`, 'BE1');
  }

  // Staff attempt list staff -> 403 (Contract: Staff can only list role=CUSTOMER)
  const staffListStaff = await request('GET', '/users?role=STAFF', null, staffToken);
  if (staffListStaff.status === 403) {
    console.log('  [PASS] Staff listing staff forbidden (403)');
  } else {
    console.error('  [FAIL] Staff listing staff not forbidden', staffListStaff.status);
    recordMismatch('Staff', '/users?role=STAFF', '403 Forbidden for Staff', `${staffListStaff.status}`, 'BE1');
  }

  // ----------------------------------------------------
  // 7. CUSTOMER PORTAL DATA ISOLATION (FE2 INTEGRATION)
  // ----------------------------------------------------
  console.log('\n--- 7. Customer Portal Data Isolation ---');

  // Customer lists subscriptions: should only return own subscriptions
  const custSubList = await request('GET', '/subscriptions', null, customerToken);
  if (custSubList.status === 200 && Array.isArray(custSubList.body?.data)) {
    const foreignSubs = custSubList.body.data.filter((s) => s.customer_id !== customerId);
    if (foreignSubs.length === 0) {
      console.log(`  [PASS] Customer lists subscriptions: isolated to customer (count: ${custSubList.body.data.length})`);
    } else {
      console.error('  [FAIL] Customer saw other customers subscriptions!', foreignSubs);
      recordMismatch('CustomerPortal', '/subscriptions', 'Only customer own subscriptions', `Saw ${foreignSubs.length} foreign subscriptions`, 'BE1');
    }
  } else {
    console.error('  [FAIL] Customer get subscriptions failed', custSubList.status);
    recordMismatch('CustomerPortal', '/subscriptions', '200 OK', `${custSubList.status}`, 'BE1');
  }

  // Customer lists invoices: should only return own invoices
  const custInvList = await request('GET', '/invoices', null, customerToken);
  if (custInvList.status === 200 && Array.isArray(custInvList.body?.data)) {
    const foreignInvs = custInvList.body.data.filter((i) => i.customer_id !== customerId);
    if (foreignInvs.length === 0) {
      console.log(`  [PASS] Customer lists invoices: isolated to customer (count: ${custInvList.body.data.length})`);
    } else {
      console.error('  [FAIL] Customer saw other customers invoices!', foreignInvs);
      recordMismatch('CustomerPortal', '/invoices', 'Only customer own invoices', `Saw ${foreignInvs.length} foreign invoices`, 'BE1');
    }
  } else {
    console.error('  [FAIL] Customer get invoices failed', custInvList.status);
    recordMismatch('CustomerPortal', '/invoices', '200 OK', `${custInvList.status}`, 'BE1');
  }

  // Customer attempt access to quotation templates -> 403
  const custTemplateList = await request('GET', '/quotation-templates', null, customerToken);
  if (custTemplateList.status === 403) {
    console.log('  [PASS] Customer access to quotation templates forbidden (403)');
  } else {
    console.error('  [FAIL] Customer access to quotation templates not forbidden', custTemplateList.status);
    recordMismatch('QuotationTemplates', '/quotation-templates', '403 Forbidden for Customer', `${custTemplateList.status}`, 'BE1');
  }

  // ----------------------------------------------------
  // 8. LARGE LISTS & PAGINATION ENVELOPES
  // ----------------------------------------------------
  console.log('\n--- 8. Large Lists & Pagination Envelopes ---');
  const paginatedEndpoints = [
    { name: 'Products', path: '/products?page=1&limit=2' },
    { name: 'Plans', path: '/plans?page=1&limit=2' },
    { name: 'Taxes', path: '/taxes?page=1&limit=2' },
    { name: 'Discounts', path: '/discounts?page=1&limit=2' },
    { name: 'Subscriptions', path: '/subscriptions?page=1&limit=2' },
    { name: 'Invoices', path: '/invoices?page=1&limit=2' },
  ];

  for (const ep of paginatedEndpoints) {
    const res = await request('GET', ep.path, null, adminToken);
    const meta = res.body?.meta;
    const hasStandardEnvelope =
      res.status === 200 &&
      res.body?.success === true &&
      Array.isArray(res.body?.data) &&
      meta &&
      typeof meta.page === 'number' &&
      typeof meta.limit === 'number' &&
      typeof meta.total === 'number' &&
      typeof meta.totalPages === 'number';

    if (hasStandardEnvelope) {
      console.log(`  [PASS] ${ep.name} has standard pagination envelope (total: ${meta.total}, totalPages: ${meta.totalPages})`);
    } else {
      console.error(`  [FAIL] ${ep.name} pagination envelope mismatch`, res.body);
      recordMismatch(ep.name, ep.path, 'Standard envelope { success, message, data: [], meta: { page, limit, total, totalPages } }', JSON.stringify(res.body?.meta || res.body), 'BE1');
    }
  }

  console.log('\n====================================================');
  console.log(`VERIFICATION COMPLETE: ${mismatches.length} Mismatches Found`);
  console.log('====================================================\n');
  if (mismatches.length > 0) {
    console.table(mismatches);
  }
}

runVerification().catch(console.error);

