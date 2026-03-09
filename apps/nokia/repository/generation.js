import { db } from './client.js';

export const insertSession = ({ currentScreen, screenHistory }) => {
  db.prepare(`
    INSERT INTO apps_nokia_sessions (current_screen, screen_history)
    VALUES (?, ?)
  `).run(
    JSON.stringify(currentScreen),
    JSON.stringify(screenHistory)
  );
};
