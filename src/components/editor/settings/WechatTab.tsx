import { Input } from '@/components/ui/Input'

export interface WechatDraftForm {
  appId: string
  appSecret: string
  thumbMediaId: string
  coverImageUrl: string
  publishEndpoint: string
}

interface WechatTabProps {
  form: WechatDraftForm
  onChange: (patch: Partial<WechatDraftForm>) => void
}

export function WechatTab({ form, onChange }: WechatTabProps) {
  return (
    <div className="rounded-lg bg-slate-50 p-4 border border-slate-100 flex flex-col gap-3">
      <div className="text-[13px] leading-relaxed text-slate-500 mb-1">
        <p className="font-semibold text-slate-700">公众号草稿箱发布</p>
        <p>配置后点击长图文工具栏的「发布到草稿箱」，会直接调用本地发布服务创建草稿。</p>
      </div>
      <div className="grid grid-cols-1 gap-2.5">
        <div className="flex flex-col gap-1">
          <label className="text-[12px] font-medium text-slate-600">AppID</label>
          <Input value={form.appId} onChange={(e) => onChange({ appId: e.target.value })} placeholder="wx..." />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[12px] font-medium text-slate-600">AppSecret</label>
          <Input type="password" value={form.appSecret} onChange={(e) => onChange({ appSecret: e.target.value })} placeholder="仅存当前会话内存" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[12px] font-medium text-slate-600">封面素材 thumb_media_id（可选）</label>
          <Input value={form.thumbMediaId} onChange={(e) => onChange({ thumbMediaId: e.target.value })} placeholder="留空则自动上传封面图" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[12px] font-medium text-slate-600">封面图 URL（可选）</label>
          <Input value={form.coverImageUrl} onChange={(e) => onChange({ coverImageUrl: e.target.value })} placeholder="https://.../cover.jpg；留空则使用正文第一张图片" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[12px] font-medium text-slate-600">发布服务端点</label>
          <Input value={form.publishEndpoint} onChange={(e) => onChange({ publishEndpoint: e.target.value })} className="font-mono text-[12px]" />
        </div>
      </div>
    </div>
  )
}
