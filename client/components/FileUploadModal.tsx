import { useState, useRef } from "react";
import {
  ModalTemplate,
  ModalButtons,
} from "@/components/ui/ModalTemplate";
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
}

export default function FileUploadModal({
  open,
  onOpenChange,
  title = "Upload Document",
}: FileUploadModalProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: React.DragEvent) => {
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
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
  };

  const handleFiles = (files: File[]) => {
    console.log("Files selected:", files);
    onOpenChange(false);
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const handleUpload = () => {
    console.log("Upload initiated");
    onOpenChange(false);
  };

  return (
    <ModalTemplate
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      size="lg"
      footer={
        <ModalButtons
          onCancel={handleCancel}
          onConfirm={handleUpload}
          cancelLabel="Cancel"
          confirmLabel="Upload"
        />
      }
    >
      <div
        className={cn(
          "border-dashed border-2 rounded-lg bg-white p-8 flex flex-col items-center justify-center transition-colors",
          isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300",
        )}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center">
          <div className="flex flex-col items-center p-2.5 text-center">
            <div
              style={{
                color: "#303030",
                fontSize: "16px",
                fontWeight: 400,
                lineHeight: "1.4",
              }}
            >
              Choose a file or drag & drop it here
            </div>
            <div
              style={{
                color: "#303030",
                fontSize: "16px",
                fontWeight: 400,
                lineHeight: "1.4",
                marginTop: "8px",
              }}
            >
              JPEG, PNG and PDF formats, up to 50 MB.
            </div>
          </div>

          <button
            onClick={handleBrowseClick}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginTop: "12px",
              paddingLeft: "12px",
              paddingRight: "12px",
              paddingTop: "6px",
              paddingBottom: "6px",
              borderRadius: "8px",
              backgroundColor: "#fbfbfb",
              border: "1px solid #dadada",
              boxShadow: "0px 1px 3px rgba(0,0,0,0.03)",
              cursor: "pointer",
              transition: "background-color 0.2s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#f0f0f0")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "#fbfbfb")
            }
          >
            <Upload style={{ width: "16px", height: "16px" }} />
            <span
              style={{
                color: "#303030",
                fontSize: "16px",
                fontWeight: 400,
                lineHeight: "1.4",
                letterSpacing: "-0.32px",
              }}
            >
              Browse Files
            </span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".jpeg,.jpg,.png,.pdf"
            onChange={handleFileSelect}
            multiple
          />
        </div>

        <div
          style={{
            minHeight: "100px",
            marginTop: "24px",
            width: "100%",
          }}
        />
      </div>
    </ModalTemplate>
  );
}
