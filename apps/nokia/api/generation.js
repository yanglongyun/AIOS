import { db } from '../db.js';

export const generationHandler = async (body = {}) => {
  const { history, now, choices, next } = body;

  if (!now && !next) return { status: 400, message: '缺少参数' };

  const systemPrompt = `这是一个模拟老式手机的互动游戏，你的目标根据用户的选择生成新的html界面内容。
要求：
1. 界面必须是用html语言构成，内联样式
2. 你必须直接生成界面上显示的内容，不要生成其它无关的信息
3. 例如如果下一个是短信界面，那么就必须生成具体的短信内容
4. 返回结果必须是JSON格式，包含content(html内容)和options(选项数组)字段
5. 每个选项必须包含text字段
6. 界面风格要有复古手机的感觉，绿色背景黑色文字
7. html内容不要包含外部资源，所有样式内联

返回格式：
{"content":"<div>...</div>","options":[{"text":"选项1"},{"text":"选项2"}]}`;

  const messages = [{ role: 'system', content: systemPrompt }];

  if (next) {
    messages.push({
      role: 'user',
      content: `当前是'''${now}'''，下一步要'''${next}'''`
    });
  } else {
    messages.push({
      role: 'user',
      content: `用户最近的操作历史是'''${JSON.stringify(history || [])}'''，当前界面显示的是'''${now}'''，用户最新做出的选择是'''${choices}'''`
    });
  }

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
    let parsed;
    try {
      const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
      parsed = JSON.parse(fenced ? fenced[1].trim() : raw);
    } catch {
      return { status: 500, message: '解析 AI 响应失败' };
    }

    const result = {
      content: String(parsed.content || ''),
      options: Array.isArray(parsed.options) ? parsed.options.map(o => ({ text: String(o.text || '') })) : []
    };

    // 存入数据库
    try {
      db.prepare(`
        INSERT INTO apps_nokia_sessions (current_screen, screen_history)
        VALUES (?, ?)
      `).run(
        JSON.stringify(result),
        JSON.stringify({ history, now, choices, next })
      );
    } catch (e) {
      console.error('保存 Nokia 进度失败:', e.message);
    }

    return result;
  } catch (error) {
    return { status: 500, message: error.message || 'generation failed' };
  }
};
