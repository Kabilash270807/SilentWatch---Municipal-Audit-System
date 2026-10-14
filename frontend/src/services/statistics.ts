/**
 * Statistical Analysis Engine
 * Computes rolling noise floor, LAeq, exceedance frequency, and Chronic Noise Score (0-100)
 */

export function calculateEnergyLAeq(levelsDba: number[]): number {
  if (!levelsDba.length) return 0;
  const sumEnergy = levelsDba.reduce((acc, l) => acc + Math.pow(10, l / 10), 0);
  return Number((10 * Math.log10(sumEnergy / levelsDba.length)).toFixed(1));
}

export function calculateMedian(values: number[]): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 !== 0) {
    return Number(sorted[mid].toFixed(1));
  }
  return Number(((sorted[mid - 1] + sorted[mid]) / 2).toFixed(1));
}

export function calculateMedianAbsoluteDeviation(values: number[], median: number): number {
  if (!values.length) return 0;
  const deviations = values.map(v => Math.abs(v - median));
  return calculateMedian(deviations);
}

/**
 * Explainable Chronic Noise Score (0 - 100)
 * Evaluates prolonged community impact:
 * - 35% Exceedance Frequency
 * - 30% Average Exceedance Magnitude above legal threshold
 * - 25% Persistence across distinct nights
 * - 10% Data confidence & measurement quality multiplier
 */
export function calculateChronicNoiseScore(
  exceedanceFreqPct: number,
  avgExceedanceMagnitudeDb: number,
  monitoredNights: number,
  nightsWithRepeat: number,
  qualityMultiplier: number = 0.95
): {
  score: number;
  breakdown: {
    frequencyComponent: number;
    magnitudeComponent: number;
    recurrenceComponent: number;
    qualityBonus: number;
  };
} {
  const fScore = Math.min(100, Math.max(0, exceedanceFreqPct));
  // 15 dB over limit is treated as severe 100% threshold
  const mScore = Math.min(100, Math.max(0, (avgExceedanceMagnitudeDb / 15.0) * 100));
  const rScore = monitoredNights > 0 ? (nightsWithRepeat / monitoredNights) * 100 : 0;

  const fComp = 0.35 * fScore;
  const mComp = 0.30 * mScore;
  const rComp = 0.25 * rScore;
  const qComp = 0.10 * (qualityMultiplier * 100);

  const rawTotal = fComp + mComp + rComp + qComp;
  const finalScore = Number(Math.min(100, Math.max(0, rawTotal)).toFixed(1));

  return {
    score: finalScore,
    breakdown: {
      frequencyComponent: Number(fComp.toFixed(1)),
      magnitudeComponent: Number(mComp.toFixed(1)),
      recurrenceComponent: Number(rComp.toFixed(1)),
      qualityBonus: Number(qComp.toFixed(1))
    }
  };
}
