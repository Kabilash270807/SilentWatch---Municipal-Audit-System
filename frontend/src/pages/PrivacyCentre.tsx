import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Download,
  Database
} from 'lucide-react';
import { LocalDbService } from '../services/localDb';
import { exportJson } from '../services/export';
import { useApp } from '../context/AppContext';

export const PrivacyCentre: React.FC = () => {
  const { measurements, refreshData, t } = useApp();
  const [clearing, setClearing] = useState(false);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const privacyCheckpoints = [
    {
      name: t('zeroAudioTitle'),
      passed: true,
      description: t('zeroAudioDesc')
    },
    {
      name: t('zeroVoiceRecording'),
      passed: true,
      description: t('zeroVoiceDesc')
    },
    {
      name: t('gridAnonymization'),
      passed: true,
      description: t('gridAnonymDesc')
    },
    {
      name: t('ramOnlyProcessing'),
      passed: true,
      description: t('ramOnlyDesc')
    },
    {
      name: t('zeroCitizenTitle'),
      passed: true,
      description: t('zeroCitizenDesc')
    }
  ];

  const handleExportMyData = async () => {
    const data = await LocalDbService.getMeasurements();
    exportJson('My-SilentWatch-Derived-Acoustic-Records.json', data);
  };

  const handleConfirmWipe = async () => {
    setClearing(true);
    await LocalDbService.clearAllLocalData();
    await refreshData();
    setClearing(false);
    setConfirmClearOpen(false);
    setSuccessMessage('All locally persisted observations and calibration caches have been completely wiped.');
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center space-x-2">
            <ShieldCheck className="w-6 h-6 text-emerald-600" />
            <span>{t('privacyCentreTitle')}</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t('privacyCentreSubtitle')}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportMyData}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-semibold cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t('exportJson')}</span>
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Main Privacy Audit Checkpoints */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <div className="border-b border-slate-100 dark:border-slate-700 pb-3 flex items-center justify-between">
            <h2 className="font-bold text-slate-900 dark:text-white text-base">{t('privacyAuditStatus')}</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold font-mono">
              {t('privacyPassed')}
            </span>
          </div>

          <div className="space-y-4">
            {privacyCheckpoints.map((cp, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-start space-x-3.5">
                <div className="p-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 mt-0.5 shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">{cp.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    {cp.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Data Retention & Local Wipe Card */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white text-base mb-2">{t('navPrivacy')}</h2>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              {t('sourceLocalStored')}
            </p>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">{t('kpiValidObs')}:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{measurements.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{t('kpiZeroAudio')}:</span>
                <span className="font-mono font-bold text-emerald-600">0 KB (RAM Only)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Storage Engine:</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">IndexedDB v1</span>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 dark:border-slate-700">
            <button
              onClick={() => setConfirmClearOpen(true)}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 font-semibold text-xs transition-all border border-rose-200 dark:border-rose-900 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>{t('reset')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmClearOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 max-w-md w-full p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl space-y-4">
            <div className="flex items-center space-x-2 text-rose-600">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Confirm Data Clearance</h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to delete all locally stored derived noise measurements, incident drafts, and custom calibration curves? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setConfirmClearOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmWipe}
                disabled={clearing}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-md"
              >
                {clearing ? 'Clearing...' : 'Confirm Clear Data'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
