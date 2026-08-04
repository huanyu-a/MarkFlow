import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ImageHostTab } from './ImageHostTab'
import type { HostForm } from './ImageHostTab'

const baseForm: HostForm = {
  activeType: 'local',
  smmsToken: '',
  ossRegion: '',
  ossKeyId: '',
  ossKeySecret: '',
  ossBucket: '',
  cosSecretId: '',
  cosSecretKey: '',
  cosBucket: '',
  cosRegion: '',
  sendCredentials: false,
}

describe('ImageHostTab', () => {
  it('renders local mode description by default', () => {
    render(
      <ImageHostTab
        form={baseForm}
        allowIntranet={false}
        needsUnlock={false}
        cryptoOk={true}
        secureContext={true}
        vaultExists={false}
        remember={false}
        passphrase=""
        saveError=""
        unlockPass=""
        unlocking={false}
        unlockError=""
        onFormChange={() => {}}
        onRememberChange={() => {}}
        onPassphraseChange={() => {}}
        onUnlockPassChange={() => {}}
        onUnlock={() => {}}
        onAllowIntranetChange={() => {}}
      />,
    )
    expect(screen.getByText('本地 IndexedDB 模式')).toBeInTheDocument()
  })

  it('switches between host types', async () => {
    const onChange = vi.fn()
    render(
      <ImageHostTab
        form={baseForm}
        allowIntranet={false}
        needsUnlock={false}
        cryptoOk={true}
        secureContext={true}
        vaultExists={false}
        remember={false}
        passphrase=""
        saveError=""
        unlockPass=""
        unlocking={false}
        unlockError=""
        onFormChange={onChange}
        onRememberChange={() => {}}
        onPassphraseChange={() => {}}
        onUnlockPassChange={() => {}}
        onUnlock={() => {}}
        onAllowIntranetChange={() => {}}
      />,
    )
    fireEvent.click(screen.getByText('Sm.ms（已收费）'))
    expect(onChange).toHaveBeenCalledWith('activeType', 'smms')
  })
})
