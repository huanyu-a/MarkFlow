import type { ComponentDef } from '@engine';
import type { UnifiedComponentDef } from '@engine/editor-components/unifiedRender';
import { componentCategoryMap } from './data';

export interface ComponentExample {
  def: ComponentDef | UnifiedComponentDef;
  rendered: string;
  id: string;
}

export function getComponentCategory(id: string): string {
  return componentCategoryMap[id] || 'other';
}

/**
 * 基于渲染 HTML 的样式指纹去重
 * 提取标签结构 + style 属性作为指纹，忽略文本内容，判断两个组件视觉样式是否重复
 */
export function styleFingerprint(html: string): string {
  if (!html) return ''
  // 移除所有文本内容，只保留标签结构 + style 属性值
  return html
    .replace(/>(.*?)</gs, '><')               // 移除标签之间的文本
    .replace(/style="[^"]*"/g, (m) => {        // 保留 style 属性但移除 color 值（避免主题色差异导致误判）
      return m.replace(/\$\{[^}]+\}|var\([^)]+\)|[#][0-9a-f]{3,8}\b/gi, '')
    })
    .replace(/\s+/g, ' ')                       // 压缩空白
    .trim()
}

export function deduplicateByStyle(examples: ComponentExample[]): ComponentExample[] {
  const seen = new Map<string, number>()
  const result: ComponentExample[] = []
  for (const ex of examples) {
    const fp = styleFingerprint(ex.rendered)
    if (!fp) { result.push(ex); continue }
    const existing = seen.get(fp)
    if (existing === undefined) {
      seen.set(fp, result.length)
      result.push(ex)
    }
    // 跳过重复项（样式指纹相同）
  }
  return result
}

export function viewDef(d: ComponentDef | UnifiedComponentDef) {
  if ('spec' in d) {
    return { name: d.spec.label, tag: `:::${d.spec.name}`, example: d.spec.example || '' };
  }
  return { name: d.name, tag: `<${d.tag}>`, example: d.example || '' };
}

/**
 * 组件面板「插入 / 复制」排版模块时的片段。
 * 必须带完整 ::: 容器语法——此前曾因只填裸 body 导致插入后渲染为普通段落。
 */
export function buildLayoutSnippet(name: string, example: string): string {
  return `:::${name}\n${example}\n:::`;
}

export function parseExampleTag(example: string): { attrs: Record<string, string>; body: string } {
  const attrs: Record<string, string> = {};
  const openMatch = example.match(/^<([A-Za-z_][\w.-]*)([^>]*)>/);
  if (!openMatch) return { attrs, body: example };
  const tagName = openMatch[1];
  const attrStr = openMatch[2].trim();
  if (attrStr) {
    const attrRe = /([A-Za-z_][\w.-]*)="([^"]*)"/g;
    let m: RegExpExecArray | null;
    while ((m = attrRe.exec(attrStr))) { attrs[m[1]] = m[2]; }
  }
  const openEnd = openMatch[0].length;
  const closeTag = `</${tagName}>`;
  const closeIdx = example.lastIndexOf(closeTag);
  const body = closeIdx > openEnd ? example.slice(openEnd, closeIdx).trim() : '';
  return { attrs, body };
}
