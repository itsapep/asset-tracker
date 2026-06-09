# Implementation Plan: Asset Management Tracking System

## 🎯 Overview
This document outlines the step-by-step implementation plan to build an enterprise-grade, location-centric Asset Management Tracking System. The system addresses operational leakages by providing real-time tracking of assets, strict relational integrity via PostgreSQL, and location-based auditing.

### Tech Stack
- **Framework:** Next.js (App Router Route Handlers)
- **Database ORM:** Drizzle ORM
- **Database:** PostgreSQL
- **Language:** TypeScript

---

## 🏗️ Phase 1: Project Setup & Initialization

### Task 1.1: Initialize Next.js Project
1. Bootstrap a new Next.js project using App Router, TypeScript, and Tailwind CSS.
   ```bash
   npx create-next-app@latest asset-tracker --typescript --tailwind --eslint --app
   cd asset-tracker
   ```
2. Install database dependencies:
   ```bash
   npm install drizzle-orm postgres
   npm install -D drizzle-kit @types/pg dotenv
   ```

### Task 1.2: Environment Configuration
1. Create a `.env.local` file with the following database connection string:
   ```env
   DATABASE_URL=postgresql://user:password@localhost:5432/asset_tracker
   ```

---

## 🗄️ Phase 2: Database Schema (Drizzle ORM)

Create the following database schema using Drizzle ORM. Ensure that **soft deletions** (`deleted_at`) are implemented for core entities to preserve historical records.

### Task 2.1: Enums & Shared Fields
1. Define PostgreSQL Enums in Drizzle:
   - `asset_type_enum`: 'appliance', 'vehicle'
   - `asset_status_enum`: 'active', 'idle', 'under_maintenance', 'disposed'
   - `fuel_type_enum`: 'gasoline', 'diesel', 'electric', 'hybrid'

### Task 2.2: Master Supporting Tables
1. **`locations` Table**:
   - `location_id` (PK, varchar)
   - `site_name` (varchar)
   - `floor` (varchar)
   - `room_or_section` (varchar)
2. **`cost_centers` Table**:
   - `cost_center_id` (PK, varchar)
   - `department_name` (varchar)
   - `division` (varchar)

### Task 2.3: Core `assets` Table
1. Define the `assets` table:
   - `asset_id` (PK, uuid, default random)
   - `asset_tag_code` (varchar, unique)
   - `asset_type` (enum)
   - `asset_name` (varchar, not null)
   - `status` (enum, not null)
   - `location_id` (varchar, FK to `locations.location_id`)
   - `cost_center_id` (varchar, FK to `cost_centers.cost_center_id`)
   - `purchase_date` (date)
   - `purchase_cost` (decimal(15,2))
   - `vendor_name` (varchar)
   - `warranty_expiry` (date, nullable)
   - `created_at` (timestamp, default now)
   - `updated_at` (timestamp, default now)
   - `deleted_at` (timestamp, nullable) - **Crucial for soft deletes**

### Task 2.4: Specialized Child Tables (1:1 Relationship)
1. **`office_appliances` Table**:
   - `appliance_id` (PK, uuid)
   - `asset_id` (uuid, FK to `assets.asset_id`)
   - `brand` (varchar)
   - `model_number` (varchar)
   - `serial_number` (varchar, unique)
   - `power_rating_watts` (int, nullable)
   - `is_bulk` (boolean, default false)
   - `quantity` (int, default 1)
2. **`vehicles` Table**:
   - `vehicle_id` (PK, uuid)
   - `asset_id` (uuid, FK to `assets.asset_id`)
   - `license_plate` (varchar, unique, not null)
   - `vin_number` (varchar, unique)
   - `engine_number` (varchar, unique)
   - `make` (varchar)
   - `model` (varchar)
   - `manufacture_year` (int)
   - `fuel_type` (enum)
   - `current_odometer` (int, not null)
   - `registration_expiry` (date, not null)
   - `safety_inspection_expiry` (date, nullable)
   - `insurance_policy_no` (varchar)
   - `insurance_expiry` (date)

### Task 2.5: Audit & Operations Logs
1. **`odometer_logs` Table**: Records changes when odometer is updated.
2. **`discrepancy_logs` Table**: Records mismatched locations during field audits.

---

## 🌱 Phase 3: Database Seeder

Create a robust seeder script (`seed.ts`) to populate the database with realistic mock data.

### Task 3.1: Seeder Script Setup
1. Create a seeder file that uses Drizzle to connect and insert data.
2. Provide a command in `package.json` to run the seeder: `"db:seed": "tsx seed.ts"`

### Task 3.2: Generate Mock Data
You can use manual arrays or mock libraries (like `@faker-js/faker`) to generate:
1. **Locations:** `LOC-JKT-HQ-03` ("Jakarta Head Office", "Floor 3", "Meeting Room Alpha"), etc.
2. **Cost Centers:** `CC-HR-001` ("Human Resources"), `CC-ADM-102` ("General Affairs"), etc.
3. **Assets:** Seed 20+ base assets with varied statuses.
4. **Child Records:** Link office appliances (TVs, Projectors) and vehicles (Vans, Executive Cars) to the seeded assets. Ensure unique constraints are respected.

---

## 🔐 Phase 4: Middleware & Soft Deletes

### Task 4.1: RBAC Middleware
1. Create a `middleware.ts` file in the Next.js root.
2. Implement header-based or token-based interception:
   - **Admin / GA Reader**: Allow only `GET` methods.
   - **Admin / GA Editor**: Allow `GET`, `POST`, `PATCH`, `PUT`.
   - **Super Admin / Finance**: Allow all methods, including operations that re-assign `cost_center_id` or change `deleted_at`.

### Task 4.2: Soft Delete Architecture
1. **NEVER** use SQL `DELETE` for assets.
2. For any "delete" endpoint, execute an `UPDATE` to set `deleted_at = NOW()` and `status = 'disposed'`.
3. In all `GET` queries (listing assets), strictly append `.where(isNull(assets.deletedAt))` in Drizzle.

---

## 📡 Phase 5: API Endpoints Implementation

Use Next.js Route Handlers (`app/api/.../route.ts`). All responses MUST follow:
- **Success:** `{ "success": true, "data": [...] }`
- **Error:** `{ "success": false, "error": { "code": "...", "message": "..." } }`

### Task 5.1: Core Asset Management
1. `POST /api/v1/assets`
   - **Action:** Onboard new asset. Handle Drizzle database transactions to insert into `assets` AND the respective child table (`office_appliances` or `vehicles`).
   - **Validation:** Check `asset_tag_code` uniqueness. `purchase_date` <= today.
2. `GET /api/v1/assets`
   - **Action:** List assets with server-side pagination (`page`, `limit`), filtering (`type`, `location_id`, `status`), and partial text search on `asset_name` or `asset_tag_code`. Exclude soft-deleted items.
3. `PATCH /api/v1/assets/[id]`
   - **Action:** Update specific attributes (e.g., `status`, `location_id`).

### Task 5.2: Vehicle Operations & Compliance
1. `POST /api/v1/vehicles/[id]/odometer`
   - **Action:** Read current odometer. Validate `new_odometer_reading > current_odometer`. Update `vehicles` table and insert log into `odometer_logs`.
2. `GET /api/v1/compliance/upcoming-expirations`
   - **Action:** Fetch vehicles where `registration_expiry`, `safety_inspection_expiry`, or `insurance_expiry` is within the `days_threshold` (default 30 days).

### Task 5.3: Location-Based Auditing
1. `POST /api/v1/audit/scan`
   - **Action:** Take `scanned_tag_code` and `actual_location_id`.
   - **Logic Flow:** Look up asset. If `location_id` matches `actual_location_id`, return `{ status: "MATCH" }`.
   - If mismatched, do NOT update `assets` table. Insert into `discrepancy_logs` and return `{ status: "MISMATCH", original_location: {...} }`.

---

## ✅ Phase 6: Testing & Verification
1. Verify database migrations run cleanly (`drizzle-kit push` or `migrate`).
2. Run the seeder and manually inspect the PostgreSQL tables.
3. Test all API endpoints using Postman or cURL to ensure standard JSON response structure.
4. Attempt a soft delete and verify the record disappears from `GET /api/v1/assets` but remains in the DB.
5. Attempt auditing a mismatched location and verify `discrepancy_logs` is populated.
