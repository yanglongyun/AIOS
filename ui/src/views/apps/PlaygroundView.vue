<template>
  <div class="p-6 w-full max-w-4xl mx-auto h-full overflow-y-auto">
    <div class="mb-6">
      <h1 class="text-3xl font-bold italic tracking-tight text-neutral-800 dark:text-neutral-100">Playground.</h1>
      <p class="text-neutral-500 dark:text-neutral-400 text-sm mt-1">输入一句话，AI 生成可运行的 3D 网页场景。</p>
    </div>

    <section class="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800/40 overflow-hidden mb-5">
      <div class="px-4 py-3 border-b border-neutral-100 dark:border-neutral-700 flex items-center justify-between">
        <span class="text-xs uppercase tracking-widest text-neutral-400">3D 渲染</span>
        <div class="flex items-center gap-2">
          <select
            v-model="selectedVersionId"
            @change="loadSelectedVersion"
            class="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option :value="0">最新版本</option>
            <option v-for="v in versions" :key="v.id" :value="v.id">{{ v.name }} · #{{ v.id }}</option>
          </select>
          <span class="text-xs text-neutral-400">{{ loading ? '生成中...' : '就绪' }}</span>
        </div>
      </div>
      <iframe
        class="w-full h-[460px] bg-neutral-50 dark:bg-neutral-900"
        :srcdoc="sceneHtml"
        sandbox="allow-scripts allow-same-origin"
      />
    </section>

    <section class="bg-neutral-100 dark:bg-neutral-800/30 p-3 rounded-2xl">
      <div class="flex flex-wrap gap-2 mb-3">
        <button
          v-for="s in suggestions"
          :key="s"
          @click="submitPrompt(s)"
          class="px-3 py-1.5 rounded-xl text-xs bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700"
        >
          {{ s }}
        </button>
      </div>

      <div class="flex gap-2 items-center">
        <input
          v-model="prompt"
          @keyup.enter="submitPrompt()"
          placeholder="例如：做一个赛博风格旋转星球，带粒子和相机缓慢环绕"
          class="flex-1 bg-white dark:bg-neutral-800 border-none rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
        />
        <button
          @click="submitPrompt()"
          :disabled="loading || !prompt.trim()"
          class="bg-neutral-900 dark:bg-white dark:text-neutral-900 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ loading ? '生成中...' : '发送' }}
        </button>
      </div>

      <p v-if="error" class="mt-2 text-xs text-rose-500">{{ error }}</p>
    </section>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';

const prompt = ref('');
const loading = ref(false);
const error = ref('');
const versions = ref([]);
const selectedVersionId = ref(0);

const defaultSuggestions = [
  '做一个低多边形小岛，海面有波动和阳光',
  '生成一个霓虹城市夜景，镜头缓慢推进',
  '做一个太阳系场景，行星绕着太阳转'
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
<script src="https://unpkg.com/three@0.160.0/build/three.min.js"><\\/script>
<script>
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, innerWidth/innerHeight, 0.1, 1000);
camera.position.set(0, 0.6, 3.2);
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
<\\/script>
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
  const res = await fetch('http://localhost:9701/api/apps/playground/list');
  const data = await res.json();
  versions.value = data.data || [];
};

const loadLatestVersion = async () => {
  const res = await fetch('http://localhost:9701/api/apps/playground/latest');
  const data = await res.json();
  const row = data.data;
  if (!row) return;
  sceneHtml.value = row.html || defaultHtml;
  suggestions.value = Array.isArray(row.suggestions) && row.suggestions.length === 3
    ? row.suggestions
    : [...defaultSuggestions];
};

const loadSelectedVersion = async () => {
  if (!selectedVersionId.value) {
    await loadLatestVersion();
    return;
  }
  const res = await fetch(`http://localhost:9701/api/apps/playground/detail?id=${selectedVersionId.value}`);
  const data = await res.json();
  if (!data?.success || !data?.data) return;
  const row = data.data;
  sceneHtml.value = row.html || defaultHtml;
  suggestions.value = Array.isArray(row.suggestions) && row.suggestions.length === 3
    ? row.suggestions
    : [...defaultSuggestions];
};

const submitPrompt = async (suggestion) => {
  const content = (suggestion || prompt.value).trim();
  if (!content || loading.value) return;

  if (suggestion) prompt.value = suggestion;
  loading.value = true;
  error.value = '';

  try {
    const res = await fetch('http://localhost:9700/api/llm/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: '你是 3D 网页生成助手。根据用户要求返回结构化 JSON：{"name":"版本名称","html":"完整可运行的HTML（包含head/body/script，使用Three.js CDN）","suggestions":["建议1","建议2","建议3"]}。name 要简短明确；suggestions 必须给出恰好3条可继续生成3D场景的短建议。只返回 JSON，不要解释，不要 markdown。'
          },
          { role: 'user', content }
        ]
      })
    });

    const data = await res.json();
    if (!res.ok || data.success === false) throw new Error(data.message || `HTTP ${res.status}`);

    let name = '';
    let html = '';
    let nextSuggestions = [];
    try {
      const structured = parseStructuredOutput(data.message?.content || '');
      name = structured.name;
      html = structured.html;
      nextSuggestions = structured.suggestions;
    } catch {
      html = normalizeModelText(data.message?.content || '');
    }

    if (!html.toLowerCase().includes('<html')) throw new Error('模型未返回完整 HTML');
    sceneHtml.value = html;
    suggestions.value = nextSuggestions.length === 3 ? nextSuggestions : [...defaultSuggestions];

    await fetch('http://localhost:9701/api/apps/playground/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name || content.slice(0, 24),
        prompt: content,
        html,
        suggestions: suggestions.value
      })
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
