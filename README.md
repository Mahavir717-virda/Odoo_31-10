# Odoo X FLUX - Brightloop Subscription Management System

## Backend Architecture & Skeleton (BE1, Phase 0)

### How to run

1. **Start database container:**
   ```bash
   docker compose up -d
   ```

2. **Install backend dependencies:**
   ```bash
   cd backend
   npm i
   ```

3. **Seed database:**
   ```bash
   npm run seed
   ```

4. **Start backend development server:**
   ```bash
   npm run dev
   ```

### Default Seed Credentials

- **Admin**: `admin@brightloop.test` / `Admin@1234` (Role: `ADMIN`)
- **Staff**: `staff@brightloop.test` / `Staff@1234` (Role: `STAFF`)
- **Customer 1**: `customer1@acme.test` / `Customer@1234` (Role: `CUSTOMER`, Acme Corporation)
- **Customer 2**: `customer2@globex.test` / `Customer@1234` (Role: `CUSTOMER`, Globex Inc)
