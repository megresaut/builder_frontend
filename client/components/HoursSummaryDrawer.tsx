import { useState, useEffect } from "react";
import { DateField } from "@/components/forms";
import {
  IdentitySelectField,
  type IdentityOption,
} from "@/components/forms/IdentitySelectField";
import {
  DrawerTemplate,
  DrawerSubheader,
  DrawerSection,
  DrawerButtons,
} from "@/components/ui/DrawerTemplate";
import { fetchJSON } from "@/api/fetchJSON";

interface HoursSummaryResponse {
  total_hours: number;
  approved_hours: number;
  pending_hours: number;
}    

interface FieldTeamOrder {
  id: number;
  taskId: number;
  property: string;
  description: string;
  dueDate: string;
  priority: "low" | "normal" | "high";
  fieldTeam: Array<{ id?: number; initials: string; color: string; name: string }>;
  field_team_member_ids?: number[];
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

// Helper to generate initials from name
const getInitials = (name: string): string => {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
};

export default function HoursSummaryDrawer({
  isOpen,
  onClose,
  orders,
  selectedManagers: initialSelectedManagers,
  dateRangeStart: initialDateRangeStart,
  dateRangeEnd: initialDateRangeEnd,
}: HoursSummaryDrawerProps) {
  const [selectedManagers, setSelectedManagers] = useState<string[]>(
    initialSelectedManagers || [],
  );
  const [dateRangeStart, setDateRangeStart] = useState<Date | null>(
    initialDateRangeStart || null,
  );
  const [dateRangeEnd, setDateRangeEnd] = useState<Date | null>(
    initialDateRangeEnd || null,
  );
  const [fieldTeamMembers, setFieldTeamMembers] = useState<IdentityOption[]>([]);
  const [loadingFieldTeam, setLoadingFieldTeam] = useState(false);
  const [hoursSummary, setHoursSummary] = useState<HoursSummaryResponse | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  // Fetch field team members when drawer opens
  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    async function loadFieldTeamMembers() {
      try {
        setLoadingFieldTeam(true);
        const data = await fetchJSON("/users/field-team");
        
        if (!cancelled) {
          const members: IdentityOption[] = data.map((u: any) => ({
            id: String(u.id),
            label: u.name || u.email,
            initials: getInitials(u.name || u.email),
            avatarColor: "bg-white border border-blue-500 !text-blue-500",
          }));
          setFieldTeamMembers(members);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to load field team members:", err);
          setFieldTeamMembers([]);
        }
      } finally {
        if (!cancelled) setLoadingFieldTeam(false);
      }
    }

    loadFieldTeamMembers();
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  // Fetch hours summary when filters are filled
  useEffect(() => {
    if (!isOpen) {
      setHoursSummary(null);
      setSummaryError(null);
      return;
    }

    // Only fetch if we have at least one filter selected
    const hasFieldManagers = selectedManagers.length > 0;
    const hasDateRange = dateRangeStart && dateRangeEnd;

    if (!hasFieldManagers && !hasDateRange) {
      setHoursSummary(null);
      setSummaryError(null);
      return;
    }

    // If we have field managers, fetch the summary
    if (hasFieldManagers) {
      let cancelled = false;

      async function loadHoursSummary() {
        try {
          setLoadingSummary(true);
          setSummaryError(null);

          // Build query parameters
          const params = new URLSearchParams();
          
          // Add field team member IDs (required)
          const fieldTeamMemberIds = selectedManagers.map(Number);
          params.append("field_team_member_ids", fieldTeamMemberIds.join(","));

          // Add date range if provided (optional)
          if (dateRangeStart) {
            const startDateStr = dateRangeStart.toISOString().split("T")[0];
            params.append("start_date", startDateStr);
          }
          if (dateRangeEnd) {
            const endDateStr = dateRangeEnd.toISOString().split("T")[0];
            params.append("end_date", endDateStr);
          }

          const data = await fetchJSON(
            `/maintenance/submissions/hours-summary?${params.toString()}`
          );

          if (!cancelled) {
            setHoursSummary(data);
          }
        } catch (err: any) {
          if (!cancelled) {
            console.error("Failed to load hours summary:", err);
            setSummaryError(err?.message || "Failed to load hours summary");
            setHoursSummary(null);
          }
        } finally {
          if (!cancelled) setLoadingSummary(false);
        }
      }

      // Add a small delay to debounce rapid filter changes
      const timeoutId = setTimeout(() => {
        loadHoursSummary();
      }, 300);

      return () => {
        cancelled = true;
        clearTimeout(timeoutId);
      };
    } else {
      setHoursSummary(null);
      setSummaryError(null);
    }
  }, [isOpen, selectedManagers, dateRangeStart, dateRangeEnd]);

  const hasRequiredFilters =
    selectedManagers.length > 0 || (!!dateRangeStart && !!dateRangeEnd);

  const handleReset = () => {
    setSelectedManagers([]);
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
      footer={<DrawerButtons onCancel={onClose} cancelLabel="Close" />}
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
            <IdentitySelectField
              label="Field Managers"
              value={selectedManagers}
              onChange={(value) =>
                setSelectedManagers(Array.isArray(value) ? value : [])
              }
              placeholder={loadingFieldTeam ? "Loading..." : "All managers"}
              options={fieldTeamMembers}
              multiple={true}
              disabled={loadingFieldTeam}
            />
            <div>
              <label
                className="text-sm font-medium mb-2 block"
                style={{ color: "var(--color-text-primary)" }}
              >
                Due Date Range
              </label>
              <div className="grid grid-cols-2 gap-2">
                <DateField
                  label=""
                  value={dateRangeStart}
                  onChange={(date) => setDateRangeStart(date instanceof Date ? date : null)}
                  placeholder="From"
                />
                <DateField
                  label=""
                  value={dateRangeEnd}
                  onChange={(date) => setDateRangeEnd(date instanceof Date ? date : null)}
                  placeholder="To"
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
          <div
            className="py-8 text-center"
            style={{ color: "var(--color-text-secondary)" }}
          >
            <p className="text-sm">
              Select a Field Manager or Date Range to view hours summary
            </p>
          </div>
        </DrawerSection>
      ) : loadingSummary ? (
        <DrawerSection>
          <div
            className="py-8 text-center"
            style={{ color: "var(--color-text-secondary)" }}
          >
            <p className="text-sm">Loading hours summary...</p>
          </div>
        </DrawerSection>
      ) : summaryError ? (
        <DrawerSection>
          <div
            className="py-8 text-center"
            style={{ color: "#dc2626" }}
          >
            <p className="text-sm">{summaryError}</p>
          </div>
        </DrawerSection>
      ) : hoursSummary ? (
        <>
          <DrawerSection>
            <DrawerSubheader>Summary</DrawerSubheader>
            <div className="space-y-0">
              {/* Total Hours */}
              <div
                className="flex items-center justify-between py-4"
                style={{ borderBottom: "1px solid var(--color-border-light)" }}
              >
                <span
                  className="text-sm"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Total Hours
                </span>
                <span
                  className="text-base font-medium"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {hoursSummary.total_hours.toFixed(1)}
                </span>
              </div>

              {/* Approved Hours */}
              <div
                className="flex items-center justify-between py-4"
                style={{ borderBottom: "1px solid var(--color-border-light)" }}
              >
                <span
                  className="text-sm"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Approved Hours
                </span>
                <span
                  className="text-base font-medium"
                  style={{ color: "#059669" }}
                >
                  {hoursSummary.approved_hours.toFixed(1)}
                </span>
              </div>

              {/* Pending Hours */}
              <div className="flex items-center justify-between py-4">
                <span
                  className="text-sm"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Pending Hours
                </span>
                <span
                  className="text-base font-medium"
                  style={{ color: "#d97706" }}
                >
                  {hoursSummary.pending_hours.toFixed(1)}
                </span>
              </div>
            </div>
          </DrawerSection>
        </>
      ) : null}
    </DrawerTemplate>
  );
}
