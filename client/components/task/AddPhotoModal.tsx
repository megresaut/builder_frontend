import React, { useState, useRef, useEffect, useCallback } from "react";
import { ModalTemplate, ModalButtons } from "@/components/ui/ModalTemplate";
import type { PhotoLabel } from "@/components/PhotoGallery";
import { cn } from "@/lib/utils";

export interface PhotoUpload {
  /** Stable client-side key for list rendering */
  key: string;
  file: File;
  /** blob: preview URL — caller must not revoke; modal revokes on close */
  preview: string;
}

interface AddPhotoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * Called when the user confirms. Modal handles file reading and preview
   * generation; caller is responsible for the actual API upload.
   * Photos are raw images — do NOT convert to PDF.
   */
  onSubmit: (
    photos: PhotoUpload[],
    label: PhotoLabel | null,
    caption: string,
  ) => Promise<void>;
  /** Show a loading spinner on the confirm button while uploading */
  loading?: boolean;
}

const LABEL_OPTIONS: Array<{
  value: PhotoLabel;
  text: string;
  active: string;
  inactive: string;
}> = [
  {
    value: "before",
    text: "Before",
    active: "bg-orange-500 text-white border-orange-500",
    inactive: "bg-white text-orange-700 border-orange-300 hover:border-orange-400",
  },
  {
    value: "during",
    text: "During",
    active: "bg-blue-500 text-white border-blue-500",
    inactive: "bg-white text-blue-700 border-blue-300 hover:border-blue-400",
  },
  {
    value: "after",
    text: "After",
    active: "bg-emerald-500 text-white border-emerald-500",
    inactive: "bg-white text-emerald-700 border-emerald-300 hover:border-emerald-400",
  },
  {
    value: "other",
    text: "Other",
    active: "bg-zinc-500 text-white border-zinc-500",
    inactive: "bg-white text-zinc-600 border-zinc-300 hover:border-zinc-400",
  },
];

const MAX_FILES = 20;
const MAX_SIZE_MB = 20;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
const ACCEPTED = "image/jpeg,image/png,image/gif,image/webp,image/heic,image/heif";

export const AddPhotoModal: React.FC<AddPhotoModalProps> = ({
  open,
  onOpenChange,
  onSubmit,
  loading = false,
}) => {
  const [photos, setPhotos] = useState<PhotoUpload[]>([]);
  const [label, setLabel] = useState<PhotoLabel | null>(null);
  const [caption, setCaption] = useState("");
  const [dragging, setDragging] = useState(false);
  const [sizeError, setSizeError] = useState<string | null>(null);
  const [validateError, setValidateError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset on open
  useEffect(() => {
    if (open) {
      setPhotos([]);
      setLabel(null);
      setCaption("");
      setDragging(false);
      setSizeError(null);
      setValidateError(false);
    }
  }, [open]);

  // Revoke all blob URLs when modal closes or component unmounts
  useEffect(() => {
    if (!open) {
      photos.forEach((p) => URL.revokeObjectURL(p.preview));
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => {
      photos.forEach((p) => URL.revokeObjectURL(p.preview));
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const addFiles = useCallback((incoming: FileList | File[]) => {
    setSizeError(null);
    const arr = Array.from(incoming);
    const oversized = arr.filter((f) => f.size > MAX_SIZE_BYTES);
    if (oversized.length > 0) {
      setSizeError(`${oversized.length} file(s) exceed ${MAX_SIZE_MB} MB and were skipped.`);
    }
    const valid = arr.filter(
      (f) => f.type.startsWith("image/") && f.size <= MAX_SIZE_BYTES,
    );
    setPhotos((prev) => {
      const remaining = MAX_FILES - prev.length;
      const toAdd = valid.slice(0, remaining).map((f) => ({
        key: `${f.name}-${f.size}-${Date.now()}-${Math.random()}`,
        file: f,
        preview: URL.createObjectURL(f),
      }));
      return [...prev, ...toAdd];
    });
    setValidateError(false);
  }, []);

  const removePhoto = (key: string) => {
    setPhotos((prev) => {
      const target = prev.find((p) => p.key === key);
      if (target) URL.revokeObjectURL(target.preview);
      return prev.filter((p) => p.key !== key);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(e.target.files);
    e.target.value = "";
  };

  const handleSubmit = async () => {
    if (photos.length === 0) {
      setValidateError(true);
      return;
    }
    await onSubmit(photos, label, caption.trim());
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <ModalTemplate
      open={open}
      onOpenChange={onOpenChange}
      title="Add Photos"
      size="sm"
      footer={
        <ModalButtons
          onCancel={handleCancel}
          onConfirm={handleSubmit}
          cancelLabel="Cancel"
          confirmLabel={loading ? "Uploading…" : `Add${photos.length > 0 ? ` ${photos.length} photo${photos.length > 1 ? "s" : ""}` : ""}`}
          confirmDisabled={loading}
        />
      }
    >
      <div className="flex flex-col gap-5">
        {/* Drop zone */}
        <div>
          <div
            onDragEnter={(e) => { e.preventDefault(); setDragging(true); }}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={cn(
              "flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed cursor-pointer transition-colors py-8 px-4 select-none",
              dragging
                ? "border-[#2463EB] bg-blue-50"
                : validateError && photos.length === 0
                  ? "border-red-400 bg-red-50"
                  : "border-[#e5e5e5] bg-[#fafafa] hover:border-[#c0c0c0] hover:bg-[#f5f5f5]",
            )}
          >
            <div className={cn(
              "flex items-center justify-center w-10 h-10 rounded-full",
              dragging ? "bg-blue-100" : "bg-[#f0f0f0]",
            )}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={dragging ? "#2463EB" : "#71717A"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <path d="M21 15l-5-5L5 21"/>
              </svg>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-[#303030]">
                {dragging ? "Drop photos here" : "Drop photos or click to browse"}
              </p>
              <p className="text-xs text-[#71717A] mt-0.5">
                JPG, PNG, WEBP, HEIC · up to {MAX_SIZE_MB} MB each · max {MAX_FILES} photos
              </p>
            </div>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED}
            multiple
            className="hidden"
            onChange={handleInputChange}
          />
          {validateError && photos.length === 0 && (
            <p className="text-xs text-red-600 mt-1.5">Please add at least one photo.</p>
          )}
          {sizeError && (
            <p className="text-xs text-amber-600 mt-1.5">{sizeError}</p>
          )}
        </div>

        {/* Preview grid */}
        {photos.length > 0 && (
          <div className="grid grid-cols-4 gap-2">
            {photos.map((p) => (
              <div key={p.key} className="relative group rounded-lg overflow-hidden bg-[#f3f3f3]" style={{ aspectRatio: "1/1" }}>
                <img src={p.preview} alt={p.file.name} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); removePhoto(p.key); }}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg width="8" height="8" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
                    <path d="M1 1l8 8M9 1L1 9"/>
                  </svg>
                </button>
              </div>
            ))}

            {/* Add more tile */}
            {photos.length < MAX_FILES && (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#e5e5e5] hover:border-[#c0c0c0] text-[#a1a1aa] hover:text-[#71717A] transition-colors"
                style={{ aspectRatio: "1/1" }}
              >
                <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
                  <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Label picker */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[#303030]">Label <span className="text-[#71717A] font-normal">(optional)</span></label>
          <div className="flex gap-2 flex-wrap">
            {LABEL_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setLabel(label === opt.value ? null : opt.value)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors",
                  label === opt.value ? opt.active : opt.inactive,
                )}
              >
                {opt.text}
              </button>
            ))}
          </div>
        </div>

        {/* Caption */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[#303030]">
            Caption <span className="text-[#71717A] font-normal">(optional)</span>
          </label>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Describe what's shown in these photos…"
            rows={2}
            className="w-full rounded-lg border border-[#e5e5e5] bg-white px-3 py-2 text-sm text-[#303030] placeholder:text-[#a1a1aa] resize-none focus:outline-none focus:ring-2 focus:ring-[#2463EB] focus:border-transparent"
          />
        </div>
      </div>
    </ModalTemplate>
  );
};

export default AddPhotoModal;
