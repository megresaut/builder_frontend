import { useState, useEffect, useCallback, useRef } from "react";
import PageTemplate from "@/layout/PageTemplate";
import { fetchJSON, API_BASE } from "@/api/fetchJSON";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BillDraft {
  id: number;
  status: string;
  vendor_id: number | null;
  vendor_name: string | null;
  property_id: number | null;
  property_name: string | null;
  property_address: string | null;
  service_address: string | null;
  amount: number | null;
  amount_cents: number | null;
  invoice_number: string | null;
  statement_date: string | null;
  due_date: string | null;
  memo: string | null;
  parse_error: string | null;
  parse_confidence: number | null;
  vendor_match_status: string | null;
  vendor_match_score: number | null;
  vendor_match_candidates: MatchCandidate[] | null;
  property_match_status: string | null;
  property_match_score: number | null;
  vendor_hint_name: string | null;
  vendor_hint_email: string | null;
  vendor_hint_subject: string | null;
  created_at: string;
}

interface MatchCandidate {
  id: number;
  name: string;
  score: number;
  strategy: string;
}

interface VendorOption {
  id: number;
  name: string;
}

interface PropertyOption {
  id: number;
  name: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function draftAmount(d: BillDraft): number {
  if (typeof d.amount === "number") return d.amount;
  if (typeof d.amount_cents === "number") return d.amount_cents / 100;
  return 0;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function toDateInput(iso: string | null): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function MatchBadge({ status, score }: { status: string | null; score: number | null }) {
  if (!status || status === "unmatched") {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-50 text-red-500">
        <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
        Unmatched
      </span>
    );
  }
  if (status === "auto") {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-600">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        Auto {score != null ? `${score}%` : ""}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-600">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
      Review {score != null ? `${score}%` : ""}
    </span>
  );
}

function StatusBadge({ status, parseError }: { status: string; parseError: string | null }) {
  if (parseError && parseError !== "none") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-red-500">
        <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
        Parse Error
      </span>
    );
  }
  if (status === "parsed") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-amber-600">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
        Pending
      </span>
    );
  }
  if (status === "approved") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-600">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        Approved
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-amber-600">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
      Pending
    </span>
  );
}

function ConfidenceRing({ value }: { value: number | null }) {
  if (value == null) return <span className="text-xs text-[#bbb]">—</span>;

  // parse_confidence is stored as 0-100
  const pct = Math.round(value);
  const frac = pct / 100;
  let color = "#ef4444";
  if (frac >= 0.8) color = "#22c55e";
  else if (frac >= 0.6) color = "#eab308";

  const size = 20;
  const strokeWidth = 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const filled = circumference * frac;

  return (
    <div className="flex items-center gap-1.5">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#f0f0f0" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={`${filled} ${circumference - filled}`}
          strokeLinecap="round"
        />
      </svg>
      <span className="text-[11px] tabular-nums" style={{ color }}>{pct}%</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Expanded row detail
// ---------------------------------------------------------------------------

interface DraftDetailProps {
  draft: BillDraft;
  vendors: VendorOption[];
  properties: PropertyOption[];
  onApproved: (id: number) => void;
  onDeleted: (id: number) => void;
}

function DraftDetail({ draft, vendors, properties, onApproved, onDeleted }: DraftDetailProps) {
  const [vendorId, setVendorId] = useState<string>(draft.vendor_id?.toString() ?? "");
  const [propertyId, setPropertyId] = useState<string>(draft.property_id?.toString() ?? "");
  const [amount, setAmount] = useState<string>(draftAmount(draft) > 0 ? draftAmount(draft).toFixed(2) : "");
  const [invoiceNumber, setInvoiceNumber] = useState<string>(draft.invoice_number ?? "");
  const [statementDate, setStatementDate] = useState<string>(toDateInput(draft.statement_date));
  const [dueDate, setDueDate] = useState<string>(toDateInput(draft.due_date));
  const [memo, setMemo] = useState<string>(draft.memo ?? "");
  const [approving, setApproving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const token = localStorage.getItem("avm_token") ?? "";
  const attachmentUrl = `${API_BASE}/vendors/bill-drafts/${draft.id}/attachment?token=${encodeURIComponent(token)}`;

  const handleApprove = async () => {
    const amountCents = Math.round(parseFloat(amount || "0") * 100);
    if (!amountCents) { toast.error("Enter a valid amount before approving."); return; }
    if (!vendorId) { toast.error("Select a vendor before approving."); return; }
    if (!propertyId) { toast.error("Select a property before approving."); return; }

    setApproving(true);
    try {
      const propIdNum = parseInt(propertyId, 10);
      const venIdNum = parseInt(vendorId, 10);
      await fetchJSON(`/vendors/bill-drafts/${draft.id}/approve`, {
        method: "POST",
        body: JSON.stringify({
          vendor_id: venIdNum,
          property_id: propIdNum,
          invoice_number: invoiceNumber || null,
          statement_date: statementDate ? new Date(statementDate).toISOString() : null,
          due_date: dueDate ? new Date(dueDate).toISOString() : null,
          memo: memo || null,
          line_items: [{
            line_id: 0,
            property_id: propIdNum,
            unit: "",
            description: invoiceNumber ? `Invoice ${invoiceNumber}` : "Invoice",
            gl_account_id: "",
            amount_cents: amountCents,
          }],
        }),
      });
      toast.success("Bill approved and created.");
      onApproved(draft.id);
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to approve bill draft.");
    } finally {
      setApproving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await fetchJSON(`/vendors/bill-drafts/${draft.id}`, { method: "DELETE" });
      toast.success("Draft dismissed.");
      onDeleted(draft.id);
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to dismiss draft.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="border-t border-[#f0f0f0] bg-[#fafafa]">
      <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-[#ebebeb]">

        {/* Left: Form fields */}
        <div className="p-5 space-y-4">
          {(draft.vendor_hint_email || draft.vendor_hint_subject) && (
            <div className="px-3 py-2 rounded-lg bg-[#f0f0f0] text-xs text-[#717179] space-y-0.5">
              {draft.vendor_hint_email && (
                <div><span className="font-medium text-[#555]">From:</span> {draft.vendor_hint_email}</div>
              )}
              {draft.vendor_hint_subject && (
                <div><span className="font-medium text-[#555]">Subject:</span> {draft.vendor_hint_subject}</div>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[#717179] mb-1">Vendor</label>
            <select
              value={vendorId}
              onChange={(e) => setVendorId(e.target.value)}
              className="w-full h-8 px-2.5 rounded-lg border border-[#e5e5e5] bg-white text-sm text-[#303030] focus:outline-none focus:border-[#c0c0c0]"
            >
              <option value="">— Select vendor —</option>
              {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
            {draft.vendor_match_status && (
              <div className="mt-1 flex items-center gap-1.5">
                <MatchBadge status={draft.vendor_match_status} score={draft.vendor_match_score} />
                {draft.vendor_hint_name && (
                  <span className="text-[10px] text-[#999]">hint: {draft.vendor_hint_name}</span>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-[#717179] mb-1">Property</label>
            <select
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
              className="w-full h-8 px-2.5 rounded-lg border border-[#e5e5e5] bg-white text-sm text-[#303030] focus:outline-none focus:border-[#c0c0c0]"
            >
              <option value="">— Select property —</option>
              {properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            {draft.property_match_status && (
              <div className="mt-1">
                <MatchBadge status={draft.property_match_status} score={draft.property_match_score} />
              </div>
            )}
            {draft.service_address && (
              <p className="mt-0.5 text-[10px] text-[#999]">Address on invoice: {draft.service_address}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#717179] mb-1">Amount ($)</label>
              <input
                type="number" step="0.01" value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full h-8 px-2.5 rounded-lg border border-[#e5e5e5] bg-white text-sm text-[#303030] focus:outline-none focus:border-[#c0c0c0]"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#717179] mb-1">Invoice #</label>
              <input
                type="text" value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-full h-8 px-2.5 rounded-lg border border-[#e5e5e5] bg-white text-sm text-[#303030] focus:outline-none focus:border-[#c0c0c0]"
                placeholder="Optional"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#717179] mb-1">Statement Date</label>
              <input
                type="date" value={statementDate}
                onChange={(e) => setStatementDate(e.target.value)}
                className="w-full h-8 px-2.5 rounded-lg border border-[#e5e5e5] bg-white text-sm text-[#303030] focus:outline-none focus:border-[#c0c0c0]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#717179] mb-1">Due Date</label>
              <input
                type="date" value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full h-8 px-2.5 rounded-lg border border-[#e5e5e5] bg-white text-sm text-[#303030] focus:outline-none focus:border-[#c0c0c0]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#717179] mb-1">Memo</label>
            <input
              type="text" value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className="w-full h-8 px-2.5 rounded-lg border border-[#e5e5e5] bg-white text-sm text-[#303030] focus:outline-none focus:border-[#c0c0c0]"
              placeholder="Optional"
            />
          </div>

          {draft.parse_error && draft.parse_error !== "none" && (
            <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-100 text-xs text-red-600">
              <span className="font-semibold">Parse error:</span> {draft.parse_error}
            </div>
          )}

          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={handleApprove}
              disabled={approving || deleting}
              className="flex items-center gap-1.5 h-8 px-4 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {approving ? (
                <>
                  <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" className="opacity-25" />
                    <path d="M2 8a6 6 0 0 1 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="opacity-75" />
                  </svg>
                  Approving…
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                  Approve
                </>
              )}
            </button>
            <button
              onClick={handleDelete}
              disabled={approving || deleting}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[#e5e5e5] bg-white text-sm text-red-500 hover:bg-red-50 hover:border-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deleting ? "Dismissing…" : "Dismiss"}
            </button>
          </div>
        </div>

        {/* Right: PDF preview */}
        <div className="relative min-h-[400px] lg:min-h-0">
          <iframe
            ref={iframeRef}
            src={attachmentUrl}
            className="absolute inset-0 w-full h-full border-0 rounded-br-xl"
            title={`Draft ${draft.id} attachment`}
          />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

// Grid layout shared by header and rows
const GRID = "28px 1fr 150px 85px 90px 80px 90px 90px 64px";

export default function BillDrafts() {
  const [drafts, setDrafts] = useState<BillDraft[]>([]);
  const [vendors, setVendors] = useState<VendorOption[]>([]);
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ messages: number; attachments: number; parserStarted: boolean } | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<"pending" | "all">("pending");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadDrafts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchJSON("/vendors/bill-drafts?status=pending,draft,parsed,needs_review&limit=300");
      setDrafts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load bill drafts:", err);
      setDrafts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDrafts();
    Promise.all([
      fetchJSON("/vendors?limit=1000&offset=0").catch(() => []),
      fetchJSON("/properties").catch(() => []),
    ]).then(([vens, props]) => {
      setVendors((Array.isArray(vens) ? vens : []).map((v: any) => ({ id: v.id, name: v.name })));
      setProperties((Array.isArray(props) ? props : []).map((p: any) => ({ id: p.id, name: p.name })));
    });
  }, [loadDrafts]);

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetchJSON("/vendors/outlook/sync", { method: "POST" });
      const messages = res?.messages_fetched ?? 0;
      const attachments = res?.attachments_saved ?? 0;
      const parserStarted = res?.parser_started ?? false;
      setSyncResult({ messages, attachments, parserStarted });
      await loadDrafts();
    } catch (err: any) {
      toast.error(err?.message ?? "Outlook sync failed.");
    } finally {
      setSyncing(false);
    }
  };

  const handleApproved = useCallback((id: number) => {
    setDrafts((prev) => prev.filter((d) => d.id !== id));
    setExpandedId(null);
  }, []);

  const handleDeleted = useCallback((id: number) => {
    setDrafts((prev) => prev.filter((d) => d.id !== id));
    setExpandedId(null);
    setDeletingId(null);
  }, []);

  const handleInlineDelete = async (e: React.MouseEvent, draft: BillDraft) => {
    e.stopPropagation();
    setDeletingId(draft.id);
    try {
      await fetchJSON(`/vendors/bill-drafts/${draft.id}`, { method: "DELETE" });
      toast.success("Draft dismissed.");
      handleDeleted(draft.id);
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to dismiss draft.");
      setDeletingId(null);
    }
  };

  const pendingDrafts = drafts.filter(
    (d) => d.status === "pending" || d.status === "draft" || d.status === "parsed" || d.status === "needs_review"
  );
  const visibleDrafts = statusFilter === "pending" ? pendingDrafts : drafts;

  const hasError = pendingDrafts.filter((d) => d.parse_error && d.parse_error !== "none").length;

  return (
    <PageTemplate>
      <div className="flex flex-col gap-5 w-full">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-[#303030] font-semibold text-2xl">Bill Drafts</h1>
              {pendingDrafts.length > 0 && (
                <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-[#f0f0f0] text-[#717179] text-[11px] font-medium">
                  {pendingDrafts.length}
                </span>
              )}
            </div>
            <p className="text-sm text-[#717179] mt-1">Review and approve vendor invoices parsed from Outlook</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadDrafts}
              disabled={loading}
              className="flex h-7 items-center gap-1.5 px-2.5 rounded-lg border border-[#e8e8e8] bg-white hover:bg-[#fafafa] transition-colors text-xs text-[#999] disabled:opacity-50"
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className={loading ? "animate-spin" : ""}>
                <path d="M13.65 7.015A5.5 5.5 0 1 0 12.5 12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M14 3V7H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Refresh
            </button>
            <button
              onClick={handleSync}
              disabled={syncing}
              className="flex h-7 items-center gap-1.5 px-2.5 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors text-xs text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {syncing ? (
                <>
                  <svg className="animate-spin w-3 h-3" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" className="opacity-25" />
                    <path d="M2 8a6 6 0 0 1 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="opacity-75" />
                  </svg>
                  Syncing…
                </>
              ) : (
                <>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <path d="M4 4v5h5M20 20v-5h-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M20.49 9A9 9 0 0 0 5.64 5.64L4 10M3.51 15a9 9 0 0 0 14.85 3.36L20 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Sync Outlook
                </>
              )}
            </button>
          </div>
        </div>

        {/* Stats chips */}
        {pendingDrafts.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#f5f5f5] text-xs text-[#717179]">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="font-medium">{pendingDrafts.length}</span> pending
            </div>
            {hasError > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-xs text-red-600">
                <span className="w-2 h-2 rounded-full bg-red-400" />
                <span className="font-medium">{hasError}</span> parse errors
              </div>
            )}
          </div>
        )}

        {/* Sync progress / result banner */}
        {syncing && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-50 border border-blue-100 text-sm text-blue-700">
            <svg className="animate-spin w-4 h-4 flex-shrink-0" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" className="opacity-25" />
              <path d="M2 8a6 6 0 0 1 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="opacity-75" />
            </svg>
            <div>
              <span className="font-medium">Syncing Outlook…</span>
              <span className="ml-1.5 text-blue-500">Fetching emails and downloading attachments — this may take a moment.</span>
            </div>
          </div>
        )}

        {!syncing && syncResult && (
          <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-100 text-sm text-emerald-700">
            <div className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
                <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
                <path d="M5 8L7 10L11 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>
                <span className="font-medium">Sync complete.</span>
                {syncResult.messages === 0
                  ? " No new emails found."
                  : ` Found ${syncResult.messages} email${syncResult.messages !== 1 ? "s" : ""}, ${syncResult.attachments} attachment${syncResult.attachments !== 1 ? "s" : ""} saved.`}
                {syncResult.parserStarted && (
                  <span className="ml-1 text-emerald-600"> Parser running in background — drafts will update shortly.</span>
                )}
              </span>
            </div>
            <button
              onClick={() => setSyncResult(null)}
              className="ml-4 text-emerald-400 hover:text-emerald-600 flex-shrink-0"
              aria-label="Dismiss"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-[#e8e8e8]">
          {([
            { key: "pending" as const, label: "Needs Review", count: pendingDrafts.length },
            { key: "all" as const, label: "All Drafts", count: drafts.length },
          ]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`relative px-4 py-2 text-sm font-medium transition-colors ${
                statusFilter === tab.key ? "text-[#303030]" : "text-[#999] hover:text-[#717179]"
              }`}
            >
              <span className="flex items-center gap-1.5">
                {tab.label}
                {tab.count > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-semibold bg-[#f0f0f0] text-[#717179]">
                    {tab.count}
                  </span>
                )}
              </span>
              {statusFilter === tab.key && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#303030] rounded-t" />
              )}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="border border-[#ebebeb] rounded-xl bg-white overflow-hidden">

          {/* Column headers */}
          <div
            className="grid items-center border-b border-[#f0f0f0] text-[10px] font-semibold text-[#bbb] uppercase tracking-wider select-none"
            style={{ gridTemplateColumns: GRID, padding: "7px 16px", gap: "12px" }}
          >
            <div />
            <div>Vendor</div>
            <div>Property</div>
            <div>Amount</div>
            <div>Date</div>
            <div>Confidence</div>
            <div>Status</div>
            <div>Created</div>
            <div className="text-center">Actions</div>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-16">
              <div className="flex items-center gap-3 text-sm text-[#717179]">
                <svg className="animate-spin h-5 w-5 text-[#2463eb]" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                  <path d="M4 12a8 8 0 0 1 8-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
                </svg>
                Loading…
              </div>
            </div>
          )}

          {!loading && visibleDrafts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="mb-3 text-[#d4d4d4]">
                <path d="M14 2H6C5.47 2 4.96 2.21 4.59 2.59C4.21 2.96 4 3.47 4 4V20C4 20.53 4.21 21.04 4.59 21.41C4.96 21.79 5.47 22 6 22H18C18.53 22 19.04 21.79 19.41 21.41C19.79 21.04 20 20.53 20 20V8L14 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M14 2V8H20M9 15H15M9 11H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="text-sm font-medium text-[#717179]">No bill drafts</p>
              <p className="text-xs text-[#a1a1a9] mt-1">Sync Outlook to pull in new invoices, or all drafts have been approved.</p>
            </div>
          )}

          {!loading && visibleDrafts.map((draft) => {
            const isExpanded = expandedId === draft.id;
            const isBusy = deletingId === draft.id;
            const displayAmount = draftAmount(draft);
            const vendorDisplay = draft.vendor_name || draft.vendor_hint_name || "—";
            const propertyDisplay = draft.property_name || draft.property_address || draft.service_address || "—";

            return (
              <div key={draft.id} className="border-b border-[#f0f0f0] last:border-0">
                <div
                  onClick={() => setExpandedId(isExpanded ? null : draft.id)}
                  className={`grid items-center cursor-pointer transition-colors hover:bg-[#fafafa] ${isExpanded ? "bg-[#f8f9fb]" : ""}`}
                  style={{ gridTemplateColumns: GRID, padding: "10px 16px", gap: "12px" }}
                >
                  {/* Chevron */}
                  <svg
                    width="14" height="14" viewBox="0 0 16 16" fill="none"
                    className={`transition-transform flex-shrink-0 ${isExpanded ? "rotate-90" : ""}`}
                  >
                    <path d="M6 4L10 8L6 12" stroke="#a1a1a9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>

                  {/* Vendor */}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#303030] truncate">{vendorDisplay}</p>
                    {draft.vendor_match_status && (
                      <MatchBadge status={draft.vendor_match_status} score={draft.vendor_match_score} />
                    )}
                  </div>

                  {/* Property */}
                  <div className="min-w-0">
                    <p className="text-sm text-[#303030] truncate">{propertyDisplay}</p>
                    {draft.property_match_status && (
                      <MatchBadge status={draft.property_match_status} score={draft.property_match_score} />
                    )}
                  </div>

                  {/* Amount */}
                  <span className="text-sm font-medium text-[#303030] tabular-nums">
                    {displayAmount > 0 ? `$${displayAmount.toFixed(2)}` : "—"}
                  </span>

                  {/* Statement date */}
                  <span className="text-xs text-[#717179] whitespace-nowrap">
                    {formatDate(draft.statement_date)}
                  </span>

                  {/* Confidence ring */}
                  <ConfidenceRing value={draft.parse_confidence} />

                  {/* Status */}
                  <StatusBadge status={draft.status} parseError={draft.parse_error} />

                  {/* Created */}
                  <span className="text-xs text-[#717179] whitespace-nowrap">
                    {formatDate(draft.created_at)}
                  </span>

                  {/* Actions: ✓ to review/approve, ✗ to dismiss */}
                  <div
                    className="flex items-center justify-end gap-1.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      disabled={isBusy}
                      title="Review & Approve"
                      onClick={() => setExpandedId(isExpanded ? null : draft.id)}
                      className="inline-flex items-center justify-center w-7 h-7 rounded-full text-emerald-500 hover:bg-emerald-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                        <circle cx="11" cy="11" r="10" stroke="currentColor" strokeWidth="1.5" />
                        <path d="M7 11L10 14L15 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                    <button
                      disabled={isBusy}
                      title="Dismiss draft"
                      onClick={(e) => handleInlineDelete(e, draft)}
                      className="inline-flex items-center justify-center w-7 h-7 rounded-full text-red-400 hover:bg-red-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      {isBusy ? (
                        <svg className="animate-spin w-4 h-4" viewBox="0 0 16 16" fill="none">
                          <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" className="opacity-25" />
                          <path d="M2 8a6 6 0 0 1 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="opacity-75" />
                        </svg>
                      ) : (
                        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                          <circle cx="11" cy="11" r="10" stroke="currentColor" strokeWidth="1.5" />
                          <path d="M8 8L14 14M14 8L8 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <DraftDetail
                    draft={draft}
                    vendors={vendors}
                    properties={properties}
                    onApproved={handleApproved}
                    onDeleted={handleDeleted}
                  />
                )}
              </div>
            );
          })}
        </div>

        {!loading && visibleDrafts.length > 0 && (
          <p className="text-xs text-[#a1a1a9]">
            {visibleDrafts.length} draft{visibleDrafts.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>
    </PageTemplate>
  );
}
