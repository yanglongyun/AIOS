<template>
  <section class="space-y-4">
    <p class="text-[13px] text-[#a09078] dark:text-[#8a7860]">{{ t('settings_resources_hint') }}</p>

    <div class="space-y-3">
      <div v-for="(item, idx) in items" :key="item.id || idx"
        class="group rounded-lg border border-[#dcd0b8] bg-[#f0e8d8] px-4 py-3 dark:border-[#3a2a18] dark:bg-black/20">
        <div class="flex items-center gap-2">
          <input v-model.trim="item.title" :placeholder="t('settings_resource_title_ph')"
            class="flex-1 border-b border-transparent bg-transparent text-[13px] font-semibold text-[#5a3e28] outline-none placeholder:text-[#b8a888] focus:border-[#c8a060] dark:text-[#e8d4b8] dark:placeholder:text-[#5a4a35]" />
          <button class="cursor-pointer text-sm text-[#b8a888] opacity-0 transition-colors hover:text-[#c8a060] group-hover:opacity-100 dark:text-[#6a5840]"
            @click="removeItem(idx)">✕</button>
        </div>
        <textarea v-model.trim="item.content" :placeholder="t('settings_resource_content_ph')" rows="2"
          class="mt-2 w-full resize-none bg-transparent text-[13px] leading-relaxed text-[#7a6a50] outline-none placeholder:text-[#b8a888] focus:text-[#5a3e28] dark:text-[#a09078] dark:placeholder:text-[#5a4a35] dark:focus:text-[#c8b898]"></textarea>
      </div>
    </div>

    <button class="cursor-pointer text-[13px] text-[#b8a888] transition-colors hover:text-[#c8a060] dark:text-[#6a5840]"
      @click="addItem">+ {{ t('settings_resource_add') }}</button>

    <div class="flex justify-start pt-2">
      <button @click="saveAll" :disabled="saving"
        class="cursor-pointer rounded-lg bg-gradient-to-br from-[#c8a060] to-[#a07840] px-5 py-2 text-[13px] font-semibold text-[#1a1410] transition-opacity hover:opacity-85 disabled:opacity-40">
        {{ saving ? t('settings_saving') : t('common_save') }}
      </button>
    </div>
  </section>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useI18n } from '../../i18n/index.js';
import { toast } from '../../stores/toast.js';
const { t } = useI18n();

const items = ref([]);
const saving = ref(false);

const request = async (url, options = {}) => {
  const res = await fetch(url, { credentials: 'include', ...options });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || data.error || `${res.status}`);
  return data;
};

const load = async () => {
  const data = await request('/api/resources');
  items.value = (data.items || []).map(r => ({ ...r }));
};

const addItem = () => {
  items.value.push({ id: null, title: '', content: '' });
};

const removeItem = async (idx) => {
  const item = items.value[idx];
  if (item.id) {
    try {
      await request('/api/resources/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id })
      });
    } catch (e) {
      toast.show(t('settings_save_failed', { message: e.message }), { type: 'error' });
      return;
    }
  }
  items.value.splice(idx, 1);
};

const saveAll = async () => {
  saving.value = true;
  try {
    for (const item of items.value) {
      if (!item.title.trim()) continue;
      if (item.id) {
        await request('/api/resources/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: item.id, title: item.title.trim(), content: (item.content || '').trim() })
        });
      } else {
        const data = await request('/api/resources/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: item.title.trim(), content: (item.content || '').trim() })
        });
        item.id = data.id;
      }
    }
    toast.show(t('settings_saved'));
  } catch (e) {
    toast.show(t('settings_save_failed', { message: e.message }), { type: 'error' });
  } finally {
    saving.value = false;
  }
};

onMounted(load);
</script>
