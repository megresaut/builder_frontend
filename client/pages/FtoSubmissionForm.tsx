import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import PageTemplate from "@/layout/PageTemplate";
import PdfViewerModal from "@/components/PdfViewerModal";
import CreateFTOModal from "@/components/CreateFTOModal";
import {
  ClockIcon,
  DollarIcon,
  PlusIcon,
  DeleteIcon,
  CloseIcon,
} from "@/components/icons";
import { ChevronRight, ChevronDown } from "lucide-react";
import {
  DateField,
  SelectField,
  NumberField,
  CurrencyField,
  TextAreaField,
  FileUploadField,
  ComboboxFieldWithCustomInput,
} from "@/components/forms";
import {
  PROPERTIES,
  CHARGE_TYPES,
  TASKS,
  YES_NO_OPTIONS,
} from "@/data/fto/properties";
import { VENDORS } from "@/data/fto/vendors";
import { fetchJSON } from "@/api/fetchJSON";
interface HourEntry {
  id: string;
  isExpanded: boolean;
  date: string | null;
  propertyId: string | null;
  unitId: string | null;
  taskId: string | null;
  hours: number | string;
  emergencyRate: string | null;
  nonBillableHours: string | null;
  note: string;
}

interface ExpenseEntry {
  id: string;
  isExpanded: boolean;
  date: string | null;
  propertyId: string | null;
  unitId: string | null;
  taskId: string | null;
  amount: number | string;
  chargeType: string | null;
  vendorId: string | null;
  note: string;
  files: {
    id: string;
    name: string;
    file?: File;          // local only
    storage_path?: string; // backend
    sha256?: string;
    uploading?: boolean;
    error?: string;
  }[];
  
}

interface HourEntryErrors {
  [key: string]: {
    date?: string;
    propertyId?: string;
    unitId?: string;
    taskId?: string;
    hours?: string;
    emergencyRate?: string;
    nonBillableHours?: string;
    note?: string;
  };
}

interface ExpenseEntryErrors {
  [key: string]: {
    date?: string;
    propertyId?: string;
    unitId?: string;
    taskId?: string;
    amount?: string;
    chargeType?: string;
    vendorId?: string;
    note?: string;
  };
}


interface Property {
    id: number;
    name: string;
    buildium_property_id: string;
    property_type: string;
  
    address_line1: string;
    address_line2: string;
    city: string;
    state: string;
    postal_code: string;
  
    management_fee_cents: number | null;
    hourly_rate_cents: number | null;
    emergency_hourly_rate_cents: number | null;
  
    active: boolean;
    created_at: string;
  
    manager_names: string[];
  }
  
interface FTO {
id: number;
name: string;
description: string;
property_id: number;
property_name: string;
status: string;
priority: string;
approval_status: string;
form_submission_status: "none" | "partial" | "complete";
}

interface ApiHourLine {
  date_of_work: string;        // ISO string
  hours_decimal: number;

  property_id: number | null;
  unit: string | null;
  task_id: number | null;

  emergency: boolean;
  no_charge: boolean;

  note: string;
  hour_index: number;
}

interface ApiExpenseLine {
  date_of_work: string;

  property_id: number;
  unit: string | null;
  task_id: number | null;

  amount_cents: number;
  is_avm_expense: boolean;
  note: string;

  material_index: number;
}

interface ApiAttachment {
  id: number;

  file_name: string;
  file_type: string;
  file_size: number;

  storage_path: string;

  material_index: number | null;
}

interface ApiSubmission {
  id: number;
  fto_id: number;
  task_id: number | null;

  date_of_work: string;
  hours_decimal: number;

  work_description: string | null;

  hours: ApiHourLine[];
  materials: ApiExpenseLine[];

  has_attachments: boolean;
  status: string;

  created_at: string;
  updated_at: string;
}

interface GetSubmissionResponse {
  submission: ApiSubmission;
  attachments: ApiAttachment[];
}


function safeArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value;

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return [];
}

function normalizeAttachments(raw: any[]): ApiAttachment[] {
  return raw.map((a) => ({
    id: a.id ?? a.ID,
    file_name: a.file_name ?? a.FileName,
    file_type: a.file_type ?? a.FileType,
    file_size: a.file_size ?? a.FileSize,
    storage_path: a.storage_path ?? a.StoragePath,
    material_index: a.material_index ?? a.MaterialIndex,
  }));
}


function decodeBase64JSON<T>(value: unknown): T[] {
  if (typeof value !== "string" || !value) return [];

  try {
    const decoded = atob(value);
    const parsed = JSON.parse(decoded);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error("Failed to decode base64 JSON", err);
    return [];
  }
}

function getFtoName(
  ftosByProperty: Record<string, FTO[]>,
  propertyId: string | null,
  taskId: string | null
) {
  if (!propertyId || !taskId) return "";
  return (
    ftosByProperty[propertyId]?.find(
      (f) => String(f.id) === String(taskId)
    )?.name ?? ""
  );
}



export default function FtoSubmissionForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { submissionId } = useParams();
  const submissionIdNum = submissionId ? Number(submissionId) : null;  
  const isViewingExistingSubmission = submissionIdNum != null;
  const [properties, setProperties] = useState<Property[]>([]);
  const [propertiesLoading, setPropertiesLoading] = useState(false);
  const [propertiesError, setPropertiesError] = useState<string | null>(null);
  const [ftosByProperty, setFtosByProperty] = useState<Record<string, FTO[]>>({});
  const [ftosLoading, setFtosLoading] = useState(false);

  const [apiSubmission, setApiSubmission] = useState<GetSubmissionResponse | null>(null);
  const [submissionLoading, setSubmissionLoading] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  

  const didApplyPrefillRef = useRef(false);

  const isApproved = (location.state as any)?.isApproved ?? false;

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  const [pdfViewer, setPdfViewer] = useState<{
    isOpen: boolean;
    url?: string;
    title: string;
  }>({
    isOpen: false,
    url: undefined,
    title: "",
  });

  const [isCreateFTOModalOpen, setIsCreateFTOModalOpen] = useState(false);

  const [hourEntries, setHourEntries] = useState<HourEntry[]>([
    {
      id: "hour-1",
      isExpanded: true,
      date: getTodayDate(),
      propertyId: null,
      unitId: null,
      taskId: null,
      hours: "",
      emergencyRate: "no",
      nonBillableHours: "no",
      note: "",
    },
  ]);

  const [expenseEntries, setExpenseEntries] = useState<ExpenseEntry[]>([
    {
      id: "expense-1",
      isExpanded: true,
      date: getTodayDate(),
      propertyId: null,
      unitId: null,
      taskId: null,
      amount: "",
      chargeType: "client-expense",
      vendorId: null,
      note: "",
      files: [],
    },
  ]);

  const [hourErrors, setHourErrors] = useState<HourEntryErrors>({});
  const [expenseErrors, setExpenseErrors] = useState<ExpenseEntryErrors>({});

  useEffect(() => {
    if (didApplyPrefillRef.current) return;

    const state = (location.state ?? {}) as Partial<{
      property: string;
      unit: string;
      task: string;
      description: string;
    }>;

    if (!state.property && !state.unit && !state.task && !state.description)
      return;

    const normalize = (value: string) => value.trim().toLowerCase();

    const propertyId = state.property
      ? (PROPERTIES.find(
          (p) => normalize(p.name) === normalize(state.property!),
        )?.id ?? null)
      : null;

    const unitsForProperty = propertyId
      ? (PROPERTIES.find((p) => p.id === propertyId)?.units ?? [])
      : [];

    const unitId = (() => {
      if (!propertyId) return null;
      if (!state.unit)
        return unitsForProperty.find((u) => u.id === "na")?.id ?? null;
      const found = unitsForProperty.find(
        (u) => normalize(u.name) === normalize(state.unit!),
      );
      return (
        found?.id ?? unitsForProperty.find((u) => u.id === "na")?.id ?? null
      );
    })();

    const taskId = (() => {
      const taskLabel = state.task ?? state.description;
      if (!taskLabel) return null;
      const found = TASKS.find(
        (t) => normalize(t.label) === normalize(taskLabel),
      );
      return found?.value ?? null;
    })();

    setHourEntries((prev) =>
      prev.map((entry, idx) => {
        if (idx !== 0) return entry;
        return {
          ...entry,
          propertyId: entry.propertyId ?? propertyId,
          unitId: entry.unitId ?? unitId,
          taskId: entry.taskId ?? taskId,
        };
      }),
    );

    setExpenseEntries((prev) =>
      prev.map((entry, idx) => {
        if (idx !== 0) return entry;
        return {
          ...entry,
          propertyId: entry.propertyId ?? propertyId,
          unitId: entry.unitId ?? unitId,
          taskId: entry.taskId ?? taskId,
        };
      }),
    );

    didApplyPrefillRef.current = true;
  }, [location.state]);

  const toggleHourEntry = (id: string) => {
    setHourEntries((prev) =>
      prev.map((entry) =>
        entry.id === id ? { ...entry, isExpanded: !entry.isExpanded } : entry,
      ),
    );
  };

  useEffect(() => {
    let isMounted = true;
  
    const loadProperties = async () => {
      try {
        setPropertiesLoading(true);
        setPropertiesError(null);
  
        const data: Property[] = await fetchJSON("/properties");
  
        if (!isMounted) return;
  
        // Defensive filter (backend should already do this)
        setProperties(data.filter((p) => p.active));
      } catch (err) {
        console.error(err);
        if (isMounted) {
          setPropertiesError("Failed to load properties");
        }
      } finally {
        if (isMounted) {
          setPropertiesLoading(false);
        }
      }
    };
  
    loadProperties();
  
    return () => {
      isMounted = false;
    };
  }, []);
  

  useEffect(() => {
    if (!submissionIdNum) return;
  
    let isMounted = true;
  
    const loadSubmission = async () => {
      try {
        setSubmissionLoading(true);
        setSubmissionError(null);
  
        const data = await fetchJSON(
          `/maintenance/submissions/${submissionIdNum}`
        );
  
        if (!isMounted) return;
        setApiSubmission(data);
      } catch (err) {
        console.error(err);
        if (isMounted) {
          setSubmissionError("Failed to load submission");
        }
      } finally {
        if (isMounted) {
          setSubmissionLoading(false);
        }
      }
    };
  
    loadSubmission();
  
    return () => {
      isMounted = false;
    };
  }, [submissionIdNum]);
  

  useEffect(() => {
    if (!apiSubmission) return;
  
    const { submission } = apiSubmission;
    const attachments = normalizeAttachments(apiSubmission.attachments);
    // ✅ 1. Pull from the REAL backend fields
    const rawHours = safeArray<ApiHourLine>(
      (submission as any).HoursJSON
    );
  
    const rawMaterials = decodeBase64JSON<ApiExpenseLine>(
      (submission as any).MaterialsJSON
    );
  
    // ----------------------------
    // HOURS → HourEntry[]
    // ----------------------------
    const hours: HourEntry[] = rawHours.map((h, idx) => ({
      id: `hour-${idx}`,
      isExpanded: true,
  
      date: h.date_of_work?.split("T")[0] ?? null,
      propertyId: h.property_id ? String(h.property_id) : null,
      unitId: h.unit ?? null,
      taskId: h.task_id ? String(h.task_id) : null,
  
      hours: h.hours_decimal,
      emergencyRate: h.emergency ? "yes" : "no",
      nonBillableHours: h.no_charge ? "yes" : "no",
  
      note: h.note ?? "",
    }));
  
    // ----------------------------
    // EXPENSES → ExpenseEntry[]
    // ----------------------------
    const expenses: ExpenseEntry[] = rawMaterials.map((m, idx) => {
      const filesForMaterial = attachments.filter(
        (a) => a.material_index === m.material_index
      );
      return {
        id: `expense-${idx}`,
        isExpanded: true,
  
        date: m.date_of_work?.split("T")[0] ?? null,
        propertyId: String(m.property_id),
        unitId: m.unit ?? null,
        taskId: m.task_id ? String(m.task_id) : null,
  
        amount: m.amount_cents / 100,
        chargeType: "client-expense",
        vendorId: null,
        note: m.note ?? "",
  
        files: filesForMaterial.map((a) => ({
          id: String(a.id),
          name: a.file_name,
          size: a.file_size ?? 0,
          type: a.file_type ?? "application/pdf",
        
          // backend-only
          storage_path: a.storage_path,
        }))
      };
    });
  
    setHourEntries(hours.length ? hours : []);
    setExpenseEntries(expenses.length ? expenses : []);
  }, [apiSubmission]);
  

  useEffect(() => {
    if (!apiSubmission) return;
  
    const propertyIds = new Set<string>();
  
    const hours = safeArray<ApiHourLine>(
      (apiSubmission.submission as any).HoursJSON
    );
    
    const materials = decodeBase64JSON<ApiExpenseLine>(
      (apiSubmission.submission as any).MaterialsJSON
    );
    
  
    for (const h of hours) {
      if (h.property_id) propertyIds.add(String(h.property_id));
    }
  
    for (const m of materials) {
      if (m.property_id) propertyIds.add(String(m.property_id));
    }
  
    propertyIds.forEach((pid) => {
      loadFtosForProperty(pid);
    });
  }, [apiSubmission]);
  
  
  useEffect(() => {
    if (!submissionIdNum) return;
    if (hourEntries.length === 0 || expenseEntries.length === 0) return;
  
    const hoursTaskId = hourEntries[0]?.taskId;
    if (!hoursTaskId) return;
  
    setExpenseEntries((prev) =>
      prev.map((e) => ({
        ...e,
        taskId: hoursTaskId,
      }))
    );
  }, [submissionIdNum, hourEntries]);

  const loadFtosForProperty = async (propertyId: string) => {
    if (ftosByProperty[propertyId]) return; // cached
  
    try {
      setFtosLoading(true);
  
      const params = new URLSearchParams({
        property_id: String(Number(propertyId)),
        field_team_member_id: "2",
        status: "dispatched",
      });
  
      const data: FTO[] = await fetchJSON(
        `/maintenance/ftos?${params.toString()}`
      );
  
      setFtosByProperty((prev) => ({
        ...prev,
        [propertyId]: data,
      }));
    } catch (err) {
      console.error("Failed to load FTOs", err);
    } finally {
      setFtosLoading(false);
    }
  };
  
  
  

  const toggleExpenseEntry = (id: string) => {
    setExpenseEntries((prev) =>
      prev.map((entry) =>
        entry.id === id ? { ...entry, isExpanded: !entry.isExpanded } : entry,
      ),
    );
  };

  const addHourEntry = () => {
    setHourEntries((prev) => [
      ...prev,
      {
        id: `hour-${Date.now()}`,
        isExpanded: true,
        date: getTodayDate(),
        propertyId: null,
        unitId: null,
        taskId: null,
        hours: "",
        emergencyRate: "no",
        nonBillableHours: "no",
        note: "",
      },
    ]);
  };

  const addExpenseEntry = () => {
    setExpenseEntries((prev) => [
      ...prev,
      {
        id: `expense-${Date.now()}`,
        isExpanded: true,
        date: getTodayDate(),
        propertyId: null,
        unitId: null,
        taskId: null,
        amount: "",
        chargeType: "client-expense",
        vendorId: null,
        note: "",
        files: [],
      },
    ]);
  };

  const updateHourEntry = (id: string, field: keyof HourEntry, value: any) => {
    setHourEntries((prev) =>
      prev.map((entry) =>
        entry.id === id ? { ...entry, [field]: value } : entry,
      ),
    );
  };

  const updateExpenseEntry = (
    id: string,
    field: keyof ExpenseEntry,
    value: any,
  ) => {
    setExpenseEntries((prev) =>
      prev.map((entry) =>
        entry.id === id ? { ...entry, [field]: value } : entry,
      ),
    );
  };

  const deleteHourEntry = (id: string) => {
    setHourEntries((prev) => prev.filter((entry) => entry.id !== id));
  };

  const deleteExpenseEntry = (id: string) => {
    setExpenseEntries((prev) => prev.filter((entry) => entry.id !== id));
  };

  const getPropertyUnits = (propertyId: string | null) => {
    if (!propertyId) return [];
    const property = PROPERTIES.find((p) => p.id === propertyId);
    return property?.units || [];
  };

  const vendorOptions = VENDORS.map((vendor) => ({
    value: vendor.id,
    label: vendor.name,
  }));

  const validateForm = (): boolean => {
    const newHourErrors: HourEntryErrors = {};
    const newExpenseErrors: ExpenseEntryErrors = {};
    let isValid = true;

    // Validate hour entries
    for (const entry of hourEntries) {
      const errors: any = {};

      if (!entry.date) {
        errors.date = "Date is required";
        isValid = false;
      }
      if (!entry.propertyId) {
        errors.propertyId = "Property is required";
        isValid = false;
      }
      // if (!entry.unitId) {
      //   errors.unitId = "Unit is required";
      //   isValid = false;
      // }
      if (!entry.taskId) {
        errors.taskId = "Task is required";
        isValid = false;
      }
      if (!entry.hours) {
        errors.hours = "Hours is required";
        isValid = false;
      }
      if (!entry.emergencyRate) {
        errors.emergencyRate = "Emergency Rate is required";
        isValid = false;
      }
      if (!entry.nonBillableHours) {
        errors.nonBillableHours = "Non-Billable Hours is required";
        isValid = false;
      }
      if (Object.keys(errors).length > 0) {
        newHourErrors[entry.id] = errors;
      }
    }

    // Validate expense entries
    for (const entry of expenseEntries) {
      const errors: any = {};

      if (!entry.date) {
        errors.date = "Date is required";
        isValid = false;
      }
      if (!entry.propertyId) {
        errors.propertyId = "Property is required";
        isValid = false;
      }
      // if (!entry.unitId) {
      //   errors.unitId = "Unit is required";
      //   isValid = false;
      // }
      if (!entry.taskId) {
        errors.taskId = "Task is required";
        isValid = false;
      }
      if (!entry.amount) {
        errors.amount = "Amount is required";
        isValid = false;
      }
      if (!entry.chargeType) {
        errors.chargeType = "Charge Type is required";
        isValid = false;
      }
      if (!entry.vendorId) {
        errors.vendorId = "Vendor is required";
        isValid = false;
      }

      if (Object.keys(errors).length > 0) {
        newExpenseErrors[entry.id] = errors;
      }
    }

    setHourErrors(newHourErrors);
    setExpenseErrors(newExpenseErrors);
    return isValid;
  };


  const submitDailyWork = async () => {
    const techId = 2; // TODO: replace with auth user
  
    const hours = hourEntries.map((h) => ({
      fto_id: Number(h.taskId), // taskId === FTO id (by design)
    
      date_of_work: new Date(h.date!).toISOString(),
    
      property_id: h.propertyId ? Number(h.propertyId) : null,
      unit: h.unitId ?? null,
      task_id: Number(h.taskId), // optional but fine to include
    
      hours_decimal: Number(h.hours),
    
      emergency: h.emergencyRate === "yes",
      no_charge: h.nonBillableHours === "yes",
    
      note: h.note ?? "",
    }));
    
  
    const expenses = expenseEntries.map((e) => ({
      fto_id: Number(e.taskId),
      date_of_work: new Date(e.date!).toISOString(),
      property_id: Number(e.propertyId),
      unit: e.unitId ?? "",
      amount: Number(e.amount),
      is_avm_expense: false,
      note: e.note,
      attachments: e.files
        .filter((f) => f.storage_path)
        .map((f) => ({
          file_name: f.name,
          file_type: "application/pdf",
          file_size: 0,
          storage_path: f.storage_path!,
          sha256: f.sha256,
        })),
    }));
  
    await fetchJSON("/maintenance/submissions", {
      method: "POST",
      body: JSON.stringify({
        tech_id: techId,
        hours,
        expenses,
        work_description: buildWorkDescriptionFromHours(),
      }),
    });
  };

  const buildWorkDescriptionFromHours = () => {
    const notes = hourEntries
      .map((h, idx) => {
        const note = h.note?.trim();
        if (!note) return null;
        return `Entry ${idx + 1}: ${note}`;
      })
      .filter(Boolean);
  
    return notes.length > 0 ? notes.join("\n") : undefined;
  };
  
  
  return (
    <PageTemplate className="!px-4 !pt-6 !pb-8 max-w-none !min-w-0 lg:!px-6 lg:!py-9">
      <div className="flex flex-col items-center w-full">
        <div className="w-full lg:max-w-[700px] flex flex-col gap-7">
          {/* Title and Divider */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h1
                className="text-[28px] font-semibold text-[#303030] leading-[26px]"
                style={{
                  fontFamily:
                    "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                }}
              >
                Submission Summary
              </h1>
              <button
                onClick={() => navigate("/fto")}
                className="text-[#303030] hover:opacity-70 transition-opacity"
                aria-label="Close submission form"
              >
                <CloseIcon width={20} height={20} />
              </button>
            </div>
            <div className="h-px w-full bg-[#E5E5E5]" />
          </div>

          <div className="flex flex-col gap-6">
            {/* Hours Section */}
            <div className="rounded-xl bg-white border border-[#E5E5E5] shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-4 flex flex-col gap-4">
              {/* Hours Header */}
              <div className="flex items-center justify-between pr-3">
                <div className="flex items-center gap-2">
                  <ClockIcon width={16} height={16} />
                  <span
                    className="text-base font-medium text-[#303030]"
                    style={{
                      fontFamily:
                        "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                    }}
                  >
                    Hours
                  </span>
                </div>
              </div>

              {/* Hour Entries */}
              <div className="flex flex-col gap-4">
                {hourEntries.map((entry, index) => (
                  <div key={entry.id}>
                    {/* Entry Header */}
                    <div className="flex items-center justify-between pr-3">
                      <div
                        className="flex items-center gap-2 cursor-pointer"
                        onClick={() => toggleHourEntry(entry.id)}
                      >
                        {entry.isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-[#303030]" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-[#303030]" />
                        )}
                        <span
                          className="text-base font-medium text-[#303030]"
                          style={{
                            fontFamily:
                              "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                          }}
                        >
                          Hours Entry
                        </span>
                        <div className="w-5 h-5 rounded bg-[#BEE9FF] flex items-center justify-center">
                          <span
                            className="text-base font-medium text-[#2463EB]"
                            style={{
                              fontFamily:
                                "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                            }}
                          >
                            {index + 1}
                          </span>
                        </div>
                      </div>
                      {!isApproved && (
                        <button
                          onClick={() => deleteHourEntry(entry.id)}
                          className="text-[#982740] hover:opacity-70 transition-opacity"
                        >
                          <DeleteIcon width={16} height={16} />
                        </button>
                      )}
                    </div>

                    {index < hourEntries.length - 1 && (
                      <div className="h-px w-full bg-[#E5E5E5] mt-4" />
                    )}

                    {/* Expanded Content */}
                    {entry.isExpanded && (
                      <div className="flex flex-col gap-4 mt-4">
                        <DateField
                          label="Date"
                          required
                          error={hourErrors[entry.id]?.date}
                          value={entry.date}
                          onChange={(date) => {
                            if (isApproved) return;
                            setHourErrors((prev) => {
                              const newErrors = { ...prev };
                              if (newErrors[entry.id]) {
                                delete newErrors[entry.id].date;
                              }
                              return newErrors;
                            });
                            updateHourEntry(
                              entry.id,
                              "date",
                              date instanceof Date
                                ? date.toISOString().split("T")[0]
                                : date,
                            );
                          }}
                          placeholder="mm/dd/yyyy"
                          returnFormat="ISO"
                          disabled={isApproved}
                        />

                        {/* Property and Unit Row */}
                        <div className="flex flex-col lg:flex-row gap-3">
                          <div className="flex-1">
                            <SelectField
                                    label="Property"
                                    required
                                    error={hourErrors[entry.id]?.propertyId}
                                    options={properties.map((p) => ({
                                        value: String(p.id),
                                        label: p.name,
                                    }))}
                                    value={entry.propertyId || ""}
                                    onChange={(value) => {
                                        if (isApproved) return;
                                        updateHourEntry(entry.id, "propertyId", value);
                                        updateHourEntry(entry.id, "taskId", null); // ✅ FIX: updateHourEntry(entry.id, "taskId", null);
                                        loadFtosForProperty(value as string);
                                    }}
                                    placeholder={
                                        propertiesLoading ? "Loading properties..." : "Select Property"
                                    }
                                    disabled={propertiesLoading || isApproved}
                                />
                          </div>
                          <div className="flex-1">
                            <SelectField
                              label="Unit"
                              error={hourErrors[entry.id]?.unitId}
                              options={getPropertyUnits(entry.propertyId).map(
                                (u) => ({
                                  value: u.id,
                                  label: u.name,
                                }),
                              )}
                              value={entry.unitId || ""}
                              onChange={(value) => {
                                if (isApproved) return;
                                setHourErrors((prev) => {
                                  const newErrors = { ...prev };
                                  if (newErrors[entry.id]) {
                                    delete newErrors[entry.id].unitId;
                                  }
                                  return newErrors;
                                });
                                updateHourEntry(entry.id, "unitId", value);
                              }}
                              placeholder="Select Unit"
                              disabled={!entry.propertyId || isApproved}
                            />
                          </div>
                        </div>

                        <SelectField
                            label="Task"
                            required
                            error={hourErrors[entry.id]?.taskId}
                            options={(ftosByProperty[entry.propertyId ?? ""] ?? []).map((fto) => ({
                                value: String(fto.id),
                                label: fto.name,
                            }))}
                            value={
                              ftosByProperty[entry.propertyId ?? ""]?.some(
                                (f) => String(f.id) === String(entry.taskId)
                              )
                                ? entry.taskId
                                : ""
                            }
                            
                            onChange={(value) => {
                                if (isApproved) return;
                                updateHourEntry(entry.id, "taskId", value);
                            }}
                            placeholder={
                                ftosLoading
                                ? "Loading tasks..."
                                : !entry.propertyId
                                    ? "Select Property First"
                                    : "Select Task"
                            }
                            disabled={!entry.propertyId || ftosLoading || isApproved}
                        />


                        <NumberField
                          label="Hours"
                          required
                          error={hourErrors[entry.id]?.hours}
                          placeholder="Input Hours"
                          value={entry.hours}
                          onChange={(e) => {
                            if (isApproved) return;
                            const value = e.target.value;
                            // Only allow whole numbers or numbers with max one decimal place
                            if (value === "" || /^(\d+\.?\d?)$/.test(value)) {
                              setHourErrors((prev) => {
                                const newErrors = { ...prev };
                                if (newErrors[entry.id]) {
                                  delete newErrors[entry.id].hours;
                                }
                                return newErrors;
                              });
                              updateHourEntry(entry.id, "hours", value);
                            }
                          }}
                          step="0.5"
                          min="0"
                          disabled={isApproved}
                        />

                        <SelectField
                          label="Emergency Rate?"
                          required
                          error={hourErrors[entry.id]?.emergencyRate}
                          options={YES_NO_OPTIONS}
                          value={entry.emergencyRate || "no"}
                          onChange={(value) => {
                            if (isApproved) return;
                            setHourErrors((prev) => {
                              const newErrors = { ...prev };
                              if (newErrors[entry.id]) {
                                delete newErrors[entry.id].emergencyRate;
                              }
                              return newErrors;
                            });
                            updateHourEntry(entry.id, "emergencyRate", value);
                          }}
                          placeholder="Select An Option"
                          disabled={isApproved}
                        />

                        <SelectField
                          label="Non-Billable?"
                          required
                          error={hourErrors[entry.id]?.nonBillableHours}
                          options={YES_NO_OPTIONS}
                          value={entry.nonBillableHours || "no"}
                          onChange={(value) => {
                            if (isApproved) return;
                            setHourErrors((prev) => {
                              const newErrors = { ...prev };
                              if (newErrors[entry.id]) {
                                delete newErrors[entry.id].nonBillableHours;
                              }
                              return newErrors;
                            });
                            updateHourEntry(
                              entry.id,
                              "nonBillableHours",
                              value,
                            );
                          }}
                          placeholder="Select An Option"
                          disabled={isApproved}
                        />

                        <TextAreaField
                          label="Note"
                          placeholder="Notes For Hour Entry"
                          value={entry.note}
                          onChange={(e) => {
                            if (isApproved) return;
                            updateHourEntry(entry.id, "note", e.target.value);
                          }}
                          autoGrow
                          disabled={isApproved}
                        />
                      </div>
                    )}
                  </div>
                ))}

                {/* Add Hour Entry Button */}
                {!isApproved && (
                  <button
                    onClick={addHourEntry}
                    className="rounded-lg bg-white border border-dashed border-[rgba(18,18,18,0.4)] px-3 py-2 flex items-center justify-center gap-2"
                  >
                    <PlusIcon width={16} height={16} color="#2463EB" />
                    <span
                      className="text-base font-medium text-[#2463EB]"
                      style={{
                        fontFamily:
                          "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                        letterSpacing: "-0.32px",
                        lineHeight: "1.4",
                      }}
                    >
                      Add hour Entry
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* Expense Entry Section */}
            <div className="rounded-xl bg-white border border-[#E5E5E5] shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-4 flex flex-col gap-4">
              {/* Expense Header */}
              <div className="flex items-center justify-between pr-3">
                <div className="flex items-center gap-2">
                  <DollarIcon width={16} height={16} />
                  <span
                    className="text-base font-medium text-[#303030]"
                    style={{
                      fontFamily:
                        "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                    }}
                  >
                    Expense Entry
                  </span>
                </div>
              </div>

              {/* Expense Entries */}
              <div className="flex flex-col gap-4">
                {expenseEntries.map((entry, index) => (
                  <div key={entry.id}>
                    {/* Entry Header */}
                    <div className="flex items-center justify-between pr-3">
                      <div
                        className="flex items-center gap-2 cursor-pointer"
                        onClick={() => toggleExpenseEntry(entry.id)}
                      >
                        {entry.isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-[#303030]" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-[#303030]" />
                        )}
                        <span
                          className="text-base font-medium text-[#303030]"
                          style={{
                            fontFamily:
                              "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                          }}
                        >
                          Expense Entry
                        </span>
                        <div className="w-5 h-5 rounded bg-[#BEE9FF] flex items-center justify-center">
                          <span
                            className="text-base font-medium text-[#2463EB]"
                            style={{
                              fontFamily:
                                "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                            }}
                          >
                            {index + 1}
                          </span>
                        </div>
                      </div>
                      {!isApproved && (
                        <button
                          onClick={() => deleteExpenseEntry(entry.id)}
                          className="text-[#982740] hover:opacity-70 transition-opacity"
                        >
                          <DeleteIcon width={16} height={16} />
                        </button>
                      )}
                    </div>

                    {index < expenseEntries.length - 1 && (
                      <div className="h-px w-full bg-[#E5E5E5] mt-4" />
                    )}

                    {/* Expanded Content */}
                    {entry.isExpanded && (
                      <div className="flex flex-col gap-4 mt-4">
                        <DateField
                          label="Date"
                          required
                          error={expenseErrors[entry.id]?.date}
                          value={entry.date}
                          onChange={(date) => {
                            if (isApproved) return;
                            setExpenseErrors((prev) => {
                              const newErrors = { ...prev };
                              if (newErrors[entry.id]) {
                                delete newErrors[entry.id].date;
                              }
                              return newErrors;
                            });
                            updateExpenseEntry(
                              entry.id,
                              "date",
                              date instanceof Date
                                ? date.toISOString().split("T")[0]
                                : date,
                            );
                          }}
                          placeholder="mm/dd/yyyy"
                          returnFormat="ISO"
                          disabled={isApproved}
                        />

                        {/* Property and Unit Row */}
                        <div className="flex flex-col lg:flex-row gap-3">
                          <div className="flex-1">
                            <SelectField
                                label="Property"
                                required
                                error={expenseErrors[entry.id]?.propertyId}
                                options={properties.map((p) => ({
                                    value: String(p.id),
                                    label: p.name,
                                }))}
                                value={entry.propertyId || ""}
                                onChange={(value) => {
                                    if (isApproved) return;
                                    updateExpenseEntry(entry.id, "propertyId", value);
                                    updateExpenseEntry(entry.id, "taskId", null);
                                    loadFtosForProperty(value as string);
                                }}
                                placeholder={
                                    propertiesLoading ? "Loading properties..." : "Select Property"
                                }
                                disabled={propertiesLoading || isApproved}
                            />
                          </div>
                          <div className="flex-1">
                            <SelectField
                              label="Unit"
                              error={expenseErrors[entry.id]?.unitId}
                              options={getPropertyUnits(entry.propertyId).map(
                                (u) => ({
                                  value: u.id,
                                  label: u.name,
                                }),
                              )}
                              value={entry.unitId || ""}
                              onChange={(value) => {
                                if (isApproved) return;
                                setExpenseErrors((prev) => {
                                  const newErrors = { ...prev };
                                  if (newErrors[entry.id]) {
                                    delete newErrors[entry.id].unitId;
                                  }
                                  return newErrors;
                                });
                                updateExpenseEntry(entry.id, "unitId", value);
                              }}
                              placeholder="Select Unit"
                              disabled={!entry.propertyId || isApproved}
                            />
                          </div>
                        </div>

                        <SelectField
                            label="Task"
                            required
                            error={hourErrors[entry.id]?.taskId}
                            options={(ftosByProperty[entry.propertyId ?? ""] ?? []).map((fto) => ({
                              value: String(fto.id),
                              label: fto.name,
                            }))}
                            value={
                              ftosByProperty[entry.propertyId ?? ""]?.some(
                                (f) => String(f.id) === String(entry.taskId)
                              )
                                ? entry.taskId
                                : ""
                            }
                            onChange={(value) => {
                                if (isApproved) return;
                                updateExpenseEntry(entry.id, "taskId", value);
                            }}
                            placeholder={
                                ftosLoading
                                ? "Loading tasks..."
                                : !entry.propertyId
                                    ? "Select Property First"
                                    : "Select Task"
                            }
                            disabled={!entry.propertyId || ftosLoading || isApproved}
                        />

                        <CurrencyField
                          label="Amount"
                          required
                          error={expenseErrors[entry.id]?.amount}
                          placeholder="$0.00"
                          value={entry.amount}
                          onChange={(value) => {
                            if (isApproved) return;
                            setExpenseErrors((prev) => {
                              const newErrors = { ...prev };
                              if (newErrors[entry.id]) {
                                delete newErrors[entry.id].amount;
                              }
                              return newErrors;
                            });
                            updateExpenseEntry(entry.id, "amount", value);
                          }}
                          disabled={isApproved}
                        />

                        <SelectField
                          label="Charge Type"
                          required
                          error={expenseErrors[entry.id]?.chargeType}
                          options={CHARGE_TYPES}
                          value={entry.chargeType || "client-expense"}
                          onChange={(value) => {
                            if (isApproved) return;
                            setExpenseErrors((prev) => {
                              const newErrors = { ...prev };
                              if (newErrors[entry.id]) {
                                delete newErrors[entry.id].chargeType;
                              }
                              return newErrors;
                            });
                            updateExpenseEntry(entry.id, "chargeType", value);
                          }}
                          placeholder="Select An Option"
                          disabled={isApproved}
                        />

                        <ComboboxFieldWithCustomInput
                          label="Vendor"
                          required
                          error={expenseErrors[entry.id]?.vendorId}
                          options={vendorOptions}
                          value={entry.vendorId || ""}
                          onChange={(value) => {
                            if (isApproved) return;
                            setExpenseErrors((prev) => {
                              const newErrors = { ...prev };
                              if (newErrors[entry.id]) {
                                delete newErrors[entry.id].vendorId;
                              }
                              return newErrors;
                            });
                            updateExpenseEntry(entry.id, "vendorId", value);
                          }}
                          placeholder="Select Vendor"
                          customInputPlaceholder="Enter vendor name"
                          disabled={isApproved}
                        />

                        <TextAreaField
                          label="Note"
                          placeholder="Notes For Expense Entry"
                          value={entry.note}
                          onChange={(e) => {
                            if (isApproved) return;
                            updateExpenseEntry(
                              entry.id,
                              "note",
                              e.target.value,
                            );
                          }}
                          autoGrow
                          disabled={isApproved}
                        />
                        <FileUploadField
                          label="Attachments"
                          files={entry.files}

                          onFilesAdded={
                            isApproved
                              ? undefined
                              : async (newFiles) => {
                                  const uploadedFiles = await Promise.all(
                                    newFiles.map(async (file) => {
                                      try {
                                        const formData = new FormData();
                                        formData.append("file", file.file!);

                                        const res = await fetch(
                                          "/api/vendors/bills/upload-pdf",
                                          {
                                            method: "POST",
                                            credentials: "include",
                                            body: formData,
                                          }
                                        );

                                        if (!res.ok) throw new Error("Upload failed");

                                        const data = await res.json();

                                        return {
                                          ...file,
                                          uploading: false,
                                          storage_path: data.pdf_object_key,
                                          sha256: data.sha256_pdf,
                                        };
                                      } catch {
                                        return { ...file, error: "Upload failed" };
                                      }
                                    })
                                  );

                                  updateExpenseEntry(entry.id, "files", [
                                    ...entry.files,
                                    ...uploadedFiles,
                                  ]);
                                }
                          }

                          onFileRemoved={
                            isApproved
                              ? undefined
                              : (fileId) =>
                                  updateExpenseEntry(
                                    entry.id,
                                    "files",
                                    entry.files.filter((f) => f.id !== fileId)
                                  )
                          }

                          onViewFile={(file) => {
                            if (file.file) {
                              const reader = new FileReader();
                              reader.onload = (e) => {
                                setPdfViewer({
                                  isOpen: true,
                                  url: e.target?.result as string,
                                  title: file.name,
                                });
                              };
                              reader.readAsDataURL(file.file);
                              return;
                            }

                            if (file.storage_path) {
                              (async () => {
                                const res = await fetch(
                                  `/api/files?key=${encodeURIComponent(
                                    file.storage_path
                                  )}`,
                                  { credentials: "include" }
                                );                                
                            
                                if (!res.ok) {
                                  alert("Failed to load PDF");
                                  return;
                                }
                            
                                const blob = await res.blob();
                            
                                const fileObj = new File([blob], file.name, {
                                  type: "application/pdf",
                                });
                            
                                const url = URL.createObjectURL(fileObj);
                            
                                setPdfViewer({
                                  isOpen: true,
                                  url,
                                  title: file.name,
                                });
                              })();
                            }                            
                          }}

                          disabled={isApproved}
                          accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
                          maxFiles={10}
                          maxSize={10 * 1024 * 1024}
                          placeholder="Drag and drop files here, or click to browse"
                        />

                      </div>
                    )}
                  </div>
                ))}

                {/* Add Expense Button */}
                {!isApproved && (
                  <button
                    onClick={addExpenseEntry}
                    className="rounded-lg bg-white border border-dashed border-[rgba(18,18,18,0.4)] px-3 py-2 flex items-center justify-center gap-2"
                  >
                    <PlusIcon width={16} height={16} color="#2463EB" />
                    <span
                      className="text-base font-medium text-[#2463EB]"
                      style={{
                        fontFamily:
                          "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                        letterSpacing: "-0.32px",
                        lineHeight: "1.4",
                      }}
                    >
                      Add Expense
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 mt-9">
            <button
              onClick={() => navigate("/fto")}
              className="rounded-lg bg-[#FBFBFB] border border-[#DADADA] shadow-[0_1px_3px_rgba(0,0,0,0.03)] px-3 py-2 min-h-[36px] flex items-center justify-center"
            >
              <span
                className="text-base text-[#303030] font-normal"
                style={{
                  fontFamily:
                    "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                  letterSpacing: "-0.32px",
                  lineHeight: "1.4",
                }}
              >
                Back
              </span>
            </button>
            {!isApproved && (
              <button
                onClick={async () => {
                  if (!validateForm()) return;
                
                  try {
                    await submitDailyWork();
                    navigate("/fto");
                  } catch (err) {
                    console.error(err);
                    alert("Failed to submit work");
                  }
                }}
                className="rounded-lg bg-[#013764] border border-white shadow-[0_0_0_1px_#002D5A] px-3 py-2 min-h-[36px] flex items-center justify-center"
              >
                <span
                  className="text-base text-white font-medium"
                  style={{
                    fontFamily:
                      "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                  }}
                >
                  Submit
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      <PdfViewerModal
        open={pdfViewer.isOpen}
        onOpenChange={(open) => setPdfViewer({ ...pdfViewer, isOpen: open })}
        title={pdfViewer.title}
        url={pdfViewer.url}
      />

      <CreateFTOModal
        open={isCreateFTOModalOpen}
        onOpenChange={setIsCreateFTOModalOpen}
        isSimple={true}
      />
    </PageTemplate>
  );
}
