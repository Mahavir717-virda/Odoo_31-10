const zod = require('zod');

const variantSchema = zod.object({
  id: zod.number().int().positive().optional(),
  attribute: zod.string({ required_error: 'Attribute is required' }).trim().min(1, 'Attribute is required'),
  value: zod.string({ required_error: 'Value is required' }).trim().min(1, 'Value is required'),
  extra_price: zod.coerce.number().default(0),
});

const createProductSchema = zod.object({
  name: zod.string({ required_error: 'Name is required' }).trim().min(1, 'Name is required'),
  type: zod.enum(['SERVICE', 'GOODS', 'ADDON']).default('SERVICE'),
  sales_price: zod.coerce.number().min(0, 'Sales price must be greater than or equal to 0'),
  cost_price: zod.coerce.number().min(0, 'Cost price must be greater than or equal to 0').default(0),
  tax_id: zod.number().int().positive().optional().nullable(),
  notes: zod.string().optional().nullable(),
  is_active: zod.boolean().default(true),
  variants: zod.array(variantSchema).optional().default([]),
});

const updateProductSchema = zod.object({
  name: zod.string().trim().min(1, 'Name is required').optional(),
  type: zod.enum(['SERVICE', 'GOODS', 'ADDON']).optional(),
  sales_price: zod.coerce.number().min(0, 'Sales price must be greater than or equal to 0').optional(),
  cost_price: zod.coerce.number().min(0, 'Cost price must be greater than or equal to 0').optional(),
  tax_id: zod.number().int().positive().optional().nullable(),
  notes: zod.string().optional().nullable(),
  is_active: zod.boolean().optional(),
  variants: zod.array(variantSchema).optional(),
});

const listProductsQuerySchema = zod.object({
  page: zod.string().optional(),
  limit: zod.string().optional(),
  type: zod.enum(['SERVICE', 'GOODS', 'ADDON']).optional(),
  is_active: zod
    .string()
    .transform((val) => val === 'true')
    .optional(),
  search: zod.string().optional(),
});

module.exports = {
  createProductSchema,
  updateProductSchema,
  listProductsQuerySchema,
};

