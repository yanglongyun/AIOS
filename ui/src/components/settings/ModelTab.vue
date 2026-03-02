<template>
  <section class="space-y-4">
    <div class="space-y-2">
      <span class="text-xs text-neutral-500 dark:text-neutral-400 font-medium">供应方</span>
      <select
        :value="provider"
        @change="onProviderChange"
        class="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-800 dark:text-neutral-200 focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-500 cursor-pointer"
      >
        <option v-for="p in PROVIDERS" :key="p.id" :value="p.id">{{ p.name }}</option>
      </select>
      <span class="text-xs text-neutral-500 dark:text-neutral-400 font-medium">请求地址</span>
      <input
        :value="apiUrl"
        @input="$emit('update:api-url', $event.target.value)"
        placeholder="https://api.example.com/v1/chat/completions"
        class="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-800 dark:text-neutral-200 focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-500"
      />
    </div>

    <div class="space-y-2">
      <span class="text-xs text-neutral-500 dark:text-neutral-400 font-medium">模型 Key</span>
      <input
        :value="apiKey"
        @input="$emit('update:api-key', $event.target.value)"
        type="password"
        placeholder="模型 Key"
        class="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-800 dark:text-neutral-200 focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-500"
      />
    </div>

    <div class="space-y-2">
      <span class="text-xs text-neutral-500 dark:text-neutral-400 font-medium">模型</span>
      <input
        :value="model"
        @input="$emit('update:model', $event.target.value)"
        placeholder="输入模型名称，如 gpt-4o"
        class="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-800 dark:text-neutral-200 focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-500"
      />
    </div>

    <div class="pt-2 flex justify-end">
      <button @click="$emit('save')" class="px-4 py-2 bg-neutral-800 dark:bg-neutral-200 hover:opacity-80 rounded-lg text-sm text-white dark:text-neutral-900 cursor-pointer transition-opacity">保存</button>
    </div>
  </section>
</template>

<script setup>
import { PROVIDERS, getProvider } from '../../data/providers.js';

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
  const preset = getProvider(value);
  if (preset && value !== 'custom') {
    emit('update:api-url', preset.apiUrl);
    emit('update:model', preset.defaultModel || '');
  } else {
    emit('update:model', '');
  }
  emit('update:api-key', '');
};
</script>
