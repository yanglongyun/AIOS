<template>
  <section class="space-y-4">
    <div class="rounded-[13px] border px-4 py-4" style="background:#fff;border-color:rgba(0,0,0,0.08)">
      <div class="space-y-4">
        <!-- 供应商 -->
        <div>
          <label class="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.05em]" style="color:rgba(0,0,0,0.35)">__T_SETTINGS_PROVIDER__</label>
          <select
            :value="provider"
            class="w-full cursor-pointer appearance-none rounded-[10px] border bg-[#faf8f5] px-[14px] py-[10px] pr-9 text-[13px] outline-none transition-colors focus:border-[#a07850] focus:bg-white"
            style="border-color:rgba(0,0,0,0.1);color:#2a1f13;background-image:url(&quot;data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239a8a7a' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E&quot;);background-repeat:no-repeat;background-position:right 12px center"
            @change="onProviderChange"
          >
            <optgroup v-for="group in providerGroups" :key="group.id" :label="group.name">
              <option v-for="p in getProvidersByGroup(group.id)" :key="p.id" :value="p.id">{{ p.name }}</option>
            </optgroup>
          </select>
        </div>

        <!-- API URL -->
        <div>
          <label class="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.05em]" style="color:rgba(0,0,0,0.35)">__T_SETTINGS_API_URL__</label>
          <input
            :value="apiUrl"
            placeholder="https://api.example.com/v1/chat/completions"
            class="w-full rounded-[10px] border bg-[#faf8f5] px-[14px] py-[10px] text-[13px] outline-none transition-colors placeholder:text-[rgba(0,0,0,0.25)] focus:border-[#a07850] focus:bg-white"
            style="border-color:rgba(0,0,0,0.1);color:#2a1f13"
            @input="$emit('update:api-url', $event.target.value)"
          />
        </div>

        <!-- API Key -->
        <div>
          <label class="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.05em]" style="color:rgba(0,0,0,0.35)">__T_SETTINGS_API_KEY__</label>
          <input
            :value="apiKey"
            type="password"
            placeholder="sk-..."
            class="w-full rounded-[10px] border bg-[#faf8f5] px-[14px] py-[10px] text-[13px] outline-none transition-colors placeholder:text-[rgba(0,0,0,0.25)] focus:border-[#a07850] focus:bg-white"
            style="border-color:rgba(0,0,0,0.1);color:#2a1f13"
            @input="$emit('update:api-key', $event.target.value)"
          />
        </div>

        <!-- 模型 -->
        <div>
          <label class="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.05em]" style="color:rgba(0,0,0,0.35)">__T_SETTINGS_MODEL__</label>
          <input
            :value="model"
            placeholder="__T_SETTINGS_MODEL_PLACEHOLDER__"
            class="w-full rounded-[10px] border bg-[#faf8f5] px-[14px] py-[10px] text-[13px] outline-none transition-colors placeholder:text-[rgba(0,0,0,0.25)] focus:border-[#a07850] focus:bg-white"
            style="border-color:rgba(0,0,0,0.1);color:#2a1f13"
            @input="$emit('update:model', $event.target.value)"
          />
        </div>
      </div>

      <div class="mt-5 flex justify-end border-t pt-4" style="border-color:rgba(0,0,0,0.06)">
        <div class="flex items-center gap-3">
          <p
            v-if="saveNotice?.message"
            class="text-[12px] font-medium"
            :style="saveNotice.type === 'error' ? 'color:#b2452f' : 'color:#6f7f4b'"
          >
            {{ saveNotice.message }}
          </p>
          <button
            class="rounded-[9px] bg-[#5c4332] px-5 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-[#3d2a1e]"
            @click="$emit('save')"
          >__T_COMMON_SAVE__</button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
const props = defineProps({
  provider: { type: String, default: 'deepseek' },
  apiUrl: { type: String, default: '' },
  apiKey: { type: String, default: '' },
  model: { type: String, default: '' },
  providerGroups: { type: Array, default: () => [] },
  providers: { type: Array, default: () => [] },
  saveNotice: { type: Object, default: () => ({ type: '', message: '' }) }
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
  emit('update:provider', e.target.value);
};
</script>
