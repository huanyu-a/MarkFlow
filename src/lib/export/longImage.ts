import { elementToBlob, downloadBlob } from '../exportImage'

export interface LongImageOptions {
  /** Export scale factor, default 2 */
  scale?: number
  /** Background color, default white */
  backgroundColor?: string
  /** Filename without extension */
  filename?: string
}

/**
 * Export a DOM element as a long image (PNG).
 * Used for 长图文 mode to export the full article as a single tall image.
 */
export async function exportLongImage(
  element: HTMLElement,
  options: LongImageOptions = {},
): Promise<void> {
  const {
    scale = 2,
    backgroundColor = '#ffffff',
    filename = 'article',
  } = options

  const blob = await elementToBlob(element, { scale, backgroundColor })
  downloadBlob(blob, `${filename}-${Date.now()}.png`)
}
