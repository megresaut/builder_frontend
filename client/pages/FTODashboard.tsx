import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchJSON } from "@/api/fetchJSON";
import { useAuth } from "@/auth/useAuth";
import { BuildingIcon } from "@/components/icons";

type ItemType = "fto" | "inspection" | "work_order";
type Priority = "low" | "normal" | "high";

interface MyDayItem {
  key: string;
  id: number;
  type: ItemType;
  title: string;
  property: string;
  address: string; // for mapping (property_name without "(C) " prefix)
  dueDate: string | null;
  priority?: Priority;
  status: string;
}

function cleanAddress(propertyName: string | undefined | null): string {
  if (!propertyName) return "";
  return propertyName.replace(/^\(C\)\s*/i, "").trim();
}

function isAppleDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const platform = (navigator as any).platform || "";
  return /iPhone|iPad|iPod|Macintosh/.test(ua) || /iPhone|iPad|iPod|Mac/.test(platform);
}

function buildGoogleMapsUrl(origin: string | null, stops: string[]): string {
  if (stops.length === 0) return "";
  const destination = stops[stops.length - 1];
  const waypoints = stops.slice(0, -1);
  const params = new URLSearchParams();
  params.set("api", "1");
  if (origin) params.set("origin", origin);
  params.set("destination", destination);
  if (waypoints.length > 0) params.set("waypoints", waypoints.join("|"));
  params.set("travelmode", "driving");
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

function buildAppleMapsUrl(origin: string | null, stops: string[]): string {
  if (stops.length === 0) return "";
  const daddr = stops.map((s) => encodeURIComponent(s)).join("+to:");
  const saddr = origin ? `saddr=${encodeURIComponent(origin)}&` : "";
  return `https://maps.apple.com/?${saddr}daddr=${daddr}&dirflg=d`;
}

async function getCurrentLocation(): Promise<string | null> {
  if (typeof navigator === "undefined" || !navigator.geolocation) return null;
  return new Promise((resolve) => {
    const timeout = setTimeout(() => resolve(null), 6000);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(timeout);
        resolve(`${pos.coords.latitude},${pos.coords.longitude}`);
      },
      () => {
        clearTimeout(timeout);
        resolve(null);
      },
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 },
    );
  });
}

const TYPE_LABEL: Record<ItemType, string> = {
  fto: "Field Team Order",
  inspection: "Inspection",
  work_order: "Work Order",
};

const TYPE_BADGE: Record<ItemType, string> = {
  fto: "bg-blue-50 text-blue-700 border-blue-200",
  inspection: "bg-purple-50 text-purple-700 border-purple-200",
  work_order: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const PRIORITY_DOT: Record<Priority, string> = {
  low: "bg-gray-400",
  normal: "bg-blue-500",
  high: "bg-orange-500",
};

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function sameDay(a: Date, b: Date): boolean {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function formatSelectedDateLabel(d: Date): string {
  const today = new Date();
  if (sameDay(d, today)) return "Today";
  if (sameDay(d, addDays(today, -1))) return "Yesterday";
  if (sameDay(d, addDays(today, 1))) return "Tomorrow";
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function humanizeStatus(s: string): string {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// Returns a time string (e.g. "1:10 PM") when the timestamp has a non-midnight-UTC
// time component. Legacy inspections stored as a DATE were widened to TIMESTAMPTZ
// at midnight UTC (migration 037), so those render without a time.
function formatTimeIfPresent(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  if (d.getUTCHours() === 0 && d.getUTCMinutes() === 0 && d.getUTCSeconds() === 0) return null;
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function toInputDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function FTODashboard() {
  const navigate = useNavigate();
  const { userId } = useAuth();
  const [allItems, setAllItems] = useState<MyDayItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(() => startOfDay(new Date()));

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [ftos, inspections, workOrders] = await Promise.all([
          fetchJSON(`/maintenance/ftos?field_team_member_id=${userId}`).catch(() => []),
          fetchJSON(`/inspections?assigned_field_team_member_id=${userId}`).catch(() => []),
          fetchJSON(`/maintenance/work-orders?assignee_user_id=${userId}&limit=200`).catch(() => []),
        ]);

        const ftoItems: MyDayItem[] = (Array.isArray(ftos) ? ftos : [])
          .filter((f: any) => f.form_submission_status === "none" && f.status !== "cancelled" && f.due_date)
          .map((f: any) => ({
            key: `fto-${f.id}`,
            id: f.id,
            type: "fto",
            title: f.name,
            property: [f.property_name, f.unit_name].filter(Boolean).join(" — "),
            address: cleanAddress(f.property_name),
            dueDate: f.due_date,
            priority: (f.priority as Priority) ?? "normal",
            status: humanizeStatus(f.status ?? "pending"),
          }));

        const inspectionItems: MyDayItem[] = (Array.isArray(inspections) ? inspections : [])
          .filter((i: any) => i.status !== "submitted" && i.status !== "reviewed" && i.due_date)
          .map((i: any) => ({
            key: `inspection-${i.id}`,
            id: i.id,
            type: "inspection",
            title: i.property_name || "Property Inspection",
            property: i.property_name ?? "",
            address: cleanAddress(i.property_name),
            dueDate: i.due_date,
            status: humanizeStatus(i.status ?? "draft"),
          }));

        const workOrderItems: MyDayItem[] = (Array.isArray(workOrders) ? workOrders : [])
          .filter((w: any) => w.status !== "completed" && w.status !== "cancelled" && w.due_date)
          .map((w: any) => ({
            key: `wo-${w.id}`,
            id: w.id,
            type: "work_order",
            title: w.name,
            property: [w.property_name, w.unit_name].filter(Boolean).join(" — "),
            address: cleanAddress(w.property_name),
            dueDate: w.due_date,
            priority: (w.priority as Priority) ?? "normal",
            status: humanizeStatus(w.status ?? "scheduled"),
          }));

        const combined = [...ftoItems, ...inspectionItems, ...workOrderItems];
        if (!cancelled) setAllItems(combined);
      } catch (err) {
        console.error("Failed to load My Day:", err);
        if (!cancelled) setError("Failed to load your day");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const itemsForDay = useMemo(() => {
    return allItems
      .filter((it) => it.dueDate && sameDay(new Date(it.dueDate), selectedDate))
      .sort((a, b) => {
        const aT = a.dueDate ? new Date(a.dueDate).getTime() : 0;
        const bT = b.dueDate ? new Date(b.dueDate).getTime() : 0;
        return aT - bT;
      });
  }, [allItems, selectedDate]);

  const daysWithItems = useMemo(() => {
    const set = new Set<number>();
    for (const it of allItems) {
      if (it.dueDate) set.add(startOfDay(new Date(it.dueDate)).getTime());
    }
    return set;
  }, [allItems]);

  const handleItemClick = (item: MyDayItem) => {
    if (item.type === "fto") {
      navigate("/fto/orders", { state: { openOrderId: item.id } });
    } else if (item.type === "inspection") {
      navigate(`/fto/inspections/${item.id}`);
    } else {
      navigate(`/fto/work-orders/${item.id}`);
    }
  };

  const countLabel = `${itemsForDay.length} task${itemsForDay.length === 1 ? "" : "s"}`;
  const today = startOfDay(new Date());
  const isToday = sameDay(selectedDate, today);

  const [mapOpen, setMapOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  const [originCoords, setOriginCoords] = useState<string | null>(null);
  const [useMyLocation, setUseMyLocation] = useState(true);

  const mappableStops = useMemo(
    () => itemsForDay.filter((it) => it.address && it.address.length > 0),
    [itemsForDay],
  );
  const uniqueStops = useMemo(() => {
    const seen = new Set<string>();
    const out: { address: string; title: string }[] = [];
    for (const it of mappableStops) {
      if (!seen.has(it.address)) {
        seen.add(it.address);
        out.push({ address: it.address, title: it.title });
      }
    }
    return out;
  }, [mappableStops]);

  const openMapSheet = async () => {
    setMapOpen(true);
    if (useMyLocation && !originCoords) {
      setLocating(true);
      const coords = await getCurrentLocation();
      setOriginCoords(coords);
      setLocating(false);
    }
  };

  const openInMaps = (provider: "google" | "apple") => {
    const origin = useMyLocation ? originCoords : null;
    const stops = uniqueStops.map((s) => s.address);
    const url =
      provider === "google"
        ? buildGoogleMapsUrl(origin, stops)
        : buildAppleMapsUrl(origin, stops);
    if (url) window.open(url, "_blank", "noopener");
  };

  const canMap = uniqueStops.length > 0;
  const showAppleMaps = isAppleDevice();

  return (
    <div className="px-4 py-5 sm:px-6 sm:py-6 max-w-3xl mx-auto">
      <div className="mb-5 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Home</h1>
          <p className="text-sm text-gray-600 mt-1">
            Welcome to your field team dashboard
          </p>
        </div>
        <button
          onClick={() => navigate("/field-team-orders")}
          className="flex h-9 items-center gap-2 px-3 rounded-lg border border-[#DADADA] bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] hover:bg-gray-50 transition-colors text-[#303030]"
        >
          <BuildingIcon width={20} height={20} />
          <span className="font-medium text-base leading-normal">
            Main Portal
          </span>
        </button>
      </div>

      <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 sm:px-5 sm:py-4 border-b border-gray-100">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-900">My Day</h2>
            <div className="flex items-center gap-2 flex-shrink-0">
              {canMap && (
                <button
                  type="button"
                  onClick={openMapSheet}
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full border border-[#013764] text-[#013764] text-xs font-semibold hover:bg-blue-50 active:bg-blue-100 touch-manipulation"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
                    <line x1="8" y1="2" x2="8" y2="18" />
                    <line x1="16" y1="6" x2="16" y2="22" />
                  </svg>
                  Map my day
                </button>
              )}
              <span className="text-xs font-medium text-gray-600 bg-gray-100 rounded-full px-2.5 py-1">
                {loading ? "…" : countLabel}
              </span>
            </div>
          </div>

          {/* Date picker row */}
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedDate((d) => addDays(d, -1))}
              className="flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 hover:bg-gray-50 active:bg-gray-100 text-gray-700 touch-manipulation"
              aria-label="Previous day"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>

            <div className="flex-1 min-w-0 relative">
              <label className="flex items-center justify-between gap-2 px-3 h-9 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-semibold text-gray-900 leading-tight truncate">
                    {formatSelectedDateLabel(selectedDate)}
                  </span>
                  <span className="text-[11px] text-gray-500 leading-tight">
                    {selectedDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500 flex-shrink-0">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <input
                  type="date"
                  value={toInputDate(selectedDate)}
                  onChange={(e) => {
                    const [y, m, d] = e.target.value.split("-").map(Number);
                    if (y && m && d) setSelectedDate(new Date(y, m - 1, d));
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </label>
            </div>

            <button
              type="button"
              onClick={() => setSelectedDate((d) => addDays(d, 1))}
              className="flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 hover:bg-gray-50 active:bg-gray-100 text-gray-700 touch-manipulation"
              aria-label="Next day"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>

            {!isToday && (
              <button
                type="button"
                onClick={() => setSelectedDate(today)}
                className="h-9 px-3 rounded-lg text-sm font-medium text-[#013764] hover:bg-blue-50 active:bg-blue-100 touch-manipulation"
              >
                Today
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="px-4 py-10 text-center text-sm text-gray-500">
            Loading your day…
          </div>
        ) : error ? (
          <div className="px-4 py-10 text-center text-sm text-red-600">{error}</div>
        ) : itemsForDay.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-gray-500">
            Nothing scheduled for {formatSelectedDateLabel(selectedDate).toLowerCase()}.
            {daysWithItems.size > 0 && (
              <div className="mt-1 text-xs text-gray-400">
                Use the arrows or date picker to view other days.
              </div>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {itemsForDay.map((item) => (
              <li key={item.key}>
                <button
                  type="button"
                  onClick={() => handleItemClick(item)}
                  className="w-full text-left px-4 py-3 sm:px-5 sm:py-4 flex gap-3 active:bg-gray-50 hover:bg-gray-50 transition-colors touch-manipulation"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-semibold text-gray-900 leading-snug break-words">
                        {item.title}
                      </h3>
                      {item.priority && (
                        <span className="flex items-center gap-1 text-xs text-gray-600 flex-shrink-0">
                          <span className={`w-2 h-2 rounded-full ${PRIORITY_DOT[item.priority]}`} />
                          <span className="capitalize">{item.priority}</span>
                        </span>
                      )}
                    </div>

                    <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${TYPE_BADGE[item.type]}`}>
                        {TYPE_LABEL[item.type]}
                      </span>
                      <span className="text-xs text-gray-500">{item.status}</span>
                      {formatTimeIfPresent(item.dueDate) && (
                        <span className="text-xs text-gray-500">· {formatTimeIfPresent(item.dueDate)}</span>
                      )}
                    </div>

                    {item.property && (
                      <p className="mt-1.5 text-xs text-gray-600 break-words">{item.property}</p>
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {mapOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center"
          onClick={() => setMapOpen(false)}
        >
          <div
            className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-gray-900">Map my day</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {uniqueStops.length} stop{uniqueStops.length === 1 ? "" : "s"} in order
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMapOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500"
                aria-label="Close"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="px-5 py-3 border-b border-gray-100">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useMyLocation}
                  onChange={async (e) => {
                    const next = e.target.checked;
                    setUseMyLocation(next);
                    if (next && !originCoords) {
                      setLocating(true);
                      const coords = await getCurrentLocation();
                      setOriginCoords(coords);
                      setLocating(false);
                    }
                  }}
                  className="mt-0.5 w-4 h-4 accent-[#013764]"
                />
                <div className="text-sm text-gray-900">
                  Start from my current location
                  <div className="text-xs text-gray-500 mt-0.5">
                    {locating
                      ? "Getting your location…"
                      : useMyLocation
                        ? originCoords
                          ? "Location ready"
                          : "Location unavailable — will start at the first stop"
                        : "Route will start at the first stop"}
                  </div>
                </div>
              </label>
            </div>

            <ol className="flex-1 overflow-auto px-5 py-3 space-y-2">
              {uniqueStops.map((s, idx) => (
                <li key={`${s.address}-${idx}`} className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#013764] text-white text-xs font-semibold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 break-words">{s.title}</div>
                    <div className="text-xs text-gray-600 break-words">{s.address}</div>
                  </div>
                </li>
              ))}
            </ol>

            <div className="px-5 py-4 border-t border-gray-100 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => openInMaps("google")}
                className="w-full h-11 rounded-lg bg-[#013764] text-white text-sm font-semibold hover:bg-[#012a4f] active:bg-[#011f3a] touch-manipulation"
              >
                Open in Google Maps
              </button>
              {showAppleMaps && (
                <button
                  type="button"
                  onClick={() => openInMaps("apple")}
                  className="w-full h-11 rounded-lg border border-gray-300 text-gray-900 text-sm font-semibold hover:bg-gray-50 active:bg-gray-100 touch-manipulation"
                >
                  Open in Apple Maps
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
