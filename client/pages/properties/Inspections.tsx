import { useState, useCallback, useEffect } from "react";
import { useNavigate, useParams, Routes, Route } from "react-router-dom";
import { usePageState } from "@/hooks/usePageState";
import { useSortingTable } from "@/hooks/useSortingTable";
import { useColumnManagement } from "@/hooks/useColumnManagement";
import GlobalTable from "@/components/GlobalTable";
import SubPageHeaderV2 from "@/components/SubPageHeaderV2";
import BlueButton from "@/components/BlueButton";
import PersonAvatars from "@/components/PersonAvatars";
import PageTemplate from "@/layout/PageTemplate";
import InspectionDetail from "./InspectionDetail";
import {
  EditIcon,
  DeleteIcon,
  PlusIcon,
  DotsIcon,
  CalendarIcon,
  UserIcon,
} from "@/components/icons";

interface Inspector {
  id: number;
  name: string;
  initials: string;
  email?: string;
}

interface Inspection {
  id: number;
  name: string;
  inspector: Inspector;
  inspectionDate: string;
  submitted: string;
  status: "Submitted" | "In Review" | "Approved" | "Revisions Needed";
  issues: number;
  photos: number;
  updated: string;
}

const mockInspections: Inspection[] = [
  {
    id: 1,
    name: "Quarterly Building Inspection",
    inspector: { id: 1, name: "John Doe", initials: "JD", email: "john.doe@company.com" },
    inspectionDate: "Oct 15, 2025",
    submitted: "Oct 16, 2025",
    status: "Approved",
    issues: 2,
    photos: 12,
    updated: "Oct 17, 2025",
  },
  {
    id: 2,
    name: "HVAC System Inspection",
    inspector: { id: 2, name: "Jane Smith", initials: "JS", email: "jane.smith@company.com" },
    inspectionDate: "Oct 10, 2025",
    submitted: "Oct 11, 2025",
    status: "In Review",
    issues: 1,
    photos: 8,
    updated: "Oct 12, 2025",
  },
  {
    id: 3,
    name: "Roof and Gutters Inspection",
    inspector: { id: 3, name: "Mike Johnson", initials: "MJ", email: "mike.johnson@company.com" },
    inspectionDate: "Oct 5, 2025",
    submitted: "Oct 6, 2025",
    status: "Revisions Needed",
    issues: 4,
    photos: 15,
    updated: "Oct 8, 2025",
  },
  {
    id: 4,
    name: "Foundation and Structural Inspection",
    inspector: { id: 1, name: "John Doe", initials: "JD", email: "john.doe@company.com" },
    inspectionDate: "Sep 25, 2025",
    submitted: "Sep 26, 2025",
    status: "Approved",
    issues: 0,
    photos: 10,
    updated: "Sep 27, 2025",
  },
  {
    id: 5,
    name: "Plumbing Systems Inspection",
    inspector: { id: 2, name: "Jane Smith", initials: "JS", email: "jane.smith@company.com" },
    inspectionDate: "Sep 20, 2025",
    submitted: "Sep 21, 2025",
    status: "Submitted",
    issues: 2,
    photos: 6,
    updated: "Sep 21, 2025",
  },
];

function InspectionsList() {
  const navigate = useNavigate();
  const { propertyId } = useParams();
  const [inspectionsList, setInspectionsList] = useState<Inspection[]>(mockInspections);
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

  const { handleSortClick, getSortIndicator, getSortedData } = useSortingTable(
    inspectionsList,
    "inspections",
  );

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
    setVisibleColumns,
  } = useColumnManagement([
    "name",
    "inspector",
    "inspectionDate",
    "submitted",
    "status",
    "issues",
    "photos",
    "updated",
  ]);

  // Show all columns by default
  useEffect(() => {
    setVisibleColumns(
      new Set([
        "name",
        "inspector",
        "inspectionDate",
        "submitted",
        "status",
        "issues",
        "photos",
        "updated",
      ]),
    );
  }, [setVisibleColumns]);

  const columns = [
    {
      key: "name",
      label: "Inspection",
      icon: (
        <img
          loading="lazy"
          src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/d5d01db2db718e32f4e620e7b1fc6ea705e115b1?placeholderIfAbsent=true"
          style={{ width: "16px", height: "16px" }}
          alt=""
        />
      ),
    },
    {
      key: "inspector",
      label: "Inspector",
      icon: <UserIcon width={16} height={16} />,
    },
    {
      key: "inspectionDate",
      label: "Inspection Date",
      icon: <CalendarIcon width={16} height={16} />,
    },
    {
      key: "submitted",
      label: "Submitted",
      icon: <CalendarIcon width={16} height={16} />,
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
      key: "issues",
      label: "Issues (#)",
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
      key: "photos",
      label: "Photos (#)",
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
      key: "updated",
      label: "Updated",
      icon: <CalendarIcon width={16} height={16} />,
    },
  ];

  const handleDeleteInspection = useCallback((inspection: Inspection) => {
    setInspectionsList((prev) => prev.filter((i) => i.id !== inspection.id));
  }, []);

  const handleEditInspection = useCallback((inspection: Inspection) => {
    navigate(`/properties/${propertyId}/inspections/${inspection.id}/edit`);
  }, [navigate, propertyId]);

  const handleViewInspection = useCallback((inspection: Inspection) => {
    navigate(`/properties/${propertyId}/inspections/${inspection.id}`);
  }, [navigate, propertyId]);

  const actions = [
    {
      label: "View Inspection",
      icon: <EditIcon width={18} height={18} color="#525252" />,
      onClick: handleViewInspection,
    },
    {
      label: "Edit Inspection",
      icon: <EditIcon width={18} height={18} color="#525252" />,
      onClick: handleEditInspection,
    },
    {
      label: "Delete Inspection",
      icon: <DeleteIcon width={18} height={18} color="#982740" />,
      onClick: handleDeleteInspection,
    },
  ];

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "Approved":
        return "#059669";
      case "In Review":
        return "#2463eb";
      case "Submitted":
        return "#d97706";
      case "Revisions Needed":
        return "#dc2626";
      default:
        return "#525252";
    }
  };

  return (
    <PageTemplate>
      <div className="flex flex-col gap-6 w-fit min-w-full">
        <SubPageHeaderV2
          leftContent={<div className="text-lg font-semibold">Inspections</div>}
          rightContent={
            <BlueButton
              icon={<PlusIcon width={20} height={20} />}
              onClick={() => navigate(`/properties/${propertyId}/inspections/new`)}
            >
              New Inspection
            </BlueButton>
          }
        />

        <GlobalTable
          columns={columns}
          data={inspectionsList}
          rowKey="id"
          onRowClick={(inspection) => {
            navigate(`/properties/${propertyId}/inspections/${inspection.id}`);
          }}
          renderCell={(inspection, columnKey) => {
            if (columnKey === "name") {
              return (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/properties/${propertyId}/inspections/${inspection.id}`);
                  }}
                  className="text-blue-600 font-normal text-sm hover:underline cursor-pointer transition-colors truncate"
                >
                  {inspection.name}
                </button>
              );
            }
            if (columnKey === "inspector") {
              return (
                <PersonAvatars
                  people={[inspection.inspector]}
                  type="assignee"
                  size="sm"
                  fallback="—"
                />
              );
            }
            if (columnKey === "inspectionDate") {
              return (
                <span className="text-gray-900 font-normal text-sm truncate">
                  {inspection.inspectionDate}
                </span>
              );
            }
            if (columnKey === "submitted") {
              return (
                <span className="text-gray-900 font-normal text-sm truncate">
                  {inspection.submitted}
                </span>
              );
            }
            if (columnKey === "status") {
              return (
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: getStatusColor(inspection.status) }}
                  />
                  <span className="text-gray-900 font-normal text-sm capitalize">
                    {inspection.status}
                  </span>
                </div>
              );
            }
            if (columnKey === "issues") {
              return (
                <span className="text-gray-900 font-normal text-sm">
                  {inspection.issues}
                </span>
              );
            }
            if (columnKey === "photos") {
              return (
                <span className="text-gray-900 font-normal text-sm">
                  {inspection.photos}
                </span>
              );
            }
            if (columnKey === "updated") {
              return (
                <span className="text-gray-900 font-normal text-sm truncate">
                  {inspection.updated}
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
          actions={actions}
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
          showColumnModal={showColumnModal}
          onShowColumnModalChange={setShowColumnModal}
        />
      </div>
    </PageTemplate>
  );
}

export default function Inspections() {
  const { propertyId } = useParams();

  return (
    <Routes>
      <Route index element={<InspectionsList />} />
      <Route path="new" element={<InspectionDetail isNew />} />
      <Route path=":inspectionId" element={<InspectionDetail />} />
      <Route path=":inspectionId/edit" element={<InspectionDetail isEdit />} />
    </Routes>
  );
}
