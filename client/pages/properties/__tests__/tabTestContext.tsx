import { TabContext } from "@/hooks/useTabContext";

/** Static TabContext for tests that render a page outside App's provider. */
export function StaticTabProvider({
  children,
  tabId = "test-tab",
}: {
  children: React.ReactNode;
  tabId?: string;
}) {
  const value = {
    selectedTab: tabId,
    setSelectedTab: () => {},
    tabMetadata: {},
    setTabMetadata: () => {},
    tabs: [{ id: tabId, label: "Test" }],
    setTabs: () => {},
    openTabs: new Set([tabId]),
    setOpenTabs: () => {},
    nextNewTabId: 1,
    setNextNewTabId: () => {},
  };
  return <TabContext.Provider value={value}>{children}</TabContext.Provider>;
}
