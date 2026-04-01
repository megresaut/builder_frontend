import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import CreateWorkOrderModalV2 from "@/components/CreateWorkOrderModalV2";
import type { Note, File } from "@/components/templates";
import PageHeader from "@/components/PageHeader";
import { usePageState } from "@/hooks/usePageState";
import { useSortingTable } from "@/hooks/useSortingTable";
import { useColumnManagement } from "@/hooks/useColumnManagement";
import ColumnFilterModal from "@/components/ColumnFilterModal";
import GlobalTable from "@/components/GlobalTable";
import PageTemplate from "@/layout/PageTemplate";
import { StatusBadge } from "@/components/StatusBadge";
import TaskPriorityBadge from "@/components/TaskPriorityBadge";
import TaskStatusBadge from "@/components/TaskStatusBadge";
import { fetchJSON } from "@/api/fetchJSON";
import { formatUnitLabel, formatUnitDisplayForTable, UNIT_EMPTY_DISPLAY } from "@/utils/unitLabel";
import {
  EditIcon,
  DeleteIcon,
  BuildingIcon,
  HashtagIcon,
} from "@/components/icons";

interface Assignee {
  id: number;
  name: string;
  initials: string;
  color: string;
  email?: string;
  phone?: string;
  title?: string;
}

interface WorkOrder {
  id: number;
  task: string;
  taskId: number;
  property: string;
  unit: string;
  dueDate: string;
  due_date?: string | null;
  updatedDate: string;
  age: string;
  priority: "High" | "Low" | "Normal";
  status: "In Progress" | "Completed";
  billStatus: "Paid" | "Unpaid" | "Awaiting Invoice";
  billTotal: string;
  vendorName?: string;
  assignees: Assignee[];
  collaborators: Assignee[];
}

interface APIWorkOrder {
  id: number;
  task_id: number;
  property_id: number;
  vendor_id?: number;
  name: string;
  description: string;
  status: string;
  priority: string;
  due_date?: string;
  created_at: string;
  updated_at: string;
  property_name?: string;
  unit_id?: number;
  unit_name?: string;
  bill_total_cents?: number;
  bill_invoice_number?: string;
  vendor_name?: string;
  internal_notes?: string;
  vendor_notes?: string;
}

// Helper function to calculate age from date
const calculateAge = (date: string): string => {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (diffDays >= 1) {
    return `${diffDays} day${diffDays !== 1 ? "s" : ""}`;
  }
  return `${diffHours} hour${diffHours !== 1 ? "s" : ""}`;
};

// Helper function to normalize priority
const normalizePriority = (priority: string): "High" | "Low" | "Normal" => {
  const lower = priority.toLowerCase();
  if (lower === "high" || lower === "urgent") return "High";
  if (lower === "low") return "Low";
  return "Normal";
};

// Helper function to normalize status (must match TaskStatusBadge keys: "In Progress", "Completed")
const normalizeStatus = (status: string): "In Progress" | "Completed" => {
  const lower = status.toLowerCase();
  if (lower === "completed" || lower === "closed") return "Completed";
  return "In Progress";
};

// Map API response to WorkOrder interface
const mapAPIWorkOrderToWorkOrder = (apiWO: APIWorkOrder): WorkOrder => {
  const dueDate = apiWO.due_date
    ? new Date(apiWO.due_date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "No due date";
  
  const updatedDate = apiWO.updated_at
    ? new Date(apiWO.updated_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : new Date(apiWO.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
  
  const age = calculateAge(apiWO.created_at);
  
  const billTotal = apiWO.bill_total_cents
    ? `$${(apiWO.bill_total_cents / 100).toFixed(2)}`
    : "No invoice";
  
  return {
    id: apiWO.id,
    task: apiWO.description || apiWO.name,
    taskId: apiWO.task_id,
    property: apiWO.property_name || "Unknown Property",
    unit: formatUnitLabel({
      unitId: apiWO.unit_id,
      unitName: apiWO.unit_name,
      fallback: UNIT_EMPTY_DISPLAY,
    }),
    dueDate,
    due_date: apiWO.due_date ?? null,
    updatedDate,
    age,
    priority: normalizePriority(apiWO.priority),
    status: normalizeStatus(apiWO.status),
    billStatus: "Awaiting Invoice", // Default since we don't have bill status in API
    billTotal,
    vendorName: apiWO.vendor_name || "",
    assignees: [],
    collaborators: [],
  };
};

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
    status: "In Progress",
    billStatus: "Paid",
    billTotal: "$420",
    assignees: [
      {
        id: 1,
        name: "Jerry Sanchez",
        initials: "JS",
        color: "bg-blue-500",
        email: "jerry.sanchez@company.com",
        phone: "(555) 111-1111",
        title: "Field Technician",
      },
    ],
    collaborators: [
      {
        id: 5,
        name: "Sarah Wilson",
        initials: "SW",
        color: "bg-pink-500",
        email: "sarah.wilson@company.com",
        phone: "(555) 555-5555",
        title: "Project Manager",
      },
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
    status: "In Progress",
    billStatus: "Awaiting Invoice",
    billTotal: "No invoice",
    assignees: [
      {
        id: 3,
        name: "Jane Smith",
        initials: "JMS",
        color: "bg-green-500",
        email: "jane.smith@company.com",
        phone: "(555) 333-3333",
        title: "HVAC Specialist",
      },
    ],
    collaborators: [
      {
        id: 6,
        name: "Tom Davis",
        initials: "TD",
        color: "bg-indigo-500",
        email: "tom.davis@company.com",
        phone: "(555) 666-6666",
        title: "Supervisor",
      },
      {
        id: 7,
        name: "Lisa Brown",
        initials: "LB",
        color: "bg-red-500",
        email: "lisa.brown@company.com",
        phone: "(555) 777-7777",
        title: "Inspector",
      },
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
      {
        id: 1,
        name: "Jerry Sanchez",
        initials: "JS",
        color: "bg-blue-500",
        email: "jerry.sanchez@company.com",
        phone: "(555) 111-1111",
        title: "Field Technician",
      },
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
      {
        id: 2,
        name: "John Doe",
        initials: "JD",
        color: "bg-purple-500",
        email: "john.doe@company.com",
        phone: "(555) 222-2222",
        title: "Lead Inspector",
      },
    ],
    collaborators: [
      {
        id: 5,
        name: "Sarah Wilson",
        initials: "SW",
        color: "bg-pink-500",
        email: "sarah.wilson@company.com",
        phone: "(555) 555-5555",
        title: "Project Manager",
      },
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
      {
        id: 4,
        name: "Mike Johnson",
        initials: "MJ",
        color: "bg-orange-500",
        email: "mike.johnson@company.com",
        phone: "(555) 444-4444",
        title: "Plumber",
      },
    ],
    collaborators: [
      {
        id: 6,
        name: "Tom Davis",
        initials: "TD",
        color: "bg-indigo-500",
        email: "tom.davis@company.com",
        phone: "(555) 666-6666",
        title: "Supervisor",
      },
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
      {
        id: 1,
        name: "Jerry Sanchez",
        initials: "JS",
        color: "bg-blue-500",
        email: "jerry.sanchez@company.com",
        phone: "(555) 111-1111",
        title: "Field Technician",
      },
    ],
    collaborators: [
      {
        id: 7,
        name: "Lisa Brown",
        initials: "LB",
        color: "bg-red-500",
        email: "lisa.brown@company.com",
        phone: "(555) 777-7777",
        title: "Inspector",
      },
      {
        id: 5,
        name: "Sarah Wilson",
        initials: "SW",
        color: "bg-pink-500",
        email: "sarah.wilson@company.com",
        phone: "(555) 555-5555",
        title: "Project Manager",
      },
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
      {
        id: 3,
        name: "Jane Smith",
        initials: "JMS",
        color: "bg-green-500",
        email: "jane.smith@company.com",
        phone: "(555) 333-3333",
        title: "HVAC Specialist",
      },
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
      {
        id: 2,
        name: "John Doe",
        initials: "JD",
        color: "bg-purple-500",
        email: "john.doe@company.com",
        phone: "(555) 222-2222",
        title: "Lead Inspector",
      },
    ],
    collaborators: [
      {
        id: 6,
        name: "Tom Davis",
        initials: "TD",
        color: "bg-indigo-500",
        email: "tom.davis@company.com",
        phone: "(555) 666-6666",
        title: "Supervisor",
      },
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
      {
        id: 4,
        name: "Mike Johnson",
        initials: "MJ",
        color: "bg-orange-500",
        email: "mike.johnson@company.com",
        phone: "(555) 444-4444",
        title: "Plumber",
      },
    ],
    collaborators: [
      {
        id: 5,
        name: "Sarah Wilson",
        initials: "SW",
        color: "bg-pink-500",
        email: "sarah.wilson@company.com",
        phone: "(555) 555-5555",
        title: "Project Manager",
      },
      {
        id: 7,
        name: "Lisa Brown",
        initials: "LB",
        color: "bg-red-500",
        email: "lisa.brown@company.com",
        phone: "(555) 777-7777",
        title: "Inspector",
      },
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
      {
        id: 1,
        name: "Jerry Sanchez",
        initials: "JS",
        color: "bg-blue-500",
        email: "jerry.sanchez@company.com",
        phone: "(555) 111-1111",
        title: "Field Technician",
      },
    ],
    collaborators: [
      {
        id: 6,
        name: "Tom Davis",
        initials: "TD",
        color: "bg-indigo-500",
        email: "tom.davis@company.com",
        phone: "(555) 666-6666",
        title: "Supervisor",
      },
    ],
  },
];

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

export default function MaintenanceWorkOrders() {
  const navigate = useNavigate();
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
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
  const [editingWorkOrder, setEditingWorkOrder] = useState<WorkOrder | null>(
    null,
  );
  const [editingWorkOrderData, setEditingWorkOrderData] = useState<APIWorkOrder | null>(
    null,
  );
  const [isCreateWorkOrderModalOpen, setIsCreateWorkOrderModalOpen] =
    usePageState("isCreateWorkOrderModalOpen", false);

  const [showFilterBar, setShowFilterBar] = usePageState(
    "maintenanceWorkOrdersShowFilterBar",
    false,
  );
  const [filterDateFrom, setFilterDateFrom] = usePageState(
    "maintenanceWorkOrdersFilterDateFrom",
    "",
  );
  const [filterDateTo, setFilterDateTo] = usePageState(
    "maintenanceWorkOrdersFilterDateTo",
    "",
  );
  const [filterVendor, setFilterVendor] = usePageState<string[]>(
    "maintenanceWorkOrdersFilterVendor",
    [],
  );
  const [filterProperty, setFilterProperty] = usePageState<string[]>(
    "maintenanceWorkOrdersFilterProperty",
    [],
  );
  const [filterStatus, setFilterStatus] = usePageState<string[]>(
    "maintenanceWorkOrdersFilterStatus",
    ["In Progress"],
  );
  const [filterPriority, setFilterPriority] = usePageState<string[]>(
    "maintenanceWorkOrdersFilterPriority",
    [],
  );
  const [filterHasBill, setFilterHasBill] = usePageState(
    "maintenanceWorkOrdersFilterHasBill",
    "" as "" | "yes" | "no",
  );

  const uniqueVendors = useMemo(
    () =>
      Array.from(
        new Set(workOrders.map((wo) => wo.vendorName).filter(Boolean)),
      ).sort(),
    [workOrders],
  );
  const uniqueProperties = useMemo(
    () =>
      Array.from(new Set(workOrders.map((wo) => wo.property).filter(Boolean))).sort(),
    [workOrders],
  );
  const uniqueStatuses = useMemo(
    () => ["In Progress", "Completed"] as const,
    [],
  );
  const uniquePriorities = useMemo(
    () => ["High", "Low", "Normal"] as const,
    [],
  );

  const filteredWorkOrders = useMemo(() => {
    return workOrders.filter((wo) => {
      if (filterVendor.length > 0 && !filterVendor.includes(wo.vendorName || "")) return false;
      if (filterProperty.length > 0 && !filterProperty.includes(wo.property)) return false;
      if (filterStatus.length > 0 && !filterStatus.includes(wo.status)) return false;
      if (filterPriority.length > 0 && !filterPriority.includes(wo.priority)) return false;
      if (filterDateFrom || filterDateTo) {
        const d = wo.due_date ?? null;
        if (!d) return false;
        const dateStr = d.slice(0, 10);
        if (filterDateFrom && dateStr < filterDateFrom) return false;
        if (filterDateTo && dateStr > filterDateTo) return false;
      }
      if (filterHasBill === "yes") {
        if (wo.billTotal === "No invoice") return false;
      } else if (filterHasBill === "no") {
        if (wo.billTotal !== "No invoice") return false;
      }
      return true;
    });
  }, [
    workOrders,
    filterVendor,
    filterProperty,
    filterStatus,
    filterPriority,
    filterDateFrom,
    filterDateTo,
    filterHasBill,
  ]);

  const { handleSortClick, getSortIndicator, getSortedData } = useSortingTable(
    filteredWorkOrders,
    "allWorkOrders",
  );
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
    "vendorName",
    "task",
    "property",
    "unit",
    "updatedDate",
    "age",
    "status",
    "dueDate",
    // "billStatus", // Commented out as requested
    "billTotal",
    // "assignees", // Removed as requested
    // "collaborators", // Removed as requested
  ]);

  const columns = [
    {
      key: "priority",
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
    {
      key: "vendorName",
      label: "Vendor Name",
      icon: (
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M8 8C10.2091 8 12 6.20914 12 4C12 1.79086 10.2091 0 8 0C5.79086 0 4 1.79086 4 4C4 6.20914 5.79086 8 8 8Z"
            fill="#525252"
          />
          <path
            d="M8 9.33333C4.3181 9.33333 1.33333 12.3181 1.33333 16H14.6667C14.6667 12.3181 11.6819 9.33333 8 9.33333Z"
            fill="#525252"
          />
        </svg>
      ),
    },
    {
      key: "task",
      label: "Work Order",
      icon: (
        <img
          loading="lazy"
          src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/7f481edecd98b8475a23ac762feb99280a60a52a?placeholderIfAbsent=true"
          style={{ width: "16px", height: "16px" }}
          alt=""
        />
      ),
    },
    {
      key: "property",
      label: "Property",
      icon: <BuildingIcon width={16} height={16} className="text-gray-600" />,
    },
    {
      key: "unit",
      label: "Unit",
      icon: <HashtagIcon width={16} height={16} className="text-gray-600" />,
    },
    {
      key: "updatedDate",
      label: "Updated",
      icon: (
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M14 6.66658H2M10.6667 1.33325V3.99992M5.33333 1.33325V3.99992M5.2 14.6666H10.8C11.9201 14.6666 12.4802 14.6666 12.908 14.4486C13.2843 14.2569 13.5903 13.9509 13.782 13.5746C14 13.1467 14 12.5867 14 11.4666V5.86659C14 4.74648 14 4.18643 13.782 3.7586C13.5903 3.38228 13.2843 3.07632 12.908 2.88457C12.4802 2.66659 11.9201 2.66659 10.8 2.66659H5.2C4.0799 2.66659 3.51984 2.66659 3.09202 2.88457C2.71569 3.07632 2.40973 3.38228 2.21799 3.7586C2 4.18643 2 4.74648 2 5.86658V11.4666C2 12.5867 2 13.1467 2.21799 13.5746C2.40973 13.9509 2.71569 14.2569 3.09202 14.4486C3.51984 14.6666 4.0799 14.6666 5.2 14.6666Z"
            stroke="#525252"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      key: "age",
      label: "Age",
      icon: (
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M8.00065 2.66659C5.05513 2.66659 2.66732 5.0544 2.66732 7.99992C2.66732 10.9454 5.05513 13.3333 8.00065 13.3333C10.5281 13.3333 12.6449 11.5752 13.1949 9.21518L12.9386 9.47139C12.6782 9.7317 12.2561 9.73164 11.9958 9.47125C11.7355 9.21086 11.7356 8.78875 11.9959 8.52844L13.3297 7.19511C13.4547 7.07011 13.6243 6.99989 13.8011 6.99992C13.9779 6.99994 14.1475 7.07021 14.2725 7.19525L15.6054 8.52858C15.8657 8.78897 15.8657 9.21108 15.6053 9.47139C15.3449 9.7317 14.9228 9.73164 14.6625 9.47125L14.5324 9.3411C13.9116 12.3802 11.2232 14.6666 8.00065 14.6666C4.31875 14.6666 1.33398 11.6818 1.33398 7.99992C1.33398 4.31802 4.31875 1.33325 8.00065 1.33325C10.4473 1.33325 12.5854 2.65164 13.7443 4.61357C13.9316 4.93058 13.8264 5.33938 13.5094 5.52664C13.1924 5.71391 12.7836 5.60873 12.5963 5.29172C11.6673 3.71904 9.95653 2.66659 8.00065 2.66659Z"
            fill="#525252"
          />
          <path
            d="M8.66732 4.66658C8.66732 4.2984 8.36884 3.99992 8.00065 3.99992C7.63246 3.99992 7.33398 4.2984 7.33398 4.66658V7.99992C7.33398 8.22282 7.44538 8.43097 7.63085 8.55462L9.63085 9.88795C9.9372 10.0922 10.3511 10.0094 10.5554 9.70305C10.7596 9.3967 10.6768 8.98279 10.3705 8.77855L8.66732 7.64313V4.66658Z"
            fill="#525252"
          />
        </svg>
      ),
    },
    {
      key: "status",
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
    {
      key: "dueDate",
      label: "Due",
      icon: (
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M14 6.66658H2M10.6667 1.33325V3.99992M5.33333 1.33325V3.99992M5.2 14.6666H10.8C11.9201 14.6666 12.4802 14.6666 12.908 14.4486C13.2843 14.2569 13.5903 13.9509 13.782 13.5746C14 13.1467 14 12.5867 14 11.4666V5.86659C14 4.74648 14 4.18643 13.782 3.7586C13.5903 3.38228 13.2843 3.07632 12.908 2.88457C12.4802 2.66659 11.9201 2.66659 10.8 2.66659H5.2C4.0799 2.66659 3.51984 2.66659 3.09202 2.88457C2.71569 3.07632 2.40973 3.38228 2.21799 3.7586C2 4.18643 2 4.74648 2 5.86658V11.4666C2 12.5867 2 13.1467 2.21799 13.5746C2.40973 13.9509 2.71569 14.2569 3.09202 14.4486C3.51984 14.6666 4.0799 14.6666 5.2 14.6666Z"
            stroke="#525252"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    // {
    //   key: "billStatus",
    //   label: "Bill Status",
    //   icon: (
    //     <img
    //       loading="lazy"
    //       src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/137343a4a83566b73ded0282be168e468fbd729c?placeholderIfAbsent=true"
    //       style={{ width: "16px", height: "16px" }}
    //       alt=""
    //     />
    //   ),
    // },
    {
      key: "billTotal",
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
  ];

  const handleDeleteWorkOrder = useCallback((workOrder: WorkOrder) => {
    setWorkOrders((prev) => prev.filter((wo) => wo.id !== workOrder.id));
  }, []);

  const handleEditWorkOrder = useCallback(
    async (workOrder: WorkOrder) => {
      // Fetch full work order details for editing
      try {
        const fullWorkOrder = await fetchJSON(`/maintenance/work-orders/${workOrder.id}`) as APIWorkOrder;
        // Store both the mapped WorkOrder and the raw API data
        const mappedWorkOrder = mapAPIWorkOrderToWorkOrder(fullWorkOrder);
        setEditingWorkOrder(mappedWorkOrder);
        setEditingWorkOrderData(fullWorkOrder);
        setIsCreateWorkOrderModalOpen(true);
      } catch (error) {
        console.error("Error fetching work order details:", error);
        // Fallback to using the work order from the list
        setEditingWorkOrder(workOrder);
        setEditingWorkOrderData(null);
        setIsCreateWorkOrderModalOpen(true);
      }
    },
    [setIsCreateWorkOrderModalOpen],
  );

  const handleWorkOrderUpdated = useCallback(
    (updatedWorkOrder: any) => {
      // Refresh the work orders list after update
      const fetchWorkOrders = async () => {
        try {
          const raw = await fetchJSON("/maintenance/work-orders?limit=100");
          
          const apiData: APIWorkOrder[] = Array.isArray(raw)
            ? raw
            : raw?.data ?? raw?.items ?? raw?.results ?? [];
          
          const transformedWorkOrders = apiData.map(mapAPIWorkOrderToWorkOrder);
          setWorkOrders(transformedWorkOrders);
        } catch (error) {
          console.error("Error fetching work orders:", error);
        }
      };

      fetchWorkOrders();
      setIsCreateWorkOrderModalOpen(false);
      setEditingWorkOrder(null);
      setEditingWorkOrderData(null);
    },
    [],
  );

  // Fetch work orders from API
  useEffect(() => {
    const fetchWorkOrders = async () => {
      setLoading(true);
      try {
        const raw = await fetchJSON("/maintenance/work-orders?limit=100");
        
        const apiData: APIWorkOrder[] = Array.isArray(raw)
          ? raw
          : raw?.data ?? raw?.items ?? raw?.results ?? [];
        
        const transformedWorkOrders = apiData.map(mapAPIWorkOrderToWorkOrder);
        setWorkOrders(transformedWorkOrders);
      } catch (error) {
        console.error("Error fetching work orders:", error);
        setWorkOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkOrders();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    filterDateFrom,
    filterDateTo,
    filterVendor,
    filterProperty,
    filterStatus,
    filterPriority,
    filterHasBill,
  ]);

  return (
    <PageTemplate>
      <div className="flex flex-col gap-6 w-fit min-w-full">
        {/* Header Section - Using PageHeader Template */}
        <PageHeader
          title="Work Orders"
          subtitle="All your work orders, in one place"
          action={{
            label: "Create Work Order",
            onClick: () => setIsCreateWorkOrderModalOpen(true),
            icon: <Plus className="w-5 h-5" />,
          }}
        />

        <div className="flex flex-col gap-6">
          {showFilterBar && !loading && (
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
                  label="Vendor"
                  options={uniqueVendors.map((v) => ({ value: v!, label: v! }))}
                  selected={filterVendor}
                  onChange={setFilterVendor}
                />
                <MultiSelectFilter
                  label="Property"
                  options={uniqueProperties.map((p) => ({ value: p, label: p }))}
                  selected={filterProperty}
                  onChange={setFilterProperty}
                />
                <MultiSelectFilter
                  label="Status"
                  options={uniqueStatuses.map((s) => ({ value: s, label: s }))}
                  selected={filterStatus}
                  onChange={setFilterStatus}
                />
                <MultiSelectFilter
                  label="Priority"
                  options={uniquePriorities.map((p) => ({ value: p, label: p }))}
                  selected={filterPriority}
                  onChange={setFilterPriority}
                />
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-[#717179] whitespace-nowrap">
                    Bill attached
                  </label>
                  <select
                    value={filterHasBill}
                    onChange={(e) =>
                      setFilterHasBill(e.target.value as "" | "yes" | "no")
                    }
                    className="h-9 px-2.5 rounded-lg border border-[#DADADA] bg-white text-sm text-[#303030] min-w-[120px]"
                  >
                    <option value="">All</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFilterDateFrom("");
                  setFilterDateTo("");
                  setFilterVendor([]);
                  setFilterProperty([]);
                  setFilterStatus([]);
                  setFilterPriority([]);
                  setFilterHasBill("");
                  setCurrentPage(1);
                }}
                className="h-9 px-3 rounded-lg border border-[#DADADA] bg-white text-sm font-medium text-[#303030] hover:bg-gray-100 shrink-0"
              >
                Clear filters
              </button>
            </div>
          )}

          {/* Work Orders Table - Using GlobalTable Component */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500">Loading work orders...</div>
            </div>
          ) : (
          <GlobalTable
            columns={columns}
            data={getSortedData()}
            rowKey="id"
            renderCell={(workOrder, columnKey) => {
              if (columnKey === "priority") {
                return (
                  <TaskPriorityBadge priority={workOrder.priority as any} />
                );
              }
              if (columnKey === "vendorName") {
                return (
                  <span className="text-gray-900 font-normal text-sm truncate">
                    {workOrder.vendorName || "—"}
                  </span>
                );
              }
              if (columnKey === "task") {
                return (
                  <div className="min-w-0 max-w-[280px]" title={workOrder.task}>
                    <span className="block truncate text-gray-900 font-normal text-sm">
                      {workOrder.task}
                    </span>
                  </div>
                );
              }
              if (columnKey === "property") {
                return (
                  <span className="text-gray-900 font-normal text-sm truncate">
                    {workOrder.property}
                  </span>
                );
              }
              if (columnKey === "unit") {
                return (
                  <span className="text-gray-900 font-normal text-sm truncate">
                    {formatUnitDisplayForTable(workOrder.unit)}
                  </span>
                );
              }
              if (columnKey === "updatedDate") {
                return (
                  <span className="text-gray-900 font-normal text-sm truncate">
                    {workOrder.updatedDate}
                  </span>
                );
              }
              if (columnKey === "age") {
                return (
                  <span className="text-gray-900 font-normal text-sm truncate">
                    {workOrder.age}
                  </span>
                );
              }
              if (columnKey === "status") {
                return <TaskStatusBadge status={workOrder.status as any} />;
              }
              if (columnKey === "dueDate") {
                return (
                  <span className="text-gray-900 font-normal text-sm truncate">
                    {workOrder.dueDate}
                  </span>
                );
              }
              // if (columnKey === "billStatus") {
              //   return (
              //     <div className="flex items-center gap-2">
              //       <div
              //         className="w-2 h-2 rounded-full"
              //         style={{
              //           backgroundColor:
              //             workOrder.billStatus === "Paid"
              //               ? "#059669"
              //               : workOrder.billStatus === "Unpaid"
              //                 ? "#DC2626"
              //                 : "#D97706",
              //         }}
              //       />
              //       <span className="text-gray-900 font-normal text-sm capitalize">
              //         {workOrder.billStatus}
              //       </span>
              //     </div>
              //   );
              // }
              if (columnKey === "billTotal") {
                return (
                  <span className="text-gray-900 font-normal text-sm">
                    {workOrder.billTotal}
                  </span>
                );
              }
              return null;
            }}
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
            title="Work Orders"
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
                  setShowColumnModal(!showColumnModal);
                }}
                className="flex h-9 w-9 justify-center items-center rounded-lg border border-[#DADADA] bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] hover:bg-gray-50 transition-colors"
                data-test="column-button"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle cx="8" cy="3" r="1.5" fill="#303030" />
                  <circle cx="8" cy="8" r="1.5" fill="#303030" />
                  <circle cx="8" cy="13" r="1.5" fill="#303030" />
                </svg>
              </button>
            }
            actions={[
              {
                label: "Edit",
                icon: <EditIcon width={18} height={18} color="#525252" />,
                onClick: handleEditWorkOrder,
              },
              {
                label: "Delete",
                icon: <DeleteIcon width={18} height={18} color="#982740" />,
                onClick: handleDeleteWorkOrder,
              },
            ]}
            onRowClick={(workOrder) => {
              navigate(`/tasks/${workOrder.taskId}/workorders/${workOrder.id}`);
            }}
            showColumnModal={showColumnModal}
            onShowColumnModalChange={setShowColumnModal}
          />
          )}
        </div>
      </div>

      {/* Create/Edit Work Order Modal */}
      <CreateWorkOrderModalV2
        open={isCreateWorkOrderModalOpen}
        onOpenChange={(open) => {
          setIsCreateWorkOrderModalOpen(open);
          if (!open) {
            setEditingWorkOrder(null);
            setEditingWorkOrderData(null);
          }
        }}
        mode={editingWorkOrder ? "edit" : "create"}
        workOrderId={editingWorkOrder?.id}
        initialData={editingWorkOrder && editingWorkOrderData ? {
          workOrderName: editingWorkOrderData.name || editingWorkOrder.task,
          vendorId: editingWorkOrderData.vendor_id,
          status: (editingWorkOrderData.status === "in_progress" 
            ? "in_progress" 
            : editingWorkOrderData.status === "completed" 
              ? "completed" 
              : "not_started") as "not_started" | "in_progress" | "completed",
          priority: (editingWorkOrderData.priority === "high" 
            ? "high" 
            : editingWorkOrderData.priority === "low" 
              ? "low" 
              : "normal") as "low" | "normal" | "high" | "urgent",
          dueDate: editingWorkOrderData.due_date ? new Date(editingWorkOrderData.due_date) : null,
          notes: editingWorkOrderData.internal_notes || editingWorkOrderData.vendor_notes || "",
        } : editingWorkOrder ? {
          // Fallback if we don't have full API data
          workOrderName: editingWorkOrder.task,
          status: (editingWorkOrder.status === "In Progress" 
            ? "in_progress" 
            : editingWorkOrder.status === "Completed" 
              ? "completed" 
              : "not_started") as "not_started" | "in_progress" | "completed",
          priority: (editingWorkOrder.priority === "High" 
            ? "high" 
            : editingWorkOrder.priority === "Low" 
              ? "low" 
              : "normal") as "low" | "normal" | "high" | "urgent",
          dueDate: editingWorkOrder.dueDate && editingWorkOrder.dueDate !== "No due date"
            ? (() => {
                try {
                  return new Date(editingWorkOrder.dueDate);
                } catch {
                  return null;
                }
              })()
            : null,
          notes: "",
        } : undefined}
        onWorkOrderUpdated={handleWorkOrderUpdated}
        onDataUpdate={(data) => {
          // This callback is only used for create mode now
          if (editingWorkOrder) {
            // Edit mode is handled by onWorkOrderUpdated
            return;
          }
          const newId =
            workOrders.length > 0
              ? Math.max(...workOrders.map((wo) => wo.id)) + 1
              : 1;

          const newNotes: Note[] = data.notes
            ? [
                {
                  id: 1,
                  text: data.notes,
                  date: new Date().toLocaleString(),
                  author: "Julia LoSchiavo",
                },
              ]
            : [];

          const newFiles: File[] = data.files
            ? data.files.map((uf, idx) => ({
                id: idx + 1,
                name: uf.name,
                url: uf.storage_path || "#",
                uploadedAt: new Date().toLocaleString(),
                category: "Work Order",
                description: "",
              }))
            : [];

          const newWorkOrder = {
            id: newId,
            task: data.workOrderName || data.task || "New Work Order",
            taskId: 1,
            property: "Unassigned",
            unit: "",
            dueDate: data.dueDate
              ? data.dueDate.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "No due date",
            updatedDate: new Date().toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            }),
            age: "Just now",
            priority:
              data.priority === "high"
                ? "High"
                : data.priority === "low"
                  ? "Low"
                  : "Normal",
            status: data.status === "completed" ? "Completed" : "In Progress",
            billStatus: "Awaiting Invoice",
            billTotal: "No invoice",
            assignees: [],
            collaborators: [],
            vendorName: data.vendor || "",
            description: data.notes || "",
            notes: newNotes,
            files: newFiles,
          };

          setWorkOrders((prev) => [newWorkOrder as any, ...prev]);
          setIsCreateWorkOrderModalOpen(false);

          navigate(
            `/tasks/${newWorkOrder.taskId}/workorders/${newWorkOrder.id}`,
            {
              state: { newWorkOrder },
            },
          );
        }}
      />

      {/* Column Filter Modal */}
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
    </PageTemplate>
  );
}
