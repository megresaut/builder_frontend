import React, { useContext } from "react";
import { TabContext } from "@/hooks/useTabContext";
import AllProperties from "@/pages/AllProperties";
import Bills from "@/pages/Bills";
import FieldTeamOrders from "@/pages/FieldTeamOrders";

export default function TabContent() {
  const tabContext = useContext(TabContext);

  if (!tabContext) {
    return <AllProperties />;
  }

  const { selectedTab, tabMetadata } = tabContext;
  const metadata = tabMetadata[selectedTab];

  // Check if this is a new tab without a section assigned
  if (selectedTab.startsWith("new-tab-") && !metadata?.sectionId) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">New Tab</h1>
          <p className="text-gray-500">Select a section from the sidebar to get started</p>
        </div>
      </div>
    );
  }

  // Render based on the section ID
  if (metadata?.sectionId === "bills") {
    return <Bills />;
  }

  if (metadata?.sectionId === "field-team-orders") {
    return <FieldTeamOrders />;
  }

  // For default tabs, show the All Properties page
  if (selectedTab === "properties") {
    return <AllProperties />;
  }

  // Default to All Properties for other tabs
  return <AllProperties />;
}
