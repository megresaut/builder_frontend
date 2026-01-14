import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { usePageState } from "@/hooks/usePageState";
import { useSortingTable } from "@/hooks/useSortingTable";
import { useColumnManagement } from "@/hooks/useColumnManagement";
import ColumnFilterModal from "@/components/ColumnFilterModal";
import GlobalTable from "@/components/GlobalTable";
import CreateTaskModal from "@/components/CreateTaskModal";
import CreateRecurringTaskModal from "@/components/CreateRecurringTaskModal";
import CreateWorkOrderModalV2 from "@/components/CreateWorkOrderModalV2";
import CreateFTOModal from "@/components/CreateFTOModal";
import TableToggle from "@/components/TableToggle";
import SubPageHeaderV2 from "@/components/SubPageHeaderV2";
import BlueButton from "@/components/BlueButton";
import { StatusBadge } from "@/components/StatusBadge";
import TaskStatusBadge from "@/components/TaskStatusBadge";
import TaskPriorityBadge from "@/components/TaskPriorityBadge";
import PersonAvatars from "@/components/PersonAvatars";
import type { Note, File } from "@/components/templates";
import {
  EditIcon,
  DeleteIcon,
  CalendarIcon,
  PlusIcon,
  DotsIcon,
} from "@/components/icons";

interface Assignee {
  id: number;
  name: string;
  initials: string;
  email?: string;
  phone?: string;
  title?: string;
}

interface Task {
  id: number;
  title: string;
  status: string;
  due: string;
  updated: string;
  priority: string;
  assignees: Assignee[];
  collaborators?: Assignee[];
  unit?: string;
}

interface RecurringTask {
  id: number;
  task: string;
  nextDate: string;
  priority: "low" | "normal" | "high";
  category: string;
  status: "active" | "inactive";
  assignees: Array<{ id: number; name: string; initials: string }>;
}

interface WorkOrder {
  id: number;
  task: string;
  taskId: number;
  dueDate: string;
  updatedDate: string;
  age: string;
  priority: "low" | "normal" | "high";
  status: "In progress" | "Completed";
  billStatus: "Paid" | "Unpaid" | "Awaiting Invoice";
  billTotal: string;
  assignees: Array<{ id: number; name: string; initials: string }>;
}

interface FieldTeamOrder {
  id: number;
  taskId: number;
  property: string;
  description: string;
  dueDate: string;
  priority: "low" | "normal" | "high";
  fieldTeam: Array<{ initials: string; color: string; name: string }>;
  status: "dispatched" | "approved" | "pending-approval";
  timesheetStatus:
    | "awaiting-submission"
    | "submitted"
    | "rejected"
    | "approved";
  amount: number;
  unit?: string;
  fieldTeamAssignee?: string;
  task?: string;
}

// Mock data for property-specific tables
const mockPropertyTasks: Task[] = [
  {
    id: 1,
    status: "Completed",
    title: "Doors Need To Be Repaired",
    due: "Oct 2, 2025",
    updated: "Oct 2, 2025",
    priority: "Normal",
    assignees: [{ id: 1, name: "John Doe", initials: "JD", email: "john.doe@example.com", phone: "(555) 123-4567", title: "Project Manager" }],
    collaborators: [{ id: 4, name: "Sarah Wilson", initials: "SW", email: "sarah.wilson@example.com", phone: "(555) 234-5678", title: "Inspector" }],
  },
  {
    id: 2,
    status: "In Progress",
    title: "Windows Need Cleaning",
    due: "Sep 25, 2025",
    updated: "Sep 25, 2025",
    priority: "Low",
    assignees: [{ id: 2, name: "Jane Smith", initials: "JS", email: "jane.smith@example.com", phone: "(555) 345-6789", title: "Maintenance Tech" }],
    collaborators: [],
  },
  {
    id: 3,
    status: "Completed",
    title: "Roof Inspection",
    due: "Sep 12, 2025",
    updated: "Sep 12, 2025",
    priority: "High",
    assignees: [{ id: 3, name: "Mike Johnson", initials: "MJ", email: "mike.johnson@example.com", phone: "(555) 456-7890", title: "Senior Technician" }],
    collaborators: [{ id: 5, name: "Tom Brown", initials: "TB", email: "tom.brown@example.com", phone: "(555) 567-8901", title: "Safety Officer" }, { id: 6, name: "Lisa Davis", initials: "LD", email: "lisa.davis@example.com", phone: "(555) 678-9012", title: "QA Inspector" }],
  },
];

const mockPropertyRecurringTasks: RecurringTask[] = [
  {
    id: 1,
    task: "Monthly Inspection",
    nextDate: "Oct 2, 2025",
    priority: "high",
    category: "Maintenance",
    status: "active",
    assignees: [{ id: 1, name: "Jerry Sanchez", initials: "JS" }],
  },
  {
    id: 2,
    task: "Quarterly Deep Clean",
    nextDate: "Sep 29, 2025",
    priority: "normal",
    category: "Cleaning",
    status: "active",
    assignees: [{ id: 2, name: "John Doe", initials: "JD" }],
  },
  {
    id: 3,
    task: "HVAC Filter Replacement",
    nextDate: "Sep 10, 2025",
    priority: "normal",
    category: "HVAC",
    status: "active",
    assignees: [{ id: 3, name: "Jane Smith", initials: "JS" }],
  },
];

const mockPropertyWorkOrders: WorkOrder[] = [
  {
    id: 1,
    task: "Doors need to be repaired",
    taskId: 1,
    dueDate: "Oct 2, 2025",
    updatedDate: "Oct 2, 2025",
    age: "6 days 5 hours",
    priority: "high",
    status: "In progress",
    billStatus: "Paid",
    billTotal: "$420",
    assignees: [{ id: 1, name: "Jerry Sanchez", initials: "JS", email: "jerry.sanchez@example.com", phone: "(555) 789-0123", title: "Lead Technician" }],
  },
  {
    id: 2,
    task: "Windows need to be sealed",
    taskId: 2,
    dueDate: "Sep 29, 2025",
    updatedDate: "Sep 29, 2025",
    age: "6 days 5 hours",
    priority: "low",
    status: "In progress",
    billStatus: "Awaiting Invoice",
    billTotal: "No invoice",
    assignees: [{ id: 2, name: "Jane Smith", initials: "JS", email: "jane.smith@example.com", phone: "(555) 890-1234", title: "Maintenance Tech" }],
  },
];

const mockPropertyFieldTeamOrders: FieldTeamOrder[] = [
  {
    id: 1,
    taskId: 6,
    property: "22 Indian Chase Dr",
    description: "Emergency Water Damage",
    dueDate: "Oct 2, 2025",
    priority: "high",
    fieldTeam: [
      { initials: "CH", color: "bg-blue-500", name: "Christopher Harris", email: "chris.harris@example.com", phone: "(555) 901-2345", title: "Field Lead" },
    ],
    status: "dispatched",
    timesheetStatus: "awaiting-submission",
    amount: 420,
  },
  {
    id: 2,
    taskId: 6,
    property: "22 Indian Chase Dr",
    description: "HVAC Installation",
    dueDate: "Sep 29, 2025",
    priority: "normal",
    fieldTeam: [
      { initials: "CS", color: "bg-green-500", name: "Cassandra Smith", email: "cassandra.smith@example.com", phone: "(555) 012-3456", title: "HVAC Specialist" },
    ],
    status: "approved",
    timesheetStatus: "approved",
    amount: 2500,
  },
];

interface MaintenanceProps {
  propertyAddress: string;
  propertyType: string;
  propertyUnits: number;
}

export const Maintenance: React.FC<MaintenanceProps> = ({
  propertyAddress,
  propertyType,
  propertyUnits,
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = usePageState<
    "tasks" | "recurring" | "workorders" | "fieldteam"
  >("activeTab", "recurring");

  // State for tasks data
  const [tasksList, setTasksList] = useState<Task[]>(mockPropertyTasks);
  const [recurringTasksList, setRecurringTasksList] = useState<RecurringTask[]>(
    mockPropertyRecurringTasks,
  );
  const [workOrdersList, setWorkOrdersList] = useState<WorkOrder[]>(
    mockPropertyWorkOrders,
  );
  const [fieldTeamOrdersList, setFieldTeamOrdersList] = useState<FieldTeamOrder[]>(
    mockPropertyFieldTeamOrders,
  );

  // Column management hooks for each table
  const tasksColumnManagement = useColumnManagement([
    "priority",
    "status",
    "title",
    "due",
    "updated",
    "age",
    "assignees",
    "collaborators",
  ]);
  const recurringColumnManagement = useColumnManagement([
    "priority",
    "task",
    "nextDate",
    "category",
    "assignees",
    "status",
  ]);
  const workordersColumnManagement = useColumnManagement([
    "priority",
    "status",
    "task",
    "dueDate",
    "updated",
    "age",
    "assignees",
    "billStatus",
    "billTotal",
  ]);
  const fieldteamColumnManagement = useColumnManagement([
    "priority",
    "description",
    "dueDate",
    "fieldTeam",
    "status",
    "timesheetStatus",
    "amount",
  ]);

  // Sorting hooks for each table
  const {
    handleSortClick: handleTasksSortClick,
    getSortIndicator: getTasksSortIndicator,
    getSortedData: getTasksSortedData,
  } = useSortingTable(tasksList);
  const {
    handleSortClick: handleRecurringSortClick,
    getSortIndicator: getRecurringSortIndicator,
    getSortedData: getRecurringSortedData,
  } = useSortingTable(recurringTasksList);
  const {
    handleSortClick: handleWorkOrdersSortClick,
    getSortIndicator: getWorkOrdersSortIndicator,
    getSortedData: getWorkOrdersSortedData,
  } = useSortingTable(workOrdersList);
  const {
    handleSortClick: handleFieldTeamSortClick,
    getSortIndicator: getFieldTeamSortIndicator,
    getSortedData: getFieldTeamSortedData,
  } = useSortingTable(fieldTeamOrdersList);

  // Pagination and UI state for each table
  const [tasksPage, setTasksPage] = usePageState<number>("tasksPage", 1);
  const [tasksItemsPerPage, setTasksItemsPerPage] = usePageState<number>(
    "tasksItemsPerPage",
    10,
  );
  const [tasksShowDropdown, setTasksShowDropdown] = useState(false);
  const [tasksOpenMenuId, setTasksOpenMenuId] = usePageState<number | null>(
    "tasksOpenMenuId",
    null,
  );

  const [recurringPage, setRecurringPage] = usePageState<number>(
    "recurringPage",
    1,
  );
  const [recurringItemsPerPage, setRecurringItemsPerPage] =
    usePageState<number>("recurringItemsPerPage", 10);
  const [recurringShowDropdown, setRecurringShowDropdown] = useState(false);
  const [recurringOpenMenuId, setRecurringOpenMenuId] =
    usePageState<number | null>("recurringOpenMenuId", null);

  const [workordersPage, setWorkordersPage] = usePageState<number>(
    "workordersPage",
    1,
  );
  const [workordersItemsPerPage, setWorkordersItemsPerPage] =
    usePageState<number>("workordersItemsPerPage", 10);
  const [workordersShowDropdown, setWorkordersShowDropdown] = useState(false);
  const [workordersOpenMenuId, setWorkordersOpenMenuId] =
    usePageState<number | null>("workordersOpenMenuId", null);

  const [fieldteamPage, setFieldteamPage] = usePageState<number>(
    "fieldteamPage",
    1,
  );
  const [fieldteamItemsPerPage, setFieldteamItemsPerPage] =
    usePageState<number>("fieldteamItemsPerPage", 10);
  const [fieldteamShowDropdown, setFieldteamShowDropdown] = useState(false);
  const [fieldteamOpenMenuId, setFieldteamOpenMenuId] =
    usePageState<number | null>("fieldteamOpenMenuId", null);

  // Modal states
  const [showCreateTaskModal, setShowCreateTaskModal] = usePageState<boolean>(
    "showCreateTaskModal",
    false,
  );
  const [showCreateRecurringTaskModal, setShowCreateRecurringTaskModal] =
    usePageState<boolean>("showCreateRecurringTaskModal", false);
  const [editingRecurringTask, setEditingRecurringTask] =
    usePageState<RecurringTask | null>("editingRecurringTask", null);
  const [showCreateWorkOrderModal, setShowCreateWorkOrderModal] =
    usePageState<boolean>("showCreateWorkOrderModal", false);
  const [showCreateFTOModal, setShowCreateFTOModal] = usePageState<boolean>(
    "showCreateFTOModal",
    false,
  );
  const [editFTOData, setEditFTOData] = usePageState<{
    dueDate: string;
    priority: string;
    ftoStatus?: string;
  } | null>("editFTOData", null);

  const tasksSortedData = getTasksSortedData();
  const tasksTotalPages = Math.max(
    1,
    Math.ceil(tasksSortedData.length / tasksItemsPerPage),
  );
  const paginatedTasks = tasksSortedData.slice(
    (tasksPage - 1) * tasksItemsPerPage,
    tasksPage * tasksItemsPerPage,
  );

  const recurringSortedData = getRecurringSortedData();
  const recurringTotalPages = Math.max(
    1,
    Math.ceil(recurringSortedData.length / recurringItemsPerPage),
  );
  const paginatedRecurringTasks = recurringSortedData.slice(
    (recurringPage - 1) * recurringItemsPerPage,
    recurringPage * recurringItemsPerPage,
  );

  const workordersSortedData = getWorkOrdersSortedData();
  const workordersTotalPages = Math.max(
    1,
    Math.ceil(workordersSortedData.length / workordersItemsPerPage),
  );
  const paginatedWorkOrders = workordersSortedData.slice(
    (workordersPage - 1) * workordersItemsPerPage,
    workordersPage * workordersItemsPerPage,
  );

  const fieldteamSortedData = getFieldTeamSortedData();
  const fieldteamTotalPages = Math.max(
    1,
    Math.ceil(fieldteamSortedData.length / fieldteamItemsPerPage),
  );
  const paginatedFieldTeamOrders = fieldteamSortedData.slice(
    (fieldteamPage - 1) * fieldteamItemsPerPage,
    fieldteamPage * fieldteamItemsPerPage,
  );

  useEffect(() => {
    if (tasksPage > tasksTotalPages) setTasksPage(tasksTotalPages);
    if (tasksPage < 1) setTasksPage(1);
  }, [tasksPage, tasksTotalPages, setTasksPage]);

  useEffect(() => {
    if (recurringPage > recurringTotalPages) setRecurringPage(recurringTotalPages);
    if (recurringPage < 1) setRecurringPage(1);
  }, [recurringPage, recurringTotalPages, setRecurringPage]);

  useEffect(() => {
    if (workordersPage > workordersTotalPages)
      setWorkordersPage(workordersTotalPages);
    if (workordersPage < 1) setWorkordersPage(1);
  }, [workordersPage, workordersTotalPages, setWorkordersPage]);

  useEffect(() => {
    if (fieldteamPage > fieldteamTotalPages) setFieldteamPage(fieldteamTotalPages);
    if (fieldteamPage < 1) setFieldteamPage(1);
  }, [fieldteamPage, fieldteamTotalPages, setFieldteamPage]);

  const tabs = [
    { id: "tasks" as const, label: "Tasks" },
    { id: "recurring" as const, label: "Recurring Tasks" },
    { id: "workorders" as const, label: "Work Orders" },
    { id: "fieldteam" as const, label: "Field Team Orders" },
  ];

  const tasksColumnConfig: Record<
    string,
    { label: string; icon: React.ReactNode }
  > = {
    priority: {
      label: "Priority",
      icon: (
        <img
          loading="lazy"
          src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/19c17d4129204654414d25bb07907dbe45b6100b?placeholderIfAbsent=true"
          className="w-3.5 h-3.5"
          alt=""
        />
      ),
    },
    status: {
      label: "Status",
      icon: (
        <img
          loading="lazy"
          src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/137343a4a83566b73ded0282be168e468fbd729c?placeholderIfAbsent=true"
          style={{ width: "16px", height: "16px" }}
          alt=""
        />
      ),
    },
    title: {
      label: "Task",
      icon: (
        <img
          loading="lazy"
          src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/7f481edecd98b8475a23ac762feb99280a60a52a?placeholderIfAbsent=true"
          style={{ width: "16px", height: "16px" }}
          alt=""
        />
      ),
    },
    due: {
      label: "Due",
      icon: <CalendarIcon width={16} height={16} />,
    },
    updated: {
      label: "Updated",
      icon: <CalendarIcon width={16} height={16} />,
    },
    age: {
      label: "Age",
      icon: (
        <img
          loading="lazy"
          src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/2097f26d1f65ef5b2149203767c6f5d5b91df5d0?placeholderIfAbsent=true"
          style={{ width: "16px", height: "16px" }}
          alt=""
        />
      ),
    },
    assignees: {
      label: "Assignees",
      icon: (
        <img
          loading="lazy"
          src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/3f6ece5f831bf0341b60fe742dd77e3f127dbd09?placeholderIfAbsent=true"
          style={{ width: "16px", height: "16px" }}
          alt=""
        />
      ),
    },
    collaborators: {
      label: "Collaborators",
      icon: (
        <img
          loading="lazy"
          src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/3f6ece5f831bf0341b60fe742dd77e3f127dbd09?placeholderIfAbsent=true"
          style={{ width: "16px", height: "16px" }}
          alt=""
        />
      ),
    },
  };

  const recurringTasksColumnConfig: Record<
    string,
    { label: string; icon: React.ReactNode }
  > = {
    priority: {
      label: "Priority",
      icon: (
        <img
          loading="lazy"
          src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/19c17d4129204654414d25bb07907dbe45b6100b?placeholderIfAbsent=true"
          className="w-3.5 h-3.5"
          alt=""
        />
      ),
    },
    task: {
      label: "Task",
      icon: (
        <img
          loading="lazy"
          src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/7f481edecd98b8475a23ac762feb99280a60a52a?placeholderIfAbsent=true"
          style={{ width: "16px", height: "16px" }}
          alt=""
        />
      ),
    },
    nextDate: {
      label: "Next Date",
      icon: <CalendarIcon width={16} height={16} />,
    },
    category: {
      label: "Category",
      icon: (
        <img
          loading="lazy"
          src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/9379e9379423e4e59c741289c9317aae17fbcab2?placeholderIfAbsent=true"
          style={{ width: "16px", height: "16px" }}
          alt=""
        />
      ),
    },
    assignees: {
      label: "Assignees",
      icon: (
        <img
          loading="lazy"
          src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/3f6ece5f831bf0341b60fe742dd77e3f127dbd09?placeholderIfAbsent=true"
          style={{ width: "16px", height: "16px" }}
          alt=""
        />
      ),
    },
    status: {
      label: "Status",
      icon: (
        <img
          loading="lazy"
          src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/137343a4a83566b73ded0282be168e468fbd729c?placeholderIfAbsent=true"
          style={{ width: "16px", height: "16px" }}
          alt=""
        />
      ),
    },
  };

  const workOrdersColumnConfig: Record<
    string,
    { label: string; icon: React.ReactNode }
  > = {
    priority: {
      label: "Priority",
      icon: (
        <img
          loading="lazy"
          src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/19c17d4129204654414d25bb07907dbe45b6100b?placeholderIfAbsent=true"
          className="w-3.5 h-3.5"
          alt=""
        />
      ),
    },
    status: {
      label: "Status",
      icon: (
        <img
          loading="lazy"
          src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/137343a4a83566b73ded0282be168e468fbd729c?placeholderIfAbsent=true"
          style={{ width: "16px", height: "16px" }}
          alt=""
        />
      ),
    },
    task: {
      label: "Task",
      icon: (
        <img
          loading="lazy"
          src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/7f481edecd98b8475a23ac762feb99280a60a52a?placeholderIfAbsent=true"
          style={{ width: "16px", height: "16px" }}
          alt=""
        />
      ),
    },
    dueDate: {
      label: "Due Date",
      icon: <CalendarIcon width={16} height={16} />,
    },
    updated: {
      label: "Updated",
      icon: <CalendarIcon width={16} height={16} />,
    },
    age: {
      label: "Age",
      icon: (
        <img
          loading="lazy"
          src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/2097f26d1f65ef5b2149203767c6f5d5b91df5d0?placeholderIfAbsent=true"
          style={{ width: "16px", height: "16px" }}
          alt=""
        />
      ),
    },
    assignees: {
      label: "Assignees",
      icon: (
        <img
          loading="lazy"
          src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/3f6ece5f831bf0341b60fe742dd77e3f127dbd09?placeholderIfAbsent=true"
          style={{ width: "16px", height: "16px" }}
          alt=""
        />
      ),
    },
    billStatus: {
      label: "Bill Status",
      icon: (
        <img
          loading="lazy"
          src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/137343a4a83566b73ded0282be168e468fbd729c?placeholderIfAbsent=true"
          style={{ width: "16px", height: "16px" }}
          alt=""
        />
      ),
    },
    billTotal: {
      label: "Bill Total",
      icon: (
        <img
          loading="lazy"
          src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/3b8ec0fa6eb0ec8e711c3a23fefa8083d72c2a94?placeholderIfAbsent=true"
          style={{ width: "16px", height: "16px" }}
          alt=""
        />
      ),
    },
  };

  const fieldTeamColumnConfig: Record<
    string,
    { label: string; icon: React.ReactNode }
  > = {
    priority: {
      label: "Priority",
      icon: (
        <img
          loading="lazy"
          src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/19c17d4129204654414d25bb07907dbe45b6100b?placeholderIfAbsent=true"
          className="w-3.5 h-3.5"
          alt=""
        />
      ),
    },
    description: {
      label: "Description",
      icon: (
        <img
          loading="lazy"
          src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/d5d01db2db718e32f4e620e7b1fc6ea705e115b1?placeholderIfAbsent=true"
          style={{ width: "16px", height: "16px" }}
          alt=""
        />
      ),
    },
    dueDate: {
      label: "Due Date",
      icon: <CalendarIcon width={16} height={16} />,
    },
    fieldTeam: {
      label: "Field Team",
      icon: (
        <img
          loading="lazy"
          src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/3f6ece5f831bf0341b60fe742dd77e3f127dbd09?placeholderIfAbsent=true"
          style={{ width: "16px", height: "16px" }}
          alt=""
        />
      ),
    },
    status: {
      label: "Status",
      icon: (
        <img
          loading="lazy"
          src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/137343a4a83566b73ded0282be168e468fbd729c?placeholderIfAbsent=true"
          style={{ width: "16px", height: "16px" }}
          alt=""
        />
      ),
    },
    timesheetStatus: {
      label: "Timesheet Status",
      icon: (
        <img
          loading="lazy"
          src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/137343a4a83566b73ded0282be168e468fbd729c?placeholderIfAbsent=true"
          style={{ width: "16px", height: "16px" }}
          alt=""
        />
      ),
    },
    amount: {
      label: "Amount",
      icon: (
        <img
          loading="lazy"
          src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/3b8ec0fa6eb0ec8e711c3a23fefa8083d72c2a94?placeholderIfAbsent=true"
          style={{ width: "16px", height: "16px" }}
          alt=""
        />
      ),
    },
  };

  const handleTaskCreated = useCallback(
    (taskData: {
      title: string;
      description: string;
      property: string;
      unit: string;
      priority: string;
      dueDate: Date | null;
      status: string;
      assignees: { id: string; label: string; initials: string }[];
      collaborators: { id: string; label: string; initials: string }[];
    }) => {
      const newTaskId = Math.max(...tasksList.map((t) => t.id), 0) + 1;
      const newTask: Task = {
        id: newTaskId,
        title: taskData.title,
        status:
          taskData.status === "not_started"
            ? "Not Started"
            : taskData.status === "in_progress"
              ? "In Progress"
              : "Completed",
        priority:
          taskData.priority.charAt(0).toUpperCase() +
          taskData.priority.slice(1),
        due: taskData.dueDate
          ? taskData.dueDate.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : "No Due Date",
        updated: new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        age: "0 Days",
        assignees: taskData.assignees.map((assignee) => ({
          id: parseInt(assignee.id),
          name: assignee.label,
          initials: assignee.initials,
        })),
        unit: taskData.unit,
      };
      setTasksList((prev) => [newTask, ...prev]);
      setShowCreateTaskModal(false);
    },
    [tasksList],
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Sub Page Header with TableToggle and Blue Button */}
      <SubPageHeaderV2
        leftContent={
          <TableToggle
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        }
        rightContent={
          <BlueButton
            icon={<PlusIcon width={20} height={20} />}
            onClick={() => {
              if (activeTab === "tasks") {
                setShowCreateTaskModal(true);
              } else if (activeTab === "recurring") {
                setShowCreateRecurringTaskModal(true);
              } else if (activeTab === "workorders") {
                setShowCreateWorkOrderModal(true);
              } else if (activeTab === "fieldteam") {
                setEditFTOData(null);
                setShowCreateFTOModal(true);
              }
            }}
          >
            {activeTab === "tasks" && "Add Task"}
            {activeTab === "recurring" && "Add Recurring Task"}
            {activeTab === "workorders" && "Add Work Order"}
            {activeTab === "fieldteam" && "Create FTO"}
          </BlueButton>
        }
      />

      {/* Tasks Table */}
      {activeTab === "tasks" && (
        <GlobalTable
          columns={[
            {
              key: "priority",
              label: "Priority",
              icon: tasksColumnConfig.priority.icon,
            },
            {
              key: "status",
              label: "Status",
              icon: tasksColumnConfig.status.icon,
            },
            { key: "title", label: "Task", icon: tasksColumnConfig.title.icon },
            { key: "due", label: "Due", icon: tasksColumnConfig.due.icon },
            {
              key: "updated",
              label: "Updated",
              icon: tasksColumnConfig.updated.icon,
            },
            { key: "age", label: "Age", icon: tasksColumnConfig.age.icon },
            {
              key: "assignees",
              label: "Assignees",
              icon: tasksColumnConfig.assignees.icon,
            },
            {
              key: "collaborators",
              label: "Collaborators",
              icon: tasksColumnConfig.collaborators.icon,
            },
          ]}
          data={tasksList}
          rowKey="id"
          actions={[
            {
              label: "Edit",
              icon: <EditIcon width={18} height={18} color="#525252" />,
              onClick: (task: Task) => {
                navigate(`/tasks/${task.id}`);
              },
            },
            {
              label: "Delete",
              icon: <DeleteIcon width={18} height={18} color="#982740" />,
              onClick: (task: Task) => {
                setTasksList((prev) => prev.filter((t) => t.id !== task.id));
              },
            },
          ]}
          renderCell={(task: Task, columnKey: string) => {
            switch (columnKey) {
              case "priority":
                return <TaskPriorityBadge priority={task.priority as any} />;
              case "status":
                return <TaskStatusBadge status={task.status as any} />;
              case "title":
                return (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/tasks/${task.id}`);
                    }}
                    className="text-blue-600 font-normal text-sm hover:underline cursor-pointer transition-colors truncate"
                  >
                    {task.title}
                  </button>
                );
              case "due":
                return (
                  <span className="text-gray-900 font-normal text-sm truncate">
                    {task.due}
                  </span>
                );
              case "updated":
                return (
                  <span className="text-gray-900 font-normal text-sm truncate">
                    {task.updated}
                  </span>
                );
              case "age":
                return (
                  <span className="text-gray-900 font-normal text-sm truncate">
                    {task.age}
                  </span>
                );
              case "assignees":
                return (
                  <PersonAvatars
                    people={task.assignees}
                    type="assignee"
                    size="sm"
                    fallback="—"
                  />
                );
              case "collaborators":
                return (
                  <PersonAvatars
                    people={task.collaborators || []}
                    type="collaborator"
                    size="sm"
                    fallback="—"
                  />
                );
              default:
                return null;
            }
          }}
          sortingHook={{
            handleSortClick: handleTasksSortClick,
            getSortIndicator: getTasksSortIndicator,
            getSortedData: getTasksSortedData,
          }}
          columnManagementHook={tasksColumnManagement}
          currentPage={tasksPage}
          onPageChange={setTasksPage}
          itemsPerPage={tasksItemsPerPage}
          onItemsPerPageChange={setTasksItemsPerPage}
          showPageSizeDropdown={tasksShowDropdown}
          onShowPageSizeDropdownChange={setTasksShowDropdown}
          openMenuId={tasksOpenMenuId}
          onOpenMenuIdChange={setTasksOpenMenuId}
          title="Tasks"
          headerActions={
            <button
              ref={tasksColumnManagement.columnButtonRef}
              onClick={() => {
                setTasksShowDropdown(false);
                setTasksOpenMenuId(null);
                tasksColumnManagement.setShowColumnModal((prev) => !prev);
              }}
              className="flex h-9 w-9 justify-center items-center rounded-lg border border-[#DADADA] bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] hover:bg-gray-50 transition-colors"
            >
              <DotsIcon width={18} height={18} color="#303030" />
            </button>
          }
          showColumnModal={tasksColumnManagement.showColumnModal}
          onShowColumnModalChange={tasksColumnManagement.setShowColumnModal}
        />
      )}

      {/* Recurring Tasks Table */}
      {activeTab === "recurring" && (
        <GlobalTable
          columns={[
            {
              key: "priority",
              label: "Priority",
              icon: recurringTasksColumnConfig.priority.icon,
            },
            {
              key: "task",
              label: "Task",
              icon: recurringTasksColumnConfig.task.icon,
            },
            {
              key: "nextDate",
              label: "Next Date",
              icon: recurringTasksColumnConfig.nextDate.icon,
            },
            {
              key: "category",
              label: "Category",
              icon: recurringTasksColumnConfig.category.icon,
            },
            {
              key: "assignees",
              label: "Assignees",
              icon: recurringTasksColumnConfig.assignees.icon,
            },
            {
              key: "status",
              label: "Status",
              icon: recurringTasksColumnConfig.status.icon,
            },
          ]}
          data={recurringTasksList}
          rowKey="id"
          actions={[
            {
              label: "Edit",
              icon: <EditIcon width={18} height={18} color="#525252" />,
              onClick: (task: RecurringTask) => {
                setEditingRecurringTask(task);
                setShowCreateRecurringTaskModal(true);
              },
            },
            {
              label: "Delete",
              icon: <DeleteIcon width={18} height={18} color="#982740" />,
              onClick: (task: RecurringTask) => {
                setRecurringTasksList((prev) =>
                  prev.filter((t) => t.id !== task.id),
                );
              },
            },
          ]}
          renderCell={(task: RecurringTask, columnKey: string) => {
            switch (columnKey) {
              case "priority":
                return (
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{
                        backgroundColor:
                          task.priority === "low"
                            ? "#059669"
                            : task.priority === "normal"
                              ? "#2463eb"
                              : "#d97706",
                      }}
                    />
                    <span className="text-gray-900 font-normal text-sm capitalize">
                      {task.priority}
                    </span>
                  </div>
                );
              case "task":
                return (
                  <span className="text-gray-900 font-normal text-sm">
                    {task.task}
                  </span>
                );
              case "nextDate":
                return (
                  <span className="text-gray-900 font-normal text-sm">
                    {task.nextDate}
                  </span>
                );
              case "category":
                return (
                  <span className="text-gray-900 font-normal text-sm">
                    {task.category}
                  </span>
                );
              case "assignees":
                return (
                  <PersonAvatars
                    people={task.assignees}
                    type="assignee"
                    size="sm"
                    fallback="—"
                  />
                );
              case "status":
                return (
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{
                        backgroundColor:
                          task.status === "active" ? "#059669" : "#999999",
                      }}
                    />
                    <span className="text-gray-900 font-normal text-sm capitalize">
                      {task.status}
                    </span>
                  </div>
                );
              default:
                return null;
            }
          }}
          sortingHook={{
            handleSortClick: handleRecurringSortClick,
            getSortIndicator: getRecurringSortIndicator,
            getSortedData: getRecurringSortedData,
          }}
          columnManagementHook={recurringColumnManagement}
          currentPage={recurringPage}
          onPageChange={setRecurringPage}
          itemsPerPage={recurringItemsPerPage}
          onItemsPerPageChange={setRecurringItemsPerPage}
          showPageSizeDropdown={recurringShowDropdown}
          onShowPageSizeDropdownChange={setRecurringShowDropdown}
          openMenuId={recurringOpenMenuId}
          onOpenMenuIdChange={setRecurringOpenMenuId}
          title="Recurring Tasks"
          headerActions={
            <button
              ref={recurringColumnManagement.columnButtonRef}
              onClick={() => {
                setRecurringShowDropdown(false);
                setRecurringOpenMenuId(null);
                recurringColumnManagement.setShowColumnModal((prev) => !prev);
              }}
              className="flex h-9 w-9 justify-center items-center rounded-lg border border-[#DADADA] bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] hover:bg-gray-50 transition-colors"
            >
              <DotsIcon width={18} height={18} color="#303030" />
            </button>
          }
          showColumnModal={recurringColumnManagement.showColumnModal}
          onShowColumnModalChange={
            recurringColumnManagement.setShowColumnModal
          }
        />
      )}

      {/* Work Orders Table */}
      {activeTab === "workorders" && (
        <GlobalTable
          columns={[
            {
              key: "priority",
              label: "Priority",
              icon: workOrdersColumnConfig.priority.icon,
            },
            {
              key: "status",
              label: "Status",
              icon: workOrdersColumnConfig.status.icon,
            },
            {
              key: "task",
              label: "Task",
              icon: workOrdersColumnConfig.task.icon,
            },
            {
              key: "dueDate",
              label: "Due Date",
              icon: workOrdersColumnConfig.dueDate.icon,
            },
            {
              key: "assignees",
              label: "Assignees",
              icon: workOrdersColumnConfig.assignees.icon,
            },
            {
              key: "billStatus",
              label: "Bill Status",
              icon: workOrdersColumnConfig.billStatus.icon,
            },
            {
              key: "billTotal",
              label: "Bill Total",
              icon: workOrdersColumnConfig.billTotal.icon,
            },
          ]}
          data={workOrdersList}
          rowKey="id"
          actions={[
            {
              label: "Edit",
              icon: <EditIcon width={18} height={18} color="#525252" />,
              onClick: (workOrder: WorkOrder) => {
                setShowCreateWorkOrderModal(true);
              },
            },
            {
              label: "Delete",
              icon: <DeleteIcon width={18} height={18} color="#982740" />,
              onClick: (workOrder: WorkOrder) => {
                setWorkOrdersList((prev) =>
                  prev.filter((wo) => wo.id !== workOrder.id),
                );
              },
            },
          ]}
          renderCell={(workOrder: WorkOrder, columnKey: string) => {
            switch (columnKey) {
              case "priority":
                return (
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{
                        backgroundColor:
                          workOrder.priority === "low"
                            ? "#059669"
                            : workOrder.priority === "normal"
                              ? "#2463eb"
                              : "#d97706",
                      }}
                    />
                    <span className="text-gray-900 font-normal text-sm capitalize">
                      {workOrder.priority}
                    </span>
                  </div>
                );
              case "status":
                return (
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{
                        backgroundColor:
                          workOrder.status === "In progress"
                            ? "#2463eb"
                            : "#059669",
                      }}
                    />
                    <span className="text-gray-900 font-normal text-sm capitalize">
                      {workOrder.status}
                    </span>
                  </div>
                );
              case "task":
                return (
                  <span className="text-gray-900 font-normal text-sm">
                    {workOrder.task}
                  </span>
                );
              case "dueDate":
                return (
                  <span className="text-gray-900 font-normal text-sm">
                    {workOrder.dueDate}
                  </span>
                );
              case "billStatus":
                return (
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{
                        backgroundColor:
                          workOrder.billStatus === "Paid"
                            ? "#059669"
                            : workOrder.billStatus === "Unpaid"
                              ? "#DC2626"
                              : "#D97706",
                      }}
                    />
                    <span className="text-gray-900 font-normal text-sm capitalize">
                      {workOrder.billStatus}
                    </span>
                  </div>
                );
              case "billTotal":
                return (
                  <span className="text-gray-900 font-normal text-sm">
                    {workOrder.billTotal}
                  </span>
                );
              case "assignees":
                return (
                  <PersonAvatars
                    people={workOrder.assignees}
                    type="assignee"
                    size="sm"
                    fallback="—"
                  />
                );
              default:
                return null;
            }
          }}
          sortingHook={{
            handleSortClick: handleWorkOrdersSortClick,
            getSortIndicator: getWorkOrdersSortIndicator,
            getSortedData: getWorkOrdersSortedData,
          }}
          columnManagementHook={workordersColumnManagement}
          currentPage={workordersPage}
          onPageChange={setWorkordersPage}
          itemsPerPage={workordersItemsPerPage}
          onItemsPerPageChange={setWorkordersItemsPerPage}
          showPageSizeDropdown={workordersShowDropdown}
          onShowPageSizeDropdownChange={setWorkordersShowDropdown}
          openMenuId={workordersOpenMenuId}
          onOpenMenuIdChange={setWorkordersOpenMenuId}
          title="Work Orders"
          headerActions={
            <button
              ref={workordersColumnManagement.columnButtonRef}
              onClick={() => {
                setWorkordersShowDropdown(false);
                setWorkordersOpenMenuId(null);
                workordersColumnManagement.setShowColumnModal((prev) => !prev);
              }}
              className="flex h-9 w-9 justify-center items-center rounded-lg border border-[#DADADA] bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] hover:bg-gray-50 transition-colors"
            >
              <DotsIcon width={18} height={18} color="#303030" />
            </button>
          }
          showColumnModal={workordersColumnManagement.showColumnModal}
          onShowColumnModalChange={workordersColumnManagement.setShowColumnModal}
        />
      )}

      {/* Field Team Orders Table */}
      {activeTab === "fieldteam" && (
        <GlobalTable
          columns={[
            {
              key: "priority",
              label: "Priority",
              icon: fieldTeamColumnConfig.priority.icon,
            },
            {
              key: "description",
              label: "Description",
              icon: fieldTeamColumnConfig.description.icon,
            },
            {
              key: "dueDate",
              label: "Due Date",
              icon: fieldTeamColumnConfig.dueDate.icon,
            },
            {
              key: "fieldTeam",
              label: "Field Team",
              icon: fieldTeamColumnConfig.fieldTeam.icon,
            },
            {
              key: "status",
              label: "Status",
              icon: fieldTeamColumnConfig.status.icon,
            },
            {
              key: "timesheetStatus",
              label: "Timesheet Status",
              icon: fieldTeamColumnConfig.timesheetStatus.icon,
            },
            {
              key: "amount",
              label: "Amount",
              icon: fieldTeamColumnConfig.amount.icon,
            },
          ]}
          data={fieldTeamOrdersList}
          rowKey="id"
          actions={[
            {
              label: "Edit",
              icon: <EditIcon width={18} height={18} color="#525252" />,
              onClick: (order: FieldTeamOrder) => {
                setEditFTOData({
                  dueDate: order.dueDate,
                  priority: "normal",
                  ftoStatus: order.status,
                });
                setShowCreateFTOModal(true);
              },
            },
            {
              label: "Delete",
              icon: <DeleteIcon width={18} height={18} color="#982740" />,
              onClick: (order: FieldTeamOrder) => {
                setFieldTeamOrdersList((prev) =>
                  prev.filter((o) => o.id !== order.id),
                );
              },
            },
          ]}
          renderCell={(order: FieldTeamOrder, columnKey: string) => {
            switch (columnKey) {
              case "priority":
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
              case "description":
                return (
                  <span className="text-gray-900 font-normal text-sm truncate">
                    {order.description}
                  </span>
                );
              case "dueDate":
                return (
                  <span className="text-gray-900 font-normal text-sm truncate">
                    {order.dueDate}
                  </span>
                );
              case "fieldTeam":
                return (
                  <PersonAvatars
                    people={order.fieldTeam}
                    type="assignee"
                    size="sm"
                    fallback="—"
                  />
                );
              case "status":
                return <StatusBadge status={order.status} variant="fto-status" />;
              case "timesheetStatus":
                return (
                  <StatusBadge
                    status={order.timesheetStatus}
                    variant="timesheet-status"
                  />
                );
              case "amount":
                return (
                  <span className="text-gray-900 font-normal text-sm">
                    ${order.amount}
                  </span>
                );
              default:
                return null;
            }
          }}
          sortingHook={{
            handleSortClick: handleFieldTeamSortClick,
            getSortIndicator: getFieldTeamSortIndicator,
            getSortedData: getFieldTeamSortedData,
          }}
          columnManagementHook={fieldteamColumnManagement}
          currentPage={fieldteamPage}
          onPageChange={setFieldteamPage}
          itemsPerPage={fieldteamItemsPerPage}
          onItemsPerPageChange={setFieldteamItemsPerPage}
          showPageSizeDropdown={fieldteamShowDropdown}
          onShowPageSizeDropdownChange={setFieldteamShowDropdown}
          openMenuId={fieldteamOpenMenuId}
          onOpenMenuIdChange={setFieldteamOpenMenuId}
          title="Field Team Orders"
          headerActions={
            <button
              ref={fieldteamColumnManagement.columnButtonRef}
              onClick={() => {
                setFieldteamShowDropdown(false);
                setFieldteamOpenMenuId(null);
                fieldteamColumnManagement.setShowColumnModal((prev) => !prev);
              }}
              className="flex h-9 w-9 justify-center items-center rounded-lg border border-[#DADADA] bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] hover:bg-gray-50 transition-colors"
            >
              <DotsIcon width={18} height={18} color="#303030" />
            </button>
          }
          showColumnModal={fieldteamColumnManagement.showColumnModal}
          onShowColumnModalChange={fieldteamColumnManagement.setShowColumnModal}
        />
      )}

      {/* Column Filter Modals */}
      {activeTab === "tasks" && (
        <ColumnFilterModal
          isOpen={tasksColumnManagement.showColumnModal}
          position={tasksColumnManagement.columnMenuPos}
          columns={[
            { key: "priority", label: "Priority", icon: tasksColumnConfig.priority.icon },
            { key: "status", label: "Status", icon: tasksColumnConfig.status.icon },
            { key: "title", label: "Task", icon: tasksColumnConfig.title.icon },
            { key: "due", label: "Due", icon: tasksColumnConfig.due.icon },
            { key: "updated", label: "Updated", icon: tasksColumnConfig.updated.icon },
            { key: "age", label: "Age", icon: tasksColumnConfig.age.icon },
            { key: "assignees", label: "Assignees", icon: tasksColumnConfig.assignees.icon },
            { key: "collaborators", label: "Collaborators", icon: tasksColumnConfig.collaborators.icon },
          ]}
          visibleColumns={tasksColumnManagement.visibleColumns}
          onToggleColumn={tasksColumnManagement.toggleColumnVisibility}
          onClose={() => tasksColumnManagement.setShowColumnModal(false)}
          buttonRef={tasksColumnManagement.columnButtonRef}
        />
      )}

      {activeTab === "recurring" && (
        <ColumnFilterModal
          isOpen={recurringColumnManagement.showColumnModal}
          position={recurringColumnManagement.columnMenuPos}
          columns={[
            { key: "priority", label: "Priority", icon: recurringTasksColumnConfig.priority.icon },
            { key: "task", label: "Task", icon: recurringTasksColumnConfig.task.icon },
            { key: "nextDate", label: "Next Date", icon: recurringTasksColumnConfig.nextDate.icon },
            { key: "category", label: "Category", icon: recurringTasksColumnConfig.category.icon },
            { key: "assignees", label: "Assignees", icon: recurringTasksColumnConfig.assignees.icon },
            { key: "status", label: "Status", icon: recurringTasksColumnConfig.status.icon },
          ]}
          visibleColumns={recurringColumnManagement.visibleColumns}
          onToggleColumn={recurringColumnManagement.toggleColumnVisibility}
          onClose={() => recurringColumnManagement.setShowColumnModal(false)}
          buttonRef={recurringColumnManagement.columnButtonRef}
        />
      )}

      {activeTab === "workorders" && (
        <ColumnFilterModal
          isOpen={workordersColumnManagement.showColumnModal}
          position={workordersColumnManagement.columnMenuPos}
          columns={[
            { key: "priority", label: "Priority", icon: workOrdersColumnConfig.priority.icon },
            { key: "status", label: "Status", icon: workOrdersColumnConfig.status.icon },
            { key: "task", label: "Task", icon: workOrdersColumnConfig.task.icon },
            { key: "dueDate", label: "Due Date", icon: workOrdersColumnConfig.dueDate.icon },
            { key: "assignees", label: "Assignees", icon: workOrdersColumnConfig.assignees.icon },
            { key: "billStatus", label: "Bill Status", icon: workOrdersColumnConfig.billStatus.icon },
            { key: "billTotal", label: "Bill Total", icon: workOrdersColumnConfig.billTotal.icon },
          ]}
          visibleColumns={workordersColumnManagement.visibleColumns}
          onToggleColumn={workordersColumnManagement.toggleColumnVisibility}
          onClose={() => workordersColumnManagement.setShowColumnModal(false)}
          buttonRef={workordersColumnManagement.columnButtonRef}
        />
      )}

      {activeTab === "fieldteam" && (
        <ColumnFilterModal
          isOpen={fieldteamColumnManagement.showColumnModal}
          position={fieldteamColumnManagement.columnMenuPos}
          columns={[
            { key: "priority", label: "Priority", icon: fieldTeamColumnConfig.priority.icon },
            { key: "description", label: "Description", icon: fieldTeamColumnConfig.description.icon },
            { key: "dueDate", label: "Due Date", icon: fieldTeamColumnConfig.dueDate.icon },
            { key: "fieldTeam", label: "Field Team", icon: fieldTeamColumnConfig.fieldTeam.icon },
            { key: "status", label: "Status", icon: fieldTeamColumnConfig.status.icon },
            { key: "timesheetStatus", label: "Timesheet Status", icon: fieldTeamColumnConfig.timesheetStatus.icon },
            { key: "amount", label: "Amount", icon: fieldTeamColumnConfig.amount.icon },
          ]}
          visibleColumns={fieldteamColumnManagement.visibleColumns}
          onToggleColumn={fieldteamColumnManagement.toggleColumnVisibility}
          onClose={() => fieldteamColumnManagement.setShowColumnModal(false)}
          buttonRef={fieldteamColumnManagement.columnButtonRef}
        />
      )}

      {/* Modals */}
      <CreateTaskModal
        open={showCreateTaskModal}
        onOpenChange={setShowCreateTaskModal}
        onTaskCreated={handleTaskCreated}
      />

      <CreateRecurringTaskModal
        open={showCreateRecurringTaskModal}
        onOpenChange={setShowCreateRecurringTaskModal}
      />

      <CreateWorkOrderModalV2
        open={showCreateWorkOrderModal}
        onOpenChange={setShowCreateWorkOrderModal}
      />

      <CreateFTOModal
        open={showCreateFTOModal}
        onOpenChange={setShowCreateFTOModal}
        editData={editFTOData}
      />
    </div>
  );
};

export default Maintenance;
