export interface BaseVendor {
  id: number;
  name: string;
  phone: string;
  email: string;
  notes: string;
  servicesProvided: string[];
}

/**
 * Mock API abstraction: Fetches vendors from mock data.
 * Mock data is now defined in the Vendors page component.
 *
 * To use a real backend API, replace the function body with:
 * return fetch('/vendors').then(r => r.json());
 *
 * No changes to component logic or useVendors hook are required.
 */
export async function mockFetchVendors(): Promise<BaseVendor[]> {
  return Promise.resolve([]);
}

/**
 * Main fetch function that consumes the mock/real API abstraction.
 * This is what the rest of the app uses (via useVendors hook).
 */
export async function fetchVendors(): Promise<BaseVendor[]> {
  return mockFetchVendors();
}

export async function fetchVendor(vendorId: number): Promise<BaseVendor | null> {
  const all = await fetchVendors();
  return all.find(v => v.id === vendorId) || null;
}
