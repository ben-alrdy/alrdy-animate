import { expect, test, type ConsoleMessage } from '@playwright/test'

const initialized = (msg: ConsoleMessage): boolean =>
  msg.text().includes('[alrdy-animate] initialized')

/**
 * Inject a fixture element after first init has resolved, then call
 * `AlrdyAnimate.refresh()` so the lib scans + binds the new element.
 * Returns sampled opacity values across the animation window — first sample
 * should be near the from-state, last sample near the to-state.
 */
async function sampleAfterRefresh(
  page: import('@playwright/test').Page,
  trigger: 'load' | 'load-once',
): Promise<number[]> {
  return page.evaluate(async (triggerValue) => {
    const existing = document.getElementById('trigger-fixture')
    if (existing) existing.remove()
    const el = document.createElement('div')
    el.id = 'trigger-fixture'
    el.style.cssText =
      'position:fixed;top:0;left:0;width:60px;height:60px;background:#f00;z-index:9999;'
    el.setAttribute('aa-animate', 'fade')
    el.setAttribute('aa-trigger', triggerValue)
    el.setAttribute('aa-duration', '0.6')
    document.body.appendChild(el)

    await window.AlrdyAnimate.refresh()

    return new Promise<number[]>((resolve) => {
      const target = document.getElementById('trigger-fixture')!
      const opacities: number[] = []
      let i = 0
      const tick = (): void => {
        opacities.push(parseFloat(getComputedStyle(target).opacity))
        i++
        if (i < 10) setTimeout(tick, 90)
        else resolve(opacities)
      }
      tick()
    })
  }, trigger)
}

test.describe('aa-trigger="load"', () => {
  test('animates on every init() cycle (refresh after cold load)', async ({ page }) => {
    const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
    await page.goto('/animations/appear/fade/')
    await initLog

    const samples = await sampleAfterRefresh(page, 'load')

    // First sample at t=0: gsap.from() has set opacity to 0 and started tweening.
    // Last sample at t~810ms: well past the 0.6s duration.
    expect(samples[0]).toBeLessThan(0.5)
    expect(samples[samples.length - 1]).toBeGreaterThan(0.9)
  })

  test('regression: load-once still fires only on first init (does not replay on refresh)', async ({
    page,
  }) => {
    const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
    await page.goto('/animations/appear/fade/')
    await initLog

    const samples = await sampleAfterRefresh(page, 'load-once')

    // load-once on a subsequent init is a no-op: element renders at natural
    // opacity (1) with no tween. Every sample should already be at the
    // to-state.
    for (const value of samples) {
      expect(value).toBeGreaterThan(0.95)
    }
  })

  test('regression: load entrance is paint-gated — no pre-paint progress', async ({ page }) => {
    const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
    await page.goto('/animations/appear/fade/')
    await initLog

    const result = await page.evaluate(async () => {
      const existing = document.getElementById('trigger-fixture-gate')
      if (existing) existing.remove()
      const el = document.createElement('div')
      el.id = 'trigger-fixture-gate'
      el.style.cssText =
        'position:fixed;top:160px;left:0;width:60px;height:60px;background:#00f;z-index:9999;'
      el.setAttribute('aa-animate', 'fade')
      el.setAttribute('aa-trigger', 'load')
      el.setAttribute('aa-duration', '0.6')
      document.body.appendChild(el)

      await window.AlrdyAnimate.refresh()

      // Read synchronously in the SAME task that `refresh()` resolved on —
      // before any rAF/timeout fires. The tween is built `paused` and the gate
      // hasn't flushed yet (it's scheduled via double-rAF), so a paint-gated
      // entrance MUST still be at the from-state. A non-zero value here is the
      // original bug: the wall-clock tween advanced before first paint.
      const target = document.getElementById('trigger-fixture-gate')!
      const atReady = parseFloat(getComputedStyle(target).opacity)

      const samples = await new Promise<number[]>((resolve) => {
        const opacities: number[] = []
        let i = 0
        const tick = (): void => {
          opacities.push(parseFloat(getComputedStyle(target).opacity))
          i++
          if (i < 10) setTimeout(tick, 90)
          else resolve(opacities)
        }
        tick()
      })

      return { atReady, samples }
    })

    // Paused at the from-state right after ready(), no clock advance.
    expect(result.atReady).toBeLessThan(0.05)
    // Then the gate releases on paint and the animation actually runs.
    expect(result.samples[result.samples.length - 1]).toBeGreaterThan(0.9)
  })

  test('regression: aa-fallback skips the load tween (no competing rewind)', async ({ page }) => {
    const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
    await page.goto('/animations/appear/fade/')
    await initLog

    const samples = await page.evaluate(async () => {
      const existing = document.getElementById('trigger-fixture-fallback')
      if (existing) existing.remove()
      // Simulate the slow-network inline snippet having fired its 1s CSS
      // fallback before the lib re-init. The lib must detect aa-fallback and
      // build NO load tween — otherwise it would rewind the element to opacity
      // 0 and flash.
      document.documentElement.setAttribute('aa-fallback', '')
      const el = document.createElement('div')
      el.id = 'trigger-fixture-fallback'
      el.style.cssText =
        'position:fixed;top:240px;left:0;width:60px;height:60px;background:#ff0;z-index:9999;'
      el.setAttribute('aa-animate', 'fade')
      el.setAttribute('aa-trigger', 'load')
      el.setAttribute('aa-duration', '0.6')
      document.body.appendChild(el)

      await window.AlrdyAnimate.refresh()

      return new Promise<number[]>((resolve) => {
        const target = document.getElementById('trigger-fixture-fallback')!
        const opacities: number[] = []
        let i = 0
        const tick = (): void => {
          opacities.push(parseFloat(getComputedStyle(target).opacity))
          i++
          if (i < 10) setTimeout(tick, 90)
          else resolve(opacities)
        }
        tick()
      })
    })

    // No lib tween was built, so the element is never rewound to the from-state
    // — it stays at its natural opacity throughout.
    for (const value of samples) {
      expect(value).toBeGreaterThan(0.95)
    }
  })

  test('regression: aa-fallback skip on split text survives a post-init resplit (no replay flash)', async ({
    page,
  }) => {
    // The plain-fade fallback test above can't catch this: appear elements never
    // resplit. Split text does — SplitText's autoSplit fires a resize-driven
    // resplit AFTER init() clears aa-fallback, and pre-fix that rebuild rebuilt +
    // restarted the entrance, hiding the already-revealed lines (the "shows
    // fallback, then hides, then runs GSAP" flash). Needs a page with SplitText.
    const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
    await page.goto('/animations/text/text-blur/')
    await initLog

    const result = await page.evaluate(async () => {
      const id = 'fixture-fallback-resplit'
      document.getElementById(id)?.remove()

      // Slow-network snippet fired its CSS fallback before this init cycle: the
      // heading is already visible.
      document.documentElement.setAttribute('aa-fallback', '')

      const el = document.createElement('h2')
      el.id = id
      el.style.cssText =
        'position:fixed;top:300px;left:0;width:320px;font-size:28px;line-height:1.2;z-index:9999;'
      el.setAttribute('aa-animate', 'text-fade')
      el.setAttribute('aa-split', 'lines')
      el.setAttribute('aa-trigger', 'load')
      el.setAttribute('aa-duration', '0.6')
      el.textContent =
        'This heading is long enough to wrap onto several lines so a width change forces a SplitText resplit'
      document.body.appendChild(el)

      await window.AlrdyAnimate.refresh()

      // refresh()/init() has now cleared aa-fallback. Narrow the box so the text
      // re-wraps and the autoSplit ResizeObserver re-splits — the post-init
      // rebuild that, pre-fix, rebuilt + restarted the entrance and rewound the
      // lines to opacity 0. Sample finely (the replay dip is brief — a coarse
      // poll misses it) and track the minimum line opacity seen, plus whether a
      // resplit actually happened (so the test can't silently pass on a no-op).
      el.style.width = '150px'
      let firstLine = el.querySelector('.aa-line')
      let resplit = false
      let minLineOp = 1

      await new Promise<void>((resolve) => {
        let i = 0
        const tick = (): void => {
          const lines = el.querySelectorAll<HTMLElement>('.aa-line')
          const fl = el.querySelector('.aa-line')
          if (fl && fl !== firstLine) { resplit = true; firstLine = fl }
          if (lines.length) {
            const m = Math.min(...[...lines].map((l) => parseFloat(getComputedStyle(l).opacity)))
            if (m < minLineOp) minLineOp = m
          }
          i++
          if (i < 60) setTimeout(tick, 16)
          else resolve()
        }
        tick()
      })

      return { resplit, minLineOp }
    })

    // The resplit must actually fire (else the test proves nothing)…
    expect(result.resplit).toBe(true)
    // …and the CSS fallback's already-revealed lines must never be rewound to the
    // from-state and replayed. Pre-fix this dipped to ~0.
    expect(result.minLineOp).toBeGreaterThan(0.9)
  })

  test('parser accepts load alongside other triggers', async ({ page }) => {
    const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
    await page.goto('/animations/appear/fade/')
    await initLog

    // Build an element with combined triggers and confirm it animates on refresh
    // (load wins on the init cycle; event:foo would wire for later).
    const samples = await page.evaluate(async () => {
      const existing = document.getElementById('trigger-fixture-combo')
      if (existing) existing.remove()
      const el = document.createElement('div')
      el.id = 'trigger-fixture-combo'
      el.style.cssText =
        'position:fixed;top:80px;left:0;width:60px;height:60px;background:#0f0;z-index:9999;'
      el.setAttribute('aa-animate', 'fade')
      el.setAttribute('aa-trigger', 'load event:revealed')
      el.setAttribute('aa-duration', '0.6')
      document.body.appendChild(el)

      await window.AlrdyAnimate.refresh()

      return new Promise<number[]>((resolve) => {
        const target = document.getElementById('trigger-fixture-combo')!
        const opacities: number[] = []
        let i = 0
        const tick = (): void => {
          opacities.push(parseFloat(getComputedStyle(target).opacity))
          i++
          if (i < 10) setTimeout(tick, 90)
          else resolve(opacities)
        }
        tick()
      })
    })

    expect(samples[0]).toBeLessThan(0.5)
    expect(samples[samples.length - 1]).toBeGreaterThan(0.9)
  })
})
