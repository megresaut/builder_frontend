import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import CreateFTOModal from "@/components/CreateFTOModal";
import { StatusBadge } from "@/components/StatusBadge";
import { usePageState } from "@/hooks/usePageState";
import { useSortingTable } from "@/hooks/useSortingTable";
import { useColumnManagement } from "@/hooks/useColumnManagement";
import ColumnFilterModal from "@/components/ColumnFilterModal";
import GlobalTable from "@/components/GlobalTable";
import PersonAvatars from "@/components/PersonAvatars";
import HeaderV1 from "@/components/HeaderV1";
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

interface FieldTeamOrder {
  id: number;
  taskId: number;
  property: string;
  description: string;
  dueDate: string;
  priority: "low" | "normal" | "high";
  fieldTeam: Array<{ id: number; initials: string; color: string; name: string; email: string; phone: string; title: string }>;
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
  dueDateISO?: string;
}

interface APIFTOResponse {
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
}

const mockUsers: Record<number, { id: number; name: string; email: string; phone: string; title: string }> = {
  1: { id: 1, name: "Christopher Harris", email: "christopher.harris@company.com", phone: "(555) 111-2222", title: "Field Lead" },
  2: { id: 2, name: "Cassandra Smith", email: "cassandra.smith@company.com", phone: "(555) 222-3333", title: "Field Technician" },
  3: { id: 3, name: "David Chen", email: "david.chen@company.com", phone: "(555) 333-4444", title: "Field Specialist" },
  4: { id: 4, name: "Emma Rodriguez", email: "emma.rodriguez@company.com", phone: "(555) 444-5555", title: "Field Technician" },
  5: { id: 5, name: "James Wilson", email: "james.wilson@company.com", phone: "(555) 555-6666", title: "Field Lead" },
};

const getInitials = (name: string): string => {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
};

const resolveFieldTeamMembers = (
  memberIds: number[]
): Array<{ id: number; initials: string; color: string; name: string; email: string; phone: string; title: string }> => {
  return memberIds.map((id) => {
    const user = mockUsers[id] || { id, name: "Unknown User", email: "", phone: "", title: "Field Team" };
    return {
      id: user.id,
      initials: getInitials(user.name),
      color: "bg-blue-500",
      name: user.name,
      email: user.email,
      phone: user.phone,
      title: user.title,
    };
  });
};

const mapFormSubmissionToTimesheetStatus = (
  formStatus: "none" | "partial" | "complete"
): "awaiting-submission" | "submitted" | "rejected" | "approved" => {
  switch (formStatus) {
    case "none":
      return "awaiting-submission";
    case "partial":
      return "submitted";
    case "complete":
      return "approved";
    default:
      return "awaiting-submission";
  }
};

const mockFetchFTOs = async (params: {
  field_team_member_id: number;
  status?: string;
  limit?: number;
}): Promise<APIFTOResponse[]> => {
  await new Promise((resolve) => setTimeout(resolve, 100));

  const mockData: APIFTOResponse[] = [
    {
      id: 1,
      name: "Door Repair",
      description: "Doors Need To Be Repaired",
      property_id: 1,
      property_name: "22 Indian Chase Dr",
      property_address: "22 Indian Chase Dr, Springfield, IL 62701",
      task_id: 6,
      field_team_member_ids: [1, 2],
      pm_assignee_ids: [101, 102],
      status: "dispatched",
      priority: "high",
      due_date: "2025-10-02T00:00:00Z",
      approval_status: "pending",
      form_submission_status: "none",
      is_visible_to_client: true,
      hours_decimal: 8.5,
      total_amount: 420,
      created_at: "2025-09-20T10:00:00Z",
      updated_at: "2025-09-25T14:30:00Z",
    },
    {
      id: 2,
      name: "Door Repair",
      description: "Doors Need To Be Repaired",
      property_id: 1,
      property_name: "22 Indian Chase Dr",
      property_address: "22 Indian Chase Dr, Springfield, IL 62701",
      task_id: 6,
      field_team_member_ids: [1, 2],
      pm_assignee_ids: [101, 102],
      status: "approved",
      priority: "normal",
      due_date: "2025-09-29T00:00:00Z",
      approval_status: "approved",
      form_submission_status: "complete",
      is_visible_to_client: true,
      hours_decimal: 6.0,
      total_amount: 95,
      created_at: "2025-09-18T09:15:00Z",
      updated_at: "2025-09-26T11:00:00Z",
    },
    {
      id: 3,
      name: "Door Repair",
      description: "Doors Need To Be Repaired",
      property_id: 1,
      property_name: "22 Indian Chase Dr",
      property_address: "22 Indian Chase Dr, Springfield, IL 62701",
      task_id: 6,
      field_team_member_ids: [1, 2],
      pm_assignee_ids: [101, 102],
      status: "pending-approval",
      priority: "low",
      due_date: "2025-09-10T00:00:00Z",
      approval_status: "pending",
      form_submission_status: "partial",
      is_visible_to_client: true,
      hours_decimal: 4.5,
      total_amount: 95,
      created_at: "2025-09-08T08:00:00Z",
      updated_at: "2025-09-24T16:45:00Z",
    },
    {
      id: 4,
      name: "Door Repair",
      description: "Doors Need To Be Repaired",
      property_id: 1,
      property_name: "22 Indian Chase Dr",
      property_address: "22 Indian Chase Dr, Springfield, IL 62701",
      task_id: 6,
      field_team_member_ids: [1, 2],
      pm_assignee_ids: [101, 102],
      status: "dispatched",
      priority: "high",
      due_date: "2025-09-06T00:00:00Z",
      approval_status: "pending",
      form_submission_status: "none",
      is_visible_to_client: true,
      hours_decimal: 7.0,
      total_amount: 112,
      created_at: "2025-09-05T07:30:00Z",
      updated_at: "2025-09-23T13:20:00Z",
    },
    {
      id: 5,
      name: "Door Repair",
      description: "Doors Need To Be Repaired",
      property_id: 1,
      property_name: "22 Indian Chase Dr",
      property_address: "22 Indian Chase Dr, Springfield, IL 62701",
      task_id: 6,
      field_team_member_ids: [1, 2],
      pm_assignee_ids: [101, 102],
      status: "dispatched",
      priority: "normal",
      due_date: "2025-09-05T00:00:00Z",
      approval_status: "pending",
      form_submission_status: "complete",
      is_visible_to_client: true,
      hours_decimal: 5.5,
      total_amount: 93,
      created_at: "2025-09-03T06:00:00Z",
      updated_at: "2025-09-22T15:10:00Z",
    },
    {
      id: 6,
      name: "Door Repair",
      description: "Doors Need To Be Repaired",
      property_id: 1,
      property_name: "22 Indian Chase Dr",
      property_address: "22 Indian Chase Dr, Springfield, IL 62701",
      task_id: 6,
      field_team_member_ids: [1, 2],
      pm_assignee_ids: [101, 102],
      status: "dispatched",
      priority: "low",
      due_date: "2025-09-04T00:00:00Z",
      approval_status: "pending",
      form_submission_status: "none",
      is_visible_to_client: true,
      hours_decimal: 4.0,
      total_amount: 75,
      created_at: "2025-09-02T05:45:00Z",
      updated_at: "2025-09-21T12:00:00Z",
    },
    {
      id: 7,
      name: "Door Repair",
      description: "Doors Need To Be Repaired",
      property_id: 1,
      property_name: "22 Indian Chase Dr",
      property_address: "22 Indian Chase Dr, Springfield, IL 62701",
      task_id: 6,
      field_team_member_ids: [3, 4],
      pm_assignee_ids: [101, 102],
      status: "dispatched",
      priority: "high",
      due_date: "2025-09-04T00:00:00Z",
      approval_status: "pending",
      form_submission_status: "partial",
      is_visible_to_client: true,
      hours_decimal: 6.5,
      total_amount: 101,
      created_at: "2025-09-01T04:30:00Z",
      updated_at: "2025-09-20T14:15:00Z",
    },
    {
      id: 8,
      name: "Door Repair",
      description: "Doors Need To Be Repaired",
      property_id: 1,
      property_name: "22 Indian Chase Dr",
      property_address: "22 Indian Chase Dr, Springfield, IL 62701",
      task_id: 6,
      field_team_member_ids: [1, 2],
      pm_assignee_ids: [101, 102],
      status: "dispatched",
      priority: "normal",
      due_date: "2025-09-03T00:00:00Z",
      approval_status: "pending",
      form_submission_status: "none",
      is_visible_to_client: true,
      hours_decimal: 8.0,
      total_amount: 124,
      created_at: "2025-08-31T03:15:00Z",
      updated_at: "2025-09-19T11:30:00Z",
    },
    {
      id: 9,
      name: "Door Repair",
      description: "Doors Need To Be Repaired",
      property_id: 1,
      property_name: "22 Indian Chase Dr",
      property_address: "22 Indian Chase Dr, Springfield, IL 62701",
      task_id: 6,
      field_team_member_ids: [5],
      pm_assignee_ids: [101, 102],
      status: "dispatched",
      priority: "low",
      due_date: "2025-09-01T00:00:00Z",
      approval_status: "pending",
      form_submission_status: "complete",
      is_visible_to_client: true,
      hours_decimal: 3.5,
      total_amount: 67,
      created_at: "2025-08-30T02:00:00Z",
      updated_at: "2025-09-18T09:45:00Z",
    },
    {
      id: 10,
      name: "Door Repair",
      description: "Doors Need To Be Repaired",
      property_id: 1,
      property_name: "22 Indian Chase Dr",
      property_address: "22 Indian Chase Dr, Springfield, IL 62701",
      task_id: 6,
      field_team_member_ids: [1, 2],
      pm_assignee_ids: [101, 102],
      status: "dispatched",
      priority: "high",
      due_date: "2025-09-01T00:00:00Z",
      approval_status: "pending",
      form_submission_status: "none",
      is_visible_to_client: true,
      hours_decimal: 7.5,
      total_amount: 118,
      created_at: "2025-08-29T01:30:00Z",
      updated_at: "2025-09-17T10:20:00Z",
    },
  ];

  if (params.status) {
    return mockData.filter((fto) => fto.status === params.status);
  }

  return mockData.slice(0, params.limit || 100);
};

const transformAPIToFieldTeamOrder = (
  apiData: APIFTOResponse[]
): FieldTeamOrder[] => {
  return apiData.map((fto) => {
    const dateObj = new Date(fto.due_date);
    const dueDate = dateObj.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

    const timesheetStatus = mapFormSubmissionToTimesheetStatus(
      fto.form_submission_status
    );

    return {
      id: fto.id,
      taskId: fto.task_id || fto.id,
      property: fto.property_name,
      description: fto.description,
      dueDate,
      priority: (fto.priority.toLowerCase() as "low" | "normal" | "high") || "normal",
      fieldTeam: resolveFieldTeamMembers(fto.field_team_member_ids),
      status: (fto.status as "dispatched" | "approved" | "pending-approval") || "pending-approval",
      timesheetStatus,
      amount: fto.total_amount,
      unit: "Unit",
      fieldTeamMemberIds: fto.field_team_member_ids,
      pmAssigneeIds: fto.pm_assignee_ids,
      propertyId: fto.property_id,
      dueDateISO: fto.due_date,
    };
  });
};

interface TaskFieldTeamOrdersProps {
  orders: FieldTeamOrder[];
  onOrdersChange: (orders: FieldTeamOrder[]) => void;
}

export default function TaskFieldTeamOrders({ orders, onOrdersChange }: TaskFieldTeamOrdersProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
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
        member.name.toLowerCase().includes(searchLower)
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
    (order: FieldTeamOrder) => {
      onOrdersChange(orders.filter((o) => o.id !== order.id));
    },
    [orders, onOrdersChange]
  );

  const handleEditOrder = useCallback(
    (order: FieldTeamOrder) => {
      setEditingOrder(order);
      setShowFTOModal(true);
    },
    [setShowFTOModal]
  );

  const handleApproveOrder = useCallback(
    (order: FieldTeamOrder) => {
      navigate(`/fto/approve/${order.id}`, {
        state: {
          ftoName: order.description,
          property: order.property,
          unit: order.unit ?? "",
          fieldTeamAssignee:
            order.fieldTeamAssignee ?? order.fieldTeam?.[0]?.name ?? "",
          task: order.task ?? "",
          description: order.description,
        },
      });
    },
    [navigate]
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
        {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">Loading field team orders...</div>
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
              return <PersonAvatars people={order.fieldTeam} type="assignee" fallback="None" size="sm" />;
            }
            if (columnKey === "status") {
              return <StatusBadge status={order.status} variant="fto-status" />;
            }
            if (columnKey === "timesheetStatus") {
              return <StatusBadge status={order.timesheetStatus} variant="timesheet-status" />;
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
        editingFTO={
          editingOrder
            ? {
                id: editingOrder.id,
                name: editingOrder.description,
                description: editingOrder.description,
                priority: editingOrder.priority,
                status: editingOrder.status === "pending-approval"
                  ? "new"
                  : editingOrder.status === "approved"
                    ? "completed"
                    : "dispatched",
                due_date: editingOrder.dueDateISO || editingOrder.dueDate,
                property_id: editingOrder.propertyId || 1,
                task_id: editingOrder.taskId,
                field_team_member_ids: editingOrder.fieldTeamMemberIds || [],
                pm_assignee_ids: editingOrder.pmAssigneeIds || [],
              }
            : null
        }
        onFTOCreated={(ftoData) => {
          const fieldTeamMasterData: Record<string, { email: string; phone: string; title: string }> = {
            "Christopher Harris": { email: "christopher.harris@company.com", phone: "(555) 111-2222", title: "Field Lead" },
            "Cassandra Smith": { email: "cassandra.smith@company.com", phone: "(555) 222-3333", title: "Field Technician" },
            "David Chen": { email: "david.chen@company.com", phone: "(555) 333-4444", title: "Field Specialist" },
            "Emma Rodriguez": { email: "emma.rodriguez@company.com", phone: "(555) 444-5555", title: "Field Technician" },
            "James Wilson": { email: "james.wilson@company.com", phone: "(555) 555-6666", title: "Field Lead" },
          };

          const newId = Math.max(...orders.map((o) => o.id), 0) + 1;
          const fieldTeamArray = ftoData.selectedAssignees.map(
            (assignee: any, idx: number) => {
              const name = assignee.name || assignee.label || assignee.value || "";
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
            }
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
