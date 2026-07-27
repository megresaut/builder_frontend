import { useCallback, useEffect, useRef, useState } from "react";
import PageTemplate from "@/layout/PageTemplate";
import { fetchJSON, authFetch } from "@/api/fetchJSON";
import { ModalTemplate, ModalButtons } from "@/components/ui/ModalTemplate";
import { FieldShell } from "@/components/forms/FieldShell";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ChevronDown, Plus, Search, Settings2, Trash2 } from "lucide-react";
import {
  PageHeader,
  type PageHeaderAction,
} from "@/components/BillsPageHeader";

// ── theme tokens ───────────────────────────────────────────────────────────
const TEXT_DARK = "#303030";
const TEXT_MUTED = "#717179";

// ── types ──────────────────────────────────────────────────────────────────
// One consumption of (part of) a credit by one bill. Migration 148 — a credit can
// have several, which is what makes partial application possible.
interface VendorCreditApplication {
  id: number;
  bill_id: number;
  bill_payment_id: number | null;
  amount_cents: number;
  created_at: string;
}

interface VendorCredit {
  id: number;
  vendor_id: number;
  vendor_name: string;
  qbo_vendor_credit_id: string | null;
  /** Immutable face value. What is left to spend is remaining_cents. */
  amount_cents: number;
  applied_cents: number;
  remaining_cents: number;
  date: string;
  memo: string;
  coa_id: number;
  coa_name: string;
  qbo_class_name: string;
  status: "open" | "partially_applied" | "applied" | "voided";
  /** Most recent application's bill; superseded by `applications`. */
  applied_to_bill_id: number | null;
  applications: VendorCreditApplication[];
  created_at: string;
}

interface Vendor {
  id: number;
  name: string;
}

interface QBOClass {
  Id: string;
  Name: string;
  Active: boolean;
}

// "available" is open plus partially applied — everything with balance left. It
// leads because a partly spent credit is still spendable and would otherwise fall
// between the Open and Applied tabs.
type TabKey = "available" | "applied" | "voided";

const REAL_TABS: { id: TabKey; label: string }[] = [
  { id: "available", label: "Available" },
  { id: "applied", label: "Fully applied" },
  { id: "voided", label: "Voided" },
];

// ── helpers ────────────────────────────────────────────────────────────────
const money = (cents: number) =>
  (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });

const fmtDate = (iso: string) => {
  if (!iso) return "—";
  const [y, m, d] = iso.split("T")[0].split("-");
  return new Date(Number(y), Number(m) - 1, Number(d)).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const todayISO = () => new Date().toISOString().slice(0, 10);

const parseCents = (s: string): number => {
  const n = parseFloat(s.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? Math.round(n * 100) : NaN;
};

const QBO_CLASS_LIMIT = 40;

// ── data fetchers ─────────────────────────────────────────────────────────
async function fetchClasses(): Promise<QBOClass[]> {
  const res = await fetchJSON("/vendor-credits/classes");
  return res?.classes ?? [];
}

// ── searchable select ─────────────────────────────────────────────────────
interface SearchableOption {
  value: string;
  label: string;
}

function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Search…",
  disabled = false,
  id,
}: {
  options: SearchableOption[];
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const filtered = search.trim()
    ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  return (
    <div className="relative" ref={containerRef}>
      {open ? (
        <input
          id={id}
          autoFocus
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-md border border-[#013764] px-3 py-2 text-sm outline-none"
          style={{ color: TEXT_DARK }}
        />
      ) : (
        <button
          id={id}
          type="button"
          disabled={disabled}
          onClick={() => setOpen(true)}
          className="w-full flex items-center justify-between rounded-md border border-[#DADADA] bg-white px-3 py-2 text-sm disabled:opacity-50 hover:border-[#013764] transition-colors"
        >
          <span style={{ color: selected ? TEXT_DARK : TEXT_MUTED }}>
            {selected ? selected.label : placeholder}
          </span>
          <ChevronDown size={14} style={{ color: TEXT_MUTED }} />
        </button>
      )}
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-[#DADADA] bg-white shadow-lg max-h-52 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-sm" style={{ color: TEXT_MUTED }}>
              No results
            </div>
          ) : (
            filtered.map((o) => (
              <div
                key={o.value}
                className={cn(
                  "px-3 py-2 text-sm cursor-pointer hover:bg-[#F5F5F5]",
                  o.value === value && "bg-blue-50",
                )}
                style={{ color: TEXT_DARK }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange(o.value);
                  setOpen(false);
                  setSearch("");
                }}
              >
                {o.label}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ── status badge ───────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const cls =
    status === "open"
      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
      : status === "partially_applied"
        ? "bg-amber-50 text-amber-700 border border-amber-200"
        : status === "applied"
          ? "bg-blue-50 text-blue-700 border border-blue-200"
          : "bg-gray-50 text-gray-500 border border-gray-200";
  const label =
    status === "partially_applied"
      ? "Partially applied"
      : status.charAt(0).toUpperCase() + status.slice(1);
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
}

// ── manage categories modal ───────────────────────────────────────────────
function ManageCategoriesModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [classes, setClasses] = useState<QBOClass[]>([]);
  const [loading, setLoading] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!open) return;
    setLoading(true);
    fetchClasses()
      .then((cs) => setClasses(cs.slice().sort((a, b) => a.Name.localeCompare(b.Name))))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open]);

  useEffect(() => {
    load();
    if (!open) setNewName("");
  }, [load, open]);

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) return;
    if (classes.length >= QBO_CLASS_LIMIT) {
      toast.error(`QBO plan limit reached (${QBO_CLASS_LIMIT} classes max). Deactivate one first.`);
      return;
    }
    setCreating(true);
    try {
      const res = await authFetch("/vendor-credits/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `Create failed (${res.status})`);
      }
      toast.success(`Category "${name}" created`);
      setNewName("");
      load();
    } catch (err: any) {
      toast.error(err?.message ?? String(err));
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (cls: QBOClass) => {
    if (!confirm(`Deactivate category "${cls.Name}" in QBO?`)) return;
    setDeletingId(cls.Id);
    try {
      const res = await authFetch(`/vendor-credits/classes/${cls.Id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `Delete failed (${res.status})`);
      }
      toast.success(`Category "${cls.Name}" deactivated`);
      load();
    } catch (err: any) {
      toast.error(err?.message ?? String(err));
    } finally {
      setDeletingId(null);
    }
  };

  const limitPct = Math.round((classes.length / QBO_CLASS_LIMIT) * 100);
  const limitColor =
    classes.length >= QBO_CLASS_LIMIT
      ? "#dc2626"
      : classes.length >= QBO_CLASS_LIMIT * 0.9
        ? "#d97706"
        : "#013764";

  return (
    <ModalTemplate
      open={open}
      onOpenChange={onOpenChange}
      title="Manage Credit Categories"
      size="sm"
      footer={
        <ModalButtons
          onCancel={() => onOpenChange(false)}
          cancelLabel="Close"
          confirmLabel="Done"
          onConfirm={() => onOpenChange(false)}
        />
      }
    >
      <div className="space-y-4">
        {/* Limit bar */}
        {!loading && (
          <div className="rounded-lg border border-[#E5E5E5] px-3 py-2.5 flex items-center gap-3">
            <div className="flex-1">
              <div className="h-1.5 rounded-full bg-[#E5E5E5] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${Math.min(limitPct, 100)}%`, backgroundColor: limitColor }}
                />
              </div>
            </div>
            <span className="text-xs font-medium tabular-nums whitespace-nowrap" style={{ color: limitColor }}>
              {classes.length} / {QBO_CLASS_LIMIT} QBO classes
            </span>
          </div>
        )}

        {/* Add new */}
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="New category name…"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            disabled={creating || classes.length >= QBO_CLASS_LIMIT}
            className="flex-1"
          />
          <button
            type="button"
            onClick={handleCreate}
            disabled={creating || !newName.trim() || classes.length >= QBO_CLASS_LIMIT}
            className="px-3 py-2 rounded-md bg-[#013764] text-white text-sm font-medium disabled:opacity-50 hover:bg-[#012a4f] transition-colors"
          >
            {creating ? "Adding…" : "Add"}
          </button>
        </div>

        {/* List */}
        {loading ? (
          <p className="text-sm text-center py-6" style={{ color: TEXT_MUTED }}>
            Loading…
          </p>
        ) : classes.length === 0 ? (
          <p className="text-sm text-center py-6" style={{ color: TEXT_MUTED }}>
            No categories yet.
          </p>
        ) : (
          <div className="rounded-lg border border-[#E5E5E5] divide-y divide-[#E5E5E5] max-h-72 overflow-y-auto">
            {classes.map((cls) => (
              <div
                key={cls.Id}
                className="flex items-center justify-between px-3 py-2.5 text-sm hover:bg-[#FAFAFA]"
              >
                <span style={{ color: TEXT_DARK }}>{cls.Name}</span>
                <button
                  type="button"
                  onClick={() => handleDelete(cls)}
                  disabled={deletingId === cls.Id}
                  className="p-1 rounded text-[#717179] hover:text-red-600 hover:bg-red-50 disabled:opacity-40 transition-colors"
                  title="Deactivate"
                >
                  {deletingId === cls.Id ? (
                    <span className="text-xs">…</span>
                  ) : (
                    <Trash2 size={13} />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}

        <p className="text-xs" style={{ color: TEXT_MUTED }}>
          Categories are QBO Classes — changes sync immediately to QuickBooks Online.
        </p>
      </div>
    </ModalTemplate>
  );
}

// ── create modal ──────────────────────────────────────────────────────────
interface CreateModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: () => void;
  prefilledVendorId?: number;
  prefilledVendorName?: string;
}

const VENDOR_PAGE_SIZE = 50;

function CreateVendorCreditModal({
  open,
  onOpenChange,
  onCreated,
  prefilledVendorId,
  prefilledVendorName,
}: CreateModalProps) {
  // Vendor — paginated Radix Select (matches Work Order modal)
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [vendorSearch, setVendorSearch] = useState("");
  const [vendorOffset, setVendorOffset] = useState(0);
  const [vendorHasMore, setVendorHasMore] = useState(true);
  const [vendorLoading, setVendorLoading] = useState(false);
  const [vendorDropOpen, setVendorDropOpen] = useState(false);
  const [vendorId, setVendorId] = useState<string>("");
  const vendorSearchRef = useRef<HTMLInputElement>(null);
  const vendorReqRef = useRef(0);

  const [classOptions, setClassOptions] = useState<QBOClass[]>([]);
  const [qboClassId, setQboClassId] = useState<string>("");

  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayISO());
  const [memo, setMemo] = useState("");
  const [docNumber, setDocNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVendorPage = useCallback(async (search: string, offset: number, append: boolean) => {
    const reqId = ++vendorReqRef.current;
    setVendorLoading(true);
    try {
      const params = new URLSearchParams({ limit: String(VENDOR_PAGE_SIZE) });
      if (offset > 0) params.set("offset", String(offset));
      if (search.trim()) params.set("search", search.trim());
      const data = await fetchJSON(`/vendors?${params}`);
      if (reqId !== vendorReqRef.current) return;
      const list: Vendor[] = data ?? [];
      setVendors((prev) => (append ? [...prev, ...list] : list));
      setVendorHasMore(list.length === VENDOR_PAGE_SIZE);
      setVendorOffset(offset + list.length);
    } catch {
      if (reqId !== vendorReqRef.current) return;
      if (!append) setVendors([]);
      setVendorHasMore(false);
    } finally {
      if (reqId === vendorReqRef.current) setVendorLoading(false);
    }
  }, []);

  // Load vendors when modal opens
  useEffect(() => {
    if (!open) return;
    fetchVendorPage("", 0, false);
  }, [open, fetchVendorPage]);

  // Search debounce
  useEffect(() => {
    if (!vendorDropOpen) return;
    const tid = window.setTimeout(() => fetchVendorPage(vendorSearch, 0, false), 250);
    return () => window.clearTimeout(tid);
  }, [vendorSearch, vendorDropOpen, fetchVendorPage]);

  // Auto-focus search when dropdown opens
  useEffect(() => {
    if (!vendorDropOpen) return;
    const tid = window.setTimeout(() => vendorSearchRef.current?.focus(), 0);
    return () => window.clearTimeout(tid);
  }, [vendorDropOpen]);

  const handleVendorScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (!vendorHasMore || vendorLoading) return;
    const el = e.currentTarget;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 24) {
      fetchVendorPage(vendorSearch, vendorOffset, true);
    }
  }, [vendorHasMore, vendorLoading, vendorSearch, vendorOffset, fetchVendorPage]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setVendorId(prefilledVendorId ? String(prefilledVendorId) : "");
      setVendorSearch("");
      setQboClassId("");
      setAmount("");
      setDate(todayISO());
      setMemo("");
      setDocNumber("");
      setError(null);
      return;
    }
    if (prefilledVendorId) setVendorId(String(prefilledVendorId));
    fetchClasses()
      .then((cs) => setClassOptions(cs.slice().sort((a, b) => a.Name.localeCompare(b.Name))))
      .catch(() => {});
  }, [open, prefilledVendorId]);

  const selectedVendorName = vendors.find((v) => String(v.id) === vendorId)?.name
    ?? (prefilledVendorName && vendorId === String(prefilledVendorId) ? prefilledVendorName : undefined);

  const handleSubmit = async () => {
    setError(null);
    if (!vendorId) {
      setError("Please select a vendor.");
      return;
    }
    const amountCents = parseCents(amount);
    if (!Number.isFinite(amountCents) || amountCents <= 0) {
      setError("Amount must be greater than $0.");
      return;
    }
    if (!date) {
      setError("Date is required.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await authFetch("/vendor-credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendor_id: Number(vendorId),
          amount_cents: amountCents,
          date,
          qbo_class_id: qboClassId || undefined,
          memo: memo || undefined,
          doc_number: docNumber || undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `Create failed (${res.status})`);
      }
      toast.success(`Vendor credit created for ${selectedVendorName ?? "vendor"}`);
      onOpenChange(false);
      onCreated();
    } catch (err: any) {
      setError(err?.message ?? String(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalTemplate
      open={open}
      onOpenChange={onOpenChange}
      title="New Vendor Credit"
      size="sm"
      footer={
        <ModalButtons
          onCancel={() => onOpenChange(false)}
          onConfirm={handleSubmit}
          cancelLabel="Cancel"
          confirmLabel={submitting ? "Creating…" : "Create"}
          cancelDisabled={submitting}
          confirmDisabled={submitting}
        />
      }
    >
      <div className="space-y-3">
        <FieldShell label="Vendor" htmlFor="vc-vendor">
          <Select
            value={vendorId}
            onValueChange={setVendorId}
            open={vendorDropOpen}
            onOpenChange={(o) => { setVendorDropOpen(o); if (!o) setVendorSearch(""); }}
            disabled={submitting || !!prefilledVendorId}
          >
            <SelectTrigger
              id="vc-vendor"
              className="w-full rounded-lg border bg-white px-3 py-2 text-sm font-normal flex items-center justify-between cursor-pointer border-[#DADADA] min-h-[38px]"
            >
              <SelectValue placeholder="Select a Vendor" />
            </SelectTrigger>
            <SelectContent
              className="bg-white border border-[#E5E7EB] shadow-md p-0 !z-[9999]"
              style={{ zIndex: 9999, width: "var(--radix-select-trigger-width)", minHeight: "300px" }}
              position="popper"
              side="bottom"
              align="start"
              avoidCollisions={false}
            >
              <div className="p-2 border-b border-[#E5E7EB] sticky top-0 bg-white z-10">
                <input
                  ref={vendorSearchRef}
                  autoFocus
                  placeholder="Type to search…"
                  value={vendorSearch}
                  onChange={(e) => setVendorSearch(e.target.value)}
                  onKeyDown={(e) => e.stopPropagation()}
                  className="w-full rounded-md border border-[#DADADA] px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-[#013764]"
                />
              </div>
              <div className="h-[240px] overflow-y-auto" onScroll={handleVendorScroll}>
                {vendorLoading && vendors.length === 0 && (
                  <div className="px-3 py-2 text-sm text-gray-400">Loading vendors…</div>
                )}
                {!vendorLoading && vendors.length === 0 && (
                  <div className="px-3 py-2 text-sm text-gray-400">No vendors found</div>
                )}
                {vendors.map((v) => (
                  <SelectItem key={v.id} value={String(v.id)}>{v.name}</SelectItem>
                ))}
                {vendorLoading && vendors.length > 0 && (
                  <div className="px-3 py-2 text-xs text-gray-400">Loading more…</div>
                )}
                {!vendorLoading && vendorHasMore && vendors.length > 0 && (
                  <div className="px-3 py-2 text-xs text-gray-400">Scroll to load more</div>
                )}
              </div>
            </SelectContent>
          </Select>
        </FieldShell>

        <FieldShell label="Amount" htmlFor="vc-amount">
          <Input
            id="vc-amount"
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={submitting}
          />
        </FieldShell>

        <FieldShell label="Date" htmlFor="vc-date">
          <Input
            id="vc-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            disabled={submitting}
          />
        </FieldShell>

        <FieldShell label="Category (optional)" htmlFor="vc-class">
          <SearchableSelect
            id="vc-class"
            value={qboClassId}
            onChange={setQboClassId}
            disabled={submitting}
            placeholder="Search categories…"
            options={classOptions.map((c) => ({ value: c.Id, label: c.Name }))}
          />
          <div className="text-xs mt-1" style={{ color: TEXT_MUTED }}>
            QBO class — for reporting and categorization
          </div>
        </FieldShell>

        <FieldShell label="Memo (optional)" htmlFor="vc-memo">
          <Textarea
            id="vc-memo"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            disabled={submitting}
            rows={2}
            placeholder="Reason for credit"
          />
        </FieldShell>

        <FieldShell label="Reference / Doc # (optional)" htmlFor="vc-doc">
          <Input
            id="vc-doc"
            type="text"
            value={docNumber}
            onChange={(e) => setDocNumber(e.target.value)}
            disabled={submitting}
            placeholder="e.g. CN-123"
          />
        </FieldShell>

        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
      </div>
    </ModalTemplate>
  );
}

// ── main page ─────────────────────────────────────────────────────────────
export default function VendorCredits() {
  const [tab, setTab] = useState<TabKey>("available");
  const [credits, setCredits] = useState<VendorCredit[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [voidingId, setVoidingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    fetchJSON(`/vendor-credits?status=${tab}`)
      .then((res) => setCredits(res?.credits ?? []))
      .catch(() => setCredits([]))
      .finally(() => setLoading(false));
  }, [tab]);

  useEffect(() => {
    load();
  }, [load]);

  const handleVoid = async (id: number) => {
    if (!confirm("Void this vendor credit in QBO? This cannot be undone.")) return;
    setVoidingId(id);
    try {
      const res = await authFetch(`/vendor-credits/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `Void failed (${res.status})`);
      }
      toast.success("Vendor credit voided.");
      load();
    } catch (err: any) {
      toast.error(err?.message ?? String(err));
    } finally {
      setVoidingId(null);
    }
  };

  const displayed = search.trim()
    ? credits.filter(
        (c) =>
          c.vendor_name.toLowerCase().includes(search.toLowerCase()) ||
          c.memo.toLowerCase().includes(search.toLowerCase()) ||
          (c.qbo_vendor_credit_id ?? "").toLowerCase().includes(search.toLowerCase()),
      )
    : credits;

  const headerActions: PageHeaderAction[] = [
    {
      id: "manage-categories",
      label: "Categories",
      icon: <Settings2 size={15} />,
      onClick: () => setManageOpen(true),
      variant: "secondary",
    },
    {
      id: "new-credit",
      label: "New Credit",
      icon: <Plus size={16} />,
      onClick: () => setCreateOpen(true),
      variant: "primary",
    },
  ];

  return (
    <PageTemplate>
      <div className="flex flex-col gap-6 w-fit min-w-full">
        {/* Header */}
        <div className="flex flex-col gap-6">
          <PageHeader
            title="Vendor Credits"
            description="Manage standalone credits and apply them to concierge bill payments"
            actions={headerActions}
          />

          {/* Tab bar */}
          <div className="flex gap-1 border-b border-[#E5E5E5]">
            {REAL_TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  "px-4 py-2.5 text-sm font-medium transition-colors relative capitalize",
                  tab === t.id ? "text-[#013764]" : "text-[#717179] hover:text-[#303030]",
                )}
              >
                {t.label}
                {tab === t.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#013764]" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Table card */}
        <div className="rounded-xl border border-[#E5E5E5] bg-white shadow-sm overflow-hidden">
          {/* Search / filter bar */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-[#E5E5E5]">
            <div className="relative flex-1 max-w-sm">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: TEXT_MUTED }}
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search vendor, memo, or QBO ID…"
                className="w-full pl-8 pr-3 h-9 rounded-lg border border-[#DADADA] text-sm outline-none focus:border-[#013764] focus:ring-1 focus:ring-[#013764]/20"
              />
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="py-16 text-center text-sm" style={{ color: TEXT_MUTED }}>
              Loading…
            </div>
          ) : displayed.length === 0 ? (
            <div className="py-16 text-center text-sm" style={{ color: TEXT_MUTED }}>
              No {tab} vendor credits{search ? " matching your search" : ""}.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E5E5E5] bg-[#FAFAFA]">
                    {["Vendor", "Date", "Amount", "Category", "Memo", "QBO ID", "Status", ""].map(
                      (h) => (
                        <th
                          key={h}
                          className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide whitespace-nowrap"
                          style={{ color: TEXT_MUTED }}
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {displayed.map((c) => (
                    <tr
                      key={c.id}
                      className="border-b border-[#E5E5E5] last:border-0 hover:bg-[#FAFAFA] transition-colors"
                    >
                      <td
                        className="px-4 py-3 font-medium whitespace-nowrap"
                        style={{ color: TEXT_DARK }}
                      >
                        {c.vendor_name || "—"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap" style={{ color: TEXT_DARK }}>
                        {fmtDate(c.date)}
                      </td>
                      <td
                        className="px-4 py-3 font-medium whitespace-nowrap"
                        style={{ color: TEXT_DARK, fontVariantNumeric: "tabular-nums" }}
                      >
                        {money(c.amount_cents)}
                        {/* Only worth showing once some of it is spent. */}
                        {c.applied_cents > 0 && c.status !== "voided" && (
                          <div className="text-xs font-normal" style={{ color: TEXT_MUTED }}>
                            {money(c.remaining_cents)} left
                          </div>
                        )}
                      </td>
                      <td
                        className="px-4 py-3 max-w-[180px] truncate"
                        style={{ color: TEXT_MUTED }}
                      >
                        {c.qbo_class_name || "—"}
                      </td>
                      <td
                        className="px-4 py-3 max-w-[220px] truncate"
                        style={{ color: TEXT_MUTED }}
                      >
                        {c.memo || "—"}
                      </td>
                      <td
                        className="px-4 py-3 font-mono text-xs whitespace-nowrap"
                        style={{ color: TEXT_MUTED }}
                      >
                        {c.qbo_vendor_credit_id ?? "—"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {/* Voiding requires an untouched credit — QBO refuses to
                            delete a VendorCredit with linked transactions. */}
                        {c.status === "open" && (
                          <button
                            onClick={() => handleVoid(c.id)}
                            disabled={voidingId === c.id}
                            className="text-xs text-red-600 hover:text-red-800 disabled:opacity-50"
                          >
                            {voidingId === c.id ? "Voiding…" : "Void"}
                          </button>
                        )}
                        {c.applications.length > 0 && (
                          <div className="text-xs" style={{ color: TEXT_MUTED }}>
                            {c.applications.map((a) => (
                              <div key={a.id} className="whitespace-nowrap">
                                Bill #{a.bill_id} · {money(a.amount_cents)}
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <CreateVendorCreditModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={load}
      />

      <ManageCategoriesModal open={manageOpen} onOpenChange={setManageOpen} />
    </PageTemplate>
  );
}
