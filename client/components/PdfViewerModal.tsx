import React, { useEffect, useMemo, useState } from "react";
import { ModalTemplate } from "@/components/ui/ModalTemplate";

type PdfViewerModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  url?: string;
  onRenameClick?: () => void;
  isRenaming?: boolean;
  renamingFileName?: string;
  onRenamingFileNameChange?: (name: string) => void;
  onSaveFileName?: () => void;
  onCancelRenaming?: () => void;
};

const isProbablyPdfUrl = (url: string | undefined, filename?: string) => {
  if (!url) {
    // If no URL, check filename only
    return filename ? filename.toLowerCase().endsWith(".pdf") : false;
  }

  // Check if URL looks like a PDF
  const clean = url.split("#")[0].split("?")[0];
  if (clean.toLowerCase().endsWith(".pdf")) return true;

  // Check if filename ends with .pdf
  if (filename && filename.toLowerCase().endsWith(".pdf")) return true;

  // Check for common API patterns with pdf in query params or path
  if (url.includes(".pdf") || url.toLowerCase().includes("pdf")) return true;

  return false;
};

const isProbablyImageUrl = (url: string, filename?: string) => {
  if (url.startsWith("data:image/")) return true;

  const clean = url.split("#")[0].split("?")[0];
  const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"];

  if (imageExtensions.some((ext) => clean.toLowerCase().endsWith(ext))) {
    return true;
  }

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
  onRenameClick,
  isRenaming = false,
  renamingFileName = "",
  onRenamingFileNameChange,
  onSaveFileName,
  onCancelRenaming,
}: PdfViewerModalProps) {
  const [iframeKey, setIframeKey] = useState(0);
  const [isFrameLoading, setIsFrameLoading] = useState(false);
  const [frameError, setFrameError] = useState<string | null>(null);

  const safeUrl = useMemo(() => {
    if (!url) return undefined;
    const u = url.trim();
    return u ? u : undefined;
  }, [url]);

  const isMobile = typeof window !== "undefined" && window.innerWidth < 1024;

  useEffect(() => {
    if (!open) return;
    if (!safeUrl) return;

    setIframeKey((prev) => prev + 1);
    setIsFrameLoading(true);
    setFrameError(null);
  }, [open, safeUrl]);

  const footerContent = (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      {isRenaming ? (
        <>
          <input
            type="text"
            value={renamingFileName}
            onChange={(e) => onRenamingFileNameChange?.(e.target.value)}
            autoFocus
            style={{
              flex: 1,
              padding: "8px 12px",
              borderRadius: "8px",
              border: "1px solid rgba(218, 218, 218, 1)",
              fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif",
              fontSize: "14px",
            }}
            placeholder="File name"
          />
          <button
            type="button"
            onClick={onCancelRenaming}
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
            Cancel
          </button>
          <button
            type="button"
            onClick={onSaveFileName}
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
            }}
          >
            Save
          </button>
        </>
      ) : (
        <>
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
          {onRenameClick && (
            <button
              type="button"
              onClick={onRenameClick}
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
              Rename
            </button>
          )}
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
        </>
      )}
    </div>
  );

  const showPdf = !!safeUrl && isProbablyPdfUrl(safeUrl, title);
  const showImage = !!safeUrl && isProbablyImageUrl(safeUrl, title);

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
          {showImage ? (
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
          ) : showPdf ? (
            <div style={{ position: "relative", width: "100%", height: "100%" }}>
              {isFrameLoading && !frameError ? (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#71717A",
                    fontSize: "14px",
                    padding: "24px",
                    textAlign: "center",
                    background: "white",
                    zIndex: 1,
                  }}
                >
                  Loading preview…
                </div>
              ) : null}

              {frameError ? (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#71717A",
                    fontSize: "14px",
                    padding: "24px",
                    textAlign: "center",
                    background: "white",
                    zIndex: 1,
                  }}
                >
                  <div>
                    <div style={{ marginBottom: "12px" }}>{frameError}</div>
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
                      Open {title}
                    </a>
                  </div>
                </div>
              ) : null}

              <iframe
                key={iframeKey}
                src={safeUrl}
                title={title}
                onLoad={() => {
                  setIsFrameLoading(false);
                }}
                onError={() => {
                  setIsFrameLoading(false);
                  setFrameError("PDF preview couldn’t be rendered.");
                }}
                style={{
                  width: "100%",
                  height: "100%",
                  border: "none",
                  display: "block",
                }}
              />
            </div>
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
