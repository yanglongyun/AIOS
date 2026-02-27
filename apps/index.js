import { createServer } from 'http';
import { json } from './utils/json.js';

import { handleNotebookApi, initNotebookDatabase } from './notebook/index.js';
import { handleFilesApi } from './files/index.js';

const APPS_PORT = 9701;

const appsServer = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;

  if (path.startsWith('/api/apps/notebook/')) {
    const handled = await handleNotebookApi(req, res, path);
    if (handled !== false) return;
  }

  if (path.startsWith('/api/apps/files/')) {
    const handled = await handleFilesApi(req, res, path);
    if (handled !== false) return;
  }

  json(res, { success: false, message: 'Apps endpoint not found' }, 404);
});

initNotebookDatabase();

appsServer.listen(APPS_PORT, () => {
  console.log(`  > apps: http://localhost:${APPS_PORT}`);
});
