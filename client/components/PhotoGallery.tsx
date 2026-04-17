import React, { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

export type PhotoLabel = "before" | "during" | "after" | "other";

export interface Photo {
  id: number;
  url: string;
  fileName: string;
  uploadedAt: string;
  uploadedBy: string;
  label?: PhotoLabel;
  caption?: string;
  source?: "task" | "work_order" | "fto_receipt";
  source_entity_id?: number | null;
  source_entity_name?: string | null;
}

const LABEL_META: Record<PhotoLabel, { text: string; dot: string; badge: string }> = {
  before: { text: "Before", dot: "bg-orange-400",  badge: "bg-orange-50 text-orange-700 border-orange-200" },
  during: { text: "During", dot: "bg-blue-400",    badge: "bg-blue-50   text-blue-700   border-blue-200"   },
  after:  { text: "After",  dot: "bg-emerald-400", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  other:  { text: "Other",  dot: "bg-zinc-400",    badge: "bg-zinc-50   text-zinc-700   border-zinc-200"   },
};

// How many thumbnails to show in collapsed strip before "+N more"
const STRIP_VISIBLE = 5;

interface PhotoGalleryProps {
  photos: Photo[];
  onAdd?: () => void;
  onDelete?: (id: number) => void;
  onEdit?: (photo: Photo) => void;
}

export function PhotoGallery({ photos, onAdd, onDelete, onEdit }: PhotoGalleryProps) {
  const [expanded, setExpanded] = useState(false);
  const [filter, setFilter] = useState<"all" | PhotoLabel>("all");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // In expanded mode, apply filter; in collapsed strip, show all photos
  const filteredForGrid = filter === "all" ? photos : photos.filter((p) => p.label === filter);
  // Lightbox always operates on the filtered set (or all in collapsed mode)
  const lightboxPhotos = expanded ? filteredForGrid : photos;

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (lightboxIndex === null) return;
    if (e.key === "ArrowRight") setLightboxIndex((i) => (i! + 1) % lightboxPhotos.length);
    if (e.key === "ArrowLeft")  setLightboxIndex((i) => (i! - 1 + lightboxPhotos.length) % lightboxPhotos.length);
    if (e.key === "Escape")     setLightboxIndex(null);
  }, [lightboxIndex, lightboxPhotos.length]);

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  const activeLb = lightboxIndex !== null ? lightboxPhotos[lightboxIndex] : null;

  // ── Header ──────────────────────────────────────────────────────────────────
  const header = (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <h2 className="text-[#303030] text-xl font-medium leading-[1.1]">Photos</h2>
        {photos.length > 0 && (
          <span className="text-xs font-medium text-[#71717A] bg-[#f3f3f3] px-1.5 py-0.5 rounded-full">
            {photos.length}
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        {photos.length > 0 && (
          <button
            onClick={() => { setExpanded((v) => !v); setFilter("all"); }}
            className="text-sm text-[#71717A] hover:text-[#303030] font-medium transition-colors"
          >
            {expanded ? "Collapse" : "Show all"}
          </button>
        )}
        {onAdd && (
          <button
            onClick={onAdd}
            className="flex items-center gap-1 text-sm text-[#2463EB] font-medium hover:underline"
          >
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
              <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
            </svg>
            Add
          </button>
        )}
      </div>
    </div>
  );

  // ── Empty state ──────────────────────────────────────────────────────────────
  if (photos.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        {header}
        <div className="flex items-center gap-2 py-3 text-[#71717A]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-50">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <path d="M21 15l-5-5L5 21"/>
          </svg>
          <span className="text-sm">No photos yet</span>
        </div>
      </div>
    );
  }

  // ── Collapsed strip ──────────────────────────────────────────────────────────
  const collapsedStrip = (
    <div className="flex gap-1.5 overflow-hidden">
      {photos.slice(0, STRIP_VISIBLE).map((photo, idx) => {
        const isLast = idx === STRIP_VISIBLE - 1 && photos.length > STRIP_VISIBLE;
        const remaining = photos.length - STRIP_VISIBLE;
        return (
          <button
            key={`${photo.source ?? "task"}-${photo.id}`}
            onClick={() => setLightboxIndex(idx)}
            className="relative flex-shrink-0 rounded-md overflow-hidden bg-[#f3f3f3] hover:ring-2 hover:ring-[#2463EB] transition-shadow focus:outline-none focus:ring-2 focus:ring-[#2463EB]"
            style={{ width: 72, height: 72 }}
            title={photo.source_entity_name ? `From ${photo.source_entity_name}` : photo.fileName}
          >
            <img src={photo.url} alt={photo.fileName} className="w-full h-full object-cover" loading="lazy" />
            {photo.label && (
              <span className={cn(
                "absolute top-1 left-1 px-1 py-0 rounded text-[9px] font-semibold border leading-tight",
                LABEL_META[photo.label].badge
              )}>
                {LABEL_META[photo.label].text}
              </span>
            )}
            {photo.source && photo.source !== "task" && (
              <span className="absolute bottom-1 left-1 right-1 px-1 py-0 rounded bg-blue-600/85 text-white text-[9px] font-semibold truncate leading-tight">
                WO
              </span>
            )}
            {isLast && remaining > 0 && (
              <div className="absolute inset-0 bg-black/55 flex items-center justify-center">
                <span className="text-white text-sm font-semibold">+{remaining}</span>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );

  // ── Expanded grid ────────────────────────────────────────────────────────────
  const allLabels: Array<"all" | PhotoLabel> = ["all", "before", "during", "after", "other"];
  const expandedGrid = (
    <div className="flex flex-col gap-3">
      {/* Filter tabs */}
      <div className="flex gap-1 flex-wrap">
        {allLabels.map((lbl) => {
          const count = lbl === "all" ? photos.length : photos.filter((p) => p.label === lbl).length;
          if (lbl !== "all" && count === 0) return null;
          const isActive = filter === lbl;
          return (
            <button
              key={lbl}
              onClick={() => setFilter(lbl)}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors",
                isActive
                  ? "bg-[#303030] text-white border-[#303030]"
                  : "bg-white text-[#71717A] border-[#e5e5e5] hover:border-[#303030] hover:text-[#303030]"
              )}
            >
              {lbl !== "all" && (
                <span className={cn("w-1.5 h-1.5 rounded-full", isActive ? "bg-white" : LABEL_META[lbl].dot)} />
              )}
              {lbl === "all" ? "All" : LABEL_META[lbl].text}
              <span className={cn("ml-0.5", isActive ? "text-white/70" : "text-[#a1a1aa]")}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Grid */}
      {filteredForGrid.length === 0 ? (
        <p className="text-sm text-[#71717A]">No photos in this category.</p>
      ) : (
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5">
          {filteredForGrid.map((photo, idx) => (
            <button
              key={`${photo.source ?? "task"}-${photo.id}`}
              onClick={() => setLightboxIndex(idx)}
              className="relative rounded-md overflow-hidden bg-[#f3f3f3] hover:ring-2 hover:ring-[#2463EB] transition-shadow focus:outline-none focus:ring-2 focus:ring-[#2463EB]"
              style={{ aspectRatio: "1/1" }}
              title={photo.source_entity_name ? `From ${photo.source_entity_name}` : photo.fileName}
            >
              <img src={photo.url} alt={photo.fileName} className="w-full h-full object-cover" loading="lazy" />
              {photo.label && (
                <span className={cn(
                  "absolute top-1 left-1 px-1 py-0 rounded text-[9px] font-semibold border leading-tight",
                  LABEL_META[photo.label].badge
                )}>
                  {LABEL_META[photo.label].text}
                </span>
              )}
              {photo.source && photo.source !== "task" && (
                <span className="absolute bottom-1 left-1 right-1 px-1.5 py-0.5 rounded bg-blue-600/85 text-white text-[10px] font-semibold truncate leading-tight">
                  WO: {photo.source_entity_name ?? ""}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <>
      <div className="flex flex-col gap-3">
        {header}
        {expanded ? expandedGrid : collapsedStrip}
      </div>

      {/* Lightbox — edit/delete disabled for photos aggregated from other entities */}
      {activeLb && lightboxIndex !== null && (
        <Lightbox
          photo={activeLb}
          total={lightboxPhotos.length}
          index={lightboxIndex}
          onPrev={() => setLightboxIndex((lightboxIndex - 1 + lightboxPhotos.length) % lightboxPhotos.length)}
          onNext={() => setLightboxIndex((lightboxIndex + 1) % lightboxPhotos.length)}
          onClose={() => setLightboxIndex(null)}
          onDelete={activeLb.source && activeLb.source !== "task" ? undefined : onDelete}
          onEdit={activeLb.source && activeLb.source !== "task" ? undefined : onEdit}
        />
      )}
    </>
  );
}

// ─── Lightbox ─────────────────────────────────────────────────────────────────

const LIGHTBOX_LABELS: Array<{ value: PhotoLabel; text: string; active: string; inactive: string }> = [
  { value: "before", text: "Before", active: "bg-orange-500 text-white border-orange-500", inactive: "text-orange-700 border-orange-300 hover:border-orange-400" },
  { value: "during", text: "During", active: "bg-blue-500 text-white border-blue-500",    inactive: "text-blue-700 border-blue-300 hover:border-blue-400"    },
  { value: "after",  text: "After",  active: "bg-emerald-500 text-white border-emerald-500", inactive: "text-emerald-700 border-emerald-300 hover:border-emerald-400" },
  { value: "other",  text: "Other",  active: "bg-zinc-500 text-white border-zinc-500",    inactive: "text-zinc-600 border-zinc-300 hover:border-zinc-400"    },
];

function Lightbox({
  photo, total, index, onPrev, onNext, onClose, onDelete, onEdit,
}: {
  photo: Photo; total: number; index: number;
  onPrev: () => void; onNext: () => void; onClose: () => void;
  onDelete?: (id: number) => void; onEdit?: (p: Photo) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draftLabel, setDraftLabel] = useState<PhotoLabel | null>(null);
  const [draftCaption, setDraftCaption] = useState("");

  // Reset edit state whenever the displayed photo changes
  useEffect(() => {
    setEditing(false);
    setDraftLabel(photo.label ?? null);
    setDraftCaption(photo.caption ?? "");
  }, [photo.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStartEdit = () => {
    setDraftLabel(photo.label ?? null);
    setDraftCaption(photo.caption ?? "");
    setEditing(true);
  };

  const handleSave = () => {
    if (onEdit) {
      onEdit({ ...photo, label: draftLabel ?? undefined, caption: draftCaption.trim() || undefined });
    }
    setEditing(false);
  };

  const handleCancelEdit = () => {
    setEditing(false);
  };

  const displayLabel = editing ? (draftLabel ? LABEL_META[draftLabel] : null) : (photo.label ? LABEL_META[photo.label] : null);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={editing ? undefined : onClose}
    >
      <div
        className="relative flex bg-white rounded-xl overflow-hidden shadow-2xl max-w-4xl w-full mx-4"
        style={{ maxHeight: "88vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image */}
        <div className="flex-1 bg-black flex items-center justify-center min-w-0" style={{ minHeight: 320 }}>
          <img src={photo.url} alt={photo.fileName} className="max-h-[80vh] max-w-full object-contain" />
          {!editing && total > 1 && (
            <>
              <NavArrow dir="left" onClick={onPrev} />
              <NavArrow dir="right" onClick={onNext} />
            </>
          )}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/50 text-white/80 text-xs px-2.5 py-1 rounded-full font-medium">
            {index + 1} / {total}
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-56 flex-shrink-0 flex flex-col border-l border-[#e5e5e5] bg-white">

          {/* Header — always visible */}
          <div className="flex items-start justify-between p-4 border-b border-[#e5e5e5]">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#303030] truncate">{photo.fileName}</p>
              {displayLabel && (
                <span className={cn("inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full text-xs font-medium border", displayLabel.badge)}>
                  <span className={cn("w-1.5 h-1.5 rounded-full", displayLabel.dot)} />
                  {displayLabel.text}
                </span>
              )}
              {editing && !draftLabel && (
                <span className="inline-flex items-center mt-1.5 px-2 py-0.5 rounded-full text-xs font-medium border border-[#e5e5e5] text-[#a1a1aa]">
                  No label
                </span>
              )}
            </div>
            <button
              onClick={editing ? handleCancelEdit : onClose}
              className="ml-2 flex-shrink-0 p-1 rounded hover:bg-[#f3f3f3] text-[#71717A]"
              title={editing ? "Cancel edit" : "Close"}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
                <path d="M2 2l10 10M12 2L2 12"/>
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="flex flex-col gap-4 p-4 flex-1 overflow-y-auto">
            {editing ? (
              <>
                {/* Label picker */}
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] uppercase tracking-wide text-[#a1a1aa] font-medium">Label</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {LIGHTBOX_LABELS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setDraftLabel(draftLabel === opt.value ? null : opt.value)}
                        className={cn(
                          "px-2 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                          draftLabel === opt.value ? opt.active : `bg-white ${opt.inactive}`,
                        )}
                      >
                        {opt.text}
                      </button>
                    ))}
                  </div>
                  {draftLabel && (
                    <button
                      type="button"
                      onClick={() => setDraftLabel(null)}
                      className="text-[11px] text-[#a1a1aa] hover:text-[#71717A] text-left transition-colors"
                    >
                      Clear label
                    </button>
                  )}
                </div>

                {/* Caption */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] uppercase tracking-wide text-[#a1a1aa] font-medium">Caption</span>
                  <textarea
                    value={draftCaption}
                    onChange={(e) => setDraftCaption(e.target.value)}
                    placeholder="Add a caption…"
                    rows={3}
                    className="w-full rounded-lg border border-[#e5e5e5] bg-white px-2.5 py-2 text-sm text-[#303030] placeholder:text-[#a1a1aa] resize-none focus:outline-none focus:ring-2 focus:ring-[#2463EB] focus:border-transparent"
                    autoFocus
                  />
                </div>
              </>
            ) : (
              <>
                <MetaField label="Uploaded by" value={photo.uploadedBy} />
                <MetaField label="Date" value={photo.uploadedAt} />
                {photo.caption && <MetaField label="Caption" value={photo.caption} />}
              </>
            )}
          </div>

          {/* Footer actions */}
          <div className="p-4 border-t border-[#e5e5e5] flex flex-col gap-2">
            {editing ? (
              <>
                <button
                  onClick={handleSave}
                  className="w-full text-sm text-white font-medium py-1.5 px-3 rounded-lg bg-[#2463EB] hover:bg-[#1d4ed8] transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="w-full text-sm text-[#71717A] font-medium py-1.5 px-3 rounded-lg border border-[#e5e5e5] hover:bg-[#f3f3f3] transition-colors"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                {onEdit && (
                  <button
                    onClick={handleStartEdit}
                    className="w-full text-sm text-[#303030] font-medium py-1.5 px-3 rounded-lg border border-[#e5e5e5] hover:bg-[#f3f3f3] text-left transition-colors"
                  >
                    Edit label
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => onDelete(photo.id)}
                    className="w-full text-sm text-[#982740] font-medium py-1.5 px-3 rounded-lg border border-[#fde8ec] hover:bg-[#fde8ec] text-left transition-colors"
                  >
                    Delete
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function NavArrow({ dir, onClick }: { dir: "left" | "right"; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "absolute top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors",
        dir === "left" ? "left-2" : "right-2"
      )}
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {dir === "left" ? <path d="M9 2L4 7l5 5"/> : <path d="M5 2l5 5-5 5"/>}
      </svg>
    </button>
  );
}

function MetaField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] uppercase tracking-wide text-[#a1a1aa] font-medium">{label}</span>
      <span className="text-sm text-[#303030]">{value}</span>
    </div>
  );
}

export default PhotoGallery;
