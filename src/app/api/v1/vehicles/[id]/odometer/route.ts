import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { vehicles, odometerLogs } from '@/db/schema';
import { eq, or } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { new_odometer_reading } = body;

    if (new_odometer_reading === undefined || typeof new_odometer_reading !== 'number') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: "Missing or invalid 'new_odometer_reading' in request body",
          },
        },
        { status: 400 }
      );
    }

    // Try finding the vehicle by either vehicleId or assetId
    const [vehicle] = await db
      .select()
      .from(vehicles)
      .where(or(eq(vehicles.vehicleId, id), eq(vehicles.assetId, id)))
      .limit(1);

    if (!vehicle) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Vehicle with ID/Asset ID '${id}' not found`,
          },
        },
        { status: 404 }
      );
    }

    // Validate new reading is strictly greater than current
    if (new_odometer_reading <= vehicle.currentOdometer) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: `New odometer reading (${new_odometer_reading}) must be greater than current reading (${vehicle.currentOdometer})`,
          },
        },
        { status: 400 }
      );
    }

    // Transaction to update vehicle and log the change
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await db.transaction(async (tx: any) => {
      // 1. Update vehicle table
      const [updatedVehicle] = await tx
        .update(vehicles)
        .set({ currentOdometer: new_odometer_reading })
        .where(eq(vehicles.vehicleId, vehicle.vehicleId))
        .returning();

      // 2. Insert into odometer_logs
      await tx.insert(odometerLogs).values({
        vehicleId: vehicle.vehicleId,
        oldReading: vehicle.currentOdometer,
        newReading: new_odometer_reading,
      });

      return updatedVehicle;
    });

    return NextResponse.json({
      success: true,
      data: result,
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
