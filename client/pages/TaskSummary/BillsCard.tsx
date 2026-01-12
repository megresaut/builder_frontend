import React from "react";
import { useNavigate } from "react-router-dom";
import SectionCard from "@/components/SectionCard";
import { Calendar, Clock } from "lucide-react";

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
  workOrderId?: number;
}

export const BillsCard: React.FC<BillsCardProps> = ({ bills }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Paid":
        return {
          border: "#059669",
          text: "#059669",
        };
      case "Unpaid":
        return {
          border: "#dc2626",
          text: "#dc2626",
        };
      default:
        return {
          border: "#d97706",
          text: "#d97706",
        };
    }
  };

  return (
    <SectionCard title="Bills" variant="white">
      <div className="flex flex-col gap-4">
        {bills.map((bill) => {
          const statusColors = getStatusColor(bill.status);
          return (
            <div
              key={bill.id}
              className="flex flex-col gap-0 rounded-lg bg-[#f9f9f9] border border-[#dadada] p-4"
            >
              <div className="flex items-start gap-6 text-sm text-[#71717A] font-normal tracking-[-0.28px] leading-[1.14]">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{bill.date}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{bill.time}</span>
                </div>
              </div>

              <div className="text-[#303030] text-base font-medium leading-[1.25] tracking-[-0.32px] mt-3">
                {bill.invoiceNumber} - {bill.vendorName}
              </div>

              <div className="flex items-start justify-between gap-4 mt-6">
                <div className="text-[#2463eb] text-2xl font-medium leading-[1.08]">
                  {bill.amount}
                </div>
                <div
                  className="flex items-center gap-1 px-3.5 py-1.5 rounded-full min-h-[32px]"
                  style={{
                    borderColor: statusColors.border,
                    borderWidth: "1px",
                    borderStyle: "solid",
                  }}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M11.6666 3.5L5.24992 9.91667L2.33325 7"
                      stroke={statusColors.text}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span
                    className="text-base font-medium tracking-[-0.32px] leading-[1.4]"
                    style={{ color: statusColors.text }}
                  >
                    {bill.status}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
};

export default BillsCard;
