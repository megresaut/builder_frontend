import React, { useState, useRef, useMemo, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageTemplate from "@/layout/PageTemplate";
import SectionCard from "@/components/SectionCard";
import BlueButton from "@/components/BlueButton";
import InspectionAssignees from "@/components/InspectionAssignees";
import InspectionDetailsBarTemplate from "@/components/templates/InspectionDetailsBarTemplate";
import PhotoCommentModal from "@/components/PhotoCommentModal";
import { SelectField } from "@/components/forms/SelectField";
import {
  PlusIcon,
  DeleteIcon,
  EditIcon,
  ArrowBackIcon,
  ArrowForwardIcon,
  ChevronDownIcon,
} from "@/components/icons";
import { DownloadIcon } from "@/components/icons/DownloadIcon";
import { Maximize2, Minimize2, ChevronRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ChecklistNode,
  InspectionPhoto,
  MOCK_CHECKLIST_NODES,
} from "@/data/inspection-checklist";
import { DEFAULT_INSPECTION_TEMPLATES, ChecklistSectionTemplate } from "@/data/inspections";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import {
  updateInspection,
  getInspection,
  listChecklists,
  createChecklist,
  updateChecklist,
  addInspectionPhotos,
  listInspectionPhotos,
  updateInspectionPhoto,
  BackendInspection,
  BackendInspectionChecklist,
} from "@/api/inspections";
import { API_BASE } from "@/api/fetchJSON";

interface InspectionDetailProps {
  isNew?: boolean;
  isEdit?: boolean;
  isInline?: boolean;
  inspectionId?: number;
  inspection?: any;
  templateName?: string;
  onBack?: () => void;
}

// Helper function to convert backend checklist format to frontend ChecklistNode format
function convertBackendChecklistToNodes(backendChecklist: BackendInspectionChecklist | null): ChecklistNode[] {
  if (!backendChecklist || !backendChecklist.checklist_json) {
    return [];
  }

  const checklistData = backendChecklist.checklist_json;
  const sections: ChecklistSectionTemplate[] = checklistData.sections || [];
  
  const nodes: ChecklistNode[] = [];
  let nodeIndex = 0;

  // Recursive function to add items and their nested children
  const addItemsRecursively = (
    items: any[],
    parentId: string,
    depth: number
  ) => {
    items?.forEach(item => {
      const itemNode: ChecklistNode = {
        id: item.id,
        parentId: parentId,
        orderIndex: nodeIndex++,
        type: depth === 0 ? "section" : "item",
        text: item.text,
        depth: depth,
      };
      nodes.push(itemNode);

      // Recursively add nested items
      if (item.items && item.items.length > 0) {
        addItemsRecursively(item.items, item.id, depth + 1);
      }
    });
  };

  sections.forEach(section => {
    // Add section node
    const sectionNode: ChecklistNode = {
      id: section.id,
      parentId: null,
      orderIndex: nodeIndex++,
      type: "section",
      text: section.title,
      depth: 0,
    };
    nodes.push(sectionNode);

    // Add item nodes recursively
    if (section.items && section.items.length > 0) {
      addItemsRecursively(section.items, section.id, 1);
    }
  });

  return nodes;
}

// Helper function to convert frontend ChecklistNode format back to backend format
function convertNodesToBackendChecklist(nodes: ChecklistNode[]): { sections: ChecklistSectionTemplate[] } {
  const sections: ChecklistSectionTemplate[] = [];
  
  // Recursive function to build nested item structure
  const buildItemsForParent = (parentId: string): any[] => {
    // Get all direct children of this parent
    const childNodes = nodes.filter(n => n.parentId === parentId);
    
    return childNodes.map(childNode => {
      const item: any = {
        id: childNode.id,
        text: childNode.text,
      };
      
      // Recursively get nested children
      const nestedItems = buildItemsForParent(childNode.id);
      if (nestedItems.length > 0) {
        item.items = nestedItems;
      }
      
      return item;
    });
  };
  
  // Get all section nodes (depth 0)
  const sectionNodes = nodes.filter(n => n.type === "section" && n.depth === 0);
  
  sectionNodes.forEach(sectionNode => {
    const section: ChecklistSectionTemplate = {
      id: sectionNode.id,
      title: sectionNode.text,
      items: buildItemsForParent(sectionNode.id),
    };
    
    sections.push(section);
  });
  
  return { sections };
}

// NestedChecklistSelect component for cascading dropdowns
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

  // --- State ---
  const [nodes, setNodes] = useState<ChecklistNode[]>([]);
  const [photos, setPhotos] = useState<InspectionPhoto[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isChecklistFullScreen, setIsChecklistFullScreen] = useState(false);
  
  // Initialize status from inspection prop if available, otherwise default
  const getInitialStatus = (): "In Progress" | "Completed" => {
    if (inspection?.status) {
      // Map various status formats to our frontend format
      const statusLower = inspection.status.toLowerCase();
      if (statusLower === "completed" || statusLower === "reviewed") {
        return "Completed";
      }
    }
    return "In Progress";
  };
  
  const [status, setStatus] = useState<"In Progress" | "Completed">(getInitialStatus());
  const [inspectionDueDate, setInspectionDueDate] = useState<Date | string | null>(null);
  const [isLoadingChecklist, setIsLoadingChecklist] = useState(true);
  const [checklistId, setChecklistId] = useState<number | null>(inspection?.checklist_id || null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [backendInspection, setBackendInspection] = useState<BackendInspection | null>(null);

  // Helper function to map backend status to frontend status
  const mapBackendStatusToFrontend = (backendStatus: string): "In Progress" | "Completed" => {
    // Backend statuses: draft, scheduled, in_progress, submitted, reviewed, cancelled
    if (backendStatus === "reviewed") {
      return "Completed";
    }
    // Default to "In Progress" for all other statuses
    return "In Progress";
  };

  // Helper function to map frontend status to backend status
  const mapFrontendStatusToBackend = (frontendStatus: "In Progress" | "Completed"): string => {
    if (frontendStatus === "Completed") {
      return "reviewed";
    }
    return "in_progress";
  };

  // Fetch inspection data when inspectionId changes
  useEffect(() => {
    const fetchInspectionData = async () => {
      if (!inspectionId) return;

      try {
        const backendInspection = await getInspection(inspectionId);
        setBackendInspection(backendInspection);
        
        // Update status from backend
        const frontendStatus = mapBackendStatusToFrontend(backendInspection.status);
        setStatus(frontendStatus);
        
        // Update due date from backend
        if (backendInspection.due_date) {
          setInspectionDueDate(new Date(backendInspection.due_date));
        } else {
          setInspectionDueDate(null);
        }
        
        // Update checklist ID
        if (backendInspection.checklist_id) {
          setChecklistId(backendInspection.checklist_id);
        }
      } catch (error) {
        console.error("Failed to fetch inspection:", error);
      }
    };

    fetchInspectionData();
  }, [inspectionId]);

  // --- Fetch photos from backend ---
  useEffect(() => {
    const fetchPhotos = async () => {
      if (!inspectionId) return;

      try {
        const backendPhotos = await listInspectionPhotos(inspectionId);
        
        // Convert backend photos to frontend format
        const frontendPhotos: InspectionPhoto[] = backendPhotos.map((bp) => ({
          id: bp.id.toString(),
          inspectionId: bp.inspection_id.toString(),
          sectionNodeId: bp.section_id,
          fileRef: `${API_BASE}/uploads/${bp.storage_path}`,
          uploadedAt: bp.created_at,
          comment: bp.comment,
          condition: bp.condition,
        }));

        setPhotos(frontendPhotos);
        
        // Set photo notes from comments
        const notes: Record<string, string> = {};
        frontendPhotos.forEach((photo) => {
          if (photo.comment) {
            notes[photo.id] = photo.comment;
          }
        });
        setPhotoNotes(notes);
      } catch (error) {
        console.error("Failed to load photos:", error);
      }
    };

    fetchPhotos();
  }, [inspectionId]);

  // --- Fetch checklist from backend ---
  useEffect(() => {
    const fetchChecklist = async () => {
      if (!checklistId || !propertyId) {
        setIsLoadingChecklist(false);
        return;
      }

      try {
        // Fetch all checklists for the property
        const checklists = await listChecklists(Number(propertyId));
        
        // Find the checklist by ID
        const checklist = checklists.find(c => c.id === checklistId);
        
        if (checklist) {
          const convertedNodes = convertBackendChecklistToNodes(checklist);
          setNodes(convertedNodes);
        }
      } catch (error) {
        console.error("Failed to fetch checklist:", error);
      } finally {
        setIsLoadingChecklist(false);
      }
    };

    fetchChecklist();
  }, [checklistId, propertyId]);

  // Photo Upload State
  const [selectedNodeId, setSelectedNodeId] = useState<string>("");

  // Photo Comment Modal State
  const [isPhotoCommentModalOpen, setIsPhotoCommentModalOpen] = useState(false);
  const [pendingPhotoFile, setPendingPhotoFile] = useState<File | null>(null);

  // Photo Modal States
  const [selectedPhotoForModal, setSelectedPhotoForModal] = useState<InspectionPhoto | null>(null);
  const [isPhotoViewerOpen, setIsPhotoViewerOpen] = useState(false);
  const [photoNotes, setPhotoNotes] = useState<Record<string, string>>({});
  const [expandedPhotoNodes, setExpandedPhotoNodes] = useState<Set<string>>(new Set());

  // Input refs for focus management
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [newlyAddedNodeId, setNewlyAddedNodeId] = useState<string | null>(null);

  // --- Derived Data ---
  const sections = useMemo(() => nodes.filter((n) => n.depth === 0), [nodes]);

  const photosByNode = useMemo(() => {
    const grouped: Record<string, InspectionPhoto[]> = {};
    photos.forEach((p) => {
      const nodeId = p.sectionNodeId || 'uncategorized';
      if (!grouped[nodeId]) {
        grouped[nodeId] = [];
      }
      grouped[nodeId].push(p);
    });
    return grouped;
  }, [photos]);

  const allPhotos = useMemo(() => photos, [photos]);

  // Helper to get the full hierarchy path for a node
  const getNodePath = (nodeId: string): string => {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return "";

    const path: string[] = [node.text];
    let currentNode = node;

    while (currentNode.parentId) {
      const parent = nodes.find((n) => n.id === currentNode.parentId);
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

  const togglePhotoNode = (nodeId: string) => {
    setExpandedPhotoNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  // --- Handlers: Checklist Editing ---

  const handleTextChange = (id: string, newText: string) => {
    setNodes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, text: newText } : n))
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, nodeId: string, index: number) => {
    // Arrow Up: Move row up
    if (e.key === "ArrowUp" && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      if (index > 0) {
        const prevNodeId = nodes[index - 1].id;
        handleMove(index, "up");
        // Focus the moved row after state update
        setTimeout(() => {
          const input = inputRefs.current[nodeId];
          if (input) {
            input.focus();
            const length = input.value.length;
            input.setSelectionRange(length, length);
          }
        }, 0);
      }
      return;
    }

    // Arrow Down: Move row down
    if (e.key === "ArrowDown" && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      if (index < nodes.length - 1) {
        const nextNodeId = nodes[index + 1].id;
        handleMove(index, "down");
        // Focus the moved row after state update
        setTimeout(() => {
          const input = inputRefs.current[nodeId];
          if (input) {
            input.focus();
            const length = input.value.length;
            input.setSelectionRange(length, length);
          }
        }, 0);
      }
      return;
    }

    // Tab: Indent (or Shift+Tab: Outdent)
    if (e.key === "Tab") {
      e.preventDefault();
      const node = nodes[index];
      if (e.shiftKey) {
        // Shift+Tab: Outdent
        if (node.depth > 0) {
          handleIndent(nodeId, "out");
        }
      } else {
        // Tab: Indent
        handleIndent(nodeId, "in");
      }
      // Keep focus on the same input after indent/outdent
      setTimeout(() => {
        const input = inputRefs.current[nodeId];
        if (input) {
          input.focus();
          const length = input.value.length;
          input.setSelectionRange(length, length);
        }
      }, 0);
      return;
    }

    // Arrow Right: Indent (when at start of input)
    if (e.key === "ArrowRight" && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
      const input = e.currentTarget;
      if (input.selectionStart === 0 && input.value.length === 0) {
        e.preventDefault();
        handleIndent(nodeId, "in");
        setTimeout(() => {
          const focusedInput = inputRefs.current[nodeId];
          if (focusedInput) {
            focusedInput.focus();
          }
        }, 0);
        return;
      }
    }

    // Arrow Left: Outdent (when at start of input)
    if (e.key === "ArrowLeft" && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
      const input = e.currentTarget;
      if (input.selectionStart === 0 && input.value.length === 0) {
        e.preventDefault();
        if (nodes[index].depth > 0) {
          handleIndent(nodeId, "out");
        }
        setTimeout(() => {
          const focusedInput = inputRefs.current[nodeId];
          if (focusedInput) {
            focusedInput.focus();
          }
        }, 0);
        return;
      }
    }

    // Enter: Add new line item below
    if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      const currentNode = nodes[index];
      const newNodeId = `node-${Date.now()}`;
      const newNode: ChecklistNode = {
        id: newNodeId,
        parentId: currentNode.parentId,
        orderIndex: 0,
        type: currentNode.depth === 0 ? "section" : "item",
        text: "",
        depth: currentNode.depth,
      };
      
      setNodes((prev) => {
        const newNodes = [...prev];
        newNodes.splice(index + 1, 0, newNode);
        return newNodes;
      });
      
      setNewlyAddedNodeId(newNodeId);
      
      // Focus the new input after a brief delay to ensure DOM update
      setTimeout(() => {
        const input = inputRefs.current[newNodeId];
        if (input) {
          input.focus();
          input.select();
        }
      }, 0);
      return;
    }

    // Backspace on empty line: delete line and move focus to previous
    if (e.key === "Backspace" && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
      const input = e.currentTarget;
      if (input.value.length === 0 && index > 0) {
        e.preventDefault();
        const prevNodeId = nodes[index - 1].id;
        setNodes((prev) => prev.filter((n) => n.id !== nodeId));
        setTimeout(() => {
          const prevInput = inputRefs.current[prevNodeId];
          if (prevInput) {
            prevInput.focus();
            const len = prevInput.value.length;
            prevInput.setSelectionRange(len, len);
          }
        }, 0);
        return;
      }
    }
  };

  const handleIndent = (id: string, direction: "in" | "out") => {
    setNodes((prev) => {
      const currentIndex = prev.findIndex(n => n.id === id);
      if (currentIndex === -1) return prev;
      
      const currentNode = prev[currentIndex];
      const newDepth = direction === "in" ? currentNode.depth + 1 : Math.max(0, currentNode.depth - 1);
      const newType = newDepth === 0 ? "section" : "item";
      
      // Find the new parent
      let newParentId: string | null = null;
      
      if (direction === "in") {
        // When indenting, the parent becomes the previous sibling
        for (let i = currentIndex - 1; i >= 0; i--) {
          if (prev[i].depth === currentNode.depth) {
            newParentId = prev[i].id;
            break;
          }
        }
      } else {
        // When outdenting, the parent becomes the grandparent
        if (currentNode.parentId) {
          const parent = prev.find(n => n.id === currentNode.parentId);
          newParentId = parent?.parentId || null;
        }
      }
      
      return prev.map((n) => {
        if (n.id !== id) return n;
        return { ...n, depth: newDepth, type: newType, parentId: newParentId };
      });
    });
  };

  const handleMove = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === nodes.length - 1) return;

    setNodes((prev) => {
      const newNodes = [...prev];
      const swapIndex = direction === "up" ? index - 1 : index + 1;
      [newNodes[index], newNodes[swapIndex]] = [newNodes[swapIndex], newNodes[index]];
      return newNodes;
    });
  };

  const handleDeleteNode = (id: string) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      setNodes((prev) => prev.filter((n) => n.id !== id));
    }
  };

  const handleAddNode = (index: number) => {
    // Get the current node to replicate its depth and type
    const currentNode = nodes[index];
    const newNodeId = `node-${Date.now()}`;
    const newNode: ChecklistNode = {
      id: newNodeId,
      parentId: currentNode?.parentId || null,
      orderIndex: 0,
      type: currentNode?.type || "section",
      text: "",
      depth: currentNode?.depth ?? 0,
    };
    const newNodes = [...nodes];
    newNodes.splice(index + 1, 0, newNode);
    setNodes(newNodes);
    setNewlyAddedNodeId(newNodeId);
    
    // Focus the new input after a brief delay to ensure DOM update
    setTimeout(() => {
      const input = inputRefs.current[newNodeId];
      if (input) {
        input.focus();
        input.select();
      }
    }, 0);
  };

  const handleAddNodeToEnd = () => {
    if (nodes.length === 0) {
      // If no nodes, add a section
      const newNodeId = `node-${Date.now()}`;
      const newNode: ChecklistNode = {
        id: newNodeId,
        parentId: null,
        orderIndex: 0,
        type: "section",
        text: "",
        depth: 0,
      };
      setNodes([newNode]);
      setNewlyAddedNodeId(newNodeId);
      setTimeout(() => {
        const input = inputRefs.current[newNodeId];
        if (input) {
          input.focus();
          input.select();
        }
      }, 0);
      return;
    }
    
    // Add after the last node
    handleAddNode(nodes.length - 1);
  };

  // --- Handlers: Photos ---

  const handlePhotoCommentSubmit = async (file: File, comment: string, condition?: string) => {
    if (!inspectionId) {
      alert("No inspection ID found");
      return;
    }

    try {
      setIsUploadingPhoto(true);

      const cond = condition && ["good", "fair", "poor"].includes(condition)
        ? (condition as "good" | "fair" | "poor")
        : undefined;

      // Upload photo to backend
      const result = await addInspectionPhotos(
        inspectionId,
        selectedNodeId,
        comment,
        [file],
        cond
      );

      if (result.uploaded > 0) {
        // Fetch updated photos list from backend
        const backendPhotos = await listInspectionPhotos(inspectionId);
        
        // Convert backend photos to frontend format
        const frontendPhotos: InspectionPhoto[] = backendPhotos.map((bp) => ({
          id: bp.id.toString(),
          inspectionId: bp.inspection_id.toString(),
          sectionNodeId: bp.section_id,
          fileRef: `${API_BASE}/uploads/${bp.storage_path}`,
          uploadedAt: bp.created_at,
          comment: bp.comment,
          condition: bp.condition,
        }));

        setPhotos(frontendPhotos);
        
        // Set photo notes from comments
        const notes: Record<string, string> = {};
        frontendPhotos.forEach((photo) => {
          if (photo.comment) {
            notes[photo.id] = photo.comment;
          }
        });
        setPhotoNotes(notes);

        // Close the modal
        setIsPhotoCommentModalOpen(false);
      }
    } catch (error) {
      console.error("Failed to upload photo:", error);
      alert("Failed to upload photo. Please try again.");
    } finally {
      setIsUploadingPhoto(false);
    }
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

  const handleSavePhotoConditionAndNote = async (
    photoId: string,
    condition: string | null,
    comment: string
  ) => {
    if (!inspectionId) return;
    const cond =
      condition && ["good", "fair", "poor"].includes(condition)
        ? (condition as "good" | "fair" | "poor")
        : null;
    try {
      await updateInspectionPhoto(Number(inspectionId), Number(photoId), {
        condition: cond,
        comment: comment || null,
      });
      const backendPhotos = await listInspectionPhotos(inspectionId);
      const frontendPhotos: InspectionPhoto[] = backendPhotos.map((bp) => ({
        id: bp.id.toString(),
        inspectionId: bp.inspection_id.toString(),
        sectionNodeId: bp.section_id,
        fileRef: `${API_BASE}/uploads/${bp.storage_path}`,
        uploadedAt: bp.created_at,
        comment: bp.comment,
        condition: bp.condition,
      }));
      setPhotos(frontendPhotos);
      const notes: Record<string, string> = {};
      frontendPhotos.forEach((p) => {
        if (p.comment) notes[p.id] = p.comment;
      });
      setPhotoNotes(notes);
      if (selectedPhotoForModal?.id === photoId) {
        const updated = frontendPhotos.find((p) => p.id === photoId);
        if (updated) setSelectedPhotoForModal(updated);
      }
    } catch (error) {
      console.error("Failed to update photo:", error);
      alert("Failed to update photo. Please try again.");
    }
  };

  // --- Handlers: General ---

  const handleStatusChange = async (newStatus: "In Progress" | "Completed") => {
    if (!inspectionId) return;
    
    // Don't update if status hasn't changed
    if (status === newStatus) return;
    
    // Map frontend status to backend status
    const backendStatus = mapFrontendStatusToBackend(newStatus);
    
    // Store previous status for error recovery
    const previousStatus = status;
    setStatus(newStatus);
    
    try {
      await updateInspection(inspectionId, { status: backendStatus });
      console.log("Status updated successfully");
    } catch (error) {
      console.error("Failed to update status:", error);
      // Revert on error
      setStatus(previousStatus);
      alert("Failed to update status. Please try again.");
    }
  };

  const handleDueDateChange = async (newDate: Date | string | null) => {
    if (!inspectionId) return;
    
    // Check if date actually changed
    const currentDateISO = inspectionDueDate instanceof Date 
      ? inspectionDueDate.toISOString() 
      : inspectionDueDate;
    const newDateISO = newDate instanceof Date 
      ? newDate.toISOString() 
      : newDate;
    
    // Don't update if date hasn't changed
    if (currentDateISO === newDateISO) return;
    
    const previousDate = inspectionDueDate;
    setInspectionDueDate(newDate);
    
    try {
      const dueDateISO = newDate instanceof Date ? newDate.toISOString() : newDate;
      await updateInspection(inspectionId, { due_date: dueDateISO });
      console.log("Due date updated successfully");
    } catch (error) {
      console.error("Failed to update due date:", error);
      // Revert on error
      setInspectionDueDate(previousDate);
      alert("Failed to update due date. Please try again.");
    }
  };

  const handleSaveChecklist = async () => {
    if (!checklistId) {
      alert("No checklist ID found. Cannot save.");
      return;
    }

    // Convert nodes back to backend format
    const backendFormat = convertNodesToBackendChecklist(nodes);
    
    console.log("Saving checklist with ID:", checklistId);
    console.log("Checklist data being sent:", backendFormat);
    
    try {
      const updated = await updateChecklist(checklistId, backendFormat);
      console.log("Checklist saved successfully:", updated);
      
      // Update the local state with the saved data
      const convertedNodes = convertBackendChecklistToNodes(updated);
      setNodes(convertedNodes);
      
      setIsEditing(false);
      alert("Checklist saved successfully!");
    } catch (error) {
      console.error("Failed to save checklist:", error);
      alert("Failed to save checklist. Please try again.");
    }
  };

  const handleExportInspection = async () => {
    const dueDate = inspectionDueDate instanceof Date
      ? inspectionDueDate.toLocaleDateString()
      : inspectionDueDate;

    // Helper to convert Blob URL to Base64
    const blobUrlToBase64 = async (blobUrl: string): Promise<string> => {
      try {
        const response = await fetch(blobUrl, { credentials: "include" });
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch (e) {
        console.error("Error converting blob to base64", e);
        return "";
      }
    };

    // Pre-process photos to convert Blob URLs to Base64
    const photosWithBase64 = await Promise.all(
      photos.map(async (photo) => {
        const base64 = await blobUrlToBase64(photo.fileRef);
        return { ...photo, base64 };
      })
    );

    // Create a temporary DOM element for the PDF content
    const element = document.createElement("div");
    element.style.width = "8.5in";
    element.style.height = "11in";
    element.style.margin = "0";
    element.style.padding = "0.5in 0.75in";
    element.style.fontFamily = "Arial, sans-serif";
    element.style.color = "#333";
    element.style.background = "#ffffff";
    element.style.position = "absolute";
    element.style.left = "-9999px";
    element.style.top = "0";
    element.style.boxSizing = "border-box";
    element.style.overflow = "hidden";

    // Build HTML content
    let htmlContent = `
      <h1 style="color: #303030; margin: 0 0 12px 0; font-size: 24px; line-height: 1.2;">Inspection Report</h1>
      <div style="background-color: #f5f5f5; padding: 10px 12px; margin-bottom: 16px; border-radius: 4px;">
        <div style="margin: 4px 0; font-size: 11px; line-height: 1.4;"><span style="font-weight: bold;">Property:</span> ${backendInspection?.property_name ?? "Unknown Property"}</div>
        <div style="margin: 4px 0; font-size: 11px; line-height: 1.4;"><span style="font-weight: bold;">Inspection Due Date:</span> ${dueDate}</div>
        <div style="margin: 4px 0; font-size: 11px; line-height: 1.4;"><span style="font-weight: bold;">Field Manager:</span> ${inspection?.inspector?.name || "Unassigned"}</div>
      </div>
    `;

    if (photosWithBase64.length > 0) {
      htmlContent += `<h2 style="color: #505050; margin: 12px 0 8px 0; font-size: 14px; font-weight: bold; page-break-after: avoid;">Photos (${photosWithBase64.length})</h2>`;

      // Group photos by section
      const photosBySection: Record<string, typeof photosWithBase64> = {};
      photosWithBase64.forEach(photo => {
        const sectionId = photo.sectionNodeId;
        if (!photosBySection[sectionId]) {
          photosBySection[sectionId] = [];
        }
        photosBySection[sectionId].push(photo);
      });

      // Render each section with its photos in a 4-column grid
      Object.entries(photosBySection).forEach(([sectionId, sectionPhotos]) => {
        const sectionLabel = sectionId ? getNodePath(sectionId) : "Uncategorized";
        htmlContent += `
          <div style="margin-bottom: 16px;">
            <div style="font-weight: bold; font-size: 12px; color: #0066cc; margin-bottom: 8px; background-color: #f0f4ff; padding: 4px 8px; border-radius: 3px; min-height: 20px; line-height: 1.4;">Section: ${sectionLabel || "Unknown"}</div>
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 12px;">
        `;

        sectionPhotos.forEach(photo => {
          htmlContent += `
            <div style="display: flex; flex-direction: column; border: 1px solid #ddd; padding: 4px; border-radius: 3px; background: #fafafa; min-height: 0;">
              <div style="flex: 1; display: flex; align-items: center; justify-content: center; min-height: 120px; margin-bottom: 4px; border-radius: 2px; overflow: hidden;">
                ${photo.base64 ? `<img src="${photo.base64}" style="max-width: 100%; max-height: 100%; object-fit: contain;" />` : `<div style="padding: 8px; color: #999; font-size: 9px; text-align: center;">Image error</div>`}
              </div>
              ${photo.subsectionName ? `<div style="font-size: 7px; color: #0066cc; font-weight: bold; background-color: #f0f4ff; padding: 2px 4px; border-radius: 2px; margin-bottom: 2px; text-align: center; line-height: 1.2;">${photo.subsectionName}</div>` : ""}
              <div style="font-size: 8px; color: #666; line-height: 1.2; text-align: center; margin-bottom: 4px;">📷 ${new Date(photo.uploadedAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
              ${photoNotes[photo.id] ? `<div style="font-size: 9px; color: #333; font-weight: 500; margin-top: 0; padding: 4px 6px; border-top: 1px solid #e5e7eb; line-height: 1.3; white-space: normal; word-break: break-word; overflow: hidden; background-color: #f9fafb; border-radius: 4px; border: 1px solid #e5e7eb;">${photoNotes[photo.id]}</div>` : ""}
            </div>
          `;
        });

        htmlContent += `
            </div>
          </div>
        `;
      });
    } else {
      htmlContent += `<p style="color: #999; font-style: italic; font-size: 11px;">No photos uploaded for this inspection.</p>`;
    }

    element.innerHTML = htmlContent;
    document.body.appendChild(element);

    // Wait for images to load (now they are base64, but technically still async decoding)
    const images = element.getElementsByTagName("img");
    const imagePromises = Array.from(images).map((img) => {
      if (img.complete) return Promise.resolve();
      return new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve; // Continue even if image fails
      });
    });

    try {
      await Promise.all(imagePromises);

      const canvas = await html2canvas(element, {
        scale: 4,
        useCORS: true,
        logging: false,
        allowTaint: true,
        backgroundColor: "#ffffff",
        imageTimeout: 0,
        onclone: (clonedDocument) => {
          const clonedElement = clonedDocument.body.querySelector('div');
          if (clonedElement) {
            clonedElement.style.transform = 'scale(1)';
          }
        }
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      // Add first page
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      // Add subsequent pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      const filename = `inspection-${new Date().toISOString().split("T")[0]}.pdf`;
      pdf.save(filename);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      document.body.removeChild(element);
    }
  };

  const content = (
    <div className="flex flex-col gap-6 w-full font-['Geist',sans-serif] bg-white rounded-lg">


      {/* Back Button (only shown when inline) */}
      {isInline && onBack && (
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-[#2463EB] hover:text-[#1e4fc4] transition-colors mb-4 text-sm font-medium"
        >
          <ArrowBackIcon width={16} height={16} />
          <span>Back to Inspections</span>
        </button>
      )}

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
            onClick={handleExportInspection}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 bg-white transition-colors flex items-center gap-2"
          >
            <DownloadIcon width={16} height={16} className="text-gray-500" />
            Export
          </button>
          <BlueButton
            onClick={() => {
              if (isEditing) {
                handleSaveChecklist();
              } else {
                setIsEditing(true);
              }
            }}
            icon={<EditIcon width={16} height={16} />}
          >
            {isEditing ? "Done Editing" : "Edit Checklist"}
          </BlueButton>
        </div>
      </div>

      {/* Two-Column Layout: Left (Checklist) and Right (Photos + Assignees) */}
      <div className="flex flex-col lg:flex-row gap-6 w-full">

        {/* Left Column: Status Bar + Checklist */}
        <div className="flex-1 min-w-0 flex flex-col gap-6">
          {/* Metadata Bar - Status and Due Date */}
          <SectionCard padding="none" variant="white">
            <InspectionDetailsBarTemplate
              status={status}
              dueDate={inspectionDueDate}
              onStatusChange={handleStatusChange}
              onDueDateChange={handleDueDateChange}
            />
          </SectionCard>
          <SectionCard
            title="Inspection Checklist"
            variant="white"
            className={cn(isChecklistFullScreen && "fixed inset-0 z-50 h-screen w-screen rounded-none")}
            actions={
              <button
                onClick={() => setIsChecklistFullScreen(!isChecklistFullScreen)}
                className="p-1.5 hover:bg-gray-100 rounded-md text-gray-500 transition-colors"
                title={isChecklistFullScreen ? "Exit Full Screen" : "Full Screen"}
              >
                {isChecklistFullScreen ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </button>
            }
          >
            <div className={cn("flex flex-col gap-4", isChecklistFullScreen && "h-[calc(100vh-80px)] overflow-y-auto px-4 pb-4")}>
              <div className="flex flex-col gap-1">
                {isLoadingChecklist && (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    Loading checklist...
                  </div>
                )}

                {!isLoadingChecklist && nodes.length === 0 && (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    Checklist is empty. Click "Edit Checklist" to add items.
                  </div>
                )}

                {!isLoadingChecklist && nodes.map((node, index) => (
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
                          ref={(el) => {
                            inputRefs.current[node.id] = el;
                            // Auto-focus newly added items
                            if (newlyAddedNodeId === node.id && el) {
                              el.focus();
                              el.select();
                              setNewlyAddedNodeId(null);
                            }
                          }}
                          type="text"
                          value={node.text}
                          onChange={(e) => handleTextChange(node.id, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, node.id, index)}
                          className={cn(
                            "w-full bg-transparent border-none p-0 focus:ring-0 text-sm outline-none",
                            node.depth === 0 ? "font-bold text-gray-900" : "text-gray-700"
                          )}
                          placeholder={node.depth === 0 ? "Section Title" : "Checklist Item"}
                        />
                      ) : (
                        <div
                          onClick={() => {
                            // If item has photo(s), open photo viewer
                            if (node.depth >= 1 && hasPhotoForNode(node.id)) {
                              const nodePhotos = photos.filter(p => p.sectionNodeId === node.id);
                              if (nodePhotos.length > 0) {
                                setSelectedPhotoForModal(nodePhotos[0]);
                                setIsPhotoViewerOpen(true);
                              }
                            }
                          }}
                          className={cn(
                            "text-sm whitespace-pre-wrap",
                            node.depth === 0 ? "font-bold text-gray-900" : "text-gray-700",
                            node.depth >= 1 && hasPhotoForNode(node.id) ? "cursor-pointer hover:underline text-blue-600" : ""
                          )}
                        >
                          {node.text}
                        </div>
                      )}
                    </div>

                    {/* Photo count indicator for items that have photos */}
                    {!isEditing && node.depth >= 1 && hasPhotoForNode(node.id) && (
                      <div className="flex-shrink-0 flex items-center gap-1 text-green-600 text-xs font-medium" title={`${getNodePhotoCount(node.id)} photo(s) attached`}>
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                        </svg>
                        <span>{getNodePhotoCount(node.id)}</span>
                      </div>
                    )}

                    {/* Camera Icon for All Items (depth >= 1) - Hidden when editing */}
                    {!isEditing && node.depth >= 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedNodeId(node.id);
                          setPendingPhotoFile(null);
                          setIsPhotoCommentModalOpen(true);
                        }}
                        className="flex-shrink-0 p-1.5 text-blue-600 bg-white border border-blue-600 hover:bg-blue-50 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                        title="Add photo to this item"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                        </svg>
                      </button>
                    )}

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
                      onClick={handleAddNodeToEnd}
                      className="text-sm text-blue-600 font-medium hover:underline flex items-center gap-1 transition-colors hover:text-blue-700"
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
                initials: inspection.inspector.initials || (() => {
                  // Fallback: compute initials from name if not present
                  const name = inspection.inspector.name || "";
                  const parts = name.trim().split(/\s+/);
                  if (parts.length === 1) {
                    return parts[0].substring(0, 2).toUpperCase();
                  }
                  return parts.length > 1 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : "?";
                })(),
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
              <div className="p-4 bg-white border border-gray-200 rounded-lg flex flex-col gap-3">
                <NestedChecklistSelect
                  label="Associate with Checklist Item"
                  value={selectedNodeId}
                  onChange={(value) => setSelectedNodeId(value)}
                  placeholder="Select a checklist item..."
                  checklist={nodes}
                  getNodePath={getNodePath}
                />

                <div
                  className={cn(
                    "border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer transition-colors",
                    !selectedNodeId ? "opacity-50 cursor-not-allowed bg-gray-100" : "hover:bg-gray-50 bg-white"
                  )}
                  onClick={() => {
                    if (selectedNodeId) {
                      setPendingPhotoFile(null);
                      setIsPhotoCommentModalOpen(true);
                    } else {
                      alert("Please select a checklist item first");
                    }
                  }}
                >
                  <div className="text-gray-400">
                    <PlusIcon width={24} height={24} />
                  </div>
                  <span className="mt-1 text-sm text-gray-600 font-medium">Click to Upload</span>
                </div>
              </div>

              {/* Photos Grouped by Checklist Node */}
              {photos.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {Object.entries(photosByNode).map(([nodeId, nodePhotos]) => {
                    const nodePath = getNodePath(nodeId);
                    const isNodeExpanded = expandedPhotoNodes.has(nodeId);

                    return (
                      <div key={nodeId} className="border border-gray-200 rounded-lg bg-white overflow-hidden">
                        {/* Node Header */}
                        <button
                          onClick={() => togglePhotoNode(nodeId)}
                          className={cn(
                            "w-full flex items-center justify-between p-2 transition-colors text-left",
                            isNodeExpanded ? "bg-blue-50 hover:bg-blue-100" : "bg-gray-50 hover:bg-gray-100"
                          )}
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <ChevronDownIcon
                              width={12}
                              height={12}
                              className={cn(
                                "text-gray-600 transition-transform flex-shrink-0",
                                isNodeExpanded ? "rotate-180" : ""
                              )}
                            />
                            <span className="text-xs font-medium text-gray-900 truncate">{nodePath}</span>
                          </div>
                          <span className="text-[10px] text-gray-600 font-medium flex-shrink-0 ml-2">
                            {nodePhotos.length}
                          </span>
                        </button>

                        {/* Photos Grid */}
                        {isNodeExpanded && (
                          <div className="p-2 bg-white border-t border-gray-200">
                            <div className="grid grid-cols-3 gap-1.5">
                              {nodePhotos.map((photo) => (
                                <div
                                  key={photo.id}
                                  className="relative group cursor-pointer rounded-md overflow-hidden bg-gray-100 aspect-square border border-gray-200"
                                  onClick={() => handleOpenPhotoModal(photo)}
                                >
                                  <img src={photo.fileRef} alt="Inspection" className="w-full h-full object-cover" />
                                  {photo.comment && (
                                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white text-[8px] px-1 py-0.5 line-clamp-1">
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
              ) : (
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
        onOpenChange={(open) => {
          setIsPhotoCommentModalOpen(open);
          if (!open) setPendingPhotoFile(null);
        }}
        onSubmit={handlePhotoCommentSubmit}
        title={selectedNodeId ? getNodePath(selectedNodeId) : "Add Photo"}
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
          nodePath={selectedPhotoForModal.sectionNodeId ? getNodePath(selectedPhotoForModal.sectionNodeId) : "Unknown Item"}
          onSave={handleSavePhotoConditionAndNote}
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

const PHOTO_VIEWER_CONDITION_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Select condition (optional)" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
  { value: "poor", label: "Poor" },
];

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
  nodePath: string;
  onSave?: (photoId: string, condition: string | null, comment: string) => Promise<void>;
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
  nodePath,
  onSave,
}: PhotoViewerModalProps) {
  const [condition, setCondition] = React.useState(photo.condition || "");
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    setCondition(photo.condition || "");
  }, [photo.id, photo.condition]);

  const canGoNext = photoIndex < totalPhotos - 1;
  const canGoPrev = photoIndex > 0;

  const handleSave = async () => {
    if (!onSave) return;
    setIsSaving(true);
    try {
      await onSave(
        photo.id,
        condition ? condition : null,
        note
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (!open) return null;

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
          <div className="flex flex-col gap-1 flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-gray-900">Photo Viewer</h2>
              <span className="text-sm text-gray-500 flex-shrink-0">
                {photoIndex + 1} of {totalPhotos}
              </span>
            </div>
            <p className="text-sm text-blue-600 truncate">{nodePath}</p>
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

        {/* Condition Section - editable */}
        <div className="border-t border-gray-200 px-4 pt-4 pb-2 bg-white">
          <SelectField
            label="Condition"
            value={condition}
            onChange={(v) => setCondition(v as string)}
            options={PHOTO_VIEWER_CONDITION_OPTIONS}
            placeholder="Select condition (optional)"
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

        {/* Footer with Navigation and Save */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50 gap-4 flex-wrap">
          <button
            onClick={onPrev}
            disabled={!canGoPrev}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Previous
          </button>

          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">
              {new Date(photo.uploadedAt).toLocaleString()}
            </span>
            {onSave && (
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
            )}
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
