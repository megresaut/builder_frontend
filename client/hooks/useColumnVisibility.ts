import { useState, useEffect, useRef } from "react";

export function useColumnVisibility(defaultColumns: string[]) {
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(defaultColumns)
  );
  const [showColumnModal, setShowColumnModal] = useState(false);
  const [columnMenuPos, setColumnMenuPos] = useState({ top: 0, left: 0 });
  const columnButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let animationFrameId: number;

    const updateColumnMenuPos = () => {
      if (showColumnModal && columnButtonRef.current) {
        const rect = columnButtonRef.current.getBoundingClientRect();
        setColumnMenuPos({
          top: rect.bottom + 8,
          left: rect.right - 260,
        });
      }

      if (showColumnModal) {
        animationFrameId = requestAnimationFrame(updateColumnMenuPos);
      }
    };

    if (showColumnModal) {
      updateColumnMenuPos();
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [showColumnModal]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const isColumnButtonClick = columnButtonRef.current?.contains(target);
      const columnDropdownEl = document.querySelector('[style*="260px"]');
      const isColumnDropdownClick = columnDropdownEl?.contains(target);

      if (!isColumnButtonClick && !isColumnDropdownClick && target.tagName !== "INPUT") {
        setShowColumnModal(false);
      }
    };

    if (showColumnModal) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [showColumnModal]);

  const toggleColumnVisibility = (columnKey: string) => {
    const newVisibleColumns = new Set(visibleColumns);
    if (newVisibleColumns.has(columnKey)) {
      if (newVisibleColumns.size > 1) {
        newVisibleColumns.delete(columnKey);
      }
    } else {
      newVisibleColumns.add(columnKey);
    }
    setVisibleColumns(newVisibleColumns);
  };

  return {
    visibleColumns,
    setVisibleColumns,
    showColumnModal,
    setShowColumnModal,
    columnMenuPos,
    columnButtonRef,
    toggleColumnVisibility,
  };
}
