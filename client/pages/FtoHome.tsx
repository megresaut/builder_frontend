import { useState, useRef } from "react";
import PageTemplate from "@/layout/PageTemplate";
import SubPageHeaderV2 from "@/components/SubPageHeaderV2";
import TableToggle from "@/components/TableToggle";
import BlueButton from "@/components/BlueButton";
import GlobalTable from "@/components/GlobalTable";
import { usePageState } from "@/hooks/usePageState";
import { useSortingTable } from "@/hooks/useSortingTable";
import { useColumnManagement } from "@/hooks/useColumnManagement";
import ColumnFilterModal from "@/components/ColumnFilterModal";
import { PlusIcon, ApproveIcon } from "@/components/icons";

interface FieldTeamOrder {
  id: number;
  name: string;
  dueDate: string;
  description: string;
  property: string;
  unit: string;
  priority: "low" | "normal" | "high";
  createdBy: string;
}

const mockOpenOrders: FieldTeamOrder[] = [
  {
    id: 1,
    name: "HVAC Inspection",
    dueDate: "Dec 10, 2025",
    description: "Annual HVAC system inspection",
    property: "22 Indian Chase Dr",
    unit: "Unit A",
    priority: "high",
    createdBy: "John Smith",
  },
  {
    id: 2,
    name: "Plumbing Repair",
    dueDate: "Dec 12, 2025",
    description: "Fix leaky faucet in kitchen",
    property: "22 Indian Chase Dr",
    unit: "Unit B",
    priority: "normal",
    createdBy: "Jane Doe",
  },
];

const mockClosedOrders: FieldTeamOrder[] = [
  {
    id: 3,
    name: "Electrical Repair",
    dueDate: "Dec 5, 2025",
    description: "Replace faulty outlet",
    property: "22 Indian Chase Dr",
    unit: "Unit C",
    priority: "normal",
    createdBy: "John Smith",
  },
];

export default function FtoHome() {
  const [activeTab, setActiveTab] = useState<"open" | "closed">("open");
  const [openOrders, setOpenOrders] = useState<FieldTeamOrder[]>(mockOpenOrders);
  const [closedOrders, setClosedOrders] = useState<FieldTeamOrder[]>(mockClosedOrders);

  const handleDeleteOrder = (order: FieldTeamOrder) => {
    if (activeTab === "open") {
      setOpenOrders((prev) => prev.filter((o) => o.id !== order.id));
    } else {
      setClosedOrders((prev) => prev.filter((o) => o.id !== order.id));
    }
  };

  const tabs = [
    { id: "open" as const, label: "Open" },
    { id: "closed" as const, label: "Closed" },
  ];

  const orderData = activeTab === "open" ? openOrders : closedOrders;

  // Sorting hook
  const { handleSortClick, getSortIndicator, getSortedData } =
    useSortingTable(orderData);

  // Column management hook
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
    "name",
    "dueDate",
    "description",
    "property",
    "unit",
    "priority",
    "createdBy",
  ]);

  // Pagination state
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

  const columns = [
    { key: "name", label: "Name" },
    { key: "dueDate", label: "Due date" },
    { key: "description", label: "Description" },
    { key: "property", label: "Property" },
    { key: "unit", label: "Unit" },
    { key: "priority", label: "Priority" },
    { key: "createdBy", label: "Created By" },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "#D97706";
      case "low":
        return "#059669";
      case "normal":
        return "#2463EB";
      default:
        return "#6B7280";
    }
  };

  return (
    <PageTemplate>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Home</h1>
          <p className="text-gray-600 mt-2">Welcome to Field Team Orders</p>
        </div>

        <SubPageHeaderV2
          leftContent={
            <TableToggle
              tabs={tabs}
              activeTab={activeTab}
              onTabChange={(tabId) => setActiveTab(tabId as "open" | "closed")}
            />
          }
          rightContent={
            <BlueButton icon={<PlusIcon width={20} height={20} />}>
              Submit
            </BlueButton>
          }
        />

        <GlobalTable
          columns={columns}
          data={orderData}
          rowKey="id"
          renderCell={(order: FieldTeamOrder, columnKey: string) => {
            switch (columnKey) {
              case "name":
                return (
                  <span className="text-gray-900 font-normal text-sm truncate">
                    {order.name}
                  </span>
                );
              case "dueDate":
                return (
                  <span className="text-gray-900 font-normal text-sm truncate">
                    {order.dueDate}
                  </span>
                );
              case "description":
                return (
                  <span className="text-gray-900 font-normal text-sm truncate">
                    {order.description}
                  </span>
                );
              case "property":
                return (
                  <span className="text-gray-900 font-normal text-sm truncate">
                    {order.property}
                  </span>
                );
              case "unit":
                return (
                  <span className="text-gray-900 font-normal text-sm truncate">
                    {order.unit}
                  </span>
                );
              case "priority":
                return (
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: getPriorityColor(order.priority) }}
                    />
                    <span className="text-gray-900 font-normal text-sm capitalize">
                      {order.priority}
                    </span>
                  </div>
                );
              case "createdBy":
                return (
                  <span className="text-gray-900 font-normal text-sm truncate">
                    {order.createdBy}
                  </span>
                );
              default:
                return null;
            }
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
          title={activeTab === "open" ? "Open Orders" : "Closed Orders"}
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
              <svg
                width="18"
                height="18"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="8" cy="3" r="1.5" fill="var(--color-text-primary)" />
                <circle cx="8" cy="8" r="1.5" fill="var(--color-text-primary)" />
                <circle cx="8" cy="13" r="1.5" fill="var(--color-text-primary)" />
              </svg>
            </button>
          }
          showSearchBar={true}
          actions={[
            {
              label: "Submit",
              icon: <ApproveIcon width={18} height={18} color="var(--color-text-secondary)" />,
              onClick: () => {},
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
            icon: null,
          }))}
          visibleColumns={visibleColumns}
          onToggleColumn={toggleColumnVisibility}
          onClose={() => setShowColumnModal(false)}
          buttonRef={columnButtonRef}
        />
      </div>
    </PageTemplate>
  );
}
