import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import AddVendorModal from "@/components/AddVendorModal";
import PayBillModal from "@/components/PayBillModal";
import ViewPaymentModal, { type EditablePayment } from "@/components/ViewPaymentModal";
import EditPaymentModal from "@/components/EditPaymentModal";
import { usePageState } from "@/hooks/usePageState";
import { formatRelativeTime } from "@/lib/timeUtils";
import { useColumnManagement } from "@/hooks/useColumnManagement";
import ColumnFilterModal from "@/components/ColumnFilterModal";
import GlobalTable from "@/components/GlobalTable";
import PageTemplate from "@/layout/PageTemplate";
import { Plus } from "lucide-react";
import {
  PageHeader,
  type PageHeaderAction,
} from "@/components/BillsPageHeader";
import { fetchJSON } from "@/api/fetchJSON";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { toast } from "sonner";
// Searchable multi-select for the Bills filter bar. Options are the full set of
// vendors / properties (not just those that appear on existing bills), so a user
// can filter by any of them; selecting some with no matching bills then renders
// the table's "No bills found" state. Empty selection = no filter ("All").
function MultiSelectFilter({
  values,
  onChange,
  options,
  placeholder,
}: {
  values: string[];
  onChange: (v: string[]) => void;
  options: string[];
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const filtered = options.filter((o) =>
    o.toLowerCase().includes(search.toLowerCase()),
  );
  const shown = filtered.slice(0, 100);

  const toggle = (o: string) =>
    onChange(values.includes(o) ? values.filter((v) => v !== o) : [...values, o]);

  const label =
    values.length === 0
      ? placeholder
      : values.length === 1
        ? values[0]
        : `${values.length} selected`;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="h-9 px-2.5 rounded-lg border border-[#DADADA] bg-white text-sm text-[#303030] min-w-[140px] max-w-[220px] flex items-center justify-between gap-2"
      >
        <span className={cn("truncate", values.length === 0 && "text-gray-400")}>
          {label}
        </span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="shrink-0"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-64 bg-white border border-[#E5E7EB] rounded-lg shadow-md">
          <div className="p-2 border-b border-[#E5E7EB] flex items-center gap-2">
            <input
              autoFocus
              placeholder="Type to search…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-[#013764]"
            />
            {values.length > 0 && (
              <button
                type="button"
                onClick={() => onChange([])}
                className="text-xs text-[#013764] shrink-0 hover:underline"
              >
                Clear
              </button>
            )}
          </div>
          <div className="max-h-[240px] overflow-y-auto py-1">
            {shown.length === 0 && (
              <div className="px-3 py-2 text-sm text-gray-400">No matches</div>
            )}
            {shown.map((o) => (
              <label
                key={o}
                className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={values.includes(o)}
                  onChange={() => toggle(o)}
                  className="w-4 h-4 rounded border-gray-300 text-[#013764] focus:ring-[#013764]"
                />
                <span className="truncate">{o}</span>
              </label>
            ))}
            {filtered.length > shown.length && (
              <div className="px-3 py-2 text-xs text-gray-400">
                Showing first {shown.length} — keep typing to narrow…
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface MatchCandidate {
  id: number;
  name: string;
  score: number;
  strategy: string;
}

interface Bill {
  id: number;
  vendor: string;
  vendorColor: string;
  property: string;
  statementDate: string;
  dueDate: string;
  due_date?: string; // raw ISO date for filtering

  // Concierge-invoice label (e.g. "May 2026"). Populated by the backend only
  // when the bill's property is property_type='C'. Rendered as a tag next to
  // the Due Date cell.
  invoiceMonth?: string;

  status: "pushed" | "push-failed";
  memo: string;

  // QBO payment state — sourced from /utilities/bills/all (qbo_paid_at IS NOT NULL == paid)
  qboPaidAt?: string;
  qboBalanceCents?: number;
  qboTotalCents?: number;
  qboBillId?: string;
  buildiumBillId?: string;

  // Payment metadata (set after a successful Pay Bill)
  buildiumBillPaymentId?: string;
  paidOn?: string;
  paidFromName?: string;
  paidDocNumber?: string;
  paidMemo?: string;

  // Latest-payment receipt (from bill_payments via lateral join in
  // /utilities/bills/all). Used by ViewPaymentModal's FallbackPaymentBlock
  // for legacy bills whose per-payment row is missing.
  receiptObjectKey?: string;
  receiptFilename?: string;
  receiptUploadedAt?: string;

  // Check-printing state — populated by /utilities/bills/all from the
  // latest bill_payments row when it's a check ('queued' or 'printed').
  // NULL on regular electronic payments.
  checkPrintStatus?: string;
  checkNumber?: string;

  // 🔁 rename semantic meaning: reference number
  invoiceNumber: string;

  amount: number;
  glAccount: string;

  // 🔁 timestamps now come from backend
  importedAt: number;   // created_at
  exportedAt?: number;  // for approved bills
  importStatus?: string;

  isUtility?: boolean;

  // Match / confidence fields from bill-draft parsing
  vendorMatchScore?: number;
  vendorMatchStatus?: string;   // auto | needs_review | unmatched | manual | pending
  vendorMatchCandidates?: MatchCandidate[];
  propertyMatchScore?: number;
  propertyMatchStatus?: string;
  propertyMatchCandidates?: MatchCandidate[];
  parseConfidence?: number;
}

function generateVendorColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 60%, 45%)`;
}


function mapUtilityRowToBill(row: any): Bill {
  const createdAtMs = row.created_at
    ? new Date(row.created_at).getTime()
    : Date.now();

  return {
    id: row.id,
    vendor: row.source_name || "—",
    vendorColor: generateVendorColor(row.source_name || ""),
    property: row.property_name || "—",
    statementDate: row.statement_date
      ? new Date(row.statement_date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          timeZone: "UTC",
        })
      : "—",
    dueDate: row.due_date
      ? new Date(row.due_date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          timeZone: "UTC",
        })
      : "—",
    due_date: row.due_date ?? undefined,
    invoiceMonth: row.invoice_month ?? undefined,
    status: row.push_status === "pushed" ? "pushed" : "push-failed",
    memo: (() => {
      try {
        const items = Array.isArray(row.line_items) ? row.line_items : JSON.parse(row.line_items || "[]");
        const first = items[0]?.description?.trim();
        return first || row.memo || "";
      } catch {
        return row.memo || "";
      }
    })(),
    invoiceNumber: row.reference_number || "",
    amount: (row.amount_cents ?? 0) / 100,
    glAccount: "",
    importedAt: createdAtMs,
    exportedAt: row.push_status === "pushed" ? createdAtMs : undefined,

    qboPaidAt: row.qbo_paid_at ?? undefined,
    qboBalanceCents: row.qbo_balance_cents ?? undefined,
    qboTotalCents: row.qbo_total_cents ?? undefined,
    qboBillId: row.qbo_bill_id ?? undefined,
    buildiumBillId: row.buildium_bill_id ?? undefined,

    buildiumBillPaymentId: row.buildium_bill_payment_id ?? undefined,
    paidOn: row.paid_on ?? undefined,
    paidFromName: row.paid_from_name ?? undefined,
    paidDocNumber: row.paid_doc_number ?? undefined,
    paidMemo: row.paid_memo ?? undefined,

    receiptObjectKey: row.receipt_object_key ?? undefined,
    receiptFilename: row.receipt_filename ?? undefined,
    receiptUploadedAt: row.receipt_uploaded_at ?? undefined,

    checkPrintStatus: row.check_print_status ?? undefined,
    checkNumber: row.check_number ?? undefined,

    // ⭐ this is the key
    isUtility: Boolean(row.provider_id),
  };
}

function mapDraftRowToBill(row: any): Bill {
  const createdAtMs = row.created_at
    ? new Date(row.created_at).getTime()
    : Date.now();

  return {
    id: row.id,

    vendor: row.vendor_name || "—",
    vendorColor: generateVendorColor(row.vendor_name || ""),

    property:
      row.property_address ||
      row.service_address ||
      "—",

    statementDate: row.statement_date
      ? new Date(row.statement_date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          timeZone: "UTC",
        })
      : "—",

    dueDate: row.due_date
      ? new Date(row.due_date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          timeZone: "UTC",
        })
      : "—",
    due_date: row.due_date ?? undefined,

    status: "push-failed",

    memo: row.memo || "",

    invoiceNumber: row.invoice_number || "",

    // drafts sometimes use `amount`, sometimes `amount_cents`
    amount:
      typeof row.amount === "number"
        ? row.amount
        : (row.amount_cents ?? 0) / 100,

    glAccount: "",

    importedAt: createdAtMs,
    exportedAt: undefined,

    importStatus: (() => {
      if (row.parse_error && row.parse_error !== "none") return "Parse Failed";
      if (row.status === "finalized") return "Exported";
      if (row.status === "draft" && (!row.parse_error || row.parse_error === "none")) return "Parsing...";
      return "Needs Review";
    })(),

    vendorMatchScore: row.vendor_match_score,
    vendorMatchStatus: row.vendor_match_status,
    vendorMatchCandidates: row.vendor_match_candidates,
    propertyMatchScore: row.property_match_score,
    propertyMatchStatus: row.property_match_status,
    propertyMatchCandidates: row.property_match_candidates,
    parseConfidence: row.parse_confidence,
  };
}


const bills: Bill[] = [
  {
    id: 1,
    vendor: "Elite HVAC",
    vendorColor: "#BC423E",
    property: "22 Indian Chase Dr",
    statementDate: "Oct 4, 2025",
    dueDate: "Dec 14, 2025",
    status: "pushed",
    memo: "Heater Not Working, Call For Service",
    invoiceNumber: "REF-2024-934",
    amount: 234,
    glAccount: "6200 - HVAC Services",
    importedAt: Date.now() - 2 * 60 * 60 * 1000,
  },
  {
    id: 2,
    vendor: "ABC Plumbing",
    vendorColor: "#EBA524",
    property: "22 Indian Chase Dr",
    statementDate: "Oct 3, 2025",
    dueDate: "Dec 12, 2025",
    status: "push-failed",
    memo: "Leaky Faucet, Plumber Scheduled For Tomorrow",
    invoiceNumber: "REF-2024-582",
    amount: 287,
    glAccount: "6100 - Plumbing",
    importedAt: Date.now() - 3 * 60 * 60 * 1000,
  },
  {
    id: 3,
    vendor: "Elite HVAC",
    vendorColor: "#2463EB",
    property: "22 Indian Chase Dr",
    statementDate: "Oct 2, 2025",
    dueDate: "Dec 10, 2025",
    status: "pushed",
    memo: "High Bill, Check For Leaks And Wastage",
    invoiceNumber: "REF-2024-195",
    amount: 156,
    glAccount: "6300 - Utilities",
    importedAt: Date.now() - 4 * 60 * 60 * 1000,
  },
  {
    id: 4,
    vendor: "Elite HVAC",
    vendorColor: "#2463EB",
    property: "22 Indian Chase Dr",
    statementDate: "Oct 1, 2025",
    dueDate: "Dec 8, 2025",
    status: "push-failed",
    memo: "Slow Connection, Contact ISP For Assistance",
    invoiceNumber: "REF-2024-732",
    amount: 234,
    glAccount: "6350 - Internet & Phone",
    importedAt: Date.now() - 5 * 60 * 60 * 1000,
  },
  {
    id: 5,
    vendor: "Elite HVAC",
    vendorColor: "#2463EB",
    property: "22 Indian Chase Dr",
    statementDate: "Oct 1, 2025",
    dueDate: "Dec 6, 2025",
    status: "pushed",
    memo: "Pilot Light Out, Schedule Safety Inspection",
    invoiceNumber: "REF-2024-268",
    amount: 167,
    glAccount: "6200 - HVAC Services",
    importedAt: Date.now() - 6 * 60 * 60 * 1000,
  },
  {
    id: 6,
    vendor: "Aqua Solutions",
    vendorColor: "#EBA524",
    property: "22 Indian Chase Dr",
    statementDate: "Sep 30, 2025",
    dueDate: "Dec 4, 2025",
    status: "pushed",
    memo: "Outage Reported, Check Breaker And Connections",
    invoiceNumber: "REF-2024-694",
    amount: 312,
    glAccount: "6400 - Electrical",
    importedAt: Date.now() - 7 * 60 * 60 * 1000,
  },
  {
    id: 7,
    vendor: "Green Lawn Services",
    vendorColor: "#059669",
    property: "22 Indian Chase Dr",
    statementDate: "Sep 29, 2025",
    dueDate: "Dec 2, 2025",
    status: "push-failed",
    memo: "Clogged Drain, Use Drain Cleaner Carefully",
    invoiceNumber: "REF-2024-319",
    amount: 256,
    glAccount: "6500 - Maintenance",
    importedAt: Date.now() - 8 * 60 * 60 * 1000,
  },
  {
    id: 8,
    vendor: "Spark Electrical",
    vendorColor: "#2463EB",
    property: "22 Indian Chase Dr",
    statementDate: "Sep 28, 2025",
    dueDate: "Nov 30, 2025",
    status: "pushed",
    memo: "Low Pressure, Check Supply And Aerators",
    invoiceNumber: "REF-2024-851",
    amount: 178,
    glAccount: "6100 - Plumbing",
    importedAt: Date.now() - 9 * 60 * 60 * 1000,
  },
  {
    id: 9,
    vendor: "Secure Locksmiths",
    vendorColor: "#059669",
    property: "22 Indian Chase Dr",
    statementDate: "Sep 28, 2025",
    dueDate: "Nov 28, 2025",
    status: "push-failed",
    memo: "Intermittent Issues, Troubleshoot Router And Modem",
    invoiceNumber: "REF-2024-427",
    amount: 213,
    glAccount: "6350 - Internet & Phone",
    importedAt: Date.now() - 10 * 60 * 60 * 1000,
  },
  {
    id: 10,
    vendor: "Clean Sweep Janitorial",
    vendorColor: "#BC423E",
    property: "22 Indian Chase Dr",
    statementDate: "Sep 28, 2025",
    dueDate: "Nov 26, 2025",
    status: "pushed",
    memo: "High Usage, Investigate Appliances And Settings",
    invoiceNumber: "REF-2024-934",
    amount: 145,
    glAccount: "6500 - Maintenance",
    importedAt: Date.now() - 11 * 60 * 60 * 1000,
  },
];

const buildBillState = (bill: Bill) => ({
  vendorName: bill.vendor,
  referenceNumber: bill.invoiceNumber,
  invoiceDate: bill.statementDate,
  dueDate: bill.dueDate,
  memo: bill.memo,
  // QBO payment state — passed through so RecordBill can render the Pay Bill
  // button + View Payment modal without an extra API round-trip.
  qboPaidAt: bill.qboPaidAt,
  qboBalanceCents: bill.qboBalanceCents,
  qboTotalCents: bill.qboTotalCents,
  qboBillId: bill.qboBillId,
  buildiumBillId: bill.buildiumBillId,

  // Check-printing state — a queued (not-yet-printed) check means the bill
  // has a payment in-flight. Passed through so RecordBill can suppress the
  // "Pay Bill" button and avoid a double payment.
  checkPrintStatus: bill.checkPrintStatus,

  // Payment metadata for the View Payment modal
  buildiumBillPaymentId: bill.buildiumBillPaymentId,
  paidOn: bill.paidOn,
  paidFromName: bill.paidFromName,
  paidDocNumber: bill.paidDocNumber,
  paidMemo: bill.paidMemo,
  lineItems: [
    {
      id: bill.id,
      property: bill.property,
      unit: "",
      workOrder: "",
      description: bill.memo,
      glAccount: bill.glAccount,
      total: `$${bill.amount.toFixed(2)}`,
    },
  ],
});

const VendorAvatar = ({ name, color }: { name: string; color: string }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill={color}
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

function getMatchDotColor(status?: string): string {
  switch (status) {
    case "auto":
      return "bg-green-500";
    case "needs_review":
      return "bg-amber-400";
    case "unmatched":
      return "bg-red-500";
    case "pending":
      return "bg-gray-400";
    case "manual":
      return "bg-blue-500";
    default:
      return "";
  }
}

function buildMatchTooltip(
  label: string,
  score?: number,
  status?: string,
  candidates?: MatchCandidate[],
): string {
  if (!status) return "";
  const parts: string[] = [`${label}: ${status}`];
  if (typeof score === "number") parts.push(`Score: ${score}`);
  if (candidates && candidates.length > 0) {
    parts.push(
      "Top matches: " +
        candidates
          .slice(0, 3)
          .map((c) => `${c.name} (${c.score})`)
          .join(", "),
    );
  }
  return parts.join("\n");
}

const MatchStatusDot = ({
  status,
  score,
  candidates,
  label,
}: {
  status?: string;
  score?: number;
  candidates?: MatchCandidate[];
  label: string;
}) => {
  const dotColor = getMatchDotColor(status);
  if (!dotColor) return null;

  return (
    <span
      className={cn("inline-block w-2 h-2 rounded-full shrink-0", dotColor)}
      title={buildMatchTooltip(label, score, status, candidates)}
    />
  );
};

function getImportStatusStyle(importStatus?: string): {
  dotColor: string;
  textColor: string;
} {
  switch (importStatus) {
    case "Parsing...":
      return { dotColor: "bg-gray-400", textColor: "text-gray-500" };
    case "Ready":
      return { dotColor: "bg-green-500", textColor: "text-green-700" };
    case "Needs Review":
      return { dotColor: "bg-amber-400", textColor: "text-amber-700" };
    case "Exported":
      return { dotColor: "bg-blue-500", textColor: "text-blue-700" };
    case "Parse Failed":
      return { dotColor: "bg-red-500", textColor: "text-red-700" };
    default:
      return { dotColor: "bg-gray-400", textColor: "text-gray-500" };
  }
}

export default function Bills() {
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = usePageState<"all" | "paid" | "unpaid">(
    "selectedTab",
    "all",
    { allowed: ["all", "paid", "unpaid"] },
  );
  const [currentPage, setCurrentPage] = usePageState("currentPage", 1);
  const [itemsPerPage, setItemsPerPage] = usePageState("itemsPerPage", 50);
  const [showPageSizeDropdown, setShowPageSizeDropdown] = usePageState(
    "showPageSizeDropdown",
    false,
  );
  const [isAddVendorModalOpen, setIsAddVendorModalOpen] = usePageState(
    "isAddVendorModalOpen",
    false,
  );
  const [openMenuId, setOpenMenuId] = usePageState<number | null>(
    "openMenuId",
    null,
  );
  const [syncState, setSyncState] = useState<"idle" | "syncing" | "synced">(
    "idle",
  );
  // const [billsList, setBillsList] = useState<Bill[]>(() =>
  //   bills.map((bill) => ({ ...bill, exportedAt: bill.importedAt })),
  // );
  // const [approvedBillIds, setApprovedBillIds] = useState<Set<number>>(
  //   new Set(bills.filter((_, idx) => idx % 2 === 0).map((b) => b.id)),
  // );

  const [billsList, setBillsList] = useState<Bill[]>([]);
  const [approvedBillIds, setApprovedBillIds] = useState<Set<number>>(new Set());
  const [approvedTotal, setApprovedTotal] = useState(0);
  const [payBillTarget, setPayBillTarget] = useState<Bill | null>(null);
  const [deleteBillTarget, setDeleteBillTarget] = useState<Bill | null>(null);
  const [deletingBill, setDeletingBill] = useState(false);
  const [viewPaymentTarget, setViewPaymentTarget] = useState<Bill | null>(null);
  const [editPaymentTarget, setEditPaymentTarget] = useState<{
    payment: EditablePayment;
    bill: Bill;
  } | null>(null);
  const dropdownButtonRef = useRef<HTMLButtonElement>(null);
  // const [approvedTimestamp, setApprovedTimestamp] = useState(
  //   () => Date.now() - 3 * 60 * 1000,
  // );
  // const [draftsTimestamp, setDraftsTimestamp] = useState(
  //   () => Date.now() - 2 * 60 * 1000,
  // );
  // const [relativeTimeDisplay, setRelativeTimeDisplay] = useState(() => ({
  //   approved: formatRelativeTime(Date.now() - 3 * 60 * 1000),
  //   drafts: formatRelativeTime(Date.now() - 2 * 60 * 1000),
  // }));
  const [newlyAddedBillIds, setNewlyAddedBillIds] = useState<Set<number>>(
    new Set(),
  );
  const [searchValue, setSearchValue] = useState("");
  const [showFilterBar, setShowFilterBar] = usePageState("billsShowFilterBar", false);
  const [filterVendors, setFilterVendors] = usePageState<string[]>(
    "billsFilterVendors",
    [],
  );
  const [filterProperties, setFilterProperties] = usePageState<string[]>(
    "billsFilterProperties",
    [],
  );
  const [filterDateFrom, setFilterDateFrom] = usePageState("billsFilterDateFrom", "");
  const [filterDateTo, setFilterDateTo] = usePageState("billsFilterDateTo", "");

  // Sort is applied server-side so a column-header click orders the ENTIRE
  // result set across all pages, not just the rows on the current page.
  // sortBy holds the GlobalTable column key (e.g. "dueDate"); "" = default order.
  const [sortBy, setSortBy] = usePageState<string>("billsSortBy", "");
  const [sortOrder, setSortOrder] = usePageState<"asc" | "desc">(
    "billsSortOrder",
    "desc",
  );

  // Full lists for the filter dropdowns (independent of which bills exist).
  const [allVendorNames, setAllVendorNames] = useState<string[]>([]);
  const [allPropertyNames, setAllPropertyNames] = useState<string[]>([]);

  useEffect(() => {
    // Vendor filter = vendors + utility providers (both surface in the Vendor
    // column and the server matches either via COALESCE(provider, vendor)).
    Promise.all([
      fetchJSON(`/vendors?limit=5000`).catch(() => []),
      fetchJSON(`/providers`).catch(() => []),
    ])
      .then(([vendorList, providerList]) => {
        const names = new Set<string>();
        (Array.isArray(vendorList) ? vendorList : []).forEach((v: any) => {
          if (v?.name) names.add(v.name);
        });
        (Array.isArray(providerList) ? providerList : []).forEach((p: any) => {
          if (p?.display_name) names.add(p.display_name);
        });
        setAllVendorNames(Array.from(names).sort());
      })
      .catch((err) =>
        console.error("Failed to load vendors/providers for filter:", err),
      );

    fetchJSON(`/properties`)
      .then((list) => {
        const names = new Set<string>();
        (Array.isArray(list) ? list : []).forEach((p: any) => {
          const n = p?.name || p?.display_name;
          if (n) names.add(n);
        });
        setAllPropertyNames(Array.from(names).sort());
      })
      .catch((err) =>
        console.error("Failed to load properties for filter:", err),
      );
  }, []);

  const markBillAsNew = (billId: number) => {
    setNewlyAddedBillIds((prev) => new Set(prev).add(billId));
    const timer = setTimeout(() => {
      setNewlyAddedBillIds((prev) => {
        const next = new Set(prev);
        next.delete(billId);
        return next;
      });
    }, 2500);
    return () => clearTimeout(timer);
  };

  // Server filters by tab via ?tab=all|paid|unpaid, so the page just renders
  // whatever came back. (approvedBillIds / approvedBills retained for legacy
  // event handlers below; not used for tab partitioning anymore.)
  const tabBills = billsList;

  // Filter dropdowns are populated from ALL vendors/providers/properties on
  // file (not just those that appear on existing bills), so a user can filter
  // by any of them. Selecting one with no matching bills shows the table's
  // "No bills found" empty state.
  const uniqueVendors = allVendorNames;
  const uniqueProperties = allPropertyNames;

  // All tabs are server-filtered (search/vendor/property/date all forwarded
  // to /utilities/bills/all alongside ?tab=).
  //
  // The "Last Exported" cell shows `exportedAt ?? importedAt`, but the sort
  // only reads `exportedAt`. Bills that were never exported (drafts /
  // not-yet-pushed) have `exportedAt === undefined`, so they'd sort as an
  // empty string while still displaying an import-time relative value —
  // scrambling the order. Fill the fallback here so the sortable field
  // matches the displayed value.
  const filteredTabBills = tabBills.map((b) =>
    b.exportedAt == null ? { ...b, exportedAt: b.importedAt } : b,
  );

  // Sorting is server-side (see loadApprovedBills): a header click updates the
  // server sort state and refetches, so the order spans every page. The hook
  // shape mirrors useSortingTable so GlobalTable can stay unchanged, but
  // getSortedData returns the already-sorted server page as-is.
  const handleSortClick = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
    setCurrentPage(1);
  };
  const getSortIndicator = (column: string) =>
    sortBy === column ? (sortOrder === "asc" ? "↑" : "↓") : null;
  const getSortedData = () => filteredTabBills;
  const {
    columnOrder,
    visibleColumns,
    draggedColumn,
    dropTargetColumn,
    dropPosition,
    showColumnModal,
    setShowColumnModal,
    columnMenuPos,
    columnButtonRef,
    toggleColumnVisibility,
    handleColumnDragStart,
    handleColumnDragOver,
    handleColumnDragLeave,
    handleColumnDrop,
  } = useColumnManagement([
    "dueDate",
    "vendor",
    "property",
    "invoiceNumber",
    "memo",
    "amount",
    "exportedAt",
    "status",
  ]);

  // Debounced search value for server requests
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const searchTimerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(searchValue.trim());
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(searchTimerRef.current);
  }, [searchValue]);

  // Reset to page 1 when filters change. Use joined strings (not the array
  // refs) so the effect keys on actual content.
  const filterVendorsKey = filterVendors.join("");
  const filterPropertiesKey = filterProperties.join("");
  useEffect(() => {
    setCurrentPage(1);
  }, [filterVendorsKey, filterPropertiesKey, filterDateFrom, filterDateTo]);

  // Load bills for the active tab (server-paginated; server applies the tab filter).
  const loadApprovedBills = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      params.set("limit", String(itemsPerPage));
      params.set("offset", String((currentPage - 1) * itemsPerPage));
      params.set("tab", selectedTab);
      if (debouncedSearch) params.set("search", debouncedSearch);
      // Multi-select: send each value as a repeated param (?vendor=A&vendor=B).
      // Repeated params (not comma-joined) are safe for names containing commas.
      filterVendors.forEach((v) => params.append("vendor", v));
      filterProperties.forEach((p) => params.append("property", p));
      if (filterDateFrom) params.set("date_from", filterDateFrom);
      if (filterDateTo) params.set("date_to", filterDateTo);
      if (sortBy) {
        params.set("sort", sortBy.toLowerCase());
        params.set("direction", sortOrder);
      }

      const res = await fetchJSON(`/utilities/bills/all?${params.toString()}`);
      const rows = Array.isArray(res.data) ? res.data : [];
      const bills = rows.map(mapUtilityRowToBill);

      setBillsList(bills);
      setApprovedBillIds(new Set(bills.map((b: Bill) => b.id)));
      setApprovedTotal(typeof res.total === "number" ? res.total : rows.length);
    } catch (err) {
      console.error("Error loading bills:", err);
    }
  }, [currentPage, itemsPerPage, selectedTab, debouncedSearch, filterVendorsKey, filterPropertiesKey, filterDateFrom, filterDateTo, sortBy, sortOrder]);

  // Drafts are no longer surfaced in this view — the All / Paid / Unpaid tabs
  // are sourced solely from the bills table. Draft bills live in bill_drafts
  // and are accessed via the Record Bill workflow.
  const loadDraftBills = useCallback(async () => {
    /* no-op: drafts are not part of the All/Paid/Unpaid model */
  }, []);

  // Fetch bills whenever tab/page/filters change
  useEffect(() => {
    loadApprovedBills();
  }, [loadApprovedBills]);
  
  
  

  const columns = [
    {
      key: "dueDate",
      label: "Due Date",
      icon: (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M8 2v4" />
          <path d="M16 2v4" />
          <rect width="18" height="18" x="3" y="4" rx="2" />
          <path d="M3 10h18" />
        </svg>
      ),
    },
    {
      key: "vendor",
      label: "Vendor",
      icon: (
        <img
          loading="lazy"
          src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/1bf3b3df8026becac5b0f8006e63c3cb79df6594?placeholderIfAbsent=true"
          style={{ width: "16px", height: "16px" }}
          alt=""
        />
      ),
    },
    {
      key: "property",
      label: "Property",
      icon: (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
    },
    {
      key: "status",
      label: "Import Status",
      icon: (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
    },
    {
      key: "exportedAt",
      label: "Last Exported",
      icon: (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
    },
    {
      key: "memo",
      label: "Memo",
      icon: (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z" />
          <circle cx="7.5" cy="7.5" r=".5" fill="currentColor" />
        </svg>
      ),
    },
    {
      key: "invoiceNumber",
      label: "Reference #",
      icon: (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <line x1="4" x2="20" y1="9" y2="9" />
          <line x1="4" x2="20" y1="15" y2="15" />
          <line x1="10" x2="8" y1="3" y2="21" />
          <line x1="16" x2="14" y1="3" y2="21" />
        </svg>
      ),
    },
    {
      key: "amount",
      label: "Amount",
      icon: (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <line x1="12" x2="12" y1="2" y2="22" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      ),
    },
  ];

  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     setRelativeTimeDisplay({
  //       approved: formatRelativeTime(approvedTimestamp),
  //       drafts: formatRelativeTime(draftsTimestamp),
  //     });
  //   }, 1000);

  //   return () => clearInterval(interval);
  // }, [approvedTimestamp, draftsTimestamp]);

  useEffect(() => {
    const handleBillApproved = (event: Event) => {
      const customEvent = event as CustomEvent<{
        billId?: number;
        timestamp: number;
        vendor?: string;
        invoiceDate?: string;
        dueDate?: string;
        referenceNumber?: string;
        memo?: string;
        amount?: number;
        lineItems?: any[];
        uploadedFiles?: any[];
      }>;

      const billData = customEvent.detail;
      // const resolvedBillId =
      //   typeof billData.billId === "number" && !Number.isNaN(billData.billId)
      //     ? billData.billId
      //     : Date.now();


      const resolvedBillId = billData.billId;

      if (typeof resolvedBillId !== "number") {
        console.warn("billApproved event missing billId, ignoring", billData);
        return;
      }
      // setApprovedTimestamp(billData.timestamp);
      // setRelativeTimeDisplay((prev) => ({
      //   ...prev,
      //   approved: formatRelativeTime(billData.timestamp),
      // }));

      setBillsList((prev) => {
        const existing = prev.find((b) => b.id === resolvedBillId);

        const nextBill: Bill = {
          id: resolvedBillId,
          vendor: (billData.vendor || existing?.vendor || "").trim() || "—",
          vendorColor: existing?.vendorColor ?? "#7C3AED",
          property: existing?.property ?? "22 Indian Chase Dr",
          statementDate:
            (billData.invoiceDate || existing?.statementDate || "").trim() ||
            existing?.statementDate ||
            new Date().toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            }),
          dueDate:
            (billData.dueDate || existing?.dueDate || "").trim() ||
            existing?.dueDate ||
            new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(
              "en-US",
              {
                month: "short",
                day: "numeric",
                year: "numeric",
              },
            ),
          due_date: (() => {
            const d = billData.dueDate || existing?.dueDate;
            if (!d) return undefined;
            const parsed = new Date(d);
            return isNaN(parsed.getTime()) ? undefined : parsed.toISOString().slice(0, 10);
          })(),
          status: existing?.status ?? "push-failed",
          memo: billData.memo ?? existing?.memo ?? "",
          invoiceNumber:
            billData.referenceNumber ?? existing?.invoiceNumber ?? "",
          amount:
            typeof billData.amount === "number"
              ? billData.amount
              : (existing?.amount ?? 0),
          glAccount: existing?.glAccount ?? "6200 - HVAC Services",
          importedAt: existing?.importedAt ?? Date.now(),
          exportedAt: billData.timestamp,
        };

        return existing
          ? prev.map((b) => (b.id === resolvedBillId ? nextBill : b))
          : [nextBill, ...prev];
      });

      setApprovedBillIds((prev) => {
        const next = new Set(prev);
        next.add(resolvedBillId);
        return next;
      });

      markBillAsNew(resolvedBillId);
    };

    window.addEventListener("billApproved", handleBillApproved);

    return () => window.removeEventListener("billApproved", handleBillApproved);
  }, []);

  useEffect(() => {
    const handleBillSaved = (event: Event) => {
      const customEvent = event as CustomEvent<{
        billId?: number;
        timestamp: number;
        vendor?: string;
        invoiceDate?: string;
        dueDate?: string;
        referenceNumber?: string;
        memo?: string;
        amount?: number;
        status?: "draft" | "approved";
        importStatus?: string;
      }>;

      const billData = customEvent.detail;
      const resolvedBillId = billData.billId;

      if (typeof resolvedBillId !== "number") {
        console.warn("billSaved event missing billId, ignoring", billData);
        return;
      }

      // setDraftsTimestamp(billData.timestamp);
      // setRelativeTimeDisplay((prev) => ({
      //   ...prev,
      //   drafts: formatRelativeTime(billData.timestamp),
      // }));

      if (billData.status === "draft") {
        setApprovedBillIds((prev) => {
          const next = new Set(prev);
          next.delete(resolvedBillId);
          return next;
        });
      }

      setBillsList((prev) => {
        const existing = prev.find((b) => b.id === resolvedBillId);
        const nextBill: Bill = {
          id: resolvedBillId,
          vendor: (billData.vendor || existing?.vendor || "").trim() || "—",
          vendorColor: existing?.vendorColor ?? "#7C3AED",
          property: existing?.property ?? "22 Indian Chase Dr",
          statementDate:
            (billData.invoiceDate || existing?.statementDate || "").trim() ||
            existing?.statementDate ||
            new Date().toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            }),
          dueDate:
            (billData.dueDate || existing?.dueDate || "").trim() ||
            existing?.dueDate ||
            new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(
              "en-US",
              {
                month: "short",
                day: "numeric",
                year: "numeric",
              },
            ),
          due_date: (() => {
            const d = billData.dueDate || existing?.dueDate;
            if (!d) return undefined;
            const parsed = new Date(d);
            return isNaN(parsed.getTime()) ? undefined : parsed.toISOString().slice(0, 10);
          })(),
          status: existing?.status ?? "push-failed",
          memo: billData.memo ?? existing?.memo ?? "",
          invoiceNumber:
            billData.referenceNumber ?? existing?.invoiceNumber ?? "",
          amount:
            typeof billData.amount === "number"
              ? billData.amount
              : (existing?.amount ?? 0),
          glAccount: existing?.glAccount ?? "6200 - HVAC Services",
          importedAt: existing?.importedAt ?? Date.now(),
          exportedAt:
            billData.status === "draft" ? undefined : existing?.exportedAt,
          importStatus: billData.importStatus ?? existing?.importStatus,
        };

        return existing
          ? prev.map((b) => (b.id === resolvedBillId ? nextBill : b))
          : [nextBill, ...prev];
      });

      markBillAsNew(resolvedBillId);
    };

    window.addEventListener("billSaved", handleBillSaved);

    return () => window.removeEventListener("billSaved", handleBillSaved);
  }, []);

  useEffect(() => {
    const raw = localStorage.getItem("avm:lastBillEvent");
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as {
        type?: "approved" | "saved";
        detail?: any;
      };

      if (parsed?.type === "approved" && parsed.detail) {
        window.dispatchEvent(
          new CustomEvent("billApproved", { detail: parsed.detail }),
        );
      }

      if (parsed?.type === "saved" && parsed.detail) {
        window.dispatchEvent(
          new CustomEvent("billSaved", { detail: parsed.detail }),
        );
      }
    } finally {
      localStorage.removeItem("avm:lastBillEvent");
    }
  }, []);

  // const getTimeAgo = (timestamp: number) => {
  //   const now = Date.now();
  //   const diffMs = now - timestamp;
  //   const diffMins = Math.floor(diffMs / (1000 * 60));
  //   const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  //   const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  //   if (diffMins < 1) return "now";
  //   if (diffMins < 60) return `${diffMins}m ago`;
  //   if (diffHours < 24) return `${diffHours}h ago`;
  //   return `${diffDays}d ago`;
  // };

  const handleSync = async () => {
    try {
      setSyncState("syncing");
  
      // 1️⃣ Trigger Outlook sync
      await fetchJSON("/vendors/outlook/sync", {
        method: "POST",
      });
  
      // 2️⃣ Reload bills + drafts from backend
      const [approvedRes, draftRows] = await Promise.all([
        fetchJSON(`/utilities/bills/all?limit=${itemsPerPage}&offset=0`),
        fetchJSON(
          "/vendors/bill-drafts?status=draft,parsed,receipt&limit=200"
        ),
      ]);

      const approvedRows = Array.isArray(approvedRes.data) ? approvedRes.data : [];
      const approved = approvedRows.map(mapUtilityRowToBill);
      const drafts = (Array.isArray(draftRows) ? draftRows : []).map(mapDraftRowToBill);

      setBillsList([...approved, ...drafts]);
      setApprovedBillIds(new Set(approved.map((b: Bill) => b.id)));
      setApprovedTotal(typeof approvedRes.total === "number" ? approvedRes.total : approved.length);

      // After a sync, default to All so user sees both newly-pushed and
      // pending bills.
      setSelectedTab("all");
      setCurrentPage(1);

      setSyncState("synced");

      setTimeout(() => {
        setSyncState("idle");
      }, 1500);
    } catch (err) {
      console.error("Outlook sync failed:", err);
      setSyncState("idle");
      alert("Failed to sync Outlook emails.");
    }
  };
  

  const handleDeleteBill = useCallback(async (bill: Bill) => {
    try {
      await fetchJSON(`/vendors/bill-drafts/${bill.id}`, { method: "DELETE" });
      setBillsList((prev) => prev.filter((b) => b.id !== bill.id));
    } catch (err) {
      console.error("Failed to delete bill draft:", err);
      alert("Failed to delete bill draft.");
    }
  }, []);

  // Delete an approved bill from QBO (where the API allows) + the platform.
  // Buildium has no bill-delete API, so the backend returns warnings naming the
  // Buildium bill/payment for manual cleanup — surface those to the user.
  const confirmDeleteBill = useCallback(async () => {
    const bill = deleteBillTarget;
    if (!bill) return;
    setDeletingBill(true);
    try {
      const res = await fetchJSON(`/vendors/bills/${bill.id}`, {
        method: "DELETE",
      });
      setBillsList((prev) => prev.filter((b) => b.id !== bill.id));
      setDeleteBillTarget(null);
      toast.success(res?.message ?? "Bill deleted.");
      if (Array.isArray(res?.warnings)) {
        for (const warning of res.warnings as string[]) {
          toast.warning(warning, { duration: 8000 });
        }
      }
    } catch (err) {
      // The backend aborts before touching the platform if a QBO delete fails,
      // so the bill is still intact — keep the dialog open and show why.
      console.error("Failed to delete bill:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to delete bill.",
      );
    } finally {
      setDeletingBill(false);
    }
  }, [deleteBillTarget]);

  const headerActions: PageHeaderAction[] = [
    {
      id: "record-bill",
      label: "Record Bill",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect width="20" height="14" x="2" y="5" rx="2" />
          <line x1="2" x2="22" y1="10" y2="10" />
        </svg>
      ),
      onClick: () => navigate("/bills/record"),
      variant: "primary",
    },
  ];


  const handleVendorAdded = (vendor: {
    id: number;
    name: string;
    email: string;
    phone: string;
    servicesProvided: string[];
    notes: string;
  }) => {
    // For now: just log & close modal
    console.log("Vendor created:", vendor);
  
    // Future-ready:
    // - refresh vendor cache
    // - auto-select vendor in bill form
    // - optimistic vendor list update
  };
  
  return (
    <PageTemplate>
      <div className="flex flex-col gap-6 w-fit min-w-full">
        {/* Header Section */}
        <div className="flex flex-col gap-6">
          <PageHeader
            title="All Bills"
            description="All your bills, in one place"
            actions={headerActions}
          />

          {/* Tab Bar — All / Paid / Unpaid driven by bills.qbo_paid_at via the
              ?tab= query param on /utilities/bills/all */}
          <div className="flex gap-1 border-b border-[#E5E5E5]">
            {(["all", "paid", "unpaid"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => {
                  setSelectedTab(tab);
                  setCurrentPage(1);
                }}
                className={cn(
                  "px-4 py-2.5 text-sm font-medium transition-colors relative capitalize",
                  selectedTab === tab
                    ? "text-[#013764]"
                    : "text-[#717179] hover:text-[#303030]"
                )}
              >
                {tab}
                {selectedTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#013764]" />
                )}
              </button>
            ))}
          </div>

          {/* Filter bar - toggled by Filter button */}
          {showFilterBar && (
            <div
              className="flex flex-wrap items-center gap-4 px-6 py-4 border border-[#E5E5E5] rounded-lg bg-gray-50/80"
              style={{ borderColor: "var(--color-border-light)" }}
            >
              <span className="text-sm font-medium text-[#303030] shrink-0">
                Filter by
              </span>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-[#717179] whitespace-nowrap">
                    Vendor
                  </label>
                  <MultiSelectFilter
                    values={filterVendors}
                    onChange={setFilterVendors}
                    options={uniqueVendors}
                    placeholder="All"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-[#717179] whitespace-nowrap">
                    Property
                  </label>
                  <MultiSelectFilter
                    values={filterProperties}
                    onChange={setFilterProperties}
                    options={uniqueProperties}
                    placeholder="All"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-[#717179] whitespace-nowrap">
                    Due date from
                  </label>
                  <input
                    type="date"
                    value={filterDateFrom}
                    onChange={(e) => setFilterDateFrom(e.target.value)}
                    className="h-9 px-2.5 rounded-lg border border-[#DADADA] bg-white text-sm text-[#303030] min-w-[130px]"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-[#717179] whitespace-nowrap">
                    Due date to
                  </label>
                  <input
                    type="date"
                    value={filterDateTo}
                    onChange={(e) => setFilterDateTo(e.target.value)}
                    className="h-9 px-2.5 rounded-lg border border-[#DADADA] bg-white text-sm text-[#303030] min-w-[130px]"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFilterVendors([]);
                  setFilterProperties([]);
                  setFilterDateFrom("");
                  setFilterDateTo("");
                  setCurrentPage(1);
                }}
                className="h-9 px-3 rounded-lg border border-[#DADADA] bg-white text-sm font-medium text-[#303030] hover:bg-gray-100 shrink-0"
              >
                Clear filters
              </button>
            </div>
          )}

          {/* Bills Table - Using GlobalTable Component */}
          <GlobalTable
            columns={columns.filter((col) => {
              // "status" was for draft parse status; not relevant in
              // the bills-only (All/Paid/Unpaid) view.
              if (col.key === "status") return false;
              return true;
            })}
            data={getSortedData()}
            rowKey="id"
            renderCell={(bill, columnKey) => {
              if (columnKey === "vendor") {
                return (
                  <div className="flex items-center gap-2">
                    <VendorAvatar name={bill.vendor} color={bill.vendorColor} />
                    <span className="text-gray-900 font-normal text-sm truncate">
                      {bill.vendor}
                    </span>
                  </div>
                );
              }
              if (columnKey === "dueDate") {
                return (
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-gray-900 font-normal text-sm truncate">
                      {bill.dueDate}
                    </span>
                    {bill.invoiceMonth && (
                      <Badge
                        variant="secondary"
                        className="shrink-0 border-transparent bg-indigo-50 text-indigo-700 hover:bg-indigo-50 font-medium"
                        title={`Rolls up to the ${bill.invoiceMonth} concierge invoice`}
                      >
                        {bill.invoiceMonth}
                      </Badge>
                    )}
                  </div>
                );
              }
              if (columnKey === "property") {
                return (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-900 font-normal text-sm truncate">
                      {bill.property}
                    </span>
                  </div>
                );
              }
              if (columnKey === "exportedAt") {
                const ts = bill.exportedAt ?? bill.importedAt;
                const isPaid = !!bill.qboPaidAt;
                const checkQueued = bill.checkPrintStatus === "queued";
                const checkPrinted = bill.checkPrintStatus === "printed";
                return (
                  <div className="flex items-center gap-2">
                    <div className={cn("w-2 h-2 rounded-full", isPaid ? "bg-green-500" : checkQueued ? "bg-blue-500" : "bg-amber-500")} />
                    <span className="text-gray-900 font-normal text-sm">
                      {isPaid ? "Paid" : formatRelativeTime(ts)}
                    </span>
                    {checkQueued && (
                      <span className="inline-flex items-center rounded-full bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 text-xs font-medium">
                        Check queued
                      </span>
                    )}
                    {checkPrinted && bill.checkNumber && (
                      <span className="inline-flex items-center rounded-full bg-gray-50 text-gray-700 border border-gray-200 px-2 py-0.5 text-xs font-medium">
                        Check #{bill.checkNumber}
                      </span>
                    )}
                  </div>
                );
              }
              if (columnKey === "memo") {
                return (
                  <span
                    className="text-gray-900 font-normal text-sm block truncate max-w-[300px]"
                    title={bill.memo}
                  >
                    {bill.memo}
                  </span>
                );
              }
              if (columnKey === "invoiceNumber") {
                return (
                  <span className="text-gray-900 font-normal text-sm truncate">
                    {bill.invoiceNumber}
                  </span>
                );
              }
              if (columnKey === "amount") {
                return (
                  <span className="text-gray-900 font-normal text-sm truncate">
                    ${bill.amount}
                  </span>
                );
              }
              return null;
            }}
            sortingHook={{
              handleSortClick,
              getSortIndicator,
              getSortedData,
            }}
            columnManagementHook={{
              columnOrder: columnOrder.filter((col) => {
                // "status" was for drafts (parse status); not relevant in
                // bills-only view.
                if (col === "status") return false;
                return true;
              }),
              visibleColumns,
              draggedColumn,
              dropTargetColumn,
              dropPosition,
              columnMenuPos,
              columnButtonRef,
              toggleColumnVisibility,
              handleColumnDragStart,
              handleColumnDragOver,
              handleColumnDragLeave,
              handleColumnDrop,
            }}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={(size) => {
              setItemsPerPage(size);
              setCurrentPage(1);
            }}
            serverTotal={approvedTotal}
            emptyMessage="No bills found"
            showPageSizeDropdown={showPageSizeDropdown}
            onShowPageSizeDropdownChange={setShowPageSizeDropdown}
            openMenuId={openMenuId}
            onOpenMenuIdChange={setOpenMenuId}
            title={
              selectedTab === "paid"
                ? "Paid Bills"
                : selectedTab === "unpaid"
                  ? "Unpaid Bills"
                  : "All Bills"
            }
            onFilterClick={() => {
              setShowPageSizeDropdown(false);
              setOpenMenuId(null);
              // usePageState's setter doesn't support functional updaters
              // (it would store the raw function), so toggle with a plain value.
              setShowFilterBar(!showFilterBar);
            }}
            headerActions={
              <button
                ref={columnButtonRef}
                onClick={() => {
                  setShowPageSizeDropdown(false);
                  setOpenMenuId(null);
                  setShowColumnModal((prev) => !prev);
                }}
                className="flex h-9 w-9 justify-center items-center rounded-lg border border-[#DADADA] bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] hover:bg-gray-50 transition-colors"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle
                    cx="8"
                    cy="3"
                    r="1.5"
                    fill="var(--color-text-primary)"
                  />
                  <circle
                    cx="8"
                    cy="8"
                    r="1.5"
                    fill="var(--color-text-primary)"
                  />
                  <circle
                    cx="8"
                    cy="13"
                    r="1.5"
                    fill="var(--color-text-primary)"
                  />
                </svg>
              </button>
            }
            showSearchBar={true}
            searchValue={searchValue}
            onSearchChange={(value) => {
              setSearchValue(value);
              setCurrentPage(1);
            }}
            actions={
              false
                ? [
                    {
                      label: "Edit Bill",
                      icon: (
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 18 18"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M15.75 15.7502H9.75002M1.875 16.1252L6.03695 14.5245C6.30316 14.4221 6.43626 14.3709 6.56079 14.3041C6.6714 14.2447 6.77685 14.1761 6.87603 14.0992C6.98769 14.0125 7.08853 13.9117 7.29021 13.71L15.75 5.25023C16.5784 4.4218 16.5784 3.07865 15.75 2.25023C14.9216 1.4218 13.5784 1.4218 12.75 2.25022L4.29021 10.71C4.08853 10.9117 3.98769 11.0125 3.90104 11.1242C3.82408 11.2234 3.75555 11.3288 3.69618 11.4394C3.62933 11.564 3.57814 11.6971 3.47575 11.9633L1.875 16.1252ZM1.875 16.1252L3.41859 12.1119C3.52905 11.8248 3.58428 11.6812 3.67901 11.6154C3.76179 11.5579 3.86423 11.5362 3.96322 11.5551C4.0765 11.5767 4.18529 11.6855 4.40286 11.9031L6.09718 13.5974C6.31475 13.815 6.42354 13.9237 6.44517 14.037C6.46408 14.136 6.44234 14.2385 6.38486 14.3212C6.31908 14.416 6.17549 14.4712 5.8883 14.5817L1.875 16.1252Z"
                            stroke="var(--color-text-secondary)"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      ),
                      onClick: (bill: Bill) => {
                        navigate(`/bills/record?billId=${bill.id}`, {
                          state: { bill: buildBillState(bill) },
                        });
                      },
                    },
                    {
                      label: "Delete",
                      icon: (
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 18 18"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M6.75 2.25H11.25M2.25 4.5H15.75M14.25 4.5L13.724 12.3895C13.6451 13.5732 13.6057 14.165 13.35 14.6138C13.1249 15.0088 12.7854 15.3265 12.3762 15.5248C11.9115 15.75 11.3183 15.75 10.132 15.75H7.86799C6.68168 15.75 6.08852 15.75 5.62375 15.5248C5.21457 15.3265 4.87507 15.0088 4.64999 14.6138C4.39433 14.165 4.35488 13.5732 4.27596 12.3895L3.75 4.5M7.5 7.875V11.625M10.5 7.875V11.625"
                            stroke="var(--color-status-error)"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      ),
                      onClick: handleDeleteBill,
                    },
                  ]
                : [
                    {
                      label: "View Bill",
                      icon: (
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 18 18"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M15.75 15.7502H9.75002M1.875 16.1252L6.03695 14.5245C6.30316 14.4221 6.43626 14.3709 6.56079 14.3041C6.6714 14.2447 6.77685 14.1761 6.87603 14.0992C6.98769 14.0125 7.08853 13.9117 7.29021 13.71L15.75 5.25023C16.5784 4.4218 16.5784 3.07865 15.75 2.25023C14.9216 1.4218 13.5784 1.4218 12.75 2.25022L4.29021 10.71C4.08853 10.9117 3.98769 11.0125 3.90104 11.1242C3.82408 11.2234 3.75555 11.3288 3.69618 11.4394C3.62933 11.564 3.57814 11.6971 3.47575 11.9633L1.875 16.1252ZM1.875 16.1252L3.41859 12.1119C3.52905 11.8248 3.58428 11.6812 3.67901 11.6154C3.76179 11.5579 3.86423 11.5362 3.96322 11.5551C4.0765 11.5767 4.18529 11.6855 4.40286 11.9031L6.09718 13.5974C6.31475 13.815 6.42354 13.9237 6.44517 14.037C6.46408 14.136 6.44234 14.2385 6.38486 14.3212C6.31908 14.416 6.17549 14.4712 5.8883 14.5817L1.875 16.1252Z"
                            stroke="var(--color-text-secondary)"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      ),
                      onClick: (bill: Bill) => {
                        navigate(`/bills/view?billId=${bill.id}`, {
                          state: { bill: buildBillState(bill) },
                        });
                      },
                    },
                    {
                      label: "Pay Bill",
                      // Hidden when the bill is already paid OR has never been
                      // pushed to QBO (qboBalanceCents is undefined until first sync).
                      hidden: (bill: Bill) =>
                        !!bill.qboPaidAt ||
                        bill.qboBalanceCents == null ||
                        bill.qboBalanceCents <= 0,
                      icon: (
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M2.25 6.75H15.75M2.25 9H15.75M3 4.5H15C15.8284 4.5 16.5 5.17157 16.5 6V13.5C16.5 14.3284 15.8284 15 15 15H3C2.17157 15 1.5 14.3284 1.5 13.5V6C1.5 5.17157 2.17157 4.5 3 4.5Z"
                                stroke="var(--color-text-secondary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ),
                      onClick: (bill: Bill) => setPayBillTarget(bill),
                    },
                    {
                      label: "View Payment",
                      // Mirror of Pay Bill: visible exactly when the bill is paid.
                      hidden: (bill: Bill) => !bill.qboPaidAt,
                      icon: (
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M1.5 9C1.5 9 4.5 3.75 9 3.75C13.5 3.75 16.5 9 16.5 9C16.5 9 13.5 14.25 9 14.25C4.5 14.25 1.5 9 1.5 9Z"
                                stroke="var(--color-text-secondary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          <circle cx="9" cy="9" r="2.25" stroke="var(--color-text-secondary)" strokeWidth="1.5" />
                        </svg>
                      ),
                      onClick: (bill: Bill) => setViewPaymentTarget(bill),
                    },
                    {
                      label: "Edit Bill",
                      // Only meaningful for bills that have been pushed (both
                      // QBO and Buildium ids present) — that's a precondition
                      // for the backend PATCH endpoint.
                      hidden: (bill: Bill) =>
                        !bill.qboBillId || !bill.buildiumBillId,
                      icon: (
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M15.75 15.7502H9.75002M1.875 16.1252L6.03695 14.5245C6.30316 14.4221 6.43626 14.3709 6.56079 14.3041C6.6714 14.2447 6.77685 14.1761 6.87603 14.0992C6.98769 14.0125 7.08853 13.9117 7.29021 13.71L15.75 5.25023C16.5784 4.4218 16.5784 3.07865 15.75 2.25023C14.9216 1.4218 13.5784 1.4218 12.75 2.25022L4.29021 10.71C4.08853 10.9117 3.98769 11.0125 3.90104 11.1242C3.82408 11.2234 3.75555 11.3288 3.69618 11.4394C3.62933 11.564 3.57814 11.6971 3.47575 11.9633L1.875 16.1252Z"
                                stroke="var(--color-text-secondary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ),
                      // Open the RecordBill page in edit mode rather than a
                      // modal — gives the user the full form (including line
                      // items) with the same layout they use to record a new
                      // bill. The page handles PATCH + dual re-export.
                      onClick: (bill: Bill) => {
                        navigate(
                          `/bills/record?readOnly=true&edit=true&billId=${bill.id}`,
                          { state: { bill: buildBillState(bill) } },
                        );
                      },
                    },
                    {
                      label: "Delete Bill",
                      icon: (
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 18 18"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M6.75 2.25H11.25M2.25 4.5H15.75M14.25 4.5L13.724 12.3895C13.6451 13.5732 13.6057 14.165 13.35 14.6138C13.1249 15.0088 12.7854 15.3265 12.3762 15.5248C11.9115 15.75 11.3183 15.75 10.132 15.75H7.86799C6.68168 15.75 6.08852 15.75 5.62375 15.5248C5.21457 15.3265 4.87507 15.0088 4.64999 14.6138C4.39433 14.165 4.35488 13.5732 4.27596 12.3895L3.75 4.5M7.5 7.875V11.625M10.5 7.875V11.625"
                            stroke="var(--color-status-error)"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      ),
                      onClick: (bill: Bill) => setDeleteBillTarget(bill),
                    },
                  ]
            }
            onRowClick={(bill) => {
              // Bills are read-only here — drafts live in the Record Bill workflow.
              navigate(`/bills/view?billId=${bill.id}`, {
                state: { bill: buildBillState(bill) },
              });
            }}
            
            showColumnModal={showColumnModal}
            onShowColumnModalChange={setShowColumnModal}
          />
        </div>
      </div>

      {/* Add Vendor Modal */}
      <AddVendorModal
        open={isAddVendorModalOpen}
        onOpenChange={(open) => setIsAddVendorModalOpen(open)}
        onAddVendor={handleVendorAdded}
      />

      {/* Column Filter Modal */}
      <ColumnFilterModal
        isOpen={showColumnModal}
        position={columnMenuPos}
        columns={columns
          .filter((col) => {
            // "status" was for draft parse status; not relevant in
            // bills-only view.
            if (col.key === "status") return false;
            return true;
          })
          .map((col) => ({
            key: col.key,
            label: col.label,
            icon: col.icon || null,
          }))}
        visibleColumns={visibleColumns}
        onToggleColumn={toggleColumnVisibility}
        onClose={() => setShowColumnModal(false)}
        buttonRef={columnButtonRef}
      />

      {/* View Payment Modal */}
      {viewPaymentTarget && (
        <ViewPaymentModal
          open={!!viewPaymentTarget}
          onOpenChange={(open) => {
            if (!open) setViewPaymentTarget(null);
          }}
          bill={{
            id: viewPaymentTarget.id,
            vendorName: viewPaymentTarget.vendor,
            propertyName: viewPaymentTarget.property,
            referenceNumber: viewPaymentTarget.invoiceNumber,
            totalCents: viewPaymentTarget.qboTotalCents ?? Math.round(viewPaymentTarget.amount * 100),
            qboBalanceCents: viewPaymentTarget.qboBalanceCents,
            qboPaidAt: viewPaymentTarget.qboPaidAt,
            qboBillId: viewPaymentTarget.qboBillId,
            buildiumBillId: viewPaymentTarget.buildiumBillId,
            buildiumBillPaymentId: viewPaymentTarget.buildiumBillPaymentId,
            paidOn: viewPaymentTarget.paidOn,
            paidFromName: viewPaymentTarget.paidFromName,
            paidDocNumber: viewPaymentTarget.paidDocNumber,
            paidMemo: viewPaymentTarget.paidMemo,
            receiptObjectKey: viewPaymentTarget.receiptObjectKey,
            receiptFilename: viewPaymentTarget.receiptFilename,
            receiptUploadedAt: viewPaymentTarget.receiptUploadedAt,
          }}
          onEditPayment={(p) => {
            // Close the view modal and open the edit modal with the picked row.
            const billCtx = viewPaymentTarget;
            setViewPaymentTarget(null);
            setEditPaymentTarget({ payment: p, bill: billCtx });
          }}
        />
      )}

      {/* Edit Payment Modal */}
      {editPaymentTarget && (
        <EditPaymentModal
          open={!!editPaymentTarget}
          onOpenChange={(open) => {
            if (!open) setEditPaymentTarget(null);
          }}
          payment={editPaymentTarget.payment}
          bill={{
            vendorName: editPaymentTarget.bill.vendor,
            referenceNumber: editPaymentTarget.bill.invoiceNumber,
          }}
          onSaved={() => {
            loadApprovedBills();
          }}
        />
      )}

      {/* Pay Bill Modal */}
      {payBillTarget && (
        <PayBillModal
          open={!!payBillTarget}
          onOpenChange={(open) => {
            if (!open) setPayBillTarget(null);
          }}
          bill={{
            id: payBillTarget.id,
            vendorName: payBillTarget.vendor,
            propertyName: payBillTarget.property,
            referenceNumber: payBillTarget.invoiceNumber,
            qboBalanceCents: payBillTarget.qboBalanceCents ?? 0,
          }}
          onPaid={(result) => {
            // Optimistically update the row so the user sees feedback before
            // the webhook arrives. The webhook (or refresh) will write the
            // authoritative state shortly after.
            setBillsList((prev) =>
              prev.map((b) =>
                b.id === payBillTarget.id
                  ? {
                      ...b,
                      qboBalanceCents: result.qbo_balance_cents ?? 0,
                      qboPaidAt: result.qbo_paid_at ?? b.qboPaidAt,
                    }
                  : b,
              ),
            );
            // Re-fetch the current tab to drop the row if it moved out of Unpaid.
            loadApprovedBills();
          }}
        />
      )}

      {/* Delete Bill confirmation */}
      {deleteBillTarget && (
        <ConfirmDialog
          open={!!deleteBillTarget}
          onOpenChange={(open) => {
            if (!open && !deletingBill) setDeleteBillTarget(null);
          }}
          title="Delete bill?"
          isDangerous
          isLoading={deletingBill}
          confirmLabel="Delete Bill"
          message={(() => {
            const parts = [
              `Delete the ${deleteBillTarget.vendor} bill for ${deleteBillTarget.property}? This can't be undone.`,
            ];
            if (deleteBillTarget.qboBillId) {
              parts.push(
                "It will be removed from QuickBooks and the platform.",
              );
            }
            if (deleteBillTarget.buildiumBillId) {
              parts.push(
                `Buildium has no delete API, so Buildium bill #${deleteBillTarget.buildiumBillId} must be deleted manually.`,
              );
            }
            if (deleteBillTarget.qboPaidAt || deleteBillTarget.buildiumBillPaymentId) {
              parts.push(
                "This bill is paid — its recorded payment will be removed too (manually in Buildium where applicable).",
              );
            }
            return parts.join(" ");
          })()}
          onConfirm={confirmDeleteBill}
        />
      )}
    </PageTemplate>
  );
}