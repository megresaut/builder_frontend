import { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import CreateTaskModal from "@/components/CreateTaskModal";
import PageHeader from "@/components/PageHeader";
import { usePageState } from "@/hooks/usePageState";
import { useSortingTable } from "@/hooks/useSortingTable";
import { useColumnManagement } from "@/hooks/useColumnManagement";
import ColumnFilterModal from "@/components/ColumnFilterModal";
import GlobalTable from "@/components/GlobalTable";
import PageTemplate from "@/layout/PageTemplate";
import {
  EditIcon,
  DeleteIcon,
  PlusIcon,
  CalendarIcon,
  ClockIcon,
  DotsIcon,
} from "@/components/icons";

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
  unit?: string;
  due: string;
  updated: string;
  age: string;
  priority: string;
  assignees: Assignee[];
  collaborators?: Assignee[];
}

const tasks: Task[] = [
  {
    id: 1,
    status: "Completed",
    title: "Doors Need To Be Repaired",
    property: "22 Indian Chase Dr",
    unit: "Unit 1A",
    due: "Oct 2, 2025",
    updated: "Oct 2, 2025",
    age: "6 Days",
    priority: "Normal",
    assignees: [{ id: 1, name: "John Doe", initials: "JD" }],
    collaborators: [{ id: 2, name: "Jane Smith", initials: "JMS" }],
  },
  {
    id: 2,
    status: "In Progress",
    title: "Doors Need To Be Repaired",
    property: "22 Indian Chase Dr",
    unit: "Unit 2B",
    due: "Sep 25, 2025",
    updated: "Sep 25, 2025",
    age: "6 Days",
    priority: "Low",
    assignees: [{ id: 2, name: "Jane Smith", initials: "JMS" }],
    collaborators: [{ id: 3, name: "Mike Johnson", initials: "MJ" }],
  },
  {
    id: 3,
    status: "Completed",
    title: "Doors Need To Be Repaired",
    property: "22 Indian Chase Dr",
    unit: "Unit 3C",
    due: "Sep 12, 2025",
    updated: "Sep 12, 2025",
    age: "6 Days",
    priority: "Normal",
    assignees: [
      { id: 1, name: "John Doe", initials: "JD" },
      { id: 2, name: "Jane Smith", initials: "JMS" },
    ],
    collaborators: [{ id: 3, name: "Mike Johnson", initials: "MJ" }],
  },
  {
    id: 4,
    status: "Completed",
    title: "Doors Need To Be Repaired",
    property: "22 Indian Chase Dr",
    unit: "Unit 1D",
    due: "Sep 6, 2025",
    updated: "Sep 6, 2025",
    age: "6 Days",
    priority: "High",
    assignees: [{ id: 3, name: "Mike Johnson", initials: "MJ" }],
    collaborators: [{ id: 1, name: "John Doe", initials: "JD" }],
  },
  {
    id: 5,
    status: "Completed",
    title: "Doors Need To Be Repaired",
    property: "22 Indian Chase Dr",
    unit: "Unit 2E",
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
    unit: "Unit 3F",
    due: "Sep 4, 2025",
    updated: "Sep 4, 2025",
    age: "6 Days",
    priority: "Normal",
    assignees: [{ id: 1, name: "John Doe", initials: "JD" }],
    collaborators: [{ id: 2, name: "Jane Smith", initials: "JMS" }],
  },
  {
    id: 7,
    status: "Completed",
    title: "Doors Need To Be Repaired",
    property: "22 Indian Chase Dr",
    unit: "Unit 1G",
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
    unit: "Unit 2H",
    due: "Sep 2, 2025",
    updated: "Sep 2, 2025",
    age: "6 Days",
    priority: "Normal",
    assignees: [{ id: 2, name: "Jane Smith", initials: "JMS" }],
    collaborators: [{ id: 3, name: "Mike Johnson", initials: "MJ" }],
  },
  {
    id: 9,
    status: "Completed",
    title: "Doors Need To Be Repaired",
    property: "22 Indian Chase Dr",
    unit: "Unit 3I",
    due: "Sep 1, 2025",
    updated: "Sep 1, 2025",
    age: "6 Days",
    priority: "Normal",
    assignees: [
      { id: 1, name: "John Doe", initials: "JD" },
      { id: 2, name: "Jane Smith", initials: "JMS" },
    ],
    collaborators: [{ id: 3, name: "Mike Johnson", initials: "MJ" }],
  },
  {
    id: 10,
    status: "Completed",
    title: "Doors Need To Be Repaired",
    property: "22 Indian Chase Dr",
    unit: "Unit 1J",
    due: "Sep 1, 2025",
    updated: "Sep 1, 2025",
    age: "6 Days",
    priority: "Normal",
    assignees: [{ id: 3, name: "Mike Johnson", initials: "MJ" }],
    collaborators: [{ id: 1, name: "John Doe", initials: "JD" }],
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

  // Add unit and collaborators to columnOrder but not to visibleColumns by default
  useEffect(() => {
    if (!columnOrder.includes("unit")) {
      const newOrder = [
        ...columnOrder.slice(0, 4),
        "unit",
        ...columnOrder.slice(4),
      ];
      // Add collaborators after assignees
      if (!newOrder.includes("collaborators")) {
        newOrder.push("collaborators");
      }
    }
  }, []);

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
      key: "unit",
      label: "Unit",
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
      icon: <CalendarIcon width={16} height={16} />,
    },
    {
      key: "updated",
      label: "Updated",
      icon: <CalendarIcon width={16} height={16} />,
    },
    {
      key: "age",
      label: "Age",
      icon: <ClockIcon width={16} height={16} />,
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
    {
      key: "collaborators",
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

  const memoizedEditData = useMemo(() => {
    if (!editingTask) return undefined;
    return {
      id: editingTask.id,
      title: editingTask.title,
      property: editingTask.property,
      priority: editingTask.priority,
      status: editingTask.status,
      assignees: editingTask.assignees,
    };
  }, [editingTask?.id, editingTask?.title, editingTask?.property, editingTask?.priority, editingTask?.status]);

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
      const newTask: Task = {
        id: Math.max(...tasksList.map((t) => t.id), 0) + 1,
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
        assignees: taskData.assignees.map((assignee) => ({
          id: parseInt(assignee.id),
          name: assignee.label,
          initials: assignee.initials,
        })),
      };
      setTasksList((prev) => [newTask, ...prev]);
    },
    [tasksList]
  );

  const actions = [
    {
      label: "Edit",
      icon: <EditIcon width={18} height={18} color="#525252" />,
      onClick: handleEditTask,
    },
    {
      label: "Delete",
      icon: <DeleteIcon width={18} height={18} color="#982740" />,
      onClick: handleDeleteTask,
    },
  ];

  return (
    <PageTemplate>
      <div className="flex flex-col gap-6 w-fit min-w-full">
        {/* Header Section - Using PageHeader Template */}
        <PageHeader
          title="All Tasks"
          subtitle="All your tasks, in one place"
          action={{
            label: "Add Task",
            onClick: () => setIsCreateTaskModalOpen(true),
            icon: <PlusIcon width={20} height={20} />,
          }}
        />

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
            if (columnKey === "unit") {
              return (
                <span className="text-gray-900 font-normal text-sm truncate">
                  {task.unit || "—"}
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
            if (columnKey === "collaborators") {
              return (
                <div className="flex items-center gap-2">
                  {task.collaborators && task.collaborators.length > 0 ? (
                    task.collaborators.map((collaborator) => (
                      <div key={collaborator.id} className="relative group">
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold cursor-pointer"
                          style={{
                            backgroundColor: "rgb(34, 197, 94)",
                            borderColor: "rgb(209, 213, 219)",
                            borderWidth: "1px",
                          }}
                          title={collaborator.name}
                        >
                          {collaborator.initials}
                        </div>
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-50">
                          {collaborator.name}
                        </div>
                      </div>
                    ))
                  ) : (
                    <span className="text-gray-400 text-sm">—</span>
                  )}
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
              <DotsIcon width={18} height={18} color="#303030" />
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
        onTaskCreated={handleTaskCreated}
        editData={memoizedEditData}
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
    </PageTemplate>
  );
}
