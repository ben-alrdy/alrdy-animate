import type { FeatureContext, FeatureModule } from '../../core/registry'
import { readAttrs, type Config } from '../../core/settings'
import { setupAutoplay, type AutoplayController } from './autoplay'
import { horizontalLoop, type SliderLoop } from './horizontal-loop'
import { attachKeyboard } from './keyboard'
import { setupNav } from './nav'

interface ParsedTokens {
  isAutoplay: boolean
  isHoverPause: boolean
  isDraggable: boolean
  isCenter: boolean
  isNone: boolean
}

function parseSliderValue(raw: string | undefined): ParsedTokens {
  const tokens = (raw ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  const isHoverPause = tokens.includes('autoplay-hover')
  return {
    isAutoplay: isHoverPause || tokens.includes('autoplay'),
    isHoverPause,
    isDraggable: tokens.includes('draggable'),
    isCenter: tokens.includes('center'),
    isNone: tokens.includes('none'),
  }
}

function parseNum(value: string | undefined, fallback: number): number {
  if (value === undefined) return fallback
  const n = parseFloat(value)
  return Number.isFinite(n) ? n : fallback
}

function setupOne(ctx: FeatureContext, root: HTMLElement, config: Config): (() => void) | undefined {
  const tokens = parseSliderValue(config['aa-slider'])
  if (tokens.isNone) return undefined

  const items = root.querySelectorAll<HTMLElement>('[aa-slider-item]')
  if (items.length === 0) return undefined

  const opts = ctx.options
  const duration = parseNum(config['aa-duration'], opts.duration ?? 0.6)
  const delay = parseNum(config['aa-delay'], 3)
  const ease = config['aa-ease'] ?? opts.ease ?? 'power2.out'

  // Use the slider-item's parent (the track) for gap detection.
  const firstItemParent = items[0].parentElement
  const gap = firstItemParent
    ? parseFloat(window.getComputedStyle(firstItemParent).columnGap || '0') || 0
    : 0

  const nav = setupNav(root)

  const gsap = ctx.gsap.gsap as unknown as Record<string, any>

  // Forward declare so the drag callbacks (which run via horizontalLoop) can
  // reach the autoplay controller defined below.
  let autoplay: AutoplayController | null = null

  const restartAutoplayIfNotHovered = (): void => {
    if (!autoplay) return
    const hovered = root.matches(':hover') && !window.matchMedia('(hover: none)').matches
    if (!hovered) autoplay.start()
  }

  const slider: SliderLoop = horizontalLoop(ctx.gsap, items, {
    speed: duration,
    repeat: -1,
    paused: true,
    paddingRight: gap,
    center: tokens.isCenter,
    draggable: tokens.isDraggable,
    onChange: nav.onChange,
    onDragStart: () => {
      autoplay?.setDragInProgress(true)
      autoplay?.stop()
    },
    onThrowComplete: () => {
      // Throw landed on a snap target → safe to restart autoplay so the
      // progress bar starts fresh on the correct active slide.
      autoplay?.setDragInProgress(false)
      restartAutoplayIfNotHovered()
    },
  })

  const cleanups: Array<() => void> = []

  // Autoplay (optional). Hooks into ScrollTrigger viewport gating itself.
  if (tokens.isAutoplay) {
    autoplay = setupAutoplay(ctx.gsap, root, slider, {
      delay,
      duration,
      ease,
      hoverPause: tokens.isHoverPause,
    })
    cleanups.push(() => autoplay?.destroy())
  }

  const afterManualNav = (): void => {
    if (autoplay) gsap.delayedCall(0.1, restartAutoplayIfNotHovered)
  }

  const navHandlers = {
    next: () => {
      autoplay?.stop()
      slider.next({ duration, ease })
      afterManualNav()
    },
    previous: () => {
      autoplay?.stop()
      slider.previous({ duration, ease })
      afterManualNav()
    },
    toIndex: (target: number) => {
      autoplay?.stop()
      slider.toIndex(target, { duration, ease })
      afterManualNav()
    },
    current: () => slider.current(),
  }

  cleanups.push(nav.attachClickListeners(navHandlers))

  cleanups.push(
    attachKeyboard(root, nav.total, {
      next: navHandlers.next,
      previous: navHandlers.previous,
      toIndex: navHandlers.toIndex,
    }),
  )

  // Refresh measurements on resize.
  cleanups.push(
    ctx.onResize(() => {
      const refresh = (slider as SliderLoop & { refresh?: (deep?: boolean) => void }).refresh
      if (typeof refresh === 'function') refresh(true)
    }, 150),
  )

  // Initial onChange (fired by horizontalLoop on construction) has already
  // toggled is-active classes and emitted slide-active on the starting slide
  // so descendant aa-trigger="event:slide-active" animations play on first
  // paint. No additional bootstrap call needed here.

  return () => {
    for (const fn of cleanups) fn()
    slider.touchCleanup?.()
    slider.draggable?.kill()
    slider.kill()
  }
}

const sliderFeature: FeatureModule = {
  name: 'slider',
  requiredPlugins: ['ScrollTrigger', 'Draggable', 'InertiaPlugin'],
  init(ctx: FeatureContext): () => void {
    const subjects = ctx.elements.filter(
      (el): el is HTMLElement => el instanceof HTMLElement && el.hasAttribute('aa-slider'),
    )
    for (const root of subjects) {
      const attrs = readAttrs(root)
      ctx.responsive.bind(root, attrs, ({ config }) => setupOne(ctx, root, config))
    }
    return () => {}
  },
}

export default sliderFeature
