export interface VendorNote {
  id: number;
  vendorId: number;
  text: string;
  date: string;
  author: string;
}

export const MOCK_VENDOR_NOTES: VendorNote[] = [
  {
    id: 1,
    vendorId: 1,
    text: "Southern Conn Gas #05-00011476-6574",
    date: "6/17/2024 10:32 AM",
    author: "Johan Gonazlez",
  },
  {
    id: 2,
    vendorId: 1,
    text: "Eversource #51124508037",
    date: "6/17/2024 10:31 AM",
    author: "Johan Gonazlez",
  },
  {
    id: 3,
    vendorId: 1,
    text: "Ashley Bae (Daughter): (626) 340-7616",
    date: "6/12/2024 2:31 PM",
    author: "Carteg Hughes",
  },
  {
    id: 4,
    vendorId: 1,
    text: "Called Optimum and got the address moved from connors lane to 1544 wazee street denver, co. 80202",
    date: "8/4/2021 10:47 AM",
    author: "Heather Seabrook",
  },
  {
    id: 5,
    vendorId: 1,
    text: "Optimum\nAcct#07808-628921-02\n203-293-4709\nPin: 2258",
    date: "3/16/2020 1:59 PM",
    author: "Mario Sciarretta",
  },
];

export async function fetchVendorNotes(vendorId: number): Promise<VendorNote[]> {
  // Mock: filter MOCK_VENDOR_NOTES by vendorId
  // API: return fetch(`/api/vendors/${vendorId}/notes`).then(r => r.json())
  return MOCK_VENDOR_NOTES.filter(n => n.vendorId === vendorId);
}

export async function createVendorNote(vendorId: number, text: string): Promise<VendorNote> {
  // Mock: create + add to MOCK_VENDOR_NOTES
  // API: return fetch(`/api/vendors/${vendorId}/notes`, { method: 'POST', body: JSON.stringify({ text }) })
  const newNote: VendorNote = {
    id: Date.now(),
    vendorId,
    text,
    date: new Date().toLocaleString(),
    author: "Current User",
  };
  MOCK_VENDOR_NOTES.push(newNote);
  return newNote;
}

export async function deleteVendorNote(noteId: number): Promise<void> {
  // Mock: remove from MOCK_VENDOR_NOTES
  // API: return fetch(`/api/notes/${noteId}`, { method: 'DELETE' })
  const idx = MOCK_VENDOR_NOTES.findIndex(n => n.id === noteId);
  if (idx >= 0) MOCK_VENDOR_NOTES.splice(idx, 1);
}

export async function updateVendorNote(noteId: number, text: string): Promise<VendorNote | null> {
  // Mock: update in MOCK_VENDOR_NOTES
  // API: return fetch(`/api/notes/${noteId}`, { method: 'PUT', body: JSON.stringify({ text }) })
  const note = MOCK_VENDOR_NOTES.find(n => n.id === noteId);
  if (!note) return null;
  note.text = text;
  note.date = new Date().toLocaleString();
  return note;
}
