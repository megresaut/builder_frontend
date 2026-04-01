import { fetchJSON } from "@/api/fetchJSON";

export interface UnitNote {
  id: number;
  text: string;
  type: string;
  author: string;
  created_at: string;
}

export async function fetchUnitNotes(propertyId: number, unitId: number): Promise<UnitNote[]> {
  return fetchJSON(`/properties/${propertyId}/units/${unitId}/notes`);
}

export async function createUnitNote(
  propertyId: number,
  unitId: number,
  req: { text: string; type: string; author: string },
): Promise<UnitNote> {
  return fetchJSON(`/properties/${propertyId}/units/${unitId}/notes`, {
    method: "POST",
    body: JSON.stringify(req),
  });
}

export async function updateUnitNote(
  propertyId: number,
  unitId: number,
  noteId: number,
  req: { text?: string; type?: string },
): Promise<void> {
  await fetchJSON(`/properties/${propertyId}/units/${unitId}/notes/${noteId}`, {
    method: "PATCH",
    body: JSON.stringify(req),
  });
}

export async function deleteUnitNote(
  propertyId: number,
  unitId: number,
  noteId: number,
): Promise<void> {
  await fetchJSON(`/properties/${propertyId}/units/${unitId}/notes/${noteId}`, {
    method: "DELETE",
  });
}
