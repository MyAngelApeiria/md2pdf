// 图片路径全量回归测试：构造各种真实场景，转换后用 PyMuPDF 验证嵌入数量
// 运行：node test/images-regression.mjs
import { mkdirSync, writeFileSync, copyFileSync, rmSync, existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';

const root = path.join(os.tmpdir(), 'md2pdf-img-regression');
rmSync(root, { recursive: true, force: true });
mkdirSync(path.join(root, 'doc', 'assets'), { recursive: true });
mkdirSync(path.join(root, 'doc', 'sub2'), { recursive: true });

const logo = readFileSync(path.resolve('logo.png'));
const put = (rel) => {
  const p = path.join(root, rel);
  writeFileSync(p, logo);
  return p;
};

const WX_NAME =
  '_cgi-bin_mmwebwx-bin_webwxgetmsgimg__&MsgID=5688745657237520972&skey=@crypt_a4eb0915_620db4cb8db1e7576e56bba4f564bbe2&mmweb_appid=wx_webfilehelper.jpg';

// 测试素材
put('doc/图 1.png');
put('doc/assets/截图 2026.png');
put('doc/assets/normal.png');
put('doc/assets/normal copy.png');
put('根图.png');
put(`doc/${WX_NAME}`);
put(path.join('doc', 'sub2', '嵌套目录.png'));

const mdPath = path.join(root, 'doc', '回归.md');
writeFileSync(
  mdPath,
  [
    '# 图片路径全量回归',
    '',
    'A 同目录中文带空格: ![图1](图 1.png)',
    '',
    'B 子目录中文带空格: ![截图](./assets/截图 2026.png)',
    '',
    'C 子目录普通名: ![普通](assets/normal.png)',
    '',
    'D 上级目录: ![根图](../根图.png)',
    '',
    'E 反斜杠路径: ![嵌套](sub2\\嵌套目录.png)',
    '',
    'F 尖括号包空格: ![angle](<图 1.png>)',
    '',
    `G 微信文件名(&和@): ![微信图](${WX_NAME})`,
    '',
    'H 已编码空格: ![enc](assets/normal%20copy.png)',
    '',
    'I 带标题: ![t](assets/normal.png "标题 保留空格")',
    '',
    'J 手写HTML单引号: <img src="assets/normal.png" alt="html">',
    '',
    'K 相对引用保持不动的普通链接: [链接](图 1.png)',
    '',
    '```',
    '代码块内 ![x](a b.png) 不应被处理',
    '```',
    '',
    '公式回归: $E=mc^2$',
    '',
  ].join('\n')
);

console.log('转换中...');
const r = spawnSync(process.execPath, ['bin/md2pdf.js', mdPath], {
  cwd: process.cwd(),
  stdio: 'pipe',
  encoding: 'utf8',
});
if (r.status !== 0) {
  console.error(r.stdout, r.stderr);
  process.exit(1);
}
console.log(r.stdout.trim());

// PyMuPDF 验证
const py = spawnSync('python', ['-c', `
import fitz
d = fitz.open(r'${mdPath.replace(/\.md$/, '.pdf')}')
imgs = sum(len(p.get_image_info()) for p in d)
text = ''.join(p.get_text() for p in d)
print('IMAGE_COUNT=' + str(imgs))
print('HAS_CODE_LITERAL=' + str('a b.png' in text))
print('HAS_MATH=' + str('E = mc' in text.replace(' ', '') or 'E=mc' in text.replace(' ', '')))
`], { encoding: 'utf8' });
if (py.status !== 0) {
  console.error(py.stdout, py.stderr);
  process.exit(1);
}
const out = py.stdout.trim();
console.log(out);

const count = Number((out.match(/IMAGE_COUNT=(\d+)/) || [])[1]);
const codeOk = out.includes('HAS_CODE_LITERAL=True');
const mathOk = out.includes('HAS_MATH=True');

console.log('\n===== 结论 =====');
console.log(`期望嵌入 10 张图片（A-J），实际: ${count} ${count === 10 ? '✓' : '✗'}`);
console.log(`代码块未被处理: ${codeOk ? '✓' : '✗'}`);
console.log(`公式正常渲染: ${mathOk ? '✓' : '✗'}`);
process.exit(count === 10 && codeOk && mathOk ? 0 : 1);