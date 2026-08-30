import React from 'react'
import type { DesignStyle } from '@/data/designPrompts'

interface StyleThumbnailProps {
  style: DesignStyle
}

/** visualTone → 背景色映射 */
const TONE_BG: Record<string, string> = {
  '极简': '#ffffff',
  '编辑': '#fafaf8',
  '科技': '#0f1117',
  '数据': '#f0f2f5',
  '温暖': '#fdf8f3',
  '代码': '#0f1115',
}

/** visualTone → 文字色 */
const TONE_TEXT: Record<string, string> = {
  '极简': '#1a1a1a',
  '编辑': '#222222',
  '科技': '#e8eaed',
  '数据': '#1f2937',
  '温暖': '#3d3929',
  '代码': '#d4d4d8',
}

/** visualTone → 次要文字色 */
const TONE_SUBTEXT: Record<string, string> = {
  '极简': '#999999',
  '编辑': '#666666',
  '科技': '#8a8f98',
  '数据': '#6b7280',
  '温暖': '#8b8570',
  '代码': '#71717a',
}

/** 根据 visualTone 返回字体族 */
const TONE_FONT: Record<string, string> = {
  '极简': 'system-ui, sans-serif',
  '编辑': 'Georgia, "Times New Roman", serif',
  '科技': 'system-ui, sans-serif',
  '数据': 'system-ui, sans-serif',
  '温暖': '"Noto Serif SC", Georgia, serif',
  '代码': '"Courier New", monospace',
}

/** 根据 visualTone 返回圆角 */
const TONE_RADIUS: Record<string, string> = {
  '极简': '4px',
  '编辑': '2px',
  '科技': '10px',
  '数据': '6px',
  '温暖': '14px',
  '代码': '6px',
}

export function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

/**
 * 校验强调色是否为安全的 CSS 颜色字面量。
 * 自定义风格的 accent 来自用户输入（十六进制文本框），会原样插入
 * generateFallbackHtml 的 style 属性与 HTML 文本上下文，必须先收敛格式。
 * 仅允许十六进制 / rgb(a) 数字形式 / CSS 命名颜色，
 * 杜绝 `"><img onerror=...>`、`red;}<script>` 等注入。
 */
export function isSafeColorValue(value: string): boolean {
  if (typeof value !== 'string') return false
  const v = value.trim()
  if (v.length === 0 || v.length > 40) return false
  // 十六进制：#RGB/#RGBA/#RRGGBB/#RRGGBBAA
  if (/^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(v)) return true
  // rgb()/rgba() 数字形式（0-255 数值或百分比，alpha 为 0-1）
  if (
    /^rgba?\(\s*\d{1,3}%?\s*,\s*\d{1,3}%?\s*,\s*\d{1,3}%?\s*(,\s*(?:0|1|0?\.\d+)\s*)?\)$/.test(
      v,
    )
  ) {
    return true
  }
  // CSS 命名颜色关键字（含 transparent/currentcolor）
  return /^[a-z]{3,25}$/i.test(v)
}

/** 强调色兜底值：非法输入时回退到主题默认色 */
const FALLBACK_ACCENT = '#6366f1'

/**
 * 生成风格的微型 HTML 预览片段。
 * 优先使用 style.previewHtml（若有），否则根据元数据自动生成。
 * 每个风格使用独有的 name + accent + description，确保缩略图互不相同。
 */
export function generateFallbackHtml(s: DesignStyle): string {
  const bg = TONE_BG[s.visualTone] || '#fff'
  const text = TONE_TEXT[s.visualTone] || '#1a1a1a'
  const sub = TONE_SUBTEXT[s.visualTone] || '#999'
  const font = TONE_FONT[s.visualTone] || 'sans-serif'
  const radius = TONE_RADIUS[s.visualTone] || '6px'
  const isDark = ['科技', '代码'].includes(s.visualTone)
  const border = isDark ? 'rgba(255,255,255,0.08)' : '#e5e5e5'
  const cardBg = isDark ? 'rgba(255,255,255,0.05)' : '#fff'

  // 取风格名中较短的部分作为标题（去掉品牌后缀），并防止 XSS
  const title = escapeHtml(s.name.split(/·|·/)[0].trim())
  const rawDesc = s.description.length > 20 ? s.description.slice(0, 20) + '…' : s.description
  const desc = escapeHtml(rawDesc)

  // 用户自定义 accent 未经校验不可直接进入 HTML 模板，先收敛为安全颜色字面量
  const accent = isSafeColorValue(s.accent) ? s.accent : FALLBACK_ACCENT

  const cardBorder = `1px solid ${border}`

  if (s.outputType === '幻灯片') {
    return `<div style="font-family:${font};background:${bg};color:${text};padding:14px;height:100%;display:flex;flex-direction:column;box-sizing:border-box;">
      <div style="height:4px;width:28%;background:${accent};border-radius:2px;margin-bottom:12px;"></div>
      <div style="font-size:16px;font-weight:700;margin-bottom:6px;line-height:1.2;">${title}</div>
      <div style="font-size:11px;color:${sub};margin-bottom:auto;">${desc}</div>
      <div style="display:flex;gap:5px;align-items:flex-end;margin-top:8px;">
        <div style="width:20%;height:12px;background:${accent};border-radius:1px;opacity:0.6;"></div>
        <div style="width:14%;height:8px;background:${accent};border-radius:1px;opacity:0.3;"></div>
        <div style="width:18%;height:10px;background:${accent};border-radius:1px;opacity:0.4;"></div>
      </div>
      <div style="display:flex;gap:4px;justify-content:flex-end;margin-top:6px;">
        <div style="width:5px;height:5px;border-radius:50%;background:${accent};"></div>
        <div style="width:5px;height:5px;border-radius:50%;background:${sub};opacity:0.3;"></div>
        <div style="width:5px;height:5px;border-radius:50%;background:${sub};opacity:0.3;"></div>
      </div>
    </div>`
  }

  if (s.outputType === '卡片') {
    return `<div style="font-family:${font};background:${bg};color:${text};padding:14px;height:100%;display:flex;flex-direction:column;box-sizing:border-box;">
      <div style="height:4px;width:100%;background:${accent};border-radius:2px;margin-bottom:10px;opacity:0.8;"></div>
      <div style="font-size:15px;font-weight:700;margin-bottom:4px;">${title}</div>
      <div style="font-size:11px;color:${sub};margin-bottom:8px;line-height:1.4;">${desc}</div>
      <div style="display:flex;gap:6px;margin-top:auto;">
        <div style="background:${accent};color:#fff;font-size:10px;padding:2px 6px;border-radius:3px;font-weight:600;">标签A</div>
        <div style="background:${isDark ? 'rgba(255,255,255,0.08)' : '#f1f1f1'};color:${text};font-size:10px;padding:2px 6px;border-radius:3px;">标签B</div>
      </div>
    </div>`
  }

  if (s.outputType === '仪表盘') {
    return `<div style="font-family:${font};background:${bg};color:${text};padding:10px;height:100%;display:flex;flex-direction:column;gap:6px;box-sizing:border-box;">
      <div style="font-size:11px;font-weight:700;padding:2px 0;border-bottom:1px solid ${border};">${title}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;flex:1;">
        <div style="background:${cardBg};border:${cardBorder};border-radius:${radius};padding:6px;display:flex;flex-direction:column;gap:3px;justify-content:center;">
          <div style="height:3px;width:50%;background:${sub};border-radius:1px;opacity:0.3;"></div>
          <div style="font-size:15px;font-weight:700;color:${accent};">128</div>
        </div>
        <div style="background:${cardBg};border:${cardBorder};border-radius:${radius};padding:6px;display:flex;flex-direction:column;gap:3px;justify-content:center;">
          <div style="height:3px;width:50%;background:${sub};border-radius:1px;opacity:0.3;"></div>
          <div style="font-size:15px;font-weight:700;color:${accent};">56%</div>
        </div>
        <div style="background:${cardBg};border:${cardBorder};border-radius:${radius};padding:6px;display:flex;flex-direction:column;gap:3px;justify-content:center;">
          <div style="height:3px;width:50%;background:${sub};border-radius:1px;opacity:0.3;"></div>
          <div style="font-size:15px;font-weight:700;color:${accent};">3.2k</div>
        </div>
      </div>
      <div style="display:flex;gap:4px;align-items:flex-end;height:32px;margin-top:4px;">
        <div style="width:12%;height:30%;background:${accent};border-radius:1px;opacity:0.3;"></div>
        <div style="width:12%;height:55%;background:${accent};border-radius:1px;opacity:0.5;"></div>
        <div style="width:12%;height:40%;background:${accent};border-radius:1px;opacity:0.4;"></div>
        <div style="width:12%;height:80%;background:${accent};border-radius:1px;opacity:0.7;"></div>
        <div style="width:12%;height:65%;background:${accent};border-radius:1px;opacity:0.6;"></div>
        <div style="width:12%;height:95%;background:${accent};border-radius:1px;opacity:0.8;"></div>
        <div style="width:12%;height:50%;background:${accent};border-radius:1px;opacity:0.5;"></div>
      </div>
    </div>`
  }

  if (s.outputType === '报告') {
    return `<div style="font-family:${font};background:${bg};color:${text};padding:12px;height:100%;display:flex;flex-direction:column;gap:6px;box-sizing:border-box;">
      <div style="font-size:9px;font-weight:600;color:${accent};text-transform:uppercase;letter-spacing:1px;">${escapeHtml(s.category.split('/')[0] || 'REPORT')}</div>
      <div style="font-size:15px;font-weight:700;line-height:1.2;">${title}</div>
      <div style="height:1px;background:${border};"></div>
      <div style="font-size:11px;color:${sub};line-height:1.4;">${desc}</div>
      <div style="display:flex;gap:6px;margin-top:auto;">
        <div style="font-size:14px;font-weight:800;color:${accent};">42%</div>
        <div style="font-size:14px;font-weight:800;color:${accent};opacity:0.6;">¥3.2M</div>
      </div>
    </div>`
  }

  if (s.outputType === '文档') {
    return `<div style="font-family:${font};background:${bg};color:${text};padding:14px 16px;height:100%;display:flex;flex-direction:column;gap:8px;box-sizing:border-box;">
      <div style="font-size:15px;font-weight:700;line-height:1.3;">${title}</div>
      <div style="font-size:11px;color:${sub};">${desc}</div>
      <div style="height:1px;background:${border};"></div>
      <div style="display:flex;flex-direction:column;gap:4px;flex:1;">
        <div style="height:3px;width:95%;background:${sub};border-radius:1px;opacity:0.15;"></div>
        <div style="height:3px;width:88%;background:${sub};border-radius:1px;opacity:0.15;"></div>
        <div style="height:3px;width:92%;background:${sub};border-radius:1px;opacity:0.12;"></div>
        <div style="height:3px;width:60%;background:${sub};border-radius:1px;opacity:0.1;"></div>
      </div>
    </div>`
  }

  // 默认：长页
  return `<div style="font-family:${font};background:${bg};color:${text};padding:14px;height:100%;display:flex;flex-direction:column;box-sizing:border-box;">
    <div style="height:4px;width:100%;background:${accent};border-radius:2px;margin-bottom:10px;opacity:0.8;"></div>
    <div style="font-size:15px;font-weight:700;margin-bottom:3px;line-height:1.2;">${title}</div>
    <div style="font-size:11px;color:${sub};margin-bottom:10px;line-height:1.4;">${desc}</div>
    <div style="display:flex;flex-direction:column;gap:4px;flex:1;">
      <div style="height:3px;width:95%;background:${sub};border-radius:1px;opacity:0.15;"></div>
      <div style="height:3px;width:88%;background:${sub};border-radius:1px;opacity:0.15;"></div>
      <div style="height:3px;width:92%;background:${sub};border-radius:1px;opacity:0.12;"></div>
      <div style="height:3px;width:70%;background:${sub};border-radius:1px;opacity:0.1;"></div>
    </div>
    <div style="display:flex;gap:6px;margin-top:10px;">
      <div style="background:${accent};color:#fff;font-size:10px;padding:2px 8px;border-radius:${radius};font-weight:600;">操作</div>
      <div style="border:1px solid ${border};font-size:10px;padding:2px 8px;border-radius:${radius};color:${sub};">详情</div>
    </div>
  </div>`
}

export const StyleThumbnail = React.memo(
  function StyleThumbnail({ style }: StyleThumbnailProps) {
    const html = style.previewHtml || generateFallbackHtml(style)

    return (
      <div className="group/thumb relative w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition-all" style={{ aspectRatio: '4/3' }}>
        {/* 缩放容器：在固定区域内渲染真实 HTML 并缩放 */}
        <div
          className="absolute inset-0 origin-top-left"
          style={{
            width: '125%',
            height: '125%',
            transform: 'scale(0.8)',
            transformOrigin: 'top left',
            pointerEvents: 'none',
          }}
        >
          <div
            dangerouslySetInnerHTML={{ __html: html }}
            style={{ width: '100%', height: '100%', overflow: 'hidden' }}
          />
        </div>
      </div>
    )
  },
  (prev, next) => {
    return (
      prev.style.id === next.style.id &&
      prev.style.name === next.style.name &&
      prev.style.accent === next.style.accent &&
      prev.style.description === next.style.description &&
      prev.style.style === next.style.style &&
      prev.style.visualTone === next.style.visualTone
    )
  }
)
