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
  const selectedEndpoint = ref<{ lineId: string; key: 'a' | 'b' } | null>(null)
  const selectedEndpointPosition = computed(() => {
    const target = selectedEndpoint.value
    return target && target.lineId === selectedLineId.value
      ? lines.value.find((line) => line.id === target.lineId)?.[target.key] ?? null
      : null
  })

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
    select(line.id)
    return line
  }

  function updateLine(id: string, patch: Partial<Omit<MeasureLine, 'id'>>) {
    const line = lines.value.find((l) => l.id === id)
    if (line) Object.assign(line, patch)
  }

  function removeLine(id: string) {
    lines.value = lines.value.filter((l) => l.id !== id)
    if (selectedLineId.value === id) select(null)
    if (selectedEndpoint.value?.lineId === id) selectedEndpoint.value = null
    if (calibration.value?.lineId === id) calibration.value = null
  }

  function select(id: string | null) {
    selectedLineId.value = id
    selectedEndpoint.value = null
  }

  function selectEndpoint(lineId: string, key: 'a' | 'b') {
    if (!lines.value.some((line) => line.id === lineId)) return
    selectedLineId.value = lineId
    selectedEndpoint.value = { lineId, key }
  }

  function reset() {
    lines.value = []
    select(null)
    calibration.value = null
  }

  return {
    lines,
    selectedLineId,
    selectedEndpoint,
    selectedEndpointPosition,
    selectEndpoint,
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
