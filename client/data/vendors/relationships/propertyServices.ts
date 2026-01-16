import type { BaseVendor } from '../vendors/vendors';
import { MOCK_VENDORS } from '../vendors/vendors';

export interface PropertyVendor extends BaseVendor {
  propertyServices: string[];
}

export const VENDOR_PROPERTY_MAPPING: Record<string, PropertyVendor[]> = {
  "property-1": [
    { ...MOCK_VENDORS[0], propertyServices: ["HVAC", "Plumbing"] },
    { ...MOCK_VENDORS[1], propertyServices: ["Carpentry"] },
  ],
  "property-2": [
    { ...MOCK_VENDORS[2], propertyServices: ["Electrical", "Lighting"] },
  ],
};

export async function fetchVendorsForProperty(propertyId: string): Promise<PropertyVendor[]> {
  // Mock: return VENDOR_PROPERTY_MAPPING[propertyId] || []
  // API: return fetch(`/api/properties/${propertyId}/vendors`).then(r => r.json())
  return VENDOR_PROPERTY_MAPPING[propertyId] || [];
}

export async function getPropertyVendor(vendorId: number, propertyId: string): Promise<PropertyVendor | null> {
  const vendors = await fetchVendorsForProperty(propertyId);
  return vendors.find(v => v.id === vendorId) || null;
}
