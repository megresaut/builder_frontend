import React from "react";

export default function BlankPage() {
  return (
    <div className="flex-1 flex items-center justify-center bg-white">
      <div className="text-center flex flex-col items-center gap-4" style={{ paddingTop: "300px" }}>
        <div className="text-gray-400">
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
            <path d="M12 6v6l4 2" />
          </svg>
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold text-gray-900">New Tab</h2>
          <p className="text-sm text-gray-600">Select a page to view</p>
        </div>
      </div>
    </div>
  );
}
