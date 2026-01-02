import { useParams } from "react-router-dom";
import { PropertiesTemplate } from "@/layout/PropertiesTemplate";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import React from "react";
import { Units } from "./Units";
import { Utilities } from "./Utilities";
import { Maintenance } from "./Maintenance";
import { Tasks } from "./Tasks";
import { Vendors } from "./Vendors";
import { Bills } from "./Bills";
import { Notes } from "./Notes";
import { Invoicing } from "./Invoicing";
import PageHeader from "@/components/PageHeader";
import AddPropertyModal from "@/components/AddPropertyModal";
import PdfViewerModal from "@/components/PdfViewerModal";
import AddNoteModal from "@/components/AddNoteModal";
import AddFileModal from "@/components/AddFileModal";
import {
  UploadPhotoModal,
  EditPropertyRatesModal,
  InlineEditWrapper,
  EditCustomFieldsInline,
  EditRatesInline,
} from "@/components/properties/overview";
import { EditIcon } from "@/components/icons";
import { usePropertyDetailsState, type RecentNote, type RecentFile } from "@/hooks/usePropertyDetailsState";
import { FormLayout, FormSection } from "@/components/ui/form-layout";
import { ModalTemplate, ModalButtons } from "@/components/ui/ModalTemplate";
import { useState } from "react";
import {
  SectionRowTemplate,
  SectionGroupCardTemplate,
  SectionActionTemplate,
  EmptyStateTemplate,
  RecordListTemplate,
  RecordRowTemplate,
  NotesTemplate,
  FilesTemplate,
  DataSectionTemplate,
  type Subsection,
} from "@/components/templates";

interface Manager {
  id: number;
  name: string;
  initials: string;
  color: string;
}

interface Property {
  id: number;
  address: string;
  location: string;
  managers: Manager[];
  type: string;
  buildingId: string;
  status: "active" | "inactive";
  units: number;
  rentalOwner?: string;
}

// Mock property data - in a real app, this would come from an API
const propertyData: Record<string, Property> = {
  "1": {
    id: 1,
    address: "22 Indian Chase Dr",
    location: "Greenwich, CT 06831",
    managers: [
      { id: 1, name: "Jerry Sanchez", initials: "JS", color: "bg-blue-500" },
      { id: 2, name: "John Doe", initials: "JD", color: "bg-purple-500" },
    ],
    type: "Concierge",
    buildingId: "624090",
    status: "inactive",
    units: 1,
    rentalOwner: "Eunice Bae",
  },
  "2": {
    id: 2,
    address: "22 Indian Chase Dr",
    location: "Greenwich, CT 06831",
    managers: [
      { id: 1, name: "Jerry Sanchez", initials: "JS", color: "bg-blue-500" },
      { id: 3, name: "Jane Smith", initials: "JMS", color: "bg-green-500" },
    ],
    type: "Rental",
    buildingId: "624090",
    status: "active",
    units: 1,
    rentalOwner: "Eunice Bae",
  },
  "3": {
    id: 3,
    address: "22 Indian Chase Dr",
    location: "Greenwich, CT 06831",
    managers: [
      { id: 1, name: "Jerry Sanchez", initials: "JS", color: "bg-blue-500" },
      { id: 4, name: "Mike Johnson", initials: "MJ", color: "bg-orange-500" },
    ],
    type: "Commercial",
    buildingId: "624090",
    status: "active",
    units: 1,
    rentalOwner: "Eunice Bae",
  },
  "4": {
    id: 4,
    address: "22 Indian Chase Dr",
    location: "Greenwich, CT 06831",
    managers: [
      { id: 2, name: "John Doe", initials: "JD", color: "bg-purple-500" },
    ],
    type: "OR",
    buildingId: "624090",
    status: "active",
    units: 1,
    rentalOwner: "Eunice Bae",
  },
  "5": {
    id: 5,
    address: "22 Indian Chase Dr",
    location: "Greenwich, CT 06831",
    managers: [
      { id: 3, name: "Jane Smith", initials: "JMS", color: "bg-green-500" },
      { id: 4, name: "Mike Johnson", initials: "MJ", color: "bg-orange-500" },
    ],
    type: "HOA",
    buildingId: "624090",
    status: "active",
    units: 1,
    rentalOwner: "Eunice Bae",
  },
  "6": {
    id: 6,
    address: "22 Indian Chase Dr",
    location: "Greenwich, CT 06831",
    managers: [
      { id: 1, name: "Jerry Sanchez", initials: "JS", color: "bg-blue-500" },
    ],
    type: "Concierge",
    buildingId: "624090",
    status: "active",
    units: 1,
    rentalOwner: "Eunice Bae",
  },
  "7": {
    id: 7,
    address: "22 Indian Chase Dr",
    location: "Greenwich, CT 06831",
    managers: [
      { id: 2, name: "John Doe", initials: "JD", color: "bg-purple-500" },
      { id: 3, name: "Jane Smith", initials: "JMS", color: "bg-green-500" },
    ],
    type: "Concierge",
    buildingId: "624090",
    status: "active",
    units: 1,
    rentalOwner: "Eunice Bae",
  },
  "8": {
    id: 8,
    address: "22 Indian Chase Dr",
    location: "Greenwich, CT 06831",
    managers: [
      { id: 4, name: "Mike Johnson", initials: "MJ", color: "bg-orange-500" },
    ],
    type: "Concierge",
    buildingId: "624090",
    status: "active",
    units: 1,
    rentalOwner: "Eunice Bae",
  },
  "9": {
    id: 9,
    address: "22 Indian Chase Dr",
    location: "Greenwich, CT 06831",
    managers: [
      { id: 1, name: "Jerry Sanchez", initials: "JS", color: "bg-blue-500" },
      { id: 4, name: "Mike Johnson", initials: "MJ", color: "bg-orange-500" },
    ],
    type: "Concierge",
    buildingId: "624090",
    status: "active",
    units: 1,
    rentalOwner: "Eunice Bae",
  },
  "10": {
    id: 10,
    address: "22 Indian Chase Dr",
    location: "Greenwich, CT 06831",
    managers: [
      { id: 3, name: "Jane Smith", initials: "JMS", color: "bg-green-500" },
    ],
    type: "Concierge",
    buildingId: "624090",
    status: "active",
    units: 1,
    rentalOwner: "Eunice Bae",
  },
};

function Overview({
  propertyAddress,
  propertyLocation,
  propertyType,
  rentalOwner,
  propertyManager,
  propertyImage,
}: {
  propertyAddress: string;
  propertyLocation: string;
  propertyType: string;
  rentalOwner?: string;
  propertyManager?: string;
  propertyImage?: string;
}) {
  const { state, dispatch } = usePropertyDetailsState();

  useEffect(() => {
    const initialNotes: RecentNote[] = [
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

    const initialFiles: RecentFile[] = [
      {
        id: 1,
        name: "1 Connors Lane - Maintenance Log.docx",
        category: "Uncategorized",
        date: "6/3/2025 2:06 PM",
        author: "Julia LoSchiavo",
        type: "docx",
        icon: "https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/07da6a33a78bd70b7170adaa97b3fb7b14ff2fc0?placeholderIfAbsent=true",
        url: "https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/07da6a33a78bd70b7170adaa97b3fb7b14ff2fc0",
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
        url: "https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/5ef69f3c3e2f3e3b15cc6139a16a94f848b10be7",
      },
      {
        id: 3,
        name: "1 Connors Lane- Management Contract",
        category: "Uncategorized",
        date: "1/7/2020 2:14 PM",
        author: "Mario Sciarretta",
        type: "pdf",
        icon: "https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/5ef69f3c3e2f3e3b15cc6139a16a94f848b10be7?placeholderIfAbsent=true",
        url: "https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/5ef69f3c3e2f3e3b15cc6139a16a94f848b10be7",
      },
    ];

    dispatch({ type: "SET_RECENT_NOTES", notes: initialNotes });
    dispatch({ type: "SET_RECENT_FILES", files: initialFiles });
  }, [dispatch]);

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

  const [viewingNote, setViewingNote] = useState<RecentNote | null>(null);

  const selectedNote = state.selection.noteId
    ? state.lists.recentNotes.find((n) => n.id === state.selection.noteId)
    : null;

  const selectedFile = state.selection.fileId
    ? state.lists.recentFiles.find((f) => f.id === state.selection.fileId)
    : null;

  const openViewMaps = () => {
    const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(`${propertyAddress}, ${propertyLocation}`)}`;
    window.open(mapsUrl, "_blank");
  };

  return (
    <>
      <div className="flex justify-center font-[Geist,-apple-system,Roboto,Helvetica,sans-serif]">
        <div className="flex flex-col w-full min-w-[240px]">
          <SectionGroupCardTemplate>
            {/* Property Details Section */}
            <SectionRowTemplate isLast={false}>
              <div className="flex flex-col w-full font-medium">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <PageHeader
                    title="Property Details"
                  />
                  <SectionActionTemplate
                    icon={<EditIcon width={14} height={14} />}
                    label="Edit"
                    onClick={() => dispatch({ type: "OPEN_MODAL", modal: "editProperty" })}
                  />
                </div>

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
                      onClick={() => dispatch({ type: "OPEN_MODAL", modal: "uploadPhoto" })}
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

            {/* Custom Fields Section - Inline Edit */}
            <SectionRowTemplate isLast={false}>
              <InlineEditWrapper
                mode={state.editingSection === "customFields" ? "edit" : "view"}
                editTitle="Set the custom field values for this property"
                showCloseButton={true}
                onSave={() => {
                  dispatch({ type: "EXIT_EDIT_MODE" });
                }}
                onCancel={() => {
                  dispatch({ type: "EXIT_EDIT_MODE" });
                }}
                editChildren={
                  <EditCustomFieldsInline
                    initialData={{
                      managementAgreementDate: state.drafts.customFields.managementAgreementDate,
                      inspectionFrequency: state.drafts.customFields.inspectionFrequency,
                      hvacStart: state.drafts.customFields.hvacStart,
                      hvacEnd: state.drafts.customFields.hvacEnd,
                      landscapingStart: state.drafts.customFields.landscapingStart,
                    }}
                    managementAgreementDate={state.drafts.customFields.managementAgreementDate}
                    inspectionFrequency={state.drafts.customFields.inspectionFrequency}
                    hvacStart={state.drafts.customFields.hvacStart}
                    hvacEnd={state.drafts.customFields.hvacEnd}
                    landscapingStart={state.drafts.customFields.landscapingStart}
                    onManagementAgreementDateChange={(value) => {
                      dispatch({
                        type: "PATCH_CUSTOM_FIELDS",
                        patch: { managementAgreementDate: value || "" },
                      });
                    }}
                    onInspectionFrequencyChange={(value) => {
                      dispatch({
                        type: "PATCH_CUSTOM_FIELDS",
                        patch: { inspectionFrequency: value },
                      });
                    }}
                    onHvacStartChange={(value) => {
                      dispatch({
                        type: "PATCH_CUSTOM_FIELDS",
                        patch: { hvacStart: value },
                      });
                    }}
                    onHvacEndChange={(value) => {
                      dispatch({
                        type: "PATCH_CUSTOM_FIELDS",
                        patch: { hvacEnd: value },
                      });
                    }}
                    onLandscapingStartChange={(value) => {
                      dispatch({
                        type: "PATCH_CUSTOM_FIELDS",
                        patch: { landscapingStart: value },
                      });
                    }}
                  />
                }
              >
                <DataSectionTemplate
                  wrapInSectionRow={false}
                  title="Custom Fields"
                  subsections={[
                    {
                      title: "Agreement",
                      fields: [
                        {
                          label: "MANAGEMENT AGREEMENT DATE",
                          value: state.drafts.customFields.managementAgreementDate
                            ? new Date(state.drafts.customFields.managementAgreementDate).toLocaleDateString()
                            : "-",
                        },
                        {
                          label: "INSPECTION FREQUENCY",
                          value: state.drafts.customFields.inspectionFrequency,
                        },
                      ],
                    },
                    {
                      title: "Vendor Agreement",
                      fields: [
                        {
                          label: "HVAC START",
                          value: state.drafts.customFields.hvacStart
                            ? new Date(state.drafts.customFields.hvacStart).toLocaleDateString()
                            : "-",
                        },
                        {
                          label: "HVAC END",
                          value: state.drafts.customFields.hvacEnd
                            ? new Date(state.drafts.customFields.hvacEnd).toLocaleDateString()
                            : "-",
                        },
                        {
                          label: "LANDSCAPING START",
                          value: state.drafts.customFields.landscapingStart
                            ? new Date(state.drafts.customFields.landscapingStart).toLocaleDateString()
                            : "-",
                        },
                      ],
                    },
                  ]}
                  onEdit={() => dispatch({ type: "ENTER_EDIT_MODE", section: "customFields" })}
                  isLast={false}
                />
              </InlineEditWrapper>
            </SectionRowTemplate>

            {/* Rates Section - Inline Edit */}
            <SectionRowTemplate isLast={false}>
              <InlineEditWrapper
                mode={state.editingSection === "rates" ? "edit" : "view"}
                editTitle="Set the rates for this property"
                showCloseButton={true}
                onSave={() => {
                  dispatch({ type: "EXIT_EDIT_MODE" });
                }}
                onCancel={() => {
                  dispatch({ type: "EXIT_EDIT_MODE" });
                }}
                editChildren={
                  <EditRatesInline
                    initialData={{
                      monthlyRate: state.drafts.rates.monthlyRate,
                      defaultRate: state.drafts.rates.defaultRate,
                      emergencyRate: state.drafts.rates.emergencyRate,
                    }}
                    monthlyRate={state.drafts.rates.monthlyRate}
                    defaultRate={state.drafts.rates.defaultRate}
                    emergencyRate={state.drafts.rates.emergencyRate}
                    onMonthlyRateChange={(value) => {
                      dispatch({
                        type: "PATCH_RATES",
                        patch: { monthlyRate: value },
                      });
                    }}
                    onDefaultRateChange={(value) => {
                      dispatch({
                        type: "PATCH_RATES",
                        patch: { defaultRate: value },
                      });
                    }}
                    onEmergencyRateChange={(value) => {
                      dispatch({
                        type: "PATCH_RATES",
                        patch: { emergencyRate: value },
                      });
                    }}
                  />
                }
              >
                <DataSectionTemplate
                  wrapInSectionRow={false}
                  title="Rates"
                  subsections={[
                    {
                      title: "Management Fee",
                      fields: [
                        {
                          label: "MONTHLY RATE",
                          value: state.drafts.rates.monthlyRate,
                        },
                      ],
                    },
                    {
                      title: "Field Team Rates",
                      fields: [
                        {
                          label: "DEFAULT RATE",
                          value: state.drafts.rates.defaultRate,
                        },
                        {
                          label: "EMERGENCY RATE",
                          value: state.drafts.rates.emergencyRate,
                        },
                      ],
                    },
                  ]}
                  onEdit={() => dispatch({ type: "ENTER_EDIT_MODE", section: "rates" })}
                  isLast={false}
                />
              </InlineEditWrapper>
            </SectionRowTemplate>

            {/* Recent Notes Section */}
            <NotesTemplate
              notes={state.lists.recentNotes}
              onAdd={() => dispatch({ type: "OPEN_MODAL", modal: "addNote" })}
              onEdit={(note) => {
                setViewingNote(note);
                dispatch({ type: "OPEN_MODAL", modal: "viewNote" });
              }}
              onDelete={(noteId) => dispatch({ type: "DELETE_NOTE", noteId })}
              isLast={false}
              emptyMessage="You don't have any notes for this property right now."
            />

            {/* Recent Files Section */}
            <FilesTemplate
              files={state.lists.recentFiles}
              onAdd={() => dispatch({ type: "OPEN_MODAL", modal: "addFile" })}
              onEdit={(file) => {
                dispatch({ type: "SELECT_FILE", fileId: file.id });
                dispatch({ type: "OPEN_MODAL", modal: "editFile" });
              }}
              onDelete={(fileId) => {
                const fileToDelete = state.lists.recentFiles.find(
                  (f) => f.id === fileId
                );
                revokeBlobUrl(fileToDelete?.url);
                dispatch({ type: "DELETE_FILE", fileId });
              }}
              onView={(file) => {
                dispatch({ type: "SELECT_FILE", fileId: file.id });
                dispatch({ type: "OPEN_MODAL", modal: "viewFile" });
              }}
              isLast={true}
              emptyMessage="You don't have any files for this property right now."
            />
          </SectionGroupCardTemplate>

          {/* View File Modal */}
          <PdfViewerModal
            open={state.activeModal === "viewFile"}
            onOpenChange={(open) => {
              if (!open) dispatch({ type: "CLOSE_MODAL" });
            }}
            title={selectedFile?.name || "File Preview"}
            url={selectedFile?.url}
          />

          {/* Upload Photo Modal */}
          <UploadPhotoModal
            open={state.activeModal === "uploadPhoto"}
            onOpenChange={(open) => {
              if (!open) dispatch({ type: "CLOSE_MODAL" });
            }}
            onUpload={(file) => {
              console.log("Photo uploaded:", file.name);
            }}
          />

          {/* Edit Property Modal */}
          <AddPropertyModal
            open={state.activeModal === "editProperty"}
            onOpenChange={(open) => {
              if (!open) dispatch({ type: "CLOSE_MODAL" });
            }}
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
                    ?.split(" ")
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((p) => p[0]?.toUpperCase())
                    .join("") || "",
                },
              ],
              rentalOwner,
            }}
          />

          {/* Edit Rates Modal */}
          <EditPropertyRatesModal
            open={state.activeModal === "editRates"}
            onOpenChange={(open) => {
              if (!open) dispatch({ type: "CLOSE_MODAL" });
            }}
            initialData={{
              monthlyRate: state.drafts.rates.monthlyRate,
              defaultRate: state.drafts.rates.defaultRate,
              emergencyRate: state.drafts.rates.emergencyRate,
            }}
            onSave={(data) => {
              dispatch({
                type: "PATCH_RATES",
                patch: {
                  monthlyRate: data.monthlyRate,
                  defaultRate: data.defaultRate,
                  emergencyRate: data.emergencyRate,
                },
              });
              dispatch({ type: "CLOSE_MODAL" });
            }}
          />

          {/* Add/Edit Note Modal */}
          <AddNoteModal
            open={state.activeModal === "addNote" || state.activeModal === "editNote"}
            onOpenChange={(open) => {
              if (!open) dispatch({ type: "CLOSE_MODAL" });
            }}
            isEditMode={state.activeModal === "editNote"}
            initialText={selectedNote?.text || ""}
            onSubmit={(noteText) => {
              const now = new Date();
              const date = now.toLocaleString(undefined, {
                month: "numeric",
                day: "numeric",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
              });

              if (state.activeModal === "editNote" && selectedNote) {
                dispatch({
                  type: "UPDATE_NOTE",
                  noteId: selectedNote.id,
                  text: noteText,
                  date,
                });
              } else {
                const nextId = state.lists.recentNotes.length
                  ? Math.max(...state.lists.recentNotes.map((n) => n.id)) + 1
                  : 1;

                dispatch({
                  type: "ADD_NOTE",
                  note: {
                    id: nextId,
                    text: noteText,
                    type: "RENTAL",
                    date,
                    author: propertyManager || "",
                  },
                });
              }
              dispatch({ type: "CLOSE_MODAL" });
            }}
          />

          {/* View Note Modal */}
          <ModalTemplate
            open={state.activeModal === "viewNote"}
            onOpenChange={(open) => {
              if (!open) {
                dispatch({ type: "CLOSE_MODAL" });
                setViewingNote(null);
              }
            }}
            title="Note Details"
            size="sm"
            footer={
              <ModalButtons
                onCancel={() => {
                  dispatch({ type: "CLOSE_MODAL" });
                  setViewingNote(null);
                }}
                onConfirm={() => {
                  if (viewingNote) {
                    dispatch({ type: "SELECT_NOTE", noteId: viewingNote.id });
                    dispatch({ type: "OPEN_MODAL", modal: "editNote" });
                    setViewingNote(null);
                  }
                }}
                cancelLabel="Close"
                confirmLabel="Edit"
              />
            }
          >
            {viewingNote ? (
              <FormLayout>
                <FormSection showDivider={false}>
                  <div className="text-[#303030] whitespace-pre-line p-3 bg-gray-50 rounded-lg">
                    {viewingNote.text}
                  </div>
                  <div className="text-sm text-[#71717A]">
                    <span className="font-medium">Author:</span>{" "}
                    {viewingNote.author}
                  </div>
                  <div className="text-sm text-[#71717A]">
                    <span className="font-medium">Date:</span> {viewingNote.date}
                  </div>
                </FormSection>
              </FormLayout>
            ) : null}
          </ModalTemplate>

          {/* Add/Edit File Modal */}
          <AddFileModal
            open={state.activeModal === "addFile" || state.activeModal === "editFile"}
            onOpenChange={(open) => {
              if (!open) dispatch({ type: "CLOSE_MODAL" });
            }}
            isEditMode={state.activeModal === "editFile"}
            initialCategory={selectedFile?.category || ""}
            initialDescription={selectedFile?.description || ""}
            acceptedFormats=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.txt,.csv"
            onSubmit={(uploadedFiles, category, description) => {
              if (state.activeModal === "editFile" && selectedFile) {
                dispatch({
                  type: "UPDATE_FILE",
                  fileId: selectedFile.id,
                  category,
                  description,
                });
              } else {
                const blobUrl = URL.createObjectURL(uploadedFiles[0].file!);
                const now = new Date();
                const date = now.toLocaleString(undefined, {
                  month: "numeric",
                  day: "numeric",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                });

                const fileName = uploadedFiles[0].name;
                const ext = fileName.split(".").pop()?.toLowerCase() || "";
                const docIcon =
                  "https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/07da6a33a78bd70b7170adaa97b3fb7b14ff2fc0?placeholderIfAbsent=true";
                const pdfIcon =
                  "https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/5ef69f3c3e2f3e3b15cc6139a16a94f848b10be7?placeholderIfAbsent=true";
                const icon = ext === "doc" || ext === "docx" ? docIcon : pdfIcon;

                const nextId = state.lists.recentFiles.length
                  ? Math.max(...state.lists.recentFiles.map((f) => f.id)) + 1
                  : 1;

                dispatch({
                  type: "ADD_FILE",
                  file: {
                    id: nextId,
                    name: fileName,
                    category,
                    date,
                    author: propertyManager || "",
                    type: ext || "file",
                    icon,
                    url: blobUrl,
                    description,
                  },
                });
              }
              dispatch({ type: "CLOSE_MODAL" });
            }}
          />
        </div>
      </div>
    </>
  );
}

export default function PropertyDetail() {
  const navigate = useNavigate();
  const { propertyId, tab } = useParams<{
    propertyId: string;
    tab?: string;
  }>();

  const property = propertyId ? propertyData[propertyId] : null;

  // Redirect to Overview tab if no tab is specified
  useEffect(() => {
    if (propertyId && !tab) {
      navigate(`/property/${propertyId}/Overview`, { replace: true });
    }
  }, [propertyId, tab, navigate]);

  if (!property) {
    return (
      <PropertiesTemplate activeTab={tab || "Overview"}>
        <div className="flex items-center justify-center h-96">
          <p className="text-gray-500 text-lg">Property not found</p>
        </div>
      </PropertiesTemplate>
    );
  }

  const renderPageContent = () => {
    const currentTab = tab || "Overview";

    switch (currentTab) {
      case "Overview":
        return (
          <Overview
            propertyAddress={property.address}
            propertyLocation={property.location}
            propertyType={property.type}
            rentalOwner={property.rentalOwner}
            propertyManager={property.managers[0]?.name}
            propertyImage="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/b1dce1b4ec8292553f371f2747d334a444b1a4aa?placeholderIfAbsent=true"
          />
        );
      case "Units":
        return (
          <Units
            propertyAddress={property.address}
            propertyType={property.type}
            propertyUnits={property.units}
          />
        );
      case "Utilities":
        return (
          <Utilities
            propertyAddress={property.address}
            propertyType={property.type}
            propertyUnits={property.units}
          />
        );
      case "Maintenance":
        return (
          <Maintenance
            propertyAddress={property.address}
            propertyType={property.type}
            propertyUnits={property.units}
          />
        );
      case "Tasks":
        return (
          <Tasks
            propertyAddress={property.address}
            propertyType={property.type}
            propertyUnits={property.units}
          />
        );
      case "Vendors":
        return (
          <Vendors
            propertyAddress={property.address}
            propertyType={property.type}
            propertyUnits={property.units}
          />
        );
      case "Bills":
        return (
          <Bills
            propertyAddress={property.address}
            propertyType={property.type}
            propertyUnits={property.units}
          />
        );
      case "Notes":
        return (
          <Notes
            propertyAddress={property.address}
            propertyType={property.type}
            propertyUnits={property.units}
          />
        );
      case "Invoicing":
        return (
          <Invoicing
            propertyAddress={property.address}
            propertyType={property.type}
            propertyUnits={property.units}
            propertyLocation={property.location}
          />
        );
      default:
        return (
          <Overview
            propertyAddress={property.address}
            propertyLocation={property.location}
            propertyType={property.type}
            rentalOwner={property.rentalOwner}
            propertyManager={property.managers[0]?.name}
            propertyImage="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/b1dce1b4ec8292553f371f2747d334a444b1a4aa?placeholderIfAbsent=true"
          />
        );
    }
  };

  return (
    <PropertiesTemplate
      property={property}
      propertyAddress={property.address}
      propertyType={property.type}
      propertyUnits={property.units}
      activeTab={tab || "Overview"}
    >
      {renderPageContent()}
    </PropertiesTemplate>
  );
}
