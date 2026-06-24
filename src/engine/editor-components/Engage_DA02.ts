/**
 * Engage_DA02 — 彩色图标版底部互动卡片
 *
 * 语法:
 *   <engage title="感谢你的阅读与支持！" subtitle="喜欢就互动一下吧～ 💚" color="green" />
 *
 * 属性:
 *   title     — 主标题（默认"感谢你的阅读与支持！"）
 *   subtitle  — 副标题（默认"喜欢就互动一下吧～ 💚"）
 *   color     — 主题色 red|green|yellow（默认 green）
 */
export const Engage_DA02 = {
  id: 'Engage_DA02',
  tag: 'engage',
  name: '底部引导卡片',
  icon: '💬',
  example: `<engage type="DA02" title="感谢你的阅读与支持！" subtitle="喜欢就互动一下吧～ 💚" color="red|green|yellow"></engage>`,
  attrs: [
    { key: 'title', label: '主标题文字', required: false, default: '感谢你的阅读与支持！' },
    { key: 'subtitle', label: '副标题文字', required: false, default: '喜欢就互动一下吧～ 💚' },
    {
      key: 'color',
      label: '主题色',
      required: false,
      default: 'red|green|yellow',
      options: [
        'green',
        'red',
        'yellow',
        'blue',
        'purple',
        'orange',
        'pink',
        'teal',
        'gray',
        '其他十六进制颜色',
      ],
    },
  ],
  render(attrs: Record<string, string> = {}, _body: string = '', _t: unknown = ''): string {
    const title = attrs.title || '感谢你的阅读与支持！'
    const subtitle = attrs.subtitle || '喜欢就互动一下吧～ 💚'
    const colors = parseColors(attrs.color)

    return `
<section style="margin:24px 0;padding:0;position:relative;">
    <section style="background:linear-gradient(135deg,${colors[0].bgLight} 0%,${colors[1].bgLight} 50%,${colors[2].bgLight} 100%);border-radius:16px;padding:24px 16px 20px;position:relative;overflow:hidden;border:1px dashed rgba(229,231,235,0.9);">

    <!-- 标题区域 -->
    <section style="text-align:center;margin-bottom:20px;">
      <section style="font-size:18px;font-weight:700;color:#333;letter-spacing:1px;line-height:1.5;">${title}</section>
      <section style="font-size:13px;color:#888;margin-top:4px;">${subtitle}</section>
    </section>

        <!-- 三列图标区域 -->
    <section style="display:flex;justify-content:center;align-items:flex-start;gap:0;">

      <!-- 点赞 -->
      <section style="flex:1;text-align:center;padding:0 6px;">
        <section style="width:48px;height:48px;border-radius:50%;background:#fff;margin:0 auto 10px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px ${colors[0].glow};">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="${colors[0].icon}" xmlns="http://www.w3.org/2000/svg"><path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"/></svg>
        </section>
        <section style="font-size:15px;font-weight:700;color:${colors[0].icon};margin-bottom:3px;letter-spacing:2px;">
          <span style="opacity:0.5;">·</span> 点赞 <span style="opacity:0.5;">·</span>
        </section>
        <section style="font-size:11px;color:#999;margin-bottom:6px;">喜欢就点个赞吧</section>
        <section style="width:24px;height:2px;border-radius:2px;background:${colors[0].icon};margin:0 auto;opacity:0.5;"></section>
      </section>

      <!-- 转发（中间列，左右虚线边框做分隔） -->
      <section style="flex:1;text-align:center;padding:0 6px;border-left:1px dashed #e0e0e0;border-right:1px dashed #e0e0e0;">
        <section style="width:48px;height:48px;border-radius:50%;background:#fff;margin:0 auto 10px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px ${colors[1].glow};">
          <svg viewBox="0 0 24 24" width="28" height="28" fill="${colors[1].icon}" xmlns="http://www.w3.org/2000/svg"><path d="M21 12l-7-7v4C7 10 4 15 3 20c2.5-3.5 6-5.1 11-5.1V19l7-7z"/></svg>
        </section>
        <section style="font-size:15px;font-weight:700;color:${colors[1].icon};margin-bottom:3px;letter-spacing:2px;">
          <span style="opacity:0.5;">·</span> 转发 <span style="opacity:0.5;">·</span>
        </section>
        <section style="font-size:11px;color:#999;margin-bottom:6px;">分享给更多朋友</section>
        <section style="width:24px;height:2px;border-radius:2px;background:${colors[1].icon};margin:0 auto;opacity:0.5;"></section>
      </section>

      <!-- 推荐 -->
      <section style="flex:1;text-align:center;padding:0 6px;">
        <section style="width:48px;height:48px;border-radius:50%;background:#fff;margin:0 auto 10px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px ${colors[2].glow};">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="${colors[2].icon}" xmlns="http://www.w3.org/2000/svg"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
        </section>
        <section style="font-size:15px;font-weight:700;color:${colors[2].icon};margin-bottom:3px;letter-spacing:2px;">
          <span style="opacity:0.5;">·</span> 推荐 <span style="opacity:0.5;">·</span>
        </section>
        <section style="font-size:11px;color:#999;margin-bottom:6px;">推荐给身边的人</section>
        <section style="width:24px;height:2px;border-radius:2px;background:${colors[2].icon};margin:0 auto;opacity:0.5;"></section>
      </section>

    </section>
  </section>
</section>`
  },
}

interface ColorItem {
  icon: string
  bg: string
  glow: string
  bgLight: string
}

function hexToRgba(hex: string, alpha: number): string {
  hex = hex.replace('#', '')
  if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

function resolveColor(raw: string): string | null {
  const palettes: Record<string, string> = {
    red: '#e8636f',
    green: '#5fa55a',
    yellow: '#f3c885',
    blue: '#5b8dd9',
    purple: '#9b6fc3',
    orange: '#e8943a',
    pink: '#e87ba4',
    teal: '#4db8a0',
    gray: '#888888',
  }
  const key = raw.trim().toLowerCase()
  if (palettes[key]) return palettes[key]
  if (/^#?[0-9a-f]{3,6}$/i.test(raw.trim())) {
    return raw.trim().startsWith('#') ? raw.trim() : '#' + raw.trim()
  }
  return null
}

function makeColorSet(hex: string): ColorItem {
  return {
    icon: hex,
    bg: hexToRgba(hex, 0.1),
    glow: hexToRgba(hex, 0.15),
    bgLight: hexToRgba(hex, 0.05),
  }
}

function parseColors(raw: string | undefined): ColorItem[] {
  const defaultSets: ColorItem[] = [
    makeColorSet('#e8636f'),
    makeColorSet('#5fa55a'),
    makeColorSet('#f3c885'),
  ]
  if (!raw) return defaultSets
  const parts = raw.split('|').map((s) => s.trim())
  if (parts.length === 1) {
    const hex = resolveColor(parts[0])
    if (!hex) return defaultSets
    const c = makeColorSet(hex)
    return [c, c, c]
  }
  const result: ColorItem[] = parts.slice(0, 3).map((p) => {
    const hex = resolveColor(p)
    return hex ? makeColorSet(hex) : makeColorSet('#888888')
  })
  while (result.length < 3) result.push(result[result.length - 1])
  return result
}
