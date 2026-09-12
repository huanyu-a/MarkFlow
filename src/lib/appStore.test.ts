import { describe, it, expect } from 'vitest'
import { useAppStore, stripImageHostSecrets, reconcileTheme } from './appStore'
import { getThemeProfile, getDefaultThemeProfile } from '@engine/themes'

describe('useAppStore', () => {
  it('should not persist colors derived from accent', () => {
    const partial = (useAppStore as unknown as { persist: { getOptions: () => { partialize?: (state: unknown) => unknown } } }).persist.getOptions().partialize
    if (!partial) throw new Error('partialize is undefined')

    const state = useAppStore.getState()
    const persisted = partial(state) as Record<string, unknown>

    expect(persisted).toHaveProperty('accent')
    expect(persisted).toHaveProperty('accentDark')
    expect(persisted).not.toHaveProperty('colors')
  })

  it('should strip secrets from image host config before persistence', () => {
    useAppStore.setState({
      imageHostConfig: {
        activeType: 'oss',
        oss: { region: 'cn-hangzhou', bucket: 'demo', accessKeyId: 'AK', accessKeySecret: 'SK' },
      },
    })

    const stripped = stripImageHostSecrets(useAppStore.getState().imageHostConfig)
    expect(stripped.oss?.accessKeyId).toBe('')
    expect(stripped.oss?.accessKeySecret).toBe('')
    expect(stripped.oss?.region).toBe('cn-hangzhou')
    expect(stripped.oss?.bucket).toBe('demo')
  })
})

describe('reconcileTheme（持久化主题冲突消解）', () => {
  it('profile 与配色一致时原样保留', () => {
    const profile = getThemeProfile('bytedance')!
    const r = reconcileTheme(profile.id, profile.accent, profile.dark)
    expect(r.profileId).toBe('bytedance')
    expect(r.profile.id).toBe('bytedance')
  })

  it('accent 与 profile 冲突：配色能反查到已知 profile 时切换到该 profile', () => {
    // 历史状态：profileId 还是 default，但配色已被「配色」Tab 改成紫罗兰
    const violet = getThemeProfile('violet')!
    const r = reconcileTheme('default', violet.accent, violet.dark)
    expect(r.profileId).toBe('violet')
    expect(r.profile.id).toBe('violet')
    expect(r.accent).toBe(violet.accent)
    expect(r.dark).toBe(violet.dark)
  })

  it('accent 与 profile 冲突且无法反查：置为 custom，排版轴沿用原 profile（P1-1 语义）', () => {
    const r = reconcileTheme('bytedance', '#112233', '#445566')
    expect(r.profileId).toBe('custom')
    expect(r.profile.id).toBe('bytedance')
    expect(r.accent).toBe('#112233')
    expect(r.dark).toBe('#445566')
  })

  it('大写 hex 与 profile 冲突时仍能按配色反查（旧配色 Tab 持久化大写值）', () => {
    const green = getThemeProfile('elegant-green')!
    const r = reconcileTheme('default', green.accent.toUpperCase(), green.dark.toUpperCase())
    expect(r.profileId).toBe('elegant-green')
    expect(r.profile.id).toBe('elegant-green')
  })

  it('持久化 profile id 无效：回落默认 profile，配色一致时不误判为 custom', () => {
    const def = getDefaultThemeProfile()
    const r = reconcileTheme('removed-profile-id', def.accent, def.dark)
    expect(r.profileId).toBe('default')
    expect(r.profile.id).toBe('default')
  })

  it('持久化为 custom：排版轴取默认 profile，配色原样保留', () => {
    const r = reconcileTheme('custom', '#112233', '#445566')
    expect(r.profileId).toBe('custom')
    expect(r.profile.id).toBe(getDefaultThemeProfile().id)
    expect(r.accent).toBe('#112233')
  })

  it('setThemeProfile 后 store 的 themeProfileId / accent / themeTokens 三者一致', () => {
    useAppStore.getState().setThemeProfile('violet')
    const s = useAppStore.getState()
    expect(s.themeProfileId).toBe('violet')
    expect(s.accent).toBe('#6c5ce7')
    expect(s.accentDark).toBe('#5a4bd1')
    expect(s.themeTokens.bodyFontSize).toBe('15px')

    // 还原为默认主题，避免污染其他用例
    useAppStore.getState().setThemeProfile('default')
    expect(useAppStore.getState().themeProfileId).toBe('default')
  })
})
