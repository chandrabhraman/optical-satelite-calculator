## Goal

Add an "Animate Tasking" feature directly inside the existing `SatelliteVisualization` card on the home page (`/`). No new page section, no layout changes — a compact control cluster that overlays the 3D scene and drives an animated scan simulation on a dedicated 2D canvas layered over the Three.js view. Includes local recording via MediaRecorder.

## UX

Inside the card header (next to the Snapshot button), add a small **"Animate Tasking"** toggle button. When ON:

- A slim control strip appears docked to the bottom of the visualization area (glassmorphism, matches existing aesthetic):
  - **Scan mode** pill group: `Pushbroom` · `Whiskbroom` · `Frame`
  - **Channel** dropdown: `RGB` · `NIR` · `SWIR`
  - **● Record** button (turns into `■ Stop & Save` while recording, with a red pulse dot)
- A transparent 2D canvas is layered over the Three.js scene showing the scan beam / captured swath overlay tied to the current satellite position.
- Toggle OFF hides the strip, clears the overlay canvas, and cancels any active recording.

## Scan animations (2D overlay canvas)

All three modes render onto a canvas sized to the visualization container, sampling the satellite's screen-space position from the existing Three.js scene each frame:

- **Pushbroom**: thin bright line perpendicular to the satellite's ground-track direction, projected from satellite down to the ground point. A persistent "captured swath" trail accumulates behind it, tinted by the active channel.
- **Whiskbroom**: narrow spotlight cone that sweeps left↔right across-track at ~2 Hz while the satellite advances, leaving small captured tiles in a raster pattern.
- **Frame**: dashed rectangular footprint follows the satellite; every ~1.2 s a shutter flash fills the rectangle and drops a captured frame tile onto the swath layer.

Channel palettes applied to newly captured pixels:
- RGB → natural greens/blues
- NIR → vegetation shifted to crimson/red, water dark
- SWIR → soil browns, water near-black, vegetation muted olive

Switching mode or channel clears in-flight scan state but keeps prior captured trail faded (so users see the transition).

## Recording

- `overlayCanvas.captureStream(60)` fed into `MediaRecorder`.
- Prefer `video/webm;codecs=vp9`, fall back to `video/webm;codecs=vp8`, then `video/webm`.
- Chunks pushed on `ondataavailable`; on stop, assemble Blob, create object URL, trigger auto-download as `satellite_imaging_simulation.webm`, revoke URL.
- Stopping mid-flight, toggling Animate Tasking off, or unmounting the component all cleanly stop the recorder and release the stream.

## Files

New:
- `src/components/tasking/TaskingOverlay.tsx` — the transparent canvas + rAF loop that draws the active scan mode using the satellite's screen position (obtained via a new ref exposed from `useSatelliteVisualization`) and the current channel palette.
- `src/components/tasking/TaskingControls.tsx` — the bottom control strip (mode pills, channel select, record button).
- `src/hooks/useTaskingRecorder.ts` — MediaRecorder lifecycle: `start(canvas)`, `stop()`, auto-download, MIME negotiation, cleanup.
- `src/utils/scanPalettes.ts` — RGB/NIR/SWIR color helpers used by the overlay.

Edited:
- `src/components/SatelliteVisualization.tsx` — add `animateTasking` state + header toggle button; render `TaskingOverlay` and `TaskingControls` inside the visualization area only when ON; pipe mode/channel state down.
- `src/hooks/useSatelliteVisualization.ts` — expose a small `getSatelliteScreenPosition()` helper (project the satellite's world position into container-relative pixel coords using the existing camera) so the 2D overlay can anchor beams accurately. No changes to orbit/propagation math.

Nothing else on the page changes. No routing, no new page, no backend.

## Technical notes

- Overlay canvas sits absolutely positioned over `VisualizationContainer`, `pointer-events-none` so orbit controls still work.
- rAF loop lives in `TaskingOverlay`, cancelled on unmount / when tasking toggled off.
- Recording captures only the overlay canvas per user's earlier preference for a clean output; can be swapped to a compositor canvas later if they want the Earth included.
- All colors/pill styles use existing tokens (`primary`, `accent`, `muted`, `glassmorphism`) — no hardcoded hex.
