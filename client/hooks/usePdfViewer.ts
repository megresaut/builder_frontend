import { useState, useCallback, useRef, useEffect } from "react";

export interface PdfViewerState {
  isOpen: boolean;
  url?: string;
  title?: string;
}

/**
 * usePdfViewer - Hook for managing PDF viewer modal state
 *
 * Provides state management for opening/closing the PDF viewer modal
 * and tracking the current file being viewed.
 * Properly manages blob URL lifecycle to prevent garbage collection.
 *
 * @returns Object with:
 *   - isOpen: Whether the modal is currently open
 *   - url: The URL/blob of the current PDF being viewed
 *   - title: The title/filename of the current PDF
 *   - openPdf: Function to open a PDF (url, title)
 *   - closePdf: Function to close the modal
 *
 * Example:
 * ```tsx
 * const { isOpen, url, title, openPdf, closePdf } = usePdfViewer();
 *
 * return (
 *   <>
 *     <AttachmentUploader
 *       files={files}
 *       onViewFile={(file) => openPdf(URL.createObjectURL(file.file!), file.name)}
 *     />
 *     <PdfViewerModal
 *       open={isOpen}
 *       onOpenChange={closePdf}
 *       url={url}
 *       title={title || "Document"}
 *     />
 *   </>
 * );
 * ```
 */
export function usePdfViewer() {
  // All refs before state/callbacks to avoid hook order issues
  const blobUrlRef = useRef<string | null>(null);

  const [state, setState] = useState<PdfViewerState>({
    isOpen: false,
  });

  const openPdf = useCallback((url: string, title?: string) => {
    // Revoke previous blob URL if it exists
    if (blobUrlRef.current && blobUrlRef.current.startsWith("blob:")) {
      URL.revokeObjectURL(blobUrlRef.current);
    }

    // Store the URL for lifecycle management
    if (url.startsWith("blob:")) {
      blobUrlRef.current = url;
    }

    setState({
      isOpen: true,
      url,
      title,
    });
  }, []);

  const closePdf = useCallback(() => {
    // Revoke blob URL on close to free memory
    if (blobUrlRef.current && blobUrlRef.current.startsWith("blob:")) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }

    setState({
      isOpen: false,
      url: undefined,
      title: undefined,
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (blobUrlRef.current && blobUrlRef.current.startsWith("blob:")) {
        URL.revokeObjectURL(blobUrlRef.current);
      }
    };
  }, []);

  return {
    isOpen: state.isOpen,
    url: state.url,
    title: state.title,
    openPdf,
    closePdf,
  };
}
