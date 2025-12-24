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
        <img
          loading="lazy"
          src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/1bf3b3df8026becac5b0f8006e63c3cb79df6594?placeholderIfAbsent=true"
          className="flex-shrink-0"
          style={{ width: '16px', height: '16px' }}
          alt=""
        />
      );
    case "glAccount":
      return (
        <img
          loading="lazy"
          src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/049b679c03670a4d1cf3028269ec92ee2c8cc8e3?placeholderIfAbsent=true"
          className="flex-shrink-0"
          style={{ width: '16px', height: '16px' }}
          alt=""
        />
      );
    case "description":
      return (
        <img
          loading="lazy"
          src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/d5d01db2db718e32f4e620e7b1fc6ea705e115b1?placeholderIfAbsent=true"
          className="flex-shrink-0"
          style={{ width: '16px', height: '16px' }}
          alt=""
        />
      );
    case "amount":
      return (
        <img
          loading="lazy"
          src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/3b8ec0fa6eb0ec8e711c3a23fefa8083d72c2a94?placeholderIfAbsent=true"
          className="flex-shrink-0"
          style={{ width: '16px', height: '16px' }}
          alt=""
        />
      );
    case "source":
      return (
        <img
          loading="lazy"
          src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/225d3e057a8e01f2536a35172298a3ee7a373378?placeholderIfAbsent=true"
          className="flex-shrink-0"
          style={{ width: '16px', height: '16px' }}
          alt=""
        />
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
