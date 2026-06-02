<script setup>
defineProps({
    settings: { type: Object, required: true },
    busy: { type: Boolean, default: false },
});

const emit = defineEmits(['patch', 'save']);
const update = (key, event) => emit('patch', { [key]: event.target.value });
</script>

<template>
    <section class="prompt-section">
        <div class="section-head">
            <div>
                <div class="kicker">提示词</div>
                <h2>生成流程模板</h2>
            </div>
        </div>

        <label>
            <span>项目描述提示词</span>
            <textarea
                class="input textarea small"
                :value="settings.projectPromptTemplate"
                spellcheck="false"
                @input="update('projectPromptTemplate', $event)" />
        </label>

        <label>
            <span>视频规划提示词</span>
            <textarea
                class="input textarea"
                :value="settings.planPromptTemplate"
                spellcheck="false"
                @input="update('planPromptTemplate', $event)" />
        </label>

        <p class="hint">可用变量：{title}、{prompt}。</p>

        <div class="buttons">
            <button class="primary" :disabled="busy" @click="$emit('save')">
                <span class="msi xxs">save</span>
                {{ busy ? '保存中' : '保存提示词' }}
            </button>
        </div>
    </section>
</template>

<style scoped>
.prompt-section { border-bottom: 1px solid #dfe5ea; padding: 2px 0 20px; }
.section-head { display: flex; align-items: start; justify-content: space-between; gap: 16px; margin-bottom: 16px; }
.kicker { color: #77838f; font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; }
h2 { color: #17202a; font-size: 20px; font-weight: 650; margin-top: 3px; }
label { display: grid; gap: 6px; margin-top: 12px; }
label span { color: #53616e; font-size: 12px; font-weight: 650; }
.input {
    width: 100%;
    border: 1px solid #d8e0e7;
    border-radius: 6px;
    background: #fbfcfd;
    color: #17202a;
    outline: none;
    padding: 10px 12px;
}
.textarea { min-height: 340px; resize: vertical; font: 13px/1.65 ui-monospace, SFMono-Regular, Menlo, monospace; }
.textarea.small { min-height: 140px; }
.input:focus { border-color: #276ef1; background: #fff; }
.hint { color: #6d7882; font-size: 12px; line-height: 1.6; margin-top: 10px; }
.buttons { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 14px; }
.primary {
    display: inline-flex;
    min-height: 38px;
    align-items: center;
    gap: 7px;
    border-radius: 6px;
    background: #276ef1;
    color: #fff;
    font-size: 13px;
    font-weight: 650;
    padding: 0 14px;
}
.primary:disabled { cursor: not-allowed; opacity: 0.48; }
</style>
