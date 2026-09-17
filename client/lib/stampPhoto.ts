import type { BackendInspection } from "@/api/inspections";

/**
 * Formats a Date as "Jun 25, 2026 at 2:51:20 PM" — matching the reference
 * stamp format used by property inspection camera apps.
 */
function formatTimestamp(date: Date): string {
  const datePart = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const timePart = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  return `${datePart} at ${timePart}`;
}

/**
 * Builds address lines from an inspection's property fields.
 * Returns empty array if no address is available.
 */
export function buildAddressLines(inspection: BackendInspection | null | undefined): string[] {
  if (!inspection) return [];
  const lines: string[] = [];
  if (inspection.property_address_line1) lines.push(inspection.property_address_line1);
  if (inspection.property_address_line2) lines.push(inspection.property_address_line2);
  const cityLine = [
    inspection.property_city,
    inspection.property_state,
    inspection.property_postal_code,
  ]
    .filter(Boolean)
    .join(" ");
  if (cityLine) lines.push(cityLine);
  if (lines.length > 0) lines.push("United States");
  return lines;
}

// Cap the canvas at this many pixels on the long edge. Modern phone cameras
// shoot 12MP+ (4032x3024) — drawing and re-encoding that at full resolution
// on the main thread is what was hanging/crashing mobile WebViews with no
// catchable error, silently dropping every photo before upload ever started.
const MAX_DIMENSION = 2048;

// If decoding/canvas work stalls (img.onload/onerror never fire, which does
// happen on some mobile WebViews under memory pressure), don't hang the
// upload forever — fall back to the original, unstamped file.
const STAMP_TIMEOUT_MS = 8000;

/**
 * Burns a timestamp + address stamp into the top-right corner of a photo,
 * matching the style used by property inspection camera apps.
 *
 * Entirely client-side (Canvas API) — works offline.
 * Falls back to the original file if canvas processing fails, stalls, or
 * takes too long.
 */
export async function stampPhoto(
  file: File,
  capturedAt: Date,
  addressLines: string[]
): Promise<File> {
  const stamped = new Promise<File>((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      try {
        const scale = Math.min(
          1,
          MAX_DIMENSION / Math.max(img.naturalWidth, img.naturalHeight)
        );
        const width = Math.round(img.naturalWidth * scale);
        const height = Math.round(img.naturalHeight * scale);

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Scale font size relative to the (possibly downscaled) image width
        // so it looks the same regardless of source resolution.
        const fontSize = Math.max(20, Math.round(width / 50));
        const lineHeight = Math.round(fontSize * 1.45);
        const padding = Math.round(fontSize * 0.9);

        ctx.font = `${fontSize}px -apple-system, "Helvetica Neue", Arial, sans-serif`;
        ctx.textAlign = "right";
        ctx.textBaseline = "top";

        const lines = [formatTimestamp(capturedAt), ...addressLines];

        lines.forEach((line, i) => {
          const x = width - padding;
          const y = padding + i * lineHeight;

          // Dark shadow for visibility on both light and dark backgrounds
          ctx.shadowColor = "rgba(0,0,0,0.75)";
          ctx.shadowBlur = Math.round(fontSize * 0.35);
          ctx.shadowOffsetX = Math.round(fontSize * 0.06);
          ctx.shadowOffsetY = Math.round(fontSize * 0.06);

          ctx.fillStyle = "white";
          ctx.fillText(line, x, y);
        });

        // toDataURL is synchronous and has broader WKWebView support than
        // the async toBlob callback (which silently returns null on some iOS versions).
        const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
        const base64 = dataUrl.split(",")[1];
        if (!base64) {
          resolve(file);
          return;
        }
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        resolve(new File([bytes.buffer], file.name, { type: "image/jpeg" }));
      } catch {
        resolve(file);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file); // fall back to original on error
    };

    img.src = objectUrl;
  });

  const timeout = new Promise<File>((resolve) => {
    setTimeout(() => resolve(file), STAMP_TIMEOUT_MS);
  });

  return Promise.race([stamped, timeout]);
}
