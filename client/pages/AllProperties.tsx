import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { StatusBadge } from "./Utilities";
import AddPropertyModal from "@/components/AddPropertyModal";
import { usePageState } from "@/hooks/usePageState";
import { useSortingTable } from "@/hooks/useSortingTable";
import { useColumnManagement } from "@/hooks/useColumnManagement";
import ColumnFilterModal from "@/components/ColumnFilterModal";

interface Manager {
  id: number;
  name: string;
  initials: string;
  color: string;
}

interface Property {
  id: number;
  address: string;
  location: string;
  managers: Manager[];
  type: string;
  buildingId: string;
  status: "active" | "inactive";
}

const properties: Property[] = [
  {
    id: 1,
    address: "22 Indian Chase Dr",
    location: "Greenwich, CT",
    managers: [
      { id: 1, name: "Jerry Sanchez", initials: "JS", color: "bg-blue-500" },
      { id: 2, name: "John Doe", initials: "JD", color: "bg-purple-500" },
    ],
    type: "Concierge",
    buildingId: "624090",
    status: "inactive",
  },
  {
    id: 2,
    address: "22 Indian Chase Dr",
    location: "Greenwich, CT",
    managers: [
      { id: 1, name: "Jerry Sanchez", initials: "JS", color: "bg-blue-500" },
      { id: 3, name: "Jane Smith", initials: "JMS", color: "bg-green-500" },
    ],
    type: "Rental",
    buildingId: "624090",
    status: "active",
  },
  {
    id: 3,
    address: "22 Indian Chase Dr",
    location: "Greenwich, CT",
    managers: [
      { id: 1, name: "Jerry Sanchez", initials: "JS", color: "bg-blue-500" },
      { id: 4, name: "Mike Johnson", initials: "MJ", color: "bg-orange-500" },
    ],
    type: "Commercial",
    buildingId: "624090",
    status: "active",
  },
  {
    id: 4,
    address: "22 Indian Chase Dr",
    location: "Greenwich, CT",
    managers: [
      { id: 2, name: "John Doe", initials: "JD", color: "bg-purple-500" },
    ],
    type: "OR",
    buildingId: "624090",
    status: "active",
  },
  {
    id: 5,
    address: "22 Indian Chase Dr",
    location: "Greenwich, CT",
    managers: [
      { id: 3, name: "Jane Smith", initials: "JMS", color: "bg-green-500" },
      { id: 4, name: "Mike Johnson", initials: "MJ", color: "bg-orange-500" },
    ],
    type: "HOA",
    buildingId: "624090",
    status: "active",
  },
  {
    id: 6,
    address: "22 Indian Chase Dr",
    location: "Greenwich, CT",
    managers: [
      { id: 1, name: "Jerry Sanchez", initials: "JS", color: "bg-blue-500" },
    ],
    type: "Concierge",
    buildingId: "624090",
    status: "active",
  },
  {
    id: 7,
    address: "22 Indian Chase Dr",
    location: "Greenwich, CT",
    managers: [
      { id: 2, name: "John Doe", initials: "JD", color: "bg-purple-500" },
      { id: 3, name: "Jane Smith", initials: "JMS", color: "bg-green-500" },
    ],
    type: "Concierge",
    buildingId: "624090",
    status: "active",
  },
  {
    id: 8,
    address: "22 Indian Chase Dr",
    location: "Greenwich, CT",
    managers: [
      { id: 4, name: "Mike Johnson", initials: "MJ", color: "bg-orange-500" },
    ],
    type: "Concierge",
    buildingId: "624090",
    status: "active",
  },
  {
    id: 9,
    address: "22 Indian Chase Dr",
    location: "Greenwich, CT",
    managers: [
      { id: 1, name: "Jerry Sanchez", initials: "JS", color: "bg-blue-500" },
      { id: 4, name: "Mike Johnson", initials: "MJ", color: "bg-orange-500" },
    ],
    type: "Concierge",
    buildingId: "624090",
    status: "active",
  },
  {
    id: 10,
    address: "22 Indian Chase Dr",
    location: "Greenwich, CT",
    managers: [
      { id: 3, name: "Jane Smith", initials: "JMS", color: "bg-green-500" },
    ],
    type: "Concierge",
    buildingId: "624090",
    status: "active",
  },
];

const ActionButton = ({
  property,
  openMenuId,
  setOpenMenuId,
  onEditClick,
}: {
  property: Property;
  openMenuId: number | null;
  setOpenMenuId: (id: number | null) => void;
  onEditClick: (data: Property) => void;
}) => {
  const propertyId = property.id;
  const showMenu = openMenuId === propertyId;
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    let animationFrameId: number;

    const updateMenuPos = () => {
      if (showMenu && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();

        setMenuPos({
          top: rect.bottom + 8,
          left: rect.right - 145,
        });
      }

      if (showMenu) {
        animationFrameId = requestAnimationFrame(updateMenuPos);
      }
    };

    if (showMenu) {
      updateMenuPos();
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [showMenu]);

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setOpenMenuId(showMenu ? null : propertyId)}
        className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="1" />
          <circle cx="19" cy="12" r="1" />
          <circle cx="5" cy="12" r="1" />
        </svg>
      </button>

      {showMenu &&
        createPortal(
          <div
            className="bg-white flex flex-col justify-center items-start gap-4 p-4"
            style={{
              width: "145px",
              border: "0.5px solid #DADADA",
              borderRadius: "8px",
              boxShadow:
                "0 38px 11px 0 rgba(0, 0, 0, 0.00), 0 24px 10px 0 rgba(0, 0, 0, 0.01), 0 14px 8px 0 rgba(0, 0, 0, 0.04), 0 6px 6px 0 rgba(0, 0, 0, 0.06), 0 2px 3px 0 rgba(0, 0, 0, 0.07)",
              zIndex: 99999,
              position: "fixed",
              top: menuPos.top + "px",
              left: menuPos.left + "px",
              pointerEvents: "auto",
            }}
            onMouseLeave={() => setOpenMenuId(null)}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEditClick(property);
                setOpenMenuId(null);
              }}
              className="flex justify-between items-center w-full hover:opacity-70 transition-opacity"
            >
              <span
                className="text-[#303030] font-normal text-base leading-[140%] tracking-[-0.32px] capitalize"
                style={{
                  fontFamily:
                    "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                }}
              >
                Edit
              </span>
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
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                console.log("Delete clicked for property", propertyId);
                setOpenMenuId(null);
              }}
              className="flex justify-between items-center w-full hover:opacity-70 transition-opacity"
            >
              <span
                className="text-[#303030] font-normal text-base leading-[140%] tracking-[-0.32px] capitalize"
                style={{
                  fontFamily:
                    "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                }}
              >
                Delete
              </span>
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
            </button>
          </div>,
          document.body,
        )}
    </>
  );
};

export default function AllProperties() {
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
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const dropdownButtonRef = useRef<HTMLButtonElement>(null);
  const dropdownMenuRef = useRef<HTMLDivElement>(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const [isAddPropertyModalOpen, setIsAddPropertyModalOpen] = usePageState(
    "isAddPropertyModalOpen",
    false,
  );
  const { handleSortClick, getSortIndicator, getSortedData } = useSortingTable(properties);
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
    "address",
    "location",
    "managers",
    "type",
    "buildingId",
    "status",
  ]);

  const columnConfig: Record<string, { label: string; icon: React.ReactNode }> = {
    address: {
      label: "Address",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
          <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
          <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
          <path d="M10 6h4" />
          <path d="M10 10h4" />
          <path d="M10 14h4" />
          <path d="M10 18h4" />
        </svg>
      ),
    },
    location: {
      label: "Location",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      ),
    },
    managers: {
      label: "Manager",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
    },
    type: {
      label: "Type",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect width="18" height="18" x="3" y="3" rx="2" />
          <path d="M7 7h10M7 12h10M7 17h4" />
        </svg>
      ),
    },
    buildingId: {
      label: "Buildium ID",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect width="18" height="18" x="3" y="3" rx="2" />
          <path d="M8 7h8M8 12h8M8 17h4" />
        </svg>
      ),
    },
    status: {
      label: "Status",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
      ),
    },
  };

  const getDisplayedPropertiesForPage = () => {
    const sorted = getSortedData();
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return sorted.slice(start, end);
  };

  const handlePropertyEdit = (property: Property) => {
    setEditingProperty(property);
    setIsAddPropertyModalOpen(true);
  };

  useEffect(() => {
    let animationFrameId: number;

    const updateDropdownPos = () => {
      if (showPageSizeDropdown && dropdownButtonRef.current) {
        const rect = dropdownButtonRef.current.getBoundingClientRect();
        setDropdownPos({
          top: rect.bottom + 8,
          left: rect.left,
        });
      }

      if (showPageSizeDropdown) {
        animationFrameId = requestAnimationFrame(updateDropdownPos);
      }
    };

    if (showPageSizeDropdown) {
      updateDropdownPos();
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [showPageSizeDropdown]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showPageSizeDropdown &&
        dropdownMenuRef.current &&
        dropdownButtonRef.current
      ) {
        const isClickOutside =
          !dropdownMenuRef.current.contains(event.target as Node) &&
          !dropdownButtonRef.current.contains(event.target as Node);

        if (isClickOutside) {
          setShowPageSizeDropdown(false);
        }
      }
    };

    if (showPageSizeDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [showPageSizeDropdown]);

  const totalProperties = getSortedData().length;
  const totalPages = Math.ceil(totalProperties / itemsPerPage);

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

    // For totalPages > 7, show exactly 7 consecutive pages without ellipsis
    const windowSize = 7;
    let start = Math.max(1, currentPage - 2);
    let end = start + windowSize - 1;

    // Adjust if we're near the end to keep showing 7 pages
    if (end > totalPages) {
      end = totalPages;
      start = Math.max(1, end - windowSize + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  };

  return (
    <div
      className="bg-white"
      style={{
        borderLeftWidth: "1.33333px",
        border: "1px none rgb(226, 232, 240) rgb(226, 232, 240) rgb(226, 232, 240) rgb(210, 209, 207)",
        padding: "32px 32px 150px",
      }}
    >
      <div className="max-w-full mx-auto flex flex-col gap-6">
        {/* Header Section */}
        <div className="flex items-center gap-10 justify-between flex-wrap">
          {/* Title and Description */}
          <div className="flex flex-col gap-1 min-w-[240px]">
            <h1 className="text-[#303030] font-semibold text-2xl leading-[30px]">
              All Properties
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <p
                className="text-[#717179] font-medium text-base leading-4"
                style={{ marginTop: "-4px" }}
              >
                Click a property to manage its utility accounts and imports
              </p>
            </div>
          </div>

          {/* Add Property Button */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsAddPropertyModalOpen(true)}
              className="flex h-9 items-center gap-2 px-3 rounded-lg border border-white bg-[#013764] shadow-[0_0_0_1px_#002D5A] hover:bg-[#003a73] transition-colors"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M10 4.16667V15.8333M4.16667 10H15.8333"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-white font-medium text-base leading-normal">
                Add Property
              </span>
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {/* Properties Table */}
          <div className="w-full border border-gray-200 bg-white rounded-lg overflow-hidden">
            {/* Table Header */}
            <div className="flex justify-between items-center px-6 py-3 border-b border-gray-200 bg-white">
              <div className="flex items-center gap-4">
                <h2 className="text-[#303030] font-medium text-[22px] leading-6">
                  Property List
                </h2>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="flex h-9 items-center gap-2 px-3 rounded-lg border border-[#DADADA] bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.03)]">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M17.5 17.5L13.875 13.875M15.8333 9.16667C15.8333 12.8486 12.8486 15.8333 9.16667 15.8333C5.48477 15.8333 2.5 12.8486 2.5 9.16667C2.5 5.48477 5.48477 2.5 9.16667 2.5C12.8486 2.5 15.8333 5.48477 15.8333 9.16667Z"
                      stroke="#303030"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search..."
                    className="text-[#303030] font-normal text-base leading-[140%] tracking-[-0.32px] capitalize bg-transparent border-none outline-none placeholder:text-[#303030] w-32 sm:w-48"
                  />
                </div>
                <button
                  ref={columnButtonRef}
                  onClick={() => setShowColumnModal(!showColumnModal)}
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
                          <div className="flex items-center gap-2">
                            {colConfig?.icon}
                            <span className="font-medium text-sm text-gray-700">
                              {colConfig?.label}
                            </span>
                            {getSortIndicator(colKey) && (
                              <span className="text-xs font-bold text-gray-700 ml-1">
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
                  {getDisplayedPropertiesForPage().map((property) => {
                      const handleRowClick = (e: React.MouseEvent) => {
                        if (
                          (e.target as HTMLElement).closest("td:last-child")
                        ) {
                          return;
                        }
                        navigate(`/property/${property.id}`);
                      };
                      return (
                        <tr
                          key={property.id}
                          className="border-b border-gray-200 hover:bg-gray-50 transition-colors h-12 cursor-pointer"
                          onClick={handleRowClick}
                        >
                          <td className="px-3 py-3 border-r border-gray-200 whitespace-nowrap">
                            <span className="text-gray-900 font-normal text-sm">
                              {property.address}
                            </span>
                          </td>
                          <td className="px-3 py-3 border-r border-gray-200 whitespace-nowrap">
                            <span className="text-gray-900 font-normal text-sm">
                              {property.location}
                            </span>
                          </td>
                          <td className="px-3 py-3 border-r border-gray-200 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {property.managers.map((manager) => (
                                <div
                                  key={manager.id}
                                  className="relative group"
                                >
                                  <div
                                    className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold cursor-pointer"
                                    style={{
                                      backgroundColor: "rgb(59, 130, 246)",
                                      borderColor: "rgb(209, 213, 219)",
                                      borderWidth: "1px",
                                    }}
                                    title={manager.name}
                                  >
                                    {manager.initials}
                                  </div>
                                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                                    {manager.name}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="px-3 py-3 border-r border-gray-200 whitespace-nowrap">
                            <span className="text-gray-900 font-normal text-sm">
                              {property.type}
                            </span>
                          </td>
                          <td className="px-3 py-3 border-r border-gray-200 whitespace-nowrap">
                            <span className="text-gray-900 font-normal text-sm">
                              {property.buildingId}
                            </span>
                          </td>
                          <td
                            className="px-3 py-3 whitespace-nowrap"
                            style={{
                              borderRightWidth: "1px",
                              border: "1px solid #e7e8ec",
                            }}
                          >
                            <StatusBadge status={property.status} />
                          </td>
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
                              property={property}
                              openMenuId={openMenuId}
                              setOpenMenuId={setOpenMenuId}
                              onEditClick={handlePropertyEdit}
                            />
                          </td>
                        </tr>
                      );
                    })}
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
                </div>
                <span className="text-gray-700 text-sm font-medium">
                  of {totalProperties}
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
                  style={{
                    backgroundColor: "rgba(0, 0, 0, 0)",
                  }}
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
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Dropdown Menu - Rendered via Portal at body level */}
      {showPageSizeDropdown &&
        createPortal(
          <div
            ref={dropdownMenuRef}
            className="bg-white overflow-hidden"
            style={{
              border: "0.5px solid #DADADA",
              borderRadius: "8px",
              boxShadow:
                "0 38px 11px 0 rgba(0, 0, 0, 0.00), 0 24px 10px 0 rgba(0, 0, 0, 0.01), 0 14px 8px 0 rgba(0, 0, 0, 0.04), 0 6px 6px 0 rgba(0, 0, 0, 0.06), 0 2px 3px 0 rgba(0, 0, 0, 0.07)",
              zIndex: 99999,
              minWidth: "56px",
              width: "56px",
              position: "fixed",
              top: dropdownPos.top + "px",
              left: dropdownPos.left + "px",
              pointerEvents: "auto",
            }}
            onMouseLeave={() => setShowPageSizeDropdown(false)}
          >
            {[10, 25, 50].map((size, index) => (
              <button
                key={size}
                onClick={() => {
                  setItemsPerPage(size);
                  setCurrentPage(1);
                  setShowPageSizeDropdown(false);
                }}
                className={cn(
                  "w-full px-4 py-3 text-center text-base transition-colors whitespace-nowrap",
                  itemsPerPage === size
                    ? "bg-gray-50 font-medium text-gray-900"
                    : "text-[#303030] hover:bg-gray-50",
                )}
                style={{
                  fontFamily:
                    "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                  fontSize: "16px",
                  lineHeight: "140%",
                  letterSpacing: "-0.32px",
                  borderRadius: index === 2 ? "0 0 8px 8px" : "0",
                }}
              >
                {size}
              </button>
            ))}
          </div>,
          document.body,
        )}

      <AddPropertyModal
        open={isAddPropertyModalOpen}
        onOpenChange={(open) => {
          setIsAddPropertyModalOpen(open);
          if (!open) {
            setEditingProperty(null);
          }
        }}
        editData={editingProperty || undefined}
      />
    </div>
  );
}
