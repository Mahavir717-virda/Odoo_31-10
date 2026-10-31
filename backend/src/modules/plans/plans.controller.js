const plansService = require('./plans.service');
const { ok } = require('../../utils/response');
const asyncHandler = require('../../utils/asyncHandler');

const listPlans = asyncHandler(async (req, res) => {
  const { plans, meta } = await plansService.listPlans(req.query);
  return ok(res, plans, 'Plans retrieved successfully', meta);
});

const getPlanById = asyncHandler(async (req, res) => {
  const plan = await plansService.getPlanById(parseInt(req.params.id, 10));
  return ok(res, plan, 'Plan retrieved successfully');
});

const createPlan = asyncHandler(async (req, res) => {
  const plan = await plansService.createPlan(req.body);
  return ok(res, plan, 'Plan created successfully', undefined, 201);
});

const updatePlan = asyncHandler(async (req, res) => {
  const plan = await plansService.updatePlan(parseInt(req.params.id, 10), req.body);
  return ok(res, plan, 'Plan updated successfully');
});

const deletePlan = asyncHandler(async (req, res) => {
  const result = await plansService.deletePlan(parseInt(req.params.id, 10));
  return ok(res, result, result.message);
});

const closePlan = asyncHandler(async (req, res) => {
  const plan = await plansService.closePlan(parseInt(req.params.id, 10));
  return ok(res, plan, 'Plan closed successfully');
});

const pausePlan = asyncHandler(async (req, res) => {
  const plan = await plansService.pausePlan(parseInt(req.params.id, 10));
  return ok(res, plan, 'Plan paused successfully');
});

const renewPlan = asyncHandler(async (req, res) => {
  const plan = await plansService.renewPlan(parseInt(req.params.id, 10));
  return ok(res, plan, 'Plan renewed successfully');
});

module.exports = {
  listPlans,
  getPlanById,
  createPlan,
  updatePlan,
  deletePlan,
  closePlan,
  pausePlan,
  renewPlan,
};

