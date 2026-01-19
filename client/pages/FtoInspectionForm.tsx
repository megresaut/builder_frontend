import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { renderAsync } from "docx-preview";
import PageTemplate from "@/layout/PageTemplate";
import {
  CloseIcon,
  PlusIcon,
  DocumentIcon,
  DeleteIcon,
} from "@/components/icons";
import { SelectField, DateField } from "@/components/forms";
import { PROPERTIES } from "@/data/fto/properties";
import { ModalTemplate, ModalButtons } from "@/components/ui/ModalTemplate";
import { cn } from "@/lib/utils";

// --- Types ---

interface InspectionPhoto {
  id: string;
  url: string;
  uploadedAt: string;
  comment?: string;
}

interface RequirementsDoc {
  hasDoc: boolean;
  fileName?: string;
  lastUpdated?: string;
  blobUrl?: string;
  arrayBuffer?: ArrayBuffer;
}

// --- Components ---

export default function FtoInspectionForm() {
  const navigate = useNavigate();

  // Form State
  const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const [unitId, setUnitId] = useState<string | null>(null);

  // Inspection State
  const [requirements, setRequirements] = useState<RequirementsDoc>({
    hasDoc: false,
  });
  const [photos, setPhotos] = useState<InspectionPhoto[]>([]);
  
  // UI State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isRenderingDoc, setIsRenderingDoc] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  // Refs
  const photoInputRef = useRef<HTMLInputElement>(null);
  const docContainerRef = useRef<HTMLDivElement>(null);

  // --- Effects ---

  // Render doc when requirements change
  useEffect(() => {
    if (requirements.arrayBuffer && docContainerRef.current) {
      setIsRenderingDoc(true);
      docContainerRef.current.innerHTML = "";
      renderAsync(requirements.arrayBuffer, docContainerRef.current)
        .then(() => setIsRenderingDoc(false))
        .catch((err) => {
          console.error("Error rendering docx", err);
          setIsRenderingDoc(false);
        });
    }
  }, [requirements.arrayBuffer]);

  // Simulate fetching doc when property changes (Mock)
  useEffect(() => {
    if (propertyId) {
      // In a real app, we would fetch the doc for this property here
      // For now, we'll reset requirements or keep them if uploaded manually
    }
  }, [propertyId]);

  // --- Handlers ---

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newPhotos: InspectionPhoto[] = Array.from(e.target.files).map((file) => ({
        id: `new_${Date.now()}_${Math.random()}`,
        url: URL.createObjectURL(file),
        uploadedAt: new Date().toISOString(),
      }));
      setPhotos((prev) => [...prev, ...newPhotos]);
      
      if (photoInputRef.current) photoInputRef.current.value = "";
    }
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

  const handleUploadDocx = async (file: File) => {
    if (!file.name.endsWith(".docx")) {
      console.error("Only .docx files are supported");
      return;
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      setRequirements({
        hasDoc: true,
        fileName: file.name,
        lastUpdated: "Just now",
        blobUrl: URL.createObjectURL(file),
        arrayBuffer,
      });
      setIsUploadModalOpen(false);
    } catch (err) {
      console.error("Error reading file", err);
    }
  };

  const getPropertyUnits = (propId: string | null) => {
    if (!propId) return [];
    const property = PROPERTIES.find((p) => p.id === propId);
    return property?.units || [];
  };

  const handleSubmit = () => {
    // Mock submit
    navigate("/fto/inspections");
  };

  // --- Renderers ---

  const renderRequirements = () => {
    if (!propertyId) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <p className="text-gray-500">Please select a property to view requirements</p>
        </div>
      );
    }

    if (!requirements.hasDoc) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <DocumentIcon width={32} height={32} color="#9ca3af" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No requirements found</h3>
          <p className="text-sm text-gray-500 max-w-sm mb-6">
            There are no inspection requirements loaded for this property.
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

    return (
      <div className="flex flex-col h-[600px] border border-gray-200 rounded-lg overflow-hidden">
        {isRenderingDoc && (
          <div className="flex items-center justify-center py-8">
            <span className="text-sm text-gray-500">Loading document...</span>
          </div>
        )}
        <div
          ref={docContainerRef}
          className={cn(
            "flex-1 overflow-auto prose prose-sm max-w-none px-8 py-8 bg-white",
            "[&_.docx-wrapper]:bg-white [&_.docx-wrapper]:border-0"
          )}
        />
      </div>
    );
  };

  return (
    <PageTemplate className="!px-4 !pt-6 !pb-8 max-w-none !min-w-0 lg:!px-6 lg:!py-9">
      <div className="flex flex-col items-center w-full">
        <div className="w-full lg:max-w-[800px] flex flex-col gap-7">
          
          {/* Title and Header */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h1 className="text-[28px] font-semibold text-[#303030] leading-[26px]" style={{ fontFamily: "Geist, sans-serif" }}>
                Property Inspection
              </h1>
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
                />
                
                <div className="hidden md:block" /> {/* Spacer */}

                <SelectField
                  label="Property"
                  required
                  options={PROPERTIES.map(p => ({ value: p.id, label: p.name }))}
                  value={propertyId || ""}
                  onChange={setPropertyId}
                  placeholder="Select Property"
                />

                <SelectField
                  label="Unit"
                  options={getPropertyUnits(propertyId).map(u => ({ value: u.id, label: u.name }))}
                  value={unitId || ""}
                  onChange={setUnitId}
                  placeholder="Select Unit"
                  disabled={!propertyId}
                />
              </div>
            </div>

            {/* 2. Requirements Card */}
            <div className="rounded-xl bg-white border border-[#E5E5E5] shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-6 flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900">Inspection Requirements</h2>
                {requirements.hasDoc && (
                  <button
                    onClick={() => setIsUploadModalOpen(true)}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Replace doc
                  </button>
                )}
              </div>
              
              {renderRequirements()}
            </div>

            {/* 3. Photos Card */}
            <div className="rounded-xl bg-white border border-[#E5E5E5] shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-6 flex flex-col gap-6">
              <h2 className="text-lg font-medium text-gray-900">Photos</h2>

              {/* Upload Area */}
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
                        className="w-full text-xs p-2 border border-gray-200 rounded placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                      <div className="flex justify-end">
                        <button
                          onClick={() => handleRemovePhoto(photo.id)}
                          className="text-xs text-red-600 hover:text-red-700 font-medium"
                        >
                          Remove
                        </button>
                      </div>
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
            <button
              onClick={() => navigate("/fto/inspections")}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 font-medium text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 rounded-lg bg-[#013764] text-white hover:bg-[#012d53] font-medium text-sm transition-colors shadow-sm"
            >
              Submit Inspection
            </button>
          </div>

        </div>
      </div>

      {/* Modals */}
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
        className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col"
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
        <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onPrev}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-white transition-colors disabled:opacity-50"
            disabled={photos.length === 1}
          >
            ← Previous
          </button>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              {new Date(currentPhoto.uploadedAt).toLocaleString()}
            </span>
          </div>

          <button
            onClick={onNext}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-white transition-colors disabled:opacity-50"
            disabled={photos.length === 1}
          >
            Next →
          </button>
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
          <p className="text-xs text-gray-400 mt-2">Supported: .docx files only</p>
        </div>
      </div>
    </ModalTemplate>
  );
}
