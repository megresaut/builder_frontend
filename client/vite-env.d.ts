/// <reference types="vite/client" />

// html2pdf.js's bundled type.d.ts omits the pagebreak option its pagebreak
// plugin supports — augment it here (interface declarations merge).
declare module "html2pdf.js" {
  interface Html2PdfOptions {
    pagebreak?: {
      mode?: string | string[];
      before?: string | string[];
      after?: string | string[];
      avoid?: string | string[];
    };
  }
}
