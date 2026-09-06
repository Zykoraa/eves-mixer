// projectStorage.ts - High-Capacity IndexedDB Engine for Eve's Mixer Projects & Audio Blobs
// Solves the browser 5MB localStorage limit and persists multitrack audio recordings, soundpacks, and project files.

import { StoredProjectMeta } from '../types/daw';

const DB_NAME = 'EvesMixerDB_v2';
const DB_VERSION = 1;
const STORE_PROJECTS = 'projects';
const STORE_AUDIO = 'audioBlobs';

export interface StoredProject {
  id: string;
  name: string;
  bpm: number;
  updatedAt: number;
  data: string; // Serialized project JSON
}

export class ProjectStorage {
  private static dbPromise: Promise<IDBDatabase> | null = null;

  private static getDb(): Promise<IDBDatabase> {
    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);

        req.onupgradeneeded = (e) => {
          const db = (e.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(STORE_PROJECTS)) {
            db.createObjectStore(STORE_PROJECTS, { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains(STORE_AUDIO)) {
            db.createObjectStore(STORE_AUDIO, { keyPath: 'id' });
          }
        };

        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    }
    return this.dbPromise;
  }

  // Save Project to IndexedDB
  public static async saveProject(id: string, name: string, bpm: number, data: object): Promise<void> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PROJECTS, 'readwrite');
      const store = tx.objectStore(STORE_PROJECTS);

      const record: StoredProject = {
        id,
        name,
        bpm,
        updatedAt: Date.now(),
        data: JSON.stringify(data),
      };

      const req = store.put(record);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // Load Project by ID
  public static async loadProject(id: string): Promise<any | null> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PROJECTS, 'readonly');
      const store = tx.objectStore(STORE_PROJECTS);
      const req = store.get(id);

      req.onsuccess = () => {
        const record = req.result as StoredProject | undefined;
        if (record && record.data) {
          try {
            resolve(JSON.parse(record.data));
          } catch (e) {
            reject(e);
          }
        } else {
          resolve(null);
        }
      };
      req.onerror = () => reject(req.error);
    });
  }

  // List all stored projects with metadata
  public static async listProjects(): Promise<StoredProjectMeta[]> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PROJECTS, 'readonly');
      const store = tx.objectStore(STORE_PROJECTS);
      const req = store.getAll();

      req.onsuccess = () => {
        const records = (req.result || []) as StoredProject[];
        const metas: StoredProjectMeta[] = records.map((r) => {
          let trackCount = 0;
          let durationBars = 16;
          try {
            const parsed = JSON.parse(r.data);
            trackCount = parsed.tracks?.length || 0;
            durationBars = parsed.totalBars || 16;
          } catch (e) {}

          return {
            id: r.id,
            name: r.name,
            bpm: r.bpm,
            updatedAt: r.updatedAt,
            trackCount,
            durationBars,
          };
        });

        // Sort latest first
        metas.sort((a, b) => b.updatedAt - a.updatedAt);
        resolve(metas);
      };
      req.onerror = () => reject(req.error);
    });
  }

  // Delete project by ID
  public static async deleteProject(id: string): Promise<void> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PROJECTS, 'readwrite');
      const store = tx.objectStore(STORE_PROJECTS);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // Store binary audio recording Blob
  public static async saveAudioBlob(id: string, blob: Blob): Promise<void> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_AUDIO, 'readwrite');
      const store = tx.objectStore(STORE_AUDIO);
      const req = store.put({ id, blob, createdAt: Date.now() });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // Retrieve binary audio recording Blob
  public static async getAudioBlob(id: string): Promise<Blob | null> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_AUDIO, 'readonly');
      const store = tx.objectStore(STORE_AUDIO);
      const req = store.get(id);
      req.onsuccess = () => {
        const res = req.result;
        resolve(res ? res.blob : null);
      };
      req.onerror = () => reject(req.error);
    });
  }
}
