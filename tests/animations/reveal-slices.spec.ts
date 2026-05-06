import { expect, test, type ConsoleMessage } from '@playwright/test'

const initialized = (msg: ConsoleMessage): boolean =>
  msg.text().includes('[alrdy-animate] initialized')

test.describe('reveal-slices demo page', () => {
  test('lib initializes with reveal feature', async ({ page }) => {
    const messages: string[] = []
    page.on('console', (m) => messages.push(m.text()))

    const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
    await page.goto('/animations/appear/reveal-slices/')
    await initLog

    const initLine = messages.find((m) => m.includes('[alrdy-animate] initialized'))
    expect(initLine).toMatch(/Features:.*reveal/)
    expect(initLine).toMatch(/Plugins:.*ScrollTrigger/)
  })

  test('panel is appended with the configured row count', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
    await page.goto('/animations/appear/reveal-slices/')
    await initLog

    const card = page.locator('.demo-image-card').first()
    const rowCount = await card.evaluate((el) => {
      const panel = el.querySelector('.aa-slices-panel')
      return panel ? panel.children.length : 0
    })
    expect(rowCount).toBe(6)
  })

  test('slices animate to scaleY 0 after scroll', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
    await page.goto('/animations/appear/reveal-slices/')
    await initLog

    const card = page.locator('.demo-image-card').first()
    await card.scrollIntoViewIfNeeded()
    await page.waitForTimeout(1500)

    const lastSliceScaleY = await card.evaluate((el) => {
      const slices = el.querySelectorAll('.aa-slice')
      if (slices.length === 0) return null
      const last = slices[slices.length - 1] as HTMLElement
      const matrix = new DOMMatrix(getComputedStyle(last).transform)
      return matrix.d
    })
    expect(lastSliceScaleY).not.toBeNull()
    expect(lastSliceScaleY).toBeLessThan(0.05)
  })
})
