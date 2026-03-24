import { db } from './client.ts';

export const insertSession = ({ currentScreen, screenHistory }) => {
  db.prepare(`
    INSERT INTO banana_sessions (current_screen, screen_history)
    VALUES (?, ?)
  `).run(
    JSON.stringify(currentScreen),
    JSON.stringify(screenHistory)
  );
};
