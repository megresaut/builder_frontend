import { useRef, useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import CreateWorkOrderModal from "./CreateWorkOrderModal";
import { useColumnManagement } from "@/hooks/useColumnManagement";
import ColumnFilterModal from "./ColumnFilterModal";
import { useSortingTable } from "@/hooks/useSortingTable";
import GlobalTable from "./GlobalTable";
import { fetchJSON } from "@/api/fetchJSON";

// API response interface
interface ApiWorkOrder {
  id: number;
  task_id: number;
  property_id: number;
  vendor_id?: number;
  name: string;
  description?: string;
  status: string;
  priority: string;
  due_date?: string;
  created_at: string;
  updated_at: string;
  bill_id?: number;
  bill_total_cents?: number;
  // ... other fields from API
}

// Table display interface
interface WorkOrder {
  id: number;
  name: string;
  priority: string;
  status: string;
  dueDate: string;
  updatedDate: string;
  age: string;
  billTotal?: number; // bill_total_cents from API
}

// Helper function to format date from ISO string (e.g., "2026-01-20T21:47:54.146693-05:00")
function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return "—";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

// Helper function to calculate age from created_at
function calculateAge(createdAt: string): string {
  try {
    const created = new Date(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - created.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      const remainingHours = diffHours % 24;
      return `${diffDays} day${diffDays !== 1 ? "s" : ""} ${remainingHours} hour${remainingHours !== 1 ? "s" : ""}`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours !== 1 ? "s" : ""}`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes} minute${diffMinutes !== 1 ? "s" : ""}`;
    } else {
      return "just now";
    }
  } catch {
    return "—";
  }
}

// Helper function to format bill total from cents
function formatBillTotal(billTotalCents: number | null | undefined): string {
  if (!billTotalCents || billTotalCents === 0) {
    return "No invoice";
  }
  const dollars = billTotalCents / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(dollars);
}

// Map API response to table format
function mapApiWorkOrderToTable(apiWorkOrder: ApiWorkOrder): WorkOrder {
  return {
    id: apiWorkOrder.id,
    name: apiWorkOrder.name,
    priority: apiWorkOrder.priority,
    status: apiWorkOrder.status,
    dueDate: formatDate(apiWorkOrder.due_date),
    updatedDate: formatDate(apiWorkOrder.updated_at),
    age: calculateAge(apiWorkOrder.created_at),
    billTotal: apiWorkOrder.bill_total_cents,
  };
}

interface WorkOrdersTabProps {
  taskId?: string;
  initialSelectedWorkOrderId?: number | null;
  onWorkOrderSelect?: (workOrderId: number | null) => void;
}

export default function WorkOrdersTab({
  taskId,
  initialSelectedWorkOrderId = null,
  onWorkOrderSelect,
}: WorkOrdersTabProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedWorkOrderId, setSelectedWorkOrderId] = useState<number | null>(
    initialSelectedWorkOrderId,
  );
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [showPageSizeDropdown, setShowPageSizeDropdown] = useState(false);
  const [showCreateWorkOrderModal, setShowCreateWorkOrderModal] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [searchValue, setSearchValue] = useState("");

  useEffect(() => {
    setSelectedWorkOrderId(initialSelectedWorkOrderId ?? null);
  }, [initialSelectedWorkOrderId]);

  // Fetch work orders from API
  useEffect(() => {
    const fetchWorkOrders = async () => {
      if (!taskId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await fetchJSON(
          `/maintenance/work-orders?task_id=${taskId}`
        );
        const apiWorkOrders: ApiWorkOrder[] = Array.isArray(response)
          ? response
          : [];
        const mappedWorkOrders = apiWorkOrders.map(mapApiWorkOrderToTable);
        setWorkOrders(mappedWorkOrders);
      } catch (err) {
        console.error("Failed to fetch work orders:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load work orders"
        );
        setWorkOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkOrders();
  }, [taskId]);

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
    "name",
    "updatedDate",
    "age",
    "status",
    "dueDate",
    "billTotal",
  ]);

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
      key: "name",
      label: "Work Order",
      icon: (
        <img
          loading="lazy"
          src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/7f481edecd98b8475a23ac762feb99280a60a52a?placeholderIfAbsent=true"
          style={{ width: "16px", height: "16px" }}
          alt=""
        />
      ),
    },
    {
      key: "updatedDate",
      label: "Updated",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect width="18" height="18" x="3" y="4" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
      ),
    },
    {
      key: "age",
      label: "Age",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
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
      key: "dueDate",
      label: "Due",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect width="18" height="18" x="3" y="4" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
      ),
    },
    {
      key: "billTotal",
      label: "$ Bill Total",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" x2="12" y1="2" y2="22" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      ),
    },
  ];

  const filteredWorkOrders = workOrders.filter((order) => {
    const searchLower = searchValue.toLowerCase();
    return (
      order.name.toLowerCase().includes(searchLower) ||
      order.dueDate.toLowerCase().includes(searchLower) ||
      order.status.toLowerCase().includes(searchLower) ||
      order.priority.toLowerCase().includes(searchLower)
    );
  });

  const { handleSortClick, getSortIndicator, getSortedData } =
    useSortingTable(filteredWorkOrders);

  const handleSelectWorkOrder = (workOrderId: number | null) => {
    setSelectedWorkOrderId(workOrderId);
    onWorkOrderSelect?.(workOrderId);
  };

  const handleEditWorkOrder = useCallback(
    (workOrder: WorkOrder) => {
      if (taskId) {
        // Preserve navigation state when navigating to work order details
        const currentState = (location.state as any) || {};
        navigate(`/tasks/${taskId}/workorders/${workOrder.id}`, {
          state: {
            ...currentState,
            taskData: currentState.taskData || currentState.task,
            task: currentState.task || currentState.taskData,
          },
        });
      }
    },
    [taskId, navigate, location.state]
  );

  const handleDeleteWorkOrder = useCallback(
    (workOrder: WorkOrder) => {
      setWorkOrders((prev) => prev.filter((wo) => wo.id !== workOrder.id));
    },
    []
  );

  if (selectedWorkOrderId !== null) {
    return (
      <div className="flex flex-col w-full gap-6">
        <button
          onClick={() => handleSelectWorkOrder(null)}
          className="flex items-center gap-2 text-[#2463eb] hover:underline"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Work Orders
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-6 w-full">
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">Loading work orders...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-6 w-full">
        <div className="flex items-center justify-center py-12">
          <div className="text-red-500">Error: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      <GlobalTable
        columns={columns}
        data={filteredWorkOrders}
        rowKey="id"
        showSearchBar={true}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        renderCell={(workOrder: WorkOrder, columnKey: string) => {
          if (columnKey === "priority") {
            const priorityLower = workOrder.priority.toLowerCase();
            return (
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{
                    backgroundColor:
                      priorityLower === "high"
                        ? "#D97706"
                        : priorityLower === "low"
                          ? "#059669"
                          : "#2463EB",
                  }}
                />
                <span className="text-gray-900 font-normal text-sm capitalize">
                  {workOrder.priority}
                </span>
              </div>
            );
          }
          if (columnKey === "name") {
            return (
              <span className="text-gray-900 font-normal text-sm truncate">
                {workOrder.name}
              </span>
            );
          }
          if (columnKey === "updatedDate") {
            return (
              <span className="text-gray-900 font-normal text-sm truncate">
                {workOrder.updatedDate}
              </span>
            );
          }
          if (columnKey === "age") {
            return (
              <span className="text-gray-900 font-normal text-sm truncate">
                {workOrder.age}
              </span>
            );
          }
          if (columnKey === "status") {
            const statusLower = workOrder.status.toLowerCase();
            return (
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{
                    backgroundColor:
                      statusLower === "completed" || statusLower === "closed"
                        ? "#059669"
                        : "#2463EB",
                  }}
                />
                <span className="text-gray-900 font-normal text-sm capitalize">
                  {workOrder.status}
                </span>
              </div>
            );
          }
          if (columnKey === "dueDate") {
            return (
              <span className="text-gray-900 font-normal text-sm truncate">
                {workOrder.dueDate}
              </span>
            );
          }
          if (columnKey === "billTotal") {
            return (
              <span className="text-gray-900 font-normal text-sm truncate">
                {formatBillTotal(workOrder.billTotal)}
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
        title="Work Orders"
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
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="8" cy="3" r="1.5" fill="#303030"/>
                <circle cx="8" cy="8" r="1.5" fill="#303030"/>
                <circle cx="8" cy="13" r="1.5" fill="#303030"/>
              </svg>
            </button>
            <button
              onClick={() => setShowCreateWorkOrderModal(true)}
              className="flex h-9 items-center gap-2 px-3 rounded-lg border border-white bg-[#013764] shadow-[0_0_0_1px_#002D5A] hover:bg-[#003a73] transition-colors"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M10 4.16667V15.8333M4.16667 10H15.8333"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-white font-medium text-base leading-normal whitespace-nowrap">
                Create Work Order
              </span>
            </button>
          </>
        }
        actions={[
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
            onClick: handleEditWorkOrder,
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
                  d="M2.25 4.5H3.75H15.75M14.25 4.5V14.25C14.25 14.8023 14.0292 15.3415 13.636 15.7348C13.2428 16.128 12.7035 16.35 12.15 16.35H5.85C5.29674 16.35 4.75737 16.128 4.36414 15.7348C3.9709 15.3415 3.75 14.8023 3.75 14.25V4.5M6.75 4.5V3.15C6.75 2.85163 6.8684 2.56548 7.0795 2.3545C7.2905 2.1435 7.57663 2.025 7.875 2.025H10.125C10.4234 2.025 10.7095 2.1435 10.9205 2.3545C11.1316 2.56548 11.25 2.85163 11.25 3.15V4.5M7.5 8.25V13.5M10.5 8.25V13.5"
                  stroke="#982740"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ),
            onClick: handleDeleteWorkOrder,
          },
        ]}
        onRowClick={(workOrder) => handleSelectWorkOrder(workOrder.id)}
        showColumnModal={showColumnModal}
        onShowColumnModalChange={setShowColumnModal}
      />

      <CreateWorkOrderModal
        open={showCreateWorkOrderModal}
        onOpenChange={setShowCreateWorkOrderModal}
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
    </div>
  );
}
