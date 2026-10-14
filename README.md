# SilentWatch — Privacy-Preserving Urban Noise Monitoring & Municipal Audit System

SilentWatch is a complete, full-stack, responsive web application and civic-tech platform that enables communities to monitor environmental noise, detect recurring nighttime noise exceedances, and generate formal evidence summaries for municipal environmental investigation.

## Key Features

- **Genuine Live Browser Noise Monitoring**: Real-time microphone input via Web Audio API, calculating RMS, peak amplitude, noise floor, and A-weighted sound level estimates.
- **Strict Privacy Safeguards (Zero Raw Audio)**: Raw audio is processed in temporary RAM buffers and released immediately. No recordings, waveforms, or voiceprints are ever saved or uploaded.
- **Non-AI, Rule-Based Sound Classification**: 100% transparent, deterministic signal processing heuristics categorizing sounds into Industrial Machinery, Construction, Traffic, Speech, Music, or Unknown.
- **Interactive Leaflet Noise Heatmap**: Coarse geographic grid aggregation (`GRID-101` to `GRID-105`) with color-coded hotspots and 1-click audit report generation.
- **Statistical Noise Engine & Chronic Noise Score**: Energy-based continuous equivalent sound level ($L_{\text{Aeq}}$), rolling median noise floors, and an explainable Chronic Noise Score (0 to 100).
- **Nighttime Violation Screening Table**: Sortable, filterable preliminary compliance screening against configurable municipal regulatory limits (22:00 – 06:00).
- **Municipal Audit Report Generator**: Produces formal **Community Noise Pollution Audit Reports** with client-side PDF, CSV, and JSON downloads matching official civic requirements.
- **Calibration & Data Quality Centre**: Guided offset calibration workflow against reference Class 1 sound-level meters with repeatability verification.
- **Offline-First Architecture**: IndexedDB persistence for all derived observations and calibrations with zero cloud dependencies required for core monitoring.

---

## Verified Quick Start Instructions

### Prerequisites
- Node.js v18+ and npm
- Python 3.10+ (Tested on Python 3.14)

### 1. Frontend Setup & Startup

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Run automated Vitest suite
npm test

# Build production bundle
npm run build

# Start local development server (http://localhost:5173)
npm run dev
```

### 2. Backend Setup & Startup (Optional Municipal Sync)

```bash
# Navigate to backend
cd backend

# Install dependencies
python -m pip install -r requirements.txt

# Run automated Pytest suite
python -m pytest tests

# Start FastAPI server on port 8000
python -m uvicorn app.main:app --reload --port 8000
```

---

## Verification & Test Results

- **Frontend Tests (`npm test`)**: 10/10 tests passing across DSP features, IEC 61672 A-weighting, non-AI heuristics, and statistical scoring.
- **Frontend Build (`npm run build`)**: Vite TypeScript compilation completed cleanly.
- **Backend Tests (`python -m pytest tests`)**: 6/6 tests passing verifying privacy enforcement, raw audio payload rejection, and audit report generation.

---

## License
MIT Civic Technology License. Designed for municipal environmental protection and community health audits.
