import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { assets, statusChangeRequests } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/auth';

// POST /api/v1/status-requests
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { assetId, requestedStatus, reasonOrNotes, evidenceUrl, estimatedCost } = body;

    if (!assetId || !requestedStatus) {
      return NextResponse.json({ error: 'Missing assetId or requestedStatus' }, { status: 400 });
    }

    // Fetch the asset
    const [asset] = await db
      .select()
      .from(assets)
      .where(eq(assets.assetId, assetId))
      .limit(1);

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    // All status changes require approval unconditionally
    const requiresApproval = true;

    if (!requiresApproval) {
      // Auto-approve: Update asset status directly
      const [updatedAsset] = await db
        .update(assets)
        .set({
          status: requestedStatus,
          updatedAt: new Date(),
        })
        .where(eq(assets.assetId, assetId))
        .returning();

      return NextResponse.json({
        success: true,
        message: 'Auto-approved',
        data: updatedAsset,
      });
    }

    // Create a status change request
    const [newRequest] = await db
      .insert(statusChangeRequests)
      .values({
        assetId,
        requestedStatus,
        reasonOrNotes: reasonOrNotes || '',
        evidenceUrl: evidenceUrl || null,
        estimatedCost: estimatedCost !== undefined && estimatedCost !== null ? String(estimatedCost) : null,
        approvalStatus: 'pending_hrga',
      })
      .returning();

    return NextResponse.json({
      success: true,
      message: 'Pending approval',
      data: newRequest,
    });
  } catch (error) {
    console.error('Error creating status request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/v1/status-requests
// Fetch status change requests with asset information
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    const query = db
      .select({
        request: statusChangeRequests,
        asset: assets,
      })
      .from(statusChangeRequests)
      .innerJoin(assets, eq(statusChangeRequests.assetId, assets.assetId));

    const results = (await query) as {
      request: typeof statusChangeRequests.$inferSelect;
      asset: typeof assets.$inferSelect;
    }[];
    const mapped = results.map((r) => ({
      ...r.request,
      asset: r.asset,
    }));

    return NextResponse.json({
      success: true,
      data: mapped,
    });
  } catch (error) {
    console.error('Error fetching status requests:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
