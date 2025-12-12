import { useRef, useState, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent as AlertDialogContentRoot,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  showCommitButton?: boolean;
  onCommit?: (lineItems: InvoiceLineItem[]) => void;
  pendingUnapprovedCount?: number;
  rentalOwner?: string;
}

export default function InvoicePreviewModal({
  open,
  onOpenChange,
  propertyAddress,
  propertyLocation,
  billTo,
  invoiceDate,
  lineItems: initialLineItems,
  showCommitButton = false,
  onCommit,
  pendingUnapprovedCount = 0,
  rentalOwner,
}: InvoicePreviewModalProps) {
  const invoiceRef = useRef<HTMLDivElement | null>(null);
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>(initialLineItems);
  const [activeAmountId, setActiveAmountId] = useState<number | null>(null);
  const [amountDraftById, setAmountDraftById] = useState<Record<number, string>>({});
  const [showCommitConfirm, setShowCommitConfirm] = useState(false);

  const normalizeAmountDraft = (value: string): string => {
    const cleaned = value.replace(/[^\d.]/g, "");
    const firstDot = cleaned.indexOf(".");
    if (firstDot === -1) return cleaned;

    const intPart = cleaned.slice(0, firstDot);
    const decPart = cleaned.slice(firstDot + 1).replace(/\./g, "");
    return `${intPart}.${decPart}`;
  };

  const toCanonicalAmount = (value: string): string => {
    const draft = normalizeAmountDraft(value);
    const num = parseFloat(draft);
    return Number.isFinite(num) ? num.toFixed(2) : "0.00";
  };

  // Format number as currency with commas (e.g., "1234.56" -> "$1,234.56")
  const formatCurrency = (value: string | number): string => {
    const num = typeof value === "string"
      ? parseFloat(value.replace(/[$,]/g, ""))
      : value;

    if (isNaN(num)) return "$0.00";

    return "$" + num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // Sync state when props change
  useEffect(() => {
    setLineItems(
      initialLineItems.map((item) => ({
        ...item,
        amount: toCanonicalAmount(item.amount),
      })),
    );
    setActiveAmountId(null);
    setAmountDraftById({});
  }, [initialLineItems]);

  const calculateTotal = () => {
    return lineItems.reduce((sum, item) => {
      // Extract numeric value, handles both raw numbers and formatted currency
      const amount = parseFloat(item.amount.replace(/[^\d.]/g, "")) || 0;
      return sum + amount;
    }, 0);
  };

  const getNextLineItemId = () => {
    return lineItems.reduce((max, item) => Math.max(max, item.id), 0) + 1;
  };

  const handleAddLineItem = () => {
    const nextItem: InvoiceLineItem = {
      id: getNextLineItemId(),
      vendor: "",
      description: "",
      amount: "0.00",
    };

    setLineItems((prev) => [...prev, nextItem]);
  };

  const handleRemoveLineItem = (id: number) => {
    setLineItems(lineItems.filter((item) => item.id !== id));
  };

  const handleUpdateLineItem = (
    id: number,
    field: keyof InvoiceLineItem,
    value: string,
  ) => {
    setLineItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  };

  // Format amount with commas for final display
  const formatAmountWithCommas = (amount: string): string => {
    const num = parseFloat(amount.replace(/[^\d.]/g, "")) || 0;
    return "$" + num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const handleDownloadPDF = async () => {
    const invoiceNode = invoiceRef.current;
    if (!invoiceNode) return;

    const clone = invoiceNode.cloneNode(true) as HTMLElement;

    // Update print-only spans with formatted values
    clone.querySelectorAll<HTMLInputElement>("input.edit-field").forEach((input) => {
      const container = input.parentElement;
      const span = container?.querySelector<HTMLSpanElement>("span.print-only");
      if (!span) return;

      const field = input.dataset.field;
      span.textContent = field === "amount"
        ? formatAmountWithCommas(input.value)
        : input.value;
    });

    // Remove interactive elements
    clone.querySelectorAll(".no-print").forEach((el) => el.remove());
    clone.querySelectorAll(".edit-field").forEach((el) => el.remove());

    // Make print-only content visible for screen rendering (PDF capture uses screen styles)
    clone.querySelectorAll<HTMLElement>(".print-only").forEach((el) => {
      el.classList.remove("print-only");
      if (!el.style.display) el.style.display = "inline";
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

  const handleCommit = () => {
    if (pendingUnapprovedCount > 0) {
      setShowCommitConfirm(true);
      return;
    }

    onCommit?.(lineItems);
    onOpenChange(false);
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
      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setShowCommitConfirm(false);
          }
          onOpenChange(nextOpen);
        }}
      >
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
                  marginBottom: "5px",
                  width: "725px",
                }}
              >
                <div>
                  <div
                    style={{
                      letterSpacing: "1.5px",
                      font: "700 13px/21px Georgia, serif",
                    }}
                  >
                    AVMRE LLC
                  </div>
                  <div style={{ font: "400 10px/15.4px Arial, sans-serif" }}>
                    11 LARGO DRIVE SOUTH
                  </div>
                  <div style={{ font: "400 10px/15.4px Arial, sans-serif" }}>
                    SUITE 200
                  </div>
                  <div style={{ font: "400 10px/15.4px Arial, sans-serif" }}>
                    STAMFORD, CT 06907
                  </div>
                  <div style={{ font: "700 10px/15.4px Arial, sans-serif" }}>
                    203-987-7050
                  </div>

                  <div style={{ marginTop: "40px" }}>
                    <div
                      style={{
                        letterSpacing: "1.2px",
                        marginBottom: "4px",
                        font: "700 9px/15px Georgia, serif",
                      }}
                    >
                      BILL TO:
                    </div>
                    <div style={{ font: "400 9px/16.5px Arial, sans-serif" }}>
                      {rentalOwner || billTo}
                    </div>
                    <div style={{ font: "400 9px/16.5px Arial, sans-serif" }}>
                      {"\u00A0"}
                    </div>
                  </div>
                </div>

                <div style={{ fontWeight: "400", marginRight: "25px" }}>
                  <div
                    style={{
                      letterSpacing: "1.5px",
                      font: "700 13px/21px Georgia, serif",
                    }}
                  >
                    INVOICE
                  </div>
                  <div style={{ width: "150px", font: "400 10px/15.4px Arial, sans-serif" }}>
                    DATE: {invoiceDate}
                  </div>
                  <div style={{ font: "400 10px/15.4px Arial, sans-serif" }}>
                    {"\u00A0"}
                  </div>
                  <div style={{ font: "400 10px/15.4px Arial, sans-serif" }}>
                    {"\u00A0"}
                  </div>
                  <div style={{ font: "700 10px/15.4px Arial, sans-serif" }}>
                    {"\u00A0"}
                  </div>

                  <div style={{ marginTop: "40px" }}>
                    <div
                      style={{
                        letterSpacing: "1.2px",
                        marginBottom: "4px",
                        font: "700 9px/15px Georgia, serif",
                      }}
                    >
                      PROPERTY:
                    </div>
                    <div style={{ font: "400 9px/16.5px Arial, sans-serif" }}>
                      {propertyAddress}
                    </div>
                    <div style={{ font: "400 9px/16.5px Arial, sans-serif" }}>
                      Westport, CT, 28282
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
                      font: "700 9px/16.5px Arial, sans-serif"
                    }}>
                      Vendors
                    </th>
                    <th style={{
                      textAlign: "left",
                      paddingBottom: "8px",
                      borderBottom: "1px solid #BF8F00",
                      font: "700 9px/16.5px Arial, sans-serif"
                    }}>
                      Description
                    </th>
                    <th style={{
                      fontSize: "9px",
                      fontWeight: 700,
                      textAlign: "left",
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
                        paddingTop: "2px",
                        paddingBottom: "2px",
                        borderBottom: "1px solid #BF8F00",
                        verticalAlign: "middle"
                      }}>
                        <input
                          type="text"
                          value={item.vendor}
                          data-field="vendor"
                          onChange={(e) =>
                            handleUpdateLineItem(item.id, "vendor", e.target.value)
                          }
                          className="edit-field"
                          style={{
                            width: "100%",
                            border: "none",
                            outline: "none",
                            background: "transparent",
                            color: "#002060",
                            overflowWrap: "anywhere",
                            wordWrap: "anywhere",
                            font: "400 9px Arial, sans-serif",
                            padding: 0
                          }}
                        />
                        <span
                          className="print-only"
                          style={{
                            display: "inline-block",
                            width: "100%",
                            color: "#002060",
                            overflowWrap: "anywhere",
                            wordWrap: "anywhere",
                            font: "400 9px/16.5px Arial, sans-serif",
                          }}
                        >
                          {item.vendor}
                        </span>
                      </td>
                      <td style={{
                        fontSize: "11px",
                        paddingTop: "2px",
                        paddingBottom: "2px",
                        borderBottom: "1px solid #BF8F00",
                        verticalAlign: "middle"
                      }}>
                        <input
                          type="text"
                          value={item.description}
                          data-field="description"
                          onChange={(e) =>
                            handleUpdateLineItem(item.id, "description", e.target.value)
                          }
                          className="edit-field"
                          style={{
                            width: "100%",
                            border: "none",
                            outline: "none",
                            background: "transparent",
                            color: "#002060",
                            overflowWrap: "anywhere",
                            wordWrap: "anywhere",
                            font: "400 9px Arial, sans-serif",
                            padding: 0
                          }}
                        />
                        <span
                          className="print-only"
                          style={{
                            display: "inline-block",
                            width: "100%",
                            color: "#002060",
                            overflowWrap: "anywhere",
                            wordWrap: "anywhere",
                            font: "400 9px/16.5px Arial, sans-serif",
                          }}
                        >
                          {item.description}
                        </span>
                      </td>
                      <td style={{
                        fontSize: "11px",
                        paddingTop: "2px",
                        paddingBottom: "2px",
                        borderBottom: "1px solid #BF8F00",
                        backgroundColor: "#F2F2F2",
                        textAlign: "left",
                        paddingRight: "18px",
                        paddingLeft: "8px",
                        verticalAlign: "middle",
                        position: "relative",
                        overflow: "visible"
                      }}>
                        <input
                          type="text"
                          value={activeAmountId === item.id
                            ? `$${amountDraftById[item.id] ?? normalizeAmountDraft(item.amount)}`
                            : formatAmountWithCommas(item.amount)}
                          data-field="amount"
                          onChange={(e) => {
                            const nextDraft = normalizeAmountDraft(e.target.value);
                            setAmountDraftById((prev) => ({ ...prev, [item.id]: nextDraft }));
                            setLineItems((prev) =>
                              prev.map((lineItem) =>
                                lineItem.id === item.id
                                  ? { ...lineItem, amount: nextDraft }
                                  : lineItem,
                              ),
                            );
                          }}
                          onFocus={(e) => {
                            setActiveAmountId(item.id);
                            setAmountDraftById((prev) => ({
                              ...prev,
                              [item.id]: normalizeAmountDraft(item.amount),
                            }));
                            requestAnimationFrame(() => e.target.select());
                          }}
                          onMouseUp={(e) => {
                            e.preventDefault();
                          }}
                          onBlur={(e) => {
                            const canonical = toCanonicalAmount(e.target.value);
                            setLineItems((prev) =>
                              prev.map((lineItem) =>
                                lineItem.id === item.id
                                  ? { ...lineItem, amount: canonical }
                                  : lineItem,
                              ),
                            );
                            setAmountDraftById((prev) => {
                              const { [item.id]: _removed, ...rest } = prev;
                              return rest;
                            });
                            setActiveAmountId((current) => (current === item.id ? null : current));
                          }}
                          placeholder="$0.00"
                          className="edit-field"
                          style={{
                            width: "100%",
                            border: "none",
                            outline: "none",
                            background: "transparent",
                            color: "#002060",
                            overflowWrap: "anywhere",
                            wordWrap: "anywhere",
                            font: "400 9px Arial, sans-serif",
                            textAlign: "left",
                            padding: "0"
                          }}
                        />
                        <span
                          className="print-only"
                          style={{
                            display: "inline-block",
                            width: "100%",
                            color: "#002060",
                            overflowWrap: "anywhere",
                            wordWrap: "anywhere",
                            font: "400 9px/16.5px Arial, sans-serif",
                            textAlign: "left",
                          }}
                        >
                          {formatAmountWithCommas(item.amount)}
                        </span>
                        <button
                          onClick={() => handleRemoveLineItem(item.id)}
                          className="no-print"
                          style={{
                            position: "absolute",
                            right: "-18px",
                            zIndex: 2,
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
                marginBottom: "20px"
              }}>
                <div style={{
                  marginRight: "20px",
                  font: "700 9px/16.5px Arial, sans-serif"
                }}>
                  TOTAL:
                </div>
                <div style={{
                  font: "400 9px/16.5px Arial, sans-serif",
                  backgroundColor: "#F2F2F2",
                  padding: "8px 12px",
                  textAlign: "left",
                  minWidth: "120px",
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                  textOverflow: "clip"
                }}>
                  <b>{formatCurrency(calculateTotal())}</b>
                </div>
              </div>

              {/* Footer */}
              <div style={{ fontSize: "7px", lineHeight: "16px", marginTop: "-3px" }}>
                <div
                  style={{
                    fontWeight: 700,
                    fontFamily: "Arial, sans-serif",
                    marginTop: "-4px",
                  }}
                >
                  Please make all checks payable to AVMRE LLC
                </div>
                <div
                  style={{
                    fontFamily: "Arial, sans-serif",
                    marginTop: "-4px",
                  }}
                >
                  If you have any questions concerning this invoice, use the following contact information:
                </div>
                <div style={{ fontFamily: "Arial, sans-serif", marginTop: "-4px" }}>
                  203-987-7050
                </div>
                <div style={{ color: "#0563C1", marginTop: "-4px" }}>
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
                <div style={{ fontWeight: 700, fontFamily: "Arial, sans-serif", marginTop: "-4px" }}>
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

            {showCommitButton && (
              <button
                type="button"
                onClick={handleCommit}
                className="flex h-9 items-center gap-2 px-4 rounded-lg border border-white bg-[#013764] shadow-[0_0_0_1px_#002D5A,0_0_10px_-5px_rgba(0,0,0,0.2)] hover:bg-[#003a73] transition-colors"
              >
                <span className="text-white font-medium text-base">Commit</span>
              </button>
            )}

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

      <AlertDialog open={showCommitConfirm} onOpenChange={setShowCommitConfirm}>
        <AlertDialogContentRoot>
          <AlertDialogHeader>
            <AlertDialogTitle>Commit invoice?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to commit? There are unapproved bills outstanding.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowCommitConfirm(false);
                onCommit?.(lineItems);
                onOpenChange(false);
              }}
            >
              Commit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContentRoot>
      </AlertDialog>
    </>
  );
}
