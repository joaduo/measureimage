import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Unit } from '../types'

export type Locale = 'en' | 'es'

export const useSettingsStore = defineStore('settings', () => {
  const locale = ref<Locale>('en')
  const unit = ref<Unit>('cm')

  return { locale, unit }
})
