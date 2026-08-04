import { type ImageHostConfig } from '@/lib/store'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import {
  HardDrive,
  Cloud,
  Package,
  AlertTriangle,
  Shield,
} from '@/components/ui/Icon'
import {
  assessPassphraseStrength,
} from '@/lib/secureVault'

export type HostForm = {
  activeType: ImageHostConfig['activeType']
  smmsToken: string
  ossRegion: string
  ossKeyId: string
  ossKeySecret: string
  ossBucket: string
  cosSecretId: string
  cosSecretKey: string
  cosBucket: string
  cosRegion: string
  sendCredentials: boolean
}

/** 从图床配置构造表单初始值 */
export function buildForm(c: ImageHostConfig): HostForm {
  return {
    activeType: c.activeType,
    smmsToken: c.smms?.token || '',
    ossRegion: c.oss?.region || '',
    ossKeyId: c.oss?.accessKeyId || '',
    ossKeySecret: c.oss?.accessKeySecret || '',
    ossBucket: c.oss?.bucket || '',
    cosSecretId: c.cos?.SecretId || '',
    cosSecretKey: c.cos?.SecretKey || '',
    cosBucket: c.cos?.Bucket || '',
    cosRegion: c.cos?.Region || '',
    sendCredentials: c.sendCredentials ?? false,
  }
}

/** 当前内存配置中是否已含任意敏感密钥（用于判断是否需要解锁） */
export function configHasSecret(c: ImageHostConfig): boolean {
  return Boolean(
    c.smms?.token || c.oss?.accessKeyId || c.oss?.accessKeySecret || c.cos?.SecretId || c.cos?.SecretKey,
  )
}

interface ImageHostTabProps {
  form: HostForm
  allowIntranet: boolean
  needsUnlock: boolean
  cryptoOk: boolean
  secureContext: boolean
  vaultExists: boolean
  remember: boolean
  passphrase: string
  saveError: string
  unlockPass: string
  unlocking: boolean
  unlockError: string
  onFormChange: <K extends keyof HostForm>(key: K, value: HostForm[K]) => void
  onRememberChange: (v: boolean) => void
  onPassphraseChange: (v: string) => void
  onUnlockPassChange: (v: string) => void
  onUnlock: () => void
  onAllowIntranetChange: (v: boolean) => void
}

export function ImageHostTab({
  form,
  allowIntranet,
  needsUnlock,
  cryptoOk,
  secureContext,
  vaultExists,
  remember,
  passphrase,
  saveError,
  unlockPass,
  unlocking,
  unlockError,
  onFormChange,
  onRememberChange,
  onPassphraseChange,
  onUnlockPassChange,
  onUnlock,
  onAllowIntranetChange,
}: ImageHostTabProps) {
  return (
    <>
      <div>
        <label className="text-[13px] font-semibold text-slate-500 block mb-2">图片上传目的地</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {(
            [
              { type: 'local' as const, name: '本地 IndexedDB' },
              { type: 'catbox' as const, name: 'Catbox 免费图床' },
              { type: 'smms' as const, name: 'Sm.ms（已收费）' },
              { type: 'oss' as const, name: '阿里云 OSS' },
              { type: 'cos' as const, name: '腾讯云 COS' },
            ] as const
          ).map((item) => (
            <button
              key={item.type}
              onClick={() => onFormChange('activeType', item.type)}
              className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-center transition-all cursor-pointer ${
                form.activeType === item.type
                  ? 'border-[var(--accent)] bg-[var(--accent)]/5 text-[var(--accent)] font-semibold shadow-xs'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <span className="text-[12px]">{item.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 解锁横幅：本地已加密保存密钥但当前会话尚未解锁时显示 */}
      {needsUnlock && form.activeType !== 'local' && (
        <div className="rounded-lg border border-[var(--accent)]/30 bg-[var(--accent)]/5 p-3 flex flex-col gap-2">
          <div className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-700">
            <Shield size={15} className="text-[var(--accent)]" />
            已加密保存图床密钥，请输入口令解锁
          </div>
          <p className="text-[12px] text-slate-500">输入口令解锁后即可使用，无需重新填写密钥。</p>
          <div className="flex items-center gap-2">
            <Input
              type="password"
              placeholder="输入解锁口令"
              value={unlockPass}
              onChange={(e) => onUnlockPassChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && unlockPass && !unlocking) onUnlock()
              }}
              className="flex-1"
            />
            <Button variant="primary" onClick={onUnlock} disabled={unlocking || !unlockPass}>
              {unlocking ? '解锁中…' : '解锁'}
            </Button>
          </div>
          {unlockError && <p className="text-[12px] text-red-500">{unlockError}</p>}
        </div>
      )}

      <div className="min-h-[160px] rounded-lg bg-slate-50 p-4 border border-slate-100">
        {form.activeType === 'local' && (
          <div className="text-[13px] leading-relaxed text-slate-500">
            <p className="font-semibold text-slate-700 mb-1.5"><span className="inline-flex items-center gap-1.5"><HardDrive size={15} /> 本地 IndexedDB 模式</span></p>
            <ul className="list-disc pl-4 space-y-1">
              <li>无需任何第三方配置，直接将图片保存在浏览器本地数据库中。</li>
              <li>图片大小经 Canvas 压缩，性能流畅，对本地预览与 PDF 导出十分友好。</li>
              <li>注意：<strong className="text-amber-600 font-medium">由于本地图片为虚拟链接</strong>，直接复制 HTML 粘贴到微信公众号会导致图片失效（裂图），在公众号发布文章建议配置免费/付费图床。</li>
            </ul>
          </div>
        )}

        {form.activeType === 'catbox' && (
          <div className="text-[13px] leading-relaxed text-slate-500">
            <p className="font-semibold text-slate-700 mb-1.5"><span className="inline-flex items-center gap-1.5"><Cloud size={15} /> Catbox 免费图床</span></p>
            <ul className="list-disc pl-4 space-y-1">
              <li>无需注册、无需 API Key，上传的图片永久保存。</li>
              <li>上传时优先直连 Catbox；若当前环境有跨域限制，会自动回退到本地 dev 代理。</li>
              <li>适合公众号富文本、知识平台等需要公网图片链接的场景。</li>
            </ul>
          </div>
        )}

        {form.activeType === 'smms' && (
          <div className="flex flex-col gap-3">
            <div className="text-[13px] leading-relaxed text-slate-500 mb-1">
              <p className="font-semibold text-slate-700"><span className="inline-flex items-center gap-1.5"><Cloud size={15} /> Sm.ms 免费图床</span></p>
              <p>请先在 <a href="https://sm.ms/" target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] underline font-medium">Sm.ms 官网</a> 注册并获取 API Token 填入下方。</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-slate-600">API Token</label>
              <Input
                type="password"
                placeholder="输入 Sm.ms 秘钥 Token"
                value={form.smmsToken}
                onChange={(e) => onFormChange('smmsToken', e.target.value)}
                className="w-full"
              />
            </div>
          </div>
        )}

        {form.activeType === 'oss' && (
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 text-[13px] leading-relaxed text-slate-500 mb-1">
              <p className="font-semibold text-slate-700"><span className="inline-flex items-center gap-1.5"><Package size={15} /> 阿里云对象存储 (OSS)</span></p>
              <p>使用您的阿里云 Bucket 进行客户端直接上传。</p>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[12px] text-slate-600">Region (区域，如 oss-cn-hangzhou)</label>
              <Input value={form.ossRegion} onChange={(e) => onFormChange('ossRegion', e.target.value)} placeholder="oss-cn-hangzhou" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[12px] text-slate-600">Bucket Name (存储空间名称)</label>
              <Input value={form.ossBucket} onChange={(e) => onFormChange('ossBucket', e.target.value)} placeholder="my-bucket" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[12px] text-slate-600">AccessKey ID</label>
              <Input value={form.ossKeyId} onChange={(e) => onFormChange('ossKeyId', e.target.value)} placeholder="LTAI..." />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[12px] text-slate-600">AccessKey Secret</label>
              <Input type="password" value={form.ossKeySecret} onChange={(e) => onFormChange('ossKeySecret', e.target.value)} placeholder="Secret Key" />
            </div>
          </div>
        )}

        {form.activeType === 'cos' && (
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 text-[13px] leading-relaxed text-slate-500 mb-1">
              <p className="font-semibold text-slate-700"><span className="inline-flex items-center gap-1.5"><Package size={15} /> 腾讯云对象存储 (COS)</span></p>
              <p>使用您的腾讯云 Bucket 进行客户端直接上传。</p>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[12px] text-slate-600">Region (区域，如 ap-shanghai)</label>
              <Input value={form.cosRegion} onChange={(e) => onFormChange('cosRegion', e.target.value)} placeholder="ap-shanghai" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[12px] text-slate-600">Bucket Name (存储桶，含 AppId)</label>
              <Input value={form.cosBucket} onChange={(e) => onFormChange('cosBucket', e.target.value)} placeholder="my-bucket-125000" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[12px] text-slate-600">SecretId</label>
              <Input value={form.cosSecretId} onChange={(e) => onFormChange('cosSecretId', e.target.value)} placeholder="AKID..." />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[12px] text-slate-600">SecretKey</label>
              <Input type="password" value={form.cosSecretKey} onChange={(e) => onFormChange('cosSecretKey', e.target.value)} placeholder="Secret Key" />
            </div>
          </div>
        )}
      </div>

      {/* 记住密钥（加密保存）：仅在云图床且环境支持 Web Crypto 时可用 */}
      {form.activeType !== 'local' && cryptoOk && (
        <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 flex flex-col gap-2">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => onRememberChange(e.target.checked)}
              className="h-3.5 w-3.5 accent-[var(--accent)]"
            />
            <span className="text-[13px] font-medium text-slate-700 inline-flex items-center gap-1.5">
              <Shield size={14} className="text-[var(--accent)]" /> 记住密钥（用口令加密保存到本地）
            </span>
          </label>
          {remember && (
            <div className="flex flex-col gap-1">
              <Input
                type="password"
                placeholder={vaultExists ? '留空沿用旧口令，填写则重新加密' : '设置加密口令'}
                value={passphrase}
                onChange={(e) => onPassphraseChange(e.target.value)}
                className="w-full"
              />
              {passphrase && (
                <PassphraseStrength passphrase={passphrase} />
              )}
              <p className="text-[11px] text-slate-400">口令仅用于本地加密，不上传；遗忘需重新填写密钥。</p>
            </div>
          )}
          {saveError && <p className="text-[12px] text-red-500">{saveError}</p>}
        </div>
      )}

      {form.activeType !== 'local' && (
        <div className="text-[11px] leading-relaxed text-amber-600 bg-amber-50 rounded-lg p-3 border border-amber-100 flex items-start gap-1.5">
          <span className="shrink-0 mt-0.5"><AlertTriangle size={14} className="text-amber-600" /></span>
          <span>
            <strong>安全提示</strong>：本应用纯前端无后端。<strong>默认密钥仅存当前会话内存</strong>，刷新即清除。勾选「记住密钥」后会用口令加密保存在本地。请勿在公共计算机上配置生产环境密钥。
            {!secureContext && (
              <>
                <br />
                <strong>当前为非安全上下文（非 HTTPS）</strong>，Web Crypto 不可用，密钥仅在当前会话内存中保留，刷新即丢失。如需加密保存，请在 HTTPS 或 localhost 环境下使用。
              </>
            )}
          </span>
        </div>
      )}

      {/* 发送凭证开关 + 允许加载内网资源开关 */}
      {form.activeType !== 'local' && (
        <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 flex flex-col gap-2.5">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.sendCredentials}
              onChange={(e) => onFormChange('sendCredentials', e.target.checked)}
              className="h-3.5 w-3.5 accent-[var(--accent)]"
            />
            <span className="text-[12px] text-slate-600">
              导出时向图床域名发送凭证（Cookie）。仅依赖 Cookie 鉴权的私有图床需要开启，默认关闭。
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={allowIntranet}
              onChange={(e) => onAllowIntranetChange(e.target.checked)}
              className="h-3.5 w-3.5 accent-[var(--accent)]"
            />
            <span className="text-[12px] text-slate-600">
              允许加载内网资源（如 127.0.0.1、192.168.x.x）。企业内网部署场景可开启，默认关闭以防止 SSRF。
            </span>
          </label>
        </div>
      )}
    </>
  )
}

/** 口令强度提示组件（M7/H10）：提示而非强制，弱口令显示橙色警告 */
function PassphraseStrength({ passphrase }: { passphrase: string }) {
  const assessment = assessPassphraseStrength(passphrase)
  const colorClass =
    assessment.level === 'weak' ? 'text-orange-500' :
    assessment.level === 'fair' ? 'text-amber-500' :
    'text-green-600'
  return (
    <p className={`text-[11px] ${colorClass}`}>
      {assessment.label}。建议使用 8 位以上、含字母与数字的口令。
    </p>
  )
}
