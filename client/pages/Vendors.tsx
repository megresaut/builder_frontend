import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { Search, Plus, ChevronDown } from "lucide-react";
import { usePageState } from "@/hooks/usePageState";
import FileUploadModal from "@/components/FileUploadModal";

interface Vendor {
  id: number;
  name: string;
  phone: string;
  email: string;
  insuranceProvider: string;
  expires: string;
  w9: string | null;
  insurance: string | null;
}

const mockVendors: Vendor[] = [
  {
    id: 1,
    name: "David Smith",
    phone: "724.705.2990",
    email: "mattgzyb21@gmail.com",
    insuranceProvider: "Hiscox",
    expires: "Oct 2, 2025",
    w9: "View",
    insurance: "View",
  },
  {
    id: 2,
    name: "David Smith",
    phone: "724.705.2990",
    email: "mattgzyb21@gmail.com",
    insuranceProvider: "Hiscox",
    expires: "Sep 29, 2025",
    w9: null,
    insurance: "View",
  },
  {
    id: 3,
    name: "David Smith",
    phone: "724.705.2990",
    email: "mattgzyb21@gmail.com",
    insuranceProvider: "hiscox",
    expires: "Sep 10, 2025",
    w9: "View",
    insurance: "View",
  },
  {
    id: 4,
    name: "David Smith",
    phone: "724.705.2990",
    email: "mattgzyb21@gmail.com",
    insuranceProvider: "Hiscox",
    expires: "Sep 6, 2025",
    w9: null,
    insurance: "View",
  },
  {
    id: 5,
    name: "David Smith",
    phone: "724.705.2990",
    email: "mattgzyb21@gmail.com",
    insuranceProvider: "Hiscox",
    expires: "Sep 5, 2025",
    w9: null,
    insurance: "View",
  },
  {
    id: 6,
    name: "David Smith",
    phone: "724.705.2990",
    email: "mattgzyb21@gmail.com",
    insuranceProvider: "Hiscox",
    expires: "Sep 4, 2025",
    w9: "View",
    insurance: "View",
  },
  {
    id: 7,
    name: "David Smith",
    phone: "724.705.2990",
    email: "mattgzyb21@gmail.com",
    insuranceProvider: "Hiscox",
    expires: "Sep 4, 2025",
    w9: "View",
    insurance: "View",
  },
  {
    id: 8,
    name: "David Smith",
    phone: "724.705.2990",
    email: "mattgzyb21@gmail.com",
    insuranceProvider: "Hiscox",
    expires: "Sep 3, 2025",
    w9: "View",
    insurance: "View",
  },
  {
    id: 9,
    name: "David Smith",
    phone: "724.705.2990",
    email: "mattgzyb21@gmail.com",
    insuranceProvider: "Hiscox",
    expires: "Sep 1, 2025",
    w9: "View",
    insurance: "View",
  },
  {
    id: 10,
    name: "David Smith",
    phone: "724.705.2990",
    email: "mattgzyb21@gmail.com",
    insuranceProvider: "Hiscox",
    expires: "Sep 1, 2025",
    w9: "View",
    insurance: "View",
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
                console.log("Edit clicked for vendor", vendorId);
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
  const [currentPage, setCurrentPage] = usePageState("currentPage", 1);
  const [itemsPerPage, setItemsPerPage] = usePageState("itemsPerPage", 50);
  const [showPageSizeDropdown, setShowPageSizeDropdown] = usePageState(
    "showPageSizeDropdown",
    false,
  );
  const [openMenuId, setOpenMenuId] = usePageState<number | null>("openMenuId", null);
  const [isFileUploadModalOpen, setIsFileUploadModalOpen] = useState(false);
  const [uploadDocumentType, setUploadDocumentType] = useState<"w9" | "insurance">("w9");
  const dropdownButtonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });

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

  const totalPages = Math.ceil(mockVendors.length / itemsPerPage);

  const getPaginationNumbers = () => {
    const pages: (number | string)[] = [];

    if (totalPages <= 1) {
      return [1];
    }

    if (totalPages <= 6) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
      return pages;
    }

    const leftStart = currentPage;
    const leftEnd = Math.min(currentPage + 2, totalPages);

    const rightStart = Math.max(leftEnd + 5, totalPages - 2);
    const rightEnd = totalPages;

    for (let i = leftStart; i <= leftEnd; i++) {
      pages.push(i);
    }

    if (rightStart > leftEnd + 1) {
      pages.push("...");
    }

    for (let i = rightStart; i <= rightEnd; i++) {
      pages.push(i);
    }

    return pages;
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
              onClick={() => console.log("Add vendor clicked")}
              className="flex h-9 items-center gap-2 px-3 rounded-lg bg-[#013764] shadow-[0_0_0_1px_#002D5A] hover:bg-[#003a73] transition-colors"
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
                    <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
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
                      </div>
                    </th>
                    <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
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
                      </div>
                    </th>
                    <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
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
                      </div>
                    </th>
                    <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <g clipPath="url(#clip0_11178_3189)">
                            <path
                              d="M5.33399 5.33325H5.34065M1.33398 3.46658L1.33398 6.44959C1.33398 6.77572 1.33398 6.93878 1.37082 7.09223C1.40349 7.22827 1.45736 7.35833 1.53046 7.47763C1.61292 7.61219 1.72822 7.72749 1.95882 7.95809L7.07124 13.0705C7.86328 13.8625 8.25929 14.2586 8.71595 14.4069C9.11764 14.5375 9.55033 14.5375 9.95202 14.4069C10.4087 14.2586 10.8047 13.8625 11.5967 13.0705L13.0712 11.596C13.8633 10.804 14.2593 10.4079 14.4077 9.95128C14.5382 9.5496 14.5382 9.1169 14.4077 8.71522C14.2593 8.25856 13.8633 7.86254 13.0712 7.07051L7.95882 1.95809C7.72822 1.72749 7.61292 1.61219 7.47836 1.52973C7.35907 1.45663 7.22901 1.40275 7.09296 1.37009C6.93951 1.33325 6.77645 1.33325 6.45033 1.33325L3.46732 1.33325C2.72058 1.33325 2.34721 1.33325 2.062 1.47858C1.81111 1.60641 1.60714 1.81038 1.47931 2.06126C1.33398 2.34648 1.33398 2.71985 1.33398 3.46658ZM5.66732 5.33325C5.66732 5.51735 5.51808 5.66658 5.33399 5.66658C5.14989 5.66658 5.00065 5.51735 5.00065 5.33325C5.00065 5.14916 5.14989 4.99992 5.33399 4.99992C5.51808 4.99992 5.66732 5.14916 5.66732 5.33325Z"
                              stroke="#525252"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </g>
                          <defs>
                            <clipPath id="clip0_11178_3189">
                              <rect width="16" height="16" fill="white" />
                            </clipPath>
                          </defs>
                        </svg>
                        <span className="font-medium text-sm text-gray-700">
                          Insurance Provider
                        </span>
                      </div>
                    </th>
                    <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M14 6.66658H2M10.6667 1.33325V3.99992M5.33333 1.33325V3.99992M5.2 14.6666H10.8C11.9201 14.6666 12.4802 14.6666 12.908 14.4486C13.2843 14.2569 13.5903 13.9509 13.782 13.5746C14 13.1467 14 12.5867 14 11.4666V5.86659C14 4.74648 14 4.18643 13.782 3.7586C13.5903 3.38228 13.2843 3.07632 12.908 2.88457C12.4802 2.66659 11.9201 2.66659 10.8 2.66659H5.2C4.0799 2.66659 3.51984 2.66659 3.09202 2.88457C2.71569 3.07632 2.40973 3.38228 2.21799 3.7586C2 4.18643 2 4.74648 2 5.86658V11.4666C2 12.5867 2 13.1467 2.21799 13.5746C2.40973 13.9509 2.71569 14.2569 3.09202 14.4486C3.51984 14.6666 4.0799 14.6666 5.2 14.6666Z"
                            stroke="#525252"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <span className="font-medium text-sm text-gray-700">
                          Expires
                        </span>
                      </div>
                    </th>
                    <th className="px-3 py-3 text-left border-r border-gray-200 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <g clipPath="url(#clip0_11214_4992)">
                            <path
                              d="M14.2929 7.36678L8.16621 13.4934C7.41565 14.244 6.39767 14.6657 5.33621 14.6657C4.27475 14.6657 3.25677 14.244 2.50621 13.4934C1.75565 12.7429 1.33398 11.7249 1.33398 10.6634C1.33398 9.60199 1.75565 8.58401 2.50621 7.83344L8.63288 1.70678C9.13325 1.2064 9.81191 0.925293 10.5195 0.925293C11.2272 0.925293 11.9058 1.2064 12.4062 1.70678C12.9066 2.20715 13.1877 2.88581 13.1877 3.59344C13.1877 4.30108 12.9066 4.97973 12.4062 5.48011L6.27288 11.6068C6.02269 11.857 5.68336 11.9975 5.32954 11.9975C4.97572 11.9975 4.6364 11.857 4.38621 11.6068C4.13602 11.3566 3.99547 11.0173 3.99547 10.6634C3.99547 10.3096 4.13602 9.9703 4.38621 9.72011L10.0462 4.06678"
                              stroke="#525252"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </g>
                          <defs>
                            <clipPath id="clip0_11214_4992">
                              <rect width="16" height="16" fill="white" />
                            </clipPath>
                          </defs>
                        </svg>
                        <span className="font-medium text-sm text-gray-700">
                          W9
                        </span>
                      </div>
                    </th>
                    <th
                      className="px-3 py-3 text-left whitespace-nowrap"
                      style={{
                        borderBottomWidth: "1px",
                        borderColor:
                          "rgba(0, 0, 0, 0) rgb(231, 232, 236) rgb(231, 232, 236) rgba(0, 0, 0, 0)",
                        borderRightWidth: "1px",
                        borderTopWidth: "1px",
                        borderWidth: "1px 1px 1px 0px",
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <g clipPath="url(#clip0_11214_4995)">
                            <path
                              d="M14.2929 7.36678L8.16621 13.4934C7.41565 14.244 6.39767 14.6657 5.33621 14.6657C4.27475 14.6657 3.25677 14.244 2.50621 13.4934C1.75565 12.7429 1.33398 11.7249 1.33398 10.6634C1.33398 9.60199 1.75565 8.58401 2.50621 7.83344L8.63288 1.70678C9.13325 1.2064 9.81191 0.925293 10.5195 0.925293C11.2272 0.925293 11.9058 1.2064 12.4062 1.70678C12.9066 2.20715 13.1877 2.88581 13.1877 3.59344C13.1877 4.30108 12.9066 4.97973 12.4062 5.48011L6.27288 11.6068C6.02269 11.857 5.68336 11.9975 5.32954 11.9975C4.97572 11.9975 4.6364 11.857 4.38621 11.6068C4.13602 11.3566 3.99547 11.0173 3.99547 10.6634C3.99547 10.3096 4.13602 9.9703 4.38621 9.72011L10.0462 4.06678"
                              stroke="#525252"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </g>
                          <defs>
                            <clipPath id="clip0_11214_4995">
                              <rect width="16" height="16" fill="white" />
                            </clipPath>
                          </defs>
                        </svg>
                        <span className="font-medium text-sm text-gray-700">
                          Insurance
                        </span>
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
                  {mockVendors.map((vendor) => (
                    <tr
                      key={vendor.id}
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
                      <td className="px-3 py-3 border-r border-gray-200 whitespace-nowrap">
                        <span className="text-gray-900 font-normal text-base">
                          {vendor.email}
                        </span>
                      </td>
                      <td className="px-3 py-3 border-r border-gray-200 whitespace-nowrap">
                        <span className="text-gray-900 font-normal text-base">
                          {vendor.insuranceProvider}
                        </span>
                      </td>
                      <td className="px-3 py-3 border-r border-gray-200 whitespace-nowrap">
                        <span className="text-gray-900 font-normal text-base">
                          {vendor.expires}
                        </span>
                      </td>
                      <td className="px-3 py-3 border-r border-gray-200 whitespace-nowrap">
                        {vendor.w9 ? (
                          <span
                            onClick={() => {
                              setUploadDocumentType("w9");
                              setIsFileUploadModalOpen(true);
                            }}
                            className="text-blue-600 font-normal text-base hover:underline cursor-pointer"
                          >
                            {vendor.w9}
                          </span>
                        ) : (
                          <span
                            onClick={() => {
                              setUploadDocumentType("w9");
                              setIsFileUploadModalOpen(true);
                            }}
                            className="text-gray-400 font-normal text-base underline cursor-pointer hover:text-gray-600"
                          >
                            Add
                          </span>
                        )}
                      </td>
                      <td
                        className="px-3 py-3 whitespace-nowrap"
                        style={{
                          borderRightWidth: "1px",
                          border: "1px solid #e7e8ec",
                        }}
                      >
                        {vendor.insurance ? (
                          <span
                            onClick={() => {
                              setUploadDocumentType("insurance");
                              setIsFileUploadModalOpen(true);
                            }}
                            className="text-blue-600 font-normal text-base hover:underline cursor-pointer"
                          >
                            {vendor.insurance}
                          </span>
                        ) : (
                          <span
                            onClick={() => {
                              setUploadDocumentType("insurance");
                              setIsFileUploadModalOpen(true);
                            }}
                            className="text-gray-400 font-normal text-base underline cursor-pointer hover:text-gray-600"
                          >
                            Add
                          </span>
                        )}
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

      {/* File Upload Modal */}
      <FileUploadModal
        open={isFileUploadModalOpen}
        onOpenChange={setIsFileUploadModalOpen}
        title={uploadDocumentType === "w9" ? "Upload W9 Document" : "Upload Insurance Document"}
      />
    </div>
  );
}
