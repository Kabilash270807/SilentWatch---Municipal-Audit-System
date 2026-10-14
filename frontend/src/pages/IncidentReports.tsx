import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileSpreadsheet,
  Search,
  Filter,
  Download,
  FileText,
  CheckCircle2,
  AlertCircle,
  Eye,
  Edit3
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { exportCsv, exportJson } from '../services/export';
import { Incident } from '../types';
import { translateCategory } from '../i18n/translations';

export const IncidentReports: React.FC = () => {
  const { incidents, refreshData, t, language } = useApp();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(incidents[0] || null);
  const [reviewFilter, setReviewFilter] = useState('ALL');

  const filteredIncidents = incidents.filter(inc => {
    if (reviewFilter !== 'ALL' && inc.review_status !== reviewFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        inc.incident_id.toLowerCase().includes(q) ||
        inc.grid_id.toLowerCase().includes(q) ||
        inc.likely_sound_category.toLowerCase().includes(q) ||
        (inc.notes && inc.notes.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleExportCsv = () => {
    exportCsv('SilentWatch-Incidents-Export.csv', filteredIncidents);
  };

  const handleExportJson = () => {
    exportJson('SilentWatch-Incidents-Export.json', filteredIncidents);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center space-x-2">
            <FileSpreadsheet className="w-6 h-6 text-blue-600" />
            <span>{t('incidentsTitle')}</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t('incidentsSubtitle')}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportCsv}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-semibold cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t('exportCsv')}</span>
          </button>
          <button
            onClick={handleExportJson}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-semibold cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t('exportJson')}</span>
          </button>
        </div>
      </div>

      {/* Main Layout: List & Detail View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Incident List */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-900 dark:text-white text-base">{t('navIncidents')} ({filteredIncidents.length})</h2>
            <select
              value={reviewFilter}
              onChange={(e) => setReviewFilter(e.target.value)}
              className="text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 cursor-pointer"
            >
              <option value="ALL">{t('allReviewStatus')}</option>
              <option value="UNREVIEWED">{t('unreviewed')}</option>
              <option value="UNDER_INVESTIGATION">{t('underInvestigation')}</option>
              <option value="CONFIRMED">{t('confirmedExceedance')}</option>
            </select>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder={t('searchIncidentsPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-xs focus:outline-none"
            />
          </div>

          <div className="space-y-2 max-h-[520px] overflow-y-auto">
            {filteredIncidents.map((inc) => (
              <div
                key={inc.incident_id}
                onClick={() => setSelectedIncident(inc)}
                className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                  selectedIncident?.incident_id === inc.incident_id
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 shadow-sm'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{inc.incident_id}</span>
                  <span className="font-semibold text-rose-600">+{inc.recorded_exceedance_db} dB</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>{inc.grid_id} ({inc.zone_type})</span>
                  <span>{translateCategory(inc.likely_sound_category, language)}</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">{new Date(inc.created_at).toLocaleDateString()}</span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium">
                    {inc.review_status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Incident Detail Card */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
          {selectedIncident ? (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 dark:border-slate-700 gap-2">
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                      Incident {selectedIncident.incident_id}
                    </h2>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-semibold">
                      {selectedIncident.detection_status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Recorded in {selectedIncident.grid_id} • Reporting Period: {selectedIncident.reporting_period}
                  </p>
                </div>

                <button
                  onClick={() => navigate(`/audit-reports?grid=${selectedIncident.grid_id}`)}
                  className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs shadow-md transition-all self-start sm:self-auto cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>{t('generateAuditBtn')}</span>
                </button>
              </div>

              {/* Data Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400 block">{t('kpiLatestEst')}</span>
                  <span className="text-base font-bold text-slate-900 dark:text-white mt-1 block">
                    {selectedIncident.measured_noise_metric}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400 block">{t('recordedExceedance')}</span>
                  <span className="text-base font-bold text-rose-600 mt-1 block">
                    +{selectedIncident.recorded_exceedance_db} dB
                  </span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400 block">{t('chronicScoreHeader')}</span>
                  <span className="text-base font-bold text-slate-900 dark:text-white mt-1 block">
                    {selectedIncident.chronic_noise_score} / 100
                  </span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400 block">{t('statusHeader')}</span>
                  <span className="text-xs font-bold text-blue-600 mt-2 block">
                    {selectedIncident.review_status}
                  </span>
                </div>
              </div>

              {/* Classification & Evidence Details */}
              <div className="space-y-3 text-xs">
                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                  <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    {t('likelySoundSource')}:
                  </span>
                  <p className="text-slate-600 dark:text-slate-400">
                    Source heuristic categorized as <strong className="text-blue-600">{translateCategory(selectedIncident.likely_sound_category, language)}</strong> with a rule confidence score of {Math.round(selectedIncident.rule_score * 100)}%.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                  <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    {t('actionRequiredHeader')}:
                  </span>
                  <p className="text-slate-600 dark:text-slate-400">
                    {selectedIncident.recommended_action}
                  </p>
                </div>

                {selectedIncident.notes && (
                  <div className="p-4 bg-blue-50/40 dark:bg-blue-950/30 rounded-xl border border-blue-100 dark:border-blue-900/50">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      {t('adminNotes')}:
                    </span>
                    <p className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap font-mono text-[11px]">
                      {selectedIncident.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="py-20 text-center text-slate-400 text-xs">
              {t('evidenceDetails')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

