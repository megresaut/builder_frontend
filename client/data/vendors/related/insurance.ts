export interface VendorInsurance {
  id: number;
  vendorId: number;
  provider: string;
  policyNumber: string;
  expirationDate: string;
}

export const MOCK_VENDOR_INSURANCE: VendorInsurance[] = [];

export async function fetchVendorInsurance(vendorId: number): Promise<VendorInsurance[]> {
  // Mock: filter MOCK_VENDOR_INSURANCE by vendorId
  // API: return fetch(`/api/vendors/${vendorId}/insurance`).then(r => r.json())
  return MOCK_VENDOR_INSURANCE.filter(i => i.vendorId === vendorId);
}

export async function addVendorInsurance(
  vendorId: number,
  provider: string,
  policyNumber: string,
  expirationDate: string,
): Promise<VendorInsurance> {
  // Mock: create + add to MOCK_VENDOR_INSURANCE
  // API: return fetch(`/api/vendors/${vendorId}/insurance`, { method: 'POST', body: JSON.stringify({ ... }) })
  const newInsurance: VendorInsurance = {
    id: Date.now(),
    vendorId,
    provider,
    policyNumber,
    expirationDate,
  };
  MOCK_VENDOR_INSURANCE.push(newInsurance);
  return newInsurance;
}

export async function deleteVendorInsurance(insuranceId: number): Promise<void> {
  // Mock: remove from MOCK_VENDOR_INSURANCE
  // API: return fetch(`/api/insurance/${insuranceId}`, { method: 'DELETE' })
  const idx = MOCK_VENDOR_INSURANCE.findIndex(i => i.id === insuranceId);
  if (idx >= 0) MOCK_VENDOR_INSURANCE.splice(idx, 1);
}

export async function updateVendorInsurance(
  insuranceId: number,
  provider: string,
  policyNumber: string,
  expirationDate: string,
): Promise<VendorInsurance | null> {
  // Mock: update in MOCK_VENDOR_INSURANCE
  // API: return fetch(`/api/insurance/${insuranceId}`, { method: 'PUT', body: JSON.stringify({ ... }) })
  const insurance = MOCK_VENDOR_INSURANCE.find(i => i.id === insuranceId);
  if (!insurance) return null;
  insurance.provider = provider;
  insurance.policyNumber = policyNumber;
  insurance.expirationDate = expirationDate;
  return insurance;
}
