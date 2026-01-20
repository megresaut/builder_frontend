import { useState, useEffect } from "react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageTemplate from "@/layout/PageTemplate";
import SubPageHeaderV2 from "@/components/SubPageHeaderV2";
import GlobalTable from "@/components/GlobalTable";
import { usePageState } from "@/hooks/usePageState";
import { useSortingTable } from "@/hooks/useSortingTable";
import { useColumnManagement } from "@/hooks/useColumnManagement";
import ColumnFilterModal from "@/components/ColumnFilterModal";
import BlueButton from "@/components/BlueButton";
import {
  CalendarIcon,
  BuildingIcon,
  DocumentIcon,
  PlusIcon,
  DotsIcon,
  EditIcon,
  UserIcon,
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
}

const getMonthFromDate = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    return date.toLocaleString("default", { month: "short", year: "numeric" });
  } catch {
    return "";
  }
};

const mockInspections: InspectionRecord[] = [
  {
    id: 1,
    property: "22 Indian Chase Dr",
    unit: "Unit A",
    date: "2025-10-15",
    month: getMonthFromDate("2025-10-15"),
    inspector: "John Doe",
    status: "Completed",
    documentName: "Q4 Inspection.docx",
  },
  {
    id: 2,
    property: "22 Indian Chase Dr",
    unit: "Unit B",
    date: "2025-10-10",
    month: getMonthFromDate("2025-10-10"),
    inspector: "Jane Smith",
    status: "Completed",
    documentName: "HVAC Inspection.docx",
  },
];

export default function FtoInspections() {
  const navigate = useNavigate();
  const [inspections, setInspections] = useState<InspectionRecord[]>(() => {
    // Load submitted inspections from localStorage
    const submissions = JSON.parse(
      localStorage.getItem("ftoSubmissions") || "[]",
    ) as InspectionRecord[];

    // Add month field to submissions if missing
    const submissionsWithMonth = submissions.map((inspection) => ({
      ...inspection,
      month: inspection.month || getMonthFromDate(inspection.date),
    }));

    // Combine mock data with submitted inspections
    const allInspections = [...mockInspections, ...submissionsWithMonth];

    // Remove duplicates by ID (in case of re-submissions)
    const uniqueMap = new Map<number, InspectionRecord>();
    allInspections.forEach((inspection) => {
      uniqueMap.set(inspection.id, inspection);
    });

    return Array.from(uniqueMap.values());
  });
  const [loading, setLoading] = useState(false);

  // Sorting hook
  const { handleSortClick, getSortIndicator, getSortedData } = useSortingTable(
    inspections,
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
    "date",
    "inspector",
    "status",
  ]);

  // Refresh inspections when page is focused or mounted
  useEffect(() => {
    const loadInspections = () => {
      const submissions = JSON.parse(
        localStorage.getItem("ftoSubmissions") || "[]",
      ) as InspectionRecord[];

      // Add month field to submissions if missing
      const submissionsWithMonth = submissions.map((inspection) => ({
        ...inspection,
        month: inspection.month || getMonthFromDate(inspection.date),
      }));

      // Combine mock data with submitted inspections
      const allInspections = [...mockInspections, ...submissionsWithMonth];

      // Remove duplicates by ID
      const uniqueMap = new Map<number, InspectionRecord>();
      allInspections.forEach((inspection) => {
        uniqueMap.set(inspection.id, inspection);
      });

      setInspections(Array.from(uniqueMap.values()));
    };

    // Load on mount
    loadInspections();

    // Listen for focus events to reload when user comes back to the tab
    window.addEventListener("focus", loadInspections);
    return () => window.removeEventListener("focus", loadInspections);
  }, []);

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
      key: "date",
      label: "Date",
      icon: <CalendarIcon width={16} height={16} />,
    },
    {
      key: "inspector",
      label: "Inspector",
      icon: <UserIcon width={16} height={16} />,
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
            <h1 className="text-2xl font-semibold text-gray-900">
              Property Inspections
            </h1>
          }
          rightContent={
            <BlueButton
              icon={<PlusIcon width={16} height={16} />}
              onClick={() => navigate("/fto/inspections/new")}
            >
              New Inspection
            </BlueButton>
          }
        />

        <GlobalTable
          columns={columns}
          data={inspections}
          rowKey="id"
          renderCell={(row, columnKey) => {
            switch (columnKey) {
              case "property":
                return <span className="text-gray-900 text-sm">{row.property}</span>;
              case "unit":
                return <span className="text-gray-900 text-sm">{row.unit}</span>;
              case "date":
                return <span className="text-gray-900 text-sm">{row.date}</span>;
              case "inspector":
                return <span className="text-gray-900 text-sm">{row.inspector}</span>;
              case "status":
                return (
                  <span
                    className={`text-sm px-2 py-1 rounded-full ${
                      row.status === "Completed"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {row.status}
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
              label: "View Inspection",
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
      </div>
    </PageTemplate>
  );
}
