# Issue: Enhance Admin Dashboard Responsiveness for Mobile Devices

## Description
The current Admin Dashboard is designed primarily for desktop viewports. On smaller screen widths, the top navigation header and the Inventory Ledger table are difficult to read and use. This issue tracks the implementation of mobile-friendly layout adjustments.

## Requirements

### 1. Top Navbar Optimization
- **Goal**: Prevent the navbar from wrapping or looking cramped on mobile viewports.
- **Action**: Hide the "GA & Finance System" pill on screens smaller than `640px` (Tailwind `sm` breakpoint).
- **File**: `src/app/page.tsx`

### 2. Collapsible Filter Controls
- **Goal**: Save vertical screen estate on mobile devices.
- **Action**: 
  - Add a collapsible button state to the filters section.
  - On mobile screens, hide the filter controls (search input, type and status select dropdowns) behind a "Show Filters" toggle button.
  - Restore the default layout (always visible and inline) on screens `768px` and above (`md` breakpoint).
- **File**: `src/components/dashboard/InventoryLedger.tsx`

### 3. Responsive Inventory Table
- **Goal**: Render readable data cards on mobile instead of a wide, overflowing table.
- **Action**:
  - Transform the table element into a card-like layout using block-level elements (`block md:table`, `block md:table-row`, `block md:table-cell`).
  - Hide the table header (`<thead>`) on mobile screens (`hidden md:table-header-group`).
  - Hide the "Purchase Info" column completely on mobile screens (`hidden md:table-cell`).
  - Add inline label prefixes (e.g., `Code:`, `Name:`) for each cell value that are only visible on mobile screens (`md:hidden`).
- **File**: `src/components/dashboard/InventoryLedger.tsx`

## Verification
- Test viewport behavior under 640px and 768px.
- Verify that toggling the "Show Filters" button works correctly.
- Verify that table rows convert to cards and display with correct inline labels on mobile.
- Verify that the layout remains unchanged on desktop screen resolutions.
