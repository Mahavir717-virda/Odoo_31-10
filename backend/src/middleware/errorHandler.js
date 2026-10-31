const ApiError = require('../utils/ApiError');
const { ZodError } = require('zod');

// Central error handler middleware
const errorHandler = (err, req, res, next) => {
  // If response headers are already sent, delegate to default express error handler
  if (res.headersSent) {
    return next(err);
  }

  // 1. Handled ApiError
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors || [],
    });
  }

  // 2. Zod validation error
  if (err instanceof ZodError) {
    const errors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }

  // 3. PostgreSQL database errors
  // 23505: unique_violation
  if (err.code === '23505') {
    return res.status(409).json({
      success: false,
      message: 'Conflict: Duplicate record already exists',
      errors: [{ detail: err.detail }],
    });
  }

  // 23503: foreign_key_violation
  if (err.code === '23503') {
    return res.status(409).json({
      success: false,
      message: 'Conflict: Referenced resource violation',
      errors: [{ detail: err.detail }],
    });
  }

  // 22P02: invalid_text_representation
  if (err.code === '22P02') {
    return res.status(400).json({
      success: false,
      message: 'Invalid input syntax for type',
      errors: [{ detail: err.message }],
    });
  }

  // 4. Everything else: 500 Internal Server Error
  console.error('Unhandled Server Error:', err);

  return res.status(500).json({
    success: false,
    message: 'Internal server error',
    errors: [],
  });
};

module.exports = errorHandler;
