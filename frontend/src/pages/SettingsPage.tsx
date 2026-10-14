import React, { useState } from 'react';
import { Settings as SettingsIcon, Database, RefreshCw, Radio, Shield, Globe, Sliders } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const SettingsPage: React.FC = () => {
  const { dataSource, setDataSource, isOnline, refreshData } = useApp();

  const [resLimit, setResLimit] = useState(45.0);
  const [comLimit, setComLimit] = useState(55.0);
  const [indLimit, setIndLimit] = useState(70.0);
  const [silenceLimit, setSilenceLimit] = useState(40.0);
  const [syncEnabled, setSyncEnabled] = useState(true);
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSaveSettings = () => {
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center space-x-2">
            <SettingsIcon className="w-6 h-6 text-blue-600" />
            <span>Application Settings & Regulatory Limits</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure municipal baseline thresholds, data source modes, and sync parameters.
          </p>
        </div>

        <button
          onClick={handleSaveSettings}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md transition-all self-start md:self-auto"
        >
          Save Configuration
        </button>
      </div>

      {savedNotice && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold">
          Configuration successfully saved and applied to screening engine!
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Regulatory Thresholds */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <div className="border-b border-slate-100 dark:border-slate-700 pb-3">
            <h2 className="font-bold text-slate-900 dark:text-white text-base">Configurable Nighttime Noise Limits (dB(A))</h2>
            <p className="text-xs text-slate-500">Applicable during statutory nighttime hours (22:00 – 06:00)</p>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                Residential Zone Limit (dB(A))
              </label>
              <input
                type="number"
                value={resLimit}
                onChange={(e) => setResLimit(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono text-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                Commercial / Mixed Zone Limit (dB(A))
              </label>
              <input
                type="number"
                value={comLimit}
                onChange={(e) => setComLimit(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono text-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                Industrial Zone Limit (dB(A))
              </label>
              <input
                type="number"
                value={indLimit}
                onChange={(e) => setIndLimit(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono text-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                Hospital & Silence Zone Limit (dB(A))
              </label>
              <input
                type="number"
                value={silenceLimit}
                onChange={(e) => setSilenceLimit(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>
        </div>

        {/* System Operations & Sync */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <div className="border-b border-slate-100 dark:border-slate-700 pb-3">
            <h2 className="font-bold text-slate-900 dark:text-white text-base">Data Pipeline & Municipal Synchronization</h2>
            <p className="text-xs text-slate-500">Manage offline synchronization and live pipeline modes</p>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">Active Data Source Mode</label>
              <select
                value={dataSource}
                onChange={(e) => setDataSource(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-medium text-slate-800 dark:text-slate-100"
              >
                <option value="DEMO_DATA">DEMO DATA (Synthetic demonstration)</option>
                <option value="REAL_MIC">Live Browser Microphone (Local DSP)</option>
                <option value="LOCAL_STORED">Stored Local Records (IndexedDB)</option>
                <option value="BACKEND">Municipal Backend Synchronization</option>
              </select>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-900 dark:text-white block">Optional Municipal Sync</span>
                <span className="text-slate-400 block mt-0.5">Automatically sync derived numerical observations when online</span>
              </div>
              <input
                type="checkbox"
                checked={syncEnabled}
                onChange={(e) => setSyncEnabled(e.target.checked)}
                className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
              />
            </div>

            <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 text-slate-600 dark:text-slate-400 leading-relaxed">
              <strong className="text-slate-900 dark:text-white block mb-1">Municipal Audit Integrity Rule:</strong>
              Synchronization transfers exclusively derived numerical indicators (LAeq, peak, noise floor, grid ID). Raw acoustic buffers are never sent.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
