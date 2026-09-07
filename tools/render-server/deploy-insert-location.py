#!/usr/bin/env python3
# 往 bx9y vhost 的 nginx conf 中插入 /__markflow_render 反代块（幂等，可重复跑）。
import sys

P = "/www/server/panel/vhost/nginx/html_www.bx9y.com.cn.conf"
s = open(P).read()

if "__markflow_render" in s:
    print("already inserted, skip")
    sys.exit(0)

anchor = """    location = /__markflow_wechat_publish {
        proxy_pass http://127.0.0.1:8787;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        client_max_body_size 10m;
        proxy_read_timeout 120s;
    }
"""
if anchor not in s:
    print("anchor not found")
    sys.exit(1)

block = """
    # MarkFlow 渲染 API（排版 skill 用，token 鉴权在服务端）
    location = /__markflow_render {
        proxy_pass http://127.0.0.1:8788;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        client_max_body_size 10m;
        proxy_read_timeout 120s;
    }
"""
open(P, "w").write(s.replace(anchor, anchor + block, 1))
print("inserted")
