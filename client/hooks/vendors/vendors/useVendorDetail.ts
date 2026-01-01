import { useState, useEffect } from 'react';
import { fetchVendorDetail, type VendorDetail } from '@/data/vendors';

interface UseVendorDetailResult {
  vendor: VendorDetail | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useVendorDetail(vendorId: number): UseVendorDetailResult {
  const [vendor, setVendor] = useState<VendorDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchVendorDetail(vendorId);
      setVendor(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refetch();
  }, [vendorId]);

  return { vendor, loading, error, refetch };
}
