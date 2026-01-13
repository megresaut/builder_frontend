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
  const [position, setPosition] = useState({ top: 0, right: 0 });
  const [showLeftPanel, setShowLeftPanel] = useState(false);

  // Anchor the popover to the filter button
  useEffect(() => {
    if (!isOpen) return;

    const filterButton = document.querySelector(
      '[data-testid="filter-button"]'
    ) as HTMLElement;
    if (filterButton) {
      const rect = filterButton.getBoundingClientRect();
      const right = window.innerWidth - rect.right;
      setPosition({
        top: rect.bottom + 8,
        right: Math.max(20, right),
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

  const handlePopoverLeave = () => {
    setShowLeftPanel(false);
    onOpenChange(false);
  };

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
        className="fixed z-50 rounded-lg border border-[#E5E7EB] bg-white shadow-lg flex overflow-hidden justify-end"
        style={{
          width: showLeftPanel ? "642px" : "258px",
          height: "360px",
          top: `${position.top}px`,
          right: `${position.right}px`,
          transition: "width 0.2s ease-out",
        }}
        onMouseLeave={handlePopoverLeave}
      >
        {/* Left Panel - Filter Controls (Slides In/Reveals) */}
        <div
          className="flex-shrink-0 flex flex-col overflow-hidden border-r border-[#E5E7EB] transition-all duration-200"
          style={{
            width: showLeftPanel ? "384px" : "0px",
            height: "100%",
            opacity: showLeftPanel ? 1 : 0,
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div className="px-6 py-3 border-b border-[#E5E7EB] flex-shrink-0">
            <h3 className="text-sm font-semibold text-[#303030]">
              {CATEGORY_LABELS[activeCategory]}
            </h3>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-3 space-y-3">
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
        </div>

        {/* Right Panel - Category Menu (Always Visible) */}
        <div className="w-64 bg-[#FAFAFA] flex flex-col overflow-hidden flex-shrink-0">
          <div className="px-4 py-3 border-b border-[#E5E7EB] flex-shrink-0">
            <h3 className="text-sm font-semibold text-[#303030]">Filter by</h3>
          </div>

          {/* Category Menu */}
          <nav className="overflow-y-auto py-1 px-2 space-y-1">
            {FILTER_CATEGORIES.map((category) => (
              <button
                key={category}
                onMouseEnter={() => {
                  onCategoryChange(category);
                  setShowLeftPanel(true);
                }}
                className={`w-full text-left px-3 py-2 rounded text-sm transition-all border ${
                  activeCategory === category
                    ? "bg-white text-[#2463eb] font-medium border-[#2463eb]"
                    : "text-[#525252] hover:bg-white border-transparent"
                }`}
              >
                {CATEGORY_LABELS[category]}
              </button>
            ))}
          </nav>

          {/* Footer - Apply & Reset Buttons */}
          <div className="flex-shrink-0 px-2 py-1.5 border-t border-[#E5E7EB] flex gap-2 mt-auto">
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
      </div>
    </>
  );
}

function DateRangePanel({
  pendingFilters,
  onUpdate,
}: {
  pendingFilters?: PendingFilters;
  onUpdate: <K extends keyof PendingFilters>(key: K, value: PendingFilters[K]) => void;
}) {
  if (!pendingFilters) return null;

  return (
    <div className="space-y-2">
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
  pendingFilters?: PendingFilters;
  onUpdate: <K extends keyof PendingFilters>(key: K, value: PendingFilters[K]) => void;
}) {
  if (!pendingFilters) return null;

  return (
    <div className="space-y-3">
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
  pendingFilters?: PendingFilters;
  onUpdate: <K extends keyof PendingFilters>(key: K, value: PendingFilters[K]) => void;
}) {
  if (!pendingFilters) return null;

  const propertyMultiSelectOptions = propertyOptions.map((p) => ({
    id: p.value,
    label: p.label,
  }));

  return (
    <div className="space-y-3">
      <MultiSelectField
        label="Property"
        value={propertyMultiSelectOptions.filter((p) =>
          pendingFilters.properties.includes(p.id)
        )}
        onChange={(selected) =>
          onUpdate(
            "properties",
            selected.map((s) => s.id)
          )
        }
        placeholder="Select properties..."
        options={propertyMultiSelectOptions}
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
  pendingFilters?: PendingFilters;
  onUpdate: <K extends keyof PendingFilters>(key: K, value: PendingFilters[K]) => void;
}) {
  if (!pendingFilters) return null;

  const ftoStatusOptions = FTO_STATUS_OPTIONS.map((s) => ({
    id: s.value,
    label: s.label,
  }));

  const timesheetStatusOptions = TIMESHEET_STATUS_OPTIONS.map((s) => ({
    id: s.value,
    label: s.label,
  }));

  return (
    <div className="space-y-3">
      <MultiSelectField
        label="FTO Status"
        value={ftoStatusOptions.filter((s) =>
          pendingFilters.ftoStatus.includes(s.id)
        )}
        onChange={(selected) =>
          onUpdate(
            "ftoStatus",
            selected.map((s) => s.id)
          )
        }
        placeholder="Select status..."
        options={ftoStatusOptions}
      />

      <MultiSelectField
        label="Timesheet Status"
        value={timesheetStatusOptions.filter((s) =>
          pendingFilters.timesheetStatus.includes(s.id)
        )}
        onChange={(selected) =>
          onUpdate(
            "timesheetStatus",
            selected.map((s) => s.id)
          )
        }
        placeholder="Select timesheet status..."
        options={timesheetStatusOptions}
      />
    </div>
  );
}

function FinancialsPanel({
  pendingFilters,
  onUpdate,
}: {
  pendingFilters?: PendingFilters;
  onUpdate: <K extends keyof PendingFilters>(key: K, value: PendingFilters[K]) => void;
}) {
  if (!pendingFilters) return null;

  return (
    <div className="space-y-3">
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
