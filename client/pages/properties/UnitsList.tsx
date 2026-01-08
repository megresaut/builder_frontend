import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { usePageState } from "@/hooks/usePageState";
import { useSortingTable } from "@/hooks/useSortingTable";
import { useColumnManagement } from "@/hooks/useColumnManagement";
import ColumnFilterModal from "@/components/ColumnFilterModal";
import GlobalTable from "@/components/GlobalTable";
import AddUnitModal from "@/components/AddUnitModal";
import { EditIcon, DeleteIcon, HomeIcon, MapPinIcon, UsersIcon, PlusIcon } from "@/components/icons";

interface Unit {
  id: number;
  unitNumber: string;
  address: string;
  tenants: string[];
  propertyId: number;
}

interface UnitsListProps {
  propertyAddress: string;
  propertyType: string;
  propertyUnits: number;
}

const mockUnits: Unit[] = [
  {
    id: 1,
    unitNumber: "1A",
    address: "113-115 Park Avenue, Suite 100",
    tenants: ["John Smith", "Sarah Johnson"],
    propertyId: 1,
  },
  {
    id: 2,
    unitNumber: "1B",
    address: "113-115 Park Avenue, Suite 101",
    tenants: ["Michael Chen"],
    propertyId: 1,
  },
  {
    id: 3,
    unitNumber: "2A",
    address: "113-115 Park Avenue, Suite 200",
    tenants: ["Emily Rodriguez", "David Harris"],
    propertyId: 1,
  },
  {
    id: 4,
    unitNumber: "2B",
    address: "113-115 Park Avenue, Suite 201",
    tenants: [],
    propertyId: 1,
  },
  {
    id: 5,
    unitNumber: "3A",
    address: "113-115 Park Avenue, Suite 300",
    tenants: ["Jennifer Lee"],
    propertyId: 1,
  },
];

export const UnitsList: React.FC<UnitsListProps> = ({
  propertyAddress,
  propertyType,
  propertyUnits,
}) => {
  const [unitsList, setUnitsList] = useState<Unit[]>(mockUnits);
  const [currentPage, setCurrentPage] = usePageState("currentPage", 1);
  const [itemsPerPage, setItemsPerPage] = usePageState("itemsPerPage", 50);
  const [showPageSizeDropdown, setShowPageSizeDropdown] = usePageState(
    "showPageSizeDropdown",
    false,
  );
  const [openMenuId, setOpenMenuId] = usePageState<number | null>(
    "openMenuId",
    null,
  );
  const [isAddUnitModalOpen, setIsAddUnitModalOpen] = usePageState(
    "isAddUnitModalOpen",
    false,
  );
  const [editingUnit, setEditingUnit] = usePageState<Unit | null>(
    "editingUnit",
    null,
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = usePageState<number | null>(
    "showDeleteConfirm",
    null,
  );

  const navigate = useNavigate();
  const { propertyId } = useParams<{ propertyId: string }>();

  const { handleSortClick, getSortIndicator, getSortedData } = useSortingTable(
    unitsList,
    `units-${propertyId}`,
  );

  const columnManagement = useColumnManagement(["unitNumber", "address", "tenants"]);

  const columnConfig: Record<string, { label: string; icon: React.ReactNode }> = {
    unitNumber: {
      label: "Unit",
      icon: <HomeIcon width={16} height={16} color="#525252" />,
    },
    address: {
      label: "Address",
      icon: <MapPinIcon width={16} height={16} color="#525252" />,
    },
    tenants: {
      label: "Tenants",
      icon: <UsersIcon width={16} height={16} color="#525252" />,
    },
  };

  const handleOpenAddModal = () => {
    setEditingUnit(null);
    setIsAddUnitModalOpen(true);
  };

  const handleEditUnit = (unit: Unit) => {
    setEditingUnit(unit);
    setIsAddUnitModalOpen(true);
  };

  const handleDeleteUnit = (unit: Unit) => {
    setShowDeleteConfirm(unit.id);
  };

  const confirmDelete = () => {
    if (showDeleteConfirm) {
      setUnitsList((prev) => prev.filter((u) => u.id !== showDeleteConfirm));
      setShowDeleteConfirm(null);
    }
  };

  const handleAddUnit = (newUnit: Unit) => {
    if (editingUnit) {
      setUnitsList((prev) =>
        prev.map((u) => (u.id === newUnit.id ? newUnit : u)),
      );
    } else {
      setUnitsList((prev) => [...prev, newUnit]);
    }
    setIsAddUnitModalOpen(false);
    setEditingUnit(null);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header Section */}
      <div className="flex items-center gap-10 justify-between flex-wrap">
        {/* Title and Description */}
        <div className="flex flex-col gap-1 min-w-[240px]">
          <h1 className="text-[#303030] font-semibold text-2xl leading-[30px]">
            Units
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <p
              className="text-[#717179] font-medium text-base leading-4"
              style={{ marginTop: "-4px" }}
            >
              All units for {propertyAddress}
            </p>
          </div>
        </div>

        {/* Add Unit Button */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleOpenAddModal}
            className="flex h-9 items-center gap-2 px-3 rounded-lg border border-white bg-[#013764] shadow-[0_0_0_1px_#002D5A] hover:bg-[#003a73] transition-colors"
          >
            <PlusIcon width={20} height={20} color="white" />
            <span className="text-white font-medium text-base leading-normal">
              Add unit
            </span>
          </button>
        </div>
      </div>

      {/* Units Table */}
      <GlobalTable
        columns={[
          { key: "unitNumber", label: "Unit", icon: columnConfig.unitNumber.icon },
          { key: "address", label: "Address", icon: columnConfig.address.icon },
          { key: "tenants", label: "Tenants", icon: columnConfig.tenants.icon },
        ]}
        data={unitsList}
        rowKey="id"
        actions={[
          {
            label: "View Unit",
            icon: <EditIcon width={18} height={18} color="#525252" />,
            onClick: (unit: Unit) => {
              navigate(`/property/${propertyId}/unit/${unit.id}`);
            },
          },
          {
            label: "Delete",
            icon: <DeleteIcon width={18} height={18} color="#982740" />,
            onClick: (unit: Unit) => {
              handleDeleteUnit(unit);
            },
          },
        ]}
        renderCell={(unit: Unit, columnKey: string) => {
          switch (columnKey) {
            case "unitNumber":
              return (
                <span className="text-gray-900 font-normal text-sm truncate">
                  {unit.unitNumber}
                </span>
              );
            case "address":
              return (
                <span className="text-gray-900 font-normal text-sm truncate">
                  {unit.address}
                </span>
              );
            case "tenants":
              return (
                <div className="flex flex-wrap gap-2">
                  {unit.tenants.length > 0 ? (
                    unit.tenants.map((tenant) => (
                      <span
                        key={tenant}
                        className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {tenant}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500 text-sm">No tenants</span>
                  )}
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
        columnManagementHook={columnManagement}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        itemsPerPage={itemsPerPage}
        onItemsPerPageChange={setItemsPerPage}
        showPageSizeDropdown={showPageSizeDropdown}
        onShowPageSizeDropdownChange={setShowPageSizeDropdown}
        openMenuId={openMenuId}
        onOpenMenuIdChange={setOpenMenuId}
        title="Units"
        showColumnModal={columnManagement.showColumnModal}
        onShowColumnModalChange={columnManagement.setShowColumnModal}
        onRowClick={(unit: Unit) => {
          navigate(`/property/${propertyId}/unit/${unit.id}`);
        }}
        headerActions={
          <button
            ref={columnManagement.columnButtonRef}
            onClick={() => {
              setShowPageSizeDropdown(false);
              setOpenMenuId(null);
              columnManagement.setShowColumnModal((prev) => !prev);
            }}
            className="flex h-9 w-9 justify-center items-center rounded-lg border border-[#DADADA] bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] hover:bg-gray-50 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="8" cy="3" r="1.5" fill="#303030" />
              <circle cx="8" cy="8" r="1.5" fill="#303030" />
              <circle cx="8" cy="13" r="1.5" fill="#303030" />
            </svg>
          </button>
        }
      />

      {/* Add Unit Modal */}
      <AddUnitModal
        open={isAddUnitModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setEditingUnit(null);
          }
          setIsAddUnitModalOpen(open);
        }}
        editData={editingUnit || undefined}
        onSubmit={handleAddUnit}
        propertyAddress={propertyAddress}
        propertyId={propertyId ? parseInt(propertyId) : 1}
      />

      {/* Column Filter Modal */}
      <ColumnFilterModal
        isOpen={columnManagement.showColumnModal}
        position={columnManagement.columnMenuPos}
        columns={columnManagement.columnOrder.map((key) => ({
          key,
          label: columnConfig[key]?.label || key,
          icon: columnConfig[key]?.icon,
        }))}
        visibleColumns={columnManagement.visibleColumns}
        onToggleColumn={columnManagement.toggleColumnVisibility}
        onClose={() => columnManagement.setShowColumnModal(false)}
        buttonRef={columnManagement.columnButtonRef}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-[#303030] mb-2">
              Delete Unit
            </h3>
            <p className="text-sm text-[#717179] mb-6">
              Are you sure you want to delete this unit? This action cannot be undone.
            </p>
            <div className="flex gap-2.5 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-3 py-2 rounded-lg border border-[#DADADA] bg-white hover:bg-gray-50 text-[#303030] font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-3 py-2 rounded-lg bg-[#982740] hover:bg-[#7a1f31] text-white font-medium text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
