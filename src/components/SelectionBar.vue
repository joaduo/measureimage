<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useMeasureStore, DEFAULT_COLORS } from '../stores/measure'
import { useUiStore } from '../stores/ui'

const { t } = useI18n()
const measure = useMeasureStore()
const ui = useUiStore()
</script>

<template>
  <div
    v-if="measure.selectedLineId"
    class="pointer-events-auto mx-3 flex max-w-full flex-wrap items-center justify-center gap-2 rounded-2xl bg-gray-800/90 px-3 py-2 shadow-lg backdrop-blur"
  >
    <div v-if="measure.selectedIsReference" class="basis-full text-center text-sm text-red-200" role="status">
      <p>{{ t('selection.referenceWarning') }}</p>
      <p class="mt-1 text-xs text-gray-300">{{ t('selection.referenceDeleteHint') }}</p>
    </div>
    <template v-else>
      <button
        v-for="c in DEFAULT_COLORS"
        :key="c"
        class="h-7 w-7 rounded-full border-2"
        :class="measure.lines.find((l) => l.id === measure.selectedLineId)?.color === c
          ? 'border-white'
          : 'border-transparent'"
        :style="{ backgroundColor: c }"
        :aria-label="t('selection.color')"
        @click="measure.updateLine(measure.selectedLineId!, { color: c })"
      />
    </template>
    <button
      class="rounded-lg bg-gray-700 px-3 py-1.5 text-sm text-gray-200"
      @click="ui.calibrationLineId = measure.selectedLineId"
    >
      {{ t('selection.setReference') }}
    </button>
  </div>
</template>
