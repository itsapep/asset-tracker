import { describe, it, beforeEach, after, mock } from 'node:test';
import assert from 'node:assert';
import { NextRequest } from 'next/server';
import { resetDatabase } from '@/db/test-helper';
import { client, db } from '@/db';
import { assets, statusChangeRequests, users } from '@/db/schema';
import { eq } from 'drizzle-orm';

// Import handlers after mocking
import { POST as postStatusChange, GET as getStatusChanges } from './route';
import { PATCH as patchStatusChange } from './[id]/route';

describe('Status Change Requests API Tests', () => {
  let ids: { applianceAssetId: string; vehicleAssetId: string; vehicleId: string };

  beforeEach(async () => {
    ids = await resetDatabase();

    // Insert mock users to satisfy FK constraint
    await db.insert(users).values([
      { id: 'user-admin-id', name: 'System Admin', email: 'admin@example.com' },
      { id: 'hrga-user-id', name: 'HRGA User', email: 'hrga@example.com' },
      { id: 'finance-user-id', name: 'Finance User', email: 'finance@example.com' },
    ]);

    // Default mock session as admin
    (global as any).mockAuthSession = {
      user: {
        id: 'user-admin-id',
        name: 'System Admin',
        email: 'admin@example.com',
        roles: ['System Admin'],
        permissions: ['read:asset', 'update:asset', 'delete:asset'],
      }
    };
  });

  after(async () => {
    delete (global as any).mockAuthSession;
    await client.end();
  });

  it('should create pending request for appliance under_maintenance status request', async () => {
    const payload = {
      assetId: ids.applianceAssetId,
      requestedStatus: 'under_maintenance',
      reasonOrNotes: 'AC needs cleaning',
      estimatedCost: 1500000,
    };

    const req = new NextRequest('http://localhost:3000/api/v1/status-requests', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const response = await postStatusChange(req);
    const body = await response.json();

    assert.strictEqual(response.status, 200);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.message, 'Pending approval');
    assert.strictEqual(body.data.approvalStatus, 'pending_hrga');
  });

  it('should create pending request for high-cost vehicle maintenance', async () => {
    const payload = {
      assetId: ids.vehicleAssetId,
      requestedStatus: 'under_maintenance',
      reasonOrNotes: 'Engine overhaul needed',
      estimatedCost: 6000000, // Above 5M threshold
    };

    const req = new NextRequest('http://localhost:3000/api/v1/status-requests', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const response = await postStatusChange(req);
    const body = await response.json();

    assert.strictEqual(response.status, 200);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.message, 'Pending approval');
    assert.strictEqual(body.data.approvalStatus, 'pending_hrga');
  });

  it('should walk through sequential approval flow (pending_hrga -> pending_finance -> approved)', async () => {
    // 1. Submit high cost maintenance request
    const payload = {
      assetId: ids.vehicleAssetId,
      requestedStatus: 'under_maintenance',
      reasonOrNotes: 'Engine repair',
      estimatedCost: 7000000,
    };

    const postReq = new NextRequest('http://localhost:3000/api/v1/status-requests', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const postRes = await postStatusChange(postReq);
    const postBody = await postRes.json();
    const requestId = postBody.data.requestId;

    assert.strictEqual(postBody.data.approvalStatus, 'pending_hrga');

    // 2. HRGA Head approves
    (global as any).mockAuthSession = {
      user: {
        id: 'hrga-user-id',
        name: 'HRGA User',
        email: 'hrga@example.com',
        roles: ['HRGA Head'],
      }
    };

    const hrgaReq = new NextRequest(`http://localhost:3000/api/v1/status-requests/${requestId}`, {
      method: 'PATCH',
      body: JSON.stringify({ action: 'approve' }),
    });

    const hrgaRes = await patchStatusChange(hrgaReq, { params: Promise.resolve({ id: requestId }) });
    const hrgaBody = await hrgaRes.json();

    assert.strictEqual(hrgaRes.status, 200);
    assert.strictEqual(hrgaBody.data.approvalStatus, 'pending_finance');

    // 3. Finance User approves
    (global as any).mockAuthSession = {
      user: {
        id: 'finance-user-id',
        name: 'Finance User',
        email: 'finance@example.com',
        roles: ['Finance'],
      }
    };

    const finReq = new NextRequest(`http://localhost:3000/api/v1/status-requests/${requestId}`, {
      method: 'PATCH',
      body: JSON.stringify({ action: 'approve' }),
    });

    const finRes = await patchStatusChange(finReq, { params: Promise.resolve({ id: requestId }) });
    const finBody = await finRes.json();

    assert.strictEqual(finRes.status, 200);
    assert.strictEqual(finBody.data.approvalStatus, 'approved');

    // 4. Verify that asset status is now updated to under_maintenance
    const [updatedAsset] = await db.select().from(assets).where(eq(assets.assetId, ids.vehicleAssetId)).limit(1);
    assert.strictEqual(updatedAsset.status, 'under_maintenance');
  });

  it('should prevent non-HRGA user from approving pending_hrga request', async () => {
    // 1. Submit high cost request
    const payload = {
      assetId: ids.vehicleAssetId,
      requestedStatus: 'disposed',
      reasonOrNotes: 'Discard vehicle',
    };

    const postReq = new NextRequest('http://localhost:3000/api/v1/status-requests', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const postRes = await postStatusChange(postReq);
    const postBody = await postRes.json();
    const requestId = postBody.data.requestId;

    // 2. Finance User tries to approve HRGA step (forbidden)
    (global as any).mockAuthSession = {
      user: {
        id: 'finance-user-id',
        name: 'Finance User',
        email: 'finance@example.com',
        roles: ['Finance'],
      }
    };

    const finReq = new NextRequest(`http://localhost:3000/api/v1/status-requests/${requestId}`, {
      method: 'PATCH',
      body: JSON.stringify({ action: 'approve' }),
    });

    const finRes = await patchStatusChange(finReq, { params: Promise.resolve({ id: requestId }) });
    assert.strictEqual(finRes.status, 403);
  });

  it('should bypass finance approval when changing status to idle and approved by HRGA Head', async () => {
    // 1. Submit request to change to idle
    const payload = {
      assetId: ids.vehicleAssetId,
      requestedStatus: 'idle',
      reasonOrNotes: 'Vehicle not in use',
    };

    const postReq = new NextRequest('http://localhost:3000/api/v1/status-requests', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const postRes = await postStatusChange(postReq);
    const postBody = await postRes.json();
    const requestId = postBody.data.requestId;

    assert.strictEqual(postBody.data.approvalStatus, 'pending_hrga');

    // 2. HRGA Head approves
    (global as any).mockAuthSession = {
      user: {
        id: 'hrga-user-id',
        name: 'HRGA User',
        email: 'hrga@example.com',
        roles: ['HRGA Head'],
      }
    };

    const hrgaReq = new NextRequest(`http://localhost:3000/api/v1/status-requests/${requestId}`, {
      method: 'PATCH',
      body: JSON.stringify({ action: 'approve' }),
    });

    const hrgaRes = await patchStatusChange(hrgaReq, { params: Promise.resolve({ id: requestId }) });
    const hrgaBody = await hrgaRes.json();

    assert.strictEqual(hrgaRes.status, 200);
    assert.strictEqual(hrgaBody.data.approvalStatus, 'approved'); // Bypasses pending_finance!

    // 3. Verify asset status in DB
    const [updatedAsset] = await db.select().from(assets).where(eq(assets.assetId, ids.vehicleAssetId)).limit(1);
    assert.strictEqual(updatedAsset.status, 'idle');
  });
});
