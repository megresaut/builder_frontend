import { MultiSelectField } from "@/components/forms";
import { DateField } from "@/components/forms";
import { FieldRow, FieldRowItem } from "@/components/ui/field-row";
import type { MultiSelectOption } from "@/components/forms";

interface FTOFilterPopoverProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedManagers: string[];
  onManagersChange: (managers: string[]) => void;
  dateRangeStart: Date | null;
  onDateRangeStartChange: (date: Date | null) => void;
  dateRangeEnd: Date | null;
  onDateRangeEndChange: (date: Date | null) => void;
}

// Mock field team managers for dropdown
const FIELD_TEAM_MANAGERS: MultiSelectOption[] = [
  { id: "1", label: "Christopher Harris" },
  { id: "2", label: "Cassandra Smith" },
  { id: "3", label: "David Chen" },
  { id: "4", label: "Emma Rodriguez" },
  { id: "5", label: "James Wilson" },
];

export default function FTOFilterPopover({
  isOpen,
  onOpenChange,
  selectedManagers,
  onManagersChange,
  dateRangeStart,
  onDateRangeStartChange,
  dateRangeEnd,
  onDateRangeEndChange,
}: FTOFilterPopoverProps) {
  const selectedManagerOptions = FIELD_TEAM_MANAGERS.filter((m) =>
    selectedManagers.includes(m.id)
  );

  const handleClearFilters = () => {
    onManagersChange([]);
    onDateRangeStartChange(null);
    onDateRangeEndChange(null);
  };

  const hasActiveFilters =
    selectedManagers.length > 0 || dateRangeStart || dateRangeEnd;

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40"
        onClick={() => onOpenChange(false)}
      />

      {/* Popover Content */}
      <div
        className="fixed z-50 rounded-lg border border-[#E5E7EB] bg-white shadow-lg w-80"
        style={{
          top: "120px",
          right: "32px",
        }}
      >
        <div className="flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b border-[#E5E7EB]">
            <h3 className="text-sm font-semibold text-[#303030]">Filters</h3>
          </div>

          {/* Content */}
          <div className="px-6 py-4 space-y-6">
            {/* Field Team Managers */}
            <div>
              <MultiSelectField
                label="Field Team Managers"
                value={selectedManagerOptions}
                onChange={(options) => {
                  onManagersChange(options.map((opt) => opt.id));
                }}
                placeholder="Select managers..."
                options={FIELD_TEAM_MANAGERS}
              />
            </div>

            {/* Date Range */}
            <div>
              <label className="text-sm font-medium text-[#303030] block mb-3">
                Due Date Range
              </label>
              <FieldRow columns={2}>
                <FieldRowItem>
                  <DateField
                    label="From"
                    value={dateRangeStart}
                    onChange={onDateRangeStartChange}
                    placeholder="mm/dd/yyyy"
                    compact={true}
                  />
                </FieldRowItem>
                <FieldRowItem>
                  <DateField
                    label="To"
                    value={dateRangeEnd}
                    onChange={onDateRangeEndChange}
                    placeholder="mm/dd/yyyy"
                    compact={true}
                  />
                </FieldRowItem>
              </FieldRow>
            </div>
          </div>

          {/* Footer - Clear Filters Button */}
          {hasActiveFilters && (
            <div className="px-6 py-4 border-t border-[#E5E7EB]">
              <button
                onClick={handleClearFilters}
                className="text-sm font-medium text-[#2463eb] hover:text-[#1a47b8] transition-colors"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
