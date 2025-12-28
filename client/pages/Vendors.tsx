import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { usePageState } from "@/hooks/usePageState";
import { useSortingTable } from "@/hooks/useSortingTable";
import { useColumnManagement } from "@/hooks/useColumnManagement";
import AddVendorModal from "@/components/AddVendorModal";
import ColumnFilterModal from "@/components/ColumnFilterModal";
import GlobalTable from "@/components/GlobalTable";
import PageTemplate from "@/layout/PageTemplate";
import { useVendors } from "@/hooks/vendors";
import { EditIcon, DeleteIcon, UserIcon, PhoneIcon, EmailIcon, ListIcon, NoteIcon, PlusIcon } from "@/components/icons";
import type { BaseVendor } from "@/data/vendors";


export default function Vendors() {
  const navigate = useNavigate();
  const { vendors, loading, error } = useVendors();
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
  const [isAddVendorModalOpen, setIsAddVendorModalOpen] = usePageState(
    "isAddVendorModalOpen",
    false,
  );

  const { handleSortClick, getSortIndicator, getSortedData } = useSortingTable(
    vendors,
    "vendors"
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
    "name",
    "phone",
    "email",
    "servicesProvided",
    "notes",
  ]);

  const handleAddVendor = (vendorData: {
    name: string;
    email: string;
    phone: string;
    servicesProvided: string[];
    notes: string;
  }) => {
    // Create and add new vendor to mock data
    const newVendor: BaseVendor = {
      id: Math.max(...vendors.map(v => v.id), 0) + 1,
      ...vendorData,
    };
    // Mock implementation: add to vendors array (in real app, would be API call)
    vendors.push(newVendor);
  };

  const columns = [
    {
      key: "name",
      label: "Name",
      icon: <UserIcon width={16} height={16} color="#525252" />,
    },
    {
      key: "phone",
      label: "Phone",
      icon: <PhoneIcon width={16} height={16} color="#525252" />,
    },
    {
      key: "email",
      label: "Email",
      icon: <EmailIcon width={16} height={16} color="#525252" />,
    },
    {
      key: "servicesProvided",
      label: "Services Provided",
      icon: <ListIcon width={16} height={16} color="#525252" />,
    },
    {
      key: "notes",
      label: "Notes",
      icon: <NoteIcon width={16} height={16} color="#525252" />,
    },
  ];

  const handleDeleteVendor = useCallback(
    (vendor: BaseVendor) => {
      // Mock implementation: remove from vendors array (in real app, would be API call)
      const idx = vendors.findIndex((v) => v.id === vendor.id);
      if (idx >= 0) vendors.splice(idx, 1);
    },
    [vendors]
  );

  const handleEditVendor = useCallback(
    (vendor: BaseVendor) => {
      navigate(`/vendors/${vendor.id}`);
    },
    [navigate]
  );

  return (
    <PageTemplate>
      <div className="flex flex-col gap-6 w-fit min-w-full">
        {/* Header Section - Using PageHeader Template */}
        <PageHeader
          title="Vendors"
          subtitle="All your vendors, in one place"
          action={{
            label: "Add Vendor",
            onClick: () => setIsAddVendorModalOpen(true),
            icon: <Plus className="w-5 h-5" />,
          }}
        />

        <div className="flex flex-col gap-6">
          {/* Vendors Table - Using GlobalTable Component */}
          <GlobalTable
            columns={columns}
            data={vendors}
            rowKey="id"
            renderCell={(vendor, columnKey) => {
              if (columnKey === "name") {
                return (
                  <span className="text-gray-900 font-normal text-sm truncate">
                    {vendor.name}
                  </span>
                );
              }
              if (columnKey === "phone") {
                return (
                  <span className="text-gray-900 font-normal text-sm truncate">
                    {vendor.phone}
                  </span>
                );
              }
              if (columnKey === "email") {
                return (
                  <span className="text-gray-900 font-normal text-sm truncate">
                    {vendor.email}
                  </span>
                );
              }
              if (columnKey === "servicesProvided") {
                return (
                  <div className="flex flex-wrap gap-2">
                    {vendor.servicesProvided.map((service) => (
                      <span
                        key={service}
                        className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {service}
                      </span>
                    ))}
                  </div>
                );
              }
              if (columnKey === "notes") {
                return (
                  <span className="text-gray-900 font-normal text-sm truncate">
                    {vendor.notes}
                  </span>
                );
              }
              return null;
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
            title="Vendors"
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
                <svg width="18" height="18" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="8" cy="3" r="1.5" fill="#303030"/>
                  <circle cx="8" cy="8" r="1.5" fill="#303030"/>
                  <circle cx="8" cy="13" r="1.5" fill="#303030"/>
                </svg>
              </button>
            }
            actions={[
              {
                label: "Edit",
                icon: <EditIcon width={18} height={18} color="#525252" />,
                onClick: handleEditVendor,
              },
              {
                label: "Delete",
                icon: <DeleteIcon width={18} height={18} color="#982740" />,
                onClick: handleDeleteVendor,
              },
            ]}
            onRowClick={(vendor) => {
              navigate(`/vendors/${vendor.id}`);
            }}
            showColumnModal={showColumnModal}
            onShowColumnModalChange={setShowColumnModal}
          />
        </div>
      </div>

      <AddVendorModal
        open={isAddVendorModalOpen}
        onOpenChange={setIsAddVendorModalOpen}
        onAddVendor={handleAddVendor}
      />

      <ColumnFilterModal
        isOpen={showColumnModal}
        position={columnMenuPos}
        columns={columns.map((col) => ({
          key: col.key,
          label: col.label,
          icon: col.icon || null,
        }))}
        visibleColumns={visibleColumns}
        onToggleColumn={toggleColumnVisibility}
        onClose={() => setShowColumnModal(false)}
        buttonRef={columnButtonRef}
      />
    </PageTemplate>
  );
}
