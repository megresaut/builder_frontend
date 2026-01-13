import { useState } from "react";
import { ChevronDownIcon } from "@/components/icons";

interface FieldTeamOrder {
  id: number;
  taskId: number;
  property: string;
  description: string;
  dueDate: string;
  priority: "low" | "normal" | "high";
  fieldTeam: Array<{ initials: string; color: string; name: string }>;
  status: "dispatched" | "approved" | "pending-approval";
  timesheetStatus:
    | "awaiting-submission"
    | "submitted"
    | "rejected"
    | "approved";
  amount: number;
  hours?: number;
  unit?: string;
  fieldTeamAssignee?: string;
  task?: string;
}

interface HoursSummaryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  orders: FieldTeamOrder[];
}

export default function HoursSummaryDrawer({
  isOpen,
  onClose,
  orders,
}: HoursSummaryDrawerProps) {
  const [expandedSections, setExpandedSections] = useState<{
    [key: string]: boolean;
  }>({});

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Calculate metrics
  const totalHours = orders.reduce((sum, order) => sum + (order.hours || 0), 0);
  const approvedHours = orders
    .filter((o) => o.timesheetStatus === "approved")
    .reduce((sum, order) => sum + (order.hours || 0), 0);
  const submittedHours = orders
    .filter((o) => o.timesheetStatus === "submitted")
    .reduce((sum, order) => sum + (order.hours || 0), 0);
  const pendingHours = orders
    .filter((o) => o.timesheetStatus === "awaiting-submission")
    .reduce((sum, order) => sum + (order.hours || 0), 0);

  // Calculate hours by property
  const hoursByProperty = orders.reduce(
    (acc, order) => {
      const existing = acc.find((p) => p.property === order.property);
      if (existing) {
        existing.hours += order.hours || 0;
      } else {
        acc.push({ property: order.property, hours: order.hours || 0 });
      }
      return acc;
    },
    [] as Array<{ property: string; hours: number }>,
  );

  // Calculate hours by FTO
  const hoursByFTO = orders.map((order) => ({
    description: order.description,
    hours: order.hours || 0,
  }));

  // Calculate hours by status
  const hoursByStatus = [
    {
      status: "Awaiting Submission",
      hours: pendingHours,
      count: orders.filter((o) => o.timesheetStatus === "awaiting-submission")
        .length,
    },
    {
      status: "Submitted",
      hours: submittedHours,
      count: orders.filter((o) => o.timesheetStatus === "submitted").length,
    },
    {
      status: "Approved",
      hours: approvedHours,
      count: orders.filter((o) => o.timesheetStatus === "approved").length,
    },
  ];

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/20 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-screen w-96 bg-white shadow-lg z-50 overflow-y-auto transition-transform duration-200">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-[#E5E7EB] px-6 py-6 z-10">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-[#303030]">
              Hours Summary
            </h2>
            <button
              onClick={onClose}
              className="text-[#A1A1A9] hover:text-[#303030] transition-colors"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M15 5L5 15M5 5L15 15"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
          <p className="text-sm text-[#A1A1A9]">
            Based on filtered Field Team Orders
          </p>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          {/* Key Metrics */}
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-[#F0F0F0]">
              <span className="text-sm font-medium text-[#525252]">
                Total Hours
              </span>
              <span className="text-lg font-semibold text-[#303030]">
                {totalHours.toFixed(1)}
              </span>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-[#F0F0F0]">
              <span className="text-sm font-medium text-[#525252]">
                Approved Hours
              </span>
              <span className="text-lg font-semibold text-[#059669]">
                {approvedHours.toFixed(1)}
              </span>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-[#F0F0F0]">
              <span className="text-sm font-medium text-[#525252]">
                Submitted Hours
              </span>
              <span className="text-lg font-semibold text-[#2463eb]">
                {submittedHours.toFixed(1)}
              </span>
            </div>

            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-[#525252]">
                  Pending Hours
                </span>
                <div
                  className="w-4 h-4 rounded-full bg-[#717179] cursor-help flex items-center justify-center"
                  title="Submitted but not yet approved"
                >
                  <span className="text-xs text-white font-bold">?</span>
                </div>
              </div>
              <span className="text-lg font-semibold text-[#D97706]">
                {pendingHours.toFixed(1)}
              </span>
            </div>
          </div>

          {/* Expandable Sections */}
          <div className="space-y-3 mt-8 pt-6 border-t border-[#F0F0F0]">
            {/* Hours by Property */}
            <div className="border border-[#E5E7EB] rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection("byProperty")}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#F9F9F9] transition-colors"
              >
                <span className="text-sm font-medium text-[#303030]">
                  Hours by Property
                </span>
                <ChevronDownIcon
                  width={16}
                  height={16}
                  color="#525252"
                  style={{
                    transform: expandedSections["byProperty"]
                      ? "rotate(180deg)"
                      : "rotate(0deg)",
                    transition: "transform 200ms",
                  }}
                />
              </button>
              {expandedSections["byProperty"] && (
                <div className="px-4 py-3 bg-[#F9F9F9] border-t border-[#E5E7EB] space-y-2">
                  {hoursByProperty.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-[#525252]">{item.property}</span>
                      <span className="font-medium text-[#303030]">
                        {item.hours.toFixed(1)}h
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Hours by FTO */}
            <div className="border border-[#E5E7EB] rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection("byFTO")}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#F9F9F9] transition-colors"
              >
                <span className="text-sm font-medium text-[#303030]">
                  Hours by FTO
                </span>
                <ChevronDownIcon
                  width={16}
                  height={16}
                  color="#525252"
                  style={{
                    transform: expandedSections["byFTO"]
                      ? "rotate(180deg)"
                      : "rotate(0deg)",
                    transition: "transform 200ms",
                  }}
                />
              </button>
              {expandedSections["byFTO"] && (
                <div className="px-4 py-3 bg-[#F9F9F9] border-t border-[#E5E7EB] space-y-2 max-h-64 overflow-y-auto">
                  {hoursByFTO.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-[#525252] truncate">
                        {item.description}
                      </span>
                      <span className="font-medium text-[#303030] flex-shrink-0 ml-2">
                        {item.hours.toFixed(1)}h
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Hours by Status */}
            <div className="border border-[#E5E7EB] rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection("byStatus")}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#F9F9F9] transition-colors"
              >
                <span className="text-sm font-medium text-[#303030]">
                  Hours by Status
                </span>
                <ChevronDownIcon
                  width={16}
                  height={16}
                  color="#525252"
                  style={{
                    transform: expandedSections["byStatus"]
                      ? "rotate(180deg)"
                      : "rotate(0deg)",
                    transition: "transform 200ms",
                  }}
                />
              </button>
              {expandedSections["byStatus"] && (
                <div className="px-4 py-3 bg-[#F9F9F9] border-t border-[#E5E7EB] space-y-2">
                  {hoursByStatus.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-[#525252]">
                        {item.status} ({item.count})
                      </span>
                      <span className="font-medium text-[#303030]">
                        {item.hours.toFixed(1)}h
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
