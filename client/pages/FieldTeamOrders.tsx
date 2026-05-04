import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import CreateFTOModal from "@/components/CreateFTOModal";
import MergeFTOsModal from "@/components/MergeFTOsModal";
import PageHeader from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { usePageState } from "@/hooks/usePageState";
import { useTabContext } from "@/hooks/useTabContext";
import { useSortingTable } from "@/hooks/useSortingTable";
import { useColumnManagement } from "@/hooks/useColumnManagement";
import ColumnFilterModal from "@/components/ColumnFilterModal";
import GlobalTable from "@/components/GlobalTable";
import PageTemplate from "@/layout/PageTemplate";
import { fetchJSON } from "@/api/fetchJSON";
import { toast } from "sonner";
import { formatUnitLabel, formatUnitDisplayForTable, UNIT_EMPTY_DISPLAY } from "@/utils/unitLabel";
import HoursSummaryDrawer from "@/components/HoursSummaryDrawer";
import { cn } from "@/lib/utils";
import {
  EditIcon,
  DeleteIcon,
  ApproveIcon,
  PlusIcon,
  BuildingIcon,
  NoteIcon,
  CalendarIcon,
  DotsIcon,
  DocumentIcon,
  DollarIcon,
  UserIcon,
  FlagIcon,
  HamburgerIcon,
  EyeIcon,
  WarningIcon,
} from "@/components/icons";

interface FieldTeamOrder {
  id: number;
  taskId: number;
  /** Real task FK (nullable). Use for modal/update, not taskId. */
  task_id?: number | null;
  property: string;
  property_id: number | null;
  description: string;
  dueDate: string;
  due_date: string;
  priority: "low" | "normal" | "high";
  fieldTeam: Array<{
    id: number;
    initials: string;
    name: string;
    color: string;
  }>;
  
  field_team_member_ids: number[];
  status: "Dispatched" | "Completed" | "New" | "pending-approval";
  originalStatus: string; // Original API status for modal
  timesheetStatus:
    | "awaiting-submission"
    | "submitted"
    | "rejected"
    | "approved";
  amount: number;
  unit?: string;
  fieldTeamAssignee?: string;
  task?: string;
  name: string;
  pm_assignee_ids: number[];
  hours?: number;
  event_start_at?: string | null;
  event_end_at?: string | null;
  bill_id?: number | null;
  bill_draft_id?: number | null;
  form_submission_status?: "none" | "partial" | "complete";
}

interface APIFTOResponse {
  id: number;
  name: string;
  description: string;
  property_id: number;
  property_name: string;
  property_address?: string | null;
  task_id?: number;
  field_team_member_ids: number[];
  pm_assignee_ids: number[];
  status: string;
  priority: string;
  due_date: string;
  /** Most recent date_of_work from submissions; use for "Date of Work" column. */
  date_of_work?: string;
  approval_status: string;
  form_submission_status: "none" | "partial" | "complete";
  is_visible_to_client: boolean;
  hours_decimal: number;
  total_amount: number;
  created_at: string;
  updated_at?: string;
  unit_id?: number;
  unit_name?: string;
  event_start_at?: string | null;
  event_end_at?: string | null;
  bill_id?: number | null;
  bill_draft_id?: number | null;
}

// Misc submission (fto_id IS NULL)
interface MiscSubmission {
  id: number;
  propertyId: number | null;
  propertyName: string;
  dateOfWork: string;
  status: string;
  techName: string;
  amount: number;
  description: string;
}

interface APIMiscSubmissionResponse {
  ID: number;
  FTOID: number | null;
  FieldTeamMemberID: number;
  DateOfWork: string;
  Status: string;
  MaterialsJSON: string | null;
  HoursJSON: string | null;
  Description?: string;
  PropertyID?: number | null;
  property_id?: number | null;
  property_name?: string;
  fto_name?: string; // Repurposed for tech name in misc submissions
}
const normalizeFTOStatus = (status: string) => {
  if (status === "completed") return "Completed";
  if (status === "new") return "New";
  if (status === "dispatched") return "Dispatched";
  if (status === "cancelled") return "Cancelled";
  return status;
};


// Mock user database - simulates GET /users/{id}
const mockUsers: Record<number, { id: number; name: string }> = {
  1: { id: 1, name: "Christopher Harris" },
  2: { id: 2, name: "Cassandra Smith" },
  3: { id: 3, name: "David Chen" },
  4: { id: 4, name: "Emma Rodriguez" },
  5: { id: 5, name: "James Wilson" },
};

// Helper to generate initials from name
const getInitials = (name: string): string => {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
};

// Helper to resolve field team members (replaces real GET /users/{id} call)
const resolveFieldTeamMembers = (
  memberIds: number[]
): Array<{ initials: string; color: string; name: string }> => {
  return memberIds.map((id) => {
    const user = mockUsers[id] || { id, name: "Unknown User" };
    return {
      initials: getInitials(user.name),
      color: "bg-blue-500",
      name: user.name,
    };
  });
};

// Map form_submission_status and approval_status to timesheetStatus
const mapFormSubmissionToTimesheetStatus = (
  formStatus: "none" | "partial" | "complete",
  approvalStatus?: string
): "awaiting-submission" | "submitted" | "rejected" | "approved" => {
  // If rejected, always show rejected
  if (approvalStatus === "rejected") {
    return "rejected";
  }
  
  // If approved and form is complete, show approved
  if (approvalStatus === "approved" && formStatus === "complete") {
    return "approved";
  }
  
  // If form is complete or partial and not approved/rejected, show submitted
  if (formStatus === "complete" || formStatus === "partial") {
    return "submitted";
  }
  
  // If form is none, show awaiting submission
  if (formStatus === "none") {
    return "awaiting-submission";
  }
  
  return "awaiting-submission";
};

const mockFetchFTOs = async (params: {
  field_team_member_id: number;
  status?: string;
  limit?: number;
}): Promise<APIFTOResponse[]> => {
  await new Promise((resolve) => setTimeout(resolve, 100));

  const mockData: APIFTOResponse[] = [
    {
      id: 1,
      name: "Door Repair",
      description: "Doors Need To Be Repaired",
      property_id: 1,
      property_name: "22 Indian Chase Dr",
      property_address: "22 Indian Chase Dr, Springfield, IL 62701",
      task_id: 6,
      field_team_member_ids: [1, 2],
      pm_assignee_ids: [101, 102],
      status: "dispatched",
      priority: "high",
      due_date: "2025-10-02T00:00:00Z",
      approval_status: "pending",
      form_submission_status: "none",
      is_visible_to_client: true,
      hours_decimal: 8.5,
      total_amount: 420,
      created_at: "2025-09-20T10:00:00Z",
      updated_at: "2025-09-25T14:30:00Z",
    },
    {
      id: 2,
      name: "Door Repair",
      description: "Doors Need To Be Repaired",
      property_id: 1,
      property_name: "22 Indian Chase Dr",
      property_address: "22 Indian Chase Dr, Springfield, IL 62701",
      task_id: 6,
      field_team_member_ids: [1, 2],
      pm_assignee_ids: [101, 102],
      status: "approved",
      priority: "normal",
      due_date: "2025-09-29T00:00:00Z",
      approval_status: "approved",
      form_submission_status: "complete",
      is_visible_to_client: true,
      hours_decimal: 6.0,
      total_amount: 95,
      created_at: "2025-09-18T09:15:00Z",
      updated_at: "2025-09-26T11:00:00Z",
    },
    {
      id: 3,
      name: "Door Repair",
      description: "Doors Need To Be Repaired",
      property_id: 1,
      property_name: "22 Indian Chase Dr",
      property_address: "22 Indian Chase Dr, Springfield, IL 62701",
      task_id: 6,
      field_team_member_ids: [1, 2],
      pm_assignee_ids: [101, 102],
      status: "pending-approval",
      priority: "low",
      due_date: "2025-09-10T00:00:00Z",
      approval_status: "pending",
      form_submission_status: "partial",
      is_visible_to_client: true,
      hours_decimal: 4.5,
      total_amount: 95,
      created_at: "2025-09-08T08:00:00Z",
      updated_at: "2025-09-24T16:45:00Z",
    },
    {
      id: 4,
      name: "Door Repair",
      description: "Doors Need To Be Repaired",
      property_id: 1,
      property_name: "22 Indian Chase Dr",
      property_address: "22 Indian Chase Dr, Springfield, IL 62701",
      task_id: 6,
      field_team_member_ids: [1, 2],
      pm_assignee_ids: [101, 102],
      status: "dispatched",
      priority: "high",
      due_date: "2025-09-06T00:00:00Z",
      approval_status: "pending",
      form_submission_status: "none",
      is_visible_to_client: true,
      hours_decimal: 7.0,
      total_amount: 112,
      created_at: "2025-09-05T07:30:00Z",
      updated_at: "2025-09-23T13:20:00Z",
    },
    {
      id: 5,
      name: "Door Repair",
      description: "Doors Need To Be Repaired",
      property_id: 1,
      property_name: "22 Indian Chase Dr",
      property_address: "22 Indian Chase Dr, Springfield, IL 62701",
      task_id: 6,
      field_team_member_ids: [1, 2],
      pm_assignee_ids: [101, 102],
      status: "dispatched",
      priority: "normal",
      due_date: "2025-09-05T00:00:00Z",
      approval_status: "pending",
      form_submission_status: "complete",
      is_visible_to_client: true,
      hours_decimal: 5.5,
      total_amount: 93,
      created_at: "2025-09-03T06:00:00Z",
      updated_at: "2025-09-22T15:10:00Z",
    },
    {
      id: 6,
      name: "Door Repair",
      description: "Doors Need To Be Repaired",
      property_id: 1,
      property_name: "22 Indian Chase Dr",
      property_address: "22 Indian Chase Dr, Springfield, IL 62701",
      task_id: 6,
      field_team_member_ids: [1, 2],
      pm_assignee_ids: [101, 102],
      status: "dispatched",
      priority: "low",
      due_date: "2025-09-04T00:00:00Z",
      approval_status: "pending",
      form_submission_status: "none",
      is_visible_to_client: true,
      hours_decimal: 4.0,
      total_amount: 75,
      created_at: "2025-09-02T05:45:00Z",
      updated_at: "2025-09-21T12:00:00Z",
    },
    {
      id: 7,
      name: "Door Repair",
      description: "Doors Need To Be Repaired",
      property_id: 1,
      property_name: "22 Indian Chase Dr",
      property_address: "22 Indian Chase Dr, Springfield, IL 62701",
      task_id: 6,
      field_team_member_ids: [3, 4],
      pm_assignee_ids: [101, 102],
      status: "dispatched",
      priority: "high",
      due_date: "2025-09-04T00:00:00Z",
      approval_status: "pending",
      form_submission_status: "partial",
      is_visible_to_client: true,
      hours_decimal: 6.5,
      total_amount: 101,
      created_at: "2025-09-01T04:30:00Z",
      updated_at: "2025-09-20T14:15:00Z",
    },
    {
      id: 8,
      name: "Door Repair",
      description: "Doors Need To Be Repaired",
      property_id: 1,
      property_name: "22 Indian Chase Dr",
      property_address: "22 Indian Chase Dr, Springfield, IL 62701",
      task_id: 6,
      field_team_member_ids: [1, 2],
      pm_assignee_ids: [101, 102],
      status: "dispatched",
      priority: "normal",
      due_date: "2025-09-03T00:00:00Z",
      approval_status: "pending",
      form_submission_status: "none",
      is_visible_to_client: true,
      hours_decimal: 8.0,
      total_amount: 124,
      created_at: "2025-08-31T03:15:00Z",
      updated_at: "2025-09-19T11:30:00Z",
    },
    {
      id: 9,
      name: "Door Repair",
      description: "Doors Need To Be Repaired",
      property_id: 1,
      property_name: "22 Indian Chase Dr",
      property_address: "22 Indian Chase Dr, Springfield, IL 62701",
      task_id: 6,
      field_team_member_ids: [5],
      pm_assignee_ids: [101, 102],
      status: "dispatched",
      priority: "low",
      due_date: "2025-09-01T00:00:00Z",
      approval_status: "pending",
      form_submission_status: "complete",
      is_visible_to_client: true,
      hours_decimal: 3.5,
      total_amount: 67,
      created_at: "2025-08-30T02:00:00Z",
      updated_at: "2025-09-18T09:45:00Z",
    },
    {
      id: 10,
      name: "Door Repair",
      description: "Doors Need To Be Repaired",
      property_id: 1,
      property_name: "22 Indian Chase Dr",
      property_address: "22 Indian Chase Dr, Springfield, IL 62701",
      task_id: 6,
      field_team_member_ids: [1, 2],
      pm_assignee_ids: [101, 102],
      status: "dispatched",
      priority: "high",
      due_date: "2025-09-01T00:00:00Z",
      approval_status: "pending",
      form_submission_status: "none",
      is_visible_to_client: true,
      hours_decimal: 7.5,
      total_amount: 118,
      created_at: "2025-08-29T01:30:00Z",
      updated_at: "2025-09-17T10:20:00Z",
    },
  ];

  if (params.status) {
    return mockData.filter((fto) => fto.status === params.status);
  }

  return mockData.slice(0, params.limit || 100);
};

const transformAPIToFieldTeamOrder = (
  apiData: APIFTOResponse[],
  usersById: Record<number, { id: number; name: string }>
): FieldTeamOrder[] => {
  return apiData.map((fto) => {
    const displayDateSource = fto.date_of_work ?? fto.due_date;
    const dateOnly = displayDateSource ? displayDateSource.split("T")[0] : null;
    const dueDate = dateOnly
      ? new Date(dateOnly + "T00:00:00").toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : "—";

    const due_date = fto.due_date;
    const timesheetStatus = mapFormSubmissionToTimesheetStatus(
      fto.form_submission_status,
      fto.approval_status
    );
  
  

    return {
      id: fto.id,
      pm_assignee_ids: fto.pm_assignee_ids ?? [],
      taskId: fto.task_id || fto.id,
      task_id: fto.task_id ?? null,
      name: fto.name,
      property: fto.property_name,
      property_id: fto.property_id,
      description: fto.description,
      dueDate,              // formatted for table
      due_date: fto.due_date, // ✅ KEEP RAW DATE
      priority: (fto.priority.toLowerCase() as "low" | "normal" | "high") || "normal",
      fieldTeam: fto.field_team_member_ids.map((id) => {
        const user = usersById[id];
        return {
          id, // 👈 ADD THIS
          initials: user ? getInitials(user.name) : "?",
          name: user ? user.name : "Unknown User",
          color: "bg-blue-500",
        };
      }),
      status: normalizeFTOStatus(fto.status) as
        | "Dispatched"
        | "Completed"
        | "New"
        | "pending-approval",
      originalStatus: fto.status, // Keep original for modal
      timesheetStatus,
      amount: fto.total_amount,
      unit: formatUnitLabel({
        unitId: fto.unit_id,
        unitName: fto.unit_name,
        fallback: UNIT_EMPTY_DISPLAY,
      }),
      field_team_member_ids: fto.field_team_member_ids ?? [],
      hours: fto.hours_decimal,
      event_start_at: fto.event_start_at ?? null,
      event_end_at: fto.event_end_at ?? null,
      bill_id: fto.bill_id ?? null,
      bill_draft_id: fto.bill_draft_id ?? null,
      form_submission_status: fto.form_submission_status,
    };
  });
};

// Calculate total amount from materials JSON (amount + upcharge per line, to match approve page)
const calculateMiscAmount = (materialsJSON: string | null): number => {
  if (!materialsJSON) return 0;
  try {
    const decoded = atob(materialsJSON);
    const materials = JSON.parse(decoded);
    if (!Array.isArray(materials)) return 0;
    return materials.reduce(
      (sum: number, m: any) => sum + (m.amount_cents || 0) + (m.upcharge_cents || 0),
      0
    ) / 100;
  } catch {
    return 0;
  }
};

const transformAPIMiscSubmission = (apiData: APIMiscSubmissionResponse[]): MiscSubmission[] => {
  return apiData.map((sub) => {
    const dateObj = new Date(sub.DateOfWork);
    const dateOfWork = dateObj.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

    return {
      id: sub.ID,
      propertyId: sub.property_id ?? sub.PropertyID ?? null,
      propertyName: sub.property_name || "Unknown Property",
      dateOfWork,
      status: sub.Status || "submitted",
      techName: sub.fto_name || "Unknown Tech", // fto_name is repurposed for tech name
      amount: calculateMiscAmount(sub.MaterialsJSON),
      description: sub.Description || "Miscellaneous expense",
    };
  });
};


function MultiSelectFilter({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (values: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const toggle = (value: string) => {
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);
  };

  const displayLabel =
    selected.length === 0
      ? "All"
      : selected.length === 1
      ? (options.find((o) => o.value === selected[0])?.label ?? selected[0])
      : `${selected.length} selected`;

  return (
    <div className="flex items-center gap-2">
      <label className="text-xs font-medium text-[#717179] whitespace-nowrap">{label}</label>
      <div ref={ref} className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="h-9 px-2.5 rounded-lg border border-[#DADADA] bg-white text-sm text-[#303030] min-w-[140px] flex items-center justify-between gap-2 hover:border-[#b0b0b0]"
        >
          <span className={selected.length === 0 ? "text-[#999]" : ""}>{displayLabel}</span>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="flex-shrink-0 text-[#999]">
            <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        {open && (
          <div className="absolute top-full mt-1 left-0 z-50 bg-white border border-[#DADADA] rounded-lg shadow-lg py-1 min-w-[200px] whitespace-nowrap">
            {options.map((opt) => (
              <label
                key={opt.value}
                className="flex items-center gap-2 px-3 py-1.5 hover:bg-[#f5f5f5] cursor-pointer text-sm text-[#303030]"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(opt.value)}
                  onChange={() => toggle(opt.value)}
                  className="rounded"
                />
                {opt.label}
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function FieldTeamOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<FieldTeamOrder[]>([]);
  const [miscSubmissions, setMiscSubmissions] = useState<MiscSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [miscLoading, setMiscLoading] = useState(false);
  const [selectedTab, setSelectedTab] = usePageState<"ftos" | "misc">("selectedTab", "ftos");
  const [currentPage, setCurrentPage] = usePageState("currentPage", 1);
  const [itemsPerPage, setItemsPerPage] = usePageState("itemsPerPage", 50);
  const [showPageSizeDropdown, setShowPageSizeDropdown] = usePageState(
    "showPageSizeDropdown",
    false,
  );
  const [openMenuId, setOpenMenuId] = usePageState<number | null>(
    "openMenuId",
    null,
  );
  const [editingFTOId, setEditingFTOId] = useState<number | null>(null);
  const [showFTOModal, setShowFTOModal] = usePageState("showFTOModal", false);
  const [searchValue, setSearchValue] = usePageState("searchValue", "");
  const [miscSearchValue, setMiscSearchValue] = usePageState("miscSearchValue", "");
  const [showHoursSummaryDrawer, setShowHoursSummaryDrawer] = useState(false);
  const [mergeMode, setMergeMode] = useState(false);
  const [selectedFtoIds, setSelectedFtoIds] = useState<Set<string | number>>(new Set());
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [showFilterBar, setShowFilterBar] = usePageState("showFilterBar", false);
  const [filterDateFrom, setFilterDateFrom] = usePageState("filterDateFrom", "");
  const [filterDateTo, setFilterDateTo] = usePageState("filterDateTo", "");
  const [filterProperty, setFilterProperty] = usePageState<string[]>("filterProperty", []);
  const [filterFieldTeamMember, setFilterFieldTeamMember] = usePageState<string[]>("filterFieldTeamMember", []);
  const [filterTimesheetStatus, setFilterTimesheetStatus] = usePageState<string[]>("filterTimesheetStatus", ["awaiting-submission", "submitted", "rejected"]);
  const [filterFtoStatus, setFilterFtoStatus] = usePageState<string[]>("filterFtoStatus", []);
  const [filterPriority, setFilterPriority] = usePageState<string[]>("filterPriority", []);
  const { setTabMetadata } = useTabContext();

  // Clear persisted modal state when leaving the page so it doesn't reopen when returning (e.g. from Approve FTO)
  useEffect(() => {
    return () => {
      setTabMetadata("/field-team-orders", { pageState: { showFTOModal: false } });
    };
  }, [setTabMetadata]);

  async function fetchUsersByIds(
    ids: number[]
  ): Promise<Record<number, { id: number; name: string }>> {
    const uniqueIds = Array.from(new Set(ids));

    const results = await Promise.all(
      uniqueIds.map(async (id) => {
        try {
          const user = await fetchJSON(`/users/${id}`);
          return user;
        } catch {
          return null;
        }
      })
    );

    return results
      .filter((user): user is { id: number; name: string } => user !== null)
      .reduce((acc, user) => {
        acc[user.id] = user;
        return acc;
      }, {} as Record<number, { id: number; name: string }>);
  }
  

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const raw = await fetchJSON(
        `/maintenance/ftos?limit=100`
      );
      
      const rawData: APIFTOResponse[] = Array.isArray(raw)
        ? raw
        : raw?.data ?? raw?.items ?? raw?.results ?? [];
      const apiData = rawData;

      // collect all field team IDs
      const allFieldTeamIds = apiData.flatMap(
        (fto) => fto.field_team_member_ids ?? []
      );
      
      // fetch users
      const usersById = await fetchUsersByIds(allFieldTeamIds);
      
      // transform
      const transformedOrders = transformAPIToFieldTeamOrder(
        apiData,
        usersById
      );
      
      setOrders(transformedOrders);
      
    } catch (error) {
      console.error("Error fetching FTOs:", error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMiscSubmissions = async () => {
    setMiscLoading(true);
    try {
      const raw = await fetchJSON(`/maintenance/submissions/misc`);
      
      const apiData: APIMiscSubmissionResponse[] = Array.isArray(raw)
        ? raw
        : raw?.data ?? raw?.items ?? raw?.results ?? [];
      
      const transformedMisc = transformAPIMiscSubmission(apiData);
      setMiscSubmissions(transformedMisc);
    } catch (error) {
      console.error("Error fetching misc submissions:", error);
      setMiscSubmissions([]);
    } finally {
      setMiscLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Fetch misc submissions when tab changes to misc
  useEffect(() => {
    if (selectedTab === "misc" && miscSubmissions.length === 0) {
      fetchMiscSubmissions();
    }
  }, [selectedTab]);

  // Listen for refresh events
  useEffect(() => {
    const handleRefresh = () => {
      fetchOrders();
      if (selectedTab === "misc") {
        fetchMiscSubmissions();
      }
    };

    window.addEventListener("refreshFieldTeamOrders", handleRefresh);
    return () => {
      window.removeEventListener("refreshFieldTeamOrders", handleRefresh);
    };
  }, [selectedTab]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    filterDateFrom,
    filterDateTo,
    filterProperty,
    filterFieldTeamMember,
    filterTimesheetStatus,
    filterFtoStatus,
    filterPriority,
  ]);

  // Unique values for filter dropdowns (from current orders)
  const uniqueProperties = Array.from(
    new Set(orders.map((o) => o.property).filter(Boolean))
  ).sort();
  const uniqueFieldTeamMembers = Array.from(
    new Set(orders.flatMap((o) => o.fieldTeam.map((m) => m.name)).filter(Boolean))
  ).sort();

  const filteredOrders = orders.filter((order) => {
    const searchLower = searchValue.toLowerCase();
    const inField = (v: unknown) =>
      typeof v === "string" && v.toLowerCase().includes(searchLower);
    const matchesSearch =
      !searchLower ||
      inField(order.name) ||
      inField(order.property) ||
      inField(order.description) ||
      inField(order.dueDate) ||
      inField(order.status) ||
      inField(order.priority) ||
      (order.fieldTeam ?? []).some((member) => inField(member?.name));
    if (!matchesSearch) return false;

    if (filterDateFrom || filterDateTo) {
      const orderDate = order.due_date ? new Date(order.due_date) : null;
      if (!orderDate) return false;
      const orderDateStr = orderDate.toISOString().slice(0, 10);
      if (filterDateFrom && orderDateStr < filterDateFrom) return false;
      if (filterDateTo && orderDateStr > filterDateTo) return false;
    }
    if (filterProperty.length > 0 && !filterProperty.includes(order.property)) return false;
    if (filterFieldTeamMember.length > 0 && !order.fieldTeam.some((m) => filterFieldTeamMember.includes(m.name))) return false;
    if (filterTimesheetStatus.length > 0 && !filterTimesheetStatus.includes(order.timesheetStatus)) return false;
    if (filterFtoStatus.length > 0 && !filterFtoStatus.includes(order.status)) return false;
    if (filterPriority.length > 0 && !filterPriority.includes(order.priority)) return false;
    return true;
  });

  const filteredMiscSubmissions = miscSubmissions.filter((sub) => {
    const searchLower = miscSearchValue.toLowerCase();
    return (
      sub.propertyName.toLowerCase().includes(searchLower) ||
      sub.dateOfWork.toLowerCase().includes(searchLower) ||
      sub.status.toLowerCase().includes(searchLower) ||
      sub.techName.toLowerCase().includes(searchLower) ||
      sub.description.toLowerCase().includes(searchLower)
    );
  });

  const { handleSortClick, getSortIndicator, getSortedData } =
    useSortingTable(filteredOrders, "default", { initialSortBy: "due_date", initialSortOrder: "desc" });
  const {
    columnOrder,
    visibleColumns,
    draggedColumn,
    dropTargetColumn,
    dropPosition,
    showColumnModal,
    setShowColumnModal,
    columnMenuPos,
    columnButtonRef,
    toggleColumnVisibility,
    handleColumnDragStart,
    handleColumnDragOver,
    handleColumnDragLeave,
    handleColumnDrop,
  } = useColumnManagement([
    "priority",
    "property",
    "unit",
    "name",
    "dueDate",
    "fieldTeam",
    "status",
    "timesheetStatus",
    "amount",
  ]);

  // Misc table hooks
  const miscSortingHook = useSortingTable(filteredMiscSubmissions);
  const miscColumnManagement = useColumnManagement([
    "propertyName",
    "dateOfWork",
    "description",
    "techName",
    "status",
    "amount",
  ]);

  const columns = [
    {
      key: "priority",
      label: "Priority",
      icon: <FlagIcon width={16} height={16} />,
    },
    {
      key: "property",
      label: "Property",
      icon: <BuildingIcon width={16} height={16} />,
    },
    {
      key: "unit",
      label: "Unit",
      icon: (
        <img
          loading="lazy"
          src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/049b679c03670a4d1cf3028269ec92ee2c8cc8e3?placeholderIfAbsent=true"
          style={{ width: "14px", height: "14px" }}
          alt=""
        />
      ),
    },
    {
      key: "name",
      label: "FTO Name",
      icon: <NoteIcon width={16} height={16} />,
    },
    {
      key: "dueDate",
      label: "Date of Work",
      icon: <CalendarIcon width={16} height={16} />,
    },
    {
      key: "fieldTeam",
      label: "Field Team",
      icon: <UserIcon width={16} height={16} />,
    },
    {
      key: "status",
      label: "FTO Status",
      icon: <ApproveIcon width={16} height={16} />,
    },
    {
      key: "timesheetStatus",
      label: "Timesheet Status",
      icon: <ApproveIcon width={16} height={16} />,
    },
    {
      key: "amount",
      label: "Amount",
      icon: <DollarIcon width={16} height={16} />,
    },
  ];

  const miscColumns = [
    {
      key: "propertyName",
      label: "Property",
      icon: <BuildingIcon width={16} height={16} />,
    },
    {
      key: "dateOfWork",
      label: "Purchase Date",
      icon: <CalendarIcon width={16} height={16} />,
    },
    {
      key: "description",
      label: "Description",
      icon: <NoteIcon width={16} height={16} />,
    },
    {
      key: "techName",
      label: "Tech",
      icon: <UserIcon width={16} height={16} />,
    },
    {
      key: "status",
      label: "Status",
      icon: <ApproveIcon width={16} height={16} />,
    },
    {
      key: "amount",
      label: "Amount",
      icon: <DollarIcon width={16} height={16} />,
    },
  ];

  const handleDeleteOrder = useCallback(
    async (order: FieldTeamOrder) => {
      const confirmed = window.confirm(
        `Are you sure you want to delete "${order.description}"?\nThis cannot be undone.`
      );
      if (!confirmed) return;

      try {
        await fetchJSON(`/maintenance/ftos?id=${order.id}`, { method: "DELETE" });
        setOrders((prev) => prev.filter((o) => o.id !== order.id));
      } catch (err) {
        console.error("Delete FTO failed", err);
        alert("Failed to delete Field Team Order. Please try again.");
      }
    },
    []
  );


  const openEditFTO = useCallback((order: FieldTeamOrder) => {
    
    setEditingFTOId(order.id);
    setShowFTOModal(true);
  }, []);
  

  const handleEditOrder = useCallback(
    (order: FieldTeamOrder) => {
      openEditFTO(order);
    },
    [openEditFTO]
  );


  const handleApproveOrder = useCallback(
    (order: FieldTeamOrder) => {
      navigate(`/field-team-orders/approve/${order.id}`, {
        state: {
          ftoName: order.description,
          property: order.property,
          unit: order.unit ?? UNIT_EMPTY_DISPLAY,
          fieldTeamAssignee:
            order.fieldTeamAssignee ?? order.fieldTeam?.[0]?.name ?? "",
          task: order.task ?? "",
          description: order.description,
          dueDate: order.dueDate,
          priority: order.priority,
        },
      });
    },
    [navigate]
  );

  // Misc submission handlers
  const handleViewMiscSubmission = useCallback(
    (sub: MiscSubmission) => {
      navigate(`/field-team-orders/approve/submission/${sub.id}`, {
        state: {
          propertyName: sub.propertyName,
          propertyId: sub.propertyId,
          dateOfWork: sub.dateOfWork,
          description: sub.description,
        },
      });
    },
    [navigate]
  );

  const handleApproveMiscSubmission = useCallback(
    (sub: MiscSubmission) => {
      navigate(`/field-team-orders/approve/submission/${sub.id}`, {
        state: {
          propertyName: sub.propertyName,
          propertyId: sub.propertyId,
          dateOfWork: sub.dateOfWork,
          description: sub.description,
        },
      });
    },
    [navigate]
  );

  // FTOs selected for merge
  const selectedFTOsForMerge = useMemo(
    () => orders.filter((o) => selectedFtoIds.has(o.id)),
    [orders, selectedFtoIds]
  );

  const handleConfirmMerge = useCallback(
    async (primaryId: number, mergedIds: number[]) => {
      try {
        await fetchJSON("/maintenance/ftos/merge", {
          method: "POST",
          body: JSON.stringify({
            primary_id: primaryId,
            source_ids: mergedIds,
          }),
        });
        setShowMergeModal(false);
        setSelectedFtoIds(new Set());
        setMergeMode(false);
        await fetchOrders();
        toast.success(
          mergedIds.length === 1
            ? `Merged FTO #${mergedIds[0]} into FTO #${primaryId}`
            : `Merged ${mergedIds.length} FTOs into FTO #${primaryId}`
        );
      } catch (err) {
        console.error("Merge FTOs failed:", err);
        toast.error(
          err instanceof Error ? err.message : "Failed to merge FTOs"
        );
      }
    },
    []
  );

  return (
    <PageTemplate>
      <div className="flex flex-col gap-6 w-fit min-w-full">
        <div className="flex items-center gap-10 justify-between flex-wrap">
          {/* Title and Description */}
          <div className="flex flex-col gap-1 min-w-[240px]">
            <h1 className="text-[#303030] font-semibold text-2xl leading-[30px]">
              All Field Team Orders
            </h1>
            <span
              className="text-[#717179] font-medium text-base leading-4 block"
              style={{ marginTop: "4px" }}
            >
              All your field team orders, in one place
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                if (mergeMode) {
                  setMergeMode(false);
                  setSelectedFtoIds(new Set());
                } else {
                  setMergeMode(true);
                }
              }}
              className={cn(
                "flex h-9 items-center gap-2 px-3 rounded-lg border shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] transition-colors",
                mergeMode
                  ? "border-[#013764] bg-[#f0f6fc] text-[#013764]"
                  : "border-[#DADADA] bg-white text-[#303030] hover:bg-gray-50"
              )}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="18" cy="18" r="3" />
                <circle cx="6" cy="6" r="3" />
                <path d="M6 21V9a9 9 0 0 0 9 9" />
              </svg>
              <span className="font-medium text-base leading-normal">
                {mergeMode ? "Cancel Merge" : "Merge"}
              </span>
            </button>
            <button
              onClick={() => window.open("/fto", "_blank")}
              className="flex h-9 items-center gap-2 px-3 rounded-lg border border-[#DADADA] bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] hover:bg-gray-50 transition-colors text-[#303030]"
            >
              <DocumentIcon width={20} height={20} />
              <span className="font-medium text-base leading-normal">
                Submission Portal
              </span>
            </button>
            <button
              onClick={() => setShowHoursSummaryDrawer(true)}
              className="flex h-9 items-center gap-2 px-3 rounded-lg border border-[#DADADA] bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] hover:bg-gray-50 transition-colors text-[#303030]"
            >
              <HamburgerIcon width={20} height={20} />
              <span className="font-medium text-base leading-normal">
                Hours Summary
              </span>
            </button>
            <button
              onClick={() => setShowFTOModal(true)}
              className="flex h-9 items-center gap-2 px-3 rounded-lg border border-white bg-[#013764] shadow-[0_0_0_1px_#002D5A] hover:bg-[#003a73] transition-colors"
            >
              <PlusIcon width={20} height={20} className="text-white" />
              <span className="text-white font-medium text-base leading-normal">
                Create FTO
              </span>
            </button>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="flex gap-1 border-b border-[#E5E5E5]">
          <button
            onClick={() => {
              setSelectedTab("ftos");
              setCurrentPage(1);
            }}
            className={cn(
              "px-4 py-2.5 text-sm font-medium transition-colors relative",
              selectedTab === "ftos"
                ? "text-[#013764]"
                : "text-[#717179] hover:text-[#303030]"
            )}
          >
            Field Team Orders
            {selectedTab === "ftos" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#013764]" />
            )}
          </button>
          <button
            onClick={() => {
              setSelectedTab("misc");
              setCurrentPage(1);
              if (miscSubmissions.length === 0) {
                fetchMiscSubmissions();
              }
            }}
            className={cn(
              "px-4 py-2.5 text-sm font-medium transition-colors relative",
              selectedTab === "misc"
                ? "text-[#013764]"
                : "text-[#717179] hover:text-[#303030]"
            )}
          >
            Misc Expenses
            {selectedTab === "misc" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#013764]" />
            )}
          </button>
        </div>

        <div className="flex flex-col gap-6">
          {/* FTO Filter bar - toggled by Filter button */}
          {selectedTab === "ftos" && showFilterBar && (
            <div
              className="flex flex-wrap items-center gap-4 p-4 rounded-lg border border-[#E5E5E5] bg-gray-50/80"
              style={{ borderColor: "var(--color-border-light)" }}
            >
              <span className="text-sm font-medium text-[#303030] shrink-0">
                Filter by
              </span>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-[#717179] whitespace-nowrap">
                    Date from
                  </label>
                  <input
                    type="date"
                    value={filterDateFrom}
                    onChange={(e) => setFilterDateFrom(e.target.value)}
                    className="h-9 px-2.5 rounded-lg border border-[#DADADA] bg-white text-sm text-[#303030] min-w-[130px]"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-[#717179] whitespace-nowrap">
                    Date to
                  </label>
                  <input
                    type="date"
                    value={filterDateTo}
                    onChange={(e) => setFilterDateTo(e.target.value)}
                    className="h-9 px-2.5 rounded-lg border border-[#DADADA] bg-white text-sm text-[#303030] min-w-[130px]"
                  />
                </div>
                <MultiSelectFilter
                  label="Property"
                  options={uniqueProperties.map((p) => ({ value: p, label: p }))}
                  selected={filterProperty}
                  onChange={setFilterProperty}
                />
                <MultiSelectFilter
                  label="Field team"
                  options={uniqueFieldTeamMembers.map((name) => ({ value: name, label: name }))}
                  selected={filterFieldTeamMember}
                  onChange={setFilterFieldTeamMember}
                />
                <MultiSelectFilter
                  label="Timesheet"
                  options={[
                    { value: "awaiting-submission", label: "Awaiting submission" },
                    { value: "submitted", label: "Submitted" },
                    { value: "rejected", label: "Rejected" },
                    { value: "approved", label: "Approved" },
                  ]}
                  selected={filterTimesheetStatus}
                  onChange={setFilterTimesheetStatus}
                />
                <MultiSelectFilter
                  label="FTO status"
                  options={[
                    { value: "New", label: "New" },
                    { value: "Dispatched", label: "Dispatched" },
                    { value: "Completed", label: "Completed" },
                    { value: "pending-approval", label: "Pending approval" },
                    { value: "Cancelled", label: "Cancelled" },
                  ]}
                  selected={filterFtoStatus}
                  onChange={setFilterFtoStatus}
                />
                <MultiSelectFilter
                  label="Priority"
                  options={[
                    { value: "low", label: "Low" },
                    { value: "normal", label: "Normal" },
                    { value: "high", label: "High" },
                  ]}
                  selected={filterPriority}
                  onChange={setFilterPriority}
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  setFilterDateFrom("");
                  setFilterDateTo("");
                  setFilterProperty([]);
                  setFilterFieldTeamMember([]);
                  setFilterTimesheetStatus([]);
                  setFilterFtoStatus([]);
                  setFilterPriority([]);
                  setCurrentPage(1);
                }}
                className="h-9 px-3 rounded-lg border border-[#DADADA] bg-white text-sm font-medium text-[#303030] hover:bg-gray-100 shrink-0"
              >
                Clear filters
              </button>
            </div>
          )}

          {/* FTO Table */}
          {selectedTab === "ftos" && (
            <>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-gray-500">Loading field team orders...</div>
                </div>
              ) : (
                <GlobalTable
                  columns={columns}
                  data={filteredOrders}
                  rowKey="id"
                  selectable={mergeMode}
                  selectedIds={selectedFtoIds}
                  onSelectionChange={setSelectedFtoIds}
                  showSearchBar={true}
                  searchValue={searchValue}
                  onSearchChange={setSearchValue}
                  renderCell={(order, columnKey) => {
                    if (columnKey === "priority") {
                      return (
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{
                              backgroundColor:
                                order.priority === "low"
                                  ? "#059669"
                                  : order.priority === "normal"
                                    ? "#2463eb"
                                    : "#d97706",
                            }}
                          />
                          <span className="text-gray-900 font-normal text-sm capitalize truncate">
                            {order.priority}
                          </span>
                        </div>
                      );
                    }
                    if (columnKey === "property") {
                      return order.property_id == null ? (
                        <div className="flex items-center gap-1.5 text-amber-600">
                          <WarningIcon width={14} height={14} />
                          <span className="text-sm font-medium">Not set</span>
                        </div>
                      ) : (
                        <span className="text-gray-900 font-normal text-sm truncate">
                          {order.property}
                        </span>
                      );
                    }
                    if (columnKey === "unit") {
                      return (
                        <span className="text-gray-900 font-normal text-sm truncate">
                          {formatUnitDisplayForTable(order.unit)}
                        </span>
                      );
                    }
                    if (columnKey === "name") {
                      return (
                        <div
                          className="min-w-0 max-w-[200px]"
                          title={order.name}
                        >
                          <span className="text-gray-900 font-normal text-sm truncate block">
                            {order.name}
                          </span>
                        </div>
                      );
                    }
                    if (columnKey === "dueDate") {
                      return (
                        <span className="text-gray-900 font-normal text-sm truncate">
                          {order.dueDate}
                        </span>
                      );
                    }
                    if (columnKey === "fieldTeam") {
                      return (
                        <div className="flex items-center gap-2">
                          {order.fieldTeam.map((member, idx) => (
                            <div key={idx} className="relative group">
                              <div
                                className={`w-7 h-7 rounded-full ${member.color} flex items-center justify-center text-white text-xs font-semibold border border-gray-300 cursor-pointer`}
                                title={member.name}
                              >
                                {member.initials}
                              </div>
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                                {member.name}
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    }
                    if (columnKey === "status") {
                      return <StatusBadge status={order.status} variant="fto-status" />;
                    }
                    if (columnKey === "timesheetStatus") {
                      return <StatusBadge status={order.timesheetStatus} variant="timesheet-status" />;
                    }
                    if (columnKey === "amount") {
                      return (
                        <span className="text-gray-900 font-normal text-sm">
                          ${order.amount}
                        </span>
                      );
                    }
                    return null;
                  }}
                  getCellClassName={(_order, columnKey) =>
                    columnKey === "name" ? "max-w-[200px] w-[200px]" : ""
                  }
                  sortingHook={{
                    handleSortClick,
                    getSortIndicator,
                    getSortedData,
                  }}
                  columnManagementHook={{
                    columnOrder,
                    visibleColumns,
                    draggedColumn,
                    dropTargetColumn,
                    dropPosition,
                    columnMenuPos,
                    columnButtonRef,
                    toggleColumnVisibility,
                    handleColumnDragStart,
                    handleColumnDragOver,
                    handleColumnDragLeave,
                    handleColumnDrop,
                  }}
                  currentPage={currentPage}
                  onPageChange={setCurrentPage}
                  itemsPerPage={itemsPerPage}
                  onItemsPerPageChange={setItemsPerPage}
                  showPageSizeDropdown={showPageSizeDropdown}
                  onShowPageSizeDropdownChange={setShowPageSizeDropdown}
                  openMenuId={openMenuId}
                  onOpenMenuIdChange={setOpenMenuId}
                  title="All Field Team Orders"
                  onFilterClick={() => {
                    setShowPageSizeDropdown(false);
                    setOpenMenuId(null);
                    setShowFilterBar(!showFilterBar);
                  }}
                  headerActions={
                    <button
                      ref={columnButtonRef}
                      onClick={() => {
                        setShowPageSizeDropdown(false);
                        setOpenMenuId(null);
                        setShowColumnModal((prev) => !prev);
                      }}
                      className="flex h-9 w-9 justify-center items-center rounded-lg border border-[#DADADA] bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] hover:bg-gray-50 transition-colors"
                    >
                      <DotsIcon width={18} height={18} color="#303030" />
                    </button>
                  }
                  actions={[
                    {
                      label: "Approve",
                      icon: <ApproveIcon width={16} height={16} />,
                      onClick: handleApproveOrder,
                    },
                    {
                      label: "Edit",
                      icon: <EditIcon width={18} height={18} color="#525252" />,
                      onClick: handleEditOrder,
                    },
                    {
                      label: "Delete",
                      icon: <DeleteIcon width={18} height={18} color="#982740" />,
                      onClick: handleDeleteOrder,
                    },
                  ]}
                  onRowClick={(order) => {
                    openEditFTO(order);
                  }}
                  showColumnModal={showColumnModal}
                  onShowColumnModalChange={setShowColumnModal}
                />
              )}
            </>
          )}

          {/* Misc Expenses Table */}
          {selectedTab === "misc" && (
            <>
              {miscLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-gray-500">Loading miscellaneous expenses...</div>
                </div>
              ) : (
                <GlobalTable
                  columns={miscColumns}
                  data={filteredMiscSubmissions}
                  rowKey="id"
                  showSearchBar={true}
                  searchValue={miscSearchValue}
                  onSearchChange={setMiscSearchValue}
                  renderCell={(sub: MiscSubmission, columnKey) => {
                    if (columnKey === "propertyName") {
                      return (
                        <span className="text-gray-900 font-normal text-sm truncate">
                          {sub.propertyName}
                        </span>
                      );
                    }
                    if (columnKey === "dateOfWork") {
                      return (
                        <span className="text-gray-900 font-normal text-sm truncate">
                          {sub.dateOfWork}
                        </span>
                      );
                    }
                    if (columnKey === "description") {
                      return (
                        <span className="text-gray-900 font-normal text-sm truncate">
                          {sub.description}
                        </span>
                      );
                    }
                    if (columnKey === "techName") {
                      const initials = getInitials(sub.techName);
                      return (
                        <div className="flex items-center gap-2">
                          <div className="relative group">
                            <div
                              className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-semibold border border-gray-300 cursor-pointer"
                              title={sub.techName}
                            >
                              {initials}
                            </div>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                              {sub.techName}
                            </div>
                          </div>
                        </div>
                      );
                    }
                    if (columnKey === "status") {
                      return <StatusBadge status={sub.status} variant="timesheet-status" />;
                    }
                    if (columnKey === "amount") {
                      return (
                        <span className="text-gray-900 font-normal text-sm">
                          ${sub.amount.toFixed(2)}
                        </span>
                      );
                    }
                    return null;
                  }}
                  sortingHook={{
                    handleSortClick: miscSortingHook.handleSortClick,
                    getSortIndicator: miscSortingHook.getSortIndicator,
                    getSortedData: miscSortingHook.getSortedData,
                  }}
                  columnManagementHook={{
                    columnOrder: miscColumnManagement.columnOrder,
                    visibleColumns: miscColumnManagement.visibleColumns,
                    draggedColumn: miscColumnManagement.draggedColumn,
                    dropTargetColumn: miscColumnManagement.dropTargetColumn,
                    dropPosition: miscColumnManagement.dropPosition,
                    columnMenuPos: miscColumnManagement.columnMenuPos,
                    columnButtonRef: miscColumnManagement.columnButtonRef,
                    toggleColumnVisibility: miscColumnManagement.toggleColumnVisibility,
                    handleColumnDragStart: miscColumnManagement.handleColumnDragStart,
                    handleColumnDragOver: miscColumnManagement.handleColumnDragOver,
                    handleColumnDragLeave: miscColumnManagement.handleColumnDragLeave,
                    handleColumnDrop: miscColumnManagement.handleColumnDrop,
                  }}
                  currentPage={currentPage}
                  onPageChange={setCurrentPage}
                  itemsPerPage={itemsPerPage}
                  onItemsPerPageChange={setItemsPerPage}
                  showPageSizeDropdown={showPageSizeDropdown}
                  onShowPageSizeDropdownChange={setShowPageSizeDropdown}
                  openMenuId={openMenuId}
                  onOpenMenuIdChange={setOpenMenuId}
                  title="Miscellaneous Expenses"
                  headerActions={
                    <button
                      ref={miscColumnManagement.columnButtonRef}
                      onClick={() => {
                        setShowPageSizeDropdown(false);
                        setOpenMenuId(null);
                        miscColumnManagement.setShowColumnModal((prev) => !prev);
                      }}
                      className="flex h-9 w-9 justify-center items-center rounded-lg border border-[#DADADA] bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] hover:bg-gray-50 transition-colors"
                    >
                      <DotsIcon width={18} height={18} color="#303030" />
                    </button>
                  }
                  actions={[
                    {
                      label: "View",
                      icon: <EyeIcon width={16} height={16} />,
                      onClick: handleViewMiscSubmission,
                    },
                    {
                      label: "Approve",
                      icon: <ApproveIcon width={16} height={16} />,
                      onClick: handleApproveMiscSubmission,
                    },
                  ]}
                  onRowClick={(sub: MiscSubmission) => {
                    handleViewMiscSubmission(sub);
                  }}
                  showColumnModal={miscColumnManagement.showColumnModal}
                  onShowColumnModalChange={miscColumnManagement.setShowColumnModal}
                />
              )}
            </>
          )}
        </div>
      </div>
      <CreateFTOModal
        open={showFTOModal}
        onOpenChange={(open) => {
          setShowFTOModal(open);
          if (!open) setEditingFTOId(null);
        }}
        onSuccess={() => fetchOrders()}
        editingFTO={
          editingFTOId
            ? (() => {
                const order = orders.find((o) => o.id === editingFTOId);
                if (!order) return null;

                return {
                  id: order.id,

                  // core editable fields
                  name: order.name,
                  description: order.description,
                  priority: order.priority,
                  status: order.originalStatus as "new" | "dispatched" | "completed" | "cancelled",
                  due_date: order.due_date,

                  // relational IDs (what selects actually need)
                  property_id: order.property_id,
                  task_id: order.task_id ?? undefined,
                  field_team_member_ids: order.field_team_member_ids,
                  pm_assignee_ids: order.pm_assignee_ids,

                  // optional display helpers
                  property_name: order.property,
                  unit_name: order.unit && order.unit !== UNIT_EMPTY_DISPLAY ? order.unit : null,
                  event_start_at: order.event_start_at ?? null,
                  event_end_at: order.event_end_at ?? null,
                };
              })()
            : null
        }
      />
      <ColumnFilterModal
        isOpen={showColumnModal}
        position={columnMenuPos}
        columns={columns.map((col) => ({
          key: col.key,
          label: col.label,
          icon: col.icon || null,
        }))}
        visibleColumns={visibleColumns}
        onToggleColumn={toggleColumnVisibility}
        onClose={() => setShowColumnModal(false)}
        buttonRef={columnButtonRef}
      />
      <ColumnFilterModal
        isOpen={miscColumnManagement.showColumnModal}
        position={miscColumnManagement.columnMenuPos}
        columns={miscColumns.map((col) => ({
          key: col.key,
          label: col.label,
          icon: col.icon || null,
        }))}
        visibleColumns={miscColumnManagement.visibleColumns}
        onToggleColumn={miscColumnManagement.toggleColumnVisibility}
        onClose={() => miscColumnManagement.setShowColumnModal(false)}
        buttonRef={miscColumnManagement.columnButtonRef}
      />
      <HoursSummaryDrawer
        isOpen={showHoursSummaryDrawer}
        onClose={() => setShowHoursSummaryDrawer(false)}
        orders={orders}
      />

      {/* Floating merge action bar */}
      {mergeMode && selectedFtoIds.size >= 2 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 px-6 py-3 rounded-xl bg-[#013764] shadow-lg shadow-black/20 border border-white/10">
          <span className="text-white text-sm font-medium">
            {selectedFtoIds.size} FTOs selected
          </span>
          <button
            onClick={() => setShowMergeModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-[#013764] font-semibold text-sm hover:bg-gray-100 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="18" cy="18" r="3" />
              <circle cx="6" cy="6" r="3" />
              <path d="M6 21V9a9 9 0 0 0 9 9" />
            </svg>
            Merge Selected
          </button>
          <button
            onClick={() => {
              setSelectedFtoIds(new Set());
              setMergeMode(false);
            }}
            className="text-white/70 hover:text-white text-sm font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      <MergeFTOsModal
        open={showMergeModal}
        onOpenChange={setShowMergeModal}
        selectedFTOs={selectedFTOsForMerge}
        onConfirmMerge={handleConfirmMerge}
      />
    </PageTemplate>
  );
}
