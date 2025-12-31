import React, { useState } from "react";
import PageHeader from "@/components/PageHeader";
import AddPropertyModal from "@/components/AddPropertyModal";
import PdfViewerModal from "@/components/PdfViewerModal";
import UploadPhotoModal from "@/components/UploadPhotoModal";
import EditPropertyCustomFieldsModal from "@/components/EditPropertyCustomFieldsModal";
import EditPropertyRatesModal from "@/components/EditPropertyRatesModal";
import AddPropertyNoteModal from "@/components/AddPropertyNoteModal";
import ViewPropertyNoteModal from "@/components/ViewPropertyNoteModal";
import AddPropertyFileModal from "@/components/AddPropertyFileModal";
import PopoverActionsDropdown from "@/components/PopoverActionsDropdown";
import {
  SectionRowTemplate,
  SectionGroupCardTemplate,
  SectionActionTemplate,
  EmptyStateTemplate,
  RecordListTemplate,
  RecordRowTemplate,
  NotesTemplate,
  FilesTemplate,
} from "@/components/templates";

interface PropertyDetailsProps {
  propertyAddress: string;
  propertyLocation?: string;
  propertyType?: string;
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
  url?: string;
};

export const PropertyDetails: React.FC<PropertyDetailsProps> = ({
  propertyAddress,
  propertyLocation = "Westport, CT, 28282",
  propertyType = "Concierge",
  rentalOwner = "Eunice Bae",
  propertyManager = "Jake Delardi",
  propertyImage = "https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/b1dce1b4ec8292553f371f2747d334a444b1a4aa?placeholderIfAbsent=true",
}) => {
  const [showMoreCustomFields, setShowMoreCustomFields] = useState(false);
  const [showMoreRates, setShowMoreRates] = useState(false);
  const [showPhotoUploadModal, setShowPhotoUploadModal] = useState(false);
  const [showEditPropertyModal, setShowEditPropertyModal] = useState(false);
  const [showEditCustomFieldsModal, setShowEditCustomFieldsModal] =
    useState(false);
  const [showEditRatesModal, setShowEditRatesModal] = useState(false);
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);
  const [showAddFileModal, setShowAddFileModal] = useState(false);
  const [showViewNoteModal, setShowViewNoteModal] = useState(false);
  const [showViewFileModal, setShowViewFileModal] = useState(false);
  const [viewNoteDraft, setViewNoteDraft] = useState("");

  const [selectedNote, setSelectedNote] = useState<RecentNote | null>(null);
  const [selectedFile, setSelectedFile] = useState<RecentFile | null>(null);
  const [managementAgreementDate, setManagementAgreementDate] = useState("");
  const [inspectionFrequency, setInspectionFrequency] = useState("Monthly");
  const [monthlyRate, setMonthlyRate] = useState("$700.00 / month");
  const [defaultRate, setDefaultRate] = useState("$60 / hour");
  const [emergencyRate, setEmergencyRate] = useState("$50 / hour");

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
    setSelectedNote(null);
    setShowViewNoteModal(false);
  };

  const revokeBlobUrl = (url?: string) => {
    if (!url) return;
    if (url.startsWith("blob:")) {
      try {
        URL.revokeObjectURL(url);
      } catch {
        // ignore
      }
    }
  };

  const handleDeleteFile = (id: number) => {
    setRecentFiles((prev) => {
      const fileToDelete = prev.find((f) => f.id === id);
      revokeBlobUrl(fileToDelete?.url);
      return prev.filter((file) => file.id !== id);
    });
    setSelectedFile(null);
    setShowViewFileModal(false);
  };

  const openViewMaps = () => {
    const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(`${propertyAddress}, ${propertyLocation}`)}`;
    window.open(mapsUrl, "_blank");
  };

  return (
    <div className="flex justify-center font-[Geist,-apple-system,Roboto,Helvetica,sans-serif]">
      <div className="flex flex-col w-full min-w-[240px]">
        <SectionGroupCardTemplate>
          {/* Property Details Section */}
          <SectionRowTemplate isLast={false}>
            <div className="flex flex-col w-full font-medium">
              <PageHeader
                title="Property Details"
                actionButton={{
                  label: "Edit",
                  onClick: () => setShowEditPropertyModal(true),
                }}
                moreOptions={{}}
              />

              <div className="flex mt-3 w-full items-start gap-4 flex-wrap">
                <img
                  loading="lazy"
                  srcSet={`${propertyImage}&width=100 100w, ${propertyImage}&width=200 200w, ${propertyImage}&width=400 400w`}
                  src={propertyImage}
                  className="rounded-lg min-w-[240px] w-[273px] aspect-[1.57] object-cover"
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
                    <button
                      onClick={openViewMaps}
                      className="rounded-lg self-start flex mt-1 items-center gap-1 text-sm text-[#2463EB] tracking-[-0.28px] leading-[1.4]"
                    >
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
                    <div className="flex min-h-[33px] flex-col">
                      <div className="text-[#71717A] text-xs leading-[1.33]">
                        PROPERTY MANAGERS
                      </div>
                      <div className="text-[#303030] text-base leading-[1.13] mt-1">
                        {propertyManager}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowPhotoUploadModal(true)}
                    className="rounded-lg self-start flex mt-5 items-center gap-1 text-sm text-[#2463EB] tracking-[-0.28px] leading-[1.4]"
                  >
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
          </SectionRowTemplate>

          {/* Custom Fields Section */}
          <SectionRowTemplate isLast={false}>
            <div className="flex min-w-[240px] flex-col flex-1 w-full">
              <div className="flex w-full items-center justify-between gap-4 flex-wrap">
                <div className="text-[#303030] text-xl leading-[1.1]">
                  Custom Fields
                </div>
                <SectionActionTemplate
                  label="Edit"
                  onClick={() => setShowEditCustomFieldsModal(true)}
                />
              </div>

              <div className="flex mt-3 w-full flex-col">
                <div className="flex flex-col w-full">
                  <div className="text-[#303030] text-base leading-[1.38]">
                    Agreement
                  </div>
                  <div className="self-start flex mt-3 items-start gap-14 text-xs text-[#71717A] leading-[1.33]">
                    <div className="flex flex-col">
                      <div>MANAGEMENT AGREEMENT DATE</div>
                      <div>
                        {managementAgreementDate
                          ? new Date(
                              managementAgreementDate,
                            ).toLocaleDateString()
                          : "-"}
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <div>INSPECTION FREQUENCY</div>
                      <div>{inspectionFrequency}</div>
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
                    onClick={() =>
                      setShowMoreCustomFields(!showMoreCustomFields)
                    }
                    className="text-[#2463EB] text-sm leading-[1.4] tracking-[-0.28px] mt-3 text-left"
                  >
                    {showMoreCustomFields ? "Show less" : "Show more"}
                  </button>
                </div>
              </div>
            </div>
          </SectionRowTemplate>

          {/* Rates Section */}
          <SectionRowTemplate isLast={false}>
            <div className="flex min-w-[240px] flex-col flex-1 w-full">
              <div className="flex w-full items-center justify-between gap-4 flex-wrap whitespace-nowrap">
                <div className="text-[#303030] text-xl leading-[1.1]">
                  Rates
                </div>
                <SectionActionTemplate
                  label="Edit"
                  onClick={() => setShowEditRatesModal(true)}
                />
              </div>

              <div className="flex mt-3 w-full flex-col">
                <div className="flex flex-col w-full">
                  <div className="text-[#303030] text-base leading-[1.38]">
                    Management Fee
                  </div>
                  <div className="self-start flex mt-3 items-start gap-14 text-xs text-[#71717A] leading-[1.33]">
                    <div className="flex flex-col">
                      <div>MONTHLY RATE</div>
                      <div>{monthlyRate}</div>
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
                      <div>{defaultRate}</div>
                    </div>
                    <div className="flex flex-col">
                      <div>EMERGENCY RATE</div>
                      <div>{emergencyRate}</div>
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
          </SectionRowTemplate>

          {/* Recent Notes Section */}
          <NotesTemplate
            notes={recentNotes}
            onAdd={() => setShowAddNoteModal(true)}
            onEdit={(note) => {
              setSelectedNote(note);
              setViewNoteDraft(note.text);
              setShowViewNoteModal(true);
            }}
            onDelete={handleDeleteNote}
            isLast={false}
            emptyMessage="You don't have any notes for this property right now."
          />

          {/* Recent Files Section */}
          <FilesTemplate
            files={recentFiles}
            onAdd={() => setShowAddFileModal(true)}
            onEdit={(file) => {
              setSelectedFile(file);
              setShowViewFileModal(true);
            }}
            onDelete={handleDeleteFile}
            onView={(file) => {
              setSelectedFile(file);
              setShowViewFileModal(true);
            }}
            isLast={true}
            emptyMessage="You don't have any files for this property right now."
          />
        </SectionGroupCardTemplate>

        {/* View Note Modal */}
        <ViewPropertyNoteModal
          open={showViewNoteModal}
          onOpenChange={(open) => {
            setShowViewNoteModal(open);
            if (!open) setSelectedNote(null);
          }}
          note={selectedNote}
          onSaveNote={(id, newText) => {
            setRecentNotes((prev) =>
              prev.map((n) =>
                n.id === id
                  ? {
                      ...n,
                      text: newText,
                      date: new Date().toLocaleString(),
                    }
                  : n,
              ),
            );
          }}
          onDeleteNote={handleDeleteNote}
        />

        {/* PDF Viewer */}
        <PdfViewerModal
          open={showViewFileModal}
          onOpenChange={(open) => {
            setShowViewFileModal(open);
            if (!open) setSelectedFile(null);
          }}
          title={selectedFile?.name || "File Preview"}
          url={selectedFile?.url}
        />

        {/* Upload Photo Modal */}
        <UploadPhotoModal
          open={showPhotoUploadModal}
          onOpenChange={setShowPhotoUploadModal}
          onUpload={(file) => {
            console.log("Photo uploaded:", file.name);
          }}
        />

        {/* Edit Property Modal */}
        <AddPropertyModal
          open={showEditPropertyModal}
          onOpenChange={setShowEditPropertyModal}
          editData={{
            address: propertyAddress,
            location: propertyLocation,
            type: propertyType,
            buildingId: "624090",
            status: "inactive",
            managers: [
              {
                id: "pm",
                name: propertyManager,
                initials: propertyManager
                  .split(" ")
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((p) => p[0]?.toUpperCase())
                  .join(""),
              },
            ],
            rentalOwner,
          }}
        />

        {/* Edit Custom Fields Modal */}
        <EditPropertyCustomFieldsModal
          open={showEditCustomFieldsModal}
          onOpenChange={setShowEditCustomFieldsModal}
          initialData={{
            managementAgreementDate,
            inspectionFrequency,
          }}
          onSave={(data) => {
            setManagementAgreementDate(data.managementAgreementDate);
            setInspectionFrequency(data.inspectionFrequency);
          }}
        />

        {/* Edit Rates Modal */}
        <EditPropertyRatesModal
          open={showEditRatesModal}
          onOpenChange={setShowEditRatesModal}
          initialData={{
            monthlyRate,
            defaultRate,
            emergencyRate,
          }}
          onSave={(data) => {
            setMonthlyRate(data.monthlyRate);
            setDefaultRate(data.defaultRate);
            setEmergencyRate(data.emergencyRate);
          }}
        />

        {/* Add Note Modal */}
        <AddPropertyNoteModal
          open={showAddNoteModal}
          onOpenChange={setShowAddNoteModal}
          onAddNote={(noteText) => {
            const now = new Date();
            const date = now.toLocaleString(undefined, {
              month: "numeric",
              day: "numeric",
              year: "numeric",
              hour: "numeric",
              minute: "2-digit",
            });

            setRecentNotes((prev) => {
              const nextId = prev.length
                ? Math.max(...prev.map((n) => n.id)) + 1
                : 1;
              return [
                ...prev,
                {
                  id: nextId,
                  text: noteText,
                  type: "RENTAL",
                  date,
                  author: propertyManager,
                },
              ];
            });
          }}
        />

        {/* Add File Modal */}
        <AddPropertyFileModal
          open={showAddFileModal}
          onOpenChange={setShowAddFileModal}
          onAddFile={(file, category) => {
            const blobUrl = URL.createObjectURL(file);
            const now = new Date();
            const date = now.toLocaleString(undefined, {
              month: "numeric",
              day: "numeric",
              year: "numeric",
              hour: "numeric",
              minute: "2-digit",
            });

            const fileName = file.name;
            const ext = fileName.split(".").pop()?.toLowerCase() || "";
            const docIcon =
              "https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/07da6a33a78bd70b7170adaa97b3fb7b14ff2fc0?placeholderIfAbsent=true";
            const pdfIcon =
              "https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/5ef69f3c3e2f3e3b15cc6139a16a94f848b10be7?placeholderIfAbsent=true";
            const icon = ext === "doc" || ext === "docx" ? docIcon : pdfIcon;

            setRecentFiles((prev) => {
              const nextId = prev.length
                ? Math.max(...prev.map((f) => f.id)) + 1
                : 1;
              return [
                ...prev,
                {
                  id: nextId,
                  name: fileName,
                  category,
                  date,
                  author: propertyManager,
                  type: ext || "file",
                  icon,
                  url: blobUrl,
                },
              ];
            });
          }}
        />
      </div>
    </div>
  );
};
