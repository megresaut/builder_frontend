import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import PageTemplate from "@/layout/PageTemplate";
import SubPageHeaderV2 from "@/components/SubPageHeaderV2";
import GlobalTable from "@/components/GlobalTable";
import InspectionCard from "@/components/InspectionCard";
import TableToggle from "@/components/TableToggle";
import { usePageState } from "@/hooks/usePageState";
import { useSortingTable } from "@/hooks/useSortingTable";
import { useColumnManagement } from "@/hooks/useColumnManagement";
import ColumnFilterModal from "@/components/ColumnFilterModal";
import BlueButton from "@/components/BlueButton";
import { useToastNotification } from "@/hooks/useToastNotification";
import { useAuth } from "@/auth/useAuth";
import { fetchJSON } from "@/api/fetchJSON";
import { formatUnitDisplayForTable, UNIT_EMPTY_DISPLAY } from "@/utils/unitLabel";
import {
  CalendarIcon,
  BuildingIcon,
  DocumentIcon,
  PlusIcon,
  DotsIcon,
  EditIcon,
} from "@/components/icons";

interface InspectionRecord {
  id: number;
  property: string;
  unit: string;
  date: string;
  month?: string;
  inspector: string;
  status: "Completed" | "Draft";
  documentName?: string;
  lastUpdated?: string;
  inspectionName?: string;
}

interface BackendInspection {
  id: number;
  property_id: number;
  property_name?: string | null;
  unit_id: number | null;
  checklist_id: number;
  assigned_field_team_member_id: number | null;
  status: string;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

const getMonthFromDate = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    return date.toLocaleString("default", { month: "short", year: "numeric" });
  } catch {
    return "";
  }
};

const formatDate = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    return date.toLocaleString("default", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "";
  }
};

// Map backend inspection to frontend format (date shown as formatted only; no redundant month; inspector = current user)
const mapBackendInspectionToRecord = (
  backend: BackendInspection,
  currentUserName: string | null
): InspectionRecord => {
  const dueDateRaw = backend.due_date || backend.created_at;
  const status = backend.status === "submitted" || backend.status === "reviewed"
    ? "Completed"
    : "Draft";

  return {
    id: backend.id,
    property: backend.property_name || `Property ${backend.property_id}`,
    unit: backend.unit_id ? `Unit ${backend.unit_id}` : UNIT_EMPTY_DISPLAY,
    date: formatDate(dueDateRaw),
    month: undefined, // date already includes full date; no need for redundant "• Month Year"
    inspector: currentUserName ?? "N/A",
    status: status as "Completed" | "Draft",
    lastUpdated: backend.updated_at,
    inspectionName: `Inspection ${backend.id}`,
  };
};

export default function FtoInspections() {
  const navigate = useNavigate();
  const toast = useToastNotification();
  const { userId } = useAuth();
  const resolvedUserId = useMemo(() => {
    if (userId) {
      return userId;
    }
    const storedUserId = localStorage.getItem("avm_user_id");
    if (!storedUserId) {
      return null;
    }
    const parsed = Number(storedUserId);
    return Number.isFinite(parsed) ? parsed : null;
  }, [userId]);
  const [inspections, setInspections] = useState<InspectionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"open" | "completed">("open");
  const focusRefreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const tabbedInspections = useMemo(() => {
    if (activeTab === "completed") {
      return inspections.filter((i) => i.status === "Completed");
    }
    return inspections.filter((i) => i.status !== "Completed");
  }, [inspections, activeTab]);

  // Sorting hook
  const { handleSortClick, getSortIndicator, getSortedData } = useSortingTable(
    tabbedInspections,
    "ftoInspections",
  );

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
    "property",
    "unit",
    "inspectionName",
    "date",
    "lastUpdated",
    "status",
  ]);

  // Fetch inspections from API
  useEffect(() => {
    const loadInspections = async () => {
      if (!resolvedUserId) {
        setError("Missing field team member ID");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch current user's name for inspector display (list is filtered to this user's inspections)
        let currentUserName: string | null = null;
        try {
          const user = await fetchJSON(`/users/${resolvedUserId}`) as { name?: string };
          currentUserName = user?.name ?? null;
        } catch {
          // use null and mapper will show "N/A"
        }

        // Fetch inspections assigned to this user
        const response = await fetchJSON(
          `/inspections?assigned_field_team_member_id=${resolvedUserId}`
        );
        if (!Array.isArray(response)) {
          throw new Error("Unexpected inspections response");
        }
        const backendInspections = response as BackendInspection[];

        // Map backend data to frontend format (formatted date, no redundant month, current user as inspector)
        const mappedInspections = backendInspections.map((b) =>
          mapBackendInspectionToRecord(b, currentUserName)
        );

        // Also load any localStorage submissions (for backward compatibility)
        const submissions = JSON.parse(
          localStorage.getItem("ftoSubmissions") || "[]",
        ) as InspectionRecord[];

        const submissionsWithMonth = submissions.map((inspection) => ({
          ...inspection,
          month: inspection.month || getMonthFromDate(inspection.date),
          lastUpdated: inspection.lastUpdated || inspection.date,
        }));

        // Combine API data with localStorage submissions
        const allInspections = [...mappedInspections, ...submissionsWithMonth];

        // Remove duplicates by ID (localStorage might have duplicates)
        const uniqueMap = new Map<number, InspectionRecord>();
        allInspections.forEach((inspection) => {
          // Prefer API data over localStorage if same ID
          if (!uniqueMap.has(inspection.id)) {
            uniqueMap.set(inspection.id, inspection);
          }
        });

        // Completed inspections drop to the bottom; within each group sort by
        // id descending so the newest work is at the top.
        const isDone = (s: string) => s === "Completed" || s === "Submitted" || s === "Reviewed";
        setInspections(
          Array.from(uniqueMap.values()).sort((a, b) => {
            const aDone = isDone(a.status);
            const bDone = isDone(b.status);
            if (aDone !== bDone) return aDone ? 1 : -1;
            return b.id - a.id;
          }),
        );
      } catch (err) {
        console.error("Failed to load inspections:", err);
        setError(err instanceof Error ? err.message : "Failed to load inspections");
        toast.showError("Failed to load inspections");
      } finally {
        setLoading(false);
      }
    };

    // Load on mount
    loadInspections();

    // Reload when user comes back to the tab, but only after a short delay so that
    // an immediate click to navigate doesn't trigger a visible refresh of the current page first
    const handleFocus = () => {
      focusRefreshTimeoutRef.current = setTimeout(() => {
        focusRefreshTimeoutRef.current = null;
        loadInspections();
      }, 400);
    };
    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("focus", handleFocus);
      if (focusRefreshTimeoutRef.current) {
        clearTimeout(focusRefreshTimeoutRef.current);
        focusRefreshTimeoutRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedUserId]); // toast is stable (methods reference addToast from context)

  // Pagination state
  const [currentPage, setCurrentPage] = usePageState("inspectionsPage", 1);
  const [itemsPerPage, setItemsPerPage] = usePageState("inspectionsPerPage", 50);
  const [showPageSizeDropdown, setShowPageSizeDropdown] = usePageState(
    "inspectionsPageSizeDropdown",
    false,
  );
  const [openMenuId, setOpenMenuId] = usePageState<number | null>(
    "inspectionsMenuId",
    null,
  );

  // Mobile responsiveness
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const columns = [
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
      key: "inspectionName",
      label: "Inspection",
      icon: <DocumentIcon width={16} height={16} />,
    },
    {
      key: "date",
      label: "Due Date",
      icon: <CalendarIcon width={16} height={16} />,
    },
    {
      key: "lastUpdated",
      label: "Last Updated",
      icon: <CalendarIcon width={16} height={16} />,
    },
    {
      key: "status",
      label: "Status",
      icon: <DocumentIcon width={16} height={16} />,
    },
  ];

  return (
    <PageTemplate>
      <div className="flex flex-col gap-6">
        <SubPageHeaderV2
          leftContent={
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-semibold text-gray-900">
                Property Inspections
              </h1>
              <p className="text-sm text-gray-600">
                View and manage property inspection reports
              </p>
            </div>
          }
          rightContent={
            <BlueButton
              icon={<PlusIcon width={16} height={16} />}
              onClick={() => navigate("/fto/inspections/new")}
              className="hidden md:flex"
            >
              New Inspection
            </BlueButton>
          }
        />

        <TableToggle
          tabs={[
            { id: "open", label: "Open" },
            { id: "completed", label: "Completed" },
          ]}
          activeTab={activeTab}
          onTabChange={(tabId) => {
            setActiveTab(tabId as "open" | "completed");
            setCurrentPage(1);
          }}
        />

        {/* Loading State */}
        {loading && (
          <div className="text-center py-8 text-gray-500 text-sm">
            Loading inspections...
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="text-center py-8 text-red-500 text-sm">
            {error}
          </div>
        )}

        {/* Desktop Table View */}
        {!loading && !error && !isMobile && (
          <>
            <GlobalTable
              columns={columns}
              data={tabbedInspections}
              rowKey="id"
              renderCell={(row, columnKey) => {
                switch (columnKey) {
                  case "property":
                    return <span className="text-gray-900 text-sm">{row.property}</span>;
                  case "unit":
                    return <span className="text-gray-900 text-sm">{formatUnitDisplayForTable(row.unit)}</span>;
                  case "inspectionName":
                    return <span className="text-gray-900 text-sm">{row.inspectionName || "—"}</span>;
                  case "date":
                    return <span className="text-gray-900 text-sm">{formatDate(row.date)}</span>;
                  case "lastUpdated":
                    return <span className="text-gray-900 text-sm">{formatDate(row.lastUpdated || row.date)}</span>;
                  case "status":
                    return (
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{
                            backgroundColor:
                              row.status === "Completed"
                                ? "#059669"
                                : "#6b7280",
                          }}
                        />
                        <span className="text-gray-900 text-sm">{row.status}</span>
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
              title="Inspections"
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
                  label: row => row.status === "Completed" ? "View Inspection" : "Upload Inspection",
                  icon: <EditIcon width={18} height={18} color="#525252" />,
                  onClick: (row) => navigate(`/fto/inspections/${row.id}`),
                },
              ]}
              onRowClick={(row) => navigate(`/fto/inspections/${row.id}`)}
              showColumnModal={showColumnModal}
              onShowColumnModalChange={setShowColumnModal}
            />

            <ColumnFilterModal
              isOpen={showColumnModal}
              position={columnMenuPos}
              columns={columns}
              visibleColumns={visibleColumns}
              onToggleColumn={toggleColumnVisibility}
              onClose={() => setShowColumnModal(false)}
              buttonRef={columnButtonRef}
            />
          </>
        )}

        {/* Mobile Card View */}
        {!loading && !error && isMobile && (
          <div className="grid grid-cols-1 gap-3">
            {tabbedInspections.length > 0 ? (
              tabbedInspections.map((inspection) => (
                <InspectionCard
                  key={inspection.id}
                  id={inspection.id}
                  property={inspection.property}
                  unit={inspection.unit}
                  date={inspection.date}
                  month={inspection.month}
                  inspector={inspection.inspector}
                  status={inspection.status}
                  onAction={(row) => navigate(`/fto/inspections/${row.id}`)}
                />
              ))
            ) : (
              <div className="text-center py-8 text-gray-500 text-sm">
                No {activeTab === "completed" ? "completed" : "open"} inspections found
              </div>
            )}
          </div>
        )}
      </div>
    </PageTemplate>
  );
}
