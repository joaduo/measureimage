# Measure Image — Plan

Mobile-first web app to take proportional measurements on an uploaded image.
The user draws a reference line with a known real-world length; every
subsequent line is measured proportionally against it (2D plane assumption).

## Stack

- **Vue 3** (Composition API, `<script setup>`)
- **Vite** + **TypeScript**
- **Pinia** — app state (image, lines, calibration, tool, settings)
- **Tailwind CSS v4** — mobile-first styling (`@tailwindcss/vite`)
- **vue-konva** (Konva.js) — canvas stage with zoom/pan/rotate and
  hit-testing for draggable line endpoints
- **vue-i18n** — English + Spanish
- **vite-plugin-pwa** — installable, offline-capable
- Session-only state: nothing persisted; each load starts clean

## Core features

### 1. Image loading
- Landing screen with a single "Upload image" action
  (`<input type="file" accept="image/*">`, `capture` friendly for camera).
- One image per session. A toolbar button can replace the image; this
  discards all measurements after a confirmation dialog.

### 2. Infinite-canvas navigation
- Konva `Stage` covering the viewport; the image lives in a `Layer` that
  acts as the "world" (infinite canvas feel: pan is unbounded).
- Touch gestures:
  - **One-finger drag**: pan (when the navigate tool is active).
  - **Pinch**: zoom toward the pinch midpoint.
  - **Two-finger twist**: rotate the whole world (image + lines rotate
    together; measurements are unaffected since everything transforms
    uniformly).
- Mouse fallback for desktop: wheel zoom, drag pan.
- Toolbar tool "Navigate" activates this mode. Double-tap or a "fit"
  button resets to fit the image on screen.

### 3. Measuring (draw tool)
- Toolbar tool "Measure". Tap-and-drag draws a line segment; release
  commits it.
- Each line stores its two endpoints in **image coordinates** so zoom /
  pan / rotation never corrupt measurements.
- Length in real units = `pixelLength × (referenceReal / referencePixels)`.
- Value label rendered next to each line (e.g. `12.4 cm`), counter-rotated
  at render time so text stays readable regardless of world rotation.

### 4. Calibration (reference)
- Both flows supported:
  - The **first** committed line automatically opens a dialog asking for
    its real length + unit → becomes the reference.
  - A **Calibrate** toolbar button (or context action on a selected line)
    lets any existing line be set as the new reference at any time.
- Until a reference exists, lines display raw pixel lengths (`px`).
- Units: fixed list `mm`, `cm`, `m`, `in`. Stored once globally;
  all labels share it.

### 5. Selection & editing
- Tap a line → select it (highlight + endpoint handles shown).
- Drag an **endpoint handle** to move that point; drag the **line body**
  to move the whole segment.
- Selected line exposes a small action set: change color (preset palette),
  set as reference, delete.
- Toolbar **trash** button deletes the selected line (disabled otherwise).

### 6. Toolbar
Bottom-docked, minimal, thumb-friendly:
`[Navigate] [Measure] [Replace image] [Calibrate] [Trash] [Settings ⚙]`

### 7. Settings (gear)
Modal/bottom-sheet with:
- Language: English / Español (`vue-i18n`, `en`/`es` locale JSON files).
- Default unit display (from the fixed list).
- Theme is out of scope for MVP (follow system).

## Data model (Pinia)

```ts
interface Point { x: number; y: number }           // image coords
interface MeasureLine {
  id: string;
  a: Point;
  b: Point;
  color: string;
}
interface Calibration {
  lineId: string;
  realLength: number;
  unit: 'mm' | 'cm' | 'm' | 'in';
}
```

Stores:
- `useImageStore` — loaded `HTMLImageElement`/blob URL, replace flow.
- `useMeasureStore` — lines, selectedLineId, calibration; computed
  `displayLength(line)` applying the scale factor.
- `useUiStore` — active tool (`navigate | measure`), dialog states.
- `useSettingsStore` — locale, unit.

## Architecture sketch

```
src/
  components/
    CanvasStage.vue      // Konva stage, gestures, world transform
    MeasureLineShape.vue // line + endpoint handles + label
    Toolbar.vue
    CalibrationDialog.vue
    SettingsSheet.vue
    UploadScreen.vue
  stores/ (image, measure, ui, settings)
  composables/
    useGestures.ts       // pinch-zoom / twist-rotate math
    useScale.ts          // px → real unit conversion
  i18n/ (en.json, es.json)
  App.vue
```

## Technical notes

- Gesture math: Konva stage `scale` + `rotation` + `position` driven from
  pointer events; pinch zoom keeps the midpoint fixed; twist uses
  `atan2` delta between the two pointers.
- Coordinate conversion: pointer positions must be mapped through the
  stage's inverse transform before storing points (image space).
- Labels: keep constant on-screen size by dividing font size by stage
  scale; counter-rotate by `-stage.rotation()`.
- PWA: `vite-plugin-pwa` with a minimal manifest + auto-update SW; all
  logic is client-side so offline works trivially once installed.
- File size: downscale very large photos (e.g. > 4096px) into an
  offscreen canvas blob before displaying, to protect mobile perf.

## Milestones

1. **Scaffold** — Vite + Vue3 + TS + Tailwind + Pinia + vue-konva + i18n +
   PWA config.
2. **Upload + canvas** — image load, fit-to-screen, pan/pinch/rotate.
3. **Drawing** — measure tool, lines in image coords, labels.
4. **Calibration** — first-line dialog, fixed units, proportional labels,
   recalibrate action.
5. **Editing** — select, drag endpoints, drag body, recolor, delete.
6. **Toolbar + settings** — full toolbar, settings sheet, en/es.
7. **PWA polish** — manifest, icons, offline check, image downscaling,
   mobile QA.

## Open questions / future ideas (out of MVP)

- Persistence (IndexedDB projects), PNG/CSV export.
- Areas/perimeters, angle measurement.
- Multiple images, undo/redo.
- Snap guides / magnifier loupe for precise endpoint placement.
