"use client";

import useSWR from "swr";
import { 
  AlertTriangle, 
  ShieldAlert, 
  Wrench, 
  CheckCircle,
  Truck,
  FileText
} from "lucide-react";
import { ExpirationAlert, Asset } from "@/types/dashboard";

const fetcher = (url: string) => fetch(url, {
  headers: {
    'x-role': 'admin'
  }
}).then((res) => res.json());

export default function ComplianceCommandCenter() {
  const { data: expResponse, isLoading: expLoading } = useSWR<{
    success: boolean;
    data: ExpirationAlert[];
  }>("/api/v1/compliance/upcoming-expirations?days=30", fetcher);

  const { data: maintResponse, isLoading: maintLoading } = useSWR<{
    success: boolean;
    data: Asset[];
  }>("/api/v1/assets?status=under_maintenance&limit=50", fetcher);

  const expirations = expResponse?.success ? expResponse.data : [];
  const maintenanceAssets = maintResponse?.success ? maintResponse.data : [];

  const isLoading = expLoading || maintLoading;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm animate-pulse">
          <div className="h-6 w-48 bg-zinc-200 dark:bg-zinc-800 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-16 bg-zinc-100 dark:bg-zinc-800 rounded-lg"></div>
            <div className="h-16 bg-zinc-100 dark:bg-zinc-800 rounded-lg"></div>
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm animate-pulse">
          <div className="h-6 w-48 bg-zinc-200 dark:bg-zinc-800 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-16 bg-zinc-100 dark:bg-zinc-800 rounded-lg"></div>
            <div className="h-16 bg-zinc-100 dark:bg-zinc-800 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      {/* Expirations Section */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4 border-b border-zinc-100 dark:border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="text-red-500 w-5 h-5" />
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Vehicle Compliance Alerts
            </h2>
          </div>
          <span className="text-xs bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 font-medium px-2.5 py-1 rounded-full">
            {expirations.length} {expirations.length === 1 ? 'alert' : 'alerts'}
          </span>
        </div>

        {expirations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-zinc-500">
            <CheckCircle className="w-10 h-10 text-emerald-500 mb-2" />
            <p className="text-sm font-medium">All vehicles are fully compliant</p>
            <p className="text-xs text-zinc-400">No renewals required in the next 30 days</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
            {expirations.map((alert) => (
              <div 
                key={alert.vehicleId} 
                className="flex flex-col p-4 bg-red-50/50 dark:bg-red-950/10 border border-red-100 dark:border-red-950/20 rounded-lg transition-transform hover:scale-[1.01]"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-50 flex items-center gap-1.5">
                      <Truck className="w-4 h-4 text-zinc-500" />
                      {alert.asset_name}
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono mt-0.5">
                      Tag: {alert.asset_tag_code} | Plate: {alert.licensePlate}
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-3">
                  {alert.expiring_items.map((item) => (
                    <span 
                      key={item} 
                      className="inline-flex items-center gap-1 text-[11px] font-medium bg-white dark:bg-zinc-800 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/30 px-2 py-0.5 rounded shadow-sm"
                    >
                      <AlertTriangle className="w-3 h-3 text-red-500" />
                      {item === "registration" ? "STNK Expiring" : 
                       item === "safety_inspection" ? "KIR Expiring" : 
                       "Insurance Expiring"}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Maintenance Section */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4 border-b border-zinc-100 dark:border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <Wrench className="text-amber-500 w-5 h-5" />
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Maintenance Tracking
            </h2>
          </div>
          <span className="text-xs bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 font-medium px-2.5 py-1 rounded-full">
            {maintenanceAssets.length} pending
          </span>
        </div>

        {maintenanceAssets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-zinc-500">
            <CheckCircle className="w-10 h-10 text-emerald-500 mb-2" />
            <p className="text-sm font-medium">All assets are fully operational</p>
            <p className="text-xs text-zinc-400">No assets are currently under maintenance</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
            {maintenanceAssets.map((asset) => (
              <div 
                key={asset.assetId} 
                className="flex items-start justify-between p-4 bg-amber-50/50 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-950/20 rounded-lg transition-transform hover:scale-[1.01]"
              >
                <div>
                  <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-50 flex items-center gap-1.5">
                    {asset.assetType === 'vehicle' ? <Truck className="w-4 h-4 text-zinc-500" /> : <FileText className="w-4 h-4 text-zinc-500" />}
                    {asset.assetName}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono mt-0.5">
                    Tag: {asset.assetTagCode} | Type: {asset.assetType}
                  </p>
                  <p className="text-xs text-zinc-400 mt-1">
                    Vendor: {asset.vendorName}
                  </p>
                </div>
                <span className="text-[11px] font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40 px-2 py-0.5 rounded shadow-sm">
                  In Progress
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
