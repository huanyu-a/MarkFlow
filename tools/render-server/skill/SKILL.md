---
name: markflow-typeset
description: 调用 MarkFlow 渲染 API 把 Markdown 排版成公众号/长图文可用的内联样式 HTML，可再串联发布代理一键进微信公众号草稿箱。当用户要求"排版、公众号排版、渲染文章、发草稿箱"时使用。
---

# MarkFlow 排版技能

把用户素材变成排版精良的公众号 HTML。核心思路：**先取最新语法指令 → 按指令改写 Markdown → 调 API 渲染**。语法指令由服务端实时生成、与线上渲染引擎严格同步，不要凭记忆编写扩展语法。

## 服务与凭据

| 项 | 值 |
|----|-----|
| 渲染 API | `https://www.bx9y.com.cn/__markflow_render` |
| 鉴权 | 请求头 `X-Render-Token`，token 存于 `~/.zcode/secrets/markflow-render-token`（环境变量 `MARKFLOW_RENDER_TOKEN` 优先） |
| 发布草稿（可选） | `https://www.bx9y.com.cn/__markflow_wechat_publish`（需公众号 AppID/AppSecret，接口契约见 [references/publish-api.md](references/publish-api.md)） |

读取 token：`TOKEN=$(cat ~/.zcode/secrets/markflow-render-token 2>/dev/null || echo "$MARKFLOW_RENDER_TOKEN")`

## 三步工作流

**第 1 步：取语法指令（GET）**

```bash
curl -s https://www.bx9y.com.cn/__markflow_render -H "X-Render-Token: $TOKEN"
# 返回 {"ok":true,"guide":"# 长图文排版 Markdown 语法指令 ..."}
```

`guide` 是完整的公众号排版 Markdown 语法规范（标准 Markdown 规则、`> [TIP]` 提示框、`:::compare` 对比容器、`<steps>` 步骤流、`<badges>` 标签徽章、数学公式、frontmatter 元信息等）。

**第 2 步：改写并渲染（POST）**

按 `guide` 把用户素材整理成 Markdown（保留用户原意，不虚构事实），并按下方「主题色选择策略」确定主题色，然后：

```bash
curl -s -X POST https://www.bx9y.com.cn/__markflow_render \
  -H "X-Render-Token: $TOKEN" -H "Content-Type: application/json" \
  -d '{"markdown":"<整理后的 Markdown>","accent":"#27ae60","dark":"#1e8449"}'
```

返回 `{"ok":true,"html":"...","meta":{"title":"...","summary":"..."},"theme":{"accent":"...","dark":"..."},"preview":"<!DOCTYPE html>..."}`：

- `html`：全内联样式的正文片段，供程序化使用（如发布代理的 `content` 字段）
- `preview`：**交付文件用它**——包好复制按钮的完整预览页（自包含单文件，双击即可在浏览器打开）
- `meta` / `theme`：标题、摘要与实际使用的主题色，交付时向用户说明一句
- `meta.warnings`：渲染降级警告数组（如容器未闭合、语法不符被降级为普通段落、缺列行被忽略等）。无警告时该字段缺省。**交付前必须检查该字段**：非空时逐条修正 Markdown 重新渲染；确实无法修正的，向用户转述警告内容，不要静默交付。

**第 3 步：交付或发布**

- 交付：**把 `preview` 写入文件**（如 `output.html`）交给用户。预览页自带「复制全文」按钮——用户点按钮后到公众号编辑器 Ctrl+V，内联样式完整保留；「复制源码」按钮复制原始 HTML。同时附上 `meta.title` / `meta.summary` 与所用主题色，建议用户核对后再发布。不要把裸 `html` 片段当交付文件（没有复制按钮，用户不方便）。
- 发布草稿箱（可选，需用户提供公众号 AppID/AppSecret），`content` 用 `html` 字段：

```bash
curl -s -X POST https://www.bx9y.com.cn/__markflow_wechat_publish \
  -H "Content-Type: application/json" \
  -d '{"appId":"...","appSecret":"...","title":"文章标题","content":"<第 2 步的 html>","coverImageUrl":"https://.../cover.jpg"}'
```

  成功返回 `{"ok":true,"media_id":"..."}`，草稿进入公众号后台草稿箱。封面兜底规则、错误码处理、测试草稿清理见 [references/publish-api.md](references/publish-api.md)。

## 参数说明

| 字段 | 必填 | 说明 |
|------|------|------|
| `markdown` | ✅ | 按语法指令整理的 Markdown 文本，≤ 2MB |
| `accent` | 可选 | 主题主色，6 位 hex（如 `#e74c3c`）；缺省用 `#27ae60` |
| `dark` | 可选 | 主题深色，6 位 hex；只传 `accent` 时自动派生（加深 25%），都不传用默认主题 |

错误码：401 token 错误；400 JSON 非法或 markdown 为空；413 超过 2MB；500 渲染失败（返回 `error` 信息）。

## 主题色选择策略

| 场景 | 行为 |
|------|------|
| 用户指定了主题/颜色（如"用科技蓝"、"#e74c3c"） | **严格照办，不自行调整**。hex 直接传；只给颜色名或描述时，从下表就近映射成完整主题对 |
| 用户未指定 | **根据内容主题自行选择**最合适的一行主题，并在交付时说明所选主题色，便于用户纠正 |

无论哪种场景，都在交付回复中写明所用主题色。自造颜色时 accent 与 dark 必须同色系且 dark 更深；拿不准就直接用下表现成的主题对。

> 注：API 只接收 accent / dark 这一对主题色，仅复刻配色；前端完整主题档案中标题字号、引用风格、圆角等差异不会体现在 API 输出里。

### 预设主题对照表（accent / dark）

| 主题 | accent | dark | 适合内容 |
|------|--------|------|----------|
| 翡翠绿（API 缺省） | #27ae60 | #1e8449 | 健康、养生、自然、通用 |
| 科技蓝 | #0984e3 | #0769b5 | 科技、数码、互联网、AI |
| 深藏蓝 | #1e3a5f | #0f2744 | 财经、商务、职场、深度分析 |
| 靛蓝 | #667eea | #536DFE | 教育、知识科普、个人成长 |
| 商务红 | #e74c3c | #c0392b | 节日、促销、餐饮 |
| 活力橙 | #f39c12 | #e67e22 | 美食、生活方式、亲子 |
| 玫红 | #e84393 | #d63384 | 情感、女性向、美妆 |
| 薄荷绿 | #00b894 | #00a381 | 环保、旅行、轻生活 |
| 橄榄绿 | #556B2F | #3d4f1f | 历史、人文、茶文化 |
| 酒红 | #722f37 | #5a252c | 历史厚重、文化、高端品牌 |
| 紫罗兰 | #6c5ce7 | #5a4bd1 | 创意、设计、灵感 |
| 中性灰 | #888888 | #666666 | 通知、公告、极简 |
| 纯黑 | #000000 | #1a1a1a | 摄影集、极简主义、正式 |

## 限制与注意

- **mermaid 图**：API 同步渲染不支持，mermaid 代码块会降级为普通代码块。流程图请改用 `<steps>` 组件或文字描述。
- **数学公式**：含数学公式的文章发布到公众号时公式可能显示异常（公众号不支持 KaTeX 样式），建议改用截图或文字表述。
- **图片**：`img://` 本地引用不可用，图片一律用 http(s) 直链。
- **语法时效**：容器/标签语法以 GET 返回的 `guide` 为准；如果 `guide` 里没有的语法，不要发明。
- **顶格书写**：`:::` 容器与 `<标签>` 组件必须顶格书写（行首不能有任何前缀，包括 `>` 与空格缩进），不能嵌套在引用块（`>` 行）内，否则系统不识别，会当作普通文字残留。
- **实测踩坑（guide 与实现不一致的两处，2026-09-10 逐项探测确认）**：
  - 步骤流程只能用 **`<steps>` 标签**（每步一个自然段、空行分隔，步骤内不要写 `###` 小标题）。**不要用 `:::steps` 容器**——它把容器内每个自然段都拆成独立步骤，每步只是一段文字塞进直径 38px 的圆形（长文本溢出），配 `###` 时标题与正文被拆成两个这样的圆形、字面 `###` 还会留在产物里。
  - guide 第六节第 9 条称「步骤超过 3 个自动切换竖向布局（DA02）」**与实测不符**：4 步仍是 4 列各 25%、5 步仍是 5 列各 20%，**必须显式写 `<steps type="DA02">`**。
  - 标签徽章用行内写法 `<Badge type="tip" text="标签" />`（注意大写 B；type 可选 info/tip/warning/danger）。早期实测 `<badge type="tip" title="推荐" />` 渲染出的是 type 的值而不是 title，`<badge>文字</badge>` 则标签原样进正文——这两种写法都不要用。
- **诚实交付**：改写时不得添加用户素材中不存在的数据、引用或结论。
