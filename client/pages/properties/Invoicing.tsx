import { useState, useMemo, ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect } from "react";
import { StatusBadge } from "@/components/StatusBadge";
import { useSortingTable } from "@/hooks/useSortingTable";
import { useColumnManagement } from "@/hooks/useColumnManagement";
import ColumnFilterModal from "@/components/ColumnFilterModal";
import GlobalTable from "../../components/GlobalTable";
import BlueButton from "@/components/BlueButton";
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
  type InvoiceLifecycleStatus,
} from "@/components/InvoicePreviewModal";
import { disputeInvoiceLine } from "@/data/invoices";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import RecordPaymentDialog from "@/components/RecordPaymentDialog";
import RecordBillModal, {
  type RecordBillModalData,
  type RecordBillModalMode,
} from "@/components/RecordBillModal";
import { API_BASE, fetchJSON, authFetch } from "@/api/fetchJSON";
import { toast } from "sonner";
import { openAuthPdf } from "@/api/openAuthPdf";
import { UNIT_EMPTY_DISPLAY } from "@/utils/unitLabel";

import glAccounts from "@/data/gl_accounts.json";  

type GLAccount = {
  Id: string;
  Name: string;
};

interface LocationGroupsResponse {
  has_locations: boolean;
  groups: Array<{
    location_name: string;
    line_item_ids: number[];
  }>;
}

const GL_ACCOUNT_MAP: Record<string, string> = Object.fromEntries(
  (glAccounts as GLAccount[]).map((acc) => [acc.Id, acc.Name])
);

function getGlAccountName(glAccountId?: string): string {
  if (!glAccountId) return "—";
  return GL_ACCOUNT_MAP[glAccountId] ?? `Unknown (${glAccountId})`;
}

interface InvoicingProps {
  propertyAddress: string;
  propertyType: string;
  propertyUnits: number;
  propertyLocation?: string;
}


interface InvoiceHistoryApiItem {
  id: number;
  created_at: string;
  total_amount: number;
  pdf_object_key: string;
  pdf_sha256: string;
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



type VendorAvatar = {
  icon: string;
  bg: string;
  border: string;
};

const VENDOR_AVATARS: Record<string, VendorAvatar> = {
  // Vendors
  "RG White Painting LLC": {
    icon: "https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/9ffc2d13a49e4caa7244ce9895eba63cc87e5390",
    bg: "#FFF0EF",
    border: "rgba(188, 66, 62, 0.22)",
  },

  "Elite HVAC": {
    icon: "https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/c163c3bcaa194a5f948a36680b0501ecd8569640",
    bg: "#DBE9FE",
    border: "rgba(36, 99, 235, 0.22)",
  },

  "ABC Plumbing": {
    icon: "https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/6a406e4d9d31a0d96e167fc376208ee79f53def5",
    bg: "#FEFCDB",
    border: "rgba(235, 165, 36, 0.22)",
  },

  "ConEd Electric": {
    icon: "https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/9ffc2d13a49e4caa7244ce9895eba63cc87e5390",
    bg: "#E0F2FE",
    border: "rgba(2, 132, 199, 0.22)",
  },

  // Fallback
  DEFAULT: {
    icon: "https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/1bf3b3df8026becac5b0f8006e63c3cb79df6594",
    bg: "#F3F4F6",
    border: "#E5E7EB",
  },
};

function getVendorAvatar(vendorName: string): VendorAvatar {
  return (
    VENDOR_AVATARS[vendorName] ??
    VENDOR_AVATARS.DEFAULT
  );
}


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
    "paymentStatus",
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
    paymentStatus: {
      label: "Payment",
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
            y="4"
            width="12"
            height="8"
            rx="1"
            stroke="#525252"
            strokeWidth="1.2"
            fill="none"
          />
          <line
            x1="2"
            y1="7"
            x2="14"
            y2="7"
            stroke="#525252"
            strokeWidth="1.2"
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
    sourceId?: number; // submission ID for FTO items
    sourceType?: string; // raw backend source_type — drives void base/markup pairing
    status: InvoiceItemStatus;
    statusColor: string;
    statusBg: string;
    paymentStatus: string; // backend payment_status: paid | unpaid | billed_by_invoice | unknown
    billDate?: string | null;
    billInvoiceNumber?: string | null;
    // FTO-hours metadata — populated only for source_type="fto_hours" lines.
    unitPrice?: number | null;
    quantity?: number | null;
    managerCount?: number | null;
    travelChargeCents?: number | null;
  }


  const [invoiceItems, setInvoiceItems] =
  useState<InvoiceItem[]>([]);


  const VENDOR_PRESETS = {
    vendor: {
      vendorIcon:
        "https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/9ffc2d13a49e4caa7244ce9895eba63cc87e5390?placeholderIfAbsent=true",
      vendorBg: "#FFF0EF",
      vendorBorder: "rgba(188, 66, 62, 0.22)",
    },
    utility: {
      vendorIcon:
        "https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/c163c3bcaa194a5f948a36680b0501ecd8569640?placeholderIfAbsent=true",
      vendorBg: "#E0F2FE",
      vendorBorder: "rgba(2, 132, 199, 0.22)",
    },
    fto: {
      vendorIcon:
        "https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/6a406e4d9d31a0d96e167fc376208ee79f53def5?placeholderIfAbsent=true",
      vendorBg: "#FEFCDB",
      vendorBorder: "rgba(235, 165, 36, 0.22)",
    },
    manual: {
      vendorIcon:
        "https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/9ffc2d13a49e4caa7244ce9895eba63cc87e5390?placeholderIfAbsent=true",
      vendorBg: "#DBE9FE",
      vendorBorder: "rgba(36, 99, 235, 0.22)",
    },
  };

  const [generateInvoiceError, setGenerateInvoiceError] = useState<string | null>(null);

  
  const mapApiLineItemToInvoiceItem = (li: any): InvoiceItem => {
    let preset = VENDOR_PRESETS.vendor;
  
    if (li.source === "Utility-Import") preset = VENDOR_PRESETS.utility;
    else if (li.source === "FTO Submission") preset = VENDOR_PRESETS.fto;
    else if (li.source === "Manual") preset = VENDOR_PRESETS.manual;
  
    const approved = li.status === "approved";
  
    return {
      id: li.id,
      vendor: li.vendor_name || "—",
      vendorIcon: preset.vendorIcon,
      vendorBg: preset.vendorBg,
      vendorBorder: preset.vendorBorder,
      glAccount: li.gl_account_id || "—",
      description: li.description || "",
      amount: `$${Number(li.amount || 0).toFixed(2)}`,
      source: li.source,
      status: approved ? "Approved" : "Pending Approval",
      statusColor: approved ? "#059669" : "#D97706",
      statusBg: approved ? "#D1FAE5" : "#FEF3C7",
      paymentStatus: li.payment_status || "unknown",
    };
  };
  
  interface InvoiceHistoryItem {
    id: number;
    dateCreated: string;
    invoiceMonth: string;
    amount: string;
    lineItems: InvoiceLineItem[];
    pdfObjectKey: string;
  }

  const [currentInvoiceId, setCurrentInvoiceId] = useState<number | null>(null);
  const [currentInvoiceStatus, setCurrentInvoiceStatus] =
    useState<InvoiceLifecycleStatus>(undefined);
  const [unpaidPassthroughCount, setUnpaidPassthroughCount] = useState(0);
  const [currentInvoiceTotalCents, setCurrentInvoiceTotalCents] = useState(0);
  const [currentInvoicePaymentCents, setCurrentInvoicePaymentCents] = useState(0);
  // Overpayment / dispute credit rolled over from a PREVIOUS invoice and
  // applied to this one — distinct from currentInvoicePaymentCents (money
  // paid directly on this invoice, used for the void/dispute unpaid check).
  const [currentInvoiceRolloverPaymentCents, setCurrentInvoiceRolloverPaymentCents] = useState(0);
  const [currentInvoiceDisputeCreditCents, setCurrentInvoiceDisputeCreditCents] = useState(0);
  // Dispute-confirm dialog: the InvoiceItem being disputed (null = closed).
  const [voidTargetLine, setVoidTargetLine] = useState<InvoiceItem | null>(null);
  const [voidReason, setVoidReason] = useState("");
  const [voiding, setVoiding] = useState(false);
  // How much of the line is being credited to the client, and how much of
  // that AVM expects to recover from the vendor. Defaulted to the full line
  // amount / $0 when the dialog opens; editable for partial disputes.
  const [disputeClientCreditCents, setDisputeClientCreditCents] = useState(0);
  const [disputeVendorCreditCents, setDisputeVendorCreditCents] = useState(0);
  // Raw text the user is actively typing into the two amount fields above —
  // decoupled from the calculated/clamped cents value so the input isn't
  // reformatted to "X.00" (and cursor/typing reset) on every keystroke.
  // null = not being edited right now, so show the canonical formatted value.
  const [disputeClientCreditDraft, setDisputeClientCreditDraft] = useState<
    string | null
  >(null);
  const [disputeVendorCreditDraft, setDisputeVendorCreditDraft] = useState<
    string | null
  >(null);
  // After voiding on an issued invoice, the preview modal opens in this mode to
  // regenerate + re-attach the corrected PDF to QBO, then closes itself.
  const [reExportMode, setReExportMode] = useState(false);
  // Send-to-client dialog: collects the client email, then emails the QBO
  // invoice via POST /invoicing/send.
  const [sendToOpen, setSendToOpen] = useState(false);
  const [sendToEmail, setSendToEmail] = useState("");
  const [sendingInvoice, setSendingInvoice] = useState(false);
  const [currentQBOPushStatus, setCurrentQBOPushStatus] = useState<string | null>(null);
  const [currentQBOLastError, setCurrentQBOLastError] = useState<string | null>(null);
  // When the invoice was last emailed to the client (null = never). Distinct
  // from the QBO 'sent' status.
  const [currentClientEmailedAt, setCurrentClientEmailedAt] = useState<string | null>(null);
  const [recordPaymentOpen, setRecordPaymentOpen] = useState(false);
  const [recordPaymentInvoiceId, setRecordPaymentInvoiceId] = useState<number | null>(null);
  const [recordPaymentDefaultCents, setRecordPaymentDefaultCents] = useState(0);
  const [loadingInvoice, setLoadingInvoice] = useState(false);
  const [propertyOwnerName, setPropertyOwnerName] = useState<string>("");
  const [fetchedPropertyLocation, setFetchedPropertyLocation] = useState<string>("");
  const [locationGroups, setLocationGroups] = useState<LocationGroupsResponse | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  
  // Initialize to previous month
  const getDefaultInvoiceMonth = () => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date;
  };
  
  const [selectedInvoiceMonth, setSelectedInvoiceMonth] = useState<Date>(getDefaultInvoiceMonth());

  const loadInvoiceForProperty = async () => {
    if (!propertyId) return;

    try {
      setLoadingInvoice(true);
      setLocationGroups(null);
      setSelectedLocation("");
  
      // 1️⃣ Generate (or regenerate) invoice
      const generateRes = await authFetch(
        `/invoicing/generate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            property_id: Number(propertyId),
            month: selectedInvoiceMonth.toISOString().slice(0, 10),
          }),
        }
      );

      // Generate is idempotent for terminal-state invoices — it returns the
      // existing snapshot instead of erroring, so we don't need a fallback
      // path here. Any non-200 is a real failure.
      if (!generateRes.ok) {
        const errBody = await generateRes.text();
        let parsedErr = errBody;
        try { parsedErr = JSON.parse(errBody)?.error ?? errBody; } catch {}
        setGenerateInvoiceError(parsedErr || "Failed to load invoice");
        return;
      }
      setGenerateInvoiceError(null);
      const invoiceData: any = await generateRes.json();
      const invoiceId: number = invoiceData.invoice.id;
      setCurrentInvoiceId(invoiceId);

      // Capture lifecycle state for the preview modal.
      if (invoiceData?.invoice) {
        setCurrentInvoiceStatus(
          (invoiceData.derived_status || invoiceData.invoice.status) as InvoiceLifecycleStatus,
        );
        setCurrentInvoiceTotalCents(
          Math.round((invoiceData.invoice.total_amount || 0) * 100),
        );
        setCurrentInvoicePaymentCents(
          invoiceData.invoice.payment_amount_cents ?? 0,
        );
        setCurrentInvoiceRolloverPaymentCents(
          invoiceData.invoice.rollover_payment_cents ?? 0,
        );
        setCurrentInvoiceDisputeCreditCents(
          invoiceData.invoice.dispute_credit_cents ?? 0,
        );
        setCurrentQBOPushStatus(invoiceData.invoice.qbo_push_status ?? null);
        setCurrentQBOLastError(invoiceData.invoice.qbo_last_error ?? null);
        setCurrentClientEmailedAt(invoiceData.invoice.client_emailed_at ?? null);
      }

  
      // 2️⃣ Fetch expanded line items
      const itemsRes = await authFetch(
        `/invoicing/line-items-expanded?id=${invoiceId}`,
      );
  
      if (!itemsRes.ok) {
        throw new Error("Failed to load invoice line items");
      }
  
      const apiItems = await itemsRes.json();

      // Count passthrough lines that are still unpaid — drives the DRAFT banner.
      const passthroughUnpaid = (apiItems as any[]).filter((li) => {
        const isPassthrough =
          li.source_type === "vendor" ||
          li.source_type === "utility" ||
          li.source_type === "fto_expense";
        const isUnpaid =
          li.payment_status === "unpaid" ||
          li.payment_status === "unknown" ||
          li.payment_status === "not_booked";
        return isPassthrough && isUnpaid;
      }).length;
      setUnpaidPassthroughCount(passthroughUnpaid);

      const SOURCE_PRESETS = {
        vendor: {
          icon: "/vendor-placeholder.svg",
          bg: "#FFF0EF",
          border: "rgba(188, 66, 62, 0.22)",
        },
        utility: {
          icon: "/utility-placeholder.svg",
          bg: "#E0F2FE",
          border: "rgba(2, 132, 199, 0.22)",
        },
        fto: {
          icon: "/fto-placeholder.svg",
          bg: "#FEFCDB",
          border: "rgba(235, 165, 36, 0.22)",
        },
        manual: {
          icon: "/vendor-placeholder.svg",
          bg: "#DBE9FE",
          border: "rgba(36, 99, 235, 0.22)",
        },
      };
      
  
      // 3️⃣ Transform API → UI table shape
      const mappedItems: InvoiceItem[] = apiItems.map((li: any) => {
        const avatar = getVendorAvatar(li.vendor_name || "");
        
        // Normalize FTO source values to "FTO Submission" for consistency
        let normalizedSource = li.source;
        if (li.source === "Field Team Hours" || li.source === "Field Team Expense") {
          normalizedSource = "FTO Submission";
        }
      
        return {
          id: li.id,
          vendor: li.vendor_name || "—",
          vendorIcon: avatar.icon,
          vendorBg: avatar.bg,
          vendorBorder: avatar.border,
          // Backend resolves the display name authoritatively (handles both
          // canonical chart_of_accounts.id and legacy buildium_id). Fall back
          // to the local Buildium-keyed map only if the backend didn't supply
          // a name (older invoice rows pre-2026-05-08).
          glAccount:
            li.gl_account_name ||
            getGlAccountName(li.gl_account_id),
          description: li.description || "",
          amount: `$${li.amount.toFixed(2)}`,
          source: normalizedSource,
          sourceId: li.source_id, // Store source_id (submission ID for FTO items)
          sourceType: li.source_type, // raw type for void base/markup pairing
          billDate: li.bill_date ?? null,
          billInvoiceNumber: li.bill_invoice_number ?? null,
          unitPrice: li.unit_price ?? null,
          quantity: li.quantity ?? null,
          managerCount: li.manager_count ?? null,
          travelChargeCents: li.travel_charge_cents ?? null,
          status: li.status === "approved" ? "Approved" : "Pending Approval",
          statusColor:
            li.status === "approved" ? "#059669" : "#D97706",
          statusBg:
            li.status === "approved" ? "#D1FAE5" : "#FEF3C7",
          paymentStatus: li.payment_status || "unknown",
        };
      });
      
      
      setInvoiceItems(mappedItems);

      // Fetch location groups for the split-by-location toggle (non-fatal)
      try {
        const locRes = await authFetch(`/invoicing/line-items-by-location?id=${invoiceId}`);
        if (locRes.ok) {
          setLocationGroups(await locRes.json());
        }
      } catch {
        // non-fatal — toggle simply won't appear
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingInvoice(false);
    }
  };


  const loadInvoiceHistory = async () => {
    if (!propertyId) return;
  
    try {
      const apiItems: InvoiceHistoryApiItem[] = await fetchJSON(
        `/invoicing/history?property_id=${propertyId}`
      );
  
      const mapped: InvoiceHistoryItem[] = apiItems.map((inv) => {
        const created = new Date(inv.created_at);
  
        return {
          id: inv.id,
          dateCreated: created.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
          invoiceMonth: created.toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          }),
          amount: `$${inv.total_amount.toFixed(2)}`,
          lineItems: [], // lazy-load later if needed
          pdfObjectKey: inv.pdf_object_key, // 👈 KEEP
        };
      });
  
      setInvoiceHistory(mapped);
    } catch (err) {
      console.error("Invoice history error:", err);
    }
  };
  


  useEffect(() => {
    loadInvoiceForProperty();
    loadInvoiceHistory();
  }, [propertyId, selectedInvoiceMonth]);

  // Fetch property location (city, state, zip) and owner name from the owners table
  useEffect(() => {
    const fetchPropertyDetails = async () => {
      if (!propertyId) return;

      try {
        const [property, owners] = await Promise.all([
          fetchJSON(`/properties/${propertyId}`),
          fetchJSON(`/owners?property_id=${propertyId}`).catch(() => []),
        ]);

        // Use the first active owner from the owners table.
        // Prefer entity_name for non-individual owners, otherwise first + last.
        const ownerList: any[] = Array.isArray(owners) ? owners : [];
        const firstOwner = ownerList.find((o: any) => o.status === "active") ?? ownerList[0];
        if (firstOwner) {
          const name =
            firstOwner.entity_name?.trim() ||
            [firstOwner.first_name, firstOwner.last_name].filter(Boolean).join(" ");
          if (name) setPropertyOwnerName(name);
        }

        // Extract city, state, zip for property location
        const zip = property.zip || property.zipcode || property.zip_code ||
                    property.postal_code || property.postalCode || property.Zip ||
                    property.ZipCode || property.postal || "";
        const city = property.city || property.City || "";
        const state = property.state || property.State || "";

        if (city || state || zip) {
          if (city && state) {
            setFetchedPropertyLocation(`${city}, ${state}${zip ? " " + zip : ""}`);
          } else if (city && zip) {
            setFetchedPropertyLocation(`${city} ${zip}`);
          } else if (state && zip) {
            setFetchedPropertyLocation(`${state} ${zip}`);
          } else {
            setFetchedPropertyLocation([city, state, zip].filter(Boolean).join(" "));
          }
        }
      } catch (err) {
        console.error("Failed to fetch property details:", err);
      }
    };

    fetchPropertyDetails();
  }, [propertyId]);

  const formatInvoiceMonth = (dateStr: string) => {
    const parsed = new Date(dateStr);
    if (Number.isNaN(parsed.getTime())) return dateStr;

    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      year: "numeric",
    }).format(parsed);
  };



  const [invoiceHistory, setInvoiceHistory] =
  useState<InvoiceHistoryItem[]>([]);

  // Management fee always first in table and preview
  const invoiceItemsWithManagementFeeFirst = useMemo(
    () =>
      [...invoiceItems].sort((a, b) => {
        if (a.source === "Management Fee" && b.source !== "Management Fee") return -1;
        if (a.source !== "Management Fee" && b.source === "Management Fee") return 1;
        return 0;
      }),
    [invoiceItems]
  );

  // Filtered view — when a location is selected, show only that group's items.
  const filteredInvoiceItems = useMemo(() => {
    if (!selectedLocation || !locationGroups) return invoiceItemsWithManagementFeeFirst;
    const group = locationGroups.groups.find((g) => g.location_name === selectedLocation);
    if (!group) return invoiceItemsWithManagementFeeFirst;
    const idSet = new Set(group.line_item_ids);
    return invoiceItemsWithManagementFeeFirst.filter((item) => idSet.has(item.id));
  }, [invoiceItemsWithManagementFeeFirst, selectedLocation, locationGroups]);

  const { handleSortClick: handleInvoiceSortClick, getSortIndicator: getInvoiceSortIndicator, getSortedData: getSortedInvoiceItems } = useSortingTable(filteredInvoiceItems, "invoiceItems", { initialSortBy: "vendor" });
  const { handleSortClick: handleHistorySortClick, getSortIndicator: getHistorySortIndicator, getSortedData: getSortedHistoryItems } = useSortingTable(invoiceHistory, "invoiceHistory");

  // Single source of row order for the on-screen table AND the PDF preview /
  // commit paths: current column sort applied, then AVMRE lines re-pinned on
  // top — management fee first, other AVMRE LLC lines next, everyone else
  // after (Array.sort is stable, so the sorted order is preserved within each
  // group).
  const getDisplayedInvoiceItems = () => {
    const rank = (item: InvoiceItem) =>
      item.source === "Management Fee"
        ? 0
        : (item.vendor || "").trim().toUpperCase() === "AVMRE LLC"
          ? 1
          : 2;
    return [...getSortedInvoiceItems()].sort((a, b) => rank(a) - rank(b));
  };

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
          unit: UNIT_EMPTY_DISPLAY,
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
          unit: UNIT_EMPTY_DISPLAY,
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

  const openViewFTO = async (submissionId: number) => {
    try {
      // Fetch the submission to get the FTO ID
      const data = await fetchJSON(
        `/maintenance/submissions/${submissionId}`
      );
      // Handle both possible response structures: direct submission or wrapped in SubmissionWithAttachments
      const submission = data.submission || data;
      const ftoId = submission.fto_id || submission.FTOID || submission.ftoId;

      if (!ftoId) {
        throw new Error("FTO ID not found in submission");
      }

      // Navigate to the approve page (same as the approve button in all field team orders)
      navigate(`/field-team-orders/approve/${ftoId}`);
    } catch (err) {
      console.error("Failed to open FTO:", err);
      alert("Failed to load FTO details");
    }
  };

  const buildPreviewLineItemsFromInvoiceItem = (
    item: InvoiceItem,
  ): InvoiceLineItem[] => [
    {
      id: 1,
      vendor: item.vendor,
      description: item.description,
      amount: item.amount,
      billDate: item.billDate ?? undefined,
      billInvoiceNumber: item.billInvoiceNumber ?? undefined,
      rate: item.unitPrice ?? undefined,
      qty: item.quantity ?? undefined,
      managerCount: item.managerCount ?? undefined,
      travelChargeCents: item.travelChargeCents ?? undefined,
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


  // Re-export path: upload the freshly-rendered PDF and replace the QBO
  // invoice's attachment. Invoked by the preview modal (autoReExport) after a
  // void re-renders the document.
  const handleReExportPdf = async (pdfBlob: Blob) => {
    if (!currentInvoiceId) {
      setReExportMode(false);
      setShowInvoicePreview(false);
      return;
    }
    const toastId = toast.loading("Re-exporting PDF to QuickBooks…");
    try {
      const fd = new FormData();
      fd.append("file", pdfBlob, "invoice.pdf");
      const up = await authFetch(`/vendors/bills/upload-pdf`, {
        method: "POST",
        body: fd,
      });
      const upJson = JSON.parse(await up.text());
      const { pdf_object_key, sha256_pdf } = upJson;
      if (!pdf_object_key) throw new Error("PDF upload did not return a key");
      const res = await authFetch(
        `/invoicing/reattach-pdf?id=${currentInvoiceId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pdf_object_key, sha256_pdf }),
        },
      );
      if (!res.ok) {
        const t = await res.text();
        let msg = t;
        try { msg = JSON.parse(t)?.error ?? t; } catch {}
        throw new Error(msg || "Re-attach failed");
      }
      toast.success("Updated PDF attached in QuickBooks", { id: toastId });
    } catch (e: any) {
      toast.error("PDF re-export failed", {
        id: toastId,
        description: e?.message ?? "Re-open the invoice and export again.",
      });
    } finally {
      setReExportMode(false);
      setShowInvoicePreview(false);
    }
  };

  const handleCommitInvoice = async (pdfBlob: Blob) => {
    if (!currentInvoiceId) return;

    const toastId = toast.loading("Sending invoice to QBO…", {
      description: "Uploading PDF and creating QuickBooks invoice",
    });

    try {
      // 1️⃣ Upload PDF
      const formData = new FormData();
      formData.append("file", pdfBlob, "invoice.pdf");

      const uploadRes = await authFetch(
        `/vendors/bills/upload-pdf`,
        {
          method: "POST",
          body: formData,
        }
      );

      const uploadText = await uploadRes.text();
      let uploadJson;
      try {
        uploadJson = JSON.parse(uploadText);
      } catch (e) {
        throw new Error("PDF upload response was not valid JSON");
      }

      const { pdf_object_key, sha256_pdf } = uploadJson;
      if (!pdf_object_key || !sha256_pdf) {
        throw new Error("PDF upload did not return a storage key");
      }

      // 2️⃣ Finalize invoice WITH PDF (and trigger QBO push server-side)
      const finalizeRes = await authFetch(
        `/invoicing/finalize-with-pdf?id=${currentInvoiceId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pdf_object_key,
            sha256_pdf,
          }),
        }
      );

      if (!finalizeRes.ok) {
        const errBody = await finalizeRes.text();
        let parsedErr = errBody;
        try {
          parsedErr = JSON.parse(errBody)?.error ?? errBody;
        } catch {}
        throw new Error(parsedErr || "Finalize failed");
      }

      // The response is the updated invoice; inspect qbo_push_status to see
      // whether the QBO leg succeeded. Lifecycle is committed either way —
      // QBO failure is recoverable via the Retry QBO Sync button.
      const finalizedInvoice = await finalizeRes.json();
      if (finalizedInvoice?.qbo_push_status === "pushed" && finalizedInvoice?.qbo_invoice_id) {
        toast.success("Invoice sent to QBO", {
          id: toastId,
          description: `QBO Invoice #${finalizedInvoice.qbo_invoice_id} created and PDF attached.`,
        });
      } else if (finalizedInvoice?.qbo_push_status === "failed") {
        toast.error("Invoice marked Sent, but QBO sync failed", {
          id: toastId,
          description:
            finalizedInvoice?.qbo_last_error ??
            "Use Retry QBO Sync once the underlying issue is fixed.",
        });
      } else {
        toast.success("Invoice marked Sent", {
          id: toastId,
          description: "QBO push not configured — only platform state was updated.",
        });
      }

      // 3️⃣ Refresh UI
      await loadInvoiceForProperty();
      await loadInvoiceHistory();
    } catch (err: any) {
      console.error("Commit failed:", err);
      toast.error("Send to QBO failed", {
        id: toastId,
        description: err?.message ?? "Unexpected error",
      });
    }
  };
  

  // Email the QBO invoice to the client. QBO sends its hosted email with the
  // online "View invoice" / "Review and pay" link; the customer doesn't need a
  // separate attachment from us.
  const handleSendToClient = async () => {
    if (!currentInvoiceId) return;
    const email = sendToEmail.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Enter a valid email address.");
      return;
    }
    setSendingInvoice(true);
    const toastId = toast.loading("Sending invoice to client…");
    try {
      const res = await authFetch(`/invoicing/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoice_id: currentInvoiceId, send_to: email }),
      });
      if (!res.ok) {
        const body = await res.text();
        let msg = body;
        try { msg = JSON.parse(body)?.error ?? body; } catch {}
        throw new Error(msg || "Send failed");
      }
      const data = await res.json().catch(() => ({}));
      toast.success(`Invoice emailed to ${data?.delivered_to || email}`, {
        id: toastId,
        description: "QuickBooks sent the client a link to view and pay the invoice.",
      });
      // Reflect "emailed to client" immediately (badge updates without reload).
      setCurrentClientEmailedAt(new Date().toISOString());
      setSendToOpen(false);
      setSendToEmail("");
    } catch (err: any) {
      toast.error("Couldn't send the invoice", {
        id: toastId,
        description: err?.message ?? "Unexpected error",
      });
    } finally {
      setSendingInvoice(false);
    }
  };

  const [refreshing, setRefreshing] = useState(false);

  const handleRefreshInvoice = async () => {
    if (!propertyId) return;

    // Non-draft invoices (sent/paid) get reset back to draft when refreshed.
    // Surface that destructiveness so a stray click doesn't silently undo
    // approvals or a QBO push.
    const needsConfirm =
      currentInvoiceStatus === "sent" ||
      currentInvoiceStatus === "paid" ||
      currentInvoiceStatus === "void";
    if (needsConfirm) {
      const ok = window.confirm(
        `This invoice is ${currentInvoiceStatus?.toUpperCase()}. Refreshing will reset it to DRAFT, clear approvals, and re-pull bills + FTO submissions for ${currentInvoiceMonth}. The QBO link is preserved for re-syncing later. Continue?`,
      );
      if (!ok) return;
    }

    const toastId = toast.loading("Refreshing invoice…", {
      description: "Re-pulling bills and FTO submissions",
    });
    setRefreshing(true);
    try {
      const res = await authFetch(`/invoicing/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          property_id: Number(propertyId),
          month: selectedInvoiceMonth.toISOString().slice(0, 10),
        }),
      });
      if (!res.ok) {
        const errBody = await res.text();
        let parsedErr = errBody;
        try {
          parsedErr = JSON.parse(errBody)?.error ?? errBody;
        } catch {}
        throw new Error(parsedErr || "Refresh failed");
      }
      await loadInvoiceForProperty();
      await loadInvoiceHistory();
      toast.success("Invoice refreshed", { id: toastId });
    } catch (err: any) {
      console.error("Refresh failed:", err);
      toast.error("Refresh failed", {
        id: toastId,
        description: err?.message ?? "Unexpected error",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleOpenAddAdditionalBillsModal = () => {
    setSelectedAdditionalBillId("");
    setSelectedAdditionalFtoId("");
    setShowAddAdditionalBillsModal(true);
  };

  const openInvoicePDF = async (pdfObjectKey?: string) => {
    if (!pdfObjectKey) {
      toast.error("No invoice PDF available for download.");
      return;
    }

    // Static file served by backend
    await openAuthPdf(`/files/${pdfObjectKey}`).catch(() => {
      toast.error("Failed to open invoice PDF. Please try again.");
    });
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

  const currentInvoiceMonthName = new Intl.DateTimeFormat("en-US", {
    month: "long",
  }).format(selectedInvoiceMonth);
  const currentInvoiceYear = selectedInvoiceMonth.getFullYear();
  const currentInvoiceMonth = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(selectedInvoiceMonth);
  
  const handlePreviousMonth = () => {
    const newDate = new Date(selectedInvoiceMonth);
    newDate.setMonth(newDate.getMonth() - 1);
    setSelectedInvoiceMonth(newDate);
  };
  
  const handleNextMonth = () => {
    const newDate = new Date(selectedInvoiceMonth);
    newDate.setMonth(newDate.getMonth() + 1);
    setSelectedInvoiceMonth(newDate);
  };

  return (
    <div className="flex flex-col gap-0">
      {/* Alert Banner */}
      {/* {showAlertBanner && (
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
      )} */}

      {/* This Month's Invoice */}
      <div className="bg-white flex w-full flex-col mt-6">
        <div className="rounded-xl border border-[#E5E5E5] shadow-[0_1px_2px_0_rgba(10,13,18,0.05)] flex w-full flex-col overflow-hidden">
          <ColumnFilterModal
            isOpen={invoiceColumnsManagement.showColumnModal}
            position={invoiceColumnsManagement.columnMenuPos}
            columns={invoiceTableColumns}
            visibleColumns={invoiceColumnsManagement.visibleColumns}
            onToggleColumn={invoiceColumnsManagement.toggleColumnVisibility}
            onClose={() => invoiceColumnsManagement.setShowColumnModal(false)}
            buttonRef={invoiceColumnsManagement.columnButtonRef}
          />

          <GlobalTable
            className="border-0 rounded-none"
            columns={invoiceTableColumns}
            data={filteredInvoiceItems}
            rowKey="id"
            title={
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePreviousMonth}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#DADADA] bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] hover:bg-gray-50 transition-colors"
                  aria-label="Previous month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-[#303030] font-medium text-lg">
                  {currentInvoiceMonthName} {currentInvoiceYear} Invoice
                </span>
                <button
                  onClick={handleNextMonth}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#DADADA] bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] hover:bg-gray-50 transition-colors"
                  aria-label="Next month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                {currentInvoiceStatus && (
                  <span
                    className={
                      "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border " +
                      (currentInvoiceStatus === "draft"
                        ? "bg-amber-50 text-amber-800 border-amber-200"
                        : currentInvoiceStatus === "ready"
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : currentInvoiceStatus === "sent"
                        ? "bg-blue-50 text-blue-800 border-blue-200"
                        : currentInvoiceStatus === "paid"
                        ? "bg-gray-100 text-gray-700 border-gray-200"
                        : "bg-rose-50 text-rose-800 border-rose-200")
                    }
                    title={
                      currentInvoiceStatus === "draft" && unpaidPassthroughCount > 0
                        ? `${unpaidPassthroughCount} passthrough line item${
                            unpaidPassthroughCount === 1 ? "" : "s"
                          } not yet paid`
                        : currentInvoiceStatus === "sent"
                        ? "Exported to QuickBooks — this does not mean it was emailed to the client"
                        : undefined
                    }
                  >
                    {currentInvoiceStatus === "sent"
                      ? "IN QUICKBOOKS"
                      : currentInvoiceStatus.toUpperCase()}
                    {currentInvoiceStatus === "draft" && unpaidPassthroughCount > 0 && (
                      <span className="ml-1 opacity-75">
                        · {unpaidPassthroughCount} unpaid
                      </span>
                    )}
                  </span>
                )}

                {/* Client-email state — distinct from the QBO 'sent'/in-QuickBooks
                    status above. Shown once the invoice is in QBO. */}
                {(currentInvoiceStatus === "sent" ||
                  currentInvoiceStatus === "paid") &&
                  (currentClientEmailedAt ? (
                    <span
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border bg-emerald-50 text-emerald-800 border-emerald-200"
                      title={`Emailed to the client on ${new Date(
                        currentClientEmailedAt,
                      ).toLocaleString()}`}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                        <path d="m4 7 8 6 8-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Emailed to client
                    </span>
                  ) : (
                    <span
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border bg-amber-50 text-amber-800 border-amber-200"
                      title="This invoice is in QuickBooks but hasn't been emailed to the client yet. Use Send to client."
                    >
                      Not emailed to client
                    </span>
                  ))}
              </div>
            }
            headerActions={
              <>
                {locationGroups?.has_locations && (
                  <Select
                    value={selectedLocation || "__all__"}
                    onValueChange={(v) => setSelectedLocation(v === "__all__" ? "" : v)}
                  >
                    <SelectTrigger className="h-9 w-48 text-sm border-[#DADADA]">
                      <SelectValue placeholder="All locations" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-[#E5E5E5] rounded-xl shadow-lg z-50 min-w-[200px]">
                      <SelectItem value="__all__">All locations</SelectItem>
                      {locationGroups.groups.map((g) => (
                        <SelectItem key={g.location_name} value={g.location_name}>
                          {g.location_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
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
                {/* <BlueButton
                  icon={<Plus className="w-5 h-5" />}
                  onClick={handleOpenAddAdditionalBillsModal}
                >
                  Add line item
                </BlueButton> */}
              </>
            }
            showSearchBar={true}
            showFilterButton={false}
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
                onClick: async (item: any) => {
                  const isFTO = item?.source === "FTO Submission";
                  if (isFTO) {
                    // Use sourceId (submission ID) to get FTO ID
                    if (item.sourceId) {
                      await openViewFTO(item.sourceId);
                    } else {
                      console.error("No sourceId found for FTO item");
                      alert("Unable to load FTO details");
                    }
                    return;
                  }

                  // Any bill-backed line (vendor or utility) opens the same
                  // ViewBillV2 detail page an All Bills row click opens —
                  // sourceId is the real bills.id for these source types.
                  // Gate on sourceType, not the display string, so utility
                  // lines aren't misrouted to the modal below.
                  const isBill =
                    item?.sourceType === "vendor" || item?.sourceType === "utility";
                  if (isBill && item.sourceId) {
                    navigate(`/bills/view?billId=${item.sourceId}`);
                    return;
                  }

                  // For other sources (Manual, etc.), use the modal
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
                // Hide action for Management Fee items
                hidden: (item: any) => item?.source === "Management Fee",
              },
              {
                label: () => "Dispute line item",
                icon: (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6"
                      stroke="#DC2626"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ),
                onClick: (item: any) => {
                  setVoidReason("");
                  setVoidTargetLine(item);
                  const cents =
                    Math.round(
                      parseFloat((item.amount || "").replace(/[^0-9.]/g, "")) * 100,
                    ) || 0;
                  setDisputeClientCreditCents(cents);
                  setDisputeVendorCreditCents(0);
                  setDisputeClientCreditDraft(null);
                  setDisputeVendorCreditDraft(null);
                },
                // Only meaningful while there's a current invoice that isn't
                // already void. The dialog derives before/after-payment mode
                // automatically (before-payment removes the line; after-payment
                // issues a credit memo applied to the next invoice).
                hidden: () =>
                  !currentInvoiceId || currentInvoiceStatus === "void",
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
                case "paymentStatus": {
                  const ps = item.paymentStatus;
                  if (ps === "paid") return <StatusBadge status="Paid" />;
                  if (ps === "unpaid") return <StatusBadge status="Pending" />;
                  if (ps === "not_booked") {
                    // FTO expense with no converted bill. Approved + not booked
                    // means the bill export silently failed at approval — flag
                    // it loudly; pre-approval it's just "not exported yet".
                    const approved = item.status === "Approved";
                    return (
                      <div
                        title={
                          approved
                            ? "Approved FTO expense has no vendor bill — the export failed or was skipped at approval. Re-approve the FTO or record the bill manually."
                            : "FTO expense not yet approved — approving the FTO will create the vendor bill."
                        }
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap w-fit"
                        style={
                          approved
                            ? { color: "#DC2626", backgroundColor: "#FEE2E2" }
                            : { color: "#D97706", backgroundColor: "#FEF3C7" }
                        }
                      >
                        {approved ? "⚠ Not Booked" : "Not Exported"}
                      </div>
                    );
                  }
                  // billed_by_invoice (mgmt fee / labor) and unknown — payment
                  // doesn't apply to these line types.
                  return (
                    <div className="text-[#A3A3A3] text-sm font-normal leading-[1.4] tracking-[-0.32px]">
                      —
                    </div>
                  );
                }
                case "glAccount":
                case "amount":
                case "source":
                  return (
                    <div className="text-[#303030] text-sm font-normal leading-[1.4] tracking-[-0.32px] whitespace-nowrap truncate">
                      {item[columnKey]}
                    </div>
                  );
                case "description": {
                  const datePrefix = item.billDate
                    ? new Date(item.billDate).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit" }) + " "
                    : "";
                  const invSuffix = item.billInvoiceNumber ? ` · #${item.billInvoiceNumber}` : "";
                  const displayDescription = `${datePrefix}${item.description}${invSuffix}`;
                  return (
                    <div className="text-[#303030] text-sm font-normal leading-[1.4] tracking-[-0.32px] whitespace-nowrap truncate">
                      {displayDescription}
                    </div>
                  );
                }
                default:
                  return null;
              }
            }}
            sortingHook={{
              handleSortClick: handleInvoiceSortClick,
              getSortIndicator: getInvoiceSortIndicator,
              getSortedData: getDisplayedInvoiceItems,
            }}
            columnManagementHook={invoiceColumnsManagement}
            currentPage={1}
            onPageChange={noopPageChange}
            itemsPerPage={filteredInvoiceItems.length || 10}
            onItemsPerPageChange={noopItemsPerPageChange}
            showPageSizeDropdown={false}
            openMenuId={invoiceOpenMenuId}
            onOpenMenuIdChange={setInvoiceOpenMenuId}
            showColumnModal={invoiceColumnsManagement.showColumnModal}
            onShowColumnModalChange={invoiceColumnsManagement.setShowColumnModal}
            showPagination={false}
            getRowClassName={getInvoiceItemRowClassName}
            getCellClassName={getInvoiceItemCellClassName}
          />
          {generateInvoiceError && (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-5 text-sm text-amber-800">
              {generateInvoiceError}
            </div>
          )}

          {/* Footer */}
          <div className="bg-white flex w-full px-4 py-4 items-center gap-4 justify-between flex-wrap">
            <div className="flex items-center gap-4">
              <div className="text-[#303030] font-medium text-[22px] leading-[1.09]">
                Subtotal: $
                {filteredInvoiceItems
                  .reduce((sum, item) => {
                    const amount =
                      parseFloat(item.amount.replace(/[$,]/g, "")) || 0;
                    return sum + amount;
                  }, 0)
                  .toFixed(2)}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              {currentQBOPushStatus === "failed" && currentQBOLastError && (
                <div className="text-xs text-rose-700 max-w-md text-right">
                  QBO sync failed: {currentQBOLastError}
                </div>
              )}
              <div className="flex items-start gap-2.5">
                <button
                  type="button"
                  onClick={handleRefreshInvoice}
                  disabled={refreshing || !currentInvoiceId}
                  title="Re-pull bills + FTO submissions for this month. On sent/paid invoices this also resets status to draft."
                  className="h-10 inline-flex items-center gap-2 px-4 rounded-lg border border-[#DADADA] bg-white text-[#303030] font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:pointer-events-none"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className={refreshing ? "animate-spin" : undefined}
                  >
                    <path
                      d="M14 8a6 6 0 1 1-1.76-4.24M14 2v3.5h-3.5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  {refreshing ? "Refreshing…" : "Refresh"}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    openInvoicePreview({
                      lineItems: getDisplayedInvoiceItems().map((item) => ({
                        id: item.id,
                        vendor: item.vendor,
                        description: item.description,
                        amount: item.amount,
                        billDate: item.billDate ?? undefined,
                        billInvoiceNumber: item.billInvoiceNumber ?? undefined,
                        rate: item.unitPrice ?? undefined,
                        qty: item.quantity ?? undefined,
                        managerCount: item.managerCount ?? undefined,
                        travelChargeCents: item.travelChargeCents ?? undefined,
                      })),
                      invoiceDate: currentInvoiceMonth,
                      showCommitButton: false,
                    })
                  }
                  className="h-10 inline-flex items-center px-4 rounded-lg border border-[#013764] bg-white text-[#013764] font-medium hover:bg-gray-50 transition-colors"
                >
                  Preview PDF
                </button>

                {currentInvoiceStatus !== "sent" &&
                  currentInvoiceStatus !== "paid" &&
                  currentInvoiceStatus !== "void" && (
                    <button
                      type="button"
                      disabled={
                        currentInvoiceStatus === "draft" || !currentInvoiceId
                      }
                      title={
                        currentInvoiceStatus === "draft"
                          ? `Cannot send — ${unpaidPassthroughCount} passthrough line item${
                              unpaidPassthroughCount === 1 ? "" : "s"
                            } unpaid. Resolve underlying bills first.`
                          : "Generate PDF + push to QuickBooks"
                      }
                      onClick={async () => {
                        if (!currentInvoiceId) return;
                        try {
                          // Reuse the existing PDF generation flow by opening
                          // the modal in commit mode — keeps PDF rendering in
                          // one place. The modal will auto-close after commit.
                          openInvoicePreview({
                            lineItems: getDisplayedInvoiceItems().map(
                              (item) => ({
                                id: item.id,
                                vendor: item.vendor,
                                description: item.description,
                                amount: item.amount,
                                billDate: item.billDate ?? undefined,
                                billInvoiceNumber: item.billInvoiceNumber ?? undefined,
                                rate: item.unitPrice ?? undefined,
                                qty: item.quantity ?? undefined,
                                managerCount: item.managerCount ?? undefined,
                                travelChargeCents: item.travelChargeCents ?? undefined,
                              }),
                            ),
                            invoiceDate: currentInvoiceMonth,
                            showCommitButton: true,
                          });
                        } catch (e) {
                          console.error("send to qbo failed", e);
                        }
                      }}
                      className="h-10 inline-flex items-center px-4 rounded-lg border border-white bg-[#013764] shadow-[0_0_0_1px_#002D5A,0_0_10px_-5px_rgba(0,0,0,0.2)] hover:bg-[#003a73] transition-colors disabled:opacity-50 disabled:pointer-events-none text-white font-medium"
                    >
                      Send to QBO
                    </button>
                  )}

                {/* Email the QBO invoice to the client — available once it's
                    been exported to QBO (sent or paid). */}
                {(currentInvoiceStatus === "sent" ||
                  currentInvoiceStatus === "paid") &&
                  currentInvoiceId &&
                  currentQBOPushStatus !== "failed" && (
                    <button
                      type="button"
                      onClick={() => {
                        setSendToEmail("");
                        setSendToOpen(true);
                      }}
                      title="Email this invoice to the client via QuickBooks (includes a view/pay link)"
                      className="h-10 inline-flex items-center gap-2 px-4 rounded-lg border border-[#013764] bg-white text-[#013764] font-medium hover:bg-gray-50 transition-colors"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                        <path d="m4 7 8 6 8-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Send to client
                    </button>
                  )}

                {/* Re-push the current (platform) line set to the existing QBO
                    invoice — use when the QBO copy has drifted (e.g. lines were
                    voided/merged after the original send). Also re-runs the
                    markup-income JE. */}
                {(currentInvoiceStatus === "sent" ||
                  currentInvoiceStatus === "paid") &&
                  currentInvoiceId &&
                  currentQBOPushStatus !== "failed" && (
                    <button
                      type="button"
                      title="Re-push this invoice's current lines to its QuickBooks invoice (corrects a drifted QBO copy)."
                      onClick={async () => {
                        const toastId = toast.loading(
                          "Re-syncing to QuickBooks…",
                        );
                        try {
                          const res = await authFetch(
                            `/invoicing/qbo-retry-update?id=${currentInvoiceId}`,
                            { method: "POST" },
                          );
                          if (!res.ok) {
                            const t = await res.text();
                            let msg = t;
                            try { msg = JSON.parse(t)?.error ?? t; } catch {}
                            throw new Error(msg || "Re-sync failed");
                          }
                          await loadInvoiceForProperty();
                          // Also regenerate + re-attach the PDF so the QBO copy
                          // and the emailed attachment match the updated lines.
                          // Clear any stale preview lines so the modal renders
                          // the current (merged / post-void) set.
                          setInvoicePreviewLineItems([]);
                          setReExportMode(true);
                          setShowInvoicePreview(true);
                          toast.success("Re-synced to QuickBooks", {
                            id: toastId,
                            description:
                              "Lines updated; refreshing the attached PDF. Use Send to client to re-email.",
                          });
                        } catch (e: any) {
                          toast.error("Re-sync failed", {
                            id: toastId,
                            description: e?.message ?? "Unexpected error",
                          });
                        }
                      }}
                      className="h-10 inline-flex items-center gap-2 px-4 rounded-lg border border-[#013764] bg-white text-[#013764] font-medium hover:bg-gray-50 transition-colors"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 12a8 8 0 0 1 13.66-5.66L20 8M20 4v4h-4M20 12a8 8 0 0 1-13.66 5.66L4 16M4 20v-4h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Re-sync to QBO
                    </button>
                  )}

                {currentInvoiceStatus === "sent" &&
                  currentInvoiceId &&
                  currentQBOPushStatus !== "failed" && (
                    <button
                      type="button"
                      onClick={() => {
                        setRecordPaymentInvoiceId(currentInvoiceId);
                        setRecordPaymentDefaultCents(currentInvoiceTotalCents);
                        setRecordPaymentOpen(true);
                      }}
                      className="h-10 inline-flex items-center px-4 rounded-lg border border-white bg-[#013764] shadow-[0_0_0_1px_#002D5A,0_0_10px_-5px_rgba(0,0,0,0.2)] hover:bg-[#003a73] transition-colors text-white font-medium"
                    >
                      Record Payment
                    </button>
                  )}

                {currentQBOPushStatus === "failed" && currentInvoiceId && (
                  <button
                    type="button"
                    onClick={async () => {
                      const toastId = toast.loading("Retrying QBO sync…");
                      try {
                        const res = await authFetch(
                          `/invoicing/qbo-retry-invoice?id=${currentInvoiceId}`,
                          { method: "POST" },
                        );
                        if (!res.ok) {
                          const errBody = await res.text();
                          let parsedErr = errBody;
                          try { parsedErr = JSON.parse(errBody)?.error ?? errBody; } catch {}
                          throw new Error(parsedErr || "Retry failed");
                        }
                        const inv = await res.json();
                        await loadInvoiceForProperty();
                        if (inv?.qbo_push_status === "pushed" && inv?.qbo_invoice_id) {
                          toast.success("QBO sync succeeded", {
                            id: toastId,
                            description: `QBO Invoice #${inv.qbo_invoice_id} created.`,
                          });
                        } else {
                          toast.error("QBO sync still failing", {
                            id: toastId,
                            description: inv?.qbo_last_error ?? "See server logs for details.",
                          });
                        }
                      } catch (e: any) {
                        console.error("retry qbo sync failed", e);
                        toast.error("Retry failed", {
                          id: toastId,
                          description: e?.message ?? "Unexpected error",
                        });
                      }
                    }}
                    className="h-10 inline-flex items-center px-4 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 transition-colors text-rose-800 font-medium"
                  >
                    Retry QBO Sync
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice History */}
      <div className="flex mt-6 w-full flex-col items-center">
        <div className="rounded-xl border border-[#E5E5E5] shadow-[0_1px_2px_0_rgba(10,13,18,0.05)] flex w-full flex-col overflow-hidden">
          <ColumnFilterModal
            isOpen={historyColumnsManagement.showColumnModal}
            position={historyColumnsManagement.columnMenuPos}
            columns={historyTableColumns}
            visibleColumns={historyColumnsManagement.visibleColumns}
            onToggleColumn={historyColumnsManagement.toggleColumnVisibility}
            onClose={() => historyColumnsManagement.setShowColumnModal(false)}
            buttonRef={historyColumnsManagement.columnButtonRef}
          />

          <GlobalTable
            className="border-0 rounded-none"
            columns={historyTableColumns}
            data={invoiceHistory}
            rowKey="id"
            title="Invoice History"
            headerActions={
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
            }
            showSearchBar={true}
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
                  openInvoicePDF(item.pdfObjectKey);
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
            showPageSizeDropdown={false}
            openMenuId={historyOpenMenuId}
            onOpenMenuIdChange={setHistoryOpenMenuId}
            showColumnModal={historyColumnsManagement.showColumnModal}
            onShowColumnModalChange={historyColumnsManagement.setShowColumnModal}
            showPagination={true}
            onRowClick={(item: InvoiceHistoryItem) => {
              openInvoicePDF(item.pdfObjectKey);
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
        propertyLocation={fetchedPropertyLocation || propertyLocation || ""}
        billTo={propertyOwnerName}
        rentalOwner={propertyOwnerName}
        invoiceId={currentInvoiceId}
        rolloverPaymentCents={currentInvoiceRolloverPaymentCents}
        disputeCreditCents={currentInvoiceDisputeCreditCents}
        invoiceDate={invoicePreviewInvoiceDate || currentInvoiceMonth}
        lineItems={
          invoicePreviewLineItems.length > 0
            ? invoicePreviewLineItems
            : getDisplayedInvoiceItems().map((item) => ({
                id: item.id,
                vendor: item.vendor,
                description: item.description,
                amount: item.amount,
                billDate: item.billDate ?? undefined,
                billInvoiceNumber: item.billInvoiceNumber ?? undefined,
                rate: item.unitPrice ?? undefined,
                qty: item.quantity ?? undefined,
                managerCount: item.managerCount ?? undefined,
                travelChargeCents: item.travelChargeCents ?? undefined,
              }))
        }
        showCommitButton={invoicePreviewShowCommitButton}
        onCommit={handleCommitInvoice}
        autoReExport={reExportMode}
        onReExport={handleReExportPdf}
        pendingUnapprovedCount={pendingApprovalBills.length}
        derivedStatus={currentInvoiceStatus}
        invoiceStatus={currentInvoiceStatus}
        onVoidLine={
          (currentInvoiceStatus === "sent" || currentInvoiceStatus === "paid") &&
          currentInvoiceId
            ? (lineId) => {
                const line = invoiceItems.find((it) => it.id === lineId) ?? null;
                setVoidReason("");
                setVoidTargetLine(line);
                const cents = line
                  ? Math.round(
                      parseFloat((line.amount || "").replace(/[^0-9.]/g, "")) * 100,
                    ) || 0
                  : 0;
                setDisputeClientCreditCents(cents);
                setDisputeVendorCreditCents(0);
                setDisputeClientCreditDraft(null);
                setDisputeVendorCreditDraft(null);
              }
            : undefined
        }
        unpaidPassthroughCount={unpaidPassthroughCount}
        qboPushStatus={currentQBOPushStatus}
        qboLastError={currentQBOLastError}
        onRecordPayment={
          currentInvoiceStatus === "sent" &&
          currentInvoiceId &&
          currentQBOPushStatus !== "failed"
            ? () => {
                setRecordPaymentInvoiceId(currentInvoiceId);
                setRecordPaymentDefaultCents(currentInvoiceTotalCents);
                setRecordPaymentOpen(true);
                setShowInvoicePreview(false);
              }
            : undefined
        }
        onRetryQBOSync={
          currentInvoiceId && currentQBOPushStatus === "failed"
            ? async () => {
                const toastId = toast.loading("Retrying QBO sync…");
                try {
                  const res = await authFetch(
                    `/invoicing/qbo-retry-invoice?id=${currentInvoiceId}`,
                    { method: "POST" },
                  );
                  if (!res.ok) {
                    const errBody = await res.text();
                    let parsedErr = errBody;
                    try { parsedErr = JSON.parse(errBody)?.error ?? errBody; } catch {}
                    throw new Error(parsedErr || "Retry failed");
                  }
                  const inv = await res.json();
                  await loadInvoiceForProperty();
                  if (inv?.qbo_push_status === "pushed" && inv?.qbo_invoice_id) {
                    toast.success("QBO sync succeeded", {
                      id: toastId,
                      description: `QBO Invoice #${inv.qbo_invoice_id} created.`,
                    });
                  } else {
                    toast.error("QBO sync still failing", {
                      id: toastId,
                      description: inv?.qbo_last_error ?? "See server logs for details.",
                    });
                  }
                } catch (e: any) {
                  console.error("retry qbo sync failed", e);
                  toast.error("Retry failed", {
                    id: toastId,
                    description: e?.message ?? "Unexpected error",
                  });
                }
              }
            : undefined
        }
      />

      {/* Dispute line-item confirmation */}
      {voidTargetLine &&
        (() => {
          const parseCents = (s: string) =>
            Math.round(parseFloat((s || "").replace(/[^0-9.]/g, "")) * 100) || 0;
          const t = voidTargetLine;
          const targetCents = parseCents(t.amount);
          const markupType =
            t.sourceType === "vendor" || t.sourceType === "utility"
              ? "vendor_credit"
              : t.sourceType === "fto_expense"
                ? "materials_markup"
                : "";
          const pairedMarkups = markupType
            ? invoiceItems.filter(
                (i) => i.sourceType === markupType && i.sourceId === t.sourceId,
              )
            : [];
          const combinedCents =
            targetCents +
            pairedMarkups.reduce((sum, l) => sum + parseCents(l.amount), 0);

          const clientCreditCents = Math.min(
            Math.max(disputeClientCreditCents, 0),
            targetCents,
          );
          const hasBillForVendorCredit =
            t.sourceType === "vendor" || t.sourceType === "utility";
          const vendorCreditCents = hasBillForVendorCredit
            ? Math.min(Math.max(disputeVendorCreditCents, 0), clientCreditCents)
            : 0;
          const lossCents = clientCreditCents - vendorCreditCents;

          const retainedCents = targetCents - clientCreditCents;
          const removedCents = combinedCents - retainedCents;
          const currentCents = currentInvoiceTotalCents;
          const newCents = currentCents - removedCents;
          const paymentCents = currentInvoicePaymentCents;
          const unpaidCents = currentCents - paymentCents;
          const beforePayment = removedCents <= unpaidCents;
          const closesOut = paymentCents > 0 && newCents === paymentCents;
          const fmt = (c: number) => `$${(c / 100).toFixed(2)}`;

          return (
            <AlertDialog
              open={!!voidTargetLine}
              onOpenChange={(open) => {
                if (!open) setVoidTargetLine(null);
              }}
            >
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Dispute line item</AlertDialogTitle>
                  <AlertDialogDescription>
                    {beforePayment
                      ? "The client hasn't paid this yet — the line is removed from this invoice."
                      : "The client already paid this — a credit memo is issued and applied to their next invoice."}
                  </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="space-y-3 text-sm">
                  <div className="rounded-md border border-gray-200 px-3 py-2">
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-700">
                        {t.description || t.source}
                      </span>
                      <span className="font-medium text-gray-900">
                        {t.amount}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">
                      Amount to credit the client
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={
                        disputeClientCreditDraft ??
                        (clientCreditCents / 100).toFixed(2)
                      }
                      onChange={(e) => {
                        setDisputeClientCreditDraft(e.target.value);
                        setDisputeClientCreditCents(parseCents(e.target.value));
                      }}
                      onFocus={(e) => {
                        setDisputeClientCreditDraft(e.target.value);
                        requestAnimationFrame(() => e.target.select());
                      }}
                      onBlur={() => setDisputeClientCreditDraft(null)}
                      className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">
                      Amount to recover from vendor
                      {!hasBillForVendorCredit && (
                        <span className="ml-1 font-normal text-gray-400">
                          (no underlying bill on this line)
                        </span>
                      )}
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      disabled={!hasBillForVendorCredit}
                      value={
                        disputeVendorCreditDraft ??
                        (vendorCreditCents / 100).toFixed(2)
                      }
                      onChange={(e) => {
                        setDisputeVendorCreditDraft(e.target.value);
                        setDisputeVendorCreditCents(parseCents(e.target.value));
                      }}
                      onFocus={(e) => {
                        setDisputeVendorCreditDraft(e.target.value);
                        requestAnimationFrame(() => e.target.select());
                      }}
                      onBlur={() => setDisputeVendorCreditDraft(null)}
                      className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm disabled:bg-gray-50 disabled:text-gray-400"
                    />
                  </div>

                  <div className="flex justify-between rounded-md bg-gray-50 px-3 py-2 text-xs">
                    <span className="text-gray-600">AVM's loss</span>
                    <span className="font-medium text-gray-900">
                      {fmt(lossCents)}
                    </span>
                  </div>

                  {pairedMarkups.length > 0 && beforePayment && (
                    <p className="text-xs text-amber-700">
                      Its markup line is removed too — you can't bill markup on a
                      reimbursement you've disputed.
                    </p>
                  )}

                  {beforePayment && (
                    <div className="flex justify-between border-t pt-2 font-medium">
                      <span>New invoice total</span>
                      <span>{fmt(Math.max(newCents, 0))}</span>
                    </div>
                  )}

                  {beforePayment && closesOut && (
                    <p className="rounded-md bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                      This brings the balance to $0 — the invoice will close out
                      as paid in full.
                    </p>
                  )}

                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">
                      Reason (optional)
                    </label>
                    <textarea
                      value={voidReason}
                      onChange={(e) => setVoidReason(e.target.value)}
                      rows={2}
                      className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                      placeholder="e.g. work quality issue, duplicate charge"
                    />
                  </div>
                </div>

                <AlertDialogFooter>
                  <AlertDialogCancel disabled={voiding}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    disabled={clientCreditCents <= 0 || voiding}
                    onClick={async (e) => {
                      e.preventDefault();
                      if (!currentInvoiceId) return;
                      setVoiding(true);
                      const toastId = toast.loading("Resolving dispute…");
                      // Only an already-issued (sent/paid) invoice has a QBO
                      // invoice + attached PDF to regenerate and re-sync — a
                      // still-draft invoice has neither yet, so re-export
                      // would just fail trying to re-attach to nothing.
                      const wasIssued =
                        currentInvoiceStatus === "sent" ||
                        currentInvoiceStatus === "paid";
                      try {
                        await disputeInvoiceLine(
                          currentInvoiceId,
                          t.id,
                          clientCreditCents,
                          vendorCreditCents,
                          voidReason,
                        );
                        setVoidTargetLine(null);
                        await loadInvoiceForProperty();
                        if (beforePayment && wasIssued) {
                          // Re-open the preview so it regenerates the corrected
                          // PDF and re-attaches it to the QBO invoice. Clear any
                          // stale preview lines so it renders the current set.
                          setInvoicePreviewLineItems([]);
                          setReExportMode(true);
                          setShowInvoicePreview(true);
                          toast.success("Dispute resolved", {
                            id: toastId,
                            description:
                              "Invoice updated in QuickBooks; refreshing the attached PDF…",
                          });
                        } else if (beforePayment) {
                          setShowInvoicePreview(false);
                          toast.success("Dispute resolved", {
                            id: toastId,
                            description: "Invoice total recomputed.",
                          });
                        } else {
                          setShowInvoicePreview(false);
                          toast.success("Dispute resolved", {
                            id: toastId,
                            description:
                              "Credit memo issued — it will apply to the client's next invoice.",
                          });
                        }
                      } catch (err: any) {
                        toast.error("Dispute failed", {
                          id: toastId,
                          description: err?.message ?? "Unexpected error",
                        });
                      } finally {
                        setVoiding(false);
                      }
                    }}
                  >
                    {voiding ? "Resolving…" : "Resolve dispute"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          );
        })()}

      {/* Send-to-client: capture the email, then email the QBO invoice. */}
      <AlertDialog open={sendToOpen} onOpenChange={(o) => { if (!o) setSendToOpen(false); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send invoice to client</AlertDialogTitle>
            <AlertDialogDescription>
              QuickBooks emails the client this invoice with a link to view and
              (if QuickBooks Payments is enabled) pay it online.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-2 text-sm">
            <label className="block text-xs font-medium text-gray-600">
              Client email
            </label>
            <input
              type="email"
              autoFocus
              value={sendToEmail}
              onChange={(e) => setSendToEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !sendingInvoice) {
                  e.preventDefault();
                  handleSendToClient();
                }
              }}
              placeholder="client@example.com"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#013764]"
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={sendingInvoice}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={sendingInvoice}
              onClick={(e) => {
                e.preventDefault();
                handleSendToClient();
              }}
            >
              {sendingInvoice ? "Sending…" : "Send invoice"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {recordPaymentInvoiceId && (
        <RecordPaymentDialog
          open={recordPaymentOpen}
          onOpenChange={setRecordPaymentOpen}
          defaultAmountCents={recordPaymentDefaultCents}
          invoiceId={recordPaymentInvoiceId}
          onSubmit={async ({
            amountCents,
            dateISO,
            depositAccountQBOID,
            paymentMethod,
            reference,
            memo,
          }) => {
            const toastId = toast.loading("Recording payment…");
            try {
              const res = await authFetch(
                `/invoicing/record-payment?id=${recordPaymentInvoiceId}`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    amount_cents: amountCents,
                    date: dateISO,
                    deposit_account_qbo_id: depositAccountQBOID,
                    payment_method: paymentMethod || undefined,
                    reference,
                    memo,
                  }),
                },
              );
              if (!res.ok) {
                const body = await res.text();
                let parsed = body;
                try { parsed = JSON.parse(body)?.error ?? body; } catch {}
                throw new Error(parsed || "Failed to record payment");
              }
              const inv = await res.json();
              await loadInvoiceForProperty();
              await loadInvoiceHistory();
              if (inv?.qbo_payment_push_status === "pushed" && inv?.qbo_payment_id) {
                toast.success("Payment recorded", {
                  id: toastId,
                  description: `QBO Payment #${inv.qbo_payment_id} created against the invoice.`,
                });
              } else if (inv?.qbo_payment_push_status === "failed") {
                toast.error("Payment recorded, but QBO sync failed", {
                  id: toastId,
                  description: inv?.qbo_payment_last_error ?? "Use the Retry button on the invoice.",
                });
              } else {
                toast.success("Payment recorded", {
                  id: toastId,
                  description: "Platform updated; QBO push not configured.",
                });
              }
            } catch (e: any) {
              toast.error("Failed to record payment", {
                id: toastId,
                description: e?.message ?? "Unexpected error",
              });
              throw e; // surface in dialog inline error too
            }
          }}
        />
      )}

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
        unit={UNIT_EMPTY_DISPLAY}
        fieldTeamAssignee="Field Team"
      />
    </div>
  );
};
