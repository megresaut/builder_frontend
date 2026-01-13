import { useEffect, useRef, useState } from "react";
import {
  AppliedFilters,
  PendingFilters,
  FilterCategory,
} from "@/hooks/useFieldTeamOrdersFilterState";

interface FTOFilterPopoverProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  appliedFilters: AppliedFilters;
  pendingFilters: PendingFilters;
  activeCategory: FilterCategory;
  onCategoryChange: (category: FilterCategory) => void;
  onPendingFilterUpdate: <K extends keyof PendingFilters>(
    key: K,
    value: PendingFilters[K]
  ) => void;
  onApply: () => void;
  onReset: () => void;
}

const FILTER_CATEGORIES: FilterCategory[] = [
  "date",
  "field-team",
  "job-details",
  "status",
  "financials",
];

const CATEGORY_LABELS: Record<FilterCategory, string> = {
  date: "Date",
  "field-team": "Field Team",
  "job-details": "Job Details",
  status: "Status",
  financials: "Financials",
};

export default function FTOFilterPopover({
  isOpen,
  onOpenChange,
  appliedFilters,
  pendingFilters,
  activeCategory,
  onCategoryChange,
  onPendingFilterUpdate,
  onApply,
  onReset,
}: FTOFilterPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  // Anchor the popover to the filter button
  useEffect(() => {
    if (!isOpen) return;

    const filterButton = document.querySelector(
      '[data-testid="filter-button"]'
    ) as HTMLElement;
    if (filterButton) {
      const rect = filterButton.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 8,
        left: rect.right - 280,
      });
    }
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onOpenChange(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onOpenChange]);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40"
        onClick={() => onOpenChange(false)}
      />

      {/* Popover - Category Menu Only */}
      <div
        ref={popoverRef}
        className="fixed z-50 rounded-lg border border-[#E5E7EB] bg-white shadow-lg"
        style={{
          width: "280px",
          top: `${position.top}px`,
          left: `${position.left}px`,
        }}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-[#E5E7EB]">
          <h3 className="text-sm font-semibold text-[#303030]">Filter by</h3>
        </div>

        {/* Category Menu */}
        <nav className="flex flex-col py-1 px-2 max-h-64 overflow-y-auto">
          {FILTER_CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => {
                onCategoryChange(category);
              }}
              className={`w-full text-left px-3 py-2 rounded text-sm transition-all ${
                activeCategory === category
                  ? "bg-white text-[#2463eb] font-medium border border-[#2463eb]"
                  : "text-[#525252] hover:bg-white"
              }`}
            >
              {CATEGORY_LABELS[category]}
            </button>
          ))}
        </nav>

        {/* Footer - Apply & Reset Buttons */}
        <div className="px-2 py-1.5 border-t border-[#E5E7EB] flex gap-2">
          <button
            onClick={() => {
              onReset();
              onOpenChange(false);
            }}
            className="flex-1 px-3 py-1.5 rounded-lg border border-[#DADADA] bg-white text-xs font-medium text-[#303030] hover:bg-gray-50 transition-colors"
          >
            Reset
          </button>
          <button
            onClick={() => {
              onApply();
              onOpenChange(false);
            }}
            className="flex-1 px-3 py-1.5 rounded-lg border border-white transition-colors bg-[#013764] shadow-[0_0_0_1px_#002D5A] hover:bg-[#003a73] text-white font-medium text-xs leading-normal"
          >
            Apply
          </button>
        </div>
      </div>
    </>
  );
}
