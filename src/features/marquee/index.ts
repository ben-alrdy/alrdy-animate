import { parseAutoplay } from '../../core/autoplay'
import { bindRootFeature, type FeatureContext, type FeatureModule } from '../../core/registry'
import { parseNum, parseScrub } from '../../core/parse'
import { readAttrs, type BucketKey, type Config } from '../../core/settings'
import { attachHoverPauseListener, createViewportGate } from '../../core/viewport-gate'

interface ParsedTokens {
  isRight: boolean
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
    hasSwitch: tokens.includes('switch'),
    isDraggable: tokens.includes('draggable'),
    isNone: tokens.includes('none'),
  }
}

// Animation attributes stripped from clones so the FOUC guard
// (`[aa-animate]:not([aa-ready])`) doesn't leave them hidden and no stray
// ScrollTrigger/entrance re-fires on a duplicated item. Originals keep theirs.
const CLONE_STRIPPED_ATTRS = [
  'aa-animate',
  'aa-delay',
  'aa-duration',
  'aa-stagger',
  'aa-trigger',
  'aa-again',
  'aa-scroll-start',
  'aa-scroll-end',
  'aa-ease',
]
// Inline from-state GSAP may have applied to the original before cloning.
// Includes clip-path (reveal-*) and both vendor forms.
const CLONE_CLEARED_STYLES = [
  'opacity',
  'transform',
  'filter',
  'visibility',
  'clip-path',
  '-webkit-clip-path',
]

function clearFromState(el: HTMLElement): void {
  for (const prop of CLONE_CLEARED_STYLES) el.style.removeProperty(prop)
}

// Strip the animation attributes so the clone is never rescanned or FOUC-hidden;
// then clear any inline from-state so the clone renders solid. The from-state
// may sit on the `aa-animate` element itself, on its direct children (the
// `aa-stagger` targets), or deeper still (split text lands opacity/transform on
// grandchild char/word/line spans) — so clear across the whole animated subtree.
function sanitizeClone(clone: HTMLElement): void {
  const animated = clone.matches('[aa-animate]')
    ? [clone, ...clone.querySelectorAll<HTMLElement>('[aa-animate]')]
    : [...clone.querySelectorAll<HTMLElement>('[aa-animate]')]
  for (const el of animated) {
    for (const attr of CLONE_STRIPPED_ATTRS) el.removeAttribute(attr)
    clearFromState(el)
    for (const desc of el.querySelectorAll<HTMLElement>('*')) clearFromState(desc)
  }
}

// `hover-slow` ramps the loop down to this fraction of its cruise timeScale.
const HOVER_SLOW_FACTOR = 0.15

interface DraggableInstance {
  kill: () => void
  enable: () => DraggableInstance
  disable: () => DraggableInstance
  startX: number
  x: number
  isThrowing: boolean
  getDirection: (from: 'start' | 'velocity') => string
  vars: Record<string, unknown>
  /** The InertiaPlugin throw tween (present while a throw is in flight). */
  tween?: { kill: () => void }
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
    // Strip aa-animate (+ companions + inline from-state) so cloned items
    // render solid instead of staying FOUC-hidden or replaying an entrance.
    sanitizeClone(clone)
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

  // Track (infinite-loop layer, where clones land) and list (the authored
  // cluster, cloned to fill the track) are always required. Scroller is the
  // optional scroll-driven sweep layer — only needed when `aa-scrub` is set;
  // it wraps the track when present.
  const track = root.querySelector<HTMLElement>('[aa-marquee-track]')
  const list = root.querySelector<HTMLElement>('[aa-marquee-list]')
  if (!track || !list) {
    if (ctx.debug) {
      console.warn(
        '[alrdy-animate] aa-marquee requires [aa-marquee-track] and [aa-marquee-list] descendants.',
        root,
      )
    }
    return undefined
  }

  // Autoplay drives the infinite loop. Presence of `aa-autoplay` enables it
  // (matching slider/tabs); absence leaves the marquee static (scrub may still
  // apply). The value is the seconds-per-cycle duration, defaulting to 40.
  const autoplay = parseAutoplay(
    config['aa-autoplay'],
    ctx.options.autoplay,
    'aa-autoplay' in config,
    40,
  )
  const isPlaying = autoplay.enabled
  const duration = autoplay.interval

  // Scrub is enabled by the presence of `aa-scrub` on the root (as with every
  // other feature). The value becomes the ScrollTrigger scrub delay — `true`
  // for an instant lock, or seconds for smoothing. The sweep travel is a
  // percentage of the marquee's own width, authored on the scroller element:
  // `aa-marquee-scroller="30"` → ±30% of the marquee width per side (default
  // 20 → ±20%). Width-relative (not viewport-relative) so the sweep feels the
  // same regardless of how wide the browser is. Scrub requires the wrapper.
  const scroller = root.querySelector<HTMLElement>('[aa-marquee-scroller]')
  const scrubValue = parseScrub(config['aa-scrub'])
  const wantsScrub = scrubValue !== undefined
  if (wantsScrub && !scroller && ctx.debug) {
    console.warn(
      '[alrdy-animate] aa-marquee scrub requires an [aa-marquee-scroller] wrapper around [aa-marquee-track].',
      root,
    )
  }
  const isScrub = wantsScrub && !!scroller
  const scrubTravelPct = parseNum(config['aa-marquee-scroller'], 20)

  const gsap = ctx.gsap.gsap as unknown as Record<string, any>
  const ScrollTrigger = ctx.gsap.plugins.ScrollTrigger as ScrollTriggerLike | undefined
  const Draggable = ctx.gsap.plugins.Draggable as DraggableConstructor | undefined
  const InertiaPlugin = ctx.gsap.plugins.InertiaPlugin as InertiaPluginLike | undefined
  void InertiaPlugin

  // Cycle distance is just list.scrollWidth — `margin-left` / `margin-right`
  // on items fold into that measurement, so cloned-list seams match in-list
  // spacing automatically. CSS `gap` / `column-gap` is not supported. We
  // remeasure on demand (never cache long-term) because lazy images and late
  // web fonts grow the list *after* init — see the ResizeObserver below.
  const measureCycle = (): number => list.scrollWidth || list.getBoundingClientRect().width

  // Loop + clones + scrub all depend on the measured cycle. They live inside
  // buildInner so the ResizeObserver can tear the whole lot down and rebuild
  // it against a fresh measurement. activeLoop/builtCycle bridge the current
  // build out to the rebuild scheduler.
  let activeLoop: ReturnType<typeof gsap.to> | undefined
  let builtCycle = 0

  const buildInner = (prevProgress?: number): (() => void) | undefined => {
    const rootWidth = root.getBoundingClientRect().width
    const cycleDistance = measureCycle()
    if (!rootWidth || !cycleDistance) return undefined
    builtCycle = cycleDistance

    // Compute scrub overshoot up front so fillTrack provisions enough clones
    // to cover both the loop wrap AND the scroller sweep at its extremes. The
    // sweep is `scrubTravelPct` percent of the marquee's own width per side, so
    // half-sweep px = rootWidth * scrubTravelPct / 100.
    const halfSweepPx = isScrub ? (rootWidth * scrubTravelPct) / 100 : 0

    const clones = fillTrack(list, track, rootWidth, cycleDistance, halfSweepPx)

    // Scrub composes with the loop by sitting on a different transform layer:
    // the scroller takes the scroll-driven x sweep, the track takes the infinite
    // loop x — both translate independently, the browser composes them. Without
    // the marginLeft offset, the scroller's content span would not cover root's
    // left edge at the +halfSweepPx extreme (max right shift), exposing the gap
    // between root.left and the shifted scroller. We restore the original inline
    // margin-left on cleanup so authored CSS keeps owning the static state.
    const originalScrollerMarginLeft = scroller?.style.marginLeft ?? ''
    if (isScrub && scroller) {
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
    activeLoop = loop

    // Direction: left = +1 (default), right = -1. Track this in a tweenable
    // wrapper so drag/switch interactions can smoothly ramp it.
    const baseDirection = tokens.isRight ? -1 : 1
    const timeScale = { value: baseDirection }
    let lastSwitchDirection = baseDirection
    // Last `aa-marquee-direction` value written, so applyTimeScale can skip
    // redundant same-value attribute writes on its per-frame ramp path.
    let lastDirectionAttr: 'left' | 'right' | undefined

    // hover-slow scales the cruise timeScale by a positive factor (1 = full
    // speed). It multiplies onto timeScale.value so it composes with switch's
    // direction ramp and draggable's resume. Direction reflects the sign of
    // timeScale.value alone — the factor is always positive, so it never flips
    // the reported direction.
    const hoverFactor = { value: 1 }

    const applyTimeScale = (): void => {
      const ts = timeScale.value * hoverFactor.value
      // A tween sitting exactly at a boundary has no runway to play *toward*
      // that boundary: reverse (ts < 0) from progress 0, or forward from
      // progress 1, freezes — GSAP won't wrap a repeat tween past the edge it's
      // already on, and `onReverseComplete` only fires mid-playback, not when a
      // reversed tween is resumed already at the start. The wrap modifier makes
      // progress 0 and 1 render identically, so nudging to the far edge is
      // invisible and restores runway. This also seeds the right-direction first
      // build (progress 0, ts -1 → nudged to 1), and rescues a loop reversed by
      // `switch` / draggable while still parked at the boundary (e.g. built
      // paused after loading scrolled-past). The check only fires at the seam
      // (progress ∈ {0,1}); mid-cycle onUpdate frames are no-ops.
      const p = loop.progress()
      if (ts < 0 && p <= 0) loop.progress(1)
      else if (ts > 0 && p >= 1) loop.progress(0)
      loop.timeScale(ts)
      // Only touch the attribute when the direction sign actually flips —
      // applyTimeScale runs every frame of the switch / hover-slow ramps, and a
      // same-value setAttribute still invalidates style on the element.
      const dir = timeScale.value < 0 ? 'right' : 'left'
      if (dir !== lastDirectionAttr) {
        root.setAttribute('aa-marquee-direction', dir)
        lastDirectionAttr = dir
      }
    }

    // Restore the prior progress fraction across a rebuild so the corrective
    // remeasure (lazy images loaded) doesn't itself flash a reset. On the first
    // build there's no prior progress: applyTimeScale's boundary guard seeds
    // the right-direction headroom (progress 0 + ts -1 → nudged to 1, Osmo).
    if (typeof prevProgress === 'number') loop.progress(prevProgress)
    applyTimeScale()
    if (isPlaying) loop.play()

    const cleanups: Array<() => void> = []

    // Scrub layer: scroll progress drives the wrapper's x. The sweep is a
    // percentage of the marquee's own width — `aa-marquee-scroller="30"` →
    // ±30% of rootWidth per side (default 20 → ±20%). baseDirection (left/right)
    // flips which way the row drifts on scroll-down. A viewport resize rebuilds
    // the whole unit (rootWidth is remeasured), so this layer doesn't need its
    // own resize listener.
    if (isScrub && scroller && ScrollTrigger) {
      const sweepPx = (rootWidth * scrubTravelPct) / 100
      // Default direction (left) sweeps right→left as you scroll down so it
      // composes with the leftward loop. `right` token flips both ends.
      const startX = baseDirection > 0 ? sweepPx : -sweepPx
      const endX = -startX
      const scrubTween = gsap.fromTo(
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
      cleanups.push(() => {
        ;(scrubTween as { scrollTrigger?: { kill: () => void } }).scrollTrigger?.kill()
        scrubTween.kill()
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

        // Proxy-space speed (px/s) that matches the loop's cruise: the loop
        // advances one cycle (progress 0→1) over `duration`s, and align maps
        // proxy.x → progress at 1/cycleDistance, so cruise ≡ cycleDistance/duration.
        const cruiseVelPxPerS = cycleDistance / duration
        // Per-throw velocity sampling so we can hand the decelerating throw off
        // to the loop the instant it slows to cruise speed (see onThrowUpdate).
        let prevThrowX = 0
        let prevThrowT = 0
        let handedOff = false

        const align = (): void => {
          if (!draggable) return
          loop.progress(wrap(startProgress + (draggable.startX - draggable.x) * ratio))
        }

        const resumeLoop = (): void => {
          // Without autoplay the loop has no cruise to resume — the drag
          // settles and the marquee stays put.
          if (!isPlaying) return
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
            prevThrowT = 0
            handedOff = false
          },
          onDrag: align,
          onThrowUpdate(this: DraggableInstance) {
            align()
            // Blend the throw into the cruise loop: once the decelerating throw
            // slows to the loop's own speed, kill the inertia and resume the
            // loop from here. Because the speeds (and direction — throwDirection
            // is the flick direction) match at the crossover, it continues
            // seamlessly instead of coasting to a stop and then jumping back up
            // to cruise. dt-free-ish: sample proxy.x speed frame to frame.
            if (!isPlaying || handedOff) return
            const now = performance.now()
            const x = this.x
            if (prevThrowT) {
              const dt = (now - prevThrowT) / 1000
              if (dt > 0 && Math.abs(x - prevThrowX) / dt <= cruiseVelPxPerS) {
                handedOff = true
                this.tween?.kill()
                resumeLoop()
                return
              }
            }
            prevThrowX = x
            prevThrowT = now
          },
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
    if (autoplay.hoverPause && !tokens.isDraggable && isPlaying) {
      let pausedByHover = false
      cleanups.push(
        attachHoverPauseListener({
          root,
          onEnter: () => {
            if (loop.paused()) return
            loop.pause()
            pausedByHover = true
          },
          onLeave: () => {
            if (!pausedByHover) return
            pausedByHover = false
            loop.resume()
          },
        }),
      )
    }

    // Optional hover-slow. Same gating as hover-pause (skip on touch + when
    // draggable), and yields to hover-pause when both are set — pausing and
    // slowing on the same pointerover would fight. We tween hoverFactor between
    // 1 and HOVER_SLOW_FACTOR and re-apply via applyTimeScale on every frame so
    // the ramp respects the live direction (switch may flip it mid-hover).
    if (autoplay.hoverSlow && !autoplay.hoverPause && !tokens.isDraggable && isPlaying) {
      const rampTo = (target: number): void => {
        gsap.killTweensOf(hoverFactor)
        gsap.to(hoverFactor, {
          value: target,
          duration: 0.4,
          ease: 'power2.out',
          onUpdate: applyTimeScale,
          onComplete: applyTimeScale,
        })
      }
      cleanups.push(
        attachHoverPauseListener({
          root,
          onEnter: () => rampTo(HOVER_SLOW_FACTOR),
          onLeave: () => rampTo(1),
        }),
      )
      cleanups.push(() => gsap.killTweensOf(hoverFactor))
    }

    // Optional switch: invert direction when body[aa-scroll-direction] flips.
    // Needs a running loop (autoplay) to have a direction to flip, and conflicts
    // with draggable's velocity-driven timeScale, so we skip it in both cases.
    if (tokens.hasSwitch && !tokens.isDraggable && isPlaying) {
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
    const gateDispose = createViewportGate(ctx.gsap, {
      trigger: root,
      onActive: () => {
        if (isPlaying) loop.resume()
        applyTimeScale()
        draggable?.enable()
      },
      onIdle: () => {
        loop.pause()
        draggable?.disable()
      },
    })
    if (gateDispose) cleanups.push(gateDispose)

    return () => {
      for (const fn of cleanups) fn()
      gsap.killTweensOf(timeScale)
      loop.kill()
      if (activeLoop === loop) activeLoop = undefined
      for (const c of clones) c.remove()
      gsap.set(track, { clearProps: 'transform,x' })
      if (isScrub && scroller) {
        gsap.set(scroller, { clearProps: 'transform,x' })
        // Restore whatever inline margin-left the author had (usually empty).
        // We never touch external CSS, so styles applied via classes are
        // unaffected — only our own inline override is reverted.
        scroller.style.marginLeft = originalScrollerMarginLeft
      }
      root.removeAttribute('aa-marquee-direction')
    }
  }

  // buildInner returns undefined when the marquee measures 0×0 — it's hidden
  // (display:none inside a closed modal or a Webflow form-success wrapper) or
  // its content hasn't laid out yet. Don't bail permanently: fall through and
  // let the ResizeObserver below rebuild the moment the list gains width (the
  // modal opens / late images land) — scheduleRebuild already tolerates a
  // never-built start (activeLoop/teardownInner undefined, builtCycle 0). Only
  // give up when there's no ResizeObserver to recover with (SSR / ancient
  // browsers), where the deferred build could never fire.
  let teardownInner = buildInner()
  if (!teardownInner && typeof ResizeObserver === 'undefined') return undefined

  // Lazy images and late web fonts grow the list *after* the first measurement,
  // which would leave the loop wrapping at a stale, too-short distance — the
  // marquee then visibly snaps back mid-list (the seam lands wherever the old
  // wrap point now sits). A ResizeObserver on the list is the right primitive:
  // it fires on every layout-size change (images, fonts, responsive item
  // widths) and never on the loop's transform (which animates the track, not
  // the list's box), so the steady-state animation pays nothing. We debounce so
  // a burst of images loading triggers a single rebuild, guard on a real change
  // so no-op fires are dropped, and preserve the loop's progress fraction so the
  // rebuild is seamless. Viewport resizes also rebuild when scrubbing, because
  // the sweep magnitude is viewport-relative.
  let rebuildTimer: ReturnType<typeof setTimeout> | undefined
  let forceRebuild = false
  const scheduleRebuild = (force: boolean): void => {
    if (force) forceRebuild = true
    if (rebuildTimer) clearTimeout(rebuildTimer)
    rebuildTimer = setTimeout(() => {
      rebuildTimer = undefined
      const doForce = forceRebuild
      forceRebuild = false
      const next = measureCycle()
      if (!next) return
      if (Math.abs(next - builtCycle) < 1 && !doForce) return
      const prevProgress = activeLoop ? activeLoop.progress() : undefined
      teardownInner?.()
      teardownInner = buildInner(prevProgress)
    }, 150)
  }

  const ro =
    typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(() => scheduleRebuild(false))
      : null
  ro?.observe(list)

  // Viewport resize only needs to rebuild when scrubbing (the sweep scales with
  // rootWidth, which usually changes on resize); a pure-loop marquee's cycle is
  // caught by the RO.
  const offResize = isScrub ? ctx.onResize(() => scheduleRebuild(true), 200) : undefined

  return () => {
    if (rebuildTimer) clearTimeout(rebuildTimer)
    ro?.disconnect()
    offResize?.()
    teardownInner?.()
  }
}

// `aa-marquee-scroller` lives on the (optional) scroller child, not the root,
// so the standard root-only readAttrs never sees it. We read the child's own
// per-breakpoint buckets and fold its `aa-marquee-scroller` values into the
// root's buckets, so the scrub travel resolves through the same `|`/suffix
// pipeline (and matchMedia rebuild) as every other responsive attribute.
function mergeScrollerAttrs(root: HTMLElement): ReturnType<typeof readAttrs> {
  const attrs = readAttrs(root)
  const scroller = root.querySelector<HTMLElement>('[aa-marquee-scroller]')
  if (!scroller) return attrs
  const scrollerAttrs = readAttrs(scroller)
  for (const [key, bucket] of scrollerAttrs.buckets) {
    const travel = bucket['aa-marquee-scroller']
    if (travel === undefined) continue
    let target = attrs.buckets.get(key as BucketKey)
    if (!target) {
      target = {}
      attrs.buckets.set(key as BucketKey, target)
    }
    target['aa-marquee-scroller'] = travel
  }
  return attrs
}

const marqueeFeature: FeatureModule = {
  name: 'marquee',
  init(ctx: FeatureContext): () => void {
    bindRootFeature(ctx, 'aa-marquee', setupOne, mergeScrollerAttrs)
    return () => {}
  },
}

export default marqueeFeature
