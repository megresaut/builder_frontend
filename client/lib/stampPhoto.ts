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

/**
 * Burns a timestamp + address stamp into the top-right corner of a photo,
 * matching the style used by property inspection camera apps.
 *
 * Entirely client-side (Canvas API) — works offline.
 * Falls back to the original file if canvas processing fails.
 */
export async function stampPhoto(
  file: File,
  capturedAt: Date,
  addressLines: string[]
): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.drawImage(img, 0, 0);

        // Scale font size relative to image width so it looks the same
        // regardless of whether the photo is 12MP or a compressed thumbnail.
        const fontSize = Math.max(20, Math.round(img.naturalWidth / 50));
        const lineHeight = Math.round(fontSize * 1.45);
        const padding = Math.round(fontSize * 0.9);

        ctx.font = `${fontSize}px -apple-system, "Helvetica Neue", Arial, sans-serif`;
        ctx.textAlign = "right";
        ctx.textBaseline = "top";

        const lines = [formatTimestamp(capturedAt), ...addressLines];

        lines.forEach((line, i) => {
          const x = img.naturalWidth - padding;
          const y = padding + i * lineHeight;

          // Dark shadow for visibility on both light and dark backgrounds
          ctx.shadowColor = "rgba(0,0,0,0.75)";
          ctx.shadowBlur = Math.round(fontSize * 0.35);
          ctx.shadowOffsetX = Math.round(fontSize * 0.06);
          ctx.shadowOffsetY = Math.round(fontSize * 0.06);

          ctx.fillStyle = "white";
          ctx.fillText(line, x, y);
        });

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }
            resolve(new File([blob], file.name, { type: "image/jpeg" }));
          },
          "image/jpeg",
          0.92
        );
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
}
