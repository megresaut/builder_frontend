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

const StatusBadge = ({ status }: { status: "pushed" | "push-failed" }) => (
  <div
    className={cn(
      "inline-flex items-center gap-1.5 px-2 py-1 rounded",
      status === "pushed"
        ? "bg-emerald-50 text-emerald-700"
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
    <span className="text-xs font-medium capitalize">
      {status === "pushed" ? "Pushed" : "Push Failed"}
    </span>
  </div>
);

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

  const approvedBills = bills.filter((_, idx) => idx % 2 === 0);

  return (
    <div className="min-h-screen bg-white p-4 md:p-6 lg:p-8">
      <div className="max-w-full mx-auto flex flex-col gap-6">
        {/* Header Section */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex flex-col gap-2">
              <h1 className="text-gray-900 font-semibold text-2xl">
                Approved
              </h1>
              <p className="text-gray-600 font-normal text-sm">
                Last Approved 2 minutes ago
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex h-10 items-center gap-2 px-3 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors">
                <span className="text-gray-700 font-normal text-sm">Filter</span>
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
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
              <div className="flex h-10 items-center gap-2 px-3 rounded-lg border border-gray-200 bg-white">
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
                  <path d="m21 21-4.34-4.34" />
                  <circle cx="11" cy="11" r="8" />
                </svg>
                <input
                  type="text"
                  placeholder="Search..."
                  className="text-gray-700 font-normal text-sm bg-transparent border-none outline-none placeholder:text-gray-500 w-32 sm:w-40"
                />
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-8 border-b border-gray-200">
            <button
              onClick={() => setSelectedTab("approved")}
              className={cn(
                "pb-3 border-b-2 transition-colors",
                selectedTab === "approved"
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-600 hover:text-gray-900",
              )}
            >
              <span className="font-medium text-base">Approved</span>
            </button>
            <button
              onClick={() => setSelectedTab("drafts")}
              className={cn(
                "pb-3 border-b-2 transition-colors",
                selectedTab === "drafts"
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-600 hover:text-gray-900",
              )}
            >
              <span className="font-medium text-base">Drafts</span>
            </button>
          </div>

          {/* Bills Table */}
          <div className="w-full overflow-hidden rounded-lg border border-gray-200 bg-white">
            {/* Table Content */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-3 py-3 text-left">
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
                    <th className="px-3 py-3 text-left">
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
                    <th className="px-3 py-3 text-left">
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
                    <th className="px-3 py-3 text-left">
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
                    <th className="px-3 py-3 text-left">
                      <div className="flex items-center gap-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z" />
                          <circle cx="7.5" cy="7.5" r=".5" fill="currentColor" />
                        </svg>
                        <span className="font-medium text-sm text-gray-700">Status</span>
                      </div>
                    </th>
                    <th className="px-3 py-3 text-left">
                      <div className="flex items-center gap-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z" />
                          <circle cx="7.5" cy="7.5" r=".5" fill="currentColor" />
                        </svg>
                        <span className="font-medium text-sm text-gray-700">memo</span>
                      </div>
                    </th>
                    <th className="px-3 py-3 text-left">
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
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <VendorAvatar name={bill.vendor} color={bill.vendorColor} />
                          <span className="text-gray-900 font-normal text-sm">
                            {bill.vendor}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span className="text-gray-900 font-normal text-sm">
                          {bill.property}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span className="text-gray-900 font-normal text-sm">
                          {bill.statementDate}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span className="text-gray-900 font-normal text-sm">
                          {bill.dueDate}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <StatusBadge status={bill.status} />
                      </td>
                      <td className="px-3 py-3">
                        <span className="text-gray-900 font-normal text-sm truncate max-w-xs block">
                          {bill.memo}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span className="text-gray-900 font-normal text-sm">
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
            <div className="flex justify-between items-center px-6 py-4 border-t border-gray-200 bg-white">
              <div className="flex items-center gap-2">
                <span className="text-gray-700 text-sm font-medium">Rows per page</span>
                <button className="h-10 px-3 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors text-gray-700 font-medium text-sm">
                  10
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="ml-2 inline-block"
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button className="h-10 px-3 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors text-gray-700 font-medium text-sm">
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
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </button>
                <button className="w-10 h-10 flex items-center justify-center rounded-lg bg-white text-gray-900 font-medium text-sm border border-gray-200 hover:bg-gray-50">
                  1
                </button>
                <button className="w-10 h-10 flex items-center justify-center rounded-lg bg-white text-gray-600 font-medium text-sm border border-gray-200 hover:bg-gray-50">
                  2
                </button>
                <button className="w-10 h-10 flex items-center justify-center rounded-lg bg-white text-gray-600 font-medium text-sm border border-gray-200 hover:bg-gray-50">
                  3
                </button>
                <span className="text-gray-600">-</span>
                <button className="w-10 h-10 flex items-center justify-center rounded-lg bg-white text-gray-600 font-medium text-sm border border-gray-200 hover:bg-gray-50">
                  8
                </button>
                <button className="w-10 h-10 flex items-center justify-center rounded-lg bg-white text-gray-600 font-medium text-sm border border-gray-200 hover:bg-gray-50">
                  9
                </button>
                <button className="w-10 h-10 flex items-center justify-center rounded-lg bg-white text-gray-600 font-medium text-sm border border-gray-200 hover:bg-gray-50">
                  10
                </button>
                <button className="h-10 px-3 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors text-gray-700 font-medium text-sm">
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
                    <path d="M9 18l6-6-6-6" />
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
