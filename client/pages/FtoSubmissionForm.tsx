import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import PageTemplate from "@/layout/PageTemplate";
import PdfViewerModal from "@/components/PdfViewerModal";
import MsgViewerModal from "@/components/MsgViewerModal";
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
  TextField,
  SelectField,
  ComboboxField,
  NumberField,
  CurrencyField,
  TextAreaField,
  FileUploadField,
  ComboboxFieldWithCustomInput,
  MultiSelectField,
} from "@/components/forms";
import type { MultiSelectOption } from "@/components/forms";
import {
  PROPERTIES,
  CHARGE_TYPES,
  TASKS,
  YES_NO_OPTIONS,
  BILLING_OPTIONS,
  billingToNoCharge,
  noChargeToBilling,
} from "@/data/fto/properties";
import { VENDORS } from "@/data/fto/vendors";
import { fetchJSON } from "@/api/fetchJSON";
import { useAuth } from "@/auth/useAuth";
import { convertFiletoPdf } from "@/utils/convertFiletoPdf";
import { parseMsgFile } from "@/utils/parseMsgFile";
import type { ParsedMsg } from "@/utils/parseMsgFile";
import {
  PROPERTY_LEVEL_LABEL,
  PROPERTY_LEVEL_SHORT_LABEL,
  PROPERTY_LEVEL_UNIT_ID,
} from "@/utils/unitLabel";

const CUSTOM_FTO_TASK_VALUE = "__custom_fto__";
const MISC_EXPENSE_TASK_VALUE = "0"; // Miscellaneous expense - no FTO

/** Property name that should not be selectable for FTO/misc submissions (Buildium sentinel). */
const NO_PROPERTY_SENTINEL_NAME = "Billing For No Property";


/** Collaborators for custom FTO: 'na' = no collaborators, number[] = user ids, null = not yet selected */
type CollaboratorSelection = "na" | number[] | null;

interface HourEntry {
  id: string;
  isExpanded: boolean;
  date: string | null;
  propertyId: string | null;
  unitId: string | null;
  taskId: string | null;
  customTaskName: string;
  collaboratorIds: CollaboratorSelection;
  hours: number | string;
  emergencyRate: string | null;
  billing: string | null; // "billable" or "non-billable" - maps to backend no_charge field
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
    billing?: string;
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

interface Unit {
  id: number;
  unit_name: string;
  address_1: string | null;
  owners: { name: string }[];
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
  submission: ApiSubmission & {
    property_id?: number;
    unit_id?: number | null;
    status?: string;
  };
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
  
  // Extract FTO name from location state (passed from submissions table)
  const ftoNameFromState = (location.state as any)?.task as string | undefined;
  const [properties, setProperties] = useState<Property[]>([]);
  const [propertiesLoading, setPropertiesLoading] = useState(false);
  const [propertiesError, setPropertiesError] = useState<string | null>(null);
  const [ftosByProperty, setFtosByProperty] = useState<Record<string, FTO[]>>({});
  const [ftosLoading, setFtosLoading] = useState(false);
  const [unitsByProperty, setUnitsByProperty] = useState<Record<string, Unit[]>>({});
  const [unitsLoading, setUnitsLoading] = useState<Record<string, boolean>>({});

  const [apiSubmission, setApiSubmission] = useState<GetSubmissionResponse | null>(null);
  const [submissionLoading, setSubmissionLoading] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  

  const didApplyPrefillRef = useRef(false);

  // Determine if submission is approved - check both location state and API response
  const [isApproved, setIsApproved] = useState(
    (location.state as any)?.isApproved ?? false
  );

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

  const [msgViewer, setMsgViewer] = useState<{
    isOpen: boolean;
    title: string;
    data: ParsedMsg | null;
    loading: boolean;
    error: string | null;
  }>({
    isOpen: false,
    title: "",
    data: null,
    loading: false,
    error: null,
  });

  const [isCreateFTOModalOpen, setIsCreateFTOModalOpen] = useState(false);
  const [isCreatingCustomFto, setIsCreatingCustomFto] = useState(false);

  const [hourEntries, setHourEntries] = useState<HourEntry[]>([
    {
      id: "hour-1",
      isExpanded: true,
      date: getTodayDate(),
      propertyId: null,
      unitId: null,
      taskId: null,
      customTaskName: "",
      collaboratorIds: null,
      hours: "",
      emergencyRate: "no",
      billing: "billable",
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
  const { userId } = useAuth();

  // Same user list as Create FTO modal (field team + property managers) for Collaborators dropdown
  const [availableCollaborators, setAvailableCollaborators] = useState<{ id: number; name: string }[]>([]);
  useEffect(() => {
    Promise.all([
      fetchJSON("/users/field-team").catch(() => []),
      fetchJSON("/users/property-managers").catch(() => []),
    ]).then(([fieldTeam, propertyManagers]: any[]) => {
      const toUser = (u: any) => ({ id: Number(u.id), name: u.name || u.email || "" });
      const seen = new Set<number>();
      const merged: { id: number; name: string }[] = [];
      for (const u of [...fieldTeam, ...propertyManagers]) {
        const a = toUser(u);
        if (seen.has(a.id)) continue;
        seen.add(a.id);
        merged.push(a);
      }
      setAvailableCollaborators(merged);
    });
  }, []);

  useEffect(() => {
    if (didApplyPrefillRef.current) return;

    const state = (location.state ?? {}) as Partial<{
      property: string;
      property_id: number;
      unit: string;
      unit_id: number | null;
      fto_id: number;
      task: string;
      description: string;
    }>;

    // Check if we have any data to prefill
    if (!state.property && !state.property_id && !state.unit && !state.task && !state.description && !state.fto_id)
      return;

    const normalize = (value: string) => value.trim().toLowerCase();

    // Use property_id if provided (from FTO data), otherwise try to match by name
    const propertyId = state.property_id
      ? String(state.property_id)
      : state.property
        ? (PROPERTIES.find(
            (p) => normalize(p.name) === normalize(state.property!),
          )?.id ?? null)
        : null;

    // Use unit_id if provided (from FTO data), otherwise try to match by name
    const unitId = (() => {
      if (state.unit_id) return String(state.unit_id);
      if (!propertyId) return null;
      
      const unitsForProperty = PROPERTIES.find((p) => p.id === propertyId)?.units ?? [];
      if (!state.unit)
        return unitsForProperty.find((u) => u.id === "na")?.id ?? null;
      const found = unitsForProperty.find(
        (u) => normalize(u.name) === normalize(state.unit!),
      );
      return (
        found?.id ?? unitsForProperty.find((u) => u.id === "na")?.id ?? null
      );
    })();

    // Use fto_id if provided (from FTO data), otherwise try to match by task name
    const taskId = (() => {
      if (state.fto_id) return String(state.fto_id);
      const taskLabel = state.task ?? state.description;
      if (!taskLabel) return null;
      const found = TASKS.find(
        (t) => normalize(t.label) === normalize(taskLabel),
      );
      return found?.value ?? null;
    })();

    // Load units and FTOs for the property if property_id is provided
    // IMPORTANT: Load FTOs so the dropdown has options - the useEffect below will set taskId once FTOs load
    if (propertyId) {
      loadUnitsForProperty(propertyId);
      loadFtosForProperty(propertyId);
    }

    // Set initial values immediately
    // Note: taskId will be set from state.fto_id if available, but will be updated once FTOs load
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

        // Defensive filter (backend should already do this) and exclude "Billing For No Property"
        // so field team cannot submit hours/expenses against that sentinel property.
        setProperties(
          data.filter(
            (p) =>
              p.active &&
              p.name?.trim().toLowerCase() !== NO_PROPERTY_SENTINEL_NAME.toLowerCase()
          )
        );
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
        
        // Update isApproved based on submission status
        if (data?.submission?.status === "approved") {
          setIsApproved(true);
        }
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
    
    // Get property_id, unit_id, and fto_id from submission level (FTO level)
    const submissionPropertyId = submission.property_id;
    const submissionUnitId = submission.unit_id;
    const submissionFtoId = submission.fto_id;
    
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
    const hours: HourEntry[] = rawHours.map((h, idx) => {
      const entryPropertyId = h.property_id ? String(h.property_id) : (submissionPropertyId ? String(submissionPropertyId) : null);
      // Use submission-level unit_id if this entry matches the submission property and doesn't have a unit
      const entryUnitId = h.unit ?? (submissionUnitId && entryPropertyId === String(submissionPropertyId) ? String(submissionUnitId) : null);
      // For viewing submissions, always use submission-level fto_id to ensure consistency
      // If hour has a task_id, prefer it, but fall back to submission fto_id
      const entryTaskId = h.task_id ? String(h.task_id) : (submissionFtoId ? String(submissionFtoId) : null);
      
      return {
        id: `hour-${idx}`,
        isExpanded: true,

        date: h.date_of_work?.split("T")[0] ?? null,
        propertyId: entryPropertyId,
        unitId: entryUnitId, // Will be mapped to ID later if it's a name
        taskId: entryTaskId,
        customTaskName: "",
        collaboratorIds: null as CollaboratorSelection,

        hours: h.hours_decimal,
        emergencyRate: h.emergency ? "yes" : "no",
        billing: noChargeToBilling(h.no_charge),

        note: h.note ?? "",
      };
    });
  
    // ----------------------------
    // EXPENSES → ExpenseEntry[]
    // ----------------------------
    const expenses: ExpenseEntry[] = rawMaterials.map((m, idx) => {
      const filesForMaterial = attachments.filter(
        (a) => a.material_index === m.material_index
      );
      const entryPropertyId = m.property_id ? String(m.property_id) : (submissionPropertyId ? String(submissionPropertyId) : "");
      // Use submission-level unit_id if this entry matches the submission property and doesn't have a unit
      const entryUnitId = m.unit ?? (submissionUnitId && entryPropertyId === String(submissionPropertyId) ? String(submissionUnitId) : null);
      // Use submission-level fto_id if material doesn't have a task_id, otherwise use material's task_id
      // For misc submissions (fto_id is null or 0), use "0" as the taskId
      const entryTaskId = m.task_id 
        ? String(m.task_id) 
        : (submissionFtoId && submissionFtoId > 0 
            ? String(submissionFtoId) 
            : MISC_EXPENSE_TASK_VALUE);
      
      return {
        id: `expense-${idx}`,
        isExpanded: true,

        date: m.date_of_work?.split("T")[0] ?? null,
        propertyId: entryPropertyId,
        unitId: entryUnitId, // Will be mapped to ID later if it's a name
        taskId: entryTaskId,

        amount: m.amount_cents / 100,
        chargeType: m.is_avm_expense ? "avm-expense" : "client-expense",
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
    
    // Load units for the submission-level property if it exists
    if (submissionPropertyId) {
      loadUnitsForProperty(String(submissionPropertyId));
      loadFtosForProperty(String(submissionPropertyId));
    }
  }, [apiSubmission]);

  // Map unit names to IDs and set unit_id from submission after units are loaded
  useEffect(() => {
    if (!apiSubmission) return;
    
    const { submission } = apiSubmission;
    const submissionPropertyId = submission.property_id;
    const submissionUnitId = submission.unit_id;
    
    // Wait for units to be loaded
    const propertyIds = new Set<string>();
    const hours = safeArray<ApiHourLine>(
      (submission as any).HoursJSON
    );
    const materials = decodeBase64JSON<ApiExpenseLine>(
      (submission as any).MaterialsJSON
    );
    
    // Add submission-level property_id
    if (submissionPropertyId) {
      propertyIds.add(String(submissionPropertyId));
    }
    
    for (const h of hours) {
      if (h.property_id) propertyIds.add(String(h.property_id));
    }
    for (const m of materials) {
      if (m.property_id) propertyIds.add(String(m.property_id));
    }
    
    // Check if all units are loaded
    const allUnitsLoaded = Array.from(propertyIds).every(
      (pid) => unitsByProperty[pid] !== undefined
    );
    
    if (!allUnitsLoaded) return;
    
    // Helper to find unit ID by name
    const findUnitIdByName = (propertyId: string | null, unitName: string | null): string | null => {
      if (!propertyId || !unitName) return null;
      const units = unitsByProperty[propertyId] || [];
      const unit = units.find((u) => u.unit_name === unitName);
      return unit ? String(unit.id) : null;
    };
    
    // Update hour entries with unit IDs
    setHourEntries((prev) =>
      prev.map((entry, idx) => {
        // If this is the first entry and we have submission-level unit_id, use it
        if (idx === 0 && submissionUnitId && entry.propertyId === String(submissionPropertyId)) {
          return { ...entry, unitId: String(submissionUnitId) };
        }
        
        // If unitId looks like a name (not a number), try to map it
        if (entry.unitId && entry.propertyId && isNaN(Number(entry.unitId))) {
          const mappedId = findUnitIdByName(entry.propertyId, entry.unitId);
          if (mappedId) {
            return { ...entry, unitId: mappedId };
          }
        }
        return entry;
      })
    );
    
    // Update expense entries with unit IDs
    setExpenseEntries((prev) =>
      prev.map((entry, idx) => {
        // If this is the first entry and we have submission-level unit_id, use it
        if (idx === 0 && submissionUnitId && entry.propertyId === String(submissionPropertyId)) {
          return { ...entry, unitId: String(submissionUnitId) };
        }
        
        // If unitId looks like a name (not a number), try to map it
        if (entry.unitId && entry.propertyId && isNaN(Number(entry.unitId))) {
          const mappedId = findUnitIdByName(entry.propertyId, entry.unitId);
          if (mappedId) {
            return { ...entry, unitId: mappedId };
          }
        }
        return entry;
      })
    );
  }, [apiSubmission, unitsByProperty]);
  

  useEffect(() => {
    if (!apiSubmission) return;
  
    const { submission } = apiSubmission;
    const submissionPropertyId = submission.property_id;
    
    const propertyIds = new Set<string>();
  
    // Add submission-level property_id
    if (submissionPropertyId) {
      propertyIds.add(String(submissionPropertyId));
    }
  
    const hours = safeArray<ApiHourLine>(
      (submission as any).HoursJSON
    );
    
    const materials = decodeBase64JSON<ApiExpenseLine>(
      (submission as any).MaterialsJSON
    );
    
  
    for (const h of hours) {
      if (h.property_id) propertyIds.add(String(h.property_id));
    }
  
    for (const m of materials) {
      if (m.property_id) propertyIds.add(String(m.property_id));
    }
  
    propertyIds.forEach((pid) => {
      loadFtosForProperty(pid);
      loadUnitsForProperty(pid);
    });
  }, [apiSubmission]);
  
  
  // Match FTO ID from location state to loaded FTOs and set taskId for NEW submissions
  // This handles the case when opening a new submission from FTO portal with property and fto_id prefilled
  useEffect(() => {
    if (isViewingExistingSubmission) return; // Skip for existing submissions (handled below)
    if (!didApplyPrefillRef.current) return; // Wait for initial prefill to complete
    
    const state = (location.state ?? {}) as Partial<{
      property_id: number;
      fto_id: number;
    }>;
    
    // Only proceed if we have both property_id and fto_id from state
    if (!state.property_id || !state.fto_id) return;
    
    const propertyIdStr = String(state.property_id);
    const ftoIdToUse = String(state.fto_id);
    
    // Wait for FTOs to be loaded for this property
    const ftos = ftosByProperty[propertyIdStr];
    if (!ftos || ftos.length === 0) {
      // FTOs haven't loaded yet, but they should be loading from the initial prefill
      // This useEffect will run again once ftosByProperty updates
      return;
    }
    
    // Check if the FTO ID exists in the loaded FTOs
    const ftoExists = ftos.some((f) => String(f.id) === ftoIdToUse);
    if (!ftoExists) {
      console.warn(`FTO ${ftoIdToUse} not found in loaded FTOs for property ${propertyIdStr}`, {
        loadedFtoIds: ftos.map(f => String(f.id)),
        lookingFor: ftoIdToUse,
        propertyId: propertyIdStr
      });
      return;
    }
    
    // Update hour entries that match the property - set taskId for all entries with this property
    setHourEntries((prev) => {
      let updated = false;
      const newEntries = prev.map((entry) => {
        if (entry.propertyId === propertyIdStr && entry.taskId !== ftoIdToUse) {
          updated = true;
          return { ...entry, taskId: ftoIdToUse };
        }
        return entry;
      });
      return updated ? newEntries : prev;
    });
    
    // Update expense entries that match the property - set taskId for all entries with this property
    setExpenseEntries((prev) => {
      let updated = false;
      const newEntries = prev.map((entry) => {
        if (entry.propertyId === propertyIdStr && entry.taskId !== ftoIdToUse) {
          updated = true;
          return { ...entry, taskId: ftoIdToUse };
        }
        return entry;
      });
      return updated ? newEntries : prev;
    });
  }, [location.state, ftosByProperty, isViewingExistingSubmission]);

  // Match FTO name from location state or FTO ID from submission to loaded FTOs and set taskId
  useEffect(() => {
    if (!isViewingExistingSubmission) return;
    
    // Priority: Use FTO name from location state if available, otherwise use submission fto_id
    let ftoIdToUse: string | null = null;
    let propertyIdToUse: string | null = null;
    
    if (ftoNameFromState && apiSubmission) {
      // Find FTO by name from location state
      const submissionPropertyId = apiSubmission.submission.property_id;
      if (submissionPropertyId) {
        const propertyIdStr = String(submissionPropertyId);
        const ftos = ftosByProperty[propertyIdStr];
        if (ftos) {
          const matchedFto = ftos.find((f) => f.name === ftoNameFromState);
          if (matchedFto) {
            ftoIdToUse = String(matchedFto.id);
            propertyIdToUse = propertyIdStr;
          }
        }
      }
    } else if (apiSubmission) {
      // Fallback to using submission fto_id
      const { submission } = apiSubmission;
      const submissionFtoId = submission.fto_id;
      const submissionPropertyId = submission.property_id;
      
      if (submissionFtoId && submissionPropertyId) {
        ftoIdToUse = String(submissionFtoId);
        propertyIdToUse = String(submissionPropertyId);
      }
    }
    
    if (!ftoIdToUse || !propertyIdToUse) return;
    
    // Wait for FTOs to be loaded for this property
    const ftos = ftosByProperty[propertyIdToUse];
    if (!ftos || ftos.length === 0) return;
    
    // Check if the FTO ID exists in the loaded FTOs
    const ftoExists = ftos.some((f) => String(f.id) === ftoIdToUse);
    if (!ftoExists) {
      console.warn(`FTO ${ftoIdToUse} not found in loaded FTOs for property ${propertyIdToUse}`, {
        loadedFtoIds: ftos.map(f => String(f.id)),
        lookingFor: ftoIdToUse,
        propertyId: propertyIdToUse
      });
      return;
    }
    
    // Update hour entries that match the submission property
    setHourEntries((prev) =>
      prev.map((entry) => {
        if (entry.propertyId === propertyIdToUse) {
          if (entry.taskId !== ftoIdToUse) {
            return { ...entry, taskId: ftoIdToUse };
          }
        }
        return entry;
      })
    );
    
    // Update expense entries that match the submission property
    setExpenseEntries((prev) =>
      prev.map((entry) => {
        if (entry.propertyId === propertyIdToUse) {
          if (entry.taskId !== ftoIdToUse) {
            return { ...entry, taskId: ftoIdToUse };
          }
        }
        return entry;
      })
    );
  }, [apiSubmission, ftosByProperty, isViewingExistingSubmission, ftoNameFromState]);

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
        field_team_member_id: String(userId),
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

  const loadUnitsForProperty = async (propertyId: string) => {
    if (unitsByProperty[propertyId]) return; // cached
  
    try {
      setUnitsLoading((prev) => ({ ...prev, [propertyId]: true }));
  
      const data: Unit[] = await fetchJSON(
        `/properties/${propertyId}/units`
      );
  
      setUnitsByProperty((prev) => ({
        ...prev,
        [propertyId]: data || [],
      }));
    } catch (err) {
      console.error("Failed to load units", err);
      setUnitsByProperty((prev) => ({
        ...prev,
        [propertyId]: [],
      }));
    } finally {
      setUnitsLoading((prev) => ({ ...prev, [propertyId]: false }));
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
        customTaskName: "",
        collaboratorIds: null,
        hours: "",
        emergencyRate: "no",
        billing: "billable",
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

  // Extract sort key for unit names (numeric vs alphabetic)
  function extractUnitSortKey(unitName: string): number | string {
    // Try to parse numeric unit names (e.g. "1", "10", "12A" → 12)
    const match = unitName.match(/^(\d+)/);
    if (match) {
      return Number(match[1]);
    }
    return unitName;
  }

  const getPropertyUnits = (propertyId: string | null) => {
    if (!propertyId) return [];
    const units = unitsByProperty[propertyId] || [];
    
    // Sort units: numeric first, then alphabetic
    return [...units].sort((a, b) => {
      const aKey = extractUnitSortKey(a.unit_name);
      const bKey = extractUnitSortKey(b.unit_name);

      // numeric vs numeric
      if (typeof aKey === "number" && typeof bKey === "number") {
        return aKey - bKey;
      }

      // numeric always comes before non-numeric
      if (typeof aKey === "number") return -1;
      if (typeof bKey === "number") return 1;

      // fallback string compare
      return String(aKey).localeCompare(String(bKey));
    });
  };

  const getUnitOptions = (propertyId: string | null) => {
    const units = getPropertyUnits(propertyId);
    return [
      {
        value: String(PROPERTY_LEVEL_UNIT_ID),
        label: PROPERTY_LEVEL_LABEL,
        displayLabel: PROPERTY_LEVEL_SHORT_LABEL,
      },
      ...units.map((u) => ({
        value: String(u.id),
        label: u.unit_name
          ? `${u.unit_name}${u.address_1 ? ` — ${u.address_1}` : ""}`
          : `Unit #${u.id}`,
      })),
    ];
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
      if (!entry.unitId) {
        errors.unitId = "Unit is required";
        isValid = false;
      }
      if (!entry.taskId) {
        errors.taskId = "Task is required";
        isValid = false;
      } else if (entry.taskId === CUSTOM_FTO_TASK_VALUE) {
        errors.taskId = "Please create the task (FTO) before submitting.";
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
      if (!entry.billing) {
        errors.billing = "Billing is required";
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
      if (!entry.unitId) {
        errors.unitId = "Unit is required";
        isValid = false;
      }
      if (!entry.taskId) {
        errors.taskId = "Task is required";
        isValid = false;
      }
      if (entry.amount == null || entry.amount === "") {
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

  const getActiveCustomHourEntry = (): HourEntry | null => {
    for (let i = hourEntries.length - 1; i >= 0; i -= 1) {
      if (hourEntries[i]?.taskId === CUSTOM_FTO_TASK_VALUE) return hourEntries[i];
    }
    return null;
  };

  const isCollaboratorSelectionValid = (v: CollaboratorSelection): boolean =>
    v === "na" || (Array.isArray(v) && v.length > 0);

  const canCreateCustomFtoFromHourEntry = (entry: HourEntry | null): boolean => {
    if (!entry) return false;
    if (!entry.propertyId) return false;
    if (!entry.date) return false;
    if (!entry.note?.trim()) return false;
    if (!entry.customTaskName?.trim()) return false;
    if (!isCollaboratorSelectionValid(entry.collaboratorIds)) return false;
    const techIdNum = Number(userId);
    if (!techIdNum || Number.isNaN(techIdNum)) return false;
    return true;
  };

  const getMissingCustomFtoFields = (entry: HourEntry | null): string[] => {
    if (!entry) return ["Property", "Task name", "Date", "Notes", "Collaborators"];
    const missing: string[] = [];
    if (!entry.propertyId) missing.push("Property");
    if (!entry.customTaskName?.trim()) missing.push("Task name");
    if (!entry.date) missing.push("Date");
    if (!entry.note?.trim()) missing.push("Notes");
    if (!isCollaboratorSelectionValid(entry.collaboratorIds)) missing.push("Collaborators");
    const techIdNum = Number(userId);
    if (!techIdNum || Number.isNaN(techIdNum)) missing.push("Logged in user");
    return missing;
  };

  const handleCreateCustomFto = async () => {
    const entry = getActiveCustomHourEntry();
    if (!canCreateCustomFtoFromHourEntry(entry)) return;
    if (!entry) return;

    const techIdNum = Number(userId);
    const propertyIdNum = Number(entry.propertyId);
    const unitIdNum = entry.unitId ? Number(entry.unitId) : null;

    const collaboratorIds =
      entry.collaboratorIds === "na" || !Array.isArray(entry.collaboratorIds)
        ? []
        : entry.collaboratorIds;
    const field_team_member_ids = [techIdNum, ...collaboratorIds];

    const payload = {
      property_id: propertyIdNum,
      unit_id: unitIdNum && !Number.isNaN(unitIdNum) ? unitIdNum : undefined,
      name: entry.customTaskName.trim(),
      description: entry.note.trim(),
      status: "completed",
      due_date: new Date(entry.date!).toISOString(),
      priority: "normal",
      field_team_member_ids,
      pm_assignee_ids: [],
    };

    try {
      setIsCreatingCustomFto(true);
      const created: any = await fetchJSON("/maintenance/ftos", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const createdId =
        created?.id ?? created?.fto?.id ?? created?.data?.id ?? null;
      const createdName =
        created?.name ??
        created?.fto?.name ??
        created?.data?.name ??
        payload.name;

      if (!createdId) {
        throw new Error("Create FTO succeeded but no id returned.");
      }

      setFtosByProperty((prev) => {
        const key = String(entry.propertyId);
        const existing = prev[key] ?? [];
        if (existing.some((f) => String(f.id) === String(createdId))) return prev;

        const newFto: FTO = {
          id: Number(createdId),
          name: String(createdName),
          description: payload.description,
          property_id: propertyIdNum,
          property_name: "",
          status: payload.status,
          priority: payload.priority,
          approval_status: "",
          form_submission_status: "none",
        };

        return { ...prev, [key]: [...existing, newFto] };
      });

      updateHourEntry(entry.id, "taskId", String(createdId));
      updateHourEntry(entry.id, "customTaskName", "");
      updateHourEntry(entry.id, "collaboratorIds", null);
    } catch (err) {
      console.error("Failed to create FTO from submission form:", err);
      alert("Failed to create task (FTO).");
    } finally {
      setIsCreatingCustomFto(false);
    }
  };


  const submitDailyWork = async () => {
    // Check if submission is approved - cannot edit approved submissions
    if (isApproved) {
      alert("You can no longer update approved submissions.");
      return;
    }

    const techId = userId; // TODO: replace with auth user
  
    // Helper to convert unitId string to number or null
    const getUnitIdAsNumber = (unitId: string | null): number | null => {
      if (!unitId) return null;
      const num = Number(unitId);
      return isNaN(num) ? null : num;
    };

    // Check if we're editing an existing submission
    if (isViewingExistingSubmission && submissionIdNum) {
      // PATCH endpoint - format data as hours_json and materials_json
      const formatDate = (dateStr: string | null): string => {
        if (!dateStr) return new Date().toISOString().split("T")[0];
        // If already in YYYY-MM-DD format, return as-is
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
        // Otherwise, extract date part from ISO string
        return dateStr.split("T")[0];
      };

      const hours_json = hourEntries.map((h, idx) => ({
        date_of_work: formatDate(h.date),
        hours_decimal: Number(h.hours) || 0,
        note: h.note ?? "",
        no_charge: billingToNoCharge(h.billing),
        emergency: h.emergencyRate === "yes",
        hour_index: idx,
        unit_id: getUnitIdAsNumber(h.unitId),
      }));

      const materials_json = expenseEntries.map((e, idx) => ({
        date_of_work: formatDate(e.date),
        vendor_name: e.vendorId ?? null,
        note: e.note ?? "",
        is_avm_expense: e.chargeType === "avm-expense",
        amount_cents: Math.round((Number(e.amount) || 0) * 100),
        material_index: idx,
        unit_id: getUnitIdAsNumber(e.unitId),
      }));

      await fetchJSON(`/maintenance/submissions/${submissionIdNum}`, {
        method: "PATCH",
        body: JSON.stringify({
          hours_json,
          materials_json,
        }),
      });
      return;
    }

    // POST endpoint - create new submission
    const hours = hourEntries.map((h) => ({
      fto_id: Number(h.taskId), // taskId === FTO id (by design)
    
      date_of_work: new Date(h.date!).toISOString(),
    
      property_id: h.propertyId ? Number(h.propertyId) : null,
      unit_id: getUnitIdAsNumber(h.unitId),
      task_id: Number(h.taskId), // optional but fine to include
    
      hours_decimal: Number(h.hours),
    
      emergency: h.emergencyRate === "yes",
      no_charge: billingToNoCharge(h.billing),
    
      note: h.note ?? "",
    }));
    
  
    const expenses = expenseEntries.map((e) => ({
      fto_id: Number(e.taskId),
      date_of_work: new Date(e.date!).toISOString(),
      property_id: Number(e.propertyId),
      unit_id: getUnitIdAsNumber(e.unitId),
      amount: Number(e.amount),
      is_avm_expense: e.chargeType === "avm-expense",
      note: e.note,
      expense_type: e.chargeType,        // string | null
      vendor_name: e.vendorId,           // string | null (id or custom input)
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
                            <ComboboxField
                                    label="Property"
                                    required
                                    error={hourErrors[entry.id]?.propertyId}
                                    options={properties.map((p) => ({
                                        value: String(p.id),
                                        label: p.name,
                                    }))}
                                    value={entry.propertyId || ""}
                                    onChange={(value) => {
                                        if (isApproved || (isViewingExistingSubmission && !isApproved)) return;
                                        updateHourEntry(entry.id, "propertyId", value);
                                        updateHourEntry(entry.id, "unitId", null); // Clear unit when property changes
                                        updateHourEntry(entry.id, "taskId", null);
                                        updateHourEntry(entry.id, "customTaskName", "");
                                        if (value) {
                                          loadFtosForProperty(value as string);
                                          loadUnitsForProperty(value as string);
                                        }
                                    }}
                                    placeholder={
                                        propertiesLoading ? "Loading properties..." : "Select Property"
                                    }
                                    disabled={propertiesLoading || isApproved || (isViewingExistingSubmission && !isApproved)}
                                />
                          </div>
                          <div className="flex-1">
                            <SelectField
                              label="Unit"
                              required
                              error={hourErrors[entry.id]?.unitId}
                              options={getUnitOptions(entry.propertyId)}
                              value={entry.unitId || ""}
                              onChange={(value) => {
                                if (isApproved || (isViewingExistingSubmission && !isApproved)) return;
                                setHourErrors((prev) => {
                                  const newErrors = { ...prev };
                                  if (newErrors[entry.id]) {
                                    delete newErrors[entry.id].unitId;
                                  }
                                  return newErrors;
                                });
                                updateHourEntry(entry.id, "unitId", value);
                              }}
                              placeholder={
                                !entry.propertyId
                                  ? "Select property first"
                                  : unitsLoading[entry.propertyId ?? ""]
                                  ? "Loading units…"
                                  : "Select Unit"
                              }
                              disabled={!entry.propertyId || unitsLoading[entry.propertyId ?? ""] || isApproved || (isViewingExistingSubmission && !isApproved)}
                            />
                          </div>
                        </div>

                        <SelectField
                            label="Task"
                            required
                            error={hourErrors[entry.id]?.taskId}
                            options={[
                              ...(ftosByProperty[entry.propertyId ?? ""] ?? []).map((fto) => ({
                                value: String(fto.id),
                                label: fto.name,
                              })),
                              ...(isApproved || (isViewingExistingSubmission && !isApproved)
                                ? []
                                : [{ value: CUSTOM_FTO_TASK_VALUE, label: "+ Add" }]),
                            ]}
                            value={(() => {
                              // Priority: Use FTO name from location state if available, otherwise use entry.taskId or submission fto_id
                              let taskIdToCheck = entry.taskId;

                              if (taskIdToCheck === CUSTOM_FTO_TASK_VALUE) {
                                return CUSTOM_FTO_TASK_VALUE;
                              }
                              
                              if (isViewingExistingSubmission) {
                                // First try to match by FTO name from location state
                                if (ftoNameFromState && entry.propertyId) {
                                  const ftos = ftosByProperty[entry.propertyId] ?? [];
                                  const matchedFto = ftos.find((f) => f.name === ftoNameFromState);
                                  if (matchedFto) {
                                    taskIdToCheck = String(matchedFto.id);
                                  }
                                }
                                
                                // Fallback to submission fto_id if name didn't match
                                if (!taskIdToCheck && apiSubmission) {
                                  const submissionFtoId = apiSubmission.submission.fto_id;
                                  const submissionPropertyId = apiSubmission.submission.property_id;
                                  if (submissionFtoId && submissionPropertyId && 
                                      String(entry.propertyId) === String(submissionPropertyId)) {
                                    taskIdToCheck = String(submissionFtoId);
                                  }
                                }
                              }
                              
                              if (!taskIdToCheck || !entry.propertyId) {
                                return "";
                              }
                              
                              const ftos = ftosByProperty[entry.propertyId] ?? [];
                              const ftoExists = ftos.some((f) => String(f.id) === String(taskIdToCheck));
                              
                              return ftoExists ? String(taskIdToCheck) : "";
                            })()}
                            
                            onChange={(value) => {
                                if (isApproved || (isViewingExistingSubmission && !isApproved)) return;
                                updateHourEntry(entry.id, "taskId", value);
                                if (value === CUSTOM_FTO_TASK_VALUE) {
                                  // Enter custom mode
                                  if (!entry.customTaskName) {
                                    updateHourEntry(entry.id, "customTaskName", "");
                                  }
                                } else {
                                  // Leaving custom mode
                                  updateHourEntry(entry.id, "customTaskName", "");
                                  updateHourEntry(entry.id, "collaboratorIds", null);
                                }
                            }}
                            placeholder={
                                ftosLoading
                                ? "Loading tasks..."
                                : !entry.propertyId
                                    ? "Select Property First"
                                    : "Select Task"
                            }
                            disabled={!entry.propertyId || ftosLoading || isApproved || (isViewingExistingSubmission && !isApproved)}
                        />

                        {entry.taskId === CUSTOM_FTO_TASK_VALUE && (
                          <TextField
                            label="Task name"
                            required
                            value={entry.customTaskName}
                            onChange={(e) => {
                              if (isApproved || (isViewingExistingSubmission && !isApproved)) return;
                              updateHourEntry(entry.id, "customTaskName", e.target.value);
                            }}
                            placeholder="Type a custom task name"
                            disabled={isApproved || (isViewingExistingSubmission && !isApproved)}
                          />
                        )}

                        {entry.taskId === CUSTOM_FTO_TASK_VALUE && (() => {
                          const COLLABORATOR_NA: MultiSelectOption = { id: "na", label: "N/A" };
                          const collaboratorOptions: MultiSelectOption[] = [
                            COLLABORATOR_NA,
                            ...availableCollaborators.map((u) => ({
                              id: String(u.id),
                              label: u.name,
                            })),
                          ];
                          const selectedCollaborators: MultiSelectOption[] =
                            entry.collaboratorIds === "na"
                              ? [COLLABORATOR_NA]
                              : Array.isArray(entry.collaboratorIds)
                                ? entry.collaboratorIds
                                    .map((id) => ({
                                      id: String(id),
                                      label: availableCollaborators.find((u) => u.id === id)?.name ?? String(id),
                                    }))
                                    .filter((o) => o.label)
                                : [];
                          return (
                            <MultiSelectField
                              label="Collaborators"
                              required
                              value={selectedCollaborators}
                              onChange={(selected) => {
                                if (isApproved || (isViewingExistingSubmission && !isApproved)) return;
                                const ids = selected
                                  .filter((s) => s.id !== "na")
                                  .map((s) => Number(s.id));
                                const hasNa = selected.some((s) => s.id === "na");
                                // If any users selected, use user list (ignore N/A); else if N/A selected use 'na'
                                if (ids.length > 0) {
                                  updateHourEntry(entry.id, "collaboratorIds", ids);
                                } else if (hasNa) {
                                  updateHourEntry(entry.id, "collaboratorIds", "na");
                                } else {
                                  updateHourEntry(entry.id, "collaboratorIds", null);
                                }
                              }}
                              placeholder="Select collaborators or N/A"
                              options={collaboratorOptions}
                              disabled={isApproved || (isViewingExistingSubmission && !isApproved)}
                            />
                          );
                        })()}

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
                          label="Billing"
                          required
                          error={hourErrors[entry.id]?.billing}
                          options={BILLING_OPTIONS}
                          value={entry.billing || "billable"}
                          onChange={(value) => {
                            if (isApproved) return;
                            setHourErrors((prev) => {
                              const newErrors = { ...prev };
                              if (newErrors[entry.id]) {
                                delete newErrors[entry.id].billing;
                              }
                              return newErrors;
                            });
                            updateHourEntry(
                              entry.id,
                              "billing",
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
                            updateHourEntry(entry.id, "note", e.target.value);
                          }}
                          autoGrow
                        />

                      </div>
                    )}
                  </div>
                ))}

                {/* Create FTO Button (custom task flow only) */}
                {!isApproved && !isViewingExistingSubmission && (() => {
                  const activeCustom = getActiveCustomHourEntry();
                  if (!activeCustom) return null;
                  const enabled =
                    canCreateCustomFtoFromHourEntry(activeCustom) &&
                    !isCreatingCustomFto;
                  const missingFields = getMissingCustomFtoFields(activeCustom);
                  const tooltip = enabled
                    ? ""
                    : `Complete: ${missingFields.join(", ")}`;
                  return (
                    <div title={tooltip}>
                      <button
                        onClick={handleCreateCustomFto}
                        disabled={!enabled}
                        className={[
                          "w-full rounded-lg px-3 py-2 min-h-[36px] flex items-center justify-center",
                          enabled
                            ? "bg-[#013764] border border-white shadow-[0_0_0_1px_#002D5A] text-white hover:opacity-90 transition-opacity"
                            : "bg-[#F2F2F2] border border-[#DADADA] text-[rgba(48,48,48,0.55)] cursor-not-allowed",
                        ].join(" ")}
                      >
                        {isCreatingCustomFto ? "Creating task..." : "Create FTO"}
                      </button>
                    </div>
                  );
                })()}

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
                            <ComboboxField
                                label="Property"
                                required
                                error={expenseErrors[entry.id]?.propertyId}
                                options={properties.map((p) => ({
                                    value: String(p.id),
                                    label: p.name,
                                }))}
                                value={entry.propertyId || ""}
                                onChange={(value) => {
                                    if (isApproved || (isViewingExistingSubmission && !isApproved)) return;
                                    updateExpenseEntry(entry.id, "propertyId", value);
                                    updateExpenseEntry(entry.id, "unitId", null); // Clear unit when property changes
                                    updateExpenseEntry(entry.id, "taskId", null);
                                    if (value) {
                                      loadFtosForProperty(value as string);
                                      loadUnitsForProperty(value as string);
                                    }
                                }}
                                placeholder={
                                    propertiesLoading ? "Loading properties..." : "Select Property"
                                }
                                disabled={propertiesLoading || isApproved || (isViewingExistingSubmission && !isApproved)}
                            />
                          </div>
                          <div className="flex-1">
                            <SelectField
                              label="Unit"
                              required
                              error={expenseErrors[entry.id]?.unitId}
                              options={getUnitOptions(entry.propertyId)}
                              value={entry.unitId || ""}
                              onChange={(value) => {
                                if (isApproved || (isViewingExistingSubmission && !isApproved)) return;
                                setExpenseErrors((prev) => {
                                  const newErrors = { ...prev };
                                  if (newErrors[entry.id]) {
                                    delete newErrors[entry.id].unitId;
                                  }
                                  return newErrors;
                                });
                                updateExpenseEntry(entry.id, "unitId", value);
                              }}
                              placeholder={
                                !entry.propertyId
                                  ? "Select property first"
                                  : unitsLoading[entry.propertyId ?? ""]
                                  ? "Loading units…"
                                  : "Select Unit"
                              }
                              disabled={!entry.propertyId || unitsLoading[entry.propertyId ?? ""] || isApproved || (isViewingExistingSubmission && !isApproved)}
                            />
                          </div>
                        </div>

                        <SelectField
                            label="Task"
                            required
                            error={expenseErrors[entry.id]?.taskId}
                            options={[
                              // Add "Misc" option at the top for miscellaneous expenses
                              { value: MISC_EXPENSE_TASK_VALUE, label: "Misc (No FTO)" },
                              ...(ftosByProperty[entry.propertyId ?? ""] ?? []).map((fto) => ({
                                value: String(fto.id),
                                label: fto.name,
                              })),
                            ]}
                            value={(() => {
                              // Check if this is a misc expense (taskId === "0" or null fto_id in submission)
                              if (entry.taskId === MISC_EXPENSE_TASK_VALUE) {
                                return MISC_EXPENSE_TASK_VALUE;
                              }

                              // For existing misc submissions, check if fto_id is null/0
                              if (isViewingExistingSubmission && apiSubmission) {
                                const submissionFtoId = apiSubmission.submission.fto_id;
                                if (!submissionFtoId || submissionFtoId === 0) {
                                  return MISC_EXPENSE_TASK_VALUE;
                                }
                              }

                              // Priority: Use FTO name from location state if available, otherwise use entry.taskId or submission fto_id
                              let taskIdToCheck = entry.taskId;
                              
                              if (isViewingExistingSubmission) {
                                // First try to match by FTO name from location state
                                if (ftoNameFromState && entry.propertyId) {
                                  const ftos = ftosByProperty[entry.propertyId] ?? [];
                                  const matchedFto = ftos.find((f) => f.name === ftoNameFromState);
                                  if (matchedFto) {
                                    taskIdToCheck = String(matchedFto.id);
                                  }
                                }
                                
                                // Fallback to submission fto_id if name didn't match
                                if (!taskIdToCheck && apiSubmission) {
                                  const submissionFtoId = apiSubmission.submission.fto_id;
                                  const submissionPropertyId = apiSubmission.submission.property_id;
                                  if (submissionFtoId && submissionPropertyId && 
                                      String(entry.propertyId) === String(submissionPropertyId)) {
                                    taskIdToCheck = String(submissionFtoId);
                                  }
                                }
                              }
                              
                              if (!taskIdToCheck || !entry.propertyId) {
                                return "";
                              }
                              
                              const ftos = ftosByProperty[entry.propertyId] ?? [];
                              const ftoExists = ftos.some((f) => String(f.id) === String(taskIdToCheck));
                              
                              return ftoExists ? String(taskIdToCheck) : "";
                            })()}
                            onChange={(value) => {
                                if (isApproved || (isViewingExistingSubmission && !isApproved)) return;
                                updateExpenseEntry(entry.id, "taskId", value);
                                if (value === MISC_EXPENSE_TASK_VALUE) {
                                  updateExpenseEntry(entry.id, "chargeType", "avm-expense");
                                }
                            }}
                            placeholder={
                                ftosLoading
                                ? "Loading tasks..."
                                : !entry.propertyId
                                    ? "Select Property First"
                                    : "Select Task"
                            }
                            disabled={!entry.propertyId || ftosLoading || isApproved || (isViewingExistingSubmission && !isApproved)}
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

                          onFilesAdded={async (newFiles) => {
                            const isMsg = (name: string) =>
                              name.toLowerCase().endsWith(".msg");

                            const uploadedFiles = await Promise.all(
                              newFiles.map(async (item) => {
                                if (!item.file) {
                                  return { ...item, error: "Missing file" };
                                }

                                try {
                                  const fileToUpload = isMsg(item.file.name)
                                    ? item.file
                                    : await convertFiletoPdf(item.file);

                                  const formData = new FormData();
                                  formData.append(
                                    "file",
                                    fileToUpload,
                                    fileToUpload.name
                                  );

                                  const res = await fetch(
                                    "/api/vendors/bills/upload-pdf",
                                    {
                                      method: "POST",
                                      credentials: "include",
                                      body: formData,
                                    }
                                  );

                                  if (!res.ok) {
                                    throw new Error(`Upload failed (${res.status})`);
                                  }

                                  const data = await res.json();

                                  return {
                                    ...item,
                                    name: fileToUpload.name,
                                    file: fileToUpload,
                                    uploading: false,
                                    storage_path: data.pdf_object_key,
                                    sha256: data.sha256_pdf,
                                  };
                                } catch (err) {
                                  console.error("Upload error:", err);
                                  return { ...item, error: "Upload failed" };
                                }
                              })
                            );
                          
                            updateExpenseEntry(entry.id, "files", [
                              ...entry.files,
                              ...uploadedFiles,
                            ]);
                          }}
                          
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
                            const fileName =
                              file.name ?? (file as { file?: File }).file?.name ?? "";
                            const isMsgFile = fileName
                              .toLowerCase()
                              .endsWith(".msg");

                            if (isMsgFile) {
                              const openMsgViewer = async (blob: Blob) => {
                                setMsgViewer((prev) => ({
                                  ...prev,
                                  isOpen: true,
                                  title: file.name ?? "Message",
                                  loading: true,
                                  data: null,
                                  error: null,
                                }));
                                try {
                                  const data = await parseMsgFile(blob);
                                  setMsgViewer((prev) => ({
                                    ...prev,
                                    loading: false,
                                    data,
                                    error: null,
                                  }));
                                } catch (err) {
                                  setMsgViewer((prev) => ({
                                    ...prev,
                                    loading: false,
                                    data: null,
                                    error:
                                      err instanceof Error
                                        ? err.message
                                        : "Failed to parse message",
                                  }));
                                }
                              };

                              if (file.file) {
                                openMsgViewer(file.file);
                                return;
                              }
                              const attachmentId = file.id
                                ? parseInt(file.id, 10)
                                : null;
                              if (attachmentId && !isNaN(attachmentId)) {
                                fetch(
                                  `/api/maintenance/attachments/${attachmentId}`,
                                  { credentials: "include" }
                                )
                                  .then((res) => {
                                    if (!res.ok) throw new Error("Failed to load");
                                    return res.blob();
                                  })
                                  .then(openMsgViewer)
                                  .catch(() => {
                                    setMsgViewer((prev) => ({
                                      ...prev,
                                      loading: false,
                                      error: "Failed to load attachment",
                                    }));
                                  });
                                setMsgViewer((prev) => ({
                                  ...prev,
                                  isOpen: true,
                                  title: file.name ?? "Message",
                                  loading: true,
                                  data: null,
                                  error: null,
                                }));
                                return;
                              }
                              if (file.storage_path) {
                                fetch(
                                  `/api/files?key=${encodeURIComponent(
                                    file.storage_path
                                  )}`,
                                  { credentials: "include" }
                                )
                                  .then((res) => {
                                    if (!res.ok) throw new Error("Failed to load");
                                    return res.blob();
                                  })
                                  .then(openMsgViewer)
                                  .catch(() => {
                                    setMsgViewer((prev) => ({
                                      ...prev,
                                      loading: false,
                                      error: "Failed to load file",
                                    }));
                                  });
                                setMsgViewer((prev) => ({
                                  ...prev,
                                  isOpen: true,
                                  title: file.name ?? "Message",
                                  loading: true,
                                  data: null,
                                  error: null,
                                }));
                                return;
                              }
                            }

                            // PDF (or other) viewer
                            if (file.file) {
                              const url = URL.createObjectURL(file.file);
                              setPdfViewer({
                                isOpen: true,
                                url,
                                title: file.name,
                              });
                              return;
                            }
                            const attachmentId = file.id
                              ? parseInt(file.id, 10)
                              : null;
                            if (attachmentId && !isNaN(attachmentId)) {
                              (async () => {
                                try {
                                  const res = await fetch(
                                    `/api/maintenance/attachments/${attachmentId}`,
                                    { credentials: "include" }
                                  );
                                  if (!res.ok) {
                                    alert("Failed to load attachment");
                                    return;
                                  }
                                  const blob = await res.blob();
                                  const url = URL.createObjectURL(blob);
                                  setPdfViewer({
                                    isOpen: true,
                                    url,
                                    title: file.name,
                                  });
                                } catch (error) {
                                  console.error("Error loading attachment:", error);
                                  alert("Failed to load attachment");
                                }
                              })();
                            } else if (file.storage_path) {
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
                                const url = URL.createObjectURL(blob);
                                setPdfViewer({
                                  isOpen: true,
                                  url,
                                  title: file.name,
                                });
                              })();
                            }
                          }}

                          disabled={isApproved}
                          accept=".pdf,.msg,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,application/vnd.ms-outlook"
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

      <MsgViewerModal
        open={msgViewer.isOpen}
        onOpenChange={(open) =>
          setMsgViewer((prev) => ({ ...prev, isOpen: open }))
        }
        title={msgViewer.title}
        data={msgViewer.data}
        loading={msgViewer.loading}
        error={msgViewer.error}
      />

      <CreateFTOModal
        open={isCreateFTOModalOpen}
        onOpenChange={setIsCreateFTOModalOpen}
        isSimple={true}
      />
    </PageTemplate>
  );
}
