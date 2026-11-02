import { useMeasureStore, pixelLength } from '../stores/measure'
import type { MeasureLine } from '../types'

export function useScale() {
  const measure = useMeasureStore()

  function formatLength(line: MeasureLine): string {
    const px = pixelLength(line)
    const factor = measure.scaleFactor
    if (factor == null || !measure.calibration) {
      return `${Math.round(px)} px`
    }
    return `${(px * factor).toFixed(1)} ${measure.calibration.unit}`
  }

  return { formatLength }
}
