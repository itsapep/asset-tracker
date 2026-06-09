import { db } from './index';
import { locations, costCenters, assets, officeAppliances, vehicles, odometerLogs, discrepancyLogs } from './schema';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Clean existing records in reverse order
  console.log('🧹 Cleaning existing tables...');
  await db.delete(discrepancyLogs);
  await db.delete(odometerLogs);
  await db.delete(officeAppliances);
  await db.delete(vehicles);
  await db.delete(assets);
  await db.delete(costCenters);
  await db.delete(locations);

  // 2. Seed Locations
  console.log('📍 Seeding locations...');
  const locationsData = [
    { locationId: 'LOC-JKT-HQ-03', siteName: 'Jakarta Head Office', floor: 'Floor 3', roomOrSection: 'Meeting Room Alpha' },
    { locationId: 'LOC-JKT-HQ-04', siteName: 'Jakarta Head Office', floor: 'Floor 4', roomOrSection: 'GA Section' },
    { locationId: 'LOC-BDG-BR-01', siteName: 'Bandung Branch', floor: 'Floor 1', roomOrSection: 'Finance Section' },
    { locationId: 'LOC-SUB-BR-02', siteName: 'Surabaya Branch', floor: 'Floor 2', roomOrSection: 'Server Room' },
    { locationId: 'LOC-JKT-WH-01', siteName: 'Jakarta Warehouse', floor: 'Floor 1', roomOrSection: 'Storage Room A' },
  ];
  await db.insert(locations).values(locationsData);

  // 3. Seed Cost Centers
  console.log('💰 Seeding cost centers...');
  const costCentersData = [
    { costCenterId: 'CC-HR-001', departmentName: 'Human Resources', division: 'People & Culture' },
    { costCenterId: 'CC-ADM-102', departmentName: 'General Affairs', division: 'Operations' },
    { costCenterId: 'CC-FIN-201', departmentName: 'Finance & Accounts', division: 'Finance' },
  ];
  await db.insert(costCenters).values(costCentersData);

  // 4. Seed Assets (we need 20+ assets: some appliances, some vehicles)
  console.log('📦 Seeding assets...');
  
  const now = new Date();
  
  // Let's create arrays of assets
  const appliancesAssets = [
    {
      assetTagCode: 'AST-APP-001',
      assetType: 'appliance' as const,
      assetName: 'Sony Bravia 65" TV',
      status: 'active' as const,
      locationId: 'LOC-JKT-HQ-03',
      costCenterId: 'CC-ADM-102',
      purchaseDate: '2025-01-15',
      purchaseCost: '15000000.00',
      vendorName: 'Electronic City',
      warrantyExpiry: '2027-01-15',
    },
    {
      assetTagCode: 'AST-APP-002',
      assetType: 'appliance' as const,
      assetName: 'Epson Projector EB-FH06',
      status: 'active' as const,
      locationId: 'LOC-JKT-HQ-03',
      costCenterId: 'CC-ADM-102',
      purchaseDate: '2025-02-10',
      purchaseCost: '9500000.00',
      vendorName: 'Epson Official Store',
      warrantyExpiry: '2026-02-10',
    },
    {
      assetTagCode: 'AST-APP-003',
      assetType: 'appliance' as const,
      assetName: 'Daikin AC Split 1.5 PK',
      status: 'active' as const,
      locationId: 'LOC-JKT-HQ-04',
      costCenterId: 'CC-ADM-102',
      purchaseDate: '2024-05-20',
      purchaseCost: '6000000.00',
      vendorName: 'Daikin Center',
      warrantyExpiry: '2026-05-20',
    },
    {
      assetTagCode: 'AST-APP-004',
      assetType: 'appliance' as const,
      assetName: 'HP LaserJet Pro M404dn',
      status: 'idle' as const,
      locationId: 'LOC-BDG-BR-01',
      costCenterId: 'CC-FIN-201',
      purchaseDate: '2024-08-11',
      purchaseCost: '4500000.00',
      vendorName: 'Astragraphia',
      warrantyExpiry: '2025-08-11',
    },
    {
      assetTagCode: 'AST-APP-005',
      assetType: 'appliance' as const,
      assetName: 'Dell PowerEdge R750 Server',
      status: 'active' as const,
      locationId: 'LOC-SUB-BR-02',
      costCenterId: 'CC-ADM-102',
      purchaseDate: '2025-03-01',
      purchaseCost: '120000000.00',
      vendorName: 'Dell Indonesia',
      warrantyExpiry: '2028-03-01',
    },
    {
      assetTagCode: 'AST-APP-006',
      assetType: 'appliance' as const,
      assetName: 'Polycom Conference Station',
      status: 'under_maintenance' as const,
      locationId: 'LOC-JKT-HQ-03',
      costCenterId: 'CC-HR-001',
      purchaseDate: '2023-11-12',
      purchaseCost: '8000000.00',
      vendorName: 'Bhinneka',
      warrantyExpiry: '2024-11-12',
    },
    {
      assetTagCode: 'AST-APP-007',
      assetType: 'appliance' as const,
      assetName: 'LG Refrigerator GA-B379',
      status: 'active' as const,
      locationId: 'LOC-JKT-HQ-04',
      costCenterId: 'CC-ADM-102',
      purchaseDate: '2024-01-10',
      purchaseCost: '7000000.00',
      vendorName: 'Hartono Elektronik',
      warrantyExpiry: '2026-01-10',
    },
    {
      assetTagCode: 'AST-APP-008',
      assetType: 'appliance' as const,
      assetName: 'Sharp Microwave R-21D0(S)',
      status: 'active' as const,
      locationId: 'LOC-BDG-BR-01',
      costCenterId: 'CC-HR-001',
      purchaseDate: '2024-02-15',
      purchaseCost: '1800000.00',
      vendorName: 'Hartono Elektronik',
      warrantyExpiry: '2025-02-15',
    },
    {
      assetTagCode: 'AST-APP-009',
      assetType: 'appliance' as const,
      assetName: 'Water Dispenser Cosmos CWD-5603',
      status: 'active' as const,
      locationId: 'LOC-SUB-BR-02',
      costCenterId: 'CC-HR-001',
      purchaseDate: '2024-07-22',
      purchaseCost: '1200000.00',
      vendorName: 'Cosmos Official Store',
      warrantyExpiry: '2025-07-22',
    },
    {
      assetTagCode: 'AST-APP-010',
      assetType: 'appliance' as const,
      assetName: 'Cisco Catalyst Switch 9300',
      status: 'active' as const,
      locationId: 'LOC-SUB-BR-02',
      costCenterId: 'CC-ADM-102',
      purchaseDate: '2025-04-05',
      purchaseCost: '45000000.00',
      vendorName: 'Cisco Indonesia',
      warrantyExpiry: '2028-04-05',
    },
    {
      assetTagCode: 'AST-APP-011',
      assetType: 'appliance' as const,
      assetName: 'Aruba Access Point AP-515',
      status: 'active' as const,
      locationId: 'LOC-JKT-HQ-04',
      costCenterId: 'CC-ADM-102',
      purchaseDate: '2025-01-20',
      purchaseCost: '12000000.00',
      vendorName: 'Bhinneka',
      warrantyExpiry: '2027-01-20',
    },
    {
      assetTagCode: 'AST-APP-012',
      assetType: 'appliance' as const,
      assetName: 'Coffee Machine DeLonghi ECAM',
      status: 'active' as const,
      locationId: 'LOC-JKT-HQ-04',
      costCenterId: 'CC-HR-001',
      purchaseDate: '2024-09-15',
      purchaseCost: '22000000.00',
      vendorName: 'DeLonghi Official',
      warrantyExpiry: '2025-09-15',
    }
  ];

  const vehiclesAssets = [
    {
      assetTagCode: 'AST-VEH-001',
      assetType: 'vehicle' as const,
      assetName: 'Toyota Avanza 1.5G (GA Pool)',
      status: 'active' as const,
      locationId: 'LOC-JKT-WH-01',
      costCenterId: 'CC-ADM-102',
      purchaseDate: '2023-05-10',
      purchaseCost: '280000000.00',
      vendorName: 'Auto2000',
      warrantyExpiry: '2026-05-10',
    },
    {
      assetTagCode: 'AST-VEH-002',
      assetType: 'vehicle' as const,
      assetName: 'Toyota Innova Zenix (Exec Van)',
      status: 'active' as const,
      locationId: 'LOC-JKT-HQ-04',
      costCenterId: 'CC-ADM-102',
      purchaseDate: '2024-03-15',
      purchaseCost: '480000000.00',
      vendorName: 'Auto2000',
      warrantyExpiry: '2027-03-15',
    },
    {
      assetTagCode: 'AST-VEH-003',
      assetType: 'vehicle' as const,
      assetName: 'Daihatsu Gran Max (Courier)',
      status: 'active' as const,
      locationId: 'LOC-JKT-WH-01',
      costCenterId: 'CC-ADM-102',
      purchaseDate: '2022-07-20',
      purchaseCost: '170000000.00',
      vendorName: 'Astra Daihatsu',
      warrantyExpiry: '2025-07-20',
    },
    {
      assetTagCode: 'AST-VEH-004',
      assetType: 'vehicle' as const,
      assetName: 'Mitsubishi Fuso Box Truck',
      status: 'active' as const,
      locationId: 'LOC-JKT-WH-01',
      costCenterId: 'CC-ADM-102',
      purchaseDate: '2021-04-12',
      purchaseCost: '650000000.00',
      vendorName: 'Srikandi Mitsubishi',
      warrantyExpiry: '2024-04-12',
    },
    {
      assetTagCode: 'AST-VEH-005',
      assetType: 'vehicle' as const,
      assetName: 'Honda PCX 160 (Courier Motor)',
      status: 'active' as const,
      locationId: 'LOC-BDG-BR-01',
      costCenterId: 'CC-FIN-201',
      purchaseDate: '2024-06-02',
      purchaseCost: '35000000.00',
      vendorName: 'Astra Motor',
      warrantyExpiry: '2026-06-02',
    },
    {
      assetTagCode: 'AST-VEH-006',
      assetType: 'vehicle' as const,
      assetName: 'Wuling Air EV (GA Shuttle)',
      status: 'active' as const,
      locationId: 'LOC-JKT-HQ-03',
      costCenterId: 'CC-ADM-102',
      purchaseDate: '2024-10-10',
      purchaseCost: '220000000.00',
      vendorName: 'Wuling Arista',
      warrantyExpiry: '2027-10-10',
    },
    {
      assetTagCode: 'AST-VEH-007',
      assetType: 'vehicle' as const,
      assetName: 'Hyundai Ioniq 5 (CEO Car)',
      status: 'active' as const,
      locationId: 'LOC-JKT-HQ-04',
      costCenterId: 'CC-ADM-102',
      purchaseDate: '2025-02-18',
      purchaseCost: '850000000.00',
      vendorName: 'Hyundai Simprug',
      warrantyExpiry: '2028-02-18',
    },
    {
      assetTagCode: 'AST-VEH-008',
      assetType: 'vehicle' as const,
      assetName: 'Toyota Avanza (BDG Pool)',
      status: 'idle' as const,
      locationId: 'LOC-BDG-BR-01',
      costCenterId: 'CC-FIN-201',
      purchaseDate: '2023-08-14',
      purchaseCost: '270000000.00',
      vendorName: 'Auto2000',
      warrantyExpiry: '2026-08-14',
    },
    {
      assetTagCode: 'AST-VEH-009',
      assetType: 'vehicle' as const,
      assetName: 'Isuzu Elf Microbus',
      status: 'under_maintenance' as const,
      locationId: 'LOC-JKT-WH-01',
      costCenterId: 'CC-ADM-102',
      purchaseDate: '2020-11-30',
      purchaseCost: '420000000.00',
      vendorName: 'Astra Isuzu',
      warrantyExpiry: '2023-11-30',
    },
    {
      assetTagCode: 'AST-VEH-010',
      assetType: 'vehicle' as const,
      assetName: 'Toyota HiAce (Employee Shuttle)',
      status: 'disposed' as const,
      locationId: 'LOC-JKT-WH-01',
      costCenterId: 'CC-ADM-102',
      purchaseDate: '2019-02-15',
      purchaseCost: '550000000.00',
      vendorName: 'Auto2000',
      warrantyExpiry: '2022-02-15',
      deletedAt: now, // Soft deleted!
    }
  ];

  // Insert Appliances Assets
  const createdApplianceAssets = [];
  for (const assetData of appliancesAssets) {
    const [inserted] = await db.insert(assets).values(assetData).returning();
    createdApplianceAssets.push(inserted);
  }

  // Insert Vehicles Assets
  const createdVehicleAssets = [];
  for (const assetData of vehiclesAssets) {
    const [inserted] = await db.insert(assets).values(assetData).returning();
    createdVehicleAssets.push(inserted);
  }

  // 5. Seed Office Appliances Details
  console.log('🖥️ Seeding office appliances details...');
  const appliancesDetails = [
    { assetId: createdApplianceAssets[0].assetId, brand: 'Sony', modelNumber: 'KD-65X80L', serialNumber: 'SN-SONY-65X80L-001', powerRatingWatts: 230, isBulk: false, quantity: 1 },
    { assetId: createdApplianceAssets[1].assetId, brand: 'Epson', modelNumber: 'EB-FH06', serialNumber: 'SN-EPSON-FHO6-002', powerRatingWatts: 327, isBulk: false, quantity: 1 },
    { assetId: createdApplianceAssets[2].assetId, brand: 'Daikin', modelNumber: 'FTKC35TVM4', serialNumber: 'SN-DAIKIN-FTKC-003', powerRatingWatts: 960, isBulk: true, quantity: 4 },
    { assetId: createdApplianceAssets[3].assetId, brand: 'HP', modelNumber: 'M404dn', serialNumber: 'SN-HP-M404DN-004', powerRatingWatts: 495, isBulk: false, quantity: 1 },
    { assetId: createdApplianceAssets[4].assetId, brand: 'Dell', modelNumber: 'R750', serialNumber: 'SN-DELL-R750-005', powerRatingWatts: 1400, isBulk: false, quantity: 1 },
    { assetId: createdApplianceAssets[5].assetId, brand: 'Polycom', modelNumber: 'Trio 8800', serialNumber: 'SN-POLY-8800-006', powerRatingWatts: 20, isBulk: false, quantity: 1 },
    { assetId: createdApplianceAssets[6].assetId, brand: 'LG', modelNumber: 'GA-B379', serialNumber: 'SN-LG-GAB379-007', powerRatingWatts: 120, isBulk: false, quantity: 1 },
    { assetId: createdApplianceAssets[7].assetId, brand: 'Sharp', modelNumber: 'R-21D0(S)', serialNumber: 'SN-SHARP-R21D0-008', powerRatingWatts: 800, isBulk: false, quantity: 1 },
    { assetId: createdApplianceAssets[8].assetId, brand: 'Cosmos', modelNumber: 'CWD-5603', serialNumber: 'SN-COSMOS-CWD-009', powerRatingWatts: 385, isBulk: false, quantity: 1 },
    { assetId: createdApplianceAssets[9].assetId, brand: 'Cisco', modelNumber: 'C9300-48T-A', serialNumber: 'SN-CISCO-C9300-010', powerRatingWatts: 350, isBulk: false, quantity: 1 },
    { assetId: createdApplianceAssets[10].assetId, brand: 'Aruba', modelNumber: 'AP-515', serialNumber: 'SN-ARUBA-AP515-011', powerRatingWatts: 25, isBulk: true, quantity: 10 },
    { assetId: createdApplianceAssets[11].assetId, brand: 'DeLonghi', modelNumber: 'ECAM 22.110.B', serialNumber: 'SN-DELONG-22110-012', powerRatingWatts: 1450, isBulk: false, quantity: 1 },
  ];
  await db.insert(officeAppliances).values(appliancesDetails);

  // 6. Seed Vehicles Details
  console.log('🚗 Seeding vehicles details...');
  
  // Expirations calculations
  const dateOffset = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  const vehiclesDetails = [
    {
      assetId: createdVehicleAssets[0].assetId,
      licensePlate: 'B 1234 SFA',
      vinNumber: 'VIN-TOYOTA-AVANZA-001',
      engineNumber: 'ENG-1NR-FE-001',
      make: 'Toyota',
      model: 'Avanza',
      manufactureYear: 2023,
      fuelType: 'gasoline' as const,
      currentOdometer: 45000,
      registrationExpiry: dateOffset(15), // Expiring soon (15 days)
      safetyInspectionExpiry: dateOffset(120),
      insurancePolicyNo: 'POL-ASURANSI-AVANZA-001',
      insuranceExpiry: dateOffset(180),
    },
    {
      assetId: createdVehicleAssets[1].assetId,
      licensePlate: 'B 9999 XXX',
      vinNumber: 'VIN-TOYOTA-ZENIX-002',
      engineNumber: 'ENG-M20A-FXS-002',
      make: 'Toyota',
      model: 'Innova Zenix',
      manufactureYear: 2024,
      fuelType: 'hybrid' as const,
      currentOdometer: 18000,
      registrationExpiry: dateOffset(200),
      safetyInspectionExpiry: dateOffset(10), // Expiring soon (10 days)
      insurancePolicyNo: 'POL-ASURANSI-ZENIX-002',
      insuranceExpiry: dateOffset(200),
    },
    {
      assetId: createdVehicleAssets[2].assetId,
      licensePlate: 'B 8765 CDE',
      vinNumber: 'VIN-DAIHATSU-GMAX-003',
      engineNumber: 'ENG-3SZ-VE-003',
      make: 'Daihatsu',
      model: 'Gran Max',
      manufactureYear: 2022,
      fuelType: 'gasoline' as const,
      currentOdometer: 82000,
      registrationExpiry: dateOffset(40),
      safetyInspectionExpiry: dateOffset(40),
      insurancePolicyNo: 'POL-ASURANSI-GMAX-003',
      insuranceExpiry: dateOffset(-5), // Expired 5 days ago!
    },
    {
      assetId: createdVehicleAssets[3].assetId,
      licensePlate: 'B 9000 TYU',
      vinNumber: 'VIN-MITSUBISHI-FUSO-004',
      engineNumber: 'ENG-4D34-004',
      make: 'Mitsubishi',
      model: 'Fuso Colt Diesel',
      manufactureYear: 2021,
      fuelType: 'diesel' as const,
      currentOdometer: 135000,
      registrationExpiry: dateOffset(90),
      safetyInspectionExpiry: dateOffset(90),
      insurancePolicyNo: 'POL-ASURANSI-FUSO-004',
      insuranceExpiry: dateOffset(90),
    },
    {
      assetId: createdVehicleAssets[4].assetId,
      licensePlate: 'D 4567 ABC',
      vinNumber: 'VIN-HONDA-PCX-005',
      engineNumber: 'ENG-KF61E-005',
      make: 'Honda',
      model: 'PCX 160',
      manufactureYear: 2024,
      fuelType: 'gasoline' as const,
      currentOdometer: 12500,
      registrationExpiry: dateOffset(300),
      safetyInspectionExpiry: dateOffset(300),
      insurancePolicyNo: 'POL-ASURANSI-PCX-005',
      insuranceExpiry: dateOffset(300),
    },
    {
      assetId: createdVehicleAssets[5].assetId,
      licensePlate: 'B 2345 EV',
      vinNumber: 'VIN-WULING-AIREV-006',
      engineNumber: 'ENG-TZ155XS-006',
      make: 'Wuling',
      model: 'Air EV',
      manufactureYear: 2024,
      fuelType: 'electric' as const,
      currentOdometer: 9800,
      registrationExpiry: dateOffset(150),
      safetyInspectionExpiry: dateOffset(150),
      insurancePolicyNo: 'POL-ASURANSI-AIREV-006',
      insuranceExpiry: dateOffset(150),
    },
    {
      assetId: createdVehicleAssets[6].assetId,
      licensePlate: 'B 1 CEO',
      vinNumber: 'VIN-HYUNDAI-IONIQ-007',
      engineNumber: 'ENG-EM17-007',
      make: 'Hyundai',
      model: 'Ioniq 5',
      manufactureYear: 2025,
      fuelType: 'electric' as const,
      currentOdometer: 4200,
      registrationExpiry: dateOffset(350),
      safetyInspectionExpiry: dateOffset(350),
      insurancePolicyNo: 'POL-ASURANSI-IONIQ-007',
      insuranceExpiry: dateOffset(350),
    },
    {
      assetId: createdVehicleAssets[7].assetId,
      licensePlate: 'D 3333 XYZ',
      vinNumber: 'VIN-TOYOTA-AVANZA-008',
      engineNumber: 'ENG-1NR-FE-008',
      make: 'Toyota',
      model: 'Avanza',
      manufactureYear: 2023,
      fuelType: 'gasoline' as const,
      currentOdometer: 31000,
      registrationExpiry: dateOffset(180),
      safetyInspectionExpiry: dateOffset(180),
      insurancePolicyNo: 'POL-ASURANSI-AVANZA-008',
      insuranceExpiry: dateOffset(180),
    },
    {
      assetId: createdVehicleAssets[8].assetId,
      licensePlate: 'B 7890 VBN',
      vinNumber: 'VIN-ISUZU-ELF-009',
      engineNumber: 'ENG-4JH1-009',
      make: 'Isuzu',
      model: 'Elf',
      manufactureYear: 2020,
      fuelType: 'diesel' as const,
      currentOdometer: 198000,
      registrationExpiry: dateOffset(5), // Expiring soon (5 days)
      safetyInspectionExpiry: dateOffset(5), // Expiring soon
      insurancePolicyNo: 'POL-ASURANSI-ELF-009',
      insuranceExpiry: dateOffset(120),
    },
    {
      assetId: createdVehicleAssets[9].assetId,
      licensePlate: 'B 5555 SHL',
      vinNumber: 'VIN-TOYOTA-HIACE-010',
      engineNumber: 'ENG-1KD-010',
      make: 'Toyota',
      model: 'HiAce',
      manufactureYear: 2019,
      fuelType: 'diesel' as const,
      currentOdometer: 250000,
      registrationExpiry: dateOffset(-100),
      safetyInspectionExpiry: dateOffset(-100),
      insurancePolicyNo: 'POL-ASURANSI-HIACE-010',
      insuranceExpiry: dateOffset(-100),
    }
  ];

  const createdVehicles = [];
  for (const details of vehiclesDetails) {
    const [inserted] = await db.insert(vehicles).values(details).returning();
    createdVehicles.push(inserted);
  }

  // 7. Seed Odometer Logs
  console.log('📊 Seeding odometer logs...');
  const odometerLogsData = [
    { vehicleId: createdVehicles[0].vehicleId, oldReading: 40000, newReading: 45000, recordedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
    { vehicleId: createdVehicles[1].vehicleId, oldReading: 15000, newReading: 18000, recordedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
  ];
  await db.insert(odometerLogs).values(odometerLogsData);

  console.log('✅ Seeding complete!');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
