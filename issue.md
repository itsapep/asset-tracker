# Edit Asset Modal - Implementation Plan

This implementation plan provides step-by-step instructions for creating a centered Edit Asset Modal that overlays the existing Asset Details Drawer. It is designed to be easily executed by a junior developer or an AI assistant.

## Goal Description
Implement an "Edit Asset" modal that allows users to modify comprehensive properties of an asset, including base fields, dates, locations, cost centers, and type-specific specifications (Vehicle vs Appliance). The backend API will also be updated to handle these nested updates.

> [!IMPORTANT]
> The `status` field is NOT editable through this modal.

---

## Proposed Changes

### 1. Update the Backend API to Handle Comprehensive Updates

#### [MODIFY] `src/app/api/v1/assets/[id]/route.ts`
The existing `PATCH` endpoint must be updated to handle updates to nested specification tables and reference IDs.

**Key Requirements:**
- In the `updateData` object, also accept and apply updates for:
  - `purchase_date` -> `purchaseDate`
  - `warranty_expiry` -> `warrantyExpiry`
  - `location_id` -> `locationId`
  - `cost_center_id` -> `costCenterId`
- Check if `body.details` exists. If it does, update the corresponding type-specific table (`vehicles` or `officeAppliances`):
  - If `existingAsset.assetType === 'vehicle'`, run a `db.update(vehicles).set(body.details).where(eq(vehicles.assetId, id))` query.
  - If `existingAsset.assetType === 'appliance'`, run a `db.update(officeAppliances).set(body.details).where(eq(officeAppliances.assetId, id))` query.

### 2. Create the Edit Asset Modal Component

#### [NEW] `src/components/dashboard/EditAssetModal.tsx`
Create a new Client Component to handle the form state and API submission.

**Component Interface:**
```typescript
interface EditAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: any; // The asset object fetched in the drawer
  onSuccess: () => void; // Callback to refresh data after a successful save
}
```

**Key Requirements:**
- **State Management:** Use `useState` to manage a comprehensive form payload. Initialize it using the `asset` prop.
- **UI Layout:** Use a fixed full-screen overlay (`bg-black/50`). Center the modal content box (`bg-white dark:bg-zinc-900 rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto`).
- **Base Form Fields:** 
  - `Asset Name` (Text Input)
  - `Vendor Name` (Text Input)
  - `Purchase Cost` (Number Input)
  - `Purchase Date` (Date Input)
  - `Warranty Expiry` (Date Input)
  - `Location ID` (Text Input - simplified for now, unless dropdown is required)
  - `Cost Center ID` (Text Input - simplified for now, unless dropdown is required)
- **Conditional Specifications Fields:**
  - *If `asset.assetType === 'vehicle'`*, render fields for `details.licensePlate`, `details.make`, `details.model`, `details.fuelType`, `details.insurancePolicyNo`, `details.insuranceExpiry`, `details.registrationExpiry`, `details.safetyInspectionExpiry`, `details.vinNumber`, `details.engineNumber`.
  - *If `asset.assetType === 'appliance'`*, render fields for `details.brand`, `details.modelNumber`, `details.serialNumber`, `details.powerRatingWatts`.
- **API Integration:** Create an `async` function `handleSave(e)`.
  - Submit a JSON payload to `PATCH /api/v1/assets/${asset.assetId}`.
  - Structure the payload to map standard fields (e.g., `asset_name`, `purchase_date`, `location_id`) and nest type-specific fields under a `details` object.
  - On success, call `onSuccess()` and `onClose()`.

### 3. Integrate the Modal into the Asset Details Drawer

#### [MODIFY] `src/components/dashboard/AssetDetailsDrawer.tsx`
Update the drawer component to manage the visibility of the new Edit Modal and handle re-fetching of data.

**Key Requirements:**
- Add state: `const [isEditModalOpen, setIsEditModalOpen] = useState(false);`
- Import `useSWRConfig` from `"swr"` and destructure `const { mutate } = useSWRConfig();`
- At the bottom of the drawer, locate the "Edit Asset" button:
  - Remove `disabled`.
  - Add `onClick={() => setIsEditModalOpen(true)}`.
- Render the modal conditionally at the bottom of the component:
  ```tsx
  {isEditModalOpen && (
    <EditAssetModal 
      isOpen={isEditModalOpen}
      onClose={() => setIsEditModalOpen(false)}
      asset={asset}
      onSuccess={() => mutate(`/api/v1/assets/${assetId}`)}
    />
  )}
  ```

---

## Verification Plan

### Automated Tests

#### 1. API Route Unit Tests (`tests/api/assets.test.ts` or similar)
- Write tests using `node:test` to verify `PATCH /api/v1/assets/[id]`.
- Verify updating base properties (e.g., `purchaseCost`, `vendorName`).
- Verify nested updates for `vehicles` (e.g., changing `licensePlate` and `make`).
- Verify nested updates for `officeAppliances` (e.g., changing `brand` and `powerRatingWatts`).

#### 2. Component Unit Tests (`tests/components/EditAssetModal.test.tsx`)
- Write tests using `node:test` and mock React hooks (similar to `UserDropdown.test.tsx`).
- Render the component with `assetType === 'vehicle'` and verify that vehicle-specific fields (e.g., License Plate) are present.
- Render the component with `assetType === 'appliance'` and verify that appliance-specific fields (e.g., Brand, Power Rating) are present.
- Verify that the `status` field is NOT rendered or editable.

### Manual Verification
1. Open the application, go to the dashboard, and click an asset to open the Asset Details Drawer.
2. Click the **"Edit Asset"** button.
3. Verify that the centered modal opens and DOES NOT contain a Status field.
4. Verify that the modal contains fields for base properties, dates, location/cost center IDs, and conditionally rendered specification fields.
5. Update a base property (e.g., `Purchase Cost`), a date (`Warranty Expiry`), and a specification field (e.g., `Make` for a vehicle).
6. Click **Save**.
7. Verify the modal closes and the drawer data updates automatically.
8. Refresh the page to confirm changes persisted.
