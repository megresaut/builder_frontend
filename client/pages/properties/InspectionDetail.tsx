import React, { useState, useRef, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageTemplate from "@/layout/PageTemplate";
import SectionCard from "@/components/SectionCard";
import BlueButton from "@/components/BlueButton";
import { ModalTemplate, ModalButtons } from "@/components/ui/ModalTemplate";
import {
  PlusIcon,
  DeleteIcon,
  ApproveIcon,
  EditIcon,
  ArrowBackIcon,
  ArrowForwardIcon,
  ChevronDownIcon,
  DocumentIcon,
} from "@/components/icons";
import { cn } from "@/lib/utils";
import {
  ChecklistNode,
  InspectionPhoto,
  MOCK_CHECKLIST_NODES,
} from "@/data/inspection-checklist";

// --- Components ---

export default function InspectionDetail() {
  const navigate = useNavigate();
  const { propertyId } = useParams();

  // --- State ---
  const [nodes, setNodes] = useState<ChecklistNode[]>(MOCK_CHECKLIST_NODES);
  const [photos, setPhotos] = useState<InspectionPhoto[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [status, setStatus] = useState<"Draft" | "Completed">("Draft");
  
  // Photo Upload State
  const [selectedSectionId, setSelectedSectionId] = useState<string>("");
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Photo Modal States
  const [isReviewPhotosOpen, setIsReviewPhotosOpen] = useState(false);
  const [selectedPhotoForModal, setSelectedPhotoForModal] = useState<InspectionPhoto | null>(null);
  const [isPhotoViewerOpen, setIsPhotoViewerOpen] = useState(false);

  // --- Derived Data ---
  const sections = useMemo(() => nodes.filter((n) => n.depth === 0), [nodes]);

  const photosBySection = useMemo(() => {
    const grouped: Record<string, InspectionPhoto[]> = {};
    sections.forEach(s => grouped[s.id] = []);
    
    photos.forEach((p) => {
      if (!grouped[p.sectionNodeId]) {
        if (sections.find(s => s.id === p.sectionNodeId)) {
           grouped[p.sectionNodeId].push(p);
        }
      } else {
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
    const newNode: ChecklistNode = {
      id: `node-${Date.now()}`,
      parentId: null,
      orderIndex: 0,
      type: "item",
      text: "",
      depth: 1,
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
      const newPhotos: InspectionPhoto[] = Array.from(e.target.files).map((file) => ({
        id: `photo-${Date.now()}-${Math.random()}`,
        inspectionId: "insp-1",
        sectionNodeId: selectedSectionId,
        fileRef: URL.createObjectURL(file),
        uploadedAt: new Date().toISOString(),
      }));
      setPhotos((prev) => [...prev, ...newPhotos]);
      
      if (photoInputRef.current) photoInputRef.current.value = "";
    }
  };

  const handleRemovePhoto = (photoId: string) => {
    if (window.confirm("Delete this photo?")) {
      setPhotos((prev) => prev.filter((p) => p.id !== photoId));
    }
  };

  const handleMovePhoto = (photoId: string, newSectionId: string) => {
    setPhotos((prev) =>
      prev.map((p) => (p.id === photoId ? { ...p, sectionNodeId: newSectionId } : p))
    );
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

  // --- Handlers: General ---

  const toggleStatus = () => {
    setStatus((prev) => (prev === "Draft" ? "Completed" : "Draft"));
  };

  return (
    <PageTemplate>
      <div className="flex flex-col gap-6 w-full font-['Geist',sans-serif]">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-[#303030] font-semibold text-2xl leading-[30px]">
              Inspection
            </h1>
            <div className="flex items-center gap-3 text-[#717179] font-medium text-base">
              <span>22 Indian Chase Dr</span>
              <span className="text-gray-300">•</span>
              <span>{new Date().toLocaleDateString()}</span>
            </div>
            <div className="mt-2">
              <span
                className={cn(
                  "px-2.5 py-0.5 rounded-full text-xs font-medium",
                  status === "Draft"
                    ? "bg-gray-100 text-gray-700"
                    : "bg-green-100 text-green-700"
                )}
              >
                {status}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
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
            {allPhotos.length > 0 && (
              <button
                onClick={() => setIsReviewPhotosOpen(true)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 bg-white transition-colors flex items-center gap-2"
              >
                <DocumentIcon width={16} height={16} className="text-gray-500" />
                Review Photos ({allPhotos.length})
              </button>
            )}
            <button
              onClick={() => {
                if (sections.length > 0 && !selectedSectionId) {
                   setSelectedSectionId(sections[0].id);
                }
                photoInputRef.current?.click();
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 bg-white transition-colors flex items-center gap-2"
            >
              <PlusIcon width={16} height={16} className="text-gray-500" />
              Upload Photos
            </button>
            <BlueButton
              icon={<ApproveIcon width={20} height={20} className="brightness-0 invert" />}
              onClick={toggleStatus}
            >
              {status === "Draft" ? "Mark Complete" : "Reopen Inspection"}
            </BlueButton>
          </div>
        </div>

        {/* Content - Dynamic layout with items-start for flexible sizing */}
        <div className="flex flex-col lg:flex-row gap-6 w-full lg:items-start">
          
          {/* LEFT COLUMN: Checklist */}
          <div className="flex-1 min-w-0">
            <SectionCard title="Inspection Checklist">
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
                         {/* Move Up */}
                        <button
                          onClick={() => handleMove(index, "up")}
                          disabled={index === 0}
                          className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"
                          title="Move Up"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5"/><path d="M5 12l7-7 7 7"/></svg>
                        </button>
                        {/* Move Down */}
                        <button
                          onClick={() => handleMove(index, "down")}
                          disabled={index === nodes.length - 1}
                          className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"
                          title="Move Down"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14"/><path d="M19 12l-7 7-7-7"/></svg>
                        </button>
                        {/* Indent Out */}
                        <button
                          onClick={() => handleIndent(node.id, "out")}
                          disabled={node.depth === 0}
                          className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"
                          title="Outdent"
                        >
                          <ArrowBackIcon width={12} height={12} />
                        </button>
                        {/* Indent In */}
                        <button
                          onClick={() => handleIndent(node.id, "in")}
                          className="p-1 text-gray-400 hover:text-gray-700"
                          title="Indent"
                        >
                          <ArrowForwardIcon width={12} height={12} />
                        </button>
                        {/* Add Sibling */}
                        <button
                          onClick={() => handleAddNode(index)}
                          className="p-1 text-blue-500 hover:text-blue-700"
                          title="Add Item Below"
                        >
                          <PlusIcon width={12} height={12} />
                        </button>
                        {/* Delete */}
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
            </SectionCard>
          </div>

          {/* RIGHT COLUMN: Photos */}
          <div className="flex-1 lg:flex-none lg:w-[400px]">
            <SectionCard title="Inspection Photos">
              <div className="flex flex-col gap-6">
                
                {/* Upload Controls */}
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg flex flex-col gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase">Associate with Section</label>
                    <div className="relative">
                      <select
                        value={selectedSectionId}
                        onChange={(e) => setSelectedSectionId(e.target.value)}
                        className="w-full pl-3 pr-8 py-2 bg-white border border-gray-300 rounded-md text-sm appearance-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      >
                        <option value="" disabled>Select a section...</option>
                        {sections.map((s) => (
                          <option key={s.id} value={s.id}>{s.text}</option>
                        ))}
                      </select>
                      <ChevronDownIcon width={16} height={16} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500" />
                    </div>
                  </div>

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
                    <PlusIcon width={24} height={24} color="#9ca3af" />
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

                {/* Photos List */}
                <div className="flex flex-col gap-6">
                  {sections.map(section => {
                    const sectionPhotos = photosBySection[section.id];
                    if (!sectionPhotos || sectionPhotos.length === 0) return null;

                    return (
                      <div key={section.id} className="flex flex-col gap-2">
                        <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-1">
                          {section.text}
                        </h3>
                        <div className="grid grid-cols-2 gap-2">
                          {sectionPhotos.map(photo => (
                            <PhotoCard 
                              key={photo.id}
                              photo={photo}
                              sections={sections}
                              onRemove={handleRemovePhoto}
                              onMove={handleMovePhoto}
                              onPhotoClick={handleOpenPhotoModal}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}

                  {Object.keys(photosBySection).every(k => photosBySection[k].length === 0) && (
                    <div className="text-center py-8 text-gray-400 text-sm italic">
                      No photos uploaded yet. Select a section and upload photos to see them here.
                    </div>
                  )}
                </div>

              </div>
            </SectionCard>
          </div>

        </div>
      </div>

      {/* Review Photos Modal */}
      <ReviewPhotosModal
        open={isReviewPhotosOpen}
        onOpenChange={setIsReviewPhotosOpen}
        photos={allPhotos}
        onPhotoClick={handleOpenPhotoModal}
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
        />
      )}
    </PageTemplate>
  );
}

// --- Helper Components ---

interface PhotoCardProps {
  photo: InspectionPhoto;
  sections: ChecklistNode[];
  onRemove: (id: string) => void;
  onMove: (id: string, newSectionId: string) => void;
  onPhotoClick: (photo: InspectionPhoto) => void;
}

function PhotoCard({ photo, sections, onRemove, onMove, onPhotoClick }: PhotoCardProps) {
  const [isMoving, setIsMoving] = useState(false);

  if (isMoving) {
    return (
      <div className="aspect-square bg-gray-50 border border-gray-200 rounded-lg flex flex-col items-center justify-center p-2 gap-2 shadow-sm">
        <p className="text-[10px] font-semibold text-gray-500 uppercase">Move to:</p>
        <select
          className="w-full text-xs p-1 border border-gray-300 rounded bg-white outline-none focus:border-blue-500"
          value={photo.sectionNodeId}
          onChange={(e) => {
            onMove(photo.id, e.target.value);
            setIsMoving(false);
          }}
        >
          {sections.map(s => (
            <option key={s.id} value={s.id}>{s.text}</option>
          ))}
        </select>
        <button 
          onClick={() => setIsMoving(false)}
          className="text-xs text-gray-500 hover:text-gray-800 hover:underline"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div 
      className="relative group border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm hover:border-blue-300 transition-colors cursor-pointer"
      onClick={() => onPhotoClick(photo)}
    >
      <div className="aspect-square bg-gray-100">
        <img src={photo.fileRef} alt="Inspection" className="w-full h-full object-cover" />
      </div>
      <div className="p-2 text-[10px] text-gray-500 truncate border-t border-gray-100">
        {new Date(photo.uploadedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </div>
      
      {/* Overlay Actions */}
      <div className="absolute top-1 right-1 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(photo.id);
          }}
          className="p-1.5 bg-white/90 rounded-full text-red-500 shadow-sm hover:text-red-600 hover:bg-white"
          title="Remove photo"
        >
          <DeleteIcon width={12} height={12} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            // Placeholder - move functionality could be accessed here if needed
          }}
          className="p-1.5 bg-white/90 rounded-full text-blue-500 shadow-sm hover:text-blue-600 hover:bg-white"
          title="Move to another section"
          disabled
        >
          <DocumentIcon width={12} height={12} />
        </button>
      </div>
    </div>
  );
}

interface ReviewPhotosModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  photos: InspectionPhoto[];
  onPhotoClick: (photo: InspectionPhoto) => void;
}

function ReviewPhotosModal({ open, onOpenChange, photos, onPhotoClick }: ReviewPhotosModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-gray-900">Review All Photos</h2>
            <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {photos.length} photo{photos.length !== 1 ? 's' : ''}
            </span>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="text-gray-400 hover:text-gray-600 transition-colors text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {photos.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No photos uploaded yet
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className="cursor-pointer group relative rounded-lg overflow-hidden border border-gray-200 hover:border-blue-400 transition-colors"
                  onClick={() => {
                    onPhotoClick(photo);
                    onOpenChange(false);
                  }}
                >
                  <div className="aspect-square bg-gray-100">
                    <img
                      src={photo.fileRef}
                      alt="Inspection"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 text-white text-sm font-medium">
                      View
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 text-white text-[10px]">
                    {new Date(photo.uploadedAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface PhotoViewerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  photo: InspectionPhoto;
  onNext: () => void;
  onPrev: () => void;
  photoIndex: number;
  totalPhotos: number;
}

function PhotoViewerModal({
  open,
  onOpenChange,
  photo,
  onNext,
  onPrev,
  photoIndex,
  totalPhotos,
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
        className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-gray-900">Photo Viewer</h2>
            <span className="text-sm text-gray-500">
              {photoIndex + 1} of {totalPhotos}
            </span>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="text-gray-400 hover:text-gray-600 transition-colors text-2xl leading-none"
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
