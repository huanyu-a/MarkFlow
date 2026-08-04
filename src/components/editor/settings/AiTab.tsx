import { useStore } from '@/lib/store'
import { Input } from '@/components/ui/Input'
import { UI_LABELS } from '@/lib/uiLabels'
import { AiStar } from '@/components/ui/Icon'

interface AiTabProps {
  apiUrl: string
  apiKey: string
  model: string
}

export function AiTab({ apiUrl, apiKey, model }: AiTabProps) {
  const setAiConfig = useStore((s) => s.setAiConfig)

  return (
    <div className="rounded-lg bg-slate-50 p-4 border border-slate-100 flex flex-col gap-3">
      <div className="text-[13px] leading-relaxed text-slate-500 mb-1">
        <p className="font-semibold text-slate-700 flex items-center gap-1.5"><AiStar size={15} className="text-[var(--accent)]" /> AI 排版配置</p>
        <p>支持 DeepSeek / Moonshot / 通义千问等 OpenAI 兼容协议，也支持本地 API 如 <code>http://127.0.0.1:20128/v1</code>。</p>
      </div>
      <div>
        <label className="text-[12px] font-medium text-slate-600">{UI_LABELS.aiTypeset.apiUrl}</label>
        <Input
          value={apiUrl}
          onChange={(e) => setAiConfig({ apiUrl: e.target.value, apiKey, model })}
          placeholder={UI_LABELS.aiTypeset.apiUrlPlaceholder}
          className="w-full mt-0.5"
        />
      </div>
      <div>
        <label className="text-[12px] font-medium text-slate-600">{UI_LABELS.aiTypeset.apiKey}</label>
        <Input
          type="password"
          value={apiKey}
          onChange={(e) => setAiConfig({ apiUrl, apiKey: e.target.value, model })}
          placeholder={UI_LABELS.aiTypeset.apiKeyPlaceholder}
          className="w-full mt-0.5"
        />
      </div>
      <div>
        <label className="text-[12px] font-medium text-slate-600">{UI_LABELS.aiTypeset.model}</label>
        <Input
          value={model}
          onChange={(e) => setAiConfig({ apiUrl, apiKey, model: e.target.value })}
          placeholder={UI_LABELS.aiTypeset.modelPlaceholder}
          className="w-full mt-0.5"
        />
      </div>
      <p className="text-[11px] text-slate-400">配置会自动保存到 IndexedDB。本地 API 地址可填 <code>http://127.0.0.1:20128/v1</code>，Key 可留空。</p>
    </div>
  )
}
