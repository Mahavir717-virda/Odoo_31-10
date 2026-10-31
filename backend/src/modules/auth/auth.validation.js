const zod = require('zod');

// Password rules: > 8 chars (min 9), at least one uppercase, one lowercase, one special character
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{9,}$/;

const passwordSchema = zod
  .string({ required_error: 'Password is required' })
  .regex(
    passwordRegex,
    'Password must be more than 8 characters, containing at least one uppercase letter, one lowercase letter, and one special character'
  );

const registerSchema = zod.object({
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

const loginSchema = zod.object({
  email: zod
    .string({ required_error: 'Email is required' })
    .trim()
    .toLowerCase()
    .email('Invalid email address'),
  password: zod.string({ required_error: 'Password is required' }).min(1, 'Password is required'),
});

const forgotPasswordSchema = zod.object({
  email: zod
    .string({ required_error: 'Email is required' })
    .trim()
    .toLowerCase()
    .email('Invalid email address'),
});

const resetPasswordSchema = zod.object({
  token: zod.string({ required_error: 'Reset token is required' }).min(1, 'Reset token is required'),
  password: passwordSchema,
});

module.exports = {
  passwordSchema,
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
};

