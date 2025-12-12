import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

interface PropertyDetailsProps {
  propertyAddress: string;
  propertyLocation?: string;
  rentalOwner?: string;
  propertyManager?: string;
  propertyImage?: string;
}

type RecentNote = {
  id: number;
  text: string;
  type: string;
  date: string;
  author: string;
};

type RecentFile = {
  id: number;
  name: string;
  subtitle?: string;
  category: string;
  date: string;
  author: string;
  type: string;
  icon: string;
};

export const PropertyDetails: React.FC<PropertyDetailsProps> = ({
  propertyAddress,
  propertyLocation = "Westport, CT, 28282",
  rentalOwner = "Eunice Bae",
  propertyManager = "Jake Delardi",
  propertyImage = "https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/b1dce1b4ec8292553f371f2747d334a444b1a4aa?placeholderIfAbsent=true",
}) => {
  const [showMoreCustomFields, setShowMoreCustomFields] = useState(false);
  const [showMoreRates, setShowMoreRates] = useState(false);
  const [showPhotoUploadModal, setShowPhotoUploadModal] = useState(false);
  const [showEditPropertyModal, setShowEditPropertyModal] = useState(false);
  const [showEditCustomFieldsModal, setShowEditCustomFieldsModal] = useState(false);
  const [showEditRatesModal, setShowEditRatesModal] = useState(false);
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);
  const [showAddFileModal, setShowAddFileModal] = useState(false);
  const [showViewNoteModal, setShowViewNoteModal] = useState(false);
  const [showViewFileModal, setShowViewFileModal] = useState(false);

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });

  const [noteDraft, setNoteDraft] = useState("");
  const [fileDraft, setFileDraft] = useState<File | null>(null);
  const [selectedNote, setSelectedNote] = useState<RecentNote | null>(null);
  const [selectedFile, setSelectedFile] = useState<RecentFile | null>(null);

  const [recentNotes, setRecentNotes] = useState<RecentNote[]>([
    {
      id: 1,
      text: "Southern Conn Gas #05-00011476-6574",
      type: "RENTAL",
      date: "6/17/2024 10:32 AM",
      author: "Johan Gonazlez",
    },
    {
      id: 2,
      text: "Eversource #51124508037",
      type: "RENTAL",
      date: "6/17/2024 10:31 AM",
      author: "Johan Gonazlez",
    },
    {
      id: 3,
      text: "Ashley Bae (Daughter): (626) 340-7616",
      type: "RENTAL",
      date: "6/12/2024 2:31 PM",
      author: "Carteg Hughes",
    },
    {
      id: 4,
      text: "Called Optimum and got the address moved from connors lane to 1544 wazee street denver, co. 80202",
      type: "RENTAL",
      date: "8/4/2021 10:47 AM",
      author: "Heather Seabrook",
    },
    {
      id: 5,
      text: "Optimum\nAcct#07808-628921-02\n203-293-4709\nPin: 2258",
      type: "RENTAL",
      date: "3/16/2020 1:59 PM",
      author: "Mario Sciarretta",
    },
  ]);

  const [recentFiles, setRecentFiles] = useState<RecentFile[]>([
    {
      id: 1,
      name: "1 Connors Lane - Maintenance Log.docx",
      category: "Uncategorized",
      date: "6/3/2025 2:06 PM",
      author: "Julia LoSchiavo",
      type: "docx",
      icon: "https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/07da6a33a78bd70b7170adaa97b3fb7b14ff2fc0?placeholderIfAbsent=true",
    },
    {
      id: 2,
      name: "1 Connors Lane Westport, CT 06883 Manage...",
      subtitle: "Management Agreement",
      category: "Uncategorized",
      date: "6/19/2024 3:55 PM",
      author: "Carter Hughes",
      type: "pdf",
      icon: "https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/5ef69f3c3e2f3e3b15cc6139a16a94f848b10be7?placeholderIfAbsent=true",
    },
    {
      id: 3,
      name: "1 Connors Lane- Management Contract",
      category: "Uncategorized",
      date: "1/7/2020 2:14 PM",
      author: "Mario Sciarretta",
      type: "pdf",
      icon: "https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/5ef69f3c3e2f3e3b15cc6139a16a94f848b10be7?placeholderIfAbsent=true",
    },
  ]);

  const handleDeleteNote = (id: number) => {
    setRecentNotes((prev) => prev.filter((note) => note.id !== id));
    setOpenMenuId(null);
    setSelectedNote(null);
    setShowViewNoteModal(false);
  };

  const handleDeleteFile = (id: number) => {
    setRecentFiles((prev) => prev.filter((file) => file.id !== id));
    setOpenMenuId(null);
    setSelectedFile(null);
    setShowViewFileModal(false);
  };

  const openViewMaps = () => {
    const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(`${propertyAddress}, ${propertyLocation}`)}`;
    window.open(mapsUrl, "_blank");
  };

  // Action Menu Component
  const ActionMenu = ({ itemId, onView, onDelete }: { itemId: string; onView: () => void; onDelete: () => void }) => {
    const buttonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
      if (openMenuId === itemId && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        const menuWidth = 145;
        const padding = 8;
        const desiredLeft = rect.right - menuWidth;
        const left = Math.min(
          Math.max(padding, desiredLeft),
          Math.max(padding, window.innerWidth - menuWidth - padding),
        );

        setMenuPos({
          top: rect.bottom + 8,
          left,
        });
      }
    }, [openMenuId]);

    return (
      <>
        <button
          ref={buttonRef}
          onClick={() => setOpenMenuId(openMenuId === itemId ? null : itemId)}
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

        {openMenuId === itemId &&
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
              <button
                onClick={() => {
                  onView();
                  setOpenMenuId(null);
                }}
                className="flex justify-between items-center w-full hover:opacity-70 transition-opacity"
              >
                <span className="text-[#303030] font-normal text-base leading-[140%] tracking-[-0.32px]">View</span>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M2 12C2 12 5.5 5 12 5C18.5 5 22 12 22 12C22 12 18.5 19 12 19C5.5 19 2 12 2 12Z"
                    stroke="#525252"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="12" cy="12" r="3" stroke="#525252" strokeWidth="1.5" />
                </svg>
              </button>
              <button
                onClick={() => {
                  onDelete();
                  setOpenMenuId(null);
                }}
                className="flex justify-between items-center w-full hover:opacity-70 transition-opacity"
              >
                <span className="text-[#303030] font-normal text-base leading-[140%] tracking-[-0.32px]">Delete</span>
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

  return (
    <div className="flex justify-center font-[Geist,-apple-system,Roboto,Helvetica,sans-serif]">
      <div className="flex flex-col w-full min-w-[240px]">
        <div className="rounded-lg bg-white shadow-[0_1px_3px_rgba(0,0,0,0.03)] border border-[#E5E5E5] flex flex-col w-full p-4">
          {/* Property Details Section */}
          <div className="flex flex-col w-full font-medium">
            <div className="flex w-full items-center justify-between gap-4 flex-wrap">
              <div className="text-[#303030] text-xl leading-[1.1]">
                Property Details
              </div>
              <button onClick={() => setShowEditPropertyModal(true)} className="rounded-lg flex items-center gap-1 text-sm text-[#2463EB] tracking-[-0.28px] leading-[1.4]">
                <img
                  loading="lazy"
                  src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/f92d3adcec91cdb58440abba9eb347ee0521346c?placeholderIfAbsent=true"
                  className="w-3 h-3"
                  alt=""
                />
                <span>Edit</span>
              </button>
            </div>

            <div className="flex mt-3 w-full items-start gap-4 flex-wrap">
              <img
                loading="lazy"
                srcSet={`${propertyImage}&width=100 100w, ${propertyImage}&width=200 200w, ${propertyImage}&width=400 400w`}
                src={propertyImage}
                className="rounded-lg min-w-[240px] w-[251px] aspect-[1.57] object-cover"
                alt="Property"
              />
              <div className="flex min-w-[240px] min-h-[160px] flex-col justify-center flex-1">
                <div className="flex flex-col w-full max-w-[423px]">
                  <div className="text-[#71717A] text-xs leading-[1.33]">
                    ADDRESS
                  </div>
                  <div className="text-[#303030] text-base leading-[1.13] mt-1">
                    <div>{propertyAddress}</div>
                    <div>{propertyLocation}</div>
                  </div>
                  <button onClick={openViewMaps} className="rounded-lg self-start flex mt-1 items-center gap-1 text-sm text-[#2463EB] tracking-[-0.28px] leading-[1.4]">
                    <img
                      loading="lazy"
                      src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/8eb71e6b8a164f52539454633c48318f2d6d3eee?placeholderIfAbsent=true"
                      className="w-[14px] h-[14px]"
                      alt=""
                    />
                    <span>View Maps</span>
                  </button>
                </div>

                <div className="flex mt-5 w-full items-start gap-14 flex-1">
                  <div className="flex flex-col">
                    <div className="text-[#71717A] text-xs leading-[1.33]">
                      RENTAL OWNERS
                    </div>
                    <div className="flex self-start mt-1 items-end gap-2 text-base text-[#303030] leading-[1.13]">
                      <div>{rentalOwner}</div>
                    </div>
                  </div>
                  <div className="flex min-h-[98px] flex-col">
                    <div className="text-[#71717A] text-xs leading-[1.33]">
                      PROPERTY MANAGERS
                    </div>
                    <div className="text-[#303030] text-base leading-[1.13] mt-1">
                      {propertyManager}
                    </div>
                  </div>
                </div>

                <button onClick={() => setShowPhotoUploadModal(true)} className="rounded-lg self-start flex mt-5 items-center gap-1 text-sm text-[#2463EB] tracking-[-0.28px] leading-[1.4]">
                  <img
                    loading="lazy"
                    src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/d427594bd49179e577cb5955600fc9901bcd3437?placeholderIfAbsent=true"
                    className="w-[14px] h-[14px]"
                    alt=""
                  />
                  <span>Upload Photo</span>
                </button>
              </div>
            </div>
          </div>

          {/* Separator */}
          <img
            loading="lazy"
            src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/993a5d1a37af0ace04ef2b831d3364f722125c87?placeholderIfAbsent=true"
            className="w-full mt-5"
            alt=""
          />

          {/* Separator */}
          <img
            loading="lazy"
            src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/993a5d1a37af0ace04ef2b831d3364f722125c87?placeholderIfAbsent=true"
            className="w-full mt-5"
            alt=""
          />

          {/* Custom Fields and Rates Section */}
          <div className="flex mt-5 w-full items-start gap-5 font-medium flex-wrap">
            <div className="flex min-w-[240px] flex-col flex-1">
              <div className="flex w-full items-center justify-between gap-4 flex-wrap">
                <div className="text-[#303030] text-xl leading-[1.1]">
                  Custom Fields
                </div>
                <button onClick={() => setShowEditCustomFieldsModal(true)} className="rounded-lg flex items-center gap-1 text-sm text-[#2463EB] tracking-[-0.28px] leading-[1.4]">
                  <img
                    loading="lazy"
                    src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/f92d3adcec91cdb58440abba9eb347ee0521346c?placeholderIfAbsent=true"
                    className="w-3 h-3"
                    alt=""
                  />
                  <span>Edit</span>
                </button>
              </div>

              <div className="flex mt-3 w-full flex-col">
                <div className="flex flex-col w-full">
                  <div className="text-[#303030] text-base leading-[1.38]">
                    Agreement
                  </div>
                  <div className="self-start flex mt-3 items-start gap-14 text-xs text-[#71717A] leading-[1.33]">
                    <div className="flex flex-col">
                      <div>MANAGEMENT AGREEMENT DATE</div>
                      <div>-</div>
                    </div>
                    <div className="flex flex-col">
                      <div>INSPECTION FREQUENCY</div>
                      <div>Monthly</div>
                    </div>
                  </div>
                </div>

                <div className="flex mt-5 w-full flex-col">
                  <div className="text-[#303030] text-base leading-[1.38]">
                    Vendor Agreement
                  </div>
                  <div className="self-start flex mt-3 items-start gap-14 text-xs text-[#71717A] leading-[1.33]">
                    <div className="flex flex-col">
                      <div>HVAC START</div>
                      <div>-</div>
                    </div>
                    <div className="flex flex-col">
                      <div>HVAC END</div>
                      <div>-</div>
                    </div>
                    <div className="flex flex-col">
                      <div>LANDSCAPING START</div>
                      <div>-</div>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowMoreCustomFields(!showMoreCustomFields)}
                    className="text-[#2463EB] text-sm leading-[1.4] tracking-[-0.28px] mt-3 text-left"
                  >
                    {showMoreCustomFields ? "Show less" : "Show more"}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex min-w-[240px] flex-col flex-1">
              <div className="flex w-full items-center justify-between gap-4 flex-wrap whitespace-nowrap">
                <div className="text-[#303030] text-xl leading-[1.1]">Rates</div>
                <button onClick={() => setShowEditRatesModal(true)} className="rounded-lg flex items-center gap-1 text-sm text-[#2463EB] tracking-[-0.28px] leading-[1.4]">
                  <img
                    loading="lazy"
                    src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/f92d3adcec91cdb58440abba9eb347ee0521346c?placeholderIfAbsent=true"
                    className="w-3 h-3"
                    alt=""
                  />
                  <span>Edit</span>
                </button>
              </div>

              <div className="flex mt-3 w-full flex-col">
                <div className="flex flex-col w-full">
                  <div className="text-[#303030] text-base leading-[1.38]">
                    Management Fee
                  </div>
                  <div className="self-start flex mt-3 items-start gap-14 text-xs text-[#71717A] leading-[1.33]">
                    <div className="flex flex-col">
                      <div>MONTHLY RATE</div>
                      <div>$700.00 / month</div>
                    </div>
                  </div>
                </div>

                <div className="flex mt-5 w-full flex-col">
                  <div className="text-[#303030] text-base leading-[1.38]">
                    Field Team Rates
                  </div>
                  <div className="self-start flex mt-3 items-start gap-14 text-xs text-[#71717A] leading-[1.33]">
                    <div className="flex flex-col">
                      <div>DEFAULT RATE</div>
                      <div>$60 / hour</div>
                    </div>
                    <div className="flex flex-col">
                      <div>EMERGENCY RATE</div>
                      <div>$50 / hour</div>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowMoreRates(!showMoreRates)}
                    className="text-[#2463EB] text-sm leading-[1.4] tracking-[-0.28px] mt-3 text-left"
                  >
                    {showMoreRates ? "Show less" : "Show more"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Separator */}
          <img
            loading="lazy"
            src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/993a5d1a37af0ace04ef2b831d3364f722125c87?placeholderIfAbsent=true"
            className="w-full mt-5"
            alt=""
          />

          {/* Recent Notes Section */}
          <div className="flex mt-5 w-full flex-col">
            <div className="flex w-full items-center justify-between gap-4 font-medium flex-wrap">
              <div className="text-[#303030] text-xl leading-[1.1]">
                Recent Notes
              </div>
              <button onClick={() => setShowAddNoteModal(true)} className="rounded-lg flex items-center gap-1 text-sm text-[#2463EB] tracking-[-0.28px] leading-[1.4]">
                <img
                  loading="lazy"
                  src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/eb2ef5646108571624ccf8540dc9922047c9c587?placeholderIfAbsent=true"
                  className="w-3 h-3"
                  alt=""
                />
                <span>Add</span>
              </button>
            </div>

            {recentNotes.length === 0 ? (
              <div className="mt-3 flex items-center gap-1 w-full px-3 py-1.5 bg-[#F9F9F9] border border-[#DADADA] rounded">
                <p className="text-[#303030] text-sm font-normal leading-[1.29]">
                  You don't have any notes for this property right now.{" "}
                  <button
                    onClick={() => setShowAddNoteModal(true)}
                    className="font-medium text-[#2463EB] hover:underline"
                  >
                    Add your first note
                  </button>
                </p>
              </div>
            ) : (
              <div className="rounded-lg border border-[#DADADA] flex mt-3 w-full flex-col text-sm text-[#303030] font-normal">
                {recentNotes.map((note, index) => (
                  <div
                    key={note.id}
                    className={`flex w-full px-3 py-2 items-center justify-between gap-4 flex-wrap ${
                      index !== recentNotes.length - 1
                        ? "border-b border-[#DADADA]"
                        : ""
                    }`}
                  >
                    <div
                      className="leading-[18px] w-[232px]"
                      style={{ whiteSpace: "pre-line" }}
                    >
                      {note.text}
                    </div>
                    <div className="flex min-w-[240px] items-center gap-8 leading-[1.29]">
                      <div className="text-[#71717A] text-xs font-medium leading-[1.33]">
                        {note.type}
                      </div>
                      <div className="w-[135px]">{note.date}</div>
                      <div className="w-[118px]">{note.author}</div>
                      <ActionMenu
                        itemId={`note-${note.id}`}
                        onView={() => {
                          setSelectedNote(note);
                          setShowViewNoteModal(true);
                        }}
                        onDelete={() => handleDeleteNote(note.id)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Separator */}
          <img
            loading="lazy"
            src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/993a5d1a37af0ace04ef2b831d3364f722125c87?placeholderIfAbsent=true"
            className="w-full mt-5"
            alt=""
          />

          {/* Recent Files Section */}
          <div className="flex mt-5 w-full flex-col">
            <div className="flex w-full items-center justify-between gap-4 font-medium flex-wrap">
              <div className="text-[#303030] text-xl leading-[1.1]">
                Recent Files
              </div>
              <button onClick={() => setShowAddFileModal(true)} className="rounded-lg flex items-center gap-1 text-sm text-[#2463EB] tracking-[-0.28px] leading-[1.4]">
                <img
                  loading="lazy"
                  src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/eb2ef5646108571624ccf8540dc9922047c9c587?placeholderIfAbsent=true"
                  className="w-3 h-3"
                  alt=""
                />
                <span>Add</span>
              </button>
            </div>

            {recentFiles.length === 0 ? (
              <div className="mt-3 flex items-center gap-1 w-full px-3 py-1.5 bg-[#F9F9F9] border border-[#DADADA] rounded">
                <p className="text-[#303030] text-sm font-normal leading-[1.29]">
                  You don't have any files for this property right now.{" "}
                  <button
                    onClick={() => setShowAddFileModal(true)}
                    className="font-medium text-[#2463EB] hover:underline"
                  >
                    Add your first file
                  </button>
                </p>
              </div>
            ) : (
              <div className="rounded-lg border border-[#DADADA] flex mt-3 w-full flex-col text-[#303030]">
                {recentFiles.map((file, index) => (
                  <div
                    key={file.id}
                    className={`flex w-full px-3 py-2 items-center justify-between gap-4 flex-wrap ${
                      index !== recentFiles.length - 1
                        ? "border-b border-[#DADADA]"
                        : ""
                    }`}
                  >
                    <div className="flex min-w-[240px] items-center gap-2 w-[301px]">
                      <img
                        loading="lazy"
                        src={file.icon}
                        className="w-9 h-9"
                        alt="File icon"
                      />
                      {file.subtitle ? (
                        <div className="flex min-w-[240px] flex-col flex-1">
                          <div className="text-sm font-medium leading-[1.29]">
                            {file.name}
                          </div>
                          <div className="text-xs font-normal">
                            {file.subtitle}
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm font-medium leading-[1.29]">
                          {file.name}
                        </div>
                      )}
                    </div>

                    <div className="flex min-w-[240px] items-center gap-8 font-normal">
                      <div className="text-sm leading-[1.29]">{file.category}</div>
                      <div className="flex flex-col w-[135px]">
                        <div className="text-sm leading-[1.29]">{file.date}</div>
                        <div className="text-xs">by {file.author}</div>
                      </div>
                      <ActionMenu
                        itemId={`file-${file.id}`}
                        onView={() => {
                          setSelectedFile(file);
                          setShowViewFileModal(true);
                        }}
                        onDelete={() => handleDeleteFile(file.id)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* View Note Modal */}
          {showViewNoteModal &&
            selectedNote &&
            createPortal(
              <div
                className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4"
                onClick={() => {
                  setShowViewNoteModal(false);
                  setSelectedNote(null);
                }}
              >
                <div
                  className="w-full max-w-[560px] rounded-xl bg-white shadow-lg border border-[#E5E5E5]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E5E5]">
                    <div className="text-[#303030] font-medium text-lg">Note Details</div>
                    <button
                      onClick={() => {
                        setShowViewNoteModal(false);
                        setSelectedNote(null);
                      }}
                      className="h-9 w-9 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18 6L6 18" stroke="#525252" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M6 6L18 18" stroke="#525252" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>
                  <div className="px-6 py-5 grid gap-4">
                    <div className="text-[#303030] whitespace-pre-line p-3 bg-gray-50 rounded-lg">{selectedNote.text}</div>
                    <div className="text-sm text-[#71717A]">
                      <span className="font-medium">Type:</span> {selectedNote.type}
                    </div>
                    <div className="text-sm text-[#71717A]">
                      <span className="font-medium">Date:</span> {selectedNote.date}
                    </div>
                    <div className="text-sm text-[#71717A]">
                      <span className="font-medium">Author:</span> {selectedNote.author}
                    </div>
                  </div>
                  <div className="px-6 py-4 border-t border-[#E5E5E5] flex items-center justify-end gap-2">
                    <button
                      onClick={() => {
                        setShowViewNoteModal(false);
                        setSelectedNote(null);
                      }}
                      className="flex h-9 justify-center items-center gap-2 px-4 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-[#303030] font-normal text-base capitalize">Close</span>
                    </button>
                  </div>
                </div>
              </div>,
              document.body,
            )}

          {/* View File Modal */}
          {showViewFileModal &&
            selectedFile &&
            createPortal(
              <div
                className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4"
                onClick={() => {
                  setShowViewFileModal(false);
                  setSelectedFile(null);
                }}
              >
                <div
                  className="w-full max-w-[560px] rounded-xl bg-white shadow-lg border border-[#E5E5E5]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E5E5]">
                    <div className="text-[#303030] font-medium text-lg">File Details</div>
                    <button
                      onClick={() => {
                        setShowViewFileModal(false);
                        setSelectedFile(null);
                      }}
                      className="h-9 w-9 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18 6L6 18" stroke="#525252" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M6 6L18 18" stroke="#525252" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>
                  <div className="px-6 py-5 grid gap-4">
                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <img src={selectedFile.icon} alt="" className="w-9 h-9" />
                      <div>
                        <div className="text-[#303030] font-medium">{selectedFile.name}</div>
                        {selectedFile.subtitle ? (
                          <div className="text-sm text-[#71717A]">{selectedFile.subtitle}</div>
                        ) : null}
                      </div>
                    </div>
                    <div className="text-sm text-[#71717A]">
                      <span className="font-medium">Category:</span> {selectedFile.category}
                    </div>
                    <div className="text-sm text-[#71717A]">
                      <span className="font-medium">Date:</span> {selectedFile.date}
                    </div>
                    <div className="text-sm text-[#71717A]">
                      <span className="font-medium">Author:</span> {selectedFile.author}
                    </div>
                  </div>
                  <div className="px-6 py-4 border-t border-[#E5E5E5] flex items-center justify-end gap-2">
                    <button
                      onClick={() => {
                        setShowViewFileModal(false);
                        setSelectedFile(null);
                      }}
                      className="flex h-9 justify-center items-center gap-2 px-4 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-[#303030] font-normal text-base capitalize">Close</span>
                    </button>
                  </div>
                </div>
              </div>,
              document.body,
            )}

          {/* MODALS */}

          {/* Upload Photo Modal */}
          {showPhotoUploadModal &&
            createPortal(
              <div
                className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4"
                onClick={() => setShowPhotoUploadModal(false)}
              >
                <div
                  className="w-full max-w-[560px] rounded-xl bg-white shadow-lg border border-[#E5E5E5]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E5E5]">
                    <div className="text-[#303030] font-medium text-lg">Upload Photo</div>
                    <button
                      onClick={() => setShowPhotoUploadModal(false)}
                      className="h-9 w-9 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center"
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M18 6L6 18"
                          stroke="#525252"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M6 6L18 18"
                          stroke="#525252"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>
                  <div className="px-6 py-5 grid gap-5">
                    <input
                      type="file"
                      accept="image/*"
                      className="block w-full text-sm text-[#303030] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#013764] file:text-white hover:file:bg-[#003a73]"
                    />
                  </div>
                  <div className="px-6 py-4 border-t border-[#E5E5E5] flex items-center justify-end gap-2">
                    <button
                      onClick={() => setShowPhotoUploadModal(false)}
                      className="flex h-9 justify-center items-center gap-2 px-4 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-[#303030] font-normal text-base capitalize">Cancel</span>
                    </button>
                    <button
                      onClick={() => {
                        alert("Photo uploaded successfully!");
                        setShowPhotoUploadModal(false);
                      }}
                      className="flex h-9 items-center gap-2 px-4 rounded-lg border border-white bg-[#013764] shadow-[0_0_0_1px_#002D5A,0_0_10px_-5px_rgba(0,0,0,0.2)] hover:bg-[#003a73] transition-colors"
                    >
                      <span className="text-white font-medium text-base">Upload</span>
                    </button>
                  </div>
                </div>
              </div>,
              document.body,
            )}

          {/* Edit Property Modal */}
          {showEditPropertyModal &&
            createPortal(
              <div
                className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4"
                onClick={() => setShowEditPropertyModal(false)}
              >
                <div
                  className="w-full max-w-[560px] rounded-xl bg-white shadow-lg border border-[#E5E5E5]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E5E5]">
                    <div className="text-[#303030] font-medium text-lg">Edit Property</div>
                    <button
                      onClick={() => setShowEditPropertyModal(false)}
                      className="h-9 w-9 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center"
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M18 6L6 18"
                          stroke="#525252"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M6 6L18 18"
                          stroke="#525252"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>
                  <div className="px-6 py-5 grid gap-5">
                    <div className="grid gap-2">
                      <label className="text-sm font-medium text-[#303030]">Address</label>
                      <input
                        type="text"
                        defaultValue={propertyAddress}
                        className="w-full rounded-lg border border-[#DADADA] px-3 py-2 text-sm text-[#303030] focus:outline-none focus:ring-2 focus:ring-[#013764]"
                      />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-medium text-[#303030]">Location</label>
                      <input
                        type="text"
                        defaultValue={propertyLocation}
                        className="w-full rounded-lg border border-[#DADADA] px-3 py-2 text-sm text-[#303030] focus:outline-none focus:ring-2 focus:ring-[#013764]"
                      />
                    </div>
                  </div>
                  <div className="px-6 py-4 border-t border-[#E5E5E5] flex items-center justify-end gap-2">
                    <button
                      onClick={() => setShowEditPropertyModal(false)}
                      className="flex h-9 justify-center items-center gap-2 px-4 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-[#303030] font-normal text-base capitalize">Cancel</span>
                    </button>
                    <button
                      onClick={() => {
                        alert("Property updated!");
                        setShowEditPropertyModal(false);
                      }}
                      className="flex h-9 items-center gap-2 px-4 rounded-lg border border-white bg-[#013764] shadow-[0_0_0_1px_#002D5A,0_0_10px_-5px_rgba(0,0,0,0.2)] hover:bg-[#003a73] transition-colors"
                    >
                      <span className="text-white font-medium text-base">Save</span>
                    </button>
                  </div>
                </div>
              </div>,
              document.body,
            )}

          {/* Edit Custom Fields Modal */}
          {showEditCustomFieldsModal &&
            createPortal(
              <div
                className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4"
                onClick={() => setShowEditCustomFieldsModal(false)}
              >
                <div
                  className="w-full max-w-[560px] rounded-xl bg-white shadow-lg border border-[#E5E5E5]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E5E5]">
                    <div className="text-[#303030] font-medium text-lg">Edit Custom Fields</div>
                    <button
                      onClick={() => setShowEditCustomFieldsModal(false)}
                      className="h-9 w-9 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center"
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M18 6L6 18"
                          stroke="#525252"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M6 6L18 18"
                          stroke="#525252"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>
                  <div className="px-6 py-5 grid gap-5">
                    <div className="grid gap-2">
                      <label className="text-sm font-medium text-[#303030]">Management Agreement Date</label>
                      <input
                        type="text"
                        placeholder="-"
                        className="w-full rounded-lg border border-[#DADADA] px-3 py-2 text-sm text-[#303030] focus:outline-none focus:ring-2 focus:ring-[#013764]"
                      />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-medium text-[#303030]">Inspection Frequency</label>
                      <input
                        type="text"
                        defaultValue="Monthly"
                        className="w-full rounded-lg border border-[#DADADA] px-3 py-2 text-sm text-[#303030] focus:outline-none focus:ring-2 focus:ring-[#013764]"
                      />
                    </div>
                  </div>
                  <div className="px-6 py-4 border-t border-[#E5E5E5] flex items-center justify-end gap-2">
                    <button
                      onClick={() => setShowEditCustomFieldsModal(false)}
                      className="flex h-9 justify-center items-center gap-2 px-4 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-[#303030] font-normal text-base capitalize">Cancel</span>
                    </button>
                    <button
                      onClick={() => {
                        alert("Custom fields updated!");
                        setShowEditCustomFieldsModal(false);
                      }}
                      className="flex h-9 items-center gap-2 px-4 rounded-lg border border-white bg-[#013764] shadow-[0_0_0_1px_#002D5A,0_0_10px_-5px_rgba(0,0,0,0.2)] hover:bg-[#003a73] transition-colors"
                    >
                      <span className="text-white font-medium text-base">Save</span>
                    </button>
                  </div>
                </div>
              </div>,
              document.body,
            )}

          {/* Edit Rates Modal */}
          {showEditRatesModal &&
            createPortal(
              <div
                className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4"
                onClick={() => setShowEditRatesModal(false)}
              >
                <div
                  className="w-full max-w-[560px] rounded-xl bg-white shadow-lg border border-[#E5E5E5]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E5E5]">
                    <div className="text-[#303030] font-medium text-lg">Edit Rates</div>
                    <button
                      onClick={() => setShowEditRatesModal(false)}
                      className="h-9 w-9 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center"
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M18 6L6 18"
                          stroke="#525252"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M6 6L18 18"
                          stroke="#525252"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>
                  <div className="px-6 py-5 grid gap-5">
                    <div className="grid gap-2">
                      <label className="text-sm font-medium text-[#303030]">Monthly Rate</label>
                      <input
                        type="text"
                        defaultValue="$700.00 / month"
                        className="w-full rounded-lg border border-[#DADADA] px-3 py-2 text-sm text-[#303030] focus:outline-none focus:ring-2 focus:ring-[#013764]"
                      />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-medium text-[#303030]">Default Rate</label>
                      <input
                        type="text"
                        defaultValue="$60 / hour"
                        className="w-full rounded-lg border border-[#DADADA] px-3 py-2 text-sm text-[#303030] focus:outline-none focus:ring-2 focus:ring-[#013764]"
                      />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-medium text-[#303030]">Emergency Rate</label>
                      <input
                        type="text"
                        defaultValue="$50 / hour"
                        className="w-full rounded-lg border border-[#DADADA] px-3 py-2 text-sm text-[#303030] focus:outline-none focus:ring-2 focus:ring-[#013764]"
                      />
                    </div>
                  </div>
                  <div className="px-6 py-4 border-t border-[#E5E5E5] flex items-center justify-end gap-2">
                    <button
                      onClick={() => setShowEditRatesModal(false)}
                      className="flex h-9 justify-center items-center gap-2 px-4 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-[#303030] font-normal text-base capitalize">Cancel</span>
                    </button>
                    <button
                      onClick={() => {
                        alert("Rates updated!");
                        setShowEditRatesModal(false);
                      }}
                      className="flex h-9 items-center gap-2 px-4 rounded-lg border border-white bg-[#013764] shadow-[0_0_0_1px_#002D5A,0_0_10px_-5px_rgba(0,0,0,0.2)] hover:bg-[#003a73] transition-colors"
                    >
                      <span className="text-white font-medium text-base">Save</span>
                    </button>
                  </div>
                </div>
              </div>,
              document.body,
            )}

          {/* Add Note Modal */}
          {showAddNoteModal &&
            createPortal(
              <div
                className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4"
                onClick={() => setShowAddNoteModal(false)}
              >
                <div
                  className="w-full max-w-[560px] rounded-xl bg-white shadow-lg border border-[#E5E5E5]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E5E5]">
                    <div className="text-[#303030] font-medium text-lg">Add Note</div>
                    <button
                      onClick={() => setShowAddNoteModal(false)}
                      className="h-9 w-9 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center"
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M18 6L6 18"
                          stroke="#525252"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M6 6L18 18"
                          stroke="#525252"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>
                  <div className="px-6 py-5 grid gap-5">
                    <div className="grid gap-2">
                      <label className="text-sm font-medium text-[#303030]">Note</label>
                      <textarea
                        value={noteDraft}
                        onChange={(e) => setNoteDraft(e.target.value)}
                        placeholder="Enter your note"
                        className="w-full rounded-lg border border-[#DADADA] px-3 py-2 text-sm text-[#303030] focus:outline-none focus:ring-2 focus:ring-[#013764] min-h-[100px]"
                      />
                    </div>
                  </div>
                  <div className="px-6 py-4 border-t border-[#E5E5E5] flex items-center justify-end gap-2">
                    <button
                      onClick={() => setShowAddNoteModal(false)}
                      className="flex h-9 justify-center items-center gap-2 px-4 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-[#303030] font-normal text-base capitalize">Cancel</span>
                    </button>
                    <button
                      onClick={() => {
                        const text = noteDraft.trim();
                        if (!text) return;

                        const now = new Date();
                        const date = now.toLocaleString(undefined, {
                          month: "numeric",
                          day: "numeric",
                          year: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        });

                        setRecentNotes((prev) => {
                          const nextId = prev.length ? Math.max(...prev.map((n) => n.id)) + 1 : 1;
                          return [
                            ...prev,
                            {
                              id: nextId,
                              text,
                              type: "RENTAL",
                              date,
                              author: propertyManager,
                            },
                          ];
                        });

                        setNoteDraft("");
                        setShowAddNoteModal(false);
                      }}
                      disabled={!noteDraft.trim()}
                      className="flex h-9 items-center gap-2 px-4 rounded-lg border border-white bg-[#013764] shadow-[0_0_0_1px_#002D5A,0_0_10px_-5px_rgba(0,0,0,0.2)] hover:bg-[#003a73] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="text-white font-medium text-base">Add</span>
                    </button>
                  </div>
                </div>
              </div>,
              document.body,
            )}

          {/* Add File Modal */}
          {showAddFileModal &&
            createPortal(
              <div
                className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4"
                onClick={() => setShowAddFileModal(false)}
              >
                <div
                  className="w-full max-w-[560px] rounded-xl bg-white shadow-lg border border-[#E5E5E5]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E5E5]">
                    <div className="text-[#303030] font-medium text-lg">Add File</div>
                    <button
                      onClick={() => setShowAddFileModal(false)}
                      className="h-9 w-9 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center"
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M18 6L6 18"
                          stroke="#525252"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M6 6L18 18"
                          stroke="#525252"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>
                  <div className="px-6 py-5 grid gap-5">
                    <div className="grid gap-2">
                      <label className="text-sm font-medium text-[#303030]">File</label>
                      <input
                        type="file"
                        onChange={(e) => setFileDraft(e.target.files?.[0] ?? null)}
                        className="block w-full text-sm text-[#303030] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#013764] file:text-white hover:file:bg-[#003a73]"
                      />
                    </div>
                  </div>
                  <div className="px-6 py-4 border-t border-[#E5E5E5] flex items-center justify-end gap-2">
                    <button
                      onClick={() => setShowAddFileModal(false)}
                      className="flex h-9 justify-center items-center gap-2 px-4 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-[#303030] font-normal text-base capitalize">Cancel</span>
                    </button>
                    <button
                      onClick={() => {
                        if (!fileDraft) return;

                        const now = new Date();
                        const date = now.toLocaleString(undefined, {
                          month: "numeric",
                          day: "numeric",
                          year: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        });

                        const fileName = fileDraft.name;
                        const ext = fileName.split(".").pop()?.toLowerCase() || "";
                        const docIcon =
                          "https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/07da6a33a78bd70b7170adaa97b3fb7b14ff2fc0?placeholderIfAbsent=true";
                        const pdfIcon =
                          "https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/5ef69f3c3e2f3e3b15cc6139a16a94f848b10be7?placeholderIfAbsent=true";
                        const icon = ext === "doc" || ext === "docx" ? docIcon : pdfIcon;

                        setRecentFiles((prev) => {
                          const nextId = prev.length ? Math.max(...prev.map((f) => f.id)) + 1 : 1;
                          return [
                            ...prev,
                            {
                              id: nextId,
                              name: fileName,
                              category: "Uncategorized",
                              date,
                              author: propertyManager,
                              type: ext || "file",
                              icon,
                            },
                          ];
                        });

                        setFileDraft(null);
                        setShowAddFileModal(false);
                      }}
                      disabled={!fileDraft}
                      className="flex h-9 items-center gap-2 px-4 rounded-lg border border-white bg-[#013764] shadow-[0_0_0_1px_#002D5A,0_0_10px_-5px_rgba(0,0,0,0.2)] hover:bg-[#003a73] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="text-white font-medium text-base">Add</span>
                    </button>
                  </div>
                </div>
              </div>,
              document.body,
            )}
        </div>
      </div>
    </div>
  );
};
