import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { assets } from '@/db/schema';
import { eq, and, isNull } from 'drizzle-orm';

// PATCH /api/v1/assets/[id]
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const role = request.headers.get('x-role');
    const body = await request.json();

    // Fetch existing asset (including soft-deleted if admin/finance)
    const [existingAsset] = await db
      .select()
      .from(assets)
      .where(eq(assets.assetId, id))
      .limit(1);

    if (!existingAsset) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Asset with ID '${id}' not found`,
          },
        },
        { status: 404 }
      );
    }

    // RBAC validation for GA Editor
    if (role === 'editor') {
      // Cannot alter cost_center_id
      if (body.cost_center_id !== undefined && body.cost_center_id !== existingAsset.costCenterId) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'Editor role is not authorized to alter cost center bindings',
            },
          },
          { status: 403 }
        );
      }

      // Cannot change deleted_at or execute disposal/deletion
      if (body.deleted_at !== undefined) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'Editor role is not authorized to alter deletion timestamps',
            },
          },
          { status: 403 }
        );
      }

      if (body.status === 'disposed') {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'Editor role is not authorized to dispose assets',
            },
          },
          { status: 403 }
        );
      }
    }

    // Update object building
    const updateData: any = {};
    if (body.asset_name !== undefined) updateData.assetName = body.asset_name;
    if (body.status !== undefined) {
      updateData.status = body.status;
      // If status is updated to 'disposed' by admin/finance, automatically set deletedAt
      if (body.status === 'disposed' && !existingAsset.deletedAt) {
        updateData.deletedAt = new Date();
      }
    }
    if (body.location_id !== undefined) updateData.locationId = body.location_id;
    if (body.cost_center_id !== undefined) updateData.costCenterId = body.cost_center_id;
    if (body.purchase_date !== undefined) updateData.purchaseDate = body.purchase_date;
    if (body.purchase_cost !== undefined) updateData.purchaseCost = body.purchase_cost;
    if (body.vendor_name !== undefined) updateData.vendorName = body.vendor_name;
    if (body.warranty_expiry !== undefined) updateData.warrantyExpiry = body.warranty_expiry;
    if (body.deleted_at !== undefined) {
      updateData.deletedAt = body.deleted_at ? new Date(body.deleted_at) : null;
    }

    updateData.updatedAt = new Date();

    const [updatedAsset] = await db
      .update(assets)
      .set(updateData)
      .where(eq(assets.assetId, id))
      .returning();

    return NextResponse.json({
      success: true,
      data: updatedAsset,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'An unexpected error occurred',
        },
      },
      { status: 500 }
    );
  }
}

// DELETE /api/v1/assets/[id] (Soft delete)
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const role = request.headers.get('x-role');

    // Only Admin/Finance allowed to delete
    if (role !== 'admin' && role !== 'finance') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Only Admin/Finance roles are authorized to run deletions or disposals',
          },
        },
        { status: 403 }
      );
    }

    const [existingAsset] = await db
      .select()
      .from(assets)
      .where(eq(assets.assetId, id))
      .limit(1);

    if (!existingAsset) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Asset with ID '${id}' not found`,
          },
        },
        { status: 404 }
      );
    }

    // Execute soft delete: set status to 'disposed' and deleted_at to current timestamp
    const [deletedAsset] = await db
      .update(assets)
      .set({
        status: 'disposed',
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(assets.assetId, id))
      .returning();

    return NextResponse.json({
      success: true,
      data: deletedAsset,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'An unexpected error occurred',
        },
      },
      { status: 500 }
    );
  }
}
