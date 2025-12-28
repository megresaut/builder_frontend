import { useState } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import PageTemplate from "@/layout/PageTemplate";
import { ClockIcon, DollarIcon, PlusIcon } from "@/components/icons";
import { ChevronRight, ChevronDown, Trash2, Upload, X } from "lucide-react";

interface HourEntry {
  id: string;
  isExpanded: boolean;
}

interface ExpenseEntry {
  id: string;
  isExpanded: boolean;
}

export default function FtoSubmissionForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { ftoId } = useParams();
  
  const [hourEntries, setHourEntries] = useState<HourEntry[]>([
    { id: "hour-1", isExpanded: false },
    { id: "hour-2", isExpanded: true },
  ]);
  
  const [expenseEntries, setExpenseEntries] = useState<ExpenseEntry[]>([
    { id: "expense-1", isExpanded: false },
    { id: "expense-2", isExpanded: true },
  ]);

  const toggleHourEntry = (id: string) => {
    setHourEntries((prev) =>
      prev.map((entry) =>
        entry.id === id ? { ...entry, isExpanded: !entry.isExpanded } : entry
      )
    );
  };

  const toggleExpenseEntry = (id: string) => {
    setExpenseEntries((prev) =>
      prev.map((entry) =>
        entry.id === id ? { ...entry, isExpanded: !entry.isExpanded } : entry
      )
    );
  };

  const addHourEntry = () => {
    setHourEntries((prev) => [
      ...prev,
      { id: `hour-${Date.now()}`, isExpanded: true },
    ]);
  };

  const addExpenseEntry = () => {
    setExpenseEntries((prev) => [
      ...prev,
      { id: `expense-${Date.now()}`, isExpanded: true },
    ]);
  };

  return (
    <PageTemplate>
      <div className="flex flex-col items-center w-full px-6 py-9">
        <div className="w-full max-w-[700px] flex flex-col gap-7">
          {/* Title and Divider */}
          <div className="flex flex-col gap-3">
            <h1 className="text-[28px] font-semibold text-[#303030] leading-[26px]" style={{ fontFamily: 'Geist, -apple-system, Roboto, Helvetica, sans-serif' }}>
              Submission Summary
            </h1>
            <div className="h-px w-full bg-[#E5E5E5]" />
          </div>

          <div className="flex flex-col gap-6">
            {/* Hours Section */}
            <div className="rounded-xl bg-white border border-[#E5E5E5] shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-4 flex flex-col gap-4">
              {/* Hours Header */}
              <div className="flex items-center justify-between pr-3">
                <div className="flex items-center gap-2">
                  <ClockIcon width={16} height={16} />
                  <span className="text-base font-medium text-[#303030]" style={{ fontFamily: 'Geist, -apple-system, Roboto, Helvetica, sans-serif' }}>
                    Hours
                  </span>
                </div>
              </div>

              {/* Hour Entries */}
              <div className="flex flex-col gap-4">
                {hourEntries.map((entry, index) => (
                  <div key={entry.id}>
                    {/* Entry Header */}
                    <div
                      className="flex items-center gap-2 cursor-pointer"
                      onClick={() => toggleHourEntry(entry.id)}
                    >
                      {entry.isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-[#303030]" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-[#303030]" />
                      )}
                      <span className="text-base font-medium text-[#303030]" style={{ fontFamily: 'Geist, -apple-system, Roboto, Helvetica, sans-serif' }}>
                        Hours Entry
                      </span>
                      <div className="w-5 h-5 rounded bg-[#BEE9FF] flex items-center justify-center">
                        <span className="text-base font-medium text-[#2463EB]" style={{ fontFamily: 'Geist, -apple-system, Roboto, Helvetica, sans-serif' }}>
                          {index + 1}
                        </span>
                      </div>
                    </div>

                    {index < hourEntries.length - 1 && (
                      <div className="h-px w-full bg-[#E5E5E5] mt-4" />
                    )}

                    {/* Expanded Content */}
                    {entry.isExpanded && (
                      <div className="flex flex-col gap-4 mt-4">
                        {/* Date */}
                        <div className="flex flex-col gap-2">
                          <label className="text-sm font-medium text-[#303030]" style={{ fontFamily: 'Geist, -apple-system, Roboto, Helvetica, sans-serif' }}>
                            Date <span className="text-red-600">*</span>
                          </label>
                          <div className="rounded-lg bg-[#F7F7F7] border border-[#E5E5E5] px-3 py-2 flex items-center gap-2">
                            <span className="flex-1 text-base text-[#A1A1A9]" style={{ fontFamily: 'Geist, -apple-system, Roboto, Helvetica, sans-serif', letterSpacing: '-0.32px', lineHeight: '1.4' }}>
                              MM/DD/YYYY
                            </span>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M14 6.66671H2M10.6667 1.33337V4.00004M5.33333 1.33337V4.00004M5.2 14.6667H10.8C11.9201 14.6667 12.4802 14.6667 12.908 14.4487C13.2843 14.257 13.5903 13.951 13.782 13.5747C14 13.1469 14 12.5868 14 11.4667V5.86671C14 4.7466 14 4.18655 13.782 3.75873C13.5903 3.3824 13.2843 3.07644 12.908 2.88469C12.4802 2.66671 11.9201 2.66671 10.8 2.66671H5.2C4.0799 2.66671 3.51984 2.66671 3.09202 2.88469C2.71569 3.07644 2.40973 3.3824 2.21799 3.75873C2 4.18655 2 4.7466 2 5.86671V11.4667C2 12.5868 2 13.1469 2.21799 13.5747C2.40973 13.951 2.71569 14.257 3.09202 14.4487C3.51984 14.6667 4.0799 14.6667 5.2 14.6667Z" stroke="black" strokeWidth="1.48576" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </div>

                          {/* Property and Unit Row */}
                          <div className="flex gap-3 mt-2">
                            <div className="flex-1 flex flex-col gap-2">
                              <label className="text-sm font-medium text-[#303030]" style={{ fontFamily: 'Geist, -apple-system, Roboto, Helvetica, sans-serif' }}>
                                Property <span className="text-red-600">*</span>
                              </label>
                              <div className="rounded-lg bg-[#F7F7F7] border border-[#E5E5E5] px-3 py-2 flex items-center gap-2">
                                <span className="flex-1 text-base text-[#A1A1A9]" style={{ fontFamily: 'Geist, -apple-system, Roboto, Helvetica, sans-serif', letterSpacing: '-0.32px', lineHeight: '1.4' }}>
                                  Select Property
                                </span>
                                <ChevronDown className="w-4 h-4" />
                              </div>
                            </div>
                            <div className="flex-1 flex flex-col gap-2">
                              <label className="text-sm font-medium text-[#303030]" style={{ fontFamily: 'Geist, -apple-system, Roboto, Helvetica, sans-serif' }}>
                                Unit
                              </label>
                              <div className="rounded-lg bg-[#F7F7F7] border border-[#E5E5E5] px-3 py-2 flex items-center gap-2">
                                <span className="flex-1 text-base text-[#A1A1A9] lowercase" style={{ fontFamily: 'Geist, -apple-system, Roboto, Helvetica, sans-serif', letterSpacing: '-0.32px', lineHeight: '1.4' }}>
                                  select unit if applicable
                                </span>
                                <ChevronDown className="w-4 h-4" />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Task */}
                        <div className="flex flex-col gap-2">
                          <label className="text-sm font-medium text-[#303030]" style={{ fontFamily: 'Geist, -apple-system, Roboto, Helvetica, sans-serif' }}>
                            Task <span className="text-red-600">*</span>
                          </label>
                          <div className="rounded-lg bg-[#F7F7F7] border border-[#E5E5E5] px-3 py-2 flex items-center gap-2">
                            <span className="flex-1 text-base text-[#A1A1A9]" style={{ fontFamily: 'Geist, -apple-system, Roboto, Helvetica, sans-serif', letterSpacing: '-0.32px', lineHeight: '1.4' }}>
                              Select Task Or N/A
                            </span>
                            <ChevronDown className="w-4 h-4" />
                          </div>
                        </div>

                        {/* Hours */}
                        <div className="flex flex-col gap-2">
                          <label className="text-sm font-medium text-[#303030]" style={{ fontFamily: 'Geist, -apple-system, Roboto, Helvetica, sans-serif' }}>
                            Hours <span className="text-red-600">*</span>
                          </label>
                          <div className="rounded-lg bg-[#F7F7F7] border border-[#E5E5E5] px-3 py-2 flex items-center gap-2">
                            <span className="flex-1 text-base text-[#A1A1A9]" style={{ fontFamily: 'Geist, -apple-system, Roboto, Helvetica, sans-serif', letterSpacing: '-0.32px', lineHeight: '1.4' }}>
                              0 Hours
                            </span>
                            <ChevronDown className="w-4 h-4" />
                          </div>
                        </div>

                        {/* Emergency Rate */}
                        <div className="flex flex-col gap-2">
                          <label className="text-sm font-medium text-[#303030]" style={{ fontFamily: 'Geist, -apple-system, Roboto, Helvetica, sans-serif' }}>
                            Emergency Rate? <span className="text-red-600">*</span>
                          </label>
                          <div className="rounded-lg bg-[#F7F7F7] border border-[#E5E5E5] px-3 py-2 flex items-center gap-2">
                            <span className="flex-1" />
                            <ChevronDown className="w-4 h-4" />
                          </div>
                        </div>

                        {/* Non-Billable Hours */}
                        <div className="flex flex-col gap-2">
                          <label className="text-sm font-medium text-[#303030]" style={{ fontFamily: 'Geist, -apple-system, Roboto, Helvetica, sans-serif' }}>
                            Non-Billable Hours? <span className="text-red-600">*</span>
                          </label>
                          <div className="rounded-lg bg-[#F7F7F7] border border-[#E5E5E5] px-3 py-2 flex items-center gap-2">
                            <span className="flex-1" />
                            <ChevronDown className="w-4 h-4" />
                          </div>
                        </div>

                        {/* Note */}
                        <div className="flex flex-col gap-2">
                          <label className="text-sm font-medium text-[#303030]" style={{ fontFamily: 'Geist, -apple-system, Roboto, Helvetica, sans-serif' }}>
                            Note
                          </label>
                          <div className="rounded-lg bg-[#F7F7F7] border border-[#E5E5E5] px-3 py-2 min-h-[81px] flex items-start">
                            <span className="flex-1 text-base text-[#A1A1A9]" style={{ fontFamily: 'Geist, -apple-system, Roboto, Helvetica, sans-serif', letterSpacing: '-0.32px', lineHeight: '1.4' }}>
                              Notes for Hour entry
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Add Hour Entry Button */}
                <button
                  onClick={addHourEntry}
                  className="rounded-lg bg-white border border-dashed border-[rgba(18,18,18,0.4)] px-3 py-2 flex items-center justify-center gap-2"
                >
                  <PlusIcon width={16} height={16} color="#2463EB" />
                  <span className="text-base font-medium text-[#2463EB]" style={{ fontFamily: 'Geist, -apple-system, Roboto, Helvetica, sans-serif', letterSpacing: '-0.32px', lineHeight: '1.4' }}>
                    Add hour Entry
                  </span>
                </button>
              </div>
            </div>

            {/* Expense Entry Section */}
            <div className="rounded-xl bg-white border border-[#E5E5E5] shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-4 flex flex-col gap-4">
              {/* Expense Header */}
              <div className="flex items-center justify-between pr-3">
                <div className="flex items-center gap-2">
                  <DollarIcon width={16} height={16} />
                  <span className="text-base font-medium text-[#303030]" style={{ fontFamily: 'Geist, -apple-system, Roboto, Helvetica, sans-serif' }}>
                    Expense Entry
                  </span>
                </div>
              </div>

              {/* Expense Entries */}
              <div className="flex flex-col gap-4">
                {expenseEntries.map((entry, index) => (
                  <div key={entry.id}>
                    {/* Entry Header */}
                    <div className="flex items-center justify-between pr-3">
                      <div
                        className="flex items-center gap-2 cursor-pointer"
                        onClick={() => toggleExpenseEntry(entry.id)}
                      >
                        {entry.isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-[#303030]" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-[#303030]" />
                        )}
                        <span className="text-base font-medium text-[#303030]" style={{ fontFamily: 'Geist, -apple-system, Roboto, Helvetica, sans-serif' }}>
                          Expense Entry
                        </span>
                        <div className="w-5 h-5 rounded bg-[#BEE9FF] flex items-center justify-center">
                          <span className="text-base font-medium text-[#2463EB]" style={{ fontFamily: 'Geist, -apple-system, Roboto, Helvetica, sans-serif' }}>
                            {index + 1}
                          </span>
                        </div>
                      </div>
                      {index === 0 && <Trash2 className="w-4 h-4 text-[#09090B]" />}
                    </div>

                    {index < expenseEntries.length - 1 && (
                      <div className="h-px w-full bg-[#E5E5E5] mt-4" />
                    )}

                    {/* Expanded Content */}
                    {entry.isExpanded && (
                      <div className="flex flex-col gap-4 mt-4">
                        {/* Date */}
                        <div className="flex flex-col gap-2">
                          <label className="text-sm font-medium text-[#303030]" style={{ fontFamily: 'Geist, -apple-system, Roboto, Helvetica, sans-serif' }}>
                            Date <span className="text-red-600">*</span>
                          </label>
                          <div className="rounded-lg bg-[#F7F7F7] border border-[#E5E5E5] px-3 py-2 flex items-center gap-2">
                            <span className="flex-1 text-base text-[#A1A1A9]" style={{ fontFamily: 'Geist, -apple-system, Roboto, Helvetica, sans-serif', letterSpacing: '-0.32px', lineHeight: '1.4' }}>
                              MM/DD/YYYY
                            </span>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M14 6.66671H2M10.6667 1.33337V4.00004M5.33333 1.33337V4.00004M5.2 14.6667H10.8C11.9201 14.6667 12.4802 14.6667 12.908 14.4487C13.2843 14.257 13.5903 13.951 13.782 13.5747C14 13.1469 14 12.5868 14 11.4667V5.86671C14 4.7466 14 4.18655 13.782 3.75873C13.5903 3.3824 13.2843 3.07644 12.908 2.88469C12.4802 2.66671 11.9201 2.66671 10.8 2.66671H5.2C4.0799 2.66671 3.51984 2.66671 3.09202 2.88469C2.71569 3.07644 2.40973 3.3824 2.21799 3.75873C2 4.18655 2 4.7466 2 5.86671V11.4667C2 12.5868 2 13.1469 2.21799 13.5747C2.40973 13.951 2.71569 14.257 3.09202 14.4487C3.51984 14.6667 4.0799 14.6667 5.2 14.6667Z" stroke="black" strokeWidth="1.48576" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </div>
                        </div>

                        {/* Property and Unit Row */}
                        <div className="flex gap-3">
                          <div className="flex-1 flex flex-col gap-2">
                            <label className="text-sm font-medium text-[#303030]" style={{ fontFamily: 'Geist, -apple-system, Roboto, Helvetica, sans-serif' }}>
                              Property <span className="text-red-600">*</span>
                            </label>
                            <div className="rounded-lg bg-[#F7F7F7] border border-[#E5E5E5] px-3 py-2 flex items-center gap-2">
                              <span className="flex-1 text-base text-[#A1A1A9]" style={{ fontFamily: 'Geist, -apple-system, Roboto, Helvetica, sans-serif', letterSpacing: '-0.32px', lineHeight: '1.4' }}>
                                Select Property
                              </span>
                              <ChevronDown className="w-4 h-4" />
                            </div>
                          </div>
                          <div className="flex-1 flex flex-col gap-2">
                            <label className="text-sm font-medium text-[#303030]" style={{ fontFamily: 'Geist, -apple-system, Roboto, Helvetica, sans-serif' }}>
                              Unit
                            </label>
                            <div className="rounded-lg bg-[#F7F7F7] border border-[#E5E5E5] px-3 py-2 flex items-center gap-2">
                              <span className="flex-1 text-base text-[#A1A1A9]" style={{ fontFamily: 'Geist, -apple-system, Roboto, Helvetica, sans-serif', letterSpacing: '-0.32px', lineHeight: '1.4' }}>
                                Select Unit if Applicable
                              </span>
                              <ChevronDown className="w-4 h-4" />
                            </div>
                          </div>
                        </div>

                        {/* Task */}
                        <div className="flex flex-col gap-2">
                          <label className="text-sm font-medium text-[#303030]" style={{ fontFamily: 'Geist, -apple-system, Roboto, Helvetica, sans-serif' }}>
                            Task <span className="text-red-600">*</span>
                          </label>
                          <div className="rounded-lg bg-[#F7F7F7] border border-[#E5E5E5] px-3 py-2 flex items-center gap-2">
                            <span className="flex-1 text-base text-[#A1A1A9]" style={{ fontFamily: 'Geist, -apple-system, Roboto, Helvetica, sans-serif', letterSpacing: '-0.32px', lineHeight: '1.4' }}>
                              Select Task Or N/A
                            </span>
                            <ChevronDown className="w-4 h-4" />
                          </div>
                        </div>

                        {/* Amount */}
                        <div className="flex flex-col gap-2">
                          <label className="text-sm font-medium text-[#303030]" style={{ fontFamily: 'Geist, -apple-system, Roboto, Helvetica, sans-serif' }}>
                            Amount <span className="text-red-600">*</span>
                          </label>
                          <div className="rounded-lg bg-[#F7F7F7] border border-[#E5E5E5] px-3 py-2 flex items-center gap-2">
                            <span className="flex-1 text-base text-[#A1A1A9]" style={{ fontFamily: 'Geist, -apple-system, Roboto, Helvetica, sans-serif', letterSpacing: '-0.32px', lineHeight: '1.4' }}>
                              $0.00
                            </span>
                            <ChevronDown className="w-4 h-4" />
                          </div>
                        </div>

                        {/* Charge Type */}
                        <div className="flex flex-col gap-2">
                          <label className="text-sm font-medium text-[#303030]" style={{ fontFamily: 'Geist, -apple-system, Roboto, Helvetica, sans-serif' }}>
                            Charge Type <span className="text-red-600">*</span>
                          </label>
                          <div className="rounded-lg bg-[#F7F7F7] border border-[#E5E5E5] px-3 py-2 flex items-center gap-2">
                            <span className="flex-1" />
                            <ChevronDown className="w-4 h-4" />
                          </div>
                        </div>

                        {/* Vendor */}
                        <div className="flex flex-col gap-2">
                          <label className="text-sm font-medium text-[#303030]" style={{ fontFamily: 'Geist, -apple-system, Roboto, Helvetica, sans-serif' }}>
                            Vendor <span className="text-red-600">*</span>
                          </label>
                          <div className="rounded-lg bg-[#F7F7F7] border border-[#E5E5E5] px-3 py-2 flex items-center gap-2">
                            <span className="flex-1 text-base text-[#A1A1A9]" style={{ fontFamily: 'Geist, -apple-system, Roboto, Helvetica, sans-serif', letterSpacing: '-0.32px', lineHeight: '1.4' }}>
                              Select Vendor Paid Or N/A
                            </span>
                            <ChevronDown className="w-4 h-4" />
                          </div>
                        </div>

                        {/* Note */}
                        <div className="flex flex-col gap-2">
                          <label className="text-sm font-medium text-[#303030]" style={{ fontFamily: 'Geist, -apple-system, Roboto, Helvetica, sans-serif' }}>
                            Note
                          </label>
                          <div className="rounded-lg bg-[#F7F7F7] border border-[#E5E5E5] px-3 py-2 min-h-[81px] flex items-start">
                            <span className="flex-1 text-base text-[#A1A1A9]" style={{ fontFamily: 'Geist, -apple-system, Roboto, Helvetica, sans-serif', letterSpacing: '-0.32px', lineHeight: '1.4' }}>
                              notes for Expense Entry
                            </span>
                          </div>
                        </div>

                        {/* Receipts */}
                        <div className="flex flex-col gap-2">
                          <label className="text-sm font-medium text-[#303030]" style={{ fontFamily: 'Geist, -apple-system, Roboto, Helvetica, sans-serif' }}>
                            Receipts
                          </label>
                          <div className="rounded-lg bg-white border border-dashed border-[rgba(18,18,18,0.4)] px-3 py-2 flex flex-col items-center gap-3">
                            <button className="rounded-lg bg-[#FBFBFB] border border-[#DADADA] shadow-[0_1px_3px_rgba(0,0,0,0.03)] px-3 py-2 flex items-center gap-2">
                              <Upload className="w-4 h-4 text-[#303030]" />
                              <span className="text-base text-[#303030]" style={{ fontFamily: 'Geist, -apple-system, Roboto, Helvetica, sans-serif', letterSpacing: '-0.32px', lineHeight: '1.4' }}>
                                Upload
                              </span>
                            </button>
                            <div className="flex flex-col items-center gap-1.5 px-2.5 py-2.5">
                              <span className="text-sm text-[#09090B]" style={{ fontFamily: 'Geist, -apple-system, Roboto, Helvetica, sans-serif', lineHeight: '1.14' }}>
                                Choose a file or drag & drop it here
                              </span>
                              <span className="text-sm text-[#09090B] opacity-50" style={{ fontFamily: 'Geist, -apple-system, Roboto, Helvetica, sans-serif', lineHeight: '1.14' }}>
                                Maximum 500 MB file size
                              </span>
                            </div>
                          </div>

                          {/* Receipts Dropdown */}
                          <div className="flex flex-col gap-2 mt-4 max-w-[270px]">
                            <div className="flex items-center gap-2">
                              <ChevronDown className="w-4 h-4 text-[#303030]" />
                              <span className="text-sm text-[#09090B]" style={{ fontFamily: 'Geist, -apple-system, Roboto, Helvetica, sans-serif', lineHeight: '1.14' }}>
                                Receipts
                              </span>
                            </div>
                            
                            {/* File Item */}
                            <div className="flex items-center gap-1">
                              <div className="flex-1 rounded-lg border border-[#E5E5E5] bg-[#FBFBFB] shadow-[0_1px_2px_rgba(10,13,18,0.05)] px-3 py-3 flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5">
                                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M17.333 12.0001H24.6663L17.333 4.66675V12.0001ZM7.99967 2.66675H18.6663L26.6663 10.6667V26.6668C26.6663 27.374 26.3854 28.0523 25.8853 28.5524C25.3852 29.0525 24.7069 29.3334 23.9997 29.3334H7.99967C7.29243 29.3334 6.61415 29.0525 6.11406 28.5524C5.61396 28.0523 5.33301 27.374 5.33301 26.6668V5.33342C5.33301 4.62617 5.61396 3.94789 6.11406 3.4478C6.61415 2.9477 7.29243 2.66675 7.99967 2.66675ZM14.573 16.5868C15.1197 17.7868 15.813 18.7734 16.613 19.4534L17.1597 19.8801C15.9997 20.0934 14.3997 20.4668 12.7063 21.1201L12.5597 21.1734L13.2263 19.7868C13.8263 18.6268 14.2663 17.5734 14.573 16.5868ZM23.213 21.6668C23.453 21.4268 23.573 21.1201 23.5863 20.7868C23.6263 20.5201 23.5597 20.2668 23.4263 20.0534C23.0397 19.4268 22.0397 19.1334 20.3863 19.1334L18.6663 19.2268L17.5063 18.4534C16.6663 17.7601 15.9063 16.5468 15.373 15.0401L15.4263 14.8534C15.8663 13.0801 16.2797 10.9334 15.3997 10.0534C15.292 9.9489 15.1647 9.86679 15.0251 9.81186C14.8855 9.75693 14.7363 9.73026 14.5863 9.73342H14.2663C13.773 9.73342 13.333 10.2534 13.213 10.7601C12.7197 12.5334 13.013 13.5068 13.5063 15.1201V15.1334C13.173 16.3068 12.7463 17.6668 12.0663 19.0401L10.7863 21.4401L9.59967 22.0934C7.99967 23.0934 7.23967 24.2134 7.09301 24.9201C7.03967 25.1734 7.06634 25.4001 7.15967 25.6401L7.19967 25.7068L7.83967 26.1201L8.42634 26.2668C9.50634 26.2668 10.733 25.0001 12.3863 22.1734L12.6263 22.0801C13.9997 21.6401 15.7063 21.3334 17.9997 21.0801C19.373 21.7601 20.9863 22.0668 21.9997 22.0668C22.5863 22.0668 22.9863 21.9201 23.213 21.6668ZM22.6663 20.7201L22.7863 20.8668C22.773 21.0001 22.733 21.0134 22.6663 21.0401H22.613L22.3597 21.0668C21.7463 21.0668 20.7997 20.8134 19.8263 20.3868C19.9463 20.2534 19.9997 20.2534 20.133 20.2534C21.9997 20.2534 22.533 20.5868 22.6663 20.7201ZM10.4397 22.6668C9.57301 24.2534 8.78634 25.1334 8.18634 25.3334C8.25301 24.8268 8.85301 23.9468 9.79967 23.0801L10.4397 22.6668ZM14.4663 13.4534C14.1597 12.2534 14.1463 11.2801 14.373 10.7201L14.4663 10.5601L14.6663 10.6267C14.893 10.9468 14.9197 11.3734 14.7863 12.0934L14.7463 12.3068L14.533 13.4001L14.4663 13.4534Z" fill="#EF5350"/>
                                  </svg>
                                  <div className="flex flex-col gap-0.5">
                                    <span className="text-xs text-[#181932]" style={{ fontFamily: 'Inter, -apple-system, Roboto, Helvetica, sans-serif' }}>
                                      Lorem Ipsum.PDF
                                    </span>
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] text-[#717179]" style={{ fontFamily: 'Inter, -apple-system, Roboto, Helvetica, sans-serif' }}>
                                        PDF
                                      </span>
                                      <div className="w-1 h-1 rounded-full bg-[#D9D9D9]" />
                                      <span className="text-[10px] text-[#717179]" style={{ fontFamily: 'Inter, -apple-system, Roboto, Helvetica, sans-serif' }}>
                                        112KB
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <X className="w-4 h-4 text-[#6B7280]" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Add Expense Button */}
                <button
                  onClick={addExpenseEntry}
                  className="rounded-lg bg-white border border-dashed border-[rgba(18,18,18,0.4)] px-3 py-2 flex items-center justify-center gap-2"
                >
                  <PlusIcon width={16} height={16} color="#2463EB" />
                  <span className="text-base font-medium text-[#2463EB]" style={{ fontFamily: 'Geist, -apple-system, Roboto, Helvetica, sans-serif', letterSpacing: '-0.32px', lineHeight: '1.4' }}>
                    Add Expense
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 mt-9">
            <button
              onClick={() => navigate(-1)}
              className="rounded-lg bg-[#FBFBFB] border border-[#DADADA] shadow-[0_1px_3px_rgba(0,0,0,0.03)] px-3 py-2 min-h-[36px] flex items-center justify-center"
            >
              <span className="text-base text-[#303030] font-normal" style={{ fontFamily: 'Geist, -apple-system, Roboto, Helvetica, sans-serif', letterSpacing: '-0.32px', lineHeight: '1.4' }}>
                Back
              </span>
            </button>
            <button
              onClick={() => navigate("/fto/submission-history")}
              className="rounded-lg bg-[#013764] border border-white shadow-[0_0_0_1px_#002D5A] px-3 py-2 min-h-[36px] flex items-center justify-center"
            >
              <span className="text-base text-white font-medium" style={{ fontFamily: 'Geist, -apple-system, Roboto, Helvetica, sans-serif' }}>
                Submit
              </span>
            </button>
          </div>
        </div>
      </div>
    </PageTemplate>
  );
}
