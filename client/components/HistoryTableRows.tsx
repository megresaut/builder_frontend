import React from "react";

interface InvoiceHistoryItem {
  id: number;
  dateCreated: string;
  invoiceMonth: string;
  amount: string;
  lineItems: Array<{
    id: number;
    vendor: string;
    description: string;
    amount: string;
  }>;
}

interface ColumnConfig {
  key: string;
  width?: string;
  minWidth?: string;
  flex?: number;
}

interface HistoryTableRowsProps {
  items: InvoiceHistoryItem[];
  visibleColumns: ColumnConfig[];
  gridTemplateColumns: string;
  onRowClick: (item: InvoiceHistoryItem) => void;
}

export const HistoryTableRows: React.FC<HistoryTableRowsProps> = ({
  items,
  visibleColumns,
  gridTemplateColumns,
  onRowClick,
}) => {
  const renderCellContent = (columnKey: string, item: InvoiceHistoryItem) => {
    switch (columnKey) {
      case "dateCreated":
      case "invoiceMonth":
      case "amount":
        return (
          <div className="text-[#303030] text-sm font-normal leading-[1.4] tracking-[-0.32px] whitespace-nowrap truncate">
            {item[columnKey as keyof InvoiceHistoryItem]}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full flex flex-col">
      {items.map((item) => (
        <div
          key={item.id}
          className="grid w-full cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => onRowClick(item)}
          style={{ gridTemplateColumns, minWidth: "100%", borderLeftColor: "transparent" }}
        >
          {visibleColumns.map((column) => (
            <div
              key={`${item.id}-${column.key}`}
              className="items-center border-r border-b-[0.5px] border-[#e5e5e5] flex overflow-hidden min-h-14 gap-2.5 px-3 min-w-0"
              style={{ borderLeftColor: "transparent" }}
            >
              {renderCellContent(column.key, item)}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};
