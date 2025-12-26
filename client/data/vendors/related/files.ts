export interface VendorFile {
  id: number;
  vendorId: number;
  name: string;
  url?: string;
  uploadedAt: string;
}

export const MOCK_VENDOR_FILES: VendorFile[] = [];

export async function fetchVendorFiles(vendorId: number): Promise<VendorFile[]> {
  // Mock: filter MOCK_VENDOR_FILES by vendorId
  // API: return fetch(`/api/vendors/${vendorId}/files`).then(r => r.json())
  return MOCK_VENDOR_FILES.filter(f => f.vendorId === vendorId);
}

export async function uploadVendorFile(
  vendorId: number,
  file: File,
): Promise<VendorFile> {
  // Mock: create blob URL + add to MOCK_VENDOR_FILES
  // API: return fetch(`/api/vendors/${vendorId}/files`, { method: 'POST', body: formData })
  const url = URL.createObjectURL(file);
  const newFile: VendorFile = {
    id: Date.now(),
    vendorId,
    name: file.name,
    url,
    uploadedAt: new Date().toLocaleString(),
  };
  MOCK_VENDOR_FILES.push(newFile);
  return newFile;
}

export async function deleteVendorFile(fileId: number): Promise<void> {
  // Mock: revoke URL + remove from MOCK_VENDOR_FILES
  // API: return fetch(`/api/files/${fileId}`, { method: 'DELETE' })
  const file = MOCK_VENDOR_FILES.find(f => f.id === fileId);
  if (file && file.url) {
    try {
      URL.revokeObjectURL(file.url);
    } catch {
      // ignore
    }
  }
  const idx = MOCK_VENDOR_FILES.findIndex(f => f.id === fileId);
  if (idx >= 0) MOCK_VENDOR_FILES.splice(idx, 1);
}
