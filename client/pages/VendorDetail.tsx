import { useState } from "react";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useParams } from "react-router-dom";
import { Plus } from "lucide-react";

interface Vendor {
  id: number;
  name: string;
  category: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  servicesProvided?: string;
}

interface Note {
  id: number;
  text: string;
  date: string;
  author: string;
}

const mockVendors: Vendor[] = [
  {
    id: 1,
    name: "Dolce Heating & Plumbing",
    category: "Uncategorized",
    email: "staff@avappraisalmgmt.com",
    phone: undefined,
    address: undefined,
    website: undefined,
    servicesProvided: undefined,
  },
];

const mockNotes: Note[] = [
  {
    id: 1,
    text: "Southern Conn Gas #05-00011476-6574",
    date: "6/17/2024 10:32 AM",
    author: "Johan Gonazlez",
  },
  {
    id: 2,
    text: "Eversource #51124508037",
    date: "6/17/2024 10:31 AM",
    author: "Johan Gonazlez",
  },
  {
    id: 3,
    text: "Ashley Bae (Daughter): (626) 340-7616",
    date: "6/12/2024 2:31 PM",
    author: "Carteg Hughes",
  },
  {
    id: 4,
    text: "Called Optimum and got the address moved from connors lane to 1544 wazee street denver, co. 80202",
    date: "8/4/2021 10:47 AM",
    author: "Heather Seabrook",
  },
  {
    id: 5,
    text: "Optimum\nAcct#07808-628921-02\n203-293-4709\nPin: 2258",
    date: "3/16/2020 1:59 PM",
    author: "Mario Sciarretta",
  },
];

export default function VendorDetail() {
  const { vendorId } = useParams<{ vendorId: string }>();

  const vendor = mockVendors.find((v) => v.id === Number(vendorId)) || mockVendors[0];

  const [openNoteId, setOpenNoteId] = useState<number | null>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const menuRefMap = useRef<{ [key: number]: HTMLButtonElement | null }>({});

  const [isAddNoteModalOpen, setIsAddNoteModalOpen] = useState(false);
  const [isViewNoteModalOpen, setIsViewNoteModalOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [newNoteContent, setNewNoteContent] = useState("");

  useEffect(() => {
    let animationFrameId: number;

    const updateMenuPos = () => {
      if (openNoteId !== null && menuRefMap.current[openNoteId]) {
        const rect = menuRefMap.current[openNoteId]!.getBoundingClientRect();
        setMenuPos({
          top: rect.bottom + 8,
          left: rect.right - 120,
        });
      }

      if (openNoteId !== null) {
        animationFrameId = requestAnimationFrame(updateMenuPos);
      }
    };

    if (openNoteId !== null) {
      updateMenuPos();
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [openNoteId]);

  const handleTabClick = (tab: string) => {
    // Tab functionality for future use
  };

  return (
    <div className="flex-1 overflow-auto bg-white">
      <div
        className="bg-white"
        style={{
          borderLeftWidth: "1px",
          borderLeftColor: "rgb(210, 209, 207)",
          padding: "32px 32px 150px",
        }}
      >
        <div className="max-w-full flex flex-col gap-6">
          {/* Vendor Header */}
          <div className="flex justify-between items-center w-full">
            <div className="flex flex-col items-start gap-1">
              <h1 className="text-[#303030] font-semibold text-2xl leading-[30px]">
                {vendor.name}
              </h1>
              <div className="flex items-center gap-3">
                <div className="text-[#717179] font-medium text-base leading-4">
                  Vendor
                </div>
                <svg
                  width="4"
                  height="4"
                  viewBox="0 0 4 4"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle cx="2" cy="2" r="2" fill="#717179" />
                </svg>
                <span className="text-[#717179] font-medium text-base leading-4">
                  {vendor.category}
                </span>
                <svg
                  width="4"
                  height="4"
                  viewBox="0 0 4 4"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle cx="2" cy="2" r="2" fill="#717179" />
                </svg>
                <button className="flex items-center gap-1 text-[#2463EB] text-sm font-medium leading-[1.4] tracking-[-0.28px] whitespace-nowrap rounded-lg hover:opacity-80 transition-opacity">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M10.7145 2.68607C11.1052 2.29537 11.7383 2.29537 12.129 2.68607L11.9749 2.84016C12.3656 3.23085 12.3656 3.86402 11.9749 4.25472L5.6117 10.6179C5.46262 10.767 5.28452 10.8795 5.08646 10.9445L2.03645 11.7978C1.74626 11.8816 1.44259 11.7399 1.35879 11.4497L0.505513 8.39971C0.440448 8.20165 0.552982 8.02355 0.701865 7.87467L7.06503 1.51149C7.45572 1.1208 8.08889 1.1208 8.47958 1.51149L10.7145 2.68607Z"
                      fill="currentColor"
                    />
                  </svg>
                  <div>
                    Edit
                  </div>
                </button>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                />
              </div>
              <div className="flex items-center gap-3" />
            </div>
            <div
              className="flex"
              style={{
                flexDirection: "row",
                gap: "8px",
                width: "auto",
                alignSelf: "center",
                justifyContent: "flex-start",
                alignItems: "center",
              }}
            >
              <button
                className="flex h-10 items-center gap-2 px-4 rounded-lg border border-white bg-[#013764] hover:bg-[#003a73] transition-colors"
                style={{
                  boxShadow:
                    "0 0 0 1px #002D5A, 0 0 10px -5px rgba(0, 0, 0, 0.20)",
                }}
              >
                <div className="text-white font-medium text-base leading-normal">
                  Inactivate Vendor
                </div>
              </button>
              <button
                className="flex w-10 h-10 justify-center items-center gap-2.5 rounded-lg border border-[#DADADA] bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] hover:bg-gray-50 transition-colors"
                style={{ borderWidth: "0.5px" }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M9.99984 10.8335C10.4601 10.8335 10.8332 10.4604 10.8332 10.0002C10.8332 9.53993 10.4601 9.16683 9.99984 9.16683C9.5396 9.16683 9.1665 9.53993 9.1665 10.0002C9.1665 10.4604 9.5396 10.8335 9.99984 10.8335Z"
                    stroke="#303030"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M9.99984 5.00016C10.4601 5.00016 10.8332 4.62707 10.8332 4.16683C10.8332 3.70659 10.4601 3.3335 9.99984 3.3335C9.5396 3.3335 9.1665 3.70659 9.1665 4.16683C9.1665 4.62707 9.5396 5.00016 9.99984 5.00016Z"
                    stroke="#303030"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M9.99984 16.6668C10.4601 16.6668 10.8332 16.2937 10.8332 15.8335C10.8332 15.3733 10.4601 15.0002 9.99984 15.0002C9.5396 15.0002 9.1665 15.3733 9.1665 15.8335C9.1665 16.2937 9.5396 16.6668 9.99984 16.6668Z"
                    stroke="#303030"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex h-9 items-start gap-6 self-stretch border-b border-[#E5E5E5]">
            <button
              onClick={() => handleTabClick("Overview")}
              className="flex items-center gap-1.5 pb-2 border-b-[1.5px] border-b-[#09090B] transition-colors"
            >
              <span className="font-medium text-base leading-5 text-[#09090B]">
                Overview
              </span>
            </button>
          </div>

          {/* Content Area */}
          <div className="flex items-start gap-6">
            <div className="flex-1 min-w-[240px] w-full">
              <div className="bg-white border border-[#E5E5E5] rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-4 flex flex-col">
                {/* Vendor Information Section */}
                <div className="flex flex-col font-medium">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <h2 className="text-[#303030] text-xl font-medium leading-[1.1]">
                      Vendor Information
                    </h2>
                    <button className="flex items-center gap-1 text-[#2463EB] text-sm font-medium leading-[1.4] tracking-[-0.28px] whitespace-nowrap rounded-lg hover:opacity-80 transition-opacity">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 14 14"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M10.7145 2.68607C11.1052 2.29537 11.7383 2.29537 12.129 2.68607L11.9749 2.84016C12.3656 3.23085 12.3656 3.86402 11.9749 4.25472L5.6117 10.6179C5.46262 10.767 5.28452 10.8795 5.08646 10.9445L2.03645 11.7978C1.74626 11.8816 1.44259 11.7399 1.35879 11.4497L0.505513 8.39971C0.440448 8.20165 0.552982 8.02355 0.701865 7.87467L7.06503 1.51149C7.45572 1.1208 8.08889 1.1208 8.47958 1.51149L10.7145 2.68607Z"
                          fill="currentColor"
                        />
                      </svg>
                      <span>Edit</span>
                    </button>
                  </div>

                  {/* Contact Details Grid */}
                  <div className="mt-3 flex flex-col whitespace-nowrap">
                    <div className="flex items-start gap-10 flex-wrap">
                      {/* Email */}
                      <div className="flex flex-col w-[220px]">
                        <div className="text-[#71717A] text-xs font-medium leading-[1.33]">
                          EMAIL
                        </div>
                        {vendor.email ? (
                          <div className="mt-1 flex items-center gap-1 text-[#2463EB] text-sm font-medium leading-[1.4] tracking-[-0.28px] rounded-lg">
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 14 14"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M11.6673 11.667H2.33398C1.59961 11.667 1.00065 11.068 1.00065 10.3337V3.66699C1.00065 2.93262 1.59961 2.33366 2.33398 2.33366H11.6673C12.4017 2.33366 13.0007 2.93262 13.0007 3.66699V10.3337C13.0007 11.068 12.4017 11.667 11.6673 11.667Z"
                                stroke="#2463EB"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M1.33398 3.33301L7.00065 7.66634L12.6673 3.33301"
                                stroke="#2463EB"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                            <span>{vendor.email}</span>
                          </div>
                        ) : (
                          <div className="mt-1 text-[#303030] text-sm font-medium leading-[1.29]">
                            --
                          </div>
                        )}
                      </div>

                      {/* Phone */}
                      <div className="flex flex-col">
                        <div className="text-[#71717A] text-xs font-medium leading-[1.33]">
                          PHONE
                        </div>
                        <div className="mt-1 text-[#303030] text-sm font-medium leading-[1.29]">
                          {vendor.phone || "--"}
                        </div>
                      </div>

                      {/* Address */}
                      <div className="flex flex-col">
                        <div className="text-[#71717A] text-xs font-medium leading-[1.33]">
                          ADDRESS
                        </div>
                        <div className="mt-1 text-[#303030] text-sm font-medium leading-[1.29]">
                          {vendor.address || "--"}
                        </div>
                      </div>

                      {/* Website */}
                      <div className="flex flex-col">
                        <div className="text-[#71717A] text-xs font-medium leading-[1.33]">
                          WEBSITE
                        </div>
                        <div className="mt-1 text-[#303030] text-sm font-medium leading-[1.29]">
                          {vendor.website || "--"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Services Provided */}
                  <div className="mt-3 flex flex-col">
                    <div className="flex items-start gap-10">
                      <div className="flex flex-col">
                        <div className="text-[#71717A] text-xs font-medium leading-[1.33]">
                          SERVICES PROVIDED
                        </div>
                        <div className="mt-1 text-[#303030] text-sm font-medium leading-[1.29]">
                          {vendor.servicesProvided || "--"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="mt-5 w-full h-px" style={{ aspectRatio: "1000", objectFit: "contain" }}>
                  <svg width="100%" height="1" xmlns="http://www.w3.org/2000/svg">
                    <line x1="0" y1="0" x2="100%" y2="0" stroke="#E5E5E5" strokeWidth="1" />
                  </svg>
                </div>

                {/* Vendor Insurance Section */}
                <div className="mt-5 flex flex-col font-medium">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <h2 className="text-[#303030] text-xl font-medium leading-[1.1]">
                      Vendor Insurance
                    </h2>
                    <button className="flex items-center gap-1 text-[#2463EB] text-sm font-medium leading-[1.4] tracking-[-0.28px] whitespace-nowrap rounded-lg hover:opacity-80 transition-opacity">
                      <Plus className="w-3 h-3" />
                      <span>Add</span>
                    </button>
                  </div>
                  <p className="mt-3 text-[#303030] text-sm font-medium leading-[1.29]">
                    No vendor insurance information on file.
                  </p>
                </div>

                {/* Divider */}
                <div className="mt-5 w-full h-px">
                  <svg width="100%" height="1" xmlns="http://www.w3.org/2000/svg">
                    <line x1="0" y1="0" x2="100%" y2="0" stroke="#E5E5E5" strokeWidth="1" />
                  </svg>
                </div>

                {/* Custom Fields Section */}
                <div className="mt-5 flex flex-col font-medium">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <h2 className="text-[#303030] text-xl font-medium leading-[1.1]">
                      Custom Fields
                    </h2>
                    <button className="flex items-center gap-1 text-[#2463EB] text-sm font-medium leading-[1.4] tracking-[-0.28px] whitespace-nowrap rounded-lg hover:opacity-80 transition-opacity">
                      <Plus className="w-3 h-3" />
                      <span>Add</span>
                    </button>
                  </div>
                  <div className="mt-3 flex items-center justify-center min-h-[56px] w-full border border-[#DADADA] rounded-lg">
                    <p className="flex-1 text-[#303030] text-sm font-normal leading-[1.29] text-center px-3">
                      There are no custom fields created to track additional information in this location. Contact your administrator to add custom fields.
                    </p>
                  </div>
                </div>

                {/* Divider */}
                <div className="mt-5 w-full h-px">
                  <svg width="100%" height="1" xmlns="http://www.w3.org/2000/svg">
                    <line x1="0" y1="0" x2="100%" y2="0" stroke="#E5E5E5" strokeWidth="1" />
                  </svg>
                </div>

                {/* Recent Notes Section */}
                <div className="mt-5 flex flex-col">
                  <div className="flex items-center justify-between gap-4 flex-wrap font-medium">
                    <h2 className="text-[#303030] text-xl font-medium leading-[1.1]">
                      Recent Notes
                    </h2>
                    <button
                      onClick={() => {
                        setNewNoteContent("");
                        setIsAddNoteModalOpen(true);
                      }}
                      className="flex items-center gap-1 text-[#2463EB] text-sm font-medium leading-[1.4] tracking-[-0.28px] whitespace-nowrap rounded-lg hover:opacity-80 transition-opacity"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add</span>
                    </button>
                  </div>
                  {mockNotes.length === 0 ? (
                    <div className="mt-3 flex items-center gap-1 w-full px-3 py-1.5 bg-[#F9F9F9] border border-[#DADADA] rounded">
                      <p className="text-[#303030] text-sm font-normal leading-[1.29]">
                        You don't have any notes for this vendor right now.{" "}
                        <span className="font-medium text-[#2463EB] cursor-pointer hover:underline">
                          Add your first note
                        </span>
                      </p>
                    </div>
                  ) : (
                    <div className="mt-3 border border-[#DADADA] rounded-lg overflow-hidden">
                      {mockNotes.map((note) => (
                        <div
                          key={note.id}
                          className="flex items-center justify-between gap-6 px-3 py-2 border-b border-[#DADADA] last:border-b-0"
                        >
                          <div className="flex-1 text-[#303030] text-sm font-normal leading-[1.29] whitespace-pre-line">
                            {note.text}
                          </div>
                          <div className="flex items-center gap-8 min-w-[240px]">
                            <div className="text-[#303030] text-sm font-normal leading-[1.29] w-[153px]">
                              {note.date}
                            </div>
                            <div className="text-[#303030] text-sm font-normal leading-[1.29] w-[118px]">
                              {note.author}
                            </div>
                            <button
                              ref={(el) => {
                                if (el) menuRefMap.current[note.id] = el;
                              }}
                              onClick={() =>
                                setOpenNoteId(openNoteId === note.id ? null : note.id)
                              }
                              className="w-4 h-4 flex items-center justify-center hover:opacity-70 transition-opacity relative"
                            >
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <circle cx="12" cy="12" r="1" />
                                <circle cx="19" cy="12" r="1" />
                                <circle cx="5" cy="12" r="1" />
                              </svg>
                            </button>

                            {openNoteId === note.id &&
                              createPortal(
                                <div
                                  className="bg-white flex flex-col justify-center items-start gap-4 p-4"
                                  style={{
                                    width: "120px",
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
                                  onMouseLeave={() => setOpenNoteId(null)}
                                >
                                  <button
                                    onClick={() => {
                                      setSelectedNote(note);
                                      setIsViewNoteModalOpen(true);
                                      setOpenNoteId(null);
                                    }}
                                    className="w-full text-left text-[#303030] font-normal text-base leading-[140%] tracking-[-0.32px] hover:opacity-70 transition-opacity"
                                    style={{
                                      fontFamily:
                                        "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                                    }}
                                  >
                                    View
                                  </button>
                                  <button
                                    onClick={() => {
                                      const updatedNotes = mockNotes.filter((n) => n.id !== note.id);
                                      Object.assign(mockNotes, updatedNotes);
                                      setOpenNoteId(null);
                                    }}
                                    className="w-full text-left text-[#982740] font-normal text-base leading-[140%] tracking-[-0.32px] hover:opacity-70 transition-opacity"
                                    style={{
                                      fontFamily:
                                        "Geist, -apple-system, Roboto, Helvetica, sans-serif",
                                    }}
                                  >
                                    Delete
                                  </button>
                                </div>,
                                document.body,
                              )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div className="mt-5 w-full h-px">
                  <svg width="100%" height="1" xmlns="http://www.w3.org/2000/svg">
                    <line x1="0" y1="0" x2="100%" y2="0" stroke="#E5E5E5" strokeWidth="1" />
                  </svg>
                </div>

                {/* Recent Files Section */}
                <div className="mt-5 flex flex-col">
                  <div className="flex items-center justify-between gap-4 flex-wrap font-medium">
                    <h2 className="text-[#303030] text-xl font-medium leading-[1.1]">
                      Recent Files
                    </h2>
                    <button className="flex items-center gap-1 text-[#2463EB] text-sm font-medium leading-[1.4] tracking-[-0.28px] whitespace-nowrap rounded-lg hover:opacity-80 transition-opacity">
                      <Plus className="w-3 h-3" />
                      <span>Add</span>
                    </button>
                  </div>
                  <div className="mt-3 flex items-center gap-1 w-full px-3 py-1.5 bg-[#F9F9F9] border border-[#DADADA] rounded">
                    <p className="text-[#303030] text-sm font-normal leading-[1.29]">
                      You don't have any files for this vendor right now.{" "}
                      <span className="font-medium text-[#2463EB] cursor-pointer hover:underline">
                        Add your first file
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Note Modal */}
      {isAddNoteModalOpen &&
        createPortal(
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
              <h2 className="text-[#303030] text-xl font-semibold mb-4">
                Add Note
              </h2>
              <textarea
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                placeholder="Enter your note here..."
                className="w-full border border-[#DADADA] rounded-lg p-3 mb-4 focus:outline-none focus:ring-2 focus:ring-[#2463EB] min-h-[120px]"
              />
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setIsAddNoteModalOpen(false)}
                  className="px-4 py-2 border border-[#DADADA] rounded-lg text-[#303030] font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (newNoteContent.trim()) {
                      const newNote: Note = {
                        id: Math.max(...mockNotes.map((n) => n.id), 0) + 1,
                        text: newNoteContent,
                        date: new Date().toLocaleString(),
                        author: "Current User",
                      };
                      mockNotes.unshift(newNote);
                      setIsAddNoteModalOpen(false);
                      setNewNoteContent("");
                    }
                  }}
                  className="px-4 py-2 bg-[#013764] text-white rounded-lg font-medium hover:bg-[#003a73] transition-colors"
                >
                  Save Note
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* View Note Modal */}
      {isViewNoteModalOpen && selectedNote &&
        createPortal(
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
              <h2 className="text-[#303030] text-xl font-semibold mb-4">
                Note Details
              </h2>
              <div className="mb-4">
                <div className="text-[#303030] whitespace-pre-line mb-4 p-3 bg-gray-50 rounded-lg">
                  {selectedNote.text}
                </div>
                <div className="text-sm text-[#71717A] mb-2">
                  <span className="font-medium">Author:</span> {selectedNote.author}
                </div>
                <div className="text-sm text-[#71717A]">
                  <span className="font-medium">Date:</span> {selectedNote.date}
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setIsViewNoteModalOpen(false);
                    setSelectedNote(null);
                  }}
                  className="px-4 py-2 border border-[#DADADA] rounded-lg text-[#303030] font-medium hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setIsViewNoteModalOpen(false);
                    setNewNoteContent(selectedNote.text);
                    setSelectedNote(null);
                  }}
                  className="px-4 py-2 bg-[#013764] text-white rounded-lg font-medium hover:bg-[#003a73] transition-colors"
                >
                  Edit
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
