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
