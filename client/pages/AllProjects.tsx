import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import PageTemplate from "@/layout/PageTemplate";
import GlobalTable from "@/components/GlobalTable";
import ColumnFilterModal from "@/components/ColumnFilterModal";
import { usePageState } from "@/hooks/usePageState";
import { useSortingTable } from "@/hooks/useSortingTable";
import { useColumnManagement } from "@/hooks/useColumnManagement";
import { PlusIcon, DotsIcon, CalendarIcon, UserIcon, SparkleIcon } from "@/components/icons";
import {
  listProjects,
  PROJECT_STATUS_META,
  formatUSD,
  type ProjectListItem,
  type ProjectStatus,
} from "@/data/projects";

interface ProjectRow {
  id: number;
  status: ProjectStatus;
  name: string;
  property: string;
  propertyAddress: string;
  budget: number;
  spent: number;
  percent: number;
  outstanding: number;
  target: string;
  targetSort: string;
  manager: string;
  managerInitials: string;
  changeOrdersOpen: number;
}

function StatusPill({ status }: { status: ProjectStatus }) {
  const meta = PROJECT_STATUS_META[status];
  return (
    <span className="inline-flex items-center gap-1.5 text-sm font-normal text-gray-700">
      <span
        className="inline-block w-2 h-2 rounded-full"
        style={{ backgroundColor: meta.dot }}
      />
      {meta.label}
    </span>
  );
}

function ProgressBar({ percent }: { percent: number }) {
  return (
    <div className="flex items-center gap-2 min-w-[110px]">
      <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-[#013764]"
          style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
        />
      </div>
      <span className="text-xs text-gray-600 w-8 text-right">{percent}%</span>
    </div>
  );
}

function Avatar({ initials }: { initials: string }) {
  return (
    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full border border-blue-200 bg-blue-50 text-[11px] font-semibold text-blue-700">
      {initials}
    </span>
  );
}

export default function AllProjects() {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = usePageState("projectsPage", 1);
  const [itemsPerPage, setItemsPerPage] = usePageState("projectsPerPage", 50);
  const [showPageSizeDropdown, setShowPageSizeDropdown] = usePageState(
    "projectsShowPageSize",
    false,
  );
  const [openMenuId, setOpenMenuId] = usePageState<number | null>(
    "projectsOpenMenu",
    null,
  );
  const [searchQuery, setSearchQuery] = usePageState("projectsSearch", "");

  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    listProjects()
      .then((data) => {
        if (!cancelled) setProjects(data);
      })
      .catch((err) => {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Failed to load projects");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const rows: ProjectRow[] = useMemo(
    () =>
      projects.map((p) => ({
        id: p.id,
        status: p.status,
        name: p.name,
        property: p.property_name,
        propertyAddress: p.property_address,
        budget: p.current_budget_cents,
        spent: p.spent_cents,
        percent: p.percent_complete,
        outstanding: p.outstanding_invoices_cents,
        target: p.target_end_date
          ? new Date(p.target_end_date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : "—",
        targetSort: p.target_end_date ?? "",
        manager: p.manager_name,
        managerInitials: p.manager_initials,
        changeOrdersOpen: p.pending_change_orders_count,
      })),
    [projects],
  );

  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [r.name, r.property, r.propertyAddress, r.manager]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [rows, searchQuery]);

  const { handleSortClick, getSortIndicator, getSortedData } = useSortingTable(
    filteredRows,
    "projectsV1",
    { initialSortBy: "status", initialSortOrder: "asc" },
  );

  const {
    columnOrder,
    visibleColumns,
    draggedColumn,
    dropTargetColumn,
    dropPosition,
    showColumnModal,
    setShowColumnModal,
    columnMenuPos,
    columnButtonRef,
    toggleColumnVisibility,
    handleColumnDragStart,
    handleColumnDragOver,
    handleColumnDragLeave,
    handleColumnDrop,
  } = useColumnManagement([
    "status",
    "name",
    "property",
    "budget",
    "spent",
    "percent",
    "outstanding",
    "target",
    "manager",
  ]);

  const columns = [
    { key: "status", label: "Status" },
    { key: "name", label: "Project" },
    { key: "property", label: "Property" },
    { key: "budget", label: "Budget" },
    { key: "spent", label: "Spent" },
    { key: "percent", label: "% Complete" },
    { key: "outstanding", label: "Outstanding" },
    { key: "target", label: "Target", icon: <CalendarIcon width={16} height={16} /> },
    { key: "manager", label: "Manager", icon: <UserIcon width={16} height={16} /> },
  ];

  const goToProject = (row: ProjectRow) => navigate(`/projects/${row.id}`);

  return (
    <PageTemplate>
      <div className="flex flex-col gap-6 w-fit min-w-full">
        <PageHeader
          title="Projects"
          subtitle="Full-scale renovations and large jobs, grouped by property"
          action={{
            label: "Add Project",
            onClick: () => navigate("/projects/new"),
            icon: <PlusIcon width={20} height={20} />,
          }}
          secondaryAction={{
            label: "New from Meeting Notes",
            onClick: () => navigate("/projects/intake"),
            icon: <SparkleIcon width={16} height={16} />,
            variant: "neutral",
          }}
        />

        {error && <div className="text-sm text-rose-600">{error}</div>}

        <GlobalTable
          columns={columns}
          data={getSortedData()}
          rowKey="id"
          title="Project List"
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          onRowClick={(row) => goToProject(row as ProjectRow)}
          emptyMessage={
            loading
              ? "Loading projects…"
              : error
                ? "Unable to load projects."
                : "No projects match the current search."
          }
          renderCell={(row: ProjectRow, columnKey) => {
            if (columnKey === "status") return <StatusPill status={row.status} />;
            if (columnKey === "name") {
              return (
                <div className="flex flex-col min-w-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      goToProject(row);
                    }}
                    className="text-blue-600 font-normal text-sm hover:underline cursor-pointer text-left truncate"
                  >
                    {row.name}
                  </button>
                  {row.changeOrdersOpen > 0 && (
                    <span className="text-[11px] text-amber-600 mt-0.5">
                      {row.changeOrdersOpen} change order
                      {row.changeOrdersOpen > 1 ? "s" : ""} awaiting review
                    </span>
                  )}
                </div>
              );
            }
            if (columnKey === "property") {
              return (
                <div className="flex flex-col min-w-0">
                  <span className="text-gray-900 text-sm truncate">{row.property}</span>
                  <span className="text-gray-500 text-xs truncate">
                    {row.propertyAddress}
                  </span>
                </div>
              );
            }
            if (columnKey === "budget")
              return (
                <span className="text-gray-900 text-sm">{formatUSD(row.budget)}</span>
              );
            if (columnKey === "spent")
              return (
                <span className="text-gray-900 text-sm">{formatUSD(row.spent)}</span>
              );
            if (columnKey === "percent") return <ProgressBar percent={row.percent} />;
            if (columnKey === "outstanding")
              return (
                <span
                  className={`text-sm ${row.outstanding > 0 ? "text-amber-700 font-medium" : "text-gray-500"}`}
                >
                  {row.outstanding > 0 ? formatUSD(row.outstanding) : "—"}
                </span>
              );
            if (columnKey === "target")
              return <span className="text-gray-900 text-sm">{row.target}</span>;
            if (columnKey === "manager")
              return (
                <div className="flex items-center gap-2">
                  <Avatar initials={row.managerInitials} />
                  <span className="text-gray-700 text-sm truncate">{row.manager}</span>
                </div>
              );
            return null;
          }}
          sortingHook={{ handleSortClick, getSortIndicator, getSortedData }}
          columnManagementHook={{
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
          }}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={setItemsPerPage}
          showPageSizeDropdown={showPageSizeDropdown}
          onShowPageSizeDropdownChange={setShowPageSizeDropdown}
          openMenuId={openMenuId}
          onOpenMenuIdChange={setOpenMenuId}
          showColumnModal={showColumnModal}
          onShowColumnModalChange={setShowColumnModal}
          showFilterButton={false}
          headerActions={
            <button
              ref={columnButtonRef}
              type="button"
              aria-label="Column settings"
              aria-haspopup="dialog"
              aria-expanded={showColumnModal}
              onClick={() => {
                setShowPageSizeDropdown(false);
                setOpenMenuId(null);
                setShowColumnModal((prev) => !prev);
              }}
              className="flex h-9 w-9 justify-center items-center rounded-lg border border-[#DADADA] bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] hover:bg-gray-50 transition-colors"
            >
              <DotsIcon width={18} height={18} color="#303030" />
            </button>
          }
        />
      </div>

      <ColumnFilterModal
        isOpen={showColumnModal}
        position={columnMenuPos}
        columns={columns.map((col) => ({
          key: col.key,
          label: col.label,
          icon: (col as any).icon || null,
        }))}
        visibleColumns={visibleColumns}
        onToggleColumn={toggleColumnVisibility}
        onClose={() => setShowColumnModal(false)}
        buttonRef={columnButtonRef}
      />

    </PageTemplate>
  );
}
