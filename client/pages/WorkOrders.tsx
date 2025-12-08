import { useState } from "react";
import { ChevronDown, Edit, Calendar, Upload, MapPin, Mail, Send, Paperclip } from "lucide-react";

export default function WorkOrders() {
  const [messageText, setMessageText] = useState("");
  const [selectedFilesTab, setSelectedFilesTab] = useState("all");
  const [selectedAssigneeTab, setSelectedAssigneeTab] = useState("staff");

  return (
    <div className="flex flex-col w-full gap-5">
      {/* Status/Priority/Due Date Section */}
      <div className="flex items-center justify-between gap-10 w-full flex-wrap bg-white rounded-lg shadow-sm font-['Geist',sans-serif]">
        <div className="flex items-center gap-5 flex-wrap min-w-[240px] flex-1 text-[#303030]">
          {/* Status */}
          <div className="flex flex-col flex-1 min-w-[180px]">
            <div className="text-sm font-medium leading-[1.14]">Status</div>
            <div className="mt-2 flex items-center justify-between gap-10 w-full px-3 py-1.5 bg-white border border-[#dadada] rounded-lg shadow-sm text-sm tracking-[-0.28px] leading-[1.4]">
              <div className="flex items-center gap-1">
                <div className="w-3.5 h-3.5 rounded-full bg-[#059669] flex items-center justify-center">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5L4 7L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span>Completed</span>
              </div>
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>

          {/* Priority */}
          <div className="flex flex-col flex-1 min-w-[180px]">
            <div className="text-sm font-medium leading-[1.14]">Priority</div>
            <div className="mt-2 flex items-center justify-between gap-10 w-full px-3 py-1.5 bg-white border border-[#dadada] rounded-lg shadow-sm text-sm tracking-[-0.28px] leading-[1.4]">
              <div className="flex items-center gap-1">
                <div className="w-3.5 h-3.5 rounded-full bg-[#fbbf24]"></div>
                <span>Normal</span>
              </div>
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>

          {/* Due Date */}
          <div className="flex flex-col flex-1 min-w-[180px]">
            <div className="text-sm font-medium leading-[1.14]">Due Date</div>
            <div className="mt-2 flex items-center justify-between gap-10 w-full px-3 py-1.5 bg-white border border-[#dadada] rounded-lg shadow-sm text-base tracking-[-0.32px] leading-[1.4]">
              <span>mm/dd/yyyy</span>
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Last Updated */}
        <div className="flex items-center gap-1 text-sm tracking-[-0.28px] leading-[1.4]">
          <span className="text-[#717179]">Last Updated</span>
          <span className="text-[#303030] font-medium">11/12/2025 9:22 PM</span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex gap-6 w-full flex-wrap lg:flex-nowrap">
        {/* Left Column */}
        <div className="flex flex-col min-w-[240px] flex-1">
          {/* Work Order Details Card */}
          <div className="flex flex-col w-full px-4 py-4 bg-white border border-[#e5e5e5] rounded-lg shadow-sm">
            <div className="flex gap-4 w-full flex-wrap lg:flex-nowrap">
              {/* Property Image */}
              <img
                src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/a778dc0c324c3b12d3592c96c97db0f2241bffe1?placeholderIfAbsent=true&width=400"
                alt="Property"
                className="w-full lg:w-[251px] aspect-[1.31] rounded-lg object-cover min-w-[240px]"
              />

              {/* Work Order Info */}
              <div className="flex flex-col min-w-[240px] flex-1 font-['Geist',sans-serif]">
                <div className="flex flex-col w-full">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex flex-col flex-1 min-w-[240px]">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-[#303030] text-[22px] font-semibold leading-[1.36]">
                          HVAC - #1024431-1
                        </div>
                        <button className="flex items-center gap-1 text-base text-[#2463eb] font-medium tracking-[-0.32px] leading-[1.4] hover:underline">
                          <Edit className="w-4 h-4" />
                          <span>Edit</span>
                        </button>
                      </div>
                      <div className="mt-4 flex flex-col text-sm text-[#717179] font-medium leading-[1.14]">
                        <div>Created by Julia LoSchiavo for</div>
                        <div className="mt-2">
                          <span className="font-bold text-[#2463eb]">
                            (C) 51 Willowmere Circle, Riverside CT 06878 -1
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-[#717179] tracking-[-0.28px] leading-[1.4]">
                      <span>Created</span>
                      <span>11/12/2025 9:22 PM</span>
                    </div>
                  </div>

                  <div className="flex items-end justify-between mt-6 gap-4 flex-wrap text-sm leading-[1.14]">
                    <div className="flex flex-col gap-3 min-w-[240px] flex-1 text-[#717179]">
                      <div className="flex items-center gap-1">
                        <span className="font-semibold">Invoice Number:</span>
                        <span className="font-medium">234605</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-semibold">Vendor:</span>
                        <span className="font-medium">Dolce Plumbing &amp; Heating LLC</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-semibold">Charge Work To:</span>
                        <span className="font-medium">Owner</span>
                      </div>
                    </div>
                    <button className="flex items-center gap-2 min-h-[40px] px-4 py-2.5 bg-[#f9f9f9] border border-[#dadada] rounded-lg shadow-sm text-sm text-[#2463eb] font-medium tracking-[-0.28px] leading-[1.4] hover:bg-gray-100 transition-colors">
                      <MapPin className="w-4 h-4" />
                      View Maps
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="w-full h-px bg-[#e5e5e5] mt-5"></div>

            {/* Totals */}
            <div className="flex gap-4 mt-5 w-full flex-wrap font-['Geist',sans-serif]">
              <div className="flex flex-col flex-1 min-w-[240px] px-4 py-4 bg-[#f9f9f9] border border-[#dadada] rounded-lg">
                <div className="text-sm text-[#717179] leading-[1.43]">ESTIMATE TOTAL</div>
                <div className="mt-1 text-2xl text-[#303030] font-medium leading-[1.17]">$1,450.50</div>
              </div>
              <div className="flex flex-col flex-1 min-w-[240px] px-4 py-4 bg-[#f9f9f9] border border-[#dadada] rounded-lg">
                <div className="text-sm text-[#717179] leading-[1.43]">WORK ORDER TOTAL</div>
                <div className="mt-1 text-2xl text-[#303030] font-medium leading-[1.17]">$1,350.00</div>
              </div>
            </div>

            {/* Notes and Files Section */}
            <div className="flex gap-5 mt-5 w-full flex-wrap">
              {/* Notes */}
              <div className="flex flex-col flex-1 min-w-[240px] font-['Geist',sans-serif]">
                <div className="text-base text-[#303030] font-medium leading-[1.25]">Notes</div>
                <textarea
                  placeholder="Add some note here"
                  className="mt-6 min-h-[100px] w-full px-3 py-2 bg-[#f9f9f9] border border-[#dadada] rounded-lg text-sm text-[#a1a1a9] leading-5 resize-none focus:outline-none focus:border-[#2463eb]"
                  rows={4}
                />
              </div>

              {/* Files */}
              <div className="flex flex-col flex-1 min-w-[240px] font-['Geist',sans-serif]">
                <div className="flex flex-col w-full">
                  <div className="text-base text-[#303030] font-medium leading-[1.25]">Files</div>
                  
                  {/* File Tabs */}
                  <div className="flex mt-2 w-full px-0.5 py-0.5 bg-[#f9f9f9] rounded-lg shadow-[0px_0px_0px_1px_rgba(210,209,207,1)] text-sm text-[#282828] text-center leading-[1.43]">
                    <button
                      onClick={() => setSelectedFilesTab("all")}
                      className={`flex-1 px-4 py-1.5 rounded-md ${selectedFilesTab === "all" ? "bg-white shadow-sm text-[#09090b] font-medium" : ""}`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setSelectedFilesTab("estimates")}
                      className={`flex-1 px-2 py-1.5 rounded-md ${selectedFilesTab === "estimates" ? "bg-white shadow-sm text-[#09090b] font-medium" : ""}`}
                    >
                      Estimates (1)
                    </button>
                    <button
                      onClick={() => setSelectedFilesTab("bills")}
                      className={`flex-1 px-4 py-1.5 rounded-md ${selectedFilesTab === "bills" ? "bg-white shadow-sm text-[#09090b] font-medium" : ""}`}
                    >
                      Bills (1)
                    </button>
                    <button
                      onClick={() => setSelectedFilesTab("other")}
                      className={`flex-1 px-4 py-1.5 rounded-md ${selectedFilesTab === "other" ? "bg-white shadow-sm text-[#09090b] font-medium" : ""}`}
                    >
                      Other
                    </button>
                  </div>

                  {/* Upload Area */}
                  <div className="flex flex-col items-center mt-4 px-4 py-4 bg-[#f9f9f9] border border-dashed border-[rgba(18,18,18,0.4)] rounded-lg">
                    <button className="flex items-center gap-2 min-h-[36px] px-3 bg-white border border-[#dadada] rounded-lg shadow-sm text-base text-[#303030] tracking-[-0.32px] leading-[1.4] hover:bg-gray-50 transition-colors">
                      <Upload className="w-4 h-4" />
                      Upload
                    </button>
                    <div className="mt-2 px-2.5 py-2.5 flex flex-col items-center text-sm text-[#09090b] leading-[1.14]">
                      <div>Choose a file or drag &amp; drop it here</div>
                      <div className="mt-1.5">Maximum 500 MB file size</div>
                    </div>
                  </div>
                </div>

                {/* File List */}
                <div className="mt-6 flex flex-col w-full max-w-[270px]">
                  <div className="flex items-center gap-2 text-sm text-[#09090b] font-['Geist',sans-serif]">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M8 2V14M14 8H2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    <span>Files</span>
                  </div>
                  
                  <div className="mt-2 flex flex-col gap-2">
                    {/* File Item 1 */}
                    <div className="flex items-center justify-between gap-3 px-3 py-3 bg-[#fbfbfb] border border-[#e5e5e5] rounded-lg shadow-sm">
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                          <rect width="32" height="32" rx="4" fill="#EF4444"/>
                          <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fill="white" fontSize="10" fontWeight="600">PDF</text>
                        </svg>
                        <div className="flex flex-col min-w-0 flex-1">
                          <div className="text-xs text-[#181932] font-['Inter',sans-serif] truncate">Lorem Ipsum.PDF</div>
                          <div className="flex items-center gap-2 text-[10px] text-[#717179]">
                            <span>PDF</span>
                            <span>112KB</span>
                          </div>
                        </div>
                      </div>
                      <button className="flex-shrink-0 w-4 h-4 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M2 14L14 2M14 14L2 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      </button>
                    </div>

                    {/* File Item 2 */}
                    <div className="flex items-center justify-between gap-3 px-3 py-3 bg-[#fbfbfb] border border-[#e5e5e5] rounded-lg shadow-sm">
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                          <rect width="32" height="32" rx="4" fill="#EF4444"/>
                          <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fill="white" fontSize="10" fontWeight="600">PDF</text>
                        </svg>
                        <div className="flex flex-col min-w-0 flex-1">
                          <div className="text-xs text-[#181932] font-['Inter',sans-serif] truncate">Lorem Ipsum.PDF</div>
                          <div className="flex items-center gap-2 text-[10px] text-[#717179]">
                            <span>PDF</span>
                            <span>112KB</span>
                          </div>
                        </div>
                      </div>
                      <button className="flex-shrink-0 w-4 h-4 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M2 14L14 2M14 14L2 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="flex flex-col min-w-[240px] w-full lg:w-[376px]">
          {/* Bills Section */}
          <div className="flex flex-col w-full px-4 py-4 bg-white border border-[#e5e5e5] rounded-lg shadow-sm font-['Geist',sans-serif]">
            <div className="text-base text-[#303030] font-medium leading-[1.25]">Bills</div>
            <div className="flex flex-col mt-4 px-4 py-4 bg-[#f9f9f9] border border-[#dadada] rounded-lg">
              <div className="flex flex-col w-full">
                <div className="flex items-start gap-6 text-sm text-[#717179] tracking-[-0.28px] leading-[1.14]">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>November 27</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/>
                      <path d="M8 4V8L10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    <span>5:00 PM</span>
                  </div>
                </div>
                <div className="mt-3 text-base text-[#303030] font-medium leading-[1.25] tracking-[-0.32px]">
                  234605 - Dolce Heating &amp; Plumbing
                </div>
              </div>
              <div className="flex items-start justify-between mt-6 w-full gap-10">
                <div className="text-2xl text-[#2463eb] font-medium leading-[1.08]">$1,350.00</div>
                <div className="flex items-center gap-1 min-h-[32px] px-3.5 py-1.5 border border-[#059669] rounded-full text-base text-[#059669] font-medium tracking-[-0.32px] leading-[1.4]">
                  <div className="w-3.5 h-3.5 rounded-full bg-[#059669] flex items-center justify-center">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5L4 7L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span>Paid</span>
                </div>
              </div>
            </div>
          </div>

          {/* Assignees Section */}
          <div className="flex flex-col w-full mt-[18px] px-4 py-4 bg-[#f9f9f9] border border-[#e5e5e5] rounded-lg shadow-sm font-['Geist',sans-serif]">
            <div className="text-base text-[#303030] font-medium leading-[1.25]">Assignees</div>
            
            {/* Tabs */}
            <div className="flex mt-4 w-full px-0.5 py-0.5 bg-[#f2f2f2] rounded-lg shadow-[0px_0px_0px_1px_rgba(210,209,207,1)] text-sm text-[#282828] text-center leading-[1.43]">
              <button
                onClick={() => setSelectedAssigneeTab("staff")}
                className={`flex-1 px-4 py-1.5 rounded-md ${selectedAssigneeTab === "staff" ? "bg-white shadow-sm text-[#09090b] font-medium" : ""}`}
              >
                Staff
              </button>
              <button
                onClick={() => setSelectedAssigneeTab("vendors")}
                className={`flex-1 px-4 py-1.5 rounded-md ${selectedAssigneeTab === "vendors" ? "bg-white shadow-sm text-[#09090b] font-medium" : ""}`}
              >
                Vendors
              </button>
              <button
                onClick={() => setSelectedAssigneeTab("fieldteam")}
                className={`flex-1 px-4 py-1.5 rounded-md ${selectedAssigneeTab === "fieldteam" ? "bg-white shadow-sm text-[#09090b] font-medium" : ""}`}
              >
                Field Team
              </button>
            </div>

            {/* Assigned to */}
            <div className="flex flex-col mt-4 w-full">
              <div className="text-sm text-[#303030] font-medium leading-[1.14]">Assigned to</div>
              <div className="flex items-center justify-between mt-3 w-full">
                <div className="flex items-center gap-2.5 min-w-[240px] flex-1">
                  <div className="flex items-center justify-center w-10 h-10 bg-white border border-[#2463eb] rounded-full text-xl text-[#2463eb] font-semibold leading-[0.8]">
                    JL
                  </div>
                  <div className="flex flex-col flex-1 text-sm">
                    <div className="text-[#2463eb] font-medium leading-[1.29] tracking-[-0.28px]">Julia LoSchiavo</div>
                    <div className="mt-1 text-[#a1a1a9] leading-[1.14]">Staff member</div>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <div className="text-base text-[#2463eb] font-medium leading-[1.13] tracking-[-0.32px]">Edit</div>
                  <div className="mt-1 text-sm text-[#a1a1a9] leading-[1.14]">(203) 927-1280</div>
                </div>
              </div>
            </div>

            <div className="w-full h-px bg-[#e5e5e5] mt-4"></div>

            {/* Collaborators */}
            <div className="flex flex-col mt-4 w-full">
              <div className="text-sm text-[#303030] font-medium leading-[1.14]">Collaborators</div>
              <div className="flex items-center justify-between mt-3 w-full gap-10 text-[#2463eb]">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-10 h-10 bg-white border border-[#2463eb] rounded-full text-xl font-semibold leading-[0.8]">
                    CH
                  </div>
                  <div className="flex items-center justify-center w-10 h-10 bg-white border border-[#2463eb] rounded-full text-xl font-semibold leading-[0.8]">
                    CS
                  </div>
                </div>
                <div className="text-base font-medium leading-[1.13] tracking-[-0.32px]">Edit</div>
              </div>
            </div>

            <div className="w-full h-px bg-[#e5e5e5] mt-4"></div>

            {/* Email Staff */}
            <button className="flex items-center justify-center gap-1 mt-4 w-full text-sm text-[#2463eb] font-medium tracking-[-0.28px] leading-[1.4] hover:underline">
              <Mail className="w-4 h-4" />
              Email staff
            </button>
          </div>

          {/* Vendor Communication Section */}
          <div className="flex flex-col mt-[18px] min-h-[534px]">
            <div className="flex flex-col w-full max-w-[376px] bg-[#f9f9f9] border border-[#e5e5e5] rounded-lg shadow-sm overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between gap-10 px-4 py-4 bg-white border-b border-[#e5e5e5] font-['Geist',sans-serif] text-base text-[#303030]">
                <div className="font-medium leading-[1.25]">Vendor Communication</div>
                <div className="flex items-center gap-3">
                  <button className="flex items-center gap-2 min-h-[28px] px-3 pr-2 py-0.5 bg-[#fbfbfb] border border-[#dadada] rounded-lg shadow-sm tracking-[-0.32px] leading-[1.4] hover:bg-gray-50 transition-colors">
                    English
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <circle cx="10" cy="10" r="1"/>
                    <circle cx="10" cy="4" r="1"/>
                    <circle cx="10" cy="16" r="1"/>
                  </svg>
                </div>
              </div>

              {/* Messages */}
              <div className="px-4 space-y-4 mt-4 font-['Geist',sans-serif]">
                <div className="flex gap-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-white border border-[#2463eb] rounded-full text-sm text-[#2463eb] font-semibold leading-[0.91] flex-shrink-0">
                    MT
                  </div>
                  <div className="flex flex-col min-w-[240px] flex-1 text-black">
                    <div className="text-base font-semibold">Michael Tran</div>
                    <div className="mt-2 text-sm leading-4">
                      I just got back from a hiking trip, and the views were breathtaking! You should try it.
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-white border border-[#2463eb] rounded-full text-sm text-[#2463eb] font-semibold leading-[0.91] flex-shrink-0">
                    SP
                  </div>
                  <div className="flex flex-col min-w-[240px] flex-1 text-black">
                    <div className="text-base font-semibold">Sara Patel</div>
                    <div className="mt-2 text-sm leading-4">
                      The new art exhibit at the gallery opens this weekend. Are you interested in going?
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-white border border-[#2463eb] rounded-full text-sm text-[#2463eb] font-semibold leading-[0.91] flex-shrink-0">
                    DK
                  </div>
                  <div className="flex flex-col min-w-[240px] flex-1 text-black">
                    <div className="text-base font-semibold">David Kim</div>
                    <div className="mt-2 text-sm leading-4">
                      There's a great concert happening in the park next week. We should grab some tickets!
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-white border border-[#2463eb] rounded-full text-sm text-[#2463eb] font-semibold leading-[0.91] flex-shrink-0">
                    EJ
                  </div>
                  <div className="flex flex-col min-w-[240px] flex-1 text-black">
                    <div className="text-base font-semibold">Emma Johnson</div>
                    <div className="mt-2 text-sm leading-4">
                      I found a cute little cafe that serves the best pastries. Want to check it out together?
                    </div>
                  </div>
                </div>
              </div>

              {/* Message Input */}
              <div className="flex flex-col mt-4 w-full">
                <div className="flex flex-col px-4 py-4 bg-white border-b border-[#e5e5e5]">
                  <div className="flex min-h-[98px] w-full max-w-[345px] px-5 py-[17px] bg-white border border-[#2463eb] rounded-lg font-['Geist',sans-serif] text-sm text-black leading-4">
                    <textarea
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder="I found a cute little cafe that serves the best pastries. Want to check it out together? I found a cute little cafe that serves the best pastries. Want to check it out together?"
                      className="flex-1 resize-none focus:outline-none bg-transparent"
                      rows={3}
                    />
                  </div>
                  <div className="flex items-center justify-between gap-10 mt-2.5 w-full py-px overflow-hidden">
                    <button className="flex items-center justify-center w-[33px] min-h-[28px] px-2 py-1.5 bg-[#fbfbfb] border border-[#dadada] rounded-lg shadow-sm hover:bg-gray-50 transition-colors">
                      <Paperclip className="w-[17px] h-[17px]" />
                    </button>
                    <button className="flex items-center gap-1.5 w-[156px] min-h-[28px] px-3 pr-2 py-0.5 bg-[#2463eb] border border-[#dadada] rounded-lg shadow-sm font-['Geist',sans-serif] text-base text-white tracking-[-0.32px] leading-[1.4] hover:bg-[#1d4ed8] transition-colors">
                      Send Message
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
