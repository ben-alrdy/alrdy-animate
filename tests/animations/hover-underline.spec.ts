import { expect, test, type ConsoleMessage } from '@playwright/test'

const initialized = (msg: ConsoleMessage): boolean =>
  msg.text().includes('[alrdy-animate] initialized')

test.describe('hover underline page', () => {
  test('lib initializes with hover feature', async ({ page }) => {
    const messages: string[] = []
    page.on('console', (m) => messages.push(m.text()))

    const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
    await page.goto('/animations/hover/underline/')
    await initLog

    const initLine = messages.find((m) => m.includes('[alrdy-animate] initialized'))
    expect(initLine).toMatch(/Features:.*hover/)
  })

  test('underline-in injects one bar that scales on hover', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
    await page.goto('/animations/hover/underline/')
    await initLog

    const link = page.locator('a[aa-hover="underline-in"]').first()
    await link.scrollIntoViewIfNeeded()
    const bar = link.locator('[aa-hover-underline=""]')
    await expect(bar).toHaveCount(1)
    const before = await bar.evaluate((el) => getComputedStyle(el).transform)

    await link.hover()
    await page.waitForTimeout(900)

    const after = await bar.evaluate((el) => getComputedStyle(el).transform)
    expect(after).not.toEqual(before)
    // After settle, scaleX is 1 (identity-like matrix).
    expect(after).toMatch(/matrix\(1, 0, 0, 1, 0, 0\)|none/)
  })

  test('underline (always-on) injects one bar that collapses then re-grows on hover', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
    await page.goto('/animations/hover/underline/')
    await initLog

    const link = page.locator('a[aa-hover="underline"]').first()
    await link.scrollIntoViewIfNeeded()
    const bar = link.locator('[aa-hover-underline=""]')
    await expect(bar).toHaveCount(1)

    // Default state: scaleX 1 (bar always visible) from origin: left center.
    const before = await bar.evaluate((el) => ({
      scaleX: new DOMMatrixReadOnly(getComputedStyle(el).transform).a,
      origin: getComputedStyle(el).transformOrigin,
    }))
    expect(before.scaleX).toBeCloseTo(1, 1)

    // Phase 1 (collapse to right) lands mid-flight ~120ms into the 0.5s sweep.
    await link.hover()
    await page.waitForTimeout(120)
    const mid = await bar.evaluate((el) => ({
      scaleX: new DOMMatrixReadOnly(getComputedStyle(el).transform).a,
      origin: getComputedStyle(el).transformOrigin,
    }))
    expect(mid.scaleX).toBeLessThan(0.95)
    expect(mid.origin).toMatch(/^[\d.]+px /) // origin shifted to right edge (non-zero x)

    // After settle (>= total sweep duration), bar is back at scaleX 1 from left.
    await page.waitForTimeout(800)
    const after = await bar.evaluate((el) => ({
      scaleX: new DOMMatrixReadOnly(getComputedStyle(el).transform).a,
      origin: getComputedStyle(el).transformOrigin,
    }))
    expect(after.scaleX).toBeCloseTo(1, 1)
    expect(after.origin).toMatch(/^0px /)
  })

  test('queue-up interrupt: full IN completes after a quick mouse-leave', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
    await page.goto('/animations/hover/underline/')
    await initLog

    const link = page.locator('a[aa-hover="underline-in"]').first()
    await link.scrollIntoViewIfNeeded()
    const bar = link.locator('[aa-hover-underline=""]')

    // Hover, then immediately leave well before duration (0.45s) elapses.
    await link.hover()
    await page.waitForTimeout(80)
    await page.mouse.move(0, 0)

    // Check mid-flight: IN should still be running (scaleX > 0, < 1) rather than
    // having snapped back. Use a window where IN should be in its second half.
    await page.waitForTimeout(250)
    const midScale = await bar.evaluate((el) => {
      const m = new DOMMatrixReadOnly(getComputedStyle(el).transform)
      return m.a // scaleX in the 2D matrix
    })
    expect(midScale).toBeGreaterThan(0)
    expect(midScale).toBeLessThanOrEqual(1)

    // After full settle (>= 2x duration), bar must be back at scaleX 0.
    await page.waitForTimeout(1100)
    const settled = await bar.evaluate((el) => {
      const m = new DOMMatrixReadOnly(getComputedStyle(el).transform)
      return m.a
    })
    expect(settled).toBeCloseTo(0, 1)
  })
})
