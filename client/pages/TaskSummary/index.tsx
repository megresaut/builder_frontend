import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import PageHeader from "@/components/PageHeader";
import {
  EditIcon,
  NoteIcon,
  PaperclipIcon,
  FlagIcon,
  CalendarIcon,
  ApproveIcon,
} from "@/components/icons";
import { SectionActionTemplate } from "@/components/templates";
import PageTemplate from "@/layout/PageTemplate";
import WorkOrders from "../WorkOrders";
import TaskWorkOrders from "./TaskWorkOrders";
import TaskFieldTeamOrders, {
  APIFTOResponse,
  FieldTeamOrder,
  UserDirectoryEntry,
  transformAPIToFieldTeamOrders,
} from "./TaskFieldTeamOrders";
import WorkOrderDetailsV2 from "./WorkOrderDetailsV2";
import SummaryTab from "./SummaryTab";
import SubtasksTab from "./SubtasksTab";
import type { SubtaskItem } from "./SubtasksTab";
import TaskSummaryModals from "./TaskSummaryModals";
import { useTabContext } from "@/hooks/useTabContext";
import { usePageState } from "@/hooks/usePageState";
import { useTaskSummaryUI } from "@/hooks/useTaskSummaryUI";
import TaskOverviewCard from "@/components/TaskOverviewCard";
import TaskLocationCard from "@/components/TaskLocationCard";
import LinkedTasksCard from "@/components/LinkedTasksCard";
import TaskUpdatesTimeline from "@/components/TaskUpdatesTimeline";
import PeopleCard from "@/components/PeopleCard";
import SectionCard from "@/components/SectionCard";
import PersonAvatars from "@/components/PersonAvatars";
import TaskStatusBadge from "@/components/TaskStatusBadge";
import TaskPriorityBadge from "@/components/TaskPriorityBadge";
import CreateTaskModal from "@/components/CreateTaskModal";
import { formatUnitLabel, UNIT_EMPTY_DISPLAY } from "@/utils/unitLabel";
import {
  AddNoteModal,
  AddFileModal,
  EditTaskDetailsModal,
  LinkTaskModal,
} from "@/components/task";
import { StatusSelectField } from "@/components/forms/StatusSelectField";
import { PrioritySelectField } from "@/components/forms/PrioritySelectField";
import { NotesTemplate } from "@/components/templates";
import { FilesTemplate } from "@/components/templates";
import type { Note } from "@/components/templates";
import type { File } from "@/components/templates";
import type { LinkedTaskData } from "@/components/task";
import type { EditTaskDetailsData } from "@/components/task";
import type { MultiSelectOption } from "@/components/forms";
import type { UploadedFile } from "@/components/ui/attachment-uploader";
import { ModalTemplate, ModalButtons } from "@/components/ui/ModalTemplate";
import { FormLayout, FormSection } from "@/components/ui/form-layout";
import PdfViewerModal from "@/components/PdfViewerModal";
import MsgViewerModal from "@/components/MsgViewerModal";
import RecordBillModal from "@/components/RecordBillModal";
import { parseMsgFile } from "@/utils/parseMsgFile";
import { parseEmlFile } from "@/utils/parseEmlFile";
import type { ParsedMsg } from "@/utils/parseMsgFile";
import { fetchJSON, API_BASE, authFetch } from "@/api/fetchJSON";
import { openAuthPdf } from "@/api/openAuthPdf";
import { useAuth } from "@/auth/useAuth";
import { usePdfViewer } from "@/hooks/usePdfViewer";
import { convertFiletoPdf } from "@/utils/convertFiletoPdf";
import { usePropertyBreadcrumb } from "@/hooks/PropertyBreadcrumbContext";

// Vendor master data with contact information
const vendorMasterData: Record<
  string,
  { email: string; phone: string; title: string }
> = {
  "ABC Doors & Hardware": {
    email: "info@abcdoors.com",
    phone: "(555) 123-1234",
    title: "Vendor Company",
  },
  "Elite HVAC Services": {
    email: "contact@elitehvac.com",
    phone: "(555) 234-5678",
    title: "Vendor Company",
  },
  "Glass & Frames Inc": {
    email: "sales@glassframes.com",
    phone: "(555) 345-6789",
    title: "Vendor Company",
  },
  "Pro Roofing Solutions": {
    email: "quote@proroofing.com",
    phone: "(555) 456-7890",
    title: "Vendor Company",
  },
  "Dolce Plumbing & Heating LLC": {
    email: "service@dolceplumbing.com",
    phone: "(555) 567-8901",
    title: "Vendor Company",
  },
  "Spark Electrical": {
    email: "jobs@sparkelectrical.com",
    phone: "(555) 678-9012",
    title: "Vendor Company",
  },
  "Premium Painters Co": {
    email: "estimate@premiumpainters.com",
    phone: "(555) 789-0123",
    title: "Vendor Company",
  },
  "Quality Flooring LLC": {
    email: "orders@qualityflooring.com",
    phone: "(555) 890-1234",
    title: "Vendor Company",
  },
  "Green Lawn Services": {
    email: "schedule@greenlawn.com",
    phone: "(555) 901-2345",
    title: "Vendor Company",
  },
  "Outdoor Construction Corp": {
    email: "bids@outdoorconstruction.com",
    phone: "(555) 012-3456",
    title: "Vendor Company",
  },
};

// Internal Team Master Data
const internalTeamMasterData: Record<
  string,
  { email: string; phone: string; title: string }
> = {
  "Jerry Sanchez": {
    email: "jerry.sanchez@company.com",
    phone: "(555) 111-1111",
    title: "Field Technician",
  },
  "Sarah Wilson": {
    email: "sarah.wilson@company.com",
    phone: "(555) 555-5555",
    title: "Project Manager",
  },
  "Jane Smith": {
    email: "jane.smith@company.com",
    phone: "(555) 333-3333",
    title: "HVAC Specialist",
  },
  "Tom Davis": {
    email: "tom.davis@company.com",
    phone: "(555) 666-6666",
    title: "Supervisor",
  },
  "Lisa Brown": {
    email: "lisa.brown@company.com",
    phone: "(555) 777-7777",
    title: "Inspector",
  },
  "John Doe": {
    email: "john.doe@company.com",
    phone: "(555) 222-2222",
    title: "Lead Inspector",
  },
  "Mike Johnson": {
    email: "mike.johnson@company.com",
    phone: "(555) 444-4444",
    title: "Plumber",
  },
  "Julia LoSchiavo": {
    email: "julia.loschiavo@company.com",
    phone: "(555) 123-4567",
    title: "Project Manager",
  },
  "Chris Henry": {
    email: "chris.henry@company.com",
    phone: "(555) 888-9999",
    title: "Coordinator",
  },
  "Connor Smith": {
    email: "connor.smith@company.com",
    phone: "(555) 000-1111",
    title: "Technician",
  },
  "Sarah Martinez": {
    email: "sarah.martinez@company.com",
    phone: "(555) 222-4444",
    title: "Specialist",
  },
};

// Field team member master data with contact information
const fieldTeamMasterData: Record<
  string,
  { email: string; phone: string; title: string }
> = {
  "Christopher Harris": {
    email: "christopher.harris@company.com",
    phone: "(555) 111-2222",
    title: "Field Lead",
  },
  "Cassandra Smith": {
    email: "cassandra.smith@company.com",
    phone: "(555) 222-3333",
    title: "Field Technician",
  },
  "David Chen": {
    email: "david.chen@company.com",
    phone: "(555) 333-4444",
    title: "Field Specialist",
  },
  "Emma Rodriguez": {
    email: "emma.rodriguez@company.com",
    phone: "(555) 444-5555",
    title: "Field Technician",
  },
  "James Wilson": {
    email: "james.wilson@company.com",
    phone: "(555) 555-6666",
    title: "Field Lead",
  },
};

// Helper to hydrate person data
const hydratePerson = (person: {
  id: number | string;
  name: string;
  initials?: string;
}) => {
  const internal = internalTeamMasterData[person.name];
  const field = fieldTeamMasterData[person.name];
  const vendor = vendorMasterData[person.name];
  const info = internal || field || vendor;

  // Generate initials if missing
  const initials =
    person.initials ||
    person.name
      .split(" ")
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase();

  return {
    ...person,
    initials,
    email: info?.email || "",
    phone: info?.phone || "",
    title: info?.title || "",
  };
};

/**
 * API response shape for task notes
 */
interface ApiTaskNote {
  id: number;
  task_id: number;
  author_type: string;
  author_id: number;
  body: string;
  is_visible_to_client: boolean;
  created_at: string;
  updated_at: string | null;
}

/**
 * API response shape for task attachments
 */
interface ApiTaskAttachment {
  id: number;
  task_id: number;
  file_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  uploaded_by_type: string;
  uploaded_by: number;
  label: string | null;
  description: string | null;
  created_at: string;
}

/**
 * API response shape for file upload
 */
interface ApiFileUploadResponse {
  ok: boolean;
  temp_object_key: string;
  original_name: string;
  file_type: string;
  file_size: number;
  sha256: string;
}

/**
 * API response shape for task updates feed (task_updates table)
 */
interface ApiTaskUpdateFeedRow {
  id: number;
  task_id: number;
  actor_type: string;
  actor_id: number | null;
  update_type: string;
  old_value: any | null;
  new_value: any | null;
  message: string;
  attachment_ids: number[] | null;
  is_visible_to_client: boolean;
  timestamp: string;
}

interface PropertyManagerRecord {
  id: number;
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
}

/**
 * Format task created/updated for display (handles ISO or locale strings)
 */
function formatTaskDateTime(dateString: string | null | undefined): string {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return dateString;
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return dateString;
  }
}

/**
 * Transform API note to UI Note format
 */
function transformApiNoteToUiNote(
  apiNote: ApiTaskNote,
  propertyManagers?: Map<number, string>,
): Note {
  // Format date to "MM/DD/YYYY HH:MM AM/PM" format
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Look up property manager name by author_id, fallback to "User" if not found
  const authorName =
    propertyManagers?.get(apiNote.author_id) || "User";

  return {
    id: apiNote.id,
    text: apiNote.body,
    date: formatDate(apiNote.created_at),
    author: authorName,
    // Store API fields for potential future use
    author_type: apiNote.author_type,
    author_id: apiNote.author_id,
    is_visible_to_client: apiNote.is_visible_to_client,
    created_at: apiNote.created_at,
    updated_at: apiNote.updated_at,
  };
}

export default function TaskSummary() {
  const { taskId, tab, workOrderId } = useParams<{
    taskId: string;
    tab?: string;
    workOrderId?: string;
  }>();
  const navigate = useNavigate();
  const location = useLocation();
  const navigationState = location.state as any;
  const { selectedTab, setTabMetadata, tabMetadata } = useTabContext();
  const { userId } = useAuth();
  const { setTaskDisplayName } = usePropertyBreadcrumb();

  // Extract sequentialNumber from navigation state
  const sequentialNumber = navigationState?.sequentialNumber;

  // State for fetched task data
  const [fetchedTaskData, setFetchedTaskData] = useState<any>(null);

  // Ref to track the last fetched taskId to prevent duplicate fetches
  const lastFetchedTaskIdRef = useRef<string | null>(null);

  // Function to fetch task data from API (can be called manually to refresh)
  const refetchTaskData = useCallback(async () => {
    if (!taskId) return;

    try {
      const apiTask = await fetchJSON(`/maintenance/tasks/${taskId}`);
      if (apiTask) {
        // Format property display string (same format as used in EditTaskDetailsModal)
        // The modal uses: property_name || [address_line1, city, state].filter(Boolean).join(", ") || `Property #${id}`
        const propertyDisplay = apiTask.property_name || 
          (apiTask.property_address ? apiTask.property_address : `Property #${apiTask.property_id}`);
        
        // Transform API response to match expected format
        const refreshedData = {
          id: apiTask.id,
          title: apiTask.name || apiTask.title,
          name: apiTask.name,
          description: apiTask.description,
          status: apiTask.status,
          priority: apiTask.priority,
          category: apiTask.category,
          property_id: apiTask.property_id,
          property_name: apiTask.property_name,
          property_address: apiTask.property_address,
          location_address: apiTask.location_address,
          property: propertyDisplay, // Add property field for display
          unit_id: apiTask.unit_id,
          unit: formatUnitLabel({
            unitId: apiTask.unit_id ?? apiTask.unit,
            unitName: apiTask.unit_name ?? apiTask.unit,
            fallback: "",
          }),
          dueDate: apiTask.due_date,
          due_date: apiTask.due_date,
          createdAt: apiTask.date_requested,
          updated: apiTask.last_updated,
          requested_by: apiTask.requested_by,
          assignees: apiTask.assignees || [],
          collaborators: apiTask.collaborators || [],
          attachments: apiTask.attachments || [],
        };
        
        setFetchedTaskData(refreshedData);
        lastFetchedTaskIdRef.current = taskId;
      }
    } catch (error) {
      console.error("Failed to fetch task data:", error);
    }
  }, [taskId]);

  // Always fetch fresh task data from API on mount/route change to ensure we have latest data
  useEffect(() => {
    // Only fetch if taskId exists and we haven't already fetched this taskId
    if (taskId && lastFetchedTaskIdRef.current !== taskId) {
      refetchTaskData();
    }
  }, [taskId, refetchTaskData]);

  // Use fetched API data, falling back to navigation state only if fetch hasn't returned yet
  const taskData =
    fetchedTaskData ||
    navigationState?.taskData ||
    navigationState?.task ||
    null;

  // Track taskId changes (debugging logs removed)
  const lastLoggedTaskIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (taskId && lastLoggedTaskIdRef.current !== taskId) {
      lastLoggedTaskIdRef.current = taskId;
    }
  }, [taskId, taskData]);

  // Keep breadcrumb in sync with loaded task title
  useEffect(() => {
    if (taskData?.title) setTaskDisplayName(taskData.title);
    return () => setTaskDisplayName(null);
  }, [taskData?.title, setTaskDisplayName]);

  // Ref for tracking blob URLs created during task initialization
  const createdAttachmentUrlsRef = useRef<Set<string>>(new Set());

  // Initialize UI state reducer
  const { state: uiState, dispatch: uiDispatch } = useTaskSummaryUI(
    (tab as "summary" | "workorders" | "fieldteam" | "subtasks") || "summary",
  );

  // PDF viewer hook (same as ApproveFtoPage)
  const pdfViewer = usePdfViewer();

  // .msg viewer: parse and show in modal instead of opening URL (which triggers download)
  const [msgViewer, setMsgViewer] = useState<{
    isOpen: boolean;
    title: string;
    data: ParsedMsg | null;
    loading: boolean;
    error: string | null;
  }>({ isOpen: false, title: "", data: null, loading: false, error: null });

  // Initialize activeTab and selectedWorkOrderId from URL params on mount and when URL changes
  useEffect(() => {
    // If workOrderId is present but tab is not, we're on the workorders tab
    // Also check if the path ends with /workorders to determine the tab
    const pathEndsWithWorkorders = location.pathname.endsWith('/workorders') && !workOrderId;
    const tabValue = workOrderId && !tab
      ? "workorders"
      : pathEndsWithWorkorders
      ? "workorders"
      : (tab as "summary" | "workorders" | "fieldteam" | "subtasks") || "summary";
    if (tabValue !== uiState.activeTab) {
      uiDispatch({ type: "SET_ACTIVE_TAB", payload: tabValue });
    }

    // Use URL workOrderId if available (on workorders tab with a selection)
    // Otherwise use preserved ID from location state (when returning from other tabs)
    // If preservedWorkOrderId is explicitly null in navigation state, clear the selection
    let urlId: number | null = null;
    if (workOrderId) {
      urlId = parseInt(workOrderId);
    } else if (navigationState?.preservedWorkOrderId !== undefined) {
      // If preservedWorkOrderId is explicitly set (including null), use it
      urlId = navigationState.preservedWorkOrderId;
    }
    
    if (urlId !== uiState.selectedWorkOrderId) {
      uiDispatch({ type: "SET_SELECTED_WORK_ORDER_ID", payload: urlId });
    }
  }, [tab, workOrderId, navigationState?.preservedWorkOrderId, uiDispatch, location.pathname, uiState.selectedWorkOrderId]);

  // Sync state to URL when tab changes (from user clicking tab button)
  // This happens when handleTabChange calls navigate, then this ensures state is synced
  /*
    REMOVED: This effect caused a race condition/bounce because it would try to sync "old" state
    back to the URL before the URL-to-State sync could update the state.
    Since we are using URL as the single source of truth and all actions (tabs, rows, create)
    trigger navigation explicitly, we don't need to sync State -> URL here.
    We only need to handle the case where no tab is selected (redirect to summary).
  */
  useEffect(() => {
    // Don't redirect if we have a workOrderId (we're on workorders tab) or if tab is already set
    if (!tab && !workOrderId && taskId) {
      // Preserve task data when redirecting
      const preservedState = {
        ...navigationState,
        taskData: taskData || navigationState?.taskData || navigationState?.task || fetchedTaskData,
        task: taskData || navigationState?.task || navigationState?.taskData || fetchedTaskData,
      };
      navigate(`/tasks/${taskId}/summary`, {
        replace: true,
        state: preservedState, // Preserve the navigation state when redirecting
      });
    }
  }, [tab, workOrderId, taskId, navigate, navigationState, taskData, fetchedTaskData]);

  // Handle FTO approval/rejection return state
  useEffect(() => {
    if (navigationState?.ftoAction && navigationState?.ftoId) {
      const actionFtoId = Number(navigationState.ftoId);

      if (navigationState.ftoAction === "approved") {
        setFieldTeamOrders((prev) =>
          prev.map((o) =>
            o.id === actionFtoId
              ? {
                  ...o,
                  status: "approved",
                  timesheetStatus: "approved",
                }
              : o,
          ),
        );

        setUpdates((prev) => [
          {
            id: prev.length + 1,
            author: "System",
            authorType: "assignee",
            action: `timesheet for field team order #${actionFtoId} was approved`,
            timestamp: new Date().toLocaleString(),
            icon: <ApproveIcon width={16} height={16} />,
          },
          ...prev,
        ]);
      } else if (navigationState.ftoAction === "rejected") {
        setFieldTeamOrders((prev) =>
          prev.map((o) =>
            o.id === actionFtoId
              ? {
                  ...o,
                  status: "dispatched",
                  timesheetStatus: "rejected",
                }
              : o,
          ),
        );

        setUpdates((prev) => [
          {
            id: prev.length + 1,
            author: "System",
            authorType: "assignee",
            action: `timesheet for field team order #${actionFtoId} was rejected`,
            timestamp: new Date().toLocaleString(),
            icon: <EditIcon width={16} height={16} />,
          },
          ...prev,
        ]);
      }
    }
  }, [navigationState?.ftoAction, navigationState?.ftoId]);

  // Determine if this is a new task (created in this session via navigation state)
  const isNewTask = !!(navigationState?.taskData || navigationState?.task);

  // Update current tab's metadata with actual task name when loaded (stay in same tab; do not switch or add tabs)
  useEffect(() => {
    if (taskId && taskData?.title && selectedTab) {
      const activeTab =
        (tab as "summary" | "workorders" | "fieldteam" | "subtasks") || "summary";
      const existing = tabMetadata[selectedTab];
      setTabMetadata(selectedTab, {
        ...existing,
        label: taskData.title,
        route: `/tasks/${taskId}/${activeTab}`,
        sectionId: "all-tasks",
      });
    }
  }, [taskId, taskData?.title, tab, selectedTab, setTabMetadata]);

  // Track creation and last updated (raw from API or set on edit; formatted for display via formatTaskDateTime)
  const [createdTimestamp, setCreatedTimestamp] = useState<string>(() => {
    return (
      taskData?.createdAt || taskData?.updated || new Date().toISOString()
    );
  });

  const [lastUpdatedTimestamp, setLastUpdatedTimestamp] =
    useState<string>(() => taskData?.updated || taskData?.createdAt || createdTimestamp);

  // Sync from taskData when task is loaded/refetched from API
  useEffect(() => {
    if (taskData?.createdAt) setCreatedTimestamp(taskData.createdAt);
    if (taskData?.updated) setLastUpdatedTimestamp(taskData.updated);
  }, [taskData?.createdAt, taskData?.updated]);

  // Notes state - loaded from API
  const [notes, setNotes] = useState<Note[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);

  // Property managers map (ID -> name) for matching note authors
  const [propertyManagers, setPropertyManagers] = useState<
    Map<number, string>
  >(new Map());

  // Property managers details (ID -> details) for matching update actors
  const [propertyManagerDetailsById, setPropertyManagerDetailsById] = useState<
    Map<number, { name: string; email: string; phone?: string; role: string }>
  >(new Map());

  // Property manager details for the creator (requested_by)
  const [creatorDetails, setCreatorDetails] = useState<{
    name: string;
    email: string;
    role: string;
    phone?: string;
    initials: string;
  } | null>(null);

  // Fetch property managers on mount
  useEffect(() => {
    const fetchPropertyManagers = async () => {
      try {
        const data: PropertyManagerRecord[] = await fetchJSON(
          "/users/property-managers",
        );
        const pmMap = new Map<number, string>();
        const pmDetailsMap = new Map<
          number,
          { name: string; email: string; phone?: string; role: string }
        >();
        data.forEach((pm: any) => {
          const id = Number(pm.id);
          const name = pm.name || pm.email || `PM ${pm.id}`;
          const email = pm.email || "";
          const role = pm.role || "Property Manager";
          const phone = pm.phone;

          pmMap.set(id, name);
          pmDetailsMap.set(id, { name, email, role, phone });
        });
        setPropertyManagers(pmMap);
        setPropertyManagerDetailsById(pmDetailsMap);
        
        // If taskData has requested_by, find and set creator details
        const requestedById = taskData?.requested_by ?? null;
        if (requestedById != null) {
          const creator = data.find((pm: any) => Number(pm.id) === Number(requestedById));
          if (creator) {
            const name = creator.name || creator.email || "Unknown";
            const initials = name
              .split(" ")
              .slice(0, 2)
              .map((w: string) => w[0])
              .join("")
              .toUpperCase()
              .slice(0, 2);
            
            setCreatorDetails({
              name,
              email: creator.email || "",
              role: creator.role || "Property Manager",
              phone: creator.phone,
              initials,
            });
          } else {
            console.warn(`Property manager with ID ${requestedById} not found in property managers list`);
          }
        } else {
          console.log("No requested_by ID found in taskData:", taskData);
        }
      } catch (err) {
        console.error("Failed to fetch property managers:", err);
      }
    };

    fetchPropertyManagers();
  }, [taskData?.requested_by]);

  const initialsFromName = useCallback((name: string): string => {
    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }, []);

  const formatTimestamp = useCallback((ts: string): string => {
    const d = new Date(ts);
    if (Number.isNaN(d.getTime())) return ts;
    return d.toLocaleString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }, []);

  const normalizeStatusForBadge = useCallback((status: string | undefined) => {
    if (!status) return "not_started";
    const s = String(status).toLowerCase();
    if (s === "in_progress") return "in_progress";
    if (s === "open") return "not_started";
    if (s === "closed" || s === "completed") return "completed";
    // fallbacks for other backend statuses
    if (s === "scheduled" || s === "pending_vendor") return "in_progress";
    if (s === "cancelled") return "completed";
    return "not_started";
  }, []);

  const normalizePriorityForBadge = useCallback((priority: string | undefined) => {
    if (!priority) return "normal";
    const p = String(priority).toLowerCase();
    if (p === "medium") return "normal";
    if (p === "low" || p === "normal" || p === "high" || p === "urgent") return p;
    return "normal";
  }, []);

  const buildUpdateFieldsDisplay = useCallback(
    (row: ApiTaskUpdateFeedRow) => {
      const oldV = (row.old_value ?? {}) as any;
      const newV = (row.new_value ?? {}) as any;

      // creation: show status/priority/due date/assignees grid (matches screenshot)
      if (row.update_type === "task_created") {
        const fallbackStatus =
          typeof taskData?.status === "string" ? taskData.status : undefined;
        const fallbackPriority =
          typeof taskData?.priority === "string" ? taskData.priority : undefined;

        const statusBadge = (
          <TaskStatusBadge
            status={normalizeStatusForBadge(newV.status || fallbackStatus)}
          />
        );
        const priorityBadge = (
          <TaskPriorityBadge
            priority={normalizePriorityForBadge(newV.priority || fallbackPriority)}
          />
        );
        const rawDueDate =
          newV.due_date || taskData?.dueDate || taskData?.due || taskData?.due_date;
        const due = rawDueDate ? new Date(rawDueDate) : null;
        const dueLabel =
          due && !Number.isNaN(due.getTime())
            ? due.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : "No due date";

        const assignees: Array<{ id: number; name: string; email?: string }> =
          Array.isArray(newV.assignees)
            ? newV.assignees
            : Array.isArray(taskData?.assignees)
              ? taskData.assignees
              : [];
        const people = assignees.map((a) => ({
          id: a.id,
          name: a.name,
          initials: initialsFromName(a.name),
          email: a.email,
        }));

        return (
          <div className="grid grid-cols-4 gap-6 mt-3">
            <div>
              <div className="text-xs font-medium text-[#71717A] uppercase tracking-wider">
                Status
              </div>
              <div className="mt-0.5">{statusBadge}</div>
            </div>
            <div>
              <div className="text-xs font-medium text-[#71717A] uppercase tracking-wider">
                Priority
              </div>
              <div className="mt-0.5">{priorityBadge}</div>
            </div>
            <div>
              <div className="text-xs font-medium text-[#71717A] uppercase tracking-wider">
                Due Date
              </div>
              <div className="text-sm text-[#303030] font-medium mt-0.5">
                {dueLabel}
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-[#71717A] uppercase tracking-wider">
                Assignees
              </div>
              <div className="mt-0.5">
                <PersonAvatars people={people} type="assignee" />
              </div>
            </div>
          </div>
        );
      }

      // status / priority / assignee changes: show a minimal grid of the changed field
      if (row.update_type === "status_change") {
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-3">
            <div>
              <div className="text-xs font-medium text-[#71717A] uppercase tracking-wider">
                Status
              </div>
              <div className="mt-0.5">
                <TaskStatusBadge status={normalizeStatusForBadge(newV.status)} />
              </div>
            </div>
          </div>
        );
      }

      if (row.update_type === "priority_change") {
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-3">
            <div>
              <div className="text-xs font-medium text-[#71717A] uppercase tracking-wider">
                Priority
              </div>
              <div className="mt-0.5">
                <TaskPriorityBadge
                  priority={normalizePriorityForBadge(newV.priority)}
                />
              </div>
            </div>
          </div>
        );
      }

      if (row.update_type === "assignee_change") {
        const assignees: Array<{ id: number; name: string; email?: string }> =
          Array.isArray(newV.assignees) ? newV.assignees : [];
        const people = assignees.map((a) => ({
          id: a.id,
          name: a.name,
          initials: initialsFromName(a.name),
          email: a.email,
        }));
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-3">
            <div>
              <div className="text-xs font-medium text-[#71717A] uppercase tracking-wider">
                Assignees
              </div>
              <div className="mt-0.5">
                <PersonAvatars people={people} type="assignee" />
              </div>
            </div>
          </div>
        );
      }

      // Subtask created: show subtask name and assignees if present
      if (row.update_type === "subtask_created") {
        const name = newV.subtask_name ?? "Subtask";
        const assignees: Array<{ id: number; name: string; email?: string }> =
          Array.isArray(newV.assignees) ? newV.assignees : [];
        const people = assignees.map((a: { id?: number; name?: string; email?: string }) => ({
          id: Number(a.id ?? 0),
          name: a.name ?? "",
          initials: initialsFromName(a.name ?? ""),
          email: a.email,
        }));
        return (
          <div className="mt-3">
            <div className="text-xs font-medium text-[#71717A] uppercase tracking-wider">
              Subtask
            </div>
            <div className="text-sm text-[#303030] font-medium mt-0.5">{name}</div>
            {people.length > 0 && (
              <div className="mt-2">
                <div className="text-xs font-medium text-[#71717A] uppercase tracking-wider">
                  Assignees
                </div>
                <div className="mt-0.5">
                  <PersonAvatars people={people} type="assignee" />
                </div>
              </div>
            )}
          </div>
        );
      }

      // Subtask completed: show subtask name
      if (row.update_type === "subtask_completed") {
        const name = newV.subtask_name ?? "Subtask";
        return (
          <div className="mt-3">
            <div className="text-xs font-medium text-[#71717A] uppercase tracking-wider">
              Completed
            </div>
            <div className="text-sm text-[#303030] font-medium mt-0.5">{name}</div>
          </div>
        );
      }

      // Generic fallback: if the row contains known fields in new_value, render them
      // (covers update_type like "general_update", "due_date_change", etc.)
      const hasStatus = typeof newV.status === "string";
      const hasPriority = typeof newV.priority === "string";
      const hasDueDate = typeof newV.due_date === "string";
      const hasAssignees = Array.isArray(newV.assignees);

      if (!hasStatus && !hasPriority && !hasDueDate && !hasAssignees) {
        void oldV;
        return undefined;
      }

      const cells: Array<{ label: string; value: React.ReactNode }> = [];

      if (hasStatus) {
        cells.push({
          label: "Status",
          value: (
            <TaskStatusBadge status={normalizeStatusForBadge(newV.status)} />
          ),
        });
      }

      if (hasPriority) {
        cells.push({
          label: "Priority",
          value: (
            <TaskPriorityBadge
              priority={normalizePriorityForBadge(newV.priority)}
            />
          ),
        });
      }

      if (hasDueDate) {
        const d = new Date(newV.due_date);
        const dueLabel =
          !Number.isNaN(d.getTime())
            ? d.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : String(newV.due_date);
        cells.push({
          label: "Due Date",
          value: (
            <div className="text-sm text-[#303030] font-medium mt-0.5">
              {dueLabel}
            </div>
          ),
        });
      }

      if (hasAssignees) {
        const assignees: Array<{ id: number; name: string; email?: string }> =
          newV.assignees;
        const people = assignees.map((a) => ({
          id: a.id,
          name: a.name,
          initials: initialsFromName(a.name),
          email: a.email,
        }));
        cells.push({
          label: "Assignees",
          value: <PersonAvatars people={people} type="assignee" />,
        });
      }

      // 1 col on small, 2 on md, 3 on lg (same style as other updates)
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-3">
          {cells.map((c) => (
            <div key={c.label}>
              <div className="text-xs font-medium text-[#71717A] uppercase tracking-wider">
                {c.label}
              </div>
              <div className="mt-0.5">{c.value}</div>
            </div>
          ))}
        </div>
      );
    },
    [
      initialsFromName,
      normalizePriorityForBadge,
      normalizeStatusForBadge,
      taskData,
    ],
  );

  // Load notes from API
  const loadNotes = useCallback(async () => {
    if (!taskId) return;

    try {
      setNotesLoading(true);
      const apiNotes: ApiTaskNote[] = await fetchJSON(
        `/maintenance/tasks/id/${taskId}/notes`,
      );
      const transformedNotes = apiNotes.map((note) =>
        transformApiNoteToUiNote(note, propertyManagers),
      );
      setNotes(transformedNotes);
    } catch (error) {
      console.error("Error loading notes:", error);
      setNotes([]);
    } finally {
      setNotesLoading(false);
    }
  }, [taskId, propertyManagers]);

  // Load notes on mount and when taskId changes
  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  // Handle creating a new note
  const handleCreateNote = useCallback(
    async (body: string, isVisibleToClient: boolean = false) => {
      if (!taskId) return;
      if (!userId) {
        console.error("User ID is required to create a note");
        throw new Error("User ID is required");
      }

      try {
        const newNote = await fetchJSON(`/maintenance/tasks/id/${taskId}/notes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            author_type: "property_manager",
            author_id: userId,
            body,
            is_visible_to_client: isVisibleToClient,
          }),
        });
        const transformedNote = transformApiNoteToUiNote(
          newNote,
          propertyManagers,
        );
        setNotes((prev) => [transformedNote, ...prev]);
      } catch (error) {
        console.error("Error creating note:", error);
        throw error;
      }
    },
    [taskId, userId, propertyManagers],
  );

  // Handle updating a note
  const handleUpdateNote = useCallback(
    async (noteId: number, body: string, isVisibleToClient?: boolean) => {
      try {
        const updateData: any = { body };
        if (isVisibleToClient !== undefined) {
          updateData.is_visible_to_client = isVisibleToClient;
        }

        const updatedNote = await fetchJSON(`/maintenance/notes/${noteId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData),
        });
        const transformedNote = transformApiNoteToUiNote(
          updatedNote,
          propertyManagers,
        );
        setNotes((prev) =>
          prev.map((n) => (n.id === noteId ? transformedNote : n)),
        );
      } catch (error) {
        console.error("Error updating note:", error);
        throw error;
      }
    },
    [propertyManagers],
  );

  // Handle deleting a note
  const handleDeleteNote = useCallback(async (noteId: number) => {
    try {
      await fetchJSON(`/maintenance/notes/${noteId}`, {
        method: "DELETE",
      });
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
    } catch (error) {
      console.error("Error deleting note:", error);
      throw error;
    }
  }, []);

  // Handle creating a new file attachment (two-step: upload then create)
  const handleCreateFile = useCallback(
    async (
      uploadedFiles: Array<{
        id: string;
        name: string;
        file?: File;
        url?: string;
      }>,
      category: string,
      description: string,
    ) => {
      if (!taskId) return;
      if (!userId) {
        console.error("User ID is required to create a file");
        throw new Error("User ID is required");
      }
      if (uploadedFiles.length === 0 || !uploadedFiles[0].file) {
        throw new Error("File is required");
      }

      try {
        // Cast to browser File (this module also imports template type File)
        let fileToUpload = uploadedFiles[0].file as unknown as globalThis.File;
        // Convert images to PDF before upload; skip conversion for .msg (upload as-is)
        const isMsg = /\.msg$/i.test(fileToUpload.name);
        const isImage =
          !isMsg &&
          (fileToUpload.type.startsWith("image/") ||
            /\.(jpg|jpeg|png|gif|webp|heic|heif)$/i.test(fileToUpload.name));
        if (isImage) {
          fileToUpload = await convertFiletoPdf(fileToUpload);
        }

        // Step 1: Upload file to temporary storage
        const formData = new FormData();
        formData.append("file", fileToUpload, fileToUpload.name);

        const uploadRes = await authFetch("/maintenance/tasks/attachments/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) {
          const text = await uploadRes.text();
          throw new Error(`Upload failed ${uploadRes.status}: ${text}`);
        }

        const uploadResponse: ApiFileUploadResponse = await uploadRes.json();

        // Step 2: Create attachment record
        const newAttachment = await fetchJSON(
          `/maintenance/tasks/id/${taskId}/attachments`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              file_name: uploadResponse.original_name,
              file_type: uploadResponse.file_type,
              file_size: uploadResponse.file_size,
              storage_path: uploadResponse.temp_object_key,
              uploaded_by_type: "user",
              uploaded_by: userId,
              label: category || null,
              description: description || null,
            }),
          },
        );

        const transformedFile = transformApiAttachmentToUiFile(newAttachment);
        setFiles((prev) => [transformedFile, ...prev]);
      } catch (error) {
        console.error("Error creating file:", error);
        throw error;
      }
    },
    [taskId, userId],
  );

  // Handle updating a file attachment
  const handleUpdateFile = useCallback(
    async (fileId: number, label?: string, description?: string) => {
      try {
        const updateData: any = {};
        if (label !== undefined) {
          updateData.label = label || null;
        }
        if (description !== undefined) {
          updateData.description = description || null;
        }

        const updatedAttachment = await fetchJSON(
          `/maintenance/attachments/${fileId}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updateData),
          },
        );

        const transformedFile = transformApiAttachmentToUiFile(updatedAttachment);
        setFiles((prev) =>
          prev.map((f) => (f.id === fileId ? transformedFile : f)),
        );
      } catch (error) {
        console.error("Error updating file:", error);
        throw error;
      }
    },
    [],
  );

  // Handle deleting a file attachment
  const handleDeleteFile = useCallback(async (fileId: number) => {
    try {
      await fetchJSON(`/maintenance/attachments/${fileId}`, {
        method: "DELETE",
      });
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
    } catch (error) {
      console.error("Error deleting file:", error);
      throw error;
    }
  }, []);

  // Files state - loaded from API
  const [files, setFiles] = useState<File[]>([]);
  const [filesLoading, setFilesLoading] = useState(false);

  /**
   * Transform API attachment to UI File format
   */
  const transformApiAttachmentToUiFile = (
    apiAttachment: ApiTaskAttachment,
  ): File => {
    // Format date to "MM/DD/YYYY HH:MM AM/PM" format
    const formatDate = (dateString: string): string => {
      const date = new Date(dateString);
      return date.toLocaleString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    };

    // TODO: Construct file URL from storage_path if needed
    // For now, we'll leave url undefined and handle it later if needed
    return {
      id: apiAttachment.id,
      name: apiAttachment.file_name,
      url: undefined, // TODO: Construct download URL from storage_path if needed
      uploadedAt: formatDate(apiAttachment.created_at),
      category: apiAttachment.label || "",
      description: apiAttachment.description || "",
      // Store API fields for potential future use
      file_type: apiAttachment.file_type,
      file_size: apiAttachment.file_size,
      storage_path: apiAttachment.storage_path,
      uploaded_by_type: apiAttachment.uploaded_by_type,
      uploaded_by: apiAttachment.uploaded_by,
    };
  };

  // Load attachments from API
  const loadFiles = useCallback(async () => {
    if (!taskId) return;

    try {
      setFilesLoading(true);
      const apiAttachments: ApiTaskAttachment[] = await fetchJSON(
        `/maintenance/tasks/id/${taskId}/attachments`,
      );
      const transformedFiles = apiAttachments.map(transformApiAttachmentToUiFile);
      setFiles(transformedFiles);
    } catch (error) {
      console.error("Error loading files:", error);
      setFiles([]);
    } finally {
      setFilesLoading(false);
    }
  }, [taskId]);

  // Load files on mount and when taskId changes
  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const getAttachmentData = (file: any, index?: number) => {
    const fileUrl: string | undefined =
      file?.file instanceof File
        ? URL.createObjectURL(file.file)
        : typeof file?.url === "string"
          ? file.url
          : undefined;

    if (fileUrl && fileUrl.startsWith("blob:")) {
      createdAttachmentUrlsRef.current.add(fileUrl);
    }

    // Support both UI shape (name) and API shape (file_name) so .msg and display work after store
    const fileName = file?.name ?? (file as any)?.file_name ?? "";
    const isImage =
      typeof file?.type === "string"
        ? file.type.startsWith("image/")
        : fileName
          ? /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName)
          : false;

    // Ensure ID is stable and unique. Prefer file.id, fallback to name+index for initial files
    const stableId =
      file.id ||
      (index !== undefined ? `${fileName || "file"}-${index}` : fileName || "file");

    return {
      name: fileName,
      url: fileUrl,
      preview: isImage ? fileUrl : undefined,
      id: String(stableId),
      // Pass through so handleViewAttachment can detect .msg/.eml for stored files
      storage_path: (file as any)?.storage_path,
      file_name: (file as any)?.file_name,
      file_type: (file as any)?.file_type,
    };
  };

  // Single handler for viewing any attachment: .msg/.eml → MsgViewerModal, else → PdfViewerModal (viewingAttachment).
  const handleViewAttachment = useCallback(
    (file: { id: string | number; name?: string; url?: string; storage_path?: string; file_type?: string; file_name?: string }) => {
      const fileName =
        file.name ?? (file as any).file_name ?? "";
      const fileType = (file as any).file_type ?? "";
      const attachmentId =
        typeof file.id === "number"
          ? file.id
          : parseInt(String(file.id), 10);
      const isMsgFile =
        fileName.toLowerCase().endsWith(".msg") ||
        (file.storage_path ?? "").toLowerCase().endsWith(".msg") ||
        fileType === "application/vnd.ms-outlook";
      const isEmlFile =
        fileName.toLowerCase().endsWith(".eml") ||
        (file.storage_path ?? "").toLowerCase().endsWith(".eml") ||
        fileType === "message/rfc822";
      const isMessageFile = isMsgFile || isEmlFile;
      const parseMessage = isEmlFile ? parseEmlFile : parseMsgFile;

      if (isMessageFile) {
        // Stored attachment with numeric id: fetch by attachment id
        if (!isNaN(attachmentId)) {
          setMsgViewer({
            isOpen: true,
            title: fileName || "Message",
            data: null,
            loading: true,
            error: null,
          });
          authFetch(`/maintenance/attachments/${attachmentId}`)
            .then((res) => {
              if (!res.ok) throw new Error("Failed to load file");
              return res.blob();
            })
            .then((blob) => parseMessage(blob))
            .then((data) =>
              setMsgViewer((prev) => ({
                ...prev,
                loading: false,
                data,
                error: null,
              }))
            )
            .catch((err) =>
              setMsgViewer((prev) => ({
                ...prev,
                loading: false,
                error:
                  err instanceof Error
                    ? err.message
                    : "Failed to load message",
              }))
            );
          return;
        }
        // Stored by storage_path (e.g. temp key): fetch by key
        if (file.storage_path) {
          setMsgViewer({
            isOpen: true,
            title: fileName || "Message",
            data: null,
            loading: true,
            error: null,
          });
          authFetch(`/files?key=${encodeURIComponent(file.storage_path)}`)
            .then((res) => {
              if (!res.ok) throw new Error("Failed to load file");
              return res.blob();
            })
            .then((blob) => parseMessage(blob))
            .then((data) =>
              setMsgViewer((prev) => ({
                ...prev,
                loading: false,
                data,
                error: null,
              }))
            )
            .catch((err) =>
              setMsgViewer((prev) => ({
                ...prev,
                loading: false,
                error:
                  err instanceof Error
                    ? err.message
                    : "Failed to load message",
              }))
            );
          return;
        }
      }

      const url =
        file.url ||
        (file.id != null
          ? `/api/maintenance/attachments/${attachmentId}`
          : undefined);
      uiDispatch({
        type: "SET_VIEWING_ATTACHMENT",
        payload: {
          id: typeof file.id === "string" ? file.id : String(file.id),
          name: file.name ?? fileName,
          url,
        },
      });
      uiDispatch({ type: "OPEN_MODAL", payload: "pdfViewer" });
      uiDispatch({ type: "CANCEL_RENAMING_ATTACHMENT" });
    },
    [uiDispatch]
  );

  const getInitialUpdate = () => {
    const statusMap: { [key: string]: string } = {
      not_started: "Not Started",
      in_progress: "In Progress",
      completed: "Completed",
      "Not Started": "Not Started",
      "In Progress": "In Progress",
      Completed: "Completed",
    };
    const priorityLabel = taskData?.priority
      ? typeof taskData.priority === "string"
        ? taskData.priority.charAt(0).toUpperCase() + taskData.priority.slice(1)
        : taskData.priority
      : "Normal";
    const dueDate =
      taskData?.dueDate || taskData?.due
        ? taskData.dueDate instanceof Date
          ? taskData.dueDate.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : taskData.dueDate || taskData.due
        : "No due date";
    const fields = [
      {
        label: "Status",
        value: (
          <TaskStatusBadge
            status={
              (statusMap[taskData?.status] ||
                taskData?.status ||
                "Not Started") as any
            }
          />
        ),
      },
      {
        label: "Priority",
        value: <TaskPriorityBadge priority={priorityLabel as any} />,
      },
      { label: "Due Date", value: dueDate },
      {
        label: "Assignees",
        value: (
          <PersonAvatars
            people={taskData?.assignees || []}
            type="assignee"
            fallback="Unassigned"
          />
        ),
      },
    ];

    if (taskData?.collaborators && taskData.collaborators.length > 0) {
      fields.push({
        label: "Collaborators",
        value: (
          <PersonAvatars people={taskData.collaborators} type="collaborator" />
        ),
      });
    }

    return {
      id: 0,
      author: "Julia LoSchiavo",
      authorType: "assignee",
      authorEmail: "julia.loschiavo@company.com",
      authorPhone: "(555) 123-4567",
      authorTitle: "Project Manager",
      action: "created this task",
      timestamp: new Date().toLocaleString(),
      fieldsDisplay: (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-3">
          {fields.map((field, idx) => (
            <div key={idx}>
              <div className="text-xs font-medium text-[#71717A] uppercase tracking-wider">
                {field.label}
              </div>
              <div className="text-sm text-[#303030] font-medium mt-0.5">
                {field.value}
              </div>
            </div>
          ))}
        </div>
      ),
      ...(taskData?.description && {
        details: (
          <div className="text-sm text-[#303030]">{taskData.description}</div>
        ),
      }),
      ...(taskData?.files &&
        taskData.files.length > 0 && {
          attachments: taskData.files.map((f: any, idx: number) =>
            getAttachmentData(f, idx),
          ),
          onAttachmentClick: handleViewAttachment,
        }),
      icon: <FlagIcon width={16} height={16} />,
      isInitialCreation: true,
    };
  };

  // Initialize updates based on whether this is a newly created task
  const getInitialUpdates = () => {
    if (isNewTask) {
      return [getInitialUpdate()];
    }

    // For existing tasks, show just the creation update
    return [
      {
        id: 0,
        author: "Julia LoSchiavo",
        authorType: "assignee",
        authorEmail: "julia.loschiavo@company.com",
        authorPhone: "(555) 123-4567",
        authorTitle: "Project Manager",
        action: "created this task",
        timestamp: "11/12/2025 9:22 PM",
        fieldsDisplay: (
          <div className="grid grid-cols-4 gap-6 mt-3">
            <div>
              <div className="text-xs font-medium text-[#71717A] uppercase tracking-wider">
                Status
              </div>
              <div className="mt-0.5">
                <TaskStatusBadge status="Not Started" />
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-[#71717A] uppercase tracking-wider">
                Priority
              </div>
              <div className="mt-0.5">
                <TaskPriorityBadge priority="Normal" />
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-[#71717A] uppercase tracking-wider">
                Due Date
              </div>
              <div className="text-sm text-[#303030] font-medium mt-0.5">
                Oct 15, 2025
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-[#71717A] uppercase tracking-wider">
                Assignees
              </div>
              <div className="mt-0.5">
                <PersonAvatars
                  people={[{ id: 1, name: "Julia LoSchiavo", initials: "JL" }]}
                  type="assignee"
                />
              </div>
            </div>
          </div>
        ),
        details: (
          <div className="text-sm text-[#303030]">
            We have been experiencing issues with the water heater. At first we
            thought the issue was due to us just moving in and maybe the water
            heater needed time to heat up after no tenants. It has been 3 days
            in a row now that we lose hot water mid shower.
          </div>
        ),
        icon: <FlagIcon width={16} height={16} />,
        isInitialCreation: true,
      },
    ];
  };

  // Updates timeline (should be sourced from DB via updates-feed endpoint)
  const [updates, setUpdates] = useState<any[]>([]);
  const [updatesLoading, setUpdatesLoading] = useState(false);
  const [currentProperty, setCurrentProperty] = useState<string>(
    taskData?.property || "",
  );
  const [currentPropertyId, setCurrentPropertyId] = useState<number | undefined>(
    taskData?.property_id,
  );
  const [propertyImageUrl, setPropertyImageUrl] = useState<string | null>(null);
  const [currentUnit, setCurrentUnit] = useState<string>(
    formatUnitLabel({
      unitId: taskData?.unit_id ?? taskData?.unit,
      unitName: taskData?.unit_name ?? taskData?.unit,
      fallback: "",
    }),
  );
  const [currentUnitId, setCurrentUnitId] = useState<number | undefined>(
    taskData?.unit_id,
  );
  const [currentTitle, setCurrentTitle] = useState<string>(
    taskData?.title || "",
  );
  const [currentDescription, setCurrentDescription] = useState<string>(
    taskData?.description || "",
  );
  const [currentCategory, setCurrentCategory] = useState<string>(
    taskData?.category || "",
  );
  const [currentStatus, setCurrentStatus] = useState<string>(() => {
    // UI expects: not_started | in_progress | completed
    // Backend may send: open | in_progress | pending_vendor | scheduled | closed | cancelled
    const status = taskData?.status || "not_started";
    if (status === "Completed") return "completed";
    if (status === "In Progress") return "in_progress";
    if (status === "Not Started") return "not_started";
    return normalizeStatusForBadge(
      typeof status === "string" ? status : undefined,
    );
  });
  const [currentPriority, setCurrentPriority] = useState<string>(() => {
    // UI expects: low | normal | high | urgent (backend may send "medium")
    const priority = taskData?.priority || "normal";
    if (priority === "Normal") return "normal";
    if (priority === "High") return "high";
    if (priority === "Low") return "low";
    if (priority === "Urgent") return "urgent";
    return normalizePriorityForBadge(
      typeof priority === "string" ? priority : undefined,
    );
  });
  const [currentDueDate, setCurrentDueDate] = useState<Date | null>(() => {
    const rawDueDate = taskData?.dueDate || taskData?.due;
    if (rawDueDate) {
      const date = new Date(rawDueDate);
      return isNaN(date.getTime()) ? null : date;
    }
    return null;
  });
  const [currentAssignees, setCurrentAssignees] = useState<any[]>(() => {
    if (taskData?.assignees && taskData.assignees.length > 0) {
      return taskData.assignees;
    }
    return [];
  });
  const [currentCollaborators, setCurrentCollaborators] = useState<any[]>(
    () => {
      if (taskData?.collaborators && taskData.collaborators.length > 0) {
        return taskData.collaborators;
      }
      return [];
    },
  );

  // Keep top-bar fields in sync if taskData changes (e.g. refreshed navigation state)
  useEffect(() => {
    if (typeof taskData?.status === "string") {
      setCurrentStatus(normalizeStatusForBadge(taskData.status));
    }
    if (typeof taskData?.priority === "string") {
      setCurrentPriority(normalizePriorityForBadge(taskData.priority));
    }
    // Sync title and other fields when taskData changes (to preserve live task info)
    if (taskData?.title && taskData.title !== currentTitle) {
      setCurrentTitle(taskData.title);
    }
    if (taskData?.description !== undefined && taskData.description !== currentDescription) {
      setCurrentDescription(taskData.description);
    }
    if (taskData?.category !== undefined && taskData.category !== currentCategory) {
      setCurrentCategory(taskData.category);
    }
    if (taskData?.property !== undefined && taskData.property !== currentProperty) {
      setCurrentProperty(taskData.property);
    }
    if (taskData?.property_id !== undefined && taskData.property_id !== currentPropertyId) {
      setCurrentPropertyId(taskData.property_id);
    }
    if (taskData?.unit !== undefined || taskData?.unit_id !== undefined) {
      const nextUnitLabel = formatUnitLabel({
        unitId: taskData?.unit_id ?? taskData?.unit,
        unitName: taskData?.unit_name ?? taskData?.unit,
        fallback: "",
      });
      if (nextUnitLabel !== currentUnit) {
        setCurrentUnit(nextUnitLabel);
      }
    }
    if (taskData?.unit_id !== undefined && taskData.unit_id !== currentUnitId) {
      setCurrentUnitId(taskData.unit_id);
    }
    // Sync due date when taskData changes
    if (taskData?.dueDate || taskData?.due_date) {
      const rawDueDate = taskData.dueDate || taskData.due_date;
      if (rawDueDate) {
        const date = new Date(rawDueDate);
        if (!isNaN(date.getTime())) {
          setCurrentDueDate(date);
        }
      }
    } else if (taskData && !taskData.dueDate && !taskData.due_date) {
      // Clear due date if it's not in the refreshed data
      setCurrentDueDate(null);
    }
    // Update top-bar snapshot to match taskData so the auto-save effect doesn't
    // treat this programmatic sync as a user change and fire a spurious PATCH.
    // Also mark that we just hydrated so the save effect skips one run (state may still be stale).
    if (taskData) {
      const status =
        typeof taskData.status === "string"
          ? normalizeStatusForBadge(taskData.status)
          : topBarSnapshotRef.current?.status ?? "not_started";
      const priority =
        typeof taskData.priority === "string"
          ? normalizePriorityForBadge(taskData.priority)
          : topBarSnapshotRef.current?.priority ?? "normal";
      let dueDateISO: string | null = null;
      if (taskData.dueDate || taskData.due_date) {
        const rawDueDate = taskData.dueDate || taskData.due_date;
        const date = new Date(rawDueDate);
        if (!isNaN(date.getTime())) dueDateISO = date.toISOString();
      }
      const synced = { status, priority, dueDateISO };
      topBarSnapshotRef.current = synced;
      topBarSyncedFromTaskDataRef.current = { taskId: taskData.id ?? taskId, ...synced };
      topBarJustHydratedRef.current = true;
    }
  }, [taskData?.status, taskData?.priority, taskData, taskId, currentTitle, currentDescription, currentCategory, currentProperty, currentPropertyId, currentUnit, currentUnitId, normalizeStatusForBadge, normalizePriorityForBadge]);

  // Fetch property image when task has a property
  const effectivePropertyId = currentPropertyId ?? taskData?.property_id;
  useEffect(() => {
    if (!effectivePropertyId) {
      setPropertyImageUrl(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const prop = await fetchJSON(`/properties/${effectivePropertyId}`);
        const path = prop?.image_url;
        if (cancelled) return;
        if (path && typeof path === "string" && path.trim() !== "") {
          setPropertyImageUrl(`${API_BASE.replace(/\/$/, "")}/files/${path.replace(/^\//, "")}`);
        } else {
          setPropertyImageUrl(null);
        }
      } catch {
        if (!cancelled) setPropertyImageUrl(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [effectivePropertyId]);

  const loadUpdatesFromDb = useCallback(async () => {
    if (!taskId) return;

    try {
      setUpdatesLoading(true);

      const [rows, attachments]: [ApiTaskUpdateFeedRow[], ApiTaskAttachment[]] =
        await Promise.all([
          fetchJSON(`/maintenance/tasks/id/${taskId}/updates-feed`),
          fetchJSON(`/maintenance/tasks/id/${taskId}/attachments`),
        ]);

      const attachmentById = new Map<number, ApiTaskAttachment>();
      attachments.forEach((a) => attachmentById.set(Number(a.id), a));

      const mapped = (rows || []).map((row) => {
        const pm =
          row.actor_id != null
            ? propertyManagerDetailsById.get(Number(row.actor_id))
            : undefined;

        const authorName =
          pm?.name ||
          (row.actor_type === "system" || row.actor_id == null ? "System" : "User");
        const authorEmail = pm?.email || "";
        const authorPhone = pm?.phone || "";
        const authorTitle = pm?.role || (authorName === "System" ? "System" : "");
        const initials = initialsFromName(authorName);

        const oldV = (row.old_value ?? {}) as any;
        const newV = (row.new_value ?? {}) as any;

        let action = row.message || "made an update";
        let actionValue: any = undefined;

        if (row.update_type === "task_created") {
          action = "created this task";
        } else if (row.update_type === "status_change") {
          const oldStatus = oldV.status ? String(oldV.status) : "";
          const newStatus = newV.status ? String(newV.status) : "";
          action = oldStatus ? `updated status from ${oldStatus} to` : "updated status to";
          actionValue = newStatus || undefined;
        } else if (row.update_type === "priority_change") {
          const oldPr = oldV.priority ? String(oldV.priority) : "";
          const newPr = newV.priority ? String(newV.priority) : "";
          action = oldPr
            ? `updated priority from ${oldPr} to`
            : "updated priority to";
          actionValue = newPr || undefined;
        } else if (row.update_type === "assignee_change") {
          action = "updated assignees";
        } else if (row.update_type === "subtask_created" || row.update_type === "subtask_completed") {
          action = row.message || action;
        }

        const attachmentIds = Array.isArray(row.attachment_ids)
          ? row.attachment_ids
          : [];

        const timelineAttachments = attachmentIds
          .map((id) => attachmentById.get(Number(id)))
          .filter(Boolean)
          .map((a) => {
            const url = a!.storage_path;
            const isImage =
              typeof a!.file_type === "string"
                ? a!.file_type.startsWith("image/")
                : /\.(jpg|jpeg|png|gif|webp)$/i.test(a!.file_name);

            return {
              id: String(a!.id),
              name: a!.file_name,
              url,
              preview: isImage ? url : undefined,
            };
          });

        return {
          id: row.id,
          author: authorName,
          authorType: "assignee",
          authorEmail,
          authorPhone,
          authorTitle,
          initials,
          action,
          actionValue,
          timestamp: formatTimestamp(row.timestamp),
          fieldsDisplay: buildUpdateFieldsDisplay(row),
          icon:
            row.update_type === "task_created" ? (
              <FlagIcon width={16} height={16} />
            ) : row.update_type === "subtask_completed" ? (
              <ApproveIcon width={16} height={16} />
            ) : (
              <EditIcon width={16} height={16} />
            ),
          isInitialCreation: row.update_type === "task_created",
          ...(timelineAttachments.length > 0 && {
            attachments: timelineAttachments,
            onAttachmentClick: (file: any) => {
              if (file?.url) openAuthPdf(file.url).catch(() => {});
            },
          }),
        };
      });

      setUpdates(mapped);
    } catch (err) {
      console.error("Failed to load updates feed:", err);
      setUpdates([]);
    } finally {
      setUpdatesLoading(false);
    }
  }, [
    taskId,
    buildUpdateFieldsDisplay,
    formatTimestamp,
    initialsFromName,
    propertyManagerDetailsById,
  ]);

  // Load updates feed on mount and when taskId changes
  useEffect(() => {
    loadUpdatesFromDb();
  }, [loadUpdatesFromDb]);

  // Sync assignees and collaborators when taskData changes
  useEffect(() => {
    if (taskData?.assignees && taskData.assignees.length > 0) {
      setCurrentAssignees(taskData.assignees);
    }
    if (taskData?.collaborators !== undefined) {
      setCurrentCollaborators(taskData.collaborators);
    }
  }, [taskData?.assignees, taskData?.collaborators]);

  // Mock data types
  interface Assignee {
    id: number;
    name: string;
    initials: string;
  }

  interface WorkOrder {
    id: number;
    task: string;
    taskId: number;
    property: string;
    unit: string;
    dueDate: string | Date | null;
    updatedDate: string;
    age: string;
    priority: string;
    status: string;
    billStatus: "Paid" | "Unpaid" | "Awaiting Invoice";
    billTotal: string;
    bill_total_cents?: number;
    assignees: Assignee[];
    collaborators: Assignee[];
    vendorName?: string;
    vendorId?: number;
    vendorEmail?: string;
    vendorPhone?: string;
  }

  // Helper function to calculate age from dates
  const calculateAge = (date: Date | string | null): string => {
    if (!date) return "Unknown";
    try {
      const now = new Date();
      const then = typeof date === "string" ? new Date(date) : date;
      
      if (isNaN(then.getTime())) {
        return "Unknown";
      }
      
      const diffMs = now.getTime() - then.getTime();
      if (diffMs < 0) return "Just now";
      
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      
      if (diffDays > 0) {
        return `${diffDays} day${diffDays !== 1 ? "s" : ""}`;
      }
      if (diffHours > 0) {
        return `${diffHours} hour${diffHours !== 1 ? "s" : ""}`;
      }
      return "Just now";
    } catch (error) {
      console.warn('Error calculating age:', error);
      return "Unknown";
    }
  };

  // Helper function to format date
  const formatDate = (date: Date | string | null): string => {
    if (!date) return "No date";
    try {
      const d = typeof date === "string" ? new Date(date) : date;
      if (isNaN(d.getTime())) {
        return "No date";
      }
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch (error) {
      console.warn('Error formatting date:', error);
      return "No date";
    }
  };

  const formatBillTotal = (billTotalCents?: number | null): string => {
    if (typeof billTotalCents !== "number" || billTotalCents <= 0) {
      return "No invoice";
    }
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(billTotalCents / 100);
  };

  // Map API work order response to WorkOrder interface
  const mapApiWorkOrderToWorkOrder = (apiWo: any, taskUnit?: string): WorkOrder => {
    if (!apiWo || typeof apiWo !== 'object') {
      throw new Error('Invalid work order data');
    }

    // Safely parse and format dates
    const dueDateStr = formatDate(apiWo.due_date);
    const updatedDateStr = formatDate(apiWo.updated_at);
    
    // Safely get age
    const ageDate = apiWo.created_at || apiWo.updated_at;
    const age = ageDate ? calculateAge(ageDate) : "Unknown";
    
    const mapped = {
      id: Number(apiWo.id) || 0,
      task: String(apiWo.name || "Untitled Work Order"),
      taskId: Number(apiWo.task_id) || 0,
      property: String(apiWo.property_name || "Unknown Property"),
      unit: String(taskUnit || UNIT_EMPTY_DISPLAY),
      dueDate: dueDateStr,
      updatedDate: updatedDateStr,
      age: age,
      priority: String(apiWo.priority || "normal"),
      status: String(apiWo.status || "not_started"),
      billStatus: "Awaiting Invoice" as const,
      billTotal: formatBillTotal(apiWo.bill_total_cents),
      bill_total_cents:
        typeof apiWo.bill_total_cents === "number"
          ? apiWo.bill_total_cents
          : undefined,
      assignees: [], // TODO: Fetch assignees if available in API
      collaborators: [], // TODO: Fetch collaborators if available in API
      vendorName: apiWo.vendor_name ? String(apiWo.vendor_name) : undefined,
      vendorId: apiWo.vendor_id ? Number(apiWo.vendor_id) : undefined,
      vendorEmail: apiWo.vendor_email ? String(apiWo.vendor_email) : undefined,
      vendorPhone: apiWo.vendor_phone ? String(apiWo.vendor_phone) : undefined,
    };
    return mapped;
  };

  // Fetch work orders by task ID
  const {
    data: apiWorkOrders,
    isLoading: isLoadingWorkOrders,
    error: workOrdersError,
    refetch: refetchWorkOrders,
  } = useQuery({
    queryKey: ["workOrders", taskId],
    queryFn: async () => {
      if (!taskId) return [];
      try {
        const response = await fetchJSON(`/maintenance/work-orders?task_id=${taskId}`);
        return Array.isArray(response) ? response : [];
      } catch (error) {
        console.error('Error fetching work orders:', error);
        return [];
      }
    },
    enabled: !!taskId && !isNaN(Number(taskId)),
    retry: 1,
  });

  // Fetch field team orders by task ID
  const { 
    data: apiFieldTeamOrders, 
    isLoading: isLoadingFieldTeamOrders,
    refetch: refetchFieldTeamOrders,
  } =
    useQuery<APIFTOResponse[]>({
      queryKey: ["fieldTeamOrders", taskId],
      queryFn: async () => {
        if (!taskId) return [];
        try {
          const response = await fetchJSON(
            `/maintenance/ftos?task_id=${taskId}`,
          );
          return Array.isArray(response)
            ? response
            : response?.data ?? response?.items ?? response?.results ?? [];
        } catch (error) {
          console.error("Error fetching field team orders:", error);
          return [];
        }
      },
      enabled: !!taskId && !isNaN(Number(taskId)),
      retry: 1,
    });

  // Map API work orders to WorkOrder interface
  const mappedWorkOrders = useMemo(() => {
    if (!apiWorkOrders || apiWorkOrders.length === 0) {
      return [];
    }
    const unit = formatUnitLabel({
      unitId: taskData?.unit_id ?? taskData?.unit,
      unitName: taskData?.unit_name ?? taskData?.unit,
      fallback: "",
    });
    try {
      return apiWorkOrders
        .map((apiWo) => {
          try {
            return mapApiWorkOrderToWorkOrder(apiWo, unit);
          } catch (error) {
            console.error('Error mapping work order:', error, apiWo);
            return null;
          }
        })
        .filter((wo): wo is WorkOrder => wo !== null);
    } catch (error) {
      console.error('Error mapping work orders:', error);
      return [];
    }
  }, [apiWorkOrders, taskData?.unit_id, taskData?.unit_name, taskData?.unit]);

  // Work orders and field team orders state
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(mappedWorkOrders);
  const [isUpdateWorkOrderModalOpen, setIsUpdateWorkOrderModalOpen] =
    useState(false);

  // Update work orders when API data changes
  useEffect(() => {
    setWorkOrders(mappedWorkOrders);
  }, [mappedWorkOrders]);

  const [fieldTeamOrders, setFieldTeamOrders] = useState<FieldTeamOrder[]>([]);
  const [isLoadingFieldTeamMembers, setIsLoadingFieldTeamMembers] =
    useState(false);

  const fetchUsersByIds = async (
    ids: number[],
  ): Promise<Record<number, UserDirectoryEntry>> => {
    const uniqueIds = Array.from(new Set(ids));
    if (uniqueIds.length === 0) {
      return {};
    }

    const users = await Promise.all(
      uniqueIds.map(async (id) => {
        const user = await fetchJSON(`/users/${id}`);
        return user;
      }),
    );

    return users.reduce((acc, user) => {
      acc[user.id] = user;
      return acc;
    }, {} as Record<number, UserDirectoryEntry>);
  };

  useEffect(() => {
    if (!apiFieldTeamOrders) {
      setFieldTeamOrders([]);
      return;
    }

    if (apiFieldTeamOrders.length === 0) {
      setFieldTeamOrders([]);
      return;
    }

    let isActive = true;

    const hydrateFieldTeamOrders = async () => {
      setIsLoadingFieldTeamMembers(true);
      try {
        const allFieldTeamIds = apiFieldTeamOrders.flatMap(
          (fto) => fto.field_team_member_ids ?? [],
        );
        const usersById = await fetchUsersByIds(allFieldTeamIds);
        const mappedOrders = transformAPIToFieldTeamOrders(
          apiFieldTeamOrders,
          usersById,
        );

        if (isActive) {
          setFieldTeamOrders(mappedOrders);
        }
      } catch (error) {
        console.error("Error mapping field team orders:", error);
        if (isActive) {
          setFieldTeamOrders([]);
        }
      } finally {
        if (isActive) {
          setIsLoadingFieldTeamMembers(false);
        }
      }
    };

    hydrateFieldTeamOrders();

    return () => {
      isActive = false;
    };
  }, [apiFieldTeamOrders]);

  useEffect(() => {
    return () => {
      createdAttachmentUrlsRef.current.forEach((url) => {
        if (url.startsWith("blob:")) {
          try {
            URL.revokeObjectURL(url);
          } catch {
            // ignore
          }
        }
      });
      createdAttachmentUrlsRef.current.clear();
    };
  }, []);

  // Get editing note/file from reducer state
  const editingNote = uiState.editingNoteId
    ? notes.find((n) => n.id === uiState.editingNoteId)
    : null;
  const editingFile = uiState.editingFileId
    ? files.find((f) => f.id === uiState.editingFileId)
    : null;

  // Fetch linked tasks from API
  useEffect(() => {
    if (!taskId) return;

    let isCancelled = false;

    const fetchLinkedTasks = async () => {
      try {
        const linkedTasks = await fetchJSON(`/maintenance/tasks/id/${taskId}/links`);
        
        // Don't update state if component unmounted or taskId changed
        if (isCancelled) return;
        
        // Map API response to LinkedTaskData format
        const mappedLinkedTasks: LinkedTaskData[] = (linkedTasks ?? []).map((task: any) => {
          // Map backend status to frontend status
          const statusMap: Record<string, "not_started" | "in_progress" | "completed"> = {
            open: "not_started",
            not_started: "not_started",
            in_progress: "in_progress",
            pending_vendor: "in_progress",
            scheduled: "in_progress",
            completed: "completed",
            closed: "completed",
            cancelled: "completed",
          };
          
          const frontendStatus = statusMap[task.status?.toLowerCase()] || "not_started";
          
          // Format date
          const updatedDate = task.created_at
            ? new Date(task.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : "Unknown";
          
          return {
            id: task.id,
            name: task.name,
            status: frontendStatus,
            updatedDate,
            updatedBy: "System", // LinkedTaskPreview doesn't include updated_by
          };
        });
        
        uiDispatch({ type: "SET_LINKED_TASKS", payload: mappedLinkedTasks });
      } catch (error) {
        // Don't update state if component unmounted or taskId changed
        if (isCancelled) return;
        
        console.error("Error fetching linked tasks:", error);
        // Set empty array on error
        uiDispatch({ type: "SET_LINKED_TASKS", payload: [] });
      }
    };

    fetchLinkedTasks();

    // Cleanup function to prevent state updates after unmount or taskId change
    return () => {
      isCancelled = true;
    };
  }, [taskId]); // Removed uiDispatch from dependencies - it's stable from useReducer

  // Fetch available tasks for linking (all tasks except current)
  const [availableTasksForLinking, setAvailableTasksForLinking] = useState<LinkedTaskData[]>([]);
  
  useEffect(() => {
    if (!taskId) return;

    let isCancelled = false;

    const fetchAvailableTasks = async () => {
      try {
        const allTasks = await fetchJSON("/maintenance/tasks");
        
        // Don't update state if component unmounted or taskId changed
        if (isCancelled) return;
        
        // Filter out current task and map to LinkedTaskData format
        const mappedTasks: LinkedTaskData[] = allTasks
          .filter((task: any) => String(task.id) !== String(taskId))
          .map((task: any) => {
            // Map backend status to frontend status
            const statusMap: Record<string, "not_started" | "in_progress" | "completed"> = {
              open: "not_started",
              not_started: "not_started",
              in_progress: "in_progress",
              pending_vendor: "in_progress",
              scheduled: "in_progress",
              completed: "completed",
              closed: "completed",
              cancelled: "completed",
            };
            
            const frontendStatus = statusMap[task.status?.toLowerCase()] || "not_started";
            
            // Format date
            const updatedDate = task.last_updated
              ? new Date(task.last_updated).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "Unknown";
            
            return {
              id: task.id,
              name: task.name,
              status: frontendStatus,
              updatedDate,
              updatedBy: task.assignees?.[0]?.name || "Unknown",
            };
          });
        
        setAvailableTasksForLinking(mappedTasks);
      } catch (error) {
        // Don't update state if component unmounted or taskId changed
        if (isCancelled) return;
        
        console.error("Error fetching available tasks:", error);
        setAvailableTasksForLinking([]);
      }
    };

    fetchAvailableTasks();

    // Cleanup function to prevent state updates after unmount or taskId change
    return () => {
      isCancelled = true;
    };
  }, [taskId]);

  // Subtasks for this task (used in Summary count and Subtasks tab)
  const [subtasks, setSubtasks] = useState<SubtaskItem[]>([]);
  const [availableSubtaskAssignees, setAvailableSubtaskAssignees] = useState<MultiSelectOption[]>([]);

  const mapApiSubtaskToItem = useCallback((raw: any): SubtaskItem => {
    const assignees = (raw.assignees || []).map((a: any) => ({
      id: a.id,
      name: a.name || a.email || "",
      initials: (a.name || a.email || "?")
        .split(" ")
        .slice(0, 2)
        .map((w: string) => w[0])
        .join("")
        .toUpperCase() || "?",
    }));
    return {
      id: raw.id,
      name: raw.name ?? "",
      description: raw.description ?? "",
      status: (raw.status === "pending" || raw.status === "in_progress" || raw.status === "done" ? raw.status : "pending") as SubtaskItem["status"],
      assignees,
    };
  }, []);

  const refetchSubtasks = useCallback(async () => {
    if (!taskId) return;
    try {
      const list = await fetchJSON(`/maintenance/tasks/id/${taskId}/subtasks`);
      setSubtasks((Array.isArray(list) ? list : []).map(mapApiSubtaskToItem));
    } catch (err) {
      console.error("Error fetching subtasks:", err);
      setSubtasks([]);
    }
  }, [taskId, mapApiSubtaskToItem]);

  useEffect(() => {
    if (!taskId) return;
    let isCancelled = false;
    const fetchSubtasks = async () => {
      try {
        const list = await fetchJSON(`/maintenance/tasks/id/${taskId}/subtasks`);
        if (!isCancelled) {
          setSubtasks((Array.isArray(list) ? list : []).map(mapApiSubtaskToItem));
        }
      } catch (err) {
        if (!isCancelled) {
          console.error("Error fetching subtasks:", err);
          setSubtasks([]);
        }
      }
    };
    fetchSubtasks();
    return () => { isCancelled = true; };
  }, [taskId, mapApiSubtaskToItem]);

  // Load assignees for subtask modal: property managers + field team (live from API)
  const loadSubtaskAssignees = useCallback(async () => {
    try {
      const [fieldTeam, propertyManagers] = await Promise.all([
        fetchJSON("/users/field-team").catch(() => []),
        fetchJSON("/users/property-managers").catch(() => []),
      ]);
      const seen = new Set<number>();
      const merged: MultiSelectOption[] = [];
      for (const u of [...(fieldTeam || []), ...(propertyManagers || [])]) {
        const id = Number(u.id);
        if (seen.has(id)) continue;
        seen.add(id);
        merged.push({
          id: String(id),
          label: u.name || u.email || "",
          initials: (u.name || u.email || "?")
            .split(" ")
            .slice(0, 2)
            .map((w: string) => w[0])
            .join("")
            .toUpperCase() || "?",
        });
      }
      setAvailableSubtaskAssignees(merged);
    } catch (err) {
      setAvailableSubtaskAssignees([]);
    }
  }, []);

  useEffect(() => {
    loadSubtaskAssignees();
  }, [loadSubtaskAssignees]);

  // Refetch assignees when user opens Subtasks tab so dropdown has latest data
  useEffect(() => {
    if (uiState.activeTab === "subtasks") {
      loadSubtaskAssignees();
    }
  }, [uiState.activeTab, loadSubtaskAssignees]);

  // Helper function to sync file names across files and updates states
  const syncFileNameAcrossStates = (
    fileId: string | number,
    newName: string,
  ) => {
    const stringId = String(fileId);

    // Update the main files state
    setFiles((prevFiles) =>
      prevFiles.map((f) =>
        String(f.id) === stringId ? { ...f, name: newName } : f,
      ),
    );

    // Update the attachment in all timeline updates
    setUpdates((prevUpdates) =>
      prevUpdates.map((update) => {
        if (update.attachments && Array.isArray(update.attachments)) {
          const updatedAttachments = update.attachments.map((att: any) =>
            String(att.id) === stringId ? { ...att, name: newName } : att,
          );
          return { ...update, attachments: updatedAttachments };
        }
        return update;
      }),
    );
  };

  const handleTabChange = (newTab: "summary" | "workorders" | "fieldteam" | "subtasks") => {
    // Navigate to the new tab and preserve the full navigation state (including live task data)
    // The URL will only include workOrderId when on the workorders tab
    // Always include taskData in the preserved state to maintain context
    const preservedState = {
      ...navigationState, // Preserve all existing navigation state (taskData, task, etc.)
      taskData: taskData || navigationState?.taskData || navigationState?.task || fetchedTaskData, // Ensure task data is always included
      task: taskData || navigationState?.task || navigationState?.taskData || fetchedTaskData, // Also set as 'task' for compatibility
      preservedWorkOrderId: uiState.selectedWorkOrderId,
    };
    
    if (newTab === "workorders" && uiState.selectedWorkOrderId) {
      navigate(`/tasks/${taskId}/workorders/${uiState.selectedWorkOrderId}`, {
        replace: false,
        state: preservedState,
      });
    } else {
      navigate(`/tasks/${taskId}/${newTab}`, {
        replace: false,
        state: preservedState,
      });
    }
  };

  const handleWorkOrderSelect = (woId: number | null) => {
    // Update state when work order is selected
    // This is called by the table row click handler
    uiDispatch({ type: "SET_SELECTED_WORK_ORDER_ID", payload: woId });
  };

  const handleStatusChange = (newStatus: string) => {
    setCurrentStatus(newStatus);
    setLastUpdatedTimestamp(new Date().toLocaleString());
  };

  const handlePriorityChange = (newPriority: string) => {
    setCurrentPriority(newPriority);
    setLastUpdatedTimestamp(new Date().toLocaleString());
  };

  const handleDueDateChange = (newDate: Date | string | null) => {
    if (newDate instanceof Date) {
      setCurrentDueDate(newDate);
    } else if (newDate && typeof newDate === "string") {
      // Parse string date back to Date object
      const parsed = new Date(newDate);
      setCurrentDueDate(!isNaN(parsed.getTime()) ? parsed : null);
    } else {
      setCurrentDueDate(null);
    }
    setLastUpdatedTimestamp(new Date().toLocaleString());
  };

  // --- Auto-save top-bar fields (status/priority/due date) ---
  const topBarSnapshotRef = useRef<{
    status: string;
    priority: string;
    dueDateISO: string | null;
  } | null>(null);
  const topBarSavingRef = useRef(false);
  const topBarSyncedFromTaskDataRef = useRef<{
    taskId: string | number | undefined;
    status: string;
    priority: string;
    dueDateISO: string | null;
  } | null>(null);
  const topBarJustHydratedRef = useRef(false);

  const toBackendStatus = useCallback((uiStatus: string): string => {
    const map: Record<string, string> = {
      not_started: "open",
      in_progress: "in_progress",
      completed: "closed",
      open: "open",
      closed: "closed",
    };
    return map[uiStatus] || "open";
  }, []);

  const toBackendPriority = useCallback((uiPriority: string): string => {
    const map: Record<string, string> = {
      low: "low",
      normal: "medium",
      high: "high",
      urgent: "urgent",
      medium: "medium",
    };
    return map[uiPriority] || "medium";
  }, []);

  const syncTopBarSnapshot = useCallback(() => {
    topBarSnapshotRef.current = {
      status: currentStatus,
      priority: currentPriority,
      dueDateISO: currentDueDate ? currentDueDate.toISOString() : null,
    };
  }, [currentDueDate, currentPriority, currentStatus]);

  // Initialize snapshot on first render once we have the fields
  useEffect(() => {
    if (!topBarSnapshotRef.current) {
      syncTopBarSnapshot();
    }
  }, [syncTopBarSnapshot]);

  useEffect(() => {
    if (!taskId) return;
    if (!userId) return;

    const snap = topBarSnapshotRef.current;
    if (!snap) return;

    // Skip PATCH when we just hydrated from taskData (state may still be stale in same commit)
    if (topBarJustHydratedRef.current && topBarSyncedFromTaskDataRef.current) {
      const synced = topBarSyncedFromTaskDataRef.current;
      if (String(synced.taskId) === String(taskId)) {
        topBarSnapshotRef.current = {
          status: synced.status,
          priority: synced.priority,
          dueDateISO: synced.dueDateISO,
        };
        topBarJustHydratedRef.current = false;
        return;
      }
    }

    const next = {
      status: currentStatus,
      priority: currentPriority,
      dueDateISO: currentDueDate ? currentDueDate.toISOString() : null,
    };

    const changed =
      snap.status !== next.status ||
      snap.priority !== next.priority ||
      snap.dueDateISO !== next.dueDateISO;

    if (!changed) return;
    if (topBarSavingRef.current) return;

    const run = async () => {
      try {
        topBarSavingRef.current = true;

        const payload: any = {
          actor_id: userId,
          message: "",
        };

        if (snap.status !== next.status) {
          payload.status = toBackendStatus(next.status);
        }
        if (snap.priority !== next.priority) {
          payload.priority = toBackendPriority(next.priority);
        }
        if (snap.dueDateISO !== next.dueDateISO) {
          // Note: backend uses *time.Time with omitempty; cannot "clear" due_date via nil.
          if (next.dueDateISO) payload.due_date = next.dueDateISO;
        }

        // If for some reason nothing to send, just update snapshot and bail
        const keys = Object.keys(payload).filter(
          (k) => !["actor_id", "message"].includes(k),
        );
        if (keys.length === 0) {
          syncTopBarSnapshot();
          return;
        }

        await fetchJSON(`/maintenance/tasks/${taskId}/update`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        // Refresh the all tasks page in the background
        window.dispatchEvent(new CustomEvent("refreshAllTasks"));

        // Refresh the current task summary page data to show updated values
        await refetchTaskData();

        // update snapshot to current values after successful save
        syncTopBarSnapshot();

        // refresh updates timeline so the new row appears
        await loadUpdatesFromDb();
      } catch (err) {
        console.error("Failed to auto-save top bar fields:", err);
        // keep snapshot as-is so we can retry on next change
      } finally {
        topBarSavingRef.current = false;
      }
    };

    run();
  }, [
    currentDueDate,
    currentPriority,
    currentStatus,
    loadUpdatesFromDb,
    refetchTaskData,
    syncTopBarSnapshot,
    taskId,
    toBackendPriority,
    toBackendStatus,
    userId,
  ]);

  const handleStartRenamingAttachment = () => {
    if (uiState.viewingAttachment) {
      uiDispatch({
        type: "START_RENAMING_ATTACHMENT",
        payload: uiState.viewingAttachment.name,
      });
    }
  };

  const handleSaveAttachmentFileName = () => {
    const trimmedName = uiState.renamingAttachmentName.trim();
    if (
      uiState.viewingAttachment &&
      uiState.viewingAttachment.id &&
      trimmedName
    ) {
      syncFileNameAcrossStates(uiState.viewingAttachment.id, trimmedName);

      uiDispatch({
        type: "SET_VIEWING_ATTACHMENT",
        payload: {
          ...uiState.viewingAttachment,
          name: trimmedName,
        },
      });
      uiDispatch({ type: "CANCEL_RENAMING_ATTACHMENT" });
    }
  };

  const handleCancelRenamingAttachment = () => {
    uiDispatch({ type: "CANCEL_RENAMING_ATTACHMENT" });
  };

  // Map property values to addresses
  const getPropertyAddress = (propertyValue: string): string => {
    const propertyMap: Record<string, { name: string; address: string }> = {
      property1: {
        name: "(C) 22 Indian Chase Dr, Greenwich, CT 06831 -1",
        address: "22 Indian Chase Dr Greenwich, CT 06831",
      },
      property2: {
        name: "(C) Property 2 Address -1",
        address: "Property 2 Address Details",
      },
    };
    return propertyMap[propertyValue]?.address || "";
  };

  // Map property values to rental owner information
  const getRentalOwnerByProperty = (
    propertyValue: string | undefined,
  ): {
    id: number;
    name: string;
    initials: string;
    roleLabel: string;
    phone: string;
  } | null => {
    if (!propertyValue || propertyValue.includes("Unassigned")) {
      return null;
    }

    const rentalOwnerMap: Record<
      string,
      {
        id: number;
        name: string;
        initials: string;
        roleLabel: string;
        phone: string;
      }
    > = {
      property1: {
        id: 5,
        name: "Peter & Ali Jennison",
        initials: "PJ",
        roleLabel: "Rental Owner",
        phone: "(203) 927-1280",
      },
      property2: {
        id: 6,
        name: "Sarah Mitchell",
        initials: "SM",
        roleLabel: "Rental Owner",
        phone: "(203) 555-1234",
      },
    };
    return rentalOwnerMap[propertyValue] || null;
  };

  const getPropertyName = (propertyValue: string): string => {
    const propertyMap: Record<string, { name: string; address: string }> = {
      property1: {
        name: "(C) 22 Indian Chase Dr, Greenwich, CT 06831 -1",
        address: "22 Indian Chase Dr Greenwich, CT 06831",
      },
      property2: {
        name: "(C) Property 2 Address -1",
        address: "Property 2 Address Details",
      },
    };
    return propertyMap[propertyValue]?.name || "";
  };

  const getPropertyDisplayLabel = (propertyValue: string): string => {
    const propertyLabels: Record<string, string> = {
      property1: "22 Indian Chase Dr",
      property2: "Property 2",
    };
    return propertyLabels[propertyValue] || "";
  };

  const getUnitDisplayLabel = (unitValue: string): string => {
    return formatUnitLabel({
      unitId: unitValue,
      unitName: unitValue,
      fallback: "",
    });
  };

  // Extract unique vendors from work orders
  const vendorsFromWorkOrders = useMemo(() => {
    const uniqueVendors = new Map<
      number | string,
      {
        id: number | string;
        name: string;
        initials: string;
        email: string;
        phone: string;
        title: string;
      }
    >();
    workOrders.forEach((wo) => {
      // Use vendor_id if available, otherwise fall back to vendorName for uniqueness
      const vendorKey = wo.vendorId || wo.vendorName;
      if (vendorKey && wo.vendorName && wo.vendorName.trim()) {
        if (!uniqueVendors.has(vendorKey)) {
          const initials = wo.vendorName
            .split(" ")
            .slice(0, 2)
            .map((word) => word[0])
            .join("")
            .toUpperCase();
          uniqueVendors.set(vendorKey, {
            id: wo.vendorId || `vendor-${uniqueVendors.size + 1}`,
            name: wo.vendorName,
            initials: initials || "V",
            email: wo.vendorEmail || "",
            phone: wo.vendorPhone || "",
            title: "Vendor Company",
          });
        }
      }
    });
    return Array.from(uniqueVendors.values());
  }, [workOrders]);

  // Extract unique field team members from field team orders
  const fieldTeamFromOrders = useMemo(() => {
    const uniqueFieldTeam = new Map<
      string,
      {
        id: string;
        name: string;
        initials: string;
        email: string;
        phone: string;
        title: string;
      }
    >();
    fieldTeamOrders.forEach((order) => {
      if (order.fieldTeam && Array.isArray(order.fieldTeam)) {
        order.fieldTeam.forEach(
          (member: { name: string; initials: string }) => {
            if (member.name && member.name.trim()) {
              if (!uniqueFieldTeam.has(member.name)) {
                const memberInfo = fieldTeamMasterData[member.name];
                uniqueFieldTeam.set(member.name, {
                  id: `fieldteam-${uniqueFieldTeam.size + 1}`,
                  name: member.name,
                  initials:
                    member.initials ||
                    member.name
                      .split(" ")
                      .map((w) => w[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2),
                  email: memberInfo?.email || "",
                  phone: memberInfo?.phone || "",
                  title: memberInfo?.title || "Field Team Member",
                });
              }
            }
          },
        );
      }
    });
    return Array.from(uniqueFieldTeam.values());
  }, [fieldTeamOrders]);

  // Memoize editData to prevent unnecessary re-initialization of the modal
  // Format matches AllTasks editData structure for CreateTaskModal autofill
  const modalEditData = useMemo(() => {
    if (!taskId) return undefined;
    
    // Map frontend status values to backend values
    const statusMap: Record<string, string> = {
      not_started: "open",
      in_progress: "in_progress",
      completed: "completed",
      open: "open",
      closed: "closed",
    };
    const backendStatus = statusMap[currentStatus] || currentStatus || "open";
    
    // Map frontend priority values to backend values
    const priorityMap: Record<string, string> = {
      low: "low",
      normal: "medium",
      high: "high",
      urgent: "urgent",
      medium: "medium",
    };
    const backendPriority = priorityMap[currentPriority] || currentPriority || "medium";
    
    return {
      id: parseInt(taskId || "0"),
      name: currentTitle,
      description: currentDescription || "",
      priority: backendPriority,
      status: backendStatus,
      category: currentCategory || "",
      property_id: currentPropertyId || taskData?.property_id,
      unit_id: currentUnitId ?? taskData?.unit_id ?? null,
      due_date: currentDueDate ? currentDueDate.toISOString() : null,
      assignees: currentAssignees.map((a) => a.id),
      collaborators: currentCollaborators?.map((c) => c.id) || [],
      attachments: taskData?.attachments || [],
    };
  }, [
    taskId,
    currentTitle,
    currentDescription,
    currentPriority,
    currentStatus,
    currentCategory,
    currentPropertyId,
    currentUnitId,
    currentDueDate,
    currentAssignees,
    currentCollaborators,
    taskData?.property_id,
    taskData?.unit_id,
    taskData?.attachments,
  ]);

  // Get the selected work order if workOrderId is present or set in state
  const selectedWorkOrder = useMemo(() => {
    // Prefer workOrderId from URL params (this is the source of truth)
    const targetId = workOrderId
      ? parseInt(workOrderId)
      : uiState.selectedWorkOrderId;
    if (!targetId) return null;

    // First check if this is a newly created work order passed through location state
    const newWorkOrder = navigationState?.newWorkOrder;
    if (newWorkOrder && newWorkOrder.id === targetId) {
      return newWorkOrder;
    }

    // Otherwise look for it in the workOrders list
    const found = workOrders.find((wo) => wo.id === targetId);
    return found || null;
  }, [
    workOrderId,
    uiState.selectedWorkOrderId,
    workOrders,
    navigationState?.newWorkOrder,
  ]);

  // Clear location state once the new work order is added to the list
  useEffect(() => {
    if (navigationState?.newWorkOrder && selectedWorkOrder) {
      const found = workOrders.find((wo) => wo.id === selectedWorkOrder.id);
      if (found) {
        // The newly created work order is now in the list, we can clear the navigation state
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname,
        );
      }
    }
  }, [workOrders, selectedWorkOrder, navigationState?.newWorkOrder]);

  // Determine if we are trying to view a work order but it's not found yet (loading state)
  const isLoadingWorkOrder = !!workOrderId && !selectedWorkOrder;

  // Work order state
  const [workOrderStatus, setWorkOrderStatus] = useState<string>(() => {
    if (!selectedWorkOrder) return "in_progress";
    const status = selectedWorkOrder.status;
    return status === "Completed" ? "completed" : "in_progress";
  });

  const [workOrderPriority, setWorkOrderPriority] = useState<string>(() => {
    if (!selectedWorkOrder) return "normal";
    const priority = selectedWorkOrder.priority;
    return priority.toLowerCase();
  });

  const [workOrderNotifications, setWorkOrderNotifications] = useState<
    Array<{ id: string; message: string }>
  >([]);

  // Helper function to safely parse bill total
  const getBillAmount = (billTotal: string): number => {
    if (!billTotal) return 0;
    const amount = parseFloat(billTotal.replace("$", "").replace(",", ""));
    return isNaN(amount) ? 0 : amount;
  };

  return (
    <PageTemplate>
      {/* Header Section */}
      <PageHeader
        title={
          currentTitle ||
          taskData?.title ||
          taskData?.name ||
          navigationState?.task?.title ||
          navigationState?.taskData?.title ||
          fetchedTaskData?.title ||
          fetchedTaskData?.name ||
          "Loading..."
        }
        subtitle={(() => {
          const isCompleted = ["completed", "closed", "cancelled"].includes(
            taskData?.status?.toLowerCase() ?? ""
          );
          return (
            <div className="flex items-center gap-3">
              {!isCompleted && (
                <>
                  <div className="text-[#717179] font-medium text-base leading-4">
                    To-Do
                  </div>
                  <svg width="4" height="4" viewBox="0 0 4 4" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="2" cy="2" r="2" fill="#717179" />
                  </svg>
                </>
              )}
              <span className="text-[#717179] font-medium text-base leading-4">
                {isCompleted
                  ? taskId
                  : sequentialNumber !== undefined
                  ? `#${sequentialNumber} ${taskId}`
                  : `#${taskId}`}
              </span>
            </div>
          );
        })()}
        action={{
          label: uiState.selectedWorkOrderId
            ? "Update Work Order"
            : "Update task",
          onClick: () => {
            if (uiState.selectedWorkOrderId) {
              // Trigger Update Work Order Modal
              setIsUpdateWorkOrderModalOpen(true);
            } else {
              // Trigger Update Task Modal
              uiDispatch({ type: "OPEN_MODAL", payload: "editTask" });
            }
          },
        }}
        moreOptions={{
          onView: () => {
            // Handle view
          },
          onDelete: () => {
            // Handle delete
          },
        }}
      />

      {/* Tabs Section */}
      <div className="flex flex-col mt-6 w-full">
        <div className="flex items-start gap-6 min-h-[36px] w-full border-b border-[#e5e5e5] font-['Geist',sans-serif] text-base text-[#717179] font-medium flex-nowrap overflow-x-auto">
          <button
            onClick={() => handleTabChange("summary")}
            className={`flex items-center gap-1.5 py-2 whitespace-nowrap ${
              uiState.activeTab === "summary"
                ? "border-b-2 border-[#09090b] text-[#09090b]"
                : "hover:text-[#09090b]"
            } transition-colors`}
          >
            Summary
          </button>
          <button
            onClick={() => handleTabChange("workorders")}
            className={`flex items-center gap-1.5 py-2 whitespace-nowrap ${
              uiState.activeTab === "workorders"
                ? "border-b-2 border-[#09090b] text-[#09090b]"
                : "hover:text-[#09090b]"
            } transition-colors`}
          >
            Work orders
          </button>
          <button
            onClick={() => handleTabChange("fieldteam")}
            className={`flex items-center gap-1.5 py-2 whitespace-nowrap ${
              uiState.activeTab === "fieldteam"
                ? "border-b-2 border-[#09090b] text-[#09090b]"
                : "hover:text-[#09090b]"
            } transition-colors`}
          >
            Field Team Orders
          </button>
          <button
            onClick={() => handleTabChange("subtasks")}
            className={`flex items-center gap-1.5 py-2 whitespace-nowrap ${
              uiState.activeTab === "subtasks"
                ? "border-b-2 border-[#09090b] text-[#09090b]"
                : "hover:text-[#09090b]"
            } transition-colors`}
          >
            Subtasks
          </button>
        </div>

        {/* Notifications Banner - COMMENTED OUT */}
        {false && uiState.activeTab === "summary" && (
          <div className="flex flex-col mt-5 w-full border border-[#e3e3e3] rounded-[10px] overflow-hidden font-['Geist',sans-serif]">
            <div className="flex items-center justify-between gap-10 px-3 py-3 bg-[#f9f9f9] max-w-full flex-wrap">
              <div className="flex items-center gap-2">
                <Bell className="w-[18px] h-[18px]" />
                <div className="text-base text-[#303030] font-bold tracking-[-0.32px]">
                  Notifications
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between px-3 py-3 bg-white flex-wrap">
              <div className="flex items-center gap-2 min-w-[240px] flex-1">
                <div className="w-1.5 h-1.5 rounded-full bg-[#e5e5e5]"></div>
                <div className="text-base text-[#303030]">
                  Task looks similar to a previous task XYZ. Would you like to
                  link tasks?
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm tracking-[-0.28px]">
                <button className="text-[#303030] underline hover:no-underline">
                  Dismiss
                </button>
                <button className="text-[#2463eb] hover:underline">
                  Approve
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex mt-5 w-full gap-6 flex-wrap lg:flex-nowrap">
          {/* Show TaskWorkOrders component when work orders tab is active */}
          {uiState.activeTab === "workorders" &&
            (selectedWorkOrder ? (
              <WorkOrderDetailsV2
                workOrder={selectedWorkOrder}
                currentAssignees={currentAssignees}
                currentCollaborators={currentCollaborators}
                onBillAdded={(bill) => {
                  setUpdates((prev) => [
                    {
                      id: prev.length + 1,
                      author: "System",
                      authorType: "assignee",
                      action: `entered bill for work order #${selectedWorkOrder.id}`,
                      actionValue: `${bill.invoiceNumber} - ${bill.amount}`,
                      timestamp: new Date().toLocaleString(),
                      icon: <PaperclipIcon width={16} height={16} />,
                    },
                    ...prev,
                  ]);
                }}
                onWorkOrderUpdate={(updatedWorkOrder) => {
                  // Convert dueDate back to string format when updating the list
                  const workOrderForUpdate = {
                    ...updatedWorkOrder,
                    dueDate:
                      updatedWorkOrder.dueDate instanceof Date
                        ? updatedWorkOrder.dueDate.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : updatedWorkOrder.dueDate,
                  };

                  // Find the original work order to check what changed
                  const originalWorkOrder = workOrders.find(
                    (wo) => wo.id === updatedWorkOrder.id,
                  );
                  const newUpdates: any[] = [];

                  // Check if status changed to completed
                  if (
                    originalWorkOrder &&
                    originalWorkOrder.status !== updatedWorkOrder.status &&
                    updatedWorkOrder.status === "completed"
                  ) {
                    newUpdates.push({
                      id: updates.length + newUpdates.length + 1,
                      author: "System",
                      authorType: "assignee",
                      action: `completed work order #${updatedWorkOrder.id}`,
                      timestamp: new Date().toLocaleString(),
                      icon: <EditIcon width={16} height={16} />,
                    });
                  }

                  // Update work orders list
                  const newWorkOrders = workOrders.map((wo) =>
                    wo.id === updatedWorkOrder.id ? workOrderForUpdate : wo,
                  );
                  setWorkOrders(newWorkOrders);

                  // Extract new notes and files to add to main task if they were added during work order update
                  if (
                    updatedWorkOrder.notes &&
                    updatedWorkOrder.notes.length > notes.length
                  ) {
                    const newNotes = updatedWorkOrder.notes.filter(
                      (wn) =>
                        !notes.some(
                          (n) => n.id === wn.id && n.text === wn.text,
                        ),
                    );
                    if (newNotes.length > 0) {
                      setNotes((prev) => [...prev, ...newNotes]);
                    }
                  }

                  if (
                    updatedWorkOrder.files &&
                    updatedWorkOrder.files.length > files.length
                  ) {
                    const newFiles = updatedWorkOrder.files.filter(
                      (wf) =>
                        !files.some(
                          (f) => f.id === wf.id && f.name === wf.name,
                        ),
                    );
                    if (newFiles.length > 0) {
                      setFiles((prev) => [...prev, ...newFiles]);
                    }
                  }

                  // Add new updates to timeline
                  if (newUpdates.length > 0) {
                    setUpdates((prev) => [...newUpdates, ...prev]);
                  }
                }}
                isUpdateWorkOrderModalOpen={isUpdateWorkOrderModalOpen}
                onUpdateWorkOrderModalOpenChange={setIsUpdateWorkOrderModalOpen}
              />
            ) : isLoadingWorkOrder || isLoadingWorkOrders ? (
              <div className="flex flex-col items-center justify-center w-full h-[300px] bg-white rounded-lg border border-[#e5e5e5]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                <p className="mt-4 text-gray-500">Loading work orders...</p>
              </div>
            ) : workOrdersError ? (
              <div className="flex flex-col items-center justify-center w-full h-[300px] bg-white rounded-lg border border-[#e5e5e5]">
                <p className="text-red-500">Error loading work orders.</p>
              </div>
            ) : (
              <TaskWorkOrders
                workOrders={workOrders}
                onWorkOrdersChange={setWorkOrders}
                defaultProperty={currentProperty}
                defaultTask={currentTitle}
                defaultUnit={currentUnit}
                taskId={taskId || "0"}
                propertyId={currentPropertyId || taskData?.property_id}
                onWorkOrderSelect={handleWorkOrderSelect}
                onRefetchWorkOrders={refetchWorkOrders}
              />
            ))}

          {/* Show summary content when summary tab is active */}
          {uiState.activeTab === "summary" && (
            <SummaryTab
              currentCategory={currentCategory}
              currentDescription={currentDescription}
              currentStatus={currentStatus}
              currentPriority={currentPriority}
              currentDueDate={currentDueDate}
              currentProperty={currentProperty}
              currentPropertyId={currentPropertyId}
              currentPropertyName={taskData?.property_name}
              currentPropertyAddress={taskData?.property_address}
              currentLocationAddress={taskData?.location_address}
              currentPropertyImageUrl={propertyImageUrl}
              currentUnit={currentUnit}
              createdTimestamp={formatTaskDateTime(createdTimestamp)}
              lastUpdatedTimestamp={formatTaskDateTime(lastUpdatedTimestamp)}
              workOrders={workOrders}
              fieldTeamOrders={fieldTeamOrders}
              notes={notes}
              files={files}
              updates={updates}
              linkedTasks={uiState.linkedTasks}
              currentAssignees={currentAssignees}
              currentCollaborators={currentCollaborators}
              vendorsFromWorkOrders={vendorsFromWorkOrders}
              fieldTeamFromOrders={fieldTeamFromOrders}
              isNewTask={isNewTask}
              taskData={taskData}
              sequentialNumber={sequentialNumber}
              taskId={taskId}
              subtasksTotal={subtasks.length}
              subtasksCompleted={subtasks.filter((s) => s.status === "done").length}
              creatorDetails={creatorDetails}
              onEditTaskDetails={() =>
                uiDispatch({ type: "OPEN_MODAL", payload: "editTaskDetails" })
              }
              onAddNote={() => {
                uiDispatch({ type: "SET_EDITING_NOTE_ID", payload: null });
                uiDispatch({ type: "SET_VIEWING_NOTE", payload: null });
                uiDispatch({ type: "OPEN_MODAL", payload: "addNote" });
              }}
              onEditNote={(note) => {
                uiDispatch({ type: "SET_EDITING_NOTE_ID", payload: note.id });
                uiDispatch({ type: "OPEN_MODAL", payload: "addNote" });
              }}
              onDeleteNote={async (noteId) => {
                try {
                  await handleDeleteNote(noteId);
                } catch (error) {
                  console.error("Error deleting note:", error);
                  // Optionally show error toast/notification here
                }
              }}
              onAddFile={() => {
                uiDispatch({ type: "SET_EDITING_FILE_ID", payload: null });
                uiDispatch({ type: "OPEN_MODAL", payload: "addFile" });
              }}
              onEditFile={(file) => {
                uiDispatch({ type: "SET_EDITING_FILE_ID", payload: file.id });
                uiDispatch({ type: "OPEN_MODAL", payload: "addFile" });
              }}
              onDeleteFile={async (fileId) => {
                try {
                  await handleDeleteFile(fileId);
                } catch (error) {
                  console.error("Error deleting file:", error);
                  // Optionally show error toast/notification here
                }
              }}
              onViewFile={(file) => {
                if (!file.id) {
                  console.warn("File has no ID:", file);
                  return;
                }
                handleViewAttachment({
                  id: file.id,
                  name: file.name,
                  url: (file as any).url,
                  storage_path: (file as any).storage_path,
                });
              }}
              onLinkTasks={() =>
                uiDispatch({ type: "OPEN_MODAL", payload: "linkTask" })
              }
              onUnlinkTask={async (linkedTaskId) => {
                if (!taskId) {
                  console.error("Task ID is required to unlink tasks");
                  return;
                }

                try {
                  // Call API to delete the link
                  await fetchJSON(`/maintenance/tasks/id/${taskId}/links/${linkedTaskId}`, {
                    method: "DELETE",
                  });

                  // Update local state
                  uiDispatch({ type: "REMOVE_LINKED_TASK", payload: linkedTaskId });

                  // Refresh linked tasks from API to ensure consistency
                  const refreshedLinkedTasks = await fetchJSON(`/maintenance/tasks/id/${taskId}/links`);
                  const mappedLinkedTasks: LinkedTaskData[] = refreshedLinkedTasks.map((task: any) => {
                    const statusMap: Record<string, "not_started" | "in_progress" | "completed"> = {
                      open: "not_started",
                      not_started: "not_started",
                      in_progress: "in_progress",
                      pending_vendor: "in_progress",
                      scheduled: "in_progress",
                      completed: "completed",
                      closed: "completed",
                      cancelled: "completed",
                    };
                    
                    const frontendStatus = statusMap[task.status?.toLowerCase()] || "not_started";
                    
                    const updatedDate = task.created_at
                      ? new Date(task.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "Unknown";
                    
                    return {
                      id: task.id,
                      name: task.name,
                      status: frontendStatus,
                      updatedDate,
                      updatedBy: "System",
                    };
                  });
                  uiDispatch({ type: "SET_LINKED_TASKS", payload: mappedLinkedTasks });
                } catch (error: any) {
                  console.error("Error unlinking task:", error);
                  alert(`Failed to unlink task: ${error.message || "Unknown error"}`);
                }
              }}
              onTaskClick={(linkedTaskId) => {
                navigate(`/tasks/${linkedTaskId}`);
              }}
              onAddUpdate={() =>
                uiDispatch({ type: "OPEN_MODAL", payload: "editTask" })
              }
              onEditTask={() =>
                uiDispatch({ type: "OPEN_MODAL", payload: "editTask" })
              }
              onStatusChange={handleStatusChange}
              onPriorityChange={handlePriorityChange}
              onDueDateChange={handleDueDateChange}
              getPropertyDisplayLabel={getPropertyDisplayLabel}
              getUnitDisplayLabel={getUnitDisplayLabel}
              getPropertyName={getPropertyName}
              getPropertyAddress={getPropertyAddress}
              getRentalOwnerByProperty={getRentalOwnerByProperty}
            />
          )}

          {/* Subtasks tab content */}
          {uiState.activeTab === "subtasks" && (
            <SubtasksTab
              taskId={taskId || ""}
              subtasks={subtasks}
              onRefetch={refetchSubtasks}
              availableAssignees={availableSubtaskAssignees}
              onCreateSubtask={async (values) => {
                if (!taskId) return;
                await fetchJSON(`/maintenance/tasks/id/${taskId}/subtasks`, {
                  method: "POST",
                  body: JSON.stringify({
                    name: values.name,
                    description: values.description || "",
                    status: values.status,
                    assignees: values.assignees.map((a) => Number(a.id)),
                    ...(userId != null && { actor_id: userId }),
                  }),
                });
                await loadUpdatesFromDb();
              }}
              onUpdateSubtask={async (subtaskId, values) => {
                if (!taskId) return;
                await fetchJSON(
                  `/maintenance/tasks/id/${taskId}/subtasks/${subtaskId}`,
                  {
                    method: "PATCH",
                    body: JSON.stringify({
                      name: values.name,
                      description: values.description || "",
                      status: values.status,
                      assignees: values.assignees.map((a) => Number(a.id)),
                      ...(userId != null && { actor_id: userId }),
                    }),
                  }
                );
                await loadUpdatesFromDb();
                await refetchSubtasks();
              }}
              onDeleteSubtask={async (subtaskId) => {
                if (!taskId) return;
                await fetchJSON(
                  `/maintenance/tasks/id/${taskId}/subtasks/${subtaskId}`,
                  { method: "DELETE" }
                );
              }}
            />
          )}

          {/* Field Team Orders tab content */}
          {uiState.activeTab === "fieldteam" && (
            <TaskFieldTeamOrders
              orders={fieldTeamOrders}
              isLoading={isLoadingFieldTeamOrders || isLoadingFieldTeamMembers}
              lockedPropertyId={currentPropertyId || taskData?.property_id}
              lockedPropertyLabel={
                taskData?.property_name ||
                currentProperty ||
                taskData?.property_address ||
                ""
              }
              lockedUnitId={currentUnitId ?? taskData?.unit_id ?? null}
              lockedUnitLabel={
                currentUnit ||
                  formatUnitLabel({
                    unitId: taskData?.unit_id ?? taskData?.unit,
                    unitName: taskData?.unit_name ?? taskData?.unit,
                    fallback: UNIT_EMPTY_DISPLAY,
                  })
              }
              lockedTaskId={taskId ? Number(taskId) : undefined}
              lockedTaskLabel={
                taskData?.title ||
                taskData?.name ||
                (taskId ? `Task #${taskId}` : "")
              }
              onRefetchFieldTeamOrders={refetchFieldTeamOrders}
              onOrdersChange={(newOrders) => {
                // Check for timesheet status changes and create updates
                newOrders.forEach((newOrder, idx) => {
                  const oldOrder = fieldTeamOrders[idx];
                  if (
                    oldOrder &&
                    oldOrder.timesheetStatus !== newOrder.timesheetStatus
                  ) {
                    if (newOrder.timesheetStatus === "submitted") {
                      setUpdates((prev) => [
                        {
                          id: prev.length + 1,
                          author: "System",
                          authorType: "assignee",
                          action: `timesheet for field team order #${newOrder.id} was submitted`,
                          timestamp: new Date().toLocaleString(),
                          icon: <EditIcon width={16} height={16} />,
                        },
                        ...prev,
                      ]);
                    } else if (newOrder.timesheetStatus === "approved") {
                      setUpdates((prev) => [
                        {
                          id: prev.length + 1,
                          author: "System",
                          authorType: "assignee",
                          action: `timesheet for field team order #${newOrder.id} was approved`,
                          timestamp: new Date().toLocaleString(),
                          icon: <ApproveIcon width={16} height={16} />,
                        },
                        ...prev,
                      ]);
                    }
                  }
                });
                setFieldTeamOrders(newOrders);
              }}
            />
          )}
        </div>
      </div>

      <TaskSummaryModals
        uiState={uiState}
        uiDispatch={uiDispatch}
        notes={notes}
        files={files}
        updates={updates}
        currentTitle={currentTitle}
        currentDescription={currentDescription}
        currentProperty={currentProperty}
        currentUnit={currentUnit}
        currentPropertyId={currentPropertyId}
        currentUnitId={currentUnitId}
        currentCategory={currentCategory}
        currentStatus={currentStatus}
        currentPriority={currentPriority}
        currentDueDate={currentDueDate}
        currentAssignees={currentAssignees}
        currentCollaborators={currentCollaborators}
        availableTasksForLinking={availableTasksForLinking}
        modalEditData={modalEditData}
        editingNote={editingNote}
        editingFile={editingFile}
        taskId={taskId}
        userId={userId}
        onRefetchTaskData={refetchTaskData}
        onRefetchUpdates={loadUpdatesFromDb}
        onNotesChange={setNotes}
        onCreateNote={handleCreateNote}
        onUpdateNote={handleUpdateNote}
        onDeleteNote={handleDeleteNote}
        onFilesChange={setFiles}
        onCreateFile={handleCreateFile}
        onUpdateFile={handleUpdateFile}
        onDeleteFile={handleDeleteFile}
        onUpdatesChange={setUpdates}
        onCurrentTitleChange={setCurrentTitle}
        onCurrentDescriptionChange={setCurrentDescription}
        onCurrentPropertyChange={setCurrentProperty}
        onCurrentUnitChange={setCurrentUnit}
        onCurrentCategoryChange={setCurrentCategory}
        onCurrentStatusChange={setCurrentStatus}
        onCurrentPriorityChange={setCurrentPriority}
        onCurrentDueDateChange={setCurrentDueDate}
        onCurrentAssigneesChange={setCurrentAssignees}
        onCurrentCollaboratorsChange={setCurrentCollaborators}
        onLastUpdatedChange={setLastUpdatedTimestamp}
        syncFileNameAcrossStates={syncFileNameAcrossStates}
        getAttachmentData={getAttachmentData}
        onViewAttachment={handleViewAttachment}
        handleStartRenamingAttachment={handleStartRenamingAttachment}
        handleSaveAttachmentFileName={handleSaveAttachmentFileName}
        handleCancelRenamingAttachment={handleCancelRenamingAttachment}
      />

      {/* PDF Viewer Modal (same pattern as ApproveFtoPage) */}
      <PdfViewerModal
        open={pdfViewer.isOpen}
        onOpenChange={(open) => {
          if (!open) pdfViewer.closePdf();
        }}
        url={pdfViewer.url}
        title={pdfViewer.title}
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
    </PageTemplate>
  );
}
