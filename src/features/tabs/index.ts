import { parseAutoplay } from '../../core/autoplay'
import type { FeatureContext, FeatureModule } from '../../core/registry'
import { readAttrs, type Config } from '../../core/settings'
import { REVERSE_TIME_SCALE } from '../../core/trigger'
import { createAnimationController, createAriaController, hasVisualAnimation } from './controller'
import { setupAutoplay, type AutoplayController } from './autoplay'
import { attachKeyboard } from './keyboard'
import { setupScroll, type ScrollController } from './scroll'
import {
  TABS_STATUS_ATTR,
  createTabState,
  parseTabsValue,
  type TabEntry,
  type TabMode,
  type TabState,
} from './state'

export interface TabsApi {
  state: TabState
  mode: TabMode
  open: (entry: TabEntry) => void
  openSnap: (entry: TabEntry) => void
  close: (entry: TabEntry) => void
}

interface ScrollTriggerLike {
  isTouch: boolean | number
  refresh: () => void
}

function setupOne(ctx: FeatureContext, root: HTMLElement, config: Config): (() => void) | undefined {
  const parsed = parseTabsValue(config['aa-tabs'])
  if (parsed.isNone) return undefined

  const opts = ctx.options
  const defaultDuration = (() => {
    const c = config['aa-duration']
    const n = c !== undefined ? parseFloat(c) : NaN
    return Number.isFinite(n) ? n : opts.duration
  })()
  const defaultEase = config['aa-ease'] ?? opts.ease

  const autoplay = parseAutoplay(
    config['aa-autoplay'],
    opts.autoplay,
    'aa-autoplay' in config,
  )

  const state = createTabState(root, {
    duration: defaultDuration,
    interval: autoplay.interval,
    ease: defaultEase,
  })
  if (state.entries.length === 0) return undefined

  const gsap = ctx.gsap.gsap as unknown as Record<string, any>
  const ScrollTrigger = ctx.gsap.plugins.ScrollTrigger as ScrollTriggerLike | undefined

  // Mode resolution: presence of `aa-autoplay` activates autoplay mode and
  // overrides whatever `aa-tabs` declared. Conflict (`aa-tabs="scroll"` plus
  // `aa-autoplay`) → autoplay wins; warn in dev so the override isn't silent.
  let mode: TabMode = parsed.mode
  if (autoplay.enabled) {
    if (mode === 'scroll' && ctx.debug) {
      console.warn(
        '[alrdy-animate] aa-tabs="scroll" + aa-autoplay both set; autoplay overrides scroll mode.',
        root,
      )
    }
    mode = 'autoplay'
  }
  // Touch fallback: scroll mode degrades to single — pin scrubbing on touch
  // is brittle and the click-to-jump behaviour is more useful. Keep mutation
  // local; never touch the DOM attribute (responsive bookkeeping owns that).
  if (mode === 'scroll' && ScrollTrigger && ScrollTrigger.isTouch) {
    mode = 'single'
  }

  const aria = createAriaController(state)
  const animation = createAnimationController(ctx.gsap)

  aria.applyInitial()
  animation.applyInitialClosed(state.entries)
  for (const entry of state.entries) state.setStatus(entry, 'inactive')

  let refreshCall: { kill: () => void } | null = null
  const debouncedRefresh = (): void => {
    if (!ScrollTrigger) return
    refreshCall?.kill()
    refreshCall = gsap.delayedCall(0.1, () => {
      ScrollTrigger.refresh()
      refreshCall = null
    })
  }

  const openEntry = (entry: TabEntry): void => {
    if (state.isActive(entry)) return
    // For non-multi modes, close any other active entry before opening the new one.
    let visualDelay = 0
    if (mode !== 'multi') {
      const prev = state.activeEntry()
      if (prev && prev !== entry) {
        // When the previous visual carries its own aa-animate, wait for that
        // animate-out to finish before the incoming animate-in fires. Default
        // cross-fade visuals overlap as before (no delay). The reverse runs
        // at REVERSE_TIME_SCALE × forward speed, so the actual wall-clock
        // time we wait is duration / REVERSE_TIME_SCALE.
        if (prev.visual && hasVisualAnimation(prev.visual)) {
          visualDelay = prev.visualDuration / REVERSE_TIME_SCALE
        }
        closeEntry(prev)
      }
    }
    state.setStatus(entry, 'active')
    aria.applyOpen(entry)
    animation.open(entry, { visualDelay, onComplete: debouncedRefresh })
  }

  const openEntrySnap = (entry: TabEntry): void => {
    if (state.isActive(entry)) return
    if (mode !== 'multi') {
      const prev = state.activeEntry()
      if (prev && prev !== entry) closeEntry(prev)
    }
    state.setStatus(entry, 'active')
    aria.applyOpen(entry)
    animation.applyInitialOpen(entry)
  }

  const closeEntry = (entry: TabEntry): void => {
    if (!state.isActive(entry)) return
    state.setStatus(entry, 'inactive')
    aria.applyClosed(entry)
    animation.close(entry, debouncedRefresh)
  }

  const api: TabsApi = {
    state,
    mode,
    open: openEntry,
    openSnap: openEntrySnap,
    close: closeEntry,
  }

  // mode-specific controllers (forward-declared so click handler can stop autoplay).
  let autoplayCtl: AutoplayController | null = null
  let scrollCtrl: ScrollController | null = null

  // Determine which entry to open at init.
  // - Explicit aa-tabs-initial wins.
  // - Single / autoplay / scroll modes: fall back to the first entry.
  // - Default / multi: leave everything closed unless an explicit initial is set.
  const initialEntry = (() => {
    const explicit = state.initialEntry()
    if (explicit) return explicit
    if (mode === 'single' || mode === 'autoplay' || mode === 'scroll') {
      return state.entries[0] ?? null
    }
    return null
  })()

  // Defer one tick so trigger subscribers (e.g. text feature on inner aa-animate)
  // have registered before tab-active fires.
  if (initialEntry) {
    gsap.delayedCall(0, () => {
      if (!state.isActive(initialEntry)) openEntrySnap(initialEntry)
    })
  }

  const handleToggle = (toggle: HTMLElement): void => {
    const id = toggle.getAttribute('aa-tabs-toggle')
    if (!id) return
    const entry = state.byId.get(id)
    if (!entry) return

    const active = state.isActive(entry)
    const cantClose = mode === 'single' || mode === 'autoplay' || mode === 'scroll'
    if (active && cantClose) return

    // Scroll mode delegates to the scroll controller so the pinned scroll
    // position drives state. Autoplay restarts its progress on the clicked
    // tab and keeps cycling.
    if (scrollCtrl) {
      scrollCtrl.jumpToIndex(entry.index)
      return
    }
    if (autoplayCtl) {
      autoplayCtl.sync(entry.index)
      return
    }

    if (active) closeEntry(entry)
    else openEntry(entry)
  }

  const onClick = (e: Event): void => {
    const target = e.target as Element | null
    if (!target) return
    const toggle = target.closest<HTMLElement>('[aa-tabs-toggle]')
    if (!toggle || !root.contains(toggle)) return
    handleToggle(toggle)
  }
  root.addEventListener('click', onClick)

  const cleanups: Array<() => void> = []
  cleanups.push(() => root.removeEventListener('click', onClick))

  cleanups.push(
    attachKeyboard(root, state.entries.map((e) => e.toggle), {
      activate: handleToggle,
    }),
  )

  if (mode === 'autoplay') {
    autoplayCtl = setupAutoplay(ctx.gsap, root, api, {
      hoverPause: autoplay.hoverPause,
    })
    cleanups.push(() => autoplayCtl?.destroy())
  } else if (mode === 'scroll') {
    // 30vh per tab is the design baseline. `aa-intensity` multiplies it:
    // intensity=1 (default) = 30vh per tab, 2 = 60vh, 0.5 = 15vh.
    const intensity = parseFloat(config['aa-intensity'] ?? '') || 1
    const scrollStart = config['aa-scroll-start'] ?? 'top 20%'
    const scrubAttr = config['aa-scrub']
    const scrub = scrubAttr === undefined ? true : scrubAttr === 'true' ? true : parseFloat(scrubAttr) || true
    scrollCtrl = setupScroll(ctx.gsap, root, api, {
      distanceVh: 30 * intensity,
      scrollStart,
      scrub,
    })
    if (scrollCtrl) cleanups.push(() => scrollCtrl?.destroy())
  }

  return () => {
    for (const fn of cleanups) fn()
    refreshCall?.kill()
    refreshCall = null
    animation.cleanup(state.entries)
    for (const entry of state.entries) {
      state.statusEl(entry).removeAttribute(TABS_STATUS_ATTR)
      if (!entry.wrapper && entry.content) entry.content.removeAttribute(TABS_STATUS_ATTR)
      if (entry.visual) entry.visual.removeAttribute(TABS_STATUS_ATTR)
    }
    aria.cleanup()
  }
}

const tabsFeature: FeatureModule = {
  name: 'tabs',
  init(ctx: FeatureContext): () => void {
    const subjects = ctx.elements.filter(
      (el): el is HTMLElement => el instanceof HTMLElement && el.hasAttribute('aa-tabs'),
    )
    for (const root of subjects) {
      const attrs = readAttrs(root)
      ctx.responsive.bind(root, attrs, ({ config }) => setupOne(ctx, root, config))
    }
    return () => {}
  },
}

export default tabsFeature
