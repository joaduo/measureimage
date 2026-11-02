# Left Drawer Toolbar — Plan

Rework the toolbar into a collapsible left-edge drawer so the canvas is
free for manipulation. Same behavior on mobile and desktop.

## Behavior

### States
- `drawerOpen: boolean` — drawer visible or hidden.
- `drawerPinned: boolean` — persisted in `localStorage`
  (`measureimage.drawerPinned`). Default: `true` (starts pinned/open so
  first-time users discover the tools).
- On load: `drawerOpen = drawerPinned` (unpinned users start collapsed).

### Drawer (open)
- Vertical rail docked to the **left edge**, full height, overlaying the
  canvas (does not resize the stage). Same width as the current buttons
  need; uses existing styling (`bg-gray-800/90`, rounded on the free
  edge only).
- Contents, top to bottom:
  1. **Pin toggle** (📌) at the top — reflects `drawerPinned`; toggling
     off keeps the drawer open until the next action or tap-outside.
  2. Navigate ✋
  3. Measure 📏
  4. Fit ⤢
  5. Calibrate ⌖ (disabled without selection)
  6. Delete 🗑 (disabled without selection)
  7. Replace image 🖼
  8. Settings ⚙
- Slide-in transition from the left (CSS transform, ~200 ms).

### Collapsed handle (closed)
- A thin vertical **tab on the left edge, near the top-left** — small
  handle (~8–12 px wide, ~48 px tall, rounded right corners, chevron
  `›` glyph), translucent, always visible above the canvas.
- Tap/click opens the drawer. Also draggable optional — out of scope.

### Auto-close rule
- When `drawerPinned === false`, **any** toolbar action closes the
  drawer after executing: tool selection, Fit, Calibrate, Delete,
  Replace image, and Settings (the settings sheet opens on top either
  way).
- When `drawerPinned === true`, actions keep the drawer open.
- Tapping outside the drawer (on the canvas) closes it when unpinned;
  when pinned, outside taps do not close it.
- `Esc` closes when unpinned (desktop nicety, cheap to add).

## State changes (`useUiStore`)

```ts
const drawerOpen = ref(true)
const drawerPinned = ref(localStorage.getItem('measureimage.drawerPinned') !== 'false')

watch(drawerPinned, v => localStorage.setItem('measureimage.drawerPinned', String(v)))

function runAction(fn: () => void) {
  fn()
  if (!drawerPinned.value) drawerOpen.value = false
}
```

`Toolbar.vue` wraps every button handler in `ui.runAction(...)`.

## Layout changes

- `App.vue`: remove the bottom-centered toolbar wrapper; render
  `<Toolbar>` as a fixed left overlay plus the collapsed tab handle.
  Canvas keeps `position: fixed; inset: 0` — no layout shift.
- `Toolbar.vue`: becomes the drawer + handle component (or split into
  `ToolbarDrawer.vue` + `DrawerTab.vue`; single file is fine at this
  size).
- `SelectionBar.vue`: verify it doesn't overlap the left rail; shift
  right if needed.

## i18n

New keys in `en.json` / `es.json`:
- `toolbar.pin` / `toolbar.unpin` — pin toggle label + tooltip.
- `toolbar.openTools` — aria-label for the collapsed tab.

## Technical notes

- Keep buttons reachable by thumb: vertical stack, same `min-w-12`
  sizing; on narrow screens cap width ~72 px.
- `pointer-events`: drawer and tab are `pointer-events-auto`; the
  container wrapper stays `pointer-events-none` so the canvas is never
  blocked.
- Safe-area: pad the rail for `env(safe-area-inset-left/top)` on iOS.
- Tap-outside: listen on the stage/pointerdown; ignore events
  originating inside the drawer.
- Persisting the pin is a deliberate exception to the session-only rule
  in `measure-image.md` — it's UI chrome preference, not measurement
  data.

## Steps

1. `ui.ts` — `drawerOpen`, `drawerPinned` (+localStorage), `runAction`.
2. `Toolbar.vue` — convert to left drawer: pin toggle, vertical button
   stack, slide transition, collapsed tab handle.
3. `App.vue` — reposition toolbar; remove bottom bar layout.
4. Tap-outside + Esc close (unpinned only).
5. i18n keys (en/es).
6. QA: mobile viewport, pinned vs unpinned flows, SelectionBar overlap,
   reload restores pin state.

## Out of scope

- Dragging the tab to reposition it.
- Swipe-from-edge gesture to open (native conflicts; revisit if needed).
- Splitting selection actions out of the drawer.
