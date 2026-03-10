import { useEffect, useRef, useState } from "react";

interface Option {
  id: number;
  name: string;
}

interface AdvancedFiltersModalProps {
  open: boolean;
  onClose: () => void;
  properties: Option[];
  vendors: Option[];
  selectedPropertyIds: Set<number>;
  selectedVendorIds: Set<number>;
  onApply: (propertyIds: Set<number>, vendorIds: Set<number>) => void;
}

function MultiSelectList({
  label,
  options,
  selected,
  onToggle,
  onSelectAll,
  onClearAll,
}: {
  label: string;
  options: Option[];
  selected: Set<number>;
  onToggle: (id: number) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
}) {
  const [search, setSearch] = useState("");
  const filtered = search
    ? options.filter((o) => o.name.toLowerCase().includes(search.toLowerCase()))
    : options;

  const allSelected = options.length > 0 && options.every((o) => selected.has(o.id));
  const noneSelected = options.length > 0 && !options.some((o) => selected.has(o.id));

  return (
    <div className="flex-1 min-w-0 flex flex-col">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-medium text-[#303030]">{label}</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onSelectAll}
            className={`text-[10px] transition-colors ${allSelected ? "text-[#ccc]" : "text-[#013764] hover:text-[#014578]"}`}
            disabled={allSelected}
          >
            Select all
          </button>
          <button
            type="button"
            onClick={onClearAll}
            className={`text-[10px] transition-colors ${noneSelected ? "text-[#ccc]" : "text-[#013764] hover:text-[#014578]"}`}
            disabled={noneSelected}
          >
            Clear
          </button>
        </div>
      </div>
      {options.length > 6 && (
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Search ${label.toLowerCase()}...`}
          className="w-full h-7 px-2.5 mb-1.5 rounded-md border border-[#e5e5e5] text-xs text-[#303030] bg-[#fafafa] focus:outline-none focus:border-[#013764] focus:ring-1 focus:ring-[#013764]/20"
        />
      )}
      <div className="flex-1 overflow-y-auto border border-[#e8e8e8] rounded-lg bg-white">
        {filtered.length === 0 && (
          <div className="px-3 py-4 text-[11px] text-[#999] text-center">No results</div>
        )}
        {filtered.map((opt) => {
          const checked = selected.has(opt.id);
          return (
            <label
              key={opt.id}
              className="flex items-center gap-2.5 px-3 py-1.5 cursor-pointer hover:bg-[#f8f9fb] transition-colors border-b border-[#f0f0f0] last:border-b-0"
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggle(opt.id)}
                className="sr-only"
              />
              <div
                className="w-3.5 h-3.5 rounded flex items-center justify-center shrink-0 transition-colors"
                style={{
                  borderWidth: "1.5px",
                  borderStyle: "solid",
                  borderColor: checked ? "#013764" : "#d1d5db",
                  backgroundColor: checked ? "#013764" : "transparent",
                }}
              >
                {checked && (
                  <svg width="8" height="6" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <span className="text-xs text-[#303030] truncate">{opt.name}</span>
            </label>
          );
        })}
      </div>
      <div className="mt-1 text-[10px] text-[#999]">
        {selected.size === 0 || selected.size === options.length
          ? "All shown"
          : `${selected.size} of ${options.length} selected`}
      </div>
    </div>
  );
}

export default function AdvancedFiltersModal({
  open,
  onClose,
  properties,
  vendors,
  selectedPropertyIds,
  selectedVendorIds,
  onApply,
}: AdvancedFiltersModalProps) {
  const [draftProperties, setDraftProperties] = useState<Set<number>>(new Set());
  const [draftVendors, setDraftVendors] = useState<Set<number>>(new Set());
  const backdropRef = useRef<HTMLDivElement>(null);

  // Sync draft state when modal opens
  useEffect(() => {
    if (open) {
      setDraftProperties(new Set(selectedPropertyIds));
      setDraftVendors(new Set(selectedVendorIds));
    }
  }, [open, selectedPropertyIds, selectedVendorIds]);

  if (!open) return null;

  function toggleProperty(id: number) {
    setDraftProperties((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleVendor(id: number) {
    setDraftVendors((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleApply() {
    onApply(draftProperties, draftVendors);
    onClose();
  }

  function handleReset() {
    const allProps = new Set(properties.map((p) => p.id));
    const allVendors = new Set(vendors.map((v) => v.id));
    setDraftProperties(allProps);
    setDraftVendors(allVendors);
  }

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}
    >
      <div className="absolute inset-0 bg-black/30" />
      <div
        className="relative bg-white rounded-xl shadow-xl flex flex-col"
        style={{ width: 520, maxHeight: "70vh", fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#e8e8e8]">
          <h2 className="text-sm font-medium text-[#1a1a1a]">Advanced Filters</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-[#f0f0f0] text-[#999] transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 2L10 10M10 2L2 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Body — two columns */}
        <div className="flex gap-4 px-5 py-4 flex-1 min-h-0" style={{ height: 320 }}>
          <MultiSelectList
            label="Properties"
            options={properties}
            selected={draftProperties}
            onToggle={toggleProperty}
            onSelectAll={() => setDraftProperties(new Set(properties.map((p) => p.id)))}
            onClearAll={() => setDraftProperties(new Set())}
          />
          <MultiSelectList
            label="Vendors"
            options={vendors}
            selected={draftVendors}
            onToggle={toggleVendor}
            onSelectAll={() => setDraftVendors(new Set(vendors.map((v) => v.id)))}
            onClearAll={() => setDraftVendors(new Set())}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-[#e8e8e8]">
          <button
            type="button"
            onClick={handleReset}
            className="text-xs text-[#717179] hover:text-[#303030] transition-colors"
          >
            Reset all
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-8 px-4 text-xs font-medium rounded-lg border border-[#e0e0e0] text-[#303030] hover:bg-[#f5f5f5] transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="h-8 px-4 text-xs font-medium rounded-lg text-white transition-colors"
              style={{ backgroundColor: "#013764" }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#014578")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#013764")}
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
