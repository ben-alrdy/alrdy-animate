import type { FeatureContext, FeatureModule } from '../../core/registry'
import { readAttrs, type Config } from '../../core/settings'

interface ParsedTokens {
  isRight: boolean
  isPaused: boolean
  hoverPause: boolean
  hasSwitch: boolean
  isDraggable: boolean
  isNone: boolean
}

function parseMarqueeValue(raw: string | undefined): ParsedTokens {
  const tokens = (raw ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  return {
    isRight: tokens.includes('right'),
    isPaused: tokens.includes('paused'),
    hoverPause: tokens.includes('hover-pause'),
    hasSwitch: tokens.includes('switch'),
    isDraggable: tokens.includes('draggable'),
    isNone: tokens.includes('none'),
  }
}

function parseNum(value: string | null | undefined, fallback: number): number {
  if (value === undefined || value === null) return fallback
  const n = parseFloat(value)
  return Number.isFinite(n) ? n : fallback
}

function parseScrub(value: string | undefined): number | true | undefined {
  if (value === undefined) return undefined
  if (value === '' || value === 'true') return true
  const n = parseFloat(value)
  return Number.isFinite(n) ? n : true
}

interface DraggableInstance {
  kill: () => void
  enable: () => DraggableInstance
  disable: () => DraggableInstance
  startX: number
  x: number
  isThrowing: boolean
  getDirection: (from: 'start' | 'velocity') => string
  vars: Record<string, unknown>
}

interface DraggableConstructor {
  create: (target: unknown, vars: Record<string, unknown>) => DraggableInstance[]
}

interface ScrollTriggerLike {
  create: (vars: Record<string, unknown>) => { kill: () => void }
}

interface InertiaPluginLike {
  track?: (target: unknown, properties: string) => unknown[]
  untrack?: (target: unknown, properties?: string) => void
  getVelocity?: (target: unknown, property: string) => number
}

function fillTrack(
  list: HTMLElement,
  track: HTMLElement,
  rootWidth: number,
  cycleDistance: number,
  scrubOvershootPx: number,
): HTMLElement[] {
  const clones: HTMLElement[] = []
  // Loop wrap needs `viewport + cycleDistance` worth of content so the seam
  // is invisible. Scrub mode shifts the scroller by ±scrubOvershoot on top of
  // that, so we add 2× the overshoot to keep the visible window populated at
  // both extremes of the sweep. +2px slop tolerates sub-pixel rounding.
  const minRequiredWidth = rootWidth + cycleDistance + scrubOvershootPx * 2 + 2
  let safety = 0
  while (track.scrollWidth < minRequiredWidth && safety < 20) {
    const clone = list.cloneNode(true) as HTMLElement
    clone.setAttribute('aa-marquee-clone', '')
    clone.setAttribute('aria-hidden', 'true')
    track.appendChild(clone)
    clones.push(clone)
    safety++
  }
  return clones
}

function setupOne(
  ctx: FeatureContext,
  root: HTMLElement,
  config: Config,
): (() => void) | undefined {
  const tokens = parseMarqueeValue(config['aa-marquee'])
  if (tokens.isNone) return undefined

  // Three authored wrappers, each with a single role. Scroller is the
  // scroll-driven sweep layer (no-op without aa-scrub). Track is the infinite
  // loop layer — duplicates of [aa-marquee-list] land here. List is the
  // authored cluster of items; cloned by the lib to fill the track width.
  const scroller = root.querySelector<HTMLElement>('[aa-marquee-scroller]')
  const track = root.querySelector<HTMLElement>('[aa-marquee-track]')
  const list = root.querySelector<HTMLElement>('[aa-marquee-list]')
  if (!scroller || !track || !list) {
    if (ctx.debug) {
      console.warn(
        '[alrdy-animate] aa-marquee requires [aa-marquee-scroller], [aa-marquee-track], and [aa-marquee-list] descendants.',
        root,
      )
    }
    return undefined
  }

  const duration = parseNum(config['aa-duration'], 20)
  // Scrub mode is enabled by the presence of the `aa-scrub` attribute on the
  // marquee root (mirrors how every other animation feature treats `aa-scrub`).
  // The attribute's value also becomes the ScrollTrigger scrub delay — `true`
  // for an instant lock, or seconds for smoothing. `aa-distance` is the sweep
  // magnitude in viewport-percent: `10` = ±10vw on each side (20vw total).
  const scrubValue = parseScrub(config['aa-scrub'])
  const isScrub = scrubValue !== undefined
  const distance = parseNum(config['aa-distance'], 10)

  const gsap = ctx.gsap.gsap as unknown as Record<string, any>
  const ScrollTrigger = ctx.gsap.plugins.ScrollTrigger as ScrollTriggerLike | undefined
  const Draggable = ctx.gsap.plugins.Draggable as DraggableConstructor | undefined
  const InertiaPlugin = ctx.gsap.plugins.InertiaPlugin as InertiaPluginLike | undefined
  void InertiaPlugin

  // Cycle distance is just list.scrollWidth — `margin-left` / `margin-right`
  // on items fold into that measurement, so cloned-list seams match in-list
  // spacing automatically. CSS `gap` / `column-gap` is not supported.
  const rootWidth = root.getBoundingClientRect().width
  const cycleDistance = list.scrollWidth || list.getBoundingClientRect().width
  if (!rootWidth || !cycleDistance) return undefined

  // Compute scrub overshoot up front so fillTrack provisions enough clones
  // to cover both the loop wrap AND the scroller sweep at its extremes.
  // distance is in vw, so half-sweep px = innerWidth * distance / 100.
  const halfSweepPx = isScrub ? (window.innerWidth * distance) / 100 : 0

  const clones = fillTrack(list, track, rootWidth, cycleDistance, halfSweepPx)

  // Scrub composes with the loop by sitting on a different transform layer:
  // the scroller takes the scroll-driven x sweep, the track takes the infinite
  // loop x — both translate independently, the browser composes them. Without
  // the marginLeft offset, the scroller's content span would not cover root's
  // left edge at the +halfSweepPx extreme (max right shift), exposing the gap
  // between root.left and the shifted scroller. We restore the original inline
  // margin-left on cleanup so authored CSS keeps owning the static state.
  const originalScrollerMarginLeft = scroller.style.marginLeft
  if (isScrub) {
    scroller.style.marginLeft = `${-halfSweepPx}px`
  }

  // Build the infinite tween. modifiers.x wraps x ∈ [-cycleDistance, 0) so the
  // track translates leftward forever without an actual reset jump. The same
  // tween drives both directions — direction is set via timeScale, not by
  // changing the tween target.
  const wrapX = (gsap.utils.wrap as (a: number, b: number) => (n: number) => number)(
    -cycleDistance,
    0,
  )
  gsap.set(track, { x: 0 })
  // Create paused so we can set progress + timeScale before the first tick.
  // Without this, the tween auto-starts forward at timeScale=1 and a few
  // microseconds of forward motion leak in before the right-direction setup
  // (progress(1) + timeScale(-1)) lands. With repeat:-1, the loop bounces
  // forward forever; with timeScale<0 it reverses, and onReverseComplete
  // fires when the reversed loop reaches time 0 — without bouncing it back
  // to the end, the loop just stops there. Mirror Osmo's pattern.
  let loop: ReturnType<typeof gsap.to>
  loop = gsap.to(track, {
    x: -cycleDistance,
    duration,
    ease: 'none',
    repeat: -1,
    paused: true,
    onReverseComplete: () => loop.progress(1),
    modifiers: {
      x: (x: string) => wrapX(parseFloat(x)) + 'px',
    },
  })

  // Direction: left = +1 (default), right = -1. Track this in a tweenable
  // wrapper so drag/switch interactions can smoothly ramp it.
  const baseDirection = tokens.isRight ? -1 : 1
  const timeScale = { value: baseDirection }
  let lastSwitchDirection = baseDirection

  const applyTimeScale = (): void => {
    loop.timeScale(timeScale.value)
    root.setAttribute('aa-marquee-direction', timeScale.value < 0 ? 'right' : 'left')
  }

  // For right-direction starts, advance to the wrap point so the loop has
  // headroom to reverse from end → start (mirrors Osmo).
  if (baseDirection < 0) loop.progress(1)
  applyTimeScale()
  if (!tokens.isPaused) loop.play()

  const cleanups: Array<() => void> = []

  // Scrub layer: scroll progress drives the wrapper's x in viewport-relative
  // units. aa-distance=10 → ±10vw per side (20vw total); aa-distance=20
  // doubles it. baseDirection (left/right) flips which way the row drifts on
  // scroll-down. We resolve vw → px ourselves because GSAP's `x` shortcut
  // accepts raw numbers as pixels and silently drops the "vw" suffix; passing
  // a string like "100vw" gets read as the integer 100 (px). On resize we
  // recompute and rebuild the tween so the sweep stays viewport-relative.
  if (isScrub && ScrollTrigger) {
    let scrubTween: ReturnType<typeof gsap.to> | null = null

    const buildScrubTween = (): void => {
      const sweepPx = (window.innerWidth * distance) / 100
      // Default direction (left) sweeps right→left as you scroll down so it
      // composes with the leftward loop. `right` token flips both ends.
      const startX = baseDirection > 0 ? sweepPx : -sweepPx
      const endX = -startX
      scrubTween = gsap.fromTo(
        scroller,
        { x: startX },
        {
          x: endX,
          ease: 'none',
          immediateRender: true,
          scrollTrigger: {
            trigger: root,
            start: 'top bottom',
            end: 'bottom top',
            scrub: scrubValue,
            invalidateOnRefresh: true,
          },
        },
      )
    }

    buildScrubTween()
    cleanups.push(
      ctx.onResize(() => {
        if (scrubTween) {
          ;(scrubTween as { scrollTrigger?: { kill: () => void } }).scrollTrigger?.kill()
          scrubTween.kill()
        }
        // Recompute the marginLeft offset to match the new viewport — sweep
        // magnitude is viewport-relative, so the offset must follow.
        scroller.style.marginLeft = `${-(window.innerWidth * distance) / 100}px`
        buildScrubTween()
      }, 200),
    )
    cleanups.push(() => {
      if (scrubTween) {
        ;(scrubTween as { scrollTrigger?: { kill: () => void } }).scrollTrigger?.kill()
        scrubTween.kill()
      }
    })
  }

  let draggable: DraggableInstance | null = null

  // Optional draggable: mirror the slider's horizontalLoop pattern. On press
  // we pause the loop and capture its progress, mapping the proxy's x to that
  // progress so subsequent drag delta translates 1:1 into progress delta. Each
  // drag tick aligns loop.progress() to the wrapped target. Draggable's own
  // inertia continues to drive align after release; on throw complete, the
  // loop resumes in the direction of the last flick (captured on release).
  if (tokens.isDraggable) {
    if (!Draggable || typeof Draggable.create !== 'function' || !InertiaPlugin) {
      if (ctx.debug) {
        console.warn(
          '[alrdy-animate] aa-marquee="draggable" requires GSAP Draggable + InertiaPlugin. Add the Draggable.min.js and InertiaPlugin.min.js script tags.',
          root,
        )
      }
    } else {
      const proxy = document.createElement('div')
      proxy.setAttribute('aria-hidden', 'true')
      proxy.style.cssText = 'position:absolute;width:0;height:0;pointer-events:none;'
      root.appendChild(proxy)

      const wrap = (gsap.utils.wrap as (a: number, b: number) => (n: number) => number)(0, 1)
      const ratio = 1 / cycleDistance
      let startProgress = 0
      // Resume direction after the throw lands. Default to baseDirection so a
      // press-without-flick (or no-velocity click) returns to the original
      // cruise direction. Each release with measurable velocity overrides it.
      let throwDirection = baseDirection

      const align = (): void => {
        if (!draggable) return
        loop.progress(wrap(startProgress + (draggable.startX - draggable.x) * ratio))
      }

      const resumeLoop = (): void => {
        if (tokens.isPaused) return
        timeScale.value = throwDirection
        applyTimeScale()
        loop.resume()
      }

      draggable = Draggable.create(proxy, {
        trigger: root,
        type: 'x',
        inertia: true,
        cursor: 'grab',
        activeCursor: 'grabbing',
        onPressInit(this: DraggableInstance) {
          gsap.killTweensOf(timeScale)
          gsap.killTweensOf(loop)
          loop.pause()
          startProgress = loop.progress()
          // Anchor proxy.x at -progress/ratio so subsequent drag delta
          // becomes (startX - x) = drag delta, which align() turns into
          // progress delta with the right sign.
          gsap.set(proxy, { x: -startProgress / ratio })
        },
        onDrag: align,
        onThrowUpdate: align,
        onRelease(this: DraggableInstance) {
          // Capture the flick direction from velocity at release.
          // Drag right (proxy.x increasing → progress decreasing → track moves
          // right) ⇒ resume loop in right direction (timeScale -1).
          // Drag left ⇒ resume in left direction (timeScale +1).
          // Empty / vertical-only velocity leaves throwDirection unchanged.
          const dir = this.getDirection('velocity')
          if (dir.startsWith('right')) throwDirection = -1
          else if (dir.startsWith('left')) throwDirection = 1
          // No throw means a static press — onThrowComplete will not fire,
          // so resume here. With a real throw, defer to onThrowComplete.
          if (!this.isThrowing) resumeLoop()
        },
        onThrowComplete: resumeLoop,
      })[0]

      cleanups.push(() => {
        draggable?.kill()
        proxy.remove()
      })
    }
  }

  // Optional hover-pause. Skipped on touch devices (no hover semantics) and
  // when the element is also draggable — dragging implies sustained pointerover
  // and a hover-pause would freeze the loop mid-drag. Critical: use resume()
  // not play() — play() always plays forward and would flip the direction of
  // a right-direction marquee. resume() preserves the current play direction.
  if (tokens.hoverPause && !tokens.isDraggable && !window.matchMedia('(hover: none)').matches) {
    let pausedByHover = false
    const onEnter = (): void => {
      if (loop.paused()) return
      loop.pause()
      pausedByHover = true
    }
    const onLeave = (): void => {
      if (!pausedByHover || tokens.isPaused) return
      pausedByHover = false
      loop.resume()
    }
    root.addEventListener('mouseenter', onEnter)
    root.addEventListener('mouseleave', onLeave)
    cleanups.push(() => {
      root.removeEventListener('mouseenter', onEnter)
      root.removeEventListener('mouseleave', onLeave)
    })
  }

  // Optional switch: invert direction when body[aa-scroll-direction] flips.
  // Composes with paused (still no motion) but conflicts with draggable's
  // velocity-driven timeScale, so we skip switch in that case.
  if (tokens.hasSwitch && !tokens.isDraggable) {
    const apply = (): void => {
      const scrollDirection = document.body.getAttribute('aa-scroll-direction') ?? 'down'
      const isInverted = scrollDirection === 'up'
      const newDirection = isInverted ? -baseDirection : baseDirection
      if (newDirection === lastSwitchDirection) return
      lastSwitchDirection = newDirection
      gsap.killTweensOf(timeScale)
      gsap.to(timeScale, {
        value: newDirection,
        duration: 0.3,
        ease: 'power2.out',
        onUpdate: applyTimeScale,
        onComplete: applyTimeScale,
      })
    }
    const mo = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.attributeName === 'aa-scroll-direction') {
          apply()
          break
        }
      }
    })
    mo.observe(document.body, {
      attributes: true,
      attributeFilter: ['aa-scroll-direction'],
    })
    cleanups.push(() => mo.disconnect())
    apply()
  }

  // Pause loop + drag input when the marquee is off-screen — mirrors the
  // viewport gating slider/tabs autoplay use. Without this the loop keeps
  // ticking far below or above the fold for no visible benefit. Use resume()
  // here too so right-direction loops don't get flipped by the gating.
  if (ScrollTrigger) {
    const st = ScrollTrigger.create({
      trigger: root,
      start: 'top bottom',
      end: 'bottom top',
      onEnter: () => {
        if (!tokens.isPaused) loop.resume()
        applyTimeScale()
        draggable?.enable()
      },
      onEnterBack: () => {
        if (!tokens.isPaused) loop.resume()
        applyTimeScale()
        draggable?.enable()
      },
      onLeave: () => {
        loop.pause()
        draggable?.disable()
      },
      onLeaveBack: () => {
        loop.pause()
        draggable?.disable()
      },
    })
    cleanups.push(() => st.kill())
  }

  return () => {
    for (const fn of cleanups) fn()
    gsap.killTweensOf(timeScale)
    loop.kill()
    for (const c of clones) c.remove()
    gsap.set(track, { clearProps: 'transform,x' })
    if (isScrub) {
      gsap.set(scroller, { clearProps: 'transform,x' })
      // Restore whatever inline margin-left the author had (usually empty).
      // We never touch external CSS, so styles applied via classes are
      // unaffected — only our own inline override is reverted.
      scroller.style.marginLeft = originalScrollerMarginLeft
    }
    root.removeAttribute('aa-marquee-direction')
  }
}

const marqueeFeature: FeatureModule = {
  name: 'marquee',
  requiredPlugins: ['ScrollTrigger', 'Draggable', 'InertiaPlugin'],
  init(ctx: FeatureContext): () => void {
    const subjects = ctx.elements.filter(
      (el): el is HTMLElement => el instanceof HTMLElement && el.hasAttribute('aa-marquee'),
    )
    for (const root of subjects) {
      const attrs = readAttrs(root)
      ctx.responsive.bind(root, attrs, ({ config }) => setupOne(ctx, root, config))
    }
    return () => {}
  },
}

export default marqueeFeature
