<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { pixelLength, useMeasureStore } from '../stores/measure'
import { useUiStore } from '../stores/ui'
import { useSettingsStore } from '../stores/settings'
import type { Unit } from '../types'

const { t } = useI18n()
const measure = useMeasureStore()
const ui = useUiStore()
const settings = useSettingsStore()

const UNITS: Unit[] = ['mm', 'cm', 'm', 'in']

const length = ref<number | null>(null)
const unit = ref<Unit>('cm')
const validLength = computed(() => typeof length.value === 'number' && Number.isFinite(length.value) && length.value > 0)
const pixelHint = computed(() => {
  const line = measure.lines.find((line) => line.id === ui.calibrationLineId)
  return line && !measure.calibration ? pixelLength(line).toFixed(1) : null
})

// Prefill when the dialog opens for a line
watch(
  () => ui.calibrationLineId,
  (id) => {
    if (!id) {
      measure.cancelCalibration()
      return
    }
    if (!measure.beginCalibration(id)) {
      ui.calibrationLineId = null
      return
    }
    unit.value = measure.calibration?.unit ?? settings.unit
    length.value = measure.calibration?.lineId === id ? measure.calibration.realLength : null
  },
  { immediate: true },
)

function confirm() {
  const id = ui.calibrationLineId
  if (!id || !validLength.value || length.value === null || !measure.confirmCalibration(length.value, unit.value)) return
  settings.unit = unit.value
  ui.calibrationLineId = null
}

function skip() {
  measure.cancelCalibration()
  ui.calibrationLineId = null
}

watch(() => measure.lines.some((line) => line.id === ui.calibrationLineId), (exists) => {
  if (!exists && ui.calibrationLineId) skip()
})
onBeforeUnmount(() => {
  measure.cancelCalibration()
  ui.calibrationLineId = null
})
</script>

<template>
  <div
    v-if="ui.calibrationLineId"
    class="absolute inset-0 z-20 flex items-end justify-center bg-black/50 p-4 sm:items-center"
    @click.self="skip"
  >
    <div class="w-full max-w-sm rounded-2xl bg-gray-800 p-5 shadow-xl">
      <h2 class="mb-1 text-lg font-semibold">{{ t('calibrate.title') }}</h2>
      <p class="mb-4 text-sm text-gray-400">{{ t('calibrate.hint') }}</p>
      <p v-if="pixelHint !== null" class="mb-3 text-sm text-gray-300">{{ t('calibrate.pixelHint', { length: pixelHint }) }}</p>
      <form class="flex gap-2" @submit.prevent="confirm">
        <input
          v-model.number="length"
          type="number"
          inputmode="decimal"
          min="0"
          step="any"
          required
          :placeholder="t('calibrate.lengthPlaceholder')"
          class="min-w-0 flex-1 rounded-lg bg-gray-700 px-3 py-2.5 text-lg outline-none focus:ring-2 focus:ring-amber-500"
        />
        <select
          v-model="unit"
          class="rounded-lg bg-gray-700 px-3 py-2.5 text-lg outline-none focus:ring-2 focus:ring-amber-500"
        >
          <option v-for="u in UNITS" :key="u" :value="u">{{ u }}</option>
        </select>
      </form>
      <div class="mt-4 flex justify-end gap-2">
        <button class="rounded-lg px-4 py-2 text-gray-300" @click="skip">
          {{ t('calibrate.skip') }}
        </button>
        <button
          class="rounded-lg bg-amber-500 px-4 py-2 font-medium text-gray-900 disabled:opacity-40"
          :disabled="!validLength"
          @click="confirm"
        >
          {{ t('calibrate.confirm') }}
        </button>
      </div>
    </div>
  </div>
</template>
