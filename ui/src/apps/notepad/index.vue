<template>
  <div class="np-app" :data-theme="themeName">
    <section v-if="!active" class="np-home">
      <header class="np-head">
        <div>
          <div class="greet">{{ greeting }} · {{ todayLabel }}</div>
          <h1 class="serif">笔记 <span>{{ notes.length }} 篇 · 本周 {{ weekCount }} 篇</span></h1>
        </div>
        <button class="icon" title="新建笔记" @click="newNote">+</button>
      </header>

      <label class="search">
        <span>⌕</span>
        <input v-model="query" placeholder="搜索标题、正文、标签" />
      </label>

      <div class="chips">
        <button v-for="chip in folderChips" :key="chip.key" class="chip" :class="{ on: activeFolder === chip.key }" @click="activeFolder = chip.key">
          <i v-if="chip.color" :style="{ background: chip.color }"></i>{{ chip.label }}<b>{{ chip.count }}</b>
        </button>
        <button class="chip add" @click="addFolder">+ 文件夹</button>
      </div>
      <div v-if="tagChips.length" class="chips tags">
        <button v-for="tag in tagChips" :key="tag" class="chip" :class="{ on: activeTag === tag }" @click="activeTag = activeTag === tag ? '' : tag"># {{ tag }}</button>
      </div>

      <div class="scroll">
        <div v-if="filteredNotes.length" class="masonry">
          <article
            v-for="(note, index) in filteredNotes"
            :key="note.id"
            class="note-card"
            :class="{ pinned: note.pinned }"
            :style="{ animationDelay: `${index * 35}ms` }"
            @click="openNote(note)"
          >
            <div v-if="note.pinned" class="tape"></div>
            <div v-if="note.emoji" class="emoji">{{ note.emoji }}</div>
            <h2 class="serif">{{ note.title || '无标题' }}</h2>
            <div class="snippet" v-html="snippet(note.content)"></div>
            <footer>
              <span v-for="tag in note.tags.slice(0, 2)" :key="tag">#{{ tag }}</span>
              <time>{{ timeAgo(note.updated_at) }}</time>
            </footer>
          </article>
        </div>
        <div v-else class="empty">
          <strong>没有匹配的笔记</strong>
          <p>点右上角 + 写一篇</p>
        </div>
      </div>
    </section>

    <section v-else class="np-editor">
      <header class="edit-top">
        <button class="back" @click="closeEditor">完成</button>
        <span class="save"><i :class="{ hot: saving }"></i>{{ saving ? '输入中...' : '已保存' }}</span>
        <button class="icon" :class="{ on: active.pinned }" title="置顶" @click="patchActive({ pinned: !active.pinned })">★</button>
        <button class="icon" title="预览" @click="preview = !preview">{{ preview ? '✎' : '◐' }}</button>
        <button class="icon danger" title="删除" @click="removeActive">⌫</button>
      </header>

      <div class="edit-scroll">
        <input v-model="active.title" class="title serif" placeholder="无标题" @input="scheduleSave" />
        <div class="docline">
          <span>{{ docDate }}</span><span>·</span><span>{{ charCount }} 字</span><span>·</span><span>约 {{ readMinutes }} 分钟</span>
        </div>
        <div class="meta">
          <select v-model="active.folder" @change="scheduleSave">
            <option value="">无文件夹</option>
            <option v-for="folder in folders" :key="folder.id" :value="folder.name">{{ folder.name }}</option>
          </select>
          <div class="tag-edit">
            <button v-for="tag in active.tags" :key="tag" @click="removeTag(tag)">#{{ tag }} ×</button>
            <button @click="addTag">+ 标签</button>
          </div>
        </div>
        <textarea
          v-show="!preview"
          ref="textarea"
          v-model="active.content"
          class="body"
          placeholder="写点什么… 支持 Markdown,试试下方工具栏"
          @input="scheduleSave"
        ></textarea>
        <div v-show="preview" class="md" v-html="renderMd(active.content)"></div>
      </div>

      <div class="toolbar" v-show="!preview">
        <button @click="insert('# ')">H1</button>
        <button @click="insert('## ')">H2</button>
        <button @click="wrap('**')">B</button>
        <button @click="wrap('*')"><i>I</i></button>
        <button @click="insert('- ')">•</button>
        <button @click="insert('- [ ] ')">☑</button>
        <button @click="insert('> ')">❝</button>
        <button @click="wrap('`')">‹/›</button>
        <button @click="insert('---\n')">—</button>
      </div>

      <div class="ai-dock">
        <span>AI</span>
        <button v-for="item in aiModes" :key="item.mode" @click="runAi(item.mode)">{{ item.label }}</button>
      </div>
    </section>

    <div class="mask" :class="{ show: sheetOpen }" @click="closeSheet"></div>
    <aside class="sheet" :class="{ show: sheetOpen }">
      <div class="grip"></div>
      <header><b>{{ sheetTitle }}</b><button @click="closeSheet">×</button></header>
      <div class="out">{{ aiResult || '处理中...' }}</div>
      <footer>
        <button class="primary" :disabled="!aiResult" @click="applyAi">应用到笔记</button>
        <button :disabled="!aiResult" @click="copyAi">复制</button>
        <button @click="closeSheet">放弃</button>
      </footer>
    </aside>
    <div class="toast" :class="{ show: toastText }">{{ toastText }}</div>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref } from 'vue';
import { useThemeStore } from '../../stores/theme.js';

const theme = useThemeStore();
const themeName = computed(() => theme.resolved === 'dark' ? 'dark' : 'light');
const notes = ref([]);
const folders = ref([]);
const query = ref('');
const activeFolder = ref('all');
const activeTag = ref('');
const active = ref(null);
const preview = ref(false);
const saving = ref(false);
const textarea = ref(null);
const sheetOpen = ref(false);
const sheetTitle = ref('AI');
const aiResult = ref('');
const aiMode = ref('');
const toastText = ref('');
let saveTimer = null;
let toastTimer = null;

const aiModes = [
  { mode: 'polish', label: '润色' },
  { mode: 'condense', label: '精简' },
  { mode: 'expand', label: '扩写' },
  { mode: 'title', label: '起标题' },
  { mode: 'format', label: '排版' },
];

const request = async (url, options = {}) => {
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
};

const load = async () => {
  const data = await request('/apps/notepad/notes');
  notes.value = data.notes || [];
  folders.value = data.folders || [];
  if (active.value) {
    const fresh = notes.value.find((item) => item.id === active.value.id);
    if (fresh) active.value = { ...fresh, tags: [...fresh.tags] };
  }
};

const greeting = computed(() => {
  const h = new Date().getHours();
  return h < 5 ? '夜深了' : h < 11 ? '早上好' : h < 13 ? '中午好' : h < 18 ? '下午好' : '晚上好';
});
const todayLabel = computed(() => new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' }));
const weekCount = computed(() => notes.value.filter((n) => Date.now() - new Date(n.updated_at).getTime() < 7 * 86400000).length);
const folderChips = computed(() => {
  const base = [
    { key: 'all', label: '全部', count: notes.value.length },
    { key: 'pinned', label: '置顶', count: notes.value.filter((n) => n.pinned).length },
  ];
  return base.concat(folders.value.map((folder) => ({
    key: folder.name,
    label: folder.name,
    color: folder.color,
    count: notes.value.filter((n) => n.folder === folder.name).length,
  })));
});
const tagChips = computed(() => [...new Set(notes.value.flatMap((n) => n.tags || []))]);
const filteredNotes = computed(() => {
  const q = query.value.trim().toLowerCase();
  return notes.value.filter((note) => {
    if (activeFolder.value === 'pinned' && !note.pinned) return false;
    if (activeFolder.value !== 'all' && activeFolder.value !== 'pinned' && note.folder !== activeFolder.value) return false;
    if (activeTag.value && !note.tags.includes(activeTag.value)) return false;
    if (!q) return true;
    return [note.title, note.content, ...(note.tags || [])].join(' ').toLowerCase().includes(q);
  });
});
const charCount = computed(() => active.value ? active.value.content.replace(/\s/g, '').length : 0);
const readMinutes = computed(() => Math.max(1, Math.ceil(charCount.value / 450)));
const docDate = computed(() => active.value ? new Date(active.value.updated_at || Date.now()).toLocaleDateString('zh-CN') : '');

const showToast = (text) => {
  toastText.value = text;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toastText.value = ''; }, 1800);
};

const openNote = (note) => {
  active.value = { ...note, tags: [...(note.tags || [])] };
  preview.value = false;
};
const closeEditor = async () => {
  await saveNow();
  active.value = null;
  await load();
};
const newNote = async () => {
  const emojis = ['📝', '✨', '🌿', '🔖', '🫧', '🍞'];
  const data = await request('/apps/notepad/notes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: '', content: '', emoji: emojis[Math.floor(Math.random() * emojis.length)] }),
  });
  await load();
  openNote(data.note);
};
const patchActive = async (patch) => {
  if (!active.value) return;
  active.value = { ...active.value, ...patch };
  await saveNow();
};
const scheduleSave = () => {
  saving.value = true;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveNow, 450);
};
const saveNow = async () => {
  if (!active.value) return;
  clearTimeout(saveTimer);
  await request(`/apps/notepad/notes?id=${active.value.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(active.value),
  });
  saving.value = false;
};
const removeActive = async () => {
  if (!active.value || !confirm('删除这篇笔记?')) return;
  await request(`/apps/notepad/notes?id=${active.value.id}`, { method: 'DELETE' });
  active.value = null;
  await load();
  showToast('已删除');
};
const addFolder = async () => {
  const name = prompt('新文件夹名称');
  if (!name?.trim()) return;
  await request('/apps/notepad/folders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: name.trim() }),
  });
  await load();
};
const addTag = () => {
  if (!active.value) return;
  const tag = prompt('标签名称');
  if (!tag?.trim()) return;
  active.value.tags = [...new Set([...(active.value.tags || []), tag.trim().replace(/^#/, '')])];
  scheduleSave();
};
const removeTag = (tag) => {
  active.value.tags = active.value.tags.filter((item) => item !== tag);
  scheduleSave();
};

const insert = (text) => {
  const ta = textarea.value;
  if (!ta || !active.value) return;
  const s = ta.selectionStart;
  const e = ta.selectionEnd;
  active.value.content = active.value.content.slice(0, s) + text + active.value.content.slice(e);
  nextTick(() => {
    ta.focus();
    ta.selectionStart = ta.selectionEnd = s + text.length;
  });
  scheduleSave();
};
const wrap = (mark) => {
  const ta = textarea.value;
  if (!ta || !active.value) return;
  const s = ta.selectionStart;
  const e = ta.selectionEnd;
  const selected = active.value.content.slice(s, e);
  active.value.content = active.value.content.slice(0, s) + mark + selected + mark + active.value.content.slice(e);
  nextTick(() => {
    ta.focus();
    ta.selectionStart = s + mark.length;
    ta.selectionEnd = e + mark.length;
  });
  scheduleSave();
};

const escapeHtml = (s) => String(s || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const inlineMd = (s) => escapeHtml(s)
  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  .replace(/\*(.*?)\*/g, '<em>$1</em>')
  .replace(/`(.*?)`/g, '<code>$1</code>')
  .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
const renderMd = (src) => String(src || '').split('\n').map((line) => {
  if (/^###\s+/.test(line)) return `<h3>${inlineMd(line.replace(/^###\s+/, ''))}</h3>`;
  if (/^##\s+/.test(line)) return `<h2>${inlineMd(line.replace(/^##\s+/, ''))}</h2>`;
  if (/^#\s+/.test(line)) return `<h1>${inlineMd(line.replace(/^#\s+/, ''))}</h1>`;
  if (/^>\s?/.test(line)) return `<blockquote>${inlineMd(line.replace(/^>\s?/, ''))}</blockquote>`;
  if (/^---+$/.test(line.trim())) return '<hr>';
  const task = line.match(/^[-*]\s+\[( |x)\]\s+(.*)$/i);
  if (task) return `<p class="task ${task[1].toLowerCase() === 'x' ? 'done' : ''}"><span>${task[1].toLowerCase() === 'x' ? '✓' : ''}</span>${inlineMd(task[2])}</p>`;
  if (/^[-*]\s+/.test(line)) return `<p class="li">• ${inlineMd(line.replace(/^[-*]\s+/, ''))}</p>`;
  if (/^\d+\.\s+/.test(line)) return `<p class="li">${inlineMd(line)}</p>`;
  return line.trim() ? `<p>${inlineMd(line)}</p>` : '<br>';
}).join('');
const snippet = (content) => String(content || '').split('\n').filter(Boolean).slice(0, 5).map((line) => {
  const task = line.match(/^[-*]\s+\[( |x)\]\s+(.*)$/i);
  return task ? `<div>${task[1].toLowerCase() === 'x' ? '☑' : '☐'} ${escapeHtml(task[2])}</div>` : `<div>${escapeHtml(line.replace(/^#+\s*/, ''))}</div>`;
}).join('');
const timeAgo = (value) => {
  const diff = Date.now() - new Date(value).getTime();
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
  return `${Math.floor(diff / 86400000)} 天前`;
};

const runAi = async (mode) => {
  if (!active.value) return;
  aiMode.value = mode;
  aiResult.value = '';
  sheetTitle.value = aiModes.find((item) => item.mode === mode)?.label || 'AI';
  sheetOpen.value = true;
  try {
    const data = await request('/apps/notepad/polish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode, content: active.value.content }),
    });
    aiResult.value = data.result?.content || '';
  } catch (err) {
    aiResult.value = `错误: ${err.message}`;
  }
};
const closeSheet = () => { sheetOpen.value = false; };
const applyAi = () => {
  if (!active.value || !aiResult.value) return;
  if (aiMode.value === 'title') active.value.title = aiResult.value.slice(0, 30);
  else active.value.content = aiResult.value;
  scheduleSave();
  closeSheet();
  showToast('已应用');
};
const copyAi = async () => {
  await navigator.clipboard?.writeText(aiResult.value);
  showToast('已复制');
};

onMounted(load);
</script>

<style scoped>
.np-app{--bg0:#f4eddc;--bg1:#e6dabc;--panel:#fbf7ec;--panel2:#fffaf0;--ink:#33241a;--ink2:#6b5742;--muted:#9a8468;--line:rgba(140,110,60,.18);--line2:rgba(140,110,60,.32);--accent:#a06c3a;--gold:#b8860b;--shadow:0 4px 18px rgba(90,60,20,.12);height:100%;position:relative;overflow:hidden;background:linear-gradient(160deg,var(--bg0),var(--bg1));background-image:radial-gradient(rgba(140,100,40,.05) 1px,transparent 1px);background-size:7px 7px;color:var(--ink)}
.np-app[data-theme=dark]{--bg0:#201811;--bg1:#302416;--panel:#2b2118;--panel2:#35281c;--ink:#f3eadb;--ink2:#d0bea2;--muted:#9f8968;--line:rgba(230,200,150,.12);--line2:rgba(230,200,150,.24);--accent:#c98b50;--gold:#d9b25c;--shadow:0 4px 18px rgba(0,0,0,.28)}
.serif{font-family:"Songti SC","Noto Serif SC",serif}.np-home,.np-editor{height:100%;display:flex;flex-direction:column;min-height:0}.np-head,.edit-top{display:flex;align-items:center;gap:10px;padding:14px 18px 10px}.np-head h1{font-size:28px;font-weight:900}.np-head h1 span{font-family:inherit;font-size:11px;color:var(--muted)}.greet,.docline{font-size:11px;color:var(--muted)}.icon,.back{border:1px solid var(--line);background:var(--panel);box-shadow:var(--shadow),inset 0 1px 0 rgba(255,255,255,.65);border-radius:13px;color:var(--ink);font-weight:900;min-width:38px;height:38px}.icon{margin-left:auto}.icon+.icon{margin-left:0}.icon.on{color:var(--gold)}.danger{color:#b34a35}.search{margin:0 18px 4px;display:flex;align-items:center;gap:8px;border:1px solid var(--line);background:rgba(255,252,244,.72);border-radius:15px;padding:10px 12px}.search input{flex:1;outline:0;background:transparent;color:var(--ink);font-size:13px}.chips{display:flex;gap:7px;padding:8px 18px 0;overflow-x:auto;scrollbar-width:none}.chip{flex:none;display:flex;align-items:center;gap:6px;border:1px solid var(--line);background:rgba(255,252,244,.62);border-radius:999px;padding:6px 12px;font-size:12px;font-weight:800;color:var(--ink2)}.chip i{width:7px;height:7px;border-radius:50%}.chip b{font-size:10px;color:var(--muted)}.chip.on{background:var(--ink);color:var(--bg0);transform:translateY(-1px)}.chip.add{border-style:dashed;color:var(--muted)}.scroll,.edit-scroll{min-height:0;flex:1;overflow:auto;padding:12px 18px 90px}.masonry{column-count:2;column-gap:11px}.note-card{position:relative;break-inside:avoid;margin-bottom:11px;padding:14px;border-radius:17px;border:1px solid var(--line);background:linear-gradient(160deg,var(--panel2),var(--panel));box-shadow:var(--shadow),inset 0 1px 0 rgba(255,255,255,.72);animation:pop .35s both}.note-card:active{transform:scale(.97)}.tape{position:absolute;left:30%;top:-7px;width:42px;height:14px;border-radius:3px;background:rgba(210,170,100,.36);transform:rotate(-2deg)}.emoji{font-size:22px;margin-bottom:7px}.note-card h2{font-size:15px;line-height:1.45}.snippet{font-size:12px;color:var(--ink2);line-height:1.7;margin-top:6px;display:-webkit-box;-webkit-line-clamp:5;-webkit-box-orient:vertical;overflow:hidden}.note-card footer{display:flex;align-items:center;gap:5px;margin-top:10px;flex-wrap:wrap}.note-card footer span,.tag-edit button{font-size:10px;border-radius:999px;background:rgba(160,108,58,.12);color:var(--accent);padding:3px 7px;font-weight:800}.note-card time{margin-left:auto;font-size:10px;color:var(--muted)}.empty{text-align:center;color:var(--muted);padding:14vh 20px}.empty strong{display:block;color:var(--ink);font-size:18px}.edit-top{border-bottom:1px solid var(--line)}.back{padding:0 12px}.save{margin-left:auto;font-size:11px;color:var(--muted);display:flex;align-items:center;gap:5px}.save i{width:7px;height:7px;border-radius:50%;background:#6eaa5d}.save i.hot{background:var(--gold)}.title{width:100%;border:0;background:transparent;outline:0;color:var(--ink);font-size:29px;font-weight:900}.meta{display:flex;gap:8px;align-items:center;margin:12px 0}.meta select{border:1px solid var(--line);background:var(--panel);color:var(--ink);border-radius:10px;padding:7px}.tag-edit{display:flex;gap:6px;overflow:auto}.body,.md{width:100%;min-height:54vh;border:0;border-top:1px dashed var(--line2);background:transparent;color:var(--ink);outline:0;padding-top:16px;font-size:15px;line-height:1.85;resize:none}.md :deep(h1){font-size:23px;border-bottom:1px dashed var(--line2);padding-bottom:6px}.md :deep(h2){font-size:19px}.md :deep(blockquote){border-left:3px solid var(--accent);padding-left:10px;color:var(--ink2)}.md :deep(code){background:rgba(160,108,58,.13);border-radius:5px;padding:1px 5px}.md :deep(.task span){display:inline-grid;place-items:center;width:16px;height:16px;border:1px solid var(--line2);border-radius:5px;margin-right:7px}.md :deep(.task.done){color:var(--muted);text-decoration:line-through}.toolbar,.ai-dock{position:absolute;left:14px;right:14px;bottom:74px;display:flex;gap:6px;overflow:auto;border:1px solid var(--line);background:rgba(251,247,236,.92);backdrop-filter:blur(10px);border-radius:15px;padding:8px;box-shadow:var(--shadow)}.toolbar button,.ai-dock button{flex:none;border:1px solid var(--line);background:var(--panel2);border-radius:10px;padding:7px 10px;font-size:12px;font-weight:900;color:var(--ink2)}.ai-dock{bottom:14px}.ai-dock span{align-self:center;font-size:10px;font-weight:900;color:var(--gold);letter-spacing:2px}.mask{position:absolute;inset:0;background:rgba(20,12,2,.45);opacity:0;pointer-events:none;transition:.22s;z-index:20}.mask.show{opacity:1;pointer-events:auto}.sheet{position:absolute;left:0;right:0;bottom:0;max-height:74%;transform:translateY(105%);transition:transform .32s cubic-bezier(.2,.9,.2,1);z-index:21;background:var(--panel);border-radius:22px 22px 0 0;border-top:1px solid var(--line2);box-shadow:0 -18px 50px rgba(0,0,0,.22);display:flex;flex-direction:column}.sheet.show{transform:translateY(0)}.grip{width:40px;height:5px;border-radius:99px;background:var(--line2);margin:10px auto}.sheet header,.sheet footer{display:flex;gap:9px;align-items:center;padding:10px 18px}.sheet header button{margin-left:auto}.out{min-height:150px;overflow:auto;padding:8px 22px 16px;white-space:pre-wrap;line-height:1.9}.sheet footer{border-top:1px solid var(--line)}.sheet button{border:1px solid var(--line);background:var(--panel2);border-radius:11px;padding:9px 12px;font-weight:900;color:var(--ink)}.sheet .primary{background:var(--accent);color:white}.toast{position:absolute;top:12px;left:50%;transform:translate(-50%,-140%);transition:.25s;z-index:30;background:var(--ink);color:var(--bg0);border-radius:999px;padding:9px 14px;font-size:12px;font-weight:900}.toast.show{transform:translate(-50%,0)}@keyframes pop{from{opacity:0;transform:translateY(10px) scale(.98)}to{opacity:1;transform:none}}
</style>
