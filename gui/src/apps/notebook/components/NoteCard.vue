<script setup>
const props = defineProps({
  note: { type: Object, required: true },
});
const emit = defineEmits(['click', 'pin', 'remove']);

const preview = (content) => {
  const text = (content || '').replace(/[#*_`~>\-\[\]()!|]/g, '').replace(/\n+/g, ' ').trim();
  return text.length > 100 ? text.slice(0, 100) + '…' : text;
};

const fmtTime = (s) => {
  if (!s) return '';
  const d = new Date(String(s).replace(' ', 'T') + 'Z');
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60)    return '__T_COMMON_JUST_NOW__';
  if (diff < 3600)  return '__T_COMMON_MINUTES_AGO__'.replace('{count}', Math.floor(diff / 60));
  if (diff < 86400) return '__T_COMMON_HOURS_AGO__'.replace('{count}', Math.floor(diff / 3600));
  if (diff < 86400 * 30) return '__T_COMMON_DAYS_AGO__'.replace('{count}', Math.floor(diff / 86400));
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};
const accessLabel = (access) => {
  if (access === 'full') return '__T_NOTEBOOK_ACCESS_FULL__';
  if (access === 'summary') return '__T_NOTEBOOK_ACCESS_SUMMARY__';
  return '';
};
</script>

<template>
  <div class="note-card group/n" :class="{ pinned: note.pinned }" @click="emit('click', note)">
    <!-- Pin ribbon -->
    <span v-if="note.pinned" class="pin-ribbon">
      <span class="msi" style="font-size:12px;color:white">push_pin</span>
    </span>

    <div class="card-body">
      <div class="card-title">{{ note.title }}</div>
      <div v-if="preview(note.content)" class="card-preview">{{ preview(note.content) }}</div>
      <div class="card-meta">
        <span>{{ fmtTime(note.updatedAt) }}</span>
        <span v-if="accessLabel(note.access)" class="access-chip">{{ accessLabel(note.access) }}</span>
      </div>
    </div>

    <div class="card-actions">
      <button class="card-btn" @click.stop="emit('pin', note)"
        :title="note.pinned ? '__T_NOTEBOOK_UNPIN__' : '__T_NOTEBOOK_PIN__'">
        <span class="msi sm" :class="{ filled: note.pinned }">push_pin</span>
      </button>
      <button class="card-btn danger" @click.stop="emit('remove', note)" title="__T_COMMON_DELETE__">
        <span class="msi sm">close</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.note-card {
  position: relative;
  padding: 16px 18px;
  border-radius: 6px;
  cursor: pointer;
  transition: transform .15s, box-shadow .2s;

  /* paper look */
  background: linear-gradient(175deg, var(--color-card) 0%, color-mix(in srgb, var(--color-card) 94%, #f5e6c8) 100%);
  box-shadow:
    0 1px 2px rgba(0,0,0,.06),
    0 4px 12px rgba(0,0,0,.04),
    inset 0 1px 0 rgba(255,255,255,.5);
  border: 1px solid color-mix(in srgb, var(--color-line) 60%, transparent);
}
.note-card:hover {
  transform: translateY(-2px);
  box-shadow:
    0 2px 6px rgba(0,0,0,.08),
    0 8px 24px rgba(0,0,0,.06),
    inset 0 1px 0 rgba(255,255,255,.5);
}

.note-card.pinned {
  border-left: 3px solid var(--color-accent);
  background: linear-gradient(175deg, color-mix(in srgb, var(--color-accent) 4%, var(--color-card)) 0%, color-mix(in srgb, var(--color-accent) 2%, var(--color-card)) 100%);
}

/* Corner fold */
.note-card::after {
  content: '';
  position: absolute;
  bottom: 0; right: 0;
  width: 16px; height: 16px;
  background: linear-gradient(135deg, transparent 50%, color-mix(in srgb, var(--color-line) 40%, transparent) 50%);
  border-radius: 0 0 6px 0;
  opacity: .6;
}
.note-card:hover::after { opacity: .9; }

.pin-ribbon {
  position: absolute;
  top: -4px; right: 12px;
  width: 22px; height: 28px;
  display: flex; align-items: center; justify-content: center;
  padding-top: 4px;
  background: var(--color-accent);
  border-radius: 0 0 3px 3px;
  box-shadow: 0 2px 4px rgba(0,0,0,.15);
}

.card-body { position: relative; z-index: 1; }

.card-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-ink);
  line-height: 1.3;
}
.card-preview {
  margin-top: 6px;
  font-size: 13px;
  line-height: 1.55;
  color: var(--color-muted);
}
.card-meta {
  margin-top: 8px;
  font-size: 11px;
  color: var(--color-faint);
  display: flex;
  align-items: center;
  gap: 6px;
}
.access-chip {
  border-radius: 999px;
  padding: 1px 6px;
  background: color-mix(in srgb, var(--color-accent) 10%, transparent);
  color: var(--color-accent);
}

.card-actions {
  position: absolute;
  top: 10px; right: 10px;
  display: flex; gap: 2px;
  opacity: 0;
  transition: opacity .15s;
}
.note-card:hover .card-actions { opacity: 1; }

.card-btn {
  display: grid; place-items: center;
  width: 28px; height: 28px;
  border: 0; border-radius: 6px;
  background: color-mix(in srgb, var(--color-bg) 80%, transparent);
  backdrop-filter: blur(4px);
  color: var(--color-muted);
  cursor: pointer;
  transition: background .12s, color .12s;
}
.card-btn:hover { background: var(--color-bg-hi); color: var(--color-ink); }
.card-btn.danger:hover { color: var(--color-bad); }
</style>
