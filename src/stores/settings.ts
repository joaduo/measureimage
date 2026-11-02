import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Unit } from '../types'

export type Locale = 'en' | 'es'

export const useSettingsStore = defineStore('settings', () => {
  const locale = ref<Locale>('en')
  const unit = ref<Unit>('cm')

  const lineThickness = ref(3)
  const labelSize = ref(16)
  const selectedLabelOnly = ref(false)

  function setDisplaySize(key: 'lineThickness' | 'labelSize', value: number) {
    if (!Number.isFinite(value)) return
    if (key === 'lineThickness') lineThickness.value = Math.max(1, Math.min(12, Math.round(value)))
    else labelSize.value = Math.max(10, Math.min(40, Math.round(value)))
  }

  const magnifierZoom = ref(4)
  const magnifierSize = ref(200)

  function setMagnifierZoom(value: number) {
    if ([2, 4, 8].includes(value)) magnifierZoom.value = value
  }

  function setMagnifierSize(value: number) {
    if (Number.isFinite(value)) magnifierSize.value = Math.max(120, Math.min(320, Math.round(value)))
  }

  return {
    locale, unit, lineThickness, labelSize, selectedLabelOnly, setDisplaySize,
    magnifierZoom, magnifierSize, setMagnifierZoom, setMagnifierSize,
  }
})
