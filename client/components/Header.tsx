import React, { useState, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { TabContext } from "@/hooks/useTabContext";
import { useFavorites } from "@/hooks/FavoritesContext";

interface Tab {
  id: string;
  icon: React.ReactNode;
  label: string;
}

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { addFavorite, removeFavorite, isFavorite } = useFavorites();

  const getCurrentPageLabel = (): { label: string; path: string; id: string } | null => {
    const path = location.pathname;

    if (path.includes("/property/")) {
      const match = path.match(/\/property\/(\d+)(?:\/(\w+))?/);
      if (match) {
        const propertyId = match[1];
        const tab = match[2];

        // Map property types for unique identification
        const propertyTypes: Record<string, string> = {
          "1": "Concierge",
          "2": "Rental",
          "3": "Commercial",
          "4": "OR",
          "5": "HOA",
          "6": "Concierge",
          "7": "Concierge",
          "8": "Concierge",
          "9": "Concierge",
          "10": "Concierge",
        };

        const propertyType = propertyTypes[propertyId] || "Property";
        const label = `${propertyType} - Property ${propertyId}`;

        if (tab && tab !== "Overview") {
          return { label: `${label} - ${tab}`, path, id: `property-${propertyId}-${tab}` };
        }
        return { label, path, id: `property-${propertyId}` };
      }
    } else if (path === "/all-properties") {
      return { label: "All Properties", path, id: "all-properties" };
    } else if (path === "/utilities") {
      return { label: "Utilities", path, id: "utilities" };
    } else if (path === "/bills") {
      return { label: "Bills", path, id: "bills" };
    } else if (path === "/field-team-orders") {
      return { label: "Field Team Orders", path, id: "field-team-orders" };
    }

    return null;
  };

  const currentPage = getCurrentPageLabel();
  const isCurrentPageFavorite = currentPage ? isFavorite(currentPage.id) : false;

  const handleFavoriteClick = () => {
    if (currentPage) {
      if (isCurrentPageFavorite) {
        removeFavorite(currentPage.id);
      } else {
        addFavorite({ id: currentPage.id, label: currentPage.label, path: currentPage.path });
      }
    }
  };

  const getBreadcrumbItems = () => {
    const path = location.pathname;
    const items: { label: string; href?: string }[] = [];

    if (path.includes("/property/")) {
      const match = path.match(/\/property\/(\d+)(?:\/(\w+))?/);
      if (match) {
        const propertyId = match[1];
        const tab = match[2];
        items.push({ label: "Properties", href: "/all-properties" });

        // Map property IDs to addresses
        const propertyAddresses: Record<string, string> = {
          "1": "22 Indian Chase Dr, Greenwich, CT",
          "2": "22 Indian Chase Dr, Greenwich, CT",
          "3": "22 Indian Chase Dr, Greenwich, CT",
          "4": "22 Indian Chase Dr, Greenwich, CT",
          "5": "22 Indian Chase Dr, Greenwich, CT",
          "6": "22 Indian Chase Dr, Greenwich, CT",
          "7": "22 Indian Chase Dr, Greenwich, CT",
          "8": "22 Indian Chase Dr, Greenwich, CT",
          "9": "22 Indian Chase Dr, Greenwich, CT",
          "10": "22 Indian Chase Dr, Greenwich, CT",
        };

        items.push({ label: propertyAddresses[propertyId] || "Property" });

        if (tab && tab !== "Overview") {
          items.push({ label: tab });
        }
      }
    } else if (path === "/all-properties") {
      items.push({ label: "All Properties" });
    } else if (path === "/utilities") {
      items.push({ label: "Utilities" });
    } else if (path === "/bills") {
      items.push({ label: "Bills" });
    } else if (path === "/field-team-orders") {
      items.push({ label: "Field Team Orders" });
    }

    return items;
  };

  const breadcrumbItems = getBreadcrumbItems();

  const defaultTabs: Tab[] = [
    {
      id: "portfolio",
      label: "Portfolio",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 3v16a2 2 0 0 0 2 2h16" />
          <path d="M18 17V9" />
          <path d="M13 17V5" />
          <path d="M8 17v-3" />
        </svg>
      ),
    },
    {
      id: "properties",
      label: "Properties",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
          <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
          <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
          <path d="M10 6h4" />
          <path d="M10 10h4" />
          <path d="M10 14h4" />
          <path d="M10 18h4" />
        </svg>
      ),
    },
    {
      id: "screening",
      label: "Screening",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m16 11 2 2 4-4" />
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
        </svg>
      ),
    },
  ];

  const [tabs, setTabs] = useState<Tab[]>(defaultTabs);
  const [openTabs, setOpenTabs] = useState<Set<string>>(
    new Set(["properties"]),
  );
  const [nextNewTabId, setNextNewTabId] = useState(1);
  const tabContext = useContext(TabContext);

  if (!tabContext) {
    throw new Error("Header must be used within TabContext provider");
  }

  const { selectedTab, setSelectedTab } = tabContext;

  const toggleTab = (tabId: string, isClosing: boolean = false) => {
    const newTabs = new Set(openTabs);
    if (newTabs.has(tabId)) {
      // Prevent closing the last tab
      if (newTabs.size > 1) {
        // If closing the selected tab, select the next tab to the right
        if (isClosing && selectedTab === tabId) {
          // Get the current order of open tabs
          const openTabsArray = tabs.filter((tab) => openTabs.has(tab.id));
          const closedTabIndex = openTabsArray.findIndex(
            (tab) => tab.id === tabId,
          );

          // Determine which tab to select next
          let nextTabId: string;
          if (closedTabIndex === openTabsArray.length - 1) {
            // If closing the rightmost tab, select the one to its left
            nextTabId = openTabsArray[closedTabIndex - 1].id;
          } else {
            // Otherwise, select the next tab to the right
            nextTabId = openTabsArray[closedTabIndex + 1].id;
          }
          setSelectedTab(nextTabId);
        }

        newTabs.delete(tabId);
      }
    } else {
      newTabs.add(tabId);
      // Selecting a tab
      setSelectedTab(tabId);
    }
    setOpenTabs(newTabs);
  };

  const addNewTab = () => {
    const newTabId = `new-tab-${nextNewTabId}`;
    const newTab: Tab = {
      id: newTabId,
      label: "New Tab",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
      ),
    };

    setTabs([...tabs, newTab]);
    setOpenTabs(new Set([...openTabs, newTabId]));
    setSelectedTab(newTabId);
    tabContext.setTabMetadata(newTabId, { label: "New Tab" });
    setNextNewTabId(nextNewTabId + 1);
  };

  return (
    <header className="bg-white">
      {/* Tabs Section */}
      <div
        className="flex items-center gap-0 px-0 py-0 bg-[#f7f7f7]"
        style={{
          borderBottomWidth: "0px",
          borderColor: "rgb(210, 209, 207)",
          borderLeftWidth: "0px",
        }}
      >
        {tabs
          .filter((tab) => openTabs.has(tab.id))
          .map((tab) => {
            const isSelected = tab.id === selectedTab;
            const displayLabel =
              tabContext.tabMetadata[tab.id]?.label || tab.label;
            return (
              <div
                key={tab.id}
                className="flex items-center transition-all whitespace-nowrap"
                style={{
                  backgroundColor: isSelected
                    ? "rgba(255, 255, 255, 1)"
                    : "#f7f7f7",
                  borderRadius: isSelected ? "12px 12px 0 0" : "0",
                  minHeight: "47px",
                  gap: "35px",
                  margin: "8px 0 -2px",
                  padding: "0 12px",
                  ...(isSelected
                    ? {
                        borderTop: "1px solid #d2d1cf",
                        borderLeft: "1px solid #d2d1cf",
                        borderRight: "1px solid #d2d1cf",
                        borderBottom: "1px solid rgb(255,255,255)",
                      }
                    : {
                        borderTop: "none",
                        borderLeft: "none",
                        borderRight: "none",
                        borderBottom: "1px solid #d2d1cf",
                      }),
                }}
              >
                <button
                  onClick={() => setSelectedTab(tab.id)}
                  className="flex items-center gap-2"
                >
                  <span className="flex items-center justify-center w-5 h-5">
                    {tab.icon}
                  </span>
                  <span
                    className="text-sm font-medium text-[#303030]"
                    style={{
                      fontFamily:
                        "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                      lineHeight: "24px",
                    }}
                  >
                    {displayLabel}
                  </span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleTab(tab.id, true);
                  }}
                  className="ml-1 text-gray-500 hover:text-gray-700 flex-shrink-0"
                  aria-label={`Close ${tab.label} tab`}
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            );
          })}
        <div
          className="flex-1 flex items-center h-12 px-2"
          style={{
            borderTopWidth: "0px",
            borderLeftWidth: "0px",
            borderRightWidth: "0px",
            margin: "8px 0 -1px",
            border: "1px solid #d2d1cf",
          }}
        >
          <button
            onClick={addNewTab}
            className="text-gray-600 hover:text-gray-900 transition-opacity"
            aria-label="Add new tab"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M5 12h14" />
              <path d="M12 5v14" />
            </svg>
          </button>
        </div>
      </div>

      {/* Navigation & Search Section */}
      <div
        className="flex items-center justify-between px-6 py-4 gap-6"
        style={{
          borderColor: "rgb(210, 209, 207)",
          borderWidth: "1px",
          borderRightWidth: "0px",
          borderBottomWidth: "1px",
        }}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Navigation Buttons */}
          <button
            onClick={() => window.history.back()}
            className="p-2 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
            aria-label="Go back"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="m12 19-7-7 7-7" />
              <path d="M19 12H5" />
            </svg>
          </button>
          <button
            onClick={() => window.history.forward()}
            className="p-2 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
            aria-label="Go forward"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </button>

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-gray-700 truncate">
            {breadcrumbItems.map((item, index) => (
              <React.Fragment key={index}>
                {item.href ? (
                  <button
                    onClick={() => navigate(item.href)}
                    className="text-sm font-medium flex-shrink-0 hover:text-gray-900 hover:underline"
                  >
                    {item.label}
                  </button>
                ) : (
                  <span
                    className={`text-sm font-medium ${index === breadcrumbItems.length - 1 ? "truncate" : "flex-shrink-0"}`}
                  >
                    {item.label}
                  </span>
                )}
                {index < breadcrumbItems.length - 1 && (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="flex-shrink-0"
                  >
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Search and Actions */}
        <div className="flex items-center gap-3 flex-shrink-0 min-w-0">
          {/* Search Bar */}
          <div className="flex items-center gap-3 bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 w-28 sm:w-40 md:w-56 lg:w-72 xl:w-96 min-w-0">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-gray-700 flex-shrink-0"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.34-4.34" />
              </svg>
              <input
                type="text"
                placeholder="Search..."
                className="bg-transparent text-sm outline-none w-full text-gray-700 placeholder-gray-500 min-w-0"
              />
            </div>
            <div className="flex items-center gap-2 bg-white border border-gray-300 rounded px-2 py-1 text-xs text-gray-700 font-medium flex-shrink-0">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
              </svg>
              <span>S</span>
            </div>
          </div>

          {/* Favorites/Star Button */}
          <button
            onClick={handleFavoriteClick}
            className={`p-2 hover:bg-gray-100 rounded-lg border transition-colors flex-shrink-0 relative ${
              isCurrentPageFavorite
                ? "border-yellow-400 bg-yellow-50"
                : "border-gray-300 bg-transparent"
            }`}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 22 21"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className={isCurrentPageFavorite ? "text-yellow-500" : "text-gray-700"}
            >
              <path
                d="M11.5714 0.646026C11.163 0.451325 10.6886 0.451325 10.2802 0.646026C9.92723 0.81434 9.73259 1.10658 9.63444 1.2669C9.53297 1.43264 9.4288 1.64377 9.32728 1.84955L7.17154 6.21684L2.34949 6.92165C2.1225 6.95478 1.88959 6.98878 1.70068 7.0342C1.51792 7.07815 1.18001 7.1732 0.911096 7.45704C0.600004 7.78541 0.453702 8.23662 0.512923 8.68506C0.564113 9.07269 0.781958 9.34794 0.904158 9.49077C1.03048 9.63841 1.19913 9.80261 1.36349 9.96263L4.85128 13.3597L4.02832 18.158C3.98947 18.3843 3.94961 18.6164 3.93427 18.8101C3.91943 18.9975 3.90509 19.3484 4.09179 19.6922C4.30774 20.0897 4.69162 20.3686 5.13649 20.4511C5.5211 20.5224 5.85038 20.4003 6.02401 20.3282C6.20356 20.2537 6.41198 20.1441 6.61514 20.0372L10.9258 17.7702L15.2365 20.0372C15.4396 20.1441 15.6481 20.2537 15.8276 20.3282C16.0012 20.4003 16.3305 20.5224 16.7151 20.4511C17.16 20.3686 17.5439 20.0897 17.7598 19.6922C17.9465 19.3484 17.9322 18.9975 17.9173 18.8101C17.902 18.6164 17.8621 18.3843 17.8233 18.1581L17.0003 13.3597L20.4882 9.9626C20.6525 9.80258 20.8211 9.6384 20.9475 9.49077C21.0697 9.34794 21.2875 9.07269 21.3387 8.68506C21.3979 8.23662 21.2516 7.78541 20.9405 7.45704C20.6716 7.1732 20.3337 7.07815 20.1509 7.0342C19.962 6.98878 19.7291 6.95478 19.5021 6.92165L14.6801 6.21684L12.5244 1.84963C12.4228 1.64383 12.3187 1.43265 12.2172 1.2669C12.119 1.10658 11.9244 0.81434 11.5714 0.646026Z"
                fill={isCurrentPageFavorite ? "currentColor" : "white"}
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {/* Notification Button */}
          <button className="p-2 hover:bg-gray-100 rounded-lg border border-gray-300 transition-colors flex-shrink-0 relative">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-gray-700"
            >
              <path d="M10.268 21a2 2 0 0 0 3.464 0" />
              <path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
