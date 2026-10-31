const { z } = require('zod');

const listInvoicesQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  status: z.enum(['DRAFT', 'CONFIRMED', 'PAID', 'CANCELLED']).optional(),
  overdue: z
    .enum(['true', 'false'])
    .or(z.boolean())
    .transform((val) => val === true || val === 'true')
    .optional(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'from must be YYYY-MM-DD').optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'to must be YYYY-MM-DD').optional(),
  customer_id: z.coerce.number().int().positive().optional(),
  subscription_id: z.coerce.number().int().positive().optional(),
  search: z.string().trim().optional(),
});

module.exports = {
  listInvoicesQuerySchema,
};

