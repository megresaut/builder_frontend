import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { StatusBadge } from "../Utilities";
import AddVendorModal from "@/components/AddVendorModal";
import { usePageState } from "@/hooks/usePageState";
import { useSortingTable } from "@/hooks/useSortingTable";
import { useColumnManagement } from "@/hooks/useColumnManagement";
import ColumnFilterModal from "@/components/ColumnFilterModal";
import GlobalTable from "@/components/GlobalTable";
import { formatRelativeTime } from "@/lib/timeUtils";

interface BillsProps {
  propertyAddress: string;
  propertyType?: string;
  propertyUnits?: number;
}

interface Bill {
  id: number;
  vendor: string;
  vendorColor: string;
  property: string;
  statementDate: string;
  dueDate: string;
  status: "pushed" | "push-failed";
  memo: string;
  invoiceNumber: string;
  amount: number;
  glAccount: string;
  importedAt: number;
  exportedAt?: number;
  importStatus?: string;
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

const billsColumnConfig: Record<string, { label: string; icon: React.ReactNode }> = {
  vendor: {
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
  statementDate: {
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
  dueDate: {
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
  memo: {
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
  invoiceNumber: {
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
  amount: {
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
  status: {
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
        <path d="M12 6v6l4 2" />
      </svg>
    ),
  },
  exportedAt: {
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
        <path d="M12 6v6l4 2" />
      </svg>
    ),
  },
};

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

export const Bills: React.FC<BillsProps> = ({
  propertyAddress,
  propertyType,
  propertyUnits,
}) => {
  const navigate = useNavigate();
  const { propertyId } = useParams<{ propertyId: string }>();
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
  const [billsList, setBillsList] = useState<Bill[]>(() =>
    bills.map((bill) => ({ ...bill, exportedAt: bill.importedAt })),
  );
  const [approvedBillIds, setApprovedBillIds] = useState<Set<number>>(
    new Set(bills.filter((_, idx) => idx % 2 === 0).map((b) => b.id))
  );

  const billsColumnManagement = useColumnManagement([
    "vendor",
    "statementDate",
    "dueDate",
    "status",
    "exportedAt",
    "memo",
    "invoiceNumber",
    "amount",
  ]);
  const dropdownButtonRef = useRef<HTMLButtonElement>(null);
  const dropdownMenuRef = useRef<HTMLDivElement>(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const [approvedTimestamp, setApprovedTimestamp] = useState(
    () => Date.now() - 3 * 60 * 1000,
  );
  const [draftsTimestamp, setDraftsTimestamp] = useState(
    () => Date.now() - 2 * 60 * 1000,
  );
  const [relativeTimeDisplay, setRelativeTimeDisplay] = useState(() => ({
    approved: formatRelativeTime(Date.now() - 3 * 60 * 1000),
    drafts: formatRelativeTime(Date.now() - 2 * 60 * 1000),
  }));
  const [newlyAddedBillIds, setNewlyAddedBillIds] = useState<Set<number>>(
    new Set()
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

  useEffect(() => {
    const interval = setInterval(() => {
      setRelativeTimeDisplay({
        approved: formatRelativeTime(approvedTimestamp),
        drafts: formatRelativeTime(draftsTimestamp),
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [approvedTimestamp, draftsTimestamp]);

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

      setApprovedTimestamp(billData.timestamp);
      setRelativeTimeDisplay((prev) => ({
        ...prev,
        approved: formatRelativeTime(billData.timestamp),
      }));

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
              : existing?.amount ?? 0,
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

      setSelectedTab("approved");
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

      setDraftsTimestamp(billData.timestamp);
      setRelativeTimeDisplay((prev) => ({
        ...prev,
        drafts: formatRelativeTime(billData.timestamp),
      }));

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
              : existing?.amount ?? 0,
          glAccount: existing?.glAccount ?? "6200 - HVAC Services",
          importedAt: existing?.importedAt ?? Date.now(),
          exportedAt: billData.status === "draft" ? undefined : existing?.exportedAt,
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
        window.dispatchEvent(new CustomEvent("billSaved", { detail: parsed.detail }));
      }
    } finally {
      localStorage.removeItem("avm:lastBillEvent");
    }
  }, []);

  useEffect(() => {
    let animationFrameId: number;

    const updateDropdownPos = () => {
      if (showPageSizeDropdown && dropdownButtonRef.current) {
        const rect = dropdownButtonRef.current.getBoundingClientRect();
        setDropdownPos({
          top: rect.bottom + 8,
          left: rect.left,
        });
      }

      if (showPageSizeDropdown) {
        animationFrameId = requestAnimationFrame(updateDropdownPos);
      }
    };

    if (showPageSizeDropdown) {
      updateDropdownPos();
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [showPageSizeDropdown]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showPageSizeDropdown &&
        dropdownMenuRef.current &&
        dropdownButtonRef.current
      ) {
        const isClickOutside =
          !dropdownMenuRef.current.contains(event.target as Node) &&
          !dropdownButtonRef.current.contains(event.target as Node);

        if (isClickOutside) {
          setShowPageSizeDropdown(false);
        }
      }
    };

    if (showPageSizeDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [showPageSizeDropdown]);

  useEffect(() => {
    const handleClickAnywhere = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      const isInActionsMenu = target.closest('[data-bill-actions-menu="true"]');
      const isInActionsTrigger = target.closest(
        '[data-bill-actions-trigger="true"]',
      );

      if (isInActionsMenu || isInActionsTrigger) {
        return;
      }

      setOpenMenuId(null);
    };

    document.addEventListener("mousedown", handleClickAnywhere);
    return () => document.removeEventListener("mousedown", handleClickAnywhere);
  }, []);

  const getTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diffMs = now - timestamp;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const handleSync = () => {
    setSyncState("syncing");
    setTimeout(() => {
      const now = Date.now();
      const newBill: Bill = {
        id: now,
        vendor: "New Vendor Import",
        vendorColor: "#7C3AED",
        property: "22 Indian Chase Dr",
        statementDate: new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        dueDate: new Date(now + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(
          "en-US",
          {
            month: "short",
            day: "numeric",
            year: "numeric",
          },
        ),
        status: "push-failed",
        memo: "Imported from sync",
        invoiceNumber: `REF-2024-${Math.floor(Math.random() * 1000)}`,
        amount: Math.floor(Math.random() * 500) + 100,
        glAccount: "6200 - HVAC Services",
        importedAt: now,
      };

      setBillsList((prev) => [newBill, ...prev]);
      setDraftsTimestamp(now);
      setRelativeTimeDisplay((prev) => ({
        ...prev,
        drafts: formatRelativeTime(now),
      }));
      setApprovedBillIds((prev) => {
        const next = new Set(prev);
        next.delete(newBill.id);
        return next;
      });

      markBillAsNew(newBill.id);

      setSyncState("synced");
      setTimeout(() => {
        setSyncState("idle");
      }, 2000);
    }, 1500);
  };

  const approvedBills = billsList.filter((b) => approvedBillIds.has(b.id));
  const draftBills = billsList.filter((b) => !approvedBillIds.has(b.id));
  const displayedBills = selectedTab === "approved" ? approvedBills : draftBills;
  const { handleSortClick, getSortIndicator, getSortedData } = useSortingTable(displayedBills);
  const sortedBills = getSortedData();
  const totalBills = sortedBills.length;
  const totalPages = Math.ceil(totalBills / itemsPerPage);

  const getPaginationNumbers = () => {
    const pages: (number | string)[] = [];

    if (totalPages <= 1) {
      return [1];
    }

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
      return pages;
    }

    // For totalPages > 7, show exactly 7 consecutive pages without ellipsis
    const windowSize = 7;
    let start = Math.max(1, currentPage - 2);
    let end = start + windowSize - 1;

    // Adjust if we're near the end to keep showing 7 pages
    if (end > totalPages) {
      end = totalPages;
      start = Math.max(1, end - windowSize + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  };

  return (
    <div className="max-w-full flex flex-col gap-6">
      {/* Header Section */}
      <div className="flex flex-col gap-6">
        {/* Title and Description */}
        <div className="flex flex-col gap-1">
          <h1 className="text-[#303030] font-semibold text-2xl leading-[30px]">
            Property Bills
          </h1>
          <p
            className="text-[#717179] font-medium text-base leading-4"
            style={{ marginTop: "-3px" }}
          >
            All bills associated to this property, in one place
          </p>
        </div>

        {/* Segmented Tabs and Action Buttons */}
        <div className="flex items-center justify-between w-full bg-white gap-6">
          <div className="flex bg-gray-50 rounded-lg shadow-[0_0_0_0.5px_#D2D1CF] p-0.5">
            <button
              onClick={() => {
                setSelectedTab("approved");
                setCurrentPage(1);
              }}
              className={cn(
                "flex justify-center items-center gap-2 rounded-md py-1.5 px-4 transition-all",
                selectedTab === "approved"
                  ? "bg-white shadow-[0_1px_3px_0_rgba(11,19,36,0.1),0_1px_1px_0_rgba(11,19,36,0.1)]"
                  : "bg-gray-50 hover:bg-gray-100",
              )}
            >
              <span className="text-[#282828] text-center font-normal text-sm leading-5">
                Approved
              </span>
            </button>
            <button
              onClick={() => {
                setSelectedTab("drafts");
                setCurrentPage(1);
              }}
              className={cn(
                "flex justify-center items-center gap-2 rounded-md py-1.5 px-4 transition-all",
                selectedTab === "drafts"
                  ? "bg-white shadow-[0_1px_3px_0_rgba(11,19,36,0.1),0_1px_1px_0_rgba(11,19,36,0.1)]"
                  : "bg-gray-50 hover:bg-gray-100",
              )}
            >
              <span className="text-[#282828] text-center font-medium text-sm leading-5">
                Drafts
              </span>
            </button>
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            <button
              onClick={() => setIsAddVendorModalOpen(true)}
              className="flex items-center gap-2 h-10 px-4 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors shadow-[0_1px_3px_0_rgba(0,0,0,0.03)]"
            >
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
                <path d="M5 12h14M12 5v14" />
              </svg>
              <span className="text-[#303030] font-normal text-sm leading-[22.4px]" style={{ marginTop: "-1px" }}>
                Add Vendor
              </span>
            </button>

            <button
              onClick={handleSync}
              disabled={syncState !== "idle"}
              className="flex items-center gap-2 h-10 px-4 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] disabled:opacity-50"
            >
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
              <span className="text-[#303030] font-normal text-sm leading-[22.4px]" style={{ marginTop: "-1px" }}>
                {syncState === "idle" && "Sync"}
                {syncState === "syncing" && "Syncing..."}
                {syncState === "synced" && "Synced"}
              </span>
            </button>

            <button
              onClick={() => {
                const billId = Date.now();
                if (propertyId) {
                  navigate(`/property/${propertyId}/bills/record?billId=${billId}`);
                } else {
                  navigate(`/bills/record?billId=${billId}`);
                }
              }}
              className="flex items-center gap-2 h-10 px-4 border border-white rounded-lg bg-[#013764] hover:bg-[#0a2e4d] transition-colors shadow-[0_0_0_1px_rgb(0,45,90),0_0_10px_-5px_rgba(0,0,0,0.2)]"
            >
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
                style={{ marginTop: "-1px" }}
              >
                <rect width="20" height="14" x="2" y="5" rx="2" />
                <line x1="2" x2="22" y1="10" y2="10" />
              </svg>
              <span className="text-white font-medium text-sm">
                Record Bill
              </span>
            </button>
          </div>
        </div>

        {/* Bills Table Container */}
        {selectedTab === "approved" && (
          <GlobalTable
            columns={billsColumnManagement.columnOrder
              .filter((key) => key !== "status")
              .map((key) => ({
                key,
                label: billsColumnConfig[key]?.label || key,
                icon: billsColumnConfig[key]?.icon,
              }))}
            data={approvedBills}
            rowKey="id"
            title="Approved & Exported Bills"
            subtitle={`Last exported ${relativeTimeDisplay.approved}`}
            actions={[
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
                      stroke="#525252"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ),
                onClick: (bill: Bill) => {
                  const basePath = propertyId
                    ? `/property/${propertyId}/bills/record?readOnly=true`
                    : "/bills/record?readOnly=true";
                  navigate(`${basePath}&billId=${bill.id}`, {
                    state: { bill: buildBillState(bill) },
                  });
                },
              },
            ]}
            renderCell={(bill: Bill, columnKey: string) => {
              switch (columnKey) {
                case "vendor":
                  return (
                    <div className="flex items-center gap-2">
                      <VendorAvatar name={bill.vendor} color={bill.vendorColor} />
                      <span className="text-gray-900 font-normal text-sm truncate">
                        {bill.vendor}
                      </span>
                    </div>
                  );
                case "statementDate":
                  return (
                    <span className="text-gray-900 font-normal text-sm truncate">
                      {bill.statementDate}
                    </span>
                  );
                case "dueDate":
                  return (
                    <span className="text-gray-900 font-normal text-sm truncate">
                      {bill.dueDate}
                    </span>
                  );
                case "exportedAt":
                  return (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-gray-900 font-normal text-sm">
                        {formatRelativeTime(
                          bill.exportedAt ?? approvedTimestamp,
                        )}
                      </span>
                    </div>
                  );
                case "memo":
                  return (
                    <span className="text-gray-900 font-normal text-sm truncate">
                      {bill.memo}
                    </span>
                  );
                case "invoiceNumber":
                  return (
                    <span className="text-gray-900 font-normal text-sm truncate">
                      {bill.invoiceNumber}
                    </span>
                  );
                case "amount":
                  return (
                    <span className="text-gray-900 font-normal text-sm truncate">
                      ${bill.amount}
                    </span>
                  );
                default:
                  return null;
              }
            }}
            sortingHook={{
              handleSortClick,
              getSortIndicator,
              getSortedData,
            }}
            columnManagementHook={billsColumnManagement}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={setItemsPerPage}
            showPageSizeDropdown={showPageSizeDropdown}
            onShowPageSizeDropdownChange={setShowPageSizeDropdown}
            openMenuId={openMenuId}
            onOpenMenuIdChange={setOpenMenuId}
            showColumnModal={billsColumnManagement.showColumnModal}
            onShowColumnModalChange={billsColumnManagement.setShowColumnModal}
            onRowClick={(bill: Bill) => {
              const basePath = propertyId
                ? `/property/${propertyId}/bills/record`
                : "/bills/record";
              navigate(`${basePath}?readOnly=true&billId=${bill.id}`, {
                state: { bill: buildBillState(bill) },
              });
            }}
            headerActions={
              <div className="flex items-start gap-2.5">
                <div className="flex h-9 items-center gap-2 px-3 rounded-lg border border-[#DADADA] bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.03)]">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M17.5 17.5L13.875 13.875M15.8333 9.16667C15.8333 12.8486 12.8486 15.8333 9.16667 15.8333C5.48477 15.8333 2.5 12.8486 2.5 9.16667C2.5 5.48477 5.48477 2.5 9.16667 2.5C12.8486 2.5 15.8333 5.48477 15.8333 9.16667Z"
                      stroke="#303030"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search..."
                    className="text-[#303030] font-normal text-base leading-[140%] tracking-[-0.32px] capitalize bg-transparent border-none outline-none placeholder:text-[#303030] w-32 sm:w-48"
                  />
                </div>
                <button
                  onClick={() => {}}
                  className="flex h-9 justify-center items-center gap-2 px-3 rounded-lg border border-[#DADADA] bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] hover:bg-gray-50 transition-colors"
                >
                  <span className="text-[#303030] font-normal text-base leading-[140%] tracking-[-0.32px] capitalize">
                    Filter
                  </span>
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 18 18"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M4.5 6.75L9 11.25L13.5 6.75"
                      stroke="#303030"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                <button
                  ref={billsColumnManagement.columnButtonRef}
                  onClick={() => {
                    setShowPageSizeDropdown(false);
                    setOpenMenuId(null);
                    billsColumnManagement.setShowColumnModal((prev) => !prev);
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-md border border-gray-200 bg-white hover:bg-gray-100 transition-colors"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle cx="8" cy="3" r="1.5" fill="#303030" />
                    <circle cx="8" cy="8" r="1.5" fill="#303030" />
                    <circle cx="8" cy="13" r="1.5" fill="#303030" />
                  </svg>
                </button>
              </div>
            }
          />
        )}

        {selectedTab === "drafts" && (
          <GlobalTable
            columns={billsColumnManagement.columnOrder
              .filter((key) => key !== "exportedAt")
              .map((key) => ({
                key,
                label: billsColumnConfig[key]?.label || key,
                icon: billsColumnConfig[key]?.icon,
              }))}
            data={draftBills}
            rowKey="id"
            title="Draft Bills"
            subtitle={`Updated ${relativeTimeDisplay.drafts}`}
            actions={[
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
                      stroke="#525252"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ),
                onClick: (bill: Bill) => {
                  const basePath = propertyId
                    ? `/property/${propertyId}/bills/record`
                    : "/bills/record";
                  navigate(`${basePath}?billId=${bill.id}`, {
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
                      stroke="#982740"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ),
                onClick: (bill: Bill) => {
                  setBillsList((prev) => prev.filter((b) => b.id !== bill.id));
                },
              },
            ]}
            renderCell={(bill: Bill, columnKey: string) => {
              switch (columnKey) {
                case "vendor":
                  return (
                    <div className="flex items-center gap-2">
                      <VendorAvatar name={bill.vendor} color={bill.vendorColor} />
                      <span className="text-gray-900 font-normal text-sm truncate">
                        {bill.vendor}
                      </span>
                    </div>
                  );
                case "statementDate":
                  return (
                    <span className="text-gray-900 font-normal text-sm truncate">
                      {bill.statementDate}
                    </span>
                  );
                case "dueDate":
                  return (
                    <span className="text-gray-900 font-normal text-sm truncate">
                      {bill.dueDate}
                    </span>
                  );
                case "status":
                  return (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-gray-900 font-normal text-sm">
                        {bill.importStatus ?? getTimeAgo(bill.importedAt)}
                      </span>
                    </div>
                  );
                case "memo":
                  return (
                    <span className="text-gray-900 font-normal text-sm truncate">
                      {bill.memo}
                    </span>
                  );
                case "invoiceNumber":
                  return (
                    <span className="text-gray-900 font-normal text-sm truncate">
                      {bill.invoiceNumber}
                    </span>
                  );
                case "amount":
                  return (
                    <span className="text-gray-900 font-normal text-sm truncate">
                      ${bill.amount}
                    </span>
                  );
                default:
                  return null;
              }
            }}
            sortingHook={{
              handleSortClick,
              getSortIndicator,
              getSortedData,
            }}
            columnManagementHook={billsColumnManagement}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={setItemsPerPage}
            showPageSizeDropdown={showPageSizeDropdown}
            onShowPageSizeDropdownChange={setShowPageSizeDropdown}
            openMenuId={openMenuId}
            onOpenMenuIdChange={setOpenMenuId}
            showColumnModal={billsColumnManagement.showColumnModal}
            onShowColumnModalChange={billsColumnManagement.setShowColumnModal}
            onRowClick={(bill: Bill) => {
              const basePath = propertyId
                ? `/property/${propertyId}/bills/record`
                : "/bills/record";
              navigate(`${basePath}?billId=${bill.id}`, {
                state: { bill: buildBillState(bill) },
              });
            }}
            headerActions={
              <div className="flex items-start gap-2.5">
                <div className="flex h-9 items-center gap-2 px-3 rounded-lg border border-[#DADADA] bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.03)]">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M17.5 17.5L13.875 13.875M15.8333 9.16667C15.8333 12.8486 12.8486 15.8333 9.16667 15.8333C5.48477 15.8333 2.5 12.8486 2.5 9.16667C2.5 5.48477 5.48477 2.5 9.16667 2.5C12.8486 2.5 15.8333 5.48477 15.8333 9.16667Z"
                      stroke="#303030"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search..."
                    className="text-[#303030] font-normal text-base leading-[140%] tracking-[-0.32px] capitalize bg-transparent border-none outline-none placeholder:text-[#303030] w-32 sm:w-48"
                  />
                </div>
                <button
                  onClick={() => {}}
                  className="flex h-9 justify-center items-center gap-2 px-3 rounded-lg border border-[#DADADA] bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] hover:bg-gray-50 transition-colors"
                >
                  <span className="text-[#303030] font-normal text-base leading-[140%] tracking-[-0.32px] capitalize">
                    Filter
                  </span>
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 18 18"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M4.5 6.75L9 11.25L13.5 6.75"
                      stroke="#303030"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                <button
                  ref={billsColumnManagement.columnButtonRef}
                  onClick={() => {
                    setShowPageSizeDropdown(false);
                    setOpenMenuId(null);
                    billsColumnManagement.setShowColumnModal((prev) => !prev);
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-md border border-gray-200 bg-white hover:bg-gray-100 transition-colors"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle cx="8" cy="3" r="1.5" fill="#303030" />
                    <circle cx="8" cy="8" r="1.5" fill="#303030" />
                    <circle cx="8" cy="13" r="1.5" fill="#303030" />
                  </svg>
                </button>
              </div>
            }
          />
        )}
      </div>

      {/* Column Filter Modal */}
      <ColumnFilterModal
        isOpen={billsColumnManagement.showColumnModal}
        position={billsColumnManagement.columnMenuPos}
        columns={billsColumnManagement.columnOrder
          .filter((key) => {
            if (key === "status" && selectedTab !== "drafts") {
              return false;
            }
            if (key === "exportedAt" && selectedTab !== "approved") {
              return false;
            }
            return true;
          })
          .map((key) => ({
            key,
            label: billsColumnConfig[key]?.label || key,
            icon: billsColumnConfig[key]?.icon,
          }))}
        visibleColumns={billsColumnManagement.visibleColumns}
        onToggleColumn={billsColumnManagement.toggleColumnVisibility}
        onClose={() => billsColumnManagement.setShowColumnModal(false)}
        buttonRef={billsColumnManagement.columnButtonRef}
      />

      {/* Dropdown Menu - Rendered via Portal at body level */}
      {showPageSizeDropdown &&
        createPortal(
          <div
            ref={dropdownMenuRef}
            className="bg-white overflow-hidden"
            style={{
              border: "0.5px solid #DADADA",
              borderRadius: "8px",
              boxShadow:
                "0 38px 11px 0 rgba(0, 0, 0, 0.00), 0 24px 10px 0 rgba(0, 0, 0, 0.01), 0 14px 8px 0 rgba(0, 0, 0, 0.04), 0 6px 6px 0 rgba(0, 0, 0, 0.06), 0 2px 3px 0 rgba(0, 0, 0, 0.07)",
              zIndex: 99999,
              minWidth: "56px",
              width: "56px",
              position: "fixed",
              top: dropdownPos.top + "px",
              left: dropdownPos.left + "px",
              pointerEvents: "auto",
            }}
            onMouseLeave={() => setShowPageSizeDropdown(false)}
          >
            {[10, 25, 50].map((size, index) => (
              <button
                key={size}
                onClick={() => {
                  setItemsPerPage(size);
                  setCurrentPage(1);
                  setShowPageSizeDropdown(false);
                }}
                className={cn(
                  "w-full px-4 py-3 text-center text-base transition-colors whitespace-nowrap",
                  itemsPerPage === size
                    ? "bg-gray-50 font-medium text-gray-900"
                    : "text-[#303030] hover:bg-gray-50",
                )}
                style={{
                  fontFamily:
                    "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                  fontSize: "16px",
                  lineHeight: "140%",
                  letterSpacing: "-0.32px",
                  borderRadius: index === 2 ? "0 0 8px 8px" : "0",
                }}
              >
                {size}
              </button>
            ))}
          </div>,
          document.body,
        )}

      {/* Add Vendor Modal */}
      <AddVendorModal
        open={isAddVendorModalOpen}
        onOpenChange={setIsAddVendorModalOpen}
      />
    </div>
  );
};
