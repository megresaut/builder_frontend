import { cn } from "@/lib/utils";

interface DateRangeFilterProps {
  startDate: string;
  endDate: string;
  onChange: (startDate: string, endDate: string) => void;
  onRefresh: () => void;
  loading?: boolean;
}

type PresetID =
  | "this_month"
  | "last_month"
  | "last_30"
  | "ytd"
  | "last_year";

interface Preset {
  id: PresetID;
  label: string;
  range: () => { start: string; end: string };
}

const ymd = (d: Date): string =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate())
    .toISOString()
    .slice(0, 10);

const PRESETS: Preset[] = [
  {
    id: "this_month",
    label: "This Month",
    range: () => {
      const now = new Date();
      return {
        start: ymd(new Date(now.getFullYear(), now.getMonth(), 1)),
        end: ymd(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
      };
    },
  },
  {
    id: "last_month",
    label: "Last Month",
    range: () => {
      const now = new Date();
      return {
        start: ymd(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
        end: ymd(new Date(now.getFullYear(), now.getMonth(), 0)),
      };
    },
  },
  {
    id: "last_30",
    label: "Last 30 Days",
    range: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 29);
      return { start: ymd(start), end: ymd(end) };
    },
  },
  {
    id: "ytd",
    label: "YTD",
    range: () => {
      const now = new Date();
      return {
        start: ymd(new Date(now.getFullYear(), 0, 1)),
        end: ymd(now),
      };
    },
  },
  {
    id: "last_year",
    label: "Last Year",
    range: () => {
      const y = new Date().getFullYear() - 1;
      return {
        start: ymd(new Date(y, 0, 1)),
        end: ymd(new Date(y, 11, 31)),
      };
    },
  },
];

// activePreset returns the preset whose range matches the current dates, or
// null if the user has picked something custom. Lets us light up the matching
// chip without storing extra state.
function activePreset(startDate: string, endDate: string): PresetID | null {
  for (const p of PRESETS) {
    const r = p.range();
    if (r.start === startDate && r.end === endDate) return p.id;
  }
  return null;
}

export function DateRangeFilter({
  startDate,
  endDate,
  onChange,
  onRefresh,
  loading,
}: DateRangeFilterProps) {
  const active = activePreset(startDate, endDate);

  return (
    <div className="flex flex-col gap-3 border border-[#E5E5E5] rounded-lg bg-white p-3 shadow-sm">
      <div className="flex flex-wrap items-center gap-1.5">
        {PRESETS.map((p) => {
          const isActive = active === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                const r = p.range();
                onChange(r.start, r.end);
              }}
              className={cn(
                "px-2.5 py-1 text-xs font-medium rounded-full border transition-colors",
                isActive
                  ? "bg-[#013764] text-white border-[#013764]"
                  : "bg-white text-[#525252] border-[#E5E5E5] hover:bg-[#F4F7FB] hover:text-[#013764] hover:border-[#C9D6E5]",
              )}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-end gap-3 pt-1 border-t border-[#F1F1F1]">
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-medium text-[#717179] uppercase tracking-wide">
            Start date
          </span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => onChange(e.target.value, endDate)}
            className="border border-[#E5E5E5] rounded-md px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#013764]/20 focus:border-[#013764]"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-medium text-[#717179] uppercase tracking-wide">
            End date
          </span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => onChange(startDate, e.target.value)}
            className="border border-[#E5E5E5] rounded-md px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#013764]/20 focus:border-[#013764]"
          />
        </label>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className={cn(
            "px-3 py-1.5 text-sm font-medium rounded-md border bg-white",
            loading
              ? "text-[#717179] border-[#E5E5E5] cursor-not-allowed"
              : "text-[#013764] border-[#C9D6E5] hover:bg-[#F4F7FB]",
          )}
          title="Re-pull from QBO"
        >
          ↻ Refresh
        </button>
        {loading && (
          <div className="text-sm text-[#717179] pb-1.5">Loading from QBO…</div>
        )}
      </div>
    </div>
  );
}
