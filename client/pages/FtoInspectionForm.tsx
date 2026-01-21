import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { renderAsync } from "docx-preview";
import PageTemplate from "@/layout/PageTemplate";
import BlueButton from "@/components/BlueButton";
import {
  CloseIcon,
  PlusIcon,
  DocumentIcon,
  DeleteIcon,
  ChevronDownIcon,
} from "@/components/icons";
import { SelectField, DateField } from "@/components/forms";
import { PROPERTIES } from "@/data/fto/properties";
import { ModalTemplate, ModalButtons } from "@/components/ui/ModalTemplate";
import PhotoCommentModal from "@/components/PhotoCommentModal";
import { cn } from "@/lib/utils";
import {
  ChecklistNode,
  MOCK_CHECKLIST_NODES,
} from "@/data/inspection-checklist";

// --- Types ---

interface InspectionPhoto {
  id: string;
  url: string;
  uploadedAt: string;
  comment?: string;
  sectionNodeId?: string;
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

  // UI State
  const [isPhotoCommentModalOpen, setIsPhotoCommentModalOpen] = useState(false);
  const [pendingPhotoFile, setPendingPhotoFile] = useState<File | null>(null);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [validationErrors, setValidationErrors] = useState<{
    date?: string;
    property?: string;
    photos?: string;
  }>({});

  // Refs
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Derived Data
  const checklistSections = useMemo(() => MOCK_CHECKLIST_NODES.filter((n) => n.depth === 0), []);

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
        {MOCK_CHECKLIST_NODES.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            No checklist items available
          </div>
        ) : (
          MOCK_CHECKLIST_NODES.map((node) => (
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
            <div className="rounded-xl bg-white border border-[#E5E5E5] shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-6 flex flex-col gap-6">
              <h2 className="text-lg font-medium text-gray-900">Inspection Checklist</h2>
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
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase">Associate with Section</label>
                    <div className="relative">
                      <select
                        value={selectedSectionId}
                        onChange={(e) => setSelectedSectionId(e.target.value)}
                        className="w-full pl-3 pr-8 py-2 bg-white border border-gray-300 rounded-md text-sm appearance-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      >
                        <option value="" disabled>Select a section...</option>
                        {checklistSections.map((s) => (
                          <option key={s.id} value={s.id}>{s.text}</option>
                        ))}
                      </select>
                      <ChevronDownIcon width={16} height={16} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500" />
                    </div>
                  </div>

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

              {/* Photo Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {photos.map((photo, index) => (
                  <div key={photo.id} className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm flex flex-col">
                    <div 
                      className="aspect-[4/3] bg-gray-100 cursor-pointer relative group"
                      onClick={() => handleOpenGallery(index)}
                    >
                      <img src={photo.url} alt="Inspection" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-opacity" />
                    </div>
                    
                    <div className="p-3 flex flex-col gap-2">
                      <input
                        type="text"
                        placeholder="Add a comment..."
                        value={photo.comment || ""}
                        onChange={(e) => handleUpdatePhotoComment(photo.id, e.target.value)}
                        className="w-full text-xs p-2 border border-gray-200 rounded placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
                        disabled={isReadOnly}
                      />
                      {!isReadOnly && (
                        <div className="flex justify-end">
                          <button
                            onClick={() => handleRemovePhoto(photo.id)}
                            className="text-xs text-red-600 hover:text-red-700 font-medium"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {photos.length === 0 && (
                <div className="text-center text-sm text-gray-400 italic">
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

      <UploadDocxModal
        open={isUploadModalOpen}
        onOpenChange={setIsUploadModalOpen}
        onUpload={handleUploadDocx}
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
        </p>

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 flex flex-col items-center justify-center text-center text-gray-400">
          <DocumentIcon width={32} height={32} className="mb-3" />

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
          <p className="text-xs text-gray-400 mt-2">Supported: .docx files only</p>
        </div>
      </div>
    </ModalTemplate>
  );
}
