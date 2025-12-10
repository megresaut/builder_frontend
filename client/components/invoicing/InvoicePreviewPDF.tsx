import React from "react";
import "./InvoicePreviewPDF.css";

type InvoiceRow = {
  vendor: string;
  description: string;
  amount: string;
  isNew?: boolean; // ⬅ NEW FLAG
};

type InvoicePreviewPDFProps = {
  invoice: {
    clientName: string;
    propertyName: string;
    propertyAddress: string;
    invoiceDate: string | Date;
  };
  items: InvoiceRow[];
  onChange: (index: number, field: string, value: string) => void;
  onAddItem: () => void;
  onDeleteItem: (index: number) => void; // ⬅ NEW DELETE HANDLER
};

export const InvoicePreviewPDF: React.FC<InvoicePreviewPDFProps> = ({
  invoice,
  items,
  onChange,
  onAddItem,
  onDeleteItem
}) => {
  /* ------------------------- FORMAT DATE ------------------------- */
  const formattedDate =
    typeof invoice.invoiceDate === "string"
      ? invoice.invoiceDate
      : invoice.invoiceDate.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric"
        });

  /* ------------------------- FIXED STYLE OBJECTS ------------------------- */
  const th: React.CSSProperties = {
    borderBottom: "1px solid #ccc",
    padding: "8px",
    textAlign: "left",
    fontWeight: 600,
    fontSize: "14px"
  };

  const td: React.CSSProperties = {
    borderBottom: "1px solid #ddd",
    padding: "8px",
    fontSize: "14px",
    verticalAlign: "middle"
  };

  const input: React.CSSProperties = {
    width: "100%",
    border: "none",
    outline: "none",
    fontSize: "14px",
    background: "transparent"
  };

  const deleteBtn: React.CSSProperties = {
    cursor: "pointer",
    fontWeight: "bold",
    color: "#982740",
    fontSize: "16px",
    paddingLeft: "10px"
  };

  /* ------------------------- COMPUTE TOTAL ------------------------- */
  const total = items.reduce((sum, row) => {
    const cleaned = Number(row.amount?.toString().replace("$", ""));
    return sum + (isNaN(cleaned) ? 0 : cleaned);
  }, 0);

  return (
    <div id="invoice-pdf-root" className="invoice-wrapper">
      {/* HEADER */}
      <div className="invoice-header">
        <div className="invoice-company">
          <h2>AVMRE LLC</h2>
          <p>11 LARGO DRIVE SOUTH</p>
          <p>SUITE 200</p>
          <p>STAMFORD, CT 06907</p>
          <p className="blue-text">203-987-7050</p>
        </div>

        <div className="invoice-meta">
          <h1>INVOICE</h1>
          <p>
            <strong>DATE:</strong> {formattedDate}
          </p>
        </div>
      </div>

      {/* BILL TO + PROPERTY */}
      <div className="invoice-top-section">
        <div className="bill-to">
          <strong>BILL TO:</strong>
          <p>{invoice.clientName}</p>
        </div>

        <div className="property-info">
          <strong>PROPERTY:</strong>
          <p>{invoice.propertyName}</p>
          <p>{invoice.propertyAddress}</p>
        </div>
      </div>

      {/* TABLE */}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginTop: "20px"
        }}
      >
        <thead>
          <tr>
            <th style={th}>Vendors</th>
            <th style={th}>Description</th>
            <th style={{ ...th, textAlign: "right" }}>Amount</th>
            <th style={{ ...th, width: "40px" }}></th> {/* delete column */}
          </tr>
        </thead>

        <tbody>
          {items.map((row, i) => (
            <tr key={i}>
              {/* Vendor */}
              <td style={td}>
                <input
                  style={input}
                  defaultValue={row.vendor}
                  onBlur={(e) => onChange(i, "vendor", e.target.value)}
                />
              </td>

              {/* Description */}
              <td style={td}>
                <input
                  style={input}
                  defaultValue={row.description}
                  onBlur={(e) => onChange(i, "description", e.target.value)}
                />
              </td>

              {/* Amount */}
              <td style={{ ...td, textAlign: "right" }}>
                <input
                  style={{ ...input, textAlign: "right" }}
                  defaultValue={row.amount}
                  onBlur={(e) => onChange(i, "amount", e.target.value)}
                />
              </td>

              {/* DELETE ICON — ONLY FOR NEW ITEMS */}
              <td style={td}>
                {row.isNew && (
                  <span style={deleteBtn} onClick={() => onDeleteItem(i)}>
                    ✕
                  </span>
                )}
              </td>
            </tr>
          ))}

          {/* ADD LINE ITEM */}
          <tr>
            <td colSpan={4} style={{ paddingTop: "10px" }}>
              <button
                onClick={onAddItem}
                style={{
                  padding: "6px 12px",
                  background: "#013764",
                  color: "white",
                  borderRadius: "6px",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "13px"
                }}
              >
                + Add Line Item
              </button>
            </td>
          </tr>

          {/* TOTAL */}
          <tr>
            <td></td>
            <td
              style={{
                ...td,
                textAlign: "right",
                fontWeight: "bold",
                borderBottom: "2px solid black"
              }}
            >
              TOTAL:
            </td>
            <td
              style={{
                ...td,
                textAlign: "right",
                fontWeight: "bold",
                borderBottom: "2px solid black"
              }}
            >
              ${total.toFixed(2)}
            </td>
            <td></td>
          </tr>
        </tbody>
      </table>

      {/* FOOTER */}
      <div className="invoice-footer">
        <p>
          <strong>Please make all checks payable to AVMRE LLC</strong>
        </p>
        <p>
          If you have any questions concerning this invoice, use the following
          contact information:
        </p>
        <p>203-987-7050</p>
        <p className="blue-text">STAFF@AVMRE.COM</p>
        <p>
          <strong>THANK YOU FOR YOUR BUSINESS!</strong>
        </p>
      </div>
    </div>
  );
};
