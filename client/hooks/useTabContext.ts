import { createContext, useContext } from "react";

export interface TabMetadata {
  label: string;
  sectionId?: string; // The section being viewed (e.g., "bills", "field-team-orders")
  route?: string; // Current route/page for this tab
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
  // Any other page-specific state
  pageState?: Record<string, unknown>;
  // History tracking for this tab
  history?: string[]; // Array of routes visited in this tab
  historyIndex?: number; // Current position in history
}

/** Serializable tab entry for persistence (no React nodes). */
export interface TabEntry {
  id: string;
  label: string;
}

interface TabContextType {
  selectedTab: string;
  setSelectedTab: (tabId: string) => void;
  tabMetadata: Record<string, TabMetadata>;
  setTabMetadata: (tabId: string, metadata: TabMetadata) => void;
  // Tab list state (persisted with tab state)
  tabs: TabEntry[];
  setTabs: (tabs: TabEntry[] | ((prev: TabEntry[]) => TabEntry[])) => void;
  openTabs: string[];
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
