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
import { fetchJSON } from "@/api/fetchJSON";
import { formatUnitLabel, formatUnitDisplayForTable } from "@/utils/unitLabel";

import type { Task } from "@/data/tasks";

/**
 * API response shape for GET /maintenance/tasks
 */
interface ApiTask {
  id: number;
  name: string;
  description: string;
  property_id: number;
  property_name: string;
  property_address: string;
  unit_id: number | null;
  unit_name: string | null;
  status: string;
  priority: string;
  category: string;
  due_date: string | null;
  date_requested?: string;
  last_updated: string;
  requested_by: number | null;
  assignees: Array<{ id: number; name: string; email: string }>;
  collaborators: Array<{ id: number; name: string; email: string }>;
  attachments?: Array<{
    id: number;
    file_name: string;
    storage_path: string;
    file_type: string;
    file_size: number;
  }>;
}

/**
 * Transform API task to UI Task format
 * Maps API field names to UI field names
 */
function transformApiTaskToUiTask(apiTask: ApiTask, sequentialNumber?: number): Task & { sequentialNumber?: number } {
  // Generate initials from name
  const getInitials = (name: string): string => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 3);
  };

  // Format date to "Oct 2, 2025" format
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return "No Due Date";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Calculate age based on created date (date_requested)
  const getAge = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "1 Day";
    return `${diffDays} Days`;
  };

  // Map backend priority values to frontend values
  const mapPriority = (backendPriority: string): string => {
    const priorityMap: Record<string, string> = {
      low: "low",
      medium: "normal",
      normal: "normal",
      high: "high",
      urgent: "urgent",
    };
    return priorityMap[backendPriority.toLowerCase()] || "normal";
  };

  // Map backend status values to frontend values
  const mapStatus = (backendStatus: string): string => {
    const statusMap: Record<string, string> = {
      open: "not_started",
      not_started: "not_started",
      in_progress: "in_progress",
      pending_vendor: "in_progress",
      scheduled: "in_progress",
      completed: "completed",
      closed: "completed",
      cancelled: "completed",
    };
    return statusMap[backendStatus.toLowerCase()] || "not_started";
  };

  const unitLabel = formatUnitLabel({
    unitId: apiTask.unit_id,
    unitName: apiTask.unit_name,
    fallback: "",
  });

  return {
    id: apiTask.id,
    title: apiTask.name,
    description: apiTask.description || "",
    property: apiTask.property_name,
    property_id: apiTask.property_id,
    property_name: apiTask.property_name,
    property_address: apiTask.property_address,
    unit: unitLabel || undefined,
    unit_id: apiTask.unit_id ?? undefined,
    status: mapStatus(apiTask.status),
    priority: mapPriority(apiTask.priority),
    category: apiTask.category || "",
    due: formatDate(apiTask.due_date),
    updated: formatDate(apiTask.last_updated),
    age: getAge(apiTask.date_requested ?? apiTask.last_updated),
    requested_by: apiTask.requested_by ?? undefined,
    assignees: (apiTask.assignees || []).map((person) => ({
      id: person.id,
      name: person.name,
      initials: getInitials(person.name),
      email: person.email,
    })),
    collaborators:
      apiTask.collaborators && apiTask.collaborators.length > 0
        ? apiTask.collaborators.map((person) => ({
            id: person.id,
            name: person.name,
            initials: getInitials(person.name),
            email: person.email,
          }))
        : undefined,
    attachments: apiTask.attachments || [],
    sequentialNumber,
  };
}

export default function AllTasks() {
  const navigate = useNavigate();
  const [tasksList, setTasksList] = useState<Task[]>([]);
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
  const [editingApiTask, setEditingApiTask] = useState<ApiTask | null>(null);
  const [apiTasks, setApiTasks] = useState<ApiTask[]>([]);
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = usePageState(
    "isCreateTaskModalOpen",
    false,
  );
  const [showFilterBar, setShowFilterBar] = usePageState("allTasksShowFilterBar", false);
  const [filterDateFrom, setFilterDateFrom] = usePageState("allTasksFilterDateFrom", "");
  const [filterDateTo, setFilterDateTo] = usePageState("allTasksFilterDateTo", "");
  const [filterProperty, setFilterProperty] = usePageState("allTasksFilterProperty", "");
  const [filterPriority, setFilterPriority] = usePageState("allTasksFilterPriority", "");
  const [filterStatus, setFilterStatus] = usePageState("allTasksFilterStatus", "");
  const [filterAssignee, setFilterAssignee] = usePageState("allTasksFilterAssignee", "");

  const uniqueProperties = useMemo(
    () => Array.from(new Set(tasksList.map((t) => t.property).filter(Boolean))).sort(),
    [tasksList],
  );
  const uniqueAssignees = useMemo(
    () =>
      Array.from(
        new Set(tasksList.flatMap((t) => t.assignees.map((a) => a.name)).filter(Boolean)),
      ).sort(),
    [tasksList],
  );

  const filteredTasks = useMemo(() => {
    return tasksList.filter((task) => {
      if (filterProperty && task.property !== filterProperty) return false;
      if (filterPriority && task.priority !== filterPriority) return false;
      if (filterStatus && task.status !== filterStatus) return false;
      if (filterAssignee) {
        const hasAssignee = task.assignees.some((a) => a.name === filterAssignee);
        if (!hasAssignee) return false;
      }
      if (filterDateFrom || filterDateTo) {
        const apiTask = apiTasks.find((t) => t.id === task.id);
        const dueDate = apiTask?.due_date ?? null;
        if (!dueDate) return false;
        const dateStr = dueDate.slice(0, 10);
        if (filterDateFrom && dateStr < filterDateFrom) return false;
        if (filterDateTo && dateStr > filterDateTo) return false;
      }
      return true;
    });
  }, [
    tasksList,
    apiTasks,
    filterProperty,
    filterPriority,
    filterStatus,
    filterAssignee,
    filterDateFrom,
    filterDateTo,
  ]);

  const { handleSortClick, getSortIndicator, getSortedData } = useSortingTable(
    filteredTasks,
    "allTasks",
  );
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

  // Function to load tasks from API
  const loadTasks = useCallback(async () => {
    try {
      const apiResponse: ApiTask[] = await fetchJSON("/maintenance/tasks");
      // Sort tasks by ID (ascending)
      const sortedTasks = [...apiResponse].sort((a, b) => a.id - b.id);
      setApiTasks(sortedTasks);
      // Assign sequential numbers based on sorted position (1, 2, 3, etc.)
      const transformedTasks = sortedTasks.map((task, index) => 
        transformApiTaskToUiTask(task, index + 1)
      );
      setTasksList(transformedTasks);
    } catch (error) {
      console.error("Error loading tasks:", error);
      setTasksList([]);
      setApiTasks([]);
    }
  }, []);

  // Fetch tasks from API on component mount
  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Listen for refresh events from other pages
  useEffect(() => {
    const handleRefresh = () => {
      loadTasks();
    };

    window.addEventListener("refreshAllTasks", handleRefresh);
    return () => {
      window.removeEventListener("refreshAllTasks", handleRefresh);
    };
  }, [loadTasks]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    filterDateFrom,
    filterDateTo,
    filterProperty,
    filterPriority,
    filterStatus,
    filterAssignee,
  ]);

  // Hide collaborators by default
  useEffect(() => {
    setVisibleColumns(
      new Set([
        "priority",
        "status",
        "title",
        "property",
        "unit",
        "due",
        "updated",
        "age",
        "assignees",
      ]),
    );
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
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M2 6H14M2 10H14"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M5.5 2V14M10.5 2V14"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
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

  const handleDeleteTask = useCallback((task: Task) => {
    setTasksList((prev) => prev.filter((t) => t.id !== task.id));
  }, []);

  const handleEditTask = useCallback((task: Task) => {
    const apiTask = apiTasks.find((t) => t.id === task.id);
    if (apiTask) {
      setEditingApiTask(apiTask);
      setEditingTask(task);
      setIsCreateTaskModalOpen(true);
    }
  }, [apiTasks]);

  const editData = useMemo(() => {
    if (!editingApiTask) return undefined;
    return {
      id: editingApiTask.id,
      name: editingApiTask.name,
      description: editingApiTask.description || "",
      priority: editingApiTask.priority,
      status: editingApiTask.status,
      category: editingApiTask.category || "",
      property_id: editingApiTask.property_id,
      unit_id: editingApiTask.unit_id ?? null,
      due_date: editingApiTask.due_date,
      assignees: editingApiTask.assignees.map((a) => a.id),
      collaborators: editingApiTask.collaborators?.map((c) => c.id) || [],
      attachments: editingApiTask.attachments,
    };
  }, [editingApiTask]);

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
          replace: true,
        });
      }, 0);
    },
    [tasksList, navigate],
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

        {showFilterBar && (
          <div
            className="flex flex-wrap items-center gap-4 p-4 rounded-lg border border-[#E5E5E5] bg-gray-50/80"
            style={{ borderColor: "var(--color-border-light)" }}
          >
            <span className="text-sm font-medium text-[#303030] shrink-0">
              Filter by
            </span>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-[#717179] whitespace-nowrap">
                  Date from
                </label>
                <input
                  type="date"
                  value={filterDateFrom}
                  onChange={(e) => setFilterDateFrom(e.target.value)}
                  className="h-9 px-2.5 rounded-lg border border-[#DADADA] bg-white text-sm text-[#303030] min-w-[130px]"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-[#717179] whitespace-nowrap">
                  Date to
                </label>
                <input
                  type="date"
                  value={filterDateTo}
                  onChange={(e) => setFilterDateTo(e.target.value)}
                  className="h-9 px-2.5 rounded-lg border border-[#DADADA] bg-white text-sm text-[#303030] min-w-[130px]"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-[#717179] whitespace-nowrap">
                  Property
                </label>
                <select
                  value={filterProperty}
                  onChange={(e) => setFilterProperty(e.target.value)}
                  className="h-9 px-2.5 rounded-lg border border-[#DADADA] bg-white text-sm text-[#303030] min-w-[140px]"
                >
                  <option value="">All</option>
                  {uniqueProperties.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-[#717179] whitespace-nowrap">
                  Priority
                </label>
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="h-9 px-2.5 rounded-lg border border-[#DADADA] bg-white text-sm text-[#303030] min-w-[120px]"
                >
                  <option value="">All</option>
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-[#717179] whitespace-nowrap">
                  Status
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="h-9 px-2.5 rounded-lg border border-[#DADADA] bg-white text-sm text-[#303030] min-w-[140px]"
                >
                  <option value="">All</option>
                  <option value="not_started">Not started</option>
                  <option value="in_progress">In progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-[#717179] whitespace-nowrap">
                  Assignee
                </label>
                <select
                  value={filterAssignee}
                  onChange={(e) => setFilterAssignee(e.target.value)}
                  className="h-9 px-2.5 rounded-lg border border-[#DADADA] bg-white text-sm text-[#303030] min-w-[140px]"
                >
                  <option value="">All</option>
                  {uniqueAssignees.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setFilterDateFrom("");
                setFilterDateTo("");
                setFilterProperty("");
                setFilterPriority("");
                setFilterStatus("");
                setFilterAssignee("");
                setCurrentPage(1);
              }}
              className="h-9 px-3 rounded-lg border border-[#DADADA] bg-white text-sm font-medium text-[#303030] hover:bg-gray-100 shrink-0"
            >
              Clear filters
            </button>
          </div>
        )}

        <GlobalTable
          columns={columns}
          data={getSortedData()}
          rowKey="id"
          onRowClick={(task) => {
            navigate(`/tasks/${task.id}/summary`, {
              state: { task, taskData: task, sequentialNumber: (task as any).sequentialNumber },
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
                      state: { task, taskData: task, sequentialNumber: (task as any).sequentialNumber },
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

              const propLabel = propertyLabels[task.property] || task.property;

              return (
                <span className="text-gray-900 font-normal text-sm truncate">
                  {propLabel}
                </span>
              );
            }
            if (columnKey === "unit") {
              const unitLabels: Record<string, string> = {
                unit1: "1",
                unit2: "2",
              };
              const raw = task.unit ? unitLabels[task.unit] || task.unit : "";
              const unitLabel = formatUnitDisplayForTable(raw);

              return (
                <span className="text-gray-900 font-normal text-sm truncate">
                  {unitLabel}
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
          onFilterClick={() => {
            setShowPageSizeDropdown(false);
            setOpenMenuId(null);
            setShowFilterBar(!showFilterBar);
          }}
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
            setEditingApiTask(null);
          }
        }}
        variant={editingApiTask ? "withMessageAndAttachments" : "compact"}
        onSubmit={handleTaskCreated}
        editData={editData}
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
