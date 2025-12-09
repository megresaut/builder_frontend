import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";

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

export const RecordBill = () => {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [referenceNumber, setReferenceNumber] = useState<string>("");
  const [invoiceDate, setInvoiceDate] = useState<Date | null>(null);
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [invoiceDateInput, setInvoiceDateInput] = useState<string>("");
  const [dueDateInput, setDueDateInput] = useState<string>("");
  const [memo, setMemo] = useState<string>("");
  const [invoiceDateError, setInvoiceDateError] = useState<string>("");
  const [dueDateError, setDueDateError] = useState<string>("");
  const [lineItems, setLineItems] = useState<LineItem[]>([
    {
      id: 1,
      property: "22 Indian Creek Dr",
      unit: "2",
      workOrder: "123456-1",
      description: "ConEd - 1,220 kWh",
      glAccount: "Utilities",
      total: "$462",
    },
    {
      id: 2,
      property: "22 Indian Creek Dr",
      unit: "2",
      workOrder: "123456-1",
      description: "Unit 48 Thermostat",
      glAccount: "Maintenance",
      total: "$380",
    },
    {
      id: 3,
      property: "22 Indian Creek Dr",
      unit: "2",
      workOrder: "123456-1",
      description: "Tools for common area",
      glAccount: "Other",
      total: "$120",
    },
  ]);

  // Dynamic column width tracking with default minimum widths
  const defaultColumnWidths = {
    property: 151,
    unit: 60,
    workOrder: 120,
    description: 200,
    glAccount: 120,
    total: 80,
  };

  const [columnWidths, setColumnWidths] = useState(defaultColumnWidths);

  // Measure and update column widths - expands and shrinks as needed
  const measureAndUpdateColumnWidths = useCallback(() => {
    const newWidths = { ...defaultColumnWidths };

    // Get all measurements from the DOM
    document.querySelectorAll('[data-measure-width]').forEach((element) => {
      const columnName = element.getAttribute('data-measure-width') as keyof typeof defaultColumnWidths;
      const scrollWidth = (element as HTMLElement).scrollWidth;
      const padding = 24; // px-3 = 12px * 2
      const requiredWidth = scrollWidth + padding;

      // Always set to the maximum of default or required width
      newWidths[columnName] = Math.max(defaultColumnWidths[columnName], requiredWidth);
    });

    setColumnWidths(newWidths);
  }, []);

  const handleCancel = () => {
    navigate(-1);
  };

  const handleRecordBill = () => {
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

  const handleUpdateLineItem = (id: number, field: string, value: string) => {
    setLineItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );

    // Trigger width measurement after state update
    setTimeout(() => {
      measureAndUpdateColumnWidths();
    }, 0);
  };

  const measureAndUpdateColumnWidths = () => {
    const newWidths = { ...columnWidths };
    let hasChanges = false;

    // Measure all select triggers and inputs
    document.querySelectorAll('[data-measure-width]').forEach((element) => {
      const columnName = element.getAttribute('data-measure-width') as keyof typeof columnWidths;
      const scrollWidth = (element as HTMLElement).scrollWidth;
      const padding = 24; // px-3 = 12px * 2
      const requiredWidth = scrollWidth + padding;

      if (requiredWidth > newWidths[columnName]) {
        newWidths[columnName] = requiredWidth;
        hasChanges = true;
      }
    });

    if (hasChanges) {
      setColumnWidths(newWidths);
    }
  };

  const handleDeleteLineItem = (id: number) => {
    setLineItems((prev) => prev.filter((item) => item.id !== id));
  };

  const calculateTotal = (): string => {
    const total = lineItems.reduce((sum, item) => {
      const value = parseFloat(item.total.replace("$", "").replace(",", "") || "0");
      return sum + value;
    }, 0);
    return `$${total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="bg-white flex flex-col h-screen border-l-4 border-l-[#E5E7EB] font-[Geist,-apple-system,Roboto,Helvetica,sans-serif]">
      {/* Two-Column Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Column - File Upload (Fixed) */}
        <div className="w-1/2 border-r border-[#E5E7EB] px-8 py-6 flex-shrink-0 overflow-y-auto">
          <div className="flex flex-col h-full">
            {/* File Upload Section */}
            <div className="flex flex-col flex-1 text-base font-normal">
              <div className="rounded-lg bg-white border border-dashed border-[#121212]/40 flex flex-col overflow-hidden flex-1 px-20 py-7 justify-center">
                <div className="self-center flex flex-col items-center mt-[200px]">
                  <div className="flex flex-col items-center p-2.5 text-[#09090B] leading-[1]">
                    <div>Choose a file or drag & drop it here</div>
                    <div className="mt-2">JPEG, PNG and PDF formats, up to 50 MB.</div>
                  </div>
                  <button className="rounded-lg bg-[#FBFBFB] border border-[#DADADA] shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex mt-3 min-h-9 px-3 py-1.5 items-center gap-2 text-[#303030] tracking-[-0.32px] leading-[1.4] justify-center hover:bg-gray-100 transition-colors">
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
                <div className="flex min-h-[337px] mt-6 w-full" />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Scrollable Content */}
        <div className="flex-1 overflow-x-auto">
          <div className="px-8 py-6 min-w-min">
            {/* Bill Details Section */}
            <div className="flex flex-col w-full">
              {/* Bill Details Header */}
              <div className="flex w-full flex-col text-xl text-[#303030] font-semibold leading-[1.3]">
                <div>Bill Details</div>
                <div className="h-px bg-gray-200 mt-5" style={{ width: "790px" }} />
              </div>

              {/* Form Fields */}
              <div className="flex mt-3 w-full flex-col">
                <div className="flex w-full flex-col">
                  {/* Vendor and Reference Number Row */}
                  <div className="flex items-start gap-5 flex-wrap" style={{ width: "790px" }}>
                    <div className="flex flex-col flex-1 min-w-[240px]">
                      <label className="text-[#303030] text-sm font-medium leading-[1.43]">
                        Vendor
                      </label>
                      <Select
                        value={selectedVendor?.id.toString() || ""}
                        onValueChange={(vendorId) => {
                          const vendor = mockVendors.find(
                            (v) => v.id.toString() === vendorId
                          );
                          setSelectedVendor(vendor || null);
                        }}
                      >
                        <SelectTrigger className="rounded-lg bg-white border border-[#E5E5E5] mt-2 w-full px-3 py-2 text-base text-[#A1A1A9] font-normal tracking-[-0.32px] leading-[1.4]">
                          <SelectValue placeholder="Select vendor..." />
                        </SelectTrigger>
                        <SelectContent>
                          {mockVendors.map((vendor) => (
                            <SelectItem key={vendor.id} value={vendor.id.toString()}>
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
                        onChange={(e) => setReferenceNumber(e.target.value)}
                        placeholder="INV-2024-001"
                        className="rounded-lg bg-white border border-[#E5E5E5] mt-2 w-full px-3 py-2 items-center gap-2 overflow-hidden text-base text-[#A1A1A9] font-normal whitespace-nowrap tracking-[-0.32px] leading-[1.4] focus:outline-none focus:border-[#3b82f6]"
                      />
                    </div>
                  </div>

                  {/* Invoice Date and Due Date Row */}
                  <div className="flex mt-5 items-start gap-5 flex-wrap" style={{ width: "790px" }}>
                    <div className="flex flex-col flex-1 min-w-[240px]">
                      <label className="text-[#303030] text-sm font-medium leading-[1.43]">
                        Invoice Date
                      </label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="rounded-lg bg-white border border-[#E5E5E5] mt-2 w-full px-3 py-2 text-base text-[#A1A1A9] font-normal tracking-[-0.32px] leading-[1.4] justify-between h-auto"
                          >
                            <input
                              type="text"
                              value={invoiceDateInput}
                              onChange={(e) =>
                                handleInvoiceDateInputChange(e.target.value)
                              }
                              placeholder="mm/dd/yyyy"
                              className="flex-1 bg-transparent outline-none text-[#303030]"
                              maxLength={10}
                            />
                            <CalendarIcon className="w-4 h-4 text-[#A1A1A9]" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent side="bottom" align="start" className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={invoiceDate || undefined}
                            onSelect={handleInvoiceDateSelect}
                            disabled={(date) =>
                              date > new Date() ||
                              date < new Date("1900-01-01")
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      {invoiceDateError && (
                        <div className="text-red-500 text-xs mt-1">
                          {invoiceDateError}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col flex-1 min-w-[240px]">
                      <label className="text-[#303030] text-sm font-medium leading-[1.43]">
                        Due Date
                      </label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="rounded-lg bg-white border border-[#E5E5E5] mt-2 w-full px-3 py-2 text-base text-[#A1A1A9] font-normal tracking-[-0.32px] leading-[1.4] justify-between h-auto"
                          >
                            <input
                              type="text"
                              value={dueDateInput}
                              onChange={(e) =>
                                handleDueDateInputChange(e.target.value)
                              }
                              placeholder="mm/dd/yyyy"
                              className="flex-1 bg-transparent outline-none text-[#303030]"
                              maxLength={10}
                            />
                            <CalendarIcon className="w-4 h-4 text-[#A1A1A9]" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent side="bottom" align="start" className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={dueDate || undefined}
                            onSelect={handleDueDateSelect}
                            disabled={(date) =>
                              date < new Date("1900-01-01")
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      {dueDateError && (
                        <div className="text-red-500 text-xs mt-1">
                          {dueDateError}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Memo/Notes */}
                  <div className="flex mt-5 w-full flex-col" style={{ width: "790px" }}>
                    <label className="text-[#303030] text-sm font-medium leading-[1.43]">
                      Memo/Notes
                    </label>
                    <textarea
                      value={memo}
                      onChange={(e) => setMemo(e.target.value)}
                      placeholder="Additional notes..."
                      className="rounded-lg bg-white border border-[#E5E5E5] mt-2 min-h-[81px] w-full px-3 py-2 items-center gap-2 overflow-hidden text-base text-[#A1A1A9] font-normal tracking-[-0.32px] leading-[22px] resize-none focus:outline-none focus:border-[#3b82f6]"
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
                      <div className="font-semibold">
                        Line Items
                      </div>
                      <div className="h-px bg-gray-200 mt-5" style={{ width: "790px" }} />
                    </div>
                  </div>
                  <button className="flex h-9 items-center gap-2 rounded-lg border border-white bg-[#002D5A] shadow-[0_0_0_1px_#002D5A,0_0_10px_-5px_rgba(0,0,0,0.2)] px-4 hover:bg-[#001f3f] transition-colors flex-shrink-0">
                    <span className="text-white text-base font-medium">
                      Add Line Items
                    </span>
                  </button>
                </div>

                {/* Table */}
                <div className="flex w-full flex-col rounded-xl shadow-[0_1px_2px_0_rgba(10,13,18,0.05)]">
                  <div className="flex flex-col border border-[#DADADA]/50 shadow-[0_1px_2px_0_rgba(10,13,18,0.05)] bg-white">
                    {/* Table Header */}
                    <div className="flex items-center">
                      <div className="flex items-center gap-2 border-b border-r border-[#DADADA]/50 px-3 py-3 flex-shrink-0" style={{ width: `${columnWidths.property}px` }}>
                        <span className="text-[#525252] text-[13px] font-medium leading-[140%] tracking-[-0.26px] whitespace-nowrap">
                          Property / Ledger
                        </span>
                      </div>
                      <div className="flex items-center gap-2 border-b border-r border-[#DADADA]/50 px-3 py-3 flex-shrink-0" style={{ width: `${columnWidths.unit}px` }}>
                        <span className="text-[#525252] text-[13px] font-medium leading-[140%] tracking-[-0.26px] whitespace-nowrap">
                          Unit
                        </span>
                      </div>
                      <div className="flex items-center gap-2 border-b border-r border-[#DADADA]/50 px-3 py-3 flex-shrink-0" style={{ width: `${columnWidths.workOrder}px` }}>
                        <span className="text-[#525252] text-[13px] font-medium leading-[140%] tracking-[-0.26px] whitespace-nowrap">
                          Work Order
                        </span>
                      </div>
                      <div className="flex items-center gap-2 border-b border-r border-[#DADADA]/50 px-3 py-3 flex-1" style={{ minWidth: `${columnWidths.description}px` }}>
                        <span className="text-[#525252] text-[13px] font-medium leading-[140%] tracking-[-0.26px] whitespace-nowrap">
                          Description
                        </span>
                      </div>
                      <div className="flex items-center gap-2 border-b border-r border-[#DADADA]/50 px-3 py-3 flex-shrink-0" style={{ width: `${columnWidths.glAccount}px` }}>
                        <span className="text-[#525252] text-[13px] font-medium leading-[140%] tracking-[-0.26px] whitespace-nowrap">
                          GL Account
                        </span>
                      </div>
                      <div className="flex items-center gap-2 border-b border-r border-[#DADADA]/50 px-3 py-3 flex-shrink-0" style={{ width: `${columnWidths.total}px` }}>
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
                        <div className="flex items-center border-b border-r border-[#DADADA]/50 px-3 min-h-14 py-2 flex-shrink-0" style={{ width: `${columnWidths.property}px` }}>
                          <Select
                            value={item.property}
                            onValueChange={(value) =>
                              handleUpdateLineItem(item.id, "property", value)
                            }
                          >
                            <SelectTrigger className="w-full h-auto px-0 py-0 text-[13px] border-0 bg-transparent whitespace-nowrap" data-measure-width="property">
                              <SelectValue />
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
                        <div className="flex items-center border-b border-r border-[#DADADA]/50 px-3 min-h-14 py-2 flex-shrink-0" style={{ width: `${columnWidths.unit}px` }}>
                          <Select
                            value={item.unit}
                            onValueChange={(value) =>
                              handleUpdateLineItem(item.id, "unit", value)
                            }
                          >
                            <SelectTrigger className="w-full h-auto px-0 py-0 text-[13px] border-0 bg-transparent whitespace-nowrap" data-measure-width="unit">
                              <SelectValue />
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
                        <div className="flex items-center border-b border-r border-[#DADADA]/50 px-3 min-h-14 py-2 flex-shrink-0" style={{ width: `${columnWidths.workOrder}px` }}>
                          <Select
                            value={item.workOrder}
                            onValueChange={(value) =>
                              handleUpdateLineItem(item.id, "workOrder", value)
                            }
                          >
                            <SelectTrigger className="w-full h-auto px-0 py-0 text-[13px] border-0 bg-transparent whitespace-nowrap" data-measure-width="workOrder">
                              <SelectValue />
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
                        <div className="flex items-center border-b border-r border-[#DADADA]/50 px-3 min-h-14 py-2 flex-1" style={{ minWidth: `${columnWidths.description}px` }}>
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) =>
                              handleUpdateLineItem(item.id, "description", e.target.value)
                            }
                            data-measure-width="description"
                            className="w-full bg-transparent outline-none text-[13px] whitespace-nowrap"
                          />
                        </div>

                        {/* GL Account */}
                        <div className="flex items-center border-b border-r border-[#DADADA]/50 px-3 min-h-14 py-2 flex-shrink-0" style={{ width: `${columnWidths.glAccount}px` }}>
                          <Select
                            value={item.glAccount}
                            onValueChange={(value) =>
                              handleUpdateLineItem(item.id, "glAccount", value)
                            }
                          >
                            <SelectTrigger className="w-full h-auto px-0 py-0 text-[13px] border-0 bg-transparent whitespace-nowrap" data-measure-width="glAccount">
                              <SelectValue />
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
                        <div className="flex items-center border-b border-r border-[#DADADA]/50 px-3 min-h-14 py-2 flex-shrink-0" style={{ width: `${columnWidths.total}px` }}>
                          <input
                            type="text"
                            value={item.total}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === "" || /^\$?[\d,]*\.?\d{0,2}$/.test(value)) {
                                const formatted = value.startsWith("$") ? value : "$" + value;
                                handleUpdateLineItem(item.id, "total", formatted);
                              }
                            }}
                            placeholder="$0.00"
                            data-measure-width="total"
                            className="w-full bg-transparent outline-none text-[13px] whitespace-nowrap"
                          />
                        </div>

                        {/* Delete Button */}
                        <div className="flex items-center justify-center border-b border-r border-[#DADADA]/50 min-h-14 py-2 w-[80px] flex-shrink-0">
                          <button
                            onClick={() => handleDeleteLineItem(item.id)}
                            className="text-[#525252] hover:text-[#303030] transition-colors text-lg leading-none"
                            title="Delete row"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex min-h-[2px] mt-[60px] w-full bg-white" />

              {/* Bill Total */}
              <div className="bg-[#FBFBFB] flex mt-[60px] px-4 py-4 items-center gap-24 justify-between flex-wrap">
                <div className="flex flex-col text-xl text-[#303030] font-semibold leading-[1.3]">
                  <div>Bill Total:</div>
                </div>
                <div className="flex flex-col items-center justify-center">
                  <div className="flex items-start gap-4 text-sm text-[#6B7280] font-normal leading-[1.14]" />
                  <div className="text-[#303030] text-xl font-semibold leading-[1.3] mt-2">
                    Total: {calculateTotal()}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex mt-5 items-center gap-2.5 text-base justify-end flex-wrap pb-6">
                <button
                  onClick={handleCancel}
                  className="rounded-lg flex min-h-9 px-3 py-1.5 items-center gap-2 text-[#303030] font-normal whitespace-nowrap tracking-[-0.32px] leading-[1.4] hover:bg-gray-100 transition-colors"
                >
                  <span>Cancel</span>
                </button>
                <button
                  onClick={handleRecordBill}
                  className="rounded-lg bg-[#013764] shadow-[0_0_0_1px_rgba(0,45,90,1)] flex min-h-9 px-3 py-2 items-center gap-2 overflow-hidden text-white font-medium hover:bg-[#002a4f] transition-colors"
                >
                  <span>Record Bill</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
