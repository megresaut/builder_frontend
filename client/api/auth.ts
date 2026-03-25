// const API_BASE = "/api";
const API_BASE = "http://localhost:8080";

function decodeJwt(token: string): any {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

// ─── In-memory token store ───────────────────────────────────────
// The in-memory variable is the primary token source for API calls.
// localStorage is used as a reload-survival fallback — on page load
// we restore from it so the user doesn't need a refresh round-trip.
let _accessToken: string | null = null;

// Hydrate from localStorage on module load (survives page refresh)
const _stored = localStorage.getItem("avm_token");
if (_stored && isTokenValid(_stored)) {
  _accessToken = _stored;
}

export function getAccessToken(): string | null {
  return _accessToken;
}

function _persistToken(token: string | null) {
  _accessToken = token;
  if (token) {
    localStorage.setItem("avm_token", token);
  } else {
    localStorage.removeItem("avm_token");
  }
}

// ─── JWT helpers ─────────────────────────────────────────────────

/** Returns true if the token exists and its exp is in the future. */
export function isTokenValid(token: string | null): boolean {
  if (!token) return false;
  const decoded = decodeJwt(token);
  if (!decoded?.exp) return false;
  // Allow 10-second clock skew
  return decoded.exp * 1000 > Date.now() - 10_000;
}

// ─── API calls ───────────────────────────────────────────────────

export async function loginRequest(email: string, password: string) {
  const res = await fetch(`${API_BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include", // receive refresh_token cookie
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    throw new Error("Invalid email or password");
  }

  const data = await res.json(); // { token }
  const decoded = decodeJwt(data.token);

  // Store token in memory + localStorage (for reload survival)
  _persistToken(data.token);

  // Persist non-sensitive metadata for UI (role checks, display)
  const role = decoded?.role ?? "";
  const userId = decoded?.user_id ?? decoded?.id ?? decoded?.sub;

  localStorage.setItem("avm_role", role);
  if (userId) localStorage.setItem("avm_user_id", String(userId));

  return { token: data.token, role, user_id: userId };
}

// Singleton guard — the backend rotates the refresh token on every call,
// so concurrent refresh requests would invalidate each other.
let _refreshPromise: Promise<string | null> | null = null;

export function refreshAccessToken(): Promise<string | null> {
  if (_refreshPromise) return _refreshPromise;

  _refreshPromise = _doRefresh().finally(() => {
    _refreshPromise = null;
  });

  return _refreshPromise;
}

async function _doRefresh(): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE}/refresh`, {
      method: "POST",
      credentials: "include", // sends refresh_token cookie
    });

    if (!res.ok) return null;

    const data = await res.json();
    const decoded = decodeJwt(data.token);

    // Update in-memory + localStorage
    _persistToken(data.token);

    // Update non-sensitive metadata
    if (decoded?.role) {
      localStorage.setItem("avm_role", decoded.role);
    }
    if (decoded?.user_id) {
      localStorage.setItem("avm_user_id", String(decoded.user_id));
    }

    return data.token;
  } catch {
    return null;
  }
}

export async function logoutRequest(): Promise<void> {
  try {
    await fetch(`${API_BASE}/logout`, {
      method: "POST",
      credentials: "include",
      headers: _accessToken ? { Authorization: `Bearer ${_accessToken}` } : {},
    });
  } catch {
    // best-effort
  }
  clearAuthState();
}

/** Wipe all auth state (memory + localStorage). */
export function clearAuthState() {
  _accessToken = null;
  localStorage.removeItem("avm_token");
  localStorage.removeItem("avm_role");
  localStorage.removeItem("avm_user_id");
}
