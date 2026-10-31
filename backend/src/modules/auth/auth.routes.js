const express = require('express');
const rateLimit = require('express-rate-limit');
const authController = require('./auth.controller');
const {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} = require('./auth.validation');
const validate = require('../../middleware/validate');
const auth = require('../../middleware/auth');

const router = express.Router();

// Rate limiter: 20 requests per 15 min for auth sensitive endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
    errors: [],
  },
});

router.post('/auth/register', authLimiter, validate(registerSchema, 'body'), authController.register);
router.post('/auth/login', authLimiter, validate(loginSchema, 'body'), authController.login);
router.post('/auth/forgot-password', authLimiter, validate(forgotPasswordSchema, 'body'), authController.forgotPassword);
router.post('/auth/reset-password', validate(resetPasswordSchema, 'body'), authController.resetPassword);
router.get('/auth/me', auth, authController.getMe);

module.exports = router;

