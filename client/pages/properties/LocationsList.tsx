import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchJSON } from "@/api/fetchJSON";
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

  return (
    <PageTemplate>
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Locations"
          subtitle={`Physical addresses under ${propertyAddress}`}
        />
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
