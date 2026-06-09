# Issue: Implement Asset Details Side-Drawer for Admin Dashboard

## Description
We need to display detailed asset information in a premium side-drawer (slide-over panel) when a user clicks on any asset row in the Inventory Ledger. 

To ensure the drawer remains performant and showcases real-time detailed info, the drawer should fetch data dynamically using a new `GET /api/v1/assets/[id]` endpoint when opened. Additionally, the drawer's open/close state should be synchronized with the URL (`?assetId=...`) to allow deep-linking directly to a specific asset.

---

## Technical Specifications & Requirements

### 1. Backend: Implement `GET /api/v1/assets/[id]`
Modify [route.ts](file:///home/apep/trial/asset-tracker/src/app/api/v1/assets/%5Bid%5D/route.ts) to export a `GET` handler:
- **Base Query:** Fetch the asset matching the `id` param. Perform a `LEFT JOIN` on both `locations` and `costCenters` tables.
- **Conditional Query:** Inspect the `assetType`.
  - If type is `'vehicle'`, query the `vehicles` table where `assetId` matches the request ID.
  - If type is `'appliance'`, query the `officeAppliances` table where `assetId` matches the request ID.
- **Response Format:**
  ```json
  {
    "success": true,
    "data": {
      "assetId": "...",
      "assetTagCode": "...",
      "assetType": "...",
      "assetName": "...",
      "status": "...",
      "purchaseDate": "...",
      "purchaseCost": "...",
      "vendorName": "...",
      "warrantyExpiry": "...",
      "createdAt": "...",
      "updatedAt": "...",
      "deletedAt": null,
      "location": { "locationId": "...", "siteName": "...", "floor": "...", "roomOrSection": "..." },
      "costCenter": { "costCenterId": "...", "departmentName": "...", "division": "..." },
      "details": {
        // vehicle or appliance specific columns
      }
    }
  }
  ```
- **Error Handling:** Return a `404 Not Found` response if the asset ID does not exist, and a `500 Internal Error` for server-side exceptions.

### 2. Frontend: Side-Drawer Component
Create a new client component [AssetDetailsDrawer.tsx](file:///home/apep/trial/asset-tracker/src/components/dashboard/AssetDetailsDrawer.tsx):
- **URL Synchronization:**
  - Read `assetId` from the URL via `useSearchParams`.
  - When the drawer is closed (clicking close button or clicking outside/backdrop), clear the `assetId` param from the URL using `useRouter` and `usePathname`.
- **Data Fetching:** Fetch asset details using `useSWR` mapped to `/api/v1/assets/${assetId}` when `assetId` is present.
- **UI & Styling:**
  - Use Vanilla CSS or Tailwind CSS for styling.
  - Backdrop: `fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex justify-end`
  - Drawer Panel: `w-full max-w-md bg-white dark:bg-zinc-950 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300`
  - Render a close `X` button (using `lucide-react`) in the top-right header.
- **Data Sections:**
  - **Header:** Asset Name, Tag Code, and Status Badge.
  - **Main Info:** Purchase Cost (formatted in IDR), Purchase Date, Vendor Name, Warranty Expiry.
  - **Location & Cost Center:** Site, Floor, Section, and Department/Division names.
  - **Conditional Section:**
    - *For vehicles:* License Plate, VIN, Engine Number, Make & Model, Fuel Type, Current Odometer, Registration Expiry, Safety Inspection Expiry, and Insurance details.
    - *For appliances:* Brand, Model Number, Serial Number, Power Rating.
  - **Footer:** Add a close button and a placeholder "Edit Asset" button.

### 3. Frontend: Hooking up the Ledger Table
Modify [InventoryLedger.tsx](file:///home/apep/trial/asset-tracker/src/components/dashboard/InventoryLedger.tsx):
- Make table rows clickable: Add `cursor-pointer` to table rows (`<tr>`).
- Update URL search params to append `?assetId=[id]` when a row is clicked (making sure to preserve existing page/filter params).
- Place the `<AssetDetailsDrawer />` component at the bottom of the ledger file.

---

## Testing & Verification

### Automated Tests
Add test cases in [api.test.ts](file:///home/apep/trial/asset-tracker/src/app/api/api.test.ts) under a new `GET /api/v1/assets/[id]` block:
1. Fetch valid vehicle asset (verify joined vehicle data is correct).
2. Fetch valid appliance asset (verify joined appliance details are correct).
3. Attempt to fetch non-existent asset ID (verify endpoint returns `404` status).

Run tests using:
```bash
npm test
```
Verify build and typescript check pass:
```bash
npm run build
npx tsc --noEmit
```
