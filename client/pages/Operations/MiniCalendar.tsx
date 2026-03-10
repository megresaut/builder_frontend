import { useState, useMemo } from "react";

interface MiniCalendarProps {
  selectedDate?: string; // "YYYY-MM-DD"
  eventDates?: Set<string>;
  onDateClick?: (dateStr: string) => void;
}

export default function MiniCalendar({ selectedDate, eventDates, onDateClick }: MiniCalendarProps) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const { weeks, monthLabel } = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const startOffset = firstDay.getDay(); // 0=Sunday
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

    const label = firstDay.toLocaleDateString("en-US", { month: "long", year: "numeric" });

    const cells: { day: number; month: number; year: number; dateStr: string; isCurrentMonth: boolean }[] = [];

    // Previous month fill
    const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate();
    for (let i = startOffset - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const m = viewMonth === 0 ? 11 : viewMonth - 1;
      const y = viewMonth === 0 ? viewYear - 1 : viewYear;
      cells.push({ day: d, month: m, year: y, dateStr: `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`, isCurrentMonth: false });
    }

    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ day: d, month: viewMonth, year: viewYear, dateStr: `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`, isCurrentMonth: true });
    }

    // Next month fill
    const remaining = 42 - cells.length; // always 6 rows
    const nm = viewMonth === 11 ? 0 : viewMonth + 1;
    const ny = viewMonth === 11 ? viewYear + 1 : viewYear;
    for (let d = 1; d <= remaining; d++) {
      cells.push({ day: d, month: nm, year: ny, dateStr: `${ny}-${String(nm + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`, isCurrentMonth: false });
    }

    // Group into weeks
    const wks: typeof cells[] = [];
    for (let i = 0; i < cells.length; i += 7) {
      wks.push(cells.slice(i, i + 7));
    }

    return { weeks: wks, monthLabel: label };
  }, [viewYear, viewMonth]);

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(viewYear - 1); setViewMonth(11); }
    else setViewMonth(viewMonth - 1);
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewYear(viewYear + 1); setViewMonth(0); }
    else setViewMonth(viewMonth + 1);
  }

  return (
    <div style={{ fontFamily: "Geist, -apple-system, Roboto, Helvetica, sans-serif" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-[#303030]">{monthLabel}</span>
        <div className="flex items-center gap-0.5">
          <button onClick={prevMonth} className="w-6 h-6 flex items-center justify-center rounded hover:bg-[#f0f0f0] text-[#717179]">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M6.5 2L3.5 5L6.5 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <button onClick={nextMonth} className="w-6 h-6 flex items-center justify-center rounded hover:bg-[#f0f0f0] text-[#717179]">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M3.5 2L6.5 5L3.5 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div key={i} className="text-center text-[10px] font-semibold text-[#999] py-0.5">{d}</div>
        ))}
      </div>

      {/* Weeks */}
      {weeks.map((week, wi) => (
        <div key={wi} className="grid grid-cols-7">
          {week.map((cell) => {
            const isToday = cell.dateStr === todayStr;
            const isSelected = cell.dateStr === selectedDate;
            const hasEvents = eventDates?.has(cell.dateStr);

            return (
              <button
                key={cell.dateStr}
                onClick={() => onDateClick?.(cell.dateStr)}
                className={`relative w-6 h-6 mx-auto flex items-center justify-center text-[10px] rounded-full transition-colors ${
                  isToday
                    ? "bg-[#013764] text-white font-semibold"
                    : isSelected
                      ? "bg-[#e8f1fd] text-[#013764] font-semibold"
                      : cell.isCurrentMonth
                        ? "text-[#303030] hover:bg-[#f5f5f5]"
                        : "text-[#ccc]"
                }`}
              >
                {cell.day}
                {hasEvents && !isToday && (
                  <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#013764]" />
                )}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
