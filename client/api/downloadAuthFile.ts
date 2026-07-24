import { authFetch } from "@/api/fetchJSON";

/**
 * Fetches a protected file via authFetch and saves it to disk.
 *
 * Use this (rather than openAuthPdf) when the point is to hand the file on to
 * someone else — the browser writes it straight to Downloads instead of opening
 * a blob: tab the user then has to re-save.
 *
 * The server's Content-Disposition filename wins when present; `fallbackName`
 * covers responses that omit it.
 */
export async function downloadAuthFile(path: string, fallbackName: string): Promise<void> {
  // Strip /api prefix if present (authFetch adds its own base).
  const fetchPath = path.startsWith("/api/") ? path.slice(4) : path;

  const res = await authFetch(fetchPath);
  if (!res.ok) {
    throw new Error(`Failed to download file (${res.status})`);
  }

  const name = filenameFromDisposition(res.headers.get("Content-Disposition")) || fallbackName;
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoke on the next tick — revoking synchronously can cancel the download in
  // some browsers.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** Pulls the filename out of a Content-Disposition header, if it has one. */
function filenameFromDisposition(header: string | null): string {
  if (!header) return "";
  const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(header);
  if (!match) return "";
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}
