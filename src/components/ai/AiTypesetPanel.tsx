import { usePanelFullscreen } from '@/components/ui/ResizablePanel'
import { AiStar, Undo2, Redo2, Maximize2, Minimize2, X } from '@/components/ui/Icon'
import { UI_LABELS } from '@/lib/uiLabels'
import { useAiTypeset } from './hooks/useAiTypeset'
import { PreviewView } from './PreviewView'
import { EmptyState } from './EmptyState'

interface AiTypesetPanelProps {
  mode: 'article' | 'document' | 'card' | 'html'
  onToast: (msg: string) => void
  onClose: () => void
  /** 打开面板后自动开始 AI 排版 */
  autoRun?: boolean
}

export function AiTypesetPanel({ mode, onToast, onClose, autoRun }: AiTypesetPanelProps) {
  const { fullscreen, toggleFullscreen } = usePanelFullscreen()
  const aiTypeset = useAiTypeset(mode, onToast, autoRun)

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-4 py-3">
        <h3 className="flex items-center gap-1.5 text-sm font-bold text-slate-800">
          <AiStar size={15} className="text-[var(--accent)]" />
          {UI_LABELS.aiTypeset.title}
        </h3>
        {/* 撤销/重做按钮 */}
        <div className="flex items-center gap-1">
          <button
            onClick={aiTypeset.handleUndo}
            disabled={!aiTypeset.canUndo}
            title="撤销"
            className={`rounded p-1.5 transition-colors cursor-pointer ${
              aiTypeset.canUndo
                ? 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                : 'text-slate-200 cursor-not-allowed'
            }`}
          >
            <Undo2 size={15} />
          </button>
          <button
            onClick={aiTypeset.handleRedo}
            disabled={!aiTypeset.canRedo}
            title="重做"
            className={`rounded p-1.5 transition-colors cursor-pointer ${
              aiTypeset.canRedo
                ? 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                : 'text-slate-200 cursor-not-allowed'
            }`}
          >
            <Redo2 size={15} />
          </button>
          <button
            onClick={toggleFullscreen}
            title={fullscreen ? '退出全屏' : '全屏'}
            className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
          >
            {fullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
          <button onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer">
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        {aiTypeset.hasResult ? (
          <PreviewView
            streamingResult={aiTypeset.streamingResult}
            isRunning={aiTypeset.isRunning}
            previewMode={aiTypeset.previewMode}
            beforeContent={aiTypeset.beforeContent}
            colors={aiTypeset.colors}
            themeTokens={aiTypeset.themeTokens}
            onApply={aiTypeset.handleApply}
            onDiscard={aiTypeset.handleDiscard}
            onRerun={aiTypeset.handleRun}
            onChangeMode={aiTypeset.setPreviewMode}
          />
        ) : (
          <EmptyState
            isRunning={aiTypeset.isRunning}
            configReady={aiTypeset.configReady}
            error={aiTypeset.error}
            onRun={aiTypeset.handleRun}
            onStop={aiTypeset.handleStop}
          />
        )}
      </div>
    </div>
  )
}
