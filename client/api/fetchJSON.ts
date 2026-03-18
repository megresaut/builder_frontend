import { refreshAccessToken, getAccessToken, clearAuthState } from "./auth";

export const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";

async function doFetch(path: string, options: RequestInit = {}, tokenOverride?: string | null) {
  const url = `${API_BASE}${path}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };

  // Auto-attach Authorization header from in-memory token
  const authToken = tokenOverride ?? getAccessToken();
  if (authToken && !headers["Authorization"]) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  return fetch(url, {
    credentials: "include",
    ...options,
    headers,
  });
}

export async function fetchJSON(path: string, options: RequestInit = {}) {
  let res = await doFetch(path, options);

  // If 401, try refreshing the token once.
  // refreshAccessToken() is already deduped — safe to call from anywhere.
  if (res.status === 401) {
    const newToken = await refreshAccessToken();

    if (newToken) {
      // Retry the original request with the new token
      res = await doFetch(path, options, newToken);
    } else {
      // Refresh failed — clear auth state and redirect to login
      clearAuthState();
      window.location.href = "/login";
      throw new Error("Session expired");
    }
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }

  // 204 No Content (e.g. DELETE) has no body
  if (res.status === 204 || res.status === 205) {
    return null;
  }

  // Check if response is actually JSON before parsing
  const contentType = res.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    const text = await res.text();
    throw new Error(`Expected JSON but got ${contentType}. Response: ${text.substring(0, 200)}`);
  }

  return res.json();
}
