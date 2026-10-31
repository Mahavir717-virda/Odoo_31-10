const { ZodError } = require('zod');

/**
 * Middleware factory for zod validation
 * @param {import('zod').ZodSchema} zodSchema
 * @param {'body'|'query'|'params'} [source='body']
 */
const validate = (zodSchema, source = 'body') => {
  return (req, res, next) => {
    try {
      const parsed = zodSchema.parse(req[source]);
      req[source] = parsed;
      next();
    } catch (err) {
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
      next(err);
    }
  };
};

module.exports = validate;
