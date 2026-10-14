# Calibration & Uncertainty Guide — SilentWatch

## Acoustic Offset Determination

Standard consumer smartphone microphones and laptop audio inputs exhibit non-linear hardware variations and uncalibrated gain circuits. SilentWatch uses an empirical reference calibration procedure:

$$\text{Calibration Offset} = L_{\text{reference}} - L_{\text{phone}}$$

Where:
- $L_{\text{reference}}$: Sound pressure level measured by a calibrated reference instrument (e.g. Bruel & Kjaer Type 2250 Class 1 SLM).
- $L_{\text{phone}}$: Raw uncalibrated sound level estimate derived by SilentWatch Web Audio node.

$$\text{Corrected Level } L_{\text{corrected}} = L_{\text{phone}} + \text{Offset}$$

## Acceptance & Repeatability Criteria
1. Stable Acoustic Field: Steady pink noise or ambient drone between 50 dB(A) and 70 dB(A).
2. Repeatability Check: Two successive measurements must not diverge by more than 0.5 dB.
3. Limitations: Single-point offset compensation does not replace certified laboratory certification under IEC 61672-1. All uncalibrated readings are clearly labeled **Uncalibrated sound-level estimate**.
