import { useState } from "react";
import { cn } from "@/lib/utils";

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
    vendor: "Aqua Solutions",
    vendorColor: "#EBA524",
    property: "22 Indian Chase Dr",
    statementDate: "Oct 1, 2025",
    dueDate: "Dec 6, 2025",
    status: "pushed",
    memo: "Pilot Light Out, Schedule Safety Inspection",
    invoiceNumber: "REF-2024-268",
  },
  {
    id: 6,
    vendor: "Green Lawn Services",
    vendorColor: "#059669",
    property: "22 Indian Chase Dr",
    statementDate: "Sep 30, 2025",
    dueDate: "Dec 4, 2025",
    status: "pushed",
    memo: "Outage Reported, Check Breaker And Connections",
    invoiceNumber: "REF-2024-694",
  },
  {
    id: 7,
    vendor: "Handyman Pros",
    vendorColor: "#EBA524",
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

const StatusBadge = ({ status }: { status: "pushed" | "push-failed" }) => (
  <div
    className={cn(
      "flex items-center gap-2 px-2.5 py-1.5 rounded-full",
      status === "pushed"
        ? "bg-green-50 text-green-700"
        : "bg-orange-50 text-orange-700",
    )}
  >
    {status === "pushed" ? (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21.801 10A10 10 0 1 1 17 3.335" />
        <path d="m9 11 3 3L22 4" />
      </svg>
    ) : (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" x2="12" y1="8" y2="12" />
        <line x1="12" x2="12.01" y1="16" y2="16" />
      </svg>
    )}
    <span className="text-sm font-medium capitalize">
      {status === "pushed" ? "Pushed" : "Push Failed"}
    </span>
  </div>
);

const VendorAvatar = ({ name, color }: { name: string; color: string }) => (
  <div
    className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-white text-sm font-semibold"
    style={{ backgroundColor: color }}
  >
    {name.charAt(0).toUpperCase()}
  </div>
);

export default function Bills() {
  const [selectedTab, setSelectedTab] = useState<"approved" | "drafts">(
    "approved",
  );

  const approvedBills = bills.filter((_, idx) => idx % 2 === 0);

  return (
    <div className="min-h-screen bg-white p-4 md:p-6 lg:p-8 xl:p-12">
      <div className="max-w-[1200px] mx-auto flex flex-col gap-9">
        {/* Header Section */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex flex-col gap-1">
              <h1 className="text-gray-900 font-semibold text-2xl leading-[30px]">
                All Bills
              </h1>
              <p className="text-gray-600 font-medium text-base leading-4">
                Track and manage all vendor bills
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button className="flex h-10 items-center gap-2 px-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
                <span className="font-medium text-base">Add Vendor</span>
              </button>
              <button className="flex h-10 items-center gap-2 px-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors">
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
                  <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                  <path d="M21 3v5h-5" />
                  <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                  <path d="M8 16H3v5" />
                </svg>
                <span className="font-medium text-base">Sync</span>
              </button>
              <button className="flex h-10 items-center gap-2 px-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect width="20" height="14" x="2" y="5" rx="2" />
                  <line x1="2" x2="22" y1="10" y2="10" />
                </svg>
                <span className="font-medium text-base">Record Bill</span>
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-6 border-b border-gray-200">
            <button
              onClick={() => setSelectedTab("approved")}
              className={cn(
                "px-1 py-3 border-b-2 transition-colors flex flex-col items-start",
                selectedTab === "approved"
                  ? "border-blue-600"
                  : "border-transparent hover:text-gray-900",
              )}
            >
              <span
                className={cn(
                  "font-medium text-base",
                  selectedTab === "approved"
                    ? "text-blue-600"
                    : "text-gray-600",
                )}
              >
                Approved
              </span>
              {selectedTab === "approved" && (
                <span className="text-xs text-gray-500 font-normal">
                  Last Approved 2 minutes ago
                </span>
              )}
            </button>
            <button
              onClick={() => setSelectedTab("drafts")}
              className={cn(
                "px-1 py-3 border-b-2 transition-colors flex flex-col items-start",
                selectedTab === "drafts"
                  ? "border-blue-600"
                  : "border-transparent hover:text-gray-900",
              )}
            >
              <span
                className={cn(
                  "font-medium text-base",
                  selectedTab === "drafts"
                    ? "text-blue-600"
                    : "text-gray-600",
                )}
              >
                Drafts
              </span>
            </button>
          </div>

          {/* Bills Table */}
          <div className="flex flex-col">
            <div className="w-full overflow-hidden rounded-xl border border-gray-200 shadow-sm">
              {/* Table Header */}
              <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 bg-white">
                <h2 className="text-gray-900 font-medium text-lg">Approved</h2>
                <div className="flex items-center gap-3">
                  <button className="flex h-9 items-center gap-2 px-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors">
                    <span className="text-gray-700 font-normal text-sm">
                      Filter
                    </span>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 18 18"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M4.5 6.75L9 11.25L13.5 6.75" />
                    </svg>
                  </button>
                  <div className="flex h-9 items-center gap-2 px-3 rounded-lg border border-gray-200 bg-white">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 20 20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M17.5 17.5L13.875 13.875M15.8333 9.16667C15.8333 12.8486 12.8486 15.8333 9.16667 15.8333C5.48477 15.8333 2.5 12.8486 2.5 9.16667C2.5 5.48477 5.48477 2.5 9.16667 2.5C12.8486 2.5 15.8333 5.48477 15.8333 9.16667Z" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Search..."
                      className="text-gray-700 font-normal text-sm bg-transparent border-none outline-none placeholder:text-gray-500 w-32 sm:w-40"
                    />
                  </div>
                </div>
              </div>

              {/* Table Content */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-white">
                      <th className="px-6 py-4 text-left">
                        <div className="flex items-center gap-2 text-gray-700 font-medium text-sm">
                          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M12.5 17.5C12.5 18.3284 11.8284 19 11 19C10.1716 19 9.5 18.3284 9.5 17.5M16.5 7.5C16.5 9.98528 14.4853 12 12 12C9.51472 12 7.5 9.98528 7.5 7.5C7.5 5.01472 9.51472 3 12 3C14.4853 3 16.5 5.01472 16.5 7.5Z" />
                          </svg>
                          Vendor
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left">
                        <div className="flex items-center gap-2 text-gray-700 font-medium text-sm">
                          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M6 6.5V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2.5M4 14h12a2 2 0 0 1 2 2v2a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-2a2 2 0 0 1 2-2Z" />
                          </svg>
                          Property
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left">
                        <div className="flex items-center gap-2 text-gray-700 font-medium text-sm">
                          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M14 3H6a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1ZM11 1v4M6 1v4" />
                          </svg>
                          Statement Date
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left">
                        <div className="flex items-center gap-2 text-gray-700 font-medium text-sm">
                          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M14 3H6a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1ZM11 1v4M6 1v4" />
                          </svg>
                          Due Date
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left">
                        <div className="flex items-center gap-2 text-gray-700 font-medium text-sm">
                          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M10.5 10a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0Z" />
                          </svg>
                          Status
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left">
                        <div className="flex items-center gap-2 text-gray-700 font-medium text-sm">
                          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M2 4h16M2 8h16M2 12h16M2 16h16" />
                          </svg>
                          Memo
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left">
                        <div className="flex items-center gap-2 text-gray-700 font-medium text-sm">
                          Actions
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {approvedBills.map((bill, index) => (
                      <tr
                        key={bill.id}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <VendorAvatar name={bill.vendor} color={bill.vendorColor} />
                            <span className="text-gray-900 font-medium text-sm">
                              {bill.vendor}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-700 text-sm">
                            {bill.property}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-700 text-sm">
                            {bill.statementDate}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-700 text-sm">
                            {bill.dueDate}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={bill.status} />
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-700 text-sm truncate max-w-xs block">
                            {bill.memo}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button className="text-gray-600 hover:text-gray-900 transition-colors p-1">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                              <circle cx="10" cy="5" r="1.5" />
                              <circle cx="10" cy="10" r="1.5" />
                              <circle cx="10" cy="15" r="1.5" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Footer */}
              <div className="flex justify-between items-center px-6 py-4 border-t border-gray-200 bg-white">
                <div className="flex items-center gap-2">
                  <span className="text-gray-700 text-sm font-medium">Showing</span>
                  <select className="h-8 px-2 border border-gray-200 rounded text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option>10</option>
                    <option>25</option>
                    <option>50</option>
                  </select>
                  <span className="text-gray-700 text-sm">Of 225</span>
                </div>
                <div className="flex items-center gap-2">
                  <button className="text-gray-600 hover:text-gray-900 text-sm font-medium">← Previous</button>
                  <button className="w-8 h-8 flex items-center justify-center rounded text-gray-900 font-medium hover:bg-gray-100">1</button>
                  <button className="w-8 h-8 flex items-center justify-center rounded text-gray-600 hover:bg-gray-100 text-sm">2</button>
                  <button className="w-8 h-8 flex items-center justify-center rounded text-gray-600 hover:bg-gray-100 text-sm">3</button>
                  <span className="text-gray-600">-</span>
                  <button className="w-8 h-8 flex items-center justify-center rounded text-gray-600 hover:bg-gray-100 text-sm">8</button>
                  <button className="w-8 h-8 flex items-center justify-center rounded text-gray-600 hover:bg-gray-100 text-sm">9</button>
                  <button className="w-8 h-8 flex items-center justify-center rounded text-gray-600 hover:bg-gray-100 text-sm">10</button>
                  <button className="text-gray-600 hover:text-gray-900 text-sm font-medium">Next →</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
