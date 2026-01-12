import { useState, useCallback, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import CreateTaskModal from "@/components/CreateTaskModal";
import PageHeader from "@/components/PageHeader";
import { usePageState } from "@/hooks/usePageState";
import { useSortingTable } from "@/hooks/useSortingTable";
import { useColumnManagement } from "@/hooks/useColumnManagement";
import ColumnFilterModal from "@/components/ColumnFilterModal";
import GlobalTable from "@/components/GlobalTable";
import PersonAvatars from "@/components/PersonAvatars";
import TaskStatusBadge from "@/components/TaskStatusBadge";
import TaskPriorityBadge from "@/components/TaskPriorityBadge";
import PageTemplate from "@/layout/PageTemplate";
import {
  EditIcon,
  DeleteIcon,
  PlusIcon,
  CalendarIcon,
  ClockIcon,
  DotsIcon,
  UserIcon,
} from "@/components/icons";

import { MOCK_TASKS, type Task } from "@/data/tasks";

export default function AllTasks() {
  const navigate = useNavigate();
  const [tasksList, setTasksList] = useState<Task[]>(MOCK_TASKS);
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
    setVisibleColumns,
  } = useColumnManagement([
    "priority",
    "status",
    "title",
    "property",
    "unit",
    "due",
    "updated",
    "age",
    "assignees",
    "collaborators",
  ]);

  // Hide unit and collaborators by default
  useEffect(() => {
    setVisibleColumns(new Set([
      "priority",
      "status",
      "title",
      "property",
      "due",
      "updated",
      "age",
      "assignees",
    ]));
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
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M2 6H14M2 10H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M5.5 2V14M10.5 2V14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
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
      icon: <UserIcon width={16} height={16} />,
    },
    {
      key: "collaborators",
      label: "Collaborators",
      icon: <UserIcon width={16} height={16} />,
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
      due: editingTask.due,
      assignees: editingTask.assignees,
      collaborators: editingTask.collaborators,
    };
  }, [editingTask?.id, editingTask?.title, editingTask?.property, editingTask?.priority, editingTask?.status, editingTask?.due, editingTask?.assignees, editingTask?.collaborators]);

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
      const newTaskId = Math.max(...tasksList.map((t) => t.id), 0) + 1;
      const newTask: Task = {
        id: newTaskId,
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
        collaborators: taskData.collaborators?.map((collaborator) => ({
          id: parseInt(collaborator.id),
          name: collaborator.label,
          initials: collaborator.initials,
        })),
      };
      setTasksList((prev) => [newTask, ...prev]);

      // Close the modal before navigating to avoid it being open when coming back
      setIsCreateTaskModalOpen(false);
      setEditingTask(null);

      // Navigate to the newly created task with its data
      // Use replace: true to ensure the modal isn't in the history stack
      setTimeout(() => {
        navigate(`/tasks/${newTaskId}`, {
          state: { task: newTask, taskData: { ...taskData, ...newTask } },
          replace: true
        });
      }, 0);
    },
    [tasksList, navigate]
  );

  const actions = [
    {
      label: "Update",
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
            navigate(`/tasks/${task.id}/summary`, {
              state: { task, taskData: task }
            });
          }}
          renderCell={(task, columnKey) => {
            if (columnKey === "priority") {
              return <TaskPriorityBadge priority={task.priority as any} />;
            }
            if (columnKey === "status") {
              return <TaskStatusBadge status={task.status as any} />;
            }
            if (columnKey === "title") {
              return (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/tasks/${task.id}/summary`, {
                      state: { task, taskData: task }
                    });
                  }}
                  className="text-blue-600 font-normal text-sm hover:underline cursor-pointer transition-colors truncate"
                >
                  {task.title}
                </button>
              );
            }
            if (columnKey === "property") {
              const propertyLabels: Record<string, string> = {
                property1: "22 Indian Chase Dr",
                property2: "Property 2",
              };
              const unitLabels: Record<string, string> = {
                unit1: "Unit 1",
                unit2: "Unit 2",
              };

              const propLabel = propertyLabels[task.property] || task.property;
              const unitLabel = task.unit ? (unitLabels[task.unit] || task.unit) : "";

              return (
                <span className="text-gray-900 font-normal text-sm truncate">
                  {propLabel}{unitLabel ? ` - ${unitLabel}` : ""}
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
                <PersonAvatars
                  people={task.assignees}
                  type="assignee"
                  size="sm"
                  fallback="—"
                />
              );
            }
            if (columnKey === "collaborators") {
              return (
                <PersonAvatars
                  people={task.collaborators || []}
                  type="collaborator"
                  size="sm"
                  fallback="—"
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
        variant={editingTask ? "withMessageAndAttachments" : "compact"}
        onTaskCreated={handleTaskCreated}
        editData={editingTask ? memoizedEditData : undefined}
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
