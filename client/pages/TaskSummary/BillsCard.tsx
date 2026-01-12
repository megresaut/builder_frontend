import React from "react";
import SectionCard from "@/components/SectionCard";
import { ClockIcon, CalendarIcon } from "@/components/icons";

interface BillItem {
  id: string;
  date: string;
  time: string;
  invoiceNumber: string;
  vendorName: string;
  amount: string;
  status: "Paid" | "Unpaid" | "Awaiting Invoice";
}

interface BillsCardProps {
  bills: BillItem[];
}

export const BillsCard: React.FC<BillsCardProps> = ({ bills }) => {
  return (
    <SectionCard title="Bills" variant="white">
      <div className="flex flex-col gap-4">
        {bills.map((bill) => (
          <div key={bill.id} className="flex flex-col gap-3">
            <div className="flex items-center gap-4 text-sm text-[#717179]">
              <div className="flex items-center gap-1.5">
                <CalendarIcon width={14} height={14} />
                <span>{bill.date}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ClockIcon width={14} height={14} />
                <span>{bill.time}</span>
              </div>
            </div>
            
            <div className="text-sm font-medium text-[#303030]">
              {bill.invoiceNumber} - {bill.vendorName}
            </div>
            
            <div className="flex items-center justify-between">
              <div className="text-2xl font-semibold text-[#2463eb]">
                {bill.amount}
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-full border border-[#10b981] bg-[#f0fdf4]">
                <div className="w-1.5 h-1.5 rounded-full bg-[#10b981]"></div>
                <span className="text-xs font-semibold text-[#10b981]">
                  {bill.status}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
};

export default BillsCard;
