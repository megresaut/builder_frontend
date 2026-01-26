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
} from "@/components/forms";
import { FormLayout, FormSection } from "@/components/ui/form-layout";

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
  onSubmit: (file: File, comment: string) => Promise<void> | void;
  title?: string;
  submitLabel?: string;
  initialFile?: File | null;
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
  const [validateForm, setValidateForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const modalTitle = currentItemText ? `${title} - ${currentItemText}` : title;

  // Get navigation counter and button state
  const currentIndex = hasLineItemNavigation ? currentLineItemIndex : currentSubsectionIndex;
  const totalItems = hasLineItemNavigation ? lineItems.length : subsections.length;
  const canGoNext = hasLineItemNavigation ? canGoNextLineItem : canGoNextSubsection;
  const canGoPrev = hasLineItemNavigation ? canGoPrevLineItem : canGoPrevSubsection;
  const hasNavigation = hasLineItemNavigation || hasSubsectionNavigation;

  useEffect(() => {
    if (open) {
      // Reset state first
      setUploadedFiles([]);
      setComment("");
      setValidateForm(false);

      // If an initial file is provided, pre-populate the upload field
      if (initialFile) {
        setTimeout(() => {
          const uploadedFile: UploadedFile = {
            id: `file_${Date.now()}`,
            name: initialFile.name,
            file: initialFile,
            url: URL.createObjectURL(initialFile),
            size: initialFile.size,
            type: initialFile.type,
          };
          setUploadedFiles([uploadedFile]);
        }, 0);
      }
    }
  }, [open, initialFile]);

  const handleSubmit = async () => {
    if (uploadedFiles.length === 0) {
      setValidateForm(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const file = uploadedFiles[0].file;
      if (file) {
        await onSubmit(file, comment);
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
    setValidateForm(false);
  };

  const handleNext = () => {
    if (hasLineItemNavigation && canGoNextLineItem && onLineItemChange) {
      const nextLineItem = lineItems[currentLineItemIndex + 1];
      onLineItemChange(nextLineItem.id, nextLineItem.text);
      resetForm();
    } else if (hasSubsectionNavigation && canGoNextSubsection && onSubsectionChange) {
      const nextSubsection = subsections[currentSubsectionIndex + 1];
      onSubsectionChange(nextSubsection.id, nextSubsection.text);
      resetForm();
    }
  };

  const handlePrev = () => {
    if (hasLineItemNavigation && canGoPrevLineItem && onLineItemChange) {
      const prevLineItem = lineItems[currentLineItemIndex - 1];
      onLineItemChange(prevLineItem.id, prevLineItem.text);
      resetForm();
    } else if (hasSubsectionNavigation && canGoPrevSubsection && onSubsectionChange) {
      const prevSubsection = subsections[currentSubsectionIndex - 1];
      onSubsectionChange(prevSubsection.id, prevSubsection.text);
      resetForm();
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
        <div className="flex flex-col gap-3">
          {hasNavigation && (
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={handlePrev}
                disabled={!canGoPrev}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                ← Prev
              </button>
              <span className="flex items-center px-2 text-sm text-gray-600 whitespace-nowrap">
                {currentIndex + 1} of {totalItems}
              </span>
              <button
                type="button"
                onClick={handleNext}
                disabled={!canGoNext}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next →
              </button>
            </div>
          )}
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={uploadedFiles.length === 0 || isSubmitting}
              className="px-6 py-2 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitLabel}
            </button>
          </div>
        </div>
      }
    >
      <FormLayout>
        <FormSection showDivider={false}>
          <ModalField spacing="tight">
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
                }
              }}
              onFileRemoved={(fileId) => {
                setUploadedFiles(
                  uploadedFiles.filter((f) => f.id !== fileId),
                );
              }}
              accept=".jpg,.jpeg,.png,.gif,.webp"
              maxFiles={1}
              maxSize={10 * 1024 * 1024}
              variant="single"
            />
          </ModalField>

          {/* Photo Preview */}
          {uploadedFiles.length > 0 && uploadedFiles[0].url && (
            <ModalField spacing="tight" label="">
              <div className="w-full h-96 bg-gray-100 border border-gray-200 rounded-lg overflow-hidden cursor-pointer group flex items-center justify-center">
                <img
                  src={uploadedFiles[0].url}
                  alt="Preview"
                  className="w-full h-full object-contain group-hover:opacity-90 transition-opacity"
                />
              </div>
            </ModalField>
          )}

          <TextAreaField
            label="Comment (Optional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add a comment to this photo..."
            rows={3}
          />
        </FormSection>
      </FormLayout>
    </ModalTemplate>
  );
};

export default PhotoCommentModal;
