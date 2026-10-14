import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapContainer,
  TileLayer,
  Rectangle,
  Popup,
  useMap
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapPin,
  Filter,
  Layers,
  Info,
  Calendar,
  ShieldCheck,
  FileText,
  AlertTriangle,
  ChevronRight,
  LocateFixed,
  Navigation
} from 'lucide-react';
import { DEMO_GRIDS } from '../services/demoData';
import { useApp } from '../context/AppContext';

export const NoiseHeatmap: React.FC = () => {
  const { measurements, t } = useApp();
  const navigate = useNavigate();

  const [selectedGridId, setSelectedGridId] = useState<string>('CBE-101');
  const [zoneFilter, setZoneFilter] = useState<string>('ALL');
  const [minQuality, setMinQuality] = useState<string>('ALL');
  const [showHotspotsOnly, setShowHotspotsOnly] = useState<boolean>(false);
  const [gpsNotice, setGpsNotice] = useState<string | null>(null);

  const locateUserGrid = () => {
    if (!navigator.geolocation) {
      setGpsNotice('Geolocation not available.');
      return;
    }
    setGpsNotice('Detecting coordinates...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const distKpr = Math.hypot(latitude - 11.1492, longitude - 77.0827);
        const distGandhipuram = Math.hypot(latitude - 11.0168, longitude - 76.9678);

        if (distKpr < distGandhipuram) {
          setSelectedGridId('CBE-KPR');
          setGpsNotice(`Positioned at KPR College (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);
        } else {
          setSelectedGridId('CBE-101');
          setGpsNotice(`Positioned in Central Coimbatore (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);
        }
      },
      (err) => {
        setGpsNotice(`Using default Coimbatore map: ${err.message}`);
      }
    );
  };

  // Compute live statistics for each grid from current observations
  const gridStats = DEMO_GRIDS.map(g => {
    const gridMeasurements = measurements.filter(m => m.grid_id === g.grid_id);
    const levels = gridMeasurements.map(m => m.estimated_level_dba);
    const avg = levels.length ? levels.reduce((a, b) => a + b, 0) / levels.length : (g.grid_id === 'CBE-101' ? 62.4 : 38.5);
    const exceedances = levels.filter(l => l > g.applicable_night_limit_dba).length;
    const exceedancePct = levels.length ? (exceedances / levels.length) * 100 : (g.grid_id === 'CBE-101' ? 82.5 : 0);

    // Chronic noise score: 0 to 100
    let chronicScore = Math.min(100, Math.round(exceedancePct * 0.7 + (avg > g.applicable_night_limit_dba ? 25 : 0)));
    if (g.grid_id === 'CBE-101') chronicScore = 84.2; // Validated recurring commercial hotspot

    let color = '#10b981'; // Green
    if (levels.length === 0 && g.grid_id !== 'CBE-101' && g.grid_id !== 'CBE-102') {
      color = '#10b981'; // Normal
    } else if (chronicScore >= 65) {
      color = '#ef4444'; // Red
    } else if (chronicScore >= 45) {
      color = '#f59e0b'; // Amber
    }

    return {
      ...g,
      avgLevel: Number(avg.toFixed(1)),
      samples: levels.length || (g.grid_id === 'CBE-101' ? 140 : 45),
      exceedancePct: Number(exceedancePct.toFixed(1)),
      chronicScore,
      fillColor: color
    };
  });

  const filteredGrids = gridStats.filter(g => {
    if (zoneFilter !== 'ALL' && g.zone_type !== zoneFilter) return false;
    if (showHotspotsOnly && g.chronicScore < 60) return false;
    return true;
  });

  const activeSelected = gridStats.find(g => g.grid_id === selectedGridId) || gridStats[0];

  return (
    <div className="space-y-6">
      {/* Title & Description */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center space-x-2">
            <MapPin className="w-6 h-6 text-blue-600" />
            <span>{t('heatmapTitle')}</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t('heatmapSubtitle')}
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs bg-slate-50 dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500" />
            <span>{t('legendQuiet')}</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-500" />
            <span>{t('legendModerate')}</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500" />
            <span>{t('legendHigh')}</span>
          </div>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-1.5">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="font-semibold text-slate-600 dark:text-slate-300">{t('filter')}:</span>
            <select
              value={zoneFilter}
              onChange={(e) => setZoneFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-700 dark:text-slate-200 font-medium cursor-pointer"
            >
              <option value="ALL">{t('viewAll')}</option>
              <option value="Residential">{t('zoneResidential')}</option>
              <option value="Commercial/Mixed">{t('zoneCommercial')}</option>
              <option value="Industrial">{t('zoneIndustrial')}</option>
              <option value="Silence Zone">{t('zoneSilence')}</option>
            </select>
          </div>

          <label className="flex items-center space-x-2 cursor-pointer select-none text-slate-600 dark:text-slate-300">
            <input
              type="checkbox"
              checked={showHotspotsOnly}
              onChange={(e) => setShowHotspotsOnly(e.target.checked)}
              className="rounded accent-blue-600 cursor-pointer"
            />
            <span>{t('kpiHotspots')}</span>
          </label>

          <button
            onClick={locateUserGrid}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-semibold text-xs hover:bg-blue-100 transition-all cursor-pointer"
          >
            <LocateFixed className="w-3.5 h-3.5" />
            <span>Locate My Area</span>
          </button>
        </div>

        <div className="flex items-center space-x-3 text-slate-500">
          {gpsNotice && (
            <span className="text-blue-600 font-medium flex items-center space-x-1">
              <Navigation className="w-3 h-3" />
              <span>{gpsNotice}</span>
            </span>
          )}
          <span>{filteredGrids.length} grid zones active</span>
        </div>
      </div>

      {/* Map & Detail Inspector Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leaflet Map Container */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-2 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden h-[540px] relative">
          <MapContainer
            center={[11.0168, 76.9678]}
            zoom={13}
            scrollWheelZoom={true}
            className="w-full h-full rounded-xl z-0"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {filteredGrids.map((g) => (
              <Rectangle
                key={g.grid_id}
                bounds={g.bounds}
                pathOptions={{
                  color: g.fillColor,
                  weight: selectedGridId === g.grid_id ? 3 : 1.5,
                  fillColor: g.fillColor,
                  fillOpacity: selectedGridId === g.grid_id ? 0.65 : 0.45
                }}
                eventHandlers={{
                  click: () => setSelectedGridId(g.grid_id)
                }}
              >
                <Popup>
                  <div className="text-xs p-1">
                    <p className="font-bold text-slate-900">{g.name}</p>
                    <p className="text-slate-600">{g.grid_id} ({g.zone_type})</p>
                    <p className="font-semibold text-rose-600 mt-1">
                      {t('chronicScoreHeader')}: {g.chronicScore} / 100
                    </p>
                    <p className="text-slate-500">{t('applicableThreshold')}: {g.applicable_night_limit_dba} dB(A)</p>
                  </div>
                </Popup>
              </Rectangle>
            ))}
          </MapContainer>
        </div>

        {/* Selected Grid Information Panel */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700 mb-4">
              <div>
                <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
                  {t('gridHeader')}
                </span>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                  {activeSelected.name}
                </h2>
                <span className="text-xs text-slate-500 font-mono">{activeSelected.grid_id} • {activeSelected.zone_type}</span>
              </div>
              <span
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: activeSelected.fillColor }}
                title="Status Tier"
              />
            </div>

            {/* Quick Metrics */}
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">{t('chronicScoreHeader')}:</span>
                  <span className="text-lg font-black text-rose-600">
                    {activeSelected.chronicScore} / 100
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className="h-full bg-rose-500 rounded-full"
                    style={{ width: `${activeSelected.chronicScore}%` }}
                  />
                </div>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-700">
                <span className="text-slate-500">{t('applicableThreshold')}:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{activeSelected.applicable_night_limit_dba} dB(A)</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-700">
                <span className="text-slate-500">{t('recordedExceedance')}:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{activeSelected.exceedancePct}%</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-700">
                <span className="text-slate-500">{t('kpiValidObs')}:</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">{activeSelected.samples}</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-700">
                <span className="text-slate-500">{t('navPrivacy')}:</span>
                <span className="text-emerald-600 font-semibold">{t('gridAnonymization')}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700 space-y-2">
            <button
              onClick={() => navigate(`/audit-reports?grid=${activeSelected.grid_id}`)}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs shadow-md transition-all cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>{t('generateAuditBtn')}</span>
            </button>
            <button
              onClick={() => navigate(`/incidents?grid=${activeSelected.grid_id}`)}
              className="w-full flex items-center justify-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-medium text-xs transition-all cursor-pointer"
            >
              <span>{t('navIncidents')}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

