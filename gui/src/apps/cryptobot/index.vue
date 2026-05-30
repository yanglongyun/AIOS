<script setup>
// 炒币机 · AI 协作终端 —— 应用根:双栏布局(左数据 / 右 AI 决策流)+ 顶栏 + 设置/分享模态。
// 数据层在 composables/useCryptoData.js;公共 cb-* 样式在 styles.css。
import { onActivated, onBeforeUnmount, onDeactivated, onMounted, ref, watch } from 'vue';
import * as cb from './api.js';
import { useCryptoData } from './composables/useCryptoData.js';
import './styles.css';

import CockpitTop   from './components/CockpitTop.vue';
import Equity       from './Equity.vue';
import Kpis         from './components/Kpis.vue';
import MarketStrip  from './components/MarketStrip.vue';
import AiFeed       from './components/AiFeed.vue';
import Positions    from './views/Positions.vue';
import Orders       from './views/Orders.vue';
import SettingsModal from './components/SettingsModal.vue';
import ShareCard    from './components/ShareCard.vue';

const {
    agent, decisions, positions, orders, ordersFilter, market, errMsg, refreshKey,
    loadAgent, loadDecisions, loadPositions, loadOrders, loadMarket, loadAll,
    eqPnl, eqPnlRatio, todayChange, overviewKpis
} = useCryptoData();

// 左下账本:持仓 / 订单
const ledger = ref('positions');
watch(ledger, (k) => {
    if (k === 'positions' && !positions.value) loadPositions();
    if (k === 'orders' && !orders.value) loadOrders();
});

// ── 轮询:行情始终刷新;运行中额外刷新 agent / 净值 / 决策 ──
let timer = null;
function tick() {
    loadMarket();
    if (agent.value?.state?.running) {
        loadAgent();
        refreshKey.value++;
        loadDecisions();
    }
}
function startTimer() { stopTimer(); timer = setInterval(tick, 5000); }
function stopTimer() { clearInterval(timer); timer = null; }

// ── notice flash ──
const notice = ref({ kind: '', text: '' });
let noticeTimer = null;
function flash(kind, text, ms = 2200) {
    notice.value = { kind, text };
    clearTimeout(noticeTimer);
    noticeTimer = setTimeout(() => (notice.value = { kind: '', text: '' }), ms);
}

// ── 启停 ──
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

// ── 设置 ──
const showSettings = ref(false);
const cfgDraft = ref({ api_key: '', api_secret: '', passphrase: '', goal: '' });
const cfgSaving = ref(false);
const cfgTesting = ref(false);
const cfgTestMsg = ref({ kind: '', text: '' });

watch(() => agent.value?.config, (c) => {
    if (!c) return;
    cfgDraft.value = { api_key: c.api_key || '', api_secret: c.api_secret || '', passphrase: c.passphrase || '', goal: c.goal || '' };
}, { immediate: true });

async function saveConfig() {
    cfgSaving.value = true;
    try { await cb.saveConfig(cfgDraft.value); await loadAgent(); flash('ok', '设置已保存'); showSettings.value = false; }
    catch (e) { flash('err', '保存失败: ' + (e?.body?.message || e.message || e)); }
    cfgSaving.value = false;
}
async function testExchange() {
    cfgTesting.value = true;
    cfgTestMsg.value = { kind: '', text: '' };
    try {
        const r = await cb.testExchange(cfgDraft.value);
        cfgTestMsg.value = r?.success ? { kind: 'ok', text: '连接成功 ✓' } : { kind: 'err', text: r?.message || '连接失败' };
    } catch (e) { cfgTestMsg.value = { kind: 'err', text: e?.body?.message || e.message || '连接失败' }; }
    cfgTesting.value = false;
}

// ── 分享 ──
const showShare = ref(false);

// ── 生命周期 ──
async function boot() { await loadAll(); if (positions.value === null) loadPositions(); startTimer(); }
onMounted(boot);
onActivated(boot);
onDeactivated(stopTimer);
onBeforeUnmount(stopTimer);
</script>

<template>
    <div class="cf app-frame">
        <CockpitTop
            :agent="agent" :eq-pnl="eqPnl" :eq-pnl-ratio="eqPnlRatio" :busy="busy"
            @start="startBot" @stop="stopBot" @share="showShare = true" @settings="showSettings = true" />

        <div class="cf-main">
            <!-- 左:数据 -->
            <div class="cf-col">
                <div v-if="errMsg" class="cb-err-inline">{{ errMsg }}</div>

                <article v-if="agent && !agent.config.has_keys" class="cb-card cf-onboard">
                    <div class="cf-onboard-ic msi">vpn_key</div>
                    <div class="min-w-0 flex-1">
                        <div class="text-[15px] font-semibold text-[var(--c-text)]">还没配置 OKX API</div>
                        <div class="mt-1 text-[12.5px] leading-[1.55] text-[var(--c-text-3)]">
                            填入 OKX 的 API Key / Secret / Passphrase,AI 才能读行情、下单、管仓位。
                        </div>
                    </div>
                    <button class="cb-btn cb-btn-solid" @click="showSettings = true">去设置 →</button>
                </article>

                <Equity v-if="agent" :agent="agent" :eq-pnl="eqPnl" :eq-pnl-ratio="eqPnlRatio"
                        :today-change="todayChange" :refresh-key="refreshKey" />

                <Kpis v-if="agent" :kpis="overviewKpis" />

                <div v-if="agent" class="cf-ledger">
                    <div class="cf-seg">
                        <button :class="{ on: ledger === 'positions' }" @click="ledger = 'positions'">持仓</button>
                        <button :class="{ on: ledger === 'orders' }" @click="ledger = 'orders'">订单</button>
                    </div>
                    <Positions v-if="ledger === 'positions'" :positions="positions" @refresh="loadPositions" />
                    <Orders v-else :orders="orders" :filter="ordersFilter"
                            @refresh="loadOrders" @update:filter="ordersFilter = $event" />
                </div>

                <MarketStrip v-if="agent" :market="market" />
            </div>

            <!-- 右:AI 决策流 -->
            <div class="cf-col cf-right">
                <AiFeed v-if="agent" :decisions="decisions" :agent="agent" @refresh="loadDecisions" />
            </div>
        </div>

        <SettingsModal v-if="showSettings" :agent="agent" :cfg-draft="cfgDraft"
            :saving="cfgSaving" :testing="cfgTesting" :test-msg="cfgTestMsg"
            @save="saveConfig" @test="testExchange" @close="showSettings = false" />

        <ShareCard v-if="showShare" :agent="agent" :eq-pnl="eqPnl" :eq-pnl-ratio="eqPnlRatio" @close="showShare = false" />

        <Transition name="cf-fade">
            <div v-if="notice.text" class="cf-notice" :class="notice.kind">{{ notice.text }}</div>
        </Transition>
    </div>
</template>

<style scoped>
/* 精炼终端调色板:更深的近黑底 + 青绿/品红 + 紫色 AI。子组件经继承读取。 */
.cf {
    background: #0a0b0f;
    display: flex; flex-direction: column; height: 100%; min-height: 0;

    --c-card:      #14171f;
    --c-card-hi:   #191d27;
    --c-line:      #1f2330;
    --c-line-soft: #171a23;
    --c-text:      #e9ebf2;
    --c-text-2:    #8a90a2;
    --c-text-3:    #565c6e;
    --c-gold:      #f5b738;
    --c-gold-hi:   #ffcf52;
    --c-bull:      #2bd4a4;
    --c-bear:      #ff5470;
    --c-bull-soft: rgba(43, 212, 164, 0.13);
    --c-bear-soft: rgba(255, 84, 112, 0.13);
    --c-ai:        #8b93ff;
    --c-ai-soft:   rgba(139, 147, 255, 0.12);
    --c-ai-line:   rgba(139, 147, 255, 0.22);
    color: var(--c-text);
}

.cf-main {
    flex: 1; min-height: 0; display: grid; grid-template-columns: 1fr 384px; gap: 14px; padding: 14px;
    overflow: hidden;
    background:
        radial-gradient(1100px 560px at 78% -8%, rgba(245, 183, 56, 0.05), transparent 60%),
        radial-gradient(900px 600px at 8% 108%, rgba(139, 147, 255, 0.05), transparent 60%);
}
.cf-col { min-height: 0; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; padding-right: 2px; }
.cf-col::-webkit-scrollbar { width: 8px; }
.cf-col::-webkit-scrollbar-thumb { background: #20242f; border-radius: 8px; }
.cf-right { gap: 0; }

.cf-onboard { display: flex; align-items: center; gap: 16px; background: linear-gradient(135deg, rgba(245, 183, 56, 0.08), transparent 50%), var(--c-card); border: 1px solid rgba(245, 183, 56, 0.3); }
.cf-onboard-ic { width: 52px; height: 52px; flex: none; display: grid; place-items: center; border-radius: 13px; font-size: 30px; color: var(--c-gold); background: rgba(245, 183, 56, 0.12); }

.cf-ledger { margin: 0 auto; max-width: 1180px; width: 100%; }
.cf-seg { display: inline-flex; gap: 2px; padding: 3px; border-radius: 9px; background: rgba(0, 0, 0, 0.34); border: 1px solid var(--c-line); margin-bottom: 10px; }
.cf-seg button { border: 0; background: transparent; color: var(--c-text-3); font-family: var(--font-mono, monospace); font-size: 12px; font-weight: 600; padding: 6px 18px; border-radius: 6px; cursor: pointer; transition: 0.15s; }
.cf-seg button.on { background: rgba(245, 183, 56, 0.16); color: var(--c-gold); }
.cf-seg button:not(.on):hover { color: var(--c-text-2); }

.cf-notice { position: fixed; bottom: 22px; left: 50%; transform: translateX(-50%); z-index: 160; padding: 9px 18px; border-radius: 9px; font-size: 13px; font-weight: 600; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5); }
.cf-notice.ok { background: var(--c-bull); color: #04130d; }
.cf-notice.err { background: var(--c-bear); color: #1a0006; }
.cf-fade-enter-active, .cf-fade-leave-active { transition: opacity 0.25s, transform 0.25s; }
.cf-fade-enter-from, .cf-fade-leave-to { opacity: 0; transform: translate(-50%, 8px); }

@media (max-width: 880px) {
    .cf-main { grid-template-columns: 1fr; overflow-y: auto; gap: 12px; padding: 12px; }
    .cf-col { overflow: visible; }
    .cf-right { order: -1; }
    .cf-right :deep(.af) { height: 360px; flex: none; }
}
@media (max-width: 560px) {
    .cf-main { padding: 10px; gap: 10px; }
    .cf-right :deep(.af) { height: auto; }
}
</style>
