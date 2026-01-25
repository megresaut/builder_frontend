import { useCallback, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import { usePageState } from "@/hooks/usePageState";
import { useSortingTable } from "@/hooks/useSortingTable";
import { useColumnManagement } from "@/hooks/useColumnManagement";
import AddVendorModal from "@/components/AddVendorModal";
import ColumnFilterModal from "@/components/ColumnFilterModal";
import GlobalTable from "@/components/GlobalTable";
import PageTemplate from "@/layout/PageTemplate";
import {
  EditIcon,
  DeleteIcon,
  UserIcon,
  PhoneIcon,
  EmailIcon,
  ListIcon,
  NoteIcon,
  PlusIcon,
} from "@/components/icons";
import { fetchJSON } from "@/api/fetchJSON";

interface BaseVendor {
  id: number;
  name: string;
  phone: string;
  email: string;
  notes: string;
  servicesProvided: string[];
}

// Mock vendor data
const MOCK_VENDORS: BaseVendor[] = [
  {
    id: 1,
    name: "David Smith",
    phone: "724.705.2990",
    email: "mattgzyb21@gmail.com",
    notes: "Reliable vendor, quick turnaround",
    servicesProvided: ["HVAC", "Plumbing"],
  },
  {
    id: 2,
    name: "David Smith",
    phone: "724.705.2990",
    email: "mattgzyb21@gmail.com",
    notes: "Good quality work",
    servicesProvided: ["Carpentry", "Drywall"],
  },
  {
    id: 3,
    name: "David Smith",
    phone: "724.705.2990",
    email: "mattgzyb21@gmail.com",
    notes: "Preferred for electrical work",
    servicesProvided: ["Electrical", "Lighting"],
  },
  {
    id: 4,
    name: "David Smith",
    phone: "724.705.2990",
    email: "mattgzyb21@gmail.com",
    notes: "",
    servicesProvided: ["Roofing"],
  },
  {
    id: 5,
    name: "David Smith",
    phone: "724.705.2990",
    email: "mattgzyb21@gmail.com",
    notes: "Great communication",
    servicesProvided: ["Painting", "Flooring"],
  },
  {
    id: 6,
    name: "David Smith",
    phone: "724.705.2990",
    email: "mattgzyb21@gmail.com",
    notes: "Specializes in plumbing",
    servicesProvided: ["Plumbing", "Drainage"],
  },
  {
    id: 7,
    name: "David Smith",
    phone: "724.705.2990",
    email: "mattgzyb21@gmail.com",
    notes: "",
    servicesProvided: ["Landscaping", "Lawn Care"],
  },
  {
    id: 8,
    name: "David Smith",
    phone: "724.705.2990",
    email: "mattgzyb21@gmail.com",
    notes: "Budget-friendly option",
    servicesProvided: ["General Repairs", "Maintenance"],
  },
  {
    id: 9,
    name: "David Smith",
    phone: "724.705.2990",
    email: "mattgzyb21@gmail.com",
    notes: "Certified professional",
    servicesProvided: ["HVAC", "Electrical"],
  },
  {
    id: 10,
    name: "David Smith",
    phone: "724.705.2990",
    email: "mattgzyb21@gmail.com",
    notes: "Excellent references",
    servicesProvided: ["Carpentry", "Painting", "Flooring"],
  },
];

export default function Vendors() {
  const navigate = useNavigate();
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
  const [vendors, setVendors] = useState<BaseVendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  
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
    const newVendor: BaseVendor = {
      id: Math.max(...vendors.map((v) => v.id), 0) + 1,
      ...vendorData,
    };
    setVendors((prev) => [...prev, newVendor]);
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
      setVendors((prev) => prev.filter((v) => v.id !== vendor.id));
    },
    [],
  );

  const handleEditVendor = useCallback(
    (vendor: BaseVendor) => {
      navigate(`/vendors/${vendor.id}`, {
        state: { vendor },
      });
    },
    [navigate],
  );

  const [search, setSearch] = useState("");
  const filteredVendors = vendors.filter((vendor) => {
    if (!search.trim()) return true;
  
    const q = search.toLowerCase();
  
    return (
      vendor.name.toLowerCase().includes(q) ||
      vendor.email.toLowerCase().includes(q) ||
      vendor.phone.toLowerCase().includes(q) ||
      vendor.notes.toLowerCase().includes(q) ||
      vendor.servicesProvided.some((s) =>
        s.toLowerCase().includes(q)
      )
    );
  });

  const { handleSortClick, getSortIndicator, getSortedData } = useSortingTable(filteredVendors, "vendors");
  
  useEffect(() => {
    let isMounted = true;
  
    async function loadVendors() {
      try {
        setLoading(true);
  
        const pageSize = 200;
        let offset = 0;
        const aggregated: BaseVendor[] = [];

        while (true) {
          const rawVendors = await fetchJSON(
            `/vendors?limit=${pageSize}&offset=${offset}`,
          );

          const mapped: BaseVendor[] = rawVendors.map((v: any) => ({
            id: v.id,
            name: v.name,
            phone: v.phone ?? "",
            email: v.primary_email ?? "",
            notes: v.notes ?? "",
            servicesProvided: v.category ? [v.category] : [],
          }));

          aggregated.push(...mapped);

          if (rawVendors.length < pageSize) break;
          offset += rawVendors.length;
        }
  
        if (isMounted) {
          setVendors(aggregated);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message ?? "Failed to load vendors");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
  
    loadVendors();
  
    return () => {
      isMounted = false;
    };
  }, []);
  

  return (
    <PageTemplate>
      <div className="flex flex-col gap-6 w-fit min-w-full">
        <PageHeader
          title="Vendors"
          subtitle="All your vendors, in one place"
          action={{
            label: "Add Vendor",
            onClick: () => setIsAddVendorModalOpen(true),
            icon: <PlusIcon width={20} height={20} />,
          }}
        />

        <div className="flex flex-col gap-6">
          {loading && (
            <div className="text-sm text-gray-500">Loading vendors…</div>
          )}

          {error && (
            <div className="text-sm text-red-600">{error}</div>
          )}
          <GlobalTable
            columns={columns}
            data={filteredVendors}
            searchValue={search}
            onSearchChange={setSearch}
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
                  <span
                    className="text-gray-900 font-normal text-sm truncate max-w-[240px] block"
                    title={vendor.notes}
                  >
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
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle cx="8" cy="3" r="1.5" fill="#303030" />
                  <circle cx="8" cy="8" r="1.5" fill="#303030" />
                  <circle cx="8" cy="13" r="1.5" fill="#303030" />
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
              navigate(`/vendors/${vendor.id}`, {
                state: { vendor },
              });
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
