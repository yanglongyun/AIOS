export const readBody = (req) => new Promise((resolve) => {
  let body = '';
  req.on('data', (c) => { body += c; });
  req.on('end', () => {
    try {
      resolve(JSON.parse(body || '{}'));
    } catch {
      resolve({});
    }
  });
});
