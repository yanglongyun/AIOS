import { db } from '../../app_shared/db/client.js';

const SCENES = ['sunset', 'night', 'sakura', 'snow'];

export const sceneHandler = (body = {}) => {
  const scene = String(body.scene || '').trim();
  if (!scene || !SCENES.includes(scene)) {
    return { status: 400, message: `无效场景，可选：${SCENES.join(', ')}` };
  }

  db.prepare(`
    INSERT OR REPLACE INTO apps_lovehouse_settings (key, value)
    VALUES ('current_scene', ?)
  `).run(scene);

  return { success: true, currentScene: scene };
};
