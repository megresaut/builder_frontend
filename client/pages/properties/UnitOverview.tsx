import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import AddNoteModal from "@/components/AddNoteModal";
import AddFileModal from "@/components/AddFileModal";
import PdfViewerModal from "@/components/PdfViewerModal";
import { usePropertyDetailsState, type RecentNote, type RecentFile } from "@/hooks/usePropertyDetailsState";
import {
  SectionRowTemplate,
  SectionGroupCardTemplate,
  NotesTemplate,
  FilesTemplate,
} from "@/components/templates";
import { ModalTemplate, ModalButtons } from "@/components/ui/ModalTemplate";
import { FormLayout, FormSection } from "@/components/ui/form-layout";

interface Unit {
  id: number;
  unitNumber: string;
  address: string;
  tenants: string[];
  propertyId: number;
}

// Mock data
const mockUnits: Record<number, Unit> = {
  "1": {
    id: 1,
    unitNumber: "1A",
    address: "113-115 Park Avenue, Suite 100",
    tenants: ["John Smith", "Sarah Johnson"],
    propertyId: 1,
  },
  "2": {
    id: 2,
    unitNumber: "1B",
    address: "113-115 Park Avenue, Suite 101",
    tenants: ["Michael Chen"],
    propertyId: 1,
  },
  "3": {
    id: 3,
    unitNumber: "2A",
    address: "113-115 Park Avenue, Suite 200",
    tenants: ["Emily Rodriguez", "David Harris"],
    propertyId: 1,
  },
};

export default function UnitOverview() {
  const navigate = useNavigate();
  const { unitId, propertyId } = useParams<{
    unitId: string;
    propertyId: string;
  }>();

  const unit = unitId ? mockUnits[unitId] : null;
  const { state, dispatch } = usePropertyDetailsState();

  // Initialize notes and files on mount
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
        name: "Unit 1A - Lease Agreement.pdf",
        category: "Lease Documents",
        date: "6/3/2025 2:06 PM",
        author: "Julia LoSchiavo",
        type: "pdf",
        icon: "https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/5ef69f3c3e2f3e3b15cc6139a16a94f848b10be7?placeholderIfAbsent=true",
        url: "https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/5ef69f3c3e2f3e3b15cc6139a16a94f848b10be7",
      },
      {
        id: 2,
        name: "Unit 1A - Move-in Inspection.docx",
        category: "Inspections",
        date: "5/19/2024 3:55 PM",
        author: "Carter Hughes",
        type: "docx",
        icon: "https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/07da6a33a78bd70b7170adaa97b3fb7b14ff2fc0?placeholderIfAbsent=true",
        url: "https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/07da6a33a78bd70b7170adaa97b3fb7b14ff2fc0",
      },
    ];

    dispatch({ type: "SET_RECENT_NOTES", notes: initialNotes });
    dispatch({ type: "SET_RECENT_FILES", files: initialFiles });
  }, [dispatch]);

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

  const selectedNote = state.selection.noteId
    ? state.lists.recentNotes.find((n) => n.id === state.selection.noteId)
    : null;

  const selectedFile = state.selection.fileId
    ? state.lists.recentFiles.find((f) => f.id === state.selection.fileId)
    : null;

  if (!unit) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-500 text-lg">Unit not found</p>
      </div>
    );
  }

  const fullAddress = `${unit.address} - ${unit.unitNumber}`;

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
                  <div className="flex min-w-[240px] min-h-[160px] flex-col justify-center flex-1">
                    <div className="flex flex-col w-full max-w-[423px]">
                      <div className="text-[#71717A] text-xs leading-[1.33]">
                        ADDRESS
                      </div>
                      <div className="text-[#303030] text-base leading-[1.13] mt-1">
                        <div>{fullAddress}</div>
                      </div>
                    </div>

                    <div className="flex mt-5 w-full items-start gap-14 flex-1">
                      <div className="flex flex-col">
                        <div className="text-[#71717A] text-xs leading-[1.33]">
                          TENANTS
                        </div>
                        <div className="flex flex-col self-start mt-1 gap-1 text-base text-[#303030] leading-[1.13]">
                          {unit.tenants.length > 0 ? (
                            unit.tenants.map((tenant, idx) => (
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
              notes={state.lists.recentNotes}
              onAdd={() => dispatch({ type: "OPEN_MODAL", modal: "addNote" })}
              onEdit={(note) => {
                setViewingNote(note);
                dispatch({ type: "OPEN_MODAL", modal: "viewNote" });
              }}
              onDelete={(noteId) => dispatch({ type: "DELETE_NOTE", noteId })}
              isLast={false}
              emptyMessage="You don't have any notes for this unit right now."
            />

            {/* Recent Files Section */}
            <FilesTemplate
              files={state.lists.recentFiles}
              onAdd={() => dispatch({ type: "OPEN_MODAL", modal: "addFile" })}
              onEdit={(file) => {
                dispatch({ type: "SELECT_FILE", fileId: file.id });
                dispatch({ type: "OPEN_MODAL", modal: "editFile" });
              }}
              onDelete={(fileId) => {
                const fileToDelete = state.lists.recentFiles.find(
                  (f) => f.id === fileId
                );
                revokeBlobUrl(fileToDelete?.url);
                dispatch({ type: "DELETE_FILE", fileId });
              }}
              onView={(file) => {
                dispatch({ type: "SELECT_FILE", fileId: file.id });
                dispatch({ type: "OPEN_MODAL", modal: "viewFile" });
              }}
              isLast={true}
              emptyMessage="You don't have any files for this unit right now."
            />
          </SectionGroupCardTemplate>

          {/* View File Modal */}
          <PdfViewerModal
            open={state.activeModal === "viewFile"}
            onOpenChange={(open) => {
              if (!open) dispatch({ type: "CLOSE_MODAL" });
            }}
            title={selectedFile?.name || "File Preview"}
            url={selectedFile?.url}
          />

          {/* Add/Edit Note Modal */}
          <AddNoteModal
            open={state.activeModal === "addNote" || state.activeModal === "editNote"}
            onOpenChange={(open) => {
              if (!open) dispatch({ type: "CLOSE_MODAL" });
            }}
            isEditMode={state.activeModal === "editNote"}
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

              if (state.activeModal === "editNote" && selectedNote) {
                dispatch({
                  type: "UPDATE_NOTE",
                  noteId: selectedNote.id,
                  text: noteText,
                  date,
                });
              } else {
                const nextId = state.lists.recentNotes.length
                  ? Math.max(...state.lists.recentNotes.map((n) => n.id)) + 1
                  : 1;

                dispatch({
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
              dispatch({ type: "CLOSE_MODAL" });
            }}
          />

          {/* View Note Modal */}
          <ModalTemplate
            open={state.activeModal === "viewNote"}
            onOpenChange={(open) => {
              if (!open) {
                dispatch({ type: "CLOSE_MODAL" });
                setViewingNote(null);
              }
            }}
            title="Note Details"
            size="sm"
            footer={
              <ModalButtons
                onCancel={() => {
                  dispatch({ type: "CLOSE_MODAL" });
                  setViewingNote(null);
                }}
                onConfirm={() => {
                  if (viewingNote) {
                    dispatch({ type: "SELECT_NOTE", noteId: viewingNote.id });
                    dispatch({ type: "OPEN_MODAL", modal: "editNote" });
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
            open={state.activeModal === "addFile" || state.activeModal === "editFile"}
            onOpenChange={(open) => {
              if (!open) dispatch({ type: "CLOSE_MODAL" });
            }}
            isEditMode={state.activeModal === "editFile"}
            initialFiles={state.activeModal === "editFile" && selectedFile ? [{ id: String(selectedFile.id), name: selectedFile.name, size: 0, type: selectedFile.type || "", url: selectedFile.url }] : []}
            initialCategory={state.activeModal === "editFile" && selectedFile ? selectedFile.category || "" : ""}
            initialDescription={state.activeModal === "editFile" && selectedFile ? selectedFile.description || "" : ""}
            acceptedFormats=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.txt,.csv"
            onSubmit={(uploadedFiles, category, description) => {
              if (state.activeModal === "editFile" && selectedFile) {
                dispatch({
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

                const nextId = state.lists.recentFiles.length
                  ? Math.max(...state.lists.recentFiles.map((f) => f.id)) + 1
                  : 1;

                dispatch({
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
              dispatch({ type: "CLOSE_MODAL" });
            }}
          />
        </div>
      </div>
    </>
  );
}
