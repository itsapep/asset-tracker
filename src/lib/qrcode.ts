import qrcode from 'qrcode';

export async function generateAssetQRCode(assetTagCode: string): Promise<string> {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const assetUrl = `${baseUrl}/assets/${assetTagCode}`;
    
    const svgString = await qrcode.toString(assetUrl, {
        type: 'svg',
        margin: 1, // Keep padding tight for small labels
        color: {
            dark: '#000000',
            light: '#ffffff'
        }
    });
    
    return svgString;
}
