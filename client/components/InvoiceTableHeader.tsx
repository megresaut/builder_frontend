import React from "react";

interface ColumnConfig {
  key: string;
  label: string;
  width?: string;
  minWidth?: string;
  flex?: number;
  icon?: string;
  sortable?: boolean;
}

interface InvoiceTableHeaderProps {
  columns: ColumnConfig[];
  gridTemplateColumns: string;
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

const getColumnIcon = (columnKey: string) => {
  switch (columnKey) {
    case "vendor":
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
          <circle cx="8" cy="5" r="2" stroke="#525252" strokeWidth="1.2" fill="none" />
          <path d="M2 14c0-2.21 2.686-4 6-4s6 1.79 6 4" stroke="#525252" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        </svg>
      );
    case "glAccount":
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
          <rect x="2" y="2" width="12" height="12" rx="1" stroke="#525252" strokeWidth="1.2" fill="none" />
          <line x1="2" y1="5" x2="14" y2="5" stroke="#525252" strokeWidth="1.2" />
          <line x1="5" y1="2" x2="5" y2="14" stroke="#525252" strokeWidth="1.2" />
          <line x1="11" y1="2" x2="11" y2="14" stroke="#525252" strokeWidth="1.2" />
        </svg>
      );
    case "description":
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
          <path d="M3 2h10a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z" stroke="#525252" strokeWidth="1.2" fill="none" />
          <line x1="4" y1="5" x2="12" y2="5" stroke="#525252" strokeWidth="1" />
          <line x1="4" y1="8" x2="12" y2="8" stroke="#525252" strokeWidth="1" />
          <line x1="4" y1="11" x2="10" y2="11" stroke="#525252" strokeWidth="1" />
        </svg>
      );
    case "amount":
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
          <circle cx="8" cy="8" r="5.5" stroke="#525252" strokeWidth="1.2" fill="none" />
          <path d="M8 5.5v5M6.5 8h3" stroke="#525252" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      );
    case "source":
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
          <path d="M2 4h12M2 8h12M2 12h12" stroke="#525252" strokeWidth="1.2" strokeLinecap="round" />
          <circle cx="13" cy="4" r="1.5" fill="#525252" />
          <circle cx="13" cy="8" r="1.5" fill="#525252" />
          <circle cx="13" cy="12" r="1.5" fill="#525252" />
        </svg>
      );
    case "status":
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
          <circle cx="8" cy="8" r="5.5" stroke="#525252" strokeWidth="1.2" fill="none" />
          <path d="M6 8l1.5 1.5L10 6.5" stroke="#525252" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "dateCreated":
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
          <rect x="2" y="3" width="12" height="11" rx="1" stroke="#525252" strokeWidth="1.2" fill="none" />
          <path d="M5 1v4M11 1v4" stroke="#525252" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="2" y1="6" x2="14" y2="6" stroke="#525252" strokeWidth="1.2" />
        </svg>
      );
    case "invoiceMonth":
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
          <rect x="2" y="3" width="12" height="11" rx="1" stroke="#525252" strokeWidth="1.2" fill="none" />
          <path d="M5 1v4M11 1v4" stroke="#525252" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="2" y1="6" x2="14" y2="6" stroke="#525252" strokeWidth="1.2" />
        </svg>
      );
    default:
      return null;
  }
};

export const InvoiceTableHeader: React.FC<InvoiceTableHeaderProps> = ({
  columns,
  gridTemplateColumns,
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
    <div
      className="grid w-full"
      style={{ gridTemplateColumns, minWidth: "100%" }}
    >
      {columns.map((column) => {
        const isDropTarget =
          dropTargetColumn === column.key && draggedColumn !== column.key;

        return (
          <div
            key={column.key}
            className={`border-r border-[#e5e5e5] flex flex-col overflow-hidden transition-opacity relative min-w-0 ${
              draggedColumn === column.key ? "opacity-50" : ""
            }`}
            style={{ borderLeftColor: "transparent" }}
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
              {getColumnIcon(column.key)}
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
    </div>
  );
};
