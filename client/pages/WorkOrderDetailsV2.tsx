import React from "react";
import PageHeader from "@/components/PageHeader";

interface WorkOrderDetailsV2Props {
  workOrder: any;
}

export default function WorkOrderDetailsV2({ workOrder }: WorkOrderDetailsV2Props) {
  return (
    <div className="flex flex-col w-full gap-6 bg-white min-h-[400px] pb-10">
      <div className="p-6 border border-[#e5e5e5] rounded-lg">
        <h2 className="text-xl font-bold mb-4">Work Order Details V2</h2>
        <p className="text-[#717179]">Details for Work Order #{workOrder.id} - {workOrder.task}</p>
        <div className="mt-8">
          {/* Content for V2 details will go here */}
          <p>Blank Work Order Details V2 Page</p>
        </div>
      </div>
    </div>
  );
}
