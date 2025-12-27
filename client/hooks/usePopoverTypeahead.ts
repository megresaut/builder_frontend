import { useState, useEffect, useCallback } from "react";

interface UsePopoverTypeaheadOptions {
  enabled?: boolean;
  searchableItems: Array<{ value: string; label: string }>;
  onSearch?: (results: Array<{ value: string; label: string }>) => void;
  onEnter?: (firstFilteredItem: { value: string; label: string } | null) => void;
  onArrowNavigation?: (highlightedIndex: number, filteredItems: Array<{ value: string; label: string }>) => void;
}

export function usePopoverTypeahead({
  enabled = true,
  searchableItems,
  onSearch,
  onEnter,
  onArrowNavigation,
}: UsePopoverTypeaheadOptions) {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout>();
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const filteredItems = searchTerm
    ? searchableItems.filter((item) =>
        item.label.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : searchableItems;

  // Reset highlighted index when filtered items change
  useEffect(() => {
    setHighlightedIndex(0);
  }, [filteredItems.length, searchTerm]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;

      // Ignore modifier keys and special keys
      if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return;

      // Handle arrow keys for navigation
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredItems.length - 1 ? prev + 1 : prev
        );
        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        return;
      }

      // Handle Enter key - select highlighted item
      if (e.key === "Enter") {
        if (filteredItems.length > 0) {
          e.preventDefault();
          onEnter?.(filteredItems[highlightedIndex]);
        }
        return;
      }

      // Don't intercept Escape or Tab
      if (["Escape", "Tab"].includes(e.key)) {
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
    [enabled, searchTerm, searchTimeout, filteredItems, highlightedIndex, onEnter, onArrowNavigation],
  );

  // Notify when highlighted index changes
  useEffect(() => {
    onArrowNavigation?.(highlightedIndex, filteredItems);
  }, [highlightedIndex, filteredItems, onArrowNavigation]);

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
