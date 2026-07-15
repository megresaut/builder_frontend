/**
 * Error-shape tests for client/data/projects.ts through the REAL fetchJSON
 * (client/api/fetchJSON.ts), with global fetch stubbed.
 *
 * §6: errors are always `{"error":"<message>"}` — fetchJSON must surface them
 * as `Error(<message>)` (it prefers parsed.error over raw text), and 204
 * DELETE responses resolve to null/void. Only @/api/auth is mocked so the
 * 401-refresh path stays inert.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/api/auth", () => ({
  getAccessToken: vi.fn(() => "test-token"),
  refreshAccessToken: vi.fn(() => Promise.resolve(null)),
  clearAuthState: vi.fn(),
}));

import { API_BASE } from "@/api/fetchJSON";
import {
  listProjects,
  getProject,
  deleteProject,
  createChangeOrder,
  attachTasks,
} from "@/data/projects";

function jsonResponse(status: number, body: unknown) {
  const text = JSON.stringify(body);
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: String(status),
    headers: { get: (name: string) => (name.toLowerCase() === "content-type" ? "application/json" : null) },
    text: () => Promise.resolve(text),
    json: () => Promise.resolve(JSON.parse(text)),
  } as unknown as Response;
}

function noContentResponse() {
  return {
    ok: true,
    status: 204,
    statusText: "No Content",
    headers: { get: () => null },
    text: () => Promise.resolve(""),
    json: () => Promise.reject(new Error("no body")),
  } as unknown as Response;
}

const fetchSpy = vi.fn();

beforeEach(() => {
  fetchSpy.mockReset();
  vi.stubGlobal("fetch", fetchSpy);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("projects client error shape (real fetchJSON, stubbed fetch)", () => {
  it('400 {"error":"invalid status"} rejects with Error("invalid status")', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse(400, { error: "invalid status" }));
    await expect(listProjects({ status: "active" })).rejects.toThrow("invalid status");
  });

  it('403 {"error":"forbidden"} rejects with Error("forbidden")', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse(403, { error: "forbidden" }));
    await expect(deleteProject(1)).rejects.toThrow("forbidden");
  });

  it('404 {"error":"project not found"} rejects with Error("project not found")', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse(404, { error: "project not found" }));
    await expect(getProject(999)).rejects.toThrow("project not found");
  });

  it("409 conflict on attach rejects with the server message", async () => {
    fetchSpy.mockResolvedValueOnce(
      jsonResponse(409, { error: "task 7002 already belongs to project 5" }),
    );
    await expect(attachTasks(1, [{ task_id: 7002 }])).rejects.toThrow(
      "task 7002 already belongs to project 5",
    );
  });

  it("rejections are real Error instances (toast-able message, not JSON blob)", async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse(400, { error: "description is required" }));
    const err = await createChangeOrder(1, { description: "", amount_cents: 1 }).catch(
      (e: unknown) => e,
    );
    expect(err).toBeInstanceOf(Error);
    expect((err as Error).message).toBe("description is required");
  });

  it("non-JSON error body falls back to the raw text as the message", async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      headers: { get: () => "text/plain" },
      text: () => Promise.resolve("missing auth token"),
    } as unknown as Response);
    // 401 triggers the (mocked, null-returning) refresh → "Session expired"
    await expect(getProject(1)).rejects.toThrow("Session expired");
  });

  it("DELETE 204 resolves cleanly (fetchJSON returns null → void)", async () => {
    fetchSpy.mockResolvedValueOnce(noContentResponse());
    await expect(deleteProject(5)).resolves.toBeUndefined();
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe(`${API_BASE}/projects/5`);
    expect(init.method).toBe("DELETE");
    expect(init.headers.Authorization).toBe("Bearer test-token");
  });

  it("successful GET goes to API_BASE + path with JSON content type", async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse(200, []));
    await listProjects({ property_id: 42 });
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe(`${API_BASE}/projects?property_id=42`);
    expect(init.headers["Content-Type"]).toBe("application/json");
  });
});
