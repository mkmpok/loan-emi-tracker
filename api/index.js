import app from '../server/app.js';

export default function handler(req, res) {
  const routedPath = req.query?.__path;

  if (routedPath) {
    const normalizedPath = Array.isArray(routedPath) ? routedPath.join('/') : String(routedPath);
    const currentUrl = new URL(req.url, 'http://localhost');
    currentUrl.pathname = `/api/${normalizedPath}`;
    currentUrl.searchParams.delete('__path');
    req.url = `${currentUrl.pathname}${currentUrl.search}`;
  }

  return app(req, res);
}
