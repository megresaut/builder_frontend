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
    <>
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .invoice-print-area,
          .invoice-print-area * {
            visibility: visible;
          }
          .invoice-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
          .edit-field {
            display: none !important;
          }
          .print-only {
            display: inline !important;
          }
        }
        @media screen {
          .print-only {
            display: none !important;
          }
        }
      `}</style>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[95vw] md:max-w-[700px] max-h-[95vh] flex flex-col p-0">
          <div className="flex-1 overflow-y-auto bg-white">
            {/* Invoice Container */}
            <div
              className="invoice-print-area bg-white mx-auto"
              style={{
                maxWidth: "612px",
                minHeight: "792px",
                padding: "70px 60px 60px",
                fontFamily: "Inter, -apple-system, Roboto, Helvetica, sans-serif",
                color: "#002060",
              }}
            >
              {/* Header Section */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "9px",
                  gap: "100px",
                }}
              >
                {/* Left Column */}
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <div style={{ marginBottom: "39px" }}>
                    <div
                      style={{
                        fontSize: "9px",
                        fontWeight: 700,
                        lineHeight: "11px",
                        letterSpacing: "1.15px",
                      }}
                    >
                      AVMRE LLC
                    </div>
                    <div
                      style={{
                        fontSize: "7px",
                        fontWeight: 400,
                        lineHeight: "9px",
                        letterSpacing: "0.273px",
                      }}
                    >
                      11 LARGO DRIVE SOUTH
                    </div>
                    <div style={{ fontSize: "7px", lineHeight: "9px" }}>
                      SUITE 200
                    </div>
                    <div
                      style={{
                        fontSize: "7px",
                        lineHeight: "9px",
                        letterSpacing: "0.109px",
                      }}
                    >
                      STAMFORD, CT 06907
                    </div>
                    <div
                      style={{
                        fontSize: "7px",
                        fontWeight: 700,
                        lineHeight: "9px",
                        letterSpacing: "-0.656px",
                      }}
                    >
                      203-987-7050
                    </div>
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: "5px",
                        fontWeight: 700,
                        lineHeight: "7px",
                        letterSpacing: "0.844px",
                        marginBottom: "2px",
                      }}
                    >
                      BILL TO:
                    </div>
                    <div style={{ fontSize: "6px", lineHeight: "7px" }}>
                      {billTo}
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    minHeight: "107px",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: "9px",
                        fontWeight: 700,
                        lineHeight: "11px",
                        letterSpacing: "1.15px",
                      }}
                    >
                      INVOICE
                    </div>
                    <div style={{ fontSize: "7px", lineHeight: "9px" }}>
                      DATE: {invoiceDate}
                    </div>
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: "5px",
                        fontWeight: 700,
                        lineHeight: "7px",
                        letterSpacing: "0.759px",
                        marginBottom: "2px",
                      }}
                    >
                      PROPERTY:
                    </div>
                    <div
                      style={{
                        fontSize: "6px",
                        lineHeight: "7px",
                        letterSpacing: "-0.087px",
                      }}
                    >
                      {propertyAddress}
                    </div>
                    <div
                      style={{
                        fontSize: "6px",
                        lineHeight: "7px",
                        letterSpacing: "-0.175px",
                      }}
                    >
                      {propertyLocation}
                    </div>
                  </div>
                </div>
              </div>

              {/* Table Header */}
              <div
                style={{
                  display: "flex",
                  fontSize: "6px",
                  fontWeight: 700,
                  lineHeight: "7px",
                  marginTop: "9px",
                  marginBottom: "1px",
                }}
              >
                <div style={{ width: "117px" }}>Vendors</div>
                <div style={{ flex: 1, minWidth: "240px" }}>Description</div>
                <div style={{ width: "95px", textAlign: "right" }}>AMOUNT</div>
              </div>

              {/* Line Items */}
              <div>
                {lineItems.map((item, index) => (
                  <div
                    key={item.id}
                    style={{
                      borderBottom:
                        index < lineItems.length - 1
                          ? "1px solid #BF8F00"
                          : "none",
                      display: "flex",
                      minHeight: "17px",
                      alignItems: "center",
                      fontSize: "6px",
                      lineHeight: "7px",
                    }}
                  >
                    <div style={{ width: "117px", paddingTop: "5px" }}>
                      <input
                        type="text"
                        value={item.vendor}
                        onChange={(e) =>
                          handleUpdateLineItem(item.id, "vendor", e.target.value)
                        }
                        className="edit-field no-print"
                        style={{
                          width: "100%",
                          border: "none",
                          outline: "none",
                          background: "transparent",
                          fontSize: "6px",
                          lineHeight: "7px",
                          color: "#002060",
                          fontFamily: "Inter, -apple-system, Roboto, Helvetica, sans-serif",
                        }}
                      />
                      <span className="print-only" style={{ display: "none" }}>
                        {item.vendor}
                      </span>
                    </div>
                    <div
                      style={{
                        flex: 1,
                        minWidth: "240px",
                        paddingTop: "5px",
                        letterSpacing: "-0.087px",
                      }}
                    >
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) =>
                          handleUpdateLineItem(item.id, "description", e.target.value)
                        }
                        className="edit-field no-print"
                        style={{
                          width: "100%",
                          border: "none",
                          outline: "none",
                          background: "transparent",
                          fontSize: "6px",
                          lineHeight: "7px",
                          color: "#002060",
                          fontFamily: "Inter, -apple-system, Roboto, Helvetica, sans-serif",
                        }}
                      />
                      <span className="print-only" style={{ display: "none" }}>
                        {item.description}
                      </span>
                    </div>
                    <div
                      style={{
                        width: "95px",
                        textAlign: "right",
                        paddingTop: "5px",
                        letterSpacing: "-0.175px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "flex-end",
                        gap: "8px",
                      }}
                    >
                      <input
                        type="text"
                        value={item.amount}
                        onChange={(e) =>
                          handleUpdateLineItem(item.id, "amount", e.target.value)
                        }
                        className="edit-field no-print"
                        style={{
                          width: "100%",
                          border: "none",
                          outline: "none",
                          background: "transparent",
                          fontSize: "6px",
                          lineHeight: "7px",
                          color: "#002060",
                          textAlign: "right",
                          fontFamily: "Inter, -apple-system, Roboto, Helvetica, sans-serif",
                        }}
                      />
                      <span className="print-only" style={{ display: "none" }}>
                        {item.amount}
                      </span>
                      <button
                        onClick={() => handleRemoveLineItem(item.id)}
                        className="no-print"
                        style={{
                          border: "none",
                          background: "none",
                          color: "#ef4444",
                          cursor: "pointer",
                          fontSize: "14px",
                          fontWeight: "bold",
                          padding: "0 4px",
                        }}
                        title="Remove line item"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Line Item Button */}
              <button
                onClick={handleAddLineItem}
                className="no-print"
                style={{
                  marginTop: "10px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "6px 12px",
                  border: "1px solid #002060",
                  borderRadius: "4px",
                  background: "white",
                  color: "#002060",
                  fontSize: "10px",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
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
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  alignItems: "flex-end",
                  marginTop: "10px",
                  fontSize: "6px",
                  fontWeight: 700,
                  lineHeight: "7px",
                }}
              >
                <div style={{ letterSpacing: "0.35px", width: "31px" }}>
                  TOTAL:
                </div>
                <div
                  style={{
                    width: "95px",
                    paddingLeft: "5px",
                    letterSpacing: "-0.262px",
                  }}
                >
                  ${calculateTotal().toFixed(2)}
                </div>
              </div>

              {/* Footer */}
              <div
                style={{
                  marginTop: "40px",
                  fontSize: "5px",
                  lineHeight: "6px",
                }}
              >
                <div style={{ fontWeight: 700, letterSpacing: "0.06px" }}>
                  Please make all checks payable to AVMRE LLC
                </div>
                <div style={{ letterSpacing: "-0.09px" }}>
                  If you have any questions concerning this invoice, use the
                  following contact information:
                </div>
                <div style={{ letterSpacing: "-0.319px" }}>203-987-7050</div>
                <div
                  style={{
                    color: "#0563C1",
                    letterSpacing: "0.239px",
                  }}
                >
                  STAFF@AVMRE.COM
                </div>
                <div style={{ fontWeight: 700, letterSpacing: "0.159px" }}>
                  THANK YOU FOR YOUR BUSINESS!
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="no-print flex-shrink-0 flex justify-end items-center gap-2.5 px-6 md:px-8 py-4 border-t border-[#E5E5E5] bg-white">
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
              onClick={handleDownloadPDF}
              className="flex h-9 items-center gap-2 px-4 rounded-lg border border-white bg-[#002D5A] shadow-[0_0_0_1px_#002D5A,0_0_10px_-5px_rgba(0,0,0,0.2)] hover:bg-[#003d7a] transition-colors"
            >
              <span className="text-white font-medium text-base">Download PDF</span>
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
