import React, { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { InvoicePreviewPDF } from "./InvoicePreviewPDF";
import { exportInvoicePDF } from "./exportInvoicePDF";

export const InvoicePreviewModal = ({ invoice, items, onClose }) => {
  const [localItems, setLocalItems] = useState(
    items.map(i => ({ ...i, isNew: false }))
  );

  const printRef = useRef<HTMLDivElement>(null);

  /* ---------------- HANDLE VALUE CHANGES ---------------- */
  const handleChange = (index, field, value) => {
    const copy = [...localItems];

    if (field === "amount") {
      const cleaned = value.replace("$", "").trim();
      copy[index].amount = cleaned;
    } else {
      copy[index][field] = value;
    }

    setLocalItems(copy);
  };

  /* ---------------- ADD LINE ITEM ---------------- */
  const handleAddLineItem = () => {
    setLocalItems([
      ...localItems,
      { vendor: "", description: "", amount: "", isNew: true }
    ]);
  };

  /* ---------------- DELETE LINE ITEM ---------------- */
  const handleDeleteItem = (index) => {
    setLocalItems(localItems.filter((_, i) => i !== index));
  };

  return createPortal(
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 99999,
        padding: "20px"
      }}
    >
      <div
        style={{
          width: "90%",
          height: "90%",
          background: "white",
          borderRadius: "10px",
          overflowY: "auto",
          position: "relative",
          padding: "40px"
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "20px",
            right: "20px",
            fontSize: "22px",
            background: "transparent",
            cursor: "pointer"
          }}
        >
          ✕
        </button>

        {/* PDF CONTENT */}
        <div
          ref={printRef}
          style={{
            width: "100%",
            maxWidth: "800px",
            margin: "0 auto"
          }}
        >
          <InvoicePreviewPDF
            invoice={invoice}
            items={localItems}
            onChange={handleChange}
            onAddItem={handleAddLineItem}
            onDeleteItem={handleDeleteItem}  // <-- IMPORTANT
          />
        </div>

        {/* Buttons */}
        <div style={{ marginTop: "20px", textAlign: "right" }}>

          <button
            onClick={handleAddLineItem}
            style={{
              marginRight: "20px",
              padding: "10px 16px",
              borderRadius: "8px",
              border: "1px solid #013764",
              background: "white",
              color: "#013764",
              fontSize: "14px",
              cursor: "pointer"
            }}
          >
            + Add Line Item
          </button>

          <button
            onClick={() => exportInvoicePDF(printRef.current)}
            style={{
              padding: "10px 18px",
              borderRadius: "8px",
              background: "#013764",
              color: "white",
              fontSize: "14px",
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(0,0,0,0.12)"
            }}
          >
            Download PDF
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
