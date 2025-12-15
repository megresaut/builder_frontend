import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Search, Plus, ChevronDown } from "lucide-react";
import { usePageState } from "@/hooks/usePageState";
import { useSortingTable } from "@/hooks/useSortingTable";
import AddVendorModal from "@/components/AddVendorModal";

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

const ActionButton = ({
  vendorId,
  openMenuId,
  setOpenMenuId,
}: {
  vendorId: number;
  openMenuId: number | null;
  setOpenMenuId: (id: number | null) => void;
}) => {
  const navigate = useNavigate();
  const showMenu = openMenuId === vendorId;
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
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
        onClick={() => setOpenMenuId(showMenu ? null : vendorId)}
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
            ref={menuRef}
            data-testid="action-menu"
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
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                setOpenMenuId(null);
                navigate(`/vendors/${vendorId}`);
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
              onClick={() => {
                console.log("Delete clicked for vendor", vendorId);
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
  const { handleSortClick, getSortIndicator, getSortedData } = useSortingTable(vendors, "vendors");
  const dropdownButtonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  
  // Column drag-and-drop state
  const [columnOrder, setColumnOrder] = useState<string[]>([
    "name",
    "phone",
    "email",
    "servicesProvided",
    "notes",
  ]);
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null);
  const [dropTargetColumn, setDropTargetColumn] = useState<string | null>(null);
  const [dropPosition, setDropPosition] = useState<"before" | "after">("before");
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(["name", "phone", "email", "servicesProvided", "notes"])
  );
  const [showColumnModal, setShowColumnModal] = useState(false);
  const [columnMenuPos, setColumnMenuPos] = useState({ top: 0, left: 0 });
  const columnButtonRef = useRef<HTMLButtonElement>(null);
  const allAvailableColumns = ["name", "phone", "email", "servicesProvided", "notes"];

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

  // Close dropdowns when clicking outside and ensure only one is open
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      const isDropdownButtonClick = dropdownButtonRef.current?.contains(target);
      const isColumnButtonClick = columnButtonRef.current?.contains(target);

      // Check if clicking on the column dropdown itself
      const columnDropdownEl = document.querySelector('[style*="260px"]');
      const isColumnDropdownClick = columnDropdownEl?.contains(target);

      // If clicking on a dropdown button, close the other dropdown
      if (isDropdownButtonClick) {
        setShowColumnModal(false);
      } else if (isColumnButtonClick) {
        setShowPageSizeDropdown(false);
      } else if (!isColumnDropdownClick && target.tagName !== 'INPUT') {
        // Clicking outside all dropdowns (but not on column dropdown itself) - close all
        setShowPageSizeDropdown(false);
        setShowColumnModal(false);
        setOpenMenuId(null);
      }
    };

    if (showPageSizeDropdown || showColumnModal || openMenuId !== null) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [showPageSizeDropdown, showColumnModal, openMenuId]);

  useEffect(() => {
    let animationFrameId: number;

    const updateColumnMenuPos = () => {
      if (showColumnModal && columnButtonRef.current) {
        const rect = columnButtonRef.current.getBoundingClientRect();
        setColumnMenuPos({
          top: rect.bottom + 8,
          left: rect.right - 260,
        });
      }

      if (showColumnModal) {
        animationFrameId = requestAnimationFrame(updateColumnMenuPos);
      }
    };

    if (showColumnModal) {
      updateColumnMenuPos();
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [showColumnModal]);

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
        <svg width="14" height="16" viewBox="0 0 14 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6.67023 6.61C8.28843 6.61 9.60023 5.29819 9.60023 3.68C9.60023 2.06181 8.28843 0.75 6.67023 0.75C5.05204 0.75 3.74023 2.06181 3.74023 3.68C3.74023 5.29819 5.05204 6.61 6.67023 6.61Z" stroke="#525252" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M0.75 14.7501V13.0801C0.75 11.1301 2.33 9.56006 4.27 9.56006H9.54C11.49 9.56006 13.06 11.1401 13.06 13.0801V14.7501" stroke="#525252" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
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
        borderLeftWidth: "1px",
        borderLeftColor: "rgb(210, 209, 207)",
        padding: "32px 32px 150px",
      }}
    >
      <div className="max-w-full mx-auto flex flex-col gap-6">
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
                          <div className="flex items-center gap-2">
                            {colConfig?.icon}
                            <span className="font-medium text-sm text-gray-700">
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
                        <td key={colKey} className="px-3 py-3 border-r border-gray-200">
                          {colKey === "name" && (
                            <span className="text-gray-900 font-normal text-base whitespace-nowrap">
                              {vendor.name}
                            </span>
                          )}
                          {colKey === "phone" && (
                            <span className="text-gray-900 font-normal text-base whitespace-nowrap">
                              {vendor.phone}
                            </span>
                          )}
                          {colKey === "email" && (
                            <span className="text-gray-900 font-normal text-base">
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
                            <span className="text-gray-900 font-normal text-base">
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
                className="flex items-center rounded-full border bg-white"
                style={{
                  borderColor: "rgb(218, 218, 218)",
                  borderWidth: "0.909091px",
                  boxShadow:
                    "rgba(0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.03) 0px 1px 3px 0px",
                  padding: "8px 16px",
                  gap: "16px",
                }}
              >
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  className={cn(
                    "flex items-center justify-center gap-1.5 text-sm font-medium transition-colors",
                    currentPage === 1
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:opacity-70",
                  )}
                  style={{
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
                <span className={cn(
                  "text-sm",
                  currentPage === 1 || currentPage === totalPages ? "font-bold text-gray-900" : "font-bold text-gray-900"
                )}>
                  {currentPage}
                </span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  className={cn(
                    "flex items-center justify-center gap-1.5 text-sm font-medium transition-colors",
                    currentPage === totalPages
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:opacity-70",
                  )}
                  style={{
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

      {showColumnModal &&
        createPortal(
          <div
            className="bg-white flex flex-col justify-center items-start gap-1 p-2"
            style={{
              width: "260px",
              border: "0.5px solid #DADADA",
              borderRadius: "8px",
              boxShadow:
                "0 38px 11px 0 rgba(0, 0, 0, 0.00), 0 24px 10px 0 rgba(0, 0, 0, 0.01), 0 14px 8px 0 rgba(0, 0, 0, 0.04), 0 6px 6px 0 rgba(0, 0, 0, 0.06), 0 2px 3px 0 rgba(0, 0, 0, 0.07)",
              zIndex: 99999,
              position: "fixed",
              top: columnMenuPos.top + "px",
              left: columnMenuPos.left + "px",
              pointerEvents: "auto",
            }}
            onMouseLeave={() => setShowColumnModal(false)}
          >
            {allAvailableColumns.map((colKey) => (
              <label
                key={colKey}
                className="flex items-center justify-between gap-3 w-full px-3 py-2 hover:bg-gray-50 rounded cursor-pointer transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={visibleColumns.has(colKey)}
                    onChange={() => toggleColumnVisibility(colKey)}
                    className="w-4 h-4 rounded cursor-pointer"
                    style={{
                      accentColor: "#013764",
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span
                    className="text-[#303030] font-normal text-base leading-[140%] tracking-[-0.32px]"
                    style={{
                      fontFamily:
                        "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                    }}
                  >
                    {columnConfig[colKey]?.label}
                  </span>
                </div>
                {columnConfig[colKey]?.icon}
              </label>
            ))}
          </div>,
          document.body,
        )}
    </div>
  );
}
