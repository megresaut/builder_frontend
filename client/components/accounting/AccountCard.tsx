import { Link } from "react-router-dom";

export interface AccountCardProps {
  to: string;
  name: string;
  subtitle?: string;
  balanceCents?: number | null;
  rightChip?: { label: string; tone?: "default" | "good" | "warn" | "info" } | null;
  badges?: { label: string; tone?: "default" | "good" | "warn" | "info" }[];
  meta?: { label: string; value: string }[];
}

function formatCents(cents: number | null | undefined): string {
  const v = typeof cents === "number" && Number.isFinite(cents) ? cents : 0;
  return (v / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

const toneClass: Record<string, string> = {
  default: "bg-gray-100 text-gray-700 border-gray-200",
  good: "bg-green-50 text-green-700 border-green-200",
  warn: "bg-amber-50 text-amber-800 border-amber-200",
  info: "bg-blue-50 text-blue-700 border-blue-200",
};

export default function AccountCard({
  to,
  name,
  subtitle,
  balanceCents,
  rightChip,
  badges,
  meta,
}: AccountCardProps) {
  return (
    <Link
      to={to}
      className="block bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="text-base font-semibold text-gray-900 truncate">{name}</div>
          {subtitle ? (
            <div className="text-xs text-gray-500 mt-0.5">{subtitle}</div>
          ) : null}
        </div>
        {rightChip ? (
          <span
            className={`text-xs px-2 py-0.5 rounded border ${
              toneClass[rightChip.tone ?? "default"]
            }`}
          >
            {rightChip.label}
          </span>
        ) : null}
      </div>

      {typeof balanceCents === "number" ? (
        <div className="mt-3 text-2xl font-semibold text-gray-900">
          {formatCents(balanceCents)}
        </div>
      ) : (
        <div className="mt-3 text-sm text-gray-400">balance unavailable</div>
      )}

      {badges && badges.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1">
          {badges.map((b, i) => (
            <span
              key={i}
              className={`text-xs px-2 py-0.5 rounded border ${
                toneClass[b.tone ?? "default"]
              }`}
            >
              {b.label}
            </span>
          ))}
        </div>
      ) : null}

      {meta && meta.length > 0 ? (
        <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
          {meta.map((m, i) => (
            <div key={i} className="flex flex-col">
              <span className="text-gray-500">{m.label}</span>
              <span className="text-gray-800 truncate">{m.value}</span>
            </div>
          ))}
        </div>
      ) : null}
    </Link>
  );
}
