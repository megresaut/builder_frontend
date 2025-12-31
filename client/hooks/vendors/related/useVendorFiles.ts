import { useState, useEffect } from 'react';
import {
  fetchVendorFiles,
  uploadVendorFile,
  deleteVendorFile,
  updateVendorFile,
  type VendorFile,
} from '@/data/vendors';

interface UseVendorFilesResult {
  files: VendorFile[];
  loading: boolean;
  error: Error | null;
  uploadFile: (file: File, category?: string, description?: string) => Promise<void>;
  deleteFile: (fileId: number) => Promise<void>;
  updateFile: (fileId: number, updates: Partial<Pick<VendorFile, 'name' | 'category' | 'description'>>) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useVendorFiles(vendorId: number): UseVendorFilesResult {
  const [files, setFiles] = useState<VendorFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchVendorFiles(vendorId);
      setFiles(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  const uploadFile = async (file: File, category?: string, description?: string) => {
    try {
      const newFile = await uploadVendorFile(vendorId, file, category, description);
      setFiles([...files, newFile]);
    } catch (err) {
      setError(err as Error);
    }
  };

  const deleteFile = async (fileId: number) => {
    try {
      await deleteVendorFile(fileId);
      setFiles(files.filter(f => f.id !== fileId));
    } catch (err) {
      setError(err as Error);
    }
  };

  const updateFile = async (fileId: number, updates: Partial<Pick<VendorFile, 'name' | 'category' | 'description'>>) => {
    try {
      await updateVendorFile(fileId, updates);
      setFiles(files.map(f => f.id === fileId ? { ...f, ...updates } : f));
    } catch (err) {
      setError(err as Error);
    }
  };

  useEffect(() => {
    refetch();
  }, [vendorId]);

  return { files, loading, error, uploadFile, deleteFile, refetch };
}
