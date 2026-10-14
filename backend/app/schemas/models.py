from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class SupportingFeatures(BaseModel):
    rms_energy: float
    spectral_centroid_hz: float
    spectral_flatness: float
    dominant_frequency_hz: float
    periodicity_score: float
    peak_count: int
    zero_crossing_rate: float
    spectral_bandwidth_hz: Optional[float] = None
    temporal_variation: Optional[float] = None
    low_frequency_energy_ratio: Optional[float] = None
    mid_frequency_energy_ratio: Optional[float] = None
    high_frequency_energy_ratio: Optional[float] = None
    harmonic_energy_ratio: Optional[float] = None

class MeasurementCreate(BaseModel):
    grid_id: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    estimated_level_dba: float
    peak_level_dba: float
    noise_floor_estimate: float
    measurement_metric: str = "LAeq_1s" # or "relative_estimate_dba"
    quality_status: str = "VALID" # VALID, CLIPPING, LOW_CONFIDENCE, UNCALIBRATED
    calibration_offset_applied: float = 0.0
    detected_category: str = "Unknown"
    rule_score: float = 0.0
    supporting_features: Optional[SupportingFeatures] = None
    processing_version: str = "1.0.0"

class MeasurementResponse(MeasurementCreate):
    measurement_id: str
    created_at: datetime

class GridStatisticsResponse(BaseModel):
    grid_id: str
    zone_type: str
    median_noise_floor_dba: float
    valid_sample_count: int
    exceedance_percentage: float
    monitored_nights: int
    nights_with_repeated_exceedances: int
    chronic_noise_score: float
    measurement_quality: str
    data_coverage_percentage: float
    last_observation_time: Optional[datetime]
    recent_category_distribution: Dict[str, int]

class DashboardSummary(BaseModel):
    latest_estimated_dba: Optional[float]
    latest_peak_dba: Optional[float]
    current_noise_floor_dba: Optional[float]
    valid_measurement_count: int
    monitored_grid_count: int
    recurring_hotspot_count: int
    potential_incidents_count: int
    measurement_quality_status: str
    calibration_status: str
    pending_sync_count: int
    last_successful_save: Optional[datetime]
    noise_trend_history: List[Dict[str, Any]]
    category_distribution: Dict[str, int]
    top_chronic_grids: List[Dict[str, Any]]
    recent_incidents: List[Dict[str, Any]]

class NoiseHeatmapFeatureCollection(BaseModel):
    type: str = "FeatureCollection"
    features: List[Dict[str, Any]]

class ViolationScreeningItem(BaseModel):
    grid_id: str
    zone_type: str
    applicable_limit_dba: float
    measurement_metric: str
    recorded_exceedance_db: float
    exceedance_percentage: float
    valid_sample_count: int
    monitored_nights: int
    chronic_noise_score: float
    measurement_quality: str
    detection_status: str
    recommended_action: str

class IncidentResponse(BaseModel):
    incident_id: str
    report_id: Optional[str]
    grid_id: str
    zone_type: str
    reporting_period: str
    measured_noise_metric: str
    applicable_threshold_dba: float
    recorded_exceedance_db: float
    valid_sample_count: int
    monitored_nights: int
    likely_sound_category: str
    rule_score: float
    chronic_noise_score: float
    calibration_status: str
    quality_warnings: List[str]
    detection_status: str
    recommended_action: str
    review_status: str # UNREVIEWED, UNDER_INVESTIGATION, CONFIRMED, DISMISSED
    created_at: datetime
    notes: Optional[str] = None

class IncidentStatusUpdate(BaseModel):
    review_status: str
    notes: Optional[str] = None

class CalibrationCompareRequest(BaseModel):
    device_label: str
    reference_instrument: str
    reference_reading_dba: float
    phone_reading_dba: float
    notes: Optional[str] = None

class CalibrationCompareResponse(BaseModel):
    calibration_id: str
    device_label: str
    reference_level: float
    phone_level: float
    offset_dba: float
    repeatability_status: str
    calibration_status: str
    formula_used: str
    limitations: str
    calibration_date: datetime

class CalibrationRecordSchema(CalibrationCompareResponse):
    pass

class AuditReportGenerateRequest(BaseModel):
    grid_id: str
    reporting_period_start: datetime
    reporting_period_end: datetime
    ruleset: str = "MUNICIPAL_STANDARD_2026"
    include_sensor_metadata: bool = True

class AuditReportResponse(BaseModel):
    report_id: str
    reporting_period: str
    zone_type: str
    monitoring_grid: str
    average_noise_level: str
    applicable_nighttime_limit: str
    recorded_exceedance: str
    number_of_valid_samples: int
    detection_status: str
    measurement_confidence: str
    recommended_action: str
    # Audit metadata
    median_noise_floor_estimate: str
    exceedance_percentage: float
    chronic_noise_score: float
    monitored_nights: int
    nights_with_repeated_exceedance: int
    calibration_status: str
    reference_instrument: Optional[str]
    measurement_uncertainty: str
    data_coverage: str
    quality_warnings: List[str]
    regulatory_source: str
    rule_effective_date: str
    algorithm_version: str
    generated_at: datetime
    privacy_verification_status: str

class PrivacyCheckItem(BaseModel):
    name: str
    passed: bool
    details: str

class PrivacyStatusResponse(BaseModel):
    overall_privacy_status: str
    raw_audio_persisted: bool
    audio_upload_endpoint_present: bool
    local_processing_verified: bool
    grid_anonymization_enabled: bool
    checks: List[PrivacyCheckItem]
    verified_at: datetime
