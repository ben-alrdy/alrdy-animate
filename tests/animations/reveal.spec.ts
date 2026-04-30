import { expect, test, type ConsoleMessage } from '@playwright/test'

const initialized = (msg: ConsoleMessage): boolean =>
  msg.text().includes('[alrdy-animate] initialized')

test.describe('reveal demo page', () => {
  test('lib initializes with reveal feature', async ({ page }) => {
    const messages: string[] = []
    page.on('console', (m) => messages.push(m.text()))

    const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
    await page.goto('/animations/appear/reveal/')
    await initLog

    const initLine = messages.find((m) => m.includes('[alrdy-animate] initialized'))
    expect(initLine).toMatch(/Features:.*reveal/)
    expect(initLine).toMatch(/Plugins:.*ScrollTrigger/)
  })

  test('clip-path animates from inset(100% 0 0 0) to inset(0% 0 0 0)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
    await page.goto('/animations/appear/reveal/')
    await initLog

    const card = page.locator('.demo-image-card').first()
    await card.scrollIntoViewIfNeeded()
    await page.waitForTimeout(1500)

    const clipPath = await card.evaluate((el) => getComputedStyle(el as HTMLElement).clipPath)
    expect(clipPath).toMatch(/inset\(0%/)
  })
})
