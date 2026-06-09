# Implementation Plan: QR Code Generation & Print Layout

This document outlines the detailed, step-by-step implementation plan for generating dynamic QR codes for asset tags and creating a printable sheet layout optimized for Avery 5160 labels. It is designed to be highly actionable for a junior engineer or an AI agent.

## Background Context
To track assets effectively, each physical asset requires a printed tag containing a scannable QR code that links back to the digital record. The user needs a utility to generate these QR codes dynamically, as well as a frontend page that generates a printable sheet of these tags formatted for standard label sheets (Avery 5160). 

*Decision Note:* The QR code must encode the full URL to the asset's detail page (e.g., `https://domain.com/assets/[tag_code]`), rather than just the raw tag code.

## User Review Required
> [!IMPORTANT]
> - **Company Logo:** A generic placeholder logo is currently planned for the labels. If a specific company logo asset exists (e.g., `/logo.svg`), please specify it.
> - **Environment Variable:** Ensure `NEXT_PUBLIC_APP_URL` is set in your `.env*` to correctly construct the QR Code URLs.

## Proposed Changes

---

### Component 1: Dependencies Setup
Install the necessary library to generate SVG QR codes.

#### [MODIFY] package.json
Run the following commands in the terminal to add the required dependencies:
```bash
npm install qrcode
npm install -D @types/qrcode
```

---

### Component 2: QR Code Utility Function
Create a shared utility function that takes an asset tag code, constructs the full URL, and generates an SVG QR code.

#### [NEW] src/lib/qrcode.ts
**Implementation Details:**
1. Import `qrcode`.
2. Define and export `async function generateAssetQRCode(assetTagCode: string): Promise<string>`.
3. Read the base URL from the environment: `const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';`
4. Construct the full URL: `const assetUrl = \`${baseUrl}/assets/${assetTagCode}\`;`
5. Generate the SVG string: 
   ```typescript
   const svgString = await qrcode.toString(assetUrl, {
       type: 'svg',
       margin: 1, // Keep padding tight for small labels
       color: {
           dark: '#000000',
           light: '#ffffff'
       }
   });
   return svgString;
   ```

---

### Component 3: Print Page Route
Create a Next.js App Router Page that acts as the printable sheet. This page will accept query parameters to filter which assets to print.

#### [NEW] src/app/print/tags/page.tsx
**Implementation Details:**
1. Create a React Server Component. 
2. Retrieve `searchParams` from the component props. Note: If using Next.js 15+, `searchParams` is a Promise and must be `await`ed:
   ```typescript
   type Props = { searchParams: Promise<{ ids?: string; status?: string }> };
   export default async function PrintTagsPage(props: Props) {
       const params = await props.searchParams;
       // ...
   }
   ```
3. Parse the parameters:
   - If `params.ids` is provided, split it by commas.
   - If `params.status` is provided, use it for filtering.
4. Query the database using Drizzle ORM:
   ```typescript
   import { db } from '@/db';
   import { assets } from '@/db/schema';
   import { inArray, eq, and, isNull } from 'drizzle-orm';
   
   // Base condition: exclude soft-deleted items
   const conditions = [isNull(assets.deletedAt)];
   
   if (params.ids) {
       const idArray = params.ids.split(',');
       conditions.push(inArray(assets.id, idArray)); // Adjust 'assets.id' to match your schema's primary key (e.g., assets.assetId)
   }
   if (params.status) {
       conditions.push(eq(assets.status, params.status));
   }
   
   const matchingAssets = await db.select().from(assets).where(and(...conditions));
   ```
5. Map over `matchingAssets` to generate the QR codes using `generateAssetQRCode`. You can do this concurrently with `Promise.all`.
6. Render the UI:
   - Apply a wrapper `div` with the class `.label-sheet`.
   - Map over the assets and render each within a `.label` div.
   - Inside the `.label`, display:
     - Left side: A tiny placeholder logo + the `asset.assetName` (truncated if too long) + the `asset.assetTagCode`.
     - Right side: Render the SVG string directly using `dangerouslySetInnerHTML={{ __html: qrCodeSvg }}`.

---

### Component 4: Print Layout Styling
Define the exact CSS needed to align with Avery 5160 labels (30 labels per page, 3 columns x 10 rows on US Letter paper).

#### [NEW] src/app/print/tags/print.css
**Implementation Details:**
Create this file and import it into `page.tsx`. Use the exact CSS below to ensure accurate physical dimensions:

```css
/* Print-specific layout */
@media print {
  @page {
    size: letter;
    margin: 0.5in 0.19in; /* Avery 5160 top/bottom and left/right margins */
  }
  
  body {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    background: white;
  }

  /* Hide Next.js dev overlays or main app navigation/headers */
  header, footer, nav, .no-print {
    display: none !important;
  }
}

/* Grid Layout for Avery 5160 */
.label-sheet {
  display: grid;
  grid-template-columns: repeat(3, 2.625in); /* 3 columns, each 2.625" wide */
  grid-auto-rows: 1in; /* Each label is 1" tall */
  gap: 0 0.125in; /* No vertical gap, 0.125" horizontal gap between columns */
  width: 8.125in; /* Total width: 3*2.625 + 2*0.125 */
  margin: 0 auto;
}

/* Individual Label Container */
.label {
  width: 2.625in;
  height: 1in;
  box-sizing: border-box;
  padding: 0.05in 0.1in; /* Inner padding so content doesn't bleed off */
  page-break-inside: avoid;
  break-inside: avoid;
  
  /* Layout contents inside the label */
  display: flex;
  align-items: center;
  justify-content: space-between;
  overflow: hidden;
  border: 1px dashed #ccc; /* Helpful for debugging visually, remove before final print or wrap in @media screen */
}

@media print {
  .label {
    border: none; /* Hide debug borders when actually printing */
  }
}

/* Label Content Typography */
.label-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
  max-width: 65%;
}

.label-title {
  font-size: 10px;
  font-weight: bold;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.label-code {
  font-size: 8px;
  color: #333;
  font-family: monospace;
}

/* QR Code Container */
.label-qr {
  width: 0.8in;
  height: 0.8in;
  display: flex;
  align-items: center;
  justify-content: center;
}

.label-qr svg {
  width: 100%;
  height: 100%;
}
```

## Verification Plan

### Automated Tests
- Run `npm run build` or `npm run dev` to ensure no TypeScript compilation errors occur with the new Next.js route and `qrcode` library.

### Manual Verification
1. Open the browser and navigate to the newly created route: `http://localhost:3000/print/tags?status=active`.
2. Inspect the screen output. You should see a dashed grid representing the Avery 5160 labels.
3. Open the browser's Print Dialog (`Ctrl+P` / `Cmd+P`).
4. Ensure the paper size is set to **Letter (8.5 x 11)**, margins are set to **Default** or **None** (since `@page` handles them), and scale is **100%**.
5. Verify the preview perfectly aligns with 30 labels per page (10 rows, 3 columns).
6. Scan one of the QR codes from the screen using a mobile phone to confirm it correctly links to the full URL (e.g., `https://.../assets/AST-1234`).
