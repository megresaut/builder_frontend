import { useState, useCallback } from "react";

export interface AppliedFilters {
  dateRangeStart: Date | null;
  dateRangeEnd: Date | null;
  fieldManager: string;
  properties: string[];
  unit: string;
  ftoName: string;
  ftoStatus: string[];
  timesheetStatus: string[];
  minAmount: number | null;
  maxAmount: number | null;
}

export interface PendingFilters extends AppliedFilters {}

export type FilterCategory = "date" | "field-team" | "job-details" | "status" | "financials";

const DEFAULT_FILTERS: AppliedFilters = {
  dateRangeStart: null,
  dateRangeEnd: null,
  fieldManager: "",
  properties: [],
  unit: "",
  ftoName: "",
  ftoStatus: [],
  timesheetStatus: [],
  minAmount: null,
  maxAmount: null,
};

export function useFieldTeamOrdersFilterState() {
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilters>(DEFAULT_FILTERS);
  const [pendingFilters, setPendingFilters] = useState<PendingFilters>(DEFAULT_FILTERS);
  const [activeCategory, setActiveCategory] = useState<FilterCategory>("date");

  // Open popover - sync applied to pending
  const openFilterPopover = useCallback(() => {
    setPendingFilters({ ...appliedFilters });
  }, [appliedFilters]);

  // Close popover without applying - discard pending changes
  const closeFilterPopover = useCallback(() => {
    // Do nothing - pending is discarded
  }, []);

  // Apply pending filters to applied filters
  const applyFilters = useCallback(() => {
    setAppliedFilters({ ...pendingFilters });
  }, [pendingFilters]);

  // Reset all filters (pending and applied)
  const resetFilters = useCallback(() => {
    setAppliedFilters(DEFAULT_FILTERS);
    setPendingFilters(DEFAULT_FILTERS);
    setActiveCategory("date");
  }, []);

  // Update pending filters for a specific field
  const updatePendingFilter = useCallback(
    <K extends keyof PendingFilters>(key: K, value: PendingFilters[K]) => {
      setPendingFilters((prev) => ({
        ...prev,
        [key]: value,
      }));
    },
    []
  );

  // Check if any filters are active
  const hasActiveFilters = Object.values(appliedFilters).some((value) => {
    if (value === null || value === "") return false;
    if (Array.isArray(value)) return value.length > 0;
    return true;
  });

  // Count of active filters
  const activeFilterCount = [
    appliedFilters.dateRangeStart,
    appliedFilters.dateRangeEnd,
    appliedFilters.fieldManager,
    ...appliedFilters.properties,
    appliedFilters.unit,
    appliedFilters.ftoName,
    ...appliedFilters.ftoStatus,
    ...appliedFilters.timesheetStatus,
    appliedFilters.minAmount,
    appliedFilters.maxAmount,
  ].filter((v) => v !== null && v !== "" && v !== undefined).length;

  return {
    appliedFilters,
    pendingFilters,
    activeCategory,
    setActiveCategory,
    openFilterPopover,
    closeFilterPopover,
    applyFilters,
    resetFilters,
    updatePendingFilter,
    hasActiveFilters,
    activeFilterCount,
  };
}
