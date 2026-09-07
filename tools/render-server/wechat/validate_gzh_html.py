#!/usr/bin/env python3
"""微信公众号 HTML 合规校验器。

把 SKILL.md 里"必须遵守的平台限制"从模型自觉变成确定性兜底。
排版生成后必跑：检查禁用标签/属性/样式，并核查文字节点是否用
<span leaf=""> 包裹（公众号编辑器粘贴后保持样式的关键）。

用法:
    validate_gzh_html.py <file.html>
    validate_gzh_html.py --stdin < file.html

退出码: 1 = 有 ERROR（会被公众号过滤或粘贴后样式丢失）; 0 = 通过。
"""

import argparse
import re
import sys
from html.parser import HTMLParser

# (正则, 级别, 说明) —— ERROR 会被公众号编辑器过滤掉或导致样式失效
FORBIDDEN = [
    (re.compile(r"<style[\s>]", re.I), "ERROR", "<style> 标签会被过滤，样式必须内联"),
    (re.compile(r"<script[\s>]", re.I), "ERROR", "<script> 标签会被过滤"),
    (re.compile(r"</?div[\s>]", re.I), "ERROR", "<div> 会被改写，请用 <section>"),
    (re.compile(r"<link[\s>]", re.I), "ERROR", "外部 <link>（CSS/字体）会被过滤"),
    (re.compile(r"\sclass\s*=", re.I), "ERROR", "class 属性会被剥离，请用内联 style"),
    (re.compile(r"position\s*:\s*(fixed|absolute|sticky)", re.I), "ERROR",
     "position fixed/absolute/sticky 不被支持"),
    (re.compile(r"float\s*:", re.I), "ERROR", "float 不被支持"),
    (re.compile(r"@media", re.I), "ERROR", "@media 媒体查询不被支持"),
    (re.compile(r"@keyframes", re.I), "ERROR", "@keyframes 动画不被支持"),
    (re.compile(r"@import", re.I), "ERROR", "@import 不被支持"),
    (re.compile(r"display\s*:\s*grid", re.I), "ERROR", "display:grid 不被支持，请用 flex"),
    (re.compile(r"var\s*\(\s*--", re.I), "ERROR", "CSS 变量 var(--x) 不被支持，请写死值"),
    (re.compile(r"url\s*\(\s*['\"]?https?://[^)]*\.(woff2?|ttf|otf|eot)", re.I),
     "ERROR", "外部字体不被支持"),
]

# HTML 属性使用了中文引号（「」「」“”‘’）——必须用 ASCII 双引号
# 使用 \u 转义避免字符在文件写入时被转换
#
# 关键设计：不使用固定属性白名单（style/leaf/src/...），而是扫描所有 HTML 标签内的
# 所有属性。否则遇到 cx/cy/r/stroke-linecap/stroke-linejoin/aria-*/data-* 等会漏检。
# 只在 <...> 标签文本内检测，避免把正文中的 `x=「概念」` 误判为 HTML 属性。
TAG_RE = re.compile(r"<[^>]+>", re.S)
ANY_CN_QUOTED_ATTR = re.compile(
    r"""(?ix)
    ([A-Za-z_:][-A-Za-z0-9_:.]*)   # 属性名
    \s*=\s*
    ([\u300c\u300d\u201c\u201d\u2018\u2019])  # 中文开引号
    """
)

# 中文引号配对映射（开引号 → 闭引号）
CN_QUOTE_PAIRS = {
    '\u300c': '\u300d',  # 「 → 」
    '\u300d': '\u300c',  # 」 → 「
    '\u201c': '\u201d',  # “ → ”
    '\u201d': '\u201c',  # ” → “
    '\u2018': '\u2019',  # ‘ → ’
    '\u2019': '\u2018',  # ’ → ‘
}

# 向后兼容：保留旧名称，但内部指向全属性扫描
INVALID_ATTRIBUTE_QUOTE = ANY_CN_QUOTED_ATTR


def find_cn_quoted_attrs(html):
    """检测 HTML 中所有使用中文引号的属性。

    只扫描 <...> 标签文本内部，不扫描正文——因此正文里的 `x=「概念」`
    不会被误判为 HTML 属性引号错误。

    返回 [(attr_name, quote_char), ...]，列表长度即为命中数。
    """
    hits = []
    for tag_m in TAG_RE.finditer(html):
        tag_text = tag_m.group(0)
        for m in ANY_CN_QUOTED_ATTR.finditer(tag_text):
            hits.append((m.group(1), m.group(2)))
    return hits

# 发布前必须清除的占位符和编辑锚点
PLACEHOLDER_PATTERNS = [
    (re.compile(r'\{\{[^}]+\}\}'), "模板占位符 {{...}} 残留，发布前必须替换或删除"),
    (re.compile(r'\[编辑锚点'), "编辑锚点 [编辑锚点...] 残留，发布前必须完成事实核对"),
    (re.compile(r'\bTODO\b'), "TODO 标记残留，发布前必须补完"),
    (re.compile(r'待补'), "待补标记残留，发布前必须补完"),
    (re.compile(r'需要补充'), "需要补充标记残留，发布前必须补完"),
]

CJK = re.compile(r"[一-鿿㐀-䶿]")
SKIP_TAGS = {"head", "title", "style", "script"}  # 不参与公众号正文粘贴的区域
# 中文字后紧跟半角逗号/分号/叹号/问号（应改全角）；只查"中文在前"避免中英混排误伤
HALF_PUNCT = re.compile(r"[一-鿿㐀-䶿][,;!?]")
ASCII_QUOTE = re.compile(r"[\"']")
# 代码区特征：等宽字体或 white-space:pre —— 其内半角符号是正常的
CODE_STYLE = re.compile(r"monospace|white-space\s*:\s*pre|courier|consolas|sf mono", re.I)


class LeafChecker(HTMLParser):
    """检查每个非空文本节点是否处于 <span leaf> 内。"""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack = []           # [(tag, is_leaf, is_code)]
        self.leaf_depth = 0       # 处于 span[leaf] 内的嵌套计数
        self.code_depth = 0       # 处于代码区（等宽/pre）内的嵌套计数
        self.span_leaf_count = 0  # 全文 span leaf 总数
        self.unwrapped = []       # (文本片段, 父标签) —— 未被 leaf 包裹的中文文本
        self.half_punct = []      # 正文里疑似半角标点的片段

    def handle_starttag(self, tag, attrs):
        ad = dict(attrs)
        is_leaf = tag == "span" and "leaf" in ad
        is_code = bool(CODE_STYLE.search(ad.get("style", "") or ""))
        if is_leaf:
            self.span_leaf_count += 1
            self.leaf_depth += 1
        if is_code:
            self.code_depth += 1
        self.stack.append((tag, is_leaf, is_code))

    def handle_endtag(self, tag):
        for i in range(len(self.stack) - 1, -1, -1):
            if self.stack[i][0] == tag:
                for _, was_leaf, was_code in self.stack[i:]:
                    if was_leaf:
                        self.leaf_depth -= 1
                    if was_code:
                        self.code_depth -= 1
                del self.stack[i:]
                break

    def handle_data(self, data):
        text = data.strip()
        if not text or not CJK.search(text):
            return
        if any(t in SKIP_TAGS for t, _, _ in self.stack):
            return  # <head>/<title>/<style>/<script> 内文字不进公众号正文
        if self.leaf_depth == 0:
            parent = self.stack[-1][0] if self.stack else "(root)"
            snippet = text[:24] + ("…" if len(text) > 24 else "")
            self.unwrapped.append((snippet, parent))
        if self.code_depth == 0 and (HALF_PUNCT.search(text)
                                     or ASCII_QUOTE.search(text)):
            snippet = text[:24] + ("…" if len(text) > 24 else "")
            self.half_punct.append(snippet)


def validate(html, name="<input>"):
    errors, warnings = [], []

    for rx, level, msg in FORBIDDEN:
        hits = len(rx.findall(html))
        if hits:
            (errors if level == "ERROR" else warnings).append(
                f"{msg}（命中 {hits} 处）")

    # 检查 id 属性 —— 允许脚注专用 id（fnN / fnrefN），其余 id 仍会被剥离。
    # 用 \s 前缀确保只匹配独立 id 属性，不误伤 data-mpa-action-id 等。
    id_re = re.compile(r"""\s+id\s*=\s*["']([^"']*)["']""", re.I)
    bad_ids = []
    for m in id_re.finditer(html):
        val = m.group(1).strip()
        if re.fullmatch(r"fn\d+", val) or re.fullmatch(r"fnref\d+", val):
            continue  # 脚注 id 允许
        bad_ids.append(val)
    if bad_ids:
        sample = ", ".join(bad_ids[:5])
        errors.append(
            f"id 属性会被剥离（命中 {len(bad_ids)} 处）；"
            f"仅允许脚注专用 id（fnN/fnrefN）。例：{sample}")

    # 检查内部片段链接 href="#..." —— 微信 draft/add 不接受，返回 45166
    fragment_href_re = re.compile(r'''href\s*=\s*["']\s*#''', re.I)
    fragment_hits = fragment_href_re.findall(html)
    if fragment_hits:
        examples = []
        for m in re.finditer(r'''href\s*=\s*["']([^"']*)["']''', html, re.I):
            val = m.group(1)
            if val.startswith("#"):
                examples.append(val)
        sample = ", ".join(examples[:5]) if examples else ""
        errors.append(
            f"微信 draft/add 不接受内部片段链接 href=\"#...\"，"
            f"会返回 errcode 45166 invalid content（命中 {len(fragment_hits)} 处）；"
            f"请移除 href 属性，保留可见文字。例：{sample}" if sample else
            f"微信 draft/add 不接受内部片段链接 href=\"#...\"，"
            f"会返回 errcode 45166 invalid content（命中 {len(fragment_hits)} 处）；"
            f"请移除 href 属性，保留可见文字。")

    # 检查 HTML 属性中文引号 —— 扫描所有标签内所有属性，不限于固定白名单
    quote_hits = find_cn_quoted_attrs(html)
    if quote_hits:
        # 列出前 5 个命中的属性名，方便定位
        sample = ", ".join(f"{name}={q}" for name, q in quote_hits[:5])
        errors.append(
            f"E_INVALID_ATTRIBUTE_QUOTE: HTML 属性使用了中文引号，"
            f"必须使用 ASCII 双引号（命中 {len(quote_hits)} 处）"
            f"{('，例：' + sample) if sample else ''}")

    # 检查占位符和编辑锚点
    for rx, msg in PLACEHOLDER_PATTERNS:
        hits = len(rx.findall(html))
        if hits:
            errors.append(f"{msg}（命中 {hits} 处）")

    checker = LeafChecker()
    try:
        checker.feed(html)
    except Exception as e:  # 容错：解析失败不致命，只提示
        warnings.append(f"HTML 解析中断: {e}")

    has_cjk = bool(CJK.search(html))
    if has_cjk and checker.span_leaf_count == 0:
        errors.append("全文没有任何 <span leaf=\"\"> 包裹——"
                      "粘贴到公众号后样式会大面积丢失")
    elif checker.unwrapped:
        sample = "；".join(f"「{s}」(在 <{p}> 内)"
                           for s, p in checker.unwrapped[:5])
        warnings.append(
            f"{len(checker.unwrapped)} 处中文文本未被 <span leaf> 包裹，"
            f"样式可能丢失。例：{sample}")

    if checker.half_punct:
        # 剔除固定结尾署名组件内部的半角内容（邮箱 @ . /），
        # 这些是允许的半角内容，不应触发 WARNING。
        filtered = []
        for snippet in checker.half_punct:
            if "cd.hyxc.jz@foxmail.com" in snippet:
                continue
            if "/ 作者 给自己造把锤子" in snippet:
                continue
            if "/ 投稿或反馈" in snippet:
                continue
            filtered.append(snippet)
        if filtered:
            sample = "；".join(f"「{s}」" for s in filtered[:5])
            warnings.append(
                f"{len(filtered)} 处正文疑似半角标点/英文引号，应改中文全角"
                f"（代码块内不计；固定结尾署名组件内的邮箱和 / 已豁免）。例：{sample}")

    return errors, warnings, checker.span_leaf_count


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("file", nargs="?", help="HTML 文件路径")
    ap.add_argument("--stdin", action="store_true", help="从标准输入读取")
    args = ap.parse_args()

    if args.stdin or not args.file:
        html = sys.stdin.read()
        name = "<stdin>"
    else:
        with open(args.file, encoding="utf-8", errors="replace") as f:
            html = f.read()
        name = args.file

    errors, warnings, leaf_n = validate(html, name)

    print(f"📋 公众号 HTML 合规校验: {name}")
    print(f"   span leaf 包裹: {leaf_n} 处")
    if errors:
        print(f"\n❌ ERROR ×{len(errors)}（必须修复，否则粘贴后失效）:")
        for e in errors:
            print(f"   • {e}")
    if warnings:
        print(f"\n⚠️  WARNING ×{len(warnings)}（建议检查）:")
        for w in warnings:
            print(f"   • {w}")
    if not errors and not warnings:
        print("\n✅ 完全合规，可直接粘贴到公众号编辑器")
    elif not errors:
        print("\n✅ 无致命问题，可粘贴（warning 请人工确认）")

    sys.exit(1 if errors else 0)


if __name__ == "__main__":
    main()
