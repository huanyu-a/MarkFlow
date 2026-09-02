#!/usr/bin/env python3
"""MarkFlow 微信公众号草稿箱发布端点（同源代理服务）

前端「发布到草稿箱」按钮 POST 本服务：
    POST /__markflow_wechat_publish
    {"appId","appSecret","thumbMediaId","coverImageUrl","title","content"}
返回：
    {"ok":true,"media_id":"..."} 或 {"ok":false,"error":"..."}

安全约定：
    - appId/appSecret 仅本次请求内存使用，不打印、不写日志、不落盘
    - 仅接受同源站点（www.bx9y.com.cn）发起的请求
    - 请求体上限 8MB；仅暴露本机回环地址，由 nginx 反代对外
"""
import json
import os
import re
import sys
import urllib.parse
import urllib.request
import uuid
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

LISTEN_HOST = "127.0.0.1"
LISTEN_PORT = 8787
PATH = "/__markflow_wechat_publish"
MAX_BODY = 8 * 1024 * 1024
ALLOWED_ORIGIN_HOSTS = {"www.bx9y.com.cn", "bx9y.com.cn"}

TOKEN_URL = "https://api.weixin.qq.com/cgi-bin/token"
MATERIAL_ADD_URL = "https://api.weixin.qq.com/cgi-bin/material/add_material"
DRAFT_ADD_URL = "https://api.weixin.qq.com/cgi-bin/draft/add"

IMG_RE = re.compile(r'<img[^>]+src=["\']([^"\']+)["\']', re.I)


def log(msg):
    sys.stdout.write(msg + "\n")
    sys.stdout.flush()


def http_json(url, payload=None, timeout=60):
    data = None if payload is None else json.dumps(payload, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(url, data=data, method="POST" if data is not None else "GET")
    if data is not None:
        req.add_header("Content-Type", "application/json; charset=utf-8")
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        # 微信部分接口返回 text/plain，必须显式 UTF-8 解码
        return json.loads(resp.read().decode("utf-8"))


def wechat_error(resp, fallback):
    errcode = resp.get("errcode")
    errmsg = resp.get("errmsg", "")
    if errcode == 40164:
        return f"IP 不在公众号白名单（{errmsg}）。请到公众号后台「设置与开发 → 基本配置 → IP白名单」添加服务器公网 IP"
    if errcode in (40001, 42001):
        return f"AppID/AppSecret 无效或已重置（{errcode}）：{errmsg}"
    return f"{fallback}（errcode={errcode}）：{errmsg}"


def get_access_token(app_id, app_secret):
    url = f"{TOKEN_URL}?grant_type=client_credential&appid={urllib.parse.quote(app_id)}&secret={urllib.parse.quote(app_secret)}"
    with urllib.request.urlopen(url, timeout=30) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    if "access_token" not in data:
        raise PublishError(wechat_error(data, "获取 access_token 失败"))
    return data["access_token"]


def download_image(url):
    if not re.match(r"^https?://", url):
        raise PublishError("封面图地址必须是 http(s) 链接")
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        data = resp.read(20 * 1024 * 1024)
        ctype = (resp.headers.get("Content-Type") or "").split(";")[0].strip().lower()
    if ctype not in ("image/jpeg", "image/jpg", "image/png"):
        # 微信永久素材仅支持 jpg/png，webp 等需转码，这里直接报错
        raise PublishError(f"封面图格式不支持（{ctype or '未知'}）：微信仅接受 jpg/png，请更换封面图")
    ext = "png" if "png" in ctype else "jpg"
    return data, ext


def upload_material(token, image, ext):
    boundary = uuid.uuid4().hex
    filename = f"cover.{ext}"
    part = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="media"; filename="{filename}"\r\n'
        f"Content-Type: image/{'png' if ext == 'png' else 'jpeg'}\r\n\r\n"
    ).encode("utf-8")
    body = part + image + f"\r\n--{boundary}--\r\n".encode("utf-8")
    req = urllib.request.Request(
        MATERIAL_ADD_URL + "?access_token=" + token,
        data=body,
        method="POST",
    )
    req.add_header("Content-Type", f"multipart/form-data; boundary={boundary}")
    with urllib.request.urlopen(req, timeout=60) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    if "media_id" not in data:
        raise PublishError(wechat_error(data, "上传封面素材失败"))
    return data["media_id"]


def add_draft(token, title, html, thumb_media_id):
    payload = {
        "articles": [
            {
                "title": title,
                "content": html,
                "thumb_media_id": thumb_media_id,
                "need_open_comment": 0,
                "only_fans_can_comment": 0,
            }
        ]
    }
    data = http_json(DRAFT_ADD_URL + "?access_token=" + token, payload)
    if "media_id" not in data:
        raise PublishError(wechat_error(data, "创建草稿失败"))
    return data["media_id"]


class PublishError(Exception):
    pass


class Handler(BaseHTTPRequestHandler):
    server_version = "MarkFlowWechatPublish/1.0"

    def log_message(self, fmt, *args):
        log("[access] " + fmt % args)

    def _send(self, code, obj):
        body = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        self._send(405, {"ok": False, "error": "仅支持 POST"})

    def do_POST(self):
        try:
            self._handle_post()
        except PublishError as e:
            log("[publish] fail: " + str(e)[:200])
            self._send(200, {"ok": False, "error": str(e)})
        except Exception as e:
            log("[publish] error: " + repr(e)[:300])
            self._send(200, {"ok": False, "error": "发布服务内部错误，请稍后重试"})

    def _handle_post(self):
        if self.path != PATH:
            self._send(404, {"ok": False, "error": "未知路径"})
            return

        origin = self.headers.get("Origin") or ""
        if origin:
            try:
                host = re.sub(r"^https?://", "", origin).split("/")[0].split(":")[0]
            except Exception:
                host = ""
            if host not in ALLOWED_ORIGIN_HOSTS:
                self._send(403, {"ok": False, "error": "不允许的来源"})
                return

        length = int(self.headers.get("Content-Length") or 0)
        if length <= 0 or length > MAX_BODY:
            self._send(400, {"ok": False, "error": "请求体为空或超过大小限制"})
            return
        try:
            body = json.loads(self.rfile.read(length).decode("utf-8"))
        except Exception:
            self._send(400, {"ok": False, "error": "请求体不是合法 JSON"})
            return

        app_id = (body.get("appId") or "").strip()
        app_secret = (body.get("appSecret") or "").strip()
        title = (body.get("title") or "").strip()
        html = body.get("content") or ""
        if not app_id or not app_secret:
            self._send(200, {"ok": False, "error": "缺少 AppID / AppSecret"})
            return
        if not title or not html.strip():
            self._send(200, {"ok": False, "error": "缺少标题或正文内容"})
            return

        token = get_access_token(app_id, app_secret)

        thumb = (body.get("thumbMediaId") or "").strip()
        if not thumb:
            cover_url = (body.get("coverImageUrl") or "").strip()
            if not cover_url:
                m = IMG_RE.search(html)
                if not m:
                    raise PublishError("未提供封面：请先在正文中插入图片，或在设置中填写封面图链接")
                cover_url = m.group(1)
            image, ext = download_image(cover_url)
            thumb = upload_material(token, image, ext)

        media_id = add_draft(token, title, html, thumb)
        log(f"[publish] ok: title={title[:40]!r} len={len(html)}")
        self._send(200, {"ok": True, "media_id": media_id})


if __name__ == "__main__":
    log(f"listening on {LISTEN_HOST}:{LISTEN_PORT}{PATH}")
    ThreadingHTTPServer((LISTEN_HOST, LISTEN_PORT), Handler).serve_forever()
