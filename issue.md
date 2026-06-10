# Approval Workflow for Asset Status Transition

This document outlines the detailed implementation plan for creating an approval workflow for high-risk asset status transitions (disposal and major maintenance), designed to be easily executed by a junior engineer or AI agent.

## User Review Required

> [!IMPORTANT]
> The database schema will be updated, requiring a new migration to be generated and run (`npx drizzle-kit generate` and `npx drizzle-kit migrate`).
> We are using **Vercel Blob** for handling `evidence_url` uploads, which requires configuring Vercel Blob in your Vercel project dashboard and adding the token to your environment variables.

## Proposed Changes

### 1. Database Schema Updates

We need a new table to track transition requests that require management approval.

#### [MODIFY] src/db/schema.ts
- Import `decimal` and `text` from `drizzle-orm/pg-core` at the top of the file.
- Create a new enum for approval status:
  ```typescript
  export const approvalStatusEnum = pgEnum('approval_status_enum', ['pending_hrga', 'pending_finance', 'approved', 'rejected']);
  ```
- Define the `status_change_requests` table below the `assets` table:
  ```typescript
  export const statusChangeRequests = pgTable('status_change_requests', {
    requestId: uuid('request_id').defaultRandom().primaryKey(),
    assetId: uuid('asset_id').references(() => assets.assetId, { onDelete: 'cascade' }).notNull(),
    requestedStatus: assetStatusEnum('requested_status').notNull(),
    reasonOrNotes: text('reason_or_notes').notNull(),
    evidenceUrl: varchar('evidence_url'), // Link from Vercel Blob
    estimatedCost: decimal('estimated_cost', { precision: 15, scale: 2 }), // Used for maintenance threshold logic
    approvalStatus: approvalStatusEnum('approval_status').default('pending_hrga').notNull(),
    hrgaReviewedBy: text('hrga_reviewed_by').references(() => users.id), // Foreign key for HRGA Head
    financeReviewedBy: text('finance_reviewed_by').references(() => users.id), // Foreign key for Finance User
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  });
  ```

#### [MODIFY] src/db/seed.ts
- Add the `'finance'` and `'hrga_head'` roles to the seed data so they are available in the system.
- Create mock users assigned to these roles for local development and testing.

### 2. Environment Variables

#### [MODIFY] .env.local (and `.env.example`)
Add the following variables:
```env
# Threshold for vehicle maintenance approval (in IDR, e.g., 5,000,000)
MAINTENANCE_APPROVAL_THRESHOLD=5000000

# Vercel Blob storage secrets (Get from Vercel Dashboard)
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token
```

### 3. Vercel Blob Upload API

#### [NEW] src/app/api/upload/route.ts
- Run `npm install @vercel/blob` in your terminal.
- Create this API route to handle uploading evidence images/documents:
```typescript
import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename');

  if (!filename || !request.body) {
    return NextResponse.json({ error: 'Filename and body are required' }, { status: 400 });
  }

  try {
    const blob = await put(filename, request.body, {
      access: 'public',
    });
    // Returns the URL of the uploaded file
    return NextResponse.json(blob);
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
```

### 4. Status Change Request API Routes

#### [NEW] src/app/api/v1/status-requests/route.ts
- **POST Method**: Create a new status change request or auto-approve if under threshold.
- **Logic**:
  1. Parse body `(assetId, requestedStatus, reasonOrNotes, evidenceUrl, estimatedCost)`.
  2. If `requestedStatus` is `'under_maintenance'` AND `estimatedCost` is strictly LESS than `process.env.MAINTENANCE_APPROVAL_THRESHOLD`:
     - Update the asset status directly in the `assets` table.
     - Return `{ message: 'Auto-approved' }`.
  3. Otherwise (Disposal, or Maintenance > Threshold):
     - Insert a new row into `statusChangeRequests` with `approvalStatus: 'pending_hrga'`.
     - Return the created request.

#### [NEW] src/app/api/v1/status-requests/[id]/route.ts
- **PATCH Method**: Admin/Finance approves or rejects a pending request.
- **Logic**:
  1. Authenticate user via `auth()` or NextAuth session.
  2. Parse body: `{ action: 'approve' | 'reject' }`.
  3. Authorization & Logic Flow based on user role and current status:
     - Query the user's role (`'admin'`, `'finance'`, or `'hrga_head'`) from `userRoles` joined with `roles`.
     - **HRGA Head Approval Step:**
       - If the user has the `'hrga_head'` role and current `approvalStatus` is `'pending_hrga'`:
         - If `action === 'approve'`: Update `approvalStatus = 'pending_finance'` and `hrgaReviewedBy = currentUser.id`.
         - If `action === 'reject'`: Update `approvalStatus = 'rejected'` and `hrgaReviewedBy = currentUser.id`.
     - **Finance Approval Step:**
       - If the user has the `'finance'` or `'admin'` role and current `approvalStatus` is `'pending_finance'`:
         - If `action === 'approve'`: 
           - Execute a **PostgreSQL Transaction** (`db.transaction(async (tx) => { ... })`).
           - Inside transaction:
             - Update `approvalStatus = 'approved'` and `financeReviewedBy = currentUser.id`.
             - Update `assets`: set `status = request.requestedStatus`.
         - If `action === 'reject'`: Update `approvalStatus = 'rejected'` and `financeReviewedBy = currentUser.id`.
     - **Unauthorized / Invalid State:**
       - If the user doesn't have the correct role for the current state, return `403 Forbidden` or `400 Bad Request`.

### 5. Frontend UI Components & Packages

#### [MODIFY] package.json
- Install the `sonner` package (`npm install sonner`) to provide modern, user-friendly toast notifications for success and error states across the UI.

#### [REFACTOR] Shared Layout & Navigation (`src/app/page.tsx` & `src/app/layout.tsx`)
- Extract the hardcoded `<header>` (navbar) and `<footer>` from `src/app/page.tsx` into a shared layout component (e.g., `src/app/(dashboard)/layout.tsx` or similar).
- In the shared `<header>`, add a quick-access button/icon (e.g., a checkmark badge) near the user profile dropdown that links to the new `/approvals` page.

#### [NEW] src/components/dashboard/StatusChangeModal.tsx
- Create a modal form component for requesting status transitions.
- **Fields:** Target Status dropdown (`under_maintenance`, `disposed`), Reason/Notes text area, Estimated Cost number input (only visible if status is `under_maintenance`), and a File Input for evidence upload.
- **Logic:** On submit, handle uploading the file to `/api/upload` first, retrieve the `evidenceUrl`, and then send the complete payload to `POST /api/v1/status-requests`. Use `sonner` toasts for upload/submit feedback.

#### [MODIFY] Asset Details View (e.g., AssetDetailsModal.tsx)
- Add a "Request Status Change" button that triggers the `StatusChangeModal` for the currently selected asset.

#### [NEW] src/app/approvals/page.tsx
- Create a dedicated standalone "Approvals Dashboard" page (`/approvals`) for managers to review transition requests.
- **Hero Alignment:** Reuse the exact same title/subtitle component styling found on the main dashboard (`text-3xl font-black`), changing the text to "Approvals Dashboard" and "Review and process pending status changes".
- **Layout & Tabs:** Implement a tabbed interface to filter requests by "Pending", "Approved", and "Rejected", allowing managers to see past decisions.
- **Data Fetching:** Fetch requests from `status_change_requests`. The "Pending" tab should filter based on the current user's role (e.g., `pending_hrga` for HRGA Head, `pending_finance` for Finance/Admin).
- **Evidence Preview:** Display a thumbnail image preview directly in the dashboard row. Clicking the thumbnail should open a larger modal/lightbox with the full image for better UX.
- **Actions:** Provide "Approve" and "Reject" buttons on each row. Trigger a `sonner` toast notification upon successful action and refresh the list.

## Verification Plan

### Automated Tests
- Create an API test file: `src/app/api/v1/status-requests/route.test.ts` (or equivalent location based on project setup).
- Write tests using `jest` (or your testing framework) to cover:
  1. **Auto-approval logic**: Maintenance requests under threshold automatically update the asset status.
  2. **Pending Request Creation**: High-risk transitions create a `pending_hrga` request and don't modify the asset.
  3. **Two-Step Approval State Machine**: Test the sequence `pending_hrga` -> `pending_finance` -> `approved`, verifying the PostgreSQL transaction mocks.
  4. **RBAC Rules**: Ensure unauthorized roles receive a `403 Forbidden` response when trying to approve.

### Manual Verification
1. **DB Migration**: Run `npx drizzle-kit generate` and `npx drizzle-kit migrate` to apply the schema changes.
2. **Auto-Approve Test**: Submit a POST request for `under_maintenance` with an `estimatedCost` of `2000000` (below 5M threshold). Verify the asset status changes to `under_maintenance` immediately without a pending request.
3. **Pending Request Test**: Submit a POST request for `disposed` or `under_maintenance` > 5M. Verify the asset stays `active` and a `pending_hrga` request is created in the database.
4. **HRGA Approval Test**: Log in as an HRGA Head user, execute the PATCH request to approve. Verify the request status updates to `pending_finance` and the asset stays `active`.
5. **Finance Approval Test**: Log in as an admin/finance user, execute the PATCH request to approve. Verify both the `status_change_requests` (to `approved`) and `assets` tables update correctly.
