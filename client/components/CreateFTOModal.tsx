import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CreateFTOModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateFTOModal({
  open,
  onOpenChange,
}: CreateFTOModalProps) {
  const [priority, setPriority] = useState("normal");
  const [timesheetStatus, setTimesheetStatus] = useState("outstanding");

  console.log("CreateFTOModal - open prop:", open);

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

  const getTimesheetIcon = () => {
    return (
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="8" cy="8" r="6" stroke="#D97706" strokeWidth="1.5" />
      </svg>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[694px] p-0 gap-0 font-['Geist',sans-serif]">
        <div className="flex flex-col gap-4 px-8 py-8 bg-white rounded-2xl">
          {/* Title */}
          <DialogTitle className="text-[#303030] font-semibold text-2xl leading-[1.25]">
            Create/Update Field Team Order
          </DialogTitle>

          {/* Property and Unit Row */}
          <div className="flex gap-3 w-full flex-wrap">
            <div className="flex flex-col gap-2 flex-1 min-w-[240px]">
              <label className="text-[#303030] font-medium text-sm leading-[1.43]">
                Property <span className="text-red-600">*</span>
              </label>
              <Select>
                <SelectTrigger className="h-11 rounded-lg bg-[#f7f7f7] border-[#e5e5e5]">
                  <SelectValue
                    placeholder="Select Property"
                    className="text-[#a1a1a9] text-base tracking-[-0.32px] leading-[1.4]"
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="property1">22 Indian Chase Dr</SelectItem>
                  <SelectItem value="property2">Property 2</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2 flex-1 min-w-[240px]">
              <label className="text-[#303030] font-medium text-sm leading-[1.43]">
                Unit
              </label>
              <Select>
                <SelectTrigger className="h-11 rounded-lg bg-[#f7f7f7] border-[#e5e5e5]">
                  <SelectValue
                    placeholder="Select Unit If Applicable"
                    className="text-[#a1a1a9] text-base tracking-[-0.32px] leading-[1.4]"
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unit1">Unit 1</SelectItem>
                  <SelectItem value="unit2">Unit 2</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Task Name and Priority Row */}
          <div className="flex gap-3 w-full flex-wrap">
            <div className="flex flex-col gap-2 flex-1 min-w-[240px]">
              <label className="text-[#303030] font-medium text-sm leading-[1.43]">
                Task Name <span className="text-red-600">*</span>
              </label>
              <Input
                placeholder="Type Task Name"
                className="h-11 rounded-lg bg-[#f7f7f7] border-[#e5e5e5] placeholder:text-[#a1a1a9] text-base tracking-[-0.32px] leading-[1.4]"
              />
            </div>
            <div className="flex flex-col gap-2 flex-1 min-w-[240px]">
              <label className="text-[#303030] font-medium text-sm leading-[1.43]">
                Priority <span className="text-red-600">*</span>
              </label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="h-11 rounded-lg bg-[#f7f7f7] border-[#e5e5e5]">
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-[#dbe9fe] rounded-2xl">
                    {getPriorityIcon()}
                    <span className="text-[#2463eb] text-sm tracking-[-0.28px] leading-[1.4]">
                      Normal
                    </span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Due Date and Assignees Row */}
          <div className="flex gap-3 w-full flex-wrap">
            <div className="flex flex-col gap-2 flex-1 min-w-[240px]">
              <label className="text-[#303030] font-medium text-sm leading-[1.43]">
                Due Date <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="MM/DD/YYYY"
                  className="h-11 rounded-lg bg-[#f7f7f7] border-[#e5e5e5] placeholder:text-[#a1a1a9] text-base tracking-[-0.32px] leading-[1.4]"
                />
                <svg
                  className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M14 6.66668H2M10.6667 1.33334V4.00001M5.33333 1.33334V4.00001M5.2 14.6667H10.8C11.9201 14.6667 12.4802 14.6667 12.908 14.4487C13.2843 14.2569 13.5903 13.951 13.782 13.5747C14 13.1468 14 12.5868 14 11.4667V5.86668C14 4.74657 14 4.18652 13.782 3.7587C13.5903 3.38237 13.2843 3.07641 12.908 2.88466C12.4802 2.66668 11.9201 2.66668 10.8 2.66668H5.2C4.0799 2.66668 3.51984 2.66668 3.09202 2.88466C2.71569 3.07641 2.40973 3.38237 2.21799 3.7587C2 4.18652 2 4.74657 2 5.86668V11.4667C2 12.5868 2 13.1468 2.21799 13.5747C2.40973 13.951 2.71569 14.2569 3.09202 14.4487C3.51984 14.6667 4.0799 14.6667 5.2 14.6667Z"
                    stroke="black"
                    strokeWidth="1.48576"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
            <div className="flex flex-col gap-2 flex-1 min-w-[240px]">
              <label className="text-[#303030] font-medium text-sm leading-[1.43]">
                Assignees <span className="text-red-600">*</span>
              </label>
              <Select>
                <SelectTrigger className="h-11 rounded-lg bg-[#f7f7f7] border-[#e5e5e5]">
                  <div className="flex items-center gap-2 flex-1">
                    <div className="flex w-[22px] h-[22px] justify-center items-center rounded-full bg-white border border-[#2463eb]">
                      <span className="text-[#2463eb] font-semibold text-[9px] leading-4">
                        DH
                      </span>
                    </div>
                    <div className="flex w-[22px] h-[22px] justify-center items-center rounded-full bg-white border border-[#2463eb]">
                      <span className="text-[#2463eb] font-semibold text-[9px] leading-4">
                        DH
                      </span>
                    </div>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="assignee1">Assignee 1</SelectItem>
                  <SelectItem value="assignee2">Assignee 2</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Timesheet Status */}
          <div className="flex flex-col gap-2">
            <label className="text-[#303030] font-medium text-sm leading-[1.43]">
              Timesheet Status
            </label>
            <Select value={timesheetStatus} onValueChange={setTimesheetStatus}>
              <SelectTrigger className="h-11 rounded-lg bg-[#f7f7f7] border-[#e5e5e5]">
                <div className="flex items-center gap-1.5 px-3 py-1 bg-[#fef3c7] rounded-2xl">
                  {getTimesheetIcon()}
                  <span className="text-[#d97706] text-base tracking-[-0.32px] leading-[1.4]">
                    Outstanding
                  </span>
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="outstanding">Outstanding</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-2">
            <label className="text-[#303030] font-medium text-sm leading-[1.43]">
              Description
            </label>
            <Textarea
              placeholder="Insert Description Here"
              className="min-h-[169px] rounded-lg bg-[#f7f7f7] border-[#e5e5e5] placeholder:text-[#a1a1a9] text-base tracking-[-0.32px] leading-[1.4] resize-none"
            />
          </div>

          {/* Update Field Team Order Button */}
          <button className="flex min-h-[36px] justify-center items-center gap-2 px-4 py-2 rounded-lg bg-[#013764] shadow-[0_0_0_1px_#002d5a] hover:bg-[#014777] transition-colors">
            <span className="text-white font-medium text-base">
              Update Field Team Order
            </span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
