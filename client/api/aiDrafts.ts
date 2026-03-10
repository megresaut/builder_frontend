import { fetchJSON } from "./fetchJSON";

export interface AIDraft {
  id: number;
  source: string;
  source_ref: string;
  entity_type: string;
  extracted_data: Record<string, any>;
  ai_confidence: number;
  ai_reasoning: string;
  ai_model: string;
  status: string;
  parent_draft_id: number | null;
  reviewed_by: number | null;
  reviewed_at: string | null;
  created_entity_id: number | null;
  created_at: string;
  updated_at: string;
  reviewed_by_name?: string;
}

export async function listDrafts(status?: string, limit = 50): Promise<AIDraft[]> {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  params.set("limit", String(limit));
  return fetchJSON(`/ai/drafts?${params}`);
}

export async function getDraft(id: number): Promise<AIDraft> {
  return fetchJSON(`/ai/drafts/${id}`);
}

export async function approveDraft(id: number, reviewedBy: number, fieldOverrides?: Record<string, any>): Promise<AIDraft> {
  return fetchJSON(`/ai/drafts/${id}/approve`, {
    method: "POST",
    body: JSON.stringify({ reviewed_by: reviewedBy, field_overrides: fieldOverrides }),
  });
}

export async function rejectDraft(id: number, reviewedBy: number): Promise<{ status: string }> {
  return fetchJSON(`/ai/drafts/${id}/reject`, {
    method: "POST",
    body: JSON.stringify({ reviewed_by: reviewedBy }),
  });
}

export async function getDraftCount(): Promise<{ count: number }> {
  return fetchJSON("/ai/drafts/count");
}

export async function checkAIOrigin(entityType: string, entityId: number): Promise<{ ai_generated: boolean; draft_id?: number; confidence?: number; reasoning?: string; source?: string }> {
  return fetchJSON(`/ai/drafts/by-entity?type=${entityType}&entity_id=${entityId}`);
}
