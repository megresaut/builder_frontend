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
import { StickyBottomBar } from "@/components/StickyBottomBar";
import { fetchJSON } from "@/api/fetchJSON";
import glAccounts from "@/data/gl_accounts.json";

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
  workOrder: string;
  description: string;
  glAccount: string;
  total: string;
}

interface ViewBillState {
  vendorName?: string;
  referenceNumber?: string;
  invoiceDate?: string;
  dueDate?: string;
  memo?: string;
  lineItems?: LineItem[];
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
const mockWorkOrders = ["N/A", "123456-1", "123456-2", "789012-1"];
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
      workOrder: "123456-1",
      description: "Monthly electric service charge and consumption",
      glAccount: "Utilities",
      total: "$450.00",
    },
    {
      id: 2,
      property: "22 Indian Creek Dr",
      unit: "2",
      workOrder: "123456-2",
      description: "Water and sewer service",
      glAccount: "Utilities",
      total: "$125.50",
    },
    {
      id: 3,
      property: "25 Park Ave",
      unit: "1",
      workOrder: "789012-1",
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

export const RecordBill = () => {
  const [searchParams] = useSearchParams();
  const billId = searchParams.get("billId");
  const navigate = useNavigate();
  const location = useLocation(); 
  const isReadOnly = searchParams.get("readOnly") === "true";
  const readOnlyBill = isReadOnly
    ? buildReadOnlyBillFromState(location.state?.bill)
    : null;
  const [draft, setDraft] = useState<any>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(
    isReadOnly ? (readOnlyBill?.vendor ?? placeholderBill.vendor) : null,
  );
  const [referenceNumber, setReferenceNumber] = useState<string>(
    isReadOnly
      ? (readOnlyBill?.referenceNumber ?? placeholderBill.referenceNumber)
      : "",
  );
  const [invoiceDate, setInvoiceDate] = useState<Date | null>(
    isReadOnly
      ? (readOnlyBill?.invoiceDate ?? placeholderBill.invoiceDate)
      : null,
  );
  const [dueDate, setDueDate] = useState<Date | null>(
    isReadOnly ? (readOnlyBill?.dueDate ?? placeholderBill.dueDate) : null,
  );
  const [invoiceDateInput, setInvoiceDateInput] = useState<string>(
    isReadOnly && (readOnlyBill?.invoiceDate || placeholderBill.invoiceDate)
      ? format(
          readOnlyBill?.invoiceDate ?? placeholderBill.invoiceDate,
          "MM/dd/yyyy",
        )
      : "",
  );
  const [dueDateInput, setDueDateInput] = useState<string>(
    isReadOnly && (readOnlyBill?.dueDate || placeholderBill.dueDate)
      ? format(readOnlyBill?.dueDate ?? placeholderBill.dueDate, "MM/dd/yyyy")
      : "",
  );
  const [memo, setMemo] = useState<string>(
    isReadOnly ? (readOnlyBill?.memo ?? placeholderBill.memo) : "",
  );
  const [invoiceDateError, setInvoiceDateError] = useState<string>("");
  const [dueDateError, setDueDateError] = useState<string>("");
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState<boolean>(true);
  const [viewingFileUrl, setViewingFileUrl] = useState<string | null>(null);
  const [viewingFileIndex, setViewingFileIndex] = useState<number | null>(null);
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
  const [lineItems, setLineItems] = useState<LineItem[]>(
    isReadOnly
      ? (readOnlyBill?.lineItems ?? placeholderBill.lineItems)
      : [
          {
            id: 1,
            property: "",
            unit: "",
            workOrder: "",
            description: "",
            glAccount: "",
            total: "",
          },
        ],
  );

  // Dynamic column width tracking with default minimum widths
  const defaultColumnWidths = {
    property: 151,
    unit: 130,
    workOrder: 150,
    description: 200,
    glAccount: 170,
    total: 80,
  };
  // Real vendors + properties
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [properties, setProperties] = useState<{ id: number; name: string }[]>([]);
  const [propertyMap, setPropertyMap] = useState<Record<string, number>>({});
  const [columnWidths, setColumnWidths] = useState(defaultColumnWidths);
  const [glAccountOptions, setGLAccountOptions] = useState<
  { id: number; name: string }[]
>([]);


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

  useEffect(() => {
    if (!billId) return;
  
    async function load() {
      try {
        const data = await fetchJSON(`/vendors/bill-drafts/${billId}`);
        setDraft(data);
      } catch (err) {
        console.error("Failed to load bill draft", err);
      }
    }
  
    load();
  }, [billId]);

  useEffect(() => {
    async function loadDropdowns() {
      try {
        const vendorList = await fetchJSON("/vendors");
        setVendors(vendorList);
  
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
  
  
  
  
  useEffect(() => {
    if (!draft) return;
  
    const d = draft.Draft;   // <-- nested DB draft record
    const items = draft.LineItems || [];
  
    //
    // ---------------------------
    // Vendor
    // ---------------------------
    //
    if (draft.VendorID) {
      const vendor = mockVendors.find(v => v.id === draft.VendorID);
      setSelectedVendor(vendor || null);
    } else {
      setSelectedVendor(null);
    }
  
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
      property: draft.PropertyLabel || "",
      unit: item.Unit || "",
      workOrder: item.WorkOrderRef || "",
      description: item.Description || "",
      glAccount: item.GLAccountName || "",
      total: item.AmountCents
        ? `$${(item.AmountCents / 100).toFixed(2)}`
        : "",
    }));
  
    setLineItems(formatted);
  
    //
    // ---------------------------
    // Attachments
    // ---------------------------
    //
    if (Array.isArray(draft.Attachments) && draft.Attachments.length > 0) {
      const a = draft.Attachments[0];
    
      const loadPdf = async () => {
        try {
          const res = await fetch(a.StoragePath);
          const blob = await res.blob();
    
          const file = new File([blob], a.FileName, {
            type: a.ContentType || "application/pdf",
          });
    
          // ⭐ Attach preview URL directly ONTO the file object
          // (TS won't complain and your uploader will use it)
          (file as any).preview = URL.createObjectURL(file);
    
          setUploadedFiles([
            {
              name: a.FileName,
              size: a.SizeBytes,
              file,  // now includes file.preview
            },
          ]);
        } catch (err) {
          console.error("Failed to load attachment PDF", err);
        }
      };
    
      loadPdf();
    }
    
  
  }, [draft]);
  
  

  const handleCancel = () => {
    closeViewer();
    navigate(-1);
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
  
    if (!billId) {
      console.error("Missing billId");
      return;
    }
  
    try {
      const payload = buildPatchPayload();
  
      console.log("PATCH PAYLOAD:", payload);
  
      await fetchJSON(`/vendors/bill-drafts/${billId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
  
      navigate(-1);
    } catch (err) {
      console.error("Failed to update bill draft:", err);
    }
  };
  
  const handleApproveBill = async () => {
    // validation stays the same as handleRecordBill
    const formFieldErrors = new Set<string>();
    let hasErrors = false;
  
    const patchPayload = buildPatchPayload(); // your existing function
  
    // --------------------------
    // 1. Validate again before approving
    // --------------------------
    if (!patchPayload.vendor_id) {
      formFieldErrors.add("vendor_id");
      hasErrors = true;
    }
    
    if (!patchPayload.statement_date) {
      formFieldErrors.add("statement_date");
      hasErrors = true;
    }
    
    if (!patchPayload.due_date) {
      formFieldErrors.add("due_date");
      hasErrors = true;
    }
    
    if (!patchPayload.line_items || patchPayload.line_items.length === 0) {
      alert("A bill must have at least one line item.");
      hasErrors = true;
    }
    
  
    if (hasErrors) {
      setLineItemErrors(lineItemErrors);
      return;
    }
  
    if (!billId) {
      console.error("Missing billId");
      return;
    }
  
    try {
      // --------------------------
      // 2. First PATCH the draft
      // --------------------------
      await fetchJSON(`/vendors/bill-drafts/${billId}`, {
        method: "PATCH",
        body: JSON.stringify(patchPayload),
      });
  
      // --------------------------
      // 3. Then APPROVE the draft
      // --------------------------
      const approvePayload = {
        vendor_id: patchPayload.vendor_id,
        invoice_number: patchPayload.invoice_number,
        statement_date: patchPayload.statement_date,
        due_date: patchPayload.due_date,
        memo: patchPayload.memo,
      
        line_items: patchPayload.line_items.map((li) => ({
          line_id: li.line_id,                                 // REQUIRED by backend
          property_id: li.property_id ?? null,                 // must be number | null
          unit: li.unit || "",
          work_order_ref: li.work_order_ref || "",
          gl_account_id: li.gl_account_id || "",
          gl_account_name: li.gl_account_name || "",
          description: li.description || "",
          amount_cents: Number(li.amount_cents) || 0,          // ensure int64
        })),
      };
      
      await fetchJSON(`/vendors/bill-drafts/${billId}/approve`, {
        method: "POST",
        body: JSON.stringify(approvePayload),
      });
  
      // --------------------------
      // 4. Notify Bills page
      // --------------------------
      window.dispatchEvent(
        new CustomEvent("billApproved", {
          detail: { timestamp: Date.now() },
        })
      );
  
      // --------------------------
      // 5. Close modal
      // --------------------------
      navigate(-1);
    } catch (err) {
      console.error("Failed to approve bill:", err);
      alert("Could not approve bill.");
    }
  };
  
  

  const validateDateFormat = (dateString: string): Date | null => {
    if (!dateString) return null;

    const dateRegex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/;
    if (!dateRegex.test(dateString)) {
      return null;
    }

    const [month, day, year] = dateString.split("/").map(Number);
    const date = new Date(year, month - 1, day);

    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return null;
    }

    return date;
  };

  const handleInvoiceDateInputChange = (value: string) => {
    setInvoiceDateInput(value);
    setInvoiceDateError("");

    if (value.length === 10) {
      const parsedDate = validateDateFormat(value);
      if (parsedDate) {
        setInvoiceDate(parsedDate);
      } else {
        setInvoiceDateError("Invalid date format. Use mm/dd/yyyy");
      }
    }
  };

  const handleDueDateInputChange = (value: string) => {
    setDueDateInput(value);
    setDueDateError("");

    if (value.length === 10) {
      const parsedDate = validateDateFormat(value);
      if (parsedDate) {
        setDueDate(parsedDate);
      } else {
        setDueDateError("Invalid date format. Use mm/dd/yyyy");
      }
    }
  };

  const handleInvoiceDateSelect = (date: Date) => {
    setInvoiceDate(date);
    setInvoiceDateInput(format(date, "MM/dd/yyyy"));
    setInvoiceDateError("");
  };

  const handleDueDateSelect = (date: Date) => {
    setDueDate(date);
    setDueDateInput(format(date, "MM/dd/yyyy"));
    setDueDateError("");
  };

  // Add Escape key handler
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeViewer();
        navigate(-1);
      }
    };

    window.addEventListener("keydown", handleEscapeKey);
    return () => window.removeEventListener("keydown", handleEscapeKey);
  }, [navigate]);

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
      const url = URL.createObjectURL(file);
      setViewingFileUrl(url);
      setViewingFileIndex(0);
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
        if (field === "property") {
          updated.workOrder = "";
          loadWorkOrdersForProperty(value);
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
        workOrder: "",
        description: "",
        glAccount: "",
        total: "",
      },
    ]);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      Array.from(files).forEach((file) => {
        setUploadedFiles((prev) => [
          ...prev,
          {
            name: file.name.replace(/\.[^.]*$/, ""),
            size: file.size,
            file,
          },
        ]);
      });
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
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
    const url = URL.createObjectURL(file);
    setViewingFileUrl(url);
    setViewingFileIndex(index);
  };

  const closeViewer = () => {
    if (viewingFileUrl) {
      URL.revokeObjectURL(viewingFileUrl);
    }
    setViewingFileUrl(null);
    setViewingFileIndex(null);
  };

  const handleDownloadFile = () => {
    if (viewingFileIndex !== null && uploadedFiles[viewingFileIndex]) {
      const file = uploadedFiles[viewingFileIndex];
      const url = URL.createObjectURL(file.file);
      const a = document.createElement("a");
      a.href = url;
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
      URL.revokeObjectURL(url);
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


  const loadWorkOrdersForProperty = useCallback(async (propertyName: string) => {
    try {
      const prop = properties.find((p) => p.name === propertyName);
      if (!prop) return;
  
      const list = await fetchJSON(
        `/maintenance/work-orders?property_id=${prop.id}`
      );
  
      // Normalize result → assume backend returns { ID, Number }
      const normalized = list.map((wo: any) => ({
        id: wo.ID,
        number: wo.Number || wo.WorkOrderRef || `WO-${wo.ID}`,
      }));
  
      setWorkOrdersByProperty((prev) => ({
        ...prev,
        [propertyName]: normalized,
      }));
    } catch (err) {
      console.error("Failed to load work orders for property", err);
    }
  }, [properties]);
  

  const buildLineItemPayload = () => {
    return lineItems.map((item) => {
      // 1. Convert property name → id
      const property_id = propertyMap[item.property] ?? null;
  
      // 2. Convert GL account string → id + name
      const gl = glAccountOptions.find(
        (g) => g.id.toString() === item.glAccount
      );
  
      return {
        line_id: item.id,
        property_id: property_id,
        unit: "", // always empty for now
  
        work_order_ref: item.workOrder ? item.workOrder.toString() : "",
  
        gl_account_id: gl?.id?.toString() ?? "",
        gl_account_name: gl?.name ?? "",
  
        description: item.description,
        amount_cents: toCents(item.total),
      };
    });
  };

  const buildPatchPayload = () => {
    console.log("LINE ITEM PROPERTY LOOKUP", {
      lineItems,
      propertyMap,
      mapped: lineItems.map(li => ({
        property: li.property,
        id: propertyMap[li.property]
      }))
    });
    return {
      vendor_id: selectedVendor ? selectedVendor.id : null,
      property_id: null, // not per-line — backend ignores this for line items
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
        height: "100vh",
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
              padding: "24px 32px",
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
                      className="rounded-lg bg-white border border-dashed border-[#121212]/40 flex flex-col overflow-hidden justify-center flex-1"
                      style={{ padding: "16px 24px" }}
                    >
                      <div className="self-center flex flex-col items-center">
                        <div className="flex flex-col items-center p-2.5 text-[#09090B] leading-[1]">
                          <div>Choose a file or drag & drop it here</div>
                          <div className="mt-2">
                            JPEG, PNG and PDF formats, up to 50 MB.
                          </div>
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
                      className="flex flex-col flex-1"
                      style={{
                        padding: "24px 0",
                        overflow: "hidden",
                        display: "flex",
                        flexDirection: "column",
                      }}
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
                            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-[#E5E7EB]"
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
                              <div className="flex-1 min-w-0">
                                <div className="text-sm text-[#303030] truncate">
                                  {file.name}{" "}
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
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              </div>
            ) : (
              <div
                className="flex flex-col flex-1 w-full h-full"
                style={{ display: "flex", flexDirection: "column" }}
              >
                {!isReadOnly && (
                  <div className="flex items-center justify-between bg-gray-700 px-4 py-3 gap-2">
                    <button
                      onClick={() =>
                        !isReadOnly && fileInputRef.current?.click()
                      }
                      disabled={isReadOnly}
                      className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        isReadOnly
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-white text-gray-900 hover:bg-gray-100"
                      }`}
                      title="Upload files"
                    >
                      Upload files
                    </button>
                    <button
                      onClick={() => {}}
                      disabled={isReadOnly}
                      className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        isReadOnly
                          ? "bg-gray-400 text-gray-300 cursor-not-allowed"
                          : "bg-gray-600 text-white hover:bg-gray-500"
                      }`}
                      title="Autofill from file"
                    >
                      Autofill from file
                    </button>
                    <div className="flex-1" />
                    <button
                      onClick={() => !isReadOnly && handleDownloadFile()}
                      disabled={isReadOnly}
                      className={`rounded-lg px-3 py-2 text-sm font-medium flex items-center gap-2 transition-colors ${
                        isReadOnly
                          ? "bg-gray-400 text-gray-300 cursor-not-allowed"
                          : "bg-gray-600 text-white hover:bg-gray-500"
                      }`}
                      title="Download"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                        />
                      </svg>
                      Download
                    </button>
                    <button
                      onClick={() => !isReadOnly && handleDeleteFile()}
                      disabled={isReadOnly}
                      className={`rounded-lg px-3 py-2 text-sm font-medium flex items-center gap-2 transition-colors ${
                        isReadOnly
                          ? "bg-gray-400 text-gray-300 cursor-not-allowed"
                          : "bg-red-600 text-white hover:bg-red-700"
                      }`}
                      title="Delete"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                      Delete
                    </button>
                    <button
                      onClick={closeViewer}
                      className="text-white hover:text-gray-300 transition-colors"
                      title="Close"
                    >
                      <svg
                        className="w-6 h-6"
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
                  </div>
                )}
                <div className="flex-1 overflow-auto w-full">
                  <iframe
                    src={viewingFileUrl}
                    className="w-full h-full border-0"
                    title="Document Preview"
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
            }}
          >
            <div
              className="px-8 py-6"
              style={{
                minWidth: "fit-content",
                padding: "24px 32px 24px 16px",
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
                  className="flex mt-3 flex-col"
                  style={{ width: "auto", alignSelf: "start" }}
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
                      className="flex items-start flex-wrap"
                      style={{
                        width: "600px",
                        marginBottom: "-10px",
                        gap: "20px",
                      }}
                    >
                      <div className="flex flex-col flex-1 min-w-[240px]">
                        <label className="text-[#303030] text-sm font-medium leading-[1.43]">
                          Vendor{" "}
                          <span style={{ color: "rgb(255, 0, 0)" }}>*</span>
                        </label>
                        <Select
                          value={selectedVendor?.id.toString() || ""}
                          onValueChange={(vendorId) => {
                            if (!isReadOnly) {
                              const vendor = vendors.find(v => v.id.toString() === vendorId);
                              setSelectedVendor(vendor || null);
                              setFormErrors((prev) => {
                                const newErrors = new Set(prev);
                                newErrors.delete("vendor");
                                return newErrors;
                              });
                            }
                          }}
                          disabled={isReadOnly}
                        >
                          <SelectTrigger
                            className={`rounded-lg bg-white border mt-2 w-full px-3 py-2 text-base text-[#303030] font-normal tracking-[-0.32px] leading-[1.4] ${
                              formErrors.has("vendor")
                                ? "border-red-500 border-2"
                                : "border-[#E5E5E5]"
                            }`}
                          >
                            <SelectValue placeholder="Select vendor..." />
                          </SelectTrigger>
                          <SelectContent>
                            {vendors.map((vendor) => (
                              <SelectItem
                                key={vendor.id}
                                value={vendor.id.toString()}
                              >
                                {vendor.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex flex-col flex-1 min-w-[240px]">
                        <label className="text-[#303030] text-sm font-medium leading-[1.43]">
                          Reference Number
                        </label>
                        <input
                          type="text"
                          value={referenceNumber}
                          onChange={(e) =>
                            !isReadOnly && setReferenceNumber(e.target.value)
                          }
                          placeholder="INV-2024-001"
                          disabled={isReadOnly}
                          className="rounded-lg bg-white border border-[#E5E5E5] mt-2 w-full px-3 py-2 items-center gap-2 overflow-hidden text-base text-[#303030] font-normal whitespace-nowrap tracking-[-0.32px] leading-[1.4] focus:outline-none focus:border-[#3b82f6]"
                          style={
                            {
                              "--tw-placeholder-opacity": "1",
                              "--tw-placeholder-color": "rgb(161, 161, 169)",
                            } as React.CSSProperties
                          }
                        />
                      </div>
                    </div>

                    {/* Invoice Date and Due Date Row */}
                    <div
                      className="flex mt-5 items-start gap-5 flex-wrap"
                      style={{ width: "600px" }}
                    >
                      <div className="flex flex-col flex-1 min-w-[240px]">
                        <label className="text-[#303030] text-sm font-medium leading-[1.43]">
                          Invoice Date{" "}
                          <span style={{ color: "rgb(255, 0, 0)" }}>*</span>
                        </label>
                        <input
                          type="date"
                          placeholder="mm/dd/yyyy"
                          value={
                            invoiceDate ? format(invoiceDate, "yyyy-MM-dd") : ""
                          }
                          onChange={(e) => {
                            if (!isReadOnly && e.target.value) {
                              const date = new Date(e.target.value);
                              setInvoiceDate(date);
                              setInvoiceDateInput(format(date, "MM/dd/yyyy"));
                              setInvoiceDateError("");
                              setFormErrors((prev) => {
                                const newErrors = new Set(prev);
                                newErrors.delete("invoiceDate");
                                return newErrors;
                              });
                            } else if (!isReadOnly) {
                              setInvoiceDate(null);
                              setInvoiceDateInput("");
                            }
                          }}
                          disabled={isReadOnly}
                          className={`rounded-lg bg-white border mt-2 w-full px-3 py-2 text-base text-[#303030] font-normal tracking-[-0.32px] leading-[1.4] focus:outline-none focus:border-[#3b82f6] placeholder-[#A1A1A9] ${
                            formErrors.has("invoiceDate")
                              ? "border-red-500 border-2"
                              : "border-[#E5E5E5]"
                          }`}
                        />
                        {invoiceDateError && (
                          <div className="text-red-500 text-xs mt-1">
                            {invoiceDateError}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col flex-1 min-w-[240px]">
                        <label className="text-[#303030] text-sm font-medium leading-[1.43]">
                          Due Date{" "}
                          <span style={{ color: "rgb(255, 0, 0)" }}>*</span>
                        </label>
                        <input
                          type="date"
                          placeholder="mm/dd/yyyy"
                          value={dueDate ? format(dueDate, "yyyy-MM-dd") : ""}
                          onChange={(e) => {
                            if (!isReadOnly && e.target.value) {
                              const date = new Date(e.target.value);
                              setDueDate(date);
                              setDueDateInput(format(date, "MM/dd/yyyy"));
                              setDueDateError("");
                              setFormErrors((prev) => {
                                const newErrors = new Set(prev);
                                newErrors.delete("dueDate");
                                return newErrors;
                              });
                            } else if (!isReadOnly) {
                              setDueDate(null);
                              setDueDateInput("");
                            }
                          }}
                          disabled={isReadOnly}
                          className={`rounded-lg bg-white border mt-2 w-full px-3 py-2 text-base text-[#303030] font-normal tracking-[-0.32px] leading-[1.4] focus:outline-none focus:border-[#3b82f6] placeholder-[#A1A1A9] ${
                            formErrors.has("dueDate")
                              ? "border-red-500 border-2"
                              : "border-[#E5E5E5]"
                          }`}
                        />
                        {dueDateError && (
                          <div className="text-red-500 text-xs mt-1">
                            {dueDateError}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Memo/Notes */}
                    <div
                      className="flex mt-5 w-full flex-col"
                      style={{ width: "600px" }}
                    >
                      <label className="text-[#303030] text-sm font-medium leading-[1.43]">
                        Memo/Notes
                      </label>
                      <textarea
                        value={memo}
                        onChange={(e) => !isReadOnly && setMemo(e.target.value)}
                        placeholder="Additional notes..."
                        disabled={isReadOnly}
                        className="rounded-lg bg-white border border-[#E5E7EB] mt-2 min-h-[81px] w-full px-3 py-2 overflow-hidden text-base text-[#303030] font-normal tracking-[-0.32px] leading-[22px] resize-none focus:outline-none focus:border-[#3b82f6] placeholder-[#A1A1A9]"
                      />
                    </div>
                  </div>
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
                              Property / Ledger
                            </span>
                          </div>
                          <div
                            className="flex items-center gap-2 border-b border-r border-[#DADADA]/50 px-3 py-3 flex-shrink-0"
                            style={{ width: `${columnWidths.unit}px` }}
                          >
                            <span className="text-[#525252] text-[13px] font-medium leading-[140%] tracking-[-0.26px] whitespace-nowrap">
                              Unit
                            </span>
                          </div>
                          <div
                            className="flex items-center gap-2 border-b border-r border-[#DADADA]/50 px-3 py-3 flex-shrink-0"
                            style={{ width: `${columnWidths.workOrder}px` }}
                          >
                            <span className="text-[#525252] text-[13px] font-medium leading-[140%] tracking-[-0.26px] whitespace-nowrap">
                              Work Order
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
                              GL Account
                            </span>
                          </div>
                          <div
                            className="flex items-center gap-2 border-b border-r border-[#DADADA]/50 px-3 py-3 flex-shrink-0"
                            style={{ width: `${columnWidths.total}px` }}
                          >
                            <span className="text-[#525252] text-[13px] font-medium leading-[140%] tracking-[-0.26px] whitespace-nowrap">
                              Total
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
                              className={`flex items-center border-b border-r px-3 min-h-14 py-2 flex-shrink-0 ${
                                lineItemErrors[item.id]?.has("property")
                                  ? "border-red-500 border-2"
                                  : "border-[#DADADA]/50"
                              }`}
                              style={{ width: `${columnWidths.property}px` }}
                            >
                              <Select
                                value={item.property}
                                onValueChange={(value) => {
                                  if (!isReadOnly) {
                                    handleUpdateLineItem(
                                      item.id,
                                      "property",
                                      value,
                                    );
                                  }
                                }}
                                disabled={isReadOnly}
                              >
                                <SelectTrigger
                                  className="w-full h-auto px-0 py-0 text-[13px] border-0 bg-transparent whitespace-nowrap"
                                  data-measure-width="property"
                                >
                                  <SelectValue placeholder="Select a Property" />
                                </SelectTrigger>
                                <SelectContent>
                                  {properties.map((prop) => (
                                    <SelectItem key={prop.id} value={prop.name}>
                                      {prop.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Unit */}
                            <div
                              className={`flex items-center border-b border-r px-3 min-h-14 py-2 flex-shrink-0 ${
                                lineItemErrors[item.id]?.has("unit")
                                  ? "border-red-500 border-2"
                                  : "border-[#DADADA]/50"
                              }`}
                              style={{ width: `${columnWidths.unit}px` }}
                            >
                              <Select
                                value={item.unit}
                                onValueChange={(value) => {
                                  if (!isReadOnly) {
                                    handleUpdateLineItem(
                                      item.id,
                                      "unit",
                                      value,
                                    );
                                  }
                                }}
                                disabled={isReadOnly}
                              >
                                <SelectTrigger
                                  className="w-full h-auto px-0 py-0 text-[13px] border-0 bg-transparent whitespace-nowrap"
                                  data-measure-width="unit"
                                >
                                  <SelectValue placeholder="Select a Unit" />
                                </SelectTrigger>
                                <SelectContent>
                                  {mockUnits.map((unit) => (
                                    <SelectItem key={unit} value={unit}>
                                      {unit}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Work Order */}
                            <div
                              className={`flex items-center border-b border-r px-3 min-h-14 py-2 flex-shrink-0 ${
                                lineItemErrors[item.id]?.has("workOrder")
                                  ? "border-red-500 border-2"
                                  : "border-[#DADADA]/50"
                              }`}
                              style={{ width: `${columnWidths.workOrder}px` }}
                            >
                              <Select
                                disabled={!item.property || isReadOnly}
                                value={item.workOrder}
                                onValueChange={(value) => {
                                  if (!isReadOnly) {
                                    handleUpdateLineItem(
                                      item.id,
                                      "workOrder",
                                      value,
                                    );
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
                                    const workOrders = workOrdersByProperty[item.property] || [];

                                    if (workOrders.length === 0) {
                                      return (
                                        <div className="px-3 py-2 text-xs text-gray-400">
                                          Select a property first
                                        </div>
                                      );
                                    }

                                    return workOrders.map((wo) => (
                                      <SelectItem key={wo.id} value={wo.id.toString()}>
                                        {wo.number}
                                      </SelectItem>
                                    ));
                                  })()}
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Description */}
                            <div
                              className="flex items-center border-b border-r border-[#DADADA]/50 px-3 min-h-14 py-2 flex-1"
                              style={{
                                minWidth: `${columnWidths.description}px`,
                              }}
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
                              className={`flex items-center border-b border-r px-3 min-h-14 py-2 flex-shrink-0 ${
                                lineItemErrors[item.id]?.has("glAccount")
                                  ? "border-red-500 border-2"
                                  : "border-[#DADADA]/50"
                              }`}
                              style={{ width: `${columnWidths.glAccount}px` }}
                            >
                              <Select
                                value={item.glAccount}
                                onValueChange={(value) => {
                                  if (!isReadOnly) {
                                    handleUpdateLineItem(
                                      item.id,
                                      "glAccount",
                                      value,
                                    );
                                  }
                                }}
                                disabled={isReadOnly}
                              >
                                <SelectTrigger
                                  className="w-full h-auto px-0 py-0 text-[13px] border-0 bg-transparent whitespace-nowrap"
                                  data-measure-width="glAccount"
                                >
                                  <SelectValue placeholder="Select an Account" />
                                </SelectTrigger>
                                <SelectContent>
                                  {glAccountOptions.map((gl) => (
                                    <SelectItem key={gl.id} value={gl.id.toString()}>
                                      {gl.name}
                                    </SelectItem>
                                  ))}
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
                  onClick={handleApproveBill}
                  className="rounded-lg flex min-h-9 px-3 py-2 items-center gap-2 overflow-hidden font-medium transition-colors bg-[#013764] text-white hover:bg-[#0a2e4d]"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    backgroundColor: "rgb(1, 55, 100)",
                    borderRadius: "8px",
                    boxShadow:
                      "rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgb(0, 45, 90) 0px 0px 0px 1px",
                    color: "rgb(255, 255, 255)",
                    fontWeight: "500",
                    gap: "8px",
                    minHeight: "36px",
                    overflowX: "hidden",
                    overflowY: "hidden",
                    transitionDuration: "0.15s",
                    transitionProperty:
                      "color, background-color, border-color, text-decoration-color, fill, stroke",
                    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
                    borderColor: "rgba(0, 0, 0, 0)",
                    padding: "8px 12px",
                  }}
                >
                  <span>Approve</span>
                </button>
                <button
                  onClick={handleRecordBill}
                  className="rounded-lg flex min-h-9 px-3 py-2 items-center gap-2 overflow-hidden font-medium transition-colors bg-[#013764] text-white hover:bg-[#0a2e4d]"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    backgroundColor: "rgb(1, 55, 100)",
                    borderRadius: "8px",
                    boxShadow:
                      "rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgb(0, 45, 90) 0px 0px 0px 1px",
                    color: "rgb(255, 255, 255)",
                    fontWeight: "500",
                    gap: "8px",
                    minHeight: "36px",
                    overflowX: "hidden",
                    overflowY: "hidden",
                    transitionDuration: "0.15s",
                    transitionProperty:
                      "color, background-color, border-color, text-decoration-color, fill, stroke",
                    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
                    borderColor: "rgba(0, 0, 0, 0)",
                    padding: "8px 12px",
                  }}
                >
                  <span>Approve & Export</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
