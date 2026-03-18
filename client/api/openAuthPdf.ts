import { authFetch } from "@/api/fetchJSON";

/**
 * Fetches a protected PDF/file via authFetch and opens it in a new tab.
 * Use this instead of window.open(apiUrl) for protected endpoints.
 */
export async function openAuthPdf(path: string): Promise<void> {
  // Strip /api prefix if present
  let fetchPath = path;
  if (fetchPath.startsWith("/api/")) {
    fetchPath = fetchPath.slice(4);
  }

  const res = await authFetch(fetchPath);
  if (!res.ok) {
    throw new Error(`Failed to load file (${res.status})`);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
  // Revoke after a delay to allow the new tab to load
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
