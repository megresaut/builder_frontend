import React, { useState, useEffect } from "react";
import type { UploadedFile } from "@/components/ui/attachment-uploader";
import {
  ModalTemplate,
  ModalButtons,
  ModalField,
} from "@/components/ui/ModalTemplate";
import {
  FileUploadField,
  SelectField,
  TextAreaField,
} from "@/components/forms";
import { FormLayout, FormSection } from "@/components/ui/form-layout";
import PdfViewerModal from "@/components/PdfViewerModal";
import MsgViewerModal from "@/components/MsgViewerModal";
import { parseMsgFile } from "@/utils/parseMsgFile";
import { parseEmlFile } from "@/utils/parseEmlFile";
import type { ParsedMsg } from "@/utils/parseMsgFile";

interface AddFileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (files: UploadedFile[], category: string, description: string) => Promise<void> | void;
  isEditMode?: boolean;
  initialFiles?: UploadedFile[];
  initialCategory?: string;
  initialDescription?: string;
  title?: string;
  submitLabel?: string;
  acceptedFormats?: string;
  maxSize?: number;
}

const CATEGORY_OPTIONS = [
  { label: "Invoice", value: "Invoice" },
  { label: "Contract", value: "Contract" },
  { label: "License", value: "License" },
  { label: "Insurance", value: "Insurance" },
  { label: "Certificate", value: "Certificate" },
  { label: "Agreement", value: "Agreement" },
  { label: "Other", value: "Other" },
];

export const AddFileModal: React.FC<AddFileModalProps> = ({
  open,
  onOpenChange,
  onSubmit,
  isEditMode = false,
  initialFiles = [],
  initialCategory = "",
  initialDescription = "",
  title,
  submitLabel,
  acceptedFormats = ".pdf,.msg,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.txt,.csv,application/vnd.ms-outlook,.eml",
  maxSize = 10 * 1024 * 1024,
}) => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>(initialFiles);
  const [fileCategory, setFileCategory] = useState(initialCategory);
  const [fileDescription, setFileDescription] = useState(initialDescription);
  const [validateFileForm, setValidateFileForm] = useState(false);
  const [viewingFile, setViewingFile] = useState<UploadedFile | null>(null);
  const [viewingFileUrl, setViewingFileUrl] = useState<string | null>(null);
  const [isRenamingFile, setIsRenamingFile] = useState(false);
  const [renamingFileName, setRenamingFileName] = useState("");
  const [msgViewer, setMsgViewer] = useState<{
    isOpen: boolean;
    title: string;
    data: ParsedMsg | null;
    loading: boolean;
    error: string | null;
  }>({ isOpen: false, title: "", data: null, loading: false, error: null });

  useEffect(() => {
    if (open) {
      setUploadedFiles(Array.isArray(initialFiles) ? initialFiles : []);
      setFileCategory(initialCategory || "");
      setFileDescription(initialDescription || "");
      setValidateFileForm(false);
    }
  }, [open]); // Only sync when modal opens

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      if (viewingFileUrl && viewingFileUrl.startsWith("blob:")) {
        URL.revokeObjectURL(viewingFileUrl);
      }
    };
  }, [viewingFileUrl]);

  const handleSubmit = async () => {
    if (uploadedFiles.length === 0) {
      setValidateFileForm(true);
      return;
    }
    await onSubmit(uploadedFiles, fileCategory, fileDescription);
    resetForm();
  };

  const handleCancel = () => {
    resetForm();
    onOpenChange(false);
  };

  const resetForm = () => {
    setUploadedFiles([]);
    setFileCategory("");
    setFileDescription("");
    setValidateFileForm(false);
    setIsRenamingFile(false);
    setRenamingFileName("");
    setViewingFile(null);
    if (viewingFileUrl) {
      URL.revokeObjectURL(viewingFileUrl);
      setViewingFileUrl(null);
    }
    setMsgViewer({ isOpen: false, title: "", data: null, loading: false, error: null });
  };

  const handleStartRenaming = () => {
    if (viewingFile) {
      setRenamingFileName(viewingFile.name);
      setIsRenamingFile(true);
    }
  };

  const handleSaveFileName = () => {
    if (viewingFile && renamingFileName.trim()) {
      setUploadedFiles(
        uploadedFiles.map((f) =>
          f.id === viewingFile.id
            ? { ...f, name: renamingFileName.trim() }
            : f,
        ),
      );
      setViewingFile({
        ...viewingFile,
        name: renamingFileName.trim(),
      });
      setIsRenamingFile(false);
      setRenamingFileName("");
    }
  };

  const handleCancelRenaming = () => {
    setIsRenamingFile(false);
    setRenamingFileName("");
  };

  return (
    <ModalTemplate
      open={open}
      onOpenChange={(openState) => {
        if (!openState) {
          resetForm();
        }
        onOpenChange(openState);
      }}
      title={title || (isEditMode ? "Edit File" : "Add File")}
      size="sm"
      onClose={resetForm}
      footer={
        <ModalButtons
          onCancel={handleCancel}
          onConfirm={handleSubmit}
          cancelLabel="Cancel"
          confirmLabel={submitLabel || (isEditMode ? "Update" : "Add")}
          confirmDisabled={isEditMode ? false : uploadedFiles.length === 0}
        />
      }
    >
      <FormLayout>
        <FormSection showDivider={false}>
          <ModalField spacing="tight">
            <FileUploadField
              label="File"
              required={true}
              description=""
              validate={validateFileForm}
              files={uploadedFiles}
              onFilesAdded={(newFiles) => {
                if (newFiles.length > 0) {
                  setUploadedFiles([newFiles[0]]);
                  setValidateFileForm(false);
                }
              }}
              onFileRemoved={(fileId) => {
                setUploadedFiles(
                  uploadedFiles.filter((f) => f.id !== fileId),
                );
              }}
              onViewFile={(file) => {
                const fileWithMeta = file as UploadedFile & {
                  url?: string;
                  storage_path?: string;
                  file_name?: string;
                  file_type?: string;
                };
                const fileName =
                  file.name ?? fileWithMeta.file_name ?? "";
                const isMsgFile =
                  fileName.toLowerCase().endsWith(".msg") ||
                  fileWithMeta.file_type === "application/vnd.ms-outlook";
                const isEmlFile =
                  fileName.toLowerCase().endsWith(".eml") ||
                  fileWithMeta.file_type === "message/rfc822";
                const isMessageFile = isMsgFile || isEmlFile;

                if (isMessageFile) {
                  const displayTitle = fileName || "Message";
                  const parseMessage = isEmlFile ? parseEmlFile : parseMsgFile;
                  const openMsgViewer = async (blob: Blob) => {
                    setMsgViewer({
                      isOpen: true,
                      title: displayTitle,
                      data: null,
                      loading: true,
                      error: null,
                    });
                    try {
                      const data = await parseMessage(blob);
                      setMsgViewer((prev) => ({
                        ...prev,
                        loading: false,
                        data,
                        error: null,
                      }));
                    } catch (err) {
                      setMsgViewer((prev) => ({
                        ...prev,
                        loading: false,
                        error:
                          err instanceof Error ? err.message : "Failed to parse message",
                      }));
                    }
                  };
                  if (file.file) {
                    openMsgViewer(file.file);
                    return;
                  }
                  if (fileWithMeta.url) {
                    fetch(fileWithMeta.url, { credentials: "include" })
                      .then((r) => r.blob())
                      .then(openMsgViewer)
                      .catch(() =>
                        setMsgViewer((prev) => ({
                          ...prev,
                          loading: false,
                          error: "Failed to load file",
                        }))
                      );
                    return;
                  }
                  if (fileWithMeta.storage_path) {
                    setMsgViewer({
                      isOpen: true,
                      title: displayTitle,
                      data: null,
                      loading: true,
                      error: null,
                    });
                    fetch(
                      `/api/files?key=${encodeURIComponent(fileWithMeta.storage_path)}`,
                      { credentials: "include" }
                    )
                      .then((res) => {
                        if (!res.ok) throw new Error("Failed to load");
                        return res.blob();
                      })
                      .then(openMsgViewer)
                      .catch(() =>
                        setMsgViewer((prev) => ({
                          ...prev,
                          loading: false,
                          error: "Failed to load file",
                        }))
                      );
                    return;
                  }
                  const attachmentId = file.id ? parseInt(file.id, 10) : null;
                  if (attachmentId && !isNaN(attachmentId)) {
                    setMsgViewer({
                      isOpen: true,
                      title: displayTitle,
                      data: null,
                      loading: true,
                      error: null,
                    });
                    fetch(`/api/maintenance/attachments/${attachmentId}`, {
                      credentials: "include",
                    })
                      .then((res) => {
                        if (!res.ok) throw new Error("Failed to load");
                        return res.blob();
                      })
                      .then(openMsgViewer)
                      .catch(() =>
                        setMsgViewer((prev) => ({
                          ...prev,
                          loading: false,
                          error: "Failed to load attachment",
                        }))
                      );
                  }
                  return;
                }

                // Non-message (.msg/.eml): use PDF / URL viewer
                if (file.file) {
                  const url = URL.createObjectURL(file.file);
                  setViewingFileUrl(url);
                  setViewingFile(file);
                  return;
                }
                if (fileWithMeta.url) {
                  setViewingFileUrl(fileWithMeta.url);
                  setViewingFile(file);
                  return;
                }
                if (fileWithMeta.storage_path) {
                  (async () => {
                    try {
                      const res = await fetch(
                        `/api/files?key=${encodeURIComponent(fileWithMeta.storage_path)}`,
                        { credentials: "include" }
                      );
                      if (!res.ok) {
                        alert("Failed to load PDF");
                        return;
                      }
                      const blob = await res.blob();
                      const url = URL.createObjectURL(blob);
                      setViewingFileUrl(url);
                      setViewingFile(file);
                    } catch (error) {
                      console.error("Error loading PDF:", error);
                      alert("Failed to load PDF");
                    }
                  })();
                  return;
                }
                const attachmentId = file.id ? parseInt(file.id, 10) : null;
                if (attachmentId && !isNaN(attachmentId)) {
                  (async () => {
                    try {
                      const res = await fetch(
                        `/api/maintenance/attachments/${attachmentId}`,
                        { credentials: "include" }
                      );
                      if (!res.ok) {
                        alert("Failed to load attachment");
                        return;
                      }
                      const blob = await res.blob();
                      const url = URL.createObjectURL(blob);
                      setViewingFileUrl(url);
                      setViewingFile(file);
                    } catch (error) {
                      console.error("Error loading attachment:", error);
                      alert("Failed to load attachment");
                    }
                  })();
                }
              }}
              onFileRenamed={(fileId, newName) => {
                setUploadedFiles(
                  uploadedFiles.map((f) =>
                    f.id === fileId ? { ...f, name: newName } : f,
                  ),
                );
              }}
              accept={acceptedFormats}
              maxFiles={1}
              maxSize={maxSize}
              variant="single"
              disableRemove={isEditMode}
            />
          </ModalField>

          {/* <SelectField
            label="Category"
            value={fileCategory}
            onChange={(value) => setFileCategory(value as string)}
            options={CATEGORY_OPTIONS}
            placeholder="Select a category"
          /> */}

          <TextAreaField
            label="Description"
            value={fileDescription}
            onChange={(e) => setFileDescription(e.target.value)}
            placeholder="Enter file description (optional)"
            rows={3}
          />
        </FormSection>
      </FormLayout>

      <PdfViewerModal
        open={viewingFile !== null}
        onOpenChange={(open) => {
          if (!open) {
            if (viewingFileUrl && viewingFileUrl.startsWith("blob:")) {
              URL.revokeObjectURL(viewingFileUrl);
            }
            setViewingFile(null);
            setViewingFileUrl(null);
            setIsRenamingFile(false);
            setRenamingFileName("");
          }
        }}
        title={viewingFile?.name || "File Preview"}
        url={viewingFileUrl || (viewingFile?.file ? URL.createObjectURL(viewingFile.file) : (viewingFile as UploadedFile & { url?: string })?.url) || null}
        onRenameClick={handleStartRenaming}
        isRenaming={isRenamingFile}
        renamingFileName={renamingFileName}
        onRenamingFileNameChange={setRenamingFileName}
        onSaveFileName={handleSaveFileName}
        onCancelRenaming={handleCancelRenaming}
      />

      <MsgViewerModal
        open={msgViewer.isOpen}
        onOpenChange={(open) =>
          setMsgViewer((prev) => ({ ...prev, isOpen: open }))
        }
        title={msgViewer.title}
        data={msgViewer.data}
        loading={msgViewer.loading}
        error={msgViewer.error}
      />
    </ModalTemplate>
  );
};

export default AddFileModal;
