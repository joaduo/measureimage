# Plan: Unit Tests + E2E Tests

Two phases: **unit tests** (Vitest) then **e2e tests** (Playwright). CI runs both via GitHub Actions.

## Context

Vue 3 + TS + Vite app with Pinia stores and a Konva-based canvas. ~1200 LOC. No test
infrastructure today; `npm run build` is the only verification.

Coverage goal: **70–80% on pure logic** (stores, composables, pure functions).
Canvas components (`CanvasStage.vue`, `MeasureLineShape.vue`, `EndpointMagnifier.vue`)
are covered by e2e, not unit tests.

---

## Phase 1 — Unit tests (Vitest)

### Setup

- Add devDependencies: `vitest`, `@vue/test-utils`, `happy-dom`, `@vitest/coverage-v8`, `pinia` (already present).
- `vite.config.ts`: add `test` block — `environment: 'happy-dom'`, `globals: true`,
  coverage provider `v8` with `include: ['src/stores/**', 'src/composables/**', 'src/types.ts']`
  (or `src/**` minus an explicit `exclude` list for Konva components — decide once, keep threshold honest).
- `package.json` scripts: `test`, `test:watch`, `test:coverage`.
- `tests/setup.ts`: `createTestingPinia` or plain `createPinia`/`setActivePinia` per test;
  stub `localStorage` (happy-dom provides it, but reset between tests) and
  `URL.createObjectURL`/`revokeObjectURL` (not implemented in happy-dom).

### What to test (pure logic — this is the coverage target)

| File | Cases |
|------|-------|
| `src/stores/measure.ts` | `pixelLength` (axis-aligned, diagonal, zero-length); `addLine` assigns id/color cycling through `DEFAULT_COLORS`, auto-selects; `updateLine` patches only existing; `removeLine` clears selection/endpoint/calibration when the removed line was referenced; `select` clears `selectedEndpoint`; `selectEndpoint` ignores unknown lineId; `selectedEndpointPosition` returns position only when line is selected; `referenceLine`/`scaleFactor` null until calibrated, correct factor math, zero-px reference → null; `reset` clears all. |
| `src/stores/settings.ts` | defaults; `setDisplaySize` clamps (lineThickness 1–12, labelSize 10–40), rounds, ignores `NaN`/`Infinity`; `setMagnifierZoom` only accepts {2,4,8}; `setMagnifierSize` clamps 120–320; `locale`/`unit` setters. |
| `src/stores/ui.ts` | defaults; `drawerPinned` read/write `localStorage` under `measureimage.drawerPinned` (incl. initial `false` case); `drawerOpen` follows pin on init; `runAction` executes fn and closes drawer only when unpinned; `requestFit` increments. |
| `src/stores/image.ts` | `setImage` creates object URL, revokes previous, sets element on `img.onload` (mock `Image` or trigger `onload` manually); `clear` revokes and nulls. |
| `src/composables/useScale.ts` | `formatLength` returns `"N px"` uncalibrated, `"X.X unit"` calibrated, honors `calibration.unit`. |

### Light component tests (optional, only if cheap — not counted toward threshold)

- `SelectionBar.vue`, `Toolbar.vue`, `CalibrationDialog.vue`, `SettingsSheet.vue`,
  `UploadScreen.vue` render + emit tests with VTU. Skip any that need a real Konva stage.

### Gate

- `npm run test:coverage` enforces thresholds: `lines: 70, functions: 70, statements: 70`
  over the pure-logic include set. Expect ~90%+ there once written; set 70 as the floor
  so real-world regressions fail but the gate isn't brittle.

---

## Phase 2 — E2E tests (Playwright)

### Setup

- `npm i -D @playwright/test` + `npx playwright install chromium` (Chromium only to start).
- `playwright.config.ts`: `webServer` runs `npm run dev` (or `vite preview` of a build);
  `baseURL: http://localhost:5173`; trace/screenshot on failure.
- `tests/e2e/` directory; add `test:e2e` script.

### Flows (priority order)

1. **Upload + measure** (`upload-measure.spec.ts`)
   - Landing shows `UploadScreen`; upload a fixture image (`tests/fixtures/*.png`, generated small image) via file input.
   - Select measure tool; drag on canvas → a line appears with a pixel-length label.
   - Select/move/delete a line; verify label updates and line count.
   - Pan/zoom the stage; verify line stays anchored to image coordinates.
2. **Calibration** (`calibration.spec.ts`)
   - Draw a line, open calibration dialog, enter real length + unit → labels switch to real units with correct value (e.g. 100 px line = "5.0 cm" when calibrated as 5 cm on a 100 px line → other lines scale consistently).
   - Deleting the reference line reverts labels to px.
3. **Settings + i18n** (`settings-i18n.spec.ts`)
   - Open settings sheet; change unit/locale → UI strings switch en↔es.
   - Change line thickness/label size → reflected on canvas.
   - Drawer pin toggle persists across reload (`localStorage`).

### Helpers

- `canvas` interaction via `page.mouse` (move/down/move/up) against the stage element's
  bounding box — the app renders to a `<canvas>`, so assertions target store-visible DOM
  (labels, selection bar) plus `toHaveScreenshot` sparingly for the canvas itself.
- Keep fixtures deterministic (fixed-size PNG committed to repo).

---

## Phase 3 — CI (GitHub Actions)

`.github/workflows/test.yml` on push/PR:

```yaml
jobs:
  unit:    npm ci → npm run test:coverage
  e2e:     npm ci → npx playwright install --with-deps chromium → npm run test:e2e
  build:   npm ci → npm run build   (existing vue-tsc gate)
```

Upload `playwright-report/` and coverage output as artifacts on failure.

---

## Dependency notes

- Pin versions ≥7 days old; no floating `latest`.
- Vitest version must match Vite 8 compatibility — pin a Vitest release that supports it.
- Update `AGENTS.md` after setup: add `npm run test`, `npm run test:coverage`,
  `npm run test:e2e` to the verification section.
