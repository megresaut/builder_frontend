import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useColumnManagement } from "@/hooks/useColumnManagement";
import { useSortingTable } from "@/hooks/useSortingTable";
import GlobalTable from "./GlobalTable";
import ColumnFilterModal from "./ColumnFilterModal";
import CreateFTOModal from "./CreateFTOModal";
import {
  CalendarIcon,
  NoteIcon,
  PlusIcon,
  EditIcon,
  DeleteIcon,
  ApproveIcon,
  DotsIcon,
} from "@/components/icons";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface FieldTeamOrder {
  id: number;
  property: string;
  description: string;
  dueDate: string;
  unit?: string;
  priority: "low" | "normal" | "high";
  fieldTeam: Array<{ initials: string; color: string; name: string }>;
  status: "dispatched" | "approved" | "pending-approval";
  timesheetStatus:
    | "awaiting-submission"
    | "submitted"
    | "rejected"
    | "approved";
  amount: number;
}

const getRandomTimesheetStatus = ():
  | "awaiting-submission"
  | "submitted"
  | "rejected"
  | "approved" => {
  const statuses: (
    | "awaiting-submission"
    | "submitted"
    | "rejected"
    | "approved"
  )[] = ["awaiting-submission", "submitted", "rejected", "approved"];
  return statuses[Math.floor(Math.random() * statuses.length)];
};

const initialFieldTeamOrders: FieldTeamOrder[] = [
  {
    id: 1,
    property: "22 Indian Chase Dr",
    description: "Doors Need To Be Repaired",
    dueDate: "Oct 2, 2025",
    unit: "1",
    priority: "high",
    fieldTeam: [
      { initials: "CH", color: "bg-blue-500", name: "Christopher Harris" },
      { initials: "CS", color: "bg-blue-500", name: "Cassandra Smith" },
    ],
    status: "dispatched",
    timesheetStatus: getRandomTimesheetStatus(),
    amount: 420,
  },
  {
    id: 2,
    property: "22 Indian Chase Dr",
    description: "Doors Need To Be Repaired",
    dueDate: "Sep 29, 2025",
    priority: "normal",
    fieldTeam: [
      { initials: "CH", color: "bg-blue-500", name: "Christopher Harris" },
      { initials: "CS", color: "bg-blue-500", name: "Cassandra Smith" },
    ],
    status: "approved",
    timesheetStatus: getRandomTimesheetStatus(),
    amount: 95,
  },
  {
    id: 3,
    property: "22 Indian Chase Dr",
    description: "Doors Need To Be Repaired",
    dueDate: "Sep 10, 2025",
    priority: "low",
    fieldTeam: [
      { initials: "CH", color: "bg-blue-500", name: "Christopher Harris" },
      { initials: "CS", color: "bg-blue-500", name: "Cassandra Smith" },
    ],
    status: "pending-approval",
    timesheetStatus: getRandomTimesheetStatus(),
    amount: 95,
  },
  {
    id: 4,
    property: "22 Indian Chase Dr",
    description: "Doors Need To Be Repaired",
    dueDate: "Sep 6, 2025",
    priority: "high",
    fieldTeam: [
      { initials: "CH", color: "bg-blue-500", name: "Christopher Harris" },
      { initials: "CS", color: "bg-blue-500", name: "Cassandra Smith" },
    ],
    status: "dispatched",
    timesheetStatus: getRandomTimesheetStatus(),
    amount: 112,
  },
  {
    id: 5,
    property: "22 Indian Chase Dr",
    description: "Doors Need To Be Repaired",
    dueDate: "Sep 5, 2025",
    priority: "normal",
    fieldTeam: [
      { initials: "CH", color: "bg-blue-500", name: "Christopher Harris" },
      { initials: "CS", color: "bg-blue-500", name: "Cassandra Smith" },
    ],
    status: "dispatched",
    timesheetStatus: getRandomTimesheetStatus(),
    amount: 93,
  },
  {
    id: 6,
    property: "22 Indian Chase Dr",
    description: "Doors Need To Be Repaired",
    dueDate: "Sep 4, 2025",
    priority: "low",
    fieldTeam: [
      { initials: "CH", color: "bg-blue-500", name: "Christopher Harris" },
      { initials: "CS", color: "bg-blue-500", name: "Cassandra Smith" },
    ],
    status: "dispatched",
    timesheetStatus: getRandomTimesheetStatus(),
    amount: 75,
  },
  {
    id: 7,
    property: "22 Indian Chase Dr",
    description: "Doors Need To Be Repaired",
    dueDate: "Sep 4, 2025",
    priority: "high",
    fieldTeam: [
      { initials: "CH", color: "bg-blue-500", name: "Christopher Harris" },
      { initials: "CS", color: "bg-blue-500", name: "Cassandra Smith" },
    ],
    status: "dispatched",
    timesheetStatus: getRandomTimesheetStatus(),
    amount: 101,
  },
  {
    id: 8,
    property: "22 Indian Chase Dr",
    description: "Doors Need To Be Repaired",
    dueDate: "Sep 3, 2025",
    priority: "normal",
    fieldTeam: [
      { initials: "CH", color: "bg-blue-500", name: "Christopher Harris" },
      { initials: "CS", color: "bg-blue-500", name: "Cassandra Smith" },
    ],
    status: "dispatched",
    timesheetStatus: getRandomTimesheetStatus(),
    amount: 124,
  },
  {
    id: 9,
    property: "22 Indian Chase Dr",
    description: "Doors Need To Be Repaired",
    dueDate: "Sep 1, 2025",
    priority: "low",
    fieldTeam: [
      { initials: "CH", color: "bg-blue-500", name: "Christopher Harris" },
      { initials: "CS", color: "bg-blue-500", name: "Cassandra Smith" },
    ],
    status: "dispatched",
    timesheetStatus: getRandomTimesheetStatus(),
    amount: 67,
  },
  {
    id: 10,
    property: "22 Indian Chase Dr",
    description: "Doors Need To Be Repaired",
    dueDate: "Sep 1, 2025",
    priority: "high",
    fieldTeam: [
      { initials: "CH", color: "bg-blue-500", name: "Christopher Harris" },
      { initials: "CS", color: "bg-blue-500", name: "Cassandra Smith" },
    ],
    status: "dispatched",
    timesheetStatus: getRandomTimesheetStatus(),
    amount: 118,
  },
];

const getFTOStatusBadge = (status: string) => {
  const statusConfig: Record<string, { label: string; dotColor: string }> = {
    "pending-approval": { label: "New", dotColor: "#1E40AF" },
    dispatched: { label: "Dispatched", dotColor: "#B45309" },
    approved: { label: "Completed", dotColor: "#166534" },
  };

  const config = statusConfig[status] || statusConfig["pending-approval"];

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <div
        style={{
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          backgroundColor: config.dotColor,
          flexShrink: 0,
        }}
      />
      <span style={{ fontSize: "14px", color: config.dotColor }}>
        {config.label}
      </span>
    </div>
  );
};

const getTimesheetStatusBadge = (status: string) => {
  const statusConfig: Record<string, { label: string; dotColor: string }> = {
    "awaiting-submission": {
      label: "Awaiting Submission",
      dotColor: "#3730A3",
    },
    submitted: { label: "Submitted", dotColor: "#991B1B" },
    rejected: { label: "Rejected", dotColor: "#DC2626" },
    approved: { label: "Approved", dotColor: "#065F46" },
  };

  const config = statusConfig[status] || statusConfig["awaiting-submission"];

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <div
        style={{
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          backgroundColor: config.dotColor,
          flexShrink: 0,
        }}
      />
      <span style={{ fontSize: "14px", color: config.dotColor }}>
        {config.label}
      </span>
    </div>
  );
};

interface FieldTeamOrdersTabProps {
  onApprove?: (order: FieldTeamOrder) => void;
  onEdit?: (order: FieldTeamOrder) => void;
}

export default function FieldTeamOrdersTab({
  onApprove,
  onEdit,
}: FieldTeamOrdersTabProps) {
  const navigate = useNavigate();
  const [fieldTeamOrders, setFieldTeamOrders] = useState<FieldTeamOrder[]>(initialFieldTeamOrders);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [showPageSizeDropdown, setShowPageSizeDropdown] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [searchValue, setSearchValue] = useState("");
  const [showFTOModal, setShowFTOModal] = useState(false);
  const [editFTOData, setEditFTOData] = useState<{
    dueDate: string;
    priority: string;
    ftoStatus?: string;
  } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<FieldTeamOrder | null>(null);

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
    "unit",
    "dueDate",
    "fieldTeam",
    "status",
    "timesheetStatus",
    "amount",
  ]);

  const columns = [
    {
      key: "priority",
      label: "Priority",
      icon: (
        <img
          loading="lazy"
          src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/2834b8d73cc09ccc447b824960316d0f5f8d8f78?placeholderIfAbsent=true"
          className="w-3.5 h-3.5 object-contain"
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
      key: "unit",
      label: "Unit",
      icon: (
        <img
          loading="lazy"
          src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/049b679c03670a4d1cf3028269ec92ee2c8cc8e3?placeholderIfAbsent=true"
          className="w-3.5 h-3.5 object-contain"
          alt=""
        />
      ),
    },
    {
      key: "dueDate",
      label: "Due Date",
      icon: <CalendarIcon width={16} height={16} />,
    },
    {
      key: "fieldTeam",
      label: "Field Team",
      icon: (
        <img
          loading="lazy"
          src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/3f6ece5f831bf0341b60fe742dd77e3f127dbd09?placeholderIfAbsent=true"
          className="w-4 h-4 object-contain"
          alt=""
        />
      ),
    },
    {
      key: "status",
      label: "FTO Status",
      icon: (
        <img
          loading="lazy"
          src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/137343a4a83566b73ded0282be168e468fbd729c?placeholderIfAbsent=true"
          className="w-4 h-4 object-contain"
          alt=""
        />
      ),
    },
    {
      key: "timesheetStatus",
      label: "Timesheet Status",
      icon: (
        <img
          loading="lazy"
          src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/137343a4a83566b73ded0282be168e468fbd729c?placeholderIfAbsent=true"
          className="w-4 h-4 object-contain"
          alt=""
        />
      ),
    },
    {
      key: "amount",
      label: "Amount",
      icon: (
        <img
          loading="lazy"
          src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/3b8ec0fa6eb0ec8e711c3a23fefa8083d72c2a94?placeholderIfAbsent=true"
          className="w-3.5 h-3.5 object-contain"
          alt=""
        />
      ),
    },
  ];

  const filteredOrders = fieldTeamOrders.filter((order) => {
    const searchLower = searchValue.toLowerCase();
    return (
      order.description.toLowerCase().includes(searchLower) ||
      order.dueDate.toLowerCase().includes(searchLower) ||
      order.status.toLowerCase().includes(searchLower) ||
      order.priority.toLowerCase().includes(searchLower) ||
      order.fieldTeam.some((member) =>
        member.name.toLowerCase().includes(searchLower)
      )
    );
  });

  const { handleSortClick, getSortIndicator, getSortedData } = useSortingTable(
    filteredOrders,
    "fieldTeamOrders"
  );

  const handleEditFTO = useCallback(
    (order: FieldTeamOrder) => {
      setEditFTOData({
        dueDate: order.dueDate,
        priority: "normal",
        ftoStatus: order.status,
      });
      setShowFTOModal(true);
      onEdit?.(order);
    },
    [onEdit]
  );

  const handleApproveFTO = useCallback(
    (order: FieldTeamOrder) => {
      navigate(`/fto/approve/${order.id}`, {
        state: {
          property: order.property || "",
          unit: order.unit || "",
          fieldTeamAssignee: order.assignee || "",
          task: order.task || "",
          description: order.description || "",
        },
      });
      onApprove?.(order);
    },
    [onApprove, navigate]
  );

  const handleDeleteFTO = useCallback((order: FieldTeamOrder) => {
    setOrderToDelete(order);
    setShowDeleteConfirm(true);
  }, []);

  const confirmDeleteFTO = useCallback(() => {
    if (orderToDelete) {
      setFieldTeamOrders((prev) => prev.filter((o) => o.id !== orderToDelete.id));
      setShowDeleteConfirm(false);
      setOrderToDelete(null);
    }
  }, [orderToDelete]);

  return (
    <div className="flex flex-col gap-6 w-full">
      <GlobalTable
        columns={columns}
        data={getSortedData()}
        rowKey="id"
        showSearchBar={true}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        renderCell={(order: FieldTeamOrder, columnKey: string) => {
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
                <span className="text-gray-900 font-normal text-sm capitalize">
                  {order.priority}
                </span>
              </div>
            );
          }
          if (columnKey === "description") {
            return (
              <span className="text-gray-900 font-normal text-sm">
                {order.description}
              </span>
            );
          }
          if (columnKey === "unit") {
            return (
              <span className="text-gray-900 font-normal text-sm">
                {order.unit || "-"}
              </span>
            );
          }
          if (columnKey === "dueDate") {
            return (
              <span className="text-gray-900 font-normal text-sm">
                {order.dueDate}
              </span>
            );
          }
          if (columnKey === "fieldTeam") {
            return (
              <div className="flex items-center gap-2">
                {order.fieldTeam.map((member, idx) => (
                  <div key={idx} className="relative group">
                    <div
                      className={`w-7 h-7 rounded-full ${member.color} flex items-center justify-center text-white text-xs font-semibold border border-gray-300 cursor-pointer flex-shrink-0`}
                      title={member.name}
                    >
                      {member.initials}
                    </div>
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                      {member.name}
                    </div>
                  </div>
                ))}
              </div>
            );
          }
          if (columnKey === "status") {
            return getFTOStatusBadge(order.status);
          }
          if (columnKey === "timesheetStatus") {
            return getTimesheetStatusBadge(order.timesheetStatus);
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
          <>
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
            <button
              onClick={() => {
                setEditFTOData(null);
                setShowFTOModal(true);
              }}
              className="flex h-9 items-center gap-2 px-3 rounded-lg bg-[#013764] border border-white shadow-[0px_0px_0px_1px_rgba(0,45,90,1)] hover:bg-[#003a73] transition-colors"
            >
              <PlusIcon width={20} height={20} color="white" />
              <span className="text-white font-medium text-base leading-normal whitespace-nowrap">
                Create FTO
              </span>
            </button>
          </>
        }
        actions={[
          {
            label: "Approve",
            icon: <ApproveIcon width={16} height={16} />,
            onClick: handleApproveFTO,
          },
          {
            label: "Edit",
            icon: <EditIcon width={18} height={18} color="#525252" />,
            onClick: handleEditFTO,
          },
          {
            label: "Delete",
            icon: <DeleteIcon width={18} height={18} color="#982740" />,
            onClick: handleDeleteFTO,
          },
        ]}
        showColumnModal={showColumnModal}
        onShowColumnModalChange={setShowColumnModal}
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

      <CreateFTOModal
        open={showFTOModal}
        onOpenChange={(open) => {
          setShowFTOModal(open);
          if (!open) {
            setEditFTOData(null);
          }
        }}
        editData={editFTOData || undefined}
      />

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Field Team Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{orderToDelete?.description}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteFTO}
              className="bg-[#982740] text-white hover:bg-[#7a1f33]"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
