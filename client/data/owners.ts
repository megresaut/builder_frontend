import { fetchJSON, authFetch } from "@/api/fetchJSON";

export interface Owner {
  id: number;
  property_id: number;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  ownership_percentage: number;
  owner_since: string | null;
  mailing_address: string | null;
  status: string;
  entity_type: string;
  entity_name: string | null;
  tax_id: string | null;
  last_edited_by_user_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface OwnerDocument {
  id: number;
  owner_id: number;
  document_type: string;
  document_label: string | null;
  document_object_key: string;
  document_mime: string;
  uploaded_by_user_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface OwnerAuditEntry {
  id: number;
  owner_id: number;
  action: string;
  details: string | null;
  performed_by_user_id: number | null;
  created_at: string;
}

export async function fetchOwnersByUnit(unitId: number): Promise<Owner[]> {
  return fetchJSON(`/owners?unit_id=${unitId}`);
}

export async function fetchOwnersByProperty(propertyId: number): Promise<Owner[]> {
  return fetchJSON(`/owners?property_id=${propertyId}`);
}

export async function createOwner(req: {
  property_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  ownership_percentage: number;
  owner_since: string;
  mailing_address: string;
  status: string;
  entity_type: string;
  entity_name: string;
  tax_id: string;
}): Promise<Owner> {
  return fetchJSON("/owners", { method: "POST", body: JSON.stringify(req) });
}

export async function updateOwner(req: {
  id: number;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  ownership_percentage?: number;
  owner_since?: string;
  mailing_address?: string;
  status?: string;
  entity_type?: string;
  entity_name?: string;
  tax_id?: string;
}): Promise<Owner> {
  return fetchJSON("/owners", { method: "PATCH", body: JSON.stringify(req) });
}

export async function deleteOwner(id: number): Promise<void> {
  await fetchJSON(`/owners?id=${id}`, { method: "DELETE" });
}

export async function linkOwnerToUnit(ownerId: number, unitId: number): Promise<void> {
  await fetchJSON("/owners/units/link", {
    method: "POST",
    body: JSON.stringify({ owner_id: ownerId, unit_id: unitId }),
  });
}

export async function fetchOwnerDocuments(ownerId: number): Promise<OwnerDocument[]> {
  return fetchJSON(`/owners/documents?owner_id=${ownerId}`);
}

export async function uploadOwnerFile(file: File): Promise<{ object_key: string; mime: string }> {
  const form = new FormData();
  form.append("file", file);
  const res = await authFetch("/owners/documents/upload", { method: "POST", body: form });
  if (!res.ok) throw new Error("Upload failed");
  return res.json();
}

export async function createOwnerDocument(req: {
  owner_id: number;
  document_type: string;
  document_label: string;
  document_object_key: string;
  document_mime: string;
}): Promise<OwnerDocument> {
  return fetchJSON("/owners/documents", { method: "POST", body: JSON.stringify(req) });
}

export async function deleteOwnerDocument(id: number): Promise<void> {
  await fetchJSON(`/owners/documents?id=${id}`, { method: "DELETE" });
}

export async function fetchOwnerAudit(ownerId: number): Promise<OwnerAuditEntry[]> {
  return fetchJSON(`/owners/audit?owner_id=${ownerId}`);
}
