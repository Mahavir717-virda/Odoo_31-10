const express = require('express');
const usersController = require('./users.controller');
const { createStaffSchema, listUsersQuerySchema } = require('./users.validation');
const validate = require('../../middleware/validate');
const auth = require('../../middleware/auth');
const { allow } = require('../../middleware/role');

const router = express.Router();

// POST /users/staff (ADMIN only)
router.post(
  '/users/staff',
  auth,
  allow('ADMIN'),
  validate(createStaffSchema, 'body'),
  usersController.createStaff
);

// GET /users (ADMIN and STAFF; STAFF may only list role=CUSTOMER)
router.get(
  '/users',
  auth,
  allow('ADMIN', 'STAFF'),
  validate(listUsersQuerySchema, 'query'),
  usersController.listUsers
);

module.exports = router;

