import React, { useState, useRef, useEffect } from 'react';
import {
  Activity,
  Mic,
  MicOff,
  RotateCcw,
  ShieldCheck,
  AlertTriangle,
  Radio,
  Sliders,
  CheckCircle2,
  HelpCircle,
  Clock,
  MapPin,
  HardHat,
  Car,
  Factory,
  MessageSquare,
  Music,
  Bell,
  Trees,
  Layers
} from 'lucide-react';
import { classifySoundFeatures, StructuredClassificationResult } from '../services/classifier';
import { extractSpectralFeatures } from '../services/dsp';
import { SupportingFeatures, SoundCategory } from '../types';
import { DEMO_GRIDS } from '../services/demoData';
import { useApp } from '../context/AppContext';
import { translateCategory } from '../i18n/translations';

export const SoundClassification: React.FC = () => {
  const { t, language } = useApp();
  // Mode: Live Microphone vs Interactive Heuristic Sandbox
  const [activeTab, setActiveTab] = useState<'live' | 'sandbox'>('live');

  // Live Microphone States
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [micPermission, setMicPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [micErrorMessage, setMicErrorMessage] = useState<string | null>(null);

  // Live result & real-time feature display
  const [liveResult, setLiveResult] = useState<StructuredClassificationResult | null>(null);
  const [liveFeatures, setLiveFeatures] = useState<SupportingFeatures | null>(null);
  const [recentHistory, setRecentHistory] = useState<StructuredClassificationResult[]>([]);

  // Selected monitoring grid for metadata attribution
  const [selectedGridId, setSelectedGridId] = useState<string>('CBE-KPR');

  // Audio Context & Analyser references
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastClassificationTimeRef = useRef<number>(0);

  // Sandbox state
  const [sandboxRms, setSandboxRms] = useState<number>(0.045);
  const [sandboxCentroid, setSandboxCentroid] = useState<number>(450);
  const [sandboxBandwidth, setSandboxBandwidth] = useState<number>(850);
  const [sandboxFlatness, setSandboxFlatness] = useState<number>(0.22);
  const [sandboxDominantFreq, setSandboxDominantFreq] = useState<number>(120);
  const [sandboxPeriodicity, setSandboxPeriodicity] = useState<number>(0.85);
  const [sandboxPeakCount, setSandboxPeakCount] = useState<number>(4);
  const [sandboxZcr, setSandboxZcr] = useState<number>(0.08);

  const sandboxFeatures: SupportingFeatures = {
    rms_energy: sandboxRms,
    spectral_centroid_hz: sandboxCentroid,
    spectral_bandwidth_hz: sandboxBandwidth,
    spectral_flatness: sandboxFlatness,
    dominant_frequency_hz: sandboxDominantFreq,
    periodicity_score: sandboxPeriodicity,
    peak_count: sandboxPeakCount,
    zero_crossing_rate: sandboxZcr
  };

  const sandboxResult = classifySoundFeatures(sandboxFeatures, selectedGridId);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopSoundAnalysis();
    };
  }, []);

  const startSoundAnalysis = async () => {
    try {
      setMicErrorMessage(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        }
      });

      setMicPermission('granted');
      mediaStreamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.35;
      source.connect(analyser);
      analyserRef.current = analyser;

      setIsRecording(true);
      runAudioAnalysisLoop();
    } catch (err: any) {
      console.error('Microphone error:', err);
      setMicPermission('denied');
      setMicErrorMessage(
        err.name === 'NotAllowedError'
          ? 'Microphone permission was denied. Please allow microphone access in your browser settings.'
          : `Failed to initialize microphone: ${err.message}`
      );
    }
  };

  const stopSoundAnalysis = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setIsRecording(false);
  };

  const tryAgain = () => {
    stopSoundAnalysis();
    setLiveResult(null);
    setLiveFeatures(null);
    setMicErrorMessage(null);
    setTimeout(() => {
      startSoundAnalysis();
    }, 200);
  };

  const runAudioAnalysisLoop = () => {
    if (!analyserRef.current) return;

    const analyser = analyserRef.current;
    const timeBuffer = new Float32Array(analyser.fftSize);
    const freqBuffer = new Float32Array(analyser.frequencyBinCount);

    analyser.getFloatTimeDomainData(timeBuffer);
    analyser.getFloatFrequencyData(freqBuffer);

    // Convert logarithmic dB frequency data to linear magnitudes
    const magSpectrum = new Float32Array(freqBuffer.length);
    for (let i = 0; i < freqBuffer.length; i++) {
      magSpectrum[i] = Math.pow(10, freqBuffer[i] / 20);
    }

    const sampleRate = audioContextRef.current ? audioContextRef.current.sampleRate : 48000;
    const features = extractSpectralFeatures(magSpectrum, sampleRate, timeBuffer);
    setLiveFeatures(features);

    // Periodically update classification (every ~400ms to allow smooth UI and solid window integration)
    const now = Date.now();
    if (now - lastClassificationTimeRef.current >= 400) {
      lastClassificationTimeRef.current = now;
      const res = classifySoundFeatures(features, selectedGridId);
      setLiveResult(res);

      // Append to recent history if significant
      if (res.classificationStatus !== 'unknown' || Math.random() < 0.2) {
        setRecentHistory(prev => {
          const updated = [res, ...prev.slice(0, 14)];
          return updated;
        });
      }
    }

    // Render Live Canvas Visualizer (Waveform & FFT spectrum dual view)
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const w = canvas.width;
        const h = canvas.height;

        // Dark background
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, w, h);

        // Frequency Bars (background layer)
        const barWidth = (w / freqBuffer.length) * 2.5;
        let barX = 0;
        for (let i = 0; i < freqBuffer.length; i += 2) {
          const val = (freqBuffer[i] + 120) / 120; // Normalize -120dB to 0dB -> 0 to 1
          const barHeight = Math.max(2, val * (h * 0.7));
          ctx.fillStyle = `rgba(56, 189, 248, ${Math.min(0.85, Math.max(0.15, val))})`;
          ctx.fillRect(barX, h - barHeight, barWidth - 1, barHeight);
          barX += barWidth;
          if (barX > w) break;
        }

        // Oscilloscope Waveform overlay
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#34d399'; // Emerald green
        ctx.beginPath();
        const sliceWidth = w / timeBuffer.length;
        let x = 0;
        for (let i = 0; i < timeBuffer.length; i++) {
          const v = timeBuffer[i];
          const y = (0.45 + v * 0.45) * h;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
          x += sliceWidth;
        }
        ctx.stroke();
      }
    }

    animationFrameRef.current = requestAnimationFrame(runAudioAnalysisLoop);
  };

  // Category Icon & Color Mapping
  const getCategoryMeta = (cat: SoundCategory) => {
    switch (cat) {
      case 'Industrial Machinery':
        return { icon: Factory, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/60', border: 'border-blue-200 dark:border-blue-800' };
      case 'Road Traffic':
      case 'Traffic':
        return { icon: Car, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/60', border: 'border-amber-200 dark:border-amber-800' };
      case 'Construction':
        return { icon: HardHat, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-950/60', border: 'border-orange-200 dark:border-orange-800' };
      case 'Human Speech':
      case 'Speech':
        return { icon: MessageSquare, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950/60', border: 'border-purple-200 dark:border-purple-800' };
      case 'Music':
        return { icon: Music, color: 'text-pink-600', bg: 'bg-pink-50 dark:bg-pink-950/60', border: 'border-pink-200 dark:border-pink-800' };
      case 'Sirens and alarms':
        return { icon: Bell, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950/60', border: 'border-red-200 dark:border-red-800' };
      case 'Natural sounds':
        return { icon: Trees, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/60', border: 'border-emerald-200 dark:border-emerald-800' };
      case 'Mixed sound':
        return { icon: Layers, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-950/60', border: 'border-indigo-200 dark:border-indigo-800' };
      default:
        return { icon: HelpCircle, color: 'text-slate-500', bg: 'bg-slate-100 dark:bg-slate-800', border: 'border-slate-200 dark:border-slate-700' };
    }
  };

  const applyPreset = (preset: string) => {
    if (preset === 'machinery') {
      setSandboxRms(0.048);
      setSandboxCentroid(420);
      setSandboxBandwidth(600);
      setSandboxFlatness(0.18);
      setSandboxDominantFreq(120);
      setSandboxPeriodicity(0.88);
      setSandboxPeakCount(3);
      setSandboxZcr(0.06);
    } else if (preset === 'sirens') {
      setSandboxRms(0.060);
      setSandboxCentroid(1800);
      setSandboxBandwidth(400);
      setSandboxFlatness(0.08);
      setSandboxDominantFreq(1250);
      setSandboxPeriodicity(0.92);
      setSandboxPeakCount(2);
      setSandboxZcr(0.12);
    } else if (preset === 'construction') {
      setSandboxRms(0.065);
      setSandboxCentroid(1400);
      setSandboxBandwidth(2200);
      setSandboxFlatness(0.42);
      setSandboxDominantFreq(320);
      setSandboxPeriodicity(0.35);
      setSandboxPeakCount(14);
      setSandboxZcr(0.18);
    } else if (preset === 'traffic') {
      setSandboxRms(0.038);
      setSandboxCentroid(750);
      setSandboxBandwidth(1400);
      setSandboxFlatness(0.48);
      setSandboxDominantFreq(280);
      setSandboxPeriodicity(0.25);
      setSandboxPeakCount(6);
      setSandboxZcr(0.11);
    } else if (preset === 'speech') {
      setSandboxRms(0.025);
      setSandboxCentroid(1200);
      setSandboxBandwidth(900);
      setSandboxFlatness(0.28);
      setSandboxDominantFreq(220);
      setSandboxPeriodicity(0.55);
      setSandboxPeakCount(5);
      setSandboxZcr(0.09);
    } else if (preset === 'natural') {
      setSandboxRms(0.015);
      setSandboxCentroid(3400);
      setSandboxBandwidth(2800);
      setSandboxFlatness(0.46);
      setSandboxDominantFreq(2600);
      setSandboxPeriodicity(0.18);
      setSandboxPeakCount(2);
      setSandboxZcr(0.15);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center space-x-2">
            <Activity className="w-6 h-6 text-blue-600" />
            <span>{t('classPageTitle')}</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t('classPageSubtitle')}
          </p>
        </div>

        {/* Tab & Grid Switcher */}
        <div className="flex items-center space-x-3">
          <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('live')}
              className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-colors cursor-pointer ${
                activeTab === 'live'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              <span>{t('tabLiveMic')}</span>
            </button>
            <button
              onClick={() => setActiveTab('sandbox')}
              className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-colors cursor-pointer ${
                activeTab === 'sandbox'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>{t('tabSandbox')}</span>
            </button>
          </div>

          <div className="flex items-center space-x-1 text-xs bg-slate-50 dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700">
            <MapPin className="w-3.5 h-3.5 text-blue-500" />
            <select
              value={selectedGridId}
              onChange={(e) => setSelectedGridId(e.target.value)}
              className="bg-transparent font-medium text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
            >
              {DEMO_GRIDS.map(g => (
                <option key={g.grid_id} value={g.grid_id} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                  {g.grid_id} — {g.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Strict Privacy Callout */}
      <div className="bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 rounded-xl p-4 flex items-center justify-between text-xs text-blue-800 dark:text-blue-300">
        <div className="flex items-center space-x-3">
          <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
          <span>
            <strong>{t('zeroAudioTitle')}:</strong> {t('zeroAudioDesc')}
          </span>
        </div>
        <span className="px-2.5 py-1 bg-blue-100 dark:bg-blue-900/60 rounded-md font-mono font-medium">Non-AI DSP</span>
      </div>

      {activeTab === 'live' ? (
        <div className="space-y-6">
          {/* Live Analysis Control Bar */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              {isRecording ? (
                <button
                  onClick={stopSoundAnalysis}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl flex items-center space-x-2 shadow-sm transition-all cursor-pointer"
                >
                  <MicOff className="w-4 h-4" />
                  <span>{t('stopAnalysis')}</span>
                </button>
              ) : (
                <button
                  onClick={startSoundAnalysis}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl flex items-center space-x-2 shadow-sm transition-all cursor-pointer"
                >
                  <Mic className="w-4 h-4" />
                  <span>{t('startAnalysis')}</span>
                </button>
              )}

              <button
                onClick={tryAgain}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold rounded-xl flex items-center space-x-2 transition-all cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{t('tryAgain')}</span>
              </button>
            </div>

            <div className="flex items-center space-x-3 text-xs">
              <span className="text-slate-400">{t('qualityStatus')}:</span>
              <span
                className={`px-3 py-1 rounded-full font-semibold flex items-center space-x-1.5 ${
                  isRecording
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                    : micPermission === 'denied'
                    ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${isRecording ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                <span>{isRecording ? t('micStatusActive') : micPermission === 'denied' ? t('micStatusDenied') : t('micStatusIdle')}</span>
              </span>
            </div>
          </div>

          {/* Microphone Permission Denied Notice */}
          {micErrorMessage && (
            <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl flex items-start space-x-3 text-red-700 dark:text-red-300 text-sm">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">{t('micNoticeTitle')}</p>
                <p className="text-xs mt-1 text-red-600 dark:text-red-400">{micErrorMessage}</p>
                <p className="text-xs mt-2">{t('micNoticeFallback')}</p>
              </div>
            </div>
          )}


          {/* Visualizer Canvas & Live Result Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Visualizer Canvas (Waveform & FFT) */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Radio className="w-4 h-4 text-blue-600" />
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                    {t('oscilloTitle')}
                  </h3>
                </div>
                <div className="flex items-center space-x-3 text-xs">
                  <span className="flex items-center space-x-1 text-emerald-500 font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>{t('waveformLabel')}</span>
                  </span>
                  <span className="flex items-center space-x-1 text-sky-400 font-medium">
                    <span className="w-2 h-2 rounded-full bg-sky-400" />
                    <span>{t('fftLabel')}</span>
                  </span>
                </div>
              </div>

              <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800">
                <canvas
                  ref={canvasRef}
                  width={640}
                  height={220}
                  className="w-full h-52 block"
                />
                {!isRecording && (
                  <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                    <Mic className="w-8 h-8 mb-2 text-slate-500 animate-bounce" />
                    <p className="text-sm font-semibold text-slate-300">{t('analysisIdle')}</p>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm">
                      {t('analysisIdleDesc')}
                    </p>
                  </div>
                )}
              </div>

              {/* Extracted Signal Features Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] font-semibold text-slate-400 block">{t('rmsEnergyLabel')}</span>
                  <span className="font-mono text-sm font-bold text-slate-800 dark:text-slate-200">
                    {liveFeatures ? liveFeatures.rms_energy.toFixed(4) : '—'}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] font-semibold text-slate-400 block">{t('centroidLabel')}</span>
                  <span className="font-mono text-sm font-bold text-blue-600">
                    {liveFeatures ? `${liveFeatures.spectral_centroid_hz} Hz` : '—'}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] font-semibold text-slate-400 block">{t('dominantFreqLabel')}</span>
                  <span className="font-mono text-sm font-bold text-purple-600">
                    {liveFeatures ? `${liveFeatures.dominant_frequency_hz} Hz` : '—'}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] font-semibold text-slate-400 block">{t('flatnessLabel')}</span>
                  <span className="font-mono text-sm font-bold text-slate-800 dark:text-slate-200">
                    {liveFeatures ? liveFeatures.spectral_flatness.toFixed(3) : '—'}
                  </span>
                </div>
              </div>
            </div>

            {/* Identified Category Result Card */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    {t('classResultTitle')}
                  </span>
                  {liveResult && (
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        liveResult.classificationStatus === 'identified'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : liveResult.classificationStatus === 'mixed'
                          ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {liveResult.classificationStatus}
                    </span>
                  )}
                </div>

                {liveResult ? (
                  <div className="mt-4 space-y-4">
                    {/* Prominent Category Banner */}
                    {(() => {
                      const meta = getCategoryMeta(liveResult.category);
                      const Icon = meta.icon;
                      return (
                        <div className={`p-4 rounded-xl border ${meta.bg} ${meta.border} flex items-center space-x-3`}>
                          <div className={`p-2.5 rounded-lg bg-white dark:bg-slate-800 shadow-xs ${meta.color}`}>
                            <Icon className="w-6 h-6" />
                          </div>
                          <div>
                            <span className="text-[11px] font-semibold text-slate-400 block">{t('identifiedCategory')}</span>
                            <h4 className="text-xl font-black text-slate-900 dark:text-white">
                              {translateCategory(liveResult.category, language)}
                            </h4>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Rule Match Score & Quality Status */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800">
                        <span className="text-slate-400 block text-[10px]">{t('ruleMatchScore')}</span>
                        <span className="font-mono font-bold text-blue-600 text-sm">
                          {(liveResult.ruleScore * 100).toFixed(0)} / 100
                        </span>
                        <span className="text-[9px] text-slate-400 block">{t('heuristicMatch')}</span>
                      </div>
                      <div className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800">
                        <span className="text-slate-400 block text-[10px]">{t('qualityStatus')}</span>
                        <span
                          className={`font-semibold capitalize text-sm ${
                            liveResult.qualityStatus === 'good'
                              ? 'text-emerald-600'
                              : liveResult.qualityStatus === 'limited'
                              ? 'text-amber-600'
                              : 'text-red-600'
                          }`}
                        >
                          {liveResult.qualityStatus}
                        </span>
                        <span className="text-[9px] text-slate-400 block">{t('acousticClarity')}</span>
                      </div>
                    </div>

                    {/* Explanation */}
                    <div>
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        {t('ruleMatchReason')}
                      </span>
                      <p className="text-xs text-slate-600 dark:text-slate-400 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800 leading-relaxed">
                        {liveResult.reason}
                      </p>
                    </div>

                    {/* Alternative Candidate */}
                    {liveResult.alternativeCategory && (
                      <div className="text-xs text-slate-500 flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                        <span>{t('alternativeCandidate')}</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {translateCategory(liveResult.alternativeCategory, language)}
                        </span>
                      </div>
                    )}

                    {/* Matched Features List */}
                    <div>
                      <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">
                        {t('supportingCues')}
                      </span>
                      <ul className="space-y-1">
                        {liveResult.matchedFeatures.map((f, idx) => (
                          <li key={idx} className="text-[11px] text-slate-600 dark:text-slate-400 flex items-start space-x-1.5">
                            <span className="text-blue-500 font-bold">•</span>
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="py-12 text-center text-slate-400">
                    <Activity className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                    <p className="text-sm font-semibold">{t('noActiveClassification')}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {t('startToStreamDesc')}
                    </p>
                  </div>
                )}
              </div>


              {/* Anonymized Grid Attribution */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-[11px] text-slate-500">
                <span className="flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-blue-500" />
                  <span>Grid: <strong>{selectedGridId}</strong></span>
                </span>
                <span className="flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{liveResult ? new Date(liveResult.timestamp).toLocaleTimeString() : '—'}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Recent Classification History */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  {t('recentHistoryTitle')}
                </h3>
                <p className="text-xs text-slate-500">
                  {t('recentHistoryDesc')}
                </p>
              </div>
              <span className="text-xs font-mono px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-md">
                {recentHistory.length} {t('eventsLogged')}
              </span>
            </div>

            {recentHistory.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="p-3">{t('timeHeader')}</th>
                      <th className="p-3">{t('categoryHeader')}</th>
                      <th className="p-3">{t('statusHeader')}</th>
                      <th className="p-3">{t('scoreHeader')}</th>
                      <th className="p-3">{t('altHeader')}</th>
                      <th className="p-3">{t('reasonHeader')}</th>
                      <th className="p-3">{t('gridHeader')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {recentHistory.map((item, idx) => {
                      const meta = getCategoryMeta(item.category);
                      const Icon = meta.icon;
                      return (
                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-750/50 transition-colors">
                          <td className="p-3 font-mono text-slate-500">
                            {new Date(item.timestamp).toLocaleTimeString()}
                          </td>
                          <td className="p-3">
                            <span className="inline-flex items-center space-x-1.5 font-semibold text-slate-800 dark:text-slate-200">
                              <Icon className={`w-3.5 h-3.5 ${meta.color}`} />
                              <span>{translateCategory(item.category, language)}</span>
                            </span>
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                item.classificationStatus === 'identified'
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                  : item.classificationStatus === 'mixed'
                                  ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                                  : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                              }`}
                            >
                              {item.classificationStatus}
                            </span>
                          </td>
                          <td className="p-3 font-mono font-bold text-blue-600">
                            {(item.ruleScore * 100).toFixed(0)} / 100
                          </td>
                          <td className="p-3 text-slate-500">
                            {item.alternativeCategory ? translateCategory(item.alternativeCategory, language) : '—'}
                          </td>
                          <td className="p-3 text-slate-600 dark:text-slate-400 max-w-xs truncate" title={item.reason}>
                            {item.reason}
                          </td>
                          <td className="p-3 font-mono text-slate-500">
                            {item.gridId || 'CBE-KPR'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                {t('noActiveClassification')}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* RULE SANDBOX VIEW */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Interactive Feature Tuner */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700 gap-3">
              <div>
                <h2 className="font-bold text-slate-900 dark:text-white text-base">{t('sandboxTitle')}</h2>
                <p className="text-xs text-slate-500">{t('sandboxDesc')}</p>
              </div>
              {/* Presets */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-slate-400 font-medium">{t('presetsLabel')}</span>
                <button
                  onClick={() => applyPreset('machinery')}
                  className="px-2 py-1 text-xs rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300 font-medium hover:bg-blue-100"
                >
                  {t('catIndustrial')}
                </button>
                <button
                  onClick={() => applyPreset('sirens')}
                  className="px-2 py-1 text-xs rounded-lg bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-300 font-medium hover:bg-red-100"
                >
                  {t('catSirens')}
                </button>
                <button
                  onClick={() => applyPreset('construction')}
                  className="px-2 py-1 text-xs rounded-lg bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-300 font-medium hover:bg-orange-100"
                >
                  {t('catConstruction')}
                </button>
                <button
                  onClick={() => applyPreset('traffic')}
                  className="px-2 py-1 text-xs rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-300 font-medium hover:bg-amber-100"
                >
                  {t('catTraffic')}
                </button>
                <button
                  onClick={() => applyPreset('speech')}
                  className="px-2 py-1 text-xs rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-300 font-medium hover:bg-purple-100"
                >
                  {t('catSpeech')}
                </button>
                <button
                  onClick={() => applyPreset('natural')}
                  className="px-2 py-1 text-xs rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300 font-medium hover:bg-emerald-100"
                >
                  {t('catNatural')}
                </button>
              </div>
            </div>


            <div className="space-y-4">
              {/* RMS Energy */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  <span>{t('rmsEnergyLabel')}</span>
                  <span className="font-mono text-blue-600">{sandboxRms.toFixed(4)}</span>
                </div>
                <input
                  type="range"
                  min="0.001"
                  max="0.2"
                  step="0.002"
                  value={sandboxRms}
                  onChange={(e) => setSandboxRms(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              {/* Spectral Centroid */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  <span>{t('centroidLabel')}</span>
                  <span className="font-mono text-blue-600">{sandboxCentroid} Hz</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="4500"
                  step="25"
                  value={sandboxCentroid}
                  onChange={(e) => setSandboxCentroid(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              {/* Dominant Frequency */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  <span>{t('dominantFreqLabel')}</span>
                  <span className="font-mono text-blue-600">{sandboxDominantFreq} Hz</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="3500"
                  step="10"
                  value={sandboxDominantFreq}
                  onChange={(e) => setSandboxDominantFreq(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              {/* Periodicity Score */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  <span>{t('periodicityLabel')}</span>
                  <span className="font-mono text-blue-600">{sandboxPeriodicity}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.02"
                  value={sandboxPeriodicity}
                  onChange={(e) => setSandboxPeriodicity(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              {/* Spectral Flatness */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  <span>{t('flatnessLabel')}</span>
                  <span className="font-mono text-blue-600">{sandboxFlatness}</span>
                </div>
                <input
                  type="range"
                  min="0.01"
                  max="0.99"
                  step="0.02"
                  value={sandboxFlatness}
                  onChange={(e) => setSandboxFlatness(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              {/* Transient Peak Count */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  <span>{t('peakCountLabel')}</span>
                  <span className="font-mono text-blue-600">{sandboxPeakCount}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="25"
                  step="1"
                  value={sandboxPeakCount}
                  onChange={(e) => setSandboxPeakCount(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Sandbox Evaluation Output */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider">
                {t('heuristicMatch')}
              </span>

              <div className="mt-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-500">{t('identifiedCategory')}:</span>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                  {translateCategory(sandboxResult.category, language)}
                </h3>
                <div className="mt-2 flex items-center space-x-2">
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-semibold font-mono">
                    {t('scoreHeader')}: {(sandboxResult.ruleScore * 100).toFixed(0)} / 100
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    {sandboxResult.reliabilityLabel}
                  </span>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <div>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t('ruleMatchReason')}</span>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                    {sandboxResult.reason}
                  </p>
                </div>

                {sandboxResult.alternativeCategory && (
                  <div className="text-xs text-slate-500">
                    <span>{t('alternativeCandidate')}: </span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {translateCategory(sandboxResult.alternativeCategory, language)}
                    </span>
                  </div>
                )}

                <div>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    {t('supportingCues')}
                  </span>
                  <ul className="space-y-1">
                    {sandboxResult.matchedFeatures.map((m, i) => (
                      <li key={i} className="text-xs text-slate-600 dark:text-slate-400 flex items-start space-x-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                        <span>{m}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-700 text-xs text-slate-500 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Non-AI compliance verified: strictly inspectable heuristic rules.</span>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
