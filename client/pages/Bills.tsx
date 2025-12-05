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
                "px-1 py-3 border-b-2 font-medium text-base transition-colors",
                selectedTab === "approved"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900",
              )}
            >
              Approved
            </button>
            <button
              onClick={() => setSelectedTab("drafts")}
              className={cn(
                "px-1 py-3 border-b-2 font-medium text-base transition-colors",
                selectedTab === "drafts"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900",
              )}
            >
              Drafts
            </button>
          </div>

          {/* Bills Table */}
          <div className="flex flex-col">
            <div className="w-full overflow-hidden rounded-xl border border-gray-200 shadow-sm">
              {/* Table Header */}
              <div className="flex justify-between items-center px-4 py-3 border-b border-gray-200 bg-white">
                <h2 className="text-gray-900 font-medium text-xl">Bills</h2>
                <div className="flex items-start gap-2.5">
                  <div className="flex h-9 items-center gap-2 px-3 rounded-lg border border-gray-200 bg-white">
                    <svg
                      width="20"
                      height="20"
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
                      className="text-gray-700 font-normal text-base bg-transparent border-none outline-none placeholder:text-gray-600 w-32 sm:w-48"
                    />
                  </div>
                  <button className="flex h-9 items-center gap-2 px-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors">
                    <span className="text-gray-700 font-normal text-base">
                      Filter
                    </span>
                    <svg
                      width="18"
                      height="18"
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
                </div>
              </div>

              {/* Table Content */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="px-4 py-3 text-left text-gray-700 font-medium text-sm">
                        Vendor
                      </th>
                      <th className="px-4 py-3 text-left text-gray-700 font-medium text-sm">
                        Property
                      </th>
                      <th className="px-4 py-3 text-left text-gray-700 font-medium text-sm">
                        Statement Date
                      </th>
                      <th className="px-4 py-3 text-left text-gray-700 font-medium text-sm">
                        Due Date
                      </th>
                      <th className="px-4 py-3 text-left text-gray-700 font-medium text-sm">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-gray-700 font-medium text-sm">
                        Memo
                      </th>
                      <th className="px-4 py-3 text-left text-gray-700 font-medium text-sm">
                        Invoice #
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {approvedBills.map((bill, index) => (
                      <tr
                        key={bill.id}
                        className={cn(
                          "border-b border-gray-200 hover:bg-gray-50 transition-colors",
                          index === approvedBills.length - 1 ? "border-b-0" : "",
                        )}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <VendorAvatar name={bill.vendor} color={bill.vendorColor} />
                            <span className="text-gray-900 font-medium text-sm">
                              {bill.vendor}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-gray-700 text-sm">
                            {bill.property}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-gray-700 text-sm">
                            {bill.statementDate}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-gray-700 text-sm">
                            {bill.dueDate}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={bill.status} />
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-gray-700 text-sm truncate max-w-xs">
                            {bill.memo}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-gray-700 text-sm font-medium">
                            {bill.invoiceNumber}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
