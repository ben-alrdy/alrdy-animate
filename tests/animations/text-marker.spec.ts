import { expect, test, type ConsoleMessage } from '@playwright/test'

const initialized = (msg: ConsoleMessage): boolean =>
  msg.text().includes('[alrdy-animate] initialized')

test.describe('text-marker demo page', () => {
  test('lib initializes with text feature and SplitText plugin', async ({ page }) => {
    const messages: string[] = []
    page.on('console', (m) => messages.push(m.text()))

    const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
    await page.goto('/animations/text/text-marker/')
    await initLog

    expect(messages.find((m) => m.includes('Missing GSAP plugins'))).toBeUndefined()

    const initLine = messages.find((m) => m.includes('[alrdy-animate] initialized'))
    expect(initLine).toMatch(/Features:.*text/)
    expect(initLine).toMatch(/Plugins:.*ScrollTrigger/)
    expect(initLine).toMatch(/Plugins:.*SplitText/)
  })

  test('bars cover initially, then collapse to scale 0 after scroll', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
    await page.goto('/animations/text/text-marker/')
    await initLog

    const heading = page.locator('h1[aa-animate="text-marker-right"]').first()

    // Bars should be in their initial covering state (scaleX = 1).
    const initialBarScale = await heading.evaluate((el) => {
      const bar = el.querySelector('.aa-bar') as HTMLElement | null
      if (!bar) return null
      const m = new DOMMatrix(getComputedStyle(bar).transform)
      return m.a // scaleX for a non-rotated transform
    })
    expect(initialBarScale).toBeGreaterThan(0.9)

    await heading.scrollIntoViewIfNeeded()
    await page.waitForTimeout(1500)

    const finalBarScale = await heading.evaluate((el) => {
      const bar = el.querySelector('.aa-bar') as HTMLElement | null
      if (!bar) return null
      const m = new DOMMatrix(getComputedStyle(bar).transform)
      return m.a
    })
    expect(finalBarScale).toBeLessThan(0.05)
  })
})
