const zod = require('zod');

const createTaxSchema = zod.object({
  name: zod.string({ required_error: 'Name is required' }).trim().min(1, 'Name is required'),
  rate_percent: zod.coerce
    .number({ required_error: 'Rate percent is required' })
    .min(0, 'Rate percent must be between 0 and 100')
    .max(100, 'Rate percent must be between 0 and 100'),
  is_active: zod.boolean().default(true),
});

const updateTaxSchema = zod.object({
  name: zod.string().trim().min(1, 'Name is required').optional(),
  rate_percent: zod.coerce
    .number()
    .min(0, 'Rate percent must be between 0 and 100')
    .max(100, 'Rate percent must be between 0 and 100')
    .optional(),
  is_active: zod.boolean().optional(),
});

const listTaxesQuerySchema = zod.object({
  page: zod.string().optional(),
  limit: zod.string().optional(),
  is_active: zod
    .string()
    .transform((val) => val === 'true')
    .optional(),
  search: zod.string().optional(),
});

module.exports = {
  createTaxSchema,
  updateTaxSchema,
  listTaxesQuerySchema,
};

