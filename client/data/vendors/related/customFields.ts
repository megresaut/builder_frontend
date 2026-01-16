export interface VendorCustomField {
  id: number;
  vendorId: number;
  name: string;
  value: string;
}

export const MOCK_VENDOR_CUSTOM_FIELDS: VendorCustomField[] = [];

export async function fetchVendorCustomFields(vendorId: number): Promise<VendorCustomField[]> {
  // Mock: filter MOCK_VENDOR_CUSTOM_FIELDS by vendorId
  // API: return fetch(`/api/vendors/${vendorId}/custom-fields`).then(r => r.json())
  return MOCK_VENDOR_CUSTOM_FIELDS.filter(f => f.vendorId === vendorId);
}

export async function addVendorCustomField(
  vendorId: number,
  name: string,
  value: string,
): Promise<VendorCustomField> {
  // Mock: create + add to MOCK_VENDOR_CUSTOM_FIELDS
  // API: return fetch(`/api/vendors/${vendorId}/custom-fields`, { method: 'POST', body: JSON.stringify({ name, value }) })
  const newField: VendorCustomField = {
    id: Date.now(),
    vendorId,
    name,
    value,
  };
  MOCK_VENDOR_CUSTOM_FIELDS.push(newField);
  return newField;
}

export async function deleteVendorCustomField(fieldId: number): Promise<void> {
  // Mock: remove from MOCK_VENDOR_CUSTOM_FIELDS
  // API: return fetch(`/api/custom-fields/${fieldId}`, { method: 'DELETE' })
  const idx = MOCK_VENDOR_CUSTOM_FIELDS.findIndex(f => f.id === fieldId);
  if (idx >= 0) MOCK_VENDOR_CUSTOM_FIELDS.splice(idx, 1);
}

export async function updateVendorCustomField(
  fieldId: number,
  name: string,
  value: string,
): Promise<VendorCustomField | null> {
  // Mock: update in MOCK_VENDOR_CUSTOM_FIELDS
  // API: return fetch(`/api/custom-fields/${fieldId}`, { method: 'PUT', body: JSON.stringify({ name, value }) })
  const field = MOCK_VENDOR_CUSTOM_FIELDS.find(f => f.id === fieldId);
  if (!field) return null;
  field.name = name;
  field.value = value;
  return field;
}
