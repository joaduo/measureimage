<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUiStore } from '../stores/ui'
import { useImageStore } from '../stores/image'
import { useMeasureStore } from '../stores/measure'

const { t } = useI18n()
const ui = useUiStore()
const imageStore = useImageStore()
const measure = useMeasureStore()

const drawerEl = ref<HTMLElement | null>(null)

function onReplace(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  if (measure.lines.length === 0 || window.confirm(t('upload.replaceConfirm'))) {
    measure.reset()
    imageStore.setImage(file)
    if (!ui.drawerPinned) ui.drawerOpen = false
  }
  input.value = ''
}

function onPointerDown(e: PointerEvent) {
  if (ui.drawerOpen && !ui.drawerPinned && drawerEl.value && !drawerEl.value.contains(e.target as Node)) {
    ui.drawerOpen = false
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && ui.drawerOpen && !ui.drawerPinned) ui.drawerOpen = false
}

onMounted(() => {
  window.addEventListener('pointerdown', onPointerDown, true)
  window.addEventListener('keydown', onKeydown)
})
onBeforeUnmount(() => {
  window.removeEventListener('pointerdown', onPointerDown, true)
  window.removeEventListener('keydown', onKeydown)
})

const btn = 'flex w-full flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-2 text-xs'
const active = 'bg-amber-500 text-gray-900'
const idle = 'text-gray-300'
const off = 'text-gray-600'
</script>

<template>
  <div class="pointer-events-none absolute inset-y-0 left-0 flex flex-col justify-start">
    <button
      v-if="!ui.drawerOpen"
      class="pointer-events-auto mt-[max(env(safe-area-inset-top),0.75rem)] flex h-12 w-5 items-center justify-center rounded-r-lg bg-gray-800/90 text-gray-300 shadow-lg backdrop-blur"
      :aria-label="t('toolbar.openTools')"
      @click="ui.drawerOpen = true"
    >
      ›
    </button>
    <Transition
      enter-active-class="transition-transform duration-200 ease-out"
      enter-from-class="-translate-x-full"
      leave-active-class="transition-transform duration-200 ease-in"
      leave-to-class="-translate-x-full"
    >
      <nav
        v-if="ui.drawerOpen"
        ref="drawerEl"
        class="pointer-events-auto my-[max(env(safe-area-inset-top),0.75rem)] ml-[max(env(safe-area-inset-left),0.5rem)] flex w-16 flex-col items-stretch gap-1 rounded-2xl bg-gray-800/90 p-1.5 shadow-lg backdrop-blur"
      >
        <button
          :class="[btn, ui.drawerPinned ? active : idle]"
          :aria-label="ui.drawerPinned ? t('toolbar.unpin') : t('toolbar.pin')"
          :title="ui.drawerPinned ? t('toolbar.unpin') : t('toolbar.pin')"
          @click="ui.drawerPinned = !ui.drawerPinned"
        >
          <span :class="{ '-rotate-45': !ui.drawerPinned }" class="inline-block transition-transform">📌</span>
        </button>
        <button :class="[btn, ui.activeTool === 'navigate' ? active : idle]" @click="ui.runAction(() => (ui.activeTool = 'navigate'))">
          ✋<span>{{ t('toolbar.navigate') }}</span>
        </button>
        <button :class="[btn, ui.activeTool === 'measure' ? active : idle]" @click="ui.runAction(() => (ui.activeTool = 'measure'))">
          📏<span>{{ t('toolbar.measure') }}</span>
        </button>
        <button :class="[btn, idle]" @click="ui.runAction(() => ui.requestFit())">
          ⤢<span>{{ t('toolbar.fit') }}</span>
        </button>
        <button :class="[btn, measure.selectedLineId ? idle : off]" :disabled="!measure.selectedLineId" @click="ui.runAction(() => { if (measure.selectedLineId) ui.calibrationLineId = measure.selectedLineId })">
          ⌖<span>{{ t('toolbar.calibrate') }}</span>
        </button>
        <button :class="[btn, measure.selectedLineId && !measure.selectedIsReference ? idle : off]" :disabled="!measure.selectedLineId || measure.selectedIsReference || !!measure.pendingCalibration" :title="measure.selectedIsReference ? t('selection.referenceDeleteHint') : t('toolbar.delete')" @click="ui.runAction(() => { if (measure.selectedLineId) measure.removeLine(measure.selectedLineId) })">
          🗑<span>{{ t('toolbar.delete') }}</span>
        </button>
        <label :class="[btn, 'cursor-pointer', idle]">
          🖼<span>{{ t('toolbar.replaceImage') }}</span>
          <input type="file" accept="image/*" class="hidden" @change="onReplace" />
        </label>
        <button :class="[btn, idle]" @click="ui.runAction(() => (ui.settingsOpen = true))">
          ⚙<span>{{ t('toolbar.settings') }}</span>
        </button>
      </nav>
    </Transition>
  </div>
</template>
