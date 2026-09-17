import { PDFDocument } from "pdf-lib";
import heic2any from "heic2any";

/* -----------------------------
   Helpers
----------------------------- */

function isPdf(file: File) {
  return file.type === "application/pdf" || /\.pdf$/i.test(file.name);
}

function isHeic(file: File) {
  return /\.(heic|heif)$/i.test(file.name);
}

function isImage(file: File) {
  return (
    file.type.startsWith("image/") ||
    /\.(jpg|jpeg|png|gif|webp|heic|heif)$/i.test(file.name)
  );
}

function toPdfName(filename: string) {
  // Replace common image extensions with .pdf; if unknown, just append .pdf
  if (/\.(jpg|jpeg|png|gif|webp|heic|heif)$/i.test(filename)) {
    return filename.replace(/\.(jpg|jpeg|png|gif|webp|heic|heif)$/i, ".pdf");
  }
  return `${filename}.pdf`;
}

async function blobToFile(blob: Blob, name: string, type: string) {
  return new File([blob], name, { type });
}

/* -----------------------------
   Image decode (robust)
----------------------------- */

async function decodeToImageBitmap(file: File): Promise<ImageBitmap> {
  // Prefer createImageBitmap for reliability/perf
  try {
    return await createImageBitmap(file);
  } catch {
    // Fallback to <img> for Safari edge cases
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const i = new Image();
        i.onload = () => resolve(i);
        i.onerror = () => reject(new Error("Failed to load image"));
        i.src = url;
      });

      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;

      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not get 2D context");

      ctx.drawImage(img, 0, 0);

      return await createImageBitmap(canvas);
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}

/* -----------------------------
   Normalize to real JPEG/PNG bytes
   (fixes webp/gif/etc corrupt PDFs)
----------------------------- */

// Final PDF page is a fixed 612x792pt (US Letter), so encoding at full
// camera resolution (12-48MP on modern phones) only makes the canvas work
// slower and more likely to stall/hang on mobile Safari, for zero visible
// gain. Cap the longest edge before encoding.
const MAX_ENCODE_DIMENSION = 2000;

async function reencodeBitmapToJpegBytes(
  bitmap: ImageBitmap,
  quality = 0.95
): Promise<Uint8Array> {
  const scale = Math.min(
    1,
    MAX_ENCODE_DIMENSION / Math.max(bitmap.width, bitmap.height)
  );
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get 2D context");
  ctx.drawImage(bitmap, 0, 0, width, height);

  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("JPEG encoding failed"))),
      "image/jpeg",
      quality
    );
  });

  const ab = await blob.arrayBuffer();
  return new Uint8Array(ab);
}

async function getEmbedBytesAndType(file: File): Promise<{
  embedType: "png" | "jpg";
  bytes: Uint8Array;
  normalizedName: string;
}> {
  let working = file;

  // 1) HEIC/HEIF -> JPEG file
  if (isHeic(working)) {
    const converted = await heic2any({
      blob: working,
      toType: "image/jpeg",
      quality: 0.95,
    });

    const blob = Array.isArray(converted) ? converted[0] : converted;

    working = await blobToFile(
      blob as Blob,
      working.name.replace(/\.(heic|heif)$/i, ".jpg"),
      "image/jpeg"
    );
  }

  // 2) If it's a true PNG, we can embed it directly.
  //    But to be bulletproof across odd PNGs, we still decode+reencode when needed.
  if (working.type === "image/png" || /\.png$/i.test(working.name)) {
    try {
      const ab = await working.arrayBuffer();
      return {
        embedType: "png",
        bytes: new Uint8Array(ab),
        normalizedName: working.name,
      };
    } catch {
      // fall through to bitmap path
    }
  }

  // 3) Everything else (jpg/jpeg/webp/gif/unknown) -> decode -> JPEG bytes
  //    This prevents feeding webp/gif bytes into embedJpg (which corrupts PDFs).
  const bitmap = await decodeToImageBitmap(working);
  const jpegBytes = await reencodeBitmapToJpegBytes(bitmap, 0.95);

  const normalizedName = working.name.replace(
    /\.(gif|webp|png|heic|heif)$/i,
    ".jpg"
  );

  return {
    embedType: "jpg",
    bytes: jpegBytes,
    normalizedName,
  };
}

/* -----------------------------
   Convert image → PDF (Letter)
----------------------------- */

// createImageBitmap/canvas.toBlob are known to silently hang on iOS Safari
// (e.g. the tab loses focus while the user is still in the Camera/Photos
// picker) — they never resolve *or* reject. Without a hard ceiling here, a
// stuck conversion blocks the attachment forever with no error surfaced.
const CONVERSION_TIMEOUT_MS = 20_000;

export async function convertFiletoPdf(input?: File): Promise<File> {
  if (!input) throw new Error("No file provided");
  if (isPdf(input)) return input;
  if (!isImage(input)) throw new Error("Unsupported file type");

  return await Promise.race([
    convertImageToPdf(input),
    new Promise<File>((_, reject) =>
      setTimeout(
        () =>
          reject(
            new Error(
              "Converting this photo took too long. Try a smaller photo or a different browser."
            )
          ),
        CONVERSION_TIMEOUT_MS
      )
    ),
  ]);
}

async function convertImageToPdf(input: File): Promise<File> {
  // Get safe-to-embed bytes
  const { embedType, bytes, normalizedName } = await getEmbedBytesAndType(input);

  const pdf = await PDFDocument.create();

  // US Letter @ 72 DPI (matches your previous numbers)
  const PAGE_WIDTH = 612;
  const PAGE_HEIGHT = 792;

  const page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

  const embedded =
    embedType === "png" ? await pdf.embedPng(bytes) : await pdf.embedJpg(bytes);

  const imgW = embedded.width;
  const imgH = embedded.height;

  const scale = Math.min(PAGE_WIDTH / imgW, PAGE_HEIGHT / imgH);
  const drawW = imgW * scale;
  const drawH = imgH * scale;

  const x = (PAGE_WIDTH - drawW) / 2;
  const y = (PAGE_HEIGHT - drawH) / 2;

  page.drawImage(embedded, { x, y, width: drawW, height: drawH });

  const pdfBytes = await pdf.save();

  // Optional sanity check: if this throws, your PDF bytes are invalid (shouldn't happen now)
  // await PDFDocument.load(pdfBytes);

  return new File([pdfBytes], toPdfName(normalizedName), {
    type: "application/pdf",
  });
}
