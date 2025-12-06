import { useState } from "react";
import { cn } from "@/lib/utils";
import { StatusBadge } from "./Utilities";

interface Bill {
  id: number;
  vendor: string;
  vendorColor: string;
  property: string;
  statementDate: string;
  dueDate: string;
  status: "pushed" | "push-failed";
  memo: string;
  invoiceNumber: string;
}

const bills: Bill[] = [
  {
    id: 1,
    vendor: "Elite HVAC",
    vendorColor: "#BC423E",
    property: "22 Indian Chase Dr",
    statementDate: "Oct 4, 2025",
    dueDate: "Dec 14, 2025",
    status: "pushed",
    memo: "Heater Not Working, Call For Service",
    invoiceNumber: "REF-2024-934",
  },
  {
    id: 2,
    vendor: "ABC Plumbing",
    vendorColor: "#EBA524",
    property: "22 Indian Chase Dr",
    statementDate: "Oct 3, 2025",
    dueDate: "Dec 12, 2025",
    status: "push-failed",
    memo: "Leaky Faucet, Plumber Scheduled For Tomorrow",
    invoiceNumber: "REF-2024-582",
  },
  {
    id: 3,
    vendor: "Elite HVAC",
    vendorColor: "#2463EB",
    property: "22 Indian Chase Dr",
    statementDate: "Oct 2, 2025",
    dueDate: "Dec 10, 2025",
    status: "pushed",
    memo: "High Bill, Check For Leaks And Wastage",
    invoiceNumber: "REF-2024-195",
  },
  {
    id: 4,
    vendor: "Elite HVAC",
    vendorColor: "#2463EB",
    property: "22 Indian Chase Dr",
    statementDate: "Oct 1, 2025",
    dueDate: "Dec 8, 2025",
    status: "push-failed",
    memo: "Slow Connection, Contact ISP For Assistance",
    invoiceNumber: "REF-2024-732",
  },
  {
    id: 5,
    vendor: "Elite HVAC",
    vendorColor: "#2463EB",
    property: "22 Indian Chase Dr",
    statementDate: "Oct 1, 2025",
    dueDate: "Dec 6, 2025",
    status: "pushed",
    memo: "Pilot Light Out, Schedule Safety Inspection",
    invoiceNumber: "REF-2024-268",
  },
  {
    id: 6,
    vendor: "Aqua Solutions",
    vendorColor: "#EBA524",
    property: "22 Indian Chase Dr",
    statementDate: "Sep 30, 2025",
    dueDate: "Dec 4, 2025",
    status: "pushed",
    memo: "Outage Reported, Check Breaker And Connections",
    invoiceNumber: "REF-2024-694",
  },
  {
    id: 7,
    vendor: "Green Lawn Services",
    vendorColor: "#059669",
    property: "22 Indian Chase Dr",
    statementDate: "Sep 29, 2025",
    dueDate: "Dec 2, 2025",
    status: "push-failed",
    memo: "Clogged Drain, Use Drain Cleaner Carefully",
    invoiceNumber: "REF-2024-319",
  },
  {
    id: 8,
    vendor: "Spark Electrical",
    vendorColor: "#2463EB",
    property: "22 Indian Chase Dr",
    statementDate: "Sep 28, 2025",
    dueDate: "Nov 30, 2025",
    status: "pushed",
    memo: "Low Pressure, Check Supply And Aerators",
    invoiceNumber: "REF-2024-851",
  },
  {
    id: 9,
    vendor: "Secure Locksmiths",
    vendorColor: "#059669",
    property: "22 Indian Chase Dr",
    statementDate: "Sep 28, 2025",
    dueDate: "Nov 28, 2025",
    status: "push-failed",
    memo: "Intermittent Issues, Troubleshoot Router And Modem",
    invoiceNumber: "REF-2024-427",
  },
  {
    id: 10,
    vendor: "Clean Sweep Janitorial",
    vendorColor: "#BC423E",
    property: "22 Indian Chase Dr",
    statementDate: "Sep 28, 2025",
    dueDate: "Nov 26, 2025",
    status: "pushed",
    memo: "High Usage, Investigate Appliances And Settings",
    invoiceNumber: "REF-2024-934",
  },
];


const VendorAvatar = ({ name, color }: { name: string; color: string }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill={color}
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const ActionButton = () => (
  <button className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors">
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
);

export default function Bills() {
  const [selectedTab, setSelectedTab] = useState<"approved" | "drafts">(
    "approved",
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [showPageSizeDropdown, setShowPageSizeDropdown] = useState(false);

  const approvedBills = bills.filter((_, idx) => idx % 2 === 0);
  const totalPages = Math.ceil(225 / itemsPerPage);

  // Calculate which page numbers to display
  const getPaginationNumbers = () => {
    const pages: (number | string)[] = [];

    if (totalPages <= 7) {
      // Show all pages if 7 or fewer
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first 3 pages
      pages.push(1, 2, 3);

      // Always show ellipsis
      pages.push("...");

      // Calculate the carousel window around current page
      // Show 3 pages that shift based on current page
      let windowStart: number;
      let windowEnd: number;

      if (currentPage <= 3) {
        // At the beginning, show pages 8-10
        windowStart = 8;
        windowEnd = 10;
      } else if (currentPage >= totalPages - 3) {
        // Near the end, show last 3 pages
        windowStart = totalPages - 2;
        windowEnd = totalPages;
      } else {
        // In the middle, show current page and neighbors
        windowStart = currentPage - 1;
        windowEnd = currentPage + 1;
      }

      // Ensure we don't overlap with the first 3 pages
      windowStart = Math.max(4, windowStart);
      windowEnd = Math.min(totalPages, windowEnd);

      for (let i = windowStart; i <= windowEnd; i++) {
        pages.push(i);
      }
    }

    return pages;
  };

  return (
    <div className="min-h-screen bg-white p-4 md:p-6 lg:p-8">
      <div className="max-w-full mx-auto flex flex-col gap-6">
        {/* Header Section */}
        <div className="flex flex-col gap-6">
          {/* Title and Description */}
          <div className="flex flex-col gap-1">
            <h1 className="text-[#303030] font-semibold text-2xl leading-[30px]">
              All Bills
            </h1>
            <p className="text-[#717179] font-medium text-base leading-4">
              All your bills, in one place
            </p>
          </div>

          {/* Segmented Tabs and Export Button */}
          <div className="flex justify-between items-start">
            <div className="flex w-[382px] items-start rounded-lg shadow-[0_0_0_0.5px_#D2D1CF]">
              <button
                onClick={() => setSelectedTab("drafts")}
                className={cn(
                  "flex justify-center items-center gap-2 flex-1 rounded-md py-2 px-4 transition-colors",
                  selectedTab === "drafts"
                    ? "bg-white"
                    : "bg-transparent hover:bg-gray-50",
                )}
              >
                <span className="text-[#282828] text-center font-normal text-sm leading-5">
                  Drafts
                </span>
              </button>
              <button
                onClick={() => setSelectedTab("approved")}
                className={cn(
                  "flex justify-center items-center gap-2 flex-1 rounded-md py-2 px-4 transition-colors",
                  selectedTab === "approved"
                    ? "bg-white"
                    : "bg-transparent hover:bg-gray-50",
                )}
              >
                <span className="text-[#282828] text-center font-normal text-sm leading-5">
                  Approved
                </span>
              </button>
            </div>
            <button className="flex h-9 items-center gap-2 px-3 rounded-lg border border-white bg-[#002D5A] shadow-[0_0_0_1px_#002D5A,0_0_10px_-5px_rgba(0,0,0,0.20)] hover:bg-[#003a73] transition-colors">
              <span className="text-white font-medium text-base leading-normal">
                Export to Buildium
              </span>
            </button>
          </div>

          {/* Bills Table */}
          <div className="w-full overflow-hidden rounded-lg border border-gray-200 bg-white">
            {/* Table Header */}
            <div className="flex justify-between items-center px-6 py-3 border-b border-gray-200 bg-white">
              <div className="flex items-center gap-4">
                <h2 className="text-[#303030] font-medium text-[22px] leading-6">
                  All Bills
                </h2>
                <div className="flex items-center gap-2 h-6">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M1.16699 8.16667C1.16699 8.16667 1.23776 8.66206 3.28802 10.7123C5.33827 12.7626 8.66238 12.7626 10.7126 10.7123C11.439 9.9859 11.9081 9.09958 12.1198 8.16667M1.16699 8.16667V11.6667M1.16699 8.16667H4.66699M12.8337 5.83333C12.8337 5.83333 12.7629 5.33794 10.7126 3.28769C8.66238 1.23744 5.33827 1.23744 3.28802 3.28769C2.56161 4.0141 2.09256 4.90042 1.88089 5.83333M12.8337 5.83333V2.33333M12.8337 5.83333H9.33366"
                      stroke="#8B8D8D"
                      strokeWidth="1.3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className="text-[#8B8D8D] font-medium text-sm leading-[15px]">
                    Updated 2 minutes ago
                  </span>
                </div>
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
                <button className="flex h-9 justify-center items-center gap-2 px-3 rounded-lg border border-[#DADADA] bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] hover:bg-gray-50 transition-colors">
                  <span className="text-[#303030] font-normal text-base leading-[140%] tracking-[-0.32px] capitalize">
                    Filter
                  </span>
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 18 18"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M4.5 6.75L9 11.25L13.5 6.75"
                      stroke="#303030"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Table Content */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-3 py-3 text-left border-r border-gray-200">
                      <div className="flex items-center gap-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
                          <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
                          <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
                          <path d="M10 6h4" />
                          <path d="M10 10h4" />
                          <path d="M10 14h4" />
                          <path d="M10 18h4" />
                        </svg>
                        <span className="font-medium text-sm text-gray-700">Vendor</span>
                      </div>
                    </th>
                    <th className="px-3 py-3 text-left border-r border-gray-200">
                      <div className="flex items-center gap-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
                          <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
                          <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
                          <path d="M10 6h4" />
                          <path d="M10 10h4" />
                          <path d="M10 14h4" />
                          <path d="M10 18h4" />
                        </svg>
                        <span className="font-medium text-sm text-gray-700">Property</span>
                      </div>
                    </th>
                    <th className="px-3 py-3 text-left border-r border-gray-200">
                      <div className="flex items-center gap-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M8 2v4" />
                          <path d="M16 2v4" />
                          <rect width="18" height="18" x="3" y="4" rx="2" />
                          <path d="M3 10h18" />
                        </svg>
                        <span className="font-medium text-sm text-gray-700">Statement Date</span>
                      </div>
                    </th>
                    <th className="px-3 py-3 text-left border-r border-gray-200">
                      <div className="flex items-center gap-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M8 2v4" />
                          <path d="M16 2v4" />
                          <rect width="18" height="18" x="3" y="4" rx="2" />
                          <path d="M3 10h18" />
                        </svg>
                        <span className="font-medium text-sm text-gray-700">Due Date</span>
                      </div>
                    </th>
                    <th className="px-3 py-3 text-left border-r border-gray-200">
                      <div className="flex items-center gap-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z" />
                          <circle cx="7.5" cy="7.5" r=".5" fill="currentColor" />
                        </svg>
                        <span className="font-medium text-sm text-gray-700">Status</span>
                      </div>
                    </th>
                    <th className="px-3 py-3 text-left border-r border-gray-200">
                      <div className="flex items-center gap-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z" />
                          <circle cx="7.5" cy="7.5" r=".5" fill="currentColor" />
                        </svg>
                        <span className="font-medium text-sm text-gray-700">memo</span>
                      </div>
                    </th>
                    <th className="px-3 py-3 text-left border-r border-gray-200">
                      <div className="flex items-center gap-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="4" x2="20" y1="9" y2="9" />
                          <line x1="4" x2="20" y1="15" y2="15" />
                          <line x1="10" x2="8" y1="3" y2="21" />
                          <line x1="16" x2="14" y1="3" y2="21" />
                        </svg>
                        <span className="font-medium text-sm text-gray-700">Invoice #</span>
                      </div>
                    </th>
                    <th className="sticky right-0 px-3 py-3 text-left bg-white border-l border-gray-200">
                      <span className="font-medium text-sm text-gray-700">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {approvedBills.map((bill) => (
                    <tr
                      key={bill.id}
                      className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-3 py-3 border-r border-gray-200">
                        <div className="flex items-center gap-2">
                          <VendorAvatar name={bill.vendor} color={bill.vendorColor} />
                          <span className="text-gray-900 font-normal text-base">
                            {bill.vendor}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-3 border-r border-gray-200">
                        <span className="text-gray-900 font-normal text-base">
                          {bill.property}
                        </span>
                      </td>
                      <td className="px-3 py-3 border-r border-gray-200">
                        <span className="text-gray-900 font-normal text-base">
                          {bill.statementDate}
                        </span>
                      </td>
                      <td className="px-3 py-3 border-r border-gray-200">
                        <span className="text-gray-900 font-normal text-base">
                          {bill.dueDate}
                        </span>
                      </td>
                      <td className="px-3 py-3 border-r border-gray-200">
                        <StatusBadge status={bill.status} />
                      </td>
                      <td className="px-3 py-3 border-r border-gray-200">
                        <span className="text-gray-900 font-normal text-base truncate max-w-xs block">
                          {bill.memo}
                        </span>
                      </td>
                      <td className="px-3 py-3 border-r border-gray-200">
                        <span className="text-gray-900 font-normal text-base">
                          {bill.invoiceNumber}
                        </span>
                      </td>
                      <td className="sticky right-0 px-3 py-3 bg-white border-l border-gray-200">
                        <ActionButton />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div
              className="flex justify-between items-center px-6 py-4 bg-white gap-4 relative"
              style={{ position: 'relative', zIndex: 1 }}
            >
              <div className="flex items-center gap-2">
                <span className="text-gray-700 text-sm font-medium">Showing</span>
                <div className="relative" style={{ position: 'relative', zIndex: 10 }}>
                  <button
                    onClick={() => setShowPageSizeDropdown(!showPageSizeDropdown)}
                    className="flex items-center justify-center gap-2 h-10 px-3 border rounded-lg bg-white hover:bg-gray-50 transition-colors text-gray-900 font-medium text-sm relative"
                    style={{
                      borderColor: "rgb(218, 218, 218)",
                      borderWidth: "0.909091px",
                      boxShadow: "rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.03) 0px 1px 3px 0px",
                    }}
                  >
                    <div className="text-gray-900 font-medium text-sm">{itemsPerPage}</div>
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
                  {showPageSizeDropdown && (
                    <div
                      className="absolute top-full left-0 mt-2 bg-white rounded-lg overflow-hidden"
                      style={{
                        border: "0.5px solid #DADADA",
                        boxShadow: "0 38px 11px 0 rgba(0, 0, 0, 0.00), 0 24px 10px 0 rgba(0, 0, 0, 0.01), 0 14px 8px 0 rgba(0, 0, 0, 0.04), 0 6px 6px 0 rgba(0, 0, 0, 0.06), 0 2px 3px 0 rgba(0, 0, 0, 0.07)",
                        zIndex: 9999
                      }}
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
                            "w-full px-4 py-3 text-center text-base transition-colors whitespace-nowrap min-w-[80px]",
                            itemsPerPage === size
                              ? "bg-gray-50 font-medium text-gray-900"
                              : "text-[#303030] hover:bg-gray-50"
                          )}
                          style={{
                            fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                            fontSize: "16px",
                            lineHeight: "140%",
                            letterSpacing: "-0.32px"
                          }}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <span className="text-gray-700 text-sm font-medium">of 225</span>
              </div>
              <div
                className="flex items-center rounded-lg border bg-white overflow-hidden"
                style={{
                  borderColor: "rgb(218, 218, 218)",
                  borderWidth: "0.909091px",
                  boxShadow: "rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.03) 0px 1px 3px 0px",
                }}
              >
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  className={cn(
                    "flex items-center justify-center gap-1.5 h-10 px-3 transition-colors",
                    currentPage === 1
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-gray-50"
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
                    stroke={currentPage === 1 ? "rgb(163, 163, 163)" : "currentColor"}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m12 19-7-7 7-7" />
                    <path d="M19 12H5" />
                  </svg>
                  <div className={cn(
                    "font-medium text-sm",
                    currentPage === 1 ? "text-gray-400" : "text-gray-700"
                  )}>
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
                        <div className="text-gray-500 font-medium text-sm">...</div>
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
                          : "hover:bg-gray-50"
                      )}
                      style={{
                        borderRightWidth: "0.909091px",
                        borderRightColor: "rgb(229, 229, 229)",
                        backgroundColor: currentPage === page ? "white" : "rgba(0, 0, 0, 0)",
                      }}
                    >
                      <div className={cn(
                        "font-medium text-sm",
                        currentPage === page ? "text-gray-900 font-bold" : "text-gray-500"
                      )}>
                        {page}
                      </div>
                    </button>
                  );
                })}
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  className={cn(
                    "flex items-center justify-center gap-1.5 h-10 px-3 transition-colors",
                    currentPage === totalPages
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-gray-50"
                  )}
                  style={{
                    backgroundColor: "rgba(0, 0, 0, 0)",
                  }}
                >
                  <div className={cn(
                    "font-medium text-sm",
                    currentPage === totalPages ? "text-gray-400" : "text-gray-700"
                  )}>
                    Next
                  </div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={currentPage === totalPages ? "rgb(163, 163, 163)" : "currentColor"}
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
    </div>
  );
}
