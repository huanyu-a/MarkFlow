import { UI_LABELS } from '@/lib/uiLabels'
import { AiStar, Send, X } from '@/components/ui/Icon'

interface EmptyStateProps {
  isRunning: boolean
  configReady: boolean
  error: string
  onRun: () => void
  onStop: () => void
}

export function EmptyState({ isRunning, configReady, error, onRun, onStop }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 p-4 overflow-y-auto h-full">
      {!configReady && (
        <div className="w-full rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-[12px] text-amber-700 flex items-start gap-2">
          <AiStar size={14} className="shrink-0 mt-0.5 text-amber-500" />
          <span>
            请先在<strong>「设置 → AI 配置」</strong>中配置 API 地址后使用（本地 API 可留空 Key）。
          </span>
        </div>
      )}
      <button
        onClick={isRunning ? onStop : onRun}
        className={`flex items-center justify-center gap-2 w-48 rounded-lg py-2.5 text-[13px] font-bold transition-all cursor-pointer ${
          isRunning
            ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
            : 'bg-[var(--accent)] text-white shadow-sm hover:opacity-90'
        }`}
      >
        {isRunning ? (
          <><X size={15} /> {UI_LABELS.aiTypeset.stopButton}</>
        ) : (
          <><Send size={15} /> {UI_LABELS.aiTypeset.runButton}</>
        )}
      </button>
      {error && (
        <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-[12px] text-red-600">
          {error}
        </div>
      )}
    </div>
  )
}
