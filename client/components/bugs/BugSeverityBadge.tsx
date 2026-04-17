import type { BugSeverity } from "@/data/bugs.mock";

const SEVERITY_STYLES: Record<BugSeverity, { label: string; classes: string }> = {
  low: { label: "Low", classes: "bg-gray-50 text-gray-700 border-gray-200" },
  medium: { label: "Medium", classes: "bg-yellow-50 text-yellow-800 border-yellow-200" },
  high: { label: "High", classes: "bg-orange-50 text-orange-700 border-orange-200" },
  blocker: { label: "Blocker", classes: "bg-red-50 text-red-700 border-red-200" },
};

export default function BugSeverityBadge({ severity }: { severity: BugSeverity }) {
  const s = SEVERITY_STYLES[severity];
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${s.classes}`}
    >
      {s.label}
    </span>
  );
}
