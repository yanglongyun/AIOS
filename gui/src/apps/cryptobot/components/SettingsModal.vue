<script setup>
// 设置模态:OKX API + 策略目标 + 运行状态。由顶栏齿轮唤起。
import { fmtTime } from '../utils.js';

defineProps({
    agent: { type: Object, default: null },
    cfgDraft: { type: Object, required: true },
    saving: { type: Boolean, default: false },
    testing: { type: Boolean, default: false },
    testMsg: { type: Object, default: () => ({ kind: '', text: '' }) }
});
defineEmits(['save', 'test', 'close']);
</script>

<template>
    <div class="sm-mask" @click.self="$emit('close')">
        <div class="sm-panel">
            <header class="sm-head">
                <div class="sm-title">设置</div>
                <button class="sm-close msi" @click="$emit('close')">close</button>
            </header>

            <div class="sm-body">
                <section class="sm-sec">
                    <div class="cb-sec-title">OKX API</div>
                    <div class="cb-sec-sub mb-3">创建带交易权限的 API Key。Passphrase 是建 Key 时设的密语,不是登录密码。</div>
                    <div class="flex flex-col gap-3">
                        <label class="sm-field"><span>API Key</span>
                            <input class="cb-input font-mono" v-model="cfgDraft.api_key" spellcheck="false" /></label>
                        <label class="sm-field"><span>API Secret</span>
                            <input class="cb-input font-mono" type="password" v-model="cfgDraft.api_secret" spellcheck="false" /></label>
                        <label class="sm-field"><span>Passphrase</span>
                            <input class="cb-input font-mono" type="password" v-model="cfgDraft.passphrase" spellcheck="false" /></label>
                    </div>
                </section>

                <section class="sm-sec">
                    <div class="cb-sec-title">策略目标</div>
                    <div class="cb-sec-sub mb-3">用自然语言描述你希望机器人怎么交易,会拼进 system prompt。</div>
                    <textarea class="cb-input cb-input-area" rows="5" v-model="cfgDraft.goal"
                              placeholder="例如:24h 内净值波动控制在 ±2%,杠杆不超过 3x,优先做主流币的趋势跟踪。"></textarea>
                </section>

                <section v-if="agent" class="sm-sec">
                    <div class="cb-sec-title">运行状态</div>
                    <div class="mt-2 grid grid-cols-2 gap-x-4 font-mono text-[12px]">
                        <div class="sm-kv"><span>采样间隔</span><span>{{ agent.config.interval_sec }}s</span></div>
                        <div class="sm-kv"><span>累计轮次</span><span>{{ agent.state.tick_count }}</span></div>
                        <div class="sm-kv"><span>运行中</span><span>{{ agent.state.running ? '是' : '否' }}</span></div>
                        <div class="sm-kv"><span>最近运行</span><span>{{ fmtTime(agent.state.last_run_at) || '—' }}</span></div>
                    </div>
                    <pre v-if="agent.state.last_error" class="cb-err-inline mt-3 whitespace-pre-wrap font-mono text-[11.5px]">{{ agent.state.last_error }}</pre>
                </section>
            </div>

            <footer class="sm-foot">
                <span v-if="testMsg.text" class="sm-msg" :class="testMsg.kind">{{ testMsg.text }}</span>
                <div class="flex-1"></div>
                <button class="cb-btn" :disabled="testing || !cfgDraft.api_key" @click="$emit('test')">
                    <span class="msi xxs">cable</span> {{ testing ? '测试中…' : '测试连接' }}
                </button>
                <button class="cb-btn cb-btn-solid" :disabled="saving" @click="$emit('save')">
                    {{ saving ? '保存中…' : '保存' }}
                </button>
            </footer>
        </div>
    </div>
</template>

<style scoped>
.sm-mask { position: fixed; inset: 0; z-index: 150; background: rgba(0, 0, 0, 0.65); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; padding: 20px; }
.sm-panel { width: 100%; max-width: 540px; max-height: 88vh; display: flex; flex-direction: column; border-radius: 18px; overflow: hidden; background: linear-gradient(180deg, var(--c-card-hi), var(--c-card)); border: 1px solid var(--c-line); box-shadow: 0 30px 80px rgba(0, 0, 0, 0.6); }
.sm-head { flex: none; display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid var(--c-line); }
.sm-title { font-size: 15px; font-weight: 600; color: var(--c-text); }
.sm-close { border: 0; background: rgba(255, 255, 255, 0.05); color: var(--c-text-2); cursor: pointer; width: 32px; height: 32px; border-radius: 8px; display: grid; place-items: center; }
.sm-close:hover { background: rgba(255, 255, 255, 0.1); color: var(--c-text); }
.sm-body { overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 22px; }
.sm-sec { }
.sm-field { display: flex; flex-direction: column; gap: 6px; }
.sm-field > span { font-family: var(--font-mono, monospace); font-size: 10.5px; color: var(--c-text-3); letter-spacing: 0.08em; text-transform: uppercase; font-weight: 600; }
.sm-kv { display: flex; justify-content: space-between; padding: 7px 0; border-bottom: 1px solid var(--c-line-soft); }
.sm-kv span:first-child { color: var(--c-text-3); }
.sm-kv span:last-child { color: var(--c-text); }
.sm-foot { flex: none; display: flex; align-items: center; gap: 10px; padding: 14px 20px; border-top: 1px solid var(--c-line); }
.sm-msg { font-family: var(--font-mono, monospace); font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 5px; }
.sm-msg.ok { color: var(--c-bull); background: var(--c-bull-soft); }
.sm-msg.err { color: var(--c-bear); background: var(--c-bear-soft); }
</style>
