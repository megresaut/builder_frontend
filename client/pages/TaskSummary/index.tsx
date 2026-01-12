import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import { EditIcon, NoteIcon, PaperclipIcon, FlagIcon, CalendarIcon } from "@/components/icons";
import { SectionActionTemplate } from "@/components/templates";
import PageTemplate from "@/layout/PageTemplate";
import WorkOrders from "../WorkOrders";
import TaskWorkOrders from "./TaskWorkOrders";
import TaskFieldTeamOrders from "./TaskFieldTeamOrders";
import WorkOrderDetailsV2 from "./WorkOrderDetailsV2";
import SummaryTab from "./SummaryTab";
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
import { AddNoteModal, AddFileModal, EditTaskDetailsModal, LinkTaskModal } from "@/components/task";
import { StatusSelectField } from "@/components/forms/StatusSelectField";
import { PrioritySelectField } from "@/components/forms/PrioritySelectField";
import { NotesTemplate } from "@/components/templates";
import { FilesTemplate } from "@/components/templates";
import type { Note } from "@/components/templates";
import type { File } from "@/components/templates";
import type { LinkedTaskData } from "@/components/task";
import type { EditTaskDetailsData } from "@/components/task";
import type { UploadedFile } from "@/components/ui/attachment-uploader";
import { ModalTemplate, ModalButtons } from "@/components/ui/ModalTemplate";
import { FormLayout, FormSection } from "@/components/ui/form-layout";
import PdfViewerModal from "@/components/PdfViewerModal";
import RecordBillModal from "@/components/RecordBillModal";
import { MOCK_TASKS } from "@/data/tasks";

export default function TaskSummary() {
  const { taskId, tab, workOrderId } = useParams<{
    taskId: string;
    tab?: string;
    workOrderId?: string;
  }>();
  const navigate = useNavigate();
  const location = useLocation();
  const navigationState = location.state as any;
  const { setSelectedTab, setTabMetadata, tabMetadata } = useTabContext();

  // Find the task in MOCK_TASKS if navigation state is missing
  const existingTask = useMemo(() => {
    return MOCK_TASKS.find((t) => String(t.id) === taskId);
  }, [taskId]);

  // Use either provided task data or find it from MOCK_TASKS
  const taskData = navigationState?.taskData || navigationState?.task || existingTask;

  // Ref for tracking blob URLs created during task initialization
  const createdAttachmentUrlsRef = useRef<Set<string>>(new Set());

  // Initialize UI state reducer
  const { state: uiState, dispatch: uiDispatch } = useTaskSummaryUI(
    (tab as "summary" | "workorders" | "fieldteam") || "summary"
  );

  // Initialize activeTab and selectedWorkOrderId from URL params on mount and when URL changes
  useEffect(() => {
    const tabValue = (tab as "summary" | "workorders" | "fieldteam") || "summary";
    if (tabValue !== uiState.activeTab) {
      uiDispatch({ type: "SET_ACTIVE_TAB", payload: tabValue });
    }

    const urlId = workOrderId ? parseInt(workOrderId) : null;
    if (urlId !== uiState.selectedWorkOrderId) {
      uiDispatch({ type: "SET_SELECTED_WORK_ORDER_ID", payload: urlId });
    }
  }, [tab, workOrderId, uiDispatch]);

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
    if (!tab && taskId) {
      navigate(`/tasks/${taskId}/summary`, { replace: true });
    }
  }, [tab, taskId, navigate]);

  // Determine if this is a new task
  const isNewTask = !!(navigationState?.taskData || navigationState?.task || (existingTask && taskId !== "1")); // Task 1 is our "Edgerton" demo

  // Update tab metadata with actual task name
  useEffect(() => {
    if (taskId && taskData?.title) {
      const tabId = `task-${taskId}`;
      setTabMetadata(tabId, {
        label: taskData.title,
        route: `/tasks/${taskId}`,
      });
    }
  }, [taskId, taskData?.title, setTabMetadata]);

  // Track creation timestamp - set once and never change
  const [createdTimestamp] = useState<string>(() => {
    // Use provided creation timestamp or current time
    return taskData?.createdAt ||
           taskData?.updated ||
           new Date().toLocaleString();
  });

  // Mock state for notes, files, and updates
  const [notes, setNotes] = useState<Note[]>(taskData?.notes || (isNewTask ? [] : [
    {
      id: 1,
      text: "Initial task setup completed",
      date: "11/12/2025 9:22 PM",
      author: "Julia LoSchiavo",
    },
  ]));

  const [files, setFiles] = useState<File[]>(() => {
    if (taskData?.files) {
      return taskData.files.map((f: any, idx: number) => ({
        id: String(f.id || `${f.name}-${idx}`),
        name: f.name,
        url: f.url,
        uploadedAt: new Date().toLocaleString(),
        category: "",
        description: "",
      }));
    }
    return isNewTask ? [] : [
      {
        id: 1,
        name: "Lorem Ipsum.PDF",
        uploadedAt: "11/12/2025 9:22 PM",
        category: "",
        url: "https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/5ef69f3c3e2f3e3b15cc6139a16a94f848b10be7",
      },
    ];
  });

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

    const isImage =
      typeof file?.type === "string"
        ? file.type.startsWith("image/")
        : typeof file?.name === "string"
          ? /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name)
          : false;

    // Ensure ID is stable and unique. Prefer file.id, fallback to name+index for initial files
    const stableId = file.id || (index !== undefined ? `${file.name}-${index}` : file.name);

    return {
      name: file.name,
      url: fileUrl,
      preview: isImage ? fileUrl : undefined,
      id: String(stableId),
    };
  };

  const getInitialUpdate = () => {
    const statusMap: { [key: string]: string } = {
      "not_started": "Not Started",
      "in_progress": "In Progress",
      "completed": "Completed",
      "Not Started": "Not Started",
      "In Progress": "In Progress",
      "Completed": "Completed",
    };
    const priorityLabel = taskData?.priority
      ? (typeof taskData.priority === 'string'
          ? taskData.priority.charAt(0).toUpperCase() + taskData.priority.slice(1)
          : taskData.priority)
      : "Normal";
    const dueDate = taskData?.dueDate || taskData?.due
      ? (taskData.dueDate instanceof Date
          ? taskData.dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          : (taskData.dueDate || taskData.due))
      : "No due date";
    const fields = [
      { label: "Status", value: <TaskStatusBadge status={(statusMap[taskData?.status] || taskData?.status || "Not Started") as any} /> },
      { label: "Priority", value: <TaskPriorityBadge priority={priorityLabel as any} /> },
      { label: "Due Date", value: dueDate },
      { label: "Assignees", value: <PersonAvatars people={taskData?.assignees || []} type="assignee" fallback="Unassigned" /> },
    ];

    if (taskData?.collaborators && taskData.collaborators.length > 0) {
      fields.push({ label: "Collaborators", value: <PersonAvatars people={taskData.collaborators} type="collaborator" /> });
    }

    return {
      id: 0,
      author: "Julia LoSchiavo",
      authorType: "assignee",
      action: "created this task",
      timestamp: new Date().toLocaleString(),
      fieldsDisplay: (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-3">
          {fields.map((field, idx) => (
            <div key={idx}>
              <div className="text-xs font-medium text-[#71717A] uppercase tracking-wider">{field.label}</div>
              <div className="text-sm text-[#303030] font-medium mt-0.5">{field.value}</div>
            </div>
          ))}
        </div>
      ),
      ...(taskData?.description && {
        details: <div className="text-sm text-[#303030]">{taskData.description}</div>,
      }),
      ...(taskData?.files && taskData.files.length > 0 && {
        attachments: taskData.files.map((f: any, idx: number) => getAttachmentData(f, idx)),
        onAttachmentClick: (file: any) => {
          uiDispatch({ type: "SET_VIEWING_ATTACHMENT", payload: { id: file.id, name: file.name, url: file.url } });
          uiDispatch({ type: "OPEN_MODAL", payload: "pdfViewer" });
          uiDispatch({ type: "CANCEL_RENAMING_ATTACHMENT" });
        },
      }),
      icon: <FlagIcon width={16} height={16} />,
      isInitialCreation: true,
    };
  };

  // Initialize updates based on whether this is a newly created task
  const getInitialUpdates = () => {
    if (isNewTask || existingTask) {
      // For newly created or existing MOCK tasks, start with just the creation update
      return [getInitialUpdate()];
    }

    // For existing tasks (like the Edgerton demo), show just the creation update
    return [
      {
        id: 0,
        author: "Julia LoSchiavo",
        authorType: "assignee",
        action: "created this task",
        timestamp: "11/12/2025 9:22 PM",
        fieldsDisplay: (
          <div className="grid grid-cols-4 gap-6 mt-3">
            <div>
              <div className="text-xs font-medium text-[#71717A] uppercase tracking-wider">Status</div>
              <div className="mt-0.5">
                <TaskStatusBadge status="Not Started" />
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-[#71717A] uppercase tracking-wider">Priority</div>
              <div className="mt-0.5">
                <TaskPriorityBadge priority="Normal" />
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-[#71717A] uppercase tracking-wider">Due Date</div>
              <div className="text-sm text-[#303030] font-medium mt-0.5">Oct 15, 2025</div>
            </div>
            <div>
              <div className="text-xs font-medium text-[#71717A] uppercase tracking-wider">Assignees</div>
              <div className="mt-0.5">
                <PersonAvatars people={[{ id: 1, name: "Julia LoSchiavo", initials: "JL" }]} type="assignee" />
              </div>
            </div>
          </div>
        ),
        details: (
          <div className="text-sm text-[#303030]">We have been experiencing issues with the water heater. At first we thought the issue was due to us just moving in and maybe the water heater needed time to heat up after no tenants. It has been 3 days in a row now that we lose hot water mid shower.</div>
        ),
        icon: <FlagIcon width={16} height={16} />,
        isInitialCreation: true,
      },
    ];
  };

  const [updates, setUpdates] = useState<any[]>(getInitialUpdates());
  const [currentProperty, setCurrentProperty] = useState<string>(taskData?.property || "");
  const [currentUnit, setCurrentUnit] = useState<string>(taskData?.unit || "");
  const [currentTitle, setCurrentTitle] = useState<string>(taskData?.title || "Edgerton - Quote");
  const [currentDescription, setCurrentDescription] = useState<string>(taskData?.description || (isNewTask ? "" : "We have been experiencing issues with the water heater. At first we thought the issue was due to us just moving in and maybe the water heater needed time to heat up after no tenants. It has been 3 days in a row now that we lose hot water mid shower."));
  const [currentCategory, setCurrentCategory] = useState<string>(taskData?.category || "Uncategorized");
  const [currentStatus, setCurrentStatus] = useState<string>(() => {
    const status = taskData?.status || "not_started";
    if (status === "Completed") return "completed";
    if (status === "In Progress") return "in_progress";
    if (status === "Not Started") return "not_started";
    return status.toLowerCase().replace(" ", "_");
  });
  const [currentPriority, setCurrentPriority] = useState<string>(() => {
    const priority = taskData?.priority || "normal";
    return priority.toLowerCase();
  });
  const [currentDueDate, setCurrentDueDate] = useState<Date | null>(() => {
    const rawDueDate = taskData?.dueDate || taskData?.due;
    if (rawDueDate) {
      const date = new Date(rawDueDate);
      return isNaN(date.getTime()) ? null : date;
    }
    return isNewTask ? null : new Date(2025, 9, 15); // Oct 15, 2025
  });
  const [currentAssignees, setCurrentAssignees] = useState<any[]>(() => {
    if (taskData?.assignees && taskData.assignees.length > 0) {
      return taskData.assignees;
    }
    return isNewTask ? [] : [{ id: 1, name: "Julia LoSchiavo", initials: "JL" }];
  });
  const [currentCollaborators, setCurrentCollaborators] = useState<any[]>(() => {
    if (taskData?.collaborators && taskData.collaborators.length > 0) {
      return taskData.collaborators;
    }
    return isNewTask ? [] : [
      { id: 2, name: "Chris Henry", initials: "CH" },
      { id: 3, name: "Connor Smith", initials: "CS" },
      { id: 8, name: "Sarah Martinez", initials: "SM" },
    ];
  });

  // Sync assignees and collaborators when taskData changes
  useEffect(() => {
    if (taskData?.assignees && taskData.assignees.length > 0) {
      setCurrentAssignees(taskData.assignees);
    }
    if (taskData?.collaborators && taskData.collaborators.length > 0) {
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
    assignees: Assignee[];
    collaborators: Assignee[];
    vendorName?: string;
  }

  // Mock work orders data
  const mockWorkOrders: WorkOrder[] = [
    {
      id: 1,
      task: "Doors need to be repaired",
      taskId: 1,
      property: "Downtown Building",
      unit: "Unit 101",
      dueDate: "Oct 2, 2025",
      updatedDate: "Oct 2, 2025",
      age: "6 days 5 hours",
      priority: "high",
      status: "in_progress",
      billStatus: "Paid",
      billTotal: "$420",
      assignees: [
        { id: 1, name: "Jerry Sanchez", initials: "JS" },
      ],
      collaborators: [
        { id: 5, name: "Sarah Wilson", initials: "SW" },
      ],
      vendorName: "ABC Doors & Hardware",
    },
    {
      id: 2,
      task: "HVAC maintenance needed",
      taskId: 2,
      property: "Riverside Complex",
      unit: "Unit 205",
      dueDate: "Sep 29, 2025",
      updatedDate: "Sep 29, 2025",
      age: "6 days 5 hours",
      priority: "low",
      status: "in_progress",
      billStatus: "Awaiting Invoice",
      billTotal: "No invoice",
      assignees: [
        { id: 3, name: "Jane Smith", initials: "JMS" },
      ],
      collaborators: [
        { id: 6, name: "Tom Davis", initials: "TD" },
        { id: 7, name: "Lisa Brown", initials: "LB" },
      ],
      vendorName: "Elite HVAC Services",
    },
    {
      id: 3,
      task: "Window replacement",
      taskId: 3,
      property: "Central Plaza",
      unit: "Unit 312",
      dueDate: "Sep 10, 2025",
      updatedDate: "Sep 10, 2025",
      age: "6 days 5 hours",
      priority: "normal",
      status: "completed",
      billStatus: "Unpaid",
      billTotal: "$95",
      assignees: [
        { id: 1, name: "Jerry Sanchez", initials: "JS" },
      ],
      collaborators: [],
      vendorName: "Glass & Frames Inc",
    },
    {
      id: 4,
      task: "Roof inspection",
      taskId: 4,
      property: "Highland Towers",
      unit: "Roof Level",
      dueDate: "Sep 6, 2025",
      updatedDate: "Sep 6, 2025",
      age: "6 days 5 hours",
      priority: "high",
      status: "completed",
      billStatus: "Unpaid",
      billTotal: "$112",
      assignees: [
        { id: 2, name: "John Doe", initials: "JD" },
      ],
      collaborators: [
        { id: 5, name: "Sarah Wilson", initials: "SW" },
      ],
      vendorName: "Pro Roofing Solutions",
    },
    {
      id: 5,
      task: "Plumbing repair",
      taskId: 5,
      property: "Market Street Apt",
      unit: "Unit 404",
      dueDate: "Sep 5, 2025",
      updatedDate: "Sep 5, 2025",
      age: "6 days 5 hours",
      priority: "high",
      status: "completed",
      billStatus: "Unpaid",
      billTotal: "$93",
      assignees: [
        { id: 4, name: "Mike Johnson", initials: "MJ" },
      ],
      collaborators: [
        { id: 6, name: "Tom Davis", initials: "TD" },
      ],
      vendorName: "Dolce Plumbing & Heating LLC",
    },
    {
      id: 6,
      task: "Electrical work",
      taskId: 6,
      property: "Oak Ridge Manor",
      unit: "Unit 501",
      dueDate: "Sep 4, 2025",
      updatedDate: "Sep 4, 2025",
      age: "6 days 5 hours",
      priority: "high",
      status: "completed",
      billStatus: "Unpaid",
      billTotal: "$75",
      assignees: [
        { id: 1, name: "Jerry Sanchez", initials: "JS" },
      ],
      collaborators: [
        { id: 7, name: "Lisa Brown", initials: "LB" },
        { id: 5, name: "Sarah Wilson", initials: "SW" },
      ],
      vendorName: "Spark Electrical",
    },
    {
      id: 7,
      task: "Painting job",
      taskId: 7,
      property: "Park Avenue Building",
      unit: "Unit 102",
      dueDate: "Sep 4, 2025",
      updatedDate: "Sep 4, 2025",
      age: "6 days 5 hours",
      priority: "high",
      status: "completed",
      billStatus: "Unpaid",
      billTotal: "$101",
      assignees: [
        { id: 3, name: "Jane Smith", initials: "JMS" },
      ],
      collaborators: [],
      vendorName: "Premium Painters Co",
    },
    {
      id: 8,
      task: "Carpet replacement",
      taskId: 8,
      property: "Westside Residences",
      unit: "Unit 203",
      dueDate: "Sep 3, 2025",
      updatedDate: "Sep 3, 2025",
      age: "6 days 5 hours",
      priority: "high",
      status: "completed",
      billStatus: "Unpaid",
      billTotal: "$124",
      assignees: [
        { id: 2, name: "John Doe", initials: "JD" },
      ],
      collaborators: [
        { id: 6, name: "Tom Davis", initials: "TD" },
      ],
      vendorName: "Quality Flooring LLC",
    },
    {
      id: 9,
      task: "Landscaping work",
      taskId: 9,
      property: "Spring Valley Complex",
      unit: "Common Area",
      dueDate: "Sep 1, 2025",
      updatedDate: "Sep 1, 2025",
      age: "6 days 5 hours",
      priority: "high",
      status: "completed",
      billStatus: "Unpaid",
      billTotal: "$67",
      assignees: [
        { id: 4, name: "Mike Johnson", initials: "MJ" },
      ],
      collaborators: [
        { id: 5, name: "Sarah Wilson", initials: "SW" },
        { id: 7, name: "Lisa Brown", initials: "LB" },
      ],
      vendorName: "Green Lawn Services",
    },
    {
      id: 10,
      task: "Fence repair",
      taskId: 10,
      property: "Lakeside Gardens",
      unit: "Unit 606",
      dueDate: "Sep 1, 2025",
      updatedDate: "Sep 1, 2025",
      age: "6 days 5 hours",
      priority: "high",
      status: "completed",
      billStatus: "Unpaid",
      billTotal: "$118",
      assignees: [
        { id: 1, name: "Jerry Sanchez", initials: "JS" },
      ],
      collaborators: [
        { id: 6, name: "Tom Davis", initials: "TD" },
      ],
      vendorName: "Outdoor Construction Corp",
    },
  ];

  // Work orders and field team orders state
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(mockWorkOrders);
  const [isUpdateWorkOrderModalOpen, setIsUpdateWorkOrderModalOpen] = useState(false);

  // Mock field team orders data
  const mockFieldTeamOrders = [
    { id: 1, taskId: 6, property: "22 Indian Chase Dr", description: "Door Repair", dueDate: "Oct 2, 2025", priority: "high", fieldTeam: [{ initials: "CH", name: "Christopher Harris" }, { initials: "CS", name: "Cassandra Smith" }], status: "dispatched", timesheetStatus: "awaiting-submission", amount: 420, unit: "Unit" },
    { id: 2, taskId: 6, property: "22 Indian Chase Dr", description: "Door Repair", dueDate: "Sep 29, 2025", priority: "normal", fieldTeam: [{ initials: "CH", name: "Christopher Harris" }, { initials: "CS", name: "Cassandra Smith" }], status: "approved", timesheetStatus: "approved", amount: 95, unit: "Unit" },
    { id: 3, taskId: 6, property: "22 Indian Chase Dr", description: "Door Repair", dueDate: "Sep 10, 2025", priority: "low", fieldTeam: [{ initials: "CH", name: "Christopher Harris" }, { initials: "CS", name: "Cassandra Smith" }], status: "pending-approval", timesheetStatus: "submitted", amount: 95, unit: "Unit" },
    { id: 4, taskId: 6, property: "22 Indian Chase Dr", description: "Door Repair", dueDate: "Sep 6, 2025", priority: "high", fieldTeam: [{ initials: "CH", name: "Christopher Harris" }, { initials: "CS", name: "Cassandra Smith" }], status: "dispatched", timesheetStatus: "awaiting-submission", amount: 112, unit: "Unit" },
    { id: 5, taskId: 6, property: "22 Indian Chase Dr", description: "Door Repair", dueDate: "Sep 5, 2025", priority: "normal", fieldTeam: [{ initials: "CH", name: "Christopher Harris" }, { initials: "CS", name: "Cassandra Smith" }], status: "dispatched", timesheetStatus: "approved", amount: 93, unit: "Unit" },
    { id: 6, taskId: 6, property: "22 Indian Chase Dr", description: "Door Repair", dueDate: "Sep 4, 2025", priority: "low", fieldTeam: [{ initials: "CH", name: "Christopher Harris" }, { initials: "CS", name: "Cassandra Smith" }], status: "dispatched", timesheetStatus: "awaiting-submission", amount: 75, unit: "Unit" },
    { id: 7, taskId: 6, property: "22 Indian Chase Dr", description: "Door Repair", dueDate: "Sep 4, 2025", priority: "high", fieldTeam: [{ initials: "DC", name: "David Chen" }, { initials: "ER", name: "Emma Rodriguez" }], status: "dispatched", timesheetStatus: "submitted", amount: 101, unit: "Unit" },
    { id: 8, taskId: 6, property: "22 Indian Chase Dr", description: "Door Repair", dueDate: "Sep 3, 2025", priority: "normal", fieldTeam: [{ initials: "CH", name: "Christopher Harris" }, { initials: "CS", name: "Cassandra Smith" }], status: "dispatched", timesheetStatus: "awaiting-submission", amount: 124, unit: "Unit" },
    { id: 9, taskId: 6, property: "22 Indian Chase Dr", description: "Door Repair", dueDate: "Sep 1, 2025", priority: "low", fieldTeam: [{ initials: "JW", name: "James Wilson" }], status: "dispatched", timesheetStatus: "approved", amount: 67, unit: "Unit" },
    { id: 10, taskId: 6, property: "22 Indian Chase Dr", description: "Door Repair", dueDate: "Sep 1, 2025", priority: "high", fieldTeam: [{ initials: "CH", name: "Christopher Harris" }, { initials: "CS", name: "Cassandra Smith" }], status: "dispatched", timesheetStatus: "awaiting-submission", amount: 118, unit: "Unit" },
  ];

  const [fieldTeamOrders, setFieldTeamOrders] = useState<any[]>(mockFieldTeamOrders);

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

  // Map MOCK_TASKS to LinkedTaskData for default availability, excluding current task
  const availableTasksForLinking = useMemo(() => {
    return MOCK_TASKS
      .filter((t) => String(t.id) !== taskId)
      .map((task) => ({
        id: task.id,
        name: task.title,
        status: task.status.toLowerCase().replace(" ", "_") as any,
        updatedDate: task.updated,
        updatedBy: task.assignees[0]?.name || "Unknown",
      }));
  }, [taskId]);

  // Helper function to sync file names across files and updates states
  const syncFileNameAcrossStates = (fileId: string | number, newName: string) => {
    const stringId = String(fileId);

    // Update the main files state
    setFiles((prevFiles) =>
      prevFiles.map((f) =>
        String(f.id) === stringId
          ? { ...f, name: newName }
          : f,
      ),
    );

    // Update the attachment in all timeline updates
    setUpdates((prevUpdates) =>
      prevUpdates.map((update) => {
        if (update.attachments && Array.isArray(update.attachments)) {
          const updatedAttachments = update.attachments.map((att: any) =>
            String(att.id) === stringId
              ? { ...att, name: newName }
              : att,
          );
          return { ...update, attachments: updatedAttachments };
        }
        return update;
      }),
    );
  };

  const handleTabChange = (newTab: "summary" | "workorders" | "fieldteam") => {
    // Navigate to the new tab without a work order selection
    navigate(`/tasks/${taskId}/${newTab}`, { replace: false });
  };

  const handleWorkOrderSelect = (woId: number | null) => {
    // Update state when work order is selected
    // This is called by the table row click handler
    uiDispatch({ type: "SET_SELECTED_WORK_ORDER_ID", payload: woId });
  };

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
    if (uiState.viewingAttachment && uiState.viewingAttachment.id && trimmedName) {
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
  const getRentalOwnerByProperty = (propertyValue: string | undefined): { id: number; name: string; initials: string; roleLabel: string; phone: string } | null => {
    if (!propertyValue || propertyValue.includes("Unassigned")) {
      return null;
    }

    const rentalOwnerMap: Record<string, { id: number; name: string; initials: string; roleLabel: string; phone: string }> = {
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
    const unitLabels: Record<string, string> = {
      unit1: "Unit 1",
      unit2: "Unit 2",
    };
    return unitLabels[unitValue] || "";
  };

  // Extract unique vendors from work orders
  const vendorsFromWorkOrders = useMemo(() => {
    const uniqueVendors = new Map<string, { id: string; name: string; initials: string }>();
    workOrders.forEach((wo) => {
      if (wo.vendorName && wo.vendorName.trim()) {
        if (!uniqueVendors.has(wo.vendorName)) {
          const initials = wo.vendorName
            .split(" ")
            .slice(0, 2)
            .map((word) => word[0])
            .join("")
            .toUpperCase();
          uniqueVendors.set(wo.vendorName, {
            id: `vendor-${uniqueVendors.size + 1}`,
            name: wo.vendorName,
            initials: initials || "V",
          });
        }
      }
    });
    return Array.from(uniqueVendors.values());
  }, [workOrders]);

  // Extract unique field team members from field team orders
  const fieldTeamFromOrders = useMemo(() => {
    const uniqueFieldTeam = new Map<string, { id: string; name: string; initials: string }>();
    fieldTeamOrders.forEach((order) => {
      if (order.fieldTeam && Array.isArray(order.fieldTeam)) {
        order.fieldTeam.forEach((member: { name: string; initials: string }) => {
          if (member.name && member.name.trim()) {
            if (!uniqueFieldTeam.has(member.name)) {
              uniqueFieldTeam.set(member.name, {
                id: `fieldteam-${uniqueFieldTeam.size + 1}`,
                name: member.name,
                initials: member.initials || member.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2),
              });
            }
          }
        });
      }
    });
    return Array.from(uniqueFieldTeam.values());
  }, [fieldTeamOrders]);

  // Memoize editData to prevent unnecessary re-initialization of the modal
  const modalEditData = useMemo(() => ({
    id: parseInt(taskId || "0"),
    title: currentTitle,
    description: currentDescription,
    property: currentProperty,
    unit: currentUnit,
    priority: currentPriority,
    status: currentStatus,
    dueDate: currentDueDate,
    assignees: currentAssignees,
    collaborators: currentCollaborators,
    category: currentCategory,
  }), [
    taskId,
    currentTitle,
    currentDescription,
    currentProperty,
    currentUnit,
    currentPriority,
    currentStatus,
    currentDueDate,
    currentAssignees,
    currentCollaborators,
    currentCategory
  ]);

  // Get the selected work order if workOrderId is present or set in state
  const selectedWorkOrder = useMemo(() => {
    // Prefer workOrderId from URL params (this is the source of truth)
    const targetId = workOrderId ? parseInt(workOrderId) : uiState.selectedWorkOrderId;
    if (!targetId) return null;

    // First check if this is a newly created work order passed through location state
    const newWorkOrder = navigationState?.newWorkOrder;
    if (newWorkOrder && newWorkOrder.id === targetId) {
      return newWorkOrder;
    }

    // Otherwise look for it in the workOrders list
    const found = workOrders.find((wo) => wo.id === targetId);
    return found || null;
  }, [workOrderId, uiState.selectedWorkOrderId, workOrders, navigationState?.newWorkOrder]);

  // Clear location state once the new work order is added to the list
  useEffect(() => {
    if (navigationState?.newWorkOrder && selectedWorkOrder) {
      const found = workOrders.find((wo) => wo.id === selectedWorkOrder.id);
      if (found) {
        // The newly created work order is now in the list, we can clear the navigation state
        window.history.replaceState({}, document.title, window.location.pathname);
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

  const [workOrderNotifications, setWorkOrderNotifications] = useState<Array<{ id: string; message: string }>>([
    { id: "1", message: "A bill from Edgerton Inc was uploaded" },
  ]);

  // Helper function to safely parse bill total
  const getBillAmount = (billTotal: string): number => {
    if (!billTotal) return 0;
    const amount = parseFloat(billTotal.replace('$', '').replace(',', ''));
    return isNaN(amount) ? 0 : amount;
  };

  return (
    <PageTemplate>
      {/* Header Section */}
      <PageHeader
        title={currentTitle || navigationState?.task?.title || navigationState?.taskData?.title || "Edgerton - Quote"}
        subtitle={
          <div className="flex items-center gap-3">
            <div className="text-[#717179] font-medium text-base leading-4">
              To-Do
            </div>
            <svg
              width="4"
              height="4"
              viewBox="0 0 4 4"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="2" cy="2" r="2" fill="#717179" />
            </svg>
            <span className="text-[#717179] font-medium text-base leading-4">
              #I 1024431
            </span>
          </div>
        }
        action={{
          label: uiState.selectedWorkOrderId ? "Update Work Order" : "Update task",
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
          {uiState.activeTab === "workorders" && (
            selectedWorkOrder ? (
              <WorkOrderDetailsV2
                workOrder={selectedWorkOrder}
                currentAssignees={currentAssignees}
                currentCollaborators={currentCollaborators}
                onWorkOrderUpdate={(updatedWorkOrder) => {
                  // Convert dueDate back to string format when updating the list
                  const workOrderForUpdate = {
                    ...updatedWorkOrder,
                    dueDate: updatedWorkOrder.dueDate instanceof Date
                      ? updatedWorkOrder.dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      : updatedWorkOrder.dueDate
                  };

                  // Update work orders list
                  const newWorkOrders = workOrders.map(wo => wo.id === updatedWorkOrder.id ? workOrderForUpdate : wo);
                  setWorkOrders(newWorkOrders);

                  // Extract new notes and files to add to main task if they were added during work order update
                  if (updatedWorkOrder.notes && updatedWorkOrder.notes.length > notes.length) {
                    const newNotes = updatedWorkOrder.notes.filter(wn => !notes.some(n => n.id === wn.id && n.text === wn.text));
                    if (newNotes.length > 0) {
                      setNotes(prev => [...prev, ...newNotes]);
                    }
                  }

                  if (updatedWorkOrder.files && updatedWorkOrder.files.length > files.length) {
                    const newFiles = updatedWorkOrder.files.filter(wf => !files.some(f => f.id === wf.id && f.name === wf.name));
                    if (newFiles.length > 0) {
                      setFiles(prev => [...prev, ...newFiles]);
                    }
                  }
                }}
                isUpdateWorkOrderModalOpen={isUpdateWorkOrderModalOpen}
                onUpdateWorkOrderModalOpenChange={setIsUpdateWorkOrderModalOpen}
              />
            ) : isLoadingWorkOrder ? (
               <div className="flex flex-col items-center justify-center w-full h-[300px] bg-white rounded-lg border border-[#e5e5e5]">
                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
               </div>
            ) : (
              <TaskWorkOrders
                workOrders={workOrders}
                onWorkOrdersChange={setWorkOrders}
                defaultProperty={currentProperty}
                defaultTask={currentTitle}
                defaultUnit={currentUnit}
                taskId={taskId || "0"}
                onWorkOrderSelect={handleWorkOrderSelect}
              />
            )
          )}

          {/* Show summary content when summary tab is active */}
          {uiState.activeTab === "summary" && (
            <SummaryTab
              currentCategory={currentCategory}
              currentDescription={currentDescription}
              currentStatus={currentStatus}
              currentPriority={currentPriority}
              currentDueDate={currentDueDate}
              currentProperty={currentProperty}
              currentUnit={currentUnit}
              createdTimestamp={createdTimestamp}
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
              onEditTaskDetails={() => uiDispatch({ type: "OPEN_MODAL", payload: "editTaskDetails" })}
              onAddNote={() => {
                uiDispatch({ type: "SET_EDITING_NOTE_ID", payload: null });
                uiDispatch({ type: "SET_VIEWING_NOTE", payload: null });
                uiDispatch({ type: "OPEN_MODAL", payload: "addNote" });
              }}
              onEditNote={(note) => {
                uiDispatch({ type: "SET_VIEWING_NOTE", payload: note });
                uiDispatch({ type: "OPEN_MODAL", payload: "viewNote" });
              }}
              onDeleteNote={(noteId) => setNotes(notes.filter((n) => n.id !== noteId))}
              onAddFile={() => {
                uiDispatch({ type: "SET_EDITING_FILE_ID", payload: null });
                uiDispatch({ type: "OPEN_MODAL", payload: "addFile" });
              }}
              onEditFile={(file) => {
                uiDispatch({ type: "SET_EDITING_FILE_ID", payload: file.id });
                uiDispatch({ type: "OPEN_MODAL", payload: "addFile" });
              }}
              onDeleteFile={(fileId) => setFiles(files.filter((f) => f.id !== fileId))}
              onViewFile={(file) => console.log("View file", file)}
              onLinkTasks={() => uiDispatch({ type: "OPEN_MODAL", payload: "linkTask" })}
              onUnlinkTask={(taskId) => uiDispatch({ type: "REMOVE_LINKED_TASK", payload: taskId })}
              onTaskClick={(linkedTaskId) => {
                const tabId = `task-${linkedTaskId}`;
                setSelectedTab(tabId);
                setTabMetadata(tabId, {
                  label: `Task ${linkedTaskId}`,
                  route: `/tasks/${linkedTaskId}`,
                });
                navigate(`/tasks/${linkedTaskId}`);
              }}
              onAddUpdate={() => uiDispatch({ type: "OPEN_MODAL", payload: "editTask" })}
              onEditTask={() => uiDispatch({ type: "OPEN_MODAL", payload: "editTask" })}
              getPropertyDisplayLabel={getPropertyDisplayLabel}
              getUnitDisplayLabel={getUnitDisplayLabel}
              getPropertyName={getPropertyName}
              getPropertyAddress={getPropertyAddress}
              getRentalOwnerByProperty={getRentalOwnerByProperty}
            />
          )}

          {/* Field Team Orders tab content */}
          {uiState.activeTab === "fieldteam" && <TaskFieldTeamOrders orders={fieldTeamOrders} onOrdersChange={setFieldTeamOrders} />}
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
        onNotesChange={setNotes}
        onFilesChange={setFiles}
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
        syncFileNameAcrossStates={syncFileNameAcrossStates}
        getAttachmentData={getAttachmentData}
        handleStartRenamingAttachment={handleStartRenamingAttachment}
        handleSaveAttachmentFileName={handleSaveAttachmentFileName}
        handleCancelRenamingAttachment={handleCancelRenamingAttachment}
      />
    </PageTemplate>
  );
}
