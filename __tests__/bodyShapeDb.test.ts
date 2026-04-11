import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  addBodyShapeRecord,
  getBodyShapeRecords,
  deleteBodyShapeRecord,
  BodyShapeRecord
} from '../src/lib/bodyShapeDb';

// Mock IDB implementation for testing
vi.mock('idb', () => {
  const mockStore = new Map<string, any>();
  return {
    openDB: vi.fn().mockResolvedValue({
      put: vi.fn((storeName, val) => {
        mockStore.set(val.id, val);
        return Promise.resolve();
      }),
      getAllFromIndex: vi.fn(() => {
        // Return sorted by date
        const arr = Array.from(mockStore.values());
        return Promise.resolve(arr.sort((a, b) => a.date.localeCompare(b.date)));
      }),
      delete: vi.fn((storeName, key) => {
        mockStore.delete(key);
        return Promise.resolve();
      }),
      get: vi.fn((storeName, key) => {
        return Promise.resolve(mockStore.get(key));
      }),
      objectStoreNames: {
        contains: vi.fn().mockReturnValue(true)
      }
    })
  };
});

describe('BodyShapeDb', () => {
  beforeEach(() => {
    // We would clear mock store here if we exported it
  });

  it('should add a body shape record', async () => {
    const record: BodyShapeRecord = {
      id: 'test-id-1',
      date: '2026-04-11',
      description: 'First test',
      photos: ['data:image/jpeg;base64,test'],
      createdAt: Date.now()
    };
    
    await expect(addBodyShapeRecord(record)).resolves.not.toThrow();
  });

  it('should retrieve records in reverse chronological order', async () => {
    // Add multiple records
    await addBodyShapeRecord({
      id: 'test-id-2',
      date: '2026-04-10',
      description: 'Older test',
      photos: [],
      createdAt: Date.now()
    });
    
    await addBodyShapeRecord({
      id: 'test-id-3',
      date: '2026-04-12',
      description: 'Newer test',
      photos: [],
      createdAt: Date.now()
    });

    const records = await getBodyShapeRecords();
    expect(records.length).toBeGreaterThan(0);
    // getBodyShapeRecords calls reverse() internally on the sorted array
    expect(records[0].date).toBe('2026-04-12');
  });

  it('should delete a record by id', async () => {
    await deleteBodyShapeRecord('test-id-1');
    const records = await getBodyShapeRecords();
    expect(records.find(r => r.id === 'test-id-1')).toBeUndefined();
  });
});
