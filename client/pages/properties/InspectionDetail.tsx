import React, { useState, useRef, useMemo, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageTemplate from "@/layout/PageTemplate";
import SectionCard from "@/components/SectionCard";
import BlueButton from "@/components/BlueButton";
import InspectionAssignees from "@/components/InspectionAssignees";
import InspectionDetailsBarTemplate from "@/components/templates/InspectionDetailsBarTemplate";
import PersonAvatarTag from "@/components/templates/PersonAvatarTag";
import { ModalTemplate, ModalButtons } from "@/components/ui/ModalTemplate";
import {
  PlusIcon,
  DeleteIcon,
  EditIcon,
  ArrowBackIcon,
  ArrowForwardIcon,
  ChevronDownIcon,
} from "@/components/icons";
import { DownloadIcon } from "@/components/icons/DownloadIcon";
import { Maximize2, Minimize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { SelectField } from "@/components/forms/SelectField";
import {
  ChecklistNode,
  InspectionPhoto,
  MOCK_CHECKLIST_NODES,
} from "@/data/inspection-checklist";
import { DEFAULT_INSPECTION_TEMPLATES, ChecklistSectionTemplate } from "@/data/inspections";
import html2canvas from "html2canvas";
import { jsPDF } from "jsPDF";
import {
  updateInspection,
  listChecklists,
  createChecklist,
  updateChecklist,
  addInspectionPhotos,
  listInspectionPhotos,
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
  const [status, setStatus] = useState<"In Progress" | "Completed">("In Progress");
  const [inspectionDueDate, setInspectionDueDate] = useState<Date | string | null>(
    inspection?.inspectionDate ? new Date(inspection.inspectionDate) : new Date()
  );
  const [isLoadingChecklist, setIsLoadingChecklist] = useState(true);
  const [checklistId, setChecklistId] = useState<number | null>(inspection?.checklist_id || null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Metadata State
  const [uploadedBy] = useState<string>("John Doe");
  const [uploadedAt] = useState<string>(new Date().toLocaleString());
  const [lastUpdated] = useState<string>(new Date().toLocaleString());
  const [lastUpdatedBy] = useState<string>("Jerry Sanchez");

  // Update checklistId when inspection prop changes
  useEffect(() => {
    if (inspection?.checklist_id) {
      setChecklistId(inspection.checklist_id);
    }
  }, [inspection?.checklist_id]);

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

  const handlePhotoCommentSubmit = async (file: File, comment: string) => {
    if (!inspectionId) {
      alert("No inspection ID found");
      return;
    }

    try {
      setIsUploadingPhoto(true);

      // Upload photo to backend
      const result = await addInspectionPhotos(
        inspectionId,
        selectedSectionId,
        comment,
        [file]
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

  // --- Handlers: General ---

  const handleStatusChange = async (newStatus: "In Progress" | "Completed") => {
    setStatus(newStatus);
    
    if (inspectionId) {
      try {
        await updateInspection(inspectionId, { status: newStatus });
      } catch (error) {
        console.error("Failed to update status:", error);
      }
    }
  };

  const handleDueDateChange = async (newDate: Date | string | null) => {
    setInspectionDueDate(newDate);
    
    if (inspectionId) {
      try {
        const dueDateISO = newDate instanceof Date ? newDate.toISOString() : newDate;
        await updateInspection(inspectionId, { due_date: dueDateISO });
      } catch (error) {
        console.error("Failed to update due date:", error);
      }
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
        const response = await fetch(blobUrl);
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
        <div style="margin: 4px 0; font-size: 11px; line-height: 1.4;"><span style="font-weight: bold;">Property:</span> 22 Indian Chase Dr</div>
        <div style="margin: 4px 0; font-size: 11px; line-height: 1.4;"><span style="font-weight: bold;">Inspection Due Date:</span> ${dueDate}</div>
        <div style="margin: 4px 0; font-size: 11px; line-height: 1.4;"><span style="font-weight: bold;">Field Manager:</span> ${inspection?.inspector?.name || "Unassigned"}</div>
        <div style="margin: 4px 0; font-size: 11px; line-height: 1.4;"><span style="font-weight: bold;">Uploaded By:</span> ${uploadedBy}</div>
        <div style="margin: 4px 0; font-size: 11px; line-height: 1.4;"><span style="font-weight: bold;">Uploaded At:</span> ${uploadedAt}</div>
        <div style="margin: 4px 0; font-size: 11px; line-height: 1.4;"><span style="font-weight: bold;">Last Updated:</span> ${lastUpdated} by ${lastUpdatedBy}</div>
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
        const section = sections.find(s => s.id === sectionId);
        htmlContent += `
          <div style="margin-bottom: 16px;">
            <div style="font-weight: bold; font-size: 12px; color: #0066cc; margin-bottom: 8px; background-color: #f0f4ff; padding: 4px 8px; border-radius: 3px; min-height: 20px; line-height: 1.4;">Section: ${section?.text || "Unknown"}</div>
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
              <div className="flex items-center gap-3 text-xs text-gray-600 pb-3 border-b border-gray-200">
                <span className="font-medium text-gray-500">Last updated:</span>
                <PersonAvatarTag
                  person={{
                    name: lastUpdatedBy,
                    initials: "JS",
                    id: "manager",
                    email: "jerry.sanchez@example.com",
                    phone: "(555) 123-4567",
                    title: "Field Manager"
                  }}
                  type="assignee"
                  size="sm"
                  className="mt-0"
                />
                <span className="text-gray-500">{lastUpdated}</span>
              </div>

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
                    !selectedSectionId ? "opacity-50 cursor-not-allowed bg-gray-100" : "hover:bg-gray-50 bg-white"
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
                  const displayText = photo.subsectionName ? `${photo.subsectionName}` : section?.text || "Photo";
                  return (
                    <div
                      key={photo.id}
                      className="relative group cursor-pointer rounded-lg overflow-hidden bg-gray-100 aspect-square"
                      onClick={() => handleOpenPhotoModal(photo)}
                      title={displayText}
                    >
                      <img src={photo.fileRef} alt="Inspection" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity flex items-end justify-start p-1">
                        <div className="text-[10px] font-medium text-white bg-black bg-opacity-60 px-1.5 py-0.5 rounded line-clamp-1">
                          {displayText}
                        </div>
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
        isLoading={isUploadingPhoto}
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
          subsectionName={selectedPhotoForModal.subsectionName}
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

interface PhotoCommentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (file: File, comment: string) => Promise<void>;
  title: string;
  submitLabel: string;
  initialFile: File | null;
  isLoading?: boolean;
}

function PhotoCommentModal({
  open,
  onOpenChange,
  onSubmit,
  title,
  submitLabel,
  initialFile,
  isLoading = false,
}: PhotoCommentModalProps) {
  const [comment, setComment] = React.useState("");

  React.useEffect(() => {
    if (!open) {
      setComment("");
    }
  }, [open]);

  const handleConfirm = async () => {
    if (!initialFile) return;
    await onSubmit(initialFile, comment);
  };

  const handleCancel = () => {
    if (!isLoading) {
      onOpenChange(false);
    }
  };

  return (
    <ModalTemplate
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      size="sm"
      footer={
        <ModalButtons
          onCancel={handleCancel}
          onConfirm={handleConfirm}
          cancelLabel="Cancel"
          confirmLabel={isLoading ? "Uploading..." : submitLabel}
          confirmDisabled={!initialFile || isLoading}
        />
      }
    >
      <div className="flex flex-col gap-4">
        <div className="text-sm text-gray-600">
          <strong>File:</strong> {initialFile ? initialFile.name : "No file selected"}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Comment (optional)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add a comment or note for this photo..."
            className="w-full p-2 border border-gray-300 rounded-lg text-sm resize-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            rows={3}
          />
        </div>
      </div>
    </ModalTemplate>
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
  note: string;
  onNoteChange: (note: string) => void;
  sectionName?: string;
  subsectionName?: string;
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
  subsectionName,
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
              {subsectionName && (
                <p className="text-sm text-gray-600 mt-1">Item: <span className="font-medium text-blue-600">{subsectionName}</span></p>
              )}
              {!subsectionName && sectionName && (
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
