<script setup>
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Topbar from './Topbar.vue';
import ProviderSettings from './ProviderSettings.vue';
import * as lv from './api.js';

const fileUrl = lv.fileUrl;

const route = useRoute();
const router = useRouter();
const projects = ref([]);
const active = ref(null);
const loading = ref(false);
const busy = ref('');
const error = ref('');
const settingsBusy = ref(false);
const settingsMessage = ref('');
const settingsTestBusy = ref('');
const settingsTestMessage = ref('');
const promptBusy = ref(false);

const form = ref({
    title: '',
    prompt: '',
});

const providerSettings = ref({
    dashscopeApiKey: '',
    dashscopeRegion: 'beijing',
    imageModel: 'qwen-image-2.0-pro',
    imageSize: '2048*2048',
    imagePromptExtend: 'true',
    imageWatermark: 'false',
    ttsModel: 'qwen3-tts-flash',
    ttsVoice: 'Cherry',
    ttsLanguageType: 'Chinese',
    projectPromptTemplate: '',
    planPromptTemplate: '',
    configured: {
        dashscopeApiKey: false,
        image: false,
        audio: false,
    },
});

const activeId = computed(() => active.value?.id || 0);
const totalDuration = computed(() => {
    const sec = (active.value?.segments || []).reduce((sum, item) => sum + Number(item.durationSec || 0), 0);
    return Math.round(sec / 60);
});
const hasSegments = computed(() => (active.value?.segments || []).length > 0);
const imageProviderReady = computed(() => providerSettings.value.configured?.image);
const audioProviderReady = computed(() => providerSettings.value.configured?.audio);
const providerReady = computed(() => imageProviderReady.value && audioProviderReady.value);
const routeMode = computed(() => {
    const p1 = String(route.params.p1 || '');
    if (!p1) return 'list';
    if (p1 === 'new') return 'new';
    if (p1 === 'settings') return 'settings';
    if (p1 === 'project') return 'detail';
    return 'list';
});
const routeProjectId = computed(() => routeMode.value === 'detail' ? Number(route.params.p2 || 0) : 0);
const segmentCount = computed(() => projects.value.reduce((sum, item) => sum + Number(item.segmentCount || 0), 0));
const plannedCount = computed(() => projects.value.filter((item) => item.status === 'planned').length);

const statusText = {
    draft: '草稿',
    planned: '已规划',
    generating: '生成素材中',
    assets_ready: '素材就绪',
    rendering: '拼接中',
    done: '已完成',
    error: '失败',
    // 段落级
    idle: '待生成',
    running: '生成中',
    ready: '就绪',
};

function labelStatus(value) {
    return statusText[value] || value || '草稿';
}

const isBusyStatus = (s) => s === 'generating' || s === 'rendering';
const activeBusy = computed(() => isBusyStatus(active.value?.status));

async function refresh() {
    loading.value = !projects.value.length;
    error.value = '';
    try {
        const res = await lv.listProjects();
        projects.value = res.projects || [];
    } catch (err) {
        error.value = err?.body?.message || err.message || String(err);
    } finally {
        loading.value = false;
    }
}

let pollTimer = null;
function stopPoll() {
    if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
}
function syncPoll() {
    if (activeBusy.value && routeMode.value === 'detail') {
        if (!pollTimer) pollTimer = setInterval(refreshActive, 2500);
    } else {
        stopPoll();
    }
}
async function refreshActive() {
    if (!activeId.value) return;
    try {
        const res = await lv.getProject(activeId.value);
        active.value = res.project;
    } catch { /* keep last state */ }
    syncPoll();
}

async function loadProject(id) {
    const res = await lv.getProject(id);
    active.value = res.project;
    syncPoll();
}

async function retrySegment(segmentId) {
    busy.value = `seg-${segmentId}`;
    error.value = '';
    try {
        const res = await lv.retrySegment(segmentId);
        active.value = res.project;
        syncPoll();
    } catch (err) {
        error.value = err?.body?.message || err.message || String(err);
    } finally {
        busy.value = '';
    }
}

function goList() {
    router.push('/app/longvideo');
}

function goNew() {
    router.push('/app/longvideo/new');
}

function goSettings() {
    router.push('/app/longvideo/settings');
}

function goProject(id) {
    router.push(`/app/longvideo/project/${id}`);
}

async function loadSettings() {
    const res = await lv.getSettings();
    providerSettings.value = {
        ...providerSettings.value,
        ...(res.settings || {}),
        dashscopeApiKey: '',
    };
}

async function saveSettings(clearSecrets = false) {
    settingsBusy.value = true;
    settingsMessage.value = '';
    settingsTestMessage.value = '';
    error.value = '';
    try {
        const payload = clearSecrets
            ? {
                clearSecrets: true,
                dashscopeRegion: providerSettings.value.dashscopeRegion,
                imageModel: providerSettings.value.imageModel,
                imageSize: providerSettings.value.imageSize,
                imagePromptExtend: providerSettings.value.imagePromptExtend,
                imageWatermark: providerSettings.value.imageWatermark,
                ttsModel: providerSettings.value.ttsModel,
                ttsVoice: providerSettings.value.ttsVoice,
                ttsLanguageType: providerSettings.value.ttsLanguageType,
                projectPromptTemplate: providerSettings.value.projectPromptTemplate,
                planPromptTemplate: providerSettings.value.planPromptTemplate,
            }
            : {
                dashscopeApiKey: providerSettings.value.dashscopeApiKey,
                dashscopeRegion: providerSettings.value.dashscopeRegion,
                imageModel: providerSettings.value.imageModel,
                imageSize: providerSettings.value.imageSize,
                imagePromptExtend: providerSettings.value.imagePromptExtend,
                imageWatermark: providerSettings.value.imageWatermark,
                ttsModel: providerSettings.value.ttsModel,
                ttsVoice: providerSettings.value.ttsVoice,
                ttsLanguageType: providerSettings.value.ttsLanguageType,
                projectPromptTemplate: providerSettings.value.projectPromptTemplate,
                planPromptTemplate: providerSettings.value.planPromptTemplate,
            };
        const res = await lv.saveSettings(payload);
        providerSettings.value = {
            ...providerSettings.value,
            ...(res.settings || {}),
            dashscopeApiKey: '',
        };
        settingsMessage.value = clearSecrets ? '授权已清空' : '设置已保存';
        return true;
    } catch (err) {
        error.value = err?.body?.message || err.message || String(err);
        return false;
    } finally {
        settingsBusy.value = false;
    }
}

function patchProviderSettings(patch) {
    providerSettings.value = { ...providerSettings.value, ...patch };
}

async function testProvider(kind) {
    settingsTestBusy.value = kind;
    settingsTestMessage.value = '';
    const saved = await saveSettings(false);
    if (!saved) {
        settingsTestBusy.value = '';
        return;
    }
    try {
        const res = kind === 'image' ? await lv.testImageSettings() : await lv.testAudioSettings();
        const uri = res.result?.uri || '';
        settingsTestMessage.value = kind === 'image'
            ? `图片测试通过${uri ? `：${uri}` : ''}`
            : `语音测试通过${uri ? `：${uri}` : ''}`;
    } catch (err) {
        error.value = err?.body?.message || err.message || String(err);
    } finally {
        settingsTestBusy.value = '';
    }
}

async function create() {
    if (!form.value.title.trim()) {
        error.value = '请先填写标题';
        return;
    }
    if (!form.value.prompt.trim()) {
        error.value = '请先填写描述';
        return;
    }
    busy.value = 'create';
    error.value = '';
    try {
        const res = await lv.createProject(form.value);
        active.value = res.project;
        await refresh();
        goProject(res.project.id);
    } catch (err) {
        error.value = err?.body?.message || err.message || String(err);
    } finally {
        busy.value = '';
    }
}

function fillPromptTemplate(template, values) {
    return String(template || '').replace(/\{(\w+)\}/g, (_match, key) => String(values[key] ?? ''));
}

async function generateProjectPrompt() {
    if (!form.value.title.trim()) {
        error.value = '请先填写标题';
        return;
    }
    promptBusy.value = true;
    error.value = '';
    try {
        const prompt = fillPromptTemplate(providerSettings.value.projectPromptTemplate, {
            title: form.value.title.trim(),
            prompt: form.value.prompt.trim(),
        });
        const res = await lv.generatePrompt({
            app: 'longvideo',
            title: `生成视频提示词：${form.value.title.trim()}`,
            payload: {
                messages: [
                    {
                        role: 'system',
                        content: '你是视频策划助手。只输出一段可直接填写到“描述（提示词）”字段里的中文提示词，不要 Markdown，不要标题，不要解释。'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7
            },
            meta: { source: 'longvideo.prompt' }
        });
        form.value.prompt = String(res.response || '').trim();
    } catch (err) {
        error.value = err?.body?.message || err.message || String(err);
    } finally {
        promptBusy.value = false;
    }
}

async function run(action, key) {
    if (!activeId.value) return;
    busy.value = key;
    error.value = '';
    try {
        const res = await action(activeId.value);
        active.value = res.project;
        syncPoll();
        await refresh();
    } catch (err) {
        error.value = err?.body?.message || err.message || String(err);
    } finally {
        busy.value = '';
    }
}

onMounted(() => {
    refresh();
    loadSettings().catch((err) => {
        error.value = err?.body?.message || err.message || String(err);
    });
});

watch(
    () => [route.params.p1, route.params.p2],
    async () => {
        error.value = '';
        if (routeMode.value === 'detail') {
            if (!routeProjectId.value) {
                goList();
                return;
            }
            try {
                await loadProject(routeProjectId.value);
            } catch (err) {
                active.value = null;
                error.value = err?.body?.message || err.message || String(err);
            }
            return;
        }
        active.value = null;
        stopPoll();
        if (!['', 'new', 'settings', 'project'].includes(String(route.params.p1 || ''))) goList();
    },
    { immediate: true }
);

onBeforeUnmount(stopPoll);
</script>

<template>
    <div class="app-frame lv-root">
        <Topbar />

        <main class="min-h-0 flex-1 overflow-y-auto bg-[#eef2f5] px-7 py-6 text-[#17202a] max-md:px-4">
            <section class="mx-auto flex w-full max-w-[1180px] flex-col gap-4">
                <div v-if="error" class="mb-4 rounded-md border border-[#f0c9c5] bg-[#fff3f1] px-3 py-2 text-[13px] text-[#b3261e]">
                    {{ error }}
                </div>

                <div class="flex items-start justify-between gap-3 max-md:flex-col max-md:items-stretch">
                    <div class="min-w-0">
                        <button v-if="routeMode !== 'list'" class="lv-back" @click="goList">
                            <span class="msi xxs">arrow_back</span>
                            返回项目列表
                        </button>
                        <div v-else class="lv-kicker">视频工坊</div>
                        <h1 class="mt-1 text-[26px] font-semibold text-[#101820] max-md:text-[22px]">
                            {{ routeMode === 'list' ? '项目列表' : routeMode === 'new' ? '创建项目' : routeMode === 'settings' ? '设置' : '项目详情' }}
                        </h1>
                    </div>
                    <div class="flex flex-wrap gap-2">
                        <button v-if="routeMode !== 'new'" class="lv-primary" @click="goNew">
                            <span class="msi xxs">add</span>
                            新建项目
                        </button>
                    </div>
                </div>

                <div v-if="routeMode !== 'settings' && !providerReady" class="lv-warning">
                    <span class="msi sm">warning</span>
                    <span class="min-w-0 flex-1">图片或语音资源尚未配置，生成素材前需要完成服务设置。</span>
                    <button @click="goSettings">去设置</button>
                </div>

                <section v-if="routeMode === 'list'" class="flex flex-col gap-4">
                    <div class="flex flex-col gap-4">
                        <section class="grid grid-cols-3 gap-3 text-center max-md:grid-cols-1">
                            <div class="lv-metric"><strong>{{ projects.length }}</strong><span>项目</span></div>
                            <div class="lv-metric"><strong>{{ segmentCount }}</strong><span>段落</span></div>
                            <div class="lv-metric"><strong>{{ plannedCount }}</strong><span>已规划</span></div>
                        </section>

                        <section class="lv-panel">
                            <div class="flex items-center justify-between gap-3 border-b border-[#e6ebef] pb-3">
                                <div class="text-[13px] font-semibold text-[#53616e]">全部项目</div>
                                <button class="lv-action" @click="refresh">
                                    <span class="msi xxs">refresh</span>
                                    刷新
                                </button>
                            </div>
                            <div class="mt-3 overflow-hidden rounded-md border border-[#e0e6eb]">
                                <div class="grid grid-cols-[minmax(0,1fr)_90px_100px] bg-[#f5f7f9] px-3 py-2 text-[12px] font-semibold text-[#67737f] max-md:grid-cols-[minmax(0,1fr)_72px]">
                                    <span>项目</span><span class="max-md:hidden">段落</span><span>状态</span>
                                </div>
                                <button
                                    v-for="p in projects"
                                    :key="p.id"
                                    class="lv-row"
                                    @click="goProject(p.id)">
                                    <span class="min-w-0">
                                        <strong class="block truncate text-[13.5px] text-[#1f2a34]">{{ p.title }}</strong>
                                        <span class="mt-1 block truncate text-[12px] text-[#73808b]">{{ p.prompt }}</span>
                                    </span>
                                    <span class="max-md:hidden">{{ p.segmentCount || 0 }} 段</span>
                                    <span class="lv-status justify-self-start">{{ labelStatus(p.status) }}</span>
                                </button>
                                <div v-if="!projects.length && !loading" class="px-4 py-12 text-center text-[13px] text-[#7b8792]">
                                    暂无项目
                                </div>
                            </div>
                        </section>
                    </div>

                </section>

                <section v-if="routeMode === 'settings'" class="lv-panel">
                    <ProviderSettings
                        :settings="providerSettings"
                        :image-ready="imageProviderReady"
                        :audio-ready="audioProviderReady"
                        :busy="settingsBusy"
                        :testing="settingsTestBusy"
                        :message="settingsMessage"
                        :test-message="settingsTestMessage"
                        @patch="patchProviderSettings"
                        @save="saveSettings(false)"
                        @clear="saveSettings(true)"
                        @test-image="testProvider('image')"
                        @test-audio="testProvider('audio')" />
                </section>

                <section v-if="routeMode === 'new'" class="lv-panel">
                    <div>
                        <div class="lv-kicker">新建视频</div>
                        <h2 class="mt-1 text-[24px] font-semibold text-[#101820] max-md:text-[20px]">填写标题和描述</h2>
                    </div>

                    <div class="mt-5 grid gap-3">
                        <input v-model="form.title" class="lv-input" placeholder="标题" />
                        <div>
                            <div class="mb-2 flex items-center justify-between gap-3">
                                <label class="text-[12px] font-semibold text-[#53616e]">描述（提示词）</label>
                                <button class="lv-action" :disabled="promptBusy" @click="generateProjectPrompt">
                                    <span class="msi xxs">auto_awesome</span>
                                    {{ promptBusy ? '生成中' : '生成提示词' }}
                                </button>
                            </div>
                            <textarea v-model="form.prompt" class="lv-input min-h-[180px] w-full resize-y" placeholder="描述这部视频要讲什么、面向谁、希望呈现什么风格。"></textarea>
                        </div>
                    </div>
                    <button class="lv-primary mt-4" :disabled="busy === 'create'" @click="create">
                        <span class="msi xxs">add</span>
                        {{ busy === 'create' ? '创建中' : '创建项目' }}
                    </button>
                </section>

                <section v-if="routeMode === 'detail' && active" class="grid grid-cols-[minmax(0,1fr)_320px] gap-4 max-xl:grid-cols-1">
                    <article class="lv-panel">
                        <div class="flex items-start justify-between gap-4">
                            <div class="min-w-0">
                                <div class="lv-kicker">当前项目</div>
                                <h2 class="mt-1 truncate text-[22px] font-semibold">{{ active.title }}</h2>
                                <p class="mt-1 text-[13px] text-[#697681]">{{ active.prompt }}</p>
                            </div>
                            <span class="lv-status">{{ labelStatus(active.status) }}</span>
                        </div>

                        <div class="mt-4 flex flex-wrap gap-2">
                            <button class="lv-action" :disabled="busy === 'plan' || activeBusy" @click="run(lv.generatePlan, 'plan')">
                                <span class="msi xxs">auto_awesome</span>
                                {{ busy === 'plan' ? '规划中' : '生成大纲与解说' }}
                            </button>
                            <button class="lv-action" :disabled="!hasSegments || busy === 'assets' || activeBusy" @click="run(lv.generateAssets, 'assets')">
                                <span class="msi xxs">perm_media</span>
                                {{ active.status === 'generating' ? '生成中' : '生成图片与音频' }}
                            </button>
                            <button class="lv-action" :disabled="!hasSegments || busy === 'assemble' || activeBusy || active.status !== 'assets_ready' && active.status !== 'done'" @click="run(lv.assembleVideo, 'assemble')">
                                <span class="msi xxs">movie</span>
                                {{ active.status === 'rendering' ? '拼接中' : active.status === 'done' ? '重新拼接' : '拼接视频' }}
                            </button>
                        </div>

                        <div v-if="activeBusy" class="mt-4">
                            <div class="flex items-center justify-between text-[12px] text-[#67737f]">
                                <span>{{ active.status === 'rendering' ? '视频拼接中…' : '素材生成中…' }}</span>
                                <span>{{ active.progress || 0 }}%</span>
                            </div>
                            <div class="mt-1 h-2 overflow-hidden rounded-full bg-[#e6ebef]">
                                <div class="h-full rounded-full bg-[var(--lv-blue)] transition-all" :style="{ width: (active.progress || 0) + '%' }"></div>
                            </div>
                        </div>

                        <div v-if="active.error" class="mt-4 rounded-md border border-[#f0c9c5] bg-[#fff3f1] px-3 py-2 text-[12.5px] text-[#b3261e]">
                            {{ active.error }}
                        </div>

                        <div v-if="active.status === 'done' && active.videoPath" class="mt-5 rounded-md border border-[#dfe5ea] bg-black p-2">
                            <video :src="fileUrl(active.videoPath)" controls class="w-full rounded" style="max-height:420px"></video>
                        </div>

                        <div v-if="active.outline" class="mt-5 rounded-md border border-[#e2e7eb] bg-[#fbfcfd] p-4">
                            <div class="text-[13px] font-semibold">大纲摘要</div>
                            <p class="mt-2 text-[13px] leading-6 text-[#5f6b76]">{{ active.outline.summary }}</p>
                        </div>

                        <div class="mt-5 flex flex-col gap-3">
                            <div v-if="!hasSegments" class="rounded-md border border-[#dfe5ea] px-4 py-10 text-center text-[13px] text-[#7c8792]">还没有分段</div>
                            <article v-for="s in active.segments" :key="s.id" class="lv-seg-card">
                                <div class="lv-seg-thumb">
                                    <img v-if="s.imageStatus === 'ready' && s.imageLocal" :src="fileUrl(s.imageLocal)" class="h-full w-full object-cover" />
                                    <span v-else class="msi" :class="{ spin: s.imageStatus === 'running' }">
                                        {{ s.imageStatus === 'running' ? 'autorenew' : s.imageStatus === 'error' ? 'broken_image' : 'image' }}
                                    </span>
                                </div>
                                <div class="min-w-0 flex-1">
                                    <div class="flex items-center gap-2">
                                        <span class="font-mono text-[12px] text-[#7a8793]">#{{ s.index }}</span>
                                        <div class="truncate text-[13.5px] font-semibold">{{ s.title }}</div>
                                        <span class="ml-auto text-[12px] text-[#60707c]">{{ Math.round(s.durationSec / 60) }}m</span>
                                    </div>
                                    <p class="mt-1 line-clamp-2 text-[12.5px] leading-5 text-[#5e6a75]">{{ s.narration }}</p>
                                    <audio v-if="s.audioStatus === 'ready' && s.audioLocal" :src="fileUrl(s.audioLocal)" controls class="mt-2 h-8 w-full"></audio>
                                    <div class="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                                        <span class="lv-chip" :class="s.imageStatus">图 {{ labelStatus(s.imageStatus) }}</span>
                                        <span class="lv-chip" :class="s.audioStatus">音 {{ labelStatus(s.audioStatus) }}</span>
                                        <span v-if="s.audioDuration" class="text-[#8b96a1]">{{ s.audioDuration.toFixed(1) }}s</span>
                                        <button
                                            v-if="(s.imageStatus === 'error' || s.audioStatus === 'error') && !activeBusy"
                                            class="lv-retry"
                                            :disabled="busy === `seg-${s.id}`"
                                            @click="retrySegment(s.id)">
                                            <span class="msi xxs">refresh</span>重试
                                        </button>
                                    </div>
                                    <p v-if="s.error" class="mt-1 text-[11.5px] text-[#b3261e]">{{ s.error }}</p>
                                </div>
                            </article>
                        </div>
                    </article>

                    <aside class="lv-panel self-start">
                        <div class="lv-kicker">流水线</div>
                        <div class="mt-4 space-y-3">
                            <div class="lv-step done"><span>1</span><strong>项目定义</strong></div>
                            <div class="lv-step" :class="{ done: hasSegments }"><span>2</span><strong>大纲与解说</strong></div>
                            <div class="lv-step" :class="{ done: ['assets_ready', 'rendering', 'done'].includes(active.status) }"><span>3</span><strong>图片与音频</strong></div>
                            <div class="lv-step" :class="{ done: active.status === 'done' }"><span>4</span><strong>视频拼接</strong></div>
                        </div>
                        <div class="mt-5 rounded-md bg-[#f7f9fa] p-3 text-[12.5px] leading-6 text-[#697681]">
                            图片与语音由阿里云百炼生成并落盘到本地；拼接由 ffmpeg 真实出片。失败段落可单独重试。
                        </div>
                    </aside>
                </section>
            </section>
        </main>
    </div>
</template>

<style scoped>
.lv-root { --lv-blue: #276ef1; --lv-ink: #17202a; }
.lv-panel {
    border: 1px solid #dfe5ea;
    border-radius: 8px;
    background: #fff;
    padding: 20px;
    box-shadow: 0 1px 2px rgba(18, 32, 45, 0.04);
}
.lv-warning {
    display: flex;
    align-items: center;
    gap: 10px;
    border: 1px solid #f0d58a;
    border-radius: 8px;
    background: #fff8dc;
    color: #7a5200;
    font-size: 13px;
    line-height: 1.5;
    padding: 10px 12px;
}
.lv-warning .msi {
    color: #a66b00;
}
.lv-warning button {
    flex: none;
    border-radius: 999px;
    background: #8a5a00;
    color: #fff;
    font-size: 12px;
    font-weight: 650;
    min-height: 30px;
    padding: 0 12px;
}
.lv-kicker {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #77838f;
}
.lv-back {
    display: inline-flex;
    min-height: 30px;
    align-items: center;
    gap: 6px;
    border-radius: 999px;
    color: #174ea6;
    font-size: 13px;
    font-weight: 650;
}
.lv-back:hover {
    background: #edf3ff;
    padding: 0 10px;
    margin-left: -10px;
}
.lv-input {
    min-height: 42px;
    border: 1px solid #d8e0e7;
    border-radius: 6px;
    background: #fbfcfd;
    padding: 10px 12px;
    color: var(--lv-ink);
    outline: none;
}
.lv-input:focus { border-color: var(--lv-blue); background: #fff; }
.lv-primary,
.lv-action {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    min-height: 38px;
    border: 0;
    border-radius: 6px;
    padding: 0 14px;
    font-size: 13px;
    font-weight: 650;
}
.lv-primary { background: var(--lv-blue); color: #fff; }
.lv-action { background: #edf3ff; color: #174ea6; }
.lv-primary:disabled,
.lv-action:disabled { cursor: not-allowed; opacity: 0.48; }
.lv-row {
    display: grid;
    width: 100%;
    grid-template-columns: minmax(0, 1fr) 100px 90px 100px;
    align-items: center;
    gap: 10px;
    border: 0;
    border-top: 1px solid #edf1f4;
    background: #fff;
    padding: 12px;
    text-align: left;
    color: #53616e;
}
.lv-row:hover { background: #f6f9fc; }
.lv-metric {
    border: 1px solid #e1e7ec;
    border-radius: 7px;
    background: #fbfcfd;
    padding: 12px 8px;
}
.lv-metric strong { display: block; font-size: 22px; color: #17202a; }
.lv-metric span { font-size: 12px; color: #72808c; }
.lv-status {
    flex: none;
    border-radius: 999px;
    background: #eef3f7;
    padding: 5px 10px;
    font-size: 12px;
    font-weight: 650;
    color: #53616e;
}
.lv-segment {
    display: grid;
    grid-template-columns: 56px minmax(0, 1fr) 96px 110px;
    gap: 10px;
    border-top: 1px solid #edf1f4;
    padding: 12px;
    align-items: start;
}
.lv-step {
    display: grid;
    grid-template-columns: 30px 1fr;
    align-items: center;
    gap: 10px;
    color: #7a8793;
}
.lv-step span {
    display: grid;
    height: 28px;
    width: 28px;
    place-items: center;
    border-radius: 50%;
    background: #eef2f5;
    font-size: 12px;
    font-weight: 700;
}
.lv-step.done { color: #1f5f3b; }
.lv-step.done span { background: #e1f2e7; }
.lv-seg-card {
    display: flex;
    gap: 12px;
    border: 1px solid #e2e8ed;
    border-radius: 8px;
    background: #fbfcfd;
    padding: 10px;
}
.lv-seg-thumb {
    display: grid;
    place-items: center;
    flex: none;
    width: 120px;
    height: 68px;
    overflow: hidden;
    border-radius: 6px;
    background: #eef2f5;
    color: #9aa6b1;
}
.lv-seg-thumb .msi { font-size: 26px; }
.lv-chip {
    border-radius: 999px;
    padding: 2px 8px;
    font-weight: 650;
    background: #eef2f5;
    color: #67737f;
}
.lv-chip.ready { background: #e8f5ee; color: #1f6b3e; }
.lv-chip.running { background: #e7f0ff; color: #1f5fc0; }
.lv-chip.error { background: #fdecea; color: #b3261e; }
.lv-retry {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    border-radius: 999px;
    background: #fdecea;
    color: #b3261e;
    font-weight: 650;
    padding: 3px 9px;
}
.lv-retry:disabled { opacity: 0.5; }
.spin { animation: lv-spin 0.9s linear infinite; }
@keyframes lv-spin { to { transform: rotate(360deg); } }
.lv-provider-state {
    border-radius: 6px;
    background: #fff6e8;
    padding: 7px 8px;
    color: #9a5a00;
    font-weight: 650;
}
.lv-provider-state.ready {
    background: #e8f5ee;
    color: #1f6b3e;
}
@media (max-width: 768px) {
    .lv-row { grid-template-columns: minmax(0, 1fr) 72px; }
    .lv-segment { grid-template-columns: 44px minmax(0, 1fr) 76px; }
}
</style>
