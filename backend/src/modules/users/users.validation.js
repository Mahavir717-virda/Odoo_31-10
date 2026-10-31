const zod = require('zod');
const { passwordSchema } = require('../auth/auth.validation');

const createStaffSchema = zod.object({
  name: zod.string({ required_error: 'Name is required' }).trim().min(1, 'Name is required'),
  email: zod
    .string({ required_error: 'Email is required' })
    .trim()
    .toLowerCase()
    .email('Invalid email address'),
  password: passwordSchema,
  phone: zod.string().optional().nullable(),
  company: zod.string().optional().nullable(),
  address: zod.string().optional().nullable(),
});

const listUsersQuerySchema = zod.object({
  page: zod.string().optional(),
  limit: zod.string().optional(),
  role: zod.enum(['ADMIN', 'STAFF', 'CUSTOMER']).optional(),
  search: zod.string().optional(),
});

module.exports = {
  createStaffSchema,
  listUsersQuerySchema,
};

