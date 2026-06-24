import { Suspense, lazy, useEffect, useState, useCallback } from "react";
import { useStore, useContentStore, type DemoContents } from "@/lib/store";
import { Toast, type ToastState } from "@/components/ui/Toast";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { AppHeader } from "@/components/layout/AppHeader";
import { MobileDrawer } from "@/components/layout/MobileDrawer";
import { Sidebar, type SidebarPanel } from "@/components/layout/Sidebar";
import { AiTypesetPanel } from "@/components/ai/AiTypesetPanel";
import { PromptLibrary } from "@/modes/html/PromptLibrary";
import { SettingsModal } from "@/components/editor/SettingsModal";
import { PrivacyModal } from "@/components/layout/PrivacyModal";
import { BrowserCompatDialog } from "@/components/ui/BrowserCompatDialog";
import { ResizablePanel } from "@/components/ui/ResizablePanel";
import { ExtensionPage } from "@/components/extension/ExtensionPage";

import { copyText } from "@/lib/clipboard";
import { buildDesignPrompt, type DesignStyle } from "@/data/designPrompts";
import { buildArticleAiGuide, buildDocumentAiGuide, buildCardAiGuide } from "@/lib/aiGuide";
import { DEMO_ARTICLE } from "@/data/demoArticle";
import { DEMO_DOCUMENT } from "@/data/demoDocument";
import { DEMO_CARD } from "@/data/demoCard";
import { DEMO_HTML } from "@/data/demoHtml";

const ArticleMode = lazy(() =>
  import("@/modes/article/ArticleMode").then((m) => ({
    default: m.ArticleMode,
  })),
);
const DocumentMode = lazy(() =>
  import("@/modes/document/DocumentMode").then((m) => ({
    default: m.DocumentMode,
  })),
);
const CardMode = lazy(() =>
  import("@/modes/card/CardMode").then((m) => ({ default: m.CardMode })),
);
const HtmlMode = lazy(() =>
  import("@/modes/html/HtmlMode").then((m) => ({ default: m.HtmlMode })),
);

function ModeLoading() {
  return (
    <main className="flex min-h-0 flex-1 items-center justify-center bg-slate-50 text-sm text-slate-400">
      正在加载工作台...
    </main>
  );
}

function ModeErrorFallback() {
  return (
    <main className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 bg-slate-50 text-sm text-slate-500">
      <span>渲染模块出现异常</span>
      <button
        onClick={() => window.location.reload()}
        className="rounded-md border border-slate-200 bg-white px-4 py-1.5 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
      >
        刷新页面
      </button>
    </main>
  );
}

// 各模式最新示例内容集合（模块级常量，引用稳定），供版本同步与恢复示例使用。
const DEMOS: DemoContents = {
  article: DEMO_ARTICLE,
  document: DEMO_DOCUMENT,
  card: DEMO_CARD,
  html: DEMO_HTML,
};

// 多场景渲染工作台：长图文 / A4 文档 / 小红书卡片 / HTML 可视化。
export default function App() {
  const articleMarkdown = useContentStore((s) => s.articleMarkdown);
  const setArticleMarkdown = useContentStore((s) => s.setArticleMarkdown);
  const documentMarkdown = useContentStore((s) => s.documentMarkdown);
  const setDocumentMarkdown = useContentStore((s) => s.setDocumentMarkdown);
  const cardMarkdown = useContentStore((s) => s.cardMarkdown);
  const setCardMarkdown = useContentStore((s) => s.setCardMarkdown);
  const html = useContentStore((s) => s.html);
  const setHtml = useContentStore((s) => s.setHtml);
  const syncDemoContent = useContentStore((s) => s.syncDemoContent);
  const restoreDemo = useContentStore((s) => s.restoreDemo);
  const contentHydrated = useContentStore((s) => s.hasHydrated);

  const colors = useStore((s) => s.colors);
  const accent = useStore((s) => s.accent);
  const setTheme = useStore((s) => s.setTheme);
  const mode = useStore((s) => s.mode);
  const setMode = useStore((s) => s.setMode);
  const platform = useStore((s) => s.platform);
  const documentSettings = useStore((s) => s.documentSettings);
  const updateDocumentSettings = useStore((s) => s.updateDocumentSettings);
  const triggerGuide = useStore((s) => s.triggerGuide);
  const appHydrated = useStore((s) => s.hasHydrated);
  const hasHydrated = contentHydrated && appHydrated;

  // 图床设置弹窗状态
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  // AI 排版弹窗状态（autoRun: 打开后自动运行）
  const [isAiTypesetOpen, setIsAiTypesetOpen] = useState(false);
  const [aiTypesetAutoRun, setAiTypesetAutoRun] = useState(false);
  // 指令库弹窗状态
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  // 隐私说明弹窗状态
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  // 组件库弹窗状态
  const [isExtensionOpen, setIsExtensionOpen] = useState(false);
  // 移动端侧边菜单抽屉状态
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  // 侧边栏当前激活项（ai 点击即开弹窗，无需持久）
  const [activePanel] = useState<SidebarPanel>(null);
  // 导航栏宽度（用于判断是否自动关闭抽屉）
  const [headerWidth, setHeaderWidth] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth : 1200,
  );

  // 统一 Toast 反馈
  const [toast, setToast] = useState<ToastState | null>(null);
  const showToast = useCallback((message: string) => setToast({ message, key: Date.now() }), []);

  const handleCopyPrompt = useCallback(async (style: DesignStyle) => {
    const ok = await copyText(buildDesignPrompt(style));
    showToast(ok ? `已复制「${style.name}」风格指令` : '复制失败，请重试');
  }, [showToast]);

  const handleCopyAiGuide = useCallback(async () => {
    let guide: string
    switch (mode) {
      case 'article': guide = buildArticleAiGuide(); break
      case 'document': guide = buildDocumentAiGuide(); break
      case 'card': guide = buildCardAiGuide('3:4'); break
      default: guide = buildArticleAiGuide()
    }
    const ok = await copyText(guide)
    showToast(ok ? `已复制${mode === 'article' ? '长图文' : mode === 'document' ? 'A4 文档' : mode === 'card' ? '小红书卡片' : 'HTML'} AI 排版指令` : '复制失败')
  }, [mode, showToast]);

  const handleWidthChange = useCallback((w: number) => setHeaderWidth(w), []);

  // 视口拓宽至桌面端时自动关闭移动端侧边抽屉
  useEffect(() => {
    if (headerWidth >= 960) {
      setIsMobileMenuOpen(false);
    }
  }, [headerWidth]);

  // 持久化恢复完成后，按版本号同步示例：仅当 DEMO_VERSION 变化时，刷新用户未编辑过的字段为最新示例。
  useEffect(() => {
    if (!hasHydrated) return;
    syncDemoContent(DEMOS);
  }, [hasHydrated, syncDemoContent]);

  const restoreDocumentSettingsDemo = useStore((s) => s.restoreDocumentSettingsDemo);

  const handleRestoreDemo = useCallback(() => {
    if (
      window.confirm(
        "确定要恢复当前模块的示例内容吗？这将会覆盖当前编辑区内容。",
      )
    ) {
      if (mode === 'document') {
        restoreDocumentSettingsDemo();
      }
      restoreDemo(mode, DEMOS);
      showToast("已恢复当前模块示例");
    }
  }, [mode, restoreDemo, restoreDocumentSettingsDemo, showToast]);

  // 监听子组件打开设置弹窗的请求（如 Mermaid 图床提醒弹窗的「配置图床」按钮）
  useEffect(() => {
    const handler = () => setIsSettingsOpen(true)
    window.addEventListener('m2v-open-settings', handler)
    return () => window.removeEventListener('m2v-open-settings', handler)
  }, []);

  // 侧边栏面板切换：ai 打开弹窗，settings 打开设置弹窗，demo 触发恢复示例
  const handlePanelChange = useCallback((panel: SidebarPanel) => {
    if (panel === 'ai') {
      setAiTypesetAutoRun(false);
      setIsAiTypesetOpen(true);
      return;
    }
    if (panel === 'library') {
      setIsLibraryOpen(true);
      return;
    }
    if (panel === 'settings') {
      setIsSettingsOpen(true);
      return;
    }
    if (panel === 'demo') {
      handleRestoreDemo();
      return;
    }
    if (panel === 'help') {
      triggerGuide(mode);
      return;
    }
  }, [handleRestoreDemo, triggerGuide, mode]);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <AppHeader
        mode={mode}
        setMode={setMode}
        accent={accent}
        setTheme={setTheme}
        onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        onWidthChange={handleWidthChange}
      />

      {/* 主体：侧边栏 + 按模式渲染 */}
      <div className="flex min-h-0 flex-1">
        <Sidebar activePanel={activePanel} onPanelChange={handlePanelChange} onOpenAiTypeset={() => { setAiTypesetAutoRun(true); setIsAiTypesetOpen(true) }} onOpenExtension={() => setIsExtensionOpen(true)} onCopyGuide={handleCopyAiGuide} />
      
        {/* key={mode} 保证切换模式后错误状态自动重置 */}
        <ErrorBoundary key={mode} fallback={<ModeErrorFallback />}>
          <Suspense fallback={<ModeLoading />}>
            {mode === "article" && (
              <ArticleMode
                markdown={articleMarkdown}
                setMarkdown={setArticleMarkdown}
                colors={colors}
                onToast={showToast}
              />
            )}
            {mode === "html" && (
              <HtmlMode html={html} setHtml={setHtml} onToast={showToast} />
            )}
            {mode === "document" && (
              <DocumentMode
                markdown={documentMarkdown}
                setMarkdown={setDocumentMarkdown}
                colors={colors}
                settings={documentSettings}
                updateSettings={updateDocumentSettings}
                onToast={showToast}
              />
            )}
            {mode === "card" && (
              <CardMode
                markdown={cardMarkdown}
                setMarkdown={setCardMarkdown}
                colors={colors}
                platform={platform === "xiaohongshu" ? platform : "xiaohongshu"}
                onToast={showToast}
              />
            )}
        </Suspense>
      </ErrorBoundary>
      </div>

      {/* AI 排版弹窗 */}
      {isAiTypesetOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs px-4">
          <ErrorBoundary fallback={<div className="rounded-lg border border-red-200 bg-white p-6 text-center text-sm text-red-600">AI 排版组件加载异常，请刷新页面重试</div>}>
            <ResizablePanel defaultWidth={768} defaultHeight={660} minWidth={400} minHeight={300}>
              <AiTypesetPanel mode={mode} onToast={showToast} onClose={() => { setIsAiTypesetOpen(false); setAiTypesetAutoRun(false) }} autoRun={aiTypesetAutoRun} />
            </ResizablePanel>
          </ErrorBoundary>
        </div>
      )}

      {/* 组件库弹窗 */}
      {isExtensionOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs px-4">
          <ErrorBoundary fallback={<div className="rounded-lg border border-red-200 bg-white p-6 text-center text-sm text-red-600">组件库加载异常，请刷新页面重试</div>}>
            <ResizablePanel defaultWidth={900} defaultHeight={700} minWidth={500} minHeight={400}>
              <ExtensionPage onClose={() => setIsExtensionOpen(false)} />
            </ResizablePanel>
          </ErrorBoundary>
        </div>
      )}

      {/* 指令库弹窗（复用自由画布 PromptLibrary） */}
      <PromptLibrary
        mode={mode}
        open={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        onCopy={handleCopyPrompt}
        onToast={showToast}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
      <PrivacyModal
        isOpen={isPrivacyOpen}
        onClose={() => setIsPrivacyOpen(false)}
      />
      <Toast toast={toast} />

      <MobileDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        mode={mode}
        setMode={setMode}
        accent={accent}
        setTheme={setTheme}
        onTriggerGuide={() => triggerGuide(mode)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenPrivacy={() => setIsPrivacyOpen(true)}
        onRestoreDemo={handleRestoreDemo}
        onOpenAiTypeset={() => { setIsMobileMenuOpen(false); setAiTypesetAutoRun(false); setIsAiTypesetOpen(true) }}
      />

      {/* 浏览器兼容性警告（z-55，优先级高于用户指引 z-35） */}
      <BrowserCompatDialog />
    </div>
  );
}
