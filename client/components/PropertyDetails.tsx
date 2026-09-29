import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import PageHeader from "@/components/PageHeader";
import AddPropertyModal from "@/components/AddPropertyModal";
import AddFileModal from "@/components/AddFileModal";
import PdfViewerModal from "@/components/PdfViewerModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  NotesTemplate,
  FilesTemplate,
} from "@/components/templates";
import { API_BASE, fetchJSON, authFetch } from "@/api/fetchJSON";
import { useParams } from "react-router-dom";

import type { RecentNote } from "@/hooks/usePropertyDetailsState";
import AddNoteModal from "./AddNoteModal";
import RateHistoryModal from "@/components/property-rates/RateHistoryModal";
import RateImpactNotice from "@/components/property-rates/RateImpactNotice";
import {
  currentMonthKey,
  diffRates,
  fetchRateHistory,
  formatMonthLabel,
  recordRateChange,
  type PropertyRates,
  type RateHistoryEntry,
  type RatesResponse,
} from "@/data/propertyRates";



type PropertyData = {
  id: number;
  name: string;
  buildium_property_id: string;
  property_type: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  units_count: number;
  management_fee_cents?: number;
  hourly_rate_cents?: number;
  emergency_hourly_rate_cents?: number;
  // Per-customer late fee; null on every property until one is opted in.
  late_fee_pct?: number | null;
  late_fee_flat_cents?: number | null;
  late_fee_grace_days?: number | null;
  active: boolean;
  created_at: string;
  manager_names: string[];
  manager_ids?: number[];
  owners?: { name: string }[];
  image_url?: string;
  image_storage_key?: string;
};

type BackendNote = {
  id: number;
  text: string;
  author: string;
  type: string;
  created_at: string;
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
  description?: string;
};

type BackendFile = {
  id: number;
  name: string;
  type: string;
  category: string;
  description: string;
  author: string;
  url: string;
  created_at: string;
};


// Helper to derive file icon from type
const getFileIcon = (fileType: string): string => {
  const lowerType = fileType.toLowerCase();
  
  if (lowerType === "pdf") {
    return "https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/5ef69f3c3e2f3e3b15cc6139a16a94f848b10be7?placeholderIfAbsent=true";
  }
  
  if (["doc", "docx"].includes(lowerType)) {
    return "https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/07da6a33a78bd70b7170adaa97b3fb7b14ff2fc0?placeholderIfAbsent=true";
  }
  
  // Default icon
  return "https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/07da6a33a78bd70b7170adaa97b3fb7b14ff2fc0?placeholderIfAbsent=true";
};

// Helper to format cents to display string
const formatCentsToMonthly = (cents?: number): string => {
  if (!cents) return "$0.00 / month";
  const dollars = (cents / 100).toFixed(2);
  return `$${dollars} / month`;
};

const formatCentsToHourly = (cents?: number): string => {
  if (!cents) return "$0 / hour";
  const dollars = Math.round(cents / 100);
  return `$${dollars} / hour`;
};

// Helper to format backend date to display format
const formatDate = (isoDate: string): string => {
  const date = new Date(isoDate);
  return date.toLocaleString(undefined, {
    month: "numeric",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

// Transform backend note to UI note
const transformNote = (backendNote: BackendNote): RecentNote => ({
  id: backendNote.id,
  text: backendNote.text,
  type: backendNote.type,
  date: formatDate(backendNote.created_at),
  author: backendNote.author,
});

// Transform backend file to UI file
const transformFile = (backendFile: BackendFile): RecentFile => ({
  id: backendFile.id,
  name: backendFile.name,
  category: backendFile.category,
  date: formatDate(backendFile.created_at),
  author: backendFile.author,
  type: backendFile.type,
  icon: getFileIcon(backendFile.type),
  url: backendFile.url,
  description: backendFile.description,
});

interface PropertyDetailsProps {
  propertyId: number;
}

const parseMoneyString = (val: string): number => {
  const num = parseFloat(val.replace(/[^0-9.]/g, ""));
  return isNaN(num) ? 0 : num;
};



export const PropertyDetails: React.FC<PropertyDetailsProps> = ({
  propertyId,
}) => {

  // Property data state
  const [propertyData, setPropertyData] = useState<PropertyData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Notes state
  const [recentNotes, setRecentNotes] = useState<RecentNote[]>([]);
  const [notesLoading, setNotesLoading] = useState(true);
  
  // Files state
  const [recentFiles, setRecentFiles] = useState<RecentFile[]>([]);
  const [filesLoading, setFilesLoading] = useState(true);

  // Modal states
  const [showMoreCustomFields, setShowMoreCustomFields] = useState(false);
  const [showPhotoUploadModal, setShowPhotoUploadModal] = useState(false);
  const [photoUploadFile, setPhotoUploadFile] = useState<File | null>(null);
  const [photoUploadError, setPhotoUploadError] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const photoFileInputRef = React.useRef<HTMLInputElement>(null);
  const [showEditPropertyModal, setShowEditPropertyModal] = useState(false);
  const [showEditCustomFieldsModal, setShowEditCustomFieldsModal] =
    useState(false);
  const [showEditRatesModal, setShowEditRatesModal] = useState(false);
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);
  const [showAddFileModal, setShowAddFileModal] = useState(false);
  const [showViewNoteModal, setShowViewNoteModal] = useState(false);
  const [showViewFileModal, setShowViewFileModal] = useState(false);

  // Draft states
  const [noteDraft, setNoteDraft] = useState("");
  const [viewNoteDraft, setViewNoteDraft] = useState("");
  const [fileDraft, setFileDraft] = useState<File | null>(null);
  const [selectedNote, setSelectedNote] = useState<RecentNote | null>(null);
  const [selectedFile, setSelectedFile] = useState<RecentFile | null>(null);
  const [fileCategoryDraft, setFileCategoryDraft] = useState("Uncategorized");
  const [managementAgreementDate, setManagementAgreementDate] = useState("");
  const [inspectionFrequency, setInspectionFrequency] = useState("Monthly");

  // Editable rates state
  const [monthlyRate, setMonthlyRate] = useState("$0.00 / month");
  const [defaultRate, setDefaultRate] = useState("$0 / hour");
  const [emergencyRate, setEmergencyRate] = useState("$0 / hour");

  // Per-customer late fee. Kept as raw strings so an empty field stays empty
  // (and clears the column) instead of being coerced to 0.
  const [lateFeePct, setLateFeePct] = useState("");
  const [lateFeeFlat, setLateFeeFlat] = useState("");
  const [lateFeeGraceDays, setLateFeeGraceDays] = useState("");
  const [lateFeeError, setLateFeeError] = useState<string | null>(null);

  // Rates are effective-dated: each save records a change effective from a
  // month, and invoices bill the rate in effect for the month they cover.
  const [rateEffectiveMonth, setRateEffectiveMonth] = useState(currentMonthKey());
  const [rateNote, setRateNote] = useState("");
  const [upcomingRateChange, setUpcomingRateChange] =
    useState<RateHistoryEntry | null>(null);
  const [showRateHistory, setShowRateHistory] = useState(false);
  // The form values when the Edit Rates modal opened. Only fields the user
  // actually changed are sent, so saving an unrelated change can never
  // overwrite a different change already scheduled for a later month.
  const [ratesFormAtOpen, setRatesFormAtOpen] = useState<{
    monthly: number;
    hourly: number;
    emergency: number;
    lateFeePct: string;
    lateFeeFlat: string;
    lateFeeGraceDays: string;
  } | null>(null);
  const isValidPropertyId = Number.isFinite(propertyId) && propertyId > 0;

  // Fetch property data
  useEffect(() => {
    if (!isValidPropertyId) return;
  
    const fetchPropertyData = async () => {
      try {
        setLoading(true);
        const data = await fetchJSON(`/properties/${propertyId}`);
        setPropertyData(data);
  
        setMonthlyRate(formatCentsToMonthly(data.management_fee_cents));
        setDefaultRate(formatCentsToHourly(data.hourly_rate_cents));
        setEmergencyRate(formatCentsToHourly(data.emergency_hourly_rate_cents));
        setLateFeePct(
          data.late_fee_pct == null ? "" : String(data.late_fee_pct)
        );
        setLateFeeFlat(
          data.late_fee_flat_cents == null
            ? ""
            : (data.late_fee_flat_cents / 100).toFixed(2)
        );
        setLateFeeGraceDays(
          data.late_fee_grace_days == null
            ? ""
            : String(data.late_fee_grace_days)
        );
      } catch (error) {
        console.error("Failed to fetch property data:", error);
      } finally {
        setLoading(false);
      }
    };
  
    fetchPropertyData();
  }, [propertyId, isValidPropertyId]);

  // Next scheduled rate change, for the "from <month>" line on the Rates card.
  useEffect(() => {
    if (!isValidPropertyId) return;
    fetchRateHistory(propertyId)
      .then((res) => setUpcomingRateChange(res.upcoming_rate_change ?? null))
      .catch((error) => console.error("Failed to fetch rate history:", error));
  }, [propertyId, isValidPropertyId]);

  // Fetch notes
  useEffect(() => {
    if (!isValidPropertyId) return;
  
    const fetchNotes = async () => {
      try {
        setNotesLoading(true);
        const notes = await fetchJSON(`/properties/notes/${propertyId}/notes`);
        setRecentNotes(Array.isArray(notes) ? notes.map(transformNote) : []);
      } catch (error) {
        console.error("Failed to fetch notes:", error);
      } finally {
        setNotesLoading(false);
      }
    };
  
    fetchNotes();
  }, [propertyId, isValidPropertyId]);
  

  // Fetch files
  useEffect(() => {
    if (!isValidPropertyId) return;
  
    const fetchFiles = async () => {
      try {
        setFilesLoading(true);
        const files = await fetchJSON(
          `/properties/files/${propertyId}/files`
        );
        setRecentFiles(Array.isArray(files) ? files.map(transformFile) : []);
      } catch (error) {
        console.error("Failed to fetch files:", error);
      } finally {
        setFilesLoading(false);
      }
    };
  
    fetchFiles();
  }, [propertyId, isValidPropertyId]);
  

  const handleSaveRates = async () => {
    if (!isValidPropertyId) return;
  
    // Blank clears the column; a value sets it. late_fee_set marks the group as
    // present so the backend writes all three rather than COALESCE-ignoring the
    // nulls — that is how the fee gets turned back off.
    const num = (s: string): number | null => {
      const t = s.trim();
      if (t === "") return null;
      const n = Number(t);
      return Number.isFinite(n) ? n : null;
    };
    const pct = num(lateFeePct);
    const flat = num(lateFeeFlat);
    const grace = num(lateFeeGraceDays);

    // Mirror the server rule so the operator gets the message inline rather
    // than as a failed request.
    const hasRate = (pct ?? 0) > 0 || (flat ?? 0) > 0;
    const hasGrace = (grace ?? 0) > 0;
    if (hasRate !== hasGrace) {
      setLateFeeError(
        "Late fees need both an amount (percentage and/or flat) and a grace period in days."
      );
      return;
    }
    if (!/^\d{4}-\d{2}$/.test(rateEffectiveMonth)) {
      setLateFeeError("Pick the month this change takes effect.");
      return;
    }
    setLateFeeError(null);

    // Only send what changed since the modal opened; the backend fills the
    // rest from the rates in effect for the chosen month.
    const initial = ratesFormAtOpen;
    const monthly = parseMoneyString(monthlyRate);
    const hourly = parseMoneyString(defaultRate);
    const emergency = parseMoneyString(emergencyRate);
    const lateFeeChanged =
      !initial ||
      initial.lateFeePct !== lateFeePct ||
      initial.lateFeeFlat !== lateFeeFlat ||
      initial.lateFeeGraceDays !== lateFeeGraceDays;
    const payload = {
      ...(!initial || initial.monthly !== monthly ? { management_fee: monthly } : {}),
      ...(!initial || initial.hourly !== hourly ? { hourly_rate: hourly } : {}),
      ...(!initial || initial.emergency !== emergency
        ? { emergency_hourly_rate: emergency }
        : {}),
      ...(lateFeeChanged
        ? {
            late_fee_set: true,
            late_fee_pct: pct,
            late_fee_flat: flat,
            late_fee_grace_days: grace === null ? null : Math.round(grace),
          }
        : {}),
    };
    if (Object.keys(payload).length === 0) {
      setShowEditRatesModal(false);
      return;
    }

    try {
      const updatedRates = await recordRateChange(propertyId, {
        ...payload,
        effective_month: rateEffectiveMonth,
        note: rateNote,
      });
      applyRates(updatedRates);
      setShowEditRatesModal(false);
    } catch (error) {
      console.error("Failed to update rates:", error);
      setLateFeeError(
        error instanceof Error ? error.message : "Failed to update rates."
      );
    }
  };

  // Show the rates in effect today (and the next scheduled change) on the
  // Rates card. Used after every rate write, including history edits.
  const applyRates = (updatedRates: RatesResponse) => {
      setUpcomingRateChange(updatedRates.upcoming_rate_change ?? null);
      // Update local property data (source of truth)
      setPropertyData((prev) =>
        prev
          ? {
              ...prev,
              management_fee_cents: updatedRates.management_fee_cents,
              hourly_rate_cents: updatedRates.hourly_rate_cents,
              emergency_hourly_rate_cents:
                updatedRates.emergency_hourly_rate_cents,
              late_fee_pct: updatedRates.late_fee_pct,
              late_fee_flat_cents: updatedRates.late_fee_flat_cents,
              late_fee_grace_days: updatedRates.late_fee_grace_days,
            }
          : prev
      );
  
      // Update display strings
      setMonthlyRate(formatCentsToMonthly(updatedRates.management_fee_cents));
      setDefaultRate(formatCentsToHourly(updatedRates.hourly_rate_cents));
      setEmergencyRate(
        formatCentsToHourly(updatedRates.emergency_hourly_rate_cents)
      );
      setLateFeePct(
        updatedRates.late_fee_pct == null
          ? ""
          : String(updatedRates.late_fee_pct)
      );
      setLateFeeFlat(
        updatedRates.late_fee_flat_cents == null
          ? ""
          : (updatedRates.late_fee_flat_cents / 100).toFixed(2)
      );
      setLateFeeGraceDays(
        updatedRates.late_fee_grace_days == null
          ? ""
          : String(updatedRates.late_fee_grace_days)
      );
  };

  // Reset the form from the SAVED rates every time the modal opens, so values
  // typed and then cancelled can't leak into the next edit (or into the
  // "what changed" comparison below).
  const openEditRates = () => {
    const monthly = formatCentsToMonthly(propertyData?.management_fee_cents);
    const hourly = formatCentsToHourly(propertyData?.hourly_rate_cents);
    const emergency = formatCentsToHourly(propertyData?.emergency_hourly_rate_cents);
    const pct =
      propertyData?.late_fee_pct == null ? "" : String(propertyData.late_fee_pct);
    const flat =
      propertyData?.late_fee_flat_cents == null
        ? ""
        : (propertyData.late_fee_flat_cents / 100).toFixed(2);
    const grace =
      propertyData?.late_fee_grace_days == null
        ? ""
        : String(propertyData.late_fee_grace_days);

    setMonthlyRate(monthly);
    setDefaultRate(hourly);
    setEmergencyRate(emergency);
    setLateFeePct(pct);
    setLateFeeFlat(flat);
    setLateFeeGraceDays(grace);
    setRateEffectiveMonth(currentMonthKey());
    setRateNote("");
    setLateFeeError(null);
    setRatesFormAtOpen({
      monthly: parseMoneyString(monthly),
      hourly: parseMoneyString(hourly),
      emergency: parseMoneyString(emergency),
      lateFeePct: pct,
      lateFeeFlat: flat,
      lateFeeGraceDays: grace,
    });
    setShowEditRatesModal(true);
  };

  // The Rates card always shows SAVED rates (in effect today), never the
  // Edit Rates form's in-progress values.
  const savedLateFeePct = propertyData?.late_fee_pct;
  const savedLateFeeFlat = propertyData?.late_fee_flat_cents;
  const savedLateFeeGrace = propertyData?.late_fee_grace_days;

  // "From November 2026: Monthly rate $600.00" for the next scheduled change.
  const upcomingSummary = (() => {
    if (!upcomingRateChange || !propertyData) return null;
    const current: PropertyRates = {
      management_fee_cents: propertyData.management_fee_cents ?? null,
      hourly_rate_cents: propertyData.hourly_rate_cents ?? null,
      emergency_hourly_rate_cents: propertyData.emergency_hourly_rate_cents ?? null,
      late_fee_pct: propertyData.late_fee_pct ?? null,
      late_fee_flat_cents: propertyData.late_fee_flat_cents ?? null,
      late_fee_grace_days: propertyData.late_fee_grace_days ?? null,
    };
    const changes = diffRates(current, upcomingRateChange);
    return `From ${formatMonthLabel(upcomingRateChange.effective_month)}: ${
      changes.length
        ? changes.map((c) => `${c.label} ${c.to}`).join(", ")
        : "no rate changes"
    }`;
  })();
  

  // Derived display values
  const propertyAddress = propertyData?.address_line1 || "";
  const propertyLocation = propertyData
    ? `${propertyData.city}, ${propertyData.state}, ${propertyData.postal_code}`
    : "";
  const propertyType = propertyData?.property_type || "";
  const ownerNames = propertyData?.owners?.map((owner: any) =>
    typeof owner === "string" ? owner : owner?.name ?? ""
  ).filter(Boolean) || [];
  const rentalOwner = ownerNames.length > 0 ? ownerNames.join(", ") : "----";
  const propertyManager = propertyData?.manager_names?.join(", ") ?? "";
  const placeholderImage =
    "https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/b1dce1b4ec8292553f371f2747d334a444b1a4aa?placeholderIfAbsent=true";
  const propertyImageUrl =
    propertyData?.image_url != null && propertyData.image_url !== ""
      ? `${API_BASE.replace(/\/$/, "")}/files/${propertyData.image_url.replace(/^\//, "")}`
      : null;
  const [propertyImageLoadFailed, setPropertyImageLoadFailed] = useState(false);
  const propertyImage =
    propertyImageUrl != null && !propertyImageLoadFailed
      ? propertyImageUrl
      : placeholderImage;

  // Reset load-failed state when the property or image URL changes (e.g. after upload)
  useEffect(() => {
    setPropertyImageLoadFailed(false);
  }, [propertyId, propertyData?.image_url]);

  const closeAddNote = () => {
    setNoteDraft("");
    setShowAddNoteModal(false);
  };

  const handleDeleteNote = async (id: number) => {
    try {
      await fetchJSON(`/properties/notes/${propertyId}/notes/${id}`, {
        method: "DELETE",
      });
      setRecentNotes((prev) => prev.filter((note) => note.id !== id));
      setSelectedNote(null);
      setShowViewNoteModal(false);
    } catch (error) {
      console.error("Failed to delete note:", error);
    }
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

  const handleDeleteFile = async (id: number) => {
    try {
      await fetchJSON(`/properties/files/${propertyId}/files/${id}`, {
        method: "DELETE",
      });
      setRecentFiles((prev) => {
        const fileToDelete = prev.find((f) => f.id === id);
        revokeBlobUrl(fileToDelete?.url);
        return prev.filter((file) => file.id !== id);
      });
      setSelectedFile(null);
      setShowViewFileModal(false);
    } catch (error) {
      console.error("Failed to delete file:", error);
    }
  };

  const openViewMaps = () => {
    const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(`${propertyAddress}, ${propertyLocation}`)}`;
    window.open(mapsUrl, "_blank");
  };

  const openAddNote = () => {
    setNoteDraft("");
    setShowAddNoteModal(true);
  };

  const openViewNote = (note: RecentNote) => {
    setSelectedNote(note);
    setViewNoteDraft(note.text);
    setShowViewNoteModal(true);
  };

  const closeViewNote = () => {
    setShowViewNoteModal(false);
    setSelectedNote(null);
    setViewNoteDraft("");
  };

  const handleAddNote = async (noteText: string) => {
    try {
      const newNote = await fetchJSON(`/properties/post-notes/${propertyId}/notes`, {
        method: "POST",
        body: JSON.stringify({ text: noteText }),
      });
      
      setRecentNotes((prev) => [...prev, transformNote(newNote)]);
      setShowAddNoteModal(false);
    } catch (error) {
      console.error("Failed to add note:", error);
    }
  };

  const handleUpdateNote = async () => {
    if (!selectedNote) return;
    
    const nextText = viewNoteDraft.trim();
    if (!nextText) return;

    try {
      const updatedNote = await fetchJSON(
        `/properties/${propertyId}/notes/${selectedNote.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({ text: nextText }),
        }
      );
      
      setRecentNotes((prev) =>
        prev.map((n) =>
          n.id === selectedNote.id ? transformNote(updatedNote) : n
        )
      );
      closeViewNote();
    } catch (error) {
      console.error("Failed to update note:", error);
    }
  };

  const handleAddFile = async (
    uploadedFiles: any[],
    category: string,
    description: string
  ) => {
    // -----------------------------
    // EDIT MODE
    // -----------------------------
    if (selectedFile) {
      try {
        await fetchJSON(
          `/properties/files/${propertyId}/files/${selectedFile.id}`,
          {
            method: "PATCH",
            body: JSON.stringify({
              category,
              description,
            }),
          }
        );
        setRecentFiles((prev) =>
          prev.map((f) =>
            f.id === selectedFile.id
              ? { ...f, category, description }
              : f
          )
        );
        setSelectedFile(null);
        setShowAddFileModal(false);
      } catch (error) {
        console.error("Failed to update file:", error);
      }
      return;
    }

    // -----------------------------
    // ADD MODE
    // -----------------------------
    const uploaded = uploadedFiles[0];
    const rawFile: File | undefined = uploaded?.file;

    if (!rawFile) {
      console.error("No file provided");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", rawFile);

      const uploadRes = await authFetch(
        `/properties/files/${propertyId}/upload`,
        {
          method: "POST",
          body: formData,
        },
      );

      if (!uploadRes.ok) {
        const errText = await uploadRes.text();
        throw new Error(`Upload failed: ${errText}`);
      }

      const uploadData = await uploadRes.json();
      const objectKey = uploadData?.object_key;
      if (!objectKey) {
        throw new Error("Upload did not return object_key");
      }

      const newFile = await fetchJSON(
        `/properties/post-files/${propertyId}/files`,
        {
          method: "POST",
          body: JSON.stringify({
            name: rawFile.name,
            type: rawFile.name.split(".").pop() || "file",
            category,
            description,
            object_key: objectKey,
            author: "System",
          }),
        },
      );

      setRecentFiles((prev) => [...prev, transformFile(newFile)]);
      setSelectedFile(null);
      setShowAddFileModal(false);
    } catch (error) {
      console.error("Failed to add file:", error);
    }
  };
  

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-gray-500">Loading property details...</div>
      </div>
    );
  }
  
  if (!propertyData && !loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-red-500">Failed to load property details</div>
      </div>
    );
  }
  return (
    <div className="flex justify-center font-[Geist,-apple-system,Roboto,Helvetica,sans-serif]">
      <div className="flex flex-col w-full min-w-[240px]">
        <div className="rounded-lg bg-white shadow-[0_1px_3px_rgba(0,0,0,0.03)] border border-[#E5E5E5] flex flex-col w-full p-4">
          {/* Property Details Section */}
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
              <div className="flex flex-col items-start">
                <img
                  loading="lazy"
                  srcSet={
                    propertyImage === placeholderImage
                      ? undefined
                      : `${propertyImage} 100w, ${propertyImage} 200w, ${propertyImage} 400w`
                  }
                  src={propertyImage}
                  onError={() => setPropertyImageLoadFailed(true)}
                  className="rounded-lg min-w-[240px] w-[251px] aspect-[1.57] object-cover"
                  alt="Property"
                />
              </div>
              <div className="flex min-w-[240px] min-h-[160px] flex-col flex-1">
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

                <div className="flex mt-5 w-full flex-col gap-3">
                  {/* Owners + Managers row */}
                  <div className="flex w-full items-baseline gap-14">
                    <div className="flex flex-col">
                      <div className="text-[#71717A] text-xs leading-[1.33]">
                        RENTAL OWNERS
                      </div>
                      <div className="flex flex-col self-start mt-1 gap-1 text-base text-[#303030] leading-[1.13]">
                        {ownerNames.length > 0 ? (
                          ownerNames.map((name, index) => (
                            <div key={index}>{name}</div>
                          ))
                        ) : (
                          <div>----</div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col">
                      <div className="text-[#71717A] text-xs leading-[1.33]">
                        MANAGER
                      </div>
                      <div className="text-[#303030] text-base leading-[1.13] mt-1">
                        {propertyManager || "—"}
                      </div>
                    </div>
                  </div>

                  {/* Upload Photo row */}
                  <button
                    onClick={() => setShowPhotoUploadModal(true)}
                    className="flex items-center gap-1 text-sm text-[#2463EB] tracking-[-0.28px] leading-[1.4]"
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
          </div>

          {/* Separator */}
          <img
            loading="lazy"
            src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/993a5d1a37af0ace04ef2b831d3364f722125c87?placeholderIfAbsent=true"
            className="w-full mt-3"
            alt=""
          />

          {/* Custom Fields and Rates Section */}
          <div className="flex mt-5 w-full items-start gap-5 font-medium flex-wrap">
            <div className="flex min-w-[240px] flex-col flex-1">
              <div className="flex w-full items-center justify-between gap-4 flex-wrap whitespace-nowrap">
                <div className="text-[#303030] text-xl leading-[1.1]">
                  Rates
                </div>
                <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowRateHistory(true)}
                  className="rounded-lg text-sm text-[#2463EB] tracking-[-0.28px] leading-[1.4]"
                >
                  View history
                </button>
                <button
                  onClick={openEditRates}
                  className="rounded-lg flex items-center gap-1 text-sm text-[#2463EB] tracking-[-0.28px] leading-[1.4]"
                >
                  <img
                    loading="lazy"
                    src="https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/f92d3adcec91cdb58440abba9eb347ee0521346c?placeholderIfAbsent=true"
                    className="w-3 h-3"
                    alt=""
                  />
                  <span>Edit</span>
                </button>
                </div>
              </div>

              {upcomingSummary && (
                <div className="mt-2 rounded-lg bg-[#EFF6FF] px-3 py-2 text-xs text-[#1E40AF]">
                  Scheduled — {upcomingSummary}
                </div>
              )}

              <div className="flex mt-3 w-full flex-col">
                <div className="flex flex-col w-full">
                  <div className="text-[#303030] text-base leading-[1.38]">
                    Management Fee
                  </div>
                  <div className="self-start flex mt-3 items-start gap-14 text-xs text-[#71717A] leading-[1.33]">
                    <div className="flex flex-col">
                      <div>MONTHLY RATE</div>
                      <div>{formatCentsToMonthly(propertyData?.management_fee_cents)}</div>
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
                      <div>{formatCentsToHourly(propertyData?.hourly_rate_cents)}</div>
                    </div>
                    <div className="flex flex-col">
                      <div>EMERGENCY RATE</div>
                      <div>{formatCentsToHourly(propertyData?.emergency_hourly_rate_cents)}</div>
                    </div>
                  </div>
                </div>

                <div className="flex mt-5 w-full flex-col">
                  <div className="text-[#303030] text-base leading-[1.38]">
                    Late Fee
                  </div>
                  <div className="self-start flex mt-3 items-start gap-14 text-xs text-[#71717A] leading-[1.33]">
                    <div className="flex flex-col">
                      <div>PERCENTAGE</div>
                      <div>{savedLateFeePct ? `${savedLateFeePct}%` : "N/A"}</div>
                    </div>
                    <div className="flex flex-col">
                      <div>FLAT</div>
                      <div>
                        {savedLateFeeFlat ? `$${(savedLateFeeFlat / 100).toFixed(2)}` : "N/A"}
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <div>GRACE</div>
                      <div>
                        {savedLateFeeGrace ? `${savedLateFeeGrace} days` : "N/A"}
                      </div>
                    </div>
                  </div>
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
          <NotesTemplate
            notes={recentNotes}
            onAdd={openAddNote}
            onEdit={openViewNote}
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
              setShowAddFileModal(true);
            }}
            onDelete={(fileId) => handleDeleteFile(fileId)}
            onView={(file) => {
              setSelectedFile(file);
              setShowViewFileModal(true);
            }}
            isLast={true}
            emptyMessage="You don't have any files for this property right now."
          />

          {/* View Note Modal */}
          {showViewNoteModal &&
            selectedNote &&
            createPortal(
              <div
                className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4"
                onClick={closeViewNote}
              >
                <div
                  className="w-full max-w-[560px] rounded-xl bg-white shadow-lg border border-[#E5E5E5]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E5E5]">
                    <div className="text-[#303030] font-medium text-lg">
                      Note Details
                    </div>
                    <button
                      onClick={closeViewNote}
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
                  <div className="px-6 py-5 grid gap-4">
                    <Textarea
                      value={viewNoteDraft}
                      onChange={(e) => setViewNoteDraft(e.target.value)}
                      className="min-h-[140px] rounded-lg border-[#E5E5E5] bg-[#F7F7F7] placeholder:text-[#A1A1A9] text-base font-normal tracking-[-0.32px] leading-[140%] resize-none"
                    />
                    <div className="text-sm text-[#71717A]">
                      <span className="font-medium">Author:</span>{" "}
                      {selectedNote.author}
                    </div>
                    <div className="text-sm text-[#71717A]">
                      <span className="font-medium">Date:</span>{" "}
                      {selectedNote.date}
                    </div>
                  </div>
                  <div className="px-6 py-4 border-t border-[#E5E5E5] flex items-center justify-end gap-2">
                    <button
                      onClick={closeViewNote}
                      className="flex h-9 justify-center items-center gap-2 px-4 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-[#303030] font-normal text-base capitalize">
                        Cancel
                      </span>
                    </button>
                    <button
                      onClick={handleUpdateNote}
                      disabled={!viewNoteDraft.trim()}
                      className="flex h-9 items-center gap-2 px-4 rounded-lg border border-white bg-[#013764] shadow-[0_0_0_1px_#002D5A,0_0_10px_-5px_rgba(0,0,0,0.2)] hover:bg-[#003a73] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="text-white font-medium text-base">
                        Save
                      </span>
                    </button>
                  </div>
                </div>
              </div>,
              document.body,
            )}

          {/* PDF Viewer */}
          <PdfViewerModal
            open={showViewFileModal}
            onOpenChange={(open) => {
              setShowViewFileModal(open);
              if (!open) setSelectedFile(null);
            }}
            title={selectedFile?.name || "File Preview"}
            url={
              selectedFile?.url
                ? selectedFile.url.startsWith("/")
                  ? `${API_BASE}${selectedFile.url}`
                  : selectedFile.url
                : undefined
            }
          />

          {/* Legacy View File Modal */}
          {false &&
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
                    <div className="text-[#303030] font-medium text-lg">
                      File Details
                    </div>
                    <button
                      onClick={() => {
                        setShowViewFileModal(false);
                        setSelectedFile(null);
                      }}
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
                  <div className="px-6 py-5 grid gap-4">
                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <img src={selectedFile.icon} alt="" className="w-9 h-9" />
                      <div>
                        <div className="text-[#303030] font-medium">
                          {selectedFile.name}
                        </div>
                        {selectedFile.subtitle ? (
                          <div className="text-sm text-[#71717A]">
                            {selectedFile.subtitle}
                          </div>
                        ) : null}
                      </div>
                    </div>
                    <div className="text-sm text-[#71717A]">
                      <span className="font-medium">Category:</span>{" "}
                      {selectedFile.category}
                    </div>
                    <div className="text-sm text-[#71717A]">
                      <span className="font-medium">Date:</span>{" "}
                      {selectedFile.date}
                    </div>
                    <div className="text-sm text-[#71717A]">
                      <span className="font-medium">Author:</span>{" "}
                      {selectedFile.author}
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
                      <span className="text-[#303030] font-normal text-base capitalize">
                        Close
                      </span>
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
                onClick={() => {
                  setShowPhotoUploadModal(false);
                  setPhotoUploadFile(null);
                  setPhotoUploadError(null);
                }}
              >
                <div
                  className="w-full max-w-[560px] rounded-xl bg-white shadow-lg border border-[#E5E5E5]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E5E5]">
                    <div className="text-[#303030] font-medium text-lg">
                      Upload Photo
                    </div>
                    <button
                      onClick={() => {
                        setShowPhotoUploadModal(false);
                        setPhotoUploadFile(null);
                        setPhotoUploadError(null);
                      }}
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
                      ref={photoFileInputRef}
                      type="file"
                      accept="image/*"
                      className="block w-full text-sm text-[#303030] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#013764] file:text-white hover:file:bg-[#003a73]"
                      onChange={(e) => {
                        const file = e.target.files?.[0] ?? null;
                        setPhotoUploadFile(file);
                        setPhotoUploadError(null);
                      }}
                    />
                    {photoUploadFile && (
                      <div className="text-sm text-[#71717A]">
                        Selected: {photoUploadFile.name}
                      </div>
                    )}
                    {photoUploadError && (
                      <div className="text-sm text-red-600">{photoUploadError}</div>
                    )}
                  </div>
                  <div className="px-6 py-4 border-t border-[#E5E5E5] flex items-center justify-end gap-2">
                    <button
                      onClick={() => {
                        setShowPhotoUploadModal(false);
                        setPhotoUploadFile(null);
                        setPhotoUploadError(null);
                      }}
                      className="flex h-9 justify-center items-center gap-2 px-4 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-[#303030] font-normal text-base capitalize">
                        Cancel
                      </span>
                    </button>
                    <button
                      disabled={!photoUploadFile || photoUploading}
                      onClick={async () => {
                        if (!photoUploadFile) return;
                        setPhotoUploadError(null);
                        setPhotoUploading(true);
                        try {
                          const formData = new FormData();
                          formData.append("file", photoUploadFile);
                          const uploadRes = await authFetch(
                            `/properties/images/upload`,
                            {
                              method: "POST",
                              body: formData,
                            }
                          );
                          if (!uploadRes.ok) {
                            const errText = await uploadRes.text();
                            throw new Error(
                              `Upload failed: ${uploadRes.status} ${errText}`
                            );
                          }
                          const uploadData = await uploadRes.json();
                          const storagePath =
                            uploadData?.storage_path ?? uploadData?.object_key;
                          if (!storagePath) {
                            throw new Error(
                              "Upload did not return storage_path"
                            );
                          }
                          const updated = await fetchJSON(
                            `/properties/patch/${propertyId}`,
                            {
                              method: "PATCH",
                              body: JSON.stringify({
                                image_url: storagePath,
                                image_storage_key: storagePath,
                              }),
                            }
                          );
                          setPropertyData((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  image_url: updated?.image_url ?? storagePath,
                                  image_storage_key:
                                    updated?.image_storage_key ?? storagePath,
                                }
                              : prev
                          );
                          setShowPhotoUploadModal(false);
                          setPhotoUploadFile(null);
                          if (photoFileInputRef.current) {
                            photoFileInputRef.current.value = "";
                          }
                        } catch (err) {
                          setPhotoUploadError(
                            err instanceof Error ? err.message : "Upload failed"
                          );
                        } finally {
                          setPhotoUploading(false);
                        }
                      }}
                      className="flex h-9 items-center gap-2 px-4 rounded-lg border border-white bg-[#013764] shadow-[0_0_0_1px_#002D5A,0_0_10px_-5px_rgba(0,0,0,0.2)] hover:bg-[#003a73] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="text-white font-medium text-base">
                        {photoUploading ? "Uploading…" : "Upload"}
                      </span>
                    </button>
                  </div>
                </div>
              </div>,
              document.body,
            )}

          {/* Edit Property Modal */}
          <AddPropertyModal
            open={showEditPropertyModal}
            onOpenChange={setShowEditPropertyModal}
            editData={{
              address: propertyAddress,
              location: propertyLocation,
              type: propertyType,
              buildingId: propertyData.buildium_property_id,
              status: propertyData.active ? "active" : "inactive",
              managers: propertyData.manager_names.map((name, idx) => ({
                id: `pm-${idx}`,
                name,
                initials: name
                  .split(" ")
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((p) => p[0]?.toUpperCase())
                  .join(""),
              })),
              rentalOwner,
            }}
          />

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
                    <div className="text-[#303030] font-medium text-lg">
                      Edit Custom Fields
                    </div>
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
                      <label className="text-sm font-medium text-[#303030]">
                        Management Agreement Date
                      </label>
                      <input
                        type="date"
                        value={managementAgreementDate}
                        onChange={(e) =>
                          setManagementAgreementDate(e.target.value)
                        }
                        className="w-full rounded-lg border border-[#DADADA] px-3 py-2 text-sm text-[#303030] focus:outline-none focus:ring-2 focus:ring-[#013764]"
                      />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-medium text-[#303030]">
                        Inspection Frequency
                      </label>
                      <Select
                        value={inspectionFrequency}
                        onValueChange={setInspectionFrequency}
                      >
                        <SelectTrigger className="w-full rounded-lg border border-[#DADADA] bg-white px-3 py-2 text-sm text-[#303030] focus:ring-2 focus:ring-[#013764]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-[#DADADA] rounded-lg">
                          <SelectItem value="Weekly">Weekly</SelectItem>
                          <SelectItem value="Biweekly">Biweekly</SelectItem>
                          <SelectItem value="Monthly">Monthly</SelectItem>
                          <SelectItem value="Bi-Monthly">Bi-Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="px-6 py-4 border-t border-[#E5E5E5] flex items-center justify-end gap-2">
                    <button
                      onClick={() => setShowEditCustomFieldsModal(false)}
                      className="flex h-9 justify-center items-center gap-2 px-4 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-[#303030] font-normal text-base capitalize">
                        Cancel
                      </span>
                    </button>
                    <button
                      onClick={() => {
                        setManagementAgreementDate(managementAgreementDate);
                        setInspectionFrequency(inspectionFrequency);
                        setShowEditCustomFieldsModal(false);
                      }}
                      className="flex h-9 items-center gap-2 px-4 rounded-lg border border-white bg-[#013764] shadow-[0_0_0_1px_#002D5A,0_0_10px_-5px_rgba(0,0,0,0.2)] hover:bg-[#003a73] transition-colors"
                    >
                      <span className="text-white font-medium text-base">
                        Save
                      </span>
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
                    <div className="text-[#303030] font-medium text-lg">
                      Edit Rates
                    </div>
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
                      <label className="text-sm font-medium text-[#303030]">
                        Monthly Rate
                      </label>
                      <input
                        type="number"
                        value={monthlyRate.replace(/[^0-9.]/g, "")}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (!val || /^[0-9.]+$/.test(val)) {
                            setMonthlyRate(val);
                          }
                        }}
                        placeholder="0.00"
                        className="w-full rounded-lg border border-[#DADADA] px-3 py-2 text-sm text-[#303030] focus:outline-none focus:ring-2 focus:ring-[#013764]"
                      />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-medium text-[#303030]">
                        Default Rate
                      </label>
                      <input
                        type="number"
                        value={defaultRate.replace(/[^0-9.]/g, "")}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (!val || /^[0-9.]+$/.test(val)) {
                            setDefaultRate(val);
                          }
                        }}
                        placeholder="0.00"
                        className="w-full rounded-lg border border-[#DADADA] px-3 py-2 text-sm text-[#303030] focus:outline-none focus:ring-2 focus:ring-[#013764]"
                      />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-medium text-[#303030]">
                        Emergency Rate
                      </label>
                      <input
                        type="number"
                        value={emergencyRate.replace(/[^0-9.]/g, "")}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (!val || /^[0-9.]+$/.test(val)) {
                            setEmergencyRate(val);
                          }
                        }}
                        placeholder="0.00"
                        className="w-full rounded-lg border border-[#DADADA] px-3 py-2 text-sm text-[#303030] focus:outline-none focus:ring-2 focus:ring-[#013764]"
                      />
                    </div>

                    <div className="pt-1 border-t border-[#E5E5E5]">
                      <div className="pt-4 text-sm font-medium text-[#303030]">
                        Late Fee
                      </div>
                      <p className="mt-1 text-xs text-[#737373]">
                        Added directly to any invoice still unpaid past the
                        grace period, the next time this property's invoice is
                        generated. Leave blank to disable.
                      </p>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="grid gap-2">
                        <label className="text-sm font-medium text-[#303030]">
                          Percentage
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={lateFeePct}
                          onChange={(e) => setLateFeePct(e.target.value)}
                          placeholder="1.50"
                          className="w-full rounded-lg border border-[#DADADA] px-3 py-2 text-sm text-[#303030] focus:outline-none focus:ring-2 focus:ring-[#013764]"
                        />
                      </div>
                      <div className="grid gap-2">
                        <label className="text-sm font-medium text-[#303030]">
                          Flat ($)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={lateFeeFlat}
                          onChange={(e) => setLateFeeFlat(e.target.value)}
                          placeholder="0.00"
                          className="w-full rounded-lg border border-[#DADADA] px-3 py-2 text-sm text-[#303030] focus:outline-none focus:ring-2 focus:ring-[#013764]"
                        />
                      </div>
                      <div className="grid gap-2">
                        <label className="text-sm font-medium text-[#303030]">
                          Grace (days)
                        </label>
                        <input
                          type="number"
                          step="1"
                          min="0"
                          value={lateFeeGraceDays}
                          onChange={(e) => setLateFeeGraceDays(e.target.value)}
                          placeholder="15"
                          className="w-full rounded-lg border border-[#DADADA] px-3 py-2 text-sm text-[#303030] focus:outline-none focus:ring-2 focus:ring-[#013764]"
                        />
                      </div>
                    </div>
                    <div className="pt-1 border-t border-[#E5E5E5]" />
                    <div className="grid grid-cols-2 gap-3">
                      <div className="grid gap-2">
                        <label className="text-sm font-medium text-[#303030]">
                          Effective from
                        </label>
                        <input
                          type="month"
                          value={rateEffectiveMonth}
                          onChange={(e) => setRateEffectiveMonth(e.target.value)}
                          className="w-full rounded-lg border border-[#DADADA] px-3 py-2 text-sm text-[#303030] focus:outline-none focus:ring-2 focus:ring-[#013764]"
                        />
                      </div>
                      <div className="grid gap-2">
                        <label className="text-sm font-medium text-[#303030]">
                          Note (optional)
                        </label>
                        <input
                          type="text"
                          value={rateNote}
                          onChange={(e) => setRateNote(e.target.value)}
                          placeholder="e.g. scope reduced"
                          className="w-full rounded-lg border border-[#DADADA] px-3 py-2 text-sm text-[#303030] focus:outline-none focus:ring-2 focus:ring-[#013764]"
                        />
                      </div>
                    </div>
                    <p className="-mt-2 text-xs text-[#737373]">
                      Invoices for {rateEffectiveMonth ? formatMonthLabel(rateEffectiveMonth) : "that month"} onward
                      bill the new rates; earlier months keep the rates they had.
                    </p>
                    <RateImpactNotice
                      propertyId={propertyId}
                      effectiveMonth={rateEffectiveMonth}
                    />
                    {lateFeeError && (
                      <div className="text-sm text-[#B42318]">
                        {lateFeeError}
                      </div>
                    )}
                  </div>
                  <div className="px-6 py-4 border-t border-[#E5E5E5] flex items-center justify-end gap-2">
                    <button
                      onClick={() => setShowEditRatesModal(false)}
                      className="flex h-9 justify-center items-center gap-2 px-4 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-[#303030] font-normal text-base capitalize">
                        Cancel
                      </span>
                    </button>
                    <button
                      onClick={handleSaveRates}
                      className="flex h-9 items-center gap-2 px-4 rounded-lg border border-white bg-[#013764] shadow-[0_0_0_1px_#002D5A,0_0_10px_-5px_rgba(0,0,0,0.2)] hover:bg-[#003a73] transition-colors"
                    >
                      <span className="text-white font-medium text-base">
                        Save
                      </span>
                    </button>
                  </div>
                </div>
              </div>,
              document.body,
            )}

          {/* Rate History Modal */}
          <RateHistoryModal
            propertyId={propertyId}
            open={showRateHistory}
            onClose={() => setShowRateHistory(false)}
            onRatesChanged={applyRates}
          />

          {/* Add Note Modal */}
          <AddNoteModal
            open={showAddNoteModal}
            onOpenChange={(open) => {
              if (!open) setShowAddNoteModal(false);
            }}
            isEditMode={false}
            initialText=""
            onSubmit={handleAddNote}
          />

          {/* Add File Modal */}
          <AddFileModal
            open={showAddFileModal}
            onOpenChange={(open) => {
              setShowAddFileModal(open);
              if (!open) setSelectedFile(null);
            }}
            isEditMode={!!selectedFile}
            initialFiles={
              selectedFile
                ? [
                    {
                      id: String(selectedFile.id),
                      name: selectedFile.name,
                      size: 0,
                      type: selectedFile.type,
                      url: selectedFile.url,
                    },
                  ]
                : []
            }
            initialCategory={selectedFile?.category || ""}
            initialDescription={selectedFile?.description || ""}
            acceptedFormats=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
            onSubmit={handleAddFile}
          />
        </div>
      </div>
    </div>
  );
};