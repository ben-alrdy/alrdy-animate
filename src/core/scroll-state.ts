/**
 * Always-on scroll-state utilities.
 *
 * 1. Body attributes:
 *    - `aa-scroll-direction="up" | "down"` (5px movement threshold)
 *    - `aa-scroll-started="true" | "false"` (50px scrollY threshold)
 *
 *    Driven by a single passive scroll listener with rAF throttling. Powers
 *    the CSS-driven nav-hide rule and any user CSS that wants to react to
 *    scroll direction without writing JS.
 *
 * 2. `[aa-toggle-playstate]` IntersectionObserver:
 *    Pauses/plays each child element's Web Animations API animations when
 *    the container scrolls in or out of the viewport. Useful for stopping
 *    background CSS keyframe loops while they're off-screen.
 *
 * Both behaviors are gated together by `init({ scrollState: false })`.
 */

const DIRECTION_THRESHOLD = 5
const STARTED_THRESHOLD = 50

function initScrollDirection(): () => void {
  const body = document.body
  let lastScrollTop = 0
  let lastDirection: 'up' | 'down' | null = null
  let lastStarted: 'true' | 'false' | null = null
  let ticking = false

  const apply = (): void => {
    const currentScrollTop = window.scrollY
    const delta = Math.abs(currentScrollTop - lastScrollTop)
    if (delta >= DIRECTION_THRESHOLD) {
      const direction: 'up' | 'down' = currentScrollTop > lastScrollTop ? 'down' : 'up'
      const started: 'true' | 'false' = currentScrollTop > STARTED_THRESHOLD ? 'true' : 'false'
      if (direction !== lastDirection) {
        body.setAttribute('aa-scroll-direction', direction)
        lastDirection = direction
      }
      if (started !== lastStarted) {
        body.setAttribute('aa-scroll-started', started)
        lastStarted = started
      }
      lastScrollTop = currentScrollTop
    }
    ticking = false
  }

  const onScroll = (): void => {
    if (ticking) return
    ticking = true
    requestAnimationFrame(apply)
  }

  // Seed initial values so CSS rules have something to read on first paint.
  requestAnimationFrame(() => {
    if (!body.hasAttribute('aa-scroll-direction')) {
      body.setAttribute('aa-scroll-direction', 'down')
      lastDirection = 'down'
    } else {
      lastDirection = body.getAttribute('aa-scroll-direction') as 'up' | 'down'
    }
    const started: 'true' | 'false' = window.scrollY > STARTED_THRESHOLD ? 'true' : 'false'
    body.setAttribute('aa-scroll-started', started)
    lastStarted = started
    lastScrollTop = window.scrollY
  })

  window.addEventListener('scroll', onScroll, { passive: true })

  return () => {
    window.removeEventListener('scroll', onScroll)
    body.removeAttribute('aa-scroll-direction')
    body.removeAttribute('aa-scroll-started')
  }
}

function initPlayStateObserver(): () => void {
  const elements = document.querySelectorAll<HTMLElement>('[aa-toggle-playstate]')
  if (elements.length === 0) return () => {}

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      const children = (entry.target as HTMLElement).children
      for (const child of Array.from(children)) {
        const animations = (child as HTMLElement).getAnimations?.() ?? []
        for (const animation of animations) {
          if (entry.isIntersecting) animation.play()
          else animation.pause()
        }
      }
    }
  })

  for (const el of elements) observer.observe(el)

  return () => observer.disconnect()
}

export function initScrollState(): () => void {
  if (typeof window === 'undefined') return () => {}
  const directionDispose = initScrollDirection()
  const playStateDispose = initPlayStateObserver()
  return () => {
    directionDispose()
    playStateDispose()
  }
}
