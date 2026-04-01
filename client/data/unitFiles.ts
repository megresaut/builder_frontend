import { fetchJSON, authFetch } from "@/api/fetchJSON";

export interface UnitFile {
  id: number;
  name: string;
  type: string;
  category: string;
  description: string;
  author: string;
  url: string;
  created_at: string;
}

export async function fetchUnitFiles(propertyId: number, unitId: number): Promise<UnitFile[]> {
  return fetchJSON(`/properties/${propertyId}/units/${unitId}/files`);
}

export async function uploadUnitFile(
  propertyId: number,
  unitId: number,
  file: File,
): Promise<{ object_key: string; file_name: string; file_type: string }> {
  const form = new FormData();
  form.append("file", file);
  const res = await authFetch(
    `/properties/${propertyId}/units/${unitId}/files/upload`,
    { method: "POST", body: form },
  );
  if (!res.ok) throw new Error("Upload failed");
  return res.json();
}

export async function createUnitFileRecord(
  propertyId: number,
  unitId: number,
  req: {
    name: string;
    type: string;
    category: string;
    description: string;
    object_key: string;
    author: string;
  },
): Promise<UnitFile> {
  return fetchJSON(`/properties/${propertyId}/units/${unitId}/files`, {
    method: "POST",
    body: JSON.stringify(req),
  });
}

export async function updateUnitFile(
  propertyId: number,
  unitId: number,
  fileId: number,
  req: { category?: string; description?: string },
): Promise<void> {
  await fetchJSON(`/properties/${propertyId}/units/${unitId}/files/${fileId}`, {
    method: "PATCH",
    body: JSON.stringify(req),
  });
}

export async function deleteUnitFile(
  propertyId: number,
  unitId: number,
  fileId: number,
): Promise<void> {
  await fetchJSON(`/properties/${propertyId}/units/${unitId}/files/${fileId}`, {
    method: "DELETE",
  });
}
