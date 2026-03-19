import { fetchJSON, authFetch, API_BASE } from "@/api/fetchJSON";
import type { Tenant, TenantDocument, CreateTenantRequest, UpdateTenantRequest } from "@/types/tenant";

export async function fetchTenantsByUnit(unitId: number): Promise<Tenant[]> {
  return fetchJSON(`/tenants?unit_id=${unitId}`);
}

export async function fetchTenantsByProperty(propertyId: number): Promise<Tenant[]> {
  return fetchJSON(`/tenants?property_id=${propertyId}`);
}

export async function fetchTenant(id: number): Promise<Tenant> {
  return fetchJSON(`/tenants/get?id=${id}`);
}

export async function createTenant(req: CreateTenantRequest): Promise<Tenant> {
  return fetchJSON("/tenants", {
    method: "POST",
    body: JSON.stringify(req),
  });
}

export async function updateTenant(req: UpdateTenantRequest): Promise<Tenant> {
  return fetchJSON("/tenants", {
    method: "PATCH",
    body: JSON.stringify(req),
  });
}

export async function deleteTenant(id: number): Promise<void> {
  await fetchJSON(`/tenants?id=${id}`, { method: "DELETE" });
}

export async function fetchTenantDocuments(tenantId: number): Promise<TenantDocument[]> {
  return fetchJSON(`/tenants/documents?tenant_id=${tenantId}`);
}

export async function uploadTenantDocument(file: File): Promise<{ object_key: string; mime: string }> {
  const form = new FormData();
  form.append("file", file);
  const res = await authFetch("/tenants/documents/upload", {
    method: "POST",
    body: form,
  });
  if (!res.ok) throw new Error("Upload failed");
  return res.json();
}

export async function createTenantDocument(req: {
  tenant_id: number;
  document_type: string;
  document_label: string;
  document_object_key: string;
  document_mime: string;
}): Promise<TenantDocument> {
  return fetchJSON("/tenants/documents", {
    method: "POST",
    body: JSON.stringify(req),
  });
}

export async function deleteTenantDocument(id: number): Promise<void> {
  await fetchJSON(`/tenants/documents?id=${id}`, { method: "DELETE" });
}
