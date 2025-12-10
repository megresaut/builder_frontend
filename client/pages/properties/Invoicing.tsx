import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { fetchJSON } from "@/api/fetchJSON";
import { InvoiceTable } from "@/components/InvoiceTable";
import { InvoiceHistoryTable } from "@/components/InvoiceHistoryTable";
import { useParams } from "react-router-dom";
interface InvoicingProps {
  propertyAddress: string;
  propertyType: string;
  propertyUnits: number;
}

function mapBackendToUI(li: any) {
  // 1. UI Source
  const source =
    {
      utility: "Utility",
      vendor: "Vendor",
      fto_hours: "FTO (Hours)",
      fto_expense: "FTO (Expense)",
      management_fee: "Management Fee",
      other: "Other"
    }[li.source_type] || "Other";

  // 2. UI Status rules
  const status =
    li.source_type === "vendor"
      ? "Paid"
      : li.source_type === "utility"
      ? "Approved"
      : (li.source_type === "fto_hours" || li.source_type === "fto_expense")
      ? "Pending"
      : "Pending";

  // 3. Amount formatting
  const amount =
    li.amount != null ? `$${li.amount.toFixed(2)}` : "—";

  return {
    id: li.id,
    vendor: li.source || li.description,
    glAccount: "—",
    description: li.description,
    amount,
    source,
    status
  };
}


function mapHistoryToUI(inv: any) {
  const date = new Date(inv.invoice_month);
  const dateStr = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  // We don't have due_date now → placeholder for now
  const dueDateStr = "—";

  // Amount formatting
  const amountStr = inv.total_amount != null ? `$${inv.total_amount.toFixed(2)}` : "—";

  // Status: raw DB status is “finalized”
  const status = "Paid";

  return {
    id: inv.id,
    date: dateStr,
    dueDate: dueDateStr,
    amount: amountStr,
    status,
  };
}

const ActionButton = ({
  itemId,
  openMenuId,
  setOpenMenuId,
}: {
  itemId: string;
  openMenuId: string | null;
  setOpenMenuId: (id: string | null) => void;
}) => {
  const showMenu = openMenuId === itemId;
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    let animationFrameId: number;

    const updateMenuPos = () => {
      if (showMenu && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setMenuPos({
          top: rect.bottom + 8,
          left: rect.right - 145,
        });
      }

      if (showMenu) {
        animationFrameId = requestAnimationFrame(updateMenuPos);
      }
    };

    if (showMenu) {
      updateMenuPos();
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [showMenu]);

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setOpenMenuId(showMenu ? null : itemId)}
        className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="1" />
          <circle cx="19" cy="12" r="1" />
          <circle cx="5" cy="12" r="1" />
        </svg>
      </button>

      {showMenu &&
        createPortal(
          <div
            className="bg-white flex flex-col justify-center items-start gap-4 p-4"
            style={{
              width: "145px",
              border: "0.5px solid #DADADA",
              borderRadius: "8px",
              boxShadow:
                "0 38px 11px 0 rgba(0, 0, 0, 0.00), 0 24px 10px 0 rgba(0, 0, 0, 0.01), 0 14px 8px 0 rgba(0, 0, 0, 0.04), 0 6px 6px 0 rgba(0, 0, 0, 0.06), 0 2px 3px 0 rgba(0, 0, 0, 0.07)",
              zIndex: 99999,
              position: "fixed",
              top: menuPos.top + "px",
              left: menuPos.left + "px",
              pointerEvents: "auto",
            }}
            onMouseLeave={() => setOpenMenuId(null)}
          >
            <button className="flex justify-between items-center w-full hover:opacity-70 transition-opacity">
              <span
                className="text-[#303030] font-normal text-base leading-[140%] tracking-[-0.32px] capitalize"
                style={{
                  fontFamily:
                    "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                }}
              >
                Edit
              </span>
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M15.75 15.7502H9.75002M1.875 16.1252L6.03695 14.5245C6.30316 14.4221 6.43626 14.3709 6.56079 14.3041C6.6714 14.2447 6.77685 14.1761 6.87603 14.0992C6.98769 14.0125 7.08853 13.9117 7.29021 13.71L15.75 5.25023C16.5784 4.4218 16.5784 3.07865 15.75 2.25023C14.9216 1.4218 13.5784 1.4218 12.75 2.25022L4.29021 10.71C4.08853 10.9117 3.98769 11.0125 3.90104 11.1242C3.82408 11.2234 3.75555 11.3288 3.69618 11.4394C3.62933 11.564 3.57814 11.6971 3.47575 11.9633L1.875 16.1252ZM1.875 16.1252L3.41859 12.1119C3.52905 11.8248 3.58428 11.6812 3.67901 11.6154C3.76179 11.5579 3.86423 11.5362 3.96322 11.5551C4.0765 11.5767 4.18529 11.6855 4.40286 11.9031L6.09718 13.5974C6.31475 13.815 6.42354 13.9237 6.44517 14.037C6.46408 14.136 6.44234 14.2385 6.38486 14.3212C6.31908 14.416 6.17549 14.4712 5.8883 14.5817L1.875 16.1252Z"
                  stroke="#525252"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button className="flex justify-between items-center w-full hover:opacity-70 transition-opacity">
              <span
                className="text-[#303030] font-normal text-base leading-[140%] tracking-[-0.32px] capitalize"
                style={{
                  fontFamily:
                    "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                }}
              >
                Delete
              </span>
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M6.75 2.25H11.25M2.25 4.5H15.75M14.25 4.5L13.724 12.3895C13.6451 13.5732 13.6057 14.165 13.35 14.6138C13.1249 15.0088 12.7854 15.3265 12.3762 15.5248C11.9115 15.75 11.3183 15.75 10.132 15.75H7.86799C6.68168 15.75 6.08852 15.75 5.62375 15.5248C5.21457 15.3265 4.87507 15.0088 4.64999 14.6138C4.39433 14.165 4.35488 13.5732 4.27596 12.3895L3.75 4.5M7.5 7.875V11.625M10.5 7.875V11.625"
                  stroke="#982740"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>,
          document.body,
        )}
    </>
  );
};

export const Invoicing: React.FC<InvoicingProps> = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [showPageSizeDropdown, setShowPageSizeDropdown] = useState(false);
  const dropdownButtonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const [invoiceHistory, setInvoiceHistory] = useState([]);
  const { propertyId } = useParams();
  const [propertyAddress, setPropertyAddress] = useState("");

  useEffect(() => {
    async function loadProperty() {
      if (!propertyId) return;
      try {
        const prop = await fetchJSON(`/properties/${propertyId}`);
        setPropertyAddress(prop.address);
      } catch (err) {
        console.error("Failed to load property", err);
      }
    }
    loadProperty();
  }, [propertyId]);

  
  useEffect(() => {
    let animationFrameId: number;

    const updateDropdownPos = () => {
      if (showPageSizeDropdown && dropdownButtonRef.current) {
        const rect = dropdownButtonRef.current.getBoundingClientRect();
        setDropdownPos({
          top: rect.bottom + 8,
          left: rect.left,
        });
      }
    };

    updateDropdownPos();

    if (showPageSizeDropdown) {
      animationFrameId = requestAnimationFrame(updateDropdownPos);
      window.addEventListener("resize", updateDropdownPos);
      window.addEventListener("scroll", updateDropdownPos);
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", updateDropdownPos);
      window.removeEventListener("scroll", updateDropdownPos);
    };
  }, [showPageSizeDropdown]);


  useEffect(() => {
    async function loadHistory() {
      if (!propertyId) return;
      try {
        const hist = await fetchJSON(`/invoicing/history?property_id=${propertyId}`);
        setInvoiceHistory(hist.map((h: any) => mapHistoryToUI(h)));
      } catch (err) {
        console.error("Failed to load invoice history", err);
      }
    }
  
    loadHistory();
  }, [propertyId]);
  
  useEffect(() => {
    const handleClickAnywhere = () => {
      setOpenMenuId(null);
    };

    document.addEventListener("mousedown", handleClickAnywhere);
    return () => document.removeEventListener("mousedown", handleClickAnywhere);
  }, []);

  const invoiceItems = [
    {
      id: 1,
      vendor: "Elite HVAC",
      vendorIcon:
        "https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/9ffc2d13a49e4caa7244ce9895eba63cc87e5390?placeholderIfAbsent=true",
      vendorBg: "#FFF0EF",
      vendorBorder: "rgba(188, 66, 62, 0.22)",
      glAccount: "ConEd - 1,220 kWh",
      description: "ConEd - 1,220 kWh",
      amount: "$420",
      source: "Auto-Import",
      status: "Paid",
      statusColor: "#059669",
      statusBg: "#D1FAE5",
    },
    {
      id: 2,
      vendor: "ABC Plumbing",
      vendorIcon:
        "https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/6a406e4d9d31a0d96e167fc376208ee79f53def5?placeholderIfAbsent=true",
      vendorBg: "#FEFCDB",
      vendorBorder: "rgba(235, 165, 36, 0.22)",
      glAccount: "Unit 48 Thermostat",
      description: "Unit 48 Thermostat",
      amount: "$380",
      source: "Vendor",
      status: "Pending",
      statusColor: "#D97706",
      statusBg: "#FEF3C7",
    },
    {
      id: 3,
      vendor: "Elite HVAC",
      vendorIcon:
        "https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/c163c3bcaa194a5f948a36680b0501ecd8569640?placeholderIfAbsent=true",
      vendorBg: "#DBE9FE",
      vendorBorder: "rgba(36, 99, 235, 0.22)",
      glAccount: "Tools for common area",
      description: "Tools for common area",
      amount: "$120",
      source: "Manual",
      status: "Approved",
      statusColor: "#2463EB",
      statusBg: "#DBE9FE",
    },
  ];
  const [lineItems, setLineItems] = useState([]);

  useEffect(() => {
    async function load() {
      try {
        // STEP 1 — get current draft invoice id
        const inv = await fetchJSON(`/invoicing/current-draft?property_id=${propertyId}`);
        const invoiceId = inv.invoice_id;
  
        // STEP 2 — fetch line items
        const data = await fetchJSON(`/invoicing/line-items-expanded?id=${invoiceId}`);
        setLineItems(data.map((li: any) => mapBackendToUI(li)));
      } catch (err) {
        console.error("Failed to load invoice items", err);
      }
    }
  
    load();
  }, []);
  

  const totalInvoices = invoiceHistory.length;
  const totalPages = Math.ceil(totalInvoices / itemsPerPage);
  const paginatedHistory = invoiceHistory.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const getPaginationNumbers = () => {
    const pages: (number | string)[] = [];

    if (totalPages <= 1) {
      return [1];
    }

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
      return pages;
    }

    // For totalPages > 7, show exactly 7 consecutive pages without ellipsis
    const windowSize = 7;
    let start = Math.max(1, currentPage - 2);
    let end = start + windowSize - 1;

    // Adjust if we're near the end to keep showing 7 pages
    if (end > totalPages) {
      end = totalPages;
      start = Math.max(1, end - windowSize + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  };

  return (
    <div className="flex flex-col gap-0">
      {/* Alert Banner */}
      <div
        className="flex items-center justify-between self-stretch rounded-2xl border border-[#E5E5FF] p-3 px-4"
        style={{
          boxShadow:
            "4px -4px 14px 0 rgba(0, 28, 237, 0.07) inset, -4px 4px 14px 0 rgba(237, 0, 217, 0.07) inset",
        }}
      >
        <div className="flex items-center gap-2.5">
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g clipPath="url(#clip0_10950_5031)">
              <path
                d="M3.00065 14.6668V11.3335M3.00065 4.66683V1.3335M1.33398 3.00016H4.66732M1.33398 13.0002H4.66732M8.66732 2.00016L7.5112 5.00607C7.32319 5.49489 7.22919 5.7393 7.083 5.94489C6.95344 6.12709 6.79425 6.28629 6.61204 6.41585C6.40646 6.56203 6.16204 6.65604 5.67322 6.84404L2.66732 8.00016L5.67323 9.15628C6.16205 9.34429 6.40646 9.43829 6.61204 9.58448C6.79425 9.71404 6.95344 9.87323 7.083 10.0554C7.22919 10.261 7.32319 10.5054 7.5112 10.9943L8.66732 14.0002L9.82344 10.9943C10.0114 10.5054 10.1054 10.261 10.2516 10.0554C10.3812 9.87323 10.5404 9.71404 10.7226 9.58448C10.9282 9.43829 11.1726 9.34429 11.6614 9.15628L14.6673 8.00016L11.6614 6.84404C11.1726 6.65604 10.9282 6.56203 10.7226 6.41585C10.5404 6.28629 10.3812 6.12709 10.2516 5.94489C10.1054 5.7393 10.0114 5.49489 9.82344 5.00607L8.66732 2.00016Z"
                stroke="#1D407F"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
            <defs>
              <clipPath id="clip0_10950_5031">
                <rect width="16" height="16" fill="white" />
              </clipPath>
            </defs>
          </svg>
          <div className="text-base font-medium leading-[1.4] tracking-[-0.32px] capitalize">
            <span className="font-bold">unapproved Expenses</span>
            <span className="font-medium">
              {" "}
              - There are unapproved Field Team Expenses Outstanding. Please
              Review before invoicing client.
            </span>
          </div>
        </div>
        <div className="text-[#013764] underline font-medium text-base leading-[1.4] tracking-[-0.32px] capitalize whitespace-nowrap">
          View 2 Insights
        </div>
      </div>

      {/* This Month's Invoice */}
      <InvoiceTable items={lineItems} propertyAddress={propertyAddress} />

      {/* Invoice History */}
      <InvoiceHistoryTable items={invoiceHistory} />

      {/* Dropdown Menu - Rendered via Portal at body level */}
      {showPageSizeDropdown &&
        createPortal(
          <div
            className="bg-white overflow-hidden"
            style={{
              border: "0.5px solid #DADADA",
              borderRadius: "8px",
              boxShadow:
                "0 38px 11px 0 rgba(0, 0, 0, 0.00), 0 24px 10px 0 rgba(0, 0, 0, 0.01), 0 14px 8px 0 rgba(0, 0, 0, 0.04), 0 6px 6px 0 rgba(0, 0, 0, 0.06), 0 2px 3px 0 rgba(0, 0, 0, 0.07)",
              zIndex: 99999,
              minWidth: "56px",
              width: "56px",
              position: "fixed",
              top: dropdownPos.top + "px",
              left: dropdownPos.left + "px",
              pointerEvents: "auto",
            }}
            onMouseLeave={() => setShowPageSizeDropdown(false)}
          >
            {[10, 25, 50].map((size, index) => (
              <button
                key={size}
                onClick={() => {
                  setItemsPerPage(size);
                  setCurrentPage(1);
                  setShowPageSizeDropdown(false);
                }}
                className={`w-full px-4 py-3 text-center text-base transition-colors whitespace-nowrap ${
                  itemsPerPage === size
                    ? "bg-gray-50 font-medium text-gray-900"
                    : "text-[#303030] hover:bg-gray-50"
                }`}
                style={{
                  fontFamily:
                    "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                  fontSize: "16px",
                  lineHeight: "140%",
                  letterSpacing: "-0.32px",
                  borderRadius: index === 2 ? "0 0 8px 8px" : "0",
                }}
              >
                {size}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </div>
  );
};
