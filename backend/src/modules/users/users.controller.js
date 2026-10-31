const usersService = require('./users.service');
const { ok } = require('../../utils/response');
const asyncHandler = require('../../utils/asyncHandler');

const createStaff = asyncHandler(async (req, res) => {
  const result = await usersService.createStaff(req.body);
  return ok(res, result, 'Staff created successfully', undefined, 201);
});

const listUsers = asyncHandler(async (req, res) => {
  const { users, meta } = await usersService.listUsers(req.query, req.user);
  return ok(res, users, 'Users retrieved successfully', meta);
});

module.exports = {
  createStaff,
  listUsers,
};

