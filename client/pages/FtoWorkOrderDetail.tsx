import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PageTemplate from "@/layout/PageTemplate";
import SubPageHeaderV2 from "@/components/SubPageHeaderV2";
import { fetchJSON, authFetch, API_BASE } from "@/api/fetchJSON";
import { useAuthBlobUrl } from "@/hooks/useAuthBlobUrl";
import { formatUnitLabel } from "@/utils/unitLabel";
import { useAuth } from "@/auth/useAuth";
import { ChevronLeft } from "lucide-react";
import { EditIcon } from "@/components/icons";
import { NotesTemplate, FilesTemplate } from "@/components/templates";
import { DateField } from "@/components/forms/DateField";
import { StatusSelectField } from "@/components/forms/StatusSelectField";
import { ModalTemplate, ModalButtons } from "@/components/ui/ModalTemplate";
import type { Note, File } from "@/components/templates";
import { AddNoteModal, AddFileModal, AddPhotoModal } from "@/components/task";
import type { PhotoUpload } from "@/components/task";
import type { UploadedFile } from "@/components/ui/attachment-uploader";
import PhotoGallery from "@/components/PhotoGallery";
import type { Photo, PhotoLabel } from "@/components/PhotoGallery";
import SectionCard from "@/components/SectionCard";
import { convertFiletoPdf } from "@/utils/convertFiletoPdf";

interface WorkOrderDetail {
  id: number;
  name: string;
  task_id: number;
  property_id: number;
  property_name: string | null;
  unit_id: number | null;
  unit_name: string | null;
  vendor_name: string | null;
  vendor_email: string | null;
  vendor_phone: string | null;
  due_date: string | null;
  status: string;
  priority: string;
}

interface TaskAssignee {
  id: number;
  name: string;
  email: string;
  role?: string;
}

interface ApiWorkOrderNote {
  id: number;
  work_order_id: number;
  author_type: string;
  author_id: number;
  body: string;
  is_visible_to_client: boolean;
  created_at: string;
  updated_at: string | null;
}

interface ApiWorkOrderAttachment {
  id: number;
  work_order_id: number;
  file_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  uploaded_by_type: string;
  uploaded_by: number;
  uploaded_by_name?: string;
  label: string | null;
  description: string | null;
  created_at: string;
}

const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "—";
  }
};

const formatDateTime = (dateStr: string): string => {
  try {
    return new Date(dateStr).toLocaleString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return dateStr;
  }
};

function transformApiNoteToUiNote(apiNote: ApiWorkOrderNote): Note {
  return {
    id: apiNote.id,
    text: apiNote.body,
    date: formatDateTime(apiNote.created_at),
    author: "User",
    author_id: apiNote.author_id,
    created_at: apiNote.created_at,
    updated_at: apiNote.updated_at ?? undefined,
  };
}

function transformApiAttachmentToUiFile(api: ApiWorkOrderAttachment): File {
  return {
    id: api.id,
    name: api.file_name,
    uploadedAt: formatDateTime(api.created_at),
    category: api.label ?? undefined,
    description: api.description ?? undefined,
    file_type: api.file_type,
    file_size: api.file_size,
    storage_path: api.storage_path,
    uploaded_by_type: api.uploaded_by_type,
    uploaded_by: api.uploaded_by,
  };
}

function attachmentToPhoto(a: ApiWorkOrderAttachment): Photo {
  return {
    id: a.id,
    url: `${API_BASE}/files/${a.storage_path}`,
    fileName: a.file_name,
    uploadedAt: formatDateTime(a.created_at),
    uploadedBy: a.uploaded_by_name ?? a.uploaded_by_type,
    label: (a.label as PhotoLabel) ?? undefined,
    caption: a.description ?? undefined,
  };
}

export default function FtoWorkOrderDetail() {
  const { workOrderId } = useParams<{ workOrderId: string }>();
  const navigate = useNavigate();
  const { userId } = useAuth();
  const [workOrder, setWorkOrder] = useState<WorkOrderDetail | null>(null);
  const [assignees, setAssignees] = useState<TaskAssignee[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [filesLoading, setFilesLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddNoteModalOpen, setIsAddNoteModalOpen] = useState(false);
  const [isAddFileModalOpen, setIsAddFileModalOpen] = useState(false);
  const [isAddPhotoOpen, setIsAddPhotoOpen] = useState(false);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [editingFileId, setEditingFileId] = useState<number | null>(null);
  const [viewingFileUrl, setViewingFileUrl] = useState<string | null>(null);
  const { blobUrl: viewingBlobUrl, loading: viewingFileLoading } = useAuthBlobUrl(viewingFileUrl);
  const [viewingFileName, setViewingFileName] = useState<string | null>(null);
  const [isEditWorkOrderModalOpen, setIsEditWorkOrderModalOpen] = useState(false);
  const [editDueDate, setEditDueDate] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<
    "not_started" | "in_progress" | "completed"
  >("not_started");
  const [editSubmitting, setEditSubmitting] = useState(false);

  const loadWorkOrder = useCallback(async () => {
    if (!workOrderId) return;
    const id = Number(workOrderId);
    if (!Number.isFinite(id)) return;
    try {
      const wo: any = await fetchJSON(`/maintenance/work-orders/${id}`);
      setWorkOrder({
        id: wo.id,
        name: wo.name ?? "—",
        task_id: wo.task_id,
        property_id: wo.property_id,
        property_name: wo.property_name ?? wo.propertyName ?? null,
        unit_id: wo.unit_id ?? wo.unitId ?? null,
        unit_name: wo.unit_name ?? wo.unitName ?? null,
        vendor_name: wo.vendor_name ?? wo.vendorName ?? null,
        vendor_email: wo.vendor_email ?? wo.vendorEmail ?? null,
        vendor_phone: wo.vendor_phone ?? wo.vendorPhone ?? null,
        due_date: wo.due_date ?? wo.dueDate ?? null,
        status: wo.status ?? "—",
        priority: wo.priority ?? "—",
      });
      if (wo.task_id) {
        try {
          const task: any = await fetchJSON(`/maintenance/tasks/${wo.task_id}`);
          setAssignees(Array.isArray(task?.assignees) ? task.assignees : []);
        } catch {
          setAssignees([]);
        }
      } else {
        setAssignees([]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load work order");
      setWorkOrder(null);
      setAssignees([]);
    }
  }, [workOrderId]);

  useEffect(() => {
    const run = async () => {
      if (!workOrderId) {
        setError("Missing work order ID");
        setLoading(false);
        return;
      }
      const id = Number(workOrderId);
      if (!Number.isFinite(id)) {
        setError("Invalid work order ID");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      await loadWorkOrder();
      setLoading(false);
    };
    run();
  }, [workOrderId, loadWorkOrder]);

  // Load notes
  useEffect(() => {
    if (!workOrderId) return;
    const load = async () => {
      setNotesLoading(true);
      try {
        const apiNotes: ApiWorkOrderNote[] = await fetchJSON(
          `/maintenance/work-orders/id/${workOrderId}/notes`,
        );
        setNotes((apiNotes || []).map(transformApiNoteToUiNote));
      } catch {
        setNotes([]);
      } finally {
        setNotesLoading(false);
      }
    };
    load();
  }, [workOrderId]);

  // Load files
  useEffect(() => {
    if (!workOrderId) return;
    const load = async () => {
      setFilesLoading(true);
      try {
        const apiAttachments: ApiWorkOrderAttachment[] = await fetchJSON(
          `/maintenance/work-orders/id/${workOrderId}/attachments`,
        );
        const imageAttachments = (apiAttachments || []).filter(a => a.file_type?.startsWith("image/"));
        const fileAttachments = (apiAttachments || []).filter(a => !a.file_type?.startsWith("image/"));
        setPhotos(imageAttachments.map(attachmentToPhoto));
        setFiles(fileAttachments.map(transformApiAttachmentToUiFile));
      } catch {
        setFiles([]);
      } finally {
        setFilesLoading(false);
      }
    };
    load();
  }, [workOrderId]);

  const unitLabel = workOrder
    ? formatUnitLabel({
        unitId: workOrder.unit_id,
        unitName: workOrder.unit_name,
        fallback: "—",
      })
    : "—";

  const handleAddNote = async (text: string) => {
    if (!workOrderId || !userId) return;
    try {
      if (editingNoteId) {
        const updated: ApiWorkOrderNote = await fetchJSON(
          `/maintenance/work-orders/notes/${editingNoteId}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ body: text, is_visible_to_client: false }),
          },
        );
        setNotes((prev) =>
          prev.map((n) => (n.id === editingNoteId ? transformApiNoteToUiNote(updated) : n)),
        );
      } else {
        const newNote: ApiWorkOrderNote = await fetchJSON(
          `/maintenance/work-orders/id/${workOrderId}/notes`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              author_type: "user",
              author_id: userId,
              body: text,
              is_visible_to_client: false,
            }),
          },
        );
        setNotes((prev) => [transformApiNoteToUiNote(newNote), ...prev]);
      }
      setIsAddNoteModalOpen(false);
      setEditingNoteId(null);
    } catch (err) {
      console.error(err);
      alert("Failed to save note. Please try again.");
    }
  };

  const handleAddFile = async (
    uploadedFiles: UploadedFile[],
    category: string,
    description: string,
  ) => {
    if (!workOrderId || !userId || !uploadedFiles.length || !uploadedFiles[0].file) {
      if (!uploadedFiles.length || !uploadedFiles[0].file) alert("Please select a file.");
      return;
    }
    try {
      if (editingFileId) {
        const updated = await fetchJSON(
          `/maintenance/work-orders/attachments/${editingFileId}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              label: category || null,
              description: description || null,
            }),
          },
        );
        setFiles((prev) =>
          prev.map((f) =>
            f.id === editingFileId ? transformApiAttachmentToUiFile(updated) : f,
          ),
        );
      } else {
        let fileToUpload: globalThis.File = uploadedFiles[0].file!;
        const isImage =
          fileToUpload.type.startsWith("image/") ||
          /\.(jpg|jpeg|png|gif|webp|heic|heif)$/i.test(fileToUpload.name);
        if (isImage) {
          fileToUpload = await convertFiletoPdf(fileToUpload);
        }
        const formData = new FormData();
        formData.append("file", fileToUpload, fileToUpload.name);
        const uploadRes = await authFetch(
          `/maintenance/tasks/attachments/upload`,
          { method: "POST", body: formData },
        );
        if (!uploadRes.ok) throw new Error("Upload failed");
        const uploadData: {
          temp_object_key: string;
          original_name: string;
          file_type: string;
          file_size: number;
        } = await uploadRes.json();
        const newAttachment = await fetchJSON(
          `/maintenance/work-orders/id/${workOrderId}/attachments`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              file_name: uploadData.original_name,
              file_type: uploadData.file_type,
              file_size: uploadData.file_size,
              storage_path: uploadData.temp_object_key,
              uploaded_by_type: "user",
              uploaded_by: userId,
              label: category || null,
              description: description || null,
            }),
          },
        );
        setFiles((prev) => [
          transformApiAttachmentToUiFile(newAttachment as ApiWorkOrderAttachment),
          ...prev,
        ]);
      }
      setIsAddFileModalOpen(false);
      setEditingFileId(null);
    } catch (err) {
      console.error(err);
      alert("Failed to save file. Please try again.");
    }
  };

  const handleDeleteFile = async (fileId: number) => {
    try {
      await fetchJSON(`/maintenance/work-orders/attachments/${fileId}`, {
        method: "DELETE",
      });
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
    } catch (err) {
      console.error(err);
      alert("Failed to delete file. Please try again.");
    }
  };

  const handleAddPhotos = async (
    uploads: PhotoUpload[],
    label: Photo["label"] | null,
    caption: string,
  ) => {
    if (!workOrderId || !userId) return;
    setPhotoUploading(true);
    try {
      for (const upload of uploads) {
        const formData = new FormData();
        formData.append("file", upload.file, upload.file.name);
        const uploadRes = await authFetch("/maintenance/tasks/attachments/upload", {
          method: "POST",
          body: formData,
        });
        if (!uploadRes.ok) throw new Error("Upload failed");
        const uploadData: { temp_object_key: string; original_name: string; file_type: string; file_size: number; } = await uploadRes.json();
        const newAttachment = await fetchJSON(
          `/maintenance/work-orders/id/${workOrderId}/attachments`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              file_name: uploadData.original_name,
              file_type: uploadData.file_type,
              file_size: uploadData.file_size,
              storage_path: uploadData.temp_object_key,
              uploaded_by_type: "user",
              uploaded_by: userId,
              label: label ?? null,
              description: caption || null,
            }),
          },
        );
        setPhotos(prev => [attachmentToPhoto(newAttachment as ApiWorkOrderAttachment), ...prev]);
      }
    } catch (err) {
      console.error("Failed to upload photos:", err);
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleViewFile = (file: File) => {
    const f = file as File & { storage_path?: string };
    if (f.id) {
      setViewingFileUrl(`${API_BASE}/maintenance/attachments/${f.id}`);
      setViewingFileName(f.name);
      return;
    }
    if (f.storage_path) {
      setViewingFileUrl(`${API_BASE}/files?key=${encodeURIComponent(f.storage_path)}`);
      setViewingFileName(f.name);
    }
  };

  const editingNote = notes.find((n) => n.id === editingNoteId);
  const editingFile = files.find((f) => f.id === editingFileId);

  const capitalizeStatus = (s: string) =>
    (s ?? "")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

  // Map backend status to StatusSelectField value
  const mapBackendStatusToFrontend = (
    s: string
  ): "not_started" | "in_progress" | "completed" => {
    const map: Record<string, "not_started" | "in_progress" | "completed"> = {
      new: "not_started",
      in_progress: "in_progress",
      completed: "completed",
    };
    return map[(s || "").toLowerCase()] ?? "not_started";
  };

  const mapFrontendStatusToBackend = (
    s: "not_started" | "in_progress" | "completed"
  ): string => {
    const map = {
      not_started: "new",
      in_progress: "in_progress",
      completed: "completed",
    };
    return map[s] ?? "new";
  };

  useEffect(() => {
    if (isEditWorkOrderModalOpen && workOrder) {
      const rawDue = workOrder.due_date;
      setEditDueDate(rawDue ? String(rawDue).split("T")[0] : null);
      setEditStatus(mapBackendStatusToFrontend(workOrder.status));
    }
  }, [isEditWorkOrderModalOpen, workOrder]);

  const handleEditWorkOrderSubmit = async () => {
    if (!workOrderId || !workOrder) return;
    setEditSubmitting(true);
    try {
      const payload: { due_date?: string | null; status: string } = {
        status: mapFrontendStatusToBackend(editStatus),
      };
      if (editDueDate) {
        payload.due_date = editDueDate.includes("T")
          ? editDueDate
          : `${editDueDate}T12:00:00.000Z`;
      } else {
        payload.due_date = null;
      }
      const updated = await fetchJSON(`/maintenance/work-orders/${workOrderId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      setWorkOrder({
        ...workOrder,
        due_date: updated.due_date ?? updated.dueDate ?? editDueDate,
        status: updated.status ?? editStatus,
      });
      setIsEditWorkOrderModalOpen(false);
    } catch (err) {
      console.error(err);
      alert("Failed to update work order. Please try again.");
    } finally {
      setEditSubmitting(false);
    }
  };

  return (
    <PageTemplate>
      <>
      <div className="flex flex-col -mt-3">
        <SubPageHeaderV2
          leftContent={
            <div className="flex flex-col gap-1">
              <button
                type="button"
                onClick={() => navigate("/fto/work-orders")}
                className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 self-start -mt-0.5 py-2.5 pr-2 -my-1 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 sm:py-0 sm:my-0"
              >
                <ChevronLeft className="w-4 h-4 flex-shrink-0" />
                <span>Back to Work Orders</span>
              </button>
              <h1 className="text-2xl font-semibold text-gray-900">Work Order Details</h1>
              <p className="text-sm text-gray-600">View details, notes, and files</p>
            </div>
          }
        />

        <div className="flex flex-col gap-6 mt-4 sm:mt-2">
        {loading && (
          <div className="text-center py-8 text-gray-500 text-sm">Loading...</div>
        )}
        {error && !loading && (
          <div className="text-center py-8 text-red-500 text-sm">{error}</div>
        )}

        {!loading && !error && workOrder && (
          <>
            {/* Read-only details card (form-like) */}
            <SectionCard padding="none" variant="white">
              <div className="p-4 sm:p-6 relative">
                <button
                  type="button"
                  onClick={() => setIsEditWorkOrderModalOpen(true)}
                  className="absolute top-4 right-4 flex items-center justify-center w-10 h-10 min-w-[44px] min-h-[44px] rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 touch-manipulation"
                  aria-label="Edit work order details"
                >
                  <EditIcon width={18} height={18} />
                </button>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 pr-12 sm:pr-12">
                  <DetailItem label="Work Order" value={workOrder.name} />
                  <DetailItem label="Property" value={workOrder.property_name ?? "—"} />
                  <DetailItem label="Property Unit" value={unitLabel} />
                  <DetailItem label="Due Date" value={formatDate(workOrder.due_date)} />
                  <DetailItem
                    label="Status"
                    value={
                      workOrder.status ? capitalizeStatus(workOrder.status) : "—"
                    }
                  />
                </div>
                {/* Vendor with contact info */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">
                    Vendor
                  </span>
                  <p className="text-sm font-medium text-gray-900">
                    {workOrder.vendor_name ?? "—"}
                  </p>
                  {(workOrder.vendor_email || workOrder.vendor_phone) && (
                    <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                      {workOrder.vendor_email && (
                        <a
                          href={`mailto:${workOrder.vendor_email}`}
                          className="hover:text-gray-900 underline"
                        >
                          {workOrder.vendor_email}
                        </a>
                      )}
                      {workOrder.vendor_phone && (
                        <a
                          href={`tel:${workOrder.vendor_phone}`}
                          className="hover:text-gray-900"
                        >
                          {workOrder.vendor_phone}
                        </a>
                      )}
                    </div>
                  )}
                </div>
                {assignees.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Task assignees</h3>
                    <ul className="flex flex-wrap gap-2">
                      {assignees.map((a) => (
                        <li
                          key={a.id}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 text-sm text-gray-800"
                        >
                          <span>{a.name}</span>
                          {a.email && (
                            <span className="text-gray-500 text-xs truncate max-w-[120px] sm:max-w-none">
                              {a.email}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </SectionCard>

            {/* Notes */}
            <SectionCard padding="compact" variant="white">
              {notesLoading ? (
                <p className="text-sm text-gray-500">Loading notes...</p>
              ) : (
                <NotesTemplate
                  notes={notes}
                  onAdd={() => {
                    setEditingNoteId(null);
                    setIsAddNoteModalOpen(true);
                  }}
                  onEdit={(note) => {
                    setEditingNoteId(note.id);
                    setIsAddNoteModalOpen(true);
                  }}
                  onDelete={async (id) => {
                    try {
                      await fetchJSON(`/maintenance/work-orders/notes/${id}`, {
                        method: "DELETE",
                      });
                      setNotes((prev) => prev.filter((n) => n.id !== id));
                    } catch (err) {
                      console.error(err);
                      alert("Failed to delete note.");
                    }
                  }}
                  emptyMessage="No notes yet. Add a note about this work order."
                />
              )}
            </SectionCard>

            {/* Files */}
            <SectionCard padding="compact" variant="white">
              {filesLoading ? (
                <p className="text-sm text-gray-500">Loading files...</p>
              ) : (
                <FilesTemplate
                  files={files}
                  onAdd={() => {
                    setEditingFileId(null);
                    setIsAddFileModalOpen(true);
                  }}
                  onEdit={(file) => {
                    setEditingFileId(file.id);
                    setIsAddFileModalOpen(true);
                  }}
                  onDelete={handleDeleteFile}
                  onView={handleViewFile}
                  emptyMessage="No files yet. Upload images or documents."
                />
              )}
            </SectionCard>

            {/* Photos */}
            <SectionCard padding="compact" variant="white">
              <div className="p-4">
                <PhotoGallery
                  photos={photos}
                  onAdd={() => setIsAddPhotoOpen(true)}
                  onDelete={(id) => { setPhotos(prev => prev.filter(p => p.id !== id)); fetchJSON(`/maintenance/work-orders/attachments/${id}`, { method: "DELETE" }).catch(console.error); }}
                  onEdit={(updated) => { setPhotos(prev => prev.map(p => p.id === updated.id ? updated : p)); fetchJSON(`/maintenance/work-orders/attachments/${updated.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ label: updated.label ?? null, description: updated.caption ?? null }) }).catch(console.error); }}
                />
              </div>
            </SectionCard>
          </>
        )}
        </div>
      </div>

        <AddNoteModal
          open={isAddNoteModalOpen}
          onOpenChange={setIsAddNoteModalOpen}
          onSubmit={handleAddNote}
          initialText={editingNote?.text ?? ""}
          isEditMode={!!editingNoteId}
          title={editingNoteId ? "Edit Note" : "Add Note"}
          submitLabel="Save"
        />

        <AddFileModal
          open={isAddFileModalOpen}
          onOpenChange={(open) => {
            if (!open) setEditingFileId(null);
            setIsAddFileModalOpen(open);
          }}
          onSubmit={handleAddFile}
          isEditMode={!!editingFileId}
          initialCategory={editingFile?.category ?? ""}
          initialDescription={editingFile?.description ?? ""}
          title={editingFileId ? "Edit File" : "Add File"}
          submitLabel="Save"
        />

        <AddPhotoModal
          open={isAddPhotoOpen}
          onOpenChange={setIsAddPhotoOpen}
          onSubmit={handleAddPhotos}
          loading={photoUploading}
        />

        <ModalTemplate
          open={isEditWorkOrderModalOpen}
          onOpenChange={setIsEditWorkOrderModalOpen}
          title="Edit Work Order Details"
          size="sm"
          footer={
            <ModalButtons
              onCancel={() => setIsEditWorkOrderModalOpen(false)}
              onConfirm={handleEditWorkOrderSubmit}
              cancelLabel="Cancel"
              confirmLabel="Save"
              confirmDisabled={editSubmitting}
            />
          }
        >
          <div className="flex flex-col gap-4">
            <StatusSelectField
              label="Status"
              value={editStatus}
              onChange={(v) => setEditStatus(v)}
            />
            <DateField
              label="Due Date"
              value={editDueDate}
              onChange={(v) => setEditDueDate(v ? String(v).split("T")[0] : null)}
              returnFormat="ISO"
            />
          </div>
        </ModalTemplate>

        {viewingFileUrl && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between p-2 border-b">
                <span className="text-sm font-medium truncate">{viewingFileName ?? "File"}</span>
                <button
                  type="button"
                  onClick={() => {
                    setViewingFileUrl(null);
                    setViewingFileName(null);
                  }}
                  className="text-gray-500 hover:text-gray-700 p-1"
                >
                  ×
                </button>
              </div>
              {viewingFileLoading ? (
                <div className="flex-1 w-full min-h-[70vh] flex items-center justify-center text-gray-400 text-sm">Loading...</div>
              ) : viewingBlobUrl ? (
                <iframe
                  title="File preview"
                  src={viewingBlobUrl}
                  className="flex-1 w-full min-h-[70vh] border-0"
                />
              ) : (
                <div className="flex-1 w-full min-h-[70vh] flex items-center justify-center text-gray-400 text-sm">Failed to load file</div>
              )}
            </div>
          </div>
        )}
      </>
    </PageTemplate>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
        {label}
      </span>
      <span className="text-sm text-gray-900 break-words">{value}</span>
    </div>
  );
}
