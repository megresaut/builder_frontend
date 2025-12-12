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
        
        .invoice-table {
          width: 100%;
          border-collapse: collapse;
          font-family: Inter, -apple-system, Roboto, Helvetica, sans-serif;
        }
        
        .invoice-table th {
          font-size: 23px;
          font-weight: 700;
          line-height: 1.25;
          text-align: left;
          padding-bottom: 4px;
        }
        
        .invoice-table td {
          font-size: 23px;
          font-weight: 400;
          line-height: 1.25;
          padding-top: 21px;
          vertical-align: top;
        }
        
        .invoice-row {
          border-bottom: 2px solid rgba(191, 143, 0, 1);
          min-height: 71px;
        }
        
        .amount-cell {
          background-color: rgba(242, 242, 242, 1);
          text-align: right;
          letter-spacing: -0.73px;
          padding-left: 21px;
          padding-right: 21px;
        }
      `}</style>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[95vw] md:max-w-[880px] max-h-[95vh] flex flex-col p-0">
          <DialogTitle className="sr-only">Invoice Preview</DialogTitle>
          <div className="flex-1 overflow-y-auto bg-white flex justify-center items-start">
            {/* Invoice Container */}
            <div
              ref={invoiceRef}
              style={{
                width: "2546px",
                maxWidth: "100%",
                paddingTop: "18px",
                paddingBottom: "18px",
                backgroundColor: "white",
                fontFamily: "Inter, -apple-system, Roboto, Helvetica, sans-serif",
                color: "rgba(0, 32, 96, 1)",
              }}
            >
              <div
                style={{
                  paddingLeft: "300px",
                  paddingRight: "200px",
                  paddingTop: "299px",
                  paddingBottom: "200px",
                }}
              >
                <div style={{ maxWidth: "2047px" }}>
                  {/* Header Section */}
                  <div
                    style={{
                      display: "flex",
                      width: "100%",
                      paddingRight: "83px",
                      alignItems: "start",
                      gap: "100px",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                    }}
                  >
                    {/* Left Column */}
                    <div
                      style={{
                        display: "flex",
                        minWidth: "240px",
                        flexDirection: "column",
                        width: "416px",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "38px",
                          fontWeight: 700,
                          letterSpacing: "4.78px",
                          lineHeight: 1.2,
                        }}
                      >
                        AVMRE LLC
                      </div>
                      <div
                        style={{
                          fontSize: "29px",
                          fontWeight: 400,
                          lineHeight: 1.29,
                          letterSpacing: "1.14px",
                        }}
                      >
                        11 LARGO DRIVE SOUTH
                      </div>
                      <div
                        style={{
                          fontSize: "29px",
                          fontWeight: 400,
                          lineHeight: 1.29,
                        }}
                      >
                        SUITE 200
                      </div>
                      <div
                        style={{
                          fontSize: "29px",
                          fontWeight: 400,
                          lineHeight: 1.29,
                          letterSpacing: "0.45px",
                        }}
                      >
                        STAMFORD, CT 06907
                      </div>
                      <div
                        style={{
                          fontSize: "29px",
                          fontWeight: 700,
                          lineHeight: 1.29,
                          letterSpacing: "-2.73px",
                        }}
                      >
                        203-987-7050
                      </div>

                      <div style={{ marginTop: "162px" }}>
                        <div
                          style={{
                            fontSize: "22px",
                            fontWeight: 700,
                            letterSpacing: "3.51px",
                            lineHeight: 1.3,
                          }}
                        >
                          BILL TO:
                        </div>
                        <div
                          style={{
                            fontSize: "23px",
                            fontWeight: 400,
                            lineHeight: 1.25,
                          }}
                        >
                          {billTo}
                        </div>
                      </div>
                    </div>

                    {/* Right Column */}
                    <div
                      style={{
                        display: "flex",
                        minWidth: "240px",
                        minHeight: "445px",
                        flexDirection: "column",
                        justifyContent: "space-between",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: "38px",
                            fontWeight: 700,
                            lineHeight: 1.2,
                            letterSpacing: "4.78px",
                          }}
                        >
                          INVOICE
                        </div>
                        <div
                          style={{
                            fontSize: "29px",
                            fontWeight: 400,
                            lineHeight: 1.29,
                          }}
                        >
                          DATE: {invoiceDate}
                        </div>
                      </div>
                      <div style={{ marginTop: "271px" }}>
                        <div
                          style={{
                            fontSize: "22px",
                            fontWeight: 700,
                            lineHeight: 1.3,
                            letterSpacing: "3.16px",
                          }}
                        >
                          PROPERTY:
                        </div>
                        <div
                          style={{
                            fontSize: "23px",
                            fontWeight: 400,
                            lineHeight: 1.25,
                            letterSpacing: "-0.36px",
                          }}
                        >
                          {propertyAddress}
                        </div>
                        <div
                          style={{
                            fontSize: "23px",
                            fontWeight: 400,
                            lineHeight: 1.25,
                            letterSpacing: "-0.73px",
                          }}
                        >
                          {propertyLocation}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Table */}
                  <div style={{ marginTop: "37px" }}>
                    <table className="invoice-table">
                      <thead>
                        <tr>
                          <th style={{ width: "487px" }}>Vendors</th>
                          <th style={{ width: "1173px" }}>Description</th>
                          <th style={{ width: "295px", textAlign: "right" }}>AMOUNT</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lineItems.map((item, index) => (
                          <tr key={item.id} className="invoice-row">
                            <td>
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
                                  fontSize: "23px",
                                  lineHeight: 1.25,
                                  color: "rgba(0, 32, 96, 1)",
                                  fontFamily: "Inter, -apple-system, Roboto, Helvetica, sans-serif",
                                  fontWeight: 400,
                                }}
                              />
                              <span className="print-only">{item.vendor}</span>
                            </td>
                            <td style={{ letterSpacing: "-0.36px" }}>
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
                                  fontSize: "23px",
                                  lineHeight: 1.25,
                                  color: "rgba(0, 32, 96, 1)",
                                  fontFamily: "Inter, -apple-system, Roboto, Helvetica, sans-serif",
                                  fontWeight: 400,
                                }}
                              />
                              <span className="print-only">{item.description}</span>
                            </td>
                            <td className="amount-cell">
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <input
                                  type="text"
                                  value={item.amount}
                                  onChange={(e) =>
                                    handleUpdateLineItem(item.id, "amount", e.target.value)
                                  }
                                  className="edit-field"
                                  style={{
                                    flex: 1,
                                    border: "none",
                                    outline: "none",
                                    background: "transparent",
                                    fontSize: "23px",
                                    lineHeight: 1.25,
                                    color: "rgba(0, 32, 96, 1)",
                                    fontFamily: "Inter, -apple-system, Roboto, Helvetica, sans-serif",
                                    fontWeight: 400,
                                    textAlign: "right",
                                  }}
                                />
                                <span className="print-only" style={{ flex: 1, textAlign: "right" }}>{item.amount}</span>
                                <button
                                  onClick={() => handleRemoveLineItem(item.id)}
                                  className="no-print"
                                  style={{
                                    border: "none",
                                    background: "none",
                                    color: "#ef4444",
                                    cursor: "pointer",
                                    fontSize: "24px",
                                    fontWeight: "bold",
                                    padding: "0 8px",
                                    marginLeft: "12px",
                                  }}
                                  title="Remove line item"
                                >
                                  ×
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Total */}
                  <div
                    style={{
                      display: "flex",
                      marginTop: "42px",
                      height: "54px",
                      alignItems: "end",
                      fontWeight: 700,
                      fontSize: "23px",
                      lineHeight: 1.25,
                      justifyContent: "end",
                      flexWrap: "wrap",
                    }}
                  >
                    <div style={{ letterSpacing: "1.46px", width: "129px" }}>
                      TOTAL:
                    </div>
                    <div
                      style={{
                        backgroundColor: "rgba(242, 242, 242, 1)",
                        minWidth: "240px",
                        minHeight: "54px",
                        paddingLeft: "21px",
                        paddingRight: "21px",
                        display: "flex",
                        alignItems: "end",
                        letterSpacing: "-1.09px",
                        width: "395px",
                      }}
                    >
                      <div style={{ width: "166px" }}>
                        ${calculateTotal().toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div
                    style={{
                      marginTop: "4px",
                      fontSize: "21px",
                      fontWeight: 400,
                      lineHeight: 1.18,
                    }}
                  >
                    <div style={{ fontWeight: 700, letterSpacing: "0.25px" }}>
                      Please make all checks payable to AVMRE LLC
                    </div>
                    <div style={{ letterSpacing: "-0.37px" }}>
                      If you have any questions concerning this invoice, use the following contact information:
                    </div>
                    <div style={{ letterSpacing: "-1.33px" }}>203-987-7050</div>
                    <div
                      style={{
                        color: "rgba(5, 99, 193, 1)",
                        letterSpacing: "0.99px",
                      }}
                    >
                      <a href="mailto:STAFF@AVMRE.COM" target="_blank" style={{ color: "inherit", textDecoration: "none" }}>
                        STAFF@AVMRE.COM
                      </a>
                    </div>
                    <div style={{ fontWeight: 700, letterSpacing: "0.66px" }}>
                      THANK YOU FOR YOUR BUSINESS!
                    </div>
                  </div>
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
