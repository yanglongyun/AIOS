import { instantTaskJson } from '../../app_shared/instantTask.js';
import { insertSession } from '../repository/generation.js';

export const generate = async ({ history, now, choices, next, req }) => {
  const systemPrompt = `这是一个模拟老式手机的互动游戏，你的目标根据用户的选择生成新的html界面内容。
要求：
1. 界面必须是用html语言构成，内联样式
2. 只生成界面上显示的实际内容，不要生成信号栏、电量、时间等装饰元素（外壳已有）
3. 例如如果下一个是短信界面，那么就必须生成具体的短信内容
4. 返回结果必须是JSON格式，包含content(html内容)和options(选项数组)字段
5. options 只允许生成 3 个选项（必须刚好3个），每个选项必须包含text字段，text要简短明确
6. 不要设置背景色，不要用绿色/黑色配色，只用纯文本内容和简单排版
7. html内容不要包含外部资源，所有样式内联
8. 字体大小用12px，行高1.6，颜色不用设置（由外部控制）

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

  const parsed = await instantTaskJson({
    app: 'nokia',
    title: '老手机界面生成',
    schema: { required: ['content', 'options'] },
    prompt: '根据上下文生成下一屏老手机界面。',
    messages,
    req
  });

  const result = {
    content: String(parsed.content || ''),
    options: Array.isArray(parsed.options) ? parsed.options.map(o => ({ text: String(o.text || '') })) : []
  };

  // 存入数据库
  try {
    insertSession({
      currentScreen: result,
      screenHistory: { history, now, choices, next }
    });
  } catch (e) {
    console.error('保存 Nokia 进度失败:', e.message);
  }

  return result;
};
