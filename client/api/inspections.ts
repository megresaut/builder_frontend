import { fetchJSON, API_BASE } from "./fetchJSON";

// Backend models
export interface BackendInspection {
  id: number;
  property_id: number;
  property_name?: string | null;
  unit_id?: number | null;
  checklist_id: number;
  assigned_field_team_member_id?: number | null;
  status: string; // "draft" | "in_progress" | "submitted" | "reviewed" | "cancelled"
  due_date?: string | null; // ISO8601
  created_at: string;
  updated_at: string;
}

export interface BackendInspectionChecklist {
  id: number;
  property_id: number;
  name: string;
  checklist_json: any; // flexible JSON structure
  created_by_type: string;
  created_by_id: number;
  is_active: boolean;
  created_at: string;
}

export interface BackendInspectionPhoto {
  id: number;
  inspection_id: number;
  section_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  comment?: string;
  condition?: "good" | "fair" | "poor";
  created_at: string;
}

export interface BackendInspectionFull {
  inspection: BackendInspection;
  checklist: BackendInspectionChecklist | null;
  photos: BackendInspectionPhoto[];
}

// API calls

/**
 * List all inspections (no filters yet; backend TODO: add property filter)
 */
export async function listInspections(): Promise<BackendInspection[]> {
  return fetchJSON("/inspections");
}

/**
 * Get a single inspection by ID
 */
export async function getInspection(id: number): Promise<BackendInspection> {
  return fetchJSON(`/inspections/${id}`);
}

/**
 * Get a full inspection payload (inspection + checklist + photos)
 */
export async function getInspectionFull(id: number): Promise<BackendInspectionFull> {
  return fetchJSON(`/inspections/${id}/full`);
}

/**
 * Create a new inspection
 */
export async function createInspection(
  payload: Omit<BackendInspection, "id" | "created_at" | "updated_at">
): Promise<BackendInspection> {
  return fetchJSON("/inspections", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Update an inspection (status, assigned member, due date)
 */
export async function updateInspection(
  id: number,
  updates: {
    status?: string;
    assigned_field_team_member_id?: number | null;
    due_date?: string | null;
  }
): Promise<BackendInspection> {
  return fetchJSON(`/inspections/${id}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
}

/**
 * List checklists, optionally filtered by property
 */
export async function listChecklists(
  propertyId?: number
): Promise<BackendInspectionChecklist[]> {
  const query = propertyId ? `?property_id=${propertyId}` : "";
  return fetchJSON(`/inspections/checklists${query}`);
}

/**
 * Create a new checklist
 */
export async function createChecklist(
  payload: Omit<BackendInspectionChecklist, "id" | "created_at">
): Promise<BackendInspectionChecklist> {
  return fetchJSON("/inspections/checklists", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Update a checklist's content
 */
export async function updateChecklist(
  id: number,
  checklistJSON: any
): Promise<BackendInspectionChecklist> {
  // Debugging logs removed
  
  return fetchJSON(`/inspections/checklists/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ checklist_json: checklistJSON }),
  });
}

/**
 * Add photos to an inspection (multipart/form-data)
 */
export async function addInspectionPhotos(
  inspectionId: number,
  sectionId: string,
  comment: string,
  files: File[],
  condition?: "good" | "fair" | "poor"
): Promise<{ uploaded: number }> {
  const formData = new FormData();
  formData.append("section_id", sectionId);
  formData.append("comment", comment);
  if (condition) formData.append("condition", condition);
  files.forEach((file) => formData.append("file", file));

  const res = await fetch(
    `${API_BASE}/inspections/${inspectionId}/photos`,
    {
      method: "POST",
      credentials: "include",
      body: formData,
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }

  return res.json();
}

/**
 * List photos for an inspection
 */
export async function listInspectionPhotos(
  inspectionId: number
): Promise<BackendInspectionPhoto[]> {
  return fetchJSON(`/inspections/${inspectionId}/photos`);
}

/**
 * Update a photo's condition and/or comment
 */
export async function updateInspectionPhoto(
  inspectionId: number,
  photoId: number,
  updates: {
    condition?: "good" | "fair" | "poor" | null;
    comment?: string | null;
  }
): Promise<BackendInspectionPhoto> {
  return fetchJSON(`/inspections/${inspectionId}/photos/${photoId}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
}
