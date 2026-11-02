<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useUiStore } from '../stores/ui'
import { useImageStore } from '../stores/image'
import { useMeasureStore } from '../stores/measure'

const { t } = useI18n()
const ui = useUiStore()
const imageStore = useImageStore()
const measure = useMeasureStore()

function onReplace(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (measure.lines.length === 0 || window.confirm(t('upload.replaceConfirm'))) {
    measure.reset()
    imageStore.setImage(file)
  }
  ;(e.target as HTMLInputElement).value = ''
}

function calibrate() {
  if (measure.selectedLineId) ui.calibrationLineId = measure.selectedLineId
}

function remove() {
  if (measure.selectedLineId) measure.removeLine(measure.selectedLineId)
}

const btn = 'flex min-w-12 flex-col items-center justify-center gap-0.5 rounded-xl px-2.5 py-2 text-xs'
const active = 'bg-amber-500 text-gray-900'
const idle = 'text-gray-300'
const off = 'text-gray-600'
</script>

<template>
  <nav
    class="pointer-events-auto flex items-center gap-1 rounded-2xl bg-gray-800/90 p-1.5 shadow-lg backdrop-blur"
  >
    <button :class="[btn, ui.activeTool === 'navigate' ? active : idle]" @click="ui.activeTool = 'navigate'">
      ✋<span>{{ t('toolbar.navigate') }}</span>
    </button>
    <button :class="[btn, ui.activeTool === 'measure' ? active : idle]" @click="ui.activeTool = 'measure'">
      📏<span>{{ t('toolbar.measure') }}</span>
    </button>
    <button :class="[btn, idle]" @click="ui.requestFit()">
      ⤢<span>{{ t('toolbar.fit') }}</span>
    </button>
    <button :class="[btn, measure.selectedLineId ? idle : off]" :disabled="!measure.selectedLineId" @click="calibrate">
      ⌖<span>{{ t('toolbar.calibrate') }}</span>
    </button>
    <button :class="[btn, measure.selectedLineId ? idle : off]" :disabled="!measure.selectedLineId" @click="remove">
      🗑<span>{{ t('toolbar.delete') }}</span>
    </button>
    <label :class="[btn, 'cursor-pointer', idle]">
      🖼<span>{{ t('toolbar.replaceImage') }}</span>
      <input type="file" accept="image/*" class="hidden" @change="onReplace" />
    </label>
    <button :class="[btn, idle]" @click="ui.settingsOpen = true">
      ⚙<span>{{ t('toolbar.settings') }}</span>
    </button>
  </nav>
</template>
