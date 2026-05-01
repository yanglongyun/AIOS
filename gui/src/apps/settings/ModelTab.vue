<template>
  <section class="space-y-4">
    <!-- 供应商 -->
    <div>
      <label class="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.05em] text-muted">__T_SETTINGS_PROVIDER__</label>
      <select
        :value="provider"
        class="text-input cursor-pointer pr-9 select-arrow"
        @change="onProviderChange"
      >
        <optgroup v-for="group in providerGroups" :key="group.id" :label="group.name">
          <option v-for="p in getProvidersByGroup(group.id)" :key="p.id" :value="p.id">{{ p.name }}</option>
        </optgroup>
      </select>
    </div>

    <!-- API URL -->
    <div>
      <label class="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.05em] text-muted">__T_SETTINGS_API_URL__</label>
      <input
        :value="apiUrl"
        placeholder="https://api.example.com/v1/chat/completions"
        class="text-input"
        @input="$emit('update:api-url', $event.target.value)"
      />
    </div>

    <!-- API Key -->
    <div>
      <label class="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.05em] text-muted">__T_SETTINGS_API_KEY__</label>
      <input
        :value="apiKey"
        type="password"
        placeholder="sk-..."
        class="text-input"
        @input="$emit('update:api-key', $event.target.value)"
      />
    </div>

    <!-- 模型 -->
    <div>
      <label class="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.05em] text-muted">__T_SETTINGS_MODEL__</label>
      <input
        :value="model"
        placeholder="__T_SETTINGS_MODEL_PLACEHOLDER__"
        class="text-input"
        @input="$emit('update:model', $event.target.value)"
      />
    </div>

    <div class="flex items-center justify-end gap-3 pt-3">
      <p
        v-if="saveNotice?.message"
        class="text-[12px] font-medium"
        :class="saveNotice.type === 'error' ? 'text-bad' : 'text-good'"
      >
        {{ saveNotice.message }}
      </p>
      <button class="save-btn" @click="$emit('save')">__T_COMMON_SAVE__</button>
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

<style scoped>
/* select 箭头 —— Tailwind 不能写 inline SVG 背景 */
.select-arrow {
  appearance: none;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2380868b' stroke-width='2'><path d='M6 9l6 6 6-6'/></svg>");
  background-repeat: no-repeat;
  background-position: right 12px center;
}
</style>
