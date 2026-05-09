<script setup>
// cryptobot 应用根 — 协调器,持有状态、轮询、生命周期。
// ─────────────────────────────────────────────
// utils.js   ← 格式化(fmtMoney/fmtPct/relTime/...)
// api.js     ← 请求层(8 个端点)
// Topbar     ← 外层暗色顶栏
// Header     ← brand + 状态 pill + 启停
// Equity     ← 净值 + sparkline
// Tabs       ← tab nav
// views/*    ← 5 个 tab 视图
import { computed, onActivated, onBeforeUnmount, onDeactivated, onMounted, ref, watch } from 'vue';
import * as cb from './api.js';
import { isToday, relTime } from './utils.js';

import Topbar    from './Topbar.vue';
import Header    from './Header.vue';
import Equity    from './Equity.vue';
import Tabs      from './Tabs.vue';
import Overview  from './views/Overview.vue';
import Positions from './views/Positions.vue';
import Orders    from './views/Orders.vue';
import Decisions from './views/Decisions.vue';
import Settings  from './views/Settings.vue';

// ── 主状态 ──────────────────────────
const agent = ref(null);
const decisions = ref([]);
const positions = ref(null);
const orders = ref(null);
const ordersFilter = ref('ANY');
const errMsg = ref('');

const tabs = [
    { key: 'overview',  label: '概览', icon: 'dashboard' },
    { key: 'positions', label: '持仓', icon: 'account_balance_wallet' },
    { key: 'orders',    label: '订单', icon: 'receipt_long' },
    { key: 'decisions', label: '决策', icon: 'auto_awesome' },
    { key: 'settings',  label: '设置', icon: 'tune' }
];
const active = ref('overview');

// ── notice flash ─────────────────────
const notice = ref({ kind: '', text: '' });
let noticeTimer = null;
function flash(kind, text, ms = 2200) {
    notice.value = { kind, text };
    clearTimeout(noticeTimer);
    noticeTimer = setTimeout(() => notice.value = { kind: '', text: '' }, ms);
}

// ── 加载 ─────────────────────────────
async function loadAgent() {
    try { agent.value = await cb.getAgent(); }
    catch (e) { errMsg.value = '获取 agent 状态失败: ' + (e?.body?.message || e.message || e); }
}
async function loadDecisions() {
    try { decisions.value = (await cb.getDecisions(50))?.items || []; }
    catch { decisions.value = []; }
}
async function loadPositions() {
    if (!agent.value?.config?.has_keys) return;
    try { positions.value = await cb.getPositions(); }
    catch (e) { positions.value = { success: false, message: e.message }; }
}
async function loadOrders() {
    if (!agent.value?.config?.has_keys) return;
    try { orders.value = await cb.getOrders(ordersFilter.value, 50); }
    catch (e) { orders.value = { success: false, message: e.message }; }
}

const loading = ref(false);
async function loadAll() {
    loading.value = true;
    await loadAgent();
    await loadDecisions();
    loading.value = false;
}

// 切 tab 时按需拉
watch(active, (k) => {
    if (k === 'positions' && !positions.value) loadPositions();
    if (k === 'orders' && !orders.value) loadOrders();
    if (k === 'decisions' && !decisions.value.length) loadDecisions();
});
watch(ordersFilter, () => loadOrders());

// running 时每 5s 轮询
let pollTimer = null;
watch(() => agent.value?.state?.running, (run) => {
    clearInterval(pollTimer); pollTimer = null;
    if (run) {
        pollTimer = setInterval(() => {
            loadAgent();
            if (active.value === 'decisions') loadDecisions();
        }, 5000);
    }
});

// ── 启停 ─────────────────────────────
const busy = ref(false);
async function startBot() {
    busy.value = true;
    try { await cb.startBot(); await loadAgent(); flash('ok', '已启动'); }
    catch (e) { flash('err', '启动失败: ' + (e?.body?.message || e.message || e)); }
    busy.value = false;
}
async function stopBot() {
    busy.value = true;
    try { await cb.stopBot(); await loadAgent(); flash('ok', '已停止'); }
    catch (e) { flash('err', '停止失败: ' + (e?.body?.message || e.message || e)); }
    busy.value = false;
}

// ── 设置 ─────────────────────────────
const cfgDraft = ref({ api_key: '', api_secret: '', passphrase: '', goal: '' });
const cfgSaving = ref(false);
const cfgTesting = ref(false);
const cfgTestMsg = ref({ kind: '', text: '' });

watch(() => agent.value?.config, (c) => {
    if (!c) return;
    cfgDraft.value = {
        api_key:    c.api_key    || '',
        api_secret: c.api_secret || '',
        passphrase: c.passphrase || '',
        goal:       c.goal       || ''
    };
}, { immediate: true });

async function saveConfig() {
    cfgSaving.value = true;
    try {
        await cb.saveConfig(cfgDraft.value);
        await loadAgent();
        flash('ok', '设置已保存');
    } catch (e) { flash('err', '保存失败: ' + (e?.body?.message || e.message || e)); }
    cfgSaving.value = false;
}
async function testExchange() {
    cfgTesting.value = true;
    cfgTestMsg.value = { kind: '', text: '' };
    try {
        const r = await cb.testExchange(cfgDraft.value);
        cfgTestMsg.value = r?.success
            ? { kind: 'ok', text: '连接成功 ✓' }
            : { kind: 'err', text: r?.message || '连接失败' };
    } catch (e) {
        cfgTestMsg.value = { kind: 'err', text: e?.body?.message || e.message || '连接失败' };
    }
    cfgTesting.value = false;
}

// ── 计算 ─────────────────────────────
const eqPnl = computed(() => agent.value?.equity?.pnl || 0);
const eqPnlRatio = computed(() => (agent.value?.equity?.pnl_ratio || 0) * 100);
const todayChange = computed(() => agent.value?.equity?.today_change || 0);
const recentDecisions = computed(() => decisions.value.slice(0, 5));
const overviewKpis = computed(() => ([
    { label: '持仓数',   value: positions.value?.positions?.length ?? '—',                                   icon: 'account_balance_wallet' },
    { label: '今日决策', value: decisions.value.filter((d) => isToday(d.created_at)).length,                 icon: 'auto_awesome' },
    { label: '最近运行', value: relTime(agent.value?.state?.last_run_at),                                    icon: 'timer' },
    { label: '采样间隔', value: (agent.value?.config?.interval_sec || '—') + 's',                            icon: 'tune' }
]));

// ── 生命周期 ─────────────────────────
onMounted(loadAll);
onActivated(loadAll);
onDeactivated(() => { clearInterval(pollTimer); pollTimer = null; });
onBeforeUnmount(() => { clearInterval(pollTimer); pollTimer = null; });
</script>

<template>
    <div class="crypto-frame app-frame">
        <Topbar />

        <section class="flex-1 min-w-0 min-h-0 overflow-y-auto px-5 pb-15 pt-4 text-[var(--c-text)] max-md:px-3.5 max-md:pb-10"
                 style="font-feature-settings: 'tnum' 1;">

            <Header
                :agent="agent"
                :busy="busy"
                :notice="notice"
                @start="startBot"
                @stop="stopBot" />

            <div v-if="errMsg" class="mx-auto mb-3 max-w-[1180px] rounded-lg border border-[var(--c-bear)] bg-[var(--c-bear-soft)] px-3.5 py-2.5 text-[12.5px] text-[var(--c-bear)]">
                {{ errMsg }}
            </div>

            <!-- 没配 API key 的引导 -->
            <article v-if="agent && !agent.config.has_keys" class="cb-card cb-onboard">
                <div class="grid h-14 w-14 flex-none place-items-center rounded-xl bg-[rgba(240,185,11,0.12)]">
                    <span class="msi" style="font-size:36px;color:var(--c-gold)">vpn_key</span>
                </div>
                <div class="min-w-0 flex-1">
                    <div class="text-[15px] font-semibold text-[var(--c-text)]">还没配置 OKX API</div>
                    <div class="mt-1 text-[12.5px] leading-[1.55] text-[var(--c-text-3)]">
                        炒币机需要你提供 OKX 的 API Key / Secret / Passphrase 才能读取行情、下单和管理仓位。
                    </div>
                </div>
                <button class="cb-btn cb-btn-solid" @click="active = 'settings'">去设置 →</button>
            </article>

            <Equity v-if="agent"
                    :agent="agent"
                    :eq-pnl="eqPnl"
                    :eq-pnl-ratio="eqPnlRatio"
                    :today-change="todayChange" />

            <Tabs v-if="agent"
                  :tabs="tabs"
                  :active="active"
                  @update:active="active = $event" />

            <template v-if="agent && active === 'overview'">
                <Overview :kpis="overviewKpis"
                          :recent-decisions="recentDecisions"
                          @go-decisions="active = 'decisions'" />
            </template>

            <template v-if="agent && active === 'positions'">
                <Positions :positions="positions"
                           @refresh="loadPositions" />
            </template>

            <template v-if="agent && active === 'orders'">
                <Orders :orders="orders"
                        :filter="ordersFilter"
                        @refresh="loadOrders"
                        @update:filter="ordersFilter = $event" />
            </template>

            <template v-if="agent && active === 'decisions'">
                <Decisions :decisions="decisions"
                           @refresh="loadDecisions" />
            </template>

            <template v-if="agent && active === 'settings'">
                <Settings :agent="agent"
                          :cfg-draft="cfgDraft"
                          :saving="cfgSaving"
                          :testing="cfgTesting"
                          :test-msg="cfgTestMsg"
                          @save="saveConfig"
                          @test="testExchange" />
            </template>
        </section>
    </div>
</template>

<!-- 根 frame 的 CSS 变量,所有子组件通过继承读到 -->
<style scoped>
.crypto-frame {
    background: #0b0e15;

    --c-card:      #13161f;
    --c-card-hi:   #1a1e2a;
    --c-line:      #23262f;
    --c-line-soft: #1a1d29;
    --c-text:      #eef0f5;
    --c-text-2:    #a0a4b3;
    --c-text-3:    #6c7180;
    --c-gold:      #f0b90b;
    --c-gold-hi:   #fcd535;
    --c-bull:      #0ecb81;
    --c-bear:      #f6465d;
    --c-bull-soft: rgba(14,203,129,0.14);
    --c-bear-soft: rgba(246,70,93,0.14);
}
.crypto-frame > section {
    background:
        radial-gradient(1200px 600px at 80% -10%, rgba(240,185,11,0.06), transparent 60%),
        radial-gradient(900px 500px at 0% 110%, rgba(14,203,129,0.04), transparent 60%),
        #0b0e15;
}
</style>

<!-- 跨子组件复用的 cb-* 公共类(全局,通过 cb- 前缀避免冲突) -->
<style>
.cb-card {
    background: var(--c-card, #13161f);
    border: 1px solid var(--c-line, #23262f);
    border-radius: 12px;
    padding: 18px 20px;
    margin: 0 auto 12px;
    max-width: 1180px;
    box-shadow:
        inset 0 1px 0 rgba(255,255,255,0.03),
        0 1px 2px rgba(0,0,0,0.4),
        0 6px 20px rgba(0,0,0,0.25);
}

.cb-sec-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 14px;
}
.cb-sec-title {
    font-size: 14px;
    font-weight: 600;
    letter-spacing: 0.02em;
    color: var(--c-text);
    text-transform: uppercase;
}
.cb-sec-sub {
    font-size: 12px;
    color: var(--c-text-3);
    margin-top: 4px;
    line-height: 1.55;
    max-width: 540px;
}

.cb-empty {
    padding: 32px;
    text-align: center;
    color: var(--c-text-3);
    font-family: 'JetBrains Mono', ui-monospace, Menlo, monospace;
    font-size: 13px;
}

.cb-err-inline {
    padding: 12px;
    background: rgba(246,70,93,0.06);
    border: 1px solid var(--c-bear);
    color: var(--c-bear);
    border-radius: 8px;
    font-size: 12.5px;
}

.cb-onboard {
    display: flex;
    align-items: center;
    gap: 18px;
    background:
        linear-gradient(135deg, rgba(240,185,11,0.08), transparent 50%),
        var(--c-card);
    border: 1px solid rgba(240,185,11,0.3);
}

/* 输入控件 */
.cb-input {
    width: 100%;
    padding: 10px 14px;
    border: 1px solid var(--c-line);
    background: rgba(0,0,0,0.25);
    color: var(--c-text);
    border-radius: 6px;
    font-size: 13px;
    outline: 0;
    transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
}
.cb-input:focus {
    border-color: var(--c-gold);
    background: rgba(0,0,0,0.4);
    box-shadow: 0 0 0 1px var(--c-gold), 0 0 12px rgba(240,185,11,0.15);
}
.cb-input-area {
    font-family: inherit;
    font-size: 13.5px;
    line-height: 1.6;
    resize: vertical;
    min-height: 110px;
}
.cb-input-select {
    appearance: none;
    cursor: pointer;
    padding-right: 36px;
    background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23a0a4b3' stroke-width='2'><path d='M6 9l6 6 6-6'/></svg>");
    background-repeat: no-repeat;
    background-position: right 12px center;
}
.cb-input-small { padding: 6px 28px 6px 12px; font-size: 12px; border-radius: 4px; }

/* 按钮 */
.cb-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    border: 1px solid var(--c-line);
    background: rgba(255,255,255,0.04);
    color: var(--c-text-2);
    border-radius: 6px;
    font-size: 12.5px;
    font-weight: 600;
    letter-spacing: 0.04em;
    cursor: pointer;
    white-space: nowrap;
    transition: background 0.15s, color 0.15s, border-color 0.15s, box-shadow 0.15s, transform 0.08s;
}
.cb-btn:hover { background: rgba(255,255,255,0.08); color: var(--c-text); border-color: rgba(255,255,255,0.15); }
.cb-btn:active { transform: translateY(1px); }
.cb-btn-small { padding: 5px 11px; font-size: 11.5px; border-radius: 4px; }
.cb-btn-ghost { border-color: transparent; background: transparent; }
.cb-btn-ghost:hover { background: rgba(255,255,255,0.05); color: var(--c-text); }
.cb-btn-solid {
    background: linear-gradient(180deg, var(--c-gold-hi), var(--c-gold));
    color: #1a1500;
    border-color: var(--c-gold);
    box-shadow:
        inset 0 1px 0 rgba(255,255,255,0.5),
        0 1px 4px rgba(240,185,11,0.4),
        0 0 0 1px rgba(240,185,11,0.2);
    text-shadow: 0 1px 0 rgba(255,255,255,0.25);
}
.cb-btn-solid:hover:not(:disabled) {
    background: linear-gradient(180deg, #ffd95c, var(--c-gold-hi));
    box-shadow:
        inset 0 1px 0 rgba(255,255,255,0.6),
        0 2px 10px rgba(240,185,11,0.55),
        0 0 0 1px rgba(240,185,11,0.3);
}
.cb-btn-solid:disabled { opacity: 0.35; cursor: default; box-shadow: none; }
.cb-btn-danger {
    color: var(--c-bear);
    border-color: rgba(246,70,93,0.35);
    background: rgba(246,70,93,0.06);
}
.cb-btn-danger:hover {
    background: rgba(246,70,93,0.14);
    border-color: var(--c-bear);
    box-shadow: 0 0 12px rgba(246,70,93,0.25);
}
</style>
