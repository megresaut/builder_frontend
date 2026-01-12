import React from "react";
import { EditIcon, DeleteIcon } from "@/components/icons";
import PopoverActionsDropdown from "@/components/PopoverActionsDropdown";
import {
  SectionRowTemplate,
  SectionActionTemplate,
  EmptyStateTemplate,
  RecordListTemplate,
  RecordRowTemplate,
} from "@/components/templates";
import type { LinkedTaskData } from "@/components/LinkTaskModal";

interface LinkedTasksListProps {
  linkedTasks: LinkedTaskData[];
  onAdd: () => void;
  onUnlink: (taskId: string | number) => void;
  emptyMessage?: string;
}

/**
 * LinkedTasksList
 *
 * Displays linked tasks with unlink actions.
 * Mirrors NotesTemplate layout and formatting.
 */
export const LinkedTasksList: React.FC<LinkedTasksListProps> = ({
  linkedTasks,
  onAdd,
  onUnlink,
  emptyMessage = "No linked tasks yet",
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "not_started":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completed":
        return "Completed";
      case "in_progress":
        return "In Progress";
      case "not_started":
        return "Not Started";
      default:
        return status;
    }
  };

  return (
    <SectionRowTemplate isLast={true}>
      <div className="flex items-center justify-between gap-4 flex-wrap font-medium">
        <h2 className="text-[#303030] text-base font-medium leading-[1.1]">
          Linked Tasks
        </h2>
        <SectionActionTemplate label="Link" onClick={onAdd} />
      </div>

      {linkedTasks.length === 0 ? (
        <EmptyStateTemplate message={emptyMessage} />
      ) : (
        <RecordListTemplate>
          {linkedTasks.map((task, idx) => (
            <RecordRowTemplate
              key={task.id}
              isLast={idx === linkedTasks.length - 1}
              leftSlot={
                <div className="flex-1">
                  <a
                    href={`/tasks/${task.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#2463eb] font-medium text-sm hover:underline cursor-pointer"
                  >
                    {task.name}
                  </a>
                  <div className="flex items-center gap-4 mt-2">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(
                        task.status
                      )}`}
                    >
                      {getStatusLabel(task.status)}
                    </span>
                    <div className="flex items-center gap-8 text-xs text-[#71717A]">
                      <span>{task.updatedDate}</span>
                      <span>{task.updatedBy}</span>
                    </div>
                  </div>
                </div>
              }
              rightSlot={
                <PopoverActionsDropdown
                  row={task}
                  rowKey="id"
                  actions={[
                    {
                      label: "Unlink",
                      icon: (
                        <DeleteIcon
                          width={18}
                          height={18}
                          color="#982740"
                        />
                      ),
                      onClick: () => onUnlink(task.id),
                    },
                  ]}
                />
              }
            />
          ))}
        </RecordListTemplate>
      )}
    </SectionRowTemplate>
  );
};

export default LinkedTasksList;
