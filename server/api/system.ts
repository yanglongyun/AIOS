import { readBody } from '../../shared/http/readBody.ts';
import { json } from '../../shared/http/json.ts';
import { countUsers } from '../../shared/auth/repository.ts';
import { requestReload } from '../service/reload.ts';
import { completeInstall } from '../service/system/install.ts';
import { restartServerAfterResponse, runReload } from '../service/system/reload.ts';

export const handleSystemApi = async (req, res, path) => {
  if (path === '/api/system/setup' && req.method === 'GET') {
    return json(res, { success: true, initialized: countUsers() > 0 });
  }

  if (path === '/api/system/reload/request' && req.method === 'POST') {
    const body = await readBody(req);
    requestReload({
      build: body.build ?? false,
      restart: body.restart || null,
      message: body.message || ''
    });
    return json(res, { success: true });
  }

  if (path === '/api/system/install/complete' && req.method === 'POST') {
    if (countUsers() === 0) {
      return json(res, { success: false, message: '系统未初始化' }, 400);
    }

    const body = await readBody(req);
    const language = body.language === 'zh' || body.language === 'en' ? body.language : '';
    if (!language) {
      return json(res, { success: false, message: '语言不合法' }, 400);
    }

    try {
      completeInstall(language);
      return json(res, { success: true });
    } catch (e) {
      return json(res, { success: false, message: e instanceof Error ? e.message : '安装完成失败' }, 500);
    }
  }

  if (path === '/api/system/reload' && req.method === 'POST') {
    const body = await readBody(req);
    const build = body.build === true;
    const restart = body.restart === 'server' || body.restart === 'apps' || body.restart === 'both'
      ? body.restart
      : null;

    try {
      const restartServer = await runReload(build, restart);
      if (restartServer) {
        json(res, { success: true });
        await restartServerAfterResponse();
        return;
      }

      json(res, { success: true });
    } catch (e) {
      json(res, { success: false, message: e instanceof Error ? e.message : '系统重载失败' }, 500);
    }
    return;
  }

  json(res, { error: 'API endpoint not found' }, 404);
};
