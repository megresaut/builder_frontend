import React from "react";
import SectionCard from "@/components/SectionCard";
import LinkedTasksList from "@/components/LinkedTasksList";
import type { LinkedTaskData } from "@/components/LinkTaskModal";

interface LinkedTasksCardProps {
  linkedTasks?: LinkedTaskData[];
  onLinkTasks?: () => void;
  onUnlinkTask?: (taskId: string | number) => void;
  onTaskClick?: (taskId: string | number) => void;
}

/**
 * LinkedTasksCard
 *
 * Wrapper around LinkedTasksList using SectionCard layout.
 */
export const LinkedTasksCard: React.FC<LinkedTasksCardProps> = ({
  linkedTasks = [],
  onLinkTasks,
  onUnlinkTask,
  onTaskClick,
}) => {
  return (
    <SectionCard padding="compact">
      <LinkedTasksList
        linkedTasks={linkedTasks}
        onAdd={onLinkTasks || (() => {})}
        onUnlink={onUnlinkTask || (() => {})}
        onTaskClick={onTaskClick}
      />
    </SectionCard>
  );
};

export default LinkedTasksCard;
