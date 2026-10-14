# Architecture Overview — SilentWatch

SilentWatch is a privacy-preserving urban noise monitoring and municipal audit system designed to detect recurring nighttime noise hotspots and generate municipal evidence records.

## System Architecture

```mermaid
flowchart TD
    subgraph Browser ["Client Browser / Progressive Web App (Offline-First)"]
        Mic[Microphone Hardware] -->|MediaStream| WebAudio[Web Audio API DSP]
        WebAudio -->|Float32Array RAM| Features[Feature Extractor: RMS, ZCR, Centroid, Flatness]
        Features -->|Transient buffer released| RAMDrop[RAM Drop / Buffer Dereferenced]
        Features -->|Acoustic Metrics| RuleClassifier[Non-AI Heuristic Classifier]
        Features -->|A-weighted dB| StatEngine[Statistical Noise-Floor Engine]
        
        StatEngine --> LocalDB[(IndexedDB - Derived Only)]
        RuleClassifier --> LocalDB
        
        LocalDB --> UI[Civic-Tech UI: Dashboard, Heatmap, Screening, Audits]
        UI --> Export[PDF / CSV / JSON Municipal Audit Generator]
    end

    subgraph Backend ["Optional Municipal Backend (FastAPI)"]
        UI -.->|HTTPS Optional Sync (No Audio)| APIRouter[FastAPI Audit Router]
        APIRouter --> PrivacyAudit[Privacy Safeguard Gatekeeper]
        PrivacyAudit --> PostGIS[(PostgreSQL / PostGIS Database)]
    end
```

## Key Modules
1. **Live Environmental Noise Monitor (`LiveMonitor.tsx`, `dsp.ts`)**:
   - Uses Web Audio API `AudioContext` and `AnalyserNode`.
   - Ingests sound directly into temporary `Float32Array` buffers.
   - Calculates RMS, Peak, Spectral Centroid, Dominant Frequency, Spectral Flatness, and Periodicity.
   - Immediately dereferences raw samples. Zero raw audio persists.

2. **Non-AI Sound Classifier (`classifier.ts`)**:
   - Manually designed deterministic heuristics.
   - Transparently categorizes sounds into:
     - `Industrial Machinery` (low centroid < 800 Hz, stable 120 Hz tonal hum, high periodicity)
     - `Construction` (frequent impulsive transient peaks > 8, elevated zero crossing rate)
     - `Traffic` (broadband flat spectrum, mid frequencies)
     - `Speech` (human vocal formant ranges 350-2800 Hz)
     - `Music` (strong harmonic resonance and rhythm)
     - `Unknown` (ambiguous or low-energy baseline)

3. **Interactive Noise Heatmap (`NoiseHeatmap.tsx`)**:
   - Implemented using React Leaflet.
   - Color-coded grids:
     - **Green**: Normal (< 45 dB)
     - **Amber**: Elevated (45 - 65 dB)
     - **Red**: Chronic Hotspot (≥ 65 dB Chronic Score)
     - **Grey**: Insufficient observations
   - Selecting any grid immediately prefills the Municipal Audit Report generator.

4. **Municipal Audit Report Generator (`MunicipalAuditReports.tsx`, `export.ts`)**:
   - Outputs official `Community Noise Pollution Audit Report`.
   - Formats client-side PDF using `jsPDF` and `jspdf-autotable`.
   - Provides CSV and JSON exports for environmental court investigations.
