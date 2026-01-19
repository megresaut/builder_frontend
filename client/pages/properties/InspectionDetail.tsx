import React, { useState, useMemo, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageTemplate from "@/layout/PageTemplate";
import SubPageHeaderV2 from "@/components/SubPageHeaderV2";
import SectionCard from "@/components/SectionCard";
import { ModalTemplate, ModalButtons, ModalField } from "@/components/ui/ModalTemplate";
import {
  ArrowBackIcon,
  EditIcon,
  PlusIcon,
  DocumentIcon,
  DeleteIcon,
  ApproveIcon,
  EyeIcon
} from "@/components/icons";
import { cn } from "@/lib/utils";

// --- Types ---

interface RequirementsNode {
  id: string;
  type: "heading" | "bullet";
  text: string;
  level: number; // 1 for heading, 2+ for bullets
}

interface InspectionPhoto {
  id: string;
  url: string;
  uploadedAt: string; // ISO string
  capturedAt?: string;
  attachedToNodeId: string | null; // null = Unassigned
}

interface RequirementsDoc {
  hasDoc: boolean;
  fileName?: string;
  lastUpdated?: string;
  nodes: RequirementsNode[];
}

// --- Mock Data ---

const MOCK_INITIAL_NODES: RequirementsNode[] = [
  { id: "1", type: "heading", text: "Exterior Assessment", level: 1 },
  { id: "2", type: "bullet", text: "Driveway condition (cracks, stains)", level: 2 },
  { id: "3", type: "bullet", text: "Landscaping status (overgrown, dead plants)", level: 2 },
  { id: "4", type: "bullet", text: "Exterior lighting functionality", level: 2 },
  { id: "5", type: "heading", text: "Interior - Main Floor", level: 1 },
  { id: "6", type: "bullet", text: "Entrance/Foyer cleanliness", level: 2 },
  { id: "7", type: "bullet", text: "Kitchen appliances check", level: 2 },
  { id: "8", type: "bullet", text: "Flooring condition", level: 2 },
];

const MOCK_PHOTOS: InspectionPhoto[] = [
  {
    id: "p1",
    url: "https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/d5d01db2db718e32f4e620e7b1fc6ea705e115b1?placeholderIfAbsent=true",
    uploadedAt: new Date().toISOString(),
    attachedToNodeId: "2",
  },
];

// --- Components ---

export default function InspectionDetail() {
  const navigate = useNavigate();
  const { propertyId, inspectionId } = useParams();

  // --- State ---
  const [requirements, setRequirements] = useState<RequirementsDoc>({
    hasDoc: true, // Default to true for demo, toggleable via "Remove" logic if we added it
    fileName: "22_Indian_Chase_Inspection_Reqs.docx",
    lastUpdated: "Oct 10, 2025 by John Doe",
    nodes: MOCK_INITIAL_NODES,
  });

  const [photos, setPhotos] = useState<InspectionPhoto[]>(MOCK_PHOTOS);
  const [activeTargetId, setActiveTargetId] = useState<string | null>(null);
  const [isEditingRequirements, setIsEditingRequirements] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false); // For .docx upload
  const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null); // For changing target

  // Temporary state for editing requirements
  const [editNodes, setEditNodes] = useState<RequirementsNode[]>([]);

  // File input ref for photos
  const photoInputRef = useRef<HTMLInputElement>(null);

  // --- Computed ---
  const activeTargetNode = useMemo(() => {
    return requirements.nodes.find((n) => n.id === activeTargetId);
  }, [requirements.nodes, activeTargetId]);

  const coverageStats = useMemo(() => {
    const totalTargets = requirements.nodes.length;
    const coveredNodes = new Set(photos.map((p) => p.attachedToNodeId).filter(Boolean));
    const coveredCount = coveredNodes.size;
    
    // Find missing targets (nodes that don't have a photo)
    const missingTargets = requirements.nodes.filter(n => !coveredNodes.has(n.id));

    return { total: totalTargets, covered: coveredCount, missing: missingTargets };
  }, [requirements.nodes, photos]);

  const isComplete = coverageStats.covered === coverageStats.total && coverageStats.total > 0;

  // --- Handlers ---

  const handleBack = () => {
    navigate(`/property/${propertyId}/Inspections`);
  };

  const handleToggleEdit = () => {
    if (!isEditingRequirements) {
      setEditNodes([...requirements.nodes]); // Init edit state
      setIsEditingRequirements(true);
    } else {
      // Cancel
      setIsEditingRequirements(false);
    }
  };

  const handleSaveRequirements = () => {
    setRequirements((prev) => ({
      ...prev,
      nodes: editNodes,
      lastUpdated: `Just now by Current User`,
    }));
    setIsEditingRequirements(false);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newPhotos: InspectionPhoto[] = Array.from(e.target.files).map((file) => ({
        id: `new_${Date.now()}_${Math.random()}`,
        url: URL.createObjectURL(file), // Preview URL
        uploadedAt: new Date().toISOString(),
        attachedToNodeId: activeTargetId, // Attach to active target or null
      }));
      setPhotos((prev) => [...prev, ...newPhotos]);
      
      // Reset input
      if (photoInputRef.current) photoInputRef.current.value = "";
    }
  };

  const handleRemovePhoto = (photoId: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
  };

  const handleChangeTarget = (photoId: string, nodeId: string | null) => {
    setPhotos((prev) => prev.map(p => p.id === photoId ? { ...p, attachedToNodeId: nodeId } : p));
    setEditingPhotoId(null);
  };

  const handleUploadDocx = async (file: File) => {
    // Reset selection to avoid orphaned targets
    setActiveTargetId(null);

    // Feature: Parse .txt/.md files for real-time preview (since .docx requires backend/heavy lib)
    if (file.name.endsWith(".txt") || file.name.endsWith(".md")) {
      try {
        const text = await file.text();
        const lines = text.split("\n").filter((l) => l.trim().length > 0);

        const realNodes: RequirementsNode[] = lines.map((line, i) => {
          // Simple heuristic: Lines starting with # or all caps are headings
          const isHeading = line.trim().startsWith("#") || (line.trim().length < 50 && line.toUpperCase() === line);
          const cleanText = line.replace(/^[#\-\*]\s*/, "").trim();

          return {
            id: `doc_${Date.now()}_${i}`,
            type: isHeading ? "heading" : "bullet",
            text: cleanText,
            level: isHeading ? 1 : 2,
          };
        });

        setRequirements({
          hasDoc: true,
          fileName: file.name,
          lastUpdated: "Just now",
          nodes: realNodes,
        });
        setIsUploadModalOpen(false);
        return;
      } catch (e) {
        console.error("Failed to parse text file", e);
      }
    }

    // Mock processing of .docx
    // In a real app, this would send file to server, parse, and return nodes
    const mockParsedNodes: RequirementsNode[] = [
      { id: "new_1", type: "heading", text: "Imported Section 1: Structure", level: 1 },
      { id: "new_2", type: "bullet", text: "Foundation walls condition (cracks, water marks)", level: 2 },
      { id: "new_3", type: "bullet", text: "Sump pump functionality test", level: 2 },
      { id: "new_4", type: "heading", text: "Imported Section 2: Roof", level: 1 },
      { id: "new_5", type: "bullet", text: "Shingle condition estimation", level: 2 },
      { id: "new_6", type: "bullet", text: "Gutter cleanliness and attachment", level: 2 },
    ];

    setRequirements({
      hasDoc: true,
      fileName: file.name,
      lastUpdated: "Just now",
      nodes: mockParsedNodes
    });
    setIsUploadModalOpen(false);
  };

  // --- Renderers ---

  const renderRequirements = () => {
    if (!requirements.hasDoc) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <DocumentIcon width={32} height={32} color="#9ca3af" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No requirements uploaded</h3>
          <p className="text-sm text-gray-500 max-w-sm mb-6">
            Upload the property’s Word inspection document. It will be rendered and editable in the app.
          </p>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Upload Requirements (.docx)
          </button>
        </div>
      );
    }

    if (isEditingRequirements) {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-blue-50 p-3 rounded-lg border border-blue-100 mb-4">
            <span className="text-sm text-blue-800 font-medium">Editing Mode Active</span>
            <div className="flex gap-2">
              <button
                onClick={() => setIsEditingRequirements(false)}
                className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRequirements}
                className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </div>
          <div className="space-y-3">
            {editNodes.map((node, index) => (
              <div key={node.id} className="flex gap-2 items-start">
                <div className={cn("flex-shrink-0 pt-2", node.type === "bullet" ? "pl-6" : "")}>
                  {node.type === "bullet" ? "•" : "#"}
                </div>
                <input
                  type="text"
                  value={node.text}
                  onChange={(e) => {
                    const newNodes = [...editNodes];
                    newNodes[index].text = e.target.value;
                    setEditNodes(newNodes);
                  }}
                  className={cn(
                    "w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none",
                    node.type === "heading" ? "font-bold" : "text-sm"
                  )}
                />
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-1">
        {requirements.nodes.map((node) => {
          const photosForNode = photos.filter(p => p.attachedToNodeId === node.id);
          const isTarget = activeTargetId === node.id;

          return (
            <div
              key={node.id}
              className={cn(
                "group flex items-start justify-between py-2 px-3 rounded-lg transition-colors border border-transparent",
                isTarget ? "bg-blue-50 border-blue-200" : "hover:bg-gray-50",
                node.type === "bullet" ? "ml-6" : "mt-2"
              )}
            >
              <div className={cn("flex-1", node.type === "heading" ? "font-semibold text-gray-900" : "text-sm text-gray-700")}>
                {node.type === "bullet" && <span className="mr-2">•</span>}
                {node.text}
              </div>
              
              <button
                onClick={() => setActiveTargetId(isTarget ? null : node.id)}
                className={cn(
                  "flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors ml-4 flex-shrink-0",
                  isTarget 
                    ? "bg-blue-100 text-blue-700" 
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
                title={isTarget ? "Deselect target" : "Set as photo target"}
              >
                <PlusIcon width={14} height={14} />
                <span>Photos</span>
                {photosForNode.length > 0 && (
                  <span className="bg-white px-1.5 py-0.5 rounded-full text-[10px] shadow-sm">
                    {photosForNode.length}
                  </span>
                )}
              </button>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <PageTemplate>
      <div className="flex flex-col gap-6 w-fit min-w-full font-['Geist',sans-serif]">
        
        {/* Header */}
        <SubPageHeaderV2
          leftContent={
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <button onClick={handleBack} className="hover:text-gray-900 transition-colors">
                  Properties
                </button>
                <span>/</span>
                <button onClick={handleBack} className="hover:text-gray-900 transition-colors">
                  Inspections
                </button>
                <span>/</span>
                <span className="text-gray-900 font-medium">Detail</span>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={handleBack}
                  className="p-1 -ml-1 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors"
                >
                  <ArrowBackIcon width={20} height={20} />
                </button>
                <div>
                  <h1 className="text-xl font-semibold text-[#303030]">Inspection</h1>
                  <p className="text-sm text-gray-500">
                    22 Indian Chase Dr • {requirements.lastUpdated}
                  </p>
                </div>
              </div>
            </div>
          }
          rightContent={
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsEditingRequirements(!isEditingRequirements)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 bg-white transition-colors"
              >
                {isEditingRequirements ? "Cancel Edit" : "Edit Requirements"}
              </button>
              <button 
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 bg-white transition-colors"
                onClick={() => photoInputRef.current?.click()}
              >
                Upload Photos
              </button>
              <button 
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors flex items-center gap-2",
                  isComplete ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700"
                )}
              >
                {isComplete ? (
                  <>
                    <ApproveIcon width={16} height={16} />
                    <span>Complete</span>
                  </>
                ) : "Mark Complete"}
              </button>
            </div>
          }
        />

        {/* Content Layout */}
        <div className="flex flex-col lg:flex-row gap-6 w-full">
          
          {/* LEFT COLUMN: Requirements */}
          <div className="flex-1 min-w-0">
            <SectionCard 
              title="Inspection Requirements" 
              className="h-full"
              actions={
                requirements.hasDoc && !isEditingRequirements && (
                  <button 
                    onClick={() => setIsUploadModalOpen(true)}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Replace doc
                  </button>
                )
              }
            >
              {renderRequirements()}
            </SectionCard>
          </div>

          {/* RIGHT COLUMN: Uploads & Coverage */}
          <div className="w-full lg:w-[400px] flex-shrink-0 flex flex-col gap-6">
            
            {/* Card 1: Upload Photos */}
            <SectionCard title="Upload Photos">
              <div className="flex flex-col gap-4">
                
                {/* Active Target Indicator */}
                <div className={cn(
                  "p-3 rounded-lg border text-sm",
                  activeTargetId 
                    ? "bg-blue-50 border-blue-200 text-blue-800" 
                    : "bg-gray-50 border-gray-200 text-gray-600"
                )}>
                  <div className="font-medium text-xs uppercase tracking-wider mb-1 opacity-70">
                    Active Target
                  </div>
                  <div className="font-medium truncate">
                    {activeTargetNode ? activeTargetNode.text : "No specific target selected"}
                  </div>
                  {!activeTargetId && (
                    <div className="text-xs mt-1 opacity-80">
                      Photos will be "Unassigned"
                    </div>
                  )}
                </div>

                {/* Upload Button area */}
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => photoInputRef.current?.click()}
                >
                  <PlusIcon width={24} height={24} color="#9ca3af" />
                  <span className="mt-2 text-sm text-gray-600 font-medium">Add Photos</span>
                  <span className="text-xs text-gray-400 mt-1">Supports JPG, PNG</span>
                  <input 
                    ref={photoInputRef}
                    type="file" 
                    multiple 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handlePhotoUpload}
                  />
                </div>

                {/* Photo List */}
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {photos.map((photo) => {
                    const attachedNode = requirements.nodes.find(n => n.id === photo.attachedToNodeId);
                    
                    return (
                      <div key={photo.id} className="flex gap-3 p-2 border border-gray-200 rounded-lg bg-white shadow-sm">
                        <div className="w-16 h-16 flex-shrink-0 bg-gray-100 rounded overflow-hidden">
                          <img src={photo.url} alt="Inspection" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div>
                            <div className="text-xs text-gray-500 mb-1">
                              {new Date(photo.uploadedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {editingPhotoId === photo.id ? (
                                <select
                                  className="w-full p-1 border rounded text-xs"
                                  value={photo.attachedToNodeId || ""}
                                  onChange={(e) => handleChangeTarget(photo.id, e.target.value || null)}
                                  autoFocus
                                  onBlur={() => setEditingPhotoId(null)}
                                >
                                  <option value="">Unassigned</option>
                                  {requirements.nodes.map(n => (
                                    <option key={n.id} value={n.id}>{n.text}</option>
                                  ))}
                                </select>
                              ) : (
                                attachedNode ? attachedNode.text : "Unassigned"
                              )}
                            </div>
                          </div>

                          <div className="flex justify-end gap-2 mt-1">
                            <button
                              onClick={() => setEditingPhotoId(photo.id)}
                              className="text-xs text-blue-600 hover:underline"
                            >
                              Change
                            </button>
                            <button
                              onClick={() => handleRemovePhoto(photo.id)}
                              className="text-xs text-red-600 hover:text-red-700 hover:underline"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {photos.length === 0 && (
                    <div className="text-center text-sm text-gray-400 py-4 italic">
                      No photos uploaded yet
                    </div>
                  )}
                </div>

              </div>
            </SectionCard>

            {/* Card 2: Coverage */}
            <SectionCard title="Coverage">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Progress</span>
                  <span className={cn("text-sm font-bold", isComplete ? "text-green-600" : "text-blue-600")}>
                    {coverageStats.covered} / {coverageStats.total}
                  </span>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className={cn("h-2.5 rounded-full transition-all duration-500", isComplete ? "bg-green-500" : "bg-blue-600")}
                    style={{ width: `${coverageStats.total > 0 ? (coverageStats.covered / coverageStats.total) * 100 : 0}%` }}
                  ></div>
                </div>

                {/* Missing Targets */}
                {coverageStats.missing.length > 0 ? (
                  <div className="mt-2">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Missing Targets
                    </div>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                      {coverageStats.missing.map(node => (
                        <div key={node.id} className="flex items-center justify-between text-sm p-2 bg-red-50 rounded text-red-800 border border-red-100">
                          <span className="truncate flex-1 mr-2">{node.text}</span>
                          <button 
                            onClick={() => setActiveTargetId(node.id)}
                            className="text-xs bg-white border border-red-200 text-red-700 px-2 py-1 rounded hover:bg-red-50"
                          >
                            Set Target
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-green-50 text-green-800 text-sm rounded border border-green-100 flex items-center gap-2">
                    <ApproveIcon width={16} height={16} />
                    <span>All requirements covered!</span>
                  </div>
                )}
              </div>
            </SectionCard>

          </div>
        </div>
      </div>

      {/* Upload Requirements Modal */}
      <UploadDocxModal 
        open={isUploadModalOpen} 
        onOpenChange={setIsUploadModalOpen}
        onUpload={handleUploadDocx}
      />

    </PageTemplate>
  );
}

// --- Helper Components ---

function UploadDocxModal({ 
  open, 
  onOpenChange, 
  onUpload 
}: { 
  open: boolean; 
  onOpenChange: (o: boolean) => void;
  onUpload: (file: File) => void;
}) {
  const [file, setFile] = useState<File | null>(null);

  return (
    <ModalTemplate
      open={open}
      onOpenChange={onOpenChange}
      title="Upload Inspection Requirements"
      size="sm"
      footer={
        <ModalButtons
          onCancel={() => onOpenChange(false)}
          onConfirm={() => file && onUpload(file)}
          confirmLabel="Import Document"
          confirmDisabled={!file}
        />
      }
    >
      <div className="flex flex-col gap-4">
        <p className="text-sm text-gray-600">
          Upload a Microsoft Word (.docx) document containing the inspection requirements. 
          The content will be parsed into a checklist.
        </p>
        
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 flex flex-col items-center justify-center text-center">
          <DocumentIcon width={32} height={32} className="text-gray-400 mb-3" />
          
          <input 
            type="file" 
            accept=".docx"
            id="docx-upload"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) setFile(e.target.files[0]);
            }}
          />
          
          {file ? (
            <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-2 rounded text-sm">
              <span className="font-medium">{file.name}</span>
              <button onClick={() => setFile(null)} className="hover:text-blue-900">
                <DeleteIcon width={14} height={14} />
              </button>
            </div>
          ) : (
            <label 
              htmlFor="docx-upload" 
              className="text-blue-600 font-medium hover:underline cursor-pointer"
            >
              Click to browse file
            </label>
          )}
          <p className="text-xs text-gray-400 mt-2">Max file size: 10MB</p>
        </div>
      </div>
    </ModalTemplate>
  );
}
