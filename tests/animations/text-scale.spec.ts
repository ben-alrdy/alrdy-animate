import { expect, test, type ConsoleMessage } from '@playwright/test'

const initialized = (msg: ConsoleMessage): boolean =>
  msg.text().includes('[alrdy-animate] initialized')

test.describe('text-scale demo page', () => {
  test('lib initializes with text feature and SplitText', async ({ page }) => {
    const messages: string[] = []
    page.on('console', (m) => messages.push(m.text()))

    const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
    await page.goto('/animations/text/text-scale/')
    await initLog

    const initLine = messages.find((m) => m.includes('[alrdy-animate] initialized'))
    expect(initLine).toMatch(/Features:.*text/)
    expect(initLine).toMatch(/Plugins:.*SplitText/)
  })

  for (const variant of ['text-scale', 'text-scale-up', 'text-scale-down'] as const) {
    test(`${variant} characters settle at scaleY 1 after scroll`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 })
      const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
      await page.goto('/animations/text/text-scale/')
      await initLog

      const heading = page.locator(`h1[aa-animate="${variant}"]`).first()
      await heading.scrollIntoViewIfNeeded()
      await page.waitForTimeout(1800)

      const sample = await heading.evaluate((el) => {
        const chars = el.querySelectorAll('.aa-char')
        if (chars.length === 0) return null
        const matrix = new DOMMatrix(getComputedStyle(chars[0] as HTMLElement).transform)
        return { scaleY: matrix.d }
      })
      expect(sample).not.toBeNull()
      expect(sample!.scaleY).toBeGreaterThan(0.95)
      expect(sample!.scaleY).toBeLessThan(1.05)
    })
  }
})
