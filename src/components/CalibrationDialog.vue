<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMeasureStore } from '../stores/measure'
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

// Prefill when the dialog opens for a line
watch(
  () => ui.calibrationLineId,
  (id) => {
    if (!id) return
    unit.value = measure.calibration?.unit ?? settings.unit
    length.value = measure.calibration?.lineId === id ? measure.calibration.realLength : null
  },
  { immediate: true },
)

function confirm() {
  const id = ui.calibrationLineId
  if (!id || !length.value || length.value <= 0) return
  measure.calibration = { lineId: id, realLength: length.value, unit: unit.value }
  settings.unit = unit.value
  ui.calibrationLineId = null
}

function skip() {
  ui.calibrationLineId = null
}
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
          :disabled="!length || length <= 0"
          @click="confirm"
        >
          {{ t('calibrate.confirm') }}
        </button>
      </div>
    </div>
  </div>
</template>
