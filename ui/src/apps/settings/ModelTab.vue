<template>
  <section class="space-y-4">
    <div>
      <div class="text-xs font-medium text-black/40 mb-1.5">__T_SETTINGS_PROVIDER__</div>
      <select
        :value="provider"
        @change="onProviderChange"
        class="w-full px-3 py-2.5 rounded-lg text-[13px] bg-white border border-black/10 text-[#222] outline-none focus:border-[#222] transition-colors cursor-pointer appearance-none"
        style="background-image: url(&quot;data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239a9a9a' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E&quot;); background-repeat: no-repeat; background-position: right 12px center;"
      >
        <optgroup v-for="group in providerGroups" :key="group.id" :label="group.name">
          <option v-for="p in getProvidersByGroup(group.id)" :key="p.id" :value="p.id">{{ p.name }}</option>
        </optgroup>
      </select>
    </div>

    <div>
      <div class="text-xs font-medium text-black/40 mb-1.5">__T_SETTINGS_API_URL__</div>
      <input
        :value="apiUrl"
        @input="$emit('update:api-url', $event.target.value)"
        placeholder="https://api.example.com/v1/chat/completions"
        class="w-full px-3 py-2.5 rounded-lg text-[13px] bg-white border border-black/10 text-[#222] placeholder:text-black/25 outline-none focus:border-[#222] transition-colors"
      />
    </div>

    <div>
      <div class="text-xs font-medium text-black/40 mb-1.5">__T_SETTINGS_API_KEY__</div>
      <input
        :value="apiKey"
        @input="$emit('update:api-key', $event.target.value)"
        type="password"
        placeholder="__T_SETTINGS_API_KEY__"
        class="w-full px-3 py-2.5 rounded-lg text-[13px] bg-white border border-black/10 text-[#222] placeholder:text-black/25 outline-none focus:border-[#222] transition-colors"
      />
    </div>

    <div>
      <div class="text-xs font-medium text-black/40 mb-1.5">__T_SETTINGS_MODEL__</div>
      <input
        :value="model"
        @input="$emit('update:model', $event.target.value)"
        placeholder="__T_SETTINGS_MODEL_PLACEHOLDER__"
        class="w-full px-3 py-2.5 rounded-lg text-[13px] bg-white border border-black/10 text-[#222] placeholder:text-black/25 outline-none focus:border-[#222] transition-colors"
      />
    </div>

    <div class="pt-2 flex justify-start">
      <button @click="$emit('save')" class="px-5 py-2 rounded-lg text-[13px] font-semibold bg-[#222] text-white cursor-pointer hover:bg-black transition-colors">__T_COMMON_SAVE__</button>
    </div>
  </section>
</template>

<script setup>
const props = defineProps({
  provider: { type: String, default: 'openrouter' },
  apiUrl: { type: String, default: '' },
  apiKey: { type: String, default: '' },
  model: { type: String, default: '' },
  providerGroups: { type: Array, default: () => [] },
  providers: { type: Array, default: () => [] }
});

const emit = defineEmits([
  'update:provider',
  'update:api-url',
  'update:api-key',
  'update:model',
  'save'
]);

const getProvidersByGroup = (groupId) => props.providers.filter((item) => item.group === groupId);

const onProviderChange = (e) => {
  const value = e.target.value;
  emit('update:provider', value);
};
</script>
