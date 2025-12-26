import type { BaseVendor } from './vendors';

export interface VendorDetail extends BaseVendor {
  category: string;
  address?: string;
  website?: string;
  servicesProvided: string;
}

export const MOCK_VENDOR_DETAILS: VendorDetail[] = [
  {
    id: 1,
    name: "Dolce Heating & Plumbing",
    phone: "724.705.2990",
    email: "staff@avappraisalmgmt.com",
    notes: "Reliable vendor, quick turnaround",
    category: "Uncategorized",
    address: undefined,
    website: undefined,
    servicesProvided: "Heating, Plumbing",
  },
];

export async function fetchVendorDetail(vendorId: number): Promise<VendorDetail | null> {
  // Mock: return MOCK_VENDOR_DETAILS.find(...)
  // API: return fetch(`/api/vendors/${vendorId}/detail`).then(r => r.json())
  const detail = MOCK_VENDOR_DETAILS.find(v => v.id === vendorId);
  if (detail) {
    return detail;
  }
  return null;
}
