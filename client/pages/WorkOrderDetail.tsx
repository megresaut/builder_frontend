import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, Plus } from "lucide-react";

interface WorkOrderDetailData {
  id: number;
  task: string;
  dueDate: string;
  updatedDate: string;
  age: string;
  priority: "High" | "Low" | "Normal";
  status: "In progress" | "Completed";
  billStatus: "Paid" | "Unpaid" | "Awaiting Invoice";
  billTotal: string;
  workOrderName: string;
  vendor: string;
  property: string;
  unit: string;
  notes: string;
  parentTaskId?: number;
}

interface AssociatedTask {
  id: number;
  name: string;
  status: "In progress" | "Completed";
  dueDate: string;
  priority: "High" | "Low" | "Normal";
}

interface AssociatedFTO {
  id: number;
  name: string;
  status: "Assigned" | "In Progress" | "Completed";
  assignee: string;
  dueDate: string;
}

const mockWorkOrderDetails: Record<number, WorkOrderDetailData> = {
  1: {
    id: 1,
    task: "Doors need to be repaired",
    dueDate: "Oct 2, 2025",
    updatedDate: "Oct 2, 2025",
    age: "6 days 5 hours",
    priority: "High",
    status: "In progress",
    billStatus: "Paid",
    billTotal: "$420",
    workOrderName: "Door Repair - Unit 101",
    vendor: "ABC Repairs Inc.",
    property: "22 Indian Chase Dr",
    unit: "Unit 101",
    notes:
      "Replace damaged door frames and hinges. Sand and refinish to match existing doors.",
    parentTaskId: 1,
  },
  2: {
    id: 2,
    task: "Doors need to be repaired",
    dueDate: "Sep 29, 2025",
    updatedDate: "Sep 29, 2025",
    age: "6 days 5 hours",
    priority: "Low",
    status: "In progress",
    billStatus: "Awaiting Invoice",
    billTotal: "No invoice",
    workOrderName: "Door Maintenance - Common Areas",
    vendor: "XYZ Maintenance",
    property: "22 Indian Chase Dr",
    unit: "Common Area",
    notes: "Routine maintenance on main entry doors.",
    parentTaskId: 2,
  },
};

const mockAssociatedTasks: Record<number, AssociatedTask[]> = {
  1: [
    {
      id: 1,
      name: "Doors need to be repaired",
      status: "In progress",
      dueDate: "Oct 2, 2025",
      priority: "High",
    },
  ],
  2: [
    {
      id: 2,
      name: "Doors need to be repaired",
      status: "In progress",
      dueDate: "Sep 29, 2025",
      priority: "Low",
    },
  ],
};

const mockAssociatedFTOs: Record<number, AssociatedFTO[]> = {
  1: [
    {
      id: 101,
      name: "Door Frame Inspection",
      status: "In Progress",
      assignee: "Jerry Sanchez",
      dueDate: "Oct 1, 2025",
    },
    {
      id: 102,
      name: "Parts Ordering",
      status: "Assigned",
      assignee: "John Doe",
      dueDate: "Sep 30, 2025",
    },
  ],
  2: [
    {
      id: 201,
      name: "Door Lubrication",
      status: "Completed",
      assignee: "Jane Smith",
      dueDate: "Sep 28, 2025",
    },
  ],
};

export default function WorkOrderDetail() {
  const { workOrderId } = useParams<{ workOrderId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"overview" | "tasks" | "ftos">(
    "overview",
  );

  const id = parseInt(workOrderId || "1", 10);
  const workOrder = mockWorkOrderDetails[id] || mockWorkOrderDetails[1];
  const associatedTasks = mockAssociatedTasks[id] || [];
  const associatedFTOs = mockAssociatedFTOs[id] || [];

  const getPriorityColor = (priority: string) => {
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

  const getStatusColor = (status: string) => {
    if (status === "Completed" || status === "In Progress") {
      return "bg-emerald-100 text-emerald-600";
    }
    return "bg-blue-100 text-blue-600";
  };

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
        {/* Header with back button */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/work-orders")}
            className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex flex-col gap-1">
            <h1 className="text-[#303030] font-semibold text-2xl leading-[30px]">
              {workOrder.workOrderName}
            </h1>
            <p className="text-[#717179] font-medium text-base leading-4">
              Work Order #{workOrder.id}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("overview")}
            className={`pb-3 px-1 font-medium text-sm transition-colors ${
              activeTab === "overview"
                ? "text-[#013764] border-b-2 border-[#013764]"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("tasks")}
            className={`pb-3 px-1 font-medium text-sm transition-colors ${
              activeTab === "tasks"
                ? "text-[#013764] border-b-2 border-[#013764]"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Associated Tasks
          </button>
          <button
            onClick={() => setActiveTab("ftos")}
            className={`pb-3 px-1 font-medium text-sm transition-colors ${
              activeTab === "ftos"
                ? "text-[#013764] border-b-2 border-[#013764]"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Field Team Orders
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div className="flex flex-col gap-6">
            {/* Work Order Details Grid */}
            <div className="grid grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-[#717179] font-medium text-sm">
                  Work Order Name
                </label>
                <p className="text-[#303030] font-normal text-base">
                  {workOrder.workOrderName}
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[#717179] font-medium text-sm">
                  Vendor
                </label>
                <p className="text-[#303030] font-normal text-base">
                  {workOrder.vendor}
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[#717179] font-medium text-sm">
                  Property
                </label>
                <p className="text-[#303030] font-normal text-base">
                  {workOrder.property}
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[#717179] font-medium text-sm">
                  Unit
                </label>
                <p className="text-[#303030] font-normal text-base">
                  {workOrder.unit}
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[#717179] font-medium text-sm">
                  Status
                </label>
                <div className="inline-flex w-fit">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{
                        backgroundColor:
                          workOrder.status === "Completed" ? "#059669" : "#2463EB",
                      }}
                    />
                    <span className="text-sm text-gray-900">
                      {workOrder.status}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[#717179] font-medium text-sm">
                  Priority
                </label>
                <div className="inline-flex w-fit">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{
                        backgroundColor:
                          workOrder.priority === "High"
                            ? "#D97706"
                            : workOrder.priority === "Low"
                              ? "#059669"
                              : "#2463EB",
                      }}
                    />
                    <span className="text-sm text-gray-900">
                      {workOrder.priority}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[#717179] font-medium text-sm">
                  Due Date
                </label>
                <p className="text-[#303030] font-normal text-base">
                  {workOrder.dueDate}
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[#717179] font-medium text-sm">
                  Bill Status
                </label>
                <div className="inline-flex w-fit">
                  <div
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-normal ${
                      workOrder.billStatus === "Paid"
                        ? "bg-green-100 text-green-600"
                        : workOrder.billStatus === "Unpaid"
                          ? "bg-red-100 text-red-600"
                          : "bg-yellow-100 text-yellow-600"
                    }`}
                  >
                    {workOrder.billStatus}
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[#717179] font-medium text-sm">
                  Bill Total
                </label>
                <p className="text-[#303030] font-normal text-base">
                  {workOrder.billTotal}
                </p>
              </div>
            </div>

            {/* Notes Section */}
            <div className="flex flex-col gap-2">
              <label className="text-[#717179] font-medium text-sm">
                Notes
              </label>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-[#303030] font-normal text-base">
                  {workOrder.notes}
                </p>
              </div>
            </div>

            {/* Parent Task Link */}
            {workOrder.parentTaskId && (
              <div className="flex flex-col gap-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <label className="text-[#717179] font-medium text-sm">
                  Parent Task
                </label>
                <button
                  onClick={() => navigate(`/tasks/${workOrder.parentTaskId}`)}
                  className="text-[#013764] font-medium text-base hover:underline text-left"
                >
                  {workOrder.task} →
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === "tasks" && (
          <div className="flex flex-col gap-4">
            {associatedTasks.length === 0 ? (
              <p className="text-[#717179] font-normal text-base">
                No associated tasks
              </p>
            ) : (
              associatedTasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => navigate(`/tasks/${task.id}`)}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col gap-2 flex-1">
                      <h3 className="text-[#303030] font-medium text-base">
                        {task.name}
                      </h3>
                      <p className="text-[#717179] font-normal text-sm">
                        Due: {task.dueDate}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <div
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-normal ${getStatusColor(
                          task.status,
                        )}`}
                      >
                        {task.status}
                      </div>
                      <div
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-normal ${getPriorityColor(
                          task.priority,
                        )}`}
                      >
                        {task.priority}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "ftos" && (
          <div className="flex flex-col gap-4">
            {associatedFTOs.length === 0 ? (
              <p className="text-[#717179] font-normal text-base">
                No field team orders
              </p>
            ) : (
              associatedFTOs.map((fto) => (
                <div
                  key={fto.id}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col gap-2 flex-1">
                      <h3 className="text-[#303030] font-medium text-base">
                        {fto.name}
                      </h3>
                      <p className="text-[#717179] font-normal text-sm">
                        Assigned to: {fto.assignee}
                      </p>
                      <p className="text-[#717179] font-normal text-sm">
                        Due: {fto.dueDate}
                      </p>
                    </div>
                    <div
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-normal whitespace-nowrap ${
                        fto.status === "Completed"
                          ? "bg-green-100 text-green-600"
                          : fto.status === "In Progress"
                            ? "bg-blue-100 text-blue-600"
                            : "bg-yellow-100 text-yellow-600"
                      }`}
                    >
                      {fto.status}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
