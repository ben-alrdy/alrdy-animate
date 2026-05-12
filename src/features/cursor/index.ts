import type { GsapInstance } from '../../core/gsap-detect'
import type { FeatureContext, FeatureModule } from '../../core/registry'

type QuickTo = (value: number) => void
type QuickToFactory = (target: Element, prop: string, vars?: Record<string, unknown>) => QuickTo
type GsapWithQuickTo = GsapInstance & { quickTo: QuickToFactory }

const DEFAULT_X_OFFSET = 6
const DEFAULT_Y_OFFSET = -140
const X_EDGE_OFFSET = -100
const Y_EDGE_OFFSET = -120
const EDGE_BUFFER = 16

const RESERVED_TRIGGER_PARTS = new Set(['offset'])

const SHOW_DURATION = 0.3
const HIDE_DURATION = 0.4
const FOLLOW_EASE = 'power3'
const SHOW_EASE = 'power2.out'
const HIDE_EASE = 'power2.in'
const OFFSET_EASE = 'power3'
const OFFSET_DURATION = 0.9

interface StyleSnapshot {
  position: string
  left: string
  top: string
  opacity: string
  visibility: string
  pointerEvents: string
  transform: string
}

function snapshot(el: HTMLElement): StyleSnapshot {
  return {
    position: el.style.position,
    left: el.style.left,
    top: el.style.top,
    opacity: el.style.opacity,
    visibility: el.style.visibility,
    pointerEvents: el.style.pointerEvents,
    transform: el.style.transform,
  }
}

function restore(el: HTMLElement, snap: StyleSnapshot): void {
  el.style.position = snap.position
  el.style.left = snap.left
  el.style.top = snap.top
  el.style.opacity = snap.opacity
  el.style.visibility = snap.visibility
  el.style.pointerEvents = snap.pointerEvents
  el.style.transform = snap.transform
}

function getCursorAttributes(trigger: Element): Record<string, string> {
  const result: Record<string, string> = {}
  for (const attr of Array.from(trigger.attributes)) {
    if (!attr.name.startsWith('aa-cursor-') || attr.name === 'aa-cursor-trigger') continue
    const part = attr.name.slice('aa-cursor-'.length)
    if (!part || RESERVED_TRIGGER_PARTS.has(part)) continue
    result[part] = attr.value
  }
  return result
}

function parseCursorOffset(
  value: string | null,
  cursorName: string,
  debug: boolean,
): [number, number] {
  if (!value) return [DEFAULT_X_OFFSET, DEFAULT_Y_OFFSET]
  const parts = value.trim().split(/\s+/)
  const warn = (reason: string): [number, number] => {
    if (debug) {
      console.warn(
        `[alrdy-animate] aa-cursor-offset on [aa-cursor${cursorName ? `="${cursorName}"` : ''}] ${reason}. Got "${value}". Falling back to defaults.`,
      )
    }
    return [DEFAULT_X_OFFSET, DEFAULT_Y_OFFSET]
  }
  if (parts.length !== 2) return warn('must be two space-separated numbers (xPercent yPercent)')
  const x = Number(parts[0])
  const y = Number(parts[1])
  if (!Number.isFinite(x) || !Number.isFinite(y)) return warn('values must be finite numbers')
  return [x, y]
}

interface CursorInstance {
  el: HTMLElement
  inner: HTMLElement
  cursorSnap: StyleSnapshot
  innerSnap: StyleSnapshot
  slotCache: Map<string, Element>
  lastAttributes: Record<string, string>
  currentTarget: Element | null
  isHiding: boolean
  pendingShowTrigger: HTMLElement | null
  xTo: QuickTo
  yTo: QuickTo
  applyEdgeOffsets: (x: number, y: number) => void
  updateContent: (trigger: Element) => void
  resetContent: () => void
  showCursor: () => void
  hideCursor: () => void
  destroy: () => void
}

function createCursorInstance(
  cursorEl: HTMLElement,
  cursorInner: HTMLElement,
  gsap: GsapWithQuickTo,
  xOffset: number,
  yOffset: number,
): CursorInstance {
  const cursorSnap = snapshot(cursorEl)
  const innerSnap = snapshot(cursorInner)
  const slotCache = new Map<string, Element>()

  const inst: CursorInstance = {
    el: cursorEl,
    inner: cursorInner,
    cursorSnap,
    innerSnap,
    slotCache,
    lastAttributes: {},
    currentTarget: null,
    isHiding: false,
    pendingShowTrigger: null,
    xTo: () => {},
    yTo: () => {},
    applyEdgeOffsets: () => {},
    updateContent: () => {},
    resetContent: () => {},
    showCursor: () => {},
    hideCursor: () => {},
    destroy: () => {},
  }

  const getSlot = (part: string): Element | null => {
    const cached = slotCache.get(part)
    if (cached) return cached
    const found = cursorEl.querySelector(`[aa-cursor-${part}]`)
    if (found) slotCache.set(part, found)
    return found
  }

  inst.updateContent = (trigger: Element): void => {
    const next = getCursorAttributes(trigger)
    const nextKeys = Object.keys(next)
    const sameAsLast =
      inst.currentTarget === trigger &&
      nextKeys.length === Object.keys(inst.lastAttributes).length &&
      nextKeys.every((k) => inst.lastAttributes[k] === next[k])
    if (sameAsLast) return

    for (const part of nextKeys) {
      const slot = getSlot(part)
      if (!slot) continue
      const value = next[part]
      if (part === 'image' || slot.tagName === 'IMG') {
        const img = slot as HTMLImageElement
        img.src = value
        img.alt = ''
      } else {
        slot.textContent = value
      }
    }

    inst.lastAttributes = next
    inst.currentTarget = trigger
  }

  inst.resetContent = (): void => {
    for (const part of Object.keys(inst.lastAttributes)) {
      const slot = getSlot(part)
      if (!slot) continue
      if (part === 'image' || slot.tagName === 'IMG') {
        slot.removeAttribute('src')
        slot.removeAttribute('alt')
      } else {
        slot.textContent = ''
      }
    }
    inst.lastAttributes = {}
    inst.currentTarget = null
  }

  gsap.set(cursorEl, {
    position: 'fixed',
    left: 0,
    top: 0,
    xPercent: xOffset,
    yPercent: yOffset,
    opacity: 0,
    pointerEvents: 'none',
  })
  gsap.set(cursorInner, { opacity: 0 })

  inst.xTo = gsap.quickTo(cursorEl, 'x', { ease: FOLLOW_EASE })
  inst.yTo = gsap.quickTo(cursorEl, 'y', { ease: FOLLOW_EASE })

  inst.applyEdgeOffsets = (x: number, y: number): void => {
    if (inst.isHiding) return
    const cursorEdgeThreshold = cursorEl.offsetWidth + EDGE_BUFFER
    const xPercent = x > window.innerWidth - cursorEdgeThreshold ? X_EDGE_OFFSET : xOffset
    const yPercent = y > window.innerHeight * 0.9 ? Y_EDGE_OFFSET : yOffset
    gsap.to(cursorEl, {
      xPercent,
      yPercent,
      duration: OFFSET_DURATION,
      ease: OFFSET_EASE,
    })
  }

  inst.showCursor = (): void => {
    gsap.to(cursorEl, { opacity: 1, duration: SHOW_DURATION, ease: SHOW_EASE })
    gsap.fromTo(
      cursorInner,
      { y: 0, rotation: 0, opacity: 0 },
      { y: 0, rotation: 0, opacity: 1, duration: SHOW_DURATION, ease: SHOW_EASE },
    )
  }

  inst.hideCursor = (): void => {
    inst.isHiding = true
    gsap.killTweensOf(cursorInner)
    const fallDistance = cursorInner.offsetHeight * 1.5
    const randomRotation = Math.random() * 20 - 10
    gsap.to(cursorEl, { opacity: 0, duration: HIDE_DURATION, ease: HIDE_EASE })
    gsap.to(cursorInner, {
      y: fallDistance,
      rotation: randomRotation,
      opacity: 0,
      duration: HIDE_DURATION,
      ease: HIDE_EASE,
      onComplete: () => {
        gsap.set(cursorInner, { y: 0, rotation: 0 })
        inst.resetContent()
        inst.isHiding = false
        const queued = inst.pendingShowTrigger
        if (queued) {
          inst.pendingShowTrigger = null
          const elUnderMouse = document.elementFromPoint(currentPointerX, currentPointerY)
          const stillOver =
            !!elUnderMouse && (queued === elUnderMouse || queued.contains(elUnderMouse))
          if (stillOver) {
            inst.currentTarget = queued
            inst.updateContent(queued)
            inst.showCursor()
          }
        }
      },
    })
  }

  inst.destroy = (): void => {
    gsap.killTweensOf(cursorEl)
    gsap.killTweensOf(cursorInner)
    inst.resetContent()
    restore(cursorEl, cursorSnap)
    restore(cursorInner, innerSnap)
  }

  return inst
}

let currentPointerX = 0
let currentPointerY = 0

const cursorFeature: FeatureModule = {
  name: 'cursor',
  requiredPlugins: [],
  init(ctx: FeatureContext): () => void {
    if (typeof window === 'undefined') return () => {}

    const cursorEls = Array.from(document.querySelectorAll<HTMLElement>('[aa-cursor]'))
    if (cursorEls.length === 0) return () => {}

    if (!window.matchMedia('(hover: hover)').matches) {
      for (const el of cursorEls) {
        el.style.opacity = '0'
        el.style.visibility = 'hidden'
        el.style.pointerEvents = 'none'
      }
      return () => {
        for (const el of cursorEls) {
          el.style.opacity = ''
          el.style.visibility = ''
          el.style.pointerEvents = ''
        }
      }
    }

    const gsap = ctx.gsap.gsap as GsapWithQuickTo
    const cursors = new Map<string, CursorInstance>()

    for (const el of cursorEls) {
      const name = el.getAttribute('aa-cursor') ?? ''
      if (cursors.has(name)) {
        if (ctx.debug) {
          console.warn(
            `[alrdy-animate] Multiple [aa-cursor${name ? `="${name}"` : ''}] elements found. Using the first.`,
          )
        }
        continue
      }
      const inner = el.querySelector<HTMLElement>(':scope > div')
      if (!inner) {
        if (ctx.debug) {
          console.warn(
            `[alrdy-animate] Cursor element [aa-cursor${name ? `="${name}"` : ''}] must contain a nested <div>. Skipping.`,
          )
        }
        continue
      }
      const [xOffset, yOffset] = parseCursorOffset(
        el.getAttribute('aa-cursor-offset'),
        name,
        ctx.debug,
      )
      cursors.set(name, createCursorInstance(el, inner, gsap, xOffset, yOffset))
    }

    if (cursors.size === 0) return () => {}

    let rafId: number | null = null
    const onMouseMove = (event: MouseEvent): void => {
      currentPointerX = event.clientX
      currentPointerY = event.clientY
      if (rafId !== null) return
      rafId = requestAnimationFrame(() => {
        rafId = null
        for (const inst of cursors.values()) {
          inst.applyEdgeOffsets(currentPointerX, currentPointerY)
          inst.xTo(currentPointerX)
          inst.yTo(currentPointerY)
        }
      })
    }
    window.addEventListener('mousemove', onMouseMove, { passive: true })

    const triggers = Array.from(document.querySelectorAll<HTMLElement>('[aa-cursor-trigger]'))
    const triggerHandlers = new WeakMap<
      HTMLElement,
      { enter: () => void; leave: () => void }
    >()

    for (const trigger of triggers) {
      const name = trigger.getAttribute('aa-cursor-trigger') ?? ''
      const inst = cursors.get(name)
      if (!inst) continue

      const onEnter = (): void => {
        if (inst.isHiding) {
          inst.pendingShowTrigger = trigger
          return
        }
        inst.currentTarget = trigger
        inst.updateContent(trigger)
        inst.showCursor()
      }
      const onLeave = (): void => {
        inst.hideCursor()
      }
      trigger.addEventListener('mouseenter', onEnter)
      trigger.addEventListener('mouseleave', onLeave)
      triggerHandlers.set(trigger, { enter: onEnter, leave: onLeave })
    }

    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      if (rafId !== null) {
        cancelAnimationFrame(rafId)
        rafId = null
      }
      for (const trigger of triggers) {
        const handlers = triggerHandlers.get(trigger)
        if (!handlers) continue
        trigger.removeEventListener('mouseenter', handlers.enter)
        trigger.removeEventListener('mouseleave', handlers.leave)
      }
      for (const inst of cursors.values()) {
        inst.pendingShowTrigger = null
        inst.destroy()
      }
      cursors.clear()
    }
  },
}

export default cursorFeature
