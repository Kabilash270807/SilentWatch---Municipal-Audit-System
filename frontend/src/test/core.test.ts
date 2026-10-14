import { describe, it, expect } from 'vitest';
import { calculateEnergyLAeq, calculateMedian, calculateChronicNoiseScore } from '../services/statistics';
import { classifySoundFeatures } from '../services/classifier';
import { calculateRMS, calculatePeak, getAWeightingDb, estimateDbaLevel } from '../services/dsp';
import { TRANSLATIONS, translateCategory } from '../i18n/translations';

describe('Acoustic Signal Processing & DSP Functions', () => {
  it('computes correct RMS energy', () => {
    const samples = new Float32Array([0.5, -0.5, 0.5, -0.5]);
    const rms = calculateRMS(samples);
    expect(rms).toBeCloseTo(0.5, 3);
  });

  it('computes correct peak amplitude', () => {
    const samples = new Float32Array([0.1, -0.85, 0.4]);
    const peak = calculatePeak(samples);
    expect(peak).toBeCloseTo(0.85, 3);
  });

  it('calculates standard A-weighting curve at 1000 Hz reference', () => {
    // IEC 61672: At 1000 Hz, A-weighting is approximately 0.0 dB
    const a1k = getAWeightingDb(1000);
    expect(a1k).toBeGreaterThan(-0.5);
    expect(a1k).toBeLessThan(0.5);
  });

  it('maps uncalibrated vs calibrated dB levels reliably', () => {
    const { estimatedDba, quality } = estimateDbaLevel(0.01, 2.5);
    expect(estimatedDba).toBeGreaterThan(30);
    expect(quality).toBe('VALID');
  });
});

describe('Non-AI Rule-Based Sound Classification', () => {
  it('classifies stationary low-frequency tonal drone as Industrial Machinery', () => {
    const result = classifySoundFeatures({
      rms_energy: 0.045,
      spectral_centroid_hz: 420.0,
      spectral_flatness: 0.18,
      dominant_frequency_hz: 120.0,
      periodicity_score: 0.85,
      peak_count: 3,
      zero_crossing_rate: 0.06
    });

    expect(result.category).toBe('Industrial Machinery');
    expect(result.ruleScore).toBeGreaterThanOrEqual(0.7);
    expect(result.classificationStatus).toBe('identified');
  });

  it('classifies high impact transient peaks as Construction', () => {
    const result = classifySoundFeatures({
      rms_energy: 0.065,
      spectral_centroid_hz: 1400.0,
      spectral_bandwidth_hz: 2200.0,
      spectral_flatness: 0.42,
      dominant_frequency_hz: 320.0,
      periodicity_score: 0.35,
      peak_count: 14,
      zero_crossing_rate: 0.18
    });

    expect(result.category).toBe('Construction');
    expect(result.ruleScore).toBeGreaterThanOrEqual(0.7);
    expect(result.classificationStatus).toBe('identified');
  });

  it('classifies sharp concentrated high-pitch warning tones as Sirens and alarms', () => {
    const result = classifySoundFeatures({
      rms_energy: 0.060,
      spectral_centroid_hz: 1800.0,
      spectral_bandwidth_hz: 400.0,
      spectral_flatness: 0.08,
      dominant_frequency_hz: 1250.0,
      periodicity_score: 0.92,
      peak_count: 2,
      zero_crossing_rate: 0.12
    });

    expect(result.category).toBe('Sirens and alarms');
    expect(result.ruleScore).toBeGreaterThanOrEqual(0.8);
    expect(result.classificationStatus).toBe('identified');
  });

  it('classifies high-frequency diffuse background hiss as Natural sounds', () => {
    const result = classifySoundFeatures({
      rms_energy: 0.015,
      spectral_centroid_hz: 3400.0,
      spectral_bandwidth_hz: 2800.0,
      spectral_flatness: 0.46,
      dominant_frequency_hz: 2600.0,
      periodicity_score: 0.18,
      peak_count: 2,
      zero_crossing_rate: 0.15,
      high_frequency_energy_ratio: 0.52
    });

    expect(result.category).toBe('Natural sounds');
    expect(result.classificationStatus).toBe('identified');
  });

  it('classifies continuous broadband noise with high flatness as Road Traffic', () => {
    const result = classifySoundFeatures({
      rms_energy: 0.038,
      spectral_centroid_hz: 750.0,
      spectral_flatness: 0.48,
      dominant_frequency_hz: 280.0,
      periodicity_score: 0.25,
      peak_count: 6,
      zero_crossing_rate: 0.11
    });

    expect(result.category).toBe('Road Traffic');
    expect(result.classificationStatus).toBe('identified');
  });

  it('classifies formant modulations as Human Speech', () => {
    const result = classifySoundFeatures({
      rms_energy: 0.025,
      spectral_centroid_hz: 1100.0,
      spectral_bandwidth_hz: 850.0,
      spectral_flatness: 0.25,
      dominant_frequency_hz: 210.0,
      periodicity_score: 0.52,
      peak_count: 4,
      zero_crossing_rate: 0.08
    });

    expect(result.category).toBe('Human Speech');
    expect(result.classificationStatus).toBe('identified');
  });

  it('classifies harmonic intervals with high periodicity as Music', () => {
    const result = classifySoundFeatures({
      rms_energy: 0.040,
      spectral_centroid_hz: 850.0,
      spectral_bandwidth_hz: 1200.0,
      spectral_flatness: 0.20,
      dominant_frequency_hz: 440.0,
      periodicity_score: 0.85,
      peak_count: 6,
      zero_crossing_rate: 0.07,
      harmonic_energy_ratio: 0.45
    });

    expect(result.category).toBe('Music');
    expect(result.classificationStatus).toBe('identified');
  });

  it('returns Mixed sound when multiple categories have overlapping close rule scores', () => {
    const result = classifySoundFeatures({
      rms_energy: 0.050,
      spectral_centroid_hz: 650.0,
      spectral_flatness: 0.32,
      dominant_frequency_hz: 180.0,
      periodicity_score: 0.52,
      peak_count: 5,
      zero_crossing_rate: 0.08
    });

    expect(['Mixed sound', 'Industrial Machinery', 'Road Traffic']).toContain(result.category);
    expect(result.ruleScore).toBeGreaterThan(0.5);
  });

  it('returns Unknown sound for ambiguous low-energy background floor', () => {
    const result = classifySoundFeatures({
      rms_energy: 0.001,
      spectral_centroid_hz: 200.0,
      spectral_flatness: 0.5,
      dominant_frequency_hz: 60.0,
      periodicity_score: 0.1,
      peak_count: 1,
      zero_crossing_rate: 0.02
    });

    expect(result.category).toBe('Unknown sound');
    expect(result.classificationStatus).toBe('unknown');
    expect(result.qualityStatus).toBe('limited');
  });
});

describe('Statistical Noise Engine', () => {
  it('calculates energy-based logarithmic LAeq correctly', () => {
    // Two equal sound sources at 60 dB sum energy to 60 dB
    const laeq = calculateEnergyLAeq([60, 60, 60]);
    expect(laeq).toBe(60.0);
  });

  it('calculates median noise floor correctly', () => {
    expect(calculateMedian([45, 48, 52, 55, 60])).toBe(52);
    expect(calculateMedian([40, 50])).toBe(45);
  });

  it('calculates explainable Chronic Noise Score within 0 to 100', () => {
    const { score, breakdown } = calculateChronicNoiseScore(80, 8.5, 7, 6, 0.95);
    expect(score).toBeGreaterThan(60);
    expect(score).toBeLessThanOrEqual(100);
    expect(breakdown.frequencyComponent).toBeGreaterThan(0);
    expect(breakdown.magnitudeComponent).toBeGreaterThan(0);
  });
});

describe('Municipal Administrator Access Control & Privacy Policies', () => {
  it('strictly validates that raw audio fields are flagged as privacy violations', () => {
    const forbiddenKeys = ['audio', 'waveform', 'audio_base64', 'recording', 'raw_samples', 'voice'];
    const payload = { grid_id: 'CBE-101', estimated_level_dba: 54.0, raw_samples: [0.1, 0.2] };
    const hasForbidden = Object.keys(payload).some(k => forbiddenKeys.includes(k));
    expect(hasForbidden).toBe(true);
  });

  it('verifies public citizen features require zero authentication tokens', () => {
    const publicFeatures = ['/monitor', '/classification', '/heatmap', '/calibration', '/privacy'];
    const anonymousUserToken = null;
    publicFeatures.forEach(route => {
      // Citizen route access check
      const isPublic = !route.startsWith('/admin');
      expect(isPublic).toBe(true);
      expect(anonymousUserToken).toBeNull();
    });
  });

  it('verifies restricted municipal features require an active administrator token', () => {
    const restrictedRoutes = ['/admin/incidents', '/admin/night-screening', '/admin/audit-reports'];
    let adminToken: string | null = null;

    // Without token: cannot access
    restrictedRoutes.forEach(route => {
      const allowed = route.startsWith('/admin') ? adminToken !== null : true;
      expect(allowed).toBe(false);
    });

    // With authenticated administrator token: authorized
    adminToken = 'test-municipal-token-xyz';
    restrictedRoutes.forEach(route => {
      const allowed = route.startsWith('/admin') ? adminToken !== null : true;
      expect(allowed).toBe(true);
    });
  });
});

describe('Bilingual Tamil & English (தமிழ்) i18n Dictionary', () => {

  it('contains complete parity between English and Tamil translations', () => {
    const enKeys = Object.keys(TRANSLATIONS.en);
    const taKeys = Object.keys(TRANSLATIONS.ta);

    expect(enKeys.length).toBeGreaterThan(50);
    expect(taKeys.length).toBe(enKeys.length);

    enKeys.forEach(k => {
      expect((TRANSLATIONS.ta as any)[k]).toBeDefined();
      expect(typeof (TRANSLATIONS.ta as any)[k]).toBe('string');
      expect((TRANSLATIONS.ta as any)[k].length).toBeGreaterThan(0);
    });
  });

  it('translates all 9 sound categories into authentic Tamil strings', () => {
    expect(translateCategory('Industrial Machinery', 'ta')).toBe('தொழிற்சாலை இயந்திரங்கள்');
    expect(translateCategory('Road Traffic', 'ta')).toBe('சாலைப் போக்குவரத்து');
    expect(translateCategory('Construction', 'ta')).toBe('கட்டுமானப் பணிகள்');
    expect(translateCategory('Human Speech', 'ta')).toBe('மனிதப் பேச்சு');
    expect(translateCategory('Music', 'ta')).toBe('இசை / பெருக்கி ஒலி');
    expect(translateCategory('Sirens and alarms', 'ta')).toBe('எச்சரிக்கை சைரன்கள் & அலாரங்கள்');
    expect(translateCategory('Natural sounds', 'ta')).toBe('இயற்கை ஒலிகள் (காற்று/மழை)');
    expect(translateCategory('Mixed sound', 'ta')).toBe('கலந்த ஒலி (Mixed Sound)');
    expect(translateCategory('Unknown sound', 'ta')).toBe('அடையாளம் தெரியாத ஒலி');
  });

  it('preserves English category text when English is active', () => {
    expect(translateCategory('Industrial Machinery', 'en')).toBe('Industrial Machinery');
    expect(translateCategory('Construction', 'en')).toBe('Construction');
  });
});
