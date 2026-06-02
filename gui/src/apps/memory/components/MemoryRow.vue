<template>
  <article class="memory-row" :class="{ active }">
    <button class="main" @click="$emit('open')">
      <span class="title">{{ item.title }}</span>
      <span class="desc">{{ item.description || '没有简介' }}</span>
    </button>
    <span class="chip" :class="visibilityMeta.className">
      <span class="msi xxs">{{ visibilityMeta.icon }}</span>
      {{ visibilityMeta.label }}
    </span>
    <div class="actions">
      <button class="icon-btn sm" :class="{ active: item.starred }" :title="item.starred ? '取消星标' : '标为星标'" @click="$emit('set-starred', !item.starred)">
        <span class="msi xxs">{{ item.starred ? 'star' : 'star_border' }}</span>
      </button>
      <button class="icon-btn sm danger" title="删除" @click="$emit('delete')">
        <span class="msi xxs">delete</span>
      </button>
    </div>
  </article>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  item: { type: Object, required: true },
  active: { type: Boolean, default: false },
});

defineEmits(['open', 'set-starred', 'delete']);

const VIS_OPTS = [
  { value: 'full', label: '必读', icon: 'visibility', className: 'full' },
  { value: 'summary', label: '已存', icon: 'bookmark', className: 'summary' },
  { value: 'count', label: '计数', icon: 'radio_button_unchecked', className: 'count' },
];

const visibilityMeta = computed(() => VIS_OPTS.find((item) => item.value === props.item.visibility) || VIS_OPTS[0]);
</script>

<style scoped>
.memory-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid var(--line-soft);
  min-height: 68px;
  padding: 10px 4px;
}
.memory-row:hover,
.memory-row.active {
  background: var(--bg-hover);
}
.main {
  display: grid;
  min-width: 0;
  gap: 3px;
  text-align: left;
}
.title {
  overflow: hidden;
  color: var(--text);
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 650;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.desc {
  overflow: hidden;
  color: var(--text-2);
  font-size: 12.5px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border-radius: 4px;
  color: var(--text-2);
  font-size: 12px;
  font-weight: 650;
  padding: 4px 8px;
}
.chip.full { background: rgba(0, 230, 118, .10); color: var(--good); }
.chip.summary { background: rgba(255, 214, 0, .10); color: var(--warn); }
.chip.count { background: var(--bg-elev); color: var(--text-2); }
.actions {
  display: flex;
  align-items: center;
  gap: 2px;
}
.icon-btn.sm.active {
  background: var(--accent-soft);
  color: var(--accent);
}
.icon-btn.sm.active .msi {
  font-variation-settings: 'FILL' 1;
}
.icon-btn.sm.danger:hover {
  background: rgba(255, 23, 68, .10);
  color: var(--bad);
}
@media (max-width: 768px) {
  .memory-row {
    grid-template-columns: minmax(0, 1fr) auto;
  }
  .chip {
    display: none;
  }
}
</style>
