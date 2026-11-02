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
      class="w-full max-w-sm rounded-t-2xl bg-gray-800 p-5 pb-[max(env(safe-area-inset-bottom),1.25rem)] shadow-xl"
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
    </div>
  </div>
</template>
