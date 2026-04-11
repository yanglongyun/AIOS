<template>
  <section class="space-y-4">
    <div class="rounded-[13px] border px-4 py-4" style="background:#fff;border-color:rgba(0,0,0,0.08)">
      <div class="space-y-4">
        <!-- 供应商 -->
        <div>
          <label class="s-label">__T_SETTINGS_PROVIDER__</label>
          <select
            :value="provider"
            @change="onProviderChange"
            class="s-select"
          >
            <optgroup v-for="group in providerGroups" :key="group.id" :label="group.name">
              <option v-for="p in getProvidersByGroup(group.id)" :key="p.id" :value="p.id">{{ p.name }}</option>
            </optgroup>
          </select>
        </div>

        <!-- API URL -->
        <div>
          <label class="s-label">__T_SETTINGS_API_URL__</label>
          <input
            :value="apiUrl"
            @input="$emit('update:api-url', $event.target.value)"
            placeholder="https://api.example.com/v1/chat/completions"
            class="s-input"
          />
        </div>

        <!-- API Key -->
        <div>
          <label class="s-label">__T_SETTINGS_API_KEY__</label>
          <input
            :value="apiKey"
            @input="$emit('update:api-key', $event.target.value)"
            type="password"
            placeholder="sk-..."
            class="s-input"
          />
        </div>

        <!-- 模型 -->
        <div>
          <label class="s-label">__T_SETTINGS_MODEL__</label>
          <input
            :value="model"
            @input="$emit('update:model', $event.target.value)"
            placeholder="__T_SETTINGS_MODEL_PLACEHOLDER__"
            class="s-input"
          />
        </div>
      </div>

      <div class="mt-5 flex justify-end border-t pt-4" style="border-color:rgba(0,0,0,0.06)">
        <button @click="$emit('save')" class="s-btn-primary">__T_COMMON_SAVE__</button>
      </div>
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
  emit('update:provider', e.target.value);
};
</script>

<style scoped>
.s-label {
  display: block;
  margin-bottom: 6px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: rgba(0,0,0,0.35);
}
.s-input, .s-select {
  width: 100%;
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid rgba(0,0,0,0.1);
  background: #faf8f5;
  font-size: 13px;
  color: #2a1f13;
  outline: none;
  transition: border-color 0.15s;
}
.s-select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239a8a7a' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  cursor: pointer;
}
.s-input::placeholder { color: rgba(0,0,0,0.25); }
.s-input:focus, .s-select:focus { border-color: #a07850; background: #fff; }

.s-btn-primary {
  padding: 8px 20px;
  border-radius: 9px;
  background: #5c4332;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: background 0.15s;
}
.s-btn-primary:hover { background: #3d2a1e; }
</style>
