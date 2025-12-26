import { useState, useEffect } from 'react';
import {
  fetchVendorInsurance,
  addVendorInsurance,
  deleteVendorInsurance,
  updateVendorInsurance,
  type VendorInsurance,
} from '@/data/vendors';

interface UseVendorInsuranceResult {
  insurance: VendorInsurance[];
  loading: boolean;
  error: Error | null;
  addInsurance: (provider: string, policyNumber: string, expirationDate: string) => Promise<void>;
  removeInsurance: (insuranceId: number) => Promise<void>;
  editInsurance: (insuranceId: number, provider: string, policyNumber: string, expirationDate: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useVendorInsurance(vendorId: number): UseVendorInsuranceResult {
  const [insurance, setInsurance] = useState<VendorInsurance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchVendorInsurance(vendorId);
      setInsurance(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  const addInsurance = async (provider: string, policyNumber: string, expirationDate: string) => {
    try {
      const newInsurance = await addVendorInsurance(vendorId, provider, policyNumber, expirationDate);
      setInsurance([...insurance, newInsurance]);
    } catch (err) {
      setError(err as Error);
    }
  };

  const removeInsurance = async (insuranceId: number) => {
    try {
      await deleteVendorInsurance(insuranceId);
      setInsurance(insurance.filter(i => i.id !== insuranceId));
    } catch (err) {
      setError(err as Error);
    }
  };

  const editInsurance = async (insuranceId: number, provider: string, policyNumber: string, expirationDate: string) => {
    try {
      const updated = await updateVendorInsurance(insuranceId, provider, policyNumber, expirationDate);
      if (updated) {
        setInsurance(insurance.map(i => (i.id === insuranceId ? updated : i)));
      }
    } catch (err) {
      setError(err as Error);
    }
  };

  useEffect(() => {
    refetch();
  }, [vendorId]);

  return { insurance, loading, error, addInsurance, removeInsurance, editInsurance, refetch };
}
