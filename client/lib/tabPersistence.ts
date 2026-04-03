/**
 * Tab state persistence for browser-like behavior across refreshes.
 * Uses sessionStorage so tabs survive refresh but not browser close.
 */

const STORAGE_KEY = "avm-tab-state";
const MAX_TABS = 50;
const MAX_METADATA_KEYS = 100;

export interface PersistedTabMetadata {
  label: string;
  sectionId?: string;
  route?: string;
  scrollPosition?: number;
  [key: string]: unknown;
}

export interface PersistedTabState {
  tabs: { id: string; label: string }[];
  openTabs: string[];
  selectedTab: string;
  tabMetadata: Record<string, PersistedTabMetadata>;
  nextNewTabId: number;
}

const defaultMetadata: Record<string, PersistedTabMetadata> = {
  properties: { label: "Properties", route: "/properties" },
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

function sanitizeMetadata(
  meta: Record<string, PersistedTabMetadata>
): Record<string, PersistedTabMetadata> {
  const out: Record<string, PersistedTabMetadata> = {};
  const keys = Object.keys(meta).slice(0, MAX_METADATA_KEYS);
  for (const k of keys) {
    const m = meta[k];
    if (m && typeof m === "object" && typeof m.label === "string") {
      out[k] = {
        label: m.label,
        ...(typeof m.sectionId === "string" && { sectionId: m.sectionId }),
        ...(typeof m.route === "string" && { route: m.route }),
        ...(typeof m.scrollPosition === "number" && {
          scrollPosition: m.scrollPosition,
        }),
      };
    }
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
      tabs.some((t) => t.id === id)
    );
    if (openTabs.length === 0) openTabs.push("properties");
    const selectedTab =
      typeof parsed.selectedTab === "string" && openTabs.includes(parsed.selectedTab)
        ? parsed.selectedTab
        : openTabs[0];
    const tabMetadata = sanitizeMetadata(
      (parsed.tabMetadata as Record<string, PersistedTabMetadata>) || {}
    );
    const nextNewTabId =
      typeof parsed.nextNewTabId === "number" && parsed.nextNewTabId >= 1
        ? parsed.nextNewTabId
        : 1;
    return {
      tabs,
      openTabs,
      selectedTab,
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
    const toSave: PersistedTabState = {
      tabs: state.tabs.slice(0, MAX_TABS),
      openTabs: state.openTabs,
      selectedTab: state.selectedTab,
      tabMetadata: sanitizeMetadata(state.tabMetadata),
      nextNewTabId: state.nextNewTabId,
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch {
    // ignore
  }
}
