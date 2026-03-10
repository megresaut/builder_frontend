import type { BusyUser } from "@/data/availability";

interface ConflictWarningBannerProps {
  conflicts: BusyUser[];
}

export default function ConflictWarningBanner({
  conflicts,
}: ConflictWarningBannerProps) {
  if (conflicts.length === 0) return null;

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
      <div className="flex items-start gap-2">
        <svg
          className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0"
          viewBox="0 0 16 16"
          fill="currentColor"
        >
          <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 2.5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 018 3.5zm0 7.5a.75.75 0 100-1.5.75.75 0 000 1.5z" />
        </svg>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-amber-800">
            Scheduling Conflict
          </p>
          <div className="mt-1 space-y-0.5">
            {conflicts.map((c, i) => (
              <p key={i} className="text-xs text-amber-700">
                <span className="font-medium">{c.user_name}</span>
                {" is "}
                <span className="font-medium">
                  {c.availability_type === "ooo"
                    ? "out of office"
                    : c.availability_type}
                </span>
                {c.title ? ` (${c.title})` : ""}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
