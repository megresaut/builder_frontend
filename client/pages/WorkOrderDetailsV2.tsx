import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

interface WorkOrder {
  id: number;
  task: string;
  property: string;
  unit: string;
  status: string;
  priority: string;
  dueDate: string;
}

interface WorkOrderDetailsV2Props {
  workOrder: WorkOrder;
}

export default function WorkOrderDetailsV2({ workOrder }: WorkOrderDetailsV2Props) {
  const navigate = useNavigate();
  const { taskId } = useParams<{ taskId: string }>();

  return (
    <div className="flex flex-col w-full gap-6 bg-white min-h-[400px] pb-10 font-['Geist',sans-serif]">
      <div className="flex items-center gap-4 mb-2">
        <button
          onClick={() => navigate(`/tasks/${taskId}/workorders`)}
          className="flex items-center gap-2 text-sm text-[#717179] hover:text-[#303030] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Work Orders
        </button>
      </div>

      <div className="flex flex-col w-full border border-[#e3e3e3] rounded-[10px] overflow-hidden">
        <div className="px-6 py-5 bg-[#f9f9f9] border-b border-[#e5e5e5]">
          <h2 className="text-xl text-[#303030] font-bold tracking-tight">
            Work Order #{workOrder.id} - {workOrder.task}
          </h2>
        </div>

        <div className="p-6 bg-white space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <div className="text-xs font-semibold text-[#71717A] uppercase tracking-wider mb-1">Property</div>
              <div className="text-sm text-[#303030] font-medium">{workOrder.property}</div>
            </div>
            <div>
              <div className="text-xs font-semibold text-[#71717A] uppercase tracking-wider mb-1">Unit</div>
              <div className="text-sm text-[#303030] font-medium">{workOrder.unit}</div>
            </div>
            <div>
              <div className="text-xs font-semibold text-[#71717A] uppercase tracking-wider mb-1">Status</div>
              <div className="text-sm text-[#303030] font-medium">{workOrder.status}</div>
            </div>
            <div>
              <div className="text-xs font-semibold text-[#71717A] uppercase tracking-wider mb-1">Due Date</div>
              <div className="text-sm text-[#303030] font-medium">{workOrder.dueDate}</div>
            </div>
          </div>

          <div className="pt-8 border-t border-[#f0f0f0]">
            <p className="text-sm text-[#717179] italic">Blank Work Order Details V2 Page - Content coming soon.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
