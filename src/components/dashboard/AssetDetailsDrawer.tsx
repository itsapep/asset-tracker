"use client";

import { Suspense } from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import useSWR from "swr";
import { 
  X, 
  Truck, 
  FileText, 
  MapPin, 
  Building, 
  DollarSign, 
  Calendar, 
  Clock 
} from "lucide-react";

const fetcher = (url: string) => fetch(url, {
  headers: {
    'x-role': 'admin'
  }
}).then((res) => res.json());

function AssetDetailsDrawerContent() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  
  const assetId = searchParams.get("assetId");

  const { data: response, error, isLoading } = useSWR<{
    success: boolean;
    data: any;
  }>(assetId ? `/api/v1/assets/${assetId}` : null, fetcher);

  if (!assetId) return null;

  const closeDrawer = () => {
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("assetId");
    router.push(pathname + "?" + nextParams.toString());
  };

  const asset = response?.data;

  // Format currency
  const formatIDR = (val: string) => {
    if (!val) return "N/A";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(parseFloat(val));
  };

  // Status Badge helper
  const getStatusBadge = (statusStr: string) => {
    const config: Record<string, { bg: string; text: string; label: string }> = {
      active: { bg: "bg-emerald-50 dark:bg-emerald-950/30", text: "text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30", label: "Active" },
      idle: { bg: "bg-blue-50 dark:bg-blue-950/30", text: "text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900/30", label: "Idle" },
      under_maintenance: { bg: "bg-amber-50 dark:bg-amber-950/30", text: "text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/30", label: "Maintenance" },
      disposed: { bg: "bg-zinc-100 dark:bg-zinc-800", text: "text-zinc-700 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700", label: "Disposed" },
    };
    const c = config[statusStr] || { bg: "bg-zinc-50", text: "text-zinc-700", label: statusStr };
    return (
      <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full ${c.bg} ${c.text}`}>
        {c.label}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        onClick={closeDrawer}
        className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-xs transition-opacity"
      />

      {/* Slide-over panel */}
      <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 h-full shadow-2xl flex flex-col z-10 border-l border-zinc-200 dark:border-zinc-800 animate-in slide-in-from-right duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/50">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-zinc-500 font-semibold">
                {asset?.assetTagCode || "Loading..."}
              </span>
              {asset && getStatusBadge(asset.status)}
            </div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 mt-1">
              {asset?.assetName || "Asset Details"}
            </h3>
          </div>
          <button 
            onClick={closeDrawer}
            className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-500"></div>
              <p className="text-sm text-zinc-500">Fetching details...</p>
            </div>
          ) : error ? (
            <div className="text-center text-red-500 py-10">
              Failed to load asset details.
            </div>
          ) : asset ? (
            <>
              {/* Basic Overview Section */}
              <div className="space-y-4">
                <h4 className="text-xs font-semibold text-zinc-400 dark:text-zinc-505 uppercase tracking-wider">Overview</h4>
                <div className="grid grid-cols-2 gap-4 bg-zinc-50 dark:bg-zinc-955 p-4 rounded-xl border border-zinc-100 dark:border-zinc-900">
                  <div>
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 block">Asset Type</span>
                    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5 mt-0.5">
                      {asset.assetType === "vehicle" ? (
                        <>
                          <Truck className="w-4 h-4 text-zinc-400" />
                          Vehicle
                        </>
                      ) : (
                        <>
                          <FileText className="w-4 h-4 text-zinc-400" />
                          Appliance
                        </>
                      )}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 block">Vendor Name</span>
                    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 block mt-0.5 truncate" title={asset.vendorName}>
                      {asset.vendorName || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 block">Purchase Cost</span>
                    <span className="text-sm font-semibold text-zinc-950 dark:text-zinc-50 flex items-center gap-0.5 mt-0.5">
                      <DollarSign className="w-3.5 h-3.5 text-zinc-400" />
                      {formatIDR(asset.purchaseCost)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 block">Purchase Date</span>
                    <span className="text-sm font-mono text-zinc-900 dark:text-zinc-100 flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                      {asset.purchaseDate || "N/A"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Location & Cost Center */}
              <div className="space-y-4">
                <h4 className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Allocation & Operations</h4>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-zinc-500 mt-0.5">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-500 block">Location Details</span>
                      <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 block">
                        {asset.location?.siteName || "N/A"}
                      </span>
                      <span className="text-xs text-zinc-500 block mt-0.5 font-mono">
                        Floor {asset.location?.floor || "N/A"} • Room/Section {asset.location?.roomOrSection || "N/A"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-zinc-500 mt-0.5">
                      <Building className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-500 block">Cost Center / Dept</span>
                      <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 block">
                        {asset.costCenter?.departmentName || "N/A"}
                      </span>
                      <span className="text-xs text-zinc-500 block mt-0.5">
                        Division: {asset.costCenter?.division || "N/A"} • ID: <span className="font-mono text-[10px]">{asset.costCenterId}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Type-Specific Details */}
              <div className="space-y-4">
                <h4 className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                  {asset.assetType === "vehicle" ? "Vehicle Specifications" : "Appliance Specifications"}
                </h4>
                <div className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl border border-zinc-100 dark:border-zinc-900 space-y-3">
                  {asset.assetType === "vehicle" && asset.details ? (
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 block">License Plate</span>
                        <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100 mt-0.5 block">{asset.details.licensePlate}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 block">Make & Model</span>
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5 block">{asset.details.make} {asset.details.model}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 block">Odometer Reading</span>
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5 block">{new Intl.NumberFormat("id-ID").format(asset.details.currentOdometer)} km</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 block">Fuel Type</span>
                        <span className="font-semibold capitalize text-zinc-900 dark:text-zinc-100 mt-0.5 block">{asset.details.fuelType}</span>
                      </div>
                      <div className="col-span-2 border-t border-zinc-200 dark:border-zinc-800 my-1"></div>
                      <div>
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 block">Insurance Policy No</span>
                        <span className="font-mono text-zinc-900 dark:text-zinc-100 mt-0.5 block">{asset.details.insurancePolicyNo}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 block">Insurance Expiry</span>
                        <span className="font-mono text-zinc-900 dark:text-zinc-100 mt-0.5 block">{asset.details.insuranceExpiry}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 block">Registration Expiry (STNK)</span>
                        <span className="font-mono text-zinc-900 dark:text-zinc-100 mt-0.5 block">{asset.details.registrationExpiry}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 block">Safety Inspection (KIR)</span>
                        <span className="font-mono text-zinc-900 dark:text-zinc-100 mt-0.5 block">{asset.details.safetyInspectionExpiry || "N/A"}</span>
                      </div>
                      <div className="col-span-2 border-t border-zinc-200 dark:border-zinc-800 my-1"></div>
                      <div className="col-span-2">
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 block">VIN / Chassis Number</span>
                        <span className="font-mono text-zinc-900 dark:text-zinc-100 mt-0.5 block">{asset.details.vinNumber}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 block">Engine Number</span>
                        <span className="font-mono text-zinc-900 dark:text-zinc-100 mt-0.5 block">{asset.details.engineNumber}</span>
                      </div>
                    </div>
                  ) : asset.assetType === "appliance" && asset.details ? (
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 block">Brand</span>
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5 block">{asset.details.brand}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 block">Model Number</span>
                        <span className="font-mono text-zinc-900 dark:text-zinc-100 mt-0.5 block">{asset.details.modelNumber}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 block">Serial Number</span>
                        <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100 mt-0.5 block">{asset.details.serialNumber}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 block">Power Rating</span>
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5 block">{asset.details.powerRatingWatts ? `${asset.details.powerRatingWatts} W` : "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 block">Bulk Quantity</span>
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5 block">{asset.details.isBulk ? `${asset.details.quantity} units` : "Individual"}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-zinc-400 text-center py-2">No specifications found.</div>
                  )}
                </div>
              </div>

              {/* Maintenance & Warranty Info */}
              <div className="space-y-4">
                <h4 className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Lifecycle & Warranty</h4>
                <div className="space-y-3 bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl border border-zinc-100 dark:border-zinc-900 text-xs">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Warranty Expiration</span>
                    <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-100">{asset.warrantyExpiry || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Record Created</span>
                    <span className="font-mono text-zinc-900 dark:text-zinc-100 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-zinc-400" />
                      {new Date(asset.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Last Modified</span>
                    <span className="font-mono text-zinc-900 dark:text-zinc-100 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-zinc-400" />
                      {new Date(asset.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 flex gap-3 bg-zinc-50/50 dark:bg-zinc-900/50">
          <button 
            onClick={closeDrawer}
            className="flex-1 py-2 px-4 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-700 dark:text-zinc-300"
          >
            Close Panel
          </button>
          <button 
            disabled
            className="flex-1 py-2 px-4 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-black rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
          >
            Edit Asset
          </button>
        </div>

      </div>
    </div>
  );
}

export default function AssetDetailsDrawer() {
  return (
    <Suspense fallback={null}>
      <AssetDetailsDrawerContent />
    </Suspense>
  );
}
