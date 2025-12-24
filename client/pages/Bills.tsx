import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import AddVendorModal from "@/components/AddVendorModal";
import { usePageState } from "@/hooks/usePageState";
import { useSortingTable } from "@/hooks/useSortingTable";
import { formatRelativeTime } from "@/lib/timeUtils";
import { useColumnManagement } from "@/hooks/useColumnManagement";
import ColumnFilterModal from "@/components/ColumnFilterModal";
import GlobalTable from "@/components/GlobalTable";
import PageTemplate from "@/layout/PageTemplate";
import { Plus } from "lucide-react";
import {
  PageHeader,
  type PageHeaderAction,
  type PageHeaderTab,
} from "@/components/PageHeader";
import { fetchJSON } from "@/api/fetchJSON";

interface Bill {
  id: number;
  vendor: string;
  vendorColor: string;
  property: string;
  statementDate: string;
  dueDate: string;

  status: "pushed" | "push-failed";
  memo: string;

  // 🔁 rename semantic meaning: reference number
  invoiceNumber: string;

  amount: number;
  glAccount: string;

  // 🔁 timestamps now come from backend
  importedAt: number;   // created_at
  exportedAt?: number;  // for approved bills
  importStatus?: string;
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
        })
      : "—",

    dueDate: row.due_date
      ? new Date(row.due_date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "—",

    status: row.push_status === "pushed" ? "pushed" : "push-failed",

    memo: row.memo || "",

    // ✅ backend-derived reference number
    invoiceNumber: row.reference_number || "",

    amount: (row.amount_cents ?? 0) / 100,

    glAccount: "",

    // ✅ real timestamps from backend
    importedAt: createdAtMs,
    exportedAt:
      row.push_status === "pushed" ? createdAtMs : undefined,
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
        })
      : "—",

    dueDate: row.due_date
      ? new Date(row.due_date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "—",

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

    importStatus: row.status, // draft | parsed | receipt
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

export default function Bills() {
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = usePageState<"approved" | "drafts">(
    "selectedTab",
    "approved",
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

  const approvedBills = billsList.filter((b) => approvedBillIds.has(b.id));
  const draftBills = billsList.filter((b) => !approvedBillIds.has(b.id));
  const tabBills = selectedTab === "approved" ? approvedBills : draftBills;

  const { handleSortClick, getSortIndicator, getSortedData } =
    useSortingTable(tabBills);
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
    "vendor",
    "statementDate",
    "dueDate",
    "status",
    "exportedAt",
    "memo",
    "invoiceNumber",
    "amount",
  ]);

  useEffect(() => {
    async function loadBills() {
      try {
        const [approvedRows, draftRows] = await Promise.all([
          fetchJSON("/utilities/bills/all"),
          fetchJSON(
            "/vendors/bill-drafts?status=draft,parsed,receipt&limit=200"
          ),
        ]);
  
        const approved = approvedRows.map(mapUtilityRowToBill);
        const drafts = draftRows.map(mapDraftRowToBill);
  
        setBillsList([...approved, ...drafts]);
        setApprovedBillIds(new Set(approved.map((b) => b.id)));
      } catch (err) {
        console.error("Error loading bills:", err);
      }
    }
  
    loadBills();
  }, []);
  
  
  

  const columns = [
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
      key: "statementDate",
      label: "Statement Date",
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
      const resolvedBillId =
        typeof billData.billId === "number" && !Number.isNaN(billData.billId)
          ? billData.billId
          : Date.now();

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
      const resolvedBillId =
        typeof billData.billId === "number" && !Number.isNaN(billData.billId)
          ? billData.billId
          : Date.now();

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
      const [approvedRows, draftRows] = await Promise.all([
        fetchJSON("/utilities/bills/all"),
        fetchJSON(
          "/vendors/bill-drafts?status=draft,parsed,receipt&limit=200"
        ),
      ]);
  
      const approved = approvedRows.map(mapUtilityRowToBill);
      const drafts = draftRows.map(mapDraftRowToBill);
  
      setBillsList([...approved, ...drafts]);
      setApprovedBillIds(new Set(approved.map((b) => b.id)));
  
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
  

  const handleDeleteBill = useCallback((bill: Bill) => {
    setBillsList((prev) => prev.filter((b) => b.id !== bill.id));
  }, []);

  const headerTabs: PageHeaderTab[] = [
    { id: "approved", label: "Approved" },
    { id: "drafts", label: "Drafts" },
  ];

  const headerActions: PageHeaderAction[] = [
    {
      id: "add-vendor",
      label: "Add Vendor",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ marginTop: "-2px" }}
        >
          <path d="M5 12h14M12 5v14" style={{ marginTop: "-2px" }} />
        </svg>
      ),
      onClick: () => setIsAddVendorModalOpen(true),
    },
    {
      id: "sync",
      label: "Sync",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ marginTop: "-1px" }}
        >
          <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
          <path d="M21 3v5h-5" />
          <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
          <path d="M8 16H3v5" />
        </svg>
      ),
      onClick: handleSync,
      disabled: syncState !== "idle",
      loading: syncState === "syncing",
      loadingLabel:
        syncState === "syncing"
          ? "Syncing..."
          : syncState === "synced"
            ? "Synced"
            : "Sync",
    },
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
      onClick: () => navigate(`/bills/record?billId=${Date.now()}`),
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
            tabs={headerTabs}
            selectedTab={selectedTab}
            onTabChange={setSelectedTab}
            actions={headerActions}
          />

          {/* Bills Table - Using GlobalTable Component */}
          <GlobalTable
            columns={columns.filter((col) => {
              if (col.key === "status" && selectedTab !== "drafts") {
                return false;
              }
              if (col.key === "exportedAt" && selectedTab !== "approved") {
                return false;
              }
              return true;
            })}
            data={tabBills}
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
              if (columnKey === "statementDate") {
                return (
                  <span className="text-gray-900 font-normal text-sm truncate">
                    {bill.statementDate}
                  </span>
                );
              }
              if (columnKey === "dueDate") {
                return (
                  <span className="text-gray-900 font-normal text-sm truncate">
                    {bill.dueDate}
                  </span>
                );
              }
              if (columnKey === "status" && selectedTab === "drafts") {
                return (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-gray-900 font-normal text-sm">
                      {bill.importStatus ?? formatRelativeTime(bill.importedAt)}
                    </span>
                  </div>
                );
              }
              if (columnKey === "exportedAt" && selectedTab === "approved") {
                const ts = bill.exportedAt ?? bill.importedAt;
              
                return (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-gray-900 font-normal text-sm">
                      {formatRelativeTime(ts)}
                    </span>
                  </div>
                );
              }              
              if (columnKey === "memo") {
                return (
                  <span className="text-gray-900 font-normal text-sm truncate">
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
                if (col === "status" && selectedTab !== "drafts") {
                  return false;
                }
                if (col === "exportedAt" && selectedTab !== "approved") {
                  return false;
                }
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
            onItemsPerPageChange={setItemsPerPage}
            showPageSizeDropdown={showPageSizeDropdown}
            onShowPageSizeDropdownChange={setShowPageSizeDropdown}
            openMenuId={openMenuId}
            onOpenMenuIdChange={setOpenMenuId}
            title={
              selectedTab === "approved"
                ? "Approved & Exported Bills"
                : "Draft Bills"
            }
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
            actions={
              selectedTab === "drafts"
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
                        navigate(
                          `/bills/record?readOnly=true&billId=${bill.id}`,
                          {
                            state: { bill: buildBillState(bill) },
                          },
                        );
                      },
                    },
                  ]
            }
            onRowClick={(bill) => {
              const isApproved = selectedTab === "approved";
              const path = isApproved
                ? `/bills/record?readOnly=true&billId=${bill.id}`
                : `/bills/record?billId=${bill.id}`;
              navigate(path, { state: { bill: buildBillState(bill) } });
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
            if (col.key === "status" && selectedTab !== "drafts") {
              return false;
            }
            if (col.key === "exportedAt" && selectedTab !== "approved") {
              return false;
            }
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
    </PageTemplate>
  );
}