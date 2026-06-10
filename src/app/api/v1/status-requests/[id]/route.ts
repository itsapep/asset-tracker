import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { assets, statusChangeRequests, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/auth';

// PATCH /api/v1/status-requests/[id]
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user exists in the database to prevent foreign key violations (e.g. after re-seeding)
    const [dbUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (!dbUser) {
      return NextResponse.json({ error: 'Session user not found in database. Please sign out and sign in again.' }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const { action } = body;

    console.log('PATCH status-requests request context:', { id, body });
    console.log('PATCH status-requests session:', session);

    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json({ error: 'Invalid action. Must be approve or reject' }, { status: 400 });
    }

    // Fetch the request record
    const [requestRecord] = await db
      .select()
      .from(statusChangeRequests)
      .where(eq(statusChangeRequests.requestId, id))
      .limit(1);

    console.log('PATCH status-requests requestRecord:', requestRecord);

    if (!requestRecord) {
      return NextResponse.json({ error: 'Status change request not found' }, { status: 404 });
    }

    if (requestRecord.approvalStatus === 'approved' || requestRecord.approvalStatus === 'rejected') {
      return NextResponse.json({ error: 'Request has already been processed' }, { status: 400 });
    }

    const userRoles = session.user.roles || [];
    const isAdmin = userRoles.includes('System Admin');
    const isHRGAHead = userRoles.includes('HRGA Head') || isAdmin;
    const isFinance = userRoles.includes('Finance') || isAdmin;

    console.log('PATCH status-requests user capabilities:', { userRoles, isHRGAHead, isFinance });

    // HRGA Head Approval Step
    if (requestRecord.approvalStatus === 'pending_hrga') {
      if (!isHRGAHead) {
        return NextResponse.json({ error: 'Forbidden: Requires HRGA Head role' }, { status: 403 });
      }

      if (action === 'approve') {
        const skipFinance = requestRecord.requestedStatus === 'idle';
        let updatedRequest;

        if (skipFinance) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await db.transaction(async (tx: any) => {
            [updatedRequest] = await tx
              .update(statusChangeRequests)
              .set({
                approvalStatus: 'approved',
                hrgaReviewedBy: session.user.id,
                updatedAt: new Date(),
              })
              .where(eq(statusChangeRequests.requestId, id))
              .returning();

            await tx
              .update(assets)
              .set({
                status: requestRecord.requestedStatus,
                deletedAt: requestRecord.requestedStatus === 'disposed' ? new Date() : null,
                updatedAt: new Date(),
              })
              .where(eq(assets.assetId, requestRecord.assetId));
          });
        } else {
          [updatedRequest] = await db
            .update(statusChangeRequests)
            .set({
              approvalStatus: 'pending_finance',
              hrgaReviewedBy: session.user.id,
              updatedAt: new Date(),
            })
            .where(eq(statusChangeRequests.requestId, id))
            .returning();
        }

        return NextResponse.json({
          success: true,
          message: skipFinance
            ? 'Approved by HRGA Head. Asset status updated to Idle successfully.'
            : 'Approved by HRGA Head, pending Finance',
          data: updatedRequest,
        });
      } else {
        const [updatedRequest] = await db
          .update(statusChangeRequests)
          .set({
            approvalStatus: 'rejected',
            hrgaReviewedBy: session.user.id,
            updatedAt: new Date(),
          })
          .where(eq(statusChangeRequests.requestId, id))
          .returning();

        return NextResponse.json({
          success: true,
          message: 'Rejected by HRGA Head',
          data: updatedRequest,
        });
      }
    }


    // Finance Approval Step
    if (requestRecord.approvalStatus === 'pending_finance') {
      if (!isFinance) {
        return NextResponse.json({ error: 'Forbidden: Requires Finance role' }, { status: 403 });
      }

      if (action === 'approve') {
        let updatedRequest;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await db.transaction(async (tx: any) => {
          [updatedRequest] = await tx
            .update(statusChangeRequests)
            .set({
              approvalStatus: 'approved',
              financeReviewedBy: session.user.id,
              updatedAt: new Date(),
            })
            .where(eq(statusChangeRequests.requestId, id))
            .returning();

          await tx
            .update(assets)
            .set({
              status: requestRecord.requestedStatus,
              deletedAt: requestRecord.requestedStatus === 'disposed' ? new Date() : null,
              updatedAt: new Date(),
            })
            .where(eq(assets.assetId, requestRecord.assetId));
        });

        return NextResponse.json({
          success: true,
          message: 'Approved by Finance. Asset status updated successfully.',
          data: updatedRequest,
        });
      } else {
        const [updatedRequest] = await db
          .update(statusChangeRequests)
          .set({
            approvalStatus: 'rejected',
            financeReviewedBy: session.user.id,
            updatedAt: new Date(),
          })
          .where(eq(statusChangeRequests.requestId, id))
          .returning();

        return NextResponse.json({
          success: true,
          message: 'Rejected by Finance',
          data: updatedRequest,
        });
      }
    }

    return NextResponse.json({ error: 'Invalid request state' }, { status: 400 });
  } catch (error) {
    console.error('Error processing status request:', error);
    return NextResponse.json({ error: 'Internal server error', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

