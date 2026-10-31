const discountsService = require('./discounts.service');
const { ok } = require('../../utils/response');
const asyncHandler = require('../../utils/asyncHandler');

const listDiscounts = asyncHandler(async (req, res) => {
  const { discounts, meta } = await discountsService.listDiscounts(req.query);
  return ok(res, discounts, 'Discounts retrieved successfully', meta);
});

const getDiscountById = asyncHandler(async (req, res) => {
  const discount = await discountsService.getDiscountById(parseInt(req.params.id, 10));
  return ok(res, discount, 'Discount retrieved successfully');
});

const createDiscount = asyncHandler(async (req, res) => {
  const discount = await discountsService.createDiscount(req.body, req.user?.id);
  return ok(res, discount, 'Discount created successfully', undefined, 201);
});

const updateDiscount = asyncHandler(async (req, res) => {
  const discount = await discountsService.updateDiscount(parseInt(req.params.id, 10), req.body);
  return ok(res, discount, 'Discount updated successfully');
});

const deleteDiscount = asyncHandler(async (req, res) => {
  const result = await discountsService.deleteDiscount(parseInt(req.params.id, 10));
  return ok(res, result, result.message);
});

module.exports = {
  listDiscounts,
  getDiscountById,
  createDiscount,
  updateDiscount,
  deleteDiscount,
};

