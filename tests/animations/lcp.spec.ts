import { expect, test, type ConsoleMessage } from '@playwright/test'

const initialized = (msg: ConsoleMessage): boolean =>
  msg.text().includes('[alrdy-animate] initialized')

// aa-trigger="lcp" lives on the aa-trigger utility page (the "Optimizing LCP"
// section renders a Demo with a fade-lcp and a rotate-up-lcp box).
const PAGE = '/animations/utilities/aa-trigger/'

test.describe('aa-trigger="lcp"', () => {
  test('lcp elements opt out of the visibility guard and settle at full opacity', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
    await page.goto(PAGE)
    await initLog

    // The load gate releases the entrance one frame after the reveal; give the
    // 0.6s fade room to finish.
    await page.waitForTimeout(1200)

    for (const sel of ['.lcp-demo__fade', '.lcp-demo__rotate']) {
      const box = page.locator(sel).first()
      // never hidden by the FOUC guard — it's painted on purpose
      const visibility = await box.evaluate((el) => getComputedStyle(el).visibility)
      expect(visibility).toBe('visible')
      // the gsap.set(opacity:1) destination fix: the fade must land on 1, NOT be
      // stuck at the 0.01 CSS floor (which would happen if .from() mistook the
      // floor for its destination).
      const opacity = await box.evaluate((el) => getComputedStyle(el).opacity)
      expect(parseFloat(opacity)).toBeGreaterThan(0.95)
    }
  })

  test('the 0.01 floor requires aa-animate — a bare aa-trigger="lcp" is never stranded invisible', async ({
    page,
  }) => {
    const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
    await page.goto(PAGE)
    await initLog

    // Pure CSS-level check (no init/scan needed): the floor only applies with
    // aa-animate, so a bare aa-trigger="lcp" (which would never receive aa-ready)
    // renders at full opacity instead of being stuck near-invisible at 0.01.
    const result = await page.evaluate(() => {
      const bare = document.createElement('div')
      bare.setAttribute('aa-trigger', 'lcp') // no aa-animate, no aa-ready
      const animated = document.createElement('div')
      animated.setAttribute('aa-animate', 'fade')
      animated.setAttribute('aa-trigger', 'lcp') // no aa-ready → floor active
      document.body.append(bare, animated)
      const r = {
        bare: getComputedStyle(bare).opacity,
        animatedFloor: getComputedStyle(animated).opacity,
      }
      bare.remove()
      animated.remove()
      return r
    })
    expect(parseFloat(result.bare)).toBe(1) // not stranded at 0.01
    expect(parseFloat(result.animatedFloor)).toBeCloseTo(0.01, 3) // floor still works with aa-animate
  })

  test('a rotate-up lcp element clears its tilt (transforms resolve from natural CSS)', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
    await page.goto(PAGE)
    await initLog
    await page.waitForTimeout(1200)

    const box = page.locator('.lcp-demo__rotate').first()
    // After the entrance settles, no residual rotation — matrix is (near) identity.
    const transform = await box.evaluate((el) => getComputedStyle(el).transform)
    expect(transform === 'none' || /matrix\(1, 0, 0, 1/.test(transform)).toBeTruthy()
  })
})
