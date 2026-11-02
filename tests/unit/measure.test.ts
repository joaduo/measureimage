import { describe, expect, it } from 'vitest'
import { DEFAULT_COLORS, pixelLength, useMeasureStore } from '../../src/stores/measure'

const p = (x: number, y: number) => ({ x, y })

describe('pixelLength', () => {
  it('computes horizontal, vertical and diagonal lengths', () => {
    expect(pixelLength({ a: p(0, 0), b: p(3, 0) })).toBe(3)
    expect(pixelLength({ a: p(0, 0), b: p(0, 4) })).toBe(4)
    expect(pixelLength({ a: p(0, 0), b: p(3, 4) })).toBe(5)
  })

  it('returns 0 for a zero-length line', () => {
    expect(pixelLength({ a: p(2, 2), b: p(2, 2) })).toBe(0)
  })
})

describe('measure store', () => {
  it('addLine assigns unique ids, cycles colors and selects the new line', () => {
    const store = useMeasureStore()
    const ids = new Set<string>()
    for (let i = 0; i < DEFAULT_COLORS.length + 1; i++) {
      const line = store.addLine(p(0, 0), p(10, 0))
      ids.add(line.id)
      expect(line.color).toBe(DEFAULT_COLORS[i % DEFAULT_COLORS.length])
      expect(store.selectedLineId).toBe(line.id)
    }
    expect(ids.size).toBe(DEFAULT_COLORS.length + 1)
  })

  it('updateLine patches an existing line and ignores unknown ids', () => {
    const store = useMeasureStore()
    const line = store.addLine(p(0, 0), p(10, 0))
    store.updateLine(line.id, { b: p(20, 0), color: '#ffffff' })
    expect(store.lines[0]!.b).toEqual(p(20, 0))
    expect(store.lines[0]!.color).toBe('#ffffff')
    store.updateLine('nope', { color: '#000000' })
    expect(store.lines[0]!.color).toBe('#ffffff')
  })

  it('removeLine deletes the line and clears selection, endpoint and calibration', () => {
    const store = useMeasureStore()
    const line = store.addLine(p(0, 0), p(10, 0))
    store.selectEndpoint(line.id, 'a')
    store.calibration = { lineId: line.id, realLength: 5, unit: 'cm' }
    store.removeLine(line.id)
    expect(store.lines).toHaveLength(0)
    expect(store.selectedLineId).toBeNull()
    expect(store.selectedEndpoint).toBeNull()
    expect(store.calibration).toBeNull()
  })

  it('removeLine keeps state when removing an unrelated line', () => {
    const store = useMeasureStore()
    const keep = store.addLine(p(0, 0), p(10, 0))
    const other = store.addLine(p(0, 0), p(5, 5))
    store.select(keep.id)
    store.calibration = { lineId: keep.id, realLength: 5, unit: 'cm' }
    store.removeLine(other.id)
    expect(store.selectedLineId).toBe(keep.id)
    expect(store.calibration?.lineId).toBe(keep.id)
  })

  it('select clears the selected endpoint', () => {
    const store = useMeasureStore()
    const line = store.addLine(p(0, 0), p(10, 0))
    store.selectEndpoint(line.id, 'b')
    store.select(line.id)
    expect(store.selectedEndpoint).toBeNull()
  })

  it('selectEndpoint selects line and endpoint, ignoring unknown ids', () => {
    const store = useMeasureStore()
    const line = store.addLine(p(0, 0), p(10, 0))
    store.select(null)
    store.selectEndpoint('nope', 'a')
    expect(store.selectedEndpoint).toBeNull()
    store.selectEndpoint(line.id, 'b')
    expect(store.selectedLineId).toBe(line.id)
    expect(store.selectedEndpoint).toEqual({ lineId: line.id, key: 'b' })
  })

  it('selectedEndpointPosition returns the endpoint only while its line is selected', () => {
    const store = useMeasureStore()
    const line = store.addLine(p(1, 2), p(10, 20))
    store.selectEndpoint(line.id, 'b')
    expect(store.selectedEndpointPosition).toEqual(p(10, 20))
    store.select(null)
    store.selectedEndpoint = { lineId: line.id, key: 'b' }
    expect(store.selectedEndpointPosition).toBeNull()
  })

  it('scaleFactor is null until calibrated and computes real/px afterwards', () => {
    const store = useMeasureStore()
    const line = store.addLine(p(0, 0), p(100, 0))
    expect(store.scaleFactor).toBeNull()
    expect(store.referenceLine).toBeNull()
    store.calibration = { lineId: line.id, realLength: 5, unit: 'cm' }
    expect(store.referenceLine?.id).toBe(line.id)
    expect(store.scaleFactor).toBeCloseTo(0.05)
  })

  it('scaleFactor is null when calibration references a missing or zero-length line', () => {
    const store = useMeasureStore()
    store.calibration = { lineId: 'missing', realLength: 5, unit: 'cm' }
    expect(store.scaleFactor).toBeNull()
    const zero = store.addLine(p(1, 1), p(1, 1))
    store.calibration = { lineId: zero.id, realLength: 5, unit: 'cm' }
    expect(store.scaleFactor).toBeNull()
  })

  it('reset clears lines, selection and calibration', () => {
    const store = useMeasureStore()
    const line = store.addLine(p(0, 0), p(10, 0))
    store.calibration = { lineId: line.id, realLength: 5, unit: 'cm' }
    store.reset()
    expect(store.lines).toHaveLength(0)
    expect(store.selectedLineId).toBeNull()
    expect(store.calibration).toBeNull()
  })
})
