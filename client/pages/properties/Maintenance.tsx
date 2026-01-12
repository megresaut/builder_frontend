import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { usePageState } from "@/hooks/usePageState";
import { useSortingTable } from "@/hooks/useSortingTable";
import { useColumnManagement } from "@/hooks/useColumnManagement";
import ColumnFilterModal from "@/components/ColumnFilterModal";
import GlobalTable from "@/components/GlobalTable";
import FTOApprovalModal from "@/components/FTOApprovalModal";
import CreateTaskModal from "@/components/CreateTaskModal";
import CreateRecurringTaskModal from "@/components/CreateRecurringTaskModal";
import CreateWorkOrderModalV2 from "@/components/CreateWorkOrderModalV2";
import CreateFTOModal from "@/components/CreateFTOModal";
import TableToggle from "@/components/TableToggle";
import SubPageHeaderV2 from "@/components/SubPageHeaderV2";
import BlueButton from "@/components/BlueButton";
import {
  EditIcon,
  DeleteIcon,
  CalendarIcon,
  PlusIcon,
} from "@/components/icons";

interface Assignee {
  id: number;
  name: string;
  initials: string;
}

interface Task {
  id: number;
  title: string;
  status: string;
  due: string;
  updated: string;
  priority: string;
  assignees: Assignee[];
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
    assignees: [{ id: 1, name: "John Doe", initials: "JD" }],
  },
  {
    id: 2,
    status: "In Progress",
    title: "Windows Need Cleaning",
    due: "Sep 25, 2025",
    updated: "Sep 25, 2025",
    priority: "Low",
    assignees: [{ id: 2, name: "Jane Smith", initials: "JS" }],
  },
  {
    id: 3,
    status: "Completed",
    title: "Roof Inspection",
    due: "Sep 12, 2025",
    updated: "Sep 12, 2025",
    priority: "High",
    assignees: [{ id: 3, name: "Mike Johnson", initials: "MJ" }],
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
    assignees: [{ id: 1, name: "Jerry Sanchez", initials: "JS" }],
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
    assignees: [{ id: 2, name: "Jane Smith", initials: "JS" }],
  },
];

const getRandomTimesheetStatus = ():
  | "awaiting-submission"
  | "submitted"
  | "rejected"
  | "approved" => {
  const statuses: (
    | "awaiting-submission"
    | "submitted"
    | "rejected"
    | "approved"
  )[] = ["awaiting-submission", "submitted", "rejected", "approved"];
  return statuses[Math.floor(Math.random() * statuses.length)];
};

const mockPropertyFieldTeamOrders: FieldTeamOrder[] = [
  {
    id: 1,
    taskId: 6,
    property: "22 Indian Chase Dr",
    description: "Emergency Water Damage",
    dueDate: "Oct 2, 2025",
    priority: "high",
    fieldTeam: [
      { initials: "CH", color: "bg-blue-500", name: "Christopher Harris" },
    ],
    status: "dispatched",
    timesheetStatus: getRandomTimesheetStatus(),
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
      { initials: "CS", color: "bg-green-500", name: "Cassandra Smith" },
    ],
    status: "approved",
    timesheetStatus: getRandomTimesheetStatus(),
    amount: 2500,
  },
];

interface MaintenanceProps {
  propertyAddress: string;
  propertyType: string;
  propertyUnits: number;
}

const getFTOStatusBadge = (status: string) => {
  const statusConfig: Record<string, { label: string; dotColor: string }> = {
    "pending-approval": { label: "New", dotColor: "#1E40AF" },
    dispatched: { label: "Dispatched", dotColor: "#B45309" },
    approved: { label: "Completed", dotColor: "#166534" },
  };

  const config = statusConfig[status] || statusConfig["pending-approval"];

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <div
        style={{
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          backgroundColor: config.dotColor,
          flexShrink: 0,
        }}
      />
      <span style={{ fontSize: "14px", color: config.dotColor }}>
        {config.label}
      </span>
    </div>
  );
};

const getTimesheetStatusBadge = (status: string) => {
  const statusConfig: Record<string, { label: string; dotColor: string }> = {
    "awaiting-submission": {
      label: "Awaiting Submission",
      dotColor: "#3730A3",
    },
    submitted: { label: "Submitted", dotColor: "#991B1B" },
    rejected: { label: "Rejected", dotColor: "#DC2626" },
    approved: { label: "Approved", dotColor: "#065F46" },
  };

  const config = statusConfig[status] || statusConfig["awaiting-submission"];

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <div
        style={{
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          backgroundColor: config.dotColor,
          flexShrink: 0,
        }}
      />
      <span style={{ fontSize: "14px", color: config.dotColor }}>
        {config.label}
      </span>
    </div>
  );
};

const tasksColumnConfig: Record<string, { label: string; icon: React.ReactNode }> = {
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
  unit: {
    label: "Unit",
    icon: (
      <img
        loading="lazy"
        src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/049b679c03670a4d1cf3028269ec92ee2c8cc8e3?placeholderIfAbsent=true"
        className="w-3.5 h-3.5"
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

export const Maintenance: React.FC<MaintenanceProps> = ({
  propertyAddress,
  propertyType,
  propertyUnits,
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = usePageState<
    "tasks" | "recurring" | "workorders" | "fieldteam"
  >("activeTab", "recurring");
  const [openMenuId, setOpenMenuId] = usePageState<number | null>(
    "openMenuId",
    null,
  );

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
    "assignees",
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
    "assignees",
    "billStatus",
    "billTotal",
  ]);
  const fieldteamColumnManagement = useColumnManagement([
    "priority",
    "description",
    "unit",
    "dueDate",
    "fieldTeam",
    "status",
    "timesheetStatus",
    "amount",
  ]);

  // Sorting hooks for each table
  const { handleSortClick: handleTasksSortClick, getSortIndicator: getTasksSortIndicator, getSortedData: getTasksSortedData } = useSortingTable(tasksList);
  const { handleSortClick: handleRecurringSortClick, getSortIndicator: getRecurringSortIndicator, getSortedData: getRecurringSortedData } = useSortingTable(recurringTasksList);
  const { handleSortClick: handleWorkOrdersSortClick, getSortIndicator: getWorkOrdersSortIndicator, getSortedData: getWorkOrdersSortedData } = useSortingTable(workOrdersList);
  const { handleSortClick: handleFieldTeamSortClick, getSortIndicator: getFieldTeamSortIndicator, getSortedData: getFieldTeamSortedData } = useSortingTable(fieldTeamOrdersList);

  // Pagination state for each table
  const [tasksPage, setTasksPage] = usePageState<number>("tasksPage", 1);
  const [tasksItemsPerPage, setTasksItemsPerPage] = usePageState<number>(
    "tasksItemsPerPage",
    10,
  );
  const [tasksShowDropdown, setTasksShowDropdown] = useState(false);
  const tasksDropdownRef = useRef<HTMLButtonElement>(null);
  const [tasksDropdownPos, setTasksDropdownPos] = useState({ top: 0, left: 0 });

  const [recurringPage, setRecurringPage] = usePageState<number>(
    "recurringPage",
    1,
  );
  const [recurringItemsPerPage, setRecurringItemsPerPage] =
    usePageState<number>("recurringItemsPerPage", 10);
  const [recurringShowDropdown, setRecurringShowDropdown] = useState(false);
  const recurringDropdownRef = useRef<HTMLButtonElement>(null);
  const [recurringDropdownPos, setRecurringDropdownPos] = useState({
    top: 0,
    left: 0,
  });

  const [workordersPage, setWorkordersPage] = usePageState<number>(
    "workordersPage",
    1,
  );
  const [workordersItemsPerPage, setWorkordersItemsPerPage] =
    usePageState<number>("workordersItemsPerPage", 10);
  const [workordersShowDropdown, setWorkordersShowDropdown] = useState(false);
  const workordersDropdownRef = useRef<HTMLButtonElement>(null);
  const [workordersDropdownPos, setWorkordersDropdownPos] = useState({
    top: 0,
    left: 0,
  });

  const [fieldteamPage, setFieldteamPage] = usePageState<number>(
    "fieldteamPage",
    1,
  );
  const [fieldteamItemsPerPage, setFieldteamItemsPerPage] =
    usePageState<number>("fieldteamItemsPerPage", 10);
  const [fieldteamShowDropdown, setFieldteamShowDropdown] = useState(false);
  const fieldteamDropdownRef = useRef<HTMLButtonElement>(null);
  const [fieldteamDropdownPos, setFieldteamDropdownPos] = useState({
    top: 0,
    left: 0,
  });

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
    if (workordersPage > workordersTotalPages) setWorkordersPage(workordersTotalPages);
    if (workordersPage < 1) setWorkordersPage(1);
  }, [workordersPage, workordersTotalPages, setWorkordersPage]);

  useEffect(() => {
    if (fieldteamPage > fieldteamTotalPages) setFieldteamPage(fieldteamTotalPages);
    if (fieldteamPage < 1) setFieldteamPage(1);
  }, [fieldteamPage, fieldteamTotalPages, setFieldteamPage]);

  const tasksCanGoPrev = tasksPage > 1;
  const tasksCanGoNext = tasksPage < tasksTotalPages;
  const recurringCanGoPrev = recurringPage > 1;
  const recurringCanGoNext = recurringPage < recurringTotalPages;
  const workordersCanGoPrev = workordersPage > 1;
  const workordersCanGoNext = workordersPage < workordersTotalPages;
  const fieldteamCanGoPrev = fieldteamPage > 1;
  const fieldteamCanGoNext = fieldteamPage < fieldteamTotalPages;

  // Modal states
  const [showApprovalModal, setShowApprovalModal] = usePageState<boolean>(
    "showApprovalModal",
    false,
  );
  const [selectedFTOId, setSelectedFTOId] = usePageState<number | null>(
    "selectedFTOId",
    null,
  );
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

  // Update dropdown position for tasks
  useEffect(() => {
    let animationFrameId: number;
    const updateDropdownPos = () => {
      if (tasksShowDropdown && tasksDropdownRef.current) {
        const rect = tasksDropdownRef.current.getBoundingClientRect();
        setTasksDropdownPos({ top: rect.bottom + 8, left: rect.left });
      }
    };
    updateDropdownPos();
    if (tasksShowDropdown) {
      animationFrameId = requestAnimationFrame(updateDropdownPos);
      window.addEventListener("resize", updateDropdownPos);
      window.addEventListener("scroll", updateDropdownPos);
    }
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", updateDropdownPos);
      window.removeEventListener("scroll", updateDropdownPos);
    };
  }, [tasksShowDropdown]);

  // Update dropdown position for recurring
  useEffect(() => {
    let animationFrameId: number;
    const updateDropdownPos = () => {
      if (recurringShowDropdown && recurringDropdownRef.current) {
        const rect = recurringDropdownRef.current.getBoundingClientRect();
        setRecurringDropdownPos({ top: rect.bottom + 8, left: rect.left });
      }
    };
    updateDropdownPos();
    if (recurringShowDropdown) {
      animationFrameId = requestAnimationFrame(updateDropdownPos);
      window.addEventListener("resize", updateDropdownPos);
      window.addEventListener("scroll", updateDropdownPos);
    }
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", updateDropdownPos);
      window.removeEventListener("scroll", updateDropdownPos);
    };
  }, [recurringShowDropdown]);

  // Update dropdown position for workorders
  useEffect(() => {
    let animationFrameId: number;
    const updateDropdownPos = () => {
      if (workordersShowDropdown && workordersDropdownRef.current) {
        const rect = workordersDropdownRef.current.getBoundingClientRect();
        setWorkordersDropdownPos({ top: rect.bottom + 8, left: rect.left });
      }
    };
    updateDropdownPos();
    if (workordersShowDropdown) {
      animationFrameId = requestAnimationFrame(updateDropdownPos);
      window.addEventListener("resize", updateDropdownPos);
      window.addEventListener("scroll", updateDropdownPos);
    }
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", updateDropdownPos);
      window.removeEventListener("scroll", updateDropdownPos);
    };
  }, [workordersShowDropdown]);

  // Update dropdown position for fieldteam
  useEffect(() => {
    let animationFrameId: number;
    const updateDropdownPos = () => {
      if (fieldteamShowDropdown && fieldteamDropdownRef.current) {
        const rect = fieldteamDropdownRef.current.getBoundingClientRect();
        setFieldteamDropdownPos({ top: rect.bottom + 8, left: rect.left });
      }
    };
    updateDropdownPos();
    if (fieldteamShowDropdown) {
      animationFrameId = requestAnimationFrame(updateDropdownPos);
      window.addEventListener("resize", updateDropdownPos);
      window.addEventListener("scroll", updateDropdownPos);
    }
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", updateDropdownPos);
      window.removeEventListener("scroll", updateDropdownPos);
    };
  }, [fieldteamShowDropdown]);

  const tabs = [
    { id: "tasks" as const, label: "Tasks" },
    { id: "recurring" as const, label: "Recurring Tasks" },
    { id: "workorders" as const, label: "Work Orders" },
    { id: "fieldteam" as const, label: "Field Team Orders" },
  ];

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "bg-[#fef3c7] text-[#d97706]";
      case "Low":
        return "bg-[#d1fae5] text-[#059669]";
      case "Normal":
        return "bg-[#dbe9fe] text-[#2463eb]";
      default:
        return "bg-[#dbe9fe] text-[#2463eb]";
    }
  };

  const getStatusBadgeColor = (status: string) => {
    if (status === "Completed" || status === "dispatched") {
      return "bg-emerald-100 text-emerald-600";
    }
    if (status === "In Progress" || status === "In progress") {
      return "bg-blue-100 text-blue-600";
    }
    if (status === "approved") {
      return "bg-green-100 text-green-600";
    }
    if (status === "pending-approval") {
      return "bg-yellow-100 text-yellow-600";
    }
    return "bg-gray-100 text-gray-700";
  };

  const getBillStatusColor = (billStatus: string) => {
    if (billStatus === "Paid") return "bg-green-100 text-green-600";
    if (billStatus === "Unpaid") return "bg-red-100 text-red-600";
    if (billStatus === "Awaiting Invoice")
      return "bg-yellow-100 text-yellow-600";
    return "bg-gray-100 text-gray-700";
  };

  const handleTaskCreated = (taskData: any) => {
    const newTaskId = Math.max(...tasksList.map((t) => t.id), 0) + 1;
    const newTask: Task = {
      id: newTaskId,
      title: taskData.title,
      property: taskData.property || "Unassigned",
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
      assignees: taskData.assignees?.map((assignee: any) => ({
        id: parseInt(assignee.id),
        name: assignee.label,
        initials: assignee.initials,
      })) || [],
      collaborators: taskData.collaborators?.map((collaborator: any) => ({
        id: parseInt(collaborator.id),
        name: collaborator.label,
        initials: collaborator.initials,
      })) || [],
      unit: taskData.unit,
    };
    setTasksList((prev) => [newTask, ...prev]);

    // Close the modal before navigating to avoid it being open when coming back
    setShowCreateTaskModal(false);

    // Navigate to the newly created task with its data
    navigate(`/tasks/${newTaskId}`, { state: { task: newTask, taskData } });
  };

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
            { key: "priority", label: "Priority", icon: tasksColumnConfig.priority.icon },
            { key: "status", label: "Status", icon: tasksColumnConfig.status.icon },
            { key: "title", label: "Task", icon: tasksColumnConfig.title.icon },
            { key: "unit", label: "Unit", icon: fieldTeamColumnConfig.unit.icon },
            { key: "due", label: "Due", icon: tasksColumnConfig.due.icon },
            { key: "assignees", label: "Assignees", icon: tasksColumnConfig.assignees.icon },
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
                return (
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{
                        backgroundColor:
                          task.priority === "High"
                            ? "#D97706"
                            : task.priority === "Low"
                              ? "#059669"
                              : "#2463EB",
                      }}
                    />
                    <span className="text-gray-900 font-normal text-sm capitalize">
                      {task.priority}
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
                          task.status === "Completed"
                            ? "#059669"
                            : "#2463EB",
                      }}
                    />
                    <span className="text-gray-900 font-normal text-sm capitalize">
                      {task.status}
                    </span>
                  </div>
                );
              case "title":
                return (
                  <span className="text-gray-900 font-normal text-sm truncate">
                    {task.title}
                  </span>
                );
              case "unit":
                const unitLabels: Record<string, string> = {
                  unit1: "Unit 1",
                  unit2: "Unit 2",
                };
                return (
                  <span className="text-gray-900 font-normal text-sm truncate">
                    {task.unit ? (unitLabels[task.unit] || task.unit) : "—"}
                  </span>
                );
              case "due":
                return (
                  <span className="text-gray-900 font-normal text-sm truncate">
                    {task.due}
                  </span>
                );
              case "assignees":
                return (
                  <div className="flex items-center gap-2">
                    {task.assignees.map((assignee) => (
                      <div key={assignee.id} className="relative group">
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold cursor-pointer bg-blue-500 border border-gray-300"
                          title={assignee.name}
                        >
                          {assignee.initials}
                        </div>
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-50">
                          {assignee.name}
                        </div>
                      </div>
                    ))}
                  </div>
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
          openMenuId={openMenuId}
          onOpenMenuIdChange={setOpenMenuId}
          title="Tasks"
          showColumnModal={tasksColumnManagement.showColumnModal}
          onShowColumnModalChange={tasksColumnManagement.setShowColumnModal}
          headerActions={
            <button
              ref={tasksColumnManagement.columnButtonRef}
              onClick={() => {
                setTasksShowDropdown(false);
                setOpenMenuId(null);
                tasksColumnManagement.setShowColumnModal((prev) => !prev);
              }}
              className="flex h-9 w-9 justify-center items-center rounded-lg border border-[#DADADA] bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] hover:bg-gray-50 transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="8" cy="3" r="1.5" fill="#303030"/>
                <circle cx="8" cy="8" r="1.5" fill="#303030"/>
                <circle cx="8" cy="13" r="1.5" fill="#303030"/>
              </svg>
            </button>
          }
        />
      )}

      {/* Recurring Tasks Table */}
      {activeTab === "recurring" && (
        <GlobalTable
          columns={[
            { key: "priority", label: "Priority", icon: recurringTasksColumnConfig.priority.icon },
            { key: "task", label: "Task", icon: recurringTasksColumnConfig.task.icon },
            { key: "nextDate", label: "Next Date", icon: recurringTasksColumnConfig.nextDate.icon },
            { key: "category", label: "Category", icon: recurringTasksColumnConfig.category.icon },
            { key: "assignees", label: "Assignees", icon: recurringTasksColumnConfig.assignees.icon },
            { key: "status", label: "Status", icon: recurringTasksColumnConfig.status.icon },
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
                setRecurringTasksList((prev) => prev.filter((t) => t.id !== task.id));
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
                  <div className="flex items-center gap-2">
                    {task.assignees.map((assignee) => (
                      <div key={assignee.id} className="relative group">
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold cursor-pointer bg-blue-500 border border-gray-300"
                          title={assignee.name}
                        >
                          {assignee.initials}
                        </div>
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-50">
                          {assignee.name}
                        </div>
                      </div>
                    ))}
                  </div>
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
          openMenuId={openMenuId}
          onOpenMenuIdChange={setOpenMenuId}
          title="Recurring Tasks"
          showColumnModal={recurringColumnManagement.showColumnModal}
          onShowColumnModalChange={recurringColumnManagement.setShowColumnModal}
          headerActions={
            <button
              ref={recurringColumnManagement.columnButtonRef}
              onClick={() => {
                setRecurringShowDropdown(false);
                setOpenMenuId(null);
                recurringColumnManagement.setShowColumnModal((prev) => !prev);
              }}
              className="flex h-9 w-9 justify-center items-center rounded-lg border border-[#DADADA] bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] hover:bg-gray-50 transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="8" cy="3" r="1.5" fill="#303030"/>
                <circle cx="8" cy="8" r="1.5" fill="#303030"/>
                <circle cx="8" cy="13" r="1.5" fill="#303030"/>
              </svg>
            </button>
          }
        />
      )}

      {/* Work Orders Table */}
      {activeTab === "workorders" && (
        <GlobalTable
          columns={[
            { key: "priority", label: "Priority", icon: workOrdersColumnConfig.priority.icon },
            { key: "status", label: "Status", icon: workOrdersColumnConfig.status.icon },
            { key: "task", label: "Task", icon: workOrdersColumnConfig.task.icon },
            { key: "dueDate", label: "Due Date", icon: workOrdersColumnConfig.dueDate.icon },
            { key: "assignees", label: "Assignees", icon: workOrdersColumnConfig.assignees.icon },
            { key: "billStatus", label: "Bill Status", icon: workOrdersColumnConfig.billStatus.icon },
            { key: "billTotal", label: "Bill Total", icon: workOrdersColumnConfig.billTotal.icon },
          ]}
          data={workOrdersList}
          rowKey="id"
          actions={[
            {
              label: "Edit",
              icon: <EditIcon width={18} height={18} color="#525252" />,
              onClick: (workOrder: WorkOrder) => {
                navigate(`/tasks/${workOrder.taskId}/workorders/${workOrder.id}`);
              },
            },
            {
              label: "Delete",
              icon: <DeleteIcon width={18} height={18} color="#982740" />,
              onClick: (workOrder: WorkOrder) => {
                setWorkOrdersList((prev) => prev.filter((wo) => wo.id !== workOrder.id));
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
                          workOrder.status === "In progress" ? "#2463eb" : "#059669",
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
                  <div className="flex items-center gap-2">
                    {workOrder.assignees.map((assignee) => (
                      <div key={assignee.id} className="relative group">
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold cursor-pointer bg-blue-500 border border-gray-300"
                          title={assignee.name}
                        >
                          {assignee.initials}
                        </div>
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-50">
                          {assignee.name}
                        </div>
                      </div>
                    ))}
                  </div>
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
          openMenuId={openMenuId}
          onOpenMenuIdChange={setOpenMenuId}
          title="Work Orders"
          showColumnModal={workordersColumnManagement.showColumnModal}
          onShowColumnModalChange={workordersColumnManagement.setShowColumnModal}
          headerActions={
            <button
              ref={workordersColumnManagement.columnButtonRef}
              onClick={() => {
                setWorkordersShowDropdown(false);
                setOpenMenuId(null);
                workordersColumnManagement.setShowColumnModal((prev) => !prev);
              }}
              className="flex h-9 w-9 justify-center items-center rounded-lg border border-[#DADADA] bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] hover:bg-gray-50 transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="8" cy="3" r="1.5" fill="#303030"/>
                <circle cx="8" cy="8" r="1.5" fill="#303030"/>
                <circle cx="8" cy="13" r="1.5" fill="#303030"/>
              </svg>
            </button>
          }
        />
      )}

      {/* Field Team Orders Table */}
      {activeTab === "fieldteam" && (
        <GlobalTable
          columns={[
            { key: "priority", label: "Priority", icon: fieldTeamColumnConfig.priority.icon },
            { key: "description", label: "Description", icon: fieldTeamColumnConfig.description.icon },
            { key: "unit", label: "Unit", icon: fieldTeamColumnConfig.unit.icon },
            { key: "dueDate", label: "Due Date", icon: fieldTeamColumnConfig.dueDate.icon },
            { key: "fieldTeam", label: "Field Team", icon: fieldTeamColumnConfig.fieldTeam.icon },
            { key: "status", label: "Status", icon: fieldTeamColumnConfig.status.icon },
            { key: "timesheetStatus", label: "Timesheet Status", icon: fieldTeamColumnConfig.timesheetStatus.icon },
            { key: "amount", label: "Amount", icon: fieldTeamColumnConfig.amount.icon },
          ]}
          data={fieldTeamOrdersList}
          rowKey="id"
          actions={[
            {
              label: "Approve",
              icon: (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M2.25 8.97L6.75 13.47L15.75 4.47"
                    stroke="#0A7F2F"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ),
              onClick: (order: FieldTeamOrder) => {
                setSelectedFTOId(order.id);
                setShowApprovalModal(true);
              },
            },
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
                setFieldTeamOrdersList((prev) => prev.filter((o) => o.id !== order.id));
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
                    <span className="text-gray-900 font-normal text-sm capitalize">
                      {order.priority}
                    </span>
                  </div>
                );
              case "description":
                return (
                  <span className="text-gray-900 font-normal text-sm">
                    {order.description}
                  </span>
                );
              case "unit":
                return (
                  <span className="text-gray-900 font-normal text-sm">
                    {order.unit || "-"}
                  </span>
                );
              case "dueDate":
                return (
                  <span className="text-gray-900 font-normal text-sm">
                    {order.dueDate}
                  </span>
                );
              case "fieldTeam":
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
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-50">
                          {member.name}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              case "status":
                return getFTOStatusBadge(order.status);
              case "timesheetStatus":
                return getTimesheetStatusBadge(order.timesheetStatus);
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
          openMenuId={openMenuId}
          onOpenMenuIdChange={setOpenMenuId}
          title="Field Team Orders"
          showColumnModal={fieldteamColumnManagement.showColumnModal}
          onShowColumnModalChange={fieldteamColumnManagement.setShowColumnModal}
          onRowClick={(order: FieldTeamOrder, e: React.MouseEvent) => {
            navigate(`/tasks/${order.taskId}/fieldteam`);
          }}
          headerActions={
            <button
              ref={fieldteamColumnManagement.columnButtonRef}
              onClick={() => {
                setFieldteamShowDropdown(false);
                setOpenMenuId(null);
                fieldteamColumnManagement.setShowColumnModal((prev) => !prev);
              }}
              className="flex h-9 w-9 justify-center items-center rounded-lg border border-[#DADADA] bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] hover:bg-gray-50 transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="8" cy="3" r="1.5" fill="#303030"/>
                <circle cx="8" cy="8" r="1.5" fill="#303030"/>
                <circle cx="8" cy="13" r="1.5" fill="#303030"/>
              </svg>
            </button>
          }
        />
      )}

      {/* FTO Approval Modal */}
      <FTOApprovalModal
        open={showApprovalModal}
        onOpenChange={(open) => {
          setShowApprovalModal(open);
          if (!open) {
            setSelectedFTOId(null);
          }
        }}
        editingOrder={mockPropertyFieldTeamOrders.find(
          (o) => o.id === selectedFTOId,
        )}
        property={
          mockPropertyFieldTeamOrders.find((o) => o.id === selectedFTOId)
            ?.property
        }
        fieldTeamAssignee={
          mockPropertyFieldTeamOrders.find((o) => o.id === selectedFTOId)
            ?.fieldTeam[0]?.name
        }
      />

      {/* Create Task Modal */}
      <CreateTaskModal
        open={showCreateTaskModal}
        onOpenChange={setShowCreateTaskModal}
        onTaskCreated={handleTaskCreated}
      />

      {/* Create Recurring Task Modal */}
      <CreateRecurringTaskModal
        open={showCreateRecurringTaskModal}
        onOpenChange={(open) => {
          setShowCreateRecurringTaskModal(open);
          if (!open) {
            setEditingRecurringTask(null);
          }
        }}
        editData={
          editingRecurringTask
            ? {
                task: editingRecurringTask.task,
                nextDate: editingRecurringTask.nextDate,
                priority: editingRecurringTask.priority,
                category: editingRecurringTask.category,
              }
            : undefined
        }
      />

      {/* Create Work Order Modal */}
      <CreateWorkOrderModalV2
        open={showCreateWorkOrderModal}
        onOpenChange={setShowCreateWorkOrderModal}
      />

      {/* Create FTO Modal */}
      <CreateFTOModal
        open={showCreateFTOModal}
        onOpenChange={(open) => {
          setShowCreateFTOModal(open);
          if (!open) {
            setEditFTOData(null);
          }
        }}
        editData={editFTOData || undefined}
      />

      {/* Tasks Column Filter Modal */}
      <ColumnFilterModal
        isOpen={tasksColumnManagement.showColumnModal}
        position={tasksColumnManagement.columnMenuPos}
        columns={tasksColumnManagement.columnOrder.map((key) => ({
          key,
          label: tasksColumnConfig[key]?.label || key,
          icon: tasksColumnConfig[key]?.icon,
        }))}
        visibleColumns={tasksColumnManagement.visibleColumns}
        onToggleColumn={tasksColumnManagement.toggleColumnVisibility}
        onClose={() => tasksColumnManagement.setShowColumnModal(false)}
        buttonRef={tasksColumnManagement.columnButtonRef}
      />

      {/* Recurring Tasks Column Filter Modal */}
      <ColumnFilterModal
        isOpen={recurringColumnManagement.showColumnModal}
        position={recurringColumnManagement.columnMenuPos}
        columns={recurringColumnManagement.columnOrder.map((key) => ({
          key,
          label: recurringTasksColumnConfig[key]?.label || key,
          icon: recurringTasksColumnConfig[key]?.icon,
        }))}
        visibleColumns={recurringColumnManagement.visibleColumns}
        onToggleColumn={recurringColumnManagement.toggleColumnVisibility}
        onClose={() => recurringColumnManagement.setShowColumnModal(false)}
        buttonRef={recurringColumnManagement.columnButtonRef}
      />

      {/* Work Orders Column Filter Modal */}
      <ColumnFilterModal
        isOpen={workordersColumnManagement.showColumnModal}
        position={workordersColumnManagement.columnMenuPos}
        columns={workordersColumnManagement.columnOrder.map((key) => ({
          key,
          label: workOrdersColumnConfig[key]?.label || key,
          icon: workOrdersColumnConfig[key]?.icon,
        }))}
        visibleColumns={workordersColumnManagement.visibleColumns}
        onToggleColumn={workordersColumnManagement.toggleColumnVisibility}
        onClose={() => workordersColumnManagement.setShowColumnModal(false)}
        buttonRef={workordersColumnManagement.columnButtonRef}
      />

      {/* Field Team Orders Column Filter Modal */}
      <ColumnFilterModal
        isOpen={fieldteamColumnManagement.showColumnModal}
        position={fieldteamColumnManagement.columnMenuPos}
        columns={fieldteamColumnManagement.columnOrder.map((key) => ({
          key,
          label: fieldTeamColumnConfig[key]?.label || key,
          icon: fieldTeamColumnConfig[key]?.icon,
        }))}
        visibleColumns={fieldteamColumnManagement.visibleColumns}
        onToggleColumn={fieldteamColumnManagement.toggleColumnVisibility}
        onClose={() => fieldteamColumnManagement.setShowColumnModal(false)}
        buttonRef={fieldteamColumnManagement.columnButtonRef}
      />
    </div>
  );
};
