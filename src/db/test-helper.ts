import { db } from './index';
import { locations, costCenters, assets, officeAppliances, vehicles, odometerLogs, discrepancyLogs, users, roles, permissions, rolePermissions, userRoles, statusChangeRequests } from './schema';

let isMigrated = false;

export async function resetDatabase() {
  if (process.env.MOCK_DB === 'true' && !isMigrated) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { setupMockDb } = require('./mock-db');
    await setupMockDb();
    isMigrated = true;
  }

  // Clean tables
  await db.delete(statusChangeRequests);
  await db.delete(userRoles);
  await db.delete(rolePermissions);
  await db.delete(users);
  await db.delete(roles);
  await db.delete(permissions);
  await db.delete(discrepancyLogs);
  await db.delete(odometerLogs);
  await db.delete(officeAppliances);
  await db.delete(vehicles);
  await db.delete(assets);
  await db.delete(costCenters);
  await db.delete(locations);

  // Insert standard test locations
  await db.insert(locations).values([
    { locationId: 'LOC-JKT-HQ-03', siteName: 'Jakarta Head Office', floor: 'Floor 3', roomOrSection: 'Meeting Room Alpha' },
    { locationId: 'LOC-BDG-BR-01', siteName: 'Bandung Branch', floor: 'Floor 1', roomOrSection: 'Finance Section' },
  ]);

  // Insert standard test cost centers
  await db.insert(costCenters).values([
    { costCenterId: 'CC-HR-001', departmentName: 'Human Resources', division: 'People & Culture' },
    { costCenterId: 'CC-ADM-102', departmentName: 'General Affairs', division: 'Operations' },
  ]);

  // Insert baseline assets for testing
  const [applianceAsset] = await db.insert(assets).values({
    assetTagCode: 'AST-APP-001',
    assetType: 'appliance',
    assetName: 'Sony Bravia 65" TV',
    status: 'active',
    locationId: 'LOC-JKT-HQ-03',
    costCenterId: 'CC-ADM-102',
    purchaseDate: '2025-01-15',
    purchaseCost: '15000000.00',
    vendorName: 'Electronic City',
    warrantyExpiry: '2027-01-15',
  }).returning();

  await db.insert(officeAppliances).values({
    assetId: applianceAsset.assetId,
    brand: 'Sony',
    modelNumber: 'KD-65X80L',
    serialNumber: 'SN-SONY-65X80L-001',
    powerRatingWatts: 230,
    isBulk: false,
    quantity: 1,
  });

  const [vehicleAsset] = await db.insert(assets).values({
    assetTagCode: 'AST-VEH-001',
    assetType: 'vehicle',
    assetName: 'Toyota Avanza',
    status: 'active',
    locationId: 'LOC-BDG-BR-01',
    costCenterId: 'CC-ADM-102',
    purchaseDate: '2023-05-10',
    purchaseCost: '280000000.00',
    vendorName: 'Auto2000',
    warrantyExpiry: '2026-05-10',
  }).returning();

  const [insertedVehicle] = await db.insert(vehicles).values({
    assetId: vehicleAsset.assetId,
    licensePlate: 'B 1234 SFA',
    vinNumber: 'VIN-TOYOTA-AVANZA-001',
    engineNumber: 'ENG-1NR-FE-001',
    make: 'Toyota',
    model: 'Avanza',
    manufactureYear: 2023,
    fuelType: 'gasoline',
    currentOdometer: 45000,
    registrationExpiry: '2026-06-24',
    safetyInspectionExpiry: '2026-10-07',
    insurancePolicyNo: 'POL-ASURANSI-AVANZA-001',
    insuranceExpiry: '2026-12-06',
  }).returning();

  return {
    applianceAssetId: applianceAsset.assetId,
    vehicleAssetId: vehicleAsset.assetId,
    vehicleId: insertedVehicle.vehicleId,
  };
}
