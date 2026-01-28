import { useState, useEffect } from "react";
import type { UploadedFile } from "@/components/ui/attachment-uploader";
import {
  ModalTemplate,
  ModalButtons,
  ModalField,
} from "@/components/ui/ModalTemplate";
import {
  FileUploadField,
  TextAreaField,
  SelectField,
} from "@/components/forms";
import { FormLayout, FormSection } from "@/components/ui/form-layout";
import { X } from "lucide-react";

interface Subsection {
  id: string;
  text: string;
}

interface LineItem {
  id: string;
  text: string;
}

interface PhotoCommentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (file: File, comment: string, condition?: string) => Promise<void> | void;
  title?: string;
  submitLabel?: string;
  initialFile?: File | null;
  existingPhoto?: {
    url: string;
    comment?: string;
    condition?: string;
  } | null;
  subsectionName?: string;
  subsections?: Subsection[];
  currentSubsectionIndex?: number;
  onSubsectionChange?: (subsectionId: string, subsectionName: string) => void;
  lineItems?: LineItem[];
  currentLineItemIndex?: number;
  onLineItemChange?: (lineItemId: string, lineItemText: string) => void;
}

const PhotoCommentModal: React.FC<PhotoCommentModalProps> = ({
  open,
  onOpenChange,
  onSubmit,
  title = "Add Photo",
  submitLabel = "Upload Photo",
  initialFile = null,
  existingPhoto = null,
  subsectionName,
  subsections = [],
  currentSubsectionIndex = 0,
  onSubsectionChange,
  lineItems = [],
  currentLineItemIndex = 0,
  onLineItemChange,
}) => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [comment, setComment] = useState("");
  const [condition, setCondition] = useState("");
  const [validateForm, setValidateForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFileRef, setUploadedFileRef] = useState<File | null>(null); // Track the file that was uploaded
  const [isPhotoViewerOpen, setIsPhotoViewerOpen] = useState(false);
  const [viewingPhotoUrl, setViewingPhotoUrl] = useState<string | null>(null);

  const CONDITION_OPTIONS = [
    { value: "", label: "Select condition (optional)" },
    { value: "good", label: "Good" },
    { value: "fair", label: "Fair" },
    { value: "poor", label: "Poor" },
  ];

  // Determine which navigation level is active: line items (depth 2) or subsections (depth 1)
  const hasLineItemNavigation = lineItems && lineItems.length > 0;
  const hasSubsectionNavigation = !hasLineItemNavigation && subsections && subsections.length > 0;

  // Line item navigation
  const canGoNextLineItem = hasLineItemNavigation && currentLineItemIndex < lineItems.length - 1;
  const canGoPrevLineItem = hasLineItemNavigation && currentLineItemIndex > 0;

  // Subsection navigation (fallback if no line items)
  const canGoNextSubsection = hasSubsectionNavigation && currentSubsectionIndex < subsections.length - 1;
  const canGoPrevSubsection = hasSubsectionNavigation && currentSubsectionIndex > 0;

  // Get current item text for display
  const currentItemText = hasLineItemNavigation && lineItems.length > 0
    ? lineItems[currentLineItemIndex]?.text
    : subsectionName;

  // Use just the item text as the title, not "Add Photo - item text"
  const modalTitle = currentItemText || title;

  // Get navigation counter and button state
  const currentIndex = hasLineItemNavigation ? currentLineItemIndex : currentSubsectionIndex;
  const totalItems = hasLineItemNavigation ? lineItems.length : subsections.length;
  const canGoNext = hasLineItemNavigation ? canGoNextLineItem : canGoNextSubsection;
  const canGoPrev = hasLineItemNavigation ? canGoPrevLineItem : canGoPrevSubsection;
  const hasNavigation = hasLineItemNavigation || hasSubsectionNavigation;

  useEffect(() => {
    if (open) {
      // Reset state first
      setValidateForm(false);
      setUploadedFileRef(null); // Reset uploaded file reference when modal opens

      // If there's an existing photo, load it
      if (existingPhoto) {
        const existingFile: UploadedFile = {
          id: `existing_${Date.now()}`,
          name: existingPhoto.url.split('/').pop() || "photo.jpg",
          file: null, // No file object for existing photos
          url: existingPhoto.url,
          size: 0,
          type: "image/jpeg",
        };
        setUploadedFiles([existingFile]);
        setComment(existingPhoto.comment || "");
        setCondition(existingPhoto.condition || "");
      } else if (initialFile) {
        // If an initial file is provided, pre-populate the upload field
        setTimeout(() => {
          const objectUrl = URL.createObjectURL(initialFile);
          const uploadedFile: UploadedFile = {
            id: `file_${Date.now()}`,
            name: initialFile.name,
            file: initialFile,
            url: objectUrl,
            size: initialFile.size,
            type: initialFile.type,
          };
          setUploadedFiles([uploadedFile]);
        }, 0);
        setComment("");
        setCondition("");
      } else {
        // No existing photo and no initial file - reset everything
        setUploadedFiles([]);
        setComment("");
        setCondition("");
      }
    }
  }, [open, initialFile, existingPhoto]);

  const handleSubmit = async () => {
    if (uploadedFiles.length === 0) {
      setValidateForm(true);
      return;
    }

    const file = uploadedFiles[0].file;
    // If it's an existing photo (no file object), just close the modal
    if (!file && existingPhoto) {
      // This is an existing photo - just close the modal
      // The photo is already saved, we're just viewing it
      onOpenChange(false);
      return;
    }

    if (!file) {
      setValidateForm(true);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(file, comment, condition || undefined);
      
      // Track the uploaded file to prevent re-uploading the same file
      setUploadedFileRef(file);
      
      // If navigation is available, keep the photo visible but clear the comment
      // This allows user to see the uploaded photo and navigate to next item
      if (hasNavigation) {
        setComment("");
        setCondition("");
        setValidateForm(false);
        // Keep uploadedFiles so photo stays visible
      } else {
        // No navigation, reset everything and close modal
        resetForm();
        onOpenChange(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    resetForm();
    onOpenChange(false);
  };

  const resetForm = () => {
    setUploadedFiles([]);
    setComment("");
    setCondition("");
    setValidateForm(false);
    setUploadedFileRef(null); // Clear uploaded file reference when resetting
  };

  const handleNext = () => {
    if (hasLineItemNavigation && canGoNextLineItem && onLineItemChange) {
      const nextLineItem = lineItems[currentLineItemIndex + 1];
      onLineItemChange(nextLineItem.id, nextLineItem.text);
      resetForm(); // Clear photo when navigating to next item
    } else if (hasSubsectionNavigation && canGoNextSubsection && onSubsectionChange) {
      const nextSubsection = subsections[currentSubsectionIndex + 1];
      onSubsectionChange(nextSubsection.id, nextSubsection.text);
      resetForm(); // Clear photo when navigating to next item
    }
  };

  const handlePrev = () => {
    if (hasLineItemNavigation && canGoPrevLineItem && onLineItemChange) {
      const prevLineItem = lineItems[currentLineItemIndex - 1];
      onLineItemChange(prevLineItem.id, prevLineItem.text);
      resetForm(); // Clear photo when navigating to previous item
    } else if (hasSubsectionNavigation && canGoPrevSubsection && onSubsectionChange) {
      const prevSubsection = subsections[currentSubsectionIndex - 1];
      onSubsectionChange(prevSubsection.id, prevSubsection.text);
      resetForm(); // Clear photo when navigating to previous item
    }
  };

  return (
    <ModalTemplate
      open={open}
      onOpenChange={(openState) => {
        if (!openState) {
          resetForm();
        }
        onOpenChange(openState);
      }}
      title={modalTitle}
      size="sm"
      onClose={resetForm}
      footer={
        hasNavigation ? (
          <div className="flex items-center justify-between gap-2 w-full">
            <button
              type="button"
              onClick={handlePrev}
              disabled={!canGoPrev}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              ← Prev
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={
                isSubmitting || 
                (uploadedFiles.length === 0 && !existingPhoto) ||
                (uploadedFileRef !== null && uploadedFiles[0]?.file === uploadedFileRef && !existingPhoto)
              }
              className="px-6 py-2 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {existingPhoto && !uploadedFiles[0]?.file ? "Close" : submitLabel}
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={!canGoNext}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next →
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={
                isSubmitting || 
                (uploadedFiles.length === 0 && !existingPhoto) ||
                (uploadedFileRef !== null && uploadedFiles[0]?.file === uploadedFileRef && !existingPhoto)
              }
              className="w-full px-6 py-2 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {existingPhoto && !uploadedFiles[0]?.file ? "Close" : submitLabel}
            </button>
          </div>
        )
      }
    >
      <div style={{ minHeight: "400px", display: "flex", flexDirection: "column" }}>
        <FormLayout>
          <FormSection showDivider={false}>
            <ModalField spacing="tight" label="">
              <FileUploadField
                label="Photo"
                required={true}
                description=""
                validate={validateForm}
                files={uploadedFiles}
                onFilesAdded={(newFiles) => {
                  if (newFiles.length > 0) {
                    setUploadedFiles([newFiles[0]]);
                    setValidateForm(false);
                    // Clear uploaded file reference when a new file is selected
                    // This re-enables the upload button
                    setUploadedFileRef(null);
                  }
                }}
                onFileRemoved={(fileId) => {
                  setUploadedFiles(
                    uploadedFiles.filter((f) => f.id !== fileId),
                  );
                  // Clear uploaded file reference when file is removed
                  setUploadedFileRef(null);
                }}
                onViewFile={(file) => {
                  // Get the URL from the file - either from url property or create object URL
                  let photoUrl: string | null = null;
                  if (file.url) {
                    photoUrl = file.url;
                  } else if (file.file) {
                    photoUrl = URL.createObjectURL(file.file);
                  }
                  if (photoUrl) {
                    setViewingPhotoUrl(photoUrl);
                    setIsPhotoViewerOpen(true);
                  }
                }}
                accept=".jpg,.jpeg,.png,.gif,.webp"
                maxFiles={1}
                maxSize={10 * 1024 * 1024}
                variant="single"
              />
            </ModalField>

            <SelectField
              label="Condition"
              value={condition}
              onChange={(value) => setCondition(value as string)}
              options={CONDITION_OPTIONS}
              placeholder="Select condition (optional)"
            />

            <TextAreaField
              label="Comment (Optional)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a comment to this photo..."
              rows={3}
            />
          </FormSection>
        </FormLayout>
      </div>

      {/* Photo Viewer Modal */}
      {isPhotoViewerOpen && viewingPhotoUrl && (
        <div
          className="fixed inset-0 z-[100] bg-black bg-opacity-75 flex items-center justify-center p-4"
          onClick={() => {
            setIsPhotoViewerOpen(false);
            setViewingPhotoUrl(null);
          }}
        >
          <div
            className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Photo Viewer</h2>
              <button
                onClick={() => {
                  setIsPhotoViewerOpen(false);
                  setViewingPhotoUrl(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close"
              >
                <X width={24} height={24} />
              </button>
            </div>

            {/* Image Container */}
            <div className="flex-1 flex items-center justify-center bg-gray-50 overflow-hidden p-4">
              <img
                src={viewingPhotoUrl}
                alt="Photo"
                className="max-h-full max-w-full object-contain shadow-sm"
              />
            </div>
          </div>
        </div>
      )}
    </ModalTemplate>
  );
};

export default PhotoCommentModal;
