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
import PageHeader from "@/components/PageHeader";
import { SubPageHeaderV2 } from "@/components/SubPageHeaderV2";
import {
  CalendarIcon,
  ClockIcon,
  DollarIcon,
  DocumentIcon,
  NoteIcon,
  SyncIcon,
  RecordBillIcon,
  PlusIcon,
  EditIcon,
  DeleteIcon,
  DotsIcon,
} from "@/components/icons";

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
  const [billsList, setBillsList] = useState<Bill[]>(() =>
    bills.map((bill) => ({ ...bill, exportedAt: bill.importedAt })),
  );
  const [approvedBillIds, setApprovedBillIds] = useState<Set<number>>(
    new Set(bills.filter((_, idx) => idx % 2 === 0).map((b) => b.id)),
  );
  const dropdownButtonRef = useRef<HTMLButtonElement>(null);
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
      icon: <CalendarIcon width={16} height={16} />,
    },
    {
      key: "dueDate",
      label: "Due Date",
      icon: <CalendarIcon width={16} height={16} />,
    },
    {
      key: "status",
      label: "Import Status",
      icon: <ClockIcon width={16} height={16} />,
    },
    {
      key: "exportedAt",
      label: "Last Exported",
      icon: <ClockIcon width={16} height={16} />,
    },
    {
      key: "memo",
      label: "Memo",
      icon: <NoteIcon width={16} height={16} />,
    },
    {
      key: "invoiceNumber",
      label: "Reference #",
      icon: <DocumentIcon width={16} height={16} />,
    },
    {
      key: "amount",
      label: "Amount",
      icon: <DollarIcon width={16} height={16} />,
    },
  ];

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
        exportedAt: now,
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

  const handleDeleteBill = useCallback((bill: Bill) => {
    setBillsList((prev) => prev.filter((b) => b.id !== bill.id));
  }, []);

  return (
    <PageTemplate>
      <div className="flex flex-col gap-6 w-fit min-w-full">
        {/* Header Section - Using PageHeader Template */}
        <PageHeader
          title="All Bills"
          subtitle="All your bills, in one place"
          action={{
            label: "Record Bill",
            onClick: () => navigate(`/bills/record?billId=${Date.now()}`),
            icon: <RecordBillIcon width={22} height={22} />,
          }}
        />

        {/* Sub Header Section - Using SubPageHeaderV2 with toggles and secondary buttons */}
        <SubPageHeaderV2
          toggles={[
            {
              id: "approved",
              label: "Approved",
              active: selectedTab === "approved",
              onClick: () => setSelectedTab("approved"),
            },
            {
              id: "draft",
              label: "Drafts",
              active: selectedTab === "drafts",
              onClick: () => setSelectedTab("drafts"),
            },
          ]}
          buttons={[
            {
              id: "vendor",
              label: "Add Vendor",
              onClick: () => setIsAddVendorModalOpen(true),
              icon: <PlusIcon width={20} height={20} />,
            },
            {
              id: "sync",
              label: syncState === "idle" ? "Sync" : syncState === "syncing" ? "Syncing..." : "Synced",
              onClick: handleSync,
              disabled: syncState !== "idle",
              icon: <SyncIcon width={18} height={18} />,
            },
          ]}
        />

        <div className="flex flex-col gap-6">

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
                      {bill.importStatus ?? getTimeAgo(bill.importedAt)}
                    </span>
                  </div>
                );
              }
              if (columnKey === "exportedAt" && selectedTab === "approved") {
                return (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-gray-900 font-normal text-sm">
                      {formatRelativeTime(bill.exportedAt ?? approvedTimestamp)}
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
                      icon: <EditIcon width={18} height={18} color="var(--color-text-secondary)" />,
                      onClick: (bill: Bill) => {
                        navigate(`/bills/record?billId=${bill.id}`, {
                          state: { bill: buildBillState(bill) },
                        });
                      },
                    },
                    {
                      label: "Delete",
                      icon: <DeleteIcon width={18} height={18} color="var(--color-status-error)" />,
                      onClick: handleDeleteBill,
                    },
                  ]
                : [
                    {
                      label: "View Bill",
                      icon: <EditIcon width={18} height={18} color="var(--color-text-secondary)" />,
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
