import { expect, test, type ConsoleMessage } from '@playwright/test'

const initialized = (msg: ConsoleMessage): boolean =>
  msg.text().includes('[alrdy-animate] initialized')

test.describe('fade-up demo page', () => {
  test('lib initializes with debug log and no missing-plugin warnings', async ({ page }) => {
    const messages: string[] = []
    page.on('console', (m) => messages.push(m.text()))

    const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
    await page.goto('/animations/appear/fade/')
    await initLog

    expect(messages.find((m) => m.includes('window.gsap not found'))).toBeUndefined()
    expect(messages.find((m) => m.includes('Missing GSAP plugins'))).toBeUndefined()

    const initLine = messages.find((m) => m.includes('[alrdy-animate] initialized'))
    expect(initLine).toMatch(/Features:.*scroll/)
    expect(initLine).toMatch(/Plugins:.*ScrollTrigger/)
    expect(initLine).toMatch(/Elements:\s*[1-9]/)
  })

  test('animation plays when card is scrolled into view', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
    await page.goto('/animations/appear/fade/')
    await initLog

    const card = page.locator('.demo-card').last()
    await card.scrollIntoViewIfNeeded()
    await page.waitForTimeout(900)
    const opacity = await card.evaluate((el) => getComputedStyle(el).opacity)
    expect(parseFloat(opacity)).toBeGreaterThan(0.95)
  })

  test('public API surface is attached to window', async ({ page }) => {
    await page.goto('/animations/appear/fade/')
    await page.waitForFunction(() => typeof window.AlrdyAnimate !== 'undefined')
    const surface = await page.evaluate(() => ({
      hasInit: typeof window.AlrdyAnimate.init === 'function',
      hasDestroy: typeof window.AlrdyAnimate.destroy === 'function',
      hasRefresh: typeof window.AlrdyAnimate.refresh === 'function',
      hasOnResize: typeof window.AlrdyAnimate.onResize === 'function',
    }))
    expect(surface).toEqual({ hasInit: true, hasDestroy: true, hasRefresh: true, hasOnResize: true })
  })
})
