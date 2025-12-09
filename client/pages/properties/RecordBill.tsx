import { useState } from "react";
import { useNavigate } from "react-router-dom";

export const RecordBill = () => {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleCancel = () => {
    navigate(-1);
  };

  const handleRecordBill = () => {
    // Handle record bill logic here
    navigate(-1);
  };

  return (
    <div className="bg-white flex flex-col px-8 py-6 font-[Geist,-apple-system,Roboto,Helvetica,sans-serif]">
      {/* Header */}
      <div className="flex w-full items-center justify-between gap-24 flex-wrap">
        <div className="flex flex-col min-w-[240px]">
          <h1 className="text-[#303030] text-2xl font-semibold leading-[1.25]">
            Record Bill
          </h1>
          <p className="mt-1 text-[#71717A] text-base font-medium leading-[1]">
            Upload an invoice and record a new bill
          </p>
        </div>
        <div className="flex min-h-9 gap-4" />
      </div>

      {/* Main Content */}
      <div className="flex mt-5 w-full items-start gap-7 flex-wrap">
        {/* File Upload Section */}
        <div className="flex flex-col flex-1 min-w-[240px] text-base font-normal w-[462px]">
          <div className="rounded-lg bg-white border border-dashed border-[#121212]/40 flex flex-col overflow-hidden flex-1 px-20 py-7 justify-center">
            <div className="self-center flex flex-col items-center">
              <div className="flex flex-col items-center p-2.5 text-[#09090B] leading-[1]">
                <div>Choose a file or drag & drop it here</div>
                <div className="mt-2">JPEG, PNG and PDF formats, up to 50 MB.</div>
              </div>
              <button className="rounded-lg bg-[#FBFBFB] border border-[#DADADA] shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex mt-3 min-h-9 px-3 py-1.5 items-center gap-2 text-[#303030] tracking-[-0.32px] leading-[1.4] justify-center hover:bg-gray-100 transition-colors">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M14 10V12.6667C14 13.0203 13.8595 13.3594 13.6095 13.6095C13.3594 13.8595 13.0203 14 12.6667 14H3.33333C2.97971 14 2.64057 13.8595 2.39052 13.6095C2.14048 13.3594 2 13.0203 2 12.6667V10M11.3333 5.33333L8 2M8 2L4.66667 5.33333M8 2V10"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>Browse Files</span>
              </button>
            </div>
            <div className="flex min-h-[124px] mt-6 w-full" />
          </div>
        </div>

        {/* Bill Details Section */}
        <div className="flex flex-col flex-1 min-w-[240px] justify-between w-[410px]">
          <div className="flex max-w-full w-[511px] flex-col">
            {/* Bill Details Header */}
            <div className="flex w-full flex-col text-xl text-[#303030] font-semibold leading-[1.3]">
              <div>Bill Details</div>
              <div className="w-full h-px bg-gray-200 mt-5" />
            </div>

            {/* Form Fields */}
            <div className="flex mt-3 w-full flex-col">
              <div className="flex w-full flex-col">
                {/* Vendor and Invoice # Row */}
                <div className="flex w-full items-start gap-5 flex-wrap">
                  <div className="flex flex-col flex-1 min-w-[240px] basis-0">
                    <label className="text-[#303030] text-sm font-medium leading-[1.43]">
                      Vendor
                    </label>
                    <div className="rounded-lg bg-white border border-[#E5E5E5] flex mt-2 w-full px-3 py-2 items-center gap-2 overflow-hidden text-base text-[#A1A1A9] font-normal tracking-[-0.32px] leading-[1.4]">
                      <span className="flex-1">Select vendor...</span>
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M4 6L8 10L12 6"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="flex flex-col flex-1 min-w-[240px] basis-0">
                    <label className="text-[#303030] text-sm font-medium leading-[1.43]">
                      Invoice #
                    </label>
                    <input
                      type="text"
                      placeholder="INV-2024-001"
                      className="rounded-lg bg-white border border-[#E5E5E5] mt-2 w-full px-3 py-2 items-center gap-2 overflow-hidden text-base text-[#A1A1A9] font-normal whitespace-nowrap tracking-[-0.32px] leading-[1.4] focus:outline-none focus:border-[#3b82f6]"
                    />
                  </div>
                </div>

                {/* Invoice Date and Due Date Row */}
                <div className="flex mt-5 w-full items-start gap-5 flex-wrap">
                  <div className="flex flex-col flex-1 min-w-[240px] basis-0">
                    <label className="text-[#303030] text-sm font-medium leading-[1.43]">
                      Invoice Date
                    </label>
                    <div className="rounded-lg bg-white border border-[#E5E5E5] flex mt-2 w-full px-3 py-2 items-center gap-24 overflow-hidden text-base text-[#A1A1A9] font-normal whitespace-nowrap tracking-[-0.32px] leading-[1.4] justify-between">
                      <span>mm/dd/yyyy</span>
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M12.6667 2.66667H3.33333C2.59695 2.66667 2 3.26362 2 4V13.3333C2 14.0697 2.59695 14.6667 3.33333 14.6667H12.6667C13.403 14.6667 14 14.0697 14 13.3333V4C14 3.26362 13.403 2.66667 12.6667 2.66667Z"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M10.6667 1.33333V4"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M5.33333 1.33333V4"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M2 6.66667H14"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="flex flex-col flex-1 min-w-[240px] basis-0">
                    <label className="text-[#303030] text-sm font-medium leading-[1.43]">
                      Due Date
                    </label>
                    <div className="rounded-lg bg-white border border-[#E5E5E5] flex mt-2 w-full px-3 py-2 items-center gap-24 overflow-hidden text-base text-[#A1A1A9] font-normal whitespace-nowrap tracking-[-0.32px] leading-[1.4] justify-between">
                      <span>mm/dd/yyyy</span>
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M12.6667 2.66667H3.33333C2.59695 2.66667 2 3.26362 2 4V13.3333C2 14.0697 2.59695 14.6667 3.33333 14.6667H12.6667C13.403 14.6667 14 14.0697 14 13.3333V4C14 3.26362 13.403 2.66667 12.6667 2.66667Z"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M10.6667 1.33333V4"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M5.33333 1.33333V4"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M2 6.66667H14"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Memo/Notes */}
                <div className="flex mt-5 w-full flex-col">
                  <label className="text-[#303030] text-sm font-medium leading-[1.43]">
                    Memo/Notes
                  </label>
                  <textarea
                    placeholder="Additional notes..."
                    className="rounded-lg bg-white border border-[#E5E5E5] mt-2 min-h-[81px] w-full px-3 py-2 items-center gap-2 overflow-hidden text-base text-[#A1A1A9] font-normal tracking-[-0.32px] leading-[22px] resize-none focus:outline-none focus:border-[#3b82f6]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Line Items Section */}
          <div className="flex mt-[60px] w-full flex-col overflow-hidden">
            <div className="flex h-9 w-full items-start justify-between">
              <div className="flex flex-col min-w-[240px] text-xl text-[#303030] font-semibold leading-[1.3] w-[974px]">
                Line Items
                <div className="w-full h-px bg-gray-200 mt-5" />
              </div>
              <button className="rounded-lg bg-[#013764] shadow-[0_0_0_1px_rgba(0,45,90,1)] flex min-h-9 px-3 py-2 items-center gap-2 overflow-hidden text-base text-white font-medium hover:bg-[#002a4f] transition-colors">
                <span>Add Line Items</span>
              </button>
            </div>

            {/* Line Items Table */}
            <div className="rounded-xl shadow-[0_1px_2px_0_rgba(10,13,18,0.05)] flex mt-6 w-full flex-col overflow-hidden text-[13px] text-[#303030] font-normal tracking-[-0.26px] leading-[1.4]">
              <div className="border border-[#DADADA]/50 shadow-[0_1px_2px_0_rgba(10,13,18,0.05)] bg-white flex w-full max-w-[1130px] flex-col overflow-hidden">
                <div className="flex w-full items-center">
                  <div className="flex flex-wrap min-w-[240px] w-full items-center flex-1 basis-0">
                    {/* Property/Ledger Column */}
                    <div className="border-r border-[#DADADA] flex flex-col overflow-hidden w-[132px]">
                      <div className="border-b border-[#DADADA]/50 bg-[#FBFBFB] flex w-full gap-2 overflow-hidden text-[#525252] font-medium px-3 py-3 items-center">
                        <span>Property / Ledger</span>
                      </div>
                      <div className="border-b border-[#DADADA]/50 flex min-h-14 w-full gap-2.5 px-3 items-center">
                        <span>22 Indian Creek Dr</span>
                      </div>
                      <div className="border-b border-[#DADADA]/50 flex min-h-14 w-full gap-2.5 px-3 items-center">
                        <span>22 Indian Creek Dr</span>
                      </div>
                      <div className="border-b border-[#DADADA]/50 flex min-h-14 w-full gap-2.5 px-3 items-center">
                        <span>22 Indian Creek Dr</span>
                      </div>
                    </div>

                    {/* Unit Column */}
                    <div className="border-r border-[#DADADA] flex flex-col overflow-hidden whitespace-nowrap w-12">
                      <div className="border-b border-[#DADADA]/50 bg-[#FBFBFB] flex w-full gap-2 overflow-hidden text-[#525252] font-medium px-3 py-3 items-center">
                        <span>Unit</span>
                      </div>
                      <div className="border-b border-[#DADADA]/50 flex min-h-14 w-full gap-2.5 px-3 items-center">
                        <span>2</span>
                      </div>
                      <div className="border-b border-[#DADADA]/50 flex min-h-14 w-full gap-2.5 px-3 items-center">
                        <span>2</span>
                      </div>
                      <div className="border-b border-[#DADADA]/50 flex min-h-14 w-full gap-2.5 px-3 items-center">
                        <span>2</span>
                      </div>
                    </div>

                    {/* Work Order Column */}
                    <div className="border-r border-[#DADADA] flex flex-col overflow-hidden w-[130px]">
                      <div className="border-b border-[#DADADA]/50 bg-[#FBFBFB] flex w-full gap-2 overflow-hidden text-[#525252] font-medium px-3 py-3 items-center">
                        <span>Work Order</span>
                      </div>
                      <div className="border-b border-[#DADADA]/50 flex min-h-14 w-full gap-2.5 px-3 items-center justify-center whitespace-nowrap">
                        <div className="rounded-lg bg-[#FBFBFB] shadow-[0_1px_3px_rgba(0,0,0,0.03)] border border-[#DADADA] flex min-h-9 px-3 py-2 items-center gap-2">
                          <span>123456-1</span>
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 20 20"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M5 7.5L10 12.5L15 7.5"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                      </div>
                      <div className="border-b border-[#DADADA]/50 flex min-h-14 w-full gap-2.5 px-3 items-center justify-center whitespace-nowrap">
                        <div className="rounded-lg bg-[#FBFBFB] shadow-[0_1px_3px_rgba(0,0,0,0.03)] border border-[#DADADA] flex min-h-9 px-3 py-2 items-center gap-2">
                          <span>123456-1</span>
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 20 20"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M5 7.5L10 12.5L15 7.5"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                      </div>
                      <div className="border-b border-[#DADADA]/50 flex min-h-14 w-full gap-2.5 px-3 items-center justify-center whitespace-nowrap">
                        <div className="rounded-lg bg-[#FBFBFB] shadow-[0_1px_3px_rgba(0,0,0,0.03)] border border-[#DADADA] flex min-h-9 px-3 py-2 items-center gap-2">
                          <span>123456-1</span>
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 20 20"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M5 7.5L10 12.5L15 7.5"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Description Column */}
                    <div className="border-r border-[#DADADA] flex flex-col overflow-hidden w-[193px]">
                      <div className="border-b border-[#DADADA]/50 bg-[#FBFBFB] flex w-full gap-2 overflow-hidden text-[#525252] font-medium whitespace-nowrap px-3 py-3 items-center">
                        <span>Description</span>
                      </div>
                      <div className="border-b border-[#DADADA]/50 flex min-h-14 w-full gap-2.5 px-3 items-center">
                        <span className="flex-1">ConEd - 1,220 kWh</span>
                      </div>
                      <div className="border-b border-[#DADADA]/50 flex min-h-14 w-full gap-2.5 px-3 items-center">
                        <span className="flex-1">Unit 48 Thermostat</span>
                      </div>
                      <div className="border-b border-[#DADADA]/50 flex min-h-14 w-full gap-2.5 px-3 items-center">
                        <span className="flex-1">Tools for common area</span>
                      </div>
                    </div>

                    {/* GL Account Column */}
                    <div className="border-r border-[#DADADA] flex flex-col overflow-hidden w-[99px]">
                      <div className="border-b border-[#DADADA]/50 bg-[#FBFBFB] flex w-full gap-2 overflow-hidden text-[#525252] font-medium px-3 py-3 items-center">
                        <span>GL Account</span>
                      </div>
                      <div className="border-b border-[#DADADA]/50 flex min-h-14 w-full gap-2 whitespace-nowrap px-3 items-center">
                        <span>Utilities</span>
                      </div>
                      <div className="border-b border-[#DADADA]/50 flex min-h-14 w-full gap-2 whitespace-nowrap px-3 items-center">
                        <span>Maintenance</span>
                      </div>
                      <div className="border-b border-[#DADADA]/50 flex min-h-14 w-full gap-2 whitespace-nowrap px-3 items-center">
                        <span>Other</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex min-h-[266px] mt-[60px] w-full bg-white" />

          {/* Bill Total */}
          <div className="bg-[#FBFBFB] flex mt-[60px] w-full px-4 py-4 items-center gap-24 justify-between flex-wrap">
            <div className="flex flex-col text-xl text-[#303030] font-semibold leading-[1.3]">
              <div>Bill Total:</div>
            </div>
            <div className="flex flex-col items-center justify-center">
              <div className="flex items-start gap-4 text-sm text-[#6B7280] font-normal leading-[1.14]">
                <div>Total Up-Charge: $42.00</div>
              </div>
              <div className="text-[#303030] text-xl font-semibold leading-[1.3] mt-2">
                Total: $1,620.00
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex mt-5 w-full items-center gap-2.5 text-base justify-end flex-wrap">
        <button
          onClick={handleCancel}
          className="rounded-lg flex min-h-9 px-3 py-1.5 items-center gap-2 text-[#303030] font-normal whitespace-nowrap tracking-[-0.32px] leading-[1.4] hover:bg-gray-100 transition-colors"
        >
          <span>Cancel</span>
        </button>
        <button
          onClick={handleRecordBill}
          className="rounded-lg bg-[#013764] shadow-[0_0_0_1px_rgba(0,45,90,1)] flex min-h-9 px-3 py-2 items-center gap-2 overflow-hidden text-white font-medium hover:bg-[#002a4f] transition-colors"
        >
          <span>Record Bill</span>
        </button>
      </div>
    </div>
  );
};
