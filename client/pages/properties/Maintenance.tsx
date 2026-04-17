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
import { Vendors } from "./Vendors";
import { useParams } from "react-router-dom";
import { getInitials } from "@/utils/getInitials";
import { fetchJSON } from "@/api/fetchJSON";
import { EditIcon, DeleteIcon, DocumentIcon } from "@/components/icons";
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
  billTotal: string;
  vendor: string;
}

interface FieldTeamOrder {
  id: number;
  taskId: number;
  /** Real task FK (nullable). Use for modal/update, not taskId. */
  task_id?: number | null;
  property: string;
  description: string;
  dueDate: string;
  priority: "low" | "normal" | "high";
  fieldTeam: Array<{ initials: string; color: string; name: string }>;
  status: "Dispatched" | "Completed" | "New" | "pending-approval";
  originalStatus: string; // Original API status for modal
  timesheetStatus:
    | "awaiting-submission"
    | "submitted"
    | "rejected"
    | "approved";
  amount: number;
  name: string;
  pm_assignee_ids?: number[];
  field_team_member_ids?: number[];
  due_date?: string; // Raw date for modal
  event_start_at?: string | null;
  event_end_at?: string | null;
}


interface APIFTO {
  id: number;
  task_id?: number;
  description: string;
  due_date: string;
  /** Most recent date_of_work from submissions; use for "Date of Work" column. */
  date_of_work?: string;
  priority: "low" | "normal" | "high";
  status: string;
  approval_status: string;
  form_submission_status: "none" | "partial" | "complete";
  amount_cents: number;
  total_amount: number;
  field_team_member_ids: number[];
  pm_assignee_ids: number[];
  name: string;
  property_name?: string;
  unit_id?: number;
  unit_name?: string;
  event_start_at?: string | null;
  event_end_at?: string | null;
}

// Misc submission (fto_id IS NULL) - for property-filtered misc expenses
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
  fto_name?: string; // repurposed for tech name in misc submissions
}

// Normalize FTO status from backend to display format
const normalizeFTOStatus = (status: string) => {
  if (status === "completed") return "Completed";
  if (status === "new") return "New";
  if (status === "dispatched") return "Dispatched";
  if (status === "cancelled") return "Cancelled";
  return status;
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

const transformAPIToFieldTeamOrders = (
  rows: any[],
  userMap: Record<number, { name: string; initials: string }>
): FieldTeamOrder[] => {
  return rows.map((row) => {
    const timesheetStatus = mapFormSubmissionToTimesheetStatus(
      row.form_submission_status || "none",
      row.approval_status
    );

    const displayDateSource = row.date_of_work ?? row.due_date;
    return {
      id: row.id,
      taskId: row.task_id ?? row.id,
      task_id: row.task_id ?? null,
      property: row.property_name ?? "",
      description: row.description,
      dueDate: displayDateSource ? toDateOnly(displayDateSource) : "",
      due_date: row.due_date, // Keep raw date for modal
      priority: (row.priority?.toLowerCase() as "low" | "normal" | "high") || "normal",
      status: normalizeFTOStatus(row.status) as
        | "Dispatched"
        | "Completed"
        | "New"
        | "pending-approval",
      originalStatus: row.status, // Keep original for modal
      timesheetStatus,
      amount: row.total_amount ?? 0,
      name: row.name,
      pm_assignee_ids: row.pm_assignee_ids ?? [],
      field_team_member_ids: row.field_team_member_ids ?? [],
      event_start_at: row.event_start_at ?? null,
      event_end_at: row.event_end_at ?? null,

      fieldTeam: (row.field_team_member_ids || [])
        .map((id: number) => {
          const u = userMap[id];
          if (!u) return null;
    
          return {
            name: u.name,
            initials: u.initials,
            color: "bg-[#2463EB]",
          };
        })
        .filter(Boolean),
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
    return (
      materials.reduce(
        (sum: number, m: { amount_cents?: number; upcharge_cents?: number }) =>
          sum + (m.amount_cents || 0) + (m.upcharge_cents || 0),
        0
      ) / 100
    );
  } catch {
    return 0;
  }
};

const transformAPIMiscSubmission = (
  apiData: APIMiscSubmissionResponse[]
): MiscSubmission[] => {
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
      techName: sub.fto_name || "Unknown Tech",
      amount: calculateMiscAmount(sub.MaterialsJSON),
      description: sub.Description || "Miscellaneous expense",
    };
  });
};

const ComingSoonPlaceholder = ({
  title,
  description = "This feature is under active development.",
}: {
  title: string;
  description?: string;
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[320px] gap-3 rounded-xl border border-dashed border-[#DADADA] bg-[#FAFAFA] text-center">
      <div className="text-3xl">🚧</div>
      <div className="text-lg font-medium text-[#09090B]">{title}</div>
      <div className="text-sm text-[#6B7280] max-w-sm">
        {description}
      </div>
    </div>
  );
};

const EmptyTableState = ({
  title,
  description,
  icon = "inbox",
}: {
  title: string;
  description?: string;
  icon?: "inbox" | "clipboard" | "calendar" | "users";
}) => {
  const icons = {
    inbox: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#A1A1A9]">
        <path d="M22 12h-6l-2 3h-4l-2-3H2" />
        <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
      </svg>
    ),
    clipboard: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#A1A1A9]">
        <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        <path d="M12 11h4" />
        <path d="M12 16h4" />
        <path d="M8 11h.01" />
        <path d="M8 16h.01" />
      </svg>
    ),
    calendar: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#A1A1A9]">
        <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
        <line x1="16" x2="16" y1="2" y2="6" />
        <line x1="8" x2="8" y1="2" y2="6" />
        <line x1="3" x2="21" y1="10" y2="10" />
      </svg>
    ),
    users: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#A1A1A9]">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  };
  return (
    <div className="flex flex-col items-center justify-center min-h-[280px] gap-4 rounded-xl border border-dashed border-[#DADADA] bg-[#FAFAFA] px-6 py-12 text-center">
      <div className="flex items-center justify-center">{icons[icon]}</div>
      <div className="text-base font-medium text-[#303030]">{title}</div>
      {description && (
        <div className="text-sm text-[#71717A] max-w-sm leading-relaxed">
          {description}
        </div>
      )}
    </div>
  );
};


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
    billTotal: "$420",
    vendor: "Acme Plumbing",
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
    billTotal: "No invoice",
    vendor: "—",
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
    name: "Emergency Water Damage",
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
    name: "HVAC Installation",
  },
];

interface MaintenanceProps {
  propertyAddress: string;
  propertyType: string;
  propertyUnits: number;
  propertyId: number;
}


const toDateOnly = (iso: string) => {
  if (!iso) return "";
  return iso.split("T")[0];
};

const getFTOStatusBadge = (status: string) => {
  const statusConfig: Record<string, { label: string; dotColor: string }> = {
    "New": { label: "New", dotColor: "#1E40AF" },
    "Dispatched": { label: "Dispatched", dotColor: "#B45309" },
    "Completed": { label: "Completed", dotColor: "#166534" },
    "Cancelled": { label: "Cancelled", dotColor: "#6B7280" },
    "pending-approval": { label: "New", dotColor: "#1E40AF" },
    // Handle lowercase versions for backwards compatibility
    "new": { label: "New", dotColor: "#1E40AF" },
    "dispatched": { label: "Dispatched", dotColor: "#B45309" },
    "completed": { label: "Completed", dotColor: "#166534" },
    "cancelled": { label: "Cancelled", dotColor: "#6B7280" },
  };

  const config = statusConfig[status] || statusConfig["New"];

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
  vendor: {
    label: "Vendor",
    icon: (
      <img
        loading="lazy"
        src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/3f6ece5f831bf0341b60fe742dd77e3f127dbd09?placeholderIfAbsent=true"
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
    label: "Date of Work",
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

const miscColumnConfig: Record<
  string,
  { label: string; icon: React.ReactNode }
> = {
  dateOfWork: { label: "Purchase Date", icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 6.66658H2M10.6667 1.33325V3.99992M5.33333 1.33325V3.99992M5.2 14.6666H10.8C11.9201 14.6666 12.4802 14.6666 12.908 14.4486C13.2843 14.2569 13.5903 13.9509 13.782 13.5746C14 13.1467 14 12.5867 14 11.4666V5.86659C14 4.74648 14 4.18643 13.782 3.7586C13.5903 3.38228 13.2843 3.07632 12.908 2.88457C12.4802 2.66659 11.9201 2.66659 10.8 2.66659H5.2C4.0799 2.66659 3.51984 2.66659 3.09202 2.88457C2.71569 3.07632 2.40973 3.38228 2.21799 3.7586C2 4.18643 2 4.74648 2 5.86658V11.4666C2 12.5867 2 13.1467 2.21799 13.5746C2.40973 13.9509 2.71569 14.2569 3.09202 14.4486C3.51984 14.6666 4.0799 14.6666 5.2 14.6666Z" stroke="#525252" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg> },
  description: { label: "Description", icon: <img loading="lazy" src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/d5d01db2db718e32f4e620e7b1fc6ea705e115b1?placeholderIfAbsent=true" style={{ width: "16px", height: "16px" }} alt="" /> },
  techName: { label: "Tech", icon: <img loading="lazy" src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/3f6ece5f831bf0341b60fe742dd77e3f127dbd09?placeholderIfAbsent=true" style={{ width: "16px", height: "16px" }} alt="" /> },
  status: { label: "Status", icon: <img loading="lazy" src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/137343a4a83566b73ded0282be168e468fbd729c?placeholderIfAbsent=true" style={{ width: "16px", height: "16px" }} alt="" /> },
  amount: { label: "Amount", icon: <img loading="lazy" src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/3b8ec0fa6eb0ec8e711c3a23fefa8083d72c2a94?placeholderIfAbsent=true" style={{ width: "16px", height: "16px" }} alt="" /> },
};

interface ApiTask {
  id: number;
  name: string;
  status: string;
  priority: string;
  due_date: string | null;
  last_updated: string;
  assignees: Array<{ id: number; name: string; email?: string }>;
}

interface ApiRecurringItem {
  id: number;
  property_id: number;
  category?: string | null;
  priority?: string | null;
  active: boolean;
  next_run_at: string;
  assignees: Array<{ id: number; name: string; initials: string }>;
}

/** Full series detail from GET /maintenance/recurring/:id — used for edit modal */
interface ApiRecurringSeriesDetail {
  id: number;
  property_id: number;
  unit_id: number | null;
  assignees: Array<{ id: number; name: string; initials: string }>;
  collaborators: Array<{ id: number; name: string; initials: string }>;
  priority: string | null;
  category: string | null;
  frequency: string;
  interval: number;
  by_day: string[];
  day_of_month: number | null;
  week_of_month: number | null;
  weekday_of_month: string | null;
  start_date: string;
  end_date: string | null;
  due_after_days: number;
  active: boolean;
  next_run_at?: string;
  last_run_at?: string | null;
}

interface ApiWorkOrder {
  id: number;
  task_id: number;
  name: string;
  description?: string;
  status: string;
  priority: string;
  due_date?: string;
  created_at: string;
  updated_at: string;
  property_name?: string;
  unit_id?: number;
  unit_name?: string;
  bill_total_cents?: number;
  vendor_name?: string | null;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function mapApiTaskToTask(a: ApiTask): Task {
  const mapPriority = (p: string) => {
    const q = (p || "").toLowerCase();
    if (q === "high" || q === "urgent") return "High";
    if (q === "low") return "Low";
    return "Normal";
  };
  const mapStatus = (s: string) => {
    const t = (s || "").toLowerCase();
    if (t === "completed" || t === "closed") return "Completed";
    if (t === "in_progress" || t === "scheduled" || t === "pending_vendor") return "In Progress";
    return "Not started";
  };
  return {
    id: a.id,
    title: a.name,
    status: mapStatus(a.status),
    due: formatDate(a.due_date),
    updated: formatDate(a.last_updated),
    priority: mapPriority(a.priority),
    assignees: (a.assignees || []).map((u) => ({
      id: u.id,
      name: u.name,
      initials: (u.name || "")
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 3),
    })),
  };
}

function mapApiRecurringToRecurring(r: ApiRecurringItem): RecurringTask {
  const p = (r.priority || "normal").toLowerCase();
  const priority = (p === "high" ? "high" : p === "low" ? "low" : "normal") as "low" | "normal" | "high";
  return {
    id: r.id,
    task: r.category || "Recurring",
    nextDate: formatDate(r.next_run_at),
    priority,
    category: r.category || "—",
    status: r.active ? "active" : "inactive",
    assignees: (r.assignees || []).map((u) => ({
      id: u.id,
      name: u.name,
      initials: u.initials || (u.name || "").slice(0, 2).toUpperCase(),
    })),
  };
}

function mapApiWorkOrderToWorkOrder(a: ApiWorkOrder): WorkOrder {
  const lower = (a.priority || "").toLowerCase();
  const priority = (lower === "high" || lower === "urgent" ? "high" : lower === "low" ? "low" : "normal") as "low" | "normal" | "high";
  const status = (a.status || "").toLowerCase();
  const done = status === "completed" || status === "closed";
  return {
    id: a.id,
    task: a.description || a.name,
    taskId: a.task_id,
    dueDate: formatDate(a.due_date || null),
    updatedDate: formatDate(a.updated_at),
    age: "—",
    priority,
    status: done ? "Completed" : "In progress",
    billTotal: a.bill_total_cents != null ? `$${(a.bill_total_cents / 100).toFixed(2)}` : "No invoice",
    vendor: (a.vendor_name || "").trim() || "—",
  };
}

export const Maintenance: React.FC<MaintenanceProps> = ({
  propertyAddress,
  propertyType,
  propertyUnits,
  propertyId: propertyIdProp,
}) => {
  const navigate = useNavigate();
  const { propertyId: propertyIdParam } = useParams();
  const propertyId = Number(propertyIdProp ?? propertyIdParam ?? 0);

  const [activeTab, setActiveTab] = usePageState<
    "tasks" | "recurring" | "workorders" | "fieldteam" | "vendors"
  >("activeTab", "tasks");
  const [openMenuId, setOpenMenuId] = usePageState<number | null>(
    "openMenuId",
    null,
  );

  const [tasksList, setTasksList] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [recurringTasksList, setRecurringTasksList] = useState<RecurringTask[]>([]);
  const [recurringLoading, setRecurringLoading] = useState(false);
  const [editingSeries, setEditingSeries] = useState<ApiRecurringSeriesDetail | null>(null);
  const [workOrdersList, setWorkOrdersList] = useState<WorkOrder[]>([]);
  const [workOrdersLoading, setWorkOrdersLoading] = useState(false);
  const [fieldTeamOrdersList, setFieldTeamOrdersList] = useState<FieldTeamOrder[]>([]);
  const [fieldTeamLoading, setFieldTeamLoading] = useState(false);
  const [ftoSubTab, setFtoSubTab] = usePageState<"ftos" | "misc">("ftoSubTab", "ftos");
  const [miscSubmissions, setMiscSubmissions] = useState<MiscSubmission[]>([]);
  const [miscLoading, setMiscLoading] = useState(false);
  const [miscSearchValue, setMiscSearchValue] = usePageState("miscSearchValue", "");

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
    "vendor",
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
  const miscColumnManagement = useColumnManagement([
    "dateOfWork",
    "description",
    "techName",
    "status",
    "amount",
  ]);

  // Sorting hooks for each table
  const { handleSortClick: handleTasksSortClick, getSortIndicator: getTasksSortIndicator, getSortedData: getTasksSortedData } = useSortingTable(tasksList);
  const { handleSortClick: handleRecurringSortClick, getSortIndicator: getRecurringSortIndicator, getSortedData: getRecurringSortedData } = useSortingTable(recurringTasksList);
  const { handleSortClick: handleWorkOrdersSortClick, getSortIndicator: getWorkOrdersSortIndicator, getSortedData: getWorkOrdersSortedData } = useSortingTable(workOrdersList);
  const { handleSortClick: handleFieldTeamSortClick, getSortIndicator: getFieldTeamSortIndicator, getSortedData: getFieldTeamSortedData } = useSortingTable(fieldTeamOrdersList);
  const filteredMiscSubmissions = miscSubmissions.filter((sub) => {
    if (propertyId != null && sub.propertyId != null && sub.propertyId !== propertyId) return false;
    const searchLower = miscSearchValue.toLowerCase();
    if (!searchLower) return true;
    return (
      sub.propertyName.toLowerCase().includes(searchLower) ||
      sub.dateOfWork.toLowerCase().includes(searchLower) ||
      sub.status.toLowerCase().includes(searchLower) ||
      sub.techName.toLowerCase().includes(searchLower) ||
      sub.description.toLowerCase().includes(searchLower)
    );
  });
  const { handleSortClick: handleMiscSortClick, getSortIndicator: getMiscSortIndicator, getSortedData: getMiscSortedData } = useSortingTable(filteredMiscSubmissions);

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

  const [miscPage, setMiscPage] = usePageState<number>("miscPage", 1);
  const [miscItemsPerPage, setMiscItemsPerPage] =
    usePageState<number>("miscItemsPerPage", 10);
  const [miscShowDropdown, setMiscShowDropdown] = useState(false);

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

  const miscSortedData = getMiscSortedData();
  const miscTotalPages = Math.max(
    1,
    Math.ceil(miscSortedData.length / miscItemsPerPage),
  );
  const paginatedMiscSubmissions = miscSortedData.slice(
    (miscPage - 1) * miscItemsPerPage,
    miscPage * miscItemsPerPage,
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

  useEffect(() => {
    if (miscPage > miscTotalPages) setMiscPage(miscTotalPages);
    if (miscPage < 1) setMiscPage(1);
  }, [miscPage, miscTotalPages, setMiscPage]);

  const tasksCanGoPrev = tasksPage > 1;
  const tasksCanGoNext = tasksPage < tasksTotalPages;
  const recurringCanGoPrev = recurringPage > 1;
  const recurringCanGoNext = recurringPage < recurringTotalPages;
  const workordersCanGoPrev = workordersPage > 1;
  const workordersCanGoNext = workordersPage < workordersTotalPages;
  const fieldteamCanGoPrev = fieldteamPage > 1;
  const fieldteamCanGoNext = fieldteamPage < fieldteamTotalPages;

  const [fieldTeamUsers, setFieldTeamUsers] = useState<
    Record<number, { name: string; initials: string }>
  >({});


  const handleApproveFTO = useCallback(
    (order: FieldTeamOrder) => {
      navigate(`/field-team-orders/approve/${order.id}`, {
        state: {
          ftoName: order.description,
          property: order.property,
          unit: "",
          fieldTeamAssignee: order.fieldTeam?.[0]?.name ?? "",
          task: order.name,
          description: order.description,
          dueDate: order.dueDate,
          priority: order.priority,
        },
      });
    },
    [navigate]
  );


  const handleDeleteFTO = useCallback(
    async (order: FieldTeamOrder) => {
      const confirmed = window.confirm(
        `Are you sure you want to delete "${order.name}"?\nThis cannot be undone.`
      );
      if (!confirmed) return;

      try {
        await fetchJSON(`/maintenance/ftos?id=${order.id}`, { method: "DELETE" });
        setFieldTeamOrdersList((prev) => prev.filter((o) => o.id !== order.id));
      } catch (err) {
        console.error("Delete FTO failed", err);
        alert("Failed to delete Field Team Order. Please try again.");
      }
    },
    []
  );

  const shouldHandlePropertyEvent = useCallback(
    (detail?: { propertyId?: number; property_id?: number }) => {
      if (!propertyId) return false;
      const incoming = Number(detail?.propertyId ?? detail?.property_id ?? 0);
      if (!incoming) return true;
      return incoming === propertyId;
    },
    [propertyId]
  );

  const fetchFTOs = useCallback(
    async (options?: { showLoading?: boolean }) => {
      if (!propertyId) return;
      const showLoading = options?.showLoading ?? true;
      if (showLoading) setFieldTeamLoading(true);
      try {
        const data: APIFTO[] = await fetchJSON(
          `/maintenance/ftos?property_id=${propertyId}&limit=200`
        );
        const filteredData = data.filter((fto) => fto.status !== "cancelled");
        const transformed = transformAPIToFieldTeamOrders(filteredData, fieldTeamUsers);
        setFieldTeamOrdersList(transformed);
      } catch (err) {
        console.error("Failed to fetch field team orders", err);
        setFieldTeamOrdersList([]);
      } finally {
        if (showLoading) setFieldTeamLoading(false);
      }
    },
    [propertyId, fieldTeamUsers]
  );

  const fetchMiscSubmissions = useCallback(async (options?: { showLoading?: boolean }) => {
    const showLoading = options?.showLoading ?? true;
    if (showLoading) setMiscLoading(true);
    try {
      const raw = await fetchJSON(`/maintenance/submissions/misc`);
      const apiData: APIMiscSubmissionResponse[] = Array.isArray(raw)
        ? raw
        : (raw as any)?.data ?? (raw as any)?.items ?? (raw as any)?.results ?? [];
      const transformed = transformAPIMiscSubmission(apiData);
      setMiscSubmissions(transformed);
    } catch (err) {
      console.error("Failed to fetch misc submissions", err);
      setMiscSubmissions([]);
    } finally {
      if (showLoading) setMiscLoading(false);
    }
  }, []);

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

  const fetchTasks = useCallback(
    async (options?: { showLoading?: boolean }) => {
      if (!propertyId) return;
      const showLoading = options?.showLoading ?? true;
      if (showLoading) setTasksLoading(true);
      try {
        const data: ApiTask[] = await fetchJSON(
          `/maintenance/tasks?property_id=${propertyId}&limit=500`
        );
        setTasksList((data || []).map(mapApiTaskToTask));
      } catch (err) {
        console.error("Failed to fetch tasks", err);
        setTasksList([]);
      } finally {
        if (showLoading) setTasksLoading(false);
      }
    },
    [propertyId]
  );

  const fetchRecurring = useCallback(
    async (options?: { showLoading?: boolean }) => {
      if (!propertyId) return;
      const showLoading = options?.showLoading ?? true;
      if (showLoading) setRecurringLoading(true);
      try {
        const data: ApiRecurringItem[] = await fetchJSON(
          `/maintenance/recurring?property_id=${propertyId}`
        );
        setRecurringTasksList((data || []).map(mapApiRecurringToRecurring));
      } catch (err) {
        console.error("Failed to fetch recurring tasks", err);
        setRecurringTasksList([]);
      } finally {
        if (showLoading) setRecurringLoading(false);
      }
    },
    [propertyId]
  );

  const fetchWorkOrders = useCallback(
    async (options?: { showLoading?: boolean }) => {
      if (!propertyId) return;
      const showLoading = options?.showLoading ?? true;
      if (showLoading) setWorkOrdersLoading(true);
      try {
        const data: ApiWorkOrder[] = await fetchJSON(
          `/maintenance/work-orders?property_id=${propertyId}&limit=500`
        );
        setWorkOrdersList((Array.isArray(data) ? data : []).map(mapApiWorkOrderToWorkOrder));
      } catch (err) {
        console.error("Failed to fetch work orders", err);
        setWorkOrdersList([]);
      } finally {
        if (showLoading) setWorkOrdersLoading(false);
      }
    },
    [propertyId]
  );

  useEffect(() => {
    if (activeTab !== "fieldteam" || !propertyId) return;
    fetchFTOs();
  }, [activeTab, propertyId, fetchFTOs]);

  useEffect(() => {
    if (activeTab !== "fieldteam" || ftoSubTab !== "misc") return;
    if (miscSubmissions.length === 0) fetchMiscSubmissions();
  }, [activeTab, ftoSubTab, miscSubmissions.length, fetchMiscSubmissions]);

  useEffect(() => {
    if ((activeTab !== "tasks" && activeTab !== "workorders") || !propertyId) return;
    fetchTasks();
  }, [activeTab, propertyId, fetchTasks]);

  useEffect(() => {
    if (activeTab !== "recurring" || !propertyId) return;
    fetchRecurring();
  }, [activeTab, propertyId, fetchRecurring]);

  useEffect(() => {
    if (activeTab !== "workorders" || !propertyId) return;
    fetchWorkOrders();
  }, [activeTab, propertyId, fetchWorkOrders]);

  useEffect(() => {
    const handleTasksRefresh = (event: Event) => {
      const detail = (event as CustomEvent).detail as
        | { propertyId?: number; property_id?: number }
        | undefined;
      if (!shouldHandlePropertyEvent(detail)) return;
      fetchTasks({ showLoading: false });
    };
    const handleRecurringRefresh = (event: Event) => {
      const detail = (event as CustomEvent).detail as
        | { propertyId?: number; property_id?: number }
        | undefined;
      if (!shouldHandlePropertyEvent(detail)) return;
      fetchRecurring({ showLoading: false });
    };
    const handleWorkOrdersRefresh = (event: Event) => {
      const detail = (event as CustomEvent).detail as
        | { propertyId?: number; property_id?: number }
        | undefined;
      if (!shouldHandlePropertyEvent(detail)) return;
      fetchWorkOrders({ showLoading: false });
    };
    const handleFieldTeamRefresh = (event: Event) => {
      const detail = (event as CustomEvent).detail as
        | { propertyId?: number; property_id?: number }
        | undefined;
      if (!shouldHandlePropertyEvent(detail)) return;
      fetchFTOs({ showLoading: false });
      if (ftoSubTab === "misc") fetchMiscSubmissions({ showLoading: false });
    };

    window.addEventListener("refreshAllTasks", handleTasksRefresh);
    window.addEventListener("refreshRecurringTasks", handleRecurringRefresh);
    window.addEventListener("refreshWorkOrders", handleWorkOrdersRefresh);
    window.addEventListener("refreshFieldTeamOrders", handleFieldTeamRefresh);

    return () => {
      window.removeEventListener("refreshAllTasks", handleTasksRefresh);
      window.removeEventListener("refreshRecurringTasks", handleRecurringRefresh);
      window.removeEventListener("refreshWorkOrders", handleWorkOrdersRefresh);
      window.removeEventListener("refreshFieldTeamOrders", handleFieldTeamRefresh);
    };
  }, [
    fetchTasks,
    fetchRecurring,
    fetchWorkOrders,
    fetchFTOs,
    fetchMiscSubmissions,
    ftoSubTab,
    shouldHandlePropertyEvent,
  ]);

  const handleEditRecurringTask = useCallback(
    async (task: RecurringTask) => {
      try {
        const series: ApiRecurringSeriesDetail = await fetchJSON(
          `/maintenance/recurring/${task.id}`
        );
        setEditingRecurringTask(task);
        setEditingSeries(series);
        setShowCreateRecurringTaskModal(true);
      } catch (err) {
        console.error("Failed to load recurring task", err);
      }
    },
    []
  );

  const handleDeleteRecurringTask = useCallback(
    async (task: RecurringTask) => {
      if (
        !window.confirm(
          "Are you sure you want to delete this recurring task? This action cannot be undone."
        )
      )
        return;
      try {
        await fetchJSON(`/maintenance/recurring/${task.id}`, { method: "DELETE" });
        fetchRecurring();
      } catch (err) {
        console.error("Failed to delete recurring task", err);
      }
    },
    [fetchRecurring]
  );

  

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
  const [editingFTOId, setEditingFTOId] = usePageState<number | null>(
    "editingFTOId",
    null
  );

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

  useEffect(() => {
    if (activeTab !== "fieldteam") return;
  
    let cancelled = false;
  
    async function loadFieldTeamUsers() {
      try {
        const [fieldTeam, propertyManagers] = await Promise.all([
          fetchJSON("/users/field-team").catch(() => []),
          fetchJSON("/users/property-managers").catch(() => []),
        ]);
  
        if (cancelled) return;
  
        const map: Record<number, { name: string; initials: string }> = {};
        const seen = new Set<number>();
        for (const u of [...fieldTeam, ...propertyManagers]) {
          const id = Number((u as any).id);
          if (seen.has(id)) continue;
          seen.add(id);
          const name = (u as any).name || (u as any).email || "";
          map[id] = { name, initials: getInitials(name) };
        }
  
        setFieldTeamUsers(map);
      } catch (err) {
        console.error("Failed to load field team users", err);
      }
    }
  
    loadFieldTeamUsers();
    return () => {
      cancelled = true;
    };
  }, [activeTab]);
  
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
    { id: "vendors" as const, label: "Vendors" },
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

  return (
    <div className="flex flex-col gap-6">
      {/* Navigation and Action Button */}
      <div className="flex items-start justify-between gap-6 flex-wrap">
        {/* Segmented Tabs */}
        <div
          className="flex items-start min-w-[240px] max-w-[601px] flex-1 p-0.5 rounded-lg bg-[#F9F9F9] overflow-hidden"
          style={{ boxShadow: "0px 0px 0px 1px #D2D1CF" }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center px-4 py-1.5 rounded-md text-sm font-medium text-center whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? "bg-white text-[#09090B] font-medium shadow-[0_1px_1px_0_rgba(11,19,36,0.1),0_1px_3px_0_rgba(11,19,36,0.1)]"
                  : "text-[#282828] hover:text-[#09090B]"
              }`}
              style={{ lineHeight: "1.43" }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Create / Add Button - same as All pages, per active tab */}
        {activeTab === "tasks" && (
          <button
            onClick={() => setShowCreateTaskModal(true)}
            className="flex items-center gap-2 px-3 py-2 min-h-[36px] rounded-lg border border-white bg-[#013764] text-white font-medium text-base overflow-hidden transition-colors hover:bg-[#002D5A]"
            style={{ boxShadow: "0px 0px 0px 1px #002D5A" }}
          >
            <img
              loading="lazy"
              src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/1a46511ba98f469f36b0bbeec24c0e7684e3ff9a?placeholderIfAbsent=true"
              alt=""
              className="w-5 h-5 object-contain"
            />
            <span>Add Task</span>
          </button>
        )}
        {activeTab === "recurring" && (
          <button
            onClick={() => {
              setEditingRecurringTask(null);
              setEditingSeries(null);
              setShowCreateRecurringTaskModal(true);
            }}
            className="flex items-center gap-2 px-3 py-2 min-h-[36px] rounded-lg border border-white bg-[#013764] text-white font-medium text-base overflow-hidden transition-colors hover:bg-[#002D5A]"
            style={{ boxShadow: "0px 0px 0px 1px #002D5A" }}
          >
            <img
              loading="lazy"
              src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/1a46511ba98f469f36b0bbeec24c0e7684e3ff9a?placeholderIfAbsent=true"
              alt=""
              className="w-5 h-5 object-contain"
            />
            <span>Create Recurring Task</span>
          </button>
        )}
        {activeTab === "workorders" && (
          <button
            onClick={() => setShowCreateWorkOrderModal(true)}
            className="flex items-center gap-2 px-3 py-2 min-h-[36px] rounded-lg border border-white bg-[#013764] text-white font-medium text-base overflow-hidden transition-colors hover:bg-[#002D5A]"
            style={{ boxShadow: "0px 0px 0px 1px #002D5A" }}
          >
            <img
              loading="lazy"
              src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/1a46511ba98f469f36b0bbeec24c0e7684e3ff9a?placeholderIfAbsent=true"
              alt=""
              className="w-5 h-5 object-contain"
            />
            <span>Create Work Order</span>
          </button>
        )}
        {activeTab === "fieldteam" && (
          <div className="flex items-center gap-4">
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
              onClick={() => {
                setEditingFTOId(null);
                setShowCreateFTOModal(true);
              }}
              className="flex items-center gap-2 px-3 py-2 min-h-[36px] rounded-lg border border-white bg-[#013764] text-white font-medium text-base overflow-hidden transition-colors hover:bg-[#002D5A]"
              style={{ boxShadow: "0px 0px 0px 1px #002D5A" }}
            >
              <img
                loading="lazy"
                src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/1a46511ba98f469f36b0bbeec24c0e7684e3ff9a?placeholderIfAbsent=true"
                alt=""
                className="w-5 h-5 object-contain"
              />
              <span>Create FTO</span>
            </button>
          </div>
        )}

      </div>

      {/* Field Team Orders inner tabs (FTOs | Misc Expenses) */}
      {activeTab === "fieldteam" && (
        <div className="flex gap-1 border-b border-[#E5E5E5]">
          <button
            type="button"
            onClick={() => {
              setFtoSubTab("ftos");
              setFieldteamPage(1);
            }}
            className={cn(
              "px-4 py-2.5 text-sm font-medium transition-colors relative",
              ftoSubTab === "ftos" ? "text-[#013764]" : "text-[#717179] hover:text-[#303030]"
            )}
          >
            Field Team Orders
            {ftoSubTab === "ftos" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#013764]" />
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              setFtoSubTab("misc");
              setMiscPage(1);
              if (miscSubmissions.length === 0) fetchMiscSubmissions();
            }}
            className={cn(
              "px-4 py-2.5 text-sm font-medium transition-colors relative",
              ftoSubTab === "misc" ? "text-[#013764]" : "text-[#717179] hover:text-[#303030]"
            )}
          >
            Misc Expenses
            {ftoSubTab === "misc" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#013764]" />
            )}
          </button>
        </div>
      )}

      {/* Tasks Table */}
      {activeTab === "tasks" &&
        (tasksLoading ? (
          <div className="flex justify-center py-12 text-gray-500">
            Loading tasks…
          </div>
        ) : tasksList.length === 0 ? (
          <EmptyTableState
            icon="clipboard"
            title="No tasks for this property"
            description="Tasks you create or assign to this property will appear here."
          />
        ) : (
          <GlobalTable
            columns={tasksColumnManagement.columnOrder
              .filter((k) => tasksColumnManagement.visibleColumns.has(k))
              .map((key) => ({
                key,
                label: tasksColumnConfig[key]?.label ?? key,
                icon: tasksColumnConfig[key]?.icon,
              }))}
            data={tasksList}
            rowKey="id"
            renderCell={(row: Task, columnKey: string) => {
              switch (columnKey) {
                case "priority":
                  return (
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{
                          backgroundColor:
                            row.priority === "Low"
                              ? "#059669"
                              : row.priority === "High"
                                ? "#d97706"
                                : "#2463eb",
                        }}
                      />
                      <span className="text-gray-900 font-normal text-sm">{row.priority}</span>
                    </div>
                  );
                case "status":
                  return (
                    <span
                      className={`text-sm font-normal ${getStatusBadgeColor(row.status)} px-2 py-0.5 rounded-full`}
                    >
                      {row.status}
                    </span>
                  );
                case "title":
                  return (
                    <span className="text-gray-900 font-normal text-sm">{row.title}</span>
                  );
                case "due":
                  return (
                    <span className="text-gray-900 font-normal text-sm">{row.due}</span>
                  );
                case "assignees":
                  return (
                    <div className="flex items-center gap-1">
                      {(row.assignees || []).slice(0, 3).map((a, i) => (
                        <div
                          key={i}
                          className="w-7 h-7 rounded-full bg-[#2463EB] flex items-center justify-center text-white text-xs font-medium"
                          title={a.name}
                        >
                          {a.initials}
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
            onRowClick={(row: Task, e: React.MouseEvent) => {
              navigate(`/tasks/${row.id}`);
            }}
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
                  <circle cx="8" cy="3" r="1.5" fill="#303030" />
                  <circle cx="8" cy="8" r="1.5" fill="#303030" />
                  <circle cx="8" cy="13" r="1.5" fill="#303030" />
                </svg>
              </button>
            }
          />
        ))}

      {/* Recurring Tasks Table */}
      {activeTab === "recurring" &&
        (recurringLoading ? (
          <div className="flex justify-center py-12 text-gray-500">
            Loading recurring tasks…
          </div>
        ) : recurringTasksList.length === 0 ? (
          <EmptyTableState
            icon="calendar"
            title="No recurring tasks for this property"
            description="Set up recurring maintenance (e.g. monthly inspections) to see them here."
          />
        ) : (
          <GlobalTable
            columns={recurringColumnManagement.columnOrder
              .filter((k) => recurringColumnManagement.visibleColumns.has(k))
              .map((key) => ({
                key,
                label: recurringTasksColumnConfig[key]?.label ?? key,
                icon: recurringTasksColumnConfig[key]?.icon,
              }))}
            data={recurringTasksList}
            rowKey="id"
            actions={[
              {
                label: "Edit",
                icon: <EditIcon width={18} height={18} color="#525252" />,
                onClick: handleEditRecurringTask,
              },
              {
                label: "Delete",
                icon: <DeleteIcon width={18} height={18} color="#982740" />,
                onClick: handleDeleteRecurringTask,
              },
            ]}
            renderCell={(row: RecurringTask, columnKey: string) => {
              switch (columnKey) {
                case "priority":
                  return (
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{
                          backgroundColor:
                            row.priority === "low"
                              ? "#059669"
                              : row.priority === "high"
                                ? "#d97706"
                                : "#2463eb",
                        }}
                      />
                      <span className="text-gray-900 font-normal text-sm capitalize">{row.priority}</span>
                    </div>
                  );
                case "task":
                  return (
                    <span className="text-gray-900 font-normal text-sm">{row.task}</span>
                  );
                case "nextDate":
                  return (
                    <span className="text-gray-900 font-normal text-sm">{row.nextDate}</span>
                  );
                case "category":
                  return (
                    <span className="text-gray-900 font-normal text-sm">{row.category}</span>
                  );
                case "assignees":
                  return (
                    <div className="flex items-center gap-1">
                      {(row.assignees || []).slice(0, 3).map((a, i) => (
                        <div
                          key={i}
                          className="w-7 h-7 rounded-full bg-[#2463EB] flex items-center justify-center text-white text-xs font-medium"
                          title={a.name}
                        >
                          {a.initials}
                        </div>
                      ))}
                    </div>
                  );
                case "status":
                  return (
                    <span
                      className={`text-sm font-normal px-2 py-0.5 rounded-full ${
                        row.status === "active"
                          ? "bg-emerald-100 text-emerald-600"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {row.status}
                    </span>
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
            onRowClick={(row: RecurringTask, _e: React.MouseEvent) => {
              handleEditRecurringTask(row);
            }}
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
                  <circle cx="8" cy="3" r="1.5" fill="#303030" />
                  <circle cx="8" cy="8" r="1.5" fill="#303030" />
                  <circle cx="8" cy="13" r="1.5" fill="#303030" />
                </svg>
              </button>
            }
          />
        ))}

      {/* Work Orders Table */}
      {activeTab === "workorders" &&
        (workOrdersLoading ? (
          <div className="flex justify-center py-12 text-gray-500">
            Loading work orders…
          </div>
        ) : workOrdersList.length === 0 ? (
          <EmptyTableState
            icon="inbox"
            title="No work orders for this property"
            description="Work orders linked to tasks at this property will show up here."
          />
        ) : (
          <GlobalTable
            columns={workordersColumnManagement.columnOrder
              .filter((k) => workordersColumnManagement.visibleColumns.has(k))
              .map((key) => ({
                key,
                label: workOrdersColumnConfig[key]?.label ?? key,
                icon: workOrdersColumnConfig[key]?.icon,
              }))}
            data={workOrdersList}
            rowKey="id"
            renderCell={(row: WorkOrder, columnKey: string) => {
              switch (columnKey) {
                case "priority":
                  return (
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{
                          backgroundColor:
                            row.priority === "low"
                              ? "#059669"
                              : row.priority === "high"
                                ? "#d97706"
                                : "#2463eb",
                        }}
                      />
                      <span className="text-gray-900 font-normal text-sm capitalize">{row.priority}</span>
                    </div>
                  );
                case "status":
                  return (
                    <span
                      className={`text-sm font-normal ${getStatusBadgeColor(row.status)} px-2 py-0.5 rounded-full`}
                    >
                      {row.status}
                    </span>
                  );
                case "task":
                  return (
                    <span className="text-gray-900 font-normal text-sm">{row.task}</span>
                  );
                case "dueDate":
                  return (
                    <span className="text-gray-900 font-normal text-sm">{row.dueDate}</span>
                  );
                case "vendor":
                  return (
                    <span className="text-gray-900 font-normal text-sm">{row.vendor}</span>
                  );
                case "billTotal":
                  return (
                    <span className="text-gray-900 font-normal text-sm">{row.billTotal}</span>
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
            onRowClick={(row: WorkOrder, e: React.MouseEvent) => {
              navigate(`/tasks/${row.taskId}/workorders/${row.id}`);
            }}
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
                  <circle cx="8" cy="3" r="1.5" fill="#303030" />
                  <circle cx="8" cy="8" r="1.5" fill="#303030" />
                  <circle cx="8" cy="13" r="1.5" fill="#303030" />
                </svg>
              </button>
            }
          />
        ))}


      {/* Field Team Orders Table */}
      {activeTab === "fieldteam" && ftoSubTab === "ftos" &&
        (fieldTeamLoading ? (
          <div className="flex items-center justify-center py-12 text-gray-500">
            Loading field team orders…
          </div>
        ) : fieldTeamOrdersList.length === 0 ? (
          <EmptyTableState
            icon="users"
            title="No field team orders for this property"
            description="Create or dispatch FTOs for this property to see them here."
          />
        ) : (
        <GlobalTable
          columns={[
            { key: "priority", label: "Priority", icon: fieldTeamColumnConfig.priority.icon },
            { key: "description", label: "Description", icon: fieldTeamColumnConfig.description.icon },
            { key: "dueDate", label: "Date of Work", icon: fieldTeamColumnConfig.dueDate.icon },
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
                handleApproveFTO(order);
              },
            },
            {
              label: "Edit",
              icon: (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M15.75 15.7502H9.75002M1.875 16.1252L6.03695 14.5245C6.30316 14.4221 6.43626 14.3709 6.56079 14.3041C6.6714 14.2447 6.77685 14.1761 6.87603 14.0992C6.98769 14.0125 7.08853 13.9117 7.29021 13.71L15.75 5.25023C16.5784 4.4218 16.5784 3.07865 15.75 2.25023C14.9216 1.4218 13.5784 1.4218 12.75 2.25022L4.29021 10.71C4.08853 10.9117 3.98769 11.0125 3.90104 11.1242C3.82408 11.2234 3.75555 11.3288 3.69618 11.4394C3.62933 11.564 3.57814 11.6971 3.47575 11.9633L1.875 16.1252ZM1.875 16.1252L3.41859 12.1119C3.52905 11.8248 3.58428 11.6812 3.67901 11.6154C3.76179 11.5579 3.86423 11.5362 3.96322 11.5551C4.0765 11.5767 4.18529 11.6855 4.40286 11.9031L6.09718 13.5974C6.31475 13.815 6.42354 13.9237 6.44517 14.037C6.46408 14.136 6.44234 14.2385 6.38486 14.3212C6.31908 14.416 6.17549 14.4712 5.8883 14.5817L1.875 16.1252Z"
                    stroke="#525252"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ),
              onClick: (order: FieldTeamOrder) => {
                setEditingFTOId(order.id);
                setShowCreateFTOModal(true);
              },              
            },
            {
              label: "Delete",
              icon: (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M6.75 2.25H11.25M2.25 4.5H15.75M14.25 4.5L13.724 12.3895C13.6451 13.5732 13.6057 14.165 13.35 14.6138C13.1249 15.0088 12.7854 15.3265 12.3762 15.5248C11.9115 15.75 11.3183 15.75 10.132 15.75H7.86799C6.68168 15.75 6.08852 15.75 5.62375 15.5248C5.21457 15.3265 4.87507 15.0088 4.64999 14.6138C4.39433 14.165 4.35488 13.5732 4.27596 12.3895L3.75 4.5M7.5 7.875V11.625M10.5 7.875V11.625"
                    stroke="#982740"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ),
              onClick: handleDeleteFTO,
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
              case "dueDate":
                return (
                  <span className="text-gray-900 font-normal text-sm">
                    {order.dueDate
                      ? new Date(order.dueDate + "T00:00:00").toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "—"}
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
            handleApproveFTO(order);
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
        )
      )}

      {/* Misc Expenses Table (property-filtered) */}
      {activeTab === "fieldteam" && ftoSubTab === "misc" &&
        (miscLoading ? (
          <div className="flex items-center justify-center py-12 text-gray-500">
            Loading miscellaneous expenses…
          </div>
        ) : filteredMiscSubmissions.length === 0 ? (
          <EmptyTableState
            icon="inbox"
            title="No misc expenses for this property"
            description="Miscellaneous expenses for this property will appear here."
          />
        ) : (
          <GlobalTable
            columns={miscColumnManagement.columnOrder
              .filter((k) => miscColumnManagement.visibleColumns.has(k))
              .map((key) => ({
                key,
                label: miscColumnConfig[key]?.label ?? key,
                icon: miscColumnConfig[key]?.icon,
              }))}
            data={filteredMiscSubmissions}
            rowKey="id"
            showSearchBar={true}
            searchValue={miscSearchValue}
            onSearchChange={setMiscSearchValue}
            renderCell={(sub: MiscSubmission, columnKey: string) => {
              switch (columnKey) {
                case "dateOfWork":
                  return (
                    <span className="text-gray-900 font-normal text-sm truncate">
                      {sub.dateOfWork}
                    </span>
                  );
                case "description":
                  return (
                    <span className="text-gray-900 font-normal text-sm truncate">
                      {sub.description}
                    </span>
                  );
                case "techName":
                  return (
                    <div className="flex items-center gap-2">
                      <div className="relative group">
                        <div
                          className="w-7 h-7 rounded-full bg-[#2463EB] flex items-center justify-center text-white text-xs font-semibold border border-gray-300 cursor-pointer"
                          title={sub.techName}
                        >
                          {getInitials(sub.techName)}
                        </div>
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-50">
                          {sub.techName}
                        </div>
                      </div>
                    </div>
                  );
                case "status":
                  return (
                    <span
                      className={`text-sm font-normal px-2 py-0.5 rounded-full ${
                        sub.status === "approved"
                          ? "bg-emerald-100 text-emerald-600"
                          : sub.status === "rejected"
                            ? "bg-red-100 text-red-600"
                            : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {sub.status}
                    </span>
                  );
                case "amount":
                  return (
                    <span className="text-gray-900 font-normal text-sm">
                      ${sub.amount.toFixed(2)}
                    </span>
                  );
                default:
                  return null;
              }
            }}
            sortingHook={{
              handleSortClick: handleMiscSortClick,
              getSortIndicator: getMiscSortIndicator,
              getSortedData: getMiscSortedData,
            }}
            columnManagementHook={miscColumnManagement}
            currentPage={miscPage}
            onPageChange={setMiscPage}
            itemsPerPage={miscItemsPerPage}
            onItemsPerPageChange={setMiscItemsPerPage}
            showPageSizeDropdown={miscShowDropdown}
            onShowPageSizeDropdownChange={setMiscShowDropdown}
            openMenuId={openMenuId}
            onOpenMenuIdChange={setOpenMenuId}
            title="Misc Expenses"
            showColumnModal={miscColumnManagement.showColumnModal}
            onShowColumnModalChange={miscColumnManagement.setShowColumnModal}
            onRowClick={(sub: MiscSubmission, _e: React.MouseEvent) => {
              handleViewMiscSubmission(sub);
            }}
            actions={[
              {
                label: "View",
                icon: (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 3C4.5 3 1.5 8 1.5 8C1.5 8 4.5 13 8 13C11.5 13 14.5 8 14.5 8C14.5 8 11.5 3 8 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                ),
                onClick: handleViewMiscSubmission,
              },
              {
                label: "Approve",
                icon: (
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2.25 8.97L6.75 13.47L15.75 4.47" stroke="#0A7F2F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ),
                onClick: handleApproveMiscSubmission,
              },
            ]}
            headerActions={
              <button
                ref={miscColumnManagement.columnButtonRef}
                onClick={() => {
                  setMiscShowDropdown(false);
                  setOpenMenuId(null);
                  miscColumnManagement.setShowColumnModal((prev) => !prev);
                }}
                className="flex h-9 w-9 justify-center items-center rounded-lg border border-[#DADADA] bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] hover:bg-gray-50 transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="8" cy="3" r="1.5" fill="#303030" />
                  <circle cx="8" cy="8" r="1.5" fill="#303030" />
                  <circle cx="8" cy="13" r="1.5" fill="#303030" />
                </svg>
              </button>
            }
          />
        )
      )}

      {/* Vendors Tab Content */}
      {activeTab === "vendors" && (
        <Vendors
          propertyAddress={propertyAddress}
          propertyType={propertyType}
          propertyUnits={propertyUnits}
        />
      )}

      {/* Create Task Modal */}
      <CreateTaskModal
        open={showCreateTaskModal}
        onOpenChange={setShowCreateTaskModal}
        defaultPropertyId={propertyId || undefined}
      />

      {/* Create Recurring Task Modal */}
      <CreateRecurringTaskModal
        open={showCreateRecurringTaskModal}
        onOpenChange={(open) => {
          setShowCreateRecurringTaskModal(open);
          if (!open) {
            setEditingRecurringTask(null);
            setEditingSeries(null);
          }
        }}
        editData={
          editingRecurringTask && editingSeries
            ? {
                id: editingSeries.id,
                task: editingRecurringTask.task,
                series: editingSeries,
              }
            : undefined
        }
        defaultPropertyId={propertyId || undefined}
      />

      {/* Create Work Order Modal (same as All Work Orders); property-level: task empty, dropdown = tasks for this property only */}
      <CreateWorkOrderModalV2
        open={showCreateWorkOrderModal}
        onOpenChange={setShowCreateWorkOrderModal}
        mode="create"
        propertyId={propertyId || undefined}
        taskOptions={tasksList.map((t) => ({ id: t.id, label: t.title }))}
      />

      {/* Create FTO Modal */}
      <CreateFTOModal
        open={showCreateFTOModal}
        onOpenChange={(open) => {
          setShowCreateFTOModal(open);
          if (!open) {
            setEditingFTOId(null);
          }
        }}
        editingFTO={
          editingFTOId
            ? (() => {
                const order = fieldTeamOrdersList.find((o) => o.id === editingFTOId);
                if (!order) return null;

                return {
                  id: order.id,
                  name: order.name,
                  description: order.description,
                  priority: order.priority,
                  status: order.originalStatus as "new" | "dispatched" | "completed" | "cancelled",
                  due_date: order.due_date || order.dueDate,
                  property_id: propertyId!,
                  task_id: order.task_id ?? undefined,
                  field_team_member_ids: order.field_team_member_ids ?? [],
                  pm_assignee_ids: order.pm_assignee_ids ?? [],
                  event_start_at: order.event_start_at ?? null,
                  event_end_at: order.event_end_at ?? null,
                };
              })()
            : null
        }
        lockedPropertyId={propertyId || undefined}
        lockedPropertyLabel={propertyAddress}
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

      {/* Misc Expenses Column Filter Modal */}
      <ColumnFilterModal
        isOpen={miscColumnManagement.showColumnModal}
        position={miscColumnManagement.columnMenuPos}
        columns={miscColumnManagement.columnOrder.map((key) => ({
          key,
          label: miscColumnConfig[key]?.label || key,
          icon: miscColumnConfig[key]?.icon,
        }))}
        visibleColumns={miscColumnManagement.visibleColumns}
        onToggleColumn={miscColumnManagement.toggleColumnVisibility}
        onClose={() => miscColumnManagement.setShowColumnModal(false)}
        buttonRef={miscColumnManagement.columnButtonRef}
      />
    </div>
  );
};
