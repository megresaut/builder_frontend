import { useState, useEffect, useCallback, useRef } from "react";
import PageTemplate from "@/layout/PageTemplate";
import { fetchJSON, API_BASE } from "@/api/fetchJSON";
import { toast } from "sonner";
import { ConciergeGLPicker } from "@/components/ConciergeGLPicker";
import { BuildiumGLPicker } from "@/components/BuildiumGLPicker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PropertyLocationCombobox } from "@/components/forms/PropertyLocationCombobox";

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
  property_type?: string | null;
  locations_count?: number;
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

const VENDOR_PAGE_SIZE = 50;

interface PropertyUnit {
  id: number;
  property_id: number;
  buildium_unit_id: number | null;
  unit_name: string;
}

interface DraftDetailProps {
  draft: BillDraft;
  properties: PropertyOption[];
  onApproved: (id: number) => void;
  onDeleted: (id: number) => void;
}

interface LineItemState {
  propertyId: string;
  locationId: number | null;
  locationName: string | null;
  unit: string;
  unitName: string;
  amount: string;
  upcharge: string;
  description: string;
  qboItemId: string;
  qboItemName: string;
  buildiumAccountId: string;
  buildiumAccountName: string;
}

const emptyLineItem = (): LineItemState => ({
  propertyId: "",
  locationId: null,
  locationName: null,
  unit: "",
  unitName: "",
  amount: "",
  upcharge: "",
  description: "",
  qboItemId: "",
  qboItemName: "",
  buildiumAccountId: "",
  buildiumAccountName: "",
});

function DraftDetail({ draft, properties, onApproved, onDeleted }: DraftDetailProps) {
  const [vendorId, setVendorId] = useState<string>(draft.vendor_id?.toString() ?? "");
  const [invoiceNumber, setInvoiceNumber] = useState<string>(draft.invoice_number ?? "");
  const [statementDate, setStatementDate] = useState<string>(toDateInput(draft.statement_date));
  const [dueDate, setDueDate] = useState<string>(toDateInput(draft.due_date));
  const [memo, setMemo] = useState<string>(draft.memo ?? "");

  const [lineItems, setLineItems] = useState<LineItemState[]>([{
    propertyId: draft.property_id?.toString() ?? "",
    locationId: null,
    locationName: null,
    unit: "",
    unitName: "",
    amount: draftAmount(draft) > 0 ? draftAmount(draft).toFixed(2) : "",
    upcharge: "",
    description: "",
    qboItemId: "",
    qboItemName: "",
    buildiumAccountId: "",
    buildiumAccountName: "",
  }]);
  const [activeIdx, setActiveIdx] = useState(0);

  const updateActiveItem = (patch: Partial<LineItemState>) => {
    setLineItems(prev => prev.map((li, i) => i === activeIdx ? { ...li, ...patch } : li));
  };

  const [unitsByProperty, setUnitsByProperty] = useState<Record<string, PropertyUnit[]>>({});

  const loadUnitsForProperty = useCallback(async (propertyIdStr: string) => {
    const propertyId = Number(propertyIdStr);
    if (!propertyId) return;
    if (unitsByProperty[propertyIdStr]) return;
    try {
      const list = await fetchJSON(`/properties/${propertyId}/units`);
      const units: PropertyUnit[] = (list || []).map((u: any) => ({
        id: u.id,
        property_id: u.property_id,
        buildium_unit_id: u.buildium_unit_id ?? null,
        unit_name: u.unit_name,
      }));
      setUnitsByProperty(prev => ({ ...prev, [propertyIdStr]: units }));
    } catch {
      setUnitsByProperty(prev => ({ ...prev, [propertyIdStr]: [] }));
    }
  }, [unitsByProperty]);

  // Paginated vendor state — same pattern as CreateWorkOrderModalV2
  const [vendors, setVendors] = useState<VendorOption[]>([]);
  const [vendorSearch, setVendorSearch] = useState("");
  const [vendorOffset, setVendorOffset] = useState(0);
  const [vendorHasMore, setVendorHasMore] = useState(true);
  const [vendorLoading, setVendorLoading] = useState(false);
  const [isVendorDropdownOpen, setIsVendorDropdownOpen] = useState(false);
  const vendorRequestIdRef = useRef(0);

  const fetchVendorsPage = useCallback(async (search: string, offset: number, append: boolean) => {
    const requestId = ++vendorRequestIdRef.current;
    setVendorLoading(true);
    try {
      const params = new URLSearchParams({ limit: VENDOR_PAGE_SIZE.toString() });
      if (offset > 0) params.set("offset", offset.toString());
      if (search.trim()) params.set("search", search.trim());
      const list: VendorOption[] = await fetchJSON(`/vendors?${params.toString()}`);
      if (requestId !== vendorRequestIdRef.current) return;
      setVendors((prev) => (append ? [...prev, ...list] : list));
      setVendorHasMore(list.length === VENDOR_PAGE_SIZE);
      setVendorOffset(offset + list.length);
    } catch {
      if (requestId !== vendorRequestIdRef.current) return;
      if (!append) setVendors([]);
      setVendorHasMore(false);
    } finally {
      if (requestId === vendorRequestIdRef.current) setVendorLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => { fetchVendorsPage("", 0, false); }, [fetchVendorsPage]);

  // Search debounce
  useEffect(() => {
    if (!isVendorDropdownOpen) return;
    const id = window.setTimeout(() => fetchVendorsPage(vendorSearch, 0, false), 250);
    return () => window.clearTimeout(id);
  }, [vendorSearch, isVendorDropdownOpen, fetchVendorsPage]);

  // If draft has a pre-matched vendor_id that isn't in the loaded page, fetch it individually
  useEffect(() => {
    if (!draft.vendor_id || vendorSearch.trim()) return;
    if (vendors.some((v) => v.id === draft.vendor_id)) return;
    fetchJSON(`/vendors/${draft.vendor_id}`).then((v: any) => {
      if (v?.id) setVendors((prev) => prev.some((x) => x.id === v.id) ? prev : [{ id: v.id, name: v.name }, ...prev]);
    }).catch(() => {});
  }, [draft.vendor_id, vendors, vendorSearch]);

  const handleVendorScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (!vendorHasMore || vendorLoading) return;
    const t = e.currentTarget;
    if (t.scrollTop + t.clientHeight >= t.scrollHeight - 24) {
      fetchVendorsPage(vendorSearch, vendorOffset, true);
    }
  }, [vendorHasMore, vendorLoading, vendorSearch, vendorOffset, fetchVendorsPage]);


  const [approving, setApproving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [alreadyBooked, setAlreadyBooked] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const token = localStorage.getItem("avm_token") ?? "";
  const attachmentUrl = `${API_BASE}/vendors/bill-drafts/${draft.id}/attachment?token=${encodeURIComponent(token)}`;

  // Load units for any pre-populated properties on mount
  useEffect(() => {
    lineItems.forEach(li => { if (li.propertyId) loadUnitsForProperty(li.propertyId); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-set unit to Property Level for concierge items once properties are known
  useEffect(() => {
    if (!properties.length) return;
    setLineItems(prev => prev.map(li => {
      if (li.unit) return li;
      const prop = properties.find(p => p.id.toString() === li.propertyId);
      if (prop?.property_type === "C") return { ...li, unit: "__property__", unitName: "Property Level" };
      return li;
    }));
  }, [properties]);

  const activeItem = lineItems[activeIdx];
  const selectedProp = properties.find((p) => p.id.toString() === activeItem.propertyId);
  const isConcierge = selectedProp?.property_type === "C";
  const hasNonConciergeProp = !!selectedProp && selectedProp.property_type !== "C";

  const handlePropertyChange = (newPropId: string, newLocationId: number | null = null, newLocationName: string | null = null) => {
    const newProp = properties.find(p => p.id.toString() === newPropId);
    const isNewConcierge = newProp?.property_type === "C";
    updateActiveItem({
      propertyId: newPropId,
      locationId: newLocationId,
      locationName: newLocationName,
      unit: isNewConcierge ? "__property__" : "",
      unitName: isNewConcierge ? "Property Level" : "",
      qboItemId: "",
      qboItemName: "",
      buildiumAccountId: "",
      buildiumAccountName: "",
    });
    if (newPropId) loadUnitsForProperty(newPropId);
  };

  const handleAddLineItem = () => {
    setLineItems(prev => [...prev, emptyLineItem()]);
    setActiveIdx(lineItems.length);
  };

  const handleApprove = async () => {
    if (!vendorId) { toast.error("Vendor is required."); return; }
    if (!statementDate) { toast.error("Statement Date is required."); return; }
    if (!dueDate) { toast.error("Due Date is required."); return; }

    for (let i = 0; i < lineItems.length; i++) {
      const li = lineItems[i];
      const tag = lineItems.length > 1 ? ` (line item ${i + 1})` : "";
      const ac = Math.round(parseFloat(li.amount || "0") * 100);
      const liProp = properties.find(p => p.id.toString() === li.propertyId);
      const liIsConcierge = liProp?.property_type === "C";
      const liHasNonConcierge = !!liProp && liProp.property_type !== "C";
      if (!li.propertyId) { toast.error(`Property is required${tag}.`); return; }
      if (!ac) { toast.error(`Amount is required${tag}.`); return; }
      if (liIsConcierge && !li.qboItemId) { toast.error(`GL Account is required${tag}.`); return; }
      if (liHasNonConcierge && !li.buildiumAccountId) { toast.error(`GL Account is required${tag}.`); return; }
    }

    const builtLineItems = lineItems.map((li, i) => {
      const ac = Math.round(parseFloat(li.amount || "0") * 100);
      const uc = Math.round(parseFloat(li.upcharge || "0") * 100);
      const liProp = properties.find(p => p.id.toString() === li.propertyId);
      const liIsConcierge = liProp?.property_type === "C";
      const liHasNonConcierge = !!liProp && liProp.property_type !== "C";
      return {
        line_id: i,
        property_id: parseInt(li.propertyId, 10),
        location_id: li.locationId ?? null,
        location_name: li.locationName ?? null,
        unit: li.unit || (liIsConcierge ? "__property__" : ""),
        unit_name: li.unitName || (liIsConcierge ? "Property Level" : ""),
        description: li.description || (invoiceNumber ? `Invoice ${invoiceNumber}` : "Invoice"),
        gl_account_id: "",
        gl_account_name: "",
        qbo_item_id: liIsConcierge ? li.qboItemId : "",
        qbo_item_name: liIsConcierge ? li.qboItemName : "",
        buildium_account_id: liHasNonConcierge ? li.buildiumAccountId : "",
        buildium_account_name: liHasNonConcierge ? li.buildiumAccountName : "",
        amount_cents: ac,
        upcharge_cents: uc,
      };
    });

    setApproving(true);
    try {
      const venIdNum = parseInt(vendorId, 10);
      const result = await fetchJSON(`/vendors/bill-drafts/${draft.id}/approve`, {
        method: "POST",
        body: JSON.stringify({
          vendor_id: venIdNum,
          property_id: parseInt(lineItems[0].propertyId, 10),
          invoice_number: invoiceNumber || null,
          statement_date: statementDate ? new Date(statementDate).toISOString() : null,
          due_date: dueDate ? new Date(dueDate).toISOString() : null,
          memo: memo || null,
          line_items: builtLineItems,
        }),
      });
      if (result?.push_warning) {
        toast.error(`Push failed: ${result.push_warning}`);
      } else {
        toast.success("Bill approved and created.");
        onApproved(draft.id);
      }
    } catch (err: any) {
      const msg: string = err?.message ?? "";
      if (msg.includes("already been booked")) {
        setAlreadyBooked(true);
      } else {
        toast.error(msg || "Failed to approve bill draft.");
      }
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
            <label className="block text-xs font-medium text-[#717179] mb-1">Vendor<span className="text-red-400 ml-0.5">*</span></label>
            <Select
              value={vendorId}
              onValueChange={(v) => { setVendorId(v); setVendorSearch(""); }}
              onOpenChange={(open) => { setIsVendorDropdownOpen(open); if (!open) setVendorSearch(""); }}
            >
              <SelectTrigger className="w-full h-8 px-2.5 rounded-lg border border-[#e5e5e5] bg-white text-sm text-[#303030]">
                <SelectValue placeholder="— Select vendor —" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-[#e5e7eb] shadow-md p-0" onKeyDown={(e) => { const t = e.target as HTMLElement; if (t.tagName === "INPUT") e.stopPropagation(); }}>
                <div className="p-2 border-b border-[#e5e7eb]">
                  <input autoFocus placeholder="Search vendors…" value={vendorSearch} onChange={(e) => setVendorSearch(e.target.value)} onKeyDown={(e) => e.stopPropagation()} className="w-full rounded-md border px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-[#013764]" />
                </div>
                <div className="max-h-[240px] overflow-y-auto" onScroll={handleVendorScroll}>
                  {vendorLoading && vendors.length === 0 && <div className="px-3 py-2 text-sm text-[#aaa]">Loading…</div>}
                  {!vendorLoading && vendors.length === 0 && <div className="px-3 py-2 text-sm text-[#aaa]">No vendors found</div>}
                  {vendors.map((v) => <SelectItem key={v.id} value={v.id.toString()}>{v.name}</SelectItem>)}
                  {vendorLoading && vendors.length > 0 && <div className="px-3 py-2 text-xs text-[#aaa]">Loading more…</div>}
                  {!vendorLoading && vendorHasMore && vendors.length > 0 && <div className="px-3 py-2 text-xs text-[#aaa]">Scroll for more</div>}
                </div>
              </SelectContent>
            </Select>
            {draft.vendor_match_status && (
              <div className="mt-1 flex items-center gap-1.5">
                <MatchBadge status={draft.vendor_match_status} score={draft.vendor_match_score} />
                {draft.vendor_hint_name && (
                  <span className="text-[10px] text-[#999]">hint: {draft.vendor_hint_name}</span>
                )}
              </div>
            )}
          </div>

          {/* Bill-level fields */}
          <div>
            <label className="block text-xs font-medium text-[#717179] mb-1">Invoice #</label>
            <input
              type="text" value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              className="w-full h-8 px-2.5 rounded-lg border border-[#e5e5e5] bg-white text-sm text-[#303030] focus:outline-none focus:border-[#c0c0c0]"
              placeholder="Optional"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#717179] mb-1">Statement Date<span className="text-red-400 ml-0.5">*</span></label>
              <input
                type="date" value={statementDate}
                onChange={(e) => setStatementDate(e.target.value)}
                className="w-full h-8 px-2.5 rounded-lg border border-[#e5e5e5] bg-white text-sm text-[#303030] focus:outline-none focus:border-[#c0c0c0]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#717179] mb-1">Due Date<span className="text-red-400 ml-0.5">*</span></label>
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

          {/* Line Items section */}
          <div className="pt-2 border-t border-[#ebebeb]">
            {/* Nav row */}
            <div className="flex items-center justify-between mb-3">
              <button
                type="button"
                onClick={() => setActiveIdx(i => Math.max(0, i - 1))}
                disabled={activeIdx === 0}
                className="flex items-center justify-center w-6 h-6 rounded border border-[#e5e5e5] bg-white text-[#717179] hover:bg-[#f5f5f5] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M6.5 1.5L3 5l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
              <span className="text-xs text-[#717179]">Line item {activeIdx + 1} of {lineItems.length}</span>
              <button
                type="button"
                onClick={() => setActiveIdx(i => Math.min(lineItems.length - 1, i + 1))}
                disabled={activeIdx === lineItems.length - 1}
                className="flex items-center justify-center w-6 h-6 rounded border border-[#e5e5e5] bg-white text-[#717179] hover:bg-[#f5f5f5] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M3.5 1.5L7 5l-3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <PropertyLocationCombobox
                    label="Property"
                    required
                    placeholder="— Select property —"
                    properties={properties}
                    propertyId={activeItem.propertyId ? Number(activeItem.propertyId) : null}
                    locationId={activeItem.locationId}
                    onChange={({ propertyId: pid, locationId: lid, locationName: lname }) => {
                      handlePropertyChange(pid != null ? String(pid) : "", lid, lname);
                    }}
                  />
                  {activeIdx === 0 && draft.property_match_status && (
                    <div className="mt-1">
                      <MatchBadge status={draft.property_match_status} score={draft.property_match_score} />
                    </div>
                  )}
                  {activeIdx === 0 && draft.service_address && (
                    <p className="mt-0.5 text-[10px] text-[#999]">Address on invoice: {draft.service_address}</p>
                  )}
                </div>
                <div>
                  <label style={{ display: "block", fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif", fontSize: "14px", fontWeight: 500, color: "var(--color-text-primary)", lineHeight: 1.43, marginBottom: "8px", userSelect: "none" }}>Unit</label>
                  <Select
                    value={activeItem.unit || ""}
                    disabled={!activeItem.propertyId}
                    onValueChange={(val) => {
                      if (val === "__property__") {
                        updateActiveItem({ unit: "__property__", unitName: "Property Level" });
                      } else {
                        const units = unitsByProperty[activeItem.propertyId] || [];
                        const selected = units.find(u => (u.buildium_unit_id?.toString() ?? `internal-${u.id}`) === val);
                        updateActiveItem({ unit: val, unitName: selected?.unit_name ?? val });
                      }
                    }}
                  >
                    <SelectTrigger className="w-full h-11 px-3 rounded-lg border border-[var(--color-border-light)] bg-white text-sm text-[#303030] font-normal disabled:opacity-50">
                      <SelectValue placeholder={activeItem.propertyId ? "Select unit" : "Select property first"} />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-[#e5e7eb] shadow-md p-0">
                      <SelectItem value="__property__">Property Level</SelectItem>
                      {(unitsByProperty[activeItem.propertyId] || [])
                        .slice()
                        .sort((a, b) => a.unit_name.localeCompare(b.unit_name))
                        .map(u => (
                          <SelectItem key={u.id} value={u.buildium_unit_id?.toString() ?? `internal-${u.id}`}>
                            {u.unit_name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#717179] mb-1">Amount ($)<span className="text-red-400 ml-0.5">*</span></label>
                  <input
                    type="number" step="0.01" value={activeItem.amount}
                    onChange={(e) => updateActiveItem({ amount: e.target.value })}
                    className="w-full h-8 px-2.5 rounded-lg border border-[#e5e5e5] bg-white text-sm text-[#303030] focus:outline-none focus:border-[#c0c0c0]"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#717179] mb-1">Upcharge ($)</label>
                  <input
                    type="number" step="0.01" value={activeItem.upcharge}
                    onChange={(e) => updateActiveItem({ upcharge: e.target.value })}
                    className="w-full h-8 px-2.5 rounded-lg border border-[#e5e5e5] bg-white text-sm text-[#303030] focus:outline-none focus:border-[#c0c0c0]"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#717179] mb-1">Description</label>
                <input
                  type="text" value={activeItem.description}
                  onChange={(e) => updateActiveItem({ description: e.target.value })}
                  className="w-full h-8 px-2.5 rounded-lg border border-[#e5e5e5] bg-white text-sm text-[#303030] focus:outline-none focus:border-[#c0c0c0]"
                  placeholder="Optional"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#717179] mb-1">
                  GL Account{(isConcierge || hasNonConciergeProp) && <span className="text-red-400 ml-0.5">*</span>}
                </label>
                <div className="w-full min-h-[32px] rounded-lg border border-[#e5e5e5] bg-white px-2.5 flex items-center">
                  {isConcierge ? (
                    <ConciergeGLPicker
                      value={activeItem.qboItemId}
                      onChange={(id, name) => updateActiveItem({ qboItemId: id, qboItemName: name })}
                    />
                  ) : hasNonConciergeProp ? (
                    <BuildiumGLPicker
                      value={activeItem.buildiumAccountId}
                      onChange={(id, name) => updateActiveItem({ buildiumAccountId: id, buildiumAccountName: name })}
                    />
                  ) : (
                    <span className="text-xs text-[#aaa]">Select a property first</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {draft.parse_error && draft.parse_error !== "none" && (
            <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-100 text-xs text-red-600">
              <span className="font-semibold">Parse error:</span> {draft.parse_error}
            </div>
          )}

          {alreadyBooked && (
            <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-800">
              <svg className="mt-0.5 shrink-0 w-4 h-4 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              <span>This bill has already been booked — feel free to delete this draft.</span>
            </div>
          )}

          {(() => {
            const subtotal = lineItems.reduce((sum, li) => sum + Math.round(parseFloat(li.amount || "0") * 100), 0);
            const upchargeTotal = lineItems.reduce((sum, li) => sum + Math.round(parseFloat(li.upcharge || "0") * 100), 0);
            const grandTotal = subtotal + upchargeTotal;
            const fmt = (cents: number) => (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
            return (
              <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#f5f5f5] border border-[#ebebeb] text-sm">
                <div className="flex items-center gap-4 text-[#717179]">
                  <span>Subtotal <span className="text-[#303030] font-medium">{fmt(subtotal)}</span></span>
                  {upchargeTotal > 0 && <span>Upcharge <span className="text-[#303030] font-medium">{fmt(upchargeTotal)}</span></span>}
                </div>
                <span className="font-semibold text-[#303030]">Total {fmt(grandTotal)}</span>
              </div>
            );
          })()}

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
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
            <button
              type="button"
              onClick={handleAddLineItem}
              className="flex items-center gap-1 text-xs text-[#013764] hover:text-[#012a50] font-medium transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 2v8M2 6h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              Add Line Item
            </button>
          </div>
        </div>

        {/* Right: attachment preview */}
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
    fetchJSON("/properties").catch(() => []).then((props: any) => {
      setProperties((Array.isArray(props) ? props : []).map((p: any) => ({ id: p.id, name: p.name, property_type: p.property_type ?? null, locations_count: p.locations_count ?? 0 })));
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
