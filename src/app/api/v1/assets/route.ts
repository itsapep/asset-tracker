import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { assets, officeAppliances, vehicles, locations } from '@/db/schema';
import { eq, and, isNull, like, or, sql, SQL } from 'drizzle-orm';

// GET /api/v1/assets
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const offset = (page - 1) * limit;

    const type = searchParams.get('type') as 'appliance' | 'vehicle' | null;
    const locationId = searchParams.get('location_id');
    const status = searchParams.get('status') as "active" | "idle" | "under_maintenance" | "disposed" | null;
    const q = searchParams.get('q');

    const conditions: SQL[] = [isNull(assets.deletedAt)];

    if (type) {
      conditions.push(eq(assets.assetType, type));
    }
    if (locationId) {
      conditions.push(eq(assets.locationId, locationId));
    }
    if (status) {
      conditions.push(eq(assets.status, status));
    }
    if (q) {
      const nameLike = like(assets.assetName, `%${q}%`);
      const tagLike = like(assets.assetTagCode, `%${q}%`);
      const orCondition = or(nameLike, tagLike);
      if (orCondition) {
        conditions.push(orCondition);
      }
    }

    const whereClause = and(...conditions);

    // Get total count
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(assets)
      .where(whereClause);
    const total = Number(countResult?.count || 0);

    // Fetch assets with joins
    // We fetch assets and left join both officeAppliances and vehicles
    const records = await db
      .select()
      .from(assets)
      .leftJoin(officeAppliances, eq(assets.assetId, officeAppliances.assetId))
      .leftJoin(vehicles, eq(assets.assetId, vehicles.assetId))
      .leftJoin(locations, eq(assets.locationId, locations.locationId))
      .where(whereClause)
      .limit(limit)
      .offset(offset);

    // Format output data nicely
    const data = records.map((record) => {
      const { assets: asset, office_appliances: appliance, vehicles: vehicle, locations: location } = record;
      return {
        ...asset,
        location,
        details: asset.assetType === 'appliance' ? appliance : vehicle,
      };
    });

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
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

// POST /api/v1/assets
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      asset_tag_code,
      asset_type,
      asset_name,
      status,
      location_id,
      cost_center_id,
      purchase_date,
      purchase_cost,
      vendor_name,
      warranty_expiry,
      details,
    } = body;

    // Validate required base fields
    if (!asset_tag_code || !asset_type || !asset_name || !location_id || !cost_center_id || !purchase_date || !purchase_cost || !vendor_name) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Missing required base asset fields',
          },
        },
        { status: 400 }
      );
    }

    // Purchase date validation
    const pDate = new Date(purchase_date);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Allow purchase date up to end of today
    if (pDate > today) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Purchase date cannot be in the future',
          },
        },
        { status: 400 }
      );
    }

    // Check asset tag uniqueness
    const [existingAsset] = await db
      .select()
      .from(assets)
      .where(eq(assets.assetTagCode, asset_tag_code))
      .limit(1);

    if (existingAsset) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DUPLICATE_TAG',
            message: `Asset tag code '${asset_tag_code}' is already registered`,
          },
        },
        { status: 400 }
      );
    }

    // Validate child details depending on type
    if (asset_type === 'appliance') {
      if (!details || !details.brand || !details.model_number || !details.serial_number) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Missing required office appliance details (brand, model_number, serial_number)',
            },
          },
          { status: 400 }
        );
      }

      // Check serial number uniqueness
      const [existingAppliance] = await db
        .select()
        .from(officeAppliances)
        .where(eq(officeAppliances.serialNumber, details.serial_number))
        .limit(1);

      if (existingAppliance) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'DUPLICATE_SERIAL',
              message: `Appliance serial number '${details.serial_number}' is already registered`,
            },
          },
          { status: 400 }
        );
      }
    } else if (asset_type === 'vehicle') {
      if (
        !details ||
        !details.license_plate ||
        !details.vin_number ||
        !details.engine_number ||
        !details.make ||
        !details.model ||
        !details.manufacture_year ||
        !details.fuel_type ||
        details.current_odometer === undefined ||
        !details.registration_expiry ||
        !details.insurance_policy_no ||
        !details.insurance_expiry
      ) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Missing required vehicle details',
            },
          },
          { status: 400 }
        );
      }

      // Check license plate uniqueness
      const [existingPlate] = await db
        .select()
        .from(vehicles)
        .where(eq(vehicles.licensePlate, details.license_plate))
        .limit(1);
      if (existingPlate) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'DUPLICATE_PLATE',
              message: `Vehicle license plate '${details.license_plate}' is already registered`,
            },
          },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: "Invalid asset_type. Must be 'appliance' or 'vehicle'",
          },
        },
        { status: 400 }
      );
    }

    // Insert using transaction
    const result = await db.transaction(async (tx) => {
      const [newAsset] = await tx
        .insert(assets)
        .values({
          assetTagCode: asset_tag_code,
          assetType: asset_type,
          assetName: asset_name,
          status: status || 'active',
          locationId: location_id,
          costCenterId: cost_center_id,
          purchaseDate: purchase_date,
          purchaseCost: purchase_cost,
          vendorName: vendor_name,
          warrantyExpiry: warranty_expiry || null,
        })
        .returning();

      let childRecord = null;
      if (asset_type === 'appliance') {
        [childRecord] = await tx
          .insert(officeAppliances)
          .values({
            assetId: newAsset.assetId,
            brand: details.brand,
            modelNumber: details.model_number,
            serialNumber: details.serial_number,
            powerRatingWatts: details.power_rating_watts || null,
            isBulk: details.is_bulk || false,
            quantity: details.quantity || 1,
          })
          .returning();
      } else {
        [childRecord] = await tx
          .insert(vehicles)
          .values({
            assetId: newAsset.assetId,
            licensePlate: details.license_plate,
            vinNumber: details.vin_number,
            engineNumber: details.engine_number,
            make: details.make,
            model: details.model,
            manufactureYear: details.manufacture_year,
            fuelType: details.fuel_type,
            currentOdometer: details.current_odometer,
            registrationExpiry: details.registration_expiry,
            safetyInspectionExpiry: details.safety_inspection_expiry || null,
            insurancePolicyNo: details.insurance_policy_no,
            insuranceExpiry: details.insurance_expiry,
          })
          .returning();
      }

      return {
        ...newAsset,
        details: childRecord,
      };
    });

    return NextResponse.json({
      success: true,
      data: result,
    }, { status: 201 });
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
