import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';
import { createServer } from 'node:http';

const port = Number(process.env.PORT || 5000);
const distDir = resolve(process.cwd(), 'dist');

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp',
};

const isDev = process.env.NODE_ENV === 'development';
const indexPath = join(distDir, 'index.html');
const adminIndexPath = join(distDir, 'admin', 'index.html');

const sendFile = (response, filePath) => {
  const stream = createReadStream(filePath);

  response.writeHead(200, {
    'Content-Type': mimeTypes[extname(filePath).toLowerCase()] || 'application/octet-stream',
  });

  stream.pipe(response);
  stream.on('error', () => {
    response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Server error');
  });
};

const getStaticPath = (urlPath) => {
  const decodedPath = decodeURIComponent(urlPath.split('?')[0]);
  const normalizedPath = normalize(decodedPath).replace(/^(\.\.[/\\])+/, '');
  const candidatePath = join(distDir, normalizedPath);

  if (!candidatePath.startsWith(distDir)) {
    return null;
  }

  if (existsSync(candidatePath) && statSync(candidatePath).isFile()) {
    return candidatePath;
  }

  if (existsSync(candidatePath) && statSync(candidatePath).isDirectory()) {
    const indexPath = join(candidatePath, 'index.html');
    if (existsSync(indexPath)) {
      return indexPath;
    }
  }

  return null;
};

const server = createServer((request, response) => {
  const urlPath = request.url || '/';
  const staticPath = getStaticPath(urlPath);

  if (staticPath) {
    sendFile(response, staticPath);
    return;
  }

  const fallbackCandidates = urlPath.startsWith('/admin')
    ? [adminIndexPath, indexPath]
    : [indexPath];

  const fallbackPath = fallbackCandidates.find((candidate) => existsSync(candidate));

  if (fallbackPath) {
    sendFile(response, fallbackPath);
    return;
  }

  response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  response.end(
    isDev
      ? `Missing build output. Expected one of: ${fallbackCandidates.join(', ')}`
      : 'Not found'
  );
});

server.listen(port, '0.0.0.0', () => {
  console.log(`BrandSync server running on port ${port}`);
});
