import { useState, useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
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
import { fetchJSON } from "@/api/fetchJSON";
import { formatUnitDisplayForTable } from "@/utils/unitLabel";

interface Assignee {
  id: number;
  name: string;
  initials: string;
  color: string;
  email?: string;
  phone?: string;
  title?: string;
}

interface RecurringTask {
  id: number;
  task: string;
  nextDate: string;
  priority: "High" | "Low" | "Normal";
  category: string;
  status: "active" | "inactive";
  property: string;
  unit: string;
  assignees: Assignee[];
}

interface ApiAssignee {
  id: number;
  name: string;
  initials: string;
}

interface ApiRecurringSeriesDetail {
  id: number;
  property_id: number;
  unit_id: number | null;
  name: string;
  description: string;
  assignees: ApiAssignee[];
  collaborators: ApiAssignee[];
  priority: string | null;
  category: string | null;
  frequency: string;
  interval: number;
  by_day: string[];
  day_of_month: number | null;
  week_of_month: number | null;
  weekday_of_month: string | null;
  start_date: string;
  end_date: string | null;
  due_after_days: number;
  active: boolean;
  next_run_at: string;
  last_run_at: string | null;
  created_at: string;
  updated_at: string;
}

interface ApiRecurringSeries {
  id: number;
  property_id: number;
  unit_id: number | null;
  template_task_id: number | null;
  name: string;
  description: string;
  assignees: ApiAssignee[];
  collaborators: number[];
  priority: string | null;
  category: string | null;
  frequency: string;
  interval: number;
  by_day: string[];
  day_of_month: number | null;
  week_of_month: number | null;
  weekday_of_month: string | null;
  start_date: string;
  end_date: string | null;
  due_after_days: number;
  active: boolean;
  next_run_at: string;
  last_run_at: string | null;
  created_at: string;
  updated_at: string;
}

export default function RecurringTasks() {
  const [recurringTasks, setRecurringTasks] = useState<RecurringTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
  const [editingSeries, setEditingSeries] = useState<ApiRecurringSeriesDetail | null>(null);
  const [isCreateRecurringTaskModalOpen, setIsCreateRecurringTaskModalOpen] =
    usePageState("isCreateRecurringTaskModalOpen", false);

  // Fetch recurring tasks from API
  const fetchRecurringTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data: ApiRecurringSeries[] = await fetchJSON("/maintenance/recurring");
      // Handle null/undefined response
      if (!data || !Array.isArray(data)) {
        console.error("Invalid API response:", data);
        setError("Invalid response from server");
        setRecurringTasks([]);
        return;
      }
      
      // Map API response to UI format
      const mapped: RecurringTask[] = await Promise.all(
        data.map(async (series) => {
          // Fetch property name
          let propertyName = `Property #${series.property_id}`;
          try {
            const property = await fetchJSON(`/properties/${series.property_id}`).catch(() => null);
            if (property) {
              propertyName = property.name || property.address_line1 || propertyName;
            }
          } catch (e) {
            // Ignore property fetch errors
          }

          // Fetch unit name if unit_id exists
          let unitName = "";
          if (series.unit_id) {
            try {
              const unit = await fetchJSON(`/properties/${series.property_id}/units`).catch(() => []);
              const foundUnit = Array.isArray(unit) ? unit.find((u: any) => u.id === series.unit_id) : null;
              if (foundUnit) {
                unitName = foundUnit.unit_name || `Unit ${series.unit_id}`;
              } else {
                unitName = `Unit ${series.unit_id}`;
              }
            } catch (e) {
              unitName = `Unit ${series.unit_id}`;
            }
          }

          // Format next date
          const nextDate = new Date(series.next_run_at);
          const formattedDate = nextDate.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          });

          // Map priority (default to Normal since not stored yet)
          const priorityRaw = (series.priority || "normal").toLowerCase();
          const priority: "High" | "Low" | "Normal" =
            priorityRaw === "high"
              ? "High"
              : priorityRaw === "low"
              ? "Low"
              : "Normal";

          return {
            id: series.id,
            task:
              series.name && series.name.trim() !== ""
                ? series.name
                : "Untitled Recurring Task",
            nextDate: formattedDate,
            priority,
            category: series.category || "",
            status: series.active ? "active" : "inactive",
            property: propertyName,
            unit: unitName || "",
            assignees: (series.assignees || []).map((a) => ({
              id: a.id,
              name: a.name,
              initials: a.initials,
              color: "bg-blue-500",
            })),
          };
        })
      );

      setRecurringTasks(mapped);
    } catch (err: any) {
      console.error("Failed to fetch recurring tasks:", err);
      setError(err.message || "Failed to load recurring tasks");
      setRecurringTasks([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecurringTasks();
  }, [fetchRecurringTasks]);

  // Auto-open the edit modal when arriving with ?edit=<id>. Used by the
  // Reminders page (recurring tasks have no standalone detail page so the
  // entire interaction lives in this modal).
  const [searchParams, setSearchParams] = useSearchParams();
  useEffect(() => {
    const editId = searchParams.get("edit");
    if (!editId) return;
    if (recurringTasks.length === 0) return; // wait for the list to load
    const numericId = Number(editId);
    const match = recurringTasks.find((t) => t.id === numericId);
    if (match) {
      handleEditTask(match);
    }
    // Clear the param so refreshing the page doesn't reopen the modal.
    const next = new URLSearchParams(searchParams);
    next.delete("edit");
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recurringTasks, searchParams]);

  // Listen for refresh events
  useEffect(() => {
    const handleRefresh = () => {
      fetchRecurringTasks();
    };
    window.addEventListener("refreshRecurringTasks", handleRefresh);
    return () => {
      window.removeEventListener("refreshRecurringTasks", handleRefresh);
    };
  }, [fetchRecurringTasks]);

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
    async (task: RecurringTask) => {
      if (!confirm(`Are you sure you want to delete this recurring task? This action cannot be undone.`)) {
        return;
      }

      try {
        await fetchJSON(`/maintenance/recurring/${task.id}`, {
          method: "DELETE",
        });
        // Refresh the list
        fetchRecurringTasks();
      } catch (err: any) {
        console.error("Failed to delete recurring task:", err);
        setError(err.message || "Failed to delete recurring task");
      }
    },
    [fetchRecurringTasks]
  );

  const handleEditTask = useCallback(
    async (task: RecurringTask) => {
      try {
        setError(null);
        const series = await fetchJSON(`/maintenance/recurring/${task.id}`);
        setEditingTask(task);
        setEditingSeries(series);
        setIsCreateRecurringTaskModalOpen(true);
      } catch (err: any) {
        console.error("Failed to load recurring task:", err);
        setError(err.message || "Failed to load recurring task");
      }
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

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error}
          </div>
        )}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-gray-500">Loading recurring tasks...</div>
          </div>
        ) : (
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
                  {formatUnitDisplayForTable(task.unit)}
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
        )}
      </div>

      <CreateRecurringTaskModal
        open={isCreateRecurringTaskModalOpen}
        onOpenChange={(open) => {
          setIsCreateRecurringTaskModalOpen(open);
          if (!open) {
            setEditingTask(null);
            setEditingSeries(null);
          }
        }}
        editData={
          editingTask && editingSeries
            ? {
                id: editingSeries.id,
                series: editingSeries,
              }
            : undefined
        }
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
