import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

export default function FtoTopNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const isHome = location.pathname === "/fto" || location.pathname === "/fto/";
  const isSubmissionHistory = location.pathname.includes("/fto/submission-history");

  const handleNavigate = (path: string) => {
    navigate(path);
    setOpen(false);
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="flex items-center justify-between h-14 px-4 gap-2">
        {/* Left: Logo & Home */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => handleNavigate("/fto")}
            className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100 transition-colors"
            title="Home"
          >
            <img
              alt="AVM Logo"
              src="https://cdn.builder.io/api/v1/image/assets%2Fba2f0cd1a4c64ebda0865daf8dd0ff2a%2F72e0b6d48d514377b9ff522722ec83c2?format=webp&width=800"
              className="w-6 h-6"
            />
          </button>
          <div className="h-6 w-px bg-gray-200" />
          <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide hidden sm:inline">
            FTO
          </span>
        </div>

        {/* Center: Current Page Indicator */}
        <div className="flex-1 min-w-0 flex items-center gap-2 px-2">
          {isHome && (
            <span className="text-sm font-medium text-gray-900 truncate">
              Home
            </span>
          )}
          {isSubmissionHistory && (
            <span className="text-sm font-medium text-gray-900 truncate">
              Submission History
            </span>
          )}
          {!isHome && !isSubmissionHistory && (
            <span className="text-sm font-medium text-gray-900 truncate">
              Field Team Orders
            </span>
          )}
        </div>

        {/* Right: Add Button & Menu */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => navigate("/fto/submission")}
            className="flex items-center justify-center w-9 h-9 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors text-gray-700"
            title="Add new order"
          >
            <svg
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
          </button>

          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <button
                className="flex items-center justify-center w-10 h-9 rounded-lg hover:bg-gray-100 transition-colors"
                title="More options"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="5" r="1" />
                  <circle cx="12" cy="12" r="1" />
                  <circle cx="12" cy="19" r="1" />
                </svg>
              </button>
            </PopoverTrigger>

            <PopoverContent align="end" className="w-48 p-0">
              <div className="flex flex-col py-1">
                <button
                  onClick={() => handleNavigate("/fto")}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                    isHome ? "bg-blue-50 text-blue-600 font-medium" : "text-gray-700"
                  }`}
                >
                  Home
                </button>
                <button
                  onClick={() => handleNavigate("/fto/submission-history")}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                    isSubmissionHistory
                      ? "bg-blue-50 text-blue-600 font-medium"
                      : "text-gray-700"
                  }`}
                >
                  Submission History
                </button>
                <div className="h-px bg-gray-200 my-1" />
                <button
                  onClick={() => setOpen(false)}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Settings
                </button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </nav>
  );
}
