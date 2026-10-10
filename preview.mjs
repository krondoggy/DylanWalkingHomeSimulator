import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { dirname, extname, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const port = 4174;
const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg'
};

function reply(response, status, message, headOnly = false) {
  response.writeHead(status, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  response.end(headOnly ? undefined : message);
}

const server = createServer(async (request, response) => {
  const headOnly = request.method === 'HEAD';
  if (request.method !== 'GET' && !headOnly) {
    response.setHeader('Allow', 'GET, HEAD');
    reply(response, 405, 'Method not allowed.');
    return;
  }

  let pathname;
  try {
    // Decode before resolving so encoded slashes and Windows separators are checked.
    pathname = decodeURIComponent((request.url || '/').split('?')[0]);
  } catch {
    reply(response, 400, 'Malformed URL.', headOnly);
    return;
  }

  if (pathname.includes('\0')) {
    reply(response, 400, 'Malformed URL.', headOnly);
    return;
  }

  const requestedPath = pathname === '/' ? 'index.html' : pathname.replace(/^[\\/]+/, '');
  const filePath = resolve(root, requestedPath);
  const fromRoot = relative(root, filePath);
  if (fromRoot === '..' || fromRoot.startsWith(`..${sep}`) || isAbsolute(fromRoot)) {
    reply(response, 403, 'Path is outside the project.', headOnly);
    return;
  }

  try {
    const info = await stat(filePath);
    if (!info.isFile()) {
      reply(response, 404, 'File not found.', headOnly);
      return;
    }
    response.writeHead(200, {
      'Content-Type': mimeTypes[extname(filePath).toLowerCase()] || 'application/octet-stream',
      'Content-Length': info.size,
      'Cache-Control': 'no-store'
    });
    if (headOnly) {
      response.end();
      return;
    }
    const stream = createReadStream(filePath);
    stream.on('error', () => response.destroy());
    response.on('close', () => stream.destroy());
    stream.pipe(response);
  } catch (error) {
    reply(response, error.code === 'EACCES' ? 403 : 404, 'File not found.', headOnly);
  }
});

server.on('error', (error) => {
  console.error(`Preview server failed: ${error.message}`);
  process.exitCode = 1;
});

server.listen(port, '127.0.0.1', () => {
  console.log(`D.W.H.S. is ready at http://127.0.0.1:${port}/`);
});
