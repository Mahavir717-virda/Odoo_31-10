--                   ======
-- Brightloop Subscription Management System: FROZEN SCHEMA (v1)
-- PostgreSQL 16. Runs automatically on first container start.
-- Reset everything:  docker compose down -v && docker compose up -d
-- Rules: money = NUMERIC(12,2), dates = DATE, timestamps = TIMESTAMPTZ.
-- Statuses are stored as UPPERCASE text guarded by CHECK constraints.
-- App code (not triggers) sets updated_at and generates document numbers.
--                   ======

-- ---------- Number sequences (SUB-0001, INV-0001) ----------
-- App: 'SUB-' || lpad(nextval('subscription_number_seq')::text, 4, '0')
CREATE SEQUENCE subscription_number_seq START 1;
CREATE SEQUENCE invoice_number_seq      START 1;

-- ---------- USERS (admin, staff, customers) ----------
CREATE TABLE users (
  id                    SERIAL PRIMARY KEY,
  name                  VARCHAR(120) NOT NULL,
  email                 VARCHAR(255) NOT NULL,
  password_hash         VARCHAR(255) NOT NULL,
  role                  VARCHAR(10)  NOT NULL DEFAULT 'CUSTOMER'
                        CHECK (role IN ('ADMIN','STAFF','CUSTOMER')),
  phone                 VARCHAR(30),
  company               VARCHAR(150),
  address               TEXT,
  is_active             BOOLEAN NOT NULL DEFAULT TRUE,
  reset_token_hash      VARCHAR(255),          -- sha256 of emailed token
  reset_token_expires   TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- One account per email, case-insensitive
CREATE UNIQUE INDEX uq_users_email ON users (LOWER(email));
CREATE INDEX idx_users_role ON users (role);

-- ---------- TAXES ----------
CREATE TABLE taxes (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(80) NOT NULL UNIQUE,        -- e.g. GST 18%
  rate_percent  NUMERIC(5,2) NOT NULL CHECK (rate_percent >= 0 AND rate_percent <= 100),
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------- PRODUCTS + VARIANTS ----------
CREATE TABLE products (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(150) NOT NULL,
  type          VARCHAR(20)  NOT NULL DEFAULT 'SERVICE'
                CHECK (type IN ('SERVICE','GOODS','ADDON')),
  sales_price   NUMERIC(12,2) NOT NULL CHECK (sales_price >= 0),
  cost_price    NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (cost_price >= 0),
  tax_id        INT REFERENCES taxes(id) ON DELETE SET NULL,   -- default tax
  notes         TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_products_active ON products (is_active);

-- Variant price = product.sales_price + extra_price  (e.g. brand=Odoo, +560)
CREATE TABLE product_variants (
  id            SERIAL PRIMARY KEY,
  product_id    INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  attribute     VARCHAR(60) NOT NULL,                -- e.g. Brand
  value         VARCHAR(60) NOT NULL,                -- e.g. Odoo
  extra_price   NUMERIC(12,2) NOT NULL DEFAULT 0,
  UNIQUE (product_id, attribute, value)
);
CREATE INDEX idx_variants_product ON product_variants (product_id);

-- ---------- PLANS ----------
CREATE TABLE plans (
  id               SERIAL PRIMARY KEY,
  name             VARCHAR(120) NOT NULL,
  price            NUMERIC(12,2) NOT NULL CHECK (price >= 0),
  billing_period   VARCHAR(10) NOT NULL
                   CHECK (billing_period IN ('DAILY','WEEKLY','MONTHLY','YEARLY')),
  min_quantity     INT NOT NULL DEFAULT 1 CHECK (min_quantity >= 1),
  start_date       DATE NOT NULL,                    -- available from
  end_date         DATE,                             -- available until (NULL = open)
  auto_close       BOOLEAN NOT NULL DEFAULT FALSE,   -- closes itself at end_date
  closable         BOOLEAN NOT NULL DEFAULT TRUE,    -- may be closed early
  pausable         BOOLEAN NOT NULL DEFAULT FALSE,
  renewable        BOOLEAN NOT NULL DEFAULT TRUE,
  status           VARCHAR(10) NOT NULL DEFAULT 'ACTIVE'
                   CHECK (status IN ('ACTIVE','PAUSED','CLOSED')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (end_date IS NULL OR end_date >= start_date)
);
CREATE INDEX idx_plans_status ON plans (status);
CREATE INDEX idx_plans_autoclose ON plans (end_date) WHERE auto_close AND status <> 'CLOSED';

-- ---------- QUOTATION TEMPLATES ----------
CREATE TABLE quotation_templates (
  id                  SERIAL PRIMARY KEY,
  name                VARCHAR(150) NOT NULL,
  validity_days       INT NOT NULL DEFAULT 30 CHECK (validity_days > 0),
  plan_id             INT NOT NULL REFERENCES plans(id),
  payment_terms_days  INT NOT NULL DEFAULT 15 CHECK (payment_terms_days >= 0),
  notes               TEXT,
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  created_by          INT REFERENCES users(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE quotation_template_lines (
  id            SERIAL PRIMARY KEY,
  template_id   INT NOT NULL REFERENCES quotation_templates(id) ON DELETE CASCADE,
  product_id    INT NOT NULL REFERENCES products(id),
  variant_id    INT REFERENCES product_variants(id),
  quantity      INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  tax_id        INT REFERENCES taxes(id)
);
CREATE INDEX idx_qtl_template ON quotation_template_lines (template_id);

-- ---------- DISCOUNTS ----------
CREATE TABLE discounts (
  id             SERIAL PRIMARY KEY,
  name           VARCHAR(120) NOT NULL,
  type           VARCHAR(10) NOT NULL CHECK (type IN ('FIXED','PERCENT')),
  value          NUMERIC(12,2) NOT NULL CHECK (value > 0),
  min_purchase   NUMERIC(12,2) NOT NULL DEFAULT 0,
  min_quantity   INT NOT NULL DEFAULT 0,
  start_date     DATE NOT NULL,
  end_date       DATE NOT NULL,
  usage_limit    INT CHECK (usage_limit IS NULL OR usage_limit > 0),  -- NULL = unlimited
  used_count     INT NOT NULL DEFAULT 0,
  scope          VARCHAR(12) NOT NULL DEFAULT 'SUBSCRIPTION'
                 CHECK (scope IN ('PRODUCTS','SUBSCRIPTION')),
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_by     INT REFERENCES users(id),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (end_date >= start_date),
  CHECK (type <> 'PERCENT' OR value <= 100)
);
CREATE INDEX idx_discounts_valid ON discounts (start_date, end_date) WHERE is_active;

-- Only used when scope = 'PRODUCTS'
CREATE TABLE discount_products (
  discount_id  INT NOT NULL REFERENCES discounts(id) ON DELETE CASCADE,
  product_id   INT NOT NULL REFERENCES products(id)  ON DELETE CASCADE,
  PRIMARY KEY (discount_id, product_id)
);

-- ---------- SUBSCRIPTIONS ----------
CREATE TABLE subscriptions (
  id                   SERIAL PRIMARY KEY,
  number               VARCHAR(20) NOT NULL UNIQUE,               -- SUB-0001
  customer_id          INT NOT NULL REFERENCES users(id),
  plan_id              INT NOT NULL REFERENCES plans(id),
  template_id          INT REFERENCES quotation_templates(id) ON DELETE SET NULL,
  status               VARCHAR(10) NOT NULL DEFAULT 'DRAFT'
                       CHECK (status IN ('DRAFT','QUOTATION','CONFIRMED','ACTIVE','CLOSED')),
  is_paused            BOOLEAN NOT NULL DEFAULT FALSE,            -- billing skipped while true
  start_date           DATE NOT NULL,
  expiry_date          DATE,
  quotation_valid_until DATE,
  next_billing_date    DATE,                                      -- set on ACTIVE; advanced after each invoice
  payment_terms_days   INT NOT NULL DEFAULT 15 CHECK (payment_terms_days >= 0),
  notes                TEXT,
  subtotal             NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax_total            NUMERIC(12,2) NOT NULL DEFAULT 0,
  total                NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_by           INT REFERENCES users(id),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (expiry_date IS NULL OR expiry_date >= start_date)
);
CREATE INDEX idx_sub_customer ON subscriptions (customer_id);
CREATE INDEX idx_sub_status   ON subscriptions (status);
CREATE INDEX idx_sub_plan     ON subscriptions (plan_id);
CREATE INDEX idx_sub_dates    ON subscriptions (start_date, expiry_date);
-- billing job: "ACTIVE, not paused, next_billing_date <= today"
CREATE INDEX idx_sub_due ON subscriptions (next_billing_date)
  WHERE status = 'ACTIVE' AND is_paused = FALSE;

CREATE TABLE subscription_lines (
  id                SERIAL PRIMARY KEY,
  subscription_id   INT NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  product_id        INT NOT NULL REFERENCES products(id),
  variant_id        INT REFERENCES product_variants(id),
  description       VARCHAR(255),
  quantity          INT NOT NULL CHECK (quantity > 0),
  unit_price        NUMERIC(12,2) NOT NULL,       -- sales_price + variant extra_price, snapshotted
  tax_id            INT REFERENCES taxes(id),
  tax_rate          NUMERIC(5,2) NOT NULL DEFAULT 0,   -- snapshot of rate
  tax_amount        NUMERIC(12,2) NOT NULL DEFAULT 0,
  amount            NUMERIC(12,2) NOT NULL        -- quantity * unit_price (before tax)
);
CREATE INDEX idx_subline_sub ON subscription_lines (subscription_id);

-- ---------- INVOICES ----------
CREATE TABLE invoices (
  id                SERIAL PRIMARY KEY,
  number            VARCHAR(20) NOT NULL UNIQUE,                  -- INV-0001
  subscription_id   INT NOT NULL REFERENCES subscriptions(id),
  customer_id       INT NOT NULL REFERENCES users(id),
  status            VARCHAR(10) NOT NULL DEFAULT 'DRAFT'
                    CHECK (status IN ('DRAFT','CONFIRMED','PAID','CANCELLED')),
  invoice_date      DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date          DATE NOT NULL,
  period_start      DATE NOT NULL,                                -- billing period covered
  period_end        DATE NOT NULL,
  subtotal          NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount_total    NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax_total         NUMERIC(12,2) NOT NULL DEFAULT 0,
  total             NUMERIC(12,2) NOT NULL DEFAULT 0,
  amount_paid       NUMERIC(12,2) NOT NULL DEFAULT 0,
  sent_at           TIMESTAMPTZ,
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (period_end >= period_start),
  CHECK (amount_paid >= 0 AND amount_paid <= total)
);
-- NO DOUBLE BILLING: one live invoice per subscription per period
-- (a CANCELLED invoice frees the period so it can be re-billed)
CREATE UNIQUE INDEX uq_invoice_sub_period
  ON invoices (subscription_id, period_start) WHERE status <> 'CANCELLED';
CREATE INDEX idx_inv_customer ON invoices (customer_id);
CREATE INDEX idx_inv_status   ON invoices (status);
CREATE INDEX idx_inv_date     ON invoices (invoice_date);
CREATE INDEX idx_inv_sub      ON invoices (subscription_id);
-- Overdue = status CONFIRMED AND due_date < today (computed, never stored)
CREATE INDEX idx_inv_overdue  ON invoices (due_date) WHERE status = 'CONFIRMED';

CREATE TABLE invoice_lines (
  id            SERIAL PRIMARY KEY,
  invoice_id    INT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  product_id    INT REFERENCES products(id),
  variant_id    INT REFERENCES product_variants(id),
  description   VARCHAR(255) NOT NULL,
  quantity      INT NOT NULL CHECK (quantity > 0),
  unit_price    NUMERIC(12,2) NOT NULL,
  tax_id        INT REFERENCES taxes(id),
  tax_rate      NUMERIC(5,2) NOT NULL DEFAULT 0,
  tax_amount    NUMERIC(12,2) NOT NULL DEFAULT 0,
  amount        NUMERIC(12,2) NOT NULL                -- quantity * unit_price (before tax)
);
CREATE INDEX idx_invline_invoice ON invoice_lines (invoice_id);

-- Which discount was applied to which invoice (also the usage log).
-- UNIQUE prevents applying the same discount twice to one invoice.
CREATE TABLE discount_usages (
  id           SERIAL PRIMARY KEY,
  discount_id  INT NOT NULL REFERENCES discounts(id),
  invoice_id   INT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  amount       NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (discount_id, invoice_id)
);
CREATE INDEX idx_discusage_invoice ON discount_usages (invoice_id);

-- ---------- PAYMENTS ----------
CREATE TABLE payments (
  id            SERIAL PRIMARY KEY,
  invoice_id    INT NOT NULL REFERENCES invoices(id),
  method        VARCHAR(15) NOT NULL
                CHECK (method IN ('CASH','CARD','UPI','BANK_TRANSFER','CHEQUE','ONLINE')),
  amount        NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  payment_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  note          TEXT,
  recorded_by   INT REFERENCES users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_pay_invoice ON payments (invoice_id);
CREATE INDEX idx_pay_date    ON payments (payment_date);
