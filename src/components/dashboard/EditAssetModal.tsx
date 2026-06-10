"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface EditAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  asset: any;
  onSuccess: () => void;
}

export default function EditAssetModal({ isOpen, onClose, asset, onSuccess }: EditAssetModalProps) {
  const [assetName, setAssetName] = useState(asset?.assetName || "");
  const [vendorName, setVendorName] = useState(asset?.vendorName || "");
  const [purchaseCost, setPurchaseCost] = useState(asset?.purchaseCost || "");
  const [purchaseDate, setPurchaseDate] = useState(asset?.purchaseDate || "");
  const [warrantyExpiry, setWarrantyExpiry] = useState(asset?.warrantyExpiry || "");
  const [locationId, setLocationId] = useState(asset?.locationId || "");
  const [costCenterId, setCostCenterId] = useState(asset?.costCenterId || "");

  // Vehicle Details
  const [licensePlate, setLicensePlate] = useState(asset?.details?.licensePlate || "");
  const [make, setMake] = useState(asset?.details?.make || "");
  const [model, setModel] = useState(asset?.details?.model || "");
  const [fuelType, setFuelType] = useState(asset?.details?.fuelType || "gasoline");
  const [insurancePolicyNo, setInsurancePolicyNo] = useState(asset?.details?.insurancePolicyNo || "");
  const [insuranceExpiry, setInsuranceExpiry] = useState(asset?.details?.insuranceExpiry || "");
  const [registrationExpiry, setRegistrationExpiry] = useState(asset?.details?.registrationExpiry || "");
  const [safetyInspectionExpiry, setSafetyInspectionExpiry] = useState(asset?.details?.safetyInspectionExpiry || "");
  const [vinNumber, setVinNumber] = useState(asset?.details?.vinNumber || "");
  const [engineNumber, setEngineNumber] = useState(asset?.details?.engineNumber || "");

  // Appliance Details
  const [brand, setBrand] = useState(asset?.details?.brand || "");
  const [modelNumber, setModelNumber] = useState(asset?.details?.modelNumber || "");
  const [serialNumber, setSerialNumber] = useState(asset?.details?.serialNumber || "");
  const [powerRatingWatts, setPowerRatingWatts] = useState(asset?.details?.powerRatingWatts || "");

  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMsg("");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const details: Record<string, any> = {};
    if (asset.assetType === "vehicle") {
      details.licensePlate = licensePlate;
      details.make = make;
      details.model = model;
      details.fuelType = fuelType;
      details.insurancePolicyNo = insurancePolicyNo;
      details.insuranceExpiry = insuranceExpiry || null;
      details.registrationExpiry = registrationExpiry || null;
      details.safetyInspectionExpiry = safetyInspectionExpiry || null;
      details.vinNumber = vinNumber;
      details.engineNumber = engineNumber;
    } else if (asset.assetType === "appliance") {
      details.brand = brand;
      details.modelNumber = modelNumber;
      details.serialNumber = serialNumber;
      details.powerRatingWatts = powerRatingWatts ? parseInt(String(powerRatingWatts), 10) : null;
    }

    const payload = {
      asset_name: assetName,
      vendor_name: vendorName,
      purchase_cost: purchaseCost ? String(purchaseCost) : "0",
      purchase_date: purchaseDate || null,
      warranty_expiry: warrantyExpiry || null,
      location_id: locationId,
      cost_center_id: costCenterId,
      details,
    };

    try {
      const res = await fetch(`/api/v1/assets/${asset.assetId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-role": "admin", // use admin role to allow updating cost center
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Failed to update asset");
      }

      onSuccess();
      onClose();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-xs"
      />

      {/* Modal Box */}
      <form 
        onSubmit={handleSave}
        className="relative bg-white dark:bg-zinc-900 rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto flex flex-col z-10 border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
              Edit Asset details
            </h3>
            <p className="text-xs text-zinc-500 mt-1">
              Modifying properties of <span className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-600 dark:text-zinc-400 font-semibold">{asset.assetTagCode}</span>
            </p>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/30 rounded-lg text-sm">
            {errorMsg}
          </div>
        )}

        {/* Form Fields */}
        <div className="space-y-6">
          {/* Base Asset Info */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Base Asset Info</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-semibold block mb-1">Asset Name</label>
                <input 
                  type="text" 
                  required
                  value={assetName} 
                  onChange={(e) => setAssetName(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-transparent text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                />
              </div>

              <div>
                <label className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-semibold block mb-1">Vendor Name</label>
                <input 
                  type="text" 
                  required
                  value={vendorName} 
                  onChange={(e) => setVendorName(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-transparent text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                />
              </div>

              <div>
                <label className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-semibold block mb-1">Purchase Cost (IDR)</label>
                <input 
                  type="number" 
                  required
                  value={purchaseCost} 
                  onChange={(e) => setPurchaseCost(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-transparent text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                />
              </div>

              <div>
                <label className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-semibold block mb-1">Purchase Date</label>
                <input 
                  type="date" 
                  required
                  value={purchaseDate ? purchaseDate.substring(0, 10) : ""} 
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-transparent text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                />
              </div>

              <div>
                <label className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-semibold block mb-1">Warranty Expiry</label>
                <input 
                  type="date" 
                  value={warrantyExpiry ? warrantyExpiry.substring(0, 10) : ""} 
                  onChange={(e) => setWarrantyExpiry(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-transparent text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                />
              </div>

              <div>
                <label className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-semibold block mb-1">Location ID</label>
                <input 
                  type="text" 
                  required
                  value={locationId} 
                  onChange={(e) => setLocationId(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-transparent text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400 font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-semibold block mb-1">Cost Center ID</label>
                <input 
                  type="text" 
                  required
                  value={costCenterId} 
                  onChange={(e) => setCostCenterId(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-transparent text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Conditional Specification Fields */}
          <div className="space-y-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <h4 className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
              {asset.assetType === "vehicle" ? "Vehicle Specifications" : "Appliance Specifications"}
            </h4>

            {asset.assetType === "vehicle" ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-semibold block mb-1">License Plate</label>
                  <input 
                    type="text" 
                    required
                    value={licensePlate} 
                    onChange={(e) => setLicensePlate(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-transparent text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-semibold block mb-1">Fuel Type</label>
                  <select 
                    value={fuelType} 
                    onChange={(e) => setFuelType(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                  >
                    <option value="gasoline">Gasoline</option>
                    <option value="diesel">Diesel</option>
                    <option value="electric">Electric</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-semibold block mb-1">Make</label>
                  <input 
                    type="text" 
                    required
                    value={make} 
                    onChange={(e) => setMake(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-transparent text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-semibold block mb-1">Model</label>
                  <input 
                    type="text" 
                    required
                    value={model} 
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-transparent text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-semibold block mb-1">Insurance Policy No</label>
                  <input 
                    type="text" 
                    required
                    value={insurancePolicyNo} 
                    onChange={(e) => setInsurancePolicyNo(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-transparent text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400 font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-semibold block mb-1">Insurance Expiry</label>
                  <input 
                    type="date" 
                    required
                    value={insuranceExpiry ? insuranceExpiry.substring(0, 10) : ""} 
                    onChange={(e) => setInsuranceExpiry(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-transparent text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-semibold block mb-1">Registration Expiry (STNK)</label>
                  <input 
                    type="date" 
                    required
                    value={registrationExpiry ? registrationExpiry.substring(0, 10) : ""} 
                    onChange={(e) => setRegistrationExpiry(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-transparent text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-semibold block mb-1">Safety Inspection Expiry (KIR)</label>
                  <input 
                    type="date" 
                    value={safetyInspectionExpiry ? safetyInspectionExpiry.substring(0, 10) : ""} 
                    onChange={(e) => setSafetyInspectionExpiry(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-transparent text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-semibold block mb-1">VIN / Chassis Number</label>
                  <input 
                    type="text" 
                    required
                    value={vinNumber} 
                    onChange={(e) => setVinNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-transparent text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400 font-mono"
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-semibold block mb-1">Engine Number</label>
                  <input 
                    type="text" 
                    required
                    value={engineNumber} 
                    onChange={(e) => setEngineNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-transparent text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400 font-mono"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-semibold block mb-1">Brand</label>
                  <input 
                    type="text" 
                    required
                    value={brand} 
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-transparent text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-semibold block mb-1">Model Number</label>
                  <input 
                    type="text" 
                    required
                    value={modelNumber} 
                    onChange={(e) => setModelNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-transparent text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-semibold block mb-1">Serial Number</label>
                  <input 
                    type="text" 
                    required
                    value={serialNumber} 
                    onChange={(e) => setSerialNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-transparent text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400 font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-semibold block mb-1">Power Rating (Watts)</label>
                  <input 
                    type="number" 
                    value={powerRatingWatts} 
                    onChange={(e) => setPowerRatingWatts(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-transparent text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex gap-3 justify-end">
          <button 
            type="button"
            onClick={onClose}
            className="py-2 px-4 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-700 dark:text-zinc-300"
          >
            Cancel
          </button>
          <button 
            type="submit"
            disabled={isSaving}
            className="py-2 px-6 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-black rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
