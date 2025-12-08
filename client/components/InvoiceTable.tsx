import React, { useState } from "react";
import { VendorAvatar } from "./VendorAvatar";
import { StatusBadge } from "./StatusBadge";

interface InvoiceLineItem {
  id: number;
  vendor: string;
  glAccount: string;
  description: string;
  amount: string;
  source: "Auto-Import" | "Vendor" | "Manual";
  status: "Paid" | "Pending" | "Approved" | "Overdue" | "Draft";
}

const invoiceItems: InvoiceLineItem[] = [
  {
    id: 1,
    vendor: "Elite HVAC",
    glAccount: "ConEd - 1,220 kWh",
    description: "ConEd - 1,220 kWh",
    amount: "$420",
    source: "Auto-Import",
    status: "Paid",
  },
  {
    id: 2,
    vendor: "ABC Plumbing",
    glAccount: "Unit 48 Thermostat",
    description: "Unit 48 Thermostat",
    amount: "$380",
    source: "Vendor",
    status: "Pending",
  },
  {
    id: 3,
    vendor: "Elite HVAC",
    glAccount: "Tools for common area",
    description: "Tools for common area",
    amount: "$120",
    source: "Manual",
    status: "Approved",
  },
];

export const InvoiceTable: React.FC = () => {
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        borderRadius: "12px",
        border: "1px solid rgb(230, 230, 230)",
        boxShadow: "rgba(10, 13, 18, 0.05) 0px 1px 2px 0px",
        overflow: "hidden",
        width: "100%",
      }}
    >
      {/* Table Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px",
          backgroundColor: "rgb(255, 255, 255)",
          borderBottom: "1px solid rgb(230, 230, 230)",
          gap: "16px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <h3
            style={{
              fontSize: "22px",
              fontWeight: "500",
              color: "rgb(48, 48, 48)",
              margin: "0",
            }}
          >
            This Month's Invoice
          </h3>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 12px",
              borderRadius: "8px",
              border: "1px solid rgb(218, 218, 218)",
              backgroundColor: "rgb(251, 251, 251)",
              boxShadow: "rgba(0, 0, 0, 0.03) 0px 1px 3px 0px",
              height: "36px",
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              style={{
                width: "20px",
                height: "20px",
                color: "rgb(48, 48, 48)",
              }}
            >
              <path d="m21 21-4.34-4.34" />
              <circle cx="11" cy="11" r="8" />
            </svg>
            <input
              type="text"
              placeholder="Search..."
              style={{
                border: "none",
                outline: "none",
                backgroundColor: "transparent",
                fontSize: "16px",
                color: "rgb(48, 48, 48)",
              }}
            />
          </div>
          <button
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 12px",
              borderRadius: "8px",
              border: "1px solid rgb(218, 218, 218)",
              backgroundColor: "rgb(251, 251, 251)",
              boxShadow: "rgba(0, 0, 0, 0.03) 0px 1px 3px 0px",
              height: "36px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "400",
              color: "rgb(48, 48, 48)",
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.25"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              style={{
                width: "20px",
                height: "20px",
              }}
            >
              <path d="M5 12h14" />
              <path d="M12 5v14" />
            </svg>
            Draft
          </button>
          <button
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 12px",
              borderRadius: "8px",
              border: "1px solid rgb(218, 218, 218)",
              backgroundColor: "rgb(251, 251, 251)",
              boxShadow: "rgba(0, 0, 0, 0.03) 0px 1px 3px 0px",
              height: "36px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "400",
              color: "rgb(48, 48, 48)",
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.25"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              style={{
                width: "20px",
                height: "20px",
              }}
            >
              <path d="M5 12h14" />
              <path d="M12 5v14" />
            </svg>
            Add Line Item
          </button>
        </div>
      </div>

      {/* Table Body */}
      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            minWidth: "800px",
          }}
        >
          <thead>
            <tr
              style={{
                backgroundColor: "rgb(251, 251, 251)",
                borderBottom: "1px solid rgb(218, 218, 218)",
                height: "56px",
              }}
            >
              <th
                style={{
                  textAlign: "left",
                  padding: "12px",
                  borderRight: "1px solid rgb(218, 218, 218)",
                  fontWeight: "500",
                  fontSize: "14px",
                  color: "rgb(82, 82, 82)",
                  textTransform: "capitalize",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    style={{
                      width: "16px",
                      height: "16px",
                      color: "rgb(82, 82, 82)",
                    }}
                  >
                    <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
                    <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
                    <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
                    <path d="M10 6h4" />
                    <path d="M10 10h4" />
                    <path d="M10 14h4" />
                    <path d="M10 18h4" />
                  </svg>
                  Vendor
                </div>
              </th>
              <th
                style={{
                  textAlign: "left",
                  padding: "12px",
                  borderRight: "1px solid rgb(218, 218, 218)",
                  fontWeight: "500",
                  fontSize: "14px",
                  color: "rgb(82, 82, 82)",
                  textTransform: "capitalize",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    style={{
                      width: "16px",
                      height: "16px",
                      color: "rgb(82, 82, 82)",
                    }}
                  >
                    <path d="M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v4" />
                    <path d="M14 2v4a2 2 0 0 0 2 2h4" />
                    <path d="m3 15 2 2 4-4" />
                  </svg>
                  GL Account
                </div>
              </th>
              <th
                style={{
                  textAlign: "left",
                  padding: "12px",
                  borderRight: "1px solid rgb(218, 218, 218)",
                  fontWeight: "500",
                  fontSize: "14px",
                  color: "rgb(82, 82, 82)",
                  textTransform: "capitalize",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    style={{
                      width: "16px",
                      height: "16px",
                      color: "rgb(82, 82, 82)",
                    }}
                  >
                    <path d="M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v4" />
                    <path d="M14 2v4a2 2 0 0 0 2 2h4" />
                    <path d="m3 15 2 2 4-4" />
                  </svg>
                  Description
                </div>
              </th>
              <th
                style={{
                  textAlign: "left",
                  padding: "12px",
                  borderRight: "1px solid rgb(218, 218, 218)",
                  fontWeight: "500",
                  fontSize: "14px",
                  color: "rgb(82, 82, 82)",
                  textTransform: "capitalize",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    style={{
                      width: "16px",
                      height: "16px",
                      color: "rgb(82, 82, 82)",
                    }}
                  >
                    <line x1="12" x2="12" y1="2" y2="22" />
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                  Amount
                </div>
              </th>
              <th
                style={{
                  textAlign: "left",
                  padding: "12px",
                  borderRight: "1px solid rgb(218, 218, 218)",
                  fontWeight: "500",
                  fontSize: "14px",
                  color: "rgb(82, 82, 82)",
                  textTransform: "capitalize",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    style={{
                      width: "16px",
                      height: "16px",
                      color: "rgb(82, 82, 82)",
                    }}
                  >
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                  </svg>
                  Source
                </div>
              </th>
              <th
                style={{
                  textAlign: "left",
                  padding: "12px",
                  fontWeight: "500",
                  fontSize: "14px",
                  color: "rgb(82, 82, 82)",
                  textTransform: "capitalize",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    style={{
                      width: "16px",
                      height: "16px",
                      color: "rgb(82, 82, 82)",
                    }}
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 16v-4" />
                    <path d="M12 8h.01" />
                  </svg>
                  Status
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {invoiceItems.map((item, index) => (
              <tr
                key={item.id}
                style={{
                  borderBottom:
                    index === invoiceItems.length - 1
                      ? "none"
                      : "1px solid rgb(218, 218, 218)",
                  height: "56px",
                }}
              >
                <td
                  style={{
                    padding: "12px",
                    borderRight: "1px solid rgb(218, 218, 218)",
                  }}
                >
                  <VendorAvatar name={item.vendor} />
                </td>
                <td
                  style={{
                    padding: "12px",
                    borderRight: "1px solid rgb(218, 218, 218)",
                    fontSize: "14px",
                    color: "rgb(10, 10, 10)",
                  }}
                >
                  {item.glAccount}
                </td>
                <td
                  style={{
                    padding: "12px",
                    borderRight: "1px solid rgb(218, 218, 218)",
                    fontSize: "14px",
                    color: "rgb(10, 10, 10)",
                  }}
                >
                  {item.description}
                </td>
                <td
                  style={{
                    padding: "12px",
                    borderRight: "1px solid rgb(218, 218, 218)",
                    fontSize: "14px",
                    color: "rgb(10, 10, 10)",
                  }}
                >
                  {item.amount}
                </td>
                <td
                  style={{
                    padding: "12px",
                    borderRight: "1px solid rgb(218, 218, 218)",
                    fontSize: "14px",
                    color: "rgb(10, 10, 10)",
                  }}
                >
                  {item.source}
                </td>
                <td
                  style={{
                    padding: "12px",
                  }}
                >
                  <StatusBadge status={item.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer with Subtotal */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px",
          backgroundColor: "rgb(255, 255, 255)",
          borderTop: "1px solid rgb(230, 230, 230)",
          borderBottomLeftRadius: "11px",
          borderBottomRightRadius: "11px",
          gap: "16px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <div
            style={{
              fontSize: "22px",
              fontWeight: "500",
              color: "rgb(48, 48, 48)",
            }}
          >
            Subtotal: $920
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          <button
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 12px",
              borderRadius: "8px",
              border: "1px solid rgb(218, 218, 218)",
              backgroundColor: "rgb(251, 251, 251)",
              boxShadow: "rgba(0, 0, 0, 0.03) 0px 1px 3px 0px",
              height: "36px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "400",
              color: "rgb(48, 48, 48)",
            }}
          >
            Save Draft
          </button>
          <button
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 12px",
              borderRadius: "8px",
              border: "1px solid rgb(255, 255, 255)",
              backgroundColor: "rgb(1, 55, 100)",
              boxShadow:
                "rgb(0, 45, 90) 0px 0px 0px 1px, rgba(0, 0, 0, 0.2) 0px 0px 10px -5px",
              height: "36px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "500",
              color: "rgb(255, 255, 255)",
            }}
          >
            Preview PDF
          </button>
        </div>
      </div>
    </div>
  );
};
