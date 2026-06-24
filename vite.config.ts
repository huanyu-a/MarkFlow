import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'
import type { Plugin } from 'vite'

/**
 * MathJax tex-svg 字体数据拆分插件
 *
 * tex-svg chunk 包含 MathJax 的 TeX 解析器 + SVG 渲染器 + 字体数据（~908 KB），
 * 其中 defaultChars 字体对象字面量占 51%。此插件在 build 的 generateBundle 阶段
 * 将字体数据提取为独立的同步 <script> 资源，在 tex-svg chunk 执行前通过
 * globalThis 注入，使主 tex-svg chunk 体积减半。
 *
 * 执行时序（安全保证）：
 * 1. mathRenderer.ts 中 import('mathjax/es5/tex-svg.js') 触发浏览器获取 tex-svg chunk
 * 2. 浏览器解析 tex-svg chunk 时，先执行头部注入的 loader <script>（sync, blocking）
 * 3. loader script 加载 fonts chunk 并设置 globalThis.__MATHJAX_FONTS__
 * 4. tex-svg 主代码执行，读取 globalThis.__MATHJAX_FONTS__ 初始化字体
 *
 * 为什么用 generateBundle 而非 renderChunk：
 * tex-svg 是 mathjax/es5/tex-svg.js 的预构建产物，Vite 将其作为 pre-bundled
 * dependency 直接 emit 为 asset，不经过 Rollup 的 renderChunk 管线。
 * generateBundle 在所有 chunk 写入 dist 前触发，此时可修改 chunk code 并 emit 新文件。
 */
function mathJaxFontSplitter(): Plugin {
  return {
    name: 'mathjax-font-splitter',
    enforce: 'post',

    generateBundle(_options, bundle) {
      // 1. 找到 tex-svg chunk（体积最大且包含 defaultChars）
      let texSvgChunk = null
      let texSvgFileName: string | null = null
      for (const [fileName, chunk] of Object.entries(bundle)) {
        if (
          chunk.type === 'chunk' &&
          chunk.code &&
          chunk.code.length > 1_500_000 &&
          chunk.code.includes('defaultChars')
        ) {
          texSvgChunk = chunk
          texSvgFileName = fileName
          break
        }
      }
      if (!texSvgChunk || !texSvgFileName) return

      const code = texSvgChunk.code

      // 2. 定位 defaultChars={normal:{32:...} 的实际字体数据（非空初始化 {}）
      //    MathJax 中有多处 defaultChars=，第一个是空对象初始化，第二个包含完整字体数据
      const marker = 'defaultChars={normal:'
      const markerIdx = code.indexOf(marker)
      if (markerIdx === -1) return

      const objStart = markerIdx + 'defaultChars='.length
      if (code[objStart] !== '{') return

      // 3. 括号匹配找到对象的完整边界
      let depth = 0
      let objEnd = objStart
      for (let i = objStart; i < code.length; i++) {
        if (code[i] === '{') depth++
        if (code[i] === '}') {
          depth--
          if (depth === 0) { objEnd = i + 1; break }
        }
      }

      const fontDataStr = code.substring(objStart, objEnd)
      if (fontDataStr.length < 100_000) return // 安全阈值

      // 4. 提取字体数据为独立 asset 文件
      const fontFileName = texSvgFileName.replace(/\.js$/, '-fonts.js')
      this.emitFile({
        type: 'asset',
        fileName: fontFileName,
        source: `globalThis.__MATHJAX_FONTS__=${fontDataStr};`,
      })

      // 5. 替换原 chunk 中的字体对象字面量为 globalThis 引用
      const newCode =
        code.substring(0, objStart) +
        'globalThis.__MATHJAX_FONTS__' +
        code.substring(objEnd)

      // 6. 注入同步 loader <script>（chunk 头部）
      //    构建后 chunk 与 fonts 文件在同一目录，通过 import.meta.url 定位
      const loader = `(function(){var u=import.meta.url.replace(/[^/\\\\]*$/,'${fontFileName}');var s=document.createElement('script');s.src=u;s.async=false;document.head.appendChild(s);s.onload=function(){s.remove()}})();`

      texSvgChunk.code = loader + newCode

      console.log(`[mathjax-font-splitter] tex-svg: ${(code.length / 1024).toFixed(0)} KB -> ${(texSvgChunk.code.length / 1024).toFixed(0)} KB (font data: ${(fontDataStr.length / 1024).toFixed(0)} KB)`)
    },
  }
}

// 构建基础路径，通过环境变量 MARKFLOW_BASE_URL 配置，默认 /MarkFlow/
// 独立部署：默认 /MarkFlow/ → https://huanyu-a.github.io/MarkFlow/
// Wiki 集成：MARKFLOW_BASE_URL=/markflow/ → https://www.bx9y.com.cn/markflow/
const baseUrl = process.env.MARKFLOW_BASE_URL || '/MarkFlow/'

// MarkFlow 构建配置
export default defineConfig({
  base: baseUrl,
  plugins: [
    react(),
    tailwindcss(),
    mathJaxFontSplitter(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'MarkFlow — Markdown 多场景渲染工作台',
        short_name: 'MarkFlow',
        description: '纯前端 Markdown / HTML 多场景渲染与导出工作台',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        lang: 'zh-CN',
        icons: [
          { src: '/pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      // 开发模式下禁用 Service Worker，避免缓存导致的调试问题
      devOptions: {
        enabled: false,
      },
      workbox: {
        cleanupOutdatedCaches: true,
        navigateFallback: `${baseUrl}index.html`,
        navigateFallbackDenylist: [new RegExp(`^${baseUrl.replace(/\//g, '\\/')}workbox-`)],
        // 分层缓存：预缓存仅含应用外壳，JS 大块走运行时缓存
        globPatterns: ['**/*.{css,html,svg,png,woff2}'],
        globIgnores: ['assets/*.js'],
        runtimeCaching: [
          {
            // 主入口 + 懒加载 chunk：首次访问后缓存，离线可复用
            urlPattern: /\/assets\/.+\.js$/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'app-chunks',
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      // @ 指向 src（应用代码），@engine 指向移植自 r-markdown 的框架无关渲染引擎
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@engine': fileURLToPath(new URL('./src/engine', import.meta.url)),
    },
  },
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'codemirror-vendor': [
            '@codemirror/language',
            '@codemirror/lang-markdown',
            '@codemirror/lang-html',
            '@uiw/react-codemirror',
            'codemirror'
          ],
          'engine-vendor': ['highlight.js', 'katex'],
          'mermaid-vendor': ['mermaid'],
          // 注意：'mathjax-vendor': ['mathjax'] 已移除。
          // mathjax 包是 CommonJS 预构建包，manualChunks 无法有效拆分，
          // 只会产生一个 360 字节的空 stub。实际的 MathJax 代码通过
          // dynamic import('mathjax/es5/tex-svg.js') 加载，由 Vite 自动拆为独立 chunk，
          // 再经上方 mathJaxFontSplitter 插件进一步拆分字体数据。
        }
      }
    }
  },
  esbuild: {
    pure: ['console.log'],
    drop: ['debugger']
  }
})
