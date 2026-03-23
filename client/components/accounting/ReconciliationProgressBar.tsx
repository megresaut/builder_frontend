interface ReconciliationProgressBarProps {
  taggedCount: number;
  totalCount: number;
}

export default function ReconciliationProgressBar({
  taggedCount,
  totalCount,
}: ReconciliationProgressBarProps) {
  const pct = totalCount > 0 ? Math.round((taggedCount / totalCount) * 100) : 0;

  return (
    <div className="flex items-center gap-3 min-w-[200px]">
      <div className="flex-1 h-2.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-green-500 rounded-full transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-sm text-gray-600 whitespace-nowrap">
        {taggedCount} of {totalCount} reconciled ({pct}%)
      </span>
    </div>
  );
}
