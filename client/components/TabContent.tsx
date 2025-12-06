import React, { useContext } from "react";
import { TabContext } from "@/hooks/useTabContext";
import Index from "@/pages/Index";

export default function TabContent() {
  const tabContext = useContext(TabContext);
  
  if (!tabContext) {
    return <Index />;
  }

  const { selectedTab } = tabContext;

  // Check if this is a new tab
  if (selectedTab.startsWith("new-tab-")) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">New Tab</h1>
          <p className="text-gray-500">This is a new empty tab. Start creating content here.</p>
        </div>
      </div>
    );
  }

  // For default tabs, show the Index page
  if (selectedTab === "properties") {
    return <Index />;
  }

  // Default to Index for other tabs
  return <Index />;
}
