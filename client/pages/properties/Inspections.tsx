import { useState, useCallback, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { usePageState } from "@/hooks/usePageState";
import { useSortingTable } from "@/hooks/useSortingTable";
import { useColumnManagement } from "@/hooks/useColumnManagement";
import GlobalTable from "@/components/GlobalTable";
import BlueButton from "@/components/BlueButton";
import PersonAvatars from "@/components/PersonAvatars";
import InspectionDetail from "./InspectionDetail";
import ScheduleInspectionModal from "./ScheduleInspectionModal";
import AddTemplateModal from "./AddTemplateModal";
import {
  listInspections,
  listInspectionPhotos,
  createInspection,
  listChecklists,
  createChecklist,
  deleteInspection,
  BackendInspection,
  BackendInspectionChecklist,
} from "@/api/inspections";
import { fetchJSON } from "@/api/fetchJSON";
import { useAuth } from "@/auth/useAuth";
import { DEFAULT_INSPECTION_TEMPLATES } from "@/data/inspections";
import {
  EditIcon,
  DeleteIcon,
  PlusIcon,
  DotsIcon,
  CalendarIcon,
  UserIcon,
  ApproveIcon,
  ArrowBackIcon,
} from "@/components/icons";

export interface FieldManager {
  id: number;
  name: string;
  initials: string;
  email?: string;
}

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
  status: "Submitted" | "Outstanding" | "Completed" | "Upcoming" | "In Progress";
  issues: number;
  photos: number;
  updated: string;
  templateName: string;
  checklist_id?: number;
}

interface InspectionsProps {
  propertyAddress?: string;
  propertyType?: string;
  propertyUnits?: number;
}

const mockFieldManagers: FieldManager[] = [
  { id: 1, name: "John Doe", initials: "JD", email: "john.doe@company.com" },
  { id: 2, name: "Jane Smith", initials: "JS", email: "jane.smith@company.com" },
  { id: 3, name: "Mike Johnson", initials: "MJ", email: "mike.johnson@company.com" },
  { id: 4, name: "Sarah Williams", initials: "SW", email: "sarah.williams@company.com" },
  { id: 5, name: "Robert Brown", initials: "RB", email: "robert.brown@company.com" },
];

const mockInspections: Inspection[] = [
  {
    id: 1,
    name: "Quarterly Building Inspection",
    inspector: { id: 1, name: "John Doe", initials: "JD", email: "john.doe@company.com" },
    inspectionDate: "Oct 15, 2025",
    submitted: "Oct 16, 2025",
    status: "Completed",
    issues: 2,
    photos: 12,
    updated: "Oct 17, 2025",
    templateName: "Default Template",
  },
  {
    id: 2,
    name: "HVAC System Inspection",
    inspector: { id: 2, name: "Jane Smith", initials: "JS", email: "jane.smith@company.com" },
    inspectionDate: "Oct 10, 2025",
    submitted: "Oct 11, 2025",
    status: "Outstanding",
    issues: 1,
    photos: 8,
    updated: "Oct 12, 2025",
    templateName: "HVAC Inspection",
  },
  {
    id: 3,
    name: "Roof and Gutters Inspection",
    inspector: { id: 3, name: "Mike Johnson", initials: "MJ", email: "mike.johnson@company.com" },
    inspectionDate: "Oct 5, 2025",
    submitted: "Oct 6, 2025",
    status: "Outstanding",
    issues: 4,
    photos: 15,
    updated: "Oct 8, 2025",
    templateName: "Default Template",
  },
  {
    id: 4,
    name: "Foundation and Structural Inspection",
    inspector: { id: 1, name: "John Doe", initials: "JD", email: "john.doe@company.com" },
    inspectionDate: "Sep 25, 2025",
    submitted: "Sep 26, 2025",
    status: "Completed",
    issues: 0,
    photos: 10,
    updated: "Sep 27, 2025",
    templateName: "Default Template",
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
    templateName: "Plumbing Inspection",
  },
];

function InspectionsList({ propertyAddress }: InspectionsProps) {
  const navigate = useNavigate();
  const { propertyId } = useParams();
  const { userId } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [inspectionsList, setInspectionsList] = useState<Inspection[]>([]);
  const inspectionIdFromUrl = searchParams.get("inspectionId");
  const [selectedInspectionId, setSelectedInspectionId] = useState<number | null>(
    inspectionIdFromUrl ? Number(inspectionIdFromUrl) : null
  );
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showAddTemplateModal, setShowAddTemplateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fieldManagers, setFieldManagers] = useState<FieldManager[]>(mockFieldManagers);
  const [templates, setTemplates] = useState<BackendInspectionChecklist[]>([]);
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
    "status",
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
        "status",
        "photos",
        "updated",
      ]),
    );
  }, [setVisibleColumns]);

  // Helper function to compute initials from name
  const computeInitials = (name: string): string => {
    if (!name) return "?";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Fetch inspections, field managers, and templates on mount
  useEffect(() => {
    async function loadData() {
      if (!propertyId) return;

      try {
        setLoading(true);
        
        // Fetch inspections (backend returns all; we filter client-side for now)
        const backendInspections = await listInspections();
        
        // Fetch field team members
        const fieldTeamData = await fetchJSON("/users/field-team");
        const managers: FieldManager[] = fieldTeamData.map((user: any) => {
          const fullName = user.name || `${user.first_name} ${user.last_name}`;
          return {
            id: user.id,
            name: fullName,
            initials: user.initials || `${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`.toUpperCase() || computeInitials(fullName),
            email: user.email,
          };
        });
        setFieldManagers(managers);

        // Fetch available templates/checklists
        const checklistsData = await listChecklists(Number(propertyId));
        // Debugging log removed
        setTemplates(checklistsData);

        // Filter to this property's inspections
        const filtered = backendInspections.filter(
          (bi) => bi.property_id === Number(propertyId)
        );
        // Fetch photo counts in parallel
        const photoCounts = await Promise.all(
          filtered.map((bi) =>
            listInspectionPhotos(bi.id).then((photos) => photos.length)
          )
        );

        // Transform backend inspections to UI format
        const uiInspections: Inspection[] = filtered.map((bi, index) => {
          const assignedManager = managers.find((m) => m.id === bi.assigned_field_team_member_id);
          const checklist = checklistsData.find((c) => c.id === bi.checklist_id);
          
          // Ensure inspector has proper initials
          let inspector = assignedManager || { id: 0, name: "Unassigned", initials: "?" };
          if (assignedManager && !assignedManager.initials) {
            inspector = {
              ...assignedManager,
              initials: computeInitials(assignedManager.name)
            };
          }
          
          return {
            id: bi.id,
            name: `Inspection ${bi.id}`, // Backend doesn't have name; we'll fix this
            inspector,
            inspectionDate: bi.due_date ? new Date(bi.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—",
            submitted: "", // Backend doesn't track submitted date yet
            status: bi.status as any, // "In Progress" | "Completed"
            issues: 0, // Not tracked yet
            photos: photoCounts[index] ?? 0,
            updated: new Date(bi.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
            templateName: checklist?.name || "Default Template",
            checklist_id: bi.checklist_id,
          };
        });

        setInspectionsList(uiInspections);
      } catch (error) {
        console.error("Failed to load inspections:", error);
        setInspectionsList([]);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [propertyId]);

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

  const handleDeleteInspection = useCallback(async (inspection: Inspection) => {
    if (!window.confirm(`Are you sure you want to delete "${inspection.name}"?`)) return;
    try {
      await deleteInspection(inspection.id);
      setInspectionsList((prev) => prev.filter((i) => i.id !== inspection.id));
    } catch (error) {
      console.error("Failed to delete inspection:", error);
      alert("Failed to delete inspection. Please try again.");
    }
  }, []);

  const handleEditInspection = useCallback((inspection: Inspection) => {
    setSelectedInspectionId(inspection.id);
  }, []);

  const handleViewInspection = useCallback((inspection: Inspection) => {
    setSelectedInspectionId(inspection.id);
  }, []);

  const handleMarkAsComplete = useCallback((inspection: Inspection) => {
    setInspectionsList((prev) =>
      prev.map((i) =>
        i.id === inspection.id ? { ...i, status: "Completed" as const } : i
      )
    );
  }, []);

  const handleScheduleInspection = useCallback(async (fieldManager: FieldManager, fullDate: string, templateName: string, inspectionName: string) => {
    if (!propertyId || !userId) return;

    try {
      // 1. Find or create checklist for this template
      const existingChecklists = await listChecklists(Number(propertyId));
      let checklistId: number;

      const existingChecklist = existingChecklists.find((c) => c.name === templateName);
      if (existingChecklist) {
        checklistId = existingChecklist.id;
      } else {
        // Create new checklist from template
        const template = DEFAULT_INSPECTION_TEMPLATES.find((t) => t.name === templateName);
        const checklistJson = template ? { sections: template.sections } : { sections: [] };
        
        const newChecklist = await createChecklist({
          property_id: Number(propertyId),
          name: templateName,
          checklist_json: checklistJson,
          created_by_type: "user",
          created_by_id: userId,
          is_active: true,
        });
        checklistId = newChecklist.id;
        
        // Add the new checklist to templates list
        setTemplates((prev) => [...prev, newChecklist]);
      }

      // 2. Create inspection
      const dueDate = new Date(fullDate);
      const backendInspection = await createInspection({
        property_id: Number(propertyId),
        unit_id: null,
        checklist_id: checklistId,
        assigned_field_team_member_id: fieldManager.id,
        status: "In Progress",
        due_date: dueDate.toISOString(),
      });

      // 3. Add to UI list
      const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      const newInspection: Inspection = {
        id: backendInspection.id,
        name: inspectionName,
        inspector: fieldManager,
        inspectionDate: fullDate,
        submitted: "",
        status: "In Progress",
        issues: 0,
        photos: 0,
        updated: today,
        templateName,
      };

      setInspectionsList((prev) => [newInspection, ...prev]);
      setShowScheduleModal(false);
    } catch (error) {
      console.error("Failed to schedule inspection:", error);
      alert("Failed to schedule inspection. Please try again.");
    }
  }, [propertyId, userId]);

  const actions = [
    {
      label: "View Inspection",
      icon: <EditIcon width={18} height={18} />,
      onClick: handleViewInspection,
    },
    {
      label: "Mark as Complete",
      icon: <ApproveIcon width={18} height={18} />,
      onClick: handleMarkAsComplete,
    },
    {
      label: "Delete Inspection",
      icon: <DeleteIcon width={18} height={18} />,
      onClick: handleDeleteInspection,
    },
  ];

  /** Format backend status (e.g. in_progress) to display (e.g. "In Progress"). */
  const formatInspectionStatus = (status: string): string => {
    return status
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "draft":
        return "#6b7280";
      case "scheduled":
        return "#8b5cf6";
      case "in_progress":
        return "#2463eb";
      case "submitted":
        return "#2463eb";
      case "reviewed":
        return "#059669";
      case "cancelled":
        return "#9ca3af";
      default:
        return "#525252";
    }
  };

  if (selectedInspectionId) {
    const selectedInspection = inspectionsList.find(i => i.id === selectedInspectionId);

    return (
      <div className="flex flex-col gap-6 w-full">
        {/* Inspection Detail - Inline */}
        <InspectionDetail
          inspectionId={selectedInspectionId}
          inspection={selectedInspection}
          isInline={true}
          templateName={selectedInspection?.templateName}
          onBack={() => setSelectedInspectionId(null)}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-full">
      {/* Schedule Inspection Modal */}
      <ScheduleInspectionModal
        open={showScheduleModal}
        onOpenChange={setShowScheduleModal}
        fieldManagers={fieldManagers}
        templates={templates}
        onConfirm={handleScheduleInspection}
      />

      {/* Add Template Modal */}
      {propertyId && userId != null && (
        <AddTemplateModal
          open={showAddTemplateModal}
          onOpenChange={setShowAddTemplateModal}
          propertyId={Number(propertyId)}
          userId={userId}
          onConfirm={(created) => {
            setTemplates((prev) => [...prev, created]);
          }}
        />
      )}

      <div className="flex items-center gap-10 justify-between flex-wrap">
        {/* Title and Description */}
        <div className="flex flex-col gap-1 min-w-[240px]">
          <h1 className="text-[#303030] font-semibold text-2xl leading-[30px]">
            Inspections
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <p
              className="text-[#717179] font-medium text-base leading-4"
              style={{ marginTop: "-4px" }}
            >
              All inspections for {propertyAddress}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowAddTemplateModal(true)}
            disabled={!propertyId || userId == null}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add Template
          </button>
          <BlueButton
            icon={<PlusIcon width={20} height={20} />}
            onClick={() => setShowScheduleModal(true)}
          >
            New Inspection
          </BlueButton>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-gray-500">Loading inspections...</p>
        </div>
      ) : (
        <GlobalTable
          columns={columns}
          data={inspectionsList}
          rowKey="id"
          onRowClick={(inspection) => {
            setSelectedInspectionId(inspection.id);
          }}
          renderCell={(inspection, columnKey) => {
            if (columnKey === "name") {
              return (
                <span className="text-gray-900 font-normal text-sm truncate">
                  {inspection.name}
                </span>
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
            if (columnKey === "status") {
              return (
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: getStatusColor(inspection.status) }}
                  />
                  <span className="text-gray-900 font-normal text-sm">
                    {formatInspectionStatus(inspection.status)}
                  </span>
                </div>
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
      )}
    </div>
  );
}

export default function Inspections(props: InspectionsProps) {
  return <InspectionsList {...props} />;
}
