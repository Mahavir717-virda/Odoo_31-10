const express = require('express');
const router = express.Router();

const auth = require('../../middleware/auth');
const { allow } = require('../../middleware/role');
const asyncHandler = require('../../utils/asyncHandler');

const reportsController = require('./reports.controller');

// All reports routes require authentication and ADMIN or STAFF role
router.use('/reports', auth, allow('ADMIN', 'STAFF'));

// GET /reports/summary?from=&to=
router.get('/reports/summary', asyncHandler(reportsController.getSummary));

// GET /reports/overdue
router.get('/reports/overdue', asyncHandler(reportsController.getOverdue));

// GET /reports/revenue?from=&to=
router.get('/reports/revenue', asyncHandler(reportsController.getRevenue));

module.exports = router;

