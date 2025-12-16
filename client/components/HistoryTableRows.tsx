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
  width: string;
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
    <>
      {items.map((item) => (
        <div
          key={item.id}
          className="flex w-full items-center flex-nowrap cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => onRowClick(item)}
          style={{ borderLeftColor: "transparent" }}
        >
          {visibleColumns.map((columnKey) => (
            <div
              key={`${item.id}-${columnKey}`}
              className="items-center border-b-[0.5px] border-[#e5e5e5] flex min-h-14 w-full gap-2.5 px-3"
              style={{ borderLeftColor: "transparent" }}
            >
              {renderCellContent(columnKey, item)}
            </div>
          ))}
        </div>
      ))}
    </>
  );
};
