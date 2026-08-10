import app from '../Authentication/src/app.js';
import connectDB from '../Authentication/src/config/database.js';

const databaseReady = connectDB();

export default async function handler(req, res) {
  await databaseReady;
  const requestUrl = new URL(req.url, 'http://localhost');
  const requestedPath = requestUrl.searchParams.get('path');

  if (requestedPath) {
    requestUrl.searchParams.delete('path');
    const query = requestUrl.searchParams.toString();
    req.url = `/api/${requestedPath}${query ? `?${query}` : ''}`;
  }

  return app(req, res);
}
