import type { ThemeColors } from '@engine/composables/useTheme'

/**
 * Img_DA01 - 图片组件（默认A型01号样式）
 *
 * 编辑器语法：
 *   <img src="data:image/png;base64,..." alt="替代文本" width="100%" height="auto" radius="8px" fit="cover" align="left" left="0" top="0" />
 *
 * 属性：
 *   src      - 图片地址（支持 base64 / 网络 URL / 本地路径）
 *   alt      - 替代文本
 *   width    - 宽度，默认 100%
 *   height   - 高度，默认 auto
 *   radius   - 圆角，默认 8px
 *   fit      - 裁切方式，默认 cover
 *   align    - 容器水平对齐方式：left / center / right，默认 left
 *   left     - 图片 x 轴偏移（margin-left），正值向右、负值向左，如 10px / -20px
 *   top      - 图片 y 轴偏移（margin-top），正值向下、负值向上，如 10px / -20px
 */

export const Img_DA01 = {
  id: 'Img_DA01',
  name: '图片',
  tag: 'img',
  attrs: [
    {
      key: 'src',
      label: '图片地址',
      required: true,
      default: '',
      description: '图片地址，支持 http(s) URL、base64 数据',
    },
    {
      key: 'alt',
      label: '替代文本',
      required: false,
      default: '',
      description: '图片无法加载时显示的替代文本',
    },
    {
      key: 'width',
      label: '宽度',
      required: false,
      default: '100%',
      description: '图片容器宽度，如 100% / 600px',
    },
    {
      key: 'height',
      label: '高度',
      required: false,
      default: 'auto',
      description: '图片容器高度，如 auto / 400px',
    },
    {
      key: 'radius',
      label: '圆角',
      required: false,
      default: '8px',
      description: '图片圆角大小，如 8px / 12px / 50% / 10px 20px / 10px 20px 10px 20px',
    },
    {
      key: 'fit',
      label: '裁切方式',
      required: false,
      default: 'cover',
      options: ['fill', 'contain', 'cover', 'none', 'scale-down'],
      description:
        'CSS object-fit 裁切方式：fill 拉伸 / contain 完整显示 / cover 裁剪 / none 原始尺寸 / scale-down 缩小',
    },
    {
      key: 'align',
      label: '容器对齐',
      required: false,
      default: 'left',
      options: ['left', 'center', 'right'],
      description: '图片容器水平对齐方式（固定宽度时生效）：left 居左 / center 居中 / right 居右',
    },
    {
      key: 'left',
      label: 'X轴偏移',
      required: false,
      default: '',
      description: '图片 x 轴偏移效果，如 10px / -20px / 50%',
    },
    {
      key: 'top',
      label: 'Y轴偏移',
      required: false,
      default: '',
      description: '图片 y 轴偏移效果，如 10px / -20px / 50%',
    },
  ],
  example: `<img src="https://robocopmao.github.io/r-markdown/banner4.webp" alt="示例图片" width="100%" height="auto" radius="8px" fit="cover" align="left" left="10px" top="5px" />`,

  render(attrs: Record<string, string>, _body: string, _t: ThemeColors, marginSize: string = '24px'): string {
    const src = attrs.src || ''
    const alt = attrs.alt || ''
    const width = attrs.width || '100%'
    const height = attrs.height || 'auto'
    const radius = attrs.radius || '8px'
    const fit = attrs['fit'] || 'cover'
    const align = attrs['align'] || 'left'
    const marginMap: Record<string, string> = {
      left: `${marginSize} 0px`,
      center: `${marginSize} auto`,
      right: `${marginSize} 0px ${marginSize} auto`,
    }
    const margin = marginMap[align] || marginMap.left
    const imgLeft = attrs['left'] || ''
    const imgTop = attrs['top'] || ''

    const imgStyle = [
      'width:100%',
      `object-fit:${fit}`,
      'display:block',
      imgLeft ? `margin-left:${imgLeft}` : '',
      imgTop ? `margin-top:${imgTop}` : '',
    ]
      .filter(Boolean)
      .join(';')

    return `<section style="margin:${margin};width:${width};height:${height};overflow:hidden;border-radius:${radius}"><img src="${src}" alt="${alt}" style="${imgStyle}" /></section>`
  },
}
