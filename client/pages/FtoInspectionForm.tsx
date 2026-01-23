import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageTemplate from "@/layout/PageTemplate";
import BlueButton from "@/components/BlueButton";
import {
  CloseIcon,
  PlusIcon,
  DeleteIcon,
  ChevronDownIcon,
} from "@/components/icons";
import { Maximize2, Minimize2, Camera } from "lucide-react";
import { SelectField, DateField } from "@/components/forms";
import { PROPERTIES } from "@/data/fto/properties";
import PhotoCommentModal from "@/components/PhotoCommentModal";
import { cn } from "@/lib/utils";
import {
  ChecklistNode,
  MOCK_CHECKLIST_NODES,
  getChecklistForProperty,
} from "@/data/inspection-checklist";

// --- Types ---

interface InspectionPhoto {
  id: string;
  url: string;
  uploadedAt: string;
  comment?: string;
  sectionNodeId?: string;
  sectionName?: string;
  subsectionNodeId?: string;
  subsectionName?: string;
}


interface StoredInspection {
  id: number;
  date: string;
  propertyId: string;
  unitId: string | null;
  photos: InspectionPhoto[];
}

// --- Components ---

export default function FtoInspectionForm() {
  const navigate = useNavigate();
  const { inspectionId } = useParams<{ inspectionId?: string }>();
  const isReadOnly = Boolean(inspectionId);

  // Form State
  const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const [unitId, setUnitId] = useState<string | null>(null);

  // Inspection State
  const [photos, setPhotos] = useState<InspectionPhoto[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string>("");
  const [selectedSubsectionId, setSelectedSubsectionId] = useState<string>("");
  const [selectedSubsectionName, setSelectedSubsectionName] = useState<string>("");

  // UI State
  const [isPhotoCommentModalOpen, setIsPhotoCommentModalOpen] = useState(false);
  const [pendingPhotoFile, setPendingPhotoFile] = useState<File | null>(null);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isChecklistFullScreen, setIsChecklistFullScreen] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{
    date?: string;
    property?: string;
    photos?: string;
  }>({});

  // Refs
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Derived Data
  const currentChecklist = useMemo(() => getChecklistForProperty(propertyId), [propertyId]);
  const checklistSections = useMemo(() => currentChecklist.filter((n) => n.depth === 0), [currentChecklist]);

  // Get subsections for the current section
  const currentSectionSubsections = useMemo(() => {
    if (!selectedSubsectionId) return [];

    // Find the parent section of the selected subsection
    const subsectionIndex = currentChecklist.findIndex(n => n.id === selectedSubsectionId);
    if (subsectionIndex === -1) return [];

    // Find the section header before this subsection
    let sectionIndex = subsectionIndex - 1;
    while (sectionIndex >= 0 && currentChecklist[sectionIndex].depth !== 0) {
      sectionIndex--;
    }

    if (sectionIndex === -1) return [];

    // Get all subsections under this section
    const section = currentChecklist[sectionIndex];
    const subsections: typeof currentChecklist = [];

    for (let i = sectionIndex + 1; i < currentChecklist.length; i++) {
      const node = currentChecklist[i];
      if (node.depth === 0) break; // Stop at next section
      if (node.depth === 1) {
        subsections.push(node);
      }
    }

    return subsections;
  }, [selectedSubsectionId, currentChecklist]);

  // --- Effects ---

  // Load inspection data from localStorage if viewing existing inspection
  useEffect(() => {
    if (inspectionId && isReadOnly) {
      const storedInspections = JSON.parse(
        localStorage.getItem("inspectionData") || "{}"
      ) as Record<string, StoredInspection>;

      const inspectionData = storedInspections[inspectionId];
      if (inspectionData) {
        setDate(inspectionData.date);
        setPropertyId(inspectionData.propertyId);
        setUnitId(inspectionData.unitId);
        setPhotos(inspectionData.photos);
      }
    }
  }, [inspectionId, isReadOnly]);

  // --- Handlers ---

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // Store the selected file and open the modal
      setPendingPhotoFile(e.target.files[0]);
      setIsPhotoCommentModalOpen(true);

      if (photoInputRef.current) photoInputRef.current.value = "";
    }
  };

  const handlePhotoCommentSubmit = async (file: File, comment: string) => {
    if (!selectedSectionId) {
      alert("Please select a section first.");
      return;
    }

    const newPhoto: InspectionPhoto = {
      id: `new_${Date.now()}_${Math.random()}`,
      url: URL.createObjectURL(file),
      uploadedAt: new Date().toISOString(),
      comment: comment || undefined,
      sectionNodeId: selectedSectionId,
    };
    setPhotos((prev) => [...prev, newPhoto]);
    setPendingPhotoFile(null);
    setIsPhotoCommentModalOpen(false);
  };

  const handleRemovePhoto = (photoId: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
  };

  const handleUpdatePhotoComment = (photoId: string, comment: string) => {
    setPhotos((prev) => prev.map(p => p.id === photoId ? { ...p, comment } : p));
  };

  const handleOpenGallery = (index: number) => {
    setCurrentPhotoIndex(index);
    setIsGalleryOpen(true);
  };

  const getPropertyUnits = (propId: string | null) => {
    if (!propId) return [];
    const property = PROPERTIES.find((p) => p.id === propId);
    return property?.units || [];
  };

  const handleSubmit = () => {
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

    // Generate a unique inspection ID
    const inspectionId = Date.now();

    // Store inspection data to localStorage
    const storedInspections = JSON.parse(
      localStorage.getItem("inspectionData") || "{}"
    ) as Record<string, StoredInspection>;

    storedInspections[inspectionId.toString()] = {
      id: inspectionId,
      date,
      propertyId,
      unitId,
      photos,
    };

    localStorage.setItem("inspectionData", JSON.stringify(storedInspections));

    // Store the inspection in the submissions list
    const submissions = JSON.parse(
      localStorage.getItem("ftoSubmissions") || "[]"
    ) as Array<{
      id: number;
      property: string;
      unit: string;
      date: string;
      inspector: string;
      status: "Completed" | "Draft";
    }>;

    const property = PROPERTIES.find((p) => p.id === propertyId);
    const unit = property?.units?.find((u) => u.id === unitId);

    // Calculate month from date
    const dateObj = new Date(date);
    const month = dateObj.toLocaleString("default", { month: "short", year: "numeric" });

    submissions.push({
      id: inspectionId,
      property: property?.name || "Unknown Property",
      unit: unit?.name || (unitId || "N/A"),
      date,
      month,
      inspector: "Current User", // In a real app, this would come from auth
      status: "Completed",
    });

    localStorage.setItem("ftoSubmissions", JSON.stringify(submissions));

    navigate("/fto/inspections");
  };

  // --- Renderers ---

  const renderChecklist = () => {
    return (
      <div className="flex flex-col gap-1 border border-gray-200 rounded-lg bg-white p-4 max-h-[600px] overflow-y-auto">
        {currentChecklist.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            Please select a property to view the inspection checklist
          </div>
        ) : (
          currentChecklist.map((node) => (
            <div
              key={node.id}
              className="group flex items-start gap-2 py-2 px-2 rounded hover:bg-gray-50 transition-colors"
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
                <div
                  className={cn(
                    "text-sm whitespace-pre-wrap",
                    node.depth === 0 ? "font-bold text-gray-900" : "text-gray-700"
                  )}
                >
                  {node.text}
                </div>
              </div>

              {/* Camera Icon for Subsections (depth 1 only) */}
              {node.depth === 1 && !isReadOnly && (
                <button
                  onClick={() => {
                    // Find parent section
                    const nodeIndex = currentChecklist.findIndex(n => n.id === node.id);
                    let parentSectionIndex = nodeIndex - 1;
                    while (parentSectionIndex >= 0 && currentChecklist[parentSectionIndex].depth !== 0) {
                      parentSectionIndex--;
                    }
                    const parentSection = currentChecklist[parentSectionIndex];

                    setSelectedSectionId(parentSection.id);
                    setSelectedSubsectionId(node.id);
                    setSelectedSubsectionName(node.text);
                    photoInputRef.current?.click();
                  }}
                  className="ml-auto flex-shrink-0 p-2 text-[#013764] bg-white border border-[#013764] hover:bg-blue-50 rounded-lg transition-colors"
                  title="Add photos to this subsection"
                >
                  <Camera width={18} height={18} />
                </button>
              )}
            </div>
          ))
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
                {isReadOnly && (
                  <p className="text-sm text-gray-500 mt-1">Viewing completed inspection</p>
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

                <SelectField
                  label="Property"
                  required
                  options={PROPERTIES.map(p => ({ value: p.id, label: p.name }))}
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
              </div>
            </div>

            {/* 2. Inspection Checklist Card */}
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
              {!isReadOnly && (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg flex flex-col gap-3">
                  <SelectField
                    label="Associate with Section"
                    value={selectedSectionId}
                    onChange={(value) => setSelectedSectionId(typeof value === 'string' ? value : value[0] || '')}
                    options={checklistSections.map((s) => ({ value: s.id, label: s.text }))}
                    placeholder="Select a section..."
                  />

                  <div
                    className={cn(
                      "border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-colors",
                      !selectedSectionId ? "opacity-50 cursor-not-allowed bg-gray-100 border-gray-300 text-gray-400" : "border-gray-300 text-gray-400 hover:bg-white bg-gray-50"
                    )}
                    onClick={() => {
                      if (selectedSectionId) photoInputRef.current?.click();
                      else alert("Please select a section first");
                    }}
                  >
                    <PlusIcon width={24} height={24} />
                    <span className="mt-2 text-sm font-medium text-gray-600">Add Photos</span>
                    <span className="text-xs mt-1 text-gray-400">Supports JPG, PNG</span>
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
              )}

              {/* Photo Grid - 4 Column Layout Grouped by Section */}
              {photos.length > 0 ? (
                (() => {
                  // Group photos by section
                  const photosBySection: Record<string, typeof photos> = {};
                  photos.forEach(photo => {
                    const sectionId = photo.sectionNodeId || 'uncategorized';
                    if (!photosBySection[sectionId]) {
                      photosBySection[sectionId] = [];
                    }
                    photosBySection[sectionId].push(photo);
                  });

                  return Object.entries(photosBySection).map(([sectionId, sectionPhotos]) => {
                    const section = currentChecklist.find(n => n.id === sectionId);
                    return (
                      <div key={sectionId} className="mb-6">
                        <div className="font-semibold text-xs md:text-sm text-blue-700 bg-blue-50 px-3 py-2 rounded-md mb-4 text-center">
                          Section: {section?.text || "Uncategorized"}
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
                          {sectionPhotos.map((photo, index) => (
                            <div
                              key={photo.id}
                              className="border border-gray-200 rounded-lg bg-white overflow-hidden flex flex-col"
                            >
                              <div
                                className="flex items-center justify-center min-h-[100px] sm:min-h-[120px] md:min-h-[140px] bg-gray-100 cursor-pointer overflow-hidden"
                                onClick={() => handleOpenGallery(photos.indexOf(photo))}
                              >
                                <img src={photo.url} alt="Inspection" className="w-full h-full object-contain" />
                              </div>

                              <div className="p-1.5 sm:p-2 flex flex-col gap-1.5 sm:gap-2">
                                <div className="text-6px sm:text-7px md:text-8px text-gray-600 text-center">
                                  📷 {new Date(photo.uploadedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                                </div>
                                {isReadOnly && photo.comment && (
                                  <div className="text-7px sm:text-8px text-gray-700 p-1.5 sm:p-2 bg-gray-50 rounded border border-gray-200 line-clamp-2 sm:line-clamp-3">
                                    {photo.comment}
                                  </div>
                                )}
                                {!isReadOnly && (
                                  <div className="flex gap-1 sm:gap-2 justify-center pt-1">
                                    <input
                                      type="text"
                                      placeholder="Add comment..."
                                      value={photo.comment || ""}
                                      onChange={(e) => handleUpdatePhotoComment(photo.id, e.target.value)}
                                      className="w-full text-6px sm:text-7px px-1.5 sm:px-2 py-1 border border-gray-200 rounded placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                    />
                                    <button
                                      onClick={() => handleRemovePhoto(photo.id)}
                                      className="text-6px sm:text-7px text-red-600 hover:text-red-700 font-medium px-1"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  });
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
                <BlueButton onClick={handleSubmit}>
                  Submit Inspection
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
          }
        }}
        onSubmit={handlePhotoCommentSubmit}
        title="Add Photo"
        submitLabel="Upload Photo"
        initialFile={pendingPhotoFile}
      />

      <PhotoGalleryModal
        open={isGalleryOpen}
        onOpenChange={setIsGalleryOpen}
        photos={photos}
        currentPhotoIndex={currentPhotoIndex}
        onPrev={() => setCurrentPhotoIndex(prev => (prev === 0 ? photos.length - 1 : prev - 1))}
        onNext={() => setCurrentPhotoIndex(prev => (prev === photos.length - 1 ? 0 : prev + 1))}
        onUpdateComment={handleUpdatePhotoComment}
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
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  photos: InspectionPhoto[];
  currentPhotoIndex: number;
  onPrev: () => void;
  onNext: () => void;
  onUpdateComment: (id: string, comment: string) => void;
}) {
  if (!open || photos.length === 0) return null;

  const currentPhoto = photos[currentPhotoIndex];

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
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-gray-900">Review Photos</h2>
            <span className="text-sm text-gray-500">
              {currentPhotoIndex + 1} of {photos.length}
            </span>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
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

        {/* Comment Section */}
        <div className="bg-white px-6 py-4 border-t border-gray-200">
          <input
            type="text"
            value={currentPhoto.comment || ""}
            onChange={(e) => onUpdateComment(currentPhoto.id, e.target.value)}
            placeholder="Add a comment to this photo..."
            className="w-full text-sm px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
            autoFocus
          />
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
