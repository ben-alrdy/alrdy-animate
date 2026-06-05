import type { GsapTween } from '../../core/gsap-detect'
import type { FeatureContext, FeatureModule } from '../../core/registry'
import { parseNum } from '../../core/parse'
import { readAttrs } from '../../core/settings'

interface ScrollTriggerLike {
  create: (vars: Record<string, unknown>) => ScrollTriggerInstance
}

interface ScrollTriggerInstance {
  kill: () => void
}

interface FlipLike {
  fit: (
    target: Element,
    source: Element,
    vars?: Record<string, unknown>,
  ) => unknown
}

interface ParsedNavValue {
  hide: boolean
  change: boolean
  scrolledPx: number
  none: boolean
}

function parseNavValue(value: string | undefined): ParsedNavValue {
  const result: ParsedNavValue = { hide: false, change: false, scrolledPx: 100, none: false }
  if (!value) return result
  const tokens = value.split(/\s+/).filter(Boolean)
  for (const token of tokens) {
    if (token === 'none') result.none = true
    else if (token === 'hide') result.hide = true
    else if (token === 'change') result.change = true
    else if (token.startsWith('change-')) {
      result.change = true
      const n = parseInt(token.slice(7), 10)
      if (Number.isFinite(n)) result.scrolledPx = n
    }
    // No `hide-<px>`: the hide animation is gated globally by the body's
    // aa-scroll-started threshold (50px, set in core/scroll-state.ts) so a
    // per-nav hide threshold can't be expressed by the CSS-driven approach.
  }
  return result
}

/**
 * 3a. GSAP-driven hide + JS-toggled `is-scrolled` class.
 * Responsive: bound through ctx.responsive so `aa-nav="hide|none"` opts out
 * cleanly per breakpoint.
 */
function setupHideAndChange(ctx: FeatureContext, navElement: HTMLElement): () => void {
  const attrs = readAttrs(navElement)
  ctx.responsive.bind(navElement, attrs, ({ config }) => {
    const parsed = parseNavValue(config['aa-nav'])
    if (parsed.none) return undefined

    const cleanups: Array<() => void> = []

    if (parsed.hide) {
      // GSAP-driven, not CSS. The nav commonly also carries an `aa-animate`
      // entrance whose tween owns the element's `transform` (and zeroes the
      // individual `translate`/`rotate`/`scale` props so they can't fight it),
      // so the hide has to run through GSAP too — one system owning `transform`
      // means no inline-vs-stylesheet conflict and no author-`transition`
      // clobber. `overwrite: 'auto'` lets a mid-hide direction reversal pick up
      // from the current position instead of snapping, so there's no flash.
      //
      // -150% is the design baseline: at intensity=1 the nav slides far enough
      // off-screen to clear a typical drop-shadow. The 150 is baked in here so
      // aa-intensity=1 reproduces the recommended look across every feature.
      const gsap = ctx.gsap.gsap
      const intensity = parseNum(config['aa-intensity'], 1)
      const duration = parseNum(config['aa-duration'], ctx.options.duration)
      const ease = config['aa-ease'] ?? 'osmo'
      const hiddenY = -150 * intensity

      // Drive off the same body scroll-state attributes the CSS used to read
      // (set by core/scroll-state.ts; gated together with it under
      // init({ scrollState }).)
      const body = document.body
      const shouldHide = (): boolean =>
        body.getAttribute('aa-scroll-direction') === 'down' &&
        body.getAttribute('aa-scroll-started') === 'true'

      let hidden = shouldHide()
      // Seed the resting state without a tween so init() never overwrites a
      // concurrent entrance tween mid-flight. Seeding hidden=true only happens
      // on a reload already scrolled past the threshold, where snapping
      // off-screen is the correct first frame anyway.
      if (hidden) gsap.set(navElement, { yPercent: hiddenY })

      let tween: GsapTween | undefined
      const sync = (): void => {
        const next = shouldHide()
        if (next === hidden) return
        hidden = next
        tween = gsap.to(navElement, {
          yPercent: next ? hiddenY : 0,
          duration,
          ease,
          overwrite: 'auto',
        })
      }

      const observer = new MutationObserver(sync)
      observer.observe(body, {
        attributes: true,
        attributeFilter: ['aa-scroll-direction', 'aa-scroll-started'],
      })

      cleanups.push(() => {
        observer.disconnect()
        tween?.kill()
        gsap.set(navElement, { yPercent: 0 })
      })
    }

    if (parsed.change) {
      const threshold = parsed.scrolledPx
      let hasClass = false
      const update = (): void => {
        const past = window.scrollY >= threshold
        if (past && !hasClass) {
          navElement.classList.add('is-scrolled')
          hasClass = true
        } else if (!past && hasClass) {
          navElement.classList.remove('is-scrolled')
          hasClass = false
        }
      }
      update()
      window.addEventListener('scroll', update, { passive: true })
      cleanups.push(() => {
        window.removeEventListener('scroll', update)
        navElement.classList.remove('is-scrolled')
      })
    }

    return () => cleanups.forEach((c) => c())
  })

  return () => {}
}

/**
 * 3b. Highlight the nav link whose `aa-scroll-target` section is in view.
 * Adds `is-current` on enter, removes on leave. Mirrors v7 onEnter/onEnterBack
 * /onLeave/onLeaveBack behaviour.
 */
function setupCurrentLinkTracking(
  ctx: FeatureContext,
  navElement: HTMLElement,
): () => void {
  const ScrollTrigger = ctx.gsap.plugins.ScrollTrigger as ScrollTriggerLike | undefined
  if (!ScrollTrigger) return () => {}

  const navItems = navElement.querySelectorAll<HTMLElement>('[aa-scroll-target]')
  if (navItems.length === 0) return () => {}

  const triggers: ScrollTriggerInstance[] = []
  navItems.forEach((navItem) => {
    const targetSelector = navItem.getAttribute('aa-scroll-target')
    if (!targetSelector) return
    const section = document.querySelector(targetSelector)
    if (!section) return

    const setCurrent = (): void => {
      navItems.forEach((item) => item.classList.remove('is-current'))
      navItem.classList.add('is-current')
    }
    const clearCurrent = (): void => {
      navItem.classList.remove('is-current')
    }

    triggers.push(
      ScrollTrigger.create({
        trigger: section,
        start: '0% 50%',
        end: '100% 50%',
        invalidateOnRefresh: true,
        onEnter: setCurrent,
        onEnterBack: setCurrent,
        onLeave: clearCurrent,
        onLeaveBack: clearCurrent,
      }),
    )
  })

  return () => {
    for (const t of triggers) {
      try {
        t.kill()
      } catch {
        // ignore
      }
    }
  }
}

/**
 * 3c. Toggle a class on the nav element while a section with
 * `aa-nav-section="my-class"` is in view.
 */
function setupSectionClasses(ctx: FeatureContext, navElement: HTMLElement): () => void {
  const ScrollTrigger = ctx.gsap.plugins.ScrollTrigger as ScrollTriggerLike | undefined
  if (!ScrollTrigger) return () => {}

  const sections = document.querySelectorAll<HTMLElement>('[aa-nav-section]')
  if (sections.length === 0) return () => {}

  const allClasses: string[] = []
  sections.forEach((section) => {
    const cls = section.getAttribute('aa-nav-section')
    if (cls) allClasses.push(cls)
  })

  const triggers: ScrollTriggerInstance[] = []
  sections.forEach((section) => {
    const sectionClass = section.getAttribute('aa-nav-section')
    if (!sectionClass) return

    const start = section.getAttribute('aa-scroll-start') ?? 'top 0%'
    const end = section.getAttribute('aa-scroll-end') ?? 'bottom 0%'

    const setActive = (): void => {
      for (const cls of allClasses) navElement.classList.remove(cls)
      navElement.classList.add(sectionClass)
    }
    const clearActive = (): void => {
      navElement.classList.remove(sectionClass)
    }

    triggers.push(
      ScrollTrigger.create({
        trigger: section,
        start,
        end,
        invalidateOnRefresh: true,
        onEnter: setActive,
        onEnterBack: setActive,
        onLeave: clearActive,
        onLeaveBack: clearActive,
      }),
    )
  })

  return () => {
    for (const t of triggers) {
      try {
        t.kill()
      } catch {
        // ignore
      }
    }
    for (const cls of allClasses) navElement.classList.remove(cls)
  }
}

interface IndicatorConfig {
  duration: number
  ease: string
  flipConfig: Record<string, unknown>
}

function readIndicatorConfig(indicator: HTMLElement): IndicatorConfig {
  const duration = parseNum(indicator.getAttribute('aa-duration') ?? undefined, 0.4)
  const ease = indicator.getAttribute('aa-ease') ?? 'power2.out'
  return {
    duration,
    ease,
    flipConfig: { duration, ease, absolute: true, simple: true, overwrite: 'auto' },
  }
}

function getCurrentItem(navElement: HTMLElement, items: NodeListOf<HTMLElement>): HTMLElement {
  const explicit = navElement.querySelector<HTMLElement>('[aa-scroll-target].is-current')
  return explicit ?? items[0]
}

/**
 * 3d. Indicator that morphs (Flip.fit) to whichever nav link has `is-current`.
 * Updates on `is-current` class addition (MutationObserver) and on resize.
 */
function setupCurrentIndicator(ctx: FeatureContext, navElement: HTMLElement): () => void {
  const Flip = ctx.gsap.plugins.Flip as FlipLike | undefined
  if (!Flip) return () => {}

  const indicator = navElement.querySelector<HTMLElement>('[aa-nav-current-indicator]')
  if (!indicator) return () => {}

  const navItems = navElement.querySelectorAll<HTMLElement>('[aa-scroll-target]')
  if (navItems.length === 0) return () => {}

  const cfg = readIndicatorConfig(indicator)
  let lastCurrentItem: HTMLElement | null = null

  requestAnimationFrame(() => {
    const item = getCurrentItem(navElement, navItems)
    if (!item) return
    lastCurrentItem = item
    Flip.fit(indicator, item, { duration: 0, absolute: true, simple: true })
    setTimeout(() => {
      indicator.style.opacity = '1'
    }, cfg.duration * 1000)
  })

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== 'attributes') continue
      const target = mutation.target as HTMLElement
      if (target.classList.contains('is-current')) {
        lastCurrentItem = target
        Flip.fit(indicator, target, cfg.flipConfig)
        break
      }
    }
  })
  navItems.forEach((item) => {
    observer.observe(item, { attributes: true, attributeFilter: ['class'] })
  })

  const offResize = ctx.onResize(() => {
    if (lastCurrentItem) {
      Flip.fit(indicator, lastCurrentItem, { duration: 0, absolute: true, simple: true })
    }
  }, 50)

  return () => {
    observer.disconnect()
    offResize()
  }
}

/**
 * 3e. Indicator that follows the hovered nav link, returning to the current
 * one when the pointer leaves the nav. Disabled on touch devices.
 */
function setupHoverIndicator(ctx: FeatureContext, navElement: HTMLElement): () => void {
  const Flip = ctx.gsap.plugins.Flip as FlipLike | undefined
  if (!Flip) return () => {}

  const isTouch =
    typeof window !== 'undefined' &&
    ('ontouchstart' in window || (navigator?.maxTouchPoints ?? 0) > 0)
  if (isTouch) return () => {}

  const indicator = navElement.querySelector<HTMLElement>('[aa-nav-hover-indicator]')
  if (!indicator) return () => {}

  const navItems = navElement.querySelectorAll<HTMLElement>('[aa-scroll-target]')
  if (navItems.length === 0) return () => {}

  const cfg = readIndicatorConfig(indicator)
  let lastCurrentItem: HTMLElement | null = null
  let isHovering = false

  const animateTo = (target: HTMLElement, durationOverride?: number): void => {
    if (durationOverride === 0) {
      Flip.fit(indicator, target, { duration: 0, absolute: true, simple: true })
    } else {
      Flip.fit(indicator, target, cfg.flipConfig)
    }
  }

  requestAnimationFrame(() => {
    const item = getCurrentItem(navElement, navItems)
    if (!item) return
    lastCurrentItem = item
    animateTo(item, 0)
    setTimeout(() => {
      indicator.style.opacity = '1'
    }, cfg.duration * 1000)
  })

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== 'attributes') continue
      const target = mutation.target as HTMLElement
      if (target.classList.contains('is-current')) {
        lastCurrentItem = target
        if (!isHovering) animateTo(target)
        break
      }
    }
  })
  navItems.forEach((item) => {
    observer.observe(item, { attributes: true, attributeFilter: ['class'] })
  })

  const enterHandlers = new Map<HTMLElement, () => void>()
  navItems.forEach((item) => {
    const fn = (): void => {
      isHovering = true
      animateTo(item)
    }
    item.addEventListener('mouseenter', fn)
    enterHandlers.set(item, fn)
  })

  const onNavLeave = (): void => {
    isHovering = false
    if (lastCurrentItem) animateTo(lastCurrentItem)
  }
  navElement.addEventListener('mouseleave', onNavLeave)

  const offResize = ctx.onResize(() => {
    if (lastCurrentItem) animateTo(lastCurrentItem, 0)
  }, 50)

  return () => {
    observer.disconnect()
    for (const [item, fn] of enterHandlers) item.removeEventListener('mouseenter', fn)
    navElement.removeEventListener('mouseleave', onNavLeave)
    offResize()
  }
}

const navFeature: FeatureModule = {
  name: 'nav',
  init(ctx: FeatureContext): () => void {
    const navElements = ctx.elements.filter(
      (el): el is HTMLElement => el instanceof HTMLElement && el.hasAttribute('aa-nav'),
    )
    if (navElements.length === 0) return () => {}

    const disposers: Array<() => void> = []
    for (const navElement of navElements) {
      disposers.push(
        setupHideAndChange(ctx, navElement),
        setupCurrentLinkTracking(ctx, navElement),
        setupSectionClasses(ctx, navElement),
        setupCurrentIndicator(ctx, navElement),
        setupHoverIndicator(ctx, navElement),
      )
    }

    return () => {
      for (const d of disposers) {
        try {
          d()
        } catch (err) {
          if (ctx.debug) console.error('[alrdy-animate] nav disposer threw', err)
        }
      }
    }
  },
}

export default navFeature
