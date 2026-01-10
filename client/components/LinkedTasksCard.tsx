import React from "react";
import { Link } from "lucide-react";
import SectionCard from "@/components/SectionCard";

interface LinkedTask {
  id: string | number;
  name: string;
  href?: string;
}

interface LinkedTasksCardProps {
  linkedTasks?: LinkedTask[];
  count?: number;
  onLinkTasks?: () => void;
}

/**
 * LinkedTasksCard
 *
 * Displays linked tasks with option to add more.
 * Composed using SectionCard.
 */
export const LinkedTasksCard: React.FC<LinkedTasksCardProps> = ({
  linkedTasks,
  count = 0,
  onLinkTasks,
}) => {
  return (
    <SectionCard
      title="Linked tasks"
      actions={
        onLinkTasks && (
          <button
            onClick={onLinkTasks}
            className="flex items-center gap-1 text-[#2463eb] tracking-[-0.32px] hover:underline"
          >
            <Link className="w-4 h-4" />
            <span>Link tasks</span>
          </button>
        )
      }
    >
      {/* Empty State */}
      {!linkedTasks || linkedTasks.length === 0 ? (
        <div className="flex items-center justify-center min-h-[72px] w-full px-3 py-7 bg-white border border-[#dadada] rounded-lg text-sm text-[#09090b]">
          No linked tasks yet
        </div>
      ) : (
        <div className="flex flex-col gap-2 mt-4">
          {linkedTasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center gap-2 px-4 py-3 bg-white border border-[#e5e5e5] rounded-lg text-sm"
            >
              {task.href ? (
                <a
                  href={task.href}
                  className="text-[#2463eb] font-medium hover:underline"
                >
                  {task.name}
                </a>
              ) : (
                <span className="text-[#303030] font-medium">{task.name}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
};

export default LinkedTasksCard;
