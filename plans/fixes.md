# Measure Image — Fixes and Improvements

## 1. Fix dragging existing lines

### Reported issue
Selecting an existing line works, but dragging its body does not move it correctly.

### Investigation
- Reproduce the issue with both mouse and touch input.
- Check whether drag offsets mix screen coordinates with image coordinates or apply the canvas scale more than once.
- Verify that pointer positions and movement deltas account for the full canvas transform: translation, scale, and rotation.
- Treat an incorrect offset or coordinate conversion as a suspected cause, not a confirmed diagnosis.

### Expected behavior
- Dragging a selected line body moves the entire segment while preserving its length and direction.
- The segment follows the pointer without jumping when dragging starts.
- Endpoint handles remain independently draggable.
- Stored endpoints remain in image coordinates.

### Acceptance criteria
- Body dragging and endpoint dragging work at different zoom levels, after panning, and with a rotated canvas.
- Moving a line does not change its measured length or calibration ratio.
- Mouse and touch interactions do not accidentally pan the canvas or create another line while editing an existing one.

## 2. Improve measurement label contrast

### Requested improvement
Measurement labels should remain readable over both light and dark image regions, including detailed backgrounds.

### Proposed approach
- Add a contrasting text outline or a semitransparent background behind each label.
- Choose the final treatment after checking readability over representative images.
- Preserve counter-rotation and constant on-screen label size during canvas navigation.

### Acceptance criteria
- Labels are readable over light, dark, and visually busy backgrounds.
- The contrast treatment does not obscure substantially more of the image than necessary.
- Labels do not interfere with line selection or dragging.

## 3. Add line and label display settings

### Requested settings
- **Line thickness**: configure the rendered thickness of measurement lines.
- **Label size**: configure the rendered text size of measurement labels.
- **Show label only for selected line**: toggle between showing all measurement labels and showing only the selected line's label.

### Expected behavior
- Settings apply immediately to existing and newly created measurement lines.
- Thickness and label size are expressed in screen-space units so their apparent size stays consistent when zooming.
- Display settings do not affect stored endpoints, measured lengths, or calibration.
- With selected-only labels enabled, no measurement label is shown when no line is selected.
- With selected-only labels disabled, all measurement labels are shown.
- Preserve current display defaults unless intentionally changed during implementation.
- Keep settings session-only, consistent with the current application scope.

### Acceptance criteria
- The settings UI provides bounded controls for line thickness and label size, plus a toggle for selected-only labels.
- Numeric settings reject invalid values and prevent unreadable or unusable rendering.
- Changing selection immediately updates label visibility.
- Label contrast remains effective at all supported label sizes.
- Controls are accessible and have English and Spanish translations through the existing localization system.

## Verification checklist

- Test mouse and touch editing with the canvas fitted, zoomed, panned, and rotated.
- Check label readability on light, dark, and detailed images.
- Verify settings update existing lines and newly drawn lines consistently.
- Verify selection, deselection, deletion, and calibration with selected-only labels enabled.
- Run the relevant automated checks available in the project.
