// Node 渲染 bundle 的 imageStorage 垫片。
//
// 浏览器端 imageStorage 依赖 IndexedDB / secureVault / 图床 SDK（ali-oss 等），
// 与服务端渲染无关，且会拖入庞大的浏览器依赖链，故在 esbuild 打包时用本垫片替换。
// 仅 img:// 本地缓存图会走 getCachedImageUrl，服务端返回 undefined，引擎按原逻辑降级。
export function getCachedImageUrl(_id: string): string | undefined {
  return undefined
}
