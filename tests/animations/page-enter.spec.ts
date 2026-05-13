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
  trigger: 'page-enter' | 'load',
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

test.describe('aa-trigger="page-enter"', () => {
  test('animates on every init() cycle (refresh after cold load)', async ({ page }) => {
    const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
    await page.goto('/animations/appear/fade/')
    await initLog

    const samples = await sampleAfterRefresh(page, 'page-enter')

    // First sample at t=0: gsap.from() has set opacity to 0 and started tweening.
    // Last sample at t~810ms: well past the 0.6s duration.
    expect(samples[0]).toBeLessThan(0.5)
    expect(samples[samples.length - 1]).toBeGreaterThan(0.9)
  })

  test('regression: load still fires only on first init (does not replay on refresh)', async ({
    page,
  }) => {
    const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
    await page.goto('/animations/appear/fade/')
    await initLog

    const samples = await sampleAfterRefresh(page, 'load')

    // load on a subsequent init is a no-op: element renders at natural opacity (1)
    // with no tween. Every sample should already be at the to-state.
    for (const value of samples) {
      expect(value).toBeGreaterThan(0.95)
    }
  })

  test('parser accepts page-enter alongside other triggers', async ({ page }) => {
    const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
    await page.goto('/animations/appear/fade/')
    await initLog

    // Build an element with combined triggers and confirm it animates on refresh
    // (page-enter wins on the init cycle; event:foo would wire for later).
    const samples = await page.evaluate(async () => {
      const existing = document.getElementById('trigger-fixture-combo')
      if (existing) existing.remove()
      const el = document.createElement('div')
      el.id = 'trigger-fixture-combo'
      el.style.cssText =
        'position:fixed;top:80px;left:0;width:60px;height:60px;background:#0f0;z-index:9999;'
      el.setAttribute('aa-animate', 'fade')
      el.setAttribute('aa-trigger', 'page-enter event:revealed')
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
