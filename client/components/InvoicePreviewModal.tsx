import { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import html2pdf from "html2pdf.js";

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
  const invoiceRef = useRef<HTMLDivElement | null>(null);
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

  const handleDownloadPDF = async () => {
    const invoiceNode = invoiceRef.current;
    if (!invoiceNode) return;

    const clone = invoiceNode.cloneNode(true) as HTMLElement;

    clone.querySelectorAll(".no-print").forEach((el) => el.remove());
    clone.querySelectorAll(".edit-field").forEach((el) => el.remove());
    clone.querySelectorAll(".print-only").forEach((el) => {
      (el as HTMLElement).style.display = "block";
    });

    const element = document.createElement("div");
    element.style.width = "210mm";
    element.style.padding = "0";
    element.style.margin = "0";
    element.style.background = "white";
    element.style.color = "#002060";
    element.style.fontFamily = "Inter, -apple-system, Roboto, Helvetica, sans-serif";
    element.appendChild(clone);

    const opt: any = {
      margin: 0,
      filename: "invoice.pdf",
      image: { type: "png", quality: 1 },
      html2canvas: { 
        scale: 6, 
        useCORS: true, 
        logging: false, 
        allowTaint: true,
        letterRendering: true,
        backgroundColor: "#ffffff",
        windowHeight: 1188,
        windowWidth: 840
      },
      jsPDF: { 
        unit: "mm", 
        format: "a4", 
        orientation: "portrait",
        compress: true
      },
    };

    try {
      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  return (
    <>
      <style>{`
        @media screen {
          .print-only {
            display: none !important;
          }
        }
      `}</style>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[95vw] md:max-w-[880px] max-h-[95vh] flex flex-col p-0">
          <DialogTitle className="sr-only">Invoice Preview</DialogTitle>
          <div className="flex-1 overflow-y-auto bg-white flex justify-center items-start">
            {/* Invoice Container */}
            <div
              ref={invoiceRef}
              className="bg-white"
              style={{
                width: "210mm",
                height: "297mm",
                padding: "20mm 18mm",
                boxSizing: "border-box",
                fontFamily: "Inter, -apple-system, Roboto, Helvetica, sans-serif",
                color: "#002060",
                flexShrink: 0,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* Header Section */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "start",
                  gap: "80px",
                  marginBottom: "6px",
                  flexShrink: 0,
                }}
              >
                {/* Left Column */}
                <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                  <div style={{ marginBottom: "24px" }}>
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
                        letterSpacing: "0.27px",
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
                        letterSpacing: "0.11px",
                      }}
                    >
                      STAMFORD, CT 06907
                    </div>
                    <div
                      style={{
                        fontSize: "7px",
                        fontWeight: 700,
                        lineHeight: "9px",
                        letterSpacing: "-0.66px",
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
                        letterSpacing: "0.84px",
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
                    minHeight: "auto",
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
                        letterSpacing: "0.76px",
                        marginBottom: "2px",
                      }}
                    >
                      PROPERTY:
                    </div>
                    <div
                      style={{
                        fontSize: "6px",
                        lineHeight: "7px",
                        letterSpacing: "-0.09px",
                      }}
                    >
                      {propertyAddress}
                    </div>
                    <div
                      style={{
                        fontSize: "6px",
                        lineHeight: "7px",
                        letterSpacing: "-0.17px",
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
                  marginTop: "6px",
                  marginBottom: "1px",
                  flexShrink: 0,
                }}
              >
                <div style={{ width: "117px" }}>Vendors</div>
                <div style={{ flex: 1, minWidth: "240px" }}>Description</div>
                <div style={{ width: "95px", textAlign: "right" }}>AMOUNT</div>
              </div>

              {/* Line Items */}
              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                }}
              >
                {lineItems.map((item, index) => (
                  <div
                    key={item.id}
                    style={{
                      borderBottom: "1px solid #BF8F00",
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
                        className="edit-field"
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
                      <span className="print-only">{item.vendor}</span>
                    </div>
                    <div
                      style={{
                        flex: 1,
                        minWidth: "240px",
                        paddingTop: "5px",
                        letterSpacing: "-0.09px",
                      }}
                    >
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) =>
                          handleUpdateLineItem(item.id, "description", e.target.value)
                        }
                        className="edit-field"
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
                      <span className="print-only">{item.description}</span>
                    </div>
                    <div
                      style={{
                        width: "95px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <input
                          type="text"
                          value={item.amount}
                          onChange={(e) =>
                            handleUpdateLineItem(item.id, "amount", e.target.value)
                          }
                          className="edit-field"
                          style={{
                            width: "100%",
                            border: "none",
                            outline: "none",
                            background: "#F2F2F2",
                            fontSize: "6px",
                            lineHeight: "7px",
                            color: "#002060",
                            textAlign: "right",
                            padding: "5px",
                            fontFamily: "Inter, -apple-system, Roboto, Helvetica, sans-serif",
                            letterSpacing: "-0.17px",
                          }}
                        />
                        <span
                          className="print-only"
                          style={{
                            background: "#F2F2F2",
                            display: "block",
                            padding: "5px",
                            width: "100%",
                            textAlign: "right",
                            letterSpacing: "-0.17px",
                            boxSizing: "border-box",
                          }}
                        >
                          {item.amount}
                        </span>
                      </div>
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
                          marginLeft: "8px",
                        }}
                        title="Remove line item"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  alignItems: "center",
                  marginTop: "8px",
                  marginBottom: "12px",
                  fontSize: "6px",
                  fontWeight: 700,
                  lineHeight: "7px",
                  flexShrink: 0,
                }}
              >
                <div style={{ letterSpacing: "0.35px", marginRight: "5px" }}>
                  TOTAL:
                </div>
                <div
                  style={{
                    width: "95px",
                    background: "#F2F2F2",
                    padding: "5px",
                    textAlign: "right",
                    letterSpacing: "-0.26px",
                    boxSizing: "border-box",
                  }}
                >
                  ${calculateTotal().toFixed(2)}
                </div>
              </div>

              {/* Footer */}
              <div
                style={{
                  display: "flex",
                  maxWidth: "492px",
                  flexDirection: "column",
                  fontSize: "5px",
                  fontWeight: 400,
                  lineHeight: 1.18,
                  flexShrink: 0,
                }}
              >
                <div style={{ fontWeight: 700, letterSpacing: "0.06px" }}>
                  Please make all checks payable to AVMRE LLC
                </div>
                <div style={{ letterSpacing: "-0.09px" }}>
                  If you have any questions concerning this invoice, use the following contact information:
                </div>
                <div style={{ letterSpacing: "-0.32px" }}>203-987-7050</div>
                <div
                  style={{
                    display: "flex",
                    minHeight: "15px",
                    width: "67px",
                    alignItems: "end",
                    overflow: "hidden",
                    color: "#0563C1",
                    letterSpacing: "0.24px",
                  }}
                >
                  <div>
                    <a href="mailto:STAFF@AVMRE.COM" target="_blank" style={{ color: "inherit", textDecoration: "none" }}>
                      STAFF@AVMRE.COM
                    </a>
                  </div>
                </div>
                <div style={{ fontWeight: 700, letterSpacing: "0.16px" }}>
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
              onClick={handleAddLineItem}
              className="flex h-9 items-center gap-2 px-4 rounded-lg border border-[#002D5A] bg-white text-[#002D5A] hover:bg-gray-50 transition-colors"
            >
              <svg
                width="18"
                height="18"
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
              <span className="font-medium text-base">Add Line Item</span>
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
