import { describe, expect, it, vi } from 'vitest'
import { useUiStore } from '../../src/stores/ui'

const PIN_KEY = 'measureimage.drawerPinned'

describe('ui store', () => {
  it('has expected defaults', () => {
    const store = useUiStore()
    expect(store.activeTool).toBe('navigate')
    expect(store.settingsOpen).toBe(false)
    expect(store.calibrationLineId).toBeNull()
    expect(store.fitRequestCount).toBe(0)
    expect(store.drawerPinned).toBe(true)
    expect(store.drawerOpen).toBe(true)
  })

  it('initializes drawerOpen to false when the pin was stored as false', () => {
    localStorage.setItem(PIN_KEY, 'false')
    const store = useUiStore()
    expect(store.drawerPinned).toBe(false)
    expect(store.drawerOpen).toBe(false)
  })

  it('persists drawerPinned to localStorage', async () => {
    const store = useUiStore()
    store.drawerPinned = false
    await Promise.resolve()
    expect(localStorage.getItem(PIN_KEY)).toBe('false')
  })

  it('runAction executes the action and closes an unpinned drawer', () => {
    const store = useUiStore()
    store.drawerPinned = false
    store.drawerOpen = true
    const fn = vi.fn()
    store.runAction(fn)
    expect(fn).toHaveBeenCalledOnce()
    expect(store.drawerOpen).toBe(false)
  })

  it('runAction keeps a pinned drawer open', () => {
    const store = useUiStore()
    store.drawerPinned = true
    store.drawerOpen = true
    store.runAction(() => {})
    expect(store.drawerOpen).toBe(true)
  })

  it('requestFit increments fitRequestCount', () => {
    const store = useUiStore()
    store.requestFit()
    store.requestFit()
    expect(store.fitRequestCount).toBe(2)
  })
})
