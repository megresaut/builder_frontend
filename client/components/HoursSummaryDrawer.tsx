import { useState, useMemo } from "react";
import { ChevronDownIcon } from "@/components/icons";
import { DateField, SelectField } from "@/components/forms";

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
  selectedManager?: string;
  dateRangeStart?: Date | null;
  dateRangeEnd?: Date | null;
}

const FIELD_TEAM_MANAGERS = [
  { value: "1", label: "Christopher Harris" },
  { value: "2", label: "Cassandra Smith" },
  { value: "3", label: "David Chen" },
  { value: "4", label: "Emma Rodriguez" },
  { value: "5", label: "James Wilson" },
];

export default function HoursSummaryDrawer({
  isOpen,
  onClose,
  orders,
  selectedManager: initialSelectedManager,
  dateRangeStart: initialDateRangeStart,
  dateRangeEnd: initialDateRangeEnd,
}: HoursSummaryDrawerProps) {
  const [expandedSections, setExpandedSections] = useState<{
    [key: string]: boolean;
  }>({});
  const [selectedManager, setSelectedManager] = useState<string>(initialSelectedManager || "");
  const [dateRangeStart, setDateRangeStart] = useState<Date | null>(initialDateRangeStart || null);
  const [dateRangeEnd, setDateRangeEnd] = useState<Date | null>(initialDateRangeEnd || null);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Filter orders based on selected filters
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Filter by field manager
      if (selectedManager) {
        const matchesManager = order.fieldTeam.some((member) => {
          const mockUsers: Record<number, { id: number; name: string }> = {
            1: { id: 1, name: "Christopher Harris" },
            2: { id: 2, name: "Cassandra Smith" },
            3: { id: 3, name: "David Chen" },
            4: { id: 4, name: "Emma Rodriguez" },
            5: { id: 5, name: "James Wilson" },
          };
          const user = Object.values(mockUsers).find((u) => u.name === member.name);
          return user && selectedManager === String(user.id);
        });
        if (!matchesManager) return false;
      }

      // Filter by date range
      if (dateRangeStart || dateRangeEnd) {
        const orderDate = new Date(order.dueDate);
        if (dateRangeStart && orderDate < dateRangeStart) return false;
        if (dateRangeEnd && orderDate > dateRangeEnd) return false;
      }

      return true;
    });
  }, [orders, selectedManager, dateRangeStart, dateRangeEnd]);

  // Calculate metrics
  const totalHours = filteredOrders.reduce((sum, order) => sum + (order.hours || 0), 0);
  const approvedHours = filteredOrders
    .filter((o) => o.timesheetStatus === "approved")
    .reduce((sum, order) => sum + (order.hours || 0), 0);
  const submittedHours = filteredOrders
    .filter((o) => o.timesheetStatus === "submitted")
    .reduce((sum, order) => sum + (order.hours || 0), 0);
  const pendingHours = filteredOrders
    .filter((o) => o.timesheetStatus === "awaiting-submission")
    .reduce((sum, order) => sum + (order.hours || 0), 0);

  // Calculate hours by property
  const hoursByProperty = filteredOrders.reduce(
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
  const hoursByFTO = filteredOrders.map((order) => ({
    description: order.description,
    hours: order.hours || 0,
  }));

  // Calculate hours by status
  const hoursByStatus = [
    {
      status: "Awaiting Submission",
      hours: pendingHours,
      count: filteredOrders.filter((o) => o.timesheetStatus === "awaiting-submission")
        .length,
    },
    {
      status: "Submitted",
      hours: submittedHours,
      count: filteredOrders.filter((o) => o.timesheetStatus === "submitted").length,
    },
    {
      status: "Approved",
      hours: approvedHours,
      count: filteredOrders.filter((o) => o.timesheetStatus === "approved").length,
    },
  ];

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/10 transition-opacity duration-200"
        onClick={onClose}
        style={{
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
        }}
      />

      {/* Drawer */}
      <div
        className="fixed top-0 right-0 h-screen w-96 bg-white shadow-xl z-50 overflow-hidden flex flex-col"
        style={{
          borderLeft: "1px solid var(--color-border-light)",
          animation: isOpen ? "slideInRight 0.3s ease-out" : "slideOutRight 0.3s ease-in",
        }}
      >
        {/* Header */}
        <div
          className="flex-shrink-0 border-b px-6 py-5"
          style={{ borderColor: "var(--color-border-light)" }}
        >
          <div className="flex items-start justify-between gap-4 mb-4">
            <h2
              className="text-base font-semibold leading-tight"
              style={{ color: "var(--color-text-primary)" }}
            >
              Hours Summary
            </h2>
            <button
              onClick={onClose}
              className="flex-shrink-0 p-1 rounded hover:bg-gray-100 transition-colors"
              style={{ color: "var(--color-text-muted)" }}
            >
              <svg
                width="18"
                height="18"
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

          {/* Filter Controls */}
          <div className="space-y-3 mb-4">
            <SelectField
              label="Field Manager"
              value={selectedManager}
              onChange={(value) => setSelectedManager(value as string)}
              placeholder="All managers"
              options={FIELD_TEAM_MANAGERS}
              compact={true}
            />
            <div className="grid grid-cols-2 gap-2">
              <DateField
                label="From"
                value={dateRangeStart}
                onChange={setDateRangeStart}
                placeholder="mm/dd/yyyy"
                compact={true}
              />
              <DateField
                label="To"
                value={dateRangeEnd}
                onChange={setDateRangeEnd}
                placeholder="mm/dd/yyyy"
                compact={true}
              />
            </div>
          </div>

          <p
            className="text-xs leading-relaxed"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Hours are calculated from timesheet entries submitted by
            {selectedManager ? " the selected field manager" : " field managers"}
            {dateRangeStart || dateRangeEnd
              ? " for Field Team Orders whose due dates fall within the selected range."
              : "."}
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* Key Metrics */}
          <div className="space-y-0 mb-6">
            <div
              className="flex items-center justify-between py-4"
              style={{ borderBottom: "1px solid var(--color-border-light)" }}
            >
              <span
                className="text-sm"
                style={{
                  color: "var(--color-text-secondary)",
                  fontWeight: 400,
                }}
              >
                Total Hours
              </span>
              <span
                className="text-base font-semibold"
                style={{ color: "var(--color-text-primary)" }}
              >
                {totalHours.toFixed(1)}
              </span>
            </div>

            <div
              className="flex items-center justify-between py-4"
              style={{ borderBottom: "1px solid var(--color-border-light)" }}
            >
              <span
                className="text-sm"
                style={{
                  color: "var(--color-text-secondary)",
                  fontWeight: 400,
                }}
              >
                Approved Hours
              </span>
              <span className="text-base font-semibold text-green-600">
                {approvedHours.toFixed(1)}
              </span>
            </div>

            <div
              className="flex items-center justify-between py-4"
              style={{ borderBottom: "1px solid var(--color-border-light)" }}
            >
              <span
                className="text-sm"
                style={{
                  color: "var(--color-text-secondary)",
                  fontWeight: 400,
                }}
              >
                Submitted Hours
              </span>
              <span className="text-base font-semibold text-blue-600">
                {submittedHours.toFixed(1)}
              </span>
            </div>

            <div className="flex items-center justify-between py-4">
              <div className="flex items-center gap-2">
                <span
                  className="text-sm"
                  style={{
                    color: "var(--color-text-secondary)",
                    fontWeight: 400,
                  }}
                >
                  Pending Hours
                </span>
                <div
                  className="w-4 h-4 rounded-full flex items-center justify-center cursor-help"
                  style={{ backgroundColor: "var(--color-text-muted)" }}
                  title="Submitted but not yet approved"
                >
                  <span className="text-xs text-white font-bold">?</span>
                </div>
              </div>
              <span className="text-base font-semibold text-amber-600">
                {pendingHours.toFixed(1)}
              </span>
            </div>
          </div>

          {/* Expandable Sections */}
          <div
            className="space-y-2 pt-4"
            style={{ borderTop: "1px solid var(--color-border-light)" }}
          >
            {/* Hours by Property */}
            <div
              className="border rounded-md overflow-hidden"
              style={{
                borderColor: "var(--color-border-light)",
                backgroundColor: "var(--color-bg-subtle)",
              }}
            >
              <button
                onClick={() => toggleSection("byProperty")}
                className="w-full flex items-center justify-between px-4 py-3 hover:opacity-80 transition-opacity"
              >
                <span
                  className="text-sm"
                  style={{
                    color: "var(--color-text-primary)",
                    fontWeight: 500,
                  }}
                >
                  Hours by Property
                </span>
                <ChevronDownIcon
                  width={16}
                  height={16}
                  style={{
                    color: "var(--color-text-secondary)",
                    transform: expandedSections["byProperty"]
                      ? "rotate(180deg)"
                      : "rotate(0deg)",
                    transition: "transform 200ms ease-out",
                  }}
                />
              </button>
              {expandedSections["byProperty"] && (
                <div
                  className="px-4 py-3 space-y-2"
                  style={{
                    borderTop: "1px solid var(--color-border-light)",
                    backgroundColor: "white",
                  }}
                >
                  {hoursByProperty.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-xs"
                      style={{
                        animation: "slideDown 200ms ease-out",
                      }}
                    >
                      <span style={{ color: "var(--color-text-secondary)" }}>
                        {item.property}
                      </span>
                      <span
                        className="font-medium"
                        style={{ color: "var(--color-text-primary)" }}
                      >
                        {item.hours.toFixed(1)}h
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Hours by FTO */}
            <div
              className="border rounded-md overflow-hidden"
              style={{
                borderColor: "var(--color-border-light)",
                backgroundColor: "var(--color-bg-subtle)",
              }}
            >
              <button
                onClick={() => toggleSection("byFTO")}
                className="w-full flex items-center justify-between px-4 py-3 hover:opacity-80 transition-opacity"
              >
                <span
                  className="text-sm"
                  style={{
                    color: "var(--color-text-primary)",
                    fontWeight: 500,
                  }}
                >
                  Hours by FTO
                </span>
                <ChevronDownIcon
                  width={16}
                  height={16}
                  style={{
                    color: "var(--color-text-secondary)",
                    transform: expandedSections["byFTO"]
                      ? "rotate(180deg)"
                      : "rotate(0deg)",
                    transition: "transform 200ms ease-out",
                  }}
                />
              </button>
              {expandedSections["byFTO"] && (
                <div
                  className="px-4 py-3 space-y-2 max-h-48 overflow-y-auto"
                  style={{
                    borderTop: "1px solid var(--color-border-light)",
                    backgroundColor: "white",
                  }}
                >
                  {hoursByFTO.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-xs"
                      style={{
                        animation: "slideDown 200ms ease-out",
                      }}
                    >
                      <span
                        className="truncate"
                        style={{ color: "var(--color-text-secondary)" }}
                      >
                        {item.description}
                      </span>
                      <span
                        className="font-medium flex-shrink-0 ml-2"
                        style={{ color: "var(--color-text-primary)" }}
                      >
                        {item.hours.toFixed(1)}h
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Hours by Status */}
            <div
              className="border rounded-md overflow-hidden"
              style={{
                borderColor: "var(--color-border-light)",
                backgroundColor: "var(--color-bg-subtle)",
              }}
            >
              <button
                onClick={() => toggleSection("byStatus")}
                className="w-full flex items-center justify-between px-4 py-3 hover:opacity-80 transition-opacity"
              >
                <span
                  className="text-sm"
                  style={{
                    color: "var(--color-text-primary)",
                    fontWeight: 500,
                  }}
                >
                  Hours by Status
                </span>
                <ChevronDownIcon
                  width={16}
                  height={16}
                  style={{
                    color: "var(--color-text-secondary)",
                    transform: expandedSections["byStatus"]
                      ? "rotate(180deg)"
                      : "rotate(0deg)",
                    transition: "transform 200ms ease-out",
                  }}
                />
              </button>
              {expandedSections["byStatus"] && (
                <div
                  className="px-4 py-3 space-y-2"
                  style={{
                    borderTop: "1px solid var(--color-border-light)",
                    backgroundColor: "white",
                  }}
                >
                  {hoursByStatus.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-xs"
                      style={{
                        animation: "slideDown 200ms ease-out",
                      }}
                    >
                      <span style={{ color: "var(--color-text-secondary)" }}>
                        {item.status} ({item.count})
                      </span>
                      <span
                        className="font-medium"
                        style={{ color: "var(--color-text-primary)" }}
                      >
                        {item.hours.toFixed(1)}h
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer - Clear Filters Button */}
        {orders.length > 0 && (
          <div
            className="flex-shrink-0 border-t px-6 py-4"
            style={{ borderColor: "var(--color-border-light)" }}
          >
            <button
              onClick={onClose}
              className="text-xs font-medium transition-colors hover:opacity-80"
              style={{ color: "#2463eb" }}
            >
              Close
            </button>
          </div>
        )}
      </div>
    </>
  );
}
