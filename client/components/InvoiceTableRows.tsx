import React from "react";
import { StatusBadge } from "@/components/StatusBadge";

interface InvoiceItem {
  id: number;
  vendor: string;
  vendorIcon: string;
  vendorBg: string;
  vendorBorder: string;
  glAccount: string;
  description: string;
  amount: string;
  source: string;
  status: "Pending Approval" | "Approved";
  statusColor: string;
  statusBg: string;
}

interface ColumnConfig {
  key: string;
  width?: string;
  minWidth?: string;
  flex?: number;
}

interface InvoiceTableRowsProps {
  items: InvoiceItem[];
  visibleColumns: ColumnConfig[];
  gridTemplateColumns: string;
  showingPendingInsights: boolean;
}

export const InvoiceTableRows: React.FC<InvoiceTableRowsProps> = ({
  items,
  visibleColumns,
  gridTemplateColumns,
  showingPendingInsights,
}) => {
  const renderCellContent = (columnKey: string, item: InvoiceItem) => {
    switch (columnKey) {
      case "vendor":
        return (
          <div className="flex items-center gap-2.5 whitespace-nowrap">
            <div
              className="rounded-full shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] border flex min-h-7 w-7 items-center gap-2.5 overflow-hidden justify-center flex-shrink-0"
              style={{
                backgroundColor: item.vendorBg,
                borderColor: item.vendorBorder,
              }}
            >
              <img
                loading="lazy"
                src={item.vendorIcon}
                className="w-5 h-5"
                alt=""
              />
            </div>
            <div className="text-[#303030] text-sm font-normal leading-[1.4] tracking-[-0.32px] truncate">
              {item.vendor}
            </div>
          </div>
        );
      case "glAccount":
      case "description":
      case "amount":
      case "source":
        return (
          <div className="text-[#303030] text-sm font-normal leading-[1.4] tracking-[-0.32px] whitespace-nowrap truncate">
            {item[columnKey as keyof InvoiceItem]}
          </div>
        );
      case "status":
        return <StatusBadge status={item.status} />;
      default:
        return null;
    }
  };

  return (
    <div className="w-full flex flex-col">
      {items.map((item) => (
        <div
          key={item.id}
          className="grid w-full"
          style={{ gridTemplateColumns, minWidth: "100%", borderLeftColor: "transparent" }}
        >
          {visibleColumns.map((column) => (
            <div
              key={`${item.id}-${column.key}`}
              className={`border-r border-b-[0.5px] flex items-center overflow-hidden min-h-14 gap-2.5 px-3 min-w-0 ${
                showingPendingInsights && item.status === "Pending Approval"
                  ? "bg-[#F5F3FF] border-[#E5E5FF]"
                  : "border-[#e5e5e5]"
              }`}
              style={{
                borderLeftColor:
                  showingPendingInsights && item.status === "Pending Approval"
                    ? "#6366F1"
                    : "transparent",
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
