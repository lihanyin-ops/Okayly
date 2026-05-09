# MindWork 网站设计方案

## 设计背景
这是一个面向职场心理健康的产品落地页，目标用户是高压职场人群。设计需要传递安全感、专业性和温暖感，同时避免医疗类产品常见的冷漠感。

---

<response>
<text>
## 方案一：「有机宁静」— 日式极简主义 (Organic Minimalism)

**Design Movement**: 受日本侘寂美学（Wabi-Sabi）和北欧极简主义启发，结合有机形态

**Core Principles**:
- 不对称的留白布局，呼吸感十足
- 有机曲线取代直角，柔化视觉压力
- 文字排版作为主要视觉元素
- 克制的色彩，以纸张质感为基础

**Color Philosophy**: 以温暖的米白（#F5F0E8）为底，搭配苔藓绿（#6B7C5C）和陶土橙（#C4845A）。传递大地的稳定感与自然的治愈力。

**Layout Paradigm**: 左重右轻的不对称布局，大段留白，文字块与图像形成对话而非并列。

**Signature Elements**:
- 手绘风格的有机形状作为装饰
- 纸张纹理背景
- 细线条图标系统

**Interaction Philosophy**: 缓慢、呼吸感的动画，如涟漪扩散、叶片飘落

**Animation**: 元素以0.8s ease-in-out淡入，滚动视差效果轻微，避免突兀的弹跳

**Typography System**: 标题用 Noto Serif SC（衬线），正文用 Noto Sans SC（无衬线），形成古典与现代的对话
</text>
<probability>0.08</probability>
</response>

<response>
<text>
## 方案二：「流动光谱」— 情绪可视化设计 (Emotional Spectrum)

**Design Movement**: 受数据可视化艺术和情绪色彩心理学启发

**Core Principles**:
- 色彩作为情绪的直接表达媒介
- 流动的渐变与光晕效果模拟情绪流动
- 深色背景营造私密、安全的氛围
- 数据可视化元素展示产品核心价值

**Color Philosophy**: 深夜蓝（#0D1B2A）为底，以柔和的薰衣草紫（#B8A9C9）、薄荷绿（#88C9A1）和暖琥珀（#E8C07D）构成情绪光谱。避免使用红色，传递安全感。

**Layout Paradigm**: 全屏沉浸式滚动，每个功能区域占满视口，以渐变过渡连接。侧边固定导航点。

**Signature Elements**:
- 动态情绪色彩球（模拟APP的心情打卡）
- 流光渐变背景
- 像素心情墙预览

**Interaction Philosophy**: 鼠标移动触发光晕跟随效果，滚动触发颜色渐变过渡

**Animation**: 入场动画使用光晕扩散效果，颜色过渡使用CSS混合模式

**Typography System**: 标题用 Space Grotesk（现代几何），正文用 Source Han Sans（思源黑体），形成科技感与亲切感的平衡
</text>
<probability>0.07</probability>
</response>

<response>
<text>
## 方案三：「温柔专业」— 新医疗美学 (Neo-Medical Warmth)

**Design Movement**: 受现代心理健康品牌（Headspace、Calm）和新医疗设计趋势启发，但更具职场感

**Core Principles**:
- 专业可信赖的视觉语言，但去除冷漠的医疗感
- 温暖的中性色调搭配清晰的信息层级
- 卡片式布局展示功能模块，清晰直观
- 插画与图标系统传递产品温度

**Color Philosophy**: 以浅沙白（#FAF8F5）为底，主色调采用柔和的鼠尾草绿（#7BA99A），辅以暖米色（#E8DDD0）和深炭灰（#2C3E35）。整体低饱和度，符合PRD中对视觉设计的要求。

**Layout Paradigm**: 非对称的Z字形信息流，功能卡片以错落的网格排列，避免过于规整的感觉。

**Signature Elements**:
- 柔和的毛玻璃卡片效果
- 有机圆角形状作为装饰背景
- 功能演示的交互式预览

**Interaction Philosophy**: 卡片悬停时轻微上浮，功能区域有微妙的入场动画

**Animation**: 使用framer-motion实现流畅的滚动触发动画，卡片以交错方式依次入场

**Typography System**: 标题用 Playfair Display（优雅衬线），中文用 ZCOOL XiaoWei（站酷小薇），正文用 DM Sans + Noto Sans SC
</text>
<probability>0.09</probability>
</response>

---

## 选定方案：方案二「流动光谱」

选择理由：
- 深色背景契合PRD中"私密、安全"的产品定位
- 情绪色彩的视觉语言直接呼应产品核心功能（心情打卡）
- 沉浸式滚动体验能有效展示产品功能亮点
- 动态光晕效果在视觉上传递情绪流动的产品哲学
