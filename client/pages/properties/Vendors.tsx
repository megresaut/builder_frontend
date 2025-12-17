import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Search, Plus } from "lucide-react";
import { usePageState } from "@/hooks/usePageState";
import { useSortingTable } from "@/hooks/useSortingTable";
import { useColumnManagement } from "@/hooks/useColumnManagement";
import ColumnFilterModal from "@/components/ColumnFilterModal";
import GlobalTable from "@/components/GlobalTable";
import AddVendorModal from "@/components/AddVendorModal";

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

      <div className="flex flex-col gap-6">
        {/* Vendors Table */}
        <div className="w-full border border-gray-200 bg-white rounded-lg overflow-hidden">
          {/* Table Header */}
          <div className="flex justify-between items-center px-6 py-3 border-b border-gray-200 bg-white">
            <div className="flex items-center gap-4">
              <h2 className="text-[#303030] font-medium text-[22px] leading-6">
                Vendors
              </h2>
            </div>
            <div className="flex items-start gap-2.5">
              <div className="flex h-9 items-center gap-2 px-3 rounded-lg border border-[#DADADA] bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.03)]">
                <Search className="w-5 h-5 text-gray-600" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="text-[#303030] font-normal text-base leading-[140%] tracking-[-0.32px] capitalize bg-transparent border-none outline-none placeholder:text-[#303030] w-32 sm:w-48"
                />
              </div>
              <button
                onClick={() => {}}
                className="flex h-9 justify-center items-center gap-2 px-3 rounded-lg border border-[#DADADA] bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] hover:bg-gray-50 transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4.5 6.75L9 11.25L13.5 6.75" stroke="#303030" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-[#303030] font-normal text-base leading-[140%] tracking-[-0.32px] capitalize">
                  Filters
                </span>
              </button>
              <button
                ref={columnButtonRef}
                onClick={() => setShowColumnModal((prev) => !prev)}
                className="flex h-9 w-9 justify-center items-center rounded-lg border border-[#DADADA] bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] hover:bg-gray-50 transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="8" cy="3" r="1.5" fill="#303030"/>
                  <circle cx="8" cy="8" r="1.5" fill="#303030"/>
                  <circle cx="8" cy="13" r="1.5" fill="#303030"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Table Content */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 h-12">
                  {columnOrder.filter(colKey => visibleColumns.has(colKey)).map((colKey) => {
                    const colConfig = columnConfig[colKey];
                    return (
                      <th
                        key={colKey}
                        draggable
                        onDragStart={() => handleColumnDragStart(colKey)}
                        onDragOver={(e) => handleColumnDragOver(e, colKey)}
                        onDragLeave={handleColumnDragLeave}
                        onDrop={(e) => handleColumnDrop(e, colKey)}
                        onClick={() => handleSortClick(colKey)}
                        className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap cursor-pointer hover:bg-gray-100 transition-colors relative"
                        style={{
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
                        <div className="flex items-center gap-2 whitespace-nowrap">
                          {colConfig?.icon}
                          <span className="font-medium text-sm text-gray-700 truncate">
                            {colConfig?.label}
                          </span>
                          {getSortIndicator(colKey) && (
                            <span className="text-xs font-bold text-gray-500">
                              {getSortIndicator(colKey)}
                            </span>
                          )}
                        </div>
                      </th>
                    );
                  })}
                  <th
                    className="sticky right-0 px-2 py-3 text-center w-20"
                    style={{
                      borderLeftWidth: "2px",
                      border: "1px none rgb(226, 232, 240)",
                      backgroundColor: "white",
                    }}
                  >
                    <span className="font-medium text-sm text-gray-700">
                      Actions
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {getDisplayedVendorsForPage().map((vendor) => (
                    <tr
                      key={vendor.id}
                      onClick={() => navigate(`/vendors/${vendor.id}`)}
                      className="border-b border-gray-200 hover:bg-gray-50 transition-colors h-12 cursor-pointer"
                    >
                      {columnOrder.filter(colKey => visibleColumns.has(colKey)).map((colKey) => {
                        let cellContent;
                        switch (colKey) {
                          case "name":
                            cellContent = vendor.name;
                            break;
                          case "phone":
                            cellContent = vendor.phone;
                            break;
                          case "email":
                            cellContent = vendor.email;
                            break;
                          case "notes":
                            cellContent = vendor.notes;
                            break;
                          case "servicesProvided":
                            cellContent = (
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
                            break;
                          default:
                            cellContent = "";
                        }
                        return (
                          <td
                            key={colKey}
                            className={`px-3 py-3 border-r border-gray-200 ${
                              typeof cellContent === 'string'
                                ? 'whitespace-nowrap overflow-hidden'
                                : ''
                            }`}
                          >
                            {typeof cellContent === 'string' ? (
                              <span className="text-gray-900 font-normal text-sm truncate">
                                {cellContent}
                              </span>
                            ) : (
                              cellContent
                            )}
                          </td>
                        );
                      })}
                      <td
                        className="sticky right-0 px-2 py-3 flex items-center justify-center"
                        style={{
                          borderLeftWidth: "2px",
                          width: "80px",
                          border:
                            "1px none rgb(226, 232, 240) rgb(226, 232, 240) rgb(226, 232, 240) rgb(210, 209, 207)",
                          borderLeftColor: "transparent",
                          backgroundColor: "white",
                        }}
                      >
                        <ActionButton
                          vendorId={vendor.id}
                          openMenuId={openMenuId}
                          setOpenMenuId={setOpenMenuId}
                          onEditClick={handleVendorEdit}
                        />
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
              <div
                className="relative"
                style={{ position: "relative", zIndex: 10 }}
              >
                <button
                  ref={dropdownButtonRef}
                  onClick={() => setShowPageSizeDropdown(!showPageSizeDropdown)}
                  className="flex items-center justify-center gap-2 h-10 px-3 border rounded-lg bg-white hover:bg-gray-50 transition-colors text-gray-900 font-medium text-sm relative"
                  style={{
                    borderColor: "rgb(218, 218, 218)",
                    borderWidth: "0.909091px",
                    boxShadow:
                      "rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.03) 0px 1px 3px 0px",
                  }}
                >
                  <div className="text-gray-900 font-medium text-sm">
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
                {showPageSizeDropdown &&
                  createPortal(
                    <div
                      className="bg-white flex flex-col justify-center items-start gap-1 p-2"
                      style={{
                        width: "60px",
                        border: "0.5px solid #DADADA",
                        borderRadius: "8px",
                        boxShadow:
                          "0 38px 11px 0 rgba(0, 0, 0, 0.00), 0 24px 10px 0 rgba(0, 0, 0, 0.01), 0 14px 8px 0 rgba(0, 0, 0, 0.04), 0 6px 6px 0 rgba(0, 0, 0, 0.06), 0 2px 3px 0 rgba(0, 0, 0, 0.07)",
                        zIndex: 99999,
                        position: "fixed",
                        top: dropdownPos.top + "px",
                        left: dropdownPos.left + "px",
                        pointerEvents: "auto",
                      }}
                      onMouseLeave={() => setShowPageSizeDropdown(false)}
                    >
                      {[10, 25, 50].map((size) => (
                        <button
                          key={size}
                          onClick={() => {
                            setItemsPerPage(size);
                            setCurrentPage(1);
                            setShowPageSizeDropdown(false);
                          }}
                          className={cn(
                            "w-full px-3 py-2 text-left text-sm hover:bg-gray-50 rounded transition-colors",
                            itemsPerPage === size
                              ? "bg-gray-100 font-medium"
                              : "",
                          )}
                        >
                          {size}
                        </button>
                      ))}
                    </div>,
                    document.body,
                  )}
              </div>
              <span className="text-gray-700 text-sm font-medium">
                of {totalVendors}
              </span>
            </div>
            <div
              className="flex items-center rounded-lg border bg-white overflow-hidden"
              style={{
                borderColor: "rgb(218, 218, 218)",
                borderWidth: "0.909091px",
                boxShadow:
                  "rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.03) 0px 1px 3px 0px",
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
                  stroke={
                    currentPage === 1 ? "rgb(163, 163, 163)" : "currentColor"
                  }
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
              {getPaginationNumbers().map((page, idx) => {
                if (page === "...") {
                  return (
                    <button
                      key={`ellipsis-${idx}`}
                      disabled
                      className="flex items-center justify-center h-10 min-w-10 opacity-50 cursor-not-allowed"
                      style={{
                        borderRightWidth: "0.909091px",
                        borderRightColor: "rgb(229, 229, 229)",
                        backgroundColor: "rgba(0, 0, 0, 0)",
                      }}
                    >
                      <div className="text-gray-500 font-medium text-sm">
                        ...
                      </div>
                    </button>
                  );
                }

                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page as number)}
                    className={cn(
                      "flex items-center justify-center h-10 min-w-10 transition-colors",
                      currentPage === page
                        ? "hover:bg-gray-50"
                        : "hover:bg-gray-50",
                    )}
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
                );
              })}
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
                  <path d="m12 19 7-7-7-7" />
                  <path d="M5 12h14" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add Vendor Modal */}
      <AddVendorModal
        open={isAddVendorModalOpen}
        onOpenChange={setIsAddVendorModalOpen}
      />

      {/* Column Filter Modal */}
      <ColumnFilterModal
        isOpen={showColumnModal}
        position={columnMenuPos}
        columns={columnOrder.map(key => ({
          key,
          label: columnConfig[key]?.label || key,
          icon: columnConfig[key]?.icon,
        }))}
        visibleColumns={visibleColumns}
        onToggleColumn={toggleColumnVisibility}
        onClose={() => setShowColumnModal(false)}
      />
    </div>
  );
};
