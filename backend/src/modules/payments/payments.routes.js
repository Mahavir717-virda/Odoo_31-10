const express = require('express');
const router = express.Router();

const auth = require('../../middleware/auth');
const { allow } = require('../../middleware/role');
const validate = require('../../middleware/validate');
const asyncHandler = require('../../utils/asyncHandler');

const paymentsController = require('./payments.controller');
const {
  createPaymentSchema,
  listPaymentsQuerySchema,
} = require('./payments.validation');

// All payment routes require authentication
router.use(auth);

// POST /payments: ADMIN, STAFF only
router.post(
  '/payments',
  allow('ADMIN', 'STAFF'),
  validate(createPaymentSchema, 'body'),
  asyncHandler(paymentsController.recordPayment)
);

// GET /payments: ADMIN, STAFF only
router.get(
  '/payments',
  allow('ADMIN', 'STAFF'),
  validate(listPaymentsQuerySchema, 'query'),
  asyncHandler(paymentsController.listPayments)
);

// GET /invoices/:id/payments: Staff, or the owning customer (404 otherwise)
router.get(
  '/invoices/:id/payments',
  asyncHandler(paymentsController.listInvoicePayments)
);

module.exports = router;

