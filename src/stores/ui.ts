import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export type Tool = 'navigate' | 'measure'

const PIN_KEY = 'measureimage.drawerPinned'

export const useUiStore = defineStore('ui', () => {
  const activeTool = ref<Tool>('navigate')
  const settingsOpen = ref(false)
  // Line awaiting calibration input in the dialog; null = dialog closed
  const calibrationLineId = ref<string | null>(null)
  // Bumped by the toolbar to request a "fit image" on the stage
  const fitRequestCount = ref(0)

  const drawerPinned = ref(localStorage.getItem(PIN_KEY) !== 'false')
  const drawerOpen = ref(drawerPinned.value)

  watch(drawerPinned, (v) => localStorage.setItem(PIN_KEY, String(v)))

  // Run a toolbar action; unpinned drawers auto-close after any action
  function runAction(fn: () => void) {
    fn()
    if (!drawerPinned.value) drawerOpen.value = false
  }

  function requestFit() {
    fitRequestCount.value++
  }

  return {
    activeTool,
    settingsOpen,
    calibrationLineId,
    fitRequestCount,
    requestFit,
    drawerOpen,
    drawerPinned,
    runAction,
  }
})
