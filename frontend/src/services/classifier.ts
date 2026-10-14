/**
 * Non-AI Transparent Rule-Based Sound Classifier
 * Pure heuristic classification based on acoustic signal features.
 * Absolutely NO neural networks, machine learning models, or external voice APIs.
 *
 * Supported Sound Categories:
 * 1. Industrial machinery — motors, generators, compressors, repetitive mechanical noise.
 * 2. Road traffic — vehicle engines, horns, road traffic noise.
 * 3. Construction — drilling, hammering, grinding, intermittent impact noise.
 * 4. Human speech — people talking or shouting.
 * 5. Music — tonal, rhythmic, or musical sounds.
 * 6. Sirens and alarms — prominent warning tones.
 * 7. Natural sounds — wind, rain, birds, and similar ambient sounds.
 * 8. Mixed sound — multiple overlapping sound types.
 * 9. Unknown sound — insufficient evidence to identify a category.
 */

import { SoundCategory, SupportingFeatures, ClassificationStatus, FeatureQualityStatus } from '../types';

export interface StructuredClassificationResult {
  category: SoundCategory;
  ruleScore: number; // Rule match score (0.00 to 1.00), NEVER called probability
  matchedFeatures: string[];
  alternativeCategory?: SoundCategory;
  classificationStatus: ClassificationStatus;
  qualityStatus: FeatureQualityStatus;
  reason: string;
  timestamp: string; // ISO 8601
  gridId?: string;
  reliabilityLabel: 'High Reliability' | 'Moderate Reliability' | 'Low Reliability / Ambiguous';
}

// Configurable acoustic classification thresholds
export const CLASSIFIER_THRESHOLDS = {
  minAudibleRms: 0.003,
  clippingRms: 0.95,
  industrial: {
    maxCentroidHz: 950,
    minPeriodicity: 0.50,
    maxDominantFreqHz: 800,
    minDominantFreqHz: 40,
    minLowBandRatio: 0.35,
  },
  sirens: {
    minDominantFreqHz: 600,
    maxDominantFreqHz: 3500,
    minPeriodicity: 0.65,
    maxFlatness: 0.30,
    minMidOrHighRatio: 0.50,
  },
  music: {
    minPeriodicity: 0.58,
    minHarmonicRatio: 0.30,
    minPeaks: 4,
    minCentroidHz: 400,
  },
  construction: {
    minPeaks: 8,
    minRms: 0.02,
    minZcr: 0.10,
    minBandwidthHz: 1200,
  },
  traffic: {
    minFlatness: 0.30,
    minCentroidHz: 280,
    maxCentroidHz: 2400,
    maxPeriodicity: 0.60,
  },
  speech: {
    minCentroidHz: 350,
    maxCentroidHz: 3000,
    minZcr: 0.04,
    maxZcr: 0.28,
    minPeriodicity: 0.25,
    maxPeriodicity: 0.72,
    maxFlatness: 0.38,
  },
  natural: {
    maxRms: 0.035,
    minFlatnessOrHighCentroid: true,
  }
};

/**
 * Classifies extracted digital signal processing features using documented, explainable rules.
 */
export function classifySoundFeatures(
  features: SupportingFeatures,
  gridId?: string,
  timestamp?: string
): StructuredClassificationResult {
  const ts = timestamp || new Date().toISOString();
  const {
    rms_energy,
    spectral_centroid_hz,
    spectral_bandwidth_hz = 1000,
    spectral_flatness,
    dominant_frequency_hz,
    periodicity_score,
    peak_count,
    zero_crossing_rate,
    low_frequency_energy_ratio = 0.2,
    mid_frequency_energy_ratio = 0.5,
    high_frequency_energy_ratio = 0.3,
    harmonic_energy_ratio = 0.1
  } = features;

  const matchedFeatures: string[] = [];

  // Determine signal quality status
  let qualityStatus: FeatureQualityStatus = 'good';
  if (rms_energy >= CLASSIFIER_THRESHOLDS.clippingRms) {
    qualityStatus = 'poor';
  } else if (rms_energy < CLASSIFIER_THRESHOLDS.minAudibleRms) {
    qualityStatus = 'limited';
  }

  // 1. SILENT / ULTRA-LOW ENERGY INPUT
  if (rms_energy < CLASSIFIER_THRESHOLDS.minAudibleRms) {
    return {
      category: 'Unknown sound',
      ruleScore: 0.20,
      matchedFeatures: ['RMS energy below audibility threshold (< 0.003)'],
      classificationStatus: 'unknown',
      qualityStatus: 'limited',
      reason: 'Signal amplitude too low to extract distinctive harmonic or spectral signatures.',
      timestamp: ts,
      gridId,
      reliabilityLabel: 'Low Reliability / Ambiguous'
    };
  }

  // Candidates with match score calculation
  const candidates: {
    category: SoundCategory;
    score: number;
    reason: string;
    matched: string[];
    reliability: 'High Reliability' | 'Moderate Reliability' | 'Low Reliability / Ambiguous';
  }[] = [];

  // RULE A: Sirens and Alarms
  // High prominent warning tone (600 - 3500 Hz), high tonality / low spectral flatness, elevated periodicity
  if (
    dominant_frequency_hz >= CLASSIFIER_THRESHOLDS.sirens.minDominantFreqHz &&
    dominant_frequency_hz <= CLASSIFIER_THRESHOLDS.sirens.maxDominantFreqHz &&
    periodicity_score >= CLASSIFIER_THRESHOLDS.sirens.minPeriodicity &&
    spectral_flatness <= CLASSIFIER_THRESHOLDS.sirens.maxFlatness
  ) {
    const matched = [
      `Dominant tonal peak at ${dominant_frequency_hz.toFixed(0)} Hz in alarm range`,
      `Elevated periodicity score (${periodicity_score})`,
      `Low spectral flatness (${spectral_flatness}) indicating pure tonal acoustic whistle/siren`
    ];
    const score = Math.min(0.96, 0.65 + periodicity_score * 0.25 + (1 - spectral_flatness) * 0.1);
    candidates.push({
      category: 'Sirens and alarms',
      score: Number(score.toFixed(2)),
      reason: `Prominent concentrated alarm tone detected at ${dominant_frequency_hz.toFixed(0)} Hz with sharp tonality.`,
      matched,
      reliability: score > 0.82 ? 'High Reliability' : 'Moderate Reliability'
    });
  }

  // RULE B: Industrial Machinery
  // Stationary motors, pumps, diesel generators, ventilation fans:
  // Low dominant hum (40-400 Hz), high periodicity, low spectral centroid (< 850 Hz), low harmonic energy (unlike music)
  if (
    dominant_frequency_hz >= CLASSIFIER_THRESHOLDS.industrial.minDominantFreqHz &&
    dominant_frequency_hz <= 400 &&
    periodicity_score >= CLASSIFIER_THRESHOLDS.industrial.minPeriodicity &&
    spectral_centroid_hz <= 850 &&
    harmonic_energy_ratio < 0.35
  ) {
    const matched = [
      `Low-frequency dominant tone at ${dominant_frequency_hz.toFixed(0)} Hz (motor rotation / hum)`,
      `Strong periodicity (${periodicity_score}) indicating continuous rotating mechanical assembly`,
      `Low spectral centroid (${spectral_centroid_hz.toFixed(0)} Hz <= 950 Hz)`,
      `Low-band energy ratio: ${(low_frequency_energy_ratio * 100).toFixed(0)}%`
    ];
    const score = Math.min(0.95, 0.60 + periodicity_score * 0.25 + low_frequency_energy_ratio * 0.15);
    candidates.push({
      category: 'Industrial Machinery',
      score: Number(score.toFixed(2)),
      reason: `Stable low-frequency hum at ${dominant_frequency_hz.toFixed(0)} Hz with high periodicity (${periodicity_score}) typical of stationary machinery or generators.`,
      matched,
      reliability: score > 0.80 ? 'High Reliability' : 'Moderate Reliability'
    });
  }

  // RULE C: Construction / Percussive Impact Noise
  // Repeated sharp broadband transient impacts: high peak count, elevated ZCR, wide spectral bandwidth
  if (
    peak_count >= CLASSIFIER_THRESHOLDS.construction.minPeaks &&
    rms_energy >= CLASSIFIER_THRESHOLDS.construction.minRms &&
    (zero_crossing_rate >= CLASSIFIER_THRESHOLDS.construction.minZcr || spectral_bandwidth_hz >= CLASSIFIER_THRESHOLDS.construction.minBandwidthHz)
  ) {
    const matched = [
      `Multiple transient acoustic peaks (${peak_count} peaks detected)`,
      `Elevated zero-crossing rate (${zero_crossing_rate})`,
      `Broad spectral bandwidth (${spectral_bandwidth_hz.toFixed(0)} Hz) typical of mechanical impacts`
    ];
    const score = Math.min(0.92, 0.55 + Math.min(0.35, (peak_count / 25) * 0.35));
    candidates.push({
      category: 'Construction',
      score: Number(score.toFixed(2)),
      reason: `Repetitive broadband transient impacts (${peak_count} peaks) characteristic of hammering, drilling, or jackhammering.`,
      matched,
      reliability: score > 0.78 ? 'High Reliability' : 'Moderate Reliability'
    });
  }

  // RULE D: Music & Amplified Sounds
  // Strong harmonic structure, multiple harmonic peaks, high periodicity, musical pitch intervals
  if (
    periodicity_score >= CLASSIFIER_THRESHOLDS.music.minPeriodicity &&
    (harmonic_energy_ratio >= CLASSIFIER_THRESHOLDS.music.minHarmonicRatio || peak_count >= CLASSIFIER_THRESHOLDS.music.minPeaks) &&
    spectral_centroid_hz >= CLASSIFIER_THRESHOLDS.music.minCentroidHz
  ) {
    const matched = [
      `Harmonic peak ratio: ${harmonic_energy_ratio.toFixed(2)}`,
      `Rhythmic periodicity score (${periodicity_score})`,
      `Multiple resonant spectral peaks (${peak_count} peaks)`
    ];
    const score = Math.min(0.90, 0.58 + periodicity_score * 0.20 + harmonic_energy_ratio * 0.15);
    candidates.push({
      category: 'Music',
      score: Number(score.toFixed(2)),
      reason: `Harmonic multi-peak resonance and rhythmically periodic envelope matching music or public address loudspeakers.`,
      matched,
      reliability: score > 0.76 ? 'High Reliability' : 'Moderate Reliability'
    });
  }

  // RULE E: Human Speech
  // Spectral centroid in conversational formants (350 - 3000 Hz), dynamic modulations, moderate ZCR, low transient peaks
  if (
    spectral_centroid_hz >= CLASSIFIER_THRESHOLDS.speech.minCentroidHz &&
    spectral_centroid_hz <= CLASSIFIER_THRESHOLDS.speech.maxCentroidHz &&
    zero_crossing_rate >= CLASSIFIER_THRESHOLDS.speech.minZcr &&
    zero_crossing_rate <= CLASSIFIER_THRESHOLDS.speech.maxZcr &&
    periodicity_score >= CLASSIFIER_THRESHOLDS.speech.minPeriodicity &&
    periodicity_score <= CLASSIFIER_THRESHOLDS.speech.maxPeriodicity &&
    spectral_flatness <= CLASSIFIER_THRESHOLDS.speech.maxFlatness &&
    peak_count <= 7
  ) {
    const matched = [
      `Spectral centroid in human vocal formant band (${spectral_centroid_hz.toFixed(0)} Hz)`,
      `Zero crossing rate (${zero_crossing_rate}) in phoneme voicing interval (0.04 - 0.28)`,
      `Dynamic syllabic periodicity (${periodicity_score})`
    ];
    const score = 0.76;
    candidates.push({
      category: 'Human Speech',
      score,
      reason: `Spectral centroid within human speech formant band with moderate harmonic modulation.`,
      matched,
      reliability: 'Moderate Reliability'
    });
  }

  // RULE F: Natural Sounds (wind turbulence, rain hiss, bird calls)
  // Very low energy or high spectral centroid with high frequency bias, gentle broadband hiss or high chirp
  if (
    (spectral_centroid_hz > 3000 && high_frequency_energy_ratio > 0.45 && peak_count <= 4) ||
    (spectral_flatness > 0.40 && rms_energy < 0.025 && low_frequency_energy_ratio < 0.25 && dominant_frequency_hz > 2000)
  ) {
    const matched = [
      `High-frequency dominance (${spectral_centroid_hz.toFixed(0)} Hz centroid)`,
      `Elevated high band energy (${(high_frequency_energy_ratio * 100).toFixed(0)}%)`,
      `Low mechanical periodicity (${periodicity_score})`
    ];
    const score = 0.73;
    candidates.push({
      category: 'Natural sounds',
      score,
      reason: 'High-frequency diffuse envelope with low mechanical periodicity characteristic of wind, rustling, or rain.',
      matched,
      reliability: 'Moderate Reliability'
    });
  }

  // RULE G: Road Traffic Noise
  // Continuous broadband spectrum, high spectral flatness (> 0.30), low-mid centroid, non-periodic
  if (
    spectral_flatness >= CLASSIFIER_THRESHOLDS.traffic.minFlatness &&
    spectral_centroid_hz >= CLASSIFIER_THRESHOLDS.traffic.minCentroidHz &&
    spectral_centroid_hz <= CLASSIFIER_THRESHOLDS.traffic.maxCentroidHz &&
    periodicity_score <= CLASSIFIER_THRESHOLDS.traffic.maxPeriodicity &&
    peak_count < CLASSIFIER_THRESHOLDS.construction.minPeaks
  ) {
    const matched = [
      `Elevated spectral flatness (${spectral_flatness}) indicating diffuse broadband acoustic noise`,
      `Centroid in tire/engine road friction band (${spectral_centroid_hz.toFixed(0)} Hz)`,
      `Diffuse non-tonal periodicity (${periodicity_score})`
    ];
    const score = Math.min(0.88, 0.62 + spectral_flatness * 0.28);
    candidates.push({
      category: 'Road Traffic',
      score: Number(score.toFixed(2)),
      reason: 'Continuous broadband noise envelope with high spectral flatness typical of vehicular tire-pavement friction.',
      matched,
      reliability: score > 0.78 ? 'High Reliability' : 'Moderate Reliability'
    });
  }

  // SORT CANDIDATES BY RULE SCORE
  candidates.sort((a, b) => b.score - a.score);

  // EVALUATE MULTI-CATEGORY AMBIGUITY / MIXED SOUND
  if (candidates.length >= 2) {
    const top = candidates[0];
    const runnerUp = candidates[1];

    // If top two candidates have very close rule scores (within 0.03), declare Mixed Sound
    if (Math.abs(top.score - runnerUp.score) <= 0.03 && top.score >= 0.65) {
      return {
        category: 'Mixed sound',
        ruleScore: Number(((top.score + runnerUp.score) / 2).toFixed(2)),
        matchedFeatures: [...top.matched.slice(0, 2), ...runnerUp.matched.slice(0, 2)],
        alternativeCategory: top.category,
        classificationStatus: 'mixed',
        qualityStatus,
        reason: `Overlapping acoustic signatures: signals match both ${top.category} and ${runnerUp.category}.`,
        timestamp: ts,
        gridId,
        reliabilityLabel: 'Moderate Reliability'
      };
    }

    return {
      category: top.category,
      ruleScore: top.score,
      matchedFeatures: top.matched,
      alternativeCategory: runnerUp.category,
      classificationStatus: 'identified',
      qualityStatus,
      reason: top.reason,
      timestamp: ts,
      gridId,
      reliabilityLabel: top.reliability
    };
  }

  if (candidates.length === 1) {
    const top = candidates[0];
    return {
      category: top.category,
      ruleScore: top.score,
      matchedFeatures: top.matched,
      classificationStatus: 'identified',
      qualityStatus,
      reason: top.reason,
      timestamp: ts,
      gridId,
      reliabilityLabel: top.reliability
    };
  }

  // FALLBACK: UNKNOWN SOUND
  return {
    category: 'Unknown sound',
    ruleScore: 0.40,
    matchedFeatures: [
      `Centroid: ${spectral_centroid_hz.toFixed(0)} Hz`,
      `Flatness: ${spectral_flatness.toFixed(3)}`,
      `Periodicity: ${periodicity_score.toFixed(2)}`
    ],
    alternativeCategory: undefined,
    classificationStatus: 'unknown',
    qualityStatus,
    reason: 'Acoustic envelope does not meet verified threshold criteria for any specific sound category.',
    timestamp: ts,
    gridId,
    reliabilityLabel: 'Low Reliability / Ambiguous'
  };
}
