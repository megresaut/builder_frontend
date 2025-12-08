import React, { useState } from "react";
import { StatusBadge } from "./Utilities";

interface InvoiceHistory {
  id: number;
  date: string;
  dueDate: string;
  amount: string;
  status: "Paid" | "Pending" | "Overdue" | "Draft";
}

const invoiceHistory: InvoiceHistory[] = [
  {
    id: 1,
    date: "Oct 1, 2025",
    dueDate: "Dec 17, 2025",
    amount: "$237",
    status: "Paid",
  },
  {
    id: 2,
    date: "Oct 1, 2025",
    dueDate: "Dec 10, 2025",
    amount: "$639",
    status: "Pending",
  },
  {
    id: 3,
    date: "Sep 28, 2025",
    dueDate: "Dec 3, 2025",
    amount: "$482",
    status: "Overdue",
  },
  {
    id: 4,
    date: "Sep 21, 2025",
    dueDate: "Nov 26, 2025",
    amount: "$183",
    status: "Pending",
  },
  {
    id: 5,
    date: "Sep 14, 2025",
    dueDate: "Nov 19, 2025",
    amount: "$711",
    status: "Overdue",
  },
  {
    id: 6,
    date: "Sep 7, 2025",
    dueDate: "Nov 12, 2025",
    amount: "$335",
    status: "Overdue",
  },
  {
    id: 7,
    date: "Aug 31, 2025",
    dueDate: "Nov 5, 2025",
    amount: "$558",
    status: "Paid",
  },
  {
    id: 8,
    date: "Aug 24, 2025",
    dueDate: "Oct 29, 2025",
    amount: "$294",
    status: "Paid",
  },
  {
    id: 9,
    date: "Aug 17, 2025",
    dueDate: "Oct 22, 2025",
    amount: "$672",
    status: "Pending",
  },
  {
    id: 10,
    date: "Aug 10, 2025",
    dueDate: "Oct 15, 2025",
    amount: "$416",
    status: "Pending",
  },
];

export const InvoiceHistoryTable: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(invoiceHistory.length / itemsPerPage);

  const getPaginationNumbers = () => {
    const pages: (number | string)[] = [];

    if (totalPages <= 1) {
      return [1];
    }

    if (totalPages <= 6) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
      return pages;
    }

    const leftStart = currentPage;
    const leftEnd = Math.min(currentPage + 2, totalPages);

    const rightStart = Math.max(leftEnd + 5, totalPages - 2);
    const rightEnd = totalPages;

    for (let i = leftStart; i <= leftEnd; i++) {
      pages.push(i);
    }

    if (rightStart > leftEnd + 1) {
      pages.push("...");
    }

    for (let i = rightStart; i <= rightEnd; i++) {
      pages.push(i);
    }

    return pages;
  };

  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = invoiceHistory.slice(
    startIndex,
    startIndex + itemsPerPage
  );

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
            Invoice History
          </h3>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
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
            Filter
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
                width: "18px",
                height: "18px",
                color: "rgb(48, 48, 48)",
              }}
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
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
            Export CSV
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
            Export to Buildium
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
                    <path d="M8 2v4" />
                    <path d="M16 2v4" />
                    <rect width="18" height="18" x="3" y="4" rx="2" />
                    <path d="M3 10h18" />
                  </svg>
                  Date
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
                    <path d="M8 2v4" />
                    <path d="M16 2v4" />
                    <rect width="18" height="18" x="3" y="4" rx="2" />
                    <path d="M3 10h18" />
                  </svg>
                  Due Date
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
                  borderRight: "2px solid rgb(218, 218, 218)",
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
                    <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z" />
                    <circle cx="7.5" cy="7.5" r=".5" fill="currentColor" />
                  </svg>
                  Status
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedItems.map((item, index) => (
              <tr
                key={item.id}
                style={{
                  borderBottom:
                    index === paginatedItems.length - 1
                      ? "none"
                      : "1px solid rgb(218, 218, 218)",
                  height: "56px",
                }}
              >
                <td
                  style={{
                    padding: "12px",
                    borderRight: "1px solid rgb(218, 218, 218)",
                    fontSize: "14px",
                    color: "rgb(10, 10, 10)",
                  }}
                >
                  {item.date}
                </td>
                <td
                  style={{
                    padding: "12px",
                    borderRight: "1px solid rgb(218, 218, 218)",
                    fontSize: "14px",
                    color: "rgb(10, 10, 10)",
                  }}
                >
                  {item.dueDate}
                </td>
                <td
                  style={{
                    padding: "12px",
                    borderRight: "1px solid rgb(218, 218, 218)",
                    fontSize: "14px",
                    color: "rgb(10, 10, 10)",
                    gap: "8px",
                  }}
                >
                  {item.amount}
                </td>
                <td
                  style={{
                    padding: "12px",
                    borderRight: "2px solid rgb(218, 218, 218)",
                  }}
                >
                  <StatusBadge status={item.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px 24px",
            backgroundColor: "rgb(255, 255, 255)",
            gap: "16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                fontSize: "14px",
                fontWeight: "500",
                color: "rgb(82, 82, 82)",
              }}
            >
              Showing
            </span>
            <button
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                height: "40px",
                padding: "0 12px",
                borderRadius: "8px",
                border: "1px solid rgb(218, 218, 218)",
                backgroundColor: "rgb(251, 251, 251)",
                boxShadow: "rgba(0, 0, 0, 0.03) 0px 1px 3px 0px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "500",
                color: "rgb(10, 10, 10)",
              }}
            >
              <div>{itemsPerPage}</div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
            <span
              style={{
                fontSize: "14px",
                fontWeight: "500",
                color: "rgb(82, 82, 82)",
              }}
            >
              of {invoiceHistory.length}
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              borderRadius: "8px",
              border: "1px solid rgb(218, 218, 218)",
              backgroundColor: "rgb(255, 255, 255)",
              boxShadow: "rgba(0, 0, 0, 0.03) 0px 1px 3px 0px",
              overflow: "hidden",
            }}
          >
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                height: "40px",
                padding: "0 12px",
                borderRight: "1px solid rgb(229, 229, 229)",
                backgroundColor: "rgb(255, 255, 255)",
                cursor: currentPage === 1 ? "not-allowed" : "pointer",
                opacity: currentPage === 1 ? "0.5" : "1",
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke={currentPage === 1 ? "rgb(163, 163, 163)" : "currentColor"}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m12 19-7-7 7-7" />
                <path d="M19 12H5" />
              </svg>
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: "500",
                  color: currentPage === 1 ? "rgb(163, 163, 163)" : "rgb(48, 48, 48)",
                }}
              >
                Previous
              </div>
            </button>

            {getPaginationNumbers().map((page, idx) => {
              if (page === "...") {
                return (
                  <button
                    key={`ellipsis-${idx}`}
                    disabled
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      height: "40px",
                      minWidth: "40px",
                      borderRight: "1px solid rgb(229, 229, 229)",
                      backgroundColor: "rgba(0, 0, 0, 0)",
                      cursor: "not-allowed",
                      opacity: "0.5",
                      fontSize: "14px",
                      fontWeight: "500",
                      color: "rgb(163, 163, 163)",
                      border: "none",
                    }}
                  >
                    ...
                  </button>
                );
              }

              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page as number)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "40px",
                    minWidth: "40px",
                    borderRight: "1px solid rgb(229, 229, 229)",
                    backgroundColor:
                      currentPage === page ? "rgb(255, 255, 255)" : "rgba(0, 0, 0, 0)",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: currentPage === page ? "700" : "500",
                    color:
                      currentPage === page ? "rgb(10, 10, 10)" : "rgb(163, 163, 163)",
                    border: "none",
                  }}
                >
                  {page}
                </button>
              );
            })}

            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                height: "40px",
                padding: "0 12px",
                backgroundColor: "rgba(0, 0, 0, 0)",
                cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                opacity: currentPage === totalPages ? "0.5" : "1",
                fontSize: "14px",
                fontWeight: "500",
                color:
                  currentPage === totalPages
                    ? "rgb(163, 163, 163)"
                    : "rgb(48, 48, 48)",
                border: "none",
              }}
            >
              <div>Next</div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke={
                  currentPage === totalPages ? "rgb(163, 163, 163)" : "currentColor"
                }
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
