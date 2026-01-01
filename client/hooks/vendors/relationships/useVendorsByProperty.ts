import { useState, useEffect } from 'react';
import { fetchVendorsForProperty, type PropertyVendor } from '@/data/vendors';

interface UseVendorsByPropertyResult {
  vendors: PropertyVendor[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useVendorsByProperty(propertyId: string): UseVendorsByPropertyResult {
  const [vendors, setVendors] = useState<PropertyVendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchVendorsForProperty(propertyId);
      setVendors(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refetch();
  }, [propertyId]);

  return { vendors, loading, error, refetch };
}
