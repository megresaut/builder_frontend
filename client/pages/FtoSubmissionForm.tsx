import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import PageTemplate from "@/layout/PageTemplate";
import PdfViewerModal from "@/components/PdfViewerModal";
import MsgViewerModal from "@/components/MsgViewerModal";
import CreateFTOModal from "@/components/CreateFTOModal";
import { Checkbox } from "@/components/ui/checkbox";
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
  PropertyLocationCombobox,
} from "@/components/forms";
import type { MultiSelectOption } from "@/components/forms";
import {
  PROPERTIES,
  CHARGE_TYPES,
  CARD_OPTIONS,
  TASKS,
  YES_NO_OPTIONS,
  BILLING_OPTIONS,
  billingToNoCharge,
  noChargeToBilling,
} from "@/data/fto/properties";
import { API_BASE, authFetch, fetchJSON } from "@/api/fetchJSON";  
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
const PENDING_FTO_PREFIX = "__pending_fto__:";
const makePendingFtoValue = (name: string) => `${PENDING_FTO_PREFIX}${name}`;
const isPendingFtoValue = (v: string | null): boolean =>
  !!v && v.startsWith(PENDING_FTO_PREFIX);
const extractPendingFtoName = (v: string): string =>
  v.slice(PENDING_FTO_PREFIX.length);

/**
 * Identity of the field team order an entry points at, used to key task
 * selections in taskByFtoKey. Inline ("+ Add") FTOs have no id until submit
 * time, so they are keyed by property + custom name — the same key
 * createPendingFtosAndSubmit uses to dedupe them.
 *
 * Returns null when there is no FTO to attach a task to: nothing selected yet,
 * or "Misc (No FTO)" on an expense line.
 */
const ftoLinkKey = (entry: {
  taskId: string | null;
  propertyId: string | null;
  customTaskName?: string;
}): string | null => {
  const { taskId, propertyId } = entry;
  if (!taskId || !propertyId) return null;
  if (taskId === MISC_EXPENSE_TASK_VALUE) return null;
  if (taskId === CUSTOM_FTO_TASK_VALUE) {
    const name = entry.customTaskName?.trim();
    return name ? `custom:${propertyId}::${name}` : null;
  }
  if (isPendingFtoValue(taskId)) {
    const name = extractPendingFtoName(taskId).trim();
    return name ? `custom:${propertyId}::${name}` : null;
  }
  const id = Number(taskId);
  return Number.isFinite(id) && id > 0 ? `fto:${id}` : null;
};

/** Property name that should not be selectable for FTO/misc submissions (Buildium sentinel). */
const NO_PROPERTY_SENTINEL_NAME = "Billing For No Property";

/** User ID of the admin who can submit on behalf of other users (e.g. Carter). */
const SUBMIT_AS_ADMIN_USER_ID = 5;


/** Collaborators for custom FTO: 'na' = no collaborators, number[] = user ids, null = not yet selected */
type CollaboratorSelection = "na" | number[] | null;

interface HourEntry {
  id: string;
  isExpanded: boolean;
  date: string | null;
  propertyId: string | null;
  locationId: string | null;
  unitId: string | null;
  /**
   * Field team order id — NOT a tasks.id, despite the name (legacy). Labelled
   * "Field Team Order" in the UI. The real task association lives on the FTO
   * (field_team_orders.task_id) and is tracked separately in taskByFtoKey.
   */
  taskId: string | null;
  customTaskName: string;
  collaboratorIds: CollaboratorSelection;
  hours: number | string;
  emergencyRate: string | null;
  billing: string | null; // "billable" or "non-billable" - maps to backend no_charge field
  note: string;
  dumpRun: boolean;
  gasCharge: boolean;
}

interface ExpenseEntry {
  id: string;
  isExpanded: boolean;
  date: string | null;
  propertyId: string | null;
  locationId: string | null;
  unitId: string | null;
  /** Field team order id (see HourEntry.taskId) — "0" means misc / no FTO. */
  taskId: string | null;
  amount: number | string;
  chargeType: string | null;
  paymentMethod: "company_card" | "personal_card";
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
    locations_count?: number;
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
/** Task this FTO is linked to (field_team_orders.task_id); null when unlinked. */
task_id?: number | null;
}

/** Minimal task shape from GET /maintenance/tasks, for the Task association field. */
interface SimpleTask {
  id: number;
  name: string;
  status: string;
}

/** Task statuses that are finished — excluded from the Task dropdown. */
const TERMINAL_TASK_STATUSES = new Set(["closed", "cancelled"]);

/**
 * Options for the Task field: open tasks only, i.e. anything not closed or
 * cancelled (so in_progress / scheduled / pending_vendor all qualify). A task
 * the FTO is already linked to is kept even when finished, so opening an old
 * submission never silently drops its existing link. Leading "— None —" clears.
 *
 * Exported for tests.
 */
export function buildTaskOptions(
  tasks: SimpleTask[],
  selectedTaskId: number | null
): { value: string; label: string }[] {
  const visible = tasks.filter(
    (t) =>
      !TERMINAL_TASK_STATUSES.has(String(t.status)) || t.id === selectedTaskId
  );
  return [
    { value: "", label: "— None —" },
    ...visible.map((t) => ({
      value: String(t.id),
      label: t.name || `Task #${t.id}`,
    })),
  ];
}

/**
 * The task pick in effect for an entry, or undefined when the user never
 * touched the field (so nothing should be written).
 *
 * The Task field is usable as soon as a property is chosen, which means a pick
 * can be made before the field team order exists to hang it on. Those land in
 * stagedTaskByEntry, keyed by entry id, and are promoted into taskByFtoKey once
 * an FTO is selected. An explicit per-FTO pick therefore always wins over a
 * staged one — by the time both exist, the staged value has been promoted.
 *
 * Exported for tests.
 */
export function resolveTaskPick(
  entryId: string,
  linkKey: string | null,
  taskByFtoKey: Record<string, number | null>,
  stagedTaskByEntry: Record<string, number | null>
): number | null | undefined {
  if (linkKey && linkKey in taskByFtoKey) return taskByFtoKey[linkKey];
  if (entryId in stagedTaskByEntry) return stagedTaskByEntry[entryId];
  return undefined;
}

/**
 * Decide which FTOs need field_team_orders.task_id rewritten, as
 * ftoId -> tasks.id (0 meaning unlink).
 *
 * Two guards keep this from touching FTOs it shouldn't: an FTO whose Task field
 * was never touched resolves to undefined and is skipped, and a selection equal
 * to what the FTO already stores is a no-op (no churn on updated_at, no
 * pointless Outlook re-sync). Inline FTOs ("custom:" keys) are excluded — they
 * carry their task in the create payload instead.
 *
 * Exported for tests.
 */
export function planFtoTaskLinkWrites(
  entries: Array<{
    id: string;
    taskId: string | null;
    propertyId: string | null;
    customTaskName?: string;
  }>,
  taskByFtoKey: Record<string, number | null>,
  ftosByProperty: Record<string, { id: number; task_id?: number | null }[]>,
  stagedTaskByEntry: Record<string, number | null> = {}
): Map<number, number> {
  const wanted = new Map<number, number>();

  for (const entry of entries) {
    const key = ftoLinkKey(entry);
    if (!key || !key.startsWith("fto:")) continue;

    const pick = resolveTaskPick(entry.id, key, taskByFtoKey, stagedTaskByEntry);
    if (pick === undefined) continue; // never touched -> leave the FTO alone

    const ftoId = Number(key.slice("fto:".length));
    const desired = pick ?? 0;
    const current =
      (ftosByProperty[entry.propertyId ?? ""] ?? []).find((f) => f.id === ftoId)
        ?.task_id ?? 0;

    if (desired === current) continue;
    wanted.set(ftoId, desired);
  }

  return wanted;
}

interface ApiHourLine {
  date_of_work: string;        // ISO string
  hours_decimal: number;

  property_id: number | null;
  unit: string | null;         // legacy: unit name
  unit_id: number | null;      // unit this hour entry was logged against
  task_id: number | null;

  emergency: boolean;
  no_charge: boolean;
  is_dump_run: boolean;
  is_gas_charge: boolean;

  note: string;
  hour_index: number;
}

interface ApiExpenseLine {
  date_of_work: string;

  property_id: number;
  unit: string | null;         // legacy: unit name
  unit_id: number | null;      // unit this expense was logged against
  task_id: number | null;

  amount_cents: number;
  is_avm_expense: boolean;
  note: string;

  payment_method?: string;

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
  FTOID?: number; // Go backend may serialize as "FTOID" (no json tag)
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
  const [tasksByProperty, setTasksByProperty] = useState<Record<string, SimpleTask[]>>({});
  const [tasksLoading, setTasksLoading] = useState<Record<string, boolean>>({});
  /**
   * Task chosen for each field team order, keyed by ftoLinkKey().
   *
   * The association lives on the FTO (field_team_orders.task_id), not on the
   * hour/expense line, so it is stored per-FTO rather than per-entry — two
   * entries pointing at the same FTO then share one value by construction and
   * can never disagree. Written to the API at submit time by syncFtoTaskLinks().
   */
  const [taskByFtoKey, setTaskByFtoKey] = useState<Record<string, number | null>>({});
  /**
   * Task picks made before a field team order was selected, keyed by entry id.
   * Promoted into taskByFtoKey as soon as the entry gets an FTO. See
   * resolveTaskPick.
   */
  const [stagedTaskByEntry, setStagedTaskByEntry] = useState<
    Record<string, number | null>
  >({});

  const [apiSubmission, setApiSubmission] = useState<GetSubmissionResponse | null>(null);
  const [submissionLoading, setSubmissionLoading] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  

  const didApplyPrefillRef = useRef(false);

  // Determine if submission is approved - check both location state and API response
  const [isApproved, setIsApproved] = useState(
    (location.state as any)?.isApproved ?? false
  );

  /** Format Date as local YYYY-MM-DD so the calendar date is correct in any timezone. */
  const toLocalDateString = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const getTodayDate = () => toLocalDateString(new Date());

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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [hourEntries, setHourEntries] = useState<HourEntry[]>([
    {
      id: "hour-1",
      isExpanded: true,
      date: getTodayDate(),
      propertyId: null,
      locationId: null,
      unitId: null,
      taskId: null,
      customTaskName: "",
      collaboratorIds: null,
      hours: "",
      emergencyRate: "no",
      billing: "billable",
      note: "",
      dumpRun: false,
      gasCharge: false,
    },
  ]);

  const [expenseEntries, setExpenseEntries] = useState<ExpenseEntry[]>([
    {
      id: "expense-1",
      isExpanded: true,
      date: getTodayDate(),
      propertyId: null,
      locationId: null,
      unitId: null,
      taskId: null,
      amount: "",
      chargeType: "client-expense",
      paymentMethod: "company_card",
      vendorId: null,
      note: "",
      files: [],
    },
  ]);

  const [hourErrors, setHourErrors] = useState<HourEntryErrors>({});
  const [expenseErrors, setExpenseErrors] = useState<ExpenseEntryErrors>({});
  const { userId } = useAuth();

  // Derive unique pending custom FTOs from hour entries (for expense dropdown + submit)
  const pendingCustomFtos = useMemo(() => {
    const seen = new Map<string, { propertyId: string; customTaskName: string }>();
    for (const entry of hourEntries) {
      if (
        entry.taskId === CUSTOM_FTO_TASK_VALUE &&
        entry.propertyId &&
        entry.customTaskName.trim()
      ) {
        const key = `${entry.propertyId}::${entry.customTaskName.trim()}`;
        if (!seen.has(key)) {
          seen.set(key, {
            propertyId: entry.propertyId,
            customTaskName: entry.customTaskName.trim(),
          });
        }
      }
    }
    return Array.from(seen.values());
  }, [hourEntries]);

  // Clean up orphaned pending FTO references in expenses when hour entries change
  useEffect(() => {
    const definedKeys = new Set<string>();
    for (const h of hourEntries) {
      if (
        h.taskId === CUSTOM_FTO_TASK_VALUE &&
        h.propertyId &&
        h.customTaskName.trim()
      ) {
        definedKeys.add(`${h.propertyId}::${h.customTaskName.trim()}`);
      }
    }

    setExpenseEntries((prev) => {
      let changed = false;
      const updated = prev.map((e) => {
        if (isPendingFtoValue(e.taskId)) {
          const name = extractPendingFtoName(e.taskId!);
          const key = `${e.propertyId}::${name}`;
          if (!definedKeys.has(key)) {
            changed = true;
            return { ...e, taskId: null };
          }
        }
        return e;
      });
      return changed ? updated : prev;
    });
  }, [hourEntries]);

  // Admin-only: submit on behalf of another user (any user)
  const isSubmitAsAdmin = userId === SUBMIT_AS_ADMIN_USER_ID;
  const [usersForSubmitAs, setUsersForSubmitAs] = useState<{ id: number; name: string }[]>([]);
  const [submitAsTechId, setSubmitAsTechId] = useState<number | null>(null);

  useEffect(() => {
    if (!isSubmitAsAdmin) return;
    let cancelled = false;
    fetchJSON("/users/all")
      .then((data: any[]) => {
        if (cancelled) return;
        const list = (Array.isArray(data) ? data : []).map((u: any) => ({
          id: Number(u.id),
          name: u.name || u.email || String(u.id),
        }));
        setUsersForSubmitAs(list);
        setSubmitAsTechId((prev) => (prev === null && userId != null ? userId : prev));
      })
      .catch(() => {
        if (!cancelled) setUsersForSubmitAs([]);
      });
    return () => { cancelled = true; };
  }, [isSubmitAsAdmin, userId]);

  // Clear FTO cache when "Submit as" user changes so tasks re-fetch for the selected user
  useEffect(() => {
    if (!isSubmitAsAdmin) return;
    setFtosByProperty({});
  }, [submitAsTechId, isSubmitAsAdmin]);

  // Live vendor list from backend (paginated + searchable)
  const vendorPageSize = 50;
  const vendorRequestIdRef = useRef(0);
  const [liveVendors, setLiveVendors] = useState<{ id: number; name: string }[]>([]);
  const [vendorSearch, setVendorSearch] = useState("");
  const [vendorOffset, setVendorOffset] = useState(0);
  const [vendorHasMore, setVendorHasMore] = useState(true);
  const [vendorLoading, setVendorLoading] = useState(false);

  const fetchVendorsPage = useCallback(
    async (search: string, offset: number, append: boolean) => {
      const requestId = ++vendorRequestIdRef.current;
      setVendorLoading(true);
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
        setLiveVendors((prev) => (append ? [...prev, ...normalized] : normalized));
        setVendorHasMore(normalized.length === vendorPageSize);
        setVendorOffset(offset + normalized.length);
      } catch (err) {
        if (requestId !== vendorRequestIdRef.current) return;
        console.error("Failed to load vendors:", err);
        if (!append) setLiveVendors([]);
        setVendorHasMore(false);
      } finally {
        if (requestId === vendorRequestIdRef.current) setVendorLoading(false);
      }
    },
    [vendorPageSize],
  );

  const handleVendorOpenChange = useCallback(
    (open: boolean) => {
      if (open) {
        setVendorSearch("");
        fetchVendorsPage("", 0, false);
      }
    },
    [fetchVendorsPage],
  );

  const handleVendorSearchChange = useCallback(
    (search: string) => {
      setVendorSearch(search);
      setVendorOffset(0);
      fetchVendorsPage(search, 0, false);
    },
    [fetchVendorsPage],
  );

  const handleVendorLoadMore = useCallback(() => {
    if (vendorLoading || !vendorHasMore) return;
    fetchVendorsPage(vendorSearch, vendorOffset, true);
  }, [vendorLoading, vendorHasMore, vendorSearch, vendorOffset, fetchVendorsPage]);

  const vendorOptions = liveVendors.map((v) => ({
    value: v.name,
    label: v.name,
  }));

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
      date: string;
    }>;

    // Check if we have any data to prefill
    if (!state.property && !state.property_id && !state.unit && !state.task && !state.description && !state.fto_id && !state.date)
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
      loadTasksForProperty(propertyId);
    }

    // Set initial values immediately
    // Note: taskId will be set from state.fto_id if available, but will be updated once FTOs load
    setHourEntries((prev) =>
      prev.map((entry, idx) => {
        if (idx !== 0) return entry;
        return {
          ...entry,
          date: state.date ?? entry.date,
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
          date: state.date ?? entry.date,
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
    // Note: Go backend serializes FTOID without a json tag, so it may arrive as "FTOID" or "fto_id"
    const submissionPropertyId = submission.property_id;
    const submissionUnitId = submission.unit_id;
    const submissionFtoId = submission.fto_id ?? submission.FTOID;
    
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
      // Prefer the unit saved on this entry. Fall back to the legacy unit-name
      // field, then to the submission-level (FTO) unit for older rows that
      // never persisted a per-entry unit.
      const entryUnitId =
        h.unit_id != null
          ? String(h.unit_id)
          : (h.unit ?? (submissionUnitId && entryPropertyId === String(submissionPropertyId) ? String(submissionUnitId) : null));
      // For viewing submissions, always use submission-level fto_id to ensure consistency
      // If hour has a task_id, prefer it, but fall back to submission fto_id
      const entryTaskId = h.task_id ? String(h.task_id) : (submissionFtoId ? String(submissionFtoId) : null);
      
      return {
        id: `hour-${idx}`,
        isExpanded: true,

        date: h.date_of_work?.split("T")[0] ?? null,
        propertyId: entryPropertyId,
        locationId: h.location_id ? String(h.location_id) : null,
        unitId: entryUnitId, // Will be mapped to ID later if it's a name
        taskId: entryTaskId,
        customTaskName: "",
        collaboratorIds: null as CollaboratorSelection,

        hours: h.hours_decimal,
        emergencyRate: h.emergency ? "yes" : "no",
        billing: noChargeToBilling(h.no_charge),

        note: h.note ?? "",
        dumpRun: h.is_dump_run ?? false,
        gasCharge: h.is_gas_charge ?? false,
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
      // Prefer the unit saved on this expense. Fall back to the legacy
      // unit-name field, then to the submission-level (FTO) unit.
      const entryUnitId =
        m.unit_id != null
          ? String(m.unit_id)
          : (m.unit ?? (submissionUnitId && entryPropertyId === String(submissionPropertyId) ? String(submissionUnitId) : null));
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
        locationId: m.location_id ? String(m.location_id) : null,
        unitId: entryUnitId, // Will be mapped to ID later if it's a name
        taskId: entryTaskId,

        amount: m.amount_cents / 100,
        chargeType: m.is_avm_expense ? "avm-expense" : "client-expense",
        paymentMethod:
          m.payment_method === "personal_card" ? "personal_card" : "company_card",
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
      loadTasksForProperty(String(submissionPropertyId));
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
      prev.map((entry) => {
        // If unitId is a legacy unit name (not numeric), map it to its ID.
        if (entry.unitId && entry.propertyId && isNaN(Number(entry.unitId))) {
          const mappedId = findUnitIdByName(entry.propertyId, entry.unitId);
          if (mappedId) {
            return { ...entry, unitId: mappedId };
          }
        }
        // Legacy rows with no per-entry unit: fall back to the submission-level
        // (FTO) unit for any entry on the submission's property.
        if (!entry.unitId && submissionUnitId && entry.propertyId === String(submissionPropertyId)) {
          return { ...entry, unitId: String(submissionUnitId) };
        }
        // Concierge properties book at "Property Level" (unit 0). Older
        // submissions dropped that 0 on save, leaving the unit blank. Restore
        // it so the Unit field shows a value and passes validation.
        if (!entry.unitId && entry.propertyId) {
          const prop = properties.find((p) => String(p.id) === entry.propertyId);
          if (prop?.property_type === "C") {
            return { ...entry, unitId: String(PROPERTY_LEVEL_UNIT_ID) };
          }
        }
        return entry;
      })
    );

    // Update expense entries with unit IDs
    setExpenseEntries((prev) =>
      prev.map((entry) => {
        // If unitId is a legacy unit name (not numeric), map it to its ID.
        if (entry.unitId && entry.propertyId && isNaN(Number(entry.unitId))) {
          const mappedId = findUnitIdByName(entry.propertyId, entry.unitId);
          if (mappedId) {
            return { ...entry, unitId: mappedId };
          }
        }
        // Legacy rows with no per-entry unit: fall back to the submission-level
        // (FTO) unit for any entry on the submission's property.
        if (!entry.unitId && submissionUnitId && entry.propertyId === String(submissionPropertyId)) {
          return { ...entry, unitId: String(submissionUnitId) };
        }
        // Concierge properties book at "Property Level" (unit 0). Older
        // submissions dropped that 0 on save, leaving the unit blank. Restore
        // it so the Unit field shows a value and passes validation.
        if (!entry.unitId && entry.propertyId) {
          const prop = properties.find((p) => String(p.id) === entry.propertyId);
          if (prop?.property_type === "C") {
            return { ...entry, unitId: String(PROPERTY_LEVEL_UNIT_ID) };
          }
        }
        return entry;
      })
    );
  }, [apiSubmission, unitsByProperty, properties]);
  

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
      loadTasksForProperty(pid);
    });
  }, [apiSubmission]);

  /**
   * Seed the Task field from the task each selected FTO is already linked to.
   * Only fills keys that are absent, so a re-render never clobbers a pick the
   * user has made (including an explicit "— None —").
   */
  useEffect(() => {
    const seeds: Record<string, number | null> = {};

    const consider = (entry: {
      taskId: string | null;
      propertyId: string | null;
      customTaskName?: string;
    }) => {
      const key = ftoLinkKey(entry);
      // Inline ("custom:") FTOs don't exist yet, so they have nothing to seed from.
      if (!key || !key.startsWith("fto:")) return;
      const ftoId = Number(key.slice("fto:".length));
      const fto = (ftosByProperty[entry.propertyId ?? ""] ?? []).find(
        (f) => f.id === ftoId
      );
      if (!fto) return;
      seeds[key] = fto.task_id ?? null;
    };

    hourEntries.forEach(consider);
    expenseEntries.forEach(consider);

    if (Object.keys(seeds).length === 0) return;

    setTaskByFtoKey((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const [key, taskId] of Object.entries(seeds)) {
        if (!(key in next)) {
          next[key] = taskId;
          changed = true;
        }
      }
      return changed ? next : prev; // identity-stable: avoids a re-render loop
    });
  }, [hourEntries, expenseEntries, ftosByProperty]);
  
  
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
      const submissionFtoId = submission.fto_id ?? submission.FTOID;
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
  
      const effectiveUserId = isSubmitAsAdmin && submitAsTechId != null ? submitAsTechId : userId;
      const params = new URLSearchParams({
        property_id: String(Number(propertyId)),
        field_team_member_id: String(effectiveUserId),
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

  /** Load this property's tasks (all statuses) for the optional Task field. */
  const loadTasksForProperty = async (propertyId: string) => {
    if (tasksByProperty[propertyId]) return; // cached

    try {
      setTasksLoading((prev) => ({ ...prev, [propertyId]: true }));

      const data: SimpleTask[] = await fetchJSON(
        `/maintenance/tasks?property_id=${Number(propertyId)}&limit=200`
      );

      setTasksByProperty((prev) => ({
        ...prev,
        [propertyId]: data || [],
      }));
    } catch (err) {
      console.error("Failed to load tasks", err);
      setTasksByProperty((prev) => ({
        ...prev,
        [propertyId]: [],
      }));
    } finally {
      setTasksLoading((prev) => ({ ...prev, [propertyId]: false }));
    }
  };

  const getTaskOptions = (
    propertyId: string | null,
    selectedTaskId: number | null
  ) => buildTaskOptions(tasksByProperty[propertyId ?? ""] ?? [], selectedTaskId);

  /** Record a Task pick: onto the FTO when there is one, else staged on the entry. */
  const setTaskPick = (
    entryId: string,
    linkKey: string | null,
    taskId: number | null
  ) => {
    if (linkKey) {
      setTaskByFtoKey((prev) => ({ ...prev, [linkKey]: taskId }));
    } else {
      setStagedTaskByEntry((prev) => ({ ...prev, [entryId]: taskId }));
    }
  };

  /**
   * Promote a task picked before the field team order was chosen onto the FTO
   * just selected. Runs in the same handler as the FTO update, so the seeding
   * effect sees the key already populated and won't overwrite it with whatever
   * task the FTO previously had.
   */
  const promoteStagedTask = (entryId: string, newFtoValue: string) => {
    if (!(entryId in stagedTaskByEntry)) return;
    const ftoId = Number(newFtoValue);
    if (!Number.isFinite(ftoId) || ftoId <= 0) return; // custom/misc: stays staged
    const staged = stagedTaskByEntry[entryId];
    setTaskByFtoKey((prev) => ({ ...prev, [`fto:${ftoId}`]: staged }));
    setStagedTaskByEntry((prev) => {
      const next = { ...prev };
      delete next[entryId];
      return next;
    });
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
        dumpRun: false,
        gasCharge: false,
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
        locationId: null,
        unitId: null,
        taskId: null,
        amount: "",
        chargeType: "client-expense",
        paymentMethod: "company_card",
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

  // vendorOptions is computed from live backend data above

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
        errors.taskId = "Field team order is required";
        isValid = false;
      } else if (entry.taskId === CUSTOM_FTO_TASK_VALUE) {
        if (!entry.customTaskName?.trim()) {
          errors.taskId = "Name is required for a custom field team order.";
          isValid = false;
        }
        if (!isCollaboratorSelectionValid(entry.collaboratorIds)) {
          errors.collaboratorIds = "Collaborators selection is required for a custom field team order.";
          isValid = false;
        }
        if (!entry.note?.trim()) {
          errors.note = "Notes are required for a custom field team order (used as FTO description).";
          isValid = false;
        }
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
        errors.taskId = "Field team order is required";
        isValid = false;
      } else if (isPendingFtoValue(entry.taskId)) {
        const name = extractPendingFtoName(entry.taskId);
        const stillExists = pendingCustomFtos.some(
          (p) => p.propertyId === entry.propertyId && p.customTaskName === name
        );
        if (!stillExists) {
          errors.taskId = "The referenced custom field team order no longer exists. Please select a different one.";
          isValid = false;
        }
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

  const isCollaboratorSelectionValid = (v: CollaboratorSelection): boolean =>
    v === "na" || (Array.isArray(v) && v.length > 0);


  // Block submit when any expense has a file that is still uploading or doesn't have storage_path yet.
  const hasPendingAttachmentUploads = expenseEntries.some((e) =>
    e.files.some((f) => f.uploading === true || !f.storage_path)
  );

  /**
   * Persist each Task selection onto its field team order
   * (field_team_orders.task_id) via PATCH /maintenance/ftos/{id}, where a
   * task_id of 0 unlinks. See planFtoTaskLinkWrites for what gets written.
   *
   * Throws on failure so the caller aborts the submission rather than silently
   * dropping the association.
   */
  const syncFtoTaskLinks = async (
    hours: HourEntry[],
    expenses: ExpenseEntry[]
  ) => {
    const wanted = planFtoTaskLinkWrites(
      [...hours, ...expenses],
      taskByFtoKey,
      ftosByProperty,
      stagedTaskByEntry
    );

    for (const [ftoId, taskId] of wanted) {
      await fetchJSON(`/maintenance/ftos/${ftoId}`, {
        method: "PATCH",
        body: JSON.stringify({ task_id: taskId }),
      });
    }

    if (wanted.size > 0) {
      // Keep the FTO cache honest so a second submit doesn't re-PATCH.
      setFtosByProperty((prev) => {
        const next: Record<string, FTO[]> = {};
        for (const [propId, list] of Object.entries(prev)) {
          next[propId] = list.map((f) =>
            wanted.has(f.id)
              ? { ...f, task_id: wanted.get(f.id) || null }
              : f
          );
        }
        return next;
      });
    }
  };

  const createPendingFtosAndSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Step 1: Collect unique custom FTOs to create
      const toCreate = new Map<
        string,
        { propertyId: string; customTaskName: string; sourceEntry: HourEntry }
      >();

      for (const entry of hourEntries) {
        if (
          entry.taskId === CUSTOM_FTO_TASK_VALUE &&
          entry.propertyId &&
          entry.customTaskName.trim()
        ) {
          const key = `${entry.propertyId}::${entry.customTaskName.trim()}`;
          if (!toCreate.has(key)) {
            toCreate.set(key, {
              propertyId: entry.propertyId,
              customTaskName: entry.customTaskName.trim(),
              sourceEntry: entry,
            });
          }
        }
      }

      // Step 2: Create each FTO, build mapping
      const ftoIdMap = new Map<string, number>();
      const techId =
        isSubmitAsAdmin && submitAsTechId != null ? submitAsTechId : userId;
      const techIdNum = Number(techId);

      for (const [key, info] of toCreate) {
        const { sourceEntry } = info;
        const propertyIdNum = Number(info.propertyId);
        const unitIdNum = sourceEntry.unitId ? Number(sourceEntry.unitId) : null;

        const collaboratorIds =
          sourceEntry.collaboratorIds === "na" ||
          !Array.isArray(sourceEntry.collaboratorIds)
            ? []
            : sourceEntry.collaboratorIds;

        // Task picked for this inline FTO — either against its custom key, or
        // staged on the entry if it was chosen before the "+ Add" was named.
        const linkedTaskId =
          resolveTaskPick(
            sourceEntry.id,
            `custom:${info.propertyId}::${info.customTaskName}`,
            taskByFtoKey,
            stagedTaskByEntry
          ) ?? null;

        const payload = {
          property_id: propertyIdNum,
          unit_id:
            unitIdNum && !Number.isNaN(unitIdNum) ? unitIdNum : undefined,
          name: info.customTaskName,
          description: sourceEntry.note.trim(),
          status: "completed",
          due_date: new Date(sourceEntry.date!).toISOString(),
          priority: "normal",
          field_team_member_ids: [techIdNum, ...collaboratorIds],
          pm_assignee_ids: [] as number[],
          source: "submission_form",
          ...(linkedTaskId ? { task_id: linkedTaskId } : {}),
        };

        const created: any = await fetchJSON("/maintenance/ftos", {
          method: "POST",
          body: JSON.stringify(payload),
        });

        const createdId =
          created?.id ?? created?.fto?.id ?? created?.data?.id ?? null;
        if (!createdId) {
          throw new Error(
            `Failed to create FTO "${info.customTaskName}" — no ID returned.`
          );
        }

        ftoIdMap.set(key, Number(createdId));

        const createdName =
          created?.name ??
          created?.fto?.name ??
          created?.data?.name ??
          info.customTaskName;

        // Update ftosByProperty cache
        setFtosByProperty((prev) => {
          const propKey = String(info.propertyId);
          const existing = prev[propKey] ?? [];
          if (existing.some((f) => String(f.id) === String(createdId)))
            return prev;
          return {
            ...prev,
            [propKey]: [
              ...existing,
              {
                id: Number(createdId),
                name: String(createdName),
                description: payload.description,
                property_id: propertyIdNum,
                property_name: "",
                status: payload.status,
                priority: payload.priority,
                approval_status: "",
                form_submission_status: "none",
                task_id: linkedTaskId,
              } as FTO,
            ],
          };
        });

        // Carry the task selection from the pre-create key onto the real FTO id,
        // so the field still shows it after submit. It matches what the create
        // payload already sent, so syncFtoTaskLinks sees no diff and skips it.
        setTaskByFtoKey((prev) => ({
          ...prev,
          [`fto:${createdId}`]: linkedTaskId,
        }));

        // Incrementally update state so partial progress is saved on failure
        setHourEntries((prev) =>
          prev.map((h) => {
            if (
              h.taskId === CUSTOM_FTO_TASK_VALUE &&
              h.propertyId === info.propertyId &&
              h.customTaskName.trim() === info.customTaskName
            ) {
              return {
                ...h,
                taskId: String(createdId),
                customTaskName: "",
                collaboratorIds: null,
              };
            }
            return h;
          })
        );
        setExpenseEntries((prev) =>
          prev.map((e) => {
            if (
              isPendingFtoValue(e.taskId) &&
              e.propertyId === info.propertyId &&
              extractPendingFtoName(e.taskId!) === info.customTaskName
            ) {
              return { ...e, taskId: String(createdId) };
            }
            return e;
          })
        );
      }

      // Step 3: Build resolved copies for the API call (state updates are async)
      const resolvedHours = hourEntries.map((h) => {
        if (
          h.taskId === CUSTOM_FTO_TASK_VALUE &&
          h.propertyId &&
          h.customTaskName.trim()
        ) {
          const k = `${h.propertyId}::${h.customTaskName.trim()}`;
          const realId = ftoIdMap.get(k);
          if (realId) return { ...h, taskId: String(realId) };
        }
        return h;
      });

      const resolvedExpenses = expenseEntries.map((e) => {
        if (isPendingFtoValue(e.taskId)) {
          const name = extractPendingFtoName(e.taskId!);
          const k = `${e.propertyId}::${name}`;
          const realId = ftoIdMap.get(k);
          if (realId) return { ...e, taskId: String(realId) };
        }
        return e;
      });

      // Step 4: Submit with resolved entries
      await submitDailyWork(resolvedHours, resolvedExpenses);
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitDailyWork = async (
    hoursOverride?: HourEntry[],
    expensesOverride?: ExpenseEntry[]
  ) => {
    const hourEntries_ = hoursOverride ?? hourEntries;
    const expenseEntries_ = expensesOverride ?? expenseEntries;
    // Check if submission is approved - cannot edit approved submissions
    if (isApproved) {
      alert("You can no longer update approved submissions.");
      return;
    }

    if (hasPendingAttachmentUploads) {
      alert(
        "Please wait for all attachments to finish uploading before submitting. If an upload failed, remove the file and try again or add it again."
      );
      return;
    }

    // Write the Task links onto their FTOs BEFORE the submission itself: the
    // server derives fto_submissions.task_id from field_team_orders.task_id at
    // create time, so a link written afterwards would land stale.
    await syncFtoTaskLinks(hourEntries_, expenseEntries_);

    const techId =
      isSubmitAsAdmin && submitAsTechId != null
        ? submitAsTechId
        : userId;

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

      const hours_json = hourEntries_.map((h, idx) => ({
        date_of_work: formatDate(h.date),
        hours_decimal: Number(h.hours) || 0,
        note: h.note ?? "",
        no_charge: billingToNoCharge(h.billing),
        emergency: h.emergencyRate === "yes",
        is_dump_run: h.dumpRun,
        is_gas_charge: h.gasCharge,
        hour_index: idx,
        unit_id: getUnitIdAsNumber(h.unitId),
      }));

      const materials_json = expenseEntries_.map((e, idx) => ({
        date_of_work: formatDate(e.date),
        vendor_name: e.vendorId ?? null,
        note: e.note ?? "",
        is_avm_expense: e.chargeType === "avm-expense",
        amount_cents: Math.round((Number(e.amount) || 0) * 100),
        payment_method: e.paymentMethod,
        material_index: idx,
        unit_id: getUnitIdAsNumber(e.unitId),
      }));

      // Derive submission-level property / unit / FTO from the first entry so
      // the backend can keep the linked FTO (field_team_orders) in sync with
      // edits made here. Per-line values still live inside hours_json /
      // materials_json; these top-level fields drive the FTO write-back.
      const primary = hourEntries_[0] ?? expenseEntries_[0];
      const primaryPropertyId = primary?.propertyId
        ? Number(primary.propertyId)
        : undefined;
      const primaryUnitId =
        primary?.unitId != null &&
        primary.unitId !== "" &&
        !Number.isNaN(Number(primary.unitId))
          ? Number(primary.unitId)
          : undefined;
      const primaryFtoId =
        primary?.taskId &&
        !Number.isNaN(Number(primary.taskId)) &&
        Number(primary.taskId) > 0
          ? Number(primary.taskId)
          : undefined;

      await fetchJSON(`/maintenance/submissions/${submissionIdNum}`, {
        method: "PATCH",
        body: JSON.stringify({
          hours_json,
          materials_json,
          property_id: primaryPropertyId,
          unit_id: primaryUnitId,
          fto_id: primaryFtoId,
        }),
      });
      return;
    }

    // POST endpoint - create new submission
    // Send date_of_work as date-only (YYYY-MM-DD) to avoid timezone shifting when stored
    const toDateOnly = (dateStr: string | null | undefined): string =>
      !dateStr ? "" : dateStr.includes("T") ? dateStr.split("T")[0] : dateStr;
    const hours = hourEntries_.map((h) => ({
      fto_id: Number(h.taskId), // taskId === FTO id (by design)

      date_of_work: toDateOnly(h.date ?? undefined) || h.date!,

      property_id: h.propertyId ? Number(h.propertyId) : null,
      location_id: h.locationId ? Number(h.locationId) : null,
      unit_id: getUnitIdAsNumber(h.unitId),
      task_id: Number(h.taskId), // optional but fine to include

      hours_decimal: Number(h.hours),

      emergency: h.emergencyRate === "yes",
      no_charge: billingToNoCharge(h.billing),
      is_dump_run: h.dumpRun,
      is_gas_charge: h.gasCharge,

      note: h.note ?? "",
    }));

    const expenses = expenseEntries_.map((e) => ({
      fto_id: Number(e.taskId),
      date_of_work: toDateOnly(e.date ?? undefined) || e.date!,
      property_id: Number(e.propertyId),
      location_id: e.locationId ? Number(e.locationId) : null,
      unit_id: getUnitIdAsNumber(e.unitId),
      amount: Number(e.amount),
      is_avm_expense: e.chargeType === "avm-expense",
      note: e.note,
      expense_type: e.chargeType,        // string | null
      vendor_name: e.vendorId,           // string | null (id or custom input)
      payment_method: e.paymentMethod,   // "company_card" | "personal_card"
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

          {isSubmitAsAdmin && (
            <div className="rounded-xl bg-white border border-[#E5E5E5] shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-4">
              <SelectField
                label="Submit as"
                options={usersForSubmitAs.map((u) => ({
                  value: String(u.id),
                  label: u.name,
                }))}
                value={submitAsTechId != null ? String(submitAsTechId) : ""}
                onChange={(value) => setSubmitAsTechId(value ? Number(value) : null)}
              />
            </div>
          )}

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
                    {/* Entry Header - expand area not in tab order so Tab goes to first field */}
                    <div className="flex items-center justify-between pr-3 relative">
                      <div
                        role="button"
                        tabIndex={-1}
                        className="flex items-center gap-2 cursor-pointer"
                        onClick={() => toggleHourEntry(entry.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            toggleHourEntry(entry.id);
                          }
                        }}
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
                          type="button"
                          onClick={() => deleteHourEntry(entry.id)}
                          className="text-[#982740] hover:opacity-70 transition-opacity p-1"
                          aria-label="Delete hour entry"
                        >
                          <DeleteIcon width={16} height={16} />
                        </button>
                      )}
                    </div>

                    {index < hourEntries.length - 1 && (
                      <div className="h-px w-full bg-[#E5E5E5] mt-4" />
                    )}

                    {/* Expanded Content - original flex layout; tab order follows DOM (Date → Property → Unit → Task → …) */}
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
                              date instanceof Date ? toLocalDateString(date) : date,
                            );
                          }}
                          placeholder="mm/dd/yyyy"
                          returnFormat="ISO"
                          disabled={isApproved}
                        />

                        {/* Property and Unit Row */}
                        <div className="flex flex-col lg:flex-row gap-3">
                          <div className="flex-1">
                            <PropertyLocationCombobox
                                    label="Property"
                                    required
                                    error={hourErrors[entry.id]?.propertyId}
                                    properties={properties}
                                    propertyId={entry.propertyId ? Number(entry.propertyId) : null}
                                    locationId={entry.locationId ? Number(entry.locationId) : null}
                                    onChange={({ propertyId, locationId }) => {
                                        if (isApproved) return;
                                        updateHourEntry(entry.id, "propertyId", propertyId ? String(propertyId) : null);
                                        updateHourEntry(entry.id, "locationId", locationId ? String(locationId) : null);
                                        const selectedProp = propertyId
                                          ? properties.find((p) => p.id === propertyId)
                                          : null;
                                        const defaultUnitId =
                                          selectedProp?.property_type === "C"
                                            ? String(PROPERTY_LEVEL_UNIT_ID)
                                            : null;
                                        updateHourEntry(entry.id, "unitId", defaultUnitId);
                                        updateHourEntry(entry.id, "taskId", null);
                                        updateHourEntry(entry.id, "customTaskName", "");
                                        if (propertyId) {
                                          loadFtosForProperty(String(propertyId));
                                          loadUnitsForProperty(String(propertyId));
                                          loadTasksForProperty(String(propertyId));
                                        }
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
                              required
                              error={hourErrors[entry.id]?.unitId}
                              options={getUnitOptions(entry.propertyId)}
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
                              placeholder={
                                !entry.propertyId
                                  ? "Select property first"
                                  : unitsLoading[entry.propertyId ?? ""]
                                  ? "Loading units…"
                                  : "Select Unit"
                              }
                              disabled={!entry.propertyId || unitsLoading[entry.propertyId ?? ""] || isApproved}
                            />
                          </div>
                        </div>

                        <SelectField
                            label="Field Team Order"
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
                                  const submissionFtoId = apiSubmission.submission.fto_id ?? apiSubmission.submission.FTOID;
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
                                if (isApproved) return;
                                updateHourEntry(entry.id, "taskId", value);
                                promoteStagedTask(entry.id, String(value));
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
                                ? "Loading field team orders..."
                                : !entry.propertyId
                                    ? "Select Property First"
                                    : "Select Field Team Order"
                            }
                            disabled={!entry.propertyId || ftosLoading || isApproved}
                        />

                        {/* Optional task the field team order belongs to. Usable as
                            soon as a property is picked; the pick is applied to
                            whichever FTO is chosen (see promoteStagedTask). */}
                        {(() => {
                          const linkKey = ftoLinkKey(entry);
                          const selectedTaskId =
                            resolveTaskPick(
                              entry.id,
                              linkKey,
                              taskByFtoKey,
                              stagedTaskByEntry
                            ) ?? null;
                          const noTasks =
                            (tasksByProperty[entry.propertyId ?? ""] ?? []).length === 0;
                          return (
                            <SelectField
                              label="Task"
                              options={getTaskOptions(entry.propertyId, selectedTaskId)}
                              value={selectedTaskId ? String(selectedTaskId) : ""}
                              onChange={(value) => {
                                if (isApproved) return;
                                const v = Array.isArray(value) ? value[0] : value;
                                setTaskPick(entry.id, linkKey, v ? Number(v) : null);
                              }}
                              placeholder={
                                !entry.propertyId
                                  ? "Select Property First"
                                  : tasksLoading[entry.propertyId ?? ""]
                                    ? "Loading tasks…"
                                    : noTasks
                                      ? "No open tasks for this property"
                                      : "Select Task"
                              }
                              disabled={
                                !entry.propertyId ||
                                tasksLoading[entry.propertyId ?? ""] ||
                                noTasks ||
                                isApproved
                              }
                            />
                          );
                        })()}

                        {entry.taskId === CUSTOM_FTO_TASK_VALUE && (
                          <TextField
                            label="Field Team Order name"
                            required
                            value={entry.customTaskName}
                            onChange={(e) => {
                              if (isApproved) return;
                              updateHourEntry(entry.id, "customTaskName", e.target.value);
                              updateHourEntry(entry.id, "note", e.target.value);
                            }}
                            placeholder="Type a custom field team order name"
                            disabled={isApproved}
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
                              key="collaborators"
                              label="Collaborators"
                              required
                              value={selectedCollaborators}
                              onChange={(selected) => {
                                if (isApproved) return;
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
                              disabled={isApproved}
                              autoCloseOn={(sel) => sel.some((s) => s.id === "na")}
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

                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={entry.dumpRun}
                            onCheckedChange={(checked) =>
                              updateHourEntry(entry.id, "dumpRun", checked === true)
                            }
                            disabled={isApproved}
                            id={`dump-run-${entry.id}`}
                          />
                          <label
                            htmlFor={`dump-run-${entry.id}`}
                            className="text-sm text-[#303030]"
                          >
                            Dump Run
                          </label>
                        </div>

                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={entry.gasCharge}
                            onCheckedChange={(checked) =>
                              updateHourEntry(entry.id, "gasCharge", checked === true)
                            }
                            disabled={isApproved}
                            id={`gas-charge-${entry.id}`}
                          />
                          <label
                            htmlFor={`gas-charge-${entry.id}`}
                            className="text-sm text-[#303030]"
                          >
                            Gas Charge
                          </label>
                        </div>

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
                    {/* Entry Header - expand area not in tab order so Tab goes to first field */}
                    <div className="flex items-center justify-between pr-3">
                      <div
                        role="button"
                        tabIndex={-1}
                        className="flex items-center gap-2 cursor-pointer"
                        onClick={() => toggleExpenseEntry(entry.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            toggleExpenseEntry(entry.id);
                          }
                        }}
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
                          type="button"
                          onClick={() => deleteExpenseEntry(entry.id)}
                          className="text-[#982740] hover:opacity-70 transition-opacity p-1"
                          aria-label="Delete expense entry"
                        >
                          <DeleteIcon width={16} height={16} />
                        </button>
                      )}
                    </div>

                    {index < expenseEntries.length - 1 && (
                      <div className="h-px w-full bg-[#E5E5E5] mt-4" />
                    )}

                    {/* Expanded Content - original flex layout; tab order follows DOM */}
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
                              date instanceof Date ? toLocalDateString(date) : date,
                            );
                          }}
                          placeholder="mm/dd/yyyy"
                          returnFormat="ISO"
                          disabled={isApproved}
                        />

                        {/* Property and Unit Row */}
                        <div className="flex flex-col lg:flex-row gap-3">
                          <div className="flex-1">
                            <PropertyLocationCombobox
                                label="Property"
                                required
                                error={expenseErrors[entry.id]?.propertyId}
                                properties={properties}
                                propertyId={entry.propertyId ? Number(entry.propertyId) : null}
                                locationId={entry.locationId ? Number(entry.locationId) : null}
                                onChange={({ propertyId, locationId }) => {
                                    if (isApproved) return;
                                    updateExpenseEntry(entry.id, "propertyId", propertyId ? String(propertyId) : null);
                                    updateExpenseEntry(entry.id, "locationId", locationId ? String(locationId) : null);
                                    const selectedProp = propertyId
                                      ? properties.find((p) => p.id === propertyId)
                                      : null;
                                    const defaultUnitId =
                                      selectedProp?.property_type === "C"
                                        ? String(PROPERTY_LEVEL_UNIT_ID)
                                        : null;
                                    updateExpenseEntry(entry.id, "unitId", defaultUnitId);
                                    updateExpenseEntry(entry.id, "taskId", null);
                                    if (propertyId) {
                                      loadFtosForProperty(String(propertyId));
                                      loadUnitsForProperty(String(propertyId));
                                      loadTasksForProperty(String(propertyId));
                                    }
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
                              required
                              error={expenseErrors[entry.id]?.unitId}
                              options={getUnitOptions(entry.propertyId)}
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
                              placeholder={
                                !entry.propertyId
                                  ? "Select property first"
                                  : unitsLoading[entry.propertyId ?? ""]
                                  ? "Loading units…"
                                  : "Select Unit"
                              }
                              disabled={!entry.propertyId || unitsLoading[entry.propertyId ?? ""] || isApproved}
                            />
                          </div>
                        </div>

                        <SelectField
                            label="Field Team Order"
                            required
                            error={expenseErrors[entry.id]?.taskId}
                            options={[
                              // Add "Misc" option at the top for miscellaneous expenses
                              { value: MISC_EXPENSE_TASK_VALUE, label: "Misc (No FTO)" },
                              // Pending custom FTOs from hour entries for this property
                              ...pendingCustomFtos
                                .filter((p) => p.propertyId === entry.propertyId)
                                .map((p) => ({
                                  value: makePendingFtoValue(p.customTaskName),
                                  label: `${p.customTaskName} (new)`,
                                })),
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

                              // Check if this references a pending custom FTO
                              if (isPendingFtoValue(entry.taskId)) {
                                const name = extractPendingFtoName(entry.taskId!);
                                const stillExists = pendingCustomFtos.some(
                                  (p) => p.propertyId === entry.propertyId && p.customTaskName === name
                                );
                                return stillExists ? entry.taskId! : "";
                              }

                              // For existing misc submissions, check if fto_id is null/0
                              if (isViewingExistingSubmission && apiSubmission) {
                                const submissionFtoId = apiSubmission.submission.fto_id ?? apiSubmission.submission.FTOID;
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
                                  const submissionFtoId = apiSubmission.submission.fto_id ?? apiSubmission.submission.FTOID;
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
                                if (isApproved) return;
                                updateExpenseEntry(entry.id, "taskId", value);
                                promoteStagedTask(entry.id, String(value));
                                if (value === MISC_EXPENSE_TASK_VALUE) {
                                  updateExpenseEntry(entry.id, "chargeType", "avm-expense");
                                }
                            }}
                            placeholder={
                                ftosLoading
                                ? "Loading field team orders..."
                                : !entry.propertyId
                                    ? "Select Property First"
                                    : "Select Field Team Order"
                            }
                            disabled={!entry.propertyId || ftosLoading || isApproved}
                        />

                        {/* Optional task the field team order belongs to. Usable as soon
                            as a property is picked, except on "Misc (No FTO)" lines —
                            those never get an FTO, so there is nothing to attach to. */}
                        {(() => {
                          const linkKey = ftoLinkKey(entry);
                          const selectedTaskId =
                            resolveTaskPick(
                              entry.id,
                              linkKey,
                              taskByFtoKey,
                              stagedTaskByEntry
                            ) ?? null;
                          const isMisc = entry.taskId === MISC_EXPENSE_TASK_VALUE;
                          const noTasks =
                            (tasksByProperty[entry.propertyId ?? ""] ?? []).length === 0;
                          return (
                            <SelectField
                              label="Task"
                              options={getTaskOptions(entry.propertyId, selectedTaskId)}
                              value={selectedTaskId ? String(selectedTaskId) : ""}
                              onChange={(value) => {
                                if (isApproved || isMisc) return;
                                const v = Array.isArray(value) ? value[0] : value;
                                setTaskPick(entry.id, linkKey, v ? Number(v) : null);
                              }}
                              placeholder={
                                !entry.propertyId
                                  ? "Select Property First"
                                  : isMisc
                                    ? "Not available for misc expenses"
                                    : tasksLoading[entry.propertyId ?? ""]
                                      ? "Loading tasks…"
                                      : noTasks
                                        ? "No open tasks for this property"
                                        : "Select Task"
                              }
                              disabled={
                                !entry.propertyId ||
                                isMisc ||
                                tasksLoading[entry.propertyId ?? ""] ||
                                noTasks ||
                                isApproved
                              }
                            />
                          );
                        })()}

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

                        <SelectField
                          label="Card"
                          required
                          options={CARD_OPTIONS}
                          value={entry.paymentMethod}
                          onChange={(value) => {
                            if (isApproved) return;
                            updateExpenseEntry(
                              entry.id,
                              "paymentMethod",
                              value,
                            );
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
                          onOpenChange={handleVendorOpenChange}
                          onSearchChange={handleVendorSearchChange}
                          onLoadMore={handleVendorLoadMore}
                          optionsLoading={vendorLoading}
                          hasMore={vendorHasMore}
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

                            // Show files as uploading immediately so submit is blocked until done
                            updateExpenseEntry(entry.id, "files", [
                              ...entry.files,
                              ...newFiles.map((f) => ({
                                ...f,
                                uploading: true,
                              })),
                            ]);

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

                                  const res = await authFetch(
                                    "/vendors/bills/upload-pdf",
                                    {
                                      method: "POST",
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
                                  const message =
                                    err instanceof Error
                                      ? err.message
                                      : "Upload failed";
                                  return {
                                    ...item,
                                    uploading: false,
                                    error: message,
                                  };
                                }
                              })
                            );

                            // Replace the "uploading" placeholders with upload results
                            updateExpenseEntry(entry.id, "files", [
                              ...entry.files.filter((f) => !f.uploading),
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
                                authFetch(
                                  `/maintenance/attachments/${attachmentId}`
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
                                authFetch(
                                  `/files?key=${encodeURIComponent(
                                    file.storage_path
                                  )}`
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
                                  const res = await authFetch(
                                    `/maintenance/attachments/${attachmentId}`
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
                                const res = await authFetch(
                                  `/files?key=${encodeURIComponent(
                                    file.storage_path
                                  )}`
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
                disabled={hasPendingAttachmentUploads || isSubmitting}
                onClick={async () => {
                  if (!validateForm()) return;
                  if (hasPendingAttachmentUploads) return;
                  try {
                    await createPendingFtosAndSubmit();
                    navigate("/fto");
                  } catch (err) {
                    console.error(err);
                    alert("Failed to submit work");
                  }
                }}
                className="rounded-lg bg-[#013764] border border-white shadow-[0_0_0_1px_#002D5A] px-3 py-2 min-h-[36px] flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span
                  className="text-base text-white font-medium"
                  style={{
                    fontFamily:
                      "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                  }}
                >
                  {hasPendingAttachmentUploads
                    ? "Uploading…"
                    : isSubmitting
                    ? "Submitting…"
                    : "Submit"}
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
