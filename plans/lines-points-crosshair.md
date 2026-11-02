# Precise Endpoint Placement — Magnifier Plan

## Goal

Help users place measurement endpoints precisely by showing a magnified image viewport with a crosshair at the exact active endpoint position.

## Confirmed product decisions

- Place the magnifier in the top-right corner of the canvas.
- Keep it visible while an endpoint is selected, including after dragging ends.
- Show only the image and crosshair inside the magnifier: no measurement lines, labels, or endpoint handles.
- Make magnification configurable in Settings.
- Support both editing existing endpoints and drawing new measurement lines.

## Proposed interaction

### Editing an existing line

1. Select a line to reveal its endpoint handles.
2. Press an endpoint handle to select that endpoint and open the magnifier immediately.
3. Drag the endpoint; update the magnifier continuously so the crosshair remains centered on the endpoint's exact image coordinates.
4. Release the pointer; keep the magnifier visible for inspection.
5. Press the other endpoint to switch the magnifier target.

Proposed deselection rules, pending confirmation:
- Tapping empty canvas, selecting another line, deleting the active line, or replacing the image clears the endpoint selection and hides the magnifier.
- Selecting a line body does not automatically choose an endpoint.
- Changing tools clears the endpoint selection.
- Panning, zooming, or rotating the canvas preserves the active endpoint when the tool does not change.

### Drawing a new line

1. Begin drawing using the existing measure gesture.
2. Show the magnifier centered on the moving draft endpoint.
3. Keep the magnifier updated throughout the drawing gesture.
4. When the line is committed, propose retaining its final endpoint as the selected endpoint.
5. Hide or suspend the magnifier while a calibration dialog covers the canvas; restore it afterward if the target remains valid.
6. Canceling the draft clears its magnifier target.

The initial endpoint remains positioned by the existing drawing gesture; it can be refined afterward using endpoint editing. A separate two-tap drawing mode is outside this change.

## Magnifier presentation

- Proposed viewport size: 160 × 160 CSS pixels, reduced as needed on narrow or short screens.
- Respect safe-area insets and avoid overlapping essential controls.
- Render a border and subtle background so the viewport remains distinguishable from the main image.
- Make the viewport non-interactive so it cannot capture drawing or navigation gestures.
- Center the exact image-space endpoint on a fixed crosshair.
- Clip rendering to the viewport and show a neutral background outside image bounds rather than stretching or shifting the image.
- Preserve the current canvas rotation so magnified movement matches the direction seen in the main view.

### Crosshair contrast

- Preferred treatment: a negative-style crosshair using a supported difference compositing mode.
- Validate visibility over bright, dark, gray, and detailed image regions; inversion alone can have poor contrast on mid-gray backgrounds.
- If inversion is insufficient or inconsistent across browsers, use a dual-tone black-and-white crosshair.
- Keep the intersection geometrically aligned with the exact endpoint; styling must not introduce an offset.
- Keep the crosshair at a constant screen-space size regardless of magnification.

## Settings

- Add a magnifier zoom control using the existing session-only Settings store.
- Proposed options: 2×, 4×, and 8×, with 4× as the default.
- Proposed interpretation: magnification relative to the main canvas zoom.
- Changing the setting updates an already visible magnifier immediately.
- Reject unsupported or invalid values.

The options, default, and relative-versus-image-space interpretation require confirmation before implementation.

## Technical approach

### State and ownership

- Track the selected endpoint as a line ID plus endpoint key (`a` or `b`), separately from line selection.
- Represent a draft endpoint as a temporary magnifier target rather than an existing line ID.
- Derive the magnifier center from the current store endpoint or current draft point; do not maintain an independently updated copy of endpoint coordinates.
- Clear invalid targets when their line is deleted or the image or measurements are reset.

### Rendering

- Add a dedicated magnifier component integrated with CanvasStage.
- Prefer a separate, non-listening canvas with its own clipping and transforms so the magnifier does not inherit the main world's position or scale unintentionally.
- Reuse the loaded image element; do not crop into new image buffers on every pointer move.
- Translate the target image coordinate to the viewport center, then apply the chosen scale and rotation consistently.
- Render the crosshair in viewport coordinates independently of the image transform.
- Account for device pixel ratio to keep the image and crosshair sharp.

### Input integration

- Extend endpoint handle press events to activate the appropriate magnifier target for mouse and touch.
- Preserve existing drag coordinate conversion, line-body dragging, and canvas gesture isolation.
- Update the draft magnifier target through the existing drawing state.
- Handle pointer release, gesture cancellation, and component teardown without stale targets.
- Define multi-touch behavior explicitly: proposed behavior is to cancel a draft as today and suspend endpoint editing rather than move an endpoint and navigate simultaneously.

## Implementation steps

1. Inspect current endpoint events, drawing lifecycle, selection state, settings, and modal behavior before changing code.
2. Add selected-endpoint state and target lifecycle rules.
3. Implement the isolated image viewport and contrast-safe crosshair.
4. Wire existing endpoint editing and draft drawing into the magnifier target.
5. Add the bounded magnification setting.
6. Verify coordinate accuracy, gesture behavior, layout, and rendering performance.

## Acceptance criteria

- Pressing either endpoint opens the magnifier at that exact endpoint.
- The crosshair stays aligned with the endpoint before, during, and after dragging.
- Releasing a drag keeps the viewport visible while the endpoint remains selected.
- New lines show the moving draft endpoint without changing the drawing gesture.
- Only the source image and crosshair appear inside the viewport.
- Zoom, pan, and rotation do not introduce crosshair drift or alter measurement values.
- Changing magnification does not move the selected endpoint.
- Image edges and corners remain accurately centered even when the viewport includes space outside the image.
- Deleting lines, replacing the image, canceling drafts, and dismissing calibration dialogs do not leave stale content.
- The magnifier does not capture pointer events or interfere with line dragging or canvas navigation.
- Rendering remains responsive on touch devices without allocating new image buffers per move.

## Verification

- Run `npm run build` for Vue/TypeScript and production/PWA verification.
- Check coordinate mapping at multiple canvas scales and rotations, including image corners.
- Manually test mouse and touch: endpoint press, drag, release, switching endpoints, deselection, and new-line drawing.
- Test multi-touch interruption and calibration dialog transitions.
- Check crosshair contrast on white, black, mid-gray, and textured image regions.
- Check small screens, safe areas, and high-DPI displays.

## Remaining questions

1. Should zoom be relative to the main canvas or fixed relative to the original image? relative to the main canvas
   Are 2×, 4×, and 8× with a 4× default suitable? YES
2. Are the proposed endpoint deselection rules appropriate, including clearing selection on tool changes? YES
3. After drawing a line, should its final endpoint remain selected, keeping the magnifier visible?
4. Is a 160 × 160 pixel viewport suitable, or should it be larger or configurable?
