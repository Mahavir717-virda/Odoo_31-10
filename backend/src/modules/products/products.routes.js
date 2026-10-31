const express = require('express');
const productsController = require('./products.controller');
const {
  createProductSchema,
  updateProductSchema,
  listProductsQuerySchema,
} = require('./products.validation');
const validate = require('../../middleware/validate');
const auth = require('../../middleware/auth');
const { allow } = require('../../middleware/role');

const router = express.Router();

// GET list (search, type, is_active, pagination; ADMIN and STAFF)
router.get(
  '/products',
  auth,
  allow('ADMIN', 'STAFF'),
  validate(listProductsQuerySchema, 'query'),
  productsController.listProducts
);

// GET /:id with variants (ADMIN and STAFF)
router.get(
  '/products/:id',
  auth,
  allow('ADMIN', 'STAFF'),
  productsController.getProductById
);

// POST create (ADMIN only)
router.post(
  '/products',
  auth,
  allow('ADMIN'),
  validate(createProductSchema, 'body'),
  productsController.createProduct
);

// PUT update (ADMIN only)
router.put(
  '/products/:id',
  auth,
  allow('ADMIN'),
  validate(updateProductSchema, 'body'),
  productsController.updateProduct
);

// DELETE (ADMIN only)
router.delete(
  '/products/:id',
  auth,
  allow('ADMIN'),
  productsController.deleteProduct
);

module.exports = router;

