import { describe, it } from 'node:test';
import assert from 'node:assert';
import React from 'react';

// Set React 19 dispatcher to mock hooks
const dispatcher = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useState: (initialValue: any) => {
    return [typeof initialValue === 'function' ? initialValue() : initialValue, () => {}];
  },
  useEffect: () => {},
  useRef: () => ({ current: null }),
  useContext: () => ({}),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useMemo: (fn: any) => fn(),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useCallback: (fn: any) => fn,
  useLayoutEffect: () => {},
  useDebugValue: () => {},
};

function ensureDispatcher() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const internals = (React as any).__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
  if (internals) {
    internals.H = dispatcher;
  }
}

// Now import EditAssetModal
import EditAssetModal from '../../src/components/dashboard/EditAssetModal';

describe('EditAssetModal Component Unit Tests', () => {
  const mockAssetVehicle = {
    assetId: '123',
    assetTagCode: 'AST-VEH-001',
    assetType: 'vehicle',
    assetName: 'Toyota Avanza',
    status: 'active',
    locationId: 'LOC-1',
    costCenterId: 'CC-1',
    purchaseCost: '200000000',
    purchaseDate: '2025-01-01',
    warrantyExpiry: '2026-01-01',
    details: {
      licensePlate: 'B 1234 ABC',
      make: 'Toyota',
      model: 'Avanza',
      fuelType: 'gasoline',
      insurancePolicyNo: 'INS-001',
      insuranceExpiry: '2026-01-01',
      registrationExpiry: '2026-01-01',
      safetyInspectionExpiry: '2026-01-01',
      vinNumber: 'VIN123',
      engineNumber: 'ENG123',
    }
  };

  const mockAssetAppliance = {
    assetId: '456',
    assetTagCode: 'AST-APP-001',
    assetType: 'appliance',
    assetName: 'Sony Bravia TV',
    status: 'active',
    locationId: 'LOC-2',
    costCenterId: 'CC-2',
    purchaseCost: '15000000',
    purchaseDate: '2025-01-15',
    warrantyExpiry: '2027-01-15',
    details: {
      brand: 'Sony',
      modelNumber: 'KD-65X80L',
      serialNumber: 'SN-SONY-001',
      powerRatingWatts: 200,
    }
  };

  it('should return null when isOpen is false', () => {
    ensureDispatcher();
    const result = EditAssetModal({
      isOpen: false,
      onClose: () => {},
      asset: mockAssetVehicle,
      onSuccess: () => {},
    });
    assert.strictEqual(result, null);
  });

  it('should render vehicle fields when assetType is vehicle', () => {
    ensureDispatcher();
    const result = EditAssetModal({
      isOpen: true,
      onClose: () => {},
      asset: mockAssetVehicle,
      onSuccess: () => {},
    });

    assert.ok(result);
    const strRepr = JSON.stringify(result);
    assert.ok(strRepr.includes('Vehicle Specifications'));
    assert.ok(strRepr.includes('License Plate'));
    assert.ok(strRepr.includes('Toyota Avanza'));
    assert.ok(!strRepr.includes('name="status"'));
    assert.ok(!strRepr.includes('select="status"'));
  });

  it('should render appliance fields when assetType is appliance', () => {
    ensureDispatcher();
    const result = EditAssetModal({
      isOpen: true,
      onClose: () => {},
      asset: mockAssetAppliance,
      onSuccess: () => {},
    });

    assert.ok(result);
    const strRepr = JSON.stringify(result);
    assert.ok(strRepr.includes('Appliance Specifications'));
    assert.ok(strRepr.includes('Brand'));
    assert.ok(strRepr.includes('Sony Bravia TV'));
    assert.ok(strRepr.includes('Power Rating (Watts)'));
    assert.ok(!strRepr.includes('name="status"'));
    assert.ok(!strRepr.includes('select="status"'));
  });
});
