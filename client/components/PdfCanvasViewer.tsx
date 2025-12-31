import React, { useEffect, useMemo, useRef, useState } from "react";

type PdfCanvasViewerProps = {
  url: string;
  title: string;
};

type PdfJsModule = typeof import("pdfjs-dist/build/pdf.mjs");

type PdfDocProxy = {
  numPages: number;
  getPage: (pageNumber: number) => Promise<PdfPageProxy>;
};

type PdfPageProxy = {
  getViewport: (opts: { scale: number }) => { width: number; height: number };
  render: (opts: {
    canvasContext: CanvasRenderingContext2D;
    viewport: { width: number; height: number };
  }) => { promise: Promise<void>; cancel: () => void };
};

let pdfJsPromise: Promise<PdfJsModule> | null = null;
const loadPdfJs = () => {
  if (!pdfJsPromise) {
    pdfJsPromise = import("pdfjs-dist/build/pdf.mjs").then((mod) => {
      mod.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.min.mjs",
        import.meta.url,
      ).toString();
      return mod;
    });
  }
  return pdfJsPromise;
};

function PdfPageCanvas({
  pdfDoc,
  pageNumber,
  containerWidth,
}: {
  pdfDoc: PdfDocProxy;
  pageNumber: number;
  containerWidth: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    let renderTask: { cancel: () => void } | null = null;

    const render = async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const page = await pdfDoc.getPage(pageNumber);
      if (cancelled) return;

      const baseViewport = page.getViewport({ scale: 1 });
      const horizontalPadding = 32;
      const availableWidth = Math.max(320, containerWidth - horizontalPadding);
      const scaleCss = Math.max(0.5, Math.min(2.5, availableWidth / baseViewport.width));
      const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;

      const viewport = page.getViewport({ scale: scaleCss * dpr });

      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      canvas.style.width = `${Math.floor(viewport.width / dpr)}px`;
      canvas.style.height = `${Math.floor(viewport.height / dpr)}px`;

      renderTask = page.render({ canvasContext: ctx, viewport });
      await renderTask.promise;
    };

    render().catch(() => {
      // If render fails, the parent will show an error state; keep this silent.
    });

    return () => {
      cancelled = true;
      if (renderTask) renderTask.cancel();
    };
  }, [pdfDoc, pageNumber, containerWidth]);

  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: "block",
          backgroundColor: "white",
          borderRadius: "6px",
          boxShadow: "0px 1px 2px rgba(0,0,0,0.06)",
        }}
      />
    </div>
  );
}

export function PdfCanvasViewer({ url, title }: PdfCanvasViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState(800);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pdfDoc, setPdfDoc] = useState<PdfDocProxy | null>(null);
  const [numPages, setNumPages] = useState<number>(0);

  const pageNumbers = useMemo(
    () => Array.from({ length: numPages }, (_, i) => i + 1),
    [numPages],
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => setContainerWidth(el.getBoundingClientRect().width || 800);
    update();

    const observer = new ResizeObserver(() => update());
    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let isCancelled = false;
    let destroy: (() => Promise<void>) | null = null;

    const run = async () => {
      setStatus("loading");
      setErrorMessage(null);
      setPdfDoc(null);
      setNumPages(0);

      const pdfjs = await loadPdfJs();
      if (isCancelled) return;

      const loadingTask = pdfjs.getDocument({ url });
      destroy = async () => {
        try {
          await loadingTask.destroy();
        } catch {
          // ignore
        }
      };

      const doc = (await loadingTask.promise) as unknown as PdfDocProxy;
      if (isCancelled) {
        await destroy();
        return;
      }

      setPdfDoc(doc);
      setNumPages(doc.numPages);
      setStatus("ready");
    };

    run().catch((err: unknown) => {
      if (isCancelled) return;
      const message = err instanceof Error ? err.message : "Failed to load PDF";
      setErrorMessage(message);
      setStatus("error");
    });

    return () => {
      isCancelled = true;
      if (destroy) {
        void destroy();
      }
    };
  }, [url]);

  if (status === "loading") {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#71717A",
          fontSize: "14px",
          padding: "24px",
          textAlign: "center",
        }}
      >
        Loading preview
      </div>
    );
  }

  if (status === "error" || !pdfDoc) {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#71717A",
          fontSize: "14px",
          padding: "24px",
          textAlign: "center",
        }}
      >
        <div>
          <div style={{ marginBottom: "12px" }}>
            PDF preview couldnt be rendered.
          </div>
          {errorMessage ? (
            <div style={{ marginBottom: "12px", color: "#A1A1AA" }}>
              {errorMessage}
            </div>
          ) : null}
          <a
            href={url}
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
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        overflow: "auto",
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        backgroundColor: "#FAFAFA",
      }}
    >
      {pageNumbers.map((pageNumber) => (
        <PdfPageCanvas
          key={pageNumber}
          pdfDoc={pdfDoc}
          pageNumber={pageNumber}
          containerWidth={containerWidth}
        />
      ))}
    </div>
  );
}
