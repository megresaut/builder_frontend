import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { StickyBottomBar } from "@/components/StickyBottomBar";

import { fetchJSON, API_BASE } from "@/api/fetchJSON";
import glAccounts from "@/data/gl_accounts.json";
import { convertFiletoPdf } from "@/utils/convertFiletoPdf";
import MsgViewerModal from "@/components/MsgViewerModal";
import { parseMsgFile } from "@/utils/parseMsgFile";
import { parseEmlFile } from "@/utils/parseEmlFile";
import type { ParsedMsg } from "@/utils/parseMsgFile";

import AddVendorModal from "@/components/AddVendorModal";
import { SelectField } from "@/components/forms/SelectField";
import { SelectFieldCell } from "@/components/forms/SelectFieldCell";
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

interface LineItem {
  id: number;
  property: string;
  unit: string;
  description: string;
  glAccount: string;
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
const mockUnits = ["N/A", "1", "2", "3", "4", "5"];
const mockGLAccounts = ["Utilities", "Maintenance", "Other"];

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
      description: "Monthly electric service charge and consumption",
      glAccount: "Utilities",
      total: "$450.00",
    },
    {
      id: 2,
      property: "22 Indian Creek Dr",
      unit: "2",
      description: "Water and sewer service",
      glAccount: "Utilities",
      total: "$125.50",
    },
    {
      id: 3,
      property: "25 Park Ave",
      unit: "1",
      description: "Gas heating service",
      glAccount: "Utilities",
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
  description: "",
  glAccount: "",
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
    WorkOrderRef: li.work_order_ref || "",
    Description: li.description || "",
    GLAccountID: li.gl_account_id,
    GLAccountName: li.gl_account_name,
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
    const storagePath = a.StoragePath.startsWith("http")
      ? a.StoragePath
      : `${API_BASE}${a.StoragePath}`;

    const res = await fetch(storagePath, {
      credentials: "include",
    });

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
  // const billId = searchParams.get("billId");
  const navigate = useNavigate();
  const location = useLocation(); 
  const isReadOnly = searchParams.get("readOnly") === "true";
  // const billIdParam = searchParams.get("billId");
  // const billId = billIdParam ? Number(billIdParam) : Number.NaN;
  // const resolvedBillId = Number.isFinite(billId) ? billId : Date.now();
  // const isEditingDraft = billId !== null;


  const billIdParam = searchParams.get("billId");
  const returnTo = searchParams.get("returnTo");

  // billId is either a real number OR null
  const billId: number | null =
    billIdParam && Number.isFinite(Number(billIdParam))
      ? Number(billIdParam)
      : null;

  // editing draft ONLY if we have a real billId
  const isEditingDraft = billId !== null;

  const stateBill = location.state?.bill;

  const readOnlyBill = isReadOnly
    ? buildReadOnlyBillFromState(stateBill)
    : null;
  const [draft, setDraft] = useState<any>(null);

  const editableBill =
    !isReadOnly && stateBill ? buildEditableBillFromState(stateBill) : null;

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
  const [lineItems, setLineItems] = useState<LineItem[]>(
    isReadOnly
      ? (readOnlyBill?.lineItems ?? placeholderBill.lineItems)
      : (editableBill?.lineItems ?? [
          {
            id: 1,
            property: "",
            unit: "",
            description: "",
            glAccount: "",
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
    total: 80,
    workOrder: 150,
  };
  // Real vendors + properties
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [properties, setProperties] = useState<{ id: number; name: string }[]>([]);
  const [propertyMap, setPropertyMap] = useState<Record<string, number>>({});
  const [columnWidths, setColumnWidths] = useState(defaultColumnWidths);
  const [glAccountOptions, setGLAccountOptions] = useState<
  { id: number; name: string }[]
>([]);


  const vendorPageSize = 50;
  const vendorRequestIdRef = useRef(0);
  const [vendorSearch, setVendorSearch] = useState("");
  const [vendorOffset, setVendorOffset] = useState(0);
  const [vendorHasMore, setVendorHasMore] = useState(true);
  const [vendorLoading, setVendorLoading] = useState(false);
  const [isVendorDropdownOpen, setIsVendorDropdownOpen] = useState(false);
  const filteredVendors = vendors;


  const [propertySearch, setPropertySearch] = useState("");
  const [glSearch, setGlSearch] = useState("");
  const filteredProperties = properties.filter((p) =>
    p.name.toLowerCase().includes(propertySearch.toLowerCase())
  );
  
  const filteredGLAccounts = glAccountOptions.filter((gl) =>
    gl.name.toLowerCase().includes(glSearch.toLowerCase())
  );
  

  useEffect(() => {
    const normalized = glAccounts.map((gl: any) => ({
      id: parseInt(gl.Id, 10),
      name: gl.Name,
    }));

    setGLAccountOptions(normalized);
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
      workOrder: item.WorkOrderRef || "",
      description: item.Description || "",
      glAccount: item.GLAccountID
        ? item.GLAccountID.toString()
        : "",
      total: item.AmountCents
        ? `$${(item.AmountCents / 100).toFixed(2)}`
        : "",
    }));
    
    setLineItems(formatted);
  
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
      navigate(-1);
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
        navigate(-1);
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
        navigate(-1);
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

  const handleApproveBill = async () => {
    const formFieldErrors = new Set<string>();
    let hasErrors = false;
  
    const patchPayload = buildPatchPayload();
  
    for (const li of patchPayload.line_items) {
      if (!li.property_id || !li.gl_account_id) {
        alert("Each line item must have a Property and GL Account before approving.");
        return;
      }
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
            unit: "",
          
            gl_account_id: li.gl_account_id,           // 🔒 already validated
            gl_account_name: li.gl_account_name,
          
            description: li.description || "",
            amount_cents: Number(li.amount_cents),
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
  
      // Notify Bills page
      window.dispatchEvent(
        new CustomEvent("billApproved", {
          detail: {
            billId: approvedBillId,
            timestamp: Date.now(),
          },
        })
      );
  
      // Close page
      if (returnTo) {
        navigate(returnTo);
      } else {
        navigate(-1);
      }
  
    } catch (err) {
      console.error("Failed to approve and export bill:", err);
      alert("Bill was approved, but exporting to Buildium may have failed.");
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

  // Auto-open PDF in read-only mode if there's only one file
  useEffect(() => {
    if (isReadOnly && uploadedFiles.length === 1 && !viewingFileUrl) {
      const file = uploadedFiles[0].file;
      const preview = (file as any).preview;
      if (preview) {
        setViewingFileUrl(preview);
        setViewingFileIndex(0);
      }
    }
  }, [isReadOnly, uploadedFiles, viewingFileUrl]);
  

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
  
        // When property changes → clear work order + load new orders
        // if (field === "property") {
        //   updated.workOrder = "";
        //   loadWorkOrdersForProperty(value);
        // }
  
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
        workOrder: "",
        description: "",
        glAccount: "",
        total: "",
      },
    ]);
  };

  const [uploadedPdfMeta, setUploadedPdfMeta] = useState<{
    pdf_object_key: string;
    sha256_pdf: string;
  } | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);

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

        const res = await fetch("/api/vendors/bills/upload-pdf", {
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
      return prev.filter((_, i) => i !== index);
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
      // 🔒 property_id MUST be a number
      const property_id = Number(item.property);
  
      // 🔒 GL account MUST exist
      const gl = glAccountOptions.find(
        (g) => g.id.toString() === item.glAccount
      );
  
      if (!property_id || !gl) {
        throw new Error("Invalid line item: property or GL account missing");
      }
  
      return {
        line_id: item.id,
        property_id,               // number ONLY
        unit: "",
  
        gl_account_id: gl.id.toString(),
        gl_account_name: gl.name,   // string, not ""
  
        description: item.description || "",
        amount_cents: toCents(item.total),
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
        style={{ marginBottom: "72px" }}
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
                              <button
                                onClick={() => handleViewFile(file.file)}
                                className="text-blue-600 hover:text-blue-700 transition-colors text-sm font-medium"
                                title="View file"
                              >
                                View
                              </button>
                              {!isReadOnly && (
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
                      {!isReadOnly && (
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
                  onClick={closeViewer}
                  className="absolute top-2 right-2 z-10 rounded-md p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-200/80 transition-colors"
                  title="Close"
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
          }}
        >
          {/* Scrollable Content Area */}
          <div
            className="overflow-auto"
            style={{
              width: "100%",
              flex: 1,
              overflowX: "auto",
              overflowY: "auto",
              marginBottom: "4px",
              position: "relative",
              overscrollBehavior: "contain",
              touchAction: "pan-x pan-y",
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
                            if (!isReadOnly) {
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
                          disabled={isReadOnly}
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
                          >
                            {/* Search input */}
                            <div className="p-2 border-b border-[#E5E7EB]">
                              <input
                                autoFocus
                                placeholder="Type to search…"
                                value={vendorSearch}
                                onChange={(e) => setVendorSearch(e.target.value)}
                                onKeyDown={(e) => e.stopPropagation()} // ⛔ prevent Select keyboard hijack
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
                      {!isReadOnly && (
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
                          !isReadOnly && setReferenceNumber(e.target.value)
                        }
                        placeholder="INV-2024-001"
                        disabled={isReadOnly}
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
                        disabled={isReadOnly}
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
                        disabled={isReadOnly}
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
                    onChange={(e) => !isReadOnly && setMemo(e.target.value)}
                    placeholder="Additional notes..."
                    disabled={isReadOnly}
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
                                disabled={isReadOnly}
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

                                <SelectContent className="bg-white border border-[#E5E7EB] shadow-md p-0">
                                  {/* Search */}
                                  <div className="p-2 border-b border-[#E5E7EB]">
                                    <input
                                      autoFocus
                                      placeholder="Type to search…"
                                      value={propertySearch}
                                      onChange={(e) => setPropertySearch(e.target.value)}
                                      onKeyDown={(e) => e.stopPropagation()}
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
                                  if (!isReadOnly) {
                                    handleUpdateLineItem(item.id, "unit", value);
                                  }
                                }}
                                placeholder="Select a Unit"
                                options={mockUnits.map((unit) => ({
                                  value: unit,
                                  label: unit,
                                }))}
                                disabled={isReadOnly}
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
                                disabled={!item.property || isReadOnly}
                                value={item.workOrder ?? ""}
                                onValueChange={(value) => {
                                  if (!isReadOnly) {
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
                                  if (!isReadOnly) {
                                    handleUpdateLineItem(
                                      item.id,
                                      "description",
                                      e.target.value,
                                    );
                                  }
                                }}
                                placeholder="Enter description"
                                data-measure-width="description"
                                disabled={isReadOnly}
                                className="w-full bg-transparent outline-none text-[13px] whitespace-nowrap placeholder-[#A1A1A9]"
                              />
                            </div>

                            {/* GL Account */}
                            <div
                              className="flex items-center border-b border-r px-3 min-h-14 py-2 flex-shrink-0"
                              style={{ width: `${columnWidths.glAccount}px` }}
                            >
                              <Select
                                value={item.glAccount}
                                disabled={isReadOnly}
                                onValueChange={(value) => {
                                  if (!isReadOnly) {
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

                                <SelectContent className="bg-white border border-[#E5E7EB] shadow-md p-0">
                                  {/* Search */}
                                  <div className="p-2 border-b border-[#E5E7EB]">
                                    <input
                                      autoFocus
                                      placeholder="Type to search…"
                                      value={glSearch}
                                      onChange={(e) => setGlSearch(e.target.value)}
                                      onKeyDown={(e) => e.stopPropagation()}
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
                                    !isReadOnly &&
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
                                disabled={isReadOnly}
                                className="w-full bg-transparent outline-none text-[13px] whitespace-nowrap placeholder-[#A1A1A9]"
                              />
                            </div>

                            {/* Delete Button */}
                            <div className="flex items-center justify-center border-b border-r border-[#DADADA]/50 min-h-14 py-2 w-[80px] flex-shrink-0">
                              {!isReadOnly && (
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
                  {!isReadOnly && (
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
            {isReadOnly && (
              <button
                disabled
                className="rounded-lg flex min-h-9 px-3 py-2 items-center gap-2 overflow-hidden font-medium transition-colors bg-gray-300 text-gray-500 cursor-not-allowed"
              >
                <span>Exported to Buildium</span>
              </button>
            )}
            {!isReadOnly && (
              <>
                  <button
                    onClick={handleRecordBill}
                    className="mr-4"
                  >
                  <span>Save</span>
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();

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
                  className="rounded-lg flex h-10 px-4 items-center gap-2 transition-colors bg-[#013764] border-2 border-white hover:bg-[#0a2e4d]"
                  style={{
                    boxShadow:
                      "rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgb(0, 45, 90) 0px 0px 0px 1px, rgba(0, 0, 0, 0.2) 0px 0px 10px -5px",
                  }}
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
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span className="text-white text-sm font-medium leading-5">
                    Approve & Export
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
    </div>
  );
};
