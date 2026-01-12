import { useState, useRef, useEffect, ReactNode } from "react";
import { cn } from "@/lib/utils";
import PopoverActionsDropdown from "@/components/PopoverActionsDropdown";
import { PageSizeDropdown } from "@/components/PageSizeDropdown";
import { Search, ChevronDown } from "lucide-react";
import { ArrowBackIcon, ArrowForwardIcon } from "@/components/icons";

interface Column {
  key: string;
  label: string;
  icon?: ReactNode;
}

interface ActionItem {
  label: string | ((row: any) => string);
  icon: ReactNode | ((row: any) => ReactNode);
  onClick: (row: any) => void;
  className?: string;
}

interface GlobalTableProps {
  className?: string;
  columns: Column[];
  data: any[];
  rowKey: string;
  onRowClick?: (row: any, e: React.MouseEvent) => void;
  actions?: ActionItem[];
  renderCell: (row: any, columnKey: string) => ReactNode;
  sortingHook: any;
  columnManagementHook: any;
  currentPage: number;
  onPageChange: (page: number) => void;
  itemsPerPage: number;
  onItemsPerPageChange: (itemsPerPage: number) => void;
  openMenuId: string | number | null;
  onOpenMenuIdChange: (id: string | number | null) => void;
  title?: string;
  subtitle?: string;
  headerActions?: ReactNode;
  showColumnModal: boolean;
  onShowColumnModalChange: (show: boolean) => void;
  showPageSizeDropdown?: boolean;
  onShowPageSizeDropdownChange?: (show: boolean) => void;
  showPagination?: boolean;
  getRowClassName?: (row: any) => string;
  getCellClassName?: (row: any, columnKey: string) => string;
  showSearchBar?: boolean;
  onSearchChange?: (value: string) => void;
  searchValue?: string;
  onFilterClick?: () => void | undefined;
  showFilterButton?: boolean;
}

export default function GlobalTable({
  className,
  columns,
  data,
  rowKey,
  onRowClick,
  actions = [],
  renderCell,
  sortingHook,
  columnManagementHook,
  currentPage,
  onPageChange,
  itemsPerPage,
  onItemsPerPageChange,
  openMenuId,
  onOpenMenuIdChange,
  title,
  subtitle,
  headerActions,
  showColumnModal,
  onShowColumnModalChange,
  showPagination = true,
  getRowClassName,
  getCellClassName,
  showSearchBar = true,
  onSearchChange,
  searchValue = "",
  onFilterClick,
  showFilterButton = true,
}: GlobalTableProps) {
  const { handleSortClick, getSortIndicator, getSortedData } = sortingHook;
  const {
    columnOrder,
    visibleColumns,
    draggedColumn,
    dropTargetColumn,
    dropPosition,
    columnMenuPos,
    columnButtonRef,
    toggleColumnVisibility,
    handleColumnDragStart,
    handleColumnDragOver,
    handleColumnDragLeave,
    handleColumnDrop,
  } = columnManagementHook;

  const sorted = getSortedData();
  const totalRows = sorted.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / itemsPerPage));

  const getDisplayedRowsForPage = () => {
    if (!showPagination) return sorted;

    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return sorted.slice(start, end);
  };

  const getPaginationNumbers = () => {
    const pages: (number | string)[] = [];

    if (totalPages <= 1) {
      return [1];
    }

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
      return pages;
    }

    const windowSize = 7;
    let start = Math.max(1, currentPage - 2);
    let end = start + windowSize - 1;

    if (end > totalPages) {
      end = totalPages;
      start = Math.max(1, end - windowSize + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  };

  const createColumnConfig = (): Record<string, { label: string; icon: ReactNode }> => {
    const config: Record<string, { label: string; icon: ReactNode }> = {};
    columns.forEach((col) => {
      config[col.key] = {
        label: col.label,
        icon: col.icon || null,
      };
    });
    return config;
  };

  const columnConfig = createColumnConfig();

  const displayedColumnKeys = columnOrder.filter(
    (colKey) => visibleColumns.has(colKey) && Boolean(columnConfig[colKey]),
  );

  return (
    <div
      className={cn(
        "ra-table w-full border border-gray-200 bg-white rounded-lg overflow-hidden",
        className,
      )}
    >
      {/* Table Header */}
      {(title || headerActions) && (
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-4">
            {title && (
              <h2 className="font-medium text-[22px] leading-6" style={{ color: "var(--color-text-primary)" }}>
                {title}
              </h2>
            )}
          </div>
          <div className="flex items-center gap-2.5">
            {showSearchBar && (
              <div className="flex h-9 items-center gap-2 px-3 rounded-lg bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.03)]" style={{ borderColor: "var(--color-border-default)", borderWidth: "1px" }}>
                <Search className="w-5 h-5 text-gray-600" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchValue}
                  onChange={(e) => onSearchChange?.(e.target.value)}
                  className="font-normal text-base leading-[140%] tracking-[-0.32px] capitalize bg-transparent border-none outline-none w-32 sm:w-48"
                  style={{
                    color: "var(--color-text-primary)",
                  }}
                />
              </div>
            )}
            {showFilterButton && (
              <button
                onClick={() => onFilterClick?.()}
                className="flex h-9 justify-center items-center gap-2 px-3 rounded-lg bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] hover:bg-gray-50 transition-colors"
                style={{ borderColor: "var(--color-border-default)", borderWidth: "1px" }}
              >
                <span className="font-normal text-base leading-[140%] tracking-[-0.32px] capitalize" style={{ color: "var(--color-text-primary)" }}>
                  Filter
                </span>
                <ChevronDown className="w-4 h-4" />
              </button>
            )}
            {headerActions}
          </div>
        </div>
      )}

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="h-12 bg-gray-50" style={{ borderBottomColor: "var(--color-border-light)", borderBottomWidth: "1px" }}>
              {displayedColumnKeys.map((colKey) => {
                  const colConfig = columnConfig[colKey];
                  const sortIndicator = getSortIndicator(colKey);
                  return (
                    <th
                      key={colKey}
                      draggable
                      onDragStart={() => handleColumnDragStart(colKey)}
                      onDragOver={(e) => handleColumnDragOver(e, colKey)}
                      onDragLeave={handleColumnDragLeave}
                      onDrop={(e) => handleColumnDrop(e, colKey)}
                      onClick={() => handleSortClick(colKey)}
                      className="ra-table-header-cell px-3 py-3 text-left whitespace-nowrap cursor-pointer hover:bg-gray-100 transition-colors relative"
                      style={{
                        borderRightColor: "var(--color-border-light)",
                        borderRightWidth: "1px",
                        opacity: draggedColumn === colKey ? 0.5 : 1,
                        transition: "opacity 0.2s ease",
                      }}
                    >
                      {dropTargetColumn === colKey && draggedColumn && (
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
                        {colConfig?.icon && (
                          <div className="ra-table-header-icon">
                            {colConfig.icon}
                          </div>
                        )}
                        <span className="ra-table-header-label font-medium text-sm" style={{ color: "var(--color-text-primary)" }}>
                          {colConfig?.label}
                        </span>
                        {sortIndicator && (
                          <span className="ra-table-sort-indicator text-xs font-bold ml-1" style={{ color: "var(--color-text-primary)" }}>
                            {sortIndicator}
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
              {actions.length > 0 && (
                <th
                  className="ra-table-actions-header sticky right-0 px-2 py-3 text-center w-20"
                  style={{
                    borderLeftWidth: "2px",
                    borderLeftColor: "var(--color-border-default)",
                    backgroundColor: "white",
                  }}
                >
                  <span className="ra-table-actions-label font-medium text-sm" style={{ color: "var(--color-text-primary)" }}>
                    Actions
                  </span>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {getDisplayedRowsForPage().map((row) => {
              const handleRowClick = (e: React.MouseEvent) => {
                if (
                  actions.length > 0 &&
                  (e.target as HTMLElement).closest(
                    '[data-global-table-actions-cell="true"]',
                  )
                ) {
                  return;
                }

                onRowClick?.(row, e);
              };

              return (
                <tr
                  key={row[rowKey]}
                  onClick={handleRowClick}
                  className={cn(
                    "ra-table-row hover:bg-gray-50 transition-colors h-12",
                    onRowClick ? "cursor-pointer" : "",
                    getRowClassName?.(row),
                  )}
                  style={{ borderBottomColor: "var(--color-border-light)", borderBottomWidth: "1px" }}
                >
                  {displayedColumnKeys.map((colKey) => (
                      <td
                        key={colKey}
                        className={cn(
                          "ra-table-cell px-3 py-3 whitespace-nowrap overflow-visible",
                          getCellClassName?.(row, colKey),
                        )}
                        style={{ borderRightColor: "var(--color-border-light)", borderRightWidth: "1px" }}
                      >
                        {renderCell(row, colKey)}
                      </td>
                    ))}
                  {actions.length > 0 && (
                    <td
                      data-global-table-actions-cell="true"
                      className={cn(
                        "ra-table-actions-cell sticky right-0 px-2 py-3 flex items-center justify-center",
                        getCellClassName?.(row, "__actions__"),
                      )}
                      style={{
                        borderLeftWidth: "2px",
                        width: "80px",
                        borderLeftColor: "transparent",
                        backgroundColor: "white",
                      }}
                    >
                      <PopoverActionsDropdown
                        row={row}
                        rowKey={rowKey}
                        actions={actions}
                      />
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {showPagination && (
        <div
          className="ra-table-pagination flex justify-between items-center px-6 py-4 bg-white gap-4 relative"
          style={{ position: "relative", zIndex: 1, overflow: "visible" }}
        >
        <div className="flex items-center gap-2">
          <span className="ra-table-pagination-label text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
            Showing
          </span>
          <PageSizeDropdown
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={onItemsPerPageChange}
            onPageChange={onPageChange}
            totalRows={totalRows}
          />
          <span className="ra-table-pagination-total text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
            of {totalRows}
          </span>
        </div>
        <div
          className="ra-table-pagination-controls flex items-center rounded-lg border bg-white overflow-hidden"
          style={{
            borderColor: "var(--color-border-default)",
            borderWidth: "0.909091px",
            boxShadow:
              "rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.03) 0px 1px 3px 0px",
          }}
        >
          <button
            disabled={currentPage === 1}
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            className={cn(
              "ra-table-prev-button flex items-center justify-center gap-1.5 h-10 px-3 transition-colors",
              currentPage === 1 ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50"
            )}
            style={{
              borderRightWidth: "0.909091px",
              borderRightColor: "var(--color-border-light)",
            }}
          >
            <ArrowBackIcon
              width={20}
              height={20}
              style={{
                color: currentPage === 1 ? "var(--color-text-muted)" : "currentColor"
              }}
            />
            <div
              className={cn(
                "font-medium text-sm",
                currentPage === 1 ? "opacity-50" : ""
              )}
              style={{
                color: currentPage === 1 ? "var(--color-text-muted)" : "var(--color-text-primary)"
              }}
            >
              Previous
            </div>
          </button>
          {getPaginationNumbers().map((page, idx) => (
            <button
              key={page === "..." ? `ellipsis-${idx}` : page}
              disabled={page === "..."}
              onClick={() => {
                if (page !== "...") {
                  onPageChange(page as number);
                }
              }}
              className={cn(
                "ra-table-pagination-page flex items-center justify-center h-10 min-w-10 transition-colors",
                page === "..." && "opacity-50 cursor-not-allowed"
              )}
              style={{
                borderRightWidth: "0.909091px",
                borderRightColor: "var(--color-border-light)",
                backgroundColor:
                  currentPage === page ? "white" : "rgba(0, 0, 0, 0)",
              }}
            >
              <div
                className="font-medium text-sm"
                style={{
                  color: currentPage === page ? "var(--color-text-primary)" : "var(--color-text-muted)",
                  fontWeight: currentPage === page ? "700" : "500",
                }}
              >
                {page}
              </div>
            </button>
          ))}
          <button
            disabled={currentPage === totalPages}
            onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
            className={cn(
              "ra-table-next-button flex items-center justify-center gap-1.5 h-10 px-3 transition-colors",
              currentPage === totalPages
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-gray-50"
            )}
            style={{
              backgroundColor: "rgba(0, 0, 0, 0)",
            }}
          >
            <div
              className="font-medium text-sm"
              style={{
                color: currentPage === totalPages ? "var(--color-text-muted)" : "var(--color-text-primary)"
              }}
            >
              Next
            </div>
            <ArrowForwardIcon
              width={20}
              height={20}
              style={{
                color: currentPage === totalPages ? "var(--color-text-muted)" : "currentColor"
              }}
            />
          </button>
        </div>
        </div>
      )}

    </div>
  );
}
