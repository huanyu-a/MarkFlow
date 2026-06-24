import { useCallback, useEffect, useRef, useState } from 'react'
import { useDebounce } from '@/lib/useDebounce'

interface EditorDocSync {
  /** 编辑器本地值（每次按键更新），作为 CodeEditor 的 value / 初始文档 */
  localValue: string
  /** 防抖后的值，用于渲染预览与回写 store */
  debouncedValue: string
  /** 编辑器 onChange 回调 */
  setLocalValue: (value: string) => void
  /** 外部重置信号：递增时 CodeEditor 应将最新 localValue 强制写入文档 */
  externalVersion: number
}

/** 根据最近输入间隔均值计算自适应延迟（ms） */
function computeAdaptiveDelay(intervals: number[], fallback: number): number {
  if (intervals.length < 2) return fallback
  const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length
  if (avg < 200) return 500   // 快速连续输入 → 降低渲染频率
  if (avg < 500) return 300   // 中速输入
  return 150                   // 慢速输入 → 提升响应感知
}

// store ↔ 编辑器 双向同步：
// - 本地输入防抖后回写 store，延迟根据输入速度自适应调节；
// - 用「最近一次回写到 store 的值」识别回写回声（纯值判定，无时序竞态），
//   避免回声把防抖旧值灌回编辑器导致丢字；
// - 仅真正的外部变更（恢复示例 / 示例版本刷新）才递增 externalVersion，通知编辑器覆盖文档。
export function useEditorDocSync(
  storeValue: string,
  setStoreValue: (value: string) => void,
  delay = 500,
): EditorDocSync {
  const [localValue, setLocalValueRaw] = useState(storeValue)
  const [externalVersion, setExternalVersion] = useState(0)
  // 最近一次由本组件回写到 store 的值（初始即 store 值），用于识别回声
  const lastWrittenRef = useRef(storeValue)
  // 输入速度追踪：最近 5 次输入间隔 + 上次变更时间戳
  const intervalsRef = useRef<number[]>([])
  const lastChangeRef = useRef(0)

  const setLocalValue = useCallback((value: string) => {
    const now = Date.now()
    const prev = lastChangeRef.current
    if (prev > 0) {
      const interval = now - prev
      intervalsRef.current = [...intervalsRef.current.slice(-4), interval]
    }
    lastChangeRef.current = now
    setLocalValueRaw(value)
  }, [])

  // 外部 store 变化（恢复示例 / 版本刷新）→ 同步到本地并通知编辑器
  useEffect(() => {
    if (storeValue === lastWrittenRef.current) return
    lastWrittenRef.current = storeValue
    setLocalValueRaw(storeValue)
    setExternalVersion((v) => v + 1)
  }, [storeValue])

  // 直接在渲染阶段计算延迟：setLocalValueRaw 触发的重渲染天然驱动重算
  const adaptiveDelay = computeAdaptiveDelay(intervalsRef.current, delay)

  const debouncedValue = useDebounce(localValue, adaptiveDelay)

  // 本地编辑（防抖后）→ 回写 store；与上次回写值相同则跳过，避免冗余写入与误标 dirty
  useEffect(() => {
    if (debouncedValue !== lastWrittenRef.current) {
      lastWrittenRef.current = debouncedValue
      setStoreValue(debouncedValue)
    }
  }, [debouncedValue, setStoreValue])

  return { localValue, debouncedValue, setLocalValue, externalVersion }
}
