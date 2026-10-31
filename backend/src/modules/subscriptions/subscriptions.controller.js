const asyncHandler = require('../../utils/asyncHandler');
const { ok } = require('../../utils/response');
const subscriptionsService = require('./subscriptions.service');

const listSubscriptions = asyncHandler(async (req, res) => {
  const { subscriptions, meta } = await subscriptionsService.listSubscriptions(req.query, req.user);
  return ok(res, subscriptions, 'Subscriptions retrieved successfully', meta);
});

const getSubscriptionById = asyncHandler(async (req, res) => {
  const subscription = await subscriptionsService.getSubscriptionById(req.params.id, req.user);
  return ok(res, subscription, 'Subscription retrieved successfully');
});

const createSubscription = asyncHandler(async (req, res) => {
  const subscription = await subscriptionsService.createSubscription(req.body, req.user);
  return ok(res, subscription, 'Subscription created successfully', undefined, 201);
});

const updateSubscription = asyncHandler(async (req, res) => {
  const subscription = await subscriptionsService.updateSubscription(req.params.id, req.body, req.user);
  return ok(res, subscription, 'Subscription updated successfully');
});

const createFromTemplate = asyncHandler(async (req, res) => {
  const subscription = await subscriptionsService.createFromTemplate(req.params.id, req.body, req.user);
  return ok(res, subscription, 'Subscription created from template successfully', undefined, 201);
});

const patchStatus = asyncHandler(async (req, res) => {
  const subscription = await subscriptionsService.patchStatus(req.params.id, req.body.status, req.user);
  return ok(res, subscription, `Subscription status updated to ${req.body.status} successfully`);
});

module.exports = {
  listSubscriptions,
  getSubscriptionById,
  createSubscription,
  updateSubscription,
  createFromTemplate,
  patchStatus,
};

