/**
 * Tab state persistence for browser-like behavior across refreshes.
 * Uses sessionStorage so tabs survive refresh but not browser close.
 *
 * Persisted fields are explicitly whitelisted: anything not listed here
 * gets dropped on save. Per-tab history + pageState are now persisted
 * (previously they were silently stripped, killing the ←/→ arrows and
 * any usePageState value after a refresh).
 */

const STORAGE_KEY = "avm-tab-state";
const MAX_TABS = 50;
const MAX_METADATA_KEYS = 100;
const MAX_HISTORY_PER_TAB = 50;
const MAX_PAGESTATE_BYTES_PER_TAB = 10 * 1024; // 10 KB

export interface PersistedTabMetadata {
  label: string;
  sectionId?: string;
  route?: string;
  scrollPosition?: number;
  history?: string[];
  historyIndex?: number;
  pageState?: Record<string, unknown>;
}

export interface PersistedTabState {
  tabs: { id: string; label: string }[];
  openTabs: string[];
  selectedTab: string;
  tabMetadata: Record<string, PersistedTabMetadata>;
  nextNewTabId: number;
}

const defaultMetadata: Record<string, PersistedTabMetadata> = {
  properties: { label: "Properties", route: "/" },
  portfolio: { label: "Portfolio", sectionId: "portfolio" },
  screening: { label: "Screening", sectionId: "screening" },
  bills: { label: "Bills", sectionId: "bills" },
  "field-team-orders": {
    label: "Field Team Orders",
    sectionId: "field-team-orders",
  },
  "work-orders": { label: "Work Orders", sectionId: "work-orders" },
};

const defaultTabs: { id: string; label: string }[] = [
  { id: "portfolio", label: "Portfolio" },
  { id: "properties", label: "Properties" },
  { id: "screening", label: "Screening" },
  { id: "bills", label: "Bills" },
  { id: "field-team-orders", label: "Field Team Orders" },
  { id: "work-orders", label: "Work Orders" },
];

export function getDefaultTabState(): PersistedTabState {
  return {
    tabs: [...defaultTabs],
    openTabs: ["properties"],
    selectedTab: "properties",
    tabMetadata: { ...defaultMetadata },
    nextNewTabId: 1,
  };
}

/** Best-effort: keep only JSON-serializable, plain values. Cap total size. */
function sanitizePageState(raw: unknown): Record<string, unknown> | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  try {
    const json = JSON.stringify(raw);
    if (typeof json !== "string") return undefined;
    if (json.length > MAX_PAGESTATE_BYTES_PER_TAB) {
      // Too big — drop it rather than truncate to a corrupt slice.
      return undefined;
    }
    const parsed = JSON.parse(json);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : undefined;
  } catch {
    return undefined;
  }
}

function sanitizeHistory(raw: unknown): string[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const out: string[] = [];
  for (const v of raw) {
    if (typeof v === "string" && v.length > 0 && v.length < 2048) {
      out.push(v);
    }
    if (out.length >= MAX_HISTORY_PER_TAB) break;
  }
  return out.length > 0 ? out : undefined;
}

function sanitizeMetadata(
  meta: Record<string, PersistedTabMetadata>,
): Record<string, PersistedTabMetadata> {
  const out: Record<string, PersistedTabMetadata> = {};
  const keys = Object.keys(meta).slice(0, MAX_METADATA_KEYS);
  for (const k of keys) {
    const m = meta[k];
    if (!m || typeof m !== "object" || typeof m.label !== "string") continue;
    const cleaned: PersistedTabMetadata = { label: m.label };
    if (typeof m.sectionId === "string") cleaned.sectionId = m.sectionId;
    if (typeof m.route === "string") cleaned.route = m.route;
    if (typeof m.scrollPosition === "number") cleaned.scrollPosition = m.scrollPosition;
    const history = sanitizeHistory(m.history);
    if (history) {
      cleaned.history = history;
      if (typeof m.historyIndex === "number") {
        // Clamp to a valid index.
        cleaned.historyIndex = Math.max(0, Math.min(m.historyIndex, history.length - 1));
      }
    }
    const pageState = sanitizePageState(m.pageState);
    if (pageState) cleaned.pageState = pageState;
    out[k] = cleaned;
  }
  return out;
}

export function loadTabState(): PersistedTabState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedTabState;
    if (!parsed || !Array.isArray(parsed.tabs) || !Array.isArray(parsed.openTabs)) {
      return null;
    }
    const tabs = (parsed.tabs as { id: string; label: string }[])
      .filter((t) => t && typeof t.id === "string" && typeof t.label === "string")
      .slice(0, MAX_TABS);
    const openTabs = [...new Set(parsed.openTabs as string[])].filter((id) =>
      tabs.some((t) => t.id === id),
    );
    if (openTabs.length === 0) openTabs.push("properties");
    const selectedTab =
      typeof parsed.selectedTab === "string" && openTabs.includes(parsed.selectedTab)
        ? parsed.selectedTab
        : openTabs[0];
    const tabMetadata = sanitizeMetadata(
      (parsed.tabMetadata as Record<string, PersistedTabMetadata>) || {},
    );
    const nextNewTabId =
      typeof parsed.nextNewTabId === "number" && parsed.nextNewTabId >= 1
        ? parsed.nextNewTabId
        : 1;
    return {
      tabs,
      openTabs,
      selectedTab,
      // Default metadata wins for fields that weren't in the persisted snapshot,
      // but persisted entries override defaults (so a route/history a tab has
      // been navigated to survives across refresh).
      tabMetadata: { ...defaultMetadata, ...tabMetadata },
      nextNewTabId,
    };
  } catch {
    return null;
  }
}

export function saveTabState(state: PersistedTabState): void {
  if (typeof window === "undefined") return;
  try {
    const tabs = state.tabs.slice(0, MAX_TABS);
    const liveIds = new Set(tabs.map((t) => t.id));
    // Prune orphan metadata so closed tabs don't accumulate in sessionStorage.
    const liveMeta: Record<string, PersistedTabMetadata> = {};
    for (const id of Object.keys(state.tabMetadata)) {
      if (liveIds.has(id)) liveMeta[id] = state.tabMetadata[id];
    }
    const toSave: PersistedTabState = {
      tabs,
      openTabs: state.openTabs.filter((id) => liveIds.has(id)),
      selectedTab: liveIds.has(state.selectedTab) ? state.selectedTab : (state.openTabs[0] || "properties"),
      tabMetadata: sanitizeMetadata(liveMeta),
      nextNewTabId: state.nextNewTabId,
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch {
    // ignore (quota exceeded, etc.)
  }
}
