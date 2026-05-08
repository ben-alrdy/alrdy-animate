import { parseAutoplay } from '../../core/autoplay'
import type { FeatureContext, FeatureModule } from '../../core/registry'
import { readAttrs, type Config } from '../../core/settings'
import { setupAutoplay, type AutoplayController } from './autoplay'
import { horizontalLoop, type SliderLoop } from './horizontal-loop'
import { attachKeyboard } from './keyboard'
import { setupNav } from './nav'

interface ParsedTokens {
  isDraggable: boolean
  isCenter: boolean
  isNone: boolean
}

function parseSliderValue(raw: string | undefined): ParsedTokens {
  const tokens = (raw ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  return {
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
  const duration = parseNum(config['aa-duration'], opts.duration)
  const ease = config['aa-ease'] ?? opts.ease
  const autoplay = parseAutoplay(
    config['aa-autoplay'],
    opts.autoplay,
    'aa-autoplay' in config,
  )

  // Use the slider-item's parent (the track) for gap detection.
  const firstItemParent = items[0].parentElement
  const gap = firstItemParent
    ? parseFloat(window.getComputedStyle(firstItemParent).columnGap || '0') || 0
    : 0

  const nav = setupNav(root)

  const gsap = ctx.gsap.gsap as unknown as Record<string, any>

  // Forward declare so the drag callbacks (which run via horizontalLoop) can
  // reach the autoplay controller defined below.
  let autoplayCtl: AutoplayController | null = null

  // Restart after a manual nav (button click, keyboard, drag throw). With
  // hover-pause we must NOT restart while the cursor is still over the slider
  // — restarting here would skip the mouseenter pause hook (mouseenter only
  // fires on entry, not when already inside) and the autoplay would cycle
  // through hover, defeating hover-pause. The autoplay's own mouseleave
  // handler picks up the restart when the cursor leaves. Without hover-pause
  // there is no mouseleave handler at all, so restart unconditionally —
  // otherwise clicking next while the cursor sits on the button leaves
  // autoplay stopped forever.
  const restartAutoplayAfterManualNav = (): void => {
    if (!autoplayCtl) return
    if (autoplay.hoverPause) {
      const hovered = root.matches(':hover') && !window.matchMedia('(hover: none)').matches
      if (!hovered) autoplayCtl.start()
    } else {
      autoplayCtl.start()
    }
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
      autoplayCtl?.setDragInProgress(true)
      autoplayCtl?.stop()
    },
    onRelease: (isThrowing) => {
      // No throw means a static press / click with no drag movement —
      // onThrowComplete will never fire, so we must clear the drag flag and
      // attempt a restart here. With a real throw, defer to onThrowComplete
      // which runs after the inertia tween lands on its snap target.
      if (!isThrowing) {
        autoplayCtl?.setDragInProgress(false)
        restartAutoplayAfterManualNav()
      }
    },
    onThrowComplete: () => {
      // Throw landed on a snap target → safe to restart autoplay so the
      // progress bar starts fresh on the correct active slide.
      autoplayCtl?.setDragInProgress(false)
      restartAutoplayAfterManualNav()
    },
  })

  const cleanups: Array<() => void> = []

  // Autoplay (optional). Hooks into ScrollTrigger viewport gating itself.
  if (autoplay.enabled) {
    autoplayCtl = setupAutoplay(ctx.gsap, root, slider, {
      interval: autoplay.interval,
      duration,
      ease,
      hoverPause: autoplay.hoverPause,
    })
    cleanups.push(() => autoplayCtl?.destroy())
  }

  const afterManualNav = (): void => {
    if (autoplayCtl) gsap.delayedCall(0.1, restartAutoplayAfterManualNav)
  }

  const navHandlers = {
    next: () => {
      autoplayCtl?.stop()
      slider.next({ duration, ease })
      afterManualNav()
    },
    previous: () => {
      autoplayCtl?.stop()
      slider.previous({ duration, ease })
      afterManualNav()
    },
    toIndex: (target: number) => {
      autoplayCtl?.stop()
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
