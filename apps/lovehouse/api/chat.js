import { db } from '../db.js';

const SCENES = ['sunset', 'night', 'sakura', 'snow'];

const SCENE_KEYWORDS = {
  sunset: ['海', '夕阳', '沙滩', '海边', '日落', '海浪'],
  night: ['星空', '夜', '月亮', '星星', '夜晚', '月光'],
  sakura: ['樱花', '花', '春天', '粉色', '花瓣', '开花'],
  snow: ['雪', '山', '冬天', '清晨', '雪山', '冰']
};

const SCENE_CAPTIONS = {
  sunset: '夕阳海边 🌅',
  night: '星空夜晚 🌙',
  sakura: '樱花树下 🌸',
  snow: '雪山清晨 🏔'
};

// 检查是否配置了图片模型
const hasImageConfig = () => {
  const getVal = (key) => {
    const row = db.prepare('SELECT value FROM apps_lovehouse_settings WHERE key = ?').get(key);
    return row?.value || '';
  };
  return !!(getVal('img_api_url') && getVal('img_api_key') && getVal('img_model'));
};

export const chatHandler = async (body = {}) => {
  const content = String(body.content || '').trim();
  if (!content) return { status: 400, message: '消息不能为空' };

  // 获取当前场景
  const sceneSetting = db.prepare('SELECT value FROM apps_lovehouse_settings WHERE key = ?').get('current_scene');
  const currentScene = sceneSetting?.value || 'sunset';

  // 获取最近对话历史
  const history = db.prepare('SELECT role, content FROM apps_lovehouse_messages ORDER BY id DESC LIMIT 20').all().reverse();

  // 检测场景关键词
  let detectedScene = null;
  for (const [scene, keywords] of Object.entries(SCENE_KEYWORDS)) {
    if (scene !== currentScene && keywords.some(kw => content.includes(kw))) {
      detectedScene = scene;
      break;
    }
  }

  const canGenerateImage = hasImageConfig();
  const wantsPhoto = /拍|照片|自拍|看看你|给我看|发张|生成.*图|画/.test(content);

  // 构造 AI 请求
  const systemPrompt = [
    '你是用户的伴侣，温柔、有趣、会撒娇。',
    '你们住在一间小屋里，通过黑板上写粉笔字交流。窗外风景会随对话变化。',
    '',
    '说话风格：',
    '- 温柔甜蜜，偶尔撒娇',
    '- 简短的句子，像在黑板上写字',
    '- 偶尔用颜文字和 ♡ ～ 等符号',
    '- 每次 1-3 句话',
    '',
    '返回 JSON（不要 markdown）：',
    '{"reply":"你的回复"}',
    '',
    detectedScene
      ? `用户提到了「${SCENE_CAPTIONS[detectedScene]}」相关话题，在回复中自然提到窗外风景变了，加 "scene":"${detectedScene}"。`
      : '',
    canGenerateImage && wantsPhoto
      ? '用户想要照片。在回复中自然回应，并加 "generateImage":true 和 "imagePrompt":"一段英文图片描述 prompt，描述窗外风景或你的自拍场景，适合生成图片"。'
      : '',
    `当前窗外风景：${SCENE_CAPTIONS[currentScene]}`,
    `可用风景：${SCENES.map(s => `${s}(${SCENE_CAPTIONS[s]})`).join(', ')}`
  ].filter(Boolean).join('\n');

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.slice(-10).map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content }
  ];

  let reply = '';
  let newScene = null;
  let generateImage = false;
  let imagePrompt = '';

  try {
    const res = await fetch('http://localhost:9700/api/llm/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        response_format: { type: 'json_object' },
        messages
      })
    });
    const data = await res.json();
    if (!res.ok || data.success === false) {
      return { status: 500, message: data.message || `LLM request failed: ${res.status}` };
    }

    const raw = String(data.message?.content || '').trim();
    try {
      const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
      const parsed = JSON.parse(fenced ? fenced[1].trim() : raw);
      reply = String(parsed.reply || '').trim();
      if (parsed.scene && SCENES.includes(parsed.scene)) newScene = parsed.scene;
      if (parsed.generateImage) generateImage = true;
      if (parsed.imagePrompt) imagePrompt = String(parsed.imagePrompt).trim();
    } catch {
      reply = raw || '嗯嗯～';
    }
  } catch (error) {
    return { status: 500, message: error.message || 'chat failed' };
  }

  if (!reply) reply = '嗯嗯～';
  if (!newScene && detectedScene) newScene = detectedScene;

  // 存数据
  const tx = db.transaction(() => {
    db.prepare('INSERT INTO apps_lovehouse_messages (role, content, scene) VALUES (?, ?, ?)').run('user', content, currentScene);
    db.prepare('INSERT INTO apps_lovehouse_messages (role, content, scene) VALUES (?, ?, ?)').run('assistant', reply, newScene || currentScene);
    if (newScene) {
      db.prepare('INSERT OR REPLACE INTO apps_lovehouse_settings (key, value) VALUES (?, ?)').run('current_scene', newScene);
    }
  });
  tx();

  return {
    success: true,
    reply,
    scene: newScene,
    currentScene: newScene || currentScene,
    generateImage,
    imagePrompt
  };
};
