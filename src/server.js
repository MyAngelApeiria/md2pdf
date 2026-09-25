import http from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import path from 'node:path';

const MIME = {
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.bmp': 'image/bmp',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
};

function sendFile(res, filePath) {
  if (!existsSync(filePath) || !statSync(filePath).isFile()) {
    res.writeHead(404);
    return res.end('Not Found');
  }
  res.writeHead(200, {
    'Content-Type': MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
  });
  const stream = createReadStream(filePath);
  stream.on('error', () => {
    if (!res.headersSent) res.writeHead(500);
    res.end();
  });
  stream.pipe(res);
}

/**
 * 启动一个仅监听 127.0.0.1 的临时静态服务器，供无头浏览器加载页面资源：
 *   /                → 渲染后的 HTML
 *   /assets/katex/*  → node_modules/katex/dist（公式字体；单文件模式下为 null，不走此路由）
 *   /md/*            → 图片等本地文件（路径由 convert.js 基于 md 目录改写而来，
 *                      形如 /md/D:/dir/x.png 的 Windows 绝对路径，或含 %2E%2E 的相对引用）
 */
export function startStaticServer({ html, mdDir, katexDir }) {
  const server = http.createServer((req, res) => {
    try {
      const { pathname } = new URL(req.url, 'http://127.0.0.1');
      const route = decodeURIComponent(pathname);

      if (req.method !== 'GET' && req.method !== 'HEAD') {
        res.writeHead(405);
        return res.end();
      }
      if (route === '/' || route === '/index.html') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        return res.end(html);
      }
      if (route.startsWith('/assets/katex/')) {
        if (!katexDir) {
          res.writeHead(404);
          return res.end('Not Found');
        }
        return sendFile(res, path.normalize(path.join(katexDir, route.slice('/assets/katex/'.length))));
      }
      if (route.startsWith('/md/')) {
        const rel = route.slice('/md/'.length);
        if (/^[A-Za-z]:[\\/]/.test(rel)) {
          return sendFile(res, path.normalize(rel));
        }
        // path.resolve 允许 ../ 形式引用 md 目录之外的本地图片；
        // 该服务只监听 127.0.0.1 且随转换结束即关闭
        return sendFile(res, path.resolve(mdDir, rel));
      }
      res.writeHead(404);
      return res.end('Not Found');
    } catch (err) {
      res.writeHead(500);
      res.end(String(err));
    }
  });

  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      resolve({
        port: server.address().port,
        close: () => new Promise((r) => server.close(r)),
      });
    });
  });
}