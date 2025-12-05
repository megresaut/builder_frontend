import React, { useState } from "react";
import { ChevronRight, Search, Settings, Bell } from "lucide-react";

interface Tab {
  id: string;
  icon: React.ReactNode;
  label: string;
}

export default function Header() {
  const [activeTabs, setActiveTabs] = useState<string[]>(["properties"]);

  const tabs: Tab[] = [
    {
      id: "portfolio",
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
      label: "Portfolio",
    },
    {
      id: "properties",
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
      label: "Properties",
    },
    {
      id: "screening",
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
      label: "Screening",
    },
  ];

  const toggleTab = (tabId: string) => {
    setActiveTabs((prev) =>
      prev.includes(tabId) ? prev.filter((id) => id !== tabId) : [...prev, tabId]
    );
  };

  return (
    <header className="bg-white border-b border-gray-200">
      {/* Tabs Section */}
      <div className="flex items-center gap-0 border-b border-gray-100 px-6 py-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => toggleTab(tab.id)}
            className={`flex items-center gap-2 px-3 py-3 text-sm font-medium border-b-2 transition-all ${
              activeTabs.includes(tab.id)
                ? "border-gray-900 text-gray-900"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            <span className="flex items-center justify-center">{tab.icon}</span>
            <span>{tab.label}</span>
            {activeTabs.includes(tab.id) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleTab(tab.id);
                }}
                className="ml-1 text-gray-400 hover:text-gray-600"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                >
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            )}
          </button>
        ))}
        <div className="flex-1 flex items-center justify-end px-2">
          <button className="p-1 hover:bg-gray-100 rounded transition-colors">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M5 12h14M12 5v14" />
            </svg>
          </button>
        </div>
      </div>

      {/* Top Navigation & Search Section */}
      <div className="flex items-center justify-between px-6 py-4 gap-6">
        <div className="flex items-center gap-3 flex-1">
          <button className="p-1.5 hover:bg-gray-100 rounded transition-colors">
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
          <button className="p-1.5 hover:bg-gray-100 rounded transition-colors">
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
          <div className="flex items-center gap-2 text-gray-700">
            <span className="text-sm font-medium">Properties</span>
            <ChevronRight size={16} className="text-gray-500" />
            <span className="text-sm font-medium">Maintenance</span>
            <ChevronRight size={16} className="text-gray-500" />
            <span className="text-sm font-medium">3 Hekma Road, Greenwich, CT 06831</span>
          </div>
        </div>

        {/* Search and Actions */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 w-96">
            <div className="flex items-center gap-2 flex-1">
              <Search size={18} className="text-gray-700" />
              <input
                type="text"
                placeholder="Search anything..."
                className="bg-transparent text-sm outline-none w-full text-gray-700 placeholder-gray-500"
              />
            </div>
            <div className="flex items-center gap-2 bg-white border border-gray-300 rounded px-2 py-1 text-xs text-gray-700 font-medium">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
              </svg>
              <span>S</span>
            </div>
          </div>

          <button className="p-2 hover:bg-gray-100 rounded-lg border border-gray-300 transition-colors">
            <Search size={18} className="text-gray-700" />
          </button>

          <button className="p-2 hover:bg-gray-100 rounded-lg border border-gray-300 transition-colors relative">
            <Bell size={18} className="text-gray-700" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
        </div>
      </div>
    </header>
  );
}
