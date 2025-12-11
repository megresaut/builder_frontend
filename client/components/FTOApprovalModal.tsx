import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Trash2, Paperclip } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface HourRow {
  id: string;
  date: string;
  hours: string;
  note: string;
  noFee: boolean;
  emergency: boolean;
  amount: string;
  upcharge: string;
}

interface ExpenseRow {
  id: string;
  date: string;
  vendor: string;
  receiptNote: string;
  avmExpense: boolean;
  amount: string;
  upcharge: string;
}

interface FTOApprovalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedFTOId?: number | null;
  property?: string;
  unit?: string;
  fieldTeamAssignee?: string;
  rowId?: string;
}

function PDFViewer({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e5e5e5]">
          <h2 className="text-lg font-semibold text-[#303030]">Receipt</h2>
          <button
            onClick={onClose}
            className="text-[#999] hover:text-[#303030] transition-colors"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="flex-1 bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-4 text-[#ccc]">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="12" y1="11" x2="12" y2="17" />
              <line x1="9" y1="14" x2="15" y2="14" />
            </svg>
            <p className="text-[#999]">PDF Document</p>
            <p className="text-sm text-[#ccc] mt-2">Sample PDF Viewer</p>
          </div>
        </div>
      </div>
    </div>
  );
}

const VENDORS = ["Dolce", "N/A", "Home Depot", "Ace Hardware"];

const validateHours = (value: string): boolean => {
  if (!value) return false;
  const num = parseFloat(value);
  if (isNaN(num)) return false;
  const decimal = num % 1;
  return decimal === 0 || decimal === 0.5;
};

const validateAmount = (value: string): boolean => {
  const num = parseFloat(value.replace(/[$,]/g, ""));
  return !isNaN(num) && num >= 0;
};

const formatCurrency = (value: string): string => {
  const num = parseFloat(value.replace(/[$,]/g, ""));
  if (isNaN(num)) return "";
  return `$${num.toFixed(2)}`;
};

const parseDate = (dateStr: string): Date | null => {
  const [month, day, year] = dateStr.split("/");
  if (!month || !day || !year) return null;
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  if (isNaN(date.getTime())) return null;
  return date;
};

const formatDate = (date: Date): string => {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
};

const calculateTotal = (amount: string, upcharge: string): number => {
  const amountNum = parseFloat(amount.replace(/[$,]/g, "")) || 0;
  const upchargeNum = parseFloat(upcharge.replace(/[$,]/g, "")) || 0;
  return amountNum + upchargeNum;
};

interface EditableCellProps {
  value: string;
  onChange: (value: string) => void;
  type: "text" | "number" | "date" | "currency";
  placeholder?: string;
}

function EditableCell({ value, onChange, type, placeholder }: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);

  if (type === "date") {
    const date = parseDate(value) || new Date();
    return (
      <div onClick={(e) => e.stopPropagation()} className="w-full h-full flex items-center">
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <button className="w-full h-full text-left px-0 py-0 hover:bg-[#f5f5f5] transition-colors flex items-center border-0 bg-transparent">
              <span className="text-[#303030] font-normal text-base tracking-[-0.32px] leading-[1.4]">
                {value}
              </span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-3" align="start">
            <input
              type="date"
              value={date.toISOString().split("T")[0]}
              onChange={(e) => {
                const newDate = new Date(e.target.value);
                onChange(formatDate(newDate));
                setCalendarOpen(false);
              }}
              className="w-full px-2 py-1 border border-[#e5e5e5] rounded-md"
            />
          </PopoverContent>
        </Popover>
      </div>
    );
  }

  if (type === "number") {
    return (
      <div
        className="w-full h-full flex items-center px-0 cursor-text hover:bg-[#f5f5f5] transition-colors"
        onClick={() => setIsEditing(true)}
      >
        {isEditing ? (
          <input
            type="text"
            value={inputValue}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "" || validateHours(val)) {
                setInputValue(val);
              }
            }}
            onBlur={() => {
              if (inputValue && validateHours(inputValue)) {
                onChange(inputValue);
              }
              setIsEditing(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (inputValue && validateHours(inputValue)) {
                  onChange(inputValue);
                }
                setIsEditing(false);
              }
            }}
            autoFocus
            className="w-full h-full px-0 border-0 bg-transparent text-[#303030] font-normal text-base tracking-[-0.32px] leading-[1.4]"
            placeholder={placeholder}
          />
        ) : (
          <span className="text-[#303030] font-normal text-base tracking-[-0.32px] leading-[1.4]">
            {value}
          </span>
        )}
      </div>
    );
  }

  if (type === "currency") {
    return (
      <div
        className="w-full h-full flex items-center px-0 cursor-text hover:bg-[#f5f5f5] transition-colors"
        onClick={() => setIsEditing(true)}
      >
        {isEditing ? (
          <input
            type="text"
            value={inputValue}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "" || validateAmount(val)) {
                setInputValue(val);
              }
            }}
            onBlur={() => {
              if (inputValue && validateAmount(inputValue)) {
                onChange(formatCurrency(inputValue));
              } else {
                setInputValue(value);
              }
              setIsEditing(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (inputValue && validateAmount(inputValue)) {
                  onChange(formatCurrency(inputValue));
                }
                setIsEditing(false);
              }
            }}
            autoFocus
            className="w-full h-full px-0 border-0 bg-transparent text-[#303030] font-normal text-base tracking-[-0.32px] leading-[1.4]"
            placeholder={placeholder}
          />
        ) : (
          <span className="text-[#303030] font-normal text-base tracking-[-0.32px] leading-[1.4]">
            {value}
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      className="w-full h-full flex items-center px-0 cursor-text hover:bg-[#f5f5f5] transition-colors"
      onClick={() => setIsEditing(true)}
    >
      {isEditing ? (
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onBlur={() => {
            onChange(inputValue);
            setIsEditing(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onChange(inputValue);
              setIsEditing(false);
            }
          }}
          autoFocus
          className="w-full h-full px-0 border-0 bg-transparent text-[#303030] font-normal text-base tracking-[-0.32px] leading-[1.4]"
          placeholder={placeholder}
        />
      ) : (
        <span className="text-[#303030] font-normal text-base tracking-[-0.32px] leading-[1.4]">
          {value}
        </span>
      )}
    </div>
  );
}

export default function FTOApprovalModal({
  open,
  onOpenChange,
  selectedFTOId,
  property = "3 hekma Road",
  unit = "2",
  fieldTeamAssignee = "John Smith",
  rowId,
}: FTOApprovalModalProps) {
  const [hourRows, setHourRows] = useState<HourRow[]>([]);
  const [expenseRows, setExpenseRows] = useState<ExpenseRow[]>([]);
  const [pdfOpen, setPdfOpen] = useState(false);

  const updateHourRow = (id: string, field: keyof HourRow, value: any) => {
    setHourRows((rows) =>
      rows.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const updateExpenseRow = (id: string, field: keyof ExpenseRow, value: any) => {
    setExpenseRows((rows) =>
      rows.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const deleteHourRow = (id: string) => {
    setHourRows((rows) => rows.filter((row) => row.id !== id));
  };

  const deleteExpenseRow = (id: string) => {
    setExpenseRows((rows) => rows.filter((row) => row.id !== id));
  };

  const hoursTotal = hourRows.reduce(
    (sum, row) => sum + calculateTotal(row.amount, row.upcharge),
    0
  );
  const expensesTotal = expenseRows.reduce(
    (sum, row) => sum + calculateTotal(row.amount, row.upcharge),
    0
  );
  const grandTotal = hoursTotal + expensesTotal;

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        // Don't close the dialog if PDF viewer is open
        if (!newOpen && pdfOpen) return;
        onOpenChange(newOpen);
      }}
    >
      <DialogContent className="max-w-[min(1600px,95vw)] p-8 gap-0 max-h-[90vh] overflow-y-auto">
        <DialogTitle className="text-[#303030] font-semibold text-2xl leading-[1.25] mb-4">
          Field Team Order Approval
        </DialogTitle>

        {/* Property, Unit, Field Team Assignee, and Associated Task - Read Only */}
        <div className="flex gap-5 flex-row mb-4">
          <div className="flex-1 min-w-[240px] flex flex-col gap-2">
            <label className="text-[#303030] font-medium text-sm leading-[1.43]">
              Property
            </label>
            <div className="h-[38px] rounded-lg border border-[#e5e5e5] bg-white opacity-50 px-3 py-2 flex items-center">
              <span className="text-[#303030] font-normal text-sm">{property}</span>
            </div>
          </div>
          <div className="flex-1 min-w-[240px] flex flex-col gap-2">
            <label className="text-[#303030] font-medium text-sm leading-[1.43]">
              Unit
            </label>
            <div className="h-[38px] rounded-lg border border-[#e5e5e5] bg-white opacity-50 px-3 py-2 flex items-center">
              <span className="text-[#303030] font-normal text-sm">{unit}</span>
            </div>
          </div>
          <div className="flex-1 min-w-[240px] flex flex-col gap-2">
            <label className="text-[#303030] font-medium text-sm leading-[1.43]">
              Field Team Assignee
            </label>
            <div className="h-[38px] rounded-lg border border-[#e5e5e5] bg-white opacity-50 px-3 py-2 flex items-center">
              <span className="text-[#303030] font-normal text-sm">{fieldTeamAssignee}</span>
            </div>
          </div>
          <div className="flex-1 min-w-[240px] flex flex-col gap-2">
            <label className="text-[#303030] font-medium text-sm leading-[1.43]">
              Associated Task
            </label>
            <Select defaultValue="12311" disabled>
              <SelectTrigger className="h-[38px] rounded-lg border-[#e5e5e5] bg-white opacity-50 cursor-not-allowed">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="12311">12311</SelectItem>
                <SelectItem value="12312">12312</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Hours Section */}
        <div className="mb-4">
          <div className="rounded-xl border border-[#e5e5e5] shadow-sm overflow-hidden">
            {/* Hours Header */}
            <div className="bg-white px-4 py-4 flex items-center justify-between gap-5 flex-wrap">
              <h3 className="text-[#303030] font-semibold text-xl leading-[1.3]">
                Hours
              </h3>
              <button
                onClick={() => {
                  const newId = String(Math.max(...hourRows.map((r) => parseInt(r.id)), 0) + 1);
                  setHourRows([
                    ...hourRows,
                    {
                      id: newId,
                      date: formatDate(new Date()),
                      hours: "",
                      note: "",
                      noFee: false,
                      emergency: false,
                      amount: "$0",
                      upcharge: "$0",
                    },
                  ]);
                }}
                className="flex items-center gap-2 px-3 py-2 min-h-[36px] rounded-lg bg-[#013764] shadow-[0_0_0_1px_#002d5a] hover:bg-[#014777] transition-colors"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M10 4.16667V15.8333M4.16667 10H15.8333"
                    stroke="white"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="text-white font-medium text-base">Add Hours</span>
              </button>
            </div>

            {/* Hours Table - CSS Grid */}
            <div
              className="border-t border-[#dadada] grid overflow-x-auto"
              style={{
                display: 'grid',
                gridTemplateColumns: '118px 76px 1fr 80px 105px minmax(100px, auto) minmax(100px, auto) minmax(85px, auto) 78px',
                gridAutoRows: 'minmax(min-content, auto)'
              }}
            >
              {/* Headers */}
              <div className="bg-[#fbfbfb] px-3 py-3 border-b border-r border-[#dadada] font-medium text-sm text-[#525252]">Date</div>
              <div className="bg-[#fbfbfb] px-3 py-3 border-b border-r border-[#dadada] font-medium text-sm text-[#525252]">Hours</div>
              <div className="bg-[#fbfbfb] px-3 py-3 border-b border-r border-[#dadada] font-medium text-sm text-[#525252]">Note</div>
              <div className="bg-[#fbfbfb] px-3 py-3 border-b border-r border-[#dadada] font-medium text-sm text-[#525252]">NoFee?</div>
              <div className="bg-[#fbfbfb] px-3 py-3 border-b border-r border-[#dadada] font-medium text-sm text-[#525252]">Emergency</div>
              <div className="bg-[#fbfbfb] px-3 py-3 border-b border-r border-[#dadada] font-medium text-sm text-[#525252]">Amount</div>
              <div className="bg-[#fbfbfb] px-3 py-3 border-b border-r border-[#dadada] font-medium text-sm text-[#525252]">Upcharge</div>
              <div className="bg-[#fbfbfb] px-3 py-3 border-b border-r border-[#dadada] font-medium text-sm text-[#525252]">Total</div>
              <div className="bg-[#fbfbfb] px-3 py-3 border-b border-[#dadada] font-medium text-sm text-[#525252]">Actions</div>

              {/* Rows */}
              {hourRows.map((row) => (
                <>
                  <div key={`${row.id}-date`} className="px-3 py-3 border-b border-r border-[#dadada] flex items-center">
                    <EditableCell value={row.date} onChange={(value) => updateHourRow(row.id, "date", value)} type="date" />
                  </div>
                  <div key={`${row.id}-hours`} className="px-3 py-3 border-b border-r border-[#dadada] flex items-center">
                    <EditableCell value={row.hours} onChange={(value) => updateHourRow(row.id, "hours", value)} type="number" placeholder="e.g., 2 or 2.5" />
                  </div>
                  <div key={`${row.id}-note`} className="px-3 py-3 border-b border-r border-[#dadada] flex items-center">
                    <EditableCell value={row.note} onChange={(value) => updateHourRow(row.id, "note", value)} type="text" placeholder="Enter note" />
                  </div>
                  <div key={`${row.id}-nofee`} className="px-3 py-3 border-b border-r border-[#dadada] flex items-center justify-center">
                    <Checkbox checked={row.noFee} onCheckedChange={(checked) => updateHourRow(row.id, "noFee", checked)} className="w-[14px] h-[14px]" />
                  </div>
                  <div key={`${row.id}-emergency`} className="px-3 py-3 border-b border-r border-[#dadada] flex items-center justify-center">
                    <Checkbox checked={row.emergency} onCheckedChange={(checked) => updateHourRow(row.id, "emergency", checked)} className="w-[14px] h-[14px]" />
                  </div>
                  <div key={`${row.id}-amount`} className="px-3 py-3 border-b border-r border-[#dadada] flex items-center justify-center">
                    <div className="text-lg"><EditableCell value={row.amount} onChange={(value) => updateHourRow(row.id, "amount", value)} type="currency" placeholder="$0" /></div>
                  </div>
                  <div key={`${row.id}-upcharge`} className="px-3 py-3 border-b border-r border-[#dadada] flex items-center justify-center">
                    <div className="text-lg"><EditableCell value={row.upcharge} onChange={(value) => updateHourRow(row.id, "upcharge", value)} type="currency" placeholder="$0" /></div>
                  </div>
                  <div key={`${row.id}-total`} className="px-3 py-3 border-b border-r border-[#dadada] flex items-center justify-center">
                    <span className="text-[#303030] font-normal text-lg font-semibold">${calculateTotal(row.amount, row.upcharge).toFixed(2)}</span>
                  </div>
                  <div key={`${row.id}-actions`} className="px-3 py-3 border-b border-[#dadada] flex items-center justify-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="w-7 h-7 rounded-md border border-[#dadada] bg-[#fbfbfb] shadow-sm flex items-center justify-center hover:bg-gray-100 transition-colors">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="1" />
                            <circle cx="19" cy="12" r="1" />
                            <circle cx="5" cy="12" r="1" />
                          </svg>
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => deleteHourRow(row.id)} className="text-red-600 cursor-pointer">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </>
              ))}
            </div>
          </div>
        </div>

        {/* Expenses Section */}
        <div className="mb-4">
          <div className="rounded-xl border border-[#e5e5e5] shadow-sm overflow-hidden">
            {/* Expenses Header */}
            <div className="bg-white px-4 py-4 flex items-center justify-between gap-5 flex-wrap">
              <h3 className="text-[#303030] font-semibold text-xl leading-[1.3]">
                Expenses
              </h3>
              <button
                onClick={() => {
                  const newId = String(Math.max(...expenseRows.map((r) => parseInt(r.id)), 0) + 1);
                  setExpenseRows([
                    ...expenseRows,
                    {
                      id: newId,
                      date: formatDate(new Date()),
                      vendor: "",
                      receiptNote: "",
                      avmExpense: false,
                      amount: "$0",
                      upcharge: "$0",
                    },
                  ]);
                }}
                className="flex items-center gap-2 px-3 py-2 min-h-[36px] rounded-lg bg-[#013764] shadow-[0_0_0_1px_#002d5a] hover:bg-[#014777] transition-colors"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M10 4.16667V15.8333M4.16667 10H15.8333"
                    stroke="white"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="text-white font-medium text-base">Add Expenses</span>
              </button>
            </div>

            {/* Expenses Table - CSS Grid */}
            <div
              className="border-t border-[#dadada] grid overflow-x-auto"
              style={{
                display: 'grid',
                gridTemplateColumns: '110px 130px 300px 45px minmax(100px, auto) minmax(100px, auto) minmax(85px, auto) 85px',
                gridAutoRows: 'minmax(min-content, auto)'
              }}
            >
              {/* Headers */}
              <div className="bg-[#fbfbfb] px-3 py-3 border-b border-r border-[#dadada] font-medium text-sm text-[#525252]">Date</div>
              <div className="bg-[#fbfbfb] px-3 py-3 border-b border-r border-[#dadada] font-medium text-sm text-[#525252]">Vendor</div>
              <div className="bg-[#fbfbfb] px-3 py-3 border-b border-r border-[#dadada] font-medium text-sm text-[#525252]">Receipt Note</div>
              <div className="bg-[#fbfbfb] px-3 py-3 border-b border-r border-[#dadada] font-medium text-sm text-[#525252]">Receipts</div>
              <div className="bg-[#fbfbfb] px-3 py-3 border-b border-r border-[#dadada] font-medium text-sm text-[#525252]">Amount</div>
              <div className="bg-[#fbfbfb] px-3 py-3 border-b border-r border-[#dadada] font-medium text-sm text-[#525252]">Upcharge</div>
              <div className="bg-[#fbfbfb] px-3 py-3 border-b border-r border-[#dadada] font-medium text-sm text-[#525252]">Total</div>
              <div className="bg-[#fbfbfb] px-3 py-3 border-b border-[#dadada] font-medium text-sm text-[#525252]">Actions</div>

              {/* Rows */}
              {expenseRows.map((row) => (
                <>
                  <div key={`${row.id}-date`} className="px-3 py-3 border-b border-r border-[#dadada] flex items-center">
                    <EditableCell value={row.date} onChange={(value) => updateExpenseRow(row.id, "date", value)} type="date" />
                  </div>
                  <div key={`${row.id}-vendor`} className="px-3 py-3 border-b border-r border-[#dadada] flex items-center">
                    <Select value={row.vendor} onValueChange={(value) => updateExpenseRow(row.id, "vendor", value)}>
                      <SelectTrigger className="h-auto border-0 bg-transparent p-0 hover:bg-[#f5f5f5] transition-colors">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {VENDORS.map((vendor) => (
                          <SelectItem key={vendor} value={vendor}>
                            {vendor}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div key={`${row.id}-note`} className="px-3 py-3 border-b border-r border-[#dadada] flex items-center">
                    <EditableCell value={row.receiptNote} onChange={(value) => updateExpenseRow(row.id, "receiptNote", value)} type="text" placeholder="Enter receipt note" />
                  </div>
                  <div key={`${row.id}-receipts`} className="px-3 py-3 border-b border-r border-[#dadada] flex items-center justify-center">
                    <button
                      onClick={() => setPdfOpen(true)}
                      className="w-6 h-6 rounded-md border border-[#dadada] bg-[#fbfbfb] shadow-sm flex items-center justify-center hover:bg-gray-100 transition-colors"
                      title="View receipt"
                    >
                      <Paperclip className="w-4 h-4 text-[#303030]" />
                    </button>
                  </div>
                  <div key={`${row.id}-amount`} className="px-3 py-3 border-b border-r border-[#dadada] flex items-center justify-center">
                    <div className="text-lg"><EditableCell value={row.amount} onChange={(value) => updateExpenseRow(row.id, "amount", value)} type="currency" placeholder="$0" /></div>
                  </div>
                  <div key={`${row.id}-upcharge`} className="px-3 py-3 border-b border-r border-[#dadada] flex items-center justify-center">
                    <div className="text-lg"><EditableCell value={row.upcharge} onChange={(value) => updateExpenseRow(row.id, "upcharge", value)} type="currency" placeholder="$0" /></div>
                  </div>
                  <div key={`${row.id}-total`} className="px-3 py-3 border-b border-r border-[#dadada] flex items-center justify-center">
                    <span className="text-[#303030] font-normal text-lg font-semibold">${calculateTotal(row.amount, row.upcharge).toFixed(2)}</span>
                  </div>
                  <div key={`${row.id}-actions`} className="px-3 py-3 border-b border-[#dadada] flex items-center justify-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="w-7 h-7 rounded-md border border-[#dadada] bg-[#fbfbfb] shadow-sm flex items-center justify-center hover:bg-gray-100 transition-colors">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="1" />
                            <circle cx="19" cy="12" r="1" />
                            <circle cx="5" cy="12" r="1" />
                          </svg>
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => deleteExpenseRow(row.id)} className="text-red-600 cursor-pointer">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </>
              ))}
            </div>
          </div>
        </div>

        {/* FTO Total */}
        <div className="bg-[#fbfbfb] px-4 py-4 flex items-center justify-between mb-4 rounded">
          <span className="text-[#303030] font-semibold text-xl leading-[1.3]">
            FTO Total:
          </span>
          <span className="text-[#303030] font-semibold text-xl leading-[1.3]">
            ${grandTotal.toFixed(2)}
          </span>
        </div>

        {/* Approve Button */}
        <button className="w-full flex items-center justify-center gap-2 px-4 py-2 min-h-[36px] rounded-lg bg-[#013764] shadow-[0_0_0_1px_#002d5a] hover:bg-[#014777] transition-colors">
          <span className="text-white font-medium text-base">
            Approve Field Team Order
          </span>
        </button>
      </DialogContent>

      {/* PDF Viewer Modal */}
      <PDFViewer isOpen={pdfOpen} onClose={() => setPdfOpen(false)} />
    </Dialog>
  );
}
