import React, { useState } from "react";
import { ChevronDown, Plus, MoreVertical, Settings, HelpCircle } from "lucide-react";

export default function Sidebar() {
  const [expandedSection, setExpandedSection] = useState<string | null>("dashboard");

  const navigationItems = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "properties", label: "Properties", icon: "📋" },
    { id: "screening", label: "Screening", icon: "✓" },
    { id: "leases", label: "Leases", icon: "📄" },
    { id: "accounting", label: "Accounting", icon: "📱" },
    { id: "maintenance", label: "Maintenance", icon: "🔧" },
    { id: "reports", label: "Reports", icon: "📈" },
  ];

  const favorites = [
    { id: 1, label: "Lorem Ipsum" },
    { id: 2, label: "Lorem Ipsum" },
    { id: 3, label: "Lorem Ipsum" },
  ];

  return (
    <aside className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col h-screen justify-between py-4 px-5">
      {/* Header */}
      <div className="flex flex-col gap-6">
        {/* Logo Section */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src="https://cdn.builder.io/api/v1/image/assets%2Fba2f0cd1a4c64ebda0865daf8dd0ff2a%2F72e0b6d48d514377b9ff522722ec83c2?format=webp&width=800"
              alt="AVM Logo"
              className="w-8 h-8"
            />
            <div className="text-xl font-semibold">AVM</div>
          </div>
          <button className="p-0.5 hover:bg-gray-200 rounded transition-colors">
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              stroke="#919191"
              strokeWidth="1.5"
            >
              <path
                d="M7.5 2.5V17.5M6.5 2.5H13.5C14.9001 2.5 15.6002 2.5 16.135 2.77248C16.6054 3.01217 16.9878 3.39462 17.2275 3.86502C17.5 4.3998 17.5 5.09987 17.5 6.5V13.5C17.5 14.9001 17.5 15.6002 17.2275 16.135C16.9878 16.6054 16.6054 16.9878 16.135 17.2275C15.6002 17.5 14.9001 17.5 13.5 17.5H6.5C5.09987 17.5 4.3998 17.5 3.86502 17.2275C3.39462 16.9878 3.01217 16.6054 2.77248 16.135C2.5 15.6002 2.5 14.9001 2.5 13.5V6.5C2.5 5.09987 2.5 4.3998 2.77248 3.86502C3.01217 3.39462 3.39462 3.01217 3.86502 2.77248C4.3998 2.5 5.09987 2.5 6.5 2.5Z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1">
          {navigationItems.map((item) => (
            <div key={item.id}>
              <button
                onClick={() =>
                  setExpandedSection(expandedSection === item.id ? null : item.id)
                }
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-white transition-colors text-gray-700"
              >
                <div className="flex items-center gap-2 flex-1">
                  <span>{item.icon}</span>
                  <span className="text-sm font-normal">{item.label}</span>
                </div>
                {item.id === "dashboard" && (
                  <ChevronDown size={16} className="text-gray-700" />
                )}
              </button>

              {/* Submenu for Dashboard */}
              {item.id === "dashboard" && expandedSection === item.id && (
                <div className="ml-6 mt-2 flex flex-col gap-2">
                  <div className="flex items-center gap-2 py-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-600"></div>
                    <span className="text-sm text-gray-600">Portfolios</span>
                  </div>
                  <div className="flex items-center gap-2 py-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-600"></div>
                    <span className="text-sm text-gray-600">Portfolios</span>
                  </div>
                  <div className="flex items-center gap-2 py-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-600"></div>
                    <span className="text-sm text-gray-600">Portfolios</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Separator */}
        <div className="h-px bg-gray-300"></div>

        {/* Favorites Section */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-xs font-semibold text-gray-700 uppercase">
              Favorites
            </span>
            <div className="flex items-center gap-2">
              <button className="p-0 hover:bg-gray-200 rounded transition-colors">
                <Plus size={16} className="text-gray-600" />
              </button>
              <button className="p-0 hover:bg-gray-200 rounded transition-colors">
                <MoreVertical size={16} className="text-gray-600" />
              </button>
            </div>
          </div>
          {favorites.map((fav) => (
            <button
              key={fav.id}
              className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white transition-colors text-gray-700 text-sm"
            >
              <span>{fav.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-col gap-4">
        {/* Settings & Help */}
        <div className="flex flex-col gap-1">
          <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white transition-colors text-gray-700 text-sm">
            <Settings size={20} />
            <span>Settings</span>
          </button>
          <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white transition-colors text-gray-700 text-sm">
            <HelpCircle size={20} />
            <span>Help Center</span>
          </button>
        </div>

        {/* User Profile */}
        <div className="flex items-center justify-between px-2 py-2 rounded-lg border border-gray-300 bg-white">
          <div className="flex items-center gap-2">
            <img
              src="https://api.builder.io/api/v1/image/assets/TEMP/2566780a27c3990d201697798765d924dce1c93a?width=80"
              alt="User avatar"
              className="w-10 h-10 rounded"
            />
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-gray-900">
                Roger Botosh
              </span>
              <span className="text-xs text-gray-600">Admin</span>
            </div>
          </div>
          <ChevronDown size={16} className="text-gray-700" />
        </div>
      </div>
    </aside>
  );
}
