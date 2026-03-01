<template>
  <div class="group">
    <div class="relative -ml-2 flex items-start rounded-lg px-2 py-1.5 transition-colors group/row">
      <button
        class="mt-3 mr-1 flex h-6 w-6 shrink-0 items-center justify-center rounded text-gray-400 transition-colors"
        :class="{ invisible: !hasChildren }"
        @click="toggleExpand"
      >
        <svg
          class="h-4 w-4 transition-transform duration-200"
          :class="{ 'rotate-90': expanded }"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>

      <div class="min-w-0 flex-1 pt-0.5">
        <div
          ref="textRef"
          contenteditable="true"
          class="rounded border border-transparent px-2 py-1.5 font-medium break-words text-gray-800 outline-none transition-all focus:border-stone-300 focus:bg-stone-100/50 dark:text-neutral-100 dark:focus:border-neutral-600 dark:focus:bg-neutral-800/70"
          @input="onInput"
          @compositionstart="onCompositionStart"
          @compositionend="onCompositionEnd"
          @keydown.enter.prevent="onEnter"
          @keydown.backspace="onBackspace"
          @keydown.tab.prevent="onTab"
        />

        <div
          v-if="node.note || focusedNote"
          ref="noteRef"
          contenteditable="true"
          class="ml-1 mt-1 break-words text-sm text-gray-500 outline-none dark:text-neutral-400"
          :class="{ 'opacity-50': !node.note && !focusedNote }"
          @input="updateNote"
          @focus="focusedNote = true"
          @blur="focusedNote = false"
        >{{ node.note }}</div>
      </div>

      <div class="absolute right-2 top-1 ml-2 flex items-center gap-1 rounded-md border border-gray-100 bg-white/80 px-1 py-0.5 opacity-0 shadow-sm backdrop-blur-sm transition-opacity group-hover/row:opacity-100 dark:border-neutral-700 dark:bg-neutral-800/80">
        <div class="drag-handle cursor-grab rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 active:cursor-grabbing dark:hover:bg-neutral-700">
          <svg viewBox="0 0 24 24" class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="9" cy="12" r="1" />
            <circle cx="9" cy="5" r="1" />
            <circle cx="9" cy="19" r="1" />
            <circle cx="15" cy="12" r="1" />
            <circle cx="15" cy="5" r="1" />
            <circle cx="15" cy="19" r="1" />
          </svg>
        </div>
        <button class="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-stone-800 dark:hover:bg-neutral-700 dark:hover:text-neutral-200" @click="addChildToSelf">
          <svg viewBox="0 0 24 24" class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
        <button class="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/40" @click="$emit('delete', node.id)">
          <svg viewBox="0 0 24 24" class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>

    <div v-if="hasChildren && expanded" class="ml-3 border-l border-gray-100/80 pl-4 dark:border-neutral-700/80">
      <draggable
        :list="node.children"
        group="outline"
        item-key="id"
        handle=".drag-handle"
        animation="150"
        :ghost-class="'opacity-70 border-2 border-dashed border-slate-300 rounded-lg bg-slate-50'"
      >
        <template #item="{ element }">
          <OutlineNode
            :node="element"
            :focus-node-id="focusNodeId"
            @update="updateChild"
            @add-sibling="addChildSibling"
            @indent="indentChild"
            @delete="deleteChild"
            @focus-node="$emit('focus-node', $event)"
          />
        </template>
      </draggable>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import draggable from 'vuedraggable';

const props = defineProps({
  node: { type: Object, required: true },
  focusNodeId: { type: String, default: '' }
});

const emit = defineEmits(['update', 'add-sibling', 'delete', 'indent', 'focus-node']);
const expanded = ref(true);
const focusedNote = ref(false);
const textRef = ref(null);
const noteRef = ref(null);
const composing = ref(false);
const hasChildren = computed(() => Array.isArray(props.node.children) && props.node.children.length > 0);

const focusText = () => nextTick(() => textRef.value?.focus());

onMounted(() => {
  if (textRef.value) textRef.value.innerText = props.node.text || '';
  if (props.focusNodeId && props.focusNodeId === props.node.id) focusText();
});

watch(() => props.node.text, (newVal) => {
  if (textRef.value && textRef.value.innerText !== newVal) {
    textRef.value.innerText = newVal || '';
  }
});

watch(() => props.focusNodeId, (id) => {
  if (id === props.node.id) focusText();
});

const toggleExpand = () => {
  if (hasChildren.value) expanded.value = !expanded.value;
};

const onCompositionStart = () => { composing.value = true; };
const onCompositionEnd = (e) => {
  composing.value = false;
  onInput(e);
};

const onInput = (e) => {
  if (composing.value) return;
  emit('update', { ...props.node, text: e.target.innerText });
};

const updateNote = (e) => emit('update', { ...props.node, note: e.target.innerText });
const onEnter = () => emit('add-sibling', props.node.id);

const onBackspace = (e) => {
  if ((props.node.text || '') === '' && (!props.node.children || props.node.children.length === 0)) {
    e.preventDefault();
    emit('delete', props.node.id);
  }
};

const onTab = () => emit('indent', props.node.id);

const updateChild = (updatedChild) => {
  const nextChildren = (props.node.children || []).map((child) => (child.id === updatedChild.id ? updatedChild : child));
  emit('update', { ...props.node, children: nextChildren });
};

const deleteChild = (childId) => {
  const nextChildren = (props.node.children || []).filter((child) => child.id !== childId);
  emit('update', { ...props.node, children: nextChildren });
};

const addChildSibling = (childId) => {
  const index = (props.node.children || []).findIndex((child) => child.id === childId);
  if (index < 0) return;
  const newId = Math.random().toString(36).slice(2, 10);
  const newNode = { id: newId, text: '', note: '', children: [] };
  const nextChildren = [...(props.node.children || [])];
  nextChildren.splice(index + 1, 0, newNode);
  emit('update', { ...props.node, children: nextChildren });
  emit('focus-node', newId);
};

const addChildToSelf = () => {
  const newId = Math.random().toString(36).slice(2, 10);
  const newNode = { id: newId, text: '', note: '', children: [] };
  const nextChildren = [...(props.node.children || []), newNode];
  emit('update', { ...props.node, children: nextChildren });
  expanded.value = true;
  emit('focus-node', newId);
};

const indentChild = (childId) => {
  const index = (props.node.children || []).findIndex((child) => child.id === childId);
  if (index <= 0) return;
  const prev = props.node.children[index - 1];
  const current = props.node.children[index];
  const updatedPrev = { ...prev, children: [...(prev.children || []), current] };
  const nextChildren = [...props.node.children];
  nextChildren.splice(index, 1);
  nextChildren[index - 1] = updatedPrev;
  emit('update', { ...props.node, children: nextChildren });
  emit('focus-node', current.id);
};
</script>
