# md2pdf 环境安装指南

## 环境要求

| 组件 | 要求 | 用途 |
|------|------|------|
| Node.js | ≥ 18（推荐 20 及以上 LTS） | 运行本工具 |
| npm | 随 Node.js 一起安装 | 安装依赖 |
| Chrome 或 Edge | 任意较新版本（二选一） | 无头渲染 PDF 的引擎 |

> 本工具在 Windows 10 + Node.js 24.19 + Chrome/Edge 环境下开发并测试通过；macOS / Linux 同样适用。

## 1. 安装 Node.js

1. 打开官网 <https://nodejs.org/>，下载 **LTS** 版本的 Windows 安装包（`.msi`）。
2. 双击安装，选项全部保持默认（安装器会自动配置 PATH）。
3. 打开新的终端（cmd / PowerShell / Git Bash 均可），验证：

```bash
node -v    # 应输出 v18.x 或更高
npm -v     # 应输出 9.x 或更高
```

如果提示“不是内部或外部命令”，关闭终端重新打开；仍不行则在“环境变量”中确认 `Path` 包含 Node.js 安装目录。

## 2. 确认浏览器

工具按以下顺序查找浏览器（任一命中即可）：

1. 命令行 `--browser <路径>` 指定的可执行文件
2. 环境变量 `MD2PDF_BROWSER` 指定的可执行文件
3. 常见位置自动探测：Chrome（Program Files / LocalAppData）→ Edge（Program Files / LocalAppData）

Windows 10/11 系统自带 Edge，通常**无需额外安装任何浏览器**。找不到时会给出明确的中文提示。

## 3. 安装本工具依赖

```bash
cd D:\tools\md2pdf
npm install
```

需要联网。如果下载缓慢，可先切换国内镜像：

```bash
npm config set registry https://registry.npmmirror.com
npm install
```

## 4. 验证安装

```bash
node bin/md2pdf.js --version     # 输出版本号即正常
node bin/md2pdf.js example.md    # 成功生成 example.pdf 说明一切就绪
```

## 5.（可选）注册全局命令

不想到项目目录下敲 `node bin/md2pdf.js` 的话，可以注册一个全局命令：

```bash
cd D:\tools\md2pdf
npm link          # 注册
```

之后在**任意目录**都能直接使用：

```bash
md2pdf 我的笔记.md
md2pdf a.md b.md -o out/        # 批量
```

取消注册：`npm unlink -g md2pdf`。

> 注意：`npm link` 建立的是指向当前目录的链接。如果移动或删除了 `D:\tools\md2pdf` 目录，需要在新的位置重新执行 `npm link`。

## 内网 / 离线环境

依赖全部是纯 JavaScript 包，没有需要编译的原生模块，可以整体搬移：

1. 在一台有网的机器上完成 `npm install`；
2. 把**整个项目目录**（包含 `node_modules`）拷贝到目标机器；
3. 目标机器只需自行安装 Node.js 和浏览器，无需再执行 `npm install`。

## 常见安装问题

| 现象 | 处理办法 |
|------|----------|
| `npm install` 报网络错误 | 切换 npmmirror 镜像（见上文）后重试 |
| `node` 不是内部或外部命令 | 重开终端，或检查 PATH 环境变量 |
| 转换时报“未找到可用的浏览器” | 安装 Chrome/Edge，或用 `--browser` / `MD2PDF_BROWSER` 指定路径 |
| 杀毒软件拦截浏览器无头启动 | 将 Chrome/Edge 加入信任列表 |