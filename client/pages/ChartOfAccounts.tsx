import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import PageTemplate from "@/layout/PageTemplate";
import { PageHeader } from "@/components/BillsPageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { cn } from "@/lib/utils";
import {
  fetchChartOfAccounts,
  type AccountType,
  type ChartAccount,
} from "@/data/chartOfAccounts";

type TabKey = "all" | AccountType;

const TABS: { id: TabKey; label: string }[] = [
  { id: "all", label: "All" },
  { id: "asset", label: "Asset" },
  { id: "liability", label: "Liability" },
  { id: "equity", label: "Equity" },
  { id: "income", label: "Income" },
  { id: "expense", label: "Expense" },
];

const TYPE_LABEL: Record<AccountType, string> = {
  asset: "Asset",
  liability: "Liability",
  equity: "Equity",
  income: "Income",
  expense: "Expense",
};

const TYPE_BADGE: Record<AccountType, string> = {
  asset: "bg-emerald-50 text-emerald-700 border-emerald-200",
  liability: "bg-amber-50 text-amber-700 border-amber-200",
  equity: "bg-violet-50 text-violet-700 border-violet-200",
  income: "bg-sky-50 text-sky-700 border-sky-200",
  expense: "bg-rose-50 text-rose-700 border-rose-200",
};

export default function ChartOfAccounts() {
  const [accounts, setAccounts] = useState<ChartAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedTab, setSelectedTab] = useState<TabKey>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilterBar, setShowFilterBar] = useState(false);
  const [activeOnly, setActiveOnly] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [showPageSizeDropdown, setShowPageSizeDropdown] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const dropdownButtonRef = useRef<HTMLButtonElement>(null);
  const dropdownMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchChartOfAccounts()
      .then((rows) => {
        if (!cancelled) setAccounts(rows);
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || "Failed to load accounts");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const tabCounts = useMemo(() => {
    const counts: Record<TabKey, number> = {
      all: 0,
      asset: 0,
      liability: 0,
      equity: 0,
      income: 0,
      expense: 0,
    };
    for (const a of accounts) {
      if (activeOnly && !a.is_active) continue;
      counts.all += 1;
      counts[a.account_type] += 1;
    }
    return counts;
  }, [accounts, activeOnly]);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return accounts.filter((a) => {
      if (selectedTab !== "all" && a.account_type !== selectedTab) return false;
      if (activeOnly && !a.is_active) return false;
      if (!q) return true;
      return (
        a.name.toLowerCase().includes(q) ||
        (a.buildium_name ?? "").toLowerCase().includes(q) ||
        (a.qbo_name ?? "").toLowerCase().includes(q)
      );
    });
  }, [accounts, selectedTab, searchTerm, activeOnly]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedTab, searchTerm, activeOnly]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginated = filtered.slice(startIndex, startIndex + itemsPerPage);
  const start = filtered.length === 0 ? 0 : startIndex + 1;
  const end = Math.min(startIndex + paginated.length, filtered.length);

  const getPaginationNumbers = (): (number | string)[] => {
    if (totalPages <= 1) return [1];
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const windowSize = 7;
    let s = Math.max(1, currentPage - 2);
    let e = s + windowSize - 1;
    if (e > totalPages) {
      e = totalPages;
      s = Math.max(1, e - windowSize + 1);
    }
    return Array.from({ length: e - s + 1 }, (_, i) => s + i);
  };

  // Position the page-size dropdown — prefer below the button, flip above
  // when there isn't enough room before the viewport bottom.
  useEffect(() => {
    let raf: number;
    const MENU_HEIGHT = 156; // 3 items × ~52px
    const update = () => {
      if (showPageSizeDropdown && dropdownButtonRef.current) {
        const rect = dropdownButtonRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const flipUp = spaceBelow < MENU_HEIGHT + 16;
        setDropdownPos({
          top: flipUp ? rect.top - MENU_HEIGHT - 8 : rect.bottom + 8,
          left: rect.left,
        });
      }
      if (showPageSizeDropdown) {
        raf = requestAnimationFrame(update);
      }
    };
    if (showPageSizeDropdown) update();
    return () => {
      if (raf) cancelAnimationFrame(raf);
    };
  }, [showPageSizeDropdown]);

  // Close the dropdown on outside click (more forgiving than mouseleave).
  useEffect(() => {
    if (!showPageSizeDropdown) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        dropdownButtonRef.current?.contains(target) ||
        dropdownMenuRef.current?.contains(target)
      ) {
        return;
      }
      setShowPageSizeDropdown(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showPageSizeDropdown]);

  return (
    <PageTemplate>
      <div className="flex flex-col gap-6 w-fit min-w-full">
        <PageHeader
          title="Chart of Accounts"
          description="Platform-canonical GL accounts mapped to Buildium and QuickBooks"
        />

        {/* Tab bar */}
        <div className="flex gap-1 border-b border-[#E5E5E5]">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSelectedTab(t.id)}
              className={cn(
                "px-4 py-2.5 text-sm font-medium transition-colors relative",
                selectedTab === t.id
                  ? "text-[#013764]"
                  : "text-[#717179] hover:text-[#303030]",
              )}
            >
              {t.label}
              <span className="ml-1.5 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-gray-200 text-xs font-medium text-gray-700">
                {tabCounts[t.id]}
              </span>
              {selectedTab === t.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#013764]" />
              )}
            </button>
          ))}
        </div>

        {error && (
          <div className="px-4 py-3 rounded-lg border border-rose-200 bg-rose-50 text-sm text-rose-700">
            {error}
          </div>
        )}

        <div className="w-full border border-gray-200 bg-white rounded-lg overflow-hidden">
          {/* Card header */}
          <div className="flex justify-between items-center px-6 py-3 border-b border-gray-200 bg-white">
            <div className="flex items-center gap-4">
              <h2 className="text-[#303030] font-medium text-[22px] leading-6">
                Account List
              </h2>
              <span className="text-sm text-[#717179]">
                {loading ? "Loading…" : `${filtered.length} accounts`}
              </span>
            </div>
            <div className="flex items-start gap-2.5">
              <div className="flex h-9 items-center gap-2 px-3 rounded-lg border border-[#DADADA] bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.03)]">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M17.5 17.5L13.875 13.875M15.8333 9.16667C15.8333 12.8486 12.8486 15.8333 9.16667 15.8333C5.48477 15.8333 2.5 12.8486 2.5 9.16667C2.5 5.48477 5.48477 2.5 9.16667 2.5C12.8486 2.5 15.8333 5.48477 15.8333 9.16667Z"
                    stroke="#303030"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="text-[#303030] font-normal text-base leading-[140%] tracking-[-0.32px] bg-transparent border-none outline-none placeholder:text-[#303030] w-32 sm:w-48"
                />
              </div>
              <button
                onClick={() => setShowFilterBar(!showFilterBar)}
                className={cn(
                  "flex h-9 justify-center items-center gap-2 px-3 rounded-lg border border-[#DADADA] bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] hover:bg-gray-50 transition-colors",
                  showFilterBar && "ring-1 ring-[#013764] bg-gray-50/50",
                )}
              >
                <span className="text-[#303030] font-normal text-base leading-[140%] tracking-[-0.32px]">
                  Filter
                </span>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className={cn(
                    "transition-transform",
                    showFilterBar && "rotate-180",
                  )}
                >
                  <path
                    d="M4.5 6.75L9 11.25L13.5 6.75"
                    stroke="#303030"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>

          {showFilterBar && (
            <div className="flex flex-wrap items-center gap-4 px-6 py-4 border-b border-[#E5E5E5] bg-gray-50/80">
              <span className="text-sm font-medium text-[#303030] shrink-0">
                Filter by
              </span>
              <label className="flex items-center gap-2 text-sm text-[#303030]">
                <input
                  type="checkbox"
                  checked={activeOnly}
                  onChange={(e) => setActiveOnly(e.target.checked)}
                />
                Active only
              </label>
              <button
                type="button"
                onClick={() => {
                  setActiveOnly(true);
                  setSearchTerm("");
                  setSelectedTab("all");
                }}
                className="h-9 px-3 rounded-lg border border-[#DADADA] bg-white text-sm font-medium text-[#303030] hover:bg-gray-100 shrink-0 ml-auto"
              >
                Clear filters
              </button>
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 h-12">
                  <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-gray-700">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M4 4h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z" />
                        <path d="M4 4a2 2 0 0 0 0 4h12" />
                        <path d="M8 10h8M8 14h6" />
                      </svg>
                      <span className="font-medium text-sm">Name</span>
                    </div>
                  </th>
                  <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-gray-700">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M3 7h18M3 12h18M3 17h12" />
                      </svg>
                      <span className="font-medium text-sm">Type</span>
                    </div>
                  </th>
                  <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-gray-700">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M3 21V8l9-5 9 5v13" />
                        <path d="M9 21V12h6v9" />
                      </svg>
                      <span className="font-medium text-sm">Buildium</span>
                    </div>
                  </th>
                  <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-gray-700">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 6v6l4 2" />
                      </svg>
                      <span className="font-medium text-sm">QuickBooks</span>
                    </div>
                  </th>
                  <th className="px-3 py-3 text-left whitespace-nowrap">
                    <div className="flex items-center gap-2 text-gray-700">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <path d="m9 12 2 2 4-4" />
                      </svg>
                      <span className="font-medium text-sm">Status</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {!loading && filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-12 text-center text-[#717179]"
                    >
                      No accounts match your filters.
                    </td>
                  </tr>
                )}
                {paginated.map((a) => (
                  <tr
                    key={a.id}
                    className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-3 py-3 border-r border-gray-200 whitespace-nowrap">
                      <div className="text-gray-900 font-normal text-base">
                        {a.name}
                      </div>
                      {a.description && (
                        <div className="text-xs text-[#717179] mt-0.5">
                          {a.description}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3 border-r border-gray-200 whitespace-nowrap">
                      <span
                        className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-medium",
                          TYPE_BADGE[a.account_type],
                        )}
                      >
                        {TYPE_LABEL[a.account_type]}
                      </span>
                    </td>
                    <td className="px-3 py-3 border-r border-gray-200 whitespace-nowrap">
                      {a.buildium_name ? (
                        <>
                          <div className="text-gray-900 font-normal text-base">
                            {a.buildium_name}
                          </div>
                          {a.buildium_type && (
                            <div className="text-xs text-[#717179] mt-0.5">
                              {a.buildium_type}
                            </div>
                          )}
                        </>
                      ) : (
                        <span className="text-[#A0A0A0]">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3 border-r border-gray-200 whitespace-nowrap">
                      {a.qbo_name ? (
                        <>
                          <div className="text-gray-900 font-normal text-base">
                            {a.qbo_name}
                          </div>
                          {(a.qbo_account_type || a.qbo_detail_type) && (
                            <div className="text-xs text-[#717179] mt-0.5">
                              {[a.qbo_account_type, a.qbo_detail_type]
                                .filter(Boolean)
                                .join(" · ")}
                            </div>
                          )}
                        </>
                      ) : (
                        <span className="text-[#A0A0A0]">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <StatusBadge status={a.is_active ? "active" : "inactive"} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div
            className="flex justify-between items-center px-6 py-4 bg-white gap-4 relative"
            style={{ position: "relative", zIndex: 1, overflow: "visible" }}
          >
            <div className="flex items-center gap-2">
              <span className="text-gray-700 text-sm font-medium">Showing</span>
              <div className="relative" style={{ position: "relative", zIndex: 10 }}>
                <button
                  ref={dropdownButtonRef}
                  onClick={() => setShowPageSizeDropdown(!showPageSizeDropdown)}
                  className="flex items-center justify-center gap-2 h-10 px-3 border rounded-lg bg-white hover:bg-gray-50 transition-colors text-gray-900 font-medium text-sm relative"
                  style={{
                    borderColor: "rgb(218, 218, 218)",
                    borderWidth: "0.909091px",
                    boxShadow:
                      "rgba(0, 0, 0, 0.03) 0px 1px 3px 0px",
                  }}
                >
                  <div className="text-gray-900 font-medium text-sm">
                    {start}-{end}
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
              <span className="text-gray-700 text-sm font-medium">
                of {filtered.length}
              </span>
            </div>

            <div
              className="flex items-center rounded-lg border bg-white overflow-hidden"
              style={{
                borderColor: "rgb(218, 218, 218)",
                borderWidth: "0.909091px",
                boxShadow: "rgba(0, 0, 0, 0.03) 0px 1px 3px 0px",
              }}
            >
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                className={cn(
                  "flex items-center justify-center gap-1.5 h-10 px-3 transition-colors",
                  currentPage === 1
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-gray-50",
                )}
                style={{
                  borderRightWidth: "0.909091px",
                  borderRightColor: "rgb(229, 229, 229)",
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={currentPage === 1 ? "rgb(163, 163, 163)" : "currentColor"}
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
                    currentPage === 1 ? "text-gray-400" : "text-gray-700",
                  )}
                >
                  Previous
                </div>
              </button>

              {getPaginationNumbers().map((page) => (
                <button
                  key={page}
                  onClick={() => typeof page === "number" && setCurrentPage(page)}
                  className="flex items-center justify-center h-10 min-w-10 transition-colors hover:bg-gray-50"
                  style={{
                    borderRightWidth: "0.909091px",
                    borderRightColor: "rgb(229, 229, 229)",
                    backgroundColor:
                      currentPage === page ? "white" : "rgba(0, 0, 0, 0)",
                  }}
                >
                  <div
                    className={cn(
                      "font-medium text-sm",
                      currentPage === page
                        ? "text-gray-900 font-bold"
                        : "text-gray-500",
                    )}
                  >
                    {page}
                  </div>
                </button>
              ))}

              <button
                disabled={currentPage === totalPages}
                onClick={() =>
                  setCurrentPage(Math.min(currentPage + 1, totalPages))
                }
                className={cn(
                  "flex items-center justify-center gap-1.5 h-10 px-3 transition-colors",
                  currentPage === totalPages
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-gray-50",
                )}
                style={{ backgroundColor: "rgba(0, 0, 0, 0)" }}
              >
                <div
                  className={cn(
                    "font-medium text-sm",
                    currentPage === totalPages
                      ? "text-gray-400"
                      : "text-gray-700",
                  )}
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
                      ? "rgb(163, 163, 163)"
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
        </div>
      </div>

      {/* Page-size dropdown via portal so it floats above the table */}
      {showPageSizeDropdown &&
        createPortal(
          <div
            ref={dropdownMenuRef}
            className="bg-white overflow-hidden"
            style={{
              border: "0.5px solid #DADADA",
              borderRadius: "8px",
              boxShadow:
                "0 14px 8px 0 rgba(0, 0, 0, 0.04), 0 6px 6px 0 rgba(0, 0, 0, 0.06), 0 2px 3px 0 rgba(0, 0, 0, 0.07)",
              zIndex: 99999,
              minWidth: "56px",
              width: "56px",
              position: "fixed",
              top: dropdownPos.top + "px",
              left: dropdownPos.left + "px",
            }}
          >
            {[10, 25, 50].map((size, index) => (
              <button
                key={size}
                onClick={() => {
                  setItemsPerPage(size);
                  setCurrentPage(1);
                  setShowPageSizeDropdown(false);
                }}
                className={cn(
                  "w-full px-4 py-3 text-center text-base transition-colors whitespace-nowrap",
                  itemsPerPage === size
                    ? "bg-gray-50 font-medium text-gray-900"
                    : "text-[#303030] hover:bg-gray-50",
                )}
                style={{
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
    </PageTemplate>
  );
}
