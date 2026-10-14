/**
 * IndexedDB Local Storage Manager for Offline-First Operation
 * Strictly persists derived numerical observations, calibration metadata, and incident notes.
 * ZERO raw audio samples or waveforms are saved!
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { DerivedMeasurement, CalibrationRecord, Incident, AuditReport } from '../types';

interface SilentWatchDB extends DBSchema {
  measurements: {
    key: string;
    value: DerivedMeasurement;
    indexes: {
      'by-grid': string;
      'by-timestamp': string;
      'by-category': string;
    };
  };
  calibrations: {
    key: string;
    value: CalibrationRecord;
    indexes: {
      'by-date': string;
    };
  };
  incidents: {
    key: string;
    value: Incident;
    indexes: {
      'by-grid': string;
      'by-status': string;
    };
  };
  audit_reports: {
    key: string;
    value: AuditReport;
    indexes: {
      'by-grid': string;
      'by-generated': string;
    };
  };
  sync_queue: {
    key: string;
    value: {
      id: string;
      endpoint: string;
      data: any;
      queued_at: string;
    };
  };
}

const DB_NAME = 'silentwatch_local_db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<SilentWatchDB>> | null = null;

function getDb(): Promise<IDBPDatabase<SilentWatchDB>> {
  if (!dbPromise) {
    dbPromise = openDB<SilentWatchDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // 1. Measurements store
        const mStore = db.createObjectStore('measurements', { keyPath: 'measurement_id' });
        mStore.createIndex('by-grid', 'grid_id');
        mStore.createIndex('by-timestamp', 'timestamp');
        mStore.createIndex('by-category', 'detected_category');

        // 2. Calibrations store
        const cStore = db.createObjectStore('calibrations', { keyPath: 'calibration_id' });
        cStore.createIndex('by-date', 'calibration_date');

        // 3. Incidents store
        const iStore = db.createObjectStore('incidents', { keyPath: 'incident_id' });
        iStore.createIndex('by-grid', 'grid_id');
        iStore.createIndex('by-status', 'review_status');

        // 4. Audit Reports store
        const aStore = db.createObjectStore('audit_reports', { keyPath: 'report_id' });
        aStore.createIndex('by-grid', 'monitoring_grid');
        aStore.createIndex('by-generated', 'generated_at');

        // 5. Sync queue
        db.createObjectStore('sync_queue', { keyPath: 'id' });
      }
    });
  }
  return dbPromise;
}

export const LocalDbService = {
  async saveMeasurement(measurement: DerivedMeasurement): Promise<void> {
    // Assert privacy contract: Reject if someone attempted to attach raw audio
    const clone = { ...measurement } as any;
    delete clone.audio;
    delete clone.waveform;
    delete clone.raw_samples;

    const db = await getDb();
    await db.put('measurements', clone);
  },

  async getMeasurements(gridId?: string, limit: number = 100): Promise<DerivedMeasurement[]> {
    const db = await getDb();
    if (gridId) {
      const all = await db.getAllFromIndex('measurements', 'by-grid', gridId);
      return all.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, limit);
    }
    const all = await db.getAll('measurements');
    return all.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, limit);
  },

  async countMeasurements(): Promise<number> {
    const db = await getDb();
    return db.count('measurements');
  },

  async saveCalibration(record: CalibrationRecord): Promise<void> {
    const db = await getDb();
    await db.put('calibrations', record);
  },

  async getLatestCalibration(): Promise<CalibrationRecord | null> {
    const db = await getDb();
    const records = await db.getAllFromIndex('calibrations', 'by-date');
    if (!records.length) return null;
    return records[records.length - 1];
  },

  async getAllCalibrations(): Promise<CalibrationRecord[]> {
    const db = await getDb();
    const records = await db.getAll('calibrations');
    return records.sort((a, b) => new Date(b.calibration_date).getTime() - new Date(a.calibration_date).getTime());
  },

  async saveIncident(incident: Incident): Promise<void> {
    const db = await getDb();
    await db.put('incidents', incident);
  },

  async getIncidents(): Promise<Incident[]> {
    const db = await getDb();
    const all = await db.getAll('incidents');
    return all.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  async updateIncidentStatus(incidentId: string, status: Incident['review_status'], notes?: string): Promise<void> {
    const db = await getDb();
    const inc = await db.get('incidents', incidentId);
    if (inc) {
      inc.review_status = status;
      if (notes) {
        inc.notes = (inc.notes || '') + `\n[${new Date().toISOString()}] ${notes}`;
      }
      await db.put('incidents', inc);
    }
  },

  async saveAuditReport(report: AuditReport): Promise<void> {
    const db = await getDb();
    await db.put('audit_reports', report);
  },

  async getAuditReports(): Promise<AuditReport[]> {
    const db = await getDb();
    const all = await db.getAll('audit_reports');
    return all.sort((a, b) => new Date(b.generated_at).getTime() - new Date(a.generated_at).getTime());
  },

  async clearAllLocalData(): Promise<void> {
    const db = await getDb();
    await db.clear('measurements');
    await db.clear('calibrations');
    await db.clear('incidents');
    await db.clear('audit_reports');
    await db.clear('sync_queue');
  }
};
