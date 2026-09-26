// 打印分页时，超过当前页剩余空间的图片会整体跳到下一页，在上一页留下大片空白；
// 超过整页高度的图片更会被直接切开、横跨多页。这里在真正打印前先“预演”一次
// 分页，量出每张图片实际会落在哪里，再决定是否等比压缩（始终保持长宽比）：
//   1. 当前页放得下             → 保持原样；
//   2. 放不下、剩余空间 ≥ 阈值   → 压缩到恰好填满本页剩余空间，避免上一页大面积留白；
//   3. 放不下、剩余空间 < 阈值   → 只把高度限制在一页以内，整体移到下一页开头。
// 预演手段：把正文临时放进等宽多栏布局——栏宽/栏高与页面内容区一致、逐栏顺序填充，
// 每一栏恰好对应打印的一页，且 break-inside / orphans / widows / 分页处边距截断等
// 规则与打印共用同一套引擎，因此栏内位置即真实分页位置，可直接测量。

// 当前页剩余空间超过内容区高度的这个比例时，压缩图片填满剩余空间而不是跳页留白
const FILL_THRESHOLD = 0.5;
const SAFETY_PX = 4; // 压缩目标预留少量余量，吸收测量与舍入误差，确保真的放得下

export async function fitImages(page, { width: W, height: H }) {
  if (!(W > 0) || !(H > 0)) return;
  await page.evaluate(
    ({ W, H, threshold, safety }) => {
      const article =
        document.querySelector('article.markdown-body') || document.body;
      const imgs = Array.from(article.querySelectorAll('img'));
      if (!imgs.length) return;

      const savedStyle = article.getAttribute('style') || '';

      // 测量态：把“最高一页”的 CSS 变量临时置为 none，让图片按自然高度参与布局，
      // 放不下的才会真实地跳栏/溢出，落点才可测。只动变量不动 max-height 属性，
      // 用户手写在内联样式里的 max-height 不受影响；已定稿图片的内联样式带
      // !important，优先级高于变量计算值，同样不受影响
      const measureStyle = document.createElement('style');
      measureStyle.textContent =
        'body.md2pdf-measuring { --img-max-height: none; }';
      document.head.appendChild(measureStyle);
      document.body.classList.add('md2pdf-measuring');

      try {
        // 先按页面内容宽度测自然流总高，估算需要多少栏（页）；每张跳页的图片
        // 最多额外占一栏，据此留余量（再外加一栏空栏，避免浮点取整少一栏）
        article.style.width = `${W}px`;
        const flowHeight = article.scrollHeight;
        const cols = Math.min(
          Math.ceil(flowHeight / H) + imgs.length + 2,
          500,
        );

        article.style.width = `${(cols + 1) * W}px`;
        article.style.height = `${H}px`;
        article.style.columnWidth = `${W}px`;
        article.style.columnCount = `${cols + 1}`;
        article.style.columnGap = '0px';
        article.style.columnFill = 'auto';

        const base = article.getBoundingClientRect();
        for (const img of imgs) {
          // 用户在手写 HTML 里显式指定了 max-height 的图片交由用户自己控制
          if (img.style.maxHeight) continue;

          const rect = img.getBoundingClientRect();
          const col = Math.round((rect.left - base.left) / W);
          // 被挤到某栏（页）顶部 = 前一页有空隙；跨栏 = 会被切开
          const pushed = col > 0 && rect.top - base.top < 2;
          const sliced = rect.bottom - base.top > H + 1 || rect.width > W + 1;
          if (!pushed && !sliced) continue; // 本页放得下

          // 探测自然落点：把高度临时降为 0，图片必然放得下而回到前文结束处，
          // 该处纵坐标即图片本该出现的位置（当前页已被占用的部分）
          img.style.setProperty('max-height', '0px', 'important');
          const naturalTop = img.getBoundingClientRect().top - base.top;
          const remaining = H - naturalTop; // 当前页剩余空间
          const cap =
            remaining >= threshold * H
              ? `${remaining - safety}px` // 压缩填满本页剩余空间
              : `${H - safety}px`; // 移到下一页，最多占满一整页
          img.style.setProperty('max-height', cap, 'important');
        }
      } finally {
        document.body.classList.remove('md2pdf-measuring');
        measureStyle.remove();
        article.setAttribute('style', savedStyle);
      }
    },
    { W, H, threshold: FILL_THRESHOLD, safety: SAFETY_PX },
  );
}
