import { useState, useCallback, useMemo } from "react";
import { Plus } from "lucide-react";
import HeaderV1 from "@/components/HeaderV1";
import GlobalTable from "@/components/GlobalTable";
import PersonAvatars from "@/components/PersonAvatars";
import { AddEditSubtaskModal } from "@/components/task/AddEditSubtaskModal";
import type { MultiSelectOption } from "@/components/forms";
import { useSortingTable } from "@/hooks/useSortingTable";
import { useColumnManagement } from "@/hooks/useColumnManagement";
import { usePageState } from "@/hooks/usePageState";
import { EditIcon, DeleteIcon } from "@/components/icons";

export type SubtaskStatus = "pending" | "in_progress" | "done";

export interface SubtaskAssignee {
  id: number;
  name: string;
  initials: string;
}

export interface SubtaskItem {
  id: number;
  name: string;
  description: string;
  status: SubtaskStatus;
  assignees: SubtaskAssignee[];
}

function getStatusConfig(status: SubtaskStatus) {
  switch (status) {
    case "done":
      return { label: "Done", color: "bg-emerald-100 text-emerald-800" };
    case "in_progress":
      return { label: "In progress", color: "bg-blue-100 text-blue-800" };
    case "pending":
    default:
      return { label: "Pending", color: "bg-[#f3f3f3] text-[#71717A]" };
  }
}

interface SubtasksTabProps {
  taskId: string;
  subtasks: SubtaskItem[];
  onRefetch: () => Promise<void>;
  availableAssignees: MultiSelectOption[];
  onCreateSubtask: (values: {
    name: string;
    description: string;
    status: SubtaskStatus;
    assignees: MultiSelectOption[];
  }) => Promise<void>;
  onUpdateSubtask: (
    subtaskId: number,
    values: {
      name: string;
      description: string;
      status: SubtaskStatus;
      assignees: MultiSelectOption[];
    }
  ) => Promise<void>;
  onDeleteSubtask: (subtaskId: number) => Promise<void>;
}

export default function SubtasksTab({
  taskId,
  subtasks,
  onRefetch,
  availableAssignees,
  onCreateSubtask,
  onUpdateSubtask,
  onDeleteSubtask,
}: SubtasksTabProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubtask, setEditingSubtask] = useState<SubtaskItem | null>(null);
  const [showColumnModal, setShowColumnModal] = useState(false);
  const [currentPage, setCurrentPage] = usePageState("subtasks_currentPage", 1);
  const [itemsPerPage, setItemsPerPage] = usePageState("subtasks_itemsPerPage", 10);
  const [showPageSizeDropdown, setShowPageSizeDropdown] = usePageState(
    "subtasks_showPageSizeDropdown",
    false
  );
  const [openMenuId, setOpenMenuId] = usePageState<number | null>(
    "subtasks_openMenuId",
    null
  );

  const { handleSortClick, getSortIndicator, getSortedData } = useSortingTable(
    subtasks,
    "subtasks"
  );
  const {
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
  } = useColumnManagement(["name", "description", "status", "assignees"]);

  const columns = [
    { key: "name", label: "Name", icon: null },
    { key: "description", label: "Description", icon: null },
    { key: "status", label: "Status", icon: null },
    { key: "assignees", label: "Assignees", icon: null },
  ];

  const handleAddSubtask = useCallback(() => {
    setEditingSubtask(null);
    setIsModalOpen(true);
  }, []);

  const handleEditSubtask = useCallback((subtask: SubtaskItem) => {
    setEditingSubtask(subtask);
    setIsModalOpen(true);
  }, []);

  const handleDeleteSubtask = useCallback(
    async (subtask: SubtaskItem) => {
      const confirmed = window.confirm(
        `Are you sure you want to delete "${subtask.name}"? This cannot be undone.`
      );
      if (!confirmed) return;
      try {
        await onDeleteSubtask(subtask.id);
        await onRefetch();
      } catch (err) {
        console.error("Delete subtask failed", err);
        alert("Failed to delete subtask. Please try again.");
      }
    },
    [onDeleteSubtask, onRefetch]
  );

  const handleModalSubmit = useCallback(
    async (values: {
      name: string;
      description: string;
      status: SubtaskStatus;
      assignees: MultiSelectOption[];
    }) => {
      if (editingSubtask) {
        await onUpdateSubtask(editingSubtask.id, values);
      } else {
        await onCreateSubtask(values);
      }
      await onRefetch();
    },
    [editingSubtask, onCreateSubtask, onUpdateSubtask, onRefetch]
  );

  return (
    <>
      <HeaderV1
        title="Subtasks"
        subtitle="Your subtasks for this task in one place"
        actionLabel="Add subtask"
        actionIcon={<Plus className="w-5 h-5" />}
        onActionClick={handleAddSubtask}
      >
        {subtasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-6">
            <p className="text-[#71717A] text-sm font-medium">No subtasks yet</p>
            <p className="text-[#A1A1A9] text-sm mt-1">
              Add subtasks to break this task into smaller steps.
            </p>
          </div>
        ) : (
          <GlobalTable
            columns={columns}
            data={subtasks}
            rowKey="id"
            onRowClick={handleEditSubtask}
            renderCell={(subtask, columnKey) => {
              if (columnKey === "name") {
                return (
                  <span className="text-gray-900 font-normal text-sm truncate block max-w-[200px]">
                    {subtask.name || "—"}
                  </span>
                );
              }
              if (columnKey === "description") {
                return (
                  <span className="text-gray-900 font-normal text-sm truncate block max-w-[240px]" title={subtask.description || ""}>
                    {subtask.description || "—"}
                  </span>
                );
              }
              if (columnKey === "status") {
                const config = getStatusConfig(subtask.status);
                return (
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${config.color}`}
                  >
                    {config.label}
                  </span>
                );
              }
              if (columnKey === "assignees") {
                return (
                  <PersonAvatars
                    people={(subtask.assignees || []).map((a) => ({
                      id: a.id,
                      name: a.name,
                      initials: a.initials,
                    }))}
                    type="assignee"
                    fallback="Unassigned"
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
            title="Subtasks"
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
                  <circle cx="8" cy="3" r="1.5" fill="#303030" />
                  <circle cx="8" cy="8" r="1.5" fill="#303030" />
                  <circle cx="8" cy="13" r="1.5" fill="#303030" />
                </svg>
              </button>
            }
            actions={[
              {
                label: "Edit",
                icon: <EditIcon width={18} height={18} color="#525252" />,
                onClick: handleEditSubtask,
              },
              {
                label: "Delete",
                icon: <DeleteIcon width={18} height={18} color="#982740" />,
                onClick: handleDeleteSubtask,
              },
            ]}
            showColumnModal={showColumnModal}
            onShowColumnModalChange={setShowColumnModal}
          />
        )}
      </HeaderV1>

      <AddEditSubtaskModal
        open={isModalOpen}
        onOpenChange={(open) => {
          if (!open) setEditingSubtask(null);
          setIsModalOpen(open);
        }}
        onSubmit={handleModalSubmit}
        editingSubtask={useMemo(
          () =>
            editingSubtask
              ? {
                  id: editingSubtask.id,
                  name: editingSubtask.name,
                  description: editingSubtask.description || "",
                  status: editingSubtask.status,
                  assignees: editingSubtask.assignees || [],
                }
              : null,
          [editingSubtask]
        )}
        availableAssignees={availableAssignees}
      />
    </>
  );
}
