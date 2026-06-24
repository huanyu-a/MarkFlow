/**
 * Icon_DA01 - 行内图标组件（默认A型01号样式）
 *
 * 通过 Iconify API 加载图标，支持 Material Symbols、Fluent、Skill Icons 等数千个图标集。
 * 图标自带颜色，不支持换色。
 *
 * 编辑器语法：
 *   <Icon name="material-symbols:home" />
 *   <Icon name="skill-icons:vscode-dark" size="2em" />
 *
 * 属性：
 *   name - 图标名称（Iconify 图标集命名，如 material-symbols:home）
 *   size - 图标尺寸（可选，默认 1em）
 */
import type { ThemeColors } from '@engine/composables/useTheme'
import { esc } from '@engine/utils/helpers'

export const Icon_DA01 = {
  id: 'Icon_DA01',
  name: '行内图标',
  tag: 'Icon',
  description: '通过 Iconify API 加载的矢量图标，支持 Material Symbols、Fluent、Skill Icons 等数千个图标集',
  attrs: [
    {
      key: 'name',
      label: '图标名称',
      required: true,
      options: [
        'material-symbols:home',
        'material-symbols:star',
        'material-symbols:search',
        'material-symbols:settings',
        'material-symbols:person',
        'material-symbols:mail',
        'material-symbols:call',
        'material-symbols:share',
        'material-symbols:download',
        'material-symbols:upload',
        'material-symbols:edit',
        'material-symbols:delete',
        'material-symbols:add',
        'material-symbols:close',
        'material-symbols:check',
        'material-symbols:arrow-forward',
        'material-symbols:arrow-back',
        'material-symbols:info',
        'material-symbols:warning',
        'material-symbols:favorite',
        'material-symbols:visibility',
        'material-symbols:lock',
        'material-symbols:language',
        'material-symbols:location-on',
        'material-symbols:calendar-today',
        'material-symbols:link',
        'material-symbols:bookmark',
        'material-symbols:thumb-up',
        'material-symbols:notifications',
        'material-symbols:chat',
      ],
    },
    { key: 'size', label: '图标尺寸', required: false, default: '1em' },
  ],
  example: '<Icon name="material-symbols:star" size="2em" />',

  render(attrs: Record<string, string>, _body: string, _t: ThemeColors): string {
    const name = attrs.name || 'material-symbols:help'
    const size = attrs.size || '1em'
    const encoded = encodeURIComponent(name)
    return `<section style="display:flex;align-items:center;justify-content:center;padding:16px 0"><img src="https://api.iconify.design/${encoded}.svg" alt="${esc(name)}" style="width:${size === '1em' ? '48px' : size};height:${size === '1em' ? '48px' : size};display:block" onerror="this.style.display='none'"></section>`
  },
}
