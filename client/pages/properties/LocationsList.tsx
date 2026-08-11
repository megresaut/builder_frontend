import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { MoreHorizontal } from "lucide-react";
import { authFetch, fetchJSON } from "@/api/fetchJSON";
import { toast } from "sonner";
import PageHeader from "@/components/PageHeader";
import PageTemplate from "@/layout/PageTemplate";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ModalTemplate, ModalButtons, ModalText } from "@/components/ui/ModalTemplate";
import { useAuth } from "@/auth/useAuth";
import LocationFormModal, { type LocationFormValues } from "./LocationFormModal";

/** Counts of records that block a delete, mirrored from the API. */
export interface LocationUsage {
  tasks: number;
  work_orders: number;
  field_team_orders: number;
  fto_submissions: number;
  inspections: number;
  recurring_task_series: number;
}

export interface LocationRow {
  id: number;
  property_id: number;
  address_line1: string;
  address_line2?: string | null;
  city: string;
  state: string;
  postal_code: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  is_admin: boolean;
  usage: LocationUsage;
}

interface LocationsListProps {
  propertyAddress: string;
  propertyType: string;
  propertyId: number;
}

const USAGE_LABELS: Array<[keyof LocationUsage, string, string]> = [
  ["tasks", "task", "tasks"],
  ["work_orders", "work order", "work orders"],
  ["field_team_orders", "field team order", "field team orders"],
  ["fto_submissions", "FTO submission", "FTO submissions"],
  ["inspections", "inspection", "inspections"],
  ["recurring_task_series", "recurring series", "recurring series"],
];

const usageTotal = (u?: LocationUsage): number =>
  u ? USAGE_LABELS.reduce((sum, [key]) => sum + (u[key] ?? 0), 0) : 0;

export const LocationsList: React.FC<LocationsListProps> = ({
  propertyAddress,
  propertyType,
  propertyId,
}) => {
  const { propertyId: paramId } = useParams<{ propertyId: string }>();
  const id = propertyId || (paramId ? Number(paramId) : 0);
  const { role } = useAuth();
  const [locations, setLocations] = useState<LocationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Write access mirrors the API: admins and property managers may add and
  // edit; only admins may delete. Hiding the actions a role cannot use beats
  // showing a control that answers 403.
  const canWrite = role === "admin" || role === "property_manager";
  const canDelete = role === "admin";

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<LocationRow | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<LocationRow | null>(null);
  const [blocked, setBlocked] = useState<{ row: LocationRow; usage: LocationUsage; isAdmin: boolean } | null>(null);

  const loadLocations = () => {
    if (!id) {
      setLoading(false);
      return () => {};
    }
    let cancelled = false;
    setLoading(true);
    fetchJSON(`/properties/${id}/locations`)
      .then((data: unknown) => {
        if (!cancelled && Array.isArray(data)) {
          setLocations(data as LocationRow[]);
        }
      })
      .catch(() => {
        if (!cancelled) setLocations([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  };

  useEffect(loadLocations, [id]);

  // Designating an admin location is what opts this property into per-location
  // invoice PDFs: the management fee and every bill with no location of its own
  // get billed under it. Clearing it reverts to a single combined PDF.
  const setAdminLocation = async (locationId: number | null) => {
    if (!id || saving) return;
    setSaving(true);
    const toastId = toast.loading(
      locationId === null
        ? "Clearing admin location…"
        : "Setting admin location…",
    );
    try {
      const res = await authFetch(`/properties/${id}/admin-location`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location_id: locationId }),
      });
      if (!res.ok) {
        throw new Error((await res.text()) || "Update failed");
      }
      setLocations((prev) =>
        prev.map((loc) => ({ ...loc, is_admin: loc.id === locationId })),
      );
      toast.success(
        locationId === null
          ? "Admin location cleared — invoices will send as one combined PDF"
          : "Admin location set — invoices will send one PDF per location",
        { id: toastId },
      );
    } catch (err: any) {
      toast.error("Couldn't update the admin location", {
        id: toastId,
        description: err?.message ?? "Unexpected error",
      });
    } finally {
      setSaving(false);
    }
  };

  const submitLocation = async (values: LocationFormValues) => {
    const editingId = editing?.id;
    const isEdit = editingId != null;
    const toastId = toast.loading(isEdit ? "Saving location…" : "Creating location…");
    try {
      const res = await authFetch(
        isEdit
          ? `/properties/${id}/locations/${editingId}`
          : `/properties/${id}/locations`,
        {
          // PUT, not PATCH: the body replaces the whole address. A 4-segment
          // PATCH under /properties is also unroutable on the server.
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            address_line1: values.address_line1,
            address_line2: values.address_line2 || null,
            city: values.city,
            state: values.state,
            postal_code: values.postal_code,
          }),
        },
      );
      if (!res.ok) {
        throw new Error((await res.text())?.trim() || "Save failed");
      }
      const saved: LocationRow = await res.json();
      setLocations((prev) => {
        const next = isEdit
          ? prev.map((loc) => (loc.id === saved.id ? saved : loc))
          : [...prev, saved];
        // Keep the server's ordering: admin location first, then by address.
        return next.sort((a, b) => {
          if (a.is_admin !== b.is_admin) return a.is_admin ? -1 : 1;
          return a.address_line1.localeCompare(b.address_line1) || a.id - b.id;
        });
      });
      toast.success(isEdit ? "Location updated" : "Location added", { id: toastId });
    } catch (err: any) {
      toast.error(isEdit ? "Couldn't save the location" : "Couldn't add the location", {
        id: toastId,
        description: err?.message ?? "Unexpected error",
      });
      throw err; // keeps the modal open so the entry isn't lost
    }
  };

  const deleteLocation = async (row: LocationRow) => {
    const toastId = toast.loading("Deleting location…");
    try {
      const res = await authFetch(`/properties/${id}/locations/${row.id}`, {
        method: "DELETE",
      });

      // 409 is the expected answer for a location something still points at.
      // The server is the authority here, not the cached usage counts.
      if (res.status === 409) {
        const body = await res.json().catch(() => null);
        toast.dismiss(toastId);
        setConfirmDelete(null);
        setBlocked({
          row,
          usage: body?.usage ?? row.usage,
          isAdmin: body?.error === "location_is_admin",
        });
        return;
      }
      if (!res.ok) {
        throw new Error((await res.text())?.trim() || "Delete failed");
      }
      setLocations((prev) => prev.filter((loc) => loc.id !== row.id));
      setConfirmDelete(null);
      toast.success("Location deleted", { id: toastId });
    } catch (err: any) {
      toast.error("Couldn't delete the location", {
        id: toastId,
        description: err?.message ?? "Unexpected error",
      });
    }
  };

  const hasAdmin = locations.some((loc) => loc.is_admin);

  const formatAddress = (loc: LocationRow) =>
    `${loc.address_line1}, ${loc.city} ${loc.state} ${loc.postal_code}`;

  return (
    <PageTemplate>
      <div className="flex flex-col gap-6">
        <div className="flex items-start justify-between gap-4">
          <PageHeader
            title="Locations"
            subtitle={`Physical addresses under ${propertyAddress}`}
          />
          {canWrite && (
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
              className="shrink-0 rounded-md bg-[#013764] px-4 py-2 text-sm font-medium text-white hover:bg-[#012a4d]"
            >
              Add location
            </button>
          )}
        </div>

        {locations.length > 0 && (
          <div className="flex items-start justify-between gap-4 rounded-lg border border-[#e5e5e5] bg-[#fafafa] px-4 py-3">
            <p className="text-sm text-[#717179]">
              The{" "}
              <span className="font-medium text-[#09090b]">admin location</span>{" "}
              carries this property's management fee and every bill that isn't
              tied to a location. Setting one splits the monthly invoice into a
              separate PDF per location when it's emailed; with none set, the
              owner receives a single combined PDF.
            </p>
            {hasAdmin && (
              <button
                type="button"
                disabled={saving}
                onClick={() => setAdminLocation(null)}
                className="shrink-0 text-sm font-medium text-[#013764] underline hover:no-underline disabled:opacity-50"
              >
                Clear
              </button>
            )}
          </div>
        )}

        {loading ? (
          <p className="text-[#717179]">Loading locations...</p>
        ) : locations.length === 0 ? (
          <p className="text-[#717179]">
            No locations for this property. Locations represent distinct
            physical sites under the same property ownership.
          </p>
        ) : (
          <div className="border border-[#e5e5e5] rounded-lg overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#fafafa] border-b border-[#e5e5e5]">
                  <th className="px-4 py-3 text-sm font-medium text-[#717179]">
                    Address
                  </th>
                  <th className="px-4 py-3 text-sm font-medium text-[#717179]">
                    City, State
                  </th>
                  <th className="px-4 py-3 text-sm font-medium text-[#717179]">
                    Postal Code
                  </th>
                  <th className="px-4 py-3 text-sm font-medium text-[#717179]">
                    Admin location
                  </th>
                  {canWrite && <th className="w-12 px-2 py-3" aria-label="Actions" />}
                </tr>
              </thead>
              <tbody>
                {locations.map((loc) => (
                  <tr
                    key={loc.id}
                    className="border-b border-[#e5e5e5] last:border-0 hover:bg-[#fafafa]"
                  >
                    <td className="px-4 py-3 text-sm text-[#09090b]">
                      {loc.address_line1}
                      {loc.address_line2 ? (
                        <span className="block text-[#717179]">
                          {loc.address_line2}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#09090b]">
                      {loc.city}, {loc.state}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#09090b]">
                      {loc.postal_code}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <label className="inline-flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="admin-location"
                          checked={loc.is_admin}
                          disabled={saving}
                          onChange={() => setAdminLocation(loc.id)}
                          className="h-4 w-4 accent-[#013764]"
                          aria-label={`Set ${loc.address_line1} as the admin location`}
                        />
                        <span className="text-[#717179]">
                          {loc.is_admin ? "Admin" : ""}
                        </span>
                      </label>
                    </td>
                    {canWrite && (
                      <td className="w-12 px-2 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              className="rounded p-1 text-[#717179] hover:bg-[#f0f0f0] hover:text-[#09090b]"
                              aria-label={`Actions for ${loc.address_line1}`}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onSelect={() => {
                                setEditing(loc);
                                setFormOpen(true);
                              }}
                            >
                              Edit
                            </DropdownMenuItem>
                            {canDelete && (
                              <DropdownMenuItem
                                // Deleting the admin location would succeed in the
                                // database and silently revert this property from
                                // per-location invoice PDFs to a single combined
                                // one. Too consequential to be a side effect.
                                disabled={loc.is_admin}
                                className="text-[#b42318] focus:text-[#b42318]"
                                onSelect={() => {
                                  if (usageTotal(loc.usage) > 0) {
                                    setBlocked({ row: loc, usage: loc.usage, isAdmin: false });
                                  } else {
                                    setConfirmDelete(loc);
                                  }
                                }}
                              >
                                Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <LocationFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        location={editing}
        onSubmit={submitLocation}
      />

      {/* Plain confirm — reached only when nothing references the location. */}
      <ModalTemplate
        open={confirmDelete !== null}
        onOpenChange={(open) => !open && setConfirmDelete(null)}
        title="Delete location?"
        footer={
          <ModalButtons
            onCancel={() => setConfirmDelete(null)}
            onConfirm={() => confirmDelete && deleteLocation(confirmDelete)}
            cancelLabel="Cancel"
            confirmLabel="Delete"
          />
        }
      >
        <ModalText>
          {confirmDelete ? formatAddress(confirmDelete) : ""} isn't used by any task,
          work order, FTO, or inspection. This can't be undone.
        </ModalText>
      </ModalTemplate>

      {/* Blocking dialog — no destructive action, just the reason. */}
      <ModalTemplate
        open={blocked !== null}
        onOpenChange={(open) => !open && setBlocked(null)}
        title="Can't delete this location"
        // A single dismiss button, not ModalButtons: there is no action to
        // confirm here and a Cancel/Confirm pair would imply one exists.
        footer={
          <button
            type="button"
            onClick={() => setBlocked(null)}
            className="rounded-lg bg-[#013764] px-3 py-2 text-base font-medium text-white hover:bg-[#012a4d]"
          >
            Got it
          </button>
        }
      >
        {blocked?.isAdmin ? (
          <ModalText>
            {blocked.row.address_line1} is this property's admin location. Clear the
            admin designation first — otherwise deleting it would quietly switch the
            owner's monthly invoice back to a single combined PDF.
          </ModalText>
        ) : (
          <>
            <ModalText>
              {blocked?.row.address_line1} is still in use:
            </ModalText>
            <ul className="mt-3 list-disc pl-5 text-sm text-[#717179]">
              {blocked &&
                USAGE_LABELS.filter(([key]) => (blocked.usage[key] ?? 0) > 0).map(
                  ([key, one, many]) => (
                    <li key={key}>
                      {blocked.usage[key]} {blocked.usage[key] === 1 ? one : many}
                    </li>
                  ),
                )}
            </ul>
            <p className="mt-3 text-sm text-[#717179]">
              Reassign or close those first, then delete this location.
            </p>
          </>
        )}
      </ModalTemplate>
    </PageTemplate>
  );
};
