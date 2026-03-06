export default {
  playground_latest: 'Latest',
  playground_generating_ai: 'AI is generating...',
  playground_input_placeholder: 'Describe the 3D scene you want...',
  playground_generate: 'Generate',
  playground_default_scene: 'Default Scene',
  playground_untitled_scene: 'Untitled Scene',
  playground_ctx_scene_name: 'Current scene name: ',
  playground_ctx_scene_html: 'Current scene full HTML:',
  playground_ctx_user_need: 'User request: ',
  playground_task_title: '3D Scene Generation',
  playground_task_prompt: 'Generate a new HTML version based on current scene and request',
  playground_task_system: 'You are a 3D webpage generation assistant. You receive "current scene name + full current scene HTML + user request". Modify on top of current HTML by default and preserve unrelated parts whenever possible. Return structured JSON: {"name":"version name","html":"full runnable HTML (including head/body/script, using Three.js CDN)","suggestions":["next suggestion 1","next suggestion 2","next suggestion 3"]}. suggestions must contain exactly 3 short actionable ideas. name must be concise and clear. Return JSON only, no explanation, no markdown.',
  playground_missing_html: 'Model did not return complete HTML',
  playground_generate_failed: 'Generation failed'
};
