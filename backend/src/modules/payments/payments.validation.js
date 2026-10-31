const { z } = require('zod');
const { todayDate } = require('../../utils/dates');

const createPaymentSchema = z.object({
  invoice_id: z.coerce.number().int().positive('invoice_id must be a positive integer'),
  method: z.enum(['CASH', 'CARD', 'UPI', 'BANK_TRANSFER', 'CHEQUE', 'ONLINE']),
  amount: z.coerce.number().positive('amount must be greater than 0'),
  payment_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'payment_date must be YYYY-MM-DD')
    .optional()
    .default(() => todayDate()),
  note: z.string().trim().optional(),
});

const listPaymentsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  method: z.enum(['CASH', 'CARD', 'UPI', 'BANK_TRANSFER', 'CHEQUE', 'ONLINE']).optional(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'from must be YYYY-MM-DD').optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'to must be YYYY-MM-DD').optional(),
  search: z.string().trim().optional(),
});

module.exports = {
  createPaymentSchema,
  listPaymentsQuerySchema,
};

