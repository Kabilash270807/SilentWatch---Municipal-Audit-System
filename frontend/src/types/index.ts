/**
 * SilentWatch Core Types & Data Contracts
 * Privacy-preserving, non-AI derived measurements
 */

export type SoundCategory =
  | 'Industrial Machinery'
  | 'Road Traffic'
  | 'Construction'
  | 'Human Speech'
  | 'Music'
  | 'Sirens and alarms'
  | 'Natural sounds'
  | 'Mixed sound'
  | 'Unknown sound'
  | 'Traffic' // Backward compatible alias
  | 'Speech'  // Backward compatible alias
  | 'Unknown'; // Backward compatible alias

export type ClassificationStatus = 'identified' | 'mixed' | 'unknown';
export type FeatureQualityStatus = 'good' | 'limited' | 'poor';

export type QualityStatus =
  | 'VALID'
  | 'UNCALIBRATED'
  | 'CLIPPING'
  | 'LOW_CONFIDENCE'
  | 'SILENT_INPUT';

export type DetectionStatus =
  | 'Insufficient Data'
  | 'Within Configured Limit'
  | 'Potential Exceedance'
  | 'Recurring Exceedance'
  | 'Requires Verification'
  | 'Reviewed by Authority';

export type ZoneType =
  | 'Residential'
  | 'Commercial/Mixed'
  | 'Industrial'
  | 'Silence Zone';

export interface SupportingFeatures {
  rms_energy: number;
  spectral_centroid_hz: number;
  spectral_bandwidth_hz?: number;
  spectral_flatness: number;
  dominant_frequency_hz: number;
  periodicity_score: number;
  peak_count: number;
  zero_crossing_rate: number;
  temporal_variation?: number;
  low_frequency_energy_ratio?: number;
  mid_frequency_energy_ratio?: number;
  high_frequency_energy_ratio?: number;
  harmonic_energy_ratio?: number;
}

export interface DerivedMeasurement {
  measurement_id: string;
  grid_id: string;
  timestamp: string; // ISO String
  estimated_level_dba: number;
  peak_level_dba: number;
  noise_floor_estimate: number;
  measurement_metric: string;
  quality_status: QualityStatus;
  calibration_offset_applied: number;
  detected_category: SoundCategory;
  rule_score: number;
  alternative_category?: SoundCategory;
  supporting_features: SupportingFeatures;
  processing_version: string;
}

export interface GridInfo {
  grid_id: string;
  name: string;
  zone_type: ZoneType;
  center: [number, number]; // [lat, lng]
  bounds: [[number, number], [number, number]]; // SW, NE
  applicable_night_limit_dba: number;
}

export interface GridStatistics {
  grid_id: string;
  zone_type: ZoneType;
  median_noise_floor_dba: number;
  valid_sample_count: number;
  exceedance_percentage: number;
  monitored_nights: number;
  nights_with_repeated_exceedances: number;
  chronic_noise_score: number;
  measurement_quality: string;
  data_coverage_percentage: number;
  last_observation_time?: string;
  recent_category_distribution: Record<string, number>;
}

export interface CalibrationRecord {
  calibration_id: string;
  device_label: string;
  reference_instrument: string;
  reference_level: number;
  phone_level: number;
  offset_dba: number;
  repeatability_status: string;
  calibration_status: string;
  formula_used: string;
  limitations: string;
  calibration_date: string;
}

export interface Incident {
  incident_id: string;
  report_id?: string;
  grid_id: string;
  zone_type: ZoneType;
  reporting_period: string;
  measured_noise_metric: string;
  applicable_threshold_dba: number;
  recorded_exceedance_db: number;
  valid_sample_count: number;
  monitored_nights: number;
  likely_sound_category: SoundCategory;
  rule_score: number;
  chronic_noise_score: number;
  calibration_status: string;
  quality_warnings: string[];
  detection_status: DetectionStatus;
  recommended_action: string;
  review_status: 'UNREVIEWED' | 'UNDER_INVESTIGATION' | 'CONFIRMED' | 'DISMISSED';
  created_at: string;
  notes?: string;
}

export interface AuditReport {
  report_id: string;
  reporting_period: string;
  zone_type: ZoneType;
  monitoring_grid: string;
  average_noise_level: string;
  applicable_nighttime_limit: string;
  recorded_exceedance: string;
  number_of_valid_samples: number;
  detection_status: string;
  measurement_confidence: string;
  recommended_action: string;
  median_noise_floor_estimate: string;
  exceedance_percentage: number;
  chronic_noise_score: number;
  monitored_nights: number;
  nights_with_repeated_exceedance: number;
  calibration_status: string;
  reference_instrument?: string;
  measurement_uncertainty: string;
  data_coverage: string;
  quality_warnings: string[];
  regulatory_source: string;
  rule_effective_date: string;
  algorithm_version: string;
  generated_at: string;
  privacy_verification_status: string;
}

export interface PrivacyCheck {
  name: string;
  passed: boolean;
  details: string;
}

export interface AdminUser {
  admin_id: string;
  username: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
}

export interface AdminAuthSession {
  token: string;
  token_type: string;
  expires_at: string;
  user: AdminUser;
}
