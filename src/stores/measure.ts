import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { Calibration, MeasureLine, Point, Unit } from '../types'

let nextId = 0
const genId = () => `line-${nextId++}`

export const DEFAULT_COLORS = ['#f59e0b', '#22d3ee', '#f472b6', '#a3e635', '#a78bfa', '#e5e7eb']
export const REFERENCE_COLOR = '#ef4444'
export const MIN_REFERENCE_LENGTH = 0.001
export const LINE_DASH = [3, 3]
export function ordinaryColor(color: string): string {
  return ['#f87171', REFERENCE_COLOR, '#ff0000', 'red'].includes(color.toLowerCase()) ? DEFAULT_COLORS[0]! : color
}

export function pixelLength(line: Pick<MeasureLine, 'a' | 'b'>): number {
  return Math.hypot(line.b.x - line.a.x, line.b.y - line.a.y)
}

export const useMeasureStore = defineStore('measure', () => {
  const lines = ref<MeasureLine[]>([])
  const selectedLineId = ref<string | null>(null)
  const calibration = ref<Calibration | null>(null)
  const pendingCalibration = ref<{ lineId: string; previous: Calibration | null } | null>(null)
  const referenceLineId = computed(() => pendingCalibration.value?.lineId ?? calibration.value?.lineId ?? null)
  const selectedIsReference = computed(() => selectedLineId.value !== null && selectedLineId.value === referenceLineId.value)
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

  function beginCalibration(lineId: string) {
    cancelCalibration()
    const line = lines.value.find((line) => line.id === lineId)
    if (!line || !Number.isFinite(pixelLength(line)) || pixelLength(line) < MIN_REFERENCE_LENGTH) return false
    const previous = calibration.value ? { ...calibration.value } : null
    const factor = scaleFactor.value
    pendingCalibration.value = { lineId, previous }
    if (previous && factor !== null) {
      calibration.value = {
        lineId,
        realLength: previous.lineId === lineId ? previous.realLength : pixelLength(line) * factor,
        unit: previous.unit,
      }
    }
    return true
  }

  function confirmCalibration(realLength: number, unit: Unit) {
    const pending = pendingCalibration.value
    const line = lines.value.find((line) => line.id === pending?.lineId)
    if (!pending || !line || !Number.isFinite(realLength) || realLength <= 0 ||
      !['mm', 'cm', 'm', 'in'].includes(unit) || !Number.isFinite(pixelLength(line)) || pixelLength(line) < MIN_REFERENCE_LENGTH) return false
    calibration.value = { lineId: pending.lineId, realLength, unit }
    pendingCalibration.value = null
    return true
  }

  function cancelCalibration() {
    if (!pendingCalibration.value) return
    calibration.value = pendingCalibration.value.previous
    pendingCalibration.value = null
  }

  function updateLine(id: string, patch: Partial<Omit<MeasureLine, 'id'>>) {
    const line = lines.value.find((l) => l.id === id)
    if (!line || pendingCalibration.value) return false
    if (id === calibration.value?.lineId) {
      const distance = pixelLength({ a: patch.a ?? line.a, b: patch.b ?? line.b })
      if (!Number.isFinite(distance) || distance < MIN_REFERENCE_LENGTH) return false
    }
    Object.assign(line, patch, patch.color ? { color: ordinaryColor(patch.color) } : {})
    return true
  }

  function removeLine(id: string) {
    if (pendingCalibration.value || id === calibration.value?.lineId) return false
    lines.value = lines.value.filter((l) => l.id !== id)
    if (selectedLineId.value === id) select(null)
    if (selectedEndpoint.value?.lineId === id) selectedEndpoint.value = null
    return true
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
    pendingCalibration.value = null
  }

  return {
    pendingCalibration,
    referenceLineId,
    selectedIsReference,
    beginCalibration,
    confirmCalibration,
    cancelCalibration,
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
