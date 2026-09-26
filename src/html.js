import { readFileSync } from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

// katex.min.css 所在目录，其中 fonts/ 子目录包含公式所需的字体
export function getKatexDistDir() {
  return path.dirname(require.resolve('katex/dist/katex.min.css'));
}

let hljsCss = null;
function getHljsCss() {
  if (!hljsCss) {
    hljsCss = readFileSync(require.resolve('highlight.js/styles/github.min.css'), 'utf8');
  }
  return hljsCss;
}

const DEFAULT_CSS = `
:root {
  --text: #1f2328;
  --muted: #59636e;
  --border: #d1d9e0;
  --bg-subtle: #f6f8fa;
  --accent: #0969da;
}
* { box-sizing: border-box; }
html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
body {
  font-family: "Segoe UI", "Microsoft YaHei", "PingFang SC", "Noto Sans CJK SC", "Source Han Sans SC", sans-serif;
  font-size: 10.5pt;
  line-height: 1.75;
  color: var(--text);
  margin: 0;
}
h1, h2, h3, h4, h5, h6 {
  font-weight: 600;
  line-height: 1.3;
  margin: 1.4em 0 0.7em;
  break-after: avoid;
  break-inside: avoid;
}
h1 { font-size: 1.8em; margin-top: 0; padding-bottom: 0.3em; border-bottom: 1px solid var(--border); }
h2 { font-size: 1.45em; padding-bottom: 0.25em; border-bottom: 1px solid var(--border); }
h3 { font-size: 1.22em; }
h4 { font-size: 1.05em; }
p { margin: 0.55em 0; }
a { color: var(--accent); text-decoration: none; }
strong { font-weight: 600; }
blockquote {
  margin: 0.8em 0;
  padding: 0.2em 1em;
  color: var(--muted);
  border-left: 0.25em solid var(--border);
}
ul, ol { padding-left: 1.5em; }
li { margin: 0.2em 0; }
li > p { margin: 0.2em 0; }
.task-list-item { list-style: none; }
.task-list-item .task-checkbox { margin-right: 0.5em; }
code {
  font-family: Consolas, "Cascadia Code", "Courier New", "Microsoft YaHei", monospace;
  font-size: 0.9em;
  background: var(--bg-subtle);
  border-radius: 4px;
  padding: 0.15em 0.4em;
}
pre {
  background: var(--bg-subtle);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 0.8em 1em;
  margin: 0.9em 0;
  break-inside: avoid;
  overflow: visible;
}
pre code {
  display: block;
  background: none;
  padding: 0;
  font-size: 8.7pt;
  line-height: 1.65;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
table {
  border-collapse: collapse;
  margin: 1em 0;
  font-size: 0.95em;
  break-inside: avoid;
}
th, td { border: 1px solid var(--border); padding: 0.4em 0.8em; }
th { background: var(--bg-subtle); font-weight: 600; }
/* 超高图片等比缩放到一页内容区内（--img-max-height 由 convert.js 按页面格式注入），
   否则打印分页会把图片切开横跨多页；放不下当前页剩余空间时整体移到下一页 */
img {
  max-width: 100%;
  max-height: var(--img-max-height, none);
  break-inside: avoid;
}
hr { border: 0; border-top: 1px solid var(--border); margin: 1.6em 0; }
.katex { font-size: 1.06em; }
.katex-display, .math-block { margin: 0.9em 0; break-inside: avoid; }
table, pre, blockquote { break-inside: avoid; }
/* 脚注：正文中为上标链接，文末集中列出（尾注形式） */
sup.footnote-ref a { color: var(--accent); text-decoration: none; font-size: 0.8em; }
.footnotes-sep { margin: 2.5em 0 1em; }
.footnotes { font-size: 9pt; line-height: 1.6; color: var(--muted); }
.footnote-item { margin: 0.3em 0; }
.footnote-item p { display: inline; margin: 0; }
.footnote-backref { text-decoration: none; color: var(--accent); }
`;

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildHtml({ title, bodyHtml, extraCss = '' }) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<title>${escapeHtml(title)}</title>
<link rel="stylesheet" href="/assets/katex/katex.min.css">
<style>
${getHljsCss()}
</style>
<style>
${DEFAULT_CSS}
</style>
${extraCss ? `<style>\n${extraCss}\n</style>` : ''}
</head>
<body>
<article class="markdown-body">
${bodyHtml}
</article>
</body>
</html>`;
}