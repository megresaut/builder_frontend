import type { CapturedEntry } from "@/lib/consoleCapture";

export const BUG_MODULES = [
  "Properties",
  "Maintenance",
  "Vendors",
  "Invoicing",
  "Inspections",
  "Utilities",
  "Accounting",
  "Insurance",
  "Operations",
  "Auth",
  "Other",
] as const;
export type BugModule = (typeof BUG_MODULES)[number];

export const BUG_SEVERITIES = ["low", "medium", "high", "blocker"] as const;
export type BugSeverity = (typeof BUG_SEVERITIES)[number];

export const BUG_STATUSES = ["open", "triaged", "in_progress", "resolved", "wont_fix"] as const;
export type BugStatus = (typeof BUG_STATUSES)[number];

export interface BugAttachment {
  id: string;
  filename: string;
  mime: string;
  url: string;
}

export interface BugComment {
  id: string;
  authorName: string;
  authorRole: string;
  body: string;
  createdAt: string;
  source: "app" | "notion";
}

export interface BugTechnicalContext {
  url: string;
  userAgent: string;
  viewport: string;
  userRole: string;
  capturedAt: string;
  consoleLogs: CapturedEntry[];
}

export interface BugReport {
  id: string;
  title: string;
  description: string;
  module: BugModule;
  severity: BugSeverity;
  status: BugStatus;
  reporterName: string;
  reporterRole: string;
  reporterId: string;
  notionPageId: string | null;
  notionPageUrl: string | null;
  createdAt: string;
  updatedAt: string;
  attachments: BugAttachment[];
  comments: BugComment[];
  technicalContext: BugTechnicalContext;
}

export const MOCK_BUGS: BugReport[] = [
  {
    id: "bug-001",
    title: "Vendor compliance dashboard fails to load when filtering by expired",
    description:
      "Steps:\n1. Open Vendor Compliance\n2. Filter status = Expired\n3. Page spinner stays forever\n\nExpected: filtered list of expired vendors\nActual: infinite spinner, no error toast",
    module: "Vendors",
    severity: "high",
    status: "in_progress",
    reporterName: "Carter Hughes",
    reporterRole: "Property Manager",
    reporterId: "u-carter",
    notionPageId: "notion-abc-123",
    notionPageUrl: "https://www.notion.so/Bug-001",
    createdAt: "2026-04-12T14:23:00Z",
    updatedAt: "2026-04-14T09:11:00Z",
    attachments: [
      { id: "a1", filename: "spinner.png", mime: "image/png", url: "" },
    ],
    comments: [
      {
        id: "c1",
        authorName: "Megha K",
        authorRole: "Admin",
        body: "Reproduced on staging — filter param is being sent twice. Looking into the data layer.",
        createdAt: "2026-04-13T16:42:00Z",
        source: "notion",
      },
    ],
    technicalContext: {
      url: "https://avm.app/vendor-compliance?status=expired",
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15",
      viewport: "1512x982",
      userRole: "property_manager",
      capturedAt: "2026-04-12T14:22:58Z",
      consoleLogs: [
        { ts: "2026-04-12T14:22:55Z", level: "warn", message: "duplicate query param: status" },
        { ts: "2026-04-12T14:22:57Z", level: "error", message: "GET /vendors/compliance 500" },
      ],
    },
  },
  {
    id: "bug-002",
    title: "Work order PDF export is missing line items",
    description:
      "Generated PDF for WO-4421 only shows the header — line items section is blank. Web view shows them correctly.",
    module: "Maintenance",
    severity: "medium",
    status: "triaged",
    reporterName: "Jordan Lee",
    reporterRole: "Field Manager",
    reporterId: "u-jordan",
    notionPageId: "notion-abc-124",
    notionPageUrl: "https://www.notion.so/Bug-002",
    createdAt: "2026-04-10T10:00:00Z",
    updatedAt: "2026-04-11T08:00:00Z",
    attachments: [],
    comments: [],
    technicalContext: {
      url: "https://avm.app/work-orders/4421",
      userAgent: "Mozilla/5.0",
      viewport: "1440x900",
      userRole: "field_team_member",
      capturedAt: "2026-04-10T09:59:00Z",
      consoleLogs: [],
    },
  },
  {
    id: "bug-003",
    title: "Inspection photos upload but don't appear in gallery until refresh",
    description: "After uploading 4 photos to an inspection, they don't show until I reload the page.",
    module: "Inspections",
    severity: "low",
    status: "open",
    reporterName: "Carter Hughes",
    reporterRole: "Property Manager",
    reporterId: "u-carter",
    notionPageId: null,
    notionPageUrl: null,
    createdAt: "2026-04-14T18:30:00Z",
    updatedAt: "2026-04-14T18:30:00Z",
    attachments: [],
    comments: [],
    technicalContext: {
      url: "https://avm.app/fto/inspections/9921",
      userAgent: "Mozilla/5.0",
      viewport: "390x844",
      userRole: "field_team_member",
      capturedAt: "2026-04-14T18:29:50Z",
      consoleLogs: [],
    },
  },
  {
    id: "bug-004",
    title: "Bills page total includes voided invoices",
    description: "The summary tile at the top of /bills shows a total that includes voided invoices, throwing off the running balance.",
    module: "Accounting",
    severity: "blocker",
    status: "resolved",
    reporterName: "Megha K",
    reporterRole: "Admin",
    reporterId: "u-megha",
    notionPageId: "notion-abc-125",
    notionPageUrl: "https://www.notion.so/Bug-004",
    createdAt: "2026-04-02T12:00:00Z",
    updatedAt: "2026-04-08T15:00:00Z",
    attachments: [],
    comments: [
      {
        id: "c2",
        authorName: "Megha K",
        authorRole: "Admin",
        body: "Fixed in #PR-882. Filter now excludes status=voided in the aggregate query.",
        createdAt: "2026-04-08T15:00:00Z",
        source: "notion",
      },
    ],
    technicalContext: {
      url: "https://avm.app/bills",
      userAgent: "Mozilla/5.0",
      viewport: "1512x982",
      userRole: "admin",
      capturedAt: "2026-04-02T11:59:30Z",
      consoleLogs: [],
    },
  },
];
