const authService = require('./auth.service');
const { ok } = require('../../utils/response');
const asyncHandler = require('../../utils/asyncHandler');

const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  return ok(res, result, 'Registration successful', undefined, 201);
});

const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  return ok(res, result, 'Login successful');
});

const forgotPassword = asyncHandler(async (req, res) => {
  const result = await authService.forgotPassword(req.body);
  return ok(res, null, result.message);
});

const resetPassword = asyncHandler(async (req, res) => {
  const result = await authService.resetPassword(req.body);
  return ok(res, null, result.message);
});

const getMe = asyncHandler(async (req, res) => {
  const result = await authService.getMe(req.user.id);
  return ok(res, result, 'User profile fetched successfully');
});

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword,
  getMe,
};

