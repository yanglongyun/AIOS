<template>
  <div class="flex h-full w-full flex-col overflow-hidden bg-[#0e0a06] font-['PingFang_SC',-apple-system,sans-serif]">

    <!-- 顶栏 -->
    <div class="flex shrink-0 items-center gap-3 border-b border-white/5 bg-[#1a1008] px-4 py-2.5">
      <span class="text-[13px] font-semibold tracking-wide text-[#d4b880]">小宇宙</span>
      <span class="h-3.5 w-px bg-white/10"></span>
      <span class="text-[11px] text-[#5a4828]">{{ currentVersionName }}</span>
      <div class="ml-auto flex items-center gap-3">
        <select
          v-model="selectedVersionId"
          @change="loadSelectedVersion"
          class="rounded-md border border-white/8 bg-white/5 px-2 py-1 text-[11px] text-[#9a8060] outline-none"
        >
          <option :value="0">最新</option>
          <option v-for="v in versions" :key="v.id" :value="v.id">{{ v.name }} #{{ v.id }}</option>
        </select>
      </div>
    </div>

    <!-- 场景区域 -->
    <div class="relative min-h-0 flex-1">
      <iframe
        class="h-full w-full border-none"
        :srcdoc="sceneHtml"
        sandbox="allow-scripts allow-same-origin"
      />
      <!-- 生成遮罩 -->
      <Transition name="fade">
        <div v-if="loading" class="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div class="flex flex-col items-center gap-3">
            <div class="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-[#d4b880]"></div>
            <span class="text-[13px] text-[#d4b880]">AI 生成中...</span>
          </div>
        </div>
      </Transition>
    </div>

    <!-- 底部输入区 -->
    <div class="shrink-0 border-t border-white/5 bg-[#140e06] px-4 pb-4 pt-3">
      <!-- 建议词 -->
      <div class="mb-2.5 flex flex-wrap gap-1.5">
        <button
          v-for="s in suggestions"
          :key="s"
          @click="submitPrompt(s)"
          :disabled="loading"
          class="rounded-full border border-white/8 bg-white/4 px-3 py-1 text-[11px] text-[#6a5838] transition-all hover:border-[#d4b880]/30 hover:bg-[#d4b880]/8 hover:text-[#c4a870] disabled:pointer-events-none disabled:opacity-30"
        >{{ s }}</button>
      </div>
      <!-- 输入框 -->
      <div class="flex items-center gap-2">
        <input
          v-model="prompt"
          @keyup.enter="submitPrompt()"
          placeholder="描述你想要的 3D 场景..."
          class="flex-1 rounded-xl border border-white/8 bg-white/5 px-4 py-2.5 text-[13px] text-[#e8d8b8] outline-none transition-all placeholder:text-[#3a2e1a] focus:border-[#d4b880]/30 focus:bg-white/7"
        />
        <button
          @click="submitPrompt()"
          :disabled="loading || !prompt.trim()"
          class="flex shrink-0 items-center gap-1.5 rounded-xl bg-[#c8a050] px-5 py-2.5 text-[13px] font-semibold text-[#0e0a06] transition-all hover:bg-[#d4ac60] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Zap class="h-3.5 w-3.5" />
          生成
        </button>
      </div>
      <p v-if="error" class="mt-2 text-[11px] text-[#c06050]">{{ error }}</p>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { Zap } from 'lucide-vue-next';

const prompt = ref('');
const loading = ref(false);
const error = ref('');
const versions = ref([]);
const selectedVersionId = ref(0);
const currentVersionName = ref('默认场景');

const defaultSuggestions = [
  '低多边形小岛，海面有波动',
  '霓虹城市夜景，镜头推进',
  '太阳系，行星绕太阳转'
];
const suggestions = ref([...defaultSuggestions]);

const defaultHtml = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<style>html,body{margin:0;height:100%;overflow:hidden;background:#09090b}canvas{display:block}</style>
</head>
<body>
<script src="https://unpkg.com/three@0.160.0/build/three.min.js"><\/script>
<script>
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, innerWidth/innerHeight, 0.1, 1000);
camera.position.set(0, 0, 3.2);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);
scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const dir = new THREE.DirectionalLight(0xa5b4fc, 1.2); dir.position.set(2,3,2); scene.add(dir);
const geo = new THREE.TorusKnotGeometry(0.7, 0.22, 180, 24);
const mat = new THREE.MeshStandardMaterial({ color: 0x7c3aed, roughness: 0.3, metalness: 0.7 });
const mesh = new THREE.Mesh(geo, mat); scene.add(mesh);
const stars = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(Array.from({length:1200},()=> (Math.random()-0.5)*30), 3)), new THREE.PointsMaterial({ color: 0x94a3b8, size: 0.03 }));
scene.add(stars);
addEventListener('resize', ()=>{ camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });
(function animate(){ requestAnimationFrame(animate); mesh.rotation.x += 0.006; mesh.rotation.y += 0.01; stars.rotation.y += 0.0008; renderer.render(scene,camera); })();
<\/script>
</body>
</html>`;

const sceneHtml = ref(defaultHtml);

const normalizeModelText = (raw = '') => {
  const txt = String(raw || '').trim();
  const fenced = txt.match(/```(?:html)?\s*([\s\S]*?)```/i);
  return (fenced ? fenced[1] : txt).trim();
};

const parseStructuredOutput = (raw = '') => {
  const txt = String(raw || '').trim();
  const fenced = txt.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const normalized = (fenced ? fenced[1] : txt).trim();
  const parsed = JSON.parse(normalized);
  const name = String(parsed?.name || '').trim();
  const html = String(parsed?.html || '').trim();
  const next = Array.isArray(parsed?.suggestions)
    ? parsed.suggestions.map(s => String(s || '').trim()).filter(Boolean).slice(0, 3)
    : [];
  return { name, html, suggestions: next };
};

const fetchVersions = async () => {
  const res = await fetch('http://localhost:9701/apps/playground/list');
  const data = await res.json();
  versions.value = data.data || [];
};

const loadLatestVersion = async () => {
  const res = await fetch('http://localhost:9701/apps/playground/latest');
  const data = await res.json();
  const row = data.data;
  if (!row) { currentVersionName.value = '默认场景'; return; }
  currentVersionName.value = row.name || '未命名场景';
  sceneHtml.value = row.html || defaultHtml;
  suggestions.value = Array.isArray(row.suggestions) && row.suggestions.length === 3
    ? row.suggestions : [...defaultSuggestions];
};

const loadSelectedVersion = async () => {
  if (!selectedVersionId.value) { await loadLatestVersion(); return; }
  const res = await fetch(`http://localhost:9701/apps/playground/detail?id=${selectedVersionId.value}`);
  const data = await res.json();
  if (!data?.success || !data?.data) return;
  const row = data.data;
  currentVersionName.value = row.name || '未命名场景';
  sceneHtml.value = row.html || defaultHtml;
  suggestions.value = Array.isArray(row.suggestions) && row.suggestions.length === 3
    ? row.suggestions : [...defaultSuggestions];
};

const submitPrompt = async (suggestion) => {
  const content = (suggestion || prompt.value).trim();
  if (!content || loading.value) return;

  if (suggestion) prompt.value = suggestion;
  loading.value = true;
  error.value = '';

  try {
    const contextBlock = [
      `当前场景名称：${currentVersionName.value || '未命名场景'}`,
      '当前场景完整 HTML：',
      String(sceneHtml.value || defaultHtml),
      '',
      `用户新需求：${content}`
    ].join('\n');

    const res = await fetch('http://localhost:9700/api/llm/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: '你是 3D 网页生成助手。你会收到"当前场景名称 + 当前场景完整HTML + 用户新需求"。默认在当前 HTML 基础上修改，尽量保留无关部分不变。返回结构化 JSON：{"name":"版本名称","html":"完整可运行的HTML（包含head/body/script，使用Three.js CDN）","suggestions":["建议1","建议2","建议3"]}。name 要简短明确；suggestions 必须给出恰好3条可继续生成3D场景的短建议。只返回 JSON，不要解释，不要 markdown。'
          },
          { role: 'user', content: contextBlock }
        ]
      })
    });

    const data = await res.json();
    if (!res.ok || data.success === false) throw new Error(data.message || `HTTP ${res.status}`);

    let name = '', html = '', nextSuggestions = [];
    try {
      const structured = parseStructuredOutput(data.message?.content || '');
      name = structured.name; html = structured.html; nextSuggestions = structured.suggestions;
    } catch {
      html = normalizeModelText(data.message?.content || '');
    }

    if (!html.toLowerCase().includes('<html')) throw new Error('模型未返回完整 HTML');
    sceneHtml.value = html;
    currentVersionName.value = name || content.slice(0, 24);
    suggestions.value = nextSuggestions.length === 3 ? nextSuggestions : [...defaultSuggestions];
    prompt.value = '';

    await fetch('http://localhost:9701/apps/playground/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name || content.slice(0, 24), prompt: content, html, suggestions: suggestions.value })
    });
    await fetchVersions();
    selectedVersionId.value = 0;
  } catch (e) {
    error.value = e.message || '生成失败';
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  await fetchVersions();
  await loadLatestVersion();
});
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
