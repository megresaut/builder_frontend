import { useState, useRef, useEffect, ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import GlobalActionsDropdown from "@/components/GlobalActionsDropdown";
import { Search, ChevronDown } from "lucide-react";

interface Column {
  key: string;
  label: string;
  icon?: ReactNode;
}

export interface ActionItem {
  label: string | ((row: any) => string);
  icon: ReactNode | ((row: any) => ReactNode);
  onClick: (row: any) => void;
  className?: string;
  hidden?: boolean | ((row: any) => boolean);
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
  showPageSizeDropdown: boolean;
  onShowPageSizeDropdownChange?: (show: boolean) => void;
  openMenuId: string | number | null;
  onOpenMenuIdChange: (id: string | number | null) => void;
  title?: string | ReactNode;
  subtitle?: string;
  headerActions?: ReactNode;
  showColumnModal: boolean;
  onShowColumnModalChange: (show: boolean) => void;
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
  showPageSizeDropdown,
  onShowPageSizeDropdownChange,
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

  const dropdownButtonRef = useRef<HTMLButtonElement>(null);
  const dropdownMenuRef = useRef<HTMLDivElement>(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });

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

  useEffect(() => {
    if (!showPagination) return;

    let animationFrameId: number;

    const updateDropdownPos = () => {
      if (showPageSizeDropdown && dropdownButtonRef.current) {
        const rect = dropdownButtonRef.current.getBoundingClientRect();
        setDropdownPos({
          top: rect.bottom + 8,
          left: rect.left,
        });
      }

      if (showPageSizeDropdown) {
        animationFrameId = requestAnimationFrame(updateDropdownPos);
      }
    };

    if (showPageSizeDropdown) {
      updateDropdownPos();
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [showPageSizeDropdown, showPagination]);

  useEffect(() => {
    if (!showPagination || !showPageSizeDropdown) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        dropdownButtonRef.current?.contains(target) ||
        dropdownMenuRef.current?.contains(target)
      ) {
        return;
      }

      onShowPageSizeDropdownChange?.(false);
    };

    const handleMouseMove = (event: MouseEvent) => {
      const buttonRect = dropdownButtonRef.current?.getBoundingClientRect();
      const menuRect = dropdownMenuRef.current?.getBoundingClientRect();

      if (!buttonRect || !menuRect) return;

      const { clientX, clientY } = event;
      const DISTANCE_THRESHOLD = 150;

      const isNearButton =
        clientX >= buttonRect.left - DISTANCE_THRESHOLD &&
        clientX <= buttonRect.right + DISTANCE_THRESHOLD &&
        clientY >= buttonRect.top - DISTANCE_THRESHOLD &&
        clientY <= buttonRect.bottom + DISTANCE_THRESHOLD;

      const isNearMenu =
        clientX >= menuRect.left - DISTANCE_THRESHOLD &&
        clientX <= menuRect.right + DISTANCE_THRESHOLD &&
        clientY >= menuRect.top - DISTANCE_THRESHOLD &&
        clientY <= menuRect.bottom + DISTANCE_THRESHOLD;

      if (!isNearButton && !isNearMenu) {
        onShowPageSizeDropdownChange?.(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("mousemove", handleMouseMove);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("mousemove", handleMouseMove);
    };
  }, [showPageSizeDropdown, onShowPageSizeDropdownChange, showPagination]);

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
              typeof title === 'string' ? (
                <h2 className="font-medium text-[22px] leading-6" style={{ color: "var(--color-text-primary)" }}>
                  {title}
                </h2>
              ) : (
                <div className="font-medium text-[22px] leading-6" style={{ color: "var(--color-text-primary)" }}>
                  {title}
                </div>
              )
            )}
          </div>
          <div className="flex items-center gap-2.5">
            {showSearchBar && (
              <div className="flex h-9 items-center gap-2 px-3 rounded-lg bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.03)]" style={{ borderColor: "var(--color-border-default)", borderWidth: "1px" }}>
                <Search className="w-5 h-5 text-gray-600 shrink-0" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={typeof searchValue === "string" ? searchValue : ""}
                  onChange={(e) => onSearchChange?.(e.target.value)}
                  className="font-normal text-base leading-[140%] tracking-[-0.32px] capitalize bg-transparent border-none outline-none w-32 sm:w-48 min-w-0"
                  style={{
                    color: "var(--color-text-primary)",
                  }}
                  aria-label="Search"
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
                  {actions.length > 0 && (() => {
                    // Filter actions that are visible for this row
                    const visibleActions = actions.filter((action) => {
                      if (action.hidden === undefined) return true;
                      if (typeof action.hidden === "boolean") return !action.hidden;
                      return !action.hidden(row);
                    });
                    
                    // Only render actions cell if there are visible actions
                    if (visibleActions.length === 0) return null;
                    
                    return (
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
                        <GlobalActionsDropdown
                          row={row}
                          rowKey={rowKey}
                          actions={visibleActions}
                          openMenuId={openMenuId}
                          setOpenMenuId={onOpenMenuIdChange}
                        />
                      </td>
                    );
                  })()}
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
          <div className="relative" style={{ position: "relative", zIndex: 10 }}>
            <button
              ref={dropdownButtonRef}
              onClick={() =>
                onShowPageSizeDropdownChange?.(!showPageSizeDropdown)
              }
              className="ra-table-page-size-button flex items-center justify-center gap-2 h-10 px-3 border rounded-lg bg-white hover:bg-gray-50 transition-colors font-medium text-sm relative"
              style={{
                borderColor: "var(--color-border-default)",
                borderWidth: "0.909091px",
                color: "var(--color-text-primary)",
                boxShadow:
                  "rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.03) 0px 1px 3px 0px",
              }}
            >
              <div className="font-medium text-sm" style={{ color: "var(--color-text-primary)" }}>
                {itemsPerPage}
              </div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
          </div>
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
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke={currentPage === 1 ? "var(--color-text-muted)" : "currentColor"}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m12 19-7-7 7-7" />
              <path d="M19 12H5" />
            </svg>
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
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke={
                currentPage === totalPages
                  ? "var(--color-text-muted)"
                  : "currentColor"
              }
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </button>
        </div>
        </div>
      )}

      {/* Dropdown Menu - Rendered via Portal at body level */}
      {showPagination &&
        showPageSizeDropdown &&
        createPortal(
          <div
            ref={dropdownMenuRef}
            className="ra-table-page-size-menu bg-white overflow-hidden"
            style={{
              borderColor: "var(--color-border-default)",
              borderWidth: "0.5px",
              borderStyle: "solid",
              borderRadius: "8px",
              boxShadow:
                "0 38px 11px 0 rgba(0, 0, 0, 0.00), 0 24px 10px 0 rgba(0, 0, 0, 0.01), 0 14px 8px 0 rgba(0, 0, 0, 0.04), 0 6px 6px 0 rgba(0, 0, 0, 0.06), 0 2px 3px 0 rgba(0, 0, 0, 0.07)",
              zIndex: 99999,
              minWidth: "56px",
              width: "56px",
              position: "fixed",
              top: dropdownPos.top + "px",
              left: dropdownPos.left + "px",
              pointerEvents: "auto",
            }}
            onMouseLeave={() => onShowPageSizeDropdownChange?.(false)}
          >
            {[10, 25, 50].map((size, index) => (
              <button
                key={size}
                onClick={() => {
                  onItemsPerPageChange(size);
                  onPageChange(1);
                  onShowPageSizeDropdownChange?.(false);
                }}
                className={cn(
                  "ra-table-page-size-option w-full px-4 py-3 text-center text-base transition-colors whitespace-nowrap hover:bg-gray-50",
                  itemsPerPage === size
                    ? "bg-gray-50 font-medium"
                    : "font-normal"
                )}
                style={{
                  color: "var(--color-text-primary)",
                  fontFamily:
                    "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                  fontSize: "16px",
                  lineHeight: "140%",
                  letterSpacing: "-0.32px",
                  borderRadius: index === 2 ? "0 0 8px 8px" : "0",
                }}
              >
                {size}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </div>
  );
}
