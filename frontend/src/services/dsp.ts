/**
 * Signal Processing Module for Environmental Noise Measurement
 * Strictly adheres to non-AI DSP standards.
 * Processes short audio buffers locally in temporary RAM and releases them.
 */

import { SupportingFeatures } from '../types';

/**
 * Standard IEC 61672 A-Weighting curve approximation
 * @param f Frequency in Hz
 * @returns Weighting in dB
 */
export function getAWeightingDb(f: number): number {
  if (f <= 10) return -70;
  const f2 = f * f;
  // Standard IEC 61672-1:
  // Ra(f) = (12194^2 * f^4) / [ (f^2 + 20.6^2) * sqrt((f^2 + 107.7^2)*(f^2 + 737.9^2)) * (f^2 + 12194^2) ]
  // A(f) = 20 * log10(Ra(f)) + 2.00
  const c1 = 12194.217 * 12194.217;
  const c2 = 20.598997 * 20.598997;
  const c3 = 107.65265 * 107.65265;
  const c4 = 737.86223 * 737.86223;

  const num = c1 * f2 * f2;
  const denom = (f2 + c2) * Math.sqrt((f2 + c3) * (f2 + c4)) * (f2 + c1);
  const rA = num / denom;
  return Number((20 * Math.log10(rA) + 2.0).toFixed(2));
}

/**
 * Calculate Root Mean Square (RMS) energy of an audio buffer
 */
export function calculateRMS(samples: Float32Array): number {
  let sumSq = 0;
  for (let i = 0; i < samples.length; i++) {
    sumSq += samples[i] * samples[i];
  }
  return Math.sqrt(sumSq / samples.length);
}

/**
 * Extract digital peak amplitude
 */
export function calculatePeak(samples: Float32Array): number {
  let peak = 0;
  for (let i = 0; i < samples.length; i++) {
    const abs = Math.abs(samples[i]);
    if (abs > peak) peak = abs;
  }
  return peak;
}

/**
 * Extract zero crossing rate
 */
export function calculateZeroCrossingRate(samples: Float32Array): number {
  let crossings = 0;
  for (let i = 1; i < samples.length; i++) {
    if ((samples[i] >= 0 && samples[i - 1] < 0) || (samples[i] < 0 && samples[i - 1] >= 0)) {
      crossings++;
    }
  }
  return crossings / (samples.length - 1);
}

/**
 * Perform transparent feature extraction from frequency magnitude spectrum
 */
export function extractSpectralFeatures(
  magnitudeSpectrum: Float32Array,
  sampleRate: number,
  samples: Float32Array
): SupportingFeatures {
  const numBins = magnitudeSpectrum.length;
  const binResolution = (sampleRate / 2) / numBins;

  let sumMag = 0;
  let weightedSum = 0;
  let logSum = 0;
  let maxMag = -Infinity;
  let dominantBin = 0;
  let peakCount = 0;

  for (let i = 1; i < numBins; i++) {
    const mag = Math.max(1e-12, magnitudeSpectrum[i]);
    const freq = i * binResolution;

    sumMag += mag;
    weightedSum += freq * mag;
    logSum += Math.log(mag);

    if (mag > maxMag) {
      maxMag = mag;
      dominantBin = i;
    }

    // Simple peak detection (local maxima)
    if (i > 1 && i < numBins - 1) {
      if (magnitudeSpectrum[i] > magnitudeSpectrum[i - 1] &&
          magnitudeSpectrum[i] > magnitudeSpectrum[i + 1] &&
          magnitudeSpectrum[i] > 0.05) {
        peakCount++;
      }
    }
  }

  // Spectral Centroid
  const spectralCentroid = sumMag > 0 ? weightedSum / sumMag : 0;

  // Spectral Bandwidth: sqrt( sum( (f - centroid)^2 * mag ) / sum(mag) )
  let bandwidthVarianceSum = 0;
  let lowBandMag = 0;   // 20 - 300 Hz
  let midBandMag = 0;   // 300 - 2500 Hz
  let highBandMag = 0;  // 2500 - 8000 Hz

  for (let i = 1; i < numBins; i++) {
    const mag = Math.max(1e-12, magnitudeSpectrum[i]);
    const freq = i * binResolution;
    const diff = freq - spectralCentroid;
    bandwidthVarianceSum += diff * diff * mag;

    if (freq < 300) {
      lowBandMag += mag;
    } else if (freq <= 2500) {
      midBandMag += mag;
    } else {
      highBandMag += mag;
    }
  }

  const spectralBandwidth = sumMag > 0 ? Math.sqrt(bandwidthVarianceSum / sumMag) : 0;
  const lowRatio = sumMag > 0 ? lowBandMag / sumMag : 0;
  const midRatio = sumMag > 0 ? midBandMag / sumMag : 0;
  const highRatio = sumMag > 0 ? highBandMag / sumMag : 0;

  // Spectral Flatness (Wiener entropy = geometric mean / arithmetic mean)
  const arithmeticMean = sumMag / numBins;
  const geometricMean = Math.exp(logSum / numBins);
  const spectralFlatness = arithmeticMean > 0 ? Math.min(1.0, geometricMean / arithmeticMean) : 0;

  // Dominant frequency & Periodicity
  const dominantFreq = dominantBin * binResolution;
  const rms = calculateRMS(samples);
  const zcr = calculateZeroCrossingRate(samples);

  // Periodicity estimate: based on energy concentration in dominant bin vs total
  const periodicity = sumMag > 0 ? Math.min(1.0, (maxMag / sumMag) * 8.0) : 0;

  // Harmonic energy ratio: energy in harmonics (2f, 3f, 4f) of dominant frequency
  let harmonicEnergy = 0;
  if (dominantBin > 0) {
    for (let h = 2; h <= 4; h++) {
      const hBin = dominantBin * h;
      if (hBin < numBins) {
        // sum small window around harmonic bin
        const start = Math.max(0, hBin - 1);
        const end = Math.min(numBins - 1, hBin + 1);
        for (let j = start; j <= end; j++) {
          harmonicEnergy += magnitudeSpectrum[j];
        }
      }
    }
  }
  const harmonicRatio = sumMag > 0 ? Math.min(1.0, (harmonicEnergy / sumMag) * 3.0) : 0;

  return {
    rms_energy: Number(rms.toFixed(4)),
    spectral_centroid_hz: Number(spectralCentroid.toFixed(1)),
    spectral_bandwidth_hz: Number(spectralBandwidth.toFixed(1)),
    spectral_flatness: Number(spectralFlatness.toFixed(3)),
    dominant_frequency_hz: Number(dominantFreq.toFixed(1)),
    periodicity_score: Number(periodicity.toFixed(2)),
    peak_count: peakCount,
    zero_crossing_rate: Number(zcr.toFixed(3)),
    low_frequency_energy_ratio: Number(lowRatio.toFixed(3)),
    mid_frequency_energy_ratio: Number(midRatio.toFixed(3)),
    high_frequency_energy_ratio: Number(highRatio.toFixed(3)),
    harmonic_energy_ratio: Number(harmonicRatio.toFixed(3))
  };
}

/**
 * Estimate dB(A) relative sound level
 * If uncalibrated, provides relative sound indicator mapped from RMS reference
 */
export function estimateDbaLevel(
  rms: number,
  calibrationOffset: number = 0,
  referenceDbOffset: number = 94.0 // Reference digital 0 dBFS to SPL scale
): { estimatedDba: number; quality: 'VALID' | 'UNCALIBRATED' | 'CLIPPING' | 'SILENT_INPUT' } {
  if (rms < 1e-5) {
    return { estimatedDba: 25.0, quality: 'SILENT_INPUT' };
  }

  if (rms >= 0.98) {
    return { estimatedDba: 105.0, quality: 'CLIPPING' };
  }

  // Convert digital RMS to relative dBFS: 20 * log10(rms)
  const dbfs = 20 * Math.log10(rms);
  // Add reference calibration offset (e.g. -20 dBFS ~ 74 dB SPL + cal offset)
  const rawEst = referenceDbOffset + dbfs + calibrationOffset;
  const boundedLevel = Math.max(30.0, Math.min(115.0, Number(rawEst.toFixed(1))));

  const quality = calibrationOffset !== 0 ? 'VALID' : 'UNCALIBRATED';
  return { estimatedDba: boundedLevel, quality };
}
