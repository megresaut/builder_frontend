import { useState } from "react";

interface InvoicingProps {
  propertyAddress: string;
  propertyType: string;
  propertyUnits: number;
}

export const Invoicing: React.FC<InvoicingProps> = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [openActionId, setOpenActionId] = useState<string | null>(null);

  const invoiceItems = [
    {
      id: 1,
      vendor: "Elite HVAC",
      vendorIcon: "https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/9ffc2d13a49e4caa7244ce9895eba63cc87e5390?placeholderIfAbsent=true",
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
      vendorIcon: "https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/6a406e4d9d31a0d96e167fc376208ee79f53def5?placeholderIfAbsent=true",
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
      vendorIcon: "https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/c163c3bcaa194a5f948a36680b0501ecd8569640?placeholderIfAbsent=true",
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

  const invoiceHistory = [
    { id: 1, date: "Oct 1, 2025", dueDate: "Dec 17, 2025", amount: "$237", status: "Paid", statusColor: "#059669", statusBg: "#D1FAE5", statusIcon: "https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/3293eefc705d0aa2c8d8afe5bcd130ffd4267fcd?placeholderIfAbsent=true" },
    { id: 2, date: "Oct 1, 2025", dueDate: "Dec 10, 2025", amount: "$639", status: "Partially Paid", statusColor: "#D97706", statusBg: "#FEF3C7", statusIcon: "https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/c78d46fd40373589ea4c9b2466efcb245b7d37e3?placeholderIfAbsent=true" },
    { id: 3, date: "Sep 28, 2025", dueDate: "Dec 3, 2025", amount: "$482", status: "Overdue", statusColor: "#C61916", statusBg: "#FFE4DF", statusIcon: "https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/07a1bbbdfd90776659d3dff29d87e35a3a6602da?placeholderIfAbsent=true" },
    { id: 4, date: "Sep 21, 2025", dueDate: "Nov 26, 2025", amount: "$183", status: "Partially Paid", statusColor: "#D97706", statusBg: "#FEF3C7", statusIcon: "https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/adc13cf035f6b23bbff65856e578b89ee67904d7?placeholderIfAbsent=true" },
    { id: 5, date: "Sep 14, 2025", dueDate: "Nov 19, 2025", amount: "$711", status: "Overdue", statusColor: "#C61916", statusBg: "#FFE4DF", statusIcon: "https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/46f755aad8be29be69d58995cc638bc092a9db0c?placeholderIfAbsent=true" },
    { id: 6, date: "Sep 7, 2025", dueDate: "Nov 12, 2025", amount: "$335", status: "Paid", statusColor: "#059669", statusBg: "#D1FAE5", statusIcon: "https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/408dc7b0515f95bc0af6a7acc03dffb1dae2f798?placeholderIfAbsent=true" },
    { id: 7, date: "Aug 31, 2025", dueDate: "Nov 5, 2025", amount: "$558", status: "Paid", statusColor: "#059669", statusBg: "#D1FAE5", statusIcon: "https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/b14e8b210b874b43f30985e753e8ae036b47a502?placeholderIfAbsent=true" },
    { id: 8, date: "Aug 24, 2025", dueDate: "Oct 29, 2025", amount: "$294", status: "Partially Paid", statusColor: "#D97706", statusBg: "#FEF3C7", statusIcon: "https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/91508c6903119b8020b38a0cc94661b73171e2db?placeholderIfAbsent=true" },
    { id: 9, date: "Aug 17, 2025", dueDate: "Oct 22, 2025", amount: "$672", status: "Partially Paid", statusColor: "#D97706", statusBg: "#FEF3C7", statusIcon: "https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/20e8a13c80a1552dbd67be6df821edb9af15cb2a?placeholderIfAbsent=true" },
    { id: 10, date: "Aug 10, 2025", dueDate: "Oct 15, 2025", amount: "$416", status: "Overdue", statusColor: "#C61916", statusBg: "#FFE4DF", statusIcon: "https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/5aa3241bd0405b27426830e308be0fbe085ebae0?placeholderIfAbsent=true" },
  ];

  const totalPages = Math.ceil(invoiceHistory.length / itemsPerPage);
  const paginatedHistory = invoiceHistory.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getPaginationNumbers = () => {
    const pages: (number | string)[] = [];
    
    if (totalPages <= 1) return [1];
    
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
      return pages;
    }

    pages.push(1, 2, 3);
    
    if (currentPage > 5) {
      pages.push("...");
    }
    
    if (totalPages > 3) {
      const lastPages = [totalPages - 2, totalPages - 1, totalPages];
      lastPages.forEach(p => {
        if (!pages.includes(p) && p > 3) {
          pages.push(p);
        }
      });
    }
    
    return pages;
  };

  return (
    <div className="flex flex-col gap-0">
      {/* Alert Banner */}
      <div
        className="flex items-center justify-between self-stretch rounded-2xl border border-[#E5E5FF] p-3 px-4"
        style={{
          boxShadow: "4px -4px 14px 0 rgba(0, 28, 237, 0.07) inset, -4px 4px 14px 0 rgba(237, 0, 217, 0.07) inset"
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
            <span className="font-medium"> - There are unapproved Field Team Expenses Outstanding. Please Review before invoicing client.</span>
          </div>
        </div>
        <div className="text-[#013764] underline font-medium text-base leading-[1.4] tracking-[-0.32px] capitalize whitespace-nowrap">
          View 2 Insights
        </div>
      </div>

      {/* This Month's Invoice */}
      <div className="bg-white flex w-full flex-col mt-6">
        <div className="rounded-xl border border-[#E5E5E5] shadow-[0_1px_2px_0_rgba(10,13,18,0.05)] flex w-full flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-white flex w-full px-4 py-4 items-center gap-4 justify-between flex-wrap">
            <div className="flex items-center gap-4">
              <div className="text-[#303030] font-medium text-[22px] leading-[1.09]">
                This Month's Invoice
              </div>
            </div>
            <div className="flex min-w-60 items-start gap-2.5">
              <div className="flex min-w-60 min-h-9 gap-2 items-center px-3 rounded-lg border-[0.5px] border-[#DADADA] shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] bg-[#FBFBFB]">
                <img
                  loading="lazy"
                  src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/b47ca0b4fcf9eb132889213ca1e6a92de1087150?placeholderIfAbsent=true"
                  className="w-5 h-5"
                  alt=""
                />
                <input
                  type="text"
                  placeholder="Search..."
                  className="bg-transparent border-none outline-none text-[#303030] font-normal text-base leading-[1.4] tracking-[-0.32px]"
                />
              </div>
              <div className="rounded-lg bg-[#013764] flex min-h-9 px-3 py-2 items-center gap-2 overflow-hidden cursor-pointer hover:bg-[#002d4d]">
                <img
                  loading="lazy"
                  src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/4d88fa44d294755ce2b939b087c7b7ff1178d34e?placeholderIfAbsent=true"
                  className="w-5 h-5"
                  alt=""
                />
                <div className="text-white font-medium text-base">Add Line Item</div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="border-[0.5px] border-[#DADADA] shadow-[0_1px_2px_0_rgba(10,13,18,0.05)] bg-white flex w-full max-w-full flex-col overflow-visible" style={{ borderLeftWidth: "0px", borderBottomWidth: "0px", borderRightWidth: "0px" }}>
            <div className="flex w-full items-center flex-wrap" style={{ borderLeftColor: "transparent" }}>
              <div className="flex min-w-60 items-center flex-wrap flex-1" style={{ borderLeftColor: "transparent" }}>
                {/* Vendor Column */}
                <div className="border-r border-[#DADADA] flex flex-col overflow-hidden flex-grow w-[151px]" style={{ borderLeftColor: "transparent" }}>
                  <div className="items-center border-b-[0.5px] border-[#DADADA] bg-[#FBFBFB] flex w-full gap-2 overflow-hidden px-3 py-3" style={{ borderLeftColor: "transparent" }}>
                    <img
                      loading="lazy"
                      src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/5a259bd11d9f5abd6e662f6fa1e8a2e63fa7a635?placeholderIfAbsent=true"
                      className="w-4 h-4"
                      alt=""
                    />
                    <div className="text-[#525252] font-medium text-base tracking-[-0.32px] leading-[1.4]">
                      Vendor
                    </div>
                  </div>
                  {invoiceItems.map((item) => (
                    <div key={item.id} className="items-center border-b-[0.5px] border-[#DADADA] flex min-h-14 w-full gap-2.5 px-3" style={{ borderLeftColor: "transparent" }}>
                      <div
                        className="rounded-full shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] border flex min-h-7 w-7 items-center gap-2.5 overflow-hidden justify-center"
                        style={{
                          backgroundColor: item.vendorBg,
                          borderColor: item.vendorBorder,
                        }}
                      >
                        <img
                          loading="lazy"
                          src={item.vendorIcon}
                          className="w-5 h-5"
                          alt=""
                        />
                      </div>
                      <div className="text-[#303030] text-base font-normal leading-[1.4] tracking-[-0.32px] flex-1">
                        {item.vendor}
                      </div>
                    </div>
                  ))}
                </div>

                {/* GL Account Column */}
                <div className="border-r border-[#DADADA] flex flex-col overflow-hidden flex-grow w-[185px]">
                  <div className="items-center border-b-[0.5px] border-[#DADADA] bg-[#FBFBFB] flex w-full gap-2 overflow-hidden px-3 py-3">
                    <img
                      loading="lazy"
                      src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/525b056852d683baf01ec82ce654e2cf172fd244?placeholderIfAbsent=true"
                      className="w-4 h-4"
                      alt=""
                    />
                    <div className="text-[#525252] font-medium text-base tracking-[-0.32px] leading-[1.4]">
                      GL Account
                    </div>
                  </div>
                  {invoiceItems.map((item) => (
                    <div key={item.id} className="items-center border-b-[0.5px] border-[#DADADA] flex min-h-14 w-full gap-2.5 px-3">
                      <div className="text-[#303030] text-base font-normal leading-[1.4] tracking-[-0.32px] flex-1">
                        {item.glAccount}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Description Column */}
                <div className="border-r border-[#DADADA] flex flex-col overflow-hidden flex-grow w-[185px]">
                  <div className="items-center border-b-[0.5px] border-[#DADADA] bg-[#FBFBFB] flex w-full gap-2 overflow-hidden px-3 py-3">
                    <img
                      loading="lazy"
                      src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/525b056852d683baf01ec82ce654e2cf172fd244?placeholderIfAbsent=true"
                      className="w-4 h-4"
                      alt=""
                    />
                    <div className="text-[#525252] font-medium text-base tracking-[-0.32px] leading-[1.4]">
                      Description
                    </div>
                  </div>
                  {invoiceItems.map((item) => (
                    <div key={item.id} className="items-center border-b-[0.5px] border-[#DADADA] flex min-h-14 w-full gap-2.5 px-3">
                      <div className="text-[#303030] text-base font-normal leading-[1.4] tracking-[-0.32px] flex-1">
                        {item.description}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Category Column */}
                <div className="border-r border-[#DADADA] flex flex-col overflow-hidden flex-grow w-[108px]">
                  <div className="items-center border-b-[0.5px] border-[#DADADA] bg-[#FBFBFB] flex w-full gap-2 overflow-hidden px-3 py-3">
                    <img
                      loading="lazy"
                      src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/235ac6b3fec1e32b1b99b6ed9d9bbcd860cdf2ae?placeholderIfAbsent=true"
                      className="w-4 h-4"
                      alt=""
                    />
                    <div className="text-[#525252] font-medium text-base tracking-[-0.32px] leading-[1.4]">
                      Category
                    </div>
                  </div>
                  {invoiceItems.map((item) => (
                    <div key={item.id} className="items-center border-b-[0.5px] border-[#DADADA] flex min-h-14 w-full gap-2 px-3">
                      <div className="text-[#303030] text-base font-normal leading-[1.4] tracking-[-0.32px]">
                        {item.category}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Amount Column */}
                <div className="border-r border-[#DADADA] flex flex-col overflow-hidden flex-grow w-[92px]">
                  <div className="items-center border-b-[0.5px] border-[#DADADA] bg-[#FBFBFB] flex w-full gap-2 px-3 py-3">
                    <img
                      loading="lazy"
                      src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/9997108c517c4080bd0f554754253e3ae8b3d5d3?placeholderIfAbsent=true"
                      className="w-4 h-4"
                      alt=""
                    />
                    <div className="text-[#525252] font-medium text-base tracking-[-0.32px] leading-[1.4]">
                      Amount
                    </div>
                  </div>
                  {invoiceItems.map((item) => (
                    <div key={item.id} className="items-center border-b-[0.5px] border-[#DADADA] flex min-h-14 w-full gap-2.5 px-3">
                      <div className="text-[#303030] text-base font-normal leading-[1.4] tracking-[-0.32px]">
                        {item.amount}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Source Column */}
                <div className="border-r border-[#DADADA] flex flex-col overflow-hidden flex-grow w-[113px]">
                  <div className="items-center border-b-[0.5px] border-[#DADADA] bg-[#FBFBFB] flex w-full gap-2 px-3 py-3">
                    <img
                      loading="lazy"
                      src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/2c8bf4b168dd5c3a5b85fe86577c355415e8373c?placeholderIfAbsent=true"
                      className="w-4 h-4"
                      alt=""
                    />
                    <div className="text-[#525252] font-medium text-base tracking-[-0.32px] leading-[1.4]">
                      Source
                    </div>
                  </div>
                  {invoiceItems.map((item) => (
                    <div key={item.id} className="items-center border-b-[0.5px] border-[#DADADA] flex min-h-14 w-full gap-2.5 px-3">
                      <div className="text-[#303030] text-base font-normal leading-[1.4] tracking-[-0.32px]">
                        {item.source}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Status Column */}
                <div className="border-r border-[#DADADA] flex flex-col overflow-hidden flex-grow w-[140px]">
                  <div className="items-center border-b-[0.5px] border-[#DADADA] bg-[#FBFBFB] flex w-full gap-2 overflow-hidden px-3 py-3">
                    <img
                      loading="lazy"
                      src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/086dc40cd470d2578aa210283649725e87dab9c2?placeholderIfAbsent=true"
                      className="w-4 h-4"
                      alt=""
                    />
                    <div className="text-[#525252] font-medium text-base tracking-[-0.32px] leading-[1.4]">
                      Status
                    </div>
                  </div>
                  {invoiceItems.map((item) => (
                    <div key={item.id} className="items-center border-b-[0.5px] border-[#DADADA] flex min-h-14 w-full gap-2.5 px-3" style={{ borderRightWidth: "0px" }}>
                      <div
                        className="flex items-center gap-1.5 rounded-2xl px-3 py-1"
                        style={{
                          backgroundColor: item.statusBg,
                          color: item.statusColor,
                        }}
                      >
                        <img
                          loading="lazy"
                          src={item.statusColor === "#059669" ? "https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/1530b55e05a0c9f46cbec0184275150b4ba73383?placeholderIfAbsent=true" : item.statusColor === "#D97706" ? "https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/e1e02c6b8e50157c1e39178ae05d8f743788ee90?placeholderIfAbsent=true" : "https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/a0937a543ac664bb2ae058d40061589d8c33951f?placeholderIfAbsent=true"}
                          className="w-4 h-4"
                          alt=""
                        />
                        <div className="text-base font-normal leading-[1.4] tracking-[-0.32px]">
                          {item.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions Column */}
              <div className="items-center shadow-[-1px_1px_2px_0_rgba(10,13,18,0.05)] border-l border-[#DADADA] bg-white flex flex-col overflow-visible w-20 relative z-40">
                <div className="items-center border-b-[0.5px] border-[#DADADA] bg-[#FBFBFB] flex w-20 gap-2 overflow-visible px-3 py-3">
                  <div className="text-[#525252] font-medium text-base tracking-[-0.32px] leading-[1.4]">
                    Actions
                  </div>
                </div>
                {invoiceItems.map((item) => (
                  <div key={item.id} className="items-center border-b-[0.5px] border-[#DADADA] flex min-h-14 w-full max-w-20 gap-2.5 px-3 relative">
                    <button
                      onClick={() => setOpenActionId(openActionId === `invoice-${item.id}` ? null : `invoice-${item.id}`)}
                      className="rounded-md bg-[#FBFBFB] shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] border border-[#DADADA] flex min-h-7 w-7 px-1.5 items-center gap-2 justify-center cursor-pointer hover:bg-gray-100 relative"
                    >
                      <img
                        loading="lazy"
                        src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/7e6ac68158ffa1dc48847fc07b3685f07fa98a1f?placeholderIfAbsent=true"
                        className="w-[18px] h-[18px]"
                        alt=""
                      />
                      {openActionId === `invoice-${item.id}` && (
                        <div className="absolute top-full right-0 mt-1 bg-white border border-[#E5E5E5] rounded-lg shadow-2xl min-w-[120px]" style={{ zIndex: 2147483647 }}>
                          <div className="block w-full text-left px-4 py-2 text-sm text-[#303030] hover:bg-gray-50 border-b border-[#E5E5E5] cursor-pointer" onClick={(e) => e.stopPropagation()}>
                            Edit
                          </div>
                          <div className="block w-full text-left px-4 py-2 text-sm text-[#C61916] hover:bg-red-50 cursor-pointer" onClick={(e) => e.stopPropagation()}>
                            Delete
                          </div>
                        </div>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-white flex w-full px-4 py-4 items-center gap-4 justify-between flex-wrap">
            <div className="flex items-center gap-4">
              <div className="text-[#303030] font-medium text-[22px] leading-[1.09]">
                Subtotal: $920
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <div className="rounded-lg bg-[#013764] shadow-[0_0_0_1px_rgba(0,45,90,1)] flex min-h-9 px-3 py-2 items-center gap-2 overflow-hidden cursor-pointer hover:bg-[#002d4d]">
                <div className="text-white font-medium text-base">Preview PDF</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice History */}
      <div className="flex mt-6 w-full flex-col items-center">
        <div className="rounded-xl border border-[#E5E5E5] shadow-[0_1px_2px_0_rgba(10,13,18,0.05)] flex w-full flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-white flex w-full px-4 py-4 items-center gap-4 justify-between flex-wrap">
            <div className="flex items-center gap-4">
              <div className="text-[#303030] font-medium text-[22px] leading-[1.09]">
                Invoice History
              </div>
            </div>
            <div className="flex min-w-60 items-start gap-2.5 flex-wrap">
              <div className="flex min-w-60 min-h-9 gap-2 items-center px-3 rounded-lg border-[0.5px] border-[#DADADA] shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] bg-[#FBFBFB]">
                <img
                  loading="lazy"
                  src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/b47ca0b4fcf9eb132889213ca1e6a92de1087150?placeholderIfAbsent=true"
                  className="w-5 h-5"
                  alt=""
                />
                <input
                  type="text"
                  placeholder="Search..."
                  className="bg-transparent border-none outline-none text-[#303030] font-normal text-base leading-[1.4] tracking-[-0.32px]"
                />
              </div>
              <div className="rounded-lg bg-[#FBFBFB] shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] border border-[#DADADA] flex min-h-9 px-3 py-1.5 items-center gap-2 cursor-pointer hover:bg-gray-100">
                <div className="text-[#303030] font-normal text-base leading-[1.4] tracking-[-0.32px]">
                  Filter
                </div>
                <img
                  loading="lazy"
                  src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/81afa4c88f6177ebdc84321a1f0691342b9fcd92?placeholderIfAbsent=true"
                  className="w-[18px] h-[18px]"
                  alt=""
                />
              </div>
              <div className="rounded-lg bg-[#013764] shadow-[0_0_0_1px_rgba(0,45,90,1)] flex min-h-9 px-3 py-2 items-center gap-2 overflow-hidden cursor-pointer hover:bg-[#002d4d]">
                <div className="text-white font-medium text-base">Export to Buildium</div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="border-[0.5px] border-[#DADADA] shadow-[0_1px_2px_0_rgba(10,13,18,0.05)] bg-white flex w-full flex-col overflow-visible">
            <div className="flex w-full items-center flex-wrap" style={{ borderLeftColor: "transparent" }}>
              <div className="flex min-w-60 items-center flex-wrap flex-1" style={{ borderLeftColor: "transparent" }}>
                {/* Date Column */}
                <div className="border-r border-[#DADADA] flex min-w-60 flex-col overflow-hidden flex-1">
                  <div className="items-center border-b-[0.5px] border-[#DADADA] bg-[#FBFBFB] flex w-full gap-2 overflow-hidden px-3 py-3">
                    <img
                      loading="lazy"
                      src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/d2b8afe9755fcab34886841ccd885dc23566b8a6?placeholderIfAbsent=true"
                      className="w-4 h-4"
                      alt=""
                    />
                    <div className="text-[#525252] font-medium text-base tracking-[-0.32px] leading-[1.4]">
                      Date
                    </div>
                  </div>
                  {paginatedHistory.map((item) => (
                    <div key={item.id} className="items-center border-b-[0.5px] border-[#DADADA] flex min-h-14 w-full gap-2.5 px-3">
                      <div className="text-[#303030] text-base font-normal leading-[1.4] tracking-[-0.32px] flex-1">
                        {item.date}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Due Date Column */}
                <div className="border-r border-[#DADADA] flex min-w-60 flex-col overflow-hidden flex-1" style={{ borderLeftColor: "transparent" }}>
                  <div className="items-center border-b-[0.5px] border-[#DADADA] bg-[#FBFBFB] flex w-full gap-2 overflow-hidden px-3 py-3" style={{ borderLeftColor: "transparent" }}>
                    <img
                      loading="lazy"
                      src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/d2b8afe9755fcab34886841ccd885dc23566b8a6?placeholderIfAbsent=true"
                      className="w-4 h-4"
                      alt=""
                    />
                    <div className="text-[#525252] font-medium text-base tracking-[-0.32px] leading-[1.4]">
                      Due Date
                    </div>
                  </div>
                  {paginatedHistory.map((item) => (
                    <div key={item.id} className="items-center border-b-[0.5px] border-[#DADADA] flex min-h-14 w-full gap-2.5 px-3" style={{ borderLeftColor: "transparent" }}>
                      <div className="text-[#303030] text-base font-normal leading-[1.4] tracking-[-0.32px] flex-1">
                        {item.dueDate}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Amount Column */}
                <div className="border-r border-[#DADADA] flex min-w-60 flex-col overflow-hidden flex-1" style={{ borderLeftColor: "transparent" }}>
                  <div className="items-center border-b-[0.5px] border-[#DADADA] bg-[#FBFBFB] flex w-full gap-2 overflow-hidden px-3 py-3" style={{ borderLeftColor: "transparent" }}>
                    <img
                      loading="lazy"
                      src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/9997108c517c4080bd0f554754253e3ae8b3d5d3?placeholderIfAbsent=true"
                      className="w-4 h-4"
                      alt=""
                    />
                    <div className="text-[#525252] font-medium text-base tracking-[-0.32px] leading-[1.4]">
                      Amount
                    </div>
                  </div>
                  {paginatedHistory.map((item) => (
                    <div key={item.id} className="items-center border-b-[0.5px] border-[#DADADA] flex min-h-14 w-full gap-2 px-3" style={{ borderLeftColor: "transparent" }}>
                      <div className="text-[#303030] text-base font-normal leading-[1.4] tracking-[-0.32px]">
                        {item.amount}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Status Column */}
                <div className="border-r border-[#DADADA] flex min-w-60 flex-col overflow-hidden flex-1" style={{ borderLeftColor: "transparent" }}>
                  <div className="items-center border-b-[0.5px] border-[#DADADA] bg-[#FBFBFB] flex w-full gap-2 overflow-hidden px-3 py-3" style={{ borderLeftColor: "transparent" }}>
                    <img
                      loading="lazy"
                      src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/84b06677254b5f24ffac8eebc8e159037bc09802?placeholderIfAbsent=true"
                      className="w-4 h-4"
                      alt=""
                    />
                    <div className="text-[#525252] font-medium text-base tracking-[-0.32px] leading-[1.4]">
                      Status
                    </div>
                  </div>
                  {paginatedHistory.map((item) => (
                    <div key={item.id} className="items-center border-b-[0.5px] border-[#DADADA] flex min-h-14 w-full gap-2.5 px-3" style={{ borderLeftColor: "transparent" }}>
                      <div
                        className="flex items-center gap-1.5 rounded-2xl px-3 py-1"
                        style={{
                          backgroundColor: item.statusBg,
                          color: item.statusColor,
                        }}
                      >
                        <img
                          loading="lazy"
                          src={item.statusIcon}
                          className="w-4 h-4"
                          alt=""
                        />
                        <div className="text-base font-normal leading-[1.4] tracking-[-0.32px]">
                          {item.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions Column */}
              <div className="items-center shadow-[-1px_1px_2px_0_rgba(10,13,18,0.05)] border-l border-[#DADADA] bg-white flex flex-col overflow-visible w-20 relative">
                <div className="items-center border-b-[0.5px] border-[#DADADA] bg-[#FBFBFB] flex w-20 gap-2 overflow-hidden px-3 py-3">
                  <div className="text-[#525252] font-medium text-base tracking-[-0.32px] leading-[1.4]">
                    Actions
                  </div>
                </div>
                {paginatedHistory.map((item) => (
                  <div key={item.id} className="items-center border-b-[0.5px] border-[#DADADA] flex min-h-14 w-full max-w-20 gap-2.5 px-3 relative">
                    <button
                      onClick={() => setOpenActionId(openActionId === `history-${item.id}` ? null : `history-${item.id}`)}
                      className="rounded-md bg-[#FBFBFB] shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] border border-[#DADADA] flex min-h-7 w-7 px-1.5 items-center gap-2 justify-center cursor-pointer hover:bg-gray-100 relative"
                    >
                      <img
                        loading="lazy"
                        src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/7e6ac68158ffa1dc48847fc07b3685f07fa98a1f?placeholderIfAbsent=true"
                        className="w-[18px] h-[18px]"
                        alt=""
                      />
                      {openActionId === `history-${item.id}` && (
                        <div className="absolute top-full right-0 mt-1 bg-white border border-[#E5E5E5] rounded-lg shadow-2xl min-w-[120px]" style={{ zIndex: 2147483647 }}>
                          <div className="block w-full text-left px-4 py-2 text-sm text-[#303030] hover:bg-gray-50 border-b border-[#E5E5E5] cursor-pointer" onClick={(e) => e.stopPropagation()}>
                            Edit
                          </div>
                          <div className="block w-full text-left px-4 py-2 text-sm text-[#C61916] hover:bg-red-50 cursor-pointer" onClick={(e) => e.stopPropagation()}>
                            Delete
                          </div>
                        </div>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between w-full gap-4 flex-wrap px-6 py-4">
            <div className="flex items-center gap-2">
              <div className="text-[#525252] text-base font-medium">Showing</div>
              <div className="items-start rounded-lg border border-[#E5E5E5] shadow-[0_1px_2px_0_rgba(10,13,18,0.05)] flex overflow-hidden">
                <div className="rounded-lg bg-[#FBFBFB] shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] border border-[#DADADA] flex min-h-10 px-3 py-2.5 items-center gap-2 cursor-pointer">
                  <div className="text-[#0A0A0A] text-base font-medium">{itemsPerPage}</div>
                  <img
                    loading="lazy"
                    src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/cc5507ba17118962f81e4f61a415adb6e3ee75ee?placeholderIfAbsent=true"
                    className="w-[18px] h-[18px]"
                    alt=""
                  />
                </div>
              </div>
              <div className="text-[#525252] text-base font-medium">of 225</div>
            </div>
            <div className="rounded-lg bg-[#FBFBFB] shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] border border-[#DADADA] flex min-w-60 min-h-10 items-center overflow-hidden flex-wrap justify-center">
              <div
                className="flex items-center justify-center gap-1.5 min-h-10 px-3.5 py-2 border-r border-[#E5E5E5] bg-white cursor-pointer hover:bg-gray-50"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              >
                <img
                  loading="lazy"
                  src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/dc8342cc7d9ed7372ff27293ef7c08e463e9fba7?placeholderIfAbsent=true"
                  className="w-5 h-5"
                  alt=""
                />
                <div className="text-[#525252] text-base font-medium">Previous</div>
              </div>
              {getPaginationNumbers().map((page, idx) => {
                if (page === "...") {
                  return (
                    <div key={`ellipsis-${idx}`} className="flex items-center justify-center min-h-10 min-w-10 px-2 gap-2 border-r border-[#E5E5E5] bg-white">
                      <div className="text-[#A3A3A3] text-base font-medium">...</div>
                    </div>
                  );
                }
                return (
                  <div
                    key={page}
                    className={`flex items-center justify-center min-h-10 min-w-10 px-2 gap-2 border-r border-[#E5E5E5] cursor-pointer hover:bg-gray-50 ${
                      currentPage === page ? "bg-white" : "bg-white"
                    }`}
                    onClick={() => setCurrentPage(page as number)}
                  >
                    <div className={`text-base font-medium ${currentPage === page ? "text-[#0A0A0A]" : "text-[#A3A3A3]"}`}>
                      {page}
                    </div>
                  </div>
                );
              })}
              <div
                className="flex items-center justify-center gap-1.5 min-h-10 px-4 py-2 border-r border-[#E5E5E5] bg-white cursor-pointer hover:bg-gray-50"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              >
                <div className="text-[#525252] text-base font-medium">Next</div>
                <img
                  loading="lazy"
                  src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/34c281f37936da4ccce4bfe5d47937be9d7ed9c7?placeholderIfAbsent=true"
                  className="w-5 h-5"
                  alt=""
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
