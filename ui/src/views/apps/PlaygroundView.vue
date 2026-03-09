<template>
  <div class="flex h-full w-full flex-col overflow-hidden bg-[#0e0a06] font-['PingFang_SC',-apple-system,sans-serif]">

    <!-- 顶栏 -->
    <div class="flex shrink-0 items-center gap-3 border-b border-white/5 bg-[#1a1008] px-4 py-2.5">
      <span class="text-[12px] font-semibold tracking-wide text-[#d4b880]">{{ currentVersionName }}</span>
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
      <div v-if="suggestions.length" class="mb-2 flex flex-wrap gap-2">
        <button
          v-for="(tip, i) in suggestions"
          :key="`${tip}-${i}`"
          @click="applySuggestion(tip)"
          class="rounded-full border border-[#d4b880]/35 bg-[#2a1b0d] px-3 py-1 text-[11px] text-[#d4b880] transition-colors hover:bg-[#3a2612]"
        >
          {{ tip }}
        </button>
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
const suggestions = ref([]);

const defaultHtml = `<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<style>html,body{margin:0;height:100%;overflow:hidden;background:#000}canvas{display:block;width:100%;height:100%}</style>
</head>
<body>
<canvas id="c"></canvas>
<script>
const canvas = document.getElementById('c');
const gl = canvas.getContext('webgl');
const vert = \`attribute vec2 a_pos; void main(){ gl_Position=vec4(a_pos,0,1); }\`;
const frag = \`
precision highp float;
uniform vec2 u_res;
uniform float u_time;
float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
float sn(vec2 p){
  vec2 i=floor(p); vec2 f=fract(p);
  f = f*f*(3.0-2.0*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);
}
float fbm(vec2 p){
  float v=0.0, a=0.5;
  for(int i=0;i<6;i++){ v+=a*sn(p); p*=2.05; a*=0.52; }
  return v;
}
float warp(vec2 p, float t){
  vec2 q = vec2(fbm(p + vec2(0.0,0.0) + t*0.04), fbm(p + vec2(5.2,1.3) + t*0.03));
  vec2 r = vec2(fbm(p + q*2.2 + vec2(1.7,9.2) + t*0.025), fbm(p + q*2.2 + vec2(8.3,2.8) + t*0.02));
  return fbm(p + r*2.4);
}
void main(){
  vec2 uv = gl_FragCoord.xy / u_res;
  uv.x *= u_res.x / u_res.y;
  float t = u_time * 0.12;
  float n = warp(uv * 1.4 - 0.7, t);
  float dense = pow(n, 1.6);
  float mid   = pow(max(0.0, n - 0.3), 1.2) * 2.0;
  float thin  = max(0.0, n - 0.55) * 3.5;
  vec3 c1 = vec3(0.72, 0.08, 0.28);
  vec3 c2 = vec3(0.04, 0.42, 0.78);
  vec3 c3 = vec3(0.85, 0.42, 0.06);
  vec3 c4 = vec3(0.12, 0.04, 0.22);
  float mixA = fbm(uv*2.1 + t*0.02);
  float mixB = fbm(uv*1.8 + vec2(3.1,2.2) + t*0.015);
  vec3 nebulaCol = mix(c1, c2, mixA);
  nebulaCol = mix(nebulaCol, c3, mixB * 0.5);
  nebulaCol = mix(c4, nebulaCol, dense * 1.8);
  float glow = dense * 0.9 + mid * 0.5 + thin * 0.3;
  vec3 col = nebulaCol * glow;
  float hotN = warp(uv*2.0 - 0.5, t * 1.3);
  float hotCore = pow(max(0.0, hotN - 0.62), 2.0) * 6.0;
  col += vec3(0.95, 0.85, 1.0) * hotCore;
  vec2 sid1 = floor(uv * 95.0);
  vec2 sf1  = fract(uv * 95.0) - 0.5;
  float s1  = smoothstep(0.09, 0.0, length(sf1));
  s1 *= step(hash(sid1 + 0.1), 0.14);
  s1 *= 0.4 + 0.6 * hash(sid1 + 2.3);
  s1 *= 0.6 + 0.4 * sin(u_time * 0.9 + hash(sid1)*20.0);
  col += s1 * vec3(0.85, 0.9, 1.0);
  vec2 sid2 = floor(uv * 42.0);
  vec2 sf2  = fract(uv * 42.0) - 0.5;
  float s2  = smoothstep(0.13, 0.0, length(sf2));
  s2 *= step(hash(sid2 + 5.0), 0.10);
  s2 *= 0.5 + 0.5*hash(sid2+1.0);
  col += s2 * mix(vec3(0.8,0.9,1.0), vec3(1.0,0.85,0.6), hash(sid2+3.0)) * 1.2;
  vec2 sp3 = uv - vec2(0.38, 0.55);
  float sr3 = length(sp3);
  col += 0.6 * exp(-sr3 * 22.0) * vec3(0.9, 0.95, 1.0);
  col += 0.12 * exp(-abs(sp3.x)*55.0) * exp(-sr3*3.0) * vec3(0.8,0.9,1.0);
  col += 0.12 * exp(-abs(sp3.y)*55.0) * exp(-sr3*3.0) * vec3(0.8,0.9,1.0);
  vec2 sp4 = uv - vec2(0.72, 0.30);
  float sr4 = length(sp4);
  col += 0.4 * exp(-sr4 * 28.0) * vec3(1.0,0.88,0.7);
  col += 0.08 * exp(-abs(sp4.x)*70.0) * exp(-sr4*4.0) * vec3(1.0,0.85,0.6);
  col += 0.08 * exp(-abs(sp4.y)*70.0) * exp(-sr4*4.0) * vec3(1.0,0.85,0.6);
  float dustN = warp(uv*2.5 + vec2(1.0,0.5), t*0.8);
  float dustMask = smoothstep(0.7, 0.58, dustN);
  col *= 0.15 + 0.85 * dustMask;
  col *= 1.3;
  col = pow(clamp(col, 0.0, 1.0), vec3(0.85));
  gl_FragColor = vec4(col, 1.0);
}
\`;
function compile(type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);return s;}
const prog=gl.createProgram();
gl.attachShader(prog,compile(gl.VERTEX_SHADER,vert));
gl.attachShader(prog,compile(gl.FRAGMENT_SHADER,frag));
gl.linkProgram(prog);gl.useProgram(prog);
const buf=gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER,buf);
gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
const loc=gl.getAttribLocation(prog,'a_pos');
gl.enableVertexAttribArray(loc);
gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
const uRes=gl.getUniformLocation(prog,'u_res');
const uTime=gl.getUniformLocation(prog,'u_time');
function resize(){canvas.width=innerWidth;canvas.height=innerHeight;gl.viewport(0,0,innerWidth,innerHeight);}
addEventListener('resize',resize);resize();
let start=performance.now() - Math.random()*100000;
(function loop(){
  requestAnimationFrame(loop);
  const t=(performance.now()-start)/1000;
  gl.uniform2f(uRes,canvas.width,canvas.height);
  gl.uniform1f(uTime,t);
  gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
})();
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
  const suggestionList = Array.isArray(parsed?.suggestions)
    ? parsed.suggestions.map((s) => String(s || '').trim()).filter(Boolean).slice(0, 3)
    : [];
  return { name, html, suggestions: suggestionList };
};

const fetchVersions = async () => {
  const res = await fetch('/apps/playground/list');
  const data = await res.json();
  versions.value = data.data || [];
};

const loadLatestVersion = async () => {
  const res = await fetch('/apps/playground/latest');
  const data = await res.json();
  const row = data.data;
  if (!row) { currentVersionName.value = '默认场景'; return; }
  currentVersionName.value = row.name || '未命名场景';
  sceneHtml.value = row.html || defaultHtml;
  suggestions.value = [];
};

const loadSelectedVersion = async () => {
  if (!selectedVersionId.value) { await loadLatestVersion(); return; }
  const res = await fetch(`/apps/playground/detail?id=${selectedVersionId.value}`);
  const data = await res.json();
  if (!data?.success || !data?.data) return;
  const row = data.data;
  currentVersionName.value = row.name || '未命名场景';
  sceneHtml.value = row.html || defaultHtml;
  suggestions.value = [];
};

const applySuggestion = (text) => {
  prompt.value = String(text || '').trim();
};

const submitPrompt = async () => {
  const content = prompt.value.trim();
  if (!content || loading.value) return;
  loading.value = true;
  error.value = '';

  try {
    const contextBlock = [
      `${'当前场景名称：'}${currentVersionName.value || '未命名场景'}`,
      '当前场景完整 HTML：',
      String(sceneHtml.value || defaultHtml),
      '',
      `${'用户新需求：'}${content}`
    ].join('\n');

    const res = await fetch('/api/task/create/instant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        app: 'playground',
        title: '3D 场景生成',
        prompt: '根据当前场景和需求生成新版本 HTML',
        schema: { required: ['name', 'html', 'suggestions'] },
        messages: [
          {
            role: 'system',
            content: '你是 3D 网页生成助手。你会收到"当前场景名称 + 当前场景完整HTML + 用户新需求"。默认在当前 HTML 基础上修改，尽量保留无关部分不变。返回结构化 JSON：{"name":"版本名称","html":"完整可运行的HTML（包含head/body/script，使用Three.js CDN）","suggestions":["后续建议1","后续建议2","后续建议3"]}。suggestions 必须是 3 条简短、可执行的下一步改造建议。name 要简短明确。只返回 JSON，不要解释，不要 markdown。'
          },
          { role: 'user', content: contextBlock }
        ]
      })
    });

    const data = await res.json();
    if (!res.ok || data.success === false) throw new Error(data.message || `HTTP ${res.status}`);

    let name = '', html = '', nextSuggestions = [];
    try {
      const structured = parseStructuredOutput(String(data.response || ''));
      name = structured.name;
      html = structured.html;
      nextSuggestions = structured.suggestions || [];
    } catch {
      html = normalizeModelText(String(data.response || ''));
      nextSuggestions = [];
    }

    if (!html.toLowerCase().includes('<html')) throw new Error('模型未返回完整 HTML');
    sceneHtml.value = html;
    currentVersionName.value = name || content.slice(0, 24);
    suggestions.value = nextSuggestions;
    prompt.value = '';

    await fetch('/apps/playground/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name || content.slice(0, 24), prompt: content, html })
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
