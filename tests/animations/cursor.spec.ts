import { expect, test, type ConsoleMessage } from '@playwright/test'

const initialized = (msg: ConsoleMessage): boolean =>
  msg.text().includes('[alrdy-animate] initialized')

test.describe('hover cursor page', () => {
  test('lib initializes with cursor feature', async ({ page }) => {
    const messages: string[] = []
    page.on('console', (m) => messages.push(m.text()))

    const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
    await page.goto('/animations/hover/cursor/')
    await initLog

    const initLine = messages.find((m) => m.includes('[alrdy-animate] initialized'))
    expect(initLine).toMatch(/Features:.*cursor/)
  })

  test('cursor element starts hidden, shows on trigger hover, hides on leave', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
    await page.goto('/animations/hover/cursor/')
    await initLog

    const cursor = page.locator('[aa-cursor]').first()
    await expect(cursor).toHaveCount(1)

    // Park the mouse off any trigger so the cursor settles hidden after init.
    await page.mouse.move(0, 0)
    await page.waitForTimeout(500)
    const startOpacity = await cursor.evaluate((el) => parseFloat(getComputedStyle(el).opacity))
    expect(startOpacity).toBeLessThan(0.2)

    const firstTrigger = page.locator('[aa-cursor-trigger]').first()
    await firstTrigger.scrollIntoViewIfNeeded()
    const expectedTitle = await firstTrigger.getAttribute('aa-cursor-title')
    const expectedText = await firstTrigger.getAttribute('aa-cursor-text')

    await firstTrigger.hover()
    await page.waitForTimeout(500)

    const hoverOpacity = await cursor.evaluate((el) => parseFloat(getComputedStyle(el).opacity))
    expect(hoverOpacity).toBeGreaterThan(0.5)

    const titleText = await cursor.locator('[aa-cursor-title]').textContent()
    const textText = await cursor.locator('[aa-cursor-text]').textContent()
    expect(titleText).toBe(expectedTitle)
    expect(textText).toBe(expectedText)

    await page.mouse.move(0, 0)
    await page.waitForTimeout(700)
    const endOpacity = await cursor.evaluate((el) => parseFloat(getComputedStyle(el).opacity))
    expect(endOpacity).toBeLessThan(0.2)
  })
})
