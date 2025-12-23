import { useState, useCallback } from "react";

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
  const [state, setState] = useState<PdfViewerState>({
    isOpen: false,
  });

  const openPdf = useCallback((url: string, title?: string) => {
    setState({
      isOpen: true,
      url,
      title,
    });
  }, []);

  const closePdf = useCallback(() => {
    setState({
      isOpen: false,
      url: undefined,
      title: undefined,
    });
  }, []);

  return {
    isOpen: state.isOpen,
    url: state.url,
    title: state.title,
    openPdf,
    closePdf,
  };
}
