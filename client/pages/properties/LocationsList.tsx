import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { authFetch, fetchJSON } from "@/api/fetchJSON";
import { toast } from "sonner";
import PageHeader from "@/components/PageHeader";
import PageTemplate from "@/layout/PageTemplate";

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
}

interface LocationsListProps {
  propertyAddress: string;
  propertyType: string;
  propertyId: number;
}

export const LocationsList: React.FC<LocationsListProps> = ({
  propertyAddress,
  propertyType,
  propertyId,
}) => {
  const { propertyId: paramId } = useParams<{ propertyId: string }>();
  const id = propertyId || (paramId ? Number(paramId) : 0);
  const [locations, setLocations] = useState<LocationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
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
  }, [id]);

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

  const hasAdmin = locations.some((loc) => loc.is_admin);

  return (
    <PageTemplate>
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Locations"
          subtitle={`Physical addresses under ${propertyAddress}`}
        />

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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PageTemplate>
  );
};
