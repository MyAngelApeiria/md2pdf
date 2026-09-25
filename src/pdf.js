import puppeteer from 'puppeteer-core';
import { existsSync } from 'node:fs';

// 按优先级排列的常见安装位置（Chrome 优先，其次 Edge）
const CANDIDATES = {
  win32: [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    process.env.LOCALAPPDATA && `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`,
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    process.env.LOCALAPPDATA && `${process.env.LOCALAPPDATA}\\Microsoft\\Edge\\Application\\msedge.exe`,
  ].filter(Boolean),
  darwin: [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
  ],
  linux: [
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/usr/bin/microsoft-edge',
  ],
};

export function findBrowserPath(explicitPath) {
  const exists = (p) => (p && existsSync(p) ? p : null);
  const found =
    exists(explicitPath) ||
    exists(process.env.MD2PDF_BROWSER) ||
    (CANDIDATES[process.platform] || []).map(exists).find(Boolean);

  if (!found) {
    throw new Error(
      [
        '未找到可用的浏览器（本工具依赖本机 Chrome/Edge 渲染 PDF）。',
        '可以：',
        '  1. 安装 Chrome 或 Edge；或',
        '  2. 用 --browser <可执行文件路径> 指定浏览器；或',
        '  3. 设置环境变量 MD2PDF_BROWSER 指向浏览器可执行文件。',
      ].join('\n')
    );
  }
  return found;
}

export async function launchBrowser(executablePath) {
  return puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--font-render-hinting=none', '--disable-dev-shm-usage'],
  });
}