import React, { useEffect, useMemo } from "react";

import { Dialog, DialogContent, DialogFooter, DialogTitle } from "@/components/ui/dialog";

type PdfViewerModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  url?: string;
};

const isProbablyPdfUrl = (url: string) => {
  const clean = url.split("#")[0].split("?")[0];
  return clean.toLowerCase().endsWith(".pdf") || url.startsWith("blob:");
};

export default function PdfViewerModal({
  open,
  onOpenChange,
  title,
  url,
}: PdfViewerModalProps) {
  const safeUrl = useMemo(() => {
    if (!url) return undefined;
    const u = url.trim();
    return u ? u : undefined;
  }, [url]);

  useEffect(() => {
    if (!open) return;
    if (!safeUrl) return;
    // Nothing else to do; kept for future enhancements.
  }, [open, safeUrl]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[900px] p-0 gap-0">
        <div className="px-6 py-4 border-b border-[#E5E5E5]">
          <DialogTitle className="text-[#303030] font-semibold text-xl leading-[26px]">
            {title}
          </DialogTitle>
        </div>

        <div className="px-6 py-4">
          {safeUrl ? (
            <div className="w-full h-[70vh] rounded-lg overflow-hidden border border-[#E5E5E5] bg-white">
              <iframe
                title={title}
                src={
                  isProbablyPdfUrl(safeUrl)
                    ? `${safeUrl}#view=FitH&toolbar=1&navpanes=0`
                    : safeUrl
                }
                className="w-full h-full"
              />
            </div>
          ) : (
            <div className="w-full rounded-lg border border-[#E5E5E5] bg-[#F7F7F7] p-4 text-sm text-[#71717A]">
              No preview available for this file.
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t border-[#E5E5E5] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 border border-[#DADADA] rounded-lg text-[#303030] font-medium hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
          {safeUrl ? (
            <a
              href={safeUrl}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 bg-[#013764] text-white rounded-lg font-medium hover:bg-[#003a73] transition-colors"
            >
              Open in new tab
            </a>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
