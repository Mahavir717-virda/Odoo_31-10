const express = require('express');
const router = express.Router();

const auth = require('../../middleware/auth');
const { allow } = require('../../middleware/role');
const validate = require('../../middleware/validate');

const subscriptionsController = require('./subscriptions.controller');
const {
  createSubscriptionSchema,
  updateSubscriptionSchema,
  fromTemplateSchema,
  patchStatusSchema,
  listSubscriptionsQuerySchema,
} = require('./subscriptions.validation');

// All subscription routes require authentication
router.use('/subscriptions', auth);

// GET /subscriptions: ADMIN, STAFF, and CUSTOMER (Customer is scoped to their own in service)
router.get(
  '/subscriptions',
  validate(listSubscriptionsQuerySchema, 'query'),
  subscriptionsController.listSubscriptions
);

// GET /subscriptions/:id: ADMIN, STAFF, and CUSTOMER (Customer requesting someone else gets 404)
router.get(
  '/subscriptions/:id',
  subscriptionsController.getSubscriptionById
);

// POST /subscriptions: ADMIN, STAFF only
router.post(
  '/subscriptions',
  allow('ADMIN', 'STAFF'),
  validate(createSubscriptionSchema, 'body'),
  subscriptionsController.createSubscription
);

// PUT /subscriptions/:id: ADMIN, STAFF only (only while DRAFT or QUOTATION)
router.put(
  '/subscriptions/:id',
  allow('ADMIN', 'STAFF'),
  validate(updateSubscriptionSchema, 'body'),
  subscriptionsController.updateSubscription
);

// POST /subscriptions/from-template/:id: ADMIN, STAFF only
router.post(
  '/subscriptions/from-template/:id',
  allow('ADMIN', 'STAFF'),
  validate(fromTemplateSchema, 'body'),
  subscriptionsController.createFromTemplate
);

// PATCH /subscriptions/:id/status: ADMIN, STAFF only
router.patch(
  '/subscriptions/:id/status',
  allow('ADMIN', 'STAFF'),
  validate(patchStatusSchema, 'body'),
  subscriptionsController.patchStatus
);

module.exports = router;

