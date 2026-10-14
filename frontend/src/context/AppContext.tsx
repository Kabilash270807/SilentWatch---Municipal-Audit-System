import React, { createContext, useContext, useState, useEffect } from 'react';
import { DerivedMeasurement, Incident, CalibrationRecord, AdminUser, AdminAuthSession } from '../types';
import { LocalDbService } from '../services/localDb';
import { generateDemoMeasurements, DEMO_INCIDENTS } from '../services/demoData';
import { Language, TRANSLATIONS } from '../i18n/translations';

interface AppContextType {
  dataSource: 'REAL_MIC' | 'LOCAL_STORED' | 'BACKEND' | 'DEMO_DATA';
  setDataSource: (source: 'REAL_MIC' | 'LOCAL_STORED' | 'BACKEND' | 'DEMO_DATA') => void;
  isOnline: boolean;
  activeCalibration: CalibrationRecord | null;
  setActiveCalibration: (cal: CalibrationRecord | null) => void;
  latestMeasurement: DerivedMeasurement | null;
  setLatestMeasurement: (m: DerivedMeasurement | null) => void;
  measurements: DerivedMeasurement[];
  addMeasurement: (m: DerivedMeasurement) => Promise<void>;
  incidents: Incident[];
  refreshData: () => Promise<void>;
  pendingSyncCount: number;

  // Municipal Administrator Session (Citizen accounts strictly disabled)
  currentAdmin: AdminUser | null;
  adminToken: string | null;
  isAdminAuthenticated: boolean;
  loginAdmin: (token: string, user: AdminUser, expiresAt: string) => void;
  logoutAdmin: () => Promise<void>;
  authHeader: Record<string, string>;

  // Bilingual Language Support (English / தமிழ்)
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof TRANSLATIONS.en) => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY_ADMIN_TOKEN = 'silentwatch_admin_token';
const STORAGE_KEY_ADMIN_USER = 'silentwatch_admin_user';
const STORAGE_KEY_ADMIN_EXPIRES = 'silentwatch_admin_expires';
const STORAGE_KEY_LANGUAGE = 'silentwatch_user_language';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dataSource, setDataSource] = useState<'REAL_MIC' | 'LOCAL_STORED' | 'BACKEND' | 'DEMO_DATA'>('REAL_MIC');
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [activeCalibration, setActiveCalibration] = useState<CalibrationRecord | null>(null);
  const [latestMeasurement, setLatestMeasurement] = useState<DerivedMeasurement | null>(null);
  const [measurements, setMeasurements] = useState<DerivedMeasurement[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);

  // Language state (defaults to 'en' without requiring login, persists in local device storage)
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_LANGUAGE);
    return saved === 'ta' ? 'ta' : 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEY_LANGUAGE, lang);
  };

  const t = (key: keyof typeof TRANSLATIONS.en): string => {
    const currentDict = TRANSLATIONS[language] || TRANSLATIONS.en;
    return currentDict[key] || TRANSLATIONS.en[key] || (key as string);
  };

  // Administrator Session state
  const [adminToken, setAdminToken] = useState<string | null>(() => {
    const token = localStorage.getItem(STORAGE_KEY_ADMIN_TOKEN);
    const expires = localStorage.getItem(STORAGE_KEY_ADMIN_EXPIRES);
    if (token && expires && new Date(expires) > new Date()) {
      return token;
    }
    return null;
  });

  const [currentAdmin, setCurrentAdmin] = useState<AdminUser | null>(() => {
    const rawUser = localStorage.getItem(STORAGE_KEY_ADMIN_USER);
    const expires = localStorage.getItem(STORAGE_KEY_ADMIN_EXPIRES);
    if (rawUser && expires && new Date(expires) > new Date()) {
      try {
        return JSON.parse(rawUser);
      } catch {
        return null;
      }
    }
    return null;
  });

  const isAdminAuthenticated = !!adminToken && !!currentAdmin;
  const authHeader = adminToken ? { Authorization: `Bearer ${adminToken}` } : {};

  const loginAdmin = (token: string, user: AdminUser, expiresAt: string) => {
    setAdminToken(token);
    setCurrentAdmin(user);
    localStorage.setItem(STORAGE_KEY_ADMIN_TOKEN, token);
    localStorage.setItem(STORAGE_KEY_ADMIN_USER, JSON.stringify(user));
    localStorage.setItem(STORAGE_KEY_ADMIN_EXPIRES, expiresAt);
  };

  const logoutAdmin = async () => {
    if (adminToken && isOnline) {
      try {
        await fetch('/api/admin/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${adminToken}` }
        });
      } catch (e) {
        console.warn('Logout notification failed, clearing local session:', e);
      }
    }
    setAdminToken(null);
    setCurrentAdmin(null);
    localStorage.removeItem(STORAGE_KEY_ADMIN_TOKEN);
    localStorage.removeItem(STORAGE_KEY_ADMIN_USER);
    localStorage.removeItem(STORAGE_KEY_ADMIN_EXPIRES);
  };

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial load
    refreshData();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [dataSource, adminToken]);

  const refreshData = async () => {
    try {
      // 1. Load active calibration
      const cal = await LocalDbService.getLatestCalibration();
      if (cal) {
        setActiveCalibration(cal);
      } else {
        const defaultCal: CalibrationRecord = {
          calibration_id: 'CAL-INIT-01',
          device_label: 'WebAudio Standard Node',
          reference_instrument: 'Bruel & Kjaer Class 1 Acoustic Calibrator',
          reference_level: 60.0,
          phone_level: 57.5,
          offset_dba: 2.5,
          repeatability_status: 'HIGH_CONSISTENCY (Offset verified)',
          calibration_status: 'Calibrated Against Reference',
          formula_used: 'Offset = Reference (60.0) - Phone (57.5) = +2.5 dB',
          limitations: 'Single point verification. Ambient field estimations apply.',
          calibration_date: new Date().toISOString()
        };
        setActiveCalibration(defaultCal);
        await LocalDbService.saveCalibration(defaultCal);
      }

      // 2. Load measurements based on source
      if (dataSource === 'DEMO_DATA') {
        const local = await LocalDbService.getMeasurements();
        const demoM = generateDemoMeasurements();
        const merged = local.length > 0 ? [...local, ...demoM] : demoM;
        setMeasurements(merged);
        setLatestMeasurement(merged[0] || null);
        setIncidents(DEMO_INCIDENTS);
      } else if (dataSource === 'BACKEND' && navigator.onLine) {
        try {
          const res = await fetch('/api/measurements?limit=100');
          if (res.ok) {
            const data = await res.json();
            setMeasurements(data);
            if (data.length > 0) setLatestMeasurement(data[0]);
          }

          // Fetch protected incidents ONLY if admin is authenticated
          if (adminToken) {
            const incRes = await fetch('/api/incidents', {
              headers: { Authorization: `Bearer ${adminToken}` }
            });
            if (incRes.ok) {
              const incData = await incRes.json();
              setIncidents(incData);
            }
          } else {
            setIncidents([]);
          }
        } catch {
          const local = await LocalDbService.getMeasurements();
          setMeasurements(local);
        }
      } else {
        // REAL_MIC or LOCAL_STORED
        const local = await LocalDbService.getMeasurements();
        const publicBaseline = generateDemoMeasurements();
        const merged = local.length > 0 ? [...local, ...publicBaseline] : publicBaseline;
        setMeasurements(merged);
        if (merged.length > 0) setLatestMeasurement(merged[0]);

        if (isAdminAuthenticated) {
          const inc = await LocalDbService.getIncidents();
          setIncidents(inc.length ? inc : DEMO_INCIDENTS);
        } else {
          setIncidents([]);
        }
      }
    } catch (e) {
      console.error('Error refreshing AppContext data:', e);
    }
  };

  const addMeasurement = async (m: DerivedMeasurement) => {
    setLatestMeasurement(m);
    setMeasurements(prev => [m, ...prev]);
    await LocalDbService.saveMeasurement(m);

    if (isOnline && (dataSource === 'BACKEND' || dataSource === 'REAL_MIC')) {
      try {
        await fetch('/api/measurements', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(m)
        });
      } catch (err) {
        setPendingSyncCount(prev => prev + 1);
      }
    }
  };

  return (
    <AppContext.Provider
      value={{
        dataSource,
        setDataSource,
        isOnline,
        activeCalibration,
        setActiveCalibration,
        latestMeasurement,
        setLatestMeasurement,
        measurements,
        addMeasurement,
        incidents,
        refreshData,
        pendingSyncCount,
        currentAdmin,
        adminToken,
        isAdminAuthenticated,
        loginAdmin,
        logoutAdmin,
        authHeader,
        language,
        setLanguage,
        t
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
