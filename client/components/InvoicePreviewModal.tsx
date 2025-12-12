import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export interface InvoiceLineItem {
  id: number;
  vendor: string;
  description: string;
  amount: string;
}

interface InvoicePreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyAddress: string;
  propertyLocation: string;
  billTo: string;
  invoiceDate: string;
  lineItems: InvoiceLineItem[];
}

export default function InvoicePreviewModal({
  open,
  onOpenChange,
  propertyAddress,
  propertyLocation,
  billTo,
  invoiceDate,
  lineItems: initialLineItems,
}: InvoicePreviewModalProps) {
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>(initialLineItems);

  const calculateTotal = () => {
    return lineItems.reduce((sum, item) => {
      const amount = parseFloat(item.amount.replace(/[$,]/g, "")) || 0;
      return sum + amount;
    }, 0);
  };

  const handleAddLineItem = () => {
    const newItem: InvoiceLineItem = {
      id: lineItems.length + 1,
      vendor: "",
      description: "",
      amount: "$0.00",
    };
    setLineItems([...lineItems, newItem]);
  };

  const handleRemoveLineItem = (id: number) => {
    setLineItems(lineItems.filter((item) => item.id !== id));
  };

  const handleUpdateLineItem = (
    id: number,
    field: keyof InvoiceLineItem,
    value: string,
  ) => {
    setLineItems(
      lineItems.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] md:max-w-[850px] max-h-[95vh] flex flex-col p-0">
        <div className="flex-1 overflow-y-auto">
          {/* Invoice Container - PDF-like appearance */}
          <div className="bg-white mx-auto" style={{ width: "612px", minHeight: "792px" }}>
            {/* Header */}
            <div className="px-12 pt-14 pb-6">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h1 className="text-[#002060] font-bold text-[9.2px] tracking-[1.15px] leading-[11px] mb-6">
                    AVMRE LLC
                  </h1>
                  <div className="text-[#002060] text-[7px] leading-[9px] space-y-1">
                    <div className="tracking-[0.273px]">11 LARGO DRIVE SOUTH</div>
                    <div>SUITE 200</div>
                    <div className="tracking-[0.109px]">STAMFORD, CT 06907</div>
                  </div>
                  <div className="text-[#002060] font-bold text-[7px] leading-[9px] tracking-[-0.656px] mt-4">
                    203-987-7050
                  </div>
                </div>
                <div>
                  <h2 className="text-[#002060] font-bold text-[9.2px] tracking-[1.15px] leading-[11px] mb-6">
                    INVOICE
                  </h2>
                  <div className="text-[#002060] text-[7px] leading-[9px]">
                    DATE: {invoiceDate}
                  </div>
                </div>
              </div>

              {/* Bill To / Property */}
              <div className="flex justify-between mb-6">
                <div>
                  <div className="text-[#002060] font-bold text-[5.4px] tracking-[0.844px] leading-[7px] mb-2">
                    BILL TO:
                  </div>
                  <div className="text-[#002060] text-[5.6px] leading-[7px]">
                    {billTo}
                  </div>
                </div>
                <div>
                  <div className="text-[#002060] font-bold text-[5.4px] tracking-[0.759px] leading-[7px] mb-2">
                    PROPERTY:
                  </div>
                  <div className="text-[#002060] text-[5.6px] leading-[7px] tracking-[-0.087px]">
                    {propertyAddress}
                  </div>
                  <div className="text-[#002060] text-[5.6px] leading-[7px] tracking-[-0.175px]">
                    {propertyLocation}
                  </div>
                </div>
              </div>

              {/* Table Header */}
              <div className="border-t border-b border-[#F2F2F2] bg-white py-2 mb-2">
                <div className="flex gap-4">
                  <div className="text-[#002060] font-bold text-[5.6px] leading-[7px] w-24">
                    Vendors
                  </div>
                  <div className="text-[#002060] font-bold text-[5.6px] leading-[7px] flex-1">
                    Description
                  </div>
                  <div className="text-[#002060] font-bold text-[5.6px] leading-[7px] w-24 text-right">
                    AMOUNT
                  </div>
                </div>
              </div>

              {/* Line Items */}
              <div className="space-y-3">
                {lineItems.map((item) => (
                  <div
                    key={item.id}
                    className="border-b border-[#F2F2F2] pb-3 group"
                  >
                    <div className="flex gap-4 items-start">
                      <input
                        type="text"
                        value={item.vendor}
                        onChange={(e) =>
                          handleUpdateLineItem(item.id, "vendor", e.target.value)
                        }
                        placeholder="Vendor name"
                        className="text-[#002060] text-[5.6px] leading-[7px] w-24 border-none outline-none focus:bg-gray-50 px-1 py-0.5 rounded"
                      />
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) =>
                          handleUpdateLineItem(item.id, "description", e.target.value)
                        }
                        placeholder="Description"
                        className="text-[#002060] text-[5.6px] leading-[7px] tracking-[-0.087px] flex-1 border-none outline-none focus:bg-gray-50 px-1 py-0.5 rounded"
                      />
                      <div className="flex items-center gap-2 w-24">
                        <input
                          type="text"
                          value={item.amount}
                          onChange={(e) =>
                            handleUpdateLineItem(item.id, "amount", e.target.value)
                          }
                          placeholder="$0.00"
                          className="text-[#002060] text-[5.6px] leading-[7px] tracking-[-0.175px] text-right flex-1 border-none outline-none focus:bg-gray-50 px-1 py-0.5 rounded"
                        />
                        <button
                          onClick={() => handleRemoveLineItem(item.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-800 text-xs"
                          title="Remove line item"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Line Item Button */}
              <button
                onClick={handleAddLineItem}
                className="mt-4 flex items-center gap-2 px-3 py-1.5 text-[#002060] text-[6px] font-medium border border-[#002060] rounded hover:bg-[#002060] hover:text-white transition-colors"
              >
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M10 4.1665V15.8332M4.16667 9.99984H15.8333"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Add Line Item
              </button>

              {/* Total */}
              <div className="mt-8 pt-4 border-t border-[#F2F2F2]">
                <div className="flex justify-end gap-4">
                  <div className="text-[#002060] font-bold text-[5.6px] leading-[7px] tracking-[0.35px]">
                    TOTAL:
                  </div>
                  <div className="text-[#002060] font-bold text-[5.6px] leading-[7px] tracking-[-0.262px] w-24 text-right">
                    ${calculateTotal().toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-16 space-y-2">
                <div className="text-[#002060] font-bold text-[5.1px] leading-[6px] tracking-[0.159px]">
                  Please make all checks payable to AVMRE LLC
                </div>
                <div className="text-[#002060] text-[5.1px] leading-[6px] tracking-[-0.09px]">
                  If you have any questions concerning this invoice, use the following
                  contact information:
                </div>
                <div className="text-[#002060] text-[5.1px] leading-[6px] tracking-[-0.319px]">
                  203-987-7050
                </div>
                <div className="text-[#0563C1] text-[5.1px] leading-[6px] tracking-[0.239px]">
                  STAFF@AVMRE.COM
                </div>
                <div className="text-[#002060] font-bold text-[5.1px] leading-[6px] tracking-[0.159px]">
                  THANK YOU FOR YOUR BUSINESS!
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="flex-shrink-0 flex justify-end items-center gap-2.5 px-6 md:px-8 py-4 border-t border-[#E5E5E5] bg-white">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="flex h-9 justify-center items-center gap-2 px-4 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <span className="text-[#303030] font-normal text-base capitalize">
              Cancel
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              // TODO: Implement PDF download/print functionality
              window.print();
            }}
            className="flex h-9 items-center gap-2 px-4 rounded-lg border border-white bg-[#002D5A] shadow-[0_0_0_1px_#002D5A,0_0_10px_-5px_rgba(0,0,0,0.2)] hover:bg-[#003d7a] transition-colors"
          >
            <span className="text-white font-medium text-base">Download PDF</span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
