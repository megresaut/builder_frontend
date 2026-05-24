import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { ArrowLeft, Bell, Share2, Mail, ChevronDown, Plus, History } from "lucide-react";
import { EditIcon } from "@/components/icons";
import SectionCard from "@/components/SectionCard";
import PeopleCard from "@/components/PeopleCard";
import BillsCard from "./BillsCard";
import {
  NotesTemplate,
  FilesTemplate,
  SectionActionTemplate,
} from "@/components/templates";
import PhotoGallery from "@/components/PhotoGallery";
import type { Photo, PhotoLabel } from "@/components/PhotoGallery";
import TaskStatusBadge from "@/components/TaskStatusBadge";
import TaskPriorityBadge from "@/components/TaskPriorityBadge";
import { StatusSelectField } from "@/components/forms/StatusSelectField";
import { PrioritySelectField } from "@/components/forms/PrioritySelectField";
import { DateField } from "@/components/forms/DateField";
import { CurrencyField } from "@/components/forms/CurrencyField";
import { cn, formatUSD } from "@/lib/utils";
import { AddNoteModal, AddFileModal, AddPhotoModal } from "@/components/task";
import type { PhotoUpload } from "@/components/task";
import PopoverActionsDropdown from "@/components/PopoverActionsDropdown";
import PdfViewerModal from "@/components/PdfViewerModal";
import MsgViewerModal from "@/components/MsgViewerModal";
import CreateWorkOrderModalV2 from "@/components/CreateWorkOrderModalV2";
import { parseMsgFile } from "@/utils/parseMsgFile";
import type { ParsedMsg } from "@/utils/parseMsgFile";
import {
  ModalTemplate,
  ModalField,
  ModalButtons,
} from "@/components/ui/ModalTemplate";
import type { UploadedFile } from "@/components/ui/attachment-uploader";
import type { Note, File } from "@/components/templates";
import { FormLayout, FormSection } from "@/components/ui/form-layout";
import { fetchJSON, API_BASE, authFetch } from "@/api/fetchJSON";
import { useAuth } from "@/auth/useAuth";
import { convertFiletoPdf } from "@/utils/convertFiletoPdf";
import { formatUnitDisplayForTable } from "@/utils/unitLabel";
import { WorkOrderEvaluation, WorkOrderEvaluationData } from "@/components/WorkOrderEvaluation";

interface WorkOrder {
  id: number;
  task: string;
  property: string;
  unit: string;
  status: string;
  priority: string;
  dueDate: string | Date | null;
  invoiceNumber?: string;
  vendorName?: string;
  chargeTo?: string;
  description?: string;
  notes?: Note[];
  files?: File[];
}

interface WorkOrderDetailsV2Props {
  workOrder: WorkOrder;
  currentAssignees?: any[];
  currentCollaborators?: any[];
  onWorkOrderUpdate?: (updatedWorkOrder: WorkOrder) => void;
  isUpdateWorkOrderModalOpen?: boolean;
  onUpdateWorkOrderModalOpenChange?: (open: boolean) => void;
  onBillAdded?: (bill: any) => void;
}

const vendorMasterData: Record<
  string,
  { email: string; phone: string; id: number }
> = {
  "ABC Doors & Hardware": {
    email: "info@abcdoors.com",
    phone: "(555) 123-1234",
    id: 1,
  },
  "Elite HVAC Services": {
    email: "contact@elitehvac.com",
    phone: "(555) 234-5678",
    id: 2,
  },
  "Glass & Frames Inc": {
    email: "sales@glassframes.com",
    phone: "(555) 345-6789",
    id: 3,
  },
  "Pro Roofing Solutions": {
    email: "quote@proroofing.com",
    phone: "(555) 456-7890",
    id: 4,
  },
  "Dolce Plumbing & Heating LLC": {
    email: "service@dolceplumbing.com",
    phone: "(555) 567-8901",
    id: 5,
  },
  "Spark Electrical": {
    email: "jobs@sparkelectrical.com",
    phone: "(555) 678-9012",
    id: 6,
  },
  "Premium Painters Co": {
    email: "estimate@premiumpainters.com",
    phone: "(555) 789-0123",
    id: 7,
  },
  "Quality Flooring LLC": {
    email: "orders@qualityflooring.com",
    phone: "(555) 890-1234",
    id: 8,
  },
  "Green Lawn Services": {
    email: "schedule@greenlawn.com",
    phone: "(555) 901-2345",
    id: 9,
  },
  "Outdoor Construction Corp": {
    email: "bids@outdoorconstruction.com",
    phone: "(555) 012-3456",
    id: 10,
  },
};

const getVendorEmail = (vendorName?: string): string => {
  if (!vendorName) return "";
  return vendorMasterData[vendorName]?.email || "";
};

const getVendorPhone = (vendorName?: string): string => {
  if (!vendorName) return "";
  return vendorMasterData[vendorName]?.phone || "";
};

// Helper function to get vendor href from vendor ID
const getVendorHref = (vendorId?: number): string | undefined => {
  if (!vendorId) return undefined;
  return `/vendors/${vendorId}`;
};

// API response interface
interface ApiWorkOrder {
  id: number;
  task_id: number;
  property_id: number;
  vendor_id?: number;
  name: string;
  description?: string;
  vendor_notes?: string;
  internal_notes?: string;
  status: string;
  priority: string;
  due_date?: string;
  entry_preference?: string;
  assignee?: string;
  estimated_cost?: number;
  estimate_parts?: number;
  estimate_labor?: number;
  estimate_tax_rate?: number;
  estimate_tax_amount?: number;
  actual_cost?: number;
  dispatched_at?: string;
  completed_at?: string;
  completed_by?: number;
  created_at: string;
  updated_at: string;
  attachments?: Array<{
    id: number;
    work_order_id: number;
    file_name: string;
    file_type: string;
    file_size: number;
    storage_path: string;
    uploaded_by_type: string;
    uploaded_by: number;
    uploaded_by_name?: string;
    label?: string;
    description?: string;
    created_at: string;
  }>;
  bill_id?: number;
  bill_total_cents?: number;
  bill_vendor_name?: string;
  bill_invoice_number?: string;
  bill_statement_date?: string;
  bill_updated_at?: string;
  vendor_name?: string;
  vendor_email?: string;
  vendor_phone?: string;
  property_name?: string;
  created_by_name?: string;
  created_by_email?: string;
  created_by_role?: string;
  estimate_total?: number;
  work_order_total?: number;
  last_updated?: string;
}

/**
 * API response shape for work order notes
 */
interface ApiWorkOrderNote {
  id: number;
  work_order_id: number;
  author_type: string;
  author_id: number;
  author_name?: string | null;
  body: string;
  is_visible_to_client: boolean;
  created_at: string;
  updated_at: string | null;
}

/**
 * API response shape for work order attachments
 */
interface ApiWorkOrderAttachment {
  id: number;
  work_order_id: number;
  file_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  uploaded_by_type: string;
  uploaded_by: number;
  uploaded_by_name?: string;
  label: string | null;
  description: string | null;
  created_at: string;
}

interface PropertyManagerRecord {
  id: number;
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
}

/**
 * Transform API note to UI Note format
 */
function transformApiNoteToUiNote(
  apiNote: ApiWorkOrderNote,
  propertyManagers?: Map<number, string>,
): Note {
  // Format date to "MM/DD/YYYY HH:MM AM/PM" format
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Prefer the name the API joined in; fall back to the PM map, then "User".
  const authorName =
    apiNote.author_name?.trim() ||
    propertyManagers?.get(apiNote.author_id) ||
    "User";

  return {
    id: apiNote.id,
    text: apiNote.body,
    date: formatDate(apiNote.created_at),
    author: authorName,
    // Store API fields for potential future use
    author_type: apiNote.author_type,
    author_id: apiNote.author_id,
    is_visible_to_client: apiNote.is_visible_to_client,
    created_at: apiNote.created_at,
    updated_at: apiNote.updated_at,
  };
}

/** Shape for estimate history entries (matches backend API).
 *  old_value / new_value track the total. parts/labor track component deltas
 *  and are nullable — historical rows written before migration 038 only have
 *  the total populated. */
interface EstimateHistoryEntry {
  id: number;
  work_order_id?: number;
  changed_by?: number | null;
  old_value: number | null;
  new_value: number | null;
  old_parts?: number | null;
  new_parts?: number | null;
  old_labor?: number | null;
  new_labor?: number | null;
  old_tax_rate?: number | null;
  new_tax_rate?: number | null;
  old_tax_amount?: number | null;
  new_tax_amount?: number | null;
  created_at: string;
  changed_by_name?: string | null;
}

function formatEstimateValue(val: number | null): string {
  if (val === null || val === undefined) return "—";
  return formatUSD(val);
}

function formatHistoryDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function EstimateHistoryTimeline({
  entries,
}: {
  entries: Array<EstimateHistoryEntry>;
}) {
  const safeEntries = Array.isArray(entries) ? entries : [];
  if (safeEntries.length === 0) {
    return (
      <p className="text-[#717179] text-sm py-6 text-center">
        No estimate history yet. Please update the total to add the first entry.
      </p>
    );
  }

  return (
    <div className="flex flex-col py-2">
      <div className="relative">
        {/* Vertical timeline rail */}
        <div
          className="absolute left-[7px] top-2 bottom-2 w-px bg-[#e5e5e5]"
          aria-hidden
        />
        {safeEntries.map((entry) => {
          const isInitial = entry.old_value === null || entry.old_value === undefined;
          return (
            <div
              key={entry.id}
              className="relative flex gap-4 pl-8 pb-5 last:pb-0"
            >
              {/* Dot */}
              <div
                className="absolute left-0 w-[15px] h-[15px] rounded-full border-2 border-[#2463eb] bg-white"
                aria-hidden
              />
              <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                <div className="text-[#303030] text-sm font-medium">
                  {entry.changed_by_name ?? "Someone"}
                  {isInitial ? (
                    <>
                      {" set estimate to "}
                      <span className="text-[#013764] font-semibold">
                        {formatEstimateValue(entry.new_value)}
                      </span>
                    </>
                  ) : (
                    <>
                      {" changed estimate from "}
                      <span className="text-[#717179] font-normal">
                        {formatEstimateValue(entry.old_value)}
                      </span>
                      {" to "}
                      <span className="text-[#013764] font-semibold">
                        {formatEstimateValue(entry.new_value)}
                      </span>
                    </>
                  )}
                </div>
                {(entry.new_parts != null || entry.new_labor != null ||
                  entry.old_parts != null || entry.old_labor != null ||
                  entry.new_tax_rate != null || entry.old_tax_rate != null ||
                  entry.new_tax_amount != null || entry.old_tax_amount != null) && (
                  <div className="text-[#525252] text-xs flex flex-wrap gap-x-3">
                    {(entry.old_parts != null || entry.new_parts != null) && (
                      <span>
                        Parts: {formatEstimateValue(entry.old_parts ?? null)}
                        {" → "}
                        <span className="text-[#303030] font-medium">
                          {formatEstimateValue(entry.new_parts ?? null)}
                        </span>
                      </span>
                    )}
                    {(entry.old_labor != null || entry.new_labor != null) && (
                      <span>
                        Labor: {formatEstimateValue(entry.old_labor ?? null)}
                        {" → "}
                        <span className="text-[#303030] font-medium">
                          {formatEstimateValue(entry.new_labor ?? null)}
                        </span>
                      </span>
                    )}
                    {(entry.old_tax_rate != null || entry.new_tax_rate != null ||
                      entry.old_tax_amount != null || entry.new_tax_amount != null) && (
                      <span>
                        Tax:{" "}
                        {entry.old_tax_rate != null ? `${entry.old_tax_rate}%` : "—"}
                        {" ("}
                        {formatEstimateValue(entry.old_tax_amount ?? null)}
                        {") → "}
                        <span className="text-[#303030] font-medium">
                          {entry.new_tax_rate != null ? `${entry.new_tax_rate}%` : "—"}
                          {" ("}
                          {formatEstimateValue(entry.new_tax_amount ?? null)}
                          {")"}
                        </span>
                      </span>
                    )}
                  </div>
                )}
                <div className="text-[#717179] text-xs">
                  {formatHistoryDate(entry.created_at)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function WorkOrderDetailsV2({
  workOrder,
  currentAssignees = [],
  currentCollaborators = [],
  onWorkOrderUpdate,
  isUpdateWorkOrderModalOpen = false,
  onUpdateWorkOrderModalOpenChange,
  onBillAdded,
}: WorkOrderDetailsV2Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const { taskId, workOrderId: routeWorkOrderId } = useParams<{ taskId: string; workOrderId?: string }>();
  const { userId } = useAuth();

  // API work order data state
  const [apiWorkOrder, setApiWorkOrder] = useState<ApiWorkOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Property managers map for author names
  const [propertyManagers, setPropertyManagers] = useState<Map<number, string>>(new Map());
  // Property image URL for the work order's property
  const [propertyImageUrl, setPropertyImageUrl] = useState<string | null>(null);
  const [propertyImageLoadFailed, setPropertyImageLoadFailed] = useState(false);

  // Determine the work order ID to use - prefer route param, fall back to workOrder prop id
  const workOrderId = routeWorkOrderId || (workOrder?.id ? String(workOrder.id) : null);

  // Fetch work order from API - extracted to useCallback so it can be reused
  const fetchWorkOrder = useCallback(async (silent = false) => {
    if (!workOrderId) {
      if (!silent) {
        setLoading(false);
      }
      return;
    }

    try {
      if (!silent) {
        setLoading(true);
        setError(null);
      }
      const data = await fetchJSON(`/maintenance/work-orders/${workOrderId}`);
      setApiWorkOrder(data);
    } catch (err) {
      console.error("Failed to fetch work order:", err);
      if (!silent) {
        setError(err instanceof Error ? err.message : "Failed to load work order");
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [workOrderId]);

  // Fetch work order on mount and when workOrderId changes
  useEffect(() => {
    fetchWorkOrder();
  }, [fetchWorkOrder]);

  // Fetch property image when work order has property_id
  useEffect(() => {
    const pid = apiWorkOrder?.property_id;
    if (!pid) {
      setPropertyImageUrl(null);
      setPropertyImageLoadFailed(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const prop = await fetchJSON(`/properties/${pid}`);
        const path = prop?.image_url;
        if (cancelled) return;
        if (path && typeof path === "string" && path.trim() !== "") {
          setPropertyImageUrl(`${API_BASE.replace(/\/$/, "")}/files/${path.replace(/^\//, "")}`);
          setPropertyImageLoadFailed(false);
        } else {
          setPropertyImageUrl(null);
        }
      } catch {
        if (!cancelled) {
          setPropertyImageUrl(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [apiWorkOrder?.property_id]);

  useEffect(() => {
    setPropertyImageLoadFailed(false);
  }, [apiWorkOrder?.property_id, propertyImageUrl]);

  // Fetch property managers for author names
  useEffect(() => {
    const fetchPropertyManagers = async () => {
      try {
        const users = await fetchJSON("/users/property-managers") as PropertyManagerRecord[];
        const pmMap = new Map<number, string>();
        users.forEach((user) => {
          if (user.id && user.name) {
            pmMap.set(user.id, user.name);
          }
        });
        setPropertyManagers(pmMap);
      } catch (err) {
        console.error("Failed to fetch property managers:", err);
        // Continue without property managers - will use "User" as fallback
      }
    };

    fetchPropertyManagers();
  }, []);

  // Fetch notes from API
  useEffect(() => {
    const fetchNotes = async () => {
      if (!workOrderId) {
        return;
      }

      try {
        setNotesLoading(true);
        const apiNotes = await fetchJSON(`/maintenance/work-orders/id/${workOrderId}/notes`) as ApiWorkOrderNote[];
        const transformedNotes = apiNotes.map((note) => transformApiNoteToUiNote(note, propertyManagers));
        setNotes(transformedNotes);
      } catch (err) {
        console.error("Failed to fetch notes:", err);
        // Don't set error state - just log it, notes will remain empty
      } finally {
        setNotesLoading(false);
      }
    };

    fetchNotes();
  }, [workOrderId, propertyManagers]);

  // Map backend status to frontend status
  const mapBackendStatusToFrontend = (
    backendStatus: string | null | undefined
  ): "not_started" | "in_progress" | "completed" | "deferred" | "closed" | "cancelled" => {
    if (!backendStatus) return "not_started";

    const statusMap: Record<string, "not_started" | "in_progress" | "completed" | "deferred" | "closed" | "cancelled"> = {
      new: "not_started",
      sent: "not_started",
      scheduled: "in_progress",
      in_progress: "in_progress",
      completed: "completed",
      deferred: "deferred",
      closed: "closed",
      cancelled: "cancelled",
    };

    return statusMap[backendStatus.toLowerCase()] || "not_started";
  };

  // Map backend priority to frontend priority
  const mapBackendPriorityToFrontend = (
    backendPriority: string | null | undefined
  ): "normal" | "low" | "high" | "urgent" => {
    if (!backendPriority) return "normal";
    
    const priorityMap: Record<string, "normal" | "low" | "high" | "urgent"> = {
      low: "low",
      medium: "normal", // medium maps to normal
      high: "high",
      urgent: "urgent",
    };
    
    return priorityMap[backendPriority.toLowerCase()] || "normal";
  };

  // Normalize role display (e.g., property_manager -> Property Manager)
  const normalizeRole = (role: string | null | undefined): string => {
    if (!role) return "";
    
    // Replace underscores with spaces and capitalize words
    return role
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  // Helper function to format date
  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
      });
    } catch {
      return "";
    }
  };

  // Helper function to format datetime for "Last Updated"
  const formatDateTime = (dateString: string | null | undefined): string => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toLocaleString("en-US", {
        month: "numeric",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });
    } catch {
      return "";
    }
  };

  // Helper function to format created date
  const formatCreatedDate = (dateString: string | null | undefined): string => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toLocaleString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return "";
    }
  };

  /**
   * Transform API attachment to UI File format
   */
  const transformApiAttachmentToUiFile = (
    apiAttachment: ApiWorkOrderAttachment,
  ): File => {
    return {
      id: apiAttachment.id,
      name: apiAttachment.file_name,
      url: undefined,
      uploadedAt: formatCreatedDate(apiAttachment.created_at),
      category: apiAttachment.label || "",
      description: apiAttachment.description || "",
      file_type: apiAttachment.file_type,
      file_size: apiAttachment.file_size,
      storage_path: apiAttachment.storage_path,
      uploaded_by_type: apiAttachment.uploaded_by_type,
      uploaded_by: apiAttachment.uploaded_by,
    };
  };

  const attachmentToPhotoWO = (a: ApiWorkOrderAttachment): Photo => ({
    id: a.id,
    url: `${API_BASE}/files/${a.storage_path}`,
    fileName: a.file_name,
    uploadedAt: formatCreatedDate(a.created_at),
    uploadedBy: a.uploaded_by_name ?? a.uploaded_by_type,
    label: (a.label as PhotoLabel) ?? undefined,
    caption: a.description ?? undefined,
  });

  // Field state - use API data if available, otherwise fall back to prop
  // Cast to proper types for the select fields
  const [status, setStatus] = useState<"completed" | "not_started" | "in_progress" | "deferred" | "closed" | "cancelled">(() => {
    const s = apiWorkOrder?.status || workOrder?.status || "completed";
    return s as "completed" | "not_started" | "in_progress" | "deferred" | "closed" | "cancelled";
  });
  const [priority, setPriority] = useState<"normal" | "low" | "high" | "urgent">(
    () => {
      const p = apiWorkOrder?.priority || workOrder?.priority || "normal";
      return p as "normal" | "low" | "high" | "urgent";
    },
  );
  const [dueDate, setDueDate] = useState<Date | string | null>(() => {
    const dateStr = apiWorkOrder?.due_date || workOrder?.dueDate;
    if (!dateStr) return null;
    // If it's already a Date object, use it directly
    if (dateStr instanceof Date) {
      return dateStr;
    }
    // Try to parse string dates (may be ISO or formatted)
    const parsed = new Date(dateStr);
    return !isNaN(parsed.getTime()) ? parsed : dateStr;
  });

  // Sync API work order data to local state
  useEffect(() => {
    if (apiWorkOrder) {
      setStatus(mapBackendStatusToFrontend(apiWorkOrder.status));
      setPriority(mapBackendPriorityToFrontend(apiWorkOrder.priority));
      if (apiWorkOrder.due_date) {
        const parsed = new Date(apiWorkOrder.due_date);
        setDueDate(!isNaN(parsed.getTime()) ? parsed : null);
      } else {
        setDueDate(null);
      }
      // Set last updated
      if (apiWorkOrder.updated_at || apiWorkOrder.last_updated) {
        setLastUpdated(formatDateTime(apiWorkOrder.updated_at || apiWorkOrder.last_updated));
      }
      // Set estimate total + optional parts/labor breakdown
      if (apiWorkOrder.estimated_cost !== undefined || apiWorkOrder.estimate_total !== undefined) {
        setEstimateTotal(apiWorkOrder.estimated_cost || apiWorkOrder.estimate_total || 0);
      }
      setEstimateParts(apiWorkOrder.estimate_parts ?? null);
      setEstimateLabor(apiWorkOrder.estimate_labor ?? null);
      setEstimateTaxRate(apiWorkOrder.estimate_tax_rate ?? null);
      setEstimateTaxAmount(apiWorkOrder.estimate_tax_amount ?? null);
      // Map attachments to files
      if (apiWorkOrder.attachments && apiWorkOrder.attachments.length > 0) {
        const mappedFiles: File[] =
          apiWorkOrder.attachments.map(transformApiAttachmentToUiFile);
        setFiles(mappedFiles);
      }
      
      // Initialize snapshot after state is updated
      // Use setTimeout to ensure state updates have been applied
      setTimeout(() => {
        if (!topBarSnapshotRef.current) {
          syncTopBarSnapshot();
        }
      }, 0);
    } else if (workOrder) {
      // Fallback to prop data - map if needed
      const frontendStatuses: ("completed" | "not_started" | "in_progress" | "deferred" | "closed" | "cancelled")[] = ["completed", "not_started", "in_progress", "deferred", "closed", "cancelled"];
      if (workOrder.status && frontendStatuses.includes(workOrder.status as any)) {
        setStatus(workOrder.status as "completed" | "not_started" | "in_progress" | "deferred" | "closed" | "cancelled");
      } else {
        setStatus(mapBackendStatusToFrontend(workOrder.status));
      }
      
      const frontendPriorities: ("normal" | "low" | "high" | "urgent")[] = ["normal", "low", "high", "urgent"];
      if (workOrder.priority && frontendPriorities.includes(workOrder.priority as any)) {
        setPriority(workOrder.priority as "normal" | "low" | "high" | "urgent");
      } else {
        setPriority(mapBackendPriorityToFrontend(workOrder.priority));
      }
      if (workOrder.dueDate) {
        if (workOrder.dueDate instanceof Date) {
          setDueDate(workOrder.dueDate);
        } else {
          const parsed = new Date(workOrder.dueDate);
          setDueDate(!isNaN(parsed.getTime()) ? parsed : workOrder.dueDate);
        }
      } else {
        setDueDate(null);
      }
      if (workOrder.notes) {
        setNotes(workOrder.notes);
      }
      if (workOrder.files) {
        setFiles(workOrder.files);
      }
    }
  }, [
    apiWorkOrder,
    workOrder?.id,
    workOrder?.status,
    workOrder?.priority,
    workOrder?.dueDate,
    workOrder?.notes,
    workOrder?.files,
  ]);

  const [notifications, setNotifications] = useState<Array<{ id: number; message: string; type: string }>>([]);

  const [notes, setNotes] = useState<Note[]>(() => workOrder?.notes || []);
  const [notesLoading, setNotesLoading] = useState(false);

  const [files, setFiles] = useState<File[]>(() => workOrder?.files || []);
  const [filesLoading, setFilesLoading] = useState(false);

  interface BillItem {
    id: string;
    date: string;
    time: string;
    invoiceNumber: string;
    vendorName: string;
    amount: string;
    status: "Paid" | "Unpaid" | "Awaiting Invoice";
  }

  const [bills, setBills] = useState<BillItem[]>([]);
  const [evaluation, setEvaluation] = useState<WorkOrderEvaluationData | undefined>(undefined);

  // Fetch existing evaluation on mount
  useEffect(() => {
    if (!workOrderId) return;
    fetchJSON(`/maintenance/work-orders/id/${workOrderId}/evaluation`)
      .then((data: any) => {
        if (data) {
          setEvaluation({ rating: data.rating, notes: data.feedback ?? "", submittedAt: data.created_at, submittedBy: data.rated_by_user_name ?? undefined });
        }
      })
      .catch(() => {});
  }, [workOrderId]);

  // Initialize bills from API data
  useEffect(() => {
    if (apiWorkOrder && apiWorkOrder.bill_id) {
      // Convert bill_total_cents to dollars
      const billAmount = apiWorkOrder.bill_total_cents 
        ? (apiWorkOrder.bill_total_cents / 100).toFixed(2)
        : "0.00";
      
      const billDate = apiWorkOrder.bill_statement_date 
        ? formatDate(apiWorkOrder.bill_statement_date)
        : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      
      const billTime = apiWorkOrder.bill_updated_at
        ? new Date(apiWorkOrder.bill_updated_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        : new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

      setBills([{
        id: String(apiWorkOrder.bill_id),
        date: billDate,
        time: billTime,
        invoiceNumber: apiWorkOrder.bill_invoice_number || "—",
        vendorName: apiWorkOrder.bill_vendor_name || apiWorkOrder.vendor_name || "Unknown Vendor",
        amount: `$${billAmount}`,
        status: "Unpaid", // Default status, could be enhanced with additional API field
      }]);
    } else {
      setBills([]);
    }
  }, [apiWorkOrder]);

  // Calculate work order total from bills or use API value
  const workOrderTotal = apiWorkOrder?.bill_total_cents 
    ? apiWorkOrder.bill_total_cents / 100
    : bills.reduce((sum, bill) => {
        const amount = parseFloat(bill.amount.replace("$", "").replace(",", ""));
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);

  // Modal states
  const [isAddNoteModalOpen, setIsAddNoteModalOpen] = useState(false);
  const [isAddFileModalOpen, setIsAddFileModalOpen] = useState(false);
  const [isAddPhotoOpen, setIsAddPhotoOpen] = useState(false);
  const [woPhotos, setWoPhotos] = useState<Photo[]>([]);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [editingFileId, setEditingFileId] = useState<number | null>(null);
  const [viewingFileUrl, setViewingFileUrl] = useState<string | null>(null);
  const [viewingFileName, setViewingFileName] = useState<string>("");
  const [msgViewer, setMsgViewer] = useState<{
    isOpen: boolean;
    title: string;
    data: ParsedMsg | null;
    loading: boolean;
    error: string | null;
  }>({ isOpen: false, title: "", data: null, loading: false, error: null });
  const [lastUpdated, setLastUpdated] = useState<string>(() => {
    // Will be set from API data in useEffect
    return new Date().toLocaleString();
  });
  const [isEstimateTotalModalOpen, setIsEstimateTotalModalOpen] =
    useState(false);
  const [isEstimateHistoryModalOpen, setIsEstimateHistoryModalOpen] =
    useState(false);
  const [estimateHistoryEntries, setEstimateHistoryEntries] = useState<
    EstimateHistoryEntry[]
  >([]);
  const [estimateHistoryLoading, setEstimateHistoryLoading] = useState(false);
  const [estimateHistoryError, setEstimateHistoryError] = useState<string | null>(null);
  const [estimateTotal, setEstimateTotal] = useState<number>(0);
  const [estimateParts, setEstimateParts] = useState<number | null>(null);
  const [estimateLabor, setEstimateLabor] = useState<number | null>(null);
  const [estimateTaxRate, setEstimateTaxRate] = useState<number | null>(null);
  const [estimateTaxAmount, setEstimateTaxAmount] = useState<number | null>(null);
  const [draftEstimateTotal, setDraftEstimateTotal] = useState<number>(0);
  // Parts/labor/tax are optional breakdowns. null in draft state = field blank.
  const [draftEstimateParts, setDraftEstimateParts] = useState<number | null>(null);
  const [draftEstimateLabor, setDraftEstimateLabor] = useState<number | null>(null);
  // Tax rate is what the user types (e.g. 8.25 = 8.25%). Tax amount is the
  // computed dollars snapshotted at save time.
  const [draftEstimateTaxRate, setDraftEstimateTaxRate] = useState<number | null>(null);
  const [draftEstimateTaxAmount, setDraftEstimateTaxAmount] = useState<number | null>(null);
  // Track whether the user manually edited the total so we can stop auto-syncing
  // total = parts + labor + tax after an explicit override.
  const [totalManuallyEdited, setTotalManuallyEdited] = useState(false);

  const handleDismissNotification = (id: number) => {
    setNotifications(notifications.filter((n) => n.id !== id));
  };

  const handleOpenEstimateTotalModal = () => {
    setDraftEstimateTotal(estimateTotal);
    setDraftEstimateParts(estimateParts);
    setDraftEstimateLabor(estimateLabor);
    setDraftEstimateTaxRate(estimateTaxRate);
    setDraftEstimateTaxAmount(estimateTaxAmount);
    setTotalManuallyEdited(false);
    setIsEstimateTotalModalOpen(true);
  };

  const handleSaveEstimateTotal = async () => {
    if (!workOrderId) {
      console.error("Work order ID is required to update estimate total");
      return;
    }

    if (!userId) {
      alert("You must be logged in to update the estimate.");
      return;
    }

    try {
      // Update estimate breakdown via PATCH. Parts/labor are optional — only
      // include them in the payload when the user entered a value. We send
      // 0 for a cleared field so the backend writes NULL-equivalent null;
      // omitting the key leaves the stored value untouched.
      const payload: Record<string, unknown> = {
        estimated_cost: draftEstimateTotal,
        updated_by: userId,
      };
      if (draftEstimateParts !== null) payload.estimate_parts = draftEstimateParts;
      if (draftEstimateLabor !== null) payload.estimate_labor = draftEstimateLabor;
      if (draftEstimateTaxRate !== null) payload.estimate_tax_rate = draftEstimateTaxRate;
      if (draftEstimateTaxAmount !== null) payload.estimate_tax_amount = draftEstimateTaxAmount;

      await fetchJSON(`/maintenance/work-orders/${workOrderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // Update local state
      setEstimateTotal(draftEstimateTotal);
      setEstimateParts(draftEstimateParts);
      setEstimateLabor(draftEstimateLabor);
      setEstimateTaxRate(draftEstimateTaxRate);
      setEstimateTaxAmount(draftEstimateTaxAmount);
      
      // Refresh work order data to get updated timestamp
      try {
        const refreshedData = await fetchJSON(`/maintenance/work-orders/${workOrderId}`);
        setApiWorkOrder(refreshedData);
        if (refreshedData.updated_at || refreshedData.last_updated) {
          setLastUpdated(formatDateTime(refreshedData.updated_at || refreshedData.last_updated));
        }
        // Update estimate total + parts/labor from refreshed data
        if (refreshedData.estimated_cost !== undefined || refreshedData.estimate_total !== undefined) {
          setEstimateTotal(refreshedData.estimated_cost || refreshedData.estimate_total || 0);
        }
        setEstimateParts(refreshedData.estimate_parts ?? null);
        setEstimateLabor(refreshedData.estimate_labor ?? null);
        setEstimateTaxRate(refreshedData.estimate_tax_rate ?? null);
        setEstimateTaxAmount(refreshedData.estimate_tax_amount ?? null);
      } catch (err) {
        console.error("Failed to refresh work order after update:", err);
      }

      // Close the modal
      setIsEstimateTotalModalOpen(false);
    } catch (err) {
      console.error("Failed to update estimate total:", err);
      alert("Failed to update estimate total. Please try again.");
    }
  };

  // Reset estimate total modal when it closes
  useEffect(() => {
    if (!isEstimateTotalModalOpen) {
      setDraftEstimateTotal(0);
    }
  }, [isEstimateTotalModalOpen]);

  // Fetch estimate history when history modal opens
  useEffect(() => {
    if (!isEstimateHistoryModalOpen || !workOrderId) return;

    let cancelled = false;
    setEstimateHistoryError(null);
    setEstimateHistoryLoading(true);

    (async () => {
      try {
        const data = await fetchJSON(
          `/maintenance/work-orders/id/${workOrderId}/estimate-history`
        );
        if (!cancelled) {
          const entries = Array.isArray(data) ? data : [];
          setEstimateHistoryEntries(entries);
        }
      } catch (err) {
        if (!cancelled) {
          setEstimateHistoryError(err instanceof Error ? err.message : "Failed to load history");
          setEstimateHistoryEntries([]);
        }
      } finally {
        if (!cancelled) {
          setEstimateHistoryLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isEstimateHistoryModalOpen, workOrderId]);

  const handleWorkOrderUpdate = (formData: {
    property?: string;
    unit?: string;
    task?: string;
    workOrderName?: string;
    vendor?: string;
    status?: string;
    priority?: string;
    dueDate?: Date | null;
    notes?: string;
    files?: UploadedFile[];
  }) => {
    // Update local state
    if (formData.status !== undefined) setStatus(formData.status as "completed" | "not_started" | "in_progress");
    if (formData.priority !== undefined) setPriority(formData.priority as "normal" | "low" | "high" | "urgent");
    if (formData.dueDate !== undefined) setDueDate(formData.dueDate);
    setLastUpdated(new Date().toLocaleString());

    // Build updated notes and files arrays
    let updatedNotes = notes;
    let updatedFiles = files;

    if (formData.notes) {
      const newNote: Note = {
        id: Math.max(0, ...notes.map((n) => n.id)) + 1,
        text: formData.notes,
        date: new Date().toLocaleString(),
        author: "Julia LoSchiavo",
      };
      updatedNotes = [...notes, newNote];
      setNotes(updatedNotes);
    }

    if (formData.files && formData.files.length > 0) {
      const newFiles: File[] = formData.files.map((uf, idx) => ({
        id: Math.max(0, ...files.map((f) => f.id)) + idx + 1,
        name: uf.name,
        url: uf.file ? URL.createObjectURL(uf.file) : undefined,
        uploadedAt: new Date().toLocaleString(),
        category: "Work Order",
        description: "",
      }));
      updatedFiles = [...files, ...newFiles];
      setFiles(updatedFiles);
    }

    // Update parent work orders list
    let dueDateValue: string | Date | null = workOrder.dueDate;
    if (formData.dueDate !== undefined) {
      if (formData.dueDate) {
        dueDateValue =
          formData.dueDate instanceof Date
            ? formData.dueDate.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : String(formData.dueDate);
      } else {
        dueDateValue = null;
      }
    }

    const updatedWorkOrder: WorkOrder = {
      ...workOrder,
      status: formData.status || workOrder.status,
      priority: formData.priority || workOrder.priority,
      dueDate: dueDateValue,
      vendorName: formData.vendor ?? workOrder.vendorName,
      task: formData.workOrderName || workOrder.task,
      description: workOrder.description,
      notes: updatedNotes,
      files: updatedFiles,
    };

    if (onWorkOrderUpdate) {
      onWorkOrderUpdate(updatedWorkOrder);
    }

    // Close the modal after update
    onUpdateWorkOrderModalOpenChange?.(false);
  };

  const handleAddNote = async (text: string) => {
    if (!workOrderId) {
      console.error("Work order ID is required to create a note");
      return;
    }

    if (!userId) {
      console.error("User ID is required to create a note");
      return;
    }

    try {
      if (editingNoteId) {
        // Update existing note
        const updatedNote = await fetchJSON(`/maintenance/work-orders/notes/${editingNoteId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            body: text,
            is_visible_to_client: false, // Default to false, can be made configurable later
          }),
        }) as ApiWorkOrderNote;

        const transformedNote = transformApiNoteToUiNote(updatedNote, propertyManagers);
        setNotes(notes.map((n) => (n.id === editingNoteId ? transformedNote : n)));
      } else {
        // Create new note
        const newNote = await fetchJSON(`/maintenance/work-orders/id/${workOrderId}/notes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            author_type: "property_manager",
            author_id: userId,
            body: text,
            is_visible_to_client: false, // Default to false, can be made configurable later
          }),
        }) as ApiWorkOrderNote;

        const transformedNote = transformApiNoteToUiNote(newNote, propertyManagers);
        setNotes([...notes, transformedNote]);
      }
      setIsAddNoteModalOpen(false);
      setEditingNoteId(null);
    } catch (err) {
      console.error("Error saving note:", err);
      // Optionally show an error message to the user
      alert("Failed to save note. Please try again.");
    }
  };

  const handleAddFile = async (
    uploadedFiles: UploadedFile[],
    category: string,
    description: string,
  ) => {
    if (!workOrderId) {
      console.error("Work order ID is required to create a file");
      return;
    }
    if (!userId) {
      console.error("User ID is required to create a file");
      return;
    }
    if (uploadedFiles.length === 0 || !uploadedFiles[0].file) {
      alert("File is required");
      return;
    }

    try {
      if (editingFileId) {
        const updateData: any = {};
        if (category !== undefined) {
          updateData.label = category || null;
        }
        if (description !== undefined) {
          updateData.description = description || null;
        }

        const updatedAttachment = await fetchJSON(
          `/maintenance/work-orders/attachments/${editingFileId}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updateData),
          },
        );

        const transformedFile =
          transformApiAttachmentToUiFile(updatedAttachment);
        setFiles((prev) =>
          prev.map((f) => (f.id === editingFileId ? transformedFile : f)),
        );
      } else {
        let fileToUpload: globalThis.File = uploadedFiles[0].file!;
        // Convert images to PDF before upload; skip conversion for .msg (upload as-is)
        const isMsg = /\.msg$/i.test(fileToUpload.name);
        const isImage =
          !isMsg &&
          (fileToUpload.type.startsWith("image/") ||
            /\.(jpg|jpeg|png|gif|webp|heic|heif)$/i.test(fileToUpload.name));
        if (isImage) {
          fileToUpload = await convertFiletoPdf(fileToUpload);
        }

        const formData = new FormData();
        formData.append("file", fileToUpload, fileToUpload.name);

        const uploadRes = await authFetch(
          `/maintenance/tasks/attachments/upload`,
          {
            method: "POST",
            body: formData,
            // Don't set Content-Type - browser will set it with boundary
          },
        );

        if (!uploadRes.ok) {
          const text = await uploadRes.text();
          throw new Error(`Upload failed ${uploadRes.status}: ${text}`);
        }

        const uploadData: {
          ok: boolean;
          temp_object_key: string;
          original_name: string;
          file_type: string;
          file_size: number;
          sha256: string;
        } = await uploadRes.json();

        const newAttachment = await fetchJSON(
          `/maintenance/work-orders/id/${workOrderId}/attachments`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              file_name: uploadData.original_name,
              file_type: uploadData.file_type,
              file_size: uploadData.file_size,
              storage_path: uploadData.temp_object_key,
              uploaded_by_type: "user",
              uploaded_by: userId,
              label: category || null,
              description: description || null,
            }),
          },
        );

        const transformedFile = transformApiAttachmentToUiFile(newAttachment);
        setFiles((prev) => [transformedFile, ...prev]);
      }

      setIsAddFileModalOpen(false);
      setEditingFileId(null);
    } catch (err) {
      console.error("Error saving file:", err);
      alert("Failed to save file. Please try again.");
    }
  };

  const handleAddPhotos = async (
    uploads: PhotoUpload[],
    label: Photo["label"] | null,
    caption: string,
  ) => {
    if (!workOrderId || !userId) return;
    setPhotoUploading(true);
    try {
      for (const upload of uploads) {
        const formData = new FormData();
        formData.append("file", upload.file, upload.file.name);
        const uploadRes = await authFetch("/maintenance/tasks/attachments/upload", {
          method: "POST",
          body: formData,
        });
        if (!uploadRes.ok) throw new Error("Upload failed");
        const uploadData: { temp_object_key: string; original_name: string; file_type: string; file_size: number; } = await uploadRes.json();
        const newAttachment: ApiWorkOrderAttachment = await fetchJSON(
          `/maintenance/work-orders/id/${workOrderId}/attachments`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              file_name: uploadData.original_name,
              file_type: uploadData.file_type,
              file_size: uploadData.file_size,
              storage_path: uploadData.temp_object_key,
              uploaded_by_type: "user",
              uploaded_by: userId,
              label: label ?? null,
              description: caption || null,
            }),
          },
        );
        setWoPhotos(prev => [attachmentToPhotoWO(newAttachment), ...prev]);
      }
    } catch (err) {
      console.error("Failed to upload photos:", err);
      throw err;
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleDeleteFile = async (fileId: number) => {
    try {
      await fetchJSON(`/maintenance/work-orders/attachments/${fileId}`, {
        method: "DELETE",
      });
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
    } catch (err) {
      console.error("Error deleting file:", err);
      alert("Failed to delete file. Please try again.");
    }
  };

  const editingNote = notes.find((n) => n.id === editingNoteId);
  const editingFile = files.find((f) => f.id === editingFileId);

  // Load attachments from API
  useEffect(() => {
    const loadFiles = async () => {
      if (!workOrderId) return;

      try {
        setFilesLoading(true);
        const apiAttachments: ApiWorkOrderAttachment[] = await fetchJSON(
          `/maintenance/work-orders/id/${workOrderId}/attachments`,
        );
        const imageAttachments = apiAttachments.filter(a => a.file_type?.startsWith("image/"));
        const fileAttachments = apiAttachments.filter(a => !a.file_type?.startsWith("image/"));
        setWoPhotos(imageAttachments.map(attachmentToPhotoWO));
        setFiles(fileAttachments.map(transformApiAttachmentToUiFile));
      } catch (err) {
        console.error("Error loading files:", err);
        setFiles([]);
      } finally {
        setFilesLoading(false);
      }
    };

    loadFiles();
  }, [workOrderId]);

  // --- Auto-save top-bar fields (status/priority/due date) ---
  const topBarSnapshotRef = useRef<{
    status: string;
    priority: string;
    dueDateISO: string | null;
  } | null>(null);
  const topBarSavingRef = useRef(false);

  // Convert frontend status to backend status
  const toBackendStatus = useCallback((uiStatus: string): string => {
    const map: Record<string, string> = {
      not_started: "new",
      in_progress: "in_progress",
      completed: "completed",
      deferred: "deferred",
      closed: "closed",
      cancelled: "cancelled",
      new: "new",
    };
    return map[uiStatus] || "new";
  }, []);

  // Convert frontend priority to backend priority
  const toBackendPriority = useCallback((uiPriority: string): string => {
    const map: Record<string, string> = {
      low: "low",
      normal: "medium",
      high: "high",
      urgent: "urgent",
      medium: "medium",
    };
    return map[uiPriority] || "medium";
  }, []);

  // Sync snapshot with current field values
  const syncTopBarSnapshot = useCallback(() => {
    const statusValue = typeof status === "string" ? status : "not_started";
    const priorityValue = typeof priority === "string" ? priority : "normal";
    const dueDateValue = dueDate instanceof Date 
      ? dueDate.toISOString() 
      : dueDate 
        ? (typeof dueDate === "string" ? dueDate : new Date(dueDate).toISOString())
        : null;
    
    topBarSnapshotRef.current = {
      status: statusValue,
      priority: priorityValue,
      dueDateISO: dueDateValue,
    };
  }, [status, priority, dueDate]);

  // Initialize snapshot when data loads (fallback if not initialized in sync effect)
  useEffect(() => {
    if (apiWorkOrder && status && priority && !topBarSnapshotRef.current) {
      // Wait a tick to ensure state is set
      setTimeout(() => {
        syncTopBarSnapshot();
      }, 0);
    }
  }, [apiWorkOrder, status, priority, syncTopBarSnapshot]);

  // Auto-save when fields change
  useEffect(() => {
    if (!workOrderId) return;
    if (!userId) return;

    const snap = topBarSnapshotRef.current;
    if (!snap) return;

    const statusValue = typeof status === "string" ? status : "not_started";
    const priorityValue = typeof priority === "string" ? priority : "normal";
    const dueDateValue = dueDate instanceof Date 
      ? dueDate.toISOString() 
      : dueDate 
        ? (typeof dueDate === "string" ? dueDate : new Date(dueDate).toISOString())
        : null;

    const next = {
      status: statusValue,
      priority: priorityValue,
      dueDateISO: dueDateValue,
    };

    const changed =
      snap.status !== next.status ||
      snap.priority !== next.priority ||
      snap.dueDateISO !== next.dueDateISO;

    if (!changed) return;
    if (topBarSavingRef.current) return;

    const run = async () => {
      try {
        topBarSavingRef.current = true;

        const payload: any = {
          updated_by: userId,
        };

        if (snap.status !== next.status) {
          payload.status = toBackendStatus(next.status);
        }
        if (snap.priority !== next.priority) {
          payload.priority = toBackendPriority(next.priority);
        }
        if (snap.dueDateISO !== next.dueDateISO) {
          if (next.dueDateISO) {
            payload.due_date = next.dueDateISO;
          } else {
            payload.due_date = null;
          }
        }

        // If for some reason nothing to send, just update snapshot and bail
        const keys = Object.keys(payload).filter((k) => k !== "updated_by");
        if (keys.length === 0) {
          syncTopBarSnapshot();
          return;
        }

        await fetchJSON(`/maintenance/work-orders/${workOrderId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        // Update snapshot to current values after successful save
        syncTopBarSnapshot();

        // Refresh work order data to get updated timestamp
        try {
          const refreshedData = await fetchJSON(`/maintenance/work-orders/${workOrderId}`);
          setApiWorkOrder(refreshedData);
          if (refreshedData.updated_at || refreshedData.last_updated) {
            setLastUpdated(formatDateTime(refreshedData.updated_at || refreshedData.last_updated));
          }
        } catch (err) {
          console.error("Failed to refresh work order after update:", err);
        }
      } catch (err) {
        console.error("Failed to auto-save top bar fields:", err);
        // Keep snapshot as-is so we can retry on next change
      } finally {
        topBarSavingRef.current = false;
      }
    };

    run();
  }, [
    status,
    priority,
    dueDate,
    workOrderId,
    userId,
    syncTopBarSnapshot,
    toBackendStatus,
    toBackendPriority,
  ]);

  // Simple handlers that just update state (triggers auto-save useEffect)
  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus as "completed" | "not_started" | "in_progress");
  };

  const handlePriorityChange = (newPriority: string) => {
    setPriority(newPriority as "normal" | "low" | "high" | "urgent");
  };

  const handleDueDateChange = (newDate: Date | string | null) => {
    setDueDate(newDate);
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex flex-col w-full gap-6 bg-white min-h-0 font-['Geist',sans-serif]">
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">Loading work order...</div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex flex-col w-full gap-6 bg-white min-h-0 font-['Geist',sans-serif]">
        <div className="flex items-center justify-center py-12">
          <div className="text-red-500">Error: {error}</div>
        </div>
      </div>
    );
  }

  // Use API data if available, otherwise fall back to prop
  const displayWorkOrder = apiWorkOrder || workOrder;
  const displayName = apiWorkOrder?.name || workOrder?.task || "Work Order";
  const displayProperty = apiWorkOrder?.property_name || workOrder?.property || "Unknown Property";
  const displayUnit = formatUnitDisplayForTable(workOrder?.unit);
  const displayDescription = apiWorkOrder?.description || workOrder?.description || "No description provided";
  const displayInvoiceNumber = apiWorkOrder?.bill_invoice_number || workOrder?.invoiceNumber || "";
  const displayVendorName = apiWorkOrder?.vendor_name || workOrder?.vendorName || "Unassigned";
  const displayCreatedBy = apiWorkOrder?.created_by_name || "";
  const displayCreatedByEmail = apiWorkOrder?.created_by_email || "";
  const displayCreatedByRole = normalizeRole(apiWorkOrder?.created_by_role) || "Property manager";
  const displayCreatedAt = apiWorkOrder?.created_at
    ? formatCreatedDate(apiWorkOrder.created_at)
    : "";

  return (
    <div className="flex flex-col w-full gap-6 bg-white min-h-0 font-['Geist',sans-serif]">
      {/* Back Button */}
      <button
        onClick={() => {
          // Preserve navigation state when going back, but clear the selected work order ID
          const currentState = (location.state as any) || {};
          // Navigate to workorders tab and clear selected work order to show the table
          navigate(`/tasks/${taskId}/workorders`, {
            replace: false,
            state: {
              ...currentState,
              taskData: currentState.taskData || currentState.task,
              task: currentState.task || currentState.taskData,
              preservedWorkOrderId: null, // Clear the selected work order to show the table
            },
          });
        }}
        className="flex items-center gap-2 text-[#2463eb] font-medium text-sm hover:opacity-80 transition-opacity w-fit"
      >
        <ArrowLeft width={16} height={16} />
        Back to Work Orders
      </button>

      {/* Field Selectors Row */}
      <SectionCard padding="none" variant="white">
        <div className="flex flex-wrap items-end gap-6 w-full p-4">
          <div className="flex-1 min-w-[180px]">
            <StatusSelectField
              label="Status"
              value={status}
              onChange={handleStatusChange}
            />
          </div>

          <div className="flex-1 min-w-[180px]">
            <PrioritySelectField
              label="Priority"
              value={priority}
              onChange={handlePriorityChange}
            />
          </div>

          <div className="flex-1 min-w-[180px]">
            <DateField
              label="Due Date"
              value={dueDate}
              onChange={handleDueDateChange}
              returnFormat="Date"
            />
          </div>

          <div className="flex-1 flex justify-end text-xs text-[#717179] font-medium pb-1">
            Last Updated{" "}
            <span className="text-[#303030] font-bold ml-1">{lastUpdated}</span>
          </div>
        </div>
      </SectionCard>

      <div className="flex flex-wrap lg:flex-nowrap gap-6 w-full">
        {/* Left Column (Main Content) */}
        <div className="flex flex-col flex-1 gap-6 min-w-0">
          {/* Main Overview Card */}
          <SectionCard variant="white" padding="none">
            <div className="flex flex-col md:flex-row items-stretch gap-4 w-full p-5">
              <img
                src={
                  propertyImageUrl && !propertyImageLoadFailed
                    ? propertyImageUrl
                    : "https://api.builder.io/api/v1/image/assets/ba2f0cd1a4c64ebda0865daf8dd0ff2a/067809472377195b06444da037ab0e0c9542bf94?placeholderIfAbsent=true"
                }
                alt="Property"
                onError={() => setPropertyImageLoadFailed(true)}
                className="w-full md:w-[251px] h-auto rounded-lg object-cover flex-shrink-0 bg-[#f0f0f0]"
              />

              <div className="flex flex-col items-start gap-6 flex-1 min-w-0">
                <div className="flex flex-col items-start gap-4 w-full">
                  <div className="flex justify-between items-start gap-2 w-full">
                    <h2 className="text-[#303030] text-[22px] font-semibold leading-[30px] flex-1">
                      {displayName} - #{displayWorkOrder?.id || workOrder?.id}
                    </h2>
                    <button
                      onClick={() => onUpdateWorkOrderModalOpenChange?.(true)}
                      className="flex items-center gap-1 text-sm text-[#2463eb] hover:underline"
                    >
                      <EditIcon width={16} height={16} />
                      <span className="font-medium">Edit</span>
                    </button>
                  </div>
                  <div className="flex flex-col items-start gap-2 w-full">
                    <div className="text-[#717179] text-sm font-medium leading-4">
                      Created by {displayCreatedBy} for
                    </div>
                    <div className="text-[#2463eb] text-sm font-bold leading-4">
                      {displayProperty}
                      {displayUnit ? ` - ${displayUnit}` : ""}
                    </div>
                    <div className="flex items-center gap-1 text-sm font-normal leading-[140%] tracking-[-0.28px] capitalize">
                      <span className="text-[#717179]">Created</span>
                      <span className="text-[#717179]">{displayCreatedAt}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-start gap-4 w-full">
                  <div className="flex items-center gap-1">
                    <span className="text-[#717179] text-sm font-semibold leading-4">
                      Invoice Number:
                    </span>
                    <span className="text-[#717179] text-sm font-medium leading-4">
                      {displayInvoiceNumber}
                    </span>
                  </div>

                  {/* Description Section */}
                  <div className="w-full">
                    <div className="text-[#717179] text-sm font-semibold leading-4 mb-2">
                      Description:
                    </div>
                    <div className="text-[#303030] text-sm font-normal leading-5 whitespace-pre-wrap">
                      {displayDescription}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Totals Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            <SectionCard padding="none" variant="white">
              <div className="flex flex-row justify-between items-start gap-4 flex-1 p-4">
                <div className="flex flex-col justify-center items-start gap-1 flex-1">
                  <div className="text-[#717179] font-['Geist',sans-serif] text-sm font-normal leading-5">
                    ESTIMATE TOTAL
                  </div>
                  <div className="text-[#303030] font-['Geist',sans-serif] text-2xl font-medium leading-7">
                    {formatUSD(estimateTotal)}
                  </div>
                  {(estimateParts !== null || estimateLabor !== null || estimateTaxRate !== null || estimateTaxAmount !== null) && (
                    <div className="mt-2 flex flex-col gap-1 w-full max-w-[220px] text-xs">
                      {estimateParts !== null && (
                        <div className="flex justify-between">
                          <span className="text-[#717179]">Parts</span>
                          <span className="text-[#303030] font-medium">
                            {formatUSD(estimateParts)}
                          </span>
                        </div>
                      )}
                      {estimateLabor !== null && (
                        <div className="flex justify-between">
                          <span className="text-[#717179]">Labor</span>
                          <span className="text-[#303030] font-medium">
                            {formatUSD(estimateLabor)}
                          </span>
                        </div>
                      )}
                      {(estimateTaxRate !== null || estimateTaxAmount !== null) && (
                        <div className="flex justify-between">
                          <span className="text-[#717179]">
                            Tax{estimateTaxRate !== null ? ` (${estimateTaxRate}%)` : ""}
                          </span>
                          <span className="text-[#303030] font-medium">
                            {formatUSD(estimateTaxAmount ?? 0)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsEstimateHistoryModalOpen(true)}
                    className="flex items-center gap-1 text-sm text-[#717179] hover:text-[#303030] hover:underline"
                  >
                    <History width={16} height={16} />
                    <span className="font-medium">View history</span>
                  </button>
                  <button
                    onClick={handleOpenEstimateTotalModal}
                    className="flex items-center gap-1 text-sm text-[#2463eb] hover:underline"
                  >
                    <EditIcon width={16} height={16} />
                    <span className="font-medium">Edit</span>
                  </button>
                </div>
              </div>
            </SectionCard>
            <SectionCard padding="none" variant="white">
              <div className="flex flex-col justify-center items-start gap-1 flex-1 p-4">
                <div className="text-[#717179] font-['Geist',sans-serif] text-sm font-normal leading-5">
                  WORK ORDER TOTAL
                </div>
                <div className="text-[#303030] font-['Geist',sans-serif] text-2xl font-medium leading-7">
                  {formatUSD(workOrderTotal)}
                </div>
              </div>
            </SectionCard>
          </div>

          {/* Notes Section */}
          <SectionCard padding="compact" variant="white">
            <NotesTemplate
              notes={notes}
              onAdd={() => {
                setEditingNoteId(null);
                setIsAddNoteModalOpen(true);
              }}
              onEdit={(note) => {
                setEditingNoteId(note.id);
                setIsAddNoteModalOpen(true);
              }}
              onDelete={async (id) => {
                try {
                  await fetchJSON(`/maintenance/work-orders/notes/${id}`, {
                    method: "DELETE",
                  });
                  setNotes(notes.filter((n) => n.id !== id));
                } catch (err) {
                  console.error("Error deleting note:", err);
                  alert("Failed to delete note. Please try again.");
                }
              }}
            />
          </SectionCard>

          {/* Files Section */}
          <SectionCard padding="compact" variant="white">
            <FilesTemplate
              files={files}
              onAdd={() => {
                setEditingFileId(null);
                setIsAddFileModalOpen(true);
              }}
              onEdit={(file) => {
                setEditingFileId(file.id);
                setIsAddFileModalOpen(true);
              }}
            onDelete={handleDeleteFile}
              onView={(file) => {
              const isMsgFile = (file.name ?? "")
                .toLowerCase()
                .endsWith(".msg");

              if (isMsgFile) {
                const openMsgViewer = async (blob: Blob) => {
                  setMsgViewer({
                    isOpen: true,
                    title: file.name ?? "Message",
                    data: null,
                    loading: true,
                    error: null,
                  });
                  try {
                    const data = await parseMsgFile(blob);
                    setMsgViewer((prev) => ({
                      ...prev,
                      loading: false,
                      data,
                      error: null,
                    }));
                  } catch (err) {
                    setMsgViewer((prev) => ({
                      ...prev,
                      loading: false,
                      error:
                        err instanceof Error
                          ? err.message
                          : "Failed to parse message",
                    }));
                  }
                };
                if (file.id) {
                  const attachmentId =
                    typeof file.id === "number"
                      ? file.id
                      : parseInt(String(file.id), 10);
                  if (!isNaN(attachmentId)) {
                    setMsgViewer({
                      isOpen: true,
                      title: file.name ?? "Message",
                      data: null,
                      loading: true,
                      error: null,
                    });
                    authFetch(`/maintenance/attachments/${attachmentId}`)
                      .then((r) => {
                        if (!r.ok) throw new Error("Failed to load");
                        return r.blob();
                      })
                      .then(openMsgViewer)
                      .catch(() =>
                        setMsgViewer((prev) => ({
                          ...prev,
                          loading: false,
                          error: "Failed to load attachment",
                        }))
                      );
                    return;
                  }
                }
                if (file.storage_path) {
                  setMsgViewer({
                    isOpen: true,
                    title: file.name ?? "Message",
                    data: null,
                    loading: true,
                    error: null,
                  });
                  authFetch(
                    `/files?key=${encodeURIComponent(file.storage_path)}`,
                  )
                    .then((r) => {
                      if (!r.ok) throw new Error("Failed to load");
                      return r.blob();
                    })
                    .then(openMsgViewer)
                    .catch(() =>
                      setMsgViewer((prev) => ({
                        ...prev,
                        loading: false,
                        error: "Failed to load file",
                      }))
                    );
                }
                return;
              }

              if (file.id) {
                const attachmentId =
                  typeof file.id === "number"
                    ? file.id
                    : parseInt(String(file.id), 10);
                if (!isNaN(attachmentId)) {
                  const url = `/api/maintenance/attachments/${attachmentId}`;
                  setViewingFileUrl(url);
                  setViewingFileName(file.name);
                  return;
                }
              }
              if (file.storage_path) {
                const url = `/api/files?key=${encodeURIComponent(
                  file.storage_path,
                )}`;
                setViewingFileUrl(url);
                setViewingFileName(file.name);
                return;
              }
              if (file.url) {
                setViewingFileUrl(file.url);
                setViewingFileName(file.name);
              }
              }}
            />
          </SectionCard>

          {/* Photos Section */}
          <SectionCard padding="compact" variant="white">
            <div className="p-4">
              <PhotoGallery
                photos={woPhotos}
                onAdd={() => setIsAddPhotoOpen(true)}
                onDelete={(id) => { setWoPhotos(prev => prev.filter(p => p.id !== id)); fetchJSON(`/maintenance/work-orders/attachments/${id}`, { method: "DELETE" }).catch(console.error); }}
                onEdit={(updated) => { setWoPhotos(prev => prev.map(p => p.id === updated.id ? updated : p)); fetchJSON(`/maintenance/work-orders/attachments/${updated.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ label: updated.label ?? null, description: updated.caption ?? null }) }).catch(console.error); }}
              />
            </div>
          </SectionCard>
        </div>

        {/* Right Sidebar */}
        <div className="flex flex-col w-full lg:w-[376px] gap-6 flex-shrink-0">
          {/* Bills Card */}
          <BillsCard
            bills={bills}
            workOrderId={displayWorkOrder?.id || workOrder?.id}
            vendorId={apiWorkOrder?.vendor_id}
            onBillSelected={(bill) => {
              setBills([...bills, bill]);
              if (onBillAdded) {
                onBillAdded(bill);
              }
            }}
            onWorkOrderRefresh={fetchWorkOrder}
            returnToUrl={taskId && workOrderId ? `/tasks/${taskId}/workorders/${workOrderId}` : undefined}
          />

          {/* Assignees Card */}
          <PeopleCard
            variant="white"
            footerActions={[]}
            subsections={[
              {
                label: "Vendor",
                mode: "rows",
                people: (() => {
                  const vendorId = apiWorkOrder?.vendor_id;
                  if (displayVendorName && displayVendorName !== "Unassigned" && vendorId) {
                    return [
                      {
                        id: vendorId,
                        name: displayVendorName,
                        initials: displayVendorName
                          .split(" ")
                          .map((w) => w[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2),
                        roleLabel: "Vendor Company",
                        email: apiWorkOrder?.vendor_email || getVendorEmail(displayVendorName),
                        phone: apiWorkOrder?.vendor_phone || getVendorPhone(displayVendorName),
                        href: getVendorHref(vendorId),
                      },
                    ];
                  }
                  return [];
                })(),
                showRoleLabel: true,
                showPhone: false,
                showDivider: true,
              },
            ]}
          />

          {/* Created By Card */}
          <PeopleCard
            variant="white"
            subsections={[
              {
                label: "Created by",
                mode: "rows",
                people: [
                  {
                    id: 4,
                    name: displayCreatedBy,
                    initials: displayCreatedBy
                      .split(" ")
                      .map((w) => w[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2),
                    roleLabel: displayCreatedByRole,
                    email: displayCreatedByEmail,
                    phone: "",
                  },
                ],
                showRoleLabel: true,
                showPhone: true,
                showDivider: true,
              },
            ]}
          />

          {/* Vendor Evaluation — only for completed work orders */}
          {status === "completed" && (
            <SectionCard
              title="Vendor Evaluation"
              padding="compact"
              variant="white"
              actions={
                evaluation ? undefined : (
                  <span className="text-[#717179] text-xs font-normal">Rate this work order</span>
                )
              }
            >
              <WorkOrderEvaluation
                vendorName={displayVendorName}
                existingEvaluation={evaluation}
                onSubmit={async (data) => {
                  if (!workOrderId) return;
                  try {
                    await fetchJSON(`/maintenance/work-orders/id/${workOrderId}/evaluation`, {
                      method: "POST",
                      body: JSON.stringify({ rating: data.rating, feedback: data.notes || null }),
                    });
                    setEvaluation(data);
                  } catch {
                    // submission failed silently — UI stays in edit mode
                  }
                }}
              />
            </SectionCard>
          )}
        </div>
      </div>

      {/* Modals */}
      <AddNoteModal
        open={isAddNoteModalOpen}
        onOpenChange={setIsAddNoteModalOpen}
        onSubmit={handleAddNote}
        initialText={editingNote?.text}
        isEditMode={!!editingNoteId}
      />

      <AddFileModal
        open={isAddFileModalOpen}
        onOpenChange={setIsAddFileModalOpen}
        onSubmit={handleAddFile}
        initialFiles={
          editingFile
            ? [
                {
                  id: String(editingFile.id),
                  name: editingFile.name ?? (editingFile as any).file_name,
                  url: editingFile.url,
                  size: (editingFile as any).file_size ?? 0,
                  type:
                    editingFile.name?.split(".").pop()?.toLowerCase() ||
                    (editingFile as any).file_type?.split("/").pop() ||
                    "pdf",
                  storage_path: (editingFile as any).storage_path,
                  file_name: (editingFile as any).file_name ?? editingFile.name,
                  file_type: (editingFile as any).file_type,
                },
              ]
            : []
        }
        initialCategory={editingFile?.category}
        initialDescription={editingFile?.description}
        isEditMode={!!editingFileId}
      />

      <AddPhotoModal
        open={isAddPhotoOpen}
        onOpenChange={setIsAddPhotoOpen}
        onSubmit={handleAddPhotos}
        loading={photoUploading}
      />

      <PdfViewerModal
        open={!!viewingFileUrl}
        onOpenChange={(open) => {
          if (!open) setViewingFileUrl(null);
        }}
        title={viewingFileName}
        url={viewingFileUrl || ""}
      />

      <MsgViewerModal
        open={msgViewer.isOpen}
        onOpenChange={(open) =>
          setMsgViewer((prev) => ({ ...prev, isOpen: open }))
        }
        title={msgViewer.title}
        data={msgViewer.data}
        loading={msgViewer.loading}
        error={msgViewer.error}
      />

      <CreateWorkOrderModalV2
        open={isUpdateWorkOrderModalOpen}
        onOpenChange={onUpdateWorkOrderModalOpenChange || (() => {})}
        mode="edit"
        hideTaskSelection={true}
        workOrderId={apiWorkOrder?.id || (workOrder?.id ? Number(workOrder.id) : undefined) || (workOrderId ? Number(workOrderId) : undefined)}
        initialData={{
          task: apiWorkOrder?.name || workOrder?.task || "",
          workOrderName: apiWorkOrder?.name || workOrder?.task || "",
          vendorId: apiWorkOrder?.vendor_id || undefined,
          vendor: apiWorkOrder?.vendor_name || workOrder?.vendorName || "",
          status: apiWorkOrder ? mapBackendStatusToFrontend(apiWorkOrder.status) : (workOrder?.status as "not_started" | "in_progress" | "completed" | "deferred" | "closed" | "cancelled" || "not_started"),
          priority: apiWorkOrder ? mapBackendPriorityToFrontend(apiWorkOrder.priority) : (workOrder?.priority as "low" | "normal" | "high" | "urgent" || "normal"),
          dueDate: (() => {
            if (apiWorkOrder?.due_date) {
              const d = new Date(apiWorkOrder.due_date);
              return isNaN(d.getTime()) ? null : d;
            }
            if (!workOrder?.dueDate) return null;
            if (workOrder.dueDate instanceof Date) {
              return isNaN(workOrder.dueDate.getTime()) ? null : workOrder.dueDate;
            }
            const d = new Date(workOrder.dueDate as string);
            return isNaN(d.getTime()) ? null : d;
          })(),
          notes: apiWorkOrder?.description || workOrder?.description || "",
          files: [],
        }}
        onDataUpdate={handleWorkOrderUpdate}
        onWorkOrderUpdated={async (updatedWorkOrder) => {
          // Refresh the work order data from API
          if (workOrderId) {
            try {
              const refreshedData = await fetchJSON(`/maintenance/work-orders/${workOrderId}`);
              setApiWorkOrder(refreshedData);
              
              // Update local state with new values
              if (refreshedData.status) {
                setStatus(mapBackendStatusToFrontend(refreshedData.status));
              }
              if (refreshedData.priority) {
                setPriority(mapBackendPriorityToFrontend(refreshedData.priority));
              }
              if (refreshedData.due_date) {
                const parsed = new Date(refreshedData.due_date);
                setDueDate(!isNaN(parsed.getTime()) ? parsed : null);
              }
            } catch (err) {
              console.error("Failed to refresh work order after update:", err);
            }
          }
          
          // Call the parent callback if provided
          if (onWorkOrderUpdate) {
            // Transform API work order to WorkOrder format for parent
            const transformedWorkOrder: WorkOrder = {
              id: updatedWorkOrder.id,
              task: updatedWorkOrder.name,
              property: updatedWorkOrder.property_name || "",
              unit: formatUnitDisplayForTable(workOrder?.unit),
              status: mapBackendStatusToFrontend(updatedWorkOrder.status),
              priority: mapBackendPriorityToFrontend(updatedWorkOrder.priority),
              dueDate: updatedWorkOrder.due_date ? new Date(updatedWorkOrder.due_date) : null,
              vendorName: updatedWorkOrder.vendor_name || "",
              description: updatedWorkOrder.description || "",
              notes: notes,
              files: files,
            };
            onWorkOrderUpdate(transformedWorkOrder);
          }
        }}
      />

      <ModalTemplate
        open={isEstimateTotalModalOpen}
        onOpenChange={setIsEstimateTotalModalOpen}
        title="Update Estimate"
        size="sm"
        footer={
          <ModalButtons
            onCancel={() => setIsEstimateTotalModalOpen(false)}
            onConfirm={handleSaveEstimateTotal}
            confirmLabel="Save"
            cancelLabel="Cancel"
          />
        }
      >
        <div className="flex flex-col gap-4">
          <ModalField label="Parts (optional)">
            <CurrencyField
              label=""
              value={draftEstimateParts ?? 0}
              onChange={(value) => {
                const n = Number(value) || 0;
                setDraftEstimateParts(n);
                // Auto-sync total = parts + labor + tax unless the user has
                // manually edited total since opening the modal. Tax recomputes
                // off the new base so the displayed amount stays in sync.
                const labor = draftEstimateLabor ?? 0;
                const rate = draftEstimateTaxRate;
                const tax = rate != null ? Math.round((n + labor) * rate) / 100 : 0;
                setDraftEstimateTaxAmount(rate != null ? tax : null);
                if (!totalManuallyEdited) {
                  setDraftEstimateTotal(n + labor + tax);
                }
              }}
              showCurrencySymbol={true}
              currencySymbol="$"
              decimalPlaces={2}
              placeholder="$0.00"
            />
          </ModalField>
          <ModalField label="Labor (optional)">
            <CurrencyField
              label=""
              value={draftEstimateLabor ?? 0}
              onChange={(value) => {
                const n = Number(value) || 0;
                setDraftEstimateLabor(n);
                const parts = draftEstimateParts ?? 0;
                const rate = draftEstimateTaxRate;
                const tax = rate != null ? Math.round((parts + n) * rate) / 100 : 0;
                setDraftEstimateTaxAmount(rate != null ? tax : null);
                if (!totalManuallyEdited) {
                  setDraftEstimateTotal(parts + n + tax);
                }
              }}
              showCurrencySymbol={true}
              currencySymbol="$"
              decimalPlaces={2}
              placeholder="$0.00"
            />
          </ModalField>
          {(() => {
            const base = (draftEstimateParts ?? 0) + (draftEstimateLabor ?? 0);
            const taxDisabled = base <= 0;
            return (
              <ModalField label="Tax rate (optional)">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    max={100}
                    step={0.01}
                    disabled={taxDisabled}
                    value={draftEstimateTaxRate ?? ""}
                    placeholder="0.00"
                    onChange={(e) => {
                      const raw = e.target.value;
                      if (raw === "") {
                        setDraftEstimateTaxRate(null);
                        setDraftEstimateTaxAmount(null);
                        if (!totalManuallyEdited) {
                          setDraftEstimateTotal(base);
                        }
                        return;
                      }
                      const rate = Number(raw);
                      if (Number.isNaN(rate)) return;
                      setDraftEstimateTaxRate(rate);
                      const tax = Math.round(base * rate) / 100;
                      setDraftEstimateTaxAmount(tax);
                      if (!totalManuallyEdited) {
                        setDraftEstimateTotal(base + tax);
                      }
                    }}
                    className="flex-1 h-10 rounded-md border border-[#e5e5e5] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2463eb] disabled:bg-[#f5f5f5] disabled:text-[#a1a1a1]"
                  />
                  <span className="text-sm text-[#717179]">%</span>
                </div>
                {taxDisabled ? (
                  <div className="text-xs text-[#717179] mt-1">
                    Add Parts or Labor to apply tax.
                  </div>
                ) : draftEstimateTaxAmount != null ? (
                  <div className="text-xs text-[#717179] mt-1">
                    Tax: {formatUSD(draftEstimateTaxAmount)}
                  </div>
                ) : null}
              </ModalField>
            );
          })()}
          <ModalField label="Total">
            <CurrencyField
              label=""
              value={draftEstimateTotal}
              onChange={(value) => {
                setDraftEstimateTotal(Number(value) || 0);
                setTotalManuallyEdited(true);
              }}
              showCurrencySymbol={true}
              currencySymbol="$"
              decimalPlaces={2}
              placeholder="$0.00"
            />
          </ModalField>
        </div>
      </ModalTemplate>

      {/* Estimate Update History Modal */}
      <ModalTemplate
        open={isEstimateHistoryModalOpen}
        onOpenChange={setIsEstimateHistoryModalOpen}
        title="Estimate Update History"
        size="sm"
      >
        {estimateHistoryLoading ? (
          <p className="text-[#717179] text-sm py-8 text-center">Loading...</p>
        ) : estimateHistoryError ? (
          <p className="text-red-600 text-sm py-4">{estimateHistoryError}</p>
        ) : (
          <EstimateHistoryTimeline entries={estimateHistoryEntries} />
        )}
      </ModalTemplate>
    </div>
  );
}
