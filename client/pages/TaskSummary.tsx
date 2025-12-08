import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";

interface Task {
  id: number;
  status: string;
  title: string;
  property: string;
  due: string;
  updated: string;
  age: string;
  priority: string;
  assignee: string;
}

const mockTasks: Record<number, Task & { description?: string; category?: string; totalExpense?: string; workOrders?: number; ftos?: number; createdBy?: string; createdDate?: string; lastUpdated?: string }> = {
  1: {
    id: 1,
    status: "Completed",
    title: "Doors Need To Be Repaired",
    property: "22 Indian Chase Dr",
    due: "Oct 2, 2025",
    updated: "Oct 2, 2025",
    age: "6 Days",
    priority: "Normal",
    assignee: "John Doe",
    description: "We have been experiencing issues with the water heater. At first we thought the issue was due to us just moving in and maybe the water heater needed time to heat up after no tenants. It has been 3 days in a row now that we lose hot water mid shower. My wife and I both timed it and we lose hot water in the shower after about 5 min. It also takes about 3-4 min to even heat up.",
    category: "Uncategorized",
    totalExpense: "$1,450.50",
    workOrders: 5,
    ftos: 3,
    createdBy: "Julia LoSchiavo",
    createdDate: "11/12/2025 9:28 PM",
    lastUpdated: "11/12/2025 9:22 PM",
  },
  2: {
    id: 2,
    status: "In Progress",
    title: "Doors Need To Be Repaired",
    property: "22 Indian Chase Dr",
    due: "Sep 25, 2025",
    updated: "Sep 25, 2025",
    age: "6 Days",
    priority: "Low",
    assignee: "Jane Smith",
    description: "Door repair needed for main entrance.",
    category: "Uncategorized",
    totalExpense: "$800.00",
    workOrders: 2,
    ftos: 1,
    createdBy: "Julia LoSchiavo",
    createdDate: "11/12/2025 9:28 PM",
    lastUpdated: "11/12/2025 9:22 PM",
  },
  3: {
    id: 3,
    status: "Completed",
    title: "Doors Need To Be Repaired",
    property: "22 Indian Chase Dr",
    due: "Sep 12, 2025",
    updated: "Sep 12, 2025",
    age: "6 Days",
    priority: "Normal",
    assignee: "John Doe",
    description: "Completed door repairs on main entrance.",
    category: "Maintenance",
    totalExpense: "$1,200.00",
    workOrders: 3,
    ftos: 2,
    createdBy: "Julia LoSchiavo",
    createdDate: "11/12/2025 9:28 PM",
    lastUpdated: "11/12/2025 9:22 PM",
  },
  4: {
    id: 4,
    status: "Completed",
    title: "Doors Need To Be Repaired",
    property: "22 Indian Chase Dr",
    due: "Sep 6, 2025",
    updated: "Sep 6, 2025",
    age: "6 Days",
    priority: "High",
    assignee: "Mike Johnson",
    description: "Urgent door repairs needed.",
    category: "Urgent",
    totalExpense: "$950.00",
    workOrders: 4,
    ftos: 2,
    createdBy: "Julia LoSchiavo",
    createdDate: "11/12/2025 9:28 PM",
    lastUpdated: "11/12/2025 9:22 PM",
  },
  5: {
    id: 5,
    status: "Completed",
    title: "Doors Need To Be Repaired",
    property: "22 Indian Chase Dr",
    due: "Sep 5, 2025",
    updated: "Sep 5, 2025",
    age: "6 Days",
    priority: "Normal",
    assignee: "Jane Smith",
    description: "Door maintenance completed.",
    category: "Maintenance",
    totalExpense: "$650.00",
    workOrders: 2,
    ftos: 1,
    createdBy: "Julia LoSchiavo",
    createdDate: "11/12/2025 9:28 PM",
    lastUpdated: "11/12/2025 9:22 PM",
  },
};

const StatusBadge = ({ status }: { status: string }) => {
  if (status === "Completed") {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-emerald-100 text-emerald-600">
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M5.00065 8.00016L7.00065 10.0002L11.0007 6.00016M14.6673 8.00016C14.6673 11.6821 11.6825 14.6668 8.00065 14.6668C4.31875 14.6668 1.33398 11.6821 1.33398 8.00016C1.33398 4.31826 4.31875 1.3335 8.00065 1.3335C11.6825 1.3335 14.6673 4.31826 14.6673 8.00016Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="font-medium text-sm">{status}</span>
      </div>
    );
  }

  if (status === "In Progress") {
    return (
      <div className="flex items-center gap-1 px-3 py-1.5 rounded-2xl bg-blue-50 text-blue-600">
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M2.91602 7H11.0827"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="font-medium text-sm">{status}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-gray-100 text-gray-700">
      <span className="font-medium text-sm">{status}</span>
    </div>
  );
};

const PriorityBadge = ({ priority }: { priority: string }) => {
  if (priority === "Low") {
    return (
      <div className="flex items-center gap-1 px-3 py-1.5 rounded-2xl bg-emerald-50 text-emerald-600">
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M6.99935 2.91675V11.0834M6.99935 11.0834L11.0827 7.00008M6.99935 11.0834L2.91602 7.00008"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="font-medium text-sm">{priority}</span>
      </div>
    );
  }

  if (priority === "Normal") {
    return (
      <div className="flex items-center gap-1 px-3 py-1.5 rounded-2xl bg-blue-50 text-blue-600">
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M2.91602 7H11.0827"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="font-medium text-sm">{priority}</span>
      </div>
    );
  }

  if (priority === "High") {
    return (
      <div className="flex items-center gap-1 px-3 py-1.5 rounded-2xl bg-amber-50 text-amber-600">
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M8.00065 5.33325V7.99992M8.00065 10.6666H8.00732M14.6673 7.99992C14.6673 11.6818 11.6825 14.6666 8.00065 14.6666C4.31875 14.6666 1.33398 11.6818 1.33398 7.99992C1.33398 4.31802 4.31875 1.33325 8.00065 1.33325C11.6825 1.33325 14.6673 4.31802 14.6673 7.99992Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="font-medium text-sm">{priority}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-gray-100 text-gray-700">
      <span className="font-medium text-sm">{priority}</span>
    </div>
  );
};

export default function TaskSummary() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const [notes, setNotes] = useState<string>("");

  const id = taskId ? parseInt(taskId, 10) : null;
  const task = id && mockTasks[id] ? mockTasks[id] : null;

  if (!task) {
    return (
      <div className="bg-white p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-500 text-lg mb-4">Task not found</p>
          <button
            onClick={() => navigate("/all-tasks")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Tasks
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-white"
      style={{
        borderLeftWidth: "1px",
        borderLeftColor: "rgb(210, 209, 207)",
        padding: "32px 32px 150px",
      }}
    >
      <div className="max-w-full mx-auto flex flex-col gap-6">
        {/* Header Section */}
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-[#303030] font-semibold text-2xl leading-[30px]">
              {task.title}
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[#717179] font-medium text-base">
                Task ID:
              </span>
              <span className="text-[#303030] font-medium text-base">
                {String(task.id).padStart(8, "0")}
              </span>
            </div>
          </div>
          <button
            onClick={() => navigate("/all-tasks")}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
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
        </div>

        {/* Status Bar */}
        <div className="flex items-center gap-6 p-4 rounded-lg border border-gray-200 bg-gray-50">
          <div className="flex flex-col gap-1">
            <span className="text-[#717179] font-medium text-sm">Status</span>
            <StatusBadge status={task.status} />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[#717179] font-medium text-sm">Priority</span>
            <PriorityBadge priority={task.priority} />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[#717179] font-medium text-sm">Due Date</span>
            <span className="text-[#303030] font-medium text-sm">{task.due}</span>
          </div>
          <div className="flex flex-col gap-1 ml-auto">
            <span className="text-[#717179] font-medium text-sm">
              Last Updated
            </span>
            <span className="text-[#303030] font-medium text-sm">
              {task.lastUpdated}
            </span>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Overview Section */}
            <div className="p-4 rounded-lg border border-gray-200 bg-white">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[#303030] font-semibold text-lg">
                  Overview
                </h2>
                <button className="text-blue-600 hover:underline text-sm font-medium">
                  Edit
                </button>
              </div>
              <div className="space-y-3 text-sm">
                <p className="text-[#717179]">
                  <span className="font-medium">Created by</span> {task.createdBy}{" "}
                  <span className="font-medium">for</span> {task.property}
                </p>
                <div className="flex items-center gap-4 pt-3 border-t border-gray-200">
                  <div>
                    <div className="text-[#717179] font-medium text-xs">
                      Created
                    </div>
                    <div className="text-[#303030] text-sm">
                      {task.createdDate}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Category Section */}
            <div className="p-4 rounded-lg border border-gray-200 bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[#717179] font-medium text-sm mb-1">
                    Category:
                  </div>
                  <div className="text-[#303030] text-sm">
                    {task.category}
                  </div>
                </div>
              </div>
            </div>

            {/* Description Section */}
            <div className="p-4 rounded-lg border border-gray-200 bg-white">
              <h3 className="text-[#717179] font-medium text-sm mb-3">
                Description:
              </h3>
              <p className="text-[#303030] text-sm leading-relaxed">
                {task.description}
              </p>
            </div>

            {/* Stats Section */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-lg border border-gray-200 bg-white">
                <div className="text-[#717179] font-medium text-xs mb-2">
                  TOTAL EXPENSE
                </div>
                <div className="text-[#303030] font-semibold text-xl">
                  {task.totalExpense}
                </div>
              </div>
              <div className="p-4 rounded-lg border border-gray-200 bg-white">
                <div className="text-[#717179] font-medium text-xs mb-2">
                  WORK ORDERS
                </div>
                <div className="text-[#303030] font-semibold text-xl">
                  {task.workOrders}
                </div>
              </div>
              <div className="p-4 rounded-lg border border-gray-200 bg-white">
                <div className="text-[#717179] font-medium text-xs mb-2">
                  FTOs
                </div>
                <div className="text-[#303030] font-semibold text-xl">
                  {task.ftos}
                </div>
              </div>
            </div>

            {/* Notes Section */}
            <div className="p-4 rounded-lg border border-gray-200 bg-white">
              <h3 className="text-[#303030] font-semibold text-sm mb-3">
                Notes
              </h3>
              <textarea
                placeholder="Add some note here"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-lg bg-gray-50 text-sm text-[#303030] placeholder:text-[#717179] resize-none focus:outline-none focus:border-blue-500 focus:bg-white"
                rows={4}
              />
            </div>

            {/* Files Section */}
            <div className="p-4 rounded-lg border border-gray-200 bg-white">
              <h3 className="text-[#303030] font-semibold text-sm mb-3">
                Files
              </h3>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <p className="text-[#717179] text-sm mb-1">
                  Choose a file or drag & drop it here
                </p>
                <p className="text-[#717179] text-xs">
                  Maximum 500 MB file size
                </p>
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            {/* Assignee Card */}
            <div className="p-4 rounded-lg border border-gray-200 bg-white">
              <h3 className="text-[#303030] font-semibold text-sm mb-3">
                Assigned to
              </h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold text-sm">
                  {task.assignee
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <div className="flex-1">
                  <div className="text-[#303030] font-medium text-sm">
                    {task.assignee}
                  </div>
                  <div className="text-[#717179] text-xs">Staff Member</div>
                </div>
              </div>
            </div>

            {/* Property Card */}
            <div className="p-4 rounded-lg border border-gray-200 bg-white">
              <h3 className="text-[#303030] font-semibold text-sm mb-3">
                Property
              </h3>
              <div className="text-[#303030] text-sm font-medium">
                {task.property}
              </div>
              <div className="text-[#717179] text-xs mt-1">Rental</div>
            </div>

            {/* Quick Stats */}
            <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[#717179]">Age</span>
                  <span className="text-[#303030] font-medium">
                    {task.age}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[#717179]">Status</span>
                  <span className="text-[#303030] font-medium">
                    {task.status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
