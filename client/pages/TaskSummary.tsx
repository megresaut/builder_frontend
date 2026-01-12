import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import { EditIcon, NoteIcon, PaperclipIcon, FlagIcon, CalendarIcon } from "@/components/icons";
import { SectionActionTemplate } from "@/components/templates";
import PageTemplate from "@/layout/PageTemplate";
import WorkOrders from "./WorkOrders";
import TaskWorkOrders from "./TaskWorkOrders";
import TaskFieldTeamOrders from "./TaskFieldTeamOrders";
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
import CreateTaskModal from "@/components/CreateTaskModal";
import { AddNoteModal, AddFileModal, EditTaskDetailsModal, LinkTaskModal } from "@/components/task";
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

  // Sync UI state to navigation
  useEffect(() => {
    navigate(`/tasks/${taskId}/${uiState.activeTab}${uiState.selectedWorkOrderId ? `/${uiState.selectedWorkOrderId}` : ""}`);
  }, [uiState.activeTab, uiState.selectedWorkOrderId, taskId, navigate]);

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
      { label: "Status", value: statusMap[taskData?.status] || taskData?.status || "Not Started" },
      { label: "Priority", value: priorityLabel },
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
              <div className="text-sm text-[#303030] font-medium mt-0.5">Not Started</div>
            </div>
            <div>
              <div className="text-xs font-medium text-[#71717A] uppercase tracking-wider">Priority</div>
              <div className="text-sm text-[#303030] font-medium mt-0.5">Normal</div>
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
    if (taskData?.assignees) return taskData.assignees;
    return isNewTask ? [] : [{ id: 1, name: "Julia LoSchiavo", initials: "JL" }];
  });
  const [currentCollaborators, setCurrentCollaborators] = useState<any[]>(() => {
    if (taskData?.collaborators) return taskData.collaborators;
    return isNewTask ? [] : [
      { id: 2, name: "Chris Henry", initials: "CH" },
      { id: 3, name: "Connor Smith", initials: "CS" },
      { id: 8, name: "Sarah Martinez", initials: "SM" },
    ];
  });
  const [isEditTaskDetailsOpen, setIsEditTaskDetailsOpen] = useState(false);

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
    dueDate: string;
    updatedDate: string;
    age: string;
    priority: "High" | "Low" | "Normal";
    status: "In progress" | "Completed";
    billStatus: "Paid" | "Unpaid" | "Awaiting Invoice";
    billTotal: string;
    assignees: Assignee[];
    collaborators: Assignee[];
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
      priority: "High",
      status: "In progress",
      billStatus: "Paid",
      billTotal: "$420",
      assignees: [
        { id: 1, name: "Jerry Sanchez", initials: "JS" },
      ],
      collaborators: [
        { id: 5, name: "Sarah Wilson", initials: "SW" },
      ],
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
      priority: "Low",
      status: "In progress",
      billStatus: "Awaiting Invoice",
      billTotal: "No invoice",
      assignees: [
        { id: 3, name: "Jane Smith", initials: "JMS" },
      ],
      collaborators: [
        { id: 6, name: "Tom Davis", initials: "TD" },
        { id: 7, name: "Lisa Brown", initials: "LB" },
      ],
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
      priority: "Normal",
      status: "Completed",
      billStatus: "Unpaid",
      billTotal: "$95",
      assignees: [
        { id: 1, name: "Jerry Sanchez", initials: "JS" },
      ],
      collaborators: [],
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
      priority: "High",
      status: "Completed",
      billStatus: "Unpaid",
      billTotal: "$112",
      assignees: [
        { id: 2, name: "John Doe", initials: "JD" },
      ],
      collaborators: [
        { id: 5, name: "Sarah Wilson", initials: "SW" },
      ],
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
      priority: "High",
      status: "Completed",
      billStatus: "Unpaid",
      billTotal: "$93",
      assignees: [
        { id: 4, name: "Mike Johnson", initials: "MJ" },
      ],
      collaborators: [
        { id: 6, name: "Tom Davis", initials: "TD" },
      ],
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
      priority: "High",
      status: "Completed",
      billStatus: "Unpaid",
      billTotal: "$75",
      assignees: [
        { id: 1, name: "Jerry Sanchez", initials: "JS" },
      ],
      collaborators: [
        { id: 7, name: "Lisa Brown", initials: "LB" },
        { id: 5, name: "Sarah Wilson", initials: "SW" },
      ],
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
      priority: "High",
      status: "Completed",
      billStatus: "Unpaid",
      billTotal: "$101",
      assignees: [
        { id: 3, name: "Jane Smith", initials: "JMS" },
      ],
      collaborators: [],
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
      priority: "High",
      status: "Completed",
      billStatus: "Unpaid",
      billTotal: "$124",
      assignees: [
        { id: 2, name: "John Doe", initials: "JD" },
      ],
      collaborators: [
        { id: 6, name: "Tom Davis", initials: "TD" },
      ],
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
      priority: "High",
      status: "Completed",
      billStatus: "Unpaid",
      billTotal: "$67",
      assignees: [
        { id: 4, name: "Mike Johnson", initials: "MJ" },
      ],
      collaborators: [
        { id: 5, name: "Sarah Wilson", initials: "SW" },
        { id: 7, name: "Lisa Brown", initials: "LB" },
      ],
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
      priority: "High",
      status: "Completed",
      billStatus: "Unpaid",
      billTotal: "$118",
      assignees: [
        { id: 1, name: "Jerry Sanchez", initials: "JS" },
      ],
      collaborators: [
        { id: 6, name: "Tom Davis", initials: "TD" },
      ],
    },
  ];

  // Work orders and field team orders state
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(mockWorkOrders);

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
    uiDispatch({ type: "SET_ACTIVE_TAB", payload: newTab });
  };

  const handleWorkOrderSelect = (woId: number | null) => {
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

  return (
    <PageTemplate>
      {/* Header Section */}
      <PageHeader
        title={currentTitle || navigationState?.task?.title || navigationState?.taskData?.title || "Edgerton - Quote"}
        subtitle={
          <div className="flex items-center font-medium gap-3 overflow-wrap-anywhere word-wrap-anywhere">
            <div className="block text-base font-medium">To-Do</div>
            <svg
              width="4"
              height="4"
              viewBox="0 0 4 4"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="2" cy="2" r="2" fill="#717179" />
            </svg>
            <button
              onClick={() => uiDispatch({ type: "OPEN_MODAL", payload: "editTaskDetails" })}
              className="text-[#2463eb] text-base font-medium hover:underline transition-colors p-0 border-none bg-transparent cursor-pointer"
              title="Edit task details"
            >
              Edit
            </button>
          </div>
        }
        action={{
          label: "Update task",
          onClick: () => {
            uiDispatch({ type: "OPEN_MODAL", payload: "editTask" });
          },
        }}
        onBack={() => navigate("/all-tasks")}
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
            <TaskWorkOrders workOrders={workOrders} onWorkOrdersChange={setWorkOrders} />
          )}

          {/* Show summary content when summary tab is active */}
          {uiState.activeTab === "summary" && (
            <>
              {/* Left Column */}
              <div className="flex flex-col min-w-[240px] flex-1 gap-5">
                {/* Task Overview Card */}
              <TaskOverviewCard
                category={currentCategory || "Uncategorized"}
                description={currentDescription}
                status={currentStatus ? (currentStatus === "not_started" ? "Not Started" : currentStatus === "in_progress" ? "In Progress" : "Completed") : "Not Started"}
                priority={currentPriority ? currentPriority.charAt(0).toUpperCase() + currentPriority.slice(1) : "Normal"}
                dueDate={currentDueDate ? currentDueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "No due date"}
                createdBy={{
                  name: "Julia LoSchiavo",
                  property: currentProperty && currentProperty !== "Unassigned"
                    ? `${getPropertyDisplayLabel(currentProperty)}${currentUnit ? ` - ${getUnitDisplayLabel(currentUnit)}` : ""}`
                    : "Unassigned",
                }}
                createdDate={createdTimestamp}
                stats={[
                  { label: "TOTAL EXPENSE", value: "$0.00" },
                  { label: "WORK ORDERS", value: workOrders.length.toString() },
                  { label: "FTOs", value: fieldTeamOrders.length.toString() },
                ]}
                onEdit={() => uiDispatch({ type: "OPEN_MODAL", payload: "editTaskDetails" })}
              />

              {/* Notes Section */}
              <SectionCard padding="compact">
                <NotesTemplate
                  notes={notes}
                  onAdd={() => {
                    uiDispatch({ type: "SET_EDITING_NOTE_ID", payload: null });
                    uiDispatch({ type: "SET_VIEWING_NOTE", payload: null });
                    uiDispatch({ type: "OPEN_MODAL", payload: "addNote" });
                  }}
                  onEdit={(note) => {
                    uiDispatch({ type: "SET_VIEWING_NOTE", payload: note });
                    uiDispatch({ type: "OPEN_MODAL", payload: "viewNote" });
                  }}
                  onDelete={(noteId) =>
                    setNotes(notes.filter((n) => n.id !== noteId))
                  }
                />
              </SectionCard>

              {/* Files Section */}
              <SectionCard padding="compact">
                <FilesTemplate
                  files={files}
                  onAdd={() => {
                    uiDispatch({ type: "SET_EDITING_FILE_ID", payload: null });
                    uiDispatch({ type: "OPEN_MODAL", payload: "addFile" });
                  }}
                  onEdit={(file) => {
                    uiDispatch({ type: "SET_EDITING_FILE_ID", payload: file.id });
                    uiDispatch({ type: "OPEN_MODAL", payload: "addFile" });
                  }}
                  onDelete={(fileId) =>
                    setFiles(files.filter((f) => f.id !== fileId))
                  }
                  onView={(file) => console.log("View file", file)}
                />
              </SectionCard>

              {/* Linked Tasks Card */}
              <LinkedTasksCard
                linkedTasks={uiState.linkedTasks}
                onLinkTasks={() => uiDispatch({ type: "OPEN_MODAL", payload: "linkTask" })}
                onUnlinkTask={(taskId) =>
                  uiDispatch({
                    type: "REMOVE_LINKED_TASK",
                    payload: taskId,
                  })
                }
                onTaskClick={(linkedTaskId) => {
                  const tabId = `task-${linkedTaskId}`;
                  setSelectedTab(tabId);
                  setTabMetadata(tabId, {
                    label: `Task ${linkedTaskId}`,
                    route: `/tasks/${linkedTaskId}`,
                  });
                  navigate(`/tasks/${linkedTaskId}`);
                }}
              />

              {/* Updates Timeline */}
              <TaskUpdatesTimeline
                updates={updates}
                onAddUpdate={() => uiDispatch({ type: "OPEN_MODAL", payload: "editTask" })}
              />
            </div>

              {/* Right Sidebar */}
              <div className="flex flex-col min-w-[240px] w-[376px] gap-5">
                {/* Location Card - Only show when property is selected */}
                {currentProperty && currentProperty !== "Unassigned" && (
                  <TaskLocationCard
                    propertyImage="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/067809472377195b06444da037ab0e0c9542bf94?placeholderIfAbsent=true"
                    propertyName={`${getPropertyName(currentProperty)}${currentUnit ? ` - ${getUnitDisplayLabel(currentUnit)}` : ""}`}
                    propertyAddress={getPropertyAddress(currentProperty)}
                    mapImage="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/b2c68a80effe0893f444c93ea4b66f4db8c65123?placeholderIfAbsent=true"
                    propertyId={currentProperty}
                  />
                )}

                {/* Assignees Card */}
                {(currentAssignees.length > 0 || currentCollaborators.length > 0) && (
                  <PeopleCard
                    title="Assignees"
                    tabs={["Staff", "Vendors", "Field Team"]}
                    defaultTab={0}
                    headerActions={
                      <SectionActionTemplate
                        icon={<EditIcon width={14} height={14} />}
                        label="Edit"
                        onClick={() => setIsEditTaskModalOpen(true)}
                      />
                    }
                    subsections={[
                      {
                        label: "Assigned to",
                        mode: "rows",
                        people: currentAssignees.map((assignee) => ({
                          id: assignee.id,
                          name: assignee.name || assignee.label,
                          initials: assignee.initials,
                          roleLabel: "Property manager",
                          phone: "",
                          type: "staff",
                        })),
                        showRoleLabel: true,
                        showPhone: false,
                        showDivider: true,
                        tabIndex: [0],
                        type: "assignee",
                      },
                      {
                        label: "Collaborators",
                        mode: "rows",
                        people: currentCollaborators.map((collaborator) => ({
                          id: collaborator.id,
                          name: collaborator.name || collaborator.label,
                          initials: collaborator.initials,
                          roleLabel: "Property manager",
                          phone: "",
                          type: "staff",
                        })),
                        showRoleLabel: true,
                        showPhone: false,
                        showDivider: true,
                        tabIndex: [0],
                        type: "collaborator",
                      },
                    ]}
                  />
                )}

                {/* Contacts Card */}
                {(() => {
                  const rentalOwner = getRentalOwnerByProperty(taskData?.property);
                  return (
                    <PeopleCard
                      subsections={[
                        {
                          label: "Created by",
                          mode: "rows",
                          people: [
                            // Show current user for new tasks; existing task creator for demo tasks
                            ...(isNewTask ? [
                              {
                                id: 0,
                                name: "Julia LoSchiavo",
                                initials: "JL",
                                roleLabel: "Property manager",
                                phone: "",
                              },
                            ] : [
                              {
                                id: 4,
                                name: "Julia LoSchiavo",
                                initials: "JL",
                                roleLabel: "Property manager",
                                phone: "(203) 927-1280",
                              },
                            ]),
                          ],
                          showRoleLabel: true,
                          showPhone: true,
                          showDivider: true,
                        },
                        ...(rentalOwner ? [
                          {
                            label: "Rental owners",
                            mode: "rows",
                            people: [rentalOwner],
                            showRoleLabel: true,
                            showPhone: true,
                            showDivider: true,
                          },
                        ] : []),
                      ]}
                    />
                  );
                })()}
              </div>
            </>
          )}

          {/* Field Team Orders tab content */}
          {uiState.activeTab === "fieldteam" && <TaskFieldTeamOrders orders={fieldTeamOrders} onOrdersChange={setFieldTeamOrders} />}
        </div>
      </div>

      {/* View Note Modal */}
      <ModalTemplate
        open={uiState.modals.viewNote}
        onOpenChange={(open) => {
          if (!open) {
            uiDispatch({ type: "CLOSE_MODAL", payload: "viewNote" });
          }
        }}
        title="Note Details"
        size="sm"
        footer={
          <ModalButtons
            onCancel={() => {
              uiDispatch({ type: "CLOSE_MODAL", payload: "viewNote" });
            }}
            onConfirm={() => {
              if (uiState.viewingNote) {
                uiDispatch({
                  type: "SET_EDITING_NOTE_ID",
                  payload: uiState.viewingNote.id,
                });
                uiDispatch({ type: "CLOSE_MODAL", payload: "viewNote" });
                uiDispatch({ type: "OPEN_MODAL", payload: "addNote" });
              }
            }}
            cancelLabel="Close"
            confirmLabel="Edit"
          />
        }
      >
        {uiState.viewingNote ? (
          <FormLayout>
            <FormSection showDivider={false}>
              <div className="text-[#303030] whitespace-pre-line p-3 bg-gray-50 rounded-lg">
                {uiState.viewingNote.text}
              </div>
              <div className="text-sm text-[#71717A]">
                <span className="font-medium">Author:</span> {uiState.viewingNote.author}
              </div>
              <div className="text-sm text-[#71717A]">
                <span className="font-medium">Date:</span> {uiState.viewingNote.date}
              </div>
            </FormSection>
          </FormLayout>
        ) : null}
      </ModalTemplate>

      {/* Add/Edit Note Modal */}
      <AddNoteModal
        open={uiState.modals.addNote}
        onOpenChange={(open) => {
          if (!open) uiDispatch({ type: "CLOSE_MODAL", payload: "addNote" });
        }}
        onSubmit={(text) => {
          if (uiState.editingNoteId) {
            // Edit existing note
            setNotes(
              notes.map((n) =>
                n.id === uiState.editingNoteId
                  ? { ...n, text, date: new Date().toLocaleString() }
                  : n,
              ),
            );
          } else {
            // Add new note
            const maxId = notes.length > 0 ? Math.max(...notes.map((n) => n.id)) : 0;
            const newNote: Note = {
              id: maxId + 1,
              text,
              date: new Date().toLocaleString(),
              author: "Julia LoSchiavo",
            };
            setNotes([newNote, ...notes]);
          }
          uiDispatch({ type: "CLOSE_MODAL", payload: "addNote" });
        }}
        initialText={editingNote?.text || ""}
        isEditMode={!!uiState.editingNoteId}
        title={uiState.editingNoteId ? "Edit Note" : "Add Note"}
        submitLabel={uiState.editingNoteId ? "Update" : "Add"}
      />

      {/* Add/Edit File Modal */}
      <AddFileModal
        open={uiState.modals.addFile}
        onOpenChange={(open) => {
          if (!open) uiDispatch({ type: "CLOSE_MODAL", payload: "addFile" });
        }}
        onSubmit={(uploadedFiles, category, description) => {
          if (uiState.editingFileId) {
            // Get the old file name before updating
            const oldFile = files.find((f) => f.id === uiState.editingFileId);
            const oldFileName = oldFile?.name || "";
            const newFileName = uploadedFiles[0]?.name || oldFileName;

            // Update file info using helper for consistency
            syncFileNameAcrossStates(uiState.editingFileId, newFileName);

            // Also update category/description in files list
            setFiles((prevFiles) =>
              prevFiles.map((f) =>
                f.id === uiState.editingFileId
                  ? {
                      ...f,
                      category: category || f.category,
                      description,
                    }
                  : f,
              ),
            );
          } else {
            // Add new file - convert UploadedFile to File
            const maxId = files.length > 0 ? Math.max(...files.map((f) => f.id)) : 0;
            const newFiles: File[] = uploadedFiles.map((uf, idx) => ({
              id: maxId + idx + 1,
              name: uf.name,
              url: uf.url,
              uploadedAt: new Date().toLocaleString(),
              category,
              description,
            }));
            setFiles([...newFiles, ...files]);
          }
          uiDispatch({ type: "CLOSE_MODAL", payload: "addFile" });
        }}
        initialFiles={
          editingFile
            ? [
                {
                  id: editingFile.id.toString(),
                  name: editingFile.name,
                  size: 0,
                  type: editingFile.name.split('.').pop()?.toLowerCase() || "pdf",
                  url: editingFile.url,
                },
              ]
            : []
        }
        initialCategory={editingFile?.category || ""}
        initialDescription={editingFile?.description || ""}
        isEditMode={!!uiState.editingFileId}
        title={uiState.editingFileId ? "Edit File" : "Add File"}
        submitLabel={uiState.editingFileId ? "Update" : "Add"}
      />

      {/* PDF Viewer Modal for Attachments */}
      {uiState.viewingAttachment && (
        <PdfViewerModal
          open={uiState.modals.pdfViewer}
          onOpenChange={(open) => {
            if (!open) {
              uiDispatch({ type: "CLOSE_MODAL", payload: "pdfViewer" });
            }
          }}
          title={uiState.viewingAttachment.name}
          url={uiState.viewingAttachment.url}
          onRenameClick={handleStartRenamingAttachment}
          isRenaming={uiState.isRenamingAttachment}
          renamingFileName={uiState.renamingAttachmentName}
          onRenamingFileNameChange={(name) =>
            uiDispatch({ type: "SET_RENAMING_ATTACHMENT_NAME", payload: name })
          }
          onSaveFileName={handleSaveAttachmentFileName}
          onCancelRenaming={handleCancelRenamingAttachment}
        />
      )}

      {/* Link Task Modal */}
      <LinkTaskModal
        open={uiState.modals.linkTask}
        onOpenChange={(open) => {
          if (!open) uiDispatch({ type: "CLOSE_MODAL", payload: "linkTask" });
        }}
        availableTasks={availableTasksForLinking}
        onSubmit={(linkedTask) => {
          // Check if task is already linked
          if (!uiState.linkedTasks.some((t) => t.id === linkedTask.id)) {
            uiDispatch({ type: "ADD_LINKED_TASK", payload: linkedTask });
          } else {
            uiDispatch({ type: "CLOSE_MODAL", payload: "linkTask" });
          }
        }}
      />

      {/* Edit Task Details Modal */}
      <EditTaskDetailsModal
        open={uiState.modals.editTaskDetails}
        onOpenChange={(open) => {
          if (!open) uiDispatch({ type: "CLOSE_MODAL", payload: "editTaskDetails" });
        }}
        initialData={{
          title: currentTitle,
          description: currentDescription,
          property: currentProperty,
          unit: currentUnit,
          category: currentCategory,
        }}
        onSubmit={(data) => {
          setCurrentTitle(data.title);
          setCurrentDescription(data.description);
          setCurrentProperty(data.property);
          setCurrentUnit(data.unit);
          setCurrentCategory(data.category);
          uiDispatch({ type: "CLOSE_MODAL", payload: "editTaskDetails" });
        }}
      />

      {/* Create/Edit Task Modal */}
      <CreateTaskModal
        open={uiState.modals.editTask}
        onOpenChange={(open) => {
          if (!open) uiDispatch({ type: "CLOSE_MODAL", payload: "editTask" });
        }}
        variant="withMessageAndAttachments"
        editData={modalEditData}
        onTaskCreated={(taskData: any) => {
          // Update all task fields
          if (taskData.property) {
            setCurrentProperty(taskData.property);
          }
          if (taskData.unit) {
            setCurrentUnit(taskData.unit);
          }
          if (taskData.description) {
            setCurrentDescription(taskData.description);
          }
          if (taskData.title) {
            setCurrentTitle(taskData.title);
          }
          if (taskData.category) {
            setCurrentCategory(taskData.category);
          }
          if (taskData.status !== undefined) {
            setCurrentStatus(taskData.status);
          }
          if (taskData.priority !== undefined) {
            setCurrentPriority(taskData.priority);
          }
          if (taskData.dueDate !== undefined) {
            setCurrentDueDate(taskData.dueDate);
          }
          if (taskData.assignees !== undefined) {
            setCurrentAssignees(taskData.assignees);
          }
          if (taskData.collaborators !== undefined) {
            setCurrentCollaborators(taskData.collaborators);
          }

          // Check if this is a new task creation (compact variant) or an update
          const isTaskUpdate = (taskData as any).message !== undefined;

          if (!isTaskUpdate) {
            // This is a new task creation - create initial update with all fields
            const statusMap: { [key: string]: string } = {
              "not_started": "Not Started",
              "in_progress": "In Progress",
              "completed": "Completed",
            };

            const priorityLabel = (taskData as any).priority.charAt(0).toUpperCase() + (taskData as any).priority.slice(1);
            const dueDate = (taskData as any).dueDate ? new Date(taskData.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "No due date";
            const assigneeNames = (taskData as any).assignees?.map((a: any) => a.label || a.name).join(", ") || "Unassigned";
            const collaboratorNames = (taskData as any).collaborators?.map((c: any) => c.label || c.name).join(", ") || "None";

            // Build fields array for initial creation
            const creationFields: any[] = [];

            if (taskData.status) {
              creationFields.push(
                <div key="status">
                  <div className="text-xs font-medium text-[#71717A] uppercase tracking-wider">Status</div>
                  <div className="text-sm text-[#303030] font-medium mt-0.5">{statusMap[(taskData as any).status] || (taskData as any).status}</div>
                </div>
              );
            }

            if (taskData.priority) {
              creationFields.push(
                <div key="priority">
                  <div className="text-xs font-medium text-[#71717A] uppercase tracking-wider">Priority</div>
                  <div className="text-sm text-[#303030] font-medium mt-0.5">{priorityLabel}</div>
                </div>
              );
            }

            if (taskData.dueDate) {
              creationFields.push(
                <div key="dueDate">
                  <div className="text-xs font-medium text-[#71717A] uppercase tracking-wider">Due Date</div>
                  <div className="text-sm text-[#303030] font-medium mt-0.5">{dueDate}</div>
                </div>
              );
            }

            if (taskData.assignees && taskData.assignees.length > 0) {
              creationFields.push(
                <div key="assignees">
                  <div className="text-xs font-medium text-[#71717A] uppercase tracking-wider">Assignees</div>
                  <div className="mt-0.5">
                    <PersonAvatars people={taskData.assignees} type="assignee" />
                  </div>
                </div>
              );
            }

            if (taskData.collaborators && taskData.collaborators.length > 0) {
              creationFields.push(
                <div key="collaborators">
                  <div className="text-xs font-medium text-[#71717A] uppercase tracking-wider">Collaborators</div>
                  <div className="mt-0.5">
                    <PersonAvatars people={taskData.collaborators} type="collaborator" />
                  </div>
                </div>
              );
            }

            // Add attachments from initial creation
            if (taskData.files && taskData.files.length > 0) {
              setFiles((prevFiles) => {
                const newFiles: File[] = taskData.files.map((f: any, idx: number) => ({
                  id: String(f.id || `${f.name}-${idx}`),
                  name: f.name,
                  url: f.url,
                  uploadedAt: new Date().toLocaleString(),
                  category: "",
                  description: "",
                }));
                return [...newFiles, ...prevFiles];
              });
            }

            const initialUpdate = {
              id: Math.max(...updates.map(u => typeof u.id === 'number' ? u.id : 0), 0) + 1,
              author: "Julia LoSchiavo",
              authorType: "assignee",
              action: "created this task",
              timestamp: new Date().toLocaleString(),
              ...(creationFields.length > 0 && {
                fieldsDisplay: (
                  <div className={`grid gap-6 mt-3 ${creationFields.length === 1 ? 'grid-cols-1' : creationFields.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                    {creationFields}
                  </div>
                ),
              }),
              ...(taskData.description && {
                details: <div className="text-sm text-[#303030]">{taskData.description}</div>,
              }),
              ...(taskData.files && taskData.files.length > 0 && {
                attachments: taskData.files.map((f: any, idx: number) => getAttachmentData(f, idx)),
                onAttachmentClick: (file: any) => {
                  setViewingAttachment({ id: file.id, name: file.name, url: file.url });
                  setIsPdfViewerOpen(true);
                  setIsRenamingAttachment(false);
                  setRenamingAttachmentName("");
                },
              }),
              icon: <FlagIcon width={16} height={16} />,
              isInitialCreation: true,
            };

            setUpdates([initialUpdate, ...updates]);
            uiDispatch({ type: "CLOSE_MODAL", payload: "editTask" });
            return;
          }
          // Create a new update from the task data
          const details: React.ReactNode[] = [];

          // Determine the primary update type and icon
          let updateIcon = <EditIcon width={16} height={16} />;

          if ((taskData as any).messageBody && (taskData as any).files?.length > 0) {
            // Message with attachments - use paperclip icon
            updateIcon = <PaperclipIcon width={16} height={16} />;
          } else if ((taskData as any).files && (taskData as any).files.length > 0) {
            // Only attachments - use paperclip icon
            updateIcon = <PaperclipIcon width={16} height={16} />;
          } else if ((taskData as any).messageBody) {
            // Only message - use note icon
            updateIcon = <NoteIcon width={16} height={16} />;
          } else {
            // Field updates - use edit icon
            updateIcon = <EditIcon width={16} height={16} />;
          }

          // Build fields display for changed fields (only if changedFields are provided)
          const statusMap: { [key: string]: string } = {
            "not_started": "Not Started",
            "in_progress": "In Progress",
            "completed": "Completed",
          };

          const changedFieldsInfo = (taskData as any).changedFields || [];
          const displayFields: Array<{ label: string; value: string }> = [];

          // Build display for changed fields
          changedFieldsInfo.forEach((fieldName: string) => {
            switch (fieldName) {
              case "status":
                displayFields.push({
                  label: "Status",
                  value: statusMap[taskData.status] || taskData.status,
                });
                break;
              case "priority":
                displayFields.push({
                  label: "Priority",
                  value: taskData.priority.charAt(0).toUpperCase() + taskData.priority.slice(1),
                });
                break;
              case "dueDate":
                const dueDateStr = taskData.dueDate instanceof Date
                  ? taskData.dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                  : (taskData.dueDate ? taskData.dueDate : "No due date");
                displayFields.push({
                  label: "Due Date",
                  value: dueDateStr,
                });
                break;
              case "assignees":
                displayFields.push({
                  label: "Assignees",
                  value: <PersonAvatars people={taskData.assignees || []} type="assignee" fallback="Unassigned" />,
                } as any);
                break;
              case "collaborators":
                displayFields.push({
                  label: "Collaborators",
                  value: <PersonAvatars people={taskData.collaborators || []} type="collaborator" />,
                } as any);
                break;
            }
          });

          // Add fields display if there are changed fields
          if (displayFields.length > 0) {
            // Determine grid columns based on number of fields (responsive)
            const gridColsClass = displayFields.length === 1 ? "grid-cols-1" : displayFields.length <= 2 ? "grid-cols-2" : "grid-cols-3";

            details.push(
              <div key="fields">
                <div className={`grid ${gridColsClass} gap-6`}>
                  {displayFields.map((field, idx) => (
                    <div key={idx}>
                      <div className="text-xs font-medium text-[#71717A] uppercase tracking-wider">{field.label}</div>
                      <div className="text-sm text-[#303030] font-medium mt-0.5">{field.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          }

          // Add message body if provided
          if ((taskData as any).messageBody) {
            details.push(
              <div key="message">
                <div className="text-sm text-[#303030]">{(taskData as any).messageBody}</div>
              </div>
            );
          }

          // Create attachments array with preview support
          const attachments = Array.isArray((taskData as any).files)
            ? (taskData as any).files
                .map((file: any) => getAttachmentData(file))
                .filter((file: any) => typeof file?.url === "string" && file.url)
            : undefined;

          // Add new files and merge renamed files back into the main files state
          if (Array.isArray((taskData as any).files) && (taskData as any).files.length > 0) {
            const renamedFilesFromModal = (taskData as any).files;

            // Sync any renames that happened in the modal to all existing updates
            renamedFilesFromModal.forEach((rf: any) => {
              const existingFile = files.find(f => String(f.id) === String(rf.id));
              if (existingFile && existingFile.name !== rf.name) {
                syncFileNameAcrossStates(rf.id, rf.name);
              }
            });

            setFiles((prevFiles) => {
              const renamedFiles = new Map((taskData as any).files.map((f: any) => [String(f.id), f]));
              const existingIds = new Set(prevFiles.map((f) => String(f.id)));

              // Update existing files with renamed versions
              const updatedFiles = prevFiles.map((f) => {
                const renamedFile = renamedFiles.get(String(f.id));
                if (renamedFile && renamedFile.name !== f.name) {
                  return { ...f, name: renamedFile.name };
                }
                return f;
              });

              // Add new files that don't exist yet
              const newFiles = (taskData as any).files
                .filter((f: any) => !existingIds.has(String(f.id)))
                .map((f: any, idx: number) => ({
                  id: String(f.id || `${f.name}-${idx}`),
                  name: f.name,
                  url: f.url,
                  uploadedAt: new Date().toLocaleString(),
                  category: "",
                  description: "",
                }));

              return [...newFiles, ...updatedFiles];
            });
          }

          // Determine update message based on what changed
          let updateAction = "updated the task";
          const hasMessage = !!(taskData as any).messageBody;
          const hasFiles = Array.isArray((taskData as any).files) && (taskData as any).files.length > 0;
          const hasFieldChanges = Array.isArray((taskData as any).changedFields) && (taskData as any).changedFields.length > 0;

          if (hasFiles && !hasMessage && !hasFieldChanges) {
            updateAction = "uploaded a file";
          } else if (hasMessage && !hasFiles && !hasFieldChanges) {
            updateAction = "updated a message";
          }

          const newUpdate = {
            id: Math.max(...updates.map(u => typeof u.id === 'number' ? u.id : 0), 0) + 1,
            author: "Julia LoSchiavo",
            authorType: "assignee",
            action: updateAction,
            timestamp: new Date().toLocaleString(),
            details: details.length > 0 ? <div className="flex flex-col gap-5">{details}</div> : undefined,
            icon: updateIcon,
            attachments,
            onAttachmentClick: (file: any) => {
              setViewingAttachment({ id: String(file.id), name: file.name, url: file.url });
              setIsPdfViewerOpen(true);
              setIsRenamingAttachment(false);
              setRenamingAttachmentName("");
            },
          };
          setUpdates([newUpdate, ...updates]);
          uiDispatch({ type: "CLOSE_MODAL", payload: "editTask" });
        }}
      />

      {/* Edit Task Details Modal */}
      <EditTaskDetailsModal
        open={isEditTaskDetailsOpen}
        onOpenChange={setIsEditTaskDetailsOpen}
        initialData={{
          title: currentTitle,
          description: currentDescription,
          property: currentProperty,
          unit: currentUnit,
          category: currentCategory,
        }}
        onSubmit={(data: EditTaskDetailsData) => {
          setCurrentTitle(data.title);
          setCurrentDescription(data.description || "");
          setCurrentProperty(data.property);
          setCurrentUnit(data.unit);
          setCurrentCategory(data.category);
          setIsEditTaskDetailsOpen(false);
        }}
      />
    </PageTemplate>
  );
}
