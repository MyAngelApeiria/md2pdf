import MarkdownIt from 'markdown-it';
import anchor from 'markdown-it-anchor';
import taskLists from 'markdown-it-task-lists';
import footnote from 'markdown-it-footnote';
import texmath from 'markdown-it-texmath';
import hljs from 'highlight.js/lib/common';
// 静态导入以便打包为单文件 exe（不能用 createRequire + require，打包后没有 node_modules）
import katex from 'katex';
// mhchem 扩展：让 KaTeX 支持 \ce{...} 化学方程式
import 'katex/contrib/mhchem';

const KATEX_OPTIONS = {
  throwOnError: false, // 公式有误时以红色源码显示，而不是中断转换
  strict: false,
};

// 标题 id 保留中文字符，保证中文标题的锚点链接可用
function slugify(text) {
  return encodeURIComponent(String(text).trim().toLowerCase().replace(/\s+/g, '-'));
}

const md = new MarkdownIt({
  html: true,
  linkify: true,
  highlight(code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(code, { language: lang, ignoreIllegals: true }).value;
      } catch {
        // 高亮失败时回退为纯文本
      }
    }
    return ''; // 交给 markdown-it 自行转义
  },
});

md.use(anchor, { slugify });
md.use(taskLists, { enabled: false });
md.use(footnote);

// markdown-it 默认禁止 file:/data: 协议链接（防不可信文档）。
// 本工具只处理用户自己的本地文件，放行 file: 与 data:image:，仍拦截脚本类协议。
md.validateLink = (url) => !/^(javascript|vbscript):/i.test(url.trim());

// texmath 的 $ 定界规则先于 markdown-it 自身的转义规则执行，导致 \$ 失效。
// 这里注册一个更早执行的规则拦截 \$，保证它能输出字面美元符号。
// 行内代码中的 \$ 不受影响（反引号规则会整体吞掉代码段，不会进入这里）。
function dollarLiteral(state, silent) {
  const { pos, posMax } = state;
  if (pos + 1 >= posMax || state.src[pos] !== '\\' || state.src[pos + 1] !== '$') {
    return false;
  }
  if (!silent) {
    state.push('text', '', 0).content = '$';
  }
  state.pos = pos + 2;
  return true;
}
md.inline.ruler.before('escape', 'dollar_literal', dollarLiteral);

md.use(texmath, {
  engine: katex,
  delimiters: 'dollars', // 行内 $...$，独立 $$...$$
  katexOptions: KATEX_OPTIONS,
});

// GitHub 风格的 ```math 代码块 → 独立公式
const defaultFence = md.renderer.rules.fence;
md.renderer.rules.fence = (tokens, idx, options, env, self) => {
  const token = tokens[idx];
  if (token.info.trim().toLowerCase() === 'math') {
    return `<div class="math-block">${katex.renderToString(token.content, {
      displayMode: true,
      ...KATEX_OPTIONS,
    })}</div>`;
  }
  return defaultFence(tokens, idx, options, env, self);
};

// 打印为 PDF 时浏览器对复选框控件的状态渲染不可靠，换成字符更稳妥
function replaceCheckboxes(html) {
  return html.replace(/<input\s[^>]*type="checkbox"[^>]*>/g, (tag) => {
    const checked = tag.includes('checked');
    return `<span class="task-checkbox${checked ? ' is-checked' : ''}">${checked ? '☑' : '☐'}</span>`;
  });
}

// CommonMark 规定链接目标含空格时必须写成 <...> 或 %20，但 Typora 等编辑器
// 宽容处理，从这些编辑器来的文档（如 Windows 截图"屏幕截图 2026-09-17.png"）
// 会因裸空格而整段不被解析为图片。这里在解析前把目标中的空格编码为 %20。
function encodeSpacesInDestinations(source) {
  const lines = source.split('\n');
  let inFence = false;
  const destRe = /(!?\[[^\]]*\]\()([^)\n]*?)(\s*)(\))/g;

  return lines
    .map((line) => {
      if (/^\s*(```|~~~)/.test(line)) {
        inFence = !inFence; // 围栏代码块内的内容保持原样
        return line;
      }
      if (inFence) return line;
      return line.replace(destRe, (m, open, dest, ws, close) => {
        if (!dest.includes(' ') || dest.startsWith('<')) return m;
        // 目标可能带标题部分（如 path.png "标题"），标题里的空格不编码
        const titleMatch = dest.match(/(\s+)("[^"]*"|'[^']*')$/);
        const path = titleMatch ? dest.slice(0, titleMatch.index) : dest;
        const title = titleMatch ? dest.slice(titleMatch.index) : '';
        if (!path.includes(' ')) return m;
        return `${open}${path.replace(/ /g, '%20')}${title}${ws}${close}`;
      });
    })
    .join('\n');
}

export function renderMarkdown(source) {
  source = encodeSpacesInDestinations(source);
  const bodyHtml = replaceCheckboxes(md.render(source));

  // 取第一个标题作为文档标题（用于 PDF 元数据）
  const tokens = md.parse(source, {});
  let firstHeading = null;
  for (let i = 0; i < tokens.length - 1; i++) {
    if (tokens[i].type === 'heading_open') {
      firstHeading = tokens[i + 1].content
        .replace(/[*_`$]/g, '')
        .trim() || null;
      break;
    }
  }

  return { bodyHtml, firstHeading };
}