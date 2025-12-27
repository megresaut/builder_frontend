import React, { useState } from "react";
import {
  ModalTemplate,
  ModalButtons,
} from "@/components/ui/ModalTemplate";
import { FormLayout, FormSection } from "@/components/ui/form-layout";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ApproveIcon } from "@/components/icons";

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
  editingOrder?: any;
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
  disabled?: boolean;
}

function EditableCell({
  value,
  onChange,
  type,
  placeholder,
  disabled = false,
}: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);

  if (type === "date") {
    const date = parseDate(value) || new Date();
    return (
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full h-full flex items-center"
      >
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
        className={`w-full h-full flex items-center px-0 transition-colors ${
          disabled
            ? "cursor-not-allowed opacity-50"
            : "cursor-text hover:bg-[#f5f5f5]"
        }`}
        onClick={() => {
          if (!disabled) {
            setIsEditing(true);
            setInputValue(value === "$0" || value === "$0.00" ? "" : value);
          }
        }}
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
              } else if (inputValue === "") {
                onChange("$0");
              } else {
                setInputValue(value);
              }
              setIsEditing(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (inputValue && validateAmount(inputValue)) {
                  onChange(formatCurrency(inputValue));
                } else if (inputValue === "") {
                  onChange("$0");
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
  editingOrder,
}: FTOApprovalModalProps) {
  const [hourRows, setHourRows] = useState<HourRow[]>([]);
  const [expenseRows, setExpenseRows] = useState<ExpenseRow[]>([]);
  const [pdfOpen, setPdfOpen] = useState(false);

  React.useEffect(() => {
    if (!open) {
      setHourRows([]);
      setExpenseRows([]);
      setPdfOpen(false);
    }
  }, [open]);

  const updateHourRow = (id: string, field: keyof HourRow, value: any) => {
    setHourRows((rows) =>
      rows.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
    );
  };

  const updateExpenseRow = (
    id: string,
    field: keyof ExpenseRow,
    value: any,
  ) => {
    setExpenseRows((rows) =>
      rows.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
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
    0,
  );
  const expensesTotal = expenseRows.reduce(
    (sum, row) => sum + calculateTotal(row.amount, row.upcharge),
    0,
  );
  const grandTotal = hoursTotal + expensesTotal;

  const validateHourRow = (row: HourRow): boolean => {
    if (!row.date || !row.hours || !row.note) return false;
    if (
      !row.noFee &&
      (row.amount === "$0" || row.amount === "$0.00" || !row.amount)
    )
      return false;
    return true;
  };

  const validateExpenseRow = (row: ExpenseRow): boolean => {
    if (!row.date || !row.vendor || !row.receiptNote) return false;
    if (row.amount === "$0" || row.amount === "$0.00" || !row.amount)
      return false;
    return true;
  };

  const isFormValid = (): boolean => {
    if (hourRows.length === 0 && expenseRows.length === 0) return false;
    const allHoursValid = hourRows.every(validateHourRow);
    const allExpensesValid = expenseRows.every(validateExpenseRow);
    return allHoursValid && allExpensesValid;
  };

  const isHourFieldMissing = (row: HourRow, field: keyof HourRow): boolean => {
    if (field === "date") return !row.date;
    if (field === "hours") return !row.hours;
    if (field === "note") return !row.note;
    if (field === "amount")
      return (
        !row.noFee &&
        (row.amount === "$0" || row.amount === "$0.00" || !row.amount)
      );
    return false;
  };

  const isExpenseFieldMissing = (
    row: ExpenseRow,
    field: keyof ExpenseRow,
  ): boolean => {
    if (field === "date") return !row.date;
    if (field === "vendor") return !row.vendor;
    if (field === "receiptNote") return !row.receiptNote;
    if (field === "amount")
      return row.amount === "$0" || row.amount === "$0.00" || !row.amount;
    return false;
  };

  const handleReject = () => {
    console.log("FTO Rejected");
    onOpenChange(false);
  };

  const handleApprove = () => {
    if (isFormValid()) {
      console.log("FTO Approved");
      onOpenChange(false);
    }
  };

  return (
    <>
      <ModalTemplate
        open={open && !pdfOpen}
        onOpenChange={onOpenChange}
        title="Field Team Order Approval"
        size="xl"
        footer={
          <div style={{ display: "flex", gap: "12px", width: "100%" }}>
            <button
              onClick={handleReject}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                paddingLeft: "12px",
                paddingRight: "12px",
                paddingTop: "8px",
                paddingBottom: "8px",
                minHeight: "36px",
                borderRadius: "8px",
                backgroundColor: "#dc2626",
                border: "1px solid #fbbf24",
                color: "white",
                fontWeight: 500,
                fontSize: "16px",
                cursor: "pointer",
                transition: "background-color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#b91c1c")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#dc2626")}
            >
              Reject
            </button>
            <button
              onClick={handleApprove}
              disabled={!isFormValid()}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                paddingLeft: "12px",
                paddingRight: "12px",
                paddingTop: "8px",
                paddingBottom: "8px",
                minHeight: "36px",
                borderRadius: "8px",
                backgroundColor: isFormValid() ? "#013764" : "#999",
                border: "1px solid white",
                color: "white",
                fontWeight: 500,
                fontSize: "16px",
                cursor: isFormValid() ? "pointer" : "not-allowed",
                transition: "background-color 0.2s",
                opacity: isFormValid() ? 1 : 0.5,
              }}
              onMouseEnter={(e) =>
                isFormValid() && (e.currentTarget.style.backgroundColor = "#014777")
              }
              onMouseLeave={(e) =>
                isFormValid() && (e.currentTarget.style.backgroundColor = "#013764")
              }
            >
              <ApproveIcon width={16} height={16} className="text-white" />
              Approve Field Team Order
            </button>
          </div>
        }
      >
        <FormLayout>
          <FormSection showDivider={false}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "12px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label
                  style={{
                    fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                    fontSize: "14px",
                    color: "#303030",
                    fontWeight: 500,
                    lineHeight: 1.43,
                  }}
                >
                  Property
                </label>
                <div
                  style={{
                    height: "36px",
                    borderRadius: "8px",
                    border: "1px solid #e5e5e5",
                    backgroundColor: "white",
                    opacity: 0.5,
                    paddingLeft: "12px",
                    paddingRight: "12px",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <span style={{ color: "#303030", fontSize: "14px" }}>
                    {property}
                  </span>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label
                  style={{
                    fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                    fontSize: "14px",
                    color: "#303030",
                    fontWeight: 500,
                    lineHeight: 1.43,
                  }}
                >
                  Unit
                </label>
                <div
                  style={{
                    height: "36px",
                    borderRadius: "8px",
                    border: "1px solid #e5e5e5",
                    backgroundColor: "white",
                    opacity: 0.5,
                    paddingLeft: "12px",
                    paddingRight: "12px",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <span style={{ color: "#303030", fontSize: "14px" }}>
                    {unit}
                  </span>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label
                  style={{
                    fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                    fontSize: "14px",
                    color: "#303030",
                    fontWeight: 500,
                    lineHeight: 1.43,
                  }}
                >
                  Field Team Assignee
                </label>
                <div
                  style={{
                    height: "36px",
                    borderRadius: "8px",
                    border: "1px solid #e5e5e5",
                    backgroundColor: "white",
                    opacity: 0.5,
                    paddingLeft: "12px",
                    paddingRight: "12px",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <span style={{ color: "#303030", fontSize: "14px" }}>
                    {fieldTeamAssignee}
                  </span>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label
                  style={{
                    fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                    fontSize: "14px",
                    color: "#303030",
                    fontWeight: 500,
                    lineHeight: 1.43,
                  }}
                >
                  Associated Task
                </label>
                <Select defaultValue="12311" disabled>
                  <SelectTrigger
                    style={{
                      height: "36px",
                      borderRadius: "8px",
                      borderColor: "#e5e5e5",
                      backgroundColor: "white",
                      opacity: 0.5,
                      cursor: "not-allowed",
                    }}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="12311">12311</SelectItem>
                    <SelectItem value="12312">12312</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {editingOrder && (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label
                  style={{
                    fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                    fontSize: "14px",
                    color: "#303030",
                    fontWeight: 500,
                    lineHeight: 1.43,
                  }}
                >
                  Description
                </label>
                <div
                  style={{
                    height: "36px",
                    borderRadius: "8px",
                    border: "1px solid #e5e5e5",
                    backgroundColor: "white",
                    opacity: 0.5,
                    paddingLeft: "12px",
                    paddingRight: "12px",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <span style={{ color: "#303030", fontSize: "14px" }}>
                    {editingOrder.description}
                  </span>
                </div>
              </div>
            )}
          </FormSection>
        </FormLayout>

        {/* Hours Section */}
        <div style={{ marginTop: "28px" }}>
          <div style={{ borderRadius: "12px", border: "1px solid #e5e5e5", boxShadow: "0 1px 2px rgba(0,0,0,0.05)", overflow: "hidden" }}>
            <div style={{ backgroundColor: "white", paddingLeft: "16px", paddingRight: "16px", paddingTop: "16px", paddingBottom: "16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "20px", flexWrap: "wrap" }}>
              <h3 style={{ color: "#303030", fontWeight: 600, fontSize: "18px", lineHeight: 1.3 }}>
                Hours
              </h3>
              <button
                onClick={() => {
                  const newId = String(
                    Math.max(...hourRows.map((r) => parseInt(r.id)), 0) + 1,
                  );
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
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  paddingLeft: "12px",
                  paddingRight: "12px",
                  minHeight: "36px",
                  borderRadius: "8px",
                  backgroundColor: "#013764",
                  border: "1px solid white",
                  color: "white",
                  fontWeight: 500,
                  fontSize: "16px",
                  cursor: "pointer",
                  transition: "background-color 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#014777")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#013764")}
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
                <span>Add Hours</span>
              </button>
            </div>

            <div
              style={{
                borderTop: "1px solid #dadada",
                display: "grid",
                gridTemplateColumns:
                  "118px 76px 1fr 80px 105px minmax(80px, auto) minmax(80px, auto) minmax(70px, auto) 85px",
                gridAutoRows: "minmax(min-content, auto)",
              }}
            >
              <div style={{ backgroundColor: "#fbfbfb", paddingLeft: "12px", paddingRight: "12px", paddingTop: "12px", paddingBottom: "12px", borderBottom: "1px solid #dadada", borderRight: "1px solid #dadada", fontWeight: 500, fontSize: "14px", color: "#525252", whiteSpace: "nowrap" }}>
                Date
              </div>
              <div style={{ backgroundColor: "#fbfbfb", paddingLeft: "12px", paddingRight: "12px", paddingTop: "12px", paddingBottom: "12px", borderBottom: "1px solid #dadada", borderRight: "1px solid #dadada", fontWeight: 500, fontSize: "14px", color: "#525252", whiteSpace: "nowrap" }}>
                Hours
              </div>
              <div style={{ backgroundColor: "#fbfbfb", paddingLeft: "12px", paddingRight: "12px", paddingTop: "12px", paddingBottom: "12px", borderBottom: "1px solid #dadada", borderRight: "1px solid #dadada", fontWeight: 500, fontSize: "14px", color: "#525252", whiteSpace: "nowrap" }}>
                Note
              </div>
              <div style={{ backgroundColor: "#fbfbfb", paddingLeft: "12px", paddingRight: "12px", paddingTop: "12px", paddingBottom: "12px", borderBottom: "1px solid #dadada", borderRight: "1px solid #dadada", fontWeight: 500, fontSize: "14px", color: "#525252", whiteSpace: "nowrap" }}>
                NoFee?
              </div>
              <div style={{ backgroundColor: "#fbfbfb", paddingLeft: "12px", paddingRight: "12px", paddingTop: "12px", paddingBottom: "12px", borderBottom: "1px solid #dadada", borderRight: "1px solid #dadada", fontWeight: 500, fontSize: "14px", color: "#525252", whiteSpace: "nowrap" }}>
                Emergency
              </div>
              <div style={{ backgroundColor: "#fbfbfb", paddingLeft: "12px", paddingRight: "12px", paddingTop: "12px", paddingBottom: "12px", borderBottom: "1px solid #dadada", borderRight: "1px solid #dadada", fontWeight: 500, fontSize: "14px", color: "#525252", whiteSpace: "nowrap" }}>
                Amount
              </div>
              <div style={{ backgroundColor: "#fbfbfb", paddingLeft: "12px", paddingRight: "12px", paddingTop: "12px", paddingBottom: "12px", borderBottom: "1px solid #dadada", borderRight: "1px solid #dadada", fontWeight: 500, fontSize: "14px", color: "#525252", whiteSpace: "nowrap" }}>
                Upcharge
              </div>
              <div style={{ backgroundColor: "#fbfbfb", paddingLeft: "12px", paddingRight: "12px", paddingTop: "12px", paddingBottom: "12px", borderBottom: "1px solid #dadada", borderRight: "1px solid #dadada", fontWeight: 500, fontSize: "14px", color: "#525252", whiteSpace: "nowrap" }}>
                Total
              </div>
              <div style={{ backgroundColor: "#fbfbfb", paddingLeft: "12px", paddingRight: "12px", paddingTop: "12px", paddingBottom: "12px", borderBottom: "1px solid #dadada", fontWeight: 500, fontSize: "14px", color: "#525252", whiteSpace: "nowrap" }}>
                Actions
              </div>

              {hourRows.map((row) => (
                <React.Fragment key={row.id}>
                  <div
                    style={{
                      paddingLeft: "12px",
                      paddingRight: "12px",
                      paddingTop: "12px",
                      paddingBottom: "12px",
                      display: "flex",
                      alignItems: "center",
                      border: isHourFieldMissing(row, "date")
                        ? "1px solid #ef4444"
                        : "1px solid #dadada",
                      backgroundColor: isHourFieldMissing(row, "date")
                        ? "#fef2f2"
                        : "white",
                    }}
                  >
                    <EditableCell
                      value={row.date}
                      onChange={(value) => updateHourRow(row.id, "date", value)}
                      type="date"
                    />
                  </div>
                  <div
                    style={{
                      paddingLeft: "12px",
                      paddingRight: "12px",
                      paddingTop: "12px",
                      paddingBottom: "12px",
                      display: "flex",
                      alignItems: "center",
                      border: isHourFieldMissing(row, "hours")
                        ? "1px solid #ef4444"
                        : "1px solid #dadada",
                      backgroundColor: isHourFieldMissing(row, "hours")
                        ? "#fef2f2"
                        : "white",
                    }}
                  >
                    <EditableCell
                      value={row.hours}
                      onChange={(value) =>
                        updateHourRow(row.id, "hours", value)
                      }
                      type="number"
                      placeholder="e.g., 2 or 2.5"
                    />
                  </div>
                  <div
                    style={{
                      paddingLeft: "12px",
                      paddingRight: "12px",
                      paddingTop: "12px",
                      paddingBottom: "12px",
                      display: "flex",
                      alignItems: "center",
                      border: isHourFieldMissing(row, "note")
                        ? "1px solid #ef4444"
                        : "1px solid #dadada",
                      backgroundColor: isHourFieldMissing(row, "note")
                        ? "#fef2f2"
                        : "white",
                    }}
                  >
                    <EditableCell
                      value={row.note}
                      onChange={(value) => updateHourRow(row.id, "note", value)}
                      type="text"
                      placeholder="Enter note"
                    />
                  </div>
                  <div style={{ paddingLeft: "12px", paddingRight: "12px", paddingTop: "12px", paddingBottom: "12px", borderBottom: "1px solid #dadada", borderRight: "1px solid #dadada", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Checkbox
                      checked={row.noFee}
                      onCheckedChange={(checked) => {
                        updateHourRow(row.id, "noFee", checked);
                        if (checked) {
                          updateHourRow(row.id, "amount", "$0");
                          updateHourRow(row.id, "upcharge", "$0");
                        }
                      }}
                      className="w-[14px] h-[14px]"
                    />
                  </div>
                  <div style={{ paddingLeft: "12px", paddingRight: "12px", paddingTop: "12px", paddingBottom: "12px", borderBottom: "1px solid #dadada", borderRight: "1px solid #dadada", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Checkbox
                      checked={row.emergency}
                      onCheckedChange={(checked) =>
                        updateHourRow(row.id, "emergency", checked)
                      }
                      className="w-[14px] h-[14px]"
                    />
                  </div>
                  <div
                    style={{
                      paddingLeft: "12px",
                      paddingRight: "12px",
                      paddingTop: "12px",
                      paddingBottom: "12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: isHourFieldMissing(row, "amount")
                        ? "1px solid #ef4444"
                        : "1px solid #dadada",
                      backgroundColor: isHourFieldMissing(row, "amount")
                        ? "#fef2f2"
                        : "white",
                      pointerEvents: "auto",
                    }}
                  >
                    <EditableCell
                      value={row.amount}
                      onChange={(value) =>
                        updateHourRow(row.id, "amount", value)
                      }
                      type="currency"
                      placeholder="$0"
                      disabled={row.noFee}
                    />
                  </div>
                  <div style={{ paddingLeft: "12px", paddingRight: "12px", paddingTop: "12px", paddingBottom: "12px", borderBottom: "1px solid #dadada", borderRight: "1px solid #dadada", display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "auto" }}>
                    <EditableCell
                      value={row.upcharge}
                      onChange={(value) =>
                        updateHourRow(row.id, "upcharge", value)
                      }
                      type="currency"
                      placeholder="$0"
                      disabled={row.noFee}
                    />
                  </div>
                  <div style={{ paddingLeft: "12px", paddingRight: "12px", paddingTop: "12px", paddingBottom: "12px", borderBottom: "1px solid #dadada", borderRight: "1px solid #dadada", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ color: "#303030", fontWeight: 600, fontSize: "16px" }}>
                      ${calculateTotal(row.amount, row.upcharge).toFixed(2)}
                    </span>
                  </div>
                  <div style={{ paddingLeft: "12px", paddingRight: "12px", paddingTop: "12px", paddingBottom: "12px", borderBottom: "1px solid #dadada", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button style={{ width: "28px", height: "28px", borderRadius: "6px", border: "1px solid #dadada", backgroundColor: "#fbfbfb", boxShadow: "0 1px 2px rgba(0,0,0,0.03)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "background-color 0.2s" }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f0f0f0")}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#fbfbfb")}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="1" />
                            <circle cx="19" cy="12" r="1" />
                            <circle cx="5" cy="12" r="1" />
                          </svg>
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => deleteHourRow(row.id)}
                          style={{ color: "#dc2626", cursor: "pointer" }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* Expenses Section */}
        <div style={{ marginTop: "28px" }}>
          <div style={{ borderRadius: "12px", border: "1px solid #e5e5e5", boxShadow: "0 1px 2px rgba(0,0,0,0.05)", overflow: "hidden" }}>
            <div style={{ backgroundColor: "white", paddingLeft: "16px", paddingRight: "16px", paddingTop: "16px", paddingBottom: "16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "20px", flexWrap: "wrap" }}>
              <h3 style={{ color: "#303030", fontWeight: 600, fontSize: "18px", lineHeight: 1.3 }}>
                Expenses
              </h3>
              <button
                onClick={() => {
                  const newId = String(
                    Math.max(...expenseRows.map((r) => parseInt(r.id)), 0) + 1,
                  );
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
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  paddingLeft: "12px",
                  paddingRight: "12px",
                  minHeight: "36px",
                  borderRadius: "8px",
                  backgroundColor: "#013764",
                  border: "1px solid white",
                  color: "white",
                  fontWeight: 500,
                  fontSize: "16px",
                  cursor: "pointer",
                  transition: "background-color 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#014777")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#013764")}
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
                <span>Add Expenses</span>
              </button>
            </div>

            <div
              style={{
                borderTop: "1px solid #dadada",
                display: "grid",
                gridTemplateColumns:
                  "110px 130px 1fr 60px minmax(80px, auto) minmax(80px, auto) minmax(70px, auto) 85px",
                gridAutoRows: "minmax(min-content, auto)",
              }}
            >
              <div style={{ backgroundColor: "#fbfbfb", paddingLeft: "12px", paddingRight: "12px", paddingTop: "12px", paddingBottom: "12px", borderBottom: "1px solid #dadada", borderRight: "1px solid #dadada", fontWeight: 500, fontSize: "14px", color: "#525252", whiteSpace: "nowrap" }}>
                Date
              </div>
              <div style={{ backgroundColor: "#fbfbfb", paddingLeft: "12px", paddingRight: "12px", paddingTop: "12px", paddingBottom: "12px", borderBottom: "1px solid #dadada", borderRight: "1px solid #dadada", fontWeight: 500, fontSize: "14px", color: "#525252", whiteSpace: "nowrap" }}>
                Vendor
              </div>
              <div style={{ backgroundColor: "#fbfbfb", paddingLeft: "12px", paddingRight: "12px", paddingTop: "12px", paddingBottom: "12px", borderBottom: "1px solid #dadada", borderRight: "1px solid #dadada", fontWeight: 500, fontSize: "14px", color: "#525252", whiteSpace: "nowrap" }}>
                Receipt Note
              </div>
              <div style={{ backgroundColor: "#fbfbfb", paddingLeft: "12px", paddingRight: "12px", paddingTop: "12px", paddingBottom: "12px", borderBottom: "1px solid #dadada", borderRight: "1px solid #dadada", fontWeight: 500, fontSize: "14px", color: "#525252", whiteSpace: "nowrap" }}>
                Receipts
              </div>
              <div style={{ backgroundColor: "#fbfbfb", paddingLeft: "12px", paddingRight: "12px", paddingTop: "12px", paddingBottom: "12px", borderBottom: "1px solid #dadada", borderRight: "1px solid #dadada", fontWeight: 500, fontSize: "14px", color: "#525252", whiteSpace: "nowrap" }}>
                Amount
              </div>
              <div style={{ backgroundColor: "#fbfbfb", paddingLeft: "12px", paddingRight: "12px", paddingTop: "12px", paddingBottom: "12px", borderBottom: "1px solid #dadada", borderRight: "1px solid #dadada", fontWeight: 500, fontSize: "14px", color: "#525252", whiteSpace: "nowrap" }}>
                Upcharge
              </div>
              <div style={{ backgroundColor: "#fbfbfb", paddingLeft: "12px", paddingRight: "12px", paddingTop: "12px", paddingBottom: "12px", borderBottom: "1px solid #dadada", borderRight: "1px solid #dadada", fontWeight: 500, fontSize: "14px", color: "#525252", whiteSpace: "nowrap" }}>
                Total
              </div>
              <div style={{ backgroundColor: "#fbfbfb", paddingLeft: "12px", paddingRight: "12px", paddingTop: "12px", paddingBottom: "12px", borderBottom: "1px solid #dadada", fontWeight: 500, fontSize: "14px", color: "#525252", whiteSpace: "nowrap" }}>
                Actions
              </div>

              {expenseRows.map((row) => (
                <React.Fragment key={row.id}>
                  <div
                    style={{
                      paddingLeft: "12px",
                      paddingRight: "12px",
                      paddingTop: "12px",
                      paddingBottom: "12px",
                      display: "flex",
                      alignItems: "center",
                      border: isExpenseFieldMissing(row, "date")
                        ? "1px solid #ef4444"
                        : "1px solid #dadada",
                      backgroundColor: isExpenseFieldMissing(row, "date")
                        ? "#fef2f2"
                        : "white",
                    }}
                  >
                    <EditableCell
                      value={row.date}
                      onChange={(value) =>
                        updateExpenseRow(row.id, "date", value)
                      }
                      type="date"
                    />
                  </div>
                  <div
                    style={{
                      paddingLeft: "12px",
                      paddingRight: "12px",
                      paddingTop: "12px",
                      paddingBottom: "12px",
                      display: "flex",
                      alignItems: "center",
                      border: isExpenseFieldMissing(row, "vendor")
                        ? "1px solid #ef4444"
                        : "1px solid #dadada",
                      backgroundColor: isExpenseFieldMissing(row, "vendor")
                        ? "#fef2f2"
                        : "white",
                    }}
                  >
                    <Select
                      value={row.vendor}
                      onValueChange={(value) =>
                        updateExpenseRow(row.id, "vendor", value)
                      }
                    >
                      <SelectTrigger style={{ height: "auto", border: "0", backgroundColor: "transparent", padding: "0" }}>
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
                  <div
                    style={{
                      paddingLeft: "12px",
                      paddingRight: "12px",
                      paddingTop: "12px",
                      paddingBottom: "12px",
                      display: "flex",
                      alignItems: "center",
                      border: isExpenseFieldMissing(row, "receiptNote")
                        ? "1px solid #ef4444"
                        : "1px solid #dadada",
                      backgroundColor: isExpenseFieldMissing(row, "receiptNote")
                        ? "#fef2f2"
                        : "white",
                    }}
                  >
                    <EditableCell
                      value={row.receiptNote}
                      onChange={(value) =>
                        updateExpenseRow(row.id, "receiptNote", value)
                      }
                      type="text"
                      placeholder="Enter receipt note"
                    />
                  </div>
                  <div style={{ paddingLeft: "12px", paddingRight: "12px", paddingTop: "12px", paddingBottom: "12px", borderBottom: "1px solid #dadada", borderRight: "1px solid #dadada", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <button
                      onClick={() => setPdfOpen(true)}
                      style={{ width: "24px", height: "24px", borderRadius: "6px", border: "1px solid #dadada", backgroundColor: "#fbfbfb", boxShadow: "0 1px 2px rgba(0,0,0,0.03)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "background-color 0.2s" }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f0f0f0")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#fbfbfb")}
                      title="View receipt"
                    >
                      <Paperclip style={{ width: "16px", height: "16px", color: "#303030" }} />
                    </button>
                  </div>
                  <div
                    style={{
                      paddingLeft: "12px",
                      paddingRight: "12px",
                      paddingTop: "12px",
                      paddingBottom: "12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: isExpenseFieldMissing(row, "amount")
                        ? "1px solid #ef4444"
                        : "1px solid #dadada",
                      backgroundColor: isExpenseFieldMissing(row, "amount")
                        ? "#fef2f2"
                        : "white",
                      pointerEvents: "auto",
                    }}
                  >
                    <EditableCell
                      value={row.amount}
                      onChange={(value) =>
                        updateExpenseRow(row.id, "amount", value)
                      }
                      type="currency"
                      placeholder="$0"
                    />
                  </div>
                  <div style={{ paddingLeft: "12px", paddingRight: "12px", paddingTop: "12px", paddingBottom: "12px", borderBottom: "1px solid #dadada", borderRight: "1px solid #dadada", display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "auto" }}>
                    <EditableCell
                      value={row.upcharge}
                      onChange={(value) =>
                        updateExpenseRow(row.id, "upcharge", value)
                      }
                      type="currency"
                      placeholder="$0"
                    />
                  </div>
                  <div style={{ paddingLeft: "12px", paddingRight: "12px", paddingTop: "12px", paddingBottom: "12px", borderBottom: "1px solid #dadada", borderRight: "1px solid #dadada", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ color: "#303030", fontWeight: 600, fontSize: "16px" }}>
                      ${calculateTotal(row.amount, row.upcharge).toFixed(2)}
                    </span>
                  </div>
                  <div style={{ paddingLeft: "12px", paddingRight: "12px", paddingTop: "12px", paddingBottom: "12px", borderBottom: "1px solid #dadada", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button style={{ width: "28px", height: "28px", borderRadius: "6px", border: "1px solid #dadada", backgroundColor: "#fbfbfb", boxShadow: "0 1px 2px rgba(0,0,0,0.03)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "background-color 0.2s" }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f0f0f0")}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#fbfbfb")}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="1" />
                            <circle cx="19" cy="12" r="1" />
                            <circle cx="5" cy="12" r="1" />
                          </svg>
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => deleteExpenseRow(row.id)}
                          style={{ color: "#dc2626", cursor: "pointer" }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* FTO Total */}
        <div style={{ backgroundColor: "#fbfbfb", paddingLeft: "16px", paddingRight: "16px", paddingTop: "16px", paddingBottom: "16px", display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "28px", borderRadius: "8px" }}>
          <span style={{ color: "#303030", fontWeight: 600, fontSize: "18px", lineHeight: 1.3 }}>
            FTO Total:
          </span>
          <span style={{ color: "#303030", fontWeight: 600, fontSize: "18px", lineHeight: 1.3 }}>
            ${grandTotal.toFixed(2)}
          </span>
        </div>
      </ModalTemplate>

      {/* PDF Viewer Modal */}
      <Dialog open={pdfOpen} onOpenChange={setPdfOpen}>
        <DialogContent style={{ maxWidth: "56rem", width: "100%", height: "80vh", padding: 0, display: "flex", flexDirection: "column" }}>
          <DialogTitle style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingLeft: "24px", paddingRight: "24px", paddingTop: "16px", paddingBottom: "16px", borderBottom: "1px solid #e5e5e5", fontSize: "18px", fontWeight: 600, color: "#303030", margin: 0 }}>
            <span>Receipt</span>
          </DialogTitle>
          <div style={{ flex: 1, backgroundColor: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ textAlign: "center" }}>
              <svg
                width="64"
                height="64"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                style={{ margin: "0 auto 16px", color: "#ccc" }}
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="12" y1="11" x2="12" y2="17" />
                <line x1="9" y1="14" x2="15" y2="14" />
              </svg>
              <p style={{ color: "#999" }}>PDF Document</p>
              <p style={{ fontSize: "14px", color: "#ccc", marginTop: "8px" }}>Sample PDF Viewer</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
