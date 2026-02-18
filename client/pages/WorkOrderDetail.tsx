import { useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, Plus } from "lucide-react";
import { usePageState } from "@/hooks/usePageState";
import { useSortingTable } from "@/hooks/useSortingTable";
import { useColumnManagement } from "@/hooks/useColumnManagement";
import ColumnFilterModal from "@/components/ColumnFilterModal";
import GlobalTable from "@/components/GlobalTable";
import PageTemplate from "@/layout/PageTemplate";
import { formatUnitDisplayForTable } from "@/utils/unitLabel";

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
  const [tasksList, setTasksList] = useState<AssociatedTask[]>(mockAssociatedTasks[id] || []);
  const [ftosList, setFtosList] = useState<AssociatedFTO[]>(mockAssociatedFTOs[id] || []);

  // Tasks table state management
  const [tasksCurrentPage, setTasksCurrentPage] = usePageState("tasksCurrentPage", 1);
  const [tasksItemsPerPage, setTasksItemsPerPage] = usePageState("tasksItemsPerPage", 50);
  const [tasksShowPageSizeDropdown, setTasksShowPageSizeDropdown] = usePageState("tasksShowPageSizeDropdown", false);
  const [tasksOpenMenuId, setTasksOpenMenuId] = usePageState<number | null>("tasksOpenMenuId", null);
  const [tasksSearchValue, setTasksSearchValue] = usePageState("tasksSearchValue", "");

  // FTOs table state management
  const [ftosCurrentPage, setFtosCurrentPage] = usePageState("ftosCurrentPage", 1);
  const [ftosItemsPerPage, setFtosItemsPerPage] = usePageState("ftosItemsPerPage", 50);
  const [ftosShowPageSizeDropdown, setFtosShowPageSizeDropdown] = usePageState("ftosShowPageSizeDropdown", false);
  const [ftosOpenMenuId, setFtosOpenMenuId] = usePageState<number | null>("ftosOpenMenuId", null);
  const [ftosSearchValue, setFtosSearchValue] = usePageState("ftosSearchValue", "");

  // Tasks column management
  const tasksColumnManagement = useColumnManagement([
    "name",
    "status",
    "dueDate",
    "priority",
  ]);

  // FTOs column management
  const ftosColumnManagement = useColumnManagement([
    "name",
    "status",
    "assignee",
    "dueDate",
  ]);

  // Tasks table sorting
  const filteredTasks = tasksList.filter((task) => {
    const searchLower = tasksSearchValue.toLowerCase();
    return (
      task.name.toLowerCase().includes(searchLower) ||
      task.status.toLowerCase().includes(searchLower) ||
      task.dueDate.toLowerCase().includes(searchLower) ||
      task.priority.toLowerCase().includes(searchLower)
    );
  });

  const { handleSortClick: tasksHandleSortClick, getSortIndicator: tasksGetSortIndicator, getSortedData: tasksGetSortedData } = useSortingTable(filteredTasks, "workOrderTasks");

  // FTOs table sorting
  const filteredFTOs = ftosList.filter((fto) => {
    const searchLower = ftosSearchValue.toLowerCase();
    return (
      fto.name.toLowerCase().includes(searchLower) ||
      fto.status.toLowerCase().includes(searchLower) ||
      fto.assignee.toLowerCase().includes(searchLower) ||
      fto.dueDate.toLowerCase().includes(searchLower)
    );
  });

  const { handleSortClick: ftosHandleSortClick, getSortIndicator: ftosGetSortIndicator, getSortedData: ftosGetSortedData } = useSortingTable(filteredFTOs, "workOrderFTOs");

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "#d97706";
      case "Low":
        return "#059669";
      case "Normal":
        return "#2463eb";
      default:
        return "#2463eb";
    }
  };

  const getStatusColor = (status: string) => {
    if (status === "Completed") return "#059669";
    if (status === "In Progress") return "#2463EB";
    return "#d97706";
  };

  const getFTOStatusColor = (status: string) => {
    if (status === "Completed") return "#059669";
    if (status === "In Progress") return "#2463EB";
    return "#d97706";
  };

  // Tasks table column definitions
  const tasksColumns = [
    {
      key: "name",
      label: "Task Name",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z" />
          <circle cx="7.5" cy="7.5" r=".5" fill="currentColor" />
        </svg>
      ),
    },
    {
      key: "status",
      label: "Status",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ),
    },
    {
      key: "dueDate",
      label: "Date of Work",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M8 2v4" />
          <path d="M16 2v4" />
          <rect width="18" height="18" x="3" y="4" rx="2" />
          <path d="M3 10h18" />
        </svg>
      ),
    },
    {
      key: "priority",
      label: "Priority",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="5" x2="12" y2="19" />
          <polyline points="19 12 12 19 5 12" />
        </svg>
      ),
    },
  ];

  // FTOs table column definitions
  const ftosColumns = [
    {
      key: "name",
      label: "FTO Name",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z" />
          <circle cx="7.5" cy="7.5" r=".5" fill="currentColor" />
        </svg>
      ),
    },
    {
      key: "status",
      label: "Status",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ),
    },
    {
      key: "assignee",
      label: "Assignee",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
    },
    {
      key: "dueDate",
      label: "Date of Work",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M8 2v4" />
          <path d="M16 2v4" />
          <rect width="18" height="18" x="3" y="4" rx="2" />
          <path d="M3 10h18" />
        </svg>
      ),
    },
  ];

  return (
    <PageTemplate>
      <div className="flex flex-col gap-6 w-fit min-w-full">
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
                  {formatUnitDisplayForTable(workOrder.unit)}
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
                    <span className="text-sm text-gray-900">
                      {workOrder.billStatus}
                    </span>
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
          <GlobalTable
            columns={tasksColumns}
            data={filteredTasks}
            rowKey="id"
            showSearchBar={true}
            searchValue={tasksSearchValue}
            onSearchChange={setTasksSearchValue}
            renderCell={(task: AssociatedTask, columnKey: string) => {
              if (columnKey === "name") {
                return (
                  <span className="text-gray-900 font-normal text-sm truncate">
                    {task.name}
                  </span>
                );
              }
              if (columnKey === "status") {
                return (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        backgroundColor: getStatusColor(task.status),
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ fontSize: "14px", color: getStatusColor(task.status) }}>
                      {task.status}
                    </span>
                  </div>
                );
              }
              if (columnKey === "dueDate") {
                return (
                  <span className="text-gray-900 font-normal text-sm truncate">
                    {task.dueDate}
                  </span>
                );
              }
              if (columnKey === "priority") {
                return (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        backgroundColor: getPriorityColor(task.priority),
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ fontSize: "14px", color: getPriorityColor(task.priority) }}>
                      {task.priority}
                    </span>
                  </div>
                );
              }
              return null;
            }}
            sortingHook={{
              handleSortClick: tasksHandleSortClick,
              getSortIndicator: tasksGetSortIndicator,
              getSortedData: tasksGetSortedData,
            }}
            columnManagementHook={{
              columnOrder: tasksColumnManagement.columnOrder,
              visibleColumns: tasksColumnManagement.visibleColumns,
              draggedColumn: tasksColumnManagement.draggedColumn,
              dropTargetColumn: tasksColumnManagement.dropTargetColumn,
              dropPosition: tasksColumnManagement.dropPosition,
              columnMenuPos: tasksColumnManagement.columnMenuPos,
              columnButtonRef: tasksColumnManagement.columnButtonRef,
              toggleColumnVisibility: tasksColumnManagement.toggleColumnVisibility,
              handleColumnDragStart: tasksColumnManagement.handleColumnDragStart,
              handleColumnDragOver: tasksColumnManagement.handleColumnDragOver,
              handleColumnDragLeave: tasksColumnManagement.handleColumnDragLeave,
              handleColumnDrop: tasksColumnManagement.handleColumnDrop,
            }}
            currentPage={tasksCurrentPage}
            onPageChange={setTasksCurrentPage}
            itemsPerPage={tasksItemsPerPage}
            onItemsPerPageChange={setTasksItemsPerPage}
            showPageSizeDropdown={tasksShowPageSizeDropdown}
            onShowPageSizeDropdownChange={setTasksShowPageSizeDropdown}
            openMenuId={tasksOpenMenuId}
            onOpenMenuIdChange={setTasksOpenMenuId}
            actions={[
              {
                label: "View",
                icon: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                ),
                onClick: (task: AssociatedTask) => navigate(`/tasks/${task.id}`),
              },
            ]}
            headerActions={
              <button
                ref={tasksColumnManagement.columnButtonRef}
                onClick={() => {
                  setTasksShowPageSizeDropdown(false);
                  setTasksOpenMenuId(null);
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
            showColumnModal={tasksColumnManagement.showColumnModal}
            onShowColumnModalChange={tasksColumnManagement.setShowColumnModal}
          />
        )}

        {activeTab === "ftos" && (
          <GlobalTable
            columns={ftosColumns}
            data={filteredFTOs}
            rowKey="id"
            showSearchBar={true}
            searchValue={ftosSearchValue}
            onSearchChange={setFtosSearchValue}
            renderCell={(fto: AssociatedFTO, columnKey: string) => {
              if (columnKey === "name") {
                return (
                  <span className="text-gray-900 font-normal text-sm truncate">
                    {fto.name}
                  </span>
                );
              }
              if (columnKey === "status") {
                return (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        backgroundColor: getFTOStatusColor(fto.status),
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ fontSize: "14px", color: getFTOStatusColor(fto.status) }}>
                      {fto.status}
                    </span>
                  </div>
                );
              }
              if (columnKey === "assignee") {
                return (
                  <span className="text-gray-900 font-normal text-sm truncate">
                    {fto.assignee}
                  </span>
                );
              }
              if (columnKey === "dueDate") {
                return (
                  <span className="text-gray-900 font-normal text-sm truncate">
                    {fto.dueDate}
                  </span>
                );
              }
              return null;
            }}
            sortingHook={{
              handleSortClick: ftosHandleSortClick,
              getSortIndicator: ftosGetSortIndicator,
              getSortedData: ftosGetSortedData,
            }}
            columnManagementHook={{
              columnOrder: ftosColumnManagement.columnOrder,
              visibleColumns: ftosColumnManagement.visibleColumns,
              draggedColumn: ftosColumnManagement.draggedColumn,
              dropTargetColumn: ftosColumnManagement.dropTargetColumn,
              dropPosition: ftosColumnManagement.dropPosition,
              columnMenuPos: ftosColumnManagement.columnMenuPos,
              columnButtonRef: ftosColumnManagement.columnButtonRef,
              toggleColumnVisibility: ftosColumnManagement.toggleColumnVisibility,
              handleColumnDragStart: ftosColumnManagement.handleColumnDragStart,
              handleColumnDragOver: ftosColumnManagement.handleColumnDragOver,
              handleColumnDragLeave: ftosColumnManagement.handleColumnDragLeave,
              handleColumnDrop: ftosColumnManagement.handleColumnDrop,
            }}
            currentPage={ftosCurrentPage}
            onPageChange={setFtosCurrentPage}
            itemsPerPage={ftosItemsPerPage}
            onItemsPerPageChange={setFtosItemsPerPage}
            showPageSizeDropdown={ftosShowPageSizeDropdown}
            onShowPageSizeDropdownChange={setFtosShowPageSizeDropdown}
            openMenuId={ftosOpenMenuId}
            onOpenMenuIdChange={setFtosOpenMenuId}
            actions={[
              {
                label: "View",
                icon: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                ),
                onClick: (fto: AssociatedFTO) => {
                  // Navigate to FTO details if needed
                },
              },
            ]}
            headerActions={
              <button
                ref={ftosColumnManagement.columnButtonRef}
                onClick={() => {
                  setFtosShowPageSizeDropdown(false);
                  setFtosOpenMenuId(null);
                  ftosColumnManagement.setShowColumnModal((prev) => !prev);
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
            showColumnModal={ftosColumnManagement.showColumnModal}
            onShowColumnModalChange={ftosColumnManagement.setShowColumnModal}
          />
        )}

      {/* Column Filter Modal for Associated Tasks */}
      <ColumnFilterModal
        isOpen={tasksColumnManagement.showColumnModal}
        position={tasksColumnManagement.columnMenuPos}
        columns={tasksColumns.map((col) => ({
          key: col.key,
          label: col.label,
          icon: col.icon || null,
        }))}
        visibleColumns={tasksColumnManagement.visibleColumns}
        onToggleColumn={tasksColumnManagement.toggleColumnVisibility}
        onClose={() => tasksColumnManagement.setShowColumnModal(false)}
        buttonRef={tasksColumnManagement.columnButtonRef}
      />

      {/* Column Filter Modal for Field Team Orders */}
      <ColumnFilterModal
        isOpen={ftosColumnManagement.showColumnModal}
        position={ftosColumnManagement.columnMenuPos}
        columns={ftosColumns.map((col) => ({
          key: col.key,
          label: col.label,
          icon: col.icon || null,
        }))}
        visibleColumns={ftosColumnManagement.visibleColumns}
        onToggleColumn={ftosColumnManagement.toggleColumnVisibility}
        onClose={() => ftosColumnManagement.setShowColumnModal(false)}
        buttonRef={ftosColumnManagement.columnButtonRef}
      />
      </div>
    </PageTemplate>
  );
}
