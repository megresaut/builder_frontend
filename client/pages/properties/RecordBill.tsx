import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useTabNavigation } from "@/hooks/useTabContext";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { StickyBottomBar } from "@/components/StickyBottomBar";

import { fetchJSON, API_BASE, authFetch } from "@/api/fetchJSON";
import { fetchChartOfAccounts } from "@/data/chartOfAccounts";
import { convertFiletoPdf } from "@/utils/convertFiletoPdf";
import MsgViewerModal from "@/components/MsgViewerModal";
import { parseMsgFile } from "@/utils/parseMsgFile";
import { parseEmlFile } from "@/utils/parseEmlFile";
import type { ParsedMsg } from "@/utils/parseMsgFile";

import AddVendorModal from "@/components/AddVendorModal";
import PayBillModal from "@/components/PayBillModal";
import ViewPaymentModal, { type EditablePayment } from "@/components/ViewPaymentModal";
import EditPaymentModal from "@/components/EditPaymentModal";
import { SelectField } from "@/components/forms/SelectField";
import { SelectFieldCell } from "@/components/forms/SelectFieldCell";
import { ConciergeGLPicker } from "@/components/ConciergeGLPicker";
import { BuildiumGLPicker } from "@/components/BuildiumGLPicker";
import { TextField } from "@/components/forms/TextField";
import { DateField } from "@/components/forms/DateField";
import { TextAreaField } from "@/components/forms/TextAreaField";

interface Vendor {
  id: number;
  name: string;
  phone: string;
  email: string;
  notes: string;
}

interface PropertyUnit {
  id: number;
  property_id: number;
  buildium_unit_id: number | null;
  unit_name: string;
}

interface LineItem {
  id: number;
  property: string;
  unit: string;                  // buildium_unit_id as string, or "" for no unit
  unitName: string;              // display name for the unit
  description: string;
  glAccount: string;             // chart_of_accounts.id (canonical) — legacy / AVMRE overhead
  qboItemId?: string;            // QBO Item id — Concierge (type='C') lines, drives QBO+Buildium dual-push
  qboItemName?: string;
  buildiumAccountId?: string;    // Direct Buildium id from BUILDUM_CHART_CSV — non-Concierge lines (Buildium-only)
  buildiumAccountName?: string;
  upcharge: string;              // dollar amount as string, e.g. "$0.00"
  total: string;
  workOrder?: string;
}

interface ViewBillState {
  vendorName?: string;
  referenceNumber?: string;
  invoiceDate?: string;
  dueDate?: string;
  memo?: string;
  lineItems?: LineItem[];
  qboPaidAt?: string;
  qboBalanceCents?: number;
  qboTotalCents?: number;
  qboBillId?: string;
  qboBillPaymentId?: string;
  buildiumBillId?: string;
  buildiumBillPaymentId?: string;
  paidOn?: string;
  paidFromName?: string;
  paidDocNumber?: string;
  paidMemo?: string;
  // 'queued' = a check is awaiting printing; 'printed' = printed/paid.
  checkPrintStatus?: string;
}

interface BillAttachment {
  StoragePath: string;
  FileName: string;
  ContentType: string;
  SizeBytes: number;
}


const mockVendors: Vendor[] = [
  {
    id: 1,
    name: "David Smith",
    phone: "724.705.2990",
    email: "mattgzyb21@gmail.com",
    notes: "Reliable vendor, quick turnaround",
  },
  {
    id: 2,
    name: "Elite HVAC",
    phone: "724.705.2991",
    email: "info@hvac.com",
    notes: "Good quality work",
  },
  {
    id: 3,
    name: "ABC Plumbing",
    phone: "724.705.2992",
    email: "contact@plumbing.com",
    notes: "Preferred for electrical work",
  },
  {
    id: 4,
    name: "Green Lawn Services",
    phone: "724.705.2993",
    email: "lawn@green.com",
    notes: "Great communication",
  },
  {
    id: 5,
    name: "Spark Electrical",
    phone: "724.705.2994",
    email: "spark@electric.com",
    notes: "Specializes in plumbing",
  },
];

const toCents = (value: string): number => {
  if (!value) return 0;
  const clean = value.replace("$", "").replace(",", "");
  const num = parseFloat(clean);
  if (isNaN(num)) return 0;
  return Math.round(num * 100);
};


const mockProperties = ["22 Indian Creek Dr", "25 Park Ave", "100 Main St"];
const mockGLAccounts = ["Utilities", "Maintenance", "Other"];

/** Natural sort comparator — handles "1", "2", "10", "A", "B", "1A", "1B", etc. */
const naturalSort = (a: string, b: string): number => {
  const ax: (string | number)[] = [];
  const bx: (string | number)[] = [];
  a.replace(/(\d+)|(\D+)/g, (_, d, s) => { ax.push(d ? +d : s); return ""; });
  b.replace(/(\d+)|(\D+)/g, (_, d, s) => { bx.push(d ? +d : s); return ""; });
  for (let i = 0; i < Math.max(ax.length, bx.length); i++) {
    const ai = ax[i] ?? "";
    const bi = bx[i] ?? "";
    if (typeof ai === "number" && typeof bi === "number") {
      if (ai !== bi) return ai - bi;
    } else {
      const cmp = String(ai).localeCompare(String(bi), undefined, { sensitivity: "base" });
      if (cmp !== 0) return cmp;
    }
  }
  return 0;
};

const placeholderBill = {
  vendor: mockVendors[0],
  referenceNumber: "INV-2024-001",
  invoiceDate: new Date(2024, 0, 15),
  dueDate: new Date(2024, 1, 15),
  memo: "Monthly utility billing for business operations. CRS Inspection Process documentation and compliance materials.",
  lineItems: [
    {
      id: 1,
      property: "22 Indian Creek Dr",
      unit: "1",
      unitName: "Unit 1",
      description: "Monthly electric service charge and consumption",
      glAccount: "Utilities",
      upcharge: "",
      total: "$450.00",
    },
    {
      id: 2,
      property: "22 Indian Creek Dr",
      unit: "2",
      unitName: "Unit 2",
      description: "Water and sewer service",
      glAccount: "Utilities",
      upcharge: "",
      total: "$125.50",
    },
    {
      id: 3,
      property: "25 Park Ave",
      unit: "1",
      unitName: "Unit 1",
      description: "Gas heating service",
      glAccount: "Utilities",
      upcharge: "",
      total: "$275.00",
    },
  ],
};

const parseDateWithFallback = (value: string | undefined, fallback: Date) => {
  if (!value) return fallback;
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed;
  }
  return fallback;
};

const parseDateNullable = (value: string | undefined): Date | null => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const emptyLineItem = (id: number): LineItem => ({
  id,
  property: "",
  unit: "",
  unitName: "",
  description: "",
  glAccount: "",
  upcharge: "",
  total: "",
});

const buildEditableBillFromState = (stateBill?: ViewBillState) => {
  const vendorName = (stateBill?.vendorName ?? "").trim();
  const vendor =
    vendorName && vendorName !== "—"
      ? (mockVendors.find((v) => v.name === vendorName) ?? null)
      : null;

  const referenceNumber = stateBill?.referenceNumber ?? "";
  const invoiceDate = parseDateNullable(stateBill?.invoiceDate);
  const dueDate = parseDateNullable(stateBill?.dueDate);
  const memo = stateBill?.memo ?? "";
  const lineItems =
    stateBill?.lineItems && stateBill.lineItems.length > 0
      ? stateBill.lineItems
      : [emptyLineItem(1)];

  return {
    vendor,
    referenceNumber,
    invoiceDate,
    dueDate,
    memo,
    lineItems,
  };
};

const buildReadOnlyBillFromState = (stateBill?: ViewBillState) => {
  const vendor =
    (stateBill?.vendorName &&
      mockVendors.find((v) => v.name === stateBill.vendorName)) ||
    placeholderBill.vendor;

  const referenceNumber =
    stateBill?.referenceNumber ?? placeholderBill.referenceNumber;

  const invoiceDate = parseDateWithFallback(
    stateBill?.invoiceDate,
    placeholderBill.invoiceDate,
  );

  const dueDate = parseDateWithFallback(
    stateBill?.dueDate,
    placeholderBill.dueDate,
  );

  const memo = stateBill?.memo ?? placeholderBill.memo;

  const lineItems =
    stateBill?.lineItems && stateBill.lineItems.length > 0
      ? stateBill.lineItems
      : placeholderBill.lineItems;

  return {
    vendor,
    referenceNumber,
    invoiceDate,
    dueDate,
    memo,
    lineItems,
  };
};

const normalizeApprovedBill = (bill: any) => ({
  Draft: {
    InvoiceNumber: bill.invoice_number,
    StatementDate: bill.statement_date,
    DueDate: bill.due_date,
    Memo: bill.memo,
  },

  VendorID: bill.vendor_id,

  LineItems: (bill.line_items || []).map((li: any, idx: number) => ({
    LineID: li.line_id ?? idx + 1,
    PropertyID: li.property_id,
    Unit: li.unit || "",
    // unit_name is persisted alongside unit so the dropdown can render the
    // saved selection even when /properties/{id}/units returns an empty
    // list (concierge properties with no synced unit data) or before that
    // async fetch lands.
    UnitName: li.unit_name || "",
    WorkOrderRef: li.work_order_ref || "",
    Description: li.description || "",
    GLAccountID: li.gl_account_id,
    GLAccountName: li.gl_account_name,
    QBOItemID: li.qbo_item_id,
    QBOItemName: li.qbo_item_name,
    BuildiumAccountID: li.buildium_account_id,
    BuildiumAccountName: li.buildium_account_name,
    // Approved bills come from bills.line_items JSONB (raw, lowercase keys).
    // Drafts come from the Go BDV_LineItem struct (Pascal-case via default
    // json serialization) — that path uses item.UpchargeCents directly, so
    // normalize the approved shape to match.
    UpchargeCents: typeof li.upcharge_cents === "number" ? li.upcharge_cents : 0,
    AmountCents: li.amount_cents,
  })),
});


const loadAttachmentIntoViewer = async (
  a: BillAttachment,
  setUploadedFiles: React.Dispatch<
    React.SetStateAction<Array<{ name: string; size: number; file: File }>>
  >
) => {
  try {
    // Extract path from full URL for authFetch (which prepends API_BASE)
    let fetchPath = a.StoragePath;
    try {
      const parsed = new URL(a.StoragePath);
      fetchPath = parsed.pathname;
    } catch {
      // already a relative path
    }
    const res = await authFetch(fetchPath);

    if (!res.ok) {
      throw new Error(`Failed to fetch PDF: ${res.status} ${res.statusText}`);
    }

    const blob = await res.blob();

    // ✅ FORCE PDF TYPE WHEN BACKEND RETURNS OCTET-STREAM
    const inferredType =
      a.ContentType === "application/octet-stream" &&
      a.FileName.toLowerCase().endsWith(".pdf")
        ? "application/pdf"
        : a.ContentType || "application/pdf";

    const file = new File([blob], a.FileName, {
      type: inferredType,
    });

    // Required for iframe viewer
    const previewUrl = URL.createObjectURL(
      inferredType === "application/pdf"
        ? file
        : new Blob([blob], { type: "application/pdf" })
    );
    (file as any).preview = previewUrl;

    setUploadedFiles([
      {
        name: a.FileName,
        size: a.SizeBytes,
        file,
      },
    ]);
  } catch (err) {
    console.error("Failed to load attachment PDF", err);
  }
};


const middleTruncate = (
  name: string,
  maxLength = 48
): string => {
  if (name.length <= maxLength) return name;

  const extMatch = name.match(/(\.[^.]+)$/);
  const ext = extMatch ? extMatch[1] : "";
  const base = ext ? name.slice(0, -ext.length) : name;

  const keep = Math.floor((maxLength - ext.length - 3) / 2);

  return (
    base.slice(0, keep) +
    "…" +
    base.slice(-keep) +
    ext
  );
};


export const RecordBill = () => {
  const [searchParams] = useSearchParams();
  // When opened from a property's Bills tab (/property/:propertyId/bills/record),
  // prefill the first line item's property with that property.
  const { propertyId: routePropertyId } = useParams<{ propertyId: string }>();
  // const billId = searchParams.get("billId");
  const navigate = useNavigate();
  const { goBack } = useTabNavigation();
  // Cancel/back uses the per-tab history stack rather than navigate(-1), which
  // walks browser history (shared across all tabs and clobbered by tab switching).
  const returnToReferrer = () => goBack({ fallback: "/bills" });
  const location = useLocation();
  const isReadOnly = searchParams.get("readOnly") === "true";
  // Edit-in-place toggle. When isReadOnly + editing is true, the form fields
  // become editable and the footer swaps "Exported to Buildium" for
  // "Save & Re-export". The URL-driven isReadOnly stays stable so the load
  // effect doesn't re-run (which would clobber unsaved edits). Initial value
  // honors ?edit=true so we can deep-link straight into edit mode.
  const [editing, setEditing] = useState<boolean>(
    searchParams.get("edit") === "true",
  );
  const formDisabled = isReadOnly && !editing;
  const [savingEdit, setSavingEdit] = useState(false);
  // const billIdParam = searchParams.get("billId");
  // const billId = billIdParam ? Number(billIdParam) : Number.NaN;
  // const resolvedBillId = Number.isFinite(billId) ? billId : Date.now();
  // const isEditingDraft = billId !== null;


  const billIdParam = searchParams.get("billId");
  const returnTo = searchParams.get("returnTo");
  const workOrderId = searchParams.get("workOrderId");

  // billId is either a real number OR null
  const billId: number | null =
    billIdParam && Number.isFinite(Number(billIdParam))
      ? Number(billIdParam)
      : null;

  // editing draft ONLY if we have a real billId
  const isEditingDraft = billId !== null;

  const stateBill = location.state?.bill;

  // Reconciliation return context: when this page was opened from the CC
  // reconciliation workspace to book a bill for an unmatched statement row, we
  // carry the statement row through so that on successful create we hand the new
  // bill id back to the workspace, which auto-pays it from the card + pairs it.
  const reconcileContext = location.state?.reconcile as
    | { statementRow: unknown }
    | undefined;

  const readOnlyBill = isReadOnly
    ? buildReadOnlyBillFromState(stateBill)
    : null;
  const [draft, setDraft] = useState<any>(null);

  const editableBill =
    !formDisabled && stateBill ? buildEditableBillFromState(stateBill) : null;

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(
    isReadOnly
      ? (readOnlyBill?.vendor ?? placeholderBill.vendor)
      : (editableBill?.vendor ?? null),
  );
  const [referenceNumber, setReferenceNumber] = useState<string>(
    isReadOnly
      ? (readOnlyBill?.referenceNumber ?? placeholderBill.referenceNumber)
      : (editableBill?.referenceNumber ?? ""),
  );
  const [invoiceDate, setInvoiceDate] = useState<Date | null>(
    isReadOnly
      ? (readOnlyBill?.invoiceDate ?? placeholderBill.invoiceDate)
      : (editableBill?.invoiceDate ?? null),
  );
  const [dueDate, setDueDate] = useState<Date | null>(
    isReadOnly
      ? (readOnlyBill?.dueDate ?? placeholderBill.dueDate)
      : (editableBill?.dueDate ?? null),
  );
  const [invoiceDateInput, setInvoiceDateInput] = useState<string>(() => {
    const date =
      (isReadOnly
        ? (readOnlyBill?.invoiceDate ?? placeholderBill.invoiceDate)
        : editableBill?.invoiceDate) ?? null;
    return date ? format(date, "MM/dd/yyyy") : "";
  });
  const [dueDateInput, setDueDateInput] = useState<string>(() => {
    const date =
      (isReadOnly
        ? (readOnlyBill?.dueDate ?? placeholderBill.dueDate)
        : editableBill?.dueDate) ?? null;
    return date ? format(date, "MM/dd/yyyy") : "";
  });
  const [memo, setMemo] = useState<string>(
    isReadOnly
      ? (readOnlyBill?.memo ?? placeholderBill.memo)
      : (editableBill?.memo ?? ""),
  );
  const [invoiceDateError, setInvoiceDateError] = useState<string>("");
  const [dueDateError, setDueDateError] = useState<string>("");
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState<boolean>(true);
  const [viewingFileUrl, setViewingFileUrl] = useState<string | null>(null);
  const [viewingFileIndex, setViewingFileIndex] = useState<number | null>(null);
  const [msgViewer, setMsgViewer] = useState<{
    isOpen: boolean;
    title: string;
    data: ParsedMsg | null;
    loading: boolean;
    error: string | null;
  }>({ isOpen: false, title: "", data: null, loading: false, error: null });
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [lineItemErrors, setLineItemErrors] = useState<{
    [key: number]: Set<string>;
  }>({});
  const [formErrors, setFormErrors] = useState<Set<string>>(new Set());
  const [workOrdersByProperty, setWorkOrdersByProperty] = useState<{
    [propertyName: string]: { id: number; number: string }[];
  }>({});
  const [uploadedFiles, setUploadedFiles] = useState<
    Array<{ name: string; size: number; file: File }>
  >([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showAddVendorModal, setShowAddVendorModal] = useState(false);
  const [showPayBillModal, setShowPayBillModal] = useState(false);
  const [showViewPaymentModal, setShowViewPaymentModal] = useState(false);
  const [editPaymentTarget, setEditPaymentTarget] =
    useState<EditablePayment | null>(null);
  // Mirror of QBO + payment state coming from navigation (Bills.tsx → buildBillState).
  // Updated optimistically after a successful Pay Bill submission so the
  // footer button updates and the View Payment modal can render fresh data
  // without a page reload.
  const [qboPaymentState, setQboPaymentState] = useState<{
    qboPaidAt?: string;
    qboBalanceCents?: number;
    qboTotalCents?: number;
    qboBillId?: string;
    qboBillPaymentId?: string;
    buildiumBillId?: string;
    buildiumBillPaymentId?: string;
    paidOn?: string;
    paidFromName?: string;
    paidDocNumber?: string;
    paidMemo?: string;
    checkPrintStatus?: string;
    receiptObjectKey?: string | null;
    receiptFilename?: string | null;
    receiptMime?: string | null;
    receiptSizeBytes?: number | null;
    receiptUploadedAt?: string | null;
  }>({
    qboPaidAt: stateBill?.qboPaidAt,
    qboBalanceCents: stateBill?.qboBalanceCents,
    qboTotalCents: stateBill?.qboTotalCents,
    qboBillId: stateBill?.qboBillId,
    qboBillPaymentId: stateBill?.qboBillPaymentId,
    buildiumBillId: stateBill?.buildiumBillId,
    buildiumBillPaymentId: stateBill?.buildiumBillPaymentId,
    paidOn: stateBill?.paidOn,
    paidFromName: stateBill?.paidFromName,
    paidDocNumber: stateBill?.paidDocNumber,
    paidMemo: stateBill?.paidMemo,
    checkPrintStatus: stateBill?.checkPrintStatus,
  });
  const [lineItems, setLineItems] = useState<LineItem[]>(
    isReadOnly
      ? (readOnlyBill?.lineItems ?? placeholderBill.lineItems)
      : (editableBill?.lineItems ?? [
          {
            id: 1,
            // Prefill from the property whose Bills tab launched Record Bill.
            property: routePropertyId ?? "",
            unit: "",
            unitName: "",
            description: "",
            glAccount: "",
            upcharge: "",
            total: "",
          },
        ]),
  );

  // Dynamic column width tracking with default minimum widths
  const defaultColumnWidths = {
    property: 151,
    unit: 130,
    description: 200,
    glAccount: 170,
    upcharge: 110,
    total: 80,
    workOrder: 150,
  };
  // Real vendors + properties
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [properties, setProperties] = useState<{ id: number; name: string; property_type?: string | null }[]>([]);
  const [propertyMap, setPropertyMap] = useState<Record<string, number>>({});
  const [columnWidths, setColumnWidths] = useState(defaultColumnWidths);
  const [glAccountOptions, setGLAccountOptions] = useState<
  { id: number; name: string }[]
>([]);


  const vendorPageSize = 50;
  const vendorRequestIdRef = useRef(0);
  const rightPanelScrollRef = useRef<HTMLDivElement>(null);
  const [vendorSearch, setVendorSearch] = useState("");
  const [vendorOffset, setVendorOffset] = useState(0);
  const [vendorHasMore, setVendorHasMore] = useState(true);
  const [vendorLoading, setVendorLoading] = useState(false);
  const [isVendorDropdownOpen, setIsVendorDropdownOpen] = useState(false);
  const [complianceWarnings, setComplianceWarnings] = useState<string[]>([]);
  const filteredVendors = vendors;


  const [propertySearch, setPropertySearch] = useState("");
  const [glSearch, setGlSearch] = useState("");
  const [unitsByProperty, setUnitsByProperty] = useState<Record<string, PropertyUnit[]>>({});
  // Sort alphabetically so the dropdown isn't dominated by one type. The
  // backend returns properties ordered by id; with the first ~60 active ids
  // being Concierge, the unsorted dropdown visually looks like a Concierge-
  // only list until you scroll. localeCompare with sensitivity:"base" keeps
  // "(C) ..." and "(c) ..." together.
  const filteredProperties = properties
    .filter((p) =>
      p.name.toLowerCase().includes(propertySearch.toLowerCase()),
    )
    .sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
    );
  
  const filteredGLAccounts = glAccountOptions.filter((gl) =>
    gl.name.toLowerCase().includes(glSearch.toLowerCase())
  );
  

  // GL accounts come from our canonical chart_of_accounts table. We filter to:
  //   - account_type === 'expense' (bills' line items only ever debit expense
  //     accounts; bank/equity/asset accounts here would fail accounting rules
  //     in both QBO and Buildium)
  //   - has qbo_id AND has buildium_id (so the bill can flow to both systems
  //     atomically; an account missing either id can't participate in dual-push)
  // The id we store in line_items.gl_account_id is the chart_of_accounts.id;
  // the backend resolves it to QBO + Buildium ids at push time.
  useEffect(() => {
    let cancelled = false;
    fetchChartOfAccounts({ activeOnly: true })
      .then((accounts) => {
        if (cancelled) return;
        const usable = accounts
          .filter((a) =>
            a.account_type === "expense" &&
            a.qbo_id !== null && a.qbo_id !== "" &&
            a.buildium_id !== null,
          )
          .map((a) => ({ id: a.id, name: a.name }));
        setGLAccountOptions(usable);
      })
      .catch((err) => {
        console.error("Failed to load chart of accounts:", err);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Measure and update column widths - expands and shrinks as needed
  const measureAndUpdateColumnWidths = useCallback(() => {
    const newWidths = { ...defaultColumnWidths };

    // Get all measurements from the DOM
    document.querySelectorAll("[data-measure-width]").forEach((element) => {
      const columnName = element.getAttribute(
        "data-measure-width",
      ) as keyof typeof defaultColumnWidths;
      const padding = 24; // px-3 = 12px * 2
      let requiredWidth = defaultColumnWidths[columnName];

      if (element instanceof HTMLInputElement) {
        // For input elements, measure text content using canvas
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const computedStyle = window.getComputedStyle(element);
          const font = `${computedStyle.fontWeight} ${computedStyle.fontSize} ${computedStyle.fontFamily}`;
          ctx.font = font;
          const value = element.value || "";
          const textWidth = ctx.measureText(value).width;
          requiredWidth = textWidth + padding;
        }
      } else {
        // For select triggers and other elements, use offsetWidth (actual rendered width)
        const offsetWidth = (element as HTMLElement).offsetWidth;
        if (offsetWidth > 0) {
          requiredWidth = offsetWidth + padding;
        } else {
          // Fallback to scrollWidth if offsetWidth is not available
          const scrollWidth = (element as HTMLElement).scrollWidth;
          if (scrollWidth > 0) {
            requiredWidth = scrollWidth + padding;
          }
        }
      }

      // Set to the maximum of default or required width - allows both expanding and contracting
      newWidths[columnName] = Math.max(
        defaultColumnWidths[columnName],
        requiredWidth,
      );
    });

    setColumnWidths(newWidths);
  }, []);

  // Detect sidebar visibility
  useEffect(() => {
    const checkSidebarVisibility = () => {
      const sidebar = document.querySelector('aside[style*="opacity"]');
      if (sidebar) {
        const opacity = window.getComputedStyle(sidebar).opacity;
        setSidebarVisible(parseFloat(opacity) > 0.5);
      }
    };

    // Check on mount and when sidebar might change
    checkSidebarVisibility();

    // Check periodically for sidebar state changes
    const interval = setInterval(checkSidebarVisibility, 300);
    return () => clearInterval(interval);
  }, []);

  // useEffect(() => {
  //   if (billId === null) return;
  
  //   async function load() {
  //     try {
  //       const data = await fetchJSON(`/vendors/bill-drafts/${billId}`);
  //       setDraft(data);
  //     } catch (err) {
  //       console.error("Failed to load bill draft", err);
  //     }
  //   }
  
  //   load();
  // }, [billId]);
  


  useEffect(() => {
    if (!billId) return;
  
    async function load() {
      try {
        // -----------------------------
        // APPROVED vendor bill (read-only)
        // -----------------------------
        if (isReadOnly) {
          const bill = await fetchJSON(`/utilities/bills/${billId}`);
          setDraft({ ApprovedBill: bill });
          return;
        }
  
        // -----------------------------
        // DRAFT vendor bill (editable)
        // -----------------------------
        const draft = await fetchJSON(`/vendors/bill-drafts/${billId}`);
        setDraft(draft);
  
      } catch (err) {
        console.error("Failed to load bill", err);
      }
    }
  
    load();
  }, [billId, isReadOnly]);
  
  useEffect(() => {
    async function loadDropdowns() {
      try {
        const propList = await fetchJSON("/properties");
  
        // 🔥 Print raw response EXACTLY as received
        console.log("RAW /properties RESPONSE:", propList);
  
        // 🔥 Correct mapping using lowercase field names from backend
        const formatted = propList.map((p: any) => ({
          id: p.id,
          name: p.name || p.address_line1 || `Property ${p.id}`,
          property_type: p.property_type ?? null,
        }));
  
        // 🔥 Print formatted mapping so you can confirm it's correct
        console.log("FORMATTED properties:", formatted);
  
        setProperties(formatted);
  
        // 🔥 Build lookup dictionary: { "Property Name": id }
        const dict: Record<string, number> = {};
        formatted.forEach((p) => {
          dict[p.name] = p.id;
        });
  
        console.log("PROPERTY MAP (name → id):", dict);
  
        setPropertyMap(dict);
        
      } catch (err) {
        console.error("Failed loading vendors/properties", err);
      }
    }
  
    loadDropdowns();
  }, []);

  const fetchVendorsPage = useCallback(
    async (search: string, offset: number, append: boolean) => {
      const requestId = ++vendorRequestIdRef.current;
      setVendorLoading(true);

      try {
        const params = new URLSearchParams();
        params.set("limit", vendorPageSize.toString());
        if (offset > 0) params.set("offset", offset.toString());

        const trimmed = search.trim();
        if (trimmed) params.set("search", trimmed);

        const vendorList = await fetchJSON(`/vendors?${params.toString()}`);

        if (requestId !== vendorRequestIdRef.current) return;

        setVendors((prev) => (append ? [...prev, ...vendorList] : vendorList));
        setVendorHasMore(vendorList.length === vendorPageSize);
        setVendorOffset(offset + vendorList.length);
      } catch (err) {
        if (requestId !== vendorRequestIdRef.current) return;
        console.error("Failed loading vendors", err);
        if (!append) {
          setVendors([]);
        }
        setVendorHasMore(false);
      } finally {
        if (requestId === vendorRequestIdRef.current) {
          setVendorLoading(false);
        }
      }
    },
    [vendorPageSize],
  );

  useEffect(() => {
    if (!isVendorDropdownOpen) return;

    const timeoutId = window.setTimeout(() => {
      fetchVendorsPage(vendorSearch, 0, false);
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [vendorSearch, isVendorDropdownOpen, fetchVendorsPage]);

  useEffect(() => {
    if (!selectedVendor || vendorSearch.trim()) return;
    setVendors((prev) => {
      if (prev.some((vendor) => vendor.id === selectedVendor.id)) {
        return prev;
      }
      return [selectedVendor, ...prev];
    });
  }, [selectedVendor, vendorSearch]);

  // Check vendor compliance when a vendor is selected
  useEffect(() => {
    if (!selectedVendor) {
      setComplianceWarnings([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const docs: { document_type: string }[] = await fetchJSON(
          `/vendors/compliance/docs/${selectedVendor.id}`
        );
        if (cancelled) return;
        const types = new Set(docs.map((d) => d.document_type));
        const missing: string[] = [];
        if (!types.has("certificate_of_insurance")) missing.push("Certificate of Insurance");
        if (!types.has("w9") && !types.has("1099")) missing.push("W-9 / 1099");
        if (!types.has("avm_agreement")) missing.push("AVM Agreement");
        setComplianceWarnings(missing);
      } catch {
        if (!cancelled) setComplianceWarnings([]);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedVendor]);

  const handleVendorScroll = useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      if (!vendorHasMore || vendorLoading) return;

      const target = event.currentTarget;
      if (target.scrollTop + target.clientHeight >= target.scrollHeight - 24) {
        fetchVendorsPage(vendorSearch, vendorOffset, true);
      }
    },
    [vendorHasMore, vendorLoading, vendorSearch, vendorOffset, fetchVendorsPage],
  );
  
  
  

  // useEffect(() => {
  //   if (!draft || vendors.length === 0) return;
  
  //   const vendorId = draft.VendorID;
  //   if (!vendorId) {
  //     setSelectedVendor(null);
  //     return;
  //   }
  
  //   const matchedVendor = vendors.find(
  //     (v) => v.id === vendorId
  //   );
  
  //   setSelectedVendor(matchedVendor || null);
  // }, [draft, vendors]);

  useEffect(() => {
    if (!draft) return;
  
    const bill = draft.ApprovedBill;
    const vendorId = bill?.vendor_id ?? draft.VendorID;
    const vendorName = bill?.vendor_name;
  
    if (!vendorId) {
      setSelectedVendor(null);
      return;
    }
  
    // 1️⃣ Prefer real vendor from dropdown list
    const matchedVendor = vendors.find(v => v.id === vendorId);
    if (matchedVendor) {
      setSelectedVendor(matchedVendor);
      return;
    }
  
    // 2️⃣ Fallback: inject vendor from bill payload
    if (vendorName) {
      setSelectedVendor({
        id: vendorId,
        name: vendorName,
        phone: "",
        email: "",
        notes: "",
      });
      return;
    }
  
    // 3️⃣ Final fallback (should almost never happen)
    setSelectedVendor({
      id: vendorId,
      name: `Vendor #${vendorId}`,
      phone: "",
      email: "",
      notes: "",
    });
  }, [draft, vendors]);
  
  
  
  useEffect(() => {
    if (!draft) return;
  
    // -----------------------------------
    // Approved bill normalization
    // -----------------------------------
    const normalized =
      draft.ApprovedBill
        ? normalizeApprovedBill(draft.ApprovedBill)
        : draft;
  
    const d = normalized.Draft;
    const items = normalized.LineItems || [];
  
    //
    // ---------------------------
    // Vendor
    // ---------------------------
    //
    // if (draft.VendorID) {
    //   const vendor = mockVendors.find(v => v.id === draft.VendorID);
    //   setSelectedVendor(vendor || null);
    // } else {
    //   setSelectedVendor(null);
    // }
  
    //
    // ---------------------------
    // Reference Number (Invoice #)
    // ---------------------------
    //
    setReferenceNumber(d.InvoiceNumber || "");
  
    //
    // ---------------------------
    // Invoice Date (StatementDate in DB)
    // ---------------------------
    //
    if (d.StatementDate) {
      const date = new Date(d.StatementDate);
      setInvoiceDate(date);
      setInvoiceDateInput(format(date, "MM/dd/yyyy"));
    }
  
    //
    // ---------------------------
    // Due Date
    // ---------------------------
    //
    if (d.DueDate) {
      const date = new Date(d.DueDate);
      setDueDate(date);
      setDueDateInput(format(date, "MM/dd/yyyy"));
    }
  
    //
    // ---------------------------
    // Memo
    // ---------------------------
    //
    setMemo(d.Memo || "");
  
    //
    // ---------------------------
    // Line Items
    // ---------------------------
    //
    const formatted = items.map((item: any, idx: number) => ({
      id: idx + 1,
      property: item.PropertyID
        ? item.PropertyID.toString()
        : "",
      unit: item.Unit || "",
      // Prefer the persisted unit_name; fall back to the unit id string only
      // if no name was saved. The id-fallback at least keeps the dropdown
      // from going blank on legacy rows.
      unitName: item.UnitName || item.Unit || "",
      workOrder: item.WorkOrderRef || "",
      description: item.Description || "",
      glAccount: item.GLAccountID
        ? item.GLAccountID.toString()
        : "",
      qboItemId: (item as any).QBOItemID
        ? (item as any).QBOItemID.toString()
        : "",
      qboItemName: (item as any).QBOItemName || "",
      buildiumAccountId: (item as any).BuildiumAccountID
        ? (item as any).BuildiumAccountID.toString()
        : "",
      buildiumAccountName: (item as any).BuildiumAccountName || "",
      upcharge:
        typeof item.UpchargeCents === "number" && item.UpchargeCents > 0
          ? `$${(item.UpchargeCents / 100).toFixed(2)}`
          : "",
      total: item.AmountCents
        ? `$${(item.AmountCents / 100).toFixed(2)}`
        : "",
    }));
    
    setLineItems(formatted);

    // Preload units for properties that already have values
    const propertyIds = new Set(
      formatted.map((li: LineItem) => li.property).filter(Boolean)
    );
    propertyIds.forEach((pid: string) => loadUnitsForProperty(pid));

    //
    // ---------------------------
    // Attachments
    // ---------------------------

    (async () => {
      try {
        // ============================
        // APPROVED BILL (read-only)
        // ============================
        if (draft.ApprovedBill && billId) {
          const attachment: BillAttachment | null = await fetchJSON(
            `/utilities/bills/${billId}/attachment`
          ).catch((err) => {
            return null;
          });
          
          if (attachment?.StoragePath) {
            await loadAttachmentIntoViewer(attachment, setUploadedFiles);
          }
        
          return;
        }
        

        // ============================
        // DRAFT BILL (existing behavior)
        // ============================
        const attachments = normalized.Attachments || [];
        if (attachments.length > 0) {
          await loadAttachmentIntoViewer(attachments[0], setUploadedFiles);
        }
      } catch (err) {
        console.error("Failed loading bill attachment", err);
      }
    })();

    
  
  }, [draft]);
  
  

  const handleCancel = () => {
    closeViewer();
    if (returnTo) {
      navigate(returnTo);
    } else {
      returnToReferrer();
    }
  };

  const handleRecordBill = async () => {
    // 🔹 run all your existing validation logic here first
    const formFieldErrors = new Set<string>();
    let hasErrors = false;
  
    // (validation code stays exactly as-is)
  
    if (hasErrors) {
      setLineItemErrors(lineItemErrors);
      return;
    }
  
    // 🔹 NEW BILL: Save is a no-op (Approve is what persists)
    if (!billId) {
      if (returnTo) {
        navigate(returnTo);
      } else {
        returnToReferrer();
      }
      return;
    }

    try {
      const payload = buildPatchPayload();

      console.log("PATCH PAYLOAD:", payload);

      await fetchJSON(`/vendors/bill-drafts/${billId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });

      if (returnTo) {
        navigate(returnTo);
      } else {
        returnToReferrer();
      }
    } catch (err) {
      console.error("Failed to update bill draft:", err);
    }
  };
  
  
  // const handleApproveBill = async () => {
  //   // validation stays the same as handleRecordBill
  //   const formFieldErrors = new Set<string>();
  //   let hasErrors = false;
  
  //   const patchPayload = buildPatchPayload(); // existing function
  
  //   // --------------------------
  //   // 1. Validate again before approving
  //   // --------------------------
  //   if (!patchPayload.vendor_id) {
  //     formFieldErrors.add("vendor_id");
  //     hasErrors = true;
  //   }
  
  //   if (!patchPayload.statement_date) {
  //     formFieldErrors.add("statement_date");
  //     hasErrors = true;
  //   }
  
  //   if (!patchPayload.due_date) {
  //     formFieldErrors.add("due_date");
  //     hasErrors = true;
  //   }
  
  //   if (!patchPayload.line_items || patchPayload.line_items.length === 0) {
  //     alert("A bill must have at least one line item.");
  //     hasErrors = true;
  //   }
  
  //   if (hasErrors) {
  //     setLineItemErrors(lineItemErrors);
  //     return;
  //   }
  
  //   try {
  //     let approvedBillId: number;
  
  //     // =====================================================
  //     // 🧾 EXISTING DRAFT BILL FLOW (UNCHANGED)
  //     // =====================================================
  //     if (billId) {
  //       // --------------------------
  //       // 2. PATCH the draft
  //       // --------------------------
  //       await fetchJSON(`/vendors/bill-drafts/${billId}`, {
  //         method: "PATCH",
  //         body: JSON.stringify(patchPayload),
  //       });
  
  //       // --------------------------
  //       // 3. APPROVE the draft
  //       // --------------------------
  //       const approvePayload = {
  //         pdf_object_key: uploadedPdfMeta?.pdf_object_key,
  //         sha256_pdf: uploadedPdfMeta?.sha256_pdf,
  //         vendor_id: patchPayload.vendor_id,
  //         invoice_number: patchPayload.invoice_number,
  //         statement_date: patchPayload.statement_date,
  //         due_date: patchPayload.due_date,
  //         memo: patchPayload.memo,
  
  //         line_items: patchPayload.line_items.map((li) => ({
  //           line_id: li.line_id,                         // REQUIRED
  //           property_id: li.property_id ?? null,         // number | null
  //           unit: li.unit || "",
  //           work_order_ref: li.work_order_ref || "",
  //           gl_account_id: li.gl_account_id || "",
  //           gl_account_name: li.gl_account_name || "",
  //           description: li.description || "",
  //           amount_cents: Number(li.amount_cents) || 0,  // int64
  //         })),
  //       };
  
  //       const approveRes = await fetchJSON(
  //         `/vendors/bill-drafts/${billId}/approve`,
  //         {
  //           method: "POST",
  //           body: JSON.stringify(approvePayload),
  //         }
  //       );
  
  //       approvedBillId = approveRes?.bill_id;
  //     }
  
  //     // =====================================================
  //     // 🆕 NEW MANUAL BILL FLOW (ADDITIVE)
  //     // =====================================================
  //     else {
  //       if (!uploadedPdfMeta) {
  //         alert("Please upload a PDF before approving.");
  //         return;
  //       }
  
  //       const createRes = await fetchJSON(`/vendors/bills/manual`, {
  //         method: "POST",
  //         body: JSON.stringify({
  //           ...patchPayload,
  //           pdf_object_key: uploadedPdfMeta.pdf_object_key,
  //           sha256_pdf: uploadedPdfMeta.sha256_pdf,
  //         }),
  //       });
  
  //       approvedBillId = createRes?.bill_id;
  //     }
  
  //     if (!approvedBillId) {
  //       throw new Error("Approve succeeded but bill_id missing from response");
  //     }
  
  //     // --------------------------
  //     // 4. PUSH bill to Buildium
  //     // --------------------------
  //     await fetchJSON(`/vendors/bills/${approvedBillId}/push`, {
  //       method: "POST",
  //     });
  
  //     // --------------------------
  //     // 5. Notify Bills page
  //     // --------------------------
  //     window.dispatchEvent(
  //       new CustomEvent("billApproved", {
  //         detail: {
  //           billId: approvedBillId,
  //           timestamp: Date.now(),
  //         },
  //       })
  //     );
  
  //     // --------------------------
  //     // 6. Close modal
  //     // --------------------------
  //     navigate(-1);
  //   } catch (err) {
  //     console.error("Failed to approve and export bill:", err);
  //     alert("Bill was approved, but exporting to Buildium may have failed.");
  //   }
  // };

  const [createdBillId, setCreatedBillId] = useState<number | null>(null);
  const effectiveBillId = billId ?? createdBillId;
  const [isExporting, setIsExporting] = useState(false);

  const handleApproveBill = async () => {
    if (isExporting) return;
    const formFieldErrors = new Set<string>();
    let hasErrors = false;
  
    const patchPayload = buildPatchPayload();
  
    const liErrors: { [key: number]: Set<string> } = {};
    for (let i = 0; i < patchPayload.line_items.length; i++) {
      const li = patchPayload.line_items[i];
      const errs = new Set<string>();
      if (!li.property_id) errs.add("property");
      // GL ref is satisfied by any of the three variants:
      //   gl_account_id (legacy/AVMRE), qbo_item_id (Concierge),
      //   buildium_account_id (non-Concierge CSV-direct).
      // Backend enforces XOR.
      if (!li.gl_account_id && !li.qbo_item_id && !li.buildium_account_id) {
        errs.add("glAccount");
      }
      if (errs.size > 0) liErrors[i] = errs;
    }
    if (Object.keys(liErrors).length > 0) {
      setFormErrors(new Set(["lineItems"]));
      setLineItemErrors(liErrors);
      // Build a readable message
      const missingFields: string[] = [];
      const allErrs = new Set(Object.values(liErrors).flatMap((s) => [...s]));
      if (allErrs.has("property")) missingFields.push("Property");
      if (allErrs.has("glAccount")) missingFields.push("GL Account");
      alert(`Please select a ${missingFields.join(" and ")} for each line item before approving.`);
      return;
    }
    // --------------------------
    // 1. Validate required fields
    // --------------------------
    if (!patchPayload.vendor_id) {
      formFieldErrors.add("vendor");
      hasErrors = true;
    }
  
    if (!patchPayload.statement_date) {
      formFieldErrors.add("invoiceDate");
      hasErrors = true;
    }
  
    if (!patchPayload.due_date) {
      formFieldErrors.add("dueDate");
      hasErrors = true;
    }
  
    if (!patchPayload.line_items || patchPayload.line_items.length === 0) {
      alert("A bill must have at least one line item.");
      hasErrors = true;
    }
  
    if (hasErrors) {
      setFormErrors(formFieldErrors);
      return;
    }

    setIsExporting(true);
    try {
      let approvedBillId: number | null = null;
  
      // =====================================================
      // 🧾 FLOW 1: EXISTING BILL DRAFT
      // =====================================================
      if (isEditingDraft) {
        // 1️⃣ Update the draft
        await fetchJSON(`/vendors/bill-drafts/${billId}`, {
          method: "PATCH",
          body: JSON.stringify(patchPayload),
        });
  

        const firstPropertyId = patchPayload.line_items[0]?.property_id;

        if (!firstPropertyId) {
          throw new Error("Approve failed: missing property_id");
        }
        // 2️⃣ Approve the draft
        const approvePayload = {
          pdf_object_key: uploadedPdfMeta?.pdf_object_key ?? null,
          sha256_pdf: uploadedPdfMeta?.sha256_pdf ?? null,
          vendor_id: patchPayload.vendor_id,
          invoice_number: patchPayload.invoice_number,
          statement_date: patchPayload.statement_date,
          due_date: patchPayload.due_date,
          memo: patchPayload.memo,
          property_id: Number(firstPropertyId),

          line_items: patchPayload.line_items.map((li) => ({
            line_id: li.line_id,
            property_id: Number(li.property_id),      // 🔒 never null
            unit: li.unit || "",
            // buildLineItemPayload already paired unit with unit_name; pass
            // it through so the dropdown can re-render the saved selection.
            unit_name: (li as any).unit_name || "",

            gl_account_id: li.gl_account_id,           // 🔒 already validated
            gl_account_name: li.gl_account_name,

            description: li.description || "",
            amount_cents: Number(li.amount_cents),
            upcharge_cents: Number(li.upcharge_cents ?? 0),
          })),
        };
  
        const approveRes = await fetchJSON(
          `/vendors/bill-drafts/${billId}/approve`,
          {
            method: "POST",
            body: JSON.stringify(approvePayload),
          }
        );
  
        approvedBillId = approveRes?.bill_id;
      }
  
      // =====================================================
      // 🆕 FLOW 2: BRAND-NEW MANUAL BILL
      // =====================================================
      else {
        if (!uploadedPdfMeta) {
          alert("Please upload a PDF before approving.");
          return;
        }
  
        // =====================================================
        // 🆕 FLOW: CREATE MANUAL BILL FIRST
        // =====================================================
        const createRes = await fetchJSON(`/vendors/bills`, {
          method: "POST",
          body: JSON.stringify({
            ...patchPayload,
            pdf_object_key: uploadedPdfMeta.pdf_object_key,
            sha256_pdf: uploadedPdfMeta.sha256_pdf,
          }),
        });

        if (!createRes?.bill_id) {
          throw new Error("Bill creation failed: bill_id missing");
        }

        approvedBillId = createRes.bill_id;
        setCreatedBillId(approvedBillId);

      }
  
      if (!approvedBillId) {
        throw new Error("Approve succeeded but bill_id missing from response");
      }
  
      // =====================================================
      // 🚀 PUSH TO BUILDIUM
      // =====================================================
      await fetchJSON(`/vendors/bills/${approvedBillId}/push`, {
        method: "POST",
      });

      // Link bill to work order if we came from a work order page
      if (workOrderId) {
        try {
          await fetchJSON(`/maintenance/work-orders/id/${workOrderId}/bill`, {
            method: "POST",
            body: JSON.stringify({ bill_id: approvedBillId }),
          });
        } catch (linkErr) {
          console.error("Failed to link bill to work order:", linkErr);
        }
      }

      // Notify Bills page
      window.dispatchEvent(
        new CustomEvent("billApproved", {
          detail: {
            billId: approvedBillId,
            timestamp: Date.now(),
          },
        })
      );
  
      // Close page. When we came from the reconciliation workspace, return the
      // new bill id + statement row so it can auto-pay from the card + pair.
      if (returnTo) {
        navigate(
          returnTo,
          reconcileContext
            ? {
                state: {
                  reconcilePay: {
                    billId: approvedBillId,
                    statementRow: reconcileContext.statementRow,
                  },
                },
              }
            : undefined,
        );
      } else {
        returnToReferrer();
      }

    } catch (err: any) {
      console.error("Failed to approve and export bill:", err);
      // Backend deletes the bill row on terminal push failure so the platform
      // mirrors QBO+Buildium — reset local state so any retry creates a fresh
      // row instead of pointing at a deleted id.
      setCreatedBillId(null);
      const raw = err?.message || err?.error || String(err);
      const lower = raw.toLowerCase();

      // Surface the backend message verbatim by default — the dual-push
      // handler returns actionable text (e.g. "GL account 'Pest Control'
      // (coa.id=139) has no buildium_id mapped — set chart_of_accounts.buildium_id
      // for this account before pushing"). Only override for specific cases
      // where the backend message is unhelpful or needs context.
      let userMsg: string;
      if (lower.includes("memo") && lower.includes("exceed") || lower.includes("memo") && lower.includes("240")) {
        userMsg = "The line item description is too long for Buildium (max 240 characters). Please shorten the description and try again.";
      } else if (lower.includes("inactive vendor")) {
        userMsg = "This vendor is inactive in Buildium. Reactivate the vendor in Buildium before recording this bill — the bill was not saved.";
      } else if (lower.includes("buildium unit")) {
        userMsg = "Invalid Buildium unit mapping — please update the unit in Buildium before exporting.";
      } else if (lower.includes("attachment failed")) {
        userMsg = "Bill was created, but the PDF attachment failed to upload. You can attach it manually in QBO/Buildium.";
      } else {
        userMsg = `Push failed.\n\n${raw}`;
      }

      alert(userMsg);
    } finally {
      setIsExporting(false);
    }
  };
  
  
  
  

  const handleInvoiceDateChange = (date: Date | null) => {
    setInvoiceDate(date);
    if (date) {
      setInvoiceDateInput(format(date, "MM/dd/yyyy"));
      setInvoiceDateError("");
      setFormErrors((prev) => {
        const newErrors = new Set(prev);
        newErrors.delete("invoiceDate");
        return newErrors;
      });
    } else {
      setInvoiceDateInput("");
    }
  };

  const handleDueDateChange = (date: Date | null) => {
    setDueDate(date);
    if (date) {
      setDueDateInput(format(date, "MM/dd/yyyy"));
      setDueDateError("");
      setFormErrors((prev) => {
        const newErrors = new Set(prev);
        newErrors.delete("dueDate");
        return newErrors;
      });
    } else {
      setDueDateInput("");
    }
  };

  // Add Escape key handler for file viewer
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && viewingFileUrl) {
        closeViewer();
      }
    };

    window.addEventListener("keydown", handleEscapeKey);
    return () => window.removeEventListener("keydown", handleEscapeKey);
  }, [viewingFileUrl]);

  // Effect to measure widths whenever lineItems change
  useEffect(() => {
    const timer = setTimeout(() => {
      measureAndUpdateColumnWidths();
    }, 50);

    return () => clearTimeout(timer);
  }, [lineItems, measureAndUpdateColumnWidths]);

  // Auto-open PDF if there's a pre-loaded attachment (read-only or draft)
  useEffect(() => {
    if (uploadedFiles.length === 1 && !viewingFileUrl) {
      const file = uploadedFiles[0].file;
      const preview = (file as any).preview;
      if (preview) {
        setViewingFileUrl(preview);
        setViewingFileIndex(0);
      }
    }
  }, [uploadedFiles, viewingFileUrl]);
  

  // const handleUpdateLineItem = (id: number, field: string, value: string) => {
  //   setLineItems((prev) =>
  //     prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
  //   );
  //   // Clear error for this field when user updates it
  //   setLineItemErrors((prev) => {
  //     const itemErrors = new Set(prev[id]);
  //     itemErrors.delete(field);
  //     if (itemErrors.size === 0) {
  //       const newErrors = { ...prev };
  //       delete newErrors[id];
  //       return newErrors;
  //     }
  //     return { ...prev, [id]: itemErrors };
  //   });
  //   // Measure immediately on update
  //   setTimeout(() => {
  //     measureAndUpdateColumnWidths();
  //   }, 50);
  // };

  const handleUpdateLineItem = (id: number, field: string, value: string) => {
    setLineItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        const updated = { ...item, [field]: value };

        // When property changes → clear unit + load units for new property.
        // Concierge properties (property_type === 'C') only ever record at the
        // property level, so default the unit to the "__property__" marker.
        // Also clear the GL refs that the *new* picker won't be writing to —
        // Concierge uses qbo_item_id, non-Concierge uses buildium_account_id,
        // and gl_account_id is the legacy/AVMRE path neither variant feeds.
        if (field === "property") {
          const selectedProp = properties.find((p) => String(p.id) === value);
          if (selectedProp?.property_type === "C") {
            updated.unit = "__property__";
            updated.unitName = "Property Level";
            updated.glAccount = "";
            updated.buildiumAccountId = "";
            updated.buildiumAccountName = "";
          } else {
            updated.unit = "";
            updated.unitName = "";
            updated.glAccount = "";
            updated.qboItemId = "";
            updated.qboItemName = "";
          }
          loadUnitsForProperty(value);
        }

        return updated;
      })
    );
  
    // Clear validation error
    setLineItemErrors((prev) => {
      const itemErrors = new Set(prev[id]);
      itemErrors.delete(field);
      if (itemErrors.size === 0) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return { ...prev, [id]: itemErrors };
    });
  
    // Re-measure column widths
    setTimeout(() => {
      measureAndUpdateColumnWidths();
    }, 50);
  };
  

  const handleDeleteLineItem = (id: number) => {
    setLineItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleAddLineItem = () => {
    const newId =
      lineItems.length > 0
        ? Math.max(...lineItems.map((item) => item.id)) + 1
        : 1;
    setLineItems((prev) => [
      ...prev,
      {
        id: newId,
        property: "",
        unit: "",
        unitName: "",
        workOrder: "",
        description: "",
        glAccount: "",
        upcharge: "",
        total: "",
      },
    ]);
  };

  const [uploadedPdfMeta, setUploadedPdfMeta] = useState<{
    pdf_object_key: string;
    sha256_pdf: string;
  } | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  // True while POST /vendors/bills/parse-pdf is in flight. Drives the
  // small "Parsing bill…" indicator next to the file row.
  const [parsingBill, setParsingBill] = useState(false);

  const ACCEPTED_FILE_TYPES = [".pdf", ".jpg", ".jpeg", ".png", ".msg", ".eml"];
  const isAcceptedFile = (file: File) => {
    const name = file.name.toLowerCase();
    return ACCEPTED_FILE_TYPES.some((ext) => name.endsWith(ext)) ||
      ["application/pdf", "image/jpeg", "image/png", "application/vnd.ms-outlook", "message/rfc822"].includes(file.type);
  };

  const isImageFile = (file: File) => {
    const name = file.name.toLowerCase();
    return [".jpg", ".jpeg", ".png"].some((ext) => name.endsWith(ext)) ||
      ["image/jpeg", "image/png"].includes(file.type);
  };

  const isMessageFile = (file: File) => {
    const name = file.name.toLowerCase();
    return name.endsWith(".msg") || name.endsWith(".eml");
  };

  // applyParsedBill takes the JSON shape returned by /vendors/bills/parse-pdf
  // and overwrites the matching form fields. Per the "always overwrite" rule,
  // every field that the parser returns replaces whatever the user had typed.
  // Fields the parser couldn't determine (empty strings / null) are left
  // alone so we don't blank out user input.
  const applyParsedBill = (parsed: {
    vendor_name?: string;
    vendor_id?: number | null;
    reference_number?: string;
    invoice_date?: string;
    due_date?: string;
    line_items?: Array<{
      description?: string;
      amount_cents?: number;
      property_id?: number | null;
      gl_account_id?: number | null;
    }>;
    parse_confidence?: number;
  }) => {
    if (!parsed) return;

    if (parsed.reference_number) {
      setReferenceNumber(parsed.reference_number);
    }
    if (parsed.invoice_date) {
      const d = new Date(parsed.invoice_date);
      if (!isNaN(d.getTime())) {
        setInvoiceDate(d);
        setInvoiceDateInput(format(d, "MM/dd/yyyy"));
        setInvoiceDateError("");
      }
    }
    if (parsed.due_date) {
      const d = new Date(parsed.due_date);
      if (!isNaN(d.getTime())) {
        setDueDate(d);
        setDueDateInput(format(d, "MM/dd/yyyy"));
        setDueDateError("");
      }
    }
    if (parsed.vendor_id != null) {
      const matched = vendors.find((v) => v.id === parsed.vendor_id);
      if (matched) {
        setSelectedVendor(matched);
      }
    }

    if (Array.isArray(parsed.line_items) && parsed.line_items.length > 0) {
      const formatTotal = (cents: number | undefined): string => {
        if (!cents || cents <= 0) return "";
        return `$${(cents / 100).toFixed(2)}`;
      };
      const newLines: LineItem[] = parsed.line_items.map((li, idx) => ({
        id: Date.now() + idx,
        property: li.property_id != null ? String(li.property_id) : "",
        unit: "",
        unitName: "",
        description: li.description ?? "",
        glAccount:
          li.gl_account_id != null ? String(li.gl_account_id) : "",
        upcharge: "",
        total: formatTotal(li.amount_cents),
      }));
      setLineItems(newLines);
    }

    if (
      typeof parsed.parse_confidence === "number" &&
      parsed.parse_confidence < 50
    ) {
      toast.warning(
        `Low-confidence parse (${parsed.parse_confidence}%) — please double-check the auto-filled fields.`,
      );
    }
  };

  const processFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const rawFile = Array.from(files).find(isAcceptedFile) ?? files[0];
    let fileToStore = rawFile;
    let fileToUpload = rawFile;

    if (isImageFile(rawFile)) {
      try {
        fileToUpload = await convertFiletoPdf(rawFile);
        fileToStore = rawFile;
        (rawFile as any).preview = URL.createObjectURL(rawFile);
      } catch (err) {
        console.error("Failed to convert image to PDF:", err);
        alert("Failed to convert image to PDF");
        return;
      }
    } else {
      const preview = URL.createObjectURL(rawFile);
      (rawFile as any).preview = preview;
    }

    setUploadedFiles([
      {
        name: rawFile.name.replace(/\.[^.]*$/, ""),
        size: rawFile.size,
        file: fileToStore,
      },
    ]);

    if (!billId) {
      try {
        const formData = new FormData();
        formData.append("file", fileToUpload);

        const res = await authFetch("/vendors/bills/upload-pdf", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(errText || "Upload failed");
        }

        const data = await res.json();
        setUploadedPdfMeta({
          pdf_object_key: data.pdf_object_key,
          sha256_pdf: data.sha256_pdf,
        });

        // Auto-parse PDFs and images. .msg/.eml never reach this branch
        // because they were converted to PDFs above only if they were
        // images; .msg/.eml uploads skip the parser entirely.
        const lowerName = rawFile.name.toLowerCase();
        const isParseable =
          lowerName.endsWith(".pdf") ||
          lowerName.endsWith(".jpg") ||
          lowerName.endsWith(".jpeg") ||
          lowerName.endsWith(".png");
        if (isParseable) {
          setParsingBill(true);
          try {
            const parsed = await fetchJSON("/vendors/bills/parse-pdf", {
              method: "POST",
              body: JSON.stringify({ pdf_object_key: data.pdf_object_key }),
            });
            applyParsedBill(parsed);
          } catch (parseErr) {
            console.error("Bill parse failed:", parseErr);
            toast.error(
              parseErr instanceof Error
                ? `Bill parse failed: ${parseErr.message}`
                : "Bill parse failed",
            );
          } finally {
            setParsingBill(false);
          }
        }
      } catch (err) {
        console.error("Upload failed:", err);
        alert(err instanceof Error ? err.message : "Upload failed");
      }
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    await processFiles(files);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    const files = e.dataTransfer.files;
    if (files?.length) {
      await processFiles(files);
    }
  };
  
  

  const handleRemoveFile = (index: number) => {
    setUploadedFiles((prev) => {
      const file = prev[index]?.file;
      const preview = (file as any)?.preview;
      if (preview) {
        URL.revokeObjectURL(preview);
      }
      const next = prev.filter((_, i) => i !== index);
      // When the last file is gone, clear the matching server-side
      // upload meta so a fresh upload doesn't re-use the stale object_key.
      if (next.length === 0) {
        setUploadedPdfMeta(null);
      }
      return next;
    });
  };
  
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + sizes[i];
  };

  const handleViewFile = (file: File) => {
    const index = uploadedFiles.findIndex((f) => f.file === file);
    const fileName = file.name || "";
    const isMsg = fileName.toLowerCase().endsWith(".msg");
    const isEml = fileName.toLowerCase().endsWith(".eml");
    const isMessageFile = isMsg || isEml;
    const parseMessage = isEml ? parseEmlFile : parseMsgFile;

    if (isMessageFile) {
      setMsgViewer({
        isOpen: true,
        title: fileName || "Message",
        data: null,
        loading: true,
        error: null,
      });
      parseMessage(file)
        .then((data) =>
          setMsgViewer((prev) => ({
            ...prev,
            loading: false,
            data,
            error: null,
          }))
        )
        .catch((err) =>
          setMsgViewer((prev) => ({
            ...prev,
            loading: false,
            error: err instanceof Error ? err.message : "Failed to load message",
          }))
        );
      return;
    }

    const preview = (file as any).preview;
    if (!preview) return;

    setViewingFileUrl(preview);
    setViewingFileIndex(index);
  };
  
  const closeViewer = () => {
    setViewingFileUrl(null);
    setViewingFileIndex(null);
  };
  

  const handleDownloadFile = () => {
    if (viewingFileIndex !== null && uploadedFiles[viewingFileIndex]) {
      const file = uploadedFiles[viewingFileIndex];
      const preview = (file.file as any).preview;
      if (!preview) return;
      const a = document.createElement("a");
      a.href = preview;
      a.download =
        file.name +
        (file.name.endsWith(".pdf") ||
        file.name.endsWith(".jpg") ||
        file.name.endsWith(".png")
          ? ""
          : ".pdf");
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(preview);
    }
  };

  const handleDeleteFile = () => {
    if (viewingFileIndex !== null) {
      handleRemoveFile(viewingFileIndex);
      closeViewer();
    }
  };

  const calculateTotal = (): string => {
    const total = lineItems.reduce((sum, item) => {
      const value = parseFloat(
        item.total.replace("$", "").replace(",", "") || "0",
      );
      return sum + value;
    }, 0);
    return `$${total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };


  const loadUnitsForProperty = useCallback(
    async (propertyIdStr: string) => {
      const propertyId = Number(propertyIdStr);
      if (!propertyId) return;
      if (unitsByProperty[propertyIdStr]) return; // already loaded

      try {
        const list = await fetchJSON(`/properties/${propertyId}/units`);
        const units: PropertyUnit[] = (list || []).map((u: any) => ({
          id: u.id,
          property_id: u.property_id,
          buildium_unit_id: u.buildium_unit_id ?? null,
          unit_name: u.unit_name,
        }));
        setUnitsByProperty((prev) => ({
          ...prev,
          [propertyIdStr]: units,
        }));
      } catch (err) {
        console.error("Failed loading units for property", propertyId, err);
      }
    },
    [unitsByProperty]
  );

  // Preload units for the property prefilled from the route, so the Unit
  // dropdown is ready immediately when launched from a property's Bills tab.
  useEffect(() => {
    if (routePropertyId && !isReadOnly && !isEditingDraft) {
      loadUnitsForProperty(routePropertyId);
    }
  }, [routePropertyId, isReadOnly, isEditingDraft, loadUnitsForProperty]);

  const loadWorkOrdersForProperty = useCallback(
    async (propertyIdStr: string) => {
      const propertyId = Number(propertyIdStr);
      if (!propertyId) return;
  
      const list = await fetchJSON(
        `/maintenance/work-orders?property_id=${propertyId}`
      );
  
      const normalized = list.map((wo: any) => ({
        id: wo.ID,
        number: wo.Number || wo.WorkOrderRef || `WO-${wo.ID}`,
      }));
  
      setWorkOrdersByProperty((prev) => ({
        ...prev,
        [propertyIdStr]: normalized,
      }));
    },
    [properties]
  );
  
  

  const buildLineItemPayload = () => {
    return lineItems.map((item) => {
      const property_id = Number(item.property) || 0;
      const gl = glAccountOptions.find(
        (g) => g.id.toString() === item.glAccount
      );

      const sanitizedUnit =
        item.unit === "__property__" || item.unit?.startsWith("internal-")
          ? ""
          : item.unit || "";

      // Three GL-ref variants, exactly one populated per line:
      //   qbo_item_id          — Concierge (QBO + Buildium dual-push)
      //   buildium_account_id  — non-Concierge (Buildium-only, CSV-sourced)
      //   gl_account_id        — legacy / AVMRE overhead (canonical COA)
      // Backend enforces XOR.
      const usesQboItem = Boolean(item.qboItemId);
      const usesBuildiumDirect = !usesQboItem && Boolean(item.buildiumAccountId);
      return {
        line_id: item.id,
        property_id,
        unit: sanitizedUnit,
        // Persist the display name alongside the id so the dropdown can
        // re-render the selection on reload even when /properties/{id}/units
        // returns an empty list (some concierge properties have no synced
        // unit data) or the async units fetch hasn't landed yet.
        unit_name: sanitizedUnit ? item.unitName || "" : "",

        gl_account_id:
          usesQboItem || usesBuildiumDirect ? "" : gl?.id.toString() || "",
        gl_account_name:
          usesQboItem || usesBuildiumDirect ? "" : gl?.name || "",
        qbo_item_id: usesQboItem ? item.qboItemId! : "",
        qbo_item_name: usesQboItem ? item.qboItemName || "" : "",
        buildium_account_id: usesBuildiumDirect ? item.buildiumAccountId! : "",
        buildium_account_name: usesBuildiumDirect ? item.buildiumAccountName || "" : "",

        description: item.description || "",
        // Send upcharge alongside amount_cents (base). Backend stores both on
        // bills.line_items JSONB; QBO/Buildium push reads amount_cents only;
        // the owner invoice adds upcharge_cents on top of amount_cents.
        amount_cents: toCents(item.total),
        upcharge_cents: toCents(item.upcharge),
      };
    });
  };
  

  const buildPatchPayload = () => {
    const firstPropertyId = lineItems[0]?.property;

    if (!firstPropertyId) {
      throw new Error("Patch failed: missing property_id");
    }
    // Debugging log removed
    return {
      vendor_id: selectedVendor ? selectedVendor.id : null,
      property_id: Number(firstPropertyId), // not per-line — backend ignores this for line items
      invoice_number: referenceNumber || null,
      statement_date: invoiceDate ? invoiceDate.toISOString() : null,
      due_date: dueDate ? dueDate.toISOString() : null,
      memo: memo || null,

      // The important part:
      line_items: buildLineItemPayload(),
    };
  };

  // handleSaveAndReexport applies an edit to an already-pushed bill via
  // PATCH /vendors/bills/{id}. The backend dual-pushes to QBO (sparse update)
  // and Buildium (PUT). If Buildium rejects (e.g. for a paid bill with a
  // vendor change), QBO is rolled back, local DB is reverted, and the user
  // sees Buildium's UserMessage verbatim.
  const handleSaveAndReexport = async () => {
    if (!billId) {
      toast.error("Cannot save: missing bill id");
      return;
    }
    setSavingEdit(true);
    try {
      const fullPayload = buildPatchPayload();

      // The backend expects YYYY-MM-DD for statement_date / due_date.
      // buildPatchPayload returns ISO with time; the Postgres ::date cast
      // accepts both, but normalize anyway so the SparseUpdateBill payload
      // sent to QBO uses TxnDate=YYYY-MM-DD (QBO format).
      const ymd = (iso: string | null): string | null => {
        if (!iso) return null;
        const m = /^(\d{4}-\d{2}-\d{2})/.exec(iso);
        return m ? m[1] : iso;
      };

      // Pass through the FULL line item shape — backend persists this verbatim
      // to bills.line_items JSONB. Stripping fields here wipes them from the
      // row on every edit and breaks downstream readers.
      //
      // IMPORTANT: use raw item.unit (not the stripped li.unit from
      // buildLineItemPayload). The stripper drops "__property__" and
      // "internal-XX" — those are valid form selections and need to round-
      // trip so the dropdown shows the right value on next load. The
      // Buildium publisher tolerates these sentinels and maps them to
      // "no unit" at push time.
      const patchBody = {
        vendor_id: fullPayload.vendor_id,
        property_id: fullPayload.property_id,
        invoice_number: fullPayload.invoice_number,
        statement_date: ymd(fullPayload.statement_date),
        due_date: ymd(fullPayload.due_date),
        memo: fullPayload.memo,
        line_items: lineItems.map((item, idx) => {
          const gl = glAccountOptions.find(
            (g) => g.id.toString() === item.glAccount,
          );
          const usesQboItem = Boolean(item.qboItemId);
          const usesBuildiumDirect =
            !usesQboItem && Boolean(item.buildiumAccountId);
          return {
            line_id: item.id ?? idx + 1,
            property_id: Number(item.property) || 0,
            unit: item.unit || "",
            unit_name: item.unitName || "",
            work_order_ref: item.workOrder || "",
            description: item.description || "",
            gl_account_id:
              usesQboItem || usesBuildiumDirect ? "" : gl?.id.toString() || "",
            gl_account_name:
              usesQboItem || usesBuildiumDirect ? "" : gl?.name || "",
            qbo_item_id: usesQboItem ? item.qboItemId! : "",
            qbo_item_name: usesQboItem ? item.qboItemName || "" : "",
            buildium_account_id: usesBuildiumDirect ? item.buildiumAccountId! : "",
            buildium_account_name: usesBuildiumDirect
              ? item.buildiumAccountName || ""
              : "",
            amount_cents: toCents(item.total),
            upcharge_cents: toCents(item.upcharge),
          };
        }),
      };

      const res = await fetchJSON(`/vendors/bills/${billId}`, {
        method: "PATCH",
        body: JSON.stringify(patchBody),
      });

      toast.success(
        res?.no_op
          ? "No changes to save"
          : "Bill updated and re-exported to QuickBooks + Buildium",
      );
      setEditing(false);
    } catch (err: any) {
      // Backend surfaces Buildium error UserMessage verbatim (e.g.
      // "Buildium rejected the edit: <message> — qbo + local reverted").
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg, { duration: 10000 });
    } finally {
      setSavingEdit(false);
    }
  };


  return (
    <div
      className="bg-white flex flex-col font-[Geist,-apple-system,Roboto,Helvetica,sans-serif] relative"
      style={{
        display: "flex",
        backgroundColor: "rgb(255, 255, 255)",
        borderBottom: "1.33333px solid rgb(210, 209, 207)",
        borderLeft: "1px solid rgb(210, 209, 207)",
        flexDirection: "column",
        fontWeight: "400",
        flex: 1,
minHeight: 0,
        position: "relative",
      }}
    >
      {/* Two-Column Layout */}
      <div
        className="flex flex-1 overflow-hidden"
        style={{ marginBottom: "72px", minHeight: 0 }}
      >
        {/* Left Column - File Upload (Fixed) */}
        {isLeftPanelOpen && (
          <div
            className="w-1/2 border-r border-[#E5E7EB] flex-shrink-0 overflow-hidden"
            style={{
              alignSelf: "stretch",
              display: "flex",
              flexDirection: "column",
              padding: "12px 32px 24px",
              position: "relative",
            }}
            onWheel={(e) => {
              // Forward scroll events from the left panel to the right panel
              if (rightPanelScrollRef.current) {
                rightPanelScrollRef.current.scrollTop += e.deltaY;
              }
            }}
          >
            {!viewingFileUrl ? (
              <div
                className="flex flex-col flex-1"
                style={{
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {/* File Upload Section */}
                <div
                  className="flex flex-col text-base font-normal flex-1"
                  style={{
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  {uploadedFiles.length === 0 ? (
                    <div
                      className={`rounded-lg bg-white border flex flex-col overflow-hidden justify-center flex-1 transition-colors ${
                        isDragActive
                          ? "border-[#2463eb] border-2 border-dashed bg-[#f0f7ff]"
                          : "border-dashed border-[#121212]/40"
                      }`}
                      style={{ padding: "16px 24px" }}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      <div className="self-center flex flex-col items-center">
                        <div className="flex flex-col items-center p-2.5 text-[#09090B] leading-[1.4] text-center">
                          <div>Choose a file or drag & drop it here</div>
                          <div className="mt-2 max-w-[280px]">
                            PDF, JPEG, PNG, .msg and .eml, up to 50 MB.
                          </div>
                          <div className="mt-0.5">Images are converted to PDF for upload.</div>
                        </div>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="rounded-lg bg-[#FBFBFB] border border-[#DADADA] shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex mt-3 min-h-9 px-3 py-1.5 items-center gap-2 text-[#303030] tracking-[-0.32px] leading-[1.4] justify-center hover:bg-gray-100 transition-colors"
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M14 10V12.6667C14 13.0203 13.8595 13.3594 13.6095 13.6095C13.3594 13.8595 13.0203 14 12.6667 14H3.33333C2.97971 14 2.64057 13.8595 2.39052 13.6095C2.14048 13.3594 2 13.0203 2 12.6667V10M11.3333 5.33333L8 2M8 2L4.66667 5.33333M8 2V10"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          <span>Browse Files</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className={`flex flex-col flex-1 rounded-lg transition-colors ${
                        isDragActive ? "ring-2 ring-[#2463eb] ring-offset-2 bg-[#f0f7ff]/30" : ""
                      }`}
                      style={{
                        padding: "24px 0",
                        overflow: "hidden",
                        display: "flex",
                        flexDirection: "column",
                      }}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      <div className="text-sm text-[#A1A1A9] mb-4">
                        Limited to 10 files. Max file size is 20MB.
                      </div>
                      <div className="text-sm text-[#303030] mb-4">
                        Drag & drop files here or{" "}
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="text-blue-600 hover:underline"
                        >
                          browse
                        </button>
                      </div>
                      <div
                        className="space-y-3 mb-6 flex-1"
                        style={{ overflow: "hidden" }}
                      >
                        {uploadedFiles.map((file, index) => (
                          <div
                            key={index}
                            className="grid grid-cols-[1fr_auto] items-center p-4 bg-gray-50 rounded-lg border border-[#E5E7EB]"
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <svg
                                className="w-5 h-5 text-red-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                                />
                              </svg>
                              <div className="flex-1 min-w-0 overflow-hidden">
                                <div
                                  className="text-sm text-[#303030] whitespace-nowrap"
                                  title={file.name}
                                >
                                  {middleTruncate(file.name, 48)}{" "}
                                  <span className="text-[#A1A1A9]">
                                    ({formatFileSize(file.size)})
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              {parsingBill && (
                                <span className="text-xs text-[#013764] flex items-center gap-1">
                                  <svg
                                    className="w-3 h-3 animate-spin"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                  >
                                    <circle
                                      className="opacity-25"
                                      cx="12"
                                      cy="12"
                                      r="10"
                                      stroke="currentColor"
                                      strokeWidth="4"
                                    ></circle>
                                    <path
                                      className="opacity-75"
                                      fill="currentColor"
                                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    ></path>
                                  </svg>
                                  Parsing bill…
                                </span>
                              )}
                              <button
                                onClick={() => handleViewFile(file.file)}
                                className="text-blue-600 hover:text-blue-700 transition-colors text-sm font-medium"
                                title="View file"
                              >
                                View
                              </button>
                              {!formDisabled && (
                                <button
                                  onClick={() => handleRemoveFile(index)}
                                  className="text-[#A1A1A9] hover:text-[#303030] transition-colors"
                                  title="Remove file"
                                >
                                  <svg
                                    className="w-5 h-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M6 18L18 6M6 6l12 12"
                                    />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      {!formDisabled && (
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="text-blue-600 hover:underline text-sm font-medium text-center flex-shrink-0"
                        >
                          Add more files
                        </button>
                      )}
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.msg,.eml"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              </div>
            ) : (
              <div
                className="flex flex-col flex-1 w-full min-h-0 relative pt-10"
                style={{ display: "flex", flexDirection: "column" }}
              >
                <button
                  onClick={handleDeleteFile}
                  className="absolute top-2 right-2 z-10 rounded-md p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-200/80 transition-colors"
                  title="Delete file"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
                <div className="flex-1 min-h-0 overflow-auto w-full flex flex-col">
                  <iframe
                    src={viewingFileUrl}
                    className="flex-1 w-full min-h-[400px]"
                    style={{
                      width: "100%",
                      height: "100%",
                      minHeight: "400px",
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Collapse Button */}
        <button
          onClick={() => setIsLeftPanelOpen(!isLeftPanelOpen)}
          className="w-6 bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          style={{ height: "25px" }}
          title={isLeftPanelOpen ? "Collapse" : "Expand"}
        >
          <svg
            className="w-4 h-4 text-gray-700"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
          >
            {isLeftPanelOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            )}
          </svg>
        </button>

        {/* Right Column - Scrollable Content */}
        <div
          className="flex flex-col flex-1"
          style={{
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
          }}
        >
          {/* Scrollable Content Area */}
          <div
            ref={rightPanelScrollRef}
            className="overflow-auto"
            style={{
              width: "100%",
              flex: 1,
              overflowX: "auto",
              overflowY: "auto",
              marginBottom: "4px",
              position: "relative",
              minHeight: 0,
            }}
          >
            <div
              className="px-8 py-6"
              style={{
                minWidth: "fit-content",
                padding: "24px 32px 24px 16px",
                position: "relative",
              }}
            >
              {/* Bill Details Section */}
              <div
                className="flex flex-col w-full"
                style={{ marginLeft: "-5px" }}
              >
                {/* Bill Details Header */}
                <div className="flex w-full flex-col text-xl text-[#303030] font-semibold leading-[1.3]">
                  <div>Bill Details</div>
                  <div
                    className="h-px bg-gray-200 mt-5"
                    style={{ width: "790px" }}
                  />
                </div>

                {/* Vendor Compliance Warning */}
                {selectedVendor && complianceWarnings.length > 0 && (
                  <div
                    className="flex items-start gap-2 mt-4 px-4 py-3 rounded-lg border border-amber-300 bg-amber-50 text-sm text-amber-900"
                    style={{ maxWidth: "790px" }}
                  >
                    <span className="mt-0.5 shrink-0">&#9888;</span>
                    <span>
                      <strong>{selectedVendor.name}</strong> is missing: {complianceWarnings.join(", ")}
                    </span>
                  </div>
                )}

                {/* Payment status pill — clickable when paid; opens the
                    full-detail modal. Replaces the older inline banner. */}
                {qboPaymentState.qboPaidAt && (
                  <button
                    type="button"
                    onClick={() => setShowViewPaymentModal(true)}
                    className="self-start inline-flex items-center gap-2 mt-4 px-3 py-1.5 rounded-full border border-emerald-300 bg-emerald-50 text-sm text-emerald-900 hover:bg-emerald-100 transition-colors"
                  >
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="font-medium">
                      Paid{qboPaymentState.qboBalanceCents === 0 ? " in full" : ""}
                    </span>
                    <span className="text-emerald-700 underline-offset-2 underline">
                      View payment
                    </span>
                  </button>
                )}

                {/* Form Fields */}
                <div
                  className="flex mt-3 flex-col gap-5"
                  style={{ width: "600px", alignSelf: "start" }}
                >
                  <div
                    className="flex flex-col"
                    style={{
                      marginRight: "-2px",
                      width: "auto",
                      alignSelf: "start",
                    }}
                    >
                    {/* Vendor and Reference Number Row */}
                    <div
                      className="flex items-end gap-4"
                      style={{ width: "600px" }}
                    >
                      {/* Vendor Select */}
                      <div className="flex flex-col flex-1 min-w-[240px]">
                        <label className="text-[#303030] text-sm font-medium leading-[1.43]">
                          Vendor <span className="text-red-500">*</span>
                        </label>
                        <Select
                          value={selectedVendor?.id.toString() || ""}
                          onValueChange={(vendorId) => {
                            if (!formDisabled) {
                              const vendor = vendors.find(v => v.id.toString() === vendorId);
                              setSelectedVendor(vendor || null);
                              setVendorSearch(""); // ✅ reset search on select
                              setFormErrors(prev => {
                                const next = new Set(prev);
                                next.delete("vendor");
                                return next;
                              });
                            }
                          }}
                          onOpenChange={(open) => {
                            setIsVendorDropdownOpen(open);
                            if (!open) setVendorSearch(""); // ✅ reset on close
                          }}
                          disabled={formDisabled}
                        >
                          <SelectTrigger
                            className={`mt-2 w-full rounded-lg border px-3 py-2 text-base ${
                              formErrors.has("vendor")
                                ? "border-red-500 border-2"
                                : "border-[#E5E5E5]"
                            }`}
                          >
                            <SelectValue placeholder="Select vendor..." />
                          </SelectTrigger>
                          <SelectContent
                              className="bg-white border border-[#E5E7EB] shadow-md p-0"
                              onKeyDown={(e) => {
                                const t = e.target as HTMLElement;
                                if (t.tagName === "INPUT") e.stopPropagation();
                              }}
                          >
                            {/* Search input */}
                            <div className="p-2 border-b border-[#E5E7EB]">
                              <input
                                autoFocus
                                placeholder="Type to search…"
                                value={vendorSearch}
                                onChange={(e) => setVendorSearch(e.target.value)}
                                onKeyDown={(e) => e.stopPropagation()}
                                onFocus={(e) => e.stopPropagation()}
                                className="w-full rounded-md border px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-[#013764]"
                              />
                            </div>

                            {/* Scrollable list */}
                            <div
                              className="max-h-[240px] overflow-y-auto"
                              onScroll={handleVendorScroll}
                            >
                              {vendorLoading && filteredVendors.length === 0 && (
                                <div className="px-3 py-2 text-sm text-gray-400">
                                  Loading vendors…
                                </div>
                              )}
                              {!vendorLoading && filteredVendors.length === 0 && (
                                <div className="px-3 py-2 text-sm text-gray-400">
                                  No vendors found
                                </div>
                              )}

                              {filteredVendors.map((v) => (
                                <SelectItem key={v.id} value={v.id.toString()}>
                                  {v.name}
                                </SelectItem>
                              ))}
                              {vendorLoading && filteredVendors.length > 0 && (
                                <div className="px-3 py-2 text-xs text-gray-400">
                                  Loading more…
                                </div>
                              )}
                              {!vendorLoading && vendorHasMore && filteredVendors.length > 0 && (
                                <div className="px-3 py-2 text-xs text-gray-400">
                                  Scroll to load more
                                </div>
                              )}
                            </div>
                          </SelectContent>
                          


                        </Select>
                      </div>

                      {/* Add Vendor Button (right-aligned) */}
                      {!formDisabled && (
                        <button
                          type="button"
                          onClick={() => setShowAddVendorModal(true)}
                          className="relative top-[-4px] whitespace-nowrap text-[#2563eb] text-sm font-medium hover:underline"
                        >
                          + Add Vendor
                        </button>
                      )}
                    </div>

                  </div>

                  <div className="flex gap-5">
                    <div className="flex-1">
                      <TextField
                        label="Reference Number"
                        value={referenceNumber}
                        onChange={(e) =>
                          !formDisabled && setReferenceNumber(e.target.value)
                        }
                        placeholder="INV-2024-001"
                        disabled={formDisabled}
                      />
                    </div>
                  </div>

                  <div className="flex gap-5">
                    <div className="flex-1">
                      <DateField
                        label="Invoice Date"
                        required
                        value={invoiceDate}
                        onChange={handleInvoiceDateChange}
                        disabled={formDisabled}
                        error={
                          invoiceDateError ||
                          (formErrors.has("invoiceDate")
                            ? "Invoice Date is required"
                            : undefined)
                        }
                        placeholder="mm/dd/yyyy"
                      />
                    </div>
                    <div className="flex-1">
                      <DateField
                        label="Due Date"
                        required
                        value={dueDate}
                        onChange={handleDueDateChange}
                        disabled={formDisabled}
                        error={
                          dueDateError ||
                          (formErrors.has("dueDate")
                            ? "Due Date is required"
                            : undefined)
                        }
                        placeholder="mm/dd/yyyy"
                      />
                    </div>
                  </div>

                  <TextAreaField
                    label="Memo/Notes"
                    value={memo}
                    onChange={(e) => !formDisabled && setMemo(e.target.value)}
                    placeholder="Additional notes..."
                    disabled={formDisabled}
                    autoGrow
                  />
                </div>

                {/* Line Items Section */}
                <div className="flex mt-[60px] w-full flex-col gap-6">
                  {/* Header */}
                  <div className="flex h-9 justify-between items-start">
                    <div className="flex flex-col gap-5">
                      <div className="flex flex-col text-xl text-[#303030] font-semibold leading-[26px]">
                        <div className="font-semibold">Line Items</div>
                        <div
                          className="h-px bg-gray-200 mt-5"
                          style={{ width: "790px" }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Table */}
                  <div>
                    <div
                      className="flex w-full flex-col rounded-xl shadow-[0_1px_2px_0_rgba(10,13,18,0.05)]"
                      style={{ minWidth: "fit-content" }}
                    >
                      <div className="flex flex-col border border-[#DADADA]/50 shadow-[0_1px_2px_0_rgba(10,13,18,0.05)] bg-white">
                        {/* Table Header */}
                        <div className="flex items-center">
                          <div
                            className="flex items-center gap-2 border-b border-r border-[#DADADA]/50 px-3 py-3 flex-shrink-0"
                            style={{ width: `${columnWidths.property}px` }}
                          >
                            <span className="text-[#525252] text-[13px] font-medium leading-[140%] tracking-[-0.26px] whitespace-nowrap">
                              Property / Ledger{" "}
                              <span style={{ color: "rgb(255, 0, 0)" }}>*</span>
                            </span>
                          </div>
                          <div
                            className="flex items-center gap-2 border-b border-r border-[#DADADA]/50 px-3 py-3 flex-shrink-0"
                            style={{ width: `${columnWidths.unit}px` }}
                          >
                            <span className="text-[#525252] text-[13px] font-medium leading-[140%] tracking-[-0.26px] whitespace-nowrap">
                              Unit{" "}
                              <span style={{ color: "rgb(255, 0, 0)" }}>*</span>
                            </span>
                          </div>
                          <div
                            className="flex items-center gap-2 border-b border-r border-[#DADADA]/50 px-3 py-3 flex-1"
                            style={{
                              minWidth: `${columnWidths.description}px`,
                            }}
                          >
                            <span className="text-[#525252] text-[13px] font-medium leading-[140%] tracking-[-0.26px] whitespace-nowrap">
                              Description
                            </span>
                          </div>
                          <div
                            className="flex items-center gap-2 border-b border-r border-[#DADADA]/50 px-3 py-3 flex-shrink-0"
                            style={{ width: `${columnWidths.glAccount}px` }}
                          >
                            <span className="text-[#525252] text-[13px] font-medium leading-[140%] tracking-[-0.26px] whitespace-nowrap">
                              GL Account&nbsp;
                              <span
                                style={{
                                  color: "rgb(255, 0, 0)",
                                  letterSpacing: "-0.26px",
                                }}
                              >
                                *
                              </span>
                            </span>
                          </div>
                          <div
                            className="flex items-center gap-2 border-b border-r border-[#DADADA]/50 px-3 py-3 flex-shrink-0"
                            style={{ width: `${columnWidths.upcharge}px` }}
                          >
                            <span className="text-[#525252] text-[13px] font-medium leading-[140%] tracking-[-0.26px] whitespace-nowrap">
                              Upcharge
                            </span>
                          </div>
                          <div
                            className="flex items-center gap-2 border-b border-r border-[#DADADA]/50 px-3 py-3 flex-shrink-0"
                            style={{ width: `${columnWidths.total}px` }}
                          >
                            <span className="text-[#525252] text-[13px] font-medium leading-[140%] tracking-[-0.26px] whitespace-nowrap">
                              Total&nbsp;
                              <span
                                style={{
                                  color: "rgb(255, 0, 0)",
                                  letterSpacing: "-0.26px",
                                }}
                              >
                                *
                              </span>
                            </span>
                          </div>
                          <div className="flex items-center gap-2 border-b border-r border-[#DADADA]/50 px-3 py-3 w-[80px] flex-shrink-0">
                            <span className="text-[#525252] text-[13px] font-medium leading-[140%] tracking-[-0.26px] whitespace-nowrap">
                              Actions
                            </span>
                          </div>
                        </div>

                        {/* Table Rows */}
                        {lineItems.map((item) => (
                          <div key={item.id} className="flex items-center">
                            {/* Property */}
                            <div
                              className="flex items-center border-b border-r px-3 min-h-14 py-2 flex-shrink-0"
                              style={{ width: `${columnWidths.property}px` }}
                            >
                              <Select
                                value={item.property}
                                disabled={formDisabled}
                                onValueChange={(value) => {
                                  handleUpdateLineItem(item.id, "property", value);
                                  setPropertySearch(""); // reset on select
                                }}
                                onOpenChange={(open) => {
                                  if (!open) setPropertySearch("");
                                }}
                              >
                                <SelectTrigger
                                  className="w-full h-auto px-0 py-0 text-[13px] border-0 bg-transparent"
                                >
                                  <SelectValue placeholder="Select a Property" />
                                </SelectTrigger>

                                <SelectContent
                                  className="bg-white border border-[#E5E7EB] shadow-md p-0"
                                  onKeyDown={(e) => {
                                    if (e.key === "Escape") e.stopPropagation();
                                    const t = e.target as HTMLElement;
                                    if (t.tagName === "INPUT") e.stopPropagation();
                                  }}
                                >
                                  {/* Search */}
                                  <div className="p-2 border-b border-[#E5E7EB]">
                                    <input
                                      autoFocus
                                      placeholder="Type to search…"
                                      value={propertySearch}
                                      onChange={(e) => setPropertySearch(e.target.value)}
                                      onKeyDown={(e) => e.stopPropagation()}
                                      onFocus={(e) => e.stopPropagation()}
                                      className="w-full rounded-md border px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-[#013764]"
                                    />
                                  </div>

                                  {/* List */}
                                  <div className="max-h-[240px] overflow-y-auto">
                                    {filteredProperties.length === 0 && (
                                      <div className="px-3 py-2 text-sm text-gray-400">
                                        No properties found
                                      </div>
                                    )}

                                    {filteredProperties.map((prop) => (
                                      <SelectItem key={prop.id} value={prop.id.toString()}>
                                        {prop.name}
                                      </SelectItem>
                                    ))}
                                  </div>
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Unit */}
                            <div
                              className="flex items-center border-b border-r px-3 min-h-14 py-2 flex-shrink-0"
                              style={{ width: `${columnWidths.unit}px` }}
                            >
                              <SelectFieldCell
                                value={item.unit}
                                onChange={(value) => {
                                  if (!formDisabled) {
                                    if (value === "__property__") {
                                      handleUpdateLineItem(item.id, "unit", "__property__");
                                      setLineItems((prev) =>
                                        prev.map((li) =>
                                          li.id === item.id
                                            ? { ...li, unitName: "Property Level" }
                                            : li
                                        )
                                      );
                                    } else {
                                      const units = unitsByProperty[item.property] || [];
                                      const selected = units.find(
                                        (u) => (u.buildium_unit_id?.toString() ?? `internal-${u.id}`) === value
                                      );
                                      handleUpdateLineItem(item.id, "unit", value);
                                      if (selected) {
                                        setLineItems((prev) =>
                                          prev.map((li) =>
                                            li.id === item.id
                                              ? { ...li, unitName: selected.unit_name }
                                              : li
                                          )
                                        );
                                      }
                                    }
                                  }
                                }}
                                placeholder={
                                  !item.property
                                    ? "Select property first"
                                    : "Select a Unit"
                                }
                                options={(() => {
                                  const propertyUnits =
                                    unitsByProperty[item.property] || [];
                                  const baseOptions = [
                                    { value: "__property__", label: "Property Level" },
                                    ...propertyUnits
                                      .slice()
                                      .sort((a, b) =>
                                        naturalSort(a.unit_name, b.unit_name),
                                      )
                                      .map((u) => ({
                                        value:
                                          u.buildium_unit_id?.toString() ??
                                          `internal-${u.id}`,
                                        label: u.unit_name,
                                      })),
                                  ];
                                  // Stored unit fallback: when the saved unit
                                  // isn't in the current units list (concierge
                                  // property with no synced units, or the
                                  // async fetch hasn't landed yet), splice in
                                  // a synthetic option so SelectFieldCell can
                                  // render the saved selection instead of
                                  // collapsing to the placeholder.
                                  const stored = item.unit;
                                  if (
                                    stored &&
                                    stored !== "__property__" &&
                                    !baseOptions.some((o) => o.value === stored)
                                  ) {
                                    baseOptions.push({
                                      value: stored,
                                      label: item.unitName || stored,
                                    });
                                  }
                                  return baseOptions;
                                })()}
                                disabled={formDisabled || !item.property}
                              />
                            </div>

                            {/* Work Order (Radix Select is OK here) */}
                            {/* <div
                              className={`flex items-center border-b border-r px-3 min-h-14 py-2 flex-shrink-0 ${
                                lineItemErrors[item.id]?.has("workOrder")
                                  ? "border-red-500 border-2"
                                  : "border-[#DADADA]/50"
                              }`}
                              style={{ width: `${columnWidths.workOrder}px` }}
                              >
                              <Select
                                disabled={!item.property || formDisabled}
                                value={item.workOrder ?? ""}
                                onValueChange={(value) => {
                                  if (!formDisabled) {
                                    handleUpdateLineItem(item.id, "workOrder", value);
                                  }
                                }}
                                >
                                <SelectTrigger
                                  className="w-full h-auto px-0 py-0 text-[13px] border-0 bg-transparent whitespace-nowrap"
                                  data-measure-width="workOrder"
                                >
                                  <SelectValue placeholder="Select a Work Order" />
                                </SelectTrigger>
                                <SelectContent>
                                  {(() => {
                                    const workOrders =
                                      workOrdersByProperty[item.property] || [];

                                    if (workOrders.length === 0) {
                                      return (
                                        <div className="px-3 py-2 text-xs text-gray-400">
                                          Select a property first
                                        </div>
                                      );
                                    }

                                    return workOrders.map((wo) => (
                                      <SelectItem
                                        key={wo.id}
                                        value={wo.id.toString()}
                                      >
                                        {wo.number}
                                      </SelectItem>
                                    ));
                                  })()}
                                </SelectContent>
                              </Select>
                            </div> */}

                            {/* Description */}
                            <div
                              className="flex items-center border-b border-r border-[#DADADA]/50 px-3 min-h-14 py-2 flex-1"
                              style={{ minWidth: `${columnWidths.description}px` }}
                            >
                              <input
                                type="text"
                                value={item.description}
                                onChange={(e) => {
                                  if (!formDisabled) {
                                    handleUpdateLineItem(
                                      item.id,
                                      "description",
                                      e.target.value,
                                    );
                                  }
                                }}
                                placeholder="Enter description"
                                data-measure-width="description"
                                disabled={formDisabled}
                                className="w-full bg-transparent outline-none text-[13px] whitespace-nowrap placeholder-[#A1A1A9]"
                              />
                            </div>

                            {/* GL Account — picker variant depends on the line's
                                property type:
                                  C (Concierge)        → QBO passthrough Items
                                  R / OR / HOA / COMM  → Buildium GL accounts from CSV
                                  no property yet      → legacy chart_of_accounts (fallback) */}
                            <div
                              className="flex items-center border-b border-r px-3 min-h-14 py-2 flex-shrink-0"
                              style={{ width: `${columnWidths.glAccount}px` }}
                            >
                              {(() => {
                                const selectedProp = properties.find(
                                  (p) => String(p.id) === item.property,
                                );
                                const isConcierge = selectedProp?.property_type === "C";
                                const hasNonConciergeProp =
                                  !!selectedProp && selectedProp.property_type !== "C";

                                // Read-only render: show whichever of the 3 stored
                                // names is populated. Avoids the dropdown's
                                // "Select an Item" fallback when options haven't
                                // loaded (and works for bills saved before the
                                // qbo_item_id / buildium_account_id changes shipped).
                                if (formDisabled) {
                                  const glLegacyName =
                                    glAccountOptions.find(
                                      (g) => g.id.toString() === item.glAccount,
                                    )?.name || "";
                                  const display =
                                    item.qboItemName ||
                                    item.buildiumAccountName ||
                                    glLegacyName ||
                                    "—";
                                  return (
                                    <span className="text-[13px] text-[#525252] truncate">
                                      {display}
                                    </span>
                                  );
                                }

                                if (isConcierge) {
                                  return (
                                    <ConciergeGLPicker
                                      value={item.qboItemId || ""}
                                      disabled={formDisabled}
                                      onChange={(qboItemId, displayName) => {
                                        if (formDisabled) return;
                                        setLineItems((prev) =>
                                          prev.map((li) =>
                                            li.id === item.id
                                              ? {
                                                  ...li,
                                                  qboItemId,
                                                  qboItemName: displayName,
                                                  glAccount: "",
                                                  buildiumAccountId: "",
                                                  buildiumAccountName: "",
                                                }
                                              : li,
                                          ),
                                        );
                                        setLineItemErrors((prev) => {
                                          const itemErrors = new Set(prev[item.id]);
                                          itemErrors.delete("qboItemId");
                                          itemErrors.delete("glAccount");
                                          return { ...prev, [item.id]: itemErrors };
                                        });
                                      }}
                                    />
                                  );
                                }

                                if (hasNonConciergeProp) {
                                  return (
                                    <BuildiumGLPicker
                                      value={item.buildiumAccountId || ""}
                                      disabled={formDisabled}
                                      onChange={(buildiumAccountId, displayName) => {
                                        if (formDisabled) return;
                                        setLineItems((prev) =>
                                          prev.map((li) =>
                                            li.id === item.id
                                              ? {
                                                  ...li,
                                                  buildiumAccountId,
                                                  buildiumAccountName: displayName,
                                                  glAccount: "",
                                                  qboItemId: "",
                                                  qboItemName: "",
                                                }
                                              : li,
                                          ),
                                        );
                                        setLineItemErrors((prev) => {
                                          const itemErrors = new Set(prev[item.id]);
                                          itemErrors.delete("buildiumAccountId");
                                          itemErrors.delete("glAccount");
                                          return { ...prev, [item.id]: itemErrors };
                                        });
                                      }}
                                    />
                                  );
                                }

                                return (
                                  <Select
                                    value={item.glAccount}
                                    disabled={formDisabled}
                                    onValueChange={(value) => {
                                      if (!formDisabled) {
                                        handleUpdateLineItem(item.id, "glAccount", value);
                                        setGlSearch(""); // reset on select
                                      }
                                    }}
                                    onOpenChange={(open) => {
                                      if (!open) setGlSearch(""); // reset on close
                                    }}
                                  >
                                    <SelectTrigger
                                      className="w-full h-auto px-0 py-0 text-[13px] border-0 bg-transparent"
                                    >
                                      <SelectValue placeholder="Select an Account" />
                                    </SelectTrigger>

                                    <SelectContent
                                      className="bg-white border border-[#E5E7EB] shadow-md p-0"
                                      onKeyDown={(e) => {
                                        if (e.key === "Escape") e.stopPropagation();
                                        const t = e.target as HTMLElement;
                                        if (t.tagName === "INPUT") e.stopPropagation();
                                      }}
                                    >
                                      {/* Search */}
                                      <div className="p-2 border-b border-[#E5E7EB]">
                                        <input
                                          autoFocus
                                          placeholder="Type to search…"
                                          value={glSearch}
                                          onChange={(e) => setGlSearch(e.target.value)}
                                          onKeyDown={(e) => e.stopPropagation()}
                                          onFocus={(e) => e.stopPropagation()}
                                          className="w-full rounded-md border px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-[#013764]"
                                        />
                                      </div>

                                      {/* Scrollable list */}
                                      <div className="max-h-[240px] overflow-y-auto">
                                        {filteredGLAccounts.length === 0 && (
                                          <div className="px-3 py-2 text-sm text-gray-400">
                                            No accounts found
                                          </div>
                                        )}

                                        {filteredGLAccounts.map((gl) => (
                                          <SelectItem key={gl.id} value={gl.id.toString()}>
                                            {gl.name}
                                          </SelectItem>
                                        ))}
                                      </div>
                                    </SelectContent>
                                  </Select>
                                );
                              })()}
                            </div>

                            {/* Upcharge */}
                            <div
                              className="flex items-center border-b border-r border-[#DADADA]/50 px-3 min-h-14 py-2 flex-shrink-0"
                              style={{ width: `${columnWidths.upcharge}px` }}
                            >
                              <input
                                type="text"
                                value={item.upcharge}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  if (
                                    !formDisabled &&
                                    (value === "" ||
                                      /^\$?[\d,]*\.?\d{0,2}$/.test(value))
                                  ) {
                                    const formatted = value.startsWith("$")
                                      ? value
                                      : "$" + value;
                                    handleUpdateLineItem(
                                      item.id,
                                      "upcharge",
                                      formatted,
                                    );
                                  }
                                }}
                                placeholder="$0.00"
                                disabled={formDisabled}
                                className="w-full bg-transparent outline-none text-[13px] whitespace-nowrap placeholder-[#A1A1A9]"
                              />
                            </div>


                            {/* Total */}
                            <div
                              className={`flex items-center border-b border-r px-3 min-h-14 py-2 flex-shrink-0 ${
                                lineItemErrors[item.id]?.has("total")
                                  ? "border-red-500 border-2"
                                  : "border-[#DADADA]/50"
                              }`}
                              style={{ width: `${columnWidths.total}px` }}
                              >
                              <input
                                type="text"
                                value={item.total}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  if (
                                    !formDisabled &&
                                    (value === "" ||
                                      /^\$?[\d,]*\.?\d{0,2}$/.test(value))
                                  ) {
                                    const formatted = value.startsWith("$")
                                      ? value
                                      : "$" + value;
                                    handleUpdateLineItem(
                                      item.id,
                                      "total",
                                      formatted,
                                    );
                                  }
                                }}
                                placeholder="$0.00"
                                data-measure-width="total"
                                disabled={formDisabled}
                                className="w-full bg-transparent outline-none text-[13px] whitespace-nowrap placeholder-[#A1A1A9]"
                              />
                            </div>

                            {/* Delete Button */}
                            <div className="flex items-center justify-center border-b border-r border-[#DADADA]/50 min-h-14 py-2 w-[80px] flex-shrink-0">
                              {!formDisabled && (
                                <button
                                  onClick={() => handleDeleteLineItem(item.id)}
                                  className="text-[#525252] hover:text-[#303030] transition-colors text-lg leading-none"
                                  title="Delete row"
                                >
                                  ×
                                </button>
                              )}
                            </div>
                          </div>
                        ))}

                      </div>
                    </div>
                  </div>
                  {!formDisabled && (
                    <button
                      onClick={handleAddLineItem}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      style={{ margin: "16px auto 0 0" }}
                    >
                      + Add Line Item
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Fixed Bottom Bar - Always visible at viewport bottom, accounting for sidebar */}
      <div
        className="fixed bottom-0 right-0 bg-white z-40 shadow-[0_-2px_8px_rgba(0,0,0,0.05)]"
        style={{
          backgroundColor: "rgb(255, 255, 255)",
          borderTop: "1.33333px solid #d2d1cf",
          borderLeft: "1.33333px solid #d2d1cf",
          borderRight: "none",
          borderBottom: "none",
          bottom: "0px",
          boxShadow:
            "rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.05) 0px -2px 8px 0px",
          fontWeight: "400",
          left: sidebarVisible ? "262px" : "0px",
          position: "fixed",
          right: "0px",
          transitionDuration: "0.3s",
          transitionProperty: "left",
          zIndex: "40",
          padding: "16px 32px",
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex flex-col text-xl text-[#303030] font-semibold leading-[1.3]">
            <div>
              Bill Total:{" "}
              <span className="font-semibold">{calculateTotal()}</span>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            {/* Top-level Cancel — hidden in edit mode (replaced by Cancel edit
                + Save & Re-export below). */}
            {!editing && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleCancel();
                }}
                className="rounded-lg flex min-h-9 px-3 py-1.5 items-center gap-2 text-[#303030] font-normal whitespace-nowrap tracking-[-0.32px] leading-[1.4] hover:bg-gray-100 transition-colors"
              >
                <span>Cancel</span>
              </button>
            )}
            {/* Pay Bill / View Payments visibility — recognizes both QBO state
                (Concierge bills) and Buildium-only state (non-Concierge bills,
                where qbo_* fields are all NULL). */}
            {(() => {
              const qboHasOutstanding =
                qboPaymentState.qboBalanceCents != null &&
                qboPaymentState.qboBalanceCents > 0;
              const buildiumOnly =
                qboPaymentState.qboBalanceCents == null &&
                !!qboPaymentState.buildiumBillId;
              const buildiumHasPayment = !!qboPaymentState.buildiumBillPaymentId;

              // A check has been queued for printing but not yet printed. The
              // QBO BillPayment exists (PrintStatus=NeedToPrint) so the money
              // is effectively committed — paying again here would double-pay.
              const checkQueued =
                qboPaymentState.checkPrintStatus === "queued";
              // A printed check is a completed payment — the bill is paid even
              // if the local qbo_balance_cents mirror hasn't caught up (the QBO
              // webhook may not be wired). Treat it as paid so we never re-show
              // Pay Bill on an already-paid-by-check bill.
              const checkPrinted =
                qboPaymentState.checkPrintStatus === "printed";

              // Outstanding = QBO balance > 0 OR (Buildium-only bill with no
              // payment yet). The Buildium-only partial-payment case isn't
              // tracked here yet; once paid we hide the Pay button. A queued or
              // printed check also blocks payment.
              const canPay =
                !qboPaymentState.qboPaidAt &&
                !checkQueued &&
                !checkPrinted &&
                (qboHasOutstanding || (buildiumOnly && !buildiumHasPayment));

              // Any payment recorded → show View Payments. Either a QBO
              // payment partial-paid the bill, there's a Buildium payment on
              // file, or a check was printed.
              const hasAnyPayment =
                (qboPaymentState.qboTotalCents != null &&
                  qboPaymentState.qboBalanceCents != null &&
                  qboPaymentState.qboBalanceCents <
                    qboPaymentState.qboTotalCents) ||
                buildiumHasPayment ||
                checkPrinted;

              const fullyPaid =
                qboPaymentState.qboBalanceCents === 0 ||
                checkPrinted ||
                (buildiumOnly && buildiumHasPayment);

              return (
                <>
                  {formDisabled && billId !== null && canPay && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowPayBillModal(true);
                      }}
                      className="rounded-lg flex h-10 px-4 items-center gap-2 transition-colors bg-emerald-600 text-white font-medium hover:bg-emerald-700"
                    >
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M2.25 6.75H15.75M2.25 9H15.75M3 4.5H15C15.8284 4.5 16.5 5.17157 16.5 6V13.5C16.5 14.3284 15.8284 15 15 15H3C2.17157 15 1.5 14.3284 1.5 13.5V6C1.5 5.17157 2.17157 4.5 3 4.5Z"
                              stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span className="text-sm">Pay Bill</span>
                    </button>
                  )}
                  {formDisabled && checkQueued && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        navigate("/accounting/print-checks");
                      }}
                      title="A check is queued for this bill. Print it from Accounting → Print Checks."
                      className="rounded-lg flex h-10 px-4 items-center gap-2 transition-colors bg-blue-50 text-blue-700 border border-blue-300 font-medium hover:bg-blue-100"
                    >
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4.5 6.75V2.25h9v4.5M4.5 13.5H3a1.5 1.5 0 0 1-1.5-1.5V8.25A1.5 1.5 0 0 1 3 6.75h12a1.5 1.5 0 0 1 1.5 1.5V12a1.5 1.5 0 0 1-1.5 1.5h-1.5M4.5 11.25h9v4.5h-9v-4.5Z"
                              stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span className="text-sm">Check queued · Print Checks</span>
                    </button>
                  )}
                  {formDisabled && hasAnyPayment && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowViewPaymentModal(true);
                      }}
                      className="rounded-lg flex min-h-9 px-3 py-2 items-center gap-2 overflow-hidden font-medium transition-colors bg-emerald-600 text-white hover:bg-emerald-700"
                    >
                      <span>{fullyPaid ? "Paid · View Payment" : "View Payments"}</span>
                    </button>
                  )}
                </>
              );
            })()}

            {/* Edit button — visible in readOnly mode on a posted bill. Click
                flips local `editing` so the form becomes interactive without
                re-firing the load effect. */}
            {formDisabled && billId !== null && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setEditing(true);
                }}
                className="rounded-lg flex min-h-9 px-3 py-2 items-center gap-2 font-medium transition-colors border border-[#013764] text-[#013764] hover:bg-[#013764] hover:text-white"
              >
                <svg width="16" height="16" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15.75 15.7502H9.75002M1.875 16.1252L6.03695 14.5245C6.30316 14.4221 6.43626 14.3709 6.56079 14.3041C6.6714 14.2447 6.77685 14.1761 6.87603 14.0992C6.98769 14.0125 7.08853 13.9117 7.29021 13.71L15.75 5.25023C16.5784 4.4218 16.5784 3.07865 15.75 2.25023C14.9216 1.4218 13.5784 1.4218 12.75 2.25022L4.29021 10.71C4.08853 10.9117 3.98769 11.0125 3.90104 11.1242C3.82408 11.2234 3.75555 11.3288 3.69618 11.4394C3.62933 11.564 3.57814 11.6971 3.47575 11.9633L1.875 16.1252Z"
                        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-sm">Edit</span>
              </button>
            )}

            {/* Exported pill — only in pure readOnly (not editing). When
                editing this is replaced by Save & Re-export below. */}
            {formDisabled &&
              !qboPaymentState.qboPaidAt &&
              qboPaymentState.checkPrintStatus !== "printed" && (
                <button
                  disabled
                  className="rounded-lg flex min-h-9 px-3 py-2 items-center gap-2 overflow-hidden font-medium transition-colors bg-gray-300 text-gray-500 cursor-not-allowed"
                >
                  <span>Exported to Buildium</span>
                </button>
              )}

            {/* Edit-mode footer: Cancel Edit + Save & Re-export. Save calls
                PATCH /vendors/bills/{id} which dual-pushes to QBO + Buildium
                with rollback on Buildium failure. */}
            {isReadOnly && editing && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setEditing(false);
                  }}
                  disabled={savingEdit}
                  className="rounded-lg flex min-h-9 px-3 py-2 items-center gap-2 font-medium transition-colors border border-gray-300 text-[#303030] hover:bg-gray-100 disabled:opacity-50"
                >
                  <span>Cancel edit</span>
                </button>
                <button
                  type="button"
                  onClick={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (savingEdit) return;
                    await handleSaveAndReexport();
                  }}
                  disabled={savingEdit}
                  className={`rounded-lg flex h-10 px-4 items-center gap-2 transition-colors bg-[#013764] text-white font-medium ${savingEdit ? "opacity-60 cursor-not-allowed" : "hover:bg-[#0a2e4d]"}`}
                >
                  <span className="text-sm">
                    {savingEdit ? "Re-exporting…" : "Save & Re-export"}
                  </span>
                </button>
              </>
            )}
            {/* Draft-mode footer (Save + Approve & Export). Only for genuinely
                new/draft bills — not for editing an already-exported one,
                where the Save & Re-export button above is the single action. */}
            {!isReadOnly && (
              <>
                  <button
                    onClick={handleRecordBill}
                    className="mr-4"
                  >
                  <span>Save</span>
                </button>
                <button
                  disabled={isExporting}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    if (isExporting) return;

                    // Validate top-level form fields (same as Save button)
                    const formFieldErrors = new Set<string>();
                    let hasErrors = false;

                    if (!selectedVendor) {
                      formFieldErrors.add("vendor");
                      hasErrors = true;
                    }
                    if (!invoiceDate) {
                      formFieldErrors.add("invoiceDate");
                      hasErrors = true;
                    }
                    if (!dueDate) {
                      formFieldErrors.add("dueDate");
                      hasErrors = true;
                    }

                    if (hasErrors) {
                      setFormErrors(formFieldErrors);
                      return;
                    }

                    // If quick validation passes, run full validation including line items
                    handleApproveBill();
                  }}
                  className={`rounded-lg flex h-10 px-4 items-center gap-2 transition-colors bg-[#013764] border-2 border-white ${isExporting ? "opacity-60 cursor-not-allowed" : "hover:bg-[#0a2e4d]"}`}
                  style={{
                    boxShadow:
                      "rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgb(0, 45, 90) 0px 0px 0px 1px, rgba(0, 0, 0, 0.2) 0px 0px 10px -5px",
                  }}
                >
                  {isExporting ? (
                    <svg
                      className="animate-spin"
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
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                  ) : (
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
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                  <span className="text-white text-sm font-medium leading-5">
                    {isExporting ? "Exporting…" : "Approve & Export"}
                  </span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      <AddVendorModal
        open={showAddVendorModal}
        onOpenChange={setShowAddVendorModal}
        onAddVendor={(vendor) => {
          setSelectedVendor({
            id: Math.random(),
            name: vendor.name,
            email: vendor.email,
            phone: vendor.phone,
            notes: vendor.notes,
          });
          setShowAddVendorModal(false);
        }}
      />
      <MsgViewerModal
        open={msgViewer.isOpen}
        onOpenChange={(open) =>
          setMsgViewer((prev) => ({ ...prev, isOpen: open }))
        }
        title={msgViewer.title}
        data={msgViewer.data}
        loading={msgViewer.loading}
        error={msgViewer.error}
      />
      {showPayBillModal && billId !== null && (() => {
        const billProperty = properties.find(
          (p) => p.id === Number(lineItems[0]?.property),
        );
        // Non-Concierge bills don't have qboBalanceCents — fall back to the
        // bill total so the amount field has a sensible default. Partial-pay
        // state isn't tracked on the Buildium-only side yet, so this is the
        // bill amount minus nothing.
        const outstandingCents =
          billProperty?.property_type === "C"
            ? qboPaymentState.qboBalanceCents ?? 0
            : toCents(calculateTotal());
        return (
        <PayBillModal
          open={showPayBillModal}
          onOpenChange={setShowPayBillModal}
          bill={{
            id: billId,
            vendorName: selectedVendor?.name ?? "",
            propertyName: billProperty?.name ?? "",
            referenceNumber: referenceNumber || undefined,
            qboBalanceCents: outstandingCents,
            propertyType: billProperty?.property_type ?? null,
          }}
          onPaid={(result) => {
            // A queued check is NOT a completed payment — the bill stays
            // unpaid until the check is printed. Flip the footer to the
            // "Check queued" state instead of marking it paid, so we don't
            // expose the Pay Bill button again (double-payment risk).
            if (result.print_status === "queued") {
              setQboPaymentState((prev) => ({
                ...prev,
                checkPrintStatus: "queued",
              }));
              return;
            }
            // Electronic transfer: optimistically populate the payment state
            // so the View Payment modal renders fresh data without a refetch.
            setQboPaymentState((prev) => ({
              ...prev,
              qboPaidAt: result.qbo_paid_at ?? new Date().toISOString(),
              qboBalanceCents: result.qbo_balance_cents ?? 0,
              qboBillPaymentId: result.qbo_billpayment_id,
              paidOn: result.paid_on,
              paidFromName: result.paid_from_name,
              paidDocNumber: result.paid_doc_number,
              paidMemo: result.paid_memo,
              receiptObjectKey: result.receipt_object_key ?? null,
              receiptFilename: result.receipt_filename ?? null,
              receiptMime: result.receipt_mime ?? null,
              receiptSizeBytes: result.receipt_size_bytes ?? null,
              receiptUploadedAt: result.receipt_uploaded_at ?? null,
            }));
          }}
        />
        );
      })()}
      <ViewPaymentModal
        open={showViewPaymentModal}
        onOpenChange={setShowViewPaymentModal}
        bill={{
          id: billId ?? undefined,
          vendorName: selectedVendor?.name,
          propertyName: properties.find(
            (p) => p.id === Number(lineItems[0]?.property),
          )?.name,
          referenceNumber: referenceNumber || undefined,
          totalCents: qboPaymentState.qboTotalCents ?? toCents(calculateTotal()),
          qboBalanceCents: qboPaymentState.qboBalanceCents,
          qboPaidAt: qboPaymentState.qboPaidAt,
          qboBillId: qboPaymentState.qboBillId,
          qboBillPaymentId: qboPaymentState.qboBillPaymentId,
          buildiumBillId: qboPaymentState.buildiumBillId,
          buildiumBillPaymentId: qboPaymentState.buildiumBillPaymentId,
          paidOn: qboPaymentState.paidOn,
          paidFromName: qboPaymentState.paidFromName,
          paidDocNumber: qboPaymentState.paidDocNumber,
          paidMemo: qboPaymentState.paidMemo,
          receiptObjectKey: qboPaymentState.receiptObjectKey,
          receiptFilename: qboPaymentState.receiptFilename,
          receiptUploadedAt: qboPaymentState.receiptUploadedAt,
        }}
        onEditPayment={(p) => {
          // Close the view modal so its overlay doesn't stack on top of the
          // edit one; reopen the view list when the edit modal closes so the
          // user can pick another row if they want.
          setShowViewPaymentModal(false);
          setEditPaymentTarget(p);
        }}
      />

      {editPaymentTarget && (
        <EditPaymentModal
          open={!!editPaymentTarget}
          onOpenChange={(open) => {
            if (!open) setEditPaymentTarget(null);
          }}
          payment={editPaymentTarget}
          bill={{
            vendorName: selectedVendor?.name,
            referenceNumber: referenceNumber || undefined,
          }}
          onSaved={async () => {
            // Pull the freshly-refreshed bill row (the backend already called
            // QBOSyncSvc.RefreshBill so qbo_balance_cents / qbo_paid_at are
            // up to date) so this page's balance + paid pill reflect the
            // edit without a full reload.
            if (billId) {
              try {
                const bill: any = await fetchJSON(`/utilities/bills/${billId}`);
                setQboPaymentState((prev) => ({
                  ...prev,
                  qboBalanceCents: bill?.qbo_balance_cents ?? prev.qboBalanceCents,
                  qboTotalCents: bill?.qbo_total_cents ?? prev.qboTotalCents,
                  qboPaidAt: bill?.qbo_paid_at ?? prev.qboPaidAt,
                }));
              } catch (err) {
                console.error("Failed to refresh bill after payment edit:", err);
              }
            }
            // Re-open the View Payments modal so the updated row is visible
            // from the (re-fetched) /payments list.
            setShowViewPaymentModal(true);
          }}
        />
      )}
      {parsingBill && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          role="dialog"
          aria-modal="true"
          aria-label="Parsing bill"
        >
          <div className="bg-white rounded-lg shadow-xl px-6 py-5 flex items-center gap-3 max-w-sm mx-4">
            <svg
              className="w-5 h-5 animate-spin text-[#013764] flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-[#303030]">
                Parsing bill and autofilling…
              </span>
              <span className="text-xs text-[#A1A1A9]">
                This may take a few seconds.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
