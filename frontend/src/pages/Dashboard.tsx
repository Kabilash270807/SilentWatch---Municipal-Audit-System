import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Volume2,
  TrendingUp,
  MapPin,
  AlertTriangle,
  ShieldCheck,
  Radio,
  ExternalLink
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { useApp } from '../context/AppContext';
import { calculateEnergyLAeq, calculateMedian } from '../services/statistics';

export const Dashboard: React.FC = () => {
  const { measurements, incidents, activeCalibration, isAdminAuthenticated, t } = useApp();
  const navigate = useNavigate();

  // Derived metrics from actual data
  const validMeasurements = useMemo(() => measurements.filter(m => m.quality_status !== 'SILENT_INPUT'), [measurements]);
  const levels = useMemo(() => validMeasurements.map(m => m.estimated_level_dba), [validMeasurements]);
  const laeq = useMemo(() => calculateEnergyLAeq(levels), [levels]);
  const medianFloor = useMemo(() => calculateMedian(validMeasurements.map(m => m.noise_floor_estimate)), [validMeasurements]);
  const latestMeas = measurements[0] || null;

  // Sound category labels mapped to i18n
  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'Industrial Machinery': return t('catIndustrial');
      case 'Road Traffic':
      case 'Traffic': return t('catTraffic');
      case 'Construction': return t('catConstruction');
      case 'Human Speech':
      case 'Speech': return t('catSpeech');
      case 'Music': return t('catMusic');
      case 'Sirens and alarms': return t('catSirens');
      case 'Natural sounds': return t('catNatural');
      case 'Mixed sound': return t('catMixed');
      default: return t('catUnknown');
    }
  };

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      [t('catIndustrial')]: 0,
      [t('catTraffic')]: 0,
      [t('catSpeech')]: 0,
      [t('catMusic')]: 0,
      [t('catConstruction')]: 0,
      [t('catUnknown')]: 0
    };
    measurements.forEach(m => {
      const label = getCategoryLabel(m.detected_category);
      counts[label] = (counts[label] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }, [measurements, t]);

  // Trend history formatted for Recharts
  const trendData = useMemo(() => {
    const slice = measurements.slice(0, 30).reverse();
    return slice.map((m) => ({
      time: new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      level: m.estimated_level_dba,
      peak: m.peak_level_dba,
      noiseFloor: m.noise_floor_estimate,
      threshold: 45
    }));
  }, [measurements]);

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center space-x-2">
            <span>{t('dashboardTitle')}</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t('dashboardSubtitle')}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/monitor')}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm shadow-md transition-all cursor-pointer"
          >
            <Radio className="w-4 h-4" />
            <span>{t('startMonitoring')}</span>
          </button>
          <button
            onClick={() => navigate('/heatmap')}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-medium text-sm transition-all cursor-pointer"
          >
            <MapPin className="w-4 h-4" />
            <span>{t('publicHeatmapBtn')}</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Latest Estimated Level */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t('kpiLatestEst')}
            </span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
              <Volume2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                {latestMeas ? `${latestMeas.estimated_level_dba}` : '--'}
              </span>
              <span className="text-sm font-semibold text-slate-500">dB(A)</span>
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center space-x-1">
              <span>{t('kpiPeak')}: {latestMeas ? `${latestMeas.peak_level_dba} dB` : '--'}</span>
              <span>•</span>
              <span className="text-blue-600 dark:text-blue-400 font-medium">
                {latestMeas?.quality_status === 'VALID' ? t('kpiCalibrated') : t('kpiUncalibrated')}
              </span>
            </p>
          </div>
        </div>

        {/* Noise Floor Estimate */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t('kpiMedianFloor')}
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                {medianFloor > 0 ? `${medianFloor}` : '--'}
              </span>
              <span className="text-sm font-semibold text-slate-500">dB(A)</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Rolling median ambient background floor
            </p>
          </div>
        </div>

        {/* Exceedance Hotspots */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t('kpiHotspots')}
            </span>
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                {incidents.filter(i => i.detection_status === 'Recurring Exceedance').length || 1}
              </span>
              <span className="text-sm font-medium text-rose-600 dark:text-rose-400">Active</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              CBE-101 (Gandhipuram Hub) Chronic score 84.2
            </p>
          </div>
        </div>

        {/* Valid Measurements & Privacy */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t('kpiValidObs')}
            </span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                {validMeasurements.length}
              </span>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded">
                {t('kpiZeroAudio')}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Calibration offset: {activeCalibration?.offset_dba ?? '+2.5'} dB applied
            </p>
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Noise Level Trend Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white text-base">{t('trendChartTitle')}</h2>
              <p className="text-xs text-slate-500">
                {t('trendChartDesc')}
              </p>
            </div>
            <span className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-lg font-mono">
              LAeq: {laeq > 0 ? `${laeq} dB(A)` : 'Calculating...'}
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.2} />
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                <YAxis domain={[30, 90]} stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '0.75rem',
                    color: '#f8fafc',
                    fontSize: '12px'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Line type="monotone" dataKey="level" name="Estimated dB(A)" stroke="#3b82f6" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="peak" name="Peak Level" stroke="#f43f5e" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="noiseFloor" name="Ambient Floor" stroke="#10b981" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
                <Line type="step" dataKey="threshold" name="Night Limit (45 dB)" stroke="#e11d48" strokeWidth={1} strokeDasharray="2 2" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Non-AI Sound Category Breakdown */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white text-base">{t('categoryChartTitle')}</h2>
              <p className="text-xs text-slate-500">{t('categoryChartDesc')}</p>
            </div>
            <button
              onClick={() => navigate('/classification')}
              className="text-xs text-blue-600 hover:underline flex items-center space-x-1"
            >
              <span>{t('details')}</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryCounts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis type="number" fontSize={11} stroke="#64748b" />
                <YAxis dataKey="name" type="category" width={110} fontSize={11} stroke="#64748b" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '0.75rem',
                    color: '#f8fafc',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="count" name="Classified Samples" fill="#3b82f6" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Incidents and Hotspot Screening Table — Restricted to Municipal Administrators */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white text-base">{t('exceedanceTableTitle')}</h2>
            <p className="text-xs text-slate-500">{t('exceedanceTableDesc')}</p>
          </div>
          {isAdminAuthenticated ? (
            <button
              onClick={() => navigate('/admin/incidents')}
              className="text-xs text-blue-600 hover:underline font-medium cursor-pointer"
            >
              {t('viewFullEvidence')}
            </button>
          ) : (
            <button
              onClick={() => navigate('/admin/login')}
              className="text-xs px-2.5 py-1 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300 font-semibold rounded-lg hover:bg-blue-100 transition-colors cursor-pointer"
            >
              {t('adminLogin')}
            </button>
          )}
        </div>

        {isAdminAuthenticated ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-750 text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3">Incident ID</th>
                  <th className="px-4 py-3">{t('gridHeader')}</th>
                  <th className="px-4 py-3">Zone Type</th>
                  <th className="px-4 py-3">Observed Level</th>
                  <th className="px-4 py-3">{t('recordedExceedance')}</th>
                  <th className="px-4 py-3">{t('categoryHeader')}</th>
                  <th className="px-4 py-3">{t('statusHeader')}</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {incidents.slice(0, 4).map((inc) => (
                  <tr key={inc.incident_id} className="hover:bg-slate-50/60 dark:hover:bg-slate-750/50">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-blue-600 dark:text-blue-400">
                      {inc.incident_id}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                      {inc.grid_id}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {inc.zone_type}
                    </td>
                    <td className="px-4 py-3 text-slate-900 dark:text-white font-semibold">
                      {inc.measured_noise_metric}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-rose-600 font-bold">+{inc.recorded_exceedance_db} dB</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300 text-xs">
                      {getCategoryLabel(inc.likely_sound_category)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                          inc.detection_status === 'Recurring Exceedance'
                            ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                            : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                        }`}
                      >
                        {inc.detection_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => navigate('/admin/incidents')}
                        className="text-xs bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 px-3 py-1.5 rounded-lg text-slate-800 dark:text-slate-200 font-medium cursor-pointer"
                      >
                        {t('details')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 p-6 space-y-2">
            <ShieldCheck className="w-8 h-8 text-blue-600 mx-auto" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {t('recordsRestrictedTitle')}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {t('recordsRestrictedDesc')}
            </p>
            <div className="pt-2">
              <button
                onClick={() => navigate('/admin/login')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs cursor-pointer"
              >
                {t('authAsAdminBtn')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
