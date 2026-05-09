import type { FeatureContext, FeatureModule } from '../../core/registry'
import { readAttrs, type Config } from '../../core/settings'
import { createAnimationController } from './animation'
import { attachEsc, focusFirst, trapFocus } from './a11y'
import { lockBodyScroll, resetScrollLock, unlockBodyScroll } from './scroll-lock'
import {
  MODAL_GROUP_STATUS_ATTR,
  MODAL_STATUS_ATTR,
  createModalState,
  type ModalEntry,
  type ModalState,
} from './state'

function parseDuration(config: Config, fallback: number): number {
  const c = config['aa-duration']
  if (c === undefined) return fallback
  const n = parseFloat(c)
  return Number.isFinite(n) ? n : fallback
}

function setupOne(
  ctx: FeatureContext,
  group: HTMLElement,
  config: Config,
): (() => void) | undefined {
  const state = createModalState(group)
  if (state.entries.length === 0) return undefined

  // Portal to <body>. A modal is fixed-position chrome, but a `transform` /
  // `filter` / `contain: paint` on any ancestor turns its `position: fixed`
  // into `position: absolute` relative to that ancestor, which also clamps
  // its z-index to that ancestor's stacking context. Moving the group to
  // body sidesteps both — z-index now competes against page-level chrome
  // directly. Skip if already there or running in a non-DOM environment.
  if (typeof document !== 'undefined' && group.parentElement !== document.body) {
    document.body.appendChild(group)
  }

  const opts = ctx.options
  const groupDuration = parseDuration(config, opts.duration)
  const animation = createAnimationController(ctx.gsap)
  const gsap = ctx.gsap.gsap as unknown as Record<string, any>
  const cleanups: Array<() => void> = []

  // Per-card duration: prefer the card's own aa-duration, else group, else init default.
  const durationFor = (entry: ModalEntry): number => {
    const v = entry.card.getAttribute('aa-duration')
    if (v) {
      const n = parseFloat(v)
      if (Number.isFinite(n)) return n
    }
    return groupDuration
  }

  state.setGroupStatus('not-active')
  for (const entry of state.entries) state.setStatus(entry, 'not-active')
  animation.applyInitialClosed(state.entries, state.backdrop)

  let detachTrap: (() => void) | null = null
  let detachEsc: (() => void) | null = null
  let lastOpener: HTMLElement | null = null
  let pendingOpenFocus: { kill: () => void } | null = null

  const closeEntry = (entry: ModalEntry): void => {
    if (!state.isActive(entry)) return
    detachTrap?.()
    detachTrap = null
    detachEsc?.()
    detachEsc = null
    pendingOpenFocus?.kill()
    pendingOpenFocus = null

    const opener = lastOpener
    lastOpener = null

    const cardDuration = durationFor(entry)
    animation.close(entry, state.backdrop, cardDuration, () => {
      state.setStatus(entry, 'not-active')
      if (!state.activeEntry()) state.setGroupStatus('not-active')
      unlockBodyScroll()
      opener?.focus({ preventScroll: true })
    })
  }

  const openEntry = (entry: ModalEntry, opener: HTMLElement | null): void => {
    if (state.isActive(entry)) return

    // If another modal in this group is already open, close it first. We
    // don't await it — the close + open animations overlap, which feels
    // snappier than a sequential handoff.
    const prev = state.activeEntry()
    if (prev && prev !== entry) closeEntry(prev)

    lastOpener = opener
    state.setGroupStatus('active')
    state.setStatus(entry, 'active')
    lockBodyScroll()
    const cardDuration = durationFor(entry)
    animation.open(entry, state.backdrop, cardDuration)

    detachTrap = trapFocus(entry.card)
    detachEsc = attachEsc(() => closeEntry(entry))

    pendingOpenFocus?.kill()
    pendingOpenFocus = gsap.delayedCall(cardDuration, () => {
      focusFirst(entry.card)
      pendingOpenFocus = null
    })
  }

  // Document-level click delegation: trigger buttons can live anywhere in the
  // page, not necessarily inside the group.
  const onDocClick = (e: Event): void => {
    const target = e.target as Element | null
    if (!target) return
    const trigger = target.closest<HTMLElement>('[aa-modal-target]')
    if (!trigger) return
    const name = trigger.getAttribute('aa-modal-target')
    if (!name) return
    const entry = state.byName.get(name)
    if (!entry) return
    e.preventDefault()
    openEntry(entry, trigger)
  }
  document.addEventListener('click', onDocClick)
  cleanups.push(() => document.removeEventListener('click', onDocClick))

  // Group-scoped click delegation for close affordances (close buttons,
  // backdrop). Handled separately so [aa-modal-close] outside the group is
  // never interpreted as a close (avoids surprising cross-group behavior).
  const onGroupClick = (e: Event): void => {
    const target = e.target as Element | null
    if (!target) return
    const closer = target.closest<HTMLElement>('[aa-modal-close]')
    if (!closer || !group.contains(closer)) return
    const active = state.activeEntry()
    if (!active) return
    e.preventDefault()
    closeEntry(active)
  }
  group.addEventListener('click', onGroupClick)
  cleanups.push(() => group.removeEventListener('click', onGroupClick))

  return () => {
    for (const fn of cleanups) fn()
    detachTrap?.()
    detachEsc?.()
    pendingOpenFocus?.kill()
    if (state.activeEntry()) {
      // Mid-open destroy: drop the lock count and let the body resume.
      unlockBodyScroll()
    }
    animation.cleanup(state.entries, state.backdrop)
    state.group.removeAttribute(MODAL_GROUP_STATUS_ATTR)
    for (const entry of state.entries) entry.card.removeAttribute(MODAL_STATUS_ATTR)
  }
}

const modalFeature: FeatureModule = {
  name: 'modal',
  requiredPlugins: [],
  init(ctx: FeatureContext): () => void {
    const groups = ctx.elements.filter(
      (el): el is HTMLElement => el instanceof HTMLElement && el.hasAttribute('aa-modal-group'),
    )
    for (const group of groups) {
      const attrs = readAttrs(group)
      ctx.responsive.bind(group, attrs, ({ config }) => setupOne(ctx, group, config))
    }
    return () => {
      // Belt-and-suspenders in case a setupOne died without running its own
      // cleanup (e.g. ResponsiveController revertAll already torched it).
      resetScrollLock()
    }
  },
}

export default modalFeature

// Suppress the "imported but never used" warning for state types when the
// barrel is consumed externally — re-export them as a type-only surface.
export type { ModalEntry, ModalState }
