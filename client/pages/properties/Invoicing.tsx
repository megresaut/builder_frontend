import { useState, ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { StatusBadge } from "@/components/StatusBadge";
import { useSortingTable } from "@/hooks/useSortingTable";
import { useColumnManagement } from "@/hooks/useColumnManagement";
import ColumnFilterModal from "@/components/ColumnFilterModal";
import GlobalTable from "@/components/GlobalTable";
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
import RecordBillModal, {
  type RecordBillModalData,
  type RecordBillModalMode,
} from "@/components/RecordBillModal";

interface InvoicingProps {
  propertyAddress: string;
  propertyType: string;
  propertyUnits: number;
  propertyLocation?: string;
}


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
  const [invoiceOpenMenuId, setInvoiceOpenMenuId] = useState<
    string | number | null
  >(null);
  const [historyOpenMenuId, setHistoryOpenMenuId] = useState<
    string | number | null
  >(null);
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);
  const [invoicePreviewLineItems, setInvoicePreviewLineItems] = useState<
    InvoiceLineItem[]
  >([]);
  const [invoicePreviewInvoiceDate, setInvoicePreviewInvoiceDate] =
    useState<string>("");
  const [invoicePreviewShowCommitButton, setInvoicePreviewShowCommitButton] =
    useState(false);
  const [recordBillModalOpen, setRecordBillModalOpen] = useState(false);
  const [recordBillModalMode, setRecordBillModalMode] =
    useState<RecordBillModalMode>("view");
  const [recordBillModalData, setRecordBillModalData] = useState<
    RecordBillModalData | undefined
  >(undefined);
  const [showFTOApprovalModal, setShowFTOApprovalModal] = useState(false);
  const [selectedFTOId, setSelectedFTOId] = useState<number | null>(null);
  const [showAddAdditionalBillsModal, setShowAddAdditionalBillsModal] =
    useState(false);
  const [selectedAdditionalBillId, setSelectedAdditionalBillId] =
    useState<string>("");
  const [selectedAdditionalFtoId, setSelectedAdditionalFtoId] =
    useState<string>("");
  const [showingPendingInsights, setShowingPendingInsights] = useState(false);

  // Column management for Invoice Items table
  const invoiceColumnsManagement = useColumnManagement([
    "vendor",
    "glAccount",
    "description",
    "amount",
    "source",
    "status",
  ]);

  // Column management for Invoice History table
  const historyColumnsManagement = useColumnManagement([
    "dateCreated",
    "invoiceMonth",
    "amount",
  ]);

  const invoicingColumnConfig: Record<
    string,
    { label: string; icon: ReactNode | null }
  > = {
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
    glAccount: {
      label: "GL Account",
      icon: (
        <img
          loading="lazy"
          src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/049b679c03670a4d1cf3028269ec92ee2c8cc8e3?placeholderIfAbsent=true"
          style={{ width: "16px", height: "16px" }}
          alt=""
        />
      ),
    },
    description: {
      label: "Description",
      icon: (
        <img
          loading="lazy"
          src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/d5d01db2db718e32f4e620e7b1fc6ea705e115b1?placeholderIfAbsent=true"
          style={{ width: "16px", height: "16px" }}
          alt=""
        />
      ),
    },
    amount: {
      label: "Amount",
      icon: (
        <img
          loading="lazy"
          src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/3b8ec0fa6eb0ec8e711c3a23fefa8083d72c2a94?placeholderIfAbsent=true"
          style={{ width: "16px", height: "16px" }}
          alt=""
        />
      ),
    },
    source: {
      label: "Source",
      icon: (
        <img
          loading="lazy"
          src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/225d3e057a8e01f2536a35172298a3ee7a373378?placeholderIfAbsent=true"
          style={{ width: "16px", height: "16px" }}
          alt=""
        />
      ),
    },
    status: {
      label: "Approval Status",
      icon: (
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            cx="8"
            cy="8"
            r="5.5"
            stroke="#525252"
            strokeWidth="1.2"
            fill="none"
          />
          <path
            d="M6 8l1.5 1.5L10 6.5"
            stroke="#525252"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    dateCreated: {
      label: "Date Created",
      icon: (
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect
            x="2"
            y="3"
            width="12"
            height="11"
            rx="1"
            stroke="#525252"
            strokeWidth="1.2"
            fill="none"
          />
          <path
            d="M5 1v4M11 1v4"
            stroke="#525252"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          <line
            x1="2"
            y1="6"
            x2="14"
            y2="6"
            stroke="#525252"
            strokeWidth="1.2"
          />
        </svg>
      ),
    },
    invoiceMonth: {
      label: "Invoice Month",
      icon: (
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect
            x="2"
            y="3"
            width="12"
            height="11"
            rx="1"
            stroke="#525252"
            strokeWidth="1.2"
            fill="none"
          />
          <path
            d="M5 1v4M11 1v4"
            stroke="#525252"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          <line
            x1="2"
            y1="6"
            x2="14"
            y2="6"
            stroke="#525252"
            strokeWidth="1.2"
          />
        </svg>
      ),
    },
  };

  const invoiceTableColumns = invoiceColumnsManagement.columnOrder.map((key) => ({
    key,
    label: invoicingColumnConfig[key]?.label ?? key,
    icon: invoicingColumnConfig[key]?.icon ?? null,
  }));

  const historyTableColumns = historyColumnsManagement.columnOrder.map((key) => ({
    key,
    label: invoicingColumnConfig[key]?.label ?? key,
    icon: invoicingColumnConfig[key]?.icon ?? null,
  }));

  const handleHistoryItemsPerPageChange = (nextPageSize: number) => {
    setItemsPerPage(nextPageSize);
    setCurrentPage(1);
  };

  const noopPageChange = (_page: number) => {};
  const noopItemsPerPageChange = (_itemsPerPage: number) => {};

  const getInvoiceItemRowClassName = (item: any) => {
    const isHighlighted =
      showingPendingInsights && item?.status === "Pending Approval";

    return isHighlighted ? "h-14 bg-[#F5F3FF] border-[#E5E5FF]" : "h-14";
  };

  const getInvoiceItemCellClassName = (item: any, columnKey: string) => {
    const isHighlighted =
      showingPendingInsights && item?.status === "Pending Approval";

    if (!isHighlighted) return "";

    const base = "border-[#E5E5FF]";
    if (columnKey === "vendor") {
      return `${base} border-l-4 border-l-[#6366F1] pl-2`;
    }

    return base;
  };

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

  const { handleSortClick: handleInvoiceSortClick, getSortIndicator: getInvoiceSortIndicator, getSortedData: getSortedInvoiceItems } = useSortingTable(invoiceItems, "invoiceItems");
  const { handleSortClick: handleHistorySortClick, getSortIndicator: getHistorySortIndicator, getSortedData: getSortedHistoryItems } = useSortingTable(invoiceHistory, "invoiceHistory");

  const toIsoDateTime = (date: Date) => date.toISOString();

  const toDateInputValue = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const parseCurrencyToNumber = (value: string): number => {
    const parsed = parseFloat(value.replace(/[^\d.]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const buildRecordBillModalDataFromInvoiceItem = (
    item: InvoiceItem,
  ): RecordBillModalData => {
    const today = new Date();
    const due = new Date(today);
    due.setDate(due.getDate() + 30);

    const subtotal = parseCurrencyToNumber(item.amount);

    return {
      vendor: item.vendor,
      invoiceNumber: `INV-${String(item.id).padStart(4, "0")}`,
      invoiceDate: toDateInputValue(today),
      dueDate: toDateInputValue(due),
      memo: item.description,
      lineItems: [
        {
          id: 1,
          property: propertyAddress,
          unit: "N/A",
          workOrder: "N/A",
          description: item.description,
          glAccount: item.glAccount,
          reimbursement: false,
          subtotal,
          upcharge: 0,
          total: subtotal,
        },
      ],
    };
  };

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

    navigate(`${basePath}?readOnly=true`);
  };

  const openEditBill = (bill: ViewBillState) => {
    const basePath = propertyId
      ? `/property/${propertyId}/bills/record`
      : "/bills/record";

    navigate(basePath);
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
  const paginatedHistory = getSortedHistoryItems().slice(
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
              <div className="flex min-w-60 min-h-9 gap-2 items-center px-3 rounded-lg border-[0.5px] border-[#e5e5e5] shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] bg-[#FBFBFB]">
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
                ref={invoiceColumnsManagement.columnButtonRef}
                onClick={() =>
                  invoiceColumnsManagement.setShowColumnModal((prev) => !prev)
                }
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#DADADA] bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] hover:bg-gray-50 transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="8" cy="3" r="1.5" fill="#303030"/>
                  <circle cx="8" cy="8" r="1.5" fill="#303030"/>
                  <circle cx="8" cy="13" r="1.5" fill="#303030"/>
                </svg>
              </button>
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

          <ColumnFilterModal
            isOpen={invoiceColumnsManagement.showColumnModal}
            position={invoiceColumnsManagement.columnMenuPos}
            columns={invoiceTableColumns}
            visibleColumns={invoiceColumnsManagement.visibleColumns}
            onToggleColumn={invoiceColumnsManagement.toggleColumnVisibility}
            onClose={() => invoiceColumnsManagement.setShowColumnModal(false)}
            buttonRef={invoiceColumnsManagement.columnButtonRef}
          />

          {/* Table */}
          <GlobalTable
            className="border-0 rounded-none"
            columns={invoiceTableColumns}
            data={invoiceItems}
            rowKey="id"
            actions={[
              {
                label: (item: any) =>
                  item?.source === "FTO Submission" ? "View FTO" : "View Bill",
                icon: (
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
                ),
                onClick: (item: any) => {
                  const isFTO = item?.source === "FTO Submission";
                  if (isFTO) {
                    openViewFTO(item.id);
                    return;
                  }

                  const data = buildRecordBillModalDataFromInvoiceItem(item);
                  if (item?.status === "Approved") {
                    setRecordBillModalMode("view");
                    setRecordBillModalData(data);
                    setRecordBillModalOpen(true);
                    return;
                  }

                  setRecordBillModalMode("create");
                  setRecordBillModalData(data);
                  setRecordBillModalOpen(true);
                },
              },
            ]}
            renderCell={(item: any, columnKey: string) => {
              switch (columnKey) {
                case "vendor":
                  return (
                    <div className="flex items-center gap-2.5 whitespace-nowrap">
                      <div
                        className="rounded-full shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] border flex min-h-7 w-7 items-center gap-2.5 overflow-hidden justify-center flex-shrink-0"
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
                      <div className="text-[#303030] text-sm font-normal leading-[1.4] tracking-[-0.32px] truncate">
                        {item.vendor}
                      </div>
                    </div>
                  );
                case "status":
                  return <StatusBadge status={item.status} />;
                case "glAccount":
                case "description":
                case "amount":
                case "source":
                  return (
                    <div className="text-[#303030] text-sm font-normal leading-[1.4] tracking-[-0.32px] whitespace-nowrap truncate">
                      {item[columnKey]}
                    </div>
                  );
                default:
                  return null;
              }
            }}
            sortingHook={{
              handleSortClick: handleInvoiceSortClick,
              getSortIndicator: getInvoiceSortIndicator,
              getSortedData: getSortedInvoiceItems,
            }}
            columnManagementHook={invoiceColumnsManagement}
            currentPage={1}
            onPageChange={noopPageChange}
            itemsPerPage={invoiceItems.length || 10}
            onItemsPerPageChange={noopItemsPerPageChange}
            openMenuId={invoiceOpenMenuId}
            onOpenMenuIdChange={setInvoiceOpenMenuId}
            showColumnModal={invoiceColumnsManagement.showColumnModal}
            onShowColumnModalChange={invoiceColumnsManagement.setShowColumnModal}
            showPagination={false}
            getRowClassName={getInvoiceItemRowClassName}
            getCellClassName={getInvoiceItemCellClassName}
          />

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
              <div className="flex min-w-60 min-h-9 gap-2 items-center px-3 rounded-lg border-[0.5px] border-[#e5e5e5] shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] bg-[#FBFBFB]">
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
              <div className="rounded-lg bg-[#FBFBFB] shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] border border-[#e5e5e5] flex min-h-9 px-3 py-1.5 items-center gap-2 cursor-pointer hover:bg-gray-100">
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
              <button
                ref={historyColumnsManagement.columnButtonRef}
                onClick={() =>
                  historyColumnsManagement.setShowColumnModal((prev) => !prev)
                }
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#DADADA] bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] hover:bg-gray-50 transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="8" cy="3" r="1.5" fill="#303030"/>
                  <circle cx="8" cy="8" r="1.5" fill="#303030"/>
                  <circle cx="8" cy="13" r="1.5" fill="#303030"/>
                </svg>
              </button>
            </div>
          </div>

          <ColumnFilterModal
            isOpen={historyColumnsManagement.showColumnModal}
            position={historyColumnsManagement.columnMenuPos}
            columns={historyTableColumns}
            visibleColumns={historyColumnsManagement.visibleColumns}
            onToggleColumn={historyColumnsManagement.toggleColumnVisibility}
            onClose={() => historyColumnsManagement.setShowColumnModal(false)}
            buttonRef={historyColumnsManagement.columnButtonRef}
          />

          {/* Table */}
          <GlobalTable
            className="border-0 rounded-none"
            columns={historyTableColumns}
            data={invoiceHistory}
            rowKey="id"
            actions={[
              {
                label: "View PDF",
                icon: (
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
                ),
                onClick: (item: any) => {
                  openInvoicePreview({
                    lineItems: buildPreviewLineItemsFromHistoryItem(item),
                    invoiceDate: item.invoiceMonth,
                    showCommitButton: false,
                  });
                },
              },
            ]}
            renderCell={(item: any, columnKey: string) => {
              switch (columnKey) {
                case "dateCreated":
                case "invoiceMonth":
                case "amount":
                  return (
                    <div className="text-[#303030] text-sm font-normal leading-[1.4] tracking-[-0.32px] whitespace-nowrap truncate">
                      {item[columnKey]}
                    </div>
                  );
                default:
                  return null;
              }
            }}
            sortingHook={{
              handleSortClick: handleHistorySortClick,
              getSortIndicator: getHistorySortIndicator,
              getSortedData: getSortedHistoryItems,
            }}
            columnManagementHook={historyColumnsManagement}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={handleHistoryItemsPerPageChange}
            openMenuId={historyOpenMenuId}
            onOpenMenuIdChange={setHistoryOpenMenuId}
            showColumnModal={historyColumnsManagement.showColumnModal}
            onShowColumnModalChange={historyColumnsManagement.setShowColumnModal}
            showPagination={true}
            onRowClick={(item: any) => {
              openInvoicePreview({
                lineItems: buildPreviewLineItemsFromHistoryItem(item),
                invoiceDate: item.invoiceMonth,
                showCommitButton: false,
              });
            }}
            getRowClassName={() => "h-14"}
          />
        </div>
      </div>


      <RecordBillModal
        open={recordBillModalOpen}
        onOpenChange={setRecordBillModalOpen}
        mode={recordBillModalMode}
        data={recordBillModalData}
      />

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
