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
    const newVendor: Vendor = {
      id: Math.max(...vendors.map(v => v.id), 0) + 1,
      ...vendorData,
    };
    setVendors([...vendors, newVendor]);
  };

  const columns = [
    {
      key: "name",
      label: "Name",
      icon: (
        <img
          loading="lazy"
          src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/1bf3b3df8026becac5b0f8006e63c3cb79df6594?placeholderIfAbsent=true"
          style={{ width: "16px", height: "16px" }}
          alt=""
        />
      ),
    },
    {
      key: "phone",
      label: "Phone",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" stroke="#525252" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        </svg>
      ),
    },
    {
      key: "email",
      label: "Email",
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M2 3H14C14.5523 3 15 3.44772 15 4V12C15 12.5523 14.5523 13 14 13H2C1.44772 13 1 12.5523 1 12V4C1 3.44772 1.44772 3 2 3Z" stroke="#525252" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M1.5 3.5L8 9L14.5 3.5" stroke="#525252" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
    {
      key: "servicesProvided",
      label: "Services Provided",
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M1.5 3H14.5" stroke="#525252" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M1.5 8H14.5" stroke="#525252" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M1.5 13H14.5" stroke="#525252" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
    {
      key: "notes",
      label: "Notes",
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M2 2H14V14C14 14.5523 13.5523 15 13 15H3C2.44772 15 2 14.5523 2 14V2Z" stroke="#525252" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M5 5H11" stroke="#525252" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M5 8H11" stroke="#525252" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M5 11H9" stroke="#525252" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
  ];

  const handleDeleteVendor = useCallback(
    (vendor: Vendor) => {
      setVendors((prev) => prev.filter((v) => v.id !== vendor.id));
    },
    []
  );

  const handleEditVendor = useCallback(
    (vendor: Vendor) => {
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
                icon: (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 18 18"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M15.75 15.7502H9.75002M1.875 16.1252L6.03695 14.5245C6.30316 14.4221 6.43626 14.3709 6.56079 14.3041C6.6714 14.2447 6.77685 14.1761 6.87603 14.0992C6.98769 14.0125 7.08853 13.9117 7.29021 13.71L15.75 5.25023C16.5784 4.4218 16.5784 3.07865 15.75 2.25023C14.9216 1.4218 13.5784 1.4218 12.75 2.25022L4.29021 10.71C4.08853 10.9117 3.98769 11.0125 3.90104 11.1242C3.82408 11.2234 3.75555 11.3288 3.69618 11.4394C3.62933 11.564 3.57814 11.6971 3.47575 11.9633L1.875 16.1252ZM1.875 16.1252L3.41859 12.1119C3.52905 11.8248 3.58428 11.6812 3.67901 11.6154C3.76179 11.5579 3.86423 11.5362 3.96322 11.5551C4.0765 11.5767 4.18529 11.6855 4.40286 11.9031L6.09718 13.5974C6.31475 13.815 6.42354 13.9237 6.44517 14.037C6.46408 14.136 6.44234 14.2385 6.38486 14.3212C6.31908 14.416 6.17549 14.4712 5.8883 14.5817L1.875 16.1252Z"
                      stroke="#525252"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ),
                onClick: handleEditVendor,
              },
              {
                label: "Delete",
                icon: (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 18 18"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M6.75 2.25H11.25M2.25 4.5H15.75M14.25 4.5L13.724 12.3895C13.6451 13.5732 13.6057 14.165 13.35 14.6138C13.1249 15.0088 12.7854 15.3265 12.3762 15.5248C11.9115 15.75 11.3183 15.75 10.132 15.75H7.86799C6.68168 15.75 6.08852 15.75 5.62375 15.5248C5.21457 15.3265 4.87507 15.0088 4.64999 14.6138C4.39433 14.165 4.35488 13.5732 4.27596 12.3895L3.75 4.5M7.5 7.875V11.625M10.5 7.875V11.625"
                      stroke="#982740"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ),
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
