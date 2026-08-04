import { useCallback, useRef, useState } from 'react';
import type { ComponentDef } from '@engine';
import type { UnifiedComponentDef } from '@engine/editor-components/unifiedRender';
import { sanitizeHtml } from '@/lib/htmlSanitizer';
import { viewDef } from './utils';

export interface ComponentExample {
  def: ComponentDef | UnifiedComponentDef;
  rendered: string;
  id: string;
}

export function SpotlightCard({ example, onCopy, onInsert }: { example: ComponentExample; onCopy: (code: string) => void; onInsert: (code: string) => void }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [showDetails, setShowDetails] = useState(false);
  const { def, rendered } = example;
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    card.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
    card.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
  }, []);
  const CopyIcon = () => (
    <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="5" width="9" height="9" rx="1.5" />
      <path d="M11 5V3.5A1.5 1.5 0 009.5 2h-6A1.5 1.5 0 002 3.5v6A1.5 1.5 0 003.5 11H5" />
    </svg>
  );
  return (
    <div ref={cardRef} className="group relative break-inside-avoid mb-5 inline-block w-full rounded-2xl bg-white border border-slate-200 shadow-sm cursor-default overflow-hidden" style={{ '--mouse-x': '50%', '--mouse-y': '50%' } as React.CSSProperties} onMouseMove={handleMouseMove}>
      <div className="absolute inset-0 z-[3] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none spotlight-glow" style={{ background: 'radial-gradient(350px circle at var(--mouse-x) var(--mouse-y), rgba(var(--accent-rgb,108,92,231),0.12), rgba(var(--accent-rgb,108,92,231),0.04) 40%, transparent 70%)' }} />
      <div className="relative z-[1]">
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-800">{viewDef(def).name}</span>
            <span className="text-[10px] font-mono text-[var(--accent)] bg-[var(--accent)]/8 px-1.5 py-0.5 rounded">{viewDef(def).tag}</span>
          </div>
          <div className="flex items-center gap-1.5">
            {viewDef(def).example && (
              <button onClick={() => onInsert(viewDef(def).example)} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-emerald-200 bg-emerald-50 text-[10px] text-emerald-600 cursor-pointer hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all">
                <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3v10M3 8h10" /></svg>
                插入
              </button>
            )}
            {viewDef(def).example && (
              <button onClick={() => onCopy(viewDef(def).example)} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-slate-200 bg-[var(--accent)]/5 text-[10px] text-[var(--accent)] cursor-pointer hover:bg-[var(--accent)] hover:text-white hover:border-[var(--accent)] transition-all">
                <CopyIcon />复制
              </button>
            )}
            {viewDef(def).example && (
              <button onClick={() => setShowDetails((v) => !v)} className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border text-[10px] cursor-pointer transition-all ${showDetails ? 'border-slate-300 bg-slate-100 text-slate-600' : 'border-slate-200 bg-white text-slate-400 hover:text-slate-600 hover:border-slate-300'}`}>
                <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-200 ${showDetails ? 'rotate-180' : ''}`}><path d="M4 6l4 4 4-4" /></svg>
              </button>
            )}
          </div>
        </div>
        <div className="px-5 pb-4">
          {rendered ? (
            <div className="preview-content max-w-full [&_section]:transition-opacity [&_section]:duration-150" dangerouslySetInnerHTML={{ __html: sanitizeHtml(rendered) }} />
          ) : (
            <div className="text-xs text-slate-300 italic py-8 text-center">暂无示例</div>
          )}
        </div>
        {showDetails && (
          <div className="px-5 pb-5 space-y-4 transition-all duration-150">
            {viewDef(def).example && (
              <div>
                <pre className="m-0 p-3 bg-[#1e1e2e] rounded-xl border border-white/5 text-[#e0e0e0] font-mono text-[11px] leading-6 overflow-auto whitespace-pre-wrap break-all max-h-40"><code>{viewDef(def).example}</code></pre>
              </div>
            )}
            {'attrs' in def && def.attrs && def.attrs.length > 0 && (
              <div className="rounded-lg border border-slate-200 overflow-hidden text-[11px]">
                <div className="grid grid-cols-[90px_1fr] bg-[var(--accent)]/5 font-semibold text-slate-400 text-[10px] uppercase tracking-wider">
                  <span className="px-2.5 py-1.5">属性</span>
                  <span className="px-2.5 py-1.5">说明</span>
                </div>
                {def.attrs.map((attr) => (
                  <div key={attr.key} className="grid grid-cols-[90px_1fr] border-t border-slate-100">
                    <span className="px-2.5 py-1.5 flex items-center">
                      <code className="font-mono text-[11px] text-[var(--accent)] bg-[var(--accent)]/8 px-1.5 py-0.5 rounded">{attr.key}</code>
                      {attr.required && <span className="text-[9px] text-red-500 ml-1 font-semibold">必填</span>}
                    </span>
                    <span className="px-2.5 py-1.5 text-slate-500 text-[11px] leading-5 flex flex-wrap items-center">
                      {attr.label}
                      {attr.default && <>, 默认 <code className="font-mono text-[10px] text-[var(--accent)] bg-[var(--accent)]/8 px-1 rounded">{attr.default}</code></>}
                      {(attr.options?.length ?? 0) > 0 && <>, 可选 {attr.options!.map((opt, i) => <code key={opt} className="font-mono text-[10px] text-[var(--accent)] bg-[var(--accent)]/8 px-1 rounded">{opt}{i < attr.options!.length - 1 ? ' / ' : ''}</code>)}</>}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {'spec' in def && (def.spec as any).fields && (def.spec as any).fields.length > 0 && (
              <div className="rounded-lg border border-slate-200 overflow-hidden text-[11px]">
                <div className="grid grid-cols-[90px_1fr] bg-[var(--accent)]/5 font-semibold text-slate-400 text-[10px] uppercase tracking-wider">
                  <span className="px-2.5 py-1.5">字段</span>
                  <span className="px-2.5 py-1.5">说明</span>
                </div>
                {(def.spec as any).fields.map((f: any) => (
                  <div key={f.name} className="grid grid-cols-[90px_1fr] border-t border-slate-100">
                    <span className="px-2.5 py-1.5 flex items-center">
                      <code className="font-mono text-[11px] text-[var(--accent)] bg-[var(--accent)]/8 px-1.5 py-0.5 rounded">{f.name}</code>
                      {f.required && <span className="text-[9px] text-red-500 ml-1 font-semibold">必填</span>}
                    </span>
                    <span className="px-2.5 py-1.5 text-slate-500 text-[11px] leading-5">{f.description}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
