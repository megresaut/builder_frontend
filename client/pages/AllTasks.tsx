import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import CreateTaskModal from "@/components/CreateTaskModal";
import { usePageState } from "@/hooks/usePageState";
import { useSortingTable } from "@/hooks/useSortingTable";
import { useColumnManagement } from "@/hooks/useColumnManagement";
import ColumnFilterModal from "@/components/ColumnFilterModal";
import GlobalTable from "@/components/GlobalTable";

interface Assignee {
  id: number;
  name: string;
  initials: string;
}

interface Task {
  id: number;
  status: string;
  title: string;
  property: string;
  due: string;
  updated: string;
  age: string;
  priority: string;
  assignees: Assignee[];
}

const tasks: Task[] = [
  {
    id: 1,
    status: "Completed",
    title: "Doors Need To Be Repaired",
    property: "22 Indian Chase Dr",
    due: "Oct 2, 2025",
    updated: "Oct 2, 2025",
    age: "6 Days",
    priority: "Normal",
    assignees: [{ id: 1, name: "John Doe", initials: "JD" }],
  },
  {
    id: 2,
    status: "In Progress",
    title: "Doors Need To Be Repaired",
    property: "22 Indian Chase Dr",
    due: "Sep 25, 2025",
    updated: "Sep 25, 2025",
    age: "6 Days",
    priority: "Low",
    assignees: [{ id: 2, name: "Jane Smith", initials: "JMS" }],
  },
  {
    id: 3,
    status: "Completed",
    title: "Doors Need To Be Repaired",
    property: "22 Indian Chase Dr",
    due: "Sep 12, 2025",
    updated: "Sep 12, 2025",
    age: "6 Days",
    priority: "Normal",
    assignees: [
      { id: 1, name: "John Doe", initials: "JD" },
      { id: 2, name: "Jane Smith", initials: "JMS" },
    ],
  },
  {
    id: 4,
    status: "Completed",
    title: "Doors Need To Be Repaired",
    property: "22 Indian Chase Dr",
    due: "Sep 6, 2025",
    updated: "Sep 6, 2025",
    age: "6 Days",
    priority: "High",
    assignees: [{ id: 3, name: "Mike Johnson", initials: "MJ" }],
  },
  {
    id: 5,
    status: "Completed",
    title: "Doors Need To Be Repaired",
    property: "22 Indian Chase Dr",
    due: "Sep 5, 2025",
    updated: "Sep 5, 2025",
    age: "6 Days",
    priority: "Normal",
    assignees: [
      { id: 2, name: "Jane Smith", initials: "JMS" },
      { id: 3, name: "Mike Johnson", initials: "MJ" },
    ],
  },
  {
    id: 6,
    status: "Completed",
    title: "Doors Need To Be Repaired",
    property: "22 Indian Chase Dr",
    due: "Sep 4, 2025",
    updated: "Sep 4, 2025",
    age: "6 Days",
    priority: "Normal",
    assignees: [{ id: 1, name: "John Doe", initials: "JD" }],
  },
  {
    id: 7,
    status: "Completed",
    title: "Doors Need To Be Repaired",
    property: "22 Indian Chase Dr",
    due: "Sep 3, 2025",
    updated: "Sep 3, 2025",
    age: "6 Days",
    priority: "Normal",
    assignees: [
      { id: 3, name: "Mike Johnson", initials: "MJ" },
      { id: 1, name: "John Doe", initials: "JD" },
    ],
  },
  {
    id: 8,
    status: "Completed",
    title: "Doors Need To Be Repaired",
    property: "22 Indian Chase Dr",
    due: "Sep 2, 2025",
    updated: "Sep 2, 2025",
    age: "6 Days",
    priority: "Normal",
    assignees: [{ id: 2, name: "Jane Smith", initials: "JMS" }],
  },
  {
    id: 9,
    status: "Completed",
    title: "Doors Need To Be Repaired",
    property: "22 Indian Chase Dr",
    due: "Sep 1, 2025",
    updated: "Sep 1, 2025",
    age: "6 Days",
    priority: "Normal",
    assignees: [
      { id: 1, name: "John Doe", initials: "JD" },
      { id: 2, name: "Jane Smith", initials: "JMS" },
    ],
  },
  {
    id: 10,
    status: "Completed",
    title: "Doors Need To Be Repaired",
    property: "22 Indian Chase Dr",
    due: "Sep 1, 2025",
    updated: "Sep 1, 2025",
    age: "6 Days",
    priority: "Normal",
    assignees: [{ id: 3, name: "Mike Johnson", initials: "MJ" }],
  },
];

const StatusBadge = ({ status }: { status: string }) => {
  const getStatusColor = (status: string) => {
    if (status === "Completed") return "#059669";
    if (status === "In Progress") return "#2463EB";
    return "#6B7280";
  };

  const dotColor = getStatusColor(status);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        color: dotColor,
        fontSize: "14px",
      }}
    >
      <div
        style={{
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          backgroundColor: dotColor,
          flexShrink: 0,
        }}
      />
      {status}
    </div>
  );
};

const PriorityBadge = ({ priority }: { priority: string }) => {
  const getPriorityColor = (priority: string) => {
    if (priority === "Low") return "#059669";
    if (priority === "Normal") return "#2463EB";
    if (priority === "High") return "#D97706";
    return "#6B7280";
  };

  const dotColor = getPriorityColor(priority);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        color: dotColor,
        fontSize: "14px",
      }}
    >
      <div
        style={{
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          backgroundColor: dotColor,
          flexShrink: 0,
        }}
      />
      {priority}
    </div>
  );
};

export default function AllTasks() {
  const navigate = useNavigate();
  const [tasksList, setTasksList] = useState<Task[]>(tasks);
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
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = usePageState(
    "isCreateTaskModalOpen",
    false,
  );

  const { handleSortClick, getSortIndicator, getSortedData } =
    useSortingTable(tasksList, "allTasks");
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
    "status",
    "title",
    "property",
    "due",
    "updated",
    "age",
    "assignees",
  ]);

  const columns = [
    {
      key: "priority",
      label: "Priority",
      icon: (
        <img
          loading="lazy"
          src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/2834b8d73cc09ccc447b824960316d0f5f8d8f78?placeholderIfAbsent=true"
          style={{ width: "16px", height: "16px" }}
          alt=""
        />
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
      key: "title",
      label: "Task",
      icon: (
        <img
          loading="lazy"
          src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/d5d01db2db718e32f4e620e7b1fc6ea705e115b1?placeholderIfAbsent=true"
          style={{ width: "16px", height: "16px" }}
          alt=""
        />
      ),
    },
    {
      key: "property",
      label: "Property",
      icon: (
        <img
          loading="lazy"
          src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/740b0728672435a7240e4fa940b3c63bfd7d09c1?placeholderIfAbsent=true"
          style={{ width: "16px", height: "16px" }}
          alt=""
        />
      ),
    },
    {
      key: "due",
      label: "Due",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect width="18" height="18" x="3" y="4" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
      ),
    },
    {
      key: "updated",
      label: "Updated",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect width="18" height="18" x="3" y="4" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
      ),
    },
    {
      key: "age",
      label: "Age",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
    },
    {
      key: "assignees",
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
  ];

  const handleDeleteTask = useCallback(
    (task: Task) => {
      setTasksList((prev) => prev.filter((t) => t.id !== task.id));
    },
    []
  );

  const handleEditTask = useCallback(
    (task: Task) => {
      setEditingTask(task);
      setIsCreateTaskModalOpen(true);
    },
    []
  );

  const actions = [
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
      onClick: handleEditTask,
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
      onClick: handleDeleteTask,
    },
  ];

  return (
    <div
      className="bg-white"
      style={{
        borderStyle: "none",
        borderWidth: "1px",
        padding: "32px 32px 150px",
      }}
    >
      <div className="flex flex-col gap-6 w-fit min-w-full">
        <div className="flex items-center gap-10 justify-between flex-wrap">
          <div className="flex flex-col gap-1 min-w-[240px]">
            <h1 className="text-[#303030] font-semibold text-2xl leading-[30px]">
              All Tasks
            </h1>
          </div>

          <button
            onClick={() => setIsCreateTaskModalOpen(true)}
            className="flex h-9 items-center gap-2 px-3 rounded-lg border border-white bg-[#013764] shadow-[0_0_0_1px_#002D5A] hover:bg-[#003a73] transition-colors"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M10 4.16667V15.8333M4.16667 10H15.8333"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="text-white font-medium text-base leading-normal">
              Add Task
            </span>
          </button>
        </div>

        <GlobalTable
          columns={columns}
          data={tasksList}
          rowKey="id"
          onRowClick={(task) => {
            navigate(`/tasks/${task.id}`);
          }}
          renderCell={(task, columnKey) => {
            if (columnKey === "priority") {
              return <PriorityBadge priority={task.priority} />;
            }
            if (columnKey === "status") {
              return <StatusBadge status={task.status} />;
            }
            if (columnKey === "title") {
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
            }
            if (columnKey === "property") {
              return (
                <span className="text-gray-900 font-normal text-sm truncate">
                  {task.property}
                </span>
              );
            }
            if (columnKey === "due") {
              return (
                <span className="text-gray-900 font-normal text-sm truncate">
                  {task.due}
                </span>
              );
            }
            if (columnKey === "updated") {
              return (
                <span className="text-gray-900 font-normal text-sm truncate">
                  {task.updated}
                </span>
              );
            }
            if (columnKey === "age") {
              return (
                <span className="text-gray-900 font-normal text-sm truncate">
                  {task.age}
                </span>
              );
            }
            if (columnKey === "assignees") {
              return (
                <div className="flex items-center gap-2">
                  {task.assignees.map((assignee) => (
                    <div key={assignee.id} className="relative group">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold cursor-pointer"
                        style={{
                          backgroundColor: "rgb(59, 130, 246)",
                          borderColor: "rgb(209, 213, 219)",
                          borderWidth: "1px",
                        }}
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
          actions={actions}
          title="Task List"
          headerActions={
            <button
              ref={columnButtonRef}
              onClick={() => {
                setShowPageSizeDropdown(false);
                setOpenMenuId(null);
                setShowColumnModal((prev) => !prev);
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
          showColumnModal={showColumnModal}
          onShowColumnModalChange={setShowColumnModal}
        />
      </div>

      <CreateTaskModal
        open={isCreateTaskModalOpen}
        onOpenChange={(open) => {
          setIsCreateTaskModalOpen(open);
          if (!open) {
            setEditingTask(null);
          }
        }}
      />

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
    </div>
  );
}
