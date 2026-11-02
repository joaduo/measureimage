# Project verification

- Run `npm run build` to type-check Vue/TypeScript and build the production app, including the PWA service worker.
- Run `npm run test` for unit tests (Vitest + happy-dom) and `npm run test:coverage` for the coverage report; thresholds are enforced on stores/composables in `vitest.config.ts`.
- E2E tests with Playwright are planned (see `plans/unit-tests-e2e.md`) but not yet implemented.
- Canvas interaction changes need manual mouse and touch checks with zoom, pan, and rotation.
