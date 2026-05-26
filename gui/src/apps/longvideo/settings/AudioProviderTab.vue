<script setup>
defineProps({
    settings: { type: Object, required: true },
    ready: { type: Boolean, default: false },
    busy: { type: Boolean, default: false },
    testing: { type: Boolean, default: false },
});

const emit = defineEmits(['patch', 'save', 'test']);
const update = (key, event) => emit('patch', { [key]: event.target.value });
</script>

<template>
    <section class="provider-section">
        <div class="section-head">
            <div>
                <div class="kicker">语音生成</div>
                <h2>阿里云百炼 Qwen-TTS</h2>
            </div>
            <span class="state" :class="{ ready }">{{ ready ? '已保存' : '待填写' }}</span>
        </div>
        <div class="form-grid">
            <label>
                <span>API Key</span>
                <input class="input secret" type="password" :value="settings.dashscopeApiKey" :placeholder="settings.configured?.dashscopeApiKey ? '百炼密钥已保存' : 'sk-...'" autocomplete="off" spellcheck="false" @input="update('dashscopeApiKey', $event)" />
            </label>
            <label>
                <span>模型</span>
                <input class="input" :value="settings.ttsModel" autocomplete="off" spellcheck="false" @input="update('ttsModel', $event)" />
            </label>
            <label>
                <span>音色</span>
                <input class="input" :value="settings.ttsVoice" autocomplete="off" spellcheck="false" @input="update('ttsVoice', $event)" />
            </label>
            <label>
                <span>语种</span>
                <select class="input" :value="settings.ttsLanguageType" @change="update('ttsLanguageType', $event)">
                    <option value="Chinese">中文</option>
                    <option value="English">英文</option>
                    <option value="Auto">自动</option>
                    <option value="Japanese">日语</option>
                    <option value="Korean">韩语</option>
                    <option value="French">法语</option>
                    <option value="German">德语</option>
                    <option value="Spanish">西语</option>
                </select>
            </label>
        </div>
        <p class="hint">非实时语音合成接口，默认模型 qwen3-tts-flash，默认音色 Cherry。</p>
        <div class="buttons">
            <button class="primary" :disabled="busy || testing" @click="$emit('save')">
                <span class="msi xxs">save</span>
                {{ busy ? '保存中' : '保存语音设置' }}
            </button>
            <button class="secondary" :disabled="busy || testing" @click="$emit('test')">
                <span class="msi xxs">science</span>
                {{ testing ? '测试中' : '保存并测试' }}
            </button>
        </div>
    </section>
</template>

<style scoped>
.provider-section { border-bottom: 1px solid #dfe5ea; padding: 2px 0 20px; }
.section-head { display: flex; align-items: start; justify-content: space-between; gap: 16px; margin-bottom: 16px; }
.kicker { color: #77838f; font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; }
h2 { color: #17202a; font-size: 20px; font-weight: 650; margin-top: 3px; }
.state { border-radius: 999px; background: #fff6e8; color: #9a5a00; flex: none; font-size: 12px; font-weight: 650; padding: 5px 10px; }
.state.ready { background: #e8f5ee; color: #1f6b3e; }
.form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
label { display: grid; gap: 6px; }
label span { color: #53616e; font-size: 12px; font-weight: 650; }
.input { min-height: 42px; border: 1px solid #d8e0e7; border-radius: 6px; background: #fbfcfd; color: #17202a; outline: none; padding: 10px 12px; }
.input:focus { border-color: #276ef1; background: #fff; }
.hint { color: #6d7882; font-size: 12px; line-height: 1.6; margin-top: 10px; }
.buttons { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 14px; }
.primary,
.secondary { display: inline-flex; min-height: 38px; align-items: center; gap: 7px; border-radius: 6px; font-size: 13px; font-weight: 650; padding: 0 14px; }
.primary { background: #276ef1; color: #fff; }
.secondary { background: #edf3ff; color: #174ea6; }
.primary:disabled,
.secondary:disabled { cursor: not-allowed; opacity: 0.48; }
@media (max-width: 768px) {
    .form-grid { grid-template-columns: 1fr; }
    .section-head { align-items: stretch; flex-direction: column; }
}
</style>
