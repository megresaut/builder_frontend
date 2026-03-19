import { useState, useEffect, useCallback } from "react";
import type { TenantDocument } from "@/types/tenant";
import {
  fetchTenantDocuments,
  uploadTenantDocument,
  createTenantDocument,
  deleteTenantDocument,
} from "@/data/tenants";
import { DeleteIcon, PlusIcon } from "@/components/icons";
import { toast } from "sonner";

interface TenantDocumentsProps {
  tenantId: number;
}

const DOC_TYPE_OPTIONS = [
  { value: "lease", label: "Lease" },
  { value: "id", label: "ID" },
  { value: "other", label: "Other" },
];

export default function TenantDocuments({ tenantId }: TenantDocumentsProps) {
  const [docs, setDocs] = useState<TenantDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const loadDocs = useCallback(async () => {
    try {
      const data = await fetchTenantDocuments(tenantId);
      setDocs(data);
    } catch (err) {
      console.error("Failed to load documents:", err);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    loadDocs();
  }, [loadDocs]);

  const handleUpload = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.txt";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      setUploading(true);
      try {
        const { object_key, mime } = await uploadTenantDocument(file);
        await createTenantDocument({
          tenant_id: tenantId,
          document_type: "other",
          document_label: file.name,
          document_object_key: object_key,
          document_mime: mime,
        });
        toast.success("Document uploaded");
        loadDocs();
      } catch {
        toast.error("Failed to upload document");
      } finally {
        setUploading(false);
      }
    };
    input.click();
  };

  const handleDelete = async (docId: number) => {
    try {
      await deleteTenantDocument(docId);
      setDocs((prev) => prev.filter((d) => d.id !== docId));
      toast.success("Document deleted");
    } catch {
      toast.error("Failed to delete document");
    }
  };

  return (
    <div className="mt-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-[#71717A]">DOCUMENTS</span>
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="flex items-center gap-1 text-[#1357D5] text-xs font-medium hover:underline disabled:opacity-50"
        >
          <PlusIcon width={12} height={12} className="text-[#1357D5]" />
          {uploading ? "Uploading..." : "Upload"}
        </button>
      </div>
      {loading ? (
        <div className="text-xs text-gray-400">Loading...</div>
      ) : docs.length === 0 ? (
        <div className="text-xs text-gray-400">No documents</div>
      ) : (
        <div className="flex flex-col gap-1">
          {docs.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between py-1 px-2 rounded bg-gray-50 text-xs">
              <span className="text-[#303030] truncate max-w-[200px]">
                {doc.document_label || doc.document_object_key.split("/").pop()}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[#71717A]">{doc.document_type}</span>
                <button
                  onClick={() => handleDelete(doc.id)}
                  className="p-0.5 hover:bg-red-50 rounded transition-colors"
                >
                  <DeleteIcon width={12} height={12} color="#982740" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
