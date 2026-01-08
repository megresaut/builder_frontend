import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { usePageState } from "@/hooks/usePageState";
import { useSortingTable } from "@/hooks/useSortingTable";
import { useColumnManagement } from "@/hooks/useColumnManagement";
import ColumnFilterModal from "@/components/ColumnFilterModal";
import GlobalTable from "@/components/GlobalTable";
import AddUnitModal from "@/components/AddUnitModal";
import { EditIcon, DeleteIcon, BuildingIcon, PinIcon, UserIcon, PlusIcon, ArrowBackIcon } from "@/components/icons";
import PageHeader from "@/components/PageHeader";
import AddNoteModal from "@/components/AddNoteModal";
import AddFileModal from "@/components/AddFileModal";
import PdfViewerModal from "@/components/PdfViewerModal";
import { usePropertyDetailsState, type RecentNote, type RecentFile } from "@/hooks/usePropertyDetailsState";
import { SectionRowTemplate, SectionGroupCardTemplate, NotesTemplate, FilesTemplate } from "@/components/templates";
import { ModalTemplate, ModalButtons } from "@/components/ui/ModalTemplate";
import { FormLayout, FormSection } from "@/components/ui/form-layout";

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

const mockUnits: Unit[] = [
  {
    id: 1,
    unitNumber: "1A",
    address: "113-115 Park Avenue, Suite 100",
    tenants: ["John Smith", "Sarah Johnson"],
    propertyId: 1,
  },
  {
    id: 2,
    unitNumber: "1B",
    address: "113-115 Park Avenue, Suite 101",
    tenants: ["Michael Chen"],
    propertyId: 1,
  },
  {
    id: 3,
    unitNumber: "2A",
    address: "113-115 Park Avenue, Suite 200",
    tenants: ["Emily Rodriguez", "David Harris"],
    propertyId: 1,
  },
  {
    id: 4,
    unitNumber: "2B",
    address: "113-115 Park Avenue, Suite 201",
    tenants: [],
    propertyId: 1,
  },
  {
    id: 5,
    unitNumber: "3A",
    address: "113-115 Park Avenue, Suite 300",
    tenants: ["Jennifer Lee"],
    propertyId: 1,
  },
];

const unitImage =
  "https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/b1dce1b4ec8292553f371f2747d334a444b1a4aa?placeholderIfAbsent=true";

export const UnitsList: React.FC<UnitsListProps> = ({
  propertyAddress,
  propertyType,
  propertyUnits,
}) => {
  const [unitsList, setUnitsList] = useState<Unit[]>(mockUnits);
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
  const [selectedUnitId, setSelectedUnitId] = usePageState<number | null>(
    "selectedUnitId",
    null,
  );

  const navigate = useNavigate();
  const { propertyId } = useParams<{ propertyId: string }>();

  // Initialize notes and files for unit overview
  const { state: unitState, dispatch: unitDispatch } = usePropertyDetailsState();

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
  );

  const columnManagement = useColumnManagement(["unitNumber", "address", "tenants"]);

  const columnConfig: Record<string, { label: string; icon: React.ReactNode }> = {
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
  };

  const handleOpenAddModal = () => {
    setEditingUnit(null);
    setIsAddUnitModalOpen(true);
  };

  const handleEditUnit = (unit: Unit) => {
    setEditingUnit(unit);
    setIsAddUnitModalOpen(true);
  };

  const handleDeleteUnit = (unit: Unit) => {
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

  const selectedUnit = selectedUnitId
    ? unitsList.find((u) => u.id === selectedUnitId)
    : null;

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

  const selectedNote = unitState.selection.noteId
    ? unitState.lists.recentNotes.find((n) => n.id === unitState.selection.noteId)
    : null;

  const selectedFile = unitState.selection.fileId
    ? unitState.lists.recentFiles.find((f) => f.id === unitState.selection.fileId)
    : null;

  // Close any open dropdowns when switching to unit overview
  useEffect(() => {
    if (selectedUnit) {
      setShowPageSizeDropdown(false);
      setOpenMenuId(null);
    }
  }, [selectedUnitId]);

  // Show unit overview when a unit is selected
  if (selectedUnit) {
    return (
      <>
        <div className="flex justify-center font-[Geist,-apple-system,Roboto,Helvetica,sans-serif]">
          <div className="flex flex-col w-full min-w-[240px]">
            <SectionGroupCardTemplate>
              {/* Unit Details Section */}
              <SectionRowTemplate isLast={false}>
                <div className="flex flex-col w-full font-medium">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <PageHeader title="Unit Details" />
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
                          <div>{selectedUnit.address} - {selectedUnit.unitNumber}</div>
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
                              <span className="text-[#A0A0A0]">No tenants assigned</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </SectionRowTemplate>

              {/* Recent Notes Section */}
              <NotesTemplate
                notes={unitState.lists.recentNotes}
                onAdd={() => unitDispatch({ type: "OPEN_MODAL", modal: "addNote" })}
                onEdit={(note) => {
                  setViewingNote(note);
                  unitDispatch({ type: "OPEN_MODAL", modal: "viewNote" });
                }}
                onDelete={(noteId) => unitDispatch({ type: "DELETE_NOTE", noteId })}
                isLast={false}
                emptyMessage="You don't have any notes for this unit right now."
              />

              {/* Recent Files Section */}
              <FilesTemplate
                files={unitState.lists.recentFiles}
                onAdd={() => unitDispatch({ type: "OPEN_MODAL", modal: "addFile" })}
                onEdit={(file) => {
                  unitDispatch({ type: "SELECT_FILE", fileId: file.id });
                  unitDispatch({ type: "OPEN_MODAL", modal: "editFile" });
                }}
                onDelete={(fileId) => {
                  const fileToDelete = unitState.lists.recentFiles.find(
                    (f) => f.id === fileId
                  );
                  revokeBlobUrl(fileToDelete?.url);
                  unitDispatch({ type: "DELETE_FILE", fileId });
                }}
                onView={(file) => {
                  unitDispatch({ type: "SELECT_FILE", fileId: file.id });
                  unitDispatch({ type: "OPEN_MODAL", modal: "viewFile" });
                }}
                isLast={true}
                emptyMessage="You don't have any files for this unit right now."
              />
            </SectionGroupCardTemplate>

            {/* View File Modal */}
            <PdfViewerModal
              open={unitState.activeModal === "viewFile"}
              onOpenChange={(open) => {
                if (!open) unitDispatch({ type: "CLOSE_MODAL" });
              }}
              title={selectedFile?.name || "File Preview"}
              url={selectedFile?.url}
            />

            {/* Add/Edit Note Modal */}
            <AddNoteModal
              open={unitState.activeModal === "addNote" || unitState.activeModal === "editNote"}
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

            {/* View Note Modal */}
            <ModalTemplate
              open={unitState.activeModal === "viewNote"}
              onOpenChange={(open) => {
                if (!open) {
                  unitDispatch({ type: "CLOSE_MODAL" });
                  setViewingNote(null);
                }
              }}
              title="Note Details"
              size="sm"
              footer={
                <ModalButtons
                  onCancel={() => {
                    unitDispatch({ type: "CLOSE_MODAL" });
                    setViewingNote(null);
                  }}
                  onConfirm={() => {
                    if (viewingNote) {
                      unitDispatch({ type: "SELECT_NOTE", noteId: viewingNote.id });
                      unitDispatch({ type: "OPEN_MODAL", modal: "editNote" });
                      setViewingNote(null);
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
                      <span className="font-medium">Author:</span> {viewingNote.author}
                    </div>
                    <div className="text-sm text-[#71717A]">
                      <span className="font-medium">Date:</span> {viewingNote.date}
                    </div>
                  </FormSection>
                </FormLayout>
              ) : null}
            </ModalTemplate>

            {/* Add/Edit File Modal */}
            <AddFileModal
              open={unitState.activeModal === "addFile" || unitState.activeModal === "editFile"}
              onOpenChange={(open) => {
                if (!open) unitDispatch({ type: "CLOSE_MODAL" });
              }}
              isEditMode={unitState.activeModal === "editFile"}
              initialFiles={unitState.activeModal === "editFile" && selectedFile ? [{ id: String(selectedFile.id), name: selectedFile.name, size: 0, type: selectedFile.type || "", url: selectedFile.url }] : []}
              initialCategory={unitState.activeModal === "editFile" && selectedFile ? selectedFile.category || "" : ""}
              initialDescription={unitState.activeModal === "editFile" && selectedFile ? selectedFile.description || "" : ""}
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
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header Section */}
      <div className="flex items-center gap-10 justify-between flex-wrap">
        {/* Title and Description */}
        <div className="flex flex-col gap-1 min-w-[240px]">
          <h1 className="text-[#303030] font-semibold text-2xl leading-[30px]">
            Units
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <p
              className="text-[#717179] font-medium text-base leading-4"
              style={{ marginTop: "-4px" }}
            >
              All units for {propertyAddress}
            </p>
          </div>
        </div>

        {/* Add Unit Button */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleOpenAddModal}
            className="flex h-9 items-center gap-2 px-3 rounded-lg border border-white bg-[#013764] shadow-[0_0_0_1px_#002D5A] hover:bg-[#003a73] transition-colors"
          >
            <PlusIcon width={20} height={20} color="white" />
            <span className="text-white font-medium text-base leading-normal">
              Add unit
            </span>
          </button>
        </div>
      </div>

      {/* Units Table */}
      <GlobalTable
        columns={[
          { key: "unitNumber", label: "Unit", icon: columnConfig.unitNumber.icon },
          { key: "address", label: "Address", icon: columnConfig.address.icon },
          { key: "tenants", label: "Tenants", icon: columnConfig.tenants.icon },
        ]}
        data={unitsList}
        rowKey="id"
        actions={[
          {
            label: "View Unit",
            icon: <EditIcon width={18} height={18} color="#525252" />,
            onClick: (unit: Unit) => {
              setSelectedUnitId(unit.id);
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
                    <span className="text-gray-500 text-sm">No tenants</span>
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
        onRowClick={(unit: Unit) => {
          setSelectedUnitId(unit.id);
        }}
        headerActions={
          <button
            ref={columnManagement.columnButtonRef}
            onClick={() => {
              setShowPageSizeDropdown(false);
              setOpenMenuId(null);
              columnManagement.setShowColumnModal((prev) => !prev);
            }}
            className="flex h-9 w-9 justify-center items-center rounded-lg border border-[#DADADA] bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] hover:bg-gray-50 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="8" cy="3" r="1.5" fill="#303030" />
              <circle cx="8" cy="8" r="1.5" fill="#303030" />
              <circle cx="8" cy="13" r="1.5" fill="#303030" />
            </svg>
          </button>
        }
      />

      {/* Add Unit Modal */}
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
        propertyId={propertyId ? parseInt(propertyId) : 1}
      />

      {/* Column Filter Modal */}
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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-[#303030] mb-2">
              Delete Unit
            </h3>
            <p className="text-sm text-[#717179] mb-6">
              Are you sure you want to delete this unit? This action cannot be undone.
            </p>
            <div className="flex gap-2.5 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-3 py-2 rounded-lg border border-[#DADADA] bg-white hover:bg-gray-50 text-[#303030] font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-3 py-2 rounded-lg bg-[#982740] hover:bg-[#7a1f31] text-white font-medium text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
