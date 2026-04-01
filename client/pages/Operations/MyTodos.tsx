import { useState, useMemo, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { type Todo, type Priority, listTodos, createTodo, updateTodo, deleteTodo } from "@/data/todos";

// ─── Config ───────────────────────────────────────────────────────────────────

const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; bg: string; dot: string }> = {
  high:   { label: "High",   color: "#DC2626", bg: "#FEF2F2", dot: "#DC2626" },
  normal: { label: "Normal", color: "#D97706", bg: "#FFFBEB", dot: "#D97706" },
  low:    { label: "Low",    color: "#6B7280", bg: "#F3F4F6", dot: "#9CA3AF" },
  none:   { label: "",       color: "",        bg: "",        dot: "#d4d4d4" },
};

const PRIORITY_ORDER: Priority[] = ["high", "normal", "low", "none"];

// ─── Date helpers ─────────────────────────────────────────────────────────────

function todayStr()    { return new Date().toISOString().slice(0, 10); }
function tomorrowStr() { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10); }
function eowStr()      { const d = new Date(); d.setDate(d.getDate() + (6 - d.getDay())); return d.toISOString().slice(0, 10); }
function enowStr()     { const d = new Date(eowStr()); d.setDate(d.getDate() + 7); return d.toISOString().slice(0, 10); }

function dueLabelFor(date: string | null): { text: string; urgent: boolean; overdue: boolean } {
  if (!date) return { text: "No due date", urgent: false, overdue: false };
  const t = todayStr(), tom = tomorrowStr();
  if (date < t)    return { text: "Overdue",   urgent: true,  overdue: true };
  if (date === t)  return { text: "Due today", urgent: true,  overdue: false };
  if (date === tom) return { text: "Due tomorrow", urgent: true, overdue: false };
  const d = new Date(date + "T00:00:00");
  return { text: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }), urgent: false, overdue: false };
}

type ReminderUnit = "minutes" | "hours" | "days";

function fmtOffset(minutes: number): string {
  if (minutes < 60)   return `${minutes} min before`;
  if (minutes < 1440) { const h = minutes / 60; return `${h} hr${h !== 1 ? "s" : ""} before`; }
  const d = minutes / 1440; return `${d} day${d !== 1 ? "s" : ""} before`;
}

function fmt12h(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

function offsetToAmountUnit(minutes: number): { amount: number; unit: ReminderUnit } {
  if (minutes % 1440 === 0) return { amount: minutes / 1440, unit: "days" };
  if (minutes % 60 === 0)   return { amount: minutes / 60,   unit: "hours" };
  return { amount: minutes, unit: "minutes" };
}

function amountUnitToMinutes(amount: number, unit: ReminderUnit): number {
  if (unit === "days")  return amount * 1440;
  if (unit === "hours") return amount * 60;
  return amount;
}

type Group = { label: string; items: Todo[]; overdue?: boolean };

function groupActive(todos: Todo[]): Group[] {
  const t = todayStr(), tom = tomorrowStr(), eow = eowStr(), enow = enowStr();
  const buckets: Record<string, Todo[]> = {
    Overdue: [], Today: [], Tomorrow: [], "This Week": [], "Next Week": [], Later: [], "No Due Date": [],
  };
  for (const item of todos) {
    if (!item.due_date)          { buckets["No Due Date"].push(item); continue; }
    if (item.due_date < t)       { buckets["Overdue"].push(item); continue; }
    if (item.due_date === t)     { buckets["Today"].push(item); continue; }
    if (item.due_date === tom)   { buckets["Tomorrow"].push(item); continue; }
    if (item.due_date <= eow)    { buckets["This Week"].push(item); continue; }
    if (item.due_date <= enow)   { buckets["Next Week"].push(item); continue; }
    buckets["Later"].push(item);
  }
  return Object.entries(buckets)
    .filter(([, items]) => items.length > 0)
    .map(([label, items]) => ({ label, items, overdue: label === "Overdue" }));
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function BellIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 20 20" fill="none">
      <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a2 2 0 002-2H8a2 2 0 002 2z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function CalIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 20 20" fill="none">
      <rect x="2.5" y="3.5" width="15" height="13" rx="2" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M13 1.5V5M7 1.5V5M2.5 8h15" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  );
}

function NoteIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 20 20" fill="none">
      <path d="M4 5h12M4 9h8M4 13h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
      <path d="M3 5h14M8 5V3h4v2M6 5l1 12h6l1-12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 20 20" fill="none">
      <path d="M14.5 2.5l3 3-10 10H4.5v-3l10-10z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function ChevronDown({ open }: { open: boolean }) {
  return (
    <svg width="12" height="12" viewBox="0 0 20 20" fill="none" className={cn("transition-transform duration-200", open ? "rotate-0" : "-rotate-90")}>
      <path d="M5 7.5l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// ─── Edit Popover ─────────────────────────────────────────────────────────────

// Compact inline reminder input: [number] [unit dropdown]  or  — None
function ReminderInput({ value, onChange }: { value: number | null; onChange: (v: number | null) => void }) {
  const { amount, unit } = value != null ? offsetToAmountUnit(value) : { amount: 30, unit: "minutes" as ReminderUnit };
  return (
    <div className="flex items-center gap-1.5">
      {value != null && (
        <>
          <input
            type="number" min={1} value={amount}
            onChange={(e) => onChange(amountUnitToMinutes(Math.max(1, parseInt(e.target.value) || 1), unit))}
            className="w-14 text-sm border border-[#e5e5e5] rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#7C3AED] text-center"
          />
          <select
            value={unit}
            onChange={(e) => onChange(amountUnitToMinutes(amount, e.target.value as ReminderUnit))}
            className="text-sm border border-[#e5e5e5] rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#7C3AED] bg-white"
          >
            <option value="minutes">min before</option>
            <option value="hours">hrs before</option>
            <option value="days">days before</option>
          </select>
          <button onClick={() => onChange(null)} className="text-xs text-[#a1a1a9] hover:text-[#525252] px-1 transition-colors" title="Remove reminder">✕</button>
        </>
      )}
      {value == null && (
        <button
          onClick={() => onChange(30)}
          className="flex items-center gap-1.5 text-xs text-[#7C3AED] hover:text-[#6D28D9] transition-colors"
        >
          <BellIcon />
          Add reminder
        </button>
      )}
    </div>
  );
}

function EditPopover({ todo, onSave, onClose }: { todo: Todo; onSave: (u: Partial<Todo>) => void; onClose: () => void }) {
  const [title, setTitle]                     = useState(todo.title);
  const [notes, setNotes]                     = useState(todo.notes);
  const [dueDate, setDueDate]                 = useState(todo.due_date ?? "");
  const [dueTime, setDueTime]                 = useState(todo.due_time ?? "");
  const [reminderOffset, setReminderOffset]   = useState<number | null>(todo.reminder_offset_minutes);
  const [priority, setPriority]               = useState<Priority>(todo.priority);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  return (
    <div ref={ref} className="absolute z-50 right-0 top-8 w-80 bg-white rounded-xl border border-[#e5e5e5] shadow-xl p-4 flex flex-col gap-3">
      <input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus
        className="w-full text-sm font-medium text-[#1a1a1a] border border-[#e5e5e5] rounded-lg px-3 py-2 focus:outline-none focus:border-[#013764]"
        placeholder="Title" />
      <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
        className="w-full text-sm text-[#525252] border border-[#e5e5e5] rounded-lg px-3 py-2 focus:outline-none focus:border-[#013764] resize-none"
        placeholder="Notes (optional)" />
      <div>
        <label className="text-[10px] font-semibold text-[#717179] uppercase tracking-wide block mb-1">Due</label>
        <div className="flex gap-2">
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
            className="flex-1 text-sm border border-[#e5e5e5] rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#013764]" />
          <input type="time" value={dueTime} onChange={(e) => setDueTime(e.target.value)}
            className="flex-1 text-sm border border-[#e5e5e5] rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#013764]" />
        </div>
      </div>
      <div>
        <label className="text-[10px] font-semibold text-[#717179] uppercase tracking-wide block mb-1.5">Remind me</label>
        <ReminderInput value={reminderOffset} onChange={setReminderOffset} />
      </div>
      <div>
        <label className="text-[10px] font-semibold text-[#717179] uppercase tracking-wide block mb-1.5">Priority</label>
        <div className="flex gap-1.5">
          {PRIORITY_ORDER.map((p) => (
            <button key={p} onClick={() => setPriority(p)}
              className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors",
                priority === p && p !== "none" ? "text-white border-transparent" :
                priority === p ? "bg-[#f3f4f6] text-[#6B7280] border-[#d1d5db]" :
                "bg-white text-[#717179] border-[#e5e5e5] hover:border-[#c0c0c0]")}
              style={priority === p && p !== "none" ? { backgroundColor: PRIORITY_CONFIG[p].color, borderColor: PRIORITY_CONFIG[p].color } : undefined}
            >
              {p !== "none" && <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: priority === p ? "white" : PRIORITY_CONFIG[p].dot }} />}
              {p === "none" ? "None" : PRIORITY_CONFIG[p].label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-1 border-t border-[#f0f0f0]">
        <button onClick={onClose} className="px-3 py-1.5 rounded-lg text-sm text-[#717179] hover:text-[#303030] hover:bg-[#f5f5f5] transition-colors">Cancel</button>
        <button onClick={() => { if (!title.trim()) return; onSave({ title: title.trim(), notes, due_date: dueDate || null, due_time: dueTime || null, reminder_offset_minutes: reminderOffset, priority }); onClose(); }}
          disabled={!title.trim()}
          className="px-3 py-1.5 rounded-lg text-sm font-medium bg-[#013764] text-white hover:bg-[#014578] disabled:opacity-40 transition-colors">
          Save
        </button>
      </div>
    </div>
  );
}

// ─── Todo Card ────────────────────────────────────────────────────────────────

function TodoCard({ todo, onToggle, onUpdate, onDelete }: {
  todo: Todo;
  onToggle: (id: number) => void;
  onUpdate: (id: number, u: Partial<Todo>) => void;
  onDelete: (id: number) => void;
}) {
  const [editing, setEditing]     = useState(false);
  const [completing, setCompleting] = useState(false);
  const isCompleted = !!todo.completed_at;
  const due = dueLabelFor(todo.due_date);
  const pri = PRIORITY_CONFIG[todo.priority];

  function handleCircleClick() {
    if (isCompleted) { onToggle(todo.id); return; }
    setCompleting(true);
    setTimeout(() => {
      setCompleting(false);
      onToggle(todo.id);
    }, 500);
  }

  const circleActive = isCompleted || completing;

  return (
    <div className={cn(
      "relative flex items-center gap-4 px-4 py-3.5 rounded-xl border bg-white transition-all group",
      isCompleted ? "border-[#f0f0f0] opacity-60" : "border-[#e8e8e8] hover:border-[#c0c0c0] hover:shadow-sm"
    )}>
      {/* Left: priority circle / complete button */}
      <button
        onClick={handleCircleClick}
        title={isCompleted ? "Mark incomplete" : "Mark complete"}
        className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300"
        style={{
          backgroundColor: circleActive ? "#22C55E" : (todo.priority !== "none" ? pri.bg : "#f5f5f5"),
          transform: completing ? "scale(1.15)" : "scale(1)",
        }}
      >
        {circleActive ? (
          <svg width="13" height="13" viewBox="0 0 20 20" fill="none"
            style={{ opacity: completing ? 1 : (isCompleted ? 1 : 0), transition: "opacity 0.15s" }}>
            <path d="M4 10l4 4 8-8" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ) : (
          <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="7" stroke={todo.priority !== "none" ? pri.dot : "#c0c0c0"} strokeWidth="1.8"/>
          </svg>
        )}
      </button>

      {/* Middle: title + meta */}
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-medium leading-snug", isCompleted ? "line-through text-[#a1a1a9]" : "text-[#1a1a1a]")}>
          {todo.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {todo.notes && (
            <span className="flex items-center gap-1 text-xs text-[#a1a1a9]">
              <NoteIcon />
              <span className="truncate max-w-[200px]">{todo.notes}</span>
            </span>
          )}
        </div>
      </div>

      {/* Right: due date + badges */}
      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
        <span className={cn("text-xs font-semibold", due.overdue ? "text-[#DC2626]" : due.urgent ? "text-[#D97706]" : "text-[#717179]")}>
          {due.text}{todo.due_time ? ` · ${fmt12h(todo.due_time)}` : ""}
        </span>
        <div className="flex items-center gap-1">
          {todo.reminder_offset_minutes != null && (
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#F5F3FF] text-[#7C3AED]">
              <BellIcon />
              {fmtOffset(todo.reminder_offset_minutes)}
            </span>
          )}
          {todo.priority !== "none" && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold" style={{ backgroundColor: pri.bg, color: pri.color }}>
              {pri.label}
            </span>
          )}
          {!isCompleted && (
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
              <button onClick={() => setEditing(true)} className="p-1 rounded text-[#a1a1a9] hover:text-[#525252] hover:bg-[#f5f5f5] transition-colors" title="Edit">
                <PencilIcon />
              </button>
              <button onClick={() => onDelete(todo.id)} className="p-1 rounded text-[#a1a1a9] hover:text-[#DC2626] hover:bg-[#FEF2F2] transition-colors" title="Delete">
                <TrashIcon />
              </button>
            </div>
          )}
        </div>
      </div>

      {editing && (
        <EditPopover todo={todo} onSave={(u) => onUpdate(todo.id, u)} onClose={() => setEditing(false)} />
      )}
    </div>
  );
}

// ─── Quick Add ────────────────────────────────────────────────────────────────

interface QuickAddData {
  title: string;
  notes: string;
  due_date: string | null;
  due_time: string | null;
  reminder_offset_minutes: number | null;
  priority: Priority;
}

function QuickAdd({ onAdd }: { onAdd: (t: QuickAddData) => void }) {
  const [title, setTitle]                   = useState("");
  const [notes, setNotes]                   = useState("");
  const [dueDate, setDueDate]               = useState("");
  const [dueTime, setDueTime]               = useState("");
  const [reminderOffset, setReminderOffset] = useState<number | null>(null);
  const [priority, setPriority]             = useState<Priority>("none");
  const [expanded, setExpanded]             = useState(false);

  function handleAdd() {
    if (!title.trim()) return;
    onAdd({ title: title.trim(), notes, due_date: dueDate || null, due_time: dueTime || null, reminder_offset_minutes: reminderOffset, priority });
    setTitle(""); setNotes(""); setDueDate(""); setDueTime(""); setReminderOffset(null); setPriority("none");
    setExpanded(false);
  }

  return (
    <div className="rounded-xl border border-[#e8e8e8] bg-white shadow-sm overflow-hidden mb-6">
      {/* Title row */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="w-8 h-8 rounded-full flex-shrink-0 bg-[#f5f5f5] flex items-center justify-center">
          <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="7" stroke="#c0c0c0" strokeWidth="1.8" strokeDasharray="3 2"/>
          </svg>
        </div>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") { setTitle(""); setExpanded(false); } }}
          onFocus={() => setExpanded(true)}
          placeholder="What do you need to do?"
          className="flex-1 text-sm text-[#1a1a1a] placeholder:text-[#b0b0b7] focus:outline-none bg-transparent"
        />
        {title.trim() && (
          <button onClick={handleAdd} className="flex-shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium bg-[#013764] text-white hover:bg-[#014578] transition-colors">
            Add
          </button>
        )}
      </div>

      {/* Expanded options */}
      {expanded && (
        <div className="border-t border-[#f5f5f5] px-4 pb-3.5 pt-3 flex flex-col gap-3">
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
            placeholder="Add a note (optional)"
            className="w-full text-sm text-[#525252] placeholder:text-[#c0c0c0] border border-[#e5e5e5] rounded-lg px-3 py-2 focus:outline-none focus:border-[#013764] resize-none" />

          <div className="flex items-center gap-3 flex-wrap">
            {/* Due date + time */}
            <div className="flex items-center gap-1.5 text-xs text-[#717179]">
              <CalIcon />
              <label className="font-medium">Due:</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                className="text-xs border-0 focus:outline-none text-[#525252] bg-transparent cursor-pointer" />
              <input type="time" value={dueTime} onChange={(e) => setDueTime(e.target.value)}
                className="text-xs border-0 focus:outline-none text-[#525252] bg-transparent cursor-pointer" />
            </div>

            <div className="w-px h-3.5 bg-[#e8e8e8]" />

            {/* Priority */}
            <div className="flex items-center gap-1.5">
              {PRIORITY_ORDER.map((p) => (
                <button key={p} onClick={() => setPriority(p === priority ? "none" : p)}
                  className={cn("flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border transition-colors",
                    priority === p && p !== "none" ? "text-white border-transparent" :
                    priority === p ? "bg-[#f3f4f6] text-[#6B7280] border-[#d1d5db]" :
                    "bg-white text-[#717179] border-[#e5e5e5] hover:border-[#c0c0c0]")}
                  style={priority === p && p !== "none" ? { backgroundColor: PRIORITY_CONFIG[p].color, borderColor: PRIORITY_CONFIG[p].color } : undefined}
                >
                  {p !== "none" && <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: priority === p ? "white" : PRIORITY_CONFIG[p].dot }} />}
                  {p === "none" ? "No priority" : PRIORITY_CONFIG[p].label}
                </button>
              ))}
            </div>
          </div>

          {/* Reminder — compact inline */}
          <div className="flex items-center gap-2 text-xs text-[#7C3AED]">
            <BellIcon />
            <span className="font-medium">Remind me:</span>
            <ReminderInput value={reminderOffset} onChange={setReminderOffset} />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MyTodos() {
  const [todos, setTodos]                       = useState<Todo[]>([]);
  const [loading, setLoading]                   = useState(true);
  const [filtersOpen, setFiltersOpen]           = useState(false);
  // multiselect: empty set = "all selected"
  const [filterPriorities, setFilterPriorities] = useState<Set<Priority>>(new Set());
  const [filterStatus, setFilterStatus]         = useState<"open" | "completed" | "all">("open");

  useEffect(() => {
    listTodos("all")
      .then(setTodos)
      .finally(() => setLoading(false));
  }, []);

  const activeFilterCount = filterPriorities.size + (filterStatus !== "open" ? 1 : 0);

  function togglePriority(p: Priority) {
    setFilterPriorities((prev) => {
      const next = new Set(prev);
      next.has(p) ? next.delete(p) : next.add(p);
      return next;
    });
  }

  function clearFilters() {
    setFilterPriorities(new Set());
    setFilterStatus("open");
  }

  const visibleTodos = useMemo(() =>
    todos
      .filter((t) => {
        const isCompleted = !!t.completed_at;
        if (filterStatus === "open"      && isCompleted)  return false;
        if (filterStatus === "completed" && !isCompleted) return false;
        if (filterPriorities.size > 0 && !filterPriorities.has(t.priority)) return false;
        return true;
      })
      .sort((a, b) => {
        if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date);
        if (a.due_date) return -1;
        if (b.due_date) return 1;
        return PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority);
      }),
    [todos, filterPriorities, filterStatus]
  );

  const active    = useMemo(() => visibleTodos.filter((t) => !t.completed_at), [visibleTodos]);
  const completed = useMemo(() => visibleTodos.filter((t) => !!t.completed_at)
    .sort((a, b) => (b.completed_at ?? "").localeCompare(a.completed_at ?? "")), [visibleTodos]);

  const groups = useMemo(() => groupActive(active), [active]);

  async function handleAdd(data: QuickAddData) {
    const created = await createTodo({
      title: data.title,
      notes: data.notes,
      due_date: data.due_date,
      due_time: data.due_time,
      reminder_offset_minutes: data.reminder_offset_minutes,
      priority: data.priority,
    });
    setTodos((prev) => [...prev, created]);
  }

  async function handleToggle(id: number) {
    const todo = todos.find((t) => t.id === id);
    if (!todo) return;
    const newCompletedAt = todo.completed_at ? null : new Date().toISOString();
    // Optimistic update
    setTodos((prev) => prev.map((t) => t.id === id ? { ...t, completed_at: newCompletedAt } : t));
    try {
      const updated = await updateTodo(id, {
        title: todo.title,
        notes: todo.notes,
        due_date: todo.due_date,
        due_time: todo.due_time,
        reminder_offset_minutes: todo.reminder_offset_minutes,
        priority: todo.priority,
        completed_at: newCompletedAt,
      });
      setTodos((prev) => prev.map((t) => t.id === id ? updated : t));
    } catch {
      // Revert on failure
      setTodos((prev) => prev.map((t) => t.id === id ? todo : t));
    }
  }

  async function handleUpdate(id: number, updates: Partial<Todo>) {
    const todo = todos.find((t) => t.id === id);
    if (!todo) return;
    // Optimistic update
    setTodos((prev) => prev.map((t) => t.id === id ? { ...t, ...updates } : t));
    try {
      const merged = { ...todo, ...updates };
      const updated = await updateTodo(id, {
        title: merged.title,
        notes: merged.notes,
        due_date: merged.due_date,
        due_time: merged.due_time,
        reminder_offset_minutes: merged.reminder_offset_minutes,
        priority: merged.priority,
        completed_at: merged.completed_at,
      });
      setTodos((prev) => prev.map((t) => t.id === id ? updated : t));
    } catch {
      // Revert on failure
      setTodos((prev) => prev.map((t) => t.id === id ? todo : t));
    }
  }

  async function handleDelete(id: number) {
    // Optimistic update
    setTodos((prev) => prev.filter((t) => t.id !== id));
    try {
      await deleteTodo(id);
    } catch {
      // Revert on failure
      const data = await listTodos("all");
      setTodos(data);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-[#a1a1a9]">
        <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray="31.4" strokeDashoffset="10"/>
        </svg>
      </div>
    );
  }

  return (
    <div className="flex flex-col px-8 pt-6 pb-8">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h2 className="text-lg font-semibold text-[#1a1a1a]">To-Dos</h2>
          <p className="text-sm text-[#717179] mt-0.5">Personal reminders — only visible to you</p>
        </div>

        <button
          onClick={() => setFiltersOpen((v) => !v)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors flex-shrink-0 mt-0.5",
            filtersOpen || activeFilterCount > 0
              ? "bg-[#013764] text-white border-[#013764]"
              : "bg-white text-[#555] border-[#e5e5e5] hover:border-[#c0c0c0]"
          )}
        >
          <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
            <path d="M3 5h14M6 10h8M9 15h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          Filters
          {activeFilterCount > 0 && (
            <span className="flex items-center justify-center w-4 h-4 rounded-full bg-white text-[#013764] text-[10px] font-bold">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* ── Collapsible filters ── */}
      {filtersOpen && (
        <div className="mb-4 p-3 rounded-xl border border-[#e8e8e8] bg-[#fafafa] flex flex-wrap items-center gap-x-6 gap-y-2">
          {/* Status */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-[#717179] mr-0.5">Status:</span>
            {(["open", "completed", "all"] as const).map((s) => (
              <button key={s} onClick={() => setFilterStatus(s)}
                className={cn("px-2.5 py-1 rounded-full text-xs font-medium border transition-colors capitalize",
                  filterStatus === s ? "bg-[#013764] text-white border-[#013764]" : "bg-white text-[#555] border-[#e5e5e5] hover:border-[#c0c0c0]")}>
                {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>

          <div className="w-px h-4 bg-[#e5e5e5] self-center hidden sm:block" />

          {/* Priority — multiselect */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-[#717179] mr-0.5">Priority:</span>
            {(["high", "normal", "low", "none"] as Priority[]).map((p) => {
              const active = filterPriorities.has(p);
              return (
                <button key={p} onClick={() => togglePriority(p)}
                  className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors",
                    active ? "bg-[#013764] text-white border-[#013764]" : "bg-white text-[#555] border-[#e5e5e5] hover:border-[#c0c0c0]")}
                >
                  {p !== "none" && <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: active ? "white" : PRIORITY_CONFIG[p].dot }} />}
                  {p === "none" ? "No priority" : PRIORITY_CONFIG[p].label}
                </button>
              );
            })}
          </div>

          {activeFilterCount > 0 && (
            <button onClick={clearFilters} className="ml-auto text-xs text-[#a1a1a9] hover:text-[#555] transition-colors">
              Clear all
            </button>
          )}
        </div>
      )}

      {/* ── Quick Add ── */}
      <QuickAdd onAdd={handleAdd} />

      {/* ── Active groups ── */}
      {groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-[#a1a1a9]">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="mb-3">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2M12 12v4M10 14h4"
              stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <p className="text-sm font-medium">All done!</p>
          <p className="text-xs mt-1">Add a to-do above to get started</p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {groups.map(({ label, items, overdue }) => (
            <div key={label}>
              <div className="flex items-center gap-3 mb-3">
                <span className={cn("text-xs font-semibold uppercase tracking-wide whitespace-nowrap", overdue ? "text-[#DC2626]" : "text-[#717179]")}>
                  {label}
                </span>
                <div className={cn("flex-1 h-px", overdue ? "bg-[#FECACA]" : "bg-[#e8e8e8]")} />
                <span className="text-xs text-[#a1a1a9]">{items.length} item{items.length !== 1 ? "s" : ""}</span>
              </div>
              <div className="flex flex-col gap-2">
                {items.map((todo) => (
                  <TodoCard key={todo.id} todo={todo} onToggle={handleToggle} onUpdate={handleUpdate} onDelete={handleDelete} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Completed (shown inline when status filter = completed, or collapsed at bottom otherwise) ── */}
      {completed.length > 0 && filterStatus !== "completed" && (
        <div className="mt-8">
          <button onClick={() => setFilterStatus("completed")} className="flex items-center gap-3 w-full mb-3 group">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#a1a1a9] whitespace-nowrap flex items-center gap-1.5 group-hover:text-[#717179] transition-colors">
              Completed
            </span>
            <div className="flex-1 h-px bg-[#f0f0f0]" />
            <span className="text-xs text-[#a1a1a9] hover:text-[#525252] transition-colors">
              Show {completed.length} →
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
