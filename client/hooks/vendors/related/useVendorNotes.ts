import { useState, useEffect } from 'react';
import {
  fetchVendorNotes,
  createVendorNote,
  deleteVendorNote,
  updateVendorNote,
  type VendorNote,
} from '@/data/vendors';

interface UseVendorNotesResult {
  notes: VendorNote[];
  loading: boolean;
  error: Error | null;
  addNote: (text: string) => Promise<void>;
  removeNote: (noteId: number) => Promise<void>;
  editNote: (noteId: number, text: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useVendorNotes(vendorId: number): UseVendorNotesResult {
  const [notes, setNotes] = useState<VendorNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchVendorNotes(vendorId);
      setNotes(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  const addNote = async (text: string) => {
    try {
      const newNote = await createVendorNote(vendorId, text);
      setNotes([newNote, ...notes]);
    } catch (err) {
      setError(err as Error);
    }
  };

  const removeNote = async (noteId: number) => {
    try {
      await deleteVendorNote(noteId);
      setNotes(notes.filter(n => n.id !== noteId));
    } catch (err) {
      setError(err as Error);
    }
  };

  const editNote = async (noteId: number, text: string) => {
    try {
      const updated = await updateVendorNote(noteId, text);
      if (updated) {
        setNotes(notes.map(n => (n.id === noteId ? updated : n)));
      }
    } catch (err) {
      setError(err as Error);
    }
  };

  useEffect(() => {
    refetch();
  }, [vendorId]);

  return { notes, loading, error, addNote, removeNote, editNote, refetch };
}
