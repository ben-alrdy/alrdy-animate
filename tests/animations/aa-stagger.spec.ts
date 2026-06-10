import { expect, test, type ConsoleMessage } from '@playwright/test'
import { opacityOf } from '../helpers'

const initialized = (msg: ConsoleMessage): boolean =>
  msg.text().includes('[alrdy-animate] initialized')

test.describe('stagger demo page', () => {
  test('initializes with appear + text features', async ({ page }) => {
    const messages: string[] = []
    page.on('console', (m) => messages.push(m.text()))

    const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
    await page.goto('/animations/utilities/aa-stagger/')
    await initLog

    const initLine = messages.find((m) => m.includes('[alrdy-animate] initialized'))
    expect(initLine).toMatch(/Features:.*appear/)
    expect(initLine).toMatch(/Features:.*text/)
    expect(initLine).toMatch(/Plugins:.*ScrollTrigger/)
    expect(initLine).toMatch(/Plugins:.*SplitText/)
  })

  test('grid demo: cells reveal to opacity 1 after entering view', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
    await page.goto('/animations/utilities/aa-stagger/')
    await initLog

    const gridWrapper = page
      .locator('.sg-grid[aa-stagger="0.08 grid"]')
      .first()
    await gridWrapper.scrollIntoViewIfNeeded()
    await page.waitForTimeout(2000)

    const cellCount = await gridWrapper.locator('.sg-cell').count()
    expect(cellCount).toBe(25)

    const opacities = await gridWrapper.evaluate((el) => {
      const cells = Array.from(el.querySelectorAll('.sg-cell')) as HTMLElement[]
      return cells.map((c) => parseFloat(getComputedStyle(c).opacity))
    })
    // Every cell should have animated to fully visible.
    for (const o of opacities) {
      expect(o).toBeGreaterThan(0.95)
    }
  })

  test('random:5 text demo: chars settle to opacity 1', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
    await page.goto('/animations/utilities/aa-stagger/')
    await initLog

    const heading = page
      .locator('h2.ts-h[aa-stagger="0.02 random:5"]')
      .first()
    await heading.scrollIntoViewIfNeeded()
    // 0.08s × ceil(charCount / 5) batches + 0.4s duration; give it room.
    await page.waitForTimeout(5000)

    const sample = await heading.evaluate((el) => {
      const chars = Array.from(el.querySelectorAll('.aa-char')) as HTMLElement[]
      const opacities = chars.map((c) => parseFloat(getComputedStyle(c).opacity))
      return {
        charCount: chars.length,
        minOpacity: Math.min(...opacities),
      }
    })
    expect(sample.charCount).toBeGreaterThan(20)
    expect(sample.minOpacity).toBeGreaterThan(0.95)
  })

  test('lines-chars + random:4 produces both lines and chars', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
    await page.goto('/animations/utilities/aa-stagger/')
    await initLog

    const heading = page
      .locator('h2.ts-h[aa-split="lines-chars"]')
      .first()
    await heading.scrollIntoViewIfNeeded()

    // Structural split is stable once init runs.
    const { lineCount, charCount } = await heading.evaluate((el) => ({
      lineCount: el.querySelectorAll('.aa-line').length,
      charCount: el.querySelectorAll('.aa-char').length,
    }))
    expect(lineCount).toBeGreaterThanOrEqual(2)
    expect(charCount).toBeGreaterThan(20)

    // The staggered entrance can take a while under load — poll the last char in.
    const lastChar = heading.locator('.aa-char').last()
    await expect.poll(() => opacityOf(lastChar), { timeout: 6000 }).toBeGreaterThan(0.95)
  })
})
