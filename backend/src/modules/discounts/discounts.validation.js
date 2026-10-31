const zod = require('zod');

const createDiscountSchema = zod
  .object({
    name: zod.string({ required_error: 'Name is required' }).trim().min(1, 'Name is required'),
    type: zod.enum(['FIXED', 'PERCENT'], {
      required_error: 'Type must be FIXED or PERCENT',
    }),
    value: zod.coerce.number().positive('Value must be greater than 0'),
    min_purchase: zod.coerce.number().min(0, 'Minimum purchase must be >= 0').default(0),
    min_quantity: zod.coerce.number().int().min(0, 'Minimum quantity must be >= 0').default(0),
    start_date: zod
      .string({ required_error: 'Start date is required' })
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be YYYY-MM-DD'),
    end_date: zod
      .string({ required_error: 'End date is required' })
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be YYYY-MM-DD'),
    usage_limit: zod.coerce
      .number()
      .int()
      .positive('Usage limit must be greater than 0')
      .optional()
      .nullable(),
    scope: zod.enum(['PRODUCTS', 'SUBSCRIPTION']).default('SUBSCRIPTION'),
    product_ids: zod.array(zod.coerce.number().int().positive()).optional().default([]),
    is_active: zod.boolean().optional().default(true),
  })
  .refine(
    (data) => {
      if (data.type === 'PERCENT') {
        return data.value <= 100;
      }
      return true;
    },
    {
      message: 'Value must be <= 100 for PERCENT discount',
      path: ['value'],
    }
  )
  .refine(
    (data) => {
      return data.end_date >= data.start_date;
    },
    {
      message: 'End date must be greater than or equal to start date',
      path: ['end_date'],
    }
  )
  .refine(
    (data) => {
      if (data.scope === 'PRODUCTS') {
        return Array.isArray(data.product_ids) && data.product_ids.length > 0;
      }
      return true;
    },
    {
      message: 'scope=PRODUCTS requires non-empty product_ids',
      path: ['product_ids'],
    }
  );

const updateDiscountSchema = zod
  .object({
    name: zod.string().trim().min(1, 'Name cannot be empty').optional(),
    type: zod.enum(['FIXED', 'PERCENT']).optional(),
    value: zod.coerce.number().positive('Value must be greater than 0').optional(),
    min_purchase: zod.coerce.number().min(0, 'Minimum purchase must be >= 0').optional(),
    min_quantity: zod.coerce.number().int().min(0, 'Minimum quantity must be >= 0').optional(),
    start_date: zod
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be YYYY-MM-DD')
      .optional(),
    end_date: zod
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be YYYY-MM-DD')
      .optional(),
    usage_limit: zod.coerce
      .number()
      .int()
      .positive('Usage limit must be greater than 0')
      .optional()
      .nullable(),
    scope: zod.enum(['PRODUCTS', 'SUBSCRIPTION']).optional(),
    product_ids: zod.array(zod.coerce.number().int().positive()).optional(),
    is_active: zod.boolean().optional(),
  })
  .refine(
    (data) => {
      if (data.type === 'PERCENT' && data.value !== undefined) {
        return data.value <= 100;
      }
      return true;
    },
    {
      message: 'Value must be <= 100 for PERCENT discount',
      path: ['value'],
    }
  )
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
  )
  .refine(
    (data) => {
      if (data.scope === 'PRODUCTS' && data.product_ids !== undefined) {
        return Array.isArray(data.product_ids) && data.product_ids.length > 0;
      }
      return true;
    },
    {
      message: 'scope=PRODUCTS requires non-empty product_ids',
      path: ['product_ids'],
    }
  );

const listDiscountsQuerySchema = zod.object({
  page: zod.string().optional(),
  limit: zod.string().optional(),
  search: zod.string().optional(),
  is_active: zod
    .union([zod.boolean(), zod.enum(['true', 'false'])])
    .transform((val) => (val === 'true' || val === true ? true : val === 'false' || val === false ? false : undefined))
    .optional(),
  scope: zod.enum(['PRODUCTS', 'SUBSCRIPTION']).optional(),
  state: zod.enum(['active', 'expired', 'exhausted']).optional(),
});

module.exports = {
  createDiscountSchema,
  updateDiscountSchema,
  listDiscountsQuerySchema,
};

