# MeasureImage

A browser app for taking proportional measurements on an image. Load a picture,
draw lines over features you want to measure, then calibrate one line against a
known real-world length — every other line is instantly reported in real units
(mm, cm, m, in). Works offline as an installable PWA.

## Features

- Upload any image and measure distances by dragging lines on the canvas
- Two tools: **navigate** (pan / zoom / rotate the image) and **measure** (draw lines)
- Endpoint magnifier for precise line placement, with configurable zoom and size
- Calibration: pick a reference line, enter its real length and unit, and all
  measurements convert from pixels to real units
- Selection bar to edit, restyle or delete lines
- Adjustable display settings: line thickness, label size, label visibility
- English / Spanish UI (vue-i18n)
- PWA: installable and offline-capable via service worker

## Tech stack

- [Vue 3](https://vuejs.org/) + TypeScript + [Vite](https://vite.dev/)
- [Pinia](https://pinia.vuejs.org/) for state (`src/stores/`)
- [Konva](https://konvajs.org/) via `vue-konva` for the canvas stage
- [Tailwind CSS 4](https://tailwindcss.com/)
- [vite-plugin-pwa](https://vite-pwa-org.netlify.app/)
- [Vitest](https://vitest.dev/) + happy-dom for unit tests

## Getting started

Requires Node.js 22+ (CI uses Node 22; Node 24 works locally).

```sh
npm ci
npm run dev      # dev server at http://localhost:5173
```

## Testing

Unit tests live in `tests/unit/` and cover the app logic (Pinia stores,
composables) — canvas components are excluded from the coverage target and are
verified manually.

```sh
npm run test            # run unit tests once
npm run test:watch      # watch mode
npm run test:coverage   # coverage report (thresholds: 70% on stores/composables)
```

Coverage config lives in `vitest.config.ts`. The same suite runs in GitHub
Actions on every push to `main` and every pull request (`.github/workflows/test.yml`).

Playwright e2e tests are planned but not yet implemented — see
`plans/unit-tests-e2e.md`.

## Build

```sh
npm run build     # type-checks (vue-tsc) and builds production bundle + service worker
npm run preview   # serve the production build locally
```

Note: canvas interactions (drawing, endpoint dragging, pinch zoom/rotate) are
not covered by automated tests — verify them manually with mouse and touch.

## Project structure

```
src/
  components/     Vue components (CanvasStage, Toolbar, dialogs, ...)
  composables/    useScale (px → real-unit formatting)
  i18n/           en/es locale files
  stores/         Pinia stores: image, measure, settings, ui
  types.ts        Shared types (MeasureLine, Calibration, Unit)
tests/
  unit/           Vitest unit tests for stores and composables
  setup.ts        Test setup (fresh Pinia, localStorage, URL spies)
plans/            Design/implementation plans
```
