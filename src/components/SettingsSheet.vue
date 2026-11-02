<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useUiStore } from '../stores/ui'
import { useSettingsStore, type Locale } from '../stores/settings'
import type { Unit } from '../types'

const { t } = useI18n()
const ui = useUiStore()
const settings = useSettingsStore()

const LOCALES: { value: Locale; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
]
const UNITS: Unit[] = ['mm', 'cm', 'm', 'in']
</script>

<template>
  <div
    v-if="ui.settingsOpen"
    class="absolute inset-0 z-20 flex items-end justify-center bg-black/50"
    @click.self="ui.settingsOpen = false"
  >
    <div
      class="max-h-[90dvh] w-full max-w-sm overflow-y-auto rounded-t-2xl bg-gray-800 p-5 pb-[max(env(safe-area-inset-bottom),1.25rem)] shadow-xl"
    >
      <h2 class="mb-4 text-lg font-semibold">{{ t('settings.title') }}</h2>

      <label class="mb-1 block text-sm text-gray-400">{{ t('settings.language') }}</label>
      <div class="mb-4 flex gap-2">
        <button
          v-for="l in LOCALES"
          :key="l.value"
          class="flex-1 rounded-lg py-2"
          :class="settings.locale === l.value ? 'bg-amber-500 text-gray-900 font-medium' : 'bg-gray-700 text-gray-300'"
          @click="settings.locale = l.value"
        >
          {{ l.label }}
        </button>
      </div>

      <label class="mb-1 block text-sm text-gray-400">{{ t('settings.unit') }}</label>
      <div class="flex gap-2">
        <button
          v-for="u in UNITS"
          :key="u"
          class="flex-1 rounded-lg py-2"
          :class="settings.unit === u ? 'bg-amber-500 text-gray-900 font-medium' : 'bg-gray-700 text-gray-300'"
          @click="settings.unit = u"
        >
          {{ u }}
        </button>
      </div>

      <label for="line-thickness" class="mt-4 mb-1 block text-sm text-gray-400">
        {{ t('settings.lineThickness') }}: {{ settings.lineThickness }} px
      </label>
      <input
        id="line-thickness"
        type="range"
        min="1"
        max="12"
        step="1"
        :value="settings.lineThickness"
        class="w-full accent-amber-500"
        @input="settings.setDisplaySize('lineThickness', Number(($event.target as HTMLInputElement).value))"
      />

      <label for="label-size" class="mt-4 mb-1 block text-sm text-gray-400">
        {{ t('settings.labelSize') }}: {{ settings.labelSize }} px
      </label>
      <input
        id="label-size"
        type="range"
        min="10"
        max="40"
        step="1"
        :value="settings.labelSize"
        class="w-full accent-amber-500"
        @input="settings.setDisplaySize('labelSize', Number(($event.target as HTMLInputElement).value))"
      />

      <fieldset class="mt-4">
        <legend class="mb-2 text-sm text-gray-400">{{ t('settings.magnifierZoom') }}</legend>
        <div class="flex gap-2">
          <button
            v-for="zoom in [2, 4, 8]"
            :key="zoom"
            :aria-pressed="settings.magnifierZoom === zoom"
            class="flex-1 rounded-lg py-2"
            :class="settings.magnifierZoom === zoom ? 'bg-amber-500 text-gray-900 font-medium' : 'bg-gray-700 text-gray-300'"
            @click="settings.setMagnifierZoom(zoom)"
          >
            {{ zoom }}×
          </button>
        </div>
      </fieldset>

      <label for="magnifier-size" class="mt-4 mb-1 block text-sm text-gray-400">
        {{ t('settings.magnifierSize') }}: {{ settings.magnifierSize }} × {{ settings.magnifierSize }} px
      </label>
      <input
        id="magnifier-size"
        type="range"
        min="120"
        max="320"
        step="10"
        :value="settings.magnifierSize"
        class="w-full accent-amber-500"
        @input="settings.setMagnifierSize(Number(($event.target as HTMLInputElement).value))"
      />

      <label class="mt-4 flex items-center gap-3 text-sm">
        <input v-model="settings.selectedLabelOnly" type="checkbox" class="size-5 accent-amber-500" />
        {{ t('settings.selectedLabelOnly') }}
      </label>
    </div>
  </div>
</template>
