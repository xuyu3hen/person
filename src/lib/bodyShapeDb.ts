import { openDB, DBSchema, IDBPDatabase } from 'idb';

export interface BodyShapeRecord {
  id: string;
  date: string;
  description: string;
  photos: string[]; // base64 strings
  createdAt: number;
}

interface BodyShapeDB extends DBSchema {
  'body-shapes': {
    key: string;
    value: BodyShapeRecord;
    indexes: { 'by-date': string };
  };
}

let dbPromise: Promise<IDBPDatabase<BodyShapeDB>> | null = null;

function getDB() {
  if (typeof window === 'undefined') return null;
  if (!dbPromise) {
    dbPromise = openDB<BodyShapeDB>('journal-body-shape', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('body-shapes')) {
          const store = db.createObjectStore('body-shapes', { keyPath: 'id' });
          store.createIndex('by-date', 'date');
        }
      },
    });
  }
  return dbPromise;
}

export async function addBodyShapeRecord(record: BodyShapeRecord): Promise<void> {
  const db = await getDB();
  if (!db) return;
  await db.put('body-shapes', record);
}

export async function getBodyShapeRecords(): Promise<BodyShapeRecord[]> {
  const db = await getDB();
  if (!db) return [];
  // Get all records, sorted by date (idb index uses ascending by default)
  const records = await db.getAllFromIndex('body-shapes', 'by-date');
  // We want descending (newest first) for timeline view
  return records.reverse();
}

export async function deleteBodyShapeRecord(id: string): Promise<void> {
  const db = await getDB();
  if (!db) return;
  await db.delete('body-shapes', id);
}

export async function getBodyShapeRecordById(id: string): Promise<BodyShapeRecord | undefined> {
  const db = await getDB();
  if (!db) return undefined;
  return db.get('body-shapes', id);
}
