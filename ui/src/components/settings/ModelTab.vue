<template>
  <section class="space-y-4">
    <div>
      <div class="text-xs font-medium text-[#a0907a] dark:text-[#6a5840] mb-1.5">{{ t('settings_provider') }}</div>
      <select
        :value="provider"
        @change="onProviderChange"
        class="w-full px-3 py-2.5 rounded-lg text-[13px] bg-[#fffdf8] border border-[#dcd0b8] text-[#4a3a28] outline-none focus:border-[#b08a40] transition-colors cursor-pointer appearance-none dark:bg-[rgba(30,22,14,0.8)] dark:border-[#2a1e14] dark:text-[#e8dcc8] dark:focus:border-[#c8a060]"
        style="background-image: url(&quot;data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239a9a9a' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E&quot;); background-repeat: no-repeat; background-position: right 12px center;"
      >
        <optgroup label="默认">
          <option v-for="p in defaultProviders" :key="p.id" :value="p.id">{{ p.name }}</option>
        </optgroup>
        <optgroup label="聚合平台">
          <option v-for="p in aggregatorProviders" :key="p.id" :value="p.id">{{ p.name }}</option>
        </optgroup>
        <optgroup label="Coding Plan">
          <option v-for="p in codingProviders" :key="p.id" :value="p.id">{{ p.name }}</option>
        </optgroup>
        <optgroup label="自定义">
          <option v-for="p in customProviders" :key="p.id" :value="p.id">{{ p.name }}</option>
        </optgroup>
      </select>
    </div>

    <div>
      <div class="text-xs font-medium text-[#a0907a] dark:text-[#6a5840] mb-1.5">{{ t('settings_api_url') }}</div>
      <input
        :value="apiUrl"
        @input="$emit('update:api-url', $event.target.value)"
        placeholder="https://api.example.com/v1/chat/completions"
        class="w-full px-3 py-2.5 rounded-lg text-[13px] bg-[#fffdf8] border border-[#dcd0b8] text-[#4a3a28] placeholder-[#c0b098] outline-none focus:border-[#b08a40] transition-colors dark:bg-[rgba(30,22,14,0.8)] dark:border-[#2a1e14] dark:text-[#e8dcc8] dark:placeholder-[#3a2a1a] dark:focus:border-[#c8a060]"
      />
    </div>

    <div>
      <div class="text-xs font-medium text-[#a0907a] dark:text-[#6a5840] mb-1.5">{{ t('settings_api_key') }}</div>
      <input
        :value="apiKey"
        @input="$emit('update:api-key', $event.target.value)"
        type="password"
        :placeholder="t('settings_api_key')"
        class="w-full px-3 py-2.5 rounded-lg text-[13px] bg-[#fffdf8] border border-[#dcd0b8] text-[#4a3a28] placeholder-[#c0b098] outline-none focus:border-[#b08a40] transition-colors dark:bg-[rgba(30,22,14,0.8)] dark:border-[#2a1e14] dark:text-[#e8dcc8] dark:placeholder-[#3a2a1a] dark:focus:border-[#c8a060]"
      />
    </div>

    <div>
      <div class="text-xs font-medium text-[#a0907a] dark:text-[#6a5840] mb-1.5">{{ t('settings_model') }}</div>
      <input
        :value="model"
        @input="$emit('update:model', $event.target.value)"
        :placeholder="t('settings_model_placeholder')"
        class="w-full px-3 py-2.5 rounded-lg text-[13px] bg-[#fffdf8] border border-[#dcd0b8] text-[#4a3a28] placeholder-[#c0b098] outline-none focus:border-[#b08a40] transition-colors dark:bg-[rgba(30,22,14,0.8)] dark:border-[#2a1e14] dark:text-[#e8dcc8] dark:placeholder-[#3a2a1a] dark:focus:border-[#c8a060]"
      />
    </div>

    <div class="pt-2 flex justify-end">
      <button @click="$emit('save')" class="px-5 py-2 rounded-lg text-[13px] font-semibold bg-gradient-to-br from-[#c8a060] to-[#a07840] text-[#1a1410] cursor-pointer hover:opacity-85 transition-opacity">{{ t('common_save') }}</button>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue';
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

const aggregatorProviders = computed(() => PROVIDERS.filter((p) => p.id === 'openrouter' || p.id === 'together' || p.id === 'fireworks'));
const codingProviders = computed(() => PROVIDERS.filter((p) => p.id === 'glm-coding' || p.id === 'aliyun-coding' || p.id === 'ark-coding'));
const customProviders = computed(() => PROVIDERS.filter((p) => p.id === 'custom'));
const defaultProviders = computed(() => PROVIDERS.filter((p) => !codingProviders.value.some((c) => c.id === p.id) && !aggregatorProviders.value.some((c) => c.id === p.id) && p.id !== 'custom'));
</script>
