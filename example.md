# Markdown 转 PDF 示例文档

这是一份用于演示 **md2pdf** 功能的示例文档，涵盖中文排版、LaTeX 数学公式、表格、代码高亮等元素。

## 1. 行内公式

质能方程 $E = mc^2$ 是物理学中最著名的公式之一，其中 $c \approx 2.998 \times 10^8 \ \mathrm{m/s}$ 是真空中的光速。

欧拉公式 $e^{i\pi} + 1 = 0$ 常被誉为数学中最美的公式，它把五个基本常数联系在了一起。

## 2. 展示公式

一元二次方程 $ax^2 + bx + c = 0$（$a \ne 0$）的求根公式为：

$$x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$$

高斯积分：

$$\int_{-\infty}^{\infty} e^{-x^2} \, dx = \sqrt{\pi}$$

## 3. 多行对齐（aligned 环境）

麦克斯韦方程组的微分形式：

$$
\begin{aligned}
\nabla \cdot \mathbf{E} &= \frac{\rho}{\varepsilon_0} \\
\nabla \cdot \mathbf{B} &= 0 \\
\nabla \times \mathbf{E} &= -\frac{\partial \mathbf{B}}{\partial t} \\
\nabla \times \mathbf{B} &= \mu_0 \mathbf{J} + \mu_0 \varepsilon_0 \frac{\partial \mathbf{E}}{\partial t}
\end{aligned}
$$

## 4. 矩阵与分段函数

矩阵与向量相乘：

$$
\begin{pmatrix} a & b \\ c & d \end{pmatrix}
\begin{pmatrix} x \\ y \end{pmatrix}
=
\begin{pmatrix} ax + by \\ cx + dy \end{pmatrix}
$$

分段函数（cases 环境）：

$$
f(x) =
\begin{cases}
x^2, & x \ge 0 \\
-x, & x < 0
\end{cases}
$$

## 5. 公式代码块（GitHub 风格）

下面的公式使用 ```math 代码块书写（与 GitHub 渲染方式一致）：

```math
\sum_{n=1}^{\infty} \frac{1}{n^2} = \frac{\pi^2}{6}
```

## 6. 代码高亮

```javascript
// 快速排序
function quickSort(arr) {
  if (arr.length <= 1) return arr;
  const [pivot, ...rest] = arr;
  const left = rest.filter((x) => x < pivot);
  const right = rest.filter((x) => x >= pivot);
  return [...quickSort(left), pivot, ...quickSort(right)];
}

console.log(quickSort([5, 2, 9, 1, 7])); // [1, 2, 5, 7, 9]
```

```python
import numpy as np

def monte_carlo_pi(n: int = 1_000_000) -> float:
    """蒙特卡洛方法估算圆周率"""
    rng = np.random.default_rng()
    x, y = rng.random(n), rng.random(n)
    return 4 * np.sum(x**2 + y**2 <= 1) / n

print(monte_carlo_pi())  # ≈ 3.1416
```

## 7. 表格

| 学生 | 数学 | 物理 | 化学 |
|:-----|-----:|-----:|-----:|
| 张三 |   92 |   88 |   95 |
| 李四 |   85 |   91 |   78 |
| 王五 |   78 |   95 |   90 |

贝叶斯定理常被用于统计推断：$P(A \mid B) = \dfrac{P(B \mid A)\, P(A)}{P(B)}$

## 8. 本地图片

支持相对路径（基于 md 文件所在目录，含 `../` 上级目录）、绝对路径与 `file:///` 协议：

![md2pdf](logo.png)

## 9. 其他元素

- **粗体**、*斜体*、~~删除线~~、`行内代码`
- 化学方程式（mhchem 扩展）：$\ce{2H2 + O2 ->[\text{点燃}] 2H2O}$
- 任务列表：
  - [x] 支持 LaTeX 数学公式
  - [x] 支持中文排版
  - [ ] 支持流程图（暂未支持）

> 数学是科学的皇后，数论是数学的皇后。—— 高斯[^gauss]

---

*本文档由 md2pdf 从 Markdown 自动生成。*

[^gauss]: 卡尔·弗里德里希·高斯（1777–1855），德国数学家，被誉为"数学王子"。