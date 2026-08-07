import { API_BASE } from "./fetchJSON";

/**
 * Percent-encode a storage object key for use as a URL path, keeping `/` as a
 * separator.
 *
 * `maintenance_attachments.storage_path` is `maintenance/tmp/<uuid>/<original
 * filename>` — the uploader's filename is preserved verbatim, and vendor PDFs
 * are routinely named `... - Inv#1175398478 - ... - $14,713.pdf`. Interpolating
 * such a key straight into a URL makes the browser treat everything from the
 * `#` onward as a fragment and drop it, so the server only ever receives a
 * truncated path and the static file server answers `404 page not found`.
 * (122 of 537 attachment keys in production contain a `#`.)
 */
export function encodeObjectKey(objectKey: string | null | undefined): string {
  if (!objectKey) return "";
  return objectKey
    .replace(/^\/+/, "")
    .split("/")
    .map(encodeURIComponent)
    .join("/");
}

/**
 * Build an absolute URL to the static file server for a storage object key.
 *
 * Prefer an id-addressed endpoint (e.g. `/maintenance/attachments/{id}`) where
 * one exists — it keeps the filename out of the URL entirely and is behind
 * auth. Use this only when the key is all you have.
 */
export function fileUrl(objectKey: string | null | undefined): string {
  return `${API_BASE.replace(/\/$/, "")}/files/${encodeObjectKey(objectKey)}`;
}

/**
 * Read a persisted attachment id, or null if this isn't one.
 *
 * Deliberately stricter than `parseInt`. Attachment lists mix persisted rows
 * with files that have no row yet, and the latter get a synthetic id of
 * `` `${fileName}-${index}` ``. `parseInt("28 Coleytown - ....pdf-0")` returns
 * `28`, which would silently serve an unrelated document, so require the whole
 * string to be digits.
 */
export function parseAttachmentId(
  rawId: string | number | null | undefined,
): number | null {
  if (typeof rawId === "number") {
    return Number.isInteger(rawId) && rawId > 0 ? rawId : null;
  }
  if (!rawId) return null;
  const trimmed = String(rawId).trim();
  return /^\d+$/.test(trimmed) ? Number(trimmed) : null;
}
