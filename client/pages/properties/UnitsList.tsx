import { useEffect, useMemo, useState } from "react";
import {
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { usePageState } from "@/hooks/usePageState";
import { useSortingTable } from "@/hooks/useSortingTable";
import { useColumnManagement } from "@/hooks/useColumnManagement";
import ColumnFilterModal from "@/components/ColumnFilterModal";
import GlobalTable from "@/components/GlobalTable";
import AddUnitModal from "@/components/AddUnitModal";
import {
  BuildingIcon,
  DeleteIcon,
  EditIcon,
  PinIcon,
  PlusIcon,
  UserIcon,
} from "@/components/icons";
import PageHeader from "@/components/PageHeader";
import AddNoteModal from "@/components/AddNoteModal";
import AddFileModal from "@/components/AddFileModal";
import PdfViewerModal from "@/components/PdfViewerModal";
import {
  usePropertyDetailsState,
  type RecentFile,
  type RecentNote,
} from "@/hooks/usePropertyDetailsState";
import {
  FilesTemplate,
  NotesTemplate,
  SectionGroupCardTemplate,
  SectionRowTemplate,
} from "@/components/templates";
import { ModalButtons, ModalTemplate } from "@/components/ui/ModalTemplate";
import { FormLayout, FormSection } from "@/components/ui/form-layout";
import { fetchJSON } from "@/api/fetchJSON";


interface Unit {
  id: number;
  unitNumber: string;
  address: string;
  tenants: string[];
  propertyId: number;
}

interface UnitsListProps {
  propertyAddress: string;
  propertyType: string;
  propertyUnits: number;
}

// Mock API response shape
interface MockUnitApiResponse {
  id: number;
  property_id: number;
  buildium_unit_id: number | null;
  unit_name: string;
  address_1: string | null;
  owners: { name: string }[];
  created_at: string;
  updated_at: string;
}

// Mock API data (simulating GET /properties/{propertyId}/units)
const MOCK_UNITS_API_DATA: Record<number, MockUnitApiResponse[]> = {
  1: [
    {
      id: 1,
      property_id: 1,
      buildium_unit_id: 10001,
      unit_name: "1A",
      address_1: "113-115 Park Avenue, Suite 100",
      owners: [
        { name: "John Smith" },
        { name: "Sarah Johnson" },
      ],
      created_at: "2024-01-15T08:00:00Z",
      updated_at: "2024-01-15T08:00:00Z",
    },
    {
      id: 2,
      property_id: 1,
      buildium_unit_id: 10002,
      unit_name: "1B",
      address_1: "113-115 Park Avenue, Suite 101",
      owners: [
        { name: "Michael Chen" },
      ],
      created_at: "2024-01-15T08:00:00Z",
      updated_at: "2024-01-15T08:00:00Z",
    },
    {
      id: 3,
      property_id: 1,
      buildium_unit_id: 10003,
      unit_name: "2A",
      address_1: "113-115 Park Avenue, Suite 200",
      owners: [
        { name: "Emily Rodriguez" },
        { name: "David Harris" },
      ],
      created_at: "2024-01-15T08:00:00Z",
      updated_at: "2024-01-15T08:00:00Z",
    },
    {
      id: 4,
      property_id: 1,
      buildium_unit_id: 10004,
      unit_name: "2B",
      address_1: "113-115 Park Avenue, Suite 201",
      owners: [],
      created_at: "2024-01-15T08:00:00Z",
      updated_at: "2024-01-15T08:00:00Z",
    },
    {
      id: 5,
      property_id: 1,
      buildium_unit_id: 10005,
      unit_name: "3A",
      address_1: "113-115 Park Avenue, Suite 300",
      owners: [
        { name: "Jennifer Lee" },
      ],
      created_at: "2024-01-15T08:00:00Z",
      updated_at: "2024-01-15T08:00:00Z",
    },
  ],
};

/**
 * Mock API: GET /properties/{propertyId}/units
 * Transforms API response into UI Unit shape
 */
async function fetchUnitsByProperty(propertyId: number): Promise<Unit[]> {
  const data = await fetchJSON(
    `/properties/${propertyId}/units`,
  );

  // Transform API response → UI shape
  return data.map((item: any) => ({
    id: item.id,
    unitNumber: item.unit_name,
    address: item.address_1 || "",
    tenants: Array.isArray(item.owners)
      ? item.owners.map((owner: any) => owner.name)
      : [],
    propertyId: item.property_id,
  }));
}


const unitImage =
  "https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/b1dce1b4ec8292553f371f2747d334a444b1a4aa?placeholderIfAbsent=true";

export const UnitsList: React.FC<UnitsListProps> = ({
  propertyAddress,
  propertyType,
  propertyUnits,
}) => {
  const [unitsList, setUnitsList] = useState<Unit[]>([]);
  const [isLoadingUnits, setIsLoadingUnits] = useState(true);

  const navigate = useNavigate();
  const { propertyId } = useParams<{ propertyId: string }>();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Fetch units from mock API on mount or when propertyId changes
  useEffect(() => {
    const loadUnits = async () => {
      if (!propertyId) return;

      setIsLoadingUnits(true);
      try {
        const units = await fetchUnitsByProperty(Number(propertyId));
        setUnitsList(units);
      } catch (error) {
        console.error("Failed to load units:", error);
        setUnitsList([]);
      } finally {
        setIsLoadingUnits(false);
      }
    };

    loadUnits();
  }, [propertyId]);

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

  const [isAddUnitModalOpen, setIsAddUnitModalOpen] = usePageState(
    "isAddUnitModalOpen",
    false,
  );
  const [editingUnit, setEditingUnit] = usePageState<Unit | null>(
    "editingUnit",
    null,
  );

  const [showDeleteConfirm, setShowDeleteConfirm] = usePageState<number | null>(
    "showDeleteConfirm",
    null,
  );

  const selectedUnitId = searchParams.get("unit")
    ? Number.parseInt(searchParams.get("unit")!, 10)
    : null;

  const selectedUnit = selectedUnitId
    ? unitsList.find((u) => u.id === selectedUnitId)
    : null;

  const { state: unitState, dispatch: unitDispatch } =
    usePropertyDetailsState();

  useEffect(() => {
    const initialNotes: RecentNote[] = [
      {
        id: 1,
        text: "Tenant lease renewal coming up in 3 months",
        type: "RENTAL",
        date: "6/17/2024 10:32 AM",
        author: "Johan Gonazlez",
      },
      {
        id: 2,
        text: "Scheduled maintenance for HVAC unit",
        type: "RENTAL",
        date: "6/12/2024 2:31 PM",
        author: "Carteg Hughes",
      },
    ];

    const initialFiles: RecentFile[] = [
      {
        id: 1,
        name: "Unit Lease Agreement.pdf",
        category: "Lease Documents",
        date: "6/3/2025 2:06 PM",
        author: "Julia LoSchiavo",
        type: "pdf",
        icon: "https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/5ef69f3c3e2f3e3b15cc6139a16a94f848b10be7?placeholderIfAbsent=true",
        url: "https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/5ef69f3c3e2f3e3b15cc6139a16a94f848b10be7",
      },
      {
        id: 2,
        name: "Unit Move-in Inspection.docx",
        category: "Inspections",
        date: "5/19/2024 3:55 PM",
        author: "Carter Hughes",
        type: "docx",
        icon: "https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/07da6a33a78bd70b7170adaa97b3fb7b14ff2fc0?placeholderIfAbsent=true",
        url: "https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/07da6a33a78bd70b7170adaa97b3fb7b14ff2fc0",
      },
    ];

    unitDispatch({ type: "SET_RECENT_NOTES", notes: initialNotes });
    unitDispatch({ type: "SET_RECENT_FILES", files: initialFiles });
  }, [unitDispatch]);

  const { handleSortClick, getSortIndicator, getSortedData } = useSortingTable(
    unitsList,
    `units-${propertyId}`,
    { initialSortBy: "unitNumber", initialSortOrder: "asc" },
  );

  const columnManagement = useColumnManagement([
    "unitNumber",
    "address",
    "tenants",
  ]);

  const columnConfig: Record<string, { label: string; icon: React.ReactNode }> =
    useMemo(
      () => ({
        unitNumber: {
          label: "Unit",
          icon: <BuildingIcon width={16} height={16} color="#525252" />,
        },
        address: {
          label: "Address",
          icon: <PinIcon width={16} height={16} color="#525252" />,
        },
        tenants: {
          label: "Tenants",
          icon: <UserIcon width={16} height={16} color="#525252" />,
        },
      }),
      [],
    );

  const revokeBlobUrl = (url?: string) => {
    if (!url) return;
    if (url.startsWith("blob:")) {
      try {
        URL.revokeObjectURL(url);
      } catch {
        // ignore
      }
    }
  };

  const [viewingNote, setViewingNote] = useState<RecentNote | null>(null);
  const [isViewNoteOpen, setIsViewNoteOpen] = useState(false);

  const selectedNote = unitState.selection.noteId
    ? unitState.lists.recentNotes.find(
        (n) => n.id === unitState.selection.noteId,
      )
    : null;

  const selectedFile = unitState.selection.fileId
    ? unitState.lists.recentFiles.find(
        (f) => f.id === unitState.selection.fileId,
      )
    : null;

  const closeViewNoteModal = () => {
    setIsViewNoteOpen(false);
    setViewingNote(null);
  };

  const closeUnitDetailModals = () => {
    unitDispatch({ type: "CLOSE_MODAL" });
    unitDispatch({ type: "SELECT_NOTE", noteId: null });
    unitDispatch({ type: "SELECT_FILE", fileId: null });
    closeViewNoteModal();
  };

  const closeTableOverlays = () => {
    setShowPageSizeDropdown(false);
    setOpenMenuId(null);
    columnManagement.setShowColumnModal(false);
    setShowDeleteConfirm(null);
  };

  const closeUnitFormModal = () => {
    setIsAddUnitModalOpen(false);
    setEditingUnit(null);
  };

  const openUnitFormModal = (unit?: Unit) => {
    closeTableOverlays();
    closeUnitDetailModals();
    setEditingUnit(unit ?? null);
    setIsAddUnitModalOpen(true);
  };

  const openAddNoteModal = () => {
    closeTableOverlays();
    closeUnitFormModal();
    closeViewNoteModal();
    unitDispatch({ type: "OPEN_MODAL", modal: "addNote" });
  };

  const openAddFileModal = () => {
    closeTableOverlays();
    closeUnitFormModal();
    closeViewNoteModal();
    unitDispatch({ type: "OPEN_MODAL", modal: "addFile" });
  };

  const openViewFileModal = (fileId: number) => {
    closeTableOverlays();
    closeUnitFormModal();
    closeViewNoteModal();
    unitDispatch({ type: "SELECT_FILE", fileId });
    unitDispatch({ type: "OPEN_MODAL", modal: "viewFile" });
  };

  const openEditFileModal = (fileId: number) => {
    closeTableOverlays();
    closeUnitFormModal();
    closeViewNoteModal();
    unitDispatch({ type: "SELECT_FILE", fileId });
    unitDispatch({ type: "OPEN_MODAL", modal: "editFile" });
  };

  const openViewNoteModal = (note: RecentNote) => {
    closeTableOverlays();
    closeUnitFormModal();
    unitDispatch({ type: "CLOSE_MODAL" });
    setViewingNote(note);
    setIsViewNoteOpen(true);
  };

  const handleOpenAddModal = () => {
    openUnitFormModal();
  };

  const handleDeleteUnit = (unit: Unit) => {
    closeTableOverlays();
    closeUnitDetailModals();
    closeUnitFormModal();
    setShowDeleteConfirm(unit.id);
  };

  const confirmDelete = () => {
    if (showDeleteConfirm) {
      setUnitsList((prev) => prev.filter((u) => u.id !== showDeleteConfirm));
      setShowDeleteConfirm(null);
    }
  };

  const handleAddUnit = (newUnit: Unit) => {
    if (editingUnit) {
      setUnitsList((prev) =>
        prev.map((u) => (u.id === newUnit.id ? newUnit : u)),
      );
    } else {
      setUnitsList((prev) => [...prev, newUnit]);
    }
    setIsAddUnitModalOpen(false);
    setEditingUnit(null);
  };

  const selectUnit = (unit: Unit) => {
    closeTableOverlays();
    closeUnitDetailModals();
    closeUnitFormModal();
    navigate(`${location.pathname}?unit=${unit.id}`);
  };

  const deselectUnit = () => {
    closeTableOverlays();
    closeUnitDetailModals();
    closeUnitFormModal();
    navigate(location.pathname);
  };

  useEffect(() => {
    if (selectedUnit) {
      setShowPageSizeDropdown(false);
      setOpenMenuId(null);
      columnManagement.setShowColumnModal(false);
    }
  }, [selectedUnit, selectedUnitId, columnManagement]);

  useEffect(() => {
    if (selectedUnitId && !selectedUnit) {
      closeTableOverlays();
      closeUnitDetailModals();
      closeUnitFormModal();
      navigate(location.pathname, { replace: true });
    }
  }, [selectedUnitId, selectedUnit, location.pathname]);


  useEffect(() => {
    const loadUnits = async () => {
      if (!propertyId) return;
  
      setIsLoadingUnits(true);
      try {
        const units = await fetchUnitsByProperty(Number(propertyId));
        setUnitsList(units);
      } catch (error) {
        console.error("Failed to load units:", error);
        setUnitsList([]);
      } finally {
        setIsLoadingUnits(false);
      }
    };
  
    loadUnits();
  }, [propertyId]);
  
  return (
    <>
      <div
        className={
          selectedUnit
            ? "flex justify-center font-[Geist,-apple-system,Roboto,Helvetica,sans-serif]"
            : "flex flex-col gap-6"
        }
      >
        {selectedUnit ? (
          <div className="flex flex-col w-full min-w-[240px]">
            <SectionGroupCardTemplate>
              <SectionRowTemplate isLast={false}>
                <div className="flex flex-col w-full font-medium">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <PageHeader title="Unit Details" />
                    <button
                      onClick={() => openUnitFormModal(selectedUnit)}
                      className="flex items-center gap-2 text-[#1357D5] font-medium text-sm hover:underline transition-colors bg-none border-none cursor-pointer p-0"
                    >
                      <EditIcon width={16} height={16} color="#1357D5" />
                      Edit
                    </button>
                  </div>

                  <div className="flex mt-3 w-full items-start gap-4 flex-wrap">
                    <img
                      loading="lazy"
                      srcSet={`${unitImage}&width=100 100w, ${unitImage}&width=200 200w, ${unitImage}&width=400 400w`}
                      src={unitImage}
                      className="rounded-lg min-w-[240px] w-[273px] aspect-[1.57] object-cover"
                      alt="Unit"
                    />
                    <div className="flex min-w-[240px] min-h-[160px] flex-col justify-center flex-1">
                      <div className="flex flex-col w-full max-w-[423px]">
                        <div className="text-[#71717A] text-xs leading-[1.33]">
                          ADDRESS
                        </div>
                        <div className="text-[#303030] text-base leading-[1.13] mt-1">
                          <div>
                            {selectedUnit.address} - {selectedUnit.unitNumber}
                          </div>
                        </div>
                      </div>

                      <div className="flex mt-5 w-full items-start gap-14 flex-1">
                        <div className="flex flex-col">
                          <div className="text-[#71717A] text-xs leading-[1.33]">
                            TENANTS
                          </div>
                          <div className="flex flex-col self-start mt-1 gap-1 text-base text-[#303030] leading-[1.13]">
                            {selectedUnit.tenants.length > 0 ? (
                              selectedUnit.tenants.map((tenant, idx) => (
                                <div key={idx}>{tenant}</div>
                              ))
                            ) : (
                              <span className="text-[#A0A0A0]">
                                No tenants assigned
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </SectionRowTemplate>

              <NotesTemplate
                notes={unitState.lists.recentNotes}
                onAdd={openAddNoteModal}
                onEdit={openViewNoteModal}
                onDelete={(noteId) => {
                  closeTableOverlays();
                  closeUnitFormModal();
                  closeViewNoteModal();
                  unitDispatch({ type: "DELETE_NOTE", noteId });
                }}
                isLast={false}
                emptyMessage="You don't have any notes for this unit right now."
              />

              <FilesTemplate
                files={unitState.lists.recentFiles}
                onAdd={openAddFileModal}
                onEdit={(file) => openEditFileModal(file.id)}
                onDelete={(fileId) => {
                  closeTableOverlays();
                  closeUnitFormModal();
                  closeViewNoteModal();
                  const fileToDelete = unitState.lists.recentFiles.find(
                    (f) => f.id === fileId,
                  );
                  revokeBlobUrl(fileToDelete?.url);
                  unitDispatch({ type: "DELETE_FILE", fileId });
                }}
                onView={(file) => openViewFileModal(file.id)}
                isLast={true}
                emptyMessage="You don't have any files for this unit right now."
              />
            </SectionGroupCardTemplate>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-10 justify-between flex-wrap">
              <div className="flex flex-col gap-1 min-w-[240px]">
                <h1 className="text-[#303030] font-semibold text-2xl leading-[30px]">
                  Units
                </h1>
                <div className="flex items-center gap-3 mt-1">
                  <p
                    className="text-[#717179] font-medium text-base leading-4"
                    style={{ marginTop: "-4px" }}
                  >
                    {unitsList.length} unit{unitsList.length !== 1 ? "s" : ""}{" "}
                    for {propertyAddress}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {/* <button
                  onClick={handleOpenAddModal}
                  className="flex h-9 items-center gap-2 px-3 rounded-lg border border-white bg-[#013764] shadow-[0_0_0_1px_#002D5A] hover:bg-[#003a73] transition-colors"
                >
                  <PlusIcon width={20} height={20} className="text-white" />
                  <span className="text-white font-medium text-base leading-normal">
                    Add unit
                  </span>
                </button> */}
              </div>
            </div>

            <GlobalTable
              columns={[
                {
                  key: "unitNumber",
                  label: "Unit",
                  icon: columnConfig.unitNumber.icon,
                },
                {
                  key: "address",
                  label: "Address",
                  icon: columnConfig.address.icon,
                },
                {
                  key: "tenants",
                  label: "Tenants",
                  icon: columnConfig.tenants.icon,
                },
              ]}
              data={unitsList}
              rowKey="id"
              actions={[
                {
                  label: "View Unit",
                  icon: <EditIcon width={18} height={18} color="#525252" />,
                  onClick: (unit: Unit) => {
                    selectUnit(unit);
                  },
                },
                {
                  label: "Delete",
                  icon: <DeleteIcon width={18} height={18} color="#982740" />,
                  onClick: (unit: Unit) => {
                    handleDeleteUnit(unit);
                  },
                },
              ]}
              renderCell={(unit: Unit, columnKey: string) => {
                switch (columnKey) {
                  case "unitNumber":
                    return (
                      <span className="text-gray-900 font-normal text-sm truncate">
                        {unit.unitNumber}
                      </span>
                    );
                  case "address":
                    return (
                      <span className="text-gray-900 font-normal text-sm truncate">
                        {unit.address}
                      </span>
                    );
                  case "tenants":
                    return (
                      <div className="flex flex-wrap gap-2">
                        {unit.tenants.length > 0 ? (
                          unit.tenants.map((tenant) => (
                            <span
                              key={tenant}
                              className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {tenant}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-500 text-sm">
                            No tenants
                          </span>
                        )}
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
              columnManagementHook={columnManagement}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
              onItemsPerPageChange={setItemsPerPage}
              showPageSizeDropdown={showPageSizeDropdown}
              onShowPageSizeDropdownChange={setShowPageSizeDropdown}
              openMenuId={openMenuId}
              onOpenMenuIdChange={setOpenMenuId}
              title="Units"
              showColumnModal={columnManagement.showColumnModal}
              onShowColumnModalChange={columnManagement.setShowColumnModal}
              // onRowClick={(unit: Unit) => {
              //   selectUnit(unit);
              // }}
              headerActions={
                <button
                  ref={columnManagement.columnButtonRef}
                  onClick={() => {
                    closeUnitDetailModals();
                    closeUnitFormModal();
                    setShowDeleteConfirm(null);
                    setShowPageSizeDropdown(false);
                    setOpenMenuId(null);
                    columnManagement.setShowColumnModal((prev) => !prev);
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
                    <circle cx="8" cy="3" r="1.5" fill="#303030" />
                    <circle cx="8" cy="8" r="1.5" fill="#303030" />
                    <circle cx="8" cy="13" r="1.5" fill="#303030" />
                  </svg>
                </button>
              }
            />
          </>
        )}
      </div>

      <PdfViewerModal
        open={unitState.activeModal === "viewFile"}
        onOpenChange={(open) => {
          if (!open) unitDispatch({ type: "CLOSE_MODAL" });
        }}
        title={selectedFile?.name || "File Preview"}
        url={selectedFile?.url}
      />

      <AddNoteModal
        open={
          unitState.activeModal === "addNote" ||
          unitState.activeModal === "editNote"
        }
        onOpenChange={(open) => {
          if (!open) unitDispatch({ type: "CLOSE_MODAL" });
        }}
        isEditMode={unitState.activeModal === "editNote"}
        initialText={selectedNote?.text || ""}
        onSubmit={(noteText) => {
          const now = new Date();
          const date = now.toLocaleString(undefined, {
            month: "numeric",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
          });

          if (unitState.activeModal === "editNote" && selectedNote) {
            unitDispatch({
              type: "UPDATE_NOTE",
              noteId: selectedNote.id,
              text: noteText,
              date,
            });
          } else {
            const nextId = unitState.lists.recentNotes.length
              ? Math.max(...unitState.lists.recentNotes.map((n) => n.id)) + 1
              : 1;

            unitDispatch({
              type: "ADD_NOTE",
              note: {
                id: nextId,
                text: noteText,
                type: "RENTAL",
                date,
                author: "Current User",
              },
            });
          }
          unitDispatch({ type: "CLOSE_MODAL" });
        }}
      />

      <ModalTemplate
        open={isViewNoteOpen}
        onOpenChange={(open) => {
          setIsViewNoteOpen(open);
          if (!open) setViewingNote(null);
        }}
        title="Note Details"
        size="sm"
        footer={
          <ModalButtons
            onCancel={() => {
              closeViewNoteModal();
            }}
            onConfirm={() => {
              if (viewingNote) {
                closeViewNoteModal();
                unitDispatch({ type: "SELECT_NOTE", noteId: viewingNote.id });
                unitDispatch({ type: "OPEN_MODAL", modal: "editNote" });
              }
            }}
            cancelLabel="Close"
            confirmLabel="Edit"
          />
        }
      >
        {viewingNote ? (
          <FormLayout>
            <FormSection showDivider={false}>
              <div className="text-[#303030] whitespace-pre-line p-3 bg-gray-50 rounded-lg">
                {viewingNote.text}
              </div>
              <div className="text-sm text-[#71717A]">
                <span className="font-medium">Author:</span>{" "}
                {viewingNote.author}
              </div>
              <div className="text-sm text-[#71717A]">
                <span className="font-medium">Date:</span> {viewingNote.date}
              </div>
            </FormSection>
          </FormLayout>
        ) : null}
      </ModalTemplate>

      <AddFileModal
        open={
          unitState.activeModal === "addFile" ||
          unitState.activeModal === "editFile"
        }
        onOpenChange={(open) => {
          if (!open) unitDispatch({ type: "CLOSE_MODAL" });
        }}
        isEditMode={unitState.activeModal === "editFile"}
        initialFiles={
          unitState.activeModal === "editFile" && selectedFile
            ? [
                {
                  id: String(selectedFile.id),
                  name: selectedFile.name,
                  size: 0,
                  type: selectedFile.type || "",
                  url: selectedFile.url,
                },
              ]
            : []
        }
        initialCategory={
          unitState.activeModal === "editFile" && selectedFile
            ? selectedFile.category || ""
            : ""
        }
        initialDescription={
          unitState.activeModal === "editFile" && selectedFile
            ? selectedFile.description || ""
            : ""
        }
        acceptedFormats=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.txt,.csv"
        onSubmit={(uploadedFiles, category, description) => {
          if (unitState.activeModal === "editFile" && selectedFile) {
            unitDispatch({
              type: "UPDATE_FILE",
              fileId: selectedFile.id,
              category,
              description,
            });
          } else {
            const blobUrl = URL.createObjectURL(uploadedFiles[0].file!);
            const now = new Date();
            const date = now.toLocaleString(undefined, {
              month: "numeric",
              day: "numeric",
              year: "numeric",
              hour: "numeric",
              minute: "2-digit",
            });

            const fileName = uploadedFiles[0].name;
            const ext = fileName.split(".").pop()?.toLowerCase() || "";
            const docIcon =
              "https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/07da6a33a78bd70b7170adaa97b3fb7b14ff2fc0?placeholderIfAbsent=true";
            const pdfIcon =
              "https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/5ef69f3c3e2f3e3b15cc6139a16a94f848b10be7?placeholderIfAbsent=true";
            const icon = ext === "doc" || ext === "docx" ? docIcon : pdfIcon;

            const nextId = unitState.lists.recentFiles.length
              ? Math.max(...unitState.lists.recentFiles.map((f) => f.id)) + 1
              : 1;

            unitDispatch({
              type: "ADD_FILE",
              file: {
                id: nextId,
                name: fileName,
                category,
                date,
                author: "Current User",
                type: ext || "file",
                icon,
                url: blobUrl,
                description,
              },
            });
          }
          unitDispatch({ type: "CLOSE_MODAL" });
        }}
      />

      <ColumnFilterModal
        isOpen={columnManagement.showColumnModal}
        position={columnManagement.columnMenuPos}
        columns={columnManagement.columnOrder.map((key) => ({
          key,
          label: columnConfig[key]?.label || key,
          icon: columnConfig[key]?.icon,
        }))}
        visibleColumns={columnManagement.visibleColumns}
        onToggleColumn={columnManagement.toggleColumnVisibility}
        onClose={() => columnManagement.setShowColumnModal(false)}
        buttonRef={columnManagement.columnButtonRef}
      />

      <ModalTemplate
        open={showDeleteConfirm !== null}
        onOpenChange={(open) => {
          if (!open) setShowDeleteConfirm(null);
        }}
        title="Delete Unit"
        size="sm"
        footer={
          <>
            <button
              onClick={() => setShowDeleteConfirm(null)}
              style={{
                borderRadius: "8px",
                backgroundColor: "rgba(251, 251, 251, 1)",
                boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.03)",
                borderColor: "rgba(218, 218, 218, 1)",
                borderStyle: "solid",
                borderWidth: "1px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                paddingLeft: "12px",
                paddingRight: "12px",
                paddingTop: "8px",
                paddingBottom: "8px",
                minHeight: "36px",
                color: "rgba(48, 48, 48, 1)",
                fontWeight: 400,
                letterSpacing: "-0.32px",
                lineHeight: 1.4,
                justifyContent: "center",
                cursor: "pointer",
                fontFamily:
                  "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                fontSize: "16px",
                whiteSpace: "nowrap",
              }}
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              style={{
                borderRadius: "8px",
                backgroundColor: "#982740",
                border: "1px solid rgba(255, 255, 255, 1)",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                paddingLeft: "12px",
                paddingRight: "12px",
                paddingTop: "8px",
                paddingBottom: "8px",
                minHeight: "36px",
                color: "rgba(255, 255, 255, 1)",
                fontWeight: 500,
                letterSpacing: "-0.32px",
                lineHeight: 1.4,
                justifyContent: "center",
                cursor: "pointer",
                fontFamily:
                  "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                fontSize: "16px",
                whiteSpace: "nowrap",
                boxShadow: "0px 0px 0px 1px rgba(152, 39, 64, 0.5)",
                transition: "background-color 0.2s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "#7a1f31")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "#982740")
              }
            >
              Delete
            </button>
          </>
        }
      >
        <FormLayout>
          <FormSection showDivider={false}>
            <p
              style={{
                fontFamily:
                  "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                fontSize: "14px",
                color: "rgba(48, 48, 48, 1)",
                fontWeight: 400,
                lineHeight: 1.43,
              }}
            >
              Are you sure you want to delete this unit? This action cannot be
              undone.
            </p>
          </FormSection>
        </FormLayout>
      </ModalTemplate>

      <AddUnitModal
        open={isAddUnitModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setEditingUnit(null);
          }
          setIsAddUnitModalOpen(open);
        }}
        editData={editingUnit || undefined}
        onSubmit={handleAddUnit}
        propertyAddress={propertyAddress}
        propertyId={propertyId ? Number.parseInt(propertyId, 10) : 1}
      />
    </>
  );
};
