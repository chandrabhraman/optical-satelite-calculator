## Goal
Make the recorded tasking trail behave like a real satellite swath: fixed on the Earth from the moment recording starts, exactly aligned to the calculated sensor footprint, visibly translucent across an opacity range, and configurable with preset/custom colors. Also let the user freely pan, rotate and zoom the 3D view during recording.

## Root cause to fix
- The trail is generated from a separate rectangular approximation using nadir + along/cross vectors, while the live footprint uses `createCurvedFootprint(...)`. The two paths disagree, so trail width looks larger than the actual footprint.
- Trail samples are added to the world scene, not to the rotating Earth, so the starting point drifts across the globe imagery instead of staying pinned to the ground.
- Blending/opacity ranges are too narrow, so the slider does not read as transparent-to-opaque.
- `frameTaskingView` continuously re-targets `controls.target` and re-positions the camera each frame while recording, which fights the user's mouse interaction and snaps the view back to the satellite.

## Implementation plan

1. **Camera freedom while recording**
   - Remove the automatic `frameTaskingView` camera lerp during recording.
   - Keep the user's current OrbitControls state untouched: allow pan, rotate, and zoom throughout recording.
   - Only do a one-time optional "frame the satellite" nudge when recording starts, then hand control back to the user. No re-centering per frame.
   - Re-enable `controls.autoRotate = false` on record start but do not force target changes afterwards.

2. **Use the footprint geometry as the source of truth**
   - Derive each persistent trail sample from the same geometry produced by `createCurvedFootprint(...)` (clone its vertices/mesh), instead of building a separate rectangle from along/cross vectors.
   - Result: trail width and shape exactly match the visible sensor footprint.

3. **Anchor trail samples to the rotating Earth**
   - Parent the persistent trail group to the Earth mesh (`earth.add(trailGroup)`) instead of the global scene.
   - Convert each footprint sample's world vertices into Earth-local coordinates (`earth.worldToLocal`) before adding.
   - Effect: recording start point remains fixed on the mapped globe as Earth rotates and as the satellite continues.

4. **Cumulative trail from record start**
   - Clear the trail only on: recording start, mode change during a session, or recording stop.
   - Never remove old samples based on the slider.
   - Keep a large safety cap (performance only), unrelated to opacity.

5. **Visible opacity control**
   - Switch trail materials to `NormalBlending` with `transparent: true`, `depthWrite: false`.
   - Map slider 1..5 to opacity ~0.08..0.85 so transparency reads clearly against Earth.
   - Rename the panel control to **Opacity**; changes update all existing trail materials immediately.

6. **Configurable trail color (Presets + custom)**
   - Add a color row in `TaskingPanel`: preset swatches (cyan, emerald, amber, magenta, red, ice-white) + a native `<input type="color">` for custom.
   - Store `trailColor` in `SatelliteVisualization` state; pass into `useSatelliteVisualization` via a new setter `setTaskingTrailStyle({ color })`.
   - Apply the selected color to (a) the live footprint highlight while recording and (b) all new trail samples. Update existing samples' color when the user changes it.

7. **Mode-specific persistence, still footprint-accurate**
   - **Pushbroom:** clone the current footprint mesh at each sample tick and stitch to build a continuous swath.
   - **Whiskbroom:** animate the live beam visually, but persist only real footprint-sized marks so the persisted trail never exceeds the true footprint envelope.
   - **Frame:** drop a footprint-sized frame at each capture interval.

8. **Validation**
   - Flow: Calculate → Run Simulation → Animate Tasking → pick mode/color/opacity → Record.
   - Verify:
     - User can freely rotate/pan/zoom during recording without the camera snapping back.
     - Trail start point stays fixed on Earth as it rotates.
     - Trail width matches the live sensor footprint exactly.
     - Opacity slider visibly changes translucency.
     - Chosen preset/custom color appears on both live footprint and persisted trail.
     - Corner "REC" overlay and Stop & Save still work; watermark still present in export.