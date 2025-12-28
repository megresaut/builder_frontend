import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { usePageState } from "@/hooks/usePageState";
import { useSortingTable } from "@/hooks/useSortingTable";
import { useColumnManagement } from "@/hooks/useColumnManagement";
import ColumnFilterModal from "@/components/ColumnFilterModal";
import GlobalTable from "@/components/GlobalTable";
import AddVendorModal from "@/components/AddVendorModal";
import { EditIcon, DeleteIcon, UserIcon, PhoneIcon, EmailIcon, NoteIcon, ListIcon, PlusIcon } from "@/components/icons";

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
      icon: <UserIcon width={16} height={16} color="#525252" />,
    },
    phone: {
      label: "Phone",
      icon: <PhoneIcon width={16} height={16} color="#525252" />,
    },
    email: {
      label: "Email",
      icon: <EmailIcon width={16} height={16} color="#525252" />,
    },
    notes: {
      label: "Notes",
      icon: <NoteIcon width={16} height={16} color="#525252" />,
    },
    servicesProvided: {
      label: "Services",
      icon: <ListIcon width={16} height={16} color="#525252" />,
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
            <PlusIcon width={20} height={20} color="white" />
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
