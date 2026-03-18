import { useEffect, useState } from "react";
import { authFetch } from "@/api/fetchJSON";

/**
 * Fetches a protected URL via authFetch and returns a blob URL for use in
 * iframes, img src, etc.  Cleans up the blob URL on unmount / URL change.
 */
export function useAuthBlobUrl(url: string | null | undefined) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!url) {
      setBlobUrl(null);
      setError(null);
      return;
    }

    // Already a blob URL — use directly
    if (url.startsWith("blob:")) {
      setBlobUrl(url);
      return;
    }

    let revoked = false;
    let objectUrl: string | null = null;
    setLoading(true);
    setError(null);

    // Convert full URL to relative path for authFetch
    let fetchPath = url;
    try {
      const parsed = new URL(url, window.location.origin);
      fetchPath = parsed.pathname + parsed.search;
    } catch {
      // already relative
    }
    // Strip /api prefix if present
    if (fetchPath.startsWith("/api/")) {
      fetchPath = fetchPath.slice(4);
    }

    authFetch(fetchPath)
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || `Failed to load (${res.status})`);
        }
        const blob = await res.blob();
        if (revoked) return;
        objectUrl = URL.createObjectURL(blob);
        setBlobUrl(objectUrl);
      })
      .catch((err) => {
        if (!revoked) setError(err?.message || "Failed to load file");
      })
      .finally(() => {
        if (!revoked) setLoading(false);
      });

    return () => {
      revoked = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url]);

  return { blobUrl, loading, error };
}
