export interface Asset {
  assetId: string;
  assetTagCode: string;
  assetType: 'appliance' | 'vehicle';
  assetName: string;
  status: 'active' | 'idle' | 'under_maintenance' | 'disposed';
  locationId: string;
  costCenterId: string;
  purchaseDate: string;
  purchaseCost: string;
  vendorName: string;
  warrantyExpiry: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  location?: {
    locationId: string;
    siteName: string;
    floor: string;
    roomOrSection: string;
  } | null;
  details?: {
    brand?: string;
    modelNumber?: string;
    serialNumber?: string;
    powerRatingWatts?: number | null;
    isBulk?: boolean;
    quantity?: number;
    licensePlate?: string;
    vinNumber?: string;
    engineNumber?: string;
    make?: string;
    model?: string;
    manufactureYear?: number;
    fuelType?: 'gasoline' | 'diesel' | 'electric' | 'hybrid';
    currentOdometer?: number;
    registrationExpiry?: string;
    safetyInspectionExpiry?: string | null;
    insurancePolicyNo?: string;
    insuranceExpiry?: string;
  };
}

export interface ExpirationAlert {
  vehicleId: string;
  assetId: string;
  licensePlate: string;
  vinNumber: string;
  engineNumber: string;
  make: string;
  model: string;
  manufactureYear: number;
  fuelType: 'gasoline' | 'diesel' | 'electric' | 'hybrid';
  currentOdometer: number;
  registrationExpiry: string;
  safetyInspectionExpiry: string | null;
  insurancePolicyNo: string;
  insuranceExpiry: string;
  asset_name: string;
  asset_tag_code: string;
  status: string;
  expiring_items: ('registration' | 'safety_inspection' | 'insurance')[];
}
