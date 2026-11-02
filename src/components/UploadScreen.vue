<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useImageStore } from '../stores/image'

const { t } = useI18n()
const imageStore = useImageStore()

function onFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) imageStore.setImage(file)
}
</script>

<template>
  <div class="flex h-full flex-col items-center justify-center gap-6 p-8 text-center">
    <h1 class="text-2xl font-semibold">{{ t('app.title') }}</h1>
    <p class="text-gray-400">{{ t('upload.prompt') }}</p>
    <label
      class="rounded-xl bg-amber-500 px-6 py-3 text-lg font-medium text-gray-900 active:bg-amber-400"
    >
      {{ t('upload.button') }}
      <input type="file" accept="image/*" class="hidden" @change="onFile" />
    </label>
  </div>
</template>
