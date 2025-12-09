import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { X, Upload } from "lucide-react";
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
    // Handle file upload logic here
    console.log("Files selected:", files);
    // You can add your upload logic here
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[997px] p-0 bg-white rounded-2xl">
        <div className="relative">
          {/* Close Button */}
          <button
            onClick={() => onOpenChange(false)}
            className="absolute right-8 top-3 z-20 flex items-center justify-center w-[18px] h-[18px] hover:opacity-70 transition-opacity"
          >
            <X className="w-[18px] h-[18px]" />
          </button>

          {/* Content */}
          <div className="px-8 pt-5 pb-10">
            <DialogTitle className="sr-only">{title}</DialogTitle>
            
            {/* Upload Area */}
            <div className="w-full">
              <div
                className={cn(
                  "border-dashed border rounded-lg bg-white p-7 flex flex-col items-center justify-center transition-colors",
                  isDragging
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-400"
                )}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <div className="flex flex-col items-center">
                  <div className="flex flex-col items-center p-2.5 text-center">
                    <div className="text-[#09090b] text-base font-normal leading-none">
                      Choose a file or drag & drop it here
                    </div>
                    <div className="text-[#09090b] text-base font-normal leading-none mt-2">
                      JPEG, PNG and PDF formats, up to 50 MB.
                    </div>
                  </div>

                  <button
                    onClick={handleBrowseClick}
                    className="flex items-center gap-2 mt-3 px-3 py-[7px] rounded-lg bg-[#fbfbfb] border border-[#dadada] shadow-[0px_1px_3px_rgba(0,0,0,0.03)] hover:bg-gray-100 transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    <span className="text-[#303030] text-base font-normal leading-[1.4] tracking-[-0.32px]">
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

                {/* Spacer */}
                <div className="min-h-[124px] mt-6 w-full" />
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
