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
  const { handleSortClick, getSortIndicator, getSortedData } = useSortingTable(mockVendors);
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

  const totalVendors = mockVendors.length;
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

  // Column configuration
  const columnConfig: Record<string, { label: string; icon: React.ReactNode }> = {
    name: {
      label: "Name",
      icon: (
        <svg
          width="14"
          height="16"
          viewBox="0 0 14 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M6.67023 6.61C8.28843 6.61 9.60023 5.29819 9.60023 3.68C9.60023 2.06181 8.28843 0.75 6.67023 0.75C5.05204 0.75 3.74023 2.06181 3.74023 3.68C3.74023 5.29819 5.05204 6.61 6.67023 6.61Z"
            stroke="#525252"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M0.75 14.7501V13.0801C0.75 11.1301 2.33 9.56006 4.27 9.56006H9.54C11.49 9.56006 13.06 11.1401 13.06 13.0801V14.7501"
            stroke="#525252"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    phone: {
      label: "Phone",
      icon: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g clipPath="url(#clip0_11215_5081)">
            <path
              d="M11.7074 4.99984C12.5213 5.15864 13.2694 5.55672 13.8558 6.14312C14.4422 6.72952 14.8403 7.47756 14.9991 8.2915M11.7074 1.6665C13.3985 1.85437 14.9754 2.61165 16.1793 3.81401C17.3831 5.01637 18.1424 6.59235 18.3324 8.28317M8.52155 11.5524C7.52023 10.5511 6.72958 9.41888 6.14958 8.21086C6.09969 8.10695 6.07475 8.055 6.05558 7.98926C5.98748 7.75563 6.0364 7.46875 6.17807 7.27089C6.21794 7.21521 6.26557 7.16758 6.36083 7.07232C6.65217 6.78098 6.79784 6.63531 6.89308 6.48883C7.25224 5.93642 7.25224 5.22427 6.89308 4.67186C6.79784 4.52538 6.65217 4.37971 6.36083 4.08837L6.19844 3.92598C5.75557 3.48311 5.53414 3.26168 5.29632 3.14139C4.82335 2.90217 4.2648 2.90217 3.79183 3.14139C3.55401 3.26168 3.33258 3.48311 2.88971 3.92598L2.75835 4.05735C2.31699 4.4987 2.09632 4.71937 1.92778 5.0194C1.74076 5.35232 1.60629 5.8694 1.60743 6.25125C1.60845 6.59537 1.67521 6.83056 1.80871 7.30093C2.52619 9.82876 3.87992 12.2141 5.8699 14.204C7.85988 16.194 10.2452 17.5478 12.773 18.2652C13.2434 18.3987 13.4786 18.4655 13.8227 18.4665C14.2045 18.4677 14.7216 18.3332 15.0545 18.1462C15.3546 17.9776 15.5752 17.7569 16.0166 17.3156L16.148 17.1842C16.5908 16.7414 16.8123 16.5199 16.9325 16.2821C17.1718 15.8091 17.1718 15.2506 16.9325 14.7776C16.8123 14.5398 16.5908 14.3184 16.148 13.8755L15.9856 13.7131C15.6942 13.4218 15.5486 13.2761 15.4021 13.1809C14.8497 12.8217 14.1375 12.8217 13.5851 13.1809C13.4386 13.2761 13.293 13.4218 13.0016 13.7131C12.9064 13.8084 12.8587 13.8561 12.7634 13.9514C12.2111 14.5037 12.2111 15.2159 12.7634 15.7682C12.8587 15.8635 12.9064 15.9112 13.0016 16.0065L13.1641 16.1689C13.607 16.6117 13.8285 16.8333 13.9488 17.0711C14.1881 17.5441 14.1881 18.1026 13.9488 18.5756C13.8285 18.8134 13.607 19.035 13.1641 19.4778L13.0326 19.6093C12.5912 20.0507 12.3706 20.2713 12.0705 20.4399C11.7376 20.627 11.2205 20.7615 10.8387 20.7604C10.4946 20.7594 10.2594 20.6926 9.78905 20.5591C7.26124 19.8417 4.87588 18.4879 2.88603 16.498C0.896179 14.5082 -0.457535 12.1228 -1.17501 9.5949C-1.30851 9.12456 -1.37527 8.88937 -1.37629 8.54525C-1.37743 8.16341 -1.5119 7.64633 -1.32488 7.31341C-1.15635 7.03188 -0.934673 6.81121 -0.493372 6.36991L-0.361931 6.23855C0.0809598 5.79768 0.302529 5.57625 0.5203 5.3585C0.93484 4.94397 1.49335 4.94397 1.90789 5.3585C2.12567 5.57625 2.34716 5.79768 2.79003 6.24055L2.95243 6.40294C3.10721 6.55772 3.25288 6.70339 3.39935 6.79863C3.95176 7.15779 4.66391 7.15779 5.21632 6.79863C5.36279 6.70339 5.50846 6.55772 5.66324 6.40294L5.82563 6.24055C6.26849 5.79768 6.48992 5.57625 6.7077 5.3585C7.12224 4.94397 7.68075 4.94397 8.09529 5.3585C8.31307 5.57625 8.5345 5.79768 8.97736 6.24055L9.13975 6.40294C9.29453 6.55772 9.44019 6.70339 9.58666 6.79863C10.1391 7.15779 10.8512 7.15779 11.4037 6.79863C11.5501 6.70339 11.6958 6.55772 11.8506 6.40294L12.0129 6.24055C12.4558 5.79768 12.6773 5.57625 12.8951 5.3585C13.3096 4.94397 13.8681 4.94397 14.2827 5.3585C14.5004 5.57625 14.7219 5.79768 15.1648 6.24055L15.3272 6.40294C15.482 6.55772 15.6276 6.70339 15.7741 6.79863C16.3265 7.15779 17.0387 7.15779 17.5911 6.79863C17.7376 6.70339 17.8832 6.55772 18.038 6.40294L18.2004 6.24055C18.6432 5.79768 18.8647 5.57625 19.0825 5.3585C19.497 4.94397 20.0555 4.94397 20.4701 5.3585C20.6878 5.57625 20.9093 5.79768 21.3522 6.24055L21.5146 6.40294"
              stroke="#525252"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
          <defs>
            <clipPath id="clip0_11215_5081">
              <rect width="20" height="20" fill="white" />
            </clipPath>
          </defs>
        </svg>
      ),
    },
    email: {
      label: "Email",
      icon: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M11.4527 2.19455L17.726 6.27222C17.9477 6.41631 18.0585 6.48835 18.1388 6.58445C18.2099 6.66952 18.2633 6.76791 18.2959 6.87387C18.3327 6.99357 18.3327 7.12577 18.3327 7.39015V13.4999C18.3327 14.9 18.3327 15.6001 18.0602 16.1349C17.8205 16.6053 17.4381 16.9877 16.9677 17.2274C16.4329 17.4999 15.7328 17.4999 14.3327 17.4999H5.66602C4.26588 17.4999 3.56582 17.4999 3.03104 17.2274C2.56063 16.9877 2.17818 16.6053 1.9385 16.1349C1.66602 15.6001 1.66602 14.9 1.66602 13.4999V7.39015C1.66602 7.12577 1.66602 6.99357 1.70282 6.87387C1.73541 6.76791 1.7888 6.66952 1.85989 6.58445C1.94019 6.48835 2.05103 6.41631 2.2727 6.27222L8.54605 2.19455M11.4527 2.19455C10.9266 1.85262 10.6636 1.68166 10.3802 1.61514C10.1297 1.55635 9.86899 1.55635 9.61849 1.61514C9.3351 1.68166 9.07208 1.85262 8.54605 2.19455M11.4527 2.19455L16.6128 5.54864C17.186 5.92123 17.4726 6.10752 17.5719 6.34377C17.6586 6.55023 17.6586 6.78291 17.5719 6.98937C17.4726 7.22562 17.186 7.41191 16.6128 7.78449L11.4527 11.1386C10.9266 11.4805 10.6636 11.6515 10.3802 11.718C10.1297 11.7768 9.86899 11.7768 9.61849 11.718C9.3351 11.6515 9.07208 11.4805 8.54605 11.1386L3.3859 7.78449C2.81269 7.41191 2.52609 7.22562 2.42683 6.98937C2.34008 6.78291 2.34008 6.55023 2.42683 6.34377C2.52609 6.10752 2.81269 5.92123 3.3859 5.54864L8.54605 2.19455M17.916 15.8332L12.3803 10.8332M7.61837 10.8332L2.08268 15.8332"
            stroke="#525252"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    servicesProvided: {
      label: "Services Provided",
      icon: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M2 6H18M2 10H18M2 14H18"
            stroke="#525252"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    notes: {
      label: "Notes",
      icon: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M2.5 4.16667C2.5 3.54624 3.03726 3.04167 3.66667 3.04167H16.3333C16.9627 3.04167 17.5 3.54624 17.5 4.16667V15.8333C17.5 16.4538 16.9627 16.9583 16.3333 16.9583H3.66667C3.03726 16.9583 2.5 16.4538 2.5 15.8333V4.16667Z"
            stroke="#525252"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M5.83301 6.70825H14.1663M5.83301 10H14.1663M5.83301 13.2917H10.833"
            stroke="#525252"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
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
              </div>
            </div>

            {/* Table Content */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 h-12">
                    <th
                      onClick={() => handleSortClick("name")}
                      className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap cursor-pointer hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <svg
                          width="14"
                          height="16"
                          viewBox="0 0 14 16"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M6.67023 6.61C8.28843 6.61 9.60023 5.29819 9.60023 3.68C9.60023 2.06181 8.28843 0.75 6.67023 0.75C5.05204 0.75 3.74023 2.06181 3.74023 3.68C3.74023 5.29819 5.05204 6.61 6.67023 6.61Z"
                            stroke="#525252"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M0.75 14.7501V13.0801C0.75 11.1301 2.33 9.56006 4.27 9.56006H9.54C11.49 9.56006 13.06 11.1401 13.06 13.0801V14.7501"
                            stroke="#525252"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <span className="font-medium text-sm text-gray-700">
                          Name
                        </span>
                        {getSortIndicator("name") && (
                          <span className="text-xs font-bold text-gray-700 ml-1">
                            {getSortIndicator("name")}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSortClick("phone")}
                      className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap cursor-pointer hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 20 20"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <g clipPath="url(#clip0_11215_5081)">
                            <path
                              d="M11.7074 4.99984C12.5213 5.15864 13.2694 5.55672 13.8558 6.14312C14.4422 6.72952 14.8403 7.47756 14.9991 8.2915M11.7074 1.6665C13.3985 1.85437 14.9754 2.61165 16.1793 3.81401C17.3831 5.01637 18.1424 6.59235 18.3324 8.28317M8.52155 11.5524C7.52023 10.5511 6.72958 9.41888 6.14958 8.21086C6.09969 8.10695 6.07475 8.055 6.05558 7.98926C5.98748 7.75563 6.0364 7.46875 6.17807 7.27089C6.21794 7.21521 6.26557 7.16758 6.36083 7.07232C6.65217 6.78098 6.79784 6.63531 6.89308 6.48883C7.25224 5.93642 7.25224 5.22427 6.89308 4.67186C6.79784 4.52538 6.65217 4.37971 6.36083 4.08837L6.19844 3.92598C5.75557 3.48311 5.53414 3.26168 5.29632 3.14139C4.82335 2.90217 4.2648 2.90217 3.79183 3.14139C3.55401 3.26168 3.33258 3.48311 2.88971 3.92598L2.75835 4.05735C2.31699 4.4987 2.09632 4.71937 1.92778 5.0194C1.74076 5.35232 1.60629 5.8694 1.60743 6.25125C1.60845 6.59537 1.67521 6.83056 1.80871 7.30093C2.52619 9.82876 3.87992 12.2141 5.8699 14.204C7.85988 16.194 10.2452 17.5478 12.773 18.2652C13.2434 18.3987 13.4786 18.4655 13.8227 18.4665C14.2045 18.4677 14.7216 18.3332 15.0545 18.1462C15.3546 17.9776 15.5752 17.7569 16.0166 17.3156L16.148 17.1842C16.5908 16.7414 16.8123 16.5199 16.9325 16.2821C17.1718 15.8091 17.1718 15.2506 16.9325 14.7776C16.8123 14.5398 16.5908 14.3184 16.148 13.8755L15.9856 13.7131C15.6942 13.4218 15.5486 13.2761 15.4021 13.1809C14.8497 12.8217 14.1375 12.8217 13.5851 13.1809C13.4386 13.2761 13.293 13.4218 13.0016 13.7131C12.9064 13.8084 12.8587 13.856 12.8031 13.8959C12.6052 14.0375 12.3183 14.0865 12.0847 14.0184C12.0189 13.9992 11.967 13.9743 11.8631 13.9244C10.6551 13.3444 9.52286 12.5537 8.52155 11.5524Z"
                              stroke="#525252"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </g>
                          <defs>
                            <clipPath id="clip0_11215_5081">
                              <rect width="20" height="20" fill="white" />
                            </clipPath>
                          </defs>
                        </svg>
                        <span className="font-medium text-sm text-gray-700">
                          Phone
                        </span>
                        {getSortIndicator("phone") && (
                          <span className="text-xs font-bold text-gray-700 ml-1">
                            {getSortIndicator("phone")}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSortClick("email")}
                      className="px-3 py-3 text-left border-r border-gray-200 flex-1 cursor-pointer hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-2">
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 20 20"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M11.4527 2.19455L17.726 6.27222C17.9477 6.41631 18.0585 6.48835 18.1388 6.58445C18.2099 6.66952 18.2633 6.76791 18.2959 6.87387C18.3327 6.99357 18.3327 7.12577 18.3327 7.39015V13.4999C18.3327 14.9 18.3327 15.6001 18.0602 16.1349C17.8205 16.6053 17.4381 16.9877 16.9677 17.2274C16.4329 17.4999 15.7328 17.4999 14.3327 17.4999H5.66602C4.26588 17.4999 3.56582 17.4999 3.03104 17.2274C2.56063 16.9877 2.17818 16.6053 1.9385 16.1349C1.66602 15.6001 1.66602 14.9 1.66602 13.4999V7.39015C1.66602 7.12577 1.66602 6.99357 1.70282 6.87387C1.73541 6.76791 1.7888 6.66952 1.85989 6.58445C1.94019 6.48835 2.05103 6.41631 2.2727 6.27222L8.54605 2.19455M11.4527 2.19455C10.9266 1.85262 10.6636 1.68166 10.3802 1.61514C10.1297 1.55635 9.86899 1.55635 9.61849 1.61514C9.3351 1.68166 9.07208 1.85262 8.54605 2.19455M11.4527 2.19455L16.6128 5.54864C17.186 5.92123 17.4726 6.10752 17.5719 6.34377C17.6586 6.55023 17.6586 6.78291 17.5719 6.98937C17.4726 7.22562 17.186 7.41191 16.6128 7.78449L11.4527 11.1386C10.9266 11.4805 10.6636 11.6515 10.3802 11.718C10.1297 11.7768 9.86899 11.7768 9.61849 11.718C9.3351 11.6515 9.07208 11.4805 8.54605 11.1386L3.3859 7.78449C2.81269 7.41191 2.52609 7.22562 2.42683 6.98937C2.34008 6.78291 2.34008 6.55023 2.42683 6.34377C2.52609 6.10752 2.81269 5.92123 3.3859 5.54864L8.54605 2.19455M17.916 15.8332L12.3803 10.8332M7.61837 10.8332L2.08268 15.8332"
                            stroke="#525252"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <span className="font-medium text-sm text-gray-700">
                          Email
                        </span>
                        {getSortIndicator("email") && (
                          <span className="text-xs font-bold text-gray-700 ml-1">
                            {getSortIndicator("email")}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSortClick("servicesProvided")}
                      className="px-3 py-3 text-left border-r border-gray-200 flex-1 cursor-pointer hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 20 20"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M2 6H18M2 10H18M2 14H18"
                            stroke="#525252"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <span className="font-medium text-sm text-gray-700">
                          Services Provided
                        </span>
                        {getSortIndicator("servicesProvided") && (
                          <span className="text-xs font-bold text-gray-700 ml-1">
                            {getSortIndicator("servicesProvided")}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSortClick("notes")}
                      className="px-3 py-3 text-left border-r border-gray-200 flex-1 cursor-pointer hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 20 20"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M2.5 4.16667C2.5 3.54624 3.03726 3.04167 3.66667 3.04167H16.3333C16.9627 3.04167 17.5 3.54624 17.5 4.16667V15.8333C17.5 16.4538 16.9627 16.9583 16.3333 16.9583H3.66667C3.03726 16.9583 2.5 16.4538 2.5 15.8333V4.16667Z"
                            stroke="#525252"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M5.83301 6.70825H14.1663M5.83301 10H14.1663M5.83301 13.2917H10.833"
                            stroke="#525252"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <span className="font-medium text-sm text-gray-700">
                          Notes
                        </span>
                        {getSortIndicator("notes") && (
                          <span className="text-xs font-bold text-gray-700 ml-1">
                            {getSortIndicator("notes")}
                          </span>
                        )}
                      </div>
                    </th>
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
                      <td className="px-3 py-3 border-r border-gray-200 whitespace-nowrap">
                        <span className="text-gray-900 font-normal text-base">
                          {vendor.name}
                        </span>
                      </td>
                      <td className="px-3 py-3 border-r border-gray-200 whitespace-nowrap">
                        <span className="text-gray-900 font-normal text-base">
                          {vendor.phone}
                        </span>
                      </td>
                      <td className="px-3 py-3 border-r border-gray-200">
                        <span className="text-gray-900 font-normal text-base">
                          {vendor.email}
                        </span>
                      </td>
                      <td className="px-3 py-3 border-r border-gray-200">
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
                      </td>
                      <td className="px-3 py-3 border-r border-gray-200">
                        <span className="text-gray-900 font-normal text-base">
                          {vendor.notes}
                        </span>
                      </td>
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
                  of {mockVendors.length}
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
                  onClick={() => setCurrentPage(currentPage + 1)}
                  className={cn(
                    "flex items-center justify-center gap-1.5 h-10 px-3 transition-colors hover:bg-gray-50",
                  )}
                >
                  <div className="font-medium text-sm text-gray-700">Next</div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
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
      </div>

      {/* Add Vendor Modal */}
      <AddVendorModal
        open={isAddVendorModalOpen}
        onOpenChange={setIsAddVendorModalOpen}
      />
    </div>
  );
}
