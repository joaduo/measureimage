# Reference Line Clarity and Calibration Safety — Plan

## Goal

Make the calibration reference unmistakable and explain that changing its endpoint distance changes the scale used by all other measurements.

## Confirmed decisions

- The reference line is red and continuous, whether selected or not.
- All other measurement lines use non-red colors and short, closely repeated dashes.
- Use line styling rather than a badge to identify the reference.
- Allow reference endpoint editing without confirmation or unlocking.
- Show a persistent warning while the reference is selected, explaining the effect on other measurements.
- Selecting another line and pressing Calibrate makes it the provisional reference immediately.
- Prefill the calibration dialog with that line's current measured value and current calibration unit.
- Canceling the dialog restores the previous reference and calibration.
- Prevent deletion of the reference until another line replaces it.

## Current implementation findings

- `calibration.lineId` identifies the reference, but line rendering does not currently distinguish it.
- The scale factor is computed from the reference's current pixel length, so editing its endpoints already updates other measurements.
- Calibration currently changes only on confirmation; opening the dialog for a different line leaves the numeric field empty.
- Removing the reference currently clears calibration and returns the other measurements to pixels.
- The color palette includes a red-like color, which must no longer be offered for ordinary lines.

## 1. Distinctive reference rendering

- Derive reference styling from reference identity; do not permanently overwrite the line's stored ordinary color.
- Render the reference with a fixed red stroke and no dash pattern.
- Render ordinary lines with non-red colors and a short-dash pattern.
- Proposed starting pattern: approximately 3 CSS pixels per dash, with a small gap adjusted as necessary for the configured line thickness and rounded caps.
- Verify that thick strokes do not close the gaps and make ordinary lines appear continuous.
- Keep apparent dash spacing and stroke thickness consistent during zoom and rotation.
- Preserve the existing dark outline for contrast. Apply the matching dash pattern to the outline so it does not appear as a continuous backing line.
- Keep the hit area continuous and generous even where the visible stroke has gaps.
- Selection highlighting must not remove the red/continuous versus non-red/dashed distinction.
- Keep the reference recognizable when measurement labels are hidden or shown only for the selected line.
- Remove red-like colors from the ordinary palette and normalize any such stored ordinary colors when necessary.
- Hide or disable ordinary color controls while the reference is selected; its visual color is reserved.
- When a reference is replaced, the previous reference returns to its stored non-red color and dashed style.
- Render uncalibrated lines and drawing drafts using the ordinary short-dash style. A first-line calibration candidate can use the provisional red style while its dialog is open.

## 2. Explain reference editing

While the reference is selected, show a persistent, non-modal warning near its selection actions:

> Reference line: changing its length updates all other measurements.

- Keep the warning visible during endpoint editing, including when the magnifier is visible.
- Do not require confirmation before dragging an endpoint.
- Keep the reference's known real-world length unchanged while its endpoints move; recompute the scale and dependent measurements continuously.
- Moving the whole segment preserves its length and must not change the calibration scale.
- Prevent a committed reference from reaching zero endpoint distance. Establish a small positive image-space minimum and verify that rejected movement leaves the handle, stored endpoint, and magnifier aligned.
- Hide the warning when an ordinary line is selected or selection is cleared.

## 3. Provisional recalibration transaction

### Begin

Route every calibration entry point through one shared operation: the first-line flow, toolbar Calibrate, and selection-bar Set as reference.

When opening calibration for an existing measured line:

1. Snapshot the previous calibration before making changes.
2. Calculate the candidate line's current real-world length using the previous scale factor and its pixel length.
3. Prefill the numeric field with that value and the existing calibration unit.
4. Use the unrounded numeric measurement, not the one-decimal formatted label, to avoid introducing scale changes through rounding.
5. Immediately mark the candidate as the provisional red, continuous reference; the old reference becomes ordinary and dashed.
6. Set the provisional known length to the computed value so switching references alone preserves the current scale.

If the candidate is already the reference, prefill its existing known length exactly.

### Confirm

- Accept only finite, positive real lengths and supported units.
- Reject a zero-length candidate before starting or confirming calibration.
- Commit the candidate reference with the submitted length and unit.
- Update the default unit only on successful confirmation.
- Clear the snapshot and close the dialog.
- Apply a newly entered value on confirmation, not on every input keystroke; changing the input must not cause scale flicker while typing.

### Cancel

- Restore the previous calibration exactly, including reference identity, real length, and unit.
- Restore the previous reference's red continuous styling and the candidate's ordinary styling.
- Do not alter the default unit.
- Treat the cancel button and backdrop dismissal consistently.
- Ensure any additional supported dismissal path also rolls back the transaction.

### First calibration and uncalibrated images

- When no prior scale exists, there is no meaningful current real-world value to prefill.
- Proposed behavior: leave the real-length field empty, use the configured default unit, and show the candidate's pixel length as a separate informational hint.
- Do not reinterpret the pixel count as a real-world length.
- Mark the candidate provisionally without creating a fabricated scale; other lines remain in pixels until confirmation.
- Canceling leaves the candidate line in place, removes the provisional reference mark, and keeps all measurements uncalibrated.
- Once confirmed, the line remains red and continuous and becomes protected from deletion.

## 4. Protect reference deletion

- Disable the delete action when the committed reference is selected.
- Provide a visible explanation: `Calibrate another line before deleting the reference.`
- Enforce the same rule in the measurement store so alternate callers cannot bypass the UI.
- Ordinary lines remain deletable as before.
- After another reference is confirmed, the former reference can be deleted normally.
- Do not allow canvas editing or deletion underneath an open calibration modal.
- Replacing the image or resetting the session may still clear all measurements and calibration through the existing replacement/reset flow; deletion protection applies to individual line deletion.
- Clear any pending calibration snapshot when the session is reset so it cannot restore a reference from the previous image.

## 5. State and component changes

- Measurement store: shared begin/confirm/cancel calibration operations, previous-calibration snapshot, provisional reference identity, reference-deletion guard, and reference-length validation.
- Keep provisional visual identity separate from a usable calibrated scale when no previous calibration exists.
- Calibration dialog: use the shared transaction, prefill precise current values, show the uncalibrated pixel hint, and handle validation and rollback consistently.
- Canvas line component: derive red/continuous or ordinary/dashed styling for both the visible stroke and contrast outline; preserve continuous hit testing.
- Canvas draft: use the ordinary dash style until it becomes a calibration candidate.
- Selection bar: reference-edit warning and reserved-color behavior.
- Toolbar: disable reference deletion and expose the reason.
- Reset flow: clear committed and provisional calibration state together.
- Route new UI text through the existing localization mechanism, keeping new artifact strings in English according to repository policy.

## Implementation sequence

1. Add regression coverage for recalibration, cancellation, scale preservation, and deletion protection using the test infrastructure available at implementation time.
2. Implement the shared calibration transaction and store invariants.
3. Update all calibration entry points and dialog behavior.
4. Implement reference and ordinary line styling, including matching outlines and stable hit areas.
5. Add the editing warning and disabled-delete explanation.
6. Verify mouse/touch editing, zoomed rendering, calibration lifecycle, and production build.

## Acceptance criteria

- Exactly one committed reference is red and continuous after successful calibration.
- A provisional candidate replaces the old line's reference styling immediately when Calibrate opens.
- Ordinary lines never use the reserved red color and remain visibly short-dashed at supported thicknesses and zoom levels.
- Outline rendering does not fill the visible gaps, and selecting or dragging through a gap still works.
- Reference recognition does not depend on label visibility or selection.
- Selecting the reference explains that changing its length updates other measurements.
- Moving a reference endpoint updates dependent measurements while preserving its known real length.
- Translating the complete reference leaves all measured lengths unchanged.
- Recalibrating another line prefills its precise current value and preserves the existing scale until confirmation of a different value.
- Canceling restores the original reference, scale, and units without numeric drift.
- The first calibration never presents a pixel count as a real-world value.
- Reference deletion is blocked in both the UI and store; deletion becomes available after a replacement reference is confirmed.
- No pending transaction survives image replacement or session reset.
- Endpoint editing and the magnifier continue to agree on the exact endpoint position.

## Verification

- Test first calibration, first-calibration cancellation, same-line recalibration, switching references, and rollback.
- Test precise prefill values that would be rounded by ordinary measurement labels.
- Test invalid numeric values, zero-length candidates, and endpoint collapse prevention.
- Test reference deletion through the toolbar and directly through the store.
- Test line outlines, dash gaps, and hit testing at minimum and maximum thickness with zoom, pan, and rotation.
- Test hidden labels, selected-only labels, selection changes, endpoint dragging, body dragging, and magnifier behavior.
- Test reset/image replacement while a provisional calibration exists.
- Run `npm run build` and the relevant automated checks available at implementation time.

## Remaining detail

The proposed first-calibration behavior (empty real-length field plus a separate pixel-length hint) has not yet been explicitly confirmed. There is no previous real-world scale from which to derive a valid prefilled value.
