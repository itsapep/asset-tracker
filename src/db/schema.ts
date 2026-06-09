import { pgTable, pgEnum, uuid, varchar, integer, decimal, timestamp, boolean, date, text, primaryKey } from 'drizzle-orm/pg-core';
import type { AdapterAccountType } from 'next-auth/adapters';

// Enums
export const assetTypeEnum = pgEnum('asset_type_enum', ['appliance', 'vehicle']);
export const assetStatusEnum = pgEnum('asset_status_enum', ['active', 'idle', 'under_maintenance', 'disposed']);
export const fuelTypeEnum = pgEnum('fuel_type_enum', ['gasoline', 'diesel', 'electric', 'hybrid']);

// Tables
export const locations = pgTable('locations', {
  locationId: varchar('location_id').primaryKey(),
  siteName: varchar('site_name').notNull(),
  floor: varchar('floor').notNull(),
  roomOrSection: varchar('room_or_section').notNull(),
});

export const costCenters = pgTable('cost_centers', {
  costCenterId: varchar('cost_center_id').primaryKey(),
  departmentName: varchar('department_name').notNull(),
  division: varchar('division').notNull(),
});

export const assets = pgTable('assets', {
  assetId: uuid('asset_id').defaultRandom().primaryKey(),
  assetTagCode: varchar('asset_tag_code').unique().notNull(),
  assetType: assetTypeEnum('asset_type').notNull(),
  assetName: varchar('asset_name').notNull(),
  status: assetStatusEnum('status').default('active').notNull(),
  locationId: varchar('location_id').references(() => locations.locationId).notNull(),
  costCenterId: varchar('cost_center_id').references(() => costCenters.costCenterId).notNull(),
  purchaseDate: date('purchase_date').notNull(),
  purchaseCost: decimal('purchase_cost', { precision: 15, scale: 2 }).notNull(),
  vendorName: varchar('vendor_name').notNull(),
  warrantyExpiry: date('warranty_expiry'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

export const officeAppliances = pgTable('office_appliances', {
  applianceId: uuid('appliance_id').defaultRandom().primaryKey(),
  assetId: uuid('asset_id').references(() => assets.assetId, { onDelete: 'cascade' }).notNull(),
  brand: varchar('brand').notNull(),
  modelNumber: varchar('model_number').notNull(),
  serialNumber: varchar('serial_number').unique().notNull(),
  powerRatingWatts: integer('power_rating_watts'),
  isBulk: boolean('is_bulk').default(false).notNull(),
  quantity: integer('quantity').default(1).notNull(),
});

export const vehicles = pgTable('vehicles', {
  vehicleId: uuid('vehicle_id').defaultRandom().primaryKey(),
  assetId: uuid('asset_id').references(() => assets.assetId, { onDelete: 'cascade' }).notNull(),
  licensePlate: varchar('license_plate').unique().notNull(),
  vinNumber: varchar('vin_number').unique().notNull(),
  engineNumber: varchar('engine_number').unique().notNull(),
  make: varchar('make').notNull(),
  model: varchar('model').notNull(),
  manufactureYear: integer('manufacture_year').notNull(),
  fuelType: fuelTypeEnum('fuel_type').notNull(),
  currentOdometer: integer('current_odometer').notNull(),
  registrationExpiry: date('registration_expiry').notNull(),
  safetyInspectionExpiry: date('safety_inspection_expiry'),
  insurancePolicyNo: varchar('insurance_policy_no').notNull(),
  insuranceExpiry: date('insurance_expiry').notNull(),
});

export const odometerLogs = pgTable('odometer_logs', {
  logId: uuid('log_id').defaultRandom().primaryKey(),
  vehicleId: uuid('vehicle_id').references(() => vehicles.vehicleId, { onDelete: 'cascade' }).notNull(),
  oldReading: integer('old_reading').notNull(),
  newReading: integer('new_reading').notNull(),
  recordedAt: timestamp('recorded_at').defaultNow().notNull(),
});

export const discrepancyLogs = pgTable('discrepancy_logs', {
  logId: uuid('log_id').defaultRandom().primaryKey(),
  assetId: uuid('asset_id').references(() => assets.assetId, { onDelete: 'cascade' }).notNull(),
  expectedLocationId: varchar('expected_location_id').references(() => locations.locationId).notNull(),
  scannedLocationId: varchar('scanned_location_id').references(() => locations.locationId).notNull(),
  recordedAt: timestamp('recorded_at').defaultNow().notNull(),
});

// NextAuth & RBAC Tables
export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  password: text("password"),
});

export const accounts = pgTable("account", {
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").$type<AdapterAccountType>().notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("providerAccountId").notNull(),
  refresh_token: text("refresh_token"),
  access_token: text("access_token"),
  expires_at: integer("expires_at"),
  token_type: text("token_type"),
  scope: text("scope"),
  id_token: text("id_token"),
  session_state: text("session_state"),
},
(account) => [
  primaryKey({ columns: [account.provider, account.providerAccountId] }),
]);

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable("verificationToken", {
  identifier: text("identifier").notNull(),
  token: text("token").notNull(),
  expires: timestamp("expires", { mode: "date" }).notNull(),
},
(vt) => [
  primaryKey({ columns: [vt.identifier, vt.token] }),
]);

export const roles = pgTable("roles", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").unique().notNull(),
  description: text("description"),
});

export const permissions = pgTable("permissions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").unique().notNull(),
  description: text("description"),
});

export const rolePermissions = pgTable("role_permissions", {
  roleId: text("role_id").notNull().references(() => roles.id, { onDelete: "cascade" }),
  permissionId: text("permission_id").notNull().references(() => permissions.id, { onDelete: "cascade" }),
}, (t) => [
  primaryKey({ columns: [t.roleId, t.permissionId] }),
]);

export const userRoles = pgTable("user_roles", {
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  roleId: text("role_id").notNull().references(() => roles.id, { onDelete: "cascade" }),
}, (t) => [
  primaryKey({ columns: [t.userId, t.roleId] }),
]);

// Approval Workflow Tables
export const approvalStatusEnum = pgEnum('approval_status_enum', ['pending_hrga', 'pending_finance', 'approved', 'rejected']);

export const statusChangeRequests = pgTable('status_change_requests', {
  requestId: uuid('request_id').defaultRandom().primaryKey(),
  assetId: uuid('asset_id').references(() => assets.assetId, { onDelete: 'cascade' }).notNull(),
  requestedStatus: assetStatusEnum('requested_status').notNull(),
  reasonOrNotes: text('reason_or_notes').notNull(),
  evidenceUrl: varchar('evidence_url'), // Link from Vercel Blob
  estimatedCost: decimal('estimated_cost', { precision: 15, scale: 2 }), // Used for maintenance threshold logic
  approvalStatus: approvalStatusEnum('approval_status').default('pending_hrga').notNull(),
  hrgaReviewedBy: text('hrga_reviewed_by').references(() => users.id), // Foreign key for HRGA Head
  financeReviewedBy: text('finance_reviewed_by').references(() => users.id), // Foreign key for Finance User
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

