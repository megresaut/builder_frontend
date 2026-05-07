import { fetchJSON, authFetch } from "./fetchJSON";
import type { ChecklistSectionTemplate } from "@/data/inspections";

// Backend models
export interface BackendInspection {
  id: number;
  property_id: number;
  property_name?: string | null;
  unit_id?: number | null;
  checklist_id: number | null;
  assigned_field_team_member_id?: number | null;
  status: string; // "draft" | "in_progress" | "submitted" | "reviewed" | "cancelled"
  due_date?: string | null; // ISO8601 datetime (timestamptz)
  series_id?: number | null;
  occurrence_index?: number | null;
  created_at: string;
  updated_at: string;
}

export type InspectionFrequency = "daily" | "weekly" | "monthly";

export interface InspectionRecurrenceInput {
  frequency: InspectionFrequency;
  interval_count: number;
  end_at?: string | null;       // ISO8601
  occurrence_count?: number | null;
  timezone?: string;
}

export interface BackendInspectionSeries {
  id: number;
  property_id: number;
  unit_id?: number | null;
  location_id?: number | null;
  checklist_id?: number | null;
  assigned_field_team_member_id?: number | null;
  name?: string | null;
  start_at: string;
  frequency: InspectionFrequency;
  interval_count: number;
  end_at?: string | null;
  occurrence_count?: number | null;
  timezone: string;
  outlook_event_id?: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

// Response shape of POST /inspections — single for one-off, series+occurrences for recurring.
export interface CreateInspectionResult {
  inspection?: BackendInspection;
  series?: BackendInspectionSeries;
  occurrences?: BackendInspection[];
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
 * Create a new inspection (one-off). Backend returns a CreateInspectionResult;
 * for a one-off the `inspection` field is populated. Kept returning the bare
 * inspection for backward compatibility with existing callers.
 */
export async function createInspection(
  payload: Omit<BackendInspection, "id" | "created_at" | "updated_at">
): Promise<BackendInspection> {
  const res: CreateInspectionResult = await fetchJSON("/inspections", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.inspection) {
    throw new Error("createInspection: expected single inspection in response");
  }
  return res.inspection;
}

/**
 * Create a recurring inspection series. Backend inserts an inspection_series
 * row plus one inspection per occurrence and pushes a single recurring event
 * to Outlook tied to the series.
 */
export async function createRecurringInspection(
  payload: Omit<BackendInspection, "id" | "created_at" | "updated_at">,
  recurrence: InspectionRecurrenceInput
): Promise<CreateInspectionResult> {
  return fetchJSON("/inspections", {
    method: "POST",
    body: JSON.stringify({ ...payload, recurrence }),
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

  const res = await authFetch(
    `/inspections/${inspectionId}/photos`,
    {
      method: "POST",
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
 * Upload a DOCX file and parse it into checklist sections via AI
 */
export async function parseChecklistDocx(
  file: File
): Promise<{ sections: ChecklistSectionTemplate[] }> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await authFetch(
    `/inspections/checklists/parse-docx`,
    {
      method: "POST",
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
 * Delete an inspection (hard delete if not submitted, soft delete if submitted)
 */
export async function deleteInspection(id: number): Promise<void> {
  const res = await authFetch(`/inspections/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
}

/**
 * Delete a photo from an inspection
 */
export async function deleteInspectionPhoto(
  inspectionId: number,
  photoId: number
): Promise<void> {
  const res = await authFetch(
    `/inspections/${inspectionId}/photos/${photoId}`,
    {
      method: "DELETE",
    }
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
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
