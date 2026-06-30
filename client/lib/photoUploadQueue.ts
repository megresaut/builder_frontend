/**
 * IndexedDB-backed queue for inspection photos that couldn't be uploaded
 * due to lack of network connectivity (basements, dead zones, etc.).
 *
 * Photos are stored as Blobs — too large for localStorage. The queue is
 * drained automatically when the device comes back online.
 */

export interface QueuedPhoto {
  id?: number; // auto-assigned by IDB
  inspectionId: number;
  sectionNodeId: string;
  comment: string;
  condition?: "good" | "fair" | "poor";
  blob: Blob;
  fileName: string;
  mimeType: string;
  queuedAt: string; // ISO timestamp
}

const DB_NAME = "ra_inspection_photo_queue";
const STORE = "photos";
const VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id", autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function enqueuePhoto(photo: Omit<QueuedPhoto, "id">): Promise<void> {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const req = tx.objectStore(STORE).add(photo);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getQueuedPhotos(inspectionId: number): Promise<QueuedPhoto[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () =>
      resolve((req.result as QueuedPhoto[]).filter((p) => p.inspectionId === inspectionId));
    req.onerror = () => reject(req.error);
  });
}

export async function countAllQueued(): Promise<number> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).count();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function removeQueuedPhoto(id: number): Promise<void> {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const req = tx.objectStore(STORE).delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}
