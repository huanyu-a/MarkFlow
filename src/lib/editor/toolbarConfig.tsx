import React from 'react'
import { EditorView } from '@uiw/react-codemirror'
import {
  toggleInlineFormat,
  toggleLineStartFormat,
  toggleListFormat,
  insertDirectBlock,
  insertInline,
} from './editorActions'

export interface ToolbarItem {
  id: string
  label: string
  icon?: React.ReactNode
  shortcut?: string
  action: (view: EditorView) => void
  /** 子菜单项的样式预览 HTML（仅 hover-dropdown / dropdown 使用） */
  preview?: string
}

export interface ToolbarGroup {
  id: string
  name: string
  type: 'buttons' | 'dropdown' | 'hover-dropdown'
  items: ToolbarItem[]
}

const SvgIcon = ({ children, viewBox = '0 0 24 24' }: { children: React.ReactNode; viewBox?: string }) => (
  <svg width="14" height="14" viewBox={viewBox} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
)

export const toolbarGroups: ToolbarGroup[] = [
  {
    id: 'headers',
    name: '标题',
    type: 'buttons',
    items: [
      {
        id: 'h1',
        label: '一级标题',
        shortcut: 'Ctrl+1',
        icon: <span className="text-[13px] font-bold leading-none">H1</span>,
        action: (view) => toggleLineStartFormat(view, '# '),
      },
      {
        id: 'h2',
        label: '二级标题',
        shortcut: 'Ctrl+2',
        icon: <span className="text-[13px] font-bold leading-none">H2</span>,
        action: (view) => toggleLineStartFormat(view, '## '),
      },
      {
        id: 'h3',
        label: '三级标题',
        shortcut: 'Ctrl+3',
        icon: <span className="text-[13px] font-bold leading-none">H3</span>,
        action: (view) => toggleLineStartFormat(view, '### '),
      },
    ],
  },
  {
    id: 'inline-basic',
    name: '基础格式',
    type: 'buttons',
    items: [
      {
        id: 'bold',
        label: '加粗',
        shortcut: 'Ctrl+B',
        icon: <SvgIcon><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path></SvgIcon>,
        action: (view) => toggleInlineFormat(view, '**'),
      },
      {
        id: 'italic',
        label: '斜体',
        shortcut: 'Ctrl+I',
        icon: <SvgIcon><line x1="19" y1="4" x2="10" y2="20"></line><line x1="14" y1="4" x2="5" y2="20"></line></SvgIcon>,
        action: (view) => toggleInlineFormat(view, '*'),
      },
      {
        id: 'underline',
        label: '下划线',
        shortcut: 'Ctrl+U',
        icon: <SvgIcon><path d="M6 4v6a6 6 0 0 0 12 0V4"></path><line x1="4" y1="20" x2="20" y2="20"></line></SvgIcon>,
        action: (view) => toggleInlineFormat(view, '__'),
      },
      {
        id: 'strikethrough',
        label: '删除线',
        shortcut: 'Ctrl+Shift+X',
        icon: <SvgIcon><line x1="5" y1="12" x2="19" y2="12"></line><path d="M16 6A6 6 0 0 0 4 9c0 4 6 3 6 7a6 6 0 0 1-12 3"></path></SvgIcon>,
        action: (view) => toggleInlineFormat(view, '~~'),
      },
      {
        id: 'code',
        label: '行内代码',
        shortcut: 'Ctrl+E',
        icon: <SvgIcon><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></SvgIcon>,
        action: (view) => toggleInlineFormat(view, '`'),
      },
    ],
  },
  {
    id: 'lists',
    name: '列表',
    type: 'buttons',
    items: [
      {
        id: 'ul',
        label: '无序列表',
        shortcut: 'Ctrl+Shift+8',
        icon: <SvgIcon><line x1="9" y1="6" x2="20" y2="6"></line><line x1="9" y1="12" x2="20" y2="12"></line><line x1="9" y1="18" x2="20" y2="18"></line><line x1="5" y1="6" x2="5.01" y2="6"></line><line x1="5" y1="12" x2="5.01" y2="12"></line><line x1="5" y1="18" x2="5.01" y2="18"></line></SvgIcon>,
        action: (view) => toggleListFormat(view, '- '),
      },
      {
        id: 'ol',
        label: '有序列表',
        shortcut: 'Ctrl+Shift+7',
        icon: <SvgIcon><line x1="10" y1="6" x2="21" y2="6"></line><line x1="10" y1="12" x2="21" y2="12"></line><line x1="10" y1="18" x2="21" y2="18"></line><path d="M4 6h1v4"></path><path d="M4 10h2"></path><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"></path></SvgIcon>,
        action: (view) => toggleListFormat(view, '1. '),
      },
      {
        id: 'task',
        label: '任务列表',
        shortcut: 'Ctrl+Shift+9',
        icon: <SvgIcon><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><polyline points="9 11 12 14 22 4"></polyline></SvgIcon>,
        action: (view) => toggleListFormat(view, '- [ ] '),
      },
    ],
  },
  {
    id: 'callouts',
    name: '引用区块',
    type: 'hover-dropdown',
    items: [
      {
        id: 'quote',
        label: '引用区块',
        shortcut: 'Ctrl+Shift+.',
        icon: <SvgIcon><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></SvgIcon>,
        action: (view) => toggleLineStartFormat(view, '> '),
      },
      {
        id: 'callout-note',
        label: '📝 笔记',
        action: (view) => toggleLineStartFormat(view, '> [!NOTE] '),
      },
      {
        id: 'callout-info',
        label: 'ℹ️ 信息',
        action: (view) => toggleLineStartFormat(view, '> [!INFO] '),
      },
      {
        id: 'callout-tip',
        label: '💡 提示',
        action: (view) => toggleLineStartFormat(view, '> [!TIP] '),
      },
      {
        id: 'callout-warning',
        label: '⚠️ 警告',
        action: (view) => toggleLineStartFormat(view, '> [!WARNING] '),
      },
      {
        id: 'callout-caution',
        label: '🚨 严重',
        action: (view) => toggleLineStartFormat(view, '> [!CAUTION] '),
      },
      {
        id: 'callout-important',
        label: '❗ 重要',
        action: (view) => toggleLineStartFormat(view, '> [!IMPORTANT] '),
      },
    ],
  },
  {
    id: 'align',
    name: '对齐方式',
    type: 'hover-dropdown',
    items: [
      {
        id: 'align-left',
        label: '左对齐',
        icon: <SvgIcon viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="10" x2="15" y2="10"></line><line x1="3" y1="14" x2="19" y2="14"></line><line x1="3" y1="18" x2="13" y2="18"></line></SvgIcon>,
        preview: '<svg width="24" height="18" viewBox="0 0 24 18"><rect x="2" y="2" width="20" height="2" rx="0.5" fill="#94a3b8"/><rect x="2" y="6" width="14" height="2" rx="0.5" fill="#94a3b8"/><rect x="2" y="10" width="17" height="2" rx="0.5" fill="#94a3b8"/><rect x="2" y="14" width="12" height="2" rx="0.5" fill="#94a3b8"/></svg>',
        action: (view) => {
          const { from } = view.state.selection.main
          view.dispatch({ changes: { from, insert: '<align align="left">\n\n</align>' } })
          view.focus()
        },
      },
      {
        id: 'align-center',
        label: '居中对齐',
        preview: '<svg width="24" height="18" viewBox="0 0 24 18"><rect x="2" y="2" width="20" height="2" rx="0.5" fill="#94a3b8"/><rect x="5" y="6" width="14" height="2" rx="0.5" fill="#6c5ce7"/><rect x="2" y="10" width="20" height="2" rx="0.5" fill="#94a3b8"/><rect x="6" y="14" width="12" height="2" rx="0.5" fill="#94a3b8"/></svg>',
        action: (view) => {
          const { from } = view.state.selection.main
          view.dispatch({ changes: { from, insert: '<align align="center">\n\n</align>' } })
          view.focus()
        },
      },
      {
        id: 'align-right',
        label: '右对齐',
        preview: '<svg width="24" height="18" viewBox="0 0 24 18"><rect x="2" y="2" width="20" height="2" rx="0.5" fill="#94a3b8"/><rect x="8" y="6" width="14" height="2" rx="0.5" fill="#94a3b8"/><rect x="5" y="10" width="17" height="2" rx="0.5" fill="#94a3b8"/><rect x="10" y="14" width="12" height="2" rx="0.5" fill="#94a3b8"/></svg>',
        action: (view) => {
          const { from } = view.state.selection.main
          view.dispatch({ changes: { from, insert: '<align align="right">\n\n</align>' } })
          view.focus()
        },
      },
    ],
  },
  {
    id: 'divider',
    name: '横线',
    type: 'buttons',
    items: [
      {
        id: 'divider-btn',
        label: '横线',
        shortcut: 'Ctrl+Shift+-',
        icon: <SvgIcon><line x1="5" y1="12" x2="19" y2="12"></line></SvgIcon>,
        action: (view) => insertDirectBlock(view, '---'),
      },
    ],
  },
  {
    id: 'inline-custom',
    name: '行内标识',
    type: 'hover-dropdown',
    items: [
      {
        id: 'highlight',
        label: '柔光重点',
        shortcut: 'Ctrl+Shift+H',
        icon: <SvgIcon viewBox="0 0 24 24"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></SvgIcon>,
        preview: '<span style="color:#7c3aed;font-weight:bold;font-size:13px">柔光重点</span>',
        action: (view) => toggleInlineFormat(view, '::'),
      },
      {
        id: 'gradient',
        label: '渐变背景',
        shortcut: 'Ctrl+Shift+G',
        preview: '<span style="background:linear-gradient(120deg,rgba(108,92,231,0.12),rgba(108,92,231,0.2));padding:2px 6px;border-radius:4px;font-weight:bold;color:#6c5ce7;font-size:13px">渐变背景</span>',
        action: (view) => toggleInlineFormat(view, '=='),
      },
      {
        id: 'capsule',
        label: '胶囊文字',
        shortcut: 'Ctrl+Shift+C',
        preview: '<span style="display:inline-block;padding:1px 8px;border-radius:20px;font-size:12px;font-weight:600;background:#6c5ce720;color:#6c5ce7;border:1px solid #6c5ce733">胶囊文字</span>',
        action: (view) => toggleInlineFormat(view, '!!'),
      },
      {
        id: 'emphasis',
        label: '加重强调',
        shortcut: 'Ctrl+Shift+E',
        preview: '<strong style="color:#6c5ce7;font-size:13px">加重强调</strong>',
        action: (view) => toggleInlineFormat(view, '^^'),
      },
      {
        id: 'lead',
        label: '引言大字',
        shortcut: 'Ctrl+Shift+L',
        preview: '<span style="font-size:16px;font-weight:bold;color:#6c5ce7">引言大字</span>',
        action: (view) => toggleInlineFormat(view, '<lead>'),
      },
    ],
  },
  {
    id: 'badge',
    name: '行内徽章',
    type: 'hover-dropdown',
    items: [
      {
        id: 'badge-tip',
        label: '提示徽章',
        icon: <SvgIcon viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></SvgIcon>,
        preview: '<span style="display:inline-block;padding:1px 8px;border-radius:4px;font-size:12px;font-weight:600;background:#e8f5e9;color:#2e7d32;border:1px solid #a5d6a7">推荐</span>',
        action: (view) => insertInline(view, '<Badge type="tip" text="" />'),
      },
      {
        id: 'badge-info',
        label: '信息徽章',
        preview: '<span style="display:inline-block;padding:1px 8px;border-radius:4px;font-size:12px;font-weight:600;background:#e3f2fd;color:#1565c0;border:1px solid #90caf9">信息</span>',
        action: (view) => insertInline(view, '<Badge type="info" text="" />'),
      },
      {
        id: 'badge-warning',
        label: '警告徽章',
        preview: '<span style="display:inline-block;padding:1px 8px;border-radius:4px;font-size:12px;font-weight:600;background:#fff3e0;color:#e65100;border:1px solid #ffcc80">警告</span>',
        action: (view) => insertInline(view, '<Badge type="warning" text="" />'),
      },
      {
        id: 'badge-danger',
        label: '危险徽章',
        preview: '<span style="display:inline-block;padding:1px 8px;border-radius:4px;font-size:12px;font-weight:600;background:#fce4ec;color:#c62828;border:1px solid #ef9a9a">危险</span>',
        action: (view) => insertInline(view, '<Badge type="danger" text="" />'),
      },
    ],
  },
  {
    id: 'icon',
    name: '行内图标',
    type: 'hover-dropdown',
    items: [
      {
        id: 'icon-star',
        label: '星标',
        icon: <SvgIcon viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></SvgIcon>,
        preview: '<img src="https://api.iconify.design/material-symbols:star.svg" style="width:28px;height:28px" alt="" />',
        action: (view) => insertInline(view, '<Icon name="material-symbols:star" />'),
      },
      {
        id: 'icon-home',
        label: '首页',
        preview: '<img src="https://api.iconify.design/material-symbols:home.svg" style="width:28px;height:28px" alt="" />',
        action: (view) => insertInline(view, '<Icon name="material-symbols:home" />'),
      },
      {
        id: 'icon-search',
        label: '搜索',
        preview: '<img src="https://api.iconify.design/material-symbols:search.svg" style="width:28px;height:28px" alt="" />',
        action: (view) => insertInline(view, '<Icon name="material-symbols:search" />'),
      },
      {
        id: 'icon-person',
        label: '用户',
        preview: '<img src="https://api.iconify.design/material-symbols:person.svg" style="width:28px;height:28px" alt="" />',
        action: (view) => insertInline(view, '<Icon name="material-symbols:person" />'),
      },
      {
        id: 'icon-settings',
        label: '设置',
        preview: '<img src="https://api.iconify.design/material-symbols:settings.svg" style="width:28px;height:28px" alt="" />',
        action: (view) => insertInline(view, '<Icon name="material-symbols:settings" />'),
      },
      {
        id: 'icon-favorite',
        label: '收藏',
        preview: '<img src="https://api.iconify.design/material-symbols:favorite.svg" style="width:28px;height:28px" alt="" />',
        action: (view) => insertInline(view, '<Icon name="material-symbols:favorite" />'),
      },
      {
        id: 'icon-mail',
        label: '邮件',
        preview: '<img src="https://api.iconify.design/material-symbols:mail.svg" style="width:28px;height:28px" alt="" />',
        action: (view) => insertInline(view, '<Icon name="material-symbols:mail" />'),
      },
      {
        id: 'icon-phone',
        label: '电话',
        preview: '<img src="https://api.iconify.design/material-symbols:call.svg" style="width:28px;height:28px" alt="" />',
        action: (view) => insertInline(view, '<Icon name="material-symbols:call" />'),
      },
      {
        id: 'icon-share',
        label: '分享',
        preview: '<img src="https://api.iconify.design/material-symbols:share.svg" style="width:28px;height:28px" alt="" />',
        action: (view) => insertInline(view, '<Icon name="material-symbols:share" />'),
      },
      {
        id: 'icon-download',
        label: '下载',
        preview: '<img src="https://api.iconify.design/material-symbols:download.svg" style="width:28px;height:28px" alt="" />',
        action: (view) => insertInline(view, '<Icon name="material-symbols:download" />'),
      },
      {
        id: 'icon-info',
        label: '信息',
        preview: '<img src="https://api.iconify.design/material-symbols:info.svg" style="width:28px;height:28px" alt="" />',
        action: (view) => insertInline(view, '<Icon name="material-symbols:info" />'),
      },
      {
        id: 'icon-warning',
        label: '警告',
        preview: '<img src="https://api.iconify.design/material-symbols:warning.svg" style="width:28px;height:28px" alt="" />',
        action: (view) => insertInline(view, '<Icon name="material-symbols:warning" />'),
      },
      {
        id: 'icon-check',
        label: '确认',
        preview: '<img src="https://api.iconify.design/material-symbols:check.svg" style="width:28px;height:28px" alt="" />',
        action: (view) => insertInline(view, '<Icon name="material-symbols:check" />'),
      },
      {
        id: 'icon-close',
        label: '关闭',
        preview: '<img src="https://api.iconify.design/material-symbols:close.svg" style="width:28px;height:28px" alt="" />',
        action: (view) => insertInline(view, '<Icon name="material-symbols:close" />'),
      },
      {
        id: 'icon-more',
        label: '更多图标',
        preview: '<span style="display:flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:6px;background:#f1f5f9;color:#64748b;font-size:16px;font-weight:bold">+</span>',
        action: () => { window.open('https://icon-sets.iconify.design/', '_blank') },
      },
    ],
  },
]
