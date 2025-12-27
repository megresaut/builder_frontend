import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import { usePageState } from "@/hooks/usePageState";
import { useSortingTable } from "@/hooks/useSortingTable";
import { useColumnManagement } from "@/hooks/useColumnManagement";
import ColumnFilterModal from "@/components/ColumnFilterModal";
import GlobalTable from "@/components/GlobalTable";
import AddVendorModal from "@/components/AddVendorModal";
import { EditIcon, DeleteIcon } from "@/components/icons";

interface Vendor {
  id: number;
  name: string;
  phone: string;
  email: string;
  notes: string;
  servicesProvided: string[];
  propertyServices?: string[];
}

interface VendorsProps {
  propertyAddress: string;
  propertyType: string;
  propertyUnits: number;
}

const mockVendors: Vendor[] = [
  {
    id: 1,
    name: "David Smith",
    phone: "724.705.2990",
    email: "mattgzyb21@gmail.com",
    notes: "Reliable vendor, quick turnaround",
    servicesProvided: ["HVAC", "Plumbing"],
    propertyServices: ["HVAC"],
  },
  {
    id: 2,
    name: "David Smith",
    phone: "724.705.2990",
    email: "mattgzyb21@gmail.com",
    notes: "Good quality work",
    servicesProvided: ["Carpentry", "Drywall"],
    propertyServices: ["Carpentry", "Drywall"],
  },
  {
    id: 3,
    name: "David Smith",
    phone: "724.705.2990",
    email: "mattgzyb21@gmail.com",
    notes: "Preferred for electrical work",
    servicesProvided: ["Electrical", "Lighting"],
    propertyServices: ["Electrical"],
  },
  {
    id: 4,
    name: "David Smith",
    phone: "724.705.2990",
    email: "mattgzyb21@gmail.com",
    notes: "",
    servicesProvided: ["Roofing"],
    propertyServices: ["Roofing"],
  },
  {
    id: 5,
    name: "David Smith",
    phone: "724.705.2990",
    email: "mattgzyb21@gmail.com",
    notes: "Great communication",
    servicesProvided: ["Painting", "Flooring"],
    propertyServices: ["Painting"],
  },
];

export const Vendors: React.FC<VendorsProps> = ({
  propertyAddress,
  propertyType,
  propertyUnits,
}) => {
  const [vendorsList, setVendorsList] = useState<Vendor[]>(mockVendors);
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
  const navigate = useNavigate();
  const { handleSortClick, getSortIndicator, getSortedData } = useSortingTable(vendorsList);
  const columnManagement = useColumnManagement([
    "name",
    "phone",
    "email",
    "notes",
    "servicesProvided",
  ]);

  const columnConfig: Record<string, { label: string; icon: React.ReactNode }> = {
    name: {
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
    phone: {
      label: "Phone",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
        </svg>
      ),
    },
    email: {
      label: "Email",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect width="20" height="16" x="2" y="4" rx="2" />
          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </svg>
      ),
    },
    notes: {
      label: "Notes",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
          <path d="M14 2v4a2 2 0 0 0 2 2h4" />
        </svg>
      ),
    },
    servicesProvided: {
      label: "Services",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2v20M2 12h20" />
        </svg>
      ),
    },
  };


  return (
    <div className="flex flex-col gap-6">
      {/* Header Section */}
      <div className="flex items-center gap-10 justify-between flex-wrap">
        {/* Title and Description */}
        <div className="flex flex-col gap-1 min-w-[240px]">
          <h1 className="text-[#303030] font-semibold text-2xl leading-[30px]">
            Vendors
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <p
              className="text-[#717179] font-medium text-base leading-4"
              style={{ marginTop: "-4px" }}
            >
              All vendors for {propertyAddress}
            </p>
          </div>
        </div>

        {/* Add Vendor Button */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsAddVendorModalOpen(true)}
            className="flex h-9 items-center gap-2 px-3 rounded-lg border border-white bg-[#013764] shadow-[0_0_0_1px_#002D5A] hover:bg-[#003a73] transition-colors"
          >
            <Plus className="w-5 h-5 text-white" />
            <span className="text-white font-medium text-base leading-normal">
              Add Vendor
            </span>
          </button>
        </div>
      </div>

      <GlobalTable
        columns={[
          { key: "name", label: "Name", icon: columnConfig.name.icon },
          { key: "phone", label: "Phone", icon: columnConfig.phone.icon },
          { key: "email", label: "Email", icon: columnConfig.email.icon },
          { key: "notes", label: "Notes", icon: columnConfig.notes.icon },
          { key: "servicesProvided", label: "Services", icon: columnConfig.servicesProvided.icon },
        ]}
        data={vendorsList}
        rowKey="id"
        actions={[
          {
            label: "Edit",
            icon: <EditIcon width={18} height={18} color="#525252" />,
            onClick: (vendor: Vendor) => {
              navigate(`/vendors/${vendor.id}`);
            },
          },
          {
            label: "Delete",
            icon: <DeleteIcon width={18} height={18} color="#982740" />,
            onClick: (vendor: Vendor) => {
              setVendorsList((prev) => prev.filter((v) => v.id !== vendor.id));
            },
          },
        ]}
        renderCell={(vendor: Vendor, columnKey: string) => {
          switch (columnKey) {
            case "name":
              return (
                <span className="text-gray-900 font-normal text-sm truncate">
                  {vendor.name}
                </span>
              );
            case "phone":
              return (
                <span className="text-gray-900 font-normal text-sm truncate">
                  {vendor.phone}
                </span>
              );
            case "email":
              return (
                <span className="text-gray-900 font-normal text-sm truncate">
                  {vendor.email}
                </span>
              );
            case "notes":
              return (
                <span className="text-gray-900 font-normal text-sm truncate">
                  {vendor.notes}
                </span>
              );
            case "servicesProvided":
              return (
                <div className="flex flex-wrap gap-2">
                  {(vendor.propertyServices || []).map((service) => (
                    <span
                      key={service}
                      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {service}
                    </span>
                  ))}
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
        title="Vendors"
        showColumnModal={columnManagement.showColumnModal}
        onShowColumnModalChange={columnManagement.setShowColumnModal}
        onRowClick={(vendor: Vendor) => {
          navigate(`/vendors/${vendor.id}`);
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
              <circle cx="8" cy="3" r="1.5" fill="#303030"/>
              <circle cx="8" cy="8" r="1.5" fill="#303030"/>
              <circle cx="8" cy="13" r="1.5" fill="#303030"/>
            </svg>
          </button>
        }
      />

      {/* Add Vendor Modal */}
      <AddVendorModal
        open={isAddVendorModalOpen}
        onOpenChange={setIsAddVendorModalOpen}
      />

      {/* Column Filter Modal */}
      <ColumnFilterModal
        isOpen={columnManagement.showColumnModal}
        position={columnManagement.columnMenuPos}
        columns={columnManagement.columnOrder.map(key => ({
          key,
          label: columnConfig[key]?.label || key,
          icon: columnConfig[key]?.icon,
        }))}
        visibleColumns={columnManagement.visibleColumns}
        onToggleColumn={columnManagement.toggleColumnVisibility}
        onClose={() => columnManagement.setShowColumnModal(false)}
        buttonRef={columnManagement.columnButtonRef}
      />
    </div>
  );
};
