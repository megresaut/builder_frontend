import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "react-router-dom";
import PageTemplate from "@/layout/PageTemplate";
import {
  listDrafts,
  approveDraft,
  rejectDraft,
  getDraftCount,
  listFeedback,
  createFeedback,
  deleteFeedback,
  type AIDraft,
  type AIFeedback,
  type DuplicateMatch,
} from "@/api/aiDrafts";
import { fetchJSON } from "@/api/fetchJSON";
import CreateFTOModal from "@/components/CreateFTOModal";
import CreateTaskModal from "@/components/CreateTaskModal";
import CreateWorkOrderModalV2 from "@/components/CreateWorkOrderModalV2";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function extractName(draft: AIDraft): string {
  const d = draft.extracted_data;
  if (draft.entity_type === "fto_merge" && d?.source_fto && d?.target_fto) {
    return `Merge "${d.source_fto.name}" → "${d.target_fto.name}"`;
  }
  if (d?.name) return d.name;
  if (d?.title) return d.title;
  if (d?.subject) return d.subject;
  if (d?.task_name) return d.task_name;
  if (d?.description) {
    const desc = String(d.description);
    return desc.length > 60 ? desc.slice(0, 57) + "..." : desc;
  }
  return `Draft #${draft.id}`;
}

/** Group parent drafts with their child work orders */
function groupDrafts(
  drafts: AIDraft[]
): { parent: AIDraft; children: AIDraft[] }[] {
  const parentIds = new Set(
    drafts.filter((d) => !d.parent_draft_id).map((d) => d.id)
  );
  const childrenMap = new Map<number, AIDraft[]>();

  for (const d of drafts) {
    if (d.parent_draft_id && parentIds.has(d.parent_draft_id)) {
      const existing = childrenMap.get(d.parent_draft_id) || [];
      existing.push(d);
      childrenMap.set(d.parent_draft_id, existing);
    }
  }

  const groups: { parent: AIDraft; children: AIDraft[] }[] = [];
  const usedIds = new Set<number>();

  for (const d of drafts) {
    if (usedIds.has(d.id)) continue;
    if (!d.parent_draft_id) {
      usedIds.add(d.id);
      const children = childrenMap.get(d.id) || [];
      children.forEach((c) => usedIds.add(c.id));
      groups.push({ parent: d, children });
    }
  }

  // Orphan children that didn't match a parent in this set
  for (const d of drafts) {
    if (!usedIds.has(d.id)) {
      groups.push({ parent: d, children: [] });
    }
  }

  // Sort all groups newest-first by parent created_at
  groups.sort(
    (a, b) =>
      new Date(b.parent.created_at).getTime() -
      new Date(a.parent.created_at).getTime()
  );

  return groups;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function EntityTypeBadge({ type }: { type: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    task: { bg: "bg-blue-50", text: "text-blue-600", label: "Task" },
    fto: { bg: "bg-emerald-50", text: "text-emerald-600", label: "FTO" },
    work_order: {
      bg: "bg-purple-50",
      text: "text-purple-600",
      label: "Work Order",
    },
    fto_merge: {
      bg: "bg-orange-50",
      text: "text-orange-600",
      label: "FTO Merge",
    },
  };
  const c = config[type] || {
    bg: "bg-gray-50",
    text: "text-gray-600",
    label: type,
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium ${c.bg} ${c.text}`}
    >
      {c.label}
    </span>
  );
}

function SourceBadge({ source }: { source: string }) {
  const config: Record<string, { label: string; icon: string }> = {
    calendar: { label: "Calendar", icon: "M6 2V5M18 2V5M3 9H21M5 4H19C20.1046 4 21 4.89543 21 6V20C21 21.1046 20.1046 22 19 22H5C3.89543 22 3 21.1046 3 20V6C3 4.89543 3.89543 4 5 4Z" },
    sms: { label: "SMS", icon: "M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" },
    buildium: { label: "Buildium", icon: "M3 21V3H10V8H21V21H3ZM5 5V19H8V10H19V19H19V8H10V5H5ZM12 19H14V14H12V19ZM16 19H18V14H16V19Z" },
  };
  const c = config[source] || { label: source, icon: "" };
  return (
    <span className="inline-flex items-center gap-1 text-xs text-[#717179]">
      {c.icon && (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
          <path d={c.icon} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      {c.label}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { dot: string; text: string; label: string }> = {
    pending: { dot: "bg-amber-400", text: "text-amber-600", label: "Pending" },
    approved: { dot: "bg-emerald-500", text: "text-emerald-600", label: "Approved" },
    rejected: { dot: "bg-red-400", text: "text-red-500", label: "Rejected" },
  };
  const c = config[status] || { dot: "bg-gray-400", text: "text-gray-500", label: status };
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  let color = "#ef4444";
  if (value >= 0.8) color = "#22c55e";
  else if (value >= 0.6) color = "#eab308";

  const size = 20;
  const strokeWidth = 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const filled = circumference * value;

  return (
    <div className="flex items-center gap-1.5">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#f0f0f0"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${filled} ${circumference - filled}`}
          strokeLinecap="round"
        />
      </svg>
      <span className="text-[11px] tabular-nums" style={{ color }}>{pct}%</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Expanded detail panel
// ---------------------------------------------------------------------------

function DraftDetailPanel({
  draft,
  propertyMap,
  vendorMap,
  userMap,
}: {
  draft: AIDraft;
  propertyMap: Record<number, string>;
  vendorMap: Record<number, string>;
  userMap: Record<number, string>;
}) {
  /** Resolve an ID field to a display name, falling back to the raw value. */
  function resolveValue(key: string, value: unknown): string {
    if (value == null) return "";

    // Single-ID fields → property / vendor
    if (key === "property_id" && typeof value === "number") {
      return propertyMap[value] || String(value);
    }
    if (key === "vendor_id" && typeof value === "number") {
      return vendorMap[value] || String(value);
    }

    // Single user-ID fields
    if (
      (key === "assigned_to" ||
        key === "requested_by" ||
        key === "reviewed_by_user_id" ||
        key === "last_edited_by_user_id") &&
      typeof value === "number"
    ) {
      return userMap[value] || String(value);
    }

    // Array-of-user-ID fields
    if (
      (key === "field_team_member_ids" ||
        key === "pm_assignee_ids" ||
        key === "assignee_ids" ||
        key === "collaborator_ids") &&
      Array.isArray(value)
    ) {
      const names = value.map((id: number) => userMap[id] || String(id));
      return names.join(", ");
    }

    if (typeof value === "object") return JSON.stringify(value);

    // Format ISO date/datetime strings
    if (
      typeof value === "string" &&
      (key.endsWith("_at") || key.endsWith("_date") || key === "due_date") &&
      /^\d{4}-\d{2}-\d{2}T/.test(value)
    ) {
      return formatDateTime(value);
    }

    return String(value);
  }

  // FTO Merge comparison view
  if (draft.entity_type === "fto_merge") {
    const sourceFTO = draft.extracted_data?.source_fto;
    const targetFTO = draft.extracted_data?.target_fto;

    return (
      <div className="px-6 py-4 bg-[#fafafa] border-t border-[#f0f0f0]">
        {/* Reasoning */}
        <div className="mb-4">
          <h4 className="text-xs font-semibold text-[#717179] uppercase tracking-wider mb-2">
            AI Reasoning
          </h4>
          <p className="text-sm text-[#303030] leading-relaxed">
            {draft.ai_reasoning || "No reasoning provided."}
          </p>
        </div>

        {/* Side-by-side comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          {/* Source FTO (submission) */}
          <div className="bg-white border border-orange-200 rounded-lg p-4">
            <h4 className="text-xs font-semibold text-orange-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Submission FTO
            </h4>
            {sourceFTO ? (
              <table className="w-full text-xs">
                <tbody>
                  <tr className="border-b border-[#f5f5f5]">
                    <td className="py-1.5 text-[#717179] font-medium w-[100px]">Name</td>
                    <td className="py-1.5 text-[#303030]">{sourceFTO.name}</td>
                  </tr>
                  <tr className="border-b border-[#f5f5f5]">
                    <td className="py-1.5 text-[#717179] font-medium">Description</td>
                    <td className="py-1.5 text-[#303030]">{sourceFTO.description || "—"}</td>
                  </tr>
                  <tr className="border-b border-[#f5f5f5]">
                    <td className="py-1.5 text-[#717179] font-medium">Status</td>
                    <td className="py-1.5 text-[#303030]">{sourceFTO.status}</td>
                  </tr>
                  <tr className="border-b border-[#f5f5f5]">
                    <td className="py-1.5 text-[#717179] font-medium">Hours</td>
                    <td className="py-1.5 text-[#303030]">{sourceFTO.hours_decimal || 0}h</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 text-[#717179] font-medium">Created</td>
                    <td className="py-1.5 text-[#303030]">{sourceFTO.created_at ? formatDateTime(sourceFTO.created_at) : "—"}</td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <p className="text-xs text-[#999]">No data available</p>
            )}
          </div>

          {/* Target FTO (existing) */}
          <div className="bg-white border border-emerald-200 rounded-lg p-4">
            <h4 className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M9 12L11 14L15 10M12 3L2 21H22L12 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Existing FTO
              {targetFTO?.task_id && (
                <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] bg-blue-50 text-blue-600 font-medium">Task-linked</span>
              )}
            </h4>
            {targetFTO ? (
              <table className="w-full text-xs">
                <tbody>
                  <tr className="border-b border-[#f5f5f5]">
                    <td className="py-1.5 text-[#717179] font-medium w-[100px]">Name</td>
                    <td className="py-1.5 text-[#303030]">{targetFTO.name}</td>
                  </tr>
                  <tr className="border-b border-[#f5f5f5]">
                    <td className="py-1.5 text-[#717179] font-medium">Description</td>
                    <td className="py-1.5 text-[#303030]">{targetFTO.description || "—"}</td>
                  </tr>
                  <tr className="border-b border-[#f5f5f5]">
                    <td className="py-1.5 text-[#717179] font-medium">Status</td>
                    <td className="py-1.5 text-[#303030]">{targetFTO.status}</td>
                  </tr>
                  <tr className="border-b border-[#f5f5f5]">
                    <td className="py-1.5 text-[#717179] font-medium">Hours</td>
                    <td className="py-1.5 text-[#303030]">{targetFTO.hours_decimal || 0}h</td>
                  </tr>
                  <tr className="border-b border-[#f5f5f5]">
                    <td className="py-1.5 text-[#717179] font-medium">Due Date</td>
                    <td className="py-1.5 text-[#303030]">{targetFTO.due_date ? formatDateTime(targetFTO.due_date) : "—"}</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 text-[#717179] font-medium">Created</td>
                    <td className="py-1.5 text-[#303030]">{targetFTO.created_at ? formatDateTime(targetFTO.created_at) : "—"}</td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <p className="text-xs text-[#999]">No data available</p>
            )}
          </div>
        </div>

        {/* Merge summary */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
          <p className="text-xs text-orange-700">
            <strong>Merge:</strong> Approving will move all submissions and attachments from the submission FTO to the existing FTO,
            combine field team members, recalculate hours, and delete the submission FTO.
          </p>
        </div>

        {draft.reviewed_at && (
          <div className="mt-4 pt-3 border-t border-[#e5e5e5] text-xs text-[#a1a1a9]">
            Reviewed {formatDateTime(draft.reviewed_at)}
            {draft.reviewed_by_name ? ` by ${draft.reviewed_by_name}` : ""}
            {draft.created_entity_id
              ? ` — Merged into FTO #${draft.created_entity_id}`
              : ""}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="px-6 py-4 bg-[#fafafa] border-t border-[#f0f0f0]">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h4 className="text-xs font-semibold text-[#717179] uppercase tracking-wider mb-2">
            AI Reasoning
          </h4>
          <p className="text-sm text-[#303030] leading-relaxed">
            {draft.ai_reasoning || "No reasoning provided."}
          </p>
          <div className="mt-3 flex items-center gap-4 text-xs text-[#a1a1a9]">
            <span>Model: {draft.ai_model}</span>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-semibold text-[#717179] uppercase tracking-wider mb-2">
            Extracted Data
          </h4>
          <div className="bg-white border border-[#e5e5e5] rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <tbody>
                {Object.entries(draft.extracted_data || {}).map(
                  ([key, value]) => (
                    <tr key={key} className="border-b border-[#f5f5f5] last:border-0">
                      <td className="px-3 py-2 text-[#717179] text-xs font-medium align-top whitespace-nowrap bg-[#fafafa] w-[140px]">
                        {key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                      </td>
                      <td className="px-3 py-2 text-[#303030] text-xs break-words">
                        {resolveValue(key, value)}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Duplicate matches */}
      {draft.duplicate_of && (draft.duplicate_of as any).matches?.length > 0 && (
        <div className="mt-4 pt-3 border-t border-[#e5e5e5]">
          <h4 className="text-xs font-semibold text-orange-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M12 9V13M12 17H12.01M12 3L2 21H22L12 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Potential Duplicates
          </h4>
          <p className="text-xs text-[#717179] mb-2">{(draft.duplicate_of as any).summary}</p>
          <div className="space-y-2">
            {((draft.duplicate_of as any).matches as DuplicateMatch[]).map((m, i) => (
              <div key={i} className="flex items-start gap-2 p-2.5 bg-orange-50 border border-orange-100 rounded-lg">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <EntityTypeBadge type={m.entity_type} />
                    <span className="text-xs font-medium text-[#303030] truncate">{m.name}</span>
                    <span className="text-[10px] text-orange-600 font-medium ml-auto whitespace-nowrap">
                      {Math.round(m.confidence * 100)}% match
                    </span>
                  </div>
                  <p className="text-[11px] text-[#717179] mt-1">{m.reasoning}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {draft.reviewed_at && (
        <div className="mt-4 pt-3 border-t border-[#e5e5e5] text-xs text-[#a1a1a9]">
          Reviewed {formatDateTime(draft.reviewed_at)}
          {draft.reviewed_by_name ? ` by ${draft.reviewed_by_name}` : ""}
          {draft.created_entity_id
            ? ` — Created entity #${draft.created_entity_id}`
            : ""}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function AIDrafts() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [drafts, setDrafts] = useState<AIDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [duplicateCount, setDuplicateCount] = useState(0);
  const [viewTab, setViewTab] = useState<"pending" | "duplicates" | "history">("pending");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const didAutoExpand = useRef(false);
  const [actionInFlight, setActionInFlight] = useState<number | null>(null);
  const [approveAllInFlight, setApproveAllInFlight] = useState(false);
  const [approveAllProgress, setApproveAllProgress] = useState({ done: 0, total: 0 });
  const [approveAllResult, setApproveAllResult] = useState<{
    approved: number;
    total: number;
    failures: Record<number, string>; // draft id → error reason
  } | null>(null);
  const [editingDraft, setEditingDraft] = useState<AIDraft | null>(null);
  const [showFTOModal, setShowFTOModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showWOModal, setShowWOModal] = useState(false);
  const [cascadeConfirm, setCascadeConfirm] = useState<AIDraft | null>(null);
  const [cascadeOverrides, setCascadeOverrides] = useState<Record<string, any> | undefined>(undefined);
  const [duplicateWarning, setDuplicateWarning] = useState<{
    draft: AIDraft;
    matches: DuplicateMatch[];
    summary: string;
  } | null>(null);

  // Feedback
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackList, setFeedbackList] = useState<AIFeedback[]>([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackSource, setFeedbackSource] = useState("general");
  const [feedbackType, setFeedbackType] = useState("correction");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);

  // Filters
  const [filterType, setFilterType] = useState<string>("all");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  // Name lookup maps (id → name)
  const [propertyMap, setPropertyMap] = useState<Record<number, string>>({});
  const [vendorMap, setVendorMap] = useState<Record<number, string>>({});
  const [userMap, setUserMap] = useState<Record<number, string>>({});
  const [userEmailMap, setUserEmailMap] = useState<Record<number, string>>({});

  useEffect(() => {
    Promise.all([
      fetchJSON("/properties").catch(() => []),
      fetchJSON("/vendors?limit=5000&offset=0").catch(() => []),
      fetchJSON("/users/all").catch(() => []),
    ]).then(([props, vendors, users]) => {
      const pm: Record<number, string> = {};
      for (const p of props) pm[p.id] = p.name;
      setPropertyMap(pm);

      const vm: Record<number, string> = {};
      for (const v of vendors) vm[v.id] = v.name;
      setVendorMap(vm);

      const um: Record<number, string> = {};
      const uem: Record<number, string> = {};
      for (const u of users) {
        um[u.id] = u.name || u.email || String(u.id);
        uem[u.id] = u.email || "";
      }
      setUserMap(um);
      setUserEmailMap(uem);
    });
  }, []);

  // -----------------------------------------------------------------------
  // Data loading — tab-based: pending, duplicates, or all (history)
  // -----------------------------------------------------------------------

  const loadDrafts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const statusParam = viewTab === "history" ? undefined : "pending";
      const [data, countResp] = await Promise.all([
        listDrafts(statusParam),
        getDraftCount(),
      ]);

      // Separate by tab — sort newest first within each group
      const byNewest = (a: AIDraft, b: AIDraft) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      const pendingAll = data.filter((d) => d.status === "pending").sort(byNewest);
      const pendingNonDup = pendingAll.filter((d) => !d.duplicate_of);
      const pendingDup = pendingAll.filter((d) => d.duplicate_of);
      const historyItems = data
        .filter((d) => d.status === "approved" || d.status === "rejected")
        .sort(byNewest);

      if (viewTab === "duplicates") {
        setDrafts(pendingDup);
      } else if (viewTab === "history") {
        setDrafts(historyItems);
      } else {
        setDrafts(pendingNonDup);
      }

      setPendingCount(pendingNonDup.length);
      setDuplicateCount(pendingDup.length);
    } catch (err: any) {
      console.error("Error loading AI drafts:", err);
      setError(err.message ?? "Failed to load drafts");
      setDrafts([]);
    } finally {
      setLoading(false);
    }
  }, [viewTab]);

  useEffect(() => {
    loadDrafts();
  }, [loadDrafts]);

  useEffect(() => {
    const handler = () => loadDrafts();
    window.addEventListener("refreshAIDrafts", handler);
    return () => window.removeEventListener("refreshAIDrafts", handler);
  }, [loadDrafts]);

  // Auto-expand a draft if linked from the notification panel (?expand=ID)
  useEffect(() => {
    if (didAutoExpand.current || loading || drafts.length === 0) return;
    const expandParam = searchParams.get("expand");
    if (expandParam) {
      const id = Number(expandParam);
      if (id && drafts.some((d) => d.id === id)) {
        setExpandedId(id);
      }
      // Clean up the URL param
      searchParams.delete("expand");
      setSearchParams(searchParams, { replace: true });
      didAutoExpand.current = true;
    }
  }, [loading, drafts, searchParams, setSearchParams]);

  // -----------------------------------------------------------------------
  // Actions
  // -----------------------------------------------------------------------

  const currentUserId = useMemo(() => {
    const raw = localStorage.getItem("avm_user_id");
    return raw ? Number(raw) : 0;
  }, []);

  const loadFeedback = useCallback(async () => {
    setFeedbackLoading(true);
    try {
      const data = await listFeedback();
      setFeedbackList(data.filter((f) => f.active));
    } catch { /* ignore */ }
    setFeedbackLoading(false);
  }, []);

  useEffect(() => {
    if (showFeedback) loadFeedback();
  }, [showFeedback, loadFeedback]);

  const handleSubmitFeedback = useCallback(async () => {
    if (!feedbackMessage.trim()) return;
    setFeedbackSubmitting(true);
    try {
      await createFeedback({
        user_id: currentUserId,
        source: feedbackSource,
        feedback_type: feedbackType,
        message: feedbackMessage.trim(),
      });
      setFeedbackMessage("");
      loadFeedback();
    } catch { /* ignore */ }
    setFeedbackSubmitting(false);
  }, [currentUserId, feedbackSource, feedbackType, feedbackMessage, loadFeedback]);

  const handleDeleteFeedback = useCallback(async (id: number) => {
    try {
      await deleteFeedback(id);
      setFeedbackList((prev) => prev.filter((f) => f.id !== id));
    } catch { /* ignore */ }
  }, []);

  /** Find pending children of a given parent draft */
  const getPendingChildren = useCallback(
    (parentId: number) =>
      drafts.filter(
        (d) => d.parent_draft_id === parentId && d.status === "pending"
      ),
    [drafts]
  );

  /** Turn raw server/SQL errors into user-friendly messages */
  const friendlyError = (raw: string): string => {
    const s = raw.toLowerCase();
    if (s.includes("tasks_property_id_fkey") || s.includes("property_id"))
      return "No property assigned — please select a property before approving";
    if (s.includes("tasks_assignee") || s.includes("assignee"))
      return "No assignee — please assign someone before approving";
    if (s.includes("vendor") && s.includes("fkey"))
      return "Vendor not found — please select a valid vendor";
    if (s.includes("vendor") && (s.includes("before approving") || s.includes("select a vendor")))
      return "Please select a vendor for the work order before approving";
    if (s.includes("parent") && s.includes("approved"))
      return "Parent task must be approved first";
    if (s.includes("duplicate"))
      return "This item was flagged as a potential duplicate";
    if (s.includes("already approved") || s.includes("not pending"))
      return "Already approved or no longer pending";
    if (s.includes("23503"))
      return "Missing required reference — edit the draft to fill in missing fields";
    if (s.includes("23505"))
      return "A matching record already exists";
    if (s.includes("23502") || s.includes("not-null"))
      return "Required field is missing — edit the draft to fill in all fields";
    // Strip nested "failed to create task: create task:" prefixes
    const cleaned = raw.replace(/failed to \w+ \w+: \w+ \w+: /gi, "").trim();
    return cleaned || "Unexpected error";
  };

  /** Actually perform the approval (after all checks pass) */
  const doApprove = useCallback(
    async (draft: AIDraft, fieldOverrides?: Record<string, any>): Promise<boolean> => {
      try {
        setActionInFlight(draft.id);
        setCascadeConfirm(null);
        setCascadeOverrides(undefined);
        setDuplicateWarning(null);
        setApproveAllResult(null);

        const shouldCascade =
          draft.entity_type === "task" &&
          getPendingChildren(draft.id).length > 0;

        try {
          await approveDraft(draft.id, currentUserId, fieldOverrides, shouldCascade);
        } catch (err: any) {
          if (!shouldCascade) throw err;
          // Cascade failed (e.g. a child WO has no vendor) — approve just the task,
          // then try each child individually so FTO etc. still get approved.
          await approveDraft(draft.id, currentUserId, undefined, false);
          const children = getPendingChildren(draft.id);
          const childFailures: string[] = [];
          for (const child of children) {
            try {
              await approveDraft(child.id, currentUserId, undefined, false);
            } catch (childErr: any) {
              childFailures.push(
                child.entity_type === "work_order"
                  ? "Work order"
                  : child.entity_type === "fto"
                  ? "Field team order"
                  : child.entity_type
              );
            }
          }
          if (childFailures.length > 0) {
            setError(
              `Task approved. ${childFailures.join(" and ")} could not be approved — please review and approve ${childFailures.length === 1 ? "it" : "them"} individually.`
            );
          }
        }

        await loadDrafts();
        return true;
      } catch (err: any) {
        console.error("Approve failed:", err);
        setError(friendlyError(err.message ?? "Failed to approve draft"));
        return false;
      } finally {
        setActionInFlight(null);
      }
    },
    [currentUserId, loadDrafts, getPendingChildren]
  );

  const handleApprove = useCallback(
    async (draft: AIDraft, skipDuplicateCheck = false, fieldOverrides?: Record<string, any>): Promise<boolean> => {
      if (actionInFlight) return false;

      // Block child (FTO / WO) approval if parent task is not yet approved
      if (
        (draft.entity_type === "work_order" || draft.entity_type === "fto") &&
        draft.parent_draft_id
      ) {
        const parentDraft = drafts.find((d) => d.id === draft.parent_draft_id);
        if (parentDraft && parentDraft.status !== "approved") {
          setError(
            "Please approve the parent task first before approving this " +
              (draft.entity_type === "fto" ? "field team order" : "work order") +
              "."
          );
          return false;
        }
      }

      // If this is a task with pending children, show cascade confirmation
      if (draft.entity_type === "task") {
        const pendingChildren = getPendingChildren(draft.id);
        if (pendingChildren.length > 0 && !cascadeConfirm) {
          setCascadeConfirm(draft);
          setCascadeOverrides(fieldOverrides);
          return false;
        }
      }

      // fto_merge drafts ARE the duplicate resolution — skip duplicate warning
      // If this draft was flagged as a potential duplicate, show warning before approving
      if (!skipDuplicateCheck && draft.entity_type !== "fto_merge" && draft.duplicate_of) {
        const dupData = draft.duplicate_of as any;
        if (dupData.matches?.length > 0) {
          setDuplicateWarning({
            draft,
            matches: dupData.matches,
            summary: dupData.summary || "This item was flagged as a potential duplicate.",
          });
          return false;
        }
      }

      return await doApprove(draft, fieldOverrides);
    },
    [currentUserId, actionInFlight, loadDrafts, drafts, getPendingChildren, cascadeConfirm, doApprove]
  );

  const handleReject = useCallback(
    async (draft: AIDraft) => {
      if (actionInFlight) return;
      try {
        setActionInFlight(draft.id);
        await rejectDraft(draft.id, currentUserId);
        await loadDrafts();
      } catch (err: any) {
        console.error("Reject failed:", err);
        setError(err.message ?? "Failed to reject draft");
      } finally {
        setActionInFlight(null);
      }
    },
    [currentUserId, actionInFlight, loadDrafts]
  );

  const handleApproveAll = useCallback(async () => {
    if (actionInFlight || approveAllInFlight) return;
    setApproveAllInFlight(true);
    setError(null);
    setApproveAllResult(null);

    // Work on the current pending drafts list
    const pending = [...drafts].filter((d) => d.status === "pending");

    // Approve parent tasks first (they cascade to children), then the rest
    const parentTasks = pending.filter(
      (d) => d.entity_type === "task" && !d.parent_draft_id
    );
    const rest = pending.filter(
      (d) => !(d.entity_type === "task" && !d.parent_draft_id)
    );
    const ordered = [...parentTasks, ...rest];

    // Track which draft IDs were already approved via cascade so we skip them
    const cascadedChildIds = new Set<number>();
    for (const parent of parentTasks) {
      for (const child of getPendingChildren(parent.id)) {
        cascadedChildIds.add(child.id);
      }
    }

    // Filter out children that will be cascade-approved with their parent
    const toApprove = ordered.filter((d) => !cascadedChildIds.has(d.id));

    setApproveAllProgress({ done: 0, total: toApprove.length });

    const failures: Record<number, string> = {};
    for (let i = 0; i < toApprove.length; i++) {
      const draft = toApprove[i];
      try {
        setActionInFlight(draft.id);

        const shouldCascade =
          draft.entity_type === "task" &&
          getPendingChildren(draft.id).length > 0;

        await approveDraft(draft.id, currentUserId, undefined, shouldCascade);
      } catch (err: any) {
        console.error(`Approve all: failed draft ${draft.id}:`, err);
        failures[draft.id] = friendlyError(err.message ?? "Unknown error");
      } finally {
        setActionInFlight(null);
      }
      setApproveAllProgress({ done: i + 1, total: toApprove.length });
    }

    await loadDrafts();
    setApproveAllInFlight(false);

    const failCount = Object.keys(failures).length;
    setApproveAllResult({
      approved: toApprove.length - failCount,
      total: toApprove.length,
      failures,
    });
  }, [actionInFlight, approveAllInFlight, drafts, currentUserId, loadDrafts, getPendingChildren]);

  // -----------------------------------------------------------------------
  // Edit draft in modal
  // -----------------------------------------------------------------------

  const handleEditDraft = useCallback((draft: AIDraft) => {
    setEditingDraft(draft);
    switch (draft.entity_type) {
      case "fto":
        setShowFTOModal(true);
        break;
      case "task":
        setShowTaskModal(true);
        break;
      case "work_order":
        setShowWOModal(true);
        break;
    }
  }, []);

  const closeModal = useCallback(() => {
    setEditingDraft(null);
    setShowFTOModal(false);
    setShowTaskModal(false);
    setShowWOModal(false);
    loadDrafts();
  }, [loadDrafts]);

  // -----------------------------------------------------------------------
  // Grouped data
  // -----------------------------------------------------------------------

  const groups = useMemo(() => groupDrafts(drafts), [drafts]);

  const filteredGroups = useMemo(() => {
    return groups.filter(({ parent, children }) => {
      // Type filter: match if parent OR any child matches
      if (filterType !== "all") {
        const typeMatch =
          parent.entity_type === filterType ||
          children.some((c) => c.entity_type === filterType);
        if (!typeMatch) return false;
      }
      if (filterDateFrom) {
        const from = new Date(filterDateFrom);
        if (new Date(parent.created_at) < from) return false;
      }
      if (filterDateTo) {
        const to = new Date(filterDateTo);
        to.setDate(to.getDate() + 1); // include the full end day
        if (new Date(parent.created_at) >= to) return false;
      }
      return true;
    });
  }, [groups, filterType, filterDateFrom, filterDateTo]);

  // -----------------------------------------------------------------------
  // Render a draft row
  // -----------------------------------------------------------------------

  function renderDraftRow(draft: AIDraft, isChild: boolean) {
    const isExpanded = expandedId === draft.id;
    const isBusy = actionInFlight === draft.id;
    const isPending = draft.status === "pending";

    return (
      <div key={draft.id}>
        <div
          onClick={() => setExpandedId(isExpanded ? null : draft.id)}
          className={`grid items-center cursor-pointer transition-colors ${
            isChild
              ? "hover:bg-[#f3f1fa]"
              : "hover:bg-[#fafafa]"
          } ${isExpanded ? "bg-[#f8f9fb]" : ""}`}
          style={{ gridTemplateColumns: "28px auto 1fr 80px 100px 80px 100px 70px", padding: "9px 16px", gap: "12px" }}
        >
          {/* Chevron */}
          <svg
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill="none"
            className={`transition-transform flex-shrink-0 ${isExpanded ? "rotate-90" : ""}`}
          >
            <path d="M6 4L10 8L6 12" stroke="#a1a1a9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>

          {/* Type */}
          <EntityTypeBadge type={draft.entity_type} />

          {/* Name */}
          <div className="min-w-0">
            {isPending ? (
              <span
                className="text-sm text-[#303030] truncate block hover:underline hover:text-[#2463eb] cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditDraft(draft);
                }}
              >
                {extractName(draft)}
                {draft.duplicate_of && (
                  <span className="ml-1.5 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-orange-50 text-orange-600 border border-orange-200" title="Potential duplicate detected">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
                      <path d="M12 9V13M12 17H12.01M12 3L2 21H22L12 3Z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Duplicate
                  </span>
                )}
              </span>
            ) : (
              <span className="text-sm text-[#303030] truncate block">
                {extractName(draft)}
              </span>
            )}
          </div>

          {/* Source */}
          <SourceBadge source={draft.source} />

          {/* Confidence */}
          {draft.ai_confidence != null ? (
            <ConfidenceBar value={draft.ai_confidence} />
          ) : (
            <span className="text-xs text-[#a1a1a9]">—</span>
          )}

          {/* Status */}
          <StatusBadge status={draft.status} />

          {/* Date */}
          <span className="text-xs text-[#717179] whitespace-nowrap">
            {formatDate(draft.created_at)}
          </span>

          {/* Actions */}
          <div
            className={`flex items-center gap-2 ${isPending ? "justify-end" : "justify-center"}`}
            onClick={(e) => e.stopPropagation()}
          >
            {isPending ? (
              <>
                <button
                  disabled={isBusy}
                  onClick={() => handleApprove(draft)}
                  title={draft.entity_type === "fto_merge" ? "Merge" : "Approve"}
                  className={`inline-flex items-center justify-center w-7 h-7 rounded-full transition-colors ${
                    isBusy
                      ? "text-gray-300 cursor-not-allowed"
                      : draft.entity_type === "fto_merge"
                        ? "text-orange-500 hover:bg-orange-50"
                        : "text-emerald-500 hover:bg-emerald-50"
                  }`}
                >
                  {isBusy ? (
                    <LoadingSpinner />
                  ) : (
                    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                      <circle cx="11" cy="11" r="10" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M7 11L10 14L15 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
                <button
                  disabled={isBusy}
                  onClick={() => handleReject(draft)}
                  title={draft.entity_type === "fto_merge" ? "Keep Separate" : "Reject"}
                  className={`inline-flex items-center justify-center w-7 h-7 rounded-full transition-colors ${
                    isBusy
                      ? "text-gray-300 cursor-not-allowed"
                      : "text-red-400 hover:bg-red-50"
                  }`}
                >
                  {isBusy ? (
                    <LoadingSpinner />
                  ) : (
                    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                      <circle cx="11" cy="11" r="10" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M8 8L14 14M14 8L8 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  )}
                </button>
              </>
            ) : (
              (() => {
                const reviewerName = draft.reviewed_by ? (userMap[draft.reviewed_by] || draft.reviewed_by_name || "") : (draft.reviewed_by_name || "");
                const reviewerEmail = draft.reviewed_by ? (userEmailMap[draft.reviewed_by] || "") : "";
                const initials = reviewerName
                  .split(" ")
                  .filter(Boolean)
                  .map((w: string) => w[0]?.toUpperCase())
                  .slice(0, 2)
                  .join("");
                return reviewerName ? (
                  <div className="relative group flex justify-center">
                    <div className={`w-7 h-7 rounded-full border-[1.5px] flex items-center justify-center text-[10px] font-semibold cursor-default ${
                      draft.status === "approved"
                        ? "border-emerald-400 text-emerald-600"
                        : "border-red-300 text-red-500"
                    }`}>
                      {initials}
                    </div>
                    <div className="absolute bottom-full right-0 mb-1.5 hidden group-hover:block z-50 pointer-events-none">
                      <div className="bg-[#1a1a1a] text-white rounded-lg px-3 py-2 shadow-lg whitespace-nowrap">
                        <div className="text-xs font-semibold">{reviewerName}</div>
                        {reviewerEmail && <div className="text-[11px] text-[#a1a1a9]">{reviewerEmail}</div>}
                      </div>
                    </div>
                  </div>
                ) : null;
              })()
            )}
          </div>
        </div>

        {approveAllResult?.failures[draft.id] && (
          <div className="flex items-center gap-1.5 px-4 py-1.5 bg-red-50 text-xs text-red-600">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
              <path d="M15 9L9 15M9 9L15 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Approval failed: {approveAllResult.failures[draft.id]}
          </div>
        )}

        {isExpanded && !isChild && <DraftDetailPanel draft={draft} propertyMap={propertyMap} vendorMap={vendorMap} userMap={userMap} />}
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // Page render
  // -----------------------------------------------------------------------

  return (
    <PageTemplate>
      <div className="flex flex-col gap-5 w-full">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-[#303030] font-semibold text-2xl">
                AI Drafts
              </h1>
              {pendingCount > 0 && (
                <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-[#f0f0f0] text-[#717179] text-[11px] font-medium">
                  {pendingCount}
                </span>
              )}
            </div>
            <p className="text-sm text-[#717179] mt-1">
              Review and approve AI-detected maintenance items
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFeedback(true)}
              className="flex h-7 items-center gap-1.5 px-2.5 rounded-lg border border-[#e8e8e8] bg-white hover:bg-[#fafafa] transition-colors text-xs text-[#999]"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M21 15C21 15.53 20.79 16.04 20.41 16.41C20.04 16.79 19.53 17 19 17H7L3 21V5C3 4.47 3.21 3.96 3.59 3.59C3.96 3.21 4.47 3 5 3H19C19.53 3 20.04 3.21 20.41 3.59C20.79 3.96 21 4.47 21 5V15Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              AI Feedback
            </button>
            {viewTab === "pending" && pendingCount > 0 && (
              <button
                onClick={handleApproveAll}
                disabled={!!actionInFlight || approveAllInFlight}
                className="flex h-7 items-center gap-1.5 px-2.5 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 transition-colors text-xs text-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {approveAllInFlight ? (
                  <>
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="animate-spin">
                      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" strokeDasharray="28" strokeDashoffset="8" strokeLinecap="round" />
                    </svg>
                    {approveAllProgress.done}/{approveAllProgress.total}
                  </>
                ) : (
                  <>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                      <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M20 12a8 8 0 1 1-16 0 8 8 0 0 1 16 0z" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                    Approve All
                  </>
                )}
              </button>
            )}
            <button
              onClick={loadDrafts}
              className="flex h-7 items-center gap-1.5 px-2.5 rounded-lg border border-[#e8e8e8] bg-white hover:bg-[#fafafa] transition-colors text-xs text-[#999]"
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                <path d="M13.65 7.015A5.5 5.5 0 1 0 12.5 12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M14 3V7H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Refresh
            </button>
          </div>
        </div>

        {/* View tabs */}
        <div className="flex items-center gap-1 border-b border-[#e8e8e8]">
          {([
            { key: "pending" as const, label: "Pending", count: pendingCount },
            { key: "duplicates" as const, label: "Potential Duplicates", count: duplicateCount },
            { key: "history" as const, label: "History", count: 0 },
          ]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setViewTab(tab.key)}
              className={`relative px-4 py-2 text-sm font-medium transition-colors ${
                viewTab === tab.key
                  ? "text-[#303030]"
                  : "text-[#999] hover:text-[#717179]"
              }`}
            >
              <span className="flex items-center gap-1.5">
                {tab.label}
                {tab.count > 0 && (
                  <span className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-semibold ${
                    tab.key === "duplicates"
                      ? "bg-orange-100 text-orange-600"
                      : "bg-[#f0f0f0] text-[#717179]"
                  }`}>
                    {tab.count}
                  </span>
                )}
              </span>
              {viewTab === tab.key && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#303030] rounded-t" />
              )}
            </button>
          ))}
        </div>

        {/* Error — always fixed at top-center above any modal */}
        {error && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex items-start gap-2 px-4 py-2.5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 shadow-lg max-w-lg w-full whitespace-pre-line">
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-400 hover:text-red-600 flex-shrink-0"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M4 4L10 10M10 4L4 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        )}

        {/* Approve All result summary */}
        {approveAllResult && (
          <div className="rounded-lg border overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 border-b border-emerald-200 text-sm text-emerald-700">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
                <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M20 12a8 8 0 1 1-16 0 8 8 0 0 1 16 0z" stroke="currentColor" strokeWidth="1.5" />
              </svg>
              <span className="font-medium">
                Approved {approveAllResult.approved} of {approveAllResult.total} drafts
              </span>
              <button
                onClick={() => setApproveAllResult(null)}
                className="ml-auto text-emerald-400 hover:text-emerald-600"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M4 4L10 10M10 4L4 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            {Object.keys(approveAllResult.failures).length > 0 && (
              <div className="px-4 py-2 bg-red-50 text-sm text-red-600">
                {Object.keys(approveAllResult.failures).length} failed — see items marked below
              </div>
            )}
          </div>
        )}

        {/* Cascade approval confirmation */}
        {cascadeConfirm && createPortal(
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 overflow-hidden">
              <div className="px-6 pt-5 pb-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M12 9V13M12 17H12.01M12 3L2 21H22L12 3Z" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#303030]">
                      Approve Task & Related Items
                    </h3>
                    <p className="mt-2 text-sm text-[#717179] leading-relaxed">
                      By approving this task, you will also approve the{" "}
                      {getPendingChildren(cascadeConfirm.id)
                        .map((c) =>
                          c.entity_type === "fto"
                            ? "field team order"
                            : c.entity_type === "work_order"
                            ? "work order"
                            : c.entity_type
                        )
                        .join(" and ")}{" "}
                      associated with it. Please review the details of each before confirming.
                    </p>
                    {getPendingChildren(cascadeConfirm.id).some(
                      (c) => c.entity_type === "work_order" && !c.extracted_data?.vendor_id
                    ) && (
                      <p className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1.5 leading-relaxed">
                        The work order has no vendor assigned. It will need to be approved separately after adding a vendor.
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="px-6 py-3 bg-[#fafafa] border-t border-[#f0f0f0] flex justify-end gap-2">
                <button
                  onClick={() => { setCascadeConfirm(null); setCascadeOverrides(undefined); }}
                  className="px-4 py-2 text-sm font-medium text-[#717179] bg-white border border-[#e5e5e5] rounded-lg hover:bg-[#f5f5f5] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleApprove(cascadeConfirm, false, cascadeOverrides)}
                  className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  Approve All
                </button>
              </div>
            </div>
          </div>
        , document.body)}

        {/* Duplicate warning dialog */}
        {duplicateWarning && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 overflow-hidden">
              <div className="px-6 pt-5 pb-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M12 9V13M12 17H12.01M12 3L2 21H22L12 3Z" stroke="#ea580c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-[#303030]">
                      Potential Duplicates Detected
                    </h3>
                    <p className="mt-1 text-sm text-[#717179]">
                      {duplicateWarning.summary}
                    </p>
                    <div className="mt-3 space-y-2">
                      {duplicateWarning.matches.map((m, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-2 p-2.5 bg-orange-50 border border-orange-100 rounded-lg"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <EntityTypeBadge type={m.entity_type} />
                              <span className="text-sm font-medium text-[#303030] truncate">
                                {m.name}
                              </span>
                              <span className="text-xs text-orange-600 font-medium ml-auto whitespace-nowrap">
                                {Math.round(m.confidence * 100)}% match
                              </span>
                            </div>
                            <p className="text-xs text-[#717179] mt-1">
                              {m.reasoning}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-6 py-3 bg-[#fafafa] border-t border-[#f0f0f0] flex justify-end gap-2">
                <button
                  onClick={() => setDuplicateWarning(null)}
                  className="px-4 py-2 text-sm font-medium text-[#717179] bg-white border border-[#e5e5e5] rounded-lg hover:bg-[#f5f5f5] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const draft = duplicateWarning.draft;
                    setDuplicateWarning(null);
                    handleApprove(draft, true);
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors"
                >
                  Approve Anyway
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Type filter */}
          <div className="flex items-center gap-0.5 bg-[#f5f5f5] rounded-lg p-0.5">
            {(["all", "task", "fto", "work_order", "fto_merge"] as const).map((t) => {
              const labels: Record<string, string> = { all: "All", task: "Task", fto: "FTO", work_order: "Work Order", fto_merge: "FTO Merge" };
              const active = filterType === t;
              return (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className={`h-6 px-2.5 rounded-md text-[11px] font-medium transition-colors ${
                    active
                      ? "bg-white text-[#303030] shadow-sm"
                      : "text-[#999] hover:text-[#717179]"
                  }`}
                >
                  {labels[t]}
                </button>
              );
            })}
          </div>

          {/* Date range */}
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="text-[11px] text-[#999]">From</span>
            <input
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              className="h-6 px-2 rounded-md border border-[#e8e8e8] text-[11px] text-[#303030] bg-white focus:outline-none focus:border-[#c0c0c0]"
            />
            <span className="text-[11px] text-[#999]">to</span>
            <input
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
              className="h-6 px-2 rounded-md border border-[#e8e8e8] text-[11px] text-[#303030] bg-white focus:outline-none focus:border-[#c0c0c0]"
            />
            {(filterDateFrom || filterDateTo) && (
              <button
                onClick={() => { setFilterDateFrom(""); setFilterDateTo(""); }}
                className="text-[#999] hover:text-red-500 ml-0.5"
                title="Clear dates"
              >
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                  <path d="M4 4L10 10M10 4L4 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="border border-[#ebebeb] rounded-xl bg-white overflow-visible">
          {/* Header row */}
          <div
            className="grid items-center border-b border-[#f0f0f0] text-[10px] font-semibold text-[#bbb] uppercase tracking-wider select-none"
            style={{ gridTemplateColumns: "28px auto 1fr 80px 100px 80px 100px 70px", padding: "7px 16px", gap: "12px" }}
          >
            <div />
            <div>Type</div>
            <div>Name</div>
            <div>Source</div>
            <div>Confidence</div>
            <div>Status</div>
            <div>Created</div>
            <div className="text-center">Actions</div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-16">
              <div className="flex items-center gap-3 text-sm text-[#717179]">
                <svg className="animate-spin h-5 w-5 text-[#2463eb]" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                  <path d="M4 12a8 8 0 0 1 8-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
                </svg>
                Loading...
              </div>
            </div>
          )}

          {/* Empty */}
          {!loading && filteredGroups.length === 0 && !error && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="mb-3 text-[#d4d4d4]">
                <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="text-sm font-medium text-[#717179]">
                {drafts.length > 0
                  ? "No drafts match filters"
                  : viewTab === "duplicates"
                    ? "No potential duplicates"
                    : viewTab === "history"
                      ? "No drafts found"
                      : "All caught up"}
              </p>
              <p className="text-xs text-[#a1a1a9] mt-1">
                {drafts.length > 0
                  ? "Try adjusting the type or date filters."
                  : viewTab === "duplicates"
                    ? "No incoming drafts have been flagged as potential duplicates."
                    : viewTab === "history"
                      ? "No AI drafts have been created yet."
                      : "No pending drafts to review."}
              </p>
            </div>
          )}

          {/* Rows */}
          {!loading &&
            filteredGroups.map(({ parent, children }) => (
              <div key={parent.id} className="border-b border-[#f0f0f0] last:border-0">
                {renderDraftRow(parent, false)}
                {children.length > 0 && (
                  <div className="ml-12 mr-4 mb-2">
                    {children.map((child) => (
                      <div
                        key={child.id}
                        className="rounded-lg border border-[#e8e5f3] bg-[#faf9fd] overflow-hidden"
                      >
                        {renderDraftRow(child, true)}
                        {expandedId === child.id && <DraftDetailPanel draft={child} propertyMap={propertyMap} vendorMap={vendorMap} userMap={userMap} />}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
        </div>

        {/* Footer */}
        {!loading && drafts.length > 0 && (
          <div className="text-xs text-[#a1a1a9]">
            {filteredGroups.length !== groups.length
              ? `${filteredGroups.length} of ${drafts.length} drafts`
              : `${drafts.length} draft${drafts.length !== 1 ? "s" : ""}`}
            {" -- "}
            {pendingCount} pending
          </div>
        )}
      </div>

      {/* Edit modals */}
      {showFTOModal && editingDraft && (() => {
        const parentTaskDraft = editingDraft.parent_draft_id
          ? drafts.find((d) => d.id === editingDraft.parent_draft_id && d.entity_type === "task")
          : null;
        const parentTaskName = parentTaskDraft?.extracted_data?.name || null;
        return (
          <CreateFTOModal
            open={showFTOModal}
            onOpenChange={(open) => { if (!open) closeModal(); }}
            {...(parentTaskName ? { lockedTaskLabel: parentTaskName } : {})}
            onApprove={async () => { const ok = await handleApprove(editingDraft); if (ok) closeModal(); }}
            onReject={async () => { await handleReject(editingDraft); closeModal(); }}
            editingFTO={{
              id: 0,
              name: editingDraft.extracted_data?.name || "",
              description: editingDraft.extracted_data?.description || "",
              priority: editingDraft.extracted_data?.priority || "normal",
              status: "new",
              due_date: editingDraft.extracted_data?.due_date || "",
              event_start_at: editingDraft.extracted_data?.event_start_at || null,
              event_end_at: editingDraft.extracted_data?.event_end_at || null,
              property_id: editingDraft.extracted_data?.property_id,
              field_team_member_ids: editingDraft.extracted_data?.field_team_member_ids || [],
              pm_assignee_ids: [],
            }}
          />
        );
      })()}

      {showTaskModal && editingDraft && (
        <CreateTaskModal
          open={showTaskModal}
          onOpenChange={(open) => { if (!open) closeModal(); }}
          onApprove={async (overrides) => {
            const hasPendingChildren = getPendingChildren(editingDraft.id).length > 0;
            const ok = await handleApprove(editingDraft, false, overrides);
            if (ok || hasPendingChildren) closeModal();
          }}
          onReject={async () => { await handleReject(editingDraft); closeModal(); }}
          editData={{
            id: 0,
            name: editingDraft.extracted_data?.name || "",
            description: editingDraft.extracted_data?.description || "",
            priority: editingDraft.extracted_data?.priority || "medium",
            status: editingDraft.extracted_data?.status || "open",
            category: editingDraft.extracted_data?.category || "",
            property_id: editingDraft.extracted_data?.property_id,
            unit_id: editingDraft.extracted_data?.unit_id || null,
            location_id: editingDraft.extracted_data?.location_id || null,
            due_date: editingDraft.extracted_data?.due_date || null,
            assignees: [],
            collaborators: [],
          }}
        />
      )}

      {showWOModal && editingDraft && (() => {
        const parentDraft = editingDraft.parent_draft_id
          ? drafts.find((d) => d.id === editingDraft.parent_draft_id)
          : null;
        const taskName = editingDraft.extracted_data?.task_name
          || (parentDraft ? extractName(parentDraft) : "");
        return (
          <CreateWorkOrderModalV2
            open={showWOModal}
            onOpenChange={(open) => { if (!open) closeModal(); }}
            onApprove={async (overrides) => { const ok = await handleApprove(editingDraft, false, overrides); if (ok) closeModal(); }}
            onReject={async () => { await handleReject(editingDraft); closeModal(); }}
            mode="create"
            propertyId={editingDraft.extracted_data?.property_id}
            initialData={{
              task: taskName,
              workOrderName: editingDraft.extracted_data?.name || "",
              vendorId: editingDraft.extracted_data?.vendor_id,
              priority: editingDraft.extracted_data?.priority || "medium",
              notes: editingDraft.extracted_data?.work_description || "",
            }}
          />
        );
      })()}

      {/* AI Feedback Panel */}
      {showFeedback && (
        <div className="fixed inset-0 z-50 flex items-start justify-end">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowFeedback(false)} />
          <div className="relative w-full max-w-md h-full bg-white shadow-xl flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#e8e8e8]">
              <div>
                <h2 className="text-lg font-semibold text-[#303030]">AI Feedback</h2>
                <p className="text-xs text-[#999] mt-0.5">Teach the AI classifier by providing corrections and patterns</p>
              </div>
              <button onClick={() => setShowFeedback(false)} className="p-1.5 rounded-lg hover:bg-[#f5f5f5] text-[#999]">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* Submit form */}
            <div className="px-5 py-4 border-b border-[#e8e8e8] bg-[#fafafa]">
              <div className="flex gap-2 mb-3">
                <select
                  value={feedbackSource}
                  onChange={(e) => setFeedbackSource(e.target.value)}
                  className="h-8 px-2 rounded-lg border border-[#e8e8e8] bg-white text-xs text-[#303030]"
                >
                  <option value="general">All Sources</option>
                  <option value="calendar">Calendar</option>
                  <option value="sms">SMS</option>
                  <option value="buildium">Buildium</option>
                </select>
                <select
                  value={feedbackType}
                  onChange={(e) => setFeedbackType(e.target.value)}
                  className="h-8 px-2 rounded-lg border border-[#e8e8e8] bg-white text-xs text-[#303030]"
                >
                  <option value="correction">Correction</option>
                  <option value="pattern">Pattern</option>
                  <option value="suggestion">Suggestion</option>
                </select>
              </div>
              <textarea
                value={feedbackMessage}
                onChange={(e) => setFeedbackMessage(e.target.value)}
                placeholder={'e.g. "When you see \'Meet painters at [address]\', always classify as work_order, not fto_only"'}
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-[#e8e8e8] bg-white text-sm text-[#303030] placeholder:text-[#bbb] resize-none focus:outline-none focus:border-[#2463eb]"
              />
              <button
                onClick={handleSubmitFeedback}
                disabled={feedbackSubmitting || !feedbackMessage.trim()}
                className="mt-2 w-full h-8 rounded-lg bg-[#303030] text-white text-xs font-medium hover:bg-[#444] transition-colors disabled:opacity-40"
              >
                {feedbackSubmitting ? "Submitting..." : "Submit Feedback"}
              </button>
            </div>

            {/* Existing feedback list */}
            <div className="flex-1 overflow-y-auto px-5 py-3">
              {feedbackLoading && feedbackList.length === 0 && (
                <div className="flex items-center justify-center py-8">
                  <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                </div>
              )}
              {!feedbackLoading && feedbackList.length === 0 && (
                <p className="text-center text-sm text-[#999] py-8">
                  No feedback yet. Add corrections to help the AI learn from its mistakes.
                </p>
              )}
              <div className="flex flex-col gap-2">
                {feedbackList.map((fb) => (
                  <div key={fb.id} className="rounded-lg border border-[#e8e8e8] bg-white p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
                            fb.feedback_type === "correction" ? "bg-red-50 text-red-600" :
                            fb.feedback_type === "pattern" ? "bg-blue-50 text-blue-600" :
                            "bg-amber-50 text-amber-600"
                          }`}>
                            {fb.feedback_type}
                          </span>
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-50 text-gray-500">
                            {fb.source}
                          </span>
                          <span className="text-[10px] text-[#bbb]">
                            {new Date(fb.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </span>
                        </div>
                        <p className="text-sm text-[#303030]">{fb.message}</p>
                        {fb.user_name && (
                          <p className="text-[10px] text-[#bbb] mt-1">by {fb.user_name}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteFeedback(fb.id)}
                        className="flex-shrink-0 p-1 rounded hover:bg-red-50 text-[#ccc] hover:text-red-400 transition-colors"
                        title="Remove"
                      >
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M3 3L9 9M9 3L3 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </PageTemplate>
  );
}

// ---------------------------------------------------------------------------
// Tiny spinner
// ---------------------------------------------------------------------------

function LoadingSpinner() {
  return (
    <svg className="animate-spin h-3 w-3" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" className="opacity-25" />
      <path d="M2 8a6 6 0 0 1 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="opacity-75" />
    </svg>
  );
}
