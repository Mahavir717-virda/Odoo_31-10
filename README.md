# Odoo X FLUX - Brightloop Subscription Management System

Comprehensive subscription management, billing engine, quotation templates, discount rules, invoices, payments, and reporting portal.

## Quick Start (Full Stack)

### 1. Prerequisites
- Docker & Docker Compose
- Node.js v18+ (tested with Node 20 / 22)
- PostgreSQL 16 (via Docker)

### 2. Start PostgreSQL Database
```bash
docker compose up -d
```

### 3. Backend Setup & Seed
```bash
cd backend
npm install
cp .env.example .env   # configure SMTP / secrets if needed
npm run seed           # seeds demo users, catalog, plans, discounts, templates
# Optional: npm run seed:large (seeds 5,000 subscriptions, 10,000 invoices for benchmark)
npm run dev            # runs backend API server on http://localhost:5000
```

### 4. Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env   # ensure VITE_USE_MOCK=false to target backend API
npm run dev            # runs Vite frontend on http://localhost:5173
```

---

## Default Demo Credentials

- **Admin**: `admin@brightloop.test` / `Admin@1234` (Role: `ADMIN`)
- **Staff**: `staff@brightloop.test` / `Staff@1234` (Role: `STAFF`)
- **Customer 1**: `customer1@acme.test` / `Customer@1234` (Role: `CUSTOMER`, Acme Corporation)
- **Customer 2**: `customer2@globex.test` / `Customer@1234` (Role: `CUSTOMER`, Globex Inc)

---

## Validation & Benchmark Scripts

Run all verification suites directly with Node:

```bash
# Discount rule engine verification
node scripts/test-discounts.js

# Invoice generation, payment idempotency, and balance flows
node scripts/test-phase2.js

# Customer portal isolation, scoping, reports, and self-service
node scripts/test-phase3.js

# Large dataset latency & concurrency benchmark (all <2s target)
node scripts/timing-benchmark.js
```

---

## API Documentation & Postman Collection

- Complete API specification: `docs/api-contract.md`
- Postman Collection: `docs/postman_collection.json`
