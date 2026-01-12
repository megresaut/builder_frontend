import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import SectionCard from "@/components/SectionCard";
import { Calendar, Clock } from "lucide-react";
import { ModalTemplate, ModalButtons } from "@/components/ui/ModalTemplate";
import { SelectField } from "@/components/forms/SelectField";
import { FormLayout, FormSection } from "@/components/ui/form-layout";

interface BillItem {
  id: string;
  date: string;
  time: string;
  invoiceNumber: string;
  vendorName: string;
  amount: string;
  status: "Paid" | "Unpaid" | "Awaiting Invoice";
}

interface AvailableBill {
  id: number;
  vendor: string;
  invoiceNumber: string;
  amount: number;
  status: "pushed" | "push-failed";
}

interface BillsCardProps {
  bills: BillItem[];
  workOrderId?: number;
  onBillSelected?: (bill: BillItem) => void;
}

// Mock bills from the Bills page
const AVAILABLE_BILLS: AvailableBill[] = [
  {
    id: 1,
    vendor: "Elite HVAC",
    invoiceNumber: "REF-2024-934",
    amount: 234,
    status: "pushed",
  },
  {
    id: 2,
    vendor: "ABC Plumbing",
    invoiceNumber: "REF-2024-582",
    amount: 287,
    status: "push-failed",
  },
  {
    id: 3,
    vendor: "Elite HVAC",
    invoiceNumber: "REF-2024-195",
    amount: 156,
    status: "pushed",
  },
  {
    id: 4,
    vendor: "Elite HVAC",
    invoiceNumber: "REF-2024-732",
    amount: 234,
    status: "push-failed",
  },
  {
    id: 5,
    vendor: "David Smith",
    invoiceNumber: "REF-2024-445",
    amount: 420,
    status: "pushed",
  },
  {
    id: 6,
    vendor: "Green Lawn Services",
    invoiceNumber: "REF-2024-556",
    amount: 95,
    status: "push-failed",
  },
];

export const BillsCard: React.FC<BillsCardProps> = ({ bills, workOrderId, onBillSelected }) => {
  const navigate = useNavigate();
  const [isSelectBillModalOpen, setIsSelectBillModalOpen] = useState(false);
  const [selectedBillId, setSelectedBillId] = useState<string>("");

  const billOptions = useMemo(
    () =>
      AVAILABLE_BILLS.map((bill) => ({
        value: String(bill.id),
        label: `${bill.invoiceNumber} - ${bill.vendor} ($${bill.amount})`,
      })),
    []
  );

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

  const handleEnterBill = () => {
    setIsSelectBillModalOpen(true);
    setSelectedBillId("");
  };

  const handleConfirmBill = () => {
    if (selectedBillId) {
      const selectedBill = AVAILABLE_BILLS.find(
        (b) => String(b.id) === selectedBillId
      );
      if (selectedBill) {
        // Create a new bill item and add to the bills list
        const newBill: BillItem = {
          id: String(selectedBill.id),
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          invoiceNumber: selectedBill.invoiceNumber,
          vendorName: selectedBill.vendor,
          amount: `$${selectedBill.amount}`,
          status: selectedBill.status === "pushed" ? "Paid" : "Awaiting Invoice",
        };

        // Update parent component - for now, we'll just close the modal
        // In a real app, you'd pass a callback to update the parent state
        setIsSelectBillModalOpen(false);
      }
    }
  };

  return (
    <>
      <SectionCard title="Bills" variant="white">
        <div className="flex flex-col gap-4">
          {bills.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <div className="text-[#71717A] text-sm font-normal mb-3">
                No bills entered yet
              </div>
              <button
                onClick={handleEnterBill}
                className="text-[#2463eb] text-sm font-medium hover:underline"
              >
                Enter Bill
              </button>
            </div>
          ) : bills.map((bill) => {
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

      {/* Select Bill Modal */}
      <ModalTemplate
        open={isSelectBillModalOpen}
        onOpenChange={setIsSelectBillModalOpen}
        title="Select Bill"
        size="sm"
        footer={
          <ModalButtons
            onCancel={() => setIsSelectBillModalOpen(false)}
            onConfirm={handleConfirmBill}
            cancelLabel="Cancel"
            confirmLabel="Select"
            disableConfirm={!selectedBillId}
          />
        }
      >
        <FormLayout>
          <FormSection>
            <SelectField
              label="Bill"
              required
              value={selectedBillId}
              onChange={setSelectedBillId}
              placeholder="Select a bill"
              options={billOptions}
            />
          </FormSection>
        </FormLayout>
      </ModalTemplate>
    </>
  );
};

export default BillsCard;
