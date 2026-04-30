import { expect, test, type ConsoleMessage } from '@playwright/test'

const initialized = (msg: ConsoleMessage): boolean =>
  msg.text().includes('[alrdy-animate] initialized')

test.describe('parallax demo page', () => {
  test('lib initializes with parallax feature', async ({ page }) => {
    const messages: string[] = []
    page.on('console', (m) => messages.push(m.text()))

    const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
    await page.goto('/animations/appear/parallax/')
    await initLog

    const initLine = messages.find((m) => m.includes('[alrdy-animate] initialized'))
    expect(initLine).toMatch(/Features:.*parallax/)
    expect(initLine).toMatch(/Plugins:.*ScrollTrigger/)
  })

  test('card background transform changes as page scrolls', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
    await page.goto('/animations/appear/parallax/')
    await initLog

    const bg = page.locator('.card-bg').first()
    await bg.scrollIntoViewIfNeeded()
    await page.waitForTimeout(400)
    const before = await bg.evaluate((el) => getComputedStyle(el).transform)

    await page.mouse.wheel(0, 600)
    await page.waitForTimeout(1500)

    const after = await bg.evaluate((el) => getComputedStyle(el).transform)
    expect(after).not.toEqual(before)
  })
})
