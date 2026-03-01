<template>
  <div class="flex-1 overflow-y-auto bg-[#f5f0e8] bg-[repeating-linear-gradient(0deg,transparent_0,transparent_28px,rgba(0,0,0,0.02)_28px,rgba(0,0,0,0.02)_29px)] font-['Georgia','PingFang_SC',serif]">
    <div class="mx-auto max-w-[860px] px-5 py-7">
      <div class="mb-[22px] flex items-center gap-3">
        <div class="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[linear-gradient(135deg,#d4a574,#c08a50)] text-lg shadow-[0_2px_8px_rgba(160,120,60,0.25)]">⚡</div>
        <div>
          <div class="text-lg font-bold text-[#5a4a38]">空间工坊</div>
          <div class="mt-0.5 text-xs text-[#a09078]">输入一句话，AI 生成可运行的 3D 网页场景</div>
        </div>
      </div>

      <div class="relative mb-4 overflow-hidden rounded-[14px] bg-[#3a2a1a] shadow-[0_4px_16px_rgba(60,40,20,0.2),inset_0_0_0_6px_#4a3828,inset_0_0_0_7px_rgba(255,255,255,0.08)]">
        <div class="flex items-center justify-between border-b border-white/5 bg-[#4a3828] px-3.5 py-2">
          <span class="text-[11px] tracking-[0.08em] text-[#b8a080]">3D 渲染</span>
          <div class="flex items-center gap-2.5">
            <select
              v-model="selectedVersionId"
              @change="loadSelectedVersion"
              class="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-[#c8b090] outline-none"
            >
              <option :value="0">最新版本</option>
              <option v-for="v in versions" :key="v.id" :value="v.id">{{ v.name }} · #{{ v.id }}</option>
            </select>
            <div class="flex items-center gap-1 text-[10px] text-[#8a7a60]">
              <span class="h-[5px] w-[5px] rounded-full bg-[#4ade80]" :class="{ 'animate-pulse bg-[#facc15]': loading }"></span>
              {{ loading ? '生成中...' : '就绪' }}
            </div>
          </div>
        </div>
        <iframe
          class="h-[440px] w-full border-none bg-[#1a1210]"
          :srcdoc="sceneHtml"
          sandbox="allow-scripts allow-same-origin"
        />
      </div>

      <div class="mb-[14px] flex flex-wrap gap-2">
        <button
          v-for="s in suggestions"
          :key="s"
          @click="submitPrompt(s)"
          class="cursor-pointer rounded-lg border border-[rgba(160,120,60,0.2)] bg-[rgba(200,160,100,0.08)] px-3.5 py-[7px] text-xs text-[#8a7050] transition-all hover:border-[rgba(160,120,60,0.35)] hover:bg-[rgba(200,160,100,0.15)] hover:text-[#5a4a38]"
        >{{ s }}</button>
      </div>

      <div class="rounded-xl border border-[rgba(160,120,60,0.15)] bg-[#faf6ee] p-3.5 shadow-[0_2px_8px_rgba(100,80,40,0.06)]">
        <div class="flex items-center gap-2">
          <input
            v-model="prompt"
            @keyup.enter="submitPrompt()"
            placeholder="描述你想要的 3D 场景..."
            class="flex-1 border-none border-b border-[rgba(160,120,60,0.2)] bg-transparent px-1 py-2 text-[13px] text-[#5a4a38] outline-none placeholder:text-[#c0b098] focus:border-b-[rgba(160,120,60,0.5)]"
          />
          <button
            @click="submitPrompt()"
            :disabled="loading || !prompt.trim()"
            class="whitespace-nowrap rounded-[10px] bg-[#5a3e28] px-5 py-[9px] text-[13px] text-[#f0e8d8] shadow-[0_2px_6px_rgba(90,62,40,0.25)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >{{ loading ? '生成中...' : '生成' }}</button>
        </div>
        <p v-if="error" class="mt-2.5 text-xs text-[#c05040]">{{ error }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';

const prompt = ref('');
const loading = ref(false);
const error = ref('');
const versions = ref([]);
const selectedVersionId = ref(0);
const currentVersionName = ref('默认场景');

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
<script src="https://unpkg.com/three@0.160.0/build/three.min.js"><\/script>
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
  const res = await fetch('http://localhost:9701/api/apps/playground/list');
  const data = await res.json();
  versions.value = data.data || [];
};

const loadLatestVersion = async () => {
  const res = await fetch('http://localhost:9701/api/apps/playground/latest');
  const data = await res.json();
  const row = data.data;
  if (!row) {
    currentVersionName.value = '默认场景';
    return;
  }
  currentVersionName.value = row.name || '未命名场景';
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
  currentVersionName.value = row.name || '未命名场景';
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
    const currentName = currentVersionName.value || '未命名场景';
    const currentHtml = String(sceneHtml.value || defaultHtml);
    const contextBlock = [
      `当前场景名称：${currentName}`,
      '当前场景完整 HTML：',
      currentHtml,
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
    currentVersionName.value = name || content.slice(0, 24);
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
