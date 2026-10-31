const express = require('express');
const router = express.Router();

const auth = require('../../middleware/auth');
const { allow } = require('../../middleware/role');
const validate = require('../../middleware/validate');
const asyncHandler = require('../../utils/asyncHandler');

const invoicesController = require('./invoices.controller');
const { listInvoicesQuerySchema } = require('./invoices.validation');

// All invoice routes require authentication
router.use('/invoices', auth);

// IMPORTANT: declare /invoices/generate-due before /invoices/:id
// POST /invoices/generate-due (ADMIN, STAFF)
router.post(
  '/invoices/generate-due',
  allow('ADMIN', 'STAFF'),
  asyncHandler(invoicesController.generateDueInvoices)
);

// GET /invoices: filters per contract, pagination, forced customer_id for CUSTOMER role
router.get(
  '/invoices',
  validate(listInvoicesQuerySchema, 'query'),
  asyncHandler(invoicesController.listInvoices)
);

// GET /invoices/:id/print: returns text/html, Staff or owning customer only
router.get(
  '/invoices/:id/print',
  asyncHandler(invoicesController.printInvoice)
);

// PATCH /invoices/:id/confirm: DRAFT -> CONFIRMED (ADMIN, STAFF)
router.patch(
  '/invoices/:id/confirm',
  allow('ADMIN', 'STAFF'),
  asyncHandler(invoicesController.confirmInvoice)
);

// PATCH /invoices/:id/cancel: DRAFT or CONFIRMED -> CANCELLED, refuses if amount_paid > 0 (ADMIN, STAFF)
router.patch(
  '/invoices/:id/cancel',
  allow('ADMIN', 'STAFF'),
  asyncHandler(invoicesController.cancelInvoice)
);

// PATCH /invoices/:id/send: CONFIRMED only, emails summary via mailer (ADMIN, STAFF)
router.patch(
  '/invoices/:id/send',
  allow('ADMIN', 'STAFF'),
  asyncHandler(invoicesController.sendInvoice)
);

// GET /invoices/:id: lines, discounts breakdown, totals; 404 for other customers
router.get(
  '/invoices/:id',
  asyncHandler(invoicesController.getInvoiceById)
);

module.exports = router;

