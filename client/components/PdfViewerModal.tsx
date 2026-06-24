import React from "react";
import { ModalTemplate } from "@/components/ui/ModalTemplate";
import { useAuthBlobUrl } from "@/hooks/useAuthBlobUrl";

type PdfViewerModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  url?: string;
  /** Optional extra content rendered in the footer before Close */
  extraFooter?: React.ReactNode;
};

const BROWSER_PREVIEWABLE = new Set([
  "pdf",
  "jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "ico",
  "txt", "csv", "html", "htm",
]);

function getFileExtension(title: string, url?: string): string {
  // Prefer the display name (title) since it carries the real extension
  const fromTitle = (title ?? "").split(".").pop()?.toLowerCase() ?? "";
  if (fromTitle) return fromTitle;
  const clean = (url ?? "").split("?")[0].split("#")[0];
  return clean.split(".").pop()?.toLowerCase() ?? "";
}

const isProbablyPdf = (url: string) => {
  const clean = url.split("#")[0].split("?")[0];
  return clean.toLowerCase().endsWith(".pdf") || url.startsWith("blob:");
};

export default function PdfViewerModal({
  open,
  onOpenChange,
  title,
  url,
  extraFooter,
}: PdfViewerModalProps) {
  const { blobUrl, loading, error } = useAuthBlobUrl(open ? url : undefined);
  const ext = getFileExtension(title, url);
  const canPreview = BROWSER_PREVIEWABLE.has(ext);

  return (
    <ModalTemplate
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      size="lg"
      footer={
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {extraFooter}
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            style={{
              borderRadius: "8px",
              backgroundColor: "rgba(251, 251, 251, 1)",
              boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.03)",
              borderColor: "rgba(218, 218, 218, 1)",
              borderStyle: "solid",
              borderWidth: "1px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              paddingLeft: "12px",
              paddingRight: "12px",
              paddingTop: "8px",
              paddingBottom: "8px",
              minHeight: "36px",
              color: "rgba(48, 48, 48, 1)",
              fontWeight: 400,
              letterSpacing: "-0.32px",
              lineHeight: 1.4,
              justifyContent: "center",
              cursor: "pointer",
              fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif",
              fontSize: "16px",
              whiteSpace: "nowrap",
            }}
          >
            Close
          </button>
          {blobUrl ? (
            <a
              href={blobUrl}
              download={title || "file"}
              style={{
                borderRadius: "8px",
                backgroundColor: "var(--color-button-primary)",
                border: "1px solid rgba(255, 255, 255, 1)",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                paddingLeft: "12px",
                paddingRight: "12px",
                paddingTop: "8px",
                paddingBottom: "8px",
                minHeight: "36px",
                color: "rgba(255, 255, 255, 1)",
                fontWeight: 500,
                letterSpacing: "-0.32px",
                lineHeight: 1.4,
                justifyContent: "center",
                cursor: "pointer",
                fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                fontSize: "16px",
                whiteSpace: "nowrap",
                boxShadow: "0px 0px 0px 1px var(--color-button-primary-shadow)",
                textDecoration: "none",
                transition: "background-color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--color-button-primary-hover)")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--color-button-primary)")}
            >
              Download
            </a>
          ) : null}
        </div>
      }
    >
      {loading ? (
        <div style={{
          width: "100%",
          height: "70vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "8px",
          border: "1px solid #E5E5E5",
          backgroundColor: "#F7F7F7",
          fontSize: "14px",
          color: "#71717A",
        }}>
          Loading...
        </div>
      ) : error ? (
        <div style={{
          width: "100%",
          borderRadius: "8px",
          border: "1px solid #E5E5E5",
          backgroundColor: "#FEF2F2",
          padding: "16px",
          fontSize: "14px",
          color: "#DC2626",
        }}>
          {error}
        </div>
      ) : blobUrl && canPreview ? (
        <div style={{
          width: "100%",
          height: "70vh",
          borderRadius: "8px",
          overflow: "hidden",
          border: "1px solid #E5E5E5",
          backgroundColor: "white",
        }}>
          <iframe
            title={title}
            src={isProbablyPdf(url || "") ? `${blobUrl}#view=FitH&toolbar=1&navpanes=0` : blobUrl}
            style={{ width: "100%", height: "100%", border: "none" }}
          />
        </div>
      ) : blobUrl ? (
        <div style={{
          width: "100%",
          borderRadius: "8px",
          border: "1px solid #E5E5E5",
          backgroundColor: "#F7F7F7",
          padding: "32px 16px",
          fontSize: "14px",
          color: "#71717A",
          textAlign: "center",
        }}>
          This file type ({ext || "unknown"}) cannot be previewed in the browser. Use the <strong>Download</strong> button to save it.
        </div>
      ) : (
        <div style={{
          width: "100%",
          borderRadius: "8px",
          border: "1px solid #E5E5E5",
          backgroundColor: "#F7F7F7",
          padding: "16px",
          fontSize: "14px",
          color: "#71717A",
        }}>
          No preview available for this file.
        </div>
      )}
    </ModalTemplate>
  );
}
