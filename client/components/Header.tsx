import React, { useState } from "react";

interface Tab {
  id: string;
  icon: React.ReactNode;
  label: string;
}

export default function Header() {
  const [openTabs, setOpenTabs] = useState<Set<string>>(
    new Set(["properties"]),
  );

  const tabs: Tab[] = [
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

  const toggleTab = (tabId: string) => {
    const newTabs = new Set(openTabs);
    if (newTabs.has(tabId)) {
      // Prevent closing the last tab
      if (newTabs.size > 1) {
        newTabs.delete(tabId);
      }
    } else {
      newTabs.add(tabId);
    }
    setOpenTabs(newTabs);
  };

  const addNewTab = () => {
    // Find the first closed tab and open it
    const closedTab = tabs.find(tab => !openTabs.has(tab.id));
    if (closedTab) {
      toggleTab(closedTab.id);
    }
  };

  return (
    <header className="bg-white border-b border-gray-200">
      {/* Tabs Section */}
      <div className="flex items-center gap-0 border-b border-[#D2D1CF] px-0 py-0">
        {tabs.filter(tab => openTabs.has(tab.id)).map((tab) => {
          return (
            <div
              key={tab.id}
              className="flex items-center gap-2 px-3 py-3 bg-white border-t border-l border-r border-[#D2D1CF] transition-all whitespace-nowrap"
              style={{
                borderRadius: "12px 12px 0 0",
                minHeight: "48px"
              }}
            >
              <button
                onClick={() => toggleTab(tab.id)}
                className="flex items-center gap-2"
              >
                <span className="flex items-center justify-center w-5 h-5">
                  {tab.icon}
                </span>
                <span className="text-sm font-medium text-[#303030]" style={{ fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif", lineHeight: "24px" }}>
                  {tab.label}
                </span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleTab(tab.id);
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
        <div className="flex-1 flex items-center border-b border-[#D2D1CF] h-12 px-2">
          <button
            onClick={addNewTab}
            disabled={openTabs.size === tabs.length}
            className="text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
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
      <div className="flex items-center justify-between px-6 py-4 gap-6">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Navigation Buttons */}
          <button className="p-2 hover:bg-gray-100 rounded transition-colors flex-shrink-0">
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
          <button className="p-2 hover:bg-gray-100 rounded transition-colors flex-shrink-0">
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
            <span className="text-sm font-medium flex-shrink-0">
              Properties
            </span>
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
            <span className="text-sm font-medium flex-shrink-0">
              Maintenance
            </span>
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
            <span className="text-sm font-medium truncate">
              3 Hekma Road, Greenwich, CT 06831
            </span>
          </div>
        </div>

        {/* Search and Actions */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Search Bar */}
          <div className="flex items-center gap-3 bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 w-96">
            <div className="flex items-center gap-2 flex-1">
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
                placeholder="Search anything..."
                className="bg-transparent text-sm outline-none w-full text-gray-700 placeholder-gray-500"
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

          {/* Search Button */}
          <button className="p-2 hover:bg-gray-100 rounded-lg border border-gray-300 transition-colors flex-shrink-0">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-gray-700"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.34-4.34" />
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
