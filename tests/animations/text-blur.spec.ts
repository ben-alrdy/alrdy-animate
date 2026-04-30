import { expect, test, type ConsoleMessage } from '@playwright/test'

const initialized = (msg: ConsoleMessage): boolean =>
  msg.text().includes('[alrdy-animate] initialized')

test.describe('text-blur demo page', () => {
  test('lib initializes with text feature and SplitText plugin', async ({ page }) => {
    const messages: string[] = []
    page.on('console', (m) => messages.push(m.text()))

    const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
    await page.goto('/animations/text/text-blur/')
    await initLog

    expect(messages.find((m) => m.includes('Missing GSAP plugins'))).toBeUndefined()

    const initLine = messages.find((m) => m.includes('[alrdy-animate] initialized'))
    expect(initLine).toMatch(/Features:.*text/)
    expect(initLine).toMatch(/Plugins:.*ScrollTrigger/)
    expect(initLine).toMatch(/Plugins:.*SplitText/)
  })

  test('animation plays — chars become visible after scroll', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
    await page.goto('/animations/text/text-blur/')
    await initLog

    const heading = page.locator('h2.demo-text').last()
    await heading.scrollIntoViewIfNeeded()
    await page.waitForTimeout(1500)

    const visibleParts = await heading.evaluate((el) => {
      const parts = el.querySelectorAll('.aa-char, .aa-word')
      let visible = 0
      parts.forEach((p) => {
        const cs = getComputedStyle(p as HTMLElement)
        if (parseFloat(cs.opacity) > 0.9) visible++
      })
      return { total: parts.length, visible }
    })
    expect(visibleParts.total).toBeGreaterThan(0)
    expect(visibleParts.visible).toBeGreaterThan(0)
  })
})
