import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageTemplate from "@/layout/PageTemplate";
import SubPageHeaderV2 from "@/components/SubPageHeaderV2";
import TableToggle from "@/components/TableToggle";
import GlobalTable from "@/components/GlobalTable";
import FtoOrderCard from "@/components/FtoOrderCard";
import SubmissionHistoryCard from "@/components/SubmissionHistoryCard";
import { AlertBanner } from "@/components/AlertBanner";
import CreateFTOModal from "@/components/CreateFTOModal";
import { usePageState } from "@/hooks/usePageState";
import { useSortingTable } from "@/hooks/useSortingTable";
import { useColumnManagement } from "@/hooks/useColumnManagement";
import ColumnFilterModal from "@/components/ColumnFilterModal";
import BlueButton from "@/components/BlueButton";
import { PropertyManagerAvatarCombined } from "@/components/PropertyManagerAvater";
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
import { fetchJSON } from "@/api/fetchJSON";

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
  pmAssigneeIds?: number[];
  pmAssigneeNames?: string[];
  fieldTeamMemberIds: number[];
}

interface SubmissionRecord {
  id: number;
  name: string;
  description: string;
  dateOfWork: string;
  property: string;
  unit: string;
  createdBy: string;
  status: "pending" | "approved" | "rejected";
  priority: "low" | "normal" | "high";

  pmAssigneeIds?: number[];
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
    {
      id: 4,
      name: "Window Replacement",
      description: "Replace damaged window frame",
      property_name: "22 Indian Chase Dr",
      unit: "Unit D",
      priority: "high",
      due_date: "Dec 15, 2025",
      form_submission_status: "none",
      created_by: "Mike Johnson",
    },
    {
      id: 5,
      name: "Roof Inspection",
      description: "Complete roof condition assessment",
      property_name: "22 Indian Chase Dr",
      unit: "Unit E",
      priority: "high",
      due_date: "Dec 18, 2025",
      form_submission_status: "none",
      created_by: "Sarah Williams",
    },
    {
      id: 6,
      name: "Door Lock Repair",
      description: "Fix faulty front door lock mechanism",
      property_name: "22 Indian Chase Dr",
      unit: "Unit F",
      priority: "normal",
      due_date: "Dec 20, 2025",
      form_submission_status: "none",
      created_by: "James Brown",
    },
    {
      id: 7,
      name: "Carpet Cleaning",
      description: "Deep clean common area carpets",
      property_name: "22 Indian Chase Dr",
      unit: "Common Area",
      priority: "low",
      due_date: "Dec 22, 2025",
      form_submission_status: "none",
      created_by: "Emily Davis",
    },
    {
      id: 8,
      name: "Bathroom Tile Repair",
      description: "Replace damaged tiles in Unit B bathroom",
      property_name: "22 Indian Chase Dr",
      unit: "Unit B",
      priority: "normal",
      due_date: "Dec 25, 2025",
      form_submission_status: "none",
      created_by: "Michael Chen",
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

// Mock submission history data
const mockSubmissionHistory: SubmissionRecord[] = [
  {
    id: 1,
    name: "HVAC Inspection",
    description: "Annual HVAC system inspection",
    dateOfWork: "Dec 10, 2025",
    property: "22 Indian Chase Dr",
    unit: "Unit A",
    createdBy: "John Smith",
    status: "approved",
    priority: "high",
  },
  {
    id: 3,
    name: "Electrical Repair",
    description: "Replace faulty outlet",
    dateOfWork: "Dec 8, 2025",
    property: "22 Indian Chase Dr",
    unit: "Unit C",
    createdBy: "John Smith",
    status: "approved",
    priority: "normal",
  },
  {
    id: 2,
    name: "Plumbing Repair",
    description: "Fix leaky faucet in kitchen",
    dateOfWork: "Dec 6, 2025",
    property: "22 Indian Chase Dr",
    unit: "Unit B",
    createdBy: "Jane Doe",
    status: "rejected",
    priority: "normal",
  },
  {
    id: 5,
    name: "Door Lock Repair",
    description: "Fix faulty front door lock mechanism",
    dateOfWork: "Dec 20, 2025",
    property: "22 Indian Chase Dr",
    unit: "Unit F",
    createdBy: "James Brown",
    status: "pending",
    priority: "normal",
  },
];


const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
};

// Transform API response to component format
const transformAPIData = (apiData: any[]): FieldTeamOrder[] => {
  return apiData.map((fto) => ({
    id: fto.id,
    name: fto.name,
    description: fto.description,
    property: fto.property_name,
    unit: "N/A",
    priority: fto.priority,
    dueDate: new Date(fto.due_date).toLocaleDateString(),

    // 👇 NEW
    pmAssigneeIds: fto.pm_assignee_ids ?? [],
    pmAssigneeNames: fto.pm_assignee_names ?? [],
    fieldTeamMemberIds: fto.field_team_member_ids ?? [],

    createdBy: "", // no longer used for PM display
    formSubmissionStatus: fto.form_submission_status,
    approvalStatus: fto.approval_status,
  }));
};


const transformSubmissionAPIData = (apiData: any[]): SubmissionRecord[] => {
  return apiData.map((s) => ({
    id: s.ID,
    name: s.fto_name,
    description: s.Description,
    dateOfWork: new Date(s.DateOfWork).toLocaleDateString(),
    property: s.property_name,
    unit: "—", // backend doesn’t send unit yet
    createdBy: "", // PM handled separately
    status: s.Status as "pending" | "approved" | "rejected",
    priority: "normal", // not currently returned by endpoint

    // 👇 PM data (plural)
    pmAssigneeIds: s.PMAssigneeIDs ?? [],
  }));
};


export default function FtoHome() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"open" | "submissionHistory">(
    "open",
  );
  const isFetchingRef = useRef(false);
  const [allOrders, setAllOrders] = useState<FieldTeamOrder[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [isViewFTOModalOpen, setIsViewFTOModalOpen] = useState(false);


  const [showFTOModal, setShowFTOModal] = useState(false);
  const [editingFTO, setEditingFTO] = useState<ViewTaskData | null>(null);

  type ViewTaskData = {
    name: string;
    description: string;
    dueDate?: string;
    dateOfWork?: string;
    priority?: string;
    status?: string;
    property?: string;
    unit?: string;
    field_team_member_ids: number[];
    pm_assignee_ids: number[];
  };

  const [viewingFTO, setViewingFTO] = useState<ViewTaskData | null>(null);

  const toFtoStatus = (status: string | undefined) => {
    switch (status) {
      case "approved":
        return "completed";
      case "rejected":
        return "cancelled";
      case "pending":
        return "pending-approval";
      default:
        return "pending-approval";
    }
  };

  const openViewTaskModal = (row: FieldTeamOrder | SubmissionRecord) => {
    const isSubmission = "dateOfWork" in row;

    const viewData: ViewTaskData = {
      field_team_member_ids: (row as FieldTeamOrder).fieldTeamMemberIds,
      pm_assignee_ids: (row as FieldTeamOrder).pmAssigneeIds,
      name: row.name,
      description: row.description,
      property: row.property,
      unit: row.unit,
      priority: row.priority,
      ...(isSubmission
        ? {
            dateOfWork: (row as SubmissionRecord).dateOfWork,
            status: toFtoStatus((row as SubmissionRecord).status),
          }
        : {
            dueDate: (row as FieldTeamOrder).dueDate,
            status: toFtoStatus((row as FieldTeamOrder).approvalStatus),
          }),
    };

    // setViewingFTO(viewData);
    // setIsViewFTOModalOpen(true);
    setEditingFTO(viewData);
    setShowFTOModal(true);
  };

  const tabs = [
    { id: "open" as const, label: "Open" },
    { id: "submissionHistory" as const, label: "Submission History" },
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
    // Always set these to ensure correct mock data
    localStorage.setItem("submittedFTOs", JSON.stringify([1, 2, 3, 5]));
    localStorage.setItem("approvedFTOs", JSON.stringify([1, 3]));
    localStorage.setItem("rejectedFTOs", JSON.stringify([2]));
  }, []);

  // // Fetch FTOs from mock API
  // useEffect(() => {
  //   const fetchOrders = async () => {
  //     setLoading(true);
  //     try {
  //       const apiResponse = await fetchJSON(
  //         `/maintenance/ftos?field_team_member_id=2`,
  //       );
  
  //       // Open tab logic per spec
  //       const openFTOs = apiResponse.filter(
  //         (fto: any) => fto.form_submission_status === "none",
  //       );
  
  //       setAllOrders(transformAPIData(openFTOs));
  //     } catch (err) {
  //       console.error("Error fetching FTOs:", err);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };
  
  //   fetchOrders();
  // }, []);
  
  // // Fetch submission history
  // useEffect(() => {
  //   const fetchSubmissions = async () => {
  //     setLoading(true);
  //     try {
  //       const apiResponse = await fetchJSON(
  //         `/maintenance/submissions/all-for-tech?tech_id=2`,
  //       );

  //       // newest first (per spec)
  //       const sorted = [...apiResponse].sort(
  //         (a, b) =>
  //           new Date(b.CreatedAt).getTime() -
  //           new Date(a.CreatedAt).getTime(),
  //       );

  //       setSubmissions(transformSubmissionAPIData(sorted));
  //     } catch (error) {
  //       console.error("Error fetching submissions:", error);
  //       setSubmissions([]);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   fetchSubmissions();
  // }, []);


  useEffect(() => {
    const fetchAll = async () => {
      if (isFetchingRef.current) return; // 🔒 hard lock
      isFetchingRef.current = true;
  
      setLoading(true);
  
      try {
        // 1️⃣ Fetch OPEN FTOs FIRST
        const ftoResponse = await fetchJSON(
          `/maintenance/ftos?field_team_member_id=2`,
        );
  
        const openFTOs = ftoResponse.filter(
          (fto: any) => fto.form_submission_status === "none",
        );
  
        setAllOrders(transformAPIData(openFTOs));
  
        // 2️⃣ THEN fetch submission history
        const submissionsResponse = await fetchJSON(
          `/maintenance/submissions/all-for-tech?tech_id=2`,
        );
  
        const sorted = [...submissionsResponse].sort(
          (a, b) =>
            new Date(b.CreatedAt).getTime() -
            new Date(a.CreatedAt).getTime(),
        );
  
        setSubmissions(transformSubmissionAPIData(sorted));
      } catch (err) {
        console.error("Error fetching FTO home data:", err);
        setSubmissions([]);
      } finally {
        setLoading(false);
        isFetchingRef.current = false; // 🔓 unlock
      }
    };
  
    fetchAll();
  }, []);
  

  
  // Filter data based on active tab
  const displayData =
    activeTab === "open"
      ? allOrders.filter((order) => order.formSubmissionStatus === "none")
      : submissions;

  // Sorting hook
  const { handleSortClick, getSortIndicator, getSortedData } =
    useSortingTable(displayData);

  // Get column defaults based on active tab
  const getDefaultColumns = () => {
    if (activeTab === "submissionHistory") {
      return [
        "name",
        "description",
        "dateOfWork",
        "property",
        "unit",
        "priority",
        "createdBy",
        "status",
      ];
    }
    return [
      "name",
      "dueDate",
      "description",
      "property",
      "unit",
      "priority",
      "createdBy",
    ];
  };

  // Column management hook
  const {
    columnOrder,
    setColumnOrder,
    visibleColumns,
    setVisibleColumns,
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
  } = useColumnManagement(getDefaultColumns());

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

  const getColumns = () => {
    const baseColumns = [
      {
        key: "name",
        label: "Name",
        icon: <EditIcon width={16} height={16} color="#525252" />,
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
        label: "Property Manager",
        icon: <UserIcon width={16} height={16} />,
      },
      {
        key: "status",
        label: "Status",
        icon: <ApproveIcon width={16} height={16} />,
      },
    ];

    if (activeTab === "submissionHistory") {
      return [
        baseColumns[0],
        baseColumns[1],
        {
          key: "dateOfWork",
          label: "Date of Work",
          icon: <CalendarIcon width={16} height={16} />,
        },
        ...baseColumns.slice(2),
      ];
    }

    return [
      baseColumns[0],
      {
        key: "dueDate",
        label: "Due date",
        icon: <CalendarIcon width={16} height={16} />,
      },
      baseColumns[1],
      baseColumns[2],
      baseColumns[3],
      baseColumns[4],
      baseColumns[5],
    ];
  };

  const columns = getColumns();

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "#059669";
      case "rejected":
        return "#DC2626";
      case "pending":
        return "#2463EB";
      default:
        return "#6B7280";
    }
  };

  const rejectedOrders = submissions.filter(
    (submission) => submission.status === "rejected",
  );

  // Ensure columnOrder includes all current columns and reset visibility on tab change
  useEffect(() => {
    const currentColumnKeys = columns.map((col) => col.key);
    const defaultCols = getDefaultColumns();

    setColumnOrder(defaultCols);
    setVisibleColumns(new Set(defaultCols));
  }, [activeTab]);

  if (isMobile) {
    return (
      <PageTemplate className="!px-4 !pt-6 !pb-6 max-w-none !min-w-0">
        <div className="flex flex-col gap-4">
          {rejectedOrders.length > 0 && (
            <AlertBanner
              title="Rejected Field Team Orders"
              message={`You have ${rejectedOrders.length} rejected order${rejectedOrders.length > 1 ? "s" : ""} that need to be filled out again.`}
              actionText="View"
              onAction={() => {
                const firstRejectedSubmission = rejectedOrders[0];
                if (firstRejectedSubmission) {
                  navigate(`/fto/submission/${firstRejectedSubmission.id}`, {
                    state: {
                      property: firstRejectedSubmission.property,
                      unit: firstRejectedSubmission.unit,
                      task: firstRejectedSubmission.name,
                      description: firstRejectedSubmission.description,
                      isApproved: false,
                      canEdit: true,
                    },
                  });
                }
              }}
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
              onTabChange={(tabId) =>
                setActiveTab(tabId as "open" | "submissionHistory")
              }
            />
          </div>

          <div className="flex flex-col gap-3">
            {loading ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                Loading...
              </div>
            ) : displayData.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                No {activeTab === "open" ? "open" : "submission history"} orders
              </div>
            ) : activeTab === "open" ? (
              (displayData as FieldTeamOrder[]).map((order) => (
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
                  isApproved={order.approvalStatus === "approved"}
                  status={
                    (order.approvalStatus || "pending") as
                      | "approved"
                      | "pending"
                      | "rejected"
                  }
                  onViewTask={() => openViewTaskModal(order)}
                />
              ))
            ) : (
              (displayData as SubmissionRecord[]).map((submission) => (
                <SubmissionHistoryCard
                  key={submission.id}
                  id={submission.id}
                  name={submission.name}
                  description={submission.description}
                  dateOfWork={submission.dateOfWork}
                  property={submission.property}
                  unit={submission.unit}
                  createdBy={submission.createdBy}
                  status={submission.status}
                  priority={submission.priority}
                  onViewTask={() => openViewTaskModal(submission)}
                />
              ))
            )}
          </div>
        </div>

        <CreateFTOModal
          open={showFTOModal}
          onOpenChange={(open) => {
            setShowFTOModal(open);
            if (!open) setEditingFTO(null);
          }}
          editingFTO={editingFTO}
        />

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
            onAction={() => {
              const firstRejectedSubmission = rejectedOrders[0];
              if (firstRejectedSubmission) {
                navigate(`/fto/submission/${firstRejectedSubmission.id}`, {
                  state: {
                    property: firstRejectedSubmission.property,
                    unit: firstRejectedSubmission.unit,
                    task: firstRejectedSubmission.name,
                    description: firstRejectedSubmission.description,
                    isApproved: false,
                    canEdit: true,
                  },
                });
              }
            }}
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
              onTabChange={(tabId) =>
                setActiveTab(tabId as "open" | "submissionHistory")
              }
            />
          }
          rightContent={
            activeTab === "open" && (
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
            )
          }
        />

        <GlobalTable
          columns={columns}
          data={displayData}
          rowKey="id"
          renderCell={(
            row: FieldTeamOrder | SubmissionRecord,
            columnKey: string,
          ) => {
            switch (columnKey) {
              case "name":
                return (
                  <span className="text-gray-900 font-normal text-sm truncate">
                    {row.name}
                  </span>
                );
              case "dueDate":
                return (
                  <span className="text-gray-900 font-normal text-sm truncate">
                    {(row as FieldTeamOrder).dueDate}
                  </span>
                );
              case "dateOfWork":
                return (
                  <span className="text-gray-900 font-normal text-sm truncate">
                    {(row as SubmissionRecord).dateOfWork}
                  </span>
                );
              case "description":
                return (
                  <span className="text-gray-900 font-normal text-sm truncate">
                    {row.description}
                  </span>
                );
              case "property":
                return (
                  <span className="text-gray-900 font-normal text-sm truncate">
                    {row.property}
                  </span>
                );
              case "unit":
                return (
                  <span className="text-gray-900 font-normal text-sm truncate">
                    {row.unit}
                  </span>
                );
              case "priority":
                return (
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{
                        backgroundColor: getPriorityColor(row.priority),
                      }}
                    />
                    <span className="text-gray-900 font-normal text-sm capitalize">
                      {row.priority}
                    </span>
                  </div>
                );
                case "createdBy": {
                  const record = row as FieldTeamOrder | SubmissionRecord;
                
                  if (!record.pmAssigneeIds?.length) {
                    return <span className="text-gray-400 text-sm">—</span>;
                  }
                
                  return (
                    <div className="flex items-center gap-1">
                      {record.pmAssigneeIds.map((id, idx) => (
                        <PropertyManagerAvatarCombined
                          key={idx}
                          name={`PM ${id}`} // placeholder until names are added
                          isCreator={false}
                        />
                      ))}
                    </div>
                  );
                }                               
              case "status":
                return (
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{
                        backgroundColor:
                          activeTab === "open"
                            ? getStatusColor(
                                (row as FieldTeamOrder).approvalStatus ||
                                  "pending",
                              )
                            : getStatusColor((row as SubmissionRecord).status),
                      }}
                    />
                    <span className="text-gray-900 font-normal text-sm capitalize">
                      {activeTab === "open"
                        ? (row as FieldTeamOrder).approvalStatus || "pending"
                        : (row as SubmissionRecord).status}
                    </span>
                  </div>
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
          title={activeTab === "open" ? "Open Orders" : "Submission History"}
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
              label: (row) => {
                if (activeTab === "open") return "Submit";
                const submission = row as SubmissionRecord;
                return submission.status === "pending" ||
                  submission.status === "rejected"
                  ? "Edit Submission"
                  : "View Submission";
              },
              icon: () =>
                activeTab === "open" ? (
                  <ApproveIcon
                    width={18}
                    height={18}
                    color="var(--color-text-secondary)"
                  />
                ) : (
                  <EyeIcon
                    width={18}
                    height={18}
                    color="var(--color-text-secondary)"
                  />
                ),
              onClick: (row) => {
                if (activeTab === "open") {
                  const order = row as FieldTeamOrder;
                  navigate(`/fto/submission/${order.id}`, {
                    state: {
                      property: order.property,
                      unit: order.unit,
                      task: order.name,
                      description: order.description,
                      isApproved: order.approvalStatus === "approved",
                    },
                  });
                } else {
                  const submission = row as SubmissionRecord;
                  const canEdit =
                    submission.status === "pending" ||
                    submission.status === "rejected";
                  navigate(`/fto/submission/${submission.id}`, {
                    state: {
                      isApproved: submission.status === "approved",
                      canEdit,
                      property: submission.property,
                      unit: submission.unit,
                      task: submission.name,
                      description: submission.description,
                    },
                  });
                }
              },
            },
            {
              label: () => "View Task",
              icon: () => (
                <EyeIcon
                  width={18}
                  height={18}
                  color="var(--color-text-secondary)"
                />
              ),
              onClick: (row) => {
                openViewTaskModal(row as FieldTeamOrder | SubmissionRecord);
              },
            },
          ]}
          onRowClick={(row) => {
            openViewTaskModal(row as FieldTeamOrder | SubmissionRecord);
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

        <CreateFTOModal
          open={showFTOModal}
          onOpenChange={(open) => {
            setShowFTOModal(open);
            if (!open) setEditingFTO(null);
          }}
          editingFTO={editingFTO}
        />

      </div>
    </PageTemplate>
  );
}
