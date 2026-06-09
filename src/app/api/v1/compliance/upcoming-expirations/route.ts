import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { vehicles, assets } from '@/db/schema';
import { eq, or, and, isNull, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const days = parseInt(searchParams.get('days') || '30', 10);

    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + days);
    const maxDateStr = maxDate.toISOString().split('T')[0];

    // Query for vehicles whose registration_expiry, safety_inspection_expiry, or insurance_expiry is <= maxDateStr
    // Join with assets to ensure we filter out soft-deleted items
    const records = await db
      .select({
        vehicle: vehicles,
        asset: assets,
      })
      .from(vehicles)
      .innerJoin(assets, eq(vehicles.assetId, assets.assetId))
      .where(
        and(
          isNull(assets.deletedAt),
          or(
            sql`${vehicles.registrationExpiry} <= ${maxDateStr}`,
            sql`${vehicles.safetyInspectionExpiry} <= ${maxDateStr}`,
            sql`${vehicles.insuranceExpiry} <= ${maxDateStr}`
          )
        )
      );

    const formattedData = records.map(({ vehicle, asset }) => {
      // Find out which specific items are expiring
      const expiringItems: string[] = [];
      if (vehicle.registrationExpiry && vehicle.registrationExpiry <= maxDateStr) {
        expiringItems.push('registration');
      }
      if (vehicle.safetyInspectionExpiry && vehicle.safetyInspectionExpiry <= maxDateStr) {
        expiringItems.push('safety_inspection');
      }
      if (vehicle.insuranceExpiry && vehicle.insuranceExpiry <= maxDateStr) {
        expiringItems.push('insurance');
      }

      return {
        ...vehicle,
        asset_name: asset.assetName,
        asset_tag_code: asset.assetTagCode,
        status: asset.status,
        expiring_items: expiringItems,
      };
    });

    return NextResponse.json({
      success: true,
      data: formattedData,
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
