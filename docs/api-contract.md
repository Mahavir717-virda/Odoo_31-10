# Brightloop Subscription Management System - API Contract (Phase 1)

Base URL: `http://localhost:5000/api`

## Response Format

### Success Standard Response
```json
{
  "success": true,
  "message": "Success",
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "email",
      "message": "Email already exists"
    }
  ]
}
```

---

## 1. Authentication (`/auth`)

Rate limited on `register`, `login`, and `forgot-password` (20 req / 15 min).

### POST `/auth/register`
- **Access**: Public
- **Validation**:
  - `name`: string, required
  - `email`: valid email, trimmed & lowercase
  - `password`: > 8 characters, min 1 uppercase, 1 lowercase, 1 special character
  - `phone`, `company`, `address`: optional strings
- **Behavior**: Inserts with role `CUSTOMER`, bcrypt 10 rounds. Duplicate email -> 409 `{ field: "email" }`.
- **Response**: 201 Created with `{ token, user }`.

### POST `/auth/login`
- **Access**: Public
- **Validation**: `email`, `password` required.
- **Behavior**: Case-insensitive email, returns generic 401 `"Invalid email or password"` for invalid credentials, rejects inactive accounts.
- **Response**: 200 OK with `{ token, user }`.

### POST `/auth/forgot-password`
- **Access**: Public
- **Validation**: `email` required.
- **Behavior**: If user exists, generates 32-byte crypto token, stores sha256 hash with 1 hour expiry, sends/logs reset link to console. Always responds 200 with generic message.

### POST `/auth/reset-password`
- **Access**: Public
- **Validation**: `token`, `password` (following password rules).
- **Behavior**: Finds user by sha256(token) unexpired, updates password_hash, clears reset token. 400 if invalid/expired.

### GET `/auth/me`
- **Access**: Authenticated (`ADMIN`, `STAFF`, `CUSTOMER`)
- **Response**: Current user profile without password/token fields.

---

## 2. Users (`/users`)

### POST `/users/staff`
- **Access**: `ADMIN`
- **Validation**: `name`, `email`, `password` (same password rules), optional `phone`, `company`, `address`.
- **Behavior**: Creates staff user with role `STAFF`.
- **Response**: 201 Created with created user (without password fields).

### GET `/users`
- **Access**: `ADMIN`, `STAFF`
- **Query Params**: `page`, `limit`, `role` (ADMIN, STAFF, CUSTOMER), `search`.
- **Behavior**:
  - `STAFF` can only list `role=CUSTOMER`.
  - Ordered by `id DESC`.
- **Response**: 200 OK with `{ users, meta }`.

---

## 3. Products (`/products`)

### GET `/products`
- **Access**: `ADMIN`, `STAFF`
- **Query Params**: `page`, `limit`, `search`, `type` (`SERVICE`, `GOODS`, `ADDON`), `is_active` (`true`|`false`).
- **Behavior**: Lists products with nested `variants` and joined tax info. Ordered by `id DESC`.

### GET `/products/:id`
- **Access**: `ADMIN`, `STAFF`
- **Response**: Product with nested `variants` and joined tax.

### POST `/products`
- **Access**: `ADMIN`
- **Body**: `{ name, type, sales_price, cost_price, tax_id, notes, is_active, variants: [{ attribute, value, extra_price }] }`
- **Behavior**: Creates product and variants in a single transaction.

### PUT `/products/:id`
- **Access**: `ADMIN`
- **Behavior**: Updates product and variants in a single transaction. Updates variants with `id`, creates new variants, deletes omitted ones. If a deleted variant is referenced by subscription, template, or invoice lines, returns 409 `"Variant is in use"`.

### DELETE `/products/:id`
- **Access**: `ADMIN`
- **Behavior**: If product is referenced anywhere, sets `is_active = FALSE`. Otherwise deletes it and its variants.

---

## 4. Plans (`/plans`)

### GET `/plans`
- **Access**: `ADMIN`, `STAFF`
- **Query Params**: `page`, `limit`, `search`, `status` (`ACTIVE`, `PAUSED`, `CLOSED`), `billing_period` (`DAILY`, `WEEKLY`, `MONTHLY`, `YEARLY`).
- **Behavior**: Ordered by `id DESC`.

### GET `/plans/:id`
- **Access**: `ADMIN`, `STAFF`
- **Response**: Plan details.

### POST `/plans`
- **Access**: `ADMIN`
- **Validation**: `name`, `price`, `billing_period`, `start_date`, `end_date` (`end_date >= start_date`), `auto_close`, `closable`, `pausable`, `renewable`, `status`.

### PUT `/plans/:id`
- **Access**: `ADMIN`

### DELETE `/plans/:id`
- **Access**: `ADMIN`
- **Behavior**: If referenced by subscriptions or templates, returns 409 `"Plan is in use, close it instead"`. Otherwise deletes.

### PATCH `/plans/:id/close`
- **Access**: `ADMIN`
- **Behavior**: Atomically closes plan using `UPDATE ... WHERE closable = TRUE AND status <> 'CLOSED'`. 409 if not permitted or already closed.

### PATCH `/plans/:id/pause`
- **Access**: `ADMIN`
- **Behavior**: Atomically pauses plan using `UPDATE ... WHERE pausable = TRUE AND status = 'ACTIVE'`. 409 if not permitted.

### PATCH `/plans/:id/renew`
- **Access**: `ADMIN`
- **Behavior**: Atomically renews/activates plan using `UPDATE ... WHERE renewable = TRUE AND status <> 'ACTIVE'`. 409 if not permitted.

---

## 5. Taxes (`/taxes`)

### GET `/taxes`
- **Access**: `ADMIN`, `STAFF`
- **Query Params**: `page`, `limit`, `search`, `is_active`.
- **Behavior**: Ordered by `id DESC`.

### GET `/taxes/:id`
- **Access**: `ADMIN`, `STAFF`

### POST `/taxes`
- **Access**: `ADMIN`
- **Body**: `{ name, rate_percent, is_active }`

### PUT `/taxes/:id`
- **Access**: `ADMIN`

### DELETE `/taxes/:id`
- **Access**: `ADMIN`
- **Behavior**: If referenced by products or document lines, soft-deactivates (`is_active = FALSE`). Otherwise deletes.


---

## 6. Quotation Templates (`/quotation-templates`)

### GET `/quotation-templates`
- **Access**: `ADMIN`, `STAFF`
- **Query Params**: `page`, `limit`, `search`, `is_active`.
- **Behavior**: Lists quotation templates with joined `plan_name`. Ordered by `id DESC`.

### GET `/quotation-templates/:id`
- **Access**: `ADMIN`, `STAFF`
- **Behavior**: Returns template details with lines including `product_name`, `variant_label` (e.g. "Brand: Odoo"), and dynamic `unit_price` from `getVariantPrice`.

### POST `/quotation-templates`
- **Access**: `ADMIN`, `STAFF`
- **Body**: `{ name, validity_days, plan_id, payment_terms_days, notes, is_active, lines: [{ product_id, variant_id, quantity, tax_id }] }`
- **Behavior**: Validates plan exists, products/variants are valid, inserts header and lines in one transaction.

### PUT `/quotation-templates/:id`
- **Access**: `ADMIN`, `STAFF`
- **Behavior**: Replace-all lines on update inside a transaction.

### DELETE `/quotation-templates/:id`
- **Access**: `ADMIN`, `STAFF`
- **Behavior**: Deletes quotation template (or sets `is_active = FALSE` if referenced).

---

## 7. Subscriptions (`/subscriptions`)

### GET `/subscriptions`
- **Access**: `ADMIN`, `STAFF`, `CUSTOMER`
- **Query Params**: `page`, `limit`, `status`, `customer_id`, `search` (number or customer name via ILIKE), `from`, `to` (on `start_date`).
- **Behavior**: Single query join returning `customer_name`, `plan_name`, `plan_pausable`, `plan_closable`. For `CUSTOMER`, `customer_id` is locked to `req.user.id`. Ordered by `id DESC`.

### GET `/subscriptions/:id`
- **Access**: `ADMIN`, `STAFF`, `CUSTOMER`
- **Behavior**: Returns subscription and nested lines. If role is `CUSTOMER` and subscription does not belong to the user, returns 404.

### POST `/subscriptions`
- **Access**: `ADMIN`, `STAFF`
- **Body**: `{ customer_id, plan_id, start_date, expiry_date, payment_terms_days, notes, lines: [{ product_id, variant_id, description, quantity, tax_id }] }`
- **Behavior**:
  - Validates customer exists with role `CUSTOMER`.
  - Validates plan exists and status is `ACTIVE`.
  - Validates `start_date` is inside plan availability window.
  - Validates total quantity of lines >= `plan.min_quantity` (400 if violated).
  - Validates `expiry_date >= start_date`.
  - Runs in single transaction: generates number via `nextSubscriptionNumber` (`SUB-0001`), inserts header with `status = 'DRAFT'` and computed totals, inserts snapshot lines.

### PUT `/subscriptions/:id`
- **Access**: `ADMIN`, `STAFF`
- **Behavior**: Only allowed while status is `DRAFT` or `QUOTATION` (otherwise 409). Replaces lines and recomputes totals in a transaction.

### POST `/subscriptions/from-template/:id`
- **Access**: `ADMIN`, `STAFF`
- **Body**: `{ customer_id, start_date }`
- **Behavior**: Copies plan, `payment_terms_days`, and lines from template, sets `template_id` and `quotation_valid_until = start_date + validity_days`, status `DRAFT`. Returns full subscription.

### PATCH `/subscriptions/:id/status`
- **Access**: `ADMIN`, `STAFF`
- **Body**: `{ status }`
- **Behavior**:
  - Validates strict step-by-step transition (`DRAFT` -> `QUOTATION` -> `CONFIRMED` -> `ACTIVE` -> `CLOSED`). Invalid jump returns 409 "Cannot move from X to Y".
  - Uses atomic update `UPDATE ... WHERE id=$1 AND status=$2` to ensure double-click safety.
  - Side effects:
    - Transition to `QUOTATION`: sets `quotation_valid_until` if empty (today + 30 days).
    - Transition to `ACTIVE`: requires at least one line and sets `next_billing_date = start_date`.
    - Transition to `CLOSED`: clears `next_billing_date = NULL` and sets `is_paused = FALSE`.
