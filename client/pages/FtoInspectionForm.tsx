import React, { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageTemplate from "@/layout/PageTemplate";
import BlueButton from "@/components/BlueButton";
import {
  CloseIcon,
  PlusIcon,
  DeleteIcon,
  ChevronDownIcon,
} from "@/components/icons";
import { Maximize2, Minimize2, Camera, ChevronRight, ChevronDown } from "lucide-react";
import { SelectField, DateField, ComboboxField } from "@/components/forms";
import { PROPERTIES } from "@/data/fto/properties";
import PhotoCommentModal from "@/components/PhotoCommentModal";
import { cn } from "@/lib/utils";
import { API_BASE, fetchJSON } from "@/api/fetchJSON";
import { useAuth } from "@/auth/useAuth";
import {
  ChecklistNode,
  MOCK_CHECKLIST_NODES,
  getChecklistForProperty,
} from "@/data/inspection-checklist";
import {
  BackendInspectionChecklist,
  BackendInspectionPhoto,
  getInspectionFull,
  listInspectionPhotos,
  addInspectionPhotos,
  createInspection,
  updateInspection,
  listChecklists,
  updateInspectionPhoto,
} from "@/api/inspections";
import {
  PROPERTY_LEVEL_LABEL,
  PROPERTY_LEVEL_SHORT_LABEL,
  PROPERTY_LEVEL_UNIT_ID,
} from "@/utils/unitLabel";

// --- Types ---

// Sentinel section_id used when an inspection has no template and photos
// are attached at the inspection level. Stored in inspection_photos.section_id
// (which is NOT NULL in the DB) for templateless inspections.
const GENERAL_PHOTO_SECTION = "general";

interface InspectionPhoto {
  id: string;
  url: string;
  uploadedAt: string;
  comment?: string;
  condition?: "good" | "fair" | "poor";
  sectionNodeId?: string; // This is actually the checklist node ID (can be any depth)
  file?: File;
  isUploaded?: boolean;
}


interface StoredInspection {
  id: number;
  date: string;
  propertyId: string;
  unitId: string | null;
  photos: InspectionPhoto[];
}

const convertBackendChecklistToNodes = (
  backendChecklist: BackendInspectionChecklist | null
): ChecklistNode[] => {
  if (!backendChecklist || !backendChecklist.checklist_json) {
    return [];
  }

  const sections = backendChecklist.checklist_json.sections || [];
  const nodes: ChecklistNode[] = [];
  let nodeIndex = 0;

  const addItemsRecursively = (
    items: any[],
    parentId: string,
    depth: number
  ) => {
    items?.forEach((item) => {
      const itemNode: ChecklistNode = {
        id: item.id,
        parentId,
        orderIndex: nodeIndex++,
        type: depth === 0 ? "section" : "item",
        text: item.text,
        depth,
      };
      nodes.push(itemNode);

      if (item.items && item.items.length > 0) {
        addItemsRecursively(item.items, item.id, depth + 1);
      }
    });
  };

  sections.forEach((section: any) => {
    const sectionNode: ChecklistNode = {
      id: section.id,
      parentId: null,
      orderIndex: nodeIndex++,
      type: "section",
      text: section.title,
      depth: 0,
    };
    nodes.push(sectionNode);

    if (section.items && section.items.length > 0) {
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

// --- Components ---

interface NestedChecklistSelectProps {
  label: string;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  checklist: ChecklistNode[];
  getNodePath: (nodeId: string) => string;
}

function NestedChecklistSelect({
  label,
  value,
  onChange,
  placeholder = "Select a checklist item...",
  checklist,
  getNodePath,
}: NestedChecklistSelectProps) {
  const [open, setOpen] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [navigationStack, setNavigationStack] = useState<string[]>([]); // Stack of node IDs for breadcrumb navigation

  // Build tree structure
  const buildTree = () => {
    const tree: Record<string, ChecklistNode[]> = {};
    const rootNodes: ChecklistNode[] = [];

    checklist.forEach((node) => {
      if (node.depth === 0) {
        rootNodes.push(node);
        tree[node.id] = [];
      } else if (node.parentId) {
        if (!tree[node.parentId]) {
          tree[node.parentId] = [];
        }
        tree[node.parentId].push(node);
      }
    });

    return { tree, rootNodes };
  };

  const { tree, rootNodes } = buildTree();

  // Get current level nodes based on navigation stack
  const getCurrentLevelNodes = (): ChecklistNode[] => {
    if (navigationStack.length === 0) {
      return rootNodes;
    }
    const currentParentId = navigationStack[navigationStack.length - 1];
    return tree[currentParentId] || [];
  };

  const currentNodes = getCurrentLevelNodes();
  const selectedNode = checklist.find((n) => n.id === value);
  const displayValue = selectedNode ? getNodePath(selectedNode.id) : placeholder;

  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  const navigateToNode = (nodeId: string) => {
    setNavigationStack((prev) => [...prev, nodeId]);
    setExpandedNodes((prev) => new Set(prev).add(nodeId));
  };

  const navigateBack = () => {
    setNavigationStack((prev) => prev.slice(0, -1));
  };

  const handleSelect = (nodeId: string) => {
    onChange?.(nodeId);
    setOpen(false);
    setNavigationStack([]);
    setExpandedNodes(new Set());
  };

  const hasChildren = (nodeId: string) => {
    return tree[nodeId] && tree[nodeId].length > 0;
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
      </label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          onKeyDown={(e) => {
            if (e.key === "Escape" && open) {
              setOpen(false);
              setNavigationStack([]);
              setExpandedNodes(new Set());
            }
          }}
          className={cn(
            "w-full rounded-lg border bg-white px-3 py-2 text-sm font-normal transition-colors flex items-center justify-between cursor-pointer",
            open
              ? "border-black"
              : "border-[var(--color-border-light)]"
          )}
          style={{
            fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif",
            lineHeight: 1.43,
            minHeight: "44px",
            color: value ? "var(--color-text-primary)" : "#303030",
          }}
        >
          <span className="truncate text-left flex-1">{displayValue}</span>
          <ChevronDownIcon
            width={16}
            height={16}
            className={cn(
              "ml-2 flex-shrink-0 transition-transform",
              open && "rotate-180"
            )}
          />
        </button>

        {open && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => {
                setOpen(false);
                setNavigationStack([]);
                setExpandedNodes(new Set());
              }}
            />
            <div
              className="absolute z-20 w-full mt-1 rounded-lg border border-[var(--color-border-light)] bg-white shadow-lg"
              style={{ maxHeight: "400px", overflow: "hidden", display: "flex", flexDirection: "column" }}
            >
              {/* Breadcrumb Navigation */}
              {navigationStack.length > 0 && (
                <div className="flex items-center gap-1 px-3 py-2 border-b border-gray-200 bg-gray-50 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setNavigationStack([])}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    All Sections
                  </button>
                  {navigationStack.map((nodeId, index) => {
                    const node = checklist.find((n) => n.id === nodeId);
                    if (!node) return null;
                    return (
                      <React.Fragment key={nodeId}>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                        <button
                          type="button"
                          onClick={() =>
                            setNavigationStack((prev) => prev.slice(0, index + 1))
                          }
                          className="text-sm text-blue-600 hover:text-blue-800 font-medium truncate max-w-[150px]"
                        >
                          {node.text}
                        </button>
                      </React.Fragment>
                    );
                  })}
                </div>
              )}

              {/* Options List */}
              <div
                className="overflow-y-auto flex-1"
                style={{ maxHeight: "350px" }}
              >
                {currentNodes.length === 0 ? (
                  <div className="px-3 py-4 text-sm text-gray-500 text-center">
                    No items
                  </div>
                ) : (
                  <div className="py-1">
                    {currentNodes.map((node) => {
                      const nodeHasChildren = hasChildren(node.id);
                      const isSelected = value === node.id;
                      const isExpanded = expandedNodes.has(node.id);

                      return (
                        <div key={node.id}>
                          <div
                            className={cn(
                              "flex items-center gap-2 px-3 py-2 hover:bg-blue-50 cursor-pointer transition-colors",
                              isSelected && "bg-blue-100"
                            )}
                          >
                            {nodeHasChildren ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleNode(node.id);
                                  navigateToNode(node.id);
                                }}
                                className="flex-shrink-0 p-0.5 hover:bg-blue-100 rounded"
                              >
                                {isExpanded ? (
                                  <ChevronDown className="w-4 h-4 text-gray-600" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-gray-600" />
                                )}
                              </button>
                            ) : (
                              <div className="w-5" /> // Spacer for alignment
                            )}
                            <button
                              type="button"
                              onClick={() => handleSelect(node.id)}
                              className="flex-1 text-left text-sm"
                              style={{
                                color: "var(--color-text-primary)",
                                fontFamily:
                                  "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                              }}
                            >
                              {node.text}
                            </button>
                            {isSelected && (
                              <div className="flex-shrink-0 text-blue-600">
                                ✓
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function FtoInspectionForm() {
  const navigate = useNavigate();
  const { inspectionId } = useParams<{ inspectionId?: string }>();
  const { userId } = useAuth();
  const [inspectionStatus, setInspectionStatus] = useState<string | null>(null);
  const [isLoadingInspection, setIsLoadingInspection] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Determine if inspection should be read-only based on status
  // Only "draft" and "in_progress" statuses are editable
  const isReadOnly = inspectionStatus !== null && 
    inspectionStatus !== "draft" && 
    inspectionStatus !== "in_progress";

  // Form State
  const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const [unitId, setUnitId] = useState<string | null>(null);
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [propertyOptions, setPropertyOptions] = useState(PROPERTIES);
  
  // API State for properties, units, and templates
  const [properties, setProperties] = useState<any[]>([]);
  const [propertiesLoading, setPropertiesLoading] = useState(false);
  const [unitsByProperty, setUnitsByProperty] = useState<Record<string, any[]>>({});
  const [unitsLoading, setUnitsLoading] = useState<Record<string, boolean>>({});
  const [templatesByProperty, setTemplatesByProperty] = useState<Record<string, BackendInspectionChecklist[]>>({});
  const [templatesLoading, setTemplatesLoading] = useState<Record<string, boolean>>({});

  // Inspection State
  const [photos, setPhotos] = useState<InspectionPhoto[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string>(""); // The checklist node to attach photo to

  // UI State
  const [isPhotoCommentModalOpen, setIsPhotoCommentModalOpen] = useState(false);
  const [pendingPhotoFile, setPendingPhotoFile] = useState<File | null>(null);
  const [existingPhotoForModal, setExistingPhotoForModal] = useState<{ url: string; comment?: string; condition?: string } | null>(null);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isChecklistFullScreen, setIsChecklistFullScreen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [currentLineItemIndex, setCurrentLineItemIndex] = useState(0);
  const [currentSectionLineItems, setCurrentSectionLineItems] = useState<ChecklistNode[]>([]);
  const [validationErrors, setValidationErrors] = useState<{
    date?: string;
    property?: string;
    template?: string;
    photos?: string;
  }>({});

  // Refs
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Derived Data
  const [loadedChecklist, setLoadedChecklist] = useState<ChecklistNode[] | null>(null);
  const currentChecklist = useMemo(
    () => loadedChecklist ?? getChecklistForProperty(propertyId),
    [loadedChecklist, propertyId]
  );
  const checklistSections = useMemo(() => currentChecklist.filter((n) => n.depth === 0), [currentChecklist]);

  // Helper to get the full hierarchy path for a node
  const getNodePath = (nodeId: string): string => {
    const node = currentChecklist.find((n) => n.id === nodeId);
    if (!node) return "";

    const path: string[] = [node.text];
    let currentNode = node;

    while (currentNode.parentId) {
      const parent = currentChecklist.find((n) => n.id === currentNode.parentId);
      if (!parent) break;
      path.unshift(parent.text);
      currentNode = parent;
    }

    return path.join(" → ");
  };

  // Helper to check if a node has photos
  const hasPhotoForNode = (nodeId: string) => {
    return photos.some((p) => p.sectionNodeId === nodeId);
  };

  // Helper to get photo count for a node
  const getNodePhotoCount = (nodeId: string): number => {
    return photos.filter((p) => p.sectionNodeId === nodeId).length;
  };

  // --- Effects ---

  // Load properties from API (only for new inspections)
  useEffect(() => {
    if (inspectionId) return; // Don't load if viewing existing inspection
    
    let isMounted = true;
    
    const loadProperties = async () => {
      try {
        setPropertiesLoading(true);
        const data: any[] = await fetchJSON("/properties");
        
        if (!isMounted) return;
        
        // Filter active properties
        setProperties(data.filter((p) => p.active));
      } catch (err) {
        console.error("Failed to load properties:", err);
      } finally {
        if (isMounted) {
          setPropertiesLoading(false);
        }
      }
    };
    
    loadProperties();
    
    return () => {
      isMounted = false;
    };
  }, [inspectionId]);

  // Load units for a property
  const loadUnitsForProperty = async (propertyId: string) => {
    if (unitsByProperty[propertyId]) return; // cached
    
    try {
      setUnitsLoading((prev) => ({ ...prev, [propertyId]: true }));
      
      const data: any[] = await fetchJSON(`/properties/${propertyId}/units`);
      
      setUnitsByProperty((prev) => ({
        ...prev,
        [propertyId]: data || [],
      }));
    } catch (err) {
      console.error("Failed to load units:", err);
      setUnitsByProperty((prev) => ({
        ...prev,
        [propertyId]: [],
      }));
    } finally {
      setUnitsLoading((prev) => ({ ...prev, [propertyId]: false }));
    }
  };

  // Load templates (checklists) for a property
  const loadTemplatesForProperty = async (propertyId: string) => {
    if (templatesByProperty[propertyId]) return; // cached
    
    try {
      setTemplatesLoading((prev) => ({ ...prev, [propertyId]: true }));
      
      const data = await listChecklists(Number(propertyId));
      
      setTemplatesByProperty((prev) => ({
        ...prev,
        [propertyId]: data || [],
      }));
    } catch (err) {
      console.error("Failed to load templates:", err);
      setTemplatesByProperty((prev) => ({
        ...prev,
        [propertyId]: [],
      }));
    } finally {
      setTemplatesLoading((prev) => ({ ...prev, [propertyId]: false }));
    }
  };

  // Load inspection data from backend API if viewing existing inspection
  useEffect(() => {
    const loadInspection = async () => {
      if (!inspectionId) return;

      try {
        setIsLoadingInspection(true);
        const fullInspection = await getInspectionFull(Number(inspectionId));
        const { inspection, checklist, photos: backendPhotos } = fullInspection;

        setInspectionStatus(inspection.status);
        if (inspection.due_date) {
          const dueDate = new Date(inspection.due_date);
          setDate(dueDate.toISOString().split("T")[0]);
        }

        const resolvedPropertyId = inspection.property_id
          ? inspection.property_id.toString()
          : null;
        if (resolvedPropertyId) {
          setPropertyOptions((prev) => {
            const existing = prev.find((p) => p.id === resolvedPropertyId);
            if (!existing) {
              return [
                ...prev,
                {
                  id: resolvedPropertyId,
                  name: inspection.property_name || `Property ${inspection.property_id}`,
                  units: [{ id: "na", name: "N/A" }],
                },
              ];
            }
            if (inspection.unit_id && !existing.units.some((u) => u.id === inspection.unit_id?.toString())) {
              return prev.map((p) =>
                p.id === resolvedPropertyId
                  ? {
                      ...p,
                      units: [
                        ...p.units,
                        { id: inspection.unit_id?.toString() || "na", name: `Unit ${inspection.unit_id}` },
                      ],
                    }
                  : p
              );
            }
            return prev;
          });
          setPropertyId(resolvedPropertyId);
        }

        const resolvedUnitId = inspection.unit_id ? inspection.unit_id.toString() : null;
        setUnitId(resolvedUnitId);

        if (checklist) {
          setLoadedChecklist(convertBackendChecklistToNodes(checklist));
        }

        if (backendPhotos?.length) {
          setPhotos(mapBackendPhotosToUI(backendPhotos));
        } else {
          setPhotos([]);
        }
      } catch (error) {
        console.error("Failed to load inspection:", error);
        // Fallback to localStorage if API fails
        const storedInspections = JSON.parse(
          localStorage.getItem("inspectionData") || "{}"
        ) as Record<string, StoredInspection>;
        
        const inspectionData = storedInspections[inspectionId];
        if (inspectionData) {
          setDate(inspectionData.date);
          setPropertyId(inspectionData.propertyId);
          setUnitId(inspectionData.unitId);
          setPhotos(inspectionData.photos);
          // Assume draft status if loading from localStorage
          setInspectionStatus("draft");
        }
      } finally {
        setIsLoadingInspection(false);
      }
    };

    loadInspection();
  }, [inspectionId]);

  // --- Handlers ---

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // Store the selected file and open the modal
      setPendingPhotoFile(e.target.files[0]);
      // Check if there's an existing photo for the selected node
      if (selectedNodeId) {
        const existingPhoto = photos.find(p => p.sectionNodeId === selectedNodeId && p.isUploaded);
        if (existingPhoto) {
          setExistingPhotoForModal({
            url: existingPhoto.url,
            comment: existingPhoto.comment,
            condition: existingPhoto.condition,
          });
        } else {
          setExistingPhotoForModal(null);
        }
      } else {
        setExistingPhotoForModal(null);
      }
      setIsPhotoCommentModalOpen(true);

      if (photoInputRef.current) photoInputRef.current.value = "";
    }
  };

  const handlePhotoCommentSubmit = async (file: File, comment: string, condition?: string) => {
    // Templateless inspections (no checklist) use the GENERAL_PHOTO_SECTION sentinel.
    const isTemplateless = !templateId && !loadedChecklist;
    const targetNodeId = selectedNodeId || (isTemplateless ? GENERAL_PHOTO_SECTION : "");
    if (!targetNodeId) {
      alert("Please select a checklist item first.");
      return;
    }

    const cond = condition && ["good", "fair", "poor"].includes(condition)
      ? (condition as "good" | "fair" | "poor")
      : undefined;

    const newPhoto: InspectionPhoto = {
      id: `new_${Date.now()}_${Math.random()}`,
      url: URL.createObjectURL(file),
      uploadedAt: new Date().toISOString(),
      comment: comment || undefined,
      condition: cond,
      sectionNodeId: targetNodeId,
      file,
      isUploaded: false,
    };

    if (inspectionId && !isReadOnly) {
      try {
        setIsUploadingPhoto(true);
        await addInspectionPhotos(
          Number(inspectionId),
          targetNodeId,
          comment || "",
          [file],
          cond
        );
        const refreshed = await listInspectionPhotos(Number(inspectionId));
        setPhotos(mapBackendPhotosToUI(refreshed));
        // Clear existing photo state after successful upload
        setExistingPhotoForModal(null);
      } catch (error) {
        console.error("Failed to upload photo:", error);
        alert("Failed to upload photo. Please try again.");
        setPhotos((prev) => [...prev, newPhoto]);
      } finally {
        setIsUploadingPhoto(false);
      }
    } else {
      setPhotos((prev) => [...prev, newPhoto]);
    }

    setPendingPhotoFile(null);
    // Don't close modal if there are more items to navigate to
    // Navigation will be handled by the modal's Next button
  };

  const handleLineItemChange = (lineItemId: string, lineItemText: string) => {
    setSelectedNodeId(lineItemId);
    const itemIndex = currentSectionLineItems.findIndex(n => n.id === lineItemId);
    if (itemIndex >= 0) {
      setCurrentLineItemIndex(itemIndex);
    }
    // Check if there's an existing photo for this node
    const existingPhoto = photos.find(p => p.sectionNodeId === lineItemId && p.isUploaded);
    if (existingPhoto) {
      setExistingPhotoForModal({
        url: existingPhoto.url,
        comment: existingPhoto.comment,
        condition: existingPhoto.condition,
      });
    } else {
      setExistingPhotoForModal(null);
    }
    setPendingPhotoFile(null);
  };

  const handleRemovePhoto = (photoId: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
  };

  const handleUpdatePhotoComment = (photoId: string, comment: string) => {
    setPhotos((prev) => prev.map(p => p.id === photoId ? { ...p, comment } : p));
  };

  const handleUpdatePhotoConditionAndComment = async (
    photoId: string,
    condition: string | null,
    comment: string
  ) => {
    if (!inspectionId) return;

    try {
      const cond = condition && ["good", "fair", "poor"].includes(condition)
        ? (condition as "good" | "fair" | "poor")
        : null;

      await updateInspectionPhoto(Number(inspectionId), Number(photoId), {
        condition: cond,
        comment: comment || null,
      });

      // Refresh photos from backend to get updated data
      const refreshed = await listInspectionPhotos(Number(inspectionId));
      setPhotos(mapBackendPhotosToUI(refreshed));
    } catch (error) {
      console.error("Failed to update photo:", error);
      alert("Failed to update photo. Please try again.");
    }
  };

  const handleOpenGallery = (index: number) => {
    setCurrentPhotoIndex(index);
    setIsGalleryOpen(true);
  };

  const getPropertyUnits = (propId: string | null) => {
    if (!propId) return [];
    
    // For new inspections, use API data
    if (!inspectionId) {
      const units = unitsByProperty[propId] || [];
      return units.map((u: any) => ({
        id: String(u.id),
        name: u.unit_name ? `${u.unit_name}${u.address_1 ? ` — ${u.address_1}` : ""}` : `Unit #${u.id}`,
      }));
    }
    
    // For existing inspections, use mock data
    const property = propertyOptions.find((p) => p.id === propId);
    return property?.units || [];
  };
  
  const getUnitOptions = (propId: string | null) => {
    const units = getPropertyUnits(propId);
    return [
      {
        value: String(PROPERTY_LEVEL_UNIT_ID),
        label: PROPERTY_LEVEL_LABEL,
        displayLabel: PROPERTY_LEVEL_SHORT_LABEL,
      },
      ...units.map((u) => ({
        value: u.id,
        label: u.name,
      })),
    ];
  };
  
  const getTemplateOptions = (propId: string | null) => {
    if (!propId) return [];
    const templates = templatesByProperty[propId] || [];
    return templates.map((t) => ({
      value: String(t.id),
      label: t.name,
    }));
  };

  const handleSubmit = async () => {
    const errors: typeof validationErrors = {};

    // Validate required fields
    if (!date) {
      errors.date = "Date is required";
    }

    if (!propertyId) {
      errors.property = "Property is required";
    }
    
    if (photos.length === 0) {
      errors.photos = "At least one photo is required";
    }

    // Show errors if validation fails
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    // Clear errors on successful validation
    setValidationErrors({});

    const parsedPropertyId = propertyId ? Number(propertyId) : NaN;
    if (!Number.isFinite(parsedPropertyId)) {
      setValidationErrors((prev) => ({ ...prev, property: "Property is required" }));
      return;
    }

    const parsedUnitId =
      unitId && unitId !== "na" && unitId !== String(PROPERTY_LEVEL_UNIT_ID) && Number.isFinite(Number(unitId)) 
        ? Number(unitId) 
        : null;

    const dueDateISO = new Date(date).toISOString();

    setIsSubmitting(true);
    try {
      let resolvedInspectionId = inspectionId ? Number(inspectionId) : null;

      if (!resolvedInspectionId) {
        // This is a new inspection - create it first.
        // checklist_id is optional: a null template creates a templateless
        // inspection where photos attach under GENERAL_PHOTO_SECTION.
        const parsedTemplateId = templateId ? Number(templateId) : null;

        const created = await createInspection({
          property_id: parsedPropertyId,
          unit_id: parsedUnitId,
          checklist_id: parsedTemplateId,
          assigned_field_team_member_id: userId ?? null,
          status: "submitted",
          due_date: dueDateISO,
        });
        resolvedInspectionId = created.id;
      } else {
        // Update existing inspection
        await updateInspection(resolvedInspectionId, {
          status: "submitted",
          due_date: dueDateISO,
        });
      }

      // Upload all pending photos. Photos without a sectionNodeId
      // (templateless inspections) attach under GENERAL_PHOTO_SECTION.
      const pendingUploads = photos.filter((p) => p.file && !p.isUploaded);
      for (const photo of pendingUploads) {
        if (!photo.file || !resolvedInspectionId) {
          continue;
        }
        await addInspectionPhotos(
          resolvedInspectionId,
          photo.sectionNodeId || GENERAL_PHOTO_SECTION,
          photo.comment || "",
          [photo.file]
        );
      }

      if (resolvedInspectionId) {
        const refreshed = await listInspectionPhotos(resolvedInspectionId);
        setPhotos(mapBackendPhotosToUI(refreshed));
      }

      navigate("/fto/inspections");
    } catch (error) {
      console.error("Failed to submit inspection:", error);
      alert("Failed to submit inspection. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Renderers ---

  // Helper to get all nodes under a section (recursively)
  const getSectionNodes = (sectionId: string): ChecklistNode[] => {
    const sectionIndex = currentChecklist.findIndex(n => n.id === sectionId);
    if (sectionIndex === -1) return [];

    const sectionNodes: ChecklistNode[] = [];
    for (let i = sectionIndex + 1; i < currentChecklist.length; i++) {
      const node = currentChecklist[i];
      if (node.depth === 0) break; // Stop at next top-level section
      sectionNodes.push(node);
    }
    return sectionNodes;
  };

  // Helper: node is a leaf if it has no children
  const isLeafNode = (node: ChecklistNode): boolean => {
    return !currentChecklist.some(n => n.parentId === node.id);
  };

  // Helper: node has at least one child that is a leaf
  const hasLeafChild = (node: ChecklistNode): boolean => {
    const children = currentChecklist.filter(n => n.parentId === node.id);
    return children.some(child => isLeafNode(child));
  };

  // Camera icon: show for leaf nodes OR parents of leaf nodes (exclude top-level sections)
  const shouldShowCameraIconForNode = (node: ChecklistNode): boolean => {
    if (node.depth === 0) return false;
    return isLeafNode(node) || hasLeafChild(node);
  };

  // Helper to get only items with camera icons for a section
  const getSectionSubItems = (sectionId: string): ChecklistNode[] => {
    return getSectionNodes(sectionId).filter(n => shouldShowCameraIconForNode(n));
  };

  // Helper to get modal title with parent (e.g., "Basement → Bed 1", "Bedroom 1 → Bath 1")
  const getModalTitle = (nodeId: string): string => {
    const node = currentChecklist.find((n) => n.id === nodeId);
    if (!node) return "";

    // If it's a top-level section, just return the section name
    if (node.depth === 0) return node.text;

    // If we have a parent, show "Parent → Child" (works at any depth)
    if (node.parentId) {
      const parent = currentChecklist.find((n) => n.id === node.parentId);
      if (parent) {
        return `${parent.text} → ${node.text}`;
      }
    }

    return node.text;
  };

  // Helper to find which section a node belongs to
  const getSectionForNode = (nodeId: string): string | null => {
    const node = currentChecklist.find(n => n.id === nodeId);
    if (!node) return null;

    // If it's a section itself, return it
    if (node.depth === 0) return node.id;

    // Otherwise, traverse up to find the section
    let currentNode = node;
    while (currentNode.parentId) {
      const parent = currentChecklist.find(n => n.id === currentNode.parentId);
      if (!parent) break;
      if (parent.depth === 0) return parent.id;
      currentNode = parent;
    }
    return null;
  };

  // Helper to count photos for a section (used in section header)
  // Only count photos for items that show camera icons (leaf or parent of leaf)
  const getSectionPhotoCount = (sectionId: string): number => {
    const sectionNodes = getSectionNodes(sectionId);
    const nodeIds = sectionNodes.filter(n => shouldShowCameraIconForNode(n)).map(n => n.id);
    return photos.filter(p => p.sectionNodeId && nodeIds.includes(p.sectionNodeId)).length;
  };

  // Helper to count total line items in a section (only items that show camera icons)
  const getSectionTotalLineItems = (sectionId: string): number => {
    const sectionNodes = getSectionNodes(sectionId);
    return sectionNodes.filter(n => shouldShowCameraIconForNode(n)).length;
  };

  // Toggle section expansion
  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  // Render a single section with its nested content
  const renderSection = (section: ChecklistNode) => {
    const isExpanded = expandedSections.has(section.id);
    const sectionNodes = getSectionNodes(section.id);
    const photoCount = getSectionPhotoCount(section.id);
    const totalLineItems = getSectionTotalLineItems(section.id);

    return (
      <div key={section.id} className="border border-gray-200 rounded-lg bg-white overflow-hidden">
        {/* Section Header - Always Visible */}
        <button
          onClick={() => toggleSection(section.id)}
          className={cn(
            "w-full flex items-center justify-between p-4 transition-colors text-left",
            isExpanded ? "bg-blue-50 hover:bg-blue-100" : "bg-gray-50 hover:bg-gray-100"
          )}
        >
          <div className="flex items-center gap-3">
            <ChevronDownIcon
              width={16}
              height={16}
              className={cn(
                "text-gray-600 transition-transform flex-shrink-0",
                isExpanded ? "rotate-180" : ""
              )}
            />
            <span className="font-semibold text-gray-900">{section.text}</span>
          </div>
          <span className="text-sm text-gray-600 font-medium flex-shrink-0">
            {photoCount}/{totalLineItems}
          </span>
        </button>

        {/* Section Content - Nested Structure with Scroll */}
        {isExpanded && (
          <div className="bg-white border-t border-gray-200">
            <div 
              className="p-4 max-h-[400px] min-h-0 overflow-y-auto overscroll-contain"
              onWheel={(e) => {
                // Contain scroll within section on desktop; allow boundary to pass through
                const target = e.currentTarget;
                const isScrollingDown = e.deltaY > 0;
                const isScrollingUp = e.deltaY < 0;
                const isAtBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 1;
                const isAtTop = target.scrollTop <= 1;

                if ((isScrollingDown && isAtBottom) || (isScrollingUp && isAtTop)) {
                  return; // At boundary, allow scroll to propagate to parent
                }
                e.stopPropagation(); // Within content, scroll this section only
              }}
            >
              {sectionNodes.length === 0 ? (
                <div className="text-sm text-gray-500 py-2">No items in this section</div>
              ) : (
                <div className="flex flex-col gap-1">
                  {sectionNodes.map((node) => (
                  <div
                    key={node.id}
                    className="group flex items-start gap-2 py-2 px-2 rounded hover:bg-gray-50 transition-colors"
                    style={{ marginLeft: `${(node.depth - 1) * 24}px` }}
                  >
                    {/* Bullet / Icon */}
                    <div className="mt-1 flex-shrink-0">
                      {node.depth === 1 ? (
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-900 mt-1.5" />
                      ) : (
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-1.5" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div
                        onClick={() => {
                          // If item has photo(s), open gallery for that item
                          if (shouldShowCameraIconForNode(node) && hasPhotoForNode(node.id)) {
                            const photoIndexForItem = photos.findIndex(p => p.sectionNodeId === node.id);
                            if (photoIndexForItem !== -1) {
                              setCurrentPhotoIndex(photoIndexForItem);
                              setIsGalleryOpen(true);
                            }
                          }
                        }}
                        className={cn(
                          "text-sm whitespace-pre-wrap",
                          node.depth === 1 ? "font-semibold text-gray-900" : "text-gray-700",
                          shouldShowCameraIconForNode(node) && hasPhotoForNode(node.id) ? "cursor-pointer hover:underline text-blue-600" : ""
                        )}
                      >
                        {node.text}
                      </div>
                    </div>

                    {/* Photo count indicator for items that have photos */}
                    {shouldShowCameraIconForNode(node) && hasPhotoForNode(node.id) && (
                      <div className="flex-shrink-0 flex items-center gap-1 text-green-600 text-xs font-medium" title={`${getNodePhotoCount(node.id)} photo(s) attached`}>
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                        </svg>
                        <span>{getNodePhotoCount(node.id)}</span>
                      </div>
                    )}

                    {/* Camera Icon for leaf nodes and parents of leaf nodes */}
                    {shouldShowCameraIconForNode(node) && !isReadOnly && (
                      <button
                        onClick={() => {
                          setSelectedNodeId(node.id);
                          // Find the section this node belongs to and get all sub-items
                          const sectionId = getSectionForNode(node.id);
                          if (sectionId) {
                            const subItems = getSectionSubItems(sectionId);
                            setCurrentSectionLineItems(subItems);
                            const itemIndex = subItems.findIndex(n => n.id === node.id);
                            setCurrentLineItemIndex(itemIndex >= 0 ? itemIndex : 0);
                          }
                          // Check if there's an existing photo for this node
                          const existingPhoto = photos.find(p => p.sectionNodeId === node.id && p.isUploaded);
                          if (existingPhoto) {
                            setExistingPhotoForModal({
                              url: existingPhoto.url,
                              comment: existingPhoto.comment,
                              condition: existingPhoto.condition,
                            });
                            setPendingPhotoFile(null);
                          } else {
                            setExistingPhotoForModal(null);
                          }
                          setIsPhotoCommentModalOpen(true);
                        }}
                        className="ml-auto flex-shrink-0 p-2 text-[#013764] bg-white border border-[#013764] hover:bg-blue-50 rounded-lg transition-colors"
                        title="Add photo to this item"
                      >
                        <Camera width={18} height={18} />
                      </button>
                    )}
                  </div>
                ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderChecklist = () => {
    return (
      <div className="flex flex-col gap-3 border border-gray-200 rounded-lg bg-white p-4 max-h-[600px] overflow-y-auto">
        {currentChecklist.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            Please select a property to view the inspection checklist
          </div>
        ) : (
          checklistSections.map((section) => renderSection(section))
        )}
      </div>
    );
  };

  return (
    <PageTemplate className="!px-4 !pt-6 !pb-24 max-w-none !min-w-0 lg:!px-6 lg:!py-9">
      <div className="flex flex-col items-center w-full">
        <div className="w-full lg:max-w-[800px] flex flex-col gap-7">
          
          {/* Title and Header */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-[28px] font-semibold text-[#303030] leading-[26px]" style={{ fontFamily: "Geist, sans-serif" }}>
                  Property Inspection
                </h1>
                {isReadOnly && inspectionStatus && (
                  <p className="text-sm text-gray-500 mt-1">
                    {inspectionStatus === "submitted" || inspectionStatus === "reviewed" 
                      ? "Viewing completed inspection" 
                      : `Viewing ${inspectionStatus.replace(/_/g, " ")} inspection`}
                  </p>
                )}
                {!isReadOnly && inspectionStatus && (
                  <p className="text-sm text-gray-500 mt-1">Editing {inspectionStatus.replace(/_/g, " ")} inspection</p>
                )}
              </div>
              <button
                onClick={() => navigate("/fto/inspections")}
                className="text-[#303030] hover:opacity-70 transition-opacity"
              >
                <CloseIcon width={20} height={20} />
              </button>
            </div>
            <div className="h-px w-full bg-[#E5E5E5]" />
          </div>

          <div className="flex flex-col gap-6">
            
            {/* 1. Inspection Details Card */}
            <div className="rounded-xl bg-white border border-[#E5E5E5] shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-6 flex flex-col gap-6">
              <h2 className="text-lg font-medium text-gray-900">Inspection Details</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DateField
                  label="Date"
                  required
                  value={date}
                  onChange={(d) => setDate(d instanceof Date ? d.toISOString().split("T")[0] : d)}
                  placeholder="mm/dd/yyyy"
                  disabled={isReadOnly}
                  error={validationErrors.date}
                />

                <div className="hidden md:block" /> {/* Spacer */}

                {/* For NEW inspections, show searchable property dropdown and template selection */}
                {!inspectionId ? (
                  <>
                    <ComboboxField
                      label="Property"
                      required
                      options={properties.map(p => ({
                        value: String(p.id),
                        label: p.name,
                      }))}
                      value={propertyId || ""}
                      onChange={(value) => {
                        const newPropertyId = typeof value === 'string' ? value : value || null;
                        setPropertyId(newPropertyId);
                        setUnitId(null);
                        setTemplateId(null);
                        if (newPropertyId) {
                          loadUnitsForProperty(newPropertyId);
                          loadTemplatesForProperty(newPropertyId);
                        }
                      }}
                      placeholder={propertiesLoading ? "Loading properties..." : "Select Property"}
                      disabled={propertiesLoading || isReadOnly}
                      error={validationErrors.property}
                    />

                    <SelectField
                      label="Unit"
                      options={getUnitOptions(propertyId)}
                      value={unitId || ""}
                      onChange={(value) => setUnitId(typeof value === 'string' ? value : value[0] || null)}
                      placeholder={
                        !propertyId
                          ? "Select property first"
                          : unitsLoading[propertyId]
                          ? "Loading units…"
                          : "Select Unit"
                      }
                      disabled={!propertyId || unitsLoading[propertyId] || isReadOnly}
                    />
                    
                    <SelectField
                      label="Inspection Template (optional)"
                      options={getTemplateOptions(propertyId)}
                      value={templateId || ""}
                      onChange={(value) => {
                        const newTemplateId = typeof value === 'string' ? value : value[0] || null;
                        setTemplateId(newTemplateId);

                        if (newTemplateId && propertyId) {
                          const template = templatesByProperty[propertyId]?.find(t => t.id === Number(newTemplateId));
                          if (template) {
                            setLoadedChecklist(convertBackendChecklistToNodes(template));
                          }
                        } else {
                          setLoadedChecklist(null);
                        }
                      }}
                      placeholder={
                        !propertyId
                          ? "Select property first"
                          : templatesLoading[propertyId]
                          ? "Loading templates…"
                          : "No template — photos only"
                      }
                      disabled={!propertyId || templatesLoading[propertyId] || isReadOnly}
                    />
                  </>
                ) : (
                  <>
                    {/* For EXISTING inspections, show read-only fields */}
                    <SelectField
                      label="Property"
                      required
                      options={propertyOptions.map(p => ({ value: p.id, label: p.name }))}
                      value={propertyId || ""}
                      onChange={(value) => setPropertyId(typeof value === 'string' ? value : value[0] || null)}
                      placeholder="Select Property"
                      disabled={isReadOnly}
                      error={validationErrors.property}
                    />

                    <SelectField
                      label="Unit"
                      options={getPropertyUnits(propertyId).map(u => ({ value: u.id, label: u.name }))}
                      value={unitId || ""}
                      onChange={(value) => setUnitId(typeof value === 'string' ? value : value[0] || null)}
                      placeholder="Select Unit"
                      disabled={!propertyId || isReadOnly}
                    />
                  </>
                )}
              </div>
            </div>

            {/* 2. Inspection Checklist Card — hidden for templateless inspections */}
            {(templateId || loadedChecklist) && (
              <div className={cn(
                "bg-white border border-[#E5E5E5] shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col gap-6",
                isChecklistFullScreen ? "fixed inset-0 z-50 h-screen w-screen rounded-none p-6 overflow-y-auto" : "rounded-xl p-6"
              )}>
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-lg font-medium text-gray-900">Inspection Checklist</h2>
                  <button
                    onClick={() => setIsChecklistFullScreen(!isChecklistFullScreen)}
                    className="p-1.5 hover:bg-gray-100 rounded-md text-gray-500 transition-colors flex-shrink-0"
                    title={isChecklistFullScreen ? "Exit Full Screen" : "Full Screen"}
                  >
                    {isChecklistFullScreen ? (
                      <Minimize2 className="w-4 h-4" />
                    ) : (
                      <Maximize2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {renderChecklist()}
              </div>
            )}

            {/* 3. Photos Card */}
            <div className="rounded-xl bg-white border border-[#E5E5E5] shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-6 flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-medium text-gray-900">Photos</h2>
                  <span className="text-red-600 font-bold">*</span>
                </div>
                {validationErrors.photos && (
                  <p className="text-sm text-red-600">{validationErrors.photos}</p>
                )}
              </div>

              {/* Upload Area */}
              {!isReadOnly && (() => {
                const isTemplateless = !templateId && !loadedChecklist;
                const canUpload = isTemplateless || !!selectedNodeId;
                return (
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg flex flex-col gap-3">
                    {!isTemplateless && (
                      <NestedChecklistSelect
                        label="Associate with Checklist Item"
                        value={selectedNodeId}
                        onChange={(value) => setSelectedNodeId(value)}
                        placeholder="Select a checklist item..."
                        checklist={currentChecklist}
                        getNodePath={getNodePath}
                      />
                    )}

                    <div
                      className={cn(
                        "border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-colors",
                        !canUpload ? "opacity-50 cursor-not-allowed bg-gray-100 border-gray-300 text-gray-400" : "border-gray-300 text-gray-400 hover:bg-white bg-gray-50"
                      )}
                      onClick={() => {
                        if (canUpload) photoInputRef.current?.click();
                        else alert("Please select a checklist item first");
                      }}
                    >
                      <PlusIcon width={24} height={24} />
                      <span className="mt-2 text-sm font-medium text-gray-600">
                        {isTemplateless ? "Add Photos (General)" : "Add Photos"}
                      </span>
                      <span className="text-xs mt-1 text-gray-400">Supports JPG, PNG</span>
                      <input
                        ref={photoInputRef}
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={handlePhotoUpload}
                        disabled={!canUpload}
                      />
                    </div>
                  </div>
                );
              })()}

              {/* Photos Grouped by Checklist Node */}
              {photos.length > 0 ? (
                (() => {
                  // Group photos by node
                  const photosByNode: Record<string, typeof photos> = {};
                  photos.forEach(photo => {
                    const nodeId = photo.sectionNodeId || GENERAL_PHOTO_SECTION;
                    if (!photosByNode[nodeId]) {
                      photosByNode[nodeId] = [];
                    }
                    photosByNode[nodeId].push(photo);
                  });

                  return (
                    <div className="flex flex-col gap-3">
                      {Object.entries(photosByNode).map(([nodeId, nodePhotos]) => {
                        const node = currentChecklist.find(n => n.id === nodeId);
                        const isGeneral = nodeId === GENERAL_PHOTO_SECTION;
                        const nodePath = isGeneral ? "General Photos" : getNodePath(nodeId);
                        const isNodeExpanded = expandedSections.has(nodeId);

                        return (
                          <div key={nodeId} className="border border-gray-200 rounded-lg bg-white overflow-hidden">
                            {/* Node Header */}
                            <button
                              onClick={() => toggleSection(nodeId)}
                              className={cn(
                                "w-full flex items-center justify-between p-3 transition-colors text-left",
                                isNodeExpanded ? "bg-blue-50 hover:bg-blue-100" : "bg-gray-50 hover:bg-gray-100"
                              )}
                            >
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <ChevronDownIcon
                                  width={14}
                                  height={14}
                                  className={cn(
                                    "text-gray-600 transition-transform flex-shrink-0",
                                    isNodeExpanded ? "rotate-180" : ""
                                  )}
                                />
                                <span className="text-sm font-medium text-gray-900 truncate">{nodePath}</span>
                              </div>
                              <span className="text-xs text-gray-600 font-medium flex-shrink-0 ml-2">
                                {nodePhotos.length} photo{nodePhotos.length !== 1 ? 's' : ''}
                              </span>
                            </button>

                            {/* Photos Grid */}
                            {isNodeExpanded && (
                              <div className="p-3 bg-white border-t border-gray-200">
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                  {nodePhotos.map((photo) => (
                                    <div
                                      key={photo.id}
                                      className="relative group cursor-pointer rounded-lg overflow-hidden bg-gray-100 aspect-square border border-gray-200"
                                      onClick={() => handleOpenGallery(photos.indexOf(photo))}
                                    >
                                      <img src={photo.url} alt="Inspection" className="w-full h-full object-cover" />
                                      {photo.comment && (
                                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white text-[9px] px-1.5 py-1 line-clamp-2">
                                          {photo.comment}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()
              ) : (
                <div className="text-center text-sm text-gray-500 py-8">
                  No photos uploaded yet
                </div>
              )}
            </div>

          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 mt-4 mb-8">
            {isReadOnly ? (
              <button
                onClick={() => navigate("/fto/inspections")}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 font-medium text-sm transition-colors"
              >
                Back
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate("/fto/inspections")}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 font-medium text-sm transition-colors"
                >
                  Cancel
                </button>
                <BlueButton onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? "Submitting..." : "Submit Inspection"}
                </BlueButton>
              </>
            )}
          </div>

        </div>
      </div>

      {/* Modals */}
      <PhotoCommentModal
        open={isPhotoCommentModalOpen}
        onOpenChange={(open) => {
          setIsPhotoCommentModalOpen(open);
          if (!open) {
            setPendingPhotoFile(null);
            setExistingPhotoForModal(null);
            setCurrentSectionLineItems([]);
            setCurrentLineItemIndex(0);
          }
        }}
        onSubmit={handlePhotoCommentSubmit}
        title={selectedNodeId ? getModalTitle(selectedNodeId) : "Add Photo"}
        submitLabel="Upload Photo"
        initialFile={pendingPhotoFile}
        existingPhoto={existingPhotoForModal}
        lineItems={currentSectionLineItems.map(n => ({ id: n.id, text: getModalTitle(n.id) }))}
        currentLineItemIndex={currentLineItemIndex}
        onLineItemChange={handleLineItemChange}
      />

      <PhotoGalleryModal
        open={isGalleryOpen}
        onOpenChange={setIsGalleryOpen}
        photos={photos}
        currentPhotoIndex={currentPhotoIndex}
        onPrev={() => setCurrentPhotoIndex(prev => (prev === 0 ? photos.length - 1 : prev - 1))}
        onNext={() => setCurrentPhotoIndex(prev => (prev === photos.length - 1 ? 0 : prev + 1))}
        onUpdateComment={handleUpdatePhotoComment}
        onSave={handleUpdatePhotoConditionAndComment}
        inspectionId={inspectionId}
        getNodePath={getNodePath}
      />

    </PageTemplate>
  );
}

// --- Helper Components ---

function PhotoGalleryModal({
  open,
  onOpenChange,
  photos,
  currentPhotoIndex,
  onPrev,
  onNext,
  onUpdateComment,
  onSave,
  inspectionId,
  getNodePath,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  photos: InspectionPhoto[];
  currentPhotoIndex: number;
  onPrev: () => void;
  onNext: () => void;
  onUpdateComment: (id: string, comment: string) => void;
  onSave: (photoId: string, condition: string | null, comment: string) => Promise<void>;
  inspectionId?: number | null;
  getNodePath: (nodeId: string) => string;
}) {
  const [condition, setCondition] = useState<string>("");
  const [comment, setComment] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  const CONDITION_OPTIONS = [
    { value: "", label: "Select condition (optional)" },
    { value: "good", label: "Good" },
    { value: "fair", label: "Fair" },
    { value: "poor", label: "Poor" },
  ];

  // Update local state when photo changes
  useEffect(() => {
    if (open && photos.length > 0) {
      const currentPhoto = photos[currentPhotoIndex];
      setComment(currentPhoto.comment || "");
      setCondition(currentPhoto.condition || "");
    }
  }, [open, currentPhotoIndex, photos]);

  if (!open || photos.length === 0) return null;

  const currentPhoto = photos[currentPhotoIndex];
  const nodePath = currentPhoto.sectionNodeId ? getNodePath(currentPhoto.sectionNodeId) : "Unknown Item";

  const handleSave = async () => {
    if (!inspectionId) return;
    setIsSaving(true);
    try {
      await onSave(currentPhoto.id, condition || null, comment);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="bg-white rounded-lg shadow-2xl w-full max-w-[95vw] sm:max-w-4xl max-h-[90vh] flex flex-col mx-2 sm:mx-0"
        onClick={(e) => e.stopPropagation()}
      >

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex flex-col gap-1 flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-gray-900">Review Photos</h2>
              <span className="text-sm text-gray-500">
                {currentPhotoIndex + 1} of {photos.length}
              </span>
            </div>
            <p className="text-sm text-blue-600 truncate">{nodePath}</p>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="text-gray-400 hover:text-gray-600 transition-colors ml-2 flex-shrink-0"
          >
            <span className="text-2xl leading-none">×</span>
          </button>
        </div>

        {/* Image Container */}
        <div className="flex-1 flex items-center justify-center bg-gray-50 overflow-hidden p-4">
          <img
            src={currentPhoto.url}
            alt={`Photo ${currentPhotoIndex + 1}`}
            className="max-h-full max-w-full object-contain shadow-sm"
          />
        </div>

        {/* Condition and Comment Section */}
        <div className="bg-white px-6 py-4 border-t border-gray-200 space-y-3">
          <SelectField
            label="Condition"
            value={condition}
            onChange={(value) => setCondition(value as string)}
            options={CONDITION_OPTIONS}
            placeholder="Select condition (optional)"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Comment
            </label>
            <input
              type="text"
              value={comment}
              onChange={(e) => {
                setComment(e.target.value);
                onUpdateComment(currentPhoto.id, e.target.value);
              }}
              placeholder="Add a comment to this photo..."
              className="w-full text-sm px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
            />
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving || !inspectionId}
            className="w-full px-4 py-2 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>

        {/* Footer with Navigation */}
        <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-gray-200 bg-gray-50 gap-3">
          <div className="flex items-center justify-between w-full sm:w-auto gap-3 order-2 sm:order-1">
            <button
              onClick={onPrev}
              className="flex-1 sm:flex-none px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-white transition-colors disabled:opacity-50"
              disabled={photos.length === 1}
            >
              ← <span className="sm:hidden">Prev</span><span className="hidden sm:inline">Previous</span>
            </button>

            <button
              onClick={onNext}
              className="flex-1 sm:flex-none px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-white transition-colors disabled:opacity-50 sm:order-last"
              disabled={photos.length === 1}
            >
              <span className="sm:hidden">Next</span><span className="hidden sm:inline">Next</span> →
            </button>
          </div>

          <div className="flex items-center gap-2 order-1 sm:order-2">
            <span className="text-sm text-gray-600">
              {new Date(currentPhoto.uploadedAt).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
