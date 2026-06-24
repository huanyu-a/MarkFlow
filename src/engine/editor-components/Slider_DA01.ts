import type { ThemeColors } from '@engine/composables/useTheme'

/**
 * Slider_DA01 - 图片幻灯片轮播组件
 *
 * 编辑器语法：
 *   <slider images="url1,url2,url3" interval="3" width="600" height="200" type="1">
 *
 * 属性：
 *   images   - 图片URL列表，用逗号分隔（必填）
 *   interval - 每张图片显示时长（秒），默认3，最小2（可选）
 *   width    - SVG视图宽度，默认600（可选）
 *   height   - SVG视图高度，默认200（可选）
 *   type     - 轮播类型：1循环播放 2来回滚动 3跳回第一张 4淡入淡出，默认1（可选）
 */

/* ------------------------------------------------------------------ */
/*  工具函数                                                          */
/* ------------------------------------------------------------------ */

/** 生成 SVG foreignObject + img 标签（避免微信编辑器剥离 <image>） */
function foreignImg(url: string, x: number, w: number, h: number, extra: string = ''): string {
  return `<foreignObject x="${x}" y="0" width="${w}" height="${h}"${extra}><img xmlns="http://www.w3.org/1999/xhtml" src="${url}" width="${w}" height="${h}" style="display:block;object-fit:cover"/></foreignObject>`
}

/** SVG 容器包裹 */
function svgWrap(w: number, h: number, inner: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="100%" style="max-width:${w}px;display:block;margin:28px auto;border-radius:8px;overflow:hidden">
  ${inner}
</svg>`
}

/* ------------------------------------------------------------------ */
/*  type=1 – 循环播放（无缝横向滚动）                                   */
/* ------------------------------------------------------------------ */
function renderLoop(imgs: string[], n: number, iv: number, w: number, h: number): string {
  const extra = 1
  const dur = (n + extra) * iv
  const st = 0.5

  let tags = ''
  for (let i = 0; i < n + 1; i++) tags += foreignImg(imgs[i % n], i * w, w, h)

  const pts: number[] = []
  const vals: string[] = []

  for (let i = 0; i < n; i++) {
    const se = ((i + 1) * iv - st) / dur
    const sl = ((i + 1) * iv) / dur
    if (i === 0) {
      pts.push(0)
      vals.push('0 0')
    }
    pts.push(+se.toFixed(4))
    vals.push(`${-i * w} 0`)
    pts.push(+sl.toFixed(4))
    vals.push(`${-(i + 1) * w} 0`)
  }
  const cse = (dur - st) / dur
  pts.push(+cse.toFixed(4))
  vals.push(`${-n * w} 0`)
  pts.push(0.999)
  vals.push(`${-n * w} 0`)
  pts.push(1)
  vals.push('0 0')

  return svgWrap(
    w,
    h,
    `<g>
    <animateTransform attributeName="transform" type="translate" values="${vals.join(';')}" keyTimes="${pts.join(';')}" dur="${dur}s" repeatCount="indefinite"/>
    ${tags}
  </g>`,
  )
}

/* ------------------------------------------------------------------ */
/*  type=2 – 来回滚动（到末尾后倒着滚回来）                              */
/* ------------------------------------------------------------------ */
function renderBounce(imgs: string[], n: number, iv: number, w: number, h: number): string {
  const st = 0.5
  const dur = (2 * n - 1) * iv

  let tags = ''
  for (let i = 0; i < n; i++) tags += foreignImg(imgs[i], i * w, w, h)

  const pts: number[] = [0]
  const vals: string[] = ['0 0']
  let t = 0

  // 正向滚动 n-1 次
  for (let i = 0; i < n - 1; i++) {
    t += iv - st
    pts.push(+(t / dur).toFixed(4))
    vals.push(`${-i * w} 0`)
    t += st
    pts.push(+(t / dur).toFixed(4))
    vals.push(`${-(i + 1) * w} 0`)
  }

  // 末端停留
  t += iv
  pts.push(+(t / dur).toFixed(4))
  vals.push(`${-(n - 1) * w} 0`)

  // 反向滚动 n-1 次
  for (let i = n - 2; i >= 0; i--) {
    t += st
    pts.push(+(t / dur).toFixed(4))
    vals.push(`${-i * w} 0`)
    t += iv - st
    pts.push(+(t / dur).toFixed(4))
    vals.push(`${-i * w} 0`)
  }

  if (pts[pts.length - 1] < 0.999) {
    pts.push(1)
    vals.push('0 0')
  }

  return svgWrap(
    w,
    h,
    `<g>
    <animateTransform attributeName="transform" type="translate" values="${vals.join(';')}" keyTimes="${pts.join(';')}" dur="${dur}s" repeatCount="indefinite"/>
    ${tags}
  </g>`,
  )
}

/* ------------------------------------------------------------------ */
/*  type=3 – 滚回第一张（正向滚动 → 末尾快速滚回起点）                     */
/* ------------------------------------------------------------------ */
function renderJumpBack(imgs: string[], n: number, iv: number, w: number, h: number): string {
  const st = 0.5 // 正向滑动时间
  const fastRev = 0.6 // 反向快速滚动总时长（秒）
  const dur = n * iv + fastRev

  let tags = ''
  for (let i = 0; i < n; i++) tags += foreignImg(imgs[i], i * w, w, h)

  const pts: number[] = [0]
  const vals: string[] = ['0 0']

  // 正向：正常速度滚动
  for (let i = 0; i < n - 1; i++) {
    const se = ((i + 1) * iv - st) / dur
    const sl = ((i + 1) * iv) / dur
    if (i === 0) {
      pts.push(+se.toFixed(4))
      vals.push('0 0')
    } else {
      pts.push(+se.toFixed(4))
      vals.push(`${-i * w} 0`)
    }
    pts.push(+sl.toFixed(4))
    vals.push(`${-(i + 1) * w} 0`)
  }

  // 最后一张停留
  pts.push(+((n * iv) / dur).toFixed(4))
  vals.push(`${-(n - 1) * w} 0`)

  // 快速滚回第一张
  pts.push(1)
  vals.push('0 0')

  return svgWrap(
    w,
    h,
    `<g>
    <animateTransform attributeName="transform" type="translate" values="${vals.join(';')}" keyTimes="${pts.join(';')}" dur="${dur}s" repeatCount="indefinite"/>
    ${tags}
  </g>`,
  )
}

/* ------------------------------------------------------------------ */
/*  type=4 – 淡入淡出                                                  */
/* ------------------------------------------------------------------ */
function renderFade(imgs: string[], n: number, iv: number, w: number, h: number): string {
  const st = 0.5
  const dur = n * iv

  let tags = ''
  for (let i = 0; i < n; i++) {
    let anim = ''
    if (i === 0) {
      const stay = +((iv - st) / dur).toFixed(4)
      const out = +(iv / dur).toFixed(4)
      anim = ` <animate attributeName="opacity" values="1;1;0;0" keyTimes="0;${stay};${out};1" dur="${dur}s" repeatCount="indefinite"/>`
    } else if (i === n - 1) {
      const z = +((i * iv) / dur).toFixed(4)
      const fi = +((i * iv + st) / dur).toFixed(4)
      const se = +(((i + 1) * iv - st) / dur).toFixed(4)
      anim = ` <animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;${z};${fi};${se};1" dur="${dur}s" repeatCount="indefinite"/>`
    } else {
      const z = +((i * iv) / dur).toFixed(4)
      const fi = +((i * iv + st) / dur).toFixed(4)
      const se = +(((i + 1) * iv - st) / dur).toFixed(4)
      const fo = +(((i + 1) * iv) / dur).toFixed(4)
      anim = ` <animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="0;${z};${fi};${se};${fo};1" dur="${dur}s" repeatCount="indefinite"/>`
    }
    tags += `<g>${anim}
    ${foreignImg(imgs[i], 0, w, h)}
  </g>`
  }

  return svgWrap(w, h, tags)
}

/* ------------------------------------------------------------------ */
/*  组件定义                                                          */
/* ------------------------------------------------------------------ */

export const Slider_DA01 = {
  id: 'Slider_DA01',
  name: '轮播图',
  tag: 'slider',
  attrs: [
    { key: 'images', label: '图片URL列表（逗号分隔）', required: true, default: '' },
    { key: 'interval', label: '每张显示时长（秒），最小2秒', required: false, default: '3' },
    { key: 'width', label: '视图宽度，可根据使用图片调整', required: false, default: '600' },
    { key: 'height', label: '视图高度，可根据使用图片调整', required: false, default: '200' },
    {
      key: 'type',
      label: '轮播类型',
      required: false,
      default: '1',
      options: ['1(循环)', '2(来回)', '3(滚回)', '4(淡入淡出)'],
    },
  ],
  example: `<slider images="https://picsum.photos/600/200?random=7,https://picsum.photos/600/200?random=8,https://picsum.photos/600/200?random=9" interval="3" width="600" height="200" type="1"></slider>`,

  render(attrs: Record<string, string>, _body: string, _t: ThemeColors): string {
    const imagesStr = attrs.images || ''
    const interval = Math.max(2, parseInt(attrs.interval || '3', 10) || 0)
    const width = parseInt(attrs.width || '600', 10) || 0
    const height = parseInt(attrs.height || '200', 10) || 0
    const type = parseInt(attrs.type || '1', 10) || 1

    if (!imagesStr) {
      return `<section style="margin:28px 0;width:100%;text-align:center;padding:20px;background:rgba(0,0,0,0.05);border-radius:8px;color:#999;font-size:14px">请提供图片URL列表</section>`
    }

    const images = imagesStr
      .split(',')
      .map((u) => u.trim())
      .filter(Boolean)
      .slice(0, 5)
    const count = images.length

    if (count === 0) {
      return `<section style="margin:28px 0;width:100%;text-align:center;padding:20px;background:rgba(0,0,0,0.05);border-radius:8px;color:#999;font-size:14px">请提供图片URL列表</section>`
    }

    if (count === 1) {
      return `<section style="margin:28px 0;width:100%;text-align:center"><img src="${images[0]}" width="${width}" height="${height}" style="max-width:100%;height:auto;border-radius:8px" /></section>`
    }

    switch (type) {
      case 2:
        return renderBounce(images, count, interval, width, height)
      case 3:
        return renderJumpBack(images, count, interval, width, height)
      case 4:
        return renderFade(images, count, interval, width, height)
      default:
        return renderLoop(images, count, interval, width, height)
    }
  },
}
