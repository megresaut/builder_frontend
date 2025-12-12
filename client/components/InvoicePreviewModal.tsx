import { useRef, useState, useEffect } from "react";
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

  // Sync state when props change
  useEffect(() => {
    setLineItems(initialLineItems);
  }, [initialLineItems]);

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

    // Update print-only spans with current values (html2canvas doesn't reliably capture <input> values)
    clone.querySelectorAll<HTMLInputElement>("input.edit-field").forEach((input) => {
      const container = input.parentElement;
      const span = container?.querySelector<HTMLSpanElement>("span.print-only");
      if (span) {
        span.textContent = input.value;
      }
    });

    // Remove interactive elements
    clone.querySelectorAll(".no-print").forEach((el) => el.remove());
    clone.querySelectorAll(".edit-field").forEach((el) => el.remove());

    // Make print-only content visible for screen rendering (PDF capture uses screen styles)
    clone.querySelectorAll<HTMLElement>(".print-only").forEach((el) => {
      el.classList.remove("print-only");
      el.style.display = "inline";
    });

    const element = document.createElement("div");
    element.style.width = "816px";
    element.style.padding = "0";
    element.style.margin = "0";
    element.style.background = "white";
    element.appendChild(clone);

    const opt: any = {
      margin: 0,
      filename: "invoice.pdf",
      image: { type: "png", quality: 1 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        logging: false,
        allowTaint: true,
        letterRendering: true,
        backgroundColor: "#ffffff"
      },
      jsPDF: {
        unit: "px",
        format: [816, 1056],
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
          <div className="flex-1 overflow-y-auto bg-white flex justify-center items-start p-4">
            {/* Invoice Container - Letter Size 8.5x11 inches = 816x1056px */}
            <div
              ref={invoiceRef}
              style={{
                width: "816px",
                minHeight: "1056px",
                padding: "60px 72px",
                backgroundColor: "white",
                fontFamily: "Inter, -apple-system, Roboto, Helvetica, sans-serif",
                color: "#002060",
                boxSizing: "border-box",
              }}
            >
              {/* Header Section */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "30px",
                  width: "725px",
                }}
              >
                <div>
                  <div
                    style={{
                      letterSpacing: "1.5px",
                      marginBottom: "4px",
                      font: "700 14px/21px Georgia, serif",
                    }}
                  >
                    AVMRE LLC
                  </div>
                  <div style={{ font: "400 11px/15.4px Arial, sans-serif" }}>
                    11 LARGO DRIVE SOUTH
                  </div>
                  <div style={{ font: "400 11px/15.4px Arial, sans-serif" }}>
                    SUITE 200
                  </div>
                  <div style={{ font: "400 11px/15.4px Arial, sans-serif" }}>
                    STAMFORD, CT 06907
                  </div>
                  <div style={{ font: "700 11px/15.4px Arial, sans-serif" }}>
                    203-987-7050
                  </div>

                  <div style={{ marginTop: "40px" }}>
                    <div
                      style={{
                        letterSpacing: "1.2px",
                        marginBottom: "4px",
                        font: "700 10px/15px Georgia, serif",
                      }}
                    >
                      BILL TO:
                    </div>
                    <div style={{ font: "400 11px/16.5px Arial, sans-serif" }}>
                      {billTo}
                    </div>
                  </div>
                </div>

                <div style={{ width: "175px" }}>
                  <div
                    style={{
                      letterSpacing: "1.5px",
                      marginBottom: "4px",
                      font: "700 14px/21px Georgia, serif",
                    }}
                  >
                    INVOICE
                  </div>
                  <div style={{ font: "400 11px/15.4px Arial, sans-serif" }}>
                    DATE: {invoiceDate}
                  </div>
                  <div style={{ font: "400 11px/15.4px Arial, sans-serif" }}>
                    {"\u00A0"}
                  </div>
                  <div style={{ font: "400 11px/15.4px Arial, sans-serif" }}>
                    {"\u00A0"}
                  </div>
                  <div style={{ font: "700 11px/15.4px Arial, sans-serif" }}>
                    {"\u00A0"}
                  </div>

                  <div style={{ marginTop: "40px" }}>
                    <div
                      style={{
                        letterSpacing: "1.2px",
                        marginBottom: "4px",
                        font: "700 10px/15px Georgia, serif",
                      }}
                    >
                      PROPERTY:
                    </div>
                    <div style={{ font: "400 11px/16.5px Arial, sans-serif" }}>
                      {propertyAddress}
                    </div>
                    <div style={{ font: "400 11px/16.5px Arial, sans-serif" }}>
                      {propertyLocation}
                    </div>
                  </div>
                </div>
              </div>

              {/* Table */}
              <table style={{ 
                width: "100%", 
                borderCollapse: "collapse",
                marginBottom: "20px"
              }}>
                <thead>
                  <tr>
                    <th style={{
                      textAlign: "left",
                      paddingBottom: "8px",
                      borderBottom: "1px solid #BF8F00",
                      font: "700 11px/16.5px Arial, sans-serif"
                    }}>
                      Vendors
                    </th>
                    <th style={{
                      textAlign: "left",
                      paddingBottom: "8px",
                      borderBottom: "1px solid #BF8F00",
                      font: "700 11px/16.5px Arial, sans-serif"
                    }}>
                      Description
                    </th>
                    <th style={{ 
                      fontSize: "11px",
                      fontWeight: 700,
                      textAlign: "right",
                      paddingBottom: "8px",
                      borderBottom: "1px solid #BF8F00",
                      width: "120px"
                    }}>
                      AMOUNT
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((item) => (
                    <tr key={item.id}>
                      <td style={{ 
                        fontSize: "11px",
                        paddingTop: "12px",
                        paddingBottom: "12px",
                        borderBottom: "1px solid #BF8F00",
                        verticalAlign: "top"
                      }}>
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
                            fontSize: "11px",
                            color: "#002060",
                            fontFamily: "Arial, sans-serif",
                            padding: 0
                          }}
                        />
                        <span className="print-only">{item.vendor}</span>
                      </td>
                      <td style={{ 
                        fontSize: "11px",
                        paddingTop: "12px",
                        paddingBottom: "12px",
                        borderBottom: "1px solid #BF8F00",
                        verticalAlign: "top"
                      }}>
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
                            fontSize: "11px",
                            color: "#002060",
                            fontFamily: "Arial, sans-serif",
                            padding: 0
                          }}
                        />
                        <span className="print-only">{item.description}</span>
                      </td>
                      <td style={{ 
                        fontSize: "11px",
                        paddingTop: "12px",
                        paddingBottom: "12px",
                        borderBottom: "1px solid #BF8F00",
                        backgroundColor: "#F2F2F2",
                        textAlign: "right",
                        paddingRight: "12px",
                        verticalAlign: "top",
                        position: "relative"
                      }}>
                        <input
                          type="text"
                          value={item.amount}
                          onChange={(e) =>
                            handleUpdateLineItem(item.id, "amount", e.target.value)
                          }
                          className="edit-field"
                          style={{
                            width: "calc(100% - 30px)",
                            border: "none",
                            outline: "none",
                            background: "transparent",
                            fontSize: "11px",
                            color: "#002060",
                            fontFamily: "Arial, sans-serif",
                            textAlign: "right",
                            padding: 0
                          }}
                        />
                        <span className="print-only">{item.amount}</span>
                        <button
                          onClick={() => handleRemoveLineItem(item.id)}
                          className="no-print"
                          style={{
                            position: "absolute",
                            right: "4px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            border: "none",
                            background: "none",
                            color: "#ef4444",
                            cursor: "pointer",
                            fontSize: "18px",
                            fontWeight: "bold",
                            padding: "0 4px",
                            lineHeight: "1"
                          }}
                          title="Remove line item"
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Total */}
              <div style={{ 
                display: "flex", 
                justifyContent: "flex-end",
                alignItems: "center",
                marginBottom: "40px"
              }}>
                <div style={{
                  marginRight: "20px",
                  font: "700 11px/16.5px Arial, sans-serif"
                }}>
                  TOTAL:
                </div>
                <div style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  backgroundColor: "#F2F2F2",
                  padding: "8px 12px",
                  textAlign: "right",
                  width: "120px"
                }}>
                  ${" "}
                  <span style={{ fontFamily: "Arial, sans-serif" }}>
                    {calculateTotal().toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Footer */}
              <div style={{ fontSize: "10px", lineHeight: "16px" }}>
                <div
                  style={{
                    fontWeight: 700,
                    marginBottom: "4px",
                    fontFamily: "Arial, sans-serif",
                  }}
                >
                  Please make all checks payable to AVMRE LLC
                </div>
                <div
                  style={{
                    marginBottom: "4px",
                    fontFamily: "Arial, sans-serif",
                  }}
                >
                  If you have any questions concerning this invoice, use the following contact information:
                </div>
                <div style={{ marginBottom: "4px", fontFamily: "Arial, sans-serif" }}>
                  203-987-7050
                </div>
                <div style={{ color: "#0563C1", marginBottom: "4px" }}>
                  <a
                    href="mailto:STAFF@AVMRE.COM"
                    style={{
                      color: "inherit",
                      textDecoration: "none",
                      fontFamily: "Arial, sans-serif",
                    }}
                  >
                    STAFF@AVMRE.COM
                  </a>
                </div>
                <div style={{ fontWeight: 700, fontFamily: "Arial, sans-serif" }}>
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
