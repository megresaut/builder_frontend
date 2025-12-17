import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, ChevronDown } from "lucide-react";
import { usePageState } from "@/hooks/usePageState";
import { useSortingTable } from "@/hooks/useSortingTable";
import { useColumnManagement } from "@/hooks/useColumnManagement";
import AddVendorModal from "@/components/AddVendorModal";
import ColumnFilterModal from "@/components/ColumnFilterModal";
import GlobalTable from "@/components/GlobalTable";

interface Vendor {
  id: number;
  name: string;
  phone: string;
  email: string;
  notes: string;
  servicesProvided: string[];
}

const mockVendors: Vendor[] = [
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
  const [vendors, setVendors] = useState<Vendor[]>(mockVendors);
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

  const totalVendors = vendors.length;
  const totalPages = Math.ceil(totalVendors / itemsPerPage);

  const getSortedAndPaginatedVendors = () => {
    const sorted = getSortedData();
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return sorted.slice(start, end);
  };

  const getPaginationNumbers = () => {
    const pages: (number | string)[] = [];

    if (totalPages <= 1) {
      return [1];
    }

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
      return pages;
    }

    const windowSize = 7;
    let start = Math.max(1, currentPage - 2);
    let end = start + windowSize - 1;

    if (end > totalPages) {
      end = totalPages;
      start = Math.max(1, end - windowSize + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  };

  // Toggle column visibility
  const toggleColumnVisibility = (columnKey: string) => {
    const newVisibleColumns = new Set(visibleColumns);
    if (newVisibleColumns.has(columnKey)) {
      // Prevent unchecking if it would result in 0 visible columns
      if (newVisibleColumns.size > 1) {
        newVisibleColumns.delete(columnKey);
      }
    } else {
      newVisibleColumns.add(columnKey);
    }
    setVisibleColumns(newVisibleColumns);
  };

  // Column drag-and-drop handlers
  const handleColumnDragStart = (columnKey: string) => {
    setDraggedColumn(columnKey);
  };

  const handleColumnDragOver = (e: React.DragEvent, columnKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";

    const element = e.currentTarget as HTMLElement;
    const rect = element.getBoundingClientRect();
    const midpoint = rect.left + rect.width / 2;
    const position = e.clientX < midpoint ? "before" : "after";

    setDropTargetColumn(columnKey);
    setDropPosition(position);
  };

  const handleColumnDragLeave = () => {
    setDropTargetColumn(null);
  };

  const handleColumnDrop = (e: React.DragEvent, targetColumn: string) => {
    e.preventDefault();

    if (!draggedColumn || draggedColumn === targetColumn) {
      setDraggedColumn(null);
      setDropTargetColumn(null);
      return;
    }

    const draggedIndex = columnOrder.indexOf(draggedColumn);
    const targetIndex = columnOrder.indexOf(targetColumn);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedColumn(null);
      setDropTargetColumn(null);
      return;
    }

    const newColumnOrder = [...columnOrder];
    newColumnOrder.splice(draggedIndex, 1);

    let insertIndex: number;
    if (dropPosition === "before") {
      insertIndex = draggedIndex < targetIndex ? targetIndex - 1 : targetIndex;
    } else {
      insertIndex = draggedIndex < targetIndex ? targetIndex : targetIndex + 1;
    }

    newColumnOrder.splice(insertIndex, 0, draggedColumn);
    setColumnOrder(newColumnOrder);

    setDraggedColumn(null);
    setDropTargetColumn(null);
  };

  // Column configuration with icons
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
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" stroke="#525252" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        </svg>
      ),
    },
    email: {
      label: "Email",
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M2 3H14C14.5523 3 15 3.44772 15 4V12C15 12.5523 14.5523 13 14 13H2C1.44772 13 1 12.5523 1 12V4C1 3.44772 1.44772 3 2 3Z" stroke="#525252" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M1.5 3.5L8 9L14.5 3.5" stroke="#525252" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
    servicesProvided: {
      label: "Services Provided",
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M1.5 3H14.5" stroke="#525252" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M1.5 8H14.5" stroke="#525252" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M1.5 13H14.5" stroke="#525252" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
    notes: {
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
  };

  return (
    <div
      className="bg-white"
      style={{
        borderLeftWidth: "1.33333px",
        border: "1px none rgb(226, 232, 240)",
        padding: "32px 32px 150px",
      }}
    >
      <div className="flex flex-col gap-6 w-fit min-w-full">
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
                All your vendors, in one place
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
                <button className="flex h-9 justify-center items-center gap-2 px-3 rounded-lg border border-[#DADADA] bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] hover:bg-gray-50 transition-colors">
                  <span className="text-[#303030] font-normal text-base leading-[140%] tracking-[-0.32px] capitalize">
                    Filter
                  </span>
                  <ChevronDown className="w-4 h-4" />
                </button>
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
              </div>
            </div>

            {/* Table Content */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 h-12">
                    {columnOrder.filter(colKey => visibleColumns.has(colKey)).map((colKey) => {
                      const colConfig = columnConfig[colKey];
                      const sortIndicator = getSortIndicator(colKey);
                      return (
                        <th
                          key={colKey}
                          draggable
                          onDragStart={() => handleColumnDragStart(colKey)}
                          onDragOver={(e) => handleColumnDragOver(e, colKey)}
                          onDragLeave={handleColumnDragLeave}
                          onDrop={(e) => handleColumnDrop(e, colKey)}
                          onClick={() => handleSortClick(colKey)}
                          className="px-3 py-3 text-left border-r border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors relative"
                          style={{
                            whiteSpace: colKey === "name" ? "nowrap" : "normal",
                            opacity: draggedColumn === colKey ? 0.5 : 1,
                            transition: "opacity 0.2s ease",
                            flex: colKey === "email" || colKey === "servicesProvided" ? 1 : "0 0 auto",
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
                            {sortIndicator && (
                              <span className="text-xs font-bold text-gray-700 ml-1">
                                {sortIndicator}
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
                  {getSortedAndPaginatedVendors().map((vendor) => (
                    <tr
                      key={vendor.id}
                      onClick={() => navigate(`/vendors/${vendor.id}`)}
                      className="border-b border-gray-200 hover:bg-gray-50 transition-colors h-12 cursor-pointer"
                    >
                      {columnOrder.filter(colKey => visibleColumns.has(colKey)).map((colKey) => (
                        <td key={colKey} className={`px-3 py-3 border-r border-gray-200 ${
                          colKey !== 'servicesProvided' ? 'whitespace-nowrap overflow-hidden' : ''
                        }`}>
                          {colKey === "name" && (
                            <span className="text-gray-900 font-normal text-sm whitespace-nowrap">
                              {vendor.name}
                            </span>
                          )}
                          {colKey === "phone" && (
                            <span className="text-gray-900 font-normal text-sm whitespace-nowrap">
                              {vendor.phone}
                            </span>
                          )}
                          {colKey === "email" && (
                            <span className="text-gray-900 font-normal text-sm truncate">
                              {vendor.email}
                            </span>
                          )}
                          {colKey === "servicesProvided" && (
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
                          )}
                          {colKey === "notes" && (
                            <span className="text-gray-900 font-normal text-sm truncate">
                              {vendor.notes}
                            </span>
                          )}
                        </td>
                      ))}
                      <td
                        onClick={(e) => e.stopPropagation()}
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
                <span className="text-gray-700 text-sm font-medium">
                  Showing
                </span>
                <div
                  className="relative"
                  style={{ position: "relative", zIndex: 10 }}
                >
                  <button
                    ref={dropdownButtonRef}
                    onClick={() =>
                      setShowPageSizeDropdown(!showPageSizeDropdown)
                    }
                    className="flex items-center justify-center gap-2 h-10 px-3 border rounded-lg bg-white hover:bg-gray-50 transition-colors text-gray-900 font-medium text-sm relative"
                    style={{
                      borderColor: "rgb(218, 218, 218)",
                      borderWidth: "0.909091px",
                      boxShadow:
                        "rgba(0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.03) 0px 1px 3px 0px",
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
                              itemsPerPage === size ? "bg-gray-100 font-medium" : ""
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
                  of {vendors.length}
                </span>
              </div>
              <div
                className="flex items-center rounded-lg border bg-white overflow-hidden"
                style={{
                  borderColor: "rgb(218, 218, 218)",
                  borderWidth: "0.909091px",
                  boxShadow:
                    "rgba(0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.03) 0px 1px 3px 0px",
                }}
              >
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  className={cn(
                    "flex items-center justify-center gap-1.5 h-10 px-3 transition-colors text-sm font-medium",
                    currentPage === 1
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-gray-50",
                  )}
                  style={{
                    borderRightWidth: "0.909091px",
                    borderRightColor: "rgb(229, 229, 229)",
                    color: currentPage === 1 ? "rgb(163, 163, 163)" : "currentColor"
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m15 18-6-6 6-6" />
                  </svg>
                  <span>Previous</span>
                </button>
                {getPaginationNumbers().map((page) => (
                  <button
                    key={page}
                    onClick={() => typeof page === "number" && setCurrentPage(page)}
                    disabled={page === "..."}
                    className={cn(
                      "h-10 w-10 text-sm font-medium transition-colors",
                      currentPage === page
                        ? "font-bold text-gray-900 bg-white cursor-default"
                        : "hover:bg-gray-50"
                    )}
                    style={{
                      borderRightWidth: page !== getPaginationNumbers()[getPaginationNumbers().length - 1] ? "0.909091px" : "0",
                      borderRightColor: "rgb(229, 229, 229)",
                      color: page === "..." ? "rgb(163, 163, 163)" : "currentColor"
                    }}
                  >
                    {page}
                  </button>
                ))}
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  className={cn(
                    "flex items-center justify-center gap-1.5 h-10 px-3 transition-colors text-sm font-medium",
                    currentPage === totalPages
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-gray-50",
                  )}
                  style={{
                    borderLeftWidth: "0.909091px",
                    borderLeftColor: "rgb(229, 229, 229)",
                    color: currentPage === totalPages ? "rgb(163, 163, 163)" : "currentColor"
                  }}
                >
                  <span>Next</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
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
        columns={allAvailableColumns.map((colKey) => ({
          key: colKey,
          label: columnConfig[colKey]?.label || "",
          icon: columnConfig[colKey]?.icon || null,
        }))}
        visibleColumns={visibleColumns}
        onToggleColumn={toggleColumnVisibility}
        onClose={() => setShowColumnModal(false)}
      />
    </div>
  );
}
