// 炒币机数据层 — 把 index.vue 里的状态/加载/轮询抽出来,页面只负责组装。
import { ref, computed, watch } from 'vue';
import * as cb from '../api.js';
import { isToday, relTime } from '../utils.js';

export function useCryptoData() {
    const agent = ref(null);
    const decisions = ref([]);
    const positions = ref(null);
    const orders = ref(null);
    const ordersFilter = ref('ANY');
    const market = ref(null);
    const errMsg = ref('');
    const loading = ref(false);
    const refreshKey = ref(0);   // 轮询心跳,驱动子组件(净值曲线)刷新

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
    async function loadMarket() {
        try { market.value = await cb.getMarket(); }
        catch (e) { market.value = { success: false, message: e?.body?.message || e.message }; }
    }
    async function loadAll() {
        loading.value = true;
        await loadAgent();
        await Promise.all([loadDecisions(), loadMarket()]);
        loading.value = false;
    }

    watch(ordersFilter, loadOrders);

    // 轮询由页面(index.vue)显式管理,以正确处理 keep-alive 反复激活;
    // 这里只提供 refreshKey 供页面在每次 tick 时递增,驱动净值曲线刷新。

    // 概览 KPI
    const eqPnl = computed(() => agent.value?.equity?.pnl || 0);
    const eqPnlRatio = computed(() => (agent.value?.equity?.pnl_ratio || 0) * 100);
    const todayChange = computed(() => agent.value?.equity?.today_change || 0);
    const recentDecisions = computed(() => decisions.value.slice(0, 5));
    // 真实 KPI:只用拿得到的真数据,不编造(如胜率需逐笔盈亏,暂不展示)。
    const overviewKpis = computed(() => ([
        { label: '持仓', value: positions.value?.positions?.length ?? '—', icon: 'inventory_2' },
        { label: '今日决策', value: decisions.value.filter((d) => isToday(d.created_at)).length, icon: 'auto_awesome' },
        { label: '累计轮次', value: agent.value?.state?.tick_count ?? '—', icon: 'repeat' },
        { label: '采样', value: (agent.value?.config?.interval_sec || '—') + 's', icon: 'timer' }
    ]));

    return {
        agent, decisions, positions, orders, ordersFilter, market, errMsg, loading, refreshKey,
        loadAgent, loadDecisions, loadPositions, loadOrders, loadMarket, loadAll,
        eqPnl, eqPnlRatio, todayChange, recentDecisions, overviewKpis
    };
}
