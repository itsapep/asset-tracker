import { pgTable, pgEnum, uuid, varchar, integer, decimal, timestamp, boolean, date } from 'drizzle-orm/pg-core';

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
