import { fetchJSON, authFetch, API_BASE } from "@/api/fetchJSON";
import type {
  BugReport,
  BugStatus,
  BugModule,
  BugSeverity,
  BugComment,
  BugAttachment,
  BugTechnicalContext,
} from "./bugs.mock";

export type {
  BugReport,
  BugStatus,
  BugModule,
  BugSeverity,
  BugComment,
  BugAttachment,
  BugTechnicalContext,
} from "./bugs.mock";
export { BUG_MODULES, BUG_SEVERITIES, BUG_STATUSES } from "./bugs.mock";

interface ApiAttachment {
  id: number;
  bug_report_id: number;
  object_key: string;
  url: string;
  mime: string;
  filename: string;
  file_size: number;
  created_at: string;
}

interface ApiComment {
  id: number;
  bug_report_id: number;
  author_user_id: number | null;
  author_name: string;
  body: string;
  source: "app" | "notion";
  notion_block_id?: string | null;
  created_at: string;
}

interface ApiBugReport {
  id: number;
  reporter_user_id: number;
  reporter_name: string;
  reporter_role: string;
  title: string;
  description: string;
  module: string;
  severity: BugSeverity;
  status: BugStatus;
  technical_context: Partial<{
    url: string;
    userAgent: string;
    viewport: string;
    userRole: string;
    capturedAt: string;
    consoleLogs: BugTechnicalContext["consoleLogs"];
  }>;
  notion_page_id: string | null;
  notion_page_url: string | null;
  notion_synced_at: string | null;
  created_at: string;
  updated_at: string;
  attachments: ApiAttachment[];
  comments: ApiComment[];
}

function fileURL(objectKey: string, hostedURL: string): string {
  // Backend returns "/api/files/...". Prepend API_BASE so the browser hits the right host.
  if (hostedURL.startsWith("http")) return hostedURL;
  return `${API_BASE}${hostedURL}`;
}

function transformAttachment(a: ApiAttachment): BugAttachment {
  return {
    id: String(a.id),
    filename: a.filename,
    mime: a.mime,
    url: fileURL(a.object_key, a.url),
  };
}

function transformComment(c: ApiComment): BugComment {
  return {
    id: String(c.id),
    authorName: c.author_name,
    authorRole: "",
    body: c.body,
    createdAt: c.created_at,
    source: c.source,
  };
}

function transformBug(b: ApiBugReport): BugReport {
  const tc = b.technical_context || {};
  return {
    id: String(b.id),
    title: b.title,
    description: b.description,
    module: b.module as BugModule,
    severity: b.severity,
    status: b.status,
    reporterName: b.reporter_name || "Unknown",
    reporterRole: b.reporter_role || "",
    reporterId: String(b.reporter_user_id),
    notionPageId: b.notion_page_id,
    notionPageUrl: b.notion_page_url,
    createdAt: b.created_at,
    updatedAt: b.updated_at,
    attachments: (b.attachments || []).map(transformAttachment),
    comments: (b.comments || []).map(transformComment),
    technicalContext: {
      url: tc.url || "",
      userAgent: tc.userAgent || "",
      viewport: tc.viewport || "",
      userRole: tc.userRole || "",
      capturedAt: tc.capturedAt || b.created_at,
      consoleLogs: tc.consoleLogs || [],
    },
  };
}

export interface ListBugsParams {
  status?: BugStatus | "all";
  module?: BugModule | "all";
  severity?: BugSeverity | "all";
  mine?: boolean;
  search?: string;
}

export async function listBugs(params: ListBugsParams = {}): Promise<BugReport[]> {
  const q = new URLSearchParams();
  if (params.status && params.status !== "all") q.set("status", params.status);
  if (params.module && params.module !== "all") q.set("module", params.module);
  if (params.severity && params.severity !== "all") q.set("severity", params.severity);
  if (params.mine) q.set("mine", "true");
  if (params.search) q.set("search", params.search);
  const qs = q.toString();
  const data: ApiBugReport[] = (await fetchJSON(`/bugs${qs ? `?${qs}` : ""}`)) || [];
  return data.map(transformBug);
}

export async function getBug(id: number | string): Promise<BugReport> {
  const data: ApiBugReport = await fetchJSON(`/bugs/${id}`);
  return transformBug(data);
}

export interface CreateBugInput {
  title: string;
  description: string;
  module: BugModule;
  severity: BugSeverity;
  technicalContext: BugTechnicalContext;
  files: File[];
}

export async function createBug(input: CreateBugInput): Promise<BugReport> {
  const fd = new FormData();
  fd.append("title", input.title);
  fd.append("description", input.description);
  fd.append("module", input.module);
  fd.append("severity", input.severity);
  fd.append("technical_context", JSON.stringify(input.technicalContext));
  for (const f of input.files) fd.append("screenshots", f, f.name);

  const res = await authFetch(`/bugs`, { method: "POST", body: fd });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`createBug failed (${res.status}): ${text}`);
  }
  const data: ApiBugReport = await res.json();
  return transformBug(data);
}

export async function updateBugStatus(id: number | string, status: BugStatus): Promise<BugReport> {
  const data: ApiBugReport = await fetchJSON(`/bugs/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
  return transformBug(data);
}

export async function addBugComment(id: number | string, body: string): Promise<BugComment> {
  const c: ApiComment = await fetchJSON(`/bugs/${id}/comments`, {
    method: "POST",
    body: JSON.stringify({ body }),
  });
  return transformComment(c);
}
