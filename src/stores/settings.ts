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

  return { locale, unit, lineThickness, labelSize, selectedLabelOnly, setDisplaySize }
})
