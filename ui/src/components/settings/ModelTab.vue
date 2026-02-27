<template>
  <section class="space-y-4">
    <div class="space-y-2">
      <span class="text-xs text-neutral-500 dark:text-neutral-400 font-medium">供应方</span>
      <select
        :value="provider"
        @change="onProviderChange"
        class="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-800 dark:text-neutral-200 focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-500 cursor-pointer"
      >
        <option value="openrouter">OpenRouter</option>
        <option value="openai">OpenAI</option>
        <option value="custom">自定义</option>
      </select>
      <input
        v-if="provider === 'custom'"
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
      <div class="flex items-center justify-between">
        <span class="text-xs text-neutral-500 dark:text-neutral-400 font-medium">模型</span>
        <button
          @click="$emit('fetch-models')"
          :disabled="loadingModels"
          class="px-3 py-1 rounded-lg text-xs border border-gray-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 hover:bg-gray-50 dark:hover:bg-neutral-800 disabled:opacity-50 cursor-pointer transition-colors"
        >
          {{ loadingModels ? '加载中...' : '刷新模型' }}
        </button>
      </div>
      <input
        :value="model"
        @input="$emit('update:model', $event.target.value)"
        list="model-options"
        placeholder="可输入匹配或直接选择模型"
        class="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-800 dark:text-neutral-200 focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-500"
      />
      <datalist id="model-options">
        <option v-for="m in modelItems" :key="m.id" :value="m.id" />
      </datalist>
      <div v-if="selectedModel" class="rounded-lg border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800/60 p-3 text-[11px] space-y-1">
        <div class="text-neutral-700 dark:text-neutral-200 break-all">{{ selectedModel.id }}</div>
        <div class="text-neutral-500">{{ selectedModel.name || '-' }}</div>
        <div class="text-neutral-500">上下文: {{ selectedModel.contextLength || '-' }}</div>
        <div class="text-neutral-500">能力: {{ (selectedModel.supportedParameters || []).join(', ') || '-' }}</div>
        <div class="text-neutral-500">价格(输入/输出): {{ formatPricing(selectedModel.pricing) }}</div>
        <div v-if="selectedModel.description" class="text-neutral-500 leading-relaxed">{{ selectedModel.description }}</div>
      </div>
      <div class="text-[11px] text-neutral-400">{{ modelHint }}</div>
    </div>

    <div class="pt-2 flex justify-end">
      <button @click="$emit('save')" class="px-4 py-2 bg-neutral-800 dark:bg-neutral-200 hover:opacity-80 rounded-lg text-sm text-white dark:text-neutral-900 cursor-pointer transition-opacity">保存</button>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  provider: { type: String, default: 'openrouter' },
  apiUrl: { type: String, default: '' },
  apiKey: { type: String, default: '' },
  model: { type: String, default: '' },
  modelItems: { type: Array, default: () => [] },
  loadingModels: { type: Boolean, default: false },
  modelHint: { type: String, default: '' }
});

const emit = defineEmits([
  'update:provider',
  'update:api-url',
  'update:api-key',
  'update:model',
  'fetch-models',
  'save'
]);

const PROVIDER_URL = {
  openrouter: 'https://openrouter.ai/api/v1/chat/completions',
  openai: 'https://api.openai.com/v1/chat/completions'
};

const onProviderChange = (e) => {
  const value = e.target.value;
  emit('update:provider', value);
  if (value === 'openrouter' || value === 'openai') {
    emit('update:api-url', PROVIDER_URL[value]);
  }
};

const selectedModel = computed(() => {
  const value = (props.model || '').trim();
  if (!value) return null;
  return props.modelItems.find((m) => m.id === value)
    || props.modelItems.find((m) => m.id.toLowerCase().includes(value.toLowerCase()))
    || null;
});

const formatPricing = (pricing) => {
  if (!pricing || typeof pricing !== 'object') return '-';
  const input = pricing.prompt || pricing.input || '-';
  const output = pricing.completion || pricing.output || '-';
  return `${input} / ${output}`;
};
</script>
