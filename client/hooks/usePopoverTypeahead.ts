import { useState, useEffect, useCallback } from "react";

interface UsePopoverTypeaheadOptions {
  enabled?: boolean;
  searchableItems: Array<{ value: string; label: string }>;
  onSearch?: (results: Array<{ value: string; label: string }>) => void;
  onEnter?: (firstFilteredItem: { value: string; label: string } | null) => void;
}

export function usePopoverTypeahead({
  enabled = true,
  searchableItems,
  onSearch,
  onEnter,
}: UsePopoverTypeaheadOptions) {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout>();

  const filteredItems = searchTerm
    ? searchableItems.filter((item) =>
        item.label.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : searchableItems;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;

      // Ignore modifier keys and special keys
      if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return;

      // Handle Enter key - select first filtered item
      if (e.key === "Enter") {
        if (searchTerm && filteredItems.length > 0) {
          e.preventDefault();
          onEnter?.(filteredItems[0]);
        }
        return;
      }

      // Don't intercept Escape, Tab, or arrow keys
      if (["Escape", "Tab", "ArrowUp", "ArrowDown"].includes(e.key)) {
        return;
      }

      // If it's a printable character
      if (e.key.length === 1) {
        e.preventDefault();
        const newTerm = searchTerm + e.key;
        setSearchTerm(newTerm);

        // Clear previous timeout
        if (searchTimeout) {
          clearTimeout(searchTimeout);
        }

        // Reset search after 6 seconds of inactivity
        const timeout = setTimeout(() => {
          setSearchTerm("");
        }, 6000);

        setSearchTimeout(timeout);
      }
    },
    [enabled, searchTerm, searchTimeout, filteredItems, onEnter],
  );

  useEffect(() => {
    onSearch?.(filteredItems);
  }, [filteredItems, onSearch]);

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [enabled, handleKeyDown]);

  return {
    searchTerm,
    setSearchTerm,
    filteredItems,
  };
}
