import { useState } from "react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

  const handleCancel = () => {
    navigate(-1);
  };

  const handleRecordBill = () => {
    // Handle record bill logic here
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

  const handleDeleteLineItem = (rowIndex: number) => {
    // Handle delete logic here
    console.log(`Delete row ${rowIndex}`);
  };

  return (
    <div className="bg-white flex flex-col px-8 py-6 font-[Geist,-apple-system,Roboto,Helvetica,sans-serif] border-l-4 border-l-[#E5E7EB] min-h-screen">
      {/* Header */}
      <div className="flex w-full items-center justify-between gap-24 flex-wrap">
        <div className="flex flex-col min-w-[240px]">
          <h1 className="text-[#303030] text-2xl font-semibold leading-[1.25]">
            Record Bill
          </h1>
          <p className="mt-1 text-[#71717A] text-base font-medium leading-[1]">
            Upload an invoice and record a new bill
          </p>
        </div>
        <div className="flex min-h-9 gap-4" />
      </div>

      {/* Main Content */}
      <div className="flex mt-5 w-full items-start gap-7 flex-wrap">
        {/* File Upload Section */}
        <div className="flex flex-col flex-1 min-w-[240px] text-base font-normal w-[462px]">
          <div className="rounded-lg bg-white border border-dashed border-[#121212]/40 flex flex-col overflow-hidden flex-1 px-20 py-7 justify-center">
            <div className="self-center flex flex-col items-center mt-[350px]">
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

        {/* Bill Details Section */}
        <div className="flex flex-col flex-1 min-w-[240px] justify-between w-[410px]">
          <div className="flex max-w-full w-[511px] flex-col">
            {/* Bill Details Header */}
            <div className="flex w-full flex-col text-xl text-[#303030] font-semibold leading-[1.3]">
              <div>Bill Details</div>
              <div className="w-[790px] h-px bg-gray-200 mt-5" />
            </div>

            {/* Form Fields */}
            <div className="flex mt-3 w-full flex-col">
              <div className="flex w-full flex-col">
                {/* Vendor and Reference Number Row */}
                <div className="flex w-[790px] items-start gap-5 flex-wrap">
                  <div className="flex flex-col flex-1 min-w-[240px] basis-0">
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
                  <div className="flex flex-col flex-1 min-w-[240px] basis-0">
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
                <div className="flex mt-5 w-[790px] items-start gap-5 flex-wrap">
                  <div className="flex flex-col flex-1 min-w-[240px] basis-0">
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
                      <PopoverContent className="w-auto p-0" align="start">
                        <div className="p-3">
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
                        </div>
                      </PopoverContent>
                    </Popover>
                    {invoiceDateError && (
                      <div className="text-red-500 text-xs mt-1">
                        {invoiceDateError}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col flex-1 min-w-[240px] basis-0">
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
                      <PopoverContent className="w-auto p-0" align="start">
                        <div className="p-3">
                          <Calendar
                            mode="single"
                            selected={dueDate || undefined}
                            onSelect={handleDueDateSelect}
                            disabled={(date) =>
                              date < new Date("1900-01-01")
                            }
                            initialFocus
                          />
                        </div>
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
                <div className="flex mt-5 w-[790px] flex-col">
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
          </div>

          {/* Line Items Section */}
          <div className="flex mt-[60px] w-full flex-col gap-6">
            {/* Header */}
            <div className="flex h-9 justify-between items-start w-full">
              <div className="flex flex-col gap-5">
                <div className="flex flex-col text-xl text-[#303030] font-semibold leading-[26px] w-[625px]">
                  <div className="font-semibold">
                    Bill Details
                  </div>
                  <div className="w-[790px] h-px bg-gray-200 mt-5" />
                </div>
              </div>
              <button className="flex h-9 items-center gap-2 rounded-lg border border-white bg-[#002D5A] shadow-[0_0_0_1px_#002D5A,0_0_10px_-5px_rgba(0,0,0,0.2)] px-4 hover:bg-[#001f3f] transition-colors">
                <span className="text-white text-base font-medium">
                  Add Line Items
                </span>
              </button>
            </div>

            {/* Table */}
            <div className="flex w-full flex-col rounded-xl shadow-[0_1px_2px_0_rgba(10,13,18,0.05)]">
              <div className="flex flex-col border border-[#DADADA]/50 shadow-[0_1px_2px_0_rgba(10,13,18,0.05)] bg-white w-full">
                {/* Table Header */}
                <div className="flex items-center w-full">
                  <div className="flex items-center gap-2 border-b border-r border-[#DADADA]/50 px-3 py-3 w-[151px]">
                    <span className="text-[#525252] text-[13px] font-medium leading-[140%] tracking-[-0.26px]">
                      Property / Ledger
                    </span>
                  </div>
                  <div className="flex items-center gap-2 border-b border-r border-[#DADADA]/50 px-3 py-3 w-[60px]">
                    <span className="text-[#525252] text-[13px] font-medium leading-[140%] tracking-[-0.26px]">
                      Unit
                    </span>
                  </div>
                  <div className="flex items-center gap-2 border-b border-r border-[#DADADA]/50 px-3 py-3 w-[120px]">
                    <span className="text-[#525252] text-[13px] font-medium leading-[140%] tracking-[-0.26px]">
                      Work Order
                    </span>
                  </div>
                  <div className="flex items-center gap-2 border-b border-r border-[#DADADA]/50 px-3 py-3 w-[193px]">
                    <span className="text-[#525252] text-[13px] font-medium leading-[140%] tracking-[-0.26px]">
                      Description
                    </span>
                  </div>
                  <div className="flex items-center gap-2 border-b border-r border-[#DADADA]/50 px-3 py-3 w-[100px]">
                    <span className="text-[#525252] text-[13px] font-medium leading-[140%] tracking-[-0.26px]">
                      GL Account
                    </span>
                  </div>
                  <div className="flex items-center gap-2 border-b border-r border-[#DADADA]/50 px-3 py-3 w-[80px]">
                    <span className="text-[#525252] text-[13px] font-medium leading-[140%] tracking-[-0.26px]">
                      Total
                    </span>
                  </div>
                  <div className="flex items-center gap-2 border-b border-r border-[#DADADA]/50 px-3 py-3 w-[80px]">
                    <span className="text-[#525252] text-[13px] font-medium leading-[140%] tracking-[-0.26px]">
                      Actions
                    </span>
                  </div>
                </div>

                {/* Row 1 */}
                <div className="flex items-center w-full">
                  <div className="flex items-center gap-2.5 border-b border-r border-[#DADADA]/50 px-3 h-14 w-[151px]">
                    <span className="text-[#303030] text-[13px] font-normal leading-[140%] tracking-[-0.26px] line-clamp-1">
                      22 Indian Creek Dr
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 border-b border-r border-[#DADADA]/50 px-3 h-14 w-[60px]">
                    <span className="text-[#303030] text-[13px] font-normal leading-[140%] tracking-[-0.26px] line-clamp-1">
                      2
                    </span>
                  </div>
                  <div className="flex items-center justify-center gap-2.5 border-b border-r border-[#DADADA]/50 px-3 h-14 w-[120px]">
                    <button className="flex h-9 justify-center items-center gap-2 rounded-lg border border-[#DADADA]/50 bg-[#FBFBFB] shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] px-3 py-2">
                      <span className="text-[#303030] text-[13px] font-normal leading-[140%] tracking-[-0.26px] whitespace-nowrap">
                        123456-1
                      </span>
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M4.41009 6.91058C4.73553 6.58514 5.26317 6.58514 5.5886 6.91058L9.99935 11.3213L14.4101 6.91058C14.7355 6.58514 15.2632 6.58514 15.5886 6.91058C15.914 7.23602 15.914 7.76366 15.5886 8.08909L10.5886 13.0891C10.2632 13.4145 9.73553 13.4145 9.41009 13.0891L4.41009 8.08909C4.08466 7.76366 4.08466 7.23602 4.41009 6.91058Z"
                          fill="black"
                        />
                      </svg>
                    </button>
                  </div>
                  <div className="flex items-center gap-2.5 border-b border-r border-[#DADADA]/50 px-3 h-14 w-[193px]">
                    <span className="text-[#303030] text-[13px] font-normal leading-[140%] tracking-[-0.26px] line-clamp-1">
                      ConEd - 1,220 kWh
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 border-b border-r border-[#DADADA]/50 px-3 h-14 w-[100px]">
                    <span className="text-[#303030] text-[13px] font-normal leading-[140%] tracking-[-0.26px] line-clamp-1">
                      Utilities
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 border-b border-r border-[#DADADA]/50 px-3 h-14 w-[80px]">
                    <span className="text-[#303030] text-[13px] font-normal leading-[140%] tracking-[-0.26px] line-clamp-1">
                      $462
                    </span>
                  </div>
                  <div className="flex items-center justify-center gap-2.5 border-b border-r border-[#DADADA]/50 px-3 h-14 w-[80px]">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="flex w-7 h-7 justify-center items-center gap-2 rounded-md border border-[#DADADA]/50 bg-[#FBFBFB] shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] hover:bg-gray-200 transition-colors">
                          <span className="text-[#525252] font-bold text-lg leading-none">
                            ×
                          </span>
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleDeleteLineItem(0)}
                          className="text-red-600 cursor-pointer"
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Row 2 */}
                <div className="flex items-center w-full">
                  <div className="flex items-center gap-2.5 border-b border-r border-[#DADADA]/50 px-3 h-14 w-[151px]">
                    <span className="text-[#303030] text-[13px] font-normal leading-[140%] tracking-[-0.26px] line-clamp-1">
                      22 Indian Creek Dr
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 border-b border-r border-[#DADADA]/50 px-3 h-14 w-[60px]">
                    <span className="text-[#303030] text-[13px] font-normal leading-[140%] tracking-[-0.26px] line-clamp-1">
                      2
                    </span>
                  </div>
                  <div className="flex items-center justify-center gap-2.5 border-b border-r border-[#DADADA]/50 px-3 h-14 w-[120px]">
                    <button className="flex h-9 justify-center items-center gap-2 rounded-lg border border-[#DADADA]/50 bg-[#FBFBFB] shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] px-3 py-2">
                      <span className="text-[#303030] text-[13px] font-normal leading-[140%] tracking-[-0.26px] whitespace-nowrap">
                        123456-1
                      </span>
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M4.41009 6.91058C4.73553 6.58514 5.26317 6.58514 5.5886 6.91058L9.99935 11.3213L14.4101 6.91058C14.7355 6.58514 15.2632 6.58514 15.5886 6.91058C15.914 7.23602 15.914 7.76366 15.5886 8.08909L10.5886 13.0891C10.2632 13.4145 9.73553 13.4145 9.41009 13.0891L4.41009 8.08909C4.08466 7.76366 4.08466 7.23602 4.41009 6.91058Z"
                          fill="black"
                        />
                      </svg>
                    </button>
                  </div>
                  <div className="flex items-center gap-2.5 border-b border-r border-[#DADADA]/50 px-3 h-14 w-[193px]">
                    <span className="text-[#303030] text-[13px] font-normal leading-[140%] tracking-[-0.26px] line-clamp-1">
                      Unit 48 Thermostat
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 border-b border-r border-[#DADADA]/50 px-3 h-14 w-[100px]">
                    <span className="text-[#303030] text-[13px] font-normal leading-[140%] tracking-[-0.26px] line-clamp-1">
                      Maintenance
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 border-b border-r border-[#DADADA]/50 px-3 h-14 w-[80px]">
                    <span className="text-[#303030] text-[13px] font-normal leading-[140%] tracking-[-0.26px] line-clamp-1">
                      $380
                    </span>
                  </div>
                  <div className="flex items-center justify-center gap-2.5 border-b border-r border-[#DADADA]/50 px-3 h-14 w-[80px]">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="flex w-7 h-7 justify-center items-center gap-2 rounded-md border border-[#DADADA]/50 bg-[#FBFBFB] shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] hover:bg-gray-200 transition-colors">
                          <span className="text-[#525252] font-bold text-lg leading-none">
                            ×
                          </span>
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleDeleteLineItem(1)}
                          className="text-red-600 cursor-pointer"
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Row 3 */}
                <div className="flex items-center w-full">
                  <div className="flex items-center gap-2.5 border-b border-r border-[#DADADA]/50 px-3 h-14 w-[151px]">
                    <span className="text-[#303030] text-[13px] font-normal leading-[140%] tracking-[-0.26px] line-clamp-1">
                      22 Indian Creek Dr
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 border-b border-r border-[#DADADA]/50 px-3 h-14 w-[60px]">
                    <span className="text-[#303030] text-[13px] font-normal leading-[140%] tracking-[-0.26px] line-clamp-1">
                      2
                    </span>
                  </div>
                  <div className="flex items-center justify-center gap-2.5 border-b border-r border-[#DADADA]/50 px-3 h-14 w-[120px]">
                    <button className="flex h-9 justify-center items-center gap-2 rounded-lg border border-[#DADADA]/50 bg-[#FBFBFB] shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] px-3 py-2">
                      <span className="text-[#303030] text-[13px] font-normal leading-[140%] tracking-[-0.26px] whitespace-nowrap">
                        123456-1
                      </span>
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M4.41009 6.91058C4.73553 6.58514 5.26317 6.58514 5.5886 6.91058L9.99935 11.3213L14.4101 6.91058C14.7355 6.58514 15.2632 6.58514 15.5886 6.91058C15.914 7.23602 15.914 7.76366 15.5886 8.08909L10.5886 13.0891C10.2632 13.4145 9.73553 13.4145 9.41009 13.0891L4.41009 8.08909C4.08466 7.76366 4.08466 7.23602 4.41009 6.91058Z"
                          fill="black"
                        />
                      </svg>
                    </button>
                  </div>
                  <div className="flex items-center gap-2.5 border-b border-r border-[#DADADA]/50 px-3 h-14 w-[193px]">
                    <span className="text-[#303030] text-[13px] font-normal leading-[140%] tracking-[-0.26px] line-clamp-1">
                      Tools for common area
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 border-b border-r border-[#DADADA]/50 px-3 h-14 w-[100px]">
                    <span className="text-[#303030] text-[13px] font-normal leading-[140%] tracking-[-0.26px] line-clamp-1">
                      Other
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 border-b border-r border-[#DADADA]/50 px-3 h-14 w-[80px]">
                    <span className="text-[#303030] text-[13px] font-normal leading-[140%] tracking-[-0.26px] line-clamp-1">
                      $120
                    </span>
                  </div>
                  <div className="flex items-center justify-center gap-2.5 border-b border-r border-[#DADADA]/50 px-3 h-14 w-[80px]">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="flex w-7 h-7 justify-center items-center gap-2 rounded-md border border-[#DADADA]/50 bg-[#FBFBFB] shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] hover:bg-gray-200 transition-colors">
                          <span className="text-[#525252] font-bold text-lg leading-none">
                            ×
                          </span>
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleDeleteLineItem(2)}
                          className="text-red-600 cursor-pointer"
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex min-h-[2px] mt-[60px] w-full bg-white" />

          {/* Bill Total */}
          <div className="bg-[#FBFBFB] flex mt-[60px] w-full px-4 py-4 items-center gap-24 justify-between flex-wrap">
            <div className="flex flex-col text-xl text-[#303030] font-semibold leading-[1.3]">
              <div>Bill Total:</div>
            </div>
            <div className="flex flex-col items-center justify-center">
              <div className="flex items-start gap-4 text-sm text-[#6B7280] font-normal leading-[1.14]" />
              <div className="text-[#303030] text-xl font-semibold leading-[1.3] mt-2">
                Total: $1,620.00
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex mt-5 w-full items-center gap-2.5 text-base justify-end flex-wrap">
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
  );
};
