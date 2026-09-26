# md2pdf — Markdown 转 PDF（支持 LaTeX 公式）

基于 Node.js 的 Markdown → PDF 命令行工具。

**特性**

- **LaTeX 数学公式**：KaTeX 渲染，支持行内 `$...$`、独立 `$$...$$`、```` ```math ```` 代码块，以及 `aligned` / `cases` / `pmatrix` 等常用环境和 `\ce{}` 化学方程式
- **中文友好**：直接使用本机中文字体（微软雅黑等），无需额外安装字体
- **本地图片**：相对路径（含 `../` 上级目录）、Windows 绝对路径、`file:///` 协议、网络图片均可嵌入
- **完整 Markdown**：GFM 表格、任务列表、脚注（`[^1]` 引用 + 文末定义）、代码高亮（highlight.js）、引用、锚点链接等
- **打印质量**：自动分页、超大图片等比压缩到一页内（不跨页切割、不大量留白）、页脚页码、标题不孤行、长代码行自动换行、按标题生成 PDF 书签
- **轻量**：复用本机已安装的 Chrome / Edge 做无头渲染，不下载 Chromium

## 安装

环境准备（Node.js ≥ 18 + Chrome/Edge）见 **[INSTALL.md](INSTALL.md)**，三步即可：

```bash
cd D:\tools\md2pdf
npm install
node bin/md2pdf.js example.md    # 转换示例文档，生成 example.pdf
```

## 命令行用法

```bash
node bin/md2pdf.js <输入.md> [更多.md ...] [选项]
```

示例：

```bash
node bin/md2pdf.js notes.md                  # 输出同目录 notes.pdf
node bin/md2pdf.js paper.md -o out/paper.pdf # 指定输出路径
node bin/md2pdf.js a.md b.md c.md            # 批量转换，各自输出同名 .pdf
node bin/md2pdf.js doc.md --landscape        # 横向 A4
```

> `npm link` 注册全局命令后（见 INSTALL.md），可省略 `node bin/` 前缀，直接 `md2pdf notes.md`。

### 参数一览

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `-o, --output <file>` | 输出 PDF 路径（仅单文件转换时可用） | 与输入同名 `.pdf` |
| `--title <title>` | 文档标题（用于 PDF 元数据） | 取第一个标题 |
| `--format <format>` | 页面尺寸：`A3` / `A4` / `A5` / `Legal` / `Letter` / `Tabloid` | `A4` |
| `--landscape` | 横向打印 | 纵向 |
| `--css <file>` | 附加自定义 CSS 文件，可覆盖默认样式 | — |
| `--browser <path>` | 指定浏览器可执行文件路径 | 自动查找 Chrome → Edge |
| `--no-page-numbers` | 不打印页脚页码 | 页码开启 |
| `--timeout <ms>` | 页面加载与打印超时 | `60000` |
| `-h, --help` | 显示帮助 | — |
| `-v, --version` | 显示版本 | — |

## 数学公式（LaTeX）语法

| 写法 | 效果 |
|------|------|
| `$E = mc^2$` | 行内公式 |
| `$$\int_0^1 x^2\,dx$$` | 独立展示公式（居中） |
| ```` ```math ```` 围栏代码块 | GitHub 风格公式块 |
| `$\ce{2H2 + O2 -> 2H2O}$` | 化学方程式（mhchem 扩展） |
| `正文中的引用[^1]` + 文末 `[^1]: 定义` | 脚注，渲染为上标编号 + 文末尾注列表 |

脚注注意两点（与 GitHub 行为一致）：

- **编号按正文中首次引用的顺序生成**，与标签写什么数字无关（`[^6]` 如果是第一个被引用的，就显示为 `[1]`）；
- **只有正文中引用过的脚注才会渲染**。定义了但从未引用的 `[^n]:` 不会出现在尾注列表里。

常用命令：`\frac`、`\sqrt`、`\sum`、`\int`、`\lim`、`\partial`、`\nabla`、`\mathbf`、`\begin{aligned}`、`\begin{cases}`、`\begin{pmatrix}` 等，完整列表见 [KaTeX 支持文档](https://katex.org/docs/supported)。

**关于美元符号**：正文中的金额（如 `$100`）通常不会误判为公式，但若同一行还有其他 `$`，请转义：

```markdown
价格是 \$100，设 $x$ 为未知数。   ← \$ 输出字面美元符
```

## 图片

| 写法 | 说明 |
|------|------|
| `![](pic.png)` | 相对路径，基于 **md 文件所在目录**（推荐） |
| `![](images/pic.png)`、`![](../assets/pic.png)` | 子目录 / 上级目录均支持 |
| `![](我的 截图.png)` | **路径含空格可直接写**（已兼容 Typora 宽松语法，无需 `<...>` 或 `%20`） |
| `![](D:/photos/pic.png)` | Windows 绝对路径（**建议用正斜杠**，反斜杠会被 Markdown 转义规则干扰） |
| `![](file:///D:/photos/pic.png)` | file 协议形式 |
| `![](https://example.com/pic.png)` | 网络图片（需可访问） |

对编辑器的兼容性做了专门处理：文件名带空格（如 Windows 截图「屏幕截图 2026-09-17.png」）、微信保存的图片（文件名含 `&` `@` 等特殊字符）、中文文件名、`<...>` 尖括号包裹、反斜杠分隔的子目录路径均可正常嵌入。

**超大图片自动适配**（始终等比缩放，不变形）：

- 高度超过一页的图片自动压缩到一页内，不会被分页切开；
- 图片放不下当前页、且当前页剩余空间超过一半时，自动压缩填满剩余空间，避免跳页留下大片空白；剩余空间不足一半时整体移到下一页（符合常规排版习惯）；
- 在手写 HTML 中显式写了 `max-height` 的图片不受影响，完全由你控制。

图片不存在时会保留替代文本并继续转换；转换前请确认路径无误。

## 自定义样式

默认打印样式在 `src/html.js` 的 `DEFAULT_CSS` 中。如需微调（字号、边距、配色等），写一个 CSS 文件用 `--css` 传入，其中的规则会**覆盖**默认值：

```css
/* bigger.css：正文字号加大 */
body { font-size: 12pt; line-height: 2; }
h1 { border-bottom: 2px solid #333; }
```

```bash
node bin/md2pdf.js doc.md --css bigger.css
```

## 项目结构

```
bin/md2pdf.js    CLI 入口（参数解析、批量调度）
src/markdown.js  Markdown 渲染（markdown-it + KaTeX + highlight.js）
src/html.js      HTML 模板与打印样式
src/server.js    127.0.0.1 临时静态服务器（供浏览器加载字体/图片）
src/pdf.js       浏览器查找与无头启动（puppeteer-core）
src/convert.js   单文件转换流程（含图片路径改写）
src/fit-images.js 超大图片分页预演与等比压缩（避免跨页切割/留白）
example.md       功能演示文档（公式/表格/代码/图片）
logo.png         示例文档引用的演示图片
```

## 常见问题

- **提示找不到浏览器**：安装 Chrome 或 Edge，或用 `--browser "C:\path\to\chrome.exe"` / 环境变量 `MD2PDF_BROWSER` 指定。
- **公式显示为红色源码**：LaTeX 语法有误，红色内容即出错位置，修正即可，不影响文档其余部分。
- **公式或表格被分页截断**：正常情况下会自动避免；超长内容（跨多页的大表格）无法完全避免，可拆分文档。
- **超长公式超出页宽**：打印模式不能横向滚动，请拆分公式、缩小变量，或使用 `--landscape`。
- **网络图片导致超时**：把 `--timeout` 调大，或将图片下载到本地用相对路径引用。