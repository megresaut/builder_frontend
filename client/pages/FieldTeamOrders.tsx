import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, ChevronDown } from "lucide-react";
import CreateFTOModal from "@/components/CreateFTOModal";
import FTOApprovalModal from "@/components/FTOApprovalModal";
import { usePageState } from "@/hooks/usePageState";
import { useSortingTable } from "@/hooks/useSortingTable";
import { useColumnManagement } from "@/hooks/useColumnManagement";
import ColumnFilterModal from "@/components/ColumnFilterModal";
import GlobalTable from "@/components/GlobalTable";

interface FieldTeamOrder {
  id: number;
  taskId: number;
  property: string;
  description: string;
  dueDate: string;
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

const fieldTeamOrders: FieldTeamOrder[] = [
  {
    id: 1,
    taskId: 6,
    property: "22 Indian Chase Dr",
    description: "Doors Need To Be Repaired",
    dueDate: "Oct 2, 2025",
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
    taskId: 6,
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
    taskId: 6,
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
    taskId: 6,
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
    taskId: 6,
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
    taskId: 6,
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
    taskId: 6,
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
    taskId: 6,
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
    taskId: 6,
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
    taskId: 6,
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

export default function FieldTeamOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<FieldTeamOrder[]>(fieldTeamOrders);
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
  const [showApprovalModal, setShowApprovalModal] = usePageState(
    "showApprovalModal",
    false,
  );

  const { handleSortClick, getSortIndicator, getSortedData } =
    useSortingTable(orders);
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
    "property",
    "description",
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
          className="w-3.5 h-3.5"
          alt=""
        />
      ),
    },
    {
      key: "property",
      label: "Property",
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" /><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" /><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" /><path d="M10 6h4" /><path d="M10 10h4" /><path d="M10 14h4" /><path d="M10 18h4" /></svg>,
    },
    {
      key: "description",
      label: "FTO Name",
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z" /><circle cx="7.5" cy="7.5" r=".5" fill="currentColor" /></svg>,
    },
    {
      key: "dueDate",
      label: "Due Date",
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 2v4" /><path d="M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" /></svg>,
    },
    {
      key: "fieldTeam",
      label: "Field Team",
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
      key: "status",
      label: "FTO Status",
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
      key: "timesheetStatus",
      label: "Timesheet Status",
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
      key: "amount",
      label: "Amount",
      icon: (
        <img
          loading="lazy"
          src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/3b8ec0fa6eb0ec8e711c3a23fefa8083d72c2a94?placeholderIfAbsent=true"
          style={{ width: "16px", height: "16px" }}
          alt=""
        />
      ),
    },
  ];

  return (
    <div
      className="min-h-screen bg-white p-4 md:p-6 lg:p-8"
      style={{
        borderStyle: "none",
        borderWidth: "1px",
        padding: "32px 32px 150px",
        minHeight: "1339px",
      }}
    >
      <div className="flex flex-col gap-6 w-fit min-w-full">
        {/* Header Section */}
        <div className="flex items-center gap-10 justify-between flex-wrap">
          {/* Title and Description */}
          <div className="flex flex-col gap-1 min-w-[240px]">
            <h1 className="text-[#303030] font-semibold text-2xl leading-[30px]">
              All Field Team Orders
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <p
                className="text-[#717179] font-medium text-base leading-4"
                style={{ marginTop: "-4px" }}
              >
                All your field team orders, in one place
              </p>
            </div>
          </div>

          {/* Create FTO Button */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowFTOModal(true)}
              className="flex h-9 items-center gap-2 px-3 rounded-lg border border-white bg-[#013764] shadow-[0px_0px_0px_1px_rgba(0,45,90,1)] hover:bg-[#003a73] transition-colors"
            >
              <Plus className="w-5 h-5 text-white" />
              <span className="text-white font-medium text-base leading-normal">
                Create FTO
              </span>
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {/* Field Team Orders Table - Using GlobalTable Component */}
          <GlobalTable
            columns={columns}
            data={orders}
            rowKey="id"
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
                  <div className="flex items-center gap-2">
                    {order.fieldTeam.map((member, idx) => (
                      <div key={idx} className="relative group">
                        <div
                          className={`w-7 h-7 rounded-full ${member.color} flex items-center justify-center text-white text-xs font-semibold border border-gray-300 cursor-pointer`}
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
            title="All Field Team Orders"
            headerActions={
              <div className="flex items-start gap-2.5">
                <div className="flex h-9 items-center gap-2 px-3 rounded-lg border border-[#DADADA] bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.03)]">
                  <Search className="w-5 h-5 text-gray-600" />
                  <input
                    type="text"
                    placeholder="Search..."
                    className="text-[#303030] font-normal text-base leading-[140%] tracking-[-0.32px] capitalize bg-transparent border-none outline-none placeholder:text-[#303030] w-32 sm:w-48"
                  />
                </div>
                <button className="flex h-9 justify-center items-center gap-2 px-3 rounded-lg border border-[#DADADA] bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] hover:bg-gray-50 transition-colors">
                  <span className="text-[#303030] font-normal text-base leading-[140%] tracking-[-0.32px] capitalize">
                    Filter
                  </span>
                  <ChevronDown className="w-4 h-4" />
                </button>
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
              </div>
            }
            actions={[
              {
                label: "Approve",
                icon: (
                  <img
                    loading="lazy"
                    src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/b13c8f79f0bbe495c159d6f52432780ef6582cfb?placeholderIfAbsent=true"
                    className="w-4 h-4"
                    alt=""
                  />
                ),
                onClick: (order: FieldTeamOrder) => {
                  setEditingOrder(order);
                  setShowApprovalModal(true);
                },
              },
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
                onClick: (order: FieldTeamOrder) => {
                  setEditingOrder(order);
                  setShowFTOModal(true);
                },
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
                onClick: (order: FieldTeamOrder) => {
                  setOrders((prev) => prev.filter(o => o.id !== order.id));
                },
              },
            ]}
            onRowClick={(order) => {
              navigate(`/tasks/${order.taskId}/fieldteam`);
            }}
            showColumnModal={showColumnModal}
            onShowColumnModalChange={setShowColumnModal}
          />
        </div>
      </div>

      {/* Create/Update FTO Modal */}
      <CreateFTOModal
        open={showFTOModal}
        onOpenChange={(open) => {
          setShowFTOModal(open);
          if (!open) {
            setEditingOrder(null);
          }
        }}
        editData={
          editingOrder
            ? {
                dueDate: editingOrder.dueDate,
                priority: "Normal",
                timesheetStatus: editingOrder.status,
              }
            : undefined
        }
      />

      {/* FTO Approval Modal */}
      <FTOApprovalModal
        open={showApprovalModal}
        onOpenChange={(open) => {
          setShowApprovalModal(open);
          if (!open) {
            setEditingOrder(null);
          }
        }}
        editingOrder={editingOrder}
        property={editingOrder?.property || "3 hekma Road"}
        unit={editingOrder?.unit || "2"}
        fieldTeamAssignee={editingOrder?.fieldTeamAssignee || "John Smith"}
      />

      {/* Column Filter Modal */}
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
      />
    </div>
  );
}
