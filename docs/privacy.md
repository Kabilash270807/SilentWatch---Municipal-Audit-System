# Privacy & Safeguards — SilentWatch

## Zero-Audio Ingestion & Persistence Guarantee

SilentWatch enforces mathematical and architectural boundaries to safeguard civilian audio privacy:

1. **Transient RAM Processing Only**:
   - The microphone stream is attached strictly to a Web Audio API `AnalyserNode`.
   - Audio samples are loaded in temporary `Float32Array` buffers for instantaneous Fast Fourier Transform (FFT) analysis.
   - Arrays are dereferenced every 1000ms. No persistent audio blob is created.

2. **Prohibited Storage Fields**:
   - Both client-side `IndexedDB` schema and backend `FastAPI` Pydantic models explicitly prohibit audio fields (`audio`, `waveform`, `raw_samples`, `recording`).
   - If any API payload contains an audio attribute, the request is immediately rejected with HTTP 400.

3. **Geographic Spatial Coarsening**:
   - High-precision GPS coordinates are never transmitted or displayed.
   - Coordinates are mapped to 500m x 500m urban grid identifiers (`GRID-101`, `GRID-102`), preventing movement tracking or household identification.

4. **No Deep Learning / Biometric Profiling**:
   - No speech-to-text, voice recognition, or speaker diarization models are loaded.
   - Classification is based strictly on transparent, manually designed acoustic heuristics (spectral centroid, flatness, periodicity).
