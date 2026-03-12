import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { DrawerTemplate } from "@/components/ui/DrawerTemplate";
import {
  listDrafts,
  approveDraft,
  rejectDraft,
  type AIDraft,
} from "@/api/aiDrafts";
import { fetchJSON } from "@/api/fetchJSON";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function extractName(draft: AIDraft): string {
  const d = draft.extracted_data;
  if (d?.name) return d.name;
  if (d?.title) return d.title;
  if (d?.subject) return d.subject;
  if (d?.task_name) return d.task_name;
  if (d?.description) {
    const desc = String(d.description);
    return desc.length > 50 ? desc.slice(0, 47) + "..." : desc;
  }
  return `Draft #${draft.id}`;
}

function relativeTime(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diffMs = now - then;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function groupDrafts(drafts: AIDraft[]): { parent: AIDraft; children: AIDraft[] }[] {
  const parentIds = new Set(drafts.filter((d) => !d.parent_draft_id).map((d) => d.id));
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

  for (const d of drafts) {
    if (!usedIds.has(d.id)) {
      groups.push({ parent: d, children: [] });
    }
  }

  return groups;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const entityConfig: Record<string, { bg: string; text: string; label: string }> = {
  task: { bg: "bg-blue-50", text: "text-blue-700", label: "Task" },
  fto: { bg: "bg-emerald-50", text: "text-emerald-700", label: "FTO" },
  work_order: { bg: "bg-purple-50", text: "text-purple-700", label: "WO" },
};

function EntityBadge({ type }: { type: string }) {
  const c = entityConfig[type] || { bg: "bg-gray-100", text: "text-gray-700", label: type };
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap flex-shrink-0 ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  );
}

/** Pretty-print a key for display */
function formatKey(key: string): string {
  return key
    .replace(/_ids?$/i, "")          // strip trailing _id / _ids
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Fields to skip in the overview (already shown as the card title) */
const SKIP_FIELDS = new Set(["name", "title", "subject", "task_name"]);

/** Keys that hold a property ID */
const PROPERTY_ID_KEYS = new Set(["property_id"]);
/** Keys that hold a vendor ID */
const VENDOR_ID_KEYS = new Set(["vendor_id"]);
/** Keys that hold a single user ID */
const USER_ID_KEYS = new Set([
  "assigned_to", "requested_by", "reviewed_by_user_id", "last_edited_by_user_id",
]);
/** Keys that hold an array of user IDs */
const USER_IDS_KEYS = new Set([
  "field_team_member_ids", "pm_assignee_ids", "assignee_ids", "collaborator_ids",
]);

/** Detect ISO-8601 date strings */
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})/;

type LookupMaps = {
  propertyMap: Record<number, string>;
  vendorMap: Record<number, string>;
  userMap: Record<number, string>;
};

/** Keys whose values should be truncated in the overview */
const LONG_TEXT_KEYS = new Set(["description", "notes", "details", "ai_reasoning"]);
const TRUNCATE_LEN = 60;

function formatDisplayValue(key: string, val: unknown, maps: LookupMaps): string {
  if (val == null || val === "") return "";

  // Resolve IDs → names
  if (PROPERTY_ID_KEYS.has(key) && typeof val === "number")
    return maps.propertyMap[val] || String(val);
  if (VENDOR_ID_KEYS.has(key) && typeof val === "number")
    return maps.vendorMap[val] || String(val);
  if (USER_ID_KEYS.has(key) && typeof val === "number")
    return maps.userMap[val] || String(val);
  if (USER_IDS_KEYS.has(key) && Array.isArray(val))
    return val.map((id: number) => maps.userMap[id] || String(id)).join(", ");

  // Format dates
  if (typeof val === "string" && ISO_DATE_RE.test(val)) {
    const d = new Date(val);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString("en-US", {
        month: "short", day: "numeric", year: "numeric",
        hour: "numeric", minute: "2-digit",
      });
    }
  }

  // Capitalize short enum-like strings (e.g. "open", "medium", "high")
  if (typeof val === "string" && val.length < 30 && /^[a-z_]+$/.test(val)) {
    return val.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }

  if (typeof val === "object") return JSON.stringify(val);

  // Truncate long text fields
  const str = String(val);
  if (LONG_TEXT_KEYS.has(key) && str.length > TRUNCATE_LEN) {
    return str.slice(0, TRUNCATE_LEN - 1) + "\u2026";
  }
  return str;
}

// Status: blue/amber/green/red palette (matches TaskStatusBadge)
const STATUS_COLORS: Record<string, string> = {
  not_started: "#d97706", open: "#d97706", pending: "#d97706", new: "#2463eb",
  in_progress: "#2463eb", scheduled: "#2463eb", dispatched: "#2463eb",
  completed: "#059669", approved: "#059669", paid: "#059669", active: "#059669",
  rejected: "#DC2626", overdue: "#DC2626", cancelled: "#6b7280", draft: "#6b7280",
};
// Priority: purple/teal palette (visually distinct from status)
const PRIORITY_COLORS: Record<string, string> = {
  low: "#0d9488", normal: "#6366f1", medium: "#a855f7", high: "#e11d48", urgent: "#be123c",
};

const STATUS_KEYS = new Set(["status"]);
const PRIORITY_KEYS = new Set(["priority"]);

function DotBadge({ label, color }: { label: string; color: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-[#303030]">
      <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: color, flexShrink: 0 }} />
      {label}
    </span>
  );
}

function renderValue(key: string, val: unknown, maps: LookupMaps) {
  const strVal = typeof val === "string" ? val : "";
  const normalized = strVal.toLowerCase().replace(/\s+/g, "_");

  if (STATUS_KEYS.has(key) && STATUS_COLORS[normalized]) {
    const label = strVal.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    return <DotBadge label={label} color={STATUS_COLORS[normalized]} />;
  }
  if (PRIORITY_KEYS.has(key) && PRIORITY_COLORS[normalized]) {
    const label = strVal.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    return <DotBadge label={label} color={PRIORITY_COLORS[normalized]} />;
  }
  return <>{formatDisplayValue(key, val, maps)}</>;
}

function DraftOverview({ draft, maps, onViewMore }: { draft: AIDraft; maps: LookupMaps; onViewMore: (id: number) => void }) {
  const entries = Object.entries(draft.extracted_data || {}).filter(
    ([key, val]) => !SKIP_FIELDS.has(key) && val != null && val !== "",
  );

  if (entries.length === 0) {
    return (
      <p className="text-xs text-[#a1a1a9] italic py-1">No additional details</p>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 items-center">
        {entries.map(([key, val]) => (
          <div key={key} className="contents">
            <span className="text-[11px] text-[#a1a1a9] whitespace-nowrap">{formatKey(key)}</span>
            <span className="text-[11px] text-[#303030] break-words">
              {renderValue(key, val, maps)}
            </span>
          </div>
        ))}
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onViewMore(draft.id); }}
        className="mt-1.5 text-[11px] font-medium hover:underline"
        style={{ color: "var(--color-button-primary)" }}
      >
        View more
      </button>
    </div>
  );
}

const sourceIcons: Record<string, string> = {
  calendar: "M6 2V5M18 2V5M3 9H21M5 4H19C20.1046 4 21 4.89543 21 6V20C21 21.1046 20.1046 22 19 22H5C3.89543 22 3 21.1046 3 20V6C3 4.89543 3.89543 4 5 4Z",
  sms: "M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z",
  buildium: "M3 21V3H10V8H21V21H3ZM5 5V19H8V10H19V19H19V8H10V5H5ZM12 19H14V14H12V19ZM16 19H18V14H16V19Z",
};

const sourceLabels: Record<string, string> = {
  calendar: "Calendar",
  sms: "SMS",
  buildium: "Buildium",
};

function SourceIcon({ source }: { source: string }) {
  const icon = sourceIcons[source];
  const label = sourceLabels[source] || source;
  if (!icon) return <span className="text-[10px] text-[#a1a1a9]">{label}</span>;
  return (
    <span className="inline-flex items-center gap-1 text-[10px] text-[#a1a1a9]">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
        <path d={icon} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {label}
    </span>
  );
}

function ActionButtons({
  draft,
  loading,
  onApprove,
  onReject,
}: {
  draft: AIDraft;
  loading: boolean;
  onApprove: (d: AIDraft) => void;
  onReject: (d: AIDraft) => void;
}) {
  return (
    <div className="flex items-center gap-1 flex-shrink-0">
      {/* Approve */}
      <button
        onClick={(e) => { e.stopPropagation(); onApprove(draft); }}
        disabled={loading}
        className="w-6 h-6 rounded-full flex items-center justify-center border border-emerald-300 text-emerald-600 hover:bg-emerald-50 transition-colors disabled:opacity-40"
        title="Approve"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
          <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {/* Reject */}
      <button
        onClick={(e) => { e.stopPropagation(); onReject(draft); }}
        disabled={loading}
        className="w-6 h-6 rounded-full flex items-center justify-center border border-red-300 text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
        title="Reject"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
          <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface NotificationPanelProps {
  open: boolean;
  onClose: () => void;
}

export default function NotificationPanel({ open, onClose }: NotificationPanelProps) {
  const navigate = useNavigate();
  const [drafts, setDrafts] = useState<AIDraft[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionInFlight, setActionInFlight] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Lookup maps for resolving IDs → names
  const [propertyMap, setPropertyMap] = useState<Record<number, string>>({});
  const [vendorMap, setVendorMap] = useState<Record<number, string>>({});
  const [userMap, setUserMap] = useState<Record<number, string>>({});
  const maps = useMemo<LookupMaps>(() => ({ propertyMap, vendorMap, userMap }), [propertyMap, vendorMap, userMap]);

  const toggleExpand = (id: number) =>
    setExpandedId((prev) => (prev === id ? null : id));

  const currentUserId = useMemo(() => {
    const raw = localStorage.getItem("avm_user_id");
    return raw ? Number(raw) : 0;
  }, []);

  // Fetch pending drafts + lookup maps together
  const loadDrafts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [data, props, vendors, users] = await Promise.all([
        listDrafts("pending"),
        fetchJSON("/properties").catch(() => []),
        fetchJSON("/vendors?limit=2000&offset=0").catch(() => []),
        fetchJSON("/users/all").catch(() => []),
      ]);
      const pm: Record<number, string> = {};
      for (const p of props) pm[p.id] = p.name;
      setPropertyMap(pm);
      const vm: Record<number, string> = {};
      for (const v of vendors) vm[v.id] = v.name;
      setVendorMap(vm);
      const um: Record<number, string> = {};
      for (const u of users) um[u.id] = u.name || u.email || String(u.id);
      setUserMap(um);
      // Exclude drafts flagged as potential duplicates — those live in the Duplicates tab
      setDrafts(data.filter((d: AIDraft) => !d.duplicate_of));
    } catch (err: any) {
      setError(err.message ?? "Failed to load drafts");
      setDrafts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) loadDrafts();
  }, [open, loadDrafts]);

  // Listen for refresh events
  useEffect(() => {
    if (!open) return;
    const handler = () => loadDrafts();
    window.addEventListener("refreshAIDrafts", handler);
    return () => window.removeEventListener("refreshAIDrafts", handler);
  }, [open, loadDrafts]);

  // Reset state on close
  useEffect(() => {
    if (!open) {
      setError(null);
      setActionInFlight(null);
      setExpandedId(null);
    }
  }, [open]);

  const groups = useMemo(() => groupDrafts(drafts), [drafts]);

  const handleApprove = useCallback(
    async (draft: AIDraft) => {
      if (actionInFlight) return;

      // Block WO approval if parent task draft is not yet approved
      if (draft.entity_type === "work_order" && draft.parent_draft_id) {
        const parentDraft = drafts.find((d) => d.id === draft.parent_draft_id);
        if (parentDraft && parentDraft.status !== "approved") {
          setError("Approve the parent task first");
          return;
        }
      }

      try {
        setActionInFlight(draft.id);
        await approveDraft(draft.id, currentUserId);
        await loadDrafts();
        window.dispatchEvent(new Event("refreshAIDrafts"));
      } catch (err: any) {
        setError(err.message ?? "Failed to approve draft");
      } finally {
        setActionInFlight(null);
      }
    },
    [currentUserId, actionInFlight, loadDrafts, drafts],
  );

  const handleReject = useCallback(
    async (draft: AIDraft) => {
      if (actionInFlight) return;
      try {
        setActionInFlight(draft.id);
        await rejectDraft(draft.id, currentUserId);
        await loadDrafts();
        window.dispatchEvent(new Event("refreshAIDrafts"));
      } catch (err: any) {
        setError(err.message ?? "Failed to reject draft");
      } finally {
        setActionInFlight(null);
      }
    },
    [currentUserId, actionInFlight, loadDrafts],
  );

  const handleViewAll = () => {
    onClose();
    navigate("/ai-drafts");
  };

  const handleViewMore = (draftId: number) => {
    onClose();
    navigate(`/ai-drafts?expand=${draftId}`);
  };

  return (
    <DrawerTemplate
      open={open}
      onOpenChange={(v) => { if (!v) onClose(); }}
      title="Notifications"
      variant="floating"
      width={420}
      footer={
        <button
          onClick={handleViewAll}
          className="w-full text-center text-sm font-medium py-2 rounded-lg transition-colors"
          style={{ color: "var(--color-button-primary)" }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f0f4ff")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
        >
          View all drafts
        </button>
      }
    >
      {/* Error banner */}
      {error && (
        <div className="mb-3 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-2 text-red-400 hover:text-red-600">
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
              <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && drafts.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
        </div>
      )}

      {/* Empty state */}
      {!loading && drafts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="text-gray-300 mb-3">
            <path d="M10.268 21a2 2 0 0 0 3.464 0" stroke="currentColor" strokeWidth="1.5" />
            <path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          <p className="text-sm text-[#717179]">No pending drafts</p>
          <p className="text-xs text-[#a1a1a9] mt-1">All caught up!</p>
        </div>
      )}

      {/* Draft groups */}
      {groups.length > 0 && (
        <div className="flex flex-col gap-2">
          {groups.map(({ parent, children }) => (
            <div
              key={parent.id}
              className="rounded-lg border border-[#e5e5e5] overflow-hidden bg-white"
            >
              {/* Parent row */}
              <div
                className="px-3 py-2.5 cursor-pointer hover:bg-[#fafafa] transition-colors"
                onClick={() => toggleExpand(parent.id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <EntityBadge type={parent.entity_type} />
                      <span className="text-xs text-[#a1a1a9]">{relativeTime(parent.created_at)}</span>
                    </div>
                    <p className="text-sm font-medium text-[#303030] truncate">
                      {extractName(parent)}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <SourceIcon source={parent.source} />
                      <svg
                        width="12" height="12" viewBox="0 0 24 24" fill="none"
                        className={`text-[#a1a1a9] transition-transform ${expandedId === parent.id ? "rotate-180" : ""}`}
                      >
                        <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>
                  <ActionButtons
                    draft={parent}
                    loading={actionInFlight === parent.id}
                    onApprove={handleApprove}
                    onReject={handleReject}
                  />
                </div>
              </div>

              {/* Parent overview */}
              {expandedId === parent.id && (
                <div className="px-3 pb-2.5 pt-0 border-t border-[#f0f0f0] bg-[#f8f9fb]">
                  <div className="pt-2">
                    <DraftOverview draft={parent} maps={maps} onViewMore={handleViewMore} />
                  </div>
                </div>
              )}

              {/* Children */}
              {children.map((child) => (
                <div key={child.id} className="border-t border-[#f0f0f0]">
                  <div
                    className="px-3 py-2 bg-[#fafafa] cursor-pointer hover:bg-[#f5f5f5] transition-colors"
                    onClick={() => toggleExpand(child.id)}
                  >
                    <div className="flex items-center justify-between gap-2 pl-4">
                      <div className="flex-1 min-w-0 flex items-center gap-1.5">
                        <EntityBadge type={child.entity_type} />
                        <span className="text-sm text-[#303030] truncate">
                          {extractName(child)}
                        </span>
                        <svg
                          width="10" height="10" viewBox="0 0 24 24" fill="none"
                          className={`text-[#a1a1a9] flex-shrink-0 transition-transform ${expandedId === child.id ? "rotate-180" : ""}`}
                        >
                          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <ActionButtons
                        draft={child}
                        loading={actionInFlight === child.id}
                        onApprove={handleApprove}
                        onReject={handleReject}
                      />
                    </div>
                  </div>
                  {expandedId === child.id && (
                    <div className="px-3 pb-2 pt-0 pl-7 bg-[#f5f6f8]">
                      <div className="pt-2">
                        <DraftOverview draft={child} maps={maps} onViewMore={handleViewMore} />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </DrawerTemplate>
  );
}
