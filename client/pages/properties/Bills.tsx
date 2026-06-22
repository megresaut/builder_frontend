import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { StatusBadge } from "../Utilities_wrong";
import { usePageState } from "@/hooks/usePageState";
import { useSortingTable } from "@/hooks/useSortingTable";
import { useColumnManagement } from "@/hooks/useColumnManagement";
import ColumnFilterModal from "@/components/ColumnFilterModal";
import GlobalTable from "@/components/GlobalTable";
import { formatRelativeTime } from "@/lib/timeUtils";
import { fetchJSON } from "@/api/fetchJSON";

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
  location?: string;
  statementDate: string;
  dueDate: string;
  status?: "pushed" | "push-failed";
  memo: string;
  invoiceNumber: string;
  amount: number;
  glAccount: string;
  importedAt: number;
  exportedAt?: number;
  importStatus?: string;
  pushStatus?: "pushed" | "push-failed" | string;
  createdAt?: number; // epoch ms
  isUtility?: boolean;
}


// Simple deterministic color picker based on vendor/provider name
const pickColor = (name: string) => {
  if (!name) return "#2463EB";

  const colors = [
    "#2463EB", // blue
    "#BC423E", // red
    "#EBA524", // yellow
    "#059669", // green
    "#7C3AED", // purple
  ];

  // hash string to index
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

interface ActionButtonProps {
  billId: number;
  bill: Bill;
  openMenuId: number | null;
  setOpenMenuId: (id: number | null) => void;
  tab?: "approved" | "drafts";
  propertyId?: string;
}

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

function getLastExportedDisplay(
  pushStatus?: string,
  createdAt?: number
) {
  if (pushStatus !== "pushed") {
    return {
      label: "Export failed",
      className: "text-red-600",
    };
  }

  if (!createdAt) {
    return {
      label: "—",
      className: "text-gray-400",
    };
  }

  return {
    label: formatRelativeTime(createdAt),
    className: "text-gray-900",
  };
}


function parseValidTimestamp(dateStr?: string): number | undefined {
  if (!dateStr) return undefined;

  const date = new Date(dateStr);

  // Invalid date
  if (isNaN(date.getTime())) return undefined;

  // 🚨 Guard against Go zero time (year 0001)
  if (date.getUTCFullYear() < 2000) return undefined;

  return date.getTime();
}


const ActionButton = ({
  billId,
  bill,
  openMenuId,
  setOpenMenuId,
  tab = "approved",
  propertyId,
}: ActionButtonProps) => {
  const showMenu = openMenuId === billId;
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    let animationFrameId: number;

    const updateMenuPos = () => {
      if (showMenu && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setMenuPos({
          top: rect.bottom + 8,
          left: rect.right - 145,
        });
      }

      if (showMenu) {
        animationFrameId = requestAnimationFrame(updateMenuPos);
      }
    };

    if (showMenu) {
      updateMenuPos();
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [showMenu]);

  return (
    <>
      <button
        ref={buttonRef}
        data-bill-actions-trigger="true"
        onClick={() => setOpenMenuId(showMenu ? null : billId)}
        className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="1" />
          <circle cx="19" cy="12" r="1" />
          <circle cx="5" cy="12" r="1" />
        </svg>
      </button>

      {showMenu &&
        createPortal(
          <div
            data-bill-actions-menu="true"
            className="bg-white flex flex-col justify-center items-start gap-4 p-4"
            style={{
              width: "145px",
              border: "0.5px solid #DADADA",
              borderRadius: "8px",
              boxShadow:
                "0 38px 11px 0 rgba(0, 0, 0, 0.00), 0 24px 10px 0 rgba(0, 0, 0, 0.01), 0 14px 8px 0 rgba(0, 0, 0, 0.04), 0 6px 6px 0 rgba(0, 0, 0, 0.06), 0 2px 3px 0 rgba(0, 0, 0, 0.07)",
              zIndex: 99999,
              position: "fixed",
              top: menuPos.top + "px",
              left: menuPos.left + "px",
              pointerEvents: "auto",
            }}
            onMouseLeave={() => setOpenMenuId(null)}
          >
            {tab === "drafts" ? (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenMenuId(null);
                    const path = propertyId
                      ? `/property/${propertyId}/bills/record`
                      : "/bills/record";
                    navigate(`${path}?billId=${bill.id}`);
                  }}
                  className="flex justify-between items-center w-full hover:opacity-70 transition-opacity"
                >
                  <span className="text-[#303030] font-normal text-base">
                    Edit Bill
                  </span>
                </button>

                <button
                  onClick={() => setOpenMenuId(null)}
                  className="flex justify-between items-center w-full hover:opacity-70 transition-opacity"
                >
                  <span className="text-[#303030] font-normal text-base">
                    Delete
                  </span>
                </button>
              </>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenMenuId(null);
                  navigate(`/bills/view?billId=${bill.id}`);
                }}
                className="flex justify-between items-center w-full hover:opacity-70 transition-opacity"
              >
                <span className="text-[#303030] font-normal text-base">
                  View Bill
                </span>
              </button>
            )}
          </div>,
          document.body,
        )}
    </>
  );
};

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
  property: {
    label: "Location",
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
  const [selectedTab, setSelectedTab] = usePageState<"all" | "paid" | "unpaid">(
    "selectedTab",
    "all",
  );
  const [currentPage, setCurrentPage] = usePageState("currentPage", 1);
  const [itemsPerPage, setItemsPerPage] = usePageState("itemsPerPage", 50);
  const [showPageSizeDropdown, setShowPageSizeDropdown] = usePageState(
    "showPageSizeDropdown",
    false,
  );
  const [openMenuId, setOpenMenuId] = usePageState<number | null>(
    "openMenuId",
    null,
  );
  const [billsList, setBillsList] = useState<Bill[]>([]);
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


  const [approvedBillsList, setApprovedBillsList] = useState<Bill[]>([]);

  // Load this property's bills, filtered by the active tab (all/paid/unpaid).
  // Mirrors the All Bills page: server filters by ?tab= via bills.qbo_paid_at.
  useEffect(() => {
    if (!propertyId) return;

    const params = new URLSearchParams();
    params.set("property_id", propertyId);
    params.set("tab", selectedTab);
    params.set("limit", "500");

    fetchJSON(`/utilities/bills/all?${params.toString()}`)
      .then((res) => {
        const safeData = Array.isArray(res?.data) ? res.data : [];
        const mapped = safeData.map((b: any) => ({
          id: b.id,

          vendor: b.vendor_name || b.provider_name || b.source_name || "Unknown",
          vendorColor: pickColor(
            b.vendor_name || b.provider_name || b.source_name || "Unknown"
          ),

          property: b.property_name ?? "",
          location: (() => {
            if (b.memo) {
              const idx = b.memo.indexOf(" - Billed");
              if (idx > 0) return b.memo.slice(0, idx).trim();
            }
            return b.property_name ?? "";
          })(),

          statementDate: formatDate(b.statement_date),
          dueDate: formatDate(b.due_date),

          pushStatus: b.push_status,
          createdAt: parseValidTimestamp(b.created_at),

          memo: b.memo ?? "",
          invoiceNumber: b.reference_number || b.invoice_number || "",
          amount: (b.amount_cents ?? 0) / 100,
          glAccount: "",

          isUtility: !!b.provider_id,
        }));

        setApprovedBillsList(mapped as Bill[]);
      })
      .catch((err) => console.error("Failed to load bills:", err));
  }, [propertyId, selectedTab]);




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

      markBillAsNew(resolvedBillId);

      setSelectedTab("all");
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

  const displayedBills = approvedBillsList;
  const totalBills = displayedBills.length;
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

  const billsColumnManagement = useColumnManagement([
    "dueDate",
    "vendor",
    "property",
    "invoiceNumber",
    "memo",
    "amount",
    "exportedAt",
  ]);
  
  const { handleSortClick, getSortIndicator, getSortedData } =
    useSortingTable(displayedBills);



  return (
    <div className="max-w-full flex flex-col gap-6">
      {/* Header Section */}
      <div className="flex flex-col gap-6">
        {/* Tabs and Action Buttons */}
        <div className="flex items-center justify-between w-full bg-white gap-6">
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
                    : "text-[#717179] hover:text-[#303030]",
                )}
              >
                {tab}
                {selectedTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#013764]" />
                )}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            <button
              onClick={() => {
                navigate(
                  propertyId
                    ? `/property/${propertyId}/bills/record`
                    : "/bills/record",
                );
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
        {approvedBillsList.length !== 0 && (
          <GlobalTable
            columns={billsColumnManagement.columnOrder
              .filter((key) => key !== "status")
              .map((key) => ({
                key,
                label: billsColumnConfig[key]?.label || key,
                icon: billsColumnConfig[key]?.icon,
              }))}
            data={displayedBills}
            rowKey="id"
            title="Property Bills"
            actions={[
              {
                label: "View Bill",
                icon: (
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path
                      d="M15.75 15.7502H9.75002M1.875 16.1252L6.03695 14.5245L15.75 5.25023"
                      stroke="#525252"
                      strokeWidth="1.5"
                    />
                  </svg>
                ),
                onClick: (bill: Bill) => {
                  navigate(`/bills/view?billId=${bill.id}`, {
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
                case "dueDate":
                  return (
                    <span className="text-gray-900 font-normal text-sm">
                      {bill.dueDate}
                    </span>
                  );
                case "property":
                  return (
                    <span className="text-gray-900 font-normal text-sm truncate">
                      {bill.location || bill.property}
                    </span>
                  );
                case "exportedAt": {
                  const result = getLastExportedDisplay(
                    bill.pushStatus,
                    bill.createdAt
                  );
                
                  return (
                    <span className={cn("font-normal text-sm", result.className)}>
                      {result.label}
                    </span>
                  );
                }
                case "memo":
                  return (
                    <span className="text-gray-900 font-normal text-sm truncate">
                      {bill.memo}
                    </span>
                  );
                case "invoiceNumber":
                  return (
                    <span className="text-gray-900 font-normal text-sm">
                      {bill.invoiceNumber}
                    </span>
                  );
                case "amount":
                  return (
                    <span className="text-gray-900 font-normal text-sm">
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
            showColumnModal={billsColumnManagement.showColumnModal}
            onShowColumnModalChange={billsColumnManagement.setShowColumnModal}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={setItemsPerPage}
            showPageSizeDropdown={showPageSizeDropdown}
            onShowPageSizeDropdownChange={setShowPageSizeDropdown}
            openMenuId={openMenuId}
            onOpenMenuIdChange={setOpenMenuId}
          />
        )}

        {approvedBillsList.length === 0 && (
          <div className="w-full flex flex-col justify-center items-center py-24 gap-4 text-center">
            <div className="text-lg font-medium text-[#303030]">
              {selectedTab === "paid"
                ? "No paid bills for this property"
                : selectedTab === "unpaid"
                ? "No unpaid bills for this property"
                : "No bills for this property yet"}
            </div>

            <p className="text-sm text-gray-500 max-w-md">
              Bills will appear here once they’ve been recorded or assigned to this property.
            </p>

            <button
              onClick={() => navigate("/bills")}
              className="mt-2 px-4 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-sm font-medium text-[#303030]"
            >
              View All Bills
            </button>
          </div>
        )}
      </div>
    </div>
  );
}