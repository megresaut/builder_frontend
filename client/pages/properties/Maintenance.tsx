import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { usePageState } from "@/hooks/usePageState";

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
  priority: "High" | "Low" | "Normal";
  category: string;
  status: "active" | "inactive";
  assignees: Array<{ id: number; name: string; initials: string }>;
}

interface WorkOrder {
  id: number;
  task: string;
  dueDate: string;
  updatedDate: string;
  age: string;
  priority: "High" | "Low" | "Normal";
  status: "In progress" | "Completed";
  billStatus: "Paid" | "Unpaid" | "Awaiting Invoice";
  billTotal: string;
  assignees: Array<{ id: number; name: string; initials: string }>;
}

interface FieldTeamOrder {
  id: number;
  property: string;
  description: string;
  dueDate: string;
  fieldTeam: Array<{ initials: string; color: string; name: string }>;
  status: "dispatched" | "approved" | "pending-approval";
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
    priority: "High",
    category: "Maintenance",
    status: "active",
    assignees: [{ id: 1, name: "Jerry Sanchez", initials: "JS" }],
  },
  {
    id: 2,
    task: "Quarterly Deep Clean",
    nextDate: "Sep 29, 2025",
    priority: "Normal",
    category: "Cleaning",
    status: "active",
    assignees: [{ id: 2, name: "John Doe", initials: "JD" }],
  },
  {
    id: 3,
    task: "HVAC Filter Replacement",
    nextDate: "Sep 10, 2025",
    priority: "Normal",
    category: "HVAC",
    status: "active",
    assignees: [{ id: 3, name: "Jane Smith", initials: "JS" }],
  },
];

const mockPropertyWorkOrders: WorkOrder[] = [
  {
    id: 1,
    task: "Doors need to be repaired",
    dueDate: "Oct 2, 2025",
    updatedDate: "Oct 2, 2025",
    age: "6 days 5 hours",
    priority: "High",
    status: "In progress",
    billStatus: "Paid",
    billTotal: "$420",
    assignees: [{ id: 1, name: "Jerry Sanchez", initials: "JS" }],
  },
  {
    id: 2,
    task: "Windows need to be sealed",
    dueDate: "Sep 29, 2025",
    updatedDate: "Sep 29, 2025",
    age: "6 days 5 hours",
    priority: "Low",
    status: "In progress",
    billStatus: "Awaiting Invoice",
    billTotal: "No invoice",
    assignees: [{ id: 2, name: "Jane Smith", initials: "JS" }],
  },
];

const mockPropertyFieldTeamOrders: FieldTeamOrder[] = [
  {
    id: 1,
    property: "22 Indian Chase Dr",
    description: "Emergency Water Damage",
    dueDate: "Oct 2, 2025",
    fieldTeam: [
      { initials: "CH", color: "bg-blue-500", name: "Christopher Harris" },
    ],
    status: "dispatched",
    amount: 420,
  },
  {
    id: 2,
    property: "22 Indian Chase Dr",
    description: "HVAC Installation",
    dueDate: "Sep 29, 2025",
    fieldTeam: [
      { initials: "CS", color: "bg-green-500", name: "Cassandra Smith" },
    ],
    status: "approved",
    amount: 2500,
  },
];

const ActionButton = ({
  itemId,
  openMenuId,
  setOpenMenuId,
}: {
  itemId: number;
  openMenuId: number | null;
  setOpenMenuId: (id: number | null) => void;
}) => {
  const showMenu = openMenuId === itemId;
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    let animationFrameId: number;

    const updateMenuPos = () => {
      if (showMenu && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setMenuPos({
          top: rect.bottom + 8,
          left: rect.right - 145,
        });
      }

      if (showMenu) {
        animationFrameId = requestAnimationFrame(updateMenuPos);
      }
    };

    if (showMenu) {
      updateMenuPos();
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [showMenu]);

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setOpenMenuId(showMenu ? null : itemId)}
        className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="1" />
          <circle cx="19" cy="12" r="1" />
          <circle cx="5" cy="12" r="1" />
        </svg>
      </button>

      {showMenu &&
        createPortal(
          <div
            className="bg-white flex flex-col justify-center items-start gap-4 p-4"
            style={{
              width: "145px",
              border: "0.5px solid #DADADA",
              borderRadius: "8px",
              boxShadow:
                "0 38px 11px 0 rgba(0, 0, 0, 0.00), 0 24px 10px 0 rgba(0, 0, 0, 0.01), 0 14px 8px 0 rgba(0, 0, 0, 0.04), 0 6px 6px 0 rgba(0, 0, 0, 0.06), 0 2px 3px 0 rgba(0, 0, 0, 0.07)",
              zIndex: 99999,
              position: "fixed",
              top: menuPos.top + "px",
              left: menuPos.left + "px",
              pointerEvents: "auto",
            }}
            onMouseLeave={() => setOpenMenuId(null)}
          >
            <button className="flex justify-between items-center w-full hover:opacity-70 transition-opacity">
              <span
                className="text-[#303030] font-normal text-base leading-[140%] tracking-[-0.32px] capitalize"
                style={{
                  fontFamily:
                    "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                }}
              >
                Edit
              </span>
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
            </button>
            <button className="flex justify-between items-center w-full hover:opacity-70 transition-opacity">
              <span
                className="text-[#303030] font-normal text-base leading-[140%] tracking-[-0.32px] capitalize"
                style={{
                  fontFamily:
                    "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                }}
              >
                Delete
              </span>
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
            </button>
          </div>,
          document.body,
        )}
    </>
  );
};

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
  const [activeTab, setActiveTab] = usePageState<
    "tasks" | "recurring" | "workorders" | "fieldteam"
  >("activeTab", "recurring");
  const [openMenuId, setOpenMenuId] = usePageState<number | null>("openMenuId", null);

  // Pagination state for each table
  const [tasksPage, setTasksPage] = usePageState<number>("tasksPage", 1);
  const [tasksItemsPerPage, setTasksItemsPerPage] = usePageState<number>("tasksItemsPerPage", 10);
  const [tasksShowDropdown, setTasksShowDropdown] = useState(false);
  const tasksDropdownRef = useRef<HTMLButtonElement>(null);
  const [tasksDropdownPos, setTasksDropdownPos] = useState({ top: 0, left: 0 });

  const [recurringPage, setRecurringPage] = usePageState<number>("recurringPage", 1);
  const [recurringItemsPerPage, setRecurringItemsPerPage] = usePageState<number>("recurringItemsPerPage", 10);
  const [recurringShowDropdown, setRecurringShowDropdown] = useState(false);
  const recurringDropdownRef = useRef<HTMLButtonElement>(null);
  const [recurringDropdownPos, setRecurringDropdownPos] = useState({ top: 0, left: 0 });

  const [workordersPage, setWorkordersPage] = usePageState<number>("workordersPage", 1);
  const [workordersItemsPerPage, setWorkordersItemsPerPage] = usePageState<number>("workordersItemsPerPage", 10);
  const [workordersShowDropdown, setWorkordersShowDropdown] = useState(false);
  const workordersDropdownRef = useRef<HTMLButtonElement>(null);
  const [workordersDropdownPos, setWorkordersDropdownPos] = useState({ top: 0, left: 0 });

  const [fieldteamPage, setFieldteamPage] = usePageState<number>("fieldteamPage", 1);
  const [fieldteamItemsPerPage, setFieldteamItemsPerPage] = usePageState<number>("fieldteamItemsPerPage", 10);
  const [fieldteamShowDropdown, setFieldteamShowDropdown] = useState(false);
  const fieldteamDropdownRef = useRef<HTMLButtonElement>(null);
  const [fieldteamDropdownPos, setFieldteamDropdownPos] = useState({ top: 0, left: 0 });

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
    if (billStatus === "Awaiting Invoice") return "bg-yellow-100 text-yellow-600";
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

        {/* Add Button */}
        <button
          className="flex items-center gap-2 px-3 py-2 min-h-[36px] rounded-lg bg-[#013764] text-white font-medium text-base overflow-hidden transition-colors hover:bg-[#002D5A]"
          style={{ boxShadow: "0px 0px 0px 1px #002D5A" }}
        >
          <img
            loading="lazy"
            src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/1a46511ba98f469f36b0bbeec24c0e7684e3ff9a?placeholderIfAbsent=true"
            alt=""
            className="w-5 h-5 object-contain"
          />
          <span>Add Item</span>
        </button>
      </div>

      {/* Tasks Table */}
      {activeTab === "tasks" && (
        <div className="w-full border border-gray-200 bg-white rounded-lg overflow-hidden">
          {/* Header */}
          <div className="bg-white flex w-full px-4 py-4 items-center gap-4 justify-between flex-wrap border-b border-gray-200">
            <div className="flex items-center gap-4">
              <div className="text-[#303030] font-medium text-[22px] leading-[1.09]">
                Tasks
              </div>
            </div>
            <div className="flex min-w-60 items-start gap-2.5">
              <div className="flex min-w-60 min-h-9 gap-2 items-center px-3 rounded-lg border-[0.5px] border-[#DADADA] shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] bg-[#FBFBFB]">
                <img
                  loading="lazy"
                  src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/b47ca0b4fcf9eb132889213ca1e6a92de1087150?placeholderIfAbsent=true"
                  className="w-5 h-5"
                  alt=""
                />
                <input
                  type="text"
                  placeholder="Search..."
                  className="bg-transparent border-none outline-none text-[#303030] font-normal text-base leading-[1.4] tracking-[-0.32px]"
                />
              </div>
              <div className="rounded-lg bg-[#FBFBFB] shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] border border-[#DADADA] flex min-h-9 px-3 py-1.5 items-center gap-2 cursor-pointer hover:bg-gray-100">
                <div className="text-[#303030] font-normal text-base leading-[1.4] tracking-[-0.32px]">
                  Filter
                </div>
                <img
                  loading="lazy"
                  src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/81afa4c88f6177ebdc84321a1f0691342b9fcd92?placeholderIfAbsent=true"
                  className="w-[18px] h-[18px]"
                  alt=""
                />
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 h-12">
                  <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                    <span className="font-medium text-sm text-gray-700">
                      Status
                    </span>
                  </th>
                  <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                    <span className="font-medium text-sm text-gray-700">
                      Task
                    </span>
                  </th>
                  <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                    <span className="font-medium text-sm text-gray-700">
                      Due
                    </span>
                  </th>
                  <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                    <span className="font-medium text-sm text-gray-700">
                      Priority
                    </span>
                  </th>
                  <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                    <span className="font-medium text-sm text-gray-700">
                      Assignees
                    </span>
                  </th>
                  <th className="sticky right-0 px-2 py-3 text-center w-20 bg-white border-l border-gray-200">
                    <span className="font-medium text-sm text-gray-700">
                      Actions
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {mockPropertyTasks.map((task) => (
                  <tr
                    key={task.id}
                    className="border-b border-gray-200 hover:bg-gray-50 transition-colors h-12"
                  >
                    <td className="px-3 py-3 border-r border-gray-200 whitespace-nowrap">
                      <div
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-normal ${
                          task.status === "Completed"
                            ? "bg-emerald-100 text-emerald-600"
                            : "bg-blue-100 text-blue-600"
                        }`}
                      >
                        {task.status}
                      </div>
                    </td>
                    <td className="px-3 py-3 border-r border-gray-200 whitespace-nowrap">
                      <span className="text-gray-900 font-normal text-base">
                        {task.title}
                      </span>
                    </td>
                    <td className="px-3 py-3 border-r border-gray-200 whitespace-nowrap">
                      <span className="text-gray-900 font-normal text-base">
                        {task.due}
                      </span>
                    </td>
                    <td className="px-3 py-3 border-r border-gray-200 whitespace-nowrap">
                      <div
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-normal ${getPriorityBadgeColor(
                          task.priority,
                        )}`}
                      >
                        {task.priority}
                      </div>
                    </td>
                    <td className="px-3 py-3 border-r border-gray-200 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {task.assignees.map((assignee) => (
                          <div key={assignee.id} className="relative group">
                            <div
                              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold cursor-pointer bg-blue-500 border border-gray-300"
                              title={assignee.name}
                            >
                              {assignee.initials}
                            </div>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                              {assignee.name}
                            </div>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="sticky right-0 px-2 py-3 flex items-center justify-center bg-white border-l border-gray-200">
                      <ActionButton
                        itemId={task.id}
                        openMenuId={openMenuId}
                        setOpenMenuId={setOpenMenuId}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between w-full gap-4 flex-wrap px-6 py-4 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <div className="text-[#525252] text-base font-medium">Showing</div>
              <button
                ref={tasksDropdownRef}
                onClick={() => setTasksShowDropdown(!tasksShowDropdown)}
                className="rounded-lg bg-[#FBFBFB] shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] border border-[#DADADA] flex min-h-10 px-3 py-2.5 items-center gap-2 cursor-pointer hover:bg-gray-100"
              >
                <div className="text-[#0A0A0A] text-base font-medium">{tasksItemsPerPage}</div>
                <img
                  loading="lazy"
                  src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/cc5507ba17118962f81e4f61a415adb6e3ee75ee?placeholderIfAbsent=true"
                  className="w-[18px] h-[18px]"
                  alt=""
                />
              </button>
              <div className="text-[#525252] text-base font-medium">of {mockPropertyTasks.length}</div>
            </div>
            <div className="rounded-lg bg-[#FBFBFB] shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] border border-[#DADADA] flex min-w-60 min-h-10 items-center overflow-hidden flex-wrap justify-center">
              <div
                className="flex items-center justify-center gap-1.5 min-h-10 px-3.5 py-2 border-r border-[#E5E5E5] bg-white cursor-pointer hover:bg-gray-50"
                onClick={() => setTasksPage(Math.max(1, tasksPage - 1))}
              >
                <img
                  loading="lazy"
                  src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/dc8342cc7d9ed7372ff27293ef7c08e463e9fba7?placeholderIfAbsent=true"
                  className="w-5 h-5"
                  alt=""
                />
                <div className="text-[#525252] text-base font-medium">Previous</div>
              </div>
              <div className="flex items-center justify-center min-h-10 min-w-10 px-2 gap-2 border-r border-[#E5E5E5] bg-white">
                <div className="text-[#0A0A0A] text-base font-medium">{tasksPage}</div>
              </div>
              <div
                className="flex items-center justify-center gap-1.5 min-h-10 px-4 py-2 border-r border-[#E5E5E5] bg-white cursor-pointer hover:bg-gray-50"
                onClick={() => setTasksPage(tasksPage + 1)}
              >
                <div className="text-[#525252] text-base font-medium">Next</div>
                <img
                  loading="lazy"
                  src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/34c281f37936da4ccce4bfe5d47937be9d7ed9c7?placeholderIfAbsent=true"
                  className="w-5 h-5"
                  alt=""
                />
              </div>
            </div>
          </div>

          {/* Tasks Items Per Page Dropdown */}
          {tasksShowDropdown &&
            createPortal(
              <div
                className="bg-white overflow-hidden"
                style={{
                  border: "0.5px solid #DADADA",
                  borderRadius: "8px",
                  boxShadow:
                    "0 38px 11px 0 rgba(0, 0, 0, 0.00), 0 24px 10px 0 rgba(0, 0, 0, 0.01), 0 14px 8px 0 rgba(0, 0, 0, 0.04), 0 6px 6px 0 rgba(0, 0, 0, 0.06), 0 2px 3px 0 rgba(0, 0, 0, 0.07)",
                  zIndex: 99999,
                  minWidth: "56px",
                  width: "56px",
                  position: "fixed",
                  top: tasksDropdownPos.top + "px",
                  left: tasksDropdownPos.left + "px",
                  pointerEvents: "auto",
                }}
                onMouseLeave={() => setTasksShowDropdown(false)}
              >
                {[10, 25, 50].map((size, index) => (
                  <button
                    key={size}
                    onClick={() => {
                      setTasksItemsPerPage(size);
                      setTasksPage(1);
                      setTasksShowDropdown(false);
                    }}
                    className={`w-full px-4 py-3 text-center text-base transition-colors whitespace-nowrap ${
                      tasksItemsPerPage === size
                        ? "bg-gray-50 font-medium text-gray-900"
                        : "text-[#303030] hover:bg-gray-50"
                    }`}
                    style={{
                      fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                      fontSize: "16px",
                      lineHeight: "140%",
                      letterSpacing: "-0.32px",
                      borderRadius: index === 2 ? "0 0 8px 8px" : "0",
                    }}
                  >
                    {size}
                  </button>
                ))}
              </div>,
              document.body,
            )}
        </div>
      )}

      {/* Recurring Tasks Table */}
      {activeTab === "recurring" && (
        <div className="w-full border border-gray-200 bg-white rounded-lg overflow-hidden">
          {/* Header */}
          <div className="bg-white flex w-full px-4 py-4 items-center gap-4 justify-between flex-wrap border-b border-gray-200">
            <div className="flex items-center gap-4">
              <div className="text-[#303030] font-medium text-[22px] leading-[1.09]">
                Recurring Tasks
              </div>
            </div>
            <div className="flex min-w-60 items-start gap-2.5">
              <div className="flex min-w-60 min-h-9 gap-2 items-center px-3 rounded-lg border-[0.5px] border-[#DADADA] shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] bg-[#FBFBFB]">
                <img
                  loading="lazy"
                  src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/b47ca0b4fcf9eb132889213ca1e6a92de1087150?placeholderIfAbsent=true"
                  className="w-5 h-5"
                  alt=""
                />
                <input
                  type="text"
                  placeholder="Search..."
                  className="bg-transparent border-none outline-none text-[#303030] font-normal text-base leading-[1.4] tracking-[-0.32px]"
                />
              </div>
              <div className="rounded-lg bg-[#FBFBFB] shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] border border-[#DADADA] flex min-h-9 px-3 py-1.5 items-center gap-2 cursor-pointer hover:bg-gray-100">
                <div className="text-[#303030] font-normal text-base leading-[1.4] tracking-[-0.32px]">
                  Filter
                </div>
                <img
                  loading="lazy"
                  src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/81afa4c88f6177ebdc84321a1f0691342b9fcd92?placeholderIfAbsent=true"
                  className="w-[18px] h-[18px]"
                  alt=""
                />
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 h-12">
                  <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5.00065 7.33333H3.06732C2.69395 7.33333 2.50727 7.33333 2.36466 7.406C2.23922 7.46991 2.13723 7.5719 2.07331 7.69734C2.00065 7.83995 2.00065 8.02663 2.00065 8.4V14M11.0007 7.33333H12.934C13.3074 7.33333 13.494 7.33333 13.6366 7.406C13.7621 7.46991 13.8641 7.5719 13.928 7.69734C14.0007 7.83995 14.0007 8.02663 14.0007 8.4V14M11.0007 14V4.13333C11.0007 3.3866 11.0007 3.01323 10.8553 2.72801C10.7275 2.47713 10.5235 2.27316 10.2726 2.14532C9.98742 2 9.61405 2 8.86732 2H7.13398C6.38725 2 6.01388 2 5.72866 2.14532C5.47778 2.27316 5.27381 2.47713 5.14598 2.72801C5.00065 3.01323 5.00065 3.3866 5.00065 4.13333V14M14.6673 14H1.33398M7.33398 4.66667H8.66732M7.33398 7.33333H8.66732M7.33398 10H8.66732" stroke="#525252" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span className="font-medium text-sm text-gray-700">Task</span>
                    </div>
                  </th>
                  <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M14 6.66658H2M10.6667 1.33325V3.99992M5.33333 1.33325V3.99992M5.2 14.6666H10.8C11.9201 14.6666 12.4802 14.6666 12.908 14.4486C13.2843 14.2569 13.5903 13.9509 13.782 13.5746C14 13.1467 14 12.5867 14 11.4666V5.86659C14 4.74648 14 4.18643 13.782 3.7586C13.5903 3.38228 13.2843 3.07632 12.908 2.88457C12.4802 2.66659 11.9201 2.66659 10.8 2.66659H5.2C4.0799 2.66659 3.51984 2.66659 3.09202 2.88457C2.71569 3.07632 2.40973 3.38228 2.21799 3.7586C2 4.18643 2 4.74648 2 5.86658V11.4666C2 12.5867 2 13.1467 2.21799 13.5746C2.40973 13.9509 2.71569 14.2569 3.09202 14.4486C3.51984 14.6666 4.0799 14.6666 5.2 14.6666Z" stroke="#525252" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span className="font-medium text-sm text-gray-700">Next Date</span>
                    </div>
                  </th>
                  <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M14 6.66658H2M10.6667 1.33325V3.99992M5.33333 1.33325V3.99992M5.2 14.6666H10.8C11.9201 14.6666 12.4802 14.6666 12.908 14.4486C13.2843 14.2569 13.5903 13.9509 13.782 13.5746C14 13.1467 14 12.5867 14 11.4666V5.86659C14 4.74648 14 4.18643 13.782 3.7586C13.5903 3.38228 13.2843 3.07632 12.908 2.88457C12.4802 2.66659 11.9201 2.66659 10.8 2.66659H5.2C4.0799 2.66659 3.51984 2.66659 3.09202 2.88457C2.71569 3.07632 2.40973 3.38228 2.21799 3.7586C2 4.18643 2 4.74648 2 5.86658V11.4666C2 12.5867 2 13.1467 2.21799 13.5746C2.40973 13.9509 2.71569 14.2569 3.09202 14.4486C3.51984 14.6666 4.0799 14.6666 5.2 14.6666Z" stroke="#525252" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span className="font-medium text-sm text-gray-700">Priority</span>
                    </div>
                  </th>
                  <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5.00065 7.33333H3.06732C2.69395 7.33333 2.50727 7.33333 2.36466 7.406C2.23922 7.46991 2.13723 7.5719 2.07331 7.69734C2.00065 7.83995 2.00065 8.02663 2.00065 8.4V14M11.0007 7.33333H12.934C13.3074 7.33333 13.494 7.33333 13.6366 7.406C13.7621 7.46991 13.8641 7.5719 13.928 7.69734C14.0007 7.83995 14.0007 8.02663 14.0007 8.4V14M11.0007 14V4.13333C11.0007 3.3866 11.0007 3.01323 10.8553 2.72801C10.7275 2.47713 10.5235 2.27316 10.2726 2.14532C9.98742 2 9.61405 2 8.86732 2H7.13398C6.38725 2 6.01388 2 5.72866 2.14532C5.47778 2.27316 5.27381 2.47713 5.14598 2.72801C5.00065 3.01323 5.00065 3.3866 5.00065 4.13333V14M14.6673 14H1.33398M7.33398 4.66667H8.66732M7.33398 7.33333H8.66732M7.33398 10H8.66732" stroke="#525252" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span className="font-medium text-sm text-gray-700">Category</span>
                    </div>
                  </th>
                  <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" clipRule="evenodd" d="M2.66722 4.99992C2.66722 2.97487 4.30884 1.33325 6.33388 1.33325C8.35893 1.33325 10.0005 2.97487 10.0005 4.99992C10.0005 7.02496 8.35893 8.66659 6.33388 8.66659C4.30884 8.66659 2.66722 7.02496 2.66722 4.99992Z" fill="#525252"/>
                        <path fillRule="evenodd" clipRule="evenodd" d="M6.33388 9.33325C8.46471 9.33325 10.3696 10.536 11.532 12.28C11.6344 12.4336 11.7436 12.5975 11.8199 12.7532C11.9118 12.9407 11.9778 13.156 11.9624 13.4131C11.9501 13.6182 11.882 13.8085 11.8012 13.9596C11.7203 14.1107 11.5996 14.2728 11.4357 14.3967C11.2162 14.5627 10.9796 14.6209 10.7705 14.6453C10.5863 14.6667 10.3682 14.6666 10.1485 14.6666C7.60641 14.6661 5.06234 14.6661 2.51926 14.6666C2.29957 14.6666 2.08147 14.6667 1.89731 14.6453C1.68818 14.6209 1.45158 14.5627 1.23204 14.3967C1.06816 14.2728 0.947505 14.1107 0.86661 13.9596C0.785715 13.8085 0.71768 13.6182 0.705369 13.4131C0.689933 13.156 0.755933 12.9407 0.847831 12.7532C0.924183 12.5975 1.03339 12.4336 1.1358 12.28C2.29819 10.536 4.20306 9.33325 6.33388 9.33325Z" fill="#525252"/>
                      </svg>
                      <span className="font-medium text-sm text-gray-700">Assignees</span>
                    </div>
                  </th>
                  <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 4.33341H13.137C13.4228 4.33341 13.5657 4.33341 13.6517 4.3936C13.7268 4.44615 13.777 4.52732 13.7904 4.61803C13.8058 4.7219 13.7419 4.84969 13.6141 5.10526L12.7792 6.77496C12.7379 6.85769 12.7172 6.89905 12.7084 6.94253C12.7006 6.98105 12.6997 7.02064 12.7058 7.05947C12.7125 7.1033 12.7313 7.14556 12.7689 7.23008L13.6667 9.25014C13.7778 9.50008 13.8333 9.62504 13.8151 9.72593C13.7992 9.81409 13.7485 9.89214 13.6744 9.94248C13.5896 10.0001 13.4528 10.0001 13.1793 10.0001H8.06667C7.6933 10.0001 7.50661 10.0001 7.36401 9.92742C7.23856 9.8635 7.13658 9.76152 7.07266 9.63607C7 9.49347 7 9.30678 7 8.93341V7.33341M2 14.0001L2 2.33341M2 7.33341H7.93333C8.3067 7.33341 8.49339 7.33341 8.63599 7.26075C8.76143 7.19684 8.86342 7.09485 8.92734 6.96941C9 6.8268 9 6.64012 9 6.26675V2.73341C9 2.36005 9 2.17336 8.92734 2.03075C8.86342 1.90531 8.76143 1.80333 8.63599 1.73941C8.49339 1.66675 8.3067 1.66675 7.93333 1.66675L3.06667 1.66675C2.6933 1.66675 2.50661 1.66675 2.36401 1.73941C2.23856 1.80333 2.13658 1.90531 2.07266 2.03075C2 2.17336 2 2.36005 2 2.73341V7.33341Z" stroke="#525252" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span className="font-medium text-sm text-gray-700">Status</span>
                    </div>
                  </th>
                  <th className="sticky right-0 px-2 py-3 text-center w-20 bg-white border-l border-gray-200">
                    <span className="font-medium text-sm text-gray-700">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {mockPropertyRecurringTasks.map((task) => (
                  <tr
                    key={task.id}
                    className="border-b border-gray-200 hover:bg-gray-50 transition-colors h-12"
                  >
                    <td className="px-3 py-3 border-r border-gray-200 whitespace-nowrap">
                      <span className="text-gray-900 font-normal text-base">
                        {task.task}
                      </span>
                    </td>
                    <td className="px-3 py-3 border-r border-gray-200 whitespace-nowrap">
                      <span className="text-gray-900 font-normal text-base">
                        {task.nextDate}
                      </span>
                    </td>
                    <td className="px-3 py-3 border-r border-gray-200 whitespace-nowrap">
                      <div
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-normal ${getPriorityBadgeColor(
                          task.priority,
                        )}`}
                      >
                        {task.priority}
                      </div>
                    </td>
                    <td className="px-3 py-3 border-r border-gray-200 whitespace-nowrap">
                      <span className="text-gray-900 font-normal text-base">
                        {task.category}
                      </span>
                    </td>
                    <td className="px-3 py-3 border-r border-gray-200 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {task.assignees.map((assignee) => (
                          <div key={assignee.id} className="relative group">
                            <div
                              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold cursor-pointer bg-blue-500 border border-gray-300"
                              title={assignee.name}
                            >
                              {assignee.initials}
                            </div>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                              {assignee.name}
                            </div>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-3 border-r border-gray-200 whitespace-nowrap">
                      <div
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-normal ${
                          task.status === "active"
                            ? "bg-green-100 text-green-600"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {task.status}
                      </div>
                    </td>
                    <td className="sticky right-0 px-2 py-3 flex items-center justify-center bg-white border-l border-gray-200">
                      <ActionButton
                        itemId={task.id}
                        openMenuId={openMenuId}
                        setOpenMenuId={setOpenMenuId}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between w-full gap-4 flex-wrap px-6 py-4 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <div className="text-[#525252] text-base font-medium">Showing</div>
              <button
                ref={recurringDropdownRef}
                onClick={() => setRecurringShowDropdown(!recurringShowDropdown)}
                className="rounded-lg bg-[#FBFBFB] shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] border border-[#DADADA] flex min-h-10 px-3 py-2.5 items-center gap-2 cursor-pointer hover:bg-gray-100"
              >
                <div className="text-[#0A0A0A] text-base font-medium">{recurringItemsPerPage}</div>
                <img
                  loading="lazy"
                  src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/cc5507ba17118962f81e4f61a415adb6e3ee75ee?placeholderIfAbsent=true"
                  className="w-[18px] h-[18px]"
                  alt=""
                />
              </button>
              <div className="text-[#525252] text-base font-medium">of {mockPropertyRecurringTasks.length}</div>
            </div>
            <div className="rounded-lg bg-[#FBFBFB] shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] border border-[#DADADA] flex min-w-60 min-h-10 items-center overflow-hidden flex-wrap justify-center">
              <div
                className="flex items-center justify-center gap-1.5 min-h-10 px-3.5 py-2 border-r border-[#E5E5E5] bg-white cursor-pointer hover:bg-gray-50"
                onClick={() => setRecurringPage(Math.max(1, recurringPage - 1))}
              >
                <img
                  loading="lazy"
                  src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/dc8342cc7d9ed7372ff27293ef7c08e463e9fba7?placeholderIfAbsent=true"
                  className="w-5 h-5"
                  alt=""
                />
                <div className="text-[#525252] text-base font-medium">Previous</div>
              </div>
              <div className="flex items-center justify-center min-h-10 min-w-10 px-2 gap-2 border-r border-[#E5E5E5] bg-white">
                <div className="text-[#0A0A0A] text-base font-medium">{recurringPage}</div>
              </div>
              <div
                className="flex items-center justify-center gap-1.5 min-h-10 px-4 py-2 border-r border-[#E5E5E5] bg-white cursor-pointer hover:bg-gray-50"
                onClick={() => setRecurringPage(recurringPage + 1)}
              >
                <div className="text-[#525252] text-base font-medium">Next</div>
                <img
                  loading="lazy"
                  src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/34c281f37936da4ccce4bfe5d47937be9d7ed9c7?placeholderIfAbsent=true"
                  className="w-5 h-5"
                  alt=""
                />
              </div>
            </div>
          </div>

          {/* Recurring Items Per Page Dropdown */}
          {recurringShowDropdown &&
            createPortal(
              <div
                className="bg-white overflow-hidden"
                style={{
                  border: "0.5px solid #DADADA",
                  borderRadius: "8px",
                  boxShadow:
                    "0 38px 11px 0 rgba(0, 0, 0, 0.00), 0 24px 10px 0 rgba(0, 0, 0, 0.01), 0 14px 8px 0 rgba(0, 0, 0, 0.04), 0 6px 6px 0 rgba(0, 0, 0, 0.06), 0 2px 3px 0 rgba(0, 0, 0, 0.07)",
                  zIndex: 99999,
                  minWidth: "56px",
                  width: "56px",
                  position: "fixed",
                  top: recurringDropdownPos.top + "px",
                  left: recurringDropdownPos.left + "px",
                  pointerEvents: "auto",
                }}
                onMouseLeave={() => setRecurringShowDropdown(false)}
              >
                {[10, 25, 50].map((size, index) => (
                  <button
                    key={size}
                    onClick={() => {
                      setRecurringItemsPerPage(size);
                      setRecurringPage(1);
                      setRecurringShowDropdown(false);
                    }}
                    className={`w-full px-4 py-3 text-center text-base transition-colors whitespace-nowrap ${
                      recurringItemsPerPage === size
                        ? "bg-gray-50 font-medium text-gray-900"
                        : "text-[#303030] hover:bg-gray-50"
                    }`}
                    style={{
                      fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                      fontSize: "16px",
                      lineHeight: "140%",
                      letterSpacing: "-0.32px",
                      borderRadius: index === 2 ? "0 0 8px 8px" : "0",
                    }}
                  >
                    {size}
                  </button>
                ))}
              </div>,
              document.body,
            )}
        </div>
      )}

      {/* Work Orders Table */}
      {activeTab === "workorders" && (
        <div className="w-full border border-gray-200 bg-white rounded-lg overflow-hidden">
          {/* Header */}
          <div className="bg-white flex w-full px-4 py-4 items-center gap-4 justify-between flex-wrap border-b border-gray-200">
            <div className="flex items-center gap-4">
              <div className="text-[#303030] font-medium text-[22px] leading-[1.09]">
                Work Orders
              </div>
            </div>
            <div className="flex min-w-60 items-start gap-2.5">
              <div className="flex min-w-60 min-h-9 gap-2 items-center px-3 rounded-lg border-[0.5px] border-[#DADADA] shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] bg-[#FBFBFB]">
                <img
                  loading="lazy"
                  src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/b47ca0b4fcf9eb132889213ca1e6a92de1087150?placeholderIfAbsent=true"
                  className="w-5 h-5"
                  alt=""
                />
                <input
                  type="text"
                  placeholder="Search..."
                  className="bg-transparent border-none outline-none text-[#303030] font-normal text-base leading-[1.4] tracking-[-0.32px]"
                />
              </div>
              <div className="rounded-lg bg-[#FBFBFB] shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] border border-[#DADADA] flex min-h-9 px-3 py-1.5 items-center gap-2 cursor-pointer hover:bg-gray-100">
                <div className="text-[#303030] font-normal text-base leading-[1.4] tracking-[-0.32px]">
                  Filter
                </div>
                <img
                  loading="lazy"
                  src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/81afa4c88f6177ebdc84321a1f0691342b9fcd92?placeholderIfAbsent=true"
                  className="w-[18px] h-[18px]"
                  alt=""
                />
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 h-12">
                  <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5.00065 7.33333H3.06732C2.69395 7.33333 2.50727 7.33333 2.36466 7.406C2.23922 7.46991 2.13723 7.5719 2.07331 7.69734C2.00065 7.83995 2.00065 8.02663 2.00065 8.4V14M11.0007 7.33333H12.934C13.3074 7.33333 13.494 7.33333 13.6366 7.406C13.7621 7.46991 13.8641 7.5719 13.928 7.69734C14.0007 7.83995 14.0007 8.02663 14.0007 8.4V14M11.0007 14V4.13333C11.0007 3.3866 11.0007 3.01323 10.8553 2.72801C10.7275 2.47713 10.5235 2.27316 10.2726 2.14532C9.98742 2 9.61405 2 8.86732 2H7.13398C6.38725 2 6.01388 2 5.72866 2.14532C5.47778 2.27316 5.27381 2.47713 5.14598 2.72801C5.00065 3.01323 5.00065 3.3866 5.00065 4.13333V14M14.6673 14H1.33398M7.33398 4.66667H8.66732M7.33398 7.33333H8.66732M7.33398 10H8.66732" stroke="#525252" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span className="font-medium text-sm text-gray-700">Work Order</span>
                    </div>
                  </th>
                  <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M14 6.66658H2M10.6667 1.33325V3.99992M5.33333 1.33325V3.99992M5.2 14.6666H10.8C11.9201 14.6666 12.4802 14.6666 12.908 14.4486C13.2843 14.2569 13.5903 13.9509 13.782 13.5746C14 13.1467 14 12.5867 14 11.4666V5.86659C14 4.74648 14 4.18643 13.782 3.7586C13.5903 3.38228 13.2843 3.07632 12.908 2.88457C12.4802 2.66659 11.9201 2.66659 10.8 2.66659H5.2C4.0799 2.66659 3.51984 2.66659 3.09202 2.88457C2.71569 3.07632 2.40973 3.38228 2.21799 3.7586C2 4.18643 2 4.74648 2 5.86658V11.4666C2 12.5867 2 13.1467 2.21799 13.5746C2.40973 13.9509 2.71569 14.2569 3.09202 14.4486C3.51984 14.6666 4.0799 14.6666 5.2 14.6666Z" stroke="#525252" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span className="font-medium text-sm text-gray-700">Due Date</span>
                    </div>
                  </th>
                  <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 4.33341H13.137C13.4228 4.33341 13.5657 4.33341 13.6517 4.3936C13.7268 4.44615 13.777 4.52732 13.7904 4.61803C13.8058 4.7219 13.7419 4.84969 13.6141 5.10526L12.7792 6.77496C12.7379 6.85769 12.7172 6.89905 12.7084 6.94253C12.7006 6.98105 12.6997 7.02064 12.7058 7.05947C12.7125 7.1033 12.7313 7.14556 12.7689 7.23008L13.6667 9.25014C13.7778 9.50008 13.8333 9.62504 13.8151 9.72593C13.7992 9.81409 13.7485 9.89214 13.6744 9.94248C13.5896 10.0001 13.4528 10.0001 13.1793 10.0001H8.06667C7.6933 10.0001 7.50661 10.0001 7.36401 9.92742C7.23856 9.8635 7.13658 9.76152 7.07266 9.63607C7 9.49347 7 9.30678 7 8.93341V7.33341M2 14.0001L2 2.33341M2 7.33341H7.93333C8.3067 7.33341 8.49339 7.33341 8.63599 7.26075C8.76143 7.19684 8.86342 7.09485 8.92734 6.96941C9 6.8268 9 6.64012 9 6.26675V2.73341C9 2.36005 9 2.17336 8.92734 2.03075C8.86342 1.90531 8.76143 1.80333 8.63599 1.73941C8.49339 1.66675 8.3067 1.66675 7.93333 1.66675L3.06667 1.66675C2.6933 1.66675 2.50661 1.66675 2.36401 1.73941C2.23856 1.80333 2.13658 1.90531 2.07266 2.03075C2 2.17336 2 2.36005 2 2.73341V7.33341Z" stroke="#525252" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span className="font-medium text-sm text-gray-700">Status</span>
                    </div>
                  </th>
                  <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M14 6.66658H2M10.6667 1.33325V3.99992M5.33333 1.33325V3.99992M5.2 14.6666H10.8C11.9201 14.6666 12.4802 14.6666 12.908 14.4486C13.2843 14.2569 13.5903 13.9509 13.782 13.5746C14 13.1467 14 12.5867 14 11.4666V5.86659C14 4.74648 14 4.18643 13.782 3.7586C13.5903 3.38228 13.2843 3.07632 12.908 2.88457C12.4802 2.66659 11.9201 2.66659 10.8 2.66659H5.2C4.0799 2.66659 3.51984 2.66659 3.09202 2.88457C2.71569 3.07632 2.40973 3.38228 2.21799 3.7586C2 4.18643 2 4.74648 2 5.86658V11.4666C2 12.5867 2 13.1467 2.21799 13.5746C2.40973 13.9509 2.71569 14.2569 3.09202 14.4486C3.51984 14.6666 4.0799 14.6666 5.2 14.6666Z" stroke="#525252" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span className="font-medium text-sm text-gray-700">Priority</span>
                    </div>
                  </th>
                  <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5.33399 5.33325H5.34065M1.33398 3.46658L1.33398 6.44959C1.33398 6.77572 1.33398 6.93878 1.37082 7.09223C1.40349 7.22827 1.45736 7.35833 1.53046 7.47763C1.61292 7.61219 1.72822 7.72749 1.95882 7.95809L7.07124 13.0705C7.86328 13.8625 8.25929 14.2586 8.71595 14.4069C9.11764 14.5375 9.55033 14.5375 9.95202 14.4069C10.4087 14.2586 10.8047 13.8625 11.5967 13.0705L13.0712 11.596C13.8633 10.804 14.2593 10.4079 14.4077 9.95128C14.5382 9.5496 14.5382 9.1169 14.4077 8.71522C14.2593 8.25856 13.8633 7.86254 13.0712 7.07051L7.95882 1.95809C7.72822 1.72749 7.61292 1.61219 7.47836 1.52973C7.35907 1.45663 7.22901 1.40275 7.09296 1.37009C6.93951 1.33325 6.77645 1.33325 6.45033 1.33325L3.46732 1.33325C2.72058 1.33325 2.34721 1.33325 2.062 1.47858C1.81111 1.60641 1.60714 1.81038 1.47931 2.06126C1.33398 2.34648 1.33398 2.71985 1.33398 3.46658ZM5.66732 5.33325C5.66732 5.51735 5.51808 5.66658 5.33399 5.66658C5.14989 5.66658 5.00065 5.51735 5.00065 5.33325C5.00065 5.14916 5.14989 4.99992 5.33399 4.99992C5.51808 4.99992 5.66732 5.14916 5.66732 5.33325Z" stroke="#525252" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span className="font-medium text-sm text-gray-700">Bill Status</span>
                    </div>
                  </th>
                  <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 10.6666C4 12.1393 5.19391 13.3333 6.66667 13.3333H9.33333C10.8061 13.3333 12 12.1393 12 10.6666C12 9.19383 10.8061 7.99992 9.33333 7.99992H6.66667C5.19391 7.99992 4 6.80601 4 5.33325C4 3.86049 5.19391 2.66659 6.66667 2.66659H9.33333C10.8061 2.66659 12 3.86049 12 5.33325M8 1.33325V14.6666" stroke="#525252" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span className="font-medium text-sm text-gray-700">Bill Total</span>
                    </div>
                  </th>
                  <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 10.6666C4 12.1393 5.19391 13.3333 6.66667 13.3333H9.33333C10.8061 13.3333 12 12.1393 12 10.6666C12 9.19383 10.8061 7.99992 9.33333 7.99992H6.66667C5.19391 7.99992 4 6.80601 4 5.33325C4 3.86049 5.19391 2.66659 6.66667 2.66659H9.33333C10.8061 2.66659 12 3.86049 12 5.33325M11.4048 10.2586C11.5701 9.92957 11.9708 9.79684 12.2998 9.96212C13.3894 10.5095 14.3105 11.3809 14.9771 12.4547C15.0781 12.6174 15.2251 12.8346 15.2707 13.129C15.3196 13.4442 15.234 13.7456 15.1066 13.9748C14.9791 14.204 14.7681 14.4357 14.4745 14.5604C14.1954 14.679 13.8918 14.6666 13.6672 14.6666C13.299 14.6666 13.0005 14.3681 13.0005 13.9999C13.0005 13.6317 13.299 13.3333 13.6672 13.3333C13.8107 13.3333 13.8861 13.3328 13.9399 13.3292L13.9413 13.3267C13.9541 13.3038 13.8572 13.1788 13.8443 13.158C13.2961 12.2749 12.5529 11.5814 11.7013 11.1536C11.3723 10.9883 11.2395 10.5876 11.4048 10.2586Z" stroke="#525252" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span className="font-medium text-sm text-gray-700">Assignees</span>
                    </div>
                  </th>
                  <th className="sticky right-0 px-2 py-3 text-center w-20 bg-white border-l border-gray-200">
                    <span className="font-medium text-sm text-gray-700">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {mockPropertyWorkOrders.map((workOrder) => (
                  <tr
                    key={workOrder.id}
                    className="border-b border-gray-200 hover:bg-gray-50 transition-colors h-12"
                  >
                    <td className="px-3 py-3 border-r border-gray-200 whitespace-nowrap">
                      <span className="text-gray-900 font-normal text-base">
                        {workOrder.task}
                      </span>
                    </td>
                    <td className="px-3 py-3 border-r border-gray-200 whitespace-nowrap">
                      <span className="text-gray-900 font-normal text-base">
                        {workOrder.dueDate}
                      </span>
                    </td>
                    <td className="px-3 py-3 border-r border-gray-200 whitespace-nowrap">
                      <div
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-normal ${getStatusBadgeColor(
                          workOrder.status,
                        )}`}
                      >
                        {workOrder.status}
                      </div>
                    </td>
                    <td className="px-3 py-3 border-r border-gray-200 whitespace-nowrap">
                      <div
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-normal ${getPriorityBadgeColor(
                          workOrder.priority,
                        )}`}
                      >
                        {workOrder.priority}
                      </div>
                    </td>
                    <td className="px-3 py-3 border-r border-gray-200 whitespace-nowrap">
                      <div
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-normal ${getBillStatusColor(
                          workOrder.billStatus,
                        )}`}
                      >
                        {workOrder.billStatus}
                      </div>
                    </td>
                    <td className="px-3 py-3 border-r border-gray-200 whitespace-nowrap">
                      <span className="text-gray-900 font-normal text-base">
                        {workOrder.billTotal}
                      </span>
                    </td>
                    <td className="px-3 py-3 border-r border-gray-200 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {workOrder.assignees.map((assignee) => (
                          <div key={assignee.id} className="relative group">
                            <div
                              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold cursor-pointer bg-blue-500 border border-gray-300"
                              title={assignee.name}
                            >
                              {assignee.initials}
                            </div>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                              {assignee.name}
                            </div>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="sticky right-0 px-2 py-3 flex items-center justify-center bg-white border-l border-gray-200">
                      <ActionButton
                        itemId={workOrder.id}
                        openMenuId={openMenuId}
                        setOpenMenuId={setOpenMenuId}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between w-full gap-4 flex-wrap px-6 py-4 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <div className="text-[#525252] text-base font-medium">Showing</div>
              <button
                ref={workordersDropdownRef}
                onClick={() => setWorkordersShowDropdown(!workordersShowDropdown)}
                className="rounded-lg bg-[#FBFBFB] shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] border border-[#DADADA] flex min-h-10 px-3 py-2.5 items-center gap-2 cursor-pointer hover:bg-gray-100"
              >
                <div className="text-[#0A0A0A] text-base font-medium">{workordersItemsPerPage}</div>
                <img
                  loading="lazy"
                  src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/cc5507ba17118962f81e4f61a415adb6e3ee75ee?placeholderIfAbsent=true"
                  className="w-[18px] h-[18px]"
                  alt=""
                />
              </button>
              <div className="text-[#525252] text-base font-medium">of {mockPropertyWorkOrders.length}</div>
            </div>
            <div className="rounded-lg bg-[#FBFBFB] shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] border border-[#DADADA] flex min-w-60 min-h-10 items-center overflow-hidden flex-wrap justify-center">
              <div
                className="flex items-center justify-center gap-1.5 min-h-10 px-3.5 py-2 border-r border-[#E5E5E5] bg-white cursor-pointer hover:bg-gray-50"
                onClick={() => setWorkordersPage(Math.max(1, workordersPage - 1))}
              >
                <img
                  loading="lazy"
                  src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/dc8342cc7d9ed7372ff27293ef7c08e463e9fba7?placeholderIfAbsent=true"
                  className="w-5 h-5"
                  alt=""
                />
                <div className="text-[#525252] text-base font-medium">Previous</div>
              </div>
              <div className="flex items-center justify-center min-h-10 min-w-10 px-2 gap-2 border-r border-[#E5E5E5] bg-white">
                <div className="text-[#0A0A0A] text-base font-medium">{workordersPage}</div>
              </div>
              <div
                className="flex items-center justify-center gap-1.5 min-h-10 px-4 py-2 border-r border-[#E5E5E5] bg-white cursor-pointer hover:bg-gray-50"
                onClick={() => setWorkordersPage(workordersPage + 1)}
              >
                <div className="text-[#525252] text-base font-medium">Next</div>
                <img
                  loading="lazy"
                  src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/34c281f37936da4ccce4bfe5d47937be9d7ed9c7?placeholderIfAbsent=true"
                  className="w-5 h-5"
                  alt=""
                />
              </div>
            </div>
          </div>

          {/* Work Orders Items Per Page Dropdown */}
          {workordersShowDropdown &&
            createPortal(
              <div
                className="bg-white overflow-hidden"
                style={{
                  border: "0.5px solid #DADADA",
                  borderRadius: "8px",
                  boxShadow:
                    "0 38px 11px 0 rgba(0, 0, 0, 0.00), 0 24px 10px 0 rgba(0, 0, 0, 0.01), 0 14px 8px 0 rgba(0, 0, 0, 0.04), 0 6px 6px 0 rgba(0, 0, 0, 0.06), 0 2px 3px 0 rgba(0, 0, 0, 0.07)",
                  zIndex: 99999,
                  minWidth: "56px",
                  width: "56px",
                  position: "fixed",
                  top: workordersDropdownPos.top + "px",
                  left: workordersDropdownPos.left + "px",
                  pointerEvents: "auto",
                }}
                onMouseLeave={() => setWorkordersShowDropdown(false)}
              >
                {[10, 25, 50].map((size, index) => (
                  <button
                    key={size}
                    onClick={() => {
                      setWorkordersItemsPerPage(size);
                      setWorkordersPage(1);
                      setWorkordersShowDropdown(false);
                    }}
                    className={`w-full px-4 py-3 text-center text-base transition-colors whitespace-nowrap ${
                      workordersItemsPerPage === size
                        ? "bg-gray-50 font-medium text-gray-900"
                        : "text-[#303030] hover:bg-gray-50"
                    }`}
                    style={{
                      fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                      fontSize: "16px",
                      lineHeight: "140%",
                      letterSpacing: "-0.32px",
                      borderRadius: index === 2 ? "0 0 8px 8px" : "0",
                    }}
                  >
                    {size}
                  </button>
                ))}
              </div>,
              document.body,
            )}
        </div>
      )}

      {/* Field Team Orders Table */}
      {activeTab === "fieldteam" && (
        <div className="w-full border border-gray-200 bg-white rounded-lg overflow-hidden">
          {/* Header */}
          <div className="bg-white flex w-full px-4 py-4 items-center gap-4 justify-between flex-wrap border-b border-gray-200">
            <div className="flex items-center gap-4">
              <div className="text-[#303030] font-medium text-[22px] leading-[1.09]">
                Field Team Orders
              </div>
            </div>
            <div className="flex min-w-60 items-start gap-2.5">
              <div className="flex min-w-60 min-h-9 gap-2 items-center px-3 rounded-lg border-[0.5px] border-[#DADADA] shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] bg-[#FBFBFB]">
                <img
                  loading="lazy"
                  src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/b47ca0b4fcf9eb132889213ca1e6a92de1087150?placeholderIfAbsent=true"
                  className="w-5 h-5"
                  alt=""
                />
                <input
                  type="text"
                  placeholder="Search..."
                  className="bg-transparent border-none outline-none text-[#303030] font-normal text-base leading-[1.4] tracking-[-0.32px]"
                />
              </div>
              <div className="rounded-lg bg-[#FBFBFB] shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] border border-[#DADADA] flex min-h-9 px-3 py-1.5 items-center gap-2 cursor-pointer hover:bg-gray-100">
                <div className="text-[#303030] font-normal text-base leading-[1.4] tracking-[-0.32px]">
                  Filter
                </div>
                <img
                  loading="lazy"
                  src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/81afa4c88f6177ebdc84321a1f0691342b9fcd92?placeholderIfAbsent=true"
                  className="w-[18px] h-[18px]"
                  alt=""
                />
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 h-12">
                  <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                    <span className="font-medium text-sm text-gray-700">
                      Description
                    </span>
                  </th>
                  <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                    <span className="font-medium text-sm text-gray-700">
                      Due Date
                    </span>
                  </th>
                  <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                    <span className="font-medium text-sm text-gray-700">
                      Field Team
                    </span>
                  </th>
                  <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                    <span className="font-medium text-sm text-gray-700">
                      Status
                    </span>
                  </th>
                  <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                    <span className="font-medium text-sm text-gray-700">
                      Amount
                    </span>
                  </th>
                  <th className="sticky right-0 px-2 py-3 text-center w-20 bg-white border-l border-gray-200">
                    <span className="font-medium text-sm text-gray-700">
                      Actions
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {mockPropertyFieldTeamOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-gray-200 hover:bg-gray-50 transition-colors h-12"
                  >
                    <td className="px-3 py-3 border-r border-gray-200 whitespace-nowrap">
                      <span className="text-gray-900 font-normal text-base">
                        {order.description}
                      </span>
                    </td>
                    <td className="px-3 py-3 border-r border-gray-200 whitespace-nowrap">
                      <span className="text-gray-900 font-normal text-base">
                        {order.dueDate}
                      </span>
                    </td>
                    <td className="px-3 py-3 border-r border-gray-200 whitespace-nowrap">
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
                    </td>
                    <td className="px-3 py-3 border-r border-gray-200 whitespace-nowrap">
                      <div
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-normal ${getStatusBadgeColor(
                          order.status,
                        )}`}
                      >
                        {order.status}
                      </div>
                    </td>
                    <td className="px-3 py-3 border-r border-gray-200 whitespace-nowrap">
                      <span className="text-gray-900 font-normal text-base">
                        ${order.amount}
                      </span>
                    </td>
                    <td className="sticky right-0 px-2 py-3 flex items-center justify-center bg-white border-l border-gray-200">
                      <ActionButton
                        itemId={order.id}
                        openMenuId={openMenuId}
                        setOpenMenuId={setOpenMenuId}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between w-full gap-4 flex-wrap px-6 py-4 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <div className="text-[#525252] text-base font-medium">Showing</div>
              <button
                ref={fieldteamDropdownRef}
                onClick={() => setFieldteamShowDropdown(!fieldteamShowDropdown)}
                className="rounded-lg bg-[#FBFBFB] shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] border border-[#DADADA] flex min-h-10 px-3 py-2.5 items-center gap-2 cursor-pointer hover:bg-gray-100"
              >
                <div className="text-[#0A0A0A] text-base font-medium">{fieldteamItemsPerPage}</div>
                <img
                  loading="lazy"
                  src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/cc5507ba17118962f81e4f61a415adb6e3ee75ee?placeholderIfAbsent=true"
                  className="w-[18px] h-[18px]"
                  alt=""
                />
              </button>
              <div className="text-[#525252] text-base font-medium">of {mockPropertyFieldTeamOrders.length}</div>
            </div>
            <div className="rounded-lg bg-[#FBFBFB] shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] border border-[#DADADA] flex min-w-60 min-h-10 items-center overflow-hidden flex-wrap justify-center">
              <div
                className="flex items-center justify-center gap-1.5 min-h-10 px-3.5 py-2 border-r border-[#E5E5E5] bg-white cursor-pointer hover:bg-gray-50"
                onClick={() => setFieldteamPage(Math.max(1, fieldteamPage - 1))}
              >
                <img
                  loading="lazy"
                  src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/dc8342cc7d9ed7372ff27293ef7c08e463e9fba7?placeholderIfAbsent=true"
                  className="w-5 h-5"
                  alt=""
                />
                <div className="text-[#525252] text-base font-medium">Previous</div>
              </div>
              <div className="flex items-center justify-center min-h-10 min-w-10 px-2 gap-2 border-r border-[#E5E5E5] bg-white">
                <div className="text-[#0A0A0A] text-base font-medium">{fieldteamPage}</div>
              </div>
              <div
                className="flex items-center justify-center gap-1.5 min-h-10 px-4 py-2 border-r border-[#E5E5E5] bg-white cursor-pointer hover:bg-gray-50"
                onClick={() => setFieldteamPage(fieldteamPage + 1)}
              >
                <div className="text-[#525252] text-base font-medium">Next</div>
                <img
                  loading="lazy"
                  src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/34c281f37936da4ccce4bfe5d47937be9d7ed9c7?placeholderIfAbsent=true"
                  className="w-5 h-5"
                  alt=""
                />
              </div>
            </div>
          </div>

          {/* Field Team Items Per Page Dropdown */}
          {fieldteamShowDropdown &&
            createPortal(
              <div
                className="bg-white overflow-hidden"
                style={{
                  border: "0.5px solid #DADADA",
                  borderRadius: "8px",
                  boxShadow:
                    "0 38px 11px 0 rgba(0, 0, 0, 0.00), 0 24px 10px 0 rgba(0, 0, 0, 0.01), 0 14px 8px 0 rgba(0, 0, 0, 0.04), 0 6px 6px 0 rgba(0, 0, 0, 0.06), 0 2px 3px 0 rgba(0, 0, 0, 0.07)",
                  zIndex: 99999,
                  minWidth: "56px",
                  width: "56px",
                  position: "fixed",
                  top: fieldteamDropdownPos.top + "px",
                  left: fieldteamDropdownPos.left + "px",
                  pointerEvents: "auto",
                }}
                onMouseLeave={() => setFieldteamShowDropdown(false)}
              >
                {[10, 25, 50].map((size, index) => (
                  <button
                    key={size}
                    onClick={() => {
                      setFieldteamItemsPerPage(size);
                      setFieldteamPage(1);
                      setFieldteamShowDropdown(false);
                    }}
                    className={`w-full px-4 py-3 text-center text-base transition-colors whitespace-nowrap ${
                      fieldteamItemsPerPage === size
                        ? "bg-gray-50 font-medium text-gray-900"
                        : "text-[#303030] hover:bg-gray-50"
                    }`}
                    style={{
                      fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                      fontSize: "16px",
                      lineHeight: "140%",
                      letterSpacing: "-0.32px",
                      borderRadius: index === 2 ? "0 0 8px 8px" : "0",
                    }}
                  >
                    {size}
                  </button>
                ))}
              </div>,
              document.body,
            )}
        </div>
      )}
    </div>
  );
};
