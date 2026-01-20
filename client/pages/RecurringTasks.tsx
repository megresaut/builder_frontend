import { useState, useCallback } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import CreateRecurringTaskModal from "@/components/CreateRecurringTaskModal";
import PageHeader from "@/components/PageHeader";
import { usePageState } from "@/hooks/usePageState";
import { useSortingTable } from "@/hooks/useSortingTable";
import { useColumnManagement } from "@/hooks/useColumnManagement";
import ColumnFilterModal from "@/components/ColumnFilterModal";
import GlobalTable from "@/components/GlobalTable";
import PageTemplate from "@/layout/PageTemplate";
import PersonAvatars from "@/components/PersonAvatars";
import { EditIcon, DeleteIcon, BuildingIcon } from "@/components/icons";

interface Assignee {
  id: number;
  name: string;
  initials: string;
  color: string;
}

const mockRecurringTasks: RecurringTask[] = [
  {
    id: 1,
    task: "Doors need to be repaired",
    nextDate: "Oct 2, 2025",
    priority: "High",
    category: "Cansaas",
    status: "active",
    property: "22 Indian Chase Dr",
    unit: "Unit 1",
    assignees: [
      {
        id: 1,
        name: "Jerry Sanchez",
        initials: "JS",
        color: "bg-blue-500",
      },
      {
        id: 2,
        name: "John Doe",
        initials: "JD",
        color: "bg-purple-500",
      },
    ],
  },
  {
    id: 2,
    task: "Doors need to be repaired",
    nextDate: "Sep 29, 2025",
    priority: "Low",
    category: "Cansaas",
    status: "active",
    property: "22 Indian Chase Dr",
    unit: "Unit 2",
    assignees: [
      {
        id: 3,
        name: "Jane Smith",
        initials: "JMS",
        color: "bg-green-500",
      },
      {
        id: 4,
        name: "Mike Johnson",
        initials: "MJ",
        color: "bg-orange-500",
      },
    ],
  },
  {
    id: 3,
    task: "Doors need to be repaired",
    nextDate: "Sep 10, 2025",
    priority: "Normal",
    category: "Cansaas",
    status: "active",
    property: "22 Indian Chase Dr",
    unit: "Unit 3",
    assignees: [
      {
        id: 1,
        name: "Jerry Sanchez",
        initials: "JS",
        color: "bg-blue-500",
      },
      {
        id: 3,
        name: "Jane Smith",
        initials: "JMS",
        color: "bg-green-500",
      },
    ],
  },
  {
    id: 4,
    task: "Doors need to be repaired",
    nextDate: "Sep 6, 2025",
    priority: "Normal",
    category: "Cansaas",
    status: "active",
    property: "22 Indian Chase Dr",
    unit: "Unit 4",
    assignees: [
      {
        id: 2,
        name: "John Doe",
        initials: "JD",
        color: "bg-purple-500",
      },
      {
        id: 4,
        name: "Mike Johnson",
        initials: "MJ",
        color: "bg-orange-500",
      },
    ],
  },
  {
    id: 5,
    task: "Doors need to be repaired",
    nextDate: "Sep 5, 2025",
    priority: "Normal",
    category: "Cansaas",
    status: "active",
    property: "22 Indian Chase Dr",
    unit: "Unit 5",
    assignees: [
      {
        id: 1,
        name: "Jerry Sanchez",
        initials: "JS",
        color: "bg-blue-500",
      },
    ],
  },
  {
    id: 6,
    task: "Doors need to be repaired",
    nextDate: "Sep 4, 2025",
    priority: "Normal",
    category: "Cansaas",
    status: "active",
    property: "22 Indian Chase Dr",
    unit: "Unit 6",
    assignees: [
      {
        id: 3,
        name: "Jane Smith",
        initials: "JMS",
        color: "bg-green-500",
      },
      {
        id: 2,
        name: "John Doe",
        initials: "JD",
        color: "bg-purple-500",
      },
    ],
  },
  {
    id: 7,
    task: "Doors need to be repaired",
    nextDate: "Sep 4, 2025",
    priority: "Normal",
    category: "Cansaas",
    status: "active",
    property: "22 Indian Chase Dr",
    unit: "Unit 7",
    assignees: [
      {
        id: 4,
        name: "Mike Johnson",
        initials: "MJ",
        color: "bg-orange-500",
      },
      {
        id: 1,
        name: "Jerry Sanchez",
        initials: "JS",
        color: "bg-blue-500",
      },
    ],
  },
  {
    id: 8,
    task: "Doors need to be repaired",
    nextDate: "Sep 3, 2025",
    priority: "Normal",
    category: "Cansaas",
    status: "active",
    property: "22 Indian Chase Dr",
    unit: "Unit 8",
    assignees: [
      {
        id: 2,
        name: "John Doe",
        initials: "JD",
        color: "bg-purple-500",
      },
      {
        id: 3,
        name: "Jane Smith",
        initials: "JMS",
        color: "bg-green-500",
      },
    ],
  },
  {
    id: 9,
    task: "Doors need to be repaired",
    nextDate: "Sep 1, 2025",
    priority: "Normal",
    category: "Cansaas",
    status: "active",
    property: "22 Indian Chase Dr",
    unit: "Unit 9",
    assignees: [
      {
        id: 1,
        name: "Jerry Sanchez",
        initials: "JS",
        color: "bg-blue-500",
      },
      {
        id: 4,
        name: "Mike Johnson",
        initials: "MJ",
        color: "bg-orange-500",
      },
    ],
  },
  {
    id: 10,
    task: "Doors need to be repaired",
    nextDate: "Sep 1, 2025",
    priority: "Normal",
    category: "Cansaas",
    status: "active",
    property: "22 Indian Chase Dr",
    unit: "Unit 10",
    assignees: [
      {
        id: 3,
        name: "Jane Smith",
        initials: "JMS",
        color: "bg-green-500",
      },
    ],
  },
];

export default function RecurringTasks() {
  const [recurringTasks, setRecurringTasks] = useState<RecurringTask[]>(mockRecurringTasks);
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
  const [editingTask, setEditingTask] = useState<RecurringTask | null>(null);
  const [isCreateRecurringTaskModalOpen, setIsCreateRecurringTaskModalOpen] =
    usePageState("isCreateRecurringTaskModalOpen", false);

  const { handleSortClick, getSortIndicator, getSortedData } =
    useSortingTable(recurringTasks, "recurringTasks");
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
    "task",
    "property",
    "unit",
    "nextDate",
    "category",
    "assignees",
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
      key: "task",
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
      icon: <BuildingIcon width={16} height={16} />,
    },
    {
      key: "unit",
      label: "Unit",
      icon: (
        <img
          loading="lazy"
          src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/049b679c03670a4d1cf3028269ec92ee2c8cc8e3?placeholderIfAbsent=true"
          style={{ width: "14px", height: "14px" }}
          alt=""
        />
      ),
    },
    {
      key: "nextDate",
      label: "Next Date",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4" />
          <path d="M8 2v4" />
          <path d="M3 10h18" />
        </svg>
      ),
    },
    {
      key: "category",
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
    (task: RecurringTask) => {
      setRecurringTasks((prev) => prev.filter((t) => t.id !== task.id));
    },
    []
  );

  const handleEditTask = useCallback(
    (task: RecurringTask) => {
      setEditingTask(task);
      setIsCreateRecurringTaskModalOpen(true);
    },
    []
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
          title="Recurring Tasks"
          subtitle="All your recurring tasks, in one place"
          action={{
            label: "Create Recurring Task",
            onClick: () => setIsCreateRecurringTaskModalOpen(true),
            icon: <Plus className="w-5 h-5" />,
          }}
        />

        <GlobalTable
          columns={columns}
          data={recurringTasks}
          rowKey="id"
          renderCell={(task, columnKey) => {
            if (columnKey === "priority") {
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
                  <span className="text-gray-900 font-normal text-sm capitalize truncate">
                    {task.priority}
                  </span>
                </div>
              );
            }
            if (columnKey === "task") {
              return (
                <span className="text-gray-900 font-normal text-sm truncate">
                  {task.task}
                </span>
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
                  {task.unit}
                </span>
              );
            }
            if (columnKey === "nextDate") {
              return (
                <span className="text-gray-900 font-normal text-sm truncate">
                  {task.nextDate}
                </span>
              );
            }
            if (columnKey === "category") {
              return (
                <span className="text-gray-900 font-normal text-sm truncate">
                  {task.category}
                </span>
              );
            }
            if (columnKey === "assignees") {
              return (
                <PersonAvatars
                  people={task.assignees}
                  type="assignee"
                  size="sm"
                />
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
          title="Recurring Tasks"
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

      <CreateRecurringTaskModal
        open={isCreateRecurringTaskModalOpen}
        onOpenChange={(open) => {
          setIsCreateRecurringTaskModalOpen(open);
          if (!open) {
            setEditingTask(null);
          }
        }}
        editData={editingTask ? {
          dueDate: editingTask.nextDate,
          priority: editingTask.priority.toLowerCase() as "normal" | "high" | "low",
          timesheetStatus: editingTask.status,
        } : undefined}
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
