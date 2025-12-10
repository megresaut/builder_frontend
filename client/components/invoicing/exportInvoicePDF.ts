// @ts-ignore – html2pdf has broken/incorrect type declarations
import html2pdf from "html2pdf.js";

export const exportInvoicePDF = (element: HTMLElement | null) => {
  if (!element) return;

  // Use literal image types so TypeScript stops complaining
  const opt: any = {
    margin: 0.5,
    filename: "invoice.pdf",
    image: { type: "jpeg" as "jpeg", quality: 1 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      logging: false,
      scrollY: -window.scrollY,
    },
    jsPDF: {
      unit: "in",
      format: "letter",
      orientation: "portrait",
    },
  };

  html2pdf()
    .from(element as HTMLElement)
    .set(opt)
    .save();
};
