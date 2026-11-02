import { describe, expect, it } from 'vitest'
import { useSettingsStore } from '../../src/stores/settings'

describe('settings store', () => {
  it('has expected defaults', () => {
    const store = useSettingsStore()
    expect(store.locale).toBe('en')
    expect(store.unit).toBe('cm')
    expect(store.lineThickness).toBe(3)
    expect(store.labelSize).toBe(16)
    expect(store.selectedLabelOnly).toBe(false)
    expect(store.magnifierZoom).toBe(4)
    expect(store.magnifierSize).toBe(200)
  })

  it('setDisplaySize clamps and rounds lineThickness to 1-12', () => {
    const store = useSettingsStore()
    store.setDisplaySize('lineThickness', 0)
    expect(store.lineThickness).toBe(1)
    store.setDisplaySize('lineThickness', 99)
    expect(store.lineThickness).toBe(12)
    store.setDisplaySize('lineThickness', 5.6)
    expect(store.lineThickness).toBe(6)
  })

  it('setDisplaySize clamps and rounds labelSize to 10-40', () => {
    const store = useSettingsStore()
    store.setDisplaySize('labelSize', 1)
    expect(store.labelSize).toBe(10)
    store.setDisplaySize('labelSize', 100)
    expect(store.labelSize).toBe(40)
    store.setDisplaySize('labelSize', 20.4)
    expect(store.labelSize).toBe(20)
  })

  it('setDisplaySize ignores non-finite values', () => {
    const store = useSettingsStore()
    store.setDisplaySize('lineThickness', Number.NaN)
    store.setDisplaySize('labelSize', Number.POSITIVE_INFINITY)
    expect(store.lineThickness).toBe(3)
    expect(store.labelSize).toBe(16)
  })

  it('setMagnifierZoom only accepts 2, 4 or 8', () => {
    const store = useSettingsStore()
    store.setMagnifierZoom(8)
    expect(store.magnifierZoom).toBe(8)
    store.setMagnifierZoom(3)
    expect(store.magnifierZoom).toBe(8)
  })

  it('setMagnifierSize clamps to 120-320 and ignores non-finite values', () => {
    const store = useSettingsStore()
    store.setMagnifierSize(50)
    expect(store.magnifierSize).toBe(120)
    store.setMagnifierSize(999)
    expect(store.magnifierSize).toBe(320)
    store.setMagnifierSize(200.7)
    expect(store.magnifierSize).toBe(201)
    store.setMagnifierSize(Number.NaN)
    expect(store.magnifierSize).toBe(201)
  })

  it('locale and unit are writable', () => {
    const store = useSettingsStore()
    store.locale = 'es'
    store.unit = 'in'
    expect(store.locale).toBe('es')
    expect(store.unit).toBe('in')
  })
})
