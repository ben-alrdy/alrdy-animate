import type { GsapHandle } from '../../core/gsap-detect'
import { REVERSE_TIME_SCALE, emitTrigger } from '../../core/trigger'
import type { ModalEntry } from './state'

const BACKDROP_DURATION = 0.4
const ANIMATE_ATTRS = ['aa-animate', 'aa-animate-sm', 'aa-animate-md', 'aa-animate-lg', 'aa-animate-xl']

type GsapAny = Record<string, any>

export interface AnimationController {
  applyInitialClosed: (entries: ModalEntry[], backdrop: HTMLElement | null) => void
  open: (entry: ModalEntry, backdrop: HTMLElement | null, cardDuration: number) => void
  /**
   * Reverse the card + inner aa-animate timelines (via the modal-inactive
   * event, which paired-reverses each subscriber at REVERSE_TIME_SCALE) and
   * fade the backdrop out. Calls onComplete after the longest of the two has
   * finished so the caller can hide the group / restore focus / unlock.
   */
  close: (
    entry: ModalEntry,
    backdrop: HTMLElement | null,
    cardDuration: number,
    onComplete?: () => void,
  ) => void
  cleanup: (entries: ModalEntry[], backdrop: HTMLElement | null) => void
}

function cardHasAnimate(card: HTMLElement): boolean {
  for (const attr of ANIMATE_ATTRS) {
    if (card.hasAttribute(attr)) return true
  }
  return false
}

export function createAnimationController(gsapHandle: GsapHandle): AnimationController {
  const gsap = gsapHandle.gsap as unknown as GsapAny

  const applyInitialClosed = (entries: ModalEntry[], backdrop: HTMLElement | null): void => {
    for (const e of entries) {
      // Hide via visibility, NOT display:none. SplitText's autoSplit uses a
      // ResizeObserver that fires when an element transitions from 0×0 (which
      // display:none produces) to laid-out — that resplit destroys the
      // original char/word/line spans and orphans any tween bound to them.
      // visibility:hidden keeps the cards measurable so SplitText completes
      // its initial split once and the tween survives the open transition.
      // pointer-events:none stops the hidden card from intercepting clicks.
      e.card.style.visibility = 'hidden'
      e.card.style.pointerEvents = 'none'
      if (!cardHasAnimate(e.card)) {
        gsap.set(e.card, { autoAlpha: 0 })
      }
    }
    if (backdrop) gsap.set(backdrop, { autoAlpha: 0 })
  }

  const open = (entry: ModalEntry, backdrop: HTMLElement | null, cardDuration: number): void => {
    // Reveal the card. The scroll/text/reveal feature owns opacity/transform
    // of the card via its paused tween — we just unhide.
    entry.card.style.visibility = 'visible'
    entry.card.style.pointerEvents = ''
    if (!cardHasAnimate(entry.card)) {
      gsap.fromTo(
        entry.card,
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: cardDuration, ease: 'power2.out' },
      )
    }
    if (backdrop) {
      gsap.killTweensOf(backdrop)
      gsap.fromTo(
        backdrop,
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: BACKDROP_DURATION, ease: 'power2.out' },
      )
    }
    emitTrigger(entry.card, 'modal-active')
  }

  const close = (
    entry: ModalEntry,
    backdrop: HTMLElement | null,
    cardDuration: number,
    onComplete?: () => void,
  ): void => {
    emitTrigger(entry.card, 'modal-inactive')

    // Wall-clock duration of the card's reverse — the trigger orchestrator
    // multiplies reverse playback by REVERSE_TIME_SCALE, so the actual time
    // the user sees is forward-duration / REVERSE_TIME_SCALE.
    const cardWall = cardDuration / REVERSE_TIME_SCALE

    if (!cardHasAnimate(entry.card)) {
      gsap.killTweensOf(entry.card)
      gsap.to(entry.card, { autoAlpha: 0, duration: cardWall, ease: 'power2.in' })
    }

    // Align the backdrop fade-out so it ends with the card disappearing.
    const backdropDelay = Math.max(0, cardWall - BACKDROP_DURATION)
    if (backdrop) {
      gsap.killTweensOf(backdrop)
      gsap.to(backdrop, {
        autoAlpha: 0,
        duration: BACKDROP_DURATION,
        ease: 'power2.in',
        delay: backdropDelay,
      })
    }

    const totalWait = Math.max(cardWall, backdropDelay + BACKDROP_DURATION)
    gsap.delayedCall(totalWait, () => {
      entry.card.style.visibility = 'hidden'
      entry.card.style.pointerEvents = 'none'
      onComplete?.()
    })
  }

  const cleanup = (entries: ModalEntry[], backdrop: HTMLElement | null): void => {
    for (const e of entries) {
      gsap.killTweensOf(e.card)
      gsap.set(e.card, { clearProps: 'opacity,visibility' })
      e.card.style.pointerEvents = ''
    }
    if (backdrop) {
      gsap.killTweensOf(backdrop)
      gsap.set(backdrop, { clearProps: 'opacity,visibility' })
    }
  }

  return { applyInitialClosed, open, close, cleanup }
}
