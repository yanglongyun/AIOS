<script setup>
import { ref } from 'vue';
import ImageProviderTab from './settings/ImageProviderTab.vue';
import AudioProviderTab from './settings/AudioProviderTab.vue';
import PromptSettingsTab from './settings/PromptSettingsTab.vue';

defineProps({
    settings: { type: Object, required: true },
    imageReady: { type: Boolean, default: false },
    audioReady: { type: Boolean, default: false },
    busy: { type: Boolean, default: false },
    testing: { type: String, default: '' },
    message: { type: String, default: '' },
    testMessage: { type: String, default: '' },
});

const emit = defineEmits(['patch', 'save', 'clear', 'test-image', 'test-audio']);
const active = ref('image');

const tabs = [
    { id: 'image', label: '图片生成', icon: 'image' },
    { id: 'audio', label: '语音生成', icon: 'graphic_eq' },
    { id: 'prompt', label: '提示词', icon: 'edit_note' },
];

const update = (patch) => emit('patch', patch);
</script>

<template>
    <section class="settings-page">
        <nav class="tabs">
            <button v-for="tab in tabs" :key="tab.id" :class="{ active: active === tab.id }" @click="active = tab.id">
                <span class="msi xxs">{{ tab.icon }}</span>
                {{ tab.label }}
            </button>
        </nav>

        <ImageProviderTab
            v-if="active === 'image'"
            :settings="settings"
            :ready="imageReady"
            :busy="busy"
            :testing="testing === 'image'"
            @patch="update"
            @save="$emit('save')"
            @test="$emit('test-image')" />

        <AudioProviderTab
            v-else-if="active === 'audio'"
            :settings="settings"
            :ready="audioReady"
            :busy="busy"
            :testing="testing === 'audio'"
            @patch="update"
            @save="$emit('save')"
            @test="$emit('test-audio')" />

        <PromptSettingsTab
            v-else
            :settings="settings"
            :busy="busy"
            @patch="update"
            @save="$emit('save')" />

        <div class="actions">
            <button class="secondary" :disabled="busy || Boolean(testing)" @click="$emit('clear')">
                <span class="msi xxs">delete</span>
                清空授权
            </button>
            <span v-if="message" class="message">{{ message }}</span>
            <span v-if="testMessage" class="message">{{ testMessage }}</span>
        </div>
    </section>
</template>

<style scoped>
.settings-page {
    display: grid;
    gap: 16px;
}
.tabs {
    display: inline-flex;
    width: max-content;
    max-width: 100%;
    gap: 4px;
    overflow-x: auto;
    scrollbar-width: none;
    border-radius: 999px;
    background: #eef3f7;
    padding: 4px;
}
.tabs::-webkit-scrollbar { display: none; }
.tabs button {
    display: inline-flex;
    flex: 0 0 auto;
    min-height: 34px;
    align-items: center;
    gap: 6px;
    border-radius: 999px;
    color: #53616e;
    font-size: 13px;
    font-weight: 650;
    white-space: nowrap;
    padding: 0 14px;
}
.tabs button.active {
    background: #fff;
    color: #174ea6;
    box-shadow: 0 1px 3px rgba(60, 64, 67, 0.12);
}
.actions {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
}
.secondary {
    display: inline-flex;
    min-height: 38px;
    align-items: center;
    gap: 7px;
    border-radius: 6px;
    background: #edf3ff;
    color: #174ea6;
    font-size: 13px;
    font-weight: 650;
    padding: 0 14px;
}
.secondary:disabled {
    cursor: not-allowed;
    opacity: 0.48;
}
.message {
    color: #1f6b3e;
    font-size: 12px;
}
@media (max-width: 768px) {
    .tabs {
        width: 100%;
        border-radius: 18px;
    }
    .tabs button {
        min-width: max-content;
        justify-content: center;
    }
}
</style>
