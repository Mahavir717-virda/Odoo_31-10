const taxesService = require('./taxes.service');
const { ok } = require('../../utils/response');
const asyncHandler = require('../../utils/asyncHandler');

const listTaxes = asyncHandler(async (req, res) => {
  const { taxes, meta } = await taxesService.listTaxes(req.query);
  return ok(res, taxes, 'Taxes retrieved successfully', meta);
});

const getTaxById = asyncHandler(async (req, res) => {
  const tax = await taxesService.getTaxById(parseInt(req.params.id, 10));
  return ok(res, tax, 'Tax retrieved successfully');
});

const createTax = asyncHandler(async (req, res) => {
  const tax = await taxesService.createTax(req.body);
  return ok(res, tax, 'Tax created successfully', undefined, 201);
});

const updateTax = asyncHandler(async (req, res) => {
  const tax = await taxesService.updateTax(parseInt(req.params.id, 10), req.body);
  return ok(res, tax, 'Tax updated successfully');
});

const deleteTax = asyncHandler(async (req, res) => {
  const result = await taxesService.deleteTax(parseInt(req.params.id, 10));
  return ok(res, result, result.message);
});

module.exports = {
  listTaxes,
  getTaxById,
  createTax,
  updateTax,
  deleteTax,
};

