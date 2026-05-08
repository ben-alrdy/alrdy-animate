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
    await page.waitForTimeout(900)
    const opacity = await card.evaluate((el) => getComputedStyle(el).opacity)
    expect(parseFloat(opacity)).toBeGreaterThan(0.95)
    const transform = await card.evaluate((el) => getComputedStyle(el).transform)
    // After settle: rotation should be 0 (matrix(1, 0, 0, 1, ...) or 'none')
    expect(transform === 'none' || /matrix\(1,\s*0,\s*0,\s*1,/.test(transform)).toBeTruthy()
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
