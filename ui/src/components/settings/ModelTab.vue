<template>
  <section class="space-y-4">
    <div class="space-y-2">
      <span class="text-xs text-neutral-500 dark:text-neutral-400 font-medium">{{ t('settings_provider') }}</span>
      <select
        :value="provider"
        @change="onProviderChange"
        class="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-800 dark:text-neutral-200 focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-500 cursor-pointer"
      >
        <option v-for="p in PROVIDERS" :key="p.id" :value="p.id">{{ p.name }}</option>
      </select>
      <span class="text-xs text-neutral-500 dark:text-neutral-400 font-medium">{{ t('settings_api_url') }}</span>
      <input
        :value="apiUrl"
        @input="$emit('update:api-url', $event.target.value)"
        placeholder="https://api.example.com/v1/chat/completions"
        class="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-800 dark:text-neutral-200 focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-500"
      />
    </div>

    <div class="space-y-2">
      <span class="text-xs text-neutral-500 dark:text-neutral-400 font-medium">{{ t('settings_api_key') }}</span>
      <input
        :value="apiKey"
        @input="$emit('update:api-key', $event.target.value)"
        type="password"
        :placeholder="t('settings_api_key')"
        class="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-800 dark:text-neutral-200 focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-500"
      />
    </div>

    <div class="space-y-2">
      <span class="text-xs text-neutral-500 dark:text-neutral-400 font-medium">{{ t('settings_model') }}</span>
      <input
        :value="model"
        @input="$emit('update:model', $event.target.value)"
        :placeholder="t('settings_model_placeholder')"
        class="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-800 dark:text-neutral-200 focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-500"
      />
    </div>

    <div class="pt-2 flex justify-end">
      <button @click="$emit('save')" class="px-4 py-2 bg-neutral-800 dark:bg-neutral-200 hover:opacity-80 rounded-lg text-sm text-white dark:text-neutral-900 cursor-pointer transition-opacity">{{ t('common_save') }}</button>
    </div>
  </section>
</template>

<script setup>
import { PROVIDERS } from '../../data/providers.js';
import { useI18n } from '../../i18n/index.js';

const { t } = useI18n();

defineProps({
  provider: { type: String, default: 'openrouter' },
  apiUrl: { type: String, default: '' },
  apiKey: { type: String, default: '' },
  model: { type: String, default: '' }
});

const emit = defineEmits([
  'update:provider',
  'update:api-url',
  'update:api-key',
  'update:model',
  'save'
]);

const onProviderChange = (e) => {
  const value = e.target.value;
  emit('update:provider', value);
};
</script>
