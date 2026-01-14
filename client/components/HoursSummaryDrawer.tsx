import { useState, useMemo } from "react";
import { DateField } from "@/components/forms";
import { IdentitySelectField } from "@/components/forms/IdentitySelectField";
import { DrawerTemplate, DrawerSubheader, DrawerSection, DrawerButtons } from "@/components/ui/DrawerTemplate";

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
  selectedManagers?: string[];
  dateRangeStart?: Date | null;
  dateRangeEnd?: Date | null;
}

const FIELD_TEAM_MANAGERS = [
  { id: "1", label: "Christopher Harris", initials: "CH", avatarColor: "bg-blue-500" },
  { id: "2", label: "Cassandra Smith", initials: "CS", avatarColor: "bg-purple-500" },
  { id: "3", label: "David Chen", initials: "DC", avatarColor: "bg-green-500" },
  { id: "4", label: "Emma Rodriguez", initials: "ER", avatarColor: "bg-pink-500" },
  { id: "5", label: "James Wilson", initials: "JW", avatarColor: "bg-orange-500" },
];

export default function HoursSummaryDrawer({
  isOpen,
  onClose,
  orders,
  selectedManagers: initialSelectedManagers,
  dateRangeStart: initialDateRangeStart,
  dateRangeEnd: initialDateRangeEnd,
}: HoursSummaryDrawerProps) {
  const [selectedManagers, setSelectedManagers] = useState<string[]>(initialSelectedManagers || []);
  const [dateRangeStart, setDateRangeStart] = useState<Date | null>(initialDateRangeStart || null);
  const [dateRangeEnd, setDateRangeEnd] = useState<Date | null>(initialDateRangeEnd || null);

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

  const hasRequiredFilters = !!selectedManager || (!!dateRangeStart && !!dateRangeEnd);

  const handleReset = () => {
    setSelectedManager("");
    setDateRangeStart(null);
    setDateRangeEnd(null);
  };

  return (
    <DrawerTemplate
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      onClose={onClose}
      title="Hours Summary"
      width={384}
      variant="floating"
      footer={
        <DrawerButtons
          onCancel={onClose}
          cancelLabel="Close"
        />
      }
    >
      {/* Scope Controls Section */}
      <div>
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
            <button
              onClick={handleReset}
              className="w-full rounded-lg border border-[var(--color-border-light)] bg-white px-3 py-2 text-sm font-medium transition-colors hover:opacity-70"
              style={{ color: "var(--color-text-primary)" }}
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Summary Metrics Section */}
      {!hasRequiredFilters ? (
        <DrawerSection>
          <div className="py-8 text-center" style={{ color: "var(--color-text-secondary)" }}>
            <p className="text-sm">Select a Field Manager or Date Range to view hours summary</p>
          </div>
        </DrawerSection>
      ) : filteredOrders.length === 0 ? (
        <DrawerSection>
          <div className="py-8 text-center" style={{ color: "var(--color-text-secondary)" }}>
            <p className="text-sm">No orders found for the selected criteria</p>
          </div>
        </DrawerSection>
      ) : (
        <>
          <DrawerSection>
            <DrawerSubheader>Summary</DrawerSubheader>
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
                <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                  Pending Hours
                </span>
                <span className="text-base font-medium" style={{ color: "#d97706" }}>
                  {pendingHours.toFixed(1)}
                </span>
              </div>
            </div>
          </DrawerSection>

        </>
      )}
    </DrawerTemplate>
  );
}
