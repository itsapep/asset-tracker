import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { assets, locations, costCenters, vehicles, officeAppliances, statusChangeRequests } from '@/db/schema';
import { eq, and, or } from 'drizzle-orm';

// GET /api/v1/assets/[id]
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    // 1. Fetch base asset with relations
    const [assetRecord] = await db
      .select({
        asset: assets,
        location: locations,
        costCenter: costCenters,
      })
      .from(assets)
      .leftJoin(locations, eq(assets.locationId, locations.locationId))
      .leftJoin(costCenters, eq(assets.costCenterId, costCenters.costCenterId))
      .where(eq(assets.assetId, id))
      .limit(1);

    if (!assetRecord) {
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

    // 2. Fetch specific details based on asset type
    let details = null;
    if (assetRecord.asset.assetType === 'vehicle') {
      const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.assetId, id));
      details = vehicle;
    } else {
      const [appliance] = await db.select().from(officeAppliances).where(eq(officeAppliances.assetId, id));
      details = appliance;
    }

    // 3. Check for any pending status requests
    const pendingRequests = await db
      .select({ id: statusChangeRequests.requestId })
      .from(statusChangeRequests)
      .where(
        and(
          eq(statusChangeRequests.assetId, id),
          or(
            eq(statusChangeRequests.approvalStatus, 'pending_hrga'),
            eq(statusChangeRequests.approvalStatus, 'pending_finance')
          )
        )
      )
      .limit(1);

    const hasPendingRequest = pendingRequests.length > 0;

    // 4. Return aggregated object
    return NextResponse.json({
      success: true,
      data: {
        ...assetRecord.asset,
        location: assetRecord.location,
        costCenter: assetRecord.costCenter,
        details,
        hasPendingRequest,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: errorMessage,
        },
      },
      { status: 500 }
    );
  }
}

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
    const updateData: Partial<typeof assets.$inferInsert> = {};
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

    if (body.details !== undefined && body.details !== null) {
      if (existingAsset.assetType === 'vehicle') {
        const vehicleUpdate: Partial<typeof vehicles.$inferInsert> = {};
        if (body.details.licensePlate !== undefined) vehicleUpdate.licensePlate = body.details.licensePlate;
        if (body.details.vinNumber !== undefined) vehicleUpdate.vinNumber = body.details.vinNumber;
        if (body.details.engineNumber !== undefined) vehicleUpdate.engineNumber = body.details.engineNumber;
        if (body.details.make !== undefined) vehicleUpdate.make = body.details.make;
        if (body.details.model !== undefined) vehicleUpdate.model = body.details.model;
        if (body.details.manufactureYear !== undefined) vehicleUpdate.manufactureYear = body.details.manufactureYear;
        if (body.details.fuelType !== undefined) vehicleUpdate.fuelType = body.details.fuelType;
        if (body.details.currentOdometer !== undefined) vehicleUpdate.currentOdometer = body.details.currentOdometer;
        if (body.details.registrationExpiry !== undefined) vehicleUpdate.registrationExpiry = body.details.registrationExpiry;
        if (body.details.safetyInspectionExpiry !== undefined) vehicleUpdate.safetyInspectionExpiry = body.details.safetyInspectionExpiry;
        if (body.details.insurancePolicyNo !== undefined) vehicleUpdate.insurancePolicyNo = body.details.insurancePolicyNo;
        if (body.details.insuranceExpiry !== undefined) vehicleUpdate.insuranceExpiry = body.details.insuranceExpiry;

        await db.update(vehicles).set(vehicleUpdate).where(eq(vehicles.assetId, id));
      } else if (existingAsset.assetType === 'appliance') {
        const applianceUpdate: Partial<typeof officeAppliances.$inferInsert> = {};
        if (body.details.brand !== undefined) applianceUpdate.brand = body.details.brand;
        if (body.details.modelNumber !== undefined) applianceUpdate.modelNumber = body.details.modelNumber;
        if (body.details.serialNumber !== undefined) applianceUpdate.serialNumber = body.details.serialNumber;
        if (body.details.powerRatingWatts !== undefined) applianceUpdate.powerRatingWatts = body.details.powerRatingWatts;
        if (body.details.isBulk !== undefined) applianceUpdate.isBulk = body.details.isBulk;
        if (body.details.quantity !== undefined) applianceUpdate.quantity = body.details.quantity;

        await db.update(officeAppliances).set(applianceUpdate).where(eq(officeAppliances.assetId, id));
      }
    }

    return NextResponse.json({
      success: true,
      data: updatedAsset,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: errorMessage,
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
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: errorMessage,
        },
      },
      { status: 500 }
    );
  }
}
