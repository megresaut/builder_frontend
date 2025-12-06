import { createContext, useContext } from "react";

interface TabContextType {
  selectedTab: string;
  setSelectedTab: (tabId: string) => void;
}

export const TabContext = createContext<TabContextType | undefined>(undefined);

export const useTabContext = () => {
  const context = useContext(TabContext);
  if (!context) {
    throw new Error("useTabContext must be used within a TabProvider");
  }
  return context;
};
