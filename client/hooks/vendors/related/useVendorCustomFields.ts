import { useState, useEffect } from 'react';
import {
  fetchVendorCustomFields,
  addVendorCustomField,
  deleteVendorCustomField,
  updateVendorCustomField,
  type VendorCustomField,
} from '@/data/vendors';

interface UseVendorCustomFieldsResult {
  fields: VendorCustomField[];
  loading: boolean;
  error: Error | null;
  addField: (name: string, value: string) => Promise<void>;
  removeField: (fieldId: number) => Promise<void>;
  editField: (fieldId: number, name: string, value: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useVendorCustomFields(vendorId: number): UseVendorCustomFieldsResult {
  const [fields, setFields] = useState<VendorCustomField[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchVendorCustomFields(vendorId);
      setFields(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  const addField = async (name: string, value: string) => {
    try {
      const newField = await addVendorCustomField(vendorId, name, value);
      setFields([...fields, newField]);
    } catch (err) {
      setError(err as Error);
    }
  };

  const removeField = async (fieldId: number) => {
    try {
      await deleteVendorCustomField(fieldId);
      setFields(fields.filter(f => f.id !== fieldId));
    } catch (err) {
      setError(err as Error);
    }
  };

  const editField = async (fieldId: number, name: string, value: string) => {
    try {
      const updated = await updateVendorCustomField(fieldId, name, value);
      if (updated) {
        setFields(fields.map(f => (f.id === fieldId ? updated : f)));
      }
    } catch (err) {
      setError(err as Error);
    }
  };

  useEffect(() => {
    refetch();
  }, [vendorId]);

  return { fields, loading, error, addField, removeField, editField, refetch };
}
