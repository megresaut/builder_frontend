import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SectionCard from "@/components/SectionCard";
import { Calendar, Clock, X } from "lucide-react";
import { ModalTemplate, ModalButtons } from "@/components/ui/ModalTemplate";
import { SelectField } from "@/components/forms/SelectField";
import { FormLayout, FormSection } from "@/components/ui/form-layout";
import { fetchJSON } from "@/api/fetchJSON";

interface BillItem {
  id: string;
  date: string;
  time: string;
  invoiceNumber: string;
  vendorName: string;
  amount: string;
}

interface AvailableBill {
  id: number;
  vendorName: string;
  referenceNumber: string;
  amountCents: number;
}

interface BillsCardProps {
  bills: BillItem[];
  workOrderId?: number;
  vendorId?: number;
  onBillSelected?: (bill: BillItem) => void;
  onBillRemoved?: () => void;
  onWorkOrderRefresh?: (silent?: boolean) => void;
  /** When set, "Add Bill" is shown in Select Bill modal and Record Bill will return here after submit */
  returnToUrl?: string;
}

const formatCurrency = (amountCents: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amountCents / 100);

export const BillsCard: React.FC<BillsCardProps> = ({ bills, workOrderId, vendorId, onBillSelected, onBillRemoved, onWorkOrderRefresh, returnToUrl }) => {
  const navigate = useNavigate();
  const [isSelectBillModalOpen, setIsSelectBillModalOpen] = useState(false);
  const [selectedBillId, setSelectedBillId] = useState<string>("");
  const [availableBills, setAvailableBills] = useState<AvailableBill[]>([]);

  useEffect(() => {
    const loadBills = async () => {
      try {
        const res = await fetchJSON("/utilities/bills/all?limit=500");
        const rows = Array.isArray(res.data) ? res.data : Array.isArray(res) ? res : [];
        const vendorBills = rows
          .filter((bill: any) => {
            // Only vendor bills (not utility bills)
            if (!bill?.vendor_id || bill?.utility_id || bill?.provider_id) {
              return false;
            }
            // If vendorId is provided, only show bills for that vendor
            if (vendorId !== undefined && bill.vendor_id !== vendorId) {
              return false;
            }
            return true;
          })
          .map((bill: any) => ({
            id: bill.id,
            vendorName: bill.vendor_name || "Unknown vendor",
            referenceNumber: bill.reference_number || bill.invoice_number || "",
            amountCents:
              typeof bill.amount_cents === "number"
                ? bill.amount_cents
                : typeof bill.amount === "number"
                  ? Math.round(bill.amount * 100)
                  : 0,
          }));
        setAvailableBills(vendorBills);
      } catch (err) {
        console.error("Failed to load vendor bills:", err);
        setAvailableBills([]);
      }
    };

    loadBills();
  }, [vendorId]);

  const billOptions = useMemo(
    () =>
      availableBills.map((bill) => ({
        value: String(bill.id),
        label: `${bill.vendorName} - ${bill.referenceNumber} - ${formatCurrency(bill.amountCents)}`,
      })),
    [availableBills]
  );

  const handleEnterBill = () => {
    setIsSelectBillModalOpen(true);
    setSelectedBillId("");
  };

  const handleAddBill = () => {
    setIsSelectBillModalOpen(false);
    const params = new URLSearchParams();
    if (returnToUrl) params.set("returnTo", returnToUrl);
    if (workOrderId) params.set("workOrderId", String(workOrderId));
    const qs = params.toString();
    navigate(qs ? `/bills/record?${qs}` : "/bills/record");
  };

  const handleRemoveBill = async (billId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!workOrderId) return;
    if (!window.confirm("Remove this bill from the work order?")) return;
    try {
      await fetchJSON(`/maintenance/work-orders/id/${workOrderId}/bill`, { method: "DELETE" });
      if (onBillRemoved) onBillRemoved();
      if (onWorkOrderRefresh) onWorkOrderRefresh(true);
    } catch (err) {
      console.error("Failed to remove bill from work order:", err);
      alert("Failed to remove bill. Please try again.");
    }
  };

  const handleConfirmBill = async () => {
    if (selectedBillId) {
      const selectedBill = availableBills.find(
        (b) => String(b.id) === selectedBillId
      );
      if (selectedBill) {
        if (workOrderId) {
          try {
            await fetchJSON(`/maintenance/work-orders/id/${workOrderId}/bill`, {
              method: "POST",
              body: JSON.stringify({ bill_id: selectedBill.id }),
            });
            
            // Refresh the work order data to reflect status change (silent background refresh)
            if (onWorkOrderRefresh) {
              onWorkOrderRefresh(true);
            }
          } catch (err) {
            console.error("Failed to link bill to work order:", err);
            alert("Failed to add bill to work order. Please try again.");
            return;
          }
        }

        // Create a new bill item and add to the bills list
        const newBill: BillItem = {
          id: String(selectedBill.id),
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          invoiceNumber: selectedBill.referenceNumber,
          vendorName: selectedBill.vendorName,
          amount: formatCurrency(selectedBill.amountCents),
        };

        // Call the parent callback to add this bill
        if (onBillSelected) {
          onBillSelected(newBill);
        }

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
            return (
              <div key={bill.id} className="relative group">
                <button
                  onClick={() => navigate(`/bills/record?readOnly=true&billId=${bill.id}`)}
                  className="w-full flex flex-col gap-0 rounded-lg bg-[#f9f9f9] border border-[#dadada] p-4 hover:bg-[#f0f0f0] transition-colors text-left"
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
                  </div>
                </button>
                {workOrderId && (
                  <button
                    onClick={(e) => handleRemoveBill(bill.id, e)}
                    className="absolute top-2 right-2 p-1 rounded-full text-[#71717A] hover:text-[#dc2626] hover:bg-[#fee2e2] transition-colors opacity-0 group-hover:opacity-100"
                    title="Remove bill from work order"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
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
          <div className="flex w-full items-center justify-between gap-2.5">
            <div className="flex items-center">
              {returnToUrl ? (
                <button
                  type="button"
                  onClick={handleAddBill}
                  className="text-[#2463eb] text-sm font-medium hover:underline"
                >
                  Add Bill
                </button>
              ) : null}
            </div>
            <div className="flex items-center gap-2.5">
              <ModalButtons
                onCancel={() => setIsSelectBillModalOpen(false)}
                onConfirm={handleConfirmBill}
                cancelLabel="Cancel"
                confirmLabel="Select"
                disableConfirm={!selectedBillId}
              />
            </div>
          </div>
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
