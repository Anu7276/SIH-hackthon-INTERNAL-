import app from '../Authentication/src/app.js';

export default function handler(req, res) {
  const requestUrl = new URL(req.url, 'http://localhost');
  const requestedPath = requestUrl.searchParams.get('path');

  if (requestedPath) {
    requestUrl.searchParams.delete('path');
    const query = requestUrl.searchParams.toString();
    req.url = `/api/${requestedPath}${query ? `?${query}` : ''}`;
  }

  return app(req, res);
}
