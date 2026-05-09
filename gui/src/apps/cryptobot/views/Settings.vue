<script setup>
import { fmtTime } from '../utils.js';

const props = defineProps({
    agent: { type: Object, default: null },
    cfgDraft: { type: Object, required: true },
    saving: { type: Boolean, default: false },
    testing: { type: Boolean, default: false },
    testMsg: { type: Object, default: () => ({ kind: '', text: '' }) }
});

defineEmits(['save', 'test']);
</script>

<template>
    <article class="cb-card">
        <header class="cb-sec-head">
            <div>
                <div class="cb-sec-title">OKX API</div>
                <div class="cb-sec-sub">在 OKX 网站创建只读+交易权限的 API Key。Passphrase 是创建 Key 时设置的密语,不是登录密码。</div>
            </div>
            <a class="cb-btn cb-btn-small cb-btn-ghost"
               href="https://www.okx.com/account/my-api"
               target="_blank"
               rel="noopener">
                <span class="msi xxs">open_in_new</span> OKX 后台
            </a>
        </header>

        <div class="flex flex-col gap-3.5">
            <div class="flex flex-col gap-1.5">
                <label class="cb-form-label">API Key</label>
                <input class="cb-input font-mono"
                       v-model="cfgDraft.api_key"
                       spellcheck="false" />
            </div>
            <div class="flex flex-col gap-1.5">
                <label class="cb-form-label">API Secret</label>
                <input class="cb-input font-mono"
                       type="password"
                       v-model="cfgDraft.api_secret"
                       spellcheck="false" />
            </div>
            <div class="flex flex-col gap-1.5">
                <label class="cb-form-label">Passphrase</label>
                <input class="cb-input font-mono"
                       type="password"
                       v-model="cfgDraft.passphrase"
                       spellcheck="false" />
            </div>
            <div class="flex items-center justify-end gap-2 pt-1">
                <span v-if="testMsg.text"
                      class="cb-inline-msg"
                      :class="testMsg.kind">{{ testMsg.text }}</span>
                <button class="cb-btn"
                        :disabled="testing || !cfgDraft.api_key"
                        @click="$emit('test')">
                    <span class="msi xxs">cable</span> {{ testing ? '测试中…' : '测试连接' }}
                </button>
                <button class="cb-btn cb-btn-solid"
                        :disabled="saving"
                        @click="$emit('save')">
                    {{ saving ? '保存中…' : '保存' }}
                </button>
            </div>
        </div>
    </article>

    <article class="cb-card">
        <header class="cb-sec-head">
            <div>
                <div class="cb-sec-title">策略目标</div>
                <div class="cb-sec-sub">用自然语言描述你希望机器人怎么交易,会拼到 system prompt 里。</div>
            </div>
        </header>
        <div class="flex flex-col gap-3.5">
            <textarea class="cb-input cb-input-area"
                      rows="6"
                      v-model="cfgDraft.goal"
                      placeholder="例如:24h 内净值波动控制在 ±2%,杠杆不超过 3x,优先做主流币的趋势跟踪。"></textarea>
            <div class="flex items-center justify-end gap-2 pt-1">
                <button class="cb-btn cb-btn-solid"
                        :disabled="saving"
                        @click="$emit('save')">保存目标</button>
            </div>
        </div>
    </article>

    <article class="cb-card">
        <header class="cb-sec-head">
            <div>
                <div class="cb-sec-title">运行状态</div>
            </div>
        </header>
        <div class="flex flex-col font-mono">
            <div class="cb-kv"><span>Base URL</span><code>{{ agent.config.base_url || 'https://www.okx.com' }}</code></div>
            <div class="cb-kv"><span>采样间隔</span><span>{{ agent.config.interval_sec }} 秒</span></div>
            <div class="cb-kv"><span>已运行</span><span>{{ agent.state.running ? '是' : '否' }}</span></div>
            <div class="cb-kv"><span>累计 tick</span><span>{{ agent.state.tick_count }}</span></div>
            <div class="cb-kv"><span>启动时间</span><span>{{ fmtTime(agent.state.started_at) || '—' }}</span></div>
            <div class="cb-kv"><span>最近运行</span><span>{{ fmtTime(agent.state.last_run_at) || '—' }}</span></div>
            <div v-if="agent.state.last_error" class="cb-kv cb-kv-full">
                <span>最近错误</span>
                <pre class="cb-err-mono">{{ agent.state.last_error }}</pre>
            </div>
        </div>
    </article>
</template>

<style scoped>
.cb-form-label {
    font-family: 'JetBrains Mono', ui-monospace, Menlo, monospace;
    font-size: 10.5px;
    color: var(--c-text-3);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    font-weight: 600;
}

.cb-inline-msg {
    padding: 4px 10px;
    border-radius: 4px;
    font-family: 'JetBrains Mono', ui-monospace, Menlo, monospace;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
}
.cb-inline-msg.ok  { background: var(--c-bull-soft); color: var(--c-bull); border: 1px solid rgba(14,203,129,0.3); }
.cb-inline-msg.err { background: var(--c-bear-soft); color: var(--c-bear); border: 1px solid rgba(246,70,93,0.3); }

.cb-kv {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    padding: 8px 0;
    border-bottom: 1px solid var(--c-line-soft);
    font-size: 12.5px;
    align-items: center;
}
.cb-kv:last-child { border-bottom: 0; }
.cb-kv span:first-child {
    color: var(--c-text-3);
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: 600;
}
.cb-kv code {
    font-family: inherit;
    background: rgba(0,0,0,0.3);
    padding: 2px 8px;
    border-radius: 3px;
    font-size: 11.5px;
    color: var(--c-text);
    border: 1px solid var(--c-line);
}
.cb-kv-full {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
}

.cb-err-mono {
    margin: 0;
    padding: 10px 12px;
    background: rgba(246,70,93,0.06);
    color: var(--c-bear);
    border: 1px solid rgba(246,70,93,0.25);
    border-radius: 4px;
    font-family: 'JetBrains Mono', ui-monospace, Menlo, monospace;
    font-size: 11.5px;
    line-height: 1.55;
    white-space: pre-wrap;
    word-break: break-word;
    width: 100%;
}
</style>
