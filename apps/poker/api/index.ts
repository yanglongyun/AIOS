import type { AnyRecord } from '../../../shared/types.ts';
import { readBody } from '../../../shared/http/readBody.ts';
import { json } from '../../../shared/http/json.ts';
import { getPokerEconomy } from '../repository/economy.ts';
import { startGame } from '../service/start.ts';
import { performAction } from '../service/action.ts';
import { getGameState } from '../service/state.ts';
import { getGameList } from '../service/list.ts';

export const handlePokerApi = async (req, res, path) => {
  if (path === '/apps/poker/status' && req.method === 'GET') {
    const economy = getPokerEconomy();
    return json(res, { success: true, economy });
  }

  if (path === '/apps/poker/start' && req.method === 'POST') {
    const data = startGame() as AnyRecord;
    if (data?.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }

  if (path === '/apps/poker/action' && req.method === 'POST') {
    const body = await readBody(req);
    const id = Number(body.id || 0);
    const action = String(body.action || '');
    const data = await performAction({ id, action, req }) as AnyRecord;
    if (data?.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }

  if (path === '/apps/poker/state' && req.method === 'GET') {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const data = getGameState({ id: url.searchParams.get('id') }) as AnyRecord;
    if (data?.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }

  if (path === '/apps/poker/list' && req.method === 'GET') {
    const url = new URL(req.url, `http://${req.headers.host}`);
    return json(res, getGameList({
      page: url.searchParams.get('page'),
      pageSize: url.searchParams.get('pageSize')
    }));
  }

  return false;
};
