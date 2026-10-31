const express = require('express');
const plansController = require('./plans.controller');
const {
  createPlanSchema,
  updatePlanSchema,
  listPlansQuerySchema,
} = require('./plans.validation');
const validate = require('../../middleware/validate');
const auth = require('../../middleware/auth');
const { allow } = require('../../middleware/role');

const router = express.Router();

// GET list (ADMIN and STAFF)
router.get(
  '/plans',
  auth,
  allow('ADMIN', 'STAFF'),
  validate(listPlansQuerySchema, 'query'),
  plansController.listPlans
);

// GET /:id (ADMIN and STAFF)
router.get(
  '/plans/:id',
  auth,
  allow('ADMIN', 'STAFF'),
  plansController.getPlanById
);

// POST (ADMIN only)
router.post(
  '/plans',
  auth,
  allow('ADMIN'),
  validate(createPlanSchema, 'body'),
  plansController.createPlan
);

// PUT (ADMIN only)
router.put(
  '/plans/:id',
  auth,
  allow('ADMIN'),
  validate(updatePlanSchema, 'body'),
  plansController.updatePlan
);

// DELETE (ADMIN only)
router.delete(
  '/plans/:id',
  auth,
  allow('ADMIN'),
  plansController.deletePlan
);

// PATCH close (ADMIN only)
router.patch(
  '/plans/:id/close',
  auth,
  allow('ADMIN'),
  plansController.closePlan
);

// PATCH pause (ADMIN only)
router.patch(
  '/plans/:id/pause',
  auth,
  allow('ADMIN'),
  plansController.pausePlan
);

// PATCH renew (ADMIN only)
router.patch(
  '/plans/:id/renew',
  auth,
  allow('ADMIN'),
  plansController.renewPlan
);

module.exports = router;

