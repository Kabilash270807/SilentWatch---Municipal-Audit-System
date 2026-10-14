/**
 * Mock & Realistic Demonstration Data Generator
 * Clearly labeled DEMO DATA for offline simulation and hackathon showcases.
 */

import { DerivedMeasurement, Incident, AuditReport } from '../types';

export const DEMO_GRIDS = [
  {
    grid_id: 'CBE-101',
    name: 'Gandhipuram Cross Cut Hub',
    zone_type: 'Commercial/Mixed' as const,
    center: [11.0168, 76.9678] as [number, number],
    bounds: [[11.0128, 76.9638], [11.0208, 76.9718]] as [[number, number], [number, number]],
    applicable_night_limit_dba: 55.0
  },
  {
    grid_id: 'CBE-102',
    name: 'RS Puram West Residential',
    zone_type: 'Residential' as const,
    center: [11.0085, 76.9515] as [number, number],
    bounds: [[11.0045, 76.9475], [11.0125, 76.9555]] as [[number, number], [number, number]],
    applicable_night_limit_dba: 45.0
  },
  {
    grid_id: 'CBE-103',
    name: 'Peelamedu Tech & Avinashi Road',
    zone_type: 'Commercial/Mixed' as const,
    center: [11.0275, 77.0142] as [number, number],
    bounds: [[11.0235, 77.0102], [11.0315, 77.0182]] as [[number, number], [number, number]],
    applicable_night_limit_dba: 55.0
  },
  {
    grid_id: 'CBE-104',
    name: 'SIDCO Industrial Estate Kurichi',
    zone_type: 'Industrial' as const,
    center: [10.9380, 76.9680] as [number, number],
    bounds: [[10.9330, 76.9630], [10.9430, 76.9730]] as [[number, number], [number, number]],
    applicable_night_limit_dba: 70.0
  },
  {
    grid_id: 'CBE-105',
    name: 'Coimbatore Medical College Hospital (CMCH)',
    zone_type: 'Silence Zone' as const,
    center: [11.0012, 76.9740] as [number, number],
    bounds: [[10.9972, 76.9700], [11.0052, 76.9780]] as [[number, number], [number, number]],
    applicable_night_limit_dba: 40.0
  },
  {
    grid_id: 'CBE-KPR',
    name: 'KPR Institute of Engineering and Technology (KPR College)',
    zone_type: 'Silence Zone' as const,
    center: [11.1492, 77.0827] as [number, number],
    bounds: [[11.1442, 77.0777], [11.1542, 77.0877]] as [[number, number], [number, number]],
    applicable_night_limit_dba: 40.0
  }
];

export function generateDemoMeasurements(): DerivedMeasurement[] {
  const list: DerivedMeasurement[] = [];
  const now = Date.now();

  // Grid CBE-101: Recurring nighttime exceedance (Commercial & Traffic Hub)
  for (let i = 0; i < 90; i++) {
    const timeOffset = (90 - i) * 60 * 1000 * 20; // past hours
    const level = 58.0 + Math.sin(i / 5) * 6 + (Math.random() * 2 - 1);
    list.push({
      measurement_id: `DEMO-MEAS-CBE101-${i}`,
      grid_id: 'CBE-101',
      timestamp: new Date(now - timeOffset).toISOString(),
      estimated_level_dba: Number(level.toFixed(1)),
      peak_level_dba: Number((level + 6.5).toFixed(1)),
      noise_floor_estimate: Number((level - 5.0).toFixed(1)),
      measurement_metric: 'LAeq_1s',
      quality_status: 'VALID',
      calibration_offset_applied: 2.5,
      detected_category: i % 3 === 0 ? 'Traffic' : 'Industrial Machinery',
      rule_score: 0.88,
      supporting_features: {
        rms_energy: 0.042,
        spectral_centroid_hz: 520.0,
        spectral_flatness: 0.28,
        dominant_frequency_hz: 120.0,
        periodicity_score: 0.79,
        peak_count: 5,
        zero_crossing_rate: 0.09
      },
      processing_version: '1.0.0-DEMO'
    });
  }

  // Grid CBE-102: RS Puram Residential
  for (let i = 0; i < 60; i++) {
    const timeOffset = (60 - i) * 60 * 1000 * 30;
    const level = 47.5 + Math.cos(i / 4) * 4;
    list.push({
      measurement_id: `DEMO-MEAS-CBE102-${i}`,
      grid_id: 'CBE-102',
      timestamp: new Date(now - timeOffset).toISOString(),
      estimated_level_dba: Number(level.toFixed(1)),
      peak_level_dba: Number((level + 5.0).toFixed(1)),
      noise_floor_estimate: Number((level - 4.0).toFixed(1)),
      measurement_metric: 'LAeq_1s',
      quality_status: 'VALID',
      calibration_offset_applied: 2.5,
      detected_category: i % 2 === 0 ? 'Traffic' : 'Speech',
      rule_score: 0.76,
      supporting_features: {
        rms_energy: 0.025,
        spectral_centroid_hz: 850.0,
        spectral_flatness: 0.35,
        dominant_frequency_hz: 240.0,
        periodicity_score: 0.5,
        peak_count: 4,
        zero_crossing_rate: 0.08
      },
      processing_version: '1.0.0-DEMO'
    });
  }

  return list;
}

export const DEMO_INCIDENTS: Incident[] = [
  {
    incident_id: 'INC-CBE-2026-001',
    report_id: 'NMA-CBE-001',
    grid_id: 'CBE-101',
    zone_type: 'Commercial/Mixed',
    reporting_period: '1–7 October 2026',
    measured_noise_metric: '62.4 dB(A) LAeq',
    applicable_threshold_dba: 55.0,
    recorded_exceedance_db: 7.4,
    valid_sample_count: 140,
    monitored_nights: 7,
    likely_sound_category: 'Traffic',
    rule_score: 0.89,
    chronic_noise_score: 84.2,
    calibration_status: 'Calibrated Against Reference (+2.5 dB)',
    quality_warnings: ['Continuous night bus terminal generator and traffic drone'],
    detection_status: 'Recurring Exceedance',
    recommended_action: 'Coimbatore Municipal Corporation (CCMC) inspection for night commercial diesel genset operations.',
    review_status: 'UNDER_INVESTIGATION',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    notes: 'Citizen complaints filed from Gandhipuram 7th Street. Field inspection scheduled.'
  },
  {
    incident_id: 'INC-CBE-2026-002',
    report_id: 'NMA-CBE-002',
    grid_id: 'CBE-105',
    zone_type: 'Silence Zone',
    reporting_period: 'Past 48 Hours',
    measured_noise_metric: '46.8 dB(A) LAeq',
    applicable_threshold_dba: 40.0,
    recorded_exceedance_db: 6.8,
    valid_sample_count: 75,
    monitored_nights: 2,
    likely_sound_category: 'Construction',
    rule_score: 0.83,
    chronic_noise_score: 74.5,
    calibration_status: 'Calibrated (+2.5 dB applied)',
    quality_warnings: ['Impulsive transient peaks detected past 23:00 near hospital wing'],
    detection_status: 'Requires Verification',
    recommended_action: 'Audit night construction permits adjacent to CMCH hospital buffer zone.',
    review_status: 'UNREVIEWED',
    created_at: new Date(Date.now() - 3600000 * 8).toISOString(),
    notes: 'Triggered by high transient peak count on Trichy Road bypass.'
  }
];

export const DEMO_AUDIT_REPORT: AuditReport = {
  report_id: 'NMA-CBE-001',
  reporting_period: '1–7 October 2026',
  zone_type: 'Commercial/Mixed',
  monitoring_grid: 'CBE-101',
  average_noise_level: '62.4 dB(A) LAeq',
  applicable_nighttime_limit: '55.0 dB(A)',
  recorded_exceedance: '7.4 dB',
  number_of_valid_samples: 140,
  detection_status: 'Requires verification',
  measurement_confidence: 'Medium-High (Derived from calibrated sensor array over 7 nights)',
  recommended_action: 'Review measurements and investigate the Gandhipuram hotspot',
  median_noise_floor_estimate: '56.8 dB(A)',
  exceedance_percentage: 82.5,
  chronic_noise_score: 84.2,
  monitored_nights: 7,
  nights_with_repeated_exceedance: 6,
  calibration_status: 'Calibrated Against Reference (+2.5 dB offset)',
  reference_instrument: 'Bruel & Kjaer Type 2250 (Class 1 SLM)',
  measurement_uncertainty: '+/- 1.8 dB (Acoustic spatial averaging limitations)',
  data_coverage: '96.4% across nighttime monitoring intervals',
  quality_warnings: ['High persistence across 6 consecutive nights in commercial corridor'],
  regulatory_source: 'Tamil Nadu Pollution Control Board (TNPCB) & CCMC Urban Noise Code 2026',
  rule_effective_date: '2026-01-01',
  algorithm_version: 'SilentWatch-Core-v1.0-RuleEngine',
  generated_at: new Date(Date.now() - 86400000).toISOString(),
  privacy_verification_status: 'VERIFIED: Zero raw audio recorded or persisted. Aggregated grid only.'
};
