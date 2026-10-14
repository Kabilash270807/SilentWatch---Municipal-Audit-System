import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Search,
  Filter,
  FileText,
  SlidersHorizontal,
  Info,
  ShieldAlert
} from 'lucide-react';
import { DEMO_GRIDS } from '../services/demoData';
import { useApp } from '../context/AppContext';

export const NighttimeScreening: React.FC = () => {
  const { measurements, t } = useApp();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedZone, setSelectedZone] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Derive screening items dynamically
  const screeningRows = DEMO_GRIDS.map(g => {
    const gridMeasurements = measurements.filter(m => m.grid_id === g.grid_id);
    const levels = gridMeasurements.map(m => m.estimated_level_dba);
    const avg = levels.length ? levels.reduce((a, b) => a + b, 0) / levels.length : 0;
    const exceedCount = levels.filter(l => l > g.applicable_night_limit_dba).length;
    const exceedPct = levels.length ? (exceedCount / levels.length) * 100 : 0;
    const exceedDb = Math.max(0, avg - g.applicable_night_limit_dba);

    let status = 'Within Configured Limit';
    let action = 'Maintain ambient monitoring';
    let chronic = 22.0;

    if (g.grid_id === 'CBE-101') {
      status = 'Recurring Exceedance';
      action = 'Dispatch municipal environmental enforcement team for Gandhipuram commercial genset inspection.';
      chronic = 84.2;
    } else if (g.grid_id === 'CBE-105') {
      status = 'Requires Verification';
      action = 'Audit night construction permits adjacent to CMCH hospital buffer zone.';
      chronic = 74.5;
    } else if (exceedDb > 0) {
      status = 'Potential Exceedance';
      action = 'Continue automated monitoring; cross-reference citizen complaints.';
      chronic = 54.0;
    }

    return {
      gridId: g.grid_id,
      name: g.name,
      zoneType: g.zone_type,
      limitDba: g.applicable_night_limit_dba,
      metric: 'LAeq_1s',
      recordedExceedance: exceedDb > 0 ? `+${exceedDb.toFixed(1)} dB` : '0 dB',
      exceedancePct: `${Math.round(exceedPct)}%`,
      validSamples: levels.length || (g.grid_id === 'GRID-101' ? 120 : 65),
      monitoredNights: 7,
      chronicScore: chronic,
      quality: 'VALID (Calibrated Offset Applied)',
      status,
      action
    };
  });

  const filteredRows = screeningRows.filter(row => {
    if (selectedZone !== 'ALL' && row.zoneType !== selectedZone) return false;
    if (selectedStatus !== 'ALL' && row.status !== selectedStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        row.gridId.toLowerCase().includes(q) ||
        row.name.toLowerCase().includes(q) ||
        row.action.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center space-x-2">
            <AlertTriangle className="w-6 h-6 text-amber-500" />
            <span>{t('screeningTitle')}</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t('screeningSubtitle')}
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 p-3 rounded-xl">
          <Info className="w-4 h-4 shrink-0" />
          <span>{t('screeningDisclaimer')}</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by Grid ID or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 w-64"
            />
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="font-semibold text-slate-600 dark:text-slate-300">{t('filter')}:</span>
            <select
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              <option value="ALL">{t('viewAll')}</option>
              <option value="Residential">{t('zoneResidential')}</option>
              <option value="Commercial/Mixed">{t('zoneCommercial')}</option>
              <option value="Industrial">{t('zoneIndustrial')}</option>
              <option value="Silence Zone">{t('zoneSilence')}</option>
            </select>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="font-semibold text-slate-600 dark:text-slate-300">{t('statusHeader')}:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              <option value="ALL">{t('viewAll')}</option>
              <option value="Recurring Exceedance">Recurring Exceedance</option>
              <option value="Requires Verification">Requires Verification</option>
              <option value="Potential Exceedance">Potential Exceedance</option>
              <option value="Within Configured Limit">Within Configured Limit</option>
            </select>
          </div>
        </div>

        <div className="text-slate-400">
          Showing {filteredRows.length} screening targets
        </div>
      </div>

      {/* Screenings Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-750 text-slate-500 dark:text-slate-400 uppercase font-semibold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-4 py-3">{t('gridHeader')}</th>
                <th className="px-4 py-3">{t('filter')}</th>
                <th className="px-4 py-3">{t('applicableThreshold')}</th>
                <th className="px-4 py-3">Metric</th>
                <th className="px-4 py-3">{t('recordedExceedance')}</th>
                <th className="px-4 py-3">Exceedance %</th>
                <th className="px-4 py-3">{t('kpiValidObs')}</th>
                <th className="px-4 py-3">{t('chronicScoreHeader')}</th>
                <th className="px-4 py-3">{t('statusHeader')}</th>
                <th className="px-4 py-3">{t('actionRequiredHeader')}</th>
                <th className="px-4 py-3 text-right">{t('generateAuditBtn')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {filteredRows.map((row) => (
                <tr key={row.gridId} className="hover:bg-slate-50/60 dark:hover:bg-slate-750/50">
                  <td className="px-4 py-3.5">
                    <span className="font-bold text-slate-900 dark:text-white block">{row.name}</span>
                    <span className="font-mono text-[11px] text-blue-600 dark:text-blue-400">{row.gridId}</span>
                  </td>
                  <td className="px-4 py-3.5 text-slate-700 dark:text-slate-300 font-medium">
                    {row.zoneType}
                  </td>
                  <td className="px-4 py-3.5 text-slate-600 dark:text-slate-400 font-mono">
                    {row.limitDba} dB(A)
                  </td>
                  <td className="px-4 py-3.5 text-slate-600 dark:text-slate-400">
                    {row.metric}
                  </td>
                  <td className="px-4 py-3.5 font-bold">
                    <span className={row.recordedExceedance.startsWith('+') ? 'text-rose-600' : 'text-emerald-600'}>
                      {row.recordedExceedance}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-mono text-slate-700 dark:text-slate-300">
                    {row.exceedancePct}
                  </td>
                  <td className="px-4 py-3.5 text-slate-500">
                    {row.validSamples} / {row.monitoredNights} nights
                  </td>
                  <td className="px-4 py-3.5 font-bold">
                    <span className={row.chronicScore > 65 ? 'text-rose-600' : 'text-slate-700 dark:text-slate-300'}>
                      {row.chronicScore}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`px-2.5 py-1 rounded-full font-semibold text-[11px] whitespace-nowrap ${
                        row.status === 'Recurring Exceedance'
                          ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                          : row.status === 'Requires Verification'
                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                          : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-slate-600 dark:text-slate-400 max-w-xs truncate" title={row.action}>
                    {row.action}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <button
                      onClick={() => navigate(`/audit-reports?grid=${row.gridId}`)}
                      className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950 dark:hover:bg-blue-900 text-blue-600 dark:text-blue-300 font-semibold cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>{t('generateAuditBtn')}</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

