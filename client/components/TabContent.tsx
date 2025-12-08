import React, { useContext, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { TabContext } from "@/hooks/useTabContext";
import Index from "@/pages/Index";
import AllProperties from "@/pages/AllProperties";
import Bills from "@/pages/Bills";
import FieldTeamOrders from "@/pages/FieldTeamOrders";
import WorkOrders from "@/pages/WorkOrders";

export default function TabContent() {
  const tabContext = useContext(TabContext);
  const location = useLocation();
  const navigate = useNavigate();

  // Update selected tab based on route changes
  useEffect(() => {
    if (!tabContext) return;

    const { setSelectedTab, setTabMetadata } = tabContext;
    const path = location.pathname;

    if (path === "/bills") {
      setSelectedTab("bills");
      setTabMetadata("bills", {
        label: "Bills",
        sectionId: "bills",
        route: path,
      });
    } else if (path === "/field-team-orders") {
      setSelectedTab("field-team-orders");
      setTabMetadata("field-team-orders", {
        label: "Field Team Orders",
        sectionId: "field-team-orders",
        route: path,
      });
    } else if (path === "/work-orders") {
      setSelectedTab("work-orders");
      setTabMetadata("work-orders", {
        label: "Work Orders",
        sectionId: "work-orders",
        route: path,
      });
    } else if (path === "/all-properties") {
      setSelectedTab("properties");
    }
  }, [location.pathname, tabContext, navigate]);

  // Restore scroll position when tab content changes
  useEffect(() => {
    if (!tabContext) return;

    const mainContent = document.querySelector('[data-testid="main-content"]');
    if (mainContent) {
      const metadata = tabContext.tabMetadata[tabContext.selectedTab];
      const scrollPos = metadata?.scrollPosition || 0;
      // Use setTimeout to ensure DOM has updated
      setTimeout(() => {
        mainContent.scrollTop = scrollPos;
      }, 0);
    }
  }, [
    tabContext?.selectedTab,
    tabContext?.tabMetadata[tabContext?.selectedTab || ""]?.route,
  ]);

  if (!tabContext) {
    return <Index />;
  }

  const { selectedTab, tabMetadata } = tabContext;
  const metadata = tabMetadata[selectedTab];

  // Check if this is a new tab without a section assigned
  if (selectedTab.startsWith("new-tab-") && !metadata?.sectionId) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">New Tab</h1>
          <p className="text-gray-500">
            Select a section from the sidebar to get started
          </p>
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

  if (metadata?.sectionId === "work-orders") {
    return <WorkOrders />;
  }

  // For default tabs, show the Index page
  if (selectedTab === "properties") {
    return <Index />;
  }

  // Default to Index page for other tabs
  return <Index />;
}
