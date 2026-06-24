export function firstContentElement(doc: Document): HTMLElement {
  return (
    doc.querySelector<HTMLElement>('body > div')
    || doc.querySelector<HTMLElement>('body > main')
    || doc.querySelector<HTMLElement>('body > section')
    || doc.body
  )
}

export function firstPreviewPage(doc: Document): HTMLElement | null {
  const pageNodes = Array.from(doc.querySelectorAll<HTMLElement>('.page, .slide, .card'))
  return pageNodes.find((node) => node.style.display !== 'none') || pageNodes[0] || null
}

export async function nextFrame(): Promise<void> {
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
}

export async function withScaleReset<T>(doc: Document, task: () => Promise<T>): Promise<T> {
  const oldZoom = doc.body.style.zoom
  const oldScale = doc.documentElement.style.getPropertyValue('--auto-scale')

  doc.body.style.zoom = '1'
  doc.documentElement.style.setProperty('--auto-scale', '1')

  try {
    return await task()
  } finally {
    doc.body.style.zoom = oldZoom
    if (oldScale) {
      doc.documentElement.style.setProperty('--auto-scale', oldScale)
    } else {
      doc.documentElement.style.removeProperty('--auto-scale')
    }
  }
}

export async function withVisiblePage<T>(
  pageNodes: HTMLElement[],
  visibleIndex: number,
  task: () => Promise<T>,
): Promise<T> {
  const originalStyles = pageNodes.map((node) => node.style.display)
  pageNodes.forEach((node, index) => {
    node.style.display = index === visibleIndex ? '' : 'none'
  })
  await nextFrame()

  try {
    return await task()
  } finally {
    pageNodes.forEach((node, index) => {
      node.style.display = originalStyles[index]
    })
  }
}
