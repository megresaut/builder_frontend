import { createContext, useContext } from "react";

interface TabMetadata {
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
}

interface TabContextType {
  selectedTab: string;
  setSelectedTab: (tabId: string) => void;
  tabMetadata: Record<string, TabMetadata>;
  setTabMetadata: (tabId: string, metadata: TabMetadata) => void;
}

export const TabContext = createContext<TabContextType | undefined>(undefined);

export const useTabContext = () => {
  const context = useContext(TabContext);
  if (!context) {
    throw new Error("useTabContext must be used within a TabProvider");
  }
  return context;
};
