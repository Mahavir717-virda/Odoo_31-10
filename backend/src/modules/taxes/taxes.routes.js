const express = require('express');
const taxesController = require('./taxes.controller');
const {
  createTaxSchema,
  updateTaxSchema,
  listTaxesQuerySchema,
} = require('./taxes.validation');
const validate = require('../../middleware/validate');
const auth = require('../../middleware/auth');
const { allow } = require('../../middleware/role');

const router = express.Router();

// GET list (ADMIN and STAFF)
router.get(
  '/taxes',
  auth,
  allow('ADMIN', 'STAFF'),
  validate(listTaxesQuerySchema, 'query'),
  taxesController.listTaxes
);

// GET /:id (ADMIN and STAFF)
router.get(
  '/taxes/:id',
  auth,
  allow('ADMIN', 'STAFF'),
  taxesController.getTaxById
);

// POST (ADMIN only)
router.post(
  '/taxes',
  auth,
  allow('ADMIN'),
  validate(createTaxSchema, 'body'),
  taxesController.createTax
);

// PUT (ADMIN only)
router.put(
  '/taxes/:id',
  auth,
  allow('ADMIN'),
  validate(updateTaxSchema, 'body'),
  taxesController.updateTax
);

// DELETE (ADMIN only)
router.delete(
  '/taxes/:id',
  auth,
  allow('ADMIN'),
  taxesController.deleteTax
);

module.exports = router;

