import { defineStore } from 'pinia'
import { ref } from 'vue'

export type Tool = 'navigate' | 'measure'

export const useUiStore = defineStore('ui', () => {
  const activeTool = ref<Tool>('navigate')
  const settingsOpen = ref(false)
  // Line awaiting calibration input in the dialog; null = dialog closed
  const calibrationLineId = ref<string | null>(null)
  // Bumped by the toolbar to request a "fit image" on the stage
  const fitRequestCount = ref(0)

  function requestFit() {
    fitRequestCount.value++
  }

  return { activeTool, settingsOpen, calibrationLineId, fitRequestCount, requestFit }
})
