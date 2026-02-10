import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import PageTemplate from "@/layout/PageTemplate";
import SubPageHeaderV2 from "@/components/SubPageHeaderV2";
import GlobalTable from "@/components/GlobalTable";
import { usePageState } from "@/hooks/usePageState";
import { useSortingTable } from "@/hooks/useSortingTable";
import { useColumnManagement } from "@/hooks/useColumnManagement";
import ColumnFilterModal from "@/components/ColumnFilterModal";
import { useAuth } from "@/auth/useAuth";
import { fetchJSON } from "@/api/fetchJSON";
import { formatUnitLabel } from "@/utils/unitLabel";
import {
  CalendarIcon,
  BuildingIcon,
  DocumentIcon,
  DotsIcon,
  EditIcon,
} from "@/components/icons";

interface WorkOrderRow {
  id: number;
  name: string;
  task_id: number;
  property_name: string | null;
  unit_id: number | null;
  unit_name: string | null;
  vendor_name: string | null;
  due_date: string | null;
  status: string;
  priority: string;
}

const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "—";
  }
};

export default function FtoWorkOrders() {
  const navigate = useNavigate();
  const { userId } = useAuth();
  const resolvedUserId = useMemo(() => {
    if (userId) return userId;
    const stored = localStorage.getItem("avm_user_id");
    if (!stored) return null;
    const parsed = Number(stored);
    return Number.isFinite(parsed) ? parsed : null;
  }, [userId]);

  const [rows, setRows] = useState<WorkOrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { handleSortClick, getSortIndicator, getSortedData } = useSortingTable(
    rows,
    "ftoWorkOrders",
  );

  const [currentPage, setCurrentPage] = usePageState("ftoWorkOrdersPage", 1);
  const [itemsPerPage, setItemsPerPage] = usePageState("ftoWorkOrdersPerPage", 50);
  const [showPageSizeDropdown, setShowPageSizeDropdown] = usePageState(
    "ftoWorkOrdersShowPageSize",
    false,
  );
  const [openMenuId, setOpenMenuId] = usePageState<number | null>(
    "ftoWorkOrdersOpenMenu",
    null,
  );
  const [showColumnModal, setShowColumnModal] = usePageState(
    "ftoWorkOrdersColumnModal",
    false,
  );
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" && window.innerWidth < 768);

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
  } = useColumnManagement([
    "name",
    "vendor",
    "dueDate",
    "property",
    "unit",
    "status",
  ]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!resolvedUserId) {
        setError("Missing user ID");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const raw = await fetchJSON(
          `/maintenance/work-orders?assignee_user_id=${resolvedUserId}&limit=200`,
        );
        const list: any[] = Array.isArray(raw)
          ? raw
          : raw?.data ?? raw?.work_orders ?? raw?.results ?? [];
        setRows(
          (list || []).map((wo: any) => {
            const rawProperty =
              wo.property_name ?? wo.propertyName ?? wo.property?.name ?? "";
            const rawVendor =
              wo.vendor_name ?? wo.vendorName ?? wo.vendor?.name ?? "";
            return {
              id: wo.id,
              name: wo.name || "—",
              task_id: wo.task_id,
              property_name:
                typeof rawProperty === "string" && rawProperty.trim()
                  ? rawProperty.trim()
                  : rawProperty ?? null,
              unit_id: wo.unit_id ?? wo.unitId ?? null,
              unit_name: wo.unit_name ?? wo.unitName ?? null,
              vendor_name:
                typeof rawVendor === "string" && rawVendor.trim()
                  ? rawVendor.trim()
                  : rawVendor ?? null,
              due_date: wo.due_date ?? wo.dueDate ?? null,
              status: wo.status || "—",
              priority: wo.priority || "—",
            };
          }),
        );
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load work orders");
        setRows([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [resolvedUserId]);

  const columns = [
    { key: "name", label: "Work Order", icon: <DocumentIcon width={16} height={16} /> },
    { key: "vendor", label: "Vendor", icon: <DocumentIcon width={16} height={16} /> },
    { key: "dueDate", label: "Due Date", icon: <CalendarIcon width={16} height={16} /> },
    { key: "property", label: "Property", icon: <BuildingIcon width={16} height={16} /> },
    { key: "unit", label: "Unit", icon: <DocumentIcon width={16} height={16} /> },
    { key: "status", label: "Status", icon: <DocumentIcon width={16} height={16} /> },
  ];

  const displayRows = getSortedData(rows).map((r) => ({
    ...r,
    property:
      r.property_name != null && String(r.property_name).trim()
        ? String(r.property_name).trim()
        : "—",
    unit: formatUnitLabel({
      unitId: r.unit_id,
      unitName: r.unit_name,
      fallback: "N/A",
    }),
    vendor:
      r.vendor_name != null && String(r.vendor_name).trim()
        ? String(r.vendor_name).trim()
        : "—",
    dueDate: r.due_date,
  }));

  const getStatusColor = (status: string): string => {
    const s = (status || "").toLowerCase();
    if (s === "completed") return "#059669";
    if (s === "in_progress" || s === "scheduled" || s === "sent")
      return "#2563eb";
    return "#6b7280";
  };

  return (
    <PageTemplate>
      <div className="flex flex-col gap-6">
        <SubPageHeaderV2
          leftContent={
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-semibold text-gray-900">Work Orders</h1>
              <p className="text-sm text-gray-600">Open Work Orders</p>
            </div>
          }
        />

        {loading && (
          <div className="text-center py-8 text-gray-500 text-sm">Loading work orders...</div>
        )}
        {error && !loading && (
          <div className="text-center py-8 text-red-500 text-sm">{error}</div>
        )}

        {!loading && !error && !isMobile && (
          <>
            <GlobalTable
              columns={columns}
              data={displayRows}
              rowKey="id"
              renderCell={(row, columnKey) => {
                const vendorDisplay =
                  (row.vendor ?? row.vendor_name ?? "").trim() || "—";
                const propertyDisplay =
                  (row.property ?? row.property_name ?? "").trim() || "—";
                const unitDisplay =
                  row.unit ??
                  formatUnitLabel({
                    unitId: row.unit_id,
                    unitName: row.unit_name,
                    fallback: "N/A",
                  });
                switch (columnKey) {
                  case "name":
                    return <span className="text-gray-900 text-sm">{row.name}</span>;
                  case "vendor":
                    return (
                      <span className="text-gray-900 text-sm">{vendorDisplay}</span>
                    );
                  case "dueDate":
                    return (
                      <span className="text-gray-900 text-sm">
                        {formatDate(row.due_date ?? row.dueDate)}
                      </span>
                    );
                  case "property":
                    return (
                      <span className="text-gray-900 text-sm">{propertyDisplay}</span>
                    );
                  case "unit":
                    return (
                      <span className="text-gray-900 text-sm">
                        {unitDisplay || "N/A"}
                      </span>
                    );
                  case "status":
                    return (
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{
                            backgroundColor: getStatusColor(row.status),
                          }}
                        />
                        <span className="text-gray-900 text-sm capitalize">
                          {(row.status || "").replace(/_/g, " ")}
                        </span>
                      </div>
                    );
                  default:
                    return null;
                }
              }}
              sortingHook={{
                handleSortClick,
                getSortIndicator,
                getSortedData,
              }}
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
              title="Work Orders"
              headerActions={
                <button
                  ref={columnButtonRef}
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
              actions={[
                {
                  label: () => "View",
                  icon: <EditIcon width={18} height={18} color="#525252" />,
                  onClick: (row) => navigate(`/fto/work-orders/${row.id}`),
                },
              ]}
              onRowClick={(row) => navigate(`/fto/work-orders/${row.id}`)}
              showColumnModal={showColumnModal}
              onShowColumnModalChange={setShowColumnModal}
            />
            <ColumnFilterModal
              isOpen={showColumnModal}
              position={columnMenuPos}
              columns={columns}
              visibleColumns={visibleColumns}
              onToggleColumn={toggleColumnVisibility}
              onClose={() => setShowColumnModal(false)}
              buttonRef={columnButtonRef}
            />
          </>
        )}

        {!loading && !error && isMobile && (
          <div className="grid grid-cols-1 gap-3">
            {displayRows.length > 0 ? (
              displayRows.map((row) => (
                <div
                  key={row.id}
                  onClick={() => navigate(`/fto/work-orders/${row.id}`)}
                  className="w-full bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="font-medium text-sm text-gray-900 flex-1 truncate">
                      {row.name}
                    </h3>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: getStatusColor(row.status) }}
                      />
                      <span className="text-xs text-gray-500 capitalize">
                        {(row.status || "").replace(/_/g, " ")}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1.5 text-xs text-gray-600">
                    {row.vendor !== "—" && (
                      <div className="flex items-center gap-2">
                        <DocumentIcon width={14} height={14} className="flex-shrink-0" />
                        <span className="truncate">{row.vendor}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <CalendarIcon width={14} height={14} className="flex-shrink-0" />
                      <span>{formatDate(row.due_date)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BuildingIcon width={14} height={14} className="flex-shrink-0" />
                      <span className="truncate">{row.property}</span>
                      <span className="truncate text-gray-500">• {row.unit}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500 text-sm">
                No work orders found
              </div>
            )}
          </div>
        )}
      </div>
    </PageTemplate>
  );
}
