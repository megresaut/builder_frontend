import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { ChevronDown, Upload } from "lucide-react";
import { format } from "date-fns";
import CreateTaskModal from "./CreateTaskModal";

interface Assignee {
  id: string;
  name: string;
  initials: string;
}

interface CreateWorkOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editData?: {
    task: string;
    dueDate: string;
    priority: string;
    status: string;
  };
  /** When opening for create, preselect this property (e.g. from property page). */
  defaultPropertyId?: number;
  defaultPropertyLabel?: string;
}

const AVAILABLE_ASSIGNEES: Assignee[] = [
  { id: "1", name: "David Harris", initials: "DH" },
  { id: "2", name: "Sarah Johnson", initials: "SJ" },
  { id: "3", name: "Michael Chen", initials: "MC" },
  { id: "4", name: "Emily Rodriguez", initials: "ER" },
  { id: "5", name: "James Wilson", initials: "JW" },
];

export default function CreateWorkOrderModal({
  open,
  onOpenChange,
  editData,
  defaultPropertyId,
  defaultPropertyLabel,
}: CreateWorkOrderModalProps) {
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [property, setProperty] = useState("");
  const [addToTask, setAddToTask] = useState("");
  const [task, setTask] = useState("");
  const [vendor, setVendor] = useState("");
  const [status, setStatus] = useState("inprogress");
  const [priority, setPriority] = useState("normal");
  const [selectedDueDate, setSelectedDueDate] = useState<Date | null>(null);
  const [selectedAssignees, setSelectedAssignees] = useState<Assignee[]>([
    AVAILABLE_ASSIGNEES[0],
    AVAILABLE_ASSIGNEES[0],
  ]);
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const assigneeButtonRef = useRef<HTMLButtonElement>(null);
  const [assigneeDropdownPos, setAssigneeDropdownPos] = useState({
    top: 0,
    left: 0,
  });
  const [errors, setErrors] = useState<{
    property?: boolean;
    addToTask?: boolean;
    task?: boolean;
    dueDate?: boolean;
    vendor?: boolean;
  }>({});

  const validateForm = (): boolean => {
    const newErrors: {
      property?: boolean;
      addToTask?: boolean;
      task?: boolean;
      dueDate?: boolean;
      vendor?: boolean;
    } = {};
    if (!property.trim()) {
      newErrors.property = true;
    }
    if (!addToTask.trim()) {
      newErrors.addToTask = true;
    }
    if (!task.trim()) {
      newErrors.task = true;
    }
    if (!dueDate.trim()) {
      newErrors.dueDate = true;
    }
    if (!vendor.trim()) {
      newErrors.vendor = true;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      console.log("Form submitted", {
        property,
        addToTask,
        task,
        vendor,
        dueDate,
        priority,
        status,
      });
      onOpenChange(false);
    }
  };

  useEffect(() => {
    if (editData) {
      setTask(editData.task);
      setDueDate(editData.dueDate);
      setPriority(editData.priority.toLowerCase());
      setStatus(editData.status === "In progress" ? "inprogress" : "completed");
    }
  }, [editData]);

  useEffect(() => {
    if (open && !editData && defaultPropertyId != null && defaultPropertyLabel) {
      setProperty(`default-${defaultPropertyId}`);
    }
  }, [open, editData, defaultPropertyId, defaultPropertyLabel]);

  useEffect(() => {
    let animationFrameId: number;

    const updatePositions = () => {
      if (showAssigneeDropdown && assigneeButtonRef.current) {
        const rect = assigneeButtonRef.current.getBoundingClientRect();
        setAssigneeDropdownPos({
          top: rect.bottom + 8,
          left: rect.left,
        });

        if (showAssigneeDropdown) {
          animationFrameId = requestAnimationFrame(updatePositions);
        }
      }
    };

    if (showAssigneeDropdown) {
      updatePositions();
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [showAssigneeDropdown]);

  const getStatusIcon = () => {
    return (
      <svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M2.91602 7H11.0827"
          stroke="#2463EB"
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  };

  const getPriorityIcon = () => {
    return (
      <svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M2.91602 7H11.0827"
          stroke="#2463EB"
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  };

  const getStatusLabel = () => {
    const labels: Record<string, string> = {
      inprogress: "In progress",
      completed: "Completed",
    };
    return labels[status] || "In progress";
  };

  const getPriorityLabel = () => {
    const labels: Record<string, string> = {
      low: "Low",
      normal: "Normal",
      high: "High",
    };
    return labels[priority] || "Normal";
  };

  const getStatusBgColor = () => {
    const colors: Record<string, string> = {
      inprogress: "#dbe9fe",
      completed: "#d1fae5",
    };
    return colors[status] || "#dbe9fe";
  };

  const getStatusTextColor = () => {
    const colors: Record<string, string> = {
      inprogress: "#2463eb",
      completed: "#059669",
    };
    return colors[status] || "#2463eb";
  };

  const getPriorityBgColor = () => {
    const colors: Record<string, string> = {
      low: "#d1fae5",
      normal: "#dbe9fe",
      high: "#fef3c7",
    };
    return colors[priority] || "#dbe9fe";
  };

  const getPriorityTextColor = () => {
    const colors: Record<string, string> = {
      low: "#059669",
      normal: "#2463eb",
      high: "#d97706",
    };
    return colors[priority] || "#2463eb";
  };

  const toggleAssignee = (assignee: Assignee) => {
    setSelectedAssignees((prev) => {
      const isSelected = prev.some((a) => a.id === assignee.id);
      if (isSelected) {
        return prev.filter((a) => a.id !== assignee.id);
      } else {
        return [...prev, assignee];
      }
    });
  };


  const handleCreateTaskModalOpenChange = (isOpen: boolean) => {
    setShowCreateTaskModal(isOpen);
    if (!isOpen) {
      // When task modal closes, reopen the work order modal
      // (only if we manually closed the task modal)
    }
  };

  return (
    <>
      <Dialog open={open && !showCreateTaskModal} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[694px] p-8 gap-0 max-h-[90vh] overflow-y-auto">
          <div className="flex flex-col gap-5">
            {/* Header */}
            <div className="flex flex-col gap-1">
              <DialogTitle className="text-[#303030] font-semibold text-2xl leading-[30px]">
                {editData ? "Edit Work Order" : "Create Work Order"}
              </DialogTitle>
              <p className="text-[#717179] font-medium text-base leading-4">
                Create a task before a new work order, or connect to an existing
                task
              </p>
            </div>

            {/* Property and Unit Row */}
            <div className="flex gap-3 w-full">
              <div className="flex flex-col gap-2 flex-1 min-w-[240px]">
                <label className="text-[#303030] font-medium text-sm leading-5">
                  Property <span className="text-red-600">*</span>
                </label>
                <Select
                  value={property}
                  onValueChange={(value) => {
                    setProperty(value);
                    if (errors.property && value.trim()) {
                      setErrors((prev) => ({ ...prev, property: false }));
                    }
                  }}
                >
                  <SelectTrigger
                    className={`h-11 rounded-lg bg-[#F7F7F7] ${
                      errors.property
                        ? "border-red-500 border-2"
                        : "border-[#E5E5E5]"
                    }`}
                  >
                    <SelectValue
                      placeholder="Select Property"
                      className="text-[#A1A1A9]"
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {defaultPropertyId != null && defaultPropertyLabel && (
                      <SelectItem value={`default-${defaultPropertyId}`}>
                        {defaultPropertyLabel}
                      </SelectItem>
                    )}
                    <SelectItem value="property1">
                      22 Indian Chase Dr
                    </SelectItem>
                    <SelectItem value="property2">Property 2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2 flex-1 min-w-[240px]">
                <label className="text-[#303030] font-medium text-sm leading-5">
                  Unit
                </label>
                <Select>
                  <SelectTrigger className="h-11 rounded-lg bg-[#F7F7F7] border-[#E5E5E5]">
                    <SelectValue
                      placeholder="Select Unit If Applicable"
                      className="text-[#A1A1A9]"
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unit1">Unit 1</SelectItem>
                    <SelectItem value="unit2">Unit 2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Task Section - "Add to Task" */}
            <div className="flex flex-col gap-2">
              <label className="text-[#303030] font-medium text-sm leading-5">
                Add to Task <span className="text-red-600">*</span>
              </label>
              <Select
                value={addToTask}
                onValueChange={(value) => {
                  setAddToTask(value);
                  if (errors.addToTask && value.trim()) {
                    setErrors((prev) => ({ ...prev, addToTask: false }));
                  }
                }}
              >
                <SelectTrigger
                  className={`h-11 rounded-lg bg-[#F7F7F7] ${
                    errors.addToTask
                      ? "border-red-500 border-2"
                      : "border-[#E5E5E5]"
                  }`}
                >
                  <SelectValue
                    placeholder="Select Task Or Create A New Task"
                    className="text-[#A1A1A9]"
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="task1">Task 1</SelectItem>
                  <SelectItem value="task2">Task 2</SelectItem>
                </SelectContent>
              </Select>
              <label className="text-[#303030] font-medium text-sm leading-5">
                <span
                  className="text-[#2463EB] cursor-pointer hover:underline"
                  onClick={() => setShowCreateTaskModal(true)}
                >
                  + Create New Task
                </span>
              </label>
            </div>

            {/* Work Order Details Header */}
            <div className="mt-2">
              <p className="text-[#717179] font-medium text-base leading-4">
                Work Order Details
              </p>
            </div>

            {/* Work Order Name and Vendor Row */}
            <div className="flex gap-3 w-full">
              <div className="flex flex-col gap-2 flex-1 min-w-[240px]">
                <label className="text-[#303030] font-medium text-sm leading-5">
                  Work Order Name <span className="text-red-600">*</span>
                </label>
                <Input
                  value={task}
                  onChange={(e) => {
                    setTask(e.target.value);
                    if (errors.task && e.target.value.trim()) {
                      setErrors((prev) => ({ ...prev, task: false }));
                    }
                  }}
                  placeholder="Type Work Order Name"
                  className={`h-11 rounded-lg bg-[#F7F7F7] placeholder:text-[#A1A1A9] ${
                    errors.task ? "border-red-500 border-2" : "border-[#E5E5E5]"
                  }`}
                />
              </div>
              <div className="flex flex-col gap-2 flex-1 min-w-[240px]">
                <label className="text-[#303030] font-medium text-sm leading-5">
                  Vendor <span className="text-red-600">*</span>
                </label>
                <Select
                  value={vendor}
                  onValueChange={(value) => {
                    setVendor(value);
                    if (errors.vendor && value.trim()) {
                      setErrors((prev) => ({ ...prev, vendor: false }));
                    }
                  }}
                >
                  <SelectTrigger
                    className={`h-11 rounded-lg bg-[#F7F7F7] ${
                      errors.vendor
                        ? "border-red-500 border-2"
                        : "border-[#E5E5E5]"
                    }`}
                  >
                    <SelectValue
                      placeholder="Select Vendor"
                      className="text-[#A1A1A9]"
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vendor1">Vendor 1</SelectItem>
                    <SelectItem value="vendor2">Vendor 2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Status and Priority Row */}
            <div className="flex gap-3 w-full">
              <div className="flex flex-col gap-2 flex-1 min-w-[240px]">
                <label className="text-[#303030] font-medium text-sm leading-5">
                  Status
                </label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="h-11 rounded-lg bg-[#F7F7F7] border-[#E5E5E5]">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: getStatusTextColor() }}
                      />
                      <span className="text-sm tracking-[-0.28px] leading-[1.4] text-[#303030]">
                        {getStatusLabel()}
                      </span>
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inprogress">In progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2 flex-1 min-w-[240px]">
                <label className="text-[#303030] font-medium text-sm leading-5">
                  Priority
                </label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger className="h-11 rounded-lg bg-[#F7F7F7] border-[#E5E5E5]">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: getPriorityTextColor() }}
                      />
                      <span className="text-sm tracking-[-0.28px] leading-[1.4] text-[#303030]">
                        {getPriorityLabel()}
                      </span>
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[#059669]" />
                        <span>Low</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="normal">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[#2463eb]" />
                        <span>Normal</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="high">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[#d97706]" />
                        <span>High</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Due Date */}
            <div className="flex flex-col gap-2">
              <label className="text-[#303030] font-medium text-sm leading-5">
                Due Date <span className="text-red-600">*</span>
              </label>
              <DatePicker
                value={selectedDueDate}
                onChange={(date) => {
                  setSelectedDueDate(date);
                  if (errors.dueDate && date) {
                    setErrors((prev) => ({ ...prev, dueDate: false }));
                  }
                }}
                error={errors.dueDate}
                placeholder="MM/DD/YYYY"
              />
            </div>

            {/* Work Order Notes */}
            <div className="flex flex-col gap-2">
              <label className="text-[#303030] font-medium text-sm leading-5">
                Work Order Notes
              </label>
              <Textarea
                placeholder="Notes for your work Order"
                className="min-h-[169px] rounded-lg bg-[#F7F7F7] border-[#E5E5E5] placeholder:text-[#A1A1A9] resize-none"
              />
            </div>

            {/* Upload File */}
            <div className="flex flex-col gap-2">
              <label className="text-[#303030] font-medium text-sm leading-5">
                Upload file
              </label>
              <div className="border border-dashed border-[#121212]/40 rounded-lg bg-white flex flex-col items-center justify-center py-8 px-4 gap-3">
                <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#FBFBFB] border border-[#DADADA] shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:bg-gray-50 transition-colors">
                  <Upload className="w-4 h-4 text-[#303030]" />
                  <span className="text-[#303030] font-normal text-base">
                    Upload
                  </span>
                </button>
                <div className="flex flex-col items-center gap-1.5">
                  <p className="text-[#09090B] font-normal text-xs leading-4">
                    Choose a file or drag & drop it here
                  </p>
                  <p className="text-[#09090B] font-normal text-xs leading-4">
                    Maximum 500 MB file size
                  </p>
                </div>
              </div>
            </div>

            {/* Create/Update Button */}
            <button
              onClick={handleSubmit}
              className="flex h-9 justify-center items-center gap-2 rounded-lg border border-white bg-[#013764] shadow-[0_0_0_1px_#002D5A] hover:bg-[#003a73] transition-colors mt-0 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={
                !property.trim() ||
                !addToTask.trim() ||
                !task.trim() ||
                !vendor.trim() ||
                !selectedDueDate
              }
            >
              <span className="text-white font-medium text-base">
                {editData ? "Update Work Order" : "Create New Work Order"}
              </span>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Task Modal */}
      <CreateTaskModal
        open={showCreateTaskModal}
        onOpenChange={handleCreateTaskModalOpenChange}
      />
    </>
  );
}
