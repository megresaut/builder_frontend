/**
 * PhotoGalleryDemo — Frontend-only preview page with mock data.
 *
 * Visit: /dev/photo-gallery
 *
 * Shows the PhotoGallery component in the context of a task detail sidebar,
 * alongside the existing FilesTemplate so you can compare the two approaches.
 * No API calls — everything is mock data.
 */

import React, { useState } from "react";
import PhotoGallery from "@/components/PhotoGallery";
import type { Photo, PhotoLabel } from "@/components/PhotoGallery";
import { FilesTemplate } from "@/components/templates";
import type { File } from "@/components/templates";
import { toast } from "sonner";

// ─── Mock Data ───────────────────────────────────────────────────────────────

const MOCK_PHOTOS: Photo[] = [
  {
    id: 1,
    url: "https://picsum.photos/seed/maint-before-1/800/600",
    fileName: "water_damage_ceiling.jpg",
    uploadedAt: "Mar 28, 2026",
    uploadedBy: "Marcus T.",
    label: "before",
    caption: "Ceiling damage from unit 3B leak, kitchen corner",
  },
  {
    id: 2,
    url: "https://picsum.photos/seed/maint-before-2/800/600",
    fileName: "water_damage_wall.jpg",
    uploadedAt: "Mar 28, 2026",
    uploadedBy: "Marcus T.",
    label: "before",
    caption: "Drywall saturation on east wall",
  },
  {
    id: 3,
    url: "https://picsum.photos/seed/maint-before-3/800/600",
    fileName: "subfloor_damage.jpg",
    uploadedAt: "Mar 28, 2026",
    uploadedBy: "Marcus T.",
    label: "before",
  },
  {
    id: 4,
    url: "https://picsum.photos/seed/maint-during-1/800/600",
    fileName: "drywall_removal.jpg",
    uploadedAt: "Mar 30, 2026",
    uploadedBy: "Ray Plumbing Co.",
    label: "during",
    caption: "Damaged section removed, mold treatment applied",
  },
  {
    id: 5,
    url: "https://picsum.photos/seed/maint-during-2/800/600",
    fileName: "pipe_repair.jpg",
    uploadedAt: "Mar 30, 2026",
    uploadedBy: "Ray Plumbing Co.",
    label: "during",
  },
  {
    id: 6,
    url: "https://picsum.photos/seed/maint-during-3/800/600",
    fileName: "new_drywall_hung.jpg",
    uploadedAt: "Apr 1, 2026",
    uploadedBy: "Marcus T.",
    label: "during",
  },
  {
    id: 7,
    url: "https://picsum.photos/seed/maint-after-1/800/600",
    fileName: "ceiling_patched.jpg",
    uploadedAt: "Apr 2, 2026",
    uploadedBy: "Marcus T.",
    label: "after",
    caption: "Ceiling patched and primed, ready for paint",
  },
  {
    id: 8,
    url: "https://picsum.photos/seed/maint-after-2/800/600",
    fileName: "wall_finished.jpg",
    uploadedAt: "Apr 2, 2026",
    uploadedBy: "Marcus T.",
    label: "after",
  },
  {
    id: 9,
    url: "https://picsum.photos/seed/maint-other-1/800/600",
    fileName: "unit_access_key.jpg",
    uploadedAt: "Mar 28, 2026",
    uploadedBy: "Sarah K.",
    label: "other",
    caption: "Key tag for temp lockbox during repair",
  },
];

const MOCK_FILES: File[] = [
  {
    id: 101,
    name: "Ray_Plumbing_Invoice_7823.pdf",
    uploadedAt: "Apr 1, 2026",
    author: "Ray Plumbing Co.",
    category: "Invoice",
    description: "Pipe repair + drywall removal — $1,240",
  },
  {
    id: 102,
    name: "Tenant_Damage_Report_3B.pdf",
    uploadedAt: "Mar 28, 2026",
    author: "Sarah K.",
    category: "Documentation",
  },
  {
    id: 103,
    name: "Insurance_Claim_Draft.msg",
    uploadedAt: "Mar 29, 2026",
    author: "Property Manager",
    category: "Correspondence",
    description: "Initial claim filed with Steadily",
  },
];

// ─── Page ────────────────────────────────────────────────────────────────────

export default function PhotoGalleryDemo() {
  const [photos, setPhotos] = useState<Photo[]>(MOCK_PHOTOS);
  const [activeView, setActiveView] = useState<"gallery" | "list">("gallery");

  const handleDelete = (id: number) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
    toast.success("Photo deleted");
  };

  const handleEdit = (photo: Photo) => {
    toast("Edit label / caption coming soon", { description: photo.fileName });
  };

  const handleAdd = () => {
    toast("Photo upload modal would open here");
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] font-['Geist',sans-serif]">
      {/* Page header */}
      <div className="bg-white border-b border-[#e5e5e5] px-6 py-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 text-sm text-[#71717A] mb-1">
            <span>All Tasks</span>
            <span>›</span>
            <span>#1042</span>
          </div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-[#303030]">
                Water damage — Unit 3B kitchen ceiling leak
              </h1>
              <div className="flex items-center gap-3 mt-2">
                <StatusBadge status="in_progress" />
                <PriorityBadge priority="high" />
                <span className="text-sm text-[#71717A]">Due Apr 5, 2026</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-5xl mx-auto px-6 py-8 flex gap-8">
        {/* Main column */}
        <div className="flex-1 min-w-0 flex flex-col gap-6">

          {/* Toggle: gallery vs list comparison */}
          <div className="bg-white border border-[#e5e5e5] rounded-xl p-4">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-sm font-medium text-[#303030]">View mode (demo toggle):</span>
              <div className="flex gap-1 bg-[#f3f3f3] rounded-lg p-1">
                <ViewToggleBtn active={activeView === "gallery"} onClick={() => setActiveView("gallery")}>
                  Gallery
                </ViewToggleBtn>
                <ViewToggleBtn active={activeView === "list"} onClick={() => setActiveView("list")}>
                  List (current)
                </ViewToggleBtn>
              </div>
            </div>
            <p className="text-xs text-[#71717A] leading-relaxed">
              Toggle between the proposed photo gallery and the current file list to compare. Both use the same {MOCK_PHOTOS.length} photos as mock data.
            </p>
          </div>

          {/* Gallery or list */}
          <div className="bg-white border border-[#e5e5e5] rounded-xl p-5">
            {activeView === "gallery" ? (
              <PhotoGallery
                photos={photos}
                onAdd={handleAdd}
                onDelete={handleDelete}
                onEdit={handleEdit}
              />
            ) : (
              <FilesTemplate
                files={photos.map((p) => ({
                  id: p.id,
                  name: p.fileName,
                  uploadedAt: p.uploadedAt,
                  author: p.uploadedBy,
                  category: p.label,
                }))}
                onAdd={handleAdd}
                onEdit={(f) => toast("Edit: " + f.name)}
                onDelete={handleDelete}
                onView={(f) => toast("View: " + f.name)}
              />
            )}
          </div>

          {/* Files section (always shown — separate from photos) */}
          <div className="bg-white border border-[#e5e5e5] rounded-xl p-5">
            <FilesTemplate
              files={MOCK_FILES}
              onAdd={() => toast("Add file")}
              onEdit={(f) => toast("Edit: " + f.name)}
              onDelete={(id) => toast("Delete file " + id)}
              onView={(f) => toast("View: " + f.name)}
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-64 flex-shrink-0 flex flex-col gap-4">
          <SidebarCard title="Property">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-[#303030]">Hillcrest Apartments</span>
              <span className="text-xs text-[#71717A]">2310 Oak Ave, Unit 3B</span>
            </div>
          </SidebarCard>

          <SidebarCard title="Assignees">
            <div className="flex flex-col gap-2">
              <PersonRow initials="MK" name="Meg K." role="Property Manager" />
              <PersonRow initials="MT" name="Marcus T." role="Field Team" />
            </div>
          </SidebarCard>

          <SidebarCard title="Stats">
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[#71717A]">Photos</span>
                <span className="font-medium text-[#303030]">{photos.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#71717A]">Files</span>
                <span className="font-medium text-[#303030]">{MOCK_FILES.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#71717A]">Work orders</span>
                <span className="font-medium text-[#303030]">1</span>
              </div>
            </div>
          </SidebarCard>

          {/* Design notes */}
          <SidebarCard title="Design notes">
            <ul className="text-xs text-[#71717A] space-y-2 leading-relaxed">
              <li>• Photos and Files are separate sections — same backend attachment, different renderer</li>
              <li>• Label filter tabs (Before / During / After) provide workflow context</li>
              <li>• Hover overlay exposes quick actions without cluttering the grid</li>
              <li>• Lightbox shows full image + sidebar with meta (uploader, date, caption)</li>
              <li>• Keyboard arrows for nav, Escape to close</li>
              <li>• Upload flow would reuse existing AttachmentUploader + let user pick a label</li>
            </ul>
          </SidebarCard>
        </div>
      </div>
    </div>
  );
}

// ─── Small UI helpers ─────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
      In Progress
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-orange-50 text-orange-700 border border-orange-200">
      High
    </span>
  );
}

function ViewToggleBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
        active
          ? "bg-white text-[#303030] shadow-sm"
          : "text-[#71717A] hover:text-[#303030]"
      }`}
    >
      {children}
    </button>
  );
}

function SidebarCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-[#e5e5e5] rounded-xl p-4">
      <div className="text-xs uppercase tracking-wide text-[#a1a1aa] font-medium mb-3">{title}</div>
      {children}
    </div>
  );
}

function PersonRow({
  initials,
  name,
  role,
}: {
  initials: string;
  name: string;
  role: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-7 h-7 rounded-full bg-[#e5e5e5] flex items-center justify-center text-[10px] font-semibold text-[#303030]">
        {initials}
      </div>
      <div>
        <div className="text-xs font-medium text-[#303030]">{name}</div>
        <div className="text-[10px] text-[#71717A]">{role}</div>
      </div>
    </div>
  );
}
