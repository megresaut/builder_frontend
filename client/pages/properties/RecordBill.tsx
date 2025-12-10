import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StickyBottomBar } from "@/components/StickyBottomBar";

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
const mockUnits = ["1", "2", "3", "4", "5"];
const mockWorkOrders = ["123456-1", "123456-2", "789012-1"];
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

export const RecordBill = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isReadOnly = searchParams.get("readOnly") === "true";
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(
    isReadOnly ? placeholderBill.vendor : null,
  );
  const [referenceNumber, setReferenceNumber] = useState<string>(
    isReadOnly ? placeholderBill.referenceNumber : "",
  );
  const [invoiceDate, setInvoiceDate] = useState<Date | null>(
    isReadOnly ? placeholderBill.invoiceDate : null,
  );
  const [dueDate, setDueDate] = useState<Date | null>(
    isReadOnly ? placeholderBill.dueDate : null,
  );
  const [invoiceDateInput, setInvoiceDateInput] = useState<string>(
    isReadOnly ? format(placeholderBill.invoiceDate, "MM/dd/yyyy") : "",
  );
  const [dueDateInput, setDueDateInput] = useState<string>(
    isReadOnly ? format(placeholderBill.dueDate, "MM/dd/yyyy") : "",
  );
  const [memo, setMemo] = useState<string>(
    isReadOnly ? placeholderBill.memo : "",
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
  const [lineItems, setLineItems] = useState<LineItem[]>(
    isReadOnly ? placeholderBill.lineItems : [
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
    navigate(-1);
  };

  const handleRecordBill = () => {
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

    setFormErrors(formFieldErrors);

    // Validate all line items have required fields
    const lineItemsErrors: { [key: number]: Set<string> } = {};

    for (const item of lineItems) {
      const itemErrors = new Set<string>();

      if (!item.property.trim()) {
        itemErrors.add("property");
        hasErrors = true;
      }
      if (!item.unit.trim()) {
        itemErrors.add("unit");
        hasErrors = true;
      }
      if (!item.workOrder.trim()) {
        itemErrors.add("workOrder");
        hasErrors = true;
      }
      if (!item.glAccount.trim()) {
        itemErrors.add("glAccount");
        hasErrors = true;
      }
      if (!item.total.trim()) {
        itemErrors.add("total");
        hasErrors = true;
      }

      if (itemErrors.size > 0) {
        lineItemsErrors[item.id] = itemErrors;
      }
    }

    if (hasErrors) {
      setLineItemErrors(lineItemsErrors);
      return;
    }

    navigate(-1);
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
      style={{ minHeight: "100vh" }}
    >
      {/* Two-Column Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Column - File Upload (Fixed) */}
        {isLeftPanelOpen && (
          <div
            className="w-1/2 border-r border-[#E5E7EB] px-8 py-6 flex-shrink-0 overflow-hidden"
            style={{
              alignSelf: "stretch",
              display: "flex",
              flexDirection: "column",
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
                      className="rounded-lg bg-white border border-dashed border-[#121212]/40 flex flex-col overflow-hidden px-20 py-7 justify-center"
                      style={{ padding: "28px 80px", flex: 1 }}
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
                    onClick={() => !isReadOnly && fileInputRef.current?.click()}
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
          className="w-6 h-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
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
        <div className="flex flex-col flex-1" style={{ overflow: "hidden" }}>
          {/* Scrollable Content Area */}
          <div
            className="overflow-auto"
            style={{ width: "100%", height: "100%", paddingBottom: "72px" }}
          >
            <div className="px-8 py-6" style={{ minWidth: "fit-content" }}>
              {/* Bill Details Section */}
              <div className="flex flex-col w-full">
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
                        width: "665px",
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
                            {mockVendors.map((vendor) => (
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
                          onChange={(e) => !isReadOnly && setReferenceNumber(e.target.value)}
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
                      style={{ width: "665px" }}
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
                      style={{ width: "665px" }}
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
                                  {mockProperties.map((prop) => (
                                    <SelectItem key={prop} value={prop}>
                                      {prop}
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
                                    handleUpdateLineItem(item.id, "unit", value);
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
                                disabled={isReadOnly}
                              >
                                <SelectTrigger
                                  className="w-full h-auto px-0 py-0 text-[13px] border-0 bg-transparent whitespace-nowrap"
                                  data-measure-width="workOrder"
                                >
                                  <SelectValue placeholder="Select a Work Order" />
                                </SelectTrigger>
                                <SelectContent>
                                  {mockWorkOrders.map((wo) => (
                                    <SelectItem key={wo} value={wo}>
                                      {wo}
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
                                  if (!isReadOnly && (
                                    value === "" ||
                                    /^\$?[\d,]*\.?\d{0,2}$/.test(value)
                                  )) {
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
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-4"
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
        className="fixed bottom-0 right-0 bg-white border-t border-[#E5E7EB] z-40 shadow-[0_-2px_8px_rgba(0,0,0,0.05)]"
        style={{
          padding: "16px 32px",
          left: sidebarVisible ? "262px" : "0px",
          transition: "left 0.3s ease",
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
            {isReadOnly && (
              <button
                onClick={handleCancel}
                className="rounded-lg flex min-h-9 px-3 py-1.5 items-center gap-2 bg-white border border-gray-300 text-gray-700 font-medium whitespace-nowrap tracking-[-0.32px] leading-[1.4] hover:bg-gray-50 transition-colors"
              >
                <span>Close</span>
              </button>
            )}
            {!isReadOnly && (
              <button
                onClick={handleCancel}
                className="rounded-lg flex min-h-9 px-3 py-1.5 items-center gap-2 text-[#303030] font-normal whitespace-nowrap tracking-[-0.32px] leading-[1.4] hover:bg-gray-100 transition-colors"
              >
                <span>Cancel</span>
              </button>
            )}
            <button
              onClick={() => {
                if (!isReadOnly) {
                  handleRecordBill();
                } else {
                  handleCancel();
                }
              }}
              disabled={isReadOnly ? false : false}
              className={`rounded-lg shadow-[0_0_0_1px_rgba(0,45,90,1)] flex min-h-9 px-3 py-2 items-center gap-2 overflow-hidden font-medium transition-colors ${
                isReadOnly
                  ? "bg-gray-400 text-white opacity-60 cursor-default"
                  : "bg-[#013764] text-white hover:bg-[#002a4f]"
              }`}
            >
              <span>{isReadOnly ? "Exported to Buildium" : "Record Bill"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
