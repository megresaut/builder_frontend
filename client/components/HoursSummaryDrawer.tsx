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
        <div className="flex-shrink-0 border-b px-6 py-6" style={{ borderColor: "var(--color-border-light)" }}>
          <div className="flex items-start justify-between gap-4 mb-2">
            <h2 className="text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>
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
          <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
            Calculated from timesheet entries submitted by field managers
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {/* Scope Controls Section */}
          <div className="mb-8">
            <h3
              className="text-sm font-semibold mb-4"
              style={{ color: "var(--color-text-primary)" }}
            >
              Scope
            </h3>
            <div
              className="border rounded-lg p-4"
              style={{
                borderColor: "var(--color-border-light)",
                backgroundColor: "var(--color-bg-subtle)",
              }}
            >
              <div className="space-y-4">
                <SelectField
                  label="Field Manager"
                  value={selectedManager}
                  onChange={(value) => setSelectedManager(value as string)}
                  placeholder="All managers"
                  options={FIELD_TEAM_MANAGERS}
                  compact={false}
                />
                <div>
                  <label className="text-sm font-medium mb-2 block" style={{ color: "var(--color-text-primary)" }}>
                    Due Date Range
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <DateField
                      label=""
                      value={dateRangeStart}
                      onChange={setDateRangeStart}
                      placeholder="From"
                      compact={true}
                    />
                    <DateField
                      label=""
                      value={dateRangeEnd}
                      onChange={setDateRangeEnd}
                      placeholder="To"
                      compact={true}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Summary Metrics Section */}
          {filteredOrders.length === 0 ? (
            <div
              className="py-8 text-center"
              style={{ color: "var(--color-text-secondary)" }}
            >
              <p className="text-sm">Select a field manager to view hours summary</p>
            </div>
          ) : (
            <div className="mb-8">
              <h3
                className="text-sm font-semibold mb-4"
                style={{ color: "var(--color-text-primary)" }}
              >
                Summary
              </h3>
              <div className="space-y-0">
                {/* Total Hours */}
                <div
                  className="flex items-center justify-between py-4"
                  style={{ borderBottom: "1px solid var(--color-border-light)" }}
                >
                  <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                    Total Hours
                  </span>
                  <span className="text-base font-medium" style={{ color: "var(--color-text-primary)" }}>
                    {totalHours.toFixed(1)}
                  </span>
                </div>

                {/* Approved Hours */}
                <div
                  className="flex items-center justify-between py-4"
                  style={{ borderBottom: "1px solid var(--color-border-light)" }}
                >
                  <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                    Approved Hours
                  </span>
                  <span className="text-base font-medium" style={{ color: "#059669" }}>
                    {approvedHours.toFixed(1)}
                  </span>
                </div>

                {/* Submitted Hours */}
                <div
                  className="flex items-center justify-between py-4"
                  style={{ borderBottom: "1px solid var(--color-border-light)" }}
                >
                  <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                    Submitted Hours
                  </span>
                  <span className="text-base font-medium" style={{ color: "#2463eb" }}>
                    {submittedHours.toFixed(1)}
                  </span>
                </div>

                {/* Pending Hours */}
                <div className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
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
                  <span className="text-base font-medium" style={{ color: "#d97706" }}>
                    {pendingHours.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Breakdown Section */}
          {filteredOrders.length > 0 && (
            <div>
              <h3
                className="text-sm font-semibold mb-4"
                style={{ color: "var(--color-text-primary)" }}
              >
                Breakdown
              </h3>
              <div className="space-y-2">
                {/* Hours by Property */}
                <div
                  className="border rounded-lg overflow-hidden"
                  style={{
                    borderColor: "var(--color-border-light)",
                  }}
                >
                  <button
                    onClick={() => toggleSection("byProperty")}
                    className="w-full flex items-center justify-between px-4 py-3 hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: "var(--color-bg-subtle)" }}
                  >
                    <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
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
                        <div key={idx} className="flex items-center justify-between text-xs">
                          <span style={{ color: "var(--color-text-secondary)" }}>
                            {item.property}
                          </span>
                          <span className="font-medium" style={{ color: "var(--color-text-primary)" }}>
                            {item.hours.toFixed(1)}h
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Hours by FTO */}
                <div
                  className="border rounded-lg overflow-hidden"
                  style={{
                    borderColor: "var(--color-border-light)",
                  }}
                >
                  <button
                    onClick={() => toggleSection("byFTO")}
                    className="w-full flex items-center justify-between px-4 py-3 hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: "var(--color-bg-subtle)" }}
                  >
                    <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
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
                        <div key={idx} className="flex items-center justify-between text-xs">
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
                  className="border rounded-lg overflow-hidden"
                  style={{
                    borderColor: "var(--color-border-light)",
                  }}
                >
                  <button
                    onClick={() => toggleSection("byStatus")}
                    className="w-full flex items-center justify-between px-4 py-3 hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: "var(--color-bg-subtle)" }}
                  >
                    <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
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
                        <div key={idx} className="flex items-center justify-between text-xs">
                          <span style={{ color: "var(--color-text-secondary)" }}>
                            {item.status} ({item.count})
                          </span>
                          <span className="font-medium" style={{ color: "var(--color-text-primary)" }}>
                            {item.hours.toFixed(1)}h
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
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
      </div>
    </>
  );
}
