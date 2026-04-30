import { expect, test, type ConsoleMessage } from '@playwright/test'

const initialized = (msg: ConsoleMessage): boolean =>
  msg.text().includes('[alrdy-animate] initialized')

test.describe('hover-bg-block demo page', () => {
  test('lib initializes with hover feature', async ({ page }) => {
    const messages: string[] = []
    page.on('console', (m) => messages.push(m.text()))

    const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
    await page.goto('/animations/interactive/hover-bg-block/')
    await initLog

    const initLine = messages.find((m) => m.includes('[alrdy-animate] initialized'))
    expect(initLine).toMatch(/Features:.*hover/)
  })

  test('hovering button slides bg from initial offscreen position', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
    await page.goto('/animations/interactive/hover-bg-block/')
    await initLog

    const btn = page.locator('.hover-btn').first()
    const bg = btn.locator('[aa-hover-bg]')

    const before = await bg.evaluate((el) => getComputedStyle(el).transform)
    expect(before).not.toBe('none')

    await btn.hover()
    await page.waitForTimeout(700)
    const after = await bg.evaluate((el) => getComputedStyle(el).transform)
    expect(after).not.toEqual(before)
  })
})
