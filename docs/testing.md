# Testing & Verification Guide — SilentWatch

## Test Execution Summary

SilentWatch features comprehensive unit, DSP, statistical, and API test suites for both frontend and backend.

### 1. Frontend Test Suite (Vitest)
Tests acoustic signal processing, IEC 61672 A-weighting approximation, non-AI rule heuristics, logarithmic LAeq energy calculation, and Chronic Noise Score algorithms:

```bash
cd frontend
npm test
```

Results:
- `Acoustic Signal Processing & DSP Functions`: Verified RMS, peak, and IEC 61672 A-weighting curve at 1000 Hz.
- `Non-AI Rule-Based Sound Classification`: Verified industrial machinery tonal clustering, construction transients, and unknown fallback.
- `Statistical Noise Engine`: Verified logarithmic LAeq energy aggregation, median noise floors, and Chronic Noise Score bounds.

### 2. Backend Test Suite (Pytest)
Tests FastAPI REST endpoints, strict rejection of raw audio payloads, calibration calculations, and audit report generation:

```bash
cd backend
python -m pytest tests
```

Results:
- `test_health_endpoint`: Health check and privacy status active.
- `test_privacy_status`: Verifies zero audio storage and zero upload endpoints.
- `test_reject_raw_audio_payload`: HTTP 400 rejection when attempting to submit raw audio arrays or base64 streams.
- `test_calibration_comparison`: Correct offset calculation and status mapping.
- `test_audit_report_generation`: Correct formatting of official Community Noise Pollution Audit Reports.
