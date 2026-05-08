import { useEffect, useState } from "react";
import { ModalTemplate, ModalButtons } from "@/components/ui/ModalTemplate";
import { FieldShell } from "@/components/forms/FieldShell";
import { Input } from "@/components/ui/input";
import { authFetch, fetchJSON } from "@/api/fetchJSON";

export interface CreatedVendor {
  id: number;
  name: string;
  qbo_vendor_id: string;
  buildium_vendor_id: string;
}

interface BuildiumVendorCategory {
  Id: number;
  Name: string;
}

interface NewVendorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialName: string;
  // Called with the created vendor on success. The modal closes itself.
  onCreated: (vendor: CreatedVendor) => void;
  // Called when the PM cancels — the calling flow should treat this as "abort".
  onCancel?: () => void;
}

// Quick-create modal triggered when the PM is approving an FTO and the typed
// vendor name doesn't match any vendor in our DB. Captures the minimum fields,
// then POSTs /vendors/auto-create which atomically creates the vendor in our
// DB + QBO + Buildium.
export default function NewVendorModal({
  open,
  onOpenChange,
  initialName,
  onCreated,
  onCancel,
}: NewVendorModalProps) {
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [requires1099, setRequires1099] = useState(false);
  const [buildiumCategoryID, setBuildiumCategoryID] = useState<number | null>(null);
  const [categories, setCategories] = useState<BuildiumVendorCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setName("");
      setEmail("");
      setPhone("");
      setWebsite("");
      setAddressLine1("");
      setCity("");
      setState("");
      setPostalCode("");
      setRequires1099(false);
      setBuildiumCategoryID(null);
      setError(null);
      return;
    }
    setName(initialName);

    let cancelled = false;
    setLoadingCategories(true);
    fetchJSON("/vendors/buildium-categories")
      .then((res) => {
        if (cancelled) return;
        const list: BuildiumVendorCategory[] = Array.isArray(res?.categories) ? res.categories : [];
        // Stable alpha order so the same list shape every time.
        list.sort((a, b) => (a.Name || "").localeCompare(b.Name || ""));
        setCategories(list);
        if (list.length === 1) setBuildiumCategoryID(list[0].Id);
      })
      .catch((err) => {
        if (cancelled) return;
        setError("Failed to load Buildium categories: " + (err?.message ?? String(err)));
      })
      .finally(() => {
        if (!cancelled) setLoadingCategories(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, initialName]);

  const handleSubmit = async () => {
    setError(null);
    if (!name.trim()) {
      setError("Vendor name is required.");
      return;
    }
    if (!buildiumCategoryID) {
      setError("Select a Buildium category.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await authFetch("/vendors/auto-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          website: website.trim() || undefined,
          address_line1: addressLine1.trim() || undefined,
          city: city.trim() || undefined,
          state: state.trim() || undefined,
          postal_code: postalCode.trim() || undefined,
          buildium_category_id: buildiumCategoryID,
          requires_1099: requires1099,
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Vendor create failed (${res.status})`);
      }
      const data = (await res.json()) as CreatedVendor;
      onCreated(data);
      onOpenChange(false);
    } catch (err: any) {
      setError(err?.message ?? String(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalTemplate
      open={open}
      onOpenChange={(v) => {
        if (!v) onCancel?.();
        onOpenChange(v);
      }}
      title="New Vendor"
      size="sm"
      footer={
        <ModalButtons
          onCancel={() => {
            onCancel?.();
            onOpenChange(false);
          }}
          onConfirm={handleSubmit}
          cancelLabel="Cancel"
          confirmLabel={submitting ? "Creating…" : "Create Vendor"}
          cancelDisabled={submitting}
        />
      }
    >
      <div className="text-sm text-[#717179] mb-4">
        Vendor "<span className="text-[#303030] font-medium">{initialName}</span>"
        wasn't found. Fill in their details and we'll create them in our system,
        QBO, and Buildium.
      </div>

      <div style={{ marginBottom: 12 }}>
        <FieldShell label="Vendor name" htmlFor="nv-name">
          <Input id="nv-name" value={name} onChange={(e) => setName(e.target.value)} disabled={submitting} />
        </FieldShell>
      </div>

      <div style={{ marginBottom: 12 }}>
        <FieldShell label="Buildium category" htmlFor="nv-cat">
          <select
            id="nv-cat"
            value={buildiumCategoryID == null ? "" : String(buildiumCategoryID)}
            onChange={(e) => setBuildiumCategoryID(e.target.value ? Number(e.target.value) : null)}
            disabled={loadingCategories || submitting}
            className="w-full rounded-md border border-[#DADADA] bg-white px-3 py-2 text-sm outline-none focus:border-[#013764]"
          >
            <option value="">{loadingCategories ? "Loading…" : "Select a category"}</option>
            {categories.map((c) => (
              <option key={c.Id} value={c.Id}>
                {c.Name}
              </option>
            ))}
          </select>
        </FieldShell>
      </div>

      <div style={{ marginBottom: 12 }}>
        <FieldShell label="Email (optional)" htmlFor="nv-email">
          <Input id="nv-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={submitting} />
        </FieldShell>
      </div>

      <div style={{ marginBottom: 12 }}>
        <FieldShell label="Phone (optional)" htmlFor="nv-phone">
          <Input id="nv-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={submitting} />
        </FieldShell>
      </div>

      <div style={{ marginBottom: 12 }}>
        <FieldShell label="Website (optional)" htmlFor="nv-website">
          <Input id="nv-website" type="url" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://..." disabled={submitting} />
        </FieldShell>
      </div>

      <div style={{ marginBottom: 12 }}>
        <FieldShell label="Street (optional)" htmlFor="nv-addr1">
          <Input id="nv-addr1" value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} disabled={submitting} />
        </FieldShell>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        <div style={{ flex: 2 }}>
          <FieldShell label="City (optional)" htmlFor="nv-city">
            <Input id="nv-city" value={city} onChange={(e) => setCity(e.target.value)} disabled={submitting} />
          </FieldShell>
        </div>
        <div style={{ flex: 1 }}>
          <FieldShell label="State" htmlFor="nv-state">
            <Input id="nv-state" value={state} onChange={(e) => setState(e.target.value)} disabled={submitting} maxLength={2} />
          </FieldShell>
        </div>
        <div style={{ flex: 1 }}>
          <FieldShell label="Zip" htmlFor="nv-zip">
            <Input id="nv-zip" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} disabled={submitting} />
          </FieldShell>
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label className="flex items-center gap-2 text-sm text-[#303030]">
          <input
            type="checkbox"
            checked={requires1099}
            onChange={(e) => setRequires1099(e.target.checked)}
            disabled={submitting}
          />
          1099 vendor
        </label>
      </div>

      {error && <div className="text-sm text-red-600 mt-2 whitespace-pre-wrap">{error}</div>}
    </ModalTemplate>
  );
}
