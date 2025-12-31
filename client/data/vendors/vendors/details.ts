import type { BaseVendor } from './vendors';
import { MOCK_VENDORS } from './vendors';

export interface VendorDetail extends BaseVendor {
  category: string;
  address?: string;
  website?: string;
  servicesProvided: string;
}

export const MOCK_VENDOR_DETAILS: VendorDetail[] = MOCK_VENDORS.map((vendor) => ({
  ...vendor,
  category: "Uncategorized",
  address: "123 Main St, City, State 12345",
  website: `https://${vendor.name.toLowerCase().replace(/\s+/g, "")}.com`,
  servicesProvided: vendor.servicesProvided.join(", "),
}));

export async function fetchVendorDetail(vendorId: number): Promise<VendorDetail | null> {
  // Mock: return MOCK_VENDOR_DETAILS.find(...)
  // API: return fetch(`/api/vendors/${vendorId}/detail`).then(r => r.json())
  const detail = MOCK_VENDOR_DETAILS.find(v => v.id === vendorId);
  if (detail) {
    return detail;
  }
  return null;
}
