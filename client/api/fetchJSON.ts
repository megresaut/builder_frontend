// export const API_BASE = "/api";
export const API_BASE = "http://localhost:8080";
//coment test push
export async function fetchJSON(path: string, options: RequestInit = {}) {
  const url = `${API_BASE}${path}`;

  const res = await fetch(url, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

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
