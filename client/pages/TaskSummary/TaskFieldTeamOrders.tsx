import { useState, useCallback } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import CreateFTOModal from "@/components/CreateFTOModal";
import { formatUnitLabel } from "@/utils/unitLabel";
import { StatusBadge } from "@/components/StatusBadge";
import { usePageState } from "@/hooks/usePageState";
import { useSortingTable } from "@/hooks/useSortingTable";
import { useColumnManagement } from "@/hooks/useColumnManagement";
import ColumnFilterModal from "@/components/ColumnFilterModal";
import GlobalTable from "@/components/GlobalTable";
import PersonAvatars from "@/components/PersonAvatars";
import HeaderV1 from "@/components/HeaderV1";
import { fetchJSON } from "@/api/fetchJSON";
import {
  EditIcon,
  DeleteIcon,
  ApproveIcon,
  BuildingIcon,
  NoteIcon,
  CalendarIcon,
  DotsIcon,
  DollarIcon,
  UserIcon,
  FlagIcon,
  PlusIcon,
} from "@/components/icons";

export interface FieldTeamOrder {
  id: number;
  taskId: number;
  property: string;
  description: string;
  dueDate: string;
  priority: "low" | "normal" | "high";
  fieldTeam: Array<{
    id: number;
    initials: string;
    color: string;
    name: string;
    email: string;
    phone: string;
    title: string;
  }>;
  status: "dispatched" | "approved" | "pending-approval";
  timesheetStatus:
    | "awaiting-submission"
    | "submitted"
    | "rejected"
    | "approved";
  amount: number;
  unit?: string;
  fieldTeamAssignee?: string;
  task?: string;
  fieldTeamMemberIds?: number[];
  pmAssigneeIds?: number[];
  propertyId?: number;
  unitId?: number;
  dueDateISO?: string;
}

export interface APIFTOResponse {
  id: number;
  name: string;
  description: string;
  property_id: number;
  property_name: string;
  property_address: string;
  task_id?: number;
  field_team_member_ids: number[];
  pm_assignee_ids: number[];
  status: string;
  priority: string;
  due_date: string;
  approval_status: string;
  form_submission_status: "none" | "partial" | "complete";
  is_visible_to_client: boolean;
  hours_decimal: number;
  total_amount: number;
  created_at: string;
  updated_at?: string;
  unit_id?: number;
  unit_name?: string;
}

export interface UserDirectoryEntry {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  title?: string;
}

const getInitials = (name: string): string => {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
};

const resolveFieldTeamMembers = (
  memberIds: number[],
  usersById: Record<number, UserDirectoryEntry>,
): Array<{
  id: number;
  initials: string;
  color: string;
  name: string;
  email: string;
  phone: string;
  title: string;
}> => {
  return memberIds.map((id) => {
    const user = usersById[id];
    const name = user?.name || "Unknown User";
    return {
      id,
      initials: getInitials(name),
      color: "bg-blue-500",
      name,
      email: user?.email || "",
      phone: user?.phone || "",
      title: user?.title || "Field Team",
    };
  });
};

const mapFormSubmissionToTimesheetStatus = (
  formStatus: "none" | "partial" | "complete" | "rejected",
): "awaiting-submission" | "submitted" | "rejected" | "approved" => {
  switch (formStatus) {
    case "none":
      return "awaiting-submission";
    case "partial":
      return "submitted";
    case "rejected":
      return "rejected";
    case "complete":
      return "approved";
    default:
      return "awaiting-submission";
  }
};

const normalizeFTOStatus = (status: string) => {
  if (status === "completed") return "approved";
  if (status === "new") return "pending-approval";
  return status;
};

export const transformAPIToFieldTeamOrders = (
  apiData: APIFTOResponse[],
  usersById: Record<number, UserDirectoryEntry>,
): FieldTeamOrder[] => {
  return apiData.map((fto) => {
    const dueDateISO = fto.due_date;
    const dueDate = dueDateISO
      ? new Date(dueDateISO).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : "No due date";

    const timesheetStatus =
      fto.approval_status === "rejected"
        ? "rejected"
        : fto.approval_status === "approved"
          ? "approved"
          : mapFormSubmissionToTimesheetStatus(fto.form_submission_status);

    const displayName = fto.name || fto.description || "Untitled FTO";

    return {
      id: fto.id,
      taskId: fto.task_id || fto.id,
      property: fto.property_name || "Unknown Property",
      description: displayName,
      dueDate,
      priority:
        (fto.priority.toLowerCase() as "low" | "normal" | "high") || "normal",
      fieldTeam: resolveFieldTeamMembers(fto.field_team_member_ids, usersById),
      status:
        (normalizeFTOStatus(fto.status) as
          | "dispatched"
          | "approved"
          | "pending-approval") || "pending-approval",
      timesheetStatus,
      amount: fto.total_amount,
      unit: formatUnitLabel({
        unitId: fto.unit_id,
        unitName: fto.unit_name,
        fallback: "Unit",
      }),
      fieldTeamMemberIds: fto.field_team_member_ids,
      pmAssigneeIds: fto.pm_assignee_ids,
      propertyId: fto.property_id,
      unitId: fto.unit_id,
      dueDateISO,
    };
  });
};

interface TaskFieldTeamOrdersProps {
  orders: FieldTeamOrder[];
  onOrdersChange: (orders: FieldTeamOrder[]) => void;
  isLoading?: boolean;
  lockedPropertyId?: number;
  lockedPropertyLabel?: string;
  lockedUnitId?: number | null;
  lockedUnitLabel?: string;
  lockedTaskId?: number;
  lockedTaskLabel?: string;
  onRefetchFieldTeamOrders?: () => Promise<any>; // Refetch function for auto-refresh
}

export default function TaskFieldTeamOrders({
  orders,
  onOrdersChange,
  isLoading = false,
  lockedPropertyId,
  lockedPropertyLabel,
  lockedUnitId,
  lockedUnitLabel,
  lockedTaskId,
  lockedTaskLabel,
  onRefetchFieldTeamOrders,
}: TaskFieldTeamOrdersProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { taskId } = useParams<{ taskId: string }>();
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
  const [editingOrder, setEditingOrder] = useState<FieldTeamOrder | null>(null);
  const [showFTOModal, setShowFTOModal] = usePageState("showFTOModal", false);
  const [searchValue, setSearchValue] = usePageState("searchValue", "");

  const filteredOrders = orders.filter((order) => {
    const searchLower = searchValue.toLowerCase();
    return (
      order.property.toLowerCase().includes(searchLower) ||
      order.description.toLowerCase().includes(searchLower) ||
      order.dueDate.toLowerCase().includes(searchLower) ||
      order.status.toLowerCase().includes(searchLower) ||
      order.priority.toLowerCase().includes(searchLower) ||
      order.fieldTeam.some((member) =>
        member.name.toLowerCase().includes(searchLower),
      )
    );
  });

  const { handleSortClick, getSortIndicator, getSortedData } =
    useSortingTable(filteredOrders);
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
    "description",
    "dueDate",
    "fieldTeam",
    "status",
    "timesheetStatus",
    "amount",
    // Note: "property" and "unit" are defined in columns array but not included here,
    // so they default to hidden in the column filter modal
  ]);

  const columns = [
    {
      key: "priority",
      label: "Priority",
      icon: <FlagIcon width={16} height={16} />,
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
      key: "description",
      label: "FTO Name",
      icon: <NoteIcon width={16} height={16} />,
    },
    {
      key: "dueDate",
      label: "Due Date",
      icon: <CalendarIcon width={16} height={16} />,
    },
    {
      key: "fieldTeam",
      label: "Field Team",
      icon: <UserIcon width={16} height={16} />,
    },
    {
      key: "status",
      label: "FTO Status",
      icon: <ApproveIcon width={16} height={16} />,
    },
    {
      key: "timesheetStatus",
      label: "Timesheet Status",
      icon: <ApproveIcon width={16} height={16} />,
    },
    {
      key: "amount",
      label: "Amount",
      icon: <DollarIcon width={16} height={16} />,
    },
  ];

  const handleDeleteOrder = useCallback(
    async (order: FieldTeamOrder) => {
      const confirmed = window.confirm(
        `Are you sure you want to delete "${order.description}"?\nThis cannot be undone.`
      );
      if (!confirmed) return;

      try {
        await fetchJSON(`/maintenance/ftos?id=${order.id}`, { method: "DELETE" });
        onOrdersChange(orders.filter((o) => o.id !== order.id));
      } catch (err) {
        console.error("Delete FTO failed", err);
        alert("Failed to delete Field Team Order. Please try again.");
      }
    },
    [orders, onOrdersChange],
  );

  const handleEditOrder = useCallback(
    (order: FieldTeamOrder) => {
      setEditingOrder(order);
      setShowFTOModal(true);
    },
    [setShowFTOModal],
  );

  const handleApproveOrder = useCallback(
    (order: FieldTeamOrder) => {
      // Ensure referrerPath includes the full task context path
      // We explicitly construct the path using the taskId from params to avoid issues with current location.pathname
      const referrerPath = taskId
        ? `/tasks/${taskId}/fieldteam`
        : location.pathname.includes("/fieldteam")
          ? location.pathname
          : `${location.pathname}/fieldteam`;

      navigate(`/field-team-orders/approve/${order.id}`, {
        state: {
          ftoId: order.id,
          ftoName: order.description,
          property: order.property,
          unit: order.unit ?? "",
          fieldTeamAssignee:
            order.fieldTeamAssignee ?? order.fieldTeam?.[0]?.name ?? "",
          task: order.task ?? "",
          description: order.description,
          referrerPath: referrerPath,
        },
      });
    },
    [navigate, location.pathname, taskId],
  );

  return (
    <>
      <HeaderV1
        title="Field Team Orders"
        subtitle="Your Field Team orders for this task in one place"
        actionLabel="Create FTO"
        actionIcon={<PlusIcon width={20} height={20} />}
        onActionClick={() => setShowFTOModal(true)}
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500">Loading field team orders...</div>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-6">
            <p className="text-[#71717A] text-sm font-medium">No field team orders yet</p>
            <p className="text-[#A1A1A9] text-sm mt-1">FTOs you create or dispatch for this task will appear here.</p>
          </div>
        ) : (
          <GlobalTable
            columns={columns}
            data={filteredOrders}
            rowKey="id"
            showSearchBar={true}
            searchValue={searchValue}
            onSearchChange={setSearchValue}
            renderCell={(order, columnKey) => {
              if (columnKey === "priority") {
                return (
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{
                        backgroundColor:
                          order.priority === "low"
                            ? "#059669"
                            : order.priority === "normal"
                              ? "#2463eb"
                              : "#d97706",
                      }}
                    />
                    <span className="text-gray-900 font-normal text-sm capitalize truncate">
                      {order.priority}
                    </span>
                  </div>
                );
              }
              if (columnKey === "property") {
                return (
                  <span className="text-gray-900 font-normal text-sm truncate">
                    {order.property}
                  </span>
                );
              }
              if (columnKey === "unit") {
                return (
                  <span className="text-gray-900 font-normal text-sm truncate">
                    {order.unit || "-"}
                  </span>
                );
              }
              if (columnKey === "description") {
                return (
                  <span className="text-gray-900 font-normal text-sm truncate">
                    {order.description}
                  </span>
                );
              }
              if (columnKey === "dueDate") {
                return (
                  <span className="text-gray-900 font-normal text-sm truncate">
                    {order.dueDate}
                  </span>
                );
              }
              if (columnKey === "fieldTeam") {
                return (
                  <PersonAvatars
                    people={order.fieldTeam}
                    type="assignee"
                    fallback="None"
                    size="sm"
                  />
                );
              }
              if (columnKey === "status") {
                return (
                  <StatusBadge status={order.status} variant="fto-status" />
                );
              }
              if (columnKey === "timesheetStatus") {
                return (
                  <StatusBadge
                    status={order.timesheetStatus}
                    variant="timesheet-status"
                  />
                );
              }
              if (columnKey === "amount") {
                return (
                  <span className="text-gray-900 font-normal text-sm">
                    ${order.amount}
                  </span>
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
            title="Field Team Orders"
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
            actions={[
              {
                label: "Approve",
                icon: <ApproveIcon width={16} height={16} />,
                onClick: handleApproveOrder,
              },
              {
                label: "Edit",
                icon: <EditIcon width={18} height={18} color="#525252" />,
                onClick: handleEditOrder,
              },
              {
                label: "Delete",
                icon: <DeleteIcon width={18} height={18} color="#982740" />,
                onClick: handleDeleteOrder,
              },
            ]}
            onRowClick={handleEditOrder}
            showColumnModal={showColumnModal}
            onShowColumnModalChange={setShowColumnModal}
          />
        )}
      </HeaderV1>

      <CreateFTOModal
        open={showFTOModal}
        onOpenChange={(open) => {
          setShowFTOModal(open);
          if (!open) {
            setEditingOrder(null);
          }
        }}
        lockedPropertyId={lockedPropertyId}
        lockedPropertyLabel={lockedPropertyLabel}
        lockedUnitId={lockedUnitId}
        lockedUnitLabel={lockedUnitLabel}
        lockedTaskId={lockedTaskId}
        lockedTaskLabel={lockedTaskLabel}
        editingFTO={
          editingOrder
            ? {
                id: editingOrder.id,
                name: editingOrder.description,
                description: editingOrder.description,
                priority: editingOrder.priority,
                status:
                  editingOrder.status === "pending-approval"
                    ? "new"
                    : editingOrder.status === "approved"
                      ? "completed"
                      : "dispatched",
                due_date: editingOrder.dueDateISO || editingOrder.dueDate,
                property_id: editingOrder.propertyId || 1,
                property_name: editingOrder.property,
                task_id: editingOrder.taskId,
                field_team_member_ids: editingOrder.fieldTeamMemberIds || [],
                pm_assignee_ids: editingOrder.pmAssigneeIds || [],
                unit_id: editingOrder.unitId ?? null,
                unit_name: editingOrder.unit,
              }
            : null
        }
        onFTOCreated={async (ftoData) => {
          // Refresh field team orders list in the background
          if (onRefetchFieldTeamOrders) {
            try {
              await onRefetchFieldTeamOrders();
            } catch (error) {
              console.error("Error refetching field team orders:", error);
            }
          }
          
          // Keep the local state update for immediate UI feedback (optional, will be replaced by refetch)
          const fieldTeamMasterData: Record<
            string,
            { email: string; phone: string; title: string }
          > = {
            "Christopher Harris": {
              email: "christopher.harris@company.com",
              phone: "(555) 111-2222",
              title: "Field Lead",
            },
            "Cassandra Smith": {
              email: "cassandra.smith@company.com",
              phone: "(555) 222-3333",
              title: "Field Technician",
            },
            "David Chen": {
              email: "david.chen@company.com",
              phone: "(555) 333-4444",
              title: "Field Specialist",
            },
            "Emma Rodriguez": {
              email: "emma.rodriguez@company.com",
              phone: "(555) 444-5555",
              title: "Field Technician",
            },
            "James Wilson": {
              email: "james.wilson@company.com",
              phone: "(555) 555-6666",
              title: "Field Lead",
            },
          };

          const newId = Math.max(...orders.map((o) => o.id), 0) + 1;
          const fieldTeamArray = ftoData.selectedAssignees.map(
            (assignee: any, idx: number) => {
              const name =
                assignee.name || assignee.label || assignee.value || "";
              const memberInfo = fieldTeamMasterData[name];
              return {
                id: assignee.id || idx + 1,
                initials:
                  assignee.initials ||
                  assignee.value?.substring(0, 2).toUpperCase() ||
                  "?",
                color: assignee.color || "bg-blue-500",
                name: name,
                email: memberInfo?.email || "",
                phone: memberInfo?.phone || "",
                title: memberInfo?.title || "Field Team Member",
              };
            },
          );
          const newFTO: FieldTeamOrder = {
            id: newId,
            taskId: newId,
            property: ftoData.property,
            unit: ftoData.unit,
            description: ftoData.ftoName || ftoData.description,
            dueDate:
              ftoData.dueDate?.toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              }) || "",
            priority: ftoData.priority as "low" | "normal" | "high",
            fieldTeam: fieldTeamArray,
            status: "pending-approval",
            timesheetStatus: "awaiting-submission",
            amount: 0,
          };
          // Note: The refetch will update the orders, but we keep this for immediate feedback
          // The refetch will replace this with the actual data from the server
          onOrdersChange([newFTO, ...orders]);
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
    </>
  );
}
