import React from "react";

interface ShellLayoutProps {
  children?: React.ReactNode;
}

export default function ShellLayout({ children }: ShellLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar */}
      <aside className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col">
        {/* Sidebar Header */}
        <div className="p-5 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-sm">
              AVM
            </div>
            <span className="font-semibold text-lg">AVM</span>
          </div>
        </div>

        {/* Sidebar Content - Placeholder */}
        <nav className="flex-1 overflow-y-auto p-4">
          <div className="text-gray-500 text-sm">Navigation menu placeholder</div>
        </nav>

        {/* Sidebar Footer - Placeholder */}
        <div className="border-t border-gray-200 p-4">
          <div className="text-gray-500 text-sm">User profile placeholder</div>
        </div>
      </aside>

      {/* Right Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header/Tabs */}
        <header className="border-b border-gray-200 bg-white">
          {/* Tabs/Ribbon - Placeholder */}
          <div className="px-6 py-3 text-gray-500 text-sm">
            Tabs and ribbon placeholder
          </div>

          {/* Header with Search and Actions - Placeholder */}
          <div className="px-6 py-4 border-t border-gray-100 text-gray-500 text-sm">
            Header with search and actions placeholder
          </div>
        </header>

        {/* Main Content Area */}
        <div className="flex-1 overflow-auto">
          {children && (
            <div className="h-full">
              {children}
            </div>
          )}
          {!children && (
            <div className="p-6 text-gray-400 text-center">
              <p>Main content area - Page content will be rendered here</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
