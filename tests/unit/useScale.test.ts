import { describe, expect, it } from 'vitest'
import { useMeasureStore } from '../../src/stores/measure'
import { useScale } from '../../src/composables/useScale'
import type { MeasureLine } from '../../src/types'

const line = (a: [number, number], b: [number, number]): MeasureLine => ({
  id: 'l1',
  a: { x: a[0], y: a[1] },
  b: { x: b[0], y: b[1] },
  color: '#fff',
})

describe('useScale.formatLength', () => {
  it('formats pixels when uncalibrated', () => {
    useMeasureStore()
    const { formatLength } = useScale()
    expect(formatLength(line([0, 0], [30, 40]))).toBe('50 px')
    expect(formatLength(line([0, 0], [1, 1]))).toBe('1 px')
  })

  it('formats real units when calibrated', () => {
    const store = useMeasureStore()
    const ref = store.addLine({ x: 0, y: 0 }, { x: 100, y: 0 })
    store.calibration = { lineId: ref.id, realLength: 5, unit: 'cm' }
    const { formatLength } = useScale()
    expect(formatLength(line([0, 0], [0, 200]))).toBe('10.0 cm')
  })

  it('uses the calibration unit', () => {
    const store = useMeasureStore()
    const ref = store.addLine({ x: 0, y: 0 }, { x: 50, y: 0 })
    store.calibration = { lineId: ref.id, realLength: 2, unit: 'in' }
    const { formatLength } = useScale()
    expect(formatLength(line([0, 0], [25, 0]))).toBe('1.0 in')
  })
})
