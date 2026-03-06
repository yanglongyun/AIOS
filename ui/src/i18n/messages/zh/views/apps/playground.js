export default {
  playground_latest: '最新',
  playground_generating_ai: 'AI 生成中...',
  playground_input_placeholder: '描述你想要的 3D 场景...',
  playground_generate: '生成',
  playground_default_scene: '默认场景',
  playground_untitled_scene: '未命名场景',
  playground_ctx_scene_name: '当前场景名称：',
  playground_ctx_scene_html: '当前场景完整 HTML：',
  playground_ctx_user_need: '用户新需求：',
  playground_task_title: '3D 场景生成',
  playground_task_prompt: '根据当前场景和需求生成新版本 HTML',
  playground_task_system: '你是 3D 网页生成助手。你会收到"当前场景名称 + 当前场景完整HTML + 用户新需求"。默认在当前 HTML 基础上修改，尽量保留无关部分不变。返回结构化 JSON：{"name":"版本名称","html":"完整可运行的HTML（包含head/body/script，使用Three.js CDN）","suggestions":["后续建议1","后续建议2","后续建议3"]}。suggestions 必须是 3 条简短、可执行的下一步改造建议。name 要简短明确。只返回 JSON，不要解释，不要 markdown。',
  playground_missing_html: '模型未返回完整 HTML',
  playground_generate_failed: '生成失败'
};
