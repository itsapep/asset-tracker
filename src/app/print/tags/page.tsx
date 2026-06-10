import { db } from '@/db';
import { assets } from '@/db/schema';
import { inArray, eq, and, isNull } from 'drizzle-orm';
import { generateAssetQRCode } from '@/lib/qrcode';
import './print.css';

type Props = { searchParams: Promise<{ ids?: string; status?: string }> };

export default async function PrintTagsPage(props: Props) {
    const params = await props.searchParams;

    const conditions = [isNull(assets.deletedAt)];

    if (params.ids) {
        const idArray = params.ids.split(',');
        conditions.push(inArray(assets.assetId, idArray));
    }
    
    if (params.status) {
        conditions.push(eq(assets.status, params.status as "active" | "idle" | "under_maintenance" | "disposed"));
    }

    const matchingAssets = await db.select().from(assets).where(and(...conditions));

    const assetsWithQRCodes = await Promise.all(
        matchingAssets.map(async (asset: any) => {
            const qrCodeSvg = await generateAssetQRCode(asset.assetTagCode);
            return {
                ...asset,
                qrCodeSvg,
            };
        })
    );

    return (
        <div className="label-sheet">
            {assetsWithQRCodes.map((asset) => (
                <div key={asset.assetId} className="label">
                    <div className="label-info">
                        <div className="label-title">{asset.assetName}</div>
                        <div className="label-code">{asset.assetTagCode}</div>
                    </div>
                    <div className="label-qr" dangerouslySetInnerHTML={{ __html: asset.qrCodeSvg }} />
                </div>
            ))}
        </div>
    );
}
