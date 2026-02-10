import React from "react";
import { ModalTemplate } from "@/components/ui/ModalTemplate";
import type { ParsedMsg } from "@/utils/parseMsgFile";

type MsgViewerModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  data: ParsedMsg | null;
  loading?: boolean;
  error?: string | null;
};

export default function MsgViewerModal({
  open,
  onOpenChange,
  title,
  data,
  loading = false,
  error = null,
}: MsgViewerModalProps) {
  return (
    <ModalTemplate
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      size="lg"
      footer={
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
        </div>
      }
    >
      {loading ? (
        <div
          style={{
            padding: "24px",
            textAlign: "center",
            color: "#71717A",
            fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif",
            fontSize: "14px",
          }}
        >
          Loading message…
        </div>
      ) : error ? (
        <div
          style={{
            padding: "24px",
            color: "#B91C1C",
            fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif",
            fontSize: "14px",
          }}
        >
          {error}
        </div>
      ) : data ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              paddingBottom: "12px",
              borderBottom: "1px solid #E5E5E5",
            }}
          >
            <div style={{ fontSize: "12px", color: "#71717A", fontWeight: 500 }}>
              Subject
            </div>
            <div style={{ fontSize: "14px", color: "#09090b" }}>
              {data.subject || "—"}
            </div>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "auto 1fr",
              gap: "8px 16px",
              fontSize: "13px",
            }}
          >
            <span style={{ color: "#71717A" }}>From</span>
            <span style={{ color: "#09090b", wordBreak: "break-all" }}>
              {data.from}
            </span>
            <span style={{ color: "#71717A" }}>To</span>
            <span style={{ color: "#09090b", wordBreak: "break-all" }}>
              {data.to}
            </span>
            <span style={{ color: "#71717A" }}>Date</span>
            <span style={{ color: "#09090b" }}>{data.date}</span>
          </div>
          <div
            style={{
              flex: 1,
              minHeight: "200px",
              maxHeight: "50vh",
              overflow: "auto",
              borderRadius: "8px",
              border: "1px solid #E5E5E5",
              backgroundColor: "#FAFAFA",
            }}
          >
            {data.bodyHtml ? (
              <iframe
                title="Message body"
                sandbox="allow-same-origin"
                srcDoc={getBodyIframeDoc(data.bodyHtml)}
                style={{
                  width: "100%",
                  height: "100%",
                  minHeight: "200px",
                  border: "none",
                }}
              />
            ) : (
              <div
                style={{
                  padding: "16px",
                  fontSize: "14px",
                  color: "#71717A",
                }}
              >
                No body content.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div
          style={{
            padding: "24px",
            color: "#71717A",
            fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif",
            fontSize: "14px",
          }}
        >
          No message data to display.
        </div>
      )}
    </ModalTemplate>
  );
}

/** Build iframe srcdoc so email HTML renders but cannot break out of our wrapper. */
function getBodyIframeDoc(html: string): string {
  const safe = html
    .replace(/<\/html\s*>/gi, "&lt;/html&gt;")
    .replace(/<\/body\s*>/gi, "&lt;/body&gt;");
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body { font-family: Geist, -apple-system, Roboto, Helvetica, sans-serif; font-size: 14px; line-height: 1.5; color: #18181b; padding: 16px; margin: 0; } a { color: #2463EB; }</style></head><body>${safe}</body></html>`;
}
