import { expect, test, type ConsoleMessage } from '@playwright/test'

const initialized = (msg: ConsoleMessage): boolean =>
  msg.text().includes('[alrdy-animate] initialized')

test.describe('slices demo page', () => {
  test('lib initializes with slices feature', async ({ page }) => {
    const messages: string[] = []
    page.on('console', (m) => messages.push(m.text()))

    const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
    await page.goto('/animations/appear/slices/')
    await initLog

    const initLine = messages.find((m) => m.includes('[alrdy-animate] initialized'))
    expect(initLine).toMatch(/Features:.*slices/)
    expect(initLine).toMatch(/Plugins:.*ScrollTrigger/)
  })

  test('panel is appended with the configured row count', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
    await page.goto('/animations/appear/slices/')
    await initLog

    const veil = page.locator('.slices-stage__veil').first()
    const rowCount = await veil.evaluate((el) => {
      const panel = el.querySelector('.aa-slices-panel')
      return panel ? panel.children.length : 0
    })
    expect(rowCount).toBe(6)
  })

  test('slices animate to scale 0 after scroll', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
    await page.goto('/animations/appear/slices/')
    await initLog

    const veil = page.locator('.slices-stage__veil').first()
    await veil.scrollIntoViewIfNeeded()
    await page.waitForTimeout(1500)

    // First demo is `slices` (up direction, scaleY axis). With stagger from
    // 'end', the last slice (bottom) collapses first — read its scaleY.
    const lastSliceScaleY = await veil.evaluate((el) => {
      const slices = el.querySelectorAll('.aa-slice')
      if (slices.length === 0) return null
      const last = slices[slices.length - 1] as HTMLElement
      const matrix = new DOMMatrix(getComputedStyle(last).transform)
      return matrix.d
    })
    expect(lastSliceScaleY).not.toBeNull()
    expect(lastSliceScaleY).toBeLessThan(0.05)
  })

  test('horizontal direction stacks the slice panel as a row', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
    await page.goto('/animations/appear/slices/')
    await initLog

    const veil = page.locator('.slices-stage__veil[aa-animate="slices-left"]').first()
    const flexDirection = await veil.evaluate((el) => {
      const panel = el.querySelector('.aa-slices-panel') as HTMLElement | null
      return panel ? getComputedStyle(panel).flexDirection : null
    })
    expect(flexDirection).toBe('row')
  })
})
