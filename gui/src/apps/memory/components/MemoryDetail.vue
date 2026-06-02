<template>
  <section class="detail">
    <div v-if="mode === 'empty'" class="empty">
      <span class="msi">psychology</span>
      <p>选择一条记忆查看内容，或新建一条记忆。</p>
    </div>

    <template v-else>
      <header class="head">
        <div>
          <div class="eyebrow">{{ mode === 'create' ? '新建' : '记忆' }}</div>
          <h2>{{ mode === 'create' ? '新建记忆' : title || '未命名记忆' }}</h2>
        </div>
        <div class="actions">
          <button v-if="mode === 'view'" class="secondary-btn" @click="$emit('edit')">编辑</button>
          <button v-if="mode !== 'view'" class="secondary-btn" @click="$emit('cancel')">取消</button>
          <button v-if="mode !== 'view'" class="primary-btn" :disabled="!canSave || saving" @click="$emit('save')">
            {{ saving ? '保存中' : '保存' }}
          </button>
        </div>
      </header>

      <div v-if="mode === 'view'" class="view">
        <p v-if="description" class="description">{{ description }}</p>
        <pre>{{ content }}</pre>
      </div>

      <div v-else class="form">
        <label>
          <span>标题</span>
          <input :value="title" placeholder="例如：写作偏好" @input="$emit('update:title', $event.target.value)" />
        </label>
        <label>
          <span>简介</span>
          <input :value="description" placeholder="用于快速识别这条记忆" @input="$emit('update:description', $event.target.value)" />
        </label>
        <label>
          <span>正文</span>
          <textarea :value="content" placeholder="希望 AI 长期记住的具体内容" @input="$emit('update:content', $event.target.value)"></textarea>
        </label>
        <div class="field">
          <span>可见性</span>
          <div class="visibility">
            <button
              v-for="item in visibilityOptions"
              :key="item.value"
              type="button"
              :class="{ active: visibility === item.value }"
              @click="$emit('update:visibility', item.value)">
              <span class="msi xxs">{{ item.icon }}</span>
              {{ item.label }}
            </button>
          </div>
        </div>
      </div>
    </template>
  </section>
</template>

<script setup>
defineProps({
  mode: { type: String, required: true },
  title: { type: String, default: '' },
  description: { type: String, default: '' },
  content: { type: String, default: '' },
  visibility: { type: String, default: 'full' },
  saving: { type: Boolean, default: false },
  canSave: { type: Boolean, default: false },
});

defineEmits(['update:title', 'update:description', 'update:content', 'update:visibility', 'edit', 'cancel', 'save']);

const visibilityOptions = [
  { value: 'full', label: '必读', icon: 'visibility' },
  { value: 'summary', label: '已存', icon: 'bookmark' },
  { value: 'count', label: '计数', icon: 'radio_button_unchecked' },
];
</script>

<style scoped>
.detail {
  min-width: 0;
  padding: 0 0 18px;
}
.empty {
  display: grid;
  min-height: 320px;
  place-items: center;
  align-content: center;
  gap: 10px;
  color: var(--text-2);
  text-align: center;
}
.empty .msi {
  color: var(--text-3);
  font-size: 40px;
}
.head {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 16px;
  border-bottom: 1px solid var(--line-soft);
  padding-bottom: 14px;
}
.eyebrow {
  color: var(--accent);
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 650;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
h2 {
  color: var(--text);
  font-family: var(--font-mono);
  font-size: 22px;
  font-weight: 650;
  margin-top: 3px;
}
.actions {
  display: flex;
  flex: none;
  gap: 8px;
}
.view {
  padding-top: 18px;
}
.description {
  color: var(--text-2);
  font-size: 14px;
  line-height: 1.7;
  margin-bottom: 16px;
}
pre {
  color: var(--text);
  font: inherit;
  font-size: 14px;
  line-height: 1.8;
  white-space: pre-wrap;
}
.form {
  display: grid;
  gap: 14px;
  padding-top: 18px;
}
label,
.field {
  display: grid;
  gap: 6px;
}
label span,
.field > span {
  color: var(--text-2);
  font-size: 12px;
  font-weight: 650;
}
input,
textarea {
  width: 100%;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: var(--bg-elev);
  color: var(--text);
  font-size: 14px;
  outline: none;
  padding: 10px 12px;
}
textarea {
  min-height: 320px;
  resize: vertical;
  line-height: 1.7;
}
input:focus,
textarea:focus {
  border-color: var(--accent);
  box-shadow: 0 0 18px rgba(0, 229, 255, 0.12);
}
.visibility {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.visibility button {
  display: inline-flex;
  min-height: 34px;
  align-items: center;
  gap: 6px;
  border: 1px solid var(--line);
  border-radius: 6px;
  color: var(--text-2);
  font-size: 13px;
  font-weight: 650;
  padding: 0 12px;
}
.visibility button.active {
  border-color: rgba(0, 229, 255, .34);
  background: var(--accent-soft);
  color: var(--accent);
}
.primary-btn,
.secondary-btn {
  display: inline-flex;
  min-height: 36px;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 650;
  padding: 0 14px;
}
.primary-btn {
  background: var(--accent);
  color: var(--bg-elev);
}
.primary-btn:disabled {
  cursor: not-allowed;
  opacity: 0.48;
}
.secondary-btn {
  border: 1px solid var(--line);
  background: var(--bg-elev);
  color: var(--text-2);
}
@media (max-width: 980px) {
  .detail {
    padding-bottom: 0;
  }
}
@media (max-width: 768px) {
  .head {
    align-items: stretch;
    flex-direction: column;
  }
  .actions {
    justify-content: stretch;
  }
  .actions button {
    flex: 1;
  }
}
</style>
