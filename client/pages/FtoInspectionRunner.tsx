import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { X, ChevronLeft, ChevronRight, Camera, Plus, Trash2, Edit2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { API_BASE, fetchJSON } from "@/api/fetchJSON";
import {
  ChecklistNode,
} from "@/data/inspection-checklist";
import {
  BackendInspectionFull,
  BackendInspectionPhoto,
  getInspectionFull,
  addInspectionPhotos,
  listInspectionPhotos,
  updateInspection,
  updateInspectionPhoto,
  deleteInspectionPhoto,
} from "@/api/inspections";

// --- Types ---

// Sentinel section_id used when an inspection has no template. Photos for
// templateless inspections attach under this single virtual node.
const GENERAL_PHOTO_SECTION = "general";

interface InspectionPhoto {
  id: string;
  url: string;
  uploadedAt: string;
  comment?: string;
  condition?: "good" | "fair" | "poor";
  sectionNodeId?: string;
  file?: File;
  isUploaded?: boolean;
}

const CONDITION_OPTIONS: { value: string; label: string; color: string; bg: string }[] = [
  { value: "good", label: "Good", color: "text-green-700", bg: "bg-green-100" },
  { value: "fair", label: "Fair", color: "text-yellow-700", bg: "bg-yellow-100" },
  { value: "poor", label: "Poor", color: "text-red-700", bg: "bg-red-100" },
];

// --- Helpers ---

const convertBackendChecklistToNodes = (backendChecklist: any): ChecklistNode[] => {
  if (!backendChecklist?.checklist_json) return [];
  const sections = backendChecklist.checklist_json.sections || [];
  const nodes: ChecklistNode[] = [];
  let nodeIndex = 0;

  const addItemsRecursively = (items: any[], parentId: string, depth: number) => {
    items?.forEach((item) => {
      nodes.push({
        id: item.id,
        parentId,
        orderIndex: nodeIndex++,
        type: depth === 0 ? "section" : "item",
        text: item.text,
        depth,
      });
      if (item.items?.length > 0) {
        addItemsRecursively(item.items, item.id, depth + 1);
      }
    });
  };

  sections.forEach((section: any) => {
    nodes.push({
      id: section.id,
      parentId: null,
      orderIndex: nodeIndex++,
      type: "section",
      text: section.title,
      depth: 0,
    });
    if (section.items?.length > 0) {
      addItemsRecursively(section.items, section.id, 1);
    }
  });
  return nodes;
};

const mapBackendPhotosToUI = (photos: BackendInspectionPhoto[]): InspectionPhoto[] =>
  photos.map((photo) => ({
    id: photo.id.toString(),
    url: `${API_BASE}/uploads/${photo.storage_path}`,
    uploadedAt: photo.created_at,
    comment: photo.comment,
    condition: photo.condition,
    sectionNodeId: photo.section_id,
    isUploaded: true,
  }));

// --- Component ---

export default function FtoInspectionRunner() {
  const navigate = useNavigate();
  const { inspectionId } = useParams<{ inspectionId: string }>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Data state
  const [loading, setLoading] = useState(true);
  const [inspectionData, setInspectionData] = useState<BackendInspectionFull | null>(null);
  const [checklist, setChecklist] = useState<ChecklistNode[]>([]);
  const [photos, setPhotos] = useState<InspectionPhoto[]>([]);
  const [isReadOnly, setIsReadOnly] = useState(false);

  // Navigation state
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [viewingCategoryId, setViewingCategoryId] = useState<string | null>(null);
  const [sectionDropdownOpen, setSectionDropdownOpen] = useState(false);
  const [expandedDropdownSections, setExpandedDropdownSections] = useState<Set<string>>(new Set());

  // New photo state (for the "add photo" form)
  const [newPhotoFile, setNewPhotoFile] = useState<File | null>(null);
  const [newPhotoPreview, setNewPhotoPreview] = useState<string | null>(null);
  const [newPhotoCondition, setNewPhotoCondition] = useState<string>("");
  const [newPhotoComment, setNewPhotoComment] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);

  // Edit photo state
  const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null);
  const [editCondition, setEditCondition] = useState<string>("");
  const [editComment, setEditComment] = useState<string>("");

  // Exit confirmation
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // --- Derived data ---

  // Get all "actionable" items (leaf nodes or parents of leaf nodes, excluding top-level sections)
  const actionableItems = useMemo(() => {
    const isLeaf = (node: ChecklistNode) => !checklist.some((n) => n.parentId === node.id);
    const hasLeafChild = (node: ChecklistNode) =>
      checklist.filter((n) => n.parentId === node.id).some((c) => isLeaf(c));
    return checklist.filter((n) => {
      if (n.depth === 0) return false;
      return isLeaf(n) || hasLeafChild(n);
    });
  }, [checklist]);

  const currentItem = actionableItems[currentItemIndex] || null;

  // When viewing a category, the active node is the category; otherwise the current item.
  const viewingCategory = useMemo(
    () => (viewingCategoryId ? checklist.find((n) => n.id === viewingCategoryId) ?? null : null),
    [viewingCategoryId, checklist]
  );
  const activeNode: ChecklistNode | null = viewingCategory || currentItem;

  // Photos for the active node (category or item).
  const currentItemPhotos = useMemo(
    () => (activeNode ? photos.filter((p) => p.sectionNodeId === activeNode.id) : []),
    [activeNode, photos]
  );

  // Get node path
  const getNodePath = useCallback(
    (nodeId: string): string => {
      const node = checklist.find((n) => n.id === nodeId);
      if (!node) return "";
      const path: string[] = [node.text];
      let current = node;
      while (current.parentId) {
        const parent = checklist.find((n) => n.id === current.parentId);
        if (!parent) break;
        path.unshift(parent.text);
        current = parent;
      }
      return path.join(" → ");
    },
    [checklist]
  );

  // Progress
  const itemsWithPhotos = useMemo(() => {
    const photoNodeIds = new Set(photos.map((p) => p.sectionNodeId));
    return actionableItems.filter((item) => photoNodeIds.has(item.id)).length;
  }, [actionableItems, photos]);

  // Get section for a node
  const getSectionForNode = useCallback(
    (nodeId: string): ChecklistNode | null => {
      const node = checklist.find((n) => n.id === nodeId);
      if (!node) return null;
      if (node.depth === 0) return node;
      let current = node;
      while (current.parentId) {
        const parent = checklist.find((n) => n.id === current.parentId);
        if (!parent) break;
        if (parent.depth === 0) return parent;
        current = parent;
      }
      return null;
    },
    [checklist]
  );

  // Current section info for display
  const currentSection = viewingCategory
    ? viewingCategory
    : currentItem
      ? getSectionForNode(currentItem.id)
      : null;

  // --- Load data ---

  useEffect(() => {
    if (!inspectionId) return;
    const load = async () => {
      try {
        setLoading(true);
        const data = await getInspectionFull(Number(inspectionId));
        setInspectionData(data);

        const status = data.inspection.status;
        setIsReadOnly(status !== "draft" && status !== "scheduled" && status !== "in_progress");

        if (data.checklist) {
          setChecklist(convertBackendChecklistToNodes(data.checklist));
        } else {
          // Templateless inspection: synthesize a single "General Photos" node
          // so the runner's checklist-driven flow has one item to walk.
          setChecklist([
            {
              id: GENERAL_PHOTO_SECTION,
              parentId: null,
              orderIndex: 0,
              type: "item",
              text: "General Photos",
              depth: 1,
            },
          ]);
        }
        if (data.photos?.length) {
          setPhotos(mapBackendPhotosToUI(data.photos));
        }

        // Starting the inspection promotes it out of the queued state into "in_progress".
        if (status === "draft" || status === "scheduled") {
          try {
            await updateInspection(Number(inspectionId), { status: "in_progress" });
          } catch {
            // Non-critical
          }
        }
      } catch (err) {
        console.error("Failed to load inspection:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [inspectionId]);

  // --- Handlers ---

  const clearNewPhotoForm = () => {
    if (newPhotoPreview) URL.revokeObjectURL(newPhotoPreview);
    setNewPhotoFile(null);
    setNewPhotoPreview(null);
    setNewPhotoCondition("");
    setNewPhotoComment("");
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    clearNewPhotoForm();
    setNewPhotoFile(file);
    setNewPhotoPreview(URL.createObjectURL(file));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUploadPhoto = async () => {
    if (!newPhotoFile || !activeNode || !inspectionId) return;

    const cond =
      newPhotoCondition && ["good", "fair", "poor"].includes(newPhotoCondition)
        ? (newPhotoCondition as "good" | "fair" | "poor")
        : undefined;

    setIsUploading(true);
    try {
      await addInspectionPhotos(
        Number(inspectionId),
        activeNode.id,
        newPhotoComment || "",
        [newPhotoFile],
        cond
      );
      // Refresh photos
      const refreshed = await listInspectionPhotos(Number(inspectionId));
      setPhotos(mapBackendPhotosToUI(refreshed));
      clearNewPhotoForm();
    } catch (err) {
      console.error("Failed to upload photo:", err);
      alert("Failed to upload photo. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleNavigate = (direction: "prev" | "next") => {
    // Clear any in-progress new photo form
    clearNewPhotoForm();
    setEditingPhotoId(null);

    // Leaving a category view drops the user back onto the current item in the flow.
    if (viewingCategoryId) {
      setViewingCategoryId(null);
      return;
    }

    if (direction === "next") {
      if (currentItemIndex < actionableItems.length - 1) {
        setCurrentItemIndex(currentItemIndex + 1);
      } else {
        // Last item — show finish prompt
        handleFinish();
      }
    } else {
      if (currentItemIndex > 0) {
        setCurrentItemIndex(currentItemIndex - 1);
      }
    }
  };

  const handleFinish = async () => {
    if (!inspectionId) return;
    const confirmFinish = window.confirm(
      "Submit this inspection? You won't be able to make changes after submitting."
    );
    if (!confirmFinish) return;

    try {
      await updateInspection(Number(inspectionId), { status: "submitted" });
      navigate(`/fto/inspections/${inspectionId}`);
    } catch (err) {
      console.error("Failed to submit:", err);
      alert("Failed to submit inspection.");
    }
  };

  const handleExit = () => {
    // Auto-saved, so just navigate back
    navigate(`/fto/inspections/${inspectionId}`);
  };

  const handleJumpToItem = (itemIndex: number) => {
    clearNewPhotoForm();
    setEditingPhotoId(null);
    setViewingCategoryId(null);
    setCurrentItemIndex(itemIndex);
    setSectionDropdownOpen(false);
    setExpandedDropdownSections(new Set());
  };

  const handleJumpToCategory = (sectionId: string) => {
    clearNewPhotoForm();
    setEditingPhotoId(null);
    setViewingCategoryId(sectionId);
    setSectionDropdownOpen(false);
    setExpandedDropdownSections(new Set());
  };

  const handleStartEditPhoto = (photo: InspectionPhoto) => {
    setEditingPhotoId(photo.id);
    setEditCondition(photo.condition || "");
    setEditComment(photo.comment || "");
  };

  const handleSaveEditPhoto = async (photoId: string) => {
    if (!inspectionId) return;
    try {
      const cond =
        editCondition && ["good", "fair", "poor"].includes(editCondition)
          ? (editCondition as "good" | "fair" | "poor")
          : null;
      await updateInspectionPhoto(Number(inspectionId), Number(photoId), {
        condition: cond,
        comment: editComment || null,
      });
      const refreshed = await listInspectionPhotos(Number(inspectionId));
      setPhotos(mapBackendPhotosToUI(refreshed));
    } catch (err) {
      console.error("Failed to update photo:", err);
    }
    setEditingPhotoId(null);
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!inspectionId) return;
    const confirmDelete = window.confirm("Delete this photo?");
    if (!confirmDelete) return;

    try {
      await deleteInspectionPhoto(Number(inspectionId), Number(photoId));
      const refreshed = await listInspectionPhotos(Number(inspectionId));
      setPhotos(mapBackendPhotosToUI(refreshed));
    } catch (err) {
      console.error("Failed to delete photo:", err);
      alert("Failed to delete photo.");
    }
  };

  // --- Section dropdown tree ---

  const topLevelSections = useMemo(() => checklist.filter((n) => n.depth === 0), [checklist]);

  const getItemsInSection = useCallback(
    (sectionId: string): ChecklistNode[] => {
      return actionableItems.filter((item) => {
        const section = getSectionForNode(item.id);
        return section?.id === sectionId;
      });
    },
    [actionableItems, getSectionForNode]
  );

  // --- Render ---

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-white flex items-center justify-center">
        <p className="text-gray-500 text-sm">Loading inspection...</p>
      </div>
    );
  }

  if (!inspectionData || actionableItems.length === 0) {
    return (
      <div className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center gap-4">
        <p className="text-gray-500 text-sm">No checklist items found.</p>
        <button
          onClick={() => navigate(`/fto/inspections/${inspectionId}`)}
          className="text-sm text-blue-600 hover:underline"
        >
          Go back
        </button>
      </div>
    );
  }

  const isLastItem = currentItemIndex === actionableItems.length - 1;
  const isFirstItem = currentItemIndex === 0;

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      {/* ===== TOP BAR ===== */}
      <div className="flex-shrink-0 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3 px-4 py-3">
          {/* Exit button */}
          <button
            onClick={handleExit}
            className="flex-shrink-0 p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            title="Exit"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>

          {/* Section dropdown */}
          <div className="flex-1 min-w-0 relative">
            <button
              onClick={() => setSectionDropdownOpen(!sectionDropdownOpen)}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition-colors"
            >
              <span className="truncate text-gray-900 font-medium">
                {currentSection ? currentSection.text : "Select Section"}
              </span>
              <ChevronRight
                className={cn(
                  "w-4 h-4 text-gray-400 flex-shrink-0 transition-transform",
                  sectionDropdownOpen && "rotate-90"
                )}
              />
            </button>

            {/* Dropdown */}
            {sectionDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => {
                    setSectionDropdownOpen(false);
                    setExpandedDropdownSections(new Set());
                  }}
                />
                <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-[60vh] overflow-y-auto">
                  {topLevelSections.map((section) => {
                    const sectionItems = getItemsInSection(section.id);
                    const isExpanded = expandedDropdownSections.has(section.id);
                    const sectionPhotoCount = sectionItems.filter((item) =>
                      photos.some((p) => p.sectionNodeId === item.id)
                    ).length;

                    return (
                      <div key={section.id}>
                        <button
                          onClick={() => {
                            setExpandedDropdownSections((prev) => {
                              const next = new Set(prev);
                              if (next.has(section.id)) next.delete(section.id);
                              else next.add(section.id);
                              return next;
                            });
                          }}
                          className={cn(
                            "w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-gray-50 transition-colors border-b border-gray-100",
                            currentSection?.id === section.id && "bg-blue-50"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <ChevronRight
                              className={cn(
                                "w-4 h-4 text-gray-400 transition-transform",
                                isExpanded && "rotate-90"
                              )}
                            />
                            <span className="font-medium text-gray-900">
                              {section.text}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {sectionPhotoCount}/{sectionItems.length}
                          </span>
                        </button>

                        {isExpanded && (
                          <div className="bg-gray-50">
                            {(() => {
                              const categoryPhotoCount = photos.filter(
                                (p) => p.sectionNodeId === section.id
                              ).length;
                              return (
                                <button
                                  onClick={() => handleJumpToCategory(section.id)}
                                  className={cn(
                                    "w-full flex items-center gap-2 px-8 py-2.5 text-sm hover:bg-gray-100 transition-colors text-left border-b border-gray-200",
                                    viewingCategoryId === section.id && "bg-blue-100"
                                  )}
                                >
                                  <Camera className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                                  <span className="text-gray-700 flex-1 truncate">
                                    Category photos
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {categoryPhotoCount}
                                  </span>
                                </button>
                              );
                            })()}
                            {sectionItems.map((item) => {
                              const globalIndex = actionableItems.indexOf(item);
                              const hasPhoto = photos.some(
                                (p) => p.sectionNodeId === item.id
                              );
                              return (
                                <button
                                  key={item.id}
                                  onClick={() => handleJumpToItem(globalIndex)}
                                  className={cn(
                                    "w-full flex items-center gap-2 px-8 py-2.5 text-sm hover:bg-gray-100 transition-colors text-left",
                                    globalIndex === currentItemIndex && "bg-blue-100"
                                  )}
                                >
                                  <div
                                    className={cn(
                                      "w-2 h-2 rounded-full flex-shrink-0",
                                      hasPhoto ? "bg-green-500" : "bg-gray-300"
                                    )}
                                  />
                                  <span className="text-gray-700 truncate">
                                    {item.text}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Progress */}
          <div className="flex-shrink-0 text-xs text-gray-500 font-medium whitespace-nowrap">
            {itemsWithPhotos}/{actionableItems.length}
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-gray-100">
          <div
            className="h-full bg-blue-600 transition-all duration-300"
            style={{
              width: `${actionableItems.length > 0 ? ((currentItemIndex + 1) / actionableItems.length) * 100 : 0}%`,
            }}
          />
        </div>
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-5">
          {/* Item header */}
          <div>
            <p className="text-xs text-gray-400 mb-1">
              {viewingCategory
                ? `${viewingCategory.text} · Category photos`
                : currentItem
                  ? getNodePath(currentItem.id)
                  : ""}
            </p>
            <h2 className="text-base font-semibold text-gray-900">
              {viewingCategory
                ? `${viewingCategory.text} — overview photos`
                : currentItem?.text || ""}
            </h2>
            {viewingCategory && (
              <p className="text-xs text-gray-500 mt-1">
                Optional high-level photos for this section. Not required to complete the inspection.
              </p>
            )}
          </div>

          {/* Existing photos for this item */}
          {currentItemPhotos.length > 0 && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-700">
                  Photos ({currentItemPhotos.length})
                </p>
                {!isReadOnly && !newPhotoFile && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Photo
                  </button>
                )}
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {currentItemPhotos.map((photo) => {
                  const isEditing = editingPhotoId === photo.id;
                  const condOption = CONDITION_OPTIONS.find(
                    (o) => o.value === photo.condition
                  );

                  return (
                    <div
                      key={photo.id}
                      className={cn(
                        "flex-shrink-0 w-48 border rounded-lg overflow-hidden bg-white",
                        isEditing ? "border-blue-400 shadow-md" : "border-gray-200"
                      )}
                    >
                      {/* Thumbnail */}
                      <div className="aspect-square bg-gray-100 relative">
                        <img
                          src={photo.url}
                          alt="Inspection"
                          className="w-full h-full object-cover"
                        />
                        {!isReadOnly && !isEditing && (
                          <div className="absolute top-1.5 right-1.5 flex gap-1">
                            <button
                              onClick={() => handleStartEditPhoto(photo)}
                              className="p-1 bg-white/90 rounded-md hover:bg-white transition-colors shadow-sm"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-gray-600" />
                            </button>
                            <button
                              onClick={() => handleDeletePhoto(photo.id)}
                              className="p-1 bg-white/90 rounded-md hover:bg-red-50 transition-colors shadow-sm"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-500" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      {!isEditing ? (
                        <div className="p-2 flex flex-col gap-1">
                          {condOption && (
                            <span
                              className={cn(
                                "text-xs font-medium px-1.5 py-0.5 rounded w-fit",
                                condOption.bg,
                                condOption.color
                              )}
                            >
                              {condOption.label}
                            </span>
                          )}
                          {photo.comment && (
                            <p className="text-xs text-gray-600 line-clamp-2">
                              {photo.comment}
                            </p>
                          )}
                          {!condOption && !photo.comment && (
                            <p className="text-xs text-gray-400 italic">No details</p>
                          )}
                        </div>
                      ) : (
                        /* Edit mode */
                        <div className="p-2 flex flex-col gap-2">
                          <div className="flex gap-1">
                            {CONDITION_OPTIONS.map((opt) => (
                              <button
                                key={opt.value}
                                onClick={() => setEditCondition(opt.value)}
                                className={cn(
                                  "text-xs px-2 py-1 rounded font-medium transition-colors",
                                  editCondition === opt.value
                                    ? `${opt.bg} ${opt.color}`
                                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                                )}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                          <input
                            type="text"
                            value={editComment}
                            onChange={(e) => setEditComment(e.target.value)}
                            placeholder="Comment..."
                            className="text-xs px-2 py-1.5 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-400"
                          />
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleSaveEditPhoto(photo.id)}
                              className="flex-1 text-xs px-2 py-1.5 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 transition-colors"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingPhotoId(null)}
                              className="text-xs px-2 py-1.5 border border-gray-200 rounded text-gray-600 hover:bg-gray-50 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

              </div>
            </div>
          )}

          {/* New photo upload area */}
          {!isReadOnly && (
            <div className="flex flex-col gap-4">
              {/* Upload zone - show when no existing photos and no new photo selected, OR when there ARE existing photos but the + card won't be visible because newPhotoFile is set */}
              {!newPhotoFile && currentItemPhotos.length === 0 && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-colors"
                >
                  <Camera className="w-8 h-8 text-gray-400" />
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600">
                      Tap to take photo or select from gallery
                    </p>
                    <p className="text-xs text-gray-400 mt-1">JPG, PNG supported</p>
                  </div>
                </div>
              )}

              {/* New photo preview + form */}
              {newPhotoFile && newPhotoPreview && (
                <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                  {/* Preview */}
                  <div className="relative aspect-video bg-gray-100">
                    <img
                      src={newPhotoPreview}
                      alt="Preview"
                      className="w-full h-full object-contain"
                    />
                    <button
                      onClick={clearNewPhotoForm}
                      className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full hover:bg-white transition-colors shadow-sm"
                    >
                      <X className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>

                  {/* Form */}
                  <div className="p-4 flex flex-col gap-3">
                    {/* Condition buttons */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-gray-700">
                        Condition
                      </label>
                      <div className="flex gap-2">
                        {CONDITION_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() =>
                              setNewPhotoCondition(
                                newPhotoCondition === opt.value ? "" : opt.value
                              )
                            }
                            className={cn(
                              "flex-1 text-sm px-3 py-2 rounded-lg font-medium transition-colors border",
                              newPhotoCondition === opt.value
                                ? `${opt.bg} ${opt.color} border-current`
                                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                            )}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Comment */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-gray-700">
                        Comment (optional)
                      </label>
                      <textarea
                        value={newPhotoComment}
                        onChange={(e) => setNewPhotoComment(e.target.value)}
                        placeholder="Add a comment..."
                        rows={2}
                        className="text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      />
                    </div>

                    {/* Upload button */}
                    <button
                      onClick={handleUploadPhoto}
                      disabled={isUploading}
                      className="w-full px-4 py-2.5 bg-[#013764] text-white rounded-lg text-sm font-medium hover:bg-[#012a4e] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isUploading ? "Uploading..." : "Upload Photo"}
                    </button>
                  </div>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>
          )}
        </div>
      </div>

      {/* ===== BOTTOM NAV ===== */}
      <div className="flex-shrink-0 border-t border-gray-200 bg-white px-4 py-3 safe-area-pb">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-2">
          {viewingCategory ? (
            <button
              onClick={() => {
                clearNewPhotoForm();
                setEditingPhotoId(null);
                setViewingCategoryId(null);
              }}
              className="flex items-center gap-1 px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors w-full justify-center"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to checklist
            </button>
          ) : (
            <>
              <button
                onClick={() => handleNavigate("prev")}
                disabled={isFirstItem}
                className="flex items-center gap-1 px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Prev
              </button>

              <span className="text-xs text-gray-500 whitespace-nowrap">
                {currentItemIndex + 1} / {actionableItems.length}
              </span>

              {isLastItem ? (
                <button
                  onClick={handleFinish}
                  disabled={isReadOnly}
                  className="flex items-center gap-1 px-3 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <Check className="w-4 h-4" />
                  Finish
                </button>
              ) : (
                <button
                  onClick={() => handleNavigate("next")}
                  className="flex items-center gap-1 px-3 py-2.5 bg-[#013764] text-white rounded-lg text-sm font-medium hover:bg-[#012a4e] transition-colors"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
