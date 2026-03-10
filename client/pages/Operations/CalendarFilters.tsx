import { useEffect, useState } from "react";
import { fetchJSON } from "@/api/fetchJSON";
import type { CalendarFilters as CalendarFiltersType } from "@/data/operations";
import MiniCalendar from "./MiniCalendar";

const EVENT_TYPE_OPTIONS = [
  { value: "task", label: "Tasks", color: "#3B82F6" },
  { value: "work_order", label: "Work Orders", color: "#F97316" },
  { value: "field_team_order", label: "Field Team Orders", color: "#22C55E" },
  { value: "inspection", label: "Inspections", color: "#A855F7" },
  { value: "recurring_task", label: "Recurring Tasks", color: "#14B8A6" },
  { value: "calendar_event", label: "Events", color: "#6B7280" },
] as const;

// Consistent color palette for manager checkboxes
const MANAGER_COLORS = [
  "#6366F1", "#EC4899", "#F59E0B", "#10B981", "#8B5CF6",
  "#EF4444", "#06B6D4", "#84CC16", "#F97316", "#0EA5E9",
];

/** Collapsible section header with chevron. */
function SectionHeader({ label, open, onToggle }: { label: string; open: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex items-center gap-1.5 w-full text-[10px] font-semibold text-[#999] uppercase tracking-wider hover:text-[#717179] transition-colors"
    >
      <svg
        width="8"
        height="8"
        viewBox="0 0 8 8"
        fill="none"
        className={`transition-transform ${open ? "rotate-90" : ""}`}
      >
        <path d="M2 1L6 4L2 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {label}
    </button>
  );
}

/** Compact checkbox row with colored indicator. */
function CheckboxRow({ label, color, checked, onChange }: { label: string; color: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex items-center gap-2 py-0.5 px-1.5 rounded hover:bg-white cursor-pointer transition-colors">
      <div className="relative flex items-center">
        <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
        <div
          className="w-3 h-3 rounded flex items-center justify-center transition-colors"
          style={{
            borderWidth: "1.5px",
            borderStyle: "solid",
            borderColor: checked ? color : "#d1d5db",
            backgroundColor: checked ? color : "transparent",
          }}
        >
          {checked && (
            <svg width="7" height="5" viewBox="0 0 10 8" fill="none">
              <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
      </div>
      <span className="text-[11px] text-[#303030] leading-tight">{label}</span>
    </label>
  );
}

/** Scalable manager list with search, grouped by role. */
function ManagerList({
  propertyManagers,
  fieldManagers,
  deselectedManagerIds,
  onManagerToggle,
  search,
  onSearchChange,
}: {
  propertyManagers: User[];
  fieldManagers: User[];
  deselectedManagerIds?: Set<number>;
  onManagerToggle?: (id: number) => void;
  search: string;
  onSearchChange: (v: string) => void;
}) {
  const allUsers = [...propertyManagers, ...fieldManagers];
  const totalCount = allUsers.length;
  const activeCount = allUsers.filter((u) => !deselectedManagerIds?.has(u.id)).length;

  const filteredPM = search
    ? propertyManagers.filter((u) => u.name.toLowerCase().includes(search.toLowerCase()))
    : propertyManagers;
  const filteredFT = search
    ? fieldManagers.filter((u) => u.name.toLowerCase().includes(search.toLowerCase()))
    : fieldManagers;

  function getInitials(name: string) {
    return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  }

  function renderRow(user: User, colorIdx: number) {
    const color = MANAGER_COLORS[colorIdx % MANAGER_COLORS.length];
    const active = !deselectedManagerIds?.has(user.id);
    return (
      <button
        key={user.id}
        type="button"
        onClick={() => onManagerToggle?.(user.id)}
        className="flex items-center gap-2 w-full px-1.5 py-[3px] rounded hover:bg-white transition-colors text-left"
      >
        <span
          className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[8px] font-semibold shrink-0 transition-opacity"
          style={{ backgroundColor: active ? color : "#d1d5db" }}
        >
          {getInitials(user.name)}
        </span>
        <span
          className="text-[11px] truncate flex-1 transition-colors"
          style={{ color: active ? "#303030" : "#aaa" }}
        >
          {user.name}
        </span>
        {!active && (
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none" className="shrink-0 opacity-40">
            <path d="M2 6h8" stroke="#999" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        )}
      </button>
    );
  }

  return (
    <div className="mt-1">
      {/* Summary + search */}
      <div className="flex items-center gap-1.5 mb-1">
        {totalCount > 8 && (
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search..."
            className="flex-1 h-6 px-2 rounded-md border border-[#e5e5e5] text-[10px] text-[#303030] bg-white focus:outline-none focus:border-[#013764] min-w-0"
          />
        )}
        <span className="text-[9px] text-[#b0b0b0] shrink-0 tabular-nums">
          {activeCount === totalCount ? "All" : `${activeCount}/${totalCount}`}
        </span>
      </div>

      {/* Scrollable list */}
      <div className="overflow-y-auto" style={{ maxHeight: 200 }}>
        {filteredPM.length > 0 && (
          <div className="mb-1">
            <div className="text-[9px] text-[#b0b0b0] uppercase tracking-wider px-1.5 mb-0.5">Property Managers</div>
            {filteredPM.map((u, i) => renderRow(u, i))}
          </div>
        )}
        {filteredFT.length > 0 && (
          <div>
            <div className="text-[9px] text-[#b0b0b0] uppercase tracking-wider px-1.5 mb-0.5">Field Team</div>
            {filteredFT.map((u, i) => renderRow(u, propertyManagers.length + i))}
          </div>
        )}
        {filteredPM.length === 0 && filteredFT.length === 0 && (
          <div className="text-[10px] text-[#999] px-1.5 py-1">
            {search ? "No matches" : "No managers found"}
          </div>
        )}
      </div>
    </div>
  );
}

interface User {
  id: number;
  name: string;
  role: string;
}

interface CalendarSidebarProps {
  filters: CalendarFiltersType;
  onChange: (filters: CalendarFiltersType) => void;
  onDateClick?: (dateStr: string) => void;
  eventDates?: Set<string>;
  onNewEvent: () => void;
  deselectedManagerIds?: Set<number>;
  onManagerToggle?: (id: number) => void;
  onOpenAdvancedFilters?: () => void;
  hasActiveAdvancedFilters?: boolean;
}

export default function CalendarSidebar({
  filters,
  onChange,
  onDateClick,
  eventDates,
  onNewEvent,
  deselectedManagerIds,
  onManagerToggle,
  onOpenAdvancedFilters,
  hasActiveAdvancedFilters,
}: CalendarSidebarProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [calendarsOpen, setCalendarsOpen] = useState(true);
  const [managersOpen, setManagersOpen] = useState(false);

  const selectedTypes = filters.type ? filters.type.split(",") : [];

  // Split users by role
  const propertyManagers = users.filter((u) => u.role === "property_manager" || u.role === "admin");
  const fieldManagers = users.filter((u) => u.role === "field_team_member");

  const [managerSearch, setManagerSearch] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("avm_token");
    const headers = { Authorization: `Bearer ${token}` };
    fetchJSON("/users/all", { headers })
      .then((usrs) => {
        const real = Array.isArray(usrs) ? usrs.map((u: any) => ({ id: u.id, name: u.name || u.email, role: u.role })) : [];
        // TODO: Remove mock data — added to test scalability with 200+ users
        const firstNames = ["Sarah","David","Maria","James","Emily","Robert","Lisa","Michael","Jennifer","William","Amanda","Daniel","Rachel","Kevin","Megan","Brian","Stephanie","Patrick","Nicole","Andrew","Alex","Sam","Tyler","Jordan","Casey","Riley","Drew","Morgan","Jesse","Avery","Quinn","Blake","Cameron","Dakota","Emerson","Finley","Harper","Jade","Kai","Lane","Micah","Noel","Oakley","Parker","Reese","Sage","Taylor","Val","Wren","Zara"];
        const lastNames = ["Mitchell","Kim","Garcia","Wilson","Chen","Taylor","Anderson","Brown","Lee","Davis","Martinez","Jackson","Thompson","White","Harris","Clark","Lewis","Robinson","Walker","Hall","Rivera","Johnson","Brooks","Price","Morgan","Cooper","Patterson","Reed","Barnes","Ross","Foster","Howard","Ward","Flores","Cruz","Long","Bell","Scott","Murphy","Coleman","Stewart","Powell","Perry","Russell","Gray","Hunt","Ford","Wood","Grant","Stone"];
        const mockPM = Array.from({ length: 80 }, (_, i) => ({
          id: 9000 + i,
          name: `${firstNames[i % firstNames.length]} ${lastNames[(i * 7 + 3) % lastNames.length]}`,
          role: "property_manager",
        }));
        const mockFT = Array.from({ length: 120 }, (_, i) => ({
          id: 9100 + i,
          name: `${firstNames[(i * 3 + 1) % firstNames.length]} ${lastNames[(i * 11 + 5) % lastNames.length]}`,
          role: "field_team_member",
        }));
        setUsers([...real, ...mockPM, ...mockFT]);
      })
      .catch(() => setUsers([]));
  }, []);

  function toggleType(typeValue: string) {
    const current = new Set(selectedTypes);
    if (current.has(typeValue)) {
      current.delete(typeValue);
    } else {
      current.add(typeValue);
    }
    const joined = Array.from(current).join(",");
    onChange({ ...filters, type: joined || undefined });
  }

  return (
    <div
      className="flex flex-col h-full border-r border-[#e8e8e8] bg-[#fafafa] overflow-y-auto"
      style={{ width: 240, minWidth: 240, fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif" }}
    >
      {/* New Event button */}
      <div className="px-4 pt-4 pb-3">
        <button
          type="button"
          onClick={onNewEvent}
          className="w-full inline-flex items-center justify-center gap-1.5 h-9 px-4 text-sm font-medium rounded-lg text-white transition-colors"
          style={{ backgroundColor: "#013764" }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#014578")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#013764")}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1v12M1 7h12" stroke="white" strokeWidth="2" strokeLinecap="round" />
          </svg>
          New Event
        </button>
      </div>

      {/* Mini Calendar */}
      <div className="px-4 pb-4">
        <MiniCalendar onDateClick={onDateClick} eventDates={eventDates} />
      </div>

      {/* Scrollable filter sections */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="border-t border-[#e8e8e8]" />

        {/* Calendars section */}
        <div className="px-4 py-2">
          <SectionHeader label="Calendars" open={calendarsOpen} onToggle={() => setCalendarsOpen(!calendarsOpen)} />
          {calendarsOpen && (
            <div className="space-y-px mt-1">
              {EVENT_TYPE_OPTIONS.map((opt) => {
                const isActive = selectedTypes.length === 0 || selectedTypes.includes(opt.value);
                return (
                  <CheckboxRow
                    key={opt.value}
                    label={opt.label}
                    color={opt.color}
                    checked={isActive}
                    onChange={() => toggleType(opt.value)}
                  />
                );
              })}
            </div>
          )}
        </div>

        <div className="border-t border-[#e8e8e8]" />

        {/* Managers section */}
        <div className="px-4 py-2">
          <SectionHeader label="Managers" open={managersOpen} onToggle={() => setManagersOpen(!managersOpen)} />
          {managersOpen && (
            <ManagerList
              propertyManagers={propertyManagers}
              fieldManagers={fieldManagers}
              deselectedManagerIds={deselectedManagerIds}
              onManagerToggle={onManagerToggle}
              search={managerSearch}
              onSearchChange={setManagerSearch}
            />
          )}
        </div>

        <div className="border-t border-[#e8e8e8]" />

        {/* Advanced Filters button */}
        <div className="px-4 py-2.5">
          <button
            type="button"
            onClick={onOpenAdvancedFilters}
            className="flex items-center gap-1.5 text-[11px] text-[#717179] hover:text-[#303030] transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
              <path d="M2 4h12M4 8h8M6 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Advanced Filters
            {hasActiveAdvancedFilters && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#013764]" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
