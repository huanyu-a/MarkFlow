/**
 * 创建基于 IndexedDB 的 Zustand persist 自定义 storage。
 *
 * 特点：
 * - 突破 localStorage 5~10 MB 的容量限制，适合大文本持久化；
 * - 支持写入节流（throttleMs），避免每次按键都触发整 state 序列化与 DB 写入；
 * - API 兼容 zustand/middleware 的 StateStorage。
 *
 * 竞态处理（M9）：
 * - flush 标记 flushing 状态，避免同一 key 并发写入；
 * - setItem 在 flush 进行中时更新 pending 值，flush 完成后会检查并处理新值；
 * - getItem/removeItem 错误时 console.warn，便于诊断。
 *
 * 卸载保护（M10）：
 * - 注册 beforeunload 监听器，页面卸载前同步刷新所有待写入数据，防止最后 ~1s 编辑丢失。
 */
export function createIdbStorage(options: IdbStorageOptions): StateStorage {
  const { dbName, storeName, version = 1, throttleMs = 1000 } = options

  let dbPromise: Promise<IDBDatabase> | null = null
  const timers = new Map<string, ReturnType<typeof setTimeout>>()
  const pending = new Map<string, PendingWrite>()

  function getDB(): Promise<IDBDatabase> {
    if (dbPromise) return dbPromise
    if (typeof indexedDB === 'undefined') {
      return Promise.reject(new Error('IndexedDB is not supported in this environment'))
    }

    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName, version)
      request.onupgradeneeded = () => {
        const db = request.result
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName)
        }
      }
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
      request.onblocked = () => reject(new Error(`IndexedDB ${dbName} open blocked`))
    })

    return dbPromise
  }

  async function doWrite(key: string, value: string): Promise<void> {
    const db = await getDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite')
      const store = tx.objectStore(storeName)
      const req = store.put(value, key)
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error)
    })
  }

  async function flush(key: string): Promise<void> {
    const write = pending.get(key)
    if (!write || write.flushing) return // 已在写入中，避免并发
    write.flushing = true
    timers.delete(key)
    try {
      await doWrite(write.key, write.value)
    } catch (err) {
      // M9: 不再静默吞错，输出警告便于诊断
      console.warn(`[idbStorage] 写入失败 (${key}):`, err)
    }
    // 写入完成后检查是否有更新的值到达
    const current = pending.get(key)
    if (current === write) {
      // 没有更新的值，清理并 resolve
      pending.delete(key)
      write.resolve()
    } else if (current) {
      // 写入期间有更新的值到达：resolve 旧 promise，新值由其 timer 驱动 flush
      write.resolve()
    } else {
      // pending 已被 removeItem 清除，仅 resolve
      write.resolve()
    }
  }

  function scheduleFlush(key: string): void {
    const existing = timers.get(key)
    if (existing) clearTimeout(existing)
    const timer = setTimeout(() => {
      void flush(key)
    }, throttleMs)
    timers.set(key, timer)
  }

  // M10: 页面卸载前刷新所有待写入数据，防止最后 ~1s 编辑丢失
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
      // 同步触发所有 pending 的写入（不等待完成，浏览器会保留片刻让事务提交）
      for (const key of pending.keys()) {
        const write = pending.get(key)
        if (write && !write.flushing) {
          const timer = timers.get(key)
          if (timer) clearTimeout(timer)
          void flush(key)
        }
      }
    })
  }

  return {
    getItem: async (name: string) => {
      try {
        const db = await getDB()
        return await new Promise<string | null>((resolve, reject) => {
          const tx = db.transaction(storeName, 'readonly')
          const store = tx.objectStore(storeName)
          const req = store.get(name)
          req.onsuccess = () => {
            const result = req.result
            resolve(typeof result === 'string' ? result : null)
          }
          req.onerror = () => reject(req.error)
        })
      } catch (err) {
        // M9: 不再静默返回 null，输出警告便于诊断
        console.warn(`[idbStorage] 读取失败 (${name}):`, err)
        return null
      }
    },
    setItem: async (name: string, value: string) => {
      // 节流：合并同一 key 的连续写入，只保留最新值
      return new Promise<void>((resolve) => {
        const existing = pending.get(name)
        if (existing) {
          // 仅当旧 pending 未在写入中时 resolve 旧 promise
          // （写入中的 pending 由 flush 负责 resolve）
          if (!existing.flushing) {
            existing.resolve()
          }
        }
        pending.set(name, { key: name, value, resolve })
        scheduleFlush(name)
      })
    },
    removeItem: async (name: string) => {
      // 取消待写入
      const timer = timers.get(name)
      if (timer) {
        clearTimeout(timer)
        timers.delete(name)
      }
      const write = pending.get(name)
      if (write) {
        write.resolve()
        pending.delete(name)
      }
      try {
        const db = await getDB()
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction(storeName, 'readwrite')
          const store = tx.objectStore(storeName)
          const req = store.delete(name)
          req.onsuccess = () => resolve()
          req.onerror = () => reject(req.error)
        })
      } catch (err) {
        // M9: 不再静默吞错
        console.warn(`[idbStorage] 删除失败 (${name}):`, err)
      }
    },
  }
}

interface IdbStorageOptions {
  /** IndexedDB 数据库名 */
  dbName: string
  /** 对象仓库名 */
  storeName: string
  /** 数据库版本 */
  version?: number
  /** 写入节流间隔（毫秒） */
  throttleMs?: number
}

interface PendingWrite {
  key: string
  value: string
  resolve: () => void
  /** 是否正在写入中（防止并发 flush） */
  flushing?: boolean
}

interface StateStorage {
  getItem: (name: string) => string | null | Promise<string | null>
  setItem: (name: string, value: string) => void | Promise<void>
  removeItem: (name: string) => void | Promise<void>
}
