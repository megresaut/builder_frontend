import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageTemplate from "@/layout/PageTemplate";
import GlobalTable from "@/components/GlobalTable";
import SubmissionHistoryCard from "@/components/SubmissionHistoryCard";
import { usePageState } from "@/hooks/usePageState";
import { useSortingTable } from "@/hooks/useSortingTable";
import { useColumnManagement } from "@/hooks/useColumnManagement";
import ColumnFilterModal from "@/components/ColumnFilterModal";
import {
  CalendarIcon,
  BuildingIcon,
  DocumentIcon,
  UserIcon,
  EditIcon,
} from "@/components/icons";

interface SubmissionRecord {
  id: number;
  name: string;
  dateOfWork: string;
  property: string;
  unit: string;
  createdBy: string;
  status: "pending" | "approved" | "rejected";
}

const mockSubmissionHistory: SubmissionRecord[] = [
  {
    id: 1,
    name: "HVAC Inspection",
    dateOfWork: "Dec 10, 2025",
    property: "22 Indian Chase Dr",
    unit: "Unit A",
    createdBy: "John Smith",
    status: "approved",
  },
  {
    id: 3,
    name: "Electrical Repair",
    dateOfWork: "Dec 8, 2025",
    property: "22 Indian Chase Dr",
    unit: "Unit C",
    createdBy: "John Smith",
    status: "approved",
  },
];

export default function FtoSubmissionSummary() {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<SubmissionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  // Handle responsive layout
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fetch submissions
  useEffect(() => {
    const fetchSubmissions = async () => {
      setLoading(true);
      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Get submitted orders from localStorage
        const submittedIds = JSON.parse(
          localStorage.getItem("submittedFTOs") || "[]",
        ) as number[];

        const filteredSubmissions = mockSubmissionHistory.filter((sub) =>
          submittedIds.includes(sub.id),
        );

        setSubmissions(filteredSubmissions);
      } catch (error) {
        console.error("Error fetching submissions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, []);

  // Sorting hook
  const { handleSortClick, getSortIndicator, getSortedData } =
    useSortingTable(submissions);

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
    "dateOfWork",
    "property",
    "unit",
    "createdBy",
    "status",
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
      key: "dateOfWork",
      label: "Date of Work",
      icon: <CalendarIcon width={16} height={16} />,
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
      key: "createdBy",
      label: "Created By",
      icon: <UserIcon width={16} height={16} />,
    },
    {
      key: "status",
      label: "Status",
      icon: <DocumentIcon width={16} height={16} />,
    },
  ];

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

  if (isMobile) {
    return (
      <PageTemplate className="!px-4 !pt-6 !pb-6 max-w-none !min-w-0">
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Submission History
            </h1>
            <p className="text-gray-600 mt-1 text-sm">
              View your submitted field team orders
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {loading ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                Loading submissions...
              </div>
            ) : submissions.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                No submissions yet
              </div>
            ) : (
              submissions.map((submission) => (
                <SubmissionHistoryCard
                  key={submission.id}
                  id={submission.id}
                  name={submission.name}
                  dateOfWork={submission.dateOfWork}
                  property={submission.property}
                  unit={submission.unit}
                  createdBy={submission.createdBy}
                  status={submission.status}
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
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Submission History
          </h1>
          <p className="text-gray-600 mt-2">
            View your submitted field team orders
          </p>
        </div>

        <GlobalTable
          columns={columns}
          data={submissions}
          rowKey="id"
          renderCell={(submission: SubmissionRecord, columnKey: string) => {
            switch (columnKey) {
              case "name":
                return (
                  <span className="text-gray-900 font-normal text-sm truncate">
                    {submission.name}
                  </span>
                );
              case "dateOfWork":
                return (
                  <span className="text-gray-900 font-normal text-sm truncate">
                    {submission.dateOfWork}
                  </span>
                );
              case "property":
                return (
                  <span className="text-gray-900 font-normal text-sm truncate">
                    {submission.property}
                  </span>
                );
              case "unit":
                return (
                  <span className="text-gray-900 font-normal text-sm truncate">
                    {submission.unit}
                  </span>
                );
              case "createdBy":
                return (
                  <span className="text-gray-900 font-normal text-sm truncate">
                    {submission.createdBy}
                  </span>
                );
              case "status":
                return (
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{
                        backgroundColor: getStatusColor(submission.status),
                      }}
                    />
                    <span className="text-gray-900 font-normal text-sm capitalize">
                      {submission.status}
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
          title="Submissions"
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
              label: "View",
              icon: (
                <EditIcon
                  width={18}
                  height={18}
                  color="var(--color-text-secondary)"
                />
              ),
              onClick: (submission) => {
                navigate(`/fto/submission/${submission.id}`, {
                  state: {
                    isApproved: submission.status === "approved",
                  },
                });
              },
            },
          ]}
          onRowClick={(submission) => {
            navigate(`/fto/submission/${submission.id}`, {
              state: {
                isApproved: submission.status === "approved",
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
