import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { SelectField } from "@/components/forms/SelectField";
import { TextField } from "@/components/forms/TextField";
import { TextAreaField } from "@/components/forms/TextAreaField";
import { Checkbox } from "@/components/ui/checkbox";
import { DeleteIcon } from "@/components/icons";

interface HourRow {
  id: string;
  date: string;
  hours: string;
  note: string;
  noFee: boolean;
  emergency: boolean;
  amount: string;
  upcharge: string;
  assignee: string;
}

interface ExpenseRow {
  id: string;
  date: string;
  vendor: string;
  receiptNote: string;
  avmExpense: boolean;
  amount: string;
  upcharge: string;
  assignee: string;
}

interface ApproveFTOPageProps {
  property?: string;
  unit?: string;
  fieldTeamAssignee?: string;
  task?: string;
  description?: string;
}

const mockVendors = ["Elite HVAC", "ABC Plumbing", "Green Lawn Services"];
const mockTasks = ["HVAC Inspection", "Plumbing Repair", "Door Lock Repair"];
const mockAssignees = ["John Smith", "Jane Doe", "Mike Johnson", "Sarah Williams"];

const calculateTotal = (amount: string, upcharge: string): number => {
  const amountNum = parseFloat(amount.replace(/[^0-9.-]+/g, "")) || 0;
  const upchargeNum = parseFloat(upcharge.replace(/[^0-9.-]+/g, "")) || 0;
  return Math.max(0, amountNum + upchargeNum);
};

const formatDate = (date: Date): string => {
  return date.toISOString().split("T")[0];
};

export default function ApproveFTOPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state || {}) as ApproveFTOPageProps;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [property, setProperty] = useState(state.property || "");
  const [unit, setUnit] = useState(state.unit || "");
  const [fieldTeamAssignee, setFieldTeamAssignee] = useState(
    state.fieldTeamAssignee || "",
  );
  const [task, setTask] = useState(state.task || "");
  const [description, setDescription] = useState(state.description || "");

  const [hourRows, setHourRows] = useState<HourRow[]>([
    {
      id: "1",
      date: formatDate(new Date()),
      hours: "",
      note: "",
      noFee: false,
      emergency: false,
      amount: "$0",
      upcharge: "$0",
      assignee: "",
    },
  ]);

  const [expenseRows, setExpenseRows] = useState<ExpenseRow[]>([
    {
      id: "1",
      date: formatDate(new Date()),
      vendor: "",
      receiptNote: "",
      avmExpense: false,
      amount: "$0",
      upcharge: "$0",
      assignee: "",
    },
  ]);

  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState<boolean>(true);
  const [uploadedFiles, setUploadedFiles] = useState<
    Array<{ name: string; size: number; file: File }>
  >([]);

  useEffect(() => {
    const checkSidebarVisibility = () => {
      const sidebar = document.querySelector('aside[style*="opacity"]');
      if (sidebar) {
        const opacity = window.getComputedStyle(sidebar).opacity;
        setSidebarVisible(parseFloat(opacity) > 0.5);
      }
    };

    checkSidebarVisibility();
    const interval = setInterval(checkSidebarVisibility, 300);
    return () => clearInterval(interval);
  }, []);

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

  const addHourRow = () => {
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
        assignee: "",
      },
    ]);
  };

  const addExpenseRow = () => {
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
        assignee: "",
      },
    ]);
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

  const handleApprove = () => {
    console.log("FTO Approved", {
      property,
      unit,
      fieldTeamAssignee,
      task,
      description,
      hours: hourRows,
      expenses: expenseRows,
    });
    navigate(-1);
  };

  const handleReject = () => {
    console.log("FTO Rejected");
    navigate(-1);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files) {
      const newFiles = Array.from(files).map((file) => ({
        name: file.name,
        size: file.size,
        file,
      }));
      setUploadedFiles([...uploadedFiles, ...newFiles]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  return (
    <div
      className="bg-white flex flex-col font-[Geist,-apple-system,Roboto,Helvetica,sans-serif]"
      style={{
        display: "flex",
        backgroundColor: "rgb(255, 255, 255)",
        flexDirection: "column",
        fontWeight: "400",
        minHeight: "100vh",
      }}
    >
      {/* Main Content Area */}
      <div
        className="flex flex-1"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "0",
          overflow: "hidden",
        }}
      >
        {/* Left Column - File Upload/Viewer (Fixed) */}
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
                          <button
                            onClick={() => handleRemoveFile(index)}
                            className="text-[#A1A1A9] hover:text-[#303030] transition-colors ml-4"
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
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-blue-600 hover:underline text-sm font-medium text-center flex-shrink-0"
                    >
                      Add more files
                    </button>
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
              {/* FTO Details Section */}
              <div
                className="flex flex-col w-full"
                style={{ marginLeft: "-5px" }}
              >
                {/* FTO Details Header */}
                <div className="flex w-full flex-col text-xl text-[#303030] font-semibold leading-[1.3]">
                  <div>FTO Details</div>
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
                  {/* Property and Unit Row */}
                  <div className="flex gap-5">
                    <div className="flex-1">
                      <TextField
                        label="Property"
                        value={property}
                        onChange={() => {}}
                        disabled={true}
                      />
                    </div>
                    <div className="flex-1">
                      <TextField
                        label="Unit"
                        value={unit}
                        onChange={() => {}}
                        disabled={true}
                      />
                    </div>
                  </div>

                  {/* Field Team Assignee and Associated Task Row */}
                  <div className="flex gap-5">
                    <div className="flex-1">
                      <TextField
                        label="Field Team Assignee"
                        value={fieldTeamAssignee}
                        onChange={() => {}}
                        disabled={true}
                      />
                    </div>
                    <div className="flex-1">
                      <SelectField
                        label="Associated Task"
                        value={task}
                        onChange={() => {}}
                        placeholder="Select task..."
                        disabled={true}
                        options={mockTasks.map((t) => ({
                          value: t,
                          label: t,
                        }))}
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <TextAreaField
                    label="Description"
                    value={description}
                    onChange={() => {}}
                    placeholder="Task description..."
                    disabled={true}
                    autoGrow
                  />
                </div>

                {/* Hours Section */}
                <div className="flex mt-[60px] w-full flex-col gap-6">
                  {/* Header */}
                  <div className="flex h-9 justify-between items-start">
                    <div className="flex flex-col gap-5">
                      <div className="flex flex-col text-xl text-[#303030] font-semibold leading-[26px]">
                        <div className="font-semibold">Hours</div>
                        <div
                          className="h-px bg-gray-200 mt-5"
                          style={{ width: "790px" }}
                        />
                      </div>
                    </div>
                    <button
                      onClick={addHourRow}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium whitespace-nowrap"
                    >
                      + Add Hours
                    </button>
                  </div>

                  {/* Hours Table */}
                  <div>
                    <div
                      className="flex w-full flex-col rounded-xl shadow-[0_1px_2px_0_rgba(10,13,18,0.05)]"
                      style={{ minWidth: "fit-content" }}
                    >
                      <div className="flex flex-col border border-[#DADADA]/50 shadow-[0_1px_2px_0_rgba(10,13,18,0.05)] bg-white">
                        {/* Table Header */}
                        <div className="flex items-center">
                          <div className="flex items-center gap-2 border-b border-r border-[#DADADA]/50 px-3 py-3 flex-shrink-0 w-32">
                            <span className="text-[#525252] text-[13px] font-medium leading-[140%] tracking-[-0.26px] whitespace-nowrap">
                              Date
                            </span>
                          </div>
                          <div className="flex items-center gap-2 border-b border-r border-[#DADADA]/50 px-3 py-3 flex-shrink-0 w-24">
                            <span className="text-[#525252] text-[13px] font-medium leading-[140%] tracking-[-0.26px] whitespace-nowrap">
                              Hours
                            </span>
                          </div>
                          <div className="flex items-center gap-2 border-b border-r border-[#DADADA]/50 px-3 py-3 flex-1">
                            <span className="text-[#525252] text-[13px] font-medium leading-[140%] tracking-[-0.26px] whitespace-nowrap">
                              Note
                            </span>
                          </div>
                          <div className="flex items-center gap-2 border-b border-r border-[#DADADA]/50 px-3 py-3 flex-shrink-0 w-32">
                            <span className="text-[#525252] text-[13px] font-medium leading-[140%] tracking-[-0.26px] whitespace-nowrap">
                              Assignee
                            </span>
                          </div>
                          <div className="flex items-center gap-2 border-b border-r border-[#DADADA]/50 px-3 py-3 flex-shrink-0 w-16">
                            <span className="text-[#525252] text-[13px] font-medium leading-[140%] tracking-[-0.26px] whitespace-nowrap">
                              NoFee?
                            </span>
                          </div>
                          <div className="flex items-center gap-2 border-b border-r border-[#DADADA]/50 px-3 py-3 flex-shrink-0 w-24">
                            <span className="text-[#525252] text-[13px] font-medium leading-[140%] tracking-[-0.26px] whitespace-nowrap">
                              Emergency
                            </span>
                          </div>
                          <div className="flex items-center gap-2 border-b border-r border-[#DADADA]/50 px-3 py-3 flex-shrink-0 w-28">
                            <span className="text-[#525252] text-[13px] font-medium leading-[140%] tracking-[-0.26px] whitespace-nowrap">
                              Amount
                            </span>
                          </div>
                          <div className="flex items-center gap-2 border-b border-r border-[#DADADA]/50 px-3 py-3 flex-shrink-0 w-28">
                            <span className="text-[#525252] text-[13px] font-medium leading-[140%] tracking-[-0.26px] whitespace-nowrap">
                              Upcharge
                            </span>
                          </div>
                          <div className="flex items-center gap-2 border-b border-r border-[#DADADA]/50 px-3 py-3 flex-shrink-0 w-24">
                            <span className="text-[#525252] text-[13px] font-medium leading-[140%] tracking-[-0.26px] whitespace-nowrap">
                              Total
                            </span>
                          </div>
                          <div className="flex items-center gap-2 border-b px-3 py-3 w-16">
                            <span className="text-[#525252] text-[13px] font-medium leading-[140%] tracking-[-0.26px] whitespace-nowrap">
                              Actions
                            </span>
                          </div>
                        </div>

                        {/* Table Rows */}
                        {hourRows.map((row) => (
                          <div key={row.id} className="flex items-center">
                            <div className="flex items-center border-b border-r px-3 min-h-14 py-2 flex-shrink-0 w-32">
                              <input
                                type="date"
                                value={row.date}
                                onChange={(e) =>
                                  updateHourRow(row.id, "date", e.target.value)
                                }
                                className="w-full bg-transparent outline-none text-[13px] placeholder-[#A1A1A9]"
                              />
                            </div>
                            <div className="flex items-center border-b border-r px-3 min-h-14 py-2 flex-shrink-0 w-24">
                              <input
                                type="text"
                                value={row.hours}
                                onChange={(e) =>
                                  updateHourRow(row.id, "hours", e.target.value)
                                }
                                placeholder="0"
                                className="w-full bg-transparent outline-none text-[13px] placeholder-[#A1A1A9]"
                              />
                            </div>
                            <div className="flex items-center border-b border-r px-3 min-h-14 py-2 flex-1">
                              <input
                                type="text"
                                value={row.note}
                                onChange={(e) =>
                                  updateHourRow(row.id, "note", e.target.value)
                                }
                                placeholder="Enter note"
                                className="w-full bg-transparent outline-none text-[13px] placeholder-[#A1A1A9]"
                              />
                            </div>
                            <div className="flex items-center border-b border-r px-3 min-h-14 py-2 flex-shrink-0 w-32">
                              <select
                                value={row.assignee}
                                onChange={(e) =>
                                  updateHourRow(
                                    row.id,
                                    "assignee",
                                    e.target.value,
                                  )
                                }
                                className="w-full bg-transparent outline-none text-[13px] placeholder-[#A1A1A9]"
                              >
                                <option value="">Select assignee...</option>
                                {mockAssignees.map((a) => (
                                  <option key={a} value={a}>
                                    {a}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="flex items-center justify-center border-b border-r px-3 min-h-14 py-2 flex-shrink-0 w-16">
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
                            <div className="flex items-center justify-center border-b border-r px-3 min-h-14 py-2 flex-shrink-0 w-24">
                              <Checkbox
                                checked={row.emergency}
                                onCheckedChange={(checked) =>
                                  updateHourRow(row.id, "emergency", checked)
                                }
                                className="w-[14px] h-[14px]"
                              />
                            </div>
                            <div className="flex items-center border-b border-r px-3 min-h-14 py-2 flex-shrink-0 w-28">
                              <input
                                type="text"
                                value={row.amount}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (
                                    val === "" ||
                                    /^\$?[\d,]*\.?\d{0,2}$/.test(val)
                                  ) {
                                    updateHourRow(row.id, "amount", val);
                                  }
                                }}
                                placeholder="$0"
                                disabled={row.noFee}
                                className="w-full bg-transparent outline-none text-[13px] placeholder-[#A1A1A9] disabled:opacity-50"
                              />
                            </div>
                            <div className="flex items-center border-b border-r px-3 min-h-14 py-2 flex-shrink-0 w-28">
                              <input
                                type="text"
                                value={row.upcharge}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (
                                    val === "" ||
                                    /^\$?[\d,]*\.?\d{0,2}$/.test(val)
                                  ) {
                                    updateHourRow(row.id, "upcharge", val);
                                  }
                                }}
                                placeholder="$0"
                                disabled={row.noFee}
                                className="w-full bg-transparent outline-none text-[13px] placeholder-[#A1A1A9] disabled:opacity-50"
                              />
                            </div>
                            <div className="flex items-center border-b border-r px-3 min-h-14 py-2 flex-shrink-0 w-24">
                              <span className="text-[#303030] font-600 text-[13px]">
                                $
                                {calculateTotal(
                                  row.amount,
                                  row.upcharge,
                                ).toFixed(2)}
                              </span>
                            </div>
                            <div className="flex items-center justify-center border-b px-3 min-h-14 py-2 w-16">
                              <button
                                onClick={() => deleteHourRow(row.id)}
                                className="text-[#525252] hover:text-[#303030] transition-colors"
                                title="Delete row"
                              >
                                <DeleteIcon
                                  width={16}
                                  height={16}
                                  color="currentColor"
                                />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expenses Section */}
                <div className="flex mt-[60px] w-full flex-col gap-6">
                  {/* Header */}
                  <div className="flex h-9 justify-between items-start">
                    <div className="flex flex-col gap-5">
                      <div className="flex flex-col text-xl text-[#303030] font-semibold leading-[26px]">
                        <div className="font-semibold">Expenses</div>
                        <div
                          className="h-px bg-gray-200 mt-5"
                          style={{ width: "790px" }}
                        />
                      </div>
                    </div>
                    <button
                      onClick={addExpenseRow}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium whitespace-nowrap"
                    >
                      + Add Expenses
                    </button>
                  </div>

                  {/* Expenses Table */}
                  <div>
                    <div
                      className="flex w-full flex-col rounded-xl shadow-[0_1px_2px_0_rgba(10,13,18,0.05)]"
                      style={{ minWidth: "fit-content" }}
                    >
                      <div className="flex flex-col border border-[#DADADA]/50 shadow-[0_1px_2px_0_rgba(10,13,18,0.05)] bg-white">
                        {/* Table Header */}
                        <div className="flex items-center">
                          <div className="flex items-center gap-2 border-b border-r border-[#DADADA]/50 px-3 py-3 flex-shrink-0 w-28">
                            <span className="text-[#525252] text-[13px] font-medium leading-[140%] tracking-[-0.26px] whitespace-nowrap">
                              Date
                            </span>
                          </div>
                          <div className="flex items-center gap-2 border-b border-r border-[#DADADA]/50 px-3 py-3 flex-shrink-0 w-40">
                            <span className="text-[#525252] text-[13px] font-medium leading-[140%] tracking-[-0.26px] whitespace-nowrap">
                              Vendor
                            </span>
                          </div>
                          <div className="flex items-center gap-2 border-b border-r border-[#DADADA]/50 px-3 py-3 flex-1">
                            <span className="text-[#525252] text-[13px] font-medium leading-[140%] tracking-[-0.26px] whitespace-nowrap">
                              Receipt Note
                            </span>
                          </div>
                          <div className="flex items-center gap-2 border-b border-r border-[#DADADA]/50 px-3 py-3 flex-shrink-0 w-32">
                            <span className="text-[#525252] text-[13px] font-medium leading-[140%] tracking-[-0.26px] whitespace-nowrap">
                              Assignee
                            </span>
                          </div>
                          <div className="flex items-center gap-2 border-b border-r border-[#DADADA]/50 px-3 py-3 flex-shrink-0 w-28">
                            <span className="text-[#525252] text-[13px] font-medium leading-[140%] tracking-[-0.26px] whitespace-nowrap">
                              Amount
                            </span>
                          </div>
                          <div className="flex items-center gap-2 border-b border-r border-[#DADADA]/50 px-3 py-3 flex-shrink-0 w-28">
                            <span className="text-[#525252] text-[13px] font-medium leading-[140%] tracking-[-0.26px] whitespace-nowrap">
                              Upcharge
                            </span>
                          </div>
                          <div className="flex items-center gap-2 border-b border-r border-[#DADADA]/50 px-3 py-3 flex-shrink-0 w-24">
                            <span className="text-[#525252] text-[13px] font-medium leading-[140%] tracking-[-0.26px] whitespace-nowrap">
                              Total
                            </span>
                          </div>
                          <div className="flex items-center gap-2 border-b px-3 py-3 w-16">
                            <span className="text-[#525252] text-[13px] font-medium leading-[140%] tracking-[-0.26px] whitespace-nowrap">
                              Actions
                            </span>
                          </div>
                        </div>

                        {/* Table Rows */}
                        {expenseRows.map((row) => (
                          <div key={row.id} className="flex items-center">
                            <div className="flex items-center border-b border-r px-3 min-h-14 py-2 flex-shrink-0 w-28">
                              <input
                                type="date"
                                value={row.date}
                                onChange={(e) =>
                                  updateExpenseRow(
                                    row.id,
                                    "date",
                                    e.target.value,
                                  )
                                }
                                className="w-full bg-transparent outline-none text-[13px] placeholder-[#A1A1A9]"
                              />
                            </div>
                            <div className="flex items-center border-b border-r px-3 min-h-14 py-2 flex-shrink-0 w-40">
                              <select
                                value={row.vendor}
                                onChange={(e) =>
                                  updateExpenseRow(
                                    row.id,
                                    "vendor",
                                    e.target.value,
                                  )
                                }
                                className="w-full bg-transparent outline-none text-[13px] placeholder-[#A1A1A9]"
                              >
                                <option value="">Select vendor...</option>
                                {mockVendors.map((v) => (
                                  <option key={v} value={v}>
                                    {v}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="flex items-center border-b border-r px-3 min-h-14 py-2 flex-1">
                              <input
                                type="text"
                                value={row.receiptNote}
                                onChange={(e) =>
                                  updateExpenseRow(
                                    row.id,
                                    "receiptNote",
                                    e.target.value,
                                  )
                                }
                                placeholder="Enter receipt note"
                                className="w-full bg-transparent outline-none text-[13px] placeholder-[#A1A1A9]"
                              />
                            </div>
                            <div className="flex items-center border-b border-r px-3 min-h-14 py-2 flex-shrink-0 w-32">
                              <select
                                value={row.assignee}
                                onChange={(e) =>
                                  updateExpenseRow(
                                    row.id,
                                    "assignee",
                                    e.target.value,
                                  )
                                }
                                className="w-full bg-transparent outline-none text-[13px] placeholder-[#A1A1A9]"
                              >
                                <option value="">Select assignee...</option>
                                {mockAssignees.map((a) => (
                                  <option key={a} value={a}>
                                    {a}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="flex items-center border-b border-r px-3 min-h-14 py-2 flex-shrink-0 w-28">
                              <input
                                type="text"
                                value={row.amount}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (
                                    val === "" ||
                                    /^\$?[\d,]*\.?\d{0,2}$/.test(val)
                                  ) {
                                    updateExpenseRow(row.id, "amount", val);
                                  }
                                }}
                                placeholder="$0"
                                className="w-full bg-transparent outline-none text-[13px] placeholder-[#A1A1A9]"
                              />
                            </div>
                            <div className="flex items-center border-b border-r px-3 min-h-14 py-2 flex-shrink-0 w-28">
                              <input
                                type="text"
                                value={row.upcharge}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (
                                    val === "" ||
                                    /^\$?[\d,]*\.?\d{0,2}$/.test(val)
                                  ) {
                                    updateExpenseRow(row.id, "upcharge", val);
                                  }
                                }}
                                placeholder="$0"
                                className="w-full bg-transparent outline-none text-[13px] placeholder-[#A1A1A9]"
                              />
                            </div>
                            <div className="flex items-center border-b border-r px-3 min-h-14 py-2 flex-shrink-0 w-24">
                              <span className="text-[#303030] font-600 text-[13px]">
                                $
                                {calculateTotal(
                                  row.amount,
                                  row.upcharge,
                                ).toFixed(2)}
                              </span>
                            </div>
                            <div className="flex items-center justify-center border-b px-3 min-h-14 py-2 w-16">
                              <button
                                onClick={() => deleteExpenseRow(row.id)}
                                className="text-[#525252] hover:text-[#303030] transition-colors"
                                title="Delete row"
                              >
                                <DeleteIcon
                                  width={16}
                                  height={16}
                                  color="currentColor"
                                />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Bar */}
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
              FTO Total:{" "}
              <span className="font-semibold">${grandTotal.toFixed(2)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleReject}
              className="rounded-lg flex min-h-9 px-3 py-1.5 items-center gap-2 text-white font-medium tracking-[-0.32px] leading-[1.4] transition-colors bg-red-600 hover:bg-red-700"
            >
              <span>Reject</span>
            </button>
            <button
              onClick={handleApprove}
              className="rounded-lg flex min-h-9 px-3 py-2 items-center gap-2 overflow-hidden font-medium transition-colors bg-[#013764] text-white hover:bg-[#014777]"
            >
              <span>Approve Field Team Order</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
