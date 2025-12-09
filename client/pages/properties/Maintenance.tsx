import React, { useState, useRef, useEffect } from "react";
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
  const [recurringPage, setRecurringPage] = usePageState<number>("recurringPage", 1);
  const [workordersPage, setWorkordersPage] = usePageState<number>("workordersPage", 1);
  const [fieldteamPage, setFieldteamPage] = usePageState<number>("fieldteamPage", 1);

  const itemsPerPage = 10;

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
              <div className="text-[#0A0A0A] text-base font-medium">{itemsPerPage}</div>
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
                    <span className="font-medium text-sm text-gray-700">
                      Task
                    </span>
                  </th>
                  <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                    <span className="font-medium text-sm text-gray-700">
                      Next Date
                    </span>
                  </th>
                  <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                    <span className="font-medium text-sm text-gray-700">
                      Priority
                    </span>
                  </th>
                  <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                    <span className="font-medium text-sm text-gray-700">
                      Category
                    </span>
                  </th>
                  <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                    <span className="font-medium text-sm text-gray-700">
                      Assignees
                    </span>
                  </th>
                  <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                    <span className="font-medium text-sm text-gray-700">
                      Status
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
              <div className="text-[#0A0A0A] text-base font-medium">{itemsPerPage}</div>
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
                    <span className="font-medium text-sm text-gray-700">
                      Work Order
                    </span>
                  </th>
                  <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                    <span className="font-medium text-sm text-gray-700">
                      Due Date
                    </span>
                  </th>
                  <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                    <span className="font-medium text-sm text-gray-700">
                      Status
                    </span>
                  </th>
                  <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                    <span className="font-medium text-sm text-gray-700">
                      Priority
                    </span>
                  </th>
                  <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                    <span className="font-medium text-sm text-gray-700">
                      Bill Status
                    </span>
                  </th>
                  <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                    <span className="font-medium text-sm text-gray-700">
                      Bill Total
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
              <div className="text-[#0A0A0A] text-base font-medium">{itemsPerPage}</div>
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
        </div>
      )}
    </div>
  );
};
