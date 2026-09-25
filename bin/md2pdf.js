#!/usr/bin/env node
import path from 'node:path';
import process from 'node:process';
import { promises as fs, readFileSync } from 'node:fs';
import { findBrowserPath, launchBrowser } from '../src/pdf.js';
import { convertFile } from '../src/convert.js';

const VERSION = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).version;

const HELP = `md2pdf v${VERSION} — Markdown 转 PDF（支持 LaTeX 数学公式）

用法:
  md2pdf <输入.md> [更多.md ...] [选项]

选项:
  -o, --output <file>    输出 PDF 路径（默认与输入文件同名，扩展名 .pdf）
      --title <title>    文档标题（默认取第一个标题，用于 PDF 元数据）
      --format <format>  页面尺寸：A3 / A4 / A5 / Legal / Letter / Tabloid（默认 A4）
      --landscape        横向打印
      --css <file>       附加自定义 CSS 文件（可覆盖默认样式）
      --browser <path>   浏览器可执行文件路径（默认自动查找 Chrome / Edge）
      --no-page-numbers  不打印页脚页码
      --timeout <ms>     页面加载与打印超时（默认 60000）
  -h, --help             显示帮助
  -v, --version          显示版本

数学公式语法:
  行内公式      $E = mc^2$
  独立公式      $$\\int_0^1 x^2\\,dx$$
  公式代码块    \`\`\`math 围栏（GitHub 风格）
  常用环境      aligned / align / cases / pmatrix / bmatrix 等（KaTeX 支持）
  化学方程式    \\ce{2H2 + O2 -> 2H2O}

示例:
  md2pdf notes.md
  md2pdf paper.md -o out/paper.pdf --title "我的论文" --format A4
  md2pdf a.md b.md c.md（批量转换，输出到各自同名 .pdf）`;

function parseArgs(argv) {
  const opts = {
    inputs: [],
    output: null,
    title: null,
    format: 'A4',
    landscape: false,
    css: null,
    browser: null,
    pageNumbers: true,
    timeout: 60000,
  };

  const value = (args, i, name) => {
    const v = args[i + 1];
    if (v === undefined) throw new Error(`参数 ${name} 缺少取值`);
    return v;
  };

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    switch (a) {
      case '-h': case '--help': opts.help = true; break;
      case '-v': case '--version': opts.version = true; break;
      case '-o': case '--output': opts.output = value(argv, i++, a); break;
      case '--title': opts.title = value(argv, i++, a); break;
      case '--format': opts.format = value(argv, i++, a); break;
      case '--css': opts.css = value(argv, i++, a); break;
      case '--browser': opts.browser = value(argv, i++, a); break;
      case '--timeout': opts.timeout = Number(value(argv, i++, a)); break;
      case '--landscape': opts.landscape = true; break;
      case '--no-page-numbers': opts.pageNumbers = false; break;
      default:
        if (a.startsWith('-')) throw new Error(`未知参数：${a}（用 --help 查看用法）`);
        opts.inputs.push(a);
    }
  }

  if (!Number.isFinite(opts.timeout) || opts.timeout <= 0) {
    throw new Error('--timeout 需要一个正整数（毫秒）');
  }
  if (opts.output && opts.inputs.length > 1) {
    throw new Error('批量转换多个文件时不能使用 -o/--output 指定单一输出');
  }
  return opts;
}

function humanSize(bytes) {
  if (bytes >= 1024 * 1024) return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  return (bytes / 1024).toFixed(1) + ' KB';
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));

  if (opts.version) {
    console.log(VERSION);
    return;
  }
  if (opts.help || opts.inputs.length === 0) {
    console.log(HELP);
    process.exitCode = opts.help ? 0 : 1;
    return;
  }

  const browserPath = findBrowserPath(opts.browser);
  const browser = await launchBrowser(browserPath);

  let failed = 0;
  try {
    for (const input of opts.inputs) {
      try {
        const output = await convertFile(input, opts, browser);
        const { size } = await fs.stat(output);
        console.log(`已生成: ${output} (${humanSize(size)})`);
      } catch (err) {
        failed++;
        console.error(`转换失败: ${input}\n  ${err.message}`);
      }
    }
  } finally {
    await browser.close();
  }

  if (failed > 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error(`错误: ${err.message}`);
  process.exit(1);
});