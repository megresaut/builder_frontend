import React, { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { renderAsync } from "docx-preview";
import PageTemplate from "@/layout/PageTemplate";
import SubPageHeaderV2 from "@/components/SubPageHeaderV2";
import SectionCard from "@/components/SectionCard";
import { ModalTemplate, ModalButtons } from "@/components/ui/ModalTemplate";
import {
  ArrowBackIcon,
  PlusIcon,
  DocumentIcon,
  DeleteIcon,
  ApproveIcon,
} from "@/components/icons";
import { cn } from "@/lib/utils";

// --- Types ---

interface InspectionPhoto {
  id: string;
  url: string;
  uploadedAt: string; // ISO string
  capturedAt?: string;
}

interface RequirementsDoc {
  hasDoc: boolean;
  fileName?: string;
  lastUpdated?: string;
  blobUrl?: string; // URL to the uploaded docx file
  arrayBuffer?: ArrayBuffer; // Raw file data for rendering
}

// --- Mock Data ---

const MOCK_PHOTOS: InspectionPhoto[] = [
  {
    id: "p1",
    url: "https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/d5d01db2db718e32f4e620e7b1fc6ea705e115b1?placeholderIfAbsent=true",
    uploadedAt: new Date().toISOString(),
  },
];

// --- Components ---

export default function InspectionDetail() {
  const navigate = useNavigate();
  const { propertyId, inspectionId } = useParams();

  // --- State ---
  const [requirements, setRequirements] = useState<RequirementsDoc>({
    hasDoc: false,
  });

  const [photos, setPhotos] = useState<InspectionPhoto[]>(MOCK_PHOTOS);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isRenderingDoc, setIsRenderingDoc] = useState(false);

  // Refs
  const photoInputRef = useRef<HTMLInputElement>(null);
  const docContainerRef = useRef<HTMLDivElement>(null);

  // --- Effects ---
  useEffect(() => {
    // When requirements.arrayBuffer changes, render the document
    if (requirements.arrayBuffer && docContainerRef.current) {
      setIsRenderingDoc(true);
      docContainerRef.current.innerHTML = ""; // Clear previous content
      renderAsync(requirements.arrayBuffer, docContainerRef.current)
        .then(() => setIsRenderingDoc(false))
        .catch((err) => {
          console.error("Error rendering docx", err);
          setIsRenderingDoc(false);
        });
    }
  }, [requirements.arrayBuffer]);

  // --- Handlers ---

  const handleBack = () => {
    navigate(`/property/${propertyId}/Inspections`);
  };

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
            Upload the property's Word inspection document (.docx). It will be displayed in the app.
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
      <div className="flex flex-col h-full">
        {isRenderingDoc && (
          <div className="flex items-center justify-center py-8">
            <span className="text-sm text-gray-500">Loading document...</span>
          </div>
        )}
        <div
          ref={docContainerRef}
          className={cn(
            "flex-1 overflow-auto prose prose-sm max-w-none px-4 py-4",
            "[&_.docx-wrapper]:bg-white [&_.docx-wrapper]:border-0"
          )}
        />
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
                    22 Indian Chase Dr • {requirements.lastUpdated || "No document"}
                  </p>
                </div>
              </div>
            </div>
          }
          rightContent={
            <div className="flex items-center gap-3">
              <button 
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 bg-white transition-colors"
                onClick={() => photoInputRef.current?.click()}
              >
                Upload Photos
              </button>
              <button 
                className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <ApproveIcon width={16} height={16} />
                <span>Mark Complete</span>
              </button>
            </div>
          }
        />

        {/* Content Layout */}
        <div className="flex flex-col lg:flex-row gap-6 w-full">
          
          {/* LEFT COLUMN: Requirements Document */}
          <div className="flex-1 min-w-0">
            <SectionCard 
              title="Inspection Requirements" 
              className="h-full"
              actions={
                requirements.hasDoc && (
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

          {/* RIGHT COLUMN: Photos */}
          <div className="w-full lg:w-[400px] flex-shrink-0">
            <SectionCard title="Inspection Photos">
              <div className="flex flex-col gap-4">
                
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
                          </div>

                          <div className="flex justify-end gap-2 mt-1">
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
