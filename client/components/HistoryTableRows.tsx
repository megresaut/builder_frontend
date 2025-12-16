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
  flex?: number;
}

interface HistoryTableRowsProps {
  items: InvoiceHistoryItem[];
  visibleColumns: ColumnConfig[];
  onRowClick: (item: InvoiceHistoryItem) => void;
}

export const HistoryTableRows: React.FC<HistoryTableRowsProps> = ({
  items,
  visibleColumns,
  onRowClick,
}) => {
  const renderCellContent = (columnKey: string, item: InvoiceHistoryItem) => {
    switch (columnKey) {
      case "dateCreated":
      case "invoiceMonth":
      case "amount":
        return (
          <div className="text-[#303030] text-sm font-normal leading-[1.4] tracking-[-0.32px] flex-1">
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
          className="flex w-full items-center flex-nowrap cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => onRowClick(item)}
          style={{ borderLeftColor: "transparent" }}
        >
          {visibleColumns.map((column) => (
            <div
              key={`${item.id}-${column.key}`}
              className={`items-center border-r border-b-[0.5px] border-[#e5e5e5] flex overflow-hidden min-h-14 gap-2.5 px-3 ${
                column.flex ? "" : "flex-shrink-0"
              }`}
              style={{
                ...(column.flex
                  ? { flex: column.flex }
                  : { width: column.width }),
                borderLeftColor: "transparent",
              }}
            >
              {renderCellContent(column.key, item)}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};
