# 发布代理接口契约（/__markflow_wechat_publish）

源码：markflow 仓库 `tools/render-server/wechat/publish_server.py`（线上部署于服务器 `/www/wwwroot/markflow-wechat-publish`，systemd 服务 `markflow-wechat`，监听 127.0.0.1:8787，nginx 反代对外）。

## 请求

```
POST https://www.bx9y.com.cn/__markflow_wechat_publish
Content-Type: application/json
```

| 字段 | 必填 | 说明 |
|------|------|------|
| `appId` | ✅ | 公众号 AppID |
| `appSecret` | ✅ | 公众号 AppSecret（仅本次请求内存使用，不落盘、不打印） |
| `title` | ✅ | 文章标题 |
| `content` | ✅ | 正文 HTML（即渲染 API 第 2 步返回的 `html`），≤ 8MB |
| `thumbMediaId` | 可选 | 已有封面素材 media_id，提供则跳过封面上传 |
| `coverImageUrl` | 可选 | 封面图 http(s) 直链；微信永久素材**仅收 jpg/png** |

**封面兜底逻辑**：`thumbMediaId` 与 `coverImageUrl` 都缺省时，服务自动取正文第一个 `<img src>` 作封面；正文一张图都没有则报错。**发布前确认正文含至少一张可直连的 jpg/png 图，或显式传 `coverImageUrl`**，webp/gif 封面会失败。

## 响应

- 成功：`{"ok": true, "media_id": "..."}`——草稿进入公众号后台「草稿箱」，`media_id` 即草稿 ID
- 失败：`{"ok": false, "error": "..."}`。**注意 HTTP 状态码恒为 200，判断成败必须看 body 的 `ok` 字段**

## 常见错误

| error 特征 | 原因与处理 |
|-----------|-----------|
| `errcode=40164` | 服务器 IP 不在公众号 IP 白名单 → 公众号后台「设置与开发 → 基本配置 → IP 白名单」添加 `152.136.49.237` |
| `errcode=40001/42001` | AppSecret 无效或已重置 → 公众号后台重置后重新提供 |
| 封面格式不支持 | 换 jpg/png 封面，或先把 webp/gif 转码 |
| `Unexpected token '<'` 类 | 命中 SPA fallback，端点未部署或路径写错 |

## 测试草稿清理

调试产生的草稿可在公众号后台手动删，或走微信接口清理：先 `POST cgi-bin/draft/batchget`（带 access_token）列出草稿，再 `POST cgi-bin/draft/delete` 按 `media_id` 删除。发布代理本身不提供删除接口。

## 安全提醒

AppSecret 是敏感凭据：仅在用户明确要求发布时请求提供；不要写入任何文件、日志、渲染请求或最终交付物。
