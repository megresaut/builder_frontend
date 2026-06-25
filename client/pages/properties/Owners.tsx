import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import AddOwnerModal, { type OwnerFormData } from "@/components/AddOwnerModal";
import { ModalTemplate, ModalButtons } from "@/components/ui/ModalTemplate";
import {
  fetchOwnersByProperty,
  deleteOwner,
  fetchOwnerDocuments,
  uploadOwnerFile,
  createOwnerDocument,
  deleteOwnerDocument,
  fetchOwnerAudit,
  type Owner,
  type OwnerDocument,
  type OwnerAuditEntry,
} from "@/data/owners";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatPercent(n: number): string {
  return `${parseFloat(String(n)).toFixed(0)}%`;
}

const ENTITY_LABELS: Record<string, string> = {
  individual: "Individual",
  llc: "LLC",
  trust: "Trust",
};

const DOC_TYPE_LABELS: Record<string, string> = {
  ownership: "Ownership",
  insurance: "Insurance",
  tax: "Tax",
  other: "Other",
};

const STATUS_STYLE: Record<string, { bg: string; text: string }> = {
  active: { bg: "bg-green-100", text: "text-green-800" },
  inactive: { bg: "bg-gray-100", text: "text-gray-500" },
};

const ENTITY_STYLE: Record<string, { bg: string; text: string }> = {
  individual: { bg: "bg-blue-50", text: "text-blue-700" },
  llc: { bg: "bg-purple-50", text: "text-purple-700" },
  trust: { bg: "bg-amber-50", text: "text-amber-700" },
};

function ownerToFormData(o: Owner): OwnerFormData {
  return {
    id: o.id,
    firstName: o.first_name,
    lastName: o.last_name,
    email: o.email ?? "",
    phone: o.phone ?? "",
    ownershipPercentage: o.ownership_percentage,
    ownerSince: o.owner_since ?? "",
    mailingAddress: o.mailing_address ?? "",
    status: o.status as "active" | "inactive",
    entityType: o.entity_type as "individual" | "llc" | "trust",
    entityName: o.entity_name ?? "",
    taxId: o.tax_id ?? "",
  };
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-[#717179]">
        {label}
      </span>
      <span className="text-sm text-[#09090b] font-medium">{value || "—"}</span>
    </div>
  );
}

function DocumentRow({
  doc,
  onDelete,
}: {
  doc: OwnerDocument;
  onDelete: (id: number) => void;
}) {
  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-md bg-gray-50 border border-gray-100 hover:bg-gray-100 transition-colors group">
      <div className="flex items-center gap-2 min-w-0">
        <svg
          className="shrink-0 text-gray-400"
          width="14"
          height="14"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M9 1H3.5A1.5 1.5 0 002 2.5v11A1.5 1.5 0 003.5 15h9a1.5 1.5 0 001.5-1.5V6L9 1z"
            stroke="currentColor"
            strokeWidth="1.25"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M9 1v5h5"
            stroke="currentColor"
            strokeWidth="1.25"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="text-xs text-[#09090b] truncate">
          {doc.document_label || DOC_TYPE_LABELS[doc.document_type] || doc.document_type}
        </span>
        <span className="text-[10px] text-gray-400 shrink-0">
          {DOC_TYPE_LABELS[doc.document_type]}
        </span>
      </div>
      <button
        onClick={() => onDelete(doc.id)}
        className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-600 ml-2 shrink-0"
        title="Delete document"
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M2 4h12M5 4V2.5A1.5 1.5 0 016.5 1h3A1.5 1.5 0 0111 2.5V4m2 0v9.5a1.5 1.5 0 01-1.5 1.5h-7A1.5 1.5 0 013 13.5V4h10z"
            stroke="currentColor"
            strokeWidth="1.25"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Owner Card
// ---------------------------------------------------------------------------

function OwnerCard({
  owner,
  onEdit,
  onDelete,
}: {
  owner: Owner;
  onEdit: (owner: Owner) => void;
  onDelete: (owner: Owner) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [docs, setDocs] = useState<OwnerDocument[]>([]);
  const [audit, setAudit] = useState<OwnerAuditEntry[]>([]);
  const [docsLoaded, setDocsLoaded] = useState(false);
  const [auditLoaded, setAuditLoaded] = useState(false);
  const [showAudit, setShowAudit] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadType, setUploadType] = useState<"ownership" | "insurance" | "tax" | "other">("ownership");

  const loadDocs = useCallback(async () => {
    if (docsLoaded) return;
    try {
      const d = await fetchOwnerDocuments(owner.id);
      setDocs(d);
      setDocsLoaded(true);
    } catch {
      // silently skip
    }
  }, [owner.id, docsLoaded]);

  const loadAudit = useCallback(async () => {
    if (auditLoaded) return;
    try {
      const a = await fetchOwnerAudit(owner.id);
      setAudit(a);
      setAuditLoaded(true);
    } catch {
      // silently skip
    }
  }, [owner.id, auditLoaded]);

  const handleExpand = () => {
    const next = !expanded;
    setExpanded(next);
    if (next) loadDocs();
  };

  const handleShowAudit = () => {
    const next = !showAudit;
    setShowAudit(next);
    if (next) loadAudit();
  };

  const handleDeleteDoc = async (docId: number) => {
    try {
      await deleteOwnerDocument(docId);
      setDocs((prev) => prev.filter((d) => d.id !== docId));
      toast.success("Document deleted");
    } catch {
      toast.error("Failed to delete document");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { object_key, mime } = await uploadOwnerFile(file);
      const doc = await createOwnerDocument({
        owner_id: owner.id,
        document_type: uploadType,
        document_label: file.name,
        document_object_key: object_key,
        document_mime: mime,
      });
      setDocs((prev) => [...prev, doc]);
      toast.success("Document uploaded");
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const statusStyle = STATUS_STYLE[owner.status] ?? STATUS_STYLE.inactive;
  const entityStyle = ENTITY_STYLE[owner.entity_type] ?? ENTITY_STYLE.individual;
  const isEntity = owner.entity_type !== "individual";

  return (
    <div className="bg-white rounded-xl border border-[#e5e5e5] overflow-hidden">
      {/* Card header */}
      <div className="flex items-start justify-between px-6 py-5 gap-4">
        <div className="flex items-start gap-4 min-w-0">
          {/* Avatar */}
          <div className="shrink-0 w-10 h-10 rounded-full bg-[#f4f4f5] flex items-center justify-center text-sm font-semibold text-[#09090b]">
            {owner.first_name[0]}{owner.last_name[0]}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-base font-semibold text-[#09090b]">
                {isEntity && owner.entity_name
                  ? owner.entity_name
                  : `${owner.first_name} ${owner.last_name}`}
              </span>
              {isEntity && owner.entity_name && (
                <span className="text-xs text-gray-500">
                  ({owner.first_name} {owner.last_name})
                </span>
              )}
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${entityStyle.bg} ${entityStyle.text}`}
              >
                {ENTITY_LABELS[owner.entity_type] ?? owner.entity_type}
              </span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${statusStyle.bg} ${statusStyle.text}`}
              >
                {owner.status}
              </span>
            </div>

            <div className="flex items-center gap-4 mt-1 flex-wrap">
              {owner.email && (
                <a
                  href={`mailto:${owner.email}`}
                  className="text-xs text-[#1357D5] hover:underline"
                >
                  {owner.email}
                </a>
              )}
              {owner.phone && (
                <a
                  href={`tel:${owner.phone}`}
                  className="text-xs text-[#717179] hover:text-[#09090b]"
                >
                  {owner.phone}
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Ownership % + actions */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <div className="text-2xl font-bold text-[#09090b]">
              {formatPercent(owner.ownership_percentage)}
            </div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wide">Ownership</div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onEdit(owner)}
              className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-[#09090b] transition-colors"
              title="Edit owner"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M11.5 1.5l3 3-9 9H2.5v-3l9-9z"
                  stroke="currentColor"
                  strokeWidth="1.25"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button
              onClick={() => onDelete(owner)}
              className="p-1.5 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
              title="Delete owner"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M2 4h12M5 4V2.5A1.5 1.5 0 016.5 1h3A1.5 1.5 0 0111 2.5V4m2 0v9.5a1.5 1.5 0 01-1.5 1.5h-7A1.5 1.5 0 013 13.5V4h10z"
                  stroke="currentColor"
                  strokeWidth="1.25"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-4 px-6 pb-5 border-t border-[#f4f4f5] pt-4">
        <InfoRow label="Owner Since" value={formatDate(owner.owner_since)} />
        <InfoRow
          label="Mailing Address"
          value={owner.mailing_address}
        />
        {owner.tax_id && <InfoRow label="Tax ID" value={owner.tax_id} />}
        {isEntity && owner.entity_name && (
          <InfoRow label="Entity Name" value={owner.entity_name} />
        )}
      </div>

      {/* Expand toggle */}
      <button
        onClick={handleExpand}
        className="w-full flex items-center justify-between px-6 py-3 border-t border-[#f4f4f5] text-xs text-[#717179] hover:text-[#09090b] hover:bg-gray-50 transition-colors"
      >
        <span>Documents &amp; History</span>
        <svg
          className={`transition-transform ${expanded ? "rotate-180" : ""}`}
          width="14"
          height="14"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4 6l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {expanded && (
        <div className="px-6 pb-6 border-t border-[#f4f4f5] pt-4 space-y-5">
          {/* Documents */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-[#09090b] uppercase tracking-wider">
                Documents
              </span>
              <div className="flex items-center gap-2">
                <select
                  value={uploadType}
                  onChange={(e) =>
                    setUploadType(e.target.value as typeof uploadType)
                  }
                  className="text-xs border border-gray-200 rounded px-2 py-1 text-gray-600 bg-white focus:outline-none focus:ring-1 focus:ring-[#09090b]"
                >
                  <option value="ownership">Ownership</option>
                  <option value="insurance">Insurance</option>
                  <option value="tax">Tax</option>
                  <option value="other">Other</option>
                </select>
                <label className="text-xs text-[#1357D5] cursor-pointer hover:underline">
                  {uploading ? "Uploading…" : "+ Upload"}
                  <input
                    type="file"
                    className="hidden"
                    disabled={uploading}
                    onChange={handleFileUpload}
                  />
                </label>
              </div>
            </div>
            {docs.length === 0 ? (
              <p className="text-xs text-gray-400 italic">No documents uploaded</p>
            ) : (
              <div className="space-y-1.5">
                {docs.map((doc) => (
                  <DocumentRow key={doc.id} doc={doc} onDelete={handleDeleteDoc} />
                ))}
              </div>
            )}
          </div>

          {/* Audit history */}
          <div>
            <button
              onClick={handleShowAudit}
              className="text-xs font-semibold text-[#09090b] uppercase tracking-wider hover:text-[#1357D5] transition-colors flex items-center gap-1"
            >
              Activity History
              <svg
                className={`transition-transform ${showAudit ? "rotate-180" : ""}`}
                width="12"
                height="12"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M4 6l4 4 4-4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            {showAudit && (
              <div className="mt-3 space-y-2">
                {audit.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">No activity recorded</p>
                ) : (
                  audit.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-start gap-2 text-xs text-[#717179]"
                    >
                      <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0" />
                      <div>
                        <span className="font-medium text-[#09090b]">{entry.action}</span>
                        {entry.details && (
                          <span className="ml-1 text-gray-400">— {entry.details}</span>
                        )}
                        <div className="text-gray-400">{formatDate(entry.created_at)}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

interface OwnersProps {
  propertyId: number;
  propertyType: string;
}

export function Owners({ propertyId, propertyType }: OwnersProps) {
  const [owners, setOwners] = useState<Owner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingOwner, setEditingOwner] = useState<OwnerFormData | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Owner | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchOwnersByProperty(propertyId);
      setOwners(data);
    } catch {
      toast.error("Failed to load owners");
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    load();
  }, [load]);

  const totalOwnership = owners.reduce(
    (sum, o) => sum + (parseFloat(String(o.ownership_percentage)) || 0),
    0
  );

  const handleEdit = (owner: Owner) => {
    setEditingOwner(ownerToFormData(owner));
    setShowModal(true);
  };

  const handleAddNew = () => {
    setEditingOwner(null);
    setShowModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteOwner(deleteTarget.id);
      setOwners((prev) => prev.filter((o) => o.id !== deleteTarget.id));
      toast.success("Owner removed");
    } catch {
      toast.error("Failed to remove owner");
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[#09090b]">
            {loading ? "Owners" : `${owners.length} Owner${owners.length !== 1 ? "s" : ""}`}
          </h2>
          {!loading && owners.length > 0 && (
            <p className="text-xs text-[#717179] mt-0.5">
              {totalOwnership.toFixed(0)}% ownership accounted for
              {totalOwnership < 100 && (
                <span className="ml-1 text-amber-600">
                  ({(100 - totalOwnership).toFixed(0)}% unassigned)
                </span>
              )}
            </p>
          )}
        </div>
        <button
          onClick={handleAddNew}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#013764] text-white text-sm font-medium hover:bg-[#003a73] transition-colors shadow-[0_0_0_1px_#002D5A]"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          </svg>
          Add Owner
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-sm text-gray-400 py-10 text-center">Loading owners…</div>
      ) : owners.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#e5e5e5] py-14 flex flex-col items-center gap-3">
          <svg
            className="text-gray-300"
            width="40"
            height="40"
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="20" cy="14" r="7" stroke="currentColor" strokeWidth="2" />
            <path
              d="M6 36c0-7.732 6.268-14 14-14s14 6.268 14 14"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <div className="text-center">
            <p className="text-sm font-medium text-[#09090b]">No owners yet</p>
            <p className="text-xs text-[#717179] mt-0.5">Add an owner to track ownership details for this property</p>
          </div>
          <button
            onClick={handleAddNew}
            className="mt-1 text-sm text-[#1357D5] hover:underline font-medium"
          >
            + Add Owner
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {owners.map((owner) => (
            <OwnerCard
              key={owner.id}
              owner={owner}
              onEdit={handleEdit}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      {/* Add / Edit modal */}
      <AddOwnerModal
        open={showModal}
        onOpenChange={setShowModal}
        unitId={0}
        propertyId={propertyId}
        editData={editingOwner}
        onSaved={() => {
          setShowModal(false);
          load();
        }}
      />

      {/* Delete confirm */}
      {deleteTarget && (
        <ModalTemplate
          open={true}
          onOpenChange={() => setDeleteTarget(null)}
          title="Remove Owner"
        >
          <p className="text-sm text-[#717179] mb-4">
            Remove {deleteTarget.first_name} {deleteTarget.last_name} from this property? This cannot be undone.
          </p>
          <ModalButtons
            confirmLabel="Remove"
            onConfirm={handleDeleteConfirm}
            onCancel={() => setDeleteTarget(null)}
          />
        </ModalTemplate>
      )}
    </div>
  );
}
