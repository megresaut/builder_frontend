import { createContext, useContext } from "react";

interface TabMetadata {
  label: string;
  sectionId?: string; // The section being viewed (e.g., "bills", "field-team-orders")
  route?: string; // Current route/page for this tab
  scrollPosition?: number; // Scroll position within the tab
  selectedWorkOrderId?: number | null; // Track which work order is being viewed
  activeTab?: string; // Track which tab within a page is active (e.g., "summary", "workorders")
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
