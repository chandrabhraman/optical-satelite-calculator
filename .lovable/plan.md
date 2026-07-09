## Fix duplicate footprint (tasking only) + finer opacity control

### 1. Hide the flat pyramid base only while tasking is active
The extra square in the top-down view is the **base face** of the sensor pyramid mesh (`createPyramidGeometry`). In normal render it looks fine and shouldn't change. It only becomes visually confusing during Animate Tasking, where it overlaps the accumulating curved trail.

**Fix (scoped to tasking mode)**:
- In `src/utils/threeUtils.ts`, split `createPyramidGeometry` indices so the **base quad** (indices `0,1,2` and `0,2,3`) is placed in its own `addGroup(...)`, separate from the 4 side faces. Keep default behavior identical — geometry still contains both.
- In `src/hooks/useSatelliteVisualization.ts`, when building the sensor pyramid mesh use a **material array** — `[sidesMaterial, baseMaterial]` — where `baseMaterial` is a clone whose `visible` flag we can toggle. Assign group 0 = sides, group 1 = base (via the new `addGroup` calls).
- In `setTaskingHighlight(active, mode)` (already the enter/exit hook for tasking), set `baseMaterial.visible = !active`. When tasking turns off, the base becomes visible again → basic render is unchanged.

No changes to the curved footprint, orbit math, or any other view.

### 2. Finer opacity control
- `src/components/tasking/TaskingPanel.tsx`: Opacity slider `min=1, max=20, step=1`.
- `src/hooks/useSatelliteVisualization.ts` `setTrailIntensity`:
  ```ts
  const v = Math.min(20, Math.max(1, value));
  trailOpacityRef.current = 0.05 + ((v - 1) / 19) * (0.90 - 0.05);
  ```
Existing `applyTrailStyle()` propagates to all live samples.

### Files
- `src/utils/threeUtils.ts` — add material groups to pyramid geometry
- `src/hooks/useSatelliteVisualization.ts` — material array on pyramid; toggle base visibility in `setTaskingHighlight`; remap `setTrailIntensity` to 1..20
- `src/components/tasking/TaskingPanel.tsx` — widen slider

### Validation
- Basic render (tasking panel closed / not recording): pyramid looks exactly as before, base face visible.
- Animate Tasking open + recording: from top-down view only the curved footprint + trail appear; no flat rectangle.
- Closing tasking restores the base.
- Opacity slider gives 20 fine stops between near-transparent and near-opaque.