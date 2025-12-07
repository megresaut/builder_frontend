import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface RecordBillModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface LineItem {
  id: number;
  property: string;
  unit: string;
  workOrder: string;
  description: string;
  glAccount: string;
  reimbursement: boolean;
  subtotal: number;
  upcharge: number;
  total: number;
}

export default function RecordBillModal({
  open,
  onOpenChange,
}: RecordBillModalProps) {
  const [lineItems, setLineItems] = useState<LineItem[]>([
    {
      id: 1,
      property: "22 Indian Creek Dr",
      unit: "2",
      workOrder: "123456-1",
      description: "ConEd - 1,220 kWh",
      glAccount: "Utilities",
      reimbursement: false,
      subtotal: 420,
      upcharge: 10,
      total: 462,
    },
    {
      id: 2,
      property: "22 Indian Creek Dr",
      unit: "2",
      workOrder: "123456-1",
      description: "Unit 48 Thermostat",
      glAccount: "Maintenance",
      reimbursement: false,
      subtotal: 380,
      upcharge: 0,
      total: 380,
    },
    {
      id: 3,
      property: "22 Indian Creek Dr",
      unit: "2",
      workOrder: "123456-1",
      description: "Tools for common area",
      glAccount: "Other",
      reimbursement: false,
      subtotal: 120,
      upcharge: 0,
      total: 120,
    },
  ]);

  const totalUpcharge = lineItems.reduce(
    (sum, item) => sum + (item.subtotal * item.upcharge) / 100,
    0
  );
  const grandTotal = lineItems.reduce((sum, item) => sum + item.total, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] md:max-w-[90vw] lg:max-w-[1400px] max-h-[95vh] flex flex-col p-0">
        {/* Fixed Header */}
        <div className="flex-shrink-0 flex flex-col gap-4 px-6 md:px-8 pt-6 md:pt-8 pb-4">
          <div className="flex justify-between items-start">
            <div className="flex flex-col gap-2">
              <DialogTitle className="text-[#303030] font-semibold text-2xl leading-[26px]">
                Record Bill
              </DialogTitle>
              <DialogDescription className="text-[#6B7280] text-sm leading-4">
                Record a new bill to automatically upload to Buildium
              </DialogDescription>
            </div>
          </div>
          <div className="h-px bg-[#E5E5E5]" />
        </div>

        {/* Scrollable Middle Section */}
        <div className="flex-1 overflow-hidden flex">
          {/* Fixed Left Section - Invoice Document */}
          <div className="flex-shrink-0 w-full lg:w-[400px] xl:w-[500px] border-r border-[#E5E5E5] flex flex-col gap-2 px-6 md:px-8 py-6 overflow-y-auto">
            <h3 className="text-[#303030] font-semibold text-xl leading-[26px]">
              Invoice Document
            </h3>
            <div className="flex flex-col justify-center items-center gap-6 flex-1 min-h-[350px] rounded-lg border border-dashed border-[rgba(18,18,18,0.4)] p-8">
              <div className="flex flex-col items-center gap-3">
                <div className="flex flex-col justify-center items-center gap-2">
                  <p className="text-[#09090B] text-base">
                    Choose a file or drag & drop it here
                  </p>
                  <p className="text-[#09090B] text-base opacity-50">
                    JPEG, PNG and PDF formats, up to 50 MB.
                  </p>
                </div>
                <button className="flex h-9 justify-center items-center gap-2 px-4 rounded-lg border border-[#DADADA] bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] hover:bg-gray-50 transition-colors">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M14 10V10.8C14 11.9201 14 12.4802 13.782 12.908C13.5903 13.2843 13.2843 13.5903 12.908 13.782C12.4802 14 11.9201 14 10.8 14H5.2C4.07989 14 3.51984 14 3.09202 13.782C2.71569 13.5903 2.40973 13.2843 2.21799 12.908C2 12.4802 2 11.9201 2 10.8V10M11.3333 5.33333L8 2M8 2L4.66667 5.33333M8 2V10"
                      stroke="#303030"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className="text-[#303030] font-normal text-base capitalize">
                    Browse Files
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Scrollable Right Section - Bill Details & Line Items */}
          <div className="flex-1 overflow-x-auto overflow-y-auto">
            <div className="min-w-[1000px] flex flex-col gap-6 px-6 md:px-8 py-6">
              {/* Bill Details */}
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-5">
                  <h3 className="text-[#303030] font-semibold text-xl leading-[26px]">
                    Bill Details
                  </h3>
                  <div className="h-px bg-[#E5E5E5]" />
                </div>

                <div className="flex flex-col gap-5">
                  {/* Vendor and Invoice # */}
                  <div className="flex flex-col md:flex-row gap-5">
                    <div className="flex flex-col gap-2 flex-1">
                      <label className="text-[#303030] font-medium text-sm">
                        Vendor
                      </label>
                      <Select>
                        <SelectTrigger className="h-11 rounded-lg border-[#E5E5E5]">
                          <SelectValue
                            placeholder="Select vendor..."
                            className="text-[#A1A1A9]"
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="vendor1">Vendor 1</SelectItem>
                          <SelectItem value="vendor2">Vendor 2</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-col gap-2 flex-1">
                      <label className="text-[#303030] font-medium text-sm">
                        Invoice #
                      </label>
                      <Input
                        placeholder="INV-2024-001"
                        className="h-11 rounded-lg border-[#E5E5E5] placeholder:text-[#A1A1A9]"
                      />
                    </div>
                  </div>

                  {/* Invoice Date and Due Date */}
                  <div className="flex flex-col md:flex-row gap-5">
                    <div className="flex flex-col gap-2 flex-1">
                      <label className="text-[#303030] font-medium text-sm">
                        Invoice Date
                      </label>
                      <div className="relative">
                        <Input
                          type="date"
                          placeholder="mm/dd/yyyy"
                          className="h-11 rounded-lg border-[#E5E5E5] placeholder:text-[#A1A1A9]"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 flex-1">
                      <label className="text-[#303030] font-medium text-sm">
                        Due Date
                      </label>
                      <div className="relative">
                        <Input
                          type="date"
                          placeholder="mm/dd/yyyy"
                          className="h-11 rounded-lg border-[#E5E5E5] placeholder:text-[#A1A1A9]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Memo/Notes */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[#303030] font-medium text-sm">
                      Memo/Notes
                    </label>
                    <Textarea
                      placeholder="Additional notes..."
                      className="min-h-[81px] rounded-lg border-[#E5E5E5] placeholder:text-[#A1A1A9] resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Line Items */}
              <div className="flex flex-col gap-6">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col gap-5">
                    <h3 className="text-[#303030] font-semibold text-xl leading-[26px]">
                      Line Items
                    </h3>
                    <div className="h-px bg-[#E5E5E5]" />
                  </div>
                  <button className="flex h-9 items-center gap-2 px-4 rounded-lg border border-white bg-[#002D5A] shadow-[0_0_0_1px_#002D5A,0_0_10px_-5px_rgba(0,0,0,0.2)] hover:bg-[#003d7a] transition-colors flex-shrink-0 ml-4">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M9.99935 4.1665V15.8332M4.16602 9.99984H15.8327"
                        stroke="white"
                        strokeWidth="1.25"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span className="text-white font-medium text-base whitespace-nowrap">
                      Add Line Item
                    </span>
                  </button>
                </div>

                {/* Line Items Table */}
                <div className="overflow-x-auto rounded-xl border border-[#DADADA] shadow-[0_1px_2px_0_rgba(10,13,18,0.05)]">
                  <table className="border-collapse whitespace-nowrap" style={{ minWidth: "1200px" }}>
                    <thead>
                      <tr className="border-b border-[#DADADA]">
                        <th className="px-3 py-3 text-left border-r border-[#DADADA]" style={{ minWidth: "140px" }}>
                          <span className="text-[#525252] font-medium text-base">
                            Property / Ledger
                          </span>
                        </th>
                        <th className="px-3 py-3 text-left border-r border-[#DADADA]" style={{ minWidth: "60px" }}>
                          <span className="text-[#525252] font-medium text-base">
                            Unit
                          </span>
                        </th>
                        <th className="px-3 py-3 text-left border-r border-[#DADADA]" style={{ minWidth: "110px" }}>
                          <span className="text-[#525252] font-medium text-base">
                            Work Order
                          </span>
                        </th>
                        <th className="px-3 py-3 text-left border-r border-[#DADADA]" style={{ minWidth: "160px" }}>
                          <span className="text-[#525252] font-medium text-base">
                            Description
                          </span>
                        </th>
                        <th className="px-3 py-3 text-left border-r border-[#DADADA]" style={{ minWidth: "110px" }}>
                          <span className="text-[#525252] font-medium text-base">
                            GL Account
                          </span>
                        </th>
                        <th className="px-3 py-3 text-center border-r border-[#DADADA]" style={{ minWidth: "100px" }}>
                          <span className="text-[#525252] font-medium text-base">
                            Reimbursement
                          </span>
                        </th>
                        <th className="px-3 py-3 text-left border-r border-[#DADADA]" style={{ minWidth: "90px" }}>
                          <span className="text-[#525252] font-medium text-base">
                            Subtotal
                          </span>
                        </th>
                        <th className="px-3 py-3 text-left border-r border-[#DADADA]" style={{ minWidth: "100px" }}>
                          <span className="text-[#525252] font-medium text-base">
                            Up-charge
                          </span>
                        </th>
                        <th className="px-3 py-3 text-left border-r border-[#DADADA]" style={{ minWidth: "80px" }}>
                          <span className="text-[#525252] font-medium text-base">
                            Total
                          </span>
                        </th>
                        <th className="px-3 py-3 text-center border-r border-[#DADADA]" style={{ minWidth: "70px" }}>
                          <span className="text-[#525252] font-medium text-base">
                            Actions
                          </span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {lineItems.map((item) => (
                        <tr
                          key={item.id}
                          className="border-b border-[#DADADA] last:border-b-0"
                        >
                          <td className="px-3 py-4 border-r border-[#DADADA]" style={{ minWidth: "140px" }}>
                            <span className="text-[#303030] text-base truncate">
                              {item.property}
                            </span>
                          </td>
                          <td className="px-3 py-4 border-r border-[#DADADA]" style={{ minWidth: "60px" }}>
                            <span className="text-[#303030] text-base">
                              {item.unit}
                            </span>
                          </td>
                          <td className="px-3 py-4 border-r border-[#DADADA]" style={{ minWidth: "110px" }}>
                            <Select defaultValue={item.workOrder}>
                              <SelectTrigger className="h-9 border-[#DADADA] shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="123456-1">
                                  123456-1
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="px-3 py-4 border-r border-[#DADADA]" style={{ minWidth: "160px" }}>
                            <span className="text-[#303030] text-base truncate">
                              {item.description}
                            </span>
                          </td>
                          <td className="px-3 py-4 border-r border-[#DADADA]" style={{ minWidth: "110px" }}>
                            <span className="text-[#303030] text-base">
                              {item.glAccount}
                            </span>
                          </td>
                          <td className="px-3 py-4 border-r border-[#DADADA]" style={{ minWidth: "100px" }}>
                            <div className="flex justify-center">
                              <Checkbox
                                checked={item.reimbursement}
                                className="w-[15px] h-[15px] rounded"
                              />
                            </div>
                          </td>
                          <td className="px-3 py-4 border-r border-[#DADADA]" style={{ minWidth: "90px" }}>
                            <span className="text-[#303030] text-base">
                              ${item.subtotal}
                            </span>
                          </td>
                          <td className="px-3 py-4 border-r border-[#DADADA]" style={{ minWidth: "100px" }}>
                            <Select defaultValue={item.upcharge.toString()}>
                              <SelectTrigger className="h-9 border-[#DADADA] shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="0">0 %</SelectItem>
                                <SelectItem value="10">10 %</SelectItem>
                                <SelectItem value="15">15 %</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="px-3 py-4 border-r border-[#DADADA]" style={{ minWidth: "80px" }}>
                            <span className="text-[#303030] text-base">
                              ${item.total}
                            </span>
                          </td>
                          <td className="px-3 py-4 border-r border-[#DADADA]" style={{ minWidth: "70px" }}>
                            <div className="flex justify-center">
                              <button className="flex w-7 h-7 justify-center items-center rounded-md border border-[#DADADA] shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] hover:bg-gray-50">
                                <svg
                                  width="18"
                                  height="18"
                                  viewBox="0 0 18 18"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M9 9.75C9.41421 9.75 9.75 9.41421 9.75 9C9.75 8.58579 9.41421 8.25 9 8.25C8.58579 8.25 8.25 8.58579 8.25 9C8.25 9.41421 8.58579 9.75 9 9.75Z"
                                    stroke="#525252"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                  <path
                                    d="M14.25 9.75C14.6642 9.75 15 9.41421 15 9C15 8.58579 14.6642 8.25 14.25 8.25C13.8358 8.25 13.5 8.58579 13.5 9C13.5 9.41421 13.8358 9.75 14.25 9.75Z"
                                    stroke="#525252"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                  <path
                                    d="M3.75 9.75C4.16421 9.75 4.5 9.41421 4.5 9C4.5 8.58579 4.16421 8.25 3.75 8.25C3.33579 8.25 3 8.58579 3 9C3 9.41421 3.33579 9.75 3.75 9.75Z"
                                    stroke="#525252"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Fixed Footer - Action Buttons Only */}
        <div className="flex-shrink-0 flex justify-end items-center gap-2.5 px-6 md:px-8 py-4 border-t border-[#E5E5E5] bg-white">
          <button
            onClick={() => onOpenChange(false)}
            className="flex h-9 justify-center items-center gap-2 px-4 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <span className="text-[#303030] font-normal text-base capitalize">
              Cancel
            </span>
          </button>
          <button className="flex h-9 items-center gap-2 px-4 rounded-lg border border-white bg-[#002D5A] shadow-[0_0_0_1px_#002D5A,0_0_10px_-5px_rgba(0,0,0,0.2)] hover:bg-[#003d7a] transition-colors">
            <span className="text-white font-medium text-base">
              Record Bill
            </span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
