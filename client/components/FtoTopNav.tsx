import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FieldTeamOrdersIcon,
  PlusIcon,
  CloseIcon,
  ChevronDownIcon,
} from "@/components/icons";

interface FtoTopNavProps {
  onSubmitClick?: () => void;
}

export default function FtoTopNav({ onSubmitClick }: FtoTopNavProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [showMenu, setShowMenu] = useState(false);

  const isHome = location.pathname === "/fto" || location.pathname === "/fto/";
  const isSubmissionHistory = location.pathname.includes("/fto/submission-history");

  const handleNavigate = (path: string) => {
    navigate(path);
    setShowMenu(false);
  };

  const handleSubmit = () => {
    navigate("/fto/submission");
    setShowMenu(false);
    onSubmitClick?.();
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

        {/* Right: Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={handleSubmit}
            className="flex items-center justify-center gap-1.5 h-9 px-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <PlusIcon width={16} height={16} />
            <span className="hidden sm:inline">Submit</span>
          </button>

          {/* Menu Button */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
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

            {/* Dropdown Menu */}
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 w-48 z-50">
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
                  onClick={() => {
                    setShowMenu(false);
                    // You can add additional menu items here
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Settings
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
