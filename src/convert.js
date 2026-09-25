import path from 'node:path';
import { promises as fs } from 'node:fs';
import { renderMarkdown } from './markdown.js';
import { buildHtml, getKatexDistDir } from './html.js';
import { startStaticServer } from './server.js';

const PAGE_FORMATS = new Set(['A3', 'A4', 'A5', 'Legal', 'Letter', 'Tabloid']);

const FOOTER_TEMPLATE = `
<div style="width:100%; text-align:center; font-size:9px; color:#59636e;
            font-family:'Segoe UI','Microsoft YaHei',sans-serif;">
  <span class="pageNumber"></span> / <span class="totalPages"></span>
</div>`;

// 浏览器会在发送请求前归一化 URL 中的 ../，导致无法按文件系统语义解析相对路径，
// 因此这里在 Node 侧把图片 src 统一改写为 /md/<基于 md 目录计算好的路径>，
// 其中 ".." 以 %2E%2E 编码以避开浏览器归一化。
export function rewriteImages(html, mdDir) {
  // 匹配双引号或单引号的 src（markdown-it 输出双引号，用户手写 HTML 可能用单引号）
  return html.replace(/(<img\s[^>]*?\bsrc=(["']))([^"']*)(\2)/g, (m, pre, quote, rawSrc, post) => {
    let src = rawSrc;
    try {
      src = decodeURIComponent(src); // markdown-it 会把空格等编码为 %20 等
    } catch {
      // 已是普通文本，保持原样
    }
    // markdown-it 会把 & 转义为 &amp;（如微信图片文件名里的 &MsgID=），
    // 反转义后再匹配文件系统路径
    src = src.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    if (/^(https?:|data:|blob:|\/\/)/i.test(src)) return m;
    let fsPath = null;
    if (/^[A-Za-z]:[\\/]/.test(src)) {
      fsPath = src; // Windows 绝对路径
    } else if (/^file:\/\/\//i.test(src)) {
      fsPath = decodeURIComponent(src.replace(/^file:\/\/\//i, '')); // file:///D:/dir/x.png
    } else if (!src.startsWith('/') || process.platform === 'win32') {
      // 相对路径（含 ../ 、./ 等形式），基于 md 文件所在目录解析
      fsPath = path.resolve(mdDir, src);
    }
    if (!fsPath) return m;
    const url =
      '/md/' +
      fsPath
        .replace(/\\/g, '/')
        .split('/')
        .filter(Boolean)
        .map(encodeURIComponent)
        .join('/');
    return `${pre}${url}${post}`;
  });
}

/**
 * 将单个 Markdown 文件转换为 PDF。
 * browser 传入已启动的无头浏览器实例，便于批量转换时复用。
 */
export async function convertFile(input, opts, browser) {
  input = path.resolve(input);
  if (!PAGE_FORMATS.has(opts.format)) {
    throw new Error(`不支持的页面格式 "${opts.format}"，可选：${[...PAGE_FORMATS].join(' / ')}`);
  }

  let source;
  try {
    source = await fs.readFile(input, 'utf8');
  } catch (err) {
    throw new Error(`无法读取文件 ${input}：${err.message}`);
  }

  const { bodyHtml, firstHeading } = renderMarkdown(source);
  const title = opts.title || firstHeading || path.basename(input, path.extname(input));

  let extraCss = '';
  if (opts.css) {
    try {
      extraCss = await fs.readFile(path.resolve(opts.css), 'utf8');
    } catch (err) {
      throw new Error(`无法读取自定义样式文件 ${opts.css}：${err.message}`);
    }
  }

  const html = buildHtml({ title, bodyHtml: rewriteImages(bodyHtml, path.dirname(input)), extraCss });
  const output = path.resolve(
    opts.output || input.replace(/\.[^./\\]+$/, '') + '.pdf'
  );

  const server = await startStaticServer({
    html,
    mdDir: path.dirname(input),
    katexDir: getKatexDistDir(),
  });

  let page;
  try {
    page = await browser.newPage();
    try {
      await page.goto(`http://127.0.0.1:${server.port}/`, {
        waitUntil: 'networkidle0',
        timeout: opts.timeout,
      });
    } catch (err) {
      if (err.name === 'TimeoutError') {
        throw new Error(`页面加载超时（${opts.timeout}ms），可用 --timeout 调大，或检查文档中引用的网络图片是否可达。`);
      }
      throw err;
    }
    // 等待 KaTeX 字体就绪，避免公式字体缺失
    await page.evaluate(() => document.fonts.ready);

    const pdfOptions = {
      path: output,
      format: opts.format,
      landscape: opts.landscape,
      printBackground: true,
      displayHeaderFooter: opts.pageNumbers,
      headerTemplate: '<span></span>',
      footerTemplate: FOOTER_TEMPLATE,
      margin: { top: '18mm', bottom: '18mm', left: '16mm', right: '16mm' },
      timeout: opts.timeout,
    };

    // outline 依据各级标题生成 PDF 书签，旧版浏览器不支持时自动降级
    try {
      await page.pdf({ ...pdfOptions, outline: true });
    } catch (err) {
      if (!/outline/i.test(String(err && err.message))) throw err;
      await page.pdf(pdfOptions);
    }

    return output;
  } finally {
    if (page) await page.close().catch(() => {});
    await server.close();
  }
}