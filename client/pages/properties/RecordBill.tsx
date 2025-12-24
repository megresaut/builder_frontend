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
      ? mockVendors.find((v) => v.name === vendorName) ?? null
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

export const RecordBill = () => {
  const navigate = useNavigate();
  const location = useLocation<{ bill?: ViewBillState }>();
  const [searchParams] = useSearchParams();
  const isReadOnly = searchParams.get("readOnly") === "true";
  const billIdParam = searchParams.get("billId");
  const billId = billIdParam ? Number(billIdParam) : Number.NaN;
  const resolvedBillId = Number.isFinite(billId) ? billId : Date.now();

  const stateBill = location.state?.bill;

  const readOnlyBill = isReadOnly ? buildReadOnlyBillFromState(stateBill) : null;

  const editableBill = !isReadOnly && stateBill
    ? buildEditableBillFromState(stateBill)
    : null;

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
        ? readOnlyBill?.invoiceDate ?? placeholderBill.invoiceDate
        : editableBill?.invoiceDate) ?? null;
    return date ? format(date, "MM/dd/yyyy") : "";
  });
  const [dueDateInput, setDueDateInput] = useState<string>(() => {
    const date =
      (isReadOnly
        ? readOnlyBill?.dueDate ?? placeholderBill.dueDate
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
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [lineItemErrors, setLineItemErrors] = useState<{
    [key: number]: Set<string>;
  }>({});
  const [formErrors, setFormErrors] = useState<Set<string>>(new Set());
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
  };

  const [columnWidths, setColumnWidths] = useState(defaultColumnWidths);

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

  const handleCancel = () => {
    closeViewer();
    navigate(-1);
  };

  const validateDateFormat = (dateString: string): Date | null => {
    if (!dateString) return null;
    const [month, day, year] = dateString.split("/");
    const monthNum = parseInt(month, 10);
    const dayNum = parseInt(day, 10);
    const yearNum = parseInt(year, 10);

    if (!month || !day || !year) return null;
    if (monthNum < 1 || monthNum > 12 || dayNum < 1 || dayNum > 31 || yearNum < 1900) return null;

    const date = new Date(yearNum, monthNum - 1, dayNum);
    if (date.getMonth() !== monthNum - 1) return null;

    return date;
  };

  const handleRecordBill = () => {
    const formFieldErrors = new Set<string>();
    let hasErrors = false;

    const isValidVendor =
      !!selectedVendor && mockVendors.some((v) => v.id === selectedVendor.id);

    const parsedInvoiceDate = validateDateFormat(invoiceDateInput);
    const parsedDueDate = validateDateFormat(dueDateInput);

    if (!isValidVendor) {
      formFieldErrors.add("vendor");
      hasErrors = true;
    }

    if (!parsedInvoiceDate) {
      formFieldErrors.add("invoiceDate");
      hasErrors = true;
      if (invoiceDateInput.trim().length > 0) {
        setInvoiceDateError("Invalid date. Please use mm/dd/yyyy format.");
      }
    }

    if (!parsedDueDate) {
      formFieldErrors.add("dueDate");
      hasErrors = true;
      if (dueDateInput.trim().length > 0) {
        setDueDateError("Invalid date. Please use mm/dd/yyyy format.");
      }
    }

    setFormErrors(formFieldErrors);

    const lineItemsErrors: { [key: number]: Set<string> } = {};

    if (lineItems.length === 0) {
      hasErrors = true;
    } else {
      for (const item of lineItems) {
        const itemErrors = new Set<string>();

        const propertyVal = String(item.property).trim();
        if (!propertyVal || !mockProperties.includes(propertyVal)) {
          itemErrors.add("property");
          hasErrors = true;
        }

        const unitVal = String(item.unit).trim();
        if (!unitVal || unitVal === "N/A" || !mockUnits.includes(unitVal)) {
          itemErrors.add("unit");
          hasErrors = true;
        }

        const glAccountVal = String(item.glAccount).trim();
        if (!glAccountVal || !mockGLAccounts.includes(glAccountVal)) {
          itemErrors.add("glAccount");
          hasErrors = true;
        }

        const totalVal = String(item.total).trim();
        const parsedTotal = Number.parseFloat(totalVal.replace(/[^0-9.]/g, ""));
        if (!totalVal || !Number.isFinite(parsedTotal)) {
          itemErrors.add("total");
          hasErrors = true;
        }

        if (itemErrors.size > 0) {
          lineItemsErrors[item.id] = itemErrors;
        }
      }
    }

    setLineItemErrors(lineItemsErrors);

    if (hasErrors) {
      return;
    }

    const amount = Number.parseFloat(
      calculateTotal().replace(/[^0-9.]/g, ""),
    );

    const billData = {
      billId: resolvedBillId,
      timestamp: Date.now(),
      vendor: selectedVendor?.name,
      invoiceDate: format(parsedInvoiceDate, "MMM d, yyyy"),
      dueDate: format(parsedDueDate, "MMM d, yyyy"),
      referenceNumber,
      memo,
      amount: Number.isFinite(amount) ? amount : 0,
      lineItems,
      uploadedFiles,
      status: "approved" as const,
    };

    localStorage.setItem(
      "avm:lastBillEvent",
      JSON.stringify({ type: "approved", detail: billData }),
    );

    window.dispatchEvent(new CustomEvent("billApproved", { detail: billData }));
    navigate(-1);
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
      const url = URL.createObjectURL(file);
      setViewingFileUrl(url);
      setViewingFileIndex(0);
    }
  }, [isReadOnly, uploadedFiles, viewingFileUrl]);

  const handleUpdateLineItem = (id: number, field: string, value: string) => {
    setLineItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
    // Clear error for this field when user updates it
    setLineItemErrors((prev) => {
      const itemErrors = new Set(prev[id]);
      itemErrors.delete(field);
      if (itemErrors.size === 0) {
        const newErrors = { ...prev };
        delete newErrors[id];
        return newErrors;
      }
      return { ...prev, [id]: itemErrors };
    });
    // Measure immediately on update
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
                  <div className="flex gap-5">
                    <div className="flex-1">
                      <SelectField
                        label="Vendor"
                        required
                        value={selectedVendor?.id.toString() || ""}
                        onChange={(vendorId) => {
                          if (!isReadOnly) {
                            const vendor = mockVendors.find(
                              (v) => v.id.toString() === vendorId,
                            );
                            setSelectedVendor(vendor || null);
                            setFormErrors((prev) => {
                              const newErrors = new Set(prev);
                              newErrors.delete("vendor");
                              return newErrors;
                            });
                          }
                        }}
                        placeholder="Select vendor..."
                        disabled={isReadOnly}
                        error={formErrors.has("vendor") ? "Vendor is required" : undefined}
                        options={mockVendors.map((vendor) => ({
                          value: vendor.id.toString(),
                          label: vendor.name,
                        }))}
                      />
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={() => setShowAddVendorModal(true)}
                        className="text-[#2563eb] text-sm font-medium leading-[1.43] hover:underline bg-transparent border-none p-0"
                        style={{ marginTop: "32px" }}
                      >
                        + Add Vendor
                      </button>
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
                        error={invoiceDateError || (formErrors.has("invoiceDate") ? "Invoice Date is required" : undefined)}
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
                        error={dueDateError || (formErrors.has("dueDate") ? "Due Date is required" : undefined)}
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
                              Property / Ledger <span style={{ color: "rgb(255, 0, 0)" }}>*</span>
                            </span>
                          </div>
                          <div
                            className="flex items-center gap-2 border-b border-r border-[#DADADA]/50 px-3 py-3 flex-shrink-0"
                            style={{ width: `${columnWidths.unit}px` }}
                          >
                            <span className="text-[#525252] text-[13px] font-medium leading-[140%] tracking-[-0.26px] whitespace-nowrap">
                              Unit <span style={{ color: "rgb(255, 0, 0)" }}>*</span>
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
                              GL Account&nbsp;<span style={{ color: "rgb(255, 0, 0)", letterSpacing: "-0.26px" }}>*</span>
                            </span>
                          </div>
                          <div
                            className="flex items-center gap-2 border-b border-r border-[#DADADA]/50 px-3 py-3 flex-shrink-0"
                            style={{ width: `${columnWidths.total}px` }}
                          >
                            <span className="text-[#525252] text-[13px] font-medium leading-[140%] tracking-[-0.26px] whitespace-nowrap">
                              Total&nbsp;<span style={{ color: "rgb(255, 0, 0)", letterSpacing: "-0.26px" }}>*</span>
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
                              <SelectFieldCell
                                value={item.property}
                                onChange={(value) => {
                                  if (!isReadOnly) {
                                    handleUpdateLineItem(
                                      item.id,
                                      "property",
                                      value,
                                    );
                                  }
                                }}
                                placeholder="Select a Property"
                                options={mockProperties.map((prop) => ({
                                  value: prop,
                                  label: prop,
                                }))}
                                disabled={isReadOnly}
                                error={lineItemErrors[item.id]?.has("property")}
                              />
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
                                  {mockGLAccounts.map((account) => (
                                    <SelectItem key={account} value={account}>
                                      {account}
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
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    // Validate top-level form fields
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

                    const timestamp = Date.now();
                    const amount = Number.parseFloat(
                      calculateTotal().replace(/[^0-9.]/g, ""),
                    );

                    const isNewBill = !Number.isFinite(billId);
                    const detail = {
                      billId: resolvedBillId,
                      timestamp,
                      vendor: selectedVendor?.name,
                      invoiceDate: invoiceDate
                        ? format(invoiceDate, "MMM d, yyyy")
                        : invoiceDateInput,
                      dueDate: dueDate
                        ? format(dueDate, "MMM d, yyyy")
                        : dueDateInput,
                      referenceNumber,
                      memo,
                      amount: Number.isFinite(amount) ? amount : 0,
                      status: "draft" as const,
                      ...(isNewBill && { importStatus: "Manual Import" as const }),
                    };

                    localStorage.setItem(
                      "avm:lastBillEvent",
                      JSON.stringify({ type: "saved", detail }),
                    );

                    window.dispatchEvent(
                      new CustomEvent("billSaved", {
                        detail,
                      }),
                    );

                    navigate(-1);
                  }}
                  className="rounded-lg flex min-h-9 px-3 py-1.5 items-center gap-2 text-[#303030] font-normal whitespace-nowrap tracking-[-0.32px] leading-[1.4] hover:bg-gray-100 transition-colors"
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
                    handleRecordBill();
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
                  <span className="text-white text-sm font-medium leading-5">Approve & Export</span>
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
    </div>
  );
};
