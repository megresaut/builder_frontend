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
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import html2pdf from "html2pdf.js";
import ExcelJS from "exceljs";

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
  onCommit?: (pdfBlob: Blob) => void;
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
  const [lineItems, setLineItems] =
    useState<InvoiceLineItem[]>(initialLineItems);
  const [activeAmountId, setActiveAmountId] = useState<number | null>(null);
  const [amountDraftById, setAmountDraftById] = useState<
    Record<number, string>
  >({});
  const [showCommitConfirm, setShowCommitConfirm] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

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
    const num =
      typeof value === "string"
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

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.setData("text/plain", String(index));
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setDragImage(e.currentTarget, 0, 0);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    setDragOverIndex(null);
    const dragIndex = draggedIndex;
    if (dragIndex == null || dragIndex === dropIndex) return;
    setLineItems((prev) => {
      const next = [...prev];
      const [removed] = next.splice(dragIndex, 1);
      // Insert so the dropped row ends up exactly at the highlighted row's position
      next.splice(dropIndex, 0, removed);
      return next;
    });
    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
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
    clone
      .querySelectorAll<HTMLInputElement>("input.edit-field")
      .forEach((input) => {
        const container = input.parentElement;
        const span =
          container?.querySelector<HTMLSpanElement>("span.print-only");
        if (!span) return;

        const field = input.dataset.field;
        span.textContent =
          field === "amount"
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
        backgroundColor: "#ffffff",
      },
      jsPDF: {
        unit: "px",
        format: [816, 1056],
        orientation: "portrait",
        compress: true,
      },
    };

    try {
      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  const handleExportToExcel = async () => {
    // Create workbook and worksheet matching the "Concierge Billing Invoice Template.xlsx" exactly
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("CURRENT MONTH", {
      views: [{ showGridLines: false }], // Hide gridlines to match template
    });

    // Define colors matching the template
    const darkBlueHex = "FF002060";
    const goldHex = "FFBF8F00";
    const lightGreyHex = "FFF2F2F2";
    const emailBlueHex = "FF0563C1";

    // Set column widths to match template layout exactly
    // Template has columns A (narrow), B (vendor/company), C (description), D (amount/property)
    worksheet.getColumn(1).width = 2.5;   // Column A - very narrow margin
    worksheet.getColumn(2).width = 22;    // Column B - Company info / Bill To / Vendors
    worksheet.getColumn(3).width = 50;    // Column C - Description (wider for merged content)
    worksheet.getColumn(4).width = 20;    // Column D - Invoice / Property / Amount

    // Helper function to set cell style
    const setCellStyle = (
      cell: ExcelJS.Cell,
      options: {
        bold?: boolean;
        fontSize?: number;
        color?: string;
        alignment?: Partial<ExcelJS.Alignment>;
        fill?: string;
        underline?: boolean;
        numFmt?: string;
        italic?: boolean;
      }
    ) => {
      cell.font = {
        name: "Calibri",
        bold: options.bold ?? false,
        size: options.fontSize ?? 11,
        color: options.color ? { argb: options.color } : { argb: darkBlueHex },
        underline: options.underline ? "single" : undefined,
        italic: options.italic ?? false,
      };
      if (options.alignment) {
        cell.alignment = { vertical: "middle", ...options.alignment };
      } else {
        cell.alignment = { vertical: "middle" };
      }
      if (options.fill) {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: options.fill },
        };
      }
      if (options.numFmt) {
        cell.numFmt = options.numFmt;
      }
    };

    // Set row heights to match template spacing
    worksheet.getRow(1).height = 21;  // Company name row
    worksheet.getRow(2).height = 15;  // Address line 1
    worksheet.getRow(3).height = 15;  // Address line 2
    worksheet.getRow(4).height = 15;  // City/State/Zip
    worksheet.getRow(5).height = 15;  // Phone
    worksheet.getRow(6).height = 10;  // Empty spacer
    worksheet.getRow(7).height = 10;  // Empty spacer
    worksheet.getRow(8).height = 18;  // Bill To / Property labels
    worksheet.getRow(9).height = 15;  // Name / Address line 1
    worksheet.getRow(10).height = 15; // Name / Address line 2
    worksheet.getRow(11).height = 10; // Empty spacer
    worksheet.getRow(12).height = 20; // Table headers

    // ========== ROW 1: Company Name & Invoice Title ==========
    // Merge B1:C1 for company name
    worksheet.mergeCells("B1:C1");
    worksheet.getCell("B1").value = "AVMRE LLC";
    setCellStyle(worksheet.getCell("B1"), {
      bold: true,
      fontSize: 18,
      color: darkBlueHex,
      alignment: { horizontal: "left" },
    });

    // D1: INVOICE
    worksheet.getCell("D1").value = "INVOICE";
    setCellStyle(worksheet.getCell("D1"), {
      bold: true,
      fontSize: 18,
      color: darkBlueHex,
      alignment: { horizontal: "right" },
    });

    // ========== ROW 2: Address Line 1 & Date ==========
    // Merge B2:C2 for address
    worksheet.mergeCells("B2:C2");
    worksheet.getCell("B2").value = "11 LARGO DRIVE SOUTH";
    setCellStyle(worksheet.getCell("B2"), { fontSize: 11, color: darkBlueHex });

    // D2: DATE: [Invoice Date]
    worksheet.getCell("D2").value = `DATE: ${invoiceDate}`;
    setCellStyle(worksheet.getCell("D2"), {
      fontSize: 11,
      color: darkBlueHex,
      alignment: { horizontal: "right" },
    });

    // ========== ROW 3: Address Line 2 ==========
    // Merge B3:C3 for address
    worksheet.mergeCells("B3:C3");
    worksheet.getCell("B3").value = "SUITE 200";
    setCellStyle(worksheet.getCell("B3"), { fontSize: 11, color: darkBlueHex });

    // ========== ROW 4: City/State/Zip ==========
    // Merge B4:C4 for address
    worksheet.mergeCells("B4:C4");
    worksheet.getCell("B4").value = "STAMFORD, CT 06907";
    setCellStyle(worksheet.getCell("B4"), { fontSize: 11, color: darkBlueHex });

    // ========== ROW 5: Phone ==========
    // Merge B5:C5 for phone
    worksheet.mergeCells("B5:C5");
    worksheet.getCell("B5").value = "203-987-7050";
    setCellStyle(worksheet.getCell("B5"), {
      bold: true,
      fontSize: 11,
      color: darkBlueHex,
    });

    // ========== ROW 6-7: Empty spacer rows ==========

    // ========== ROW 8: Bill To & Property Labels ==========
    // Merge B8:C8 for BILL TO label
    worksheet.mergeCells("B8:C8");
    worksheet.getCell("B8").value = "BILL TO:";
    setCellStyle(worksheet.getCell("B8"), {
      bold: true,
      fontSize: 11,
      color: darkBlueHex,
    });

    // D8: PROPERTY:
    worksheet.getCell("D8").value = "PROPERTY:";
    setCellStyle(worksheet.getCell("D8"), {
      bold: true,
      fontSize: 11,
      color: darkBlueHex,
      alignment: { horizontal: "right" },
    });

    // ========== ROW 9: Bill To Name Line 1 / Property Address ==========
    const ownerName = rentalOwner || billTo;
    // Split name if it contains "&" or comma for two-line display
    const ownerLines = ownerName.includes("&") 
      ? ownerName.split("&").map(s => s.trim())
      : ownerName.includes(",")
        ? ownerName.split(",").map(s => s.trim())
        : [ownerName];
    
    // Merge B9:C9 for name
    worksheet.mergeCells("B9:C9");
    worksheet.getCell("B9").value = ownerLines[0] + (ownerLines.length > 1 ? " &" : "");
    setCellStyle(worksheet.getCell("B9"), { fontSize: 11, color: darkBlueHex });

    // D9: Property Address
    worksheet.getCell("D9").value = propertyAddress;
    setCellStyle(worksheet.getCell("D9"), {
      fontSize: 11,
      color: darkBlueHex,
      alignment: { horizontal: "right" },
    });

    // ========== ROW 10: Bill To Name Line 2 / Property Location ==========
    // Merge B10:C10 for name continuation
    worksheet.mergeCells("B10:C10");
    if (ownerLines.length > 1) {
      worksheet.getCell("B10").value = ownerLines[1];
      setCellStyle(worksheet.getCell("B10"), { fontSize: 11, color: darkBlueHex });
    }

    // D10: Property Location (City, State Zip)
    if (propertyLocation) {
      worksheet.getCell("D10").value = propertyLocation;
      setCellStyle(worksheet.getCell("D10"), {
        fontSize: 11,
        color: darkBlueHex,
        alignment: { horizontal: "right" },
      });
    }

    // ========== ROW 11: Empty spacer ==========

    // ========== ROW 12: Table Headers ==========
    // B12: Vendor
    worksheet.getCell("B12").value = "Vendor";
    setCellStyle(worksheet.getCell("B12"), {
      bold: true,
      fontSize: 11,
      color: darkBlueHex,
    });
    worksheet.getCell("B12").border = {
      bottom: { style: "medium", color: { argb: goldHex } },
    };

    // C12: Description
    worksheet.getCell("C12").value = "Description";
    setCellStyle(worksheet.getCell("C12"), {
      bold: true,
      fontSize: 11,
      color: darkBlueHex,
    });
    worksheet.getCell("C12").border = {
      bottom: { style: "medium", color: { argb: goldHex } },
    };

    // D12: AMOUNT
    worksheet.getCell("D12").value = "AMOUNT";
    setCellStyle(worksheet.getCell("D12"), {
      bold: true,
      fontSize: 11,
      color: darkBlueHex,
      alignment: { horizontal: "right" },
    });
    worksheet.getCell("D12").border = {
      bottom: { style: "medium", color: { argb: goldHex } },
    };

    // ========== ROWS 13+: Line Items ==========
    let currentRow = 13;
    lineItems.forEach((item) => {
      // Set row height for line items
      worksheet.getRow(currentRow).height = 18;
      
      // Parse amount as number (remove $ and commas)
      const amount = parseFloat(item.amount.replace(/[^\d.]/g, "")) || 0;

      // Column B: Vendor
      worksheet.getCell(`B${currentRow}`).value = item.vendor;
      setCellStyle(worksheet.getCell(`B${currentRow}`), {
        fontSize: 11,
        color: darkBlueHex,
      });
      worksheet.getCell(`B${currentRow}`).border = {
        bottom: { style: "thin", color: { argb: goldHex } },
      };

      // Column C: Description
      worksheet.getCell(`C${currentRow}`).value = item.description;
      setCellStyle(worksheet.getCell(`C${currentRow}`), {
        fontSize: 11,
        color: darkBlueHex,
      });
      worksheet.getCell(`C${currentRow}`).border = {
        bottom: { style: "thin", color: { argb: goldHex } },
      };

      // Column D: Amount (as number with currency format)
      worksheet.getCell(`D${currentRow}`).value = amount;
      setCellStyle(worksheet.getCell(`D${currentRow}`), {
        fontSize: 11,
        color: darkBlueHex,
        alignment: { horizontal: "right" },
        fill: lightGreyHex,
        numFmt: '"$"#,##0.00',
      });
      worksheet.getCell(`D${currentRow}`).border = {
        bottom: { style: "thin", color: { argb: goldHex } },
      };

      currentRow++;
    });

    // ========== SEPARATOR ROW: Gold line after last line item ==========
    const separatorRow = currentRow;
    worksheet.getRow(separatorRow).height = 8; // Short separator row
    // Add a thick gold border spanning B to D (like in the template)
    worksheet.getCell(`B${separatorRow}`).border = {
      top: { style: "medium", color: { argb: goldHex } },
    };
    worksheet.getCell(`C${separatorRow}`).border = {
      top: { style: "medium", color: { argb: goldHex } },
    };
    worksheet.getCell(`D${separatorRow}`).border = {
      top: { style: "medium", color: { argb: goldHex } },
    };

    // ========== Empty row before total ==========
    const emptyRow = separatorRow + 1;
    worksheet.getRow(emptyRow).height = 12;

    // ========== TOTAL ROW ==========
    const totalRow = emptyRow + 1;
    worksheet.getRow(totalRow).height = 22;

    // C[totalRow]: TOTAL:
    worksheet.getCell(`C${totalRow}`).value = "TOTAL:";
    setCellStyle(worksheet.getCell(`C${totalRow}`), {
      bold: true,
      fontSize: 11,
      color: darkBlueHex,
      alignment: { horizontal: "right" },
    });

    // D[totalRow]: Total Amount (as number with gold border box)
    const total = calculateTotal();
    worksheet.getCell(`D${totalRow}`).value = total;
    setCellStyle(worksheet.getCell(`D${totalRow}`), {
      bold: true,
      fontSize: 11,
      color: darkBlueHex,
      alignment: { horizontal: "right" },
      fill: lightGreyHex,
      numFmt: '"$"#,##0.00',
    });
    worksheet.getCell(`D${totalRow}`).border = {
      top: { style: "medium", color: { argb: goldHex } },
      bottom: { style: "medium", color: { argb: goldHex } },
      left: { style: "medium", color: { argb: goldHex } },
      right: { style: "medium", color: { argb: goldHex } },
    };

    // ========== FOOTER ROWS ==========
    const footerStartRow = totalRow + 1;

    // Footer row 1: Please make all checks payable...
    worksheet.getRow(footerStartRow).height = 18;
    worksheet.mergeCells(`B${footerStartRow}:D${footerStartRow}`);
    worksheet.getCell(`B${footerStartRow}`).value = "Please make all checks payable to AVMRE LLC";
    setCellStyle(worksheet.getCell(`B${footerStartRow}`), {
      bold: true,
      fontSize: 10,
      color: darkBlueHex,
    });

    // Footer row 2: If you have any questions...
    worksheet.getRow(footerStartRow + 1).height = 18;
    worksheet.mergeCells(`B${footerStartRow + 1}:D${footerStartRow + 1}`);
    worksheet.getCell(`B${footerStartRow + 1}`).value =
      "If you have any questions concerning this invoice, use the following contact information:";
    setCellStyle(worksheet.getCell(`B${footerStartRow + 1}`), {
      fontSize: 10,
      color: darkBlueHex,
    });

    // Footer row 3: Phone
    worksheet.getRow(footerStartRow + 2).height = 18;
    worksheet.mergeCells(`B${footerStartRow + 2}:D${footerStartRow + 2}`);
    worksheet.getCell(`B${footerStartRow + 2}`).value = "203-987-7050";
    setCellStyle(worksheet.getCell(`B${footerStartRow + 2}`), {
      fontSize: 10,
      color: darkBlueHex,
    });

    // Footer row 4: Email (with hyperlink style)
    worksheet.getRow(footerStartRow + 3).height = 18;
    worksheet.mergeCells(`B${footerStartRow + 3}:D${footerStartRow + 3}`);
    worksheet.getCell(`B${footerStartRow + 3}`).value = {
      text: "STAFF@AVMRE.COM",
      hyperlink: "mailto:STAFF@AVMRE.COM",
    };
    setCellStyle(worksheet.getCell(`B${footerStartRow + 3}`), {
      fontSize: 10,
      color: emailBlueHex,
      underline: true,
    });

    // Footer row 5: Thank you
    worksheet.getRow(footerStartRow + 4).height = 18;
    worksheet.mergeCells(`B${footerStartRow + 4}:D${footerStartRow + 4}`);
    worksheet.getCell(`B${footerStartRow + 4}`).value = "THANK YOU FOR YOUR BUSINESS!";
    setCellStyle(worksheet.getCell(`B${footerStartRow + 4}`), {
      bold: true,
      fontSize: 10,
      color: darkBlueHex,
    });

    // ========== PAGE SETUP ==========
    // Set print area and page margins to match template
    worksheet.pageSetup = {
      paperSize: 9, // A4
      orientation: "portrait",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: {
        left: 0.5,
        right: 0.5,
        top: 0.5,
        bottom: 0.5,
        header: 0.3,
        footer: 0.3,
      },
    };

    // Generate filename
    const fileName = `invoice_${invoiceDate.replace(/\s+/g, "_")}.xlsx`;

    // Write file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const generatePdfBlob = async (): Promise<Blob> => {
    const invoiceNode = invoiceRef.current;
    if (!invoiceNode) {
      throw new Error("Invoice DOM not ready");
    }
  
    const clone = invoiceNode.cloneNode(true) as HTMLElement;
  
    clone.querySelectorAll<HTMLInputElement>("input.edit-field").forEach((input) => {
      const span = document.createElement("span");
      const field = input.dataset.field;
      span.textContent =
        field === "amount"
          ? formatAmountWithCommas(input.value)
          : input.value;
  
      input.replaceWith(span);
    });
  
    clone.querySelectorAll(".no-print").forEach((el) => el.remove());
  
    const container = document.createElement("div");
    container.style.width = "816px";
    container.style.background = "white";
    container.appendChild(clone);
  
    return await html2pdf()
      .set({
        margin: 0,
        html2canvas: { scale: 2 },
        jsPDF: { unit: "px", format: [816, 1056] },
      })
      .from(container)
      .outputPdf("blob");
  };
  

  const handleCommit = async () => {
    if (pendingUnapprovedCount > 0) {
      setShowCommitConfirm(true);
      return;
    }
  
    try {
      const pdfBlob = await generatePdfBlob();
      onCommit?.(pdfBlob);
      onOpenChange(false);
    } catch (err) {
      console.error("Failed to generate PDF:", err);
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
                fontFamily:
                  "Inter, -apple-system, Roboto, Helvetica, sans-serif",
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
                  <div
                    style={{
                      width: "150px",
                      font: "400 10px/15.4px Arial, sans-serif",
                    }}
                  >
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
                      {propertyLocation}
                    </div>
                  </div>
                </div>
              </div>

              {/* Table */}
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  marginBottom: "20px",
                }}
              >
                <thead>
                  <tr>
                    <th
                      style={{
                        textAlign: "left",
                        paddingBottom: "8px",
                        borderBottom: "1px solid #BF8F00",
                        font: "700 9px/16.5px Arial, sans-serif",
                      }}
                    >
                      Vendors
                    </th>
                    <th
                      style={{
                        textAlign: "left",
                        paddingBottom: "8px",
                        borderBottom: "1px solid #BF8F00",
                        font: "700 9px/16.5px Arial, sans-serif",
                      }}
                    >
                      Description
                    </th>
                    <th
                      style={{
                        fontSize: "9px",
                        fontWeight: 700,
                        textAlign: "left",
                        paddingBottom: "8px",
                        borderBottom: "1px solid #BF8F00",
                        width: "120px",
                      }}
                    >
                      AMOUNT
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((item, index) => (
                    <tr
                      key={item.id}
                      draggable={false}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, index)}
                      style={{
                        opacity: draggedIndex === index ? 0.5 : 1,
                        backgroundColor: dragOverIndex === index ? "rgba(0, 45, 90, 0.06)" : undefined,
                        transition: "background-color 0.15s ease",
                      }}
                    >
                      <td
                        style={{
                          fontSize: "11px",
                          paddingTop: "2px",
                          paddingBottom: "2px",
                          borderBottom: "1px solid #BF8F00",
                          verticalAlign: "middle",
                          position: "relative",
                        }}
                      >
                        <div
                          className="no-print"
                          draggable
                          onDragStart={(e) => handleDragStart(e, index)}
                          onDragEnd={handleDragEnd}
                          role="button"
                          tabIndex={0}
                          title="Drag to reorder row"
                          style={{
                            position: "absolute",
                            left: "-28px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            width: "28px",
                            height: "28px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: draggedIndex === index ? "grabbing" : "grab",
                            color: "#002060",
                            borderRadius: "6px",
                            border: "none",
                            background: "none",
                            zIndex: 2,
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "rgba(0, 45, 90, 0.08)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "";
                          }}
                          onKeyDown={(e) => {
                            if (e.key === " " || e.key === "Enter") {
                              e.preventDefault();
                              (e.currentTarget as HTMLDivElement).focus();
                            }
                          }}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                            <circle cx="9" cy="6" r="1.5" />
                            <circle cx="15" cy="6" r="1.5" />
                            <circle cx="9" cy="12" r="1.5" />
                            <circle cx="15" cy="12" r="1.5" />
                            <circle cx="9" cy="18" r="1.5" />
                            <circle cx="15" cy="18" r="1.5" />
                          </svg>
                        </div>
                        <input
                          type="text"
                          value={item.vendor}
                          data-field="vendor"
                          onChange={(e) =>
                            handleUpdateLineItem(
                              item.id,
                              "vendor",
                              e.target.value,
                            )
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
                            padding: 0,
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
                      <td
                        style={{
                          fontSize: "11px",
                          paddingTop: "2px",
                          paddingBottom: "2px",
                          borderBottom: "1px solid #BF8F00",
                          verticalAlign: "middle",
                        }}
                      >
                        <input
                          type="text"
                          value={item.description}
                          data-field="description"
                          onChange={(e) =>
                            handleUpdateLineItem(
                              item.id,
                              "description",
                              e.target.value,
                            )
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
                            padding: 0,
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
                      <td
                        style={{
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
                          overflow: "visible",
                        }}
                      >
                        <input
                          type="text"
                          value={
                            activeAmountId === item.id
                              ? `$${amountDraftById[item.id] ?? normalizeAmountDraft(item.amount)}`
                              : formatAmountWithCommas(item.amount)
                          }
                          data-field="amount"
                          onChange={(e) => {
                            const nextDraft = normalizeAmountDraft(
                              e.target.value,
                            );
                            setAmountDraftById((prev) => ({
                              ...prev,
                              [item.id]: nextDraft,
                            }));
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
                            setActiveAmountId((current) =>
                              current === item.id ? null : current,
                            );
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
                            padding: "0",
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
                            lineHeight: "1",
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
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  alignItems: "center",
                  marginBottom: "20px",
                }}
              >
                <div
                  style={{
                    marginRight: "20px",
                    font: "700 9px/16.5px Arial, sans-serif",
                  }}
                >
                  TOTAL:
                </div>
                <div
                  style={{
                    font: "400 9px/16.5px Arial, sans-serif",
                    backgroundColor: "#F2F2F2",
                    padding: "8px 12px",
                    textAlign: "left",
                    minWidth: "120px",
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    textOverflow: "clip",
                  }}
                >
                  <b>{formatCurrency(calculateTotal())}</b>
                </div>
              </div>

              {/* Footer */}
              <div
                style={{
                  fontSize: "7px",
                  lineHeight: "16px",
                  marginTop: "-3px",
                }}
              >
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
                  If you have any questions concerning this invoice, use the
                  following contact information:
                </div>
                <div
                  style={{ fontFamily: "Arial, sans-serif", marginTop: "-4px" }}
                >
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
                <div
                  style={{
                    fontWeight: 700,
                    fontFamily: "Arial, sans-serif",
                    marginTop: "-4px",
                  }}
                >
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
              <span className="text-white font-medium text-base">
                Download PDF
              </span>
            </button>

            <button
              type="button"
              onClick={handleExportToExcel}
              className="flex h-9 items-center gap-2 px-4 rounded-lg border border-white bg-[#002D5A] shadow-[0_0_0_1px_#002D5A,0_0_10px_-5px_rgba(0,0,0,0.2)] hover:bg-[#003d7a] transition-colors"
            >
              <span className="text-white font-medium text-base">
                Export to Excel
              </span>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showCommitConfirm} onOpenChange={setShowCommitConfirm}>
        <AlertDialogContentRoot>
          <AlertDialogHeader>
            <AlertDialogTitle>Commit invoice?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to commit? There are unapproved bills
              outstanding.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowCommitConfirm(false);
                generatePdfBlob()
                .then((blob) => onCommit?.(blob))
                .finally(() => onOpenChange(false));
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
