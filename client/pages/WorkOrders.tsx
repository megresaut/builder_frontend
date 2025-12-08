import { useState } from "react";
import {
  ChevronDown,
  Calendar,
  Edit,
  Upload,
  MapPin,
  Mail,
  Send,
  Paperclip,
} from "lucide-react";

export default function WorkOrders() {
  const [activeFileTab, setActiveFileTab] = useState("all");
  const [activeAssigneeTab, setActiveAssigneeTab] = useState("staff");
  const [messageText, setMessageText] = useState("");
  const [notesText, setNotesText] = useState("");

  return (
    <div className="flex w-full gap-6 flex-wrap lg:flex-nowrap">
      {/* Left Column */}
      <div className="flex flex-col min-w-[240px] flex-1">
        {/* Work Order Details Card */}
        <div className="flex flex-col w-full px-4 py-4 bg-white border border-[#e5e5e5] rounded-lg shadow-sm">
          <div className="flex w-full gap-4 flex-wrap lg:flex-nowrap">
            {/* Property Image */}
            <img
              src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/a778dc0c324c3b12d3592c96c97db0f2241bffe1?placeholderIfAbsent=true"
              alt="Property"
              className="w-full lg:w-[251px] aspect-[1.31] rounded-lg object-cover min-w-[240px]"
            />

            {/* Work Order Info */}
            <div className="flex flex-col min-w-[240px] flex-1 font-['Geist',sans-serif]">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex flex-col flex-1 min-w-[240px]">
                  <div className="flex items-center gap-2">
                    <h2 className="text-[#303030] text-[22px] font-semibold leading-[1.36]">
                      HVAC - #1024431-1
                    </h2>
                    <button className="flex items-center gap-1 text-base text-[#2463eb] font-medium tracking-[-0.32px] hover:underline">
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                  </div>
                  <div className="flex flex-col mt-4 text-sm text-[#717179] font-medium">
                    <div>Created by Julia LoSchiavo for</div>
                    <div className="mt-2 font-bold text-[#2463eb]">
                      (C) 51 Willowmere Circle, Riverside CT 06878 -1
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-sm text-[#717179] tracking-[-0.28px]">
                  <span>Created</span>
                  <span>11/12/2025 9:22 PM</span>
                </div>
              </div>

              {/* Invoice Details */}
              <div className="flex items-end justify-between gap-4 mt-6 flex-wrap">
                <div className="flex flex-col gap-3 text-sm text-[#717179] min-w-[240px] flex-1">
                  <div className="flex items-center gap-1">
                    <span className="font-semibold">Invoice Number:</span>
                    <span className="font-medium">234605</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-semibold">Vendor:</span>
                    <span className="font-medium">Dolce Plumbing & Heating LLC</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-semibold">Charge Work To:</span>
                    <span className="font-medium">Owner</span>
                  </div>
                </div>
                <button className="flex items-center gap-2 min-h-[40px] px-4 py-2.5 bg-[#f9f9f9] border border-[#dadada] rounded-lg shadow-sm text-sm text-[#2463eb] font-medium tracking-[-0.28px] hover:bg-gray-50 transition-colors">
                  <MapPin className="w-4 h-4" />
                  View Maps
                </button>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="w-full h-px bg-[#e5e5e5] mt-5"></div>

          {/* Totals */}
          <div className="flex items-center gap-4 mt-5 flex-wrap font-['Geist',sans-serif]">
            <div className="flex flex-col px-4 py-4 bg-[#f9f9f9] border border-[#dadada] rounded-lg min-w-[240px] flex-1">
              <div className="text-sm text-[#717179]">ESTIMATE TOTAL</div>
              <div className="mt-1 text-2xl text-[#303030] font-medium">$1,450.50</div>
            </div>
            <div className="flex flex-col px-4 py-4 bg-[#f9f9f9] border border-[#dadada] rounded-lg min-w-[240px] flex-1">
              <div className="text-sm text-[#717179]">WORK ORDER TOTAL</div>
              <div className="mt-1 text-2xl text-[#303030] font-medium">$1,350.00</div>
            </div>
          </div>

          {/* Notes and Files Section */}
          <div className="flex gap-5 mt-5 flex-wrap">
            {/* Notes */}
            <div className="flex flex-col px-4 py-4 bg-white border border-[#e5e5e5] rounded-lg min-w-[240px] flex-1 font-['Geist',sans-serif]">
              <div className="text-base text-[#303030] font-medium">Notes</div>
              <textarea
                value={notesText}
                onChange={(e) => setNotesText(e.target.value)}
                placeholder="Add some note here"
                className="mt-6 min-h-[81px] w-full px-3 py-2 bg-[#f9f9f9] border border-[#dadada] rounded-lg text-sm text-[#303030] placeholder:text-[#a1a1a9] resize-none focus:outline-none focus:border-[#2463eb]"
                rows={4}
              />
            </div>

            {/* Files */}
            <div className="flex flex-col px-4 py-4 bg-white border border-[#e5e5e5] rounded-lg min-w-[240px] flex-1 font-['Geist',sans-serif]">
              <div className="text-base text-[#303030] font-medium">Files</div>
              
              {/* File Type Tabs */}
              <div className="flex items-start gap-0.5 mt-2 px-0.5 py-0.5 bg-[#f9f9f9] border border-[#d2d1cf] rounded-lg text-sm text-[#282828] text-center">
                <button
                  onClick={() => setActiveFileTab("all")}
                  className={`flex items-center justify-center flex-1 px-4 py-1.5 rounded-md ${
                    activeFileTab === "all"
                      ? "bg-white shadow-sm text-[#09090b] font-medium"
                      : "bg-transparent"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setActiveFileTab("estimates")}
                  className={`flex items-center justify-center flex-1 px-2 py-1.5 rounded-md ${
                    activeFileTab === "estimates"
                      ? "bg-white shadow-sm text-[#09090b] font-medium"
                      : "bg-transparent"
                  }`}
                >
                  Estimates (1)
                </button>
                <button
                  onClick={() => setActiveFileTab("bills")}
                  className={`flex items-center justify-center flex-1 px-4 py-1.5 rounded-md ${
                    activeFileTab === "bills"
                      ? "bg-white shadow-sm text-[#09090b] font-medium"
                      : "bg-transparent"
                  }`}
                >
                  Bills (1)
                </button>
                <button
                  onClick={() => setActiveFileTab("other")}
                  className={`flex items-center justify-center flex-1 px-4 py-1.5 rounded-md ${
                    activeFileTab === "other"
                      ? "bg-white shadow-sm text-[#09090b] font-medium"
                      : "bg-transparent"
                  }`}
                >
                  Other
                </button>
              </div>

              {/* Upload Area */}
              <div className="flex flex-col items-center px-4 py-4 mt-4 bg-[#f9f9f9] border border-dashed border-[rgba(18,18,18,0.4)] rounded-lg">
                <button className="flex items-center gap-2 min-h-[36px] px-3 bg-white border border-[#dadada] rounded-lg shadow-sm text-base text-[#303030] tracking-[-0.32px] hover:bg-gray-50 transition-colors">
                  <Upload className="w-4 h-4" />
                  Upload
                </button>
                <div className="mt-2 px-2.5 py-2.5 flex flex-col items-center text-sm text-[#09090b]">
                  <div>Choose a file or drag & drop it here</div>
                  <div className="mt-1.5">Maximum 500 MB file size</div>
                </div>
              </div>

              {/* File List */}
              <div className="flex flex-col mt-6">
                <div className="flex items-center gap-2 text-sm text-[#09090b] font-medium">
                  <span>Files</span>
                </div>
                <div className="flex flex-col gap-2 mt-2 w-full max-w-[270px]">
                  {[1, 2].map((i) => (
                    <div key={i} className="flex items-center justify-between gap-3 px-3 py-3 bg-[#fbfbfb] border border-[#e5e5e5] rounded-lg shadow-sm">
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        <div className="flex-shrink-0 w-8 h-8 bg-[#ef4444] rounded flex items-center justify-center">
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="white">
                            <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize="8" fontWeight="600">PDF</text>
                          </svg>
                        </div>
                        <div className="flex flex-col min-w-0 flex-1 font-['Inter',sans-serif]">
                          <div className="text-xs text-[#181932] truncate">Lorem Ipsum.PDF</div>
                          <div className="flex items-center gap-2 text-[10px] text-[#717179] mt-0.5">
                            <span>PDF</span>
                          </div>
                        </div>
                      </div>
                      <button className="flex-shrink-0 w-4 h-4 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M2 14L14 2M14 14L2 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="flex flex-col min-w-[240px] w-[376px]">
        {/* Bills Section */}
        <div className="flex flex-col w-full px-4 py-4 bg-white border border-[#e5e5e5] rounded-lg shadow-sm font-['Geist',sans-serif]">
          <div className="text-base text-[#303030] font-medium">Bills</div>
          <div className="flex flex-col px-4 py-4 mt-4 bg-[#f9f9f9] border border-[#dadada] rounded-lg">
            <div className="flex items-start gap-6 text-sm text-[#717179] tracking-[-0.28px]">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>November 27</span>
              </div>
              <div className="flex items-center gap-1">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M8 4v4l3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <span>5:00 PM</span>
              </div>
            </div>
            <div className="mt-3 text-base text-[#303030] font-medium tracking-[-0.32px]">
              234605 - Dolce Heating & Plumbing
            </div>
            <div className="flex items-start justify-between gap-10 mt-6 flex-wrap">
              <div className="text-2xl text-[#2463eb] font-medium">$1,350.00</div>
              <div className="flex items-center gap-1 min-h-[32px] px-3.5 py-1.5 bg-white border border-[#059669] rounded-full text-base text-[#059669] font-medium tracking-[-0.32px]">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3.5 7L5.83333 9.33333L10.5 4.66667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>Paid</span>
              </div>
            </div>
          </div>
        </div>

        {/* Assignees Section */}
        <div className="flex flex-col w-full mt-[18px] px-4 py-4 bg-[#f9f9f9] border border-[#e5e5e5] rounded-lg shadow-sm font-['Geist',sans-serif]">
          <div className="text-base text-[#303030] font-medium">Assignees</div>
          
          {/* Assignee Type Tabs */}
          <div className="flex items-start gap-0.5 mt-4 px-0.5 py-0.5 bg-[#f2f2f2] border border-[#d2d1cf] rounded-lg text-sm text-[#282828] text-center">
            <button
              onClick={() => setActiveAssigneeTab("staff")}
              className={`flex items-center justify-center flex-1 px-4 py-1.5 rounded-md ${
                activeAssigneeTab === "staff"
                  ? "bg-white shadow-sm text-[#09090b] font-medium"
                  : "bg-transparent"
              }`}
            >
              Staff
            </button>
            <button
              onClick={() => setActiveAssigneeTab("vendors")}
              className={`flex items-center justify-center flex-1 px-4 py-1.5 rounded-md ${
                activeAssigneeTab === "vendors"
                  ? "bg-white shadow-sm text-[#09090b] font-medium"
                  : "bg-transparent"
              }`}
            >
              Vendors
            </button>
          </div>

          {/* Assigned to */}
          <div className="flex flex-col mt-4">
            <div className="text-sm text-[#303030] font-medium">Assigned to</div>
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-2.5 min-w-[240px] flex-1">
                <div className="flex items-center justify-center w-10 h-10 bg-white border border-[#2463eb] rounded-full text-xl text-[#2463eb] font-semibold leading-[0.8]">
                  JL
                </div>
                <div className="flex flex-col flex-1 text-sm">
                  <div className="text-[#2463eb] font-medium tracking-[-0.28px]">Julia LoSchiavo</div>
                  <div className="mt-1 text-[#a1a1a9]">Staff member</div>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <div className="text-base text-[#2463eb] font-medium tracking-[-0.32px] cursor-pointer hover:underline">Edit</div>
                <div className="mt-1 text-sm text-[#a1a1a9]">(203) 927-1280</div>
              </div>
            </div>
          </div>

          <div className="w-full h-px bg-[#e5e5e5] mt-4"></div>

          {/* Collaborators */}
          <div className="flex flex-col mt-4">
            <div className="text-sm text-[#303030] font-medium">Collaborators</div>
            <div className="flex items-center justify-between mt-3 gap-10 text-[#2463eb]">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-10 h-10 bg-white border border-[#2463eb] rounded-full text-xl font-semibold leading-[0.8]">
                  CH
                </div>
                <div className="flex items-center justify-center w-10 h-10 bg-white border border-[#2463eb] rounded-full text-xl font-semibold leading-[0.8]">
                  CS
                </div>
              </div>
              <div className="text-base font-medium tracking-[-0.32px] cursor-pointer hover:underline">Edit</div>
            </div>
          </div>

          <div className="w-full h-px bg-[#e5e5e5] mt-4"></div>

          {/* Email Staff Button */}
          <button className="flex items-center justify-center gap-1 mt-4 text-sm text-[#2463eb] font-medium tracking-[-0.28px] hover:underline">
            <Mail className="w-4 h-4" />
            Email staff
          </button>
        </div>

        {/* Vendor Communication Section */}
        <div className="flex flex-col mt-[18px]">
          <div className="flex flex-col w-full max-w-[376px] bg-[#f9f9f9] border border-[#e5e5e5] rounded-lg shadow-sm overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between gap-10 px-4 py-4 bg-white border-b border-[#e5e5e5] font-['Geist',sans-serif] text-base text-[#303030]">
              <div className="font-medium">Vendor Communication</div>
              <div className="flex items-center gap-3">
                <button className="flex items-center gap-2 min-h-[28px] px-3 py-0.5 bg-[#fbfbfb] border border-[#dadada] rounded-lg shadow-sm tracking-[-0.32px] hover:bg-gray-50 transition-colors">
                  English
                  <ChevronDown className="w-4 h-4" />
                </button>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="10" r="1.5" fill="currentColor" />
                  <circle cx="10" cy="5" r="1.5" fill="currentColor" />
                  <circle cx="10" cy="15" r="1.5" fill="currentColor" />
                </svg>
              </div>
            </div>

            {/* Message List */}
            <div className="px-4 space-y-4 mt-4 font-['Geist',sans-serif]">
              {[
                { initials: "MT", name: "Michael Tran", message: "I just got back from a hiking trip, and the views were breathtaking! You should try it." },
                { initials: "SP", name: "Sara Patel", message: "The new art exhibit at the gallery opens this weekend. Are you interested in going?" },
                { initials: "DK", name: "David Kim", message: "There's a great concert happening in the park next week. We should grab some tickets!" },
                { initials: "EJ", name: "Emma Johnson", message: "I found a cute little cafe that serves the best pastries. Want to check it out together?" }
              ].map((msg, idx) => (
                <div key={idx} className="flex gap-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-white border border-[#2463eb] rounded-full text-sm text-[#2463eb] font-semibold leading-[0.91] flex-shrink-0">
                    {msg.initials}
                  </div>
                  <div className="flex flex-col min-w-[240px] flex-1 text-black">
                    <div className="text-base font-semibold">{msg.name}</div>
                    <div className="mt-2 text-sm leading-4">{msg.message}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <div className="flex flex-col mt-4 w-full">
              <div className="flex flex-col px-4 py-4 bg-white border-b border-[#e5e5e5]">
                <div className="min-h-[98px] w-full max-w-[345px] px-5 py-[17px] bg-white border border-[#2463eb] rounded-lg font-['Geist',sans-serif] text-sm text-black leading-4">
                  <textarea
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="I found a cute little cafe that serves the best pastries. Want to check it out together? I found a cute little cafe that serves the best pastries. Want to check it out together?"
                    className="w-full min-h-[64px] resize-none focus:outline-none bg-transparent"
                  />
                </div>
                <div className="flex items-center justify-between gap-10 mt-2.5 w-full py-px overflow-hidden">
                  <button className="flex items-center justify-center w-[33px] min-h-[28px] px-2 py-1.5 bg-[#fbfbfb] border border-[#dadada] rounded-lg shadow-sm hover:bg-gray-50 transition-colors">
                    <Paperclip className="w-[17px] h-[17px]" />
                  </button>
                  <button className="flex items-center gap-1.5 w-[156px] min-h-[28px] px-3 pr-2 py-0.5 bg-[#2463eb] border border-[#dadada] rounded-lg shadow-sm font-['Geist',sans-serif] text-base text-white tracking-[-0.32px] hover:bg-[#1d4ed8] transition-colors">
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
  );
}
