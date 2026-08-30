import { useState, useEffect } from 'react'
import { useStore, type ImageHostConfig } from '@/lib/store'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Send } from '@/components/ui/Icon'
import {
  hasVault,
  isCryptoAvailable,
  encryptToVault,
  decryptFromVault,
  clearVault,
  isSecureContext,
} from '@/lib/secureVault'
import { ImageHostTab, type HostForm, buildForm, configHasSecret } from './settings/ImageHostTab'
import { AiTab } from './settings/AiTab'
import { WechatTab, type WechatDraftForm } from './settings/WechatTab'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

type SettingsTab = 'imageHost' | 'ai' | 'wechat'

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const imageHostConfig = useStore((s) => s.imageHostConfig)
  const setImageHostConfig = useStore((s) => s.setImageHostConfig)
  const allowIntranetResources = useStore((s) => s.allowIntranetResources)
  const setAllowIntranetResources = useStore((s) => s.setAllowIntranetResources)
  const aiConfig = useStore((s) => s.aiConfig)
  const wechatDraftConfig = useStore((s) => s.wechatDraftConfig)
  const setWeChatDraftConfig = useStore((s) => s.setWeChatDraftConfig)

  const [activeTab, setActiveTab] = useState<SettingsTab>('imageHost')

  // 临时状态，用户点击保存时才写入 store
  const [form, setForm] = useState<HostForm>(() => buildForm(imageHostConfig))

  const cryptoOk = isCryptoAvailable()
  const secureContext = isSecureContext()

  // 加密保险箱相关状态
  const [vaultExists, setVaultExists] = useState(false)
  const [remember, setRemember] = useState(false)
  const [passphrase, setPassphrase] = useState('')
  const [saveError, setSaveError] = useState('')
  // 解锁相关状态
  const [unlockPass, setUnlockPass] = useState('')
  const [unlocking, setUnlocking] = useState(false)
  const [unlockError, setUnlockError] = useState('')

  const [wechatForm, setWeChatForm] = useState<WechatDraftForm>({
    appId: wechatDraftConfig.appId ?? '',
    appSecret: wechatDraftConfig.appSecret ?? '',
    thumbMediaId: wechatDraftConfig.thumbMediaId ?? '',
    coverImageUrl: wechatDraftConfig.coverImageUrl ?? '',
    publishEndpoint: wechatDraftConfig.publishEndpoint ?? '/__markflow_wechat_publish',
  })
  // H2/H3: 内网资源开关（本地临时状态，保存时写入 store）
  const [allowIntranet, setAllowIntranet] = useState(allowIntranetResources)

  // 每次打开弹窗时，从 store 重新初始化表单，避免「取消后重开看到上次未保存的脏值」。
  // 组件常驻挂载（hooks 之后才 return null），故必须在 isOpen 切换时重置。
  // 解锁成功后 imageHostConfig 变化也会触发此处，从而把解密出的密钥自动回填表单。
  useEffect(() => {
    if (!isOpen) return
    setForm(buildForm(imageHostConfig))
    const exists = hasVault()
    setVaultExists(exists)
    setRemember(exists) // 已有保险箱时默认保持「记住密钥」勾选
    setPassphrase('')
    setUnlockPass('')
    setUnlockError('')
    setSaveError('')

    setAllowIntranet(allowIntranetResources)
    setWeChatForm({
      appId: wechatDraftConfig.appId ?? '',
      appSecret: wechatDraftConfig.appSecret ?? '',
      thumbMediaId: wechatDraftConfig.thumbMediaId ?? '',
      coverImageUrl: wechatDraftConfig.coverImageUrl ?? '',
      publishEndpoint: wechatDraftConfig.publishEndpoint ?? '/__markflow_wechat_publish',
    })
  }, [isOpen, imageHostConfig, allowIntranetResources, wechatDraftConfig.appId, wechatDraftConfig.appSecret, wechatDraftConfig.thumbMediaId, wechatDraftConfig.coverImageUrl, wechatDraftConfig.publishEndpoint])

  if (!isOpen) return null

  // 本地存在加密保险箱，但当前内存中尚无密钥 → 需要解锁
  const needsUnlock = vaultExists && !configHasSecret(imageHostConfig)

  const updateFormField = <K extends keyof HostForm>(key: K, value: HostForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  // 用口令解锁保险箱，将密钥合并回内存配置（保留现有 region/bucket）
  const handleUnlock = async () => {
    setUnlockError('')
    setUnlocking(true)
    try {
      const secrets = await decryptFromVault(unlockPass)
      setImageHostConfig({
        smms: { token: secrets.smms?.token || '' },
        oss: {
          region: imageHostConfig.oss?.region || '',
          bucket: imageHostConfig.oss?.bucket || '',
          accessKeyId: secrets.oss?.accessKeyId || '',
          accessKeySecret: secrets.oss?.accessKeySecret || '',
        },
        cos: {
          Bucket: imageHostConfig.cos?.Bucket || '',
          Region: imageHostConfig.cos?.Region || '',
          SecretId: secrets.cos?.SecretId || '',
          SecretKey: secrets.cos?.SecretKey || '',
        },
      })
      setUnlockPass('')
      // 表单会因 imageHostConfig 变化经由上面的 useEffect 自动重填
    } catch {
      setUnlockError('口令错误或数据已损坏，请重试')
    } finally {
      setUnlocking(false)
    }
  }

  const handleSave = async () => {
    if (activeTab === 'wechat') {
      setWeChatDraftConfig({
        appId: wechatForm.appId.trim(),
        appSecret: wechatForm.appSecret,
        thumbMediaId: wechatForm.thumbMediaId.trim(),
        coverImageUrl: wechatForm.coverImageUrl.trim(),
        publishEndpoint: wechatForm.publishEndpoint.trim() || '/__markflow_wechat_publish',
      })
      onClose()
      return
    }
    if (remember && cryptoOk) {
      if (passphrase) {
        // 用新口令加密保存（覆盖旧保险箱）
        try {
          await encryptToVault(
            {
              smms: { token: form.smmsToken },
              oss: { accessKeyId: form.ossKeyId, accessKeySecret: form.ossKeySecret },
              cos: { SecretId: form.cosSecretId, SecretKey: form.cosSecretKey },
            },
            passphrase,
          )
        } catch (e) {
          setSaveError(`加密保存失败：${e instanceof Error ? e.message : '未知错误'}`)
          return // 不关闭，让用户重试
        }
      } else if (!vaultExists) {
        // 想记住但既没填口令、也没有现成保险箱
        setSaveError('请输入用于加密的口令，或取消勾选「记住密钥」')
        return
      }
      // remember && 口令留空 && 已有保险箱：沿用现有保险箱，不重新加密
    } else {
      // 未勾选「记住密钥」（或环境不支持加密）：清除任何已存在的保险箱
      clearVault()
    }
    const patch: Partial<ImageHostConfig> = {
      activeType: form.activeType,
      smms: { token: form.smmsToken },
      oss: {
        region: form.ossRegion,
        accessKeyId: form.ossKeyId,
        accessKeySecret: form.ossKeySecret,
        bucket: form.ossBucket,
      },
      cos: {
        SecretId: form.cosSecretId,
        SecretKey: form.cosSecretKey,
        Bucket: form.cosBucket,
        Region: form.cosRegion,
      },
      sendCredentials: form.sendCredentials,
    }
    setImageHostConfig(patch)
    setAllowIntranetResources(allowIntranet)
    onClose()
  }

  return (
    <Dialog isOpen={isOpen} onClose={onClose} closeOnOverlay={false}>
      <div>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--accent)]"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
            设置
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭"
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-3 mb-1">
          <button
            onClick={() => setActiveTab('imageHost')}
            className={`px-3 py-1.5 rounded-md text-[12px] font-semibold transition-colors cursor-pointer ${
              activeTab === 'imageHost'
                ? 'bg-[var(--accent)]/10 text-[var(--accent)]'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
            }`}
          >
            图床设置
          </button>
          <button
            onClick={() => setActiveTab('wechat')}
            className={`px-3 py-1.5 rounded-md text-[12px] font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'wechat'
                ? 'bg-[var(--accent)]/10 text-[var(--accent)]'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
            }`}
          >
            <Send size={13} /> 公众号发布
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`px-3 py-1.5 rounded-md text-[12px] font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'ai'
                ? 'bg-[var(--accent)]/10 text-[var(--accent)]'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
            }`}
          >
            AI 配置
          </button>
        </div>

        {/* Body */}
        <div className="mt-4 flex flex-col gap-4">
          {activeTab === 'imageHost' && (
            <ImageHostTab
              form={form}
              allowIntranet={allowIntranet}
              needsUnlock={needsUnlock}
              cryptoOk={cryptoOk}
              secureContext={secureContext}
              vaultExists={vaultExists}
              remember={remember}
              passphrase={passphrase}
              saveError={saveError}
              unlockPass={unlockPass}
              unlocking={unlocking}
              unlockError={unlockError}
              onFormChange={updateFormField}
              onRememberChange={setRemember}
              onPassphraseChange={setPassphrase}
              onUnlockPassChange={setUnlockPass}
              onUnlock={handleUnlock}
              onAllowIntranetChange={setAllowIntranet}
            />
          )}
          {activeTab === 'wechat' && (
            <WechatTab
              form={wechatForm}
              onChange={(patch) => setWeChatForm((v) => ({ ...v, ...patch }))}
            />
          )}
          {activeTab === 'ai' && (
            <AiTab
              apiUrl={aiConfig.apiUrl}
              apiKey={aiConfig.apiKey}
              model={aiConfig.model}
            />
          )}
        </div>

        {/* Footer */}
        <div className="mt-5 flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
          <Button variant="outline" onClick={onClose}>取消</Button>
          <Button variant="primary" onClick={handleSave}>保存配置</Button>
        </div>
      </div>
    </Dialog>
  )
}
