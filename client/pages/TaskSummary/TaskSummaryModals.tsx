import React from "react";
import { FlagIcon, EditIcon, NoteIcon, PaperclipIcon } from "@/components/icons";
import { AddNoteModal, AddFileModal, EditTaskDetailsModal, LinkTaskModal } from "@/components/task";
import type { Note } from "@/components/templates";
import type { File } from "@/components/templates";
import type { LinkedTaskData } from "@/components/task";
import type { EditTaskDetailsData } from "@/components/task";
import type { UploadedFile } from "@/components/ui/attachment-uploader";
import { ModalTemplate, ModalButtons } from "@/components/ui/ModalTemplate";
import { FormLayout, FormSection } from "@/components/ui/form-layout";
import PdfViewerModal from "@/components/PdfViewerModal";
import CreateTaskModal from "@/components/CreateTaskModal";
import PersonAvatars from "@/components/PersonAvatars";
import TaskStatusBadge from "@/components/TaskStatusBadge";
import TaskPriorityBadge from "@/components/TaskPriorityBadge";

interface TaskSummaryModalsProps {
  uiState: any;
  uiDispatch: any;
  notes: Note[];
  files: File[];
  updates: any[];
  currentTitle: string;
  currentDescription: string;
  currentProperty: string;
  currentUnit: string;
  currentCategory: string;
  currentStatus: string;
  currentPriority: string;
  currentDueDate: Date | null;
  currentAssignees: any[];
  currentCollaborators: any[];
  availableTasksForLinking: LinkedTaskData[];
  modalEditData: any;
  editingNote: Note | undefined;
  editingFile: File | undefined;
  onNotesChange: (notes: Note[]) => void;
  onFilesChange: (files: File[]) => void;
  onUpdatesChange: (updates: any[]) => void;
  onCurrentTitleChange: (title: string) => void;
  onCurrentDescriptionChange: (description: string) => void;
  onCurrentPropertyChange: (property: string) => void;
  onCurrentUnitChange: (unit: string) => void;
  onCurrentCategoryChange: (category: string) => void;
  onCurrentStatusChange: (status: string) => void;
  onCurrentPriorityChange: (priority: string) => void;
  onCurrentDueDateChange: (dueDate: Date | null) => void;
  onCurrentAssigneesChange: (assignees: any[]) => void;
  onCurrentCollaboratorsChange: (collaborators: any[]) => void;
  onLastUpdatedChange: (timestamp: string) => void;
  syncFileNameAcrossStates: (fileId: string | number, newName: string) => void;
  getAttachmentData: (file: any, index?: number) => any;
  handleStartRenamingAttachment: () => void;
  handleSaveAttachmentFileName: () => void;
  handleCancelRenamingAttachment: () => void;
}

export default function TaskSummaryModals({
  uiState,
  uiDispatch,
  notes,
  files,
  updates,
  currentTitle,
  currentDescription,
  currentProperty,
  currentUnit,
  currentCategory,
  currentStatus,
  currentPriority,
  currentDueDate,
  currentAssignees,
  currentCollaborators,
  availableTasksForLinking,
  modalEditData,
  editingNote,
  editingFile,
  onNotesChange,
  onFilesChange,
  onUpdatesChange,
  onCurrentTitleChange,
  onCurrentDescriptionChange,
  onCurrentPropertyChange,
  onCurrentUnitChange,
  onCurrentCategoryChange,
  onCurrentStatusChange,
  onCurrentPriorityChange,
  onCurrentDueDateChange,
  onCurrentAssigneesChange,
  onCurrentCollaboratorsChange,
  onLastUpdatedChange,
  syncFileNameAcrossStates,
  getAttachmentData,
  handleStartRenamingAttachment,
  handleSaveAttachmentFileName,
  handleCancelRenamingAttachment,
}: TaskSummaryModalsProps) {
  return (
    <>
      {/* View Note Modal */}
      <ModalTemplate
        open={uiState.modals.viewNote}
        onOpenChange={(open) => {
          if (!open) {
            uiDispatch({ type: "CLOSE_MODAL", payload: "viewNote" });
          }
        }}
        title="Note Details"
        size="sm"
        footer={
          <ModalButtons
            onCancel={() => {
              uiDispatch({ type: "CLOSE_MODAL", payload: "viewNote" });
            }}
            onConfirm={() => {
              if (uiState.viewingNote) {
                uiDispatch({
                  type: "SET_EDITING_NOTE_ID",
                  payload: uiState.viewingNote.id,
                });
                uiDispatch({ type: "CLOSE_MODAL", payload: "viewNote" });
                uiDispatch({ type: "OPEN_MODAL", payload: "addNote" });
              }
            }}
            cancelLabel="Close"
            confirmLabel="Edit"
          />
        }
      >
        {uiState.viewingNote ? (
          <FormLayout>
            <FormSection showDivider={false}>
              <div className="text-[#303030] whitespace-pre-line p-3 bg-gray-50 rounded-lg">
                {uiState.viewingNote.text}
              </div>
              <div className="text-sm text-[#71717A]">
                <span className="font-medium">Author:</span> {uiState.viewingNote.author}
              </div>
              <div className="text-sm text-[#71717A]">
                <span className="font-medium">Date:</span> {uiState.viewingNote.date}
              </div>
            </FormSection>
          </FormLayout>
        ) : null}
      </ModalTemplate>

      {/* Add/Edit Note Modal */}
      <AddNoteModal
        open={uiState.modals.addNote}
        onOpenChange={(open) => {
          if (!open) uiDispatch({ type: "CLOSE_MODAL", payload: "addNote" });
        }}
        onSubmit={(text) => {
          if (uiState.editingNoteId) {
            onNotesChange(
              notes.map((n) =>
                n.id === uiState.editingNoteId
                  ? { ...n, text, date: new Date().toLocaleString() }
                  : n,
              ),
            );
          } else {
            const maxId = notes.length > 0 ? Math.max(...notes.map((n) => n.id)) : 0;
            const newNote: Note = {
              id: maxId + 1,
              text,
              date: new Date().toLocaleString(),
              author: "Julia LoSchiavo",
            };
            onNotesChange([newNote, ...notes]);
          }
          uiDispatch({ type: "CLOSE_MODAL", payload: "addNote" });
        }}
        initialText={editingNote?.text || ""}
        isEditMode={!!uiState.editingNoteId}
        title={uiState.editingNoteId ? "Edit Note" : "Add Note"}
        submitLabel={uiState.editingNoteId ? "Update" : "Add"}
      />

      {/* Add/Edit File Modal */}
      <AddFileModal
        open={uiState.modals.addFile}
        onOpenChange={(open) => {
          if (!open) uiDispatch({ type: "CLOSE_MODAL", payload: "addFile" });
        }}
        onSubmit={(uploadedFiles, category, description) => {
          if (uiState.editingFileId) {
            const oldFile = files.find((f) => f.id === uiState.editingFileId);
            const oldFileName = oldFile?.name || "";
            const newFileName = uploadedFiles[0]?.name || oldFileName;

            syncFileNameAcrossStates(uiState.editingFileId, newFileName);

            onFilesChange(
              files.map((f) =>
                f.id === uiState.editingFileId
                  ? {
                      ...f,
                      category: category || f.category,
                      description,
                    }
                  : f,
              ),
            );
          } else {
            const maxId = files.length > 0 ? Math.max(...files.map((f) => f.id)) : 0;
            const newFiles: File[] = uploadedFiles.map((uf, idx) => ({
              id: maxId + idx + 1,
              name: uf.name,
              url: uf.url,
              uploadedAt: new Date().toLocaleString(),
              category,
              description,
            }));
            onFilesChange([...newFiles, ...files]);
          }
          uiDispatch({ type: "CLOSE_MODAL", payload: "addFile" });
        }}
        initialFiles={
          editingFile
            ? [
                {
                  id: editingFile.id.toString(),
                  name: editingFile.name,
                  size: 0,
                  type: editingFile.name.split('.').pop()?.toLowerCase() || "pdf",
                  url: editingFile.url,
                },
              ]
            : []
        }
        initialCategory={editingFile?.category || ""}
        initialDescription={editingFile?.description || ""}
        isEditMode={!!uiState.editingFileId}
        title={uiState.editingFileId ? "Edit File" : "Add File"}
        submitLabel={uiState.editingFileId ? "Update" : "Add"}
      />

      {/* PDF Viewer Modal for Attachments */}
      {uiState.viewingAttachment && (
        <PdfViewerModal
          open={uiState.modals.pdfViewer}
          onOpenChange={(open) => {
            if (!open) {
              uiDispatch({ type: "CLOSE_MODAL", payload: "pdfViewer" });
            }
          }}
          title={uiState.viewingAttachment.name}
          url={uiState.viewingAttachment.url}
          onRenameClick={handleStartRenamingAttachment}
          isRenaming={uiState.isRenamingAttachment}
          renamingFileName={uiState.renamingAttachmentName}
          onRenamingFileNameChange={(name) =>
            uiDispatch({ type: "SET_RENAMING_ATTACHMENT_NAME", payload: name })
          }
          onSaveFileName={handleSaveAttachmentFileName}
          onCancelRenaming={handleCancelRenamingAttachment}
        />
      )}

      {/* Link Task Modal */}
      <LinkTaskModal
        open={uiState.modals.linkTask}
        onOpenChange={(open) => {
          if (!open) uiDispatch({ type: "CLOSE_MODAL", payload: "linkTask" });
        }}
        availableTasks={availableTasksForLinking}
        onSubmit={(linkedTask) => {
          if (!uiState.linkedTasks.some((t: any) => t.id === linkedTask.id)) {
            uiDispatch({ type: "ADD_LINKED_TASK", payload: linkedTask });
          } else {
            uiDispatch({ type: "CLOSE_MODAL", payload: "linkTask" });
          }
        }}
      />

      {/* Edit Task Details Modal */}
      <EditTaskDetailsModal
        open={uiState.modals.editTaskDetails}
        onOpenChange={(open) => {
          if (!open) uiDispatch({ type: "CLOSE_MODAL", payload: "editTaskDetails" });
        }}
        initialData={{
          title: currentTitle,
          description: currentDescription,
          property: currentProperty,
          unit: currentUnit,
          category: currentCategory,
        }}
        onSubmit={(data: EditTaskDetailsData) => {
          onCurrentTitleChange(data.title);
          onCurrentDescriptionChange(data.description || "");
          onCurrentPropertyChange(data.property);
          onCurrentUnitChange(data.unit);
          onCurrentCategoryChange(data.category);
          uiDispatch({ type: "CLOSE_MODAL", payload: "editTaskDetails" });
        }}
      />

      {/* Create/Edit Task Modal */}
      <CreateTaskModal
        open={uiState.modals.editTask}
        onOpenChange={(open) => {
          if (!open) uiDispatch({ type: "CLOSE_MODAL", payload: "editTask" });
        }}
        variant="withMessageAndAttachments"
        editData={modalEditData}
        onTaskCreated={(taskData: any) => {
          if (taskData.property) {
            onCurrentPropertyChange(taskData.property);
          }
          if (taskData.unit) {
            onCurrentUnitChange(taskData.unit);
          }
          if (taskData.description) {
            onCurrentDescriptionChange(taskData.description);
          }
          if (taskData.title) {
            onCurrentTitleChange(taskData.title);
          }
          if (taskData.category) {
            onCurrentCategoryChange(taskData.category);
          }
          if (taskData.status !== undefined) {
            onCurrentStatusChange(taskData.status);
            onLastUpdatedChange(new Date().toLocaleString());
          }
          if (taskData.priority !== undefined) {
            onCurrentPriorityChange(taskData.priority);
            onLastUpdatedChange(new Date().toLocaleString());
          }
          // Always update dueDate, even if it's null
          onCurrentDueDateChange(taskData.dueDate || null);
          if (taskData.dueDate !== undefined) {
            onLastUpdatedChange(new Date().toLocaleString());
          }
          if (taskData.assignees !== undefined) {
            onCurrentAssigneesChange(taskData.assignees);
          }
          if (taskData.collaborators !== undefined) {
            onCurrentCollaboratorsChange(taskData.collaborators);
          }

          const isTaskUpdate = (taskData as any).message !== undefined;

          if (!isTaskUpdate) {
            const statusMap: { [key: string]: string } = {
              "not_started": "Not Started",
              "in_progress": "In Progress",
              "completed": "Completed",
            };

            const priorityLabel = (taskData as any).priority.charAt(0).toUpperCase() + (taskData as any).priority.slice(1);
            const dueDate = (taskData as any).dueDate ? new Date(taskData.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "No due date";

            const creationFields: any[] = [];

            if (taskData.status) {
              creationFields.push(
                <div key="status">
                  <div className="text-xs font-medium text-[#71717A] uppercase tracking-wider">Status</div>
                  <div className="text-sm text-[#303030] font-medium mt-0.5">{statusMap[(taskData as any).status] || (taskData as any).status}</div>
                </div>
              );
            }

            if (taskData.priority) {
              creationFields.push(
                <div key="priority">
                  <div className="text-xs font-medium text-[#71717A] uppercase tracking-wider">Priority</div>
                  <div className="text-sm text-[#303030] font-medium mt-0.5">{priorityLabel}</div>
                </div>
              );
            }

            if (taskData.dueDate) {
              creationFields.push(
                <div key="dueDate">
                  <div className="text-xs font-medium text-[#71717A] uppercase tracking-wider">Due Date</div>
                  <div className="text-sm text-[#303030] font-medium mt-0.5">{dueDate}</div>
                </div>
              );
            }

            if (taskData.assignees && taskData.assignees.length > 0) {
              creationFields.push(
                <div key="assignees">
                  <div className="text-xs font-medium text-[#71717A] uppercase tracking-wider">Assignees</div>
                  <div className="mt-0.5">
                    <PersonAvatars people={taskData.assignees} type="assignee" />
                  </div>
                </div>
              );
            }

            if (taskData.collaborators && taskData.collaborators.length > 0) {
              creationFields.push(
                <div key="collaborators">
                  <div className="text-xs font-medium text-[#71717A] uppercase tracking-wider">Collaborators</div>
                  <div className="mt-0.5">
                    <PersonAvatars people={taskData.collaborators} type="collaborator" />
                  </div>
                </div>
              );
            }

            if (taskData.files && taskData.files.length > 0) {
              onFilesChange([
                ...taskData.files.map((f: any, idx: number) => ({
                  id: String(f.id || `${f.name}-${idx}`),
                  name: f.name,
                  url: f.url,
                  uploadedAt: new Date().toLocaleString(),
                  category: "",
                  description: "",
                })),
                ...files,
              ]);
            }

            const initialUpdate = {
              id: Math.max(...updates.map(u => typeof u.id === 'number' ? u.id : 0), 0) + 1,
              author: "Julia LoSchiavo",
              authorType: "assignee",
              action: "created this task",
              timestamp: new Date().toLocaleString(),
              ...(creationFields.length > 0 && {
                fieldsDisplay: (
                  <div className={`grid gap-6 mt-3 ${creationFields.length === 1 ? 'grid-cols-1' : creationFields.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                    {creationFields}
                  </div>
                ),
              }),
              ...(taskData.description && {
                details: <div className="text-sm text-[#303030]">{taskData.description}</div>,
              }),
              ...(taskData.files && taskData.files.length > 0 && {
                attachments: taskData.files.map((f: any, idx: number) => getAttachmentData(f, idx)),
                onAttachmentClick: (file: any) => {
                  uiDispatch({ type: "SET_VIEWING_ATTACHMENT", payload: { id: file.id, name: file.name, url: file.url } });
                  uiDispatch({ type: "OPEN_MODAL", payload: "pdfViewer" });
                  uiDispatch({ type: "CANCEL_RENAMING_ATTACHMENT" });
                },
              }),
              icon: <FlagIcon width={16} height={16} />,
              isInitialCreation: true,
            };

            onUpdatesChange([initialUpdate, ...updates]);
            uiDispatch({ type: "CLOSE_MODAL", payload: "editTask" });
            return;
          }
          
          const details: React.ReactNode[] = [];
          let updateIcon = <EditIcon width={16} height={16} />;

          if ((taskData as any).messageBody && (taskData as any).files?.length > 0) {
            updateIcon = <PaperclipIcon width={16} height={16} />;
          } else if ((taskData as any).files && (taskData as any).files.length > 0) {
            updateIcon = <PaperclipIcon width={16} height={16} />;
          } else if ((taskData as any).messageBody) {
            updateIcon = <NoteIcon width={16} height={16} />;
          } else {
            updateIcon = <EditIcon width={16} height={16} />;
          }

          const statusMap: { [key: string]: string } = {
            "not_started": "Not Started",
            "in_progress": "In Progress",
            "completed": "Completed",
          };

          const changedFieldsInfo = (taskData as any).changedFields || [];
          const displayFields: Array<{ label: string; value: any }> = [];

          changedFieldsInfo.forEach((fieldName: string) => {
            switch (fieldName) {
              case "status":
                displayFields.push({
                  label: "Status",
                  value: <TaskStatusBadge status={(statusMap[taskData.status] || taskData.status) as any} />,
                });
                break;
              case "priority":
                displayFields.push({
                  label: "Priority",
                  value: <TaskPriorityBadge priority={(taskData.priority.charAt(0).toUpperCase() + taskData.priority.slice(1)) as any} />,
                });
                break;
              case "dueDate":
                const dueDateStr = taskData.dueDate instanceof Date
                  ? taskData.dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                  : (taskData.dueDate ? taskData.dueDate : "No due date");
                displayFields.push({
                  label: "Due Date",
                  value: dueDateStr,
                });
                break;
              case "assignees": {
                const newAssignees = taskData.newAssignees || taskData.assignees || [];
                if (newAssignees.length > 0) {
                  displayFields.push({
                    label: "Assignees",
                    value: <PersonAvatars people={newAssignees} type="assignee" fallback="None" />,
                  } as any);
                }
                break;
              }
              case "collaborators": {
                const newCollaborators = taskData.newCollaborators || taskData.collaborators || [];
                if (newCollaborators.length > 0) {
                  displayFields.push({
                    label: "Collaborators",
                    value: <PersonAvatars people={newCollaborators} type="collaborator" />,
                  } as any);
                }
                break;
              }
            }
          });

          if (displayFields.length > 0) {
            const gridColsClass = displayFields.length === 1 ? "grid-cols-1" : displayFields.length <= 2 ? "grid-cols-2" : "grid-cols-3";

            details.push(
              <div key="fields">
                <div className={`grid ${gridColsClass} gap-6`}>
                  {displayFields.map((field, idx) => (
                    <div key={idx}>
                      <div className="text-xs font-medium text-[#71717A] uppercase tracking-wider">{field.label}</div>
                      <div className={`mt-0.5 ${typeof field.value === 'string' ? 'text-sm text-[#303030] font-medium' : ''}`}>
                        {field.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          }

          if ((taskData as any).messageBody) {
            details.push(
              <div key="message">
                <div className="text-sm text-[#303030]">{(taskData as any).messageBody}</div>
              </div>
            );
          }

          const attachments = Array.isArray((taskData as any).files)
            ? (taskData as any).files
                .map((file: any) => getAttachmentData(file))
                .filter((file: any) => typeof file?.url === "string" && file.url)
            : undefined;

          if (Array.isArray((taskData as any).files) && (taskData as any).files.length > 0) {
            const renamedFilesFromModal = (taskData as any).files;

            renamedFilesFromModal.forEach((rf: any) => {
              const existingFile = files.find(f => String(f.id) === String(rf.id));
              if (existingFile && existingFile.name !== rf.name) {
                syncFileNameAcrossStates(rf.id, rf.name);
              }
            });

            const renamedFiles = new Map((taskData as any).files.map((f: any) => [String(f.id), f]));
            const existingIds = new Set(files.map((f) => String(f.id)));

            const updatedFiles = files.map((f) => {
              const renamedFile = renamedFiles.get(String(f.id));
              if (renamedFile && renamedFile.name !== f.name) {
                return { ...f, name: renamedFile.name };
              }
              return f;
            });

            const newFiles = (taskData as any).files
              .filter((f: any) => !existingIds.has(String(f.id)))
              .map((f: any, idx: number) => ({
                id: String(f.id || `${f.name}-${idx}`),
                name: f.name,
                url: f.url,
                uploadedAt: new Date().toLocaleString(),
                category: "",
                description: "",
              }));

            onFilesChange([...newFiles, ...updatedFiles]);
          }

          let updateAction = "updated the task";
          const hasMessage = !!(taskData as any).messageBody;
          const hasFiles = Array.isArray((taskData as any).files) && (taskData as any).files.length > 0;
          const hasFieldChanges = Array.isArray((taskData as any).changedFields) && (taskData as any).changedFields.length > 0;

          if (hasFiles && !hasMessage && !hasFieldChanges) {
            updateAction = "uploaded a file";
          } else if (hasMessage && !hasFiles && !hasFieldChanges) {
            updateAction = "updated a message";
          }

          const newUpdate = {
            id: Math.max(...updates.map(u => typeof u.id === 'number' ? u.id : 0), 0) + 1,
            author: "Julia LoSchiavo",
            authorType: "assignee",
            action: updateAction,
            timestamp: new Date().toLocaleString(),
            details: details.length > 0 ? <div className="flex flex-col gap-5">{details}</div> : undefined,
            icon: updateIcon,
            attachments,
            onAttachmentClick: (file: any) => {
              uiDispatch({ type: "SET_VIEWING_ATTACHMENT", payload: { id: String(file.id), name: file.name, url: file.url } });
              uiDispatch({ type: "OPEN_MODAL", payload: "pdfViewer" });
              uiDispatch({ type: "CANCEL_RENAMING_ATTACHMENT" });
            },
          };
          onUpdatesChange([newUpdate, ...updates]);
          uiDispatch({ type: "CLOSE_MODAL", payload: "editTask" });
        }}
      />
    </>
  );
}
