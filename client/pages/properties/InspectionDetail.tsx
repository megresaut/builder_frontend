import React, { useState, useRef, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageTemplate from "@/layout/PageTemplate";
import SectionCard from "@/components/SectionCard";
import BlueButton from "@/components/BlueButton";
import InspectionAssignees from "@/components/InspectionAssignees";
import { InspectionDetailsBarTemplate } from "@/components/templates";
import PhotoCommentModal from "@/components/PhotoCommentModal";
import { ModalTemplate, ModalButtons } from "@/components/ui/ModalTemplate";
import {
  PlusIcon,
  DeleteIcon,
  EditIcon,
  ArrowBackIcon,
  ArrowForwardIcon,
  ChevronDownIcon,
  DownloadIcon,
} from "@/components/icons";
import { cn } from "@/lib/utils";
import { SelectField } from "@/components/forms/SelectField";
import {
  ChecklistNode,
  InspectionPhoto,
  MOCK_CHECKLIST_NODES,
} from "@/data/inspection-checklist";
import { DEFAULT_INSPECTION_TEMPLATES } from "@/data/inspections";

// @ts-ignore - html2pdf is available but not fully typed
import html2pdf from "html2pdf.js";

interface InspectionDetailProps {
  isNew?: boolean;
  isEdit?: boolean;
  isInline?: boolean;
  inspectionId?: number;
  inspection?: any;
  templateName?: string;
  onBack?: () => void;
}

export default function InspectionDetail(props: InspectionDetailProps = {}) {
  const {
    isNew,
    isEdit,
    isInline = false,
    inspectionId,
    inspection,
    templateName,
    onBack
  } = props;
  const navigate = useNavigate();
  const { propertyId } = useParams();

  // --- Initialize Checklist Based on Template ---
  const getInitialChecklist = (): ChecklistNode[] => {
    if (!templateName) {
      return MOCK_CHECKLIST_NODES;
    }

    // Find the template by name
    const template = DEFAULT_INSPECTION_TEMPLATES.find(t => t.name === templateName);

    if (template) {
      // Convert template sections and items to ChecklistNode format
      const nodes: ChecklistNode[] = [];
      let nodeIndex = 0;

      template.sections.forEach(section => {
        const sectionNode: ChecklistNode = {
          id: section.id,
          parentId: null,
          orderIndex: nodeIndex++,
          type: "section",
          text: section.title,
          depth: 0,
        };
        nodes.push(sectionNode);

        section.items.forEach(item => {
          const itemNode: ChecklistNode = {
            id: item.id,
            parentId: section.id,
            orderIndex: nodeIndex++,
            type: "item",
            text: item.text,
            depth: 1,
          };
          nodes.push(itemNode);
        });
      });

      return nodes.length > 0 ? nodes : [];
    }

    // If template is not found (new template), return empty checklist
    return [];
  };

  // --- State ---
  const [nodes, setNodes] = useState<ChecklistNode[]>(getInitialChecklist());
  const [photos, setPhotos] = useState<InspectionPhoto[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [status, setStatus] = useState<"In Progress" | "Completed">("In Progress");
  const [inspectionDueDate, setInspectionDueDate] = useState<Date | string | null>(
    inspection?.inspectionDate ? new Date(inspection.inspectionDate) : new Date()
  );

  // Metadata State
  const [uploadedBy] = useState<string>("John Doe");
  const [uploadedAt] = useState<string>(new Date().toLocaleString());
  const [lastUpdated] = useState<string>(new Date().toLocaleString());
  const [lastUpdatedBy] = useState<string>("Jerry Sanchez");

  // Photo Upload State
  const [selectedSectionId, setSelectedSectionId] = useState<string>("");
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Photo Comment Modal State
  const [isPhotoCommentModalOpen, setIsPhotoCommentModalOpen] = useState(false);
  const [pendingPhotoFile, setPendingPhotoFile] = useState<File | null>(null);

  // Photo Modal States
  const [selectedPhotoForModal, setSelectedPhotoForModal] = useState<InspectionPhoto | null>(null);
  const [isPhotoViewerOpen, setIsPhotoViewerOpen] = useState(false);
  const [photoNotes, setPhotoNotes] = useState<Record<string, string>>({});

  // --- Derived Data ---
  const sections = useMemo(() => nodes.filter((n) => n.depth === 0), [nodes]);

  const photosBySection = useMemo(() => {
    const grouped: Record<string, InspectionPhoto[]> = {};
    sections.forEach(s => grouped[s.id] = []);

    photos.forEach((p) => {
      if (grouped[p.sectionNodeId]) {
        grouped[p.sectionNodeId].push(p);
      }
    });
    return grouped;
  }, [nodes, photos, sections]);

  const allPhotos = useMemo(() => photos, [photos]);

  // --- Handlers: Checklist Editing ---

  const handleTextChange = (id: string, newText: string) => {
    setNodes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, text: newText } : n))
    );
  };

  const handleIndent = (id: string, direction: "in" | "out") => {
    setNodes((prev) =>
      prev.map((n) => {
        if (n.id !== id) return n;
        const newDepth = direction === "in" ? n.depth + 1 : Math.max(0, n.depth - 1);
        const newType = newDepth === 0 ? "section" : "item";
        return { ...n, depth: newDepth, type: newType };
      })
    );
  };

  const handleMove = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === nodes.length - 1) return;

    const newNodes = [...nodes];
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    [newNodes[index], newNodes[swapIndex]] = [newNodes[swapIndex], newNodes[index]];
    setNodes(newNodes);
  };

  const handleDeleteNode = (id: string) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      setNodes((prev) => prev.filter((n) => n.id !== id));
    }
  };

  const handleAddNode = (index: number) => {
    // Get the current node to replicate its depth and type
    const currentNode = nodes[index];
    const newNode: ChecklistNode = {
      id: `node-${Date.now()}`,
      parentId: currentNode?.parentId || null,
      orderIndex: 0,
      type: currentNode?.type || "section",
      text: "",
      depth: currentNode?.depth ?? 0,
    };
    const newNodes = [...nodes];
    newNodes.splice(index + 1, 0, newNode);
    setNodes(newNodes);
  };

  // --- Handlers: Photos ---

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedSectionId) {
      alert("Please select a section first.");
      if (photoInputRef.current) photoInputRef.current.value = "";
      return;
    }

    if (e.target.files && e.target.files.length > 0) {
      // Store the selected file and open the modal
      setPendingPhotoFile(e.target.files[0]);
      setIsPhotoCommentModalOpen(true);
      if (photoInputRef.current) photoInputRef.current.value = "";
    }
  };

  const handlePhotoCommentSubmit = (file: File, comment: string) => {
    const newPhoto: InspectionPhoto = {
      id: `photo-${Date.now()}-${Math.random()}`,
      inspectionId: "insp-1",
      sectionNodeId: selectedSectionId,
      fileRef: URL.createObjectURL(file),
      uploadedAt: new Date().toISOString(),
    };

    setPhotos((prev) => [...prev, newPhoto]);
    setPhotoNotes((prev) => ({
      ...prev,
      [newPhoto.id]: comment,
    }));
  };

  const handleRemovePhoto = (photoId: string) => {
    if (window.confirm("Delete this photo?")) {
      setPhotos((prev) => prev.filter((p) => p.id !== photoId));
      setPhotoNotes((prev) => {
        const updated = { ...prev };
        delete updated[photoId];
        return updated;
      });
    }
  };

  const handleOpenPhotoModal = (photo: InspectionPhoto) => {
    setSelectedPhotoForModal(photo);
    setIsPhotoViewerOpen(true);
  };

  const handleNextPhoto = () => {
    if (!selectedPhotoForModal) return;
    const currentIndex = allPhotos.findIndex(p => p.id === selectedPhotoForModal.id);
    if (currentIndex < allPhotos.length - 1) {
      setSelectedPhotoForModal(allPhotos[currentIndex + 1]);
    }
  };

  const handlePrevPhoto = () => {
    if (!selectedPhotoForModal) return;
    const currentIndex = allPhotos.findIndex(p => p.id === selectedPhotoForModal.id);
    if (currentIndex > 0) {
      setSelectedPhotoForModal(allPhotos[currentIndex - 1]);
    }
  };

  const handleUpdatePhotoNote = (photoId: string, note: string) => {
    setPhotoNotes((prev) => ({
      ...prev,
      [photoId]: note,
    }));
  };

  // --- Handlers: General ---

  const handleStatusChange = (newStatus: "In Progress" | "Completed") => {
    setStatus(newStatus);
  };

  const handleDueDateChange = (newDate: Date | string | null) => {
    setInspectionDueDate(newDate);
  };

  const handleExportInspection = () => {
    const dueDate = inspectionDueDate instanceof Date
      ? inspectionDueDate.toLocaleDateString()
      : inspectionDueDate;

    // Create HTML for PDF - metadata and photos only (no checklist)
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; color: #333; margin: 20px; }
          h1 { color: #303030; margin-bottom: 10px; }
          h2 { color: #505050; margin-top: 20px; margin-bottom: 10px; font-size: 16px; }
          .metadata { background-color: #f5f5f5; padding: 12px; margin-bottom: 20px; border-radius: 5px; }
          .metadata-item { margin: 6px 0; font-size: 12px; }
          .metadata-label { font-weight: bold; }
          .photos-section { margin-top: 20px; }
          .photo-item { margin-bottom: 20px; page-break-inside: avoid; border: 1px solid #e0e0e0; padding: 12px; border-radius: 4px; }
          .photo-label { font-weight: bold; font-size: 12px; color: #0066cc; margin-bottom: 8px; }
          .photo-timestamp { font-size: 11px; color: #666; margin: 8px 0; }
          .photo-note { font-size: 11px; color: #333; margin-top: 8px; white-space: pre-wrap; padding-top: 8px; border-top: 1px solid #eee; }
        </style>
      </head>
      <body>
        <h1>Inspection Report</h1>
        <div class="metadata">
          <div class="metadata-item"><span class="metadata-label">Property:</span> 22 Indian Chase Dr</div>
          <div class="metadata-item"><span class="metadata-label">Inspection Due Date:</span> ${dueDate}</div>
          <div class="metadata-item"><span class="metadata-label">Field Manager:</span> ${inspection?.inspector?.name || "Unassigned"}</div>
          <div class="metadata-item"><span class="metadata-label">Uploaded By:</span> ${uploadedBy}</div>
          <div class="metadata-item"><span class="metadata-label">Uploaded At:</span> ${uploadedAt}</div>
          <div class="metadata-item"><span class="metadata-label">Last Updated:</span> ${lastUpdated} by ${lastUpdatedBy}</div>
        </div>

        ${photos.length > 0 ? `
          <h2>Photos (${photos.length})</h2>
          <div class="photos-section">
            ${photos.map(photo => {
              const section = sections.find(s => s.id === photo.sectionNodeId);
              return `
                <div class="photo-item">
                  <div class="photo-label">Section: ${section?.text || "Unknown"}</div>
                  <div class="photo-timestamp">📷 ${new Date(photo.uploadedAt).toLocaleString()}</div>
                  ${photoNotes[photo.id] ? `<div class="photo-note">Comment: ${photoNotes[photo.id]}</div>` : ""}
                </div>
              `;
            }).join("")}
          </div>
        ` : `<p style="color: #999; font-style: italic;">No photos uploaded for this inspection.</p>`}
      </body>
      </html>
    `;

    // Convert HTML to PDF
    const filename = `inspection-${new Date().toISOString().split("T")[0]}.pdf`;

    const options = {
      margin: 10,
      filename: filename,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { orientation: "portrait", unit: "mm", format: "a4" },
    };

    // @ts-ignore - html2pdf types are incomplete
    html2pdf().set(options).from(htmlContent).save();
  };

  const content = (
    <div className="flex flex-col gap-6 w-full font-['Geist',sans-serif] bg-white p-6 rounded-lg">


      {/* Page Title + Controls */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-[#303030] font-semibold text-2xl leading-[30px]">
            {inspection?.name || "Inspection"}
          </h1>
          <p className="text-[#717179] font-medium text-base">
            {templateName || "No Template"}
          </p>
        </div>

        {/* Header Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={cn(
              "px-4 py-2 border rounded-lg text-sm font-medium transition-colors flex items-center gap-2",
              isEditing
                ? "bg-gray-100 border-gray-300 text-gray-900"
                : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
            )}
          >
            <EditIcon width={16} height={16} className="text-current" />
            {isEditing ? "Done Editing" : "Edit Checklist"}
          </button>
          <button
            onClick={handleExportInspection}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 bg-white transition-colors flex items-center gap-2"
          >
            <DownloadIcon width={16} height={16} className="text-gray-500" />
            Export
          </button>
        </div>
      </div>

      {/* Two-Column Layout: Left (Checklist) and Right (Photos + Assignees) */}
      <div className="flex flex-col lg:flex-row gap-6 w-full">

        {/* Left Column: Status Bar + Checklist */}
        <div className="flex-1 min-w-0 flex flex-col gap-6">
          {/* Metadata Bar - Status and Due Date */}
          <SectionCard padding="none">
            <InspectionDetailsBarTemplate
              status={status}
              dueDate={inspectionDueDate}
              onStatusChange={handleStatusChange}
              onDueDateChange={handleDueDateChange}
            />
          </SectionCard>
          <SectionCard title="Inspection Checklist" variant="white">
            <div className="flex flex-col gap-4">
              {/* Last Updated Meta */}
              <div className="text-xs text-gray-600 pb-3 border-b border-gray-200">
                <span className="font-medium">Last updated by Property Manager:</span> {lastUpdatedBy} on {lastUpdated}
              </div>

              <div className="flex flex-col gap-1">
                {nodes.length === 0 && (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    Checklist is empty. Click "Edit Checklist" to add items.
                  </div>
                )}

                {nodes.map((node, index) => (
                  <div
                    key={node.id}
                    className={cn(
                      "group flex items-start gap-2 py-2 px-2 rounded hover:bg-gray-50 transition-colors",
                      isEditing && "border border-transparent hover:border-gray-200"
                    )}
                    style={{ marginLeft: `${node.depth * 24}px` }}
                  >
                    {/* Bullet / Icon */}
                    <div className="mt-1 flex-shrink-0">
                      {node.depth === 0 ? (
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-900 mt-1.5" />
                      ) : (
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-1.5" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <input
                          type="text"
                          value={node.text}
                          onChange={(e) => handleTextChange(node.id, e.target.value)}
                          className={cn(
                            "w-full bg-transparent border-none p-0 focus:ring-0 text-sm",
                            node.depth === 0 ? "font-bold text-gray-900" : "text-gray-700"
                          )}
                          placeholder={node.depth === 0 ? "Section Title" : "Checklist Item"}
                          autoFocus={node.text === ""}
                        />
                      ) : (
                        <div
                          className={cn(
                            "text-sm whitespace-pre-wrap",
                            node.depth === 0 ? "font-bold text-gray-900" : "text-gray-700"
                          )}
                        >
                          {node.text}
                        </div>
                      )}
                    </div>

                    {/* Edit Controls */}
                    {isEditing && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleMove(index, "up")}
                          disabled={index === 0}
                          className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"
                          title="Move Up"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5"/><path d="M5 12l7-7 7 7"/></svg>
                        </button>
                        <button
                          onClick={() => handleMove(index, "down")}
                          disabled={index === nodes.length - 1}
                          className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"
                          title="Move Down"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14"/><path d="M19 12l-7 7-7-7"/></svg>
                        </button>
                        <button
                          onClick={() => handleIndent(node.id, "out")}
                          disabled={node.depth === 0}
                          className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"
                          title="Outdent"
                        >
                          <ArrowBackIcon width={12} height={12} />
                        </button>
                        <button
                          onClick={() => handleIndent(node.id, "in")}
                          className="p-1 text-gray-400 hover:text-gray-700"
                          title="Indent"
                        >
                          <ArrowForwardIcon width={12} height={12} />
                        </button>
                        <button
                          onClick={() => handleAddNode(index)}
                          className="p-1 text-blue-500 hover:text-blue-700"
                          title="Add Item Below"
                        >
                          <PlusIcon width={12} height={12} />
                        </button>
                        <button
                          onClick={() => handleDeleteNode(node.id)}
                          className="p-1 text-red-400 hover:text-red-600"
                          title="Delete"
                        >
                          <DeleteIcon width={12} height={12} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}

                {isEditing && (
                  <div className="mt-4 pt-4 border-t border-dashed border-gray-200">
                    <button
                      onClick={() => handleAddNode(nodes.length - 1)}
                      className="text-sm text-blue-600 font-medium hover:underline flex items-center gap-1"
                    >
                      <PlusIcon width={14} height={14} /> Add Item to End
                    </button>
                  </div>
                )}
              </div>
            </div>
          </SectionCard>
        </div>
        {/* End of Left Column */}

        {/* Right Column: Assignees + Photos */}
        <div className="w-full lg:w-80 flex-shrink-0 flex flex-col gap-6">
          {/* Field Team Assignees */}
          <InspectionAssignees
            variant="white"
            fieldTeam={inspection?.inspector ? [
              {
                id: inspection.inspector.id,
                name: inspection.inspector.name,
                initials: inspection.inspector.initials,
                email: inspection.inspector.email || "",
                title: "Field Manager",
                type: "fieldManager",
              }
            ] : []}
          />

          {/* Inspection Photos */}
          <SectionCard title={`Inspection Photos (${photos.length} total)`} variant="white">
            <div className="flex flex-col gap-6">

              {/* Upload Controls - Always visible */}
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg flex flex-col gap-3">
                <SelectField
                  label="Associate with Section"
                  value={selectedSectionId}
                  onChange={(value) => setSelectedSectionId(value as string)}
                  options={sections.map((s) => ({
                    value: s.id,
                    label: s.text,
                  }))}
                  placeholder="Select a section..."
                  compact
                />

                <div
                  className={cn(
                    "border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer transition-colors",
                    !selectedSectionId ? "opacity-50 cursor-not-allowed bg-gray-100" : "hover:bg-white bg-gray-50"
                  )}
                  onClick={() => {
                    if (selectedSectionId) photoInputRef.current?.click();
                    else alert("Please select a section first");
                  }}
                >
                  <div className="text-gray-400">
                    <PlusIcon width={24} height={24} />
                  </div>
                  <span className="mt-1 text-sm text-gray-600 font-medium">Click to Upload</span>
                  <input
                    ref={photoInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoUpload}
                    disabled={!selectedSectionId}
                  />
                </div>
              </div>

              {/* Photos Grid - Compact Display (Last 3 photos only) */}
              <div className="grid grid-cols-3 gap-2">
                {photos.slice(-3).map((photo) => {
                  const section = sections.find(s => s.id === photo.sectionNodeId);
                  return (
                    <div
                      key={photo.id}
                      className="relative group cursor-pointer rounded-lg overflow-hidden bg-gray-100 aspect-square"
                      onClick={() => handleOpenPhotoModal(photo)}
                      title={section?.text || "Photo"}
                    >
                      <img src={photo.fileRef} alt="Inspection" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity flex items-end justify-start p-1">
                        {section && (
                          <div className="text-[10px] font-medium text-white bg-black bg-opacity-60 px-1.5 py-0.5 rounded line-clamp-1">
                            {section.text}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Show all photos link if more than 3 */}
              {photos.length > 3 && (
                <div className="text-center">
                  <button
                    onClick={() => {
                      if (photos.length > 0) {
                        handleOpenPhotoModal(photos[0]);
                      }
                    }}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    View all {photos.length} photos
                  </button>
                </div>
              )}

              {photos.length === 0 && (
                <div className="text-center py-6 text-gray-400 text-xs italic">
                  No photos yet
                </div>
              )}

            </div>
          </SectionCard>
        </div>

      </div>
    </div>
  );

  const pageContent = (
    <>
      {content}

      {/* Photo Comment Modal - For uploading new photos */}
      <PhotoCommentModal
        open={isPhotoCommentModalOpen}
        onOpenChange={setIsPhotoCommentModalOpen}
        onSubmit={handlePhotoCommentSubmit}
        title="Add Photo"
        submitLabel="Upload Photo"
        initialFile={pendingPhotoFile}
      />

      {/* Photo Viewer Modal */}
      {selectedPhotoForModal && (
        <PhotoViewerModal
          open={isPhotoViewerOpen}
          onOpenChange={setIsPhotoViewerOpen}
          photo={selectedPhotoForModal}
          onNext={handleNextPhoto}
          onPrev={handlePrevPhoto}
          photoIndex={allPhotos.findIndex(p => p.id === selectedPhotoForModal.id)}
          totalPhotos={allPhotos.length}
          note={photoNotes[selectedPhotoForModal.id] || ""}
          onNoteChange={(note) => handleUpdatePhotoNote(selectedPhotoForModal.id, note)}
          sectionName={sections.find(s => s.id === selectedPhotoForModal.sectionNodeId)?.text}
        />
      )}
    </>
  );

  if (isInline) {
    return pageContent;
  }

  return <PageTemplate>{pageContent}</PageTemplate>;
}

// --- Helper Components ---

interface PhotoViewerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  photo: InspectionPhoto;
  onNext: () => void;
  onPrev: () => void;
  photoIndex: number;
  totalPhotos: number;
  note: string;
  onNoteChange: (note: string) => void;
  sectionName?: string;
}

function PhotoViewerModal({
  open,
  onOpenChange,
  photo,
  onNext,
  onPrev,
  photoIndex,
  totalPhotos,
  note,
  onNoteChange,
  sectionName,
}: PhotoViewerModalProps) {
  if (!open) return null;

  const canGoNext = photoIndex < totalPhotos - 1;
  const canGoPrev = photoIndex > 0;

  return (
    <div
      className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900">Photo Viewer</h2>
              {sectionName && (
                <p className="text-sm text-gray-600 mt-1">Section: <span className="font-medium text-blue-600">{sectionName}</span></p>
              )}
            </div>
            <span className="text-sm text-gray-500 flex-shrink-0 ml-auto">
              {photoIndex + 1} of {totalPhotos}
            </span>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="text-gray-400 hover:text-gray-600 transition-colors text-2xl leading-none ml-2 flex-shrink-0"
          >
            ×
          </button>
        </div>

        {/* Image Container */}
        <div className="flex-1 flex items-center justify-center bg-gray-50 overflow-hidden p-4">
          <img
            src={photo.fileRef}
            alt="Inspection"
            className="max-h-full max-w-full object-contain shadow-sm"
          />
        </div>

        {/* Notes Section */}
        <div className="border-t border-gray-200 p-4 bg-white">
          <label className="text-sm font-semibold text-gray-900 mb-2 block">Notes</label>
          <textarea
            value={note}
            onChange={(e) => onNoteChange(e.target.value)}
            placeholder="Add notes or comments about this photo..."
            className="w-full p-3 border border-gray-300 rounded-lg text-sm resize-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            rows={3}
          />
        </div>

        {/* Footer with Navigation */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50 gap-4">
          <button
            onClick={onPrev}
            disabled={!canGoPrev}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Previous
          </button>

          <div className="text-sm text-gray-600">
            {new Date(photo.uploadedAt).toLocaleString()}
          </div>

          <button
            onClick={onNext}
            disabled={!canGoNext}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}
