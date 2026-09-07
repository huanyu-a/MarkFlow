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
| 发布草稿（可选） | `https://www.bx9y.com.cn/__markflow_wechat_publish`（需公众号 AppID/AppSecret，见该项目 `tools/render-server/wechat/publish_server.py`） |

读取 token：`TOKEN=$(cat ~/.zcode/secrets/markflow-render-token 2>/dev/null || echo "$MARKFLOW_RENDER_TOKEN")`

## 三步工作流

**第 1 步：取语法指令（GET）**

```bash
curl -s https://www.bx9y.com.cn/__markflow_render -H "X-Render-Token: $TOKEN"
# 返回 {"ok":true,"guide":"# 长图文排版 Markdown 语法指令 ..."}
```

`guide` 是完整的公众号排版 Markdown 语法规范（标准 Markdown 规则、`> [TIP]` 提示框、`:::compare` / `:::steps` 等容器组件、行内徽章 `<badge>`、数学公式、frontmatter 元信息等）。

**第 2 步：改写并渲染（POST）**

按 `guide` 把用户素材整理成 Markdown（保留用户原意，不虚构事实），并按下方「主题色选择策略」确定主题色，然后：

```bash
curl -s -X POST https://www.bx9y.com.cn/__markflow_render \
  -H "X-Render-Token: $TOKEN" -H "Content-Type: application/json" \
  -d '{"markdown":"<整理后的 Markdown>","accent":"#27ae60","dark":"#1e8449"}'
```

返回 `{"ok":true,"html":"<h1 ...>...</h1>","meta":{"title":"...","summary":"..."},"theme":{"accent":"#27ae60","dark":"#1e8449"}}`。`html` 为全内联样式的片段（可直接贴入公众号编辑器或存为 `.html` 文件交付）；`theme` 是实际使用的主题色，交付时向用户说明一句。

**第 3 步：交付或发布**

- 交付：把 `html` 写入文件（如 `output.html`），或附上 `meta.title` / `meta.summary` 建议用户核对。
- 发布草稿箱：POST 发布代理，字段以 `tools/render-server/wechat/publish_server.py` 为准（含 AppID/AppSecret、标题、封面等），正文即第 2 步的 `html`。

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

- **mermaid 图**：API 同步渲染不支持，mermaid 代码块会降级为普通代码块。流程图请改用 `:::steps` 组件或文字描述。
- **图片**：`img://` 本地引用不可用，图片一律用 http(s) 直链。
- **语法时效**：容器/标签语法以 GET 返回的 `guide` 为准；如果 `guide` 里没有的语法，不要发明。
- **诚实交付**：改写时不得添加用户素材中不存在的数据、引用或结论。
