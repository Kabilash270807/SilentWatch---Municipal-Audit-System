import React, { useState } from 'react';
import {
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Info,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CalibrationRecord } from '../types';
import { LocalDbService } from '../services/localDb';

export const Calibration: React.FC = () => {
  const { activeCalibration, setActiveCalibration } = useApp();

  // Wizard state
  const [deviceLabel, setDeviceLabel] = useState('Field WebAudio Sensor Unit 01');
  const [referenceMeter, setReferenceMeter] = useState('Bruel & Kjaer Type 2250 (Class 1 SLM)');
  const [referenceLevel, setReferenceLevel] = useState<number>(60.0);
  const [phoneReading, setPhoneReading] = useState<number>(57.5);
  const [repeatabilityRun1, setRepeatabilityRun1] = useState<number>(57.6);
  const [repeatabilityRun2, setRepeatabilityRun2] = useState<number>(57.4);
  const [isSaved, setIsSaved] = useState(false);

  // Math calculation:
  // Calibration Offset = Reference Level - Phone Estimate
  const calculatedOffset = Number((referenceLevel - phoneReading).toFixed(2));
  const repeatabilityVariance = Number(Math.abs(repeatabilityRun1 - repeatabilityRun2).toFixed(2));

  const handleSaveCalibration = async () => {
    const record: CalibrationRecord = {
      calibration_id: `CAL-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      device_label: deviceLabel,
      reference_instrument: referenceMeter,
      reference_level: referenceLevel,
      phone_level: phoneReading,
      offset_dba: calculatedOffset,
      repeatability_status: repeatabilityVariance <= 0.5 ? 'HIGH_CONSISTENCY (Variance ≤ 0.5 dB)' : 'MODERATE_VARIANCE',
      calibration_status: 'Calibrated Against Reference',
      formula_used: `Offset = Reference (${referenceLevel}) - Phone (${phoneReading}) = ${calculatedOffset >= 0 ? '+' : ''}${calculatedOffset} dB`,
      limitations: 'Single-point acoustic reference verification. Valid within 40-85 dB(A) dynamic range. Does not replace accredited laboratory certification.',
      calibration_date: new Date().toISOString()
    };

    await LocalDbService.saveCalibration(record);
    setActiveCalibration(record);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center space-x-2">
            <Sliders className="w-6 h-6 text-blue-600" />
            <span>Calibration & Data Quality Centre</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Empirical sound-level calibration workflow against physical reference sound-level meters.
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 p-3 rounded-xl text-xs">
          <Info className="w-4 h-4 shrink-0" />
          <span>Consumer microphones require acoustic offset compensation before displaying dB(A).</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calibration Wizard Form */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-5">
          <div className="border-b border-slate-100 dark:border-slate-700 pb-3">
            <h2 className="font-bold text-slate-900 dark:text-white text-base">Guided Offset Calibration Procedure</h2>
            <p className="text-xs text-slate-500">Perform simultaneous comparison reading under stable acoustic conditions</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">Device Label / Station ID</label>
              <input
                type="text"
                value={deviceLabel}
                onChange={(e) => setDeviceLabel(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-medium text-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">Reference Instrument (Class 1 or 2 SLM)</label>
              <input
                type="text"
                value={referenceMeter}
                onChange={(e) => setReferenceMeter(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-medium text-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                Reference Meter Reading: <strong className="text-blue-600">{referenceLevel} dB(A)</strong>
              </label>
              <input
                type="number"
                step="0.1"
                value={referenceLevel}
                onChange={(e) => setReferenceLevel(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono text-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                Device / Phone Raw Reading: <strong className="text-blue-600">{phoneReading} dB(A)</strong>
              </label>
              <input
                type="number"
                step="0.1"
                value={phoneReading}
                onChange={(e) => setPhoneReading(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono text-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">Repeatability Test 1 (Phone dB)</label>
              <input
                type="number"
                step="0.1"
                value={repeatabilityRun1}
                onChange={(e) => setRepeatabilityRun1(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono text-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">Repeatability Test 2 (Phone dB)</label>
              <input
                type="number"
                step="0.1"
                value={repeatabilityRun2}
                onChange={(e) => setRepeatabilityRun2(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Mathematical Formula Preview Box */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-2">
            <span className="font-semibold text-slate-700 dark:text-slate-300 block">Computed Calibration Equation:</span>
            <div className="font-mono bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-blue-600 dark:text-blue-400">
              Offset = Reference ({referenceLevel} dB) − Phone ({phoneReading} dB) = <strong>{calculatedOffset >= 0 ? `+${calculatedOffset}` : calculatedOffset} dB</strong>
            </div>
            <div className="flex items-center space-x-2 text-slate-500">
              <span>Repeatability Variance: {repeatabilityVariance} dB</span>
              <span>•</span>
              <span className={repeatabilityVariance <= 0.5 ? 'text-emerald-600 font-semibold' : 'text-amber-600 font-semibold'}>
                {repeatabilityVariance <= 0.5 ? 'Within High Consistency Range (≤ 0.5 dB)' : 'Moderate Variance Detected'}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={handleSaveCalibration}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Apply & Save Calibration Offset</span>
            </button>

            {isSaved && (
              <span className="text-xs text-emerald-600 font-semibold flex items-center space-x-1 animate-pulse">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Active calibration offset applied to all live modules!</span>
              </span>
            )}
          </div>
        </div>

        {/* Current Active Calibration Status Card */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700 mb-4">
              <h2 className="font-bold text-slate-900 dark:text-white text-base">Active Instrument Profile</h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold">
                {activeCalibration?.calibration_status || 'Not Calibrated'}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 block">Applied Offset</span>
                <span className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1 block">
                  {activeCalibration?.offset_dba !== undefined ? `+${activeCalibration.offset_dba} dB` : '+2.5 dB'}
                </span>
                <span className="text-slate-500 text-[11px]">Corrected dB(A) = Raw Phone dB + Offset</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700">
                <span className="text-slate-500">Device Tag:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{activeCalibration?.device_label || 'WebAudio Station'}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700">
                <span className="text-slate-500">Reference Meter:</span>
                <span className="text-slate-800 dark:text-slate-200">{activeCalibration?.reference_instrument || 'Bruel & Kjaer 2250'}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700">
                <span className="text-slate-500">Last Verified:</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">
                  {activeCalibration ? new Date(activeCalibration.calibration_date).toLocaleDateString() : 'Initial'}
                </span>
              </div>

              <div className="p-3 bg-amber-50/50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                <strong>Standard Notice:</strong> {activeCalibration?.limitations || 'Single-point acoustic offset. Does not constitute Class 1 certified verification.'}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-700 text-xs text-slate-500 flex items-center space-x-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Offsets persist in IndexedDB across browser restarts.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
