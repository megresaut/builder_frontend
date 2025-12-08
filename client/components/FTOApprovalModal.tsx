import { useState } from "react";
import { createPortal } from "react-dom";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

interface FTOApprovalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function FTOApprovalModal({
  open,
  onOpenChange,
}: FTOApprovalModalProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[min(1600px,95vw)] p-8 gap-0 max-h-[90vh] overflow-y-auto">
        <DialogTitle className="text-[#303030] font-semibold text-2xl leading-[1.25] mb-4">
          Field Team Order Approval
        </DialogTitle>

        {/* Property and Unit Selects */}
        <div className="flex gap-5 flex-wrap mb-4">
          <div className="flex-1 min-w-[240px] flex flex-col gap-2">
            <label className="text-[#303030] font-medium text-sm leading-[1.43]">
              Property
            </label>
            <Select defaultValue="3-hekma-road">
              <SelectTrigger className="h-[38px] rounded-lg border-[#e5e5e5] bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3-hekma-road">3 hekma Road</SelectItem>
                <SelectItem value="property2">Property 2</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 min-w-[240px] flex flex-col gap-2">
            <label className="text-[#303030] font-medium text-sm leading-[1.43]">
              Unit
            </label>
            <Select defaultValue="2">
              <SelectTrigger className="h-[38px] rounded-lg border-[#e5e5e5] bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2</SelectItem>
                <SelectItem value="3">3</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Hours Section */}
        <div className="mb-4">
          <div className="rounded-xl border border-[#e5e5e5] shadow-sm overflow-hidden">
            {/* Hours Header */}
            <div className="bg-white px-4 py-4 flex items-center justify-between gap-5 flex-wrap">
              <h3 className="text-[#303030] font-semibold text-xl leading-[1.3]">
                Hours
              </h3>
              <button className="flex items-center gap-2 px-3 py-2 min-h-[36px] rounded-lg bg-[#013764] shadow-[0_0_0_1px_#002d5a] hover:bg-[#014777] transition-colors">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M10 4.16667V15.8333M4.16667 10H15.8333"
                    stroke="white"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="text-white font-medium text-base">Add Hours</span>
              </button>
            </div>

            {/* Hours Table */}
            <div className="border-t border-[#dadada] overflow-x-auto">
              <div className="inline-flex min-w-full">
                {/* Task Column */}
                <div className="flex flex-col border-r border-[#dadada] min-w-[121px]" style={{ height: "auto", flexGrow: "0" }}>
                  <div className="bg-[#fbfbfb] px-3 py-3 border-b border-[#dadada]">
                    <span className="text-[#525252] font-medium text-base tracking-[-0.32px] leading-[1.4]">
                      Task
                    </span>
                  </div>
                  <div className="min-h-[56px] px-3 border-b border-[#dadada]"></div>
                  <div className="min-h-[56px] px-3 border-b border-[#dadada]"></div>
                  <div className="min-h-[56px] px-3 py-3 border-b border-[#dadada] flex items-center">
                    <span className="text-[#303030] font-normal text-base tracking-[-0.32px] leading-[1.4]">
                      Task #1
                    </span>
                  </div>
                </div>

                {/* Date Column */}
                <div className="flex flex-col border-r border-[#dadada] min-w-[118px]">
                  <div className="bg-[#fbfbfb] px-3 py-3 border-b border-[#dadada]">
                    <span className="text-[#525252] font-medium text-base tracking-[-0.32px] leading-[1.4]">
                      Date
                    </span>
                  </div>
                  <div className="min-h-[56px] px-3 py-3 border-b border-[#dadada] flex items-center">
                    <span className="text-[#303030] font-normal text-base tracking-[-0.32px] leading-[1.4]">
                      Oct 2, 2025
                    </span>
                  </div>
                  <div className="min-h-[56px] px-3 py-3 border-b border-[#dadada] flex items-center">
                    <span className="text-[#303030] font-normal text-base tracking-[-0.32px] leading-[1.4]">
                      Oct 2, 2025
                    </span>
                  </div>
                  <div className="min-h-[56px] px-3 py-3 border-b border-[#dadada] flex items-center">
                    <span className="text-[#303030] font-normal text-base tracking-[-0.32px] leading-[1.4]">
                      Oct 2, 2025
                    </span>
                  </div>
                </div>

                {/* Hours Column */}
                <div className="flex flex-col border-r border-[#dadada] min-w-[76px]">
                  <div className="bg-[#fbfbfb] px-3 py-3 border-b border-[#dadada]">
                    <span className="text-[#525252] font-medium text-base tracking-[-0.32px] leading-[1.4]">
                      Hours
                    </span>
                  </div>
                  <div className="min-h-[56px] px-3 py-3 border-b border-[#dadada] flex items-center">
                    <span className="text-[#303030] font-normal text-base tracking-[-0.32px] leading-[1.4]">
                      2
                    </span>
                  </div>
                  <div className="min-h-[56px] px-3 py-3 border-b border-[#dadada] flex items-center">
                    <span className="text-[#303030] font-normal text-base tracking-[-0.32px] leading-[1.4]">
                      1
                    </span>
                  </div>
                  <div className="min-h-[56px] px-3 py-3 border-b border-[#dadada] flex items-center">
                    <span className="text-[#303030] font-normal text-base tracking-[-0.32px] leading-[1.4]">
                      2
                    </span>
                  </div>
                </div>

                {/* Note Column */}
                <div className="flex flex-col border-r border-[#dadada] min-w-[194px] flex-1">
                  <div className="bg-[#fbfbfb] px-3 py-3 border-b border-[#dadada]">
                    <span className="text-[#525252] font-medium text-base tracking-[-0.32px] leading-[1.4]">
                      Note
                    </span>
                  </div>
                  <div className="min-h-[56px] px-3 py-3 border-b border-[#dadada] flex items-center">
                    <span className="text-[#303030] font-normal text-base tracking-[-0.32px] leading-[1.4]">
                      ConEd - 1,220 kWh
                    </span>
                  </div>
                  <div className="min-h-[56px] px-3 py-3 border-b border-[#dadada] flex items-center">
                    <span className="text-[#303030] font-normal text-base tracking-[-0.32px] leading-[1.4]">
                      Unit 48 Thermostat
                    </span>
                  </div>
                  <div className="min-h-[56px] px-3 py-3 border-b border-[#dadada] flex items-center">
                    <span className="text-[#303030] font-normal text-base tracking-[-0.32px] leading-[1.4]">
                      Tools for common area
                    </span>
                  </div>
                </div>

                {/* No Fee Column */}
                <div className="flex flex-col border-r border-[#dadada] min-w-[80px]">
                  <div className="bg-[#fbfbfb] px-3 py-3 border-b border-[#dadada]">
                    <span className="text-[#525252] font-medium text-base tracking-[-0.32px] leading-[1.4]">
                      NoFee?
                    </span>
                  </div>
                  <div className="min-h-[56px] px-3 border-b border-[#dadada] flex items-center justify-center">
                    <Checkbox className="w-[14px] h-[14px]" />
                  </div>
                  <div className="min-h-[56px] px-3 border-b border-[#dadada] flex items-center justify-center">
                    <Checkbox className="w-[14px] h-[14px]" />
                  </div>
                  <div className="min-h-[56px] px-3 border-b border-[#dadada] flex items-center justify-center">
                    <Checkbox className="w-[14px] h-[14px]" />
                  </div>
                </div>

                {/* Emergency Column */}
                <div className="flex flex-col border-r border-[#dadada] min-w-[105px]">
                  <div className="bg-[#fbfbfb] px-3 py-3 border-b border-[#dadada]">
                    <span className="text-[#525252] font-medium text-base tracking-[-0.32px] leading-[1.4]">
                      Emergency
                    </span>
                  </div>
                  <div className="min-h-[56px] px-3 border-b border-[#dadada] flex items-center justify-center">
                    <Checkbox className="w-[14px] h-[14px]" />
                  </div>
                  <div className="min-h-[56px] px-3 border-b border-[#dadada] flex items-center justify-center">
                    <Checkbox className="w-[14px] h-[14px]" />
                  </div>
                  <div className="min-h-[56px] px-3 border-b border-[#dadada] flex items-center justify-center">
                    <Checkbox className="w-[14px] h-[14px]" />
                  </div>
                </div>

                {/* Amount Column */}
                <div className="flex flex-col border-r border-[#dadada] min-w-[88px]">
                  <div className="bg-[#fbfbfb] px-3 py-3 border-b border-[#dadada]">
                    <span className="text-[#525252] font-medium text-base tracking-[-0.32px] leading-[1.4]">
                      Amount
                    </span>
                  </div>
                  <div className="min-h-[56px] px-3 py-3 border-b border-[#dadada] flex items-center justify-center">
                    <span className="text-[#303030] font-normal text-base tracking-[-0.32px] leading-[1.4]">
                      $420
                    </span>
                  </div>
                  <div className="min-h-[56px] px-3 py-3 border-b border-[#dadada] flex items-center justify-center">
                    <span className="text-[#303030] font-normal text-base tracking-[-0.32px] leading-[1.4]">
                      $440
                    </span>
                  </div>
                  <div className="min-h-[56px] px-3 py-3 border-b border-[#dadada] flex items-center justify-center">
                    <span className="text-[#303030] font-normal text-base tracking-[-0.32px] leading-[1.4]">
                      $440
                    </span>
                  </div>
                </div>

                {/* Upcharge Column */}
                <div className="flex flex-col border-r border-[#dadada] min-w-[96px]">
                  <div className="bg-[#fbfbfb] px-3 py-3 border-b border-[#dadada]">
                    <span className="text-[#525252] font-medium text-base tracking-[-0.32px] leading-[1.4]">
                      Upcharge
                    </span>
                  </div>
                  <div className="min-h-[56px] px-3 py-3 border-b border-[#dadada] flex items-center justify-center">
                    <span className="text-[#303030] font-normal text-base tracking-[-0.32px] leading-[1.4]">
                      $20
                    </span>
                  </div>
                  <div className="min-h-[56px] px-3 border-b border-[#dadada]"></div>
                  <div className="min-h-[56px] px-3 border-b border-[#dadada]"></div>
                </div>

                {/* Total Column */}
                <div className="flex flex-col border-r border-[#dadada] min-w-[78px]">
                  <div className="bg-[#fbfbfb] px-3 py-3 border-b border-[#dadada]">
                    <span className="text-[#525252] font-medium text-base tracking-[-0.32px] leading-[1.4]">
                      Total
                    </span>
                  </div>
                  <div className="min-h-[56px] px-3 py-3 border-b border-[#dadada] flex items-center justify-center">
                    <span className="text-[#303030] font-normal text-base tracking-[-0.32px] leading-[1.4]">
                      $440
                    </span>
                  </div>
                  <div className="min-h-[56px] px-3 py-3 border-b border-[#dadada] flex items-center justify-center">
                    <span className="text-[#303030] font-normal text-base tracking-[-0.32px] leading-[1.4]">
                      $440
                    </span>
                  </div>
                  <div className="min-h-[56px] px-3 py-3 border-b border-[#dadada] flex items-center justify-center">
                    <span className="text-[#303030] font-normal text-base tracking-[-0.32px] leading-[1.4]">
                      $440
                    </span>
                  </div>
                </div>

                {/* Actions Column */}
                <div className="flex flex-col min-w-[78px]">
                  <div className="bg-[#fbfbfb] px-3 py-3 border-b border-[#dadada]">
                    <span className="text-[#525252] font-medium text-base tracking-[-0.32px] leading-[1.4]">
                      Actions
                    </span>
                  </div>
                  <div className="min-h-[56px] px-3 border-b border-[#dadada] flex items-center justify-center relative z-10">
                    <button
                      onClick={() => setOpenMenuId(openMenuId === "hours-1" ? null : "hours-1")}
                      className="w-7 h-7 rounded-md border border-[#dadada] bg-[#fbfbfb] shadow-sm flex items-center justify-center hover:bg-gray-100 transition-colors">
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
                    {openMenuId === "hours-1" &&
                      createPortal(
                        <div className="bg-white border border-[#dadada] rounded-md shadow-md z-[9999] whitespace-nowrap" style={{ position: "fixed", top: "auto", left: 0, pointerEvents: "auto" }}>
                          <button className="px-3 py-2 text-sm text-[#303030] hover:bg-gray-50 transition-colors flex items-center justify-between gap-3 w-full">
                            <span>Delete</span>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6h16zM10 11v6M14 11v6"/>
                            </svg>
                          </button>
                        </div>,
                        document.body
                      )}
                  </div>
                  <div className="min-h-[56px] px-3 border-b border-[#dadada] flex items-center justify-center relative z-10">
                    <button
                      onClick={() => setOpenMenuId(openMenuId === "hours-2" ? null : "hours-2")}
                      className="w-7 h-7 rounded-md border border-[#dadada] bg-[#fbfbfb] shadow-sm flex items-center justify-center hover:bg-gray-100 transition-colors">
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
                    {openMenuId === "hours-2" &&
                      createPortal(
                        <div className="bg-white border border-[#dadada] rounded-md shadow-md z-[9999] whitespace-nowrap" style={{ position: "fixed", top: "auto", left: 0, pointerEvents: "auto" }}>
                          <button className="px-3 py-2 text-sm text-[#303030] hover:bg-gray-50 transition-colors flex items-center justify-between gap-3 w-full">
                            <span>Delete</span>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6h16zM10 11v6M14 11v6"/>
                            </svg>
                          </button>
                        </div>,
                        document.body
                      )}
                  </div>
                  <div className="min-h-[56px] px-3 border-b border-[#dadada] flex items-center justify-center relative z-10">
                    <button
                      onClick={() => setOpenMenuId(openMenuId === "hours-3" ? null : "hours-3")}
                      className="w-7 h-7 rounded-md border border-[#dadada] bg-[#fbfbfb] shadow-sm flex items-center justify-center hover:bg-gray-100 transition-colors">
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
                    {openMenuId === "hours-3" &&
                      createPortal(
                        <div className="bg-white border border-[#dadada] rounded-md shadow-md z-[9999] whitespace-nowrap" style={{ position: "fixed", top: "auto", left: 0, pointerEvents: "auto" }}>
                          <button className="px-3 py-2 text-sm text-[#303030] hover:bg-gray-50 transition-colors flex items-center justify-between gap-3 w-full">
                            <span>Delete</span>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6h16zM10 11v6M14 11v6"/>
                            </svg>
                          </button>
                        </div>,
                        document.body
                      )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Expenses Section */}
        <div className="mb-4">
          <div className="rounded-xl border border-[#e5e5e5] shadow-sm overflow-hidden">
            {/* Expenses Header */}
            <div className="bg-white px-4 py-4 flex items-center justify-between gap-5 flex-wrap">
              <h3 className="text-[#303030] font-semibold text-xl leading-[1.3]">
                Expenses
              </h3>
              <button className="flex items-center gap-2 px-3 py-2 min-h-[36px] rounded-lg bg-[#013764] shadow-[0_0_0_1px_#002d5a] hover:bg-[#014777] transition-colors">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M10 4.16667V15.8333M4.16667 10H15.8333"
                    stroke="white"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="text-white font-medium text-base">Add Expenses</span>
              </button>
            </div>

            {/* Expenses Table */}
            <div className="border-t border-[#dadada] overflow-x-auto">
              <div className="inline-flex min-w-full">
                {/* Task Column */}
                <div className="flex flex-col border-r border-[#dadada] min-w-[112px]">
                  <div className="bg-[#fbfbfb] px-3 py-3 border-b border-[#dadada]">
                    <span className="text-[#525252] font-medium text-base tracking-[-0.32px] leading-[1.4]">
                      Task
                    </span>
                  </div>
                  <div className="min-h-[56px] px-3 border-b border-[#dadada]"></div>
                  <div className="min-h-[56px] px-3 border-b border-[#dadada]"></div>
                  <div className="min-h-[56px] px-3 py-3 border-b border-[#dadada] flex items-center">
                    <span className="text-[#303030] font-normal text-base tracking-[-0.32px] leading-[1.4]">
                      Task #1
                    </span>
                  </div>
                </div>

                {/* Date Column */}
                <div className="flex flex-col border-r border-[#dadada] min-w-[97px]">
                  <div className="bg-[#fbfbfb] px-3 py-3 border-b border-[#dadada]">
                    <span className="text-[#525252] font-medium text-base tracking-[-0.32px] leading-[1.4]">
                      Date
                    </span>
                  </div>
                  <div className="min-h-[56px] px-3 py-3 border-b border-[#dadada] flex items-center">
                    <span className="text-[#303030] font-normal text-base tracking-[-0.32px] leading-[1.4]">
                      Oct 2, 2025
                    </span>
                  </div>
                  <div className="min-h-[56px] px-3 py-3 border-b border-[#dadada] flex items-center">
                    <span className="text-[#303030] font-normal text-base tracking-[-0.32px] leading-[1.4]">
                      Oct 2, 2025
                    </span>
                  </div>
                  <div className="min-h-[56px] px-3 py-3 border-b border-[#dadada] flex items-center">
                    <span className="text-[#303030] font-normal text-base tracking-[-0.32px] leading-[1.4]">
                      Oct 2, 2025
                    </span>
                  </div>
                </div>

                {/* Expense Category Column */}
                <div className="flex flex-col border-r border-[#dadada] min-w-[113px]">
                  <div className="bg-[#fbfbfb] px-3 py-3 border-b border-[#dadada]">
                    <span className="text-[#525252] font-medium text-base tracking-[-0.32px] leading-[1.4]">
                      Expense Category
                    </span>
                  </div>
                  <div className="min-h-[56px] px-3 py-3 border-b border-[#dadada] flex items-center">
                    <span className="text-[#303030] font-normal text-base tracking-[-0.32px] leading-[1.4]">
                      Materials
                    </span>
                  </div>
                  <div className="min-h-[56px] px-3 py-3 border-b border-[#dadada] flex items-center">
                    <span className="text-[#303030] font-normal text-base tracking-[-0.32px] leading-[1.4]">
                      Materials
                    </span>
                  </div>
                  <div className="min-h-[56px] px-3 py-3 border-b border-[#dadada] flex items-center">
                    <span className="text-[#303030] font-normal text-base tracking-[-0.32px] leading-[1.4]">
                      Materials
                    </span>
                  </div>
                </div>

                {/* Receipt Note Column */}
                <div className="flex flex-col border-r border-[#dadada] min-w-[177px] flex-1">
                  <div className="bg-[#fbfbfb] px-3 py-3 border-b border-[#dadada]">
                    <span className="text-[#525252] font-medium text-base tracking-[-0.32px] leading-[1.4]">
                      Receipt Note
                    </span>
                  </div>
                  <div className="min-h-[56px] px-3 py-3 border-b border-[#dadada] flex items-center">
                    <span className="text-[#2463eb] font-normal text-base tracking-[-0.32px] leading-[1.4] underline">
                      ConEd - 1,220 kWh
                    </span>
                  </div>
                  <div className="min-h-[56px] px-3 py-3 border-b border-[#dadada] flex items-center">
                    <span className="text-[#2463eb] font-normal text-base tracking-[-0.32px] leading-[1.4] underline">
                      Unit 48 Thermostat
                    </span>
                  </div>
                  <div className="min-h-[56px] px-3 py-3 border-b border-[#dadada] flex items-center">
                    <span className="text-[#2463eb] font-normal text-base tracking-[-0.32px] leading-[1.4] underline">
                      Tools for common area
                    </span>
                  </div>
                </div>

                {/* AVM Expense Column */}
                <div className="flex flex-col border-r border-[#dadada] min-w-[114px]">
                  <div className="bg-[#fbfbfb] px-3 py-3 border-b border-[#dadada]">
                    <span className="text-[#525252] font-medium text-base tracking-[-0.32px] leading-[1.4]">
                      AVM Expense?
                    </span>
                  </div>
                  <div className="min-h-[56px] px-3 border-b border-[#dadada] flex items-center justify-center">
                    <Checkbox className="w-[14px] h-[14px]" />
                  </div>
                  <div className="min-h-[56px] px-3 border-b border-[#dadada] flex items-center justify-center">
                    <Checkbox className="w-[14px] h-[14px]" />
                  </div>
                  <div className="min-h-[56px] px-3 border-b border-[#dadada] flex items-center justify-center">
                    <Checkbox className="w-[14px] h-[14px]" />
                  </div>
                </div>

                {/* Amount Column */}
                <div className="flex flex-col border-r border-[#dadada] min-w-[85px]">
                  <div className="bg-[#fbfbfb] px-3 py-3 border-b border-[#dadada]">
                    <span className="text-[#525252] font-medium text-base tracking-[-0.32px] leading-[1.4]">
                      Amount
                    </span>
                  </div>
                  <div className="min-h-[56px] px-3 py-3 border-b border-[#dadada] flex items-center justify-center">
                    <span className="text-[#303030] font-normal text-base tracking-[-0.32px] leading-[1.4]">
                      $420
                    </span>
                  </div>
                  <div className="min-h-[56px] px-3 py-3 border-b border-[#dadada] flex items-center justify-center">
                    <span className="text-[#303030] font-normal text-base tracking-[-0.32px] leading-[1.4]">
                      $440
                    </span>
                  </div>
                  <div className="min-h-[56px] px-3 py-3 border-b border-[#dadada] flex items-center justify-center">
                    <span className="text-[#303030] font-normal text-base tracking-[-0.32px] leading-[1.4]">
                      $440
                    </span>
                  </div>
                </div>

                {/* Upcharge Column */}
                <div className="flex flex-col border-r border-[#dadada] min-w-[80px]">
                  <div className="bg-[#fbfbfb] px-3 py-3 border-b border-[#dadada]">
                    <span className="text-[#525252] font-medium text-base tracking-[-0.32px] leading-[1.4]">
                      Upcharge
                    </span>
                  </div>
                  <div className="min-h-[56px] px-3 py-3 border-b border-[#dadada] flex items-center justify-center">
                    <span className="text-[#303030] font-normal text-base tracking-[-0.32px] leading-[1.4]">
                      $20
                    </span>
                  </div>
                  <div className="min-h-[56px] px-3 border-b border-[#dadada]"></div>
                  <div className="min-h-[56px] px-3 border-b border-[#dadada]"></div>
                </div>

                {/* Total Column */}
                <div className="flex flex-col border-r border-[#dadada] min-w-[56px]">
                  <div className="bg-[#fbfbfb] px-3 py-3 border-b border-[#dadada]">
                    <span className="text-[#525252] font-medium text-base tracking-[-0.32px] leading-[1.4]">
                      Total
                    </span>
                  </div>
                  <div className="min-h-[56px] px-3 py-3 border-b border-[#dadada] flex items-center justify-center">
                    <span className="text-[#303030] font-normal text-base tracking-[-0.32px] leading-[1.4]">
                      $440
                    </span>
                  </div>
                  <div className="min-h-[56px] px-3 py-3 border-b border-[#dadada] flex items-center justify-center">
                    <span className="text-[#303030] font-normal text-base tracking-[-0.32px] leading-[1.4]">
                      $440
                    </span>
                  </div>
                  <div className="min-h-[56px] px-3 py-3 border-b border-[#dadada] flex items-center justify-center">
                    <span className="text-[#303030] font-normal text-base tracking-[-0.32px] leading-[1.4]">
                      $440
                    </span>
                  </div>
                </div>

                {/* Actions Column */}
                <div className="flex flex-col min-w-[64px]">
                  <div className="bg-[#fbfbfb] px-3 py-3 border-b border-[#dadada]">
                    <span className="text-[#525252] font-medium text-base tracking-[-0.32px] leading-[1.4]">
                      Actions
                    </span>
                  </div>
                  <div className="min-h-[56px] px-3 border-b border-[#dadada] flex items-center justify-center relative z-10">
                    <button
                      onClick={() => setOpenMenuId(openMenuId === "expenses-1" ? null : "expenses-1")}
                      className="w-7 h-7 rounded-md border border-[#dadada] bg-[#fbfbfb] shadow-sm flex items-center justify-center hover:bg-gray-100 transition-colors">
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
                    {openMenuId === "expenses-1" &&
                      createPortal(
                        <div className="bg-white border border-[#dadada] rounded-md shadow-md z-[9999] whitespace-nowrap" style={{ position: "fixed", top: "auto", left: 0, pointerEvents: "auto" }}>
                          <button className="px-3 py-2 text-sm text-[#303030] hover:bg-gray-50 transition-colors flex items-center justify-between gap-3 w-full">
                            <span>Delete</span>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6h16zM10 11v6M14 11v6"/>
                            </svg>
                          </button>
                        </div>,
                        document.body
                      )}
                  </div>
                  <div className="min-h-[56px] px-3 border-b border-[#dadada] flex items-center justify-center relative z-10">
                    <button
                      onClick={() => setOpenMenuId(openMenuId === "expenses-2" ? null : "expenses-2")}
                      className="w-7 h-7 rounded-md border border-[#dadada] bg-[#fbfbfb] shadow-sm flex items-center justify-center hover:bg-gray-100 transition-colors">
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
                    {openMenuId === "expenses-2" &&
                      createPortal(
                        <div className="bg-white border border-[#dadada] rounded-md shadow-md z-[9999] whitespace-nowrap" style={{ position: "fixed", top: "auto", left: 0, pointerEvents: "auto" }}>
                          <button className="px-3 py-2 text-sm text-[#303030] hover:bg-gray-50 transition-colors flex items-center justify-between gap-3 w-full">
                            <span>Delete</span>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6h16zM10 11v6M14 11v6"/>
                            </svg>
                          </button>
                        </div>,
                        document.body
                      )}
                  </div>
                  <div className="min-h-[56px] px-3 border-b border-[#dadada] flex items-center justify-center relative z-10">
                    <button
                      onClick={() => setOpenMenuId(openMenuId === "expenses-3" ? null : "expenses-3")}
                      className="w-7 h-7 rounded-md border border-[#dadada] bg-[#fbfbfb] shadow-sm flex items-center justify-center hover:bg-gray-100 transition-colors">
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
                    {openMenuId === "expenses-3" &&
                      createPortal(
                        <div className="bg-white border border-[#dadada] rounded-md shadow-md z-[9999] whitespace-nowrap" style={{ position: "fixed", top: "auto", left: 0, pointerEvents: "auto" }}>
                          <button className="px-3 py-2 text-sm text-[#303030] hover:bg-gray-50 transition-colors flex items-center justify-between gap-3 w-full">
                            <span>Delete</span>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6h16zM10 11v6M14 11v6"/>
                            </svg>
                          </button>
                        </div>,
                        document.body
                      )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bill Total */}
        <div className="bg-[#fbfbfb] px-4 py-4 flex items-center justify-between mb-4 rounded">
          <span className="text-[#303030] font-semibold text-xl leading-[1.3]">
            Bill Total:
          </span>
          <span className="text-[#303030] font-semibold text-xl leading-[1.3]">
            $1,620.00
          </span>
        </div>

        {/* Approve Button */}
        <button className="w-full flex items-center justify-center gap-2 px-4 py-2 min-h-[36px] rounded-lg bg-[#013764] shadow-[0_0_0_1px_#002d5a] hover:bg-[#014777] transition-colors">
          <span className="text-white font-medium text-base">
            Approve Field Team Order
          </span>
        </button>
      </DialogContent>
    </Dialog>
  );
}
