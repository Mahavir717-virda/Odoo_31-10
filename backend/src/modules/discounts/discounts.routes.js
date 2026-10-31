const express = require('express');
const discountsController = require('./discounts.controller');
const {
  createDiscountSchema,
  updateDiscountSchema,
  listDiscountsQuerySchema,
} = require('./discounts.validation');
const validate = require('../../middleware/validate');
const auth = require('../../middleware/auth');
const { allow } = require('../../middleware/role');

const router = express.Router();

// GET list (ADMIN and STAFF)
router.get(
  '/discounts',
  auth,
  allow('ADMIN', 'STAFF'),
  validate(listDiscountsQuerySchema, 'query'),
  discountsController.listDiscounts
);

// GET /:id (ADMIN and STAFF)
router.get(
  '/discounts/:id',
  auth,
  allow('ADMIN', 'STAFF'),
  discountsController.getDiscountById
);

// POST (ADMIN only)
router.post(
  '/discounts',
  auth,
  allow('ADMIN'),
  validate(createDiscountSchema, 'body'),
  discountsController.createDiscount
);

// PUT (ADMIN only)
router.put(
  '/discounts/:id',
  auth,
  allow('ADMIN'),
  validate(updateDiscountSchema, 'body'),
  discountsController.updateDiscount
);

// DELETE (ADMIN only)
router.delete(
  '/discounts/:id',
  auth,
  allow('ADMIN'),
  discountsController.deleteDiscount
);

module.exports = router;

