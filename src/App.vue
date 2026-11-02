<script setup lang="ts">
import { watch } from 'vue'
import { useI18n } from 'vue-i18n'
import UploadScreen from './components/UploadScreen.vue'
import CanvasStage from './components/CanvasStage.vue'
import Toolbar from './components/Toolbar.vue'
import SelectionBar from './components/SelectionBar.vue'
import CalibrationDialog from './components/CalibrationDialog.vue'
import SettingsSheet from './components/SettingsSheet.vue'
import { useImageStore } from './stores/image'
import { useSettingsStore } from './stores/settings'

const imageStore = useImageStore()
const settings = useSettingsStore()
const { locale } = useI18n()

watch(
  () => settings.locale,
  (l) => {
    locale.value = l
  },
  { immediate: true },
)
</script>

<template>
  <div class="relative h-full w-full">
    <UploadScreen v-if="!imageStore.element" />
    <template v-else>
      <CanvasStage />
      <div
        class="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center gap-2 pb-[max(env(safe-area-inset-bottom),0.75rem)]"
      >
        <SelectionBar />
        <Toolbar />
      </div>
      <CalibrationDialog />
      <SettingsSheet />
    </template>
  </div>
</template>
