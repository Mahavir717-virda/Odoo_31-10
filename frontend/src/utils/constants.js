export const API_BASE_URL =
  typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL
    ? import.meta.env.VITE_API_BASE_URL
    : 'http://localhost:8000/api';

export const REQUEST_TIMEOUT = 30000;

export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export const SUBSCRIPTION_STATUS = {
  active: 'active',
  draft: 'draft',
  pending: 'pending',
  expired: 'expired',
  cancelled: 'cancelled',
};

export const PAYMENT_STATUS = {
  paid: 'paid',
  unpaid: 'unpaid',
  partial: 'partial',
  refunded: 'refunded',
};

export const INVOICE_STATUS = {
  draft: 'draft',
  open: 'open',
  paid: 'paid',
  unpaid: 'unpaid',
  cancelled: 'cancelled',
};

export const USER_ROLES = {
  admin: 'admin',
  staff: 'staff',
  customer: 'customer',
};

export const STORAGE_KEYS = {
  auth_token: 'auth_token',
  auth_user: 'auth_user',
};

export const DATE_FORMAT = 'MMM d, yyyy';
export const DATE_TIME_FORMAT = 'MMM d, yyyy h:mm a';

export const EMPTY_STATE = '-';
