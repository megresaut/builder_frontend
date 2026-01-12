import React from "react";
import { FieldShell } from "./FieldShell";
import {
  AttachmentUploader,
  UploadedFile,
} from "@/components/ui/attachment-uploader";

interface FileUploadFieldProps {
  label: string;
  required?: boolean;
  description?: string;
  error?: string;
  id?: string;
  files?: UploadedFile[];
  onFilesAdded?: (files: UploadedFile[]) => void;
  onFileRemoved?: (fileId: string) => void;
  onViewFile?: (file: UploadedFile) => void;
  onFileRenamed?: (fileId: string, newName: string) => void;
  disabled?: boolean;
  accept?: string;
  maxFiles?: number;
  maxSize?: number;
  placeholder?: string;
  variant?: "default" | "single";
  validate?: boolean;
  disableRemove?: boolean;
  disableInlineRename?: boolean;
}

/**
 * FileUploadField - File upload with drag-and-drop using FieldShell wrapper
 *
 * Composed of FieldShell + AttachmentUploader for consistent file upload styling.
 * Provides drag-and-drop, file list management, and validation.
 *
 * Features:
 * - Drag-and-drop file upload
 * - Click to browse files
 * - File list with remove buttons
 * - File size validation
 * - File count validation
 * - Customizable accepted file types
 * - Disabled state
 * - Error highlighting
 * - Optional single-file variant with dropzone toggle and filename editing
 *
 * @param label - Field label (required)
 * @param required - Show required asterisk
 * @param description - Helper text
 * @param error - Error message
 * @param id - HTML id attribute
 * @param files - Current list of uploaded files
 * @param onFilesAdded - Callback when files are added
 * @param onFileRemoved - Callback when file is removed
 * @param onViewFile - Callback when View button is clicked
 * @param onFileRenamed - Callback when file is renamed (single variant only)
 * @param disabled - Disable upload
 * @param accept - Accepted file types (e.g., "image/*,.pdf")
 * @param maxFiles - Maximum number of files (default: 10)
 * @param maxSize - Maximum file size in bytes (default: 10MB)
 * @param placeholder - Custom placeholder text
 * @param variant - "default" for multiple files, "single" for single file with dropzone toggle
 *
 * Example:
 * ```tsx
 * <FileUploadField
 *   label="Attachments"
 *   description="Upload invoices, receipts, or W-9 forms"
 *   files={files}
 *   onFilesAdded={(newFiles) => setFiles([...files, ...newFiles])}
 *   onFileRemoved={(fileId) => setFiles(files.filter(f => f.id !== fileId))}
 *   accept=".pdf,.doc,.docx,.jpg,.png"
 *   maxFiles={5}
 *   maxSize={5 * 1024 * 1024} // 5MB
 * />
 *
 * // Single file variant with editable names
 * <FileUploadField
 *   label="Document"
 *   variant="single"
 *   files={files}
 *   onFilesAdded={(newFiles) => setFiles(newFiles)}
 *   onFileRemoved={(fileId) => setFiles([])}
 *   onFileRenamed={(fileId, newName) => {
 *     setFiles(files.map(f => f.id === fileId ? { ...f, name: newName } : f))
 *   }}
 * />
 * ```
 */
export const FileUploadField: React.FC<FileUploadFieldProps> = ({
  label,
  required = false,
  description,
  error,
  id,
  files = [],
  onFilesAdded,
  onFileRemoved,
  onViewFile,
  onFileRenamed,
  disabled = false,
  accept = ".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif",
  maxFiles = 10,
  maxSize = 10 * 1024 * 1024, // 10MB
  placeholder = "Drag and drop files here, or click to browse",
  variant = "default",
  validate = false,
  disableRemove = false,
  disableInlineRename = false,
}) => {
  return (
    <FieldShell
      label={label}
      required={required}
      description={description}
      error={error}
      disabled={disabled}
      htmlFor={id}
      value={files.length > 0 ? files.length : ""}
      validate={validate}
    >
      <AttachmentUploader
        files={files}
        onFilesAdded={onFilesAdded}
        onFileRemoved={onFileRemoved}
        onViewFile={onViewFile}
        onFileRenamed={onFileRenamed}
        accept={accept}
        maxFiles={maxFiles}
        maxSize={maxSize}
        disabled={disabled}
        error={!!error}
        placeholder={placeholder}
        variant={variant}
        disableRemove={disableRemove}
        disableInlineRename={disableInlineRename}
      />
    </FieldShell>
  );
};

FileUploadField.displayName = "FileUploadField";
