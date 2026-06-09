import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { assets, locations, discrepancyLogs } from '@/db/schema';
import { eq, and, isNull } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { scanned_tag_code, actual_location_id } = body;

    if (!scanned_tag_code || !actual_location_id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: "Missing 'scanned_tag_code' or 'actual_location_id' in request body",
          },
        },
        { status: 400 }
      );
    }

    // Lookup asset and its expected location
    // Exclude soft-deleted assets
    const [assetRecord] = await db
      .select({
        asset: assets,
        expectedLocation: locations,
      })
      .from(assets)
      .innerJoin(locations, eq(assets.locationId, locations.locationId))
      .where(and(eq(assets.assetTagCode, scanned_tag_code), isNull(assets.deletedAt)))
      .limit(1);

    if (!assetRecord) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Active asset with tag code '${scanned_tag_code}' not found`,
          },
        },
        { status: 404 }
      );
    }

    const { asset, expectedLocation } = assetRecord;

    // Check if location is correct
    if (asset.locationId === actual_location_id) {
      return NextResponse.json({
        success: true,
        data: {
          status: 'MATCH',
        },
      });
    }

    // If mismatched:
    // 1. Insert log into discrepancy_logs
    await db.insert(discrepancyLogs).values({
      assetId: asset.assetId,
      expectedLocationId: asset.locationId,
      scannedLocationId: actual_location_id,
    });

    // 2. Return mismatch status with original expected location details
    return NextResponse.json({
      success: true,
      data: {
        status: 'MISMATCH',
        original_location: expectedLocation,
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
