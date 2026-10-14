import uuid
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import random

class StorageService:
    def __init__(self):
        self._measurements: List[Dict[str, Any]] = []
        self._incidents: List[Dict[str, Any]] = []
        self._calibrations: List[Dict[str, Any]] = []
        self._audit_reports: List[Dict[str, Any]] = []
        self._grids: Dict[str, Dict[str, Any]] = {}
        self._seed_default_data()

    def get_status(self) -> str:
        return "InMemory_Ready (Sync Capable)"

    def _seed_default_data(self):
        # Grids definition for Coimbatore Municipal Corporation (CCMC)
        # Lat/Lon bounding around central coordinates 11.0168, 76.9558
        self._grids = {
            "CBE-101": {
                "grid_id": "CBE-101",
                "name": "Gandhipuram Cross Cut Hub",
                "zone_type": "Commercial/Mixed",
                "center": [11.0168, 76.9678],
                "bounds": [[11.0128, 76.9638], [11.0208, 76.9718]],
                "applicable_night_limit_dba": 55.0
            },
            "CBE-102": {
                "grid_id": "CBE-102",
                "name": "RS Puram West Residential",
                "zone_type": "Residential",
                "center": [11.0085, 76.9515],
                "bounds": [[11.0045, 76.9475], [11.0125, 76.9555]],
                "applicable_night_limit_dba": 45.0
            },
            "CBE-103": {
                "grid_id": "CBE-103",
                "name": "Peelamedu Tech & Avinashi Road",
                "zone_type": "Commercial/Mixed",
                "center": [11.0275, 77.0142],
                "bounds": [[11.0235, 77.0102], [11.0315, 77.0182]],
                "applicable_night_limit_dba": 55.0
            },
            "CBE-104": {
                "grid_id": "CBE-104",
                "name": "SIDCO Industrial Estate Kurichi",
                "zone_type": "Industrial",
                "center": [10.9380, 76.9680],
                "bounds": [[10.9330, 76.9630], [10.9430, 76.9730]],
                "applicable_night_limit_dba": 70.0
            },
            "CBE-105": {
                "grid_id": "CBE-105",
                "name": "Coimbatore Medical College Hospital (CMCH)",
                "zone_type": "Silence Zone",
                "center": [11.0012, 76.9740],
                "bounds": [[10.9972, 76.9700], [11.0052, 76.9780]],
                "applicable_night_limit_dba": 40.0
            },
            "CBE-KPR": {
                "grid_id": "CBE-KPR",
                "name": "KPR Institute of Engineering and Technology (KPR College)",
                "zone_type": "Silence Zone",
                "center": [11.1492, 77.0827],
                "bounds": [[11.1442, 77.0777], [11.1542, 77.0877]],
                "applicable_night_limit_dba": 40.0
            },
        }

        # Seed calibrations
        cal_id = "CAL-" + str(uuid.uuid4())[:8]
        self._calibrations.append({
            "calibration_id": cal_id,
            "device_label": "Field Station Audio Unit A1",
            "reference_instrument": "Bruel & Kjaer Type 2250 (Class 1 SLM)",
            "reference_level": 60.0,
            "phone_level": 57.5,
            "offset_dba": 2.5,
            "repeatability_status": "HIGH_CONSISTENCY (Variance < 0.3 dB)",
            "calibration_status": "Calibrated Against Reference",
            "formula_used": "Offset = Reference (60.0) - Phone (57.5) = +2.5 dB",
            "limitations": "Single point acoustic verification. Valid between 40-85 dB(A).",
            "calibration_date": datetime.utcnow() - timedelta(days=5)
        })

        # Seed realistic demonstration measurements (without raw audio!)
        now = datetime.utcnow()
        # Seed CBE-101: Commercial/Mixed, frequent night exceedances (Chronic hotspot)
        for i in range(120):
            t = now - timedelta(hours=random.randint(1, 168))
            is_night = t.hour >= 22 or t.hour < 6
            base_db = 58.0 if is_night else 62.0
            level = round(base_db + random.uniform(-4.0, 8.0), 1)
            self._measurements.append({
                "measurement_id": f"MEAS-{uuid.uuid4().hex[:8]}",
                "grid_id": "CBE-101",
                "timestamp": t,
                "estimated_level_dba": level,
                "peak_level_dba": round(level + random.uniform(3.0, 9.0), 1),
                "noise_floor_estimate": round(level - 6.0, 1),
                "measurement_metric": "LAeq_1s",
                "quality_status": "VALID",
                "calibration_offset_applied": 2.5,
                "detected_category": random.choice(["Industrial Machinery", "Traffic", "Unknown"]),
                "rule_score": round(random.uniform(0.65, 0.92), 2),
                "supporting_features": {
                    "rms_energy": 0.045,
                    "spectral_centroid_hz": 420.0,
                    "spectral_flatness": 0.22,
                    "dominant_frequency_hz": 120.0,
                    "periodicity_score": 0.82,
                    "peak_count": 4,
                    "zero_crossing_rate": 0.08
                },
                "processing_version": "1.0.0",
                "created_at": t
            })

        # Seed CBE-102: RS Puram Residential, moderate exceedance
        for i in range(80):
            t = now - timedelta(hours=random.randint(1, 120))
            level = round(47.0 + random.uniform(-3.0, 6.0), 1)
            self._measurements.append({
                "measurement_id": f"MEAS-{uuid.uuid4().hex[:8]}",
                "grid_id": "CBE-102",
                "timestamp": t,
                "estimated_level_dba": level,
                "peak_level_dba": round(level + 7.0, 1),
                "noise_floor_estimate": round(level - 5.0, 1),
                "measurement_metric": "LAeq_1s",
                "quality_status": "VALID",
                "calibration_offset_applied": 2.5,
                "detected_category": random.choice(["Traffic", "Speech", "Music"]),
                "rule_score": 0.78,
                "supporting_features": {
                    "rms_energy": 0.038,
                    "spectral_centroid_hz": 850.0,
                    "spectral_flatness": 0.45,
                    "dominant_frequency_hz": 440.0,
                    "periodicity_score": 0.55,
                    "peak_count": 8,
                    "zero_crossing_rate": 0.12
                },
                "processing_version": "1.0.0",
                "created_at": t
            })

        # Seed CBE-105: Hospital Silence Zone, very strict limit 40 dBA, recorded 46 dBA
        for i in range(65):
            t = now - timedelta(hours=random.randint(1, 90))
            level = round(44.5 + random.uniform(-2.0, 5.0), 1)
            self._measurements.append({
                "measurement_id": f"MEAS-{uuid.uuid4().hex[:8]}",
                "grid_id": "CBE-105",
                "timestamp": t,
                "estimated_level_dba": level,
                "peak_level_dba": round(level + 5.0, 1),
                "noise_floor_estimate": round(level - 4.0, 1),
                "measurement_metric": "LAeq_1s",
                "quality_status": "VALID",
                "calibration_offset_applied": 2.5,
                "detected_category": random.choice(["Traffic", "Construction"]),
                "rule_score": 0.81,
                "supporting_features": {
                    "rms_energy": 0.021,
                    "spectral_centroid_hz": 1100.0,
                    "spectral_flatness": 0.35,
                    "dominant_frequency_hz": 250.0,
                    "periodicity_score": 0.4,
                    "peak_count": 12,
                    "zero_crossing_rate": 0.15
                },
                "processing_version": "1.0.0",
                "created_at": t
            })

        # Seed Incidents
        self._incidents.append({
            "incident_id": "INC-CBE-2026-001",
            "report_id": "NMA-CBE-001",
            "grid_id": "CBE-101",
            "zone_type": "Commercial/Mixed",
            "reporting_period": "Past 7 Days (Nighttime 22:00-06:00)",
            "measured_noise_metric": "LAeq_1s",
            "applicable_threshold_dba": 55.0,
            "recorded_exceedance_db": 6.8,
            "valid_sample_count": 120,
            "monitored_nights": 7,
            "likely_sound_category": "Industrial Machinery",
            "rule_score": 0.89,
            "chronic_noise_score": 82.4,
            "calibration_status": "Calibrated (+2.5 dB applied)",
            "quality_warnings": ["Recurring tonal component identified at 120 Hz"],
            "detection_status": "Recurring Exceedance",
            "recommended_action": "Municipal enforcement dispatch to inspect rooftop cooling towers and industrial fan units.",
            "review_status": "UNDER_INVESTIGATION",
            "created_at": now - timedelta(days=1),
            "notes": "Logged citizen corroboration on Oct 12th. Environmental officer scheduled."
        })

        self._incidents.append({
            "incident_id": "INC-CBE-2026-002",
            "report_id": "NMA-CBE-002",
            "grid_id": "CBE-105",
            "zone_type": "Silence Zone",
            "reporting_period": "Past 48 Hours",
            "measured_noise_metric": "LAeq_1s",
            "applicable_threshold_dba": 40.0,
            "recorded_exceedance_db": 5.2,
            "valid_sample_count": 65,
            "monitored_nights": 2,
            "likely_sound_category": "Construction",
            "rule_score": 0.81,
            "chronic_noise_score": 71.0,
            "calibration_status": "Calibrated (+2.5 dB applied)",
            "quality_warnings": ["Impulsive peaks detected in night hours"],
            "detection_status": "Requires Verification",
            "recommended_action": "Verify hospital buffer zone construction permits for off-hour road works.",
            "review_status": "UNREVIEWED",
            "created_at": now - timedelta(hours=6),
            "notes": "Automated statistical screen flagged night impact patterns."
        })

        # Seed initial Audit Report
        self._audit_reports.append({
            "report_id": "NMA-CBE-001",
            "reporting_period": "1–7 October 2026",
            "zone_type": "Commercial/Mixed",
            "monitoring_grid": "CBE-101",
            "average_noise_level": "61.8 dB(A) LAeq",
            "applicable_nighttime_limit": "55.0 dB(A)",
            "recorded_exceedance": "6.8 dB",
            "number_of_valid_samples": 120,
            "detection_status": "Requires verification",
            "measurement_confidence": "Medium-High (Calibrated sensor with 7 monitored nights)",
            "recommended_action": "Review measurements and investigate the Gandhipuram hotspot",
            "median_noise_floor_estimate": "56.2 dB(A)",
            "exceedance_percentage": 78.3,
            "chronic_noise_score": 82.4,
            "monitored_nights": 7,
            "nights_with_repeated_exceedance": 6,
            "calibration_status": "Calibrated Against Reference (+2.5 dB offset)",
            "reference_instrument": "Bruel & Kjaer Type 2250 (Class 1 SLM)",
            "measurement_uncertainty": "+/- 1.8 dB (acoustic field estimation limitations apply)",
            "data_coverage": "94.2% across nighttime intervals",
            "quality_warnings": ["High night persistence in commercial corridor"],
            "regulatory_source": "Coimbatore Municipal Corporation (CCMC) Environmental Code 2026",
            "rule_effective_date": "2026-01-01",
            "algorithm_version": "SilentWatch-Core-v1.0-RuleEngine",
            "generated_at": now - timedelta(days=2),
            "privacy_verification_status": "VERIFIED: Zero raw audio recorded or transmitted. Aggregated grid only."
        })

    def save_measurement(self, m: Any) -> Dict[str, Any]:
        data = m.model_dump()
        data["measurement_id"] = f"MEAS-{uuid.uuid4().hex[:8]}"
        data["created_at"] = datetime.utcnow()
        self._measurements.append(data)
        return data

    def get_measurements(self, grid_id: Optional[str] = None, limit: int = 100) -> List[Dict[str, Any]]:
        results = self._measurements
        if grid_id:
            results = [x for x in results if x["grid_id"] == grid_id]
        return sorted(results, key=lambda x: x["timestamp"], reverse=True)[:limit]

    def get_grids(self) -> Dict[str, Any]:
        return self._grids

    def get_incidents(self, grid_id: Optional[str] = None, status: Optional[str] = None) -> List[Dict[str, Any]]:
        results = self._incidents
        if grid_id:
            results = [x for x in results if x["grid_id"] == grid_id]
        if status:
            results = [x for x in results if x["review_status"] == status]
        return sorted(results, key=lambda x: x["created_at"], reverse=True)

    def get_incident_by_id(self, incident_id: str) -> Optional[Dict[str, Any]]:
        for inc in self._incidents:
            if inc["incident_id"] == incident_id:
                return inc
        return None

    def update_incident_status(self, incident_id: str, new_status: str, notes: Optional[str] = None) -> Optional[Dict[str, Any]]:
        for inc in self._incidents:
            if inc["incident_id"] == incident_id:
                inc["review_status"] = new_status
                if notes:
                    inc["notes"] = (inc.get("notes") or "") + f"\n[{datetime.utcnow().strftime('%Y-%m-%d %H:%M')}] {notes}"
                return inc
        return None

    def save_calibration(self, record: Dict[str, Any]) -> Dict[str, Any]:
        self._calibrations.append(record)
        return record

    def get_calibration_history(self) -> List[Dict[str, Any]]:
        return sorted(self._calibrations, key=lambda x: x["calibration_date"], reverse=True)

    def save_audit_report(self, report: Dict[str, Any]) -> Dict[str, Any]:
        self._audit_reports.append(report)
        return report

    def get_audit_reports(self) -> List[Dict[str, Any]]:
        return sorted(self._audit_reports, key=lambda x: x["generated_at"], reverse=True)

    def get_audit_report_by_id(self, report_id: str) -> Optional[Dict[str, Any]]:
        for r in self._audit_reports:
            if r["report_id"] == report_id:
                return r
        return None
