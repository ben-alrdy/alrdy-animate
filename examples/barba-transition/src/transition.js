// -----------------------------------------
// alrdy-animate × Barba × Osmo stacked-cards transition
// -----------------------------------------

import { init, destroy, ready } from 'alrdy-animate'
import 'alrdy-animate/style'

const { gsap, barba } = window
const ScrollTrigger = window.ScrollTrigger
const CustomEase = window.CustomEase

gsap.registerPlugin(CustomEase)
history.scrollRestoration = 'manual'

CustomEase.create('osmo', '0.625, 0.05, 0, 1')
gsap.defaults({ ease: 'osmo', duration: 0.6 })

const rmMQ = window.matchMedia('(prefers-reduced-motion: reduce)')
let reducedMotion = rmMQ.matches
rmMQ.addEventListener?.('change', (e) => (reducedMotion = e.matches))

// -----------------------------------------
// PAGE TRANSITIONS (verbatim Osmo)
// -----------------------------------------

function runPageOnceAnimation(next) {
  const tl = gsap.timeline()
  tl.call(() => resetPage(next), null, 0)
  return tl
}

function runPageLeaveAnimation(current, next) {
  const parent = current.parentElement || document.body
  const { wrapper } = prepareForTransition(parent, current, next)

  const transitionWrap = document.querySelector('[data-transition-wrap]')
  const transitionMiddle = transitionWrap.querySelector('[data-transition-middle]')

  const tl = gsap.timeline({
    onComplete: () => {
      wrapper.remove()
      gsap.set(parent, { clearProps: 'perspective,transformStyle,overflow' })
      gsap.set(next, {
        clearProps:
          'position,inset,width,height,zIndex,transformStyle,willChange,backfaceVisibility,transform',
      })
    },
  })

  if (reducedMotion) {
    return tl.set(current, { autoAlpha: 0 })
  }

  tl.to(
    [wrapper, transitionMiddle, next],
    { clipPath: 'rect(0% 100% 100% 0% round 1em)', duration: 0.8 },
    0,
  )

  tl.to(wrapper, {
    scale: '0.95',
    duration: 1.2,
    yPercent: 20,
    ease: 'expo.inOut',
    overwrite: 'auto',
  }, '<')

  tl.to(transitionMiddle, {
    scale: '0.875',
    yPercent: 10,
    duration: 1.2,
    ease: 'expo.inOut',
    overwrite: 'auto',
  }, '<')

  tl.to(next, {
    scale: '0.8',
    yPercent: 0,
    duration: 1.2,
    ease: 'expo.inOut',
    overwrite: 'auto',
  }, '<')

  tl.to(wrapper, { yPercent: 130, duration: 1.2, ease: 'osmo' }, '< 0.9')
  tl.to(transitionMiddle, { yPercent: 120, duration: 1.2, ease: 'osmo' }, '< 0.15')
  tl.to(next, {
    scale: '1',
    yPercent: 0,
    duration: 1.2,
    ease: 'expo.inOut',
    overwrite: 'auto',
  }, '< 0.15')

  tl.to(
    [wrapper, transitionMiddle, next],
    { clipPath: 'rect(0% 100% 100% 0% round 0em)', duration: 0.8, ease: 'osmo' },
    '> -0.8',
  )

  // Slide the new page's nav down from above as the wrapper drops away.
  const navigation = next.querySelector('.demo-nav')
  if (navigation) {
    tl.from(navigation, { yPercent: -100, duration: 1.2, ease: 'osmo' }, '< -0.1')
  }

  // Fire the box stagger as the new page is visually settling — i.e. as the
  // final clipPath round-off plays, NOT after the whole timeline ends. Without
  // this the cards wait for the leave timeline's full duration (the wrapper
  // drops away around t≈2.1s but the clipPath final keeps the timeline alive
  // until ~2.85s, so a default `afterEnter` dispatch lands ~0.75s late).
  // Gated on ready() so the event listeners are guaranteed to be attached
  // even if init hadn't finished yet.
  tl.call(
    () => {
      ready().then(() => fireEnterAnimations(next))
    },
    null,
    '< 0.6',
  )

  return tl
}

function runPageEnterAnimation(next) {
  const tl = gsap.timeline()

  if (reducedMotion) {
    tl.set(next, { autoAlpha: 1 })
    tl.add('pageReady')
    tl.call(resetPage, [next], 'pageReady')
    return new Promise((resolve) => tl.call(resolve, null, 'pageReady'))
  }

  tl.add('pageReady')
  tl.call(resetPage, [next], 'pageReady')

  return new Promise((resolve) => {
    tl.call(resolve, null, 'pageReady')
  })
}

function prepareForTransition(parent, current, next) {
  const wrapper = document.createElement('div')
  wrapper.className = 'page-transition__wrapper'

  parent.insertBefore(wrapper, current)
  wrapper.appendChild(current)

  const scrollY = window.scrollY || 0
  window.scrollTo(0, 0)

  const transitionWrap = document.querySelector('[data-transition-wrap]')
  const transitionMiddle = transitionWrap.querySelector('[data-transition-middle]')

  gsap.set(parent, {
    perspective: '100vw',
    transformStyle: 'preserve-3d',
    overflow: 'clip',
  })

  gsap.set(wrapper, {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    width: '100%',
    height: '100vh',
    overflow: 'clip',
    zIndex: 3,
    transformStyle: 'preserve-3d',
    willChange: 'transform',
    clipPath: 'rect(0% 100% 100% 0% round 0em)',
  })

  gsap.set(current, {
    position: 'absolute',
    top: -scrollY,
    left: 0,
    width: '100%',
    willChange: 'transform, opacity',
    backfaceVisibility: 'hidden',
  })

  gsap.set(transitionWrap, { zIndex: 2 })

  gsap.set(transitionMiddle, {
    willChange: 'transform, opacity',
    autoAlpha: 1,
    yPercent: 0,
    scale: 1,
    clipPath: 'rect(0% 100% 100% 0% round 0em)',
  })

  gsap.set(next, {
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
    scale: 1,
    clipPath: 'rect(0% 100% 100% 0% round 0em)',
  })

  return { wrapper, scrollY }
}

// -----------------------------------------
// alrdy-animate lifecycle wiring
// -----------------------------------------
//
// Why this shape:
//   • init() in beforeEnter, scoped to data.next.container — runs in parallel
//     with the leave timeline. The new container's aa-* elements get their
//     from-states applied while the old page is still scaling down, so by the
//     time the wrapper drops away the boxes are ready to animate. No pause
//     between the transition ending and the box animations starting.
//   • aa-trigger="event:enter" on the boxes — they wait for an explicit event
//     instead of firing on viewport. Without this the boxes would auto-fire
//     (they're in viewport on the fixed-positioned new container at zIndex 1)
//     and the user would never see the animation since it'd play behind the
//     wrapper.
//   • In afterEnter we dispatch the `aa:trigger` event with name "enter" on
//     each box, with stagger applied via per-element delay.

let alrdyReady = false

function alrdyInit(rootEl) {
  return init({
    debug: true,
    duration: 0.6,
    ease: 'osmo',
    distance: 1.5,
    smoothScroll: true,
    root: rootEl,
  }).then(() => {
    alrdyReady = true
  })
}

function alrdyDestroy() {
  if (!alrdyReady) return
  // keepGlobals: true leaves Lenis, the body scroll-state observer, and the
  // scroll-target observer alive across the page swap. They re-attach to the
  // same `document.documentElement` / `<body>` on the new page, so churning
  // them every nav is wasted work (and would also reset Lenis's scroll
  // velocity / momentum mid-transition).
  //
  // keepFromStates: true keeps the inline GSAP from-states on the leaving
  // container instead of clearing them via mm.revert(). Otherwise, scroll
  // animations that hadn't fired yet (in viewport but below the trigger
  // threshold, or further below the fold) would snap visible mid-leave and
  // flash. The wrapper is removed at the end of the leave timeline, so the
  // lingering inline styles vanish with the DOM.
  destroy({ keepGlobals: true, keepFromStates: true })
  alrdyReady = false
}

// Stagger is owned by the lib via `aa-stagger="0.1"` on the parent grid. We
// just dispatch a single `aa:trigger` event per trigger element; the lib
// plays the staggered tween for all `aa-children` from that.
//
// `~="event:enter"` matches whitespace-separated lists, so it picks up both
// the standalone `aa-trigger="event:enter"` form AND the combined
// `aa-trigger="load event:enter"` form (load on first init, event:enter on
// every subsequent Barba navigation). On first init the combined-form
// elements skip event subscription (load already fired), so this dispatch
// safely no-ops against them — only standalone-event elements respond.
function fireEnterAnimations(rootEl) {
  const targets = rootEl.querySelectorAll('[aa-trigger~="event:enter"]')
  targets.forEach((el) => {
    el.dispatchEvent(
      new CustomEvent('aa:trigger', { detail: { name: 'enter' }, bubbles: true }),
    )
  })
}

// -----------------------------------------
// BARBA HOOKS + INIT
// -----------------------------------------


barba.hooks.beforeEnter((data) => {
  // Position new container on top while the leave animation runs. zIndex: 1 is
  // critical — without it, default `auto` makes the fixed-positioned new
  // container paint above the still-in-flow old container before
  // prepareForTransition runs at the start of the leave timeline. Pinning
  // zIndex here matches what prepareForTransition will set anyway and closes
  // the one-frame flicker window between beforeEnter and leave.
  gsap.set(data.next.container, {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  })

  if (window.lenis?.stop) window.lenis.stop()

  // Tear down lib state from the leaving page, then re-init scoped to the new
  // container. Don't await — leave should start immediately so the layout in
  // prepareForTransition takes effect on the very next frame. Init runs in
  // parallel with the ~3s leave timeline; the leave timeline's tl.call gates
  // the box-trigger dispatch on `ready()` resolving first.
  alrdyDestroy()
  alrdyInit(data.next.container)
})

barba.hooks.afterEnter(() => {
  if (ScrollTrigger) ScrollTrigger.refresh()
})

barba.init({
  debug: true,
  timeout: 7000,
  preventRunning: true,
  transitions: [
    {
      name: 'default',
      sync: true,
      async once(data) {
        // beforeEnter hook fires for `once` too and already kicked off
        // alrdyInit — so we just wait on the same in-flight promise here.
        // Calling alrdyInit again would either start a second init (race) or
        // early-return because state.initialized is true (race in the other
        // direction: matchMedia listeners aren't attached yet).
        await ready()
        fireEnterAnimations(data.next.container)
        return runPageOnceAnimation(data.next.container)
      },
      async leave(data) {
        return runPageLeaveAnimation(data.current.container, data.next.container)
      },
      async enter(data) {
        return runPageEnterAnimation(data.next.container)
      },
    },
  ],
})

// -----------------------------------------
// HELPERS
// -----------------------------------------

function resetPage(container) {
  window.scrollTo(0, 0)
  gsap.set(container, { clearProps: 'position,top,left,right' })

  if (window.lenis) {
    window.lenis.resize()
    window.lenis.start()
  }
}
