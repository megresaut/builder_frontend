import { useState, useEffect, useCallback } from "react";
import { useTabContext } from "./useTabContext";
import { useLocation } from "react-router-dom";

/**
 * Custom hook for managing page state that persists across tab navigation.
 * Automatically syncs state changes to tab metadata and restores state when returning to a tab.
 *
 * @param key - Unique key for this state value within the tab (e.g., "currentPage", "selectedTab")
 * @param initialValue - Initial value if not found in metadata
 * @returns [value, setValue] - Similar to useState
 */
export function usePageState<T>(
  key: string,
  initialValue: T,
): [T, (value: T) => void] {
  const location = useLocation();
  const { tabMetadata, setTabMetadata } = useTabContext();

  // Generate a consistent tab ID based on the route
  const getTabId = useCallback((): string => {
    const path = location.pathname;

    // Match task detail pages
    if (path.includes("/tasks/")) {
      const match = path.match(/\/tasks\/(\d+)/);
      if (match) return `task-${match[1]}`;
    }

    // Match property detail pages
    if (path.includes("/property/")) {
      const match = path.match(/\/property\/(\d+)(?:\/(\w+))?/);
      if (match) {
        const propertyId = match[1];
        const tab = match[2];
        return tab ? `property-${propertyId}-${tab}` : `property-${propertyId}`;
      }
    }

    // Use pathname as fallback
    return path;
  }, [location.pathname]);

  const currentTabId = getTabId();
  const currentMetadata = tabMetadata[currentTabId] || {};

  // Get initial value from metadata or use provided initialValue
  const storedValue = currentMetadata.pageState?.[key] as T | undefined;
  const [value, setValue] = useState<T>(
    storedValue !== undefined ? storedValue : initialValue,
  );

  // Sync state changes to tab metadata (provider merges; no currentMetadata in deps to avoid re-run loop)
  useEffect(() => {
    setTabMetadata(currentTabId, { pageState: { [key]: value } });
  }, [value, currentTabId, key, setTabMetadata]);

  // Restore state from metadata when it changes
  useEffect(() => {
    if (storedValue !== undefined && storedValue !== value) {
      setValue(storedValue);
    }
  }, [storedValue]);

  return [value, setValue];
}
