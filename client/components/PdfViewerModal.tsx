import React, { useEffect, useMemo, useState } from "react";
import { ModalTemplate } from "@/components/ui/ModalTemplate";
import { PdfCanvasViewer } from "@/components/PdfCanvasViewer";

type PdfViewerModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  url?: string;
};

const isProbablyPdfUrl = (url: string, filename?: string) => {
  const clean = url.split("#")[0].split("?")[0];
  if (clean.toLowerCase().endsWith(".pdf")) return true;
  if (filename && filename.toLowerCase().endsWith(".pdf")) return true;
  return false;
};

const isProbablyImageUrl = (url: string, filename?: string) => {
  if (url.startsWith("data:image/")) return true;

  const clean = url.split("#")[0].split("?")[0];
  const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"];

  if (imageExtensions.some((ext) => clean.toLowerCase().endsWith(ext)))
    return true;
  if (
    filename &&
    imageExtensions.some((ext) => filename.toLowerCase().endsWith(ext))
  ) {
    return true;
  }

  return false;
};

export default function PdfViewerModal({
  open,
  onOpenChange,
  title,
  url,
}: PdfViewerModalProps) {
  const [iframeKey, setIframeKey] = useState(0);

  const safeUrl = useMemo(() => {
    if (!url) return undefined;
    const u = url.trim();
    return u ? u : undefined;
  }, [url]);

  // Detect mobile
  const isMobile = typeof window !== "undefined" && window.innerWidth < 1024;

  useEffect(() => {
    if (!open) return;
    if (!safeUrl) return;
    // Force iframe re-render when URL changes
    setIframeKey((prev) => prev + 1);
  }, [open, safeUrl]);

  const footerContent = (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
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
      {safeUrl ? (
        <a
          href={safeUrl}
          target="_blank"
          rel="noreferrer"
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
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor =
              "var(--color-button-primary-hover)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor =
              "var(--color-button-primary)")
          }
        >
          Open in new tab
        </a>
      ) : null}
    </div>
  );

  return (
    <ModalTemplate
      open={open}
      onOpenChange={onOpenChange}
      title={isMobile ? "" : title}
      size={isMobile ? "md" : "lg"}
      hideCloseButton={isMobile}
      showDivider={!isMobile}
      footer={!isMobile ? footerContent : null}
    >
      {isMobile && safeUrl && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "8px",
            marginTop: "-16px",
            justifyContent: "flex-end",
          }}
        >
          {footerContent}
        </div>
      )}
      {safeUrl ? (
        <div
          style={{
            width: "100%",
            height: "70vh",
            borderRadius: "8px",
            overflow: "hidden",
            border: "1px solid #E5E5E5",
            backgroundColor: "white",
          }}
        >
          {isProbablyImageUrl(safeUrl, title) ? (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "16px",
              }}
            >
              <img
                src={safeUrl}
                alt={title}
                style={{
                  maxWidth: "100%",
                  maxHeight: "100%",
                  objectFit: "contain",
                  borderRadius: "4px",
                }}
              />
            </div>
          ) : isProbablyPdfUrl(safeUrl, title) ? (
            <PdfCanvasViewer url={safeUrl} title={title} />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#71717A",
                textAlign: "center",
                padding: "20px",
                fontSize: "14px",
              }}
            >
              <p>
                No preview available for this file type.
                <br />
                <a
                  href={safeUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    color: "var(--color-button-primary)",
                    textDecoration: "underline",
                    cursor: "pointer",
                  }}
                >
                  Open the file instead
                </a>
              </p>
            </div>
          )}
        </div>
      ) : (
        <div
          style={{
            width: "100%",
            borderRadius: "8px",
            border: "1px solid #E5E5E5",
            backgroundColor: "#F7F7F7",
            padding: "16px",
            fontSize: "14px",
            color: "#71717A",
            fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif",
          }}
        >
          No preview available for this file.
        </div>
      )}
    </ModalTemplate>
  );
}
