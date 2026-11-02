import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { Calibration, MeasureLine, Point } from '../types'

let nextId = 0
const genId = () => `line-${nextId++}`

export const DEFAULT_COLORS = ['#f59e0b', '#22d3ee', '#f472b6', '#a3e635', '#f87171', '#e5e7eb']

export function pixelLength(line: Pick<MeasureLine, 'a' | 'b'>): number {
  return Math.hypot(line.b.x - line.a.x, line.b.y - line.a.y)
}

export const useMeasureStore = defineStore('measure', () => {
  const lines = ref<MeasureLine[]>([])
  const selectedLineId = ref<string | null>(null)
  const calibration = ref<Calibration | null>(null)

  const referenceLine = computed(
    () => lines.value.find((l) => l.id === calibration.value?.lineId) ?? null,
  )

  // px → real units scale factor; null until calibrated
  const scaleFactor = computed(() => {
    if (!calibration.value || !referenceLine.value) return null
    const refPx = pixelLength(referenceLine.value)
    return refPx > 0 ? calibration.value.realLength / refPx : null
  })

  function addLine(a: Point, b: Point): MeasureLine {
    const line: MeasureLine = {
      id: genId(),
      a,
      b,
      color: DEFAULT_COLORS[lines.value.length % DEFAULT_COLORS.length]!,
    }
    lines.value.push(line)
    selectedLineId.value = line.id
    return line
  }

  function updateLine(id: string, patch: Partial<Omit<MeasureLine, 'id'>>) {
    const line = lines.value.find((l) => l.id === id)
    if (line) Object.assign(line, patch)
  }

  function removeLine(id: string) {
    lines.value = lines.value.filter((l) => l.id !== id)
    if (selectedLineId.value === id) selectedLineId.value = null
    if (calibration.value?.lineId === id) calibration.value = null
  }

  function select(id: string | null) {
    selectedLineId.value = id
  }

  function reset() {
    lines.value = []
    selectedLineId.value = null
    calibration.value = null
  }

  return {
    lines,
    selectedLineId,
    calibration,
    referenceLine,
    scaleFactor,
    addLine,
    updateLine,
    removeLine,
    select,
    reset,
  }
})
