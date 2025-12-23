import React from "react";
import { FieldShell } from "./FieldShell";
import { AttachmentUploader, UploadedFile } from "@/components/ui/attachment-uploader";

interface FileUploadFieldProps {
  label: string;
  required?: boolean;
  description?: string;
  error?: string;
  id?: string;
  files?: UploadedFile[];
  onFilesAdded?: (files: UploadedFile[]) => void;
  onFileRemoved?: (fileId: string) => void;
  disabled?: boolean;
  accept?: string;
  maxFiles?: number;
  maxSize?: number;
  placeholder?: string;
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
 *
 * @param label - Field label (required)
 * @param required - Show required asterisk
 * @param description - Helper text
 * @param error - Error message
 * @param id - HTML id attribute
 * @param files - Current list of uploaded files
 * @param onFilesAdded - Callback when files are added
 * @param onFileRemoved - Callback when file is removed
 * @param disabled - Disable upload
 * @param accept - Accepted file types (e.g., "image/*,.pdf")
 * @param maxFiles - Maximum number of files (default: 10)
 * @param maxSize - Maximum file size in bytes (default: 10MB)
 * @param placeholder - Custom placeholder text
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
  disabled = false,
  accept = ".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif",
  maxFiles = 10,
  maxSize = 10 * 1024 * 1024, // 10MB
  placeholder = "Drag and drop files here, or click to browse",
}) => {
  return (
    <FieldShell
      label={label}
      required={required}
      description={description}
      error={error}
      disabled={disabled}
      htmlFor={id}
    >
      <AttachmentUploader
        files={files}
        onFilesAdded={onFilesAdded}
        onFileRemoved={onFileRemoved}
        accept={accept}
        maxFiles={maxFiles}
        maxSize={maxSize}
        disabled={disabled}
        error={!!error}
        placeholder={placeholder}
      />
    </FieldShell>
  );
};

FileUploadField.displayName = "FileUploadField";
