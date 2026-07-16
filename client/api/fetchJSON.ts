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

/**
 * Authenticated fetch for non-JSON requests (file uploads, etc.).
 * Auto-attaches the Authorization header but does NOT set Content-Type,
 * so the browser can set multipart/form-data with the correct boundary.
 * Includes 401 → refresh → retry logic.
 */
export async function authFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const url = `${API_BASE}${path}`;

  function buildInit(token: string | null): RequestInit {
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string> || {}),
    };
    if (token && !headers["Authorization"]) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    return { credentials: "include", ...options, headers };
  }

  let res = await fetch(url, buildInit(getAccessToken()));

  if (res.status === 401) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      res = await fetch(url, buildInit(newToken));
    } else {
      clearAuthState();
      window.dispatchEvent(new CustomEvent("auth:session-expired"));
      throw new Error("Session expired");
    }
  }

  return res;
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
      // Refresh failed — clear auth state and signal the app to redirect
      clearAuthState();
      window.dispatchEvent(new CustomEvent("auth:session-expired"));
      throw new Error("Session expired");
    }
  }

  if (!res.ok) {
    const text = await res.text();
    let message = text;
    let body: any = null;
    try {
      const parsed = JSON.parse(text);
      if (parsed && typeof parsed === "object") {
        body = parsed;
        message = parsed.error || parsed.message || parsed.detail || text;
      }
    } catch {
      // Body wasn't JSON — fall back to raw text
    }
    if (!message || !message.trim()) {
      message = `Request failed (${res.status})`;
    }
    // Attach the status and parsed body so callers can branch on structured
    // error payloads (e.g. 409 duplicate-bill responses) instead of
    // string-matching the message.
    const err = new Error(message) as Error & { status?: number; body?: any };
    err.status = res.status;
    err.body = body;
    throw err;
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
