<template>
  <div class="mask" :class="{ show: open }" @click="$emit('close')"></div>
  <aside class="sheet" :class="{ show: open }">
    <div class="grip"></div>
    <header><b>{{ editingId ? '__T_LEDGER_SHEET_EDIT__' : '__T_LEDGER_SHEET_NEW__' }}</b><span v-if="fromAi">__T_LEDGER_AI_BADGE__</span><button @click="$emit('close')">×</button></header>
    <div class="form">
      <div class="seg"><button :class="{ on: form.type === 'expense' }" @click="form.type = 'expense'; $emit('normalize')">__T_LEDGER_EXPENSE__</button><button :class="{ on: form.type === 'income' }" @click="form.type = 'income'; $emit('normalize')">__T_LEDGER_INCOME__</button></div>
      <label class="amount"><span class="mono">¥</span><input v-model.number="form.amount" class="mono" type="number" inputmode="decimal" placeholder="0.00" /></label>
      <div class="label">__T_LEDGER_CATEGORY__</div>
      <div class="cat-grid">
        <button v-for="c in categories" :key="c.name" :class="{ on: form.category === c.name }" @click="form.category = c.name"><span>{{ c.emoji }}</span>{{ c.name }}</button>
      </div>
      <div class="row"><input v-model="form.note" placeholder="__T_LEDGER_NOTE_PLACEHOLDER__" /><input v-model="form.occurredOn" type="date" /></div>
    </div>
    <footer><button v-if="editingId" class="danger" @click="$emit('delete')">__T_COMMON_DELETE__</button><button class="primary" @click="$emit('save')">__T_LEDGER_CONFIRM_SAVE__</button></footer>
  </aside>
</template>

<script setup>
defineProps({
  open: { type: Boolean, default: false },
  form: { type: Object, required: true },
  categories: { type: Array, default: () => [] },
  editingId: { default: null },
  fromAi: { type: Boolean, default: false },
});
defineEmits(['close', 'normalize', 'save', 'delete']);
</script>

<style scoped>
.mono{font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
.mask{position:fixed;inset:0;background:rgba(0,0,0,.35);opacity:0;pointer-events:none;transition:.22s;z-index:20}.mask.show{opacity:1;pointer-events:auto}
.sheet{position:fixed;left:0;right:0;bottom:0;max-height:82%;transform:translateY(105%);transition:transform .32s cubic-bezier(.2,.9,.2,1);z-index:21;background:var(--panel);border-radius:14px 14px 0 0;border-top:1px solid var(--line);box-shadow:var(--shadow-lg);display:flex;flex-direction:column}
.sheet.show{transform:translateY(0)}
.grip{width:40px;height:4px;border-radius:99px;background:var(--line2);margin:10px auto}
.sheet header,.sheet footer{display:flex;gap:9px;align-items:center;padding:10px 18px}
.sheet header span{font-size:10px;font-weight:600;letter-spacing:1px;color:var(--accent);border:1px solid var(--line2);border-radius:999px;padding:2px 8px}
.sheet header button{margin-left:auto}
.form{padding:4px 20px 8px;overflow:auto}
.seg{display:flex;background:var(--color-bg-hi);border-radius:10px;padding:3px;margin-bottom:13px}
.seg button{flex:1;border:0;border-radius:8px;padding:8px;font-weight:600;color:var(--muted);background:transparent}
.seg button.on{background:var(--panel);color:var(--accent);box-shadow:var(--shadow-sm)}
.amount{display:flex;align-items:baseline;gap:6px;padding-bottom:12px;border-bottom:1px solid var(--line);margin-bottom:13px}
.amount span{font-size:20px;color:var(--accent)}
.amount input{min-width:0;flex:1;border:0;outline:0;background:transparent;color:var(--ink);font-size:30px;font-weight:600}
.label{font-size:11px;color:var(--muted);font-weight:600;margin-bottom:8px}
.cat-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:13px}
.cat-grid button{border:1px solid var(--line);background:var(--panel);border-radius:10px;padding:9px 4px;font-size:11px;font-weight:500;color:var(--ink2)}
.cat-grid button:hover{background:var(--color-bg-hi)}
.cat-grid button span{display:block;font-size:20px}
.cat-grid button.on{border-color:var(--accent);color:var(--accent);background:var(--color-blue-bg)}
.row{display:flex;gap:9px}
.row input{min-width:0;flex:1;border:1px solid var(--line);background:var(--panel);border-radius:10px;padding:10px;color:var(--ink)}
.sheet button{border:1px solid var(--line);background:var(--panel);border-radius:8px;padding:8px 12px;font-weight:600;color:var(--ink)}
.sheet button:hover{background:var(--color-bg-hi)}
.sheet .primary{margin-left:auto;background:var(--accent);border-color:var(--accent);color:#fff}.sheet .primary:hover{background:var(--color-accent-hi)}
.sheet .danger{color:var(--red)}
</style>
