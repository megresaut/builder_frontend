import React, { useState } from "react";

interface PropertyDetailsProps {
  propertyAddress: string;
  propertyLocation?: string;
  rentalOwner?: string;
  propertyManager?: string;
  propertyImage?: string;
}

export const PropertyDetails: React.FC<PropertyDetailsProps> = ({
  propertyAddress,
  propertyLocation = "Westport, CT, 28282",
  rentalOwner = "Eunice Bae",
  propertyManager = "Jake Delardi",
  propertyImage = "https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/b1dce1b4ec8292553f371f2747d334a444b1a4aa?placeholderIfAbsent=true",
}) => {
  const [showMoreCustomFields, setShowMoreCustomFields] = useState(false);
  const [showMoreRates, setShowMoreRates] = useState(false);

  // Mock data for notes
  const recentNotes = [
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
  ];

  // Mock data for files
  const recentFiles = [
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
  ];

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
              <button className="rounded-lg flex items-center gap-1 text-sm text-[#2463EB] tracking-[-0.28px] leading-[1.4]">
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
                  <button className="rounded-lg self-start flex mt-1 items-center gap-1 text-sm text-[#2463EB] tracking-[-0.28px] leading-[1.4]">
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

                <button className="rounded-lg self-start flex mt-5 items-center gap-1 text-sm text-[#2463EB] tracking-[-0.28px] leading-[1.4]">
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
                <button className="rounded-lg flex items-center gap-1 text-sm text-[#2463EB] tracking-[-0.28px] leading-[1.4]">
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
                <button className="rounded-lg flex items-center gap-1 text-sm text-[#2463EB] tracking-[-0.28px] leading-[1.4]">
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
              <button className="rounded-lg flex items-center gap-1 text-sm text-[#2463EB] tracking-[-0.28px] leading-[1.4]">
                <img
                  loading="lazy"
                  src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/eb2ef5646108571624ccf8540dc9922047c9c587?placeholderIfAbsent=true"
                  className="w-3 h-3"
                  alt=""
                />
                <span>Add</span>
              </button>
            </div>

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
                    <img
                      loading="lazy"
                      src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/4a51461b5ec1c34be7d8175b55d07795dfe9f467?placeholderIfAbsent=true"
                      className="w-4 h-4 cursor-pointer"
                      alt="More options"
                    />
                  </div>
                </div>
              ))}
            </div>
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
              <button className="rounded-lg flex items-center gap-1 text-sm text-[#2463EB] tracking-[-0.28px] leading-[1.4]">
                <img
                  loading="lazy"
                  src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/eb2ef5646108571624ccf8540dc9922047c9c587?placeholderIfAbsent=true"
                  className="w-3 h-3"
                  alt=""
                />
                <span>Add</span>
              </button>
            </div>

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
                    <div className="text-sm leading-[1.29]">
                      {file.category}
                    </div>
                    <div className="flex flex-col w-[135px]">
                      <div className="text-sm leading-[1.29]">{file.date}</div>
                      <div className="text-xs">by {file.author}</div>
                    </div>
                    <img
                      loading="lazy"
                      src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/4a51461b5ec1c34be7d8175b55d07795dfe9f467?placeholderIfAbsent=true"
                      className="w-4 h-4 cursor-pointer"
                      alt="More options"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
