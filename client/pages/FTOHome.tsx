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
  PlusIcon,
} from "@/components/icons";
import { fetchJSON } from "@/api/fetchJSON";
import { formatUnitLabel, formatUnitDisplayForTable, UNIT_EMPTY_DISPLAY } from "@/utils/unitLabel";
import { useAuth } from "@/auth/useAuth";

interface FieldTeamOrder {
  id: number;
  name: string;
  dueDate: string; // Formatted for display
  due_date: string; // ISO format for API/modal
  description: string;
  property: string;
  property_id: number | null;
  unit: string;
  unit_id?: number | null;
  priority: "low" | "normal" | "high";
  createdBy: string;
  formSubmissionStatus: string;
  approvalStatus?: "approved" | "pending" | "rejected" | null;
  pmAssigneeIds?: number[];
  pmAssigneeNames?: string[];
  fieldTeamMemberIds: number[];
  task_id?: number;
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
  fto_id?: number; // FTO ID to match with FTO data

  pmAssigneeIds?: number[];
  pmAssigneeNames?: string[]; // May be populated from property managers lookup
}
// Mock API response types
interface APIFieldTeamOrder {
  id: number;
  name: string;
  description: string;
  property_id: number;
  property_name: string;
  unit_id?: number | null;
  unit_name?: string;
  priority: "low" | "normal" | "high";
  due_date: string;
  form_submission_status: string;
  created_by?: string;
  task_id?: number;
}

interface FetchFTOsParams {
  field_team_member_id: number;
  status?: string;
}


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
    property_id: fto.property_id,
    unit: formatUnitLabel({
      unitId: fto.unit_id,
      unitName: fto.unit_name,
      fallback: UNIT_EMPTY_DISPLAY,
    }),
    unit_id: fto.unit_id ?? null,
    priority: fto.priority,
    dueDate: new Date(fto.due_date).toLocaleDateString(),
    due_date: fto.due_date, // Preserve original ISO format

    // 👇 NEW
    pmAssigneeIds: fto.pm_assignee_ids ?? [],
    pmAssigneeNames: fto.pm_assignee_names ?? [],
    fieldTeamMemberIds: fto.field_team_member_ids ?? [],
    task_id: fto.task_id,

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
    fto_id: s.FTOID ?? s.fto_id, // FTO ID to match with FTO data
  }));
};


export default function FtoHome() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"open" | "submissionHistory">(
    "open",
  );
  const isFetchingRef = useRef(false);
  const [allOrders, setAllOrders] = useState<FieldTeamOrder[]>([]);
  const [allFTOs, setAllFTOs] = useState<any[]>([]); // Store all FTOs for matching with submissions
  const [submissions, setSubmissions] = useState<SubmissionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [propertyManagers, setPropertyManagers] = useState<Map<number, string>>(new Map()); // ID -> name mapping

  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [isViewFTOModalOpen, setIsViewFTOModalOpen] = useState(false);


  const [showFTOModal, setShowFTOModal] = useState(false);
  const [editingFTO, setEditingFTO] = useState<ViewTaskData | null>(null);
  const [isViewingSubmission, setIsViewingSubmission] = useState(false);


  type ViewTaskData = {
    id?: number;
    name: string;
    description: string;
    dueDate?: string;
    due_date?: string; // ISO format for modal
    dateOfWork?: string;
    priority?: "low" | "normal" | "high";
    status?: "new" | "dispatched" | "completed" | "cancelled";
    property_id?: number;
    property_name?: string;
    unit_id?: number | null;
    unit_name?: string;
    task_id?: number;
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
    
    // For open orders (FieldTeamOrder), we have all the data needed
    if (!isSubmission) {
      const order = row as FieldTeamOrder;
      
      const viewData: ViewTaskData = {
        id: order.id,
        field_team_member_ids: order.fieldTeamMemberIds ?? [],
        pm_assignee_ids: order.pmAssigneeIds ?? [],
        name: order.name,
        description: order.description,
        property_id: order.property_id,
        property_name: order.property,
        unit_id: order.unit_id ?? null,
        unit_name: order.unit !== UNIT_EMPTY_DISPLAY ? order.unit : undefined,
        task_id: order.task_id,
        priority: order.priority as "low" | "normal" | "high",
        status: toFtoStatus(order.approvalStatus) as "new" | "dispatched" | "completed" | "cancelled",
        due_date: order.due_date, // ISO format for modal
        event_start_at: order.event_start_at ?? null,
        event_end_at: order.event_end_at ?? null,
      };

      setEditingFTO(viewData);
      setIsViewingSubmission(false);
      setShowFTOModal(true);
    } else {
      // For submissions, match the FTO from the stored allFTOs array
      const submission = row as SubmissionRecord;
      
      // Handle misc submissions (no fto_id) - navigate to submission view
      if (!submission.fto_id) {
        const canEdit =
          submission.status === "pending" ||
          submission.status === "rejected";
        navigate(`/fto/submission/${submission.id}`, {
          state: {
            isApproved: submission.status === "approved",
            canEdit,
            property: submission.property,
            unit: submission.unit,
            task: submission.name || "Miscellaneous Expense",
            description: submission.description,
          },
        });
        return;
      }

      // Find the matching FTO from allFTOs
      const matchedFTO = allFTOs.find((fto: any) => fto.id === submission.fto_id);
      
      if (!matchedFTO) {
        console.warn(`Cannot find FTO with id ${submission.fto_id} in fetched FTOs`);
        alert("Failed to load task information - FTO not found");
        return;
      }

      const viewData: ViewTaskData = {
        id: matchedFTO.id,
        field_team_member_ids: matchedFTO.field_team_member_ids ?? [],
        pm_assignee_ids: matchedFTO.pm_assignee_ids ?? [],
        name: matchedFTO.name,
        description: matchedFTO.description ?? "",
        property_id: matchedFTO.property_id,
        property_name: matchedFTO.property_name ?? "",
        unit_id: matchedFTO.unit_id ?? null,
        unit_name: matchedFTO.unit_name ?? undefined,
        task_id: matchedFTO.task_id ?? undefined,
        priority: matchedFTO.priority as "low" | "normal" | "high",
        status: matchedFTO.status as "new" | "dispatched" | "completed" | "cancelled",
        due_date: matchedFTO.due_date, // ISO format for modal
        event_start_at: matchedFTO.event_start_at ?? null,
        event_end_at: matchedFTO.event_end_at ?? null,
      };

      setEditingFTO(viewData);
      setIsViewingSubmission(true); // Mark as viewing submission (read-only)
      setShowFTOModal(true);
    }
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


  const { userId } = useAuth();

  // Fetch property managers once on mount
  useEffect(() => {
    const fetchPropertyManagers = async () => {
      try {
        const data = await fetchJSON("/users/property-managers");
        const pmMap = new Map<number, string>();
        data.forEach((pm: any) => {
          pmMap.set(Number(pm.id), pm.name || pm.email || `PM ${pm.id}`);
        });
        setPropertyManagers(pmMap);
      } catch (err) {
        console.error("Failed to fetch property managers:", err);
      }
    };

    fetchPropertyManagers();
  }, []);

  useEffect(() => {
    const fetchAll = async () => {
      if (!userId) return;
      if (isFetchingRef.current) return; // 🔒 hard lock
      isFetchingRef.current = true;
  
      setLoading(true);
  
      try {
        // 1️⃣ Fetch ALL FTOs FIRST (store all for matching with submissions)
        const ftoResponse = await fetchJSON(
          `/maintenance/ftos?field_team_member_id=${userId}`,
        );
  
        // Store all FTOs for matching with submissions
        setAllFTOs(ftoResponse);
  
        // Filter to only open/non-submitted FTOs for display (exclude cancelled)
        const openFTOs = ftoResponse.filter(
          (fto: any) =>
            fto.form_submission_status === "none" && fto.status !== "cancelled",
        );
  
        setAllOrders(transformAPIData(openFTOs));
  
        // 2️⃣ THEN fetch submission history
        const submissionsResponse = await fetchJSON(
          `/maintenance/submissions/all-for-tech?tech_id=${userId}`,
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
  }, [userId]);

  // Update submissions with PM names when property managers are loaded
  useEffect(() => {
    if (propertyManagers.size === 0) return;

    setSubmissions((prev) =>
      prev.map((submission) => {
        if (submission.pmAssigneeNames && submission.pmAssigneeNames.length > 0) {
          return submission; // Already has names
        }
        
        // Map IDs to names
        const names = submission.pmAssigneeIds
          ?.map((id) => propertyManagers.get(id))
          .filter((name): name is string => !!name) || [];
        
        return {
          ...submission,
          pmAssigneeNames: names.length > 0 ? names : undefined,
        };
      })
    );
  }, [propertyManagers]);
  

  
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
            {/* {activeTab === "open" && (
              <BlueButton
                icon={
                  <PlusIcon
                    width={16}
                    height={16}
                    className="brightness-0 invert"
                  />
                }
                onClick={() => {
                  setEditingFTO(null);
                  setShowFTOModal(true);
                }}
              >
                Create FTO
              </BlueButton>
            )} */}
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
                  propertyId={order.property_id}
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
                  onViewSummary={() => {
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
                  }}
                />
              ))
            )}
          </div>
        </div>

        <CreateFTOModal
          open={showFTOModal}
          onOpenChange={(open) => {
            setShowFTOModal(open);
            if (!open) {
              setEditingFTO(null);
              setIsViewingSubmission(false);
            }
          }}
          editingFTO={editingFTO as any}
          readOnly={isViewingSubmission}
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

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Home</h1>
            <p className="text-gray-600 mt-2">Welcome to Field Team Orders</p>
          </div>
          <button
            onClick={() => navigate("/field-team-orders")}
            className="flex h-9 items-center gap-2 px-3 rounded-lg border border-[#DADADA] bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] hover:bg-gray-50 transition-colors text-[#303030]"
          >
            <BuildingIcon width={20} height={20} />
            <span className="font-medium text-base leading-normal">
              Main Portal
            </span>
          </button>
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
              <div className="flex items-center gap-3">
                {/* <BlueButton
                  icon={
                    <PlusIcon
                      width={16}
                      height={16}
                      className="brightness-0 invert"
                    />
                  }
                  onClick={() => {
                    setEditingFTO(null);
                    setShowFTOModal(true);
                  }}
                >
                  Create FTO
                </BlueButton> */}
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
              </div>
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
                    {formatUnitDisplayForTable(row.unit)}
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
                
                  // Get PM names - prefer names array, fallback to matching IDs
                  let pmNames: string[] = [];
                  
                  if (record.pmAssigneeNames && record.pmAssigneeNames.length > 0) {
                    // Use names if available (from API or lookup)
                    pmNames = record.pmAssigneeNames;
                  } else if (record.pmAssigneeIds && record.pmAssigneeIds.length > 0) {
                    // Match IDs to names from property managers map
                    pmNames = record.pmAssigneeIds
                      .map((id) => propertyManagers.get(id))
                      .filter((name): name is string => !!name);
                  }
                
                  if (!pmNames.length) {
                    return <span className="text-gray-400 text-sm">—</span>;
                  }
                
                  return (
                    <div className="flex items-center gap-1">
                      {pmNames.map((name, idx) => (
                        <PropertyManagerAvatarCombined
                          key={idx}
                          name={name}
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
            // Commented out submit button for open orders - only show for submissions tab
            ...(activeTab !== "open" ? [
              {
                label: (row) => {
                  const submission = row as SubmissionRecord;
                  return submission.status === "pending" ||
                    submission.status === "rejected"
                    ? "Edit Submission"
                    : "View Submission";
                },
                icon: () => (
                  <EyeIcon
                    width={18}
                    height={18}
                    color="var(--color-text-secondary)"
                  />
                ),
                onClick: (row) => {
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
                },
              },
            ] : []),
            // Original submit action for open orders - COMMENTED OUT
            // {
            //   label: (row) => {
            //     if (activeTab === "open") return "Submit";
            //     const submission = row as SubmissionRecord;
            //     return submission.status === "pending" ||
            //       submission.status === "rejected"
            //       ? "Edit Submission"
            //       : "View Submission";
            //   },
            //   icon: () =>
            //     activeTab === "open" ? (
            //       <ApproveIcon
            //         width={18}
            //         height={18}
            //         color="var(--color-text-secondary)"
            //       />
            //     ) : (
            //       <EyeIcon
            //         width={18}
            //         height={18}
            //         color="var(--color-text-secondary)"
            //       />
            //     ),
            //   onClick: (row) => {
            //     if (activeTab === "open") {
            //       const order = row as FieldTeamOrder;
            //       // Navigate to new submission form (no ID) with FTO data to pre-fill
            //       navigate("/fto/submission", {
            //         state: {
            //           property: order.property,
            //           property_id: order.property_id,
            //           unit: order.unit,
            //           unit_id: order.unit_id,
            //           fto_id: order.id, // FTO ID to pre-select as task
            //           task: order.name,
            //           description: order.description,
            //           isApproved: order.approvalStatus === "approved",
            //         },
            //       });
            //     } else {
            //       const submission = row as SubmissionRecord;
            //       const canEdit =
            //         submission.status === "pending" ||
            //         submission.status === "rejected";
            //       navigate(`/fto/submission/${submission.id}`, {
            //         state: {
            //           isApproved: submission.status === "approved",
            //           canEdit,
            //           property: submission.property,
            //           unit: submission.unit,
            //           task: submission.name,
            //           description: submission.description,
            //         },
            //       });
            //     }
            //   },
            // },
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
            const isSubmission = "dateOfWork" in row;
            if (isSubmission) {
              // For submissions, navigate to submission form
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
            } else {
              // For open orders, open task modal
              openViewTaskModal(row as FieldTeamOrder | SubmissionRecord);
            }
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
            if (!open) {
              setEditingFTO(null);
              setIsViewingSubmission(false);
            }
          }}
          editingFTO={editingFTO as any}
          readOnly={isViewingSubmission}
        />

      </div>
    </PageTemplate>
  );
}
