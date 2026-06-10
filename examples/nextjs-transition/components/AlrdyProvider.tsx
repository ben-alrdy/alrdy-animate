'use client'

// alrdy-animate × Next.js × Osmo stacked-cards transition
// -------------------------------------------------------
// The original Osmo demo (https://osmo-stacked-cards-transition.webflow.io)
// runs in Barba.js sync mode where the OLD <main> and NEW <main> coexist
// in the DOM during the transition, plus an opaque orange `.transition__middle`
// layer between them. The timeline animates all three elements:
//
//   PHASE 1 (0 → 0.8s):  clipPath rounds to 1em on all three
//   PHASE 2 (0 → 1.2s):  scales/translates form the deck
//                          wrapper → scale 0.95 yPercent 20
//                          middle  → scale 0.875 yPercent 10
//                          next    → scale 0.8 yPercent 0
//   PHASE 3 (1.08 → 2.28): wrapper drops off, yPercent 130
//   PHASE 4 (1.23 → 2.43): middle drops off (yPercent 120) +
//                          next settles to scale 1, yPercent 0
//   PHASE 5 (1.63 → 2.43): clipPath unrounds to 0em
//   PHASE 6 (1.53 → 2.73): demo-nav slides from yPercent -100
//
// In Next.js App Router we can't sync-mount the new <main>, so we split:
//   - LEAVE timeline runs PHASES 1+2 against snapshot + middle + next-card
//     placeholder, then calls router.push().
//   - ENTER timeline runs PHASES 3+4+5 (still using the placeholder) after
//     the new pathname commits.
//   - At the moment next-card hits scale:1 (= identical to the real new
//     page underneath), we hide the overlay and run PHASE 6 (nav slide)
//     on the real new <main>.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from 'react'
import { usePathname, useRouter } from 'next/navigation'
import 'alrdy-animate/style'

type NavigateFn = (href: string) => void
const TransitionContext = createContext<NavigateFn>(() => {})
export const useTransitionNavigate = () => useContext(TransitionContext)

type Stage = 'idle' | 'leaving' | 'entering'
let stage: Stage = 'idle'

let depsLoaded = false
let alrdyReady = false

// Monotonic token bumped on every navigate() start and every hard reset. An
// in-flight leave/enter captures the current value and bails if it no longer
// matches — i.e. a browser back/forward (incl. the iOS/Android swipe-back
// gesture) superseded it. Without this, a back gesture mid-leave still fires the
// leave's onComplete and re-pushes forward; a back mid-enter lets the stale
// enter finish and clobber the reset.
let navToken = 0

// Handle to the GSAP timeline currently driving the deck. A back gesture
// mid-transition must kill() it, or the still-running tween keeps re-applying
// its transforms every frame after we've cleared them — snapping the deck back
// into the covered state.
let activeTimeline: { kill: () => void } | null = null

async function loadPeerDeps() {
  if (depsLoaded) return
  await Promise.all([
    import('gsap').then((m) => {
      ;(window as any).gsap = m.gsap
    }),
    import('gsap/ScrollTrigger').then((m) => {
      ;(window as any).ScrollTrigger = m.ScrollTrigger
    }),
    import('gsap/SplitText').then((m) => {
      ;(window as any).SplitText = m.SplitText
    }),
    import('gsap/CustomEase').then((m) => {
      ;(window as any).CustomEase = m.CustomEase
    }),
    import('gsap/Flip').then((m) => {
      ;(window as any).Flip = m.Flip
    }),
    import('gsap/Draggable').then((m) => {
      ;(window as any).Draggable = m.Draggable
    }),
    import('gsap/InertiaPlugin').then((m) => {
      ;(window as any).InertiaPlugin = m.InertiaPlugin
    }),
    import('lenis').then((m) => {
      ;(window as any).Lenis = m.default
    }),
  ])
  const gsap = (window as any).gsap
  const CustomEase = (window as any).CustomEase
  gsap.registerPlugin(CustomEase)
  CustomEase.create('osmo', '0.625, 0.05, 0, 1')
  gsap.defaults({ ease: 'osmo', duration: 0.6 })
  depsLoaded = true
}

async function alrdyInit(rootEl: HTMLElement) {
  const { init } = await import('alrdy-animate')
  await init({
    debug: true,
    duration: 0.6,
    ease: 'osmo',
    intensity: 1.5,
    smoothScroll: true,
    root: rootEl,
    loadDelay: 0,
  })
  alrdyReady = true
}

async function alrdyDestroy() {
  if (!alrdyReady) return
  const { destroy } = await import('alrdy-animate')
  destroy({ keepGlobals: true })
  alrdyReady = false
}

function fireEnterAnimations(rootEl: HTMLElement) {
  rootEl.querySelectorAll('[aa-trigger~="event:enter"]').forEach((el) => {
    el.dispatchEvent(
      new CustomEvent('aa:trigger', { detail: { name: 'enter' }, bubbles: true }),
    )
  })
}

function waitForNewMain(excludeNode: HTMLElement | null) {
  return new Promise<HTMLElement | null>((resolve) => {
    let attempts = 0
    const check = () => {
      const candidates = document.querySelectorAll<HTMLElement>('main[data-transition-container]')
      for (const el of candidates) {
        if (!excludeNode || !excludeNode.contains(el)) return resolve(el)
      }
      if (attempts++ < 60) requestAnimationFrame(check)
      else resolve(null)
    }
    check()
  })
}

// ----------------------------------------------------------------------------
// HARD RESET — abort whatever transition is in flight and return the document
// to a clean, scrollable state. Called when a browser back/forward (incl. the
// iOS/Android swipe-back gesture) interrupts the deck: that navigation goes
// through history, never through navigate(), so it skips the state machine. If
// it lands mid-transition the deck is left covering the viewport, the body
// scroll-locked, Lenis stopped, and `stage` stuck non-idle — the page looks
// frozen and further TransitionLink clicks are swallowed by navigate()'s
// `stage !== 'idle'` guard. Bumping navToken signals any pending leave/enter
// that it was superseded.
// ----------------------------------------------------------------------------
function hardResetTransition() {
  navToken++
  stage = 'idle'
  activeTimeline?.kill()
  activeTimeline = null

  const gsap = (window as any).gsap
  if (gsap) {
    const overlay = document.querySelector<HTMLElement>('[data-transition-overlay]')
    const snapshot = overlay?.querySelector<HTMLElement>('[data-transition-snapshot]')
    const middle = overlay?.querySelector<HTMLElement>('[data-transition-middle]')
    const next = overlay?.querySelector<HTMLElement>('[data-transition-next]')
    const backdrop = overlay?.querySelector<HTMLElement>('.transition__backdrop')
    if (snapshot) snapshot.innerHTML = ''
    gsap.set([snapshot, middle, next, backdrop].filter(Boolean), { clearProps: 'all' })
    if (overlay) gsap.set(overlay, { display: 'none' })

    // A back gesture mid-enter may have left the real new <main> in its fixed,
    // scaled deck position (handoffNextToRealMain ran). Strip those inline
    // styles so it returns to normal document flow.
    document
      .querySelectorAll<HTMLElement>('main[data-transition-container]')
      .forEach((el) =>
        gsap.set(el, {
          clearProps:
            'position,top,left,right,width,height,overflow,zIndex,transformStyle,willChange,backfaceVisibility,transform,clipPath,opacity,visibility',
        }),
      )
  }

  document.body.style.overflow = ''
  const lenis = window.lenis as unknown as { resize?: () => void; start?: () => void } | undefined
  lenis?.resize?.()
  lenis?.start?.()
}

// ----------------------------------------------------------------------------
// LEAVE — Osmo phases 1 + 2 (clipPath rounds + deck forms)
// ----------------------------------------------------------------------------
function runLeaveTimeline(
  snapshot: HTMLElement,
  middle: HTMLElement,
  next: HTMLElement,
  reducedMotion: boolean,
): Promise<void> {
  const gsap = (window as any).gsap
  return new Promise((resolve) => {
    if (reducedMotion) {
      gsap.set([snapshot, middle, next], { autoAlpha: 1 })
      resolve()
      return
    }
    const tl = gsap.timeline({
      onComplete: () => {
        activeTimeline = null
        resolve()
      },
    })
    activeTimeline = tl
    // PHASE 1: clipPath rounds on all three layers.
    tl.to(
      [snapshot, middle, next],
      { clipPath: 'inset(0% round 1em)', duration: 0.8 },
      0,
    )
    // PHASE 2: deck forms — each layer shrinks from full-cover to its
    // staggered deck slot. yPercent stagger creates the cascading offset
    // that reads as "stacked cards."
    tl.to(
      snapshot,
      { scale: 0.95, duration: 1.2, yPercent: 20, ease: 'expo.inOut', overwrite: 'auto' },
      '<',
    )
    tl.to(
      middle,
      { scale: 0.875, yPercent: 10, duration: 1.2, ease: 'expo.inOut', overwrite: 'auto' },
      '<',
    )
    tl.to(
      next,
      { scale: 0.8, yPercent: 0, duration: 1.2, ease: 'expo.inOut', overwrite: 'auto' },
      '<',
    )
  })
}

// ----------------------------------------------------------------------------
// HANDOFF — at the start of enter, the real new <main> takes over the "next"
// slot from the placeholder. We apply Osmo's prepareForTransition styles to
// the real DOM so it sits exactly where the placeholder was (fixed, full
// viewport, scale 0.8, clipPath rounded) and then animate IT through phase 4
// instead of the placeholder. The placeholder + backdrop are hidden — they
// existed only to fill the void during leave when the real new main didn't
// exist in the DOM yet.
// ----------------------------------------------------------------------------
function handoffNextToRealMain(
  backdrop: HTMLElement,
  nextCard: HTMLElement,
  newMain: HTMLElement,
) {
  const gsap = (window as any).gsap
  // Pin a stable nav initial state BEFORE applying main styles, so the nav
  // slide tween in the enter timeline has a clean from-state to tween away
  // from. Without this, the nav would briefly flash visible at yPercent:0
  // between handoff and the tween starting.
  const nav = newMain.querySelector('.demo-nav')
  if (nav) gsap.set(nav, { yPercent: -100 })

  gsap.set(newMain, {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    width: '100%',
    height: '100vh',
    overflow: 'clip',
    zIndex: 1,
    transformStyle: 'preserve-3d',
    willChange: 'transform, opacity',
    backfaceVisibility: 'hidden',
    autoAlpha: 1,
    yPercent: 0,
    scale: 0.8,
    clipPath: 'inset(0% round 1em)',
    transformOrigin: '50% 50%',
  })
  // Same cream as the placeholder — swap is visually seamless.
  gsap.set([backdrop, nextCard], { autoAlpha: 0 })
}

// ----------------------------------------------------------------------------
// ENTER — Osmo phases 3 + 4 + 5 + 6 (deck drops, next settles, clipPath
// unrounds, nav slides). Runs against the REAL new <main>, not a placeholder,
// so the user sees the new page's content shrunken in the deck and the nav
// slides on the actual DOM concurrently with the cards dropping — matching
// the original Osmo Barba demo exactly.
// ----------------------------------------------------------------------------
function runEnterTimeline(
  snapshot: HTMLElement,
  middle: HTMLElement,
  newMain: HTMLElement,
  reducedMotion: boolean,
): Promise<void> {
  const gsap = (window as any).gsap
  return new Promise((resolve) => {
    if (reducedMotion) {
      gsap.set([snapshot, middle], { autoAlpha: 0 })
      gsap.set(newMain, { scale: 1, yPercent: 0, autoAlpha: 1, clipPath: 'inset(0% round 0em)' })
      resolve()
      return
    }
    const tl = gsap.timeline({
      onComplete: () => {
        activeTimeline = null
        resolve()
      },
    })
    activeTimeline = tl
    // PHASE 3: snapshot (top card) drops off-bottom.
    tl.to(snapshot, { yPercent: 130, duration: 1.2, ease: 'osmo' }, 0)
    // PHASE 4a: middle drops off-bottom, slightly delayed.
    tl.to(middle, { yPercent: 120, duration: 1.2, ease: 'osmo' }, '< 0.15')
    // PHASE 4b: real new main settles from deck position to full cover.
    tl.to(
      newMain,
      { scale: 1, yPercent: 0, duration: 1.2, ease: 'expo.inOut', overwrite: 'auto' },
      '< 0.15',
    )
    // PHASE 5: clipPath unrounds on all three.
    tl.to(
      [snapshot, middle, newMain],
      { clipPath: 'inset(0% round 0em)', duration: 0.8, ease: 'osmo' },
      '> -0.8',
    )
    // PHASE 6: demo-nav slide-down on the real new main (Osmo offset "< -0.1").
    const nav = newMain.querySelector('.demo-nav')
    if (nav) {
      tl.to(nav, { yPercent: 0, duration: 1.2, ease: 'osmo' }, '< -0.1')
    }
    // Fire content-reveal events as the deck is dropping. ready() awaits the
    // alrdyInit() we called before this timeline, so listeners are attached.
    tl.call(
      () => {
        import('alrdy-animate').then(({ ready }) => {
          ready().then(() => fireEnterAnimations(newMain))
        })
      },
      undefined,
      0.6,
    )
  })
}

export function AlrdyProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const firstRenderRef = useRef(true)
  const pendingHrefRef = useRef<string | null>(null)

  // First render: load deps + init alrdy-animate on the initial <main>.
  useEffect(() => {
    if (!firstRenderRef.current) return
    firstRenderRef.current = false
    let cancelled = false
    ;(async () => {
      await loadPeerDeps()
      if (cancelled) return
      const main = document.querySelector<HTMLElement>('main[data-transition-container]')
      if (!main) return
      await alrdyInit(main)
      if (cancelled) return
      const { ready } = await import('alrdy-animate')
      await ready()
      fireEnterAnimations(main)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  // Browser back/forward (incl. the iOS/Android swipe-back gesture) navigates
  // via history, never through navigate() — so it skips the leave→enter state
  // machine. If it fires mid-transition, abort and reset; the pathname effect
  // below then re-scans the new route cleanly via its non-entering branch.
  useEffect(() => {
    const onPopState = () => {
      if (stage !== 'idle') hardResetTransition()
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  // Pathname-driven enter. Fires after navigate() called router.push, or on
  // browser back/forward (in which case we just refresh alrdy-animate, no
  // visual transition).
  useEffect(() => {
    if (firstRenderRef.current) return
    if (stage !== 'entering') {
      // Back/forward or programmatic push.
      let cancelled = false
      ;(async () => {
        await loadPeerDeps()
        if (cancelled) return
        await alrdyDestroy()
        const main = await waitForNewMain(null)
        if (cancelled || !main) return
        await alrdyInit(main)
        if (cancelled) return
        const { ready } = await import('alrdy-animate')
        await ready()
        fireEnterAnimations(main)
      })()
      return () => {
        cancelled = true
      }
    }

    let cancelled = false
    ;(async () => {
      // Capture the token so a back/forward gesture mid-enter (which hard-resets
      // and bumps navToken) makes us bail before clobbering the reset.
      const token = navToken
      const superseded = () => cancelled || token !== navToken

      const overlay = document.querySelector<HTMLElement>('[data-transition-overlay]')
      const snapshot = overlay?.querySelector<HTMLElement>('[data-transition-snapshot]')
      const middle = overlay?.querySelector<HTMLElement>('[data-transition-middle]')
      const next = overlay?.querySelector<HTMLElement>('[data-transition-next]')
      const backdrop = overlay?.querySelector<HTMLElement>('.transition__backdrop')
      if (!overlay || !snapshot || !middle || !next || !backdrop) {
        stage = 'idle'
        return
      }

      await alrdyDestroy()
      if (superseded()) return

      const newMain = await waitForNewMain(snapshot)
      if (superseded() || !newMain) {
        // Don't reset stage if a newer transition already owns it.
        if (token === navToken) stage = 'idle'
        return
      }

      // Handoff: position the real new <main> at the deck's "next" slot and
      // hide the placeholder layers. Now the deck contains: snapshot (clone
      // of leaving page), middle (orange), real new <main> at scale 0.8 —
      // exactly matching Osmo's Barba sync mode where `next` IS the real new
      // page DOM.
      handoffNextToRealMain(backdrop, next, newMain)

      // Init alrdy-animate AFTER handoff so its from-states are applied to
      // a main element that's already in its scaled deck position.
      await alrdyInit(newMain)
      if (superseded()) return

      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      await runEnterTimeline(snapshot, middle, newMain, reducedMotion)
      // A back gesture during the enter already hard-reset us — don't run the
      // cleanup below, it would clobber the reset's clean state.
      if (superseded()) return

      // Cleanup: restore the real new <main> to normal flow, clear the overlay,
      // restore body scroll + Lenis, refresh ScrollTrigger.
      const gsap = (window as any).gsap
      gsap.set(newMain, {
        clearProps:
          'position,top,left,right,width,height,overflow,zIndex,transformStyle,willChange,backfaceVisibility,transform,clipPath,opacity,visibility',
      })
      snapshot.innerHTML = ''
      gsap.set([snapshot, middle, next, backdrop], { clearProps: 'all' })
      gsap.set(overlay, { display: 'none' })
      document.body.style.overflow = ''
      const lenis = window.lenis as unknown as { resize: () => void; start: () => void } | undefined
      if (lenis) {
        lenis.resize()
        lenis.start()
      }
      const ScrollTrigger = (window as any).ScrollTrigger
      if (ScrollTrigger) ScrollTrigger.refresh()

      pendingHrefRef.current = null
      stage = 'idle'
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  const navigate = useCallback<NavigateFn>(
    (href) => {
      if (typeof window === 'undefined') return
      if (stage !== 'idle') return
      if (!(window as any).gsap) {
        router.push(href)
        return
      }

      const currentMain = document.querySelector<HTMLElement>('main[data-transition-container]')
      const overlay = document.querySelector<HTMLElement>('[data-transition-overlay]')
      const snapshot = overlay?.querySelector<HTMLElement>('[data-transition-snapshot]')
      const middle = overlay?.querySelector<HTMLElement>('[data-transition-middle]')
      const next = overlay?.querySelector<HTMLElement>('[data-transition-next]')
      if (!currentMain || !overlay || !snapshot || !middle || !next) {
        router.push(href)
        return
      }

      stage = 'leaving'
      const token = ++navToken
      pendingHrefRef.current = href
      const scrollY = window.scrollY || 0

      // Clone the leaving page into the snapshot slot. The clone keeps
      // alrdy-animate's inline styles (aa-ready visibility + GSAP transforms),
      // so the snapshot looks frame-identical to what the user was seeing.
      const clone = currentMain.cloneNode(true) as HTMLElement
      snapshot.appendChild(clone)

      const gsap = (window as any).gsap
      gsap.set(overlay, { display: 'block' })
      // All three deck layers start at full-cover scale:1, yPercent:0,
      // matching Osmo's prepareForTransition. The leave timeline shrinks
      // them down to their deck positions.
      gsap.set([snapshot, middle, next], {
        autoAlpha: 1,
        scale: 1,
        yPercent: 0,
        clipPath: 'inset(0% round 0em)',
        transformOrigin: '50% 50%',
        backfaceVisibility: 'hidden',
      })
      // Clone inside the snapshot is offset by -scrollY so the visible
      // viewport slice matches what the user was looking at.
      gsap.set(clone, {
        position: 'absolute',
        top: -scrollY,
        left: 0,
        width: '100%',
      })

      document.body.style.overflow = 'hidden'
      ;(window.lenis as unknown as { stop?: () => void } | undefined)?.stop?.()

      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      runLeaveTimeline(snapshot, middle, next, reducedMotion).then(() => {
        // A back/forward gesture during the leave already hard-reset us and
        // bumped navToken — don't push forward into the page we were leaving.
        if (token !== navToken) return
        // Deck has formed; the orange middle + cream next-card stack covers
        // the bottom of the viewport while the snapshot sits centred above.
        // Around the edges the black backdrop shows. Safe to push.
        window.scrollTo(0, 0)
        stage = 'entering'
        router.push(href)
      })
    },
    [router],
  )

  return <TransitionContext.Provider value={navigate}>{children}</TransitionContext.Provider>
}
