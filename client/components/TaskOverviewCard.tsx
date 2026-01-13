import React, { ReactNode } from "react";
import { EditIcon } from "@/components/icons";
import SectionCard from "@/components/SectionCard";
import TaskStatusBadge from "@/components/TaskStatusBadge";
import TaskPriorityBadge from "@/components/TaskPriorityBadge";
import PersonAvatars from "@/components/PersonAvatars";

interface TaskOverviewCardProps {
  category?: string;
  description?: string;
  dueDate?: string;
  status?: string;
  priority?: string;
  stats?: {
    label: string;
    value: string;
  }[];
  createdBy?: {
    name: string;
    property?: string;
    email?: string;
    phone?: string;
    title?: string;
  };
  createdDate?: string;
  onEdit?: () => void;
  variant?: "default" | "gray";
}

/**
 * TaskOverviewCard
 *
 * Displays task overview with category, description, and key stats.
 * Composed using SectionCard.
 */
export const TaskOverviewCard: React.FC<TaskOverviewCardProps> = ({
  category,
  description,
  dueDate,
  status,
  priority,
  stats,
  createdBy,
  createdDate,
  onEdit,
  variant = "default",
}) => {
  return (
    <SectionCard
      variant={variant}
      title={<span className="text-[#303030] text-[22px] font-semibold leading-[1.36]">To-Do - #I 1024431</span>}
      actions={
        onEdit && (
          <div className="flex items-center gap-1 text-sm text-[#717179] tracking-[-0.28px]">
            <span>Created</span>
            {createdDate && <span>{createdDate}</span>}
            <button
              onClick={onEdit}
              className="flex items-center gap-1 ml-2 text-[#2463eb] hover:underline"
            >
              <EditIcon width={16} height={16} />
              <span className="font-medium">Edit</span>
            </button>
          </div>
        )
      }
    >
      {/* Last Updated Info */}
      {createdDate && (
        <div className="text-sm text-[#717179] font-medium">
          Last Updated <span className="text-[#303030] font-bold">{createdDate}</span>
        </div>
      )}

      {/* Created By Info */}
      {createdBy && (
        <div className="mt-2 text-sm text-[#717179] font-medium flex items-center gap-2">
          <span>Created by</span>
          <PersonAvatars
            people={[
              {
                id: "creator",
                name: createdBy.name,
                initials: createdBy.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2),
                email: createdBy.email,
                phone: createdBy.phone,
                title: createdBy.title,
              },
            ]}
            type="assignee"
            size="sm"
          />
          {createdBy.property && (
            <>
              {" "}
              for{" "}
              <span className="font-bold text-[#2463eb]">
                {createdBy.property}
              </span>
            </>
          )}
        </div>
      )}

      {/* Category */}
      {category && (
        <div className="flex flex-wrap mt-5 w-full items-start text-sm text-[#717179] gap-y-2">
          <div className="flex items-center gap-1 min-w-[200px]">
            <span className="font-semibold">Category:</span>
            <span className="font-medium">{category}</span>
          </div>
        </div>
      )}

      {/* Description */}
      {description && (
        <>
          <div className="mt-5 text-sm text-[#717179] font-semibold">
            Description:
          </div>
          <div className="mt-2 text-sm text-[#717179] font-medium leading-4">
            {description}
          </div>
        </>
      )}

      {/* Stats */}
      {stats && stats.length > 0 && (
        <>
          <div className="w-full h-px bg-[#e5e5e5] mt-5"></div>
          <div className="flex items-center gap-8 mt-5 flex-wrap">
            {stats.map((stat, idx) => (
              <div key={idx} className="flex flex-col items-center">
                <div className="text-sm text-[#717179]">{stat.label}</div>
                <div className="mt-1 text-2xl text-[#303030] font-medium">
                  {stat.value}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </SectionCard>
  );
};

export default TaskOverviewCard;
