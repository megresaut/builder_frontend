import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { value: "home", label: "Home", path: "/fto" },
  { value: "inspections", label: "Property Inspections", path: "/fto/inspections" },
  { value: "work-orders", label: "Work Orders", path: "/fto/work-orders" },
] as const;

function ActionsMenuContent({
  isHome,
  isInspections,
  isWorkOrders,
  onNavigate,
  onClose,
}: {
  isHome: boolean;
  isInspections: boolean;
  isWorkOrders: boolean;
  onNavigate: (path: string) => void;
  onClose: () => void;
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div className="flex flex-col py-1 whitespace-nowrap" role="menu">
      {NAV_ITEMS.map((item, index) => {
        const isSelected =
          (item.value === "home" && isHome) ||
          (item.value === "inspections" && isInspections) ||
          (item.value === "work-orders" && isWorkOrders);
        const isHighlighted = hoveredIndex === index;

        return (
          <button
            key={item.value}
            type="button"
            role="menuitem"
            onClick={() => {
              onNavigate(item.path);
            }}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            className={cn(
              "text-left px-4 py-3 text-sm min-h-[44px] flex items-center touch-manipulation",
              "active:bg-gray-100 transition-colors",
              isSelected ? "text-[#013764] font-semibold bg-blue-50" : "text-gray-800",
              isHighlighted && !isSelected && "bg-gray-50",
            )}
          >
            {item.label}
          </button>
        );
      })}
      <div className="border-t border-gray-100 my-1" />
      <button
        type="button"
        role="menuitem"
        onClick={onClose}
        onMouseEnter={() => setHoveredIndex(NAV_ITEMS.length)}
        onMouseLeave={() => setHoveredIndex(null)}
        className={cn(
          "text-left px-4 py-3 text-sm min-h-[44px] flex items-center touch-manipulation",
          "text-gray-600 active:bg-gray-100 transition-colors",
          hoveredIndex === NAV_ITEMS.length && "bg-gray-50",
        )}
      >
        Close menu
      </button>
    </div>
  );
}

export default function FtoTopNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const isHome = location.pathname === "/fto" || location.pathname === "/fto/";
  const isInspections = location.pathname.startsWith("/fto/inspections");
  const isWorkOrders = location.pathname.startsWith("/fto/work-orders");

  const handleNavigate = (path: string) => {
    navigate(path);
    setOpen(false);
  };

  // Plus button: submission on Home, new inspection on Inspections; hidden on Work Orders
  const handlePlusClick = () => {
    if (isInspections) {
      navigate("/fto/inspections/new");
    } else {
      navigate("/fto/submission");
    }
  };
  const showPlusButton = !isWorkOrders;

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
          {isInspections && (
            <span className="text-sm font-medium text-gray-900 truncate">
              Property Inspections
            </span>
          )}
          {isWorkOrders && (
            <span className="text-sm font-medium text-gray-900 truncate">
              Work Orders
            </span>
          )}
          {!isHome && !isInspections && !isWorkOrders && (
            <span className="text-sm font-medium text-gray-900 truncate">
              Field Team Orders
            </span>
          )}
        </div>

        {/* Right: Add Button & Menu */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {showPlusButton && (
            <button
              onClick={handlePlusClick}
              className="flex items-center justify-center w-9 h-9 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors text-gray-700"
              title={isInspections ? "New inspection" : "Add new order"}
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
          )}

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

            <PopoverContent
              align="end"
              syncTriggerWidth={false}
              className="p-0"
              style={{ width: "auto", minWidth: "180px" }}
            >
              <ActionsMenuContent
                isHome={isHome}
                isInspections={isInspections}
                isWorkOrders={isWorkOrders}
                onNavigate={handleNavigate}
                onClose={() => setOpen(false)}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </nav>
  );
}
