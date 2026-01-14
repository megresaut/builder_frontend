import { useState, useEffect, useRef } from "react";

export function useColumnManagement(defaultColumns: string[]) {
  const [columnOrder, setColumnOrder] = useState<string[]>(defaultColumns);
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(defaultColumns),
  );
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null);
  const [dropTargetColumn, setDropTargetColumn] = useState<string | null>(null);
  const [dropPosition, setDropPosition] = useState<"before" | "after">(
    "before",
  );
  const [showColumnModal, setShowColumnModal] = useState(false);
  const [columnMenuPos, setColumnMenuPos] = useState({ top: 0, left: 0 });
  const columnButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const updateColumnMenuPos = () => {
      if (showColumnModal && columnButtonRef.current) {
        const MENU_WIDTH = 260;
        const PADDING = 8;
        const rect = columnButtonRef.current.getBoundingClientRect();

        let left = rect.right - MENU_WIDTH;
        left = Math.min(
          Math.max(PADDING, left),
          Math.max(PADDING, window.innerWidth - MENU_WIDTH - PADDING),
        );

        let top = rect.bottom + 8;
        top = Math.min(
          Math.max(PADDING, top),
          Math.max(PADDING, window.innerHeight - PADDING),
        );

        setColumnMenuPos({
          top,
          left,
        });
      }
    };

    if (showColumnModal) {
      updateColumnMenuPos();
      // Listen for scroll/resize to keep menu anchored
      window.addEventListener("scroll", updateColumnMenuPos, true);
      window.addEventListener("resize", updateColumnMenuPos);

      return () => {
        window.removeEventListener("scroll", updateColumnMenuPos, true);
        window.removeEventListener("resize", updateColumnMenuPos);
      };
    }
  }, [showColumnModal]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const isColumnButtonClick = columnButtonRef.current?.contains(target);
      const columnDropdownEl = document.querySelector<HTMLElement>(
        '[data-column-filter-modal="true"]',
      );
      const isColumnDropdownClick =
        !!columnDropdownEl && columnDropdownEl.contains(target);

      if (!isColumnButtonClick && !isColumnDropdownClick) {
        setShowColumnModal(false);
      }
    };

    if (showColumnModal) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
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

  const handleColumnDragStart = (columnKey: string) => {
    setDraggedColumn(columnKey);
  };

  const handleColumnDragOver = (e: React.DragEvent, columnKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";

    const element = e.currentTarget as HTMLElement;
    const rect = element.getBoundingClientRect();
    const midpoint = rect.left + rect.width / 2;
    const position = e.clientX < midpoint ? "before" : "after";

    setDropTargetColumn(columnKey);
    setDropPosition(position);
  };

  const handleColumnDragLeave = () => {
    setDropTargetColumn(null);
  };

  const handleColumnDrop = (e: React.DragEvent, targetColumn: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!draggedColumn || draggedColumn === targetColumn) {
      setDraggedColumn(null);
      setDropTargetColumn(null);
      return;
    }

    const draggedIndex = columnOrder.indexOf(draggedColumn);
    const targetIndex = columnOrder.indexOf(targetColumn);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedColumn(null);
      setDropTargetColumn(null);
      return;
    }

    const newColumnOrder = [...columnOrder];
    newColumnOrder.splice(draggedIndex, 1);

    let insertIndex: number;
    if (dropPosition === "before") {
      insertIndex = draggedIndex < targetIndex ? targetIndex - 1 : targetIndex;
    } else {
      insertIndex = draggedIndex < targetIndex ? targetIndex : targetIndex + 1;
    }

    newColumnOrder.splice(insertIndex, 0, draggedColumn);
    setColumnOrder(newColumnOrder);

    setDraggedColumn(null);
    setDropTargetColumn(null);
    setDropPosition("before");
  };

  return {
    columnOrder,
    setColumnOrder,
    visibleColumns,
    setVisibleColumns,
    draggedColumn,
    setDraggedColumn,
    dropTargetColumn,
    setDropTargetColumn,
    dropPosition,
    setDropPosition,
    showColumnModal,
    setShowColumnModal,
    columnMenuPos,
    columnButtonRef,
    toggleColumnVisibility,
    handleColumnDragStart,
    handleColumnDragOver,
    handleColumnDragLeave,
    handleColumnDrop,
  };
}
