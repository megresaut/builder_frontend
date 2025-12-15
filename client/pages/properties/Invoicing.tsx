import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams } from "react-router-dom";
import { StatusBadge } from "@/components/StatusBadge";
import { useSortingTable } from "@/hooks/useSortingTable";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import FTOApprovalModal from "@/components/FTOApprovalModal";
import InvoicePreviewModal, {
  type InvoiceLineItem,
} from "@/components/InvoicePreviewModal";

interface InvoicingProps {
  propertyAddress: string;
  propertyType: string;
  propertyUnits: number;
  propertyLocation?: string;
}

const ActionButton = ({
  itemId,
  openMenuId,
  setOpenMenuId,
  onView,
  isFTO = false,
  ftoActionLabel = "View Bill",
}: {
  itemId: string;
  openMenuId: string | null;
  setOpenMenuId: (id: string | null) => void;
  onView: () => void;
  isFTO?: boolean;
  ftoActionLabel?: string;
}) => {
  const showMenu = openMenuId === itemId;
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });

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
        onMouseDown={(e) => e.stopPropagation()}
        onClick={() => setOpenMenuId(showMenu ? null : itemId)}
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
            className="bg-white flex flex-col justify-center items-start gap-4 p-4"
            onMouseDown={(e) => e.stopPropagation()}
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
            <button
              onClick={() => {
                onView();
                setOpenMenuId(null);
              }}
              className="flex justify-between items-center w-full hover:opacity-70 transition-opacity"
            >
              <span
                className="text-[#303030] font-normal text-base leading-[140%] tracking-[-0.32px] capitalize"
                style={{
                  fontFamily:
                    "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                }}
              >
                {isFTO ? "View FTO" : "View Bill"}
              </span>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M2 12C2 12 5.5 5 12 5C18.5 5 22 12 22 12C22 12 18.5 19 12 19C5.5 19 2 12 2 12Z"
                  stroke="#525252"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
                  stroke="#525252"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>,
          document.body,
        )}
    </>
  );
};

type ViewBillLineItem = {
  id: number;
  property: string;
  unit: string;
  workOrder: string;
  description: string;
  glAccount: string;
  total: string;
};

type ViewBillState = {
  vendorName?: string;
  referenceNumber?: string;
  invoiceDate?: string;
  dueDate?: string;
  memo?: string;
  lineItems?: ViewBillLineItem[];
};

export const Invoicing: React.FC<InvoicingProps> = ({
  propertyAddress,
  propertyType,
  propertyUnits,
  propertyLocation,
}) => {
  const navigate = useNavigate();
  const { propertyId } = useParams<{ propertyId: string }>();

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [showPageSizeDropdown, setShowPageSizeDropdown] = useState(false);
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);
  const [invoicePreviewLineItems, setInvoicePreviewLineItems] = useState<
    InvoiceLineItem[]
  >([]);
  const [invoicePreviewInvoiceDate, setInvoicePreviewInvoiceDate] =
    useState<string>("");
  const [invoicePreviewShowCommitButton, setInvoicePreviewShowCommitButton] =
    useState(false);
  const [showFTOApprovalModal, setShowFTOApprovalModal] = useState(false);
  const [selectedFTOId, setSelectedFTOId] = useState<number | null>(null);
  const [showAddAdditionalBillsModal, setShowAddAdditionalBillsModal] =
    useState(false);
  const [selectedAdditionalBillId, setSelectedAdditionalBillId] =
    useState<string>("");
  const [selectedAdditionalFtoId, setSelectedAdditionalFtoId] =
    useState<string>("");
  const [showingPendingInsights, setShowingPendingInsights] = useState(false);
  const dropdownButtonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });

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
    };

    updateDropdownPos();

    if (showPageSizeDropdown) {
      animationFrameId = requestAnimationFrame(updateDropdownPos);
      window.addEventListener("resize", updateDropdownPos);
      window.addEventListener("scroll", updateDropdownPos);
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", updateDropdownPos);
      window.removeEventListener("scroll", updateDropdownPos);
    };
  }, [showPageSizeDropdown]);

  useEffect(() => {
    const handleClickAnywhere = () => {
      setOpenMenuId(null);
    };

    document.addEventListener("mousedown", handleClickAnywhere);
    return () => document.removeEventListener("mousedown", handleClickAnywhere);
  }, []);

  type InvoiceItemStatus = "Pending Approval" | "Approved";

  interface InvoiceItem {
    id: number;
    vendor: string;
    vendorIcon: string;
    vendorBg: string;
    vendorBorder: string;
    glAccount: string;
    description: string;
    amount: string;
    source: string;
    status: InvoiceItemStatus;
    statusColor: string;
    statusBg: string;
  }

  const initialInvoiceItems: InvoiceItem[] = [
    {
      id: 1,
      vendor: "Elite HVAC",
      vendorIcon:
        "https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/9ffc2d13a49e4caa7244ce9895eba63cc87e5390?placeholderIfAbsent=true",
      vendorBg: "#FFF0EF",
      vendorBorder: "rgba(188, 66, 62, 0.22)",
      glAccount: "ConEd - 1,220 kWh",
      description: "ConEd - 1,220 kWh",
      amount: "$420",
      source: "Manual",
      status: "Approved",
      statusColor: "#059669",
      statusBg: "#D1FAE5",
    },
    {
      id: 2,
      vendor: "ABC Plumbing",
      vendorIcon:
        "https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/6a406e4d9d31a0d96e167fc376208ee79f53def5?placeholderIfAbsent=true",
      vendorBg: "#FEFCDB",
      vendorBorder: "rgba(235, 165, 36, 0.22)",
      glAccount: "Unit 48 Thermostat",
      description: "Unit 48 Thermostat",
      amount: "$380",
      source: "Vendor-Import",
      status: "Pending Approval",
      statusColor: "#D97706",
      statusBg: "#FEF3C7",
    },
    {
      id: 3,
      vendor: "Elite HVAC",
      vendorIcon:
        "https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/c163c3bcaa194a5f948a36680b0501ecd8569640?placeholderIfAbsent=true",
      vendorBg: "#DBE9FE",
      vendorBorder: "rgba(36, 99, 235, 0.22)",
      glAccount: "Tools for common area",
      description: "Tools for common area",
      amount: "$120",
      source: "Manual",
      status: "Approved",
      statusColor: "#2463EB",
      statusBg: "#DBE9FE",
    },
    {
      id: 4,
      vendor: "Home Depot",
      vendorIcon:
        "https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/9ffc2d13a49e4caa7244ce9895eba63cc87e5390?placeholderIfAbsent=true",
      vendorBg: "#FFF4ED",
      vendorBorder: "rgba(251, 146, 60, 0.22)",
      glAccount: "N/A",
      description: "Buying door knobs for property",
      amount: "$45",
      source: "FTO Submission",
      status: "Pending Approval",
      statusColor: "#D97706",
      statusBg: "#FEF3C7",
    },
    {
      id: 5,
      vendor: "ConEd Electric",
      vendorIcon:
        "https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/9ffc2d13a49e4caa7244ce9895eba63cc87e5390?placeholderIfAbsent=true",
      vendorBg: "#E0F2FE",
      vendorBorder: "rgba(2, 132, 199, 0.22)",
      glAccount: "Utilities - Electric",
      description: "Monthly electric bill - October 2025",
      amount: "$285",
      source: "Utility-Import",
      status: "Approved",
      statusColor: "#059669",
      statusBg: "#D1FAE5",
    },
  ];

  const [invoiceItems, setInvoiceItems] =
    useState<InvoiceItem[]>(initialInvoiceItems);

  interface InvoiceHistoryItem {
    id: number;
    dateCreated: string;
    invoiceMonth: string;
    amount: string;
    lineItems: InvoiceLineItem[];
  }

  const formatInvoiceMonth = (dateStr: string) => {
    const parsed = new Date(dateStr);
    if (Number.isNaN(parsed.getTime())) return dateStr;

    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      year: "numeric",
    }).format(parsed);
  };

  const seedInvoiceHistory: InvoiceHistoryItem[] = [
    {
      id: 1,
      dateCreated: "Oct 1, 2025",
      invoiceMonth: formatInvoiceMonth("Oct 1, 2025"),
      amount: "$237",
      lineItems: [],
    },
    {
      id: 2,
      dateCreated: "Oct 1, 2025",
      invoiceMonth: formatInvoiceMonth("Oct 1, 2025"),
      amount: "$639",
      lineItems: [],
    },
    {
      id: 3,
      dateCreated: "Sep 28, 2025",
      invoiceMonth: formatInvoiceMonth("Sep 28, 2025"),
      amount: "$482",
      lineItems: [],
    },
    {
      id: 4,
      dateCreated: "Sep 21, 2025",
      invoiceMonth: formatInvoiceMonth("Sep 21, 2025"),
      amount: "$183",
      lineItems: [],
    },
    {
      id: 5,
      dateCreated: "Sep 14, 2025",
      invoiceMonth: formatInvoiceMonth("Sep 14, 2025"),
      amount: "$711",
      lineItems: [],
    },
    {
      id: 6,
      dateCreated: "Sep 7, 2025",
      invoiceMonth: formatInvoiceMonth("Sep 7, 2025"),
      amount: "$335",
      lineItems: [],
    },
    {
      id: 7,
      dateCreated: "Aug 31, 2025",
      invoiceMonth: formatInvoiceMonth("Aug 31, 2025"),
      amount: "$558",
      lineItems: [],
    },
    {
      id: 8,
      dateCreated: "Aug 24, 2025",
      invoiceMonth: formatInvoiceMonth("Aug 24, 2025"),
      amount: "$294",
      lineItems: [],
    },
    {
      id: 9,
      dateCreated: "Aug 17, 2025",
      invoiceMonth: formatInvoiceMonth("Aug 17, 2025"),
      amount: "$672",
      lineItems: [],
    },
    {
      id: 10,
      dateCreated: "Aug 10, 2025",
      invoiceMonth: formatInvoiceMonth("Aug 10, 2025"),
      amount: "$416",
      lineItems: [],
    },
  ];

  const [invoiceHistory, setInvoiceHistory] =
    useState<InvoiceHistoryItem[]>(seedInvoiceHistory);

  const { handleSortClick: handleInvoiceSortClick, getSortIndicator: getInvoiceSortIndicator, getSortedData: getSortedInvoiceItems } = useSortingTable(invoiceItems);
  const { handleSortClick: handleHistorySortClick, getSortIndicator: getHistorySortIndicator, getSortedData: getSortedHistoryItems } = useSortingTable(invoiceHistory);

  const toIsoDateTime = (date: Date) => date.toISOString();

  const buildViewBillStateFromInvoiceItem = (
    item: InvoiceItem,
    address: string,
  ): ViewBillState => {
    const today = new Date();
    const due = new Date(today);
    due.setDate(due.getDate() + 30);

    return {
      vendorName: item.vendor,
      referenceNumber: `INV-${String(item.id).padStart(4, "0")}`,
      invoiceDate: toIsoDateTime(today),
      dueDate: toIsoDateTime(due),
      memo: item.description,
      lineItems: [
        {
          id: 1,
          property: address,
          unit: "N/A",
          workOrder: "N/A",
          description: item.description,
          glAccount: item.glAccount,
          total: item.amount,
        },
      ],
    };
  };

  const openViewBill = (bill: ViewBillState) => {
    const basePath = propertyId
      ? `/property/${propertyId}/bills/record`
      : "/bills/record";

    navigate(`${basePath}?readOnly=true`, {
      state: { bill },
    });
  };

  const openEditBill = (bill: ViewBillState) => {
    const basePath = propertyId
      ? `/property/${propertyId}/bills/record`
      : "/bills/record";

    navigate(basePath, {
      state: { bill },
    });
  };

  const openViewFTO = (ftoId: number) => {
    setSelectedFTOId(ftoId);
    setShowFTOApprovalModal(true);
  };

  const buildPreviewLineItemsFromInvoiceItem = (
    item: InvoiceItem,
  ): InvoiceLineItem[] => [
    {
      id: 1,
      vendor: item.vendor,
      description: item.description,
      amount: item.amount,
    },
  ];

  const buildPreviewLineItemsFromHistoryItem = (
    item: InvoiceHistoryItem,
  ): InvoiceLineItem[] => {
    if (item.lineItems.length > 0) return item.lineItems;

    return [
      {
        id: 1,
        vendor: "",
        description: `Invoice ${item.invoiceMonth}`,
        amount: item.amount,
      },
    ];
  };

  const openInvoicePreview = (options: {
    lineItems: InvoiceLineItem[];
    invoiceDate: string;
    showCommitButton: boolean;
  }) => {
    setInvoicePreviewLineItems(options.lineItems);
    setInvoicePreviewInvoiceDate(options.invoiceDate);
    setInvoicePreviewShowCommitButton(options.showCommitButton);
    setShowInvoicePreview(true);
  };

  const handleCommitInvoice = (lineItems: InvoiceLineItem[]) => {
    const total = lineItems.reduce((sum, item) => {
      const value = parseFloat(String(item.amount).replace(/[^\d.]/g, ""));
      return sum + (Number.isFinite(value) ? value : 0);
    }, 0);

    const amount = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(total);

    const dateCreated = new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date());

    const invoiceMonth = invoicePreviewInvoiceDate || currentInvoiceMonth;

    setInvoiceHistory((prev) => {
      const nextId = prev.reduce((max, item) => Math.max(max, item.id), 0) + 1;
      const nextItem: InvoiceHistoryItem = {
        id: nextId,
        dateCreated,
        invoiceMonth,
        amount,
        lineItems,
      };

      return [nextItem, ...prev];
    });

    // Remove the committed items from invoiceItems
    const committedItemIds = new Set(lineItems.map((item) => item.id));
    setInvoiceItems((prev) =>
      prev.filter((item) => !committedItemIds.has(item.id)),
    );

    setCurrentPage(1);
  };

  const handleOpenAddAdditionalBillsModal = () => {
    setSelectedAdditionalBillId("");
    setSelectedAdditionalFtoId("");
    setShowAddAdditionalBillsModal(true);
  };

  const handleAddAdditionalToInvoice = () => {
    const selectedId = selectedAdditionalBillId || selectedAdditionalFtoId;
    if (!selectedId) return;

    const selectedItem = invoiceItems.find(
      (item) => String(item.id) === selectedId,
    );
    if (!selectedItem) return;

    setInvoiceItems((prev) => {
      const nextId = prev.reduce((max, item) => Math.max(max, item.id), 0) + 1;
      return [...prev, { ...selectedItem, id: nextId }];
    });

    setShowAddAdditionalBillsModal(false);
    setSelectedAdditionalBillId("");
    setSelectedAdditionalFtoId("");
  };

  const totalInvoices = invoiceHistory.length;
  const totalPages = Math.ceil(totalInvoices / itemsPerPage);
  const paginatedHistory = invoiceHistory.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

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

  // Calculate pending approval bills
  const pendingApprovalBills = invoiceItems.filter(
    (item) => item.status === "Pending Approval",
  );

  const pendingVendorImportBills = pendingApprovalBills.filter(
    (item) => item.source === "Vendor-Import",
  );

  const pendingFTOBills = pendingApprovalBills.filter(
    (item) => item.source === "FTO Submission",
  );

  const totalPendingAmount = pendingApprovalBills.reduce((sum, item) => {
    const amount = parseFloat(item.amount.replace(/[$,]/g, "")) || 0;
    return sum + amount;
  }, 0);

  const showAlertBanner = pendingApprovalBills.length > 0;

  const getAlertMessage = () => {
    if (pendingVendorImportBills.length > 0 && pendingFTOBills.length > 0) {
      return "There are unapproved vendor bills and Field Team Expenses outstanding.";
    } else if (pendingVendorImportBills.length > 0) {
      return "There are unapproved vendor bills outstanding.";
    } else {
      return "There are unapproved Field Team Expenses outstanding.";
    }
  };

  const handleViewInsights = () => {
    setShowingPendingInsights(!showingPendingInsights);
  };

  const invoiceNow = new Date();
  const currentInvoiceMonthName = new Intl.DateTimeFormat("en-US", {
    month: "long",
  }).format(invoiceNow);
  const currentInvoiceMonth = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(invoiceNow);

  return (
    <div className="flex flex-col gap-0">
      {/* Alert Banner */}
      {showAlertBanner && (
        <div
          className="flex items-center justify-between self-stretch rounded-2xl border border-[#E5E5FF] p-3 px-4"
          style={{
            boxShadow:
              "4px -4px 14px 0 rgba(0, 28, 237, 0.07) inset, -4px 4px 14px 0 rgba(237, 0, 217, 0.07) inset",
          }}
        >
          <div className="flex items-center gap-2.5">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g clipPath="url(#clip0_10950_5031)">
                <path
                  d="M3.00065 14.6668V11.3335M3.00065 4.66683V1.3335M1.33398 3.00016H4.66732M1.33398 13.0002H4.66732M8.66732 2.00016L7.5112 5.00607C7.32319 5.49489 7.22919 5.7393 7.083 5.94489C6.95344 6.12709 6.79425 6.28629 6.61204 6.41585C6.40646 6.56203 6.16204 6.65604 5.67322 6.84404L2.66732 8.00016L5.67323 9.15628C6.16205 9.34429 6.40646 9.43829 6.61204 9.58448C6.79425 9.71404 6.95344 9.87323 7.083 10.0554C7.22919 10.261 7.32319 10.5054 7.5112 10.9943L8.66732 14.0002L9.82344 10.9943C10.0114 10.5054 10.1054 10.261 10.2516 10.0554C10.3812 9.87323 10.5404 9.71404 10.7226 9.58448C10.9282 9.43829 11.1726 9.34429 11.6614 9.15628L14.6673 8.00016L11.6614 6.84404C11.1726 6.65604 10.9282 6.56203 10.7226 6.41585C10.5404 6.28629 10.3812 6.12709 10.2516 5.94489C10.1054 5.7393 10.0114 5.49489 9.82344 5.00607L8.66732 2.00016Z"
                  stroke="#1D407F"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
              <defs>
                <clipPath id="clip0_10950_5031">
                  <rect width="16" height="16" fill="white" />
                </clipPath>
              </defs>
            </svg>
            <div className="text-base font-medium leading-[1.4] tracking-[-0.32px] capitalize">
              <span className="font-bold">Unapproved Bills</span>
              <span className="font-medium">
                {" "}
                - {getAlertMessage()} (${totalPendingAmount.toFixed(2)})
              </span>
            </div>
          </div>
          <button
            onClick={handleViewInsights}
            className="text-[#013764] underline font-medium text-base leading-[1.4] tracking-[-0.32px] capitalize whitespace-nowrap hover:opacity-80 transition-opacity bg-transparent border-none cursor-pointer"
          >
            View
          </button>
        </div>
      )}

      {/* This Month's Invoice */}
      <div className="bg-white flex w-full flex-col mt-6">
        <div className="rounded-xl border border-[#E5E5E5] shadow-[0_1px_2px_0_rgba(10,13,18,0.05)] flex w-full flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-white flex w-full px-4 py-4 items-center gap-4 justify-between flex-wrap">
            <div className="flex items-center gap-4">
              <div className="text-[#303030] font-medium text-[22px] leading-[1.09]">
                {currentInvoiceMonthName} Invoice
              </div>
            </div>
            <div className="flex min-w-60 items-start gap-2.5">
              <div className="flex min-w-60 min-h-9 gap-2 items-center px-3 rounded-lg border-[0.5px] border-[#DADADA] shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] bg-[#FBFBFB]">
                <img
                  loading="lazy"
                  src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/b47ca0b4fcf9eb132889213ca1e6a92de1087150?placeholderIfAbsent=true"
                  className="w-5 h-5"
                  alt=""
                />
                <input
                  type="text"
                  placeholder="Search..."
                  className="bg-transparent border-none outline-none text-[#303030] font-normal text-base leading-[1.4] tracking-[-0.32px]"
                />
              </div>
              <button
                type="button"
                onClick={handleOpenAddAdditionalBillsModal}
                className="flex h-9 items-center gap-2 px-4 rounded-lg border border-white bg-[#013764] hover:bg-[#003a73] transition-colors whitespace-nowrap"
                style={{
                  boxShadow:
                    "0 0 0 1px #002D5A, 0 0 10px -5px rgba(0, 0, 0, 0.20)",
                }}
              >
                <span className="text-white font-medium text-base leading-normal">
                  Add line item
                </span>
              </button>
            </div>
          </div>

          {/* Table */}
          <div
            className="border-[0.5px] border-[#DADADA] shadow-[0_1px_2px_0_rgba(10,13,18,0.05)] bg-white flex w-full max-w-full flex-col overflow-visible"
            style={{
              borderLeftWidth: "0px",
              borderBottomWidth: "0px",
              borderRightWidth: "0px",
            }}
          >
            <div
              className="flex w-full items-center flex-wrap"
              style={{ borderLeftColor: "transparent" }}
            >
              <div
                className="flex min-w-60 items-center flex-wrap flex-1"
                style={{ borderLeftColor: "transparent" }}
              >
                {/* Vendor Column */}
                <div
                  className="border-r border-[#DADADA] flex flex-col overflow-hidden flex-grow w-[151px]"
                  style={{ borderLeftColor: "transparent" }}
                >
                  <div
                    className="items-center border-b-[0.5px] border-[#DADADA] bg-[#FBFBFB] flex w-full gap-2 overflow-hidden px-3 py-3 cursor-pointer hover:bg-gray-200 transition-colors"
                    style={{ borderLeftColor: "transparent" }}
                    onClick={() => handleInvoiceSortClick("vendor")}
                  >
                    <img
                      loading="lazy"
                      src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/5a259bd11d9f5abd6e662f6fa1e8a2e63fa7a635?placeholderIfAbsent=true"
                      className="w-4 h-4"
                      alt=""
                    />
                    <div className="text-[#525252] font-medium text-base tracking-[-0.32px] leading-[1.4]">
                      Vendor
                    </div>
                    {getInvoiceSortIndicator("vendor") && (
                      <span className="text-xs font-bold text-gray-500">
                        {getInvoiceSortIndicator("vendor")}
                      </span>
                    )}
                  </div>
                  {invoiceItems.map((item) => (
                    <div
                      key={item.id}
                      className={`items-center border-b-[0.5px] flex min-h-14 w-full gap-2.5 px-3 ${
                        showingPendingInsights &&
                        item.status === "Pending Approval"
                          ? "bg-[#F5F3FF] border-[#E5E5FF] border-l-4"
                          : "border-[#DADADA]"
                      }`}
                      style={{
                        borderLeftColor:
                          showingPendingInsights &&
                          item.status === "Pending Approval"
                            ? "#6366F1"
                            : "transparent",
                      }}
                    >
                      <div
                        className="rounded-full shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] border flex min-h-7 w-7 items-center gap-2.5 overflow-hidden justify-center"
                        style={{
                          backgroundColor: item.vendorBg,
                          borderColor: item.vendorBorder,
                        }}
                      >
                        <img
                          loading="lazy"
                          src={item.vendorIcon}
                          className="w-5 h-5"
                          alt=""
                        />
                      </div>
                      <div className="text-[#303030] text-base font-normal leading-[1.4] tracking-[-0.32px] flex-1">
                        {item.vendor}
                      </div>
                    </div>
                  ))}
                </div>

                {/* GL Account Column */}
                <div className="border-r border-[#DADADA] flex flex-col overflow-hidden flex-grow w-[185px]">
                  <div
                    className="items-center border-b-[0.5px] border-[#DADADA] bg-[#FBFBFB] flex w-full gap-2 overflow-hidden px-3 py-3 cursor-pointer hover:bg-gray-200 transition-colors"
                    onClick={() => handleInvoiceSortClick("glAccount")}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#525252"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="4" y1="9" x2="20" y2="9" />
                      <line x1="4" y1="15" x2="20" y2="15" />
                      <line x1="10" y1="3" x2="8" y2="21" />
                      <line x1="16" y1="3" x2="14" y2="21" />
                    </svg>
                    <div className="text-[#525252] font-medium text-base tracking-[-0.32px] leading-[1.4]">
                      GL Account
                    </div>
                    {getInvoiceSortIndicator("glAccount") && (
                      <span className="text-xs font-bold text-gray-500">
                        {getInvoiceSortIndicator("glAccount")}
                      </span>
                    )}
                  </div>
                  {invoiceItems.map((item) => (
                    <div
                      key={item.id}
                      className={`items-center border-b-[0.5px] flex min-h-14 w-full gap-2.5 px-3 ${
                        showingPendingInsights &&
                        item.status === "Pending Approval"
                          ? "bg-[#F5F3FF] border-[#E5E5FF]"
                          : "border-[#DADADA]"
                      }`}
                    >
                      <div className="text-[#303030] text-base font-normal leading-[1.4] tracking-[-0.32px] flex-1">
                        {item.glAccount}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Description Column */}
                <div className="border-r border-[#DADADA] flex flex-col overflow-hidden flex-grow w-[185px]">
                  <div
                    className="items-center border-b-[0.5px] border-[#DADADA] bg-[#FBFBFB] flex w-full gap-2 overflow-hidden px-3 py-3 cursor-pointer hover:bg-gray-200 transition-colors"
                    onClick={() => handleInvoiceSortClick("description")}
                  >
                    <img
                      loading="lazy"
                      src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/525b056852d683baf01ec82ce654e2cf172fd244?placeholderIfAbsent=true"
                      className="w-4 h-4"
                      alt=""
                    />
                    <div className="text-[#525252] font-medium text-base tracking-[-0.32px] leading-[1.4]">
                      Description
                    </div>
                    {getInvoiceSortIndicator("description") && (
                      <span className="text-xs font-bold text-gray-500">
                        {getInvoiceSortIndicator("description")}
                      </span>
                    )}
                  </div>
                  {getSortedInvoiceItems().map((item) => (
                    <div
                      key={item.id}
                      className={`items-center border-b-[0.5px] flex min-h-14 w-full gap-2.5 px-3 ${
                        showingPendingInsights &&
                        item.status === "Pending Approval"
                          ? "bg-[#F5F3FF] border-[#E5E5FF]"
                          : "border-[#DADADA]"
                      }`}
                    >
                      <div className="text-[#303030] text-base font-normal leading-[1.4] tracking-[-0.32px] flex-1">
                        {item.description}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Amount Column */}
                <div className="border-r border-[#DADADA] flex flex-col overflow-hidden flex-grow w-[92px]">
                  <div
                    className="items-center border-b-[0.5px] border-[#DADADA] bg-[#FBFBFB] flex w-full gap-2 px-3 py-3 cursor-pointer hover:bg-gray-200 transition-colors"
                    onClick={() => handleInvoiceSortClick("amount")}
                  >
                    <img
                      loading="lazy"
                      src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/9997108c517c4080bd0f554754253e3ae8b3d5d3?placeholderIfAbsent=true"
                      className="w-4 h-4"
                      alt=""
                    />
                    <div className="text-[#525252] font-medium text-base tracking-[-0.32px] leading-[1.4]">
                      Amount
                    </div>
                    {getInvoiceSortIndicator("amount") && (
                      <span className="text-xs font-bold text-gray-500">
                        {getInvoiceSortIndicator("amount")}
                      </span>
                    )}
                  </div>
                  {getSortedInvoiceItems().map((item) => (
                    <div
                      key={item.id}
                      className={`items-center border-b-[0.5px] flex min-h-14 w-full gap-2.5 px-3 ${
                        showingPendingInsights &&
                        item.status === "Pending Approval"
                          ? "bg-[#F5F3FF] border-[#E5E5FF]"
                          : "border-[#DADADA]"
                      }`}
                    >
                      <div className="text-[#303030] text-base font-normal leading-[1.4] tracking-[-0.32px]">
                        {item.amount}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Source Column */}
                <div className="border-r border-[#DADADA] flex flex-col overflow-hidden flex-grow w-[113px]">
                  <div className="items-center border-b-[0.5px] border-[#DADADA] bg-[#FBFBFB] flex w-full gap-2 px-3 py-3">
                    <img
                      loading="lazy"
                      src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/2c8bf4b168dd5c3a5b85fe86577c355415e8373c?placeholderIfAbsent=true"
                      className="w-4 h-4"
                      alt=""
                    />
                    <div className="text-[#525252] font-medium text-base tracking-[-0.32px] leading-[1.4]">
                      Source
                    </div>
                  </div>
                  {invoiceItems.map((item) => (
                    <div
                      key={item.id}
                      className={`items-center border-b-[0.5px] flex min-h-14 w-full gap-2.5 px-3 ${
                        showingPendingInsights &&
                        item.status === "Pending Approval"
                          ? "bg-[#F5F3FF] border-[#E5E5FF]"
                          : "border-[#DADADA]"
                      }`}
                    >
                      <div className="text-[#303030] text-base font-normal leading-[1.4] tracking-[-0.32px]">
                        {item.source}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Status Column */}
                <div className="border-r border-[#DADADA] flex flex-col overflow-hidden flex-grow w-[140px]">
                  <div className="items-center border-b-[0.5px] border-[#DADADA] bg-[#FBFBFB] flex w-full gap-2 overflow-hidden px-3 py-3">
                    <img
                      loading="lazy"
                      src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/086dc40cd470d2578aa210283649725e87dab9c2?placeholderIfAbsent=true"
                      className="w-4 h-4"
                      alt=""
                    />
                    <div className="text-[#525252] font-medium text-base tracking-[-0.32px] leading-[1.4]">
                      Approval Status
                    </div>
                  </div>
                  {invoiceItems.map((item) => (
                    <div
                      key={item.id}
                      className={`items-center border-b-[0.5px] flex min-h-14 w-full gap-2.5 px-3 ${
                        showingPendingInsights &&
                        item.status === "Pending Approval"
                          ? "bg-[#F5F3FF] border-[#E5E5FF]"
                          : "border-[#DADADA]"
                      }`}
                      style={{ borderRightWidth: "0px" }}
                    >
                      <StatusBadge status={item.status} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions Column */}
              <div className="items-center shadow-[-1px_1px_2px_0_rgba(10,13,18,0.05)] border-l border-[#DADADA] bg-white flex flex-col overflow-visible w-20 relative z-40">
                <div className="items-center border-b-[0.5px] border-[#DADADA] bg-[#FBFBFB] flex w-20 gap-2 overflow-visible px-3 py-3">
                  <div className="text-[#525252] font-medium text-base tracking-[-0.32px] leading-[1.4]">
                    Actions
                  </div>
                </div>
                {invoiceItems.map((item) => {
                  const isFTO = item.source === "FTO Submission";
                  const isVendorImport = item.source === "Vendor-Import";
                  return (
                    <div
                      key={item.id}
                      className={`items-center border-b-[0.5px] flex min-h-14 w-full max-w-20 gap-2.5 px-3 relative ${
                        showingPendingInsights &&
                        item.status === "Pending Approval"
                          ? "bg-[#F5F3FF] border-[#E5E5FF]"
                          : "bg-white border-[#DADADA]"
                      }`}
                    >
                      <ActionButton
                        itemId={`invoice-${item.id}`}
                        openMenuId={openMenuId}
                        setOpenMenuId={setOpenMenuId}
                        isFTO={isFTO}
                        ftoActionLabel={isFTO ? "View FTO" : "View Bill"}
                        onView={() => {
                          if (isFTO) {
                            openViewFTO(item.id);
                            return;
                          }

                          openInvoicePreview({
                            lineItems:
                              buildPreviewLineItemsFromInvoiceItem(item),
                            invoiceDate: currentInvoiceMonth,
                            showCommitButton: true,
                          });
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-white flex w-full px-4 py-4 items-center gap-4 justify-between flex-wrap">
            <div className="flex items-center gap-4">
              <div className="text-[#303030] font-medium text-[22px] leading-[1.09]">
                Subtotal: $
                {invoiceItems
                  .reduce((sum, item) => {
                    const amount =
                      parseFloat(item.amount.replace(/[$,]/g, "")) || 0;
                    return sum + amount;
                  }, 0)
                  .toFixed(0)}
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <button
                type="button"
                onClick={() =>
                  openInvoicePreview({
                    lineItems: invoiceItems.map((item) => ({
                      id: item.id,
                      vendor: item.vendor,
                      description: item.description,
                      amount: item.amount,
                    })),
                    invoiceDate: currentInvoiceMonth,
                    showCommitButton: true,
                  })
                }
                className="flex h-10 items-center gap-2 px-4 rounded-lg border border-white bg-[#013764] hover:bg-[#003a73] transition-colors"
                style={{
                  boxShadow:
                    "0 0 0 1px #002D5A, 0 0 10px -5px rgba(0, 0, 0, 0.20)",
                }}
              >
                <span className="text-white font-medium text-base leading-normal">
                  Preview PDF
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice History */}
      <div className="flex mt-6 w-full flex-col items-center">
        <div className="rounded-xl border border-[#E5E5E5] shadow-[0_1px_2px_0_rgba(10,13,18,0.05)] flex w-full flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-white flex w-full px-4 py-4 items-center gap-4 justify-between flex-wrap">
            <div className="flex items-center gap-4">
              <div className="text-[#303030] font-medium text-[22px] leading-[1.09]">
                Invoice History
              </div>
            </div>
            <div className="flex min-w-60 items-start gap-2.5 flex-wrap">
              <div className="flex min-w-60 min-h-9 gap-2 items-center px-3 rounded-lg border-[0.5px] border-[#DADADA] shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] bg-[#FBFBFB]">
                <img
                  loading="lazy"
                  src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/b47ca0b4fcf9eb132889213ca1e6a92de1087150?placeholderIfAbsent=true"
                  className="w-5 h-5"
                  alt=""
                />
                <input
                  type="text"
                  placeholder="Search..."
                  className="bg-transparent border-none outline-none text-[#303030] font-normal text-base leading-[1.4] tracking-[-0.32px]"
                />
              </div>
              <div className="rounded-lg bg-[#FBFBFB] shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] border border-[#DADADA] flex min-h-9 px-3 py-1.5 items-center gap-2 cursor-pointer hover:bg-gray-100">
                <div className="text-[#303030] font-normal text-base leading-[1.4] tracking-[-0.32px]">
                  Filter
                </div>
                <img
                  loading="lazy"
                  src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/81afa4c88f6177ebdc84321a1f0691342b9fcd92?placeholderIfAbsent=true"
                  className="w-[18px] h-[18px]"
                  alt=""
                />
              </div>
            </div>
          </div>

          {/* Table */}
          <div
            className="border-[0.5px] border-[#DADADA] shadow-[0_1px_2px_0_rgba(10,13,18,0.05)] bg-white flex w-full flex-col overflow-visible"
            style={{
              borderLeftWidth: "0px",
              borderBottomWidth: "0px",
              borderRightWidth: "0px",
            }}
          >
            <div
              className="flex w-full items-center flex-wrap"
              style={{ borderLeftColor: "transparent" }}
            >
              <div
                className="flex min-w-60 items-center flex-wrap flex-1"
                style={{ borderLeftColor: "transparent" }}
              >
                {/* Date Created Column */}
                <div className="border-r border-[#DADADA] flex min-w-60 flex-col overflow-hidden flex-1">
                  <div className="items-center border-b-[0.5px] border-[#DADADA] bg-[#FBFBFB] flex w-full gap-2 overflow-hidden px-3 py-3">
                    <img
                      loading="lazy"
                      src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/d2b8afe9755fcab34886841ccd885dc23566b8a6?placeholderIfAbsent=true"
                      className="w-4 h-4"
                      alt=""
                    />
                    <div className="text-[#525252] font-medium text-base tracking-[-0.32px] leading-[1.4]">
                      Date Created
                    </div>
                  </div>
                  {paginatedHistory.map((item) => (
                    <div
                      key={item.id}
                      className="items-center border-b-[0.5px] border-[#DADADA] flex min-h-14 w-full gap-2.5 px-3 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() =>
                        openInvoicePreview({
                          lineItems: buildPreviewLineItemsFromHistoryItem(item),
                          invoiceDate: item.invoiceMonth,
                          showCommitButton: false,
                        })
                      }
                    >
                      <div className="text-[#303030] text-base font-normal leading-[1.4] tracking-[-0.32px] flex-1">
                        {item.dateCreated}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Invoice Month Column */}
                <div
                  className="border-r border-[#DADADA] flex min-w-60 flex-col overflow-hidden flex-1"
                  style={{ borderLeftColor: "transparent" }}
                >
                  <div
                    className="items-center border-b-[0.5px] border-[#DADADA] bg-[#FBFBFB] flex w-full gap-2 overflow-hidden px-3 py-3"
                    style={{ borderLeftColor: "transparent" }}
                  >
                    <img
                      loading="lazy"
                      src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/d2b8afe9755fcab34886841ccd885dc23566b8a6?placeholderIfAbsent=true"
                      className="w-4 h-4"
                      alt=""
                    />
                    <div className="text-[#525252] font-medium text-base tracking-[-0.32px] leading-[1.4]">
                      Invoice Month
                    </div>
                  </div>
                  {paginatedHistory.map((item) => (
                    <div
                      key={item.id}
                      className="items-center border-b-[0.5px] border-[#DADADA] flex min-h-14 w-full gap-2.5 px-3 cursor-pointer hover:bg-gray-50 transition-colors"
                      style={{ borderLeftColor: "transparent" }}
                      onClick={() =>
                        openInvoicePreview({
                          lineItems: buildPreviewLineItemsFromHistoryItem(item),
                          invoiceDate: item.invoiceMonth,
                          showCommitButton: false,
                        })
                      }
                    >
                      <div className="text-[#303030] text-base font-normal leading-[1.4] tracking-[-0.32px] flex-1">
                        {item.invoiceMonth}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Amount Column */}
                <div
                  className="border-r border-[#DADADA] flex min-w-60 flex-col overflow-hidden flex-1"
                  style={{ borderLeftColor: "transparent" }}
                >
                  <div
                    className="items-center border-b-[0.5px] border-[#DADADA] bg-[#FBFBFB] flex w-full gap-2 overflow-hidden px-3 py-3"
                    style={{ borderLeftColor: "transparent" }}
                  >
                    <img
                      loading="lazy"
                      src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/9997108c517c4080bd0f554754253e3ae8b3d5d3?placeholderIfAbsent=true"
                      className="w-4 h-4"
                      alt=""
                    />
                    <div className="text-[#525252] font-medium text-base tracking-[-0.32px] leading-[1.4]">
                      Amount
                    </div>
                  </div>
                  {paginatedHistory.map((item) => (
                    <div
                      key={item.id}
                      className="items-center border-b-[0.5px] border-[#DADADA] flex min-h-14 w-full gap-2 px-3 cursor-pointer hover:bg-gray-50 transition-colors"
                      style={{ borderLeftColor: "transparent" }}
                      onClick={() =>
                        openInvoicePreview({
                          lineItems: buildPreviewLineItemsFromHistoryItem(item),
                          invoiceDate: item.invoiceMonth,
                          showCommitButton: false,
                        })
                      }
                    >
                      <div className="text-[#303030] text-base font-normal leading-[1.4] tracking-[-0.32px]">
                        {item.amount}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions Column */}
              <div className="items-center shadow-[-1px_1px_2px_0_rgba(10,13,18,0.05)] border-l border-[#DADADA] bg-white flex flex-col overflow-visible w-20 relative">
                <div className="items-center border-b-[0.5px] border-[#DADADA] bg-[#FBFBFB] flex w-20 gap-2 overflow-hidden px-3 py-3">
                  <div className="text-[#525252] font-medium text-base tracking-[-0.32px] leading-[1.4]">
                    Actions
                  </div>
                </div>
                {paginatedHistory.map((item) => (
                  <div
                    key={item.id}
                    className="items-center border-b-[0.5px] border-[#DADADA] flex min-h-14 w-full max-w-20 gap-2.5 px-3 relative"
                  >
                    <ActionButton
                      itemId={`history-${item.id}`}
                      openMenuId={openMenuId}
                      setOpenMenuId={setOpenMenuId}
                      onView={() =>
                        openInvoicePreview({
                          lineItems: buildPreviewLineItemsFromHistoryItem(item),
                          invoiceDate: item.invoiceMonth,
                          showCommitButton: false,
                        })
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between w-full gap-4 flex-wrap px-6 py-4">
            <div className="flex items-center gap-2">
              <div className="text-[#525252] text-base font-medium">
                Showing
              </div>
              <button
                ref={dropdownButtonRef}
                onClick={() => setShowPageSizeDropdown(!showPageSizeDropdown)}
                className="rounded-lg bg-[#FBFBFB] shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] border border-[#DADADA] flex min-h-10 px-3 py-2.5 items-center gap-2 cursor-pointer hover:bg-gray-100"
              >
                <div className="text-[#0A0A0A] text-base font-medium">
                  {itemsPerPage}
                </div>
                <img
                  loading="lazy"
                  src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/cc5507ba17118962f81e4f61a415adb6e3ee75ee?placeholderIfAbsent=true"
                  className="w-[18px] h-[18px]"
                  alt=""
                />
              </button>
              <div className="text-[#525252] text-base font-medium">
                of {totalInvoices}
              </div>
            </div>
            <div className="rounded-lg bg-[#FBFBFB] shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] border border-[#DADADA] flex min-w-60 min-h-10 items-center overflow-hidden flex-wrap justify-center">
              <div
                className="flex items-center justify-center gap-1.5 min-h-10 px-3.5 py-2 border-r border-[#E5E5E5] bg-white cursor-pointer hover:bg-gray-50"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              >
                <img
                  loading="lazy"
                  src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/dc8342cc7d9ed7372ff27293ef7c08e463e9fba7?placeholderIfAbsent=true"
                  className="w-5 h-5"
                  alt=""
                />
                <div className="text-[#525252] text-base font-medium">
                  Previous
                </div>
              </div>
              {getPaginationNumbers().map((page, idx) => {
                if (page === "...") {
                  return (
                    <div
                      key={`ellipsis-${idx}`}
                      className="flex items-center justify-center min-h-10 min-w-10 px-2 gap-2 border-r border-[#E5E5E5] bg-white"
                    >
                      <div className="text-[#A3A3A3] text-base font-medium">
                        ...
                      </div>
                    </div>
                  );
                }
                return (
                  <div
                    key={page}
                    className={`flex items-center justify-center min-h-10 min-w-10 px-2 gap-2 border-r border-[#E5E5E5] cursor-pointer hover:bg-gray-50 ${
                      currentPage === page ? "bg-white" : "bg-white"
                    }`}
                    onClick={() => setCurrentPage(page as number)}
                  >
                    <div
                      className={`text-base font-medium ${currentPage === page ? "text-[#0A0A0A]" : "text-[#A3A3A3]"}`}
                    >
                      {page}
                    </div>
                  </div>
                );
              })}
              <div
                className="flex items-center justify-center gap-1.5 min-h-10 px-4 py-2 border-r border-[#E5E5E5] bg-white cursor-pointer hover:bg-gray-50"
                onClick={() =>
                  setCurrentPage(Math.min(totalPages, currentPage + 1))
                }
              >
                <div className="text-[#525252] text-base font-medium">Next</div>
                <img
                  loading="lazy"
                  src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/34c281f37936da4ccce4bfe5d47937be9d7ed9c7?placeholderIfAbsent=true"
                  className="w-5 h-5"
                  alt=""
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Page Size Dropdown Menu - Rendered via Portal */}
      {showPageSizeDropdown &&
        createPortal(
          <div
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
                className={`w-full px-4 py-3 text-center text-base transition-colors whitespace-nowrap ${
                  itemsPerPage === size
                    ? "bg-gray-50 font-medium text-gray-900"
                    : "text-[#303030] hover:bg-gray-50"
                }`}
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

      {/* Invoice Preview Modal */}
      <InvoicePreviewModal
        open={showInvoicePreview}
        onOpenChange={setShowInvoicePreview}
        propertyAddress={propertyAddress}
        propertyLocation={propertyLocation || ""}
        billTo="Jason Pascal"
        rentalOwner="Eunice Bae"
        invoiceDate={invoicePreviewInvoiceDate || currentInvoiceMonth}
        lineItems={
          invoicePreviewLineItems.length > 0
            ? invoicePreviewLineItems
            : invoiceItems.map((item) => ({
                id: item.id,
                vendor: item.vendor,
                description: item.description,
                amount: item.amount,
              }))
        }
        showCommitButton={invoicePreviewShowCommitButton}
        onCommit={handleCommitInvoice}
        pendingUnapprovedCount={pendingApprovalBills.length}
      />

      {showAddAdditionalBillsModal && (
        <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-[560px] rounded-xl bg-white shadow-lg border border-[#E5E5E5]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E5E5]">
              <div className="text-[#303030] font-medium text-lg">
                Add additional bills
              </div>
              <button
                type="button"
                onClick={() => setShowAddAdditionalBillsModal(false)}
                className="h-9 w-9 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center"
                aria-label="Close"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M18 6L6 18"
                    stroke="#525252"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M6 6L18 18"
                    stroke="#525252"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>

            <div className="px-6 py-5 grid gap-5">
              <div className="grid gap-2">
                <div className="text-sm font-medium text-[#303030]">
                  All bills
                </div>
                <Select
                  value={selectedAdditionalBillId}
                  onValueChange={(value) => {
                    setSelectedAdditionalBillId(value);
                    setSelectedAdditionalFtoId("");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a bill" />
                  </SelectTrigger>
                  <SelectContent>
                    {invoiceItems
                      .filter((item) => item.source !== "FTO Submission")
                      .map((item) => (
                        <SelectItem key={item.id} value={String(item.id)}>
                          {item.vendor} — {item.description} ({item.amount})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <div className="text-sm font-medium text-[#303030]">
                  All FTO orders
                </div>
                <Select
                  value={selectedAdditionalFtoId}
                  onValueChange={(value) => {
                    setSelectedAdditionalFtoId(value);
                    setSelectedAdditionalBillId("");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an FTO order" />
                  </SelectTrigger>
                  <SelectContent>
                    {invoiceItems
                      .filter((item) => item.source === "FTO Submission")
                      .map((item) => (
                        <SelectItem key={item.id} value={String(item.id)}>
                          {item.vendor} — {item.description} ({item.amount})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-[#E5E5E5] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddAdditionalBillsModal(false)}
                className="flex h-9 justify-center items-center gap-2 px-4 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <span className="text-[#303030] font-normal text-base capitalize">
                  Cancel
                </span>
              </button>
              <button
                type="button"
                onClick={handleAddAdditionalToInvoice}
                disabled={!selectedAdditionalBillId && !selectedAdditionalFtoId}
                className="flex h-9 items-center gap-2 px-4 rounded-lg border border-white bg-[#013764] shadow-[0_0_0_1px_#002D5A,0_0_10px_-5px_rgba(0,0,0,0.2)] hover:bg-[#003a73] transition-colors disabled:opacity-50 disabled:pointer-events-none"
              >
                <span className="text-white font-medium text-base">
                  Add to invoice
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      <FTOApprovalModal
        open={showFTOApprovalModal}
        onOpenChange={(open) => {
          setShowFTOApprovalModal(open);
          if (!open) setSelectedFTOId(null);
        }}
        selectedFTOId={selectedFTOId}
        property={propertyAddress}
        unit="N/A"
        fieldTeamAssignee="Field Team"
      />
    </div>
  );
};
