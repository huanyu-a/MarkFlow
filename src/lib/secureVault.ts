// 图床密钥「加密保险箱」（纯前端，基于浏览器原生 Web Crypto API）。
//
// 设计目标：在零后端约束下，让用户可选地「记住」图床密钥而不必明文落盘。
//   1. 用 PBKDF2(SHA-256) 从用户口令派生 AES-GCM-256 密钥；
//   2. 每次加密生成随机 salt 与 iv，密文连同 salt/iv 一起以 base64 存入 localStorage；
//   3. 解密时口令错误会因 GCM 认证标签校验失败而直接抛错，天然具备「口令错误」检测能力。
//
// 注意：仅加密真正敏感的字段（AK/SK/token），region/bucket 等非敏感配置仍由 store 正常持久化。
//
// 安全说明（M6）：
//   - 密文存 localStorage，可被同域脚本或恶意扩展读取，存在离线爆破、版本回滚、密文替换风险。
//   - decryptFromVault 对 VaultBlob 做运行时校验（字段存在、base64 字符集、版本号匹配），
//     防止密文被篡改后导致解密流程异常。
//   - UI 层应明确提示用户 localStorage 密文仍可能被同域脚本读取。

const VAULT_KEY = 'm2v-secret-vault'
// 迭代次数：在安全性与移动端解密耗时之间取平衡
const PBKDF2_ITERATIONS = 250_000
const SALT_BYTES = 16
const IV_BYTES = 12

const VAULT_VERSION = 1
const BASE64_REGEX = /^[A-Za-z0-9+/]*={0,2}$/

interface VaultBlob {
  v: 1
  salt: string // base64
  iv: string   // base64
  data: string // base64 ciphertext
}

/** 保险箱中加密保存的敏感字段结构 */
export interface VaultSecrets {
  smms?: { token: string }
  oss?: { accessKeyId: string; accessKeySecret: string }
  cos?: { SecretId: string; SecretKey: string }
}

function toBase64(bytes: Uint8Array): string {
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin)
}

function fromBase64(b64: string): Uint8Array<ArrayBuffer> {
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes
}

async function deriveKey(passphrase: string, salt: Uint8Array<ArrayBuffer>): Promise<CryptoKey> {
  const enc = new TextEncoder()
  const baseKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey'],
  )
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

/**
 * 当前是否为安全上下文（HTTPS 或 localhost）。
 * 非安全上下文下 crypto.subtle 不可用，无法加密保存（H10）。
 */
export function isSecureContext(): boolean {
  if (typeof window === 'undefined') return false
  return window.isSecureContext
}

/** 当前环境是否支持 Web Crypto（需安全上下文：https 或 localhost） */
export function isCryptoAvailable(): boolean {
  return (
    isSecureContext() &&
    typeof crypto !== 'undefined' &&
    !!crypto.subtle &&
    typeof localStorage !== 'undefined'
  )
}

/** 本地是否已存在加密保险箱 */
export function hasVault(): boolean {
  return typeof localStorage !== 'undefined' && !!localStorage.getItem(VAULT_KEY)
}

/** 清除加密保险箱 */
export function clearVault(): void {
  if (typeof localStorage !== 'undefined') localStorage.removeItem(VAULT_KEY)
}

/**
 * 校验 VaultBlob 结构完整性（M6）。
 * 检查字段存在、版本号匹配、base64 字符集合法，防止密文被篡改或替换后导致解密流程异常。
 */
function validateVaultBlob(blob: unknown): blob is VaultBlob {
  if (typeof blob !== 'object' || blob === null) return false
  const b = blob as Record<string, unknown>
  if (b.v !== VAULT_VERSION) return false
  if (typeof b.salt !== 'string' || !BASE64_REGEX.test(b.salt)) return false
  if (typeof b.iv !== 'string' || !BASE64_REGEX.test(b.iv)) return false
  if (typeof b.data !== 'string' || !BASE64_REGEX.test(b.data)) return false
  // iv 长度应为 12 字节（16 字符 base64）
  try {
    if (fromBase64(b.iv).length !== IV_BYTES) return false
  } catch {
    return false
  }
  return true
}

/** 用口令加密敏感字段并写入保险箱 */
export async function encryptToVault(secrets: VaultSecrets, passphrase: string): Promise<void> {
  if (!isCryptoAvailable()) throw new Error('当前环境不支持加密存储（需 HTTPS 或 localhost）')
  const enc = new TextEncoder()
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES))
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES))
  const key = await deriveKey(passphrase, salt)
  const cipher = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(JSON.stringify(secrets)),
  )
  const blob: VaultBlob = {
    v: VAULT_VERSION,
    salt: toBase64(salt),
    iv: toBase64(iv),
    data: toBase64(new Uint8Array(cipher)),
  }
  localStorage.setItem(VAULT_KEY, JSON.stringify(blob))
}

/** 用口令解密保险箱，口令错误或密文损坏时抛错 */
export async function decryptFromVault(passphrase: string): Promise<VaultSecrets> {
  if (!isCryptoAvailable()) throw new Error('当前环境不支持加密存储（需 HTTPS 或 localhost）')
  const raw = localStorage.getItem(VAULT_KEY)
  if (!raw) throw new Error('没有已保存的加密密钥')

  // M6: 运行时校验 VaultBlob 结构，防止密文被篡改
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error('加密密钥数据已损坏（JSON 解析失败）')
  }
  if (!validateVaultBlob(parsed)) {
    throw new Error('加密密钥数据已损坏或格式不兼容')
  }

  const blob = parsed as VaultBlob
  const salt = fromBase64(blob.salt)
  const iv = fromBase64(blob.iv)
  const key = await deriveKey(passphrase, salt)
  // 口令错误会在此处因 GCM 认证失败而抛出 DOMException
  const plainBuf = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    fromBase64(blob.data),
  )
  return JSON.parse(new TextDecoder().decode(plainBuf)) as VaultSecrets
}

// ================================================================
// 口令强度评估（M7）：提示而非强制
// ================================================================

export interface PassphraseAssessment {
  level: 'weak' | 'fair' | 'strong'
  label: string
}

/**
 * 评估口令强度（M7）。
 * 采用"提示而非强制"策略：弱口令显示警告但不阻断，仅对极弱口令（如 123456）给出明显提示。
 * 最小长度建议 6 位，低于 6 位视为 weak。
 */
export function assessPassphraseStrength(passphrase: string): PassphraseAssessment {
  const len = passphrase.length
  if (len === 0) return { level: 'weak', label: '口令为空' }

  const hasLower = /[a-z]/.test(passphrase)
  const hasUpper = /[A-Z]/.test(passphrase)
  const hasDigit = /\d/.test(passphrase)
  const hasSymbol = /[^a-zA-Z0-9]/.test(passphrase)
  const variety = [hasLower, hasUpper, hasDigit, hasSymbol].filter(Boolean).length

  // 极弱：长度 < 6 或常见弱口令
  if (len < 6 || /^(123456|password|qwerty|111111|000000|abc123)$/i.test(passphrase)) {
    return { level: 'weak', label: '口令极弱，极易被爆破' }
  }

  // 弱：长度 6-7 且字符种类 ≤ 2
  if (len < 8 && variety <= 2) {
    return { level: 'weak', label: '口令较弱' }
  }

  // 一般：长度 8+ 且种类 2-3
  if (len >= 8 && variety >= 2 && variety < 4) {
    return { level: 'fair', label: '口令强度一般' }
  }

  // 强：长度 8+ 且种类 ≥ 3，或长度 12+
  if ((len >= 8 && variety >= 3) || len >= 12) {
    return { level: 'strong', label: '口令强度良好' }
  }

  return { level: 'fair', label: '口令强度一般' }
}
