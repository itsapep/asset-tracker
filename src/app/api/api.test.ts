import { describe, it, beforeEach, after } from 'node:test';
import assert from 'node:assert';
import { NextRequest } from 'next/server';
import { resetDatabase } from '@/db/test-helper';
import { client } from '@/db';

// Import route handlers
import { GET as getAssets, POST as postAssets } from '@/app/api/v1/assets/route';
import { GET as getAssetById, PATCH as patchAsset, DELETE as deleteAsset } from '@/app/api/v1/assets/[id]/route';
import { POST as postOdometer } from '@/app/api/v1/vehicles/[id]/odometer/route';
import { GET as getCompliance } from '@/app/api/v1/compliance/upcoming-expirations/route';
import { POST as postAuditScan } from '@/app/api/v1/audit/scan/route';

describe('Asset Management Tracking System API Tests', () => {
  let ids: { applianceAssetId: string; vehicleAssetId: string; vehicleId: string };

  // Reset database before each scenario
  beforeEach(async () => {
    ids = await resetDatabase();
  });

  after(async () => {
    await client.end();
  });

  describe('GET /api/v1/assets', () => {
    it('Scenario 1: Fetch assets successfully (default params)', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/assets', {
        headers: { 'x-role': 'reader' },
      });
      const response = await getAssets(req);
      const body = await response.json();

      assert.strictEqual(response.status, 200);
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.data.length, 2);
    });

    it('Scenario 2: Filter assets by type (appliance)', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/assets?type=appliance', {
        headers: { 'x-role': 'reader' },
      });
      const response = await getAssets(req);
      const body = await response.json();

      assert.strictEqual(body.success, true);
      assert.strictEqual(body.data.length, 1);
      assert.strictEqual(body.data[0].assetType, 'appliance');
    });

    it('Scenario 3: Search assets by text query (Sony)', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/assets?q=Sony', {
        headers: { 'x-role': 'reader' },
      });
      const response = await getAssets(req);
      const body = await response.json();

      assert.strictEqual(body.success, true);
      assert.strictEqual(body.data.length, 1);
      assert.ok(body.data[0].assetName.includes('Sony'));
    });

    it('Scenario 4: Empty results when filtering with nonexistent status', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/assets?status=disposed', {
        headers: { 'x-role': 'reader' },
      });
      const response = await getAssets(req);
      const body = await response.json();

      assert.strictEqual(body.success, true);
      assert.strictEqual(body.data.length, 0);
    });
  });

  describe('POST /api/v1/assets', () => {
    it('Scenario 5: Create a new appliance successfully', async () => {
      const payload = {
        asset_tag_code: 'AST-APP-999',
        asset_type: 'appliance',
        asset_name: 'LG Monitor 27"',
        status: 'active',
        location_id: 'LOC-JKT-HQ-03',
        cost_center_id: 'CC-ADM-102',
        purchase_date: '2026-06-01',
        purchase_cost: '4000000.00',
        vendor_name: 'LG Official',
        details: {
          brand: 'LG',
          model_number: '27MK400H',
          serial_number: 'SN-LG-MON-999',
          power_rating_watts: 30,
          is_bulk: false,
          quantity: 1,
        },
      };

      const req = new NextRequest('http://localhost:3000/api/v1/assets', {
        method: 'POST',
        headers: { 'x-role': 'editor', 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const response = await postAssets(req);
      const body = await response.json();

      assert.strictEqual(response.status, 201);
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.data.assetTagCode, 'AST-APP-999');
    });

    it('Scenario 6: Validation fails on future purchase date', async () => {
      const payload = {
        asset_tag_code: 'AST-APP-888',
        asset_type: 'appliance',
        asset_name: 'Monitor',
        status: 'active',
        location_id: 'LOC-JKT-HQ-03',
        cost_center_id: 'CC-ADM-102',
        purchase_date: '2028-12-31', // In the future!
        purchase_cost: '2000000.00',
        vendor_name: 'LG Store',
        details: {
          brand: 'LG',
          model_number: '27"',
          serial_number: 'SN-LG-888',
        },
      };

      const req = new NextRequest('http://localhost:3000/api/v1/assets', {
        method: 'POST',
        headers: { 'x-role': 'editor', 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const response = await postAssets(req);
      const body = await response.json();

      assert.strictEqual(response.status, 400);
      assert.strictEqual(body.success, false);
      assert.strictEqual(body.error.code, 'VALIDATION_ERROR');
    });

    it('Scenario 7: Uniqueness validation fails on duplicate asset tag', async () => {
      const payload = {
        asset_tag_code: 'AST-APP-001', // Already exists in test baseline
        asset_type: 'appliance',
        asset_name: 'Duplicate TV',
        status: 'active',
        location_id: 'LOC-JKT-HQ-03',
        cost_center_id: 'CC-ADM-102',
        purchase_date: '2025-01-15',
        purchase_cost: '15000000.00',
        vendor_name: 'Electronic City',
        details: {
          brand: 'Sony',
          model_number: 'KD-65X80L',
          serial_number: 'SN-SONY-NEW-001',
        },
      };

      const req = new NextRequest('http://localhost:3000/api/v1/assets', {
        method: 'POST',
        headers: { 'x-role': 'editor', 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const response = await postAssets(req);
      const body = await response.json();

      assert.strictEqual(response.status, 400);
      assert.strictEqual(body.success, false);
  });
});

  describe('GET /api/v1/assets/[id]', () => {
    it('Scenario X: Fetch a valid vehicle asset with relations', async () => {
      const req = new NextRequest(`http://localhost:3000/api/v1/assets/${ids.vehicleAssetId}`, {
        headers: { 'x-role': 'reader' },
      });
      const res = await getAssetById(req, { params: Promise.resolve({ id: ids.vehicleAssetId }) });
      const body = await res.json();

      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.data.assetType, 'vehicle');
      assert.ok(body.data.details.licensePlate);
      assert.ok(body.data.location.siteName);
      assert.ok(body.data.costCenter.departmentName);
    });

    it('Scenario Y: Fetch a valid appliance asset with relations', async () => {
      const req = new NextRequest(`http://localhost:3000/api/v1/assets/${ids.applianceAssetId}`, {
        headers: { 'x-role': 'reader' },
      });
      const res = await getAssetById(req, { params: Promise.resolve({ id: ids.applianceAssetId }) });
      const body = await res.json();

      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.data.assetType, 'appliance');
      assert.ok(body.data.details.serialNumber);
      assert.ok(body.data.location.siteName);
      assert.ok(body.data.costCenter.departmentName);
    });

    it('Scenario Z: Return 404 for non-existent asset ID', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const req = new NextRequest(`http://localhost:3000/api/v1/assets/${fakeId}`, {
        headers: { 'x-role': 'reader' },
      });
      const res = await getAssetById(req, { params: Promise.resolve({ id: fakeId }) });
      const body = await res.json();

      assert.strictEqual(res.status, 404);
      assert.strictEqual(body.success, false);
      assert.strictEqual(body.error.code, 'NOT_FOUND');
    });
  });

  describe('PATCH /api/v1/assets/[id]', () => {
    it('Scenario 8: GA Editor tries to alter cost center (should return 403)', async () => {
      const req = new NextRequest(`http://localhost:3000/api/v1/assets/${ids.applianceAssetId}`, {
        method: 'PATCH',
        headers: { 'x-role': 'editor', 'Content-Type': 'application/json' },
        body: JSON.stringify({ cost_center_id: 'CC-HR-001' }),
      });

      const response = await patchAsset(req, { params: Promise.resolve({ id: ids.applianceAssetId }) });
      const body = await response.json();

      assert.strictEqual(response.status, 403);
      assert.strictEqual(body.success, false);
    });

    it('Scenario 9: Admin successfully alters cost center', async () => {
      const req = new NextRequest(`http://localhost:3000/api/v1/assets/${ids.applianceAssetId}`, {
        method: 'PATCH',
        headers: { 'x-role': 'admin', 'Content-Type': 'application/json' },
        body: JSON.stringify({ cost_center_id: 'CC-HR-001' }),
      });

      const response = await patchAsset(req, { params: Promise.resolve({ id: ids.applianceAssetId }) });
      const body = await response.json();

      assert.strictEqual(response.status, 200);
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.data.costCenterId, 'CC-HR-001');
    });

    it('Scenario 10: GA Editor tries to set status to disposed (should return 403)', async () => {
      const req = new NextRequest(`http://localhost:3000/api/v1/assets/${ids.applianceAssetId}`, {
        method: 'PATCH',
        headers: { 'x-role': 'editor', 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'disposed' }),
      });

      const response = await patchAsset(req, { params: Promise.resolve({ id: ids.applianceAssetId }) });
      const body = await response.json();

      assert.strictEqual(response.status, 403);
      assert.strictEqual(body.success, false);
    });

    it('Scenario 10.1: Admin successfully updates vehicle nested details', async () => {
      const req = new NextRequest(`http://localhost:3000/api/v1/assets/${ids.vehicleAssetId}`, {
        method: 'PATCH',
        headers: { 'x-role': 'admin', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          asset_name: "Updated Vehicle Name",
          details: {
            licensePlate: "B 9999 ZZZ",
            make: "Toyota",
            model: "Camry"
          }
        }),
      });

      const response = await patchAsset(req, { params: Promise.resolve({ id: ids.vehicleAssetId }) });
      const body = await response.json();

      assert.strictEqual(response.status, 200);
      assert.strictEqual(body.success, true);

      // Verify the details in the DB
      const getReq = new NextRequest(`http://localhost:3000/api/v1/assets/${ids.vehicleAssetId}`, {
        headers: { 'x-role': 'reader' },
      });
      const getRes = await getAssetById(getReq, { params: Promise.resolve({ id: ids.vehicleAssetId }) });
      const getBody = await getRes.json();
      assert.strictEqual(getBody.data.assetName, "Updated Vehicle Name");
      assert.strictEqual(getBody.data.details.licensePlate, "B 9999 ZZZ");
      assert.strictEqual(getBody.data.details.make, "Toyota");
      assert.strictEqual(getBody.data.details.model, "Camry");
    });

    it('Scenario 10.2: Admin successfully updates appliance nested details', async () => {
      const req = new NextRequest(`http://localhost:3000/api/v1/assets/${ids.applianceAssetId}`, {
        method: 'PATCH',
        headers: { 'x-role': 'admin', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          asset_name: "Updated Appliance Name",
          details: {
            brand: "LG",
            modelNumber: "OLED65",
            serialNumber: "SN-LG-OLED-65",
            powerRatingWatts: 150
          }
        }),
      });

      const response = await patchAsset(req, { params: Promise.resolve({ id: ids.applianceAssetId }) });
      const body = await response.json();

      assert.strictEqual(response.status, 200);
      assert.strictEqual(body.success, true);

      // Verify details in DB
      const getReq = new NextRequest(`http://localhost:3000/api/v1/assets/${ids.applianceAssetId}`, {
        headers: { 'x-role': 'reader' },
      });
      const getRes = await getAssetById(getReq, { params: Promise.resolve({ id: ids.applianceAssetId }) });
      const getBody = await getRes.json();
      assert.strictEqual(getBody.data.assetName, "Updated Appliance Name");
      assert.strictEqual(getBody.data.details.brand, "LG");
      assert.strictEqual(getBody.data.details.modelNumber, "OLED65");
      assert.strictEqual(getBody.data.details.serialNumber, "SN-LG-OLED-65");
      assert.strictEqual(getBody.data.details.powerRatingWatts, 150);
    });
  });

  describe('DELETE /api/v1/assets/[id]', () => {
    it('Scenario 11: Editor tries to delete (should return 403)', async () => {
      const req = new NextRequest(`http://localhost:3000/api/v1/assets/${ids.applianceAssetId}`, {
        method: 'DELETE',
        headers: { 'x-role': 'editor' },
      });

      const response = await deleteAsset(req, { params: Promise.resolve({ id: ids.applianceAssetId }) });
      const body = await response.json();

      assert.strictEqual(response.status, 403);
      assert.strictEqual(body.success, false);
    });

    it('Scenario 12: Admin successfully soft deletes', async () => {
      const req = new NextRequest(`http://localhost:3000/api/v1/assets/${ids.applianceAssetId}`, {
        method: 'DELETE',
        headers: { 'x-role': 'admin' },
      });

      const response = await deleteAsset(req, { params: Promise.resolve({ id: ids.applianceAssetId }) });
      const body = await response.json();

      assert.strictEqual(response.status, 200);
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.data.status, 'disposed');
      assert.ok(body.data.deletedAt !== null);
    });
  });

  describe('POST /api/v1/vehicles/[id]/odometer', () => {
    it('Scenario 13: Odometer update with value less than or equal to current (should return 400)', async () => {
      const req = new NextRequest(`http://localhost:3000/api/v1/vehicles/${ids.vehicleAssetId}/odometer`, {
        method: 'POST',
        headers: { 'x-role': 'editor', 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_odometer_reading: 44000 }), // Current is 45000
      });

      const response = await postOdometer(req, { params: Promise.resolve({ id: ids.vehicleAssetId }) });
      const body = await response.json();

      assert.strictEqual(response.status, 400);
      assert.strictEqual(body.success, false);
      assert.strictEqual(body.error.code, 'VALIDATION_ERROR');
    });

    it('Scenario 14: Odometer update with value greater than current (should succeed)', async () => {
      const req = new NextRequest(`http://localhost:3000/api/v1/vehicles/${ids.vehicleAssetId}/odometer`, {
        method: 'POST',
        headers: { 'x-role': 'editor', 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_odometer_reading: 46000 }),
      });

      const response = await postOdometer(req, { params: Promise.resolve({ id: ids.vehicleAssetId }) });
      const body = await response.json();

      assert.strictEqual(response.status, 200);
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.data.currentOdometer, 46000);
    });
  });

  describe('GET /api/v1/compliance/upcoming-expirations', () => {
    it('Scenario 15: Retrieve expiring vehicles within threshold', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/compliance/upcoming-expirations?days=30', {
        headers: { 'x-role': 'reader' },
      });

      const response = await getCompliance(req);
      const body = await response.json();

      assert.strictEqual(response.status, 200);
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.data.length, 1); // Vehicle is set to expire in 15 days (B 1234 SFA)
    });
  });

  describe('POST /api/v1/audit/scan', () => {
    it('Scenario 16: Scans matching location (should return MATCH)', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/audit/scan', {
        method: 'POST',
        headers: { 'x-role': 'editor', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scanned_tag_code: 'AST-APP-001',
          actual_location_id: 'LOC-JKT-HQ-03', // Correct expected location
        }),
      });

      const response = await postAuditScan(req);
      const body = await response.json();

      assert.strictEqual(response.status, 200);
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.data.status, 'MATCH');
    });

    it('Scenario 17: Scans mismatched location (should return MISMATCH)', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/audit/scan', {
        method: 'POST',
        headers: { 'x-role': 'editor', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scanned_tag_code: 'AST-APP-001',
          actual_location_id: 'LOC-BDG-BR-01', // Mismatch!
        }),
      });

      const response = await postAuditScan(req);
      const body = await response.json();

      assert.strictEqual(response.status, 200);
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.data.status, 'MISMATCH');
      assert.strictEqual(body.data.original_location.locationId, 'LOC-JKT-HQ-03');
    });
  });
});
