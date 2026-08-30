import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { components, unifiedComponents } from '@engine';
import type { UnifiedComponentDef } from '@engine/editor-components/unifiedRender';
import { renderPreview } from '@engine/editor-components/unifiedRender';
import { layoutModuleSpecs, layoutRendererByName } from '@engine/layout-modules';
import type { LayoutModuleSpec } from '@engine/layout-modules/types';
import { useAppStore } from '@/lib/appStore';
import { resolveTokens } from '@engine/tokens';
import type { BlockRenderContext } from '@engine/utils/blockRenderRegistry';
import { useStore } from '@/lib/store';
import { copyText } from '@/lib/clipboard';
import { Toast } from '@/components/ui/Toast';
import { X } from '@/components/ui/Icon';
import { LAYOUT_EXAMPLES, fallbackExample, categories } from './data';
import { getComponentCategory, deduplicateByStyle, parseExampleTag } from './utils';
import { SpotlightCard, type ComponentExample } from './SpotlightCard';

interface ExtensionPageProps {
  onClose: () => void;
}

export function ExtensionPage({ onClose }: ExtensionPageProps) {
  const colors = useStore((s) => s.colors);
  const [activeCategory, setActiveCategory] = useState('all');
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();
  const [examples, setExamples] = useState<ComponentExample[]>([]);

  useEffect(() => {
    const tagExamples = components
      .filter((c) => c.example)
      .map((def) => {
        try {
          const { attrs, body } = parseExampleTag(def.example!);
          return { def, rendered: def.render.call(def, attrs, body, colors), id: def.id };
        } catch (err) {
          console.error(`[ExtensionPage] render failed for ${def.id}:`, err);
          return { def, rendered: '', id: def.id };
        }
      });
    const unifiedExamples = unifiedComponents
      .filter((c) => c.spec.example)
      .map((def: UnifiedComponentDef) => {
        try {
          return { def, rendered: renderPreview(def, colors), id: def.spec.name };
        } catch (err) {
          console.error(`[ExtensionPage] render failed for ${def.spec.name}:`, err);
          return { def, rendered: '', id: def.spec.name };
        }
      });
    const themeTokens = useAppStore.getState().themeTokens;
    const tokensRaw = resolveTokens();
    const layoutCtx: BlockRenderContext = {
      t: colors,
      tokens: themeTokens ?? tokensRaw,
      tokensRaw,
      md: '',
      pTitleLevel1List: [],
    };
    const layoutExamples = layoutModuleSpecs.map((spec: LayoutModuleSpec) => {
      const example = LAYOUT_EXAMPLES[spec.name] ?? fallbackExample(spec.bodyFormat);
      const wrapperText = `:::${spec.name}\n${example}\n:::`;
      const lines = wrapperText.split('\n');
      const renderer = layoutRendererByName[spec.name];
      let html = '';
      if (renderer) {
        try {
          const result = renderer.render(layoutCtx, lines[0], lines, 0);
          html = result?.html ?? '';
        } catch (err) {
          console.error(`[ExtensionPage] layout render failed for ${spec.name}:`, err);
        }
      }
      const fakeDef = { spec: { name: spec.name, label: spec.label, bodyFormat: spec.bodyFormat, example }, render: () => '', renderLegacy: () => '' } as unknown as UnifiedComponentDef;
      return { def: fakeDef, rendered: html, id: `layout-${spec.name}` };
    });
    const all = [...tagExamples, ...unifiedExamples, ...layoutExamples]
    const deduplicated = deduplicateByStyle(all)
    setExamples(deduplicated);
  }, [colors]);

  const filtered = useMemo(() => {
    if (activeCategory === 'all') return examples;
    return examples.filter((e) => getComponentCategory(e.id) === activeCategory);
  }, [examples, activeCategory]);

  const handleCopy = useCallback(async (code: string) => {
    const ok = await copyText(code);
    if (ok) { setToast('已复制到剪贴板'); clearTimeout(toastTimer.current); toastTimer.current = setTimeout(() => setToast(null), 1500); }
  }, []);

  const handleInsert = useCallback((code: string) => {
    window.dispatchEvent(new CustomEvent('m2v-editor-insert', { detail: { text: code } }));
    setToast('已插入到编辑器'); clearTimeout(toastTimer.current); toastTimer.current = setTimeout(() => setToast(null), 1500);
  }, []);

  return (
    <div className="flex h-full flex-col bg-slate-50 overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3 shrink-0">
        <div>
          <h2 className="text-lg font-bold text-slate-800 m-0">扩展组件</h2>
          <p className="text-xs text-slate-400 m-0 mt-0.5">浏览和使用丰富的排版组件</p>
        </div>
        <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer">
          <X size={16} />
        </button>
      </div>
      <div className="flex gap-2 px-6 py-3 border-b border-slate-100 bg-white shrink-0 flex-wrap">
        {categories.map((cat) => (
          <button key={cat.key} onClick={() => setActiveCategory(cat.key)} className={`rounded-full px-4 py-1.5 text-xs font-medium border transition-all cursor-pointer ${activeCategory === cat.key ? 'bg-[var(--accent)] text-white border-[var(--accent)]' : 'bg-transparent text-slate-500 border-slate-200 hover:text-slate-700 hover:border-slate-300'}`}>
            {cat.label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="columns-2 gap-5 max-w-[900px] mx-auto max-[1024px]:columns-1">
          {filtered.map((ex) => (
            <SpotlightCard key={ex.id} example={ex} onCopy={handleCopy} onInsert={handleInsert} />
          ))}
        </div>
      </div>
      <Toast toast={toast ? { message: toast, key: Date.now() } : null} />
    </div>
  );
}
