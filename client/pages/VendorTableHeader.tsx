import React from "react";

interface ColumnConfig {
  label: string;
  icon: React.ReactNode;
}

interface VendorTableHeaderProps {
  columnOrder: string[];
  columnConfig: Record<string, ColumnConfig>;
  draggedColumn: string | null;
  dropTargetColumn: string | null;
  dropPosition: "before" | "after";
  onColumnDragStart: (columnKey: string) => void;
  onColumnDragOver: (e: React.DragEvent, columnKey: string) => void;
  onColumnDragLeave: () => void;
  onColumnDrop: (e: React.DragEvent, columnKey: string) => void;
  handleSortClick: (columnKey: string) => void;
  getSortIndicator: (columnKey: string) => string | null;
}

export default function VendorTableHeader({
  columnOrder,
  columnConfig,
  draggedColumn,
  dropTargetColumn,
  dropPosition,
  onColumnDragStart,
  onColumnDragOver,
  onColumnDragLeave,
  onColumnDrop,
  handleSortClick,
  getSortIndicator,
}: VendorTableHeaderProps) {
  return (
    <tr className="border-b border-gray-200 bg-gray-50 h-12">
      {columnOrder.map((columnKey) => (
        <th
          key={columnKey}
          draggable
          onDragStart={() => onColumnDragStart(columnKey)}
          onDragOver={(e) => onColumnDragOver(e, columnKey)}
          onDragLeave={onColumnDragLeave}
          onDrop={(e) => onColumnDrop(e, columnKey)}
          onClick={() => handleSortClick(columnKey)}
          className="px-3 py-3 text-left border-r border-gray-200 flex-1 relative hover:bg-gray-100 transition-colors cursor-pointer"
          style={{
            whiteSpace: columnKey === "name" ? "nowrap" : "normal",
            opacity: draggedColumn === columnKey ? 0.5 : 1,
            transition: "opacity 0.2s ease",
          }}
        >
          {dropTargetColumn === columnKey && draggedColumn && (
            <div
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                width: "2px",
                backgroundColor: "#3b82f6",
                left: dropPosition === "before" ? "0" : "auto",
                right: dropPosition === "after" ? "0" : "auto",
              }}
            />
          )}
          <div className="flex items-center gap-2">
            {columnConfig[columnKey]?.icon}
            <span className="font-medium text-sm text-gray-700">
              {columnConfig[columnKey]?.label}
            </span>
            {getSortIndicator(columnKey) && (
              <span className="text-xs font-bold text-gray-700 ml-1">
                {getSortIndicator(columnKey)}
              </span>
            )}
          </div>
        </th>
      ))}
      <th
        className="sticky right-0 px-2 py-3 text-center w-20"
        style={{
          borderLeftWidth: "2px",
          border: "1px none rgb(226, 232, 240)",
          backgroundColor: "white",
        }}
      >
        <span className="font-medium text-sm text-gray-700">
          Actions
        </span>
      </th>
    </tr>
  );
}
