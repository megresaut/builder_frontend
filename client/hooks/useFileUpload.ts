import { useState, useCallback } from "react";
import type { UploadedFile } from "@/components/ui/attachment-uploader";

interface UseFileUploadResult {
  files: UploadedFile[];
  selectedFileForView: UploadedFile | null;
  isViewFileOpen: boolean;
  isRenamingFile: boolean;
  renamingFileName: string;
  addFiles: (newFiles: UploadedFile[]) => void;
  removeFile: (fileId: string) => void;
  viewFile: (file: UploadedFile) => void;
  closeViewFile: () => void;
  startRenaming: (file: UploadedFile) => void;
  updateRenamingFileName: (name: string) => void;
  saveFileName: () => void;
  cancelRenaming: () => void;
  cleanup: () => void;
  reset: () => void;
}

/**
 * useFileUpload - Manage file uploads with PDF viewer and rename functionality
 *
 * Handles:
 * - File state management
 * - Blob URL creation and cleanup
 * - PDF viewer modal state
 * - File renaming in modal
 *
 * Usage:
 * ```tsx
 * const fileUpload = useFileUpload();
 *
 * <FileUploadField
 *   files={fileUpload.files}
 *   onFilesAdded={fileUpload.addFiles}
 *   onFileRemoved={fileUpload.removeFile}
 *   onViewFile={fileUpload.viewFile}
 *   onFileRenamed={fileUpload.saveFileName}
 * />
 * ```
 */
export function useFileUpload(): UseFileUploadResult {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [selectedFileForView, setSelectedFileForView] =
    useState<UploadedFile | null>(null);
  const [isViewFileOpen, setIsViewFileOpen] = useState(false);
  const [isRenamingFile, setIsRenamingFile] = useState(false);
  const [renamingFileName, setRenamingFileName] = useState("");

  const addFiles = useCallback((newFiles: UploadedFile[]) => {
    // Create blob URLs for newly added files
    const filesWithUrls = newFiles.map((file) => ({
      ...file,
      url: file.url || (file.file ? URL.createObjectURL(file.file) : undefined),
    }));
    setFiles((prev) => [...prev, ...filesWithUrls]);
  }, []);

  const removeFile = useCallback((fileId: string) => {
    setFiles((prev) => {
      const fileToRemove = prev.find((f) => f.id === fileId);
      if (fileToRemove?.url && fileToRemove.url.startsWith("blob:")) {
        try {
          URL.revokeObjectURL(fileToRemove.url);
        } catch {
          // ignore
        }
      }
      return prev.filter((f) => f.id !== fileId);
    });
  }, []);

  const viewFile = useCallback((file: UploadedFile) => {
    // Create blob URL if file doesn't have one yet
    let fileUrl = file.url;
    if (!fileUrl && file.file) {
      fileUrl = URL.createObjectURL(file.file);
    }
    setSelectedFileForView({ ...file, url: fileUrl });
    setIsViewFileOpen(true);
    setIsRenamingFile(false);
  }, []);

  const closeViewFile = useCallback(() => {
    setIsViewFileOpen(false);
    setSelectedFileForView(null);
    setIsRenamingFile(false);
    setRenamingFileName("");
  }, []);

  const startRenaming = useCallback((file: UploadedFile) => {
    setRenamingFileName(file.name);
    setIsRenamingFile(true);
  }, []);

  const updateRenamingFileName = useCallback((name: string) => {
    setRenamingFileName(name);
  }, []);

  const saveFileName = useCallback(() => {
    if (selectedFileForView && renamingFileName.trim()) {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === selectedFileForView.id
            ? { ...f, name: renamingFileName.trim() }
            : f,
        ),
      );
      setSelectedFileForView({
        ...selectedFileForView,
        name: renamingFileName.trim(),
      });
      setIsRenamingFile(false);
    }
  }, [selectedFileForView, renamingFileName]);

  const cancelRenaming = useCallback(() => {
    setIsRenamingFile(false);
    setRenamingFileName("");
  }, []);

  const cleanup = useCallback(() => {
    files.forEach((file) => {
      if (file.url && file.url.startsWith("blob:")) {
        try {
          URL.revokeObjectURL(file.url);
        } catch {
          // ignore
        }
      }
    });
  }, [files]);

  const reset = useCallback(() => {
    cleanup();
    setFiles([]);
    setIsViewFileOpen(false);
    setSelectedFileForView(null);
    setIsRenamingFile(false);
    setRenamingFileName("");
  }, [cleanup]);

  return {
    files,
    selectedFileForView,
    isViewFileOpen,
    isRenamingFile,
    renamingFileName,
    addFiles,
    removeFile,
    viewFile,
    closeViewFile,
    startRenaming,
    updateRenamingFileName,
    saveFileName,
    cancelRenaming,
    cleanup,
    reset,
  };
}
