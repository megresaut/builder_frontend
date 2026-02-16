import { useState, useEffect, useMemo, useCallback, useRef } from "react";
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
import { DeleteIcon, EyeIcon, EditIcon } from "@/components/icons";
import CreateFTOModal from "@/components/CreateFTOModal";
import BlueButton from "@/components/BlueButton";
import PdfViewerModal from "@/components/PdfViewerModal";
import { usePdfViewer } from "@/hooks/usePdfViewer";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { useParams } from "react-router-dom";
import { fetchJSON } from "@/api/fetchJSON";
import { cn } from "@/lib/utils";
import { AlertBanner } from "@/components/AlertBanner";

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
  submissionId: number;
  hourIndex?: number;
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
  // Misc submission mode
  propertyName?: string;
  propertyId?: number;
  dateOfWork?: string;
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
    let errMsg = "Failed to fetch submissions";
    const text = await res.text();
    if (text) {
      try {
        const body = JSON.parse(text);
        if (body && typeof body.error === "string") errMsg = body.error;
      } catch {
        errMsg = text;
      }
    }
    throw new Error(errMsg);
  }

  return res.json();
};

// Fetch a single submission by ID (for misc expenses)
const fetchSubmissionById = async (submissionId: number): Promise<{ submission: BackendSubmission; property_name?: string; property_id?: number }> => {
  const res = await fetch(
    `/api/maintenance/submissions/${submissionId}`,
    // `http://localhost:8080/maintenance/submissions/${submissionId}`,
    {
      headers: { Accept: "application/json" },
    },
  );

  if (!res.ok) {
    let errMsg = "Failed to fetch submission";
    const text = await res.text();
    if (text) {
      try {
        const body = JSON.parse(text);
        if (body && typeof body.error === "string") errMsg = body.error;
      } catch {
        errMsg = text;
      }
    }
    throw new Error(errMsg);
  }

  const data = await res.json();
  // The API returns { submission: {...}, attachments: [...] }
  // We need to map the submission fields
  const sub = data.submission || data;
  return {
    submission: {
      ID: sub.ID || sub.id,
      FTOID: sub.FTOID || sub.fto_id,
      FieldTeamMemberID: sub.FieldTeamMemberID || sub.field_team_member_id,
      MaterialsJSON: sub.MaterialsJSON || sub.materials,
      HoursJSON: sub.HoursJSON || sub.hours,
    },
    property_name: sub.property_name,
    property_id: sub.property_id || sub.PropertyID,
  };
};

// Fetch attachments by submission ID (for misc expenses)
const fetchAttachmentsBySubmission = async (submissionId: number): Promise<AttachmentSummary[]> => {
  const res = await fetch(
    `/api/maintenance/attachments/by-submission?submission_id=${submissionId}`,
    // `http://localhost:8080/maintenance/attachments/by-submission?submission_id=${submissionId}`,
    { headers: { Accept: "application/json" } }
  );

  if (!res.ok) return [];

  const raw = await res.json();
  if (!raw || !Array.isArray(raw)) return [];

  return raw.map((a: any) => ({
    id: a.ID || a.id,
    file_name: a.FileName || a.file_name,
    submission_id: a.SubmissionID ?? a.submission_id,
    material_index: a.MaterialIndex ?? a.material_index,
  }));
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
      hour_index: row.hourIndex ?? index,
    };
    if (upchargeCents !== 0) out.upcharge_cents = upchargeCents;
    return out;
  });
};

const chargeTypeToExpenseType = (
  ct: "personal" | "avm" | "client"
): "personal-expense" | "avm-expense" | "client-expense" => {
  if (ct === "avm") return "avm-expense";
  if (ct === "personal") return "personal-expense";
  return "client-expense";
};

const buildMaterialsJSON = (expenseRows: ExpenseRow[]) => {
  return expenseRows.map((row, index) => {
    const upchargeCents = parseMoneyToCents(row.upcharge);
    const out: Record<string, unknown> = {
      date_of_work: row.date,
      vendor_name: row.vendor,
      note: row.receiptNote || "",
      is_avm_expense: row.chargeType === "avm",
      expense_type: chargeTypeToExpenseType(row.chargeType),
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
    field_team_member_id?: number;
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

/** Derive charge type from API expense line: use expense_type when present, else is_avm_expense. */
const expenseLineToChargeType = (expense: ExpenseLine): "personal" | "avm" | "client" => {
  const et = expense.expense_type;
  if (et === "avm-expense") return "avm";
  if (et === "client-expense") return "client";
  if (et === "personal-expense") return "personal";
  return isAvmExpenseToChargeType(expense.is_avm_expense ?? false);
};


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

/** Approves the entire FTO: all submissions for this FTO and the FTO itself. */
const approveFto = async (ftoId: number) => {
  const res = await fetch(`/api/maintenance/ftos/${ftoId}/approve`, {
    method: "POST",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to approve FTO");
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
  const pdfViewer = usePdfViewer();

  // const ftoId = id ? Number(id) : null;

  const { ftoId, submissionId } = useParams<{ ftoId?: string; submissionId?: string }>();
  const ftoIdNum = ftoId ? Number(ftoId) : null;
  const submissionIdNum = submissionId ? Number(submissionId) : null;
  
  // Determine if we're in "misc submission" mode (single submission by ID)
  const isMiscMode = submissionIdNum !== null && ftoIdNum === null;
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

  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(true);
  const [assigneeById, setAssigneeById] = useState<Record<number, string>>({});
  const [hasNoSubmissions, setHasNoSubmissions] = useState(false);
  const [rateError, setRateError] = useState<"hourly" | "emergency" | null>(null);
  const [propertyId, setPropertyId] = useState<number | null>(null);
  // const [attachmentsByKey, setAttachmentsByKey] = useState<Record<string, AttachmentSummary[]>>({});
  
  // Track submissions by assignee ID so we know which assignees already have submissions
  const [submissionByAssignee, setSubmissionByAssignee] = useState<Record<number, number>>({});
  /** All submission IDs for this FTO (so we can PATCH each one on approve, including clearing hours) */
  const [loadedSubmissionIds, setLoadedSubmissionIds] = useState<number[]>([]);
  /** submissionId -> field_team_member_id for patching when a submission has zero rows left */
  const [loadedSubmissionToAssignee, setLoadedSubmissionToAssignee] = useState<Record<number, number>>({});
  const [loadedFto, setLoadedFto] = useState<Record<string, any> | null>(null);
  const [showEditFTOModal, setShowEditFTOModal] = useState(false);
  const [ftoDetailsVersion, setFtoDetailsVersion] = useState(0);

  // Live vendors for expense section (paginated, same pattern as work order menu)
  const [isExpenseVendorDropdownOpen, setIsExpenseVendorDropdownOpen] = useState(false);
  const vendorPageSize = 50;
  const vendorRequestIdRef = useRef(0);
  const [expenseVendors, setExpenseVendors] = useState<Array<{ id: number; name: string }>>([]);
  const [expenseVendorSearch, setExpenseVendorSearch] = useState("");
  const [expenseVendorOffset, setExpenseVendorOffset] = useState(0);
  const [expenseVendorHasMore, setExpenseVendorHasMore] = useState(true);
  const [expenseVendorLoading, setExpenseVendorLoading] = useState(false);

  const fetchExpenseVendorsPage = useCallback(
    async (search: string, offset: number, append: boolean) => {
      const requestId = ++vendorRequestIdRef.current;
      setExpenseVendorLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("limit", vendorPageSize.toString());
        if (offset > 0) params.set("offset", offset.toString());
        const trimmed = search.trim();
        if (trimmed) params.set("search", trimmed);
        const vendorList = await fetchJSON(`/vendors?${params.toString()}`);
        if (requestId !== vendorRequestIdRef.current) return;
        const normalized = (Array.isArray(vendorList) ? vendorList : []).map((v: any) => ({
          id: Number(v.id),
          name: typeof v.name === "string" ? v.name : String(v.name ?? ""),
        }));
        setExpenseVendors((prev) => (append ? [...prev, ...normalized] : normalized));
        setExpenseVendorHasMore(normalized.length === vendorPageSize);
        setExpenseVendorOffset(offset + normalized.length);
      } catch (err) {
        if (requestId !== vendorRequestIdRef.current) return;
        console.error("Failed to load vendors for expense dropdown:", err);
        if (!append) setExpenseVendors([]);
        setExpenseVendorHasMore(false);
      } finally {
        if (requestId === vendorRequestIdRef.current) {
          setExpenseVendorLoading(false);
        }
      }
    },
    [vendorPageSize],
  );

  useEffect(() => {
    if (!isExpenseVendorDropdownOpen) return;
    const t = window.setTimeout(() => {
      fetchExpenseVendorsPage(expenseVendorSearch, 0, false);
    }, 0);
    return () => window.clearTimeout(t);
  }, [isExpenseVendorDropdownOpen, expenseVendorSearch, fetchExpenseVendorsPage]);

  const expenseVendorOptions = useMemo(
    () =>
      expenseVendors.map((v) => ({
        value: v.name,
        label: v.name,
      })),
    [expenseVendors],
  );

  const handleExpenseVendorOpenChange = useCallback((open: boolean) => {
    setIsExpenseVendorDropdownOpen(open);
    if (!open) setExpenseVendorSearch("");
  }, []);

  const handleExpenseVendorLoadMore = useCallback(() => {
    if (expenseVendorLoading || !expenseVendorHasMore) return;
    fetchExpenseVendorsPage(expenseVendorSearch, expenseVendorOffset, true);
  }, [expenseVendorLoading, expenseVendorHasMore, expenseVendorSearch, expenseVendorOffset, fetchExpenseVendorsPage]);

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

  // Shape expected by CreateFTOModal when editing (same as All Field Team Orders edit)
  const editingFTO = useMemo(() => {
    if (!loadedFto || !ftoIdNum) return null;
    const statusRaw = (loadedFto.status ?? "").toString().toLowerCase();
    const statusMap: Record<string, "new" | "dispatched" | "completed" | "cancelled"> = {
      new: "new",
      dispatched: "dispatched",
      completed: "completed",
      cancelled: "cancelled",
    };
    const status = statusMap[statusRaw] ?? "new";
    const dueDateVal = loadedFto.due_date ?? loadedFto.dueDate;
    const due_date =
      typeof dueDateVal === "string"
        ? dueDateVal
        : dueDateVal && typeof (dueDateVal as any).toISOString === "function"
          ? (dueDateVal as Date).toISOString().split("T")[0]
          : "";
    return {
      id: Number(loadedFto.id ?? loadedFto.ID ?? ftoIdNum),
      name: loadedFto.name ?? "",
      description: loadedFto.description ?? "",
      priority: (loadedFto.priority ?? "normal").toString().toLowerCase() as "low" | "normal" | "high",
      status,
      due_date,
      property_id: Number(loadedFto.property_id ?? loadedFto.propertyId ?? loadedFto.PropertyID ?? 0),
      property_name: loadedFto.property_name ?? loadedFto.property_address ?? undefined,
      unit_id: loadedFto.unit_id ?? loadedFto.unitId ?? loadedFto.UnitID ?? null,
      unit_name: loadedFto.unit_name ?? undefined,
      task_id: loadedFto.task_id ?? loadedFto.taskId ?? loadedFto.TaskID ?? undefined,
      field_team_member_ids: Array.isArray(loadedFto.field_team_member_ids)
        ? loadedFto.field_team_member_ids.map(Number)
        : [],
      pm_assignee_ids: Array.isArray(loadedFto.pm_assignee_ids)
        ? loadedFto.pm_assignee_ids.map(Number)
        : [],
    };
  }, [loadedFto, ftoIdNum]);

  /**
   * Load FTO details from API when ftoId is available
   * OR load submission details for misc mode
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
        setLoadedFto(fto);

        // Update FTO details from API response
        if (fto.name) setFtoName(fto.name);
        const resolvedPropertyId =
          fto.property_id ?? fto.propertyId ?? fto.PropertyID ?? null;
        if (resolvedPropertyId != null) {
          setPropertyId(Number(resolvedPropertyId));
        }
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
        const taskName = fto.task_name ?? fto.taskName ?? fto.TaskName ?? "";
        if (taskName !== "") {
          setTask(taskName);
        } else {
          setTask("N/A");
        }
      } catch (err) {
        console.error("Error loading FTO details:", err);
      }
    };

    const loadMiscSubmissionDetails = async () => {
      if (!submissionIdNum) return;

      // For misc mode, use details from location state if available
      if (state.propertyName) {
        setProperty(state.propertyName);
      }
      if (state.description) {
        setDescription(state.description);
      }
      // Set FTO name to indicate this is a misc expense
      setFtoName("Miscellaneous Expense");
      setPriority("normal");
      setTask("N/A");
      setLoadedFto(null);
    };

    if (isMiscMode) {
      loadMiscSubmissionDetails();
    } else {
      loadFTODetails();
    }
  }, [ftoIdNum, submissionIdNum, isMiscMode, state, ftoDetailsVersion]);
  
  /**
   * Load submissions from API and populate hours/expenses tables
   * Handles both FTO mode (by fto_id) and misc mode (by submission_id)
   */
  useEffect(() => {
    const loadSubmissions = async () => {
      try {
        setIsLoadingSubmissions(true);
        setRateError(null); // Clear any previous rate errors

        let submissions: BackendSubmission[] = [];
        let attachmentIndex: Record<string, number[]> = {};

        if (isMiscMode && submissionIdNum) {
          // Misc mode: load single submission by ID
          const { submission, property_name, property_id } = await fetchSubmissionById(submissionIdNum);
          submissions = [submission];
          
          // Update property info from submission if not already set
          if (property_name && !property) {
            setProperty(property_name);
          }
          if (property_id) {
            setPropertyId(property_id);
          }

          // Fetch attachments for this submission
          const attachments = await fetchAttachmentsBySubmission(submissionIdNum);
          attachmentIndex = buildAttachmentIndex(attachments);
        } else if (ftoIdNum) {
          // FTO mode: load all submissions for the FTO
          submissions = await fetchSubmissionsByFto(ftoIdNum);
          
          if (submissions && submissions.length > 0) {
            const attachments = await fetchAttachmentsByFto(ftoIdNum);
            attachmentIndex = buildAttachmentIndex(attachments);
          }
        }

        // 🚨 HANDLE null / empty explicitly
        if (!submissions || !Array.isArray(submissions) || submissions.length === 0) {
          setHasNoSubmissions(true);
          setHourRows([]);
          setExpenseRows([]);
          setLoadedSubmissionIds([]);
          setLoadedSubmissionToAssignee({});
          setIsLoadingSubmissions(false);
          return;
        }

        // otherwise, submissions exist
        setHasNoSubmissions(false);

        // Flatten all hour lines from all submissions into HourRow[]
        const allHourLines: HourRow[] = [];
        const allExpenseLines: ExpenseRow[] = [];

        submissions.forEach((submission) => {
          // Map HoursJSON to HourRow[]
          if (submission.HoursJSON) {
            // HoursJSON might be an array or need parsing
            let hoursData = submission.HoursJSON;
            if (typeof hoursData === 'string') {
              try {
                hoursData = JSON.parse(hoursData);
              } catch {
                hoursData = [];
              }
            }
            
            if (Array.isArray(hoursData)) {
              hoursData.forEach((hourLine: any, index: number) => {
                const upchargeCents = hourLine.upcharge_cents ?? 0;
                const hourIndex = hourLine.hour_index ?? index;
                allHourLines.push({
                  id: `hour-${submission.ID}-${index}`,
                  date: formatDate(new Date(hourLine.date_of_work)),
                  hours: (hourLine.hours_decimal || 0).toString(),
                  note: hourLine.note || "",
                  noFee: hourLine.no_charge || false,
                  emergency: hourLine.emergency || false,
                  amount: `$${((hourLine.amount_cents ?? 0) / 100).toFixed(2)}`,
                  upcharge: upchargeCents !== 0 ? `$${(upchargeCents / 100).toFixed(2)}` : "$0.00",
                  assignee: assigneeById[submission.FieldTeamMemberID] || "",
                  assigneeId: submission.FieldTeamMemberID,
                  submissionId: submission.ID,
                  hourIndex,
                });
              });
            }
          }

          // Decode MaterialsJSON and map to ExpenseRow[]
          if (submission.MaterialsJSON) {
            try {
              let materialsData: ExpenseLine[];
              
              // MaterialsJSON might be base64 encoded or raw JSON
              if (typeof submission.MaterialsJSON === 'string') {
                try {
                  // Try base64 decode first
                  const decodedJson = atob(submission.MaterialsJSON);
                  materialsData = JSON.parse(decodedJson);
                } catch {
                  // If base64 fails, try direct JSON parse
                  materialsData = JSON.parse(submission.MaterialsJSON);
                }
              } else {
                materialsData = submission.MaterialsJSON as unknown as ExpenseLine[];
              }

              // Handle null or non-array expenses (e.g., when materials are empty)
              if (materialsData && Array.isArray(materialsData)) {
                materialsData.forEach((expense, index) => {
                  const key = `${submission.ID}-${index}`;
                  const upchargeCents = expense.upcharge_cents ?? 0;
                  allExpenseLines.push({
                    id: `expense-${submission.ID}-${index}`,
                    submissionId: submission.ID,
                    materialIndex: index,

                    attachmentIds: attachmentIndex[key] ?? [],

                    date: formatDate(new Date(expense.date_of_work)),
                    vendor: formatVendorName(expense.vendor_name || ""),
                    receiptNote: expense.note || "",
                    avmExpense: expense.is_avm_expense,
                    chargeType: expenseLineToChargeType(expense),
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

        setLoadedSubmissionIds(submissions.map((s) => s.ID));
        setLoadedSubmissionToAssignee(Object.fromEntries(submissions.map((s) => [s.ID, s.FieldTeamMemberID])));

        setHourRows(allHourLines);
        setExpenseRows(allExpenseLines);
      } catch (error) {
        console.error("Failed to load submissions:", error);
        
        // Check if error is related to missing rates (e.g. "cannot scan NULL into *int64" for hourly_rate_cents / emergency_hourly_rate_cents)
        const errorMessage = error instanceof Error ? error.message : String(error);
        const lowerError = errorMessage.toLowerCase();
        
        if (lowerError.includes("emergency_hourly_rate") || (lowerError.includes("emergency") && lowerError.includes("rate"))) {
          setRateError("emergency");
        } else if (lowerError.includes("hourly_rate") || (lowerError.includes("hourly") && lowerError.includes("rate"))) {
          setRateError("hourly");
        } else if (lowerError.includes("scan") && (lowerError.includes("null") || lowerError.includes("emergency") || lowerError.includes("hourly"))) {
          if (lowerError.includes("emergency_hourly_rate_cents") || lowerError.includes("emergency")) {
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
  }, [ftoId, submissionId, isMiscMode]);

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
        submissionId: 0,
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

      if (hourRows.length === 0 && expenseRows.length === 0) {
        throw new Error("No hours or expenses to approve");
      }

      // 1) PATCH each loaded submission with its current hour/expense rows (so deletions persist)
      for (const submissionId of loadedSubmissionIds) {
        const subHourRows = hourRows.filter((r) => r.submissionId === submissionId);
        const subExpenseRows = expenseRows.filter((r) => r.submissionId === submissionId);
        const hoursJSON = buildHoursJSON(subHourRows);
        const materialsJSON = buildMaterialsJSON(subExpenseRows);
        const assigneeId = loadedSubmissionToAssignee[submissionId];
        await patchSubmission(submissionId, {
          hours_json: hoursJSON,
          materials_json: materialsJSON,
          field_team_member_id: assigneeId,
        });
      }

      // 2) Create new submissions for any rows with submissionId === 0 (new rows) — only in FTO mode (misc has no FTO to attach to)
      if (ftoIdNum) {
        const newHourRows = hourRows.filter((r) => r.submissionId === 0);
        const newExpenseRows = expenseRows.filter((r) => r.submissionId === 0);
        const newAssigneeIds = new Set<number>([
          ...newHourRows.map((r) => r.assigneeId),
          ...newExpenseRows.map((r) => r.assigneeId),
        ].filter((id) => id > 0));

        for (const assigneeId of newAssigneeIds) {
          const assigneeNewHours = newHourRows.filter((r) => r.assigneeId === assigneeId);
          const assigneeNewExpenses = newExpenseRows.filter((r) => r.assigneeId === assigneeId);
          const hoursJSON = buildHoursJSON(assigneeNewHours);
          const materialsJSON = buildMaterialsJSON(assigneeNewExpenses);
          await createSubmissionForAssignee(
            ftoIdNum,
            assigneeId,
            hoursJSON,
            materialsJSON
          );
        }
      }

      // Update field_team_orders.amount_cents with FTO Total (from hours + expenses) before approving — only when we have an FTO
      const amountCents = Math.round(grandTotal * 100);
      if (ftoIdNum) {
        await updateFtoAmountCents(ftoIdNum, amountCents);
      }

      // Approve: misc = single submission by ID; FTO = entire FTO and all its submissions
      if (isMiscMode && submissionIdNum !== null) {
        await approveSubmission(submissionIdNum);
      } else {
        if (!ftoIdNum) {
          throw new Error("Cannot approve: FTO ID is missing");
        }
        await approveFto(ftoIdNum);
      }

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
      // `http://localhost:8080/maintenance/attachments/${attachmentId}`,
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
      {/* Main Content Area */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
        }}
      >
        <div
          style={{
            flex: 1,
            minHeight: 0,
            padding: "24px 32px",
          }}
        >
          <div style={{ minWidth: "100%" }}>
          {rateError === "hourly" && (
            <div className="mb-6">
              <AlertBanner
                title="No hourly rate"
                message="This property doesn't have an hourly rate set. Set it on the property to calculate amounts for hours "
                messageLinkText={propertyId != null ? "here." : undefined}
                messageLinkOnClick={propertyId != null ? () => navigate(`/property/${propertyId}`) : undefined}
              />
            </div>
          )}
          {rateError === "emergency" && (
            <div className="mb-6">
              <AlertBanner
                title="No emergency hourly rate"
                message="This property doesn't have an emergency hourly rate set. Set it on the property to calculate amounts for emergency hours "
                messageLinkText={propertyId != null ? "here." : undefined}
                messageLinkOnClick={propertyId != null ? () => navigate(`/property/${propertyId}`) : undefined}
              />
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
                  {isMiscMode ? "No expense data found" : "No FTO submissions received yet"}
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
                {/* FTO Details Header + Edit FTO button */}
                <div className="flex w-full items-start justify-between gap-4">
                  <div className="flex flex-col text-xl text-[#303030] font-semibold leading-[1.3]">
                    <div>{isMiscMode ? "Miscellaneous Expense Details" : "FTO Details"}</div>
                    <div
                      className="h-px bg-gray-200 mt-5"
                      style={{ width: "790px" }}
                    />
                  </div>
                  {!isMiscMode && ftoIdNum && loadedFto && (
                    <button
                      type="button"
                      onClick={() => setShowEditFTOModal(true)}
                      className="flex items-center gap-2 shrink-0 rounded-lg border border-[#DADADA] bg-white px-3 py-2 text-sm font-medium text-[#303030] shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] hover:bg-gray-50 transition-colors"
                    >
                      <EditIcon width={16} height={16} color="#525252" />
                      Edit FTO
                    </button>
                  )}
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
                  {/* FTO Name / Expense Type */}
                  <div>
                    <TextField
                      label={isMiscMode ? "Expense Type" : "FTO Name"}
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

                  {/* Task - from API (task_name) or N/A */}
                  <div>
                    <TextField
                      label="Task"
                      value={task || "N/A"}
                      onChange={() => {}}
                      disabled={true}
                    />
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
                              options={expenseVendorOptions}
                              onOpenChange={handleExpenseVendorOpenChange}
                              onSearchChange={setExpenseVendorSearch}
                              onLoadMore={handleExpenseVendorLoadMore}
                              optionsLoading={expenseVendorLoading}
                              hasMore={expenseVendorHasMore}
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
              {isMiscMode ? "Approve Expense" : "Approve Field Team Order"}
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

      {/* Edit FTO Modal - same as All Field Team Orders edit */}
      {!isMiscMode && ftoIdNum && (
        <CreateFTOModal
          open={showEditFTOModal}
          onOpenChange={(open) => {
            setShowEditFTOModal(open);
            if (!open) setFtoDetailsVersion((v) => v + 1);
          }}
          editingFTO={editingFTO}
        />
      )}
    </div>
  );
}
