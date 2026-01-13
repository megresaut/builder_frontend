import { useEffect, useRef, useState } from "react";
import { SelectField, MultiSelectField, DateField, TextField } from "@/components/forms";
import { FieldRow, FieldRowItem } from "@/components/ui/field-row";
import {
  AppliedFilters,
  PendingFilters,
  FilterCategory,
} from "@/hooks/useFieldTeamOrdersFilterState";
import { PROPERTIES } from "@/data/fto/properties";

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

const FIELD_TEAM_MANAGERS = [
  { value: "1", label: "Christopher Harris" },
  { value: "2", label: "Cassandra Smith" },
  { value: "3", label: "David Chen" },
  { value: "4", label: "Emma Rodriguez" },
  { value: "5", label: "James Wilson" },
];

const FTO_STATUS_OPTIONS = [
  { value: "pending-approval", label: "New" },
  { value: "dispatched", label: "Dispatched" },
  { value: "approved", label: "Completed" },
];

const TIMESHEET_STATUS_OPTIONS = [
  { value: "awaiting-submission", label: "Awaiting Submission" },
  { value: "submitted", label: "Submitted" },
  { value: "approved", label: "Approved" },
];

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

const propertyOptions = PROPERTIES.map((p) => ({
  value: p.id,
  label: p.name,
}));

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
        left: rect.right - 520, // Align right with button, 520px wide
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

      {/* Popover */}
      <div
        ref={popoverRef}
        className="fixed z-50 rounded-lg border border-[#E5E7EB] bg-white shadow-lg flex"
        style={{
          width: "520px",
          height: "600px",
          top: `${position.top}px`,
          left: `${position.left}px`,
        }}
      >
        {/* Left Panel - Category Menu */}
        <div className="w-40 border-r border-[#E5E7EB] bg-[#FAFAFA] flex flex-col">
          <div className="px-4 py-4 border-b border-[#E5E7EB]">
            <h3 className="text-sm font-semibold text-[#303030]">Filter by</h3>
          </div>
          <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-1">
            {FILTER_CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => onCategoryChange(category)}
                className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                  activeCategory === category
                    ? "bg-white text-[#2463eb] font-medium border border-[#2463eb]"
                    : "text-[#525252] hover:bg-white"
                }`}
              >
                {CATEGORY_LABELS[category]}
              </button>
            ))}
          </nav>
        </div>

        {/* Right Panel - Category Controls */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b border-[#E5E7EB]">
            <h3 className="text-sm font-semibold text-[#303030]">
              {CATEGORY_LABELS[activeCategory]}
            </h3>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {activeCategory === "date" && (
              <DateRangePanel
                pendingFilters={pendingFilters}
                onUpdate={onPendingFilterUpdate}
              />
            )}

            {activeCategory === "field-team" && (
              <FieldTeamPanel
                pendingFilters={pendingFilters}
                onUpdate={onPendingFilterUpdate}
              />
            )}

            {activeCategory === "job-details" && (
              <JobDetailsPanel
                pendingFilters={pendingFilters}
                onUpdate={onPendingFilterUpdate}
              />
            )}

            {activeCategory === "status" && (
              <StatusPanel
                pendingFilters={pendingFilters}
                onUpdate={onPendingFilterUpdate}
              />
            )}

            {activeCategory === "financials" && (
              <FinancialsPanel
                pendingFilters={pendingFilters}
                onUpdate={onPendingFilterUpdate}
              />
            )}
          </div>

          {/* Footer - Apply & Reset Buttons */}
          <div className="px-6 py-4 border-t border-[#E5E7EB] flex gap-3">
            <button
              onClick={() => {
                onReset();
                onOpenChange(false);
              }}
              className="flex-1 px-4 py-2 rounded-lg border border-[#DADADA] bg-white text-sm font-medium text-[#303030] hover:bg-gray-50 transition-colors"
            >
              Reset
            </button>
            <button
              onClick={() => {
                onApply();
                onOpenChange(false);
              }}
              className="flex-1 px-4 py-2 rounded-lg bg-[#2463eb] text-white text-sm font-medium hover:bg-[#1a47b8] transition-colors"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function DateRangePanel({
  pendingFilters,
  onUpdate,
}: {
  pendingFilters: PendingFilters;
  onUpdate: <K extends keyof PendingFilters>(key: K, value: PendingFilters[K]) => void;
}) {
  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-[#303030] block">
        Due Date Range
      </label>
      <FieldRow columns={2}>
        <FieldRowItem>
          <DateField
            label="From"
            value={pendingFilters.dateRangeStart}
            onChange={(date) => onUpdate("dateRangeStart", date)}
            placeholder="mm/dd/yyyy"
            compact={true}
          />
        </FieldRowItem>
        <FieldRowItem>
          <DateField
            label="To"
            value={pendingFilters.dateRangeEnd}
            onChange={(date) => onUpdate("dateRangeEnd", date)}
            placeholder="mm/dd/yyyy"
            compact={true}
          />
        </FieldRowItem>
      </FieldRow>
    </div>
  );
}

function FieldTeamPanel({
  pendingFilters,
  onUpdate,
}: {
  pendingFilters: PendingFilters;
  onUpdate: <K extends keyof PendingFilters>(key: K, value: PendingFilters[K]) => void;
}) {
  return (
    <div className="space-y-4">
      <SelectField
        label="Field Manager"
        value={pendingFilters.fieldManager}
        onChange={(value) => onUpdate("fieldManager", value)}
        placeholder="Select field manager"
        options={FIELD_TEAM_MANAGERS}
      />
    </div>
  );
}

function JobDetailsPanel({
  pendingFilters,
  onUpdate,
}: {
  pendingFilters: PendingFilters;
  onUpdate: <K extends keyof PendingFilters>(key: K, value: PendingFilters[K]) => void;
}) {
  return (
    <div className="space-y-4">
      <MultiSelectField
        label="Property"
        values={pendingFilters.properties}
        onChange={(values) => onUpdate("properties", values)}
        placeholder="Select properties..."
        options={propertyOptions}
      />

      <TextField
        label="Unit"
        value={pendingFilters.unit}
        onChange={(e) => onUpdate("unit", e.target.value)}
        placeholder="Unit contains..."
      />

      <TextField
        label="FTO Name"
        value={pendingFilters.ftoName}
        onChange={(e) => onUpdate("ftoName", e.target.value)}
        placeholder="FTO name contains..."
      />
    </div>
  );
}

function StatusPanel({
  pendingFilters,
  onUpdate,
}: {
  pendingFilters: PendingFilters;
  onUpdate: <K extends keyof PendingFilters>(key: K, value: PendingFilters[K]) => void;
}) {
  return (
    <div className="space-y-4">
      <MultiSelectField
        label="FTO Status"
        values={pendingFilters.ftoStatus}
        onChange={(values) => onUpdate("ftoStatus", values)}
        placeholder="Select status..."
        options={FTO_STATUS_OPTIONS}
      />

      <MultiSelectField
        label="Timesheet Status"
        values={pendingFilters.timesheetStatus}
        onChange={(values) => onUpdate("timesheetStatus", values)}
        placeholder="Select timesheet status..."
        options={TIMESHEET_STATUS_OPTIONS}
      />
    </div>
  );
}

function FinancialsPanel({
  pendingFilters,
  onUpdate,
}: {
  pendingFilters: PendingFilters;
  onUpdate: <K extends keyof PendingFilters>(key: K, value: PendingFilters[K]) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-[#303030]">Amount Range</label>
        <FieldRow columns={2}>
          <FieldRowItem>
            <input
              type="number"
              placeholder="Min"
              value={pendingFilters.minAmount ?? ""}
              onChange={(e) =>
                onUpdate(
                  "minAmount",
                  e.target.value ? parseFloat(e.target.value) : null
                )
              }
              className="w-full px-3 py-2 rounded border border-[#D1D5DB] text-sm focus:outline-none focus:ring-2 focus:ring-[#2463eb]"
            />
          </FieldRowItem>
          <FieldRowItem>
            <input
              type="number"
              placeholder="Max"
              value={pendingFilters.maxAmount ?? ""}
              onChange={(e) =>
                onUpdate(
                  "maxAmount",
                  e.target.value ? parseFloat(e.target.value) : null
                )
              }
              className="w-full px-3 py-2 rounded border border-[#D1D5DB] text-sm focus:outline-none focus:ring-2 focus:ring-[#2463eb]"
            />
          </FieldRowItem>
        </FieldRow>
      </div>
    </div>
  );
}
