# Issue: Add QR Code Download to Asset Details Drawer

## Description
The goal of this task is to allow users to easily download a QR code image for a specific asset directly from the Asset Details Drawer. This QR code will encode the full URL to the asset details page, enabling users to stick it onto physical assets and scan it later to quickly access its information.

## Design Decisions
- We will generate and download an image file (PNG) containing the QR code.
- **QR Code Content**: The QR code must encode the full URL of the asset details page (e.g., `https://your-domain.com/dashboard?assetId=123`).
- We will use the existing `qrcode` package (version `^1.5.4`) which is already installed in the project. It allows generating base64 image data URIs in the browser.

## Implementation Steps

### Update `src/components/dashboard/AssetDetailsDrawer.tsx`

1. **Imports**:
   - Add `QrCode` and `Download` icons to the `lucide-react` import.
   - Add `import QRCode from 'qrcode';`

2. **State/Hooks**:
   - Add a loading state `isGeneratingQR` (boolean) to show a loading indicator or disable the button while the QR code is being generated.

3. **Functionality (`handleDownloadQR`)**:
   - Create an asynchronous function `handleDownloadQR` inside the component.
   - Construct the full URL for the asset (e.g., `const url = window.location.origin + pathname + "?assetId=" + asset.id;`).
   - Use `await QRCode.toDataURL(url, { width: 300, margin: 2 })` to generate a PNG data URI.
   - Create a temporary `<a>` DOM element, set its `href` to the generated data URI, and its `download` attribute to `asset-${asset.assetTagCode}-qr.png`.
   - Programmatically trigger a click on the `<a>` element to prompt the user's browser to download the file.

4. **UI Updates**:
   - In the Header section (look for `<div className="p-6 border-b ... flex items-center justify-between">`), there is currently a `<button>` for closing the drawer containing `<X className="w-5 h-5" />`.
   - Wrap the existing close button in a new container: `<div className="flex items-center gap-2">`.
   - Inside this container, add the new "Download QR" button right before the Close button.
   - The new button should have the same styling as the close button, but use the `QrCode` icon.

## Verification Plan

### Manual Verification
1. Open the application and navigate to the Inventory Ledger (Dashboard).
2. Click on an asset to open the Asset Details Drawer.
3. Verify that a QR Code icon button is visible in the top right corner, next to the Close button.
4. Click the QR Code button.
5. Verify that a `.png` file named `asset-[TAG_CODE]-qr.png` is downloaded.
6. Open the downloaded image and scan it with a mobile device (or a QR code reader application) to verify that it decodes to the correct absolute URL for the asset.
