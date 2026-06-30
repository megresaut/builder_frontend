/**
 * Single source of truth for "what tab is this URL?".
 *
 * Replaces four duplicated mappings that used to live in Header, Sidebar,
 * ShellLayout, and usePageState. Add a new route here once — all four
 * consumers pick it up.
 *
 * Shape:
 *   identifyRoute(pathname, search, displayNames) → RouteIdentity | null
 *
 * Returned fields:
 *   - resourceId: stable identifier per resource (task-9, property-42, bills, etc.)
 *                 used as the scroll-memory key + favorites id.
 *   - label:      human-readable name shown on the tab.
 *   - sectionId:  coarse section the route lives in (used for icon + sidebar
 *                 active-state). Identical to resourceId for non-detail routes.
 */

export interface RouteIdentity {
  resourceId: string;
  label: string;
  sectionId: string;
  /** The full path used to land here — preserved for breadcrumbs / refresh restore. */
  path: string;
}

export interface DisplayNames {
  property?: string | null;
  vendor?: string | null;
  task?: string | null;
}

const SETTINGS_SECTION_LABELS: Record<string, string> = {
  bugs: "Bug Reports",
  profile: "Profile",
  notifications: "Notifications",
  integrations: "Integrations",
};

export function identifyRoute(
  pathname: string,
  search: string,
  displayNames: DisplayNames = {},
): RouteIdentity | null {
  const fullPath = pathname + search;

  // ---- Resource detail routes (parameterized) ----
  {
    const m = pathname.match(/^\/tasks\/(\d+)/);
    if (m) {
      const id = m[1];
      return {
        resourceId: `task-${id}`,
        label: displayNames.task ?? `Task ${id}`,
        sectionId: "all-tasks",
        path: fullPath,
      };
    }
  }

  {
    const m = pathname.match(/^\/property\/(\d+)(?:\/(\w+))?/);
    if (m) {
      const id = m[1];
      const sub = m[2];
      const base = displayNames.property ?? `Property ${id}`;
      if (sub && sub !== "Overview") {
        return {
          resourceId: `property-${id}-${sub}`,
          label: `${base} - ${sub}`,
          sectionId: "all-properties",
          path: fullPath,
        };
      }
      return {
        resourceId: `property-${id}`,
        label: base,
        sectionId: "all-properties",
        path: fullPath,
      };
    }
  }

  {
    const m = pathname.match(/^\/vendors\/(\d+)/);
    if (m) {
      const id = m[1];
      return {
        resourceId: `vendor-${id}`,
        label: displayNames.vendor ?? `Vendor ${id}`,
        sectionId: "vendors",
        path: fullPath,
      };
    }
  }

  // ---- Record-bill family (canonical and property-scoped) ----
  if (pathname === "/record-bill" || pathname === "/bills/record" || pathname.includes("/bills/record")) {
    let resourceId = "record-bill";
    if (pathname.includes("/property/")) {
      const m = pathname.match(/\/property\/(\d+)/);
      if (m) resourceId = `record-bill-property-${m[1]}`;
    }
    return { resourceId, label: "Record Bill", sectionId: "bills", path: fullPath };
  }

  // ---- Settings ----
  if (pathname.startsWith("/settings")) {
    const parts = pathname.split("/").filter(Boolean); // ["settings", section?, id?]
    const section = parts[1] || "bugs";
    const sectionLabel = SETTINGS_SECTION_LABELS[section] || "Settings";
    if (section === "bugs" && parts[2]) {
      return {
        resourceId: `settings-bug-${parts[2]}`,
        label: "Settings - Bug Report",
        sectionId: `settings-${section}`,
        path: fullPath,
      };
    }
    return {
      resourceId: `settings-${section}`,
      label: `Settings - ${sectionLabel}`,
      sectionId: `settings-${section}`,
      path: fullPath,
    };
  }

  // ---- Operations (tab=reminders | calendar) ----
  if (pathname === "/operations") {
    const opsTab = new URLSearchParams(search).get("tab");
    if (opsTab === "reminders") {
      return { resourceId: "operations-reminders", label: "Reminders", sectionId: "operations-reminders", path: fullPath };
    }
    return { resourceId: "operations", label: "Calendar", sectionId: "operations-calendar", path: fullPath };
  }

  // ---- Simple 1:1 routes ----
  const simple: Record<string, { label: string; sectionId?: string }> = {
    "/": { label: "Dashboard", sectionId: "dashboard" },
    "/dashboard": { label: "Dashboard", sectionId: "dashboard" },
    "/blank": { label: "New Tab", sectionId: "" },
    "/inspection-dashboard": { label: "Inspections", sectionId: "inspection-dashboard" },
    "/insurance": { label: "Insurance", sectionId: "insurance" },
    "/all-tasks": { label: "All Tasks", sectionId: "all-tasks" },
    "/utilities": { label: "Utilities", sectionId: "utilities" },
    "/utilities/view-bill": { label: "View Bill", sectionId: "utilities-view-bill" },
    "/bills": { label: "Bills", sectionId: "bills" },
    "/chart-of-accounts": { label: "Chart of Accounts", sectionId: "chart-of-accounts" },
    "/accounting/general-ledger": { label: "General Ledger", sectionId: "general-ledger" },
    "/accounting/transaction-list": { label: "Transaction List", sectionId: "transaction-list" },
    "/accounting/invoices": { label: "Invoices", sectionId: "accounting-invoices" },
    "/accounting/vendor-credits": { label: "Vendor Credits", sectionId: "vendor-credits" },
    "/reconciliation": { label: "Reconciliation", sectionId: "reconciliation" },
    "/reimbursements": { label: "Reimbursements", sectionId: "reimbursements" },
    "/vendor-compliance": { label: "Vendor Compliance", sectionId: "vendor-compliance" },
    "/all-properties": { label: "All Properties", sectionId: "all-properties" },
    "/field-team-orders": { label: "Field Team Orders", sectionId: "field-team-orders" },
    "/work-orders": { label: "Work Orders", sectionId: "work-orders" },
    "/activity-feed": { label: "Activity Feed", sectionId: "activity-feed" },
    "/recurring-tasks": { label: "Recurring Tasks", sectionId: "recurring-tasks" },
    "/vendors": { label: "Vendors", sectionId: "vendors" },
    "/ai-drafts": { label: "Drafts", sectionId: "ai-drafts" },
  };

  const exact = simple[pathname];
  if (exact) {
    const sectionId = exact.sectionId ?? pathname.slice(1).replace(/\//g, "-");
    const resourceId = sectionId || "blank";
    return { resourceId, label: exact.label, sectionId, path: fullPath };
  }

  // ---- Fallback: derive a sensible label from the path ----
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length > 0) {
    const last = segments[segments.length - 1];
    const label = last
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
    const id = segments.join("-");
    return { resourceId: id, label, sectionId: id, path: fullPath };
  }

  return null;
}

/**
 * Maps a route's sectionId to the default-tab id it should activate in the
 * sidebar. Used by Sidebar for highlighting the parent category icon.
 */
const SECTION_TO_TAB_BAR_ID: Record<string, string> = {
  "all-properties": "properties",
  "inspection-dashboard": "properties",
  insurance: "properties",
  bills: "bills",
  "all-tasks": "field-team-orders",
  "recurring-tasks": "field-team-orders",
  "field-team-orders": "field-team-orders",
  "work-orders": "work-orders",
  vendors: "field-team-orders",
  "vendor-compliance": "field-team-orders",
  "operations-calendar": "operations",
  "operations-reminders": "operations",
  "activity-feed": "field-team-orders",
};

export function tabBarIdForSection(sectionId: string | undefined): string | undefined {
  if (!sectionId) return undefined;
  return SECTION_TO_TAB_BAR_ID[sectionId];
}
