import { useState, useEffect } from 'react';
import { fetchVendors, type BaseVendor } from '@/data/vendors';

interface UseVendorsResult {
  vendors: BaseVendor[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useVendors(): UseVendorsResult {
  const [vendors, setVendors] = useState<BaseVendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchVendors();
      setVendors(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refetch();
  }, []);

  return { vendors, loading, error, refetch };
}
