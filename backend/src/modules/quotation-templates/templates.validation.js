const { z } = require('zod');

const templateLineSchema = z.object({
  product_id: z.number().int().positive('Product ID must be a positive integer'),
  variant_id: z.number().int().positive('Variant ID must be a positive integer').nullable().optional(),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').default(1),
  tax_id: z.number().int().positive('Tax ID must be a positive integer').nullable().optional(),
});

const createTemplateSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(150),
  validity_days: z.number().int().min(1, 'Validity days must be greater than 0').default(30),
  plan_id: z.number().int().positive('Plan ID must be a positive integer'),
  payment_terms_days: z.number().int().min(0, 'Payment terms days must be non-negative').default(15),
  notes: z.string().nullable().optional(),
  is_active: z.boolean().optional().default(true),
  lines: z.array(templateLineSchema).min(1, 'Template must contain at least one line'),
});

const updateTemplateSchema = z.object({
  name: z.string().trim().min(1).max(150).optional(),
  validity_days: z.number().int().min(1).optional(),
  plan_id: z.number().int().positive().optional(),
  payment_terms_days: z.number().int().min(0).optional(),
  notes: z.string().nullable().optional(),
  is_active: z.boolean().optional(),
  lines: z.array(templateLineSchema).min(1, 'Template must contain at least one line').optional(),
});

const listTemplatesQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
  is_active: z.enum(['true', 'false']).transform((v) => v === 'true').optional(),
});

module.exports = {
  createTemplateSchema,
  updateTemplateSchema,
  listTemplatesQuerySchema,
};

