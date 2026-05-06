import { expect, test, type ConsoleMessage } from '@playwright/test'

const initialized = (msg: ConsoleMessage): boolean =>
  msg.text().includes('[alrdy-animate] initialized')

test.describe('text-slide demo page', () => {
  test('lib initializes with text feature and SplitText', async ({ page }) => {
    const messages: string[] = []
    page.on('console', (m) => messages.push(m.text()))

    const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
    await page.goto('/animations/text/text-slide/')
    await initLog

    const initLine = messages.find((m) => m.includes('[alrdy-animate] initialized'))
    expect(initLine).toMatch(/Features:.*text/)
    expect(initLine).toMatch(/Plugins:.*SplitText/)
  })

  test('first slide-up element settles at yPercent 0 after scroll', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
    await page.goto('/animations/text/text-slide/')
    await initLog

    const heading = page.locator('h1[aa-animate="text-slide-up"]').first()
    await heading.scrollIntoViewIfNeeded()
    await page.waitForTimeout(1800)

    const sample = await heading.evaluate((el) => {
      const lines = el.querySelectorAll('.aa-line')
      if (lines.length === 0) return null
      const first = lines[0] as HTMLElement
      // SplitText with mask:lines wraps the line; the moving target is its
      // first child. Inspect both to be safe.
      const inner = (first.firstElementChild as HTMLElement | null) ?? first
      const matrix = new DOMMatrix(getComputedStyle(inner).transform)
      return { y: matrix.f, opacity: parseFloat(getComputedStyle(inner).opacity) }
    })
    expect(sample).not.toBeNull()
    expect(sample!.opacity).toBeGreaterThan(0.95)
    expect(Math.abs(sample!.y)).toBeLessThan(2)
  })
})
