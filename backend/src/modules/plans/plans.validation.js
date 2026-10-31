const zod = require('zod');

const createPlanSchema = zod
  .object({
    name: zod.string({ required_error: 'Name is required' }).trim().min(1, 'Name is required'),
    price: zod.coerce.number().min(0, 'Price must be greater than or equal to 0'),
    billing_period: zod.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']),
    min_quantity: zod.coerce.number().int().min(1, 'Minimum quantity must be at least 1').default(1),
    start_date: zod.string({ required_error: 'Start date is required' }).regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be YYYY-MM-DD'),
    end_date: zod.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be YYYY-MM-DD').optional().nullable(),
    auto_close: zod.boolean().default(false),
    closable: zod.boolean().default(true),
    pausable: zod.boolean().default(false),
    renewable: zod.boolean().default(true),
    status: zod.enum(['ACTIVE', 'PAUSED', 'CLOSED']).default('ACTIVE'),
  })
  .refine(
    (data) => {
      if (data.end_date) {
        return data.end_date >= data.start_date;
      }
      return true;
    },
    {
      message: 'End date must be greater than or equal to start date',
      path: ['end_date'],
    }
  );

const updatePlanSchema = zod
  .object({
    name: zod.string().trim().min(1, 'Name is required').optional(),
    price: zod.coerce.number().min(0, 'Price must be greater than or equal to 0').optional(),
    billing_period: zod.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']).optional(),
    min_quantity: zod.coerce.number().int().min(1, 'Minimum quantity must be at least 1').optional(),
    start_date: zod.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be YYYY-MM-DD').optional(),
    end_date: zod.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be YYYY-MM-DD').optional().nullable(),
    auto_close: zod.boolean().optional(),
    closable: zod.boolean().optional(),
    pausable: zod.boolean().optional(),
    renewable: zod.boolean().optional(),
    status: zod.enum(['ACTIVE', 'PAUSED', 'CLOSED']).optional(),
  })
  .refine(
    (data) => {
      if (data.start_date && data.end_date) {
        return data.end_date >= data.start_date;
      }
      return true;
    },
    {
      message: 'End date must be greater than or equal to start date',
      path: ['end_date'],
    }
  );

const listPlansQuerySchema = zod.object({
  page: zod.string().optional(),
  limit: zod.string().optional(),
  status: zod.enum(['ACTIVE', 'PAUSED', 'CLOSED']).optional(),
  billing_period: zod.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']).optional(),
  search: zod.string().optional(),
});

module.exports = {
  createPlanSchema,
  updatePlanSchema,
  listPlansQuerySchema,
};

