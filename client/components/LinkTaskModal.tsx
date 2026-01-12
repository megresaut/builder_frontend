import React, { useState, useEffect } from "react";
import {
  ModalTemplate,
  ModalButtons,
} from "@/components/ui/ModalTemplate";
import { FormLayout, FormSection } from "@/components/ui/form-layout";
import { ComboboxField } from "@/components/forms";

export interface LinkedTaskData {
  id: string | number;
  name: string;
  status: "not_started" | "in_progress" | "completed";
  updatedDate: string;
  updatedBy: string;
}

interface LinkTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (linkedTask: LinkedTaskData) => void;
  availableTasks?: LinkedTaskData[];
}

// Mock available tasks for selection
const MOCK_AVAILABLE_TASKS: LinkedTaskData[] = [
  {
    id: "task-1",
    name: "Tree branches weighing down power wires",
    status: "in_progress",
    updatedDate: "10/14/2025 10:12 AM",
    updatedBy: "Jon Hughes",
  },
  {
    id: "task-2",
    name: "Fix broken window latch",
    status: "completed",
    updatedDate: "10/13/2025 2:30 PM",
    updatedBy: "Sarah Martinez",
  },
  {
    id: "task-3",
    name: "Repair kitchen sink",
    status: "not_started",
    updatedDate: "10/12/2025 9:15 AM",
    updatedBy: "Chris Henry",
  },
  {
    id: "task-4",
    name: "Replace air filter",
    status: "completed",
    updatedDate: "10/11/2025 1:45 PM",
    updatedBy: "Michael Thompson",
  },
  {
    id: "task-5",
    name: "Inspect electrical panel",
    status: "in_progress",
    updatedDate: "10/11/2025 8:00 AM",
    updatedBy: "Julia LoSchiavo",
  },
];

export const LinkTaskModal: React.FC<LinkTaskModalProps> = ({
  open,
  onOpenChange,
  onSubmit,
  availableTasks = MOCK_AVAILABLE_TASKS,
}) => {
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const [selectedTask, setSelectedTask] = useState<LinkedTaskData | null>(null);

  useEffect(() => {
    if (open) {
      setSelectedTaskId("");
      setSelectedTask(null);
    }
  }, [open]);

  useEffect(() => {
    if (selectedTaskId) {
      const task = availableTasks.find(
        (t) => String(t.id) === selectedTaskId
      );
      setSelectedTask(task || null);
    } else {
      setSelectedTask(null);
    }
  }, [selectedTaskId, availableTasks]);

  const handleSave = () => {
    if (!selectedTask) return;
    onSubmit(selectedTask);
    setSelectedTaskId("");
    setSelectedTask(null);
    onOpenChange(false);
  };

  const handleCancel = () => {
    setSelectedTaskId("");
    setSelectedTask(null);
    onOpenChange(false);
  };

  const taskOptions = availableTasks.map((task) => ({
    value: String(task.id),
    label: task.name,
  }));

  return (
    <ModalTemplate
      open={open}
      onOpenChange={(openState) => {
        if (!openState) {
          setSelectedTaskId("");
          setSelectedTask(null);
        }
        onOpenChange(openState);
      }}
      title="Link Task"
      size="sm"
      footer={
        <ModalButtons
          onCancel={handleCancel}
          onConfirm={handleSave}
          cancelLabel="Cancel"
          confirmLabel="Link"
          confirmDisabled={!selectedTask}
        />
      }
    >
      <FormLayout>
        <FormSection showDivider={false}>
          <ComboboxField
            label="Select a task"
            value={selectedTaskId}
            onChange={setSelectedTaskId}
            options={taskOptions}
            placeholder="Search tasks..."
          />

          {selectedTask && (
            <div className="mt-4 p-3 bg-[#f9f9f9] border border-[#e5e5e5] rounded-lg">
              <div className="text-sm text-[#303030] font-medium mb-2">
                {selectedTask.name}
              </div>
              <div className="flex flex-col gap-1 text-xs text-[#71717A]">
                <div>
                  <span className="font-medium">Status:</span>{" "}
                  {selectedTask.status === "not_started"
                    ? "Not Started"
                    : selectedTask.status === "in_progress"
                      ? "In Progress"
                      : "Completed"}
                </div>
                <div>
                  <span className="font-medium">Updated:</span>{" "}
                  {selectedTask.updatedDate}
                </div>
                <div>
                  <span className="font-medium">By:</span> {selectedTask.updatedBy}
                </div>
              </div>
            </div>
          )}
        </FormSection>
      </FormLayout>
    </ModalTemplate>
  );
};

export default LinkTaskModal;
