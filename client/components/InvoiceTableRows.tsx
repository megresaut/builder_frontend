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
  width: string;
}

interface InvoiceTableRowsProps {
  items: InvoiceItem[];
  visibleColumns: ColumnConfig[];
  showingPendingInsights: boolean;
}

export const InvoiceTableRows: React.FC<InvoiceTableRowsProps> = ({
  items,
  visibleColumns,
  showingPendingInsights,
}) => {
  const renderCellContent = (columnKey: string, item: InvoiceItem) => {
    const isPending =
      showingPendingInsights && item.status === "Pending Approval";

    switch (columnKey) {
      case "vendor":
        return (
          <div
            className="rounded-full shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] border flex min-h-7 w-7 items-center gap-2.5 overflow-hidden justify-center"
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
        );
      case "glAccount":
      case "description":
      case "amount":
      case "source":
        return (
          <div className="text-[#303030] text-sm font-normal leading-[1.4] tracking-[-0.32px] flex-1">
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
    <>
      {items.map((item) => (
        <div
          key={item.id}
          className="flex w-full items-center flex-nowrap"
          style={{ borderLeftColor: "transparent" }}
        >
          {visibleColumns.map((columnKey) => (
            <div
              key={`${item.id}-${columnKey}`}
              className={`items-center border-b-[0.5px] flex min-h-14 w-full gap-2.5 px-3 ${
                showingPendingInsights && item.status === "Pending Approval"
                  ? "bg-[#F5F3FF] border-[#E5E5FF]"
                  : "border-[#e5e5e5]"
              }`}
              style={{
                borderLeftColor:
                  showingPendingInsights &&
                  item.status === "Pending Approval"
                    ? "#6366F1"
                    : "transparent",
              }}
            >
              {renderCellContent(columnKey, item)}
            </div>
          ))}
        </div>
      ))}
    </>
  );
};
