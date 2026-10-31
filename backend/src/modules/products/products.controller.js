const productsService = require('./products.service');
const { ok } = require('../../utils/response');
const asyncHandler = require('../../utils/asyncHandler');

const listProducts = asyncHandler(async (req, res) => {
  const { products, meta } = await productsService.listProducts(req.query);
  return ok(res, products, 'Products retrieved successfully', meta);
});

const getProductById = asyncHandler(async (req, res) => {
  const product = await productsService.getProductById(parseInt(req.params.id, 10));
  return ok(res, product, 'Product retrieved successfully');
});

const createProduct = asyncHandler(async (req, res) => {
  const product = await productsService.createProduct(req.body);
  return ok(res, product, 'Product created successfully', undefined, 201);
});

const updateProduct = asyncHandler(async (req, res) => {
  const product = await productsService.updateProduct(parseInt(req.params.id, 10), req.body);
  return ok(res, product, 'Product updated successfully');
});

const deleteProduct = asyncHandler(async (req, res) => {
  const result = await productsService.deleteProduct(parseInt(req.params.id, 10));
  return ok(res, result, result.message);
});

module.exports = {
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};

