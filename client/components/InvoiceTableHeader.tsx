import React from "react";

interface ColumnConfig {
  key: string;
  label: string;
  width: string;
  icon?: string;
  sortable?: boolean;
}

interface InvoiceTableHeaderProps {
  columns: ColumnConfig[];
  draggedColumn: string | null;
  dropTargetColumn: string | null;
  dropPosition: "before" | "after";
  onDragStart: (columnKey: string) => void;
  onDragOver: (e: React.DragEvent, columnKey: string) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, columnKey: string) => void;
  onSort?: (columnKey: string) => void;
  getSortIndicator?: (columnKey: string) => string | null;
}

export const InvoiceTableHeader: React.FC<InvoiceTableHeaderProps> = ({
  columns,
  draggedColumn,
  dropTargetColumn,
  dropPosition,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onSort,
  getSortIndicator,
}) => {
  return (
    <>
      {columns.map((column) => {
        const isDropTarget =
          dropTargetColumn === column.key && draggedColumn !== column.key;

        return (
          <div
            key={column.key}
            className={`border-r border-[#e5e5e5] flex flex-col overflow-hidden flex-shrink-0 transition-opacity relative ${
              draggedColumn === column.key ? "opacity-50" : ""
            }`}
            style={{
              width: column.width,
              borderLeftColor: "transparent",
            }}
            draggable={true}
            onDragStart={() => onDragStart(column.key)}
            onDragOver={(e) => onDragOver(e, column.key)}
            onDragLeave={onDragLeave}
            onDrop={(e) => onDrop(e, column.key)}
          >
            {/* Blue line indicator */}
            {isDropTarget && (
              <div
                className={`absolute top-0 bottom-0 w-1 bg-blue-500 z-50 ${
                  dropPosition === "before" ? "left-0" : "right-0"
                }`}
                style={{ pointerEvents: "none" }}
              />
            )}

            <div
              className="items-center border-b-[0.5px] border-[#e5e5e5] bg-[#f9fafb] flex w-full gap-2 overflow-hidden px-3 py-3 cursor-grab active:cursor-grabbing hover:bg-gray-200 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                if (column.sortable !== false && onSort) {
                  onSort(column.key);
                }
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="flex-shrink-0"
              >
                <circle cx="4" cy="4" r="1.5" fill="#999" opacity="0.5" />
                <circle cx="4" cy="8" r="1.5" fill="#999" opacity="0.5" />
                <circle cx="4" cy="12" r="1.5" fill="#999" opacity="0.5" />
                <circle cx="12" cy="4" r="1.5" fill="#999" opacity="0.5" />
                <circle cx="12" cy="8" r="1.5" fill="#999" opacity="0.5" />
                <circle cx="12" cy="12" r="1.5" fill="#999" opacity="0.5" />
              </svg>
              {column.icon && (
                <img
                  loading="lazy"
                  src={column.icon}
                  className="w-4 h-4"
                  alt=""
                />
              )}
              <div className="text-[#525252] font-medium text-sm tracking-[-0.32px] leading-6 whitespace-nowrap">
                {column.label}
              </div>
              {getSortIndicator && getSortIndicator(column.key) && (
                <span className="text-xs font-bold text-gray-500">
                  {getSortIndicator(column.key)}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </>
  );
};
