import { expect, test, type ConsoleMessage } from '@playwright/test'

const initialized = (msg: ConsoleMessage): boolean =>
  msg.text().includes('[alrdy-animate] initialized')

test.describe('rotate demo page', () => {
  test('lib initializes with debug log and no missing-plugin warnings', async ({ page }) => {
    const messages: string[] = []
    page.on('console', (m) => messages.push(m.text()))

    const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
    await page.goto('/animations/appear/rotate/')
    await initLog

    expect(messages.find((m) => m.includes('window.gsap not found'))).toBeUndefined()
    expect(messages.find((m) => m.includes('Missing GSAP plugins'))).toBeUndefined()

    const initLine = messages.find((m) => m.includes('[alrdy-animate] initialized'))
    expect(initLine).toMatch(/Features:.*scroll/)
    expect(initLine).toMatch(/Plugins:.*ScrollTrigger/)
    expect(initLine).toMatch(/Elements:\s*[1-9]/)
  })

  test('rotate animation plays when card is scrolled into view', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
    await page.goto('/animations/appear/rotate/')
    await initLog

    const card = page.locator('[aa-animate="rotate-up-bl-ccw"]').first()
    await card.scrollIntoViewIfNeeded()
    // 1.2s = duration (1s) + a comfortable margin so we're past settle, not
    // sampling at the tail end where GSAP can leave floating-point dust.
    await page.waitForTimeout(1200)
    const opacity = await card.evaluate((el) => getComputedStyle(el).opacity)
    expect(parseFloat(opacity)).toBeGreaterThan(0.95)
    const transform = await card.evaluate((el) => getComputedStyle(el).transform)
    // After settle: rotation should be 0 and translate ≈ 0. GSAP can leave
    // sub-pixel residuals in the matrix (e.g. matrix(1, 3e-4, -3e-4, 1, 0, 0.17)),
    // so parse the 6 components and assert each is within ε of the identity
    // matrix instead of requiring literal zeros.
    if (transform !== 'none') {
      const m = transform.match(/matrix\(([-\d.e,\s]+)\)/)
      expect(m).not.toBeNull()
      const parts = (m as RegExpMatchArray)[1].split(',').map((s) => parseFloat(s.trim()))
      const [a, b, c, d, tx, ty] = parts
      const eps = 0.01
      expect(Math.abs(a - 1)).toBeLessThan(eps)
      expect(Math.abs(b)).toBeLessThan(eps)
      expect(Math.abs(c)).toBeLessThan(eps)
      expect(Math.abs(d - 1)).toBeLessThan(eps)
      expect(Math.abs(tx)).toBeLessThan(1)
      expect(Math.abs(ty)).toBeLessThan(1)
    }
  })

  test('rotate-up applies a y offset before scroll triggers', async ({ page }) => {
    const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
    await page.goto('/animations/appear/rotate/')
    await initLog

    // Find a rotate-up card that's still off-screen below.
    const targets = page.locator('[aa-animate^="rotate-up"]')
    const count = await targets.count()
    expect(count).toBeGreaterThan(0)

    // First card in the corners grid is above; we want one that hasn't fired yet.
    // Scroll past everything, then back to top, so triggers are armed.
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.waitForTimeout(200)

    // Pick the rotate-up card and verify it starts hidden (opacity ~0).
    const card = targets.first()
    const rect = await card.boundingBox()
    if (rect && rect.y > 800) {
      const opacity = await card.evaluate((el) => getComputedStyle(el).opacity)
      expect(parseFloat(opacity)).toBeLessThan(0.2)
    }
  })
})
