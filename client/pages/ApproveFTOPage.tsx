import { useState, useEffect, useRef, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { SelectField } from "@/components/forms/SelectField";
import { TextField } from "@/components/forms/TextField";
import { TextAreaField } from "@/components/forms/TextAreaField";
import { ComboboxFieldWithCustomInput } from "@/components/forms/ComboboxFieldWithCustomInput";
import { SelectFieldCell } from "@/components/forms/SelectFieldCell";
import { DateFieldCell } from "@/components/forms/DateFieldCell";
import { NumberFieldCell } from "@/components/forms/NumberFieldCell";
import { CurrencyFieldCell } from "@/components/forms/CurrencyFieldCell";
import { TextFieldCell } from "@/components/forms/TextFieldCell";
import { VendorFieldCell } from "@/components/forms/VendorFieldCell";
import { FieldCellShell } from "@/components/forms/FieldCellShell";
import { Checkbox } from "@/components/ui/checkbox";
import { DeleteIcon, EyeIcon } from "@/components/icons";
import BlueButton from "@/components/BlueButton";
import PdfViewerModal from "@/components/PdfViewerModal";
import { usePdfViewer } from "@/hooks/usePdfViewer";

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
  ftoName?: string;
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
  const pdfViewer = usePdfViewer();

  const [ftoName, setFtoName] = useState(state.ftoName || "");
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

  const [uploadedFiles, setUploadedFiles] = useState<
    Array<{ name: string; size: number; file: File }>
  >([]);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);


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
      ftoName,
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

  const handleViewFile = (file: { name: string; file: File }) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      pdfViewer.openPdf(dataUrl, file.name);
    };
    reader.readAsDataURL(file.file);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  // Helper to check if a cell is required but empty
  const isHoursCellInvalid = (row: HourRow, field: keyof HourRow) => {
    const requiredFields = ['date', 'hours', 'assignee', 'amount'];
    if (!requiredFields.includes(field)) return false;

    const value = row[field];
    if (field === 'amount') {
      return value === '$0' || !value;
    }
    return !(value && String(value).trim());
  };

  const isExpensesCellInvalid = (row: ExpenseRow, field: keyof ExpenseRow) => {
    const requiredFields = ['date', 'vendor', 'amount'];
    if (!requiredFields.includes(field)) return false;

    const value = row[field];
    if (field === 'amount') {
      return value === '$0' || !value;
    }
    return !(value && String(value).trim());
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
      {/* Main Content Area - Grid Layout */}
      <div
        style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          alignItems: "stretch",
          minHeight: 0,
          gap: 0,
        }}
      >
        {/* Left Column - File Upload/Viewer */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            padding: "24px 32px",
            borderRight: "1px solid #E5E7EB",
            height: "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
            }}
          >
            {/* File Upload Section */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                flex: 1,
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
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    flex: 1,
                    paddingTop: "24px",
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
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                      marginBottom: "24px",
                    }}
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
                            onClick={() => handleViewFile(file)}
                            className="text-[#A1A1A9] hover:text-[#303030] transition-colors flex-shrink-0"
                            title="View file"
                          >
                            <EyeIcon width={16} height={16} color="currentColor" />
                          </button>
                          <button
                            onClick={() => handleRemoveFile(index)}
                            className="text-[#A1A1A9] hover:text-[#303030] transition-colors flex-shrink-0"
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
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-blue-600 hover:underline text-sm font-medium text-center"
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

        {/* Right Column (scroll container) */}
        <div
          style={{
            height: "100%",
            minHeight: 0,
            overflowY: "auto",
            overflowX: "auto",
            padding: "24px 32px",
          }}
        >
          <div style={{ minWidth: "fit-content" }}>
              {/* FTO Details Section */}
              <div style={{ display: "flex", flexDirection: "column" }}>
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
                  style={{
                    marginTop: "12px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "20px",
                    width: "600px",
                  }}
                >
                  {/* FTO Name */}
                  <div>
                    <TextField
                      label="FTO Name"
                      value={ftoName}
                      onChange={() => {}}
                      disabled={true}
                    />
                  </div>

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

                  {/* Associated Task Row - Commented Out */}
                  {/* <div className="flex gap-5">
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
                  </div> */}

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
                <div style={{ marginTop: "60px" }}>
                  {/* Header */}
                  <div className="flex flex-col gap-5">
                    <div className="flex flex-col text-xl text-[#303030] font-semibold leading-[26px]">
                      <div className="font-semibold">Hours</div>
                      <div
                        className="h-px bg-gray-200 mt-5"
                        style={{ width: "790px" }}
                      />
                    </div>
                  </div>

                  {/* Hours Table */}
                  <div
                    className="flex w-full flex-col rounded-xl shadow-[0_1px_2px_0_rgba(10,13,18,0.05)] mb-6"
                    style={{ minWidth: "fit-content" }}
                  >
                    <div className="flex flex-col border border-[#DADADA]/50 shadow-[0_1px_2px_0_rgba(10,13,18,0.05)] bg-white">
                      {/* Table Header */}
                      <div className="flex items-center">
                        <div
                          className="flex items-center gap-2 border-b border-r border-[#DADADA]/50 px-3 py-3 flex-shrink-0"
                          style={{ width: "120px" }}
                        >
                          <span className="text-[#525252] text-[13px] font-medium leading-[140%] tracking-[-0.26px] whitespace-nowrap">
                            Date <span className="text-red-600">*</span>
                          </span>
                        </div>
                        <div
                          className="flex items-center gap-2 border-b border-r border-[#DADADA]/50 px-3 py-3 flex-shrink-0"
                          style={{ width: "100px" }}
                        >
                          <span className="text-[#525252] text-[13px] font-medium leading-[140%] tracking-[-0.26px] whitespace-nowrap">
                            Hours <span className="text-red-600">*</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-2 border-b border-r border-[#DADADA]/50 px-3 py-3 flex-1">
                          <span className="text-[#525252] text-[13px] font-medium leading-[140%] tracking-[-0.26px] whitespace-nowrap">
                            Note
                          </span>
                        </div>
                        <div
                          className="flex items-center gap-2 border-b border-r border-[#DADADA]/50 px-3 py-3 flex-shrink-0"
                          style={{ width: "140px" }}
                        >
                          <span className="text-[#525252] text-[13px] font-medium leading-[140%] tracking-[-0.26px] whitespace-nowrap">
                            Assignee <span className="text-red-600">*</span>
                          </span>
                        </div>
                        <div
                          className="flex items-center gap-2 border-b border-r border-[#DADADA]/50 px-3 py-3 flex-shrink-0"
                          style={{ width: "80px" }}
                        >
                          <span className="text-[#525252] text-[13px] font-medium leading-[140%] tracking-[-0.26px] whitespace-nowrap">
                            NoFee?
                          </span>
                        </div>
                        <div
                          className="flex items-center gap-2 border-b border-r border-[#DADADA]/50 px-3 py-3 flex-shrink-0"
                          style={{ width: "100px" }}
                        >
                          <span className="text-[#525252] text-[13px] font-medium leading-[140%] tracking-[-0.26px] whitespace-nowrap">
                            Emergency
                          </span>
                        </div>
                        <div
                          className="flex items-center gap-2 border-b border-r border-[#DADADA]/50 px-3 py-3 flex-shrink-0"
                          style={{ width: "120px" }}
                        >
                          <span className="text-[#525252] text-[13px] font-medium leading-[140%] tracking-[-0.26px] whitespace-nowrap">
                            Amount <span className="text-red-600">*</span>
                          </span>
                        </div>
                        <div
                          className="flex items-center gap-2 border-b border-r border-[#DADADA]/50 px-3 py-3 flex-shrink-0"
                          style={{ width: "120px" }}
                        >
                          <span className="text-[#525252] text-[13px] font-medium leading-[140%] tracking-[-0.26px] whitespace-nowrap">
                            Upcharge
                          </span>
                        </div>
                        <div
                          className="flex items-center gap-2 border-b border-r border-[#DADADA]/50 px-3 py-3 flex-shrink-0"
                          style={{ width: "100px" }}
                        >
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
                        <div key={row.id} className="flex items-start">
                          {/* Date Cell */}
                          <div
                            className="flex items-center px-3 min-h-14 py-2 flex-shrink-0"
                            style={{
                              width: "120px",
                              border: isHoursCellInvalid(row, 'date') ? '2px solid #dc2626' : '1px solid #DADADA',
                            }}
                          >
                            <DateFieldCell
                              value={row.date}
                              onChange={(value) =>
                                updateHourRow(row.id, "date", value)
                              }
                            />
                          </div>

                          {/* Hours Cell - 1 decimal */}
                          <div
                            className="flex items-center px-3 min-h-14 py-2 flex-shrink-0"
                            style={{
                              width: "100px",
                              border: isHoursCellInvalid(row, 'hours') ? '2px solid #dc2626' : '1px solid #DADADA',
                            }}
                          >
                            <NumberFieldCell
                              value={row.hours}
                              onChange={(value) =>
                                updateHourRow(row.id, "hours", value)
                              }
                              placeholder="0"
                              decimals={1}
                            />
                          </div>

                          {/* Note Cell */}
                          <div className="flex items-start border-b border-r px-3 min-h-14 py-2 flex-1">
                            <div
                              style={{
                                width: "100%",
                                wordWrap: "break-word",
                                whiteSpace: "normal",
                                overflowWrap: "break-word",
                              }}
                            >
                              <TextFieldCell
                                value={row.note}
                                onChange={(value) =>
                                  updateHourRow(row.id, "note", value)
                                }
                                placeholder="Enter note"
                              />
                            </div>
                          </div>

                          {/* Assignee Cell */}
                          <div
                            className="flex items-center px-3 min-h-14 py-2 flex-shrink-0"
                            style={{
                              width: "140px",
                              minWidth: "140px",
                              border: isHoursCellInvalid(row, 'assignee') ? '2px solid #dc2626' : '1px solid #DADADA',
                            }}
                          >
                            <SelectFieldCell
                              value={row.assignee}
                              onChange={(value) =>
                                updateHourRow(row.id, "assignee", value)
                              }
                              placeholder="Select assignee..."
                              options={mockAssignees.map((a) => ({
                                value: a,
                                label: a,
                              }))}
                            />
                          </div>

                          {/* NoFee Cell - Checkbox */}
                          <div
                            className="flex items-center justify-center border-b border-r px-3 min-h-14 py-2 flex-shrink-0"
                            style={{ width: "80px" }}
                          >
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

                          {/* Emergency Cell - Checkbox */}
                          <div
                            className="flex items-center justify-center border-b border-r px-3 min-h-14 py-2 flex-shrink-0"
                            style={{ width: "100px" }}
                          >
                            <Checkbox
                              checked={row.emergency}
                              onCheckedChange={(checked) =>
                                updateHourRow(row.id, "emergency", checked)
                              }
                              className="w-[14px] h-[14px]"
                            />
                          </div>

                          {/* Amount Cell - Currency */}
                          <div
                            className="flex items-center px-3 min-h-14 py-2 flex-shrink-0"
                            style={{
                              width: "120px",
                              minWidth: "120px",
                              border: isHoursCellInvalid(row, 'amount') ? '2px solid #dc2626' : '1px solid #DADADA',
                            }}
                          >
                            <CurrencyFieldCell
                              value={row.amount}
                              onChange={(value) =>
                                updateHourRow(row.id, "amount", value)
                              }
                              disabled={row.noFee}
                              placeholder="$0"
                            />
                          </div>

                          {/* Upcharge Cell - Currency */}
                          <div
                            className="flex items-center border-b border-r px-3 min-h-14 py-2 flex-shrink-0"
                            style={{ width: "120px", minWidth: "120px" }}
                          >
                            <CurrencyFieldCell
                              value={row.upcharge}
                              onChange={(value) =>
                                updateHourRow(row.id, "upcharge", value)
                              }
                              disabled={row.noFee}
                              placeholder="$0"
                            />
                          </div>

                          {/* Total Cell - Display only */}
                          <div
                            className="flex items-center border-b border-r px-3 min-h-14 py-2 flex-shrink-0"
                            style={{ width: "100px" }}
                          >
                            <span className="text-[#303030] font-600 text-[13px]">
                              $
                              {calculateTotal(
                                row.amount,
                                row.upcharge,
                              ).toFixed(2)}
                            </span>
                          </div>

                          {/* Actions Cell */}
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

                  {/* Add Hours Button */}
                  <button
                    onClick={addHourRow}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium whitespace-nowrap mb-12"
                  >
                    + Add Hours
                  </button>
                </div>

                {/* Expenses Section */}
                <div style={{ marginTop: "60px" }}>
                  {/* Header */}
                  <div className="flex flex-col gap-5">
                    <div className="flex flex-col text-xl text-[#303030] font-semibold leading-[26px]">
                      <div className="font-semibold">Expenses</div>
                      <div
                        className="h-px bg-gray-200 mt-5"
                        style={{ width: "790px" }}
                      />
                    </div>
                  </div>

                  {/* Expenses Table */}
                  <div
                    className="flex w-full flex-col rounded-xl shadow-[0_1px_2px_0_rgba(10,13,18,0.05)] mb-6"
                    style={{ minWidth: "fit-content" }}
                  >
                    <div className="flex flex-col border border-[#DADADA]/50 shadow-[0_1px_2px_0_rgba(10,13,18,0.05)] bg-white">
                      {/* Table Header */}
                      <div className="flex items-center">
                        <div
                          className="flex items-center gap-2 border-b border-r border-[#DADADA]/50 px-3 py-3 flex-shrink-0"
                          style={{ width: "120px" }}
                        >
                          <span className="text-[#525252] text-[13px] font-medium leading-[140%] tracking-[-0.26px] whitespace-nowrap">
                            Date <span className="text-red-600">*</span>
                          </span>
                        </div>
                        <div
                          className="flex items-center gap-2 border-b border-r border-[#DADADA]/50 px-3 py-3 flex-shrink-0"
                          style={{ width: "150px" }}
                        >
                          <span className="text-[#525252] text-[13px] font-medium leading-[140%] tracking-[-0.26px] whitespace-nowrap">
                            Vendor <span className="text-red-600">*</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-2 border-b border-r border-[#DADADA]/50 px-3 py-3 flex-1">
                          <span className="text-[#525252] text-[13px] font-medium leading-[140%] tracking-[-0.26px] whitespace-nowrap">
                            Receipt Note
                          </span>
                        </div>
                        <div
                          className="flex items-center gap-2 border-b border-r border-[#DADADA]/50 px-3 py-3 flex-shrink-0"
                          style={{ width: "140px" }}
                        >
                          <span className="text-[#525252] text-[13px] font-medium leading-[140%] tracking-[-0.26px] whitespace-nowrap">
                            Assignee
                          </span>
                        </div>
                        <div
                          className="flex items-center gap-2 border-b border-r border-[#DADADA]/50 px-3 py-3 flex-shrink-0"
                          style={{ width: "120px" }}
                        >
                          <span className="text-[#525252] text-[13px] font-medium leading-[140%] tracking-[-0.26px] whitespace-nowrap">
                            Amount <span className="text-red-600">*</span>
                          </span>
                        </div>
                        <div
                          className="flex items-center gap-2 border-b border-r border-[#DADADA]/50 px-3 py-3 flex-shrink-0"
                          style={{ width: "120px" }}
                        >
                          <span className="text-[#525252] text-[13px] font-medium leading-[140%] tracking-[-0.26px] whitespace-nowrap">
                            Upcharge
                          </span>
                        </div>
                        <div
                          className="flex items-center gap-2 border-b border-r border-[#DADADA]/50 px-3 py-3 flex-shrink-0"
                          style={{ width: "100px" }}
                        >
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
                        <div key={row.id} className="flex items-start">
                          {/* Date Cell */}
                          <div
                            className="flex items-center px-3 min-h-14 py-2 flex-shrink-0"
                            style={{
                              width: "120px",
                              border: isExpensesCellInvalid(row, 'date') ? '2px solid #dc2626' : '1px solid #DADADA',
                            }}
                          >
                            <DateFieldCell
                              value={row.date}
                              onChange={(value) =>
                                updateExpenseRow(row.id, "date", value)
                              }
                            />
                          </div>

                          {/* Vendor Cell - VendorFieldCell */}
                          <div
                            className="flex items-center px-3 min-h-14 py-2 flex-shrink-0"
                            style={{
                              width: "150px",
                              minWidth: "150px",
                              border: isExpensesCellInvalid(row, 'vendor') ? '2px solid #dc2626' : '1px solid #DADADA',
                            }}
                          >
                            <VendorFieldCell
                              value={row.vendor}
                              onChange={(value) =>
                                updateExpenseRow(row.id, "vendor", value)
                              }
                              placeholder="Select or type vendor..."
                              options={mockVendors.map((v) => ({
                                value: v,
                                label: v,
                              }))}
                            />
                          </div>

                          {/* Receipt Note Cell */}
                          <div className="flex items-start border-b border-r px-3 min-h-14 py-2 flex-1">
                            <div
                              style={{
                                width: "100%",
                                wordWrap: "break-word",
                                whiteSpace: "normal",
                                overflowWrap: "break-word",
                              }}
                            >
                              <TextFieldCell
                                value={row.receiptNote}
                                onChange={(value) =>
                                  updateExpenseRow(row.id, "receiptNote", value)
                                }
                                placeholder="Enter receipt note"
                              />
                            </div>
                          </div>

                          {/* Assignee Cell */}
                          <div
                            className="flex items-center border-b border-r px-3 min-h-14 py-2 flex-shrink-0"
                            style={{ width: "140px", minWidth: "140px" }}
                          >
                            <SelectFieldCell
                              value={row.assignee}
                              onChange={(value) =>
                                updateExpenseRow(row.id, "assignee", value)
                              }
                              placeholder="Select assignee..."
                              options={mockAssignees.map((a) => ({
                                value: a,
                                label: a,
                              }))}
                            />
                          </div>

                          {/* Amount Cell - Currency */}
                          <div
                            className="flex items-center px-3 min-h-14 py-2 flex-shrink-0"
                            style={{
                              width: "120px",
                              minWidth: "120px",
                              border: isExpensesCellInvalid(row, 'amount') ? '2px solid #dc2626' : '1px solid #DADADA',
                            }}
                          >
                            <CurrencyFieldCell
                              value={row.amount}
                              onChange={(value) =>
                                updateExpenseRow(row.id, "amount", value)
                              }
                              placeholder="$0"
                            />
                          </div>

                          {/* Upcharge Cell - Currency */}
                          <div
                            className="flex items-center border-b border-r px-3 min-h-14 py-2 flex-shrink-0"
                            style={{ width: "120px", minWidth: "120px" }}
                          >
                            <CurrencyFieldCell
                              value={row.upcharge}
                              onChange={(value) =>
                                updateExpenseRow(row.id, "upcharge", value)
                              }
                              placeholder="$0"
                            />
                          </div>

                          {/* Total Cell - Display only */}
                          <div
                            className="flex items-center border-b border-r px-3 min-h-14 py-2 flex-shrink-0"
                            style={{ width: "100px" }}
                          >
                            <span className="text-[#303030] font-600 text-[13px]">
                              $
                              {calculateTotal(
                                row.amount,
                                row.upcharge,
                              ).toFixed(2)}
                            </span>
                          </div>

                          {/* Actions Cell */}
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

                  {/* Add Expenses Button */}
                  <button
                    onClick={addExpenseRow}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium whitespace-nowrap"
                  >
                    + Add Expenses
                  </button>
                </div>
              </div>
          </div>
        </div>
      </div>

      {/* Sticky Footer */}
      <div
        style={{
          position: "sticky",
          bottom: 0,
          background: "white",
          padding: "16px 32px",
          zIndex: 10,
          borderTop: "1.33333px solid #d2d1cf",
          boxShadow: "rgba(0, 0, 0, 0.05) 0px -2px 8px 0px",
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex flex-col text-xl text-[#303030] font-semibold leading-[1.3]">
            <div>
              FTO Total:{" "}
              <span className="font-semibold">
                ${grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleReject}
              className="rounded-lg flex min-h-9 px-3 py-1.5 items-center gap-2 text-white font-medium tracking-[-0.32px] leading-[1.4] transition-colors bg-red-600 hover:bg-red-700"
            >
              <span>Reject</span>
            </button>
            <BlueButton
              onClick={handleApprove}
            >
              Approve Field Team Order
            </BlueButton>
          </div>
        </div>
      </div>

      {/* PDF Viewer Modal */}
      <PdfViewerModal
        open={pdfViewer.isOpen}
        onOpenChange={(open) => {
          if (!open) pdfViewer.closePdf();
        }}
        url={pdfViewer.url}
        title={pdfViewer.title}
      />
    </div>
  );
}
