import React, { useRef, useState } from "react";
import { X, Upload, File, Eye } from "lucide-react";

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  file?: File;
}

interface AttachmentUploaderProps {
  onFilesAdded?: (files: UploadedFile[]) => void;
  onFileRemoved?: (fileId: string) => void;
  onViewFile?: (file: UploadedFile) => void;
  onFileRenamed?: (fileId: string, newName: string) => void;
  files?: UploadedFile[];
  accept?: string;
  maxFiles?: number;
  maxSize?: number; // in bytes
  disabled?: boolean;
  error?: boolean;
  placeholder?: string;
  variant?: "default" | "single";
}

/**
 * AttachmentUploader - File upload dropzone with file list
 *
 * Provides drag-and-drop file upload with file list management.
 * Used for bills, work orders, invoices, and other documents.
 *
 * Features:
 * - Drag-and-drop zone
 * - Click to browse files
 * - File list with remove buttons
 * - File size validation
 * - File count validation
 * - Customizable accepted file types
 * - Disabled state
 * - Error highlighting
 * - Optional filename editing
 * - Optional single-file variant with conditional dropzone visibility
 *
 * @param onFilesAdded - Callback when files are added
 * @param onFileRemoved - Callback when file is removed (pass fileId)
 * @param onViewFile - Callback when View button is clicked (pass UploadedFile)
 * @param onFileRenamed - Callback when file is renamed (pass fileId and newName)
 * @param files - Current list of uploaded files
 * @param accept - Accepted file types (e.g., "image/*,.pdf")
 * @param maxFiles - Maximum number of files (default: 10)
 * @param maxSize - Maximum file size in bytes (default: 10MB)
 * @param disabled - Disable upload
 * @param error - Show error styling
 * @param placeholder - Custom placeholder text
 * @param variant - "default" for multiple files, "single" for single file with dropzone toggle
 *
 * Example:
 * ```tsx
 * const [files, setFiles] = useState<UploadedFile[]>([]);
 *
 * <AttachmentUploader
 *   files={files}
 *   onFilesAdded={(newFiles) => {
 *     setFiles([...files, ...newFiles]);
 *   }}
 *   onFileRemoved={(fileId) => {
 *     setFiles(files.filter(f => f.id !== fileId));
 *   }}
 *   accept="image/*,.pdf"
 *   maxFiles={5}
 *   maxSize={5 * 1024 * 1024} // 5MB
 * />
 *
 * // Single file variant with editable names
 * <AttachmentUploader
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
export const AttachmentUploader: React.FC<AttachmentUploaderProps> = ({
  onFilesAdded,
  onFileRemoved,
  onViewFile,
  onFileRenamed,
  files = [],
  accept = ".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif",
  maxFiles = 10,
  maxSize = 10 * 1024 * 1024, // 10MB
  disabled = false,
  error = false,
  placeholder = "Drag and drop files here, or click to browse",
  variant = "default",
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string>();
  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const [editingFileName, setEditingFileName] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isViewableFile = (file: UploadedFile): boolean => {
    const viewableTypes = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    const viewableExtensions = [".pdf", ".jpg", ".jpeg", ".png", ".gif", ".webp"];

    const isViewableType = viewableTypes.includes(file.type);
    const isViewableExt = viewableExtensions.some((ext) =>
      file.name.toLowerCase().endsWith(ext)
    );

    return isViewableType || isViewableExt;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  const processFiles = (fileList: FileList | null) => {
    if (!fileList || disabled) return;

    setUploadError(undefined);
    const newFiles: UploadedFile[] = [];

    // Check total file count
    if (files.length + fileList.length > maxFiles) {
      setUploadError(`Maximum ${maxFiles} files allowed`);
      return;
    }

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];

      // Check file size
      if (file.size > maxSize) {
        setUploadError(
          `"${file.name}" exceeds maximum size of ${formatFileSize(maxSize)}`,
        );
        continue;
      }

      newFiles.push({
        id: `${Date.now()}-${i}`,
        name: file.name,
        size: file.size,
        type: file.type,
        file,
      });
    }

    if (newFiles.length > 0 && onFilesAdded) {
      onFilesAdded(newFiles);
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(e.currentTarget.files);
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveFile = (fileId: string) => {
    if (onFileRemoved) {
      onFileRemoved(fileId);
    }
  };

  const handleStartEditingFileName = (file: UploadedFile) => {
    setEditingFileId(file.id);
    setEditingFileName(file.name);
  };

  const handleSaveFileName = (fileId: string) => {
    if (editingFileName.trim() && onFileRenamed) {
      onFileRenamed(fileId, editingFileName.trim());
    }
    setEditingFileId(null);
    setEditingFileName("");
  };

  const handleCancelEditingFileName = () => {
    setEditingFileId(null);
    setEditingFileName("");
  };

  const shouldShowDropzone = variant === "default" || files.length === 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {/* Dropzone - conditionally rendered based on variant and file presence */}
      {shouldShowDropzone && (
        <div
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
          style={{
            borderColor: error
              ? "#ef4444"
              : isDragging
                ? "var(--color-button-primary)"
                : "var(--color-border-light)",
            backgroundColor: isDragging ? "#f0f9ff" : "rgba(255, 255, 255, 1)",
            borderWidth: error ? "2px" : "1px",
            borderStyle: "dashed",
            borderRadius: "8px",
            padding: "32px 24px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            cursor: disabled ? "not-allowed" : "pointer",
            opacity: disabled ? 0.6 : 1,
            transition: "all 0.2s",
          }}
        >
          <Upload
            width={32}
            height={32}
            style={{
              color: isDragging ? "var(--color-button-primary)" : "var(--color-text-muted)",
            }}
          />
          <div style={{ textAlign: "center" }}>
            <p
              style={{
                fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                fontSize: "14px",
                fontWeight: 500,
                color: "var(--color-text-primary)",
                margin: 0,
                marginBottom: "4px",
              }}
            >
              {placeholder}
            </p>
            <p
              style={{
                fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                fontSize: "12px",
                fontWeight: 400,
                color: "var(--color-text-muted)",
                margin: 0,
              }}
            >
              {formatFileSize(maxSize)} max per file
            </p>
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={accept}
        onChange={handleFileInputChange}
        style={{ display: "none" }}
      />

      {/* Error message */}
      {uploadError && (
        <div
          style={{
            backgroundColor: "#fef2f2",
            borderColor: "#ef4444",
            borderWidth: "1px",
            borderStyle: "solid",
            borderRadius: "6px",
            padding: "8px 12px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <div
            style={{
              fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif",
              fontSize: "12px",
              fontWeight: 400,
              color: "#7f1d1d",
            }}
          >
            {uploadError}
          </div>
        </div>
      )}

      {/* File list */}
      {files.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {files.map((file) => (
            <div
              key={file.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px",
                backgroundColor: "var(--color-bg-subtle)",
                borderColor: "var(--color-border-light)",
                borderWidth: "1px",
                borderStyle: "solid",
                borderRadius: "6px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: 0 }}>
                <File
                  width={20}
                  height={20}
                  style={{ color: "var(--color-text-muted)", flexShrink: 0 }}
                />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p
                    style={{
                      fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                      fontSize: "14px",
                      fontWeight: 400,
                      color: "var(--color-text-primary)",
                      margin: 0,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {file.name}
                  </p>
                  <p
                    style={{
                      fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                      fontSize: "12px",
                      fontWeight: 400,
                      color: "var(--color-text-muted)",
                      margin: 0,
                      marginTop: "2px",
                    }}
                  >
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0, marginLeft: "12px" }}>
                {isViewableFile(file) && onViewFile && (
                  <button
                    onClick={() => onViewFile(file)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: "4px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--color-button-primary)",
                      flexShrink: 0,
                      transition: "opacity 0.2s",
                    }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = "0.7")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = "1")}
                    aria-label={`View ${file.name}`}
                    title="View document"
                  >
                    <Eye width={18} height={18} />
                  </button>
                )}
                <button
                  onClick={() => handleRemoveFile(file.id)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "4px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--color-text-muted)",
                    flexShrink: 0,
                    transition: "opacity 0.2s",
                  }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = "0.7")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = "1")}
                  aria-label={`Remove ${file.name}`}
                  title="Remove file"
                >
                  <X width={18} height={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

AttachmentUploader.displayName = "AttachmentUploader";
