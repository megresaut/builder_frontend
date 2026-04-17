import type { BugStatus } from "@/data/bugs.mock";

const STATUS_STYLES: Record<BugStatus, { label: string; classes: string }> = {
  open: { label: "Open", classes: "bg-[#E6EEF5] text-[#013764] border-[#B8CCDD]" },
  triaged: { label: "Triaged", classes: "bg-purple-50 text-purple-700 border-purple-200" },
  in_progress: { label: "In Progress", classes: "bg-amber-50 text-amber-700 border-amber-200" },
  resolved: { label: "Resolved", classes: "bg-green-50 text-green-700 border-green-200" },
  wont_fix: { label: "Won't Fix", classes: "bg-gray-100 text-gray-600 border-gray-200" },
};

export default function BugStatusBadge({ status }: { status: BugStatus }) {
  const s = STATUS_STYLES[status];
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${s.classes}`}
    >
      {s.label}
    </span>
  );
}
