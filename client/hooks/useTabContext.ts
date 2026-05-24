import { createContext, useCallback, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export interface TabMetadata {
  label: string;
  sectionId?: string; // Coarse section the route lives in (used for icon + sidebar active state)
  route?: string; // Current route/page for this tab (pathname + search)
  scrollPosition?: number; // Scroll position within the tab
  selectedWorkOrderId?: number | null; // Track which work order is being viewed
  activeTab?: string; // Track which tab within a page is active (e.g., "summary", "workorders")
  // Pagination state
  currentPage?: number;
  itemsPerPage?: number;
  // UI state
  showPageSizeDropdown?: boolean;
  openMenuId?: number | null;
  isCreateTaskModalOpen?: boolean;
  isRecordBillModalOpen?: boolean;
  isAddVendorModalOpen?: boolean;
  selectedTab?: string; // For Bills: approved/drafts
  // Filter/search state
  searchQuery?: string;
  filters?: Record<string, unknown>;
  // Page-scoped state owned by usePageState. Keyed by string key chosen by the page.
  pageState?: Record<string, unknown>;
  // Per-tab navigation stack (NOT the browser's history — siloed per tab).
  history?: string[];
  historyIndex?: number;
}

/** Serializable tab entry for persistence (no React nodes). */
export interface TabEntry {
  id: string;
  label: string;
}

export interface TabContextType {
  selectedTab: string;
  setSelectedTab: (tabId: string) => void;
  tabMetadata: Record<string, TabMetadata>;
  /** Partial update — fields not present are left untouched (pageState is deep-merged). */
  setTabMetadata: (tabId: string, metadata: Partial<TabMetadata>) => void;
  /** Tab list state (persisted with tab state) */
  tabs: TabEntry[];
  setTabs: (tabs: TabEntry[] | ((prev: TabEntry[]) => TabEntry[])) => void;
  openTabs: Set<string>;
  setOpenTabs: (openTabs: string[] | Set<string> | ((prev: Set<string>) => Set<string>)) => void;
  nextNewTabId: number;
  setNextNewTabId: (n: number | ((prev: number) => number)) => void;
}

export const TabContext = createContext<TabContextType | undefined>(undefined);

export const useTabContext = () => {
  const context = useContext(TabContext);
  if (!context) {
    throw new Error("useTabContext must be used within a TabProvider");
  }
  return context;
};

/**
 * Tab-aware navigation. Use this instead of `useNavigate().navigate(-1)` whenever
 * you want to honor *this tab's* history rather than the browser-global history
 * (which is shared across all tabs and gets clobbered by tab switching).
 *
 * Must be called from inside the BrowserRouter (any route component qualifies).
 */
export interface UseTabNavigation {
  goBack: (options?: { fallback?: string }) => void;
  goForward: () => void;
  canGoBack: boolean;
  canGoForward: boolean;
}

export function useTabNavigation(): UseTabNavigation {
  const ctx = useTabContext();
  const navigate = useNavigate();
  const location = useLocation();

  const { selectedTab, tabMetadata, setTabMetadata } = ctx;
  const meta = tabMetadata[selectedTab];
  const history = meta?.history ?? [];
  const historyIndex = meta?.historyIndex ?? 0;

  const canGoBack = historyIndex > 0;
  const canGoForward = historyIndex < history.length - 1;

  const goBack = useCallback(
    (options?: { fallback?: string }) => {
      const m = tabMetadata[selectedTab];
      const h = m?.history ?? [];
      const idx = m?.historyIndex ?? 0;
      if (idx > 0) {
        navigate(h[idx - 1], { replace: true });
        return;
      }
      if (options?.fallback && options.fallback !== location.pathname + location.search) {
        navigate(options.fallback, { replace: true });
      }
    },
    [selectedTab, tabMetadata, navigate, location.pathname, location.search],
  );

  const goForward = useCallback(() => {
    const m = tabMetadata[selectedTab];
    const h = m?.history ?? [];
    const idx = m?.historyIndex ?? 0;
    if (idx < h.length - 1) {
      navigate(h[idx + 1], { replace: true });
    }
  }, [selectedTab, tabMetadata, navigate]);

  return { goBack, goForward, canGoBack, canGoForward };
}
