import type { GsapHandle, GsapTween } from '../../core/gsap-detect'
import { defaultEdge, detectEdge, type DirectionMode, type Edge } from './direction'
import { prepareHost, restoreHost } from './host'

const TRANSFORM: Record<Edge, { x: number; y: number }> = {
  top: { x: 0, y: -100 },
  bottom: { x: 0, y: 100 },
  left: { x: -100, y: 0 },
  right: { x: 100, y: 0 },
}

export interface BlockSettings {
  duration: number
  delay: number
  ease: string
  color: string
  mode: DirectionMode
}

export function setupBlockHover(
  host: HTMLElement,
  gsap: GsapHandle,
  settings: BlockSettings,
): () => void {
  const restore = prepareHost(host)

  const bg = document.createElement('span')
  bg.setAttribute('aa-hover-bg', 'block')
  bg.setAttribute('aria-hidden', 'true')
  Object.assign(bg.style, {
    position: 'absolute',
    inset: '0',
    pointerEvents: 'none',
    background: settings.color,
    willChange: 'transform',
  })
  // Inserted as the first child so content paints over the bg by DOM order
  // alone — without this, broad selectors like `.host span { z-index: 1 }`
  // would also match the injected span, tie on z-index, and let the bg
  // (last child) cover the content. Absolutely-positioned children don't
  // consume grid/flex slots, so layout stays unaffected.
  host.insertBefore(bg, host.firstChild)

  const start = TRANSFORM[defaultEdge(settings.mode)]
  gsap.gsap.set(bg, { xPercent: start.x, yPercent: start.y })

  let active: GsapTween | null = null

  const onEnter = (event: MouseEvent): void => {
    const t = TRANSFORM[detectEdge(event, host, settings.mode)]
    active?.kill()
    active = gsap.gsap.fromTo(
      bg,
      { xPercent: t.x, yPercent: t.y },
      {
        xPercent: 0,
        yPercent: 0,
        duration: settings.duration,
        ease: settings.ease,
        delay: settings.delay,
        overwrite: true,
      },
    )
  }

  const onLeave = (event: MouseEvent): void => {
    const t = TRANSFORM[detectEdge(event, host, settings.mode)]
    active?.kill()
    active = gsap.gsap.to(bg, {
      xPercent: t.x,
      yPercent: t.y,
      duration: settings.duration,
      ease: settings.ease,
      overwrite: true,
    })
  }

  host.addEventListener('mouseenter', onEnter)
  host.addEventListener('mouseleave', onLeave)

  return () => {
    host.removeEventListener('mouseenter', onEnter)
    host.removeEventListener('mouseleave', onLeave)
    active?.kill()
    bg.remove()
    restoreHost(host, restore)
  }
}
