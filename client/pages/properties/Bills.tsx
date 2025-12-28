import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { StatusBadge } from "../Utilities";
import AddVendorModal from "@/components/AddVendorModal";
import PageHeader from "@/components/PageHeader";
import { SubPageHeaderV2 } from "@/components/SubPageHeaderV2";
import { usePageState } from "@/hooks/usePageState";
import { useSortingTable } from "@/hooks/useSortingTable";
import { useColumnManagement } from "@/hooks/useColumnManagement";
import ColumnFilterModal from "@/components/ColumnFilterModal";
import GlobalTable from "@/components/GlobalTable";
import { formatRelativeTime } from "@/lib/timeUtils";
import {
  EditIcon,
  DeleteIcon,
  CalendarIcon,
  ClockIcon,
  NoteIcon,
  DocumentIcon,
  DollarIcon,
  PlusIcon,
  SyncIcon,
  RecordBillIcon,
} from "@/components/icons";

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
    icon: <CalendarIcon width={16} height={16} />,
  },
  dueDate: {
    label: "Due Date",
    icon: <CalendarIcon width={16} height={16} />,
  },
  memo: {
    label: "Memo",
    icon: <NoteIcon width={16} height={16} />,
  },
  invoiceNumber: {
    label: "Reference #",
    icon: <DocumentIcon width={16} height={16} />,
  },
  amount: {
    label: "Amount",
    icon: <DollarIcon width={16} height={16} />,
  },
  status: {
    label: "Import Status",
    icon: <ClockIcon width={16} height={16} />,
  },
  exportedAt: {
    label: "Last Exported",
    icon: <ClockIcon width={16} height={16} />,
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
      {/* Page Header with Record Bill action */}
      <PageHeader
        title="Property Bills"
        subtitle="All bills associated to this property, in one place"
        action={{
          label: "Record Bill",
          onClick: () => {
            const billId = Date.now();
            if (propertyId) {
              navigate(`/property/${propertyId}/bills/record?billId=${billId}`);
            } else {
              navigate(`/bills/record?billId=${billId}`);
            }
          },
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
        }}
      />

      {/* Sub Header Section - Using SubPageHeaderV2 with toggles and secondary buttons */}
      <SubPageHeaderV2
        toggles={[
          {
            id: "approved",
            label: "Approved",
            active: selectedTab === "approved",
            onClick: () => {
              setSelectedTab("approved");
              setCurrentPage(1);
            },
          },
          {
            id: "draft",
            label: "Drafts",
            active: selectedTab === "drafts",
            onClick: () => {
              setSelectedTab("drafts");
              setCurrentPage(1);
            },
          },
        ]}
        buttons={[
          {
            id: "vendor",
            label: "Add Vendor",
            onClick: () => setIsAddVendorModalOpen(true),
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
              >
                <path d="M5 12h14M12 5v14" />
              </svg>
            ),
          },
          {
            id: "sync",
            label: syncState === "idle" ? "Sync" : syncState === "syncing" ? "Syncing..." : "Synced",
            onClick: handleSync,
            disabled: syncState !== "idle",
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
              >
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                <path d="M21 3v5h-5" />
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                <path d="M8 16H3v5" />
              </svg>
            ),
          },
        ]}
      />

      <div className="flex flex-col gap-6">

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
                icon: <EditIcon width={18} height={18} color="#525252" />,
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
                icon: <EditIcon width={18} height={18} color="#525252" />,
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
                icon: <DeleteIcon width={18} height={18} color="#982740" />,
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
