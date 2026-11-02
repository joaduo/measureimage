import { describe, expect, it, vi } from 'vitest'
import { toRaw } from 'vue'
import { useImageStore } from '../../src/stores/image'

function makeFile() {
  return new File(['x'], 'img.png', { type: 'image/png' })
}

// Minimal Image stub: captures instances so tests can fire onload manually
function stubImage() {
  const instances: { onload: (() => void) | null }[] = []
  const RealImage = globalThis.Image
  vi.stubGlobal(
    'Image',
    class {
      onload: (() => void) | null = null
      set src(_v: string) {
        instances.push(this)
      }
    },
  )
  return { instances, restore: () => vi.stubGlobal('Image', RealImage) }
}

describe('image store', () => {
  it('setImage creates an object URL and sets the element on load', () => {
    const { instances, restore } = stubImage()
    try {
      const store = useImageStore()
      store.setImage(makeFile())
      expect(URL.createObjectURL).toHaveBeenCalledOnce()
      expect(store.element).toBeNull()
      instances[0]!.onload?.()
      // the ref stores the element behind a reactive proxy
      expect(toRaw(store.element)).toBe(instances[0])
      expect(store.url).toMatch(/^blob:mock-/)
    } finally {
      restore()
    }
  })

  it('setImage revokes the previous object URL', () => {
    const store = useImageStore()
    store.url = 'blob:old'
    store.setImage(makeFile())
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:old')
  })

  it('clear revokes the URL and resets state', () => {
    const store = useImageStore()
    store.url = 'blob:current'
    store.element = {} as HTMLImageElement
    store.clear()
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:current')
    expect(store.element).toBeNull()
    expect(store.url).toBeNull()
  })

  it('clear does nothing when empty', () => {
    const store = useImageStore()
    store.clear()
    expect(URL.revokeObjectURL).not.toHaveBeenCalled()
  })
})
