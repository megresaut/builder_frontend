import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageTemplate from "@/layout/PageTemplate";
import SubPageHeaderV2 from "@/components/SubPageHeaderV2";
import TableToggle from "@/components/TableToggle";
import GlobalTable from "@/components/GlobalTable";
import FtoOrderCard from "@/components/FtoOrderCard";
import { AlertBanner } from "@/components/AlertBanner";
import { usePageState } from "@/hooks/usePageState";
import { useSortingTable } from "@/hooks/useSortingTable";
import { useColumnManagement } from "@/hooks/useColumnManagement";
import ColumnFilterModal from "@/components/ColumnFilterModal";
import BlueButton from "@/components/BlueButton";
import {
  ApproveIcon,
  CalendarIcon,
  BuildingIcon,
  NoteIcon,
  DocumentIcon,
  FlagIcon,
  EditIcon,
  UserIcon,
  EyeIcon,
} from "@/components/icons";

interface FieldTeamOrder {
  id: number;
  name: string;
  dueDate: string;
  description: string;
  property: string;
  unit: string;
  priority: "low" | "normal" | "high";
  createdBy: string;
  formSubmissionStatus: string;
  approvalStatus?: "approved" | "pending" | "rejected" | null;
}

// Mock API response types
interface APIFieldTeamOrder {
  id: number;
  name: string;
  description: string;
  property_name: string;
  unit?: string;
  priority: "low" | "normal" | "high";
  due_date: string;
  form_submission_status: string;
  created_by?: string;
}

interface FetchFTOsParams {
  field_team_member_id: number;
  status?: string;
}

// Mock API function that simulates GET /maintenance/ftos
const mockFetchFTOs = async (
  params: FetchFTOsParams,
): Promise<APIFieldTeamOrder[]> => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 100));

  const mockData: APIFieldTeamOrder[] = [
    {
      id: 1,
      name: "HVAC Inspection",
      description: "Annual HVAC system inspection",
      property_name: "22 Indian Chase Dr",
      unit: "Unit A",
      priority: "high",
      due_date: "Dec 10, 2025",
      form_submission_status: "none",
      created_by: "John Smith",
    },
    {
      id: 2,
      name: "Plumbing Repair",
      description: "Fix leaky faucet in kitchen",
      property_name: "22 Indian Chase Dr",
      unit: "Unit B",
      priority: "normal",
      due_date: "Dec 12, 2025",
      form_submission_status: "none",
      created_by: "Jane Doe",
    },
    {
      id: 3,
      name: "Electrical Repair",
      description: "Replace faulty outlet",
      property_name: "22 Indian Chase Dr",
      unit: "Unit C",
      priority: "normal",
      due_date: "Dec 5, 2025",
      form_submission_status: "submitted",
      created_by: "John Smith",
    },
  ];

  // Filter by status if provided
  if (params.status) {
    return mockData.filter(
      (order) => order.form_submission_status === params.status,
    );
  }

  return mockData;
};

// Transform API response to component format
const transformAPIData = (apiData: APIFieldTeamOrder[]): FieldTeamOrder[] => {
  const submittedOrders = JSON.parse(
    localStorage.getItem("submittedFTOs") || "[]",
  ) as number[];
  const approvedOrders = JSON.parse(
    localStorage.getItem("approvedFTOs") || "[]",
  ) as number[];
  const rejectedOrders = JSON.parse(
    localStorage.getItem("rejectedFTOs") || "[]",
  ) as number[];

  return apiData.map((order) => ({
    id: order.id,
    name: order.name,
    dueDate: order.due_date,
    description: order.description,
    property: order.property_name,
    unit: order.unit || "N/A",
    priority: order.priority,
    createdBy: order.created_by || "Unknown",
    formSubmissionStatus: submittedOrders.includes(order.id)
      ? "submitted"
      : order.form_submission_status,
    approvalStatus: rejectedOrders.includes(order.id)
      ? "rejected"
      : approvedOrders.includes(order.id)
        ? "approved"
        : "pending",
  }));
};

export default function FtoHome() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"open" | "closed">("open");
  const [allOrders, setAllOrders] = useState<FieldTeamOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  const tabs = [
    { id: "open" as const, label: "Open" },
    { id: "closed" as const, label: "Closed" },
  ];

  // Handle responsive layout
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Initialize mock approved and rejected orders on first load
  useEffect(() => {
    if (!localStorage.getItem("approvedFTOs")) {
      localStorage.setItem("approvedFTOs", JSON.stringify([1, 3]));
    }
    if (!localStorage.getItem("rejectedFTOs")) {
      localStorage.setItem("rejectedFTOs", JSON.stringify([2]));
    }
  }, []);

  // Fetch FTOs from mock API
  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const apiResponse = await mockFetchFTOs({
          field_team_member_id: 1, // Mock team member ID
        });
        const transformedData = transformAPIData(apiResponse);
        setAllOrders(transformedData);
      } catch (error) {
        console.error("Error fetching FTOs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // Filter orders based on active tab
  const orderData = allOrders.filter((order) => {
    if (activeTab === "open") {
      return order.formSubmissionStatus === "none";
    } else {
      return order.formSubmissionStatus !== "none";
    }
  });

  const columnConfig: Record<string, { label: string; icon: React.ReactNode }> =
    {
      name: {
        label: "Name",
        icon: <DocumentIcon width={16} height={16} />,
      },
      dueDate: {
        label: "Due date",
        icon: <CalendarIcon width={16} height={16} />,
      },
      description: {
        label: "Description",
        icon: <NoteIcon width={16} height={16} />,
      },
      property: {
        label: "Property",
        icon: <BuildingIcon width={16} height={16} />,
      },
      unit: {
        label: "Unit",
        icon: <DocumentIcon width={16} height={16} />,
      },
      priority: {
        label: "Priority",
        icon: <FlagIcon width={16} height={16} />,
      },
      createdBy: {
        label: "Created By",
        icon: <DocumentIcon width={16} height={16} />,
      },
    };

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
    {
      key: "name",
      label: "Name",
      icon: <EditIcon width={16} height={16} color="#525252" />,
    },
    {
      key: "dueDate",
      label: "Due date",
      icon: <CalendarIcon width={16} height={16} />,
    },
    {
      key: "description",
      label: "Description",
      icon: <NoteIcon width={16} height={16} />,
    },
    {
      key: "property",
      label: "Property",
      icon: <BuildingIcon width={16} height={16} />,
    },
    {
      key: "unit",
      label: "Unit",
      icon: <DocumentIcon width={16} height={16} />,
    },
    {
      key: "priority",
      label: "Priority",
      icon: <FlagIcon width={16} height={16} />,
    },
    {
      key: "createdBy",
      label: "Created By",
      icon: <UserIcon width={16} height={16} />,
    },
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

  const rejectedOrders = allOrders.filter(
    (order) => order.approvalStatus === "rejected",
  );

  if (isMobile) {
    return (
      <PageTemplate className="!px-4 !pt-6 !pb-6 max-w-none !min-w-0">
        <div className="flex flex-col gap-4">
          {rejectedOrders.length > 0 && (
            <AlertBanner
              title="Rejected Field Team Orders"
              message={`You have ${rejectedOrders.length} rejected order${rejectedOrders.length > 1 ? "s" : ""} that need to be filled out again.`}
              actionText="View"
              onAction={() => setActiveTab("open")}
            />
          )}

          <div>
            <h1 className="text-2xl font-bold text-gray-900">Home</h1>
            <p className="text-gray-600 mt-1 text-sm">
              Welcome to Field Team Orders
            </p>
          </div>

          <div className="flex items-center justify-between gap-3 w-full">
            <TableToggle
              tabs={tabs}
              activeTab={activeTab}
              onTabChange={(tabId) => setActiveTab(tabId as "open" | "closed")}
            />
          </div>

          <div className="flex flex-col gap-3">
            {loading ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                Loading orders...
              </div>
            ) : orderData.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                No {activeTab} orders
              </div>
            ) : (
              orderData.map((order) => (
                <FtoOrderCard
                  key={order.id}
                  id={order.id}
                  name={order.name}
                  dueDate={order.dueDate}
                  description={order.description}
                  property={order.property}
                  unit={order.unit}
                  priority={order.priority}
                  createdBy={order.createdBy}
                  isApproved={
                    activeTab === "closed" &&
                    order.approvalStatus === "approved"
                  }
                />
              ))
            )}
          </div>
        </div>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate>
      <div className="flex flex-col gap-6">
        {rejectedOrders.length > 0 && (
          <AlertBanner
            title="Rejected Field Team Orders"
            message={`You have ${rejectedOrders.length} rejected order${rejectedOrders.length > 1 ? "s" : ""} that need to be filled out again.`}
            actionText="View"
            onAction={() => setActiveTab("open")}
          />
        )}

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
            <BlueButton
              icon={
                <ApproveIcon
                  width={16}
                  height={16}
                  className="brightness-0 invert"
                />
              }
              onClick={() => navigate("/fto/submission")}
            >
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
                      style={{
                        backgroundColor: getPriorityColor(order.priority),
                      }}
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
                <circle
                  cx="8"
                  cy="3"
                  r="1.5"
                  fill="var(--color-text-primary)"
                />
                <circle
                  cx="8"
                  cy="8"
                  r="1.5"
                  fill="var(--color-text-primary)"
                />
                <circle
                  cx="8"
                  cy="13"
                  r="1.5"
                  fill="var(--color-text-primary)"
                />
              </svg>
            </button>
          }
          showSearchBar={true}
          actions={[
            {
              label: (rowOrder) => {
                const order = rowOrder as FieldTeamOrder;
                const isApproved =
                  activeTab === "closed" && order.approvalStatus === "approved";
                return isApproved ? "View Summary" : "Submit";
              },
              icon: (rowOrder) => {
                const order = rowOrder as FieldTeamOrder;
                const isApproved =
                  activeTab === "closed" && order.approvalStatus === "approved";
                return isApproved ? (
                  <EyeIcon
                    width={18}
                    height={18}
                    color="var(--color-text-secondary)"
                  />
                ) : (
                  <ApproveIcon
                    width={18}
                    height={18}
                    color="var(--color-text-secondary)"
                  />
                );
              },
              onClick: (order) => {
                const isApproved =
                  activeTab === "closed" &&
                  (order as FieldTeamOrder).approvalStatus === "approved";
                navigate(`/fto/submission/${order.id}`, {
                  state: {
                    property: order.property,
                    unit: order.unit,
                    task: order.name,
                    description: order.description,
                    isApproved,
                  },
                });
              },
            },
          ]}
          onRowClick={(order) => {
            navigate(`/fto/submission/${order.id}`, {
              state: {
                property: order.property,
                unit: order.unit,
                task: order.name,
                description: order.description,
                isApproved:
                  activeTab === "closed" &&
                  (order as FieldTeamOrder).approvalStatus === "approved",
              },
            });
          }}
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
