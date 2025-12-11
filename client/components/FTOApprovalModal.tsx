import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Trash2 } from "lucide-react";

interface FTOApprovalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedFTOId?: number | null;
}

export default function FTOApprovalModal({
  open,
  onOpenChange,
  selectedFTOId,
}: FTOApprovalModalProps) {

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[min(1600px,95vw)] p-8 gap-0 max-h-[90vh] overflow-y-auto">
        <DialogTitle className="text-[#303030] font-semibold text-2xl leading-[1.25] mb-4">
          Field Team Order Approval
        </DialogTitle>

        {/* Property, Unit, Field Team Assignee, and Associated Task Selects */}
        <div className="flex gap-5 flex-row mb-4">
          <div className="flex-1 min-w-[240px] flex flex-col gap-2">
            <label className="text-[#303030] font-medium text-sm leading-[1.43]">
              Property
            </label>
            <Select defaultValue="3-hekma-road" disabled>
              <SelectTrigger className="h-[38px] rounded-lg border-[#e5e5e5] bg-white opacity-50 cursor-not-allowed">
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
            <Select defaultValue="2" disabled>
              <SelectTrigger className="h-[38px] rounded-lg border-[#e5e5e5] bg-white opacity-50 cursor-not-allowed">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2</SelectItem>
                <SelectItem value="3">3</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 min-w-[240px] flex flex-col gap-2">
            <label className="text-[#303030] font-medium text-sm leading-[1.43]">
              Field Team Assignee
            </label>
            <Select defaultValue="john-smith" disabled>
              <SelectTrigger className="h-[38px] rounded-lg border-[#e5e5e5] bg-white opacity-50 cursor-not-allowed">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="john-smith">John Smith</SelectItem>
                <SelectItem value="jane-doe">Jane Doe</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 min-w-[240px] flex flex-col gap-2">
            <label className="text-[#303030] font-medium text-sm leading-[1.43]">
              Associated Task
            </label>
            <Select defaultValue="12311" disabled>
              <SelectTrigger className="h-[38px] rounded-lg border-[#e5e5e5] bg-white opacity-50 cursor-not-allowed">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="12311">12311</SelectItem>
                <SelectItem value="12312">12312</SelectItem>
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
                <span className="text-white font-medium text-base">
                  Add Hours
                </span>
              </button>
            </div>

            {/* Hours Table */}
            <div className="border-t border-[#dadada] overflow-x-auto">
              <div className="inline-flex min-w-full">
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
                  <div className="min-h-[56px] px-3 border-b border-[#dadada] flex items-center justify-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="w-7 h-7 rounded-md border border-[#dadada] bg-[#fbfbfb] shadow-sm flex items-center justify-center hover:bg-gray-100 transition-colors">
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
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="text-red-600 cursor-pointer">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="min-h-[56px] px-3 border-b border-[#dadada] flex items-center justify-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="w-7 h-7 rounded-md border border-[#dadada] bg-[#fbfbfb] shadow-sm flex items-center justify-center hover:bg-gray-100 transition-colors">
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
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="text-red-600 cursor-pointer">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="min-h-[56px] px-3 border-b border-[#dadada] flex items-center justify-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="w-7 h-7 rounded-md border border-[#dadada] bg-[#fbfbfb] shadow-sm flex items-center justify-center hover:bg-gray-100 transition-colors">
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
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="text-red-600 cursor-pointer">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
                <span className="text-white font-medium text-base">
                  Add Expenses
                </span>
              </button>
            </div>

            {/* Expenses Table */}
            <div className="border-t border-[#dadada] overflow-x-auto">
              <div className="inline-flex min-w-full">
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

                {/* Vendor Column (previously Expense Category) */}
                <div className="flex flex-col border-r border-[#dadada] min-w-[113px]">
                  <div className="bg-[#fbfbfb] px-3 py-3 border-b border-[#dadada]">
                    <span className="text-[#525252] font-medium text-base tracking-[-0.32px] leading-[1.4]">
                      Vendor
                    </span>
                  </div>
                  <div className="min-h-[56px] px-3 py-3 border-b border-[#dadada] flex items-center">
                    <span className="text-[#303030] font-normal text-base tracking-[-0.32px] leading-[1.4]">
                      Dolce
                    </span>
                  </div>
                  <div className="min-h-[56px] px-3 py-3 border-b border-[#dadada] flex items-center">
                    <span className="text-[#303030] font-normal text-base tracking-[-0.32px] leading-[1.4]">
                      N/A
                    </span>
                  </div>
                  <div className="min-h-[56px] px-3 py-3 border-b border-[#dadada] flex items-center">
                    <span className="text-[#303030] font-normal text-base tracking-[-0.32px] leading-[1.4]">
                      Dolce
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
                  <div className="min-h-[56px] px-3 border-b border-[#dadada] flex items-center justify-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="w-7 h-7 rounded-md border border-[#dadada] bg-[#fbfbfb] shadow-sm flex items-center justify-center hover:bg-gray-100 transition-colors">
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
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="text-red-600 cursor-pointer">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="min-h-[56px] px-3 border-b border-[#dadada] flex items-center justify-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="w-7 h-7 rounded-md border border-[#dadada] bg-[#fbfbfb] shadow-sm flex items-center justify-center hover:bg-gray-100 transition-colors">
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
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="text-red-600 cursor-pointer">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="min-h-[56px] px-3 border-b border-[#dadada] flex items-center justify-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="w-7 h-7 rounded-md border border-[#dadada] bg-[#fbfbfb] shadow-sm flex items-center justify-center hover:bg-gray-100 transition-colors">
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
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="text-red-600 cursor-pointer">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FTO Total */}
        <div className="bg-[#fbfbfb] px-4 py-4 flex items-center justify-between mb-4 rounded">
          <span className="text-[#303030] font-semibold text-xl leading-[1.3]">
            FTO Total:
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
