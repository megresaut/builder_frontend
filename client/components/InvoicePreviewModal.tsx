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

  const handleDownloadPDF = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] md:max-w-[850px] max-h-[95vh] flex flex-col p-0">
        <div className="flex-1 overflow-y-auto bg-white">
          {/* Invoice Container - PDF-like appearance */}
          <div className="bg-white mx-auto px-16 py-12" style={{ maxWidth: "650px" }}>
            {/* Header */}
            <div className="flex justify-between items-start mb-12">
              <div className="flex flex-col gap-8">
                <div>
                  <h1 className="text-[#002060] font-bold text-sm tracking-wider leading-tight mb-3">
                    AVMRE LLC
                  </h1>
                  <div className="text-[#002060] text-[10px] leading-relaxed space-y-0.5">
                    <div className="tracking-tight">11 LARGO DRIVE SOUTH</div>
                    <div>SUITE 200</div>
                    <div className="tracking-tight">STAMFORD, CT 06907</div>
                    <div className="font-bold mt-2">203-987-7050</div>
                  </div>
                </div>
                <div>
                  <div className="text-[#002060] font-bold text-[8px] tracking-widest leading-tight mb-2">
                    BILL TO:
                  </div>
                  <div className="text-[#002060] text-[9px] leading-relaxed">
                    {billTo}
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-8 items-end">
                <div>
                  <h2 className="text-[#002060] font-bold text-sm tracking-wider leading-tight mb-3">
                    INVOICE
                  </h2>
                  <div className="text-[#002060] text-[10px] leading-relaxed">
                    DATE: {invoiceDate}
                  </div>
                </div>
                <div>
                  <div className="text-[#002060] font-bold text-[8px] tracking-widest leading-tight mb-2">
                    PROPERTY:
                  </div>
                  <div className="text-[#002060] text-[9px] leading-relaxed text-right">
                    <div>{propertyAddress}</div>
                    <div>{propertyLocation}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Table Header */}
            <div className="border-b border-gray-300 pb-2 mb-1">
              <div className="flex gap-6">
                <div className="text-[#002060] font-bold text-[9px] leading-tight w-28">
                  Vendors
                </div>
                <div className="text-[#002060] font-bold text-[9px] leading-tight flex-1">
                  Description
                </div>
                <div className="text-[#002060] font-bold text-[9px] leading-tight w-24 text-right">
                  AMOUNT
                </div>
              </div>
            </div>

            {/* Line Items */}
            <div>
              {lineItems.map((item, index) => (
                <div
                  key={item.id}
                  className={cn(
                    "py-4 group",
                    index < lineItems.length - 1 && "border-b border-[#BF8F00]"
                  )}
                >
                  <div className="flex gap-6 items-center">
                    <input
                      type="text"
                      value={item.vendor}
                      onChange={(e) =>
                        handleUpdateLineItem(item.id, "vendor", e.target.value)
                      }
                      placeholder="Vendor name"
                      className="text-[#002060] text-[9px] leading-relaxed w-28 border-none outline-none focus:bg-gray-50 px-1 py-0.5 rounded"
                    />
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) =>
                        handleUpdateLineItem(item.id, "description", e.target.value)
                      }
                      placeholder="Description"
                      className="text-[#002060] text-[9px] leading-relaxed flex-1 border-none outline-none focus:bg-gray-50 px-1 py-0.5 rounded"
                    />
                    <div className="flex items-center gap-2 w-24">
                      <input
                        type="text"
                        value={item.amount}
                        onChange={(e) =>
                          handleUpdateLineItem(item.id, "amount", e.target.value)
                        }
                        placeholder="$0.00"
                        className="text-[#002060] text-[9px] leading-relaxed text-right flex-1 border-none outline-none focus:bg-gray-50 px-1 py-0.5 rounded"
                      />
                      <button
                        onClick={() => handleRemoveLineItem(item.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-800 text-sm font-bold w-4"
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
              className="mt-6 flex items-center gap-2 px-4 py-2 text-[#002060] text-xs font-medium border border-[#002060] rounded hover:bg-[#002060] hover:text-white transition-colors"
            >
              <svg
                width="12"
                height="12"
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
            <div className="mt-8 pt-4 flex justify-end items-center gap-6">
              <div className="text-[#002060] font-bold text-[9px] leading-tight tracking-wide">
                TOTAL:
              </div>
              <div className="text-[#002060] font-bold text-[9px] leading-tight w-24 text-right">
                ${calculateTotal().toFixed(2)}
              </div>
            </div>

            {/* Footer */}
            <div className="mt-16 space-y-1.5">
              <div className="text-[#002060] font-bold text-[8px] leading-tight">
                Please make all checks payable to AVMRE LLC
              </div>
              <div className="text-[#002060] text-[8px] leading-tight">
                If you have any questions concerning this invoice, use the following
                contact information:
              </div>
              <div className="text-[#002060] text-[8px] leading-tight">
                203-987-7050
              </div>
              <div className="text-[#0563C1] text-[8px] leading-tight">
                STAFF@AVMRE.COM
              </div>
              <div className="text-[#002060] font-bold text-[8px] leading-tight mt-2">
                THANK YOU FOR YOUR BUSINESS!
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
