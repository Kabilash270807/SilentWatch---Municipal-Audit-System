import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mic,
  MicOff,
  Play,
  Pause,
  Square,
  Trash2,
  ShieldCheck,
  AlertTriangle,
  Info,
  CheckCircle2,
  Activity,
  Sliders,
  Sparkles,
  Radio,
  FileText,
  MapPin,
  Navigation,
  LocateFixed
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  calculateRMS,
  calculatePeak,
  extractSpectralFeatures,
  estimateDbaLevel
} from '../services/dsp';
import { classifySoundFeatures } from '../services/classifier';
import { DerivedMeasurement } from '../types';
import { translateCategory } from '../i18n/translations';

export const LiveMonitor: React.FC = () => {
  const { addMeasurement, activeCalibration, setDataSource, t, language } = useApp();
  const navigate = useNavigate();

  const [isMonitoring, setIsMonitoring] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Live real-time derived states (no raw audio saved!)
  const [currentDba, setCurrentDba] = useState<number>(38.2);
  const [currentPeak, setCurrentPeak] = useState<number>(42.1);
  const [currentFloor, setCurrentFloor] = useState<number>(35.0);
  const [qualityStatus, setQualityStatus] = useState<string>('UNCALIBRATED');
  const [likelySource, setLikelySource] = useState<string>('Unknown');
  const [ruleConfidence, setRuleConfidence] = useState<number>(0);
  const [sessionCount, setSessionCount] = useState<number>(0);
  const [clippingDetected, setClippingDetected] = useState<boolean>(false);
  const [features, setFeatures] = useState<any>(null);
  // Audio nodes refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const sampleHistoryRef = useRef<number[]>([]);
  const lastSaveTimeRef = useRef<number>(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selectedGridId, setSelectedGridId] = useState<string>('CBE-101');
  const [gpsStatus, setGpsStatus] = useState<string | null>(null);

  // Auto-detect laptop location and map to closest Coimbatore grid
  const detectMyLocation = () => {
    if (!navigator.geolocation) {
      setGpsStatus('Geolocation not supported by browser.');
      return;
    }
    setGpsStatus('Detecting location...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setGpsStatus(`Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}`);

        // Check if closer to KPR College (11.1492, 77.0827)
        const distKpr = Math.hypot(latitude - 11.1492, longitude - 77.0827);
        const distGandhipuram = Math.hypot(latitude - 11.0168, longitude - 76.9678);

        if (distKpr < distGandhipuram) {
          setSelectedGridId('CBE-KPR');
          setGpsStatus('Auto-located: KPR Institute of Engineering & Technology (CBE-KPR)');
        } else {
          setGpsStatus('Auto-located: Coimbatore Urban Region (CBE-101)');
        }
      },
      (err) => {
        setGpsStatus(`Location notice: ${err.message} (Using CBE grid selector)`);
      },
      { timeout: 8000 }
    );
  };

  // Cleanup on unmount
  useEffect(() => {
    detectMyLocation();
    return () => {
      stopMonitoring();
    };
  }, []);

  const startMonitoring = async () => {
    try {
      setErrorMessage(null);
      // Explicit user consent check
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false, // Ensure raw un-attenuated environmental sound
          noiseSuppression: false,
          autoGainControl: false
        }
      });

      setPermissionState('granted');
      mediaStreamRef.current = stream;

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioContextRef.current = ctx;

      const sourceNode = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048; // ~1024 frequency bins
      analyser.smoothingTimeConstant = 0.4;
      sourceNode.connect(analyser);
      analyserRef.current = analyser;

      setIsMonitoring(true);
      setIsPaused(false);
      setDataSource('REAL_MIC');

      // Start processing loop
      processAudioLoop();
    } catch (err: any) {
      console.error('Microphone access failed:', err);
      setPermissionState('denied');
      setErrorMessage(
        err.name === 'NotAllowedError'
          ? 'Microphone permission was denied. Please allow microphone access in your browser settings to perform local noise monitoring.'
          : `Failed to initialize audio: ${err.message}`
      );
    }
  };

  const processAudioLoop = () => {
    if (!analyserRef.current || !audioContextRef.current) return;

    const analyser = analyserRef.current;
    const timeBuffer = new Float32Array(analyser.fftSize);
    const freqBuffer = new Float32Array(analyser.frequencyBinCount);

    analyser.getFloatTimeDomainData(timeBuffer);
    analyser.getFloatFrequencyData(freqBuffer);

    // 1. Digital Signal Processing
    const rms = calculateRMS(timeBuffer);
    const peak = calculatePeak(timeBuffer);
    const isClip = peak >= 0.99;
    setClippingDetected(isClip);

    // Normalized magnitude spectrum (convert from dBFS)
    const magSpectrum = new Float32Array(freqBuffer.length);
    for (let i = 0; i < freqBuffer.length; i++) {
      magSpectrum[i] = Math.pow(10, freqBuffer[i] / 20);
    }

    const feat = extractSpectralFeatures(
      magSpectrum,
      audioContextRef.current.sampleRate || 44100,
      timeBuffer
    );
    setFeatures(feat);

    // 2. Sound-level estimation
    const offset = activeCalibration?.offset_dba ?? 0;
    const { estimatedDba, quality } = estimateDbaLevel(rms, offset);
    setCurrentDba(estimatedDba);
    setCurrentPeak(Number((estimatedDba + (peak * 15)).toFixed(1)));
    setQualityStatus(activeCalibration ? 'VALID' : 'UNCALIBRATED');

    // 3. Rolling noise floor estimate (10th percentile or rolling median)
    sampleHistoryRef.current.push(estimatedDba);
    if (sampleHistoryRef.current.length > 50) sampleHistoryRef.current.shift();
    const sorted = [...sampleHistoryRef.current].sort((a, b) => a - b);
    const floorEst = sorted[Math.floor(sorted.length * 0.2)] || estimatedDba;
    setCurrentFloor(Number(floorEst.toFixed(1)));

    // 4. Non-AI Rule Classification
    const classResult = classifySoundFeatures(feat);
    setLikelySource(classResult.category);
    setRuleConfidence(classResult.ruleScore);

    // Real-time Canvas Oscilloscope (Direct from ephemeral RAM buffer)
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#0f172a'; // Slate-900 background
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.lineWidth = 2;
        ctx.strokeStyle = '#38bdf8'; // Light sky blue
        ctx.beginPath();

        const sliceWidth = canvas.width / timeBuffer.length;
        let x = 0;

        for (let i = 0; i < timeBuffer.length; i++) {
          const v = timeBuffer[i];
          const y = (0.5 + v * 0.5) * canvas.height;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          x += sliceWidth;
        }

        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.stroke();
      }
    }

    // 5. Periodic Derived Observation Persistence (Every 1 second)
    const now = Date.now();
    if (now - lastSaveTimeRef.current >= 1000) {
      lastSaveTimeRef.current = now;
      const observation: DerivedMeasurement = {
        measurement_id: `MEAS-${Math.random().toString(36).substring(2, 9)}`,
        grid_id: selectedGridId, // Local Coimbatore monitored grid
        timestamp: new Date().toISOString(),
        estimated_level_dba: estimatedDba,
        peak_level_dba: Number((estimatedDba + (peak * 15)).toFixed(1)),
        noise_floor_estimate: Number(floorEst.toFixed(1)),
        measurement_metric: activeCalibration ? 'LAeq_1s' : 'relative_estimate_dba',
        quality_status: isClip ? 'CLIPPING' : activeCalibration ? 'VALID' : 'UNCALIBRATED',
        calibration_offset_applied: offset,
        detected_category: classResult.category,
        rule_score: classResult.ruleScore,
        alternative_category: classResult.alternativeCategory,
        supporting_features: feat,
        processing_version: '1.0.0-PROD'
      };

      addMeasurement(observation);
      setSessionCount(prev => prev + 1);
    }

    // Explicitly release temporary buffer references
    // (Float32Arrays will be garbage collected; NO copy is retained)

    animationFrameRef.current = requestAnimationFrame(processAudioLoop);
  };

  const pauseMonitoring = () => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (audioContextRef.current && audioContextRef.current.state === 'running') {
      audioContextRef.current.suspend();
    }
    setIsPaused(true);
  };

  const resumeMonitoring = () => {
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    setIsPaused(false);
    processAudioLoop();
  };

  const stopMonitoring = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setIsMonitoring(false);
    setIsPaused(false);
  };

  const clearSession = () => {
    setSessionCount(0);
    sampleHistoryRef.current = [];
  };

  return (
    <div className="space-y-6">
      {/* Header and Privacy Notice */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center space-x-2">
              <Radio className="w-6 h-6 text-blue-600" />
              <span>{t('navLiveMonitor')}</span>
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Direct browser microphone signal processing with strict local RAM buffer release.
            </p>
          </div>

          <div className="flex items-center space-x-2 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-3 py-2 rounded-xl text-xs text-emerald-800 dark:text-emerald-300">
            <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>{t('zeroAudioDesc')}</span>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="bg-rose-50 dark:bg-rose-950 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 p-4 rounded-xl text-sm flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600" />
          <div>
            <p className="font-semibold">{t('micNoticeTitle')}</p>
            <p className="text-xs mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Main Monitoring Deck */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Real-time Level Dial & Visualizer */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {t('kpiLatestEst')}
                </span>
                {isMonitoring && !isPaused && (
                  <span className="flex h-2.5 w-2.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                )}
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full font-mono font-medium ${
                activeCalibration
                  ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                  : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
              }`}>
                {activeCalibration ? `${t('kpiCalibrated')} (+${activeCalibration.offset_dba} dB)` : t('kpiUncalibrated')}
              </span>
            </div>

            {/* Large Digital Sound Display */}
            <div className="flex flex-col items-center justify-center py-6 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div className="flex items-baseline space-x-2">
                <span className="text-6xl font-black text-slate-900 dark:text-white tracking-tight">
                  {isMonitoring ? currentDba : '--'}
                </span>
                <span className="text-xl font-bold text-slate-500">dB(A)</span>
              </div>
              <p className="text-xs text-slate-400 mt-2 font-mono">
                {activeCalibration ? 'Validated A-weighted Sound Level (LAeq)' : 'Relative Uncalibrated dB Indicator'}
              </p>

              {/* Threshold warning pill */}
              <div className="mt-4">
                {currentDba > 45.0 ? (
                  <span className="inline-flex items-center space-x-1.5 text-xs px-3 py-1 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-semibold border border-rose-300 dark:border-rose-800">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Exceeds Residential Night Limit (45 dB) by +{(currentDba - 45).toFixed(1)} dB</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center space-x-1.5 text-xs px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Within Permissible Night Limit (≤ 45 dB)</span>
                  </span>
                )}
              </div>

              {/* Real-time Oscilloscope (RAM Canvas Stream) */}
              <div className="w-full mt-4 px-4">
                <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                  <span>{t('oscilloTitle')}:</span>
                  <span className="text-emerald-500 font-medium">{t('zeroAudioTitle')}</span>
                </div>
                <div className="h-16 w-full rounded-xl overflow-hidden border border-slate-700 shadow-inner bg-slate-950">
                  <canvas
                    ref={canvasRef}
                    width={500}
                    height={64}
                    className="w-full h-full block"
                  />
                </div>
              </div>

              {/* Coimbatore Station Assignment & Auto-Location */}
              <div className="w-full mt-3 px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center space-x-2">
                  <span className="text-slate-500 font-medium">{t('gridHeader')}:</span>
                  <select
                    value={selectedGridId}
                    onChange={(e) => setSelectedGridId(e.target.value)}
                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-800 dark:text-slate-100 font-semibold cursor-pointer"
                  >
                    <option value="CBE-101">CBE-101 (Gandhipuram Hub)</option>
                    <option value="CBE-102">CBE-102 (RS Puram Residential)</option>
                    <option value="CBE-103">CBE-103 (Peelamedu Tech / Avinashi Rd)</option>
                    <option value="CBE-104">CBE-104 (SIDCO Kurichi Industrial)</option>
                    <option value="CBE-105">CBE-105 (CMCH Hospital Silence Zone)</option>
                    <option value="CBE-KPR">CBE-KPR (KPR Institute of Engineering & Technology)</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={detectMyLocation}
                  className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-semibold text-xs hover:bg-blue-100 transition-all self-start sm:self-auto cursor-pointer"
                >
                  <LocateFixed className="w-3.5 h-3.5" />
                  <span>Locate My Position</span>
                </button>
              </div>

              {gpsStatus && (
                <div className="w-full px-4 mt-1.5 text-[11px] text-blue-600 dark:text-blue-400 flex items-center space-x-1">
                  <Navigation className="w-3 h-3" />
                  <span>{gpsStatus}</span>
                </div>
              )}
            </div>

            {/* Quick Metrics Strip */}
            <div className="grid grid-cols-3 gap-3 mt-4 text-center">
              <div className="p-3 bg-slate-50 dark:bg-slate-750 rounded-xl border border-slate-100 dark:border-slate-700">
                <span className="text-xs text-slate-500 block">{t('kpiPeak')}</span>
                <span className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  {isMonitoring ? `${currentPeak} dB` : '--'}
                </span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-750 rounded-xl border border-slate-100 dark:border-slate-700">
                <span className="text-xs text-slate-500 block">{t('kpiMedianFloor')}</span>
                <span className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  {isMonitoring ? `${currentFloor} dB` : '--'}
                </span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-750 rounded-xl border border-slate-100 dark:border-slate-700">
                <span className="text-xs text-slate-500 block">{t('qualityStatus')}</span>
                <span className={`text-xs font-bold block mt-1 ${clippingDetected ? 'text-rose-500' : 'text-emerald-600'}`}>
                  {clippingDetected ? 'CLIPPING' : qualityStatus}
                </span>
              </div>
            </div>
          </div>

          {/* Action Control Buttons */}
          <div className="mt-6 flex flex-wrap items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
            {!isMonitoring ? (
              <button
                onClick={startMonitoring}
                className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm shadow-md transition-all cursor-pointer"
              >
                <Mic className="w-4 h-4" />
                <span>{t('startMonitoring')}</span>
              </button>
            ) : (
              <>
                {isPaused ? (
                  <button
                    onClick={resumeMonitoring}
                    className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm transition-all cursor-pointer"
                  >
                    <Play className="w-4 h-4" />
                    <span>Resume</span>
                  </button>
                ) : (
                  <button
                    onClick={pauseMonitoring}
                    className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-medium text-sm transition-all cursor-pointer"
                  >
                    <Pause className="w-4 h-4" />
                    <span>Pause</span>
                  </button>
                )}

                <button
                  onClick={stopMonitoring}
                  className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-medium text-sm transition-all cursor-pointer"
                >
                  <Square className="w-4 h-4" />
                  <span>{t('stopMonitoring')}</span>
                </button>
              </>
            )}

            <button
              onClick={clearSession}
              disabled={sessionCount === 0}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs transition-all disabled:opacity-40 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>{t('reset')} ({sessionCount})</span>
            </button>

            {sessionCount > 0 && (
              <button
                onClick={() => navigate(`/audit-reports?grid=${selectedGridId}`)}
                className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow transition-all ml-auto cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>{t('generateAudit')} ({sessionCount} recorded)</span>
              </button>
            )}
          </div>
        </div>

        {/* Live Non-AI Classification Heuristics Box */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-slate-900 dark:text-white text-base flex items-center space-x-2">
                <Activity className="w-4 h-4 text-blue-600" />
                <span>{t('navSoundClassification')}</span>
              </h2>
              <span className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-500 px-2 py-0.5 rounded">
                Rule-Based
              </span>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-800 mb-4">
              <span className="text-xs text-slate-400 block uppercase font-semibold">{t('identifiedCategory')}</span>
              <span className="text-xl font-extrabold text-blue-600 dark:text-blue-400 mt-1 block">
                {isMonitoring ? translateCategory(likelySource, language) : 'Standby'}
              </span>
              <p className="text-xs text-slate-500 mt-1">
                {t('ruleMatchScore')}: {isMonitoring ? `${Math.round(ruleConfidence * 100)}%` : '--'}
              </p>
            </div>


            {/* Extracted Signal Features */}
            <div className="space-y-2.5 text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300 block">{t('supportingCues')}</span>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700">
                <span className="text-slate-500">{t('centroidLabel')}</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">
                  {features ? `${features.spectral_centroid_hz} Hz` : '--'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700">
                <span className="text-slate-500">{t('dominantFreqLabel')}</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">
                  {features ? `${features.dominant_frequency_hz} Hz` : '--'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700">
                <span className="text-slate-500">{t('flatnessLabel')}</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">
                  {features ? features.spectral_flatness : '--'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700">
                <span className="text-slate-500">{t('periodicityLabel')}</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">
                  {features ? features.periodicity_score : '--'}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">{t('peakCountLabel')}</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">
                  {features ? features.peak_count : '--'}
                </span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-blue-50/50 dark:bg-blue-950/30 rounded-xl border border-blue-100 dark:border-blue-900/40 text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed mt-4">
            <Info className="w-3.5 h-3.5 text-blue-500 inline mr-1" />
            Classifications are derived from deterministic acoustic heuristics. They do not employ AI or voice recognition.
          </div>
        </div>
      </div>
    </div>
  );
};
