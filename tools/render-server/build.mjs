// 把 MarkFlow 渲染引擎打包为 Node 可用的 ESM bundle（render-bundle.mjs）。
//
// 用法：node tools/render-server/build.mjs
// 产物：tools/render-server/render-bundle.mjs（不入库，见 .gitignore）
//
// 说明：
// - platform=node + format=esm；alias 与 vite/vitest 保持一致（@engine、@）。
// - katex 为静态依赖会被打进 bundle（纯 JS，Node 可用）；
//   mermaid / mathjax / jsdom 标记 external：前两者是浏览器端动态懒加载，
//   同步渲染不会触发；jsdom 由服务端运行环境自行安装。
import { build } from 'esbuild'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

await build({
  entryPoints: [path.join(repoRoot, 'tools/render-server/render-entry.ts')],
  outfile: path.join(repoRoot, 'tools/render-server/render-bundle.mjs'),
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'node20',
  sourcemap: false,
  minify: false,
  legalComments: 'none',
  external: ['mermaid', 'mathjax', 'jsdom', 'proxy-agent'],
  alias: {
    '@engine': path.join(repoRoot, 'src/engine'),
    '@': path.join(repoRoot, 'src'),
    // 引擎的 img:// 本地图依赖浏览器 IndexedDB + 图床 SDK（secureVault → ali-oss），
    // 服务端渲染用垫片替换，剪掉整条浏览器依赖链
    '@/lib/editor/imageStorage': path.join(repoRoot, 'tools/render-server/stubs/imageStorage.ts'),
  },
  banner: {
    js: '// 本文件由 tools/render-server/build.mjs 生成，请勿手改；重新构建请运行该脚本。',
  },
})

console.log('[render-server] 已生成 tools/render-server/render-bundle.mjs')
