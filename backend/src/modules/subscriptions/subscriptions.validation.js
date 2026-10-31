const { z } = require('zod');

const subscriptionLineSchema = z.object({
  product_id: z.number().int().positive('Product ID must be a positive integer'),
  variant_id: z.number().int().positive('Variant ID must be a positive integer').nullable().optional(),
  description: z.string().trim().max(255).nullable().optional(),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  tax_id: z.number().int().positive('Tax ID must be a positive integer').nullable().optional(),
});

const createSubscriptionSchema = z.object({
  customer_id: z.number().int().positive('Customer ID must be a positive integer'),
  plan_id: z.number().int().positive('Plan ID must be a positive integer'),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'start_date must be in YYYY-MM-DD format'),
  expiry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'expiry_date must be in YYYY-MM-DD format').nullable().optional(),
  payment_terms_days: z.number().int().min(0, 'Payment terms days must be non-negative').default(15),
  notes: z.string().nullable().optional(),
  lines: z.array(subscriptionLineSchema).min(1, 'At least one line is required'),
});

const updateSubscriptionSchema = z.object({
  payment_terms_days: z.number().int().min(0).optional(),
  expiry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  notes: z.string().nullable().optional(),
  lines: z.array(subscriptionLineSchema).min(1, 'At least one line is required').optional(),
});

const fromTemplateSchema = z.object({
  customer_id: z.number().int().positive('Customer ID must be a positive integer'),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'start_date must be in YYYY-MM-DD format'),
});

const patchStatusSchema = z.object({
  status: z.enum(['DRAFT', 'QUOTATION', 'CONFIRMED', 'ACTIVE', 'CLOSED']),
});

const listSubscriptionsQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  status: z.enum(['DRAFT', 'QUOTATION', 'CONFIRMED', 'ACTIVE', 'CLOSED']).optional(),
  customer_id: z.string().optional(),
  search: z.string().optional(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

module.exports = {
  createSubscriptionSchema,
  updateSubscriptionSchema,
  fromTemplateSchema,
  patchStatusSchema,
  listSubscriptionsQuerySchema,
};

