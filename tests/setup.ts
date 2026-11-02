import { beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

// Replace object-URL APIs with spies so tests can assert on them
let objectUrlCount = 0
URL.createObjectURL = vi.fn(() => `blob:mock-${objectUrlCount++}`)
URL.revokeObjectURL = vi.fn()

beforeEach(() => {
  setActivePinia(createPinia())
  localStorage.clear()
  vi.clearAllMocks()
})
