import { useState, useEffect, useRef, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { SelectField } from "@/components/forms/SelectField";
import { TextField } from "@/components/forms/TextField";
import { TextAreaField } from "@/components/forms/TextAreaField";
import { DateField } from "@/components/forms/DateField";
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
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { useParams } from "react-router-dom";
import { fetchJSON } from "@/api/fetchJSON";
import { cn } from "@/lib/utils";

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
  assigneeId: number;
}

interface ExpenseRow {
  id: string;
  date: string;
  vendor: string;
  receiptNote: string;
  avmExpense: boolean;
  chargeType: "personal" | "avm" | "client";
  amount: string;
  upcharge: string;
  assignee: string;
  assigneeId: number;
  submissionId: number;
  materialIndex: number;
  attachmentIds: number[];
}

interface ApproveFTOPageProps {
  ftoName?: string;
  property?: string;
  unit?: string;
  fieldTeamAssignee?: string;
  task?: string;
  description?: string;
  dueDate?: string;
  priority?: string;
}

interface ExpenseLine {
  date_of_work: string;
  vendor_name: string;
  note?: string;
  is_avm_expense: boolean;
  amount_cents: number;
  upcharge_cents?: number;
  expense_type?: "personal-expense" | "avm-expense" | "client-expense";
}


interface BackendSubmission {
  ID: number;
  FTOID: number;
  FieldTeamMemberID: number;
  MaterialsJSON: string | null;
  HoursJSON: {
    date_of_work: string;
    hours_decimal: number;
    note?: string;
    no_charge: boolean;
    emergency: boolean;
    amount_cents?: number;
    upcharge_cents?: number;
  }[] | null;
}

interface Attachment {
  id: number;
  file_name: string;
  storage_path: string;
}

interface AttachmentSummary {
  id: number;
  file_name: string;
  submission_id: number;
  material_index: number;
}


const fetchAttachmentsForExpense = async (
  submissionId: number,
  materialIndex: number,
): Promise<Attachment[]> => {
  const res = await fetch(
    `/api/maintenance/attachments?submission_id=${submissionId}&material_index=${materialIndex}`,
    // `http://localhost:8080/maintenance/attachments?submission_id=${submissionId}&material_index=${materialIndex}`,
    {
      headers: { Accept: "application/json" },
    },
  );

  if (!res.ok) {
    throw new Error("Failed to load attachments");
  }

  return res.json();
};

const fetchAttachmentsByFto = async (ftoId: number): Promise<AttachmentSummary[]> => {
  const res = await fetch(
    `/api/maintenance/attachments/by-fto?fto_id=${ftoId}`,
    // `http://localhost:8080/maintenance/attachments/by-fto?fto_id=${ftoId}`,
    { headers: { Accept: "application/json" } }
  );

  if (!res.ok) throw new Error("Failed to load attachments (by fto)");

  const raw = await res.json();

  // Handle null or non-array responses (e.g., when there are no materials/attachments)
  if (!raw || !Array.isArray(raw)) {
    return [];
  }

  return raw.map((a: any) => ({
    id: a.ID,
    file_name: a.FileName,
    submission_id: a.SubmissionID,
    material_index: a.MaterialIndex,
  }));
};


const fetchSubmissionsByFto = async (ftoId: number): Promise<BackendSubmission[]> => {
  const res = await fetch(
    `/api/maintenance/submissions/by-fto?fto_id=${ftoId}`,
    // `http://localhost:8080/maintenance/submissions/by-fto?fto_id=${ftoId}`,
    {
      headers: { Accept: "application/json" },
    },
  );

  // Treat "not found" as "no submissions yet" so the UI can show
  // a friendly empty state instead of logging an error.
  if (res.status === 404) {
    return [];
  }

  if (!res.ok) {
    throw new Error("Failed to fetch submissions");
  }

  return res.json();
};


const parseMoneyToCents = (value: string): number => {
  const num = parseFloat(value.replace(/[^0-9.-]+/g, ""));
  return isNaN(num) ? 0 : Math.round(num * 100);
};

const buildHoursJSON = (hourRows: HourRow[]) => {
  return hourRows.map((row, index) => {
    const upchargeCents = parseMoneyToCents(row.upcharge);
    const out: Record<string, unknown> = {
      date_of_work: row.date,
      hours_decimal: parseFloat(row.hours) || 0,
      note: row.note || "",
      no_charge: row.noFee,
      emergency: row.emergency,
      hour_index: index,
    };
    if (upchargeCents !== 0) out.upcharge_cents = upchargeCents;
    return out;
  });
};

const buildMaterialsJSON = (expenseRows: ExpenseRow[]) => {
  return expenseRows.map((row, index) => {
    const upchargeCents = parseMoneyToCents(row.upcharge);
    const out: Record<string, unknown> = {
      date_of_work: row.date,
      vendor_name: row.vendor,
      note: row.receiptNote || "",
      is_avm_expense: row.chargeType === "avm",
      amount_cents: parseMoneyToCents(row.amount),
      material_index: row.materialIndex,
    };
    if (upchargeCents !== 0) out.upcharge_cents = upchargeCents;
    return out;
  });
};


const buildAttachmentIndex = (
  list: AttachmentSummary[],
): Record<string, number[]> => {
  const map: Record<string, number[]> = {};

  for (const att of list) {
    const key = `${att.submission_id}-${att.material_index}`;
    if (!map[key]) map[key] = [];
    map[key].push(att.id);
  }

  return map;
};


const patchSubmission = async (
  submissionId: number,
  payload: {
    hours_json?: any[];
    materials_json?: any[];
  }
) => {
  // Debugging logs removed

  const res = await fetch(
    `/api/maintenance/submissions/${submissionId}`,
    // `http://localhost:8080/maintenance/submissions/${submissionId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to patch submission");
  }
};


/**
 * Create a new submission for a specific assignee (field team member)
 */
const createSubmissionForAssignee = async (
  ftoId: number,
  techId: number,
  hoursJSON: any[],
  materialsJSON: any[]
): Promise<number> => {
  // Debugging logs removed
  console.groupEnd();

  // Helper to convert date string (YYYY-MM-DD) to ISO format
  const toISODate = (dateStr: string): string => {
    return new Date(dateStr).toISOString();
  };

  // Build hour entries for the request
  const hourEntries = hoursJSON.map((h) => ({
    fto_id: ftoId,
    date_of_work: toISODate(h.date_of_work),
    hours_decimal: h.hours_decimal,
    note: h.note || "",
    no_charge: h.no_charge || false,
    emergency: h.emergency || false,
  }));

  // Build expense entries for the request
  const expenseEntries = materialsJSON.map((m) => ({
    fto_id: ftoId,
    date_of_work: toISODate(m.date_of_work),
    amount: (m.amount_cents || 0) / 100,
    is_avm_expense: m.is_avm_expense || false,
    note: m.note || "",
    vendor_name: m.vendor_name || "",
    attachments: [],
  }));

  const res = await fetch(
    // `http://localhost:8080/maintenance/ftos/${ftoId}/submissions`,
    `/api/maintenance/ftos/${ftoId}/submissions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        tech_id: techId,
        hours: hourEntries,
        expenses: expenseEntries,
      }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to create submission");
  }

  const data = await res.json();
  return data.submission_id;
};


const extractSubmissionIds = (rows: { id: string }[]): number[] => {
  const ids = new Set<number>();

  rows.forEach((r) => {
    const parts = r.id.split("-");
    if (parts.length >= 3) {
      const maybeId = Number(parts[1]);
      if (!isNaN(maybeId)) {
        ids.add(maybeId);
      }
    }
  });

  return Array.from(ids);
};


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


const formatVendorName = (raw: string): string => {
  if (!raw) return "";

  return raw
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

/** Map backend is_avm_expense to UI chargeType. false → client, true → avm. */
const isAvmExpenseToChargeType = (isAvm: boolean): "avm" | "client" =>
  isAvm ? "avm" : "client";


// const parseDueDate = (dateStr: string | undefined): Date | null => {
//   if (!dateStr) return null;

//   let date: Date | null = null;

//   // Try parsing as standard Date first
//   const parsedDate = new Date(dateStr);
//   if (!isNaN(parsedDate.getTime())) {
//     date = parsedDate;
//   } else if (typeof dateStr === "string") {
//     // Try parsing format like "Dec 10, 2025"
//     try {
//       const parts = dateStr.split(" ");
//       if (parts.length >= 2) {
//         const monthStr = parts[0];
//         const dayStr = parts[1].replace(",", "");
//         const yearStr = parts[2];
//         const parsedFromFormat = new Date(`${monthStr} ${dayStr}, ${yearStr}`);
//         if (!isNaN(parsedFromFormat.getTime())) {
//           date = parsedFromFormat;
//         }
//       }
//     } catch (e) {
//       // Fallback: date remains null
//     }
//   }

//   return date;
// };

const parseDueDate = (dateStr: string | undefined): Date | null => {
  if (!dateStr) return null;

  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
};

const approveSubmission = async (submissionId: number) => {
  const res = await fetch(
    // `http://localhost:8080/maintenance/submissions/${submissionId}/approve`,
    `/api/maintenance/submissions/${submissionId}/approve`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
      },
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to approve submission");
  }
};

const rejectSubmission = async (submissionId: number) => {
  const res = await fetch(
    // `http://localhost:8080/maintenance/submissions/${submissionId}/reject`,
    `/api/maintenance/submissions/${submissionId}/reject`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
      },
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to reject submission");
  }
};

const updateFtoAmountCents = async (ftoId: number, amountCents: number) => {
  const res = await fetch(
    // `http://localhost:8080/maintenance/ftos/${ftoId}`,
    `/api/maintenance/ftos/${ftoId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ amount_cents: amountCents }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to update FTO amount");
  }
};


export default function ApproveFTOPage() {
  const navigate = useNavigate();
  const location = useLocation();
  // const { id } = useParams<{ id?: string }>();
  const state = (location.state || {}) as ApproveFTOPageProps;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfViewer = usePdfViewer();

  // const ftoId = id ? Number(id) : null;

  const { ftoId } = useParams<{ ftoId?: string }>();
  const ftoIdNum = ftoId ? Number(ftoId) : null;
  // FTO Details - populated from props or state
  const [ftoName, setFtoName] = useState(state.ftoName || "");
  const [property, setProperty] = useState(state.property || "");
  const [unit, setUnit] = useState(state.unit || "");
  const [fieldTeamAssignee, setFieldTeamAssignee] = useState(
    state.fieldTeamAssignee || "",
  );
  const [task, setTask] = useState(state.task || "");
  const [description, setDescription] = useState(state.description || "");
  const [dueDate, setDueDate] = useState<Date | null>(parseDueDate(state.dueDate));
  const [priority, setPriority] = useState(state.priority || "normal");

  // Table rows - will be populated from mock API
  const [hourRows, setHourRows] = useState<HourRow[]>([]);
  const [expenseRows, setExpenseRows] = useState<ExpenseRow[]>([]);

  const [uploadedFiles, setUploadedFiles] = useState<
    Array<{ name: string; size: number; file: File }>
  >([]);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(false); // Default: PDF viewer collapsed
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(true);
  const [assigneeById, setAssigneeById] = useState<Record<number, string>>({});
  const [hasNoSubmissions, setHasNoSubmissions] = useState(false);
  const [rateError, setRateError] = useState<string | null>(null);
  // const [attachmentsByKey, setAttachmentsByKey] = useState<Record<string, AttachmentSummary[]>>({});
  
  // Track submissions by assignee ID so we know which assignees already have submissions
  const [submissionByAssignee, setSubmissionByAssignee] = useState<Record<number, number>>({});



  // const makeAttachmentKey = (submissionId: number, materialIndex: number) =>
  //   `${submissionId}-${materialIndex}`;

  useEffect(() => {
    async function loadAssignees() {
      try {
        const data = await fetchJSON("/users/all");
  
        const map: Record<number, string> = {};
        data.forEach((u: any) => {
          map[Number(u.id)] = u.name || u.email;
        });
  
        setAssigneeById(map);
      } catch (err) {
        console.error("Failed to load users for assignee dropdown:", err);
      }
    }
  
    loadAssignees();
  }, []);

  const assigneeOptions = useMemo(
    () =>
      Object.entries(assigneeById).map(([id, name]) => ({
        value: Number(id),
        label: name,
      })),
    [assigneeById]
  );
  
  /**
   * Load FTO details from API when ftoId is available
   */
  useEffect(() => {
    const loadFTODetails = async () => {
      if (!ftoIdNum) return;

      try {
        const res = await fetch(
          // `http://localhost:8080/maintenance/ftos/${ftoIdNum}`,
          `/api/maintenance/ftos/${ftoIdNum}`,
          {
            headers: { Accept: "application/json" },
          }
        );

        if (!res.ok) {
          console.error("Failed to load FTO details");
          return;
        }

        const fto = await res.json();
        
        // Update FTO details from API response
        if (fto.name) setFtoName(fto.name);
        if (fto.property_name || fto.property_address) {
          setProperty(fto.property_name || fto.property_address || "");
        }
        if (fto.unit_name) setUnit(fto.unit_name);
        if (fto.description) setDescription(fto.description);
        if (fto.due_date) {
          const parsedDate = parseDueDate(fto.due_date);
          if (parsedDate) setDueDate(parsedDate);
        }
        if (fto.priority) {
          setPriority(fto.priority.toLowerCase());
        }
      } catch (err) {
        console.error("Error loading FTO details:", err);
      }
    };

    loadFTODetails();
  }, [ftoIdNum]);
  
  /**
   * Load submissions from mock API and populate hours/expenses tables
   */
  useEffect(() => {
    const loadSubmissions = async () => {
      try {
        setIsLoadingSubmissions(true);
        setRateError(null); // Clear any previous rate errors
        const submissions = await fetchSubmissionsByFto(ftoIdNum);
        // 🚨 HANDLE null / empty explicitly
        if (!submissions || !Array.isArray(submissions) || submissions.length === 0) {
          setHasNoSubmissions(true);
          setHourRows([]);
          setExpenseRows([]);
          setIsLoadingSubmissions(false);
          return;
        }

        // otherwise, submissions exist
        setHasNoSubmissions(false);
                
        const attachments = await fetchAttachmentsByFto(ftoIdNum);
        const attachmentIndex = buildAttachmentIndex(attachments);

        // Flatten all hour lines from all submissions into HourRow[]
        const allHourLines: HourRow[] = [];
        const allExpenseLines: ExpenseRow[] = [];

        submissions.forEach((submission) => {
          // Map HoursJSON to HourRow[]
          if (submission.HoursJSON) {
            submission.HoursJSON.forEach((hourLine, index) => {
              const upchargeCents = hourLine.upcharge_cents ?? 0;
              allHourLines.push({
                id: `hour-${submission.ID}-${index}`,
                date: formatDate(new Date(hourLine.date_of_work)),
                hours: hourLine.hours_decimal.toString(),
                note: hourLine.note || "",
                noFee: hourLine.no_charge,
                emergency: hourLine.emergency,
                amount: `$${((hourLine.amount_cents ?? 0) / 100).toFixed(2)}`,
                upcharge: upchargeCents !== 0 ? `$${(upchargeCents / 100).toFixed(2)}` : "$0.00",
                assignee: assigneeById[submission.FieldTeamMemberID] || "",
                assigneeId: submission.FieldTeamMemberID,
              });
            });
          }

          // Decode MaterialsJSON and map to ExpenseRow[]
          if (submission.MaterialsJSON) {
            try {
              const decodedJson = atob(submission.MaterialsJSON);
              const expenses: ExpenseLine[] = JSON.parse(decodedJson);

              // Handle null or non-array expenses (e.g., when materials are empty)
              if (expenses && Array.isArray(expenses)) {
                expenses.forEach((expense, index) => {
                  const key = `${submission.ID}-${index}`;
                  const upchargeCents = expense.upcharge_cents ?? 0;
                  allExpenseLines.push({
                    id: `expense-${submission.ID}-${index}`,
                    submissionId: submission.ID,
                    materialIndex: index,

                    attachmentIds: attachmentIndex[key] ?? [],

                    date: formatDate(new Date(expense.date_of_work)),
                    vendor: formatVendorName(expense.vendor_name),
                    receiptNote: expense.note || "",
                    avmExpense: expense.is_avm_expense,
                    chargeType: isAvmExpenseToChargeType(expense.is_avm_expense ?? false),
                    amount: `$${((expense.amount_cents ?? 0) / 100).toFixed(2)}`,
                    upcharge: upchargeCents !== 0 ? `$${(upchargeCents / 100).toFixed(2)}` : "$0.00",
                    assignee: assigneeById[submission.FieldTeamMemberID] || "",
                    assigneeId: submission.FieldTeamMemberID,
                  });
                });
              }
              
            } catch (e) {
              console.warn("Failed to decode MaterialsJSON:", e);
            }
          }
        });

        // Build mapping of assigneeId -> submissionId for existing submissions
        const assigneeToSubmission: Record<number, number> = {};
        submissions.forEach((submission) => {
          assigneeToSubmission[submission.FieldTeamMemberID] = submission.ID;
        });
        setSubmissionByAssignee(assigneeToSubmission);

        setHourRows(allHourLines);
        setExpenseRows(allExpenseLines);
      } catch (error) {
        console.error("Failed to load submissions:", error);
        
        // Check if error is related to missing rates
        const errorMessage = error instanceof Error ? error.message : String(error);
        const lowerError = errorMessage.toLowerCase();
        
        if (lowerError.includes("emergency") && lowerError.includes("rate")) {
          setRateError("emergency");
        } else if (lowerError.includes("hourly") && lowerError.includes("rate")) {
          setRateError("hourly");
        } else if (lowerError.includes("scan") && (lowerError.includes("null") || lowerError.includes("emergency") || lowerError.includes("hourly"))) {
          // Generic scan error - try to determine which rate
          if (lowerError.includes("emergency")) {
            setRateError("emergency");
          } else {
            setRateError("hourly");
          }
        }
        
        setHourRows([]);
        setExpenseRows([]);
      } finally {
        setIsLoadingSubmissions(false);
      }
    };

    loadSubmissions();
  }, [ftoId]);

  // useEffect(() => {
  //   const loadAttachments = async () => {
  //     if (!ftoIdNum) return;
  
  //     try {
  //       const list = await fetchAttachmentsByFto(ftoIdNum);
  
  //       const map: Record<string, AttachmentSummary[]> = {};
  //       for (const att of list) {
  //         const key = makeAttachmentKey(att.submission_id, att.material_index);
  //         if (!map[key]) map[key] = [];
  //         map[key].push(att);
  //       }
  
  //       setAttachmentsByKey(map);
  //     } catch (err) {
  //       console.error("Failed to load attachments by FTO:", err);
  //       setAttachmentsByKey({});
  //     }
  //   };
  
  //   loadAttachments();
  // }, [ftoIdNum]);
  

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
    const newId = `hour-new-${Date.now()}`;
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
        assigneeId: 0,
      },
    ]);
  };

  const addExpenseRow = () => {
    const newId = `expense-new-${Date.now()}`;
    setExpenseRows([
      ...expenseRows,
      {
        id: newId,
        date: formatDate(new Date()),
        vendor: "",
        receiptNote: "",
        avmExpense: false,
        chargeType: "client",
        amount: "$0",
        upcharge: "$0",
        assignee: "",
        assigneeId: 0,
        submissionId: 0,
        materialIndex: 0,
        attachmentIds: [],
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

  const handleApprove = async () => {
    try {
      setAttemptedSubmit(true);

      // Validate that all rows have an assignee selected
      const rowsWithoutAssignee = [
        ...hourRows.filter((r) => !r.assigneeId || r.assigneeId === 0),
        ...expenseRows.filter((r) => !r.assigneeId || r.assigneeId === 0),
      ];
      if (rowsWithoutAssignee.length > 0) {
        throw new Error("All rows must have an assignee selected");
      }

      // Group hour rows by assigneeId
      const hoursByAssignee: Record<number, HourRow[]> = {};
      hourRows.forEach((row) => {
        if (!hoursByAssignee[row.assigneeId]) {
          hoursByAssignee[row.assigneeId] = [];
        }
        hoursByAssignee[row.assigneeId].push(row);
      });

      // Group expense rows by assigneeId
      const expensesByAssignee: Record<number, ExpenseRow[]> = {};
      expenseRows.forEach((row) => {
        if (!expensesByAssignee[row.assigneeId]) {
          expensesByAssignee[row.assigneeId] = [];
        }
        expensesByAssignee[row.assigneeId].push(row);
      });

      // Get all unique assignee IDs
      const allAssigneeIds = new Set<number>([
        ...Object.keys(hoursByAssignee).map(Number),
        ...Object.keys(expensesByAssignee).map(Number),
      ]);

      if (allAssigneeIds.size === 0) {
        throw new Error("No hours or expenses to approve");
      }

      // Track all submission IDs we need to approve
      const submissionIdsToApprove: number[] = [];

      // Process each assignee
      for (const assigneeId of allAssigneeIds) {
        const assigneeHours = hoursByAssignee[assigneeId] || [];
        const assigneeExpenses = expensesByAssignee[assigneeId] || [];

        const hoursJSON = buildHoursJSON(assigneeHours);
        const materialsJSON = buildMaterialsJSON(assigneeExpenses);

        // Check if this assignee already has a submission
        let submissionId = submissionByAssignee[assigneeId];

        if (submissionId) {
          // Existing submission - PATCH it
          await patchSubmission(submissionId, {
            hours_json: hoursJSON,
            materials_json: materialsJSON,
          });
        } else {
          // No existing submission - create one
          if (!ftoIdNum) {
            throw new Error("Cannot create submission: FTO ID is missing");
          }
          submissionId = await createSubmissionForAssignee(
            ftoIdNum,
            assigneeId,
            hoursJSON,
            materialsJSON
          );
        }

        submissionIdsToApprove.push(submissionId);
      }

      // All submissions created/patched successfully

      // Update field_team_orders.amount_cents with FTO Total (from hours + expenses) before approving
      const amountCents = Math.round(grandTotal * 100);
      if (ftoIdNum) {
        await updateFtoAmountCents(ftoIdNum, amountCents);
      }

      // Approve all submissions
      for (const submissionId of submissionIdsToApprove) {
        await approveSubmission(submissionId);
      }

      // All submissions approved

      navigate(-1);
    } catch (err) {
      console.error("Approve failed:", err);
      alert(
        err instanceof Error
          ? err.message
          : "Failed to approve submission"
      );
    }
  };
  

  const handleReject = async () => {
    try {
      // Only reject existing submissions (from submissionByAssignee)
      const submissionIds = Object.values(submissionByAssignee);
  
      if (submissionIds.length === 0) {
        throw new Error("No existing submissions found to reject");
      }
  
      for (const submissionId of submissionIds) {
        await rejectSubmission(submissionId);
      }
  
      // All submissions rejected
  
      navigate(-1);
    } catch (err) {
      console.error("Reject failed:", err);
      alert(
        err instanceof Error
          ? err.message
          : "Failed to reject submission"
      );
    }
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

    // Special case: 'assignee' field should check assigneeId (the numeric value)
    if (field === 'assignee') {
      return !row.assigneeId || row.assigneeId === 0;
    }

    const value = row[field];
    if (field === 'amount') {
      return value === '$0' || !value;
    }
    return !(value && String(value).trim());
  };

  const isExpensesCellInvalid = (row: ExpenseRow, field: keyof ExpenseRow) => {
    const requiredFields = ['date', 'vendor', 'assignee', 'amount'];
    if (!requiredFields.includes(field)) return false;

    // Special case: 'assignee' field should check assigneeId (the numeric value)
    if (field === 'assignee') {
      return !row.assigneeId || row.assigneeId === 0;
    }

    const value = row[field];
    if (field === 'amount') {
      return value === '$0' || !value;
    }
    return !(value && String(value).trim());
  };

  const handleViewExpenseAttachments = (row: ExpenseRow) => {
    if (!row.attachmentIds || row.attachmentIds.length === 0) {
      alert("No attachments for this expense");
      return;
    }
  
    const attachmentId = row.attachmentIds[0];
  
    pdfViewer.openPdf(
      `/api/maintenance/attachments/${attachmentId}`,
      "Receipt"
    );
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
          gridTemplateColumns: isLeftPanelOpen ? "1fr 1fr" : "1fr",
          alignItems: "stretch",
          minHeight: 0,
          gap: 0,
          position: "relative",
        }}
      >
        {/* Toggle Button - Middle Divider */}
        <button
          onClick={() => setIsLeftPanelOpen(!isLeftPanelOpen)}
          style={{
            position: "absolute",
            right: "32px",
            top: "24px",
            width: "32px",
            height: "32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "white",
            border: "1px solid #DADADA",
            borderRadius: "8px",
            cursor: "pointer",
            zIndex: 50,
            transition: "all 0.2s ease",
          }}
          title={isLeftPanelOpen ? "Close PDF panel" : "Open PDF panel"}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {isLeftPanelOpen ? (
              <path
                d="M10 12L6 8L10 4"
                stroke="#525252"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : (
              <path
                d="M6 12L10 8L6 4"
                stroke="#525252"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
          </svg>
        </button>

        {/* Left Column - File Upload/Viewer */}
        {isLeftPanelOpen && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              padding: "24px 32px",
              borderRight: "1px solid #E5E7EB",
              height: "100%",
              overflow: "hidden",
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
                            <EyeIcon width={16} height={16} />
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
        )}

        {/* Right Column (scroll container) */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            padding: "24px 32px",
          }}
        >
          <div style={{ minWidth: "100%" }}>
          {rateError && (
            <div
              className="
                mb-8
                rounded-lg
                border border-red-300
                bg-red-50
                px-4 py-3
                text-sm
                text-red-900
                flex items-start gap-2
              "
            >
              <svg
                className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                  clipRule="evenodd"
                />
              </svg>

              <div className="flex-1">
                <div className="font-medium">
                  Cannot compute amount for hours
                </div>
                <div className="mt-1 text-red-800">
                  {rateError === "emergency"
                    ? "There is no emergency rate configured for this property. Please configure the emergency hourly rate to calculate amounts for emergency hours."
                    : "There is no hourly rate configured for this property. Please configure the hourly rate to calculate amounts for hours."}
                </div>
              </div>
            </div>
          )}

          {hasNoSubmissions && (
            <div
              className="
                mb-8
                rounded-lg
                border border-amber-300
                bg-amber-50
                px-4 py-3
                text-sm
                text-amber-900
                flex items-start gap-2
              "
            >
              <svg
                className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.72-1.36 3.485 0l6.451 11.478c.75 1.334-.213 2.99-1.742 2.99H3.548c-1.53 0-2.492-1.656-1.743-2.99L8.257 3.1zM11 14a1 1 0 10-2 0 1 1 0 002 0zm-1-2a.75.75 0 01-.75-.75V7a.75.75 0 011.5 0v4.25A.75.75 0 0110 12z"
                  clipRule="evenodd"
                />
              </svg>

              <div>
                <div className="font-medium">
                  No FTO submissions received yet
                </div>
                <div className="mt-1 text-amber-800">
                  The field team hasn’t submitted any hours or expenses for this order yet.
                  You can review the order details now and approve once submissions are added.
                </div>
              </div>
            </div>
          )}

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

                  {/* Priority and Due Date Row */}
                  <div className="flex gap-5">
                    <div className="flex-1">
                      <SelectField
                        label="Priority"
                        value={priority}
                        onChange={() => {}}
                        disabled={true}
                        options={[
                          { value: "low", label: "Low" },
                          { value: "normal", label: "Normal" },
                          { value: "high", label: "High" },
                        ]}
                      />
                    </div>
                    <div className="flex-1">
                      <DateField
                        label="Due Date"
                        value={dueDate ? formatDate(dueDate) : ""}
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
                        style={{ width: "84.3%" }}
                      />
                    </div>
                  </div>

                  {/* Hours Table */}
                  <div
                    className="rounded-xl shadow-[0_1px_2px_0_rgba(10,13,18,0.05)] mb-6"
                    style={{
                      overflowX: "auto",
                      width: "100%",
                    }}
                  >
                    <div className="flex flex-col border border-[#DADADA]/50 bg-white" style={{ width: "max-content", minWidth: "100%" }}>
                      {/* Table Header */}
                      <div className="flex items-center" style={{ width: "100%" }}>
                        <div
                          className="flex items-center gap-2 px-3 py-3 flex-shrink-0"
                          style={{ width: "160px", borderBottom: "1px solid #DADADA", borderRight: "1px solid #DADADA" }}
                        >
                          <span className="text-[#525252] text-[13px] font-medium leading-[140%] tracking-[-0.26px] whitespace-nowrap">
                            Date <span className="text-red-600">*</span>
                          </span>
                        </div>
                        <div
                          className="flex items-center gap-2 px-3 py-3 flex-shrink-0"
                          style={{ width: "110px", borderBottom: "1px solid #DADADA", borderRight: "1px solid #DADADA" }}
                        >
                          <span className="text-[#525252] text-[13px] font-medium leading-[140%] tracking-[-0.26px] whitespace-nowrap">
                            Hours <span className="text-red-600">*</span>
                          </span>
                        </div>
                        <div
                          className="flex items-center gap-2 px-3 py-3 flex-shrink-0"
                          style={{ minWidth: "300px", maxWidth: "380px", borderBottom: "1px solid #DADADA", borderRight: "1px solid #DADADA" }}
                        >
                          <span className="text-[#525252] text-[13px] font-medium leading-[140%] tracking-[-0.26px] whitespace-nowrap">
                            Note
                          </span>
                        </div>
                        <div
                          className="flex items-center gap-2 px-3 py-3 flex-shrink-0"
                          style={{ minWidth: "180px", maxWidth: "240px", borderBottom: "1px solid #DADADA", borderRight: "1px solid #DADADA" }}
                        >
                          <span className="text-[#525252] text-[13px] font-medium leading-[140%] tracking-[-0.26px] whitespace-nowrap">
                            Assignee <span className="text-red-600">*</span>
                          </span>
                        </div>
                        <div
                          className="flex items-center gap-2 px-3 py-3 flex-shrink-0"
                          style={{ width: "90px", borderBottom: "1px solid #DADADA", borderRight: "1px solid #DADADA" }}
                        >
                          <span className="text-[#525252] text-[13px] font-medium leading-[140%] tracking-[-0.26px] whitespace-nowrap">
                            Non-Billable
                          </span>
                        </div>
                        <div
                          className="flex items-center gap-2 px-3 py-3 flex-shrink-0"
                          style={{ width: "130px", borderBottom: "1px solid #DADADA", borderRight: "1px solid #DADADA" }}
                        >
                          <span className="text-[#525252] text-[13px] font-medium leading-[140%] tracking-[-0.26px] whitespace-nowrap">
                            Emergency Rate
                          </span>
                        </div>
                        <div
                          className="flex items-center gap-2 px-3 py-3 flex-shrink-0"
                          style={{ width: "140px", borderBottom: "1px solid #DADADA", borderRight: "1px solid #DADADA" }}
                        >
                          <span className="text-[#525252] text-[13px] font-medium leading-[140%] tracking-[-0.26px] whitespace-nowrap">
                            Amount <span className="text-red-600">*</span>
                          </span>
                        </div>
                        <div
                          className="flex items-center gap-2 px-3 py-3 flex-shrink-0"
                          style={{ width: "140px", borderBottom: "1px solid #DADADA", borderRight: "1px solid #DADADA" }}
                        >
                          <span className="text-[#525252] text-[13px] font-medium leading-[140%] tracking-[-0.26px] whitespace-nowrap">
                            Upcharge
                          </span>
                        </div>
                        <div
                          className="flex items-center gap-2 px-3 py-3 flex-shrink-0"
                          style={{ width: "140px", borderBottom: "1px solid #DADADA", borderRight: "1px solid #DADADA" }}
                        >
                          <span className="text-[#525252] text-[13px] font-medium leading-[140%] tracking-[-0.26px] whitespace-nowrap">
                            Total
                          </span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-3 flex-shrink-0" style={{ width: "80px", borderBottom: "1px solid #DADADA", borderRight: "1px solid #DADADA" }}>
                          <span className="text-[#525252] text-[13px] font-medium leading-[140%] tracking-[-0.26px] whitespace-nowrap">
                            Actions
                          </span>
                        </div>
                      </div>

                      {/* Table Rows */}
                      {hourRows.map((row) => (
                        <div key={row.id} className="flex items-start" style={{ width: "100%" }}>
                          {/* Date Cell */}
                          <div
                            className="flex items-center px-3 min-h-14 py-2 flex-shrink-0"
                            style={{
                              width: "160px",
                              borderBottom: "1px solid #DADADA",
                              borderRight: "1px solid #DADADA",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              boxShadow: attemptedSubmit && isHoursCellInvalid(row, 'date') ? "inset 0 0 0 2px #dc2626" : "none",
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
                              width: "110px",
                              borderBottom: "1px solid #DADADA",
                              borderRight: "1px solid #DADADA",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              boxShadow: attemptedSubmit && isHoursCellInvalid(row, 'hours') ? "inset 0 0 0 2px #dc2626" : "none",
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
                          <div
                            className="flex items-center px-3 min-h-14 py-2 flex-shrink-0"
                            style={{
                              minWidth: "300px",
                              maxWidth: "380px",
                              whiteSpace: "normal",
                              overflowWrap: "anywhere",
                              wordBreak: "break-word",
                              borderBottom: "1px solid #DADADA",
                              borderRight: "1px solid #DADADA",
                              boxShadow: "inset 0 0 0 1px transparent",
                            }}
                          >
                            <div
                              style={{
                                width: "100%",
                                boxShadow: attemptedSubmit && isHoursCellInvalid(row, 'note') ? "inset 0 0 0 2px #dc2626" : "none",
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
                              minWidth: "180px",
                              maxWidth: "240px",
                              borderBottom: "1px solid #DADADA",
                              borderRight: "1px solid #DADADA",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              boxShadow: attemptedSubmit && isHoursCellInvalid(row, 'assignee') ? "inset 0 0 0 2px #dc2626" : "none",
                            }}
                            title={row.assignee}
                          >
                            <SelectFieldCell
                              value={row.assigneeId.toString()}
                              onChange={(value) =>
                                updateHourRow(row.id, "assigneeId", Number(value))
                              }
                              placeholder="Select assignee..."
                              options={assigneeOptions.map((option) => ({
                                value: option.value.toString(),
                                label: option.label,
                              }))}
                            />
                          </div>

                          {/* NoFee Cell - Checkbox */}
                          <div
                            className="flex items-center justify-center px-3 min-h-14 py-2 flex-shrink-0"
                            style={{ width: "90px", borderBottom: "1px solid #DADADA", borderRight: "1px solid #DADADA" }}
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
                            className="flex items-center justify-center px-3 min-h-14 py-2 flex-shrink-0"
                            style={{ width: "130px", borderBottom: "1px solid #DADADA", borderRight: "1px solid #DADADA" }}
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
                              width: "140px",
                              borderBottom: "1px solid #DADADA",
                              borderRight: "1px solid #DADADA",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              boxShadow: attemptedSubmit && isHoursCellInvalid(row, 'amount') ? "inset 0 0 0 2px #dc2626" : "none",
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
                            className="flex items-center px-3 min-h-14 py-2 flex-shrink-0"
                            style={{
                              width: "140px",
                              borderBottom: "1px solid #DADADA",
                              borderRight: "1px solid #DADADA",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
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
                            className="flex items-center px-3 min-h-14 py-2 flex-shrink-0"
                            style={{
                              width: "140px",
                              borderBottom: "1px solid #DADADA",
                              borderRight: "1px solid #DADADA",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
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
                          <div
                            className="flex items-center justify-center gap-2 px-3 min-h-14 py-2 flex-shrink-0"
                            style={{
                              width: "80px",
                              borderBottom: "1px solid #DADADA",
                              borderRight: "1px solid #DADADA",
                            }}
                          >
                            {/* 🗑 Delete */}
                            <button
                              onClick={() => deleteHourRow(row.id)}
                              className="text-[#525252] hover:text-[#303030] transition-colors"
                              title="Delete row"
                            >
                              <DeleteIcon width={16} height={16} color="currentColor" />
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
                    className="rounded-xl shadow-[0_1px_2px_0_rgba(10,13,18,0.05)] mb-6"
                    style={{
                      overflowX: "auto",
                      width: "100%",
                    }}
                  >
                    <div className="flex flex-col border border-[#DADADA]/50 bg-white" style={{ width: "max-content", minWidth: "100%" }}>
                      {/* Table Header */}
                      <div className="flex items-center" style={{ width: "100%" }}>
                        <div
                          className="flex items-center gap-2 px-3 py-3 flex-shrink-0"
                          style={{ width: "160px", borderBottom: "1px solid #DADADA", borderRight: "1px solid #DADADA" }}
                        >
                          <span className="text-[#525252] text-[13px] font-medium leading-[140%] tracking-[-0.26px] whitespace-nowrap">
                            Date <span className="text-red-600">*</span>
                          </span>
                        </div>
                        <div
                          className="flex items-center gap-2 px-3 py-3 flex-shrink-0"
                          style={{ minWidth: "200px", maxWidth: "280px", borderBottom: "1px solid #DADADA", borderRight: "1px solid #DADADA" }}
                        >
                          <span className="text-[#525252] text-[13px] font-medium leading-[140%] tracking-[-0.26px] whitespace-nowrap">
                            Vendor <span className="text-red-600">*</span>
                          </span>
                        </div>
                        <div
                          className="flex items-center gap-2 px-3 py-3 flex-shrink-0"
                          style={{ minWidth: "240px", maxWidth: "300px", borderBottom: "1px solid #DADADA", borderRight: "1px solid #DADADA" }}
                        >
                          <span className="text-[#525252] text-[13px] font-medium leading-[140%] tracking-[-0.26px] whitespace-nowrap">
                            Receipt Note
                          </span>
                        </div>
                        <div
                          className="flex items-center gap-2 px-3 py-3 flex-shrink-0"
                          style={{ minWidth: "180px", maxWidth: "240px", borderBottom: "1px solid #DADADA", borderRight: "1px solid #DADADA" }}
                        >
                          <span className="text-[#525252] text-[13px] font-medium leading-[140%] tracking-[-0.26px] whitespace-nowrap">
                            Assignee <span className="text-red-600">*</span>
                          </span>
                        </div>
                        <div
                          className="flex items-center gap-2 px-3 py-3 flex-shrink-0"
                          style={{ minWidth: "160px", maxWidth: "200px", borderBottom: "1px solid #DADADA", borderRight: "1px solid #DADADA" }}
                        >
                          <span className="text-[#525252] text-[13px] font-medium leading-[140%] tracking-[-0.26px] whitespace-nowrap">
                            Charge Type <span className="text-red-600">*</span>
                          </span>
                        </div>
                        <div
                          className="flex items-center gap-2 px-3 py-3 flex-shrink-0"
                          style={{ width: "140px", borderBottom: "1px solid #DADADA", borderRight: "1px solid #DADADA" }}
                        >
                          <span className="text-[#525252] text-[13px] font-medium leading-[140%] tracking-[-0.26px] whitespace-nowrap">
                            Amount <span className="text-red-600">*</span>
                          </span>
                        </div>
                        <div
                          className="flex items-center gap-2 px-3 py-3 flex-shrink-0"
                          style={{ width: "140px", borderBottom: "1px solid #DADADA", borderRight: "1px solid #DADADA" }}
                        >
                          <span className="text-[#525252] text-[13px] font-medium leading-[140%] tracking-[-0.26px] whitespace-nowrap">
                            Upcharge
                          </span>
                        </div>
                        <div
                          className="flex items-center gap-2 px-3 py-3 flex-shrink-0"
                          style={{ width: "140px", borderBottom: "1px solid #DADADA", borderRight: "1px solid #DADADA" }}
                        >
                          <span className="text-[#525252] text-[13px] font-medium leading-[140%] tracking-[-0.26px] whitespace-nowrap">
                            Total
                          </span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-3 flex-shrink-0" style={{ width: "80px", borderBottom: "1px solid #DADADA", borderRight: "1px solid #DADADA" }}>
                          <span className="text-[#525252] text-[13px] font-medium leading-[140%] tracking-[-0.26px] whitespace-nowrap">
                            Actions
                          </span>
                        </div>
                      </div>

                      {/* Table Rows */}
                      {expenseRows.map((row) => (
                        <div key={row.id} className="flex items-start" style={{ width: "100%" }}>
                          {/* Date Cell */}
                          <div
                            className="flex items-center px-3 min-h-14 py-2 flex-shrink-0"
                            style={{
                              width: "160px",
                              borderBottom: "1px solid #DADADA",
                              borderRight: "1px solid #DADADA",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              boxShadow: attemptedSubmit && isExpensesCellInvalid(row, 'date') ? "inset 0 0 0 2px #dc2626" : "none",
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
                              minWidth: "200px",
                              maxWidth: "280px",
                              borderBottom: "1px solid #DADADA",
                              borderRight: "1px solid #DADADA",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              boxShadow: attemptedSubmit && isExpensesCellInvalid(row, 'vendor') ? "inset 0 0 0 2px #dc2626" : "none",
                            }}
                            title={row.vendor}
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
                          <div
                            className="flex items-center px-3 min-h-14 py-2 flex-shrink-0"
                            style={{
                              minWidth: "240px",
                              maxWidth: "300px",
                              whiteSpace: "normal",
                              overflowWrap: "anywhere",
                              wordBreak: "break-word",
                              borderBottom: "1px solid #DADADA",
                              borderRight: "1px solid #DADADA",
                              boxShadow: "inset 0 0 0 1px transparent",
                            }}
                          >
                            <div
                              style={{
                                width: "100%",
                                boxShadow: attemptedSubmit && isExpensesCellInvalid(row, 'receiptNote') ? "inset 0 0 0 2px #dc2626" : "none",
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
                            className="flex items-center px-3 min-h-14 py-2 flex-shrink-0"
                            style={{
                              minWidth: "180px",
                              maxWidth: "240px",
                              borderBottom: "1px solid #DADADA",
                              borderRight: "1px solid #DADADA",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              boxShadow: attemptedSubmit && isExpensesCellInvalid(row, 'assignee') ? "inset 0 0 0 2px #dc2626" : "none",
                            }}
                            title={row.assignee}
                          >
                            <SelectFieldCell
                              value={row.assigneeId.toString()}
                              onChange={(value) =>
                                updateExpenseRow(row.id, "assigneeId", Number(value))
                              }
                              placeholder="Select assignee..."
                              options={assigneeOptions.map((option) => ({
                                value: option.value.toString(),
                                label: option.label,
                              }))}
                            />
                          </div>

                          {/* Charge Type Cell - Popover */}
                          <div
                            className="flex items-center px-3 min-h-14 py-2 flex-shrink-0"
                            style={{
                              minWidth: "160px",
                              maxWidth: "200px",
                              borderBottom: "1px solid #DADADA",
                              borderRight: "1px solid #DADADA",
                            }}
                          >
                            <Popover>
                              <PopoverTrigger asChild>
                                <button
                                  className="flex items-center justify-between gap-2 w-full h-9 px-3 rounded-md border border-0 text-sm bg-white text-left cursor-pointer hover:bg-gray-50 transition-colors"
                                  style={{
                                    fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                                  }}
                                >
                                  <span
                                    style={{
                                      color: "var(--color-text-primary, #303030)",
                                      fontSize: "13px",
                                      flex: 1,
                                      textAlign: "left",
                                      whiteSpace: "nowrap",
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                    }}
                                  >
                                    {row.chargeType === "personal"
                                      ? "Personal Expense"
                                      : row.chargeType === "avm"
                                        ? "AVM Expense"
                                        : "Client Expense"}
                                  </span>
                                </button>
                              </PopoverTrigger>
                              <PopoverContent
                                className="rounded-lg border border-[var(--color-border-light)] bg-white shadow-md p-0"
                                align="start"
                                syncTriggerWidth={false}
                              >
                                <div
                                  style={{
                                    padding: "4px 0",
                                    overflowY: "auto",
                                    overflowX: "hidden",
                                    overscrollBehavior: "contain",
                                    WebkitOverflowScrolling: "touch",
                                  }}
                                >
                                  {[
                                    { value: "personal", label: "Personal Expense" },
                                    { value: "avm", label: "AVM Expense" },
                                    { value: "client", label: "Client Expense" },
                                  ].map((option) => (
                                    <button
                                      key={option.value}
                                      onClick={() =>
                                        updateExpenseRow(row.id, "chargeType", option.value as "personal" | "avm" | "client")
                                      }
                                      style={{
                                        width: "100%",
                                        padding: "8px 12px",
                                        textAlign: "left",
                                        backgroundColor:
                                          row.chargeType === option.value
                                            ? "rgba(36, 99, 235, 0.15)"
                                            : "transparent",
                                        color: "var(--color-text-primary, #303030)",
                                        border: "none",
                                        cursor: "pointer",
                                        fontSize: "13px",
                                        fontFamily:
                                          "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                                        transition: "background-color 0.15s",
                                      }}
                                      onMouseEnter={(e) => {
                                        (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                                          row.chargeType === option.value
                                            ? "rgba(36, 99, 235, 0.15)"
                                            : "rgba(36, 99, 235, 0.08)";
                                      }}
                                      onMouseLeave={(e) => {
                                        (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                                          row.chargeType === option.value
                                            ? "rgba(36, 99, 235, 0.15)"
                                            : "transparent";
                                      }}
                                      type="button"
                                    >
                                      {option.label}
                                    </button>
                                  ))}
                                </div>
                              </PopoverContent>
                            </Popover>
                          </div>

                          {/* Amount Cell - Currency */}
                          <div
                            className="flex items-center px-3 min-h-14 py-2 flex-shrink-0"
                            style={{
                              width: "140px",
                              borderBottom: "1px solid #DADADA",
                              borderRight: "1px solid #DADADA",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              boxShadow: attemptedSubmit && isExpensesCellInvalid(row, 'amount') ? "inset 0 0 0 2px #dc2626" : "none",
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
                            className="flex items-center px-3 min-h-14 py-2 flex-shrink-0"
                            style={{
                              width: "140px",
                              borderBottom: "1px solid #DADADA",
                              borderRight: "1px solid #DADADA",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
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
                            className="flex items-center px-3 min-h-14 py-2 flex-shrink-0"
                            style={{
                              width: "140px",
                              borderBottom: "1px solid #DADADA",
                              borderRight: "1px solid #DADADA",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
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
                          <div
                            className="flex items-center justify-center gap-2 px-3 min-h-14 py-2 flex-shrink-0"
                            style={{
                              width: "80px",
                              borderBottom: "1px solid #DADADA",
                              borderRight: "1px solid #DADADA",
                            }}
                          >
                            {/* 👁 View Attachment */}
                            <button
                              disabled={!row.attachmentIds || row.attachmentIds.length === 0}
                              onClick={() => handleViewExpenseAttachments(row)}
                              className={cn(
                                "transition-colors",
                                row.attachmentIds.length === 0
                                  ? "text-gray-300 cursor-not-allowed"
                                  : "text-[#525252] hover:text-[#303030]"
                              )}
                              title={
                                row.submissionId === 0
                                  ? "Attachments available after submission"
                                  : "View receipt"
                              }
                            >
                              <EyeIcon width={16} height={16} />
                            </button>

                            {/* 🗑 Delete */}
                            <button
                              onClick={() => deleteExpenseRow(row.id)}
                              className="text-[#525252] hover:text-[#303030] transition-colors"
                              title="Delete row"
                            >
                              <DeleteIcon width={16} height={16} color="currentColor" />
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
      {/* Fixed Footer */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "white",
          padding: "16px 32px",
          zIndex: 100,
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
              onClick={() => navigate(-1)}
              className="rounded-lg flex min-h-9 px-3 py-1.5 items-center gap-2 text-[#303030] font-medium tracking-[-0.32px] leading-[1.4] transition-colors bg-white border border-[#DADADA] hover:bg-gray-50"
            >
              <span>Cancel</span>
            </button>
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
